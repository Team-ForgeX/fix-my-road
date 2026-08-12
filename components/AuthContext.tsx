"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { reports as seedReports } from "../lib/mockData";
import {
  submitReportToSupabase,
  executeAdminAction,
  fetchUserProfile,
  createCitizenProfile,
  updateIdentityVerification
} from "../lib/supabaseService";
import { supabase } from "../lib/supabaseClient";
import type { MediaType, Report } from "../types/report";
import type { UserProfile } from "../types/user";

type AuthUser = UserProfile & {
  email: string;
  verified: boolean;
};

type LocationPayload = {
  address: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  adminMode: boolean;
  ready: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsVerification?: boolean; user?: AuthUser }>;
  signup: (payload: {
    full_name: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<{ success: boolean; error?: string }>;
  verifyIdentity: (otp: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  adminLogout: () => Promise<void>;
  reports: Report[];
  saveReport: (payload: {
    title: string;
    description: string;
    mediaFiles: File[];
    location: LocationPayload;
  }) => Promise<{ success: boolean; error?: string }>;
  updateReportStatus: (reportId: string, status: Report["status"]) => void;
  allReports: Report[];
  notifications: string[];
};

const STORAGE_KEYS = {
  REPORTS: "fixmyroad_reports"
};

const pickSeverity = (text: string) => {
  const normalized = text.toLowerCase();
  if (normalized.includes("pothole") || normalized.includes("garbage") || normalized.includes("leak") || normalized.includes("flood")) {
    return "high" as const;
  }
  if (normalized.includes("streetlight") || normalized.includes("traffic") || normalized.includes("drainage")) {
    return "medium" as const;
  }
  return "low" as const;
};

const createMediaItems = async (files: File[], reportId: string) => {
  const results = await Promise.all(
    files.map(async (file) => {
      const type: MediaType = file.type.startsWith("image") ? "image" : "video";
      let thumbnail_url = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80";
      if (type === "image") {
        thumbnail_url = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => resolve(thumbnail_url);
          reader.readAsDataURL(file);
        });
      }

      return {
        id: `${Date.now()}-${file.name}`,
        report_id: reportId,
        media_type: type,
        file_name: file.name,
        thumbnail_url,
        size: file.size,
        created_at: new Date().toISOString()
      };
    })
  );

  return results;
};

const readJson = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = <T,>(key: string, value: T) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const initialReports = (): Report[] => {
  const persisted = readJson<Report[]>(STORAGE_KEYS.REPORTS, []);
  return persisted.length > 0 ? persisted : seedReports;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function buildAuthUser(profile: UserProfile, email: string): AuthUser {
  return {
    ...profile,
    email,
    verified: Boolean(profile.identity_verified)
  };
}

async function loadProfile(userId: string, email: string) {
  const profileResult = await fetchUserProfile(userId);
  if (profileResult.error || !profileResult.data) {
    return { success: false, error: profileResult.error?.message ?? "Profile not found." };
  }
  return { success: true, user: buildAuthUser(profileResult.data, email) };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const syncSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;
      if (error) {
        console.warn("Supabase session error:", error.message);
        setUser(null);
        setReady(true);
        return;
      }

      const sessionUser = data?.session?.user;
      if (!sessionUser?.id) {
        setUser(null);
        setReady(true);
        return;
      }

      const profileResult = await loadProfile(sessionUser.id, sessionUser.email ?? "");
      if (!mounted) return;
      if (!profileResult.success || !profileResult.user) {
        console.warn(profileResult.error);
        setUser(null);
      } else {
        setUser(profileResult.user);
      }
      setReady(true);
    };

    syncSession();
    setReports(initialReports());

    const subscription = supabase.auth.onAuthStateChange(async (_, session) => {
      if (!mounted) return;
      const sessionUser = session?.user;
      if (!sessionUser?.id) {
        setUser(null);
        setReady(true);
        return;
      }
      const profileResult = await loadProfile(sessionUser.id, sessionUser.email ?? "");
      if (!mounted) return;
      if (!profileResult.success || !profileResult.user) {
        console.warn(profileResult.error);
        setUser(null);
      } else {
        setUser(profileResult.user);
      }
      setReady(true);
    });

    return () => {
      mounted = false;
      subscription.data.subscription.unsubscribe();
    };
  }, []);

  const saveReports = (nextReports: Report[]) => {
    setReports(nextReports);
    writeJson(STORAGE_KEYS.REPORTS, nextReports);
  };

  const login = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const result = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password
    });

    if (result.error || !result.data?.user) {
      return { success: false, error: result.error?.message ?? "Unable to sign in." };
    }

    const profileResult = await loadProfile(result.data.user.id, result.data.user.email ?? normalizedEmail);
    if (!profileResult.success || !profileResult.user) {
      await supabase.auth.signOut();
      return { success: false, error: profileResult.error ?? "Profile not found." };
    }

    setUser(profileResult.user);
    return {
      success: true,
      needsVerification: !profileResult.user.verified,
      user: profileResult.user
    };
  };

  const signup = async ({ full_name, email, phone, password }: { full_name: string; email: string; phone: string; password: string }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const signUpResult = await supabase.auth.signUp({
      email: normalizedEmail,
      password
    });

    if (signUpResult.error || !signUpResult.data?.user) {
      return { success: false, error: signUpResult.error?.message ?? "Unable to create account." };
    }

    const profileResult = await createCitizenProfile({
      id: signUpResult.data.user.id,
      full_name: full_name.trim(),
      phone: phone.trim() || null,
      avatar_url: `https://avatars.dicebear.com/api/identicon/${encodeURIComponent(full_name.trim())}.svg`
    });

    if (profileResult.error || !profileResult.data) {
      await supabase.auth.signOut();
      return { success: false, error: profileResult.error?.message ?? "Unable to create profile." };
    }

    setUser(buildAuthUser(profileResult.data, normalizedEmail));
    return { success: true };
  };

  const verifyIdentity = async (otp: string) => {
    if (!user) {
      return { success: false, error: "No active user session found." };
    }
    if (otp.trim() !== "123456") {
      return { success: false, error: "The verification code is invalid. Use 123456 for the mock flow." };
    }

    const result = await updateIdentityVerification(user.id);
    if (result.error || !result.data) {
      return { success: false, error: result.error?.message ?? "Unable to verify identity." };
    }

    setUser(buildAuthUser(result.data, user.email));
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const adminLogin = async (email: string, password: string) => {
    const result = await login(email, password);
    if (!result.success) {
      return result;
    }
    if (!result.user || result.user.role !== "admin") {
      await logout();
      return { success: false, error: "Admin access required." };
    }
    return { success: true };
  };

  const adminLogout = async () => {
    await logout();
  };

  const saveReport = async ({ title, description, mediaFiles, location }: { title: string; description: string; mediaFiles: File[]; location: LocationPayload }) => {
    if (!user) {
      return { success: false, error: "Sign in before submitting a report." };
    }
    if (!user.verified) {
      return { success: false, error: "Complete identity verification before submitting reports." };
    }

    submitReportToSupabase({
      userId: user.id,
      title,
      description: description.trim(),
      latitude: 28.6139 + Math.random() * 0.01,
      longitude: 77.2090 + Math.random() * 0.01,
      address: location.address,
      landmark: location.landmark,
      city: location.city,
      pincode: location.pincode,
      mediaFiles
    }).catch((err) => console.warn("Supabase background save fallback:", err));

    const id = `R${Date.now()}`;
    const thumbnailEntries = await createMediaItems(mediaFiles, id);
    const report: Report = {
      id,
      user_id: user.id,
      incident_id: undefined,
      title: title.trim() || description.trim().slice(0, 45),
      description: description.trim(),
      latitude: 28.6139 + Math.random() * 0.01,
      longitude: 77.2090 + Math.random() * 0.01,
      address: location.address,
      landmark: location.landmark,
      locality: location.city || location.pincode || "Unknown",
      city: location.city,
      created_at: new Date().toISOString(),
      processing_state: "submitted",
      status: "open",
      severity: pickSeverity(description),
      report_count: 1,
      is_duplicate: false,
      media: thumbnailEntries
    };
    const nextReports = [report, ...reports];
    saveReports(nextReports);
    return { success: true };
  };

  const updateReportStatus = (reportId: string, status: Report["status"]) => {
    executeAdminAction({
      incidentId: reportId,
      adminId: user?.id || "admin-1",
      newStatus: status
    }).catch((err) => console.warn("Supabase admin action fallback:", err));

    const nextReports = reports.map((report) => {
      if (report.id !== reportId) return report;
      const nextProcessing = status === "resolved" ? "resolved" : status === "in_progress" ? "assigned" : report.processing_state;
      return { ...report, status, processing_state: nextProcessing };
    });
    saveReports(nextReports);
  };

  const adminMode = useMemo(() => user?.role === "admin", [user]);

  const notifications = useMemo(() => {
    if (adminMode) {
      return reports
        .filter((report) => report.status === "open")
        .slice(0, 4)
        .map((report) => `Open issue ${report.id} near ${report.address} needs admin review.`);
    }
    if (user) {
      return reports
        .filter((report) => report.user_id === user.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 4)
        .map((report) => `Your report ${report.id} is now ${report.status.replace("_", " ")}.`);
    }
    return [];
  }, [adminMode, reports, user]);

  const allReports = reports;

  const value: AuthContextValue = {
    user,
    adminMode,
    ready,
    login,
    signup,
    verifyIdentity,
    logout,
    adminLogin,
    adminLogout,
    reports,
    saveReport,
    updateReportStatus,
    allReports,
    notifications
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}

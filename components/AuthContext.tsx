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

export type AppNotification = {
  id: string;
  type: "report_submitted" | "report_updated" | "report_resolved" | "new_report_alert" | "system";
  title: string;
  message: string;
  priority: "low" | "medium" | "high";
  reportId?: string;
  timestamp: string;
  read: boolean;
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
    isAdmin?: boolean;
    adminCode?: string;
  }) => Promise<{ success: boolean; error?: string; needsEmailVerification?: boolean; message?: string }>;
  verifyIdentity: (otp: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  adminLogin: (email: string, password: string, adminCode: string) => Promise<{ success: boolean; error?: string }>;
  elevateToAdmin: (adminCode: string) => Promise<{ success: boolean; error?: string }>;
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
  notifications: AppNotification[];
  unreadNotificationCount: number;
  markNotificationAsRead: (notificationId: string) => void;
  clearNotification: (notificationId: string) => void;
};

const STORAGE_KEYS = {
  REPORTS: "fixmyroad_reports",
  NOTIFICATIONS: "fixmyroad_notifications"
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

const initialNotifications = (): AppNotification[] => {
  return readJson<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
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
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
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
    setNotifications(initialNotifications());

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

  const saveNotifications = (nextNotifications: AppNotification[]) => {
    setNotifications(nextNotifications);
    writeJson(STORAGE_KEYS.NOTIFICATIONS, nextNotifications);
  };

  const login = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail, password })
    });

    const data = await response.json();

    if (!response.ok || !data?.success || !data?.user) {
      return { success: false, error: data?.error ?? "Unable to sign in." };
    }

    const profileUser = data.user as AuthUser;
    setUser(profileUser);
    return {
      success: true,
      needsVerification: !profileUser.verified,
      user: profileUser
    };
  };

  const elevateUserToAdmin = async (userId: string, email: string, adminCode: string) => {
    if (!adminCode.trim()) {
      return { success: false, error: "Admin access code is required." };
    }

    const response = await fetch("/api/admin/elevate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: adminCode.trim() })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      return { success: false, error: data.error ?? "Unable to verify admin code." };
    }

    const refreshed = await loadProfile(userId, email);
    if (!refreshed.success || !refreshed.user) {
      return { success: false, error: refreshed.error ?? "Unable to refresh profile." };
    }

    setUser(refreshed.user);
    return { success: true };
  };

  const elevateToAdmin = async (adminCode: string) => {
    if (!user) {
      return { success: false, error: "You must be signed in to elevate account privileges." };
    }
    return elevateUserToAdmin(user.id, user.email, adminCode);
  };

  const signup = async ({
    full_name,
    email,
    phone,
    password,
    isAdmin = false,
    adminCode = ""
  }: {
    full_name: string;
    email: string;
    phone: string;
    password: string;
    isAdmin?: boolean;
    adminCode?: string;
  }) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (isAdmin) {
      if (!adminCode.trim()) {
        return { success: false, error: "Admin access code is required to create an admin account." };
      }

      const response = await fetch("/api/admin/elevate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: adminCode.trim() })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        return { success: false, error: data.error ?? "Invalid admin access code." };
      }
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "fixmyroad_pending_signup",
        JSON.stringify({
          full_name: full_name.trim(),
          email: normalizedEmail,
          phone: phone.trim(),
          password,
          role: isAdmin ? "admin" : "citizen"
        })
      );
    }

    const signupResponse = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: full_name.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        password,
        role: isAdmin ? "admin" : "citizen"
      })
    });

    const signupData = await signupResponse.json();

    if (!signupResponse.ok || !signupData?.success || !signupData?.user) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("fixmyroad_pending_signup");
      }
      return { success: false, error: signupData?.error ?? "Unable to create account." };
    }

    const nextUser = signupData.user as AuthUser;
    setUser(nextUser);
    return {
      success: true,
      needsEmailVerification: true,
      message: signupData.message ?? "Please verify your email to complete signup."
    };
  };

  // Legacy mock identity verification is intentionally disabled.
  // Email verification is the only required verification step before inserting user data.
  const verifyIdentity = async (otp: string) => {
    if (!user) {
      return { success: false, error: "No active user session found." };
    }
    return { success: false, error: "Email verification is required before profile creation. This legacy identity check is disabled." };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const adminLogin = async (email: string, password: string, adminCode: string) => {
    // First verify the admin code
    if (!adminCode.trim()) {
      return { success: false, error: "Admin access code is required." };
    }

    const response = await fetch("/api/admin/elevate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: adminCode.trim() })
    });

    const codeVerification = await response.json();
    if (!response.ok || !codeVerification.success) {
      return { success: false, error: codeVerification.error ?? "Invalid admin access code." };
    }

    // Then attempt login
    const result = await login(email, password);
    if (!result.success) {
      return result;
    }
    if (!result.user || result.user.role !== "admin") {
      await logout();
      return { success: false, error: "Admin access required. This account does not have admin privileges." };
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

    // Create notification for citizen
    const clientNotification: AppNotification = {
      id: `N${Date.now()}`,
      type: "report_submitted",
      title: "Report Submitted",
      message: `Your report "${report.title}" has been submitted and is awaiting verification.`,
      priority: "medium",
      reportId: report.id,
      timestamp: new Date().toISOString(),
      read: false
    };

    // Create notification for admin
    const adminNotification: AppNotification = {
      id: `N${Date.now() + 1}`,
      type: "new_report_alert",
      title: "New Report Alert",
      message: `New ${report.severity} severity report: "${report.title}" in ${report.address}`,
      priority: report.severity === "high" ? "high" : "medium",
      reportId: report.id,
      timestamp: new Date().toISOString(),
      read: false
    };

    const nextReports = [report, ...reports];
    const nextNotifications = [clientNotification, adminNotification, ...notifications];

    saveReports(nextReports);
    saveNotifications(nextNotifications);
    
    return { success: true };
  };

  const updateReportStatus = (reportId: string, status: Report["status"]) => {
    executeAdminAction({
      incidentId: reportId,
      adminId: user?.id || "admin-1",
      newStatus: status
    }).catch((err) => console.warn("Supabase admin action fallback:", err));

    const report = reports.find((r) => r.id === reportId);
    const nextReports = reports.map((r) => {
      if (r.id !== reportId) return r;
      const nextProcessing = status === "resolved" ? "resolved" : status === "in_progress" ? "assigned" : r.processing_state;
      return { ...r, status, processing_state: nextProcessing };
    });
    saveReports(nextReports);

    // Create notification for the report owner
    if (report) {
      const stageText = status === "in_progress" ? "In Progress" : status === "resolved" ? "Resolved" : "Open";
      const notification: AppNotification = {
        id: `N${Date.now()}`,
        type: status === "resolved" ? "report_resolved" : "report_updated",
        title: status === "resolved" ? "Report Resolved" : "Report Update",
        message: `Your report "${report.title}" has been updated to: ${stageText}`,
        priority: status === "resolved" ? "high" : "medium",
        reportId: reportId,
        timestamp: new Date().toISOString(),
        read: false
      };
      const nextNotifications = [notification, ...notifications];
      saveNotifications(nextNotifications);
    }
  };

  const markNotificationAsRead = (notificationId: string) => {
    const nextNotifications = notifications.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    saveNotifications(nextNotifications);
  };

  const clearNotification = (notificationId: string) => {
    const nextNotifications = notifications.filter((n) => n.id !== notificationId);
    saveNotifications(nextNotifications);
  };

  const adminMode = useMemo(() => user?.role === "admin", [user]);

  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    if (adminMode) {
      // Admin sees new report alerts and system messages
      return notifications
        .filter((n) => ["new_report_alert", "system"].includes(n.type))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    if (user) {
      // Client sees notifications about their own reports
      const userReportIds = reports.filter((r) => r.user_id === user.id).map((r) => r.id);
      return notifications
        .filter((n) => userReportIds.includes(n.reportId || ""))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    return [];
  }, [adminMode, notifications, reports, user]);

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
    elevateToAdmin,
    adminLogout,
    reports,
    saveReport,
    updateReportStatus,
    allReports,
    notifications: filteredNotifications,
    unreadNotificationCount,
    markNotificationAsRead,
    clearNotification
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

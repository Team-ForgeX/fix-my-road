"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { reports as seedReports } from "../lib/mockData";
import {
  submitReportToSupabase,
  executeAdminAction,
  fetchUserProfile,
  createCitizenProfile
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
    admin_code?: string;
  }) => Promise<{ success: boolean; error?: string; needsEmailVerification?: boolean; message?: string }>;
  verifyIdentity: (otp: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  adminLogin: (email: string, password: string, adminCode: string) => Promise<{ success: boolean; error?: string }>;
  elevateToAdmin: (adminCode: string) => Promise<{ success: boolean; error?: string }>;
  demoteToClient: () => Promise<{ success: boolean; error?: string }>;
  adminLogout: () => Promise<void>;
  reports: Report[];
  saveReport: (payload: {
    title: string;
    description: string;
    mediaFiles: File[];
    location: LocationPayload;
    problemType?: string;
  }) => Promise<{ success: boolean; error?: string; dedupeDecision?: "new" | "linked" }>;
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

const normalizeRole = (role?: string | null, fallback: "client" | "admin" = "client"): "client" | "admin" => {
  if (role === "admin") return "admin";
  if (role === "client") return "client";
  return fallback;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function buildAuthUser(profile: UserProfile, email: string, emailConfirmed: boolean, preferredRole: "client" | "admin" = "client"): AuthUser {
  const resolvedRole = normalizeRole(profile.role ?? preferredRole, preferredRole);

  return {
    ...profile,
    role: resolvedRole,
    email: email || profile.email || "",
    verified: emailConfirmed
  };
}

async function loadProfile(userId: string, email: string, emailConfirmed: boolean, preferredRole: "client" | "admin" = "client") {
  const profileResult = await fetchUserProfile(userId);

  // Profile exists — ALWAYS use the DB role as source of truth, never overwrite
  if (profileResult.data) {
    const dbRole = normalizeRole(profileResult.data.role, "client");
    return { success: true, user: buildAuthUser(profileResult.data, email, emailConfirmed, dbRole) };
  }

  // No profile yet (first login after email confirm) — create one using signup metadata role
  const fallbackName = email ? email.split("@")[0] : "User";
  const { data: newProfile, error: createError } = await createCitizenProfile({
    id: userId,
    email,
    full_name: fallbackName,
    role: preferredRole   // Only used here for brand-new profiles
  });

  if (!createError && newProfile) {
    const newRole = normalizeRole(newProfile.role, preferredRole);
    return { success: true, user: buildAuthUser(newProfile, email, emailConfirmed, newRole) };
  }

  return { success: false, error: (profileResult.error as any)?.message ?? "Profile not found." };
}



export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [ready, setReady] = useState(false);

  const syncUserData = async (userId: string, isAdmin: boolean) => {
    try {
      // 1. Fetch reports with linked incidents and media
      let reportsQuery = supabase
        .from("reports")
        .select("*, report_media(*), incidents(*)")
        .order("created_at", { ascending: false });

      if (!isAdmin) {
        reportsQuery = reportsQuery.eq("user_id", userId);
      }

      const { data: reportsData, error: reportsErr } = await reportsQuery;

      if (!reportsErr && reportsData) {
        const mappedReports: Report[] = reportsData.map((r: any) => {
          const incident = r.incidents;
          return {
            id: r.id,
            user_id: r.user_id,
            incident_id: r.incident_id || undefined,
            title: incident?.title || r.address || "Road Issue",
            description: r.description,
            latitude: Number(r.latitude),
            longitude: Number(r.longitude),
            address: r.address || "",
            landmark: r.landmark || undefined,
            locality: r.locality || "Unknown",
            city: r.city || "",
            created_at: r.created_at,
            processing_state: r.processing_state || "submitted",
            status: incident?.status || "open",
            severity: incident?.severity || "medium",
            report_count: incident?.report_count || 1,
            is_duplicate: r.is_duplicate || false,
            media: (r.report_media || []).map((m: any) => ({
              id: m.id,
              report_id: m.report_id,
              media_type: m.media_type,
              file_name: m.storage_path.split("/").pop() || "media",
              thumbnail_url: m.storage_path,
              size: Number(m.file_size || 0),
              created_at: m.created_at
            }))
          };
        });
        setReports(mappedReports);
        writeJson(STORAGE_KEYS.REPORTS, mappedReports);
      }

      // 2. Fetch notifications
      const { data: notifsData, error: notifsErr } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!notifsErr && notifsData) {
        const mappedNotifs: AppNotification[] = notifsData.map((n: any) => ({
          id: n.id,
          type: n.report_id ? "report_updated" : "system",
          title: n.title,
          message: n.message,
          priority: "medium",
          reportId: n.report_id || undefined,
          timestamp: n.created_at,
          read: n.is_read
        }));
        setNotifications(mappedNotifs);
        writeJson(STORAGE_KEYS.NOTIFICATIONS, mappedNotifs);
      }
    } catch (e) {
      console.error("Error in syncUserData:", e);
    }
  };

  useEffect(() => {
    let mounted = true;

    setReports(initialReports());
    setNotifications(initialNotifications());

<<<<<<< HEAD
    // Helper to build and set user from a session user object
    // Role is ALWAYS sourced from the DB profiles table, never from user_metadata
    const resolveAndSetUser = async (sessionUser: { id: string; email?: string; email_confirmed_at?: string | null; user_metadata?: Record<string, unknown> }) => {
=======
    // Set up auth state listener
    const subscription = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      const sessionUser = session?.user;

      // If no session, clear user
      if (!sessionUser?.id) {
        setUser(null);
        if (isInitializing) {
          setReady(true);
          isInitializing = false;
        }
        return;
      }

      // User has session, load profile and set user
>>>>>>> f637b6006ce757eb0ae9537fb7be28b1541eb93c
      const isConfirmed = Boolean(sessionUser.email_confirmed_at);
      // Metadata role is only used when creating a brand-new profile row for the first time
      const signupMetaRole = normalizeRole(
        (sessionUser.user_metadata?.role as string) ??
        (sessionUser.user_metadata?.requested_role as string)
      );
      const profileResult = await loadProfile(sessionUser.id, sessionUser.email ?? "", isConfirmed, signupMetaRole);

      if (!mounted) return;

      if (profileResult.success && profileResult.user) {
        // profileResult.user.role is already the DB role
        setUser(profileResult.user);
        await syncUserData(profileResult.user.id, profileResult.user.role === "admin");
      } else {
        console.warn("Profile load failed — using metadata fallback:", profileResult.error);
        const fallbackUser: AuthUser = {
          id: sessionUser.id,
          full_name: (sessionUser.user_metadata?.full_name as string) || sessionUser.email?.split("@")[0] || "User",
          phone: (sessionUser.user_metadata?.phone as string) || null,
          role: signupMetaRole,
          email: sessionUser.email ?? "",
          verified: isConfirmed,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setUser(fallbackUser);
        await syncUserData(fallbackUser.id, fallbackUser.role === "admin");
      }
    };

    // 1. First, get the current session so we know auth state before rendering
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!mounted) return;

      if (session?.user) {
        await resolveAndSetUser(session.user);
      } else {
        // No session — user is logged out
        setUser(null);
      }

      // Only mark ready AFTER we know the session state
      if (mounted) setReady(true);
    };

    initAuth();

    // 2. Listen for future auth changes (login/logout/token refresh)
    const subscription = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      const sessionUser = session?.user;

      if (!sessionUser?.id) {
        setUser(null);
        // If this is a sign-out event and ready hasn't been set yet, set it now
        if (mounted) setReady(true);
        return;
      }

      await resolveAndSetUser(sessionUser);
      if (mounted) setReady(true);
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
    try {
      const normalizedEmail = email.trim().toLowerCase();

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password
      });

      if (authError || !authData?.user) {
        return { success: false, error: authError?.message ?? "Invalid email or password." };
      }

      const isConfirmed = Boolean(authData.user.email_confirmed_at);

      // Use signup metadata role ONLY as a fallback for brand-new users with no profile yet
      // For existing users, DB profile role is always authoritative (see loadProfile)
      const signupMetaRole = normalizeRole(
        (authData.user.user_metadata?.role as string) ??
        (authData.user.user_metadata?.requested_role as string)
      );

      const profileResult = await loadProfile(
        authData.user.id,
        authData.user.email ?? "",
        isConfirmed,
        signupMetaRole  // Only used if no profile row exists yet
      );

      if (!profileResult.success || !profileResult.user) {
        // Profile creation failed — use metadata as emergency fallback (no DB overwrite)
        const fallbackUser: AuthUser = {
          id: authData.user.id,
          full_name: (authData.user.user_metadata?.full_name as string) || normalizedEmail.split("@")[0] || "User",
          phone: (authData.user.user_metadata?.phone as string) || null,
          role: signupMetaRole,
          email: authData.user.email ?? normalizedEmail,
          verified: isConfirmed,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setUser(fallbackUser);
        await syncUserData(fallbackUser.id, fallbackUser.role === "admin");
        return {
          success: true,
          needsVerification: !fallbackUser.verified,
          user: fallbackUser
        };
      }

      // profileResult.user.role is already the DB role (set in loadProfile)
      const resolvedUser: AuthUser = profileResult.user;

      setUser(resolvedUser);
      await syncUserData(resolvedUser.id, resolvedUser.role === "admin");
      return {
        success: true,
        needsVerification: !resolvedUser.verified,
        user: resolvedUser
      };
    } catch (err) {
      console.error("Login error:", err instanceof Error ? err.message : String(err));
      return { success: false, error: "An unexpected error occurred during login." };
    }
  };

  const elevateUserToAdmin = async (adminCode: string) => {
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

    const { data: { user: sessionUser } } = await supabase.auth.getUser();
    if (sessionUser) {
      const refreshed = await loadProfile(sessionUser.id, sessionUser.email ?? "", Boolean(sessionUser.email_confirmed_at), "admin");
      if (refreshed.success && refreshed.user) {
        const fullUser = {
          ...refreshed.user,
          role: "admin" as const
        };
        setUser(fullUser);
        await syncUserData(fullUser.id, true);
      }
    }

    return { success: true };
  };

  const elevateToAdmin = async (adminCode: string) => {
    return elevateUserToAdmin(adminCode);
  };

  const demoteToClient = async () => {
    if (!user) {
      return { success: false, error: "Sign in to change your account type." };
    }

    const response = await fetch("/api/admin/elevate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "downgrade" })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      return { success: false, error: data.error ?? "Unable to switch account back to client." };
    }

    setUser((currentUser) => {
      if (!currentUser) return null;
      return { ...currentUser, role: "client" };
    });

    await syncUserData(user.id, false);
    return { success: true };
  };

  const signup = async ({
    full_name,
    email,
    phone,
    password,
    admin_code
  }: {
    full_name: string;
    email: string;
    phone: string;
    password: string;
    admin_code?: string;
  }) => {
    const normalizedEmail = email.trim().toLowerCase();

    const signupResponse = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: full_name.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        password,
        admin_code: admin_code?.trim()
      })
    });

    const signupData = await signupResponse.json();

    if (!signupResponse.ok || !signupData?.success || !signupData?.user) {
      return { success: false, error: signupData?.error ?? "Unable to create account." };
    }

    return {
      success: true,
      needsEmailVerification: true,
      message: signupData.message ?? "Please verify your email to complete signup."
    };
  };

  // Legacy identity check disabled
  const verifyIdentity = async (otp: string) => {
    return { success: false, error: "Legacy verification disabled." };
  };

  const logout = async () => {
    setUser(null);
    setReports([]);
    setNotifications([]);
    setReady(true);

    try {
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) {
        console.warn("Sign out error:", error.message);
      }
    } catch (err) {
      console.warn("Logout error:", err instanceof Error ? err.message : String(err));
    }
  };

  const adminLogin = async (email: string, password: string, _adminCode?: string) => {
    return login(email, password);
  };

  const adminLogout = async () => {
    await logout();
  };

  const saveReport = async ({ title, description, mediaFiles, location, problemType }: { title: string; description: string; mediaFiles: File[]; location: LocationPayload; problemType?: string }) => {
    if (!user) {
      return { success: false, error: "Sign in before submitting a report." };
    }
    if (!user.verified) {
      return { success: false, error: "Complete identity verification before submitting reports." };
    }

<<<<<<< HEAD
    // Submit report directly to Supabase
    const submitRes = await submitReportToSupabase({
=======
    const supaResult = await submitReportToSupabase({
>>>>>>> f637b6006ce757eb0ae9537fb7be28b1541eb93c
      userId: user.id,
      title,
      description: description.trim(),
      problemType,
      latitude: 28.6139 + Math.random() * 0.01,
      longitude: 77.2090 + Math.random() * 0.01,
      address: location.address,
      landmark: location.landmark,
      city: location.city,
      pincode: location.pincode,
      mediaFiles
<<<<<<< HEAD
=======
    }).catch((err) => {
      console.warn("Supabase background save fallback:", err);
      return null;
>>>>>>> f637b6006ce757eb0ae9537fb7be28b1541eb93c
    });

    if (!submitRes.success) {
      return { success: false, error: submitRes.error || "Failed to submit report." };
    }

    // 1. Create client notification in database
    await supabase.from("notifications").insert({
      user_id: user.id,
      report_id: submitRes.reportId,
      title: "Report Submitted",
      message: `Your report "${title.trim()}" has been submitted and is awaiting verification.`
    });

    // 2. Fetch admin profiles to notify them
    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin");

    if (admins && admins.length > 0) {
      const adminNotifs = admins.map((adm) => ({
        user_id: adm.id,
        report_id: submitRes.reportId,
        title: "New Report Alert",
        message: `New report: "${title.trim()}" in ${location.address}`
      }));
      await supabase.from("notifications").insert(adminNotifs);
    }

    // Remove local storage cached location form data
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("fixmyroad_report_location");
    }

<<<<<<< HEAD
    // Sync state
    await syncUserData(user.id, user.role === "admin");
    return { success: true };
=======
    saveReports(nextReports);
    saveNotifications(nextNotifications);

    const dedupeDecision: "new" | "linked" = supaResult && "incidentId" in supaResult && supaResult.incidentId ? "linked" : "new";
    return {
      success: true,
      dedupeDecision
    };
>>>>>>> f637b6006ce757eb0ae9537fb7be28b1541eb93c
  };

  const updateReportStatus = async (reportId: string, status: Report["status"]) => {
    if (!user) return;
    const report = reports.find((r) => r.id === reportId);
    const targetIncidentId = report?.incident_id || reportId;

    try {
      const res = await executeAdminAction({
        incidentId: targetIncidentId,
        adminId: user.id,
        newStatus: status
      });

      if (res.success) {
        await syncUserData(user.id, user.role === "admin");
      }
    } catch (err) {
      console.warn("Supabase admin action error:", err);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    // Optimistic local update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);
  };

  const clearNotification = async (notificationId: string) => {
    // Optimistic local update
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

    await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);
  };

  const adminMode = useMemo(() => user?.role === "admin", [user]);

  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    return notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [notifications]);

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
    demoteToClient,
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

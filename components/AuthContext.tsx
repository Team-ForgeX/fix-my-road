"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

import {
  currentUser as defaultCurrentUser,
  reports as seedReports,
} from "../lib/mockData";

import {
  submitReportToSupabase,
  executeAdminAction,
} from "../lib/supabaseService";

import type { MediaType, Report } from "../types/report";
import type { UserProfile } from "../types/user";
import type { Notification } from "../types/notification";

type StoredUser = UserProfile & {
  email: string;
  phone: string;
  password: string;
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
  user: StoredUser | null;
  adminMode: boolean;
  ready: boolean;

  login: (
    email: string,
    password: string
  ) => Promise<{
    success: boolean;
    error?: string;
    needsVerification?: boolean;
  }>;

  signup: (payload: {
    full_name: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<{
    success: boolean;
    error?: string;
  }>;

  verifyIdentity: (
    otp: string
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;

  logout: () => void;

  adminLogin: (
    email: string,
    password: string
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;

  adminLogout: () => void;

  elevateToAdmin: (
    code: string
  ) => {
    success: boolean;
    error?: string;
  };

  demoteToClient: () => Promise<{
    success: boolean;
    error?: string;
  }>;

  reports: Report[];

  saveReport: (payload: {
    title: string;
    description: string;
    mediaFiles: File[];
    location: LocationPayload;
  }) => Promise<{
    success: boolean;
    error?: string;
  }>;

  updateReportStatus: (
    reportId: string,
    status: Report["status"]
  ) => void;

  allReports: Report[];
  notifications: Notification[];
  unreadNotificationCount: number;
};

const ADMIN_EMAIL = "admin@fixmyroad.local";
const ADMIN_PASSWORD = "admin123";
const ADMIN_ELEVATION_CODE = "ADMIN2026";

const STORAGE_KEYS = {
  USERS: "fixmyroad_users",
  CURRENT_USER: "fixmyroad_current_user",
  ADMIN_SESSION: "fixmyroad_admin_session",
  REPORTS: "fixmyroad_reports",
};

const defaultCitizen: StoredUser = {
  id: defaultCurrentUser.id,
  full_name: defaultCurrentUser.full_name,
  role: defaultCurrentUser.role,
  avatar_url: defaultCurrentUser.avatar_url,
  email: "aisha.verma@example.com",
  phone: "9876543210",
  password: "password123",
  verified: true,
};

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

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

const pickSeverity = (text: string) => {
  const normalized = text.toLowerCase();

  if (
    normalized.includes("pothole") ||
    normalized.includes("garbage") ||
    normalized.includes("leak") ||
    normalized.includes("flood")
  ) {
    return "high" as const;
  }

  if (
    normalized.includes("streetlight") ||
    normalized.includes("traffic") ||
    normalized.includes("drainage")
  ) {
    return "medium" as const;
  }

  return "low" as const;
};

const createMediaItems = async (
  files: File[],
  reportId: string
) => {
  return Promise.all(
    files.map(async (file) => {
      const type: MediaType = file.type.startsWith("image")
        ? "image"
        : "video";

      let thumbnail_url =
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80";

      if (type === "image") {
        thumbnail_url = await new Promise<string>((resolve) => {
          const reader = new FileReader();

          reader.onload = () => {
            resolve(String(reader.result));
          };

          reader.onerror = () => {
            resolve(thumbnail_url);
          };

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
        created_at: new Date().toISOString(),
      };
    })
  );
};

const initialReports = (): Report[] => {
  const persisted = readJson<Report[]>(
    STORAGE_KEYS.REPORTS,
    []
  );

  return persisted.length > 0 ? persisted : seedReports;
};

const initialUsers = (): StoredUser[] => {
  const persisted = readJson<StoredUser[]>(
    STORAGE_KEYS.USERS,
    []
  );

  return persisted.length > 0
    ? persisted
    : [defaultCitizen];
};

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<StoredUser[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loadedUsers = initialUsers();

    setUsers(loadedUsers);
    setReports(initialReports());

    const storedUserId = window.localStorage.getItem(
      STORAGE_KEYS.CURRENT_USER
    );

    if (storedUserId) {
      const match = loadedUsers.find(
        (entry) => entry.id === storedUserId
      );

      if (match) {
        setUser(match);
      } else {
        window.localStorage.removeItem(
          STORAGE_KEYS.CURRENT_USER
        );
      }
    }

    const storedAdmin =
      window.localStorage.getItem(
        STORAGE_KEYS.ADMIN_SESSION
      ) === "true";

    setAdminMode(storedAdmin);
    setReady(true);
  }, []);

  const saveUsers = (nextUsers: StoredUser[]) => {
    setUsers(nextUsers);
    writeJson(STORAGE_KEYS.USERS, nextUsers);
  };

  const saveReports = (nextReports: Report[]) => {
    setReports(nextReports);
    writeJson(STORAGE_KEYS.REPORTS, nextReports);
  };

  const login = async (
    email: string,
    password: string
  ) => {
    const normalized = email.trim().toLowerCase();

    const found = users.find(
      (entry) =>
        entry.email.toLowerCase() === normalized &&
        entry.password === password
    );

    if (!found) {
      return {
        success: false,
        error: "No account matched that email and password.",
      };
    }

    setUser(found);

    window.localStorage.setItem(
      STORAGE_KEYS.CURRENT_USER,
      found.id
    );

    if (!found.verified) {
      return {
        success: true,
        needsVerification: true,
      };
    }

    return {
      success: true,
    };
  };

  const signup = async ({
    full_name,
    email,
    phone,
    password,
  }: {
    full_name: string;
    email: string;
    phone: string;
    password: string;
  }) => {
    const normalized = email.trim().toLowerCase();

    if (
      users.some(
        (entry) =>
          entry.email.toLowerCase() === normalized
      )
    ) {
      return {
        success: false,
        error: "An account already exists with this email.",
      };
    }

    const newUser: StoredUser = {
      id: `u${Date.now()}`,
      full_name: full_name.trim(),
      role: "client",
      avatar_url: `https://avatars.dicebear.com/api/identicon/${encodeURIComponent(
        full_name.trim()
      )}.svg`,
      email: normalized,
      phone: phone.trim(),
      password,
      verified: false,
    };

    const nextUsers = [...users, newUser];

    saveUsers(nextUsers);
    setUser(newUser);

    window.localStorage.setItem(
      STORAGE_KEYS.CURRENT_USER,
      newUser.id
    );

    return {
      success: true,
    };
  };

  const verifyIdentity = async (otp: string) => {
    if (!user) {
      return {
        success: false,
        error: "No active user session found.",
      };
    }

    if (otp.trim() !== "123456") {
      return {
        success: false,
        error:
          "The verification code is invalid. Use 123456 for the mock flow.",
      };
    }

    const nextUsers = users.map((entry) =>
      entry.id === user.id
        ? {
            ...entry,
            verified: true,
          }
        : entry
    );

    saveUsers(nextUsers);

    const verifiedUser =
      nextUsers.find(
        (entry) => entry.id === user.id
      ) ?? user;

    setUser(verifiedUser);

    return {
      success: true,
    };
  };

  const logout = () => {
    setUser(null);

    window.localStorage.removeItem(
      STORAGE_KEYS.CURRENT_USER
    );
  };

  const adminLogin = async (
    email: string,
    password: string
  ) => {
    if (
      email.trim().toLowerCase() !== ADMIN_EMAIL ||
      password !== ADMIN_PASSWORD
    ) {
      return {
        success: false,
        error: "Invalid admin credentials.",
      };
    }

    window.localStorage.setItem(
      STORAGE_KEYS.ADMIN_SESSION,
      "true"
    );

    setAdminMode(true);

    return {
      success: true,
    };
  };

  const adminLogout = () => {
    window.localStorage.removeItem(
      STORAGE_KEYS.ADMIN_SESSION
    );

    setAdminMode(false);
  };

  const elevateToAdmin = (code: string) => {
    if (code.trim() !== ADMIN_ELEVATION_CODE) {
      return {
        success: false,
        error: "Invalid admin code.",
      };
    }

    if (!user) {
      return {
        success: false,
        error: "No active user session.",
      };
    }

    const nextUsers = users.map((entry) =>
      entry.id === user.id
        ? ({
            ...entry,
            role: "admin",
          } as StoredUser)
        : entry
    );

    saveUsers(nextUsers);

    const updatedUser = nextUsers.find(
      (entry) => entry.id === user.id
    );

    if (updatedUser) {
      setUser(updatedUser);
    }

    setAdminMode(true);

    window.localStorage.setItem(
      STORAGE_KEYS.ADMIN_SESSION,
      "true"
    );

    return {
      success: true,
    };
  };

  const demoteToClient = async () => {
    if (!user) {
      return {
        success: false,
        error: "No active user.",
      };
    }

    const updatedUser: StoredUser = {
      ...user,
      role: "client",
    };

    const nextUsers = users.map((entry) =>
      entry.id === user.id
        ? (updatedUser as StoredUser)
        : entry
    );

    saveUsers(nextUsers);
    setUser(updatedUser);
    setAdminMode(false);

    window.localStorage.removeItem(
      STORAGE_KEYS.ADMIN_SESSION
    );

    return {
      success: true,
    };
  };

  const saveReport = async ({
    title,
    description,
    mediaFiles,
    location,
  }: {
    title: string;
    description: string;
    mediaFiles: File[];
    location: LocationPayload;
  }) => {
    if (!user) {
      return {
        success: false,
        error: "Sign in before submitting a report.",
      };
    }

    if (!user.verified) {
      return {
        success: false,
        error:
          "Complete identity verification before submitting reports.",
      };
    }

    const latitude =
      28.6139 + Math.random() * 0.01;

    const longitude =
      77.2090 + Math.random() * 0.01;

    const supabaseResult =
      await submitReportToSupabase({
        userId: user.id,
        title,
        description: description.trim(),
        latitude,
        longitude,
        address: location.address,
        landmark: location.landmark,
        city: location.city,
        pincode: location.pincode,
        mediaFiles,
      });

    const id = `R${Date.now()}`;

    const thumbnailEntries =
      await createMediaItems(
        mediaFiles,
        id
      );

    const report: Report = {
      id,
      user_id: user.id,
      incident_id:
        supabaseResult.incidentId ?? undefined,
      title:
        title.trim() ||
        description.trim().slice(0, 45),
      description: description.trim(),
      latitude,
      longitude,
      address: location.address,
      landmark: location.landmark,
      locality:
        location.city ||
        location.pincode ||
        "Unknown",
      city: location.city,
      created_at: new Date().toISOString(),
      processing_state: "submitted",
      status: "open",
      severity: pickSeverity(description),
      report_count: 1,
      is_duplicate: false,
      media: thumbnailEntries,
    };

    saveReports([
      report,
      ...reports,
    ]);

    return {
      success: true,
    };
  };

  const updateReportStatus = (
    reportId: string,
    status: Report["status"]
  ) => {
    const currentReport = reports.find(
      (report) => report.id === reportId
    );

    executeAdminAction({
      incidentId:
        currentReport?.incident_id ||
        reportId,
      adminId:
        user?.id || "admin-1",
      newStatus: status,
    }).catch((err) =>
      console.warn(
        "Supabase admin action fallback:",
        err
      )
    );

    const nextReports = reports.map(
      (report) => {
        if (report.id !== reportId) {
          return report;
        }

        const nextProcessing =
          status === "resolved"
            ? "resolved"
            : status === "in_progress"
            ? "assigned"
            : report.processing_state;

        return {
          ...report,
          status,
          processing_state: nextProcessing,
        };
      }
    );

    saveReports(nextReports);
  };

  const notifications = useMemo(() => {
    if (adminMode) {
      return reports
        .filter(
          (report) =>
            report.status === "open"
        )
        .slice(0, 4)
        .map(
          (report): Notification => ({
            id: `notif-${report.id}`,
            user_id: user?.id || "",
            type: "report_updated",
            priority: "high",
            title: "Issue Review",
            message: `Open issue ${report.id} near ${report.address} needs admin review.`,
            report_id: report.id,
            read: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        );
    }

    if (user) {
      return reports
        .filter(
          (report) =>
            report.user_id === user.id
        )
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        )
        .slice(0, 4)
        .map(
          (report): Notification => ({
            id: `notif-${report.id}`,
            user_id: user.id,
            type: "report_updated",
            priority: "medium",
            title: "Report Update",
            message: `Your report ${report.id} is now ${report.status.replace(
              "_",
              " "
            )}.`,
            report_id: report.id,
            read: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        );
    }

    return [];
  }, [adminMode, reports, user]);

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

    elevateToAdmin,
    demoteToClient,

    reports,
    saveReport,
    updateReportStatus,

    allReports: reports,
    notifications,
    unreadNotificationCount: notifications.filter((n) => !n.read).length,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}
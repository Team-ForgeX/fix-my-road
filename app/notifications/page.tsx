"use client";

import { useEffect, useState, useCallback } from "react";
import { Navbar } from "../../components/navbar/Navbar";
import { useAuth } from "../../components/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  FileText,
  RefreshCw,
  Trash2,
  CheckCheck,
  ExternalLink,
  Inbox,
  Loader2,
  ShieldAlert,
  Clock,
} from "lucide-react";
import type { AppNotification } from "../../components/AuthContext";

/* ---------- helpers ---------- */

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return "Just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const iconForType = (type: AppNotification["type"]) => {
  switch (type) {
    case "report_submitted":
      return <FileText className="h-5 w-5 text-sky-400" />;
    case "report_updated":
      return <RefreshCw className="h-5 w-5 text-amber-400" />;
    case "report_resolved":
      return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
    case "new_report_alert":
      return <ShieldAlert className="h-5 w-5 text-rose-400" />;
    default:
      return <Bell className="h-5 w-5 text-violet-400" />;
  }
};

const accentForType = (type: AppNotification["type"]) => {
  switch (type) {
    case "report_submitted":
      return "border-sky-500/30";
    case "report_updated":
      return "border-amber-500/30";
    case "report_resolved":
      return "border-emerald-500/30";
    case "new_report_alert":
      return "border-rose-500/30";
    default:
      return "border-violet-500/30";
  }
};

const labelForType = (type: AppNotification["type"]) => {
  switch (type) {
    case "report_submitted":
      return "Submitted";
    case "report_updated":
      return "Status Update";
    case "report_resolved":
      return "Resolved";
    case "new_report_alert":
      return "New Alert";
    default:
      return "System";
  }
};

const pillColorForType = (type: AppNotification["type"]) => {
  switch (type) {
    case "report_submitted":
      return "bg-sky-500/15 text-sky-300 ring-sky-500/30";
    case "report_updated":
      return "bg-amber-500/15 text-amber-300 ring-amber-500/30";
    case "report_resolved":
      return "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30";
    case "new_report_alert":
      return "bg-rose-500/15 text-rose-300 ring-rose-500/30";
    default:
      return "bg-violet-500/15 text-violet-300 ring-violet-500/30";
  }
};

/* ---------- filter tabs ---------- */
type FilterTab = "all" | "unread" | "report_submitted" | "report_updated" | "report_resolved";
const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "report_submitted", label: "Submitted" },
  { key: "report_updated", label: "Updates" },
  { key: "report_resolved", label: "Resolved" },
];

/* ============================================================ */
export default function NotificationsPage() {
  const {
    user,
    ready,
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    clearNotification,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [markingAll, setMarkingAll] = useState(false);

  /* --- real-time subscription for live push --- */
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // AuthContext syncUserData will re-fetch; we can also trigger a quick local refetch
          // For simplicity we rely on AuthContext already handling this via its data sync
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  /* --- filter logic --- */
  const filtered = notifications.filter((n) => {
    if (activeTab === "unread") return !n.read;
    if (activeTab === "all") return true;
    return n.type === activeTab;
  });

  /* --- mark all as read --- */
  const handleMarkAllRead = useCallback(async () => {
    if (!user) return;
    setMarkingAll(true);

    // Optimistic: mark every unread notification as read via AuthContext
    const unread = notifications.filter((n) => !n.read);
    for (const n of unread) {
      markNotificationAsRead(n.id);
    }

    // Batch update in DB
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    setMarkingAll(false);
  }, [user, notifications, markNotificationAsRead]);

  /* ============================================================ */
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {/* ---- header ---- */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-400">
                Notifications
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
                Activity &amp; Alerts
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Stay updated on your reports and incident progress.
              </p>
            </div>

            {unreadNotificationCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 transition hover:border-teal-400/50 hover:bg-teal-500/10 hover:text-teal-300 disabled:opacity-50"
              >
                {markingAll ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCheck className="h-4 w-4" />
                )}
                Mark all read
              </button>
            )}
          </div>

          {/* ---- unread count badge ---- */}
          {unreadNotificationCount > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
              </span>
              <span className="text-xs font-semibold text-red-300">
                {unreadNotificationCount} unread
              </span>
            </div>
          )}
        </div>

        {/* ---- filter tabs ---- */}
        <div className="mb-6 flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={[
                "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200",
                activeTab === tab.key
                  ? "bg-gradient-to-r from-teal-500/20 to-violet-500/20 text-white ring-1 ring-teal-400/40"
                  : "border border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white/80",
              ].join(" ")}
            >
              {tab.label}
              {tab.key === "unread" && unreadNotificationCount > 0 && (
                <span className="ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ---- content ---- */}
        {!ready ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
            <p className="mt-4 text-sm text-slate-400">Loading notifications…</p>
          </div>
        ) : !user ? (
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-10 text-center backdrop-blur-xl">
            <Bell className="mx-auto h-12 w-12 text-slate-600" />
            <p className="mt-4 text-lg font-semibold text-white">Sign in to view notifications</p>
            <p className="mt-1 text-sm text-slate-400">
              Log in to track your reported issues and receive status updates.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-teal-500/25"
            >
              Sign In
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-14 text-center backdrop-blur-xl">
            <Inbox className="mx-auto h-14 w-14 text-slate-700" />
            <p className="mt-5 text-lg font-semibold text-white/90">
              {activeTab === "unread" ? "All caught up!" : "No notifications yet"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {activeTab === "unread"
                ? "You've read all your notifications."
                : "When you submit a report or receive status updates, they'll appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((n, idx) => (
              <div
                key={n.id}
                className={[
                  "group relative overflow-hidden rounded-2xl border bg-slate-900/60 p-5 backdrop-blur-xl transition-all duration-300",
                  n.read
                    ? "border-slate-800/50 opacity-75 hover:opacity-100"
                    : `${accentForType(n.type)} shadow-lg shadow-black/20`,
                  "hover:border-white/15 hover:bg-slate-800/60",
                ].join(" ")}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                {/* unread indicator bar */}
                {!n.read && (
                  <div className="absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-gradient-to-b from-teal-400 to-violet-500" />
                )}

                <div className="flex items-start gap-4">
                  {/* icon */}
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
                    {iconForType(n.type)}
                  </div>

                  {/* body */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className={[
                          "text-sm font-semibold",
                          n.read ? "text-white/70" : "text-white",
                        ].join(" ")}
                      >
                        {n.title}
                      </h3>
                      <span
                        className={[
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1",
                          pillColorForType(n.type),
                        ].join(" ")}
                      >
                        {labelForType(n.type)}
                      </span>
                    </div>

                    <p
                      className={[
                        "mt-1 text-sm leading-relaxed",
                        n.read ? "text-slate-500" : "text-slate-400",
                      ].join(" ")}
                    >
                      {n.message}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        {relativeTime(n.timestamp)}
                      </span>

                      {n.reportId && (
                        <Link
                          href={`/reports`}
                          className="inline-flex items-center gap-1 text-xs text-teal-400 transition hover:text-teal-300"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Report
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* actions */}
                  <div className="flex shrink-0 flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {!n.read && (
                      <button
                        onClick={() => markNotificationAsRead(n.id)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-teal-300"
                        title="Mark as read"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => clearNotification(n.id)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-rose-400"
                      title="Delete notification"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

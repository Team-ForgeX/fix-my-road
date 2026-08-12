"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Metadata } from "next";
import { Navbar } from "../../components/navbar/Navbar";
import { Card } from "../../components/ui/Card";
import { useAuth } from "../../components/AuthContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export default function NotificationsPage() {
  const router = useRouter();
  const { user, ready, notifications, adminMode, markNotificationAsRead, clearNotification } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
    }
  }, [ready, user, router]);

  const filteredNotifications = notifications.filter((n) => {
    const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         n.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || n.type === filterType;
    const matchesPriority = filterPriority === "all" || n.priority === filterPriority;
    return matchesSearch && matchesType && matchesPriority;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-950 text-red-200 border-red-800";
      case "medium":
        return "bg-yellow-950 text-yellow-200 border-yellow-800";
      case "low":
        return "bg-blue-950 text-blue-200 border-blue-800";
      default:
        return "bg-slate-800 text-slate-200 border-slate-700";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "report_submitted":
        return "✓";
      case "report_updated":
        return "◆";
      case "report_resolved":
        return "✔";
      case "new_report_alert":
        return "!";
      default:
        return "•";
    }
  };

  if (!ready || !user) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <Card className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-soft">
            <p className="text-sm uppercase tracking-[0.3em] text-teal-300">Notifications</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">
              {adminMode ? "Admin Activity Alerts" : "Your Report Updates"}
            </h1>
            <p className="mt-2 text-slate-400">
              {adminMode
                ? "Stay updated with new reports and system alerts that require your attention."
                : "Track the progress of your submitted reports and receive important updates."}
            </p>
          </Card>

          {/* Filters */}
          <Card className="rounded-[2rem] border border-slate-800/80 bg-slate-900/50 p-6 shadow-soft">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Search</label>
                <Input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-300 focus:border-teal-500 focus:outline-none"
                >
                  <option value="all">All Types</option>
                  {adminMode ? (
                    <>
                      <option value="new_report_alert">New Reports</option>
                      <option value="system">System Messages</option>
                    </>
                  ) : (
                    <>
                      <option value="report_submitted">Submitted</option>
                      <option value="report_updated">Updated</option>
                      <option value="report_resolved">Resolved</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Priority</label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-300 focus:border-teal-500 focus:outline-none"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Notifications List */}
          {filteredNotifications.length === 0 ? (
            <Card className="rounded-[2rem] border border-slate-800/80 bg-slate-950/80 p-8 text-center shadow-soft">
              <p className="text-slate-400">
                {searchTerm || filterType !== "all" || filterPriority !== "all"
                  ? "No notifications match your filters."
                  : "No notifications yet. Check back soon!"}
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`rounded-lg border-l-4 p-4 transition ${
                    notification.read
                      ? "border-slate-700 bg-slate-900/50"
                      : "border-teal-500 bg-slate-900/80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 flex-1">
                      {/* Icon */}
                      <div
                        className={`mt-1 flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold ${getPriorityColor(
                          notification.priority
                        )} border`}
                      >
                        {getTypeIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-semibold text-white">{notification.title}</h3>
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded-full border ${getPriorityColor(
                              notification.priority
                            )}`}
                          >
                            {notification.priority.charAt(0).toUpperCase() + notification.priority.slice(1)}
                          </span>
                          {!notification.read && (
                            <span className="text-xs bg-teal-600 text-white px-2 py-1 rounded-full">
                              New
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-slate-300 break-words">{notification.message}</p>
                        <p className="mt-2 text-xs text-slate-500">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      {!notification.read && (
                        <button
                          onClick={() => markNotificationAsRead(notification.id)}
                          className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-xs font-medium text-white transition"
                        >
                          Mark Read
                        </button>
                      )}
                      <button
                        onClick={() => clearNotification(notification.id)}
                        className="px-3 py-1 rounded bg-slate-700 hover:bg-red-700 text-xs font-medium text-white transition"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Info Box */}
          <Card className="rounded-[2rem] border border-slate-800/80 bg-slate-900/50 p-6 shadow-soft">
            <p className="text-sm text-slate-400">
              {adminMode
                ? "As an admin, you receive alerts for all new reports and critical system events. Use filters to focus on specific priority levels or report types."
                : "You receive updates about your submitted reports, including status changes and important actions taken by the admin team."}
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}

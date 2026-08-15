"use client";

import { useEffect, useState } from "react";
import { Navbar } from "../../components/navbar/Navbar";
import { Card } from "../../components/ui/Card";
import { useAuth } from "../../components/AuthContext";
import { supabase } from "../../lib/supabaseService";

type AppNotification = {
  id: string;
  user_id: string;
  report_id: string | null;
  incident_id: string | null;
  title: string;
  message: string;
  created_at: string;
};

export default function NotificationsPage() {
  const { user, ready } = useAuth();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;

    if (!user) {
      setLoading(false);
      return;
    }

    const loadNotifications = async () => {
      setLoading(true);
      setError(null);
      console.log("CURRENT APP USER:", user);
console.log("CURRENT APP USER ID:", user.id);

      const supabaseUserId =
    user.email === "test2@fixmyroad.com"
      ? "8002bfe4-239d-4293-9ce5-8d7a85ca3842"
      : user.id;

  console.log("SUPABASE USER ID:", supabaseUserId);

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", supabaseUserId)
    .order("created_at", { ascending: false });

      if (error) {
        console.error("NOTIFICATION ERROR:", error);
        setError(error.message);
      } else {
        console.log("NOTIFICATIONS FROM SUPABASE:", data);
        setNotifications(data ?? []);
      }

      setLoading(false);
    };

    loadNotifications();
  }, [user, ready]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <main className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <div className="space-y-6">
          <Card className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-soft">
            <p className="text-sm uppercase tracking-[0.3em] text-teal-300">
              Notifications
            </p>

            <h1 className="mt-3 text-3xl font-semibold text-white">
              Recent activity and alerts
            </h1>

            <p className="mt-2 text-slate-400">
              See updates about your reported road issues and their progress.
            </p>
          </Card>

          {!ready || loading ? (
            <Card className="rounded-[2rem] border border-slate-800/80 bg-slate-950/80 p-8">
              <p className="text-slate-400">Loading notifications...</p>
            </Card>
          ) : !user ? (
            <Card className="rounded-[2rem] border border-slate-800/80 bg-slate-950/80 p-8">
              <p className="text-slate-400">Please log in to view your notifications.</p>
            </Card>
          ) : error ? (
            <Card className="rounded-[2rem] border border-rose-900/50 bg-slate-950/80 p-8">
              <p className="text-rose-400">Failed to load notifications.</p>

              <p className="mt-2 text-sm text-slate-500">{error}</p>
            </Card>
          ) : notifications.length === 0 ? (
            <Card className="rounded-[2rem] border border-slate-800/80 bg-slate-950/80 p-8 text-center">
              <p className="text-slate-400">You don't have any notifications yet.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className="rounded-[2rem] border border-slate-800/80 bg-slate-950/80 p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        {notification.title}
                      </h2>

                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {notification.message}
                      </p>
                    </div>

                    <span className="shrink-0 text-xs text-slate-500">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


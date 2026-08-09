"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "../../components/navbar/Navbar";
import { StatsCard } from "../../components/dashboard/StatsCard";
import { RecentReports } from "../../components/dashboard/RecentReports";
import { MapOverview } from "../../components/MapOverview";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../components/AuthContext";

export default function DashboardPage() {
  const router = useRouter();
  const { user, ready, reports, notifications } = useAuth();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
    }
  }, [ready, router, user]);

  const stats = useMemo(
    () => ({
      totalReports: reports.filter((report) => report.user_id === user?.id).length,
      activeReports: reports.filter((report) => report.user_id === user?.id && report.status !== "resolved").length,
      resolvedReports: reports.filter((report) => report.user_id === user?.id && report.status === "resolved").length
    }),
    [reports, user]
  );

  if (!ready || !user) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.5fr_0.8fr]">
          <section className="space-y-8">
            <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-soft">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-teal-300">Welcome back</p>
                  <h1 className="mt-3 text-3xl font-semibold text-white">{user.full_name}, here’s the latest from your reports</h1>
                </div>
                <Button size="lg" onClick={() => router.push("/report")}>Report an Issue</Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <StatsCard title="Total reports" value={stats.totalReports.toString()} />
              <StatsCard title="Active reports" value={stats.activeReports.toString()} />
              <StatsCard title="Resolved reports" value={stats.resolvedReports.toString()} />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Recent reports</p>
                  <h2 className="text-2xl font-semibold text-white">Reports submitted by you</h2>
                </div>
              </div>
              <RecentReports reports={reports.filter((report) => report.user_id === user.id).slice(0, 3)} />
            </div>

            <MapOverview reports={reports.filter((report) => report.user_id === user.id)} />
          </section>

          <section className="space-y-6">
            <Card className="space-y-4 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-teal-300">Notifications</p>
              <div className="space-y-4">
                {notifications.length === 0 ? (
                  <div className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-4">
                    <p className="text-sm text-slate-400">No recent notifications yet.</p>
                  </div>
                ) : (
                  notifications.map((note) => (
                    <div key={note} className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-4">
                      <p className="text-sm text-slate-400">{note}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>
            <Card className="space-y-4 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-teal-300">Impact summary</p>
              <div className="mt-6 grid gap-3 text-slate-400">
                <p>{stats.activeReports} of your reports are still under review.</p>
                <p>{stats.resolvedReports} reports were resolved successfully.</p>
                <p>Keep contributing to make public infrastructure more visible and actionable.</p>
              </div>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}

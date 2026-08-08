import { Navbar } from "../../components/navbar/Navbar";
import { StatsCard } from "../../components/dashboard/StatsCard";
import { RecentReports } from "../../components/dashboard/RecentReports";
import { reports, statistics } from "../../lib/mockData";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

export default function DashboardPage() {
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
                  <h1 className="mt-3 text-3xl font-semibold text-white">Aisha, here’s the latest from your reports</h1>
                </div>
                <Button size="lg">Report an Issue</Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <StatsCard title="Total reports" value={statistics.totalReports.toString()} />
              <StatsCard title="Active reports" value={statistics.activeReports.toString()} />
              <StatsCard title="Resolved reports" value={statistics.resolvedReports.toString()} />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Recent reports</p>
                  <h2 className="text-2xl font-semibold text-white">Reports submitted by you</h2>
                </div>
              </div>
              <RecentReports reports={reports.slice(0, 3)} />
            </div>
          </section>

          <section className="space-y-6">
            <Card className="space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-teal-300">Notifications</p>
              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-4">
                  <p className="text-sm text-slate-400">Your recent report R1024 was linked to Incident I501.</p>
                </div>
                <div className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-4">
                  <p className="text-sm text-slate-400">The report for the broken streetlight is now being reviewed by local operations.</p>
                </div>
              </div>
            </Card>
            <Card>
              <p className="text-sm uppercase tracking-[0.3em] text-teal-300">Impact summary</p>
              <div className="mt-6 grid gap-3 text-slate-400">
                <p>20 reports are currently under verification.</p>
                <p>6 citizen reports were consolidated into existing incidents this week.</p>
                <p>One issue was marked resolved in your area yesterday.</p>
              </div>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}

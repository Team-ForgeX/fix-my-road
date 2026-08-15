"use client";

import { useState } from "react";
import { Navbar } from "../../components/navbar/Navbar";
import { ReportCard } from "../../components/report/ReportCard";
import { useAuth } from "../../components/AuthContext";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import Link from "next/link";

export default function ReportsPage() {
  const { reports, ready, user } = useAuth();
  const [filter, setFilter] = useState<"all" | "open" | "in_progress" | "resolved">("all");

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <main className="mx-auto max-w-6xl px-6 py-10 lg:px-8 flex items-center justify-center min-h-[50vh]">
          <p className="text-slate-400">Loading your reports...</p>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <main className="mx-auto max-w-6xl px-6 py-10 lg:px-8 flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <p className="text-slate-400">Please sign in to view your reports.</p>
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        </main>
      </div>
    );
  }

  // Filter reports
  const filteredReports = reports.filter((report) => {
    if (filter === "all") return true;
    return report.status === filter;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-soft">
            <p className="text-sm uppercase tracking-[0.3em] text-teal-300">My reports</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">All reports you submitted</h1>
            <p className="mt-2 text-slate-400">Review any report, see its current status, and open the details.</p>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 border-b border-slate-800 pb-4">
            {(["all", "open", "in_progress", "resolved"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  filter === status
                    ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {status.replace("_", " ").toUpperCase()}
              </button>
            ))}
          </div>

          <div className="grid gap-5">
            {filteredReports.length === 0 ? (
              <Card className="p-8 text-center border-slate-800 bg-slate-950/80">
                <p className="text-slate-400">No reports found matching status "{filter}".</p>
                {filter === "all" && (
                  <div className="mt-4">
                    <Link href="/report">
                      <Button size="sm">Submit a New Report</Button>
                    </Link>
                  </div>
                )}
              </Card>
            ) : (
              filteredReports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

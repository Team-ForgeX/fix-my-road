"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "../navbar/Navbar";
import { ReportCard } from "../report/ReportCard";
import { useAuth } from "../AuthContext";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

export function ReportsPageContent() {
  const { user, ready, reports, adminMode } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "open" | "in_progress" | "resolved">("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
    }
  }, [ready, router, user]);

  if (!ready || !user) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  // Filter reports by status and search term
  const filteredReports = reports.filter((report) => {
    const matchesFilter = filter === "all" || report.status === filter;
    const matchesSearch =
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.description && report.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-soft">
            <p className="text-sm uppercase tracking-[0.3em] text-teal-300 font-semibold">
              {adminMode ? "All Infrastructure Reports" : "My Submitted Reports"}
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">
              {adminMode ? "System-Wide Civic Issue Reports" : "Track & Review Your Reports"}
            </h1>
            <p className="mt-2 text-slate-400">
              {adminMode
                ? "Viewing all reports submitted across the platform. Manage and verify issue statuses."
                : "Review any report you've submitted, see its current progress stage, and view details."}
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center border-b border-slate-800 pb-4">
            <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
              {(["all", "open", "in_progress", "resolved"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition whitespace-nowrap ${
                    filter === status
                      ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {status.replace("_", " ").toUpperCase()}
                </button>
              ))}
            </div>

            <div className="w-full sm:w-64">
              <Input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-sm"
              />
            </div>
          </div>

          {/* Report List */}
          <div className="grid gap-5">
            {filteredReports.length === 0 ? (
              <Card className="p-8 text-center border-slate-800 bg-slate-950/80">
                <p className="text-slate-400">
                  {searchTerm
                    ? `No reports matching "${searchTerm}".`
                    : `No reports found with status "${filter.replace("_", " ")}".`}
                </p>
                {!adminMode && filter === "all" && !searchTerm && (
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

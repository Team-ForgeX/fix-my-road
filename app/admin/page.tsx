"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthContext";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Navbar } from "../../components/navbar/Navbar";
import type { Report } from "../../types/report";

export default function AdminPage() {
  const { user, adminMode, elevateToAdmin, adminLogout, reports, updateReportStatus, ready } = useAuth();
  const router = useRouter();
  const [adminCode, setAdminCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    // Admin users can access the page, citizens will see elevation UI
  }, [ready, router, user]);

  const recentReports = useMemo(() => reports.slice(0, 4), [reports]);
  const stats = useMemo(() => {
    return {
      total: reports.length,
      open: reports.filter((report) => report.status === "open").length,
      inProgress: reports.filter((report) => report.status === "in_progress").length,
      resolved: reports.filter((report) => report.status === "resolved").length
    };
  }, [reports]);

  const handleElevateToAdmin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      const result = await elevateToAdmin(adminCode);
      if (!result.success) {
        setError(result.error ?? "Could not elevate to admin.");
        return;
      }
      setAdminCode("");
      // Page will re-render with new admin role
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogout = async () => {
    await adminLogout();
    router.push("/");
  };

  const handleAction = (report: Report, status: Report["status"]) => {
    updateReportStatus(report.id, status);
  };

  if (!ready) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  if (!adminMode) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <main className="mx-auto flex min-h-[calc(100vh-96px)] max-w-3xl items-center px-6 py-12 lg:px-8">
          <Card className="w-full space-y-8 p-10">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-teal-300">Elevate to Admin</p>
              <h1 className="mt-3 text-3xl font-semibold text-white">Access Admin Dashboard</h1>
              <p className="mt-2 text-slate-400">
                You are currently logged in as {user?.full_name}. To access the admin dashboard, please enter your admin access code.
              </p>
            </div>
            <form className="space-y-6" onSubmit={handleElevateToAdmin}>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Admin Access Code</label>
                <Input
                  type="password"
                  value={adminCode}
                  onChange={(event) => setAdminCode(event.target.value)}
                  placeholder="Enter admin access code"
                  disabled={isLoading}
                />
                <p className="mt-2 text-xs text-slate-500">
                  Contact your administrator for the admin access code.
                </p>
              </div>
              {error ? <p className="text-sm text-rose-300">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Elevate to Admin"}
              </Button>
            </form>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => router.push("/dashboard")}
            >
              Return to Dashboard
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-teal-300">Admin dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Verify reports and resolve incidents</h1>
            <p className="mt-2 max-w-2xl text-slate-400">Review incoming reports, assign priorities, and track resolution status for the city's infrastructure team.</p>
          </div>
          <Button variant="secondary" onClick={handleAdminLogout}>Admin Logout</Button>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          <Card className="space-y-4 p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Total reports</p>
            <p className="text-3xl font-semibold text-white">{stats.total}</p>
          </Card>
          <Card className="space-y-4 p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Open</p>
            <p className="text-3xl font-semibold text-white">{stats.open}</p>
          </Card>
          <Card className="space-y-4 p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">In progress</p>
            <p className="text-3xl font-semibold text-white">{stats.inProgress}</p>
          </Card>
          <Card className="space-y-4 p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Resolved</p>
            <p className="text-3xl font-semibold text-white">{stats.resolved}</p>
          </Card>
        </div>

        {/* Filter Options for Admin */}
        <div className="mt-10">
          <Card className="rounded-[2rem] border border-slate-800/80 bg-slate-900/50 p-6 shadow-soft">
            <p className="mb-4 text-sm uppercase tracking-[0.3em] text-slate-300">Filter & Manage Reports</p>
            <p className="text-sm text-slate-400">
              Use the Notifications page to see alerts for new reports with filtering options by priority and location.
            </p>
          </Card>
        </div>

        <div className="mt-10 space-y-6">
          <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-6 shadow-soft">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-300">Recent Reports</p>
            <div className="mt-6 space-y-4">
              {recentReports.length === 0 ? (
                <p className="text-sm text-slate-400">No reports yet.</p>
              ) : (
                recentReports.map((report) => (
                  <div key={report.id} className="rounded-3xl border border-slate-800/80 bg-slate-950/70 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-white">{report.title}</p>
                        <p className="text-sm text-slate-400">{report.address}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {report.status === "open" && (
                          <Button size="sm" onClick={() => handleAction(report, "in_progress")}>
                            Verify
                          </Button>
                        )}
                        {report.status === "in_progress" && (
                          <Button size="sm" onClick={() => handleAction(report, "in_progress")}>
                            Processing
                          </Button>
                        )}
                        {report.status !== "resolved" && (
                          <Button size="sm" variant="ghost" onClick={() => handleAction(report, "resolved")}>
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-400">
                      <span className="px-2 py-1 bg-slate-800 rounded text-slate-300">
                        {report.status.replace("_", " ")}
                      </span>
                      <span className={`px-2 py-1 rounded ${
                        report.severity === "high"
                          ? "bg-red-900/30 text-red-300"
                          : report.severity === "medium"
                          ? "bg-yellow-900/30 text-yellow-300"
                          : "bg-blue-900/30 text-blue-300"
                      }`}>
                        Severity: {report.severity ?? "medium"}
                      </span>
                      <span>{new Date(report.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

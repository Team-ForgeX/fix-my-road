"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthContext";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import type { Report } from "../../types/report";

export default function AdminPage() {
  const { adminMode, adminLogin, adminLogout, reports, updateReportStatus, ready } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!adminMode) return;
    router.replace("/admin");
  }, [ready, adminMode, router]);

  const recentReports = useMemo(() => reports.slice(0, 4), [reports]);
  const stats = useMemo(() => {
    return {
      total: reports.length,
      open: reports.filter((report) => report.status === "open").length,
      inProgress: reports.filter((report) => report.status === "in_progress").length,
      resolved: reports.filter((report) => report.status === "resolved").length
    };
  }, [reports]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const result = await adminLogin(email, password);
    if (!result.success) {
      setError(result.error ?? "Could not sign in as admin.");
      return;
    }
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
        <main className="mx-auto flex min-h-[calc(100vh-96px)] max-w-3xl items-center px-6 py-12 lg:px-8">
          <Card className="w-full space-y-8 p-10">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-teal-300">Admin sign in</p>
              <h1 className="mt-3 text-3xl font-semibold text-white">City operations dashboard</h1>
              <p className="mt-2 text-slate-400">Use the mock admin credentials to review reports, verify issues, and track status changes.</p>
            </div>
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Email address</label>
                <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@fixmyroad.local" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Password</label>
                <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="admin123" />
              </div>
              {error ? <p className="text-sm text-rose-300">{error}</p> : null}
              <Button type="submit" className="w-full">Sign in</Button>
            </form>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-teal-300">Admin dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Verify reports and resolve incidents</h1>
            <p className="mt-2 max-w-2xl text-slate-400">Review every incoming report, assign priorities, and track resolution status for the city’s infrastructure team.</p>
          </div>
          <Button variant="secondary" onClick={adminLogout}>Logout</Button>
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

        <div className="mt-10 space-y-6">
          <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-6 shadow-soft">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-300">Recent reports</p>
            <div className="mt-6 space-y-4">
              {recentReports.map((report) => (
                <div key={report.id} className="rounded-3xl border border-slate-800/80 bg-slate-950/70 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-white">{report.title}</p>
                      <p className="text-sm text-slate-400">{report.address}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" onClick={() => handleAction(report, report.status === "open" ? "in_progress" : report.status)}>
                        {report.status === "open" ? "Verify" : report.status === "in_progress" ? "Continue" : "View"}
                      </Button>
                      {report.status !== "resolved" ? (
                        <Button size="sm" variant="ghost" onClick={() => handleAction(report, "resolved")}>Resolve</Button>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-400">
                    <span>{report.status.replace("_", " ")}</span>
                    <span>Severity: {report.severity ?? "medium"}</span>
                    <span>{new Date(report.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

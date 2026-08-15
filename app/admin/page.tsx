"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthContext";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Navbar } from "../../components/navbar/Navbar";
import { supabase, executeAdminAction } from "../../lib/supabaseService";
import type { Report } from "../../types/report";

export default function AdminPage() {
  const { user, adminLogout, ready } = useAuth();
  const router = useRouter();
  
  const [reports, setReports] = useState<Report[]>([]);
  const [mlDecisions, setMlDecisions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "resolved" | "ml">("all");

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch reports with linked incidents and media
      const { data: reportsData, error: reportsError } = await supabase
        .from("reports")
        .select("*, report_media(*), incidents(*)")
        .order("created_at", { ascending: false });

      if (!reportsError && reportsData) {
        const mapped = reportsData.map((r: any) => ({
          id: r.id,
          user_id: r.user_id,
          incident_id: r.incident_id || undefined,
          title: r.incidents?.title || r.address || "Road Issue",
          description: r.description,
          latitude: Number(r.latitude),
          longitude: Number(r.longitude),
          address: r.address || "",
          landmark: r.landmark || undefined,
          locality: r.locality || "Unknown",
          city: r.city || "",
          created_at: r.created_at,
          processing_state: r.processing_state || "submitted",
          status: r.incidents?.status || "open",
          severity: r.incidents?.severity || "medium",
          report_count: r.incidents?.report_count || 1,
          is_duplicate: r.is_duplicate || false,
          media: (r.report_media || []).map((m: any) => ({
            id: m.id,
            report_id: m.report_id,
            media_type: m.media_type,
            file_name: m.storage_path.split("/").pop() || "media",
            thumbnail_url: m.storage_path,
            size: Number(m.file_size || 0),
            created_at: m.created_at
          }))
        }));
        setReports(mapped);
      }

      // 2. Fetch ML deduplication decisions
      const { data: decisionsData, error: decisionsError } = await supabase
        .from("dedupe_decisions")
        .select("*, reports(*)")
        .order("created_at", { ascending: false });

      if (!decisionsError && decisionsData) {
        setMlDecisions(decisionsData);
      }
    } catch (err) {
      console.error("Error fetching admin data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "admin") {
      router.replace("/dashboard");
      return;
    }
    fetchAdminData();
  }, [ready, router, user]);

  const stats = useMemo(() => {
    return {
      total: reports.length,
      open: reports.filter((report) => report.status === "open").length,
      inProgress: reports.filter((report) => report.status === "in_progress").length,
      resolved: reports.filter((report) => report.status === "resolved").length
    };
  }, [reports]);

  const handleAdminLogout = async () => {
    await adminLogout();
    router.push("/");
  };

  const handleAction = async (report: Report, status: Report["status"]) => {
    if (!user) return;
    
    // We update the associated incident ID if linked, otherwise report's incident_id
    const targetId = report.incident_id;
    if (!targetId) {
      alert("This report is not associated with an incident yet. Deduplication may be running.");
      return;
    }

    try {
      const res = await executeAdminAction({
        incidentId: targetId,
        adminId: user.id,
        newStatus: status
      });
      if (res.success) {
        fetchAdminData();
      } else {
        alert(res.error || "Action failed.");
      }
    } catch (err) {
      console.error("Admin action failed:", err);
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (activeTab === "all") return true;
      if (activeTab === "pending") return r.status === "open" || r.status === "in_progress";
      if (activeTab === "resolved") return r.status === "resolved";
      return true;
    });
  }, [reports, activeTab]);

  if (!ready || !user || user.role !== "admin") {
    return <div className="min-h-screen bg-slate-950" />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-teal-300 font-semibold">Admin Dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Verify reports and resolve incidents</h1>
            <p className="mt-2 max-w-2xl text-slate-400">Review incoming reports, assign priorities, and track resolution status for the city's infrastructure team.</p>
          </div>
          <div className="flex gap-4">
            <Button variant="secondary" onClick={fetchAdminData} disabled={isLoading}>
              {isLoading ? "Refreshing..." : "Refresh"}
            </Button>
            <Button variant="secondary" onClick={handleAdminLogout}>Admin Logout</Button>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          <Card className="space-y-4 p-6 bg-slate-900/50 border-slate-800/80">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Total reports</p>
            <p className="text-3xl font-semibold text-white">{stats.total}</p>
          </Card>
          <Card className="space-y-4 p-6 bg-slate-900/50 border-slate-800/80">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Open</p>
            <p className="text-3xl font-semibold text-teal-400">{stats.open}</p>
          </Card>
          <Card className="space-y-4 p-6 bg-slate-900/50 border-slate-800/80">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">In progress</p>
            <p className="text-3xl font-semibold text-amber-400">{stats.inProgress}</p>
          </Card>
          <Card className="space-y-4 p-6 bg-slate-900/50 border-slate-800/80">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Resolved</p>
            <p className="text-3xl font-semibold text-emerald-400">{stats.resolved}</p>
          </Card>
        </div>

        {/* Tab Selection */}
        <div className="mt-10 flex gap-2 border-b border-slate-800 pb-4">
          {(["all", "pending", "resolved", "ml"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                activeTab === tab
                  ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab === "ml" ? "ML DEDUPLICATION DECISIONS" : tab.toUpperCase()}
            </button>
          ))}
        </div>

        {activeTab === "ml" ? (
          <div className="mt-6 space-y-4">
            {mlDecisions.length === 0 ? (
              <Card className="p-8 text-center border-slate-800 bg-slate-950/80">
                <p className="text-slate-400">No ML decisions logged yet.</p>
              </Card>
            ) : (
              mlDecisions.map((decision) => (
                <div key={decision.id} className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-teal-300">Decision: {decision.decision.toUpperCase()}</p>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      decision.decided_by === "ML" ? "bg-purple-900/30 text-purple-300" : "bg-slate-800 text-slate-400"
                    }`}>
                      By: {decision.decided_by}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300">Reason: {decision.reason || "None specified"}</p>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Score: {decision.final_score ? `${Number(decision.final_score) * 100}%` : "N/A"}</span>
                    <span>{new Date(decision.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {filteredReports.length === 0 ? (
              <Card className="p-8 text-center border-slate-800 bg-slate-950/80">
                <p className="text-slate-400">No reports found.</p>
              </Card>
            ) : (
              filteredReports.map((report) => (
                <div key={report.id} className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-white">{report.title}</p>
                      <p className="text-sm text-slate-400">{report.address}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {report.status === "open" && (
                        <Button size="sm" onClick={() => handleAction(report, "in_progress")}>
                          Verify / Process
                        </Button>
                      )}
                      {report.status === "in_progress" && (
                        <Button size="sm" onClick={() => handleAction(report, "resolved")}>
                          Mark Resolved
                        </Button>
                      )}
                      {report.status !== "resolved" && (
                        <Button size="sm" variant="ghost" onClick={() => handleAction(report, "resolved")}>
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {report.description && (
                    <p className="mt-3 text-sm text-slate-300 border-l-2 border-slate-700 pl-3 py-1">
                      {report.description}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-400">
                    <span className="px-2 py-1 bg-slate-800 rounded text-slate-300">
                      Status: {report.status.replace("_", " ")}
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
                    <span>Reported: {new Date(report.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

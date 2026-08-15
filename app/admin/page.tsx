"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthContext";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { supabase } from "../../lib/supabaseService";

type Incident = {
  id: string;
  title: string;
  problem_type: string;
  severity: string;
  status: "open" | "assigned" | "in_progress" | "resolved";
  description: string | null;
  address: string | null;
  report_count: number;
  created_at: string;
};

export default function AdminPage() {
  const { adminMode, adminLogin, adminLogout, ready } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ready || !adminMode) return;

    const loadIncidents = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("incidents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setIncidents(data ?? []);
      }

      setLoading(false);
    };

    loadIncidents();
  }, [ready, adminMode]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const result = await adminLogin(email, password);

    if (!result.success) {
      setError(result.error ?? "Could not sign in as admin.");
    }
  };

  const updateIncidentStatus = async (
    incident: Incident,
    newStatus: Incident["status"]
  ) => {
    setError(null);

    const oldStatus = incident.status;

    const { error: updateError } = await supabase
      .from("incidents")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", incident.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    // Update UI immediately
    setIncidents((current) =>
      current.map((item) =>
        item.id === incident.id
          ? { ...item, status: newStatus }
          : item
      )
    );

    // Record status history
    await supabase.from("incident_status_history").insert({
      incident_id: incident.id,
      old_status: oldStatus,
      new_status: newStatus,
      changed_by: null,
      note: `Status changed from ${oldStatus} to ${newStatus}`,
    });
  };

  if (!ready) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  if (!adminMode) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-12 lg:px-8">
          <Card className="w-full space-y-8 p-10">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-teal-300">
                Admin sign in
              </p>

              <h1 className="mt-3 text-3xl font-semibold text-white">
                City operations dashboard
              </h1>

              <p className="mt-2 text-slate-400">
                Review reports, verify issues, and track incident status.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Email address
                </label>

                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@fixmyroad.local"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Password
                </label>

                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="admin123"
                />
              </div>

              {error && (
                <p className="text-sm text-rose-300">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full">
                Sign in
              </Button>
            </form>
          </Card>
        </main>
      </div>
    );
  }

  const stats = {
    total: incidents.length,
    open: incidents.filter((i) => i.status === "open").length,
    inProgress: incidents.filter((i) => i.status === "in_progress").length,
    resolved: incidents.filter((i) => i.status === "resolved").length,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-teal-300">
              Admin dashboard
            </p>

            <h1 className="mt-3 text-3xl font-semibold">
              Verify reports and resolve incidents
            </h1>

            <p className="mt-2 max-w-2xl text-slate-400">
              Review real incidents reported by citizens and track their
              resolution status.
            </p>
          </div>

          <Button
            variant="secondary"
            onClick={() => {
              adminLogout();
              router.push("/");
            }}
          >
            Logout
          </Button>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          <Card className="p-6">
            <p className="text-sm text-slate-400">Total incidents</p>
            <p className="mt-2 text-3xl font-semibold">
              {stats.total}
            </p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-slate-400">Open</p>
            <p className="mt-2 text-3xl font-semibold">
              {stats.open}
            </p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-slate-400">In progress</p>
            <p className="mt-2 text-3xl font-semibold">
              {stats.inProgress}
            </p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-slate-400">Resolved</p>
            <p className="mt-2 text-3xl font-semibold">
              {stats.resolved}
            </p>
          </Card>
        </div>

        <div className="mt-10">
          <Card className="p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-300">
              Incidents
            </p>

            {loading ? (
              <p className="mt-6 text-slate-400">
                Loading incidents...
              </p>
            ) : incidents.length === 0 ? (
              <p className="mt-6 text-slate-400">
                No incidents found.
              </p>
            ) : (
              <div className="mt-6 space-y-4">
                {incidents.map((incident) => (
                  <div
                    key={incident.id}
                    className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-white">
                          {incident.title}
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                          {incident.address || "Location unavailable"}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-400">
                          <span>
                            Status: {incident.status.replace("_", " ")}
                          </span>

                          <span>
                            Severity: {incident.severity}
                          </span>

                          <span>
                            Reports: {incident.report_count}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {incident.status === "open" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              updateIncidentStatus(
                                incident,
                                "in_progress"
                              )
                            }
                          >
                            Verify
                          </Button>
                        )}

                        {incident.status === "in_progress" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              updateIncidentStatus(
                                incident,
                                "resolved"
                              )
                            }
                          >
                            Resolve
                          </Button>
                        )}

                        {incident.status === "resolved" && (
                          <span className="rounded-xl px-3 py-2 text-sm text-emerald-300">
                            Resolved
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {error && (
          <p className="mt-6 text-sm text-rose-300">
            {error}
          </p>
        )}
      </main>
    </div>
  );
}
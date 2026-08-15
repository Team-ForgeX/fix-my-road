import dynamic from "next/dynamic";
import type { Metadata } from "next";
import Link from "next/link";

import { Navbar } from "../../components/navbar/Navbar";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { createClient } from "../../lib/supabase/server";

const IncidentMap = dynamic(
  () =>
    import("../../components/incident/IncidentMap").then(
      (mod) => mod.IncidentMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[500px] w-full items-center justify-center rounded-2xl border border-slate-800 bg-slate-900">
        <p className="text-slate-400">Loading map...</p>
      </div>
    ),
  }
);

export const metadata: Metadata = {
  title: "All Incidents | Fix My Road",
  description: "Browse reported road incidents.",
};

export default async function IncidentsPage() {
  const supabase = createClient();

  const { data: incidents, error } = await supabase
    .from("incidents")
    .select("*")
    .order("last_reported_at", { ascending: false });
    

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />

        <main className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
          <Card className="p-8">
            <p className="text-red-400">
              Failed to load incidents.
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {error.message}
            </p>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <main className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <div className="space-y-6">

          <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-soft">
            <p className="text-sm uppercase tracking-[0.3em] text-teal-300">
              Road incidents
            </p>

            <h1 className="mt-3 text-3xl font-semibold">
              All reported incidents
            </h1>

            <p className="mt-2 text-slate-400">
              Browse road problems reported by citizens.
            </p>
          </div>
                      {/* Incident Map */}
          <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-5 shadow-soft">
            <div className="mb-4">
              <p className="text-sm uppercase tracking-[0.3em] text-teal-300">
                Incident map
              </p>

              <h2 className="mt-2 text-xl font-semibold text-white">
                Road damage locations
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Locations of reported road incidents.
              </p>
            </div>

            <IncidentMap incidents={incidents ?? []} />
          </div>
          {!incidents || incidents.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-slate-400">
                No incidents have been reported yet.
              </p>
            </Card>
          ) : (
            <div className="grid gap-5">
              {incidents.map((incident) => (
                <Card key={incident.id} className="space-y-4">

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        {incident.title}
                      </h2>

                      <p className="mt-1 text-sm text-slate-400">
                        {incident.problem_type}
                        {incident.city
                          ? ` • ${incident.city}`
                          : ""}
                      </p>
                    </div>

                    <Badge>
                      {incident.status.replace("_", " ")}
                    </Badge>
                  </div>

                  <p className="text-sm leading-6 text-slate-400">
                    {incident.description ||
                      "No description provided."}
                  </p>

                  <div className="grid gap-3 text-sm text-slate-400 sm:grid-cols-3">
                    <p>
                      Severity:{" "}
                      <span className="text-slate-200">
                        {incident.severity}
                      </span>
                    </p>

                    <p>
                      Reports:{" "}
                      <span className="text-slate-200">
                        {incident.report_count}
                      </span>
                    </p>

                    <p>
                      Location:{" "}
                      <span className="text-slate-200">
                        {incident.locality || incident.city || "Unknown"}
                      </span>
                    </p>
                  </div>

                  <Link
                    href={`/incidents/${incident.id}`}
                    className="inline-flex text-sm font-semibold text-teal-300 hover:text-teal-200"
                  >
                    View incident details →
                  </Link>

                </Card>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
import type { Metadata } from "next";
import dynamic from "next/dynamic";

import { Navbar } from "../../components/navbar/Navbar";
import { IncidentBrowser } from "../../components/incident/IncidentBrowser";
import { getIncidents } from "../../lib/incidents";

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
  title: "Road Incidents | Fix My Road",
  description: "View reported road issues and their current status.",
};

export default async function ReportsPage() {
  const incidents = await getIncidents();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <main className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <div className="space-y-6">

          {/* Header */}
          <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-soft">
            <p className="text-sm uppercase tracking-[0.3em] text-teal-300">
              Road incidents
            </p>

            <h1 className="mt-3 text-3xl font-semibold text-white">
              Reported issues
            </h1>

            <p className="mt-2 text-slate-400">
              View road problems reported by citizens and track their current
              status.
            </p>
          </div>

          {/* Map */}
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

            <IncidentMap incidents={incidents} />
          </div>

          {/* Search + filters + incident cards */}
          <IncidentBrowser incidents={incidents} />

        </div>
      </main>
    </div>
  );
}
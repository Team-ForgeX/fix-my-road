import { getIncidents } from "../../lib/incidents";
import { IncidentBrowser } from "../../components/incident/IncidentBrowser";

export default async function TestIncidentsPage() {
  const incidents = await getIncidents();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.3em] text-teal-300">
            Road incidents
          </p>

          <h1 className="mt-3 text-3xl font-semibold">
            Reported Issues
          </h1>

          <p className="mt-2 text-slate-400">
            Browse and filter road problems reported by citizens.
          </p>
        </div>

        <IncidentBrowser incidents={incidents} />
      </main>
    </div>
  );
}
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Navbar } from "../../../components/navbar/Navbar";
import { Badge } from "../../../components/ui/Badge";
import { Card } from "../../../components/ui/Card";
import { createClient } from "../../../lib/supabase/server";

type PageProps = {
  params: {
    id: string;
  };
};

export const metadata: Metadata = {
  title: "Incident Details | Fix My Road",
  description: "View details of a reported road incident.",
};

export default async function IncidentDetailsPage({
  params,
}: PageProps) {
  const supabase = createClient();

  const { data: incident, error } = await supabase
    .from("incidents")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !incident) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <main className="mx-auto max-w-5xl px-6 py-10 lg:px-8">
        <div className="space-y-6">

          {/* Back button */}
          <Link
            href="/reports"
            className="inline-flex text-sm font-semibold text-teal-300 hover:text-teal-200"
          >
            ← Back to incidents
          </Link>

          {/* Incident details */}
          <Card className="space-y-6 p-8">

            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-teal-300">
                  Road incident
                </p>

                <h1 className="mt-3 text-3xl font-semibold text-white">
                  {incident.title}
                </h1>
              </div>

              <Badge variant="warning">
                {incident.status.replace("_", " ")}
              </Badge>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                Description
              </h2>

              <p className="mt-2 leading-7 text-slate-300">
                {incident.description || "No description provided."}
              </p>
            </div>

            {/* Incident information */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Problem type
                </p>

                <p className="mt-2 text-sm font-medium text-white">
                  {incident.problem_type}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Severity
                </p>

                <p className="mt-2 text-sm font-medium text-white">
                  {incident.severity}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Reports
                </p>

                <p className="mt-2 text-sm font-medium text-white">
                  {incident.report_count}
                </p>
              </div>

            </div>

            {/* Location */}
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                Location
              </h2>

              <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                <p className="text-white">
                  {incident.address || "Address not available"}
                </p>

                <p className="mt-2 text-sm text-slate-400">
                  {incident.locality || ""}
                  {incident.locality && incident.city ? ", " : ""}
                  {incident.city || ""}
                </p>

                <p className="mt-3 text-xs text-slate-500">
                  Coordinates: {incident.latitude}, {incident.longitude}
                </p>
              </div>
            </div>

            {/* Dates */}
            <div className="grid gap-4 sm:grid-cols-2">

              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Reported
                </p>

                <p className="mt-2 text-sm text-slate-300">
                  {new Date(incident.created_at).toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Last updated
                </p>

                <p className="mt-2 text-sm text-slate-300">
                  {new Date(incident.updated_at).toLocaleString()}
                </p>
              </div>

            </div>

          </Card>
        </div>
      </main>
    </div>
  );
}
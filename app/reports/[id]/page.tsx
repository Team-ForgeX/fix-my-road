"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "../../../components/navbar/Navbar";
import { ReportTimeline } from "../../../components/report/ReportTimeline";
import { useAuth } from "../../../components/AuthContext";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import dynamic from "next/dynamic";

const ReportLeafletMap = dynamic(() => import("../../../components/map/ReportLeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 w-full items-center justify-center rounded-2xl bg-slate-900 text-sm text-slate-400">
      Loading map...
    </div>
  )
});

export default function ReportDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, ready, reports } = useAuth();
  const reportId = params?.id as string;
  const report = reports.find((item) => item.id === reportId);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
    }
  }, [ready, router, user]);

  if (!ready || !user) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  if (!report || report.user_id !== user.id) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <main className="mx-auto max-w-4xl px-6 py-10 lg:px-8">
          <Card className="space-y-6 p-10 text-center">
            <p className="text-lg text-slate-400">Report not found or you do not have access to it.</p>
            <Button onClick={() => router.push("/reports")}>Back to my reports</Button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="space-y-8">
          <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-soft">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-teal-300">Report details</p>
                <h1 className="mt-3 text-3xl font-semibold text-white">Report {report.id}</h1>
                <p className="mt-2 text-slate-400">Problem: {report.title}</p>
              </div>
              <div className="space-y-1 rounded-3xl border border-slate-800/80 bg-slate-950/80 p-4 text-sm text-slate-400">
                <p>Status: {report.status.replace("_", " ")}</p>
                <p>Incident: {report.incident_id ?? "Not linked"}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-6">
                <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Description</p>
                <p className="mt-4 leading-7 text-slate-300">{report.description}</p>
              </div>
              <div className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-6">
                <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Evidence</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {report.media.length === 0 ? (
                    <p className="text-slate-400">No evidence uploaded for this report yet.</p>
                  ) : (
                    report.media.map((media) => (
                      <div key={media.id} className="overflow-hidden rounded-3xl bg-slate-900">
                        <img src={media.thumbnail_url} alt={media.file_name} className="h-52 w-full object-cover" />
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-6 space-y-4">
                <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Location & Leaflet Map</p>
                <div className="space-y-1.5 text-sm text-slate-300">
                  <p className="font-medium text-white">{report.address}</p>
                  {report.landmark ? <p className="text-slate-400">Landmark: {report.landmark}</p> : null}
                  <p className="text-slate-400">{report.locality}, {report.city}</p>
                  <p className="text-xs text-teal-300 font-mono">
                    GPS Coordinates: {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
                  </p>
                </div>
                <ReportLeafletMap
                  latitude={report.latitude}
                  longitude={report.longitude}
                  title={report.title}
                  address={report.address}
                  className="h-64 w-full"
                />
              </div>
            </div>

            <div className="space-y-6">
              <ReportTimeline status={report.processing_state} />
              <div className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-6">
                <p className="text-sm uppercase tracking-[0.28em] text-slate-500">ML insights</p>
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <p>Detected problem type: {report.ml_analysis?.problem_type ?? "Pending analysis"}</p>
                  <p>Severity: {report.ml_analysis?.severity ?? report.severity ?? "medium"}</p>
                  <p>Confidence: {report.ml_analysis ? `${Math.round(report.ml_analysis.confidence * 100)}%` : "—"}</p>
                  <p>Linked incident: {report.incident_id ?? "None"}</p>
                  <p>Duplicate match: {report.is_duplicate ? "Yes (linked to nearby incident)" : "No (new incident)"}</p>
                  <p>Other users reporting same incident: {report.report_count ?? 1}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

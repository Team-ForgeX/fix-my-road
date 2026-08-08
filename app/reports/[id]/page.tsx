import { notFound } from "next/navigation";
import { Navbar } from "../../../components/navbar/Navbar";
import { ReportTimeline } from "../../../components/report/ReportTimeline";
import { reports } from "../../../lib/mockData";

type Params = {
  params: {
    id: string;
  };
};

export default function ReportDetailsPage({ params }: Params) {
  const report = reports.find((item) => item.id === params.id);
  if (!report) return notFound();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-10 lg:px-8">
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
              <div className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-6">
                <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Location</p>
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <p>{report.address}</p>
                  {report.landmark ? <p>Landmark: {report.landmark}</p> : null}
                  <p>{report.locality}, {report.city}</p>
                  <p>Coordinates: {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <ReportTimeline status={report.processing_state} />
              <div className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-6">
                <p className="text-sm uppercase tracking-[0.28em] text-slate-500">ML insights</p>
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <p>Detected problem type: Garbage accumulation</p>
                  <p>Severity: {report.severity ?? "medium"}</p>
                  <p>Confidence: 86%</p>
                  <p>Linked incident: {report.incident_id ?? "None"}</p>
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

"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import { Navbar } from "../../../components/navbar/Navbar";
import { ReportTimeline } from "../../../components/report/ReportTimeline";
import { useAuth } from "../../../components/AuthContext";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";

export default function ReportDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const { user, ready, reports } = useAuth();

  const reportId = params?.id as string;

  const report = reports.find(
    (item) => item.id === reportId
  );

  useEffect(() => {
    if (!ready) return;

    if (!user) {
      router.replace("/login");
    }
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <div className="min-h-screen bg-slate-950" />
    );
  }

  if (!report || report.user_id !== user.id) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />

        <main className="mx-auto max-w-4xl px-6 py-10 lg:px-8">
          <Card className="space-y-6 p-10 text-center">
            <p className="text-lg text-slate-400">
              Report not found or you do not have access to it.
            </p>

            <Button onClick={() => router.push("/reports")}>
              Back to reports
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <main className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <div className="space-y-8">

          {/* Header */}
          <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-soft">
            <p className="text-sm uppercase tracking-[0.3em] text-teal-300">
              Report details
            </p>

            <h1 className="mt-3 text-3xl font-semibold">
              Report {report.id}
            </h1>

            <p className="mt-2 text-slate-400">
              Submitted on{" "}
              {new Date(report.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">

            {/* Main information */}
            <div className="space-y-6">

              {/* Description */}
              <Card className="space-y-4 p-6">
                <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
                  Description
                </p>

                <p className="leading-7 text-slate-300">
                  {report.description ||
                    "No description provided."}
                </p>
              </Card>

              {/* Location */}
              <Card className="space-y-4 p-6">
                <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
                  Location
                </p>

                <div className="space-y-3 text-sm text-slate-300">

                  {report.address && (
                    <p>
                      <span className="text-slate-500">
                        Address:
                      </span>{" "}
                      {report.address}
                    </p>
                  )}

                  {report.landmark && (
                    <p>
                      <span className="text-slate-500">
                        Landmark:
                      </span>{" "}
                      {report.landmark}
                    </p>
                  )}

                  {report.locality && (
                    <p>
                      <span className="text-slate-500">
                        Locality:
                      </span>{" "}
                      {report.locality}
                    </p>
                  )}

                  

                  {report.city && (
                    <p>
                      <span className="text-slate-500">
                        City:
                      </span>{" "}
                      {report.city}
                    </p>
                  )}

                  
                  <p>
                    <span className="text-slate-500">
                      Coordinates:
                    </span>{" "}
                    {Number(report.latitude).toFixed(5)},{" "}
                    {Number(report.longitude).toFixed(5)}
                  </p>
                </div>
              </Card>

              {/* Processing information */}
              <Card className="space-y-4 p-6">
                <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
                  Processing
                </p>

                <div className="space-y-3 text-sm text-slate-300">

                  <p>
                    <span className="text-slate-500">
                      Processing state:
                    </span>{" "}
                    {report.processing_state ||
                      "Pending"}
                  </p>

                  

                  <p>
                    <span className="text-slate-500">
                      Duplicate:
                    </span>{" "}
                    {report.is_duplicate
                      ? "Yes"
                      : "No"}
                  </p>

                  {report.incident_id && (
                    <p>
                      <span className="text-slate-500">
                        Linked incident:
                      </span>{" "}
                      {report.incident_id}
                    </p>
                  )}

                  {report.duplicate_of_report_id && (
                    <p>
                      <span className="text-slate-500">
                        Duplicate of:
                      </span>{" "}
                      {report.duplicate_of_report_id}
                    </p>
                  )}
                </div>
              </Card>

            </div>

            {/* Sidebar */}
            <div className="space-y-6">

              <ReportTimeline
                status={report.processing_state}
              />

              <Card className="space-y-4 p-6">
                <p className="text-sm uppercase tracking-[0.28em] text-teal-300">
                  Report status
                </p>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-lg font-semibold text-white">
                    {report.processing_state ||
                      "Pending"}
                  </p>

                  <p className="mt-2 text-sm text-slate-400">
                    Your report is being processed by
                    the Fix My Road system.
                  </p>
                </div>
              </Card>

              <Button
                variant="secondary"
                className="w-full"
                onClick={() => router.push("/reports")}
              >
                Back to reports
              </Button>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
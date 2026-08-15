import Link from "next/link";
import { MapPin, Calendar, AlertTriangle, Link as LinkIcon } from "lucide-react";
import type { Report } from "../../types/report";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";

const statusVariant: Record<Report["status"], "success" | "warning" | "danger" | "default"> = {
  open: "warning",
  in_progress: "default",
  resolved: "success",
  duplicate: "danger"
};

export function ReportCard({ report }: { report: Report }) {
  const locationParts = [
    report.address,
    report.landmark ? `Near ${report.landmark}` : null,
    report.city || report.locality
  ].filter(Boolean);

  const fullLocation = locationParts.join(" • ");

  return (
    <Card className="group overflow-hidden space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-lg font-semibold text-white">{report.title}</p>
          <div className="flex items-start gap-2 text-sm text-teal-300">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
            <span className="leading-snug">{fullLocation || "Location details unavailable"}</span>
          </div>
        </div>
        <Badge variant={statusVariant[report.status]}>{report.status.replace("_", " ")}</Badge>
      </div>

      <div className="grid gap-3 pt-2 text-sm text-slate-400 border-t border-slate-800/60 sm:grid-cols-3">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-slate-500" />
          <span>{new Date(report.created_at).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="h-4 w-4 text-slate-500" />
          <span>Severity: <strong className="text-slate-300 capitalize">{report.severity ?? "N/A"}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <LinkIcon className="h-4 w-4 text-slate-500" />
          <span>Incident: <strong className="text-slate-300">{report.incident_id ?? "None"}</strong></span>
        </div>
      </div>

      <div>
        <Link
          href={`/reports/${report.id}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-teal-300 hover:text-teal-200 transition-colors"
        >
          View details →
        </Link>
      </div>
    </Card>
  );
}


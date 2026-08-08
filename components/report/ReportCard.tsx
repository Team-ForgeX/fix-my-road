import Link from "next/link";
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
  return (
    <Card className="group overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-white">{report.title}</p>
          <p className="text-sm text-slate-400">{report.address}</p>
        </div>
        <Badge variant={statusVariant[report.status]}>{report.status.replace("_", " ")}</Badge>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <p className="text-sm text-slate-400">{new Date(report.created_at).toLocaleDateString()}</p>
        <p className="text-sm text-slate-400">Severity: {report.severity ?? "N/A"}</p>
        <p className="text-sm text-slate-400">Linked incident: {report.incident_id ?? "None"}</p>
      </div>
      <Link
        href={`/reports/${report.id}`}
        className="mt-5 inline-flex text-sm font-semibold text-teal-300 hover:text-teal-200"
      >
        View details →
      </Link>
    </Card>
  );
}

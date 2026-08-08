import type { Report } from "../../types/report";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";

const statusVariant: Record<Report["status"], "success" | "warning" | "danger" | "default"> = {
  open: "warning",
  in_progress: "default",
  resolved: "success",
  duplicate: "danger"
};

export function RecentReports({ reports }: { reports: Report[] }) {
  return (
    <div className="grid gap-4">
      {reports.map((report) => (
        <Card key={report.id} className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-semibold text-white">{report.title}</p>
              <p className="text-sm text-slate-400">{new Date(report.created_at).toLocaleDateString()}</p>
            </div>
            <Badge variant={statusVariant[report.status]}>{report.status.replace("_", " ")}</Badge>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <p className="text-sm text-slate-400">Location: {report.address}</p>
            <p className="text-sm text-slate-400">Severity: {report.severity ?? "N/A"}</p>
            <p className="text-sm text-slate-400">Reports linked: {report.report_count ?? 1}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

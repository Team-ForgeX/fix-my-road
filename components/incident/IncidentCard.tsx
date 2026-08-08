import Link from "next/link";
import type { Incident } from "../../types/incident";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";

const statusVariant: Record<Incident["status"], "success" | "default" | "warning"> = {
  open: "warning",
  assigned: "default",
  in_progress: "default",
  resolved: "success"
};

export function IncidentCard({ incident }: { incident: Incident }) {
  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{incident.title}</h3>
          <p className="text-sm text-slate-400">{incident.problem_type} • {incident.city}</p>
        </div>
        <Badge variant={statusVariant[incident.status]}>{incident.status.replace("_", " ")}</Badge>
      </div>
      <p className="text-sm leading-6 text-slate-400">{incident.description}</p>
      <div className="grid gap-3 sm:grid-cols-3 text-sm text-slate-400">
        <p>Reports: {incident.report_count}</p>
        <p>Severity: {incident.severity}</p>
        <p>Updated: {new Date(incident.updated_at).toLocaleDateString()}</p>
      </div>
      <Link href={`/incidents/${incident.id}`} className="text-sm font-semibold text-teal-300 hover:text-teal-200">
        View incident details →
      </Link>
    </Card>
  );
}

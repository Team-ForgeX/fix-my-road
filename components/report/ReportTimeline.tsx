import { Badge } from "../ui/Badge";

const steps = [
  "Submitted",
  "Analyzing",
  "Issue Identified",
  "Assigned",
  "In Progress",
  "Resolved"
];

const activeIndexMap: Record<string, number> = {
  submitted: 0,
  pending: 0,
  processed: 2,
  incident_matched: 2,
  assigned: 3,
  in_progress: 4,
  resolved: 5,
  linked: 2
};

export function ReportTimeline({ status }: { status: string }) {
  const activeIndex = activeIndexMap[status] ?? 1;

  return (
    <div className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-6">
      <div className="mb-4 flex items-center justify-between text-sm uppercase tracking-[0.24em] text-slate-500">
        <span>Report progress</span>
        <Badge>{status.replace("_", " ")}</Badge>
      </div>
      <div className="space-y-5">
        {steps.map((label, index) => {
          const active = index <= activeIndex;
          return (
            <div key={label} className="flex items-start gap-3">
              <div className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-700 text-[10px]">
                <span className={active ? "bg-teal-400 text-slate-950" : "bg-slate-800 text-slate-500"}>{index + 1}</span>
              </div>
              <div>
                <p className={active ? "text-white" : "text-slate-500"}>{label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

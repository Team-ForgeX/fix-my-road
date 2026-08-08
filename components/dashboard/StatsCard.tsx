import type { ReactNode } from "react";
import { Card } from "../ui/Card";

export function StatsCard({ title, value, children }: { title: string; value: string; children?: ReactNode }) {
  return (
    <Card className="space-y-3">
      <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{title}</p>
      <div className="flex items-center justify-between gap-4">
        <p className="text-3xl font-semibold text-white">{value}</p>
        {children}
      </div>
    </Card>
  );
}

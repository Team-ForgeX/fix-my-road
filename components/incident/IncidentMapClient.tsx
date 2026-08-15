"use client";

import dynamic from "next/dynamic";
import type { Incident } from "../../types/incident";

const IncidentMap = dynamic(
  () => import("./IncidentMap").then((mod) => mod.IncidentMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[500px] items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-400">
        Loading map...
      </div>
    ),
  }
);

export function IncidentMapClient({
  incidents,
}: {
  incidents: Incident[];
}) {
  return <IncidentMap incidents={incidents} />;
}
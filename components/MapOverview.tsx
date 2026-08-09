"use client";

import { useMemo, useState } from "react";
import type { Report } from "../types/report";
import { Badge } from "./ui/Badge";

const bounds = {
  minLat: 28.60,
  maxLat: 28.71,
  minLng: 77.10,
  maxLng: 77.21
};

const toPercent = (value: number, min: number, max: number) => Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

const severityColor: Record<Report["severity"], string> = {
  low: "bg-emerald-500/90",
  medium: "bg-amber-400/90",
  high: "bg-rose-500/90"
};

export function MapOverview({ reports, onSelect }: { reports: Report[]; onSelect?: (report: Report) => void }) {
  const [hoverId, setHoverId] = useState<string | null>(null);

  const hotspots = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach((report) => {
      counts[report.locality] = (counts[report.locality] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [reports]);

  return (
    <div className="rounded-[2rem] border border-slate-800/80 bg-slate-950/80 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-teal-300">Damage map</p>
          <h2 className="text-xl font-semibold text-white">Reports mapped to streets</h2>
        </div>
        <Badge className="rounded-full border border-slate-700 text-slate-200 bg-slate-800/70">
          {reports.length} markers
        </Badge>
      </div>

      <div className="relative mt-6 h-[320px] overflow-hidden rounded-[1.75rem] border border-slate-800/90 bg-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_30%),radial-gradient(circle_at_20%_30%,_rgba(16,185,129,0.10),_transparent_18%)]" />
        <div className="absolute inset-0 opacity-40 bg-[linear-gradient(135deg,_rgba(148,163,184,0.08)_25%,_transparent_25%_calc(25%+1px),_transparent_50%,rgba(148,163,184,0.08)_50%,rgba(148,163,184,0.08)_75%,_transparent_75%_calc(75%+1px),_transparent)]" />
        <div className="relative h-full w-full">
          {reports.map((report) => {
            const left = toPercent(report.longitude, bounds.minLng, bounds.maxLng);
            const top = 100 - toPercent(report.latitude, bounds.minLat, bounds.maxLat);
            return (
              <button
                key={report.id}
                type="button"
                onClick={() => onSelect?.(report)}
                onMouseEnter={() => setHoverId(report.id)}
                onMouseLeave={() => setHoverId(null)}
                className="absolute flex items-center justify-center rounded-full border-2 border-slate-100/10 text-xs font-semibold text-white shadow-lg transition-transform duration-200 hover:-translate-y-1"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  transform: "translate(-50%, -50%)",
                  width: hoverId === report.id ? 40 : 32,
                  height: hoverId === report.id ? 40 : 32,
                  backgroundColor: report.severity ? (report.severity === "high" ? "#fb7185" : report.severity === "medium" ? "#f59e0b" : "#22c55e") : "#94a3b8"
                }}
              >
                {report.id.replace("R", "")}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-4">
          <p className="text-sm text-slate-400">Nearby hotspots</p>
          <div className="mt-3 space-y-2">
            {hotspots.length > 0 ? (
              hotspots.map(([location, count]) => (
                <div key={location} className="flex items-center justify-between rounded-2xl bg-slate-900/80 px-4 py-3">
                  <p className="text-sm text-slate-200">{location}</p>
                  <span className="text-xs uppercase tracking-[0.24em] text-slate-400">{count} reports</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No reports to show on the map yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-4">
          <p className="text-sm text-slate-400">Status guide</p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-3 w-3 rounded-full bg-rose-500" />
              <p className="text-sm text-slate-200">High severity or active issues</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-3 w-3 rounded-full bg-amber-400" />
              <p className="text-sm text-slate-200">Medium severity needs follow-up</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-3 w-3 rounded-full bg-emerald-500" />
              <p className="text-sm text-slate-200">Low priority or informational</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

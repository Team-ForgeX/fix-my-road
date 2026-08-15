"use client";

import { useMemo, useState } from "react";
import type {
  Incident,
  IncidentSeverity,
  IncidentStatus,
} from "../../types/incident";
import { IncidentCard } from "./IncidentCard";
import { IncidentMap } from "./IncidentMap";

type Props = {
  incidents: Incident[];
};

export function IncidentExplorer({ incidents }: Props) {
  const [status, setStatus] = useState<"all" | IncidentStatus>("all");
  const [severity, setSeverity] =
    useState<"all" | IncidentSeverity>("all");
  const [search, setSearch] = useState("");

  const filteredIncidents = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return incidents.filter((incident) => {
      const matchesStatus =
        status === "all" || incident.status === status;

      const matchesSeverity =
        severity === "all" || incident.severity === severity;

      const matchesSearch =
        searchTerm === "" ||
        incident.title.toLowerCase().includes(searchTerm) ||
        incident.problem_type.toLowerCase().includes(searchTerm) ||
        (incident.address ?? "").toLowerCase().includes(searchTerm) ||
        (incident.locality ?? "").toLowerCase().includes(searchTerm) ||
        (incident.city ?? "").toLowerCase().includes(searchTerm);

      return matchesStatus && matchesSeverity && matchesSearch;
    });
  }, [incidents, status, severity, search]);

  const clearFilters = () => {
    setStatus("all");
    setSeverity("all");
    setSearch("");
  };

  return (
    <div className="space-y-6">

      {/* Filters */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="grid gap-4 md:grid-cols-3">

          {/* Search */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Search
            </label>

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search incidents..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none placeholder:text-slate-500 focus:border-teal-400"
            />
          </div>

          {/* Status */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Status
            </label>

            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as "all" | IncidentStatus)
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-teal-400"
            >
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Severity */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Severity
            </label>

            <select
              value={severity}
              onChange={(event) =>
                setSeverity(
                  event.target.value as "all" | IncidentSeverity
                )
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-teal-400"
            >
              <option value="all">All severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

        </div>
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          Showing{" "}
          <span className="font-semibold text-white">
            {filteredIncidents.length}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-white">
            {incidents.length}
          </span>{" "}
          incidents
        </p>

        {(status !== "all" ||
          severity !== "all" ||
          search !== "") && (
          <button
            onClick={clearFilters}
            className="text-sm font-semibold text-teal-300 hover:text-teal-200"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* MAP */}
      <section>
        <div className="mb-3">
          <h2 className="text-xl font-semibold text-white">
            Incident Map
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Map showing the currently filtered incidents.
          </p>
        </div>

        <IncidentMap incidents={filteredIncidents} />
      </section>

      {/* CARDS */}
      <section>
        <div className="mb-3">
          <h2 className="text-xl font-semibold text-white">
            Incidents
          </h2>
        </div>

        {filteredIncidents.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
            <h2 className="text-lg font-semibold text-white">
              No incidents found
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <div className="grid gap-5">
            {filteredIncidents.map((incident) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
              />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
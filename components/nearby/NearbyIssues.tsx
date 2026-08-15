"use client";

import Link from "next/link";
import { LocateFixed, MapPin, Navigation, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { supabase } from "../../lib/supabaseService";

const severityVariant = {
  low: "default",
  medium: "warning",
  high: "danger",
  critical: "danger"
} as const;

const statusVariant = {
  open: "warning",
  assigned: "default",
  in_progress: "default",
  resolved: "success",
  duplicate: "danger"
} as const;

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

export function NearbyIssues() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [geoMessage, setGeoMessage] = useState("Use my current location");
  const [activeTab, setActiveTab] = useState<"all" | "incidents" | "reports">("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);

  const fetchNearbyData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch incidents
      const { data: incidentsData } = await supabase
        .from("incidents")
        .select("*")
        .order("updated_at", { ascending: false });

      if (incidentsData) {
        setIncidents(incidentsData);
      }

      // 2. Fetch reports
      const { data: reportsData } = await supabase
        .from("reports")
        .select("*")
        .order("updated_at", { ascending: false });

      if (reportsData) {
        setReports(reportsData);
      }
    } catch (err) {
      console.error("Error loading nearby data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNearbyData();
  }, []);

  // Compute unique locations from data dynamically
  const locationOptions = useMemo(() => {
    const locs = new Set<string>();
    incidents.forEach((i) => {
      if (i.locality) locs.add(i.locality);
    });
    reports.forEach((r) => {
      if (r.locality) locs.add(r.locality);
    });
    return [
      { id: "all", label: "All locations" },
      ...Array.from(locs).map((l) => ({ id: l, label: l }))
    ];
  }, [incidents, reports]);

  // Combine and format the data items
  const formattedItems = useMemo(() => {
    const items: any[] = [];

    // Add incidents
    if (activeTab === "all" || activeTab === "incidents") {
      incidents.forEach((i) => {
        items.push({
          id: i.id,
          type: "incident",
          title: i.title,
          problem_type: i.problem_type || "General",
          severity: i.severity || "medium",
          status: i.status || "open",
          description: i.description || "",
          address: i.address || "",
          locality: i.locality || "Unknown",
          city: i.city || "",
          report_count: i.report_count || 1,
          latitude: Number(i.latitude),
          longitude: Number(i.longitude),
          updated_at: i.updated_at
        });
      });
    }

    // Add reports
    if (activeTab === "all" || activeTab === "reports") {
      reports.forEach((r) => {
        items.push({
          id: r.id,
          type: "report",
          title: r.address ? `Issue reported at ${r.address}` : "User Report",
          problem_type: "Raw User Submission",
          severity: r.severity || "medium",
          status: r.processing_state || "open",
          description: r.description || "",
          address: r.address || "",
          locality: r.locality || "Unknown",
          city: r.city || "",
          report_count: 1,
          latitude: Number(r.latitude),
          longitude: Number(r.longitude),
          updated_at: r.updated_at
        });
      });
    }

    return items;
  }, [incidents, reports, activeTab]);

  // Filter items by location, severity, and status
  const filteredItems = useMemo(() => {
    return formattedItems.filter((item) => {
      const matchesLoc =
        selectedLocation === "all" ||
        item.locality.toLowerCase() === selectedLocation.toLowerCase();
      const matchesSeverity =
        filterSeverity === "all" ||
        item.severity.toLowerCase() === filterSeverity.toLowerCase();
      const matchesStatus =
        filterStatus === "all" ||
        item.status.toLowerCase() === filterStatus.toLowerCase();
      return matchesLoc && matchesSeverity && matchesStatus;
    });
  }, [formattedItems, selectedLocation, filterSeverity, filterStatus]);

  const activeLabel =
    locationOptions.find((option) => option.id === selectedLocation)?.label ?? "Selected area";

  const handleUseCurrentLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoMessage("Location access is unavailable in this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        if (formattedItems.length === 0) {
          setGeoMessage("No nearby reports found.");
          return;
        }

        const nearestItem = formattedItems.reduce(
          (closest, item) => {
            const distance = haversineDistance(latitude, longitude, item.latitude, item.longitude);
            if (distance < closest.distance) {
              return { item, distance };
            }
            return closest;
          },
          { item: formattedItems[0], distance: Number.POSITIVE_INFINITY }
        ).item;

        setSelectedLocation(nearestItem.locality);
        setGeoMessage(`Closest match: ${nearestItem.locality}`);
      },
      () => {
        setGeoMessage("Location permission was blocked. Please choose an area manually.");
      }
    );
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-soft">
        <p className="text-sm uppercase tracking-[0.3em] text-teal-300">Nearby reports</p>
        <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
          Road and infrastructure issues near your selected area
        </h1>
        <p className="mt-3 max-w-3xl text-slate-300">
          View active local issues for potholes, streetlight outages, garbage accumulation, and water leaks in the neighborhoods you care about most.
        </p>
      </Card>

      <Card className="rounded-[2rem] border border-slate-800/80 bg-slate-950/80 p-6 shadow-soft">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-teal-300">
              <SlidersHorizontal className="h-4 w-4" />
              Filter by Location & Type
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Showing results for <span className="font-semibold text-white">{activeLabel}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-teal-400/30 bg-teal-500/10 px-4 py-2 text-sm font-semibold text-teal-200 transition hover:border-teal-300 hover:bg-teal-500/20"
          >
            <LocateFixed className="h-4 w-4" />
            {geoMessage}
          </button>
        </div>

        {/* Localities select chips */}
        <div className="mt-5 flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
          {locationOptions.map((option) => {
            const isSelected = selectedLocation === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedLocation(option.id)}
                className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                  isSelected
                    ? "border-teal-400 bg-teal-500/15 text-white"
                    : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {/* Tab selection & Severity/Status filters */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-xs font-medium uppercase tracking-[0.2em] text-slate-400 mb-2">Category Type</label>
            <div className="flex gap-2">
              {(["all", "incidents", "reports"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium border ${
                    activeTab === tab
                      ? "bg-slate-800 text-white border-slate-600"
                      : "bg-slate-900 text-slate-400 border-slate-800"
                  }`}
                >
                  {tab === "all" ? "ALL" : tab === "incidents" ? "INCIDENTS" : "RAW REPORTS"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-[0.2em] text-slate-400 mb-2">Severity</label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 focus:border-teal-500 focus:outline-none"
            >
              <option value="all">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-[0.2em] text-slate-400 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 focus:border-teal-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="assigned">Assigned / In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_0.9fr]">
        <div className="space-y-5">
          {isLoading ? (
            <Card className="rounded-[1.75rem] border border-slate-800 bg-slate-950/80 p-8 text-center text-slate-300">
              Loading nearby reports...
            </Card>
          ) : filteredItems.length > 0 ? (
            filteredItems.map((issue) => (
              <Card key={issue.id} className="rounded-[1.75rem] border border-slate-800/80 bg-slate-950/80 p-6 shadow-soft">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">
                      {issue.problem_type}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-white">{issue.title}</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={severityVariant[issue.severity as keyof typeof severityVariant] || "default"}>
                      {issue.severity}
                    </Badge>
                    <Badge variant={statusVariant[issue.status as keyof typeof statusVariant] || "default"}>
                      {issue.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>

                {issue.description && (
                  <p className="mt-4 text-slate-300 text-sm leading-relaxed">{issue.description}</p>
                )}

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Location</p>
                    <p className="mt-2 flex items-start gap-2 text-xs text-slate-200">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 text-teal-300 flex-shrink-0" />
                      {issue.address || "No address details"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Area</p>
                    <p className="mt-2 text-xs text-slate-200">{issue.locality}, {issue.city}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Reports</p>
                    <p className="mt-2 text-xs text-slate-200">{issue.report_count} reports linked</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-5">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Navigation className="h-3.5 w-3.5 text-teal-300" />
                    Last updated {new Date(issue.updated_at).toLocaleDateString()}
                  </div>
                  <Link
                    href={`/report?location=${encodeURIComponent(issue.address)}`}
                    className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-500/10 px-4 py-2 text-xs font-semibold text-teal-200 transition hover:border-teal-300 hover:bg-teal-500/20"
                  >
                    Report nearby issue
                  </Link>
                </div>
              </Card>
            ))
          ) : (
            <Card className="rounded-[1.75rem] border border-slate-800 bg-slate-950/80 p-8 text-center text-slate-300">
              No issues found matching your filters. Try another area or tab.
            </Card>
          )}
        </div>

        <aside className="space-y-5">
          <Card className="rounded-[1.75rem] border border-slate-800/80 bg-slate-900/80 p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.2em] text-teal-300 font-bold">Location Overview</p>
            <h3 className="mt-3 text-lg font-semibold text-white">{activeLabel}</h3>
            <ul className="mt-4 space-y-3 text-xs text-slate-300">
              <li className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span>Active Incidents</span>
                <strong className="text-white">
                  {incidents.filter((i) => selectedLocation === "all" || i.locality === selectedLocation).length}
                </strong>
              </li>
              <li className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span>Raw User Reports</span>
                <strong className="text-white">
                  {reports.filter((r) => selectedLocation === "all" || r.locality === selectedLocation).length}
                </strong>
              </li>
              <li className="flex items-center justify-between">
                <span>High Severity Items</span>
                <strong className="text-red-400 font-bold">
                  {filteredItems.filter((item) => item.severity === "high" || item.severity === "critical").length}
                </strong>
              </li>
            </ul>
          </Card>

          <Card className="rounded-[1.75rem] border border-slate-800/80 bg-slate-950/80 p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold">Need to report a new issue?</p>
            <h3 className="mt-3 text-lg font-semibold text-white">Help improve local infrastructure</h3>
            <p className="mt-3 text-xs text-slate-400 leading-relaxed">
              Add a new location pin, share details, and help nearby teams act faster on reported conditions.
            </p>
            <Link
              href="/report"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-teal-400 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-teal-300"
            >
              Submit an issue
            </Link>
          </Card>
        </aside>
      </div>
    </div>
  );
}

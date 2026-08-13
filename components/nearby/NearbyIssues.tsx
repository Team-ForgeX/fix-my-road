"use client";

import Link from "next/link";
import { LocateFixed, MapPin, Navigation, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { incidentList } from "../../lib/mockData";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";

const locationOptions = [
  { id: "all", label: "All locations" },
  { id: "Sector 7", label: "Sector 7" },
  { id: "City Mall", label: "City Mall" },
  { id: "Sector 4", label: "Sector 4" }
] as const;

const severityVariant = {
  low: "default",
  medium: "warning",
  high: "danger"
} as const;

const statusVariant = {
  open: "warning",
  assigned: "default",
  in_progress: "default",
  resolved: "success"
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
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [geoMessage, setGeoMessage] = useState("Use my current location");

  const filteredIssues = useMemo(() => {
    if (selectedLocation === "all") return incidentList;

    const normalized = selectedLocation.toLowerCase();
    return incidentList.filter((issue) => {
      const comparators = [issue.locality, issue.city, issue.address, issue.problem_type];
      return comparators.some((value) => value.toLowerCase().includes(normalized));
    });
  }, [selectedLocation]);

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

        const nearestIssue = incidentList.reduce(
          (closest, issue) => {
            const distance = haversineDistance(latitude, longitude, issue.latitude, issue.longitude);
            if (distance < closest.distance) {
              return { issue, distance };
            }
            return closest;
          },
          { issue: incidentList[0], distance: Number.POSITIVE_INFINITY }
        ).issue;

        setSelectedLocation(nearestIssue.locality);
        setGeoMessage(`Closest match: ${nearestIssue.locality}`);
      },
      () => {
        setGeoMessage("Location permission was blocked. Please choose an area manually.");
      }
    );
  };

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Nearby road issues and local infrastructure reports",
    description:
      "Browse nearby potholes, broken streetlights, garbage accumulation, and water leak reports in your selected area.",
    url: "https://fix-my-roads.netlify.app/nearby",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://fix-my-roads.netlify.app/" },
        { "@type": "ListItem", position: 2, name: "Nearby issues", item: "https://fix-my-roads.netlify.app/nearby" }
      ]
    },
    mainEntity: filteredIssues.map((issue) => ({
      "@type": "Report",
      name: issue.title,
      description: issue.description,
      location: {
        "@type": "Place",
        name: issue.address,
        address: {
          "@type": "PostalAddress",
          streetAddress: issue.address,
          addressLocality: issue.locality,
          addressRegion: issue.city
        }
      },
      issueType: issue.problem_type,
      severity: issue.severity,
      status: issue.status
    }))
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

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
                Filter by location
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

          <div className="mt-5 flex flex-wrap gap-3">
            {locationOptions.map((option) => {
              const isSelected = selectedLocation === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedLocation(option.id)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
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
        </Card>

        <div className="grid gap-5 lg:grid-cols-[1.5fr_0.9fr]">
          <div className="space-y-5">
            {filteredIssues.length > 0 ? (
              filteredIssues.map((issue) => (
                <Card key={issue.id} className="rounded-[1.75rem] border border-slate-800/80 bg-slate-950/80 p-6 shadow-soft">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{issue.problem_type}</p>
                      <h2 className="mt-2 text-2xl font-semibold text-white">{issue.title}</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={severityVariant[issue.severity]}>{issue.severity}</Badge>
                      <Badge variant={statusVariant[issue.status]}>{issue.status.replace("_", " ")}</Badge>
                    </div>
                  </div>

                  <p className="mt-4 text-slate-300">{issue.description}</p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Location</p>
                      <p className="mt-2 flex items-start gap-2 text-sm text-slate-200">
                        <MapPin className="mt-0.5 h-4 w-4 text-teal-300" />
                        {issue.address}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Area</p>
                      <p className="mt-2 text-sm text-slate-200">{issue.locality}, {issue.city}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Reports</p>
                      <p className="mt-2 text-sm text-slate-200">{issue.report_count} reports</p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-5">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Navigation className="h-4 w-4 text-teal-300" />
                      Last updated {new Date(issue.updated_at).toLocaleDateString()}
                    </div>
                    <Link
                      href={`/report?location=${encodeURIComponent(issue.address)}`}
                      className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-500/10 px-4 py-2 text-sm font-semibold text-teal-200 transition hover:border-teal-300 hover:bg-teal-500/20"
                    >
                      Report nearby issue
                    </Link>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="rounded-[1.75rem] border border-slate-800 bg-slate-950/80 p-8 text-slate-300">
                No issues found for this location yet. Try another area or submit a new report.
              </Card>
            )}
          </div>

          <aside className="space-y-5">
            <Card className="rounded-[1.75rem] border border-slate-800/80 bg-slate-900/80 p-6 shadow-soft">
              <p className="text-sm uppercase tracking-[0.2em] text-teal-300">Location overview</p>
              <h3 className="mt-3 text-xl font-semibold text-white">{activeLabel}</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-300">
                <li className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span>Issues tracked</span>
                  <strong className="text-white">{filteredIssues.length}</strong>
                </li>
                <li className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span>High priority</span>
                  <strong className="text-white">
                    {filteredIssues.filter((issue) => issue.severity === "high").length}
                  </strong>
                </li>
                <li className="flex items-center justify-between">
                  <span>Latest report</span>
                  <strong className="text-white">
                    {filteredIssues.length > 0
                      ? new Date(filteredIssues[0].updated_at).toLocaleDateString()
                      : "No data"}
                  </strong>
                </li>
              </ul>
            </Card>

            <Card className="rounded-[1.75rem] border border-slate-800/80 bg-slate-950/80 p-6 shadow-soft">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Need to report a new issue?</p>
              <h3 className="mt-3 text-xl font-semibold text-white">Help improve local infrastructure</h3>
              <p className="mt-3 text-sm text-slate-400">
                Add a new location pin, share details, and help nearby teams act faster on reported conditions.
              </p>
              <Link
                href="/report"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-teal-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-teal-300"
              >
                Submit an issue
              </Link>
            </Card>
          </aside>
        </div>
      </div>
    </>
  );
}

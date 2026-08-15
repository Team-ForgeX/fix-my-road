import { haversineDistanceMeters } from "./geo";
import { mockAnalyzeReport } from "./ml/mockAnalyzeReport";
import type { MLAnalysisResult } from "./ml/types";
import type { Incident } from "../types/incident";
import type { Report, ReportMedia } from "../types/report";

export type LocationInput = {
  address: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
};

export type SubmitReportInput = {
  userId: string;
  title: string;
  description: string;
  location: LocationInput;
  media: ReportMedia[];
  existingIncidents: Incident[];
};

export type SubmitReportOutput = {
  report: Report;
  incident: Incident;
  mlAnalysis: MLAnalysisResult;
  dedupeDecision: "new" | "linked";
};

const DEDUPE_RADIUS_METERS = 100;
const ACTIVE_INCIDENT_STATUSES: Incident["status"][] = ["open", "assigned", "in_progress"];

function findNearbyIncident(
  latitude: number,
  longitude: number,
  incidents: Incident[]
): Incident | undefined {
  return incidents
    .filter((incident) => ACTIVE_INCIDENT_STATUSES.includes(incident.status))
    .map((incident) => ({
      incident,
      distance: haversineDistanceMeters(latitude, longitude, incident.latitude, incident.longitude)
    }))
    .filter(({ distance }) => distance <= DEDUPE_RADIUS_METERS)
    .sort((a, b) => a.distance - b.distance)[0]?.incident;
}

function createIncidentId() {
  return `I${Date.now()}`;
}

function createReportId() {
  return `R${Date.now()}`;
}

function mapSeverity(severity: MLAnalysisResult["severity"]): Report["severity"] {
  if (severity === "critical") return "high";
  return severity;
}

function mapIncidentStatus(status: Incident["status"]): Report["status"] {
  if (status === "in_progress" || status === "assigned") return "in_progress";
  if (status === "resolved") return "resolved";
  return "open";
}

/**
 * Mock report pipeline: ML analysis + location-based dedup.
 * Replace with API call once schema and ML service are ready.
 */
export function processReportSubmission(input: SubmitReportInput): SubmitReportOutput {
  const reportId = createReportId();
  const imageUrls = input.media.map((item) => item.thumbnail_url);

  const mlAnalysis = mockAnalyzeReport({
    reportId,
    description: input.description,
    imageUrls,
    latitude: input.location.latitude,
    longitude: input.location.longitude
  });

  const nearbyIncident = findNearbyIncident(
    input.location.latitude,
    input.location.longitude,
    input.existingIncidents
  );

  const now = new Date().toISOString();
  const isDuplicate = Boolean(nearbyIncident);
  const incident: Incident = nearbyIncident
    ? {
        ...nearbyIncident,
        report_count: nearbyIncident.report_count + 1,
        severity: mapSeverity(mlAnalysis.severity) as Incident["severity"],
        problem_type: mlAnalysis.problem_type,
        updated_at: now
      }
    : {
        id: createIncidentId(),
        title: input.title.trim() || input.description.trim().slice(0, 60),
        problem_type: mlAnalysis.problem_type,
        severity: mapSeverity(mlAnalysis.severity) as Incident["severity"],
        status: "open",
        description: input.description.trim(),
        latitude: input.location.latitude,
        longitude: input.location.longitude,
        address: input.location.address,
        locality: input.location.city || input.location.pincode || "Unknown",
        city: input.location.city,
        report_count: 1,
        created_at: now,
        updated_at: now
      };

  const report: Report = {
    id: reportId,
    user_id: input.userId,
    incident_id: incident.id,
    title: input.title.trim() || input.description.trim().slice(0, 45),
    description: input.description.trim(),
    latitude: input.location.latitude,
    longitude: input.location.longitude,
    address: input.location.address,
    landmark: input.location.landmark,
    locality: input.location.city || input.location.pincode || "Unknown",
    city: input.location.city,
    created_at: now,
    processing_state: isDuplicate ? "incident_matched" : "processed",
    status: mapIncidentStatus(incident.status),
    severity: mapSeverity(mlAnalysis.severity),
    report_count: incident.report_count,
    is_duplicate: isDuplicate,
    media: input.media.map((item) => ({ ...item, report_id: reportId })),
    ml_analysis: mlAnalysis
  };

  return {
    report,
    incident,
    mlAnalysis,
    dedupeDecision: isDuplicate ? "linked" : "new"
  };
}

export function applyIncidentStatusUpdate(
  incidents: Incident[],
  reports: Report[],
  incidentId: string,
  newStatus: Incident["status"]
): { incidents: Incident[]; reports: Report[] } {
  const now = new Date().toISOString();
  const reportStatus: Report["status"] =
    newStatus === "resolved" ? "resolved" : newStatus === "in_progress" || newStatus === "assigned" ? "in_progress" : "open";

  const processingState =
    newStatus === "resolved" ? "resolved" : newStatus === "in_progress" || newStatus === "assigned" ? "assigned" : "incident_matched";

  return {
    incidents: incidents.map((incident) =>
      incident.id === incidentId ? { ...incident, status: newStatus, updated_at: now } : incident
    ),
    reports: reports.map((report) =>
      report.incident_id === incidentId
        ? { ...report, status: reportStatus, processing_state: processingState }
        : report
    )
  };
}

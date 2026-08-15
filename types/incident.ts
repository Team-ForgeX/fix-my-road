export type IncidentSeverity = "low" | "medium" | "high";
export type IncidentStatus = "open" | "assigned" | "in_progress" | "resolved";

export type Incident = {
  id: string;
  title: string;
  problem_type: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  locality: string;
  city: string;
  report_count: number;
  created_at: string;
  updated_at: string;
};

export type Incident = {
  id: string;
  title: string;
  problem_type: string;
  severity: "low" | "medium" | "high";
  status: "open" | "assigned" | "in_progress" | "resolved";
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

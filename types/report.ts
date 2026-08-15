export type MediaType = "image" | "video";

export type ReportMedia = {
  id: string;
  report_id: string;
  media_type: MediaType;
  file_name: string;
  thumbnail_url: string;
  size: number;
  created_at: string;
};

import type { MLAnalysisResult } from "../lib/ml/types";

export type ReportStatus = "open" | "in_progress" | "resolved" | "duplicate";

export type Report = {
  id: string;
  user_id: string;
  incident_id?: string;
  duplicate_of_report_id?: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  landmark?: string;
  locality: string;
  city: string;
  created_at: string;
  processing_state: string;
  status: ReportStatus;
  severity?: "low" | "medium" | "high";
  report_count?: number;
  is_duplicate?: boolean;
  ml_analysis?: MLAnalysisResult;
  media: ReportMedia[];
};

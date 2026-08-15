export type MLAnalysisInput = {
  reportId: string;
  description: string;
  imageUrls: string[];
  latitude: number;
  longitude: number;
};

export type MLAnalysisResult = {
  problem_type: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  is_duplicate: boolean;
  matched_incident_id?: string;
  duplicate_score?: number;
};

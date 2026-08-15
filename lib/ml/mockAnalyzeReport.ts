import type { MLAnalysisInput, MLAnalysisResult } from "./types";

const PROBLEM_RULES: Array<{ keywords: string[]; problem_type: string; severity: MLAnalysisResult["severity"] }> = [
  { keywords: ["pothole", "crack", "road damage"], problem_type: "Road damage", severity: "high" },
  { keywords: ["garbage", "trash", "waste", "dump"], problem_type: "Garbage accumulation", severity: "high" },
  { keywords: ["leak", "flood", "water", "pipeline"], problem_type: "Water leakage", severity: "high" },
  { keywords: ["streetlight", "light pole", "dark"], problem_type: "Streetlight", severity: "medium" },
  { keywords: ["traffic", "signal", "jam"], problem_type: "Traffic", severity: "medium" },
  { keywords: ["drainage", "drain", "sewer"], problem_type: "Drainage", severity: "medium" }
];

export function mockAnalyzeReport(input: MLAnalysisInput): MLAnalysisResult {
  const normalized = input.description.toLowerCase();
  const matchedRule =
    PROBLEM_RULES.find((rule) => rule.keywords.some((keyword) => normalized.includes(keyword))) ??
    ({ problem_type: "General issue", severity: "low" } as const);

  const hasEvidence = input.imageUrls.length > 0;
  const confidence = Math.min(0.95, 0.55 + (hasEvidence ? 0.2 : 0) + Math.random() * 0.15);

  return {
    problem_type: matchedRule.problem_type,
    severity: matchedRule.severity,
    confidence: Number(confidence.toFixed(2)),
    is_duplicate: false,
    duplicate_score: 0
  };
}

import { mockAnalyzeReport } from "./mockAnalyzeReport";
import type { MLAnalysisInput, MLAnalysisResult } from "./types";

/**
 * Analyze a citizen report. Uses mock logic until ML_API_URL is configured.
 */
export async function analyzeReport(input: MLAnalysisInput): Promise<MLAnalysisResult> {
  const mlApiUrl = process.env.ML_API_URL;
  const mlApiKey = process.env.ML_API_KEY;

  if (!mlApiUrl || !mlApiKey) {
    return mockAnalyzeReport(input);
  }

  try {
    const response = await fetch(mlApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mlApiKey}`
      },
      body: JSON.stringify(input)
    });

    if (!response.ok) {
      throw new Error(`ML API returned ${response.status}`);
    }

    return (await response.json()) as MLAnalysisResult;
  } catch (error) {
    console.warn("ML API unavailable, using mock analysis:", error);
    return mockAnalyzeReport(input);
  }
}

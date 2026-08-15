import { NextResponse } from "next/server";
import { analyzeReport } from "../../../../lib/ml/analyzeReport";
import type { MLAnalysisInput } from "../../../../lib/ml/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<MLAnalysisInput>;

    if (!body.description && (!body.imageUrls || body.imageUrls.length === 0)) {
      return NextResponse.json(
        { success: false, error: "Report description or image URLs are required for ML analysis." },
        { status: 400 }
      );
    }

    const input: MLAnalysisInput = {
      reportId: body.reportId || `R${Date.now()}`,
      description: body.description || "",
      imageUrls: body.imageUrls || [],
      latitude: body.latitude || 0,
      longitude: body.longitude || 0
    };

    const analysisResult = await analyzeReport(input);

    return NextResponse.json({
      success: true,
      analysis: analysisResult
    });
  } catch (err: any) {
    console.error("ML analysis API error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process ML analysis." },
      { status: 500 }
    );
  }
}

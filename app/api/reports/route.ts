import { NextResponse } from "next/server";
import { submitReportToSupabase, supabase } from "../../../lib/supabaseService";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const incidentId = searchParams.get("incidentId");

    let query = supabase.from("reports").select("*, report_media(*)");

    if (userId) {
      query = query.eq("user_id", userId);
    }
    if (incidentId) {
      query = query.eq("incident_id", incidentId);
    }

    const { data: reports, error } = await query.order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, reports });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const userId = formData.get("userId") as string;
    const description = formData.get("description") as string;
    const latitude = parseFloat(formData.get("latitude") as string || "0");
    const longitude = parseFloat(formData.get("longitude") as string || "0");
    const address = formData.get("address") as string || "";
    const landmark = (formData.get("landmark") as string) || "";
    const city = (formData.get("city") as string) || "";
    const pincode = (formData.get("pincode") as string) || "";

    const mediaFiles: File[] = [];
    const entries = Array.from(formData.entries());
    for (const [key, value] of entries) {
      if (key.startsWith("media") && value instanceof File) {
        mediaFiles.push(value);
      }
    }

    if (!userId || !description || !address) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: userId, description, address." },
        { status: 400 }
      );
    }

    const result = await submitReportToSupabase({
      userId,
      description,
      latitude,
      longitude,
      address,
      landmark,
      city,
      pincode,
      mediaFiles
    });

    if (!result.success && !result.isFallback) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

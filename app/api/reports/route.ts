import { NextResponse } from "next/server";
import { submitReportToSupabase, supabase } from "../../../lib/supabaseService";
import { createClient } from "../../../lib/supabase/server";

export async function GET(request: Request) {
  try {
    // Verify authenticated user
    const supabaseServer = createClient();
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const incidentId = searchParams.get("incidentId");

    let query = supabase.from("reports").select("*, report_media(*)");

    // Users can only see their own reports, unless they're admin
    if (isAdmin) {
      if (userId) {
        query = query.eq("user_id", userId);
      }
      if (incidentId) {
        query = query.eq("incident_id", incidentId);
      }
    } else {
      // Non-admin users can only see their own reports
      query = query.eq("user_id", user.id);
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
    // Verify authenticated user
    const supabaseServer = createClient();
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
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

    if (!description || !address) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: description, address." },
        { status: 400 }
      );
    }

    const result = await submitReportToSupabase({
      userId: user.id,  // Use authenticated user's ID, not from form data
      description,
      latitude,
      longitude,
      address,
      landmark,
      city,
      pincode,
      mediaFiles
    });

    const res = result as any;
    if (!res.success && !res.isFallback) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

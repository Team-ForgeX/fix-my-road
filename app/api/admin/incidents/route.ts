import { NextResponse } from "next/server";
import { executeAdminAction, supabase } from "../../../../lib/supabaseService";
import { createClient } from "../../../../lib/supabase/server";

export async function GET() {
  try {
    const { data: incidents, error } = await supabase
      .from("incidents")
      .select("*, reports(*)")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, incidents });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    // Verify authenticated user is an admin
    const supabaseServer = createClient();
    const { data: userData, error: userError } = await supabaseServer.auth.getUser();
    const user = userData?.user;

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    // Check if user has admin role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin privileges required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { incidentId, newStatus, departmentId, officerId, note } = body;

    if (!incidentId || !newStatus) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters: incidentId, newStatus." },
        { status: 400 }
      );
    }

    const result = await executeAdminAction({
      incidentId,
      adminId: user.id,  // Use authenticated user's ID, not from request body
      newStatus,
      departmentId,
      officerId,
      note
    });

    const res = result as any;
    if (!res.success && !res.isFallback) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Incident updated successfully." });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

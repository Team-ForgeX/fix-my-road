import { NextResponse } from "next/server";
import { executeAdminAction, supabase } from "../../../../lib/supabaseService";

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
    const body = await request.json();
    const { incidentId, adminId, newStatus, departmentId, officerId, note } = body;

    if (!incidentId || !adminId || !newStatus) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters: incidentId, adminId, newStatus." },
        { status: 400 }
      );
    }

    const result = await executeAdminAction({
      incidentId,
      adminId,
      newStatus,
      departmentId,
      officerId,
      note
    });

    if (!result.success && !result.isFallback) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Incident updated successfully." });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

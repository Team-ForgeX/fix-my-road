import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { success: false, error: "Admin access code is required." },
        { status: 400 }
      );
    }

    const adminCode = process.env.ADMIN_CODE;
    if (!adminCode) {
      console.error("ADMIN_CODE environment variable not configured");
      return NextResponse.json(
        { success: false, error: "Admin access system not configured." },
        { status: 500 }
      );
    }

    if (code.trim() !== adminCode.trim()) {
      return NextResponse.json(
        { success: false, error: "Invalid admin access code." },
        { status: 401 }
      );
    }

    // Require an authenticated user session
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required before account elevation." },
        { status: 401 }
      );
    }

    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { success: false, error: "Email must be verified before elevating privileges." },
        { status: 403 }
      );
    }

    // Use admin client (service role) to bypass RLS and set role to admin
    const adminDb = createAdminClient();
    const { data: profile, error: profileError } = await adminDb
      .from("profiles")
      .update({ role: "admin", updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select("id, full_name, role")
      .single();

    if (profileError || !profile) {
      console.error("Profile elevate error:", profileError?.message);
      return NextResponse.json(
        { success: false, error: profileError?.message ?? "Unable to update account privileges." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Account elevated to admin successfully.",
      user: profile
    });
  } catch (err: any) {
    console.error("Admin code verification error:", err);
    return NextResponse.json(
      { success: false, error: "An error occurred while elevating account." },
      { status: 500 }
    );
  }
}

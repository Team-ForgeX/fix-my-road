import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, action } = body;

    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required before changing account type." },
        { status: 401 }
      );
    }

    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { success: false, error: "Email must be verified before changing account type." },
        { status: 403 }
      );
    }

    if (action === "downgrade") {
      const adminDb = createAdminClient();
      const { data: profile, error: profileError } = await adminDb
        .from("profiles")
        .update({ role: "client", updated_at: new Date().toISOString() })
        .eq("id", user.id)
        .select("id, full_name, role")
        .single();

      if (profileError || !profile) {
        return NextResponse.json(
          { success: false, error: profileError?.message ?? "Unable to switch account to client." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Account switched to client successfully.",
        user: profile
      });
    }

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

    if (code.trim().toLowerCase() !== adminCode.trim().toLowerCase()) {
      return NextResponse.json(
        { success: false, error: "Invalid admin access code." },
        { status: 401 }
      );
    }

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
      { success: false, error: "An error occurred while changing account type." },
      { status: 500 }
    );
  }
}

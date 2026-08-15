import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, action } = body;

    const supabase = createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = userData?.user;

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

    // Call RPC function upgrade_to_admin
    const { data: upgraded, error: rpcError } = await supabase.rpc("upgrade_to_admin", {
      p_code: code.trim()
    });

    if (rpcError) {
      console.warn("upgrade_to_admin RPC error:", rpcError);
    }

    if (!rpcError && upgraded) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", user.id)
        .single();

      return NextResponse.json({
        success: true,
        message: "Account elevated to admin successfully.",
        user: profile
      });
    }

    // Fallback: check environment variable if RPC function not initialized in DB yet
    const adminCode = process.env.ADMIN_CODE;
    if (adminCode && code.trim().toLowerCase() === adminCode.trim().toLowerCase()) {
      const adminDb = createAdminClient();
      const { data: profile, error: profileError } = await adminDb
        .from("profiles")
        .update({ role: "admin", updated_at: new Date().toISOString() })
        .eq("id", user.id)
        .select("id, full_name, role")
        .single();

      if (profileError) {
        console.error("Admin upgrade fallback DB error:", profileError);
        return NextResponse.json(
          { success: false, error: `Failed to update profile role in DB: ${profileError.message}` },
          { status: 500 }
        );
      }

      if (profile) {
        return NextResponse.json({
          success: true,
          message: "Account elevated to admin successfully.",
          user: profile
        });
      }
    }

    return NextResponse.json(
      { success: false, error: "Invalid admin access code." },
      { status: 401 }
    );
  } catch (err: any) {
    console.error("Admin code verification error:", err);
    return NextResponse.json(
      { success: false, error: "An error occurred while changing account type." },
      { status: 500 }
    );
  }
}

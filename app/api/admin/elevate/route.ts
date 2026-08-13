import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabaseClient";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, email, code } = body;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { success: false, error: "User session is required." },
        { status: 400 }
      );
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
        { success: false, error: "Admin system not configured." },
        { status: 500 }
      );
    }

    if (code.trim() !== adminCode.trim()) {
      return NextResponse.json(
        { success: false, error: "Invalid admin access code." },
        { status: 401 }
      );
    }

    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !userData?.user) {
      return NextResponse.json(
        { success: false, error: "Authenticated user not found." },
        { status: 404 }
      );
    }

    if (email && userData.user.email && userData.user.email.toLowerCase() !== String(email).trim().toLowerCase()) {
      return NextResponse.json(
        { success: false, error: "User identity mismatch." },
        { status: 403 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .update({ role: "admin", updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select("id, role")
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: profileError?.message ?? "Unable to update admin role." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Admin code verified and role updated." });
  } catch (err: any) {
    console.error("Admin code verification error:", err);
    return NextResponse.json(
      { success: false, error: "An error occurred while verifying the admin code." },
      { status: 500 }
    );
  }
}

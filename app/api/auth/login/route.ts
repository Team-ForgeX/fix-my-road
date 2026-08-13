import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required." },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData?.user) {
      return NextResponse.json(
        { success: false, error: authError?.message ?? "Invalid email or password." },
        { status: 401 }
      );
    }

    if (!authData.user.email_confirmed_at) {
      return NextResponse.json(
        { success: false, error: "Email is not verified. Please confirm your email first.", needsVerification: true },
        { status: 403 }
      );
    }

    // Fetch profile from public.profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, phone, role, created_at, updated_at")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Profile lookup error:", profileError.message);
      return NextResponse.json(
        { success: false, error: "Unable to read account profile." },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Account profile not found. Please complete email verification first." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        full_name: profile.full_name,
        email: authData.user.email,
        phone: profile.phone,
        role: profile.role
      }
    });
  } catch (error: any) {
    console.error("Login route error:", error);
    return NextResponse.json(
      { success: false, error: error?.message ?? "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

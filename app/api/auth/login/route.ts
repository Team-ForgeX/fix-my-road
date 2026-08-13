import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
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

    const adminDb = createAdminClient();

    // Fetch profile from public.profiles using the admin client so the post-sign-in
    // lookup is not blocked by RLS/session propagation timing.
    const { data: profile, error: profileError } = await adminDb
      .from("profiles")
      .select("id, full_name, phone, role, created_at, updated_at")
      .eq("id", authData.user.id)
      .maybeSingle();

    let resolvedProfile = profile;

    if (profileError) {
      console.error("Profile lookup error:", profileError.message);
      return NextResponse.json(
        { success: false, error: "Unable to read account profile." },
        { status: 500 }
      );
    }

    if (!resolvedProfile) {
      const emailValue = authData.user.email ?? "";
      const baseName = authData.user.user_metadata?.full_name || emailValue.split("@")[0] || "User";
      const fallbackFullName = String(baseName).trim() || "User";

      const { data: createdProfile, error: createProfileError } = await adminDb
        .from("profiles")
        .upsert(
          {
            id: authData.user.id,
            full_name: fallbackFullName,
            phone: authData.user.user_metadata?.phone ?? null,
            role: "client"
          },
          { onConflict: "id" }
        )
        .select("id, full_name, phone, role, created_at, updated_at")
        .single();

      if (createProfileError || !createdProfile) {
        console.error("Fallback profile creation error:", createProfileError?.message ?? "Unknown profile creation error");
        return NextResponse.json(
          { success: false, error: "Unable to read account profile. Please create a profile for this user in Supabase." },
          { status: 500 }
        );
      }

      resolvedProfile = createdProfile;
    }

    const normalizedRole = resolvedProfile.role === "admin" ? "admin" : "client";

    return NextResponse.json({
      success: true,
      user: {
        id: resolvedProfile.id,
        full_name: resolvedProfile.full_name,
        email: authData.user.email,
        phone: resolvedProfile.phone,
        role: normalizedRole
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

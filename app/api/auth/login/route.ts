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

    console.log("🔍 About to fetch profile for user:", authData.user.id);
    console.log("🔍 Service role key env:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ Present" : "❌ Missing");

    // Fetch profile from public.profiles using the admin client so the post-sign-in
    // lookup is not blocked by RLS/session propagation timing.
    const { data: profile, error: profileError } = await adminDb
      .from("profiles")
      .select("id, full_name, phone, role, created_at, updated_at")
      .eq("id", authData.user.id)
      .maybeSingle();

    console.log("📊 Profile lookup result:", { profile, profileError: profileError?.message });

    let resolvedProfile = profile;

    if (profileError) {
      console.error("❌ Profile lookup error:", profileError.message);
      console.error("Full error details:", profileError);
      return NextResponse.json(
        { success: false, error: "Unable to read account profile: " + profileError.message },
        { status: 500 }
      );
    }

    if (!resolvedProfile) {
      console.log("⚠️ No profile found, attempting to create fallback profile...");
      const emailValue = authData.user.email ?? "";
      const baseName = authData.user.user_metadata?.full_name || emailValue.split("@")[0] || "User";
      const fallbackFullName = String(baseName).trim() || "User";

      console.log("📝 Creating profile with:", { id: authData.user.id, full_name: fallbackFullName });

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

      console.log("📊 Profile creation result:", { createdProfile, createProfileError: createProfileError?.message });

      if (createProfileError || !createdProfile) {
        console.error("❌ Fallback profile creation error:", createProfileError?.message ?? "Unknown profile creation error");
        console.error("Full error details:", createProfileError);
        return NextResponse.json(
          { success: false, error: "Profile creation failed: " + (createProfileError?.message ?? "Unknown error") },
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

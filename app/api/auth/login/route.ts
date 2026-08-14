import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "../../../../lib/supabase/admin";

export async function POST(request: NextRequest) {
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

    const response = NextResponse.json({ success: true });
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          }
        }
      }
    );

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

    // Fetch profile from database - this is the source of truth for role
    const { data: profile, error: profileError } = await adminDb
      .from("profiles")
      .select("id, full_name, phone, role, created_at, updated_at")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Profile lookup error:", profileError.message);
      return NextResponse.json(
        { success: false, error: "Unable to read account profile: " + profileError.message },
        { status: 500 }
      );
    }

    // If no profile exists, create one as client
    let resolvedProfile = profile;
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
        return NextResponse.json(
          { success: false, error: "Profile creation failed: " + (createProfileError?.message ?? "Unknown error") },
          { status: 500 }
        );
      }

      resolvedProfile = createdProfile;
    }

    // Use the role from the database directly - it's the source of truth
    const roleFromDatabase = resolvedProfile.role === "admin" ? "admin" : "client";
    const verified = Boolean(authData.user.email_confirmed_at);

    const finalResponse = NextResponse.json({
      success: true,
      user: {
        id: resolvedProfile.id,
        full_name: resolvedProfile.full_name,
        email: authData.user.email,
        phone: resolvedProfile.phone,
        role: roleFromDatabase,
        verified
      }
    }, { status: 200 });

    response.cookies.getAll().forEach((cookie) => {
      finalResponse.cookies.set(cookie.name, cookie.value, cookie);
    });

    return finalResponse;
  } catch (error: any) {
    console.error("Login route error:", error);
    return NextResponse.json(
      { success: false, error: error?.message ?? "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

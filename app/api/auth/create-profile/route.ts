import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { createCitizenProfile } from "../../../../lib/supabaseService";
import { createClient } from "../../../../lib/supabase/server";

export async function POST(request: Request) {
  try {
    // Verify authenticated user
    const supabaseServer = createClient();
    const { data: userData, error: userError } = await supabaseServer.auth.getUser();
    const user = userData?.user;

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fullName, phone } = body;

    if (!fullName) {
      return NextResponse.json(
        { success: false, error: "Full name is required." },
        { status: 400 }
      );
    }

    const adminDb = createAdminClient();

    // Verify the user exists and email is confirmed
    const { data: adminUserData, error: adminUserDataError } = await adminDb.auth.admin.getUserById(user.id);

    if (adminUserDataError || !adminUserData?.user) {
      return NextResponse.json(
        { success: false, error: "User not found." },
        { status: 404 }
      );
    }

    if (!adminUserData.user.email_confirmed_at) {
      return NextResponse.json(
        { success: false, error: "Email not yet verified." },
        { status: 400 }
      );
    }

    // Check if profile already exists
    const { data: existingProfile } = await adminDb
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json({ success: true, message: "Profile already exists." });
    }

    const detectedRole = adminUserData.user.user_metadata?.role === "admin" || adminUserData.user.user_metadata?.requested_role === "admin" ? "admin" : "client";

    const profileResult = await createCitizenProfile({
      id: user.id,
      email: adminUserData.user.email ?? null,
      full_name: fullName.trim(),
      phone: phone || null,
      role: detectedRole
    });

    if (profileResult.error || !profileResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: profileResult.error?.message ?? "Unable to create profile."
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: "Profile created successfully." });
  } catch (err: any) {
    console.error("Profile creation error:", err);
    return NextResponse.json(
      { success: false, error: "An error occurred while creating profile." },
      { status: 500 }
    );
  }
}

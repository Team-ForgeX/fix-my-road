import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabaseClient";
import { createCitizenProfile } from "../../../../lib/supabaseService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, fullName, role, phone } = body;

    if (!userId || !fullName) {
      return NextResponse.json(
        { success: false, error: "User ID and full name are required." },
        { status: 400 }
      );
    }

    // Verify the user exists and email is confirmed
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !userData?.user) {
      return NextResponse.json(
        { success: false, error: "User not found." },
        { status: 404 }
      );
    }

    if (!userData.user.email_confirmed_at) {
      return NextResponse.json(
        { success: false, error: "Email not yet verified." },
        { status: 400 }
      );
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (existingProfile) {
      return NextResponse.json({ success: true, message: "Profile already exists." });
    }

    const normalizedRole = role === "admin" || role === "officer" ? role : "citizen";

    // Create the profile with the appropriate role
    const profileResult = await createCitizenProfile({
      id: userId,
      full_name: fullName.trim(),
      phone: phone || null,
      avatar_url: `https://avatars.dicebear.com/api/identicon/${encodeURIComponent(fullName.trim())}.svg`,
      role: normalizedRole
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

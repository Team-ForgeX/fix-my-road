import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabaseClient";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const fullName = String(body?.full_name ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const phone = String(body?.phone ?? "").trim();
    const userId = String(body?.userId ?? "").trim();

    if (!userId || !fullName || !email) {
      return NextResponse.json(
        { success: false, error: "Missing signup data for finalization." },
        { status: 400 }
      );
    }

    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !userData?.user) {
      return NextResponse.json(
        { success: false, error: "User not found or email confirmation is incomplete." },
        { status: 404 }
      );
    }

    if (!userData.user.email_confirmed_at) {
      return NextResponse.json(
        { success: false, error: "Please confirm the verification email before creating the account." },
        { status: 400 }
      );
    }

    const { data: existingUser, error: existingError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingError) {
      console.error("Finalize signup lookup error:", existingError.message);
      return NextResponse.json(
        { success: false, error: "Unable to check the account record." },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "This email is already registered." },
        { status: 409 }
      );
    }

    const { data: createdUser, error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        full_name: fullName,
        email,
        phone: phone || null,
        role: "citizen",
        avatar_url: `https://avatars.dicebear.com/api/identicon/${encodeURIComponent(fullName)}.svg`,
        identity_verified: false
      })
      .select("id, full_name, email, phone, role, avatar_url, identity_verified")
      .single();

    if (insertError || !createdUser) {
      console.error("Finalize signup insert error:", insertError?.message);
      return NextResponse.json(
        { success: false, error: insertError?.message ?? "Unable to create the account record." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Account created after email confirmation.",
      user: {
        id: createdUser.id,
        full_name: createdUser.full_name,
        email: createdUser.email,
        phone: createdUser.phone,
        role: createdUser.role,
        avatar_url: createdUser.avatar_url,
        verified: Boolean(createdUser.identity_verified)
      }
    });
  } catch (error: any) {
    console.error("Finalize signup error:", error);
    return NextResponse.json(
      { success: false, error: error?.message ?? "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

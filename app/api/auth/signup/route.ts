import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabaseClient";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const fullName = String(body?.full_name ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const phone = String(body?.phone ?? "").trim();
    const password = String(body?.password ?? "");

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Full name, email, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const { data: existingUser, error: existingError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingError) {
      console.error("Profile lookup error:", existingError.message);
      return NextResponse.json(
        { success: false, error: "Unable to validate the email address." },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "This email is already registered." },
        { status: 409 }
      );
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/verify` : undefined,
        data: {
          full_name: fullName,
          phone: phone || null,
          role: "citizen"
        }
      }
    });

    if (authError || !authData?.user) {
      return NextResponse.json(
        { success: false, error: authError?.message ?? "Unable to create auth account." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification email sent. Please click the verification link before completing account setup.",
      user: {
        id: authData.user.id,
        full_name: fullName,
        email,
        phone: phone || null,
        role: "citizen",
        avatar_url: `https://avatars.dicebear.com/api/identicon/${encodeURIComponent(fullName)}.svg`,
        verified: false
      }
    });
  } catch (error: any) {
    console.error("Signup route error:", error);
    return NextResponse.json(
      { success: false, error: error?.message ?? "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

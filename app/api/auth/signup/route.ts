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

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
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
      const msg = authError?.message ?? "Unable to create auth account.";
      const normalized = msg.toLowerCase();

      if (normalized.includes("already") || normalized.includes("registered") || normalized.includes("exists")) {
        return NextResponse.json(
          { success: false, error: "This email is already registered." },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { success: false, error: msg },
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

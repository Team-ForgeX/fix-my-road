import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const fullName = String(body?.full_name ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const phone = String(body?.phone ?? "").trim();
    const password = String(body?.password ?? "");
    const requestedRole = String(body?.role ?? "client").trim();

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

    const supabase = createClient();
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/verify`,
        data: {
          full_name: fullName,
          phone: phone || null,
          requested_role: requestedRole === "admin" ? "admin" : "client"
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
      message: "Verification email sent. Please check your email to confirm your account.",
      user: {
        id: authData.user.id,
        email
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

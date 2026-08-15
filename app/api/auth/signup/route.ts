import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { generateVerificationToken, sendVerificationEmail } from "../../../../lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const fullName = String(body?.full_name ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const phone = String(body?.phone ?? "").trim();
    const password = String(body?.password ?? "");
    const adminCode = String(body?.admin_code ?? "").trim();

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

    // Determine role: validate admin access code via database RPC function
    let requestedRole: "client" | "admin" = "client";
    const supabase = createClient();

    if (adminCode) {
      const { data: isValidCode } = await supabase.rpc("validate_admin_signup_code", {
        p_code: adminCode
      });

      if (isValidCode) {
        requestedRole = "admin";
      } else {
        // Fallback: check environment variable if RPC function not initialized yet
        const envAdminCode = process.env.ADMIN_CODE;
        if (envAdminCode && adminCode.toLowerCase() === envAdminCode.trim().toLowerCase()) {
          requestedRole = "admin";
        }
      }
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/verify`,
        data: {
          full_name: fullName,
          phone: phone || null,
          requested_role: requestedRole,
          role: requestedRole
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

    const smtpConfigured = Boolean(
      process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS
    );

    if (smtpConfigured) {
      try {
        const verificationToken = generateVerificationToken();
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
        const adminClient = createAdminClient();

        await adminClient.auth.admin.updateUserById(authData.user.id, {
          user_metadata: {
            ...(authData.user.user_metadata ?? {}),
            full_name: fullName,
            phone: phone || null,
            role: requestedRole,
            email_verification_token: verificationToken,
            email_verification_expires_at: expiresAt
          }
        });

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
        await sendVerificationEmail({
          email,
          fullName,
          userId: authData.user.id,
          appUrl,
          token: verificationToken
        });
      } catch (smtpErr: any) {
        // Non-fatal: Supabase already sent its own confirmation email via signUp().
        // Log but don't fail the request.
        console.warn("Custom SMTP email failed (non-fatal, Supabase email still sent):", smtpErr?.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Verification email sent. Please check your email to confirm your account.",
      user: {
        id: authData.user.id,
        email,
        role: requestedRole
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

import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { generateVerificationToken, sendVerificationEmail } from "../../../../lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email ?? "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: usersData, error: listError } = await admin.auth.admin.listUsers();

    if (listError || !usersData?.users) {
      return NextResponse.json(
        { success: false, error: "Unable to find the user account for this email." },
        { status: 500 }
      );
    }

    const user = usersData.users.find((item) => item.email?.toLowerCase() === email);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "No account exists for this email address." },
        { status: 404 }
      );
    }

    const verificationToken = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();

    const { error: metadataError } = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...(user.user_metadata ?? {}),
        email_verification_token: verificationToken,
        email_verification_expires_at: expiresAt
      }
    });

    if (metadataError) {
      return NextResponse.json(
        { success: false, error: metadataError.message ?? "Unable to prepare the verification email." },
        { status: 500 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await sendVerificationEmail({
      email,
      fullName: String(user.user_metadata?.full_name ?? "there"),
      userId: user.id,
      appUrl,
      token: verificationToken
    });

    return NextResponse.json({
      success: true,
      message: "A new verification email has been sent to your inbox."
    });
  } catch (error: any) {
    console.error("Resend verification email error:", error);
    return NextResponse.json(
      { success: false, error: error?.message ?? "Unable to send the verification email." },
      { status: 500 }
    );
  }
}

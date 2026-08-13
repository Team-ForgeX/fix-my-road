import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = String(body?.token ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();

    if (!token || !email) {
      return NextResponse.json(
        { success: false, error: "Verification token and email are required." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: usersData, error: listError } = await admin.auth.admin.listUsers();

    if (listError || !usersData?.users) {
      return NextResponse.json(
        { success: false, error: "Unable to lookup account verification details." },
        { status: 500 }
      );
    }

    const match = usersData.users.find((user) => user.email?.toLowerCase() === email);
    if (!match) {
      return NextResponse.json(
        { success: false, error: "No matching account found for this email." },
        { status: 404 }
      );
    }

    const metadata = (match.user_metadata ?? {}) as Record<string, any>;
    const expectedToken = metadata.email_verification_token;
    const expiresAt = metadata.email_verification_expires_at;

    if (!expectedToken || expectedToken !== token) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired verification link." },
        { status: 400 }
      );
    }

    if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
      return NextResponse.json(
        { success: false, error: "This verification link has expired. Please request a new one." },
        { status: 410 }
      );
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(match.id, {
      user_metadata: {
        ...metadata,
        email_verification_token: null,
        email_verification_expires_at: null
      },
      email_confirm: true
    });

    if (updateError) {
      console.error("Email verification update error:", updateError);
      return NextResponse.json(
        { success: false, error: updateError.message ?? "Unable to verify email." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email verified successfully."
    });
  } catch (error: any) {
    console.error("Verify email route error:", error);
    return NextResponse.json(
      { success: false, error: error?.message ?? "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

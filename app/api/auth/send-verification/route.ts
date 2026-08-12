import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Email is required." },
        { status: 400 }
      );
    }

    // Note: Email verification is handled automatically by Supabase
    // This endpoint is a placeholder for potential future enhancements
    // Users can request a new verification email through Supabase's built-in flow

    return NextResponse.json({
      success: true,
      message: "If the email exists in our system, a verification link has been sent. Please check your inbox and spam folder."
    });
  } catch (err: any) {
    console.error("Email verification error:", err);
    return NextResponse.json(
      { success: false, error: "An error occurred." },
      { status: 500 }
    );
  }
}

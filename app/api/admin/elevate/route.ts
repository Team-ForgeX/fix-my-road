import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { success: false, error: "Admin access code is required." },
        { status: 400 }
      );
    }

    // Verify the admin code
    const adminCode = process.env.ADMIN_CODE;

    if (!adminCode) {
      console.error("ADMIN_CODE environment variable not configured");
      return NextResponse.json(
        { success: false, error: "Admin system not configured." },
        { status: 500 }
      );
    }

    const codeMatch = code.trim() === adminCode.trim();
    console.log("Admin code verification:", { 
      providedLength: code.trim().length,
      expectedLength: adminCode.trim().length,
      match: codeMatch
    });
    
    if (!codeMatch) {
      return NextResponse.json(
        { success: false, error: "Invalid admin access code." },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, message: "Admin code verified." });
  } catch (err: any) {
    console.error("Admin code verification error:", err);
    return NextResponse.json(
      { success: false, error: "An error occurred while verifying the admin code." },
      { status: 500 }
    );
  }
}

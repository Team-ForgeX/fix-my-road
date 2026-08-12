import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabaseClient";

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
    const adminCode = process.env.ADMIN_CODE || "ADMIN2024FIX";
    
    if (code.trim() !== adminCode.trim()) {
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

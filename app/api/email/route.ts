import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "Verification emails are sent via Supabase Auth custom SMTP." },
    { status: 200 }
  );
}

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "Verification email is sent automatically by Supabase Auth upon signup." },
    { status: 200 }
  );
}

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "Profile creation is handled automatically via database trigger upon email verification." },
    { status: 200 }
  );
}

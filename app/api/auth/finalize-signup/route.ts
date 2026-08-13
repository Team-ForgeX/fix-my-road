import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "Finalizing signup is handled automatically upon email verification." },
    { status: 200 }
  );
}

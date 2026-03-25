import { NextResponse } from "next/server";
import { competitions } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({ competitions });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return NextResponse.json({
    message: "Demo competition created",
    data: body
  });
}

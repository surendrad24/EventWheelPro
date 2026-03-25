import { NextResponse } from "next/server";
import { store } from "@/lib/server/in-memory-store";

export async function GET() {
  return NextResponse.json({ competitions: store.listCompetitions() });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  try {
    const competition = store.createCompetition(body);
    return NextResponse.json({ competition }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid_payload";
    const status = message === "title_required" || message === "slug_taken" ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

import { NextResponse } from "next/server";
import { store } from "@/lib/server/in-memory-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const competitionId = searchParams.get("competitionId") ?? undefined;
  return NextResponse.json({ logs: store.getLogs(competitionId) });
}


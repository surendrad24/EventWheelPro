import { NextResponse } from "next/server";
import { store } from "@/lib/server/in-memory-store";

export async function GET() {
  return NextResponse.json(store.getDashboard());
}

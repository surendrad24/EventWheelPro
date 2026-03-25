import { NextResponse } from "next/server";
import { requireAdminApiPermission } from "@/lib/server/admin-auth";
import { store } from "@/lib/server/in-memory-store";

export async function GET(request: Request) {
  const auth = requireAdminApiPermission(request, "dashboard", "view");
  if ("error" in auth) {
    return auth.error;
  }
  return NextResponse.json(store.getDashboard());
}

import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, clearAdminSessionCookie } from "@/lib/server/admin-auth";
import { revokeAdminSessionByToken } from "@/lib/server/auth-db";

function readCookie(cookieHeader: string | null, name: string) {
  if (!cookieHeader) {
    return null;
  }
  for (const chunk of cookieHeader.split(";")) {
    const [key, ...rest] = chunk.trim().split("=");
    if (key === name) {
      return rest.join("=");
    }
  }
  return null;
}

export async function POST(request: Request) {
  const token = readCookie(request.headers.get("cookie"), ADMIN_SESSION_COOKIE);
  if (token) {
    revokeAdminSessionByToken(token);
  }

  const response = NextResponse.json({ message: "logout_successful" });
  clearAdminSessionCookie(response);
  return response;
}

import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, applyAdminSessionCookie, getAdminFromRequest } from "@/lib/server/admin-auth";
import { authenticateAdmin, createAdminSession } from "@/lib/server/auth-db";

function readClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (!forwardedFor) {
    return undefined;
  }
  return forwardedFor.split(",")[0]?.trim() || undefined;
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  let email = "";
  let password = "";

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    email = String(formData.get("email") ?? "").trim().toLowerCase();
    password = String(formData.get("password") ?? "");
  } else {
    const body = await request.json().catch(() => ({} as { email?: string; password?: string }));
    email = String(body.email ?? "").trim().toLowerCase();
    password = String(body.password ?? "");
  }

  const admin = authenticateAdmin(email, password);
  if (!admin) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const { token, expiresAt } = createAdminSession(admin, {
    ip: readClientIp(request),
    userAgent: request.headers.get("user-agent") ?? undefined
  });

  const response = NextResponse.json({
    message: "login_successful",
    admin
  });
  applyAdminSessionCookie(response, token, expiresAt);
  return response;
}

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ authenticated: false });
  }
  return NextResponse.json({
    authenticated: true,
    admin,
    cookieName: ADMIN_SESSION_COOKIE
  });
}

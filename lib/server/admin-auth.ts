import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { AdminRole, SessionAdmin, getAdminBySessionToken } from "@/lib/server/auth-db";

export const ADMIN_SESSION_COOKIE = "ew_admin_session";

function parseCookieValue(cookieHeader: string | null, cookieName: string) {
  if (!cookieHeader) {
    return null;
  }
  const chunks = cookieHeader.split(";");
  for (const chunk of chunks) {
    const [rawKey, ...rest] = chunk.trim().split("=");
    if (rawKey === cookieName) {
      return rest.join("=");
    }
  }
  return null;
}

export function applyAdminSessionCookie(response: NextResponse, token: string, expiresAt: string) {
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt)
  });
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0)
  });
}

export function getAdminFromRequest(request: Request): SessionAdmin | null {
  const token = parseCookieValue(request.headers.get("cookie"), ADMIN_SESSION_COOKIE);
  if (!token) {
    return null;
  }
  return getAdminBySessionToken(token);
}

function includesRole(allowedRoles: AdminRole[], currentRole: AdminRole) {
  return allowedRoles.includes(currentRole);
}

export function requireAdminApiAuth(request: Request, allowedRoles?: AdminRole[]) {
  const admin = getAdminFromRequest(request);
  if (!admin) {
    return {
      error: NextResponse.json({ error: "unauthorized" }, { status: 401 })
    };
  }
  if (allowedRoles && !includesRole(allowedRoles, admin.role)) {
    return {
      error: NextResponse.json({ error: "forbidden" }, { status: 403 })
    };
  }
  return { admin };
}

export async function getAdminFromServerCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }
  return getAdminBySessionToken(token);
}

export async function requireAdminPageAuth() {
  const admin = await getAdminFromServerCookies();
  if (!admin) {
    redirect("/admin/login");
  }
  return admin;
}

export async function requireAdminPageRole(allowedRoles: AdminRole[]) {
  const admin = await requireAdminPageAuth();
  if (!includesRole(allowedRoles, admin.role)) {
    redirect("/admin/dashboard");
  }
  return admin;
}

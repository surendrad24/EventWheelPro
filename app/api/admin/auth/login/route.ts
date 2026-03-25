import { NextResponse } from "next/server";

const DEMO_ADMIN_EMAIL = process.env.DEMO_ADMIN_EMAIL ?? "admin@eventwheelpro.local";
const DEMO_ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD ?? "admin123";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({} as { email?: string; password?: string }));
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (email !== DEMO_ADMIN_EMAIL.toLowerCase() || password !== DEMO_ADMIN_PASSWORD) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  return NextResponse.json({
    message: "login_successful",
    admin: {
      id: "admin-demo-1",
      email: DEMO_ADMIN_EMAIL,
      role: "super_admin"
    },
    token: "demo-admin-token"
  });
}


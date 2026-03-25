import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/server/admin-auth";
import { changeOwnPassword } from "@/lib/server/auth-db";

type ChangePasswordBody = {
  currentPassword?: string;
  newPassword?: string;
};

export async function PATCH(request: Request) {
  const auth = requireAdminApiAuth(request);
  if ("error" in auth) {
    return auth.error;
  }

  const body = (await request.json().catch(() => ({}))) as ChangePasswordBody;
  const currentPassword = String(body.currentPassword ?? "");
  const newPassword = String(body.newPassword ?? "");

  try {
    const changed = changeOwnPassword(auth.admin.id, currentPassword, newPassword);
    if (!changed) {
      return NextResponse.json({ error: "invalid_current_password" }, { status: 400 });
    }
    return NextResponse.json({ message: "password_updated" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid_payload";
    const status = message === "password_too_short" ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

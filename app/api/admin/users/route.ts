import { NextResponse } from "next/server";
import { AdminRole } from "@/lib/permissions";
import { requireAdminApiPermission } from "@/lib/server/admin-auth";
import { canAdminCreateRole, createAdminUser, listAdminUsers } from "@/lib/server/auth-db";
import { resolveGravatarProfileImage } from "@/lib/server/gravatar";

type CreateUserBody = {
  email?: string;
  password?: string;
  role?: AdminRole;
  name?: string;
  phone?: string;
  address?: string;
  profileImageUrl?: string;
  permissions?: unknown;
};

function isAdminRole(value: unknown): value is AdminRole {
  return value === "super_admin" || value === "admin" || value === "moderator" || value === "finance";
}

export async function GET(request: Request) {
  const auth = requireAdminApiPermission(request, "users", "view");
  if ("error" in auth) {
    return auth.error;
  }

  return NextResponse.json({ users: listAdminUsers() });
}

export async function POST(request: Request) {
  const auth = requireAdminApiPermission(request, "users", "add");
  if ("error" in auth) {
    return auth.error;
  }

  const body = (await request.json().catch(() => ({}))) as CreateUserBody;
  if (!isAdminRole(body.role)) {
    return NextResponse.json({ error: "invalid_role" }, { status: 400 });
  }

  if (!canAdminCreateRole(auth.admin.role, body.role)) {
    return NextResponse.json({ error: "cannot_create_target_role" }, { status: 403 });
  }

  try {
    const email = String(body.email ?? "");
    const manualProfileImage = typeof body.profileImageUrl === "string" ? body.profileImageUrl.trim() : "";
    const autoProfileImage = manualProfileImage
      ? undefined
      : await resolveGravatarProfileImage(email);

    const user = createAdminUser({
      email,
      password: String(body.password ?? ""),
      role: body.role,
      name: typeof body.name === "string" ? body.name : undefined,
      phone: typeof body.phone === "string" ? body.phone : undefined,
      address: typeof body.address === "string" ? body.address : undefined,
      profileImageUrl: manualProfileImage || autoProfileImage,
      permissions: body.permissions
    });

    return NextResponse.json({ message: "user_created", user }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid_payload";
    const status = message === "email_taken" || message === "password_too_short" || message === "email_required" ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

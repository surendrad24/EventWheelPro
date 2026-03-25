import { NextResponse } from "next/server";
import { AdminRole } from "@/lib/permissions";
import { requireAdminApiPermission } from "@/lib/server/admin-auth";
import {
  canAdminCreateRole,
  deleteAdminUser,
  getAdminUserById,
  updateAdminUser
} from "@/lib/server/auth-db";
import { resolveGravatarProfileImage } from "@/lib/server/gravatar";

type UpdateUserBody = {
  email?: string;
  role?: AdminRole;
  name?: string;
  phone?: string;
  address?: string;
  profileImageUrl?: string;
  isActive?: boolean;
  permissions?: unknown;
  password?: string;
};

function isAdminRole(value: unknown): value is AdminRole {
  return value === "super_admin" || value === "admin" || value === "moderator" || value === "finance";
}

function canManageTarget(actorRole: AdminRole, targetRole: AdminRole) {
  if (actorRole === "super_admin") {
    return true;
  }
  if (actorRole === "admin") {
    return targetRole === "moderator" || targetRole === "finance";
  }
  return false;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminApiPermission(request, "users", "view");
  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await params;
  const user = getAdminUserById(id);
  if (!user) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminApiPermission(request, "users", "edit");
  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await params;
  const existing = getAdminUserById(id);
  if (!existing) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  if (!canManageTarget(auth.admin.role, existing.role)) {
    return NextResponse.json({ error: "cannot_manage_target_user" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as UpdateUserBody;
  if (body.role !== undefined && !isAdminRole(body.role)) {
    return NextResponse.json({ error: "invalid_role" }, { status: 400 });
  }

  const nextRole = body.role ?? existing.role;
  if (!canAdminCreateRole(auth.admin.role, nextRole)) {
    return NextResponse.json({ error: "cannot_assign_target_role" }, { status: 403 });
  }

  try {
    const requestedEmail = typeof body.email === "string" ? body.email : undefined;
    const nextEmail = requestedEmail ?? existing.email;
    const manualProfileImageProvided = typeof body.profileImageUrl === "string";
    const manualProfileImage = manualProfileImageProvided ? body.profileImageUrl?.trim() ?? "" : undefined;
    const hasManualProfileImage = manualProfileImageProvided && Boolean(manualProfileImage);
    const shouldAttemptGravatar = !hasManualProfileImage && (requestedEmail !== undefined || !existing.profileImageUrl);
    const autoProfileImage = shouldAttemptGravatar
      ? await resolveGravatarProfileImage(nextEmail)
      : undefined;

    const user = updateAdminUser(id, {
      email: requestedEmail,
      role: body.role,
      name: typeof body.name === "string" ? body.name : undefined,
      phone: typeof body.phone === "string" ? body.phone : undefined,
      address: typeof body.address === "string" ? body.address : undefined,
      profileImageUrl: hasManualProfileImage
        ? manualProfileImage
        : autoProfileImage,
      isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
      permissions: body.permissions,
      password: typeof body.password === "string" ? body.password : undefined
    });

    return NextResponse.json({ message: "user_updated", user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid_payload";
    const status = message === "email_taken" || message === "password_too_short" ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminApiPermission(request, "users", "delete");
  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await params;
  const target = getAdminUserById(id);
  if (!target) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  if (target.id === auth.admin.id) {
    return NextResponse.json({ error: "cannot_delete_current_user" }, { status: 400 });
  }

  if (!canManageTarget(auth.admin.role, target.role)) {
    return NextResponse.json({ error: "cannot_manage_target_user" }, { status: 403 });
  }

  deleteAdminUser(id);
  return NextResponse.json({ message: "user_deleted" });
}

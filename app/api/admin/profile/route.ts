import { NextResponse } from "next/server";
import { getAdminFromRequest, requireAdminApiAuth } from "@/lib/server/admin-auth";
import { updateOwnProfile } from "@/lib/server/auth-db";
import { resolveGravatarProfileImage } from "@/lib/server/gravatar";

type UpdateProfileBody = {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  profileImageUrl?: string;
};

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ profile: admin });
}

export async function PATCH(request: Request) {
  const auth = requireAdminApiAuth(request);
  if ("error" in auth) {
    return auth.error;
  }

  const body = (await request.json().catch(() => ({}))) as UpdateProfileBody;

  try {
    const requestedEmail = typeof body.email === "string" ? body.email : undefined;
    const nextEmail = requestedEmail ?? auth.admin.email;
    const manualProfileImageProvided = typeof body.profileImageUrl === "string";
    const manualProfileImage = manualProfileImageProvided ? body.profileImageUrl?.trim() ?? "" : undefined;
    const hasManualProfileImage = manualProfileImageProvided && Boolean(manualProfileImage);
    const shouldAttemptGravatar = !hasManualProfileImage && (requestedEmail !== undefined || !auth.admin.profileImageUrl);
    const autoProfileImage = shouldAttemptGravatar
      ? await resolveGravatarProfileImage(nextEmail)
      : undefined;

    const user = updateOwnProfile(auth.admin.id, {
      name: typeof body.name === "string" ? body.name : undefined,
      email: requestedEmail,
      phone: typeof body.phone === "string" ? body.phone : undefined,
      address: typeof body.address === "string" ? body.address : undefined,
      profileImageUrl: hasManualProfileImage
        ? manualProfileImage
        : autoProfileImage
    });

    if (!user) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    return NextResponse.json({ message: "profile_updated", user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid_payload";
    const status = message === "email_taken" ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

import { createHash } from "node:crypto";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function gravatarHash(email: string) {
  return createHash("md5").update(normalizeEmail(email)).digest("hex");
}

export async function resolveGravatarProfileImage(email: string): Promise<string | undefined> {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return undefined;
  }

  const hash = gravatarHash(normalized);
  const probeUrl = `https://www.gravatar.com/avatar/${hash}?d=404&s=256&r=g`;

  try {
    const response = await fetch(probeUrl, {
      method: "HEAD",
      cache: "no-store"
    });
    if (response.ok) {
      return `https://www.gravatar.com/avatar/${hash}?s=256&r=g`;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

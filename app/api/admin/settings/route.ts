import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/server/admin-auth";
import { getPlatformSettings, updatePlatformSettings } from "@/lib/server/admin-config-db";

export async function GET(request: Request) {
  const auth = requireAdminApiAuth(request, ["super_admin"]);
  if ("error" in auth) {
    return auth.error;
  }
  return NextResponse.json({ settings: getPlatformSettings() });
}

export async function PATCH(request: Request) {
  const auth = requireAdminApiAuth(request, ["super_admin"]);
  if ("error" in auth) {
    return auth.error;
  }
  const body = await request.json().catch(() => ({}));
  const settings = updatePlatformSettings({
    brandName: typeof body.brandName === "string" ? body.brandName : undefined,
    supportEmail: typeof body.supportEmail === "string" ? body.supportEmail : undefined,
    defaultChainKey: typeof body.defaultChainKey === "string" ? body.defaultChainKey : undefined,
    defaultMinTokenBalance: typeof body.defaultMinTokenBalance === "number" ? body.defaultMinTokenBalance : undefined,
    defaultVerificationMode: typeof body.defaultVerificationMode === "string" ? body.defaultVerificationMode : undefined,
    webhookUrl: typeof body.webhookUrl === "string" ? body.webhookUrl : undefined,
    webhookSecret: typeof body.webhookSecret === "string" ? body.webhookSecret : undefined,
    maintenanceMode: typeof body.maintenanceMode === "boolean" ? body.maintenanceMode : undefined
  });
  return NextResponse.json({ message: "settings_updated", settings });
}

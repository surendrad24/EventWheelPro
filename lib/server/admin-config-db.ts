import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { Competition, PrizeTier, RegistrationField } from "@/lib/types";
import { store } from "@/lib/server/in-memory-store";

const DB_PATH = resolve(process.cwd(), "data/event-wheel.db");

export type PlatformSettings = {
  brandName: string;
  supportEmail: string;
  defaultChainKey: string;
  defaultMinTokenBalance: number;
  defaultVerificationMode: string;
  webhookUrl: string;
  webhookSecret: string;
  maintenanceMode: boolean;
  updatedAt: string;
};

export type CompetitionTemplate = {
  id: string;
  name: string;
  slug: string;
  mode: "wheel" | "flip" | "quiz";
  description: string;
  defaultStatus: Competition["status"];
  defaultThemeKey: string;
  defaultAnnouncementText: string;
  registrationFields: RegistrationField[];
  prizeTiers: PrizeTier[];
  createdAt: string;
  updatedAt: string;
};

type TemplateRow = {
  id: string;
  name: string;
  slug: string;
  mode: "wheel" | "flip" | "quiz";
  description: string;
  defaults_json: string;
  registration_fields_json: string;
  prize_tiers_json: string;
  created_at: string;
  updated_at: string;
};

function ensureDir(path: string) {
  mkdirSync(dirname(path), { recursive: true });
}

function nowIso() {
  return new Date().toISOString();
}

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const db = (() => {
  ensureDir(DB_PATH);
  const instance = new Database(DB_PATH);
  instance.pragma("journal_mode = WAL");
  instance.exec(`
    CREATE TABLE IF NOT EXISTS platform_settings (
      id TEXT PRIMARY KEY,
      brand_name TEXT NOT NULL,
      support_email TEXT NOT NULL,
      default_chain_key TEXT NOT NULL,
      default_min_token_balance REAL NOT NULL,
      default_verification_mode TEXT NOT NULL,
      webhook_url TEXT NOT NULL,
      webhook_secret TEXT NOT NULL,
      maintenance_mode INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS competition_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      mode TEXT NOT NULL,
      description TEXT NOT NULL,
      defaults_json TEXT NOT NULL,
      registration_fields_json TEXT NOT NULL,
      prize_tiers_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  return instance;
})();

function ensurePlatformDefaults() {
  const existing = db.prepare("SELECT id FROM platform_settings WHERE id = 'global' LIMIT 1").get() as { id: string } | undefined;
  if (existing) {
    return;
  }
  const ts = nowIso();
  db.prepare(`
    INSERT INTO platform_settings (
      id, brand_name, support_email, default_chain_key,
      default_min_token_balance, default_verification_mode,
      webhook_url, webhook_secret, maintenance_mode, updated_at
    ) VALUES ('global', ?, ?, ?, ?, ?, ?, ?, 0, ?)
  `).run(
    "FUSION MATRIX",
    "support@matrixclan.com",
    "BSC",
    0,
    "manual review",
    "",
    "",
    ts
  );
}

function ensureTemplateDefaults() {
  const existing = db.prepare("SELECT COUNT(*) as total FROM competition_templates").get() as { total: number };
  if (existing.total > 0) {
    return;
  }
  const ts = nowIso();
  const insert = db.prepare(`
    INSERT INTO competition_templates (
      id, name, slug, mode, description,
      defaults_json, registration_fields_json, prize_tiers_json,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insert.run(
    id("tmpl"),
    "Binance Weekend Party (Wheel)",
    "binance-weekend-party-wheel",
    "wheel",
    "Wheel-based live stream competition for weekend events.",
    JSON.stringify({
      status: "scheduled",
      themeKey: "wheel",
      announcementText: "Welcome to the Binance Weekend Party live wheel event."
    }),
    JSON.stringify([
      { key: "displayName", label: "Display Name", type: "text", required: true, placeholder: "Your display name" },
      { key: "exchangeId", label: "Binance ID", type: "text", required: true, placeholder: "Your Binance ID" },
      { key: "walletAddress", label: "Wallet", type: "wallet", required: true, placeholder: "0x..." },
      { key: "country", label: "Country", type: "country", required: true, placeholder: "Country" }
    ]),
    JSON.stringify([
      { id: "p1", label: "Standard Win", description: "Per-spin winner payout", quantity: 20, valueText: "1 BNB" },
      { id: "p2", label: "Grand Prize", description: "Winner of winners", quantity: 1, valueText: "5 BNB" }
    ]),
    ts,
    ts
  );

  insert.run(
    id("tmpl"),
    "Binance Weekend Flip",
    "binance-weekend-flip",
    "flip",
    "Flip-to-win live stream competition with Binance ID reveal animation.",
    JSON.stringify({
      status: "scheduled",
      themeKey: "flip",
      announcementText: "Welcome to the Binance Weekend Flip live event."
    }),
    JSON.stringify([
      { key: "displayName", label: "Display Name", type: "text", required: true, placeholder: "Your display name" },
      { key: "exchangeId", label: "Binance ID", type: "text", required: true, placeholder: "10-digit Binance ID" },
      { key: "walletAddress", label: "Wallet", type: "wallet", required: true, placeholder: "0x..." },
      { key: "country", label: "Country", type: "country", required: true, placeholder: "Country" }
    ]),
    JSON.stringify([
      { id: "f1", label: "Flip Win", description: "Per-flip winner payout", quantity: 20, valueText: "1 BNB" },
      { id: "f2", label: "Mega Flip", description: "Top winner payout", quantity: 1, valueText: "5 BNB" }
    ]),
    ts,
    ts
  );

  insert.run(
    id("tmpl"),
    "Binance Weekend Quiz",
    "binance-weekend-quiz",
    "quiz",
    "Quiz format event with score-based winners and no spin wheel.",
    JSON.stringify({
      status: "draft",
      themeKey: "quiz",
      announcementText: "Quiz event opens soon. Top scorers will win."
    }),
    JSON.stringify([
      { key: "displayName", label: "Display Name", type: "text", required: true, placeholder: "Your display name" },
      { key: "exchangeId", label: "Binance ID", type: "text", required: true, placeholder: "Your Binance ID" },
      { key: "email", label: "Email", type: "email", required: true, placeholder: "you@example.com" },
      { key: "country", label: "Country", type: "country", required: true, placeholder: "Country" }
    ]),
    JSON.stringify([
      { id: "q1", label: "Top Scorer", description: "Highest score", quantity: 1, valueText: "5 BNB" },
      { id: "q2", label: "Runner Up", description: "Second place", quantity: 2, valueText: "2 BNB" }
    ]),
    ts,
    ts
  );
}

ensurePlatformDefaults();
ensureTemplateDefaults();

function toTemplate(row: TemplateRow): CompetitionTemplate {
  const defaults = parseJson<{ status?: Competition["status"]; themeKey?: string; announcementText?: string }>(
    row.defaults_json,
    {}
  );
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    mode: row.mode,
    description: row.description,
    defaultStatus: defaults.status ?? "draft",
    defaultThemeKey: defaults.themeKey ?? (row.mode === "quiz" ? "quiz" : row.mode === "flip" ? "flip" : "wheel"),
    defaultAnnouncementText: defaults.announcementText ?? "",
    registrationFields: parseJson<RegistrationField[]>(row.registration_fields_json, []),
    prizeTiers: parseJson<PrizeTier[]>(row.prize_tiers_json, []),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function getPlatformSettings(): PlatformSettings {
  const row = db.prepare("SELECT * FROM platform_settings WHERE id = 'global' LIMIT 1").get() as {
    brand_name: string;
    support_email: string;
    default_chain_key: string;
    default_min_token_balance: number;
    default_verification_mode: string;
    webhook_url: string;
    webhook_secret: string;
    maintenance_mode: number;
    updated_at: string;
  };
  return {
    brandName: row.brand_name,
    supportEmail: row.support_email,
    defaultChainKey: row.default_chain_key,
    defaultMinTokenBalance: row.default_min_token_balance,
    defaultVerificationMode: row.default_verification_mode,
    webhookUrl: row.webhook_url,
    webhookSecret: row.webhook_secret,
    maintenanceMode: row.maintenance_mode === 1,
    updatedAt: row.updated_at
  };
}

export function updatePlatformSettings(input: Partial<PlatformSettings>) {
  const current = getPlatformSettings();
  const next: PlatformSettings = {
    brandName: (input.brandName ?? current.brandName).trim() || current.brandName,
    supportEmail: (input.supportEmail ?? current.supportEmail).trim() || current.supportEmail,
    defaultChainKey: (input.defaultChainKey ?? current.defaultChainKey).trim() || current.defaultChainKey,
    defaultMinTokenBalance: Number.isFinite(input.defaultMinTokenBalance)
      ? Number(input.defaultMinTokenBalance)
      : current.defaultMinTokenBalance,
    defaultVerificationMode: (input.defaultVerificationMode ?? current.defaultVerificationMode).trim() || current.defaultVerificationMode,
    webhookUrl: (input.webhookUrl ?? current.webhookUrl).trim(),
    webhookSecret: (input.webhookSecret ?? current.webhookSecret).trim(),
    maintenanceMode: typeof input.maintenanceMode === "boolean" ? input.maintenanceMode : current.maintenanceMode,
    updatedAt: nowIso()
  };

  db.prepare(`
    UPDATE platform_settings
    SET brand_name = ?, support_email = ?, default_chain_key = ?, default_min_token_balance = ?,
        default_verification_mode = ?, webhook_url = ?, webhook_secret = ?, maintenance_mode = ?, updated_at = ?
    WHERE id = 'global'
  `).run(
    next.brandName,
    next.supportEmail,
    next.defaultChainKey,
    next.defaultMinTokenBalance,
    next.defaultVerificationMode,
    next.webhookUrl,
    next.webhookSecret,
    next.maintenanceMode ? 1 : 0,
    next.updatedAt
  );

  return getPlatformSettings();
}

export function listCompetitionTemplates() {
  const rows = db.prepare("SELECT * FROM competition_templates ORDER BY updated_at DESC").all() as TemplateRow[];
  return rows.map(toTemplate);
}

export function getCompetitionTemplateById(templateId: string) {
  const row = db.prepare("SELECT * FROM competition_templates WHERE id = ? LIMIT 1").get(templateId) as TemplateRow | undefined;
  return row ? toTemplate(row) : null;
}

export function createCompetitionTemplate(input: {
  name: string;
  slug?: string;
  mode: "wheel" | "flip" | "quiz";
  description?: string;
  defaultStatus?: Competition["status"];
  defaultThemeKey?: string;
  defaultAnnouncementText?: string;
  registrationFields?: RegistrationField[];
  prizeTiers?: PrizeTier[];
}) {
  const name = input.name.trim();
  if (!name) {
    throw new Error("name_required");
  }
  const slug = slugify(input.slug?.trim() || name);
  if (!slug) {
    throw new Error("slug_required");
  }
  const slugOwner = db.prepare("SELECT id FROM competition_templates WHERE slug = ? LIMIT 1").get(slug) as { id: string } | undefined;
  if (slugOwner) {
    throw new Error("slug_taken");
  }

  const idValue = id("tmpl");
  const ts = nowIso();
  db.prepare(`
    INSERT INTO competition_templates (
      id, name, slug, mode, description, defaults_json,
      registration_fields_json, prize_tiers_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    idValue,
    name,
    slug,
    input.mode,
    input.description?.trim() ?? "",
    JSON.stringify({
      status: input.defaultStatus ?? "draft",
      themeKey: input.defaultThemeKey ?? (input.mode === "quiz" ? "quiz" : input.mode === "flip" ? "flip" : "wheel"),
      announcementText: input.defaultAnnouncementText ?? ""
    }),
    JSON.stringify(input.registrationFields ?? []),
    JSON.stringify(input.prizeTiers ?? []),
    ts,
    ts
  );
  return getCompetitionTemplateById(idValue);
}

export function updateCompetitionTemplate(
  templateId: string,
  input: {
    name?: string;
    slug?: string;
    mode?: "wheel" | "flip" | "quiz";
    description?: string;
    defaultStatus?: Competition["status"];
    defaultThemeKey?: string;
    defaultAnnouncementText?: string;
    registrationFields?: RegistrationField[];
    prizeTiers?: PrizeTier[];
  }
) {
  const current = getCompetitionTemplateById(templateId);
  if (!current) {
    return null;
  }
  const name = input.name === undefined ? current.name : input.name.trim();
  if (!name) {
    throw new Error("name_required");
  }
  const slug = input.slug === undefined ? current.slug : slugify(input.slug);
  if (!slug) {
    throw new Error("slug_required");
  }
  const slugOwner = db.prepare("SELECT id FROM competition_templates WHERE slug = ? LIMIT 1").get(slug) as { id: string } | undefined;
  if (slugOwner && slugOwner.id !== templateId) {
    throw new Error("slug_taken");
  }
  const mode = input.mode ?? current.mode;
  db.prepare(`
    UPDATE competition_templates
    SET name = ?, slug = ?, mode = ?, description = ?, defaults_json = ?,
        registration_fields_json = ?, prize_tiers_json = ?, updated_at = ?
    WHERE id = ?
  `).run(
    name,
    slug,
    mode,
    input.description === undefined ? current.description : input.description.trim(),
    JSON.stringify({
      status: input.defaultStatus ?? current.defaultStatus,
      themeKey: input.defaultThemeKey ?? current.defaultThemeKey,
      announcementText: input.defaultAnnouncementText ?? current.defaultAnnouncementText
    }),
    JSON.stringify(input.registrationFields ?? current.registrationFields),
    JSON.stringify(input.prizeTiers ?? current.prizeTiers),
    nowIso(),
    templateId
  );
  return getCompetitionTemplateById(templateId);
}

export function deleteCompetitionTemplate(templateId: string) {
  const exists = db.prepare("SELECT id FROM competition_templates WHERE id = ? LIMIT 1").get(templateId) as { id: string } | undefined;
  if (!exists) {
    return false;
  }
  db.prepare("DELETE FROM competition_templates WHERE id = ?").run(templateId);
  return true;
}

export function createCompetitionFromTemplate(templateId: string, input?: {
  title?: string;
  slug?: string;
  status?: Competition["status"];
  eventStartAt?: string;
  eventEndAt?: string;
  registrationOpenAt?: string;
  registrationCloseAt?: string;
}) {
  const template = getCompetitionTemplateById(templateId);
  if (!template) {
    throw new Error("template_not_found");
  }
  const now = nowIso();
  const title = input?.title?.trim() || `${template.name} ${new Date().toISOString().slice(0, 10)}`;
  return store.createCompetition({
    title,
    slug: input?.slug,
    status: input?.status ?? template.defaultStatus,
    gameType: template.mode === "quiz"
      ? "quiz"
      : template.mode === "flip"
        ? "flip_to_win"
        : "wheel_of_fortune",
    themeKey: template.defaultThemeKey,
    description: template.description,
    announcementText: template.defaultAnnouncementText,
    chainKey: getPlatformSettings().defaultChainKey,
    minTokenBalance: getPlatformSettings().defaultMinTokenBalance,
    verificationMode: getPlatformSettings().defaultVerificationMode,
    registrationOpenAt: input?.registrationOpenAt ?? now,
    registrationCloseAt: input?.registrationCloseAt ?? now,
    eventStartAt: input?.eventStartAt ?? now,
    eventEndAt: input?.eventEndAt ?? now,
    registrationFields: template.registrationFields,
    prizeTiers: template.prizeTiers
  });
}

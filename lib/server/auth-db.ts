import Database from "better-sqlite3";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  AdminFeature,
  AdminRole,
  FeaturePermissions,
  PermissionAction,
  defaultRolePermissions,
  hasPermission,
  normalizePermissions
} from "@/lib/permissions";

type DbAdminUser = {
  id: string;
  email: string;
  password_hash: string;
  role: AdminRole;
  permissions_json: string;
  is_active: number;
  name: string | null;
  phone: string | null;
  address: string | null;
  profile_image_url: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
};

type DbAdminSession = {
  id: string;
  user_id: string;
  session_token_hash: string;
  expires_at: string;
  revoked_at: string | null;
};

export type SessionAdmin = {
  id: string;
  email: string;
  role: AdminRole;
  permissions: FeaturePermissions;
  isActive: boolean;
  name?: string;
  phone?: string;
  address?: string;
  profileImageUrl?: string;
};

export type AdminUserRecord = {
  id: string;
  email: string;
  role: AdminRole;
  permissions: FeaturePermissions;
  isActive: boolean;
  isOnline: boolean;
  name?: string;
  phone?: string;
  address?: string;
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
};

const DB_PATH = resolve(process.cwd(), "data/event-wheel.db");
const DEFAULT_SUPER_ADMIN_EMAIL = (process.env.DEMO_ADMIN_EMAIL ?? "admin@eventwheelpro.local").toLowerCase();
const DEFAULT_SUPER_ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD ?? "admin123";
const DEFAULT_ADMIN_EMAIL = (process.env.DEMO_OPS_ADMIN_EMAIL ?? "ops-admin@eventwheelpro.local").toLowerCase();
const DEFAULT_ADMIN_PASSWORD = process.env.DEMO_OPS_ADMIN_PASSWORD ?? "opsadmin123";
const DEFAULT_MODERATOR_EMAIL = (process.env.DEMO_MODERATOR_EMAIL ?? "moderator@eventwheelpro.local").toLowerCase();
const DEFAULT_MODERATOR_PASSWORD = process.env.DEMO_MODERATOR_PASSWORD ?? "moderator123";
const DEFAULT_FINANCE_EMAIL = (process.env.DEMO_FINANCE_EMAIL ?? "finance@eventwheelpro.local").toLowerCase();
const DEFAULT_FINANCE_PASSWORD = process.env.DEMO_FINANCE_PASSWORD ?? "finance123";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

function nowIso() {
  return new Date().toISOString();
}

function id(prefix: string) {
  return `${prefix}-${randomBytes(8).toString("hex")}`;
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function hashPassword(password: string, saltHex = randomBytes(16).toString("hex")) {
  const key = scryptSync(password, saltHex, 64).toString("hex");
  return `scrypt$${saltHex}$${key}`;
}

function verifyPassword(password: string, encoded: string) {
  const [method, saltHex, expectedHex] = encoded.split("$");
  if (method !== "scrypt" || !saltHex || !expectedHex) {
    return false;
  }
  const actual = scryptSync(password, saltHex, 64);
  const expected = Buffer.from(expectedHex, "hex");
  if (actual.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(actual, expected);
}

function ensureDir(path: string) {
  mkdirSync(dirname(path), { recursive: true });
}

function parsePermissions(raw: string, role: AdminRole) {
  try {
    return normalizePermissions(JSON.parse(raw), role);
  } catch {
    return defaultRolePermissions(role);
  }
}

function toAdminUserRecord(row: DbAdminUser, onlineUserIds?: Set<string>): AdminUserRecord {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    permissions: parsePermissions(row.permissions_json, row.role),
    isActive: row.is_active === 1,
    isOnline: onlineUserIds ? onlineUserIds.has(row.id) : false,
    name: row.name ?? undefined,
    phone: row.phone ?? undefined,
    address: row.address ?? undefined,
    profileImageUrl: row.profile_image_url ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at ?? undefined
  };
}

const db = (() => {
  ensureDir(DB_PATH);
  const instance = new Database(DB_PATH);
  instance.pragma("journal_mode = WAL");
  instance.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      permissions_json TEXT NOT NULL DEFAULT '{}',
      is_active INTEGER NOT NULL DEFAULT 1,
      name TEXT,
      phone TEXT,
      address TEXT,
      profile_image_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_login_at TEXT
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      session_token_hash TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      revoked_at TEXT,
      ip_address TEXT,
      user_agent TEXT,
      FOREIGN KEY(user_id) REFERENCES admin_users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);
  `);
  return instance;
})();

function ensureAdminUserColumns() {
  const columns = db.prepare("PRAGMA table_info(admin_users)").all() as Array<{ name: string }>;
  const names = new Set(columns.map((column) => column.name));

  if (!names.has("permissions_json")) {
    db.exec("ALTER TABLE admin_users ADD COLUMN permissions_json TEXT NOT NULL DEFAULT '{}'");
  }
  if (!names.has("is_active")) {
    db.exec("ALTER TABLE admin_users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1");
  }
  if (!names.has("name")) {
    db.exec("ALTER TABLE admin_users ADD COLUMN name TEXT");
  }
  if (!names.has("phone")) {
    db.exec("ALTER TABLE admin_users ADD COLUMN phone TEXT");
  }
  if (!names.has("address")) {
    db.exec("ALTER TABLE admin_users ADD COLUMN address TEXT");
  }
  if (!names.has("profile_image_url")) {
    db.exec("ALTER TABLE admin_users ADD COLUMN profile_image_url TEXT");
  }
}

ensureAdminUserColumns();

function seedAdminUser(email: string, password: string, role: AdminRole, name: string) {
  const userId = id("admin");
  const passwordHash = hashPassword(password);
  const now = nowIso();
  const permissions = JSON.stringify(defaultRolePermissions(role));

  db.prepare(`
    INSERT OR IGNORE INTO admin_users
    (id, email, password_hash, role, permissions_json, is_active, name, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
  `).run(userId, email, passwordHash, role, permissions, name, now, now);

  db.prepare(`
    UPDATE admin_users
    SET permissions_json = CASE
      WHEN permissions_json IS NULL OR permissions_json = '' OR permissions_json = '{}' THEN ?
      ELSE permissions_json
    END,
    role = ?,
    updated_at = ?
    WHERE email = ?
  `).run(permissions, role, now, email);
}

seedAdminUser(DEFAULT_SUPER_ADMIN_EMAIL, DEFAULT_SUPER_ADMIN_PASSWORD, "super_admin", "Super Admin");
seedAdminUser(DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD, "admin", "Ops Admin");
seedAdminUser(DEFAULT_MODERATOR_EMAIL, DEFAULT_MODERATOR_PASSWORD, "moderator", "Moderator");
seedAdminUser(DEFAULT_FINANCE_EMAIL, DEFAULT_FINANCE_PASSWORD, "finance", "Finance");

export function canAdminCreateRole(creator: AdminRole, target: AdminRole) {
  if (creator === "super_admin") {
    return true;
  }
  if (creator === "admin") {
    return target === "moderator" || target === "finance";
  }
  return false;
}

export function authenticateAdmin(email: string, password: string): SessionAdmin | null {
  const user = db
    .prepare("SELECT * FROM admin_users WHERE email = ? LIMIT 1")
    .get(email.toLowerCase()) as DbAdminUser | undefined;
  if (!user) {
    return null;
  }
  if (user.is_active !== 1) {
    return null;
  }
  if (!verifyPassword(password, user.password_hash)) {
    return null;
  }
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    permissions: parsePermissions(user.permissions_json, user.role),
    isActive: true,
    name: user.name ?? undefined,
    phone: user.phone ?? undefined,
    address: user.address ?? undefined,
    profileImageUrl: user.profile_image_url ?? undefined
  };
}

export function createAdminSession(user: SessionAdmin, meta?: { ip?: string; userAgent?: string }) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);
  const sessionId = id("sess");
  const now = nowIso();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  db.prepare(`
    INSERT INTO admin_sessions
    (id, user_id, session_token_hash, created_at, last_seen_at, expires_at, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    sessionId,
    user.id,
    tokenHash,
    now,
    now,
    expiresAt,
    meta?.ip ?? null,
    meta?.userAgent ?? null
  );

  db.prepare("UPDATE admin_users SET last_login_at = ?, updated_at = ? WHERE id = ?").run(now, now, user.id);

  return { token, expiresAt };
}

export function revokeAdminSessionByToken(token: string) {
  const tokenHash = hashSessionToken(token);
  db.prepare("UPDATE admin_sessions SET revoked_at = ? WHERE session_token_hash = ? AND revoked_at IS NULL")
    .run(nowIso(), tokenHash);
}

export function getAdminBySessionToken(token: string): SessionAdmin | null {
  const tokenHash = hashSessionToken(token);
  const now = nowIso();

  const row = db.prepare(`
    SELECT
      s.id as id,
      s.user_id as user_id,
      s.session_token_hash as session_token_hash,
      s.expires_at as expires_at,
      s.revoked_at as revoked_at,
      u.*
    FROM admin_sessions s
    INNER JOIN admin_users u ON u.id = s.user_id
    WHERE s.session_token_hash = ?
    LIMIT 1
  `).get(tokenHash) as (DbAdminSession & DbAdminUser) | undefined;

  if (!row || row.revoked_at || row.expires_at <= now || row.is_active !== 1) {
    return null;
  }

  db.prepare("UPDATE admin_sessions SET last_seen_at = ? WHERE id = ?").run(now, row.id);
  return {
    id: row.user_id,
    email: row.email,
    role: row.role,
    permissions: parsePermissions(row.permissions_json, row.role),
    isActive: row.is_active === 1,
    name: row.name ?? undefined,
    phone: row.phone ?? undefined,
    address: row.address ?? undefined,
    profileImageUrl: row.profile_image_url ?? undefined
  };
}

export function canAdminPerform(user: SessionAdmin, feature: AdminFeature, action: PermissionAction) {
  return hasPermission(user.permissions, feature, action);
}

export function listAdminUsers() {
  const now = nowIso();
  const onlineUserIds = new Set(
    (db.prepare(`
      SELECT DISTINCT user_id
      FROM admin_sessions
      WHERE revoked_at IS NULL
        AND expires_at > ?
    `).all(now) as Array<{ user_id: string }>).map((row) => row.user_id)
  );
  const rows = db.prepare("SELECT * FROM admin_users ORDER BY created_at DESC").all() as DbAdminUser[];
  return rows.map((row) => toAdminUserRecord(row, onlineUserIds));
}

export function getAdminUserById(userId: string) {
  const now = nowIso();
  const onlineUserIds = new Set(
    (db.prepare(`
      SELECT DISTINCT user_id
      FROM admin_sessions
      WHERE revoked_at IS NULL
        AND expires_at > ?
        AND user_id = ?
    `).all(now, userId) as Array<{ user_id: string }>).map((row) => row.user_id)
  );
  const row = db.prepare("SELECT * FROM admin_users WHERE id = ? LIMIT 1").get(userId) as DbAdminUser | undefined;
  return row ? toAdminUserRecord(row, onlineUserIds) : null;
}

export function createAdminUser(input: {
  email: string;
  password: string;
  role: AdminRole;
  name?: string;
  phone?: string;
  address?: string;
  profileImageUrl?: string;
  permissions?: unknown;
}) {
  const email = input.email.trim().toLowerCase();
  if (!email) {
    throw new Error("email_required");
  }
  if (!input.password || input.password.length < 8) {
    throw new Error("password_too_short");
  }

  const existing = db.prepare("SELECT id FROM admin_users WHERE email = ? LIMIT 1").get(email) as { id: string } | undefined;
  if (existing) {
    throw new Error("email_taken");
  }

  const createdAt = nowIso();
  const userId = id("admin");
  const permissions = normalizePermissions(input.permissions, input.role);

  db.prepare(`
    INSERT INTO admin_users (
      id, email, password_hash, role, permissions_json, is_active,
      name, phone, address, profile_image_url,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    email,
    hashPassword(input.password),
    input.role,
    JSON.stringify(permissions),
    1,
    input.name?.trim() || null,
    input.phone?.trim() || null,
    input.address?.trim() || null,
    input.profileImageUrl?.trim() || null,
    createdAt,
    createdAt
  );

  return getAdminUserById(userId);
}

export function updateAdminUser(
  userId: string,
  input: {
    email?: string;
    role?: AdminRole;
    name?: string;
    phone?: string;
    address?: string;
    profileImageUrl?: string;
    isActive?: boolean;
    permissions?: unknown;
    password?: string;
  }
) {
  const existing = db.prepare("SELECT * FROM admin_users WHERE id = ? LIMIT 1").get(userId) as DbAdminUser | undefined;
  if (!existing) {
    return null;
  }

  const role = input.role ?? existing.role;
  const permissions = normalizePermissions(input.permissions ?? parsePermissions(existing.permissions_json, role), role);
  const email = (input.email ?? existing.email).trim().toLowerCase();

  const emailOwner = db.prepare("SELECT id FROM admin_users WHERE email = ? LIMIT 1").get(email) as { id: string } | undefined;
  if (emailOwner && emailOwner.id !== userId) {
    throw new Error("email_taken");
  }

  db.prepare(`
    UPDATE admin_users
    SET email = ?,
        role = ?,
        permissions_json = ?,
        is_active = ?,
        name = ?,
        phone = ?,
        address = ?,
        profile_image_url = ?,
        updated_at = ?
    WHERE id = ?
  `).run(
    email,
    role,
    JSON.stringify(permissions),
    input.isActive === undefined ? existing.is_active : (input.isActive ? 1 : 0),
    input.name === undefined ? existing.name : input.name.trim() || null,
    input.phone === undefined ? existing.phone : input.phone.trim() || null,
    input.address === undefined ? existing.address : input.address.trim() || null,
    input.profileImageUrl === undefined ? existing.profile_image_url : input.profileImageUrl.trim() || null,
    nowIso(),
    userId
  );

  if (typeof input.password === "string" && input.password.length >= 8) {
    db.prepare("UPDATE admin_users SET password_hash = ?, updated_at = ? WHERE id = ?")
      .run(hashPassword(input.password), nowIso(), userId);
  }

  return getAdminUserById(userId);
}

export function deleteAdminUser(userId: string) {
  const existing = db.prepare("SELECT id FROM admin_users WHERE id = ? LIMIT 1").get(userId) as { id: string } | undefined;
  if (!existing) {
    return false;
  }

  const tx = db.transaction(() => {
    db.prepare("DELETE FROM admin_sessions WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM admin_users WHERE id = ?").run(userId);
  });
  tx();
  return true;
}

export function updateOwnProfile(
  userId: string,
  input: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    profileImageUrl?: string;
  }
) {
  const user = db.prepare("SELECT * FROM admin_users WHERE id = ? LIMIT 1").get(userId) as DbAdminUser | undefined;
  if (!user) {
    return null;
  }

  const email = (input.email ?? user.email).trim().toLowerCase();
  const owner = db.prepare("SELECT id FROM admin_users WHERE email = ? LIMIT 1").get(email) as { id: string } | undefined;
  if (owner && owner.id !== userId) {
    throw new Error("email_taken");
  }

  db.prepare(`
    UPDATE admin_users
    SET name = ?, email = ?, phone = ?, address = ?, profile_image_url = ?, updated_at = ?
    WHERE id = ?
  `).run(
    input.name === undefined ? user.name : input.name.trim() || null,
    email,
    input.phone === undefined ? user.phone : input.phone.trim() || null,
    input.address === undefined ? user.address : input.address.trim() || null,
    input.profileImageUrl === undefined ? user.profile_image_url : input.profileImageUrl.trim() || null,
    nowIso(),
    userId
  );

  return getAdminUserById(userId);
}

export function changeOwnPassword(userId: string, currentPassword: string, newPassword: string) {
  const user = db.prepare("SELECT * FROM admin_users WHERE id = ? LIMIT 1").get(userId) as DbAdminUser | undefined;
  if (!user) {
    return false;
  }
  if (!verifyPassword(currentPassword, user.password_hash)) {
    return false;
  }
  if (!newPassword || newPassword.length < 8) {
    throw new Error("password_too_short");
  }

  db.prepare("UPDATE admin_users SET password_hash = ?, updated_at = ? WHERE id = ?")
    .run(hashPassword(newPassword), nowIso(), userId);
  return true;
}

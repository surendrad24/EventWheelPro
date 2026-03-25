import Database from "better-sqlite3";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

type DbAdminUser = {
  id: string;
  email: string;
  password_hash: string;
  role: string;
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
  role: string;
};

const DB_PATH = resolve(process.cwd(), "data/event-wheel.db");
const DEFAULT_ADMIN_EMAIL = (process.env.DEMO_ADMIN_EMAIL ?? "admin@eventwheelpro.local").toLowerCase();
const DEFAULT_ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD ?? "admin123";
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

function seedDefaultAdmin() {
  const userId = id("admin");
  const passwordHash = hashPassword(DEFAULT_ADMIN_PASSWORD);
  const now = nowIso();
  db.prepare(`
    INSERT OR IGNORE INTO admin_users (id, email, password_hash, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId, DEFAULT_ADMIN_EMAIL, passwordHash, "super_admin", now, now);
}

seedDefaultAdmin();

export function authenticateAdmin(email: string, password: string): SessionAdmin | null {
  const user = db
    .prepare("SELECT id, email, password_hash, role FROM admin_users WHERE email = ?")
    .get(email.toLowerCase()) as DbAdminUser | undefined;
  if (!user) {
    return null;
  }
  if (!verifyPassword(password, user.password_hash)) {
    return null;
  }
  return {
    id: user.id,
    email: user.email,
    role: user.role
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
      u.id as admin_id,
      u.email as admin_email,
      u.role as admin_role
    FROM admin_sessions s
    INNER JOIN admin_users u ON u.id = s.user_id
    WHERE s.session_token_hash = ?
    LIMIT 1
  `).get(tokenHash) as
    | (DbAdminSession & {
      admin_id: string;
      admin_email: string;
      admin_role: string;
    })
    | undefined;

  if (!row) {
    return null;
  }
  if (row.revoked_at) {
    return null;
  }
  if (row.expires_at <= now) {
    return null;
  }

  db.prepare("UPDATE admin_sessions SET last_seen_at = ? WHERE id = ?").run(now, row.id);
  return {
    id: row.admin_id,
    email: row.admin_email,
    role: row.admin_role
  };
}

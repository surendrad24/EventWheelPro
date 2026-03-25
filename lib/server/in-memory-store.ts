import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  competitions as seedCompetitions,
  eventLogs as seedLogs,
  participants as seedParticipants,
  spins as seedSpins,
  winners as seedWinners
} from "@/lib/mock-data";
import type { Competition, EventLog, Participant, Spin, Winner } from "@/lib/types";

type RegistrationPayload = {
  displayName: string;
  exchangeNickname?: string;
  exchangeId?: string;
  walletAddress?: string;
  email?: string;
  telegramHandle?: string;
  country?: string;
};

type DashboardStats = {
  activeEvents: number;
  totalParticipants: number;
  pendingVerification: number;
  unpaidWinners: number;
};

type CreateCompetitionPayload = Partial<Competition> & {
  title?: string;
  slug?: string;
};

type PatchCompetitionPayload = Partial<Competition>;

type CompetitionRow = {
  id: string;
  slug: string;
  title: string;
  status: Competition["status"];
  theme_key: string;
  description: string;
  announcement_text: string;
  chain_key: string;
  token_contract_address: string;
  min_token_balance: number;
  verification_mode: string;
  registration_open_at: string;
  registration_close_at: string;
  event_start_at: string;
  event_end_at: string;
  total_winner_slots: number;
  auto_remove_winners: number;
  leaderboard_public: number;
  allow_public_winners: number;
  recent_winner_ids_json: string;
  stats_json: string;
  registration_fields_json: string;
  prize_tiers_json: string;
};

type ParticipantRow = {
  id: string;
  competition_id: string;
  display_name: string;
  exchange_nickname: string | null;
  exchange_id: string | null;
  wallet_address: string | null;
  email: string | null;
  telegram_handle: string | null;
  country: string;
  registration_status: Participant["registrationStatus"];
  verification_status: Participant["verificationStatus"];
  duplicate_risk_score: number;
  joined_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  rejected_reason: string | null;
  ip_hash: string | null;
  device_fingerprint_hash: string | null;
  recent: number;
  wins: number;
};

type WinnerRow = {
  id: string;
  competition_id: string;
  participant_id: string;
  display_name: string;
  prize_label: string;
  round_number: number;
  won_at: string;
  claim_status: Winner["claimStatus"];
  payout_status: Winner["payoutStatus"];
  claim_deadline_at: string;
  claimed_at: string | null;
  verified_at: string | null;
  paid_at: string | null;
  transaction_reference: string | null;
};

type SpinRow = {
  id: string;
  competition_id: string;
  round_number: number;
  started_at: string;
  ended_at: string;
  initiated_by: string;
  rng_mode: string;
  seed_commit_hash: string;
  result_participant_id: string;
  result_display_name: string;
};

type EventLogRow = {
  id: string;
  competition_id: string | null;
  actor: string;
  action: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
  payload_summary: string;
};

const DB_PATH = resolve(process.cwd(), "data/event-wheel.db");
const GLOBAL_KEY = "__event_wheel_store_v2__";

function ensureDir(path: string) {
  mkdirSync(dirname(path), { recursive: true });
}

function nowIso() {
  return new Date().toISOString();
}

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function toSlug(input: string) {
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

function toCompetition(row: CompetitionRow): Competition {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    status: row.status,
    themeKey: row.theme_key,
    description: row.description,
    announcementText: row.announcement_text,
    chainKey: row.chain_key,
    tokenContractAddress: row.token_contract_address,
    minTokenBalance: row.min_token_balance,
    verificationMode: row.verification_mode,
    registrationOpenAt: row.registration_open_at,
    registrationCloseAt: row.registration_close_at,
    eventStartAt: row.event_start_at,
    eventEndAt: row.event_end_at,
    totalWinnerSlots: row.total_winner_slots,
    autoRemoveWinners: row.auto_remove_winners === 1,
    leaderboardPublic: row.leaderboard_public === 1,
    allowPublicWinners: row.allow_public_winners === 1,
    recentWinnerIds: parseJson<string[]>(row.recent_winner_ids_json, []),
    stats: parseJson<Competition["stats"]>(row.stats_json, {
      totalParticipants: 0,
      totalApproved: 0,
      pendingVerification: 0,
      totalWinners: 0
    }),
    registrationFields: parseJson(row.registration_fields_json, []),
    prizeTiers: parseJson(row.prize_tiers_json, [])
  };
}

function toParticipant(row: ParticipantRow): Participant {
  return {
    id: row.id,
    competitionId: row.competition_id,
    displayName: row.display_name,
    exchangeNickname: row.exchange_nickname ?? undefined,
    exchangeId: row.exchange_id ?? undefined,
    walletAddress: row.wallet_address ?? undefined,
    email: row.email ?? undefined,
    telegramHandle: row.telegram_handle ?? undefined,
    country: row.country,
    registrationStatus: row.registration_status,
    verificationStatus: row.verification_status,
    duplicateRiskScore: row.duplicate_risk_score,
    joinedAt: row.joined_at,
    approvedAt: row.approved_at ?? undefined,
    rejectedAt: row.rejected_at ?? undefined,
    rejectedReason: row.rejected_reason ?? undefined,
    ipHash: row.ip_hash ?? undefined,
    deviceFingerprintHash: row.device_fingerprint_hash ?? undefined,
    recent: row.recent === 1,
    wins: row.wins
  };
}

function toWinner(row: WinnerRow): Winner {
  return {
    id: row.id,
    competitionId: row.competition_id,
    participantId: row.participant_id,
    displayName: row.display_name,
    prizeLabel: row.prize_label,
    roundNumber: row.round_number,
    wonAt: row.won_at,
    claimStatus: row.claim_status,
    payoutStatus: row.payout_status,
    claimDeadlineAt: row.claim_deadline_at,
    claimedAt: row.claimed_at ?? undefined,
    verifiedAt: row.verified_at ?? undefined,
    paidAt: row.paid_at ?? undefined,
    transactionReference: row.transaction_reference ?? undefined
  };
}

function toSpin(row: SpinRow): Spin {
  return {
    id: row.id,
    competitionId: row.competition_id,
    roundNumber: row.round_number,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    initiatedBy: row.initiated_by,
    rngMode: row.rng_mode,
    seedCommitHash: row.seed_commit_hash,
    resultParticipantId: row.result_participant_id,
    resultDisplayName: row.result_display_name
  };
}

function toEventLog(row: EventLogRow): EventLog {
  return {
    id: row.id,
    competitionId: row.competition_id ?? undefined,
    actor: row.actor,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    createdAt: row.created_at,
    payloadSummary: row.payload_summary
  };
}

class SQLiteStore {
  private db: Database.Database;

  constructor() {
    ensureDir(DB_PATH);
    this.db = new Database(DB_PATH);
    this.db.pragma("journal_mode = WAL");
    this.initSchema();
    this.seedIfNeeded();
  }

  private initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS competitions (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        status TEXT NOT NULL,
        theme_key TEXT NOT NULL,
        description TEXT NOT NULL,
        announcement_text TEXT NOT NULL,
        chain_key TEXT NOT NULL,
        token_contract_address TEXT NOT NULL,
        min_token_balance REAL NOT NULL,
        verification_mode TEXT NOT NULL,
        registration_open_at TEXT NOT NULL,
        registration_close_at TEXT NOT NULL,
        event_start_at TEXT NOT NULL,
        event_end_at TEXT NOT NULL,
        total_winner_slots INTEGER NOT NULL,
        auto_remove_winners INTEGER NOT NULL,
        leaderboard_public INTEGER NOT NULL,
        allow_public_winners INTEGER NOT NULL,
        recent_winner_ids_json TEXT NOT NULL,
        stats_json TEXT NOT NULL,
        registration_fields_json TEXT NOT NULL,
        prize_tiers_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS participants (
        id TEXT PRIMARY KEY,
        competition_id TEXT NOT NULL,
        display_name TEXT NOT NULL,
        exchange_nickname TEXT,
        exchange_id TEXT,
        wallet_address TEXT,
        email TEXT,
        telegram_handle TEXT,
        country TEXT NOT NULL,
        registration_status TEXT NOT NULL,
        verification_status TEXT NOT NULL,
        duplicate_risk_score REAL NOT NULL,
        joined_at TEXT NOT NULL,
        approved_at TEXT,
        rejected_at TEXT,
        rejected_reason TEXT,
        ip_hash TEXT,
        device_fingerprint_hash TEXT,
        recent INTEGER NOT NULL,
        wins INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(competition_id) REFERENCES competitions(id)
      );

      CREATE TABLE IF NOT EXISTS winners (
        id TEXT PRIMARY KEY,
        competition_id TEXT NOT NULL,
        participant_id TEXT NOT NULL,
        display_name TEXT NOT NULL,
        prize_label TEXT NOT NULL,
        round_number INTEGER NOT NULL,
        won_at TEXT NOT NULL,
        claim_status TEXT NOT NULL,
        payout_status TEXT NOT NULL,
        claim_deadline_at TEXT NOT NULL,
        claimed_at TEXT,
        verified_at TEXT,
        paid_at TEXT,
        transaction_reference TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(competition_id) REFERENCES competitions(id),
        FOREIGN KEY(participant_id) REFERENCES participants(id)
      );

      CREATE TABLE IF NOT EXISTS spins (
        id TEXT PRIMARY KEY,
        competition_id TEXT NOT NULL,
        round_number INTEGER NOT NULL,
        started_at TEXT NOT NULL,
        ended_at TEXT NOT NULL,
        initiated_by TEXT NOT NULL,
        rng_mode TEXT NOT NULL,
        seed_commit_hash TEXT NOT NULL,
        result_participant_id TEXT NOT NULL,
        result_display_name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(competition_id) REFERENCES competitions(id),
        FOREIGN KEY(result_participant_id) REFERENCES participants(id)
      );

      CREATE TABLE IF NOT EXISTS event_logs (
        id TEXT PRIMARY KEY,
        competition_id TEXT,
        actor TEXT NOT NULL,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        payload_summary TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_competitions_slug ON competitions(slug);
      CREATE INDEX IF NOT EXISTS idx_participants_competition ON participants(competition_id);
      CREATE INDEX IF NOT EXISTS idx_participants_wallet ON participants(competition_id, wallet_address);
      CREATE INDEX IF NOT EXISTS idx_participants_exchange_id ON participants(competition_id, exchange_id);
      CREATE INDEX IF NOT EXISTS idx_winners_competition ON winners(competition_id);
      CREATE INDEX IF NOT EXISTS idx_spins_competition ON spins(competition_id);
      CREATE INDEX IF NOT EXISTS idx_event_logs_competition ON event_logs(competition_id);
    `);
  }

  private seedIfNeeded() {
    const count = this.db.prepare("SELECT COUNT(*) as total FROM competitions").get() as { total: number };
    if (count.total > 0) {
      return;
    }

    const insertCompetition = this.db.prepare(`
      INSERT INTO competitions (
        id, slug, title, status, theme_key, description, announcement_text, chain_key,
        token_contract_address, min_token_balance, verification_mode,
        registration_open_at, registration_close_at, event_start_at, event_end_at,
        total_winner_slots, auto_remove_winners, leaderboard_public, allow_public_winners,
        recent_winner_ids_json, stats_json, registration_fields_json, prize_tiers_json,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertParticipant = this.db.prepare(`
      INSERT INTO participants (
        id, competition_id, display_name, exchange_nickname, exchange_id, wallet_address,
        email, telegram_handle, country, registration_status, verification_status,
        duplicate_risk_score, joined_at, approved_at, rejected_at, rejected_reason,
        ip_hash, device_fingerprint_hash, recent, wins, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertWinner = this.db.prepare(`
      INSERT INTO winners (
        id, competition_id, participant_id, display_name, prize_label, round_number,
        won_at, claim_status, payout_status, claim_deadline_at, claimed_at, verified_at,
        paid_at, transaction_reference, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertSpin = this.db.prepare(`
      INSERT INTO spins (
        id, competition_id, round_number, started_at, ended_at, initiated_by, rng_mode,
        seed_commit_hash, result_participant_id, result_display_name, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertLog = this.db.prepare(`
      INSERT INTO event_logs (
        id, competition_id, actor, action, entity_type, entity_id, created_at, payload_summary
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const tx = this.db.transaction(() => {
      for (const competition of seedCompetitions) {
        const ts = nowIso();
        insertCompetition.run(
          competition.id,
          competition.slug,
          competition.title,
          competition.status,
          competition.themeKey,
          competition.description,
          competition.announcementText,
          competition.chainKey,
          competition.tokenContractAddress,
          competition.minTokenBalance,
          competition.verificationMode,
          competition.registrationOpenAt,
          competition.registrationCloseAt,
          competition.eventStartAt,
          competition.eventEndAt,
          competition.totalWinnerSlots,
          competition.autoRemoveWinners ? 1 : 0,
          competition.leaderboardPublic ? 1 : 0,
          competition.allowPublicWinners ? 1 : 0,
          JSON.stringify(competition.recentWinnerIds),
          JSON.stringify(competition.stats),
          JSON.stringify(competition.registrationFields),
          JSON.stringify(competition.prizeTiers),
          ts,
          ts
        );
      }

      for (const participant of seedParticipants) {
        const ts = nowIso();
        insertParticipant.run(
          participant.id,
          participant.competitionId,
          participant.displayName,
          participant.exchangeNickname ?? null,
          participant.exchangeId ?? null,
          participant.walletAddress ?? null,
          participant.email ?? null,
          participant.telegramHandle ?? null,
          participant.country,
          participant.registrationStatus,
          participant.verificationStatus,
          participant.duplicateRiskScore,
          participant.joinedAt,
          participant.approvedAt ?? null,
          participant.rejectedAt ?? null,
          participant.rejectedReason ?? null,
          participant.ipHash ?? null,
          participant.deviceFingerprintHash ?? null,
          participant.recent ? 1 : 0,
          participant.wins,
          ts,
          ts
        );
      }

      for (const winner of seedWinners) {
        const ts = nowIso();
        insertWinner.run(
          winner.id,
          winner.competitionId,
          winner.participantId,
          winner.displayName,
          winner.prizeLabel,
          winner.roundNumber,
          winner.wonAt,
          winner.claimStatus,
          winner.payoutStatus,
          winner.claimDeadlineAt,
          winner.claimedAt ?? null,
          winner.verifiedAt ?? null,
          winner.paidAt ?? null,
          winner.transactionReference ?? null,
          ts,
          ts
        );
      }

      for (const spin of seedSpins) {
        const ts = nowIso();
        insertSpin.run(
          spin.id,
          spin.competitionId,
          spin.roundNumber,
          spin.startedAt,
          spin.endedAt,
          spin.initiatedBy,
          spin.rngMode,
          spin.seedCommitHash,
          spin.resultParticipantId,
          spin.resultDisplayName,
          ts,
          ts
        );
      }

      for (const log of seedLogs) {
        insertLog.run(
          log.id,
          log.competitionId ?? null,
          log.actor,
          log.action,
          log.entityType,
          log.entityId,
          log.createdAt,
          log.payloadSummary
        );
      }
    });

    tx();
  }

  private log(action: string, entityType: string, entityId: string, summary: string, competitionId?: string, actor = "system") {
    this.db.prepare(`
      INSERT INTO event_logs (id, competition_id, actor, action, entity_type, entity_id, created_at, payload_summary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id("log"), competitionId ?? null, actor, action, entityType, entityId, nowIso(), summary);
  }

  private syncCompetitionStats(competitionId: string) {
    const stats = this.db.prepare(`
      SELECT
        COUNT(*) as total_participants,
        SUM(CASE WHEN registration_status = 'approved' THEN 1 ELSE 0 END) as total_approved,
        SUM(CASE WHEN verification_status = 'pending' THEN 1 ELSE 0 END) as pending_verification
      FROM participants
      WHERE competition_id = ?
    `).get(competitionId) as {
      total_participants: number;
      total_approved: number | null;
      pending_verification: number | null;
    };

    const winnerCount = this.db.prepare("SELECT COUNT(*) as total FROM winners WHERE competition_id = ?")
      .get(competitionId) as { total: number };

    const nextStats: Competition["stats"] = {
      totalParticipants: stats.total_participants,
      totalApproved: stats.total_approved ?? 0,
      pendingVerification: stats.pending_verification ?? 0,
      totalWinners: winnerCount.total
    };

    this.db.prepare("UPDATE competitions SET stats_json = ?, updated_at = ? WHERE id = ?")
      .run(JSON.stringify(nextStats), nowIso(), competitionId);
  }

  listCompetitions() {
    const rows = this.db.prepare("SELECT * FROM competitions ORDER BY event_start_at DESC").all() as CompetitionRow[];
    return rows.map(toCompetition);
  }

  getCompetitionById(competitionId: string) {
    const row = this.db.prepare("SELECT * FROM competitions WHERE id = ? LIMIT 1").get(competitionId) as CompetitionRow | undefined;
    return row ? toCompetition(row) : undefined;
  }

  getCompetitionBySlug(slug: string) {
    const row = this.db.prepare("SELECT * FROM competitions WHERE slug = ? LIMIT 1").get(slug) as CompetitionRow | undefined;
    return row ? toCompetition(row) : undefined;
  }

  createCompetition(payload: CreateCompetitionPayload) {
    const title = (payload.title ?? "").trim();
    if (!title) {
      throw new Error("title_required");
    }

    const slug = toSlug(payload.slug?.trim() || title);
    const slugExists = this.db.prepare("SELECT id FROM competitions WHERE slug = ? LIMIT 1").get(slug) as { id: string } | undefined;
    if (slugExists) {
      throw new Error("slug_taken");
    }

    const created: Competition = {
      id: id("comp"),
      slug,
      title,
      status: "draft",
      themeKey: payload.themeKey ?? "default",
      description: payload.description ?? "",
      announcementText: payload.announcementText ?? "",
      chainKey: payload.chainKey ?? "BSC",
      tokenContractAddress: payload.tokenContractAddress ?? "",
      minTokenBalance: payload.minTokenBalance ?? 0,
      verificationMode: payload.verificationMode ?? "manual review",
      registrationOpenAt: payload.registrationOpenAt ?? nowIso(),
      registrationCloseAt: payload.registrationCloseAt ?? nowIso(),
      eventStartAt: payload.eventStartAt ?? nowIso(),
      eventEndAt: payload.eventEndAt ?? nowIso(),
      totalWinnerSlots: payload.totalWinnerSlots ?? 1,
      autoRemoveWinners: payload.autoRemoveWinners ?? true,
      leaderboardPublic: payload.leaderboardPublic ?? true,
      allowPublicWinners: payload.allowPublicWinners ?? true,
      recentWinnerIds: [],
      stats: {
        totalParticipants: 0,
        totalApproved: 0,
        pendingVerification: 0,
        totalWinners: 0
      },
      registrationFields: payload.registrationFields ?? [],
      prizeTiers: payload.prizeTiers ?? []
    };

    const ts = nowIso();
    this.db.prepare(`
      INSERT INTO competitions (
        id, slug, title, status, theme_key, description, announcement_text, chain_key,
        token_contract_address, min_token_balance, verification_mode,
        registration_open_at, registration_close_at, event_start_at, event_end_at,
        total_winner_slots, auto_remove_winners, leaderboard_public, allow_public_winners,
        recent_winner_ids_json, stats_json, registration_fields_json, prize_tiers_json,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      created.id,
      created.slug,
      created.title,
      created.status,
      created.themeKey,
      created.description,
      created.announcementText,
      created.chainKey,
      created.tokenContractAddress,
      created.minTokenBalance,
      created.verificationMode,
      created.registrationOpenAt,
      created.registrationCloseAt,
      created.eventStartAt,
      created.eventEndAt,
      created.totalWinnerSlots,
      created.autoRemoveWinners ? 1 : 0,
      created.leaderboardPublic ? 1 : 0,
      created.allowPublicWinners ? 1 : 0,
      JSON.stringify(created.recentWinnerIds),
      JSON.stringify(created.stats),
      JSON.stringify(created.registrationFields),
      JSON.stringify(created.prizeTiers),
      ts,
      ts
    );

    this.log("competition.created", "competition", created.id, `Created competition ${created.title}`, created.id, "admin");
    return created;
  }

  patchCompetition(competitionId: string, payload: PatchCompetitionPayload) {
    const competition = this.getCompetitionById(competitionId);
    if (!competition) {
      return null;
    }

    const beforeStatus = competition.status;
    const merged: Competition = {
      ...competition,
      ...payload,
      id: competition.id,
      slug: payload.slug ? toSlug(payload.slug) : competition.slug,
      stats: competition.stats
    };

    this.db.prepare(`
      UPDATE competitions SET
        slug = ?,
        title = ?,
        status = ?,
        theme_key = ?,
        description = ?,
        announcement_text = ?,
        chain_key = ?,
        token_contract_address = ?,
        min_token_balance = ?,
        verification_mode = ?,
        registration_open_at = ?,
        registration_close_at = ?,
        event_start_at = ?,
        event_end_at = ?,
        total_winner_slots = ?,
        auto_remove_winners = ?,
        leaderboard_public = ?,
        allow_public_winners = ?,
        recent_winner_ids_json = ?,
        stats_json = ?,
        registration_fields_json = ?,
        prize_tiers_json = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      merged.slug,
      merged.title,
      merged.status,
      merged.themeKey,
      merged.description,
      merged.announcementText,
      merged.chainKey,
      merged.tokenContractAddress,
      merged.minTokenBalance,
      merged.verificationMode,
      merged.registrationOpenAt,
      merged.registrationCloseAt,
      merged.eventStartAt,
      merged.eventEndAt,
      merged.totalWinnerSlots,
      merged.autoRemoveWinners ? 1 : 0,
      merged.leaderboardPublic ? 1 : 0,
      merged.allowPublicWinners ? 1 : 0,
      JSON.stringify(merged.recentWinnerIds),
      JSON.stringify(merged.stats),
      JSON.stringify(merged.registrationFields),
      JSON.stringify(merged.prizeTiers),
      nowIso(),
      competitionId
    );

    this.log(
      "competition.updated",
      "competition",
      competitionId,
      `Updated competition ${merged.title}${beforeStatus !== merged.status ? ` (${beforeStatus} → ${merged.status})` : ""}`,
      competitionId,
      "admin"
    );

    return this.getCompetitionById(competitionId);
  }

  getDashboard(): DashboardStats {
    const activeEvents = this.db.prepare("SELECT COUNT(*) as total FROM competitions WHERE status = 'live'").get() as { total: number };
    const totalParticipants = this.db.prepare("SELECT COUNT(*) as total FROM participants").get() as { total: number };
    const pendingVerification = this.db.prepare("SELECT COUNT(*) as total FROM participants WHERE verification_status = 'pending'").get() as { total: number };
    const unpaidWinners = this.db.prepare("SELECT COUNT(*) as total FROM winners WHERE payout_status != 'paid'").get() as { total: number };

    return {
      activeEvents: activeEvents.total,
      totalParticipants: totalParticipants.total,
      pendingVerification: pendingVerification.total,
      unpaidWinners: unpaidWinners.total
    };
  }

  getParticipants(competitionId: string) {
    const rows = this.db.prepare("SELECT * FROM participants WHERE competition_id = ? ORDER BY joined_at DESC")
      .all(competitionId) as ParticipantRow[];
    return rows.map(toParticipant);
  }

  approveParticipant(participantId: string) {
    const participant = this.db.prepare("SELECT * FROM participants WHERE id = ? LIMIT 1").get(participantId) as ParticipantRow | undefined;
    if (!participant) {
      return null;
    }

    this.db.prepare(`
      UPDATE participants
      SET registration_status = 'approved', verification_status = 'manual_override', approved_at = ?, recent = 1, updated_at = ?
      WHERE id = ?
    `).run(nowIso(), nowIso(), participantId);

    this.syncCompetitionStats(participant.competition_id);
    this.log("participant.approved", "participant", participantId, `Approved ${participant.display_name}`, participant.competition_id, "moderator");

    const updated = this.db.prepare("SELECT * FROM participants WHERE id = ? LIMIT 1").get(participantId) as ParticipantRow;
    return toParticipant(updated);
  }

  rejectParticipant(participantId: string, reason: string) {
    const participant = this.db.prepare("SELECT * FROM participants WHERE id = ? LIMIT 1").get(participantId) as ParticipantRow | undefined;
    if (!participant) {
      return null;
    }

    this.db.prepare(`
      UPDATE participants
      SET registration_status = 'rejected', rejected_at = ?, rejected_reason = ?, updated_at = ?
      WHERE id = ?
    `).run(nowIso(), reason, nowIso(), participantId);

    this.syncCompetitionStats(participant.competition_id);
    this.log("participant.rejected", "participant", participantId, `Rejected ${participant.display_name}: ${reason}`, participant.competition_id, "moderator");

    const updated = this.db.prepare("SELECT * FROM participants WHERE id = ? LIMIT 1").get(participantId) as ParticipantRow;
    return toParticipant(updated);
  }

  registerBySlug(slug: string, payload: RegistrationPayload) {
    const competition = this.getCompetitionBySlug(slug);
    if (!competition) {
      return { error: "competition_not_found" as const };
    }

    const displayName = (payload.displayName || "").trim();
    if (!displayName) {
      return { error: "display_name_required" as const };
    }

    const walletAddress = payload.walletAddress?.trim();
    if (walletAddress) {
      const existingWallet = this.db.prepare(`
        SELECT id FROM participants WHERE competition_id = ? AND wallet_address = ? LIMIT 1
      `).get(competition.id, walletAddress) as { id: string } | undefined;
      if (existingWallet) {
        return { error: "duplicate_wallet" as const };
      }
    }

    const exchangeId = payload.exchangeId?.trim();
    if (exchangeId) {
      const existingExchange = this.db.prepare(`
        SELECT id FROM participants WHERE competition_id = ? AND exchange_id = ? LIMIT 1
      `).get(competition.id, exchangeId) as { id: string } | undefined;
      if (existingExchange) {
        return { error: "duplicate_exchange_id" as const };
      }
    }

    const participant: Participant = {
      id: id("part"),
      competitionId: competition.id,
      displayName,
      exchangeNickname: payload.exchangeNickname?.trim(),
      exchangeId,
      walletAddress,
      email: payload.email?.trim(),
      telegramHandle: payload.telegramHandle?.trim(),
      country: payload.country?.trim() || "Unknown",
      registrationStatus: competition.verificationMode === "manual review" ? "pending_review" : "approved",
      verificationStatus: competition.verificationMode === "manual review" ? "pending" : "passed",
      duplicateRiskScore: 0,
      joinedAt: nowIso(),
      approvedAt: competition.verificationMode === "manual review" ? undefined : nowIso(),
      recent: true,
      wins: 0
    };

    const ts = nowIso();
    this.db.prepare(`
      INSERT INTO participants (
        id, competition_id, display_name, exchange_nickname, exchange_id, wallet_address,
        email, telegram_handle, country, registration_status, verification_status,
        duplicate_risk_score, joined_at, approved_at, rejected_at, rejected_reason,
        ip_hash, device_fingerprint_hash, recent, wins, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      participant.id,
      participant.competitionId,
      participant.displayName,
      participant.exchangeNickname ?? null,
      participant.exchangeId ?? null,
      participant.walletAddress ?? null,
      participant.email ?? null,
      participant.telegramHandle ?? null,
      participant.country,
      participant.registrationStatus,
      participant.verificationStatus,
      participant.duplicateRiskScore,
      participant.joinedAt,
      participant.approvedAt ?? null,
      null,
      null,
      null,
      null,
      participant.recent ? 1 : 0,
      participant.wins,
      ts,
      ts
    );

    this.syncCompetitionStats(competition.id);
    this.log("participant.joined", "participant", participant.id, `Registered ${participant.displayName}`, competition.id, "public");
    return { participant };
  }

  listWinners(competitionId: string) {
    const rows = this.db.prepare("SELECT * FROM winners WHERE competition_id = ? ORDER BY won_at DESC")
      .all(competitionId) as WinnerRow[];
    return rows.map(toWinner);
  }

  listSpins(competitionId: string) {
    const rows = this.db.prepare("SELECT * FROM spins WHERE competition_id = ? ORDER BY ended_at DESC")
      .all(competitionId) as SpinRow[];
    return rows.map(toSpin);
  }

  updateWinnerClaimStatus(winnerId: string, claimStatus: Winner["claimStatus"]) {
    const winner = this.db.prepare("SELECT * FROM winners WHERE id = ? LIMIT 1").get(winnerId) as WinnerRow | undefined;
    if (!winner) {
      return null;
    }

    const claimedAt = claimStatus === "submitted" ? nowIso() : winner.claimed_at;
    const verifiedAt = claimStatus === "verified" ? nowIso() : winner.verified_at;
    this.db.prepare(`
      UPDATE winners
      SET claim_status = ?, claimed_at = ?, verified_at = ?, updated_at = ?
      WHERE id = ?
    `).run(claimStatus, claimedAt ?? null, verifiedAt ?? null, nowIso(), winnerId);

    this.log("winner.claim_status.updated", "winner", winnerId, `Claim status set to ${claimStatus}`, winner.competition_id, "admin");
    const updated = this.db.prepare("SELECT * FROM winners WHERE id = ? LIMIT 1").get(winnerId) as WinnerRow;
    return toWinner(updated);
  }

  updateWinnerPayoutStatus(winnerId: string, payoutStatus: Winner["payoutStatus"], transactionReference?: string) {
    const winner = this.db.prepare("SELECT * FROM winners WHERE id = ? LIMIT 1").get(winnerId) as WinnerRow | undefined;
    if (!winner) {
      return null;
    }

    const paidAt = payoutStatus === "paid" ? nowIso() : winner.paid_at;
    const reference = typeof transactionReference === "string" ? transactionReference : winner.transaction_reference;
    this.db.prepare(`
      UPDATE winners
      SET payout_status = ?, paid_at = ?, transaction_reference = ?, updated_at = ?
      WHERE id = ?
    `).run(payoutStatus, paidAt ?? null, reference ?? null, nowIso(), winnerId);

    this.log("winner.payout_status.updated", "winner", winnerId, `Payout status set to ${payoutStatus}`, winner.competition_id, "admin");
    const updated = this.db.prepare("SELECT * FROM winners WHERE id = ? LIMIT 1").get(winnerId) as WinnerRow;
    return toWinner(updated);
  }

  createSpin(competitionId: string, initiatedBy = "admin") {
    const competition = this.getCompetitionById(competitionId);
    if (!competition) {
      return { error: "competition_not_found" as const };
    }

    const poolRows = this.db.prepare(`
      SELECT * FROM participants
      WHERE competition_id = ? AND registration_status = 'approved'
      ORDER BY joined_at DESC
    `).all(competitionId) as ParticipantRow[];

    if (!poolRows.length) {
      return { error: "no_approved_participants" as const };
    }

    const winnerParticipantRow = poolRows[Math.floor(Math.random() * poolRows.length)];
    const winnerParticipant = toParticipant(winnerParticipantRow);
    const winnerCount = this.db.prepare("SELECT COUNT(*) as total FROM winners WHERE competition_id = ?")
      .get(competitionId) as { total: number };
    const roundNumber = winnerCount.total + 1;

    const spin: Spin = {
      id: id("spin"),
      competitionId,
      roundNumber,
      startedAt: nowIso(),
      endedAt: nowIso(),
      initiatedBy,
      rngMode: "server-seeded RNG",
      seedCommitHash: `0x${Math.random().toString(16).slice(2, 18)}`,
      resultParticipantId: winnerParticipant.id,
      resultDisplayName: winnerParticipant.displayName
    };

    const winner: Winner = {
      id: id("winner"),
      competitionId,
      participantId: winnerParticipant.id,
      displayName: winnerParticipant.displayName,
      prizeLabel: "Standard Win",
      roundNumber,
      wonAt: nowIso(),
      claimStatus: "pending",
      payoutStatus: "pending",
      claimDeadlineAt: new Date(Date.now() + (72 * 60 * 60 * 1000)).toISOString()
    };

    const tx = this.db.transaction(() => {
      const ts = nowIso();
      this.db.prepare(`
        INSERT INTO spins (
          id, competition_id, round_number, started_at, ended_at, initiated_by, rng_mode,
          seed_commit_hash, result_participant_id, result_display_name, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        spin.id,
        spin.competitionId,
        spin.roundNumber,
        spin.startedAt,
        spin.endedAt,
        spin.initiatedBy,
        spin.rngMode,
        spin.seedCommitHash,
        spin.resultParticipantId,
        spin.resultDisplayName,
        ts,
        ts
      );

      this.db.prepare(`
        INSERT INTO winners (
          id, competition_id, participant_id, display_name, prize_label, round_number,
          won_at, claim_status, payout_status, claim_deadline_at, claimed_at, verified_at,
          paid_at, transaction_reference, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        winner.id,
        winner.competitionId,
        winner.participantId,
        winner.displayName,
        winner.prizeLabel,
        winner.roundNumber,
        winner.wonAt,
        winner.claimStatus,
        winner.payoutStatus,
        winner.claimDeadlineAt,
        null,
        null,
        null,
        null,
        ts,
        ts
      );

      if (competition.autoRemoveWinners) {
        this.db.prepare(`
          UPDATE participants
          SET registration_status = 'won', wins = wins + 1, updated_at = ?
          WHERE id = ?
        `).run(nowIso(), winnerParticipant.id);
      }

      const nextRecent = [winner.id, ...competition.recentWinnerIds].slice(0, 10);
      this.db.prepare("UPDATE competitions SET recent_winner_ids_json = ?, updated_at = ? WHERE id = ?")
        .run(JSON.stringify(nextRecent), nowIso(), competitionId);

      this.syncCompetitionStats(competitionId);
      this.log("spin.completed", "spin", spin.id, `Winner resolved to ${winner.displayName}`, competitionId, initiatedBy);
    });

    tx();

    const updatedParticipantRow = this.db.prepare("SELECT * FROM participants WHERE id = ? LIMIT 1")
      .get(winnerParticipant.id) as ParticipantRow;

    return { spin, winner, participant: toParticipant(updatedParticipantRow) };
  }

  submitClaim(claimToken: string, payload: Record<string, unknown>) {
    const winner = this.db.prepare(`
      SELECT * FROM winners WHERE id = ? OR participant_id = ? LIMIT 1
    `).get(claimToken, claimToken) as WinnerRow | undefined;

    if (!winner) {
      return null;
    }

    const claimedAt = nowIso();
    this.db.prepare(`
      UPDATE winners SET claim_status = 'submitted', claimed_at = ?, updated_at = ? WHERE id = ?
    `).run(claimedAt, nowIso(), winner.id);

    this.log("winner.claim_submitted", "winner", winner.id, "Claim submitted through public endpoint", winner.competition_id, "public");

    const updated = this.db.prepare("SELECT * FROM winners WHERE id = ? LIMIT 1").get(winner.id) as WinnerRow;
    return { winner: toWinner(updated), payload };
  }

  getLeaderboard(competitionId: string) {
    const rows = this.db.prepare(`
      SELECT * FROM participants
      WHERE competition_id = ?
      ORDER BY wins DESC, display_name ASC
    `).all(competitionId) as ParticipantRow[];
    return rows.map(toParticipant);
  }

  getLogs(competitionId?: string) {
    if (competitionId) {
      const rows = this.db.prepare("SELECT * FROM event_logs WHERE competition_id = ? ORDER BY created_at DESC")
        .all(competitionId) as EventLogRow[];
      return rows.map(toEventLog);
    }
    const rows = this.db.prepare("SELECT * FROM event_logs ORDER BY created_at DESC").all() as EventLogRow[];
    return rows.map(toEventLog);
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __event_wheel_store_v2__: SQLiteStore | undefined;
}

export const store = globalThis[GLOBAL_KEY as keyof typeof globalThis] as SQLiteStore | undefined
  ?? new SQLiteStore();

if (!globalThis.__event_wheel_store_v2__) {
  globalThis.__event_wheel_store_v2__ = store;
}

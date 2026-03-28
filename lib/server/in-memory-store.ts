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
import { computeRevealHash, deriveSpinIndex, randomHex, sha256Hex } from "@/lib/server/fairness";
import type {
  Competition,
  CompetitionGameType,
  EventLog,
  Participant,
  QuizLiveState,
  QuizLiveStatus,
  QuizQuestion,
  QuizQuestionType,
  QuizSubmission,
  Spin,
  SpinFairnessRecord,
  Winner
} from "@/lib/types";

type RegistrationPayload = {
  displayName: string;
  exchangeNickname?: string;
  exchangeId?: string;
  walletAddress?: string;
  email?: string;
  xHandle?: string;
  phone?: string;
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
type UpdateParticipantPayload = Partial<Pick<
  Participant,
  | "displayName"
  | "exchangeNickname"
  | "exchangeId"
  | "walletAddress"
  | "email"
  | "xHandle"
  | "phone"
  | "telegramHandle"
  | "country"
  | "registrationStatus"
  | "verificationStatus"
  | "duplicateRiskScore"
>>;
const COMPETITION_STATUSES: Competition["status"][] = [
  "draft",
  "scheduled",
  "live",
  "paused",
  "completed",
  "archived"
];

const COMPETITION_GAME_TYPES: CompetitionGameType[] = [
  "wheel_of_fortune",
  "flip_to_win",
  "quiz"
];

type CompetitionRow = {
  id: string;
  slug: string;
  title: string;
  status: Competition["status"];
  game_type: CompetitionGameType;
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
  x_handle: string | null;
  phone: string | null;
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

type SpinFairnessRow = {
  id: string;
  spin_id: string;
  competition_id: string;
  algorithm: string;
  server_seed: string;
  client_seed: string;
  nonce: string;
  commit_hash: string;
  reveal_hash: string;
  pool_size: number;
  resolved_index: number;
  resolved_participant_id: string;
  created_at: string;
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

type QuizQuestionRow = {
  id: string;
  competition_id: string;
  prompt: string;
  question_type: QuizQuestionType;
  options_json: string;
  answer_index: number | null;
  duration_seconds: number;
  question_order: number;
  created_at: string;
  updated_at: string;
};

type QuizLiveStateRow = {
  competition_id: string;
  status: QuizLiveStatus;
  current_index: number;
  question_started_at: string | null;
  paused_remaining_seconds: number | null;
  created_at: string;
  updated_at: string;
};

type QuizSubmissionRow = {
  id: string;
  competition_id: string;
  question_id: string;
  participant_id: string | null;
  display_name: string | null;
  exchange_id: string | null;
  selected_index: number;
  is_correct: number;
  submitted_at: string;
  created_at: string;
  question_prompt?: string;
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

function normalizeCompetitionGameType(gameType: string | null | undefined, themeKey?: string) {
  if (gameType && COMPETITION_GAME_TYPES.includes(gameType as CompetitionGameType)) {
    return gameType as CompetitionGameType;
  }
  if ((themeKey ?? "").toLowerCase().includes("quiz")) {
    return "quiz";
  }
  return "wheel_of_fortune";
}

function toCompetition(row: CompetitionRow): Competition {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    status: row.status,
    gameType: normalizeCompetitionGameType(row.game_type, row.theme_key),
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
    xHandle: row.x_handle ?? undefined,
    phone: row.phone ?? undefined,
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

function verifyFairnessRow(row: SpinFairnessRow) {
  const expectedCommit = sha256Hex(row.server_seed);
  const expectedReveal = computeRevealHash(row.server_seed, row.client_seed, row.nonce);
  const expectedIndex = deriveSpinIndex(expectedReveal, row.pool_size);
  return expectedCommit === row.commit_hash
    && expectedReveal === row.reveal_hash
    && expectedIndex === row.resolved_index;
}

function toSpinFairnessRecord(row: SpinFairnessRow): SpinFairnessRecord {
  return {
    id: row.id,
    spinId: row.spin_id,
    competitionId: row.competition_id,
    algorithm: row.algorithm,
    serverSeed: row.server_seed,
    clientSeed: row.client_seed,
    nonce: row.nonce,
    commitHash: row.commit_hash,
    revealHash: row.reveal_hash,
    poolSize: row.pool_size,
    resolvedIndex: row.resolved_index,
    resolvedParticipantId: row.resolved_participant_id,
    createdAt: row.created_at,
    verified: verifyFairnessRow(row)
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

function toQuizQuestion(row: QuizQuestionRow): QuizQuestion {
  const options = parseJson<string[]>(row.options_json, []).filter((entry) => typeof entry === "string");
  return {
    id: row.id,
    competitionId: row.competition_id,
    prompt: row.prompt,
    questionType: row.question_type,
    options,
    answerIndex: row.answer_index ?? undefined,
    durationSeconds: row.duration_seconds,
    order: row.question_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toQuizLiveState(row: QuizLiveStateRow): QuizLiveState {
  return {
    competitionId: row.competition_id,
    status: row.status,
    currentIndex: row.current_index,
    questionStartedAt: row.question_started_at ?? undefined,
    pausedRemainingSeconds: row.paused_remaining_seconds ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toQuizSubmission(row: QuizSubmissionRow): QuizSubmission {
  return {
    id: row.id,
    competitionId: row.competition_id,
    questionId: row.question_id,
    questionPrompt: row.question_prompt ?? "",
    participantId: row.participant_id ?? undefined,
    displayName: row.display_name ?? undefined,
    exchangeId: row.exchange_id ?? undefined,
    selectedIndex: row.selected_index,
    isCorrect: row.is_correct === 1,
    submittedAt: row.submitted_at
  };
}

class SQLiteStore {
  private db: Database.Database;

  constructor() {
    ensureDir(DB_PATH);
    this.db = new Database(DB_PATH);
    this.db.pragma("journal_mode = WAL");
    this.initSchema();
    this.ensureCompetitionColumns();
    this.ensureParticipantColumns();
    this.seedIfNeeded();
  }

  private initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS competitions (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        status TEXT NOT NULL,
        game_type TEXT NOT NULL DEFAULT 'wheel_of_fortune',
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
        x_handle TEXT,
        phone TEXT,
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

      CREATE TABLE IF NOT EXISTS spin_fairness_records (
        id TEXT PRIMARY KEY,
        spin_id TEXT NOT NULL UNIQUE,
        competition_id TEXT NOT NULL,
        algorithm TEXT NOT NULL,
        server_seed TEXT NOT NULL,
        client_seed TEXT NOT NULL,
        nonce TEXT NOT NULL,
        commit_hash TEXT NOT NULL,
        reveal_hash TEXT NOT NULL,
        pool_size INTEGER NOT NULL,
        resolved_index INTEGER NOT NULL,
        resolved_participant_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(spin_id) REFERENCES spins(id),
        FOREIGN KEY(competition_id) REFERENCES competitions(id),
        FOREIGN KEY(resolved_participant_id) REFERENCES participants(id)
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

      CREATE TABLE IF NOT EXISTS quiz_questions (
        id TEXT PRIMARY KEY,
        competition_id TEXT NOT NULL,
        prompt TEXT NOT NULL,
        question_type TEXT NOT NULL,
        options_json TEXT NOT NULL,
        answer_index INTEGER,
        duration_seconds INTEGER NOT NULL,
        question_order INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(competition_id) REFERENCES competitions(id)
      );

      CREATE TABLE IF NOT EXISTS quiz_live_state (
        competition_id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        current_index INTEGER NOT NULL,
        question_started_at TEXT,
        paused_remaining_seconds INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(competition_id) REFERENCES competitions(id)
      );

      CREATE TABLE IF NOT EXISTS quiz_submissions (
        id TEXT PRIMARY KEY,
        competition_id TEXT NOT NULL,
        question_id TEXT NOT NULL,
        participant_id TEXT,
        display_name TEXT,
        exchange_id TEXT,
        selected_index INTEGER NOT NULL,
        is_correct INTEGER NOT NULL,
        submitted_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(competition_id) REFERENCES competitions(id),
        FOREIGN KEY(question_id) REFERENCES quiz_questions(id),
        FOREIGN KEY(participant_id) REFERENCES participants(id)
      );

      CREATE INDEX IF NOT EXISTS idx_competitions_slug ON competitions(slug);
      CREATE INDEX IF NOT EXISTS idx_participants_competition ON participants(competition_id);
      CREATE INDEX IF NOT EXISTS idx_participants_wallet ON participants(competition_id, wallet_address);
      CREATE INDEX IF NOT EXISTS idx_participants_exchange_id ON participants(competition_id, exchange_id);
      CREATE INDEX IF NOT EXISTS idx_winners_competition ON winners(competition_id);
      CREATE INDEX IF NOT EXISTS idx_spins_competition ON spins(competition_id);
      CREATE INDEX IF NOT EXISTS idx_spin_fairness_competition ON spin_fairness_records(competition_id);
      CREATE INDEX IF NOT EXISTS idx_spin_fairness_spin ON spin_fairness_records(spin_id);
      CREATE INDEX IF NOT EXISTS idx_event_logs_competition ON event_logs(competition_id);
      CREATE INDEX IF NOT EXISTS idx_quiz_questions_competition ON quiz_questions(competition_id);
      CREATE INDEX IF NOT EXISTS idx_quiz_questions_order ON quiz_questions(competition_id, question_order, created_at);
      CREATE INDEX IF NOT EXISTS idx_quiz_live_state_status ON quiz_live_state(status);
      CREATE INDEX IF NOT EXISTS idx_quiz_submissions_competition ON quiz_submissions(competition_id, submitted_at DESC);
      CREATE INDEX IF NOT EXISTS idx_quiz_submissions_question ON quiz_submissions(question_id, submitted_at DESC);

      CREATE TRIGGER IF NOT EXISTS trg_spin_fairness_no_update
      BEFORE UPDATE ON spin_fairness_records
      BEGIN
        SELECT RAISE(ABORT, 'spin_fairness_records_are_immutable');
      END;

      CREATE TRIGGER IF NOT EXISTS trg_spin_fairness_no_delete
      BEFORE DELETE ON spin_fairness_records
      BEGIN
        SELECT RAISE(ABORT, 'spin_fairness_records_are_immutable');
      END;
    `);
  }

  private ensureCompetitionColumns() {
    const columns = this.db.prepare("PRAGMA table_info(competitions)").all() as Array<{ name: string }>;
    const names = new Set(columns.map((column) => column.name));

    if (!names.has("game_type")) {
      this.db.exec("ALTER TABLE competitions ADD COLUMN game_type TEXT NOT NULL DEFAULT 'wheel_of_fortune'");
      this.db.prepare(`
        UPDATE competitions
        SET game_type = CASE
          WHEN LOWER(theme_key) LIKE '%quiz%' THEN 'quiz'
          ELSE 'wheel_of_fortune'
        END
      `).run();
    }
  }

  private ensureParticipantColumns() {
    const columns = this.db.prepare("PRAGMA table_info(participants)").all() as Array<{ name: string }>;
    const names = new Set(columns.map((column) => column.name));

    if (!names.has("x_handle")) {
      this.db.exec("ALTER TABLE participants ADD COLUMN x_handle TEXT");
    }
    if (!names.has("phone")) {
      this.db.exec("ALTER TABLE participants ADD COLUMN phone TEXT");
    }
  }

  private seedIfNeeded() {
    const count = this.db.prepare("SELECT COUNT(*) as total FROM competitions").get() as { total: number };
    if (count.total > 0) {
      return;
    }

    const insertCompetition = this.db.prepare(`
      INSERT INTO competitions (
        id, slug, title, status, game_type, theme_key, description, announcement_text, chain_key,
        token_contract_address, min_token_balance, verification_mode,
        registration_open_at, registration_close_at, event_start_at, event_end_at,
        total_winner_slots, auto_remove_winners, leaderboard_public, allow_public_winners,
        recent_winner_ids_json, stats_json, registration_fields_json, prize_tiers_json,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertParticipant = this.db.prepare(`
      INSERT INTO participants (
        id, competition_id, display_name, exchange_nickname, exchange_id, wallet_address,
        email, x_handle, phone, telegram_handle, country, registration_status, verification_status,
        duplicate_risk_score, joined_at, approved_at, rejected_at, rejected_reason,
        ip_hash, device_fingerprint_hash, recent, wins, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

    const insertQuizQuestion = this.db.prepare(`
      INSERT INTO quiz_questions (
        id, competition_id, prompt, question_type, options_json, answer_index,
        duration_seconds, question_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const defaultQuizQuestions: Array<Omit<QuizQuestion, "id" | "competitionId" | "createdAt" | "updatedAt">> = [
      {
        prompt: "What does BSC stand for?",
        questionType: "multiple_choice",
        options: ["Binance Smart Chain", "Bitcoin Secure Chain", "Blockchain Storage Core", "Basic Swap Contract"],
        answerIndex: 0,
        durationSeconds: 20,
        order: 1
      },
      {
        prompt: "A wallet private key should be:",
        questionType: "multiple_choice",
        options: ["Shared with moderators", "Kept secret", "Stored in public bio", "Posted for verification"],
        answerIndex: 1,
        durationSeconds: 20,
        order: 2
      },
      {
        prompt: "Type your referral phrase in chat to continue to the next round.",
        questionType: "question_only",
        options: [],
        answerIndex: undefined,
        durationSeconds: 15,
        order: 3
      }
    ];

    const tx = this.db.transaction(() => {
      for (const competition of seedCompetitions) {
        const ts = nowIso();
        insertCompetition.run(
          competition.id,
          competition.slug,
          competition.title,
          competition.status,
          normalizeCompetitionGameType(competition.gameType, competition.themeKey),
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

        if (normalizeCompetitionGameType(competition.gameType, competition.themeKey) === "quiz") {
          for (const question of defaultQuizQuestions) {
            const quizTs = nowIso();
            insertQuizQuestion.run(
              id("quizq"),
              competition.id,
              question.prompt,
              question.questionType,
              JSON.stringify(question.options),
              question.questionType === "multiple_choice" ? question.answerIndex ?? 0 : null,
              question.durationSeconds,
              question.order,
              quizTs,
              quizTs
            );
          }
        }
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
          participant.xHandle ?? null,
          participant.phone ?? null,
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

  private nextCompetitionId() {
    const rows = this.db.prepare("SELECT id FROM competitions").all() as Array<{ id: string }>;
    let maxId = 0;
    const usedIds = new Set(rows.map((row) => row.id));

    for (const row of rows) {
      const match = /^comp-(\d+)$/.exec(row.id);
      if (!match) {
        continue;
      }
      const numericId = Number.parseInt(match[1], 10);
      if (Number.isFinite(numericId) && numericId > maxId) {
        maxId = numericId;
      }
    }

    let candidate = maxId + 1;
    while (usedIds.has(`comp-${candidate}`)) {
      candidate += 1;
    }

    return `comp-${candidate}`;
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

    const requestedStatus = payload.status;
    const status = COMPETITION_STATUSES.includes(requestedStatus as Competition["status"])
      ? (requestedStatus as Competition["status"])
      : "draft";

    const created: Competition = {
      id: this.nextCompetitionId(),
      slug,
      title,
      status,
      gameType: normalizeCompetitionGameType(payload.gameType, payload.themeKey),
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
        id, slug, title, status, game_type, theme_key, description, announcement_text, chain_key,
        token_contract_address, min_token_balance, verification_mode,
        registration_open_at, registration_close_at, event_start_at, event_end_at,
        total_winner_slots, auto_remove_winners, leaderboard_public, allow_public_winners,
        recent_winner_ids_json, stats_json, registration_fields_json, prize_tiers_json,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      created.id,
      created.slug,
      created.title,
      created.status,
      created.gameType,
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

  cloneCompetition(competitionId: string) {
    const source = this.getCompetitionById(competitionId);
    if (!source) {
      return null;
    }

    const baseTitle = `${source.title} Copy`;
    const baseSlug = toSlug(`${source.slug}-copy`) || toSlug(`${source.title}-copy`) || `copy-${Date.now()}`;

    let slug = baseSlug;
    let index = 2;
    while (this.getCompetitionBySlug(slug)) {
      slug = `${baseSlug}-${index}`;
      index += 1;
    }

    const cloned = this.createCompetition({
      ...source,
      title: baseTitle,
      slug,
      status: "draft",
      recentWinnerIds: [],
      stats: {
        totalParticipants: 0,
        totalApproved: 0,
        pendingVerification: 0,
        totalWinners: 0
      },
      registrationFields: structuredClone(source.registrationFields),
      prizeTiers: structuredClone(source.prizeTiers)
    });

    const sourceQuizQuestions = this.listQuizQuestions(source.id);
    if (sourceQuizQuestions.length > 0) {
      const insertQuizQuestion = this.db.prepare(`
        INSERT INTO quiz_questions (
          id, competition_id, prompt, question_type, options_json, answer_index,
          duration_seconds, question_order, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const tx = this.db.transaction(() => {
        for (const question of sourceQuizQuestions) {
          const ts = nowIso();
          insertQuizQuestion.run(
            id("quizq"),
            cloned.id,
            question.prompt,
            question.questionType,
            JSON.stringify(question.options),
            question.questionType === "multiple_choice" ? question.answerIndex ?? 0 : null,
            question.durationSeconds,
            question.order,
            ts,
            ts
          );
        }
      });
      tx();
    }

    this.log(
      "competition.cloned",
      "competition",
      cloned.id,
      `Cloned from ${source.id}`,
      cloned.id,
      "admin"
    );

    return cloned;
  }

  patchCompetition(competitionId: string, payload: PatchCompetitionPayload) {
    const competition = this.getCompetitionById(competitionId);
    if (!competition) {
      return null;
    }

    const maybeTitle = payload.title === undefined ? competition.title : payload.title.trim();
    if (!maybeTitle) {
      throw new Error("title_required");
    }

    const nextSlug = payload.slug ? toSlug(payload.slug) : competition.slug;
    if (!nextSlug) {
      throw new Error("slug_required");
    }

    const slugOwner = this.db.prepare("SELECT id FROM competitions WHERE slug = ? LIMIT 1")
      .get(nextSlug) as { id: string } | undefined;
    if (slugOwner && slugOwner.id !== competitionId) {
      throw new Error("slug_taken");
    }

    const status = COMPETITION_STATUSES.includes((payload.status ?? competition.status) as Competition["status"])
      ? (payload.status ?? competition.status) as Competition["status"]
      : competition.status;

    const beforeStatus = competition.status;
    const merged: Competition = {
      ...competition,
      ...payload,
      id: competition.id,
      title: maybeTitle,
      slug: nextSlug,
      status,
      gameType: normalizeCompetitionGameType(payload.gameType ?? competition.gameType, payload.themeKey ?? competition.themeKey),
      stats: competition.stats
    };

    this.db.prepare(`
      UPDATE competitions SET
        slug = ?,
        title = ?,
        status = ?,
        game_type = ?,
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
      merged.gameType,
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

  deleteCompetition(competitionId: string) {
    const exists = this.db.prepare("SELECT id FROM competitions WHERE id = ? LIMIT 1")
      .get(competitionId) as { id: string } | undefined;
    if (!exists) {
      return false;
    }

    const tx = this.db.transaction(() => {
      this.db.prepare("DELETE FROM quiz_submissions WHERE competition_id = ?").run(competitionId);
      this.db.prepare("DELETE FROM quiz_live_state WHERE competition_id = ?").run(competitionId);
      this.db.prepare("DELETE FROM quiz_questions WHERE competition_id = ?").run(competitionId);
      this.db.prepare("DELETE FROM spin_fairness_records WHERE competition_id = ?").run(competitionId);
      this.db.prepare("DELETE FROM winners WHERE competition_id = ?").run(competitionId);
      this.db.prepare("DELETE FROM spins WHERE competition_id = ?").run(competitionId);
      this.db.prepare("DELETE FROM participants WHERE competition_id = ?").run(competitionId);
      this.db.prepare("DELETE FROM event_logs WHERE competition_id = ?").run(competitionId);
      this.db.prepare("DELETE FROM competitions WHERE id = ?").run(competitionId);
    });

    tx();
    this.log("competition.deleted", "competition", competitionId, `Deleted competition ${competitionId}`, competitionId, "admin");
    return true;
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

  getParticipantById(participantId: string) {
    const row = this.db.prepare("SELECT * FROM participants WHERE id = ? LIMIT 1").get(participantId) as ParticipantRow | undefined;
    return row ? toParticipant(row) : null;
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

  updateParticipant(participantId: string, payload: UpdateParticipantPayload) {
    const participant = this.db.prepare("SELECT * FROM participants WHERE id = ? LIMIT 1").get(participantId) as ParticipantRow | undefined;
    if (!participant) {
      return null;
    }

    const displayName = payload.displayName === undefined
      ? participant.display_name
      : payload.displayName.trim();
    if (!displayName) {
      throw new Error("display_name_required");
    }

    const exchangeId = payload.exchangeId === undefined
      ? participant.exchange_id
      : payload.exchangeId?.trim() || null;
    const walletAddress = payload.walletAddress === undefined
      ? participant.wallet_address
      : payload.walletAddress?.trim() || null;

    if (walletAddress) {
      const existingWallet = this.db.prepare(`
        SELECT id FROM participants
        WHERE competition_id = ? AND wallet_address = ? AND id != ?
        LIMIT 1
      `).get(participant.competition_id, walletAddress, participantId) as { id: string } | undefined;
      if (existingWallet) {
        throw new Error("duplicate_wallet");
      }
    }

    if (exchangeId) {
      const existingExchange = this.db.prepare(`
        SELECT id FROM participants
        WHERE competition_id = ? AND exchange_id = ? AND id != ?
        LIMIT 1
      `).get(participant.competition_id, exchangeId, participantId) as { id: string } | undefined;
      if (existingExchange) {
        throw new Error("duplicate_exchange_id");
      }
    }

    this.db.prepare(`
      UPDATE participants
      SET display_name = ?,
          exchange_nickname = ?,
          exchange_id = ?,
          wallet_address = ?,
          email = ?,
          x_handle = ?,
          phone = ?,
          telegram_handle = ?,
          country = ?,
          registration_status = ?,
          verification_status = ?,
          duplicate_risk_score = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      displayName,
      payload.exchangeNickname === undefined ? participant.exchange_nickname : (payload.exchangeNickname?.trim() || null),
      exchangeId,
      walletAddress,
      payload.email === undefined ? participant.email : (payload.email?.trim() || null),
      payload.xHandle === undefined ? participant.x_handle : (payload.xHandle?.trim() || null),
      payload.phone === undefined ? participant.phone : (payload.phone?.trim() || null),
      payload.telegramHandle === undefined ? participant.telegram_handle : (payload.telegramHandle?.trim() || null),
      payload.country === undefined ? participant.country : (payload.country.trim() || "Unknown"),
      payload.registrationStatus ?? participant.registration_status,
      payload.verificationStatus ?? participant.verification_status,
      payload.duplicateRiskScore ?? participant.duplicate_risk_score,
      nowIso(),
      participantId
    );

    this.syncCompetitionStats(participant.competition_id);
    this.log("participant.updated", "participant", participantId, `Updated ${displayName}`, participant.competition_id, "moderator");
    const updated = this.db.prepare("SELECT * FROM participants WHERE id = ? LIMIT 1").get(participantId) as ParticipantRow;
    return toParticipant(updated);
  }

  deleteParticipant(participantId: string) {
    const participant = this.db.prepare("SELECT * FROM participants WHERE id = ? LIMIT 1").get(participantId) as ParticipantRow | undefined;
    if (!participant) {
      return null;
    }

    this.db.prepare(`
      UPDATE participants
      SET registration_status = 'removed',
          verification_status = 'manual_override',
          rejected_at = ?,
          rejected_reason = ?,
          recent = 0,
          updated_at = ?
      WHERE id = ?
    `).run(nowIso(), "Deleted by admin", nowIso(), participantId);

    this.syncCompetitionStats(participant.competition_id);
    this.log("participant.deleted", "participant", participantId, `Deleted ${participant.display_name}`, participant.competition_id, "moderator");
    const updated = this.db.prepare("SELECT * FROM participants WHERE id = ? LIMIT 1").get(participantId) as ParticipantRow;
    return toParticipant(updated);
  }

  private registerForCompetition(competition: Competition, payload: RegistrationPayload, actor: "public" | "admin") {
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
      xHandle: payload.xHandle?.trim(),
      phone: payload.phone?.trim(),
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
        email, x_handle, phone, telegram_handle, country, registration_status, verification_status,
        duplicate_risk_score, joined_at, approved_at, rejected_at, rejected_reason,
        ip_hash, device_fingerprint_hash, recent, wins, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      participant.id,
      participant.competitionId,
      participant.displayName,
      participant.exchangeNickname ?? null,
      participant.exchangeId ?? null,
      participant.walletAddress ?? null,
      participant.email ?? null,
      participant.xHandle ?? null,
      participant.phone ?? null,
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
    this.log("participant.joined", "participant", participant.id, `Registered ${participant.displayName}`, competition.id, actor);
    return { participant };
  }

  registerBySlug(slug: string, payload: RegistrationPayload) {
    const competition = this.getCompetitionBySlug(slug);
    if (!competition) {
      return { error: "competition_not_found" as const };
    }

    return this.registerForCompetition(competition, payload, "public");
  }

  registerForCompetitionId(competitionId: string, payload: RegistrationPayload) {
    const competition = this.getCompetitionById(competitionId);
    if (!competition) {
      return { error: "competition_not_found" as const };
    }

    return this.registerForCompetition(competition, payload, "admin");
  }

  listQuizQuestions(competitionId: string, options?: { includeAnswers?: boolean }) {
    const rows = this.db.prepare(`
      SELECT * FROM quiz_questions
      WHERE competition_id = ?
      ORDER BY question_order ASC, created_at ASC
    `).all(competitionId) as QuizQuestionRow[];
    return rows.map((row) => {
      const question = toQuizQuestion(row);
      if (options?.includeAnswers === false) {
        return {
          ...question,
          answerIndex: undefined
        };
      }
      return question;
    });
  }

  createQuizQuestion(
    competitionId: string,
    payload: {
      prompt: string;
      questionType: QuizQuestionType;
      options?: string[];
      answerIndex?: number;
      durationSeconds?: number;
      order?: number;
    }
  ) {
    const competition = this.getCompetitionById(competitionId);
    if (!competition) {
      throw new Error("competition_not_found");
    }

    const prompt = payload.prompt.trim();
    if (!prompt) {
      throw new Error("prompt_required");
    }

    const questionType: QuizQuestionType = payload.questionType === "question_only" ? "question_only" : "multiple_choice";
    const durationSeconds = Number.isFinite(payload.durationSeconds)
      ? Math.max(5, Math.min(600, Math.floor(payload.durationSeconds as number)))
      : 20;
    const normalizedOptions = (payload.options ?? [])
      .map((option) => option.trim())
      .filter(Boolean)
      .slice(0, 8);

    if (questionType === "multiple_choice" && normalizedOptions.length < 2) {
      throw new Error("options_required");
    }

    const maxOrderRow = this.db.prepare(`
      SELECT COALESCE(MAX(question_order), 0) AS max_order
      FROM quiz_questions
      WHERE competition_id = ?
    `).get(competitionId) as { max_order: number };
    const order = Number.isFinite(payload.order)
      ? Math.max(1, Math.floor(payload.order as number))
      : (maxOrderRow.max_order + 1);

    const answerIndex = questionType === "multiple_choice"
      ? Math.min(Math.max(0, Math.floor(payload.answerIndex ?? 0)), normalizedOptions.length - 1)
      : null;

    const createdId = id("quizq");
    const ts = nowIso();
    this.db.prepare(`
      INSERT INTO quiz_questions (
        id, competition_id, prompt, question_type, options_json, answer_index,
        duration_seconds, question_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      createdId,
      competitionId,
      prompt,
      questionType,
      JSON.stringify(questionType === "multiple_choice" ? normalizedOptions : []),
      answerIndex,
      durationSeconds,
      order,
      ts,
      ts
    );

    this.log("quiz_question.created", "quiz_question", createdId, `Created quiz question #${order}`, competitionId, "admin");
    const row = this.db.prepare("SELECT * FROM quiz_questions WHERE id = ? LIMIT 1").get(createdId) as QuizQuestionRow;
    return toQuizQuestion(row);
  }

  updateQuizQuestion(
    questionId: string,
    payload: {
      prompt?: string;
      questionType?: QuizQuestionType;
      options?: string[];
      answerIndex?: number;
      durationSeconds?: number;
      order?: number;
    }
  ) {
    const existing = this.db.prepare("SELECT * FROM quiz_questions WHERE id = ? LIMIT 1").get(questionId) as QuizQuestionRow | undefined;
    if (!existing) {
      return null;
    }

    const nextPrompt = payload.prompt === undefined ? existing.prompt : payload.prompt.trim();
    if (!nextPrompt) {
      throw new Error("prompt_required");
    }

    const questionType: QuizQuestionType = payload.questionType === undefined
      ? existing.question_type
      : (payload.questionType === "question_only" ? "question_only" : "multiple_choice");

    const nextDuration = payload.durationSeconds === undefined
      ? existing.duration_seconds
      : Math.max(5, Math.min(600, Math.floor(payload.durationSeconds)));
    const nextOrder = payload.order === undefined ? existing.question_order : Math.max(1, Math.floor(payload.order));

    const normalizedOptions = (payload.options === undefined
      ? parseJson<string[]>(existing.options_json, [])
      : payload.options
    )
      .map((option) => option.trim())
      .filter(Boolean)
      .slice(0, 8);

    if (questionType === "multiple_choice" && normalizedOptions.length < 2) {
      throw new Error("options_required");
    }

    const nextAnswerIndex = questionType === "multiple_choice"
      ? Math.min(
        Math.max(0, Math.floor(payload.answerIndex === undefined ? (existing.answer_index ?? 0) : payload.answerIndex)),
        normalizedOptions.length - 1
      )
      : null;

    this.db.prepare(`
      UPDATE quiz_questions
      SET prompt = ?,
          question_type = ?,
          options_json = ?,
          answer_index = ?,
          duration_seconds = ?,
          question_order = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      nextPrompt,
      questionType,
      JSON.stringify(questionType === "multiple_choice" ? normalizedOptions : []),
      nextAnswerIndex,
      nextDuration,
      nextOrder,
      nowIso(),
      questionId
    );

    this.log(
      "quiz_question.updated",
      "quiz_question",
      questionId,
      `Updated quiz question #${nextOrder}`,
      existing.competition_id,
      "admin"
    );

    const row = this.db.prepare("SELECT * FROM quiz_questions WHERE id = ? LIMIT 1").get(questionId) as QuizQuestionRow;
    return toQuizQuestion(row);
  }

  deleteQuizQuestion(questionId: string) {
    const existing = this.db.prepare("SELECT * FROM quiz_questions WHERE id = ? LIMIT 1").get(questionId) as QuizQuestionRow | undefined;
    if (!existing) {
      return false;
    }
    this.db.prepare("DELETE FROM quiz_questions WHERE id = ?").run(questionId);
    this.log("quiz_question.deleted", "quiz_question", questionId, `Deleted quiz question #${existing.question_order}`, existing.competition_id, "admin");
    return true;
  }

  getQuizLiveState(competitionId: string) {
    const row = this.db.prepare(`
      SELECT * FROM quiz_live_state
      WHERE competition_id = ?
      LIMIT 1
    `).get(competitionId) as QuizLiveStateRow | undefined;

    return row ? toQuizLiveState(row) : null;
  }

  private getQuizDurations(competitionId: string) {
    const questions = this.listQuizQuestions(competitionId);
    return questions.map((question) => Math.max(5, Math.floor(question.durationSeconds || 20)));
  }

  private resolveQuizRuntime(competitionId: string, nowMs = Date.now()) {
    const state = this.getQuizLiveState(competitionId);
    const durations = this.getQuizDurations(competitionId);
    const total = durations.length;
    if (!total) {
      return {
        state,
        total,
        index: -1,
        remaining: 0
      };
    }

    const clampedIndex = Math.min(Math.max(0, state?.currentIndex ?? 0), total - 1);
    if (!state || state.status === "stopped") {
      return {
        state,
        total,
        index: clampedIndex,
        remaining: durations[clampedIndex] ?? 0
      };
    }

    if (state.status === "paused") {
      const baseDuration = durations[clampedIndex] ?? 20;
      const remaining = Math.min(baseDuration, Math.max(0, Math.floor(state.pausedRemainingSeconds ?? baseDuration)));
      return {
        state,
        total,
        index: clampedIndex,
        remaining
      };
    }

    const startedAtMs = state.questionStartedAt ? new Date(state.questionStartedAt).getTime() : nowMs;
    const elapsedSecondsRaw = Math.max(0, Math.floor((nowMs - startedAtMs) / 1000));
    let elapsedSeconds = elapsedSecondsRaw;
    let index = clampedIndex;
    let duration = durations[index] ?? 20;

    while (elapsedSeconds >= duration && index < total - 1) {
      elapsedSeconds -= duration;
      index += 1;
      duration = durations[index] ?? 20;
    }

    const remaining = Math.max(0, duration - elapsedSeconds);
    return {
      state,
      total,
      index,
      remaining
    };
  }

  setQuizLiveAction(
    competitionId: string,
    action: "start" | "pause" | "resume" | "next" | "prev" | "reset"
  ) {
    const competition = this.getCompetitionById(competitionId);
    if (!competition) {
      throw new Error("competition_not_found");
    }
    const durations = this.getQuizDurations(competitionId);
    if (!durations.length) {
      throw new Error("quiz_questions_not_found");
    }

    const runtime = this.resolveQuizRuntime(competitionId);
    const total = runtime.total;
    const currentIndex = runtime.index >= 0 ? runtime.index : 0;
    const now = nowIso();

    let status: QuizLiveStatus = runtime.state?.status ?? "stopped";
    let nextIndex = currentIndex;
    let questionStartedAt: string | null = runtime.state?.questionStartedAt ?? null;
    let pausedRemainingSeconds: number | null = runtime.remaining;

    switch (action) {
      case "start":
        status = "running";
        nextIndex = 0;
        questionStartedAt = now;
        pausedRemainingSeconds = null;
        break;
      case "pause":
        status = "paused";
        nextIndex = currentIndex;
        questionStartedAt = null;
        pausedRemainingSeconds = runtime.remaining;
        break;
      case "resume": {
        const duration = durations[currentIndex] ?? 20;
        const remaining = runtime.remaining > 0 ? runtime.remaining : duration;
        const elapsed = Math.max(0, duration - remaining);
        status = "running";
        nextIndex = currentIndex;
        questionStartedAt = new Date(Date.now() - (elapsed * 1000)).toISOString();
        pausedRemainingSeconds = null;
        break;
      }
      case "next":
        status = runtime.state?.status ?? "paused";
        nextIndex = Math.min(currentIndex + 1, total - 1);
        questionStartedAt = status === "running" ? now : null;
        pausedRemainingSeconds = status === "running" ? null : durations[nextIndex];
        break;
      case "prev":
        status = runtime.state?.status ?? "paused";
        nextIndex = Math.max(currentIndex - 1, 0);
        questionStartedAt = status === "running" ? now : null;
        pausedRemainingSeconds = status === "running" ? null : durations[nextIndex];
        break;
      case "reset":
        status = "stopped";
        nextIndex = 0;
        questionStartedAt = null;
        pausedRemainingSeconds = durations[0];
        break;
      default:
        throw new Error("invalid_action");
    }

    this.db.prepare(`
      INSERT INTO quiz_live_state (
        competition_id, status, current_index, question_started_at, paused_remaining_seconds, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(competition_id) DO UPDATE SET
        status = excluded.status,
        current_index = excluded.current_index,
        question_started_at = excluded.question_started_at,
        paused_remaining_seconds = excluded.paused_remaining_seconds,
        updated_at = excluded.updated_at
    `).run(
      competitionId,
      status,
      nextIndex,
      questionStartedAt,
      pausedRemainingSeconds,
      runtime.state?.createdAt ?? now,
      now
    );

    this.log(
      `quiz_live.${action}`,
      "quiz_live_state",
      competitionId,
      `Quiz live action: ${action} (index ${nextIndex + 1}/${total})`,
      competitionId,
      "admin"
    );

    return this.getQuizLiveState(competitionId);
  }

  submitQuizAnswer(
    competitionId: string,
    payload: {
      questionId: string;
      selectedIndex: number;
      displayName?: string;
      exchangeId?: string;
    }
  ) {
    const competition = this.getCompetitionById(competitionId);
    if (!competition) {
      return { error: "competition_not_found" as const };
    }

    const questions = this.listQuizQuestions(competitionId);
    if (!questions.length) {
      return { error: "quiz_questions_not_found" as const };
    }

    const runtime = this.resolveQuizRuntime(competitionId);
    const activeQuestion = runtime.index >= 0 ? questions[runtime.index] : null;
    if (!activeQuestion) {
      return { error: "quiz_question_not_active" as const };
    }

    const liveState = this.getQuizLiveState(competitionId);
    if (!liveState || liveState.status !== "running") {
      return { error: "quiz_not_running" as const };
    }

    if (runtime.remaining <= 0) {
      return { error: "quiz_answer_window_closed" as const };
    }

    if (activeQuestion.id !== payload.questionId) {
      return { error: "quiz_question_mismatch" as const };
    }

    if (activeQuestion.questionType !== "multiple_choice") {
      return { error: "question_not_multiple_choice" as const };
    }

    const selectedIndex = Number.isFinite(payload.selectedIndex) ? Math.floor(payload.selectedIndex) : -1;
    if (selectedIndex < 0 || selectedIndex >= activeQuestion.options.length) {
      return { error: "invalid_selected_index" as const };
    }

    const normalizedExchangeId = payload.exchangeId?.trim() || null;
    const normalizedDisplayName = payload.displayName?.trim() || null;
    const participant = normalizedExchangeId
      ? this.db.prepare(`
          SELECT * FROM participants
          WHERE competition_id = ? AND exchange_id = ?
          LIMIT 1
        `).get(competitionId, normalizedExchangeId) as ParticipantRow | undefined
      : normalizedDisplayName
        ? this.db.prepare(`
            SELECT * FROM participants
            WHERE competition_id = ? AND LOWER(display_name) = LOWER(?)
            LIMIT 1
          `).get(competitionId, normalizedDisplayName) as ParticipantRow | undefined
        : undefined;

    const isCorrect = selectedIndex === (activeQuestion.answerIndex ?? -1);
    const submissionId = id("quizsub");
    const submittedAt = nowIso();
    this.db.prepare(`
      INSERT INTO quiz_submissions (
        id, competition_id, question_id, participant_id, display_name, exchange_id,
        selected_index, is_correct, submitted_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      submissionId,
      competitionId,
      activeQuestion.id,
      participant?.id ?? null,
      normalizedDisplayName ?? participant?.display_name ?? null,
      normalizedExchangeId ?? participant?.exchange_id ?? null,
      selectedIndex,
      isCorrect ? 1 : 0,
      submittedAt,
      submittedAt
    );

    this.log(
      "quiz.answer.submitted",
      "quiz_submission",
      submissionId,
      `Q${runtime.index + 1} answer submitted (${isCorrect ? "correct" : "wrong"})`,
      competitionId,
      "public"
    );

    return {
      submissionId,
      questionId: activeQuestion.id,
      selectedIndex,
      isCorrect,
      submittedAt
    };
  }

  listQuizSubmissions(competitionId: string) {
    const rows = this.db.prepare(`
      SELECT
        s.*,
        q.prompt AS question_prompt
      FROM quiz_submissions s
      INNER JOIN quiz_questions q ON q.id = s.question_id
      WHERE s.competition_id = ?
      ORDER BY s.submitted_at DESC
    `).all(competitionId) as QuizSubmissionRow[];
    return rows.map(toQuizSubmission);
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

  listSpinFairnessRecords(competitionId: string) {
    const rows = this.db.prepare(`
      SELECT * FROM spin_fairness_records
      WHERE competition_id = ?
      ORDER BY created_at DESC
    `).all(competitionId) as SpinFairnessRow[];
    return rows.map(toSpinFairnessRecord);
  }

  getSpinFairnessRecord(spinId: string) {
    const row = this.db.prepare(`
      SELECT * FROM spin_fairness_records
      WHERE spin_id = ?
      LIMIT 1
    `).get(spinId) as SpinFairnessRow | undefined;
    return row ? toSpinFairnessRecord(row) : null;
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

  createSpin(competitionId: string, initiatedBy = "admin", clientSeed?: string) {
    const competition = this.getCompetitionById(competitionId);
    if (!competition) {
      return { error: "competition_not_found" as const };
    }

    const poolRows = this.db.prepare(`
      SELECT * FROM participants
      WHERE competition_id = ? AND registration_status = 'approved'
      ORDER BY id ASC
    `).all(competitionId) as ParticipantRow[];

    if (!poolRows.length) {
      return { error: "no_approved_participants" as const };
    }

    const normalizedClientSeed = (clientSeed ?? "default-client-seed").trim() || "default-client-seed";
    const nonce = randomHex(8);
    const serverSeed = randomHex(32);
    const commitHash = sha256Hex(serverSeed);
    const revealHash = computeRevealHash(serverSeed, normalizedClientSeed, nonce);
    const resolvedIndex = deriveSpinIndex(revealHash, poolRows.length);

    const winnerParticipantRow = poolRows[resolvedIndex];
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
      seedCommitHash: commitHash,
      resultParticipantId: winnerParticipant.id,
      resultDisplayName: winnerParticipant.displayName
    };

    const fairnessRecord: SpinFairnessRecord = {
      id: id("fair"),
      spinId: spin.id,
      competitionId,
      algorithm: "sha256(serverSeed:clientSeed:nonce) -> modulo(poolSize)",
      serverSeed,
      clientSeed: normalizedClientSeed,
      nonce,
      commitHash,
      revealHash,
      poolSize: poolRows.length,
      resolvedIndex,
      resolvedParticipantId: winnerParticipant.id,
      createdAt: nowIso(),
      verified: true
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

      this.db.prepare(`
        INSERT INTO spin_fairness_records (
          id, spin_id, competition_id, algorithm, server_seed, client_seed, nonce,
          commit_hash, reveal_hash, pool_size, resolved_index, resolved_participant_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        fairnessRecord.id,
        fairnessRecord.spinId,
        fairnessRecord.competitionId,
        fairnessRecord.algorithm,
        fairnessRecord.serverSeed,
        fairnessRecord.clientSeed,
        fairnessRecord.nonce,
        fairnessRecord.commitHash,
        fairnessRecord.revealHash,
        fairnessRecord.poolSize,
        fairnessRecord.resolvedIndex,
        fairnessRecord.resolvedParticipantId,
        fairnessRecord.createdAt
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

    return { spin, winner, participant: toParticipant(updatedParticipantRow), fairness: fairnessRecord };
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

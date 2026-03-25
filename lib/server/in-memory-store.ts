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

type MutableState = {
  competitions: Competition[];
  participants: Participant[];
  winners: Winner[];
  spins: Spin[];
  logs: EventLog[];
};

const GLOBAL_KEY = "__event_wheel_store_v1__";

function cloneState(): MutableState {
  return {
    competitions: structuredClone(seedCompetitions),
    participants: structuredClone(seedParticipants),
    winners: structuredClone(seedWinners),
    spins: structuredClone(seedSpins),
    logs: structuredClone(seedLogs)
  };
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

class InMemoryStore {
  private state: MutableState;

  constructor() {
    this.state = cloneState();
  }

  private log(action: string, entityType: string, entityId: string, summary: string, competitionId?: string, actor = "system") {
    this.state.logs.unshift({
      id: id("log"),
      competitionId,
      actor,
      action,
      entityType,
      entityId,
      createdAt: nowIso(),
      payloadSummary: summary
    });
  }

  listCompetitions() {
    return this.state.competitions;
  }

  getCompetitionById(competitionId: string) {
    return this.state.competitions.find((competition) => competition.id === competitionId);
  }

  getCompetitionBySlug(slug: string) {
    return this.state.competitions.find((competition) => competition.slug === slug);
  }

  createCompetition(payload: CreateCompetitionPayload) {
    const title = (payload.title ?? "").trim();
    if (!title) {
      throw new Error("title_required");
    }

    const slug = toSlug(payload.slug?.trim() || title);
    const slugExists = this.state.competitions.some((competition) => competition.slug === slug);
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

    this.state.competitions.unshift(created);
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

    Object.assign(competition, merged);
    this.log(
      "competition.updated",
      "competition",
      competition.id,
      `Updated competition ${competition.title}${beforeStatus !== competition.status ? ` (${beforeStatus} → ${competition.status})` : ""}`,
      competition.id,
      "admin"
    );
    return competition;
  }

  getDashboard(): DashboardStats {
    return {
      activeEvents: this.state.competitions.filter((competition) => competition.status === "live").length,
      totalParticipants: this.state.participants.length,
      pendingVerification: this.state.participants.filter((participant) => participant.verificationStatus === "pending").length,
      unpaidWinners: this.state.winners.filter((winner) => winner.payoutStatus !== "paid").length
    };
  }

  getParticipants(competitionId: string) {
    return this.state.participants.filter((participant) => participant.competitionId === competitionId);
  }

  approveParticipant(participantId: string) {
    const participant = this.state.participants.find((item) => item.id === participantId);
    if (!participant) {
      return null;
    }

    participant.registrationStatus = "approved";
    participant.verificationStatus = "manual_override";
    participant.approvedAt = nowIso();
    participant.recent = true;
    this.syncCompetitionStats(participant.competitionId);
    this.log("participant.approved", "participant", participant.id, `Approved ${participant.displayName}`, participant.competitionId, "moderator");
    return participant;
  }

  rejectParticipant(participantId: string, reason: string) {
    const participant = this.state.participants.find((item) => item.id === participantId);
    if (!participant) {
      return null;
    }

    participant.registrationStatus = "rejected";
    participant.rejectedAt = nowIso();
    participant.rejectedReason = reason;
    this.syncCompetitionStats(participant.competitionId);
    this.log("participant.rejected", "participant", participant.id, `Rejected ${participant.displayName}: ${reason}`, participant.competitionId, "moderator");
    return participant;
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
    if (walletAddress && this.state.participants.some((item) => item.competitionId === competition.id && item.walletAddress === walletAddress)) {
      return { error: "duplicate_wallet" as const };
    }

    const exchangeId = payload.exchangeId?.trim();
    if (exchangeId && this.state.participants.some((item) => item.competitionId === competition.id && item.exchangeId === exchangeId)) {
      return { error: "duplicate_exchange_id" as const };
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

    this.state.participants.unshift(participant);
    this.syncCompetitionStats(competition.id);
    this.log("participant.joined", "participant", participant.id, `Registered ${participant.displayName}`, competition.id, "public");
    return { participant };
  }

  listWinners(competitionId: string) {
    return this.state.winners.filter((winner) => winner.competitionId === competitionId);
  }

  listSpins(competitionId: string) {
    return this.state.spins.filter((spin) => spin.competitionId === competitionId);
  }

  updateWinnerClaimStatus(winnerId: string, claimStatus: Winner["claimStatus"]) {
    const winner = this.state.winners.find((item) => item.id === winnerId);
    if (!winner) {
      return null;
    }
    winner.claimStatus = claimStatus;
    if (claimStatus === "submitted") {
      winner.claimedAt = nowIso();
    }
    if (claimStatus === "verified") {
      winner.verifiedAt = nowIso();
    }
    this.log("winner.claim_status.updated", "winner", winner.id, `Claim status set to ${claimStatus}`, winner.competitionId, "admin");
    return winner;
  }

  updateWinnerPayoutStatus(winnerId: string, payoutStatus: Winner["payoutStatus"], transactionReference?: string) {
    const winner = this.state.winners.find((item) => item.id === winnerId);
    if (!winner) {
      return null;
    }

    winner.payoutStatus = payoutStatus;
    if (payoutStatus === "paid") {
      winner.paidAt = nowIso();
    }
    if (typeof transactionReference === "string") {
      winner.transactionReference = transactionReference;
    }
    this.log("winner.payout_status.updated", "winner", winner.id, `Payout status set to ${payoutStatus}`, winner.competitionId, "admin");
    return winner;
  }

  createSpin(competitionId: string, initiatedBy = "admin") {
    const competition = this.getCompetitionById(competitionId);
    if (!competition) {
      return { error: "competition_not_found" as const };
    }

    const pool = this.getParticipants(competitionId).filter((participant) => participant.registrationStatus === "approved");
    if (!pool.length) {
      return { error: "no_approved_participants" as const };
    }

    const winnerParticipant = pool[Math.floor(Math.random() * pool.length)];
    const winnerCount = this.listWinners(competitionId).length;
    const roundNumber = winnerCount + 1;

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
    this.state.spins.unshift(spin);

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
    this.state.winners.unshift(winner);

    if (competition.autoRemoveWinners) {
      winnerParticipant.registrationStatus = "won";
      winnerParticipant.wins += 1;
    }

    competition.recentWinnerIds = [winner.id, ...competition.recentWinnerIds].slice(0, 10);
    this.syncCompetitionStats(competitionId);
    this.log("spin.completed", "spin", spin.id, `Winner resolved to ${winner.displayName}`, competitionId, initiatedBy);

    return { spin, winner, participant: winnerParticipant };
  }

  submitClaim(claimToken: string, payload: Record<string, unknown>) {
    const winner = this.state.winners.find((item) => item.id === claimToken || item.participantId === claimToken);
    if (!winner) {
      return null;
    }
    winner.claimStatus = "submitted";
    winner.claimedAt = nowIso();
    this.log("winner.claim_submitted", "winner", winner.id, "Claim submitted through public endpoint", winner.competitionId, "public");
    return { winner, payload };
  }

  getLeaderboard(competitionId: string) {
    return this.getParticipants(competitionId).sort((a, b) => b.wins - a.wins || a.displayName.localeCompare(b.displayName));
  }

  getLogs(competitionId?: string) {
    return competitionId
      ? this.state.logs.filter((log) => log.competitionId === competitionId)
      : this.state.logs;
  }

  private syncCompetitionStats(competitionId: string) {
    const competition = this.getCompetitionById(competitionId);
    if (!competition) {
      return;
    }
    const scopedParticipants = this.getParticipants(competitionId);
    const scopedWinners = this.listWinners(competitionId);
    competition.stats = {
      totalParticipants: scopedParticipants.length,
      totalApproved: scopedParticipants.filter((participant) => participant.registrationStatus === "approved").length,
      pendingVerification: scopedParticipants.filter((participant) => participant.verificationStatus === "pending").length,
      totalWinners: scopedWinners.length
    };
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __event_wheel_store_v1__: InMemoryStore | undefined;
}

export const store = globalThis[GLOBAL_KEY as keyof typeof globalThis] as InMemoryStore | undefined
  ?? new InMemoryStore();

if (!globalThis.__event_wheel_store_v1__) {
  globalThis.__event_wheel_store_v1__ = store;
}

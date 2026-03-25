import {
  Competition,
  EventLog,
  Participant,
  Spin,
  Winner
} from "@/lib/types";

export const competitions: Competition[] = [
  {
    id: "comp-1",
    slug: "solstice-surge",
    title: "Solstice Surge Championship",
    status: "live",
    themeKey: "aurora",
    description:
      "A branded live competition built for high-energy streams, verified entrants, and transparent winner selection.",
    announcementText:
      "Registration is live. Hold at least 250 SURGE, complete your profile, and be ready for the next spin window.",
    chainKey: "Base",
    tokenContractAddress: "0x6e92...4b17",
    minTokenBalance: 250,
    verificationMode: "hybrid rules",
    registrationOpenAt: "2026-03-24T11:00:00.000Z",
    registrationCloseAt: "2026-03-25T16:00:00.000Z",
    eventStartAt: "2026-03-25T17:00:00.000Z",
    eventEndAt: "2026-03-25T19:00:00.000Z",
    totalWinnerSlots: 8,
    autoRemoveWinners: true,
    leaderboardPublic: true,
    allowPublicWinners: true,
    recentWinnerIds: ["winner-1", "winner-2", "winner-3"],
    stats: {
      totalParticipants: 1248,
      totalApproved: 972,
      pendingVerification: 146,
      totalWinners: 3
    },
    registrationFields: [
      {
        key: "displayName",
        label: "Display Name",
        type: "text",
        required: true,
        placeholder: "Your stream nickname"
      },
      {
        key: "exchangeId",
        label: "Exchange ID",
        type: "text",
        required: true,
        placeholder: "Optional for support follow-up"
      },
      {
        key: "walletAddress",
        label: "Wallet Address",
        type: "wallet",
        required: true,
        placeholder: "0x..."
      },
      {
        key: "email",
        label: "Email",
        type: "email",
        required: true,
        placeholder: "you@example.com"
      },
      {
        key: "telegramHandle",
        label: "Telegram Handle",
        type: "text",
        required: false,
        placeholder: "@handle"
      },
      {
        key: "country",
        label: "Country",
        type: "country",
        required: true,
        placeholder: "Select your country"
      }
    ],
    prizeTiers: [
      {
        id: "tier-1",
        label: "Grand Prize",
        description: "Top live spin placement",
        quantity: 1,
        valueText: "$2,500 USDC"
      },
      {
        id: "tier-2",
        label: "Finalist",
        description: "Follow-up winner pool",
        quantity: 2,
        valueText: "$750 USDC"
      },
      {
        id: "tier-3",
        label: "Community Boost",
        description: "Mid-round instant win",
        quantity: 5,
        valueText: "$150 USDC"
      }
    ]
  },
  {
    id: "comp-2",
    slug: "night-fury-finals",
    title: "Night Fury Finals",
    status: "scheduled",
    themeKey: "ember",
    description: "A scheduled finals event prepared from a reusable template.",
    announcementText: "Scheduled for tomorrow. Approvals close one hour before kickoff.",
    chainKey: "Ethereum",
    tokenContractAddress: "0x93af...17ef",
    minTokenBalance: 100,
    verificationMode: "manual review",
    registrationOpenAt: "2026-03-24T08:00:00.000Z",
    registrationCloseAt: "2026-03-26T08:00:00.000Z",
    eventStartAt: "2026-03-26T11:00:00.000Z",
    eventEndAt: "2026-03-26T13:00:00.000Z",
    totalWinnerSlots: 4,
    autoRemoveWinners: true,
    leaderboardPublic: false,
    allowPublicWinners: false,
    recentWinnerIds: [],
    stats: {
      totalParticipants: 332,
      totalApproved: 281,
      pendingVerification: 23,
      totalWinners: 0
    },
    registrationFields: [],
    prizeTiers: []
  }
];

export const participants: Participant[] = [
  {
    id: "part-1",
    competitionId: "comp-1",
    displayName: "NovaFlux",
    exchangeNickname: "novaflux",
    exchangeId: "BN-7711",
    walletAddress: "0xA112...CC03",
    email: "nova@example.com",
    telegramHandle: "@novaflux",
    country: "Canada",
    registrationStatus: "approved",
    verificationStatus: "passed",
    duplicateRiskScore: 0.03,
    joinedAt: "2026-03-24T12:11:00.000Z",
    approvedAt: "2026-03-24T12:15:00.000Z",
    recent: true,
    wins: 1
  },
  {
    id: "part-2",
    competitionId: "comp-1",
    displayName: "PixelRogue",
    exchangeNickname: "pixelrogue",
    exchangeId: "BN-6620",
    walletAddress: "0xF211...AA90",
    email: "pixel@example.com",
    telegramHandle: "@pixelrogue",
    country: "India",
    registrationStatus: "approved",
    verificationStatus: "passed",
    duplicateRiskScore: 0.08,
    joinedAt: "2026-03-24T12:32:00.000Z",
    approvedAt: "2026-03-24T12:40:00.000Z",
    recent: true,
    wins: 0
  },
  {
    id: "part-3",
    competitionId: "comp-1",
    displayName: "EchoMint",
    exchangeNickname: "echomint",
    exchangeId: "BN-5521",
    walletAddress: "0xCC02...0091",
    email: "echo@example.com",
    telegramHandle: "@echomint",
    country: "Germany",
    registrationStatus: "pending_review",
    verificationStatus: "pending",
    duplicateRiskScore: 0.16,
    joinedAt: "2026-03-24T13:02:00.000Z",
    wins: 0
  },
  {
    id: "part-4",
    competitionId: "comp-1",
    displayName: "LumaGrid",
    exchangeNickname: "lumagrid",
    exchangeId: "BN-1012",
    walletAddress: "0x0931...7711",
    email: "luma@example.com",
    telegramHandle: "@lumagrid",
    country: "Brazil",
    registrationStatus: "flagged_duplicate",
    verificationStatus: "manual_override",
    duplicateRiskScore: 0.72,
    joinedAt: "2026-03-24T13:17:00.000Z",
    wins: 0
  },
  {
    id: "part-5",
    competitionId: "comp-1",
    displayName: "VoltCipher",
    exchangeNickname: "voltcipher",
    exchangeId: "BN-8302",
    walletAddress: "0x4451...AB12",
    email: "volt@example.com",
    telegramHandle: "@voltcipher",
    country: "United Kingdom",
    registrationStatus: "won",
    verificationStatus: "passed",
    duplicateRiskScore: 0.02,
    joinedAt: "2026-03-24T11:59:00.000Z",
    approvedAt: "2026-03-24T12:10:00.000Z",
    wins: 1
  }
];

export const winners: Winner[] = [
  {
    id: "winner-1",
    competitionId: "comp-1",
    participantId: "part-5",
    displayName: "VoltCipher",
    prizeLabel: "Grand Prize",
    roundNumber: 1,
    wonAt: "2026-03-24T14:05:00.000Z",
    claimStatus: "submitted",
    payoutStatus: "processing",
    claimDeadlineAt: "2026-03-27T14:05:00.000Z",
    transactionReference: "OPS-22041"
  },
  {
    id: "winner-2",
    competitionId: "comp-1",
    participantId: "part-1",
    displayName: "NovaFlux",
    prizeLabel: "Community Boost",
    roundNumber: 1,
    wonAt: "2026-03-24T14:22:00.000Z",
    claimStatus: "verified",
    payoutStatus: "paid",
    claimDeadlineAt: "2026-03-27T14:22:00.000Z",
    transactionReference: "TX-0x1ae993"
  },
  {
    id: "winner-3",
    competitionId: "comp-1",
    participantId: "part-2",
    displayName: "PixelRogue",
    prizeLabel: "Community Boost",
    roundNumber: 2,
    wonAt: "2026-03-24T14:41:00.000Z",
    claimStatus: "pending",
    payoutStatus: "pending",
    claimDeadlineAt: "2026-03-27T14:41:00.000Z"
  }
];

export const spins: Spin[] = [
  {
    id: "spin-1",
    competitionId: "comp-1",
    roundNumber: 1,
    startedAt: "2026-03-24T14:05:00.000Z",
    endedAt: "2026-03-24T14:05:16.000Z",
    initiatedBy: "Ava Chen",
    rngMode: "server-seeded RNG",
    seedCommitHash: "0x6c42d9d6aa174f3b",
    resultParticipantId: "part-5",
    resultDisplayName: "VoltCipher"
  },
  {
    id: "spin-2",
    competitionId: "comp-1",
    roundNumber: 1,
    startedAt: "2026-03-24T14:22:00.000Z",
    endedAt: "2026-03-24T14:22:15.000Z",
    initiatedBy: "Ava Chen",
    rngMode: "server-seeded RNG",
    seedCommitHash: "0x91f41ca9dcb17f22",
    resultParticipantId: "part-1",
    resultDisplayName: "NovaFlux"
  },
  {
    id: "spin-3",
    competitionId: "comp-1",
    roundNumber: 2,
    startedAt: "2026-03-24T14:41:00.000Z",
    endedAt: "2026-03-24T14:41:13.000Z",
    initiatedBy: "Mina Patel",
    rngMode: "provable fairness mode",
    seedCommitHash: "0x2be8914b1c0042ff",
    resultParticipantId: "part-2",
    resultDisplayName: "PixelRogue"
  }
];

export const eventLogs: EventLog[] = [
  {
    id: "log-1",
    competitionId: "comp-1",
    actor: "system",
    action: "participant.duplicate_flagged",
    entityType: "participant",
    entityId: "part-4",
    createdAt: "2026-03-24T13:18:00.000Z",
    payloadSummary: "Wallet collision detected against one archived entry."
  },
  {
    id: "log-2",
    competitionId: "comp-1",
    actor: "Ava Chen",
    action: "spin.completed",
    entityType: "spin",
    entityId: "spin-3",
    createdAt: "2026-03-24T14:41:13.000Z",
    payloadSummary: "Winner resolved to PixelRogue using fairness mode."
  },
  {
    id: "log-3",
    competitionId: "comp-1",
    actor: "Mina Patel",
    action: "winner.payout_updated",
    entityType: "winner",
    entityId: "winner-2",
    createdAt: "2026-03-24T15:10:00.000Z",
    payloadSummary: "Marked paid with on-chain transaction reference."
  }
];

export function getCompetitionBySlug(slug: string) {
  return competitions.find((competition) => competition.slug === slug);
}

export function getCompetitionById(id: string) {
  return competitions.find((competition) => competition.id === id);
}

export function getCompetitionParticipants(competitionId: string) {
  return participants.filter((participant) => participant.competitionId === competitionId);
}

export function getCompetitionWinners(competitionId: string) {
  return winners.filter((winner) => winner.competitionId === competitionId);
}

export function getCompetitionSpins(competitionId: string) {
  return spins.filter((spin) => spin.competitionId === competitionId);
}

export function getCompetitionLogs(competitionId?: string) {
  return competitionId
    ? eventLogs.filter((log) => log.competitionId === competitionId)
    : eventLogs;
}

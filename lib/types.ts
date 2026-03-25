export type CompetitionStatus =
  | "draft"
  | "scheduled"
  | "live"
  | "paused"
  | "completed"
  | "archived";

export type CompetitionGameType =
  | "wheel_of_fortune"
  | "flip_to_win"
  | "quiz";

export type VerificationStatus =
  | "not_required"
  | "pending"
  | "passed"
  | "failed"
  | "manual_override";

export type RegistrationStatus =
  | "registered"
  | "pending_review"
  | "approved"
  | "rejected"
  | "flagged_duplicate"
  | "removed"
  | "won";

export type ClaimStatus =
  | "not_applicable"
  | "pending"
  | "submitted"
  | "verified"
  | "expired";

export type PayoutStatus =
  | "not_applicable"
  | "pending"
  | "processing"
  | "paid"
  | "failed";

export interface RegistrationField {
  key: string;
  label: string;
  type: "text" | "email" | "wallet" | "country" | "textarea";
  required: boolean;
  placeholder: string;
}

export interface Participant {
  id: string;
  competitionId: string;
  displayName: string;
  exchangeNickname?: string;
  exchangeId?: string;
  walletAddress?: string;
  email?: string;
  xHandle?: string;
  phone?: string;
  telegramHandle?: string;
  country: string;
  registrationStatus: RegistrationStatus;
  verificationStatus: VerificationStatus;
  duplicateRiskScore: number;
  joinedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectedReason?: string;
  ipHash?: string;
  deviceFingerprintHash?: string;
  recent?: boolean;
  wins: number;
}

export interface Winner {
  id: string;
  competitionId: string;
  participantId: string;
  displayName: string;
  prizeLabel: string;
  roundNumber: number;
  wonAt: string;
  claimStatus: ClaimStatus;
  payoutStatus: PayoutStatus;
  claimDeadlineAt: string;
  claimedAt?: string;
  verifiedAt?: string;
  paidAt?: string;
  transactionReference?: string;
}

export interface PrizeTier {
  id: string;
  label: string;
  description: string;
  quantity: number;
  valueText: string;
}

export interface Spin {
  id: string;
  competitionId: string;
  roundNumber: number;
  startedAt: string;
  endedAt: string;
  initiatedBy: string;
  rngMode: string;
  seedCommitHash: string;
  resultParticipantId: string;
  resultDisplayName: string;
}

export interface SpinFairnessRecord {
  id: string;
  spinId: string;
  competitionId: string;
  algorithm: string;
  serverSeed: string;
  clientSeed: string;
  nonce: string;
  commitHash: string;
  revealHash: string;
  poolSize: number;
  resolvedIndex: number;
  resolvedParticipantId: string;
  createdAt: string;
  verified: boolean;
}

export interface Competition {
  id: string;
  slug: string;
  title: string;
  status: CompetitionStatus;
  gameType: CompetitionGameType;
  themeKey: string;
  description: string;
  announcementText: string;
  chainKey: string;
  tokenContractAddress: string;
  minTokenBalance: number;
  verificationMode: string;
  registrationOpenAt: string;
  registrationCloseAt: string;
  eventStartAt: string;
  eventEndAt: string;
  totalWinnerSlots: number;
  autoRemoveWinners: boolean;
  leaderboardPublic: boolean;
  allowPublicWinners: boolean;
  recentWinnerIds: string[];
  stats: {
    totalParticipants: number;
    totalApproved: number;
    pendingVerification: number;
    totalWinners: number;
  };
  registrationFields: RegistrationField[];
  prizeTiers: PrizeTier[];
}

export interface EventLog {
  id: string;
  competitionId?: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  payloadSummary: string;
}

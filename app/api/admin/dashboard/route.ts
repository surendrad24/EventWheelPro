import { NextResponse } from "next/server";
import { competitions, participants, winners } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({
    activeEvents: competitions.filter((item) => item.status === "live").length,
    totalParticipants: participants.length,
    pendingVerification: participants.filter((item) => item.verificationStatus === "pending").length,
    unpaidWinners: winners.filter((item) => item.payoutStatus !== "paid").length
  });
}

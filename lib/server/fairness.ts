import { createHash, randomBytes } from "node:crypto";

export function randomHex(bytes = 32) {
  return randomBytes(bytes).toString("hex");
}

export function sha256Hex(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

export function computeRevealHash(serverSeed: string, clientSeed: string, nonce: string) {
  return sha256Hex(`${serverSeed}:${clientSeed}:${nonce}`);
}

export function deriveSpinIndex(revealHash: string, poolSize: number) {
  if (poolSize <= 0) {
    return 0;
  }
  const value = BigInt(`0x${revealHash}`);
  return Number(value % BigInt(poolSize));
}

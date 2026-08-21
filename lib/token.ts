import { randomBytes, createHash } from "crypto";

/**
 * MT5 Bridge connection tokens: random, long, revocable, account-specific.
 * The raw token is shown to the user ONCE (to paste into the EA input) and
 * only its hash is stored server-side — matching the "never store the MT5
 * password, never expose secrets" requirement.
 */
export function generateBridgeToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("hex"); // 64 hex chars
  const hash = createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

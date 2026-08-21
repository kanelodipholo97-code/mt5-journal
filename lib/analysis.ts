// Pure functions applied to every imported/synced trade.
// Nothing here invents data the broker/journal didn't provide.

export type Session = "LONDON" | "NEW_YORK" | "OUTSIDE_SESSION";
export type RiskStatus = "PASS" | "VIOLATION" | "UNRECONSTRUCTABLE";

/**
 * Session windows (09:00–12:00 London, 14:30–17:30 New York) are defined in
 * SAST per the trading rules. `entryAt` MUST be true UTC (the EA now computes
 * this via TimeGMTOffset() rather than mislabeling broker-server time as UTC).
 * We convert using UTC methods, never .getHours()/.getMinutes(), because those
 * read the *host machine's* local timezone — on a server deployed in a
 * different zone than SAST, that silently misclassifies every trade.
 */
const SAST_OFFSET_HOURS = 2; // SAST = UTC+2, no daylight saving

export function classifySession(entryAtUtc: Date): Session {
  const utcHours = entryAtUtc.getUTCHours() + entryAtUtc.getUTCMinutes() / 60;
  const h = (utcHours + SAST_OFFSET_HOURS) % 24;
  if (h >= 9 && h < 12) return "LONDON";
  if (h >= 14.5 && h < 17.5) return "NEW_YORK";
  return "OUTSIDE_SESSION";
}

export function tradeDurationMinutes(entryAt: Date, exitAt: Date | null): number | null {
  if (!exitAt) return null;
  return Math.round((exitAt.getTime() - entryAt.getTime()) / 60000);
}

/**
 * Compares actual risk taken against the 1% rule.
 * Returns UNRECONSTRUCTABLE (never a guess) if equity-before-trade, stop-loss,
 * or contract size can't be determined from the data on hand. contractSize is
 * NOT defaulted — it varies by instrument (100 for XAUUSD, 100,000 for most
 * FX pairs, 5000 for silver, etc.), so guessing it would silently mis-scale
 * every risk % for anything that isn't gold. The EA reads the true value per
 * symbol via SymbolInfoDouble(symbol, SYMBOL_TRADE_CONTRACT_SIZE) and sends it.
 */
export function assessRisk(params: {
  equityBeforeTrade: number | null;
  entryPrice: number;
  stopLoss: number | null;
  volume: number;
  contractSize: number | null;
}): { requiredPct: number | null; actualPct: number | null; status: RiskStatus; riskAmount: number | null } {
  const { equityBeforeTrade, entryPrice, stopLoss, volume, contractSize } = params;

  if (equityBeforeTrade === null || stopLoss === null || !contractSize) {
    return { requiredPct: null, actualPct: null, status: "UNRECONSTRUCTABLE", riskAmount: null };
  }

  const requiredPct = 1.0;
  const riskAmount = Math.abs(entryPrice - stopLoss) * volume * contractSize;
  const actualPct = (riskAmount / equityBeforeTrade) * 100;

  // Small tolerance band to avoid flagging rounding noise as a violation.
  const status: RiskStatus = actualPct <= requiredPct + 0.05 ? "PASS" : "VIOLATION";

  return { requiredPct, actualPct: Number(actualPct.toFixed(2)), status, riskAmount };
}

export function rMultiple(profit: number | null, riskAmount: number | null): number | null {
  if (profit === null || riskAmount === null || riskAmount === 0) return null;
  return Number((profit / riskAmount).toFixed(2));
}

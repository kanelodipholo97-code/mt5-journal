import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const OFFLINE_THRESHOLD_MS = 3 * 60 * 1000; // ~3 missed sync cycles at the default 45s interval

async function sweepStaleAccounts() {
  const accounts = await prisma.mT5Account.findMany({ where: { connectionMethod: "BRIDGE" } });
  const now = Date.now();

  for (const a of accounts) {
    const stale = !a.lastSyncAt || now - a.lastSyncAt.getTime() > OFFLINE_THRESHOLD_MS;
    if (stale && a.status === "CONNECTED") {
      await prisma.mT5Account.update({ where: { id: a.id }, data: { status: "OFFLINE" } });
      await prisma.syncError.create({
        data: {
          accountId: a.id,
          errorType: "BRIDGE_OFFLINE",
          message: "MT5 bridge offline.",
          lastGoodSync: a.lastSyncAt,
        },
      });
    }
  }
  return accounts.length;
}

// GET /api/mt5/verify              -> sweeps all bridge accounts for staleness (cron/poll use)
// GET /api/mt5/verify?accountId=x  -> also returns that specific account's live status,
//                                     which is what the "Verify MT5 Connection" button needs
export async function GET(req: Request) {
  const checked = await sweepStaleAccounts();
  const accountId = new URL(req.url).searchParams.get("accountId");

  if (!accountId) {
    return NextResponse.json({ checked });
  }

  const account = await prisma.mT5Account.findUnique({ where: { id: accountId } });
  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  return NextResponse.json({
    checked,
    account: {
      id: account.id,
      label: account.label,
      status: account.status,
      broker: account.broker,
      accountType: account.accountType,
      balance: account.balance,
      equity: account.equity,
      lastSyncAt: account.lastSyncAt,
      bridgeVersion: account.bridgeVersion,
    },
  });
}

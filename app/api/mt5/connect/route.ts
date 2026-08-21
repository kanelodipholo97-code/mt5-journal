import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { generateBridgeToken } from "@/lib/token";
import { z } from "zod";

const prisma = new PrismaClient();

const ConnectSchema = z.object({
  userId: z.string(),
  label: z.string(),
  broker: z.string(),
  server: z.string(),
  accountNumber: z.string(),
  accountType: z.enum(["DEMO", "LIVE"]),
});

/**
 * Registry of brokers known to expose a supported read-only trade-history API.
 * This list will be short and honest — most retail MT5 brokers do NOT offer
 * one, so BRIDGE is the expected outcome for the large majority of accounts.
 * Extend this only when a broker's documented, read-only API is actually wired
 * up in lib/brokerApis/*; never mark a broker DIRECT_API "available" speculatively.
 */
const BROKERS_WITH_DIRECT_API: string[] = [
  // e.g. "OANDA" — has a real read-only REST API and would be wired in lib/brokerApis/oanda.ts
];

export async function POST(req: Request) {
  let body;
  try {
    body = ConnectSchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "Invalid connection request" }, { status: 400 });
  }

  const canUseDirectApi = BROKERS_WITH_DIRECT_API.includes(body.broker);
  const identity = { broker: body.broker, server: body.server, accountNumber: body.accountNumber };

  try {
    if (canUseDirectApi) {
      const account = await prisma.mT5Account.upsert({
        where: { broker_server_accountNumber: identity },
        update: {
          label: body.label,
          accountType: body.accountType,
          connectionMethod: "DIRECT_API",
          status: "PENDING",
        },
        create: {
          userId: body.userId,
          ...identity,
          label: body.label,
          accountType: body.accountType,
          connectionMethod: "DIRECT_API",
          status: "PENDING",
        },
      });
      return NextResponse.json({
        account,
        method: "DIRECT_API",
        message: "Direct connection available.",
      });
    }

    const { raw, hash } = generateBridgeToken();
    const account = await prisma.mT5Account.upsert({
      where: { broker_server_accountNumber: identity },
      update: {
        label: body.label,
        accountType: body.accountType,
        connectionMethod: "BRIDGE",
        status: "PENDING",
        bridgeTokenHash: hash,
      },
      create: {
        userId: body.userId,
        ...identity,
        label: body.label,
        accountType: body.accountType,
        connectionMethod: "BRIDGE",
        status: "PENDING",
        bridgeTokenHash: hash,
      },
    });

    return NextResponse.json({
      account,
      method: "BRIDGE",
      message: "Direct broker connection unavailable. Use MT5 Secure Bridge.",
      bridgeToken: raw,
    });
  } catch (e) {
    return NextResponse.json({ error: "Could not create or update MT5 connection" }, { status: 500 });
  }
}

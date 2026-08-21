import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { hashToken } from "@/lib/token";
import { classifySession, tradeDurationMinutes, assessRisk, rMultiple } from "@/lib/analysis";
import { z } from "zod";

const prisma = new PrismaClient();

const TradeSchema = z.object({
  positionId: z.string(),
  openDealId: z.string().nullable(),
  closeDealId: z.string().nullable(),
  status: z.enum(["OPEN", "CLOSED"]),
  symbol: z.string(),
  side: z.enum(["BUY", "SELL"]),
  volume: z.number(),
  entryPrice: z.number(),
  exitPrice: z.number().nullable(),
  stopLoss: z.number().nullable(),
  takeProfit: z.number().nullable(),
  profit: z.number().nullable(),
  commission: z.number().nullable(),

# MT5 Trading Journal — scaffold

Real, working source for the two-connection-method spec: Direct broker API
(when one exists) with automatic fallback to an MT5 Expert Advisor bridge.

## What's here

- `prisma/schema.prisma` — accounts, trades (keyed by MT5 **positionId**, not deal ticket), sync errors
- `lib/analysis.ts` — session classification, duration, 1% risk check
- `lib/token.ts` — bridge connection tokens
- `app/api/mt5/connect` — creates/reconnects an account, decides Direct API vs Bridge
- `app/api/mt5/bridge/sync` — the endpoint the EA posts to
- `app/api/mt5/verify` — sweeps for stale bridge accounts
- `app/mt5/connect` — the 3-step connect wizard
- `app/accounts` — connection health table
- `ea/JournalBridge.mq5` — the MT5 Expert Advisor (read-only, no trading functions)

## Setup

Set DATABASE_URL in your deployment environment, then run prisma migrate to create tables.

## What's not included yet

- No broker Direct-API integrations are wired up yet
- No auth/session layer — placeholder userId only
- No historical-import window picker
- No trades dashboard UI yet, just connection health

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function AccountsPage() {
  const accounts = await prisma.mT5Account.findMany({
    include: { _count: { select: { trades: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main style={{ maxWidth: 960, margin: "60px auto", padding: "0 20px" }}>
      <h1 style={{ fontSize: 22, marginBottom: 20 }}>MT5 Accounts</h1>
      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>Account</th>
              <th>Broker</th>
              <th>Type</th>
              <th>Method</th>
              <th>Status</th>
              <th>Last Sync</th>
              <th>Trades</th>
              <th>Balance</th>
              <th>Equity</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id}>
                <td>{a.label}</td>
                <td>{a.broker}</td>
                <td>{a.accountType}</td>
                <td className="mono">{a.connectionMethod === "DIRECT_API" ? "Direct API" : "MT5 Bridge"}</td>
                <td className={`status-${a.status}`}>{a.status}</td>
                <td className="mono">{a.lastSyncAt ? new Date(a.lastSyncAt).toLocaleTimeString() : "—"}</td>
                <td className="mono">{a._count.trades}</td>
                <td className="mono">{a.balance != null ? `$${a.balance.toFixed(2)}` : "—"}</td>
                <td className="mono">{a.equity != null ? `$${a.equity.toFixed(2)}` : "—"}</td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr><td colSpan={9} style={{ color: "var(--muted)" }}>No MT5 accounts connected yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

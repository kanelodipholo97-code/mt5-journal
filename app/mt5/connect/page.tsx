"use client";

import { useState } from "react";

type AccountType = "DEMO" | "LIVE";

export default function ConnectMT5() {
  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState<AccountType>("DEMO");
  const [broker, setBroker] = useState("");
  const [server, setServer] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [label, setLabel] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

  async function submitConnection() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/mt5/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "current-user",
          label: label || `${broker} ${accountType}`,
          broker,
          server,
          accountNumber,
          accountType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Connection failed");
      setResult(data);
      setStep(3);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyConnection() {
    if (!result?.account?.id) return;
    setVerifying(true);
    try {
      const res = await fetch(`/api/mt5/verify?accountId=${result.account.id}`);
      const data = await res.json();
      setVerifyStatus(data.account ?? null);
    } catch (e: any) {
      setVerifyStatus({ status: "ERROR" });
    } finally {
      setVerifying(false);
    }
  }

  return (
    <main style={{ maxWidth: 560, margin: "60px auto", padding: "0 20px" }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Create MT5 Connection</h1>
      <p style={{ color: "var(--muted)", marginBottom: 28, fontSize: 14 }}>
        Step {step} of 3
      </p>

      {step === 1 && (
        <div className="panel">
          <label style={{ display: "block", marginBottom: 12, fontSize: 13, color: "var(--muted)" }}>
            Account type
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            {(["DEMO", "LIVE"] as AccountType[]).map((t) => (
              <button
                key={t}
                onClick={() => setAccountType(t)}
                style={{
                  flex: 1,
                  background: accountType === t ? "var(--text)" : "transparent",
                  color: accountType === t ? "var(--bg)" : "var(--text)",
                  border: "1px solid var(--border)",
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 20 }}>
            <button onClick={() => setStep(2)}>Next</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="panel" style={{ display: "grid", gap: 12 }}>
          <input placeholder="Label (e.g. 25K Evaluation)" value={label} onChange={(e) => setLabel(e.target.value)} />
          <input placeholder="Broker name" value={broker} onChange={(e) => setBroker(e.target.value)} />
          <input placeholder="Server (e.g. Broker-Live01)" value={server} onChange={(e) => setServer(e.target.value)} />
          <input placeholder="Account number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
          <button onClick={submitConnection} disabled={!broker || !server || !accountNumber || submitting}>
            {submitting ? "Connecting..." : "Continue"}
          </button>
          {error && <p style={{ color: "var(--violation)" }}>{error}</p>}
        </div>
      )}

      {step === 3 && result && (
        <div className="panel">
          {result.method === "DIRECT_API" ? (
            <>
              <p className="tag" style={{ borderColor: "var(--pass)", color: "var(--pass)" }}>
                Direct connection available.
              </p>
              <p style={{ marginTop: 12, fontSize: 14, color: "var(--muted)" }}>
                Continue to broker authentication to finish connecting.
              </p>
            </>
          ) : (
            <>
              <p className="tag" style={{ borderColor: "var(--unknown)", color: "var(--unknown)" }}>
                MT5 Bridge required.
              </p>
              <div style={{ marginTop: 16, fontSize: 14, lineHeight: 1.7 }}>
                <p>Your bridge connection token, shown once. Paste it into the EA input.</p>
                <p className="mono" style={{ wordBreak: "break-all", background: "var(--bg)", padding: 10, borderRadius: 4 }}>
                  {result.bridgeToken}
                </p>
                <ol style={{ color: "var(--muted)", paddingLeft: 18 }}>
                  <li>Open MT5.</li>
                  <li>File then Open Data Folder then MQL5/Experts.</li>
                  <li>Copy JournalBridge.ea into that folder.</li>
                  <li>Restart or refresh MT5.</li>
                  <li>Attach Journal Bridge to any chart.</li>
                  <li>Paste the token above into the EA InpBridgeToken input.</li>
                  <li>Tools then Options then Expert Advisors, allow WebRequest for the journal API domain.</li>
                  <li>Start the bridge, AutoTrading or Algo Trading enabled on the chart.</li>
                  <li>Return here and click Verify MT5 Connection.</li>
                </ol>
                <button onClick={verifyConnection} disabled={verifying}>
                  {verifying ? "Checking..." : "Verify MT5 Connection"}
                </button>
                {verifyStatus && (
                  <p style={{ marginTop: 12 }}>
                    Status: <span className={`status-${verifyStatus.status}`}>{verifyStatus.status}</span>
                    {verifyStatus.status === "CONNECTED" && (
                      <>
                        {" "}Balance: <span className="mono">${verifyStatus.balance?.toFixed(2)}</span>,
                        Equity: <span className="mono">${verifyStatus.equity?.toFixed(2)}</span>
                      </>
                    )}
                    {verifyStatus.status !== "CONNECTED" && (
                      <span style={{ color: "var(--muted)" }}> Waiting for the EA first sync.</span>
                    )}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}

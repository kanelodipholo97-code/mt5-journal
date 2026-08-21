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
          userId: "current-user", // replace with real session user id
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
              <butto

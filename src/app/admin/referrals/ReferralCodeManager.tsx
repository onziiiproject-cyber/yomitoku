"use client";
import { useState } from "react";

interface ReferralCodeRow {
  id: string;
  code: string;
  label: string;
  expiresAt: string | null;
  createdAt: string;
  signupCount: number;
  conversionCount: number;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://yomitoku-base.com";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ja-JP", { year: "numeric", month: "numeric", day: "numeric" });
}

function isExpired(expiresAt: string | null) {
  return !!expiresAt && new Date(expiresAt) < new Date();
}

export default function ReferralCodeManager({ initialCodes }: { initialCodes: ReferralCodeRow[] }) {
  const [codes, setCodes] = useState(initialCodes);
  const [label, setLabel] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function linkFor(code: string) {
    return `${APP_URL}/register?ref=${code}`;
  }
  function qrSrc(code: string) {
    return `/api/admin/referral-codes/${code}/qr`;
  }

  async function handleCreate() {
    if (!label.trim()) {
      setError("キャンペーン名を入力してください");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/admin/referral-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim(), expiresAt: expiresAt || undefined }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        setError(data?.error ?? "エラーが発生しました");
        return;
      }
      setCodes((prev) => [{ ...data, signupCount: 0, conversionCount: 0 }, ...prev]);
      setLabel("");
      setExpiresAt("");
    } catch {
      setError("エラーが発生しました");
    } finally {
      setCreating(false);
    }
  }

  async function handleCopy(id: string, code: string) {
    await navigator.clipboard.writeText(linkFor(code));
    setCopiedId(id);
    setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1500);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E8F0EE", padding: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#1F2E2A", margin: "0 0 12px" }}>新しいキャンペーンコードを発行</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="キャンペーン名（例：〇〇協会加盟者用）"
            maxLength={50}
            style={{ flex: "2 1 240px", minWidth: 0, padding: "9px 12px", border: "1.5px solid #D0E8E4", borderRadius: 8, fontSize: 13, outline: "none" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: "1 1 180px" }}>
            <label style={{ fontSize: 12, color: "#888", whiteSpace: "nowrap" }}>有効期限（任意）</label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              style={{ flex: 1, minWidth: 0, padding: "8px 10px", border: "1.5px solid #D0E8E4", borderRadius: 8, fontSize: 13, outline: "none" }}
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={creating}
            style={{
              flexShrink: 0, background: creating ? "#ccc" : "#0D686E", color: "#fff", border: "none",
              borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: creating ? "not-allowed" : "pointer",
            }}
          >
            {creating ? "発行中..." : "発行する"}
          </button>
        </div>
        {error && <p style={{ fontSize: 12, color: "#DC2626", marginTop: 8, marginBottom: 0 }}>{error}</p>}
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E8F0EE", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#F5F7F6", borderBottom: "1.5px solid #E8F0EE" }}>
              {["QR", "発行日", "キャンペーン名", "リンク", "有効期限", "登録数", "有効数", ""].map((h) => (
                <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#555", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {codes.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: "48px", textAlign: "center", color: "#aaa" }}>紹介コードはまだ発行されていません</td>
              </tr>
            ) : (
              codes.map((c, i) => {
                const expired = isExpired(c.expiresAt);
                return (
                  <tr key={c.id} style={{ borderBottom: i < codes.length - 1 ? "1px solid #F0F0F0" : "none", opacity: expired ? 0.5 : 1 }}>
                    <td style={{ padding: "10px 14px" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrSrc(c.code)} alt="" width={48} height={48} style={{ display: "block", borderRadius: 4, border: "1px solid #E8F0EE" }} />
                    </td>
                    <td style={{ padding: "14px", color: "#888", whiteSpace: "nowrap" }}>{formatDate(c.createdAt)}</td>
                    <td style={{ padding: "14px", color: "#333" }}>{c.label}</td>
                    <td style={{ padding: "14px", color: "#1a1a1a", fontFamily: "monospace", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {linkFor(c.code)}
                    </td>
                    <td style={{ padding: "14px", whiteSpace: "nowrap" }}>
                      {c.expiresAt ? (
                        <span style={{ color: expired ? "#DC2626" : "#555" }}>
                          {formatDate(c.expiresAt)}{expired ? "（期限切れ）" : ""}
                        </span>
                      ) : (
                        <span style={{ color: "#aaa" }}>無期限</span>
                      )}
                    </td>
                    <td style={{ padding: "14px", color: "#1a1a1a", fontWeight: 700 }}>{c.signupCount}</td>
                    <td style={{ padding: "14px" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: c.conversionCount > 0 ? "#0D686E" : "#aaa" }}>{c.conversionCount}</span>
                    </td>
                    <td style={{ padding: "14px" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button
                          onClick={() => handleCopy(c.id, c.code)}
                          style={{
                            fontSize: 12, fontWeight: 700, padding: "5px 10px", borderRadius: 6,
                            border: "1.5px solid #0D686E", background: copiedId === c.id ? "#0D686E" : "#fff",
                            color: copiedId === c.id ? "#fff" : "#0D686E", cursor: "pointer", whiteSpace: "nowrap",
                          }}
                        >
                          {copiedId === c.id ? "コピーしました" : "リンクをコピー"}
                        </button>
                        <a
                          href={`${qrSrc(c.code)}?download=1`}
                          download={`referral-${c.code}.png`}
                          style={{
                            fontSize: 12, fontWeight: 700, padding: "5px 10px", borderRadius: 6,
                            border: "1.5px solid #D0E8E4", color: "#555", textDecoration: "none", whiteSpace: "nowrap",
                          }}
                        >
                          QRを保存
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

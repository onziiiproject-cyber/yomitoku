"use client";
import { useState } from "react";

interface ReferralCodeRow {
  id: string;
  code: string;
  label: string;
  expiresAt: string | null;
  isAmbassador: boolean;
  disabledAt: string | null;
  createdAt: string;
  visitCount: number;
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
  const [customCode, setCustomCode] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isAmbassador, setIsAmbassador] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [copiedLpId, setCopiedLpId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  function linkFor(code: string) {
    return `${APP_URL}/register?ref=${code}`;
  }
  function lpLinkFor(code: string) {
    return `${APP_URL}/lp/${code}`;
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
        body: JSON.stringify({ label: label.trim(), expiresAt: expiresAt || undefined, isAmbassador, code: customCode.trim() || undefined }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        setError(data?.error ?? "エラーが発生しました");
        return;
      }
      setCodes((prev) => [{ ...data, visitCount: 0, signupCount: 0, conversionCount: 0 }, ...prev]);
      setLabel("");
      setCustomCode("");
      setExpiresAt("");
      setIsAmbassador(false);
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

  async function handleCopyCode(id: string, code: string) {
    await navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId((cur) => (cur === id ? null : cur)), 1500);
  }

  async function handleCopyLp(id: string, code: string) {
    await navigator.clipboard.writeText(lpLinkFor(code));
    setCopiedLpId(id);
    setTimeout(() => setCopiedLpId((cur) => (cur === id ? null : cur)), 1500);
  }

  async function handleToggleDisable(id: string, code: string, currentlyDisabled: boolean) {
    const confirmed = window.confirm(
      currentlyDisabled
        ? `コード「${code}」を再度有効化しますか？`
        : `コード「${code}」を無効化しますか？\nこのコードでの新規登録・30日無料の適用ができなくなります。`
    );
    if (!confirmed) return;

    setTogglingId(id);
    try {
      const res = await fetch(`/api/admin/referral-codes/${code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled: !currentlyDisabled }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        alert(data?.error ?? "エラーが発生しました");
        return;
      }
      setCodes((prev) => prev.map((c) => (c.id === id ? { ...c, disabledAt: data.disabledAt } : c)));
    } catch {
      alert("エラーが発生しました");
    } finally {
      setTogglingId(null);
    }
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
          <input
            value={customCode}
            onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
            placeholder="コード（任意・空欄で自動生成）"
            maxLength={20}
            style={{ flex: "1 1 200px", minWidth: 0, padding: "9px 12px", border: "1.5px solid #D0E8E4", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "monospace" }}
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
        <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 12, color: "#555", cursor: "pointer" }}>
          <input type="checkbox" checked={isAmbassador} onChange={(e) => setIsAmbassador(e.target.checked)} />
          アンバサダー用登録（決済不要・即アクティブ化）
        </label>
        <p style={{ fontSize: 12, color: "#888", marginTop: 8, marginBottom: 0 }}>
          コードは登録フォームで手入力もできます。SNS投稿や動画で口頭紹介する場合はリンクの代わりにコードを伝えてください。
        </p>
        {error && <p style={{ fontSize: 12, color: "#DC2626", marginTop: 8, marginBottom: 0 }}>{error}</p>}
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E8F0EE", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", minWidth: 900, borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#F5F7F6", borderBottom: "1.5px solid #E8F0EE" }}>
              {["QR", "発行日", "キャンペーン名", "コード", "リンク", "有効期限", "アクセス数", "登録数", "有効数", ""].map((h) => (
                <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#555", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {codes.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ padding: "48px", textAlign: "center", color: "#aaa" }}>紹介コードはまだ発行されていません</td>
              </tr>
            ) : (
              codes.map((c, i) => {
                const expired = isExpired(c.expiresAt);
                const disabled = !!c.disabledAt;
                return (
                  <tr key={c.id} style={{ borderBottom: i < codes.length - 1 ? "1px solid #F0F0F0" : "none", opacity: expired || disabled ? 0.5 : 1 }}>
                    <td style={{ padding: "10px 14px" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrSrc(c.code)} alt="" width={48} height={48} style={{ display: "block", borderRadius: 4, border: "1px solid #E8F0EE" }} />
                    </td>
                    <td style={{ padding: "14px", color: "#888", whiteSpace: "nowrap" }}>{formatDate(c.createdAt)}</td>
                    <td style={{ padding: "14px", color: "#333" }}>
                      {c.label}
                      {c.isAmbassador && (
                        <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: "#7C3AED", background: "#F3E8FF", padding: "2px 7px", borderRadius: 10 }}>
                          アンバサダー
                        </span>
                      )}
                      {disabled && (
                        <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: "#DC2626", background: "#FEE2E2", padding: "2px 7px", borderRadius: 10 }}>
                          無効化済み
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "14px" }}>
                      <button
                        onClick={() => handleCopyCode(c.id, c.code)}
                        style={{
                          fontFamily: "monospace", fontSize: 13, fontWeight: 700, padding: "5px 10px", borderRadius: 6,
                          border: "1.5px solid #0D686E", background: copiedCodeId === c.id ? "#0D686E" : "#fff",
                          color: copiedCodeId === c.id ? "#fff" : "#0D686E", cursor: "pointer", whiteSpace: "nowrap",
                        }}
                      >
                        {copiedCodeId === c.id ? "コピーしました" : c.code}
                      </button>
                    </td>
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
                    <td style={{ padding: "14px", color: "#555" }}>{c.visitCount.toLocaleString()}</td>
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
                        <button
                          onClick={() => handleCopyLp(c.id, c.code)}
                          style={{
                            fontSize: 12, fontWeight: 700, padding: "5px 10px", borderRadius: 6,
                            border: "1.5px solid #7C3AED", background: copiedLpId === c.id ? "#7C3AED" : "#fff",
                            color: copiedLpId === c.id ? "#fff" : "#7C3AED", cursor: "pointer", whiteSpace: "nowrap",
                          }}
                        >
                          {copiedLpId === c.id ? "コピーしました" : "LPリンクをコピー"}
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
                        <button
                          onClick={() => handleToggleDisable(c.id, c.code, disabled)}
                          disabled={togglingId === c.id}
                          style={{
                            fontSize: 12, fontWeight: 700, padding: "5px 10px", borderRadius: 6,
                            border: disabled ? "1.5px solid #0D686E" : "1.5px solid #DC2626",
                            background: "#fff", color: disabled ? "#0D686E" : "#DC2626",
                            cursor: togglingId === c.id ? "not-allowed" : "pointer", whiteSpace: "nowrap",
                          }}
                        >
                          {togglingId === c.id ? "処理中..." : disabled ? "有効化する" : "無効化する"}
                        </button>
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

"use client";
import { useState } from "react";

interface AdRow {
  id: string;
  advertiserName: string;
  imageUrl: string;
  linkUrl: string;
  placement: "SIDEBAR" | "FEED";
  startAt: string | null;
  endAt: string | null;
  disabledAt: string | null;
  impressions: number;
  clicks: number;
  createdAt: string;
}

const PLACEMENT_LABEL: Record<AdRow["placement"], string> = {
  SIDEBAR: "①右サイドバー下部",
  FEED: "②タイムライン（カード紛れ込み）",
};

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("ja-JP", { year: "numeric", month: "numeric", day: "numeric" });
}

function isExpired(endAt: string | null) {
  return !!endAt && new Date(endAt) < new Date();
}

export default function AdManager({ initialAds }: { initialAds: AdRow[] }) {
  const [ads, setAds] = useState(initialAds);
  const [advertiserName, setAdvertiserName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [placement, setPlacement] = useState<AdRow["placement"]>("SIDEBAR");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCreate() {
    if (!advertiserName.trim()) return setError("広告主名を入力してください");
    if (!linkUrl.trim()) return setError("リンク先URLを入力してください");
    if (!file) return setError("画像を選択してください");

    setCreating(true);
    setError("");
    try {
      const form = new FormData();
      form.set("advertiserName", advertiserName.trim());
      form.set("linkUrl", linkUrl.trim());
      form.set("placement", placement);
      if (startAt) form.set("startAt", startAt);
      if (endAt) form.set("endAt", endAt);
      form.set("file", file);

      const res = await fetch("/api/admin/ads", { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        setError(data?.error ?? "エラーが発生しました");
        return;
      }
      setAds((prev) => [
        {
          id: data.id,
          advertiserName: data.advertiserName,
          imageUrl: data.imageUrl,
          linkUrl: data.linkUrl,
          placement: data.placement,
          startAt: data.startAt,
          endAt: data.endAt,
          disabledAt: data.disabledAt,
          impressions: 0,
          clicks: 0,
          createdAt: data.createdAt,
        },
        ...prev,
      ]);
      setAdvertiserName("");
      setLinkUrl("");
      setStartAt("");
      setEndAt("");
      setFile(null);
    } catch {
      setError("エラーが発生しました");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleDisable(id: string, name: string, currentlyDisabled: boolean) {
    const confirmed = window.confirm(
      currentlyDisabled ? `「${name}」を再度掲載しますか？` : `「${name}」を停止しますか？`
    );
    if (!confirmed) return;

    setTogglingId(id);
    try {
      const res = await fetch(`/api/admin/ads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled: !currentlyDisabled }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        alert(data?.error ?? "エラーが発生しました");
        return;
      }
      setAds((prev) => prev.map((a) => (a.id === id ? { ...a, disabledAt: data.disabledAt } : a)));
    } catch {
      alert("エラーが発生しました");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string, name: string) {
    const confirmed = window.confirm(`「${name}」を完全に削除しますか？この操作は取り消せません。`);
    if (!confirmed) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/ads/${id}`, { method: "DELETE" });
      if (!res.ok) {
        alert("エラーが発生しました");
        return;
      }
      setAds((prev) => prev.filter((a) => a.id !== id));
    } catch {
      alert("エラーが発生しました");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E8F0EE", padding: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#1F2E2A", margin: "0 0 12px" }}>新しい広告を掲載</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            value={advertiserName}
            onChange={(e) => setAdvertiserName(e.target.value)}
            placeholder="広告主名（社内管理用）"
            maxLength={100}
            style={{ flex: "1 1 220px", minWidth: 0, padding: "9px 12px", border: "1.5px solid #D0E8E4", borderRadius: 8, fontSize: 13, outline: "none" }}
          />
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="リンク先URL（https://...）"
            style={{ flex: "2 1 260px", minWidth: 0, padding: "9px 12px", border: "1.5px solid #D0E8E4", borderRadius: 8, fontSize: 13, outline: "none" }}
          />
          <select
            value={placement}
            onChange={(e) => setPlacement(e.target.value as AdRow["placement"])}
            style={{ flex: "1 1 200px", minWidth: 0, padding: "9px 12px", border: "1.5px solid #D0E8E4", borderRadius: 8, fontSize: 13, outline: "none", background: "#fff" }}
          >
            <option value="SIDEBAR">{PLACEMENT_LABEL.SIDEBAR}</option>
            <option value="FEED">{PLACEMENT_LABEL.FEED}</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: "1 1 200px" }}>
            <label style={{ fontSize: 12, color: "#888", whiteSpace: "nowrap" }}>開始日（任意）</label>
            <input type="date" value={startAt} onChange={(e) => setStartAt(e.target.value)} style={{ flex: 1, minWidth: 0, padding: "8px 10px", border: "1.5px solid #D0E8E4", borderRadius: 8, fontSize: 13, outline: "none" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: "1 1 200px" }}>
            <label style={{ fontSize: 12, color: "#888", whiteSpace: "nowrap" }}>終了日（任意）</label>
            <input type="date" value={endAt} onChange={(e) => setEndAt(e.target.value)} style={{ flex: 1, minWidth: 0, padding: "8px 10px", border: "1.5px solid #D0E8E4", borderRadius: 8, fontSize: 13, outline: "none" }} />
          </div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            style={{ flex: "1 1 220px", minWidth: 0, fontSize: 13 }}
          />
          <button
            onClick={handleCreate}
            disabled={creating}
            style={{
              flexShrink: 0, background: creating ? "#ccc" : "#0D686E", color: "#fff", border: "none",
              borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: creating ? "not-allowed" : "pointer",
            }}
          >
            {creating ? "掲載中..." : "掲載する"}
          </button>
        </div>
        <p style={{ fontSize: 12, color: "#888", marginTop: 8, marginBottom: 0 }}>
          ①は横長バナー、②はフィードのカードと同じ縦長比率の画像を推奨します。
        </p>
        {error && <p style={{ fontSize: 12, color: "#DC2626", marginTop: 8, marginBottom: 0 }}>{error}</p>}
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E8F0EE", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", minWidth: 960, borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#F5F7F6", borderBottom: "1.5px solid #E8F0EE" }}>
              {["画像", "広告主", "掲載枠", "期間", "表示数", "クリック数", ""].map((h) => (
                <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#555", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ads.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "48px", textAlign: "center", color: "#aaa" }}>広告はまだ掲載されていません</td>
              </tr>
            ) : (
              ads.map((a, i) => {
                const expired = isExpired(a.endAt);
                const disabled = !!a.disabledAt;
                return (
                  <tr key={a.id} style={{ borderBottom: i < ads.length - 1 ? "1px solid #F0F0F0" : "none", opacity: expired || disabled ? 0.5 : 1 }}>
                    <td style={{ padding: "10px 14px" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a.imageUrl} alt="" style={{ display: "block", width: 64, height: 40, objectFit: "cover", borderRadius: 4, border: "1px solid #E8F0EE" }} />
                    </td>
                    <td style={{ padding: "14px", color: "#333" }}>
                      {a.advertiserName}
                      {disabled && (
                        <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: "#DC2626", background: "#FEE2E2", padding: "2px 7px", borderRadius: 10 }}>
                          停止中
                        </span>
                      )}
                      {!disabled && expired && (
                        <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: "#B45309", background: "#FEF3C7", padding: "2px 7px", borderRadius: 10 }}>
                          期限切れ
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "14px", color: "#555", whiteSpace: "nowrap" }}>{PLACEMENT_LABEL[a.placement]}</td>
                    <td style={{ padding: "14px", color: "#555", whiteSpace: "nowrap" }}>
                      {a.startAt ? formatDate(a.startAt) : "即時"} 〜 {a.endAt ? formatDate(a.endAt) : "無期限"}
                    </td>
                    <td style={{ padding: "14px", color: "#1a1a1a", fontWeight: 700 }}>{a.impressions.toLocaleString()}</td>
                    <td style={{ padding: "14px", color: "#1a1a1a", fontWeight: 700 }}>{a.clicks.toLocaleString()}</td>
                    <td style={{ padding: "14px" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button
                          onClick={() => handleToggleDisable(a.id, a.advertiserName, disabled)}
                          disabled={togglingId === a.id}
                          style={{
                            fontSize: 12, fontWeight: 700, padding: "5px 10px", borderRadius: 6,
                            border: disabled ? "1.5px solid #0D686E" : "1.5px solid #DC2626",
                            background: "#fff", color: disabled ? "#0D686E" : "#DC2626",
                            cursor: togglingId === a.id ? "not-allowed" : "pointer", whiteSpace: "nowrap",
                          }}
                        >
                          {togglingId === a.id ? "処理中..." : disabled ? "掲載再開" : "停止する"}
                        </button>
                        <button
                          onClick={() => handleDelete(a.id, a.advertiserName)}
                          disabled={deletingId === a.id}
                          style={{
                            fontSize: 12, fontWeight: 700, padding: "5px 10px", borderRadius: 6,
                            border: "1.5px solid #D0E8E4", background: "#fff", color: "#888",
                            cursor: deletingId === a.id ? "not-allowed" : "pointer", whiteSpace: "nowrap",
                          }}
                        >
                          {deletingId === a.id ? "削除中..." : "削除"}
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

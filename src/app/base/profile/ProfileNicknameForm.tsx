"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileNicknameForm({
  initialNickname,
  editable,
}: {
  initialNickname: string;
  editable: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialNickname);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    const res = await fetch("/api/base/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: value }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "エラーが発生しました");
      return;
    }
    setEditing(false);
    router.refresh();
  }

  if (!editable) {
    return <p style={{ fontSize: 20, fontWeight: 800, color: "#1B5E52", margin: 0 }}>{initialNickname}</p>;
  }

  if (!editing) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <p style={{ fontSize: 20, fontWeight: 800, color: "#1B5E52", margin: 0 }}>{initialNickname}</p>
        <button
          onClick={() => setEditing(true)}
          style={{ fontSize: 12, color: "#0D686E", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 700 }}
        >
          編集
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 260 }}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={20}
        autoFocus
        style={{ padding: "8px 12px", border: "1.5px solid #D0E8E4", borderRadius: 8, fontSize: 15, outline: "none" }}
      />
      {error && <p style={{ fontSize: 12, color: "#DC2626", margin: 0 }}>{error}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={save}
          disabled={saving}
          style={{ background: "#0D686E", color: "#fff", border: "none", borderRadius: 8, padding: "6px 16px", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}
        >
          {saving ? "保存中..." : "保存"}
        </button>
        <button
          onClick={() => { setEditing(false); setValue(initialNickname); setError(""); }}
          style={{ background: "none", border: "1.5px solid #D0E8E4", borderRadius: 8, padding: "6px 16px", fontSize: 13, fontWeight: 600, color: "#666", cursor: "pointer" }}
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}

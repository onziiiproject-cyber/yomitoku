"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ProfileAvatar from "../_components/ProfileAvatar";

export default function WhoAmIPicker({ users }: { users: { id: string; name: string; linked: boolean; iconKey: string | null; iconUrl: string | null }[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showNewForm, setShowNewForm] = useState(users.length === 0);
  const [newName, setNewName] = useState("");

  async function submit(body: { userId: string } | { newName: string }) {
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/select-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      setError("エラーが発生しました。もう一度お試しください");
      setLoading(false);
      return;
    }
    router.push("/base");
    router.refresh();
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    submit({ newName: newName.trim() });
  }

  return (
    <div>
      {users.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: showNewForm ? 20 : 0 }}>
          {users.map((u) => (
            <button
              key={u.id}
              onClick={() => submit({ userId: u.id })}
              disabled={loading}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                background: "#F7FAF9", border: "1.5px solid #E8F0EE", borderRadius: 12,
                padding: "12px 16px", cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                textAlign: "left", width: "100%",
              }}
            >
              <ProfileAvatar name={u.name} iconKey={u.iconKey} iconUrl={u.iconUrl} size={44} />
              <span style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name}</span>
              {u.linked && (
                <span style={{ fontSize: 10, color: "#06C755", fontWeight: 700, flexShrink: 0, whiteSpace: "nowrap" }}>LINE連携済み</span>
              )}
            </button>
          ))}
        </div>
      )}

      {!showNewForm ? (
        <button
          onClick={() => setShowNewForm(true)}
          disabled={loading}
          style={{
            display: "block", width: "100%", textAlign: "center",
            background: "none", border: "none", padding: "6px 0",
            fontSize: 13, color: "#9BB5B0", fontWeight: 600, cursor: "pointer",
          }}
        >
          この中に自分はいません
        </button>
      ) : (
        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 12, color: "#888", margin: 0 }}>お名前（ニックネーム）を入力してください</p>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={20}
            placeholder="例）たなか"
            autoFocus
            style={{ padding: "10px 14px", border: "1.5px solid #D0E8E4", borderRadius: 10, fontSize: 15, outline: "none" }}
          />
          <button
            type="submit"
            disabled={loading || !newName.trim()}
            style={{
              background: loading || !newName.trim() ? "#ccc" : "#0D686E", color: "#fff", border: "none",
              borderRadius: 10, padding: "10px 16px", fontSize: 14, fontWeight: 700,
              cursor: loading || !newName.trim() ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "登録中..." : "この名前で始める"}
          </button>
        </form>
      )}

      {error && <p style={{ fontSize: 13, color: "#DC2626", marginTop: 12, textAlign: "center" }}>{error}</p>}
    </div>
  );
}

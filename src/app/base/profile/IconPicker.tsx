"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import ProfileAvatar, { PROFILE_ICONS } from "../_components/ProfileAvatar";

export default function IconPicker({
  name,
  initialIconKey,
  initialIconUrl,
  editable,
}: {
  name: string;
  initialIconKey: string | null;
  initialIconUrl: string | null;
  editable: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [iconKey, setIconKey] = useState(initialIconKey);
  const [iconUrl, setIconUrl] = useState(initialIconUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function selectPreset(key: string) {
    setSaving(true);
    setError("");
    const res = await fetch("/api/base/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ iconKey: key }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "エラーが発生しました");
      return;
    }
    setIconKey(data.iconKey);
    setIconUrl(null);
    setOpen(false);
    router.refresh();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/base/profile/icon", { method: "POST", body: form });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "エラーが発生しました");
      return;
    }
    setIconUrl(data.iconUrl);
    setIconKey(null);
    setOpen(false);
    router.refresh();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (!editable) {
    return <ProfileAvatar name={name} iconKey={iconKey} iconUrl={iconUrl} size={64} />;
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", position: "relative", display: "block" }}
        aria-label="アイコンを変更"
      >
        <ProfileAvatar name={name} iconKey={iconKey} iconUrl={iconUrl} size={64} />
        <div style={{
          position: "absolute", bottom: -2, right: -2, width: 22, height: 22, borderRadius: "50%",
          background: "#0D686E", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>
          </svg>
        </div>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 10px)", left: 0, zIndex: 20,
          background: "#fff", borderRadius: 14, border: "1.5px solid #E8F0EE",
          boxShadow: "0 12px 32px rgba(0,0,0,0.14)", padding: 16, width: 260,
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 10 }}>プリセットから選ぶ</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 14 }}>
            {PROFILE_ICONS.map((icon) => (
              <button
                key={icon.key}
                onClick={() => selectPreset(icon.key)}
                disabled={saving}
                style={{
                  width: 40, height: 40, borderRadius: "50%", background: icon.bg,
                  border: iconKey === icon.key ? "2px solid #0D686E" : "2px solid transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, cursor: saving ? "not-allowed" : "pointer", padding: 0,
                }}
              >
                {icon.emoji}
              </button>
            ))}
          </div>
          <label style={{
            display: "block", textAlign: "center", fontSize: 13, fontWeight: 700, color: "#0D686E",
            border: "1.5px dashed #D0E8E4", borderRadius: 10, padding: "10px 0", cursor: "pointer",
          }}>
            画像をアップロード
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              disabled={saving}
              style={{ display: "none" }}
            />
          </label>
          <p style={{ fontSize: 10, color: "#aaa", marginTop: 6, marginBottom: 0 }}>jpg・png・webp / 2MBまで</p>
          {error && <p style={{ fontSize: 11, color: "#DC2626", marginTop: 8, marginBottom: 0 }}>{error}</p>}
          <button
            onClick={() => setOpen(false)}
            style={{ display: "block", width: "100%", marginTop: 10, background: "none", border: "none", fontSize: 12, color: "#888", cursor: "pointer", padding: "4px 0" }}
          >
            閉じる
          </button>
        </div>
      )}
    </div>
  );
}

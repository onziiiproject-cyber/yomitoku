"use client";
import { useState } from "react";

interface TagItem {
  key: string;
  label: string;
}

export default function TagPreferenceEditor({
  groups,
  initialSelectedKeys,
}: {
  groups: { label: string; tags: TagItem[] }[];
  initialSelectedKeys: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelectedKeys));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function toggle(key: string) {
    setSaved(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    const res = await fetch("/api/base/tags", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagKeys: [...selected] }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("保存に失敗しました。もう一度お試しください");
      return;
    }
    setSaved(true);
  }

  return (
    <div>
      {groups.map((group) => (
        <div key={group.label} style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#6B8A85", margin: "0 0 8px" }}>{group.label}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {group.tags.map((tag) => {
              const isSelected = selected.has(tag.key);
              return (
                <button
                  key={tag.key}
                  onClick={() => toggle(tag.key)}
                  style={{
                    fontSize: 13,
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? "#fff" : "#374151",
                    background: isSelected ? "#0D686E" : "#fff",
                    border: `1.5px solid ${isSelected ? "#0D686E" : "#D5E8E5"}`,
                    borderRadius: 20,
                    padding: "6px 14px",
                    cursor: "pointer",
                  }}
                >
                  # {tag.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: saving ? "#ccc" : "#0D686E", color: "#fff", border: "none",
            borderRadius: 10, padding: "10px 24px", fontSize: 14, fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "保存中..." : "保存する"}
        </button>
        {saved && <span style={{ fontSize: 13, color: "#0D686E", fontWeight: 700 }}>保存しました！LINEの設定にも反映されます</span>}
        {error && <span style={{ fontSize: 13, color: "#DC2626" }}>{error}</span>}
      </div>
    </div>
  );
}

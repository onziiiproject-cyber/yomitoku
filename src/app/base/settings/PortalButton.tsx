"use client";
import { useState } from "react";

export default function PortalButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/base/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("ポータルの開設に失敗しました。しばらく後でお試しください。");
        setLoading(false);
      }
    } catch {
      alert("エラーが発生しました。");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        marginTop: 16,
        width: "100%",
        height: 44,
        background: loading ? "#ccc" : "#fff",
        color: loading ? "#fff" : "#1B5E52",
        border: "1.5px solid #1B5E52",
        borderRadius: 10,
        fontSize: 14,
        fontWeight: 700,
        cursor: loading ? "not-allowed" : "pointer",
      }}
    >
      {loading ? "読み込み中..." : "解約・お支払い方法の変更はこちら →"}
    </button>
  );
}

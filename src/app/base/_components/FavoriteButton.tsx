"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FavoriteButton({
  docId,
  initialFavorited,
  isLoggedIn,
  size = "md",
}: {
  docId: string;
  initialFavorited: boolean;
  isLoggedIn: boolean;
  size?: "sm" | "md";
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      router.push("/base/login");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/base/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId }),
      });
      const data = await res.json();
      if (res.ok) setFavorited(data.favorited);
    } finally {
      setLoading(false);
    }
  }

  const iconSize = size === "sm" ? 16 : 20;

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={favorited ? "お気に入りから削除" : "お気に入りに追加"}
      style={{
        background: favorited ? "#FEF3C7" : "transparent",
        border: favorited ? "1.5px solid #F5A623" : "1.5px solid #D1E8E4",
        borderRadius: 8,
        padding: size === "sm" ? "4px 8px" : "6px 12px",
        cursor: loading ? "wait" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: size === "sm" ? 11 : 13,
        fontWeight: 600,
        color: favorited ? "#92400E" : "#6B9E96",
        flexShrink: 0,
        transition: "all 0.15s",
      }}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill={favorited ? "#F5A623" : "none"}
        stroke={favorited ? "#F5A623" : "#6B9E96"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
      </svg>
      {size === "md" && (favorited ? "保存済み" : "保存")}
    </button>
  );
}

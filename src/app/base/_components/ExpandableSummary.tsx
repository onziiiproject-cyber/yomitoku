"use client";
import { useState } from "react";

export default function ExpandableSummary({ text, isLoggedIn }: { text: string; isLoggedIn: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <p
        style={{
          fontSize: 13,
          color: "#444",
          lineHeight: 1.7,
          margin: 0,
          display: expanded ? "block" : "-webkit-box",
          WebkitLineClamp: expanded ? undefined : 2,
          WebkitBoxOrient: expanded ? undefined : "vertical",
          overflow: expanded ? "visible" : "hidden",
          whiteSpace: "pre-wrap",
        }}
      >
        {text}
      </p>
      {isLoggedIn && (
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            marginTop: 4,
            fontSize: 12,
            fontWeight: 700,
            color: "#9BB5B0",
            cursor: "pointer",
          }}
        >
          {expanded ? "閉じる" : "続きを読む"}
        </button>
      )}
    </div>
  );
}

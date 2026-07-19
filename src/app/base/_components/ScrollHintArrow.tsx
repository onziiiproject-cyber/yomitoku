"use client";

export default function ScrollHintArrow() {
  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const article = e.currentTarget.closest("article");
    const next = article?.nextElementSibling;
    if (next instanceof HTMLElement) {
      next.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div
      onClick={handleClick}
      className="scroll-hint-gutter scroll-hint-bounce"
      style={{
        position: "absolute",
        right: -78,
        top: 240,
        transform: "translateY(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        cursor: "pointer",
        zIndex: 3,
      }}
    >
      <span style={{
        transform: "rotate(-90deg)",
        transformOrigin: "center",
        fontSize: 11,
        color: "#9BB5B0",
        letterSpacing: "0.08em",
        whiteSpace: "nowrap",
        marginBottom: 14,
      }}>
        Scroll
      </span>
      <div style={{ width: 1, height: 44, background: "#9BB5B0" }} />
      <svg width="12" height="8" viewBox="0 0 12 8" fill="none" style={{ marginTop: -1 }}>
        <path d="M1 1L6 7L11 1" stroke="#9BB5B0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

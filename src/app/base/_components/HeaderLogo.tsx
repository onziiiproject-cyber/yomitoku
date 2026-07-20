import Image from "next/image";

export default function HeaderLogo() {
  return (
    <a href="/base" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
      <Image
        src="/icons/icon-gori-editor.jpg"
        alt=""
        width={200}
        height={200}
        priority
        style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
      <span className="header-logo-text" style={{ fontSize: 16, fontWeight: 800, color: "#1F2E2A", whiteSpace: "nowrap" }}>ヨミトク編集部</span>
    </a>
  );
}

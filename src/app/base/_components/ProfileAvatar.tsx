import Image from "next/image";

export const PROFILE_ICONS: { key: string; emoji: string; bg: string }[] = [
  { key: "leaf", emoji: "🌿", bg: "#DCEEE3" },
  { key: "flower", emoji: "🌸", bg: "#FBE3EC" },
  { key: "sun", emoji: "☀️", bg: "#FDF0D5" },
  { key: "star", emoji: "⭐", bg: "#FFF3CC" },
  { key: "heart", emoji: "❤️", bg: "#FBE0E0" },
  { key: "cat", emoji: "🐱", bg: "#EDE7F6" },
  { key: "dog", emoji: "🐶", bg: "#F5E6D8" },
  { key: "coffee", emoji: "☕", bg: "#E8DCCB" },
  { key: "book", emoji: "📚", bg: "#DCE6F5" },
  { key: "moon", emoji: "🌙", bg: "#E2E8F0" },
];

export default function ProfileAvatar({
  name,
  iconKey,
  iconUrl,
  size = 38,
}: {
  name: string;
  iconKey?: string | null;
  iconUrl?: string | null;
  size?: number;
}) {
  if (iconUrl) {
    return (
      <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
        <Image src={iconUrl} alt="" width={size} height={size} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }

  const preset = iconKey ? PROFILE_ICONS.find((i) => i.key === iconKey) : null;
  if (preset) {
    return (
      <div style={{
        width: size, height: size, borderRadius: "50%", background: preset.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, fontSize: size * 0.55, lineHeight: 1,
      }}>
        {preset.emoji}
      </div>
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, #0D686E, #1B9C8E)",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, fontWeight: 800, fontSize: size * 0.4, color: "#fff",
    }}>
      {name?.[0] ?? "?"}
    </div>
  );
}

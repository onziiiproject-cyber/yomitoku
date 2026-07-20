import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import WhoAmIPicker from "./WhoAmIPicker";

export default async function WhoAmIPage() {
  const session = await getSession();
  if (!session) redirect("/base/login");
  if (session.userId) redirect("/base");

  const users = await prisma.user.findMany({
    where: { companyId: session.companyId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, lineRecipientId: true, iconKey: true, iconUrl: true },
  });

  return (
    <div style={{ minHeight: "100vh", background: "#F7FAF9", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 420, background: "#fff", borderRadius: 20, padding: "40px 32px", boxShadow: "0 20px 60px rgba(13,104,110,0.1)" }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1B5E52", textAlign: "center", margin: "0 0 8px" }}>
          あなたはどなたですか？
        </h1>
        <p style={{ fontSize: 13, color: "#888", textAlign: "center", margin: "0 0 28px" }}>
          {session.companyName} に登録されているメンバーから選んでください
        </p>
        <WhoAmIPicker
          users={users.map((u) => ({ id: u.id, name: u.name, linked: !!u.lineRecipientId, iconKey: u.iconKey, iconUrl: u.iconUrl }))}
        />
      </div>
    </div>
  );
}

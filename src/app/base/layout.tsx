import { getSession } from "@/lib/auth";
import BaseHeader from "./_components/BaseHeader";

export default async function BaseLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <div style={{ minHeight: "100vh", background: "#F7FAF9", fontFamily: "sans-serif" }}>
      {session && <BaseHeader companyName={session.companyName} />}
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "0 16px 80px" }}>
        {children}
      </main>
    </div>
  );
}

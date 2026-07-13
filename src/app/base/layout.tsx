import { getSession } from "@/lib/auth";
import BaseHeader from "./_components/BaseHeader";
import LeftSidebar from "./_components/LeftSidebar";
import RightSidebar from "./_components/RightSidebar";
import { Suspense } from "react";

export default async function BaseLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) return <>{children}</>;

  return (
    <div style={{ minHeight: "100vh", background: "#F5F7F6", fontFamily: "sans-serif" }}>
      <BaseHeader companyName={session.companyName} />
      <div style={{ display: "flex" }}>
        <Suspense fallback={<div style={{ width: 210, flexShrink: 0 }} />}>
          <LeftSidebar />
        </Suspense>
        <main style={{ flex: 1, minWidth: 0, padding: "24px 20px", overflowX: "hidden" }}>
          {children}
        </main>
        <Suspense fallback={<div style={{ width: 280, flexShrink: 0 }} />}>
          <RightSidebar />
        </Suspense>
      </div>
    </div>
  );
}

import { getSession } from "@/lib/auth";
import BaseHeader from "./_components/BaseHeader";
import GuestHeader from "./_components/GuestHeader";
import LeftSidebar from "./_components/LeftSidebar";
import RightSidebar from "./_components/RightSidebar";
import LayoutShell from "./_components/LayoutShell";
import { Suspense } from "react";

export default async function BaseLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <div style={{ minHeight: "100vh", background: "#F5F7F6", fontFamily: "sans-serif" }}>
      {session ? <BaseHeader companyName={session.companyName} /> : <GuestHeader />}
      <LayoutShell
        leftSidebar={
          <Suspense fallback={<div style={{ width: 210, flexShrink: 0 }} />}>
            <LeftSidebar />
          </Suspense>
        }
        rightSidebar={
          <Suspense fallback={<div style={{ width: 280, flexShrink: 0 }} />}>
            <RightSidebar />
          </Suspense>
        }
      >
        {children}
      </LayoutShell>
    </div>
  );
}

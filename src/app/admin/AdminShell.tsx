"use client";
import { usePathname } from "next/navigation";
import AdminHeader from "./AdminHeader";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") return <>{children}</>;

  return (
    <div style={{ minHeight: "100vh", background: "#F5F7F6", fontFamily: "'Hiragino Sans', sans-serif" }}>
      <AdminHeader />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {children}
      </main>
    </div>
  );
}

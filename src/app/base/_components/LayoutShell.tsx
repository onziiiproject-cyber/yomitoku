"use client";
import { usePathname } from "next/navigation";

function isAuthPage(pathname: string) {
  return (
    pathname.startsWith("/base/login") ||
    pathname.startsWith("/base/forgot-password") ||
    pathname.startsWith("/base/reset-password")
  );
}

export default function LayoutShell({
  children,
  leftSidebar,
  rightSidebar,
}: {
  children: React.ReactNode;
  leftSidebar: React.ReactNode;
  rightSidebar: React.ReactNode;
}) {
  const pathname = usePathname();

  if (isAuthPage(pathname)) {
    return (
      <main style={{ flex: 1, minWidth: 0, padding: "24px 20px" }}>
        {children}
      </main>
    );
  }

  return (
    <div style={{ display: "flex" }}>
      {leftSidebar}
      <main style={{ flex: 1, minWidth: 0, padding: "24px 20px", overflowX: "hidden" }}>
        {children}
      </main>
      {rightSidebar}
    </div>
  );
}

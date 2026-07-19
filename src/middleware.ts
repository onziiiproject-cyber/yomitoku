import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "yomitoku-auth-secret-change-in-prod"
);

function isPublicBasePath(pathname: string): boolean {
  if (pathname === "/base" || pathname === "/base/") return true;
  if (pathname.startsWith("/base/tags")) return true;
  if (pathname.startsWith("/base/login")) return true;
  if (pathname.startsWith("/base/forgot-password")) return true;
  if (pathname.startsWith("/base/reset-password")) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // BASE認証
  if (pathname.startsWith("/base") && !isPublicBasePath(pathname)) {
    const token = req.cookies.get("yb_session")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/base/login", req.url));
    }
    try {
      await jwtVerify(token, SECRET);
    } catch {
      return NextResponse.redirect(new URL("/base/login", req.url));
    }
  }

  // 管理画面認証（/admin/login は除外）
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const adminSession = req.cookies.get("admin_session")?.value;
    if (!adminSession || adminSession !== process.env.ADMIN_SECRET) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/base/:path*", "/admin/:path*"],
};

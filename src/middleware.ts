import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "yomitoku-auth-secret-change-in-prod"
);

// Public paths under /base that don't require login
function isPublicBasePath(pathname: string): boolean {
  if (pathname === "/base" || pathname === "/base/") return true;
  if (pathname.startsWith("/base/login")) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

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

  return NextResponse.next();
}

export const config = {
  matcher: ["/base/:path*"],
};

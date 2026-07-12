import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "yomitoku-auth-secret-change-in-prod"
);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/base") && !pathname.startsWith("/base/login")) {
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

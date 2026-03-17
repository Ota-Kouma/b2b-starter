import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, getRedirectPathForRole } from "@/lib/session";
import type { Role } from "@/lib/generated/prisma/enums";

// ロールごとにアクセスできるパスプレフィックス
const ROLE_PATHS: Record<string, Role[]> = {
  "/platform": ["PLATFORM_OWNER", "PLATFORM_OPERATOR"],
  "/admin": ["PLATFORM_OWNER", "PLATFORM_OPERATOR", "COMPANY_ADMIN", "COMPANY_MANAGER", "COMPANY_AUDITOR"],
  "/dashboard": ["PLATFORM_OWNER", "PLATFORM_OPERATOR", "COMPANY_ADMIN", "COMPANY_MANAGER", "COMPANY_AUDITOR", "EMPLOYEE"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 認証不要のパス
  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("session")?.value;

  // セッションなし → ログインへ
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // セッション検証
  let session;
  try {
    session = await verifySessionToken(token);
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.set("session", "", { maxAge: 0, path: "/" });
    return response;
  }

  // ロール権限チェック
  for (const [prefix, allowedRoles] of Object.entries(ROLE_PATHS)) {
    if (pathname.startsWith(prefix)) {
      if (!allowedRoles.includes(session.role)) {
        return NextResponse.redirect(
          new URL(getRedirectPathForRole(session.role), request.url)
        );
      }
      break;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/platform/:path*"],
};

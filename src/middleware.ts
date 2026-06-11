import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Better Auth 默认 session cookie 前缀 */
const SESSION_COOKIE_PREFIX = "better-auth.session_token";

export async function middleware(request: NextRequest) {
  // Edge Runtime 无法直接使用 Prisma，此处仅检查 cookie 存在性做轻量保护
  // 实际 session 验证在页面 / Server Action 中由 auth.api.getSession 完成
  const hasSessionCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith(SESSION_COOKIE_PREFIX));

  if (!hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/profile", "/interview/:path*"],
};

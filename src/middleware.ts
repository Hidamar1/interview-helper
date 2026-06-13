import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Better Auth session cookie 前缀。
 * 生产环境（HTTPS）浏览器自动加 `__Secure-` 前缀，本地开发（HTTP）不加。
 */
const SESSION_PREFIXES = ["__Secure-better-auth.session_token", "better-auth.session_token"];

export async function middleware(request: NextRequest) {
  // Edge Runtime 无法直接使用 Prisma，此处仅检查 cookie 存在性做轻量保护
  // 实际 session 验证在页面 / Server Action 中由 auth.api.getSession 完成
  const hasSessionCookie = request.cookies
    .getAll()
    .some((c) => SESSION_PREFIXES.some((p) => c.name.startsWith(p)));

  if (!hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/profile", "/interview/:path*", "/admin/:path*"],
};

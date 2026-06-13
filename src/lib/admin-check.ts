import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/** 校验当前请求是否为 ADMIN 角色，返回 session */
export async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    throw new Error("无权访问");
  }
  return session;
}

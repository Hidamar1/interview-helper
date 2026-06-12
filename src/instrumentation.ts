/** 服务启动时预热数据库连接——仅 Neon 模式需要 */
export async function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.DATABASE_URL?.includes("neon.tech")
  ) {
    try {
      setTimeout(async () => {
        const { neon } = await import("@neondatabase/serverless");
        const sql = neon(process.env.DATABASE_URL!);
        await sql`SELECT 1`;
        console.log("✅ Neon 数据库预热完成");
      }, 1000);
    } catch {
      // 预热失败不影响启动
    }
  }
}

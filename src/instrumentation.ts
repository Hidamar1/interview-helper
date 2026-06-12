/** 服务启动时预热 Neon 数据库连接，避免首次页面请求等待冷启动 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      // 延迟预热，等 Next.js 就绪后再连接
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

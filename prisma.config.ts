import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // Prisma 7 不自动加载 .env，CLI 迁移走直连（Neon DIRECT_URL）
  datasource: {
    url: env("DIRECT_URL"),
  },
});

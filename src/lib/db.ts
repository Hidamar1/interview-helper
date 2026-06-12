import { PrismaClient } from "@/generated/prisma/client";
import type { Prisma } from "@/generated/prisma/client";

// 判断是否使用 Neon（服务器部署时），否则走本地标准 PostgreSQL
const isNeon = process.env.DATABASE_URL?.includes("neon.tech");

// 声明全局单例
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createClient(): PrismaClient {
  if (isNeon) {
    // Neon 模式：WebSocket + @prisma/adapter-neon
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaNeon } = require("@prisma/adapter-neon");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { neonConfig } = require("@neondatabase/serverless");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { default: ws } = require("ws");

    if (typeof globalThis.WebSocket === "undefined") {
      neonConfig.webSocketConstructor = ws;
    }

    return new PrismaClient({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
    });
  }

  // 本地 PostgreSQL：@prisma/adapter-pg
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Pool } = require("pg");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaPg } = require("@prisma/adapter-pg");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    adapter: new PrismaPg(pool),
  });
}

const client: PrismaClient = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;

export { client as prisma };

import { PrismaClient } from "@/generated/prisma/client";

// Prisma 7 适配器需要条件导入——本地 PostgreSQL 用 pg，Neon 用 serverless
/* eslint-disable @typescript-eslint/no-require-imports */

// 判断是否使用 Neon（服务器部署时），否则走本地标准 PostgreSQL
const isNeon = process.env.DATABASE_URL?.includes("neon.tech");

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createClient(): PrismaClient {
  if (isNeon) {
    const { PrismaNeon } = require("@prisma/adapter-neon");
    const { neonConfig } = require("@neondatabase/serverless");
    const { default: ws } = require("ws");

    if (typeof globalThis.WebSocket === "undefined") {
      neonConfig.webSocketConstructor = ws;
    }

    return new PrismaClient({
      adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
    });
  }

  // 本地 PostgreSQL
  const { Pool } = require("pg");
  const { PrismaPg } = require("@prisma/adapter-pg");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({
    adapter: new PrismaPg(pool),
  });
}

const client: PrismaClient = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;

export { client as prisma };

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createClient(): PrismaClient {
  const isNeon = process.env.DATABASE_URL?.includes("neon.tech");

  if (isNeon) {
    // Vercel/Neon 生产环境：WebSocket 驱动的 serverless 连接
    if (typeof globalThis.WebSocket === "undefined") {
      neonConfig.webSocketConstructor = ws;
    }
    return new PrismaClient({
      adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
    });
  }

  // 本地 PostgreSQL 开发环境
  const { Pool } = require("pg");
  const { PrismaPg } = require("@prisma/adapter-pg");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({
    adapter: new PrismaPg(pool),
  });
}

const client = globalForPrisma.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;

export { client as prisma };

import "dotenv/config";
import { prisma } from "../src/lib/db";

async function main() {
  const result = await prisma.$queryRaw`SELECT 1 AS ok`;
  console.log("数据库连通:", result);
  await prisma.$disconnect();
}

main();

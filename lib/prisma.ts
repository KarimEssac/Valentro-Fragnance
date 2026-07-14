import "dotenv/config";
import {PrismaClient} from "@prisma/client";
import type {Prisma} from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const log: Prisma.LogLevel[] =
  process.env.PRISMA_LOG_QUERIES === "true"
    ? ["query", "error", "warn"]
    : process.env.NODE_ENV === "development"
      ? ["error", "warn"]
      : ["error"];

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

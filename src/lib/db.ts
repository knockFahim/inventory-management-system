import { PrismaClient } from "../generated/prisma";
import { neon } from "@neondatabase/serverless";

// Optimize connection for Neon PostgreSQL
const connectionString = process.env.DATABASE_URL || "";

// Create a Prisma Client with Neon optimization
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: ["query", "info", "warn", "error"],
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;

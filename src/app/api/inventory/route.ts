// filepath: c:\Users\Shuvo\Desktop\inventory-management-system\src\app\api\inventory\route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/authOptions";

// GET /api/inventory
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get("productId");
        const type = searchParams.get("type");
        const limit = parseInt(searchParams.get("limit") || "100");

        // Build query filters
        let where: any = {};

        if (productId) {
            where.productId = productId;
        }

        if (type) {
            where.type = type;
        }

        // Get all inventory logs with product information
        const inventoryLogs = await prisma.inventoryLog.findMany({
            where,
            orderBy: {
                createdAt: "desc",
            },
            take: limit,
            select: {
                id: true,
                productId: true,
                quantity: true,
                type: true,
                reference: true,
                notes: true,
                createdAt: true,
            },
        });

        // Since the schema doesn't directly relate products to inventory logs,
        // we need to fetch the product information separately for each log
        const logsWithProductInfo = await Promise.all(
            inventoryLogs.map(async (log) => {
                const product = await prisma.product.findUnique({
                    where: { id: log.productId },
                    select: {
                        name: true,
                        sku: true,
                    },
                });

                return {
                    ...log,
                    product,
                };
            })
        );

        return NextResponse.json(logsWithProductInfo);
    } catch (error) {
        console.error("Error fetching inventory logs:", error);
        return NextResponse.json(
            { error: "Failed to fetch inventory data" },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { authorizeRole } from "@/lib/auth";

// GET /api/products - Get all products
export async function GET(req: NextRequest) {
    try {
        // Check query parameters for filtering
        const url = new URL(req.url);
        const categoryId = url.searchParams.get("categoryId");
        const search = url.searchParams.get("search");
        const lowStock = url.searchParams.get("lowStock") === "true";
        const sort = url.searchParams.get("sort") || "name:asc";
        const [sortField, sortOrder] = sort.split(":");

        // Build where clause
        const where: any = {};
        if (categoryId) {
            where.categoryId = categoryId;
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { sku: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ];
        }
        if (lowStock) {
            where.quantity = { lte: prisma.product.fields.minimumStock };
        }

        // Execute query
        const products = await prisma.product.findMany({
            where,
            include: {
                category: true,
            },
            orderBy: {
                [sortField]: sortOrder === "asc" ? "asc" : "desc",
            },
        });

        return NextResponse.json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        return new NextResponse(
            JSON.stringify({ message: "Error fetching products" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}

// POST /api/products - Create a new product
export async function POST(req: NextRequest) {
    try {
        // Authorization check - only admin and manager can create products
        const authError = await authorizeRole(req, NextResponse.next(), [
            "ADMIN",
            "MANAGER",
        ]);
        if (authError) return authError;

        const data = await req.json();

        // Basic validation
        if (
            !data.name ||
            !data.price ||
            !data.sku ||
            !data.categoryId ||
            !data.userId
        ) {
            return new NextResponse(
                JSON.stringify({ message: "Missing required fields" }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        // Check if SKU already exists
        const existingProduct = await prisma.product.findUnique({
            where: { sku: data.sku },
        });

        if (existingProduct) {
            return new NextResponse(
                JSON.stringify({
                    message: "Product with this SKU already exists",
                }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        // Create product
        const product = await prisma.product.create({
            data: {
                name: data.name,
                sku: data.sku,
                description: data.description,
                price: parseFloat(data.price),
                costPrice: parseFloat(data.costPrice),
                quantity: parseInt(data.quantity) || 0,
                minimumStock: parseInt(data.minimumStock) || 10,
                categoryId: data.categoryId,
                userId: data.userId,
            },
            include: {
                category: true,
            },
        });

        return NextResponse.json(product, { status: 201 });
    } catch (error) {
        console.error("Error creating product:", error);
        return new NextResponse(
            JSON.stringify({ message: "Error creating product" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}

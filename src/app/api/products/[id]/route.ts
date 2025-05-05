import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { authorizeRole } from "@/lib/auth";

interface RouteParams {
    params: {
        id: string;
    };
}

// GET /api/products/[id] - Get a specific product
export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = params;

        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                category: true,
            },
        });

        if (!product) {
            return new NextResponse(
                JSON.stringify({ message: "Product not found" }),
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        return NextResponse.json(product);
    } catch (error) {
        console.error("Error fetching product:", error);
        return new NextResponse(
            JSON.stringify({ message: "Error fetching product" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}

// PUT /api/products/[id] - Update a product
export async function PUT(req: NextRequest, { params }: RouteParams) {
    try {
        // Authorization check - only admin and manager can update products
        const authError = await authorizeRole(req, NextResponse.next(), [
            "ADMIN",
            "MANAGER",
        ]);
        if (authError) return authError;

        const { id } = params;
        const data = await req.json();

        // Check if product exists
        const existingProduct = await prisma.product.findUnique({
            where: { id },
        });

        if (!existingProduct) {
            return new NextResponse(
                JSON.stringify({ message: "Product not found" }),
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        // Check if trying to update SKU and if it already exists
        if (data.sku && data.sku !== existingProduct.sku) {
            const skuExists = await prisma.product.findUnique({
                where: { sku: data.sku },
            });

            if (skuExists) {
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
        }

        // Update product
        const updatedProduct = await prisma.product.update({
            where: { id },
            data: {
                name: data.name,
                sku: data.sku,
                description: data.description,
                price: data.price ? parseFloat(data.price) : undefined,
                costPrice: data.costPrice
                    ? parseFloat(data.costPrice)
                    : undefined,
                quantity: data.quantity ? parseInt(data.quantity) : undefined,
                minimumStock: data.minimumStock
                    ? parseInt(data.minimumStock)
                    : undefined,
                categoryId: data.categoryId,
                userId: data.userId,
            },
            include: {
                category: true,
            },
        });

        return NextResponse.json(updatedProduct);
    } catch (error) {
        console.error("Error updating product:", error);
        return new NextResponse(
            JSON.stringify({ message: "Error updating product" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}

// DELETE /api/products/[id] - Delete a product
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        // Authorization check - only admin can delete products
        const authError = await authorizeRole(req, NextResponse.next(), [
            "ADMIN",
        ]);
        if (authError) return authError;

        const { id } = params;

        // Check if product exists
        const existingProduct = await prisma.product.findUnique({
            where: { id },
        });

        if (!existingProduct) {
            return new NextResponse(
                JSON.stringify({ message: "Product not found" }),
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        // Delete product
        await prisma.product.delete({
            where: { id },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Error deleting product:", error);
        return new NextResponse(
            JSON.stringify({ message: "Error deleting product" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}

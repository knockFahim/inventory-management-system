import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { authorizeRole } from "@/lib/auth";

// GET /api/products/[id]/suppliers - Get all suppliers for a product
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        // Check if product exists
        const product = await prisma.product.findUnique({
            where: { id },
        });

        if (!product) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            );
        }

        // Get all suppliers for the product with relationship details
        const productSuppliers = await prisma.productSupplier.findMany({
            where: { productId: id },
            include: {
                supplier: true,
            },
        });

        return NextResponse.json(productSuppliers);
    } catch (error) {
        console.error("Error fetching product suppliers:", error);
        return NextResponse.json(
            { error: "Error fetching product suppliers" },
            { status: 500 }
        );
    }
}

// POST /api/products/[id]/suppliers - Add a supplier to a product
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Authorization check - only admin and manager can associate suppliers with products
        const authError = await authorizeRole(req, NextResponse.next(), [
            "ADMIN",
            "MANAGER",
        ]);
        if (authError) return authError;

        const { id: productId } = params;
        const data = await req.json();
        const { supplierId, isPreferred, unitPrice, notes } = data;

        // Validate required fields
        if (!supplierId) {
            return NextResponse.json(
                { error: "Supplier ID is required" },
                { status: 400 }
            );
        }

        // Check if product exists
        const product = await prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            );
        }

        // Check if supplier exists
        const supplier = await prisma.supplier.findUnique({
            where: { id: supplierId },
        });

        if (!supplier) {
            return NextResponse.json(
                { error: "Supplier not found" },
                { status: 404 }
            );
        }

        // Check if relationship already exists
        const existingRelation = await prisma.productSupplier.findUnique({
            where: {
                productId_supplierId: {
                    productId,
                    supplierId,
                },
            },
        });

        if (existingRelation) {
            return NextResponse.json(
                {
                    error: "This supplier is already associated with the product",
                },
                { status: 400 }
            );
        }

        // If this is the preferred supplier, remove preferred status from other suppliers
        if (isPreferred) {
            await prisma.productSupplier.updateMany({
                where: {
                    productId,
                    isPreferred: true,
                },
                data: {
                    isPreferred: false,
                },
            });
        }

        // Create relationship
        const productSupplier = await prisma.productSupplier.create({
            data: {
                productId,
                supplierId,
                isPreferred: isPreferred || false,
                unitPrice: unitPrice ? parseFloat(unitPrice) : null,
                notes,
            },
            include: {
                supplier: true,
            },
        });

        return NextResponse.json(productSupplier, { status: 201 });
    } catch (error) {
        console.error("Error associating supplier with product:", error);
        return NextResponse.json(
            { error: "Error associating supplier with product" },
            { status: 500 }
        );
    }
}

// DELETE /api/products/[id]/suppliers?supplierId=xxx - Remove a supplier from a product
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Authorization check - only admin can remove supplier associations
        const authError = await authorizeRole(req, NextResponse.next(), [
            "ADMIN",
        ]);
        if (authError) return authError;

        const { id: productId } = params;
        const { searchParams } = new URL(req.url);
        const supplierId = searchParams.get("supplierId");

        if (!supplierId) {
            return NextResponse.json(
                { error: "Supplier ID is required" },
                { status: 400 }
            );
        }

        // Check if relationship exists
        const existingRelation = await prisma.productSupplier.findUnique({
            where: {
                productId_supplierId: {
                    productId,
                    supplierId,
                },
            },
        });

        if (!existingRelation) {
            return NextResponse.json(
                { error: "Supplier is not associated with this product" },
                { status: 404 }
            );
        }

        // Remove relationship
        await prisma.productSupplier.delete({
            where: {
                productId_supplierId: {
                    productId,
                    supplierId,
                },
            },
        });

        return NextResponse.json(null, { status: 204 });
    } catch (error) {
        console.error("Error removing supplier association:", error);
        return NextResponse.json(
            { error: "Error removing supplier association" },
            { status: 500 }
        );
    }
}

// PATCH /api/products/[id]/suppliers/[supplierId] - Update a product-supplier relationship
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Authorization check - only admin and manager can update supplier associations
        const authError = await authorizeRole(req, NextResponse.next(), [
            "ADMIN",
            "MANAGER",
        ]);
        if (authError) return authError;

        const { id: productId } = params;
        const data = await req.json();
        const { supplierId, isPreferred, unitPrice, notes } = data;

        // Validate required fields
        if (!supplierId) {
            return NextResponse.json(
                { error: "Supplier ID is required" },
                { status: 400 }
            );
        }

        // Check if relationship exists
        const existingRelation = await prisma.productSupplier.findUnique({
            where: {
                productId_supplierId: {
                    productId,
                    supplierId,
                },
            },
        });

        if (!existingRelation) {
            return NextResponse.json(
                { error: "Supplier is not associated with this product" },
                { status: 404 }
            );
        }

        // If making this the preferred supplier, remove preferred status from others
        if (isPreferred && !existingRelation.isPreferred) {
            await prisma.productSupplier.updateMany({
                where: {
                    productId,
                    isPreferred: true,
                },
                data: {
                    isPreferred: false,
                },
            });
        }

        // Update relationship
        const updatedRelation = await prisma.productSupplier.update({
            where: {
                productId_supplierId: {
                    productId,
                    supplierId,
                },
            },
            data: {
                isPreferred:
                    isPreferred !== undefined ? isPreferred : undefined,
                unitPrice:
                    unitPrice !== undefined ? parseFloat(unitPrice) : undefined,
                notes: notes !== undefined ? notes : undefined,
            },
            include: {
                supplier: true,
            },
        });

        return NextResponse.json(updatedRelation);
    } catch (error) {
        console.error("Error updating supplier association:", error);
        return NextResponse.json(
            { error: "Error updating supplier association" },
            { status: 500 }
        );
    }
}

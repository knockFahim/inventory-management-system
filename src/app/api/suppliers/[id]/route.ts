import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/authOptions";

// GET /api/suppliers/[id] - Get a specific supplier
export async function GET(
    request: Request,
    context: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const supplierId = context.params.id;

        // Find the supplier
        const supplier = await prisma.supplier.findUnique({
            where: { id: supplierId },
            include: {
                purchases: {
                    orderBy: { date: "desc" },
                    take: 10, // Only get the last 10 purchases
                    include: {
                        purchaseItems: {
                            include: {
                                product: {
                                    select: {
                                        name: true,
                                        sku: true,
                                    },
                                },
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        purchases: true,
                    },
                },
            },
        });

        if (!supplier) {
            return NextResponse.json(
                { error: "Supplier not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(supplier);
    } catch (error) {
        console.error("Error fetching supplier:", error);
        return NextResponse.json(
            { error: "Failed to fetch supplier details" },
            { status: 500 }
        );
    }
}

// PUT /api/suppliers/[id] - Update a supplier
export async function PUT(
    request: Request,
    context: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Check if the user has permission to update suppliers
        if (session.user.role === "STAFF") {
            return NextResponse.json(
                { error: "You don't have permission to update suppliers" },
                { status: 403 }
            );
        }

        const supplierId = context.params.id;
        const data = await request.json();

        // Validate required fields
        if (!data.name) {
            return NextResponse.json(
                { error: "Supplier name is required" },
                { status: 400 }
            );
        }

        // Check if supplier exists
        const existingSupplier = await prisma.supplier.findUnique({
            where: { id: supplierId },
        });

        if (!existingSupplier) {
            return NextResponse.json(
                { error: "Supplier not found" },
                { status: 404 }
            );
        }

        // Update the supplier
        const supplier = await prisma.supplier.update({
            where: { id: supplierId },
            data: {
                name: data.name,
                email: data.email || null,
                phone: data.phone || null,
                address: data.address || null,
            },
        });

        return NextResponse.json(supplier);
    } catch (error) {
        console.error("Error updating supplier:", error);
        return NextResponse.json(
            { error: "Failed to update supplier" },
            { status: 500 }
        );
    }
}

// DELETE /api/suppliers/[id] - Delete a supplier
export async function DELETE(
    request: Request,
    context: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Check if the user has permission to delete suppliers
        if (session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Only administrators can delete suppliers" },
                { status: 403 }
            );
        }

        const supplierId = context.params.id;

        // Check if the supplier has associated purchases
        const purchasesCount = await prisma.purchase.count({
            where: { supplierId },
        });

        if (purchasesCount > 0) {
            return NextResponse.json(
                {
                    error: "Cannot delete supplier with existing purchases. Archive it instead.",
                },
                { status: 400 }
            );
        }

        // Delete the supplier
        await prisma.supplier.delete({
            where: { id: supplierId },
        });

        return NextResponse.json({ message: "Supplier deleted successfully" });
    } catch (error) {
        console.error("Error deleting supplier:", error);
        return NextResponse.json(
            { error: "Failed to delete supplier" },
            { status: 500 }
        );
    }
}

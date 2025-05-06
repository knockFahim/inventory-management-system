import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/db";

// GET /api/sales/[id] - Get a single sale by ID
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = params;

        const sale = await prisma.sale.findUnique({
            where: { id },
            include: {
                customer: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                saleItems: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                sku: true,
                            },
                        },
                    },
                },
            },
        });

        if (!sale) {
            return NextResponse.json(
                { error: "Sale not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(sale);
    } catch (error) {
        console.error("Error fetching sale:", error);
        return NextResponse.json(
            { error: "Error fetching sale" },
            { status: 500 }
        );
    }
}

// PUT /api/sales/[id] - Update a sale
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = params;
        const data = await request.json();
        const { customerId, date, paymentMethod, status, discount, tax } = data;

        // Check if sale exists
        const existingSale = await prisma.sale.findUnique({
            where: { id },
            include: {
                saleItems: true,
            },
        });

        if (!existingSale) {
            return NextResponse.json(
                { error: "Sale not found" },
                { status: 404 }
            );
        }

        // Only allow updates on PENDING sales
        if (existingSale.status === "COMPLETED" && status !== "CANCELLED") {
            return NextResponse.json(
                { error: "Completed sales cannot be modified" },
                { status: 400 }
            );
        }

        // Prepare update data
        const updateData: any = {
            customerId: customerId || existingSale.customerId,
            date: date ? new Date(date).toISOString() : existingSale.date,
            paymentMethod: paymentMethod || existingSale.paymentMethod,
            status: status || existingSale.status,
            discount: discount !== undefined ? discount : existingSale.discount,
            tax: tax !== undefined ? tax : existingSale.tax,
        };

        // Calculate the new total if discount or tax changed
        if (discount !== undefined || tax !== undefined) {
            // Get total amount of items
            const subtotal = existingSale.saleItems.reduce(
                (sum, item) => sum + item.totalPrice,
                0
            );

            // Calculate new final total
            const discountAmount =
                (subtotal * (discount || existingSale.discount)) / 100;
            const taxAmount =
                ((subtotal - discountAmount) * (tax || existingSale.tax)) / 100;
            updateData.totalAmount = subtotal - discountAmount + taxAmount;
        }

        // Update the sale
        const updatedSale = await prisma.sale.update({
            where: { id },
            data: updateData,
            include: {
                customer: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                saleItems: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        return NextResponse.json(updatedSale);
    } catch (error) {
        console.error("Error updating sale:", error);
        return NextResponse.json(
            { error: "Error updating sale" },
            { status: 500 }
        );
    }
}

// DELETE /api/sales/[id] - Delete a sale
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = params;

        // Check if sale exists
        const sale = await prisma.sale.findUnique({
            where: { id },
            include: {
                saleItems: true,
            },
        });

        if (!sale) {
            return NextResponse.json(
                { error: "Sale not found" },
                { status: 404 }
            );
        }

        // Only allow deletion of PENDING or CANCELLED sales
        if (sale.status === "COMPLETED") {
            return NextResponse.json(
                { error: "Completed sales cannot be deleted" },
                { status: 400 }
            );
        }

        // Begin transaction to ensure all operations succeed or fail together
        await prisma.$transaction(async (prisma) => {
            // Restore product quantities if sale is PENDING
            if (sale.status === "PENDING") {
                for (const item of sale.saleItems) {
                    // Restore product quantity
                    await prisma.product.update({
                        where: { id: item.productId },
                        data: {
                            quantity: {
                                increment: item.quantity,
                            },
                        },
                    });

                    // Create inventory log entry for the restore
                    await prisma.inventoryLog.create({
                        data: {
                            productId: item.productId,
                            quantity: item.quantity, // Positive because it's adding stock back
                            type: "ADJUSTMENT",
                            reference: `DELETE-${sale.invoiceNumber}`,
                            notes: `Restored due to sale deletion: ${sale.invoiceNumber}`,
                        },
                    });
                }
            }

            // Delete all sale items
            await prisma.saleItem.deleteMany({
                where: { saleId: id },
            });

            // Delete the sale
            await prisma.sale.delete({
                where: { id },
            });
        });

        return NextResponse.json({ message: "Sale deleted successfully" });
    } catch (error) {
        console.error("Error deleting sale:", error);
        return NextResponse.json(
            { error: "Error deleting sale" },
            { status: 500 }
        );
    }
}

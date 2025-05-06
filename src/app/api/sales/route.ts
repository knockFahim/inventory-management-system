import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/db";

// GET /api/sales - Get all sales with filters and pagination
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Parse query parameters
        const url = new URL(request.url);
        const query = url.searchParams.get("query") || "";
        const status = url.searchParams.get("status") || undefined;
        const date = url.searchParams.get("date") || undefined;
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        // Build the where clause based on filters
        let where: any = {};

        if (query) {
            where.OR = [
                { invoiceNumber: { contains: query, mode: "insensitive" } },
                {
                    customer: {
                        name: { contains: query, mode: "insensitive" },
                    },
                },
            ];
        }

        if (status) {
            where.status = status;
        }

        if (date) {
            // Parse date string to Date object
            const searchDate = new Date(date);
            const nextDay = new Date(searchDate);
            nextDay.setDate(nextDay.getDate() + 1);

            where.date = {
                gte: searchDate.toISOString(),
                lt: nextDay.toISOString(),
            };
        }

        // Get sales with pagination
        const sales = await prisma.sale.findMany({
            where,
            include: {
                customer: {
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
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        });

        // Get total count for pagination
        const total = await prisma.sale.count({ where });

        return NextResponse.json({
            sales,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching sales:", error);
        return NextResponse.json(
            { error: "Error fetching sales" },
            { status: 500 }
        );
    }
}

// POST /api/sales - Create a new sale
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const data = await request.json();
        const {
            customerId,
            newCustomer,
            date,
            paymentMethod,
            status,
            items,
            discount,
            tax,
        } = data;

        // Validate required fields - items are required, but customer can be optional
        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: "At least one item is required" },
                { status: 400 }
            );
        }

        // Check if all products exist and have sufficient stock
        for (const item of items) {
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
            });

            if (!product) {
                return NextResponse.json(
                    { error: `Product with ID ${item.productId} not found` },
                    { status: 400 }
                );
            }

            if (product.quantity < item.quantity) {
                return NextResponse.json(
                    {
                        error: `Insufficient stock for product ${product.name}. Available: ${product.quantity}`,
                    },
                    { status: 400 }
                );
            }
        }

        // Begin transaction to ensure all operations succeed or fail together
        // Increase transaction timeout to 10 seconds (10000ms) to avoid timeout errors
        const result = await prisma.$transaction(
            async (prisma) => {
                // Handle customer - either use existing or create new one
                let customerIdToUse = customerId;

                // If new customer data is provided, create a new customer
                if (newCustomer && newCustomer.name) {
                    const createdCustomer = await prisma.customer.create({
                        data: {
                            name: newCustomer.name,
                            phone: newCustomer.phone || null,
                        },
                    });
                    customerIdToUse = createdCustomer.id;
                }

                // Generate invoice number
                const lastSale = await prisma.sale.findFirst({
                    orderBy: { createdAt: "desc" },
                });

                const lastInvoiceNum = lastSale
                    ? parseInt(lastSale.invoiceNumber.replace("INV-", ""))
                    : 0;
                const invoiceNumber = `INV-${(lastInvoiceNum + 1)
                    .toString()
                    .padStart(5, "0")}`;

                // Calculate total amount
                let totalAmount = 0;
                const saleItemsData = [];

                for (const item of items) {
                    const itemTotal = item.quantity * item.price;
                    totalAmount += itemTotal;

                    saleItemsData.push({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price,
                        totalPrice: itemTotal,
                    });
                }

                // Apply discount and tax
                const discountAmount = (totalAmount * (discount || 0)) / 100;
                const taxAmount =
                    ((totalAmount - discountAmount) * (tax || 0)) / 100;
                const finalTotal = totalAmount - discountAmount + taxAmount;

                // Create sale
                const sale = await prisma.sale.create({
                    data: {
                        invoiceNumber,
                        customerId: customerIdToUse,
                        userId: session.user?.id,
                        date: date
                            ? new Date(date).toISOString()
                            : new Date().toISOString(),
                        totalAmount: finalTotal,
                        discount: discount || 0,
                        tax: tax || 0,
                        paymentMethod: paymentMethod || "CASH",
                        status: status || "PENDING",
                        saleItems: {
                            create: saleItemsData,
                        },
                    },
                    include: {
                        customer: true,
                        saleItems: {
                            include: {
                                product: true,
                            },
                        },
                    },
                });

                // Update product quantities and create inventory logs
                for (const item of items) {
                    // Update product quantity
                    await prisma.product.update({
                        where: { id: item.productId },
                        data: {
                            quantity: {
                                decrement: item.quantity,
                            },
                        },
                    });

                    // Create inventory log entry
                    await prisma.inventoryLog.create({
                        data: {
                            productId: item.productId,
                            quantity: -item.quantity, // Negative because it's reducing stock
                            type: "SALE",
                            reference: invoiceNumber,
                            notes: `Sale to ${
                                sale.customer?.name || "Unknown Customer"
                            }`,
                        },
                    });
                }

                return sale;
            },
            {
                timeout: 10000, // Set timeout to 10 seconds (10000ms)
            }
        );

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Error creating sale:", error);
        return NextResponse.json(
            { error: "Error creating sale" },
            { status: 500 }
        );
    }
}

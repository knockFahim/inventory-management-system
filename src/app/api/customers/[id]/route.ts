import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/db";

// GET /api/customers/[id] - Get a specific customer by ID
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

        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                sales: {
                    orderBy: {
                        date: "desc",
                    },
                },
            },
        });

        if (!customer) {
            return NextResponse.json(
                { error: "Customer not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(customer);
    } catch (error) {
        console.error("Error fetching customer:", error);
        return NextResponse.json(
            { error: "Error fetching customer" },
            { status: 500 }
        );
    }
}

// PUT /api/customers/[id] - Update a customer
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

        // Check if customer exists
        const customer = await prisma.customer.findUnique({
            where: { id },
        });

        if (!customer) {
            return NextResponse.json(
                { error: "Customer not found" },
                { status: 404 }
            );
        }

        // Check if email is being updated and if it already exists
        if (data.email && data.email !== customer.email) {
            const customerWithEmail = await prisma.customer.findFirst({
                where: {
                    email: data.email,
                    id: { not: id }, // Exclude current customer
                },
            });

            if (customerWithEmail) {
                return NextResponse.json(
                    { error: "A customer with this email already exists" },
                    { status: 400 }
                );
            }
        }

        // Update customer
        const updatedCustomer = await prisma.customer.update({
            where: { id },
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone,
                address: data.address,
                houseNumber: data.houseNumber,
                road: data.road,
                city: data.city,
                state: data.state,
                postalCode: data.postalCode,
                country: data.country,
                notes: data.notes,
            },
        });

        return NextResponse.json(updatedCustomer);
    } catch (error) {
        console.error("Error updating customer:", error);
        return NextResponse.json(
            { error: "Error updating customer" },
            { status: 500 }
        );
    }
}

// DELETE /api/customers/[id] - Delete a customer
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

        // Check if customer exists
        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                sales: true,
            },
        });

        if (!customer) {
            return NextResponse.json(
                { error: "Customer not found" },
                { status: 404 }
            );
        }

        // Check if customer has sales
        if (customer.sales && customer.sales.length > 0) {
            return NextResponse.json(
                { error: "Cannot delete customer with sales history" },
                { status: 400 }
            );
        }

        // Delete customer
        await prisma.customer.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Customer deleted successfully" });
    } catch (error) {
        console.error("Error deleting customer:", error);
        return NextResponse.json(
            { error: "Error deleting customer" },
            { status: 500 }
        );
    }
}

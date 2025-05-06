import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/db";

// GET /api/customers - Get all customers
export async function GET(request: Request) {
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
        const searchQuery = url.searchParams.get("query") || "";
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const skip = (page - 1) * limit;

        // Build the query
        const where = searchQuery
            ? {
                  OR: [
                      { name: { contains: searchQuery, mode: "insensitive" } },
                      { email: { contains: searchQuery, mode: "insensitive" } },
                      { phone: { contains: searchQuery, mode: "insensitive" } },
                  ],
              }
            : {};

        // Get customers
        const customers = await prisma.customer.findMany({
            where,
            orderBy: { name: "asc" },
            skip,
            take: limit,
        });

        // Get total count for pagination
        const total = await prisma.customer.count({ where });

        return NextResponse.json({
            customers,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching customers:", error);
        return NextResponse.json(
            { error: "Error fetching customers" },
            { status: 500 }
        );
    }
}

// POST /api/customers - Create a new customer
export async function POST(request: Request) {
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
            name,
            email,
            phone,
            address,
            houseNumber,
            road,
            city,
            state,
            postalCode,
            country,
            notes,
        } = data;

        // Validate required fields
        if (!name) {
            return NextResponse.json(
                { error: "Customer name is required" },
                { status: 400 }
            );
        }

        // Check if customer with same email already exists
        if (email) {
            const existingCustomer = await prisma.customer.findFirst({
                where: { email },
            });

            if (existingCustomer) {
                return NextResponse.json(
                    { error: "A customer with this email already exists" },
                    { status: 400 }
                );
            }
        }

        // Create customer with all fields
        const customer = await prisma.customer.create({
            data: {
                name,
                email,
                phone,
                address,
                houseNumber,
                road,
                city,
                state,
                postalCode,
                country,
                notes,
            },
        });

        return NextResponse.json(customer, { status: 201 });
    } catch (error) {
        console.error("Error creating customer:", error);
        return NextResponse.json(
            { error: "Error creating customer" },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/authOptions";

// GET /api/suppliers - Get all suppliers
export async function GET(req: NextRequest) {
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
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search");
        const sort = searchParams.get("sort") || "name:asc";
        const [sortField, sortOrder] = sort.split(":");

        // Build where clause
        const where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
            ];
        }

        // Get suppliers with sorting
        const suppliers = await prisma.supplier.findMany({
            where,
            orderBy: {
                [sortField]: sortOrder,
            },
            include: {
                _count: {
                    select: {
                        purchases: true,
                    },
                },
            },
        });

        return NextResponse.json(suppliers);
    } catch (error) {
        console.error("Error fetching suppliers:", error);
        return NextResponse.json(
            { error: "Failed to fetch suppliers" },
            { status: 500 }
        );
    }
}

// POST /api/suppliers - Create a new supplier
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Check if the user has permission to create suppliers
        if (session.user.role === "STAFF") {
            return NextResponse.json(
                { error: "You don't have permission to create suppliers" },
                { status: 403 }
            );
        }

        // Get request body
        const data = await request.json();

        // Validate required fields
        if (!data.name) {
            return NextResponse.json(
                { error: "Supplier name is required" },
                { status: 400 }
            );
        }

        // Create the supplier
        const supplier = await prisma.supplier.create({
            data: {
                name: data.name,
                email: data.email || null,
                phone: data.phone || null,
                address: data.address || null,
            },
        });

        return NextResponse.json(supplier, { status: 201 });
    } catch (error) {
        console.error("Error creating supplier:", error);
        return NextResponse.json(
            { error: "Failed to create supplier" },
            { status: 500 }
        );
    }
}

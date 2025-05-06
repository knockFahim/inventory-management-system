import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import { authorizeRole } from "@/lib/auth";

// GET /api/users - Get all users with filtering and pagination
export async function GET(req: NextRequest) {
    try {
        // Check if user is authenticated and has permissions
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        // Only admins and managers can list users
        if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const searchParams = req.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const role = searchParams.get("role") || undefined;

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Build filter object
        const filter: any = {};

        if (search) {
            filter.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }

        if (role) {
            filter.role = role;
        }

        // Get users with pagination
        const users = await prisma.user.findMany({
            where: filter,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                // Exclude password field for security
            },
            skip,
            take: limit,
            orderBy: {
                createdAt: "desc",
            },
        });

        // Get total count for pagination
        const total = await prisma.user.count({
            where: filter,
        });

        // Return users with pagination info
        return NextResponse.json({
            users,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { message: "Error fetching users" },
            { status: 500 }
        );
    }
}

// POST /api/users - Create a new user
export async function POST(req: NextRequest) {
    try {
        // Check if user is authenticated and has permissions
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        // Only admins can create users
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        // Get request body
        const body = await req.json();
        const { name, email, password, role } = body;

        // Validate input
        if (!name || !email || !password) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        // Check if user with this email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { message: "User with this email already exists" },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || "STAFF", // Default to STAFF if no role provided
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                // Exclude password field for security
            },
        });

        return NextResponse.json(newUser, { status: 201 });
    } catch (error) {
        console.error("Error creating user:", error);
        return NextResponse.json(
            { message: "Error creating user" },
            { status: 500 }
        );
    }
}

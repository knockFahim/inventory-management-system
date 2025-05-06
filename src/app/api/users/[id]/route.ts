import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";

// GET /api/users/[id] - Get a specific user by ID
export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        // Check if user is authenticated
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        // Allow users to get their own profile, but only admins/managers can get other users
        if (
            session.user.id !== id &&
            session.user.role !== "ADMIN" &&
            session.user.role !== "MANAGER"
        ) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        // Get the user
        const user = await prisma.user.findUnique({
            where: { id },
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

        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json(
            { message: "Error fetching user" },
            { status: 500 }
        );
    }
}

// PUT /api/users/[id] - Update a specific user
export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        // Check if user is authenticated
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get request body
        const body = await req.json();
        const { name, email, password, currentPassword, role } = body;

        // Get the existing user
        const existingUser = await prisma.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        // Define update data
        const updateData: any = {};

        // If it's a self-update
        if (session.user.id === id) {
            // Users can update their own name and password
            if (name) updateData.name = name;

            // If updating password, verify current password first
            if (password) {
                if (!currentPassword) {
                    return NextResponse.json(
                        {
                            message:
                                "Current password is required to set a new password",
                        },
                        { status: 400 }
                    );
                }

                const isPasswordValid = await bcrypt.compare(
                    currentPassword,
                    existingUser.password
                );

                if (!isPasswordValid) {
                    return NextResponse.json(
                        { message: "Current password is incorrect" },
                        { status: 400 }
                    );
                }

                // Hash the new password
                updateData.password = await bcrypt.hash(password, 10);
            }

            // Regular users cannot update their role or email
            if (
                session.user.role !== "ADMIN" &&
                (role || (email && email !== existingUser.email))
            ) {
                return NextResponse.json(
                    {
                        message:
                            "You don't have permission to update role or email",
                    },
                    { status: 403 }
                );
            }
        } else {
            // Admin updating another user
            if (session.user.role !== "ADMIN") {
                return NextResponse.json(
                    { message: "Only admins can update other users" },
                    { status: 403 }
                );
            }

            // Admin can update all fields
            if (name) updateData.name = name;
            if (email && email !== existingUser.email) {
                // Check if email is already taken
                const emailExists = await prisma.user.findUnique({
                    where: { email },
                });

                if (emailExists && emailExists.id !== id) {
                    return NextResponse.json(
                        { message: "Email is already in use" },
                        { status: 400 }
                    );
                }

                updateData.email = email;
            }
            if (role) updateData.role = role;

            // If admin is updating password, no need to check current password
            if (password) {
                updateData.password = await bcrypt.hash(password, 10);
            }
        }

        // Update the user if there are changes
        if (Object.keys(updateData).length > 0) {
            const updatedUser = await prisma.user.update({
                where: { id },
                data: updateData,
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

            return NextResponse.json(updatedUser);
        }

        // No changes made
        return NextResponse.json(
            { message: "No changes to update" },
            { status: 304 }
        );
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json(
            { message: "Error updating user" },
            { status: 500 }
        );
    }
}

// DELETE /api/users/[id] - Delete a specific user
export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        // Check if user is authenticated
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        // Only admins can delete users, and they cannot delete themselves
        if (session.user.role !== "ADMIN") {
            return NextResponse.json(
                { message: "Only admins can delete users" },
                { status: 403 }
            );
        }

        if (session.user.id === id) {
            return NextResponse.json(
                { message: "You cannot delete your own account" },
                { status: 403 }
            );
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        // Delete the user
        await prisma.user.delete({
            where: { id },
        });

        return NextResponse.json(
            { message: "User successfully deleted" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json(
            { message: "Error deleting user" },
            { status: 500 }
        );
    }
}

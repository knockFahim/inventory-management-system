import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";

export async function getSession() {
    return await getServerSession(authOptions);
}

export async function getCurrentUser() {
    const session = await getSession();
    return session?.user;
}

// Server API route middleware for role-based authentication
export async function authorizeRole(
    req: NextRequest,
    res: NextResponse,
    allowedRoles: string[]
) {
    const session = await getSession();
    const user = session?.user;

    if (!user) {
        return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    if (!allowedRoles.includes(user.role)) {
        return new NextResponse(JSON.stringify({ message: "Forbidden" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
        });
    }

    return null; // Auth passed
}

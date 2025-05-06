import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
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

// Permission check functions for client components
export const checkPermission = {
    // Check if user has admin permissions
    isAdmin: (session: any) => {
        return session?.user?.role === "ADMIN";
    },

    // Check if user has manager permissions or higher
    isManager: (session: any) => {
        return ["ADMIN", "MANAGER"].includes(session?.user?.role);
    },

    // Check if user has staff permissions or higher
    isStaff: (session: any) => {
        return ["ADMIN", "MANAGER", "STAFF"].includes(session?.user?.role);
    },

    // Check if user has specific role(s)
    hasRole: (session: any, roles: string[]) => {
        return roles.includes(session?.user?.role);
    },

    // Check if user is the owner of a resource
    isOwner: (session: any, resourceUserId: string) => {
        return session?.user?.id === resourceUserId;
    },

    // Check if user can manage a resource (is owner or admin)
    canManage: (session: any, resourceUserId: string) => {
        return (
            session?.user?.role === "ADMIN" ||
            session?.user?.id === resourceUserId
        );
    },
};

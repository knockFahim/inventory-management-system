"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { FiChevronLeft } from "react-icons/fi";
import SupplierForm from "@/components/forms/SupplierForm";

export default function NewSupplierPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    // Check if user has permission
    useEffect(() => {
        if (session?.user?.role === "STAFF") {
            router.push("/suppliers");
        }
    }, [session, router]);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center">
                    <button
                        onClick={() => router.back()}
                        className="mr-3 inline-flex items-center p-2 rounded-md hover:bg-gray-100"
                    >
                        <FiChevronLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-2xl font-bold text-black">
                        Add New Supplier
                    </h1>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                    <SupplierForm />
                </div>
            </div>
        </DashboardLayout>
    );
}

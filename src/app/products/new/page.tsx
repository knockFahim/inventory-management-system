"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProductForm from "@/components/forms/ProductForm";

export default function NewProductPage() {
    const { status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    if (status === "loading") {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Add New Product
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Enter the product details to add it to your inventory.
                    </p>
                </div>

                <div className="bg-white shadow-sm rounded-lg p-6">
                    <ProductForm />
                </div>
            </div>
        </DashboardLayout>
    );
}

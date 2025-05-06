"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProductForm from "@/components/forms/ProductForm";
import { FiChevronLeft } from "react-icons/fi";

export default function EditProductPage({
    params,
}: {
    params: { id: string };
}) {
    // Explicitly type and unwrap params using React.use()
    const unwrappedParams = React.use(
        params as unknown as Promise<{ id: string }>
    );
    const id = unwrappedParams.id;

    const { data: session, status } = useSession();
    const router = useRouter();

    // Redirect to login if not authenticated
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-bold text-black">
                        Edit Product
                    </h1>
                    <button
                        onClick={() => router.push(`/products/${id}`)}
                        className="mt-2 sm:mt-0 inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md bg-white hover:bg-gray-50"
                    >
                        <FiChevronLeft className="mr-1" /> Back to Product
                        Details
                    </button>
                </div>

                <div className="bg-white shadow-sm rounded-lg p-6">
                    <ProductForm productId={id} />
                </div>
            </div>
        </DashboardLayout>
    );
}

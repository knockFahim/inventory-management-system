"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
    FiChevronLeft,
    FiEdit2,
    FiTrash2,
    FiMail,
    FiPhone,
    FiMapPin,
    FiPackage,
    FiCalendar,
    FiDollarSign,
} from "react-icons/fi";

interface PurchaseItem {
    id: string;
    product: {
        name: string;
        sku: string;
    };
    quantity: number;
    costPrice: number;
    totalCost: number;
}

interface Purchase {
    id: string;
    invoiceNumber: string;
    date: string;
    totalAmount: number;
    status: "PENDING" | "COMPLETED" | "CANCELLED";
    purchaseItems: PurchaseItem[];
}

interface Supplier {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    createdAt: string;
    updatedAt: string;
    purchases: Purchase[];
    _count: {
        purchases: number;
    };
}

export default function SupplierDetailPage({
    params,
}: {
    params: { id: string };
}) {
    // Unwrap params using React.use()
    const { id } = React.use(params);
    const { data: session, status: authStatus } = useSession();
    const router = useRouter();
    const [supplier, setSupplier] = useState<Supplier | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    useEffect(() => {
        if (authStatus === "unauthenticated") {
            router.push("/login");
        }
    }, [authStatus, router]);

    useEffect(() => {
        if (authStatus === "authenticated" && id) {
            fetchSupplierDetails();
        }
    }, [authStatus, id]);

    const fetchSupplierDetails = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/suppliers/${id}`);

            if (!response.ok) {
                if (response.status === 404) {
                    toast.error("Supplier not found");
                    router.push("/suppliers");
                    return;
                }
                throw new Error("Failed to fetch supplier details");
            }

            const data = await response.json();
            setSupplier(data);
        } catch (error) {
            console.error("Error fetching supplier details:", error);
            toast.error("Failed to load supplier details");
        } finally {
            setIsLoading(false);
        }
    };

    const confirmDelete = () => {
        if (!supplier || supplier._count.purchases > 0) return;
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        try {
            const response = await fetch(`/api/suppliers/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to delete supplier");
            }

            toast.success("Supplier deleted successfully");
            router.push("/suppliers");
        } catch (error) {
            console.error("Error deleting supplier:", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to delete supplier"
            );
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case "COMPLETED":
                return "bg-green-100 text-green-800";
            case "PENDING":
                return "bg-yellow-100 text-yellow-800";
            case "CANCELLED":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-black";
        }
    };

    if (authStatus === "loading" || isLoading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (!supplier) {
        return (
            <DashboardLayout>
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="text-center py-12">
                        <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                vectorEffect="non-scaling-stroke"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                            />
                        </svg>
                        <h3 className="mt-2 text-lg font-medium text-black">
                            Supplier not found
                        </h3>
                        <p className="mt-1 text-sm text-black">
                            The supplier you're looking for doesn't exist or has
                            been removed.
                        </p>
                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={() => router.push("/suppliers")}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                Go to Suppliers
                            </button>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                    <div className="flex items-center">
                        <button
                            onClick={() => router.push("/suppliers")}
                            className="mr-3 inline-flex items-center p-2 rounded-md hover:bg-gray-100"
                        >
                            <FiChevronLeft className="h-5 w-5" />
                        </button>
                        <h1 className="text-2xl font-bold text-black">
                            {supplier.name}
                        </h1>
                    </div>
                    <div className="flex space-x-2">
                        {session?.user?.role !== "STAFF" && (
                            <button
                                onClick={() =>
                                    router.push(
                                        `/suppliers/edit/${supplier.id}`
                                    )
                                }
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <FiEdit2 className="mr-2 h-4 w-4" />
                                Edit
                            </button>
                        )}
                        {supplier._count.purchases === 0 &&
                            session?.user?.role === "ADMIN" && (
                                <button
                                    onClick={confirmDelete}
                                    className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                                >
                                    <FiTrash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </button>
                            )}
                    </div>
                </div>

                {/* Supplier Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Info */}
                    <div className="bg-white shadow overflow-hidden rounded-lg md:col-span-2">
                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                            <h3 className="text-lg leading-6 font-medium text-black">
                                Supplier Information
                            </h3>
                        </div>
                        <div className="px-4 py-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-sm font-medium text-gray-500">
                                    Name
                                </h4>
                                <p className="mt-1 text-sm text-black">
                                    {supplier.name}
                                </p>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-gray-500">
                                    Contact Information
                                </h4>
                                <div className="mt-1 space-y-1">
                                    {supplier.email ? (
                                        <p className="text-sm text-black flex items-center">
                                            <FiMail className="mr-2 h-4 w-4 text-gray-500" />
                                            {supplier.email}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-gray-400">
                                            No email provided
                                        </p>
                                    )}

                                    {supplier.phone ? (
                                        <p className="text-sm text-black flex items-center">
                                            <FiPhone className="mr-2 h-4 w-4 text-gray-500" />
                                            {supplier.phone}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-gray-400">
                                            No phone provided
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-gray-500">
                                    Address
                                </h4>
                                {supplier.address ? (
                                    <p className="mt-1 text-sm text-black flex items-start">
                                        <FiMapPin className="mr-2 h-4 w-4 text-gray-500 mt-0.5" />
                                        <span>{supplier.address}</span>
                                    </p>
                                ) : (
                                    <p className="mt-1 text-sm text-gray-400">
                                        No address provided
                                    </p>
                                )}
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-gray-500">
                                    Dates
                                </h4>
                                <div className="mt-1 space-y-1">
                                    <p className="text-sm text-black flex items-center">
                                        <FiCalendar className="mr-2 h-4 w-4 text-gray-500" />
                                        <span>
                                            Created:{" "}
                                            {formatDateTime(supplier.createdAt)}
                                        </span>
                                    </p>
                                    <p className="text-sm text-black flex items-center">
                                        <FiCalendar className="mr-2 h-4 w-4 text-gray-500" />
                                        <span>
                                            Last Updated:{" "}
                                            {formatDateTime(supplier.updatedAt)}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Card */}
                    <div className="bg-white shadow overflow-hidden rounded-lg">
                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                            <h3 className="text-lg leading-6 font-medium text-black">
                                Statistics
                            </h3>
                        </div>
                        <div className="px-4 py-5 sm:p-6">
                            <dl>
                                <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-200">
                                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                                        <FiPackage className="mr-2 h-5 w-5 text-blue-500" />
                                        Total Purchases
                                    </dt>
                                    <dd className="text-xl font-semibold text-black">
                                        {supplier._count.purchases}
                                    </dd>
                                </div>
                                {supplier._count.purchases > 0 && (
                                    <div className="flex items-center justify-between">
                                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                                            <FiDollarSign className="mr-2 h-5 w-5 text-green-500" />
                                            Recent Purchase
                                        </dt>
                                        <dd className="text-xl font-semibold text-black">
                                            $
                                            {supplier.purchases[0]?.totalAmount.toFixed(
                                                2
                                            ) || "N/A"}
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    </div>
                </div>

                {/* Purchase History */}
                {supplier.purchases.length > 0 && (
                    <div className="bg-white shadow overflow-hidden rounded-lg">
                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                            <h3 className="text-lg leading-6 font-medium text-black">
                                Recent Purchases
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Showing the last {supplier.purchases.length}{" "}
                                purchases from this supplier
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider"
                                        >
                                            Invoice #
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider"
                                        >
                                            Date
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-right text-xs font-medium text-black uppercase tracking-wider"
                                        >
                                            Amount
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-center text-xs font-medium text-black uppercase tracking-wider"
                                        >
                                            Status
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-center text-xs font-medium text-black uppercase tracking-wider"
                                        >
                                            Items
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {supplier.purchases.map((purchase) => (
                                        <tr key={purchase.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                                                {purchase.invoiceNumber}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                                                {formatDate(purchase.date)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-black">
                                                $
                                                {purchase.totalAmount.toFixed(
                                                    2
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span
                                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                                                        purchase.status
                                                    )}`}
                                                >
                                                    {purchase.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-black">
                                                {purchase.purchaseItems.length}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div
                            className="fixed inset-0 transition-opacity"
                            aria-hidden="true"
                            onClick={() => setIsDeleteModalOpen(false)}
                        >
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>

                        <span
                            className="hidden sm:inline-block sm:align-middle sm:h-screen"
                            aria-hidden="true"
                        >
                            &#8203;
                        </span>
                        <div
                            className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="modal-headline"
                        >
                            <div className="sm:flex sm:items-start">
                                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                    <FiTrash2
                                        className="h-6 w-6 text-red-600"
                                        aria-hidden="true"
                                    />
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                    <h3
                                        className="text-lg leading-6 font-medium text-black"
                                        id="modal-headline"
                                    >
                                        Delete Supplier
                                    </h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-black">
                                            Are you sure you want to delete{" "}
                                            {supplier.name}? This action cannot
                                            be undone.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={handleDelete}
                                >
                                    Delete
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-black hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
                                    onClick={() => setIsDeleteModalOpen(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

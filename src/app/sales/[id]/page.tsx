"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { FiChevronLeft, FiEdit2, FiPrinter, FiTrash2 } from "react-icons/fi";

interface SaleItem {
    id: string;
    productId: string;
    product: {
        id: string;
        name: string;
        sku: string;
    };
    quantity: number;
    price: number;
    totalPrice: number;
}

interface Sale {
    id: string;
    invoiceNumber: string;
    date: string;
    customer: {
        id: string;
        name: string;
        email?: string;
        phone?: string;
        address?: string;
    };
    user: {
        id: string;
        name: string;
    };
    totalAmount: number;
    discount: number;
    tax: number;
    status: "PENDING" | "COMPLETED" | "CANCELLED";
    paymentMethod: string;
    createdAt: string;
    updatedAt: string;
    saleItems: SaleItem[];
}

export default function SaleDetailPage({ params }: { params: { id: string } }) {
    const { data: session, status: authStatus } = useSession();
    const router = useRouter();
    const [sale, setSale] = useState<Sale | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (authStatus === "unauthenticated") {
            router.push("/login");
        }
    }, [authStatus, router]);

    useEffect(() => {
        if (authStatus === "authenticated" && params.id) {
            fetchSaleDetails();
        }
    }, [authStatus, params.id]);

    const fetchSaleDetails = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/sales/${params.id}`);

            if (!response.ok) {
                if (response.status === 404) {
                    toast.error("Sale not found");
                    router.push("/sales");
                    return;
                }
                throw new Error("Failed to fetch sale details");
            }

            const data = await response.json();
            setSale(data);
        } catch (error) {
            console.error("Error fetching sale details:", error);
            toast.error("Failed to load sale details");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteSale = async () => {
        if (!sale || sale.status === "COMPLETED") return;

        if (
            window.confirm(
                "Are you sure you want to delete this sale? This action cannot be undone."
            )
        ) {
            try {
                const response = await fetch(`/api/sales/${params.id}`, {
                    method: "DELETE",
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Failed to delete sale");
                }

                toast.success("Sale deleted successfully");
                router.push("/sales");
            } catch (error) {
                console.error("Error deleting sale:", error);
                toast.error(
                    error instanceof Error
                        ? error.message
                        : "Failed to delete sale"
                );
            }
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

    const formatPaymentMethod = (method: string) => {
        return method.replace(/_/g, " ");
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
                return "bg-gray-100 text-gray-800";
        }
    };

    const calculateSubtotal = () => {
        if (!sale?.saleItems) return 0;
        return sale.saleItems.reduce((sum, item) => sum + item.totalPrice, 0);
    };

    const calculateDiscountAmount = () => {
        if (!sale) return 0;
        return (calculateSubtotal() * sale.discount) / 100;
    };

    const calculateTaxAmount = () => {
        if (!sale) return 0;
        return (
            ((calculateSubtotal() - calculateDiscountAmount()) * sale.tax) / 100
        );
    };

    const printInvoice = () => {
        window.print();
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

    if (!sale) {
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
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-black">
                            No sale found
                        </h3>
                        <p className="mt-1 text-sm text-black">
                            This sale might have been deleted or doesn't exist.
                        </p>
                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={() => router.push("/sales")}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <FiChevronLeft
                                    className="-ml-1 mr-2 h-5 w-5"
                                    aria-hidden="true"
                                />
                                Back to Sales
                            </button>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 print:p-10 print:shadow-none">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 print:hidden">
                    <div className="flex items-center">
                        <button
                            onClick={() => router.push("/sales")}
                            className="mr-3 inline-flex items-center p-2 rounded-md hover:bg-gray-100"
                        >
                            <FiChevronLeft className="h-5 w-5" />
                        </button>
                        <h1 className="text-2xl font-bold text-black">
                            Invoice #{sale.invoiceNumber}
                        </h1>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={printInvoice}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <FiPrinter className="mr-2 h-4 w-4" />
                            Print Invoice
                        </button>
                        {sale.status !== "COMPLETED" && (
                            <>
                                <button
                                    onClick={() =>
                                        router.push(`/sales/edit/${sale.id}`)
                                    }
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    <FiEdit2 className="mr-2 h-4 w-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={handleDeleteSale}
                                    className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                                >
                                    <FiTrash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Invoice Content */}
                <div className="bg-white shadow rounded-lg overflow-hidden print:shadow-none">
                    {/* Invoice Header */}
                    <div className="px-6 py-5 border-b border-gray-200 print:flex print:justify-between">
                        <div className="print:flex-1">
                            <div className="text-xl font-bold text-gray-900 mb-6 print:mb-0">
                                INVOICE
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-sm font-medium uppercase text-black">
                                        Invoice To
                                    </h3>
                                    <div className="mt-1">
                                        <p className="text-base font-medium text-black">
                                            {sale.customer.name}
                                        </p>
                                        {sale.customer.email && (
                                            <p className="text-sm text-black">
                                                {sale.customer.email}
                                            </p>
                                        )}
                                        {sale.customer.phone && (
                                            <p className="text-sm text-black">
                                                {sale.customer.phone}
                                            </p>
                                        )}
                                        {sale.customer.address && (
                                            <p className="text-sm text-black">
                                                {sale.customer.address}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="md:text-right">
                                    <h3 className="text-sm font-medium uppercase text-black">
                                        Invoice Details
                                    </h3>
                                    <div className="mt-1 space-y-1">
                                        <p className="text-sm text-black">
                                            <span className="font-medium">
                                                Invoice #:
                                            </span>{" "}
                                            {sale.invoiceNumber}
                                        </p>
                                        <p className="text-sm text-black">
                                            <span className="font-medium">
                                                Date:
                                            </span>{" "}
                                            {formatDate(sale.date)}
                                        </p>
                                        <p className="text-sm text-black">
                                            <span className="font-medium">
                                                Status:
                                            </span>{" "}
                                            <span
                                                className={`inline-flex px-2 text-xs font-semibold rounded-full ${getStatusBadgeClass(
                                                    sale.status
                                                )}`}
                                            >
                                                {sale.status}
                                            </span>
                                        </p>
                                        <p className="text-sm text-black">
                                            <span className="font-medium">
                                                Payment Method:
                                            </span>{" "}
                                            {formatPaymentMethod(
                                                sale.paymentMethod
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 print:mt-0 print:flex-none print:pl-10">
                            <h3 className="text-sm font-medium uppercase text-black print:text-right">
                                Company
                            </h3>
                            <div className="mt-1 print:text-right">
                                <p className="text-base font-medium text-black">
                                    Your Company Name
                                </p>
                                <p className="text-sm text-black">
                                    123 Business Street
                                </p>
                                <p className="text-sm text-black">
                                    City, State 12345
                                </p>
                                <p className="text-sm text-black">
                                    contact@yourcompany.com
                                </p>
                                <p className="text-sm text-black">
                                    (123) 456-7890
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Invoice Items */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider"
                                    >
                                        Item
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-center text-xs font-medium text-black uppercase tracking-wider"
                                    >
                                        Quantity
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-center text-xs font-medium text-black uppercase tracking-wider"
                                    >
                                        Unit Price
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-right text-xs font-medium text-black uppercase tracking-wider"
                                    >
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {sale.saleItems.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-black">
                                                {item.product.name}
                                            </div>
                                            <div className="text-xs text-black">
                                                SKU: {item.product.sku}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-black">
                                            {item.quantity}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-black">
                                            ${item.price.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-black">
                                            ${item.totalPrice.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Invoice Summary */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <div className="flex flex-col md:w-1/2 ml-auto">
                            <div className="flex justify-between py-2 text-sm">
                                <span className="text-black">Subtotal:</span>
                                <span className="font-medium text-black">
                                    ${calculateSubtotal().toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between py-2 text-sm">
                                <span className="text-black">
                                    Discount ({sale.discount}%):
                                </span>
                                <span className="font-medium text-black">
                                    -${calculateDiscountAmount().toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between py-2 text-sm">
                                <span className="text-black">
                                    Tax ({sale.tax}%):
                                </span>
                                <span className="font-medium text-black">
                                    ${calculateTaxAmount().toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between py-2 text-base font-medium border-t border-gray-200 mt-2 pt-2">
                                <span>Total:</span>
                                <span className="text-black">
                                    ${sale.totalAmount.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-200">
                        <div className="text-sm text-black">
                            <p className="mb-2">
                                <span className="font-medium">Created by:</span>{" "}
                                {sale.user.name}
                            </p>
                            <p className="mb-2">
                                <span className="font-medium">Created on:</span>{" "}
                                {formatDateTime(sale.createdAt)}
                            </p>
                            <p>
                                <span className="font-medium">
                                    Last updated:
                                </span>{" "}
                                {formatDateTime(sale.updatedAt)}
                            </p>
                            <div className="mt-4 print:mt-6 text-center">
                                <p className="text-sm text-black">
                                    Thank you for your business!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
    FiPlus,
    FiSearch,
    FiDownload,
    FiEye,
    FiEdit2,
    FiTrash2,
} from "react-icons/fi";

interface SaleItem {
    id: string;
    productId: string;
    product: {
        id: string;
        name: string;
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
    };
    totalAmount: number;
    status: "PENDING" | "COMPLETED" | "CANCELLED";
    paymentMethod: string;
    discount: number;
    tax: number;
    saleItems: SaleItem[];
}

interface PaginationData {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function SalesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [sales, setSales] = useState<Sale[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationData>({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
    });

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        if (status === "authenticated") {
            fetchSales();
        }
    }, [status, currentPage, searchTerm, dateFilter, statusFilter]);

    const fetchSales = async () => {
        setIsLoading(true);
        try {
            // Build query string with filters
            const params = new URLSearchParams();
            params.append("page", currentPage.toString());
            params.append("limit", "10");

            if (searchTerm) {
                params.append("query", searchTerm);
            }

            if (dateFilter) {
                params.append("date", dateFilter);
            }

            if (statusFilter) {
                params.append("status", statusFilter);
            }

            // Fetch from API
            const response = await fetch(`/api/sales?${params.toString()}`);
            if (!response.ok) {
                throw new Error("Failed to fetch sales");
            }

            const data = await response.json();
            setSales(data.sales);
            setPagination(data.pagination);
        } catch (error) {
            console.error("Error fetching sales:", error);
            toast.error("Failed to load sales data");
        } finally {
            setIsLoading(false);
        }
    };

    const deleteSale = async (saleId: string) => {
        if (
            window.confirm(
                "Are you sure you want to delete this sale? This action cannot be undone."
            )
        ) {
            try {
                const response = await fetch(`/api/sales/${saleId}`, {
                    method: "DELETE",
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Failed to delete sale");
                }

                toast.success("Sale deleted successfully");
                fetchSales(); // Refresh the list
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

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const formatPaymentMethod = (method: string) => {
        return method.replace(/_/g, " ");
    };

    if (status === "loading" || isLoading) {
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                    <h1 className="text-2xl font-bold text-primary">
                        Sales Management
                    </h1>
                    <button
                        onClick={() => router.push("/sales/new")}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark"
                    >
                        <FiPlus className="mr-2 h-5 w-5" />
                        New Sale
                    </button>
                </div>

                {/* Search and filters */}
                <div className="bg-white shadow rounded-lg p-4 space-y-4">
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiSearch className="h-5 w-5 text-tertiary" />
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-tertiary focus:outline-none focus:placeholder-text-disabled focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                                placeholder="Search by invoice # or customer"
                            />
                        </div>

                        <div className="sm:w-1/4">
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                                aria-label="Filter by date"
                            />
                        </div>

                        <div className="sm:w-1/4">
                            <select
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(e.target.value)
                                }
                                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                                aria-label="Filter by status"
                            >
                                <option value="">All Statuses</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="PENDING">Pending</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Sales Table */}
                <div className="bg-white shadow overflow-hidden rounded-lg">
                    <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
                        <h3 className="text-lg leading-6 font-medium text-primary">
                            Recent Sales
                        </h3>
                        <button className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-secondary bg-white hover:bg-gray-50">
                            <FiDownload className="mr-2 h-4 w-4" />
                            Export
                        </button>
                    </div>

                    {sales.length === 0 ? (
                        <div className="text-center py-12">
                            <svg
                                className="mx-auto h-12 w-12 text-tertiary"
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
                            <h3 className="mt-2 text-sm font-medium text-primary">
                                No sales found
                            </h3>
                            <p className="mt-1 text-sm text-tertiary">
                                Get started by creating a new sale.
                            </p>
                            <div className="mt-6">
                                <button
                                    type="button"
                                    onClick={() => router.push("/sales/new")}
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                >
                                    <FiPlus
                                        className="-ml-1 mr-2 h-5 w-5"
                                        aria-hidden="true"
                                    />
                                    New Sale
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-tertiary uppercase tracking-wider"
                                        >
                                            Invoice #
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-tertiary uppercase tracking-wider"
                                        >
                                            Date
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-tertiary uppercase tracking-wider"
                                        >
                                            Customer
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-tertiary uppercase tracking-wider"
                                        >
                                            Amount
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-tertiary uppercase tracking-wider"
                                        >
                                            Status
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-tertiary uppercase tracking-wider"
                                        >
                                            Payment Method
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-right text-xs font-medium text-tertiary uppercase tracking-wider"
                                        >
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {sales.map((sale) => (
                                        <tr key={sale.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                                                {sale.invoiceNumber}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-tertiary">
                                                {formatDate(sale.date)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-primary">
                                                {sale.customer?.name || "N/A"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-primary">
                                                ${sale.totalAmount.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                                                        sale.status
                                                    )}`}
                                                >
                                                    {sale.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-tertiary">
                                                {formatPaymentMethod(
                                                    sale.paymentMethod
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() =>
                                                            router.push(
                                                                `/sales/${sale.id}`
                                                            )
                                                        }
                                                        className="text-brand hover:text-primary-dark"
                                                        title="View"
                                                    >
                                                        <FiEye className="h-5 w-5" />
                                                    </button>
                                                    {sale.status !==
                                                        "COMPLETED" && (
                                                        <>
                                                            <button
                                                                onClick={() =>
                                                                    router.push(
                                                                        `/sales/edit/${sale.id}`
                                                                    )
                                                                }
                                                                className="text-brand hover:text-primary-dark"
                                                                title="Edit"
                                                            >
                                                                <FiEdit2 className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    deleteSale(
                                                                        sale.id
                                                                    )
                                                                }
                                                                className="text-error hover:text-red-700"
                                                                title="Delete"
                                                            >
                                                                <FiTrash2 className="h-5 w-5" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {sales.length > 0 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-secondary">
                                    Showing{" "}
                                    <span className="font-medium">
                                        {(pagination.page - 1) *
                                            pagination.limit +
                                            1}
                                    </span>{" "}
                                    to{" "}
                                    <span className="font-medium">
                                        {Math.min(
                                            pagination.page * pagination.limit,
                                            pagination.total
                                        )}
                                    </span>{" "}
                                    of{" "}
                                    <span className="font-medium">
                                        {pagination.total}
                                    </span>{" "}
                                    results
                                </p>
                            </div>
                            <div>
                                <nav
                                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                                    aria-label="Pagination"
                                >
                                    <button
                                        onClick={() =>
                                            setCurrentPage(
                                                Math.max(1, currentPage - 1)
                                            )
                                        }
                                        disabled={currentPage <= 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-tertiary hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        <span className="sr-only">
                                            Previous
                                        </span>
                                        <svg
                                            className="h-5 w-5"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                            aria-hidden="true"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </button>

                                    {/* Page numbers */}
                                    {Array.from(
                                        {
                                            length: Math.min(
                                                5,
                                                pagination.totalPages
                                            ),
                                        },
                                        (_, i) => {
                                            // Show pages around current page
                                            let pageNum = i + 1;
                                            if (pagination.totalPages > 5) {
                                                if (currentPage > 3) {
                                                    pageNum =
                                                        currentPage - 3 + i + 1;
                                                }
                                                // Don't show more than total pages
                                                if (
                                                    pageNum >
                                                    pagination.totalPages
                                                ) {
                                                    return null;
                                                }
                                            }

                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() =>
                                                        setCurrentPage(pageNum)
                                                    }
                                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                        currentPage === pageNum
                                                            ? "z-10 bg-blue-50 border-primary text-brand"
                                                            : "bg-white border-gray-300 text-tertiary hover:bg-gray-50"
                                                    }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        }
                                    )}

                                    <button
                                        onClick={() =>
                                            setCurrentPage(
                                                Math.min(
                                                    pagination.totalPages,
                                                    currentPage + 1
                                                )
                                            )
                                        }
                                        disabled={
                                            currentPage >= pagination.totalPages
                                        }
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-tertiary hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        <span className="sr-only">Next</span>
                                        <svg
                                            className="h-5 w-5"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                            aria-hidden="true"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4-4a1 1 0 01-1.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

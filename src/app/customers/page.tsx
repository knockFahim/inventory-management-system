"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import {
    FiPlus,
    FiSearch,
    FiDownload,
    FiEdit2,
    FiTrash2,
    FiEye,
} from "react-icons/fi";
import DashboardLayout from "@/components/layout/DashboardLayout";

interface Customer {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    createdAt: string;
    updatedAt: string;
}

interface PaginationData {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function CustomersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationData>({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
    });

    // Items per page for client-side pagination
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        if (status === "authenticated") {
            fetchCustomers();
        }
    }, [status]);

    const fetchCustomers = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/customers?limit=1000`);
            if (!response.ok) {
                throw new Error("Failed to fetch customers");
            }

            const data = await response.json();
            setCustomers(data.customers);
            setFilteredCustomers(data.customers);

            setPagination({
                total: data.customers.length,
                page: 1,
                limit: ITEMS_PER_PAGE,
                totalPages: Math.ceil(data.customers.length / ITEMS_PER_PAGE),
            });
        } catch (error) {
            console.error("Error fetching customers:", error);
            toast.error("Failed to load customers data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!customers.length) return;

        let filtered = [...customers];

        if (searchTerm) {
            const lowerSearchTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (customer) =>
                    customer.name.toLowerCase().includes(lowerSearchTerm) ||
                    (customer.email &&
                        customer.email
                            .toLowerCase()
                            .includes(lowerSearchTerm)) ||
                    (customer.phone &&
                        customer.phone.toLowerCase().includes(lowerSearchTerm))
            );
        }

        setPagination({
            total: filtered.length,
            page: 1,
            limit: ITEMS_PER_PAGE,
            totalPages: Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1,
        });

        setCurrentPage(1);
        setFilteredCustomers(filtered);
    }, [searchTerm, customers]);

    const getCurrentPageItems = () => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredCustomers.slice(startIndex, endIndex);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const deleteCustomer = async (customerId: string) => {
        if (
            window.confirm(
                "Are you sure you want to delete this customer? This action cannot be undone."
            )
        ) {
            try {
                const response = await fetch(`/api/customers/${customerId}`, {
                    method: "DELETE",
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(
                        errorData.error || "Failed to delete customer"
                    );
                }

                toast.success("Customer deleted successfully");

                // Update the customers list
                const updatedCustomers = customers.filter(
                    (customer) => customer.id !== customerId
                );
                setCustomers(updatedCustomers);

                // Update filtered customers too
                const updatedFilteredCustomers = filteredCustomers.filter(
                    (customer) => customer.id !== customerId
                );
                setFilteredCustomers(updatedFilteredCustomers);

                // Update pagination
                setPagination({
                    ...pagination,
                    total: updatedFilteredCustomers.length,
                    totalPages:
                        Math.ceil(
                            updatedFilteredCustomers.length / ITEMS_PER_PAGE
                        ) || 1,
                });

                // Adjust current page if needed
                if (
                    currentPage >
                    Math.ceil(updatedFilteredCustomers.length / ITEMS_PER_PAGE)
                ) {
                    setCurrentPage(
                        Math.max(
                            1,
                            Math.ceil(
                                updatedFilteredCustomers.length / ITEMS_PER_PAGE
                            )
                        )
                    );
                }
            } catch (error) {
                console.error("Error deleting customer:", error);
                toast.error(
                    error instanceof Error
                        ? error.message
                        : "Failed to delete customer"
                );
            }
        }
    };

    // Function to convert customers data to CSV format
    const convertToCSV = (customers: Customer[]) => {
        if (customers.length === 0) return "";

        // Define CSV header
        const header = [
            "Name",
            "Email",
            "Phone",
            "Address",
            "City",
            "State",
            "Country",
            "Created Date",
        ].join(",");

        // Convert each customer to a CSV row
        const rows = customers.map((customer) => {
            const createdDate = new Date(
                customer.createdAt
            ).toLocaleDateString();

            return [
                `"${customer.name}"`,
                `"${customer.email || ""}"`,
                `"${customer.phone || ""}"`,
                `"${customer.address || ""}"`,
                `"${customer.city || ""}"`,
                `"${customer.state || ""}"`,
                `"${customer.country || ""}"`,
                `"${createdDate}"`,
            ].join(",");
        });

        // Combine header and rows
        return header + "\n" + rows.join("\n");
    };

    // Function to export customers data as CSV file
    const exportCustomersData = () => {
        try {
            // Apply the current filters for the export
            const dataToExport = filteredCustomers;

            // If there's no data to export, show a message
            if (dataToExport.length === 0) {
                toast.info("No data to export");
                return;
            }

            const csvData = convertToCSV(dataToExport);
            const blob = new Blob([csvData], {
                type: "text/csv;charset=utf-8;",
            });
            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute(
                "download",
                `customers_${new Date().toISOString().split("T")[0]}.csv`
            );
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success("Export completed successfully");
        } catch (error) {
            console.error("Error exporting customers data:", error);
            toast.error("Failed to export customers data");
        }
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

    const currentItems = getCurrentPageItems();

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                    <h1 className="text-2xl font-bold text-primary">
                        Customer Management
                    </h1>
                    <button
                        onClick={() => router.push("/customers/new")}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                        <FiPlus className="mr-2 h-5 w-5" />
                        Add Customer
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 mb-4">
                    <div className="relative w-full sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiSearch className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search customers..."
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>

                    <button
                        onClick={exportCustomersData}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-secondary bg-white hover:bg-gray-50"
                    >
                        <FiDownload className="mr-2 h-4 w-4" />
                        Export
                    </button>
                </div>

                <div className="bg-white shadow overflow-hidden rounded-lg">
                    <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
                        <h3 className="text-lg leading-6 font-medium text-primary">
                            Customers
                        </h3>
                        <span className="text-sm text-gray-500">
                            Total: {filteredCustomers.length}
                        </span>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="px-4 py-5 text-center">
                            <p className="text-gray-500">No customers found</p>
                            {searchTerm && (
                                <div className="mt-2">
                                    <button
                                        onClick={() => setSearchTerm("")}
                                        className="text-blue-500 hover:text-blue-700 text-sm"
                                    >
                                        Clear search
                                    </button>
                                </div>
                            )}
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
                                            Name
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-tertiary uppercase tracking-wider"
                                        >
                                            Contact
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-tertiary uppercase tracking-wider"
                                        >
                                            Location
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-tertiary uppercase tracking-wider"
                                        >
                                            Created
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
                                    {currentItems.map((customer) => (
                                        <tr key={customer.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                                                {customer.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-primary">
                                                    {customer.email || "-"}
                                                </div>
                                                <div className="text-sm text-tertiary">
                                                    {customer.phone || "-"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-tertiary">
                                                {customer.city ? (
                                                    <>
                                                        {customer.city}
                                                        {customer.state &&
                                                            `, ${customer.state}`}
                                                        {customer.country &&
                                                            ` (${customer.country})`}
                                                    </>
                                                ) : (
                                                    "-"
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-tertiary">
                                                {new Date(
                                                    customer.createdAt
                                                ).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() =>
                                                            router.push(
                                                                `/customers/${customer.id}`
                                                            )
                                                        }
                                                        className="text-brand hover:text-primary-dark"
                                                        title="View"
                                                    >
                                                        <FiEye className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            router.push(
                                                                `/customers/edit/${customer.id}`
                                                            )
                                                        }
                                                        className="text-brand hover:text-primary-dark"
                                                        title="Edit"
                                                    >
                                                        <FiEdit2 className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            deleteCustomer(
                                                                customer.id
                                                            )
                                                        }
                                                        className="text-error hover:text-red-700"
                                                        title="Delete"
                                                    >
                                                        <FiTrash2 className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {filteredCustomers.length > 0 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-secondary">
                                    Showing{" "}
                                    <span className="font-medium">
                                        {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                                    </span>{" "}
                                    to{" "}
                                    <span className="font-medium">
                                        {Math.min(
                                            currentPage * ITEMS_PER_PAGE,
                                            filteredCustomers.length
                                        )}
                                    </span>{" "}
                                    of{" "}
                                    <span className="font-medium">
                                        {filteredCustomers.length}
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
                                            handlePageChange(currentPage - 1)
                                        }
                                        disabled={currentPage === 1}
                                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                                            currentPage === 1
                                                ? "text-gray-300 cursor-not-allowed"
                                                : "text-gray-500 hover:bg-gray-50"
                                        }`}
                                    >
                                        <span className="sr-only">
                                            Previous
                                        </span>
                                        &larr;
                                    </button>

                                    {/* Display page numbers */}
                                    {Array.from(
                                        { length: pagination.totalPages },
                                        (_, i) => i + 1
                                    ).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() =>
                                                handlePageChange(page)
                                            }
                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                currentPage === page
                                                    ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                                    : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    ))}

                                    <button
                                        onClick={() =>
                                            handlePageChange(currentPage + 1)
                                        }
                                        disabled={
                                            currentPage ===
                                            pagination.totalPages
                                        }
                                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                                            currentPage ===
                                            pagination.totalPages
                                                ? "text-gray-300 cursor-not-allowed"
                                                : "text-gray-500 hover:bg-gray-50"
                                        }`}
                                    >
                                        <span className="sr-only">Next</span>
                                        &rarr;
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

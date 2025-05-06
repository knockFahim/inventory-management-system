"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { FiChevronLeft, FiEdit2, FiTrash2 } from "react-icons/fi";

interface Sale {
    id: string;
    invoiceNumber: string;
    date: string;
    totalAmount: number;
    status: string;
    paymentMethod: string;
    createdAt: string;
}

interface Customer {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    houseNumber: string | null;
    road: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    sales?: Sale[];
}

export default function CustomerDetailPage({
    params,
}: {
    params: { id: string };
}) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { id } = React.use(params);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        if (status === "authenticated") {
            fetchCustomerDetails();
        }
    }, [status, id]);

    const fetchCustomerDetails = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/customers/${id}`);
            if (!response.ok) {
                throw new Error("Failed to fetch customer details");
            }

            const data = await response.json();
            setCustomer(data);
        } catch (error) {
            console.error("Error fetching customer details:", error);
            toast.error("Failed to load customer details");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteCustomer = async () => {
        if (
            window.confirm(
                "Are you sure you want to delete this customer? This action cannot be undone."
            )
        ) {
            try {
                const response = await fetch(`/api/customers/${id}`, {
                    method: "DELETE",
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(
                        errorData.error || "Failed to delete customer"
                    );
                }

                toast.success("Customer deleted successfully");
                router.push("/customers");
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

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
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
                return "bg-gray-100 text-black";
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

    if (!customer) {
        return (
            <DashboardLayout>
                <div className="text-center py-10">
                    <h2 className="text-2xl font-bold text-red-600">
                        Customer not found
                    </h2>
                    <p className="mt-2 text-gray-500">
                        The customer you are looking for does not exist or has
                        been deleted.
                    </p>
                    <button
                        onClick={() => router.push("/customers")}
                        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                        Back to Customers
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header with actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                    <div className="flex items-center">
                        <button
                            onClick={() => router.push("/customers")}
                            className="mr-3 inline-flex items-center p-2 rounded-md hover:bg-gray-100"
                        >
                            <FiChevronLeft className="h-5 w-5" />
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Customer Profile
                        </h1>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() =>
                                router.push(`/customers/edit/${customer.id}`)
                            }
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                        >
                            <FiEdit2 className="mr-2 h-5 w-5" />
                            Edit
                        </button>
                        <button
                            onClick={handleDeleteCustomer}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                        >
                            <FiTrash2 className="mr-2 h-5 w-5" />
                            Delete
                        </button>
                    </div>
                </div>

                {/* Customer Information Card */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            {customer.name}
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            Customer since {formatDate(customer.createdAt)}
                        </p>
                    </div>
                    <div className="border-t border-gray-200">
                        <dl>
                            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">
                                    Full name
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {customer.name}
                                </dd>
                            </div>
                            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">
                                    Email address
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {customer.email || "N/A"}
                                </dd>
                            </div>
                            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">
                                    Phone number
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {customer.phone || "N/A"}
                                </dd>
                            </div>
                            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">
                                    Address
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {customer.houseNumber ||
                                    customer.road ||
                                    customer.city ? (
                                        <div>
                                            {customer.houseNumber && (
                                                <span>
                                                    {customer.houseNumber}{" "}
                                                </span>
                                            )}
                                            {customer.road && (
                                                <span>{customer.road}, </span>
                                            )}
                                            {customer.city && (
                                                <span>{customer.city}, </span>
                                            )}
                                            {customer.state && (
                                                <span>{customer.state} </span>
                                            )}
                                            {customer.postalCode && (
                                                <span>
                                                    {customer.postalCode},{" "}
                                                </span>
                                            )}
                                            {customer.country && (
                                                <span>{customer.country}</span>
                                            )}
                                        </div>
                                    ) : (
                                        customer.address ||
                                        "No address provided"
                                    )}
                                </dd>
                            </div>
                            {customer.notes && (
                                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">
                                        Notes
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        {customer.notes}
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>

                {/* Customer Purchase History */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Purchase History
                        </h3>
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {customer.sales?.length || 0} orders
                        </span>
                    </div>
                    <div className="border-t border-gray-200">
                        {customer.sales && customer.sales.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                Invoice
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                Date
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                Amount
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                Status
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                Payment Method
                                            </th>
                                            <th
                                                scope="col"
                                                className="relative px-6 py-3"
                                            >
                                                <span className="sr-only">
                                                    View
                                                </span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {customer.sales.map((sale) => (
                                            <tr key={sale.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {sale.invoiceNumber}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(sale.date)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    $
                                                    {sale.totalAmount.toFixed(
                                                        2
                                                    )}
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
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatPaymentMethod(
                                                        sale.paymentMethod
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() =>
                                                            router.push(
                                                                `/sales/${sale.id}`
                                                            )
                                                        }
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-500">
                                    No purchase history found
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

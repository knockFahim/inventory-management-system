"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
    FiPlus,
    FiSearch,
    FiEdit2,
    FiTrash2,
    FiMail,
    FiPhone,
    FiMapPin,
    FiPackage,
} from "react-icons/fi";

interface Supplier {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    createdAt: string;
    updatedAt: string;
    _count: {
        purchases: number;
    };
}

export default function SuppliersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOption, setSortOption] = useState("name:asc");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(
        null
    );

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        if (status === "authenticated") {
            fetchSuppliers();
        }
    }, [status, sortOption]);

    const fetchSuppliers = async () => {
        setIsLoading(true);
        try {
            // Use the sort parameter to fetch sorted suppliers
            const response = await fetch(`/api/suppliers?sort=${sortOption}`);

            if (!response.ok) {
                throw new Error("Failed to fetch suppliers");
            }

            const data = await response.json();
            setSuppliers(data);
            setFilteredSuppliers(data);
        } catch (error) {
            console.error("Error fetching suppliers:", error);
            toast.error("Failed to load suppliers");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Filter suppliers based on search term
        if (!searchTerm) {
            setFilteredSuppliers(suppliers);
            return;
        }

        const lowerSearchTerm = searchTerm.toLowerCase();
        const filtered = suppliers.filter(
            (supplier) =>
                supplier.name.toLowerCase().includes(lowerSearchTerm) ||
                (supplier.email &&
                    supplier.email.toLowerCase().includes(lowerSearchTerm)) ||
                (supplier.phone &&
                    supplier.phone.toLowerCase().includes(lowerSearchTerm)) ||
                (supplier.address &&
                    supplier.address.toLowerCase().includes(lowerSearchTerm))
        );

        setFilteredSuppliers(filtered);
    }, [searchTerm, suppliers]);

    const handleSearch = (event: React.FormEvent) => {
        event.preventDefault();
        // The useEffect will handle filtering
    };

    const confirmDelete = (supplier: Supplier) => {
        setSupplierToDelete(supplier);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!supplierToDelete) return;

        try {
            const response = await fetch(
                `/api/suppliers/${supplierToDelete.id}`,
                {
                    method: "DELETE",
                }
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to delete supplier");
            }

            toast.success("Supplier deleted successfully");
            fetchSuppliers(); // Refresh the list
            setIsDeleteModalOpen(false);
        } catch (error: any) {
            console.error("Error deleting supplier:", error);
            toast.error(error.message || "Error deleting supplier");
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

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                    <h1 className="text-2xl font-bold text-primary">
                        Supplier Management
                    </h1>
                    <button
                        onClick={() => router.push("/suppliers/new")}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                        <FiPlus className="mr-2 h-5 w-5" />
                        Add Supplier
                    </button>
                </div>

                <div className="bg-white shadow rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
                        <form
                            onSubmit={handleSearch}
                            className="relative w-full sm:w-96"
                        >
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiSearch className="h-5 w-5 text-black" />
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Search suppliers by name, email, or phone"
                            />
                        </form>

                        <div>
                            <label htmlFor="sortOrder" className="sr-only">
                                Sort
                            </label>
                            <select
                                id="sortOrder"
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value)}
                                className="block w-full pl-3 pr-10 py-2 text-base text-gray-700 border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            >
                                <option
                                    value="name:asc"
                                    className="text-gray-700"
                                >
                                    Name (A-Z)
                                </option>
                                <option
                                    value="name:desc"
                                    className="text-gray-700"
                                >
                                    Name (Z-A)
                                </option>
                                <option
                                    value="createdAt:desc"
                                    className="text-gray-700"
                                >
                                    Newest First
                                </option>
                                <option
                                    value="createdAt:asc"
                                    className="text-gray-700"
                                >
                                    Oldest First
                                </option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow overflow-hidden rounded-lg">
                    {filteredSuppliers.length === 0 ? (
                        <div className="py-12">
                            <div className="text-center">
                                <FiPackage className="mx-auto h-12 w-12 text-black" />
                                <h3 className="mt-2 text-lg font-medium text-black">
                                    No suppliers found
                                </h3>
                                <p className="mt-1 text-sm text-black">
                                    {searchTerm
                                        ? "Try changing your search criteria"
                                        : "Get started by adding your first supplier"}
                                </p>
                                {!searchTerm && (
                                    <div className="mt-6">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                router.push("/suppliers/new")
                                            }
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                                        >
                                            <FiPlus className="mr-2 h-5 w-5" />
                                            Add Supplier
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider"
                                        >
                                            Name
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider"
                                        >
                                            Contact Info
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider"
                                        >
                                            Purchases
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-right text-xs font-medium text-black uppercase tracking-wider"
                                        >
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredSuppliers.map((supplier) => (
                                        <tr key={supplier.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-black">
                                                    {supplier.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col text-sm text-black">
                                                    {supplier.email && (
                                                        <div className="flex items-center">
                                                            <FiMail className="mr-1 h-4 w-4" />
                                                            <span>
                                                                {supplier.email}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {supplier.phone && (
                                                        <div className="flex items-center mt-1">
                                                            <FiPhone className="mr-1 h-4 w-4" />
                                                            <span>
                                                                {supplier.phone}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {supplier.address && (
                                                        <div className="flex items-center mt-1">
                                                            <FiMapPin className="mr-1 h-4 w-4" />
                                                            <span>
                                                                {
                                                                    supplier.address
                                                                }
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                                                <div className="flex items-center">
                                                    <FiPackage className="mr-1 h-4 w-4" />
                                                    <span>
                                                        {
                                                            supplier._count
                                                                .purchases
                                                        }
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() =>
                                                            router.push(
                                                                `/suppliers/${supplier.id}`
                                                            )
                                                        }
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="View Details"
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            router.push(
                                                                `/suppliers/edit/${supplier.id}`
                                                            )
                                                        }
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="Edit"
                                                    >
                                                        <FiEdit2 className="h-5 w-5" />
                                                    </button>
                                                    {supplier._count
                                                        .purchases === 0 &&
                                                        session?.user?.role ===
                                                            "ADMIN" && (
                                                            <button
                                                                onClick={() =>
                                                                    confirmDelete(
                                                                        supplier
                                                                    )
                                                                }
                                                                className="text-red-600 hover:text-red-900"
                                                                title="Delete"
                                                            >
                                                                <FiTrash2 className="h-5 w-5" />
                                                            </button>
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
            </div>

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && supplierToDelete && (
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
                                            {supplierToDelete.name}? This action
                                            cannot be undone.
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

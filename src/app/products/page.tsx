"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "react-toastify";
import {
    FiSearch,
    FiPlusCircle,
    FiEdit2,
    FiTrash2,
    FiFilter,
} from "react-icons/fi";
import DashboardLayout from "@/components/layout/DashboardLayout";

interface Product {
    id: string;
    name: string;
    sku: string;
    price: number;
    costPrice: number;
    quantity: number;
    minimumStock: number;
    description?: string;
    category: {
        id: string;
        name: string;
    };
    createdAt: string;
    updatedAt: string;
}

interface Category {
    id: string;
    name: string;
}

export default function ProductsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [showLowStock, setShowLowStock] = useState(false);
    const [sortOption, setSortOption] = useState("name:asc");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<Product | null>(
        null
    );

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    // Fetch products with filtering
    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            let url = `/api/products?sort=${sortOption}`;

            if (searchTerm) {
                url += `&search=${encodeURIComponent(searchTerm)}`;
            }

            if (selectedCategory) {
                url += `&categoryId=${selectedCategory}`;
            }

            if (showLowStock) {
                url += "&lowStock=true";
            }

            const response = await axios.get(url);
            setProducts(response.data);
        } catch (error) {
            console.error("Error fetching products:", error);
            toast.error("Failed to load products");
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch categories for filter dropdown
    const fetchCategories = async () => {
        try {
            // In a real app, this would fetch from a categories API endpoint
            // For now, we'll use dummy data
            setCategories([
                { id: "1", name: "Groceries" },
                { id: "2", name: "Dairy" },
                { id: "3", name: "Bakery" },
                { id: "4", name: "Beverages" },
                { id: "5", name: "Household" },
            ]);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    useEffect(() => {
        if (status === "authenticated") {
            fetchCategories();
            fetchProducts();
        }
    }, [status, searchTerm, selectedCategory, showLowStock, sortOption]);

    const handleSearch = (event: React.FormEvent) => {
        event.preventDefault();
        fetchProducts();
    };

    const handleDelete = async (product: Product) => {
        setProductToDelete(product);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!productToDelete) return;

        try {
            await axios.delete(`/api/products/${productToDelete.id}`);
            toast.success(`${productToDelete.name} has been deleted`);
            fetchProducts(); // Refresh the list
        } catch (error: any) {
            toast.error(
                error.response?.data?.message || "Error deleting product"
            );
        } finally {
            setIsDeleteModalOpen(false);
            setProductToDelete(null);
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
                    <h1 className="text-2xl font-bold text-black">Products</h1>
                    <button
                        onClick={() => router.push("/products/new")}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                        <FiPlusCircle className="mr-2 h-5 w-5" />
                        Add Product
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white shadow rounded-lg p-4 space-y-4">
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                        <form
                            onSubmit={handleSearch}
                            className="relative flex-1"
                        >
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiSearch className="h-5 w-5 text-black" />
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Search products by name, SKU, or description"
                            />
                        </form>

                        <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                            <div>
                                <label htmlFor="category" className="sr-only">
                                    Filter by Category
                                </label>
                                <div className="relative">
                                    <select
                                        id="category"
                                        value={selectedCategory}
                                        onChange={(e) =>
                                            setSelectedCategory(e.target.value)
                                        }
                                        className="block w-full pl-3 pr-10 py-2 text-base text-gray-700 border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                    >
                                        <option
                                            value=""
                                            className="text-gray-700"
                                        >
                                            All Categories
                                        </option>
                                        {categories.map((category) => (
                                            <option
                                                key={category.id}
                                                value={category.id}
                                                className="text-gray-700"
                                            >
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="sortOrder" className="sr-only">
                                    Sort
                                </label>
                                <select
                                    id="sortOrder"
                                    value={sortOption}
                                    onChange={(e) =>
                                        setSortOption(e.target.value)
                                    }
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
                                        value="price:asc"
                                        className="text-gray-700"
                                    >
                                        Price (Low to High)
                                    </option>
                                    <option
                                        value="price:desc"
                                        className="text-gray-700"
                                    >
                                        Price (High to Low)
                                    </option>
                                    <option
                                        value="quantity:asc"
                                        className="text-gray-700"
                                    >
                                        Stock (Low to High)
                                    </option>
                                    <option
                                        value="quantity:desc"
                                        className="text-gray-700"
                                    >
                                        Stock (High to Low)
                                    </option>
                                </select>
                            </div>

                            <div className="flex items-center">
                                <input
                                    id="lowStock"
                                    name="lowStock"
                                    type="checkbox"
                                    checked={showLowStock}
                                    onChange={(e) =>
                                        setShowLowStock(e.target.checked)
                                    }
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label
                                    htmlFor="lowStock"
                                    className="ml-2 block text-sm text-black"
                                >
                                    Low Stock Only
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Products Table */}
                <div className="bg-white shadow overflow-hidden rounded-lg">
                    {products.length === 0 ? (
                        <div className="py-12">
                            <div className="text-center">
                                <FiFilter className="mx-auto h-12 w-12 text-black" />
                                <h3 className="mt-2 text-lg font-medium text-black">
                                    No products found
                                </h3>
                                <p className="mt-1 text-sm text-black">
                                    {searchTerm ||
                                    selectedCategory ||
                                    showLowStock
                                        ? "Try changing your search criteria"
                                        : "Get started by adding your first product"}
                                </p>
                                {!searchTerm &&
                                    !selectedCategory &&
                                    !showLowStock && (
                                        <div className="mt-6">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    router.push("/products/new")
                                                }
                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                                            >
                                                <FiPlusCircle className="mr-2 h-5 w-5" />
                                                Add Product
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
                                            Product
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider"
                                        >
                                            SKU
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider"
                                        >
                                            Category
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider"
                                        >
                                            Price
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider"
                                        >
                                            Stock
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
                                    {products.map((product) => (
                                        <tr key={product.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-black">
                                                    {product.name}
                                                </div>
                                                <div className="text-sm text-black truncate max-w-xs">
                                                    {product.description ||
                                                        "No description"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                                                {product.sku}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                                                {product.category.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-black">
                                                    ${product.price.toFixed(2)}
                                                </div>
                                                <div className="text-xs text-black">
                                                    Cost: $
                                                    {product.costPrice.toFixed(
                                                        2
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {product.quantity <=
                                                product.minimumStock ? (
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                        Low: {product.quantity}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-gray-500">
                                                        {product.quantity}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() =>
                                                        router.push(
                                                            `/products/${product.id}`
                                                        )
                                                    }
                                                    className="text-blue-600 hover:text-blue-900 mr-4"
                                                >
                                                    <FiEdit2 className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDelete(product)
                                                    }
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <FiTrash2 className="h-5 w-5" />
                                                </button>
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
            {isDeleteModalOpen && productToDelete && (
                <div className="fixed z-50 inset-0 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div
                            className="fixed inset-0 transition-opacity"
                            aria-hidden="true"
                            onClick={() => setIsDeleteModalOpen(false)}
                        >
                            <div className="absolute inset-0 bg-gray-500 opacity-50"></div>
                        </div>
                        <span
                            className="hidden sm:inline-block sm:align-middle sm:h-screen"
                            aria-hidden="true"
                        >
                            &#8203;
                        </span>
                        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 relative z-50">
                            <div>
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                                    <FiTrash2 className="h-6 w-6 text-red-600" />
                                </div>
                                <div className="mt-3 text-center sm:mt-5">
                                    <h3 className="text-lg leading-6 font-medium text-black">
                                        Delete Product
                                    </h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-black">
                                            Are you sure you want to delete{" "}
                                            {productToDelete.name}? This action
                                            cannot be undone.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
                                    onClick={confirmDelete}
                                >
                                    Delete
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-black hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
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

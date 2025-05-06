"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "react-toastify";
import { FiEdit2, FiTrash2, FiChevronLeft } from "react-icons/fi";
import DashboardLayout from "@/components/layout/DashboardLayout";

// Define a type for the ProductSupplierManagement component
type ProductSupplierManagementComponent = React.ComponentType<{
    productId: string;
    existingSuppliers: ProductSupplier[];
    onUpdate: () => void;
}>;

// We'll dynamically import the component in the component body
let ProductSupplierManagement: ProductSupplierManagementComponent | null = null;

interface Product {
    id: string;
    name: string;
    sku: string;
    description?: string;
    price: number;
    costPrice: number;
    quantity: number;
    minimumStock: number;
    categoryId: string;
    category: {
        id: string;
        name: string;
    };
    userId: string;
    createdAt: string;
    updatedAt: string;
    suppliers: ProductSupplier[];
}

interface ProductSupplier {
    id: string;
    productId: string;
    supplierId: string;
    isPreferred: boolean;
    unitPrice?: number;
    notes?: string;
    supplier: {
        id: string;
        name: string;
        email?: string;
        phone?: string;
        address?: string;
    };
}

// Extended Session interface to include role
interface ExtendedSession {
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        role?: string;
    };
}

export default function ProductDetailPage({
    params,
}: {
    params: { id: string };
}) {
    // Explicitly type and unwrap params
    const unwrappedParams = React.use(
        params as unknown as Promise<{ id: string }>
    );
    const id = unwrappedParams.id;

    const { data: session, status } = useSession() as {
        data: ExtendedSession | null;
        status: string;
    };
    const router = useRouter();
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasSupplierComponent, setHasSupplierComponent] = useState(false);

    // Try to import the ProductSupplierManagement component
    useEffect(() => {
        const loadComponent = async () => {
            try {
                // Use dynamic import instead of require
                const componentModule = await import(
                    "@/components/products/ProductSupplierManagement"
                );
                ProductSupplierManagement = componentModule.default;
                setHasSupplierComponent(true);
            } catch {
                setHasSupplierComponent(false);
            }
        };

        loadComponent();
    }, []);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    const fetchProduct = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await axios.get(`/api/products/${id}`);
            setProduct(response.data);
        } catch (error) {
            console.error("Error fetching product:", error);
            toast.error("Failed to load product details");
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (status === "authenticated") {
            fetchProduct();
        }
    }, [status, fetchProduct]);

    const handleEditClick = () => {
        router.push(`/products/edit/${id}`);
    };

    const handleDeleteClick = async () => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            try {
                await axios.delete(`/api/products/${id}`);
                toast.success("Product deleted successfully");
                router.push("/products");
            } catch (error) {
                console.error("Error deleting product:", error);
                toast.error("Failed to delete product");
            }
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (!product) {
        return (
            <DashboardLayout>
                <div className="text-center py-10">
                    <h1 className="text-xl font-semibold text-red-600">
                        Product not found
                    </h1>
                    <button
                        onClick={() => router.push("/products")}
                        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                        <FiChevronLeft className="mr-2" /> Back to Products
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header with back button */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-bold text-primary">
                        Product Details
                    </h1>
                    <button
                        onClick={() => router.push("/products")}
                        className="mt-2 sm:mt-0 inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md bg-white hover:bg-gray-50"
                    >
                        <FiChevronLeft className="mr-1" /> Back to Products
                    </button>
                </div>

                {/* Product details card */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-medium text-gray-900">
                                {product.name}
                            </h2>
                            <p className="text-sm text-gray-500">
                                SKU: {product.sku}
                            </p>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={handleEditClick}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                <FiEdit2 className="mr-1" /> Edit
                            </button>
                            {session?.user?.role === "ADMIN" && (
                                <button
                                    onClick={handleDeleteClick}
                                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                                >
                                    <FiTrash2 className="mr-1" /> Delete
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="border-t border-gray-200">
                        <dl>
                            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">
                                    Category
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {product.category?.name || "Uncategorized"}
                                </dd>
                            </div>
                            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">
                                    Description
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {product.description ||
                                        "No description available"}
                                </dd>
                            </div>
                            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">
                                    Price
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    ${product.price.toFixed(2)}
                                </dd>
                            </div>
                            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">
                                    Cost Price
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    ${product.costPrice.toFixed(2)}
                                </dd>
                            </div>
                            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">
                                    Current Stock
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
                                    <span>{product.quantity} units</span>
                                    {product.quantity <=
                                        product.minimumStock && (
                                        <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                            Low Stock
                                        </span>
                                    )}
                                </dd>
                            </div>
                            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">
                                    Minimum Stock
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {product.minimumStock} units
                                </dd>
                            </div>
                            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">
                                    Created At
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {new Date(
                                        product.createdAt
                                    ).toLocaleString()}
                                </dd>
                            </div>
                            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">
                                    Last Updated
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {new Date(
                                        product.updatedAt
                                    ).toLocaleString()}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>

                {/* Product Suppliers Section */}
                {hasSupplierComponent && ProductSupplierManagement ? (
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                            <h3 className="text-lg font-medium text-gray-900">
                                Product Suppliers
                            </h3>
                        </div>
                        <div className="border-t border-gray-200 p-4">
                            <ProductSupplierManagement
                                productId={id}
                                existingSuppliers={product.suppliers || []}
                                onUpdate={fetchProduct}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Product Suppliers
                        </h3>
                        <p className="text-sm text-gray-500">
                            The supplier management component is not available.
                        </p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "react-toastify";
import {
    FiSearch,
    FiFilter,
    FiPlusCircle,
    FiArrowUp,
    FiArrowDown,
    FiTrendingUp,
    FiTrendingDown,
} from "react-icons/fi";
import DashboardLayout from "@/components/layout/DashboardLayout";

interface Product {
    id: string;
    name: string;
    sku: string;
    quantity: number;
    minimumStock: number;
    category: {
        name: string;
    };
}

interface InventoryTransaction {
    id: string;
    productId: string;
    product: {
        name: string;
        sku: string;
    };
    quantity: number;
    type: "PURCHASE" | "SALE" | "ADJUSTMENT" | "RETURN" | "WRITE_OFF";
    reference: string;
    notes?: string;
    createdAt: string;
}

export default function InventoryPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [transactions, setTransactions] = useState<InventoryTransaction[]>(
        []
    );
    const [filteredTransactions, setFilteredTransactions] = useState<
        InventoryTransaction[]
    >([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"stock" | "transactions">(
        "stock"
    );
    const [searchTerm, setSearchTerm] = useState("");
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(
        null
    );
    const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(0);
    const [adjustmentReason, setAdjustmentReason] = useState<string>("");
    const [isTransactionsLoading, setIsTransactionsLoading] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    // Fetch products and inventory data
    useEffect(() => {
        if (status === "authenticated") {
            fetchProducts();
            fetchTransactions();
        }
    }, [status]);

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            // Fetch real products from the API
            console.log("Fetching products for inventory...");
            const response = await fetch("/api/products");

            if (!response.ok) {
                throw new Error("Failed to fetch products");
            }

            const data = await response.json();
            console.log(`Fetched ${data.length} products for inventory`);

            setProducts(data || []);
            setFilteredProducts(data || []);
        } catch (error) {
            console.error("Error fetching products:", error);
            toast.error("Failed to load inventory data");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTransactions = async () => {
        setIsTransactionsLoading(true);
        try {
            // Fetch real inventory transactions from the API
            console.log("Fetching inventory transactions...");
            const response = await fetch("/api/inventory?limit=100");

            if (!response.ok) {
                throw new Error("Failed to fetch inventory transactions");
            }

            const data = await response.json();
            console.log(`Fetched ${data.length} inventory transactions`);

            setTransactions(data || []);
            setFilteredTransactions(data || []);
        } catch (error) {
            console.error("Error fetching transactions:", error);
            toast.error("Failed to load inventory transactions");
        } finally {
            setIsTransactionsLoading(false);
        }
    };

    // Client-side filtering based on search term
    useEffect(() => {
        if (searchTerm === "") {
            setFilteredProducts(products);
            setFilteredTransactions(transactions);
            return;
        }

        const lowerSearchTerm = searchTerm.toLowerCase();

        // Filter products
        const matchingProducts = products.filter(
            (product) =>
                product.name.toLowerCase().includes(lowerSearchTerm) ||
                product.sku.toLowerCase().includes(lowerSearchTerm)
        );
        setFilteredProducts(matchingProducts);

        // Filter transactions
        const matchingTransactions = transactions.filter(
            (transaction) =>
                transaction.product.name
                    .toLowerCase()
                    .includes(lowerSearchTerm) ||
                transaction.product.sku
                    .toLowerCase()
                    .includes(lowerSearchTerm) ||
                transaction.reference.toLowerCase().includes(lowerSearchTerm) ||
                (transaction.notes &&
                    transaction.notes.toLowerCase().includes(lowerSearchTerm))
        );
        setFilteredTransactions(matchingTransactions);
    }, [searchTerm, products, transactions]);

    const handleSearch = (event: React.FormEvent) => {
        event.preventDefault();
        // No need to do anything here as the useEffect will handle filtering
    };

    const openStockAdjustment = (product: Product) => {
        setSelectedProduct(product);
        setAdjustmentQuantity(0);
        setAdjustmentReason("");
        setIsStockModalOpen(true);
    };

    const handleStockAdjustment = async () => {
        if (!selectedProduct) return;

        try {
            // Validate adjustment
            if (adjustmentQuantity === 0) {
                toast.error("Adjustment quantity cannot be zero");
                return;
            }

            if (!adjustmentReason.trim()) {
                toast.error("Please provide a reason for the adjustment");
                return;
            }

            // This would be replaced with a real API call in a production app
            const updatedQuantity =
                selectedProduct.quantity + adjustmentQuantity;

            // Don't allow negative stock
            if (updatedQuantity < 0) {
                toast.error("Cannot adjust to negative stock quantity");
                return;
            }

            // In a real app, we would call an API endpoint to adjust the stock
            // For now, we'll just update the UI and add a transaction
            toast.success(
                `Adjusted stock for ${selectedProduct.name} by ${
                    adjustmentQuantity > 0 ? "+" : ""
                }${adjustmentQuantity}`
            );

            // Update both products and filteredProducts arrays
            const updatedProducts = products.map((p) => {
                if (p.id === selectedProduct.id) {
                    return {
                        ...p,
                        quantity: updatedQuantity,
                    };
                }
                return p;
            });

            setProducts(updatedProducts);

            // Apply the same filter to maintain consistency
            const lowerSearchTerm = searchTerm.toLowerCase();
            if (searchTerm) {
                setFilteredProducts(
                    updatedProducts.filter(
                        (product) =>
                            product.name
                                .toLowerCase()
                                .includes(lowerSearchTerm) ||
                            product.sku.toLowerCase().includes(lowerSearchTerm)
                    )
                );
            } else {
                setFilteredProducts(updatedProducts);
            }

            // Add to transactions list
            const newTransaction: InventoryTransaction = {
                id: `new-${Date.now()}`,
                productId: selectedProduct.id,
                product: {
                    name: selectedProduct.name,
                    sku: selectedProduct.sku,
                },
                quantity: adjustmentQuantity,
                type: "ADJUSTMENT",
                reference: `ADJ-${Date.now()}`,
                notes: adjustmentReason,
                createdAt: new Date().toISOString(),
            };

            const updatedTransactions = [newTransaction, ...transactions];
            setTransactions(updatedTransactions);

            // Apply the same filter to maintain consistency
            if (searchTerm) {
                setFilteredTransactions(
                    updatedTransactions.filter(
                        (transaction) =>
                            transaction.product.name
                                .toLowerCase()
                                .includes(lowerSearchTerm) ||
                            transaction.product.sku
                                .toLowerCase()
                                .includes(lowerSearchTerm) ||
                            transaction.reference
                                .toLowerCase()
                                .includes(lowerSearchTerm) ||
                            (transaction.notes &&
                                transaction.notes
                                    .toLowerCase()
                                    .includes(lowerSearchTerm))
                    )
                );
            } else {
                setFilteredTransactions(updatedTransactions);
            }

            setIsStockModalOpen(false);
        } catch (error) {
            console.error("Error adjusting stock:", error);
            toast.error("Failed to adjust stock");
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
                    <h1 className="text-2xl font-bold text-black">
                        Inventory Management
                    </h1>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setActiveTab("stock")}
                            className={`px-4 py-2 text-sm font-medium rounded-md ${
                                activeTab === "stock"
                                    ? "bg-blue-600 text-white"
                                    : "bg-white text-black border border-gray-300 hover:bg-gray-50"
                            }`}
                        >
                            Stock Levels
                        </button>
                        <button
                            onClick={() => setActiveTab("transactions")}
                            className={`px-4 py-2 text-sm font-medium rounded-md ${
                                activeTab === "transactions"
                                    ? "bg-blue-600 text-white"
                                    : "bg-white text-black border border-gray-300 hover:bg-gray-50"
                            }`}
                        >
                            Transactions
                        </button>
                    </div>
                </div>

                {/* Search and filter */}
                <div className="bg-white shadow rounded-lg p-4">
                    <form onSubmit={handleSearch} className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiSearch className="h-5 w-5 text-black" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder={
                                activeTab === "stock"
                                    ? "Search products by name or SKU"
                                    : "Search transactions by product or reference"
                            }
                        />
                    </form>
                </div>

                {/* Stock Levels Tab */}
                {activeTab === "stock" && (
                    <div className="bg-white shadow overflow-hidden rounded-lg">
                        <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
                            <h3 className="text-lg leading-6 font-medium text-black">
                                Current Stock Levels
                            </h3>
                            <button
                                onClick={() => router.push("/products/new")}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                <FiPlusCircle className="mr-2 h-5 w-5" />
                                Add Product
                            </button>
                        </div>
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
                                            className="px-6 py-3 text-center text-xs font-medium text-black uppercase tracking-wider"
                                        >
                                            Current Stock
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-center text-xs font-medium text-black uppercase tracking-wider"
                                        >
                                            Min. Stock
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-center text-xs font-medium text-black uppercase tracking-wider"
                                        >
                                            Status
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
                                    {filteredProducts.map((product) => (
                                        <tr key={product.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                                                {product.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                                                {product.sku}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                                                {product.category.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-black">
                                                {product.quantity}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-black">
                                                {product.minimumStock}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {product.quantity <=
                                                product.minimumStock ? (
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                        Low Stock
                                                    </span>
                                                ) : (
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                        In Stock
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() =>
                                                        openStockAdjustment(
                                                            product
                                                        )
                                                    }
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    Adjust
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Transactions Tab */}
                {activeTab === "transactions" && (
                    <div className="bg-white shadow overflow-hidden rounded-lg">
                        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-black">
                                Inventory Transactions
                            </h3>
                        </div>
                        {isTransactionsLoading ? (
                            <div className="flex justify-center items-center p-10">
                                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                            </div>
                        ) : filteredTransactions.length === 0 ? (
                            <div className="text-center p-10">
                                <p className="text-gray-500">
                                    No inventory transactions found
                                </p>
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
                                                Date
                                            </th>
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
                                                className="px-6 py-3 text-center text-xs font-medium text-black uppercase tracking-wider"
                                            >
                                                Type
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-center text-xs font-medium text-black uppercase tracking-wider"
                                            >
                                                Quantity
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider"
                                            >
                                                Reference
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider"
                                            >
                                                Notes
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredTransactions.map(
                                            (transaction) => (
                                                <tr key={transaction.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                                                        {new Date(
                                                            transaction.createdAt
                                                        ).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                                                        {transaction.product
                                                            ?.name ||
                                                            "Unknown Product"}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                                                        {transaction.product
                                                            ?.sku || "N/A"}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <span
                                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                  ${
                                      transaction.type === "PURCHASE"
                                          ? "bg-green-100 text-green-800"
                                          : transaction.type === "SALE"
                                          ? "bg-blue-100 text-blue-800"
                                          : transaction.type === "ADJUSTMENT"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : transaction.type === "RETURN"
                                          ? "bg-purple-100 text-purple-800"
                                          : "bg-red-100 text-red-800"
                                  }`}
                                                        >
                                                            {transaction.type.replace(
                                                                "_",
                                                                " "
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                        <div className="flex justify-center items-center space-x-1">
                                                            {transaction.quantity >
                                                            0 ? (
                                                                <FiArrowUp className="h-4 w-4 text-green-600" />
                                                            ) : (
                                                                <FiArrowDown className="h-4 w-4 text-red-600" />
                                                            )}
                                                            <span>
                                                                {Math.abs(
                                                                    transaction.quantity
                                                                )}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                                                        {transaction.reference}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                                                        {transaction.notes ||
                                                            "-"}
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Stock Adjustment Modal */}
            {isStockModalOpen && selectedProduct && (
                <div className="fixed z-50 inset-0 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div
                            className="fixed inset-0 transition-opacity"
                            aria-hidden="true"
                            onClick={() => setIsStockModalOpen(false)}
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
                                <div className="mt-3 text-center sm:mt-5">
                                    <h3 className="text-lg leading-6 font-medium text-black">
                                        Stock Adjustment: {selectedProduct.name}
                                    </h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-black mb-4">
                                            Current stock:{" "}
                                            <span className="font-medium">
                                                {selectedProduct.quantity}
                                            </span>
                                        </p>

                                        <div className="mb-4">
                                            <label
                                                htmlFor="adjustmentQuantity"
                                                className="block text-sm font-medium text-black text-left"
                                            >
                                                Adjustment Quantity
                                            </label>
                                            <div className="mt-1 flex rounded-md shadow-sm">
                                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-black sm:text-sm">
                                                    {adjustmentQuantity > 0 ? (
                                                        <FiTrendingUp className="h-4 w-4" />
                                                    ) : (
                                                        <FiTrendingDown className="h-4 w-4" />
                                                    )}
                                                </span>
                                                <input
                                                    type="number"
                                                    id="adjustmentQuantity"
                                                    value={adjustmentQuantity}
                                                    onChange={(e) =>
                                                        setAdjustmentQuantity(
                                                            parseInt(
                                                                e.target.value
                                                            ) || 0
                                                        )
                                                    }
                                                    className="flex-1 focus:ring-blue-500 focus:border-blue-500 block w-full min-w-0 rounded-none rounded-r-md sm:text-sm border-gray-300 py-3 px-4"
                                                    placeholder="Enter positive or negative value"
                                                />
                                            </div>
                                            <p className="mt-1 text-xs text-black text-left">
                                                Use positive values to add
                                                stock, negative values to remove
                                                stock
                                            </p>
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="adjustmentReason"
                                                className="block text-sm font-medium text-black text-left"
                                            >
                                                Reason
                                            </label>
                                            <div className="mt-1">
                                                <textarea
                                                    id="adjustmentReason"
                                                    value={adjustmentReason}
                                                    onChange={(e) =>
                                                        setAdjustmentReason(
                                                            e.target.value
                                                        )
                                                    }
                                                    rows={3}
                                                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md py-3 px-4"
                                                    placeholder="Explain the reason for this adjustment"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
                                    onClick={handleStockAdjustment}
                                >
                                    Save Adjustment
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-black hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                                    onClick={() => setIsStockModalOpen(false)}
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

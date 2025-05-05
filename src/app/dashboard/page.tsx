"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import {
    FiBox,
    FiShoppingCart,
    FiAlertCircle,
    FiDollarSign,
    FiTrendingUp,
    FiClock,
} from "react-icons/fi";
import DashboardLayout from "@/components/layout/DashboardLayout";

interface DashboardStats {
    totalProducts: number;
    lowStockProducts: number;
    totalSales: number;
    salesAmount: number;
    topProducts: {
        id: string;
        name: string;
        quantitySold: number;
    }[];
    recentSales: {
        id: string;
        invoiceNumber: string;
        date: string;
        amount: number;
        customerName: string;
    }[];
}

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState<"today" | "week" | "month">(
        "week"
    );

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        if (status === "authenticated") {
            fetchDashboardData();
        }
    }, [status, dateRange]);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            // In a real app, this would fetch from an API endpoint
            // For now, we'll use sample data
            setStats({
                totalProducts: 125,
                lowStockProducts: 8,
                totalSales:
                    dateRange === "today"
                        ? 12
                        : dateRange === "week"
                        ? 87
                        : 340,
                salesAmount:
                    dateRange === "today"
                        ? 1245.75
                        : dateRange === "week"
                        ? 8945.5
                        : 32450.25,
                topProducts: [
                    { id: "1", name: "Rice (5kg)", quantitySold: 45 },
                    { id: "2", name: "Cooking Oil (1L)", quantitySold: 38 },
                    { id: "3", name: "Milk Powder (500g)", quantitySold: 32 },
                    { id: "4", name: "Sugar (1kg)", quantitySold: 28 },
                    { id: "5", name: "Flour (1kg)", quantitySold: 25 },
                ],
                recentSales: [
                    {
                        id: "1",
                        invoiceNumber: "INV-001",
                        date: "2025-05-05",
                        amount: 156.78,
                        customerName: "John Doe",
                    },
                    {
                        id: "2",
                        invoiceNumber: "INV-002",
                        date: "2025-05-04",
                        amount: 243.5,
                        customerName: "Jane Smith",
                    },
                    {
                        id: "3",
                        invoiceNumber: "INV-003",
                        date: "2025-05-04",
                        amount: 89.99,
                        customerName: "Mike Johnson",
                    },
                    {
                        id: "4",
                        invoiceNumber: "INV-004",
                        date: "2025-05-03",
                        amount: 321.45,
                        customerName: "Sarah Williams",
                    },
                    {
                        id: "5",
                        invoiceNumber: "INV-005",
                        date: "2025-05-03",
                        amount: 175.25,
                        customerName: "Robert Brown",
                    },
                ],
            });
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            toast.error("Failed to load dashboard data");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLowStockItemsClick = () => {
        router.push("/inventory?filter=lowStock");
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
                    <h1 className="text-2xl font-bold text-gray-900">
                        Dashboard
                    </h1>
                    <div className="inline-flex rounded-md shadow-sm">
                        <button
                            type="button"
                            onClick={() => setDateRange("today")}
                            className={`${
                                dateRange === "today"
                                    ? "bg-blue-600 text-white"
                                    : "bg-white text-gray-700"
                            } relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                        >
                            Today
                        </button>
                        <button
                            type="button"
                            onClick={() => setDateRange("week")}
                            className={`${
                                dateRange === "week"
                                    ? "bg-blue-600 text-white"
                                    : "bg-white text-gray-700"
                            } relative inline-flex items-center px-4 py-2 border-t border-b border-gray-300 text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                        >
                            This Week
                        </button>
                        <button
                            type="button"
                            onClick={() => setDateRange("month")}
                            className={`${
                                dateRange === "month"
                                    ? "bg-blue-600 text-white"
                                    : "bg-white text-gray-700"
                            } relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                        >
                            This Month
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Total Products Card */}
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                                    <FiBox className="h-6 w-6 text-white" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Total Products
                                        </dt>
                                        <dd>
                                            <div className="text-lg font-medium text-gray-900">
                                                {stats?.totalProducts}
                                            </div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-5 py-3">
                            <div className="text-sm">
                                <a
                                    href="/products"
                                    className="font-medium text-blue-600 hover:text-blue-500"
                                >
                                    View all
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Low Stock Items Card */}
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                                    <FiAlertCircle className="h-6 w-6 text-white" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Low Stock Items
                                        </dt>
                                        <dd>
                                            <div className="text-lg font-medium text-gray-900">
                                                {stats?.lowStockProducts}
                                            </div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-5 py-3">
                            <div className="text-sm">
                                <button
                                    onClick={handleLowStockItemsClick}
                                    className="font-medium text-yellow-600 hover:text-yellow-500"
                                >
                                    View all
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Total Sales Card */}
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                                    <FiShoppingCart className="h-6 w-6 text-white" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Total Sales
                                        </dt>
                                        <dd>
                                            <div className="text-lg font-medium text-gray-900">
                                                {stats?.totalSales}
                                            </div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-5 py-3">
                            <div className="text-sm">
                                <a
                                    href="/sales"
                                    className="font-medium text-green-600 hover:text-green-500"
                                >
                                    View all
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Sales Amount Card */}
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                                    <FiDollarSign className="h-6 w-6 text-white" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Sales Amount
                                        </dt>
                                        <dd>
                                            <div className="text-lg font-medium text-gray-900">
                                                ${stats?.salesAmount.toFixed(2)}
                                            </div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-5 py-3">
                            <div className="text-sm">
                                <a
                                    href="/sales"
                                    className="font-medium text-indigo-600 hover:text-indigo-500"
                                >
                                    View details
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts and Tables */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {/* Top Products */}
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                            <h3 className="text-lg font-medium leading-6 text-gray-900">
                                Top Selling Products
                            </h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                Products with highest sales volume
                            </p>
                        </div>
                        <div className="p-6">
                            <ul className="divide-y divide-gray-200">
                                {stats?.topProducts.map((product) => (
                                    <li
                                        key={product.id}
                                        className="py-4 flex items-center justify-between"
                                    >
                                        <div className="flex items-center">
                                            <FiTrendingUp className="h-5 w-5 text-green-500 mr-3" />
                                            <span className="font-medium text-gray-900">
                                                {product.name}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {product.quantitySold} units sold
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Recent Sales */}
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                            <h3 className="text-lg font-medium leading-6 text-gray-900">
                                Recent Sales
                            </h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                Latest sales transactions
                            </p>
                        </div>
                        <div className="p-6">
                            <ul className="divide-y divide-gray-200">
                                {stats?.recentSales.map((sale) => (
                                    <li
                                        key={sale.id}
                                        className="py-4 flex items-center justify-between"
                                    >
                                        <div className="flex items-center">
                                            <FiClock className="h-5 w-5 text-blue-500 mr-3" />
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {sale.invoiceNumber}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {sale.customerName}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="font-medium text-gray-900">
                                                ${sale.amount.toFixed(2)}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                {sale.date}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-gray-50 px-4 py-4 sm:px-6 border-t border-gray-200">
                            <div className="text-sm">
                                <a
                                    href="/sales"
                                    className="font-medium text-blue-600 hover:text-blue-500"
                                >
                                    View all sales
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { FiPlus, FiTrash2, FiSave, FiChevronLeft } from "react-icons/fi";

interface Customer {
    id: string;
    name: string;
    email?: string;
    phone?: string;
}

interface Product {
    id: string;
    name: string;
    sku: string;
    price: number;
    costPrice: number;
    quantity: number;
}

interface SaleItem {
    id?: string;
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    totalPrice: number;
    availableStock: number;
}

export default function NewSalePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [productSearch, setProductSearch] = useState("");

    // Form state
    const [customerId, setCustomerId] = useState("");
    const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
    const [paymentMethod, setPaymentMethod] = useState("CASH");
    const [saleStatus, setSaleStatus] = useState("PENDING");
    const [discount, setDiscount] = useState(0);
    const [tax, setTax] = useState(0);
    const [items, setItems] = useState<SaleItem[]>([]);
    const [currentProduct, setCurrentProduct] = useState("");
    const [currentQuantity, setCurrentQuantity] = useState(1);
    const [currentPrice, setCurrentPrice] = useState(0);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        if (status === "authenticated") {
            fetchCustomers();
            fetchProducts();
        }
    }, [status]);

    useEffect(() => {
        if (productSearch.trim() === "") {
            setFilteredProducts(products);
        } else {
            const filtered = products.filter(
                (product) =>
                    product.name
                        .toLowerCase()
                        .includes(productSearch.toLowerCase()) ||
                    product.sku
                        .toLowerCase()
                        .includes(productSearch.toLowerCase())
            );
            setFilteredProducts(filtered);
        }
    }, [productSearch, products]);

    const fetchCustomers = async () => {
        try {
            const response = await fetch("/api/customers");
            if (!response.ok) {
                throw new Error("Failed to fetch customers");
            }
            const data = await response.json();
            setCustomers(data.customers || []);
        } catch (error) {
            console.error("Error fetching customers:", error);
            toast.error("Failed to load customers");
        }
    };

    const fetchProducts = async () => {
        try {
            setIsLoading(true);
            const response = await fetch("/api/products?inStock=true");
            if (!response.ok) {
                throw new Error("Failed to fetch products");
            }
            const data = await response.json();
            setProducts(data.products || []);
            setFilteredProducts(data.products || []);
        } catch (error) {
            console.error("Error fetching products:", error);
            toast.error("Failed to load products");
        } finally {
            setIsLoading(false);
        }
    };

    const handleProductChange = (productId: string) => {
        setCurrentProduct(productId);

        if (productId) {
            const selectedProduct = products.find((p) => p.id === productId);
            if (selectedProduct) {
                setCurrentPrice(selectedProduct.price);
                setCurrentQuantity(1);
            }
        } else {
            setCurrentPrice(0);
            setCurrentQuantity(1);
        }
    };

    const addItem = () => {
        if (!currentProduct || currentQuantity <= 0) {
            toast.error("Please select a product and enter a valid quantity");
            return;
        }

        const selectedProduct = products.find((p) => p.id === currentProduct);
        if (!selectedProduct) {
            toast.error("Selected product not found");
            return;
        }

        if (currentQuantity > selectedProduct.quantity) {
            toast.error(
                `Only ${selectedProduct.quantity} units available in stock`
            );
            return;
        }

        const existingItemIndex = items.findIndex(
            (item) => item.productId === currentProduct
        );
        if (existingItemIndex >= 0) {
            // Update existing item
            const updatedItems = [...items];
            const newQuantity =
                updatedItems[existingItemIndex].quantity + currentQuantity;

            // Check if new total quantity exceeds stock
            if (newQuantity > selectedProduct.quantity) {
                toast.error(
                    `Cannot add more than available stock (${selectedProduct.quantity} units)`
                );
                return;
            }

            updatedItems[existingItemIndex] = {
                ...updatedItems[existingItemIndex],
                quantity: newQuantity,
                totalPrice: Number((newQuantity * currentPrice).toFixed(2)),
            };
            setItems(updatedItems);
        } else {
            // Add new item
            const newItem: SaleItem = {
                productId: currentProduct,
                productName: selectedProduct.name,
                quantity: currentQuantity,
                price: currentPrice,
                totalPrice: Number((currentQuantity * currentPrice).toFixed(2)),
                availableStock: selectedProduct.quantity,
            };
            setItems([...items, newItem]);
        }

        // Reset input fields
        setCurrentProduct("");
        setCurrentQuantity(1);
        setCurrentPrice(0);
    };

    const removeItem = (index: number) => {
        const updatedItems = items.filter((_, i) => i !== index);
        setItems(updatedItems);
    };

    const updateItemQuantity = (index: number, quantity: number) => {
        const item = items[index];
        const product = products.find((p) => p.id === item.productId);

        if (!product) return;

        if (quantity > product.quantity) {
            toast.error(
                `Cannot add more than available stock (${product.quantity} units)`
            );
            return;
        }

        const updatedItems = [...items];
        updatedItems[index] = {
            ...item,
            quantity,
            totalPrice: Number((quantity * item.price).toFixed(2)),
        };
        setItems(updatedItems);
    };

    const updateItemPrice = (index: number, price: number) => {
        const updatedItems = [...items];
        updatedItems[index] = {
            ...items[index],
            price,
            totalPrice: Number((items[index].quantity * price).toFixed(2)),
        };
        setItems(updatedItems);
    };

    const calculateSubtotal = () => {
        return items.reduce((sum, item) => sum + item.totalPrice, 0);
    };

    const calculateDiscountAmount = () => {
        return (calculateSubtotal() * discount) / 100;
    };

    const calculateTaxAmount = () => {
        return ((calculateSubtotal() - calculateDiscountAmount()) * tax) / 100;
    };

    const calculateTotal = () => {
        return (
            calculateSubtotal() -
            calculateDiscountAmount() +
            calculateTaxAmount()
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!customerId) {
            toast.error("Please select a customer");
            return;
        }

        if (items.length === 0) {
            toast.error("Please add at least one item");
            return;
        }

        try {
            setIsSubmitting(true);

            const saleData = {
                customerId,
                date,
                paymentMethod,
                status: saleStatus,
                discount,
                tax,
                items: items.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price,
                })),
            };

            const response = await fetch("/api/sales", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(saleData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to create sale");
            }

            const sale = await response.json();
            toast.success("Sale created successfully");
            router.push("/sales");
        } catch (error) {
            console.error("Error creating sale:", error);
            toast.error(
                error instanceof Error ? error.message : "Failed to create sale"
            );
        } finally {
            setIsSubmitting(false);
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
                    <div className="flex items-center">
                        <button
                            onClick={() => router.push("/sales")}
                            className="mr-3 inline-flex items-center p-2 rounded-md hover:bg-gray-100"
                        >
                            <FiChevronLeft className="h-5 w-5" />
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">
                            New Sale
                        </h1>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <FiSave className="mr-2 h-5 w-5" />
                                Save Sale
                            </>
                        )}
                    </button>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="bg-white shadow rounded-lg p-6 space-y-6">
                        <h2 className="text-lg font-medium text-gray-900">
                            Sale Information
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <label
                                    htmlFor="customer"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    Customer{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="customer"
                                    value={customerId}
                                    onChange={(e) =>
                                        setCustomerId(e.target.value)
                                    }
                                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                    required
                                >
                                    <option value="">Select Customer</option>
                                    {customers.map((customer) => (
                                        <option
                                            key={customer.id}
                                            value={customer.id}
                                        >
                                            {customer.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="date"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    id="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                    required
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="status"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    Status
                                </label>
                                <select
                                    id="status"
                                    value={saleStatus}
                                    onChange={(e) =>
                                        setSaleStatus(e.target.value)
                                    }
                                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                >
                                    <option value="PENDING">Pending</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="paymentMethod"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    Payment Method
                                </label>
                                <select
                                    id="paymentMethod"
                                    value={paymentMethod}
                                    onChange={(e) =>
                                        setPaymentMethod(e.target.value)
                                    }
                                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                >
                                    <option value="CASH">Cash</option>
                                    <option value="CREDIT_CARD">
                                        Credit Card
                                    </option>
                                    <option value="BANK_TRANSFER">
                                        Bank Transfer
                                    </option>
                                    <option value="MOBILE_PAYMENT">
                                        Mobile Payment
                                    </option>
                                    <option value="CHECK">Check</option>
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="discount"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    Discount (%)
                                </label>
                                <input
                                    type="number"
                                    id="discount"
                                    min="0"
                                    max="100"
                                    value={discount}
                                    onChange={(e) =>
                                        setDiscount(Number(e.target.value))
                                    }
                                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="tax"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    Tax (%)
                                </label>
                                <input
                                    type="number"
                                    id="tax"
                                    min="0"
                                    value={tax}
                                    onChange={(e) =>
                                        setTax(Number(e.target.value))
                                    }
                                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white shadow rounded-lg p-6 space-y-6">
                        <h2 className="text-lg font-medium text-gray-900">
                            Sale Items
                        </h2>

                        {/* Add Product Form */}
                        <div className="flex flex-col lg:flex-row space-y-3 lg:space-y-0 lg:space-x-4 items-end">
                            <div className="w-full lg:w-1/3">
                                <label
                                    htmlFor="product"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    Product
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search products"
                                        value={productSearch}
                                        onChange={(e) =>
                                            setProductSearch(e.target.value)
                                        }
                                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                    />
                                    {productSearch &&
                                        filteredProducts.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                                {filteredProducts.map(
                                                    (product) => (
                                                        <div
                                                            key={product.id}
                                                            className="cursor-pointer hover:bg-gray-100 p-2"
                                                            onClick={() => {
                                                                handleProductChange(
                                                                    product.id
                                                                );
                                                                setProductSearch(
                                                                    product.name
                                                                );
                                                                // Close dropdown
                                                                setTimeout(
                                                                    () =>
                                                                        setProductSearch(
                                                                            ""
                                                                        ),
                                                                    100
                                                                );
                                                            }}
                                                        >
                                                            <div className="font-medium">
                                                                {product.name}
                                                            </div>
                                                            <div className="text-xs text-gray-500 flex justify-between">
                                                                <span>
                                                                    SKU:{" "}
                                                                    {
                                                                        product.sku
                                                                    }
                                                                </span>
                                                                <span>
                                                                    Stock:{" "}
                                                                    {
                                                                        product.quantity
                                                                    }
                                                                </span>
                                                                <span>
                                                                    Price: $
                                                                    {product.price.toFixed(
                                                                        2
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )}
                                </div>
                            </div>

                            <div className="w-full lg:w-1/6">
                                <label
                                    htmlFor="quantity"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    Quantity
                                </label>
                                <input
                                    type="number"
                                    id="quantity"
                                    min="1"
                                    value={currentQuantity}
                                    onChange={(e) =>
                                        setCurrentQuantity(
                                            Number(e.target.value)
                                        )
                                    }
                                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                />
                            </div>

                            <div className="w-full lg:w-1/6">
                                <label
                                    htmlFor="price"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    Price
                                </label>
                                <input
                                    type="number"
                                    id="price"
                                    step="0.01"
                                    min="0"
                                    value={currentPrice}
                                    onChange={(e) =>
                                        setCurrentPrice(Number(e.target.value))
                                    }
                                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={addItem}
                                className="w-full lg:w-auto px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                            >
                                <span className="flex items-center justify-center">
                                    <FiPlus className="mr-2 h-5 w-5" />
                                    Add Item
                                </span>
                            </button>
                        </div>

                        {/* Items Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Product
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Quantity
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Price
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Total
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-6 py-4 text-center text-sm text-black"
                                            >
                                                No items added yet
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map((item, index) => (
                                            <tr key={index}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                                                    {item.productName}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        max={
                                                            item.availableStock
                                                        }
                                                        onChange={(e) =>
                                                            updateItemQuantity(
                                                                index,
                                                                parseInt(
                                                                    e.target
                                                                        .value
                                                                )
                                                            )
                                                        }
                                                        className="w-20 pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={item.price}
                                                        onChange={(e) =>
                                                            updateItemPrice(
                                                                index,
                                                                Number(
                                                                    e.target
                                                                        .value
                                                                )
                                                            )
                                                        }
                                                        className="w-24 pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    $
                                                    {item.totalPrice.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeItem(index)
                                                        }
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <FiTrash2 className="h-5 w-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Summary */}
                        {items.length > 0 && (
                            <div className="border-t pt-4">
                                <div className="flex flex-col space-y-2 text-sm md:text-base">
                                    <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span>
                                            ${calculateSubtotal().toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Discount ({discount}%):</span>
                                        <span>
                                            -$
                                            {calculateDiscountAmount().toFixed(
                                                2
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Tax ({tax}%):</span>
                                        <span>
                                            ${calculateTaxAmount().toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Total:</span>
                                        <span>
                                            ${calculateTotal().toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}

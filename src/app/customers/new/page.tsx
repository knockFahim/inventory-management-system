"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { FiChevronLeft, FiSave } from "react-icons/fi";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function NewCustomerPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [houseNumber, setHouseNumber] = useState("");
    const [road, setRoad] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [postalCode, setPostalCode] = useState("");
    const [country, setCountry] = useState("");
    const [notes, setNotes] = useState("");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!name.trim()) {
            toast.error("Customer name is required");
            return;
        }

        // Email validation if provided
        if (email && !/^\S+@\S+\.\S+$/.test(email)) {
            toast.error("Please enter a valid email address");
            return;
        }

        try {
            setIsSubmitting(true);

            const customerData = {
                name,
                email: email || undefined,
                phone: phone || undefined,
                houseNumber: houseNumber || undefined,
                road: road || undefined,
                city: city || undefined,
                state: state || undefined,
                postalCode: postalCode || undefined,
                country: country || undefined,
                notes: notes || undefined,
            };

            const response = await fetch("/api/customers", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(customerData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to create customer");
            }

            const customer = await response.json();
            toast.success("Customer created successfully");
            router.push(`/customers/${customer.id}`);
        } catch (error) {
            console.error("Error creating customer:", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to create customer"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    if (status === "loading") {
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
                            onClick={() => router.push("/customers")}
                            className="mr-3 inline-flex items-center p-2 rounded-md hover:bg-gray-100"
                        >
                            <FiChevronLeft className="h-5 w-5" />
                        </button>
                        <h1 className="text-2xl font-bold text-black">
                            Add New Customer
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
                                Save Customer
                            </>
                        )}
                    </button>
                </div>

                <form
                    className="bg-white shadow-sm rounded-lg p-6"
                    onSubmit={handleSubmit}
                >
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-lg font-medium text-gray-900">
                                Basic Information
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Enter customer's basic contact details.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label
                                    htmlFor="name"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Full Name{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                    required
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                    placeholder="john.doe@example.com"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="phone"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Phone
                                </label>
                                <input
                                    id="phone"
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                    placeholder="+1 (555) 123-4567"
                                />
                            </div>
                        </div>

                        <div className="pt-5">
                            <h2 className="text-lg font-medium text-gray-900">
                                Address Information
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Enter customer's detailed address information.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label
                                    htmlFor="houseNumber"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    House/Building Number
                                </label>
                                <input
                                    id="houseNumber"
                                    type="text"
                                    value={houseNumber}
                                    onChange={(e) =>
                                        setHouseNumber(e.target.value)
                                    }
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                    placeholder="Apt 123"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="road"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Road/Street
                                </label>
                                <input
                                    id="road"
                                    type="text"
                                    value={road}
                                    onChange={(e) => setRoad(e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                    placeholder="123 Main Street"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="city"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    City
                                </label>
                                <input
                                    id="city"
                                    type="text"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                    placeholder="New York"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="state"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    State/Province
                                </label>
                                <input
                                    id="state"
                                    type="text"
                                    value={state}
                                    onChange={(e) => setState(e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                    placeholder="NY"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="postalCode"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Postal Code
                                </label>
                                <input
                                    id="postalCode"
                                    type="text"
                                    value={postalCode}
                                    onChange={(e) =>
                                        setPostalCode(e.target.value)
                                    }
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                    placeholder="10001"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="country"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Country
                                </label>
                                <input
                                    id="country"
                                    type="text"
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                    placeholder="United States"
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="notes"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Notes (Optional)
                            </label>
                            <textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                placeholder="Add any additional information about this customer..."
                            />
                        </div>

                        <div className="pt-5 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => router.push("/customers")}
                                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "Saving..." : "Save Customer"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}

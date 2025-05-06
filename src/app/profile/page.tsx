"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { FiUser, FiMail, FiLock, FiSave } from "react-icons/fi";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function ProfilePage() {
    const { data: session, status, update } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    // Password update mode
    const [changePassword, setChangePassword] = useState(false);

    // Load user data when session is available
    useEffect(() => {
        if (session?.user) {
            setFormData({
                name: session.user.name || "",
                email: session.user.email || "",
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        }
    }, [session]);

    // Check if user is authenticated
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setIsLoading(true);

            // Validate form data
            if (changePassword) {
                if (formData.newPassword !== formData.confirmPassword) {
                    toast.error("New passwords do not match");
                    return;
                }

                if (formData.newPassword.length < 6) {
                    toast.error("Password must be at least 6 characters");
                    return;
                }
            }

            // Prepare update data
            const updateData: any = {
                name: formData.name,
            };

            if (changePassword) {
                updateData.password = formData.newPassword;
                updateData.currentPassword = formData.currentPassword;
            }

            // Make API request to update profile
            const response = await fetch(`/api/users/${session?.user.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.message || "Failed to update profile"
                );
            }

            const updatedUser = await response.json();

            // Update the session with the new user data
            await update({
                ...session,
                user: {
                    ...session?.user,
                    name: updatedUser.name,
                },
            });

            // Reset password fields
            setFormData((prev) => ({
                ...prev,
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            }));

            setChangePassword(false);
            toast.success("Profile updated successfully");
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error(
                error.message || "An error occurred while updating profile"
            );
        } finally {
            setIsLoading(false);
        }
    };

    // If loading or not authenticated yet
    if (status === "loading" || status === "unauthenticated") {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="container mx-auto px-4 py-8 max-w-3xl">
                <h1 className="text-2xl font-semibold text-gray-800 mb-6">
                    My Profile
                </h1>

                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    {/* User Info Header */}
                    <div className="bg-blue-50 p-6 border-b border-blue-100">
                        <div className="flex items-center">
                            <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <FiUser className="h-10 w-10" />
                            </div>
                            <div className="ml-6">
                                <h2 className="text-xl font-medium text-gray-800">
                                    {session?.user.name}
                                </h2>
                                <p className="text-gray-600">
                                    {session?.user.email}
                                </p>
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                                        session?.user.role === "ADMIN"
                                            ? "bg-red-100 text-red-800"
                                            : session?.user.role === "MANAGER"
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-green-100 text-green-800"
                                    }`}
                                >
                                    {session?.user.role}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Profile Form */}
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="space-y-6">
                            {/* Name Field */}
                            <div>
                                <label
                                    htmlFor="name"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Full Name
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiUser className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Your full name"
                                    />
                                </div>
                            </div>

                            {/* Email Field (read-only) */}
                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Email Address
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiMail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        readOnly
                                        value={formData.email}
                                        className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Email address cannot be changed. Contact an
                                    administrator if you need to update your
                                    email.
                                </p>
                            </div>

                            {/* Password Section */}
                            <div className="pt-4 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium text-gray-800">
                                        Password
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setChangePassword(!changePassword)
                                        }
                                        className="text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        {changePassword
                                            ? "Cancel"
                                            : "Change Password"}
                                    </button>
                                </div>

                                {changePassword && (
                                    <div className="mt-4 space-y-4">
                                        {/* Current Password */}
                                        <div>
                                            <label
                                                htmlFor="currentPassword"
                                                className="block text-sm font-medium text-gray-700"
                                            >
                                                Current Password
                                            </label>
                                            <div className="mt-1 relative rounded-md shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <FiLock className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="password"
                                                    id="currentPassword"
                                                    name="currentPassword"
                                                    required={changePassword}
                                                    value={
                                                        formData.currentPassword
                                                    }
                                                    onChange={handleChange}
                                                    className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="Enter your current password"
                                                />
                                            </div>
                                        </div>

                                        {/* New Password */}
                                        <div>
                                            <label
                                                htmlFor="newPassword"
                                                className="block text-sm font-medium text-gray-700"
                                            >
                                                New Password
                                            </label>
                                            <div className="mt-1 relative rounded-md shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <FiLock className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="password"
                                                    id="newPassword"
                                                    name="newPassword"
                                                    required={changePassword}
                                                    value={formData.newPassword}
                                                    onChange={handleChange}
                                                    className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="Enter new password"
                                                    minLength={6}
                                                />
                                            </div>
                                        </div>

                                        {/* Confirm Password */}
                                        <div>
                                            <label
                                                htmlFor="confirmPassword"
                                                className="block text-sm font-medium text-gray-700"
                                            >
                                                Confirm Password
                                            </label>
                                            <div className="mt-1 relative rounded-md shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <FiLock className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="password"
                                                    id="confirmPassword"
                                                    name="confirmPassword"
                                                    required={changePassword}
                                                    value={
                                                        formData.confirmPassword
                                                    }
                                                    onChange={handleChange}
                                                    className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="Confirm new password"
                                                    minLength={6}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div className="pt-5">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <FiSave className="mr-2" />
                                    {isLoading ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}

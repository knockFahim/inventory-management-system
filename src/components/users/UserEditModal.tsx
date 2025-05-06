import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FiX } from "react-icons/fi";
import { useSession } from "next-auth/react";
import { checkPermission } from "@/lib/auth";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface UserEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUserUpdated: () => void;
    user: User;
}

const UserEditModal: React.FC<UserEditModalProps> = ({
    isOpen,
    onClose,
    onUserUpdated,
    user,
}) => {
    const { data: session } = useSession();
    const isCurrentUser = session?.user.id === user.id;
    const isAdmin = checkPermission.isAdmin(session);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        currentPassword: "",
        role: "",
    });

    const [isLoading, setIsLoading] = useState(false);

    // Initialize form data when user prop changes
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || "",
                email: user.email || "",
                password: "",
                currentPassword: "",
                role: user.role || "",
            });
        }
    }, [user]);

    // Handle form input changes
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setIsLoading(true);

            // Prepare the update data - only send fields that have been changed
            const updateData: any = {};
            if (formData.name !== user.name) updateData.name = formData.name;
            if (formData.email !== user.email)
                updateData.email = formData.email;
            if (formData.role !== user.role && isAdmin)
                updateData.role = formData.role;
            if (formData.password) {
                updateData.password = formData.password;
                if (isCurrentUser) {
                    updateData.currentPassword = formData.currentPassword;
                }
            }

            // Don't make API call if nothing changed
            if (Object.keys(updateData).length === 0) {
                toast.info("No changes to update");
                onClose();
                return;
            }

            const response = await fetch(`/api/users/${user.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to update user");
            }

            toast.success("User updated successfully");
            onUserUpdated();
            onClose();
        } catch (error) {
            console.error("Error updating user:", error);
            toast.error(
                error.message || "An error occurred while updating user"
            );
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center border-b px-6 py-4">
                    <h3 className="text-lg font-medium">Edit User</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500"
                    >
                        <FiX className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-4">
                        {/* Name Field */}
                        <div>
                            <label
                                htmlFor="name"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Email Field */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                disabled={!isAdmin}
                                className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                    !isAdmin ? "bg-gray-100" : ""
                                }`}
                            />
                            {!isAdmin && (
                                <p className="mt-1 text-xs text-gray-500">
                                    Only administrators can change email
                                    addresses.
                                </p>
                            )}
                        </div>

                        {/* New Password Field */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700"
                            >
                                New Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Leave blank to keep current password"
                                minLength={6}
                            />
                        </div>

                        {/* Current Password Field (only for self-update) */}
                        {isCurrentUser && (
                            <div>
                                <label
                                    htmlFor="currentPassword"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    id="currentPassword"
                                    name="currentPassword"
                                    value={formData.currentPassword}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Required to change password"
                                    required={!!formData.password}
                                />
                            </div>
                        )}

                        {/* Role Selection (only for admins) */}
                        {isAdmin && (
                            <div>
                                <label
                                    htmlFor="role"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Role
                                </label>
                                <select
                                    id="role"
                                    name="role"
                                    required
                                    value={formData.role}
                                    onChange={handleChange}
                                    disabled={isCurrentUser}
                                    className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                        isCurrentUser ? "bg-gray-100" : ""
                                    }`}
                                >
                                    <option value="ADMIN">Admin</option>
                                    <option value="MANAGER">Manager</option>
                                    <option value="STAFF">Staff</option>
                                </select>
                                {isCurrentUser && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        You cannot change your own role.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                        >
                            {isLoading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserEditModal;

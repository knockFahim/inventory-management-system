"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { FiEdit, FiTrash2, FiPlus, FiSearch } from "react-icons/fi";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { checkPermission } from "@/lib/auth";
import UserCreateModal from "@/components/users/UserCreateModal";
import UserEditModal from "@/components/users/UserEditModal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";

export default function UsersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState({
        role: "",
    });

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Check if user is authenticated
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (
            status === "authenticated" &&
            !checkPermission.isManager(session)
        ) {
            // Redirect non-admin/manager users
            router.push("/dashboard");
            toast.error("You don't have permission to access this page");
        }
    }, [status, session, router]);

    // Fetch users
    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const queryParams = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
            });

            if (search) queryParams.append("search", search);
            if (filter.role) queryParams.append("role", filter.role);

            const response = await fetch(
                `/api/users?${queryParams.toString()}`
            );

            if (!response.ok) {
                throw new Error("Failed to fetch users");
            }

            const data = await response.json();
            setUsers(data.users);
            setPagination(data.pagination);
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("An error occurred while fetching users");
        } finally {
            setIsLoading(false);
        }
    };

    // Load users on component mount and when filters change
    useEffect(() => {
        if (status === "authenticated" && checkPermission.isManager(session)) {
            fetchUsers();
        }
    }, [status, session, pagination.page, search, filter.role]);

    // Handle user deletion
    const handleDeleteUser = async () => {
        try {
            if (!selectedUser) return;

            const response = await fetch(`/api/users/${selectedUser.id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to delete user");
            }

            toast.success("User deleted successfully");
            fetchUsers(); // Refresh the users list
            setShowDeleteModal(false);
        } catch (error) {
            console.error("Error deleting user:", error);
            toast.error(
                error.message || "An error occurred while deleting the user"
            );
        }
    };

    // Handle user action buttons
    const handleEdit = (user) => {
        setSelectedUser(user);
        setShowEditModal(true);
    };

    const handleDelete = (user) => {
        setSelectedUser(user);
        setShowDeleteModal(true);
    };

    // If loading or not authenticated yet
    if (
        status === "loading" ||
        (status === "authenticated" && !checkPermission.isManager(session))
    ) {
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
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">
                        User Management
                    </h1>
                    {checkPermission.isAdmin(session) && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
                        >
                            <FiPlus className="mr-2" />
                            Add User
                        </button>
                    )}
                </div>

                {/* Search and Filter */}
                <div className="mb-6 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name or email"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md pl-10"
                        />
                        <FiSearch className="absolute left-3 top-3 text-gray-400" />
                    </div>

                    <select
                        value={filter.role}
                        onChange={(e) =>
                            setFilter({ ...filter, role: e.target.value })
                        }
                        className="px-4 py-2 border border-gray-300 rounded-md"
                    >
                        <option value="">All Roles</option>
                        <option value="ADMIN">Admin</option>
                        <option value="MANAGER">Manager</option>
                        <option value="STAFF">Staff</option>
                    </select>
                </div>

                {/* Users Table */}
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created At
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-6 py-4 text-center"
                                    >
                                        Loading users...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-6 py-4 text-center"
                                    >
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {user.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">
                                                {user.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    user.role === "ADMIN"
                                                        ? "bg-red-100 text-red-800"
                                                        : user.role ===
                                                          "MANAGER"
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : "bg-green-100 text-green-800"
                                                }`}
                                            >
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">
                                                {new Date(
                                                    user.createdAt
                                                ).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {/* Don't show edit/delete for current user or if not admin */}
                                            <div className="flex items-center justify-end space-x-2">
                                                {checkPermission.isAdmin(
                                                    session
                                                ) && (
                                                    <>
                                                        <button
                                                            onClick={() =>
                                                                handleEdit(user)
                                                            }
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                        >
                                                            <FiEdit className="h-5 w-5" />
                                                        </button>
                                                        {user.id !==
                                                            session.user.id && (
                                                            <button
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        user
                                                                    )
                                                                }
                                                                className="text-red-600 hover:text-red-900"
                                                            >
                                                                <FiTrash2 className="h-5 w-5" />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!isLoading && pagination.totalPages > 0 && (
                    <div className="flex justify-between items-center mt-6">
                        <div className="text-sm text-gray-700">
                            Showing{" "}
                            <span className="font-medium">
                                {(pagination.page - 1) * pagination.limit + 1}
                            </span>{" "}
                            to{" "}
                            <span className="font-medium">
                                {Math.min(
                                    pagination.page * pagination.limit,
                                    pagination.total
                                )}
                            </span>{" "}
                            of{" "}
                            <span className="font-medium">
                                {pagination.total}
                            </span>{" "}
                            results
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() =>
                                    setPagination({
                                        ...pagination,
                                        page: pagination.page - 1,
                                    })
                                }
                                disabled={pagination.page === 1}
                                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                                    pagination.page === 1
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : "bg-white text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                                Previous
                            </button>
                            <button
                                onClick={() =>
                                    setPagination({
                                        ...pagination,
                                        page: pagination.page + 1,
                                    })
                                }
                                disabled={
                                    pagination.page === pagination.totalPages
                                }
                                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                                    pagination.page === pagination.totalPages
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : "bg-white text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <UserCreateModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onUserCreated={fetchUsers}
                />
            )}

            {/* Edit User Modal */}
            {showEditModal && selectedUser && (
                <UserEditModal
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedUser(null);
                    }}
                    user={selectedUser}
                    onUserUpdated={fetchUsers}
                />
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedUser && (
                <DeleteConfirmModal
                    isOpen={showDeleteModal}
                    onClose={() => {
                        setShowDeleteModal(false);
                        setSelectedUser(null);
                    }}
                    onConfirm={handleDeleteUser}
                    title="Delete User"
                    message={`Are you sure you want to delete the user "${selectedUser.name}"? This action cannot be undone.`}
                />
            )}
        </DashboardLayout>
    );
}

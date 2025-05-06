import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
    FiPlus,
    FiTrash2,
    FiCheck,
    FiStar,
    FiEdit2,
    FiX,
} from "react-icons/fi";

interface Supplier {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
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

interface ProductSupplierManagementProps {
    productId: string;
    existingSuppliers: ProductSupplier[];
    onUpdate: () => void;
}

export default function ProductSupplierManagement({
    productId,
    existingSuppliers,
    onUpdate,
}: ProductSupplierManagementProps) {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedSupplierId, setSelectedSupplierId] = useState("");
    const [isPreferred, setIsPreferred] = useState(false);
    const [unitPrice, setUnitPrice] = useState<string>("");
    const [notes, setNotes] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({
        isPreferred: false,
        unitPrice: "",
        notes: "",
    });

    // Fetch all available suppliers
    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                setIsLoading(true);
                const response = await axios.get("/api/suppliers");
                setSuppliers(response.data);
            } catch (error) {
                console.error("Error fetching suppliers:", error);
                toast.error("Failed to load suppliers");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSuppliers();
    }, []);

    // Filter out suppliers that are already associated with this product
    const availableSuppliers = suppliers.filter(
        (supplier) =>
            !existingSuppliers.some((ps) => ps.supplierId === supplier.id)
    );

    const handleAddSupplier = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedSupplierId) {
            toast.error("Please select a supplier");
            return;
        }

        try {
            setIsLoading(true);
            await axios.post(`/api/products/${productId}/suppliers`, {
                supplierId: selectedSupplierId,
                isPreferred,
                unitPrice: unitPrice ? parseFloat(unitPrice) : undefined,
                notes: notes.trim() !== "" ? notes : undefined,
            });

            toast.success("Supplier added to product successfully");
            setShowAddForm(false);
            resetForm();
            onUpdate(); // Refresh product data
        } catch (error) {
            console.error("Error adding supplier:", error);
            toast.error("Failed to add supplier");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveSupplier = async (supplierId: string) => {
        try {
            setIsLoading(true);
            await axios.delete(
                `/api/products/${productId}/suppliers?supplierId=${supplierId}`
            );

            toast.success("Supplier removed from product");
            onUpdate(); // Refresh product data
        } catch (error) {
            console.error("Error removing supplier:", error);
            toast.error("Failed to remove supplier");
        } finally {
            setIsLoading(false);
        }
    };

    const startEditing = (productSupplier: ProductSupplier) => {
        setEditingId(productSupplier.id);
        setEditForm({
            isPreferred: productSupplier.isPreferred,
            unitPrice: productSupplier.unitPrice?.toString() || "",
            notes: productSupplier.notes || "",
        });
    };

    const cancelEditing = () => {
        setEditingId(null);
    };

    const handleUpdateSupplier = async (supplierId: string) => {
        try {
            setIsLoading(true);
            await axios.patch(`/api/products/${productId}/suppliers`, {
                supplierId,
                isPreferred: editForm.isPreferred,
                unitPrice: editForm.unitPrice
                    ? parseFloat(editForm.unitPrice)
                    : undefined,
                notes:
                    editForm.notes.trim() !== "" ? editForm.notes : undefined,
            });

            toast.success("Supplier information updated");
            setEditingId(null);
            onUpdate(); // Refresh product data
        } catch (error) {
            console.error("Error updating supplier:", error);
            toast.error("Failed to update supplier");
        } finally {
            setIsLoading(false);
        }
    };

    const setAsPreferred = async (supplierId: string) => {
        try {
            setIsLoading(true);
            await axios.patch(`/api/products/${productId}/suppliers`, {
                supplierId,
                isPreferred: true,
            });

            toast.success("Preferred supplier updated");
            onUpdate(); // Refresh product data
        } catch (error) {
            console.error("Error updating preferred supplier:", error);
            toast.error("Failed to update preferred supplier");
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setSelectedSupplierId("");
        setIsPreferred(false);
        setUnitPrice("");
        setNotes("");
    };

    return (
        <div className="space-y-4">
            {/* Existing Suppliers List */}
            {existingSuppliers.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Supplier
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Contact
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Unit Price
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Notes
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Preferred
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
                            {existingSuppliers.map((productSupplier) => (
                                <tr key={productSupplier.id}>
                                    {editingId === productSupplier.id ? (
                                        // Editing Mode
                                        <>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {
                                                        productSupplier.supplier
                                                            .name
                                                    }
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">
                                                    {productSupplier.supplier
                                                        .email || "N/A"}
                                                    <br />
                                                    {productSupplier.supplier
                                                        .phone || "N/A"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="number"
                                                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                    placeholder="Unit Price"
                                                    value={editForm.unitPrice}
                                                    onChange={(e) =>
                                                        setEditForm({
                                                            ...editForm,
                                                            unitPrice:
                                                                e.target.value,
                                                        })
                                                    }
                                                    step="0.01"
                                                    min="0"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="text"
                                                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                    placeholder="Notes"
                                                    value={editForm.notes}
                                                    onChange={(e) =>
                                                        setEditForm({
                                                            ...editForm,
                                                            notes: e.target
                                                                .value,
                                                        })
                                                    }
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                    checked={
                                                        editForm.isPreferred
                                                    }
                                                    onChange={(e) =>
                                                        setEditForm({
                                                            ...editForm,
                                                            isPreferred:
                                                                e.target
                                                                    .checked,
                                                        })
                                                    }
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex space-x-2 justify-end">
                                                    <button
                                                        onClick={() =>
                                                            handleUpdateSupplier(
                                                                productSupplier.supplierId
                                                            )
                                                        }
                                                        className="text-green-600 hover:text-green-900"
                                                        disabled={isLoading}
                                                    >
                                                        <FiCheck className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={cancelEditing}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <FiX className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        // View Mode
                                        <>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {
                                                        productSupplier.supplier
                                                            .name
                                                    }
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">
                                                    {productSupplier.supplier
                                                        .email || "N/A"}
                                                    <br />
                                                    {productSupplier.supplier
                                                        .phone || "N/A"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {productSupplier.unitPrice
                                                    ? `$${productSupplier.unitPrice.toFixed(
                                                          2
                                                      )}`
                                                    : "Not specified"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {productSupplier.notes ||
                                                    "None"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {productSupplier.isPreferred ? (
                                                    <FiStar className="h-5 w-5 text-yellow-500 mx-auto" />
                                                ) : (
                                                    <button
                                                        onClick={() =>
                                                            setAsPreferred(
                                                                productSupplier.supplierId
                                                            )
                                                        }
                                                        className="text-gray-400 hover:text-yellow-500"
                                                        title="Set as preferred supplier"
                                                    >
                                                        <FiStar className="h-5 w-5 mx-auto" />
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex space-x-3 justify-end">
                                                    <button
                                                        onClick={() =>
                                                            startEditing(
                                                                productSupplier
                                                            )
                                                        }
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        <FiEdit2 className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleRemoveSupplier(
                                                                productSupplier.supplierId
                                                            )
                                                        }
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <FiTrash2 className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-4 text-gray-500">
                    No suppliers associated with this product yet.
                </div>
            )}

            {/* Add Supplier Form */}
            {!showAddForm ? (
                <div className="mt-4 flex justify-start">
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                        disabled={availableSuppliers.length === 0}
                    >
                        <FiPlus className="mr-2" />
                        Add Supplier
                    </button>
                </div>
            ) : (
                <div className="bg-gray-50 p-4 rounded-md mt-4">
                    <h4 className="mb-4 text-lg font-medium text-gray-900">
                        Add Supplier
                    </h4>
                    <form onSubmit={handleAddSupplier}>
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            <div className="sm:col-span-3">
                                <label
                                    htmlFor="supplier"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Supplier *
                                </label>
                                <select
                                    id="supplier"
                                    value={selectedSupplierId}
                                    onChange={(e) =>
                                        setSelectedSupplierId(e.target.value)
                                    }
                                    className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    required
                                >
                                    <option value="">Select a supplier</option>
                                    {availableSuppliers.map((supplier) => (
                                        <option
                                            key={supplier.id}
                                            value={supplier.id}
                                        >
                                            {supplier.name}
                                        </option>
                                    ))}
                                </select>
                                {availableSuppliers.length === 0 && (
                                    <p className="mt-1 text-sm text-red-500">
                                        All suppliers are already associated
                                        with this product.
                                    </p>
                                )}
                            </div>

                            <div className="sm:col-span-3">
                                <label
                                    htmlFor="unitPrice"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Unit Price
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="number"
                                        name="unitPrice"
                                        id="unitPrice"
                                        step="0.01"
                                        min="0"
                                        value={unitPrice}
                                        onChange={(e) =>
                                            setUnitPrice(e.target.value)
                                        }
                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                        placeholder="Supplier-specific unit price (optional)"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-6">
                                <label
                                    htmlFor="notes"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Notes
                                </label>
                                <div className="mt-1">
                                    <textarea
                                        id="notes"
                                        name="notes"
                                        rows={3}
                                        value={notes}
                                        onChange={(e) =>
                                            setNotes(e.target.value)
                                        }
                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                        placeholder="Any notes about this supplier (optional)"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-6">
                                <div className="flex items-start">
                                    <div className="flex items-center h-5">
                                        <input
                                            id="isPreferred"
                                            name="isPreferred"
                                            type="checkbox"
                                            checked={isPreferred}
                                            onChange={(e) =>
                                                setIsPreferred(e.target.checked)
                                            }
                                            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                        />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label
                                            htmlFor="isPreferred"
                                            className="font-medium text-gray-700"
                                        >
                                            Set as preferred supplier
                                        </label>
                                        <p className="text-gray-500">
                                            Mark this supplier as the preferred
                                            choice for this product
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                            <button
                                type="submit"
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                                disabled={isLoading || !selectedSupplierId}
                            >
                                Add
                            </button>
                            <button
                                type="button"
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                                onClick={() => {
                                    setShowAddForm(false);
                                    resetForm();
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

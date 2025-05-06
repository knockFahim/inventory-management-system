"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";

// Define form schema with Zod
const productSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    sku: z.string().min(3, "SKU must be at least 3 characters"),
    description: z.string().optional(),
    price: z.preprocess(
        (val) => (val === "" ? undefined : Number(val)),
        z.number().min(0, "Price must be a positive number")
    ),
    costPrice: z.preprocess(
        (val) => (val === "" ? undefined : Number(val)),
        z.number().min(0, "Cost price must be a positive number")
    ),
    quantity: z.preprocess(
        (val) => (val === "" ? undefined : Number(val)),
        z
            .number()
            .int("Quantity must be a whole number")
            .min(0, "Quantity must be a positive number")
    ),
    minimumStock: z.preprocess(
        (val) => (val === "" ? undefined : Number(val)),
        z
            .number()
            .int("Minimum stock must be a whole number")
            .min(0, "Minimum stock must be a positive number")
    ),
    categoryId: z.string().min(1, "Category is required"),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Category {
    id: string;
    name: string;
}

interface ProductFormProps {
    productId?: string;
}

export default function ProductForm({ productId }: ProductFormProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const isEditMode = Boolean(productId);

    // Initialize form with react-hook-form
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
        setValue,
    } = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: "",
            sku: "",
            description: "",
            price: 0,
            costPrice: 0,
            quantity: 0,
            minimumStock: 10,
            categoryId: "",
        },
    });

    // Fetch categories for dropdown
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                // In a real application, this would fetch from a categories API endpoint
                // For now, we'll use sample data
                const mockCategories: Category[] = [
                    { id: "1", name: "Groceries" },
                    { id: "2", name: "Dairy" },
                    { id: "3", name: "Bakery" },
                    { id: "4", name: "Beverages" },
                    { id: "5", name: "Household" },
                ];
                setCategories(mockCategories);
            } catch (error) {
                console.error("Error fetching categories:", error);
                toast.error("Failed to load categories");
            }
        };

        fetchCategories();
    }, []);

    // Fetch product data if in edit mode
    useEffect(() => {
        const fetchProduct = async () => {
            if (!productId) return;

            setIsLoading(true);
            try {
                const response = await axios.get(`/api/products/${productId}`);
                const product = response.data;

                // Set form values
                setValue("name", product.name);
                setValue("sku", product.sku);
                setValue("description", product.description || "");
                setValue("price", product.price);
                setValue("costPrice", product.costPrice);
                setValue("quantity", product.quantity);
                setValue("minimumStock", product.minimumStock);
                setValue("categoryId", product.categoryId);
            } catch (error) {
                console.error("Error fetching product:", error);
                toast.error("Failed to load product data");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProduct();
    }, [productId, setValue]);

    // Handle form submission
    const onSubmit = async (data: ProductFormData) => {
        if (!session?.user) {
            toast.error("You must be logged in to perform this action");
            return;
        }

        try {
            const userId = session.user.id;
            const payload = { ...data, userId };

            if (isEditMode) {
                // Update existing product
                await axios.put(`/api/products/${productId}`, payload);
                toast.success("Product updated successfully");
            } else {
                // Create new product
                await axios.post("/api/products", payload);
                toast.success("Product created successfully");
                reset(); // Clear form after successful creation
            }

            router.push("/products");
        } catch (error: any) {
            console.error("Error saving product:", error);
            toast.error(
                error.response?.data?.message || "Error saving product"
            );
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div className="col-span-2 sm:col-span-1">
                    <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Product Name *
                    </label>
                    <input
                        type="text"
                        id="name"
                        {...register("name")}
                        className={`mt-1 py-2 px-3 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md text-black ${
                            errors.name ? "border-red-500" : ""
                        }`}
                    />
                    {errors.name && (
                        <p className="mt-1 text-sm text-error">
                            {errors.name.message}
                        </p>
                    )}
                </div>

                <div className="col-span-2 sm:col-span-1">
                    <label
                        htmlFor="sku"
                        className="block text-sm font-medium text-gray-700"
                    >
                        SKU *
                    </label>
                    <input
                        type="text"
                        id="sku"
                        {...register("sku")}
                        className={`mt-1 py-2 px-3 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md text-black ${
                            errors.sku ? "border-red-500" : ""
                        }`}
                    />
                    {errors.sku && (
                        <p className="mt-1 text-sm text-error">
                            {errors.sku.message}
                        </p>
                    )}
                </div>

                <div className="col-span-2">
                    <label
                        htmlFor="description"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Description
                    </label>
                    <textarea
                        id="description"
                        rows={3}
                        {...register("description")}
                        className="mt-1 py-2 px-3 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md text-black"
                    />
                    {errors.description && (
                        <p className="mt-1 text-sm text-error">
                            {errors.description.message}
                        </p>
                    )}
                </div>

                <div>
                    <label
                        htmlFor="categoryId"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Category *
                    </label>
                    <select
                        id="categoryId"
                        {...register("categoryId")}
                        className={`mt-1 block w-full py-2 px-3 border border-gray-300 bg-white text-black rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                            errors.categoryId ? "border-red-500" : ""
                        }`}
                    >
                        <option value="" className="text-black">
                            Select a category
                        </option>
                        {categories.map((category) => (
                            <option
                                key={category.id}
                                value={category.id}
                                className="text-black"
                            >
                                {category.name}
                            </option>
                        ))}
                    </select>
                    {errors.categoryId && (
                        <p className="mt-1 text-sm text-error">
                            {errors.categoryId.message}
                        </p>
                    )}
                </div>

                <div>
                    <label
                        htmlFor="price"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Selling Price *
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                            type="number"
                            id="price"
                            step="0.01"
                            min="0"
                            {...register("price")}
                            className={`py-2 px-3 focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md text-black ${
                                errors.price ? "border-red-500" : ""
                            }`}
                        />
                    </div>
                    {errors.price && (
                        <p className="mt-1 text-sm text-error">
                            {errors.price.message}
                        </p>
                    )}
                </div>

                <div>
                    <label
                        htmlFor="costPrice"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Cost Price *
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                            type="number"
                            id="costPrice"
                            step="0.01"
                            min="0"
                            {...register("costPrice")}
                            className={`py-2 px-3 focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md text-black ${
                                errors.costPrice ? "border-red-500" : ""
                            }`}
                        />
                    </div>
                    {errors.costPrice && (
                        <p className="mt-1 text-sm text-error">
                            {errors.costPrice.message}
                        </p>
                    )}
                </div>

                <div>
                    <label
                        htmlFor="quantity"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Current Quantity *
                    </label>
                    <input
                        type="number"
                        id="quantity"
                        min="0"
                        {...register("quantity")}
                        className={`mt-1 py-2 px-3 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md text-black ${
                            errors.quantity ? "border-red-500" : ""
                        }`}
                    />
                    {errors.quantity && (
                        <p className="mt-1 text-sm text-error">
                            {errors.quantity.message}
                        </p>
                    )}
                </div>

                <div>
                    <label
                        htmlFor="minimumStock"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Minimum Stock Level *
                    </label>
                    <input
                        type="number"
                        id="minimumStock"
                        min="0"
                        {...register("minimumStock")}
                        className={`mt-1 py-2 px-3 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md text-black ${
                            errors.minimumStock ? "border-red-500" : ""
                        }`}
                    />
                    {errors.minimumStock && (
                        <p className="mt-1 text-sm text-error">
                            {errors.minimumStock.message}
                        </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                        System will alert when stock falls below this value
                    </p>
                </div>
            </div>

            <div className="flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={() => router.push("/products")}
                    className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    {isSubmitting
                        ? "Saving..."
                        : isEditMode
                        ? "Update Product"
                        : "Create Product"}
                </button>
            </div>
        </form>
    );
}

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-toastify";
import axios from "axios";

// Define the validation schema for the form
const supplierSchema = z.object({
    name: z
        .string()
        .min(1, "Supplier name is required")
        .max(100, "Name must be less than 100 characters"),
    email: z
        .string()
        .email("Invalid email address")
        .max(100, "Email must be less than 100 characters")
        .nullable()
        .optional()
        .or(z.literal("")),
    phone: z
        .string()
        .max(20, "Phone number must be less than 20 characters")
        .nullable()
        .optional()
        .or(z.literal("")),
    address: z
        .string()
        .max(200, "Address must be less than 200 characters")
        .nullable()
        .optional()
        .or(z.literal("")),
});

// TypeScript interface for the form data
type SupplierFormData = z.infer<typeof supplierSchema>;

// Props interface
interface SupplierFormProps {
    supplierId?: string;
}

export default function SupplierForm({ supplierId }: SupplierFormProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const isEditMode = Boolean(supplierId);

    // Initialize form with react-hook-form
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
        setValue,
    } = useForm<SupplierFormData>({
        resolver: zodResolver(supplierSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            address: "",
        },
    });

    // Fetch supplier data if in edit mode
    useEffect(() => {
        const fetchSupplier = async () => {
            if (!supplierId) return;

            setIsLoading(true);
            try {
                const response = await axios.get(
                    `/api/suppliers/${supplierId}`
                );
                const supplier = response.data;

                // Set form values
                setValue("name", supplier.name);
                setValue("email", supplier.email || "");
                setValue("phone", supplier.phone || "");
                setValue("address", supplier.address || "");
            } catch (error) {
                console.error("Error fetching supplier:", error);
                toast.error("Failed to load supplier data");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSupplier();
    }, [supplierId, setValue]);

    // Handle form submission
    const onSubmit = async (data: SupplierFormData) => {
        if (!session?.user) {
            toast.error("You must be logged in to perform this action");
            return;
        }

        try {
            // Clean up empty string values to be null in the database
            const payload = {
                ...data,
                email: data.email || null,
                phone: data.phone || null,
                address: data.address || null,
            };

            if (isEditMode) {
                // Update existing supplier
                await axios.put(`/api/suppliers/${supplierId}`, payload);
                toast.success("Supplier updated successfully");
            } else {
                // Create new supplier
                await axios.post("/api/suppliers", payload);
                toast.success("Supplier created successfully");
                reset(); // Clear form after successful creation
            }

            router.push("/suppliers");
        } catch (error: any) {
            console.error("Error saving supplier:", error);
            toast.error(
                error.response?.data?.message ||
                    error.response?.data?.error ||
                    "Error saving supplier"
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
                        Supplier Name <span className="text-red-500">*</span>
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
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        {...register("email")}
                        className={`mt-1 py-2 px-3 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md text-black ${
                            errors.email ? "border-red-500" : ""
                        }`}
                    />
                    {errors.email && (
                        <p className="mt-1 text-sm text-error">
                            {errors.email.message}
                        </p>
                    )}
                </div>

                <div className="col-span-2 sm:col-span-1">
                    <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Phone
                    </label>
                    <input
                        type="tel"
                        id="phone"
                        {...register("phone")}
                        className={`mt-1 py-2 px-3 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md text-black ${
                            errors.phone ? "border-red-500" : ""
                        }`}
                    />
                    {errors.phone && (
                        <p className="mt-1 text-sm text-error">
                            {errors.phone.message}
                        </p>
                    )}
                </div>

                <div className="col-span-2">
                    <label
                        htmlFor="address"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Address
                    </label>
                    <textarea
                        id="address"
                        rows={3}
                        {...register("address")}
                        className={`mt-1 py-2 px-3 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md text-black ${
                            errors.address ? "border-red-500" : ""
                        }`}
                    />
                    {errors.address && (
                        <p className="mt-1 text-sm text-error">
                            {errors.address.message}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={() => router.push("/suppliers")}
                    className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-black bg-white hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400"
                >
                    {isSubmitting ? (
                        <>
                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                            {isEditMode ? "Updating..." : "Creating..."}
                        </>
                    ) : (
                        <>
                            {isEditMode ? "Update Supplier" : "Create Supplier"}
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}

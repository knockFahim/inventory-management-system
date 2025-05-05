import { PrismaClient } from "../src/generated/prisma";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

async function main() {
    try {
        // Create admin user
        const hashedPassword = await hash("Admin@123", 10);

        const admin = await prisma.user.upsert({
            where: { email: "admin@inventory.com" },
            update: {},
            create: {
                email: "admin@inventory.com",
                name: "Admin User",
                password: hashedPassword,
                role: "ADMIN",
            },
        });

        console.log("Admin user created:", admin);

        // Create sample categories
        const categories = await Promise.all([
            prisma.category.upsert({
                where: { name: "Groceries" },
                update: {},
                create: {
                    name: "Groceries",
                    description: "Food and daily necessity items",
                },
            }),
            prisma.category.upsert({
                where: { name: "Dairy" },
                update: {},
                create: {
                    name: "Dairy",
                    description: "Milk, cheese, and other dairy products",
                },
            }),
            prisma.category.upsert({
                where: { name: "Beverages" },
                update: {},
                create: {
                    name: "Beverages",
                    description: "Drinks and liquid refreshments",
                },
            }),
        ]);

        console.log("Categories created:", categories);

        // Create sample products
        const products = await Promise.all([
            prisma.product.create({
                data: {
                    name: "Rice (5kg)",
                    sku: "RC-001",
                    description: "Premium quality rice",
                    price: 35.99,
                    costPrice: 28.5,
                    quantity: 25,
                    minimumStock: 10,
                    category: { connect: { name: "Groceries" } },
                    user: { connect: { id: admin.id } },
                },
            }),
            prisma.product.create({
                data: {
                    name: "Cooking Oil (1L)",
                    sku: "OIL-002",
                    description: "Pure vegetable cooking oil",
                    price: 22.5,
                    costPrice: 16.75,
                    quantity: 15,
                    minimumStock: 8,
                    category: { connect: { name: "Groceries" } },
                    user: { connect: { id: admin.id } },
                },
            }),
            prisma.product.create({
                data: {
                    name: "Milk Powder (500g)",
                    sku: "MP-003",
                    description: "Full cream milk powder",
                    price: 18.75,
                    costPrice: 14.25,
                    quantity: 20,
                    minimumStock: 10,
                    category: { connect: { name: "Dairy" } },
                    user: { connect: { id: admin.id } },
                },
            }),
        ]);

        console.log("Products created:", products);

        // Create a sample supplier
        const supplier = await prisma.supplier.create({
            data: {
                name: "Global Supplies Inc.",
                email: "info@globalsupplies.com",
                phone: "+1234567890",
                address: "123 Supply St, Business District",
            },
        });

        console.log("Supplier created:", supplier);

        // Create a sample customer
        const customer = await prisma.customer.create({
            data: {
                name: "John Doe",
                email: "john.doe@example.com",
                phone: "+9876543210",
                address: "456 Customer Ave, Residential Area",
            },
        });

        console.log("Customer created:", customer);

        console.log("Database seeded successfully!");
    } catch (error) {
        console.error("Error seeding database:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();

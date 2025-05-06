"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
    FiHome,
    FiBox,
    FiShoppingCart,
    FiBarChart2,
    FiUsers,
    FiSettings,
    FiMenu,
    FiX,
    FiLogOut,
    FiChevronDown,
    FiUser,
    FiTruck,
} from "react-icons/fi";

const Navigation = () => {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    const navigation = [
        { name: "Dashboard", href: "/dashboard", icon: FiHome },
        { name: "Products", href: "/products", icon: FiBox },
        { name: "Inventory", href: "/inventory", icon: FiBarChart2 },
        { name: "Sales", href: "/sales", icon: FiShoppingCart },
        { name: "Suppliers", href: "/suppliers", icon: FiTruck },
        { name: "Customers", href: "/customers", icon: FiUsers },
    ];

    const isActive = (path: string) => {
        return pathname === path || pathname?.startsWith(`${path}/`);
    };

    const handleSignOut = async () => {
        await signOut({ redirect: true, callbackUrl: "/login" });
    };

    return (
        <>
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <Link
                                    href="/dashboard"
                                    className="font-bold text-xl text-brand"
                                >
                                    Shop Inventory
                                </Link>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                {navigation.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`${
                                            isActive(item.href)
                                                ? "border-primary text-black font-semibold"
                                                : "border-transparent text-gray-600 hover:text-gray-800 hover:border-primary/50"
                                        } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                                    >
                                        <item.icon className="mr-2 h-5 w-5" />
                                        {item.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:items-center">
                            {/* Profile dropdown */}
                            <div className="ml-3 relative">
                                <div>
                                    <button
                                        type="button"
                                        className="bg-white rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                        id="user-menu"
                                        aria-expanded="false"
                                        aria-haspopup="true"
                                        onClick={() =>
                                            setIsProfileMenuOpen(
                                                !isProfileMenuOpen
                                            )
                                        }
                                    >
                                        <span className="sr-only">
                                            Open user menu
                                        </span>
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-gray-800">
                                            {session?.user?.name?.charAt(0) ||
                                                "U"}
                                        </div>
                                        <span className="ml-2 text-gray-800">
                                            {session?.user?.name || "User"}
                                        </span>
                                        <FiChevronDown className="ml-1 h-4 w-4 text-gray-800" />
                                    </button>
                                </div>

                                {/* Dropdown menu */}
                                {isProfileMenuOpen && (
                                    <div
                                        className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                                        role="menu"
                                        aria-orientation="vertical"
                                        aria-labelledby="user-menu"
                                    >
                                        <Link
                                            href="/profile"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary/5 flex items-center"
                                            role="menuitem"
                                            onClick={() =>
                                                setIsProfileMenuOpen(false)
                                            }
                                        >
                                            <FiUser className="mr-2 h-4 w-4" />
                                            My Profile
                                        </Link>
                                        {session?.user?.role === "ADMIN" && (
                                            <Link
                                                href="/users"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary/5 flex items-center"
                                                role="menuitem"
                                                onClick={() =>
                                                    setIsProfileMenuOpen(false)
                                                }
                                            >
                                                <FiUsers className="mr-2 h-4 w-4" />
                                                User Management
                                            </Link>
                                        )}
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-primary/5 flex items-center"
                                            role="menuitem"
                                        >
                                            <FiLogOut className="mr-2 h-4 w-4" />
                                            Sign out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="-mr-2 flex items-center sm:hidden">
                            {/* Mobile menu button */}
                            <button
                                type="button"
                                className="inline-flex items-center justify-center p-2 rounded-md text-tertiary hover:text-secondary hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                                aria-controls="mobile-menu"
                                aria-expanded="false"
                                onClick={() =>
                                    setIsMobileMenuOpen(!isMobileMenuOpen)
                                }
                            >
                                <span className="sr-only">Open main menu</span>
                                {isMobileMenuOpen ? (
                                    <FiX
                                        className="block h-6 w-6"
                                        aria-hidden="true"
                                    />
                                ) : (
                                    <FiMenu
                                        className="block h-6 w-6"
                                        aria-hidden="true"
                                    />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu, show/hide based on menu state */}
                {isMobileMenuOpen && (
                    <div className="sm:hidden" id="mobile-menu">
                        <div className="pt-2 pb-3 space-y-1">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`${
                                        isActive(item.href)
                                            ? "bg-primary/5 border-primary text-black font-semibold"
                                            : "border-transparent text-gray-600 hover:bg-primary/5 hover:border-primary/50 hover:text-gray-800"
                                    } block pl-3 pr-4 py-2 border-l-4 text-base font-medium flex items-center`}
                                >
                                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                        <div className="pt-4 pb-3 border-t border-primary/10">
                            <div className="flex items-center px-4">
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-gray-800 text-lg">
                                        {session?.user?.name?.charAt(0) || "U"}
                                    </div>
                                </div>
                                <div className="ml-3">
                                    <div className="text-base font-medium text-gray-800">
                                        {session?.user?.name || "User"}
                                    </div>
                                    <div className="text-sm font-medium text-gray-600">
                                        {session?.user?.email}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-3 space-y-1">
                                <Link
                                    href="/profile"
                                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-primary/5 flex items-center"
                                >
                                    <FiUser className="mr-3 h-5 w-5 text-gray-700" />
                                    My Profile
                                </Link>
                                {session?.user?.role === "ADMIN" && (
                                    <Link
                                        href="/users"
                                        className="block w-full text-left px-4 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-primary/5 flex items-center"
                                    >
                                        <FiUsers className="mr-3 h-5 w-5 text-gray-700" />
                                        User Management
                                    </Link>
                                )}
                                <button
                                    onClick={handleSignOut}
                                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-primary/5 flex items-center"
                                >
                                    <FiLogOut className="mr-3 h-5 w-5 text-gray-700" />
                                    Sign out
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </nav>
        </>
    );
};

export default Navigation;

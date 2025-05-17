"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
    LayoutDashboard,
    CalendarDays,
    Menu,
    ChevronLeft,
    LogOut,
    User,
    BarChart,
    School,
} from "lucide-react";
import { Button } from "../ui/button";
import { signOut } from "next-auth/react";

const AdminSidebar = () => {
    const [isOpen, setIsOpen] = useState(false);

    const menuItems = [
        {
            icon: <LayoutDashboard size={18} />,
            label: "Admin Portal",
            href: "/AdminPortal",
        },
        {
            icon: <CalendarDays size={18} />,
            label: "Events",
            href: "/EventsCRUD",
        },
        {
            icon: <User size={18} />,
            label: "Participants",
            href: "/Participants",
        },
        {
            icon: <BarChart size={18} />,
            label: "Event Stats",
            href: "/EventStatistics",
        },
        {
            icon: <School size={18} />,
            label: "College Stats",
            href: "/CollegeStatistics",
        },
    ];

    const toggleSidebar = () => setIsOpen(!isOpen);

    return (
        <>
            <div className="w-16 shrink-0" />
            <div
                className={`fixed top-0 left-0 z-50 bg-black text-white h-full transition-all duration-300 ${isOpen ? "w-64" : "w-16"
                    }`}
            >
                <div className="flex flex-col justify-between h-full">
                    <div>
                        <div className="flex justify-between items-center p-4">
                            {isOpen && <h1 className="text-xl font-bold">Admin Panel</h1>}
                            <Button
                                onClick={toggleSidebar}
                                className="text-gray-300 bg-transparent hover:bg-transparent hover:text-white cursor-pointer"
                            >
                                {isOpen ? <ChevronLeft size={24} /> : <Menu size={24} />}
                            </Button>
                        </div>

                        <ul className="mt-2 space-y-1">
                            {menuItems.map((item, index) => (
                                <li key={index}>
                                    <Link
                                        href={item.href}
                                        onClick={toggleSidebar}
                                        className="flex items-center p-3 hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
                                    >
                                        <span className="text-gray-300">{item.icon}</span>
                                        {isOpen && <span className="ml-3">{item.label}</span>}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="p-4 relative z-10">
                        {isOpen && (
                            <div className="mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-medium">
                                        A
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">Admin Name</p>
                                        <p className="text-xs text-gray-400">admin@email.com</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <Button className="flex items-center bg-transparent hover:bg-transparent text-red-500 hover:text-red-400 transition-colors text-sm cursor-pointer" onClick={async () => await signOut()}>
                            <LogOut size={18} />
                            {isOpen && <span className="ml-2">Logout</span>}
                        </Button>
                    </div>

                    {isOpen && (
                        <div className="absolute bottom-0 left-0 w-1/3 block">
                            <img
                                src="/profile-ch-left.png"
                                alt="Sidebar Character"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default AdminSidebar;
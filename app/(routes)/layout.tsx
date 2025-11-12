"use client";

import DashboardContent from "@/components/sections/DashboardContent";
import AppHeader from "@/components/sections/Header";
import { NAV_ITEMS } from "@/utils/data";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ContactPersonnel } from "@/data";

const MainLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window === "undefined") return "data_entries";
    return localStorage.getItem("app:activeTab") || "data_entries";
  });

  const [userRole, setUserRole] = useState<"admin" | "receptionist" | null>(null);

  // ✅ Authentication & Role Check
  useEffect(() => {
    const userData = localStorage.getItem("userInfo");

    if (!userData) {
      router.push("/sign-in"); // Redirect to sign-in if no user is logged in
      return;
    }

    try {
      const user: ContactPersonnel & { role: "admin" | "receptionist" } = JSON.parse(userData);
      setUserRole(user.role);
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/sign-in");
    }
  }, [router]);

  // Save the active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("app:activeTab", activeTab);
  }, [activeTab]);

  // ✅ Filter navigation based on role
  const filteredNavItems = useMemo(() => {
    if (userRole === "receptionist") {
      return NAV_ITEMS.filter((item) => item.id !== "facilities"); // Hide Facilities
    }
    return NAV_ITEMS;
  }, [userRole]);

  // ✅ Resolve the active component dynamically
  const ActiveComponent =
    filteredNavItems.find((item) => item.id === activeTab)?.Component ||
    DashboardContent;

  // ✅ Wait until userRole is known to avoid flashing content
  if (!userRole) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        Checking authentication...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <AppHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        navItems={filteredNavItems}
      />

      {/* Main Content */}
      <main className="mx-auto">
        <ActiveComponent setActiveTab={setActiveTab} />
      </main>
    </div>
  );
};

export default MainLayout;

'use client'
import DashboardContent from "@/components/sections/DashboardContent";
import AppHeader from "@/components/sections/Header";
import { NAV_ITEMS } from "@/utils/data";
import { useState } from "react";

// --- MAIN APPLICATION COMPONENT ---
const MainLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  // State to track which content view is currently active
  const [activeTab, setActiveTab] = useState('data_entries'); // 'Data Entries' is highlighted in the screenshot

  // Find the component corresponding to the active tab ID
  const ActiveComponent = NAV_ITEMS.find(item => item.id === activeTab)?.Component || DashboardContent;

  return (
    <div className="min-h-screen bg-gray-100 ">

      {/* 1. Header Component (Reusable) */}
      <AppHeader activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 2. Main Content Container */}
      <main className=" mx-auto">
        {/* 3. The Active Content Component (Conditional Rendering) */}
        <ActiveComponent />
      </main>
    </div>
  );
};

export default MainLayout;
import DashboardContent from "@/components/sections/DashboardContent";
import DataEntriesContent from "@/components/sections/DataEntriesContent";
import ReportsContent from "@/components/sections/ReportsContent";

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', Component: DashboardContent },
  { id: 'data_entries', label: 'Data Entries', Component: DataEntriesContent },
  { id: 'reports', label: 'Reports', Component: ReportsContent },
];
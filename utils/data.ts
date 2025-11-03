import DashboardContent from "@/components/sections/DashboardContent";
import DataEntriesContent from "@/components/sections/DataEntriesContent";
import FacilitiesContent from "@/components/sections/FacilitiesContent";
import ReportsContent from "@/components/sections/ReportsContent";

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', Component: DashboardContent },
  { id: 'data_entries', label: 'Data Entries', Component: DataEntriesContent },
  { id: 'facilities', label: 'Facilities', Component: FacilitiesContent },
  { id: 'reports', label: 'Reports', Component: ReportsContent },
];
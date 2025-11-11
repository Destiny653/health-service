import DashboardContent from "@/components/sections/DashboardContent";
import DataEntriesContent from "@/components/sections/DataEntriesContent";
import FacilitiesContent from "@/components/sections/FacilitiesContent";
import ReportsContent from "@/components/sections/ReportsContent";
import Settings from "@/components/sections/Settings";

export const NAV_ITEMS = [
  { id: 'settings', label: '', Component: Settings },
  { id: 'dashboard', label: 'Dashboard', Component: DashboardContent },
  { id: 'data_entries', label: 'Data Entries', Component: DataEntriesContent },
  { id: 'facilities', label: 'Facilities', Component: FacilitiesContent },
  { id: 'reports', label: 'Reports', Component: ReportsContent },
];

export const DataEntriesId = NAV_ITEMS[2].id;
export const DATA_ENTRIES_TAB_ID = "data_entries";
export const FACILITIES_TAB_ID = "facilities";
import DashboardContent from "@/components/sections/DashboardContent";
import DataEntriesContent from "@/components/sections/DataEntriesContent";
import FacilitiesContent from "@/components/sections/FacilitiesContent";
import ReportsContent from "@/components/sections/ReportsContent";
import Settings from "@/components/sections/Settings";
import AreaStatusContent from "@/components/sections/AreaStatusContent";
import FieldWorks from "@/components/sections/FieldWorks";
import { FileText, ClipboardList, MapPin, Settings as SettingsIcon, LucideIcon } from "lucide-react";
import { CalendarBlankIcon, GaugeIcon, GraphIcon, HospitalIcon, NavigationArrowIcon } from "@phosphor-icons/react";

export interface NavItem {
  id: string;
  label: string;
  Component: React.ComponentType<any>;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'settings', label: 'Settings', Component: Settings, icon: SettingsIcon },
  { id: 'dashboard', label: 'Dashboard', Component: DashboardContent, icon: GaugeIcon },
  { id: 'data_entries', label: 'Data Entries', Component: DataEntriesContent, icon: CalendarBlankIcon },
  { id: 'facilities', label: 'Facilities', Component: FacilitiesContent, icon: HospitalIcon },
  { id: 'reports', label: 'Reports', Component: ReportsContent, icon: ClipboardList },
  { id: 'area_status', label: 'Area Status', Component: AreaStatusContent, icon: NavigationArrowIcon },
  { id: 'field', label: 'Field', Component: FieldWorks, icon: GraphIcon },
];

export const DataEntriesId = NAV_ITEMS[2].id;
export const DATA_ENTRIES_TAB_ID = "data_entries";
export const FACILITIES_TAB_ID = "facilities";
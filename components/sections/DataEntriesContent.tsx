'use client';

import * as React from "react";
import { useState, useMemo, useEffect, useCallback, memo, useRef } from "react";
import { toast } from "sonner";
import {
  format,
  startOfYear,
  addYears,
  startOfMonth,
  addMonths,
  startOfWeek,
  addWeeks,
  addDays,
  getDay,
  isSameDay,
  startOfDay,
  isAfter,
} from "date-fns";
// --- UI & COMPONENTS ---
import { DataTable } from "@/components/PatientsTable";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import PatientEditSheet from "@/components/PatientDetailsModal";
import ImageViewer from "../ImageViewer";
import { exportToCSV, exportToExcel } from "@/utils/export";
import { CheckIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { ChevronsUpDown } from "lucide-react";
import { HorizontalSplitPane } from "../HorizontantalSplitPane";
import { useGetFacilities } from "../facility/hooks/useFacility";
import { PatientDocument, useGetDocumentsByFacility } from "../../hooks/docs/useGetDoc";
import { UserData } from "@/payload";

// --- INTERFACES ---
export interface Facility {
  _id: string;
  name: string;
  email: string[];
  phone: string[];
  parent_id?: string;
  facility_type: string;
  code: string;
  location?: {
    country: string;
    city: string;
    address: string;
    longitude?: number;
    latitude?: number;
  };
  submitted_status?: Record<string, "complete" | "incomplete" | "none">;
}

type ViewType = "YEAR" | "MONTH" | "WEEK" | "DAY";

interface TimeUnit {
  id: string;
  date: Date;
  label: string;
  value: string;
  statusColor: string;
  isToday: boolean;
}

interface DataEntriesContentProps {
  setActiveTab?: React.Dispatch<React.SetStateAction<string>>;
}

const STATUS_COLORS = {
  GREEN: "bg-green-500",   // complete
  YELLOW: "bg-yellow-400", // incomplete
  RED: "bg-red-500",       // missing / none
  GRAY: "bg-gray-300",     // future
} as const;

const VIEW_OPTIONS = [
  { label: "YEAR" as ViewType, tooltip: "View data grouped by year" },
  { label: "MONTH" as ViewType, tooltip: "View data grouped by month" },
  { label: "WEEK" as ViewType, tooltip: "View data grouped by week" },
  { label: "DAY" as ViewType, tooltip: "View data grouped by day" },
] as const;

const DAY_ABBRS = ["S", "M", "T", "W", "T", "F", "S"] as const;
const UNIT_COUNTS = { DAY: 7, WEEK: 8, MONTH: 8, YEAR: 7 } as const;
const DEBOUNCE_MS = 300;
const getStartOfToday = (): Date => startOfDay(new Date());

const dayAbbreviation = (date: Date): string => DAY_ABBRS[getDay(date)];

const getUnitStart = (date: Date, view: ViewType): Date => {
  switch (view) {
    case "DAY": return startOfDay(date);
    case "WEEK": return startOfWeek(date, { weekStartsOn: 1 });
    case "MONTH": return startOfMonth(date);
    case "YEAR": return startOfYear(date);
  }
};

const getUnitEnd = (start: Date, view: ViewType): Date => {
  switch (view) {
    case "DAY": return addDays(start, 1);
    case "WEEK": return addWeeks(start, 1);
    case "MONTH": return addMonths(start, 1);
    case "YEAR": return addYears(start, 1);
  }
};

const addByView = (date: Date, amount: number, view: ViewType): Date => {
  switch (view) {
    case "DAY": return addDays(date, amount);
    case "WEEK": return addWeeks(date, amount);
    case "MONTH": return addMonths(date, amount);
    case "YEAR": return addYears(date, amount);
  }
};

const getUnitId = (date: Date, view: ViewType): string => {
  switch (view) {
    case "DAY": return format(date, "yyyy-MM-dd");
    case "WEEK": return format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-ww");
    case "MONTH": return format(startOfMonth(date), "yyyy-MM");
    case "YEAR": return format(startOfYear(date), "yyyy");
  }
};

const getUnitLabel = (date: Date, view: ViewType): string => {
  switch (view) {
    case "YEAR": return "";
    case "WEEK": return `W${format(date, "w")}`;
    case "MONTH": return format(date, "MMM");
    case "DAY": return dayAbbreviation(date);
  }
};

const getUnitValue = (date: Date, view: ViewType): string => {
  switch (view) {
    case "YEAR": return format(date, "yyyy");
    case "WEEK": return format(date, "w");
    case "MONTH": return format(date, "M");
    case "DAY": return format(date, "d");
  }
};

const generateExportFilename = (
  districtName: string,
  view: ViewType,
  date: Date,
  status: string | null
): string => {
  const cleanDistrict = districtName.replace(/\s+/g, "_");
  const statusPart = status ? `_${status}` : "";
  let period = "";
  switch (view) {
    case "DAY": period = format(date, "yyyy-MM-dd"); break;
    case "WEEK": period = `Week-${format(startOfWeek(date, { weekStartsOn: 1 }), "w-yyyy")}`; break;
    case "MONTH": period = format(date, "MMM-yyyy"); break;
    case "YEAR": period = format(date, "yyyy"); break;
  }
  return `Patients_${cleanDistrict}_${period}${statusPart}`;
};

// Updated mapper - preserves full field objects + scores
const mapDocumentToPatient = (doc: PatientDocument): PatientDocument => ({
  _id: doc._id,
  date: doc.date,
  month_number: doc.month_number,
  case: doc.case,
  names: doc.names,
  sex: doc.sex,
  age: doc.age,
  status: doc.status,
  pregnant: doc.pregnant,
  patient_code: doc.patient_code,
  occupation: doc.occupation,
  residence: doc.residence,
  contact: doc.contact,
  past_history: doc.past_history,
  signs_symptoms: doc.signs_symptoms,
  diagnosis: doc.diagnosis,
  investigations: doc.investigations,
  results: doc.results,
  treatment: doc.treatment,
  confirmatory_diagnosis: doc.confirmatory_diagnosis,
  hospitalisation: doc.hospitalisation,
  receipt_no: doc.receipt_no,
  referral: doc.referral,
  observations: doc.observations,

  // Metadata
  metadata: doc.metadata,
  doc_code: doc.metadata?.doc_code,
  row_code: doc.metadata?.row_code,
  imageUrls: doc.metadata?.image_urls || null,
  verified_at: doc.metadata?.verified_at || "",
  verified_by: doc.metadata?.verified_by || "",
  modified_at: doc.metadata?.modified_at,
  modified_by: doc.metadata?.modified_by || "",
  facility_id: doc.metadata?.facility_id || "",
  is_dead: doc.metadata?.is_dead || false,
  is_latest: doc.metadata?.is_latest || false,
  version: doc.metadata?.version,
} as unknown as PatientDocument);

// =========================================================================
// MEMOIZED SUB-COMPONENTS
// =========================================================================
const TimeUnitItem = memo(({
  label,
  value,
  statusColor,
  isSelected
}: {
  label: string;
  value: string;
  statusColor: string;
  isSelected: boolean;
}) => (
  <div className="flex flex-col items-center relative">
    <div className="text-xs font-semibold text-gray-500 mb-1">{label}</div>
    <div
      className={cn(
        "w-8 h-8 flex items-center py-5 px-6 justify-center text-sm font-bold text-white rounded-md shadow-sm transition-transform",
        statusColor,
        isSelected ? "scale-110 ring-2 ring-blue-500" : "scale-100 hover:scale-105"
      )}
    >
      {value}
    </div>
    {isSelected && (
      <div className="w-7 h-1 bg-blue-600 rounded-full mt-1 absolute -bottom-2 animate-pulse" />
    )}
  </div>
));
TimeUnitItem.displayName = "TimeUnitItem";

const StatusFilterButton = memo(({
  status,
  label,
  color,
  isActive,
  onClick,
  tooltip
}: {
  status: string | null;
  label: string;
  color?: string;
  isActive: boolean;
  onClick: () => void;
  tooltip: string;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex items-center text-sm cursor-pointer transition-all px-4 py-2 group hover:scale-105",
          isActive && "bg-white rounded-md shadow-sm"
        )}
      >
        {color && <div className={cn("w-3 h-3 rounded-full mr-2", color)} />}
        <span
          className={cn(
            "overflow-hidden transition-all whitespace-nowrap duration-300 ease-in-out",
            isActive || !color
              ? "opacity-100 max-w-[100px]"
              : "group-hover:opacity-100 group-hover:max-w-[100px] opacity-0 max-w-0"
          )}
        >
          {label}
        </span>
      </button>
    </TooltipTrigger>
    <TooltipContent>{tooltip}</TooltipContent>
  </Tooltip>
));
StatusFilterButton.displayName = "StatusFilterButton";

const FacilityItem = memo(({
  facility,
  isSelected,
  onSelect
}: {
  facility: Facility;
  isSelected: boolean;
  onSelect: () => void;
}) => (
  <CommandItem value={facility.name} onSelect={onSelect}>
    <CheckIcon className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
    {facility.name}
  </CommandItem>
));
FacilityItem.displayName = "FacilityItem";

// =========================================================================
// CUSTOM HOOKS
// =========================================================================
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

const useUserData = (): UserData => {
  return useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      const str = localStorage.getItem('userData');
      return str ? JSON.parse(str) : null;
    } catch {
      return null;
    }
  }, []);
};

// =========================================================================
// MAIN COMPONENT
// =========================================================================
export default function DataEntriesContent({ setActiveTab }: DataEntriesContentProps) {
  // ---- State ----
  const today = useRef(getStartOfToday()).current;
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [activeView, setActiveView] = useState<ViewType>("YEAR");
  const [searchTerm, setSearchTerm] = useState("");
  const [showBottomPanel, setShowBottomPanel] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientDocument | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTabCon, setActiveTabCon] = useState<"details" | "history">("details");
  // Filters: "confirmed" | "pending" | null
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [facilityDropdownOpen, setFacilityDropdownOpen] = useState(false);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Debounced search for performance
  const debouncedSearch = useDebounce(searchTerm, DEBOUNCE_MS);

  // ---- User & Facility Data ----
  const personel = useUserData();
  const currentUserFacilityId = personel?.facility?.id;

  const { data: facilitiesData } = useGetFacilities(currentUserFacilityId);
  const facilities = useMemo(() => (facilitiesData?.results || []) as Facility[], [facilitiesData]);

  // ---- Get Selected Facility Object (Crucial for Status Logic) ----
  const selectedFacility = useMemo(() =>
    facilities.find(f => f._id === selectedFacilityId),
    [facilities, selectedFacilityId]
  );

  const selectedFacilityName = selectedFacility?.name || "Select District";

  // ---- Handle Initialization from Previous Page (LocalStorage) ----
  useEffect(() => {
    if (facilities.length > 0) {
      const pendingFacilityId = localStorage.getItem("pendingFacilityId");
      const pendingStatus = localStorage.getItem("pendingStatusFilter");
      const pendingDateIso = localStorage.getItem("pendingDate");

      if (pendingFacilityId) {
        const facilityExists = facilities.some(f => f._id === pendingFacilityId);
        console.log(facilityExists)
        if (facilityExists) {
          setSelectedFacilityId(pendingFacilityId);
        } else if (!selectedFacilityId) {
          setSelectedFacilityId(facilities[0]._id);
        }
      } else if (!selectedFacilityId) {
        setSelectedFacilityId(facilities[0]._id);
      }

      // pendingStatus comes from facilities content as "confirmed" or "pending"
      if (pendingStatus) {
        if (pendingStatus === "confirmed" || pendingStatus === "pending") {
          setSelectedStatus(pendingStatus);
        } else {
          setSelectedStatus(null);
        }
      }

      if (pendingDateIso) {
        const date = new Date(pendingDateIso);
        if (!isNaN(date.getTime())) {
          setSelectedDate(date);
        }
      }
    }
  }, [facilities]);

  // ---- Document Data ----
  const { data: documentsData, isLoading, isError } = useGetDocumentsByFacility(
    selectedFacilityId,
    { limit: 1000 }
  );

  useEffect(() => {
    if (isError) toast.error("Error fetching documents");
  }, [isError]);

  // Flatten all documents
  const allRawDocuments = useMemo(() => {
    if (!documentsData?.documents) return [];
    return Object.values(documentsData.documents).flatMap(group => group.rows);
  }, [documentsData]);

  // ---- Computed Values ----
  const selectedUnitId = useMemo(
    () => getUnitId(selectedDate, activeView),
    [selectedDate, activeView]
  );

  const [startRange, endRange] = useMemo(() => {
    const start = getUnitStart(selectedDate, activeView);
    return [start, getUnitEnd(start, activeView)] as const;
  }, [selectedDate, activeView]);


  /**
   * ─────────────────────────────────────────────────────────────────────
   * FACILITY STATUS LOGIC
   * Strictly based on the facility's submitted_status map.
   * ─────────────────────────────────────────────────────────────────────
   */
  const getFacilityStatusForDateRange = useCallback((
    start: Date,
    end: Date,
    facility: Facility | undefined
  ): "complete" | "incomplete" | "missing" | "future" => {
    const todayStart = startOfDay(new Date());
    if (isAfter(start, todayStart)) return "future";
    if (!facility) return "missing";

    let hasComplete = false;
    let hasInProgress = false;

    let current = start;
    while (current < end) {
      // IMPORTANT: Match the key format used in FacilitiesContent
      // usually "yyyy-MM-dd 00:00:00"
      const key = format(current, "yyyy-MM-dd 00:00:00");
      const status = facility.submitted_status?.[key];

      if (status === "complete") hasComplete = true;
      if (status === "incomplete") hasInProgress = true;

      current = addDays(current, 1);
    }

    if (hasInProgress) return "incomplete";
    if (hasComplete) return "complete";
    return "missing";
  }, []);


  const getStatusColor = useCallback((unitDate: Date, view: ViewType): string => {
    const unitStart = getUnitStart(unitDate, view);
    const unitEnd = getUnitEnd(unitStart, view);

    const status = getFacilityStatusForDateRange(unitStart, unitEnd, selectedFacility);

    switch (status) {
      case "complete": return STATUS_COLORS.GREEN;
      case "incomplete": return STATUS_COLORS.YELLOW;
      case "future": return STATUS_COLORS.GRAY;
      case "missing":
      default: return STATUS_COLORS.RED;
    }
  }, [selectedFacility, getFacilityStatusForDateRange]);


  const unitMatchesStatusFilter = useCallback((unitDate: Date, view: ViewType): boolean => {
    if (selectedStatus === null) return true;

    const unitStart = getUnitStart(unitDate, view);
    const unitEnd = getUnitEnd(unitStart, view);
    const status = getFacilityStatusForDateRange(unitStart, unitEnd, selectedFacility);

    // Map UI filter ("confirmed"/"pending") to Facility Status ("complete"/"incomplete")
    if (selectedStatus === "confirmed" && status === "complete") return true;
    if (selectedStatus === "pending" && status === "incomplete") return true;

    return false;
  }, [selectedFacility, selectedStatus, getFacilityStatusForDateRange]);


  // Generate visible time units (only what's displayed)
  const units = useMemo(() => {
    const result: TimeUnit[] = [];
    const count = UNIT_COUNTS[activeView];
    const half = Math.floor(count / 2);

    for (let i = -half; i <= half; i++) {
      const date = addByView(selectedDate, i, activeView);
      const unitDate = getUnitStart(date, activeView);

      if (!unitMatchesStatusFilter(unitDate, activeView)) continue;

      result.push({
        id: getUnitId(unitDate, activeView),
        date: unitDate,
        label: getUnitLabel(unitDate, activeView),
        value: getUnitValue(unitDate, activeView),
        statusColor: getStatusColor(unitDate, activeView),
        isToday: isSameDay(unitDate, new Date()),
      });
    }

    return result;
  }, [selectedDate, activeView, getStatusColor, unitMatchesStatusFilter]);


  // Filter patients for table (Rows based on their own verified_at status)
  const filteredPatients = useMemo(() => {
    if (!allRawDocuments.length) return [];

    const searchLower = debouncedSearch.toLowerCase();
    const results: PatientDocument[] = [];

    for (const doc of allRawDocuments) {
      if (!doc.metadata?.created_at) continue;

      const created = new Date(doc.metadata.created_at);

      // Date range filter
      if (created < startRange || created >= endRange) continue;

      // Status filter (Row level check)
      // if (selectedStatus !== null) {
      //   const docStatus = doc.metadata.verified_at ? "confirmed" : "confirmed";
      //   if (docStatus !== selectedStatus) continue;
      // }

      // Search filter — now uses .value so full field objects (with .score) are preserved
      if (searchLower) {
        const fields = [
          doc.names?.value,
          doc.case?.value,
          doc.sex?.value,
          doc.age?.value,
          doc.contact?.value,
          doc.past_history?.value,
          doc.patient_code?.value,
          doc.occupation?.value,
          doc.residence?.value,
        ];
        const matches = fields.some(f => f && String(f).toLowerCase().includes(searchLower));
        if (!matches) continue;
      }

      results.push(mapDocumentToPatient(doc));
    }

    return results;
  }, [allRawDocuments, startRange, endRange, debouncedSearch, selectedStatus]);

  // Paginated patients for the current view
  const paginatedPatients = useMemo(() => {
    const start = pageIndex * pageSize;
    const end = start + pageSize;
    return filteredPatients.slice(start, end);
  }, [filteredPatients, pageIndex, pageSize]);


  // Image URLs (only compute when panel is visible) - extract from DocumentGroup level
  const filteredImageUrls = useMemo(() => {
    if (!showBottomPanel || !documentsData?.documents) return [];

    // Collect unique doc_codes from current page patients
    const docCodes = new Set<string>();
    paginatedPatients.forEach(p => {
      const docCode = p.metadata?.doc_code;
      if (docCode) {
        docCodes.add(docCode);
      }
    });

    // Get image URLs from the corresponding DocumentGroups
    const urls: string[] = [];
    docCodes.forEach(docCode => {
      const documentGroup = documentsData.documents[docCode];
      if (documentGroup?.image_urls && Array.isArray(documentGroup.image_urls)) {
        urls.push(...documentGroup.image_urls);
      }
    });

    return urls;
  }, [paginatedPatients, showBottomPanel, documentsData]);

  // ---- Stable Callbacks ----
  const handleUnitClick = useCallback((id: string) => {
    const unit = units.find(u => u.id === id);
    if (unit) setSelectedDate(getUnitStart(unit.date, activeView));
  }, [units, activeView]);

  const handleCalendarSelect = useCallback((date: Date | undefined) => {
    if (date) setSelectedDate(startOfDay(date));
  }, []);

  const handleViewChange = useCallback((view: ViewType) => {
    setActiveView(view);
    setSelectedDate(prev => getUnitStart(prev, view));
  }, []);

  const handleRowClick = useCallback((p: PatientDocument) => {
    setSelectedPatient(p);
    setModalOpen(true);
    setActiveTabCon("details");
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setSelectedPatient(null);
  }, []);

  const toggleBottomPanel = useCallback(() => {
    setShowBottomPanel(prev => !prev);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleStatusFilter = useCallback((status: string | null) => {
    localStorage.removeItem("pendingStatusFilter");
    setSelectedStatus(prev => {

      if (status === null) {
        toast.info("Filter cleared");
        return null;
      }
      return prev === status ? null : status;
    });
  }, []);

  const handleFacilitySelect = useCallback((id: string) => {
    localStorage.removeItem("pendingFacilityId");
    localStorage.removeItem("pendingStatusFilter");
    localStorage.removeItem("pendingDate");
    setSelectedFacilityId(id);
    setFacilityDropdownOpen(false);
  }, []);

  const handleExportCSV = useCallback(() => {
    const filename = generateExportFilename(selectedFacilityName, activeView, selectedDate, selectedStatus);
    exportToCSV(filteredPatients, columns, filename);
  }, [selectedFacilityName, activeView, selectedDate, selectedStatus, filteredPatients]);

  const handleExportExcel = useCallback(() => {
    const filename = generateExportFilename(selectedFacilityName, activeView, selectedDate, selectedStatus);
    exportToExcel(filteredPatients, columns, filename);
  }, [selectedFacilityName, activeView, selectedDate, selectedStatus, filteredPatients]);

  const handlePaginationChange = useCallback((pagination: { pageIndex: number; pageSize: number }) => {
    setPageIndex(pagination.pageIndex);
    setPageSize(pagination.pageSize);
  }, []);

  // ---- Table Columns ----
  const columns = useMemo<ColumnDef<PatientDocument>[]>(() => [
    { accessorKey: "date", header: "Date", cell: ({ row }) => row.original.date?.value || "" },
    { accessorKey: "month_number", header: "Month Number", cell: ({ row }) => row.original.month_number?.value || "" },
    { accessorKey: "case", header: "Case #", cell: ({ row }) => row.original.case?.value || "" },
    { accessorKey: "names", header: "Patient Name", cell: ({ row }) => row.original.names?.value || "" },
    { accessorKey: "sex", header: "Sex", cell: ({ row }) => row.original.sex?.value || "" },
    { accessorKey: "age", header: "Age", cell: ({ row }) => row.original.age?.value || "" },
    {
      header: "Is Pregnant",
      cell: ({ row }) => {
        const val = row.original.pregnant?.value;
        return val === "1" ? "Yes" : "No";
      },
    },
    { accessorKey: "status", header: "Marital Status", cell: ({ row }) => row.original.status?.value || "" },
    { accessorKey: "patient_code", header: "Patient Code", cell: ({ row }) => row.original.patient_code?.value || "" },
    { accessorKey: "occupation", header: "Occupation", cell: ({ row }) => row.original.occupation?.value || "" },
    { accessorKey: "residence", header: "Residence", cell: ({ row }) => row.original.residence?.value || "" },
    { accessorKey: "contact", header: "Contact", cell: ({ row }) => row.original.contact?.value || "" },
    { accessorKey: "past_history", header: "Past History", cell: ({ row }) => row.original.past_history?.value || "" },
    { accessorKey: "signs_symptoms", header: "Signs & Symptoms", cell: ({ row }) => row.original.signs_symptoms?.value || "" },
    { accessorKey: "diagnosis", header: "Diagnosis", cell: ({ row }) => row.original.diagnosis?.value || "" },
    { accessorKey: "results", header: "Results", cell: ({ row }) => row.original.results?.value || "" },
    { accessorKey: "treatment", header: "Treatment", cell: ({ row }) => row.original.treatment?.value || "" },
    { accessorKey: "investigations", header: "Investigations", cell: ({ row }) => row.original.investigations?.value || "" },
    { accessorKey: "hospitalisation", header: "Hospitalisation", cell: ({ row }) => row.original.hospitalisation?.value || "" },
    { accessorKey: "receipt_no", header: "Receipt No.", cell: ({ row }) => row.original.receipt_no?.value || "" },
    { accessorKey: "referral", header: "Referral", cell: ({ row }) => row.original.referral?.value || "" },
    { accessorKey: "observations", header: "Observations", cell: ({ row }) => row.original.observations?.value || "" },
    {
      header: "Deceased",
      cell: ({ row }) => ((row.original as any).isDead ? "Yes" : "No"),
    },
  ], []);
  // ---- Render ----
  const topContent = (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border-b bg-white">
        {/* Facility Dropdown */}
        <Popover open={facilityDropdownOpen} onOpenChange={setFacilityDropdownOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="w-[240px] justify-between bg-[#021EF533] py-3 px-4 border border-blue-200 rounded-md flex items-center text-sm"
            >
              <div className="flex items-center space-x-2">
                <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium truncate">{selectedFacilityName}</span>
              </div>
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[240px] p-0">
            <Command>
              <CommandInput placeholder="Search facility..." />
              <CommandList>
                <CommandEmpty>No facility found.</CommandEmpty>
                <CommandGroup>
                  {facilities.map(f => (
                    <FacilityItem
                      key={f._id}
                      facility={f}
                      isSelected={f._id === selectedFacilityId}
                      onSelect={() => handleFacilitySelect(f._id)}
                    />
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Status Filter & Export */}
        <div className="flex items-center mt-4 md:mt-0 p-2 border rounded-md bg-gray-100 h-12">
          <TooltipProvider>
            <StatusFilterButton
              status={null}
              label="All"
              isActive={selectedStatus === null}
              onClick={() => handleStatusFilter(null)}
              tooltip="Show all data"
            />

            <div className="h-8 w-px bg-gray-300 mx-4" />

            <StatusFilterButton
              status="confirmed"
              label="Confirmed"
              color="bg-green-500"
              isActive={selectedStatus === "confirmed"}
              onClick={() => handleStatusFilter("confirmed")}
              tooltip="Verified records"
            />

            <div className="h-8 w-px bg-gray-300 mx-4" />

            <StatusFilterButton
              status="pending"
              label="Pending"
              color="bg-yellow-400"
              isActive={selectedStatus === "pending"}
              onClick={() => handleStatusFilter("pending")}
              tooltip="Records awaiting verification"
            />
          </TooltipProvider>

          <div className="ml-6 flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="border-green-600 text-green-600"
            >
              CSV
            </Button>
            <Button
              size="sm"
              onClick={handleExportExcel}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Time Navigation */}
      <div className="px-4 py-2 border-b">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[240px] justify-start text-left font-normal h-10">
                  <span className="mr-2 uppercase">
                    {activeView === "YEAR" && format(selectedDate, "yyyy")}
                    {activeView === "MONTH" && format(selectedDate, "MMMM yyyy")}
                    {activeView === "WEEK" && `Week ${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), "w, yyyy")}`}
                    {activeView === "DAY" && format(selectedDate, "PPP")}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={selectedDate} onSelect={handleCalendarSelect} fromYear={2015} toYear={2030} />
              </PopoverContent>
            </Popover>
            <div className="flex p-1 space-x-1 bg-gray-100 rounded-md">
              {VIEW_OPTIONS.map(v => (
                <Button key={v.label} variant={v.label === activeView ? "default" : "ghost"} size="sm" onClick={() => handleViewChange(v.label)}
                  className={cn("rounded-md px-4", v.label === activeView && "bg-[#028700] hover:bg-[#028700c9]")}>
                  {v.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex space-x-3 bg-gray-100 rounded-md px-3 py-2 overflow-x-auto date-scroll">
            {units.length === 0 ? <span className="text-sm text-gray-500">No data</span> : units.map(u => (
              <button key={u.id} onClick={() => handleUnitClick(u.id)} className="time-unit-button p-1 rounded-md">
                <TimeUnitItem label={u.label} value={u.value} statusColor={u.statusColor} isSelected={u.id === selectedUnitId} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="relative">
            <Input type="search" placeholder="Search..." className="w-64" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <MagnifyingGlassIcon className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={toggleBottomPanel} className="bg-[#021EF533] text-blue-700 hover:bg-[#021EF5] hover:text-white">
              {showBottomPanel ? "Hide Images" : "Show Images"}
            </Button>
            <Button className="bg-[#028700] text-white hover:bg-[#028700c5]">New Record</Button>
          </div>
        </div>

        <DataTable
          data={filteredPatients}
          columns={columns}
          isLoading={isLoading}
          onRowClick={handleRowClick}
          pagination={{ pageIndex, pageSize }}
          onPaginationChange={handlePaginationChange}
        />
      </div >
    </div >
  );

  const bottomContent = (
    <div className="bg-gray-50 p-6 h-full overflow-auto">
      {filteredImageUrls.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredImageUrls.map((url, i) => (
            <ImageViewer key={i} src={url} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 mt-10">
          {isLoading ? "Loading..." : "No images found for records on this page."}
        </p>
      )}
    </div>
  );

  return (
    <div className="h-[105vh] flex flex-col overflow-hidden font-sans">
      {showBottomPanel ? (
        <HorizontalSplitPane top={topContent} bottom={bottomContent} initialPercent={65} storageKey="data-entries-split-height" />
      ) : (
        <div className="flex-1 overflow-auto">{topContent}</div>
      )}

      <PatientEditSheet
        modalOpen={modalOpen}
        selectedPatient={selectedPatient}
        closeModal={closeModal}
        data={filteredPatients}
      />
    </div>
  );
}
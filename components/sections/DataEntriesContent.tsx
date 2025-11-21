"use client";

import * as React from "react";
import { useState, useMemo, useEffect, useCallback } from "react";
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
  parseISO,
  isValid,
} from "date-fns";

// --- API IMPORTS ---
// Ensure these point to where you saved the previous file analysis
// import { useGetFacilities, useGetDocumentsByFacility } from "@/lib/api/hooks";
// import { PatientDocument } from "@/lib/api/types"; 

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
import PatientDetailsModal from "@/components/PatientDetailsModal";
import ImageViewer from "../ImageViewer";
import { exportToCSV, exportToExcel } from "@/utils/export";
import { CheckIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { ChevronsUpDown } from "lucide-react";
import { HorizontalSplitPane } from "../HorizontantalSplitPane";
import { useGetFacilities } from "../facility/hooks/useFacility";
import { PatientDocument, useGetDocumentsByFacility } from "../team/hooks/docs/useGetDoc";
import { UserData } from "@/payload";
import PatientEditSheet from "@/components/PatientDetailsModal";

// =========================================================================
// CONFIG & UTILS
// =========================================================================
const getStartOfToday = () => startOfDay(new Date());
const View = { YEAR: "Year", MONTH: "Month", WEEK: "Week", DAY: "Day" } as const;
type ViewType = keyof typeof View;

const viewOptions = [
  { label: "YEAR", tooltip: "View data grouped by year" },
  { label: "MONTH", tooltip: "View data grouped by month" },
  { label: "WEEK", tooltip: "View data grouped by week" },
  { label: "DAY", tooltip: "View data grouped by day" },
] as const;

const STATUS_COLORS = {
  GREEN: "bg-green-500",
  YELLOW: "bg-yellow-400",
  RED: "bg-red-500",
  GRAY: "bg-gray-300",
} as const;
type StatusColor = typeof STATUS_COLORS[keyof typeof STATUS_COLORS];

const dayAbbreviation = (date: Date) => ["S", "M", "T", "W", "T", "F", "S"][getDay(date)];

interface TimeUnit {
  id: string;
  date: Date;
  label: string;
  value: string;
  statusColor: StatusColor;
  isToday: boolean;
}

// =========================================================================
// ADAPTED STATUS LOGIC (For API Data)
// =========================================================================
/**
 * Determines the color of a time block based on the rows within it.
 */
const generateStatus = (unitDate: Date, documents: PatientDocument[], view: ViewType): StatusColor => {
  let unitStart: Date, unitEnd: Date;
  switch (view) {
    case "DAY": unitStart = startOfDay(unitDate); unitEnd = addDays(unitStart, 1); break;
    case "WEEK": unitStart = startOfWeek(unitDate, { weekStartsOn: 1 }); unitEnd = addWeeks(unitStart, 1); break;
    case "MONTH": unitStart = startOfMonth(unitDate); unitEnd = addMonths(unitStart, 1); break;
    case "YEAR": unitStart = startOfYear(unitDate); unitEnd = addYears(unitStart, 1); break;
  }

  // Filter docs that fall into this time unit
  const docsInUnit = documents.filter(d => {
    const created = new Date(d.metadata.created_at);
    return created >= unitStart && created < unitEnd;
  });

  if (docsInUnit.length === 0) {
    // If past date and empty -> Red, else Gray
    return unitDate < startOfDay(new Date()) ? STATUS_COLORS.RED : STATUS_COLORS.GRAY;
  }

  // Logic: If items are verified -> Green. If mixed/unverified -> Yellow/Gray
  // Adjust this logic based on your specific "Facility Status" or "Row Status" needs
  const hasVerified = docsInUnit.some(d => !!d.metadata.verified_at);

  if (hasVerified) return STATUS_COLORS.GREEN;

  // Fallback for unverified but existing data
  return STATUS_COLORS.YELLOW;
};

const generateExportFilename = (districtName: string, view: ViewType, date: Date, status: string | null): string => {
  const cleanDistrict = districtName.replace(/\s+/g, "_");
  const statusPart = status ? `_${status}` : "";
  let period = "";
  if (view === "DAY") period = format(date, "yyyy-MM-dd");
  else if (view === "WEEK") period = `Week-${format(startOfWeek(date, { weekStartsOn: 1 }), "w-yyyy")}`;
  else if (view === "MONTH") period = format(date, "MMM-yyyy");
  else if (view === "YEAR") period = format(date, "yyyy");
  return `Patients_${cleanDistrict}_${period}${statusPart}`;
};

// =========================================================================
// TIME UNIT ITEM
// =========================================================================
const TimeUnitItem = ({ label, value, statusColor, isSelected }: { label: string; value: string; statusColor: StatusColor; isSelected: boolean }) => (
  <div className="flex flex-col items-center relative">
    <div className="text-xs font-semibold text-gray-500 mb-1">{label}</div>
    <div
      className={`w-8 h-8 flex items-center py-5 px-6 justify-center text-sm font-bold text-white rounded-md ${statusColor} shadow-sm transition-all ${isSelected ? "scale-110 ring-2 ring-blue-500" : "scale-100 hover:scale-105"
        }`}
    >
      {value}
    </div>
    {isSelected && <div className="w-7 h-1 bg-blue-600 rounded-full mt-1 absolute -bottom-2 animate-pulse"></div>}
  </div>
);

// =========================================================================
// HELPER: MAP API DOCUMENT TO TABLE ROW
// =========================================================================
const mapDocumentToPatient = (doc: PatientDocument): PatientDocument => {
  return {
    id: doc._id,
    case: doc.case?.extracted_value || "",
    patientName: doc.names?.extracted_value || "",
    sex: doc.sex?.extracted_value || "",
    age: doc.age?.extracted_value || "",
    isPregnant: doc.pregnant?.extracted_value === "1" || doc.pregnant?.extracted_value === "Yes",
    profession: doc.occupation?.extracted_value || "",
    residence: doc.residence?.extracted_value || "",
    results: doc.results?.extracted_value || "",
    contact: doc.contact?.extracted_value || "",
    patientCode: doc.patient_code?.extracted_value || "",
    pastHistory: doc.past_history?.extracted_value || "",
    symptoms: doc.signs_symptoms?.extracted_value || "",
    diagnosis: doc.diagnosis?.extracted_value || "",
    investigation: doc.investigations?.extracted_value || "",
    treatment: doc.treatment?.extracted_value || "",
    // Map other fields as needed, defaulting to empty string if undefined
    maritalStatus: "",
    careLevel: "",
    receiptNumber: doc.receipt_no?.extracted_value || "",
    referral: doc.referral?.extracted_value || "",
    observations: doc.observations?.extracted_value || "",
    isRareCase: false,
    dataIssues: [],
    role: doc.metadata.created_by || "User",
    // Important: We add metadata for internal filtering
    createdAt: doc.metadata.created_at,
    status: doc.metadata.verified_at ? "confirmed" : "pending",
    imageUrl: doc.metadata.reference || "",
    date: doc.date?.extracted_value || "",
    monthNumber: doc.month_number?.extracted_value || "",
    statusExtracted: doc.status?.extracted_value || "",

    // results extra fields
    diseaseId: doc.results?.disease_id || "",
    wasProcessed: doc.results?.was_processed || false,
    resultVerifiedAt: doc.results?.verified_at || "",

    // hospitalisation
    hospitalisation: doc.hospitalisation?.extracted_value || "",

    // metadata remaining fields
    isDead: doc.metadata.is_dead,
    isLatest: doc.metadata.is_latest,
    version: doc.metadata.version,
    docCode: doc.metadata.doc_code,
    rowCode: doc.metadata.row_code,
    modifiedAt: doc.metadata.modified_at,
    verifiedAt: doc.metadata.verified_at || "",
    verifiedBy: doc.metadata.verified_by || "",
    facilityId: doc.metadata.facility_id || "",
    modifiedBy: doc.metadata.modified_by || "",
  } as unknown as PatientDocument; // Cast to Patient to satisfy the Table interface
};

// =========================================================================
// MAIN COMPONENT
// =========================================================================
interface DataEntriesContentProps {
  setActiveTab?: React.Dispatch<React.SetStateAction<string>>;
}

export default function DataEntriesContent({ setActiveTab }: DataEntriesContentProps) {
  // 1. State for Filtering & UI
  const today = getStartOfToday();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [activeView, setActiveView] = useState<ViewType>("YEAR");
  const [searchTerm, setSearchTerm] = useState("");
  const [showBottomPanel, setShowBottomPanel] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientDocument | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTabCon, setActiveTabCon] = useState<"details" | "history">("details");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [open, setOpen] = useState(false); // For Dropdown
  const userDataString = typeof window !== 'undefined' ? localStorage.getItem('userData') : null;
  const personel: UserData = userDataString ? JSON.parse(userDataString) : null;
  const currentUserFacilityId = personel?.facility.id;

  // 2. API: Fetch Facilities
  const { data: facilitiesData } = useGetFacilities(currentUserFacilityId);

  const facilities = useMemo(() => facilitiesData?.results || [], [facilitiesData]);

  // State for Selected Facility (ID and Name)
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);

  // Set default facility on load
  useEffect(() => {
    if (facilities.length > 0 && !selectedFacilityId) {
      setSelectedFacilityId(facilities[0]._id);
    }
  }, [facilities, selectedFacilityId]);

  // Helper to get current facility name for UI
  const selectedFacilityName = useMemo(() => {
    return facilities.find(f => f._id === selectedFacilityId)?.name || "Select District";
  }, [facilities, selectedFacilityId]);

  // 3. API: Fetch Documents for Selected Facility
  const { data: documentsData, isLoading, isError } = useGetDocumentsByFacility(
    selectedFacilityId,
    { limit: 1000 } // Fetching large batch for timeline view. Pagination usually needed for prod.
  );

  // Handle API Errors
  useEffect(() => { if (isError) toast.error("Error fetching documents"); }, [isError]);

  // 4. Flatten Documents Logic
  // The API returns { documents: { "CodeA": [rows], "CodeB": [rows] } }
  // We need a flat array of ALL rows to populate the timeline and table.
  const allRawDocuments = useMemo(() => {
    if (!documentsData?.documents) return [];
    return Object.values(documentsData.documents).flat();
  }, [documentsData]);

  // 5. Status Recovery from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("facilities:selectedStatus");
    if (saved && ["confirmed", "progress", "pending", "N/A"].includes(saved)) {
      setSelectedStatus(saved);
    }
  }, []);

  // 6. Timeline & Date Logic
  const getUnitStart = (date: Date, view: ViewType): Date => {
    switch (view) {
      case "DAY": return startOfDay(date);
      case "WEEK": return startOfWeek(date, { weekStartsOn: 1 });
      case "MONTH": return startOfMonth(date);
      case "YEAR": return startOfYear(date);
      default: return date;
    }
  };

  const getUnitEnd = (start: Date, view: ViewType): Date => {
    switch (view) {
      case "DAY": return addDays(start, 1);
      case "WEEK": return addWeeks(start, 1);
      case "MONTH": return addMonths(start, 1);
      case "YEAR": return addYears(start, 1);
      default: return addDays(start, 1);
    }
  };

  const selectedUnitId = useMemo(() => {
    switch (activeView) {
      case "DAY": return format(selectedDate, "yyyy-MM-dd");
      case "WEEK": return format(startOfWeek(selectedDate, { weekStartsOn: 1 }), "yyyy-ww");
      case "MONTH": return format(startOfMonth(selectedDate), "yyyy-MM");
      case "YEAR": return format(startOfYear(selectedDate), "yyyy");
    }
  }, [selectedDate, activeView]);

  // Calculate Timeline Units
  const allPossibleUnits = useMemo(() => {
    const units: TimeUnit[] = [];
    const center = selectedDate;
    const push = (date: Date, label: string, value: string) => {
      const id = activeView === "DAY" ? format(date, "yyyy-MM-dd")
        : activeView === "WEEK" ? format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-ww")
          : activeView === "MONTH" ? format(startOfMonth(date), "yyyy-MM")
            : format(startOfYear(date), "yyyy");

      // Use the allRawDocuments for status generation
      units.push({
        id,
        date,
        label,
        value,
        statusColor: generateStatus(date, allRawDocuments, activeView),
        isToday: isSameDay(date, new Date())
      });
    };

    switch (activeView) {
      case "DAY": { const s = addDays(center, -180); for (let i = 0; i < 360; i++) push(addDays(s, i), dayAbbreviation(addDays(s, i)), format(addDays(s, i), "d")); break; }
      case "WEEK": { const s = addWeeks(center, -52); for (let i = 0; i < 104; i++) { const ws = startOfWeek(addWeeks(s, i), { weekStartsOn: 1 }); push(ws, `W${format(ws, "w")}`, format(ws, "w")); } break; }
      case "MONTH": { const s = addMonths(center, -36); for (let i = 0; i < 72; i++) push(addMonths(s, i), format(addMonths(s, i), "MMM"), format(addMonths(s, i), "M")); break; }
      case "YEAR": { const s = addYears(center, -10); for (let i = 0; i < 21; i++) push(addYears(s, i), "", format(addYears(s, i), "yyyy")); break; }
    }
    return units;
  }, [selectedDate, activeView, allRawDocuments]);

  // Filter Units based on Selected Status
  const units = useMemo(() => {
    let filtered = allPossibleUnits;

    if (selectedStatus !== null) {
      filtered = filtered.filter(unit => {
        const start = getUnitStart(unit.date, activeView);
        const end = getUnitEnd(start, activeView);

        // Check if any doc in this period matches the status
        return allRawDocuments.some(doc => {
          const created = new Date(doc.metadata.created_at);
          const docStatus = doc.metadata.verified_at ? "confirmed" : "pending"; // Derived status
          return docStatus === selectedStatus && created >= start && created < end;
        });
      });
    }

    if (filtered.length === 0) return [];
    const idx = filtered.findIndex(u => u.id === selectedUnitId);
    const start = idx === -1 ? 0 : Math.max(0, idx - 2);
    return filtered.slice(start, start + 6);
  }, [allPossibleUnits, selectedStatus, selectedUnitId, activeView, allRawDocuments]);

  // Sync selection if current unit disappears
  useEffect(() => {
    if (units.length > 0 && !units.some(u => u.id === selectedUnitId)) {
      setSelectedDate(getUnitStart(units[0].date, activeView));
    }
  }, [units, selectedUnitId, activeView]);

  // 7. Data Filtering Logic (The Table Data)
  const [startRange, endRange] = useMemo(() => {
    const start = getUnitStart(selectedDate, activeView);
    return [start, getUnitEnd(start, activeView)];
  }, [selectedDate, activeView]);

  const filteredPatients = useMemo(() => {
    if (!allRawDocuments.length || !startRange || !endRange) return [];

    return allRawDocuments.filter(doc => {
      const created = new Date(doc.metadata.created_at);
      const inRange = created >= startRange && created < endRange;
      // Note: Facility check is implicit because we fetched by ID

      const docStatus = doc.metadata.verified_at ? "confirmed" : "pending";
      const inStatus = selectedStatus === null || docStatus === selectedStatus;

      return inRange && inStatus;
    })
      // Transform API Doc -> Table Patient
      .map(mapDocumentToPatient)
      // Search Filter
      .filter(p => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return [p.names, p.case, p.sex, p.age, p.contact, p.past_history]
          .some(f => String(f || "").toLowerCase().includes(term));
      });

  }, [allRawDocuments, startRange, endRange, searchTerm, selectedStatus]);


  // 8. Image Logic
  // Extract images from the *filtered* list
  const filteredImageUrls = useMemo(() => {
    return filteredPatients
      .map(p => (p as any).imageUrl) // Accessed from the mapped object
      .filter(url => url && url.length > 0);
  }, [filteredPatients]);

  // 9. Handlers
  const handleUnitClick = useCallback((id: string) => {
    const unit = units.find(u => u.id === id);
    if (unit) setSelectedDate(getUnitStart(unit.date, activeView));
  }, [units, activeView]);

  const handleCalendarSelect = (date: Date | undefined) => date && setSelectedDate(startOfDay(date));
  const handleViewChange = (view: ViewType) => { setActiveView(view); setSelectedDate(getUnitStart(selectedDate, view)); };
  const handleRowClick = (p: PatientDocument) => { setSelectedPatient(p); setModalOpen(true); setActiveTabCon("details"); };
  const closeModal = () => { setModalOpen(false); setSelectedPatient(null); };
  const toggleBottomPanel = () => setShowBottomPanel(p => !p);


  const columns = React.useMemo<ColumnDef<PatientDocument>[]>(() => [

    { accessorKey: "date", header: "Date" },
    { accessorKey: "monthNumber", header: "Month Number" },
    { accessorKey: "case", header: "Case #" },
    { accessorKey: "patientName", header: "Patient Name" },
    { accessorKey: "sex", header: "Sex" },
    { accessorKey: "age", header: "Age" },

    { accessorKey: "pregnant", header: "Is Pregnant", },
    { accessorKey: "status", header: "Status" },
    { accessorKey: "patientCode", header: "Patient Code" },
    { accessorKey: "profession", header: "Occupation" },
    { accessorKey: "residence", header: "Residence" },
    { accessorKey: "contact", header: "Contact" },
    { accessorKey: "pastHistory", header: "Past History" },
    { accessorKey: "symptoms", header: "Signs & Symptoms" },
    { accessorKey: "diagnosis", header: "Diagnosis" },
    { accessorKey: "results", header: "Results" },

    { accessorKey: "treatment", header: "Treatment" },
    { accessorKey: "investigation", header: "Investigation" },
    { accessorKey: "hospitalisation", header: "Hospitalisation" },
    { accessorKey: "receiptNumber", header: "Receipt No." },
    { accessorKey: "referral", header: "Referral" },
    { accessorKey: "observations", header: "Observations" },

    // Metadata fields
    {
      accessorKey: "isDead",
      header: "Is Dead",
      cell: ({ row }) => (row.original.isDead == true ? 'Yes' : 'No'),
    },
  ], []);

  const exportFilename = generateExportFilename(selectedFacilityName, activeView, selectedDate, selectedStatus);

  // 10. UI Rendering
  const topContent = (
    <div className="flex flex-col h-full bg-white">
      <style jsx>{`
        .time-unit-button { cursor: pointer; transition: all 0.3s; }
        .time-unit-button:hover { transform: translateY(-2px); }
        .date-scroll { scrollbar-width: thin; }
        .date-scroll::-webkit-scrollbar { height: 6px; }
        .date-scroll::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 3px; }
        .date-scroll::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 3px; }
      `}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border-b bg-white">

        {/* FACILITY DROPDOWN (REAL DATA) */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button className="w-[240px] justify-between bg-[#021EF533] py-3 px-4 border border-blue-200 rounded-md flex items-center text-sm">
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
                    <CommandItem
                      key={f._id}
                      value={f.name}
                      onSelect={() => {
                        setSelectedFacilityId(f._id);
                        setOpen(false);
                      }}
                    >
                      <CheckIcon className={cn("mr-2 h-4 w-4", f._id === selectedFacilityId ? "opacity-100" : "opacity-0")} />
                      {f.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* LEGEND / STATUS FILTER */}
      <div className="flex items-center mt-4 md:mt-0 p-2 border rounded-md bg-gray-100 h-12 transition-all duration-300">
  <TooltipProvider>

    {/* All */}
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => { setSelectedStatus(null); toast.info("Filter cleared"); }}
          className={`flex items-center text-sm cursor-pointer transition-all px-5 py-2 group hover:scale-105 ${
            selectedStatus === null ? "bg-white rounded-md shadow-sm" : ""
          }`}
        >
          <span>All</span>
        </button>
      </TooltipTrigger>
      <TooltipContent>Show all data</TooltipContent>
    </Tooltip>

    <div className="h-8 w-px bg-gray-300 mx-4" />

    {/* Confirmed */}
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => setSelectedStatus((s) => (s === "confirmed" ? null : "confirmed"))}
          className={`flex items-center text-sm cursor-pointer px-4 py-2 group hover:scale-105 ${
            selectedStatus === "confirmed" ? "bg-white rounded-md shadow-sm" : ""
          }`}
        >
          <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />

          <span
            className={`overflow-hidden transition-all whitespace-nowrap duration-300 ease-in-out 
              ${selectedStatus === "confirmed"
                ? "opacity-100 max-w-[100px]"
                : "group-hover:opacity-100 group-hover:max-w-[100px] opacity-0 max-w-0"
              }`}
          >
            Confirmed
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent>Verified records</TooltipContent>
    </Tooltip>

    <div className="h-8 w-px bg-gray-300 mx-4" />

    {/* Pending */}
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => setSelectedStatus((s) => (s === "pending" ? null : "pending"))}
          className={`flex items-center text-sm cursor-pointer px-4 py-2 group hover:scale-105 ${
            selectedStatus === "pending" ? "bg-white rounded-md shadow-sm" : ""
          }`}
        >
          <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2" />

          <span
            className={`overflow-hidden transition-all whitespace-nowrap duration-300 ease-in-out 
              ${selectedStatus === "pending"
                ? "opacity-100 max-w-[100px]"
                : "group-hover:opacity-100 group-hover:max-w-[100px] opacity-0 max-w-0"
              }`}
          >
            Pending
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent>Records awaiting verification</TooltipContent>
    </Tooltip>

  </TooltipProvider>

  {/* Export Buttons */}
  <div className="ml-6 flex items-center space-x-2">
    <Button
      variant="outline"
      size="sm"
      onClick={() => exportToCSV(filteredPatients, columns, exportFilename)}
      className="border-green-600 text-green-600"
    >
      CSV
    </Button>

    <Button
      size="sm"
      onClick={() => exportToExcel(filteredPatients, columns, exportFilename)}
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
              {viewOptions.map(v => (
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
        <DataTable data={filteredPatients} columns={columns} isLoading={isLoading} onRowClick={handleRowClick} />
      </div>
    </div>
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
          {isLoading ? "Loading..." : "No images found for selected records."}
        </p>
      )}
    </div>
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden font-sans">
      {showBottomPanel ? (
        <HorizontalSplitPane top={topContent} bottom={bottomContent} initialPercent={65} storageKey="data-entries-split-height" />
      ) : (
        <div className="flex-1 overflow-auto">{topContent}</div>
      )}

      <PatientEditSheet
        modalOpen={modalOpen}
        selectedPatient={selectedPatient}
        activeTab={activeTabCon}
        setActiveTab={setActiveTabCon}
        closeModal={closeModal}
        data={filteredPatients}
      />
    </div>
  );
}
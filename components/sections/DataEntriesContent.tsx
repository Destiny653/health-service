// pages/DataEntriesContent.tsx or components/DataEntriesContent.tsx
import * as React from "react";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
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
} from "date-fns";
import { Patient } from "@/hooks/usePatients";
import { PatientDataFile } from "@/data";
import { data } from "@/data";
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
// STATUS LOGIC
// =========================================================================
const generateStatus = (unitDate: Date, files: PatientDataFile[], view: ViewType): StatusColor => {
  let unitStart: Date, unitEnd: Date;
  switch (view) {
    case "DAY": unitStart = startOfDay(unitDate); unitEnd = addDays(unitStart, 1); break;
    case "WEEK": unitStart = startOfWeek(unitDate, { weekStartsOn: 1 }); unitEnd = addWeeks(unitStart, 1); break;
    case "MONTH": unitStart = startOfMonth(unitDate); unitEnd = addMonths(unitStart, 1); break;
    case "YEAR": unitStart = startOfYear(unitDate); unitEnd = addYears(unitStart, 1); break;
  }
  const filesInUnit = files.filter(f => {
    const created = new Date(f.createdAt);
    return created >= unitStart && created < unitEnd;
  });
  if (filesInUnit.length === 0) return unitDate < startOfDay(new Date()) ? STATUS_COLORS.RED : STATUS_COLORS.GRAY;
  if (filesInUnit.some(f => f.submissionStatus === "confirmed")) return STATUS_COLORS.GREEN;
  if (filesInUnit.some(f => f.submissionStatus === "progress")) return STATUS_COLORS.YELLOW;
  if (filesInUnit.some(f => f.submissionStatus === "pending")) return STATUS_COLORS.GRAY;
  return unitDate < startOfDay(new Date()) ? STATUS_COLORS.RED : STATUS_COLORS.GRAY;
};

const fetchFiles = async (): Promise<PatientDataFile[]> => {
  return new Promise(resolve => setTimeout(() => resolve(data), 500));
};

const generateExportFilename = (district: string, view: ViewType, date: Date, status: string | null): string => {
  const cleanDistrict = district.replace(/\s+/g, "_");
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
// MAIN COMPONENT
// =========================================================================
interface DataEntriesContentProps {
  setActiveTab?: React.Dispatch<React.SetStateAction<string>>;
}


export default function DataEntriesContent({ setActiveTab }: DataEntriesContentProps) {
  const { data: files = [], isLoading, error } = useQuery<PatientDataFile[]>({
    queryKey: ["files"],
    queryFn: fetchFiles,
  });

  useEffect(() => { if (error) toast.error("Error fetching files"); }, [error]);

  const today = getStartOfToday();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [activeView, setActiveView] = useState<ViewType>("YEAR");
  const [searchTerm, setSearchTerm] = useState("");
  const [showBottomPanel, setShowBottomPanel] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTabCon, setActiveTabCon] = useState<"details" | "history">("details");
  const [selectedHealthDistrict, setSelectedHealthDistrict] = useState("Buea District");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("facilities:selectedStatus");
    if (saved && ["confirmed", "progress", "pending", "N/A"].includes(saved)) {
      setSelectedStatus(saved);
    }
  }, []);

  const allPatients = useMemo(() => files.flatMap(f => f.patients), [files]);
  const allImages = useMemo(() => files.flatMap(f => f.fileUrl), [files]);
  const healthDistricts = useMemo(() => {
    const set = new Set<string>();
    files.forEach(f => f.facility?.name && set.add(f.facility.name));
    return Array.from(set).sort();
  }, [files]);

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

  const allPossibleUnits = useMemo(() => {
    const units: TimeUnit[] = [];
    const center = selectedDate;
    const push = (date: Date, label: string, value: string) => {
      const id = activeView === "DAY" ? format(date, "yyyy-MM-dd")
        : activeView === "WEEK" ? format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-ww")
          : activeView === "MONTH" ? format(startOfMonth(date), "yyyy-MM")
            : format(startOfYear(date), "yyyy");
      units.push({ id, date, label, value, statusColor: generateStatus(date, files, activeView), isToday: isSameDay(date, new Date()) });
    };

    switch (activeView) {
      case "DAY": { const s = addDays(center, -180); for (let i = 0; i < 360; i++) push(addDays(s, i), dayAbbreviation(addDays(s, i)), format(addDays(s, i), "d")); break; }
      case "WEEK": { const s = addWeeks(center, -52); for (let i = 0; i < 104; i++) { const ws = startOfWeek(addWeeks(s, i), { weekStartsOn: 1 }); push(ws, `W${format(ws, "w")}`, format(ws, "w")); } break; }
      case "MONTH": { const s = addMonths(center, -36); for (let i = 0; i < 72; i++) push(addMonths(s, i), format(addMonths(s, i), "MMM"), format(addMonths(s, i), "M")); break; }
      case "YEAR": { const s = addYears(center, -10); for (let i = 0; i < 21; i++) push(addYears(s, i), "", format(addYears(s, i), "yyyy")); break; }
    }
    return units;
  }, [selectedDate, activeView, files]);

  const units = useMemo(() => {
    let filtered = allPossibleUnits;
    if (selectedStatus !== null) {
      filtered = filtered.filter(unit => {
        const start = getUnitStart(unit.date, activeView);
        const end = getUnitEnd(start, activeView);
        return files.some(f => {
          const created = new Date(f.createdAt);
          return f.submissionStatus === selectedStatus && created >= start && created < end;
        });
      });
    }
    if (filtered.length === 0) return [];
    const idx = filtered.findIndex(u => u.id === selectedUnitId);
    const start = idx === -1 ? 0 : Math.max(0, idx - 2);
    return filtered.slice(start, start + 6);
  }, [allPossibleUnits, selectedStatus, selectedUnitId, activeView, files]);

  useEffect(() => {
    if (units.length > 0 && !units.some(u => u.id === selectedUnitId)) {
      setSelectedDate(getUnitStart(units[0].date, activeView));
    }
  }, [units, selectedUnitId, activeView]);

  const [startRange, endRange] = useMemo(() => {
    const start = getUnitStart(selectedDate, activeView);
    return [start, getUnitEnd(start, activeView)];
  }, [selectedDate, activeView]);

  const filteredData = useMemo(() => {
    if (!files.length || !startRange || !endRange) return [];
    const filteredFiles = files.filter(f => {
      const created = new Date(f.createdAt);
      const inRange = created >= startRange && created < endRange;
      const inDistrict = !selectedHealthDistrict || f.facility?.name === selectedHealthDistrict;
      const inStatus = selectedStatus === null || f.submissionStatus === selectedStatus;
      return inRange && inDistrict && inStatus;
    });
    let patients = filteredFiles.flatMap(f => f.patients);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      patients = patients.filter(p =>
        [p.patientName, p.case, p.sex, p.age, p.contact, p.history].some(f => String(f || "").toLowerCase().includes(term))
      );
    }
    return patients;
  }, [files, startRange, endRange, searchTerm, selectedHealthDistrict, selectedStatus]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Add a new memo that contains only the image URLs of the *filtered* files
  // ─────────────────────────────────────────────────────────────────────────────
  const filteredImageUrls = useMemo(() => {
    // `filteredFiles` is the same array we already compute for the table
    const filteredFiles = files.filter(f => {
      const created = new Date(f.createdAt);
      const inRange = created >= startRange && created < endRange;
      const inDistrict = !selectedHealthDistrict || f.facility?.name === selectedHealthDistrict;
      const inStatus = selectedStatus === null || f.submissionStatus === selectedStatus;
      return inRange && inDistrict && inStatus;
    });

    // Flatten only the URLs from those files
    return filteredFiles.flatMap(f => f.fileUrl);
  }, [files, startRange, endRange, selectedHealthDistrict, selectedStatus]);

  const handleUnitClick = useCallback((id: string) => {
    const unit = units.find(u => u.id === id);
    if (unit) setSelectedDate(getUnitStart(unit.date, activeView));
  }, [units, activeView]);

  const handleCalendarSelect = (date: Date | undefined) => date && setSelectedDate(startOfDay(date));
  const handleViewChange = (view: ViewType) => { setActiveView(view); setSelectedDate(getUnitStart(selectedDate, view)); };
  const handleRowClick = (p: Patient) => { setSelectedPatient(p); setModalOpen(true); setActiveTabCon("details"); };
  const closeModal = () => { setModalOpen(false); setSelectedPatient(null); };
  const toggleBottomPanel = () => setShowBottomPanel(p => !p);

  const columns = React.useMemo<ColumnDef<Patient>[]>(() => [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "case", header: "Case #" },
    { accessorKey: "patientName", header: "Patient Name" },
    { accessorKey: "sex", header: "Sex" },
    { accessorKey: "age", header: "Age" },
    { accessorKey: "maritalStatus", header: "Marital Status" },
    { accessorKey: "isPregnant", header: "Is Pregnant" },
    { accessorKey: "profession", header: "Profession" },
    { accessorKey: "residence", header: "Residence" },
    { accessorKey: "contact", header: "Contact" },
    { accessorKey: "patientCode", header: "Patient Code" },
    { accessorKey: "history", header: "Medical History" },
    { accessorKey: "symptoms", header: "Symptoms" },
    { accessorKey: "diagnosisPrescsribing", header: "Diagnosis / Prescribing" },
    { accessorKey: "testsRequested", header: "Tests Requested" },
    { accessorKey: "confirmedResults", header: "Confirmed Results" },
    { accessorKey: "confirmatoryDiagnosis", header: "Confirmatory Diagnosis" },
    { accessorKey: "treatment", header: "Treatment" },
    { accessorKey: "careLevel", header: "Care Level" },
    { accessorKey: "receiptNumber", header: "Receipt #" },
    { accessorKey: "referenceHospital", header: "Reference Hospital" },
    { accessorKey: "observations", header: "Observations" },
    { accessorKey: "isRareCase", header: "Rare Case" },
    { accessorKey: "dataIssues", header: "Data Issues" },
    { accessorKey: "role", header: "Role" },
  ], []);

  const exportFilename = generateExportFilename(selectedHealthDistrict, activeView, selectedDate, selectedStatus);

  // Top Panel Content
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
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button className="w-[240px] justify-between bg-[#021EF533] py-3 px-4 border border-blue-200 rounded-md flex items-center text-sm">
              <div className="flex items-center space-x-2">
                <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{selectedHealthDistrict}</span>
              </div>
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[240px] p-0">
            <Command>
              <CommandInput placeholder="Search district..." />
              <CommandList>
                <CommandEmpty>No district found.</CommandEmpty>
                <CommandGroup>
                  {healthDistricts.map(d => (
                    <CommandItem key={d} onSelect={() => { setSelectedHealthDistrict(d); setOpen(false); }}>
                      <CheckIcon className={cn("mr-2 h-4 w-4", d === selectedHealthDistrict ? "opacity-100" : "opacity-0")} />
                      {d}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* LEGEND */}
        <div className="flex items-center mt-4 md:mt-0 p-2 border rounded-md bg-gray-100 h-12 transition-all duration-300">
          <TooltipProvider>
            {/* All */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    setSelectedStatus(null);
                    localStorage.removeItem("facilities:selectedStatus");
                    toast.info("Filter cleared");
                  }}
                  className={`flex items-center text-sm cursor-pointer transition-all duration-300 hover:scale-105 px-5 py-2 relative group ${selectedStatus === null ? "bg-white rounded-md p-1 shadow-sm" : ""
                    }`}
                >
                  All
                </button>
              </TooltipTrigger>
              <TooltipContent className="shadow-lg text-xs">Show all data</TooltipContent>
            </Tooltip>

            <div className="h-8 w-px bg-gray-300 mx-4" />

            {/* Confirmed */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setSelectedStatus((s) => (s === "confirmed" ? null : "confirmed"))}
                  className={`flex items-center text-sm cursor-pointer transition-all duration-300 hover:scale-105 px-4 py-2 group relative ${selectedStatus === "confirmed" ? "bg-white rounded-md p-1 shadow-sm" : ""
                    }`}
                >
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2 transition-all duration-300 group-hover:scale-110" />
                  <span
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${selectedStatus === "confirmed"
                      ? "opacity-100 max-w-[100px]"
                      : "group-hover:opacity-100 group-hover:max-w-[100px] opacity-0 max-w-0"
                      }`}
                  >
                    Confirmed
                  </span>
                  <span className="ml-1 text-xs text-gray-500">
                    ({files.filter((f) => f.submissionStatus === "confirmed").length})
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent className="shadow-lg text-xs">Confirmed submissions</TooltipContent>
            </Tooltip>

            <div className="h-8 w-px bg-gray-300 mx-4" />

            {/* In Progress */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setSelectedStatus((s) => (s === "progress" ? null : "progress"))}
                  className={`flex items-center text-sm cursor-pointer transition-all duration-300 hover:scale-105 px-4 py-2 group relative ${selectedStatus === "progress" ? "bg-white rounded-md p-1 shadow-sm" : ""
                    }`}
                >
                  <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2 transition-all duration-300 group-hover:scale-110" />
                  <span
                    className={`overflow-hidden transition-all whitespace-nowrap duration-300 ease-in-out ${selectedStatus === "progress"
                      ? "opacity-100 max-w-[100px]"
                      : "group-hover:opacity-100 group-hover:max-w-[100px] opacity-0 max-w-0"
                      }`}
                  >
                    In Progress
                  </span>
                  <span className="ml-1 text-xs text-gray-500">
                    ({files.filter((f) => f.submissionStatus === "progress").length})
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent className="shadow-lg text-xs">Submissions currently being reviewed</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Exports */}
          <TooltipProvider>
            <div className="ml-6 flex items-center space-x-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportToCSV(filteredData, columns, exportFilename)}
                    className="border-green-600 text-green-600 hover:bg-green-50"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    CSV
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="shadow-lg text-xs">Export data as CSV</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={() => exportToExcel(filteredData, columns, exportFilename)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 17v-2m3 2v-4m3 4v-2m-3-4V7m-3 4V7m6 10H9a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V15a2 2 0 01-2 2z"
                      />
                    </svg>
                    Excel
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="shadow-lg text-xs">Export data as Excel</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
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
                <Calendar mode="single" selected={selectedDate} onSelect={handleCalendarSelect} className="rounded-md border" captionLayout="dropdown" fromYear={2015} toYear={2030} />
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
              {showBottomPanel ? "Hide Files" : "Show Files"}
            </Button>
            <Button className="bg-[#028700] text-white hover:bg-[#028700c5]">New Record</Button>
          </div>
        </div>
        <DataTable data={filteredData} columns={columns} isLoading={isLoading} onRowClick={handleRowClick} />
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
        <p className="text-center text-gray-500">No files to preview</p>
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

      <PatientDetailsModal modalOpen={modalOpen} selectedPatient={selectedPatient} activeTab={activeTabCon} setActiveTab={setActiveTabCon} closeModal={closeModal} data={allPatients} />
    </div>
  );
}
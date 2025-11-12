import * as React from "react";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
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
  startOfWeek as getStartOfWeek,
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
} from "@/components/ui/command"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

// =========================================================================
// DATE UTILS & CONFIG
// =========================================================================
const getStartOfToday = (): Date => startOfDay(new Date());

const View = {
  YEAR: "Year",
  MONTH: "Month",
  WEEK: "Week",
  DAY: "Day",
} as const;

type ViewType = keyof typeof View;

const viewOptions = [
  { label: "YEAR", tooltip: "View data grouped by year" },
  { label: "MONTH", tooltip: "View data grouped by month" },
  { label: "WEEK", tooltip: "View data grouped by week" },
  { label: "DAY", tooltip: "View data grouped by day" },
] as const


const STATUS_COLORS = {
  GREEN: "bg-green-500",
  YELLOW: "bg-yellow-400",
  RED: "bg-red-500",
  GRAY: "bg-gray-300",
} as const;

type StatusColor = typeof STATUS_COLORS[keyof typeof STATUS_COLORS];

const dayAbbreviation = (date: Date): string => {
  const days = ["S", "M", "T", "W", "T", "F", "S"];
  return days[getDay(date)];
};

interface TimeUnit {
  id: string;
  date: Date;
  label: string;
  value: string;
  statusColor: StatusColor;
  isToday: boolean;
}

// =========================================================================
// STATUS COLOR LOGIC
// =========================================================================
const generateStatus = (
  unitDate: Date,
  files: PatientDataFile[],
  view: ViewType
): StatusColor => {
  let unitStart: Date, unitEnd: Date;

  switch (view) {
    case "DAY":
      unitStart = startOfDay(unitDate);
      unitEnd = addDays(unitStart, 1);
      break;
    case "WEEK":
      unitStart = startOfWeek(unitDate, { weekStartsOn: 1 });
      unitEnd = addWeeks(unitStart, 1);
      break;
    case "MONTH":
      unitStart = startOfMonth(unitDate);
      unitEnd = addMonths(unitStart, 1);
      break;
    case "YEAR":
      unitStart = startOfYear(unitDate);
      unitEnd = addYears(unitStart, 1);
      break;
  }

  const filesInUnit = files.filter((f) => {
    const created = new Date(f.createdAt);
    return created >= unitStart && created < unitEnd;
  });

  if (filesInUnit.length === 0) {
    return unitDate < startOfDay(new Date()) ? STATUS_COLORS.RED : STATUS_COLORS.GRAY;
  }

  const hasConfirmed = filesInUnit.some(f => f.submissionStatus === "confirmed");
  const hasProgress = filesInUnit.some(f => f.submissionStatus === "progress");
  const hasPending = filesInUnit.some(f => f.submissionStatus === "pending");

  if (hasConfirmed) return STATUS_COLORS.GREEN;
  if (hasProgress) return STATUS_COLORS.YELLOW;
  if (hasPending) return STATUS_COLORS.GRAY;
  return unitDate < startOfDay(new Date()) ? STATUS_COLORS.RED : STATUS_COLORS.GRAY;
};

// =========================================================================
// TIME UNIT ITEM
// =========================================================================
const TimeUnitItem = ({
  label,
  value,
  statusColor,
  isSelected,
}: {
  label: string;
  value: string;
  statusColor: StatusColor;
  isSelected: boolean;
}) => (
  <div className="flex flex-col items-center relative">
    <div className="text-xs font-semibold text-gray-500 mb-1">{label}</div>
    <div
      className={`w-8 h-8 p-5 flex items-center justify-center text-sm font-bold text-white rounded-md ${statusColor} shadow-sm transition-all duration-300 ease-in-out ${isSelected ? "scale-110 ring-2 ring-blue-500" : "scale-100 hover:scale-105"
        }`}
    >
      {value}
    </div>
    {isSelected && (
      <div className="w-7 h-1 bg-blue-600 rounded-full mt-1 absolute -bottom-2 animate-pulse"></div>
    )}
  </div>
);

const fetchFiles = async (): Promise<PatientDataFile[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), 500);
  });
};

// =========================================================================
// EXPORT UTILS (REUSABLE)
// =========================================================================
const generateExportFilename = (
  district: string,
  view: ViewType,
  date: Date,
  status: string | null
): string => {
  const cleanDistrict = district.replace(/\s+/g, "_");
  const statusPart = status ? `_${status}` : "";
  let period = "";

  if (view === "DAY") period = format(date, "yyyy-MM-dd");
  else if (view === "WEEK") period = `Week-${format(getStartOfWeek(date, { weekStartsOn: 1 }), "w-yyyy")}`;
  else if (view === "MONTH") period = format(date, "MMM-yyyy");
  else if (view === "YEAR") period = format(date, "yyyy");

  return `Patients_${cleanDistrict}_${period}${statusPart}`;
};


// =========================================================================
// MAIN COMPONENT - ONLY EXPORT ADDED
// =========================================================================
interface DataEntriesContentProps {
  setActiveTab?: React.Dispatch<React.SetStateAction<string>>;
}

export default function DataEntriesContent({ setActiveTab }: DataEntriesContentProps) {
  const {
    data: files = [],
    isLoading,
    error,
  } = useQuery<PatientDataFile[]>({
    queryKey: ["files"],
    queryFn: fetchFiles,
  });

  React.useEffect(() => {
    if (error) toast.error("Error fetching files data");
  }, [error]);


  // SINGLE SOURCE OF TRUTH
  const today = getStartOfToday();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [activeView, setActiveView] = useState<ViewType>("YEAR");

  // DERIVED VALUES (always in sync)
  const selectedUnitId = useMemo(() => {
    switch (activeView) {
      case "DAY": return format(selectedDate, "yyyy-MM-dd");
      case "WEEK": return format(startOfWeek(selectedDate, { weekStartsOn: 1 }), "yyyy-ww");
      case "MONTH": return format(startOfMonth(selectedDate), "yyyy-MM");
      case "YEAR": return format(startOfYear(selectedDate), "yyyy");
    }
  }, [selectedDate, activeView]);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showBottomPanel, setShowBottomPanel] = useState<boolean>(false);
  const [topPanelHeight, setTopPanelHeight] = useState<number>(65);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dividerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [activeTabCon, setActiveTabCon] = useState<"details" | "history">("details");
  const [selectedHealthDistrict, setSelectedHealthDistrict] = useState<string>("Buea District");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [open, setOpen] = React.useState(false)

  useEffect(() => {
    const savedStatus = localStorage.getItem('facilities:selectedStatus');
    if (savedStatus && ['confirmed', 'progress', 'pending', 'N/A'].includes(savedStatus)) {
      setSelectedStatus(savedStatus);
    }
  }, []);

  const allPatients = useMemo(() => files.flatMap((f) => f.patients), [files]);
  const allImages = useMemo(() => files.flatMap((f) => f.fileUrl), [files]);

  const healthDistricts = useMemo(() => {
    const districts = new Set<string>();
    files.forEach((file) => file.facility?.healthDistrict && districts.add(file.facility.healthDistrict));
    return Array.from(districts).sort();
  }, [files]);

  // Helper: Get start of unit
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

  // ALL POSSIBLE UNITS (centered around selectedDate)
  const allPossibleUnits = useMemo(() => {
    const units: TimeUnit[] = [];
    const center = selectedDate;

    const push = (date: Date, label: string, value: string) => {
      const id =
        activeView === "DAY" ? format(date, "yyyy-MM-dd") :
          activeView === "WEEK" ? format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-ww") :
            activeView === "MONTH" ? format(startOfMonth(date), "yyyy-MM") :
              format(startOfYear(date), "yyyy");

      units.push({
        id,
        date,
        label,
        value,
        statusColor: generateStatus(date, files, activeView),
        isToday: isSameDay(date, new Date()),
      });
    };

    switch (activeView) {
      case "DAY": {
        const start = addDays(center, -180);
        for (let i = 0; i < 360; i++) {
          const d = addDays(start, i);
          push(d, dayAbbreviation(d), format(d, "d"));
        }
        break;
      }
      case "WEEK": {
        const start = addWeeks(center, -52);
        for (let i = 0; i < 104; i++) {
          const weekStart = startOfWeek(addWeeks(start, i), { weekStartsOn: 1 });
          push(weekStart, `W${format(weekStart, "w")}`, format(weekStart, "w"));
        }
        break;
      }
      case "MONTH": {
        const start = addMonths(center, -36);
        for (let i = 0; i < 72; i++) {
          const monthStart = addMonths(start, i);
          push(monthStart, format(monthStart, "MMM"), format(monthStart, "M"));
        }
        break;
      }
      case "YEAR": {
        const start = addYears(center, -10);
        for (let i = 0; i < 21; i++) {
          const yearStart = addYears(start, i);
          push(yearStart, "", format(yearStart, "yyyy"));
        }
        break;
      }
    }
    return units;
  }, [selectedDate, activeView, files]);

  // FILTERED UNITS (status + max 6 visible)
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

    const selectedIndex = filtered.findIndex(u => u.id === selectedUnitId);
    const startIdx = selectedIndex === -1 ? 0 : Math.max(0, selectedIndex - 2);
    const endIdx = Math.min(filtered.length, startIdx + 6);

    return filtered.slice(startIdx, endIdx);
  }, [allPossibleUnits, selectedStatus, selectedUnitId, activeView, files]);

  // AUTO-JUMP when current unit disappears due to status filter
  useEffect(() => {
    if (units.length > 0) {
      const currentExists = units.some(u => u.id === selectedUnitId);
      if (!currentExists) {
        const first = units[0];
        const newDate = getUnitStart(first.date, activeView);
        setSelectedDate(newDate);
      }
    }
  }, [units, selectedUnitId, activeView]);

  // CURRENT RANGE
  const [startRange, endRange] = useMemo(() => {
    const start = getUnitStart(selectedDate, activeView);
    const end = getUnitEnd(start, activeView);
    return [start, end];
  }, [selectedDate, activeView]);

  // FILTERED PATIENTS
  const filteredData = useMemo(() => {
    if (!files.length || !startRange || !endRange) return [];

    const filteredFiles = files.filter((f) => {
      const created = new Date(f.createdAt);
      const inDateRange = created >= startRange && created < endRange;
      const inDistrict = !selectedHealthDistrict || f.facility?.healthDistrict === selectedHealthDistrict;
      const inStatus = selectedStatus === null || f.submissionStatus === selectedStatus;
      return inDateRange && inDistrict && inStatus;
    });

    let patients = filteredFiles.flatMap(f => f.patients);

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      patients = patients.filter(p =>
        [p.patientName, p.case, p.sex, p.age, p.contact, p.history].some(field =>
          String(field || "").toLowerCase().includes(term)
        )
      );
    }

    return patients;
  }, [files, startRange, endRange, searchTerm, selectedHealthDistrict, selectedStatus]);

  // HANDLERS
  const handleUnitClick = useCallback((unitId: string) => {
    const unit = units.find(u => u.id === unitId);
    if (unit) {
      setSelectedDate(getUnitStart(unit.date, activeView));
    }
  }, [units, activeView]);

  const handleCalendarSelect = useCallback((date: Date | undefined) => {
    if (date) {
      setSelectedDate(startOfDay(date));
    }
  }, []);

  const handleViewChange = useCallback((view: ViewType) => {
    setActiveView(view);
    const aligned = getUnitStart(selectedDate, view);
    setSelectedDate(aligned);
  }, [selectedDate]);

  const handleRowClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setModalOpen(true);
    setActiveTabCon("details");
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedPatient(null);
  };

  const toggleBottomPanel = () => {
    setShowBottomPanel(!showBottomPanel);
    if (!showBottomPanel && (topPanelHeight < 20 || topPanelHeight > 80)) {
      setTopPanelHeight(65);
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const windowHeight = window.innerHeight;
    const headerHeight = 100;
    const availableHeight = windowHeight - headerHeight;
    const newY = e.clientY - headerHeight;
    let newHeightPercent = (newY / availableHeight) * 100;
    newHeightPercent = Math.max(10, Math.min(90, newHeightPercent));
    setTopPanelHeight(newHeightPercent);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      dividerRef.current?.classList.remove("dragging");
    }
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (showBottomPanel) {
      setIsDragging(true);
      document.body.style.userSelect = "none";
      document.body.style.cursor = "ns-resize";
      dividerRef.current?.classList.add("dragging");
    }
  };

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

  // Generate filename for export
  const exportFilename = generateExportFilename(selectedHealthDistrict, activeView, selectedDate, selectedStatus);

  return (

    <div className="h-screen flex flex-col overflow-hidden font-[400] antialiased">
      <style>{`
        .divider { height: 8px; background: #e5e7eb; cursor: ns-resize; position: relative; z-index: 10; transition: background 0.2s; width: 100%; flex-shrink: 0; }
        .divider:hover { background: #d1d5db; }
        .divider::before { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 40px; height: 4px; background: #9ca3af; border-radius: 2px; }
        .divider.dragging { background: #9ca3af; }
        .top-panel-content { overflow: auto; height: 100%; }
        .time-unit-button { cursor: pointer; transition: all 0.3s ease-in-out; }
        .time-unit-button:hover { transform: translateY(-2px); }
        .time-unit-button:active { transform: translateY(0); }
        .date-scroll { scrollbar-width: thin; }
        .date-scroll::-webkit-scrollbar { height: 6px; }
        .date-scroll::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 3px; }
        .date-scroll::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 3px; }
      `}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-white z-20 flex-shrink-0">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              role="combobox"
              aria-expanded={open}
              className="w-[240px] justify-between bg-[#021EF533] py-3 px-4 border border-blue-200 rounded-md flex items-center text-sm text-left"
            >
              <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span className="font-[500]">{selectedHealthDistrict || "Select Health District"}</span>
              </div>
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </button>
          </PopoverTrigger>

          <PopoverContent className="w-[240px] p-0 font-[500]">
            <Command>
              <CommandInput placeholder="Search district..." />
              <CommandList>
                <CommandEmpty>No district found.</CommandEmpty>
                <CommandGroup>
                  {healthDistricts.map((district) => (
                    <CommandItem
                      key={district}
                      onSelect={() => {
                        setSelectedHealthDistrict(district)
                        setOpen(false)
                      }}
                    >
                      <CheckIcon
                        className={cn(
                          "mr-2 h-4 w-4",
                          district === selectedHealthDistrict ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {district}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* LEGEND */}

        <div className="flex items-center mt-4 md:mt-0 p-2 border rounded-md bg-gray-100 h-12">
          <TooltipProvider>
            {/* ❌ No Submission */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setSelectedStatus(s => s === "N/A" ? null : "N/A")}
                  className={`flex items-center text-sm cursor-pointer transition-all duration-200 hover:scale-105 py-2 ${selectedStatus === "N/A" ? "bg-white rounded-md p-1" : ""}`}
                >
                  <div className="w-3 h-3 rounded-full bg-red-500 p-3 mr-2" />
                  {selectedStatus === "N/A" && "No Submission"}
                  <span className="ml-1 text-xs text-gray-500">
                    ({files.filter(f => !f.submissionStatus || f.submissionStatus === "N/A").length})
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent className="shadow-lg text-xs">
                No Submission
              </TooltipContent>
            </Tooltip>

            <div className="h-8 w-px bg-gray-300 mx-4" />

            {/* ✅ Confirmed */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setSelectedStatus(s => s === "confirmed" ? null : "confirmed")}
                  className={`flex items-center text-sm cursor-pointer transition-all duration-200 hover:scale-105 py-2 ${selectedStatus === "confirmed" ? "bg-white rounded-md p-1" : ""}`}
                >
                  <div className="w-3 h-3 rounded-full bg-green-500 p-3 mr-2" />
                  {selectedStatus === "confirmed" && "Confirmed"}
                  <span className="ml-1 text-xs text-gray-500">
                    ({files.filter(f => f.submissionStatus === "confirmed").length})
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent className="shadow-lg text-xs">
                Confirmed submissions
              </TooltipContent>
            </Tooltip>

            <div className="h-8 w-px bg-gray-300 mx-4" />

            {/* 🟡 In Progress */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setSelectedStatus(s => s === "progress" ? null : "progress")}
                  className={`flex items-center text-sm cursor-pointer transition-all duration-200 hover:scale-105 py-2 ${selectedStatus === "progress" ? "bg-white rounded-md p-1" : ""}`}
                >
                  <div className="w-3 h-3 rounded-full bg-yellow-400 p-3 mr-2" />
                  {selectedStatus === "progress" && "In Progress"}
                  <span className="ml-1 text-xs text-gray-500">
                    ({files.filter(f => f.submissionStatus === "progress").length})
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent className="shadow-lg text-xs">
                Submissions currently being reviewed
              </TooltipContent>
            </Tooltip>

            <div className="h-8 w-px bg-gray-300 mx-4" />

            {/* ⏸ Pending */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setSelectedStatus(s => s === "pending" ? null : "pending")}
                  className={`flex items-center text-sm cursor-pointer transition-all duration-200 hover:scale-105 py-2 ${selectedStatus === "pending" ? "bg-white rounded-md p-1" : ""}`}
                >
                  <div className="w-3 h-3 rounded-full bg-gray-300 p-3 mr-2" />
                  {selectedStatus === "pending" && "Pending"}
                  <span className="ml-1 text-xs text-gray-500">
                    ({files.filter(f => f.submissionStatus === "pending").length})
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent className="shadow-lg text-xs">
                Awaiting review or confirmation
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {selectedStatus && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedStatus(null);
                localStorage.removeItem('facilities:selectedStatus');
                toast.info('Filter cleared');
              }}
              className="ml-4 text-xs"
            >
              Clear filter
            </Button>
          )}

          {/* EXPORT BUTTONS */}
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    CSV
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="shadow-lg text-xs">
                  Export data as CSV
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={() => exportToExcel(filteredData, columns, exportFilename)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-2m-3-4V7m-3 4V7m6 10H9a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V15a2 2 0 01-2 2z" />
                    </svg>
                    Excel
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="shadow-lg text-xs">
                  Export data as Excel
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

      </div >

      {/* Main Split Container */}

      <div className="flex-1 flex flex-col overflow-hidden" ref={containerRef} >
        <div className="bg-white relative flex-shrink-0" style={{ height: showBottomPanel ? `${topPanelHeight}%` : "100%" }}>
          <div className="top-panel-content">
            <div className="px-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-t pt-1 pb-1">
                <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 mb-4 md:mb-0">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[240px] shadow-none justify-start text-left font-normal h-10">
                        <span className="mr-2">
                          {activeView === "YEAR" && format(selectedDate, "yyyy")}
                          {activeView === "MONTH" && format(selectedDate, "MMMM yyyy")}
                          {activeView === "WEEK" && `Week ${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'w, yyyy')}`}
                          {activeView === "DAY" && format(selectedDate, "PPP")}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleCalendarSelect}
                        className="rounded-md border"
                        captionLayout="dropdown"
                        fromYear={2015}
                        toYear={2030}
                        onMonthChange={(month) => {
                          const yearChanged = month.getFullYear() !== selectedDate.getFullYear();
                          setSelectedDate(startOfMonth(month));
                          setActiveView(yearChanged ? "YEAR" : "MONTH");
                        }}
                      />
                    </PopoverContent>
                  </Popover>

                  <div className="flex p-1 space-x-1 bg-gray-100 rounded-md px-1">
                    <TooltipProvider>
                      {viewOptions.map((view) => (
                        <Tooltip key={view.label}>
                          <TooltipTrigger asChild>
                            <Button
                              variant={view.label === activeView ? "default" : "ghost"}
                              size="sm"
                              onClick={() => handleViewChange(view.label)}
                              className={`rounded-md px-4 transition-colors duration-200 ${view.label === activeView && "bg-[#028700] hover:bg-[#028700c9]"
                                }`}
                            >
                              {view.label}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{view.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </TooltipProvider>
                  </div>

                </div>

                <div className="flex space-x-3 pb-2">
                  <div className="flex space-x-3 bg-gray-100 rounded-md px-3 py-2 overflow-x-auto date-scroll">
                    {units.length === 0 ? (
                      <div className="text-sm text-gray-500 whitespace-nowrap">No data for selected filters</div>
                    ) : (
                      units.map((unit) => (
                        <button
                          key={unit.id}
                          onClick={() => handleUnitClick(unit.id)}
                          className="time-unit-button focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-1 flex-shrink-0"
                        >
                          <TimeUnitItem
                            label={unit.label}
                            value={unit.value}
                            statusColor={unit.statusColor}
                            isSelected={unit.id === selectedUnitId}
                          />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 mb-4">
                <div className="flex items-center space-x-4 relative">
                  {/* <div className="font-[500] text-md rounded-md bg-gray-100 p-2">Report</div>
                  <Select>
                    <SelectTrigger className="w-[180px] shadow-none outline-none">
                      <SelectValue placeholder="Disease control" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disease-control">Disease control</SelectItem>
                      <SelectItem value="outbreaks">Outbreaks</SelectItem>
                      <SelectItem value="staffing">Staffing</SelectItem>
                    </SelectContent>
                  </Select> */}
                  <Input
                    type="search"
                    placeholder="Search..."
                    className="w-full md:w-auto shadow-none outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <MagnifyingGlassIcon className="absolute right-2 text-gray-300"/>
                </div>

                <div className="flex space-x-3">
                  <Button variant="outline" className="bg-[#021EF533] text-blue-700 hover:text-white hover:bg-[#021EF5] shadow-none" onClick={toggleBottomPanel}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M15.536 6.758a1 1 0 00-1.414 0L10 10.879 5.879 6.758a1 1 0 10-1.414 1.414l4.95 4.95a1 1 0 001.414 0l4.95-4.95a1 1 0 000-1.414z" />
                      <path d="M15 14h-5m-5 0h5m-5 3h10a2 2 0 002-2v-3a2 2 0 00-2-2H5a2 2 0 00-2 2v-3a2 2 0 002 2z" />
                    </svg>
                    {showBottomPanel ? "Hide Files" : "Files"}
                  </Button>
                  <Button className="bg-[#028700] text-white hover:bg-[#028700c5] shadow-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    New Record
                  </Button>
                </div>
              </div>

              <div className="data-table">
                <DataTable data={filteredData} columns={columns} isLoading={isLoading} onRowClick={handleRowClick} />
              </div>
            </div>
          </div>
        </div>

        {
          showBottomPanel && (
            <div ref={dividerRef} className={`divider ${isDragging ? "dragging" : ""}`} onMouseDown={handleMouseDown}></div>
          )
        }

        {
          showBottomPanel && (
            <div className="bg-gray-50 p-4 overflow-auto flex-1" style={{ height: `${100 - topPanelHeight}%` }}>
              {allImages.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                  {allImages.map((url, index) => (
                    <ImageViewer key={index} src={url} />
                  ))}
                </div>
              ) : (
                <p className="col-span-2 text-center text-gray-500">No files to preview</p>
              )}
            </div>
          )
        }
      </div>

      <PatientDetailsModal
        modalOpen={modalOpen}
        selectedPatient={selectedPatient}
        activeTab={activeTabCon}
        setActiveTab={setActiveTabCon}
        closeModal={closeModal}
        data={allPatients}
      />
    </div >
  );
}
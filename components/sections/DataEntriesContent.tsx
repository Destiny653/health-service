import * as React from "react";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, startOfYear, addYears, startOfMonth, addMonths, startOfWeek, addWeeks, addDays, getDay, isSameDay, startOfDay, isSameWeek, isSameMonth, isSameYear } from 'date-fns';
import { Patient } from "@/hooks/usePatients";
import { PatientDataFile } from "@/data";
import { data } from "@/data";
import { DataTable } from "@/components/PatientsTable";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import PatientDetailsModal from '@/components/PatientDetailsModal';
import ImageViewer from "../ImageViewer";

// =========================================================================
// DATE MANAGEMENT UTILITY (New 'import-like' date logic)
// Ensures the default date is consistently the current date at midnight.
// =========================================================================

/**
 * Utility function to always get the current date set to midnight (start of the day).
 * This ensures calendar dates and filtering ranges are always consistent.
 */
const getStartOfToday = (): Date => startOfDay(new Date());

// =========================================================================
// END OF DATE MANAGEMENT UTILITY
// =========================================================================


// --- CONFIGURATION ---
const View = {
  DAY: 'Day',
  WEEK: 'Week',
  MONTH: 'Month',
  YEAR: 'Year',
} as const;

type ViewType = typeof View[keyof typeof View];

/* --------------------------------------------------------------
   UPDATED: Status colors based on submissionStatus + date logic
   -------------------------------------------------------------- */
const STATUS_COLORS = {
  GREEN: 'bg-green-500',
  YELLOW: 'bg-yellow-400',
  RED: 'bg-red-500',
  GRAY: 'bg-gray-300',
} as const;

type StatusColor = typeof STATUS_COLORS[keyof typeof STATUS_COLORS];

/* --------------------------------------------------------------
   Helper: Is a date in the past (before today)?
   -------------------------------------------------------------- */
const isPastDate = (d: Date): boolean => d < startOfDay(new Date());

/* --------------------------------------------------------------
   NEW: generateStatus uses real file data + date logic
   -------------------------------------------------------------- */
const generateStatus = (
  unitDate: Date,
  files: PatientDataFile[],
  view: ViewType
): StatusColor => {
  // Define the time range for the current unit
  let unitStart: Date, unitEnd: Date;

  switch (view) {
    case View.DAY:
      unitStart = startOfDay(unitDate);
      unitEnd = addDays(unitStart, 1);
      break;
    case View.WEEK:
      unitStart = startOfWeek(unitDate, { weekStartsOn: 1 });
      unitEnd = addWeeks(unitStart, 1);
      break;
    case View.MONTH:
      unitStart = startOfMonth(unitDate);
      unitEnd = addMonths(unitStart, 1);
      break;
    case View.YEAR:
      unitStart = startOfYear(unitDate);
      unitEnd = addYears(unitStart, 1);
      break;
    default:
      unitStart = unitDate;
      unitEnd = addDays(unitDate, 1);
  }

  // Find files created within this time unit
  const filesInUnit = files.filter(f => {
    const created = new Date(f.createdAt);
    return created >= unitStart && created < unitEnd;
  });

  // No files in this unit
  if (filesInUnit.length === 0) {
    return isPastDate(unitDate) ? STATUS_COLORS.RED : STATUS_COLORS.GRAY;
  }

  // Determine the "worst" status (progress > pending > N/A)
  const worstStatus = filesInUnit.reduce((worst, file) => {
    if (worst === 'confirmed') return worst;
    if (file.submissionStatus === 'confirmed') return worst;
    return file.submissionStatus;
  }, filesInUnit[0].submissionStatus);

  // Map status to color
  switch (worstStatus) {
    case 'confirmed':
      return STATUS_COLORS.GREEN;
    case 'progress':
      return STATUS_COLORS.YELLOW;
    case 'pending':
      return STATUS_COLORS.GRAY;
    default:
      return isPastDate(unitDate) ? STATUS_COLORS.RED : STATUS_COLORS.GRAY;
  }
};

const dayAbbreviation = (date: Date): string => {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
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

const TimeUnitItem = ({ label, value, statusColor, isSelected }: { label: string; value: string; statusColor: StatusColor; isSelected: boolean }) => (
  <div className="flex flex-col items-center relative">
    <div className="text-xs font-semibold text-gray-500 mb-1">
      {label}
    </div>
    <div
      className={`w-8 h-8 p-5 flex items-center justify-center text-sm font-bold text-white rounded-md ${statusColor} shadow-sm transition-all duration-300 ease-in-out ${isSelected ? 'scale-110 ring-2 ring-blue-500' : 'scale-100 hover:scale-105'}`}
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
    setTimeout(() => {
      resolve(data);
    }, 500);
  });
};

export default function DataEntriesContent() {
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

  // --- UPDATED: Use the current date as the default base date ---
  const baseDate = getStartOfToday();
  const baseDateStr = format(baseDate, 'yyyy-MM-dd');
  const [activeView, setActiveView] = useState<ViewType>(View.DAY);
  const [selectedUnitId, setSelectedUnitId] = useState<string>(baseDateStr);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(baseDateStr);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [showBottomPanel, setShowBottomPanel] = useState<boolean>(false);
  const [topPanelHeight, setTopPanelHeight] = useState<number>(65);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dividerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
  const [selectedHealthDistrict, setSelectedHealthDistrict] = useState<string>('Buea District');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const allPatients = useMemo(() => files.flatMap(f => f.patients), [files]);
  const allImages = useMemo(() => files.flatMap(f => f.fileUrl), [files]);

  const healthDistricts = useMemo(() => {
    const districts = new Set<string>();
    files.forEach(file => {
      if (file.facility?.healthDistrict) {
        districts.add(file.facility.healthDistrict);
      }
    });
    return Array.from(districts).sort();
  }, [files]);

  const selectedDate = useMemo(() => startOfDay(new Date(selectedDateStr)), [selectedDateStr]);

  const calculateUnitId = useCallback((date: Date, view: ViewType): string => {
    switch (view) {
      case View.DAY:
        return format(date, 'yyyy-MM-dd');
      case View.WEEK:
        return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-ww');
      case View.MONTH:
        return format(startOfMonth(date), 'yyyy-MM');
      case View.YEAR:
        return format(startOfYear(date), 'yyyy');
      default:
        return '';
    }
  }, []);

  const updateSelectedUnitId = useCallback((newId: string) => {
    setSelectedUnitId(prevId => (newId !== prevId ? newId : prevId));
  }, []);

  useEffect(() => {
    const newId = calculateUnitId(selectedDate, activeView);
    updateSelectedUnitId(newId);
  }, [selectedDate, activeView, calculateUnitId, updateSelectedUnitId]);

  const dateToCenterUnits = useMemo(() => {
    if (!selectedUnitId) return selectedDate;

    let date;
    const parts = selectedUnitId.split('-');

    try {
      if (activeView === View.DAY) {
        date = new Date(selectedUnitId);
      } else if (activeView === View.MONTH) {
        date = new Date(`${selectedUnitId}-01`);
      } else if (activeView === View.YEAR) {
        date = new Date(`${selectedUnitId}-01-01`);
      } else {
        date = selectedDate;
      }

      return date && !isNaN(date.getTime()) ? startOfDay(date) : selectedDate;
    } catch {
      return selectedDate;
    }
  }, [selectedUnitId, activeView, selectedDate]);

  /* --------------------------------------------------------------
     UPDATED: units now use real submission status + date logic
     -------------------------------------------------------------- */
  const units = useMemo<TimeUnit[]>(() => {
    let generatedUnits: TimeUnit[] = [];
    const centerDate = dateToCenterUnits;

    const pushUnit = (date: Date, label: string, value: string, id: string) => {
      generatedUnits.push({
        id,
        date,
        label,
        value,
        statusColor: generateStatus(date, files, activeView),
        isToday: isSameDay(date, new Date()),
      });
    };

    switch (activeView) {
      case View.DAY: {
        const startDay = addDays(centerDate, -4);
        for (let i = 0; i < 10; i++) {
          const day = startOfDay(addDays(startDay, i));
          pushUnit(day, dayAbbreviation(day), format(day, 'd'), format(day, 'yyyy-MM-dd'));
        }
        break;
      }
      case View.WEEK: {
        const startWeek = startOfWeek(addWeeks(centerDate, -4), { weekStartsOn: 1 });
        for (let i = 0; i < 10; i++) {
          const weekStart = startOfWeek(addWeeks(startWeek, i), { weekStartsOn: 1 });
          pushUnit(weekStart, `W${format(weekStart, 'w')}`, format(weekStart, 'w'), format(weekStart, 'yyyy-ww'));
        }
        break;
      }
      case View.MONTH: {
        const startMonth = startOfMonth(addMonths(centerDate, -4));
        for (let i = 0; i < 10; i++) {
          const month = startOfMonth(addMonths(startMonth, i));
          pushUnit(month, format(month, 'MMM'), format(month, 'M'), format(month, 'yyyy-MM'));
        }
        break;
      }
      case View.YEAR: {
        const startYr = startOfYear(addYears(centerDate, -2));
        for (let i = 0; i < 5; i++) {
          const year = startOfYear(addYears(startYr, i));
          pushUnit(year, '', format(year, 'yyyy'), format(year, 'yyyy'));
        }
        break;
      }
    }
    return generatedUnits;
  }, [activeView, dateToCenterUnits, files]);

  const selectedUnit = useMemo(() => {
    return units.find(u => u.id === selectedUnitId) || null;
  }, [units, selectedUnitId]);

  const [startRange, endRange] = useMemo(() => {
    if (!selectedUnit) return [null, null] as [Date | null, Date | null];
    const d = selectedUnit.date;

    switch (activeView) {
      case View.DAY:
        const dayStart = startOfDay(d);
        const dayEnd = addDays(dayStart, 1);
        return [dayStart, dayEnd];
      case View.WEEK:
        const weekStart = startOfWeek(d, { weekStartsOn: 1 });
        const weekEnd = addWeeks(weekStart, 1);
        return [weekStart, weekEnd];
      case View.MONTH:
        const monthStart = startOfMonth(d);
        const monthEnd = addMonths(monthStart, 1);
        return [monthStart, monthEnd];
      case View.YEAR:
        const yearStart = startOfYear(d);
        const yearEnd = addYears(yearStart, 1);
        return [yearStart, yearEnd];
      default:
        return [null, null];
    }
  }, [selectedUnit, activeView]);

  const filteredData = useMemo(() => {
    if (!files.length || !startRange || !endRange) return [];

    const filteredFiles = files.filter(f => {
      const created = new Date(f.createdAt);
      const inDateRange = created >= startRange && created < endRange;
      const inHealthDistrict = selectedHealthDistrict === '' || f.facility?.healthDistrict === selectedHealthDistrict;
      const inStatus = selectedStatus === null || f.submissionStatus === selectedStatus;
      return inDateRange && inHealthDistrict && inStatus;
    });

    let flatPatients = filteredFiles.flatMap(f => f.patients);

    if (searchTerm !== '') {
      flatPatients = flatPatients.filter(p => [
        p.patientName,
        p.case,
        p.sex,
        p.age?.toString(),
        p.maritalStatus,
        p.profession,
        p.residence,
        p.contact,
        p.history
      ].some(field => String(field || '').toLowerCase().includes(searchTerm.toLowerCase())));
    }
    return flatPatients;
  }, [files, startRange, endRange, searchTerm, selectedHealthDistrict, selectedStatus]);

  const handleUnitClick = useCallback((unitId: string) => {
    setSelectedUnitId(unitId);
    const clickedUnit = units.find(u => u.id === unitId);
    if (clickedUnit) {
      setSelectedDateStr(format(clickedUnit.date, 'yyyy-MM-dd'));
    }
  }, [units]);

  const handleCalendarSelect = useCallback((date: Date | undefined) => {
    if (date) {
      // Ensure the selection is also set to the start of the day for consistency
      setSelectedDateStr(format(startOfDay(date), 'yyyy-MM-dd'));
    }
  }, []);

  const handleViewChange = useCallback((view: ViewType) => {
    setActiveView(view);
  }, []);

  const handleRowClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setModalOpen(true);
    setActiveTab('details');
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedPatient(null);
  };

  const toggleBottomPanel = () => {
    setShowBottomPanel(!showBottomPanel);
    if (!showBottomPanel) {
      if (topPanelHeight < 20 || topPanelHeight > 80) {
        setTopPanelHeight(65);
      }
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const windowHeight = window.innerHeight;
    const headerHeight = 100;
    const availableHeight = windowHeight - headerHeight;
    const newY = e.clientY - headerHeight;

    let newHeightPercent = (newY / availableHeight) * 100;

    const MIN_HEIGHT = 10;
    const MAX_HEIGHT = 90;

    if (newHeightPercent < MIN_HEIGHT) newHeightPercent = MIN_HEIGHT;
    if (newHeightPercent > MAX_HEIGHT) newHeightPercent = MAX_HEIGHT;

    setTopPanelHeight(newHeightPercent);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      dividerRef.current?.classList.remove('dragging');
    }
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (showBottomPanel) {
      setIsDragging(true);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'ns-resize';
      dividerRef.current?.classList.add('dragging');
    }
  };

  const columns = React.useMemo<ColumnDef<Patient>[]>(
    () => [
      { accessorKey: "case", header: "Case #" },
      { accessorKey: "patientName", header: "Patient Name" },
      { accessorKey: "sex", header: "Sex" },
      { accessorKey: "age", header: "Age" },
      { accessorKey: "maritalStatus", header: "Marital Status" },
      { accessorKey: "isPregnant", header: "Is Pregnant" },
      { accessorKey: "profession", header: "Profession" },
      { accessorKey: "residence", header: "Residence" },
      { accessorKey: "contact", header: "Contact" },
      { accessorKey: "history", header: "History" },
    ],
    []
  );

  return (
    <div className={`${'h-screen'} flex flex-col overflow-hidden font-[400] antialiased`}>
      <style>{`
        .divider {
          height: 8px;
          background: #e5e7eb;
          cursor: ns-resize;
          position: relative;
          z-index: 10;
          transition: background 0.2s;
          width: 100%;
          flex-shrink: 0;
        }
        .divider:hover {
          background: #d1d5db;
        }
        .divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 40px;
          height: 4px;
          background: #9ca3af;
          border-radius: 2px;
        }
        .divider.dragging {
          background: #9ca3af;
        }
        .top-panel-content {
          overflow: auto;
          height: 100%;
        }
        .time-unit-button {
          cursor: pointer;
          transition: all 0.3s ease-in-out;
        }
        .time-unit-button:hover {
          transform: translateY(-2px);
        }
        .time-unit-button:active {
          transform: translateY(0);
        }
        .date-range-display {
          transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
        }
        .data-table {
          transition: opacity 0.3s ease-in-out;
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-white z-20 flex-shrink-0">
        <Select value={selectedHealthDistrict} onValueChange={setSelectedHealthDistrict}>
          <SelectTrigger className="w-[240px] bg-[#021EF533] py-5 border border-blue-200">
            <div className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <SelectValue placeholder="Select Health District" />
            </div>
          </SelectTrigger>
          <SelectContent className="font-[500]">
            {healthDistricts.map((district) => (
              <SelectItem key={district} value={district}>
                {district}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* UPDATED LEGEND */}
        <div className="flex items-center mt-4 md:mt-0 p-2 border rounded-md bg-gray-100 h-12">
          {/* Button 1 */}
          <button
            onClick={() => setSelectedStatus(selectedStatus === 'N/A' ? null : 'N/A')}
            className={`flex items-center text-sm cursor-pointer transition-all duration-200 hover:scale-105 py-2 ${selectedStatus === 'N/A' ? 'bg-white rounded-md p-1' : ''
              }`}
          >
            <div className="w-3 h-3 rounded-full bg-red-500 p-3 mr-2"></div>
            {selectedStatus === 'N/A' ? 'No Submission (Past)' : ''}
            <span className="ml-1 text-xs text-gray-500">
              ({files.filter(f => f.submissionStatus === 'N/A').length})
            </span>
          </button>

          {/* Vertical Separator */}
          <div className="h-8 w-px bg-gray-300 mx-4"></div>

          {/* Button 2 */}
          <button
            onClick={() => setSelectedStatus(selectedStatus === 'confirmed' ? null : 'confirmed')}
            className={`flex items-center text-sm cursor-pointer transition-all duration-200 hover:scale-105 py-2 ${selectedStatus === 'confirmed' ? 'bg-white rounded-md p-1' : ''
              }`}
          >
            <div className="w-3 h-3 rounded-full bg-green-500 p-3 mr-2"></div>
            {selectedStatus === 'confirmed' ? 'Confirmed' : ''}
            <span className="ml-1 text-xs text-gray-500">
              ({files.filter(f => f.submissionStatus === 'confirmed').length})
            </span>
          </button>

          {/* Vertical Separator */}
          <div className="h-8 w-px bg-gray-300 mx-4"></div>

          {/* Button 3 */}
          <button
            onClick={() => setSelectedStatus(selectedStatus === 'progress' ? null : 'progress')}
            className={`flex items-center text-sm cursor-pointer transition-all duration-200 hover:scale-105 py-2 ${selectedStatus === 'progress' ? 'bg-white rounded-md p-1' : ''
              }`}
          >
            <div className="w-3 h-3 rounded-full bg-yellow-400 p-3 mr-2"></div>
            {selectedStatus === 'progress' ? 'In Progress' : ''}
            <span className="ml-1 text-xs text-gray-500">
              ({files.filter(f => f.submissionStatus === 'progress').length})
            </span>
          </button>

          {/* Vertical Separator */}
          <div className="h-8 w-px bg-gray-300 mx-4"></div>

          {/* Button 4 */}
          <button
            onClick={() => setSelectedStatus(selectedStatus === 'pending' ? null : 'pending')}
            className={`flex items-center text-sm cursor-pointer transition-all duration-200 hover:scale-105 py-2 ${selectedStatus === 'pending' ? 'bg-white rounded-md p-1' : ''
              }`}
          >
            <div className="w-3 h-3 rounded-full bg-gray-300 p-3 mr-2"></div>
            {selectedStatus === 'pending' ? 'Pending / N/A' : ''}
            <span className="ml-1 text-xs text-gray-500">
              ({files.filter(f => f.submissionStatus === 'pending').length})
            </span>
          </button>
        </div>

      </div>

      {/* Main Split Container */}
      <div className="flex-1 flex flex-col overflow-hidden" ref={containerRef}>
        {/* Top Panel */}
        <div
          className="bg-white relative flex-shrink-0"
          style={{ height: showBottomPanel ? `${topPanelHeight}%` : '100%' }}
        >
          <div className="top-panel-content">
            {/* Time Selector */}
            <div className="px-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center  border-b border-t pt-1 pb-1">
                <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 mb-4 md:mb-0">
                  <div className="flex items-center space-x-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[240px] shadow-none justify-start text-left font-normal h-10">
                          <span className="mr-2">{format(selectedDate, 'PPP')}</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={handleCalendarSelect}
                          className="rounded-md border"
                          captionLayout="dropdown"
                          fromYear={1990}
                          toYear={2030}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex p-1 space-x-1 bg-gray-100 rounded-md px-1">
                    {Object.values(View).reverse().map((view) => (
                      <Button
                        key={view}
                        variant={view === activeView ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handleViewChange(view)}
                        className={`rounded-md px-4 transition-colors duration-200 ${view === activeView && 'bg-[#028700] hover:bg-[#028700c9]'}`}
                      >
                        {view}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3 pb-2">
                  <div className="flex space-x-3 bg-gray-100 rounded-md px-1 py-2 transition-all duration-300 ease-in-out">
                    {units.map((unit) => (
                      <button
                        key={unit.id}
                        onClick={() => handleUnitClick(unit.id)}
                        className="time-unit-button focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-1"
                        aria-label={`Select ${activeView} unit: ${unit.value}`}
                        type="button"
                      >
                        <TimeUnitItem
                          label={unit.label}
                          value={unit.value}
                          statusColor={unit.statusColor}
                          isSelected={unit.id === selectedUnitId}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* {startRange && endRange && (
                <div className="date-range-display text-sm text-gray-600 mt-2 p-2 bg-blue-50 rounded-md border border-blue-200">
                  <strong>Selected Range:</strong> {format(startRange, 'MMM d, yyyy')}
                  {!isSameDay(startRange, addDays(endRange, -1)) && ` - ${format(addDays(endRange, -1), 'MMM d, yyyy')}`}
                  <span className="ml-3 text-blue-700">({filteredData.length} records)</span>
                </div>
              )} */}
            </div>

            {/* Actions and Table */}
            <div className="p-4">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 mb-4">
                <div className="flex items-center space-x-4">
                  <div className="font-[500] text-md rounded-md bg-gray-100 p-2">Report</div>
                  <Select>
                    <SelectTrigger className="w-[180px] shadow-none outline-none">
                      <SelectValue placeholder="Disease control" />
                    </SelectTrigger>
                    <SelectContent id="disease-select-content">
                      <SelectItem value="disease-control">Disease control</SelectItem>
                      <SelectItem value="outbreaks">Outbreaks</SelectItem>
                      <SelectItem value="staffing">Staffing</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="search"
                    placeholder="Search..."
                    className="w-full md:w-auto shadow-none outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex space-x-3">
                  <Button variant="outline" className="bg-[#021EF533] text-blue-700 hover:text-white hover:[#021EF5] shadow-none" onClick={toggleBottomPanel}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M15.536 6.758a1 1 0 00-1.414 0L10 10.879 5.879 6.758a1 1 0 10-1.414 1.414l4.95 4.95a1 1 0 001.414 0l4.95-4.95a1 1 0 000-1.414z" /><path d="M15 14h-5m-5 0h5m-5 3h10a2 2 0 002-2v-3a2 2 0 00-2-2H5a2 2 0 00-2 2v3a2 2 0 002 2z" /></svg>
                    {showBottomPanel ? 'Hide Files' : 'Files'}
                  </Button>
                  <Button className="bg-[#028700] text-white hover:bg-[#028700c5] shadow-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
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

        {/* Draggable Divider */}
        {showBottomPanel && (
          <div
            ref={dividerRef}
            className={`divider ${isDragging ? 'dragging' : ''}`}
            onMouseDown={handleMouseDown}
          ></div>
        )}

        {/* Bottom Panel */}
        {showBottomPanel && (
          <div
            className="bg-gray-50 p-4 overflow-auto flex-1"
            style={{ height: `${100 - topPanelHeight}%` }}
          >
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
        )}
      </div>

      <PatientDetailsModal
        modalOpen={modalOpen}
        selectedPatient={selectedPatient}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        closeModal={closeModal}
        data={allPatients}
      />
    </div>
  );
}
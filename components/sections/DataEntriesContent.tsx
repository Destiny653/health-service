import * as React from "react";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
// Import all date-fns functions needed
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

// --- CONFIGURATION ---
const View = {
  DAY: 'Day',
  WEEK: 'Week',
  MONTH: 'Month',
  YEAR: 'Year',
} as const;

type ViewType = typeof View[keyof typeof View];

const STATUS_COLORS = {
  NEW_RECORD: 'bg-yellow-400',
  UNDER_REVIEW: 'bg-green-200',
  COMPLETE: 'bg-green-500',
  NO_SUBMISSION: 'bg-red-500',
  NO_DATA: 'bg-gray-300',
} as const;

type StatusColor = typeof STATUS_COLORS[keyof typeof STATUS_COLORS];

const generateStatus = (date: Date): StatusColor => {
  const day = date.getDate();
  const month = date.getMonth();

  if (day === 7 || day === 15) return STATUS_COLORS.NO_SUBMISSION;
  if (day % 3 === 0) return STATUS_COLORS.COMPLETE;
  if (day % 5 === 0) return STATUS_COLORS.UNDER_REVIEW;
  if (day % 2 === 1) return STATUS_COLORS.NEW_RECORD;

  if (month === 8) return STATUS_COLORS.UNDER_REVIEW;
  if (month === 10) return STATUS_COLORS.COMPLETE;

  return STATUS_COLORS.NO_DATA;
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

  const baseDate = new Date('2023-06-01');
  const baseDateStr = format(baseDate, 'yyyy-MM-dd');
  const [activeView, setActiveView] = useState<ViewType>(View.DAY);
  const [selectedUnitId, setSelectedUnitId] = useState<string>(baseDateStr);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(baseDateStr); // Date picked from calendar
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Panel state (remains the same)
  const [showBottomPanel, setShowBottomPanel] = useState<boolean>(false);
  const [topPanelHeight, setTopPanelHeight] = useState<number>(65);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dividerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');

  const allPatients = useMemo(() => files.flatMap(f => f.patients), [files]);
  const allImages = useMemo(() => files.flatMap(f => f.fileUrl), [files]);

  // Use selectedDateStr to create the Date object for the filter range/calendar display
  // This is stable and only changes when selectedDateStr changes.
  const selectedDate = useMemo(() => startOfDay(new Date(selectedDateStr)), [selectedDateStr]);

  // This function calculates the unit ID corresponding to a given date and view.
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

  // Primary function to handle ID changes. It only sets state if the ID is new.
  const updateSelectedUnitId = useCallback((newId: string) => {
    setSelectedUnitId(prevId => (newId !== prevId ? newId : prevId));
  }, []);

  // Effect A: **The only synchronization from Date/View to Unit ID.**
  // When selectedDate (from calendar) or activeView changes, update the selectedUnitId.
  useEffect(() => {
    const newId = calculateUnitId(selectedDate, activeView);
    updateSelectedUnitId(newId);
  }, [selectedDate, activeView, calculateUnitId, updateSelectedUnitId]);

  // --- NEW LOGIC FOR UNITS CALCULATION ---
  // 1. Find the date that *corresponds* to the currently selected Unit ID.
  const dateToCenterUnits = useMemo(() => {
    if (!selectedUnitId) return selectedDate;
    
    // Attempt to reconstruct the start date from the selectedUnitId based on activeView
    let date;
    const parts = selectedUnitId.split('-');
    
    try {
        if (activeView === View.DAY) {
            date = new Date(selectedUnitId); // yyyy-MM-dd
        } else if (activeView === View.MONTH) {
            date = new Date(`${selectedUnitId}-01`); // yyyy-MM
        } else if (activeView === View.YEAR) {
            date = new Date(`${selectedUnitId}-01-01`); // yyyy
        } else { // View.WEEK
            // Reconstructing a date from 'yyyy-ww' is complex. 
            // The safest bet is to rely on the previously selected date 
            // since Unit ID is always updated by Effect A on view change.
            // However, to keep the bar centered, we use the selectedDate.
            date = selectedDate; 
        }
        
        // Use a valid date from the ID, otherwise use the selected date as a fallback.
        return date && !isNaN(date.getTime()) ? startOfDay(date) : selectedDate;
    } catch {
        return selectedDate;
    }
  }, [selectedUnitId, activeView, selectedDate]);

  // 2. Generate time units based on active view and the **derived center date**.
  const units = useMemo<TimeUnit[]>(() => {
    let generatedUnits: TimeUnit[] = [];

    const centerDate = dateToCenterUnits; 

    switch (activeView) {
      case View.DAY:
        const startDay = addDays(centerDate, -4);
        for (let i = 0; i < 10; i++) {
          const day = startOfDay(addDays(startDay, i));
          generatedUnits.push({
            id: format(day, 'yyyy-MM-dd'),
            date: day,
            label: dayAbbreviation(day),
            value: format(day, 'd'),
            statusColor: generateStatus(day),
            isToday: isSameDay(day, baseDate),
          });
        }
        break;

      case View.WEEK:
        const startWeek = startOfWeek(addWeeks(centerDate, -4), { weekStartsOn: 1 });
        for (let i = 0; i < 10; i++) {
          const weekStart = startOfWeek(addWeeks(startWeek, i), { weekStartsOn: 1 });
          generatedUnits.push({
            id: format(weekStart, 'yyyy-ww'),
            date: weekStart,
            label: `W${format(weekStart, 'w')}`,
            value: format(weekStart, 'w'),
            statusColor: generateStatus(weekStart),
            isToday: isSameWeek(weekStart, baseDate, { weekStartsOn: 1 }),
          });
        }
        break;

      case View.MONTH:
        const startMonth = startOfMonth(addMonths(centerDate, -4));
        for (let i = 0; i < 10; i++) {
          const month = startOfMonth(addMonths(startMonth, i));
          generatedUnits.push({
            id: format(month, 'yyyy-MM'),
            date: month,
            label: format(month, 'MMM'),
            value: format(month, 'M'),
            statusColor: generateStatus(month),
            isToday: isSameMonth(month, baseDate),
          });
        }
        break;

      case View.YEAR:
        const startYr = startOfYear(addYears(centerDate, -2));
        for (let i = 0; i < 5; i++) {
          const year = startOfYear(addYears(startYr, i));
          generatedUnits.push({
            id: format(year, 'yyyy'),
            date: year,
            label: '',
            value: format(year, 'yyyy'),
            statusColor: generateStatus(year),
            isToday: isSameYear(year, baseDate),
          });
        }
        break;
    }
    return generatedUnits;
  }, [activeView, dateToCenterUnits, baseDate]); 

  const selectedUnit = useMemo(() => {
    return units.find(u => u.id === selectedUnitId) || null;
  }, [units, selectedUnitId]);

  // Effect B: **CRITICAL FIX: This effect is removed.** // The responsibility of syncing `selectedDateStr` now belongs only to the user handlers.

  
  // Date Range Calculation (Remains correct)
  const [startRange, endRange] = useMemo(() => {
    if (!selectedUnit) return [null, null] as [Date | null, Date | null];
    const d = selectedUnit.date;
    
    switch(activeView){
      case View.DAY:
        const dayStart = startOfDay(d); 
        const dayEnd = addDays(dayStart, 1);
        return [dayStart, dayEnd];
      case View.WEEK:
        const weekStart = startOfWeek(d, {weekStartsOn: 1});
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

  // Data Filtering Logic (Remains correct)
  const filteredData = useMemo(() => {
    if (!files.length || !startRange || !endRange) return [];
    
    const filteredFiles = files.filter(f => {
      const created = new Date(f.createdAt); 
      return created >= startRange && created < endRange;
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
  }, [files, startRange, endRange, searchTerm]);

  // Handlers
  const handleUnitClick = useCallback((unitId: string) => {
    // CRITICAL FIX: When unit is clicked, update both ID and Date String.
    setSelectedUnitId(unitId);
    
    // Find the corresponding unit date and set it as the new selected date string
    const clickedUnit = units.find(u => u.id === unitId);
    if (clickedUnit) {
      setSelectedDateStr(format(clickedUnit.date, 'yyyy-MM-dd'));
    }
  }, [units]); // Units must be in dependency array now.

  const handleCalendarSelect = useCallback((date: Date | undefined) => {
    if (date) {
      setSelectedDateStr(format(date, 'yyyy-MM-dd'));
      // Effect A will update selectedUnitId automatically based on this new date.
    }
  }, []);

  // View Change Handler (Remains correct)
  const handleViewChange = useCallback((view: ViewType) => {
    setActiveView(view);
    // Effect A will handle the update of selectedUnitId based on the new view.
  }, []);

  // ... (rest of the component logic and render remains the same)
  // ... (Modal/Panel/Drag logic remains the same)

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

  // --- DRAGGABLE DIVIDER LOGIC ---
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
    <div className="h-screen flex flex-col overflow-hidden font-sans antialiased">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        .font-sans { font-family: 'Inter', sans-serif; }
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-white border-b shadow-sm z-20 flex-shrink-0">
        <div className="flex items-center space-x-2 bg-blue-50 py-2 px-4 rounded-md border border-blue-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <span className="text-blue-700">Bonaberi Health Center</span>
        </div>

        <div className="flex items-center space-x-4 mt-4 md:mt-0 p-2 border rounded-lg bg-white shadow-sm">
          <div className="flex items-center text-sm">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            No Submission (20%)
          </div>
          <div className="flex items-center text-sm">
            <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>
            New Record (40%)
          </div>
          <div className="flex items-center text-sm">
            <div className="w-3 h-3 rounded-full bg-green-200 mr-2"></div>
            Under Review (10%)
          </div>
          <div className="flex items-center text-sm">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            Complete (30%)
          </div>
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
            <div className="p-4 border-b">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 border-b border-t pt-1 pb-1">
                <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 mb-4 md:mb-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-600 whitespace-nowrap">Select Date:</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[240px] justify-start text-left font-normal h-8">
                          <span className="mr-2">{format(selectedDate, 'PPP')}</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={handleCalendarSelect}
                          className="rounded-md border"
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
                        className={`rounded-md px-4 transition-colors duration-200 ${view === activeView && 'bg-green-600 hover:bg-green-500'}`}
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
              
              {/* Date Range Display */}
              {startRange && endRange && (
                <div className="date-range-display text-sm text-gray-600 mt-2 p-2 bg-blue-50 rounded-md border border-blue-200">
                  <strong>Selected Range:</strong> {format(startRange, 'MMM d, yyyy')} 
                  {!isSameDay(startRange, addDays(endRange, -1)) && ` - ${format(addDays(endRange, -1), 'MMM d, yyyy')}`}
                  <span className="ml-3 text-blue-700">({filteredData.length} records)</span>
                </div>
              )}
            </div>
            
            {/* Actions and Table */}
            <div className="p-4">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 mb-4">
                <div className="flex items-center space-x-4">
                  <div className="font-[500] text-lg rounded-md bg-gray-100 p-2">Report</div>
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
                  <Button variant="outline" className="bg-blue-50 text-blue-700 hover:text-white hover:bg-blue-700 shadow-none" onClick={toggleBottomPanel}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M15.536 6.758a1 1 0 00-1.414 0L10 10.879 5.879 6.758a1 1 0 10-1.414 1.414l4.95 4.95a1 1 0 001.414 0l4.95-4.95a1 1 0 000-1.414z" /><path d="M15 14h-5m-5 0h5m-5 3h10a2 2 0 002-2v-3a2 2 0 00-2-2H5a2 2 0 00-2 2v3a2 2 0 002 2z" /></svg>
                    {showBottomPanel ? 'Hide Files' : 'Files'}
                  </Button>
                  <Button className="bg-green-600 text-white hover:bg-green-700 shadow-none">
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
            className="bg-gray-50 p-4 grid grid-cols-2 gap-4 overflow-auto flex-1"
            style={{ height: `${100 - topPanelHeight}%` }}
          >
            {allImages.length > 0 ? (
              allImages.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`File preview ${index + 1}`}
                  className="w-full h-48 object-cover rounded border shadow-md"
                />
              ))
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
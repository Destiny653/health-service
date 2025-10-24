import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, startOfYear, addYears, startOfMonth, addMonths, startOfWeek, addWeeks, addDays, getDay, isSameDay, endOfWeek, endOfMonth, endOfYear, isSameWeek, isSameMonth, isSameYear } from 'date-fns';
import { Patient } from "@/hooks/usePatients";
import { data } from "@/data";
import { DataTable } from "@/components/PatientsTable";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// --- MOCK DATA & CONFIGURATION ---

const View = {
  DAY: 'Day',
  WEEK: 'Week',
  MONTH: 'Month',
  YEAR: 'Year',
} as const;

type ViewType = typeof View[keyof typeof View];

// Color mapping for submission status
const STATUS_COLORS = {
  NEW_RECORD: 'bg-yellow-400',
  UNDER_REVIEW: 'bg-green-200',
  COMPLETE: 'bg-green-500',
  NO_SUBMISSION: 'bg-red-500',
  NO_DATA: 'bg-gray-300',
} as const;

type StatusColor = typeof STATUS_COLORS[keyof typeof STATUS_COLORS];

// Mock function to generate submission status for a given date/unit
const generateStatus = (date: Date): StatusColor => {
  const day = date.getDate();
  const month = date.getMonth();

  if (day === 7 || day === 15) return STATUS_COLORS.NO_SUBMISSION;
  if (day % 3 === 0) return STATUS_COLORS.COMPLETE;
  if (day % 5 === 0) return STATUS_COLORS.UNDER_REVIEW;
  if (day % 2 === 1) return STATUS_COLORS.NEW_RECORD;

  // Use month data for variety in other views
  if (month === 8) return STATUS_COLORS.UNDER_REVIEW;
  if (month === 10) return STATUS_COLORS.COMPLETE;

  return STATUS_COLORS.NO_DATA;
};

// Helper to get day abbreviation
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

// --- Time Unit Item Component ---
const TimeUnitItem = ({ label, value, statusColor, isSelected }: { label: string; value: string; statusColor: StatusColor; isSelected: boolean }) => (
  <div className="flex flex-col items-center relative">
    {/* Label (Day Abbreviation or Year/Month Text) */}
    <div className="text-xs font-semibold text-gray-500 mb-1">
      {label}
    </div>
    {/* Value/Status Indicator Block */}
    <div
      className={`w-8 h-8 p-5 flex items-center justify-center text-sm font-bold text-white rounded-md ${statusColor} shadow-sm`}
    >
      {value}
    </div>
    {/* Selection Indicator */}
    {isSelected && (
      <div className="w-7 h-1 bg-blue-600 rounded-full mt-1 absolute -bottom-2"></div>
    )}
  </div>
);

// Function to fetch patients data
const fetchPatients = async (): Promise<Patient[]> => {
  // Simulate API delay and return the imported data
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, 500);
  });
};


// 🚀 Main Application Component
export default function DataEntriesContent() {
  // Use the real useQuery hook to fetch data
  const {
    data = [],
    isLoading,
    error,
  } = useQuery<Patient[]>({
    queryKey: ["patients"],
    queryFn: fetchPatients,
  });

  // Error handling
  React.useEffect(() => {
    if (error) toast.error("Error fetching patients data");
  }, [error]);

  const baseDate = new Date('2023-06-01');
  const [activeView, setActiveView] = useState<ViewType>(View.DAY);
  const [selectedUnitId, setSelectedUnitId] = useState<string>(format(baseDate, 'yyyy-MM-dd'));
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Generate units based on activeView
  const units = useMemo<TimeUnit[]>(() => {
    let generatedUnits: TimeUnit[] = [];

    switch (activeView) {
      case View.DAY:
        // Show 10 days starting a few days before baseDate
        const startDay = addDays(baseDate, -4);
        for (let i = 0; i < 10; i++) {
          const day = addDays(startDay, i);
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
        // Show 10 weeks starting from a few weeks ago
        const startWeek = startOfWeek(addWeeks(baseDate, -4), { weekStartsOn: 1 }); // Start on Monday
        for (let i = 0; i < 10; i++) {
          const weekStart = addWeeks(startWeek, i);
          generatedUnits.push({
            id: format(weekStart, 'yyyy-ww'),
            date: weekStart,
            label: `W${format(weekStart, 'w')}`,
            value: format(weekStart, 'w'),
            statusColor: generateStatus(weekStart), // Use start date for mock status
            isToday: isSameWeek(weekStart, baseDate, { weekStartsOn: 1 }),
          });
        }
        break;

      case View.MONTH:
        // Show 10 months starting from a few months ago
        const startMonth = startOfMonth(addMonths(baseDate, -4));
        for (let i = 0; i < 10; i++) {
          const month = addMonths(startMonth, i);
          generatedUnits.push({
            id: format(month, 'yyyy-MM'),
            date: month,
            label: format(month, 'MMM'),
            value: format(month, 'M'),
            statusColor: generateStatus(month), // Use start date for mock status
            isToday: isSameMonth(month, baseDate),
          });
        }
        break;

      case View.YEAR:
        // Show 5 years centered around the base year
        const startYr = startOfYear(addYears(baseDate, -2));
        for (let i = 0; i < 5; i++) {
          const year = addYears(startYr, i);
          generatedUnits.push({
            id: format(year, 'yyyy'),
            date: year,
            label: '',
            value: format(year, 'yyyy'),
            statusColor: generateStatus(year), // Use start date for mock status
            isToday: isSameYear(year, baseDate),
          });
        }
        break;
      default:
        break;
    }
    return generatedUnits;
  }, [activeView]);

  // Reset selected unit when view changes
  useEffect(() => {
    let todayId: string;
    switch (activeView) {
      case View.DAY:
        todayId = format(baseDate, 'yyyy-MM-dd');
        break;
      case View.WEEK:
        const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
        todayId = format(weekStart, 'yyyy-ww');
        break;
      case View.MONTH:
        todayId = format(startOfMonth(baseDate), 'yyyy-MM');
        break;
      case View.YEAR:
        todayId = format(baseDate, 'yyyy');
        break;
      default:
        todayId = units[0]?.id || '';
    }
    setSelectedUnitId(todayId);
  }, [activeView, baseDate]);

  const selectedUnit = useMemo(() => units.find(u => u.id === selectedUnitId), [units, selectedUnitId]);

  const [startRange, endRange] = useMemo(() => {
    if (!selectedUnit) return [null, null] as [Date | null, Date | null];
    const d = selectedUnit.date;
    switch(activeView){
      case View.DAY:
        return [d, d];
      case View.WEEK:
        const weekStart = startOfWeek(d, {weekStartsOn: 1});
        const weekEnd = endOfWeek(weekStart, {weekStartsOn: 1});
        return [weekStart, weekEnd];
      case View.MONTH:
        const monthStart = startOfMonth(d);
        const monthEnd = endOfMonth(monthStart);
        return [monthStart, monthEnd];
      case View.YEAR:
        const yearStart = startOfYear(d);
        const yearEnd = endOfYear(yearStart);
        return [yearStart, yearEnd];
      default:
        return [null, null];
    }
  }, [selectedUnit, activeView]);

  const filteredData = useMemo(() => {
    if (!data.length || !startRange || !endRange) return [];
    return data.filter(p => {
      const created = p.createdAt;
      const matchesDate = created >= startRange && created <= endRange;
      const matchesSearch = searchTerm === '' || [
        p.patientName,
        p.case,
        p.sex,
        p.age?.toString(),
        p.maritalStatus,
        p.profession,
        p.residence,
        p.contact,
        p.history
      ].some(field => String(field || '').toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesDate && matchesSearch;
    });
  }, [data, startRange, endRange, searchTerm]);

  const handleUnitClick = (unitId: string) => {
    setSelectedUnitId(unitId);
  };

  const handleViewChange = (view: ViewType) => {
    setActiveView(view);
  };

  // Define columns based on the Patient interface
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
    <div className="min-h-screen bg-white p-4">
      <style>{`
        /* Import Inter font */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        .font-sans { font-family: 'Inter', sans-serif; }
      `}</style>
      <div className="mx-auto space-y-6 font-sans antialiased">
        
        {/* Header: Location and Legend */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          
          {/* Location Badge */}
          <div className="flex items-center space-x-2 bg-blue-50 py-2 px-4 rounded-md border border-blue-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="text-blue-700">Bonaberi Health Center</span>
          </div>

          {/* Legend */}
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

        {/* Time Selector and Units Display */}
        <div className="p-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 border-b border-t pt-1 pb-1">
            
            {/* Time View Buttons (Year, Month, Week, Day) */}
            <div className="flex  p-1 space-x-1 mb-4 md:mb-0 bg-gray-100 rounded-md px-1">
              {Object.values(View).reverse().map((view) => (
                <Button
                  key={view}
                  variant={activeView === view ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleViewChange(view)}
                  className={`rounded-md px-4 ${activeView === view  && 'bg-green-600 hover:bg-green-500'}`}
                >
                  {view}
                </Button>
              ))}
            </div>

            {/* Time Units Display */}
            <div className="flex space-x-3 pb-2">
              <div className="flex space-x-3 bg-gray-100 rounded-md px-1">
                {units.map((unit) => (
                  <button
                    key={unit.id}
                    onClick={() => handleUnitClick(unit.id)}
                    className="focus:outline-none"
                    aria-label={`Select ${activeView} unit: ${unit.value}`}
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
          
          {/* Report/Search/Action Bar (Moved above the table) */}
          <div className="flex flex-col md:flex-row justify-between items-center  space-y-4 md:space-y-0 mb-4">
              <div className="flex items-center space-x-4">
                  <div className="font-[500] text-lg rounded-md bg-gray-100 p-2">Report</div>
                  <Select>
                    <SelectTrigger className="w-[180px] shadow-none outline-none">
                      <SelectValue placeholder="Disease control" />
                    </SelectTrigger>
                    <SelectContent>
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
                  <Button variant="outline" className="bg-blue-50 text-blue-700 hover:text-white hover:bg-blue-700 shadow-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M15.536 6.758a1 1 0 00-1.414 0L10 10.879 5.879 6.758a1 1 0 10-1.414 1.414l4.95 4.95a1 1 0 001.414 0l4.95-4.95a1 1 0 000-1.414z" /><path d="M15 14h-5m-5 0h5m-5 3h10a2 2 0 002-2v-3a2 2 0 00-2-2H5a2 2 0 00-2 2v3a2 2 0 002 2z" /></svg>
                      Files
                  </Button>
                  <Button className="bg-green-600 text-white hover:bg-green-700 shadow-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                      New Record
                  </Button>
              </div>
          </div>
          
          {/* Main Content Area: Data Table */}
            <DataTable data={filteredData} columns={columns} isLoading={isLoading} />
        </div>

      </div>
    </div>
  );
}
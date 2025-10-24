import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, startOfYear, addYears, startOfMonth, addMonths, startOfWeek, addWeeks, addDays, getDay, isSameDay, endOfWeek, endOfMonth, endOfYear, isSameWeek, isSameMonth, isSameYear } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

type AgeGroupData = {
  '0-14': { m: string; f: string };
  '15-24': { m: string; f: string };
  '25-49': { m: string; f: string };
  '60+': { m: string; f: string };
};

interface DiseaseRow {
  id: number;
  name: string;
  isNotifiable: boolean;
  suspected: AgeGroupData;
  deaths: AgeGroupData;
  samples: string;
  confirmed: string;
}

// Mock diseases data
const mockDiseases: DiseaseRow[] = [
  { id: 1, name: "Chikungunya", isNotifiable: true, suspected: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, deaths: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, samples: "", confirmed: "" },
  { id: 2, name: "Cholera", isNotifiable: true, suspected: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, deaths: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, samples: "", confirmed: "" },
  { id: 3, name: "Dengue Fever", isNotifiable: true, suspected: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, deaths: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, samples: "", confirmed: "" },
  { id: 4, name: "Diarrhea with dehydration", isNotifiable: false, suspected: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, deaths: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, samples: "", confirmed: "" },
  { id: 5, name: "Bloody diarrhea", isNotifiable: false, suspected: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, deaths: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, samples: "", confirmed: "" },
  { id: 6, name: "Dracunculiasis (Guinea worm)", isNotifiable: true, suspected: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, deaths: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, samples: "", confirmed: "" },
  { id: 7, name: "Diphteria", isNotifiable: true, suspected: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, deaths: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, samples: "", confirmed: "" },
  { id: 8, name: "Anthrax", isNotifiable: true, suspected: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, deaths: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, samples: "", confirmed: "" },
  { id: 9, name: "Typhoid Fever", isNotifiable: true, suspected: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, deaths: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, samples: "", confirmed: "" },
  { id: 10, name: "Yellow Fever", isNotifiable: true, suspected: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, deaths: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, samples: "", confirmed: "" },
  { id: 11, name: "Meningitis", isNotifiable: true, suspected: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, deaths: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, samples: "", confirmed: "" },
  { id: 12, name: "Dog Bite", isNotifiable: false, suspected: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, deaths: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, samples: "", confirmed: "" },
  { id: 13, name: "Rabies", isNotifiable: true, suspected: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, deaths: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, samples: "", confirmed: "" },
  { id: 14, name: "Snake Bite", isNotifiable: false, suspected: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, deaths: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, samples: "", confirmed: "" },
  { id: 15, name: "Envenimination", isNotifiable: false, suspected: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, deaths: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, samples: "", confirmed: "" },
  { id: 16, name: "Malaria", isNotifiable: false, suspected: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, deaths: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, samples: "", confirmed: "" },
  { id: 17, name: "Acute Flaccid paralysis", isNotifiable: true, suspected: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, deaths: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, samples: "", confirmed: "" },
  { id: 18, name: "Plague", isNotifiable: true, suspected: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, deaths: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, samples: "", confirmed: "" },
  { id: 19, name: "Measles", isNotifiable: true, suspected: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, deaths: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, samples: "", confirmed: "" },
  { id: 20, name: "COVID -19", isNotifiable: true, suspected: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, deaths: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, samples: "", confirmed: "" },
  { id: 21, name: "Flu-like syndrome", isNotifiable: false, suspected: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, deaths: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, samples: "", confirmed: "" },
  { id: 22, name: "Neonatal Tetanus", isNotifiable: true, suspected: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, deaths: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, samples: "", confirmed: "" },
  { id: 23, name: "MPox (Monkey Pox)", isNotifiable: true, suspected: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, deaths: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, samples: "", confirmed: "" },
  { id: 24, name: "Small Pox", isNotifiable: true, suspected: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, deaths: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, samples: "", confirmed: "" },
  { id: 25, name: "Assisted Delivery", isNotifiable: false, suspected: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, deaths: { '0-14': { m: "", f: "" }, '15-24': { m: "", f: "" }, '25-49': { m: "", f: "" }, '60+': { m: "", f: "" } }, samples: "", confirmed: "" },
];

// --- Time Unit Item Component ---
const TimeUnitItem = ({ label, value, statusColor, isSelected }: { label: string; value: string; statusColor: StatusColor; isSelected: boolean }) => (
  <div className="flex flex-col items-center relative">
    <div className="text-xs font-semibold text-gray-500 mb-1">
      {label}
    </div>
    <div
      className={`w-8 h-8 flex items-center justify-center text-sm font-bold text-white rounded-md ${statusColor} shadow-sm`}
    >
      {value}
    </div>
    {isSelected && (
      <div className="w-7 h-1 bg-blue-600 rounded-full mt-1 absolute -bottom-2"></div>
    )}
  </div>
);

// Function to fetch reports data (mock)
const fetchReports = async (): Promise<DiseaseRow[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockDiseases);
    }, 500);
  });
};

// 🚀 Main Application Component
export default function ReportsContent() {
  // Use the real useQuery hook to fetch data
  const {
    data: initialReports = [],
    isLoading,
    error,
  } = useQuery<DiseaseRow[]>({
    queryKey: ["reports"],
    queryFn: fetchReports,
  });

  const [reports, setReports] = useState<DiseaseRow[]>([]);

  // Error handling
  React.useEffect(() => {
    if (error) toast.error("Error fetching reports data");
  }, [error]);

  // Update reports state when data changes
  useEffect(() => {
    if (initialReports) {
      setReports(initialReports);
    }
  }, [initialReports]);

  const baseDate = new Date('2023-06-01');
  const [activeView, setActiveView] = useState<ViewType>(View.DAY);
  const [selectedUnitId, setSelectedUnitId] = useState<string>(format(baseDate, 'yyyy-MM-dd'));

  // Generate units based on activeView
  const units = useMemo<TimeUnit[]>(() => {
    let generatedUnits: TimeUnit[] = [];

    switch (activeView) {
      case View.DAY:
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
        const startWeek = startOfWeek(addWeeks(baseDate, -4), { weekStartsOn: 1 });
        for (let i = 0; i < 10; i++) {
          const weekStart = addWeeks(startWeek, i);
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
        const startMonth = startOfMonth(addMonths(baseDate, -4));
        for (let i = 0; i < 10; i++) {
          const month = addMonths(startMonth, i);
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
        const startYr = startOfYear(addYears(baseDate, -2));
        for (let i = 0; i < 5; i++) {
          const year = addYears(startYr, i);
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

  const filteredReports = useMemo(() => reports, [reports]);

  const handleUnitClick = (unitId: string) => {
    setSelectedUnitId(unitId);
  };

  const handleViewChange = (view: ViewType) => {
    setActiveView(view);
  };

  const updateCell = (rowId: number, section: 'suspected' | 'deaths', ageGroup: keyof AgeGroupData, gender: 'm' | 'f', value: string) => {
    setReports(prev => prev.map(row =>
      row.id === rowId
        ? {
            ...row,
            [section]: {
              ...row[section],
              [ageGroup]: {
                ...row[section][ageGroup],
                [gender]: value
              }
            }
          }
        : row
    ));
  };

  const updateSamples = (rowId: number, value: string) => {
    setReports(prev => prev.map(row => row.id === rowId ? { ...row, samples: value } : row));
  };

  const updateConfirmed = (rowId: number, value: string) => {
    setReports(prev => prev.map(row => row.id === rowId ? { ...row, confirmed: value } : row));
  };

  const [submissionDate, setSubmissionDate] = useState('');
  const [receivedDate, setReceivedDate] = useState('');
  const [name, setName] = useState('');

  return (
    <div className="min-h-screen bg-white p-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        .font-sans { font-family: 'Inter', sans-serif; }
        .disease-table {
          border-collapse: collapse;
          width: 100%;
          min-width: 1200px;
          font-size: 11px;
          font-family: Arial, sans-serif;
          border-right: 1px solid #333;
        }
        .disease-table th, .disease-table td { 
          border: 1px solid #333; 
          padding: 6px 4px; 
          text-align: center; 
        }
        .disease-table th { 
          background-color: #e8e8e8; 
          font-weight: bold; 
        }
        .disease-table .disease-col { 
          text-align: left; 
          min-width: 150px; 
        }
        .disease-table .header-main { 
          background-color: #d0d0d0; 
          font-weight: bold; 
        }
        .disease-table .subheader { 
          background-color: #e8e8e8; 
          font-size: 10px; 
        }
        .disease-table .age-header { 
          font-size: 9px; 
        }
        .disease-table .no-col { 
          width: 30px; 
        }
        .disease-table input { 
          width: 100%; 
          border: none; 
          text-align: center; 
          background: transparent; 
          font-size: 11px; 
        }
        .disease-table input:focus { 
          outline: 1px solid #4CAF50; 
          background-color: #f0f8ff; 
        }
      `}</style>
      <div className="mx-auto space-y-6 font-sans antialiased max-w-7xl">
        
        {/* Header: Location and Legend */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="flex items-center space-x-2 bg-blue-50 py-2 px-4 rounded-md border border-blue-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="text-blue-700">Mbingo Regional Hos</span>
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

        {/* Time Selector and Units Display */}
        <div className="p-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 border-b border-t pt-1 pb-1">
            <div className="flex p-1 space-x-1 mb-4 md:mb-0 bg-gray-100 rounded-md px-1">
              {Object.values(View).reverse().map((view) => (
                <Button
                  key={view}
                  variant={activeView === view ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleViewChange(view)}
                  className={`rounded-md px-4 ${activeView === view && 'bg-green-600 hover:bg-green-500'}`}
                >
                  {view}
                </Button>
              ))}
            </div>

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

          {/* Disease Report Table */}
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="disease-table">
                <thead>
                  <tr>
                    <th rowSpan={3} className="no-col">No</th>
                    <th rowSpan={3} className="disease-col">MALADIES</th>
                    <th colSpan={8} className="header-main">SUSPECTED CASES</th>
                    <th colSpan={8} className="header-main">DEATHS</th>
                    <th rowSpan={3}>Number of sample<br/>Cases</th>
                    <th rowSpan={3}>Confirmed</th>
                  </tr>
                  <tr>
                    <th colSpan={2} className="subheader">0 - 14 ans</th>
                    <th colSpan={2} className="subheader">15 - 24 ans</th>
                    <th colSpan={2} className="subheader">25 - 49 ans</th>
                    <th colSpan={2} className="subheader">60 Et plus</th>
                    <th colSpan={2} className="subheader">0 - 14 ans</th>
                    <th colSpan={2} className="subheader">15 - 24 ans</th>
                    <th colSpan={2} className="subheader">25 - 49 ans</th>
                    <th colSpan={2} className="subheader">60 Et plus</th>
                  </tr>
                  <tr>
                    <th className="age-header">M</th><th className="age-header">F</th>
                    <th className="age-header">M</th><th className="age-header">F</th>
                    <th className="age-header">M</th><th className="age-header">F</th>
                    <th className="age-header">M</th><th className="age-header">F</th>
                    <th className="age-header">M</th><th className="age-header">F</th>
                    <th className="age-header">M</th><th className="age-header">F</th>
                    <th className="age-header">M</th><th className="age-header">F</th>
                    <th className="age-header">M</th><th className="age-header">F</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((row) => (
                    <tr key={row.id}>
                      <td>{row.id.toString().padStart(2, '0')}</td>
                      <td className="disease-col">{row.name}{row.isNotifiable ? ' *' : ''}</td>
                      <td><Input type="text" value={row.suspected['0-14'].m} onChange={(e) => updateCell(row.id, 'suspected', '0-14' as keyof AgeGroupData, 'm', e.target.value)} className="border-none rounded-none shadow-none bg-inherit" /></td>
                      <td><Input type="text" value={row.suspected['0-14'].f} onChange={(e) => updateCell(row.id, 'suspected', '0-14' as keyof AgeGroupData, 'f', e.target.value)} className="border-none rounded-none shadow-none bg-inherit" /></td>
                      <td><Input type="text" value={row.suspected['15-24'].m} onChange={(e) => updateCell(row.id, 'suspected', '15-24' as keyof AgeGroupData, 'm', e.target.value)} className="border-none rounded-none shadow-none bg-inherit" /></td>
                      <td><Input type="text" value={row.suspected['15-24'].f} onChange={(e) => updateCell(row.id, 'suspected', '15-24' as keyof AgeGroupData, 'f', e.target.value)} className="border-none rounded-none shadow-none bg-inherit" /></td>
                      <td><Input type="text" value={row.suspected['25-49'].m} onChange={(e) => updateCell(row.id, 'suspected', '25-49' as keyof AgeGroupData, 'm', e.target.value)} className="border-none rounded-none shadow-none bg-inherit" /></td>
                      <td><Input type="text" value={row.suspected['25-49'].f} onChange={(e) => updateCell(row.id, 'suspected', '25-49' as keyof AgeGroupData, 'f', e.target.value)} className="border-none rounded-none shadow-none bg-inherit" /></td>
                      <td><Input type="text" value={row.suspected['60+'].m} onChange={(e) => updateCell(row.id, 'suspected', '60+' as keyof AgeGroupData, 'm', e.target.value)} className="border-none rounded-none shadow-none bg-inherit" /></td>
                      <td><Input type="text" value={row.suspected['60+'].f} onChange={(e) => updateCell(row.id, 'suspected', '60+' as keyof AgeGroupData, 'f', e.target.value)} className="border-none rounded-none shadow-none bg-inherit" /></td>
                      <td><Input type="text" value={row.deaths['0-14'].m} onChange={(e) => updateCell(row.id, 'deaths', '0-14' as keyof AgeGroupData, 'm', e.target.value)} className="border-none rounded-none shadow-none bg-inherit" /></td>
                      <td><Input type="text" value={row.deaths['0-14'].f} onChange={(e) => updateCell(row.id, 'deaths', '0-14' as keyof AgeGroupData, 'f', e.target.value)} className="border-none rounded-none shadow-none bg-inherit" /></td>
                      <td><Input type="text" value={row.deaths['15-24'].m} onChange={(e) => updateCell(row.id, 'deaths', '15-24' as keyof AgeGroupData, 'm', e.target.value)} className="border-none rounded-none shadow-none bg-inherit" /></td>
                      <td><Input type="text" value={row.deaths['15-24'].f} onChange={(e) => updateCell(row.id, 'deaths', '15-24' as keyof AgeGroupData, 'f', e.target.value)} className="border-none rounded-none shadow-none bg-inherit" /></td>
                      <td><Input type="text" value={row.deaths['25-49'].m} onChange={(e) => updateCell(row.id, 'deaths', '25-49' as keyof AgeGroupData, 'm', e.target.value)} className="border-none rounded-none shadow-none bg-inherit" /></td>
                      <td><Input type="text" value={row.deaths['25-49'].f} onChange={(e) => updateCell(row.id, 'deaths', '25-49' as keyof AgeGroupData, 'f', e.target.value)} className="border-none rounded-none shadow-none bg-inherit" /></td>
                      <td><Input type="text" value={row.deaths['60+'].m} onChange={(e) => updateCell(row.id, 'deaths', '60+' as keyof AgeGroupData, 'm', e.target.value)} className="border-none rounded-none shadow-none bg-inherit" /></td>
                      <td><Input type="text" value={row.deaths['60+'].f} onChange={(e) => updateCell(row.id, 'deaths', '60+' as keyof AgeGroupData, 'f', e.target.value)} className="border-none rounded-none shadow-none bg-inherit" /></td>
                      <td><Input type="text" value={row.samples} onChange={(e) => updateSamples(row.id, e.target.value)} className="border-none rounded-none shadow-none bg-inherit" /></td>
                      <td><Input type="text" value={row.confirmed} onChange={(e) => updateConfirmed(row.id, e.target.value)} className="border-none rounded-none shadow-none bg-inherit" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 space-y-4">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <Input placeholder="Date of submission in the health area" value={submissionDate} onChange={(e) => setSubmissionDate(e.target.value)} className="w-full md:w-64 border-none rounded-none shadow-none bg-inherit" />
              <Input placeholder="Date received" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} className="w-full md:w-64 border-none rounded-none shadow-none bg-inherit" />
              <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full md:w-64 border-none rounded-none shadow-none bg-inherit" />
              <div className="w-full md:w-64">
                <Input placeholder="Signature and Stamp" readOnly className="text-center border-none rounded-none shadow-none bg-inherit" />
              </div>
            </div>
            <div className="text-xs text-gray-500 text-center note">
              * Immediate Notifiable Diseases
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
'use client';

import * as React from "react";
import { useState, useMemo, useEffect } from "react";
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
} from 'date-fns';
import { PatientDataFile, data } from "@/data"; // Import real data + types
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { Check, X, AlertTriangle, Minus, MapPin } from "lucide-react";
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FacilityDetailSheet } from "../FacilityDetailSheet";
import GoogleMapViewer from "@/components/GoogleMapViewer";
import { exportToCSV, exportToExcel, generateExportFilename } from "@/utils/export";
import { DATA_ENTRIES_TAB_ID, DataEntriesId } from "@/utils/data";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface FacilitiesContentProps {
    setActiveTab?: React.Dispatch<React.SetStateAction<string>>;
}

/* ────────────────────── TYPES ────────────────────── */
type SubmissionStatus = PatientDataFile['submissionStatus']; // Use real type!

const View = { DAY: 'DAY', WEEK: 'WEEK', MONTH: 'MONTH', YEAR: 'YEAR' } as const;
type ViewType = keyof typeof View;

const STATUS_CONFIG = {
    "N/A": { label: "All", color: "bg-red-500", icon: X, tooltip: "View all data" },
    confirmed: { label: "Confirmed", color: "bg-green-500", icon: Check, tooltip: "Files successfully confirmed" },
    progress: { label: "In Progress", color: "bg-yellow-400", icon: AlertTriangle, tooltip: "Files currently being reviewed" },
} as const

type StatusKey = keyof typeof STATUS_CONFIG;

const VIEW_CONFIG = {
    YEAR: { tooltip: "View data grouped by year" },
    MONTH: { tooltip: "View data grouped by month" },
    WEEK: { tooltip: "View data grouped by week" },
    DAY: { tooltip: "View data grouped by day" },
} as const

/* ────────────────────── UTILS ────────────────────── */
const getStartOfToday = (): Date => startOfDay(new Date());
const dayAbbreviation = (date: Date): string => ['S', 'M', 'T', 'W', 'T', 'F', 'S'][getDay(date)];

/* ────────────────────── DATE RANGE HELPERS ────────────────────── */
const getUnitStart = (date: Date, view: ViewType): Date => {
    switch (view) {
        case 'DAY': return startOfDay(date);
        case 'WEEK': return startOfWeek(date, { weekStartsOn: 1 });
        case 'MONTH': return startOfMonth(date);
        case 'YEAR': return startOfYear(date);
        default: return date;
    }
};

const getUnitEnd = (start: Date, view: ViewType): Date => {
    switch (view) {
        case 'DAY': return addDays(start, 1);
        case 'WEEK': return addWeeks(start, 1);
        case 'MONTH': return addMonths(start, 1);
        case 'YEAR': return addYears(start, 1);
        default: return addDays(start, 1);
    }
};

/* ────────────────────── STATUS LOGIC (SIMPLIFIED & CLEAN) ────────────────────── */
const getStatusForUnit = (unitDate: Date, files: PatientDataFile[], view: ViewType): StatusKey => {
    const start = getUnitStart(unitDate, view);
    const end = getUnitEnd(start, view);
    const todayStart = getStartOfToday();

    const filesInUnit = files.filter(f => {
        const created = new Date(f.createdAt);
        return created >= start && created < end;
    });

    // Priority: confirmed > progress > pending > N/A
    if (filesInUnit.some(f => f.submissionStatus === 'confirmed')) return 'confirmed';
    if (filesInUnit.some(f => f.submissionStatus === 'progress')) return 'progress';
    return 'N/A';
};

/* ────────────────────── TIME UNIT ITEM ────────────────────── */
const TimeUnitItem = ({ label, value, status, isSelected }: {
    label: string;
    value: string;
    status: StatusKey;
    isSelected: boolean;
}) => {
    const { color, icon: Icon } = STATUS_CONFIG[status];

    return (
        <div className="flex flex-col items-center relative">
            <div className="text-xs font-semibold text-gray-500 mb-1">{label}</div>
            <div className={`w-8 h-8 flex items-center justify-center p-5 px-6 text-sm font-bold text-white rounded-md ${color} shadow-sm transition-all ${isSelected ? 'scale-110 ring-2 ring-blue-500' : 'hover:scale-105'}`}>
                {value}
            </div>
            {isSelected && <div className="w-7 h-1 bg-blue-600 rounded-full mt-1 absolute -bottom-2 animate-pulse"></div>}
        </div>
    );
};

/* ────────────────────── MAIN COMPONENT ────────────────────── */
export default function FacilitiesContent({ setActiveTab }: FacilitiesContentProps) {
    const { data: files = [], isLoading, error } = useQuery<PatientDataFile[]>({
        queryKey: ["files"],
        queryFn: async () => new Promise(resolve => setTimeout(() => resolve(data), 500)),
    });

    useEffect(() => { if (error) toast.error("Error fetching files"); }, [error]);

    const today = getStartOfToday();
    const [activeView, setActiveView] = useState<ViewType>('YEAR');
    const [selectedDate, setSelectedDate] = useState<Date>(today);
    const [selectedUnitId, setSelectedUnitId] = useState<string>(format(today, 'yyyy-MM-dd'));
    const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [_activeTab, _setActiveTab] = useState<'details' | 'map'>('details');
    const [selectedStatus, setSelectedStatus] = useState<SubmissionStatus | null>(null);


    // ALL POSSIBLE UNITS
    const allPossibleUnits = useMemo(() => {
        const center = selectedDate;
        const units: { id: string; date: Date; label: string; value: string; isToday: boolean }[] = [];

        const push = (date: Date, label: string, value: string, id: string) => {
            units.push({
                id,
                date,
                label,
                value,
                isToday: isSameDay(date, new Date())
            });
        };

        if (activeView === 'DAY') {
            const start = addDays(center, -4);
            for (let i = 0; i < 10; i++) {
                const d = addDays(start, i);
                push(d, dayAbbreviation(d), format(d, 'd'), format(d, 'yyyy-MM-dd'));
            }
        } else if (activeView === 'WEEK') {
            const start = addWeeks(center, -4);
            for (let i = 0; i < 10; i++) {
                const w = startOfWeek(addWeeks(start, i), { weekStartsOn: 1 });
                push(w, `W${format(w, 'w')}`, format(w, 'w'), format(w, 'yyyy-ww'));
            }
        } else if (activeView === 'MONTH') {
            const start = addMonths(center, -4);
            for (let i = 0; i < 10; i++) {
                const m = addMonths(start, i);
                push(m, format(m, 'MMM'), format(m, 'M'), format(m, 'yyyy-MM'));
            }
        } else if (activeView === 'YEAR') {
            const start = addYears(center, -2);
            for (let i = 0; i < 5; i++) {
                const y = addYears(start, i);
                push(y, '', format(y, 'yyyy'), format(y, 'yyyy'));
            }
        }
        return units;
    }, [selectedDate, activeView]);

    // UNITS WITH STATUS
    const units = useMemo(() => {
        let filtered = allPossibleUnits.map(unit => ({
            ...unit,
            status: getStatusForUnit(unit.date, files, activeView)
        }));

        // Apply status filter
        if (selectedStatus) {
            filtered = filtered.filter(unit => {
                const start = getUnitStart(unit.date, activeView);
                const end = getUnitEnd(start, activeView);

                if (selectedStatus === 'N/A') {
                    const hasFile = files.some(f => {
                        const created = new Date(f.createdAt);
                        return created >= start && created < end;
                    });
                    return !hasFile && start < getStartOfToday();
                }

                return files.some(f => {
                    const created = new Date(f.createdAt);
                    return f.submissionStatus === selectedStatus && created >= start && created < end;
                });
            });
        }

        if (filtered.length === 0) return allPossibleUnits.map(u => ({ ...u, status: 'pending' as StatusKey }));

        const selectedIndex = filtered.findIndex(u => u.id === selectedUnitId);
        const startIdx = selectedIndex === -1 ? Math.max(0, Math.floor(filtered.length / 2) - 4) : Math.max(0, selectedIndex - 4);
        return filtered.slice(startIdx, startIdx + 10);
    }, [allPossibleUnits, selectedStatus, selectedUnitId, activeView, files]);

    // AUTO-JUMP
    useEffect(() => {
        if (units.length > 0 && !units.some(u => u.id === selectedUnitId)) {
            const first = units[0];
            setSelectedUnitId(first.id);
            setSelectedDate(first.date);
        }
    }, [units, selectedUnitId]);

    // FACILITY ROWS
    const starkRows = useMemo(() => {
        const filteredFiles = selectedStatus
            ? selectedStatus === 'N/A'
                ? files.filter(f => !f.submissionStatus || f.submissionStatus === 'N/A')
                : files.filter(f => f.submissionStatus === selectedStatus)
            : files;

        const map = new Map<string, PatientDataFile[]>();
        filteredFiles.forEach(f => {
            const key = `${f.facilityName}|||${f.address}`;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(f);
        });

        return Array.from(map.entries()).map(([key, facFiles]) => {
            const [name, address] = key.split('|||');
            const statusByUnit = units.map(u => getStatusForUnit(u.date, facFiles, activeView));
            const recordCount = facFiles.reduce((s, f) => s + (f.recordCount ?? 0), 0);

            return {
                id: facFiles[0].id,
                facilityName: name,
                address,
                recordCount,
                statusByUnit,
                details: facFiles[0].facility,
                contacts: facFiles[0].contactPersonnels,
                allFiles: facFiles,
            };
        });
    }, [files, units, selectedStatus, activeView]);

    const handleUnitClick = (id: string) => {
        setSelectedUnitId(id);
        const unit = units.find(u => u.id === id);
        if (unit) setSelectedDate(unit.date);
    };

    const handleCalendarSelect = (date: Date | undefined) => {
        if (date) setSelectedDate(startOfDay(date));
    };

    const handleViewChange = (view: ViewType) => {
        setActiveView(view);
        const aligned = getUnitStart(selectedDate, view);
        setSelectedDate(aligned);
    };

    const selectedFacility = starkRows.find(r => r.id === selectedFacilityId);
    const openSheet = (id: string, tab: 'details' | 'map' = 'details') => {
        setSelectedFacilityId(id);
        _setActiveTab(tab);
        setSheetOpen(true);
    };


    const exportFilename = generateExportFilename("Rail District", activeView, selectedDate, selectedStatus);

    return (
        <div className="flex flex-col h-screen bg-white overflow-hidden">
            {/* HEADER WITH LEGEND */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <Badge variant="secondary" className="flex items-center general-size gap-2 px-3 py-1 text-sm bg-purple-100 text-purple-700">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                    Rail District Area
                </Badge>

                <TooltipProvider>
                    <div className="flex items-center p-2 border rounded-md bg-gray-100 h-12">
                        {(["N/A", "confirmed", "progress"] as const).map((status, index) => {
                            const config = STATUS_CONFIG[status]
                            const count = files.filter((f: any) =>
                                status === "N/A"
                                    ? !f.submissionStatus || f.submissionStatus === "N/A"
                                    : f.submissionStatus === status
                            ).length

                            return (
                                <React.Fragment key={status}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={() => {
                                                    if (config.label === 'All') {
                                                        setSelectedStatus(null);
                                                        localStorage.removeItem('facilities:selectedStatus');
                                                        toast.info('Filter cleared');
                                                    } else {
                                                        setSelectedStatus((s: any) => (s === status ? null : status));
                                                    }
                                                }}
                                                className={`flex items-center text-sm cursor-pointer transition-all duration-200 group relative hover:scale-105 py-2 ${selectedStatus === status ? "bg-white rounded-md p-1" : ""}`}
                                            >
                                                {
                                                    config.label == 'All' ?
                                                        <span className={`${selectedStatus == null && 'bg-white'} px-5 py-2 rounded-md`}>All</span> :
                                                        <>
                                                            <div className={`w-3 h-3 rounded-full ${config.color} p-3 mr-2`} />
                                                            <span
                                                                className={`overflow-hidden transition-all whitespace-nowrap duration-300 ease-in-out ${selectedStatus === status ? "opacity-100 max-w-[100px]" : "group-hover:opacity-100 group-hover:max-w-[100px] opacity-0 max-w-0"
                                                                    }`}
                                                            >
                                                            {config.label}
                                                            </span>
                                                            <span className="ml-1 text-xs text-gray-500">({count})</span>
                                                        </>
                                                }
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="text-sm font-medium">{config.tooltip}</p>
                                        </TooltipContent>
                                    </Tooltip>

                                    {
                                        status !== "progress" && (
                                            <div className="h-8 w-px bg-gray-300 mx-4" />
                                        )
                                    }
                                </React.Fragment>
                            )
                        })}
                    </div>
                </TooltipProvider>
            </div >

            {/* TABLE */}
            < div className="flex-1 overflow-auto p-4" >
                <div className="bg-white overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="px-4 py-3 text-left" colSpan={3}>
                                    <div className="flex items-center space-x-4">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-[180px] justify-start text-left font-normal h-9 shadow-none">
                                                    {format(selectedDate, 'PPP')}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar mode="single" selected={selectedDate} onSelect={handleCalendarSelect} captionLayout="dropdown" className="rounded-md border" />
                                            </PopoverContent>
                                        </Popover>

                                        <TooltipProvider>
                                            <div className="flex p-1 bg-gray-100 rounded-md w-fit">
                                                {(['YEAR', 'MONTH', 'WEEK', 'DAY'] as const).map((v) => (
                                                    <Tooltip key={v}>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant={activeView === v ? "default" : "ghost"}
                                                                size="sm"
                                                                onClick={() => handleViewChange(v)}
                                                                className={`rounded-md ${activeView === v ? 'bg-[#028700] hover:bg-[#028700dc]' : ''}`}
                                                            >
                                                                {v}
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p className="text-sm">{VIEW_CONFIG[v].tooltip}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                ))}
                                            </div>
                                        </TooltipProvider>
                                    </div>
                                </th>
                                {units.map(u => (
                                    <th key={u.id} className="py-3 text-center border  border-b-0 border-t-0">
                                        <button onClick={() => handleUnitClick(u.id)} className="p-1 rounded hover:bg-gray-50 transition">
                                            <TimeUnitItem label={u.label} value={u.value} status={u.status} isSelected={u.id === selectedUnitId} />
                                        </button>
                                    </th>
                                ))}
                            </tr>

                            <tr className="bg-gray-50 general-size">
                                <th className="px-4 py-4 text-left font-medium text-gray-700">ID</th>
                                <th className="px-4 py-4 text-left font-medium text-gray-700">Facility Name</th>
                                <th className="px-4 py-4 text-left font-medium text-gray-700">Address</th>
                                {units.map(u => <th key={u.id} className="py-3 border border-b-0 border-t-0"></th>)}
                            </tr>
                        </thead>

                        <tbody>
                            {starkRows.map(row => (
                                <tr key={row.id} className={`border-b py-4 transition-colors hover:bg-gray-50 general-size ${selectedFacilityId === row.id ? 'bg-blue-50' : ''}`}>
                                    <td className="px-4 py-4 font-medium text-blue-600">{row.id}</td>
                                    <td className="px-4 py-4">
                                        <button onClick={(e) => { e.stopPropagation(); openSheet(row.id, 'details'); }} className="text-left py-3 px-2 rounded-md hover:bg-blue-50">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{row.facilityName}</span>
                                            </div>
                                        </button>
                                    </td>
                                    <td className="px-4 py-4">
                                        <button onClick={(e) => { e.stopPropagation(); openSheet(row.id, 'map'); }} className="text-left py-3 px-2 rounded-md hover:bg-blue-50 flex items-center gap-1 text-blue-600">
                                            <MapPin className="w-4 h-4" />
                                            {row.address}
                                        </button>
                                    </td>

                                    {row.statusByUnit.map((status, idx) => {
                                        const { icon: Icon, color } = STATUS_CONFIG[status];
                                        const unit = units[idx];

                                        const handleStatusClick = () => {
                                            const newStatus = status === selectedStatus ? null : status;
                                            setSelectedStatus(newStatus);

                                            // Save filter
                                            if (newStatus) {
                                                localStorage.setItem('facilities:selectedStatus', newStatus);
                                            } else {
                                                localStorage.removeItem('facilities:selectedStatus');
                                            }

                                            // SWITCH TO DATA ENTRIES TAB
                                            if (setActiveTab) {
                                                setActiveTab(DATA_ENTRIES_TAB_ID);
                                                localStorage.setItem('app:activeTab', DATA_ENTRIES_TAB_ID);
                                            }

                                            // Feedback
                                            toast.success(
                                                newStatus
                                                    ? `${STATUS_CONFIG[newStatus].label} → Switched to Data Entries`
                                                    : 'Filter cleared'
                                            );
                                        };

                                        const isActive = selectedStatus === status;

                                        return (
                                            <td
                                                key={idx}
                                                className="py-3 text-center border border-t-0 cursor-pointer transition-all hover:bg-gray-50"
                                                onClick={handleStatusClick}
                                            >
                                                <div className="flex justify-center">
                                                    <div
                                                        className={`
            relative transition-all duration-200
            ${isActive ? 'scale-125 ring-4 ring-blue-400 ring-opacity-50' : 'scale-100'}
          `}
                                                    >
                                                        <Icon
                                                            className={`
              w-6 h-6 p-1 text-white ${color} rounded-full shadow-md
              ${isActive ? 'animate-pulse' : ''}
              hover:shadow-lg transition-shadow
            `}
                                                        />
                                                        {isActive && (
                                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full animate-ping" />
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {isLoading && <div className="p-8 text-center text-gray-500">Loading facilities...</div>}
                    {!isLoading && starkRows.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            No facilities found for selected filters.
                        </div>
                    )}
                </div>
            </div >

            <FacilityDetailSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                activeTab={_activeTab}
                onTabChange={_setActiveTab}
                facility={selectedFacility ? {
                    id: selectedFacility.id,
                    facilityName: selectedFacility.facilityName,
                    address: selectedFacility.address,
                    details: selectedFacility.details,
                    contacts: selectedFacility.contacts,
                } : undefined}
                mapComponent={selectedFacility && (
                    <GoogleMapViewer
                        address={selectedFacility.address}
                        facilityName={selectedFacility.facilityName}
                        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
                    />
                )}
            />
        </div >
    );
}
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
import { PatientDataFile, data } from "@/data";
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { Check, X, AlertTriangle, Minus, MapPin } from "lucide-react";
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import * as XLSX from "xlsx";
import { FacilityDetailSheet } from "../FacilityDetailSheet";
import GoogleMapViewer from "@/components/GoogleMapViewer";

// IMPORT EXPORT UTILS
import { exportToCSV, exportToExcel, generateExportFilename } from "@/utils/export";

/* ────────────────────── TYPES ────────────────────── */
type SubmissionStatus = 'confirmed' | 'progress' | 'pending' | 'N/A';

const View = { DAY: 'DAY', WEEK: 'WEEK', MONTH: 'MONTH', YEAR: 'YEAR' } as const;
type ViewType = keyof typeof View;

const STATUS_COLORS = {
    GREEN: 'bg-green-500',
    YELLOW: 'bg-yellow-400',
    RED: 'bg-red-500',
    GRAY: 'bg-gray-300',
} as const;
type StatusColor = typeof STATUS_COLORS[keyof typeof STATUS_COLORS];

const IconMap: Record<StatusColor, React.FC<{ className?: string }>> = {
    [STATUS_COLORS.GREEN]: Check,
    [STATUS_COLORS.YELLOW]: AlertTriangle,
    [STATUS_COLORS.RED]: X,
    [STATUS_COLORS.GRAY]: Minus,
};

const ColorMap: Record<StatusColor, string> = {
    [STATUS_COLORS.GREEN]: 'text-white bg-[#028700] rounded-full',
    [STATUS_COLORS.YELLOW]: 'text-white bg-yellow-400 rounded-full',
    [STATUS_COLORS.RED]: 'text-white bg-red-500 rounded-full',
    [STATUS_COLORS.GRAY]: 'text-white bg-gray-300 rounded-full',
};

interface TimeUnit {
    id: string;
    date: Date;
    label: string;
    value: string;
    statusColor: StatusColor;
    isToday: boolean;
}

interface FacilityRow {
    id: string;
    facilityName: string;
    address: string;
    recordCount?: number;
    statusByUnit: StatusColor[];
    details?: any;
    contacts?: any;
    allFiles: PatientDataFile[];
}

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

/* ────────────────────── STATUS LOGIC ────────────────────── */
const generateStatus = (unitDate: Date, files: PatientDataFile[], view: ViewType): StatusColor => {
    const start = getUnitStart(unitDate, view);
    const end = getUnitEnd(start, view);

    const filesInUnit = files.filter(f => {
        const created = new Date(f.createdAt);
        return created >= start && created < end;
    });

    if (filesInUnit.length === 0) {
        return unitDate < getStartOfToday() ? STATUS_COLORS.RED : STATUS_COLORS.GRAY;
    }

    const hasConfirmed = filesInUnit.some(f => f.submissionStatus?.toLowerCase() === 'confirmed');
    const hasProgress = filesInUnit.some(f => f.submissionStatus?.toLowerCase() === 'progress');
    const hasPending = filesInUnit.some(f => f.submissionStatus?.toLowerCase() === 'pending');

    if (hasConfirmed) return STATUS_COLORS.GREEN;
    if (hasProgress) return STATUS_COLORS.YELLOW;
    if (hasPending) return STATUS_COLORS.GRAY;
    return unitDate < getStartOfToday() ? STATUS_COLORS.RED : STATUS_COLORS.GRAY;
};

/* ────────────────────── TIME UNIT ITEM ────────────────────── */
const TimeUnitItem = ({ label, value, statusColor, isSelected }: {
    label: string;
    value: string;
    statusColor: StatusColor;
    isSelected: boolean;
}) => (
    <div className="flex flex-col items-center relative">
        <div className="text-xs font-semibold text-gray-500 mb-1">{label}</div>
        <div className={`w-8 h-8 flex items-center justify-center p-5 text-sm font-bold text-white rounded-md ${statusColor} shadow-sm transition-all ${isSelected ? 'scale-110 ring-2 ring-blue-500' : 'hover:scale-105'}`}>
            {value}
        </div>
        {isSelected && <div className="w-7 h-1 bg-blue-600 rounded-full mt-1 absolute -bottom-2 animate-pulse"></div>}
    </div>
);

/* ────────────────────── MAIN COMPONENT ────────────────────── */
export default function FacilitiesContent() {
    const { data: files = [], isLoading, error } = useQuery<PatientDataFile[]>({
        queryKey: ["files"],
        queryFn: async () => new Promise(resolve => setTimeout(() => resolve(data), 500)),
    });

    useEffect(() => { if (error) toast.error("Error fetching files"); }, [error]);

    const today = getStartOfToday();
    const [activeView, setActiveView] = useState<ViewType>('DAY');
    const [selectedDate, setSelectedDate] = useState<Date>(today);
    const [selectedUnitId, setSelectedUnitId] = useState<string>(format(today, 'yyyy-MM-dd'));
    const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<SubmissionStatus | null>(null);

    // ALL POSSIBLE UNITS
    const allPossibleUnits = useMemo<TimeUnit[]>(() => {
        const center = selectedDate;
        const units: TimeUnit[] = [];

        const push = (date: Date, label: string, value: string, id: string) => {
            units.push({
                id,
                date,
                label,
                value,
                statusColor: generateStatus(date, files, activeView),
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
    }, [selectedDate, activeView, files]);

    // FILTERED UNITS
    const units = useMemo(() => {
        let filtered = allPossibleUnits;

        if (selectedStatus && selectedStatus !== 'N/A') {
            filtered = filtered.filter(unit => {
                const start = getUnitStart(unit.date, activeView);
                const end = getUnitEnd(start, activeView);
                return files.some(f => {
                    const created = new Date(f.createdAt);
                    return f.submissionStatus?.toLowerCase() === selectedStatus && created >= start && created < end;
                });
            });
        } else if (selectedStatus === 'N/A') {
            filtered = filtered.filter(unit => {
                const start = getUnitStart(unit.date, activeView);
                const end = getUnitEnd(start, activeView);
                const hasFile = files.some(f => {
                    const created = new Date(f.createdAt);
                    return created >= start && created < end;
                });
                return !hasFile && start < getStartOfToday();
            });
        }

        if (filtered.length === 0) return allPossibleUnits;

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
    const starkRows = useMemo<FacilityRow[]>(() => {
        const filteredFiles = selectedStatus && selectedStatus !== 'N/A'
            ? files.filter(f => f.submissionStatus?.toLowerCase() === selectedStatus)
            : selectedStatus === 'N/A'
                ? files.filter(f => !f.submissionStatus || f.submissionStatus === 'N/A')
                : files;

        const map = new Map<string, PatientDataFile[]>();
        filteredFiles.forEach(f => {
            const key = `${f.facilityName}|||${f.address}`;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(f);
        });

        return Array.from(map.entries()).map(([key, facFiles]) => {
            const [name, address] = key.split('|||');
            const statusByUnit = units.map(u => generateStatus(u.date, facFiles, activeView));
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

    const openSheet = (id: string) => {
        setSelectedFacilityId(id);
        setSheetOpen(true);
    };

    // EXPORT FILENAME
    const exportFilename = generateExportFilename(
        "Rail District",
        activeView,
        selectedDate,
        selectedStatus
    );

    // COLUMNS FOR EXPORT
    const columns = [
        { accessorKey: "id", header: "ID" },
        { accessorKey: "facilityName", header: "Facility" },
        { accessorKey: "address", header: "Address" },
        { accessorKey: "recordCount", header: "Records" },
    ] as any;

    return (
        <div className="flex flex-col h-screen bg-white overflow-hidden">
            {/* HEADER WITH LEGEND */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1 text-sm bg-purple-100 text-purple-700">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                    Rail District Area
                </Badge>

                {/* EXACT LEGEND FROM YOUR WORKING MODULE */}
                <div className="flex items-center p-2 border rounded-md bg-gray-100 h-12">
                    <button onClick={() => setSelectedStatus(s => s === "N/A" ? null : "N/A")} className={`flex items-center text-sm cursor-pointer transition-all duration-200 hover:scale-105 py-2 ${selectedStatus === "N/A" ? "bg-white rounded-md p-1" : ""}`}>
                        <div className="w-3 h-3 rounded-full bg-red-500 p-3 mr-2" />
                        {selectedStatus === "N/A" && "No Submission"}
                        <span className="ml-1 text-xs text-gray-500">({files.filter(f => !f.submissionStatus || f.submissionStatus === "N/A").length})</span>
                    </button>
                    <div className="h-8 w-px bg-gray-300 mx-4" />
                    <button onClick={() => setSelectedStatus(s => s === "confirmed" ? null : "confirmed")} className={`flex items-center text-sm cursor-pointer transition-all duration-200 hover:scale-105 py-2 ${selectedStatus === "confirmed" ? "bg-white rounded-md p-1" : ""}`}>
                        <div className="w-3 h-3 rounded-full bg-green-500 p-3 mr-2" />
                        {selectedStatus === "confirmed" && "Confirmed"}
                        <span className="ml-1 text-xs text-gray-500">({files.filter(f => f.submissionStatus === "confirmed").length})</span>
                    </button>
                    <div className="h-8 w-px bg-gray-300 mx-4" />
                    <button onClick={() => setSelectedStatus(s => s === "progress" ? null : "progress")} className={`flex items-center text-sm cursor-pointer transition-all duration-200 hover:scale-105 py-2 ${selectedStatus === "progress" ? "bg-white rounded-md p-1" : ""}`}>
                        <div className="w-3 h-3 rounded-full bg-yellow-400 p-3 mr-2" />
                        {selectedStatus === "progress" && "In Progress"}
                        <span className="ml-1 text-xs text-gray-500">({files.filter(f => f.submissionStatus === "progress").length})</span>
                    </button>
                    <div className="h-8 w-px bg-gray-300 mx-4" />
                    <button onClick={() => setSelectedStatus(s => s === "pending" ? null : "pending")} className={`flex items-center text-sm cursor-pointer transition-all duration-200 hover:scale-105 py-2 ${selectedStatus === "pending" ? "bg-white rounded-md p-1" : ""}`}>
                        <div className="w-3 h-3 rounded-full bg-gray-300 p-3 mr-2" />
                        {selectedStatus === "pending" && "Pending"}
                        <span className="ml-1 text-xs text-gray-500">({files.filter(f => f.submissionStatus === "pending").length})</span>
                    </button>
                </div>
            </div>

            {/* TABLE */}
            <div className="flex-1 overflow-auto p-4">
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

                                        <div className="flex p-1 bg-gray-100 rounded-md w-fit">
                                            {(['YEAR', 'MONTH', 'WEEK', 'DAY'] as const).map(v => (
                                                <Button key={v} variant={activeView === v ? "default" : "ghost"} size="sm" onClick={() => handleViewChange(v)}
                                                    className={`rounded-md ${activeView === v ? 'bg-[#028700] hover:bg-[#028700dc]' : ''}`}>
                                                    {v}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </th>
                                {units.map(u => (
                                    <th key={u.id} className="py-3 text-center border border-b-0 border-t-0">
                                        <button onClick={() => handleUnitClick(u.id)} className="p-1 rounded hover:bg-gray-50 transition">
                                            <TimeUnitItem label={u.label} value={u.value} statusColor={u.statusColor} isSelected={u.id === selectedUnitId} />
                                        </button>
                                    </th>
                                ))}
                            </tr>

                            <tr className="bg-gray-50">
                                <th className="px-4 py-3 text-left font-medium text-gray-700">ID</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-700">Facility Name</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-700">Address</th>
                                {units.map(u => <th key={u.id} className="py-3 border border-b-0 border-t-0"></th>)}
                            </tr>
                        </thead>

                        <tbody>
                            {starkRows.map(row => (
                                <tr key={row.id} className={`border-b transition-colors hover:bg-gray-50 ${selectedFacilityId === row.id ? 'bg-blue-50' : ''}`}>
                                    <td className="px-4 py-3 font-medium text-blue-600">{row.id}</td>
                                    <td className="px-4 py-3">
                                        <button onClick={(e) => { e.stopPropagation(); openSheet(row.id); }} className="text-left hover:underline">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{row.facilityName}</span>
                                            </div>
                                        </button>
                                    </td>
                                    <td className="px-4 py-3">
                                        <button onClick={(e) => { e.stopPropagation(); openSheet(row.id); }} className="text-left hover:underline flex items-center gap-1 text-blue-600">
                                            <MapPin className="w-4 h-4" />
                                            {row.address}
                                        </button>
                                    </td>

                                    {row.statusByUnit.map((status, idx) => {
                                        const Icon = IconMap[status];
                                        const color = ColorMap[status];
                                        return (
                                            <td key={idx} className="py-3 text-center border border-t-0">
                                                <div className="flex justify-center">
                                                    <Icon className={`w-6 h-6 p-1 ${color}`} />
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
            </div>

            {/* REMOVED initialTab PROP */}
            <FacilityDetailSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
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
        </div>
    );
}
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

/* ────────────────────── TYPES ────────────────────── */
type SubmissionStatus = 'confirmed' | 'progress' | 'pending' | 'N/A';

const View = { DAY: 'DAY', WEEK: 'WEEK', MONTH: 'MONTH', YEAR: 'YEAR' } as const;
type ViewType = keyof typeof View;

/* ────────────────────── STATUS COLORS ────────────────────── */
const STATUS_COLORS = {
    GREEN: 'bg-green-500',
    YELLOW: 'bg-yellow-400',
    RED: 'bg-red-500',
    GRAY: 'bg-gray-300',
} as const;
type StatusColor = typeof STATUS_COLORS[keyof typeof STATUS_COLORS];

/* ────────────────────── NORMALIZE STATUS (CRITICAL FIX) ────────────────────── */
const normalizeStatus = (status: string | undefined): SubmissionStatus => {
    if (!status) return 'N/A';
    const s = status.toLowerCase().trim();
    if (['confirmed', 'complete', 'yes', 'success', 'done', 'valid', 'approved'].includes(s)) return 'confirmed';
    if (['progress', 'inprogress', 'in progress', 'ongoing', 'working'].includes(s)) return 'progress';
    if (['pending', 'review', 'waiting', 'submitted'].includes(s)) return 'pending';
    return 'N/A';
};

/* ────────────────────── ICON & COLOR MAP (FIXED FOR SVG) ────────────────────── */
const IconMap: Record<StatusColor, React.ElementType> = {
    'bg-green-500': Check,
    'bg-yellow-400': AlertTriangle,
    'bg-red-500': X,
    'bg-gray-300': Minus,
};

const ColorMap: Record<StatusColor, string> = {
    'bg-green-500': 'text-[#028700]',
    'bg-yellow-400': 'text-yellow-600',
    'bg-red-500': 'text-red-600',
    'bg-gray-300': 'text-gray-500',
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

/* ────────────────────── STATUS LOGIC (FIXED) ────────────────────── */
const getStatusForDate = (date: Date, files: PatientDataFile[]): StatusColor => {
    const dayStart = startOfDay(date);
    const dayEnd = addDays(dayStart, 1);

    const filesForDay = files.filter(f => {
        const created = new Date(f.createdAt);
        return created >= dayStart && created < dayEnd;
    });

    if (filesForDay.length === 0) {
        return date < getStartOfToday() ? STATUS_COLORS.RED : STATUS_COLORS.GRAY;
    }

    const hasConfirmed = filesForDay.some(f => normalizeStatus(f.submissionStatus) === 'confirmed');
    const hasProgress = filesForDay.some(f => normalizeStatus(f.submissionStatus) === 'progress');
    const hasPending = filesForDay.some(f => normalizeStatus(f.submissionStatus) === 'pending');

    if (hasConfirmed) return STATUS_COLORS.GREEN;
    if (hasProgress) return STATUS_COLORS.YELLOW;
    if (hasPending) return STATUS_COLORS.GRAY;
    return date < getStartOfToday() ? STATUS_COLORS.RED : STATUS_COLORS.GRAY;
};

const generateStatus = (unitDate: Date, files: PatientDataFile[], view: ViewType): StatusColor => {
    let unitStart: Date, unitEnd: Date;

    switch (view) {
        case 'DAY':
            return getStatusForDate(unitDate, files);
        case 'WEEK':
            unitStart = startOfWeek(unitDate, { weekStartsOn: 1 });
            unitEnd = addWeeks(unitStart, 1);
            break;
        case 'MONTH':
            unitStart = startOfMonth(unitDate);
            unitEnd = addMonths(unitStart, 1);
            break;
        case 'YEAR':
            unitStart = startOfYear(unitDate);
            unitEnd = addYears(unitStart, 1);
            break;
        default:
            unitStart = unitDate;
            unitEnd = addDays(unitDate, 1);
    }

    const filesInUnit = files.filter(f => {
        const created = new Date(f.createdAt);
        return created >= unitStart && created < unitEnd;
    });

    if (filesInUnit.length === 0) {
        return unitDate < getStartOfToday() ? STATUS_COLORS.RED : STATUS_COLORS.GRAY;
    }

    const hasConfirmed = filesInUnit.some(f => normalizeStatus(f.submissionStatus) === 'confirmed');
    const hasProgress = filesInUnit.some(f => normalizeStatus(f.submissionStatus) === 'progress');
    const hasPending = filesInUnit.some(f => normalizeStatus(f.submissionStatus) === 'pending');

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
        <div className={`w-8 h-8 flex items-center justify-center text-sm font-bold text-white rounded-md ${statusColor} shadow-sm transition-all ${isSelected ? 'scale-110 ring-2 ring-blue-500' : 'hover:scale-105'}`}>
            {value}
        </div>
        {isSelected && <div className="w-7 h-1 bg-blue-600 rounded-full mt-1 absolute -bottom-2 animate-pulse"></div>}
    </div>
);

/* ────────────────────── EXPORT FUNCTIONS ────────────────────── */
const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return toast.warning("No data to export");
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => Object.values(row).map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","));
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    toast.success("CSV exported!");
};

const exportToExcel = (data: any[], filename: string) => {
    if (data.length === 0) return toast.warning("No data to export");
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Facilities");
    XLSX.writeFile(wb, `${filename}.xlsx`);
    toast.success("Excel exported!");
};

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
    const [initialTab, setInitialTab] = useState<"details" | "map">("details");
    const [selectedStatus, setSelectedStatus] = useState<SubmissionStatus | null>(null);

    // STATUS COUNTS (FIXED WITH normalizeStatus)
    const statusCounts = useMemo(() => {
        const normalized = files.map(f => normalizeStatus(f.submissionStatus));
        return {
            noSubmission: normalized.filter(s => s === 'N/A').length,
            progress: normalized.filter(s => s === 'progress').length,
            confirmed: normalized.filter(s => s === 'confirmed').length,
            pending: normalized.filter(s => s === 'pending').length,
        };
    }, [files]);

    // ALL UNITS
    const allUnits = useMemo<TimeUnit[]>(() => {
        const center = selectedDate;
        const generated: TimeUnit[] = [];

        const push = (date: Date, label: string, value: string, id: string) => {
            generated.push({
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
        return generated;
    }, [activeView, selectedDate, files]);

    // FILTERED UNITS
    const filteredUnits = useMemo(() => {
        if (!selectedStatus) return allUnits;

        const statusToColor: Record<SubmissionStatus, StatusColor> = {
            'confirmed': STATUS_COLORS.GREEN,
            'progress': STATUS_COLORS.YELLOW,
            'pending': STATUS_COLORS.GRAY,
            'N/A': STATUS_COLORS.RED,
        };

        const target = statusToColor[selectedStatus];
        return allUnits.filter(u => u.statusColor === target);
    }, [allUnits, selectedStatus]);

    const units = filteredUnits;

    // FACILITY ROWS (FIXED FILTERING)
    const starkRows = useMemo<FacilityRow[]>(() => {
        const statusFilteredFiles = !selectedStatus
            ? files
            : files.filter(f => normalizeStatus(f.submissionStatus) === selectedStatus);

        const map = new Map<string, PatientDataFile[]>();
        statusFilteredFiles.forEach(f => {
            const key = `${f.facilityName}|||${f.address}`;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(f);
        });

        return Array.from(map.entries()).map(([key, facFiles]) => {
            const [name, address] = key.split('|||');
            const statusByUnit = units.map(u => getStatusForDate(u.date, facFiles));
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
    }, [files, units, selectedStatus]);

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
    };

    const selectedFacility = useMemo(() =>
        starkRows.find(r => r.id === selectedFacilityId),
        [starkRows, selectedFacilityId]
    );

    const openSheet = (id: string, tab: "details" | "map" = "details") => {
        setSelectedFacilityId(id);
        setInitialTab(tab);
        setSheetOpen(true);
    };

    const exportFilename = `Facilities_RailDistrict_${
        activeView === 'DAY' ? format(selectedDate, 'yyyy-MM-dd') :
        activeView === 'WEEK' ? `Week-${format(selectedDate, 'w-yyyy')}` :
        activeView === 'MONTH' ? format(selectedDate, 'MMM-yyyy') :
        format(selectedDate, 'yyyy')
    }${selectedStatus ? `_${selectedStatus}` : ''}`;

    return (
        <div className="flex flex-col h-screen bg-white overflow-hidden">
            {/* Badge + Legend */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1 text-sm bg-purple-100 text-purple-700">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                    Rail District Area
                </Badge>

                <div className="flex items-center gap-6 text-sm">
                    <button onClick={() => setSelectedStatus(s => s === "N/A" ? null : "N/A")}
                        className={`flex items-center gap-2 hover:scale-105 transition px-2 py-1 rounded-md ${selectedStatus === "N/A" ? "font-bold ring-2 ring-red-400 bg-red-50" : ""}`}>
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        No Submission ({statusCounts.noSubmission})
                    </button>
                    <button onClick={() => setSelectedStatus(s => s === "progress" ? null : "progress")}
                        className={`flex items-center gap-2 hover:scale-105 transition px-2 py-1 rounded-md ${selectedStatus === "progress" ? "font-bold ring-2 ring-yellow-400 bg-yellow-50" : ""}`}>
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        In Progress ({statusCounts.progress})
                    </button>
                    <button onClick={() => setSelectedStatus(s => s === "confirmed" ? null : "confirmed")}
                        className={`flex items-center gap-2 hover:scale-105 transition px-2 py-1 rounded-md ${selectedStatus === "confirmed" ? "font-bold ring-2 ring-green-400 bg-green-50" : ""}`}>
                        <div className="w-3 h-3 rounded-full bg-[#028700]"></div>
                        Confirmed ({statusCounts.confirmed})
                    </button>
                    <button onClick={() => setSelectedStatus(s => s === "pending" ? null : "pending")}
                        className={`flex items-center gap-2 hover:scale-105 transition px-2 py-1 rounded-md ${selectedStatus === "pending" ? "font-bold ring-2 ring-gray-400 bg-gray-50" : ""}`}>
                        <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                        Pending ({statusCounts.pending})
                    </button>

                    <div className="ml-6 flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => exportToCSV(starkRows.map(r => ({ ID: r.id, Facility: r.facilityName, Address: r.address, Records: r.recordCount })), exportFilename)}>
                            CSV
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => exportToExcel(starkRows.map(r => ({ ID: r.id, Facility: r.facilityName, Address: r.address, Records: r.recordCount })), exportFilename)}>
                            Excel
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table */}
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
                                                <Calendar mode="single" selected={selectedDate} onSelect={handleCalendarSelect} className="rounded-md border" captionLayout="dropdown" fromYear={1990} toYear={2030} />
                                            </PopoverContent>
                                        </Popover>

                                        <div className="flex p-1 bg-gray-100 rounded-md w-fit">
                                            {Object.values(View).reverse().map(v => (
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
                            {starkRows.map(row => {
                                const isSelected = selectedFacilityId === row.id;
                                return (
                                    <tr key={row.id} className={`border-b transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                                        <td className="px-4 py-3 font-medium text-blue-600">{row.id}</td>
                                        <td className="px-4 py-3">
                                            <button onClick={(e) => { e.stopPropagation(); openSheet(row.id, "details"); }} className="text-left hover:underline">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{row.facilityName}</span>
                                                    {row.recordCount != null && (
                                                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                                            {row.recordCount} x 19
                                                        </Badge>
                                                    )}
                                                </div>
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button onClick={(e) => { e.stopPropagation(); openSheet(row.id, "map"); }} className="text-left hover:underline flex items-center gap-1 text-blue-600">
                                                <MapPin className="w-4 h-4" />
                                                {row.address}
                                            </button>
                                        </td>

                                        {/* FIXED ICON RENDERING */}
                                        {row.statusByUnit.map((status, idx) => {
                                            const Icon = IconMap[status];
                                            const color = ColorMap[status];
                                            return (
                                                <td key={idx} className="py-3 text-center border border-t-0">
                                                    <div className="flex justify-center">
                                                        <Icon className={`w-6 h-6 ${color}`} />
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {isLoading && <div className="p-8 text-center text-gray-500">Loading facilities...</div>}
                    {!isLoading && starkRows.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            {selectedStatus ? `No facilities with "${selectedStatus}" status in visible timeline.` : 'No facilities found.'}
                        </div>
                    )}
                </div>
            </div>

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
                initialTab={initialTab}
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
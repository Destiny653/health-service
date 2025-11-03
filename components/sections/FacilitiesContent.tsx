'use client';

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
} from 'date-fns';
import { PatientDataFile, data } from "@/data";
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, X, AlertTriangle, Minus, MapPin } from "lucide-react";

/* ────────────────────── CONFIG ────────────────────── */
const View = { DAY: 'Day', WEEK: 'Week', MONTH: 'Month', YEAR: 'Year' } as const;
type ViewType = typeof View[keyof typeof View];

const STATUS_COLORS = {
    GREEN: 'bg-green-500',
    YELLOW: 'bg-yellow-400',
    RED: 'bg-red-500',
    GRAY: 'bg-gray-300',
} as const;
type StatusColor = typeof STATUS_COLORS[keyof typeof STATUS_COLORS];

const isPastDate = (d: Date): boolean => d < startOfDay(new Date());

const generateStatus = (
    unitDate: Date,
    files: PatientDataFile[],
    view: ViewType
): StatusColor => {
    let unitStart: Date, unitEnd: Date;
    switch (view) {
        case View.DAY: unitStart = startOfDay(unitDate); unitEnd = addDays(unitStart, 1); break;
        case View.WEEK: unitStart = startOfWeek(unitDate, { weekStartsOn: 1 }); unitEnd = addWeeks(unitStart, 1); break;
        case View.MONTH: unitStart = startOfMonth(unitDate); unitEnd = addMonths(unitStart, 1); break;
        case View.YEAR: unitStart = startOfYear(unitDate); unitEnd = addYears(unitStart, 1); break;
        default: unitStart = unitDate; unitEnd = addDays(unitDate, 1);
    }

    const filesInUnit = files.filter(f => {
        const created = new Date(f.createdAt);
        return created >= unitStart && created < unitEnd;
    });

    if (filesInUnit.length === 0) return isPastDate(unitDate) ? STATUS_COLORS.RED : STATUS_COLORS.GRAY;

    const worst = filesInUnit.reduce((w, f) => {
        if (w === 'confirmed') return w;
        if (f.submissionStatus === 'confirmed') return w;
        return f.submissionStatus;
    }, filesInUnit[0].submissionStatus);

    switch (worst) {
        case 'confirmed': return STATUS_COLORS.GREEN;
        case 'progress': return STATUS_COLORS.YELLOW;
        case 'pending': return STATUS_COLORS.GRAY;
        default: return isPastDate(unitDate) ? STATUS_COLORS.RED : STATUS_COLORS.GRAY;
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
            className={`w-8 h-8 flex items-center justify-center text-sm font-bold text-white rounded-md ${statusColor} shadow-sm transition-all ${isSelected ? 'scale-110 ring-2 ring-blue-500' : 'hover:scale-105'}`}
        >
            {value}
        </div>
        {isSelected && <div className="w-7 h-1 bg-blue-600 rounded-full mt-1 absolute -bottom-2 animate-pulse"></div>}
    </div>
);

const fetchFiles = async (): Promise<PatientDataFile[]> =>
    new Promise((resolve) => setTimeout(() => resolve(data), 500));

/* ────────────────────── MAIN COMPONENT ────────────────────── */
export default function FacilitiesContent() {
    const { data: files = [], isLoading, error } = useQuery<PatientDataFile[]>({
        queryKey: ["files"],
        queryFn: fetchFiles,
    });

    React.useEffect(() => { if (error) toast.error("Error fetching files data"); }, [error]);

    const baseDate = new Date('2023-06-01');
    const baseDateStr = format(baseDate, 'yyyy-MM-dd');

    const [activeView, setActiveView] = useState<ViewType>(View.DAY);
    const [selectedUnitId, setSelectedUnitId] = useState<string>(baseDateStr);
    const [selectedDateStr, setSelectedDateStr] = useState<string>(baseDateStr);
    const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);

    const selectedDate = useMemo(() => startOfDay(new Date(selectedDateStr)), [selectedDateStr]);

    const calculateUnitId = useCallback((date: Date, view: ViewType): string => {
        switch (view) {
            case View.DAY: return format(date, 'yyyy-MM-dd');
            case View.WEEK: return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-ww');
            case View.MONTH: return format(startOfMonth(date), 'yyyy-MM');
            case View.YEAR: return format(startOfYear(date), 'yyyy');
            default: return '';
        }
    }, []);

    const updateSelectedUnitId = useCallback((newId: string) => {
        setSelectedUnitId(prev => (newId !== prev ? newId : prev));
    }, []);

    useEffect(() => {
        const newId = calculateUnitId(selectedDate, activeView);
        updateSelectedUnitId(newId);
    }, [selectedDate, activeView, calculateUnitId, updateSelectedUnitId]);

    const dateToCenterUnits = useMemo(() => {
        if (!selectedUnitId) return selectedDate;
        let date;
        try {
            if (activeView === View.DAY) date = new Date(selectedUnitId);
            else if (activeView === View.MONTH) date = new Date(`${selectedUnitId}-01`);
            else if (activeView === View.YEAR) date = new Date(`${selectedUnitId}-01-01`);
            else date = selectedDate;
            return date && !isNaN(date.getTime()) ? startOfDay(date) : selectedDate;
        } catch { return selectedDate; }
    }, [selectedUnitId, activeView, selectedDate]);

    const units = useMemo<TimeUnit[]>(() => {
        const generated: TimeUnit[] = [];
        const center = dateToCenterUnits;
        const push = (date: Date, label: string, value: string, id: string) => {
            generated.push({
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
                const start = addDays(center, -4);
                for (let i = 0; i < 10; i++) {
                    const day = startOfDay(addDays(start, i));
                    push(day, dayAbbreviation(day), format(day, 'd'), format(day, 'yyyy-MM-dd'));
                }
                break;
            }
            case View.WEEK: {
                const start = startOfWeek(addWeeks(center, -4), { weekStartsOn: 1 });
                for (let i = 0; i < 10; i++) {
                    const week = startOfWeek(addWeeks(start, i), { weekStartsOn: 1 });
                    push(week, `W${format(week, 'w')}`, format(week, 'w'), format(week, 'yyyy-ww'));
                }
                break;
            }
            case View.MONTH: {
                const start = startOfMonth(addMonths(center, -4));
                for (let i = 0; i < 10; i++) {
                    const month = startOfMonth(addMonths(start, i));
                    push(month, format(month, 'MMM'), format(month, 'M'), format(month, 'yyyy-MM'));
                }
                break;
            }
            case View.YEAR: {
                const start = startOfYear(addYears(center, -2));
                for (let i = 0; i < 5; i++) {
                    const year = startOfYear(addYears(start, i));
                    push(year, '', format(year, 'yyyy'), format(year, 'yyyy'));
                }
                break;
            }
        }
        return generated;
    }, [activeView, dateToCenterUnits, files]);

    const selectedUnit = useMemo(() => units.find(u => u.id === selectedUnitId) || null, [units, selectedUnitId]);

    const [startRange, endRange] = useMemo(() => {
        if (!selectedUnit) return [null, null];
        const d = selectedUnit.date;
        switch (activeView) {
            case View.DAY: return [startOfDay(d), addDays(d, 1)];
            case View.WEEK: return [startOfWeek(d, { weekStartsOn: 1 }), addWeeks(d, 1)];
            case View.MONTH: return [startOfMonth(d), addMonths(d, 1)];
            case View.YEAR: return [startOfYear(d), addYears(d, 1)];
            default: return [null, null];
        }
    }, [selectedUnit, activeView]);

    const handleUnitClick = useCallback((id: string) => {
        setSelectedUnitId(id);
        const unit = units.find(u => u.id === id);
        if (unit) setSelectedDateStr(format(unit.date, 'yyyy-MM-dd'));
    }, [units]);

    const handleViewChange = useCallback((view: ViewType) => setActiveView(view), []);

    /* ──────── Build facility rows based on selected units ──────── */
    interface FacilityRow {
        id: string;
        facilityName: string;
        address: string;
        recordCount?: number;
        statusByUnit: StatusColor[];
    }

    const starkRows = useMemo<FacilityRow[]>(() => {
        const map = new Map<string, PatientDataFile[]>();
        files.forEach(f => {
            const key = `${f.facilityName}|||${f.address}`;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(f);
        });

        return Array.from(map.entries()).map(([key, facFiles]) => {
            const [name, address] = key.split('|||');
            const statusByUnit = units.map(u => generateStatus(u.date, facFiles, View.DAY));
            const id = facFiles[0].id;
            const recordCount = facFiles.reduce((s, f) => s + (f.recordCount ?? 0), 0);
            return { id, facilityName: name, address, recordCount, statusByUnit };
        });
    }, [files, units]);

    /* ──────── Icon & Color Maps ──────── */
    const IconMap: Record<StatusColor, React.FC<{ className?: string }>> = {
        [STATUS_COLORS.GREEN]: Check,
        [STATUS_COLORS.YELLOW]: AlertTriangle,
        [STATUS_COLORS.RED]: X,
        [STATUS_COLORS.GRAY]: Minus,
    };
    const ColorMap: Record<StatusColor, string> = {
        [STATUS_COLORS.GREEN]: 'bg-green-600 text-white rounded-full p-1',
        [STATUS_COLORS.YELLOW]: 'bg-yellow-600 text-white rounded-full p-1',
        [STATUS_COLORS.RED]: 'bg-red-600 text-white rounded-full p-1',
        [STATUS_COLORS.GRAY]: 'bg-gray-400 text-white rounded-full p-1',
    };

    return (
        <div className="flex flex-col h-screen bg-white overflow-hidden">

            {/* ───── Header: Badge + Legend ───── */}
            <div className="flex items-center justify-between p-4 border-b">
                <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1 text-sm bg-purple-100 text-purple-700">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                    Rail District Area
                </Badge>

                <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>No Submission (20%)
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>20%
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>40%
                    </div>
                </div>
            </div>

            {/* ───── Table with integrated view toggle and date filter ───── */}
            <div className="flex-1 overflow-auto  p-4">
                <div className="bg-white overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            {/* First Header Row: View Toggle + Date Filters */}
                            <tr className="border-b">
                                <th className="px-4 py-3 text-left" colSpan={3}>
                                    <div className="flex p-1 bg-gray-100 rounded-md w-fit">
                                        {Object.values(View).reverse().map(v => (
                                            <Button
                                                key={v}
                                                variant={activeView === v ? "default" : "ghost"}
                                                size="sm"
                                                onClick={() => handleViewChange(v)}
                                                className={`rounded-md ${activeView === v ? 'bg-green-700 hover:bg-green-800' : ''}`}
                                            >
                                                {v}
                                            </Button>
                                        ))}
                                    </div>
                                </th>
                                {units.map(u => (
                                    <th key={u.id} className=" py-3 text-center border border-b-0 border-t-0">
                                        <button
                                            onClick={() => handleUnitClick(u.id)}
                                            className="p-1 rounded hover:bg-gray-50 transition"
                                        >
                                            <TimeUnitItem
                                                label={u.label}
                                                value={u.value}
                                                statusColor={u.statusColor}
                                                isSelected={u.id === selectedUnitId}
                                            />
                                        </button>
                                    </th>
                                ))}
                            </tr>

                            {/* Second Header Row: Column Labels */}
                            <tr className="bg-gray-50">
                                <th className="px-4 py-3 text-left font-medium text-gray-700">ID</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-700">Facility Name</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-700">Address</th>
                                {units.map(u => (
                                    <th key={u.id} className=" py-3 border border-b-0 border-t-0"></th>
                                ))}
                            </tr>
                        </thead>

                        {/* Body */}
                        <tbody>
                            {starkRows.map(row => {
                                const isSelected = selectedFacilityId === row.id;
                                return (
                                    <tr
                                        key={row.id}
                                        onClick={() => setSelectedFacilityId(row.id)}
                                        className={`border-b cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                    >
                                        <td className="px-4 py-3 font-medium text-blue-600">{row.id}</td>

                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{row.facilityName}</span>
                                                {row.recordCount != null && (
                                                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                                        {row.recordCount} x 19
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1 text-blue-600">
                                                <MapPin className="w-4 h-4" />
                                                {row.address}
                                            </div>
                                        </td>

                                        {row.statusByUnit.map((status, idx) => {
                                            const Icon = IconMap[status];
                                            const color = ColorMap[status];
                                            return (
                                                <td key={idx} className=" py-3 text-center border border-t-0">
                                                    <span>
                                                        <Icon className={`w-5 h-5 mx-auto ${color}`} />
                                                    </span>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                                <tr>
                                    <td className="px-4 py-3 text-left" colSpan={3}>Supervised By</td>
                                    <td className="py-3 text-center border border-b-0">A</td>
                                    <td className="py-3 text-center border border-b-0">B</td>
                                    <td className="py-3 text-center border border-b-0">C</td>
                                    <td className="py-3 text-center border border-b-0">D</td>
                                </tr>
                        </tbody>
                    </table>

                    {isLoading && (
                        <div className="p-8 text-center text-gray-500">Loading facilities...</div>
                    )}

                    {!isLoading && starkRows.length === 0 && (
                        <div className="p-8 text-center text-gray-500">No facilities found for the selected range.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
"use client";

import { Dispatch, SetStateAction } from "react";
import { MapPin, Users, Search, ChevronDown } from "lucide-react";
import { CalendarPlusIcon, MapPinSimpleAreaIcon, MegaphoneIcon, UsersThreeIcon } from "@phosphor-icons/react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import FieldMap from "@/components/field/FieldMap";

// Sample data - replace with actual data from your API
const CAMPAIGNS = [
    { id: "2354", label: "Campaign #2354" },
    { id: "2355", label: "Campaign #2355" },
    { id: "2356", label: "Polio 2024" },
    { id: "2357", label: "Malaria Prevention" },
    { id: "2358", label: "COVID-19 Vaccination" },
];

const ZONES = [
    { id: "1", label: "Zone 1" },
    { id: "2", label: "Zone 2" },
    { id: "3", label: "Zone 3" },
    { id: "8", label: "Zone 8" },
    { id: "nguele", label: "Nguélie Zone" },
];

const TEAMS = [
    { id: "peter", label: "Team Peter" },
    { id: "123", label: "Team 123" },
    { id: "alpha", label: "Team Alpha" },
    { id: "beta", label: "Team Beta" },
];

const DATE_OPTIONS = [
    { id: "today", label: "Today" },
    { id: "yesterday", label: "Yesterday" },
    { id: "last7days", label: "Last 7 Days" },
    { id: "last30days", label: "Last 30 Days" },
    { id: "thismonth", label: "This Month" },
];

interface SearchableDropdownProps {
    options: { id: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    icon: React.ReactNode;
}

function SearchableDropdown({ options, value, onChange, placeholder, icon }: SearchableDropdownProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const filteredOptions = useMemo(() => {
        if (!search) return options;
        return options.filter(option =>
            option.label.toLowerCase().includes(search.toLowerCase())
        );
    }, [options, search]);

    const selectedLabel = options.find(o => o.id === value)?.label || placeholder;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "flex items-center gap-2 bg-white rounded-sm px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors min-w-[160px]",
                        "border border-gray-100"
                    )}
                >
                    {icon}
                    <span className="text-[#a0a0a0] flex-1 text-left truncate">{selectedLabel}</span>
                    <ChevronDown className="h-4 w-4 text-[#D0BEBE]" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-0" align="start">
                <div className="p-2 border-b border-gray-100">
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-md">
                        <Search className="h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-gray-400"
                        />
                    </div>
                </div>
                <div className="max-h-[200px] overflow-y-auto p-1">
                    {filteredOptions.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500 text-center">No results found</div>
                    ) : (
                        filteredOptions.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => {
                                    onChange(option.id);
                                    setOpen(false);
                                    setSearch("");
                                }}
                                className={cn(
                                    "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                                    value === option.id
                                        ? "bg-green-50 text-green-700 font-medium"
                                        : "hover:bg-gray-100 text-gray-700"
                                )}
                            >
                                {option.label}
                            </button>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

interface LiveProps {
    selectedCampaign: string;
    setSelectedCampaign: Dispatch<SetStateAction<string>>;
    selectedZone: string;
    setSelectedZone: Dispatch<SetStateAction<string>>;
    selectedTeam: string;
    setSelectedTeam: Dispatch<SetStateAction<string>>;
    selectedDate: string;
    setSelectedDate: Dispatch<SetStateAction<string>>;
}

export function Live({
    selectedCampaign,
    setSelectedCampaign,
    selectedZone,
    setSelectedZone,
    selectedTeam,
    setSelectedTeam,
    selectedDate,
    setSelectedDate,
}: LiveProps) {
    return (
        <>
            <div className="flex h-full flex-col relative">
                {/* Top Bar with Dropdowns */}
                <div className="flex items-center justify-between w-full border-gray-200 px-6 py-4 absolute top-4 left-6 z-10">
                    <div className="flex items-center gap-4">
                        <SearchableDropdown
                            options={CAMPAIGNS}
                            value={selectedCampaign}
                            onChange={setSelectedCampaign}
                            placeholder="Select Campaign"
                            icon={<MegaphoneIcon className="h-5 w-5 transform scale-x-[-1] text-[#D0BEBE]" />}
                        />

                        <SearchableDropdown
                            options={ZONES}
                            value={selectedZone}
                            onChange={setSelectedZone}
                            placeholder="Select Zone"
                            icon={<MapPinSimpleAreaIcon className="h-5 w-5 text-[#D0BEBE]" />}
                        />

                        <SearchableDropdown
                            options={TEAMS}
                            value={selectedTeam}
                            onChange={setSelectedTeam}
                            placeholder="Select Team"
                            icon={<UsersThreeIcon className="h-5 w-5 text-[#D0BEBE]" />}
                        />

                        <SearchableDropdown
                            options={DATE_OPTIONS}
                            value={selectedDate}
                            onChange={setSelectedDate}
                            placeholder="Select Date"
                            icon={<CalendarPlusIcon className="h-5 w-5 text-[#D0BEBE]" />}
                        />
                    </div>
                </div>

                {/* Map + Zone Info Panel */}
                <div className="relative flex-1">
                    <FieldMap />

                    {/* Floating Zone Info Card - exactly like in your screenshot */}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="pointer-events-auto w-80 bg-white text-[#D0BEBE] shadow-2xl rounded-sm overflow-hidden">
                            <section className="bg-green-700">
                                <h3 className="mb-3 text-lg font-semibold p-4 text-white">Polio 2024</h3>
                            </section>
                            <section className="p-5">


                                <div className="mb-4 flex items-center gap-2">
                                    <MapPin className="h-5 w-5" />
                                    <span className="font-medium text-gray-700">Nguélie Zone</span>
                                </div>

                                <div className="mb-6 text-sm">
                                    <span>2 sq kilometer Covered</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    <span className="font-medium text-gray-700">Team 123</span>
                                </div>

                                <div className="mt-3 space-y-2 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span>Emmanuel Abanda</span>
                                        <span className="rounded-full bg-green-500 text-white px-3 py-1 text-xs font-medium">TeamLead</span>
                                    </div>
                                    <div>Tercy Peterson</div>
                                    <div>Adangwa Paulson</div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
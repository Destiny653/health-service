"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DataTable } from "../PatientsTable";
import { MagnifyingGlassIcon, PlusIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";

import {
    useCreateFacility,
    useGetFacilities,
} from "./hooks/useFacility";
import { useQueryClient } from "@tanstack/react-query";
import { FacilityPayload } from "./types";
import { UserData } from "@/payload";

export default function Facility() {
    const [searchQuery, setSearchQuery] = useState("");
    const [isFacilitySheetOpen, setIsFacilitySheetOpen] = useState(false);

    // Top dropdown (table view)
    const [parentPopoverOpen, setParentPopoverOpen] = useState(false);
    const [selectedParentId, setSelectedParentId] = useState<string>("");

    // Form dropdown (optional override)
    const [formParentPopoverOpen, setFormParentPopoverOpen] = useState(false);
    const [formSelectedParentId, setFormSelectedParentId] = useState<string | null>(null); // null = use top view

    // Form state
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone1: "",
        phone2: "",
        facility_type: "health_center" as FacilityPayload["facility_type"],
        address: "",
    });

    const [touched, setTouched] = useState<Record<string, boolean>>({});

    // Current user
    const userDataString = localStorage.getItem('userData');
    const personel: UserData = userDataString ? JSON.parse(userDataString) : null;
    const currentUserFacilityId = personel?.facility.id;

    // Set default parent on load
    useEffect(() => {
        if (currentUserFacilityId && !selectedParentId) {
            setSelectedParentId(currentUserFacilityId);
        }
    }, [currentUserFacilityId]);

    // Fetch facilities
    const { data, isLoading: isFetching } = useGetFacilities(selectedParentId);

    const createFacilityMutation = useCreateFacility();
    const queryClient = useQueryClient();

    const handleBlur = (field: string) =>
        setTouched((prev) => ({ ...prev, [field]: true }));

    const errors = {
        name: touched.name && !form.name ? "Facility name is required" : "",
        email: touched.email && !form.email ? "Email is required" : "",
        phone1: touched.phone1 && !form.phone1 ? "At least one phone number is required" : "",
        address: touched.address && !form.address ? "Address is required" : "",
    };

    const hasError = !form.name || !form.email || !form.phone1 || !form.address;

    const handleCreateFacility = async () => {
        setTouched({ name: true, email: true, phone1: true, address: true });

        if (hasError) {
            toast.error("Please fill all required fields");
            return;
        }

        const parentIdToUse = formSelectedParentId || selectedParentId || currentUserFacilityId;

        const payload: FacilityPayload = {
            name: form.name,
            email: [form.email],
            phone: form.phone2 ? [form.phone1, form.phone2] : [form.phone1],
            facility_type: form.facility_type,
            address: form.address,
            parent_id: parentIdToUse,
        };

        createFacilityMutation.mutate(payload, {
            onSuccess: () => {
                toast.success("Facility created successfully!");
                setIsFacilitySheetOpen(false);
                setForm({
                    name: "", email: "", phone1: "", phone2: "",
                    facility_type: "health_center", address: ""
                });
                setFormSelectedParentId(null); // reset override
                setTouched({});
                queryClient.invalidateQueries({ queryKey: ["facilities", selectedParentId] });
            },
            onError: (err: any) => {
                toast.error(err.message || "Failed to create facility");
            },
        });
    };

    // Filtered data
    const filteredFacilities = data?.results?.filter((f: any) =>
        Object.values(f).some((v) =>
            String(v).toLowerCase().includes(searchQuery.toLowerCase())
        )
    ) || [];

    const columns = [
        { accessorKey: "name", header: "Name" },
        { accessorKey: "facility_type", header: "Type" },
        { accessorKey: "address", header: "Address" },
        { accessorKey: "phone", header: "Phone" },
        { accessorKey: "email", header: "Email" },
        { accessorKey: "code", header: "Code" },
    ];

    // Get name for selected parent (top)
    const topParentName = data?.results?.find((f: any) =>
        f._id === selectedParentId || f.id === selectedParentId
    )?.name || "My Facility";

    // Get name for form override
    const formParentName = formSelectedParentId
        ? data?.results?.find((f: any) => f._id === formSelectedParentId || f.id === formSelectedParentId)?.name
        : null;

    return (
        <>
            <Card className="shadow-sm border-none p-6 min-h-[60vh] bg-white rounded-sm">
                <h1 className="text-xl font-bold pb-6">Manage Facilities</h1>
                <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">

                    {/* Dropdown + Reset Button Group */}
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div>
                            <Popover open={parentPopoverOpen} onOpenChange={setParentPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        // Changed py-6 to h-12 for consistent height
                                        className="w-full sm:w-80 justify-between rounded-sm border-gray-300 h-12 px-4 text-left font-medium"
                                    >
                                        <span className="truncate">
                                            {topParentName}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-0">
                                    <Command>
                                        <CommandInput placeholder="Search facility..." />
                                        <CommandList>
                                            <CommandEmpty>No facility found.</CommandEmpty>
                                            <CommandGroup>
                                                {data?.results?.map((facility: any) => (
                                                    <CommandItem
                                                        key={facility._id || facility.id}
                                                        onSelect={() => {
                                                            setSelectedParentId(facility._id || facility.id);
                                                            setParentPopoverOpen(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={`mr-2 h-4 w-4 ${selectedParentId === (facility._id || facility.id)
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                                }`}
                                                        />
                                                        {facility.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {selectedParentId && selectedParentId !== currentUserFacilityId && (
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setSelectedParentId(currentUserFacilityId)}
                                // Added h-12 w-12 to match the dropdown height
                                className="h-12 w-12 shrink-0 border-gray-300 rounded-sm"
                            >
                                X
                            </Button>
                        )}
                    </div>

                    {/* Search Input */}
                    <div className="relative flex-1 w-full max-w-md">
                        <Input
                            type="search"
                            placeholder="Search facilities..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            // Added h-12 to match buttons
                            className="pl-10 h-12 border-gray-300 rounded-sm"
                        />
                        {/* Changed absolute positioning to perfectly center the icon */}
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>

                    {/* Add Facility Button */}
                    <Button
                        onClick={() => setIsFacilitySheetOpen(true)}
                        // Changed py-6 to h-12 for alignment
                        className="bg-[#028700] hover:bg-[#028700dd] rounded-sm h-12 px-6 w-full sm:w-auto"
                    >
                        <PlusIcon className="w-4 h-4 mr-2" /> Add Facility
                    </Button>
                </div>

                <DataTable data={filteredFacilities} columns={columns} isLoading={isFetching} />
            </Card>

            {/* CREATE FACILITY SHEET */}
            <Sheet open={isFacilitySheetOpen} onOpenChange={setIsFacilitySheetOpen}>
                <SheetContent side="right" className="min-w-[40vw] p-0">
                    <SheetHeader className="p-6 border-b">
                        <SheetTitle>Add New Facility</SheetTitle>
                        <p className="text-sm text-gray-600 mt-2">
                            Will be created under:{" "}
                            <strong className="text-[#028700]">
                                {formParentName || topParentName}
                            </strong>
                        </p>
                    </SheetHeader>

                    <div className="p-6 space-y-6 overflow-y-auto">
                        <div className="space-y-1">
                            <Label>Facility Name <span className="text-red-500">*</span></Label>
                            <Input
                                placeholder="Yaoundé Central Hospital"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                onBlur={() => handleBlur('name')}
                                className={`rounded-sm bg-[#F2F7FB] border-[#D9D9D9] border-t-0 border-x-0 border-b-2 py-6 focus:border-[#028700] ${errors.name ? 'border-b-red-500' : ''}`}
                            />
                            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                        </div>

                        {/* Facility Type - NOW SHOWS SELECTED VALUE */}
                        <div className="space-y-1">
                            <Label>Facility Type <span className="text-red-500">*</span></Label>
                            <Select
                                value={form.facility_type}
                                onValueChange={(v) => setForm({ ...form, facility_type: v as any })}
                            >
                                <SelectTrigger className="rounded-sm bg-[#F2F7FB] border-[#D9D9D9] py-6">
                                    <SelectValue placeholder="Select facility type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="health_center">Health Center</SelectItem>
                                    <SelectItem value="health_area">Health Area</SelectItem>
                                    <SelectItem value="district">District Hospital</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Parent Facility - FIXED & SHOWS SELECTION */}
                        <div className="space-y-1">
                            <Label>Parent Facility (Optional)</Label>
                            <Popover open={formParentPopoverOpen} onOpenChange={setFormParentPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className="w-full justify-between rounded-sm bg-[#F2F7FB] border-[#D9D9D9] py-6 px-4 text-left font-normal hover:bg-[#F2F7FB] focus:border-[#028700]"
                                    >
                                        {formParentName || topParentName}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0">
                                    <Command>
                                        <CommandInput placeholder="Search facility..." />
                                        <CommandList>
                                            <CommandEmpty>No facility found.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem
                                                    onSelect={() => {
                                                        setFormSelectedParentId(null);
                                                        setFormParentPopoverOpen(false);
                                                    }}
                                                >
                                                    <Check className={`mr-2 h-4 w-4 ${formSelectedParentId === null ? "opacity-100" : "opacity-0"}`} />
                                                    Use current view: <strong className="ml-2">{topParentName}</strong> (Recommended)
                                                </CommandItem>
                                                <div className="my-1 border-t border-gray-200" />
                                                {data?.results?.map((facility: any) => (
                                                    <CommandItem
                                                        key={facility._id || facility.id}
                                                        onSelect={() => {
                                                            setFormSelectedParentId(facility._id || facility.id);
                                                            setFormParentPopoverOpen(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={`mr-2 h-4 w-4 ${formSelectedParentId === (facility._id || facility.id)
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                                }`}
                                                        />
                                                        {facility.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <p className="text-xs text-gray-500 mt-1">
                                Default: <strong>{topParentName}</strong>
                            </p>
                        </div>

                        {/* Rest of form */}
                        <div className="space-y-1">
                            <Label>Email <span className="text-red-500">*</span></Label>
                            <Input
                                type="email"
                                placeholder="contact@hospital.cm"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                onBlur={() => handleBlur('email')}
                                className={`rounded-sm bg-[#F2F7FB] border-[#D9D9D9] border-t-0 border-x-0 border-b-2 py-6 focus:border-[#028700] ${errors.email ? 'border-b-red-500' : ''}`}
                            />
                            {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>Phone Number <span className="text-red-500">*</span></Label>
                                <Input
                                    placeholder="+237 6XX XXX XXX"
                                    value={form.phone1}
                                    onChange={(e) => setForm({ ...form, phone1: e.target.value })}
                                    onBlur={() => handleBlur('phone1')}
                                    className={`rounded-sm bg-[#F2F7FB] border-[#D9D9D9] border-t-0 border-x-0 border-b-2 py-6 focus:border-[#028700] ${errors.phone1 ? 'border-b-red-500' : ''}`}
                                />
                                {errors.phone1 && <p className="text-red-500 text-sm">{errors.phone1}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label>Phone 2 (optional)</Label>
                                <Input
                                    placeholder="+237 ..."
                                    value={form.phone2}
                                    onChange={(e) => setForm({ ...form, phone2: e.target.value })}
                                    className="rounded-sm bg-[#F2F7FB] border-[#D9D9D9] border-t-0 border-x-0 border-b-2 py-6 focus:border-[#028700]"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label>Address <span className="text-red-500">*</span></Label>
                            <Input
                                placeholder="123 Health Road, Yaoundé"
                                value={form.address}
                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                                onBlur={() => handleBlur('address')}
                                className={`rounded-sm bg-[#F2F7FB] border-[#D9D9D9] border-t-0 border-x-0 border-b-2 py-6 focus:border-[#028700] ${errors.address ? 'border-b-red-500' : ''}`}
                            />
                            {errors.address && <p className="text-red-500 text-sm">{errors.address}</p>}
                        </div>

                        <div className="flex justify-end pt-6">
                            <Button
                                onClick={handleCreateFacility}
                                disabled={createFacilityMutation.isPending || hasError}
                                className="py-6 px-8 bg-[#028700] rounded-sm hover:bg-[#028700dd]"
                            >
                                {createFacilityMutation.isPending ? "Creating..." : "Create Facility"}
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
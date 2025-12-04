"use client";

import * as React from "react";
import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    flexRender,
    ColumnDef,
    VisibilityState,
} from "@tanstack/react-table";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, Loader2, Settings, Search, Plus, MapPin, X, Upload } from "lucide-react";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

// Types
interface Zone {
    id: number;
    teamLead: string;
    members: number;
    activeCampaign: string;
    location: string;
}

// Sample data matching the screenshot
const ZONES_DATA: Zone[] = [
    { id: 1, teamLead: "Theresia Mbah", members: 3, activeCampaign: "Polio 2024", location: "Grand hanga" },
    { id: 2, teamLead: "Peters Nze", members: 3, activeCampaign: "Polio 2024", location: "Grand hanga" },
    { id: 2, teamLead: "Ayissi Bi Paul", members: 2, activeCampaign: "VIT A 2025", location: "Grand hanga" },
    { id: 2, teamLead: "Ebeneza Ndoki", members: 2, activeCampaign: "VIT A 2025", location: "Grand hanga" },
    { id: 1, teamLead: "Pierre Kwemo", members: 3, activeCampaign: "VIT A 2025", location: "Grand hanga" },
    { id: 2, teamLead: "Chalefac Theodore", members: 3, activeCampaign: "VIT A 2025", location: "Grand hanga" },
    { id: 1, teamLead: "Kuma  Theodore", members: 3, activeCampaign: "VIT A 2025", location: "Grand hanga" },
];

// Location badge component
function LocationBadge({ location }: { location: string }) {
    return (
        <div className="flex items-center gap-1.5 text-blue-600">
            <MapPin className="h-4 w-4" />
            <span className="text-sm font-medium">{location}</span>
        </div>
    );
}

// Column definitions
const columns: ColumnDef<Zone>[] = [
    {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => <span className="text-gray-700">{row.getValue("id")}</span>,
    },
    {
        accessorKey: "teamLead",
        header: "Team Lead",
        cell: ({ row }) => <span className="text-gray-700">{row.getValue("teamLead")}</span>,
    },
    {
        accessorKey: "members",
        header: "Members",
        cell: ({ row }) => (
            <span className="text-gray-700">
                {String(row.getValue("members")).padStart(2, "0")}
            </span>
        ),
    },
    {
        accessorKey: "activeCampaign",
        header: "Active Campaign",
        cell: ({ row }) => <span className="text-gray-700">{row.getValue("activeCampaign")}</span>,
    },
    {
        accessorKey: "location",
        header: "Location",
        cell: ({ row }) => <LocationBadge location={row.getValue("location")} />,
    },
];

export function Zones() {
    const [searchQuery, setSearchQuery] = React.useState("");
    const [isLoading] = React.useState(false);
    const [pageIndex, setPageIndex] = React.useState(0);
    const pageSize = 10;

    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

    // Slide-in panel states
    const [isPanelOpen, setIsPanelOpen] = React.useState(false);

    // Form states
    const [zoneName, setZoneName] = React.useState("");
    const [zoneId, setZoneId] = React.useState("");
    const [shapeFile, setShapeFile] = React.useState<File | null>(null);
    const [errors, setErrors] = React.useState({
        zoneName: false,
        zoneId: false,
        shapeFile: false,
    });

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type (kml or geojson)
            const validExtensions = ['.kml', '.geojson', '.json'];
            const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

            if (validExtensions.includes(fileExtension)) {
                setShapeFile(file);
                setErrors(prev => ({ ...prev, shapeFile: false }));
            } else {
                setErrors(prev => ({ ...prev, shapeFile: true }));
                alert('Only kml or Geojson is supported');
            }
        }
    };

    const handleSave = () => {
        // Validate fields
        const newErrors = {
            zoneName: !zoneName,
            zoneId: !zoneId,
            shapeFile: !shapeFile,
        };

        setErrors(newErrors);

        // Check if any errors
        if (Object.values(newErrors).some(error => error)) {
            return;
        }

        // Handle save logic here
        console.log("Saving zone...", {
            zoneName,
            zoneId,
            shapeFile,
        });

        // Reset form and close panel
        setZoneName("");
        setZoneId("");
        setShapeFile(null);
        setIsPanelOpen(false);
    };

    // Filter data based on search
    const filteredData = React.useMemo(() => {
        if (!searchQuery) return ZONES_DATA;
        const query = searchQuery.toLowerCase();
        return ZONES_DATA.filter(
            (zone) =>
                zone.teamLead.toLowerCase().includes(query) ||
                zone.activeCampaign.toLowerCase().includes(query) ||
                zone.location.toLowerCase().includes(query)
        );
    }, [searchQuery]);

    const table = useReactTable({
        data: filteredData,
        columns,
        state: {
            pagination: { pageIndex, pageSize },
            columnVisibility,
        },
        onPaginationChange: (updater) => {
            if (typeof updater === "function") {
                const newPagination = updater({ pageIndex, pageSize });
                setPageIndex(newPagination.pageIndex);
            }
        },
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    const totalPages = table.getPageCount();

    return (
        <>
            <div className="flex flex-col h-full p-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Zones</h1>
                </div>

                {/* Search and Actions Bar */}
                <div className="flex items-center justify-between mb-6">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search Zones"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-white border-gray-200 rounded-sm"
                        />
                    </div>
                    <Button
                        onClick={() => setIsPanelOpen(true)}
                        className="bg-green-600 hover:bg-green-700 py-6 rounded-sm text-white"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        New zone
                    </Button>
                </div>

                {/* Table */}
                <Card className="w-full bg-white shadow-sm rounded-lg border border-gray-100 flex-1">
                    <CardContent className="overflow-x-auto p-0">
                        {isLoading ? (
                            <div className="flex justify-center items-center py-20">
                                <Loader2 className="animate-spin text-green-600" size={32} />
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <tr key={headerGroup.id}>
                                            {headerGroup.headers.map((header) => (
                                                <th
                                                    key={header.id}
                                                    className="text-left px-6 py-4 text-sm font-medium text-gray-600 whitespace-nowrap"
                                                >
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(header.column.columnDef.header, header.getContext())}
                                                </th>
                                            ))}
                                            <th className="w-12">
                                                <div className="flex justify-end px-4">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <Settings className="h-4 w-4 text-gray-500" />
                                                                <span className="sr-only">Toggle columns</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-56">
                                                            <DropdownMenuLabel className="flex items-center justify-between">
                                                                <span>Visible Columns</span>
                                                                <ChevronDown className="h-4 w-4 opacity-50" />
                                                            </DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <div className="py-1">
                                                                {table.getAllColumns().map((column) => {
                                                                    if (!column.getCanHide()) return null;
                                                                    const header = String(column.columnDef.header ?? column.id);
                                                                    const isVisible = column.getIsVisible();

                                                                    return (
                                                                        <div
                                                                            key={column.id}
                                                                            className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer"
                                                                            onClick={() => column.toggleVisibility()}
                                                                        >
                                                                            <span className="text-sm font-medium capitalize">
                                                                                {header}
                                                                            </span>
                                                                            <div
                                                                                className={cn(
                                                                                    "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                                                                                    isVisible ? "bg-green-600" : "bg-gray-300"
                                                                                )}
                                                                            >
                                                                                <span
                                                                                    className={cn(
                                                                                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                                                                        isVisible ? "translate-x-4" : "translate-x-0.5"
                                                                                    )}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </th>
                                        </tr>
                                    ))}
                                </thead>
                                <tbody>
                                    {table.getRowModel().rows.map((row) => (
                                        <tr
                                            key={row.id}
                                            className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <td
                                                    key={cell.id}
                                                    className="px-6 py-4 whitespace-nowrap"
                                                >
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </td>
                                            ))}
                                            <td />
                                        </tr>
                                    ))}
                                    {table.getRowModel().rows.length === 0 && (
                                        <tr>
                                            <td colSpan={columns.length + 1} className="text-center py-10 text-gray-500">
                                                No zones found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center py-4 border-t border-gray-100">
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    table.previousPage();
                                                }}
                                                className={cn(!table.getCanPreviousPage() && "opacity-50 cursor-not-allowed")}
                                            />
                                        </PaginationItem>

                                        {Array.from({ length: totalPages }, (_, i) => (
                                            <PaginationItem key={i}>
                                                <PaginationLink
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        table.setPageIndex(i);
                                                    }}
                                                    isActive={i === pageIndex}
                                                >
                                                    {i + 1}
                                                </PaginationLink>
                                            </PaginationItem>
                                        ))}

                                        <PaginationItem>
                                            <PaginationNext
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    table.nextPage();
                                                }}
                                                className={cn(!table.getCanNextPage() && "opacity-50 cursor-not-allowed")}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Sheet Modal */}
            <Sheet open={isPanelOpen} onOpenChange={setIsPanelOpen}>
                <SheetContent className="w-[70vw] sm:max-w-none p-0">
                    {/* Header with tabs */}
                    <div className="relative flex border-b gap-[14vw]">
                        {/* Title */}
                        <SheetHeader className="px-6 py-4 border-gray-200">
                            <SheetTitle className="text-lg font-semibold text-gray-900">New Team</SheetTitle>
                        </SheetHeader>

                        <div className="flex items-center gap-0 border-gray-200 max-w-[40vw]">
                            {/* Details Tab */}
                            <div className="relative">
                                <button
                                    className="px-10 py-4 font-medium relative w-[200px] left-6 bg-green-700 text-white"
                                    style={{
                                        clipPath: "polygon(0% 0%, 75% 0%, 100% 50%, 75% 100%, 0% 100%)"
                                    }}
                                >
                                    Details
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 h-[calc(100vh-200px)] max-w-[800px] mx-auto overflow-y-auto animate-in fade-in duration-300 slide-in-from-right-5">
                        <div className="space-y-6 animate-in fade-in duration-300 slide-in-from-right-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Zone  Name
                                </label>
                                <Input
                                    value={zoneName}
                                    onChange={(e) => {
                                        setZoneName(e.target.value);
                                        setErrors(prev => ({ ...prev, zoneName: false }));
                                    }}
                                    placeholder="Douala 44"
                                    className={cn(
                                        "rounded-none shadow-none py-6 px-5 border-b-2 border-x-0 border-t-0 bg-blue-50 focus-visible:ring-0",
                                        errors.zoneName
                                            ? "border-b-red-500 focus:border-b-red-500"
                                            : "border-b-gray-300 focus:border-b-[#04b301]"
                                    )}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Zone ID
                                </label>
                                <Input
                                    value={zoneId}
                                    onChange={(e) => {
                                        setZoneId(e.target.value);
                                        setErrors(prev => ({ ...prev, zoneId: false }));
                                    }}
                                    placeholder="00254"
                                    className={cn(
                                        "rounded-none shadow-none py-6 px-5 border-b-2 border-x-0 border-t-0 bg-blue-50 focus-visible:ring-0",
                                        errors.zoneId
                                            ? "border-b-red-500 focus:border-b-red-500"
                                            : "border-b-gray-300 focus:border-b-[#04b301]"
                                    )}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Shape File (Zone bounderies)
                                </label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className={cn(
                                        "rounded-none shadow-none py-12 px-5 border-b-2 border-x-0 border-t-0 bg-gray-50 cursor-pointer",
                                        "flex flex-col items-center justify-center gap-3",
                                        errors.shapeFile
                                            ? "border-b-red-500"
                                            : "border-b-gray-300 hover:border-b-[#04b301]"
                                    )}
                                >
                                    <Upload className="h-8 w-8 text-gray-400" />
                                    {shapeFile ? (
                                        <p className="text-sm text-gray-700">{shapeFile.name}</p>
                                    ) : (
                                        <p className="text-sm text-gray-500">Click to upload file</p>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".kml,.geojson,.json"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <p className="text-xs text-gray-500 mt-2 italic">Only kml or Geojson is supported</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer with Save button */}
                    <div className="absolute bottom-0 right-0 left-0 p-6 border-t border-gray-200 bg-white">
                        <div className="flex justify-end">
                            <Button
                                onClick={handleSave}
                                className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 rounded-sm"
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}

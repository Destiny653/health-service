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
import { ChevronDown, Loader2, Settings, Search, Plus, PauseCircle, CheckCircle, XCircle, PlayCircle } from "lucide-react";
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

// Types
type CampaignStatus = "live" | "complete" | "paused" | "cancelled";

interface Campaign {
    id: number;
    activeCampaign: string;
    campaignManager: string;
    members: number;
    progress: number;
    status: CampaignStatus;
}

// Sample data matching the screenshot
const CAMPAIGNS_DATA: Campaign[] = [
    { id: 1, activeCampaign: "Polio 2024", campaignManager: "Theresia Mbah", members: 3, progress: 20, status: "live" },
    { id: 2, activeCampaign: "Polio 2024", campaignManager: "Peters Nze", members: 3, progress: 55, status: "live" },
    { id: 2, activeCampaign: "VIT A 2025", campaignManager: "Ayissi Bi Paul", members: 2, progress: 60, status: "live" },
    { id: 2, activeCampaign: "VIT A 2025", campaignManager: "Ebeneza Ndoki", members: 2, progress: 85, status: "live" },
    { id: 1, activeCampaign: "VIT A 2025", campaignManager: "Pierre Kwemo", members: 3, progress: 100, status: "complete" },
    { id: 2, activeCampaign: "VIT A 2025", campaignManager: "Chalefac Theodore", members: 3, progress: 45, status: "paused" },
    { id: 1, activeCampaign: "VIT A 2025", campaignManager: "Kuma  Theodore", members: 3, progress: 75, status: "cancelled" },
];

// Status indicator component
function StatusBadge({ status }: { status: CampaignStatus }) {
    const config = {
        live: { icon: PlayCircle, label: "Live", className: "text-green-600" },
        complete: { icon: CheckCircle, label: "complete", className: "text-gray-600" },
        paused: { icon: PauseCircle, label: "Paused", className: "text-gray-500" },
        cancelled: { icon: XCircle, label: "Cancelled", className: "text-red-600" },
    };

    const { icon: Icon, label, className } = config[status];

    return (
        <div className={cn("flex items-center gap-1.5", className)}>
            <Icon className="h-4 w-4" />
            <span className="text-sm font-medium">{label}</span>
        </div>
    );
}

// Progress bar component
function ProgressBar({ progress, status }: { progress: number; status: CampaignStatus }) {
    const getBarColor = () => {
        if (status === "cancelled") return "bg-[#FF0000]";
        if (status === "paused") return "bg-gray-400";
        if (progress < 40) return "bg-[#FF0000]";
        if (progress < 70) return "bg-yellow-400";
        return "bg-[#028700]";
    };

    return (
        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
                className={cn("h-full rounded-full transition-all duration-300", getBarColor())}
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}

// Column definitions
const columns: ColumnDef<Campaign>[] = [
    {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => <span className="text-gray-700">{row.getValue("id")}</span>,
    },
    {
        accessorKey: "activeCampaign",
        header: "Active Campaign",
        cell: ({ row }) => <span className="text-gray-700">{row.getValue("activeCampaign")}</span>,
    },
    {
        accessorKey: "campaignManager",
        header: "Campaign Manager",
        cell: ({ row }) => <span className="text-gray-700">{row.getValue("campaignManager")}</span>,
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
        accessorKey: "progress",
        header: "Progress",
        cell: ({ row }) => (
            <ProgressBar
                progress={row.getValue("progress")}
                status={row.original.status}
            />
        ),
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    },
];

export function Campaigns() {
    const [searchQuery, setSearchQuery] = React.useState("");
    const [isLoading] = React.useState(false);
    const [pageIndex, setPageIndex] = React.useState(0);
    const pageSize = 10;

    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

    // Filter data based on search
    const filteredData = React.useMemo(() => {
        if (!searchQuery) return CAMPAIGNS_DATA;
        const query = searchQuery.toLowerCase();
        return CAMPAIGNS_DATA.filter(
            (campaign) =>
                campaign.activeCampaign.toLowerCase().includes(query) ||
                campaign.campaignManager.toLowerCase().includes(query) ||
                campaign.status.toLowerCase().includes(query)
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
        <div className="flex flex-col h-full p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
            </div>

            {/* Search and Actions Bar */}
            <div className="flex items-center justify-between mb-6">
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search Campaigns"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white border-gray-200 rounded-sm"
                    />
                </div>
                <Button className="bg-green-600 hover:bg-green-700 py-6 rounded-sm text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    New Campaign
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
                                            No campaigns found
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
    );
}

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
import { ChevronDown, Loader2, Settings } from "lucide-react";
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
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/* --------------------------------------------------------------- */
/*  1. DataTable – Safe localStorage Access                        */
/* --------------------------------------------------------------- */
export function DataTable<
  TData,
  TMeta extends Record<string, unknown> = never
>({
  data,
  columns: initialColumns,
  isLoading,
  onRowClick,
}: {
  data: TData[];
  columns: ColumnDef<TData, TMeta>[];
  isLoading?: boolean;
  onRowClick?: (row: TData) => void;
}) {
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize] = React.useState(8);

  /* ---------- SAFE localStorage: Only access in browser ---------- */
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(() => {
    if (typeof window === "undefined") {
      // SSR → return default (hide after 10th)
      const hidden: VisibilityState = {};
      initialColumns.forEach((col, idx) => {
        if (col.id && idx >= 10) hidden[col.id] = false;
      });
      return hidden;
    }

    // Client → safe to use localStorage
    try {
      const saved = localStorage.getItem("table-column-visibility");
      if (saved) return JSON.parse(saved) as VisibilityState;
    } catch (e) {
      console.warn("Failed to parse saved column visibility", e);
    }

    // Fallback: hide after 10th column
    const hidden: VisibilityState = {};
    initialColumns.forEach((col, idx) => {
      if (col.id && idx >= 10) hidden[col.id] = false;
    });
    return hidden;
  });

  // Save to localStorage (only in browser)
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("table-column-visibility", JSON.stringify(columnVisibility));
      } catch (e) {
        console.warn("Failed to save column visibility", e);
      }
    }
  }, [columnVisibility]);

  const table = useReactTable({
    data,
    columns: initialColumns,
    state: {
      pagination: { pageIndex, pageSize },
      columnVisibility,
    },
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        setPageIndex((old) =>
          updater({ pageIndex: old, pageSize }).pageIndex
        );
      } else {
        setPageIndex(updater.pageIndex);
      }
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
  });

  const totalPages = table.getPageCount();

  return (
    <Card className="w-full bg-inherit mx-auto shadow-none rounded-md border-none p-0 m-0">
      <CardContent className="overflow-x-auto p-0">
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : (
          <div className="relative">
            {/* Gear Icon – Toggle Columns */}


            {/* Table */}
            <table className="border-none w-full border-gray-200 text-sm overflow-auto">
              <thead className="bg-gray-50">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((h) => (
                      <th
                        key={h.id}
                        className="text-left px-4 py-2 border-b border-gray-50 general-size font-[500] whitespace-nowrap"
                      >
                        {h.isPlaceholder
                          ? null
                          : flexRender(
                            h.column.columnDef.header,
                            h.getContext()
                          )}
                      </th>
                    ))}
                    <th className="abolute">
                      <div className="flex justify-end p-2 relative right-0 -top-[7px]">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Settings className="h-4 w-4" />
                              <span className="sr-only">Toggle columns</span>
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end" className="w-64 max-h-96 overflow-y-auto">
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
                                    className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
                                    onClick={() => column.toggleVisibility()}
                                  >
                                    <span className="text-sm font-medium capitalize truncate max-w-[180px]">
                                      {header}
                                    </span>

                                    {/* Custom Toggle Switch */}
                                    <div
                                      className={cn(
                                        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                                        isVisible ? "bg-blue-600" : "bg-gray-300"
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
                    className="hover:bg-gray-50 transition-colors general-size font-[500] text-[#424242] cursor-pointer"
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-2 border-b border-gray-50 whitespace-nowrap overflow-hidden text-ellipsis max-w-[250px]"
                      >
                        {(() => {
                          const raw =
                            typeof cell.getValue === "function" ? cell.getValue() : undefined;
                          const rendered = flexRender(cell.column.columnDef.cell, cell.getContext());

                          if (Array.isArray(raw)) {
                            const text = raw.join(", ");
                            const isTrimmed = text.length > 14;
                            const displayText = isTrimmed ? `${text.slice(0, 20)}...` : text;

                            return (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-pointer">{displayText}</span>
                                  </TooltipTrigger>
                                  {isTrimmed && (
                                    <TooltipContent className="max-w-sm p-3 bg-white shadow-lg border rounded-md text-sm font-[500] text-gray-800">
                                      {text}
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>
                            );
                          }

                          // Handle plain strings as before
                          if (typeof raw === "string") {
                            const isTrimmed = raw.length > 14;
                            const displayText = isTrimmed ? `${raw.slice(0, 20)}...` : raw;

                            return (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-pointer">{displayText}</span>
                                  </TooltipTrigger>
                                  {isTrimmed && (
                                    <TooltipContent className="max-w-sm p-3 bg-white shadow-lg border rounded-md text-sm font-[500] text-gray-800">
                                      {raw}
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>
                            );
                          }

                          return rendered;
                        })()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex justify-center mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    table.previousPage();
                  }}
                  className={cn(
                    !table.getCanPreviousPage() &&
                    "opacity-50 cursor-not-allowed"
                  )}
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
                  className={cn(
                    !table.getCanNextPage() && "opacity-50 cursor-not-allowed"
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </CardContent>
    </Card>
  );
}
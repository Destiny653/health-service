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

/* --------------------------------------------------------------- */
/*  1. Optional meta type (only needed if you use meta later)    */
/* --------------------------------------------------------------- */
type ColumnMeta = {
  defaultHidden?: boolean;
};

/* --------------------------------------------------------------- */
/*  2. DataTable – two generics: TData + TMeta (defaults to never) */
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

  /* ---------- Show only first 10 columns by default ---------- */
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(() => {
    const saved = localStorage?.getItem("table-column-visibility");
    if (saved) return JSON.parse(saved);

    const hidden: VisibilityState = {};
    initialColumns.forEach((col, idx) => {
      if (col.id && idx >= 10) {
        hidden[col.id] = false; // hide after 10th column
      }
    });
    return hidden;
  });

  // Save to localStorage whenever visibility changes
  React.useEffect(() => {
    localStorage.setItem(
      "table-column-visibility",
      JSON.stringify(columnVisibility)
    );
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
            <div className="flex justify-end p-2 absolute right-1 -top-[6px]">
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
            {/* Table */}
            <table className="border-none w-full border-gray-200 text-sm">
              <thead className="bg-gray-50">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((h) => (
                      <th
                        key={h.id}
                        className="text-left px-4 py-2 border-b border-gray-50 font-[500]"
                      >
                        {h.isPlaceholder
                          ? null
                          : flexRender(
                            h.column.columnDef.header,
                            h.getContext()
                          )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50 transition-colors font-[500] text-[#424242] cursor-pointer"
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-2 border-b border-gray-50"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
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
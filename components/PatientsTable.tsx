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
import { ChevronDown, Loader2, Settings, Edit } from "lucide-react";
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
import { InlineEditField } from "./InlineEditField";

/* --------------------------------------------------------------- */
/*  DataTable – Yellow text only when score < 10 (no extra text)   */
/* --------------------------------------------------------------- */
export function DataTable<
  TData,
  TMeta extends Record<string, unknown> = never
>({
  data,
  columns: initialColumns,
  isLoading,
  onEditClick,
  editingCell,
  onCellClick,
  editingComponent,
  pagination,
  onPaginationChange,
}: {
  data: TData[];
  columns: ColumnDef<TData, TMeta>[];
  isLoading?: boolean;
  onEditClick?: (row: TData) => void;
  editingCell?: { rowId: string; fieldName: string } | null;
  onCellClick?: (rowId: string, fieldName: string, currentValue: string, docCode: string) => void;
  editingComponent?: React.ReactNode;
  pagination?: {
    pageIndex: number;
    pageSize: number;
  };
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void;
}) {
  const [internalPageIndex, setInternalPageIndex] = React.useState(0);
  const [internalPageSize] = React.useState(10);

  const pageIndex = pagination ? pagination.pageIndex : internalPageIndex;
  const pageSize = pagination ? pagination.pageSize : internalPageSize;

  /* ---------- SAFE localStorage: Only access in browser ---------- */
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(() => {
    if (typeof window === "undefined") {
      const hidden: VisibilityState = {};
      initialColumns.forEach((col, idx) => {
        if (col.id && idx >= 10) hidden[col.id] = false;
      });
      return hidden;
    }

    try {
      const saved = localStorage.getItem("table-column-visibility");
      if (saved) return JSON.parse(saved) as VisibilityState;
    } catch (e) {
      console.warn("Failed to parse saved column visibility", e);
    }

    const hidden: VisibilityState = {};
    initialColumns.forEach((col, idx) => {
      if (col.id && idx >= 10) hidden[col.id] = false;
    });
    return hidden;
  });

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
        const newPagination = updater({ pageIndex, pageSize });
        if (onPaginationChange) {
          onPaginationChange(newPagination);
        } else {
          setInternalPageIndex(newPagination.pageIndex);
        }
      } else {
        if (onPaginationChange) {
          onPaginationChange({ pageIndex: updater.pageIndex, pageSize });
        } else {
          setInternalPageIndex(updater.pageIndex);
        }
      }
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
  });

  const totalPages = table.getPageCount();

  return (
    <Card className="w-full bg-inherit mx-auto shadow-sm rounded-md border-none p-0 pb-2">
      <CardContent className="overflow-x-auto p-0">
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : (
          <div className="relative">
            {/* Table */}
            <table className="border-none w-full border-gray-200 text-sm overflow-auto">
              <thead className="bg-gray-100">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((h) => (
                      <th
                        key={h.id}
                        className="text-left px-4 py-2 border-b border-gray-100 general-size font-[500] whitespace-nowrap"
                      >
                        {h.isPlaceholder
                          ? null
                          : flexRender(h.column.columnDef.header, h.getContext())}
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
                {table.getRowModel().rows.map((row) => {
                  const rowData = row.original as any;
                  const rowId = rowData._id || rowData.metadata?.row_code || row.id;
                  const docCode = rowData.metadata?.doc_code || rowData.doc_code || "";

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-gray-50 transition-colors general-size font-[500] text-[#424242]"
                    >
                      {row.getVisibleCells().map((cell) => {
                        // Get the actual field object to read score
                        const fieldObject = cell.column.id
                          ? (cell.row.original as any)[cell.column.id]
                          : null;
                        const score = fieldObject?.corrected_score;
                        const fieldValue = String(fieldObject?.value || "");
                        const isLowConfidence = score < 10;
                        const isEmpty = !fieldValue || fieldValue.trim() === "";
                        const isEditable = isLowConfidence || isEmpty;
                        const textColor = isLowConfidence ? "text-yellow-600 font-semibold" : "text-[#424242]";

                        const raw = typeof cell.getValue === "function" ? cell.getValue() : undefined;
                        const rendered = flexRender(cell.column.columnDef.cell, cell.getContext());

                        const isCurrentlyEditing =
                          editingCell?.rowId === rowId &&
                          editingCell?.fieldName === cell.column.id;

                        return (
                          <td
                            key={cell.id}
                            className={cn(
                              "px-4 py-4 border-b border-gray-200 text-[16px]",
                              isCurrentlyEditing
                                ? "whitespace-nowrap"
                                : "whitespace-nowrap overflow-hidden text-ellipsis max-w-[250px]",
                              isEditable && !isCurrentlyEditing && "cursor-pointer hover:bg-blue-50"
                            )}
                            onClick={(e) => {
                              if (isEditable && !isCurrentlyEditing && onCellClick && cell.column.id) {
                                e.stopPropagation();
                                onCellClick(rowId, cell.column.id, fieldValue, docCode);
                              }
                            }}
                          >
                            {isCurrentlyEditing ? (
                              editingComponent
                            ) : (
                              <span className={textColor}>
                                {raw !== undefined && typeof raw === "string"
                                  ? raw.length > 20
                                    ? `${raw.slice(0, 20)}...`
                                    : raw
                                  : rendered}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      {/* Edit Button Column */}
                      <td className="px-4 py-4 border-b border-gray-200 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditClick?.(row.original);
                          }}
                          className="h-8 w-8 p-0 hover:bg-blue-100"
                        >
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
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
      </CardContent>
    </Card>
  );
}
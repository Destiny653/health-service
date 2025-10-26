"use client";

import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

// 🧩 Import Type
import { Patient } from "@/hooks/usePatients";

// 🔗 API Fetch Function
async function fetchPatients(): Promise<Patient[]> {
  const res = await fetch("/api/patients"); // Replace with your backend API
  if (!res.ok) throw new Error("Failed to fetch patients");
  return res.json();
}

// 🧱 Reusable Table Component
export function DataTable<TData>({
  data,
  columns,
  isLoading,
  onRowClick,
}: {
  data: TData[];
  columns: ColumnDef<TData>[];
  isLoading?: boolean;
  onRowClick?: (row: TData) => void;
}) {
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize] = React.useState(8); // Items per page

  const table = useReactTable({
    data,
    columns,
    state: { pagination: { pageIndex, pageSize } },
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        setPageIndex((old) => updater({ pageIndex: old, pageSize }).pageIndex);
      } else {
        setPageIndex(updater.pageIndex);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
  });

  const totalPages = table.getPageCount();

  return (
    <Card className="w-fit  bg-inherit mx-auto shadow-none rounded-md border-none p-0 m-0">
      <CardContent className="overflow-x-auto p-0 ">
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : (
          <table className="min-w-[95vw] border border-gray-200 text-sm">
            <thead className="bg-gray-100">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="text-left px-4 py-2 border-b font-semibold"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
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
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2 border-b">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Shadcn Pagination */}
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

// 🔍 Page using the table
export default function PatientsPage() {
  const {
    data = [],
    isLoading,
    error,
  } = useQuery<Patient[]>({
    queryKey: ["patients"],
    queryFn: fetchPatients,
  });

  React.useEffect(() => {
    if (error) toast.error("Error fetching patients data");
  }, [error]);

  const columns = React.useMemo<ColumnDef<Patient>[]>(
    () => [
      { accessorKey: "case", header: "Case #" },
      { accessorKey: "patientName", header: "Patient Name" },
      { accessorKey: "sex", header: "Sex" },
      { accessorKey: "age", header: "Age" },
      { accessorKey: "maritalStatus", header: "Marital Status" },
      { accessorKey: "isPregnant", header: "Is Pregnant" },
      { accessorKey: "profession", header: "Profession" },
      { accessorKey: "residence", header: "Residence" },
      { accessorKey: "contact", header: "Contact" },
      { accessorKey: "history", header: "History" },
    ],
    []
  );

  return <DataTable data={data} columns={columns} isLoading={isLoading} />;
}

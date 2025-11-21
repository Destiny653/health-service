// src/utils/export.ts
import * as XLSX from "xlsx";
import { Patient } from "@/hooks/usePatients";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { toast } from "sonner";
import { PatientDocument } from "@/components/team/hooks/docs/useGetDoc";

export const exportToCSV = (
  data: PatientDocument[],
  columns: ColumnDef<PatientDocument>[],
  filename: string
) => {
  if (data.length === 0) {
    toast.warning("No data to export");
    return;
  }

  const headers = columns.map(col => col.header as string).join(",");
  const rows = data.map(patient =>
    columns
      .map(col => {
        const accessorKey = (col as any).accessorKey as keyof PatientDocument;
        const value = patient[accessorKey];
        const escaped = String(value ?? "").replace(/"/g, '""');
        return `"${escaped}"`;
      })
      .join(",")
  );

  const csv = [headers, ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast.success("CSV exported!");
};
export const exportToExcel = (
  data: PatientDocument[],
  columns: ColumnDef<PatientDocument>[],
  filename: string
) => {
  if (data.length === 0) {
    toast.warning("No data to export");
    return;
  }

  const sheetData = data.map(patient => {
    const row: Record<string, any> = {};
    columns.forEach(col => {
      const key = (col as any).accessorKey as string;
      const header = col.header as string;
      row[header] = patient[key as keyof PatientDocument] ?? "";
    });
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(sheetData);
  
  // Auto-size columns
  const colWidths = columns.map((_, i) => ({
    wch: Math.max(
      (columns[i].header as string).length,
      ...data.map(row => {
        const val = row[(columns[i] as any).accessorKey as keyof PatientDocument];
        return String(val ?? "").length;
      })
    ) + 4,
  }));
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Patients");
  XLSX.writeFile(wb, `${filename}.xlsx`);
  toast.success("Excel exported!");
};

export const generateExportFilename = (
  district: string,
  view: string,
  date: Date,
  status: string | null
): string => {
  const cleanDistrict = district.replace(/\s+/g, "_");
  const statusPart = status ? `_${status}` : "";

  let period = "";
  if (view === "DAY") period = format(date, "yyyy-MM-dd");
  else if (view === "WEEK") period = `Week-${format(date, "w-yyyy")}`;
  else if (view === "MONTH") period = format(date, "MMM-yyyy");
  else if (view === "YEAR") period = format(date, "yyyy");

  return `Patients_${cleanDistrict}_${period}${statusPart}`;
};
// src/utils/export.ts
import * as XLSX from "xlsx";
import { Patient } from "@/hooks/usePatients";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { toast } from "sonner";
import { PatientDocument } from "@/hooks/docs/useGetDoc";

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

// PDF Export with Custom Header and Form Fields
export const exportToPDF = (
  data: PatientDocument[],
  columns: ColumnDef<PatientDocument>[],
  filename: string,
  metadata: {
    facilityName?: string;
    region?: string;
    healthDistrict?: string;
    healthArea?: string;
    year?: string;
    epidemiologicalWeek?: string;
  } = {}
) => {
  if (data.length === 0) {
    toast.warning("No data to export");
    return;
  }

  // Dynamically import jsPDF and jspdf-autotable
  import('jspdf').then(async (jsPDFModule) => {
    const jsPDF = jsPDFModule.default;

    // Import autoTable plugin
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 10;

    // ===== TRI-COLUMN HEADER =====
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');

    // Left column (French)
    const leftText = [
      'République du Cameroun',
      'Paix - Travail - Patrie',
      '-------------',
      'Ministère de la Santé Publique'
    ];
    leftText.forEach((line, index) => {
      doc.text(line, 10, yPosition + (index * 4));
    });

    // Center column (Logo placeholder)
    doc.setFontSize(8);
    doc.text('[LOGO]', pageWidth / 2, yPosition + 6, { align: 'center' });
    doc.rect(pageWidth / 2 - 10, yPosition - 2, 20, 20); // Logo box

    // Right column (English)
    const rightText = [
      'Republic of Cameroon',
      'Peace - Work - Fatherland',
      '-------------',
      'Ministry of Public Health'
    ];
    rightText.forEach((line, index) => {
      doc.text(line, pageWidth - 10, yPosition + (index * 4), { align: 'right' });
    });

    yPosition += 25;

    // ===== SUBTITLE TEXT =====
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const subtitle = 'Weekly Epidemiological Surveillance Report for Infectious Diseases in Health Facilities';
    doc.text(subtitle, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // ===== FORM SECTIONS =====
    doc.setFontSize(9);

    // Section 1: Region and Epidemiological Week
    const section1Y = yPosition;
    doc.text(`Région / Region: ${metadata.region || '__________________'}`, 10, section1Y);
    doc.text(`Semaine Épidémiologique / Epidemiological Week: ${metadata.epidemiologicalWeek || '__________________'}`, pageWidth / 2 + 10, section1Y);
    yPosition += 8;

    // Section 2: Health District and Health Unit
    const section2Y = yPosition;
    doc.text(`District Santé / Health District: ${metadata.healthDistrict || metadata.facilityName || '__________________'}`, 10, section2Y);
    doc.text(`Nom de la Formation Sanitaire / Name of Health Unit: ${metadata.facilityName || '__________________'}`, pageWidth / 2 + 10, section2Y);
    yPosition += 8;

    // Section 3: Health Area, Year, To
    const section3Y = yPosition;
    doc.text(`Aire de Santé / Health Area: ${metadata.healthArea || '__________________'}`, 10, section3Y);
    doc.text(`Année / Year: ${metadata.year || new Date().getFullYear()}`, pageWidth / 2 + 10, section3Y);
    doc.text(`Au / To: ${format(new Date(), 'dd/MM/yyyy')}`, pageWidth / 2 + 60, section3Y);
    yPosition += 10;

    // ===== DATA TABLE =====
    const tableHeaders = columns.map(col => col.header as string);
    const tableData = data.map(patient =>
      columns.map(col => {
        const accessorKey = (col as any).accessorKey as keyof PatientDocument;
        const value = patient[accessorKey];

        // Handle nested objects with .value property
        if (value && typeof value === 'object' && 'value' in value) {
          return String((value as any).value ?? '');
        }

        return String(value ?? '');
      })
    );

    (doc as any).autoTable({
      head: [tableHeaders],
      body: tableData,
      startY: yPosition,
      styles: {
        fontSize: 7,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [2, 30, 245],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240],
      },
      margin: { left: 10, right: 10 },
      didDrawPage: (data: any) => {
        // Footer with page numbers
        doc.setFontSize(8);
        doc.text(
          `Page ${data.pageNumber}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      },
    });

    toast.success("PDF exported!");
  }).catch(error => {
    console.error('Error loading PDF library:', error);
    toast.error("Failed to export PDF");
  });
};

// Disease Report PDF Export with Custom Header
export const exportDiseaseReportToPDF = (
  data: any[],
  filename: string,
  metadata: {
    facilityName?: string;
    region?: string;
    healthDistrict?: string;
    healthArea?: string;
    year?: string;
    epidemiologicalWeek?: string;
    submissionDate?: string;
    receivedDate?: string;
    submitterName?: string;
  } = {}
) => {
  if (data.length === 0) {
    toast.warning("No data to export");
    return;
  }

  // Dynamically import jsPDF
  import('jspdf').then(async (jsPDFModule) => {
    const jsPDF = jsPDFModule.default;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 10;

    // ===== TRI-COLUMN HEADER =====
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');

    // Left column (French)
    const leftText = [
      'République du Cameroun',
      'Paix - Travail - Patrie',
      '-------------',
      'Ministère de la Santé Publique'
    ];
    leftText.forEach((line, index) => {
      doc.text(line, 10, yPosition + (index * 4));
    });

    // Center column (Logo placeholder)
    doc.setFontSize(8);
    doc.text('[LOGO]', pageWidth / 2, yPosition + 6, { align: 'center' });
    doc.rect(pageWidth / 2 - 10, yPosition - 2, 20, 20);

    // Right column (English)
    const rightText = [
      'Republic of Cameroon',
      'Peace - Work - Fatherland',
      '-------------',
      'Ministry of Public Health'
    ];
    rightText.forEach((line, index) => {
      doc.text(line, pageWidth - 10, yPosition + (index * 4), { align: 'right' });
    });

    yPosition += 25;

    // ===== SUBTITLE TEXT =====
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const subtitle = 'Weekly Epidemiological Surveillance Report for Infectious Diseases';
    doc.text(subtitle, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // ===== FORM SECTIONS =====
    doc.setFontSize(8);

    // Section 1
    doc.text(`Région / Region: ${metadata.region || '__________________'}`, 10, yPosition);
    doc.text(`Semaine Épidémiologique / Week: ${metadata.epidemiologicalWeek || '____'}`, pageWidth / 2 + 5, yPosition);
    yPosition += 6;

    // Section 2
    doc.text(`District Santé / Health District: ${metadata.healthDistrict || metadata.facilityName || '__________________'}`, 10, yPosition);
    yPosition += 6;

    // Section 3
    doc.text(`Formation Sanitaire / Health Unit: ${metadata.facilityName || '__________________'}`, 10, yPosition);
    yPosition += 6;

    doc.text(`Aire de Santé / Health Area: ${metadata.healthArea || '__________________'}`, 10, yPosition);
    doc.text(`Année / Year: ${metadata.year || new Date().getFullYear()}`, pageWidth / 2 + 5, yPosition);
    doc.text(`Au / To: ${format(new Date(), 'dd/MM/yyyy')}`, pageWidth - 40, yPosition);
    yPosition += 10;

    // ===== DISEASE REPORT TABLE =====
    // Prepare table data
    const tableBody = data.map((row, index) => [
      (index + 1).toString().padStart(2, '0'),
      row.name + (row.isNotifiable ? ' *' : ''),
      row.suspected['0-14'].m,
      row.suspected['0-14'].f,
      row.suspected['15-24'].m,
      row.suspected['15-24'].f,
      row.suspected['25-49'].m,
      row.suspected['25-49'].f,
      row.suspected['60+'].m,
      row.suspected['60+'].f,
      row.deaths['0-14'].m,
      row.deaths['0-14'].f,
      row.deaths['15-24'].m,
      row.deaths['15-24'].f,
      row.deaths['25-49'].m,
      row.deaths['25-49'].f,
      row.deaths['60+'].m,
      row.deaths['60+'].f,
      row.samples,
      row.confirmed,
    ]);

    // Manually draw table - adjusted for portrait
    doc.setFontSize(6);
    const startX = 5;
    const startY = yPosition;
    // Reduced column widths to fit portrait A4 (210mm width)
    const colWidths = [6, 35, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 10, 10];
    const rowHeight = 5;

    // Helper function to draw cell
    const drawCell = (text: string, x: number, y: number, width: number, height: number, isBold = false) => {
      doc.rect(x, y, width, height);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      const lines = text.split('\n');
      if (lines.length > 1) {
        lines.forEach((line, idx) => {
          doc.text(line, x + width / 2, y + height / 2 - 1 + (idx * 2), { align: 'center' });
        });
      } else {
        doc.text(text, x + width / 2, y + height / 2 + 1, { align: 'center' });
      }
    };

    // Draw header row 1
    let currentX = startX;
    let currentY = startY;
    drawCell('No', currentX, currentY, colWidths[0], rowHeight * 3, true);
    currentX += colWidths[0];
    drawCell('MALADIES', currentX, currentY, colWidths[1], rowHeight * 3, true);
    currentX += colWidths[1];

    const suspectedWidth = colWidths.slice(2, 10).reduce((a, b) => a + b, 0);
    drawCell('SUSPECTED\nCASES', currentX, currentY, suspectedWidth, rowHeight, true);
    currentX += suspectedWidth;

    const deathsWidth = colWidths.slice(10, 18).reduce((a, b) => a + b, 0);
    drawCell('DEATHS', currentX, currentY, deathsWidth, rowHeight, true);
    currentX += deathsWidth;

    drawCell('Sample\nCases', currentX, currentY, colWidths[18], rowHeight * 3, true);
    currentX += colWidths[18];
    drawCell('Confirmed', currentX, currentY, colWidths[19], rowHeight * 3, true);

    // Draw header row 2 (age groups)
    currentY += rowHeight;
    currentX = startX + colWidths[0] + colWidths[1];

    ['0-14', '15-24', '25-49', '60+'].forEach(ageGroup => {
      drawCell(ageGroup, currentX, currentY, colWidths[2] + colWidths[3], rowHeight, true);
      currentX += colWidths[2] + colWidths[3];
    });

    ['0-14', '15-24', '25-49', '60+'].forEach(ageGroup => {
      drawCell(ageGroup, currentX, currentY, colWidths[10] + colWidths[11], rowHeight, true);
      currentX += colWidths[10] + colWidths[11];
    });

    // Draw header row 3 (M/F)
    currentY += rowHeight;
    currentX = startX + colWidths[0] + colWidths[1];

    for (let i = 0; i < 16; i++) {
      const label = i % 2 === 0 ? 'M' : 'F';
      drawCell(label, currentX, currentY, colWidths[i + 2], rowHeight, true);
      currentX += colWidths[i + 2];
    }

    // Draw data rows
    currentY += rowHeight;
    tableBody.forEach(row => {
      currentX = startX;
      row.forEach((cell, colIndex) => {
        doc.setFont('helvetica', 'normal');
        const cellText = String(cell || '');
        const isNameCol = colIndex === 1;
        doc.rect(currentX, currentY, colWidths[colIndex], rowHeight);

        if (isNameCol) {
          // Truncate long disease names if needed
          const maxLength = 30;
          const displayText = cellText.length > maxLength ? cellText.substring(0, maxLength) + '...' : cellText;
          doc.text(displayText, currentX + 1, currentY + rowHeight / 2 + 1, { align: 'left' });
        } else {
          doc.text(cellText, currentX + colWidths[colIndex] / 2, currentY + rowHeight / 2 + 1, { align: 'center' });
        }
        currentX += colWidths[colIndex];
      });
      currentY += rowHeight;

      // Check for page break
      if (currentY > pageHeight - 40) {
        doc.addPage();
        currentY = 20;
      }
    });

    // ===== FOOTER SECTION =====
    currentY += 8;
    doc.setFontSize(7);

    // Four footer fields in one row
    const footerStartY = currentY;
    doc.text(`Date of submission in the health area:`, 10, footerStartY);
    doc.text(metadata.submissionDate || '___________', 10, footerStartY + 4);

    doc.text(`Date received:`, 60, footerStartY);
    doc.text(metadata.receivedDate || '___________', 60, footerStartY + 4);

    doc.text(`Name:`, 110, footerStartY);
    doc.text(metadata.submitterName || '___________', 110, footerStartY + 4);

    doc.text(`Signature and Stamp:`, 160, footerStartY);
    doc.rect(160, footerStartY + 5, 35, 10); // Box for signature

    currentY += 20;
    doc.setFontSize(7);
    doc.text('* Immediate Notifiable Diseases', pageWidth / 2, currentY, { align: 'center' });

    // Page numbers
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    // Save the PDF
    doc.save(`${filename}.pdf`);
    toast.success("PDF exported!");
  }).catch(error => {
    console.error('Error loading PDF library:', error);
    toast.error("Failed to export PDF");
  });
};
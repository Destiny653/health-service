import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Converts an HTML element to PDF
 * This is a utility to work with the DiseaseReportTemplate component
 */
export const exportHTMLToPDF = async (
    elementRef: HTMLDivElement | null,
    filename: string
) => {
    if (!elementRef) {
        toast.error('Unable to generate PDF');
        return;
    }

    try {
        // Convert HTML to canvas
        const canvas = await html2canvas(elementRef, {
            scale: 2, // Higher quality
            useCORS: true,
            logging: false,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        // Add first page
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        // Add additional pages if content is longer than one page
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
        }

        pdf.save(`${filename}.pdf`);
        toast.success('PDF exported successfully!');
    } catch (error) {
        console.error('Error generating PDF:', error);
        toast.error('Failed to export PDF');
    }
};

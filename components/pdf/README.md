# Using the HTML/TSX PDF Template

## Overview
I've converted the PDF export configuration from programmatic jsPDF code to a visual HTML/React template that's much easier to understand and customize.

## Files Created

### 1. [DiseaseReportTemplate.tsx](file:///home/mbahmukong-destiny/Documents/Instanvi-sarl/health-care/components/pdf/DiseaseReportTemplate.tsx)

This is the main template component that visually represents your PDF layout in HTML/React format.

**Structure:**
- **Tri-column Header**: French (left), Logo (center), English (right)
- **Subtitle**: Report title
- **Form Sections**: Bilingual fields for facility info, dates, etc.
- **Disease Table**: Multi-level headers with age groups and gender
- **Footer**: Four fields (submission date, received date, name, signature/stamp)

**Styling:**
All styles are inline in a `styles` object at the bottom of the file. You can easily modify:
- Colors (backgrounds, borders, text)
- Font sizes
- Spacing and padding
- Table widths
- Any layout element

### 2. [pdfExport.ts](file:///home/mbahmukong-destiny/Documents/Instanvi-sarl/health-care/utils/pdfExport.ts)

Utility function `exportHTMLToPDF` that converts the HTML template to PDF using:
- **html2canvas**: Converts HTML to image
- **jsPDF**: Creates PDF from the image

## How to Use

### Method 1: Hidden Template (Current Approach)

```tsx
import { useRef } from 'react';
import DiseaseReportTemplate from '@/components/pdf/DiseaseReportTemplate';
import { exportHTMLToPDF } from '@/utils/pdfExport';

function ReportsContent() {
  const pdfRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    // Generate PDF from hidden template
    await exportHTMLToPDF(pdfRef.current, 'Disease_Report');
  };

  return (
    <>
      {/* Your normal page content */}
      <button onClick={handleExportPDF}>Export PDF</button>

      {/* Hidden PDF template - only used for export */}
      <div style={{ position: 'absolute', left: '-9999px' }}>
        <DiseaseReportTemplate
          ref={pdfRef}
          data={filteredReports}
          metadata={{
            facilityName: 'Mbingo Regional Hospital',
            region: '',
            healthDistrict: 'Mbingo',
            // ... other metadata
          }}
        />
      </div>
    </>
  );
}
```

### Method 2: Preview Before Export

```tsx
import { useState, useRef } from 'react';
import DiseaseReportTemplate from '@/components/pdf/DiseaseReportTemplate';
import { exportHTMLToPDF } from '@/utils/pdfExport';

function ReportsContent() {
  const [showPreview, setShowPreview] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    await exportHTMLToPDF(pdfRef.current, 'Disease_Report');
    setShowPreview(false);
  };

  return (
    <>
      <button onClick={() => setShowPreview(true)}>Preview PDF</button>

      {showPreview && (
        <div className="pdf-preview-modal">
          <DiseaseReportTemplate
            ref={pdfRef}
            data={filteredReports}
            metadata={{ /* ... */ }}
          />
          <button onClick={handleExportPDF}>Download PDF</button>
          <button onClick={() => setShowPreview(false)}>Cancel</button>
        </div>
      )}
    </>
  );
}
```

## Customization Examples

### Change Header Colors

In `DiseaseReportTemplate.tsx`:
```tsx
headerText: {
  margin: '2px 0',
  fontWeight: 'bold',
  fontSize: '9pt',
  color: '#0066cc', // Change text color
},
```

### Adjust Table Styling

```tsx
th: {
  border: '1px solid #000',
  padding: '4px 2px',
  backgroundColor: '#4CAF50', // Change header color
  fontWeight: 'bold',
  textAlign: 'center',
},
```

### Modify Form Field Layout

```tsx
formRow: {
  display: 'flex',
  flexDirection: 'column', // Stack vertically instead
  gap: '10px',
  marginBottom: '6px',
},
```

### Add Logo Image

Replace the logo placeholder:
```tsx
<div style={styles.headerCenter}>
  <img 
    src="/images/cameroon-logo.png" 
    alt="Logo" 
    style={{ width: '60px', height: '60px' }}
  />
</div>
```

## Advantages Over jsPDF Code

✅ **Visual**: See exactly what the PDF will look like  
✅ **HTML/CSS**: Use familiar web technologies  
✅ **Easy to Modify**: Change colors, fonts, layout visually  
✅ **Reusable**: Can preview in browser before export  
✅ **Maintainable**: Much easier to understand than drawing commands  
✅ **Flexible**: Can use React components, conditional rendering, etc.

## Next Steps

To integrate this into your ReportsContent:
1. Import the template and utility
2. Create a ref for the template
3. Render it hidden or in a modal
4. Call `exportHTMLToPDF` on button click

The template is ready to use and fully customizable!

# Impressa PDF Report Templates

Professional, reusable PDF templates for generating business reports with modern design and responsive layout.

## 📦 What's Included

### 1. **PDFKit Backend Template** (`pdfLayout.js`)
- Server-side PDF generation using PDFKit
- Used by the backend API for order reports
- Features:
  - Professional header with logo
  - AI summary box with blue highlight
  - Grid-based metric cards
  - Styled data table with zebra striping
  - Signature/approval section
  - Footer with contact info and page numbers

### 2. **React Component** (`PDFReportTemplate.jsx`)
- Reusable React component for PDF export
- Works with html2pdf.js or react-pdf
- Fully customizable props
- Inline styles for portability

### 3. **Standalone HTML Template** (`impressa-report-template.html`)
- Pure HTML/CSS template
- No dependencies required
- Print-friendly
- Mobile responsive
- Can be used with any PDF generation library

## 🎨 Design Features

- **Modern, Business-Friendly Fonts**: Helvetica/Arial
- **Professional Color Scheme**: 
  - Primary: #111827 (Dark Gray)
  - Accent: #1E40AF (Blue)
  - Borders: #E5E7EB (Light Gray)
  - Background: #F9FAFB (Off-white)
- **A4 Page Format** (210mm x 297mm)
- **Responsive Layout** for both desktop and mobile PDF viewers
- **Print Optimized** with proper margins and page breaks

## 📋 Template Structure

All templates include these sections:

1. **Header**
   - Company logo (left)
   - Company name: "impressa"
   - Tagline: "Custom Solutions"
   - Report date (right)

2. **Title Section**
   - Large, centered title
   - Optional subtitle

3. **Summary Box**
   - Blue-highlighted box for executive summary/AI insights
   - Easy to scan key information

4. **Metrics Grid**
   - 2-column responsive grid
   - Cards with label and large value
   - Supports unlimited metrics

5. **Data Table**
   - Professional table with headers
   - Zebra striping for readability
   - Customizable columns
   - Up to 50 rows per page

6. **Signature Section**
   - Two-column layout
   - "Prepared by" and "Approved by" fields
   - Signature lines with names and titles

7. **Footer**
   - Company contact information
   - Email and phone number
   - Page number
   - Generation timestamp

## 🚀 Usage

### Backend (PDFKit)

The backend automatically uses the improved template. Just restart the server:

```bash
cd impressa\impressa-backend
npm run dev
```

### React Component

```jsx
import PDFReportTemplate from './components/PDFReportTemplate';
import html2pdf from 'html2pdf.js';

const MyReport = () => {
  const exportPDF = () => {
    const element = document.getElementById('pdf-template');
    html2pdf().from(element).save('report.pdf');
  };

  return (
    <div>
      <button onClick={exportPDF}>Export PDF</button>
      <div id="pdf-template">
        <PDFReportTemplate
          title="Monthly Sales Report"
          subtitle="January 2025"
          summaryMetrics={[
            { label: "Total Orders", value: "1,234" },
            { label: "Revenue", value: "$45,678" }
          ]}
          tableColumns={[
            { key: "id", header: "Order ID" },
            { key: "customer", header: "Customer" }
          ]}
          tableData={[
            { id: "A1B2C3", customer: "John Doe" }
          ]}
          signatory={{
            preparedBy: "Admin User",
            preparedTitle: "System Administrator"
          }}
        />
      </div>
    </div>
  );
};
```

### HTML Template

1. Open `impressa-report-template.html` in a browser
2. Customize the content (title, metrics, table data)
3. Use browser's Print to PDF (Ctrl+P) or integrate with:
   - jsPDF
   - html2pdf.js
   - Puppeteer (server-side)

## 🎯 Current Implementation

The backend now generates reports with:

✅ **AI Summary Box** - Highlighted in blue at the top
✅ **Metric Cards** - 2-column grid showing key statistics
✅ **Professional Table** - Order details with proper columns:
   - Order ID
   - Product Name
   - Customer Name/Email
   - Quantity
   - Status
   - Date

✅ **Enhanced Footer** - Contact information included
✅ **Proper Styling** - All colors and fonts consistently applied

## 📱 Responsive Features

- Desktop: Full width tables and 2-column metrics
- Tablet: Adjusted spacing
- Mobile: Single column layout, stacked elements
- Print: Optimized margins and page breaks

## 🔧 Customization

### Change Colors

Edit the color constants in the template:

```javascript
// Primary text
const primaryColor = "#111827";

// Accent/links
const accentColor = "#1E40AF";

// Borders
const borderColor = "#E5E7EB";
```

### Add New Sections

Use the `helpers` object in PDFKit:

```javascript
helpers.section("New Section Title");
helpers.keyValue({ "Label": "Value" });
helpers.table({ columns: [...], rows: [...] });
```

### Modify Layout

Adjust margins, fonts, and spacing in:
- PDFKit: `pdfLayout.js`
- React: Inline styles in component
- HTML: `<style>` section

## 📞 Support

For issues or questions:
- Email: info@impressa.rw
- Phone: +250 788 000 000

## 📄 License

Proprietary to Impressa Custom Solutions. All rights reserved.

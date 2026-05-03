import PDFDocument from "pdfkit";

export const createabelusPDF = ({ title, contentBuilder, signatory, logoPath, companyName, subtitle }) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
  const pageWidth = doc.page.width;

  const drawHeader = () => {
    const { left, right, top } = doc.page.margins;
    const innerWidth = pageWidth - left - right;

    // Logo centered at top
    if (logoPath) {
      try {
        doc.image(logoPath, pageWidth / 2 - 25, top + 10, { width: 50, height: 50 });
      } catch (err) {
        console.warn("Logo not loaded:", err.message);
      }
    }

    // Company name and title centered - use explicit Y positions
    const headerStartY = top + (logoPath ? 70 : 20);
    doc.fillColor("#111827").fontSize(16).font("Helvetica-Bold");
    doc.text(companyName || "abelus Custom Solutions", left, headerStartY, {
      width: innerWidth,
      align: "center",
      lineBreak: false
    });
    
    doc.font("Helvetica").fontSize(13).fillColor("#374151");
    doc.text(title, left, headerStartY + 20, {
      width: innerWidth,
      align: "center",
      lineBreak: false
    });
    
    doc.fontSize(9).fillColor("#6B7280");
    doc.text(subtitle || `Generated: ${new Date().toLocaleDateString()}`, left, headerStartY + 38, {
      width: innerWidth,
      align: "center",
      lineBreak: false
    });

    // Divider line
    const dividerY = headerStartY + 52;
    doc.moveTo(left, dividerY).lineTo(left + innerWidth, dividerY)
       .strokeColor("#E5E7EB").lineWidth(1).stroke();
    
    // Set doc.y to start content after header
    doc.y = dividerY + 15;
  };

  const drawFooter = () => {
    const { left, right, bottom } = doc.page.margins;
    const innerWidth = pageWidth - left - right;
    // Position footer at the bottom of the page (inside margin)
    const footerY = doc.page.height - bottom - 20;

    // Save current Y position to restore later
    const savedY = doc.y;

    // Footer divider line
    doc.moveTo(left, footerY).lineTo(left + innerWidth, footerY)
       .strokeColor("#E5E7EB").lineWidth(1).stroke();

    // Footer content - use lineBreak: false to prevent doc.y changes
    doc.fillColor("#6B7280").fontSize(8);
    doc.text((companyName || "abelus") + " | Kigali, Rwanda", left, footerY + 5, {
      width: innerWidth / 3,
      align: "left",
      lineBreak: false
    });
    doc.text("info@abelus.rw | +250 788 000 000", left + innerWidth / 3, footerY + 5, {
      width: innerWidth / 3,
      align: "center",
      lineBreak: false
    });
    doc.text(`Page ${doc.page.number || 1}`, left + (2 * innerWidth / 3), footerY + 5, {
      width: innerWidth / 3,
      align: "right",
      lineBreak: false
    });

    // Generation timestamp
    doc.fontSize(7).fillColor("#9CA3AF");
    doc.text("Report generated: " + new Date().toLocaleString(), left, footerY + 15, {
      width: innerWidth,
      align: "center",
      lineBreak: false
    });

    // Restore Y position
    doc.y = savedY;
  };

  // Draw header on first page
  drawHeader();
  
  // Header only on first page; do not redraw on subsequent pages

  // Helpers available to content builders
  const helpers = {
    section: (label) => {
      doc.moveDown(0.6);
      doc.fillColor("#111827").fontSize(12).text(label, { underline: true });
      doc.moveDown(0.4);
    },
    keyValue: (items = {}) => {
      doc.fillColor("#111827").fontSize(10);
      Object.entries(items).forEach(([k, v]) => {
        const val = typeof v === "number" ? v.toLocaleString() : (v ?? "-");
        doc.text(`${k}: ${val}`);
      });
      doc.moveDown(0.4);
    },
    table: ({ columns, rows }) => {
      if (!rows || rows.length === 0) return;
      
      const startX = doc.page.margins.left;
      const totalWidth = columns.reduce((s, c) => s + (c.width || 100), 0);
      const rowHeight = 16;
      const headerHeight = 18;
      let y = doc.y;

      // Draw table header
      doc.save();
      doc.rect(startX, y, totalWidth, headerHeight).fill("#F3F4F6");
      doc.restore();
      
      doc.fillColor("#374151").fontSize(9).font("Helvetica-Bold");
      let x = startX + 4;
      columns.forEach((c) => {
        doc.text(c.header || c.key, x, y + 5, { 
          width: (c.width || 100) - 8, 
          ellipsis: true,
          lineBreak: false
        });
        x += (c.width || 100);
      });
      y += headerHeight;

      // Draw table rows
      doc.font("Helvetica").fontSize(9);
      rows.forEach((row, idx) => {
        // Check if we need a new page (leave space for footer)
        if (y + rowHeight > doc.page.height - doc.page.margins.bottom - 80) {
          doc.addPage();
          y = doc.y;
          
          // Redraw header on new page
          doc.save();
          doc.rect(startX, y, totalWidth, headerHeight).fill("#F3F4F6");
          doc.restore();
          doc.fillColor("#374151").fontSize(9).font("Helvetica-Bold");
          x = startX + 4;
          columns.forEach((c) => {
            doc.text(c.header || c.key, x, y + 5, { 
              width: (c.width || 100) - 8, 
              ellipsis: true,
              lineBreak: false
            });
            x += (c.width || 100);
          });
          y += headerHeight;
          doc.font("Helvetica");
        }

        // Zebra striping
        if (idx % 2 === 1) {
          doc.save();
          doc.rect(startX, y, totalWidth, rowHeight).fill("#FAFAFA");
          doc.restore();
        }

        // Draw row data
        doc.fillColor("#111827").fontSize(9);
        x = startX + 4;
        columns.forEach((c) => {
          const val = row[c.key];
          const txt = typeof val === "number" ? val.toLocaleString() : String(val ?? "-");
          doc.text(txt, x, y + 3, { 
            width: (c.width || 100) - 8, 
            ellipsis: true,
            lineBreak: false
          });
          x += (c.width || 100);
        });
        y += rowHeight;
      });
      
      // Update doc.y to current position
      doc.y = y;
      doc.moveDown(0.5);
    }
  };

  // Content
  try {
    // Call with helpers for new builders; legacy builders that only accept doc still work
    contentBuilder(doc, helpers);
  } catch (error) {
    // Fallback to legacy signature
    console.warn("ContentBuilder error, trying legacy signature:", error.message);
    try {
      contentBuilder(doc);
    } catch (legacyError) {
      console.error("ContentBuilder failed:", legacyError);
      doc.fillColor("#DC2626").fontSize(10).text("Error generating content");
    }
  }

  // Signature block
  doc.moveDown(3);
  doc.fillColor("#111827").fontSize(12).font("Helvetica-Bold");
  doc.text("Approval & Authorization", { underline: true });
  doc.font("Helvetica").moveDown(1);

  // Signatory info
  doc.fillColor("#374151").fontSize(10);
  doc.text(`Prepared by: ${signatory.name || "N/A"}`);
  doc.text(`Title: ${signatory.title || "abelus Administrator"}`);
  doc.moveDown(1);

  // Signature and stamp section
  const sigYStart = doc.y;
  const leftMargin = doc.page.margins.left;

  // Signature
  if (signatory.signatureImage) {
    try {
      doc.image(signatory.signatureImage, leftMargin, sigYStart, { width: 120, height: 40 });
      doc.y = sigYStart + 45;
    } catch (err) {
      console.warn("Signature image failed:", err.message);
      doc.fillColor("#6B7280").fontSize(9);
      doc.text("Signature: ______________________", leftMargin, sigYStart);
    }
  } else {
    doc.fillColor("#6B7280").fontSize(9);
    doc.text("Signature: ______________________", leftMargin, sigYStart);
  }

  // Stamp (next to signature)
  if (signatory.stampImage) {
    try {
      doc.image(signatory.stampImage, leftMargin + 200, sigYStart, { width: 80, height: 80 });
    } catch (err) {
      console.warn("Stamp image failed:", err.message);
      doc.fillColor("#6B7280").fontSize(9);
      doc.text("Official Stamp: __________", leftMargin + 200, sigYStart);
    }
  } else {
    doc.fillColor("#6B7280").fontSize(9);
    doc.text("Official Stamp: __________", leftMargin + 200, sigYStart);
  }

  // Draw footer on all pages
  const totalPages = doc.bufferedPageRange().count;
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    drawFooter();
  }

  return doc;
};

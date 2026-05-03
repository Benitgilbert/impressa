import PDFDocument from "pdfkit";

export const createabelusPDF = ({ title, companyName, subtitle, contentBuilder }) => {
  const doc = new PDFDocument({ 
    margin: 50, 
    size: 'A4', 
    bufferPages: true,
    autoFirstPage: false 
  });

  const drawHeader = () => {
    const { left, right, top } = doc.page.margins;
    const pageWidth = doc.page.width;
    const innerWidth = pageWidth - left - right;

    // Fixed Branding - Match Template Exactly
    doc.fillColor("#1E3A8A").fontSize(26).font("Helvetica-Bold")
       .text("ABELUS", left, top);
    
    doc.fillColor("#64748B").fontSize(11).font("Helvetica")
       .text("Custom Solutions", left, top + 28);

    // Header Title (Right)
    doc.fillColor("#64748B").fontSize(14).font("Helvetica")
       .text(title || "Performance Statement", left, top + 5, { align: "right", width: innerWidth });
    
    doc.fillColor("#94A3B8").fontSize(9)
       .text(`Generated: ${new Date().toLocaleDateString()}`, left, top + 25, { align: "right", width: innerWidth });

    // Navy Accent Line
    doc.moveTo(left, top + 55).lineTo(left + innerWidth, top + 55)
       .strokeColor("#1E3A8A").lineWidth(2).stroke();
    
    doc.y = top + 80;
  };

  const drawFooter = (pageNumber, totalPages) => {
    const { left, right } = doc.page.margins;
    const pageWidth = doc.page.width;
    const innerWidth = pageWidth - left - right;
    const footerY = doc.page.height - 45;

    doc.save();
    doc.moveTo(left, footerY).lineTo(left + innerWidth, footerY)
       .strokeColor("#E5E7EB").lineWidth(0.5).stroke();

    doc.fillColor("#94A3B8").fontSize(8).font("Helvetica");
    const footerText = "uwanyirigiraeleora@gmail.com | +250 788 819 878 | Building near Bank of Kigali Gicumbi Branch";
    doc.text(footerText, left, footerY + 10, { width: innerWidth, align: "center" });
    doc.text(`Page ${pageNumber} of ${totalPages}`, left, footerY + 20, { width: innerWidth, align: "center" });
    doc.restore();
  };

  // Setup helpers
  const helpers = {
    section: (label) => {
      const { left, right } = doc.page.margins;
      const innerWidth = doc.page.width - left - right;
      if (doc.y > doc.page.height - 100) doc.addPage();
      doc.moveDown(1.5);
      doc.fillColor("#1E3A8A").fontSize(12).font("Helvetica-Bold")
         .text(label.toUpperCase(), left, doc.y, { align: "center", width: innerWidth });
      doc.moveDown(0.5);
    },
    infoBox: (label, text) => {
      const { left, right } = doc.page.margins;
      const innerWidth = doc.page.width - left - right;
      const padding = 15;
      
      doc.font("Helvetica-Bold").fontSize(9.5);
      const labelStr = `${label}: `;
      const textHeight = doc.heightOfString(labelStr + text, { width: innerWidth - (padding * 2) - 10 });
      const boxHeight = textHeight + (padding * 2);

      if (doc.y + boxHeight > doc.page.height - 70) doc.addPage();

      const currentY = doc.y;
      doc.save();
      doc.roundedRect(left, currentY, innerWidth, boxHeight, 4).fill("#F8FAFC");
      doc.rect(left, currentY, 4, boxHeight).fill("#1E3A8A");
      doc.restore();

      doc.fillColor("#1E293B").fontSize(9.5).font("Helvetica-Bold")
         .text(labelStr, left + padding + 5, currentY + padding, { lineBreak: false });
      
      const labelWidth = doc.widthOfString(labelStr);
      doc.font("Helvetica").fillColor("#475569")
         .text(text, left + padding + 5 + labelWidth, currentY + padding, { 
            width: innerWidth - (padding * 2) - 10 - labelWidth 
         });
      
      doc.y = currentY + boxHeight + 20;
    },
    metricCards: (metrics) => {
      const { left, right } = doc.page.margins;
      const innerWidth = doc.page.width - left - right;
      const spacing = 15;
      const cardWidth = (innerWidth - (spacing * (metrics.length - 1))) / metrics.length;
      const cardHeight = 75;
      
      if (doc.y + cardHeight > doc.page.height - 70) doc.addPage();
      
      const startX = left;
      const startY = doc.y;

      metrics.forEach((m, idx) => {
        const x = startX + (idx * (cardWidth + spacing));
        const color = m.color || "#1E3A8A";
        
        doc.save();
        doc.roundedRect(x, startY, cardWidth, cardHeight, 8).fill("#F8FAFC");
        doc.restore();

        doc.fillColor("#64748B").fontSize(8).font("Helvetica")
           .text(m.label, x, startY + 18, { width: cardWidth, align: "center" });
        
        doc.fillColor(color).fontSize(18).font("Helvetica-Bold")
           .text(m.value, x, startY + 38, { width: cardWidth, align: "center" });
      });

      doc.y = startY + cardHeight + 25;
    },
    alert: (text, type = "warning") => {
      const { left, right } = doc.page.margins;
      const innerWidth = doc.page.width - left - right;
      const alertWidth = innerWidth * 0.85; // Reduce width to 85%
      const alertX = left + (innerWidth - alertWidth) / 2; // Center horizontally

      const styles = {
        warning: { bg: "#FFFBEB", border: "#FDE68A", text: "#92400E", label: "Discrepancy Note" },
        error: { bg: "#FEF2F2", border: "#FECACA", text: "#B91C1C", label: "Error" },
        success: { bg: "#F0FDF4", border: "#BBF7D0", text: "#166534", label: "Verification" }
      };
      const style = styles[type] || styles.warning;
      const padding = 12;
      const label = style.label + ": ";
      const textHeight = doc.heightOfString(label + text, { width: alertWidth - (padding * 2) });
      const boxHeight = textHeight + (padding * 2);

      if (doc.y + boxHeight > doc.page.height - 70) doc.addPage();

      const currentY = doc.y;
      doc.save();
      doc.roundedRect(alertX, currentY, alertWidth, boxHeight, 4).fill(style.bg);
      doc.roundedRect(alertX, currentY, alertWidth, boxHeight, 4).lineWidth(0.5).strokeColor(style.border).stroke();
      doc.restore();

      doc.fillColor(style.text).fontSize(9).font("Helvetica-Bold")
         .text(label, alertX + padding, currentY + padding, { lineBreak: false });
      
      const labelWidth = doc.widthOfString(label);
      doc.font("Helvetica").text(text, alertX + padding + labelWidth, currentY + padding, { width: alertWidth - (padding * 2) - labelWidth });
      
      doc.y = currentY + boxHeight + 20;
    },
    table: ({ columns, rows, totals }) => {
      if (!rows || rows.length === 0) return;
      
      const startX = doc.page.margins.left;
      const totalWidth = columns.reduce((s, c) => s + (c.width || 100), 0);
      const headerHeight = 25;
      const rowHeight = 22;

      // Header
      if (doc.y + headerHeight + rowHeight > doc.page.height - 70) doc.addPage();
      
      let y = doc.y;
      doc.save().rect(startX, y, totalWidth, headerHeight).fill("#1E3A8A").restore();
      doc.fillColor("#FFFFFF").fontSize(8.5).font("Helvetica-Bold");
      let x = startX + 8;
      columns.forEach(c => {
        doc.text(c.header.toUpperCase(), x, y + 8, { width: (c.width || 100) - 10, align: c.align || "left" });
        x += (c.width || 100);
      });
      y += headerHeight;

      // Rows
      rows.forEach((row, idx) => {
        if (y + rowHeight > doc.page.height - 70) {
          doc.addPage();
          y = doc.y; // Starts at top + 80 because of auto header
          doc.save().rect(startX, y, totalWidth, headerHeight).fill("#1E3A8A").restore();
          doc.fillColor("#FFFFFF").fontSize(8.5).font("Helvetica-Bold");
          let hX = startX + 8;
          columns.forEach(c => {
            doc.text(c.header.toUpperCase(), hX, y + 8, { width: (c.width || 100) - 10, align: c.align || "left" });
            hX += (c.width || 100);
          });
          y += headerHeight;
        }

        if (idx % 2 === 1) {
          doc.save().rect(startX, y, totalWidth, rowHeight).fill("#F9FAFB").restore();
        }

        doc.save().moveTo(startX, y + rowHeight).lineTo(startX + totalWidth, y + rowHeight).strokeColor("#F1F5F9").lineWidth(0.5).stroke().restore();

        doc.fillColor("#334155").fontSize(8.5).font("Helvetica");
        x = startX + 8;
        columns.forEach(c => {
          let val = row[c.key];
          if (c.key === "status") {
            const isSuccess = String(val).toLowerCase().includes("closed") || String(val).toLowerCase().includes("delivered");
            doc.save();
            const badgeWidth = 48;
            const badgeX = x + ((c.width || 100) - badgeWidth - 16);
            doc.roundedRect(badgeX, y + 5, badgeWidth, 12, 6).fill(isSuccess ? "#DCFCE7" : "#FEE2E2");
            doc.fillColor(isSuccess ? "#166534" : "#991B1B").fontSize(7).font("Helvetica-Bold")
               .text(String(val).toUpperCase(), badgeX, y + 7, { width: badgeWidth, align: "center" });
            doc.restore();
          } else {
            doc.text(String(val ?? "-"), x, y + 7, { width: (c.width || 100) - 10, align: c.align || "left" });
          }
          x += (c.width || 100);
        });
        y += rowHeight;
      });

      // Totals row
      if (totals) {
        if (y + rowHeight > doc.page.height - 70) doc.addPage();
        doc.save().rect(startX, y, totalWidth, rowHeight).fill("#F1F5F9").restore();
        doc.fillColor("#1E293B").fontSize(8.5).font("Helvetica-Bold");
        x = startX + 8;
        columns.forEach(c => {
          if (totals[c.key]) {
            doc.text(String(totals[c.key]), x, y + 7, { width: (c.width || 100) - 10, align: c.align || "left" });
          }
          x += (c.width || 100);
        });
        y += rowHeight;
      }

      doc.y = y + 15;
    }
  };

  // IMPORTANT: Automatic Page Handling
  doc.on('pageAdded', () => {
    drawHeader();
  });

  // Start the document
  doc.addPage();
  
  try {
    contentBuilder(doc, helpers);
  } catch (err) {
    console.error("PDF Builder Error:", err);
  }

  // Finalize all pages with footers
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    drawFooter(i + 1, pages.count);
  }

  return doc;
};

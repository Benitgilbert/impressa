import PDFDocument from "pdfkit";

export const createabelusPDF = ({ title, companyName, subtitle }) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
  const pageWidth = doc.page.width;

  const drawHeader = () => {
    const { left, right, top } = doc.page.margins;
    const innerWidth = pageWidth - left - right;

    // Header Branding (Left)
    doc.fillColor("#1E3A8A").fontSize(24).font("Helvetica-Bold")
       .text((companyName || "ABELUS").toUpperCase(), left, top, { lineBreak: false });
    
    doc.fillColor("#6B7280").fontSize(10).font("Helvetica")
       .text("Custom Solutions", left, top + 26);

    // Header Title (Right)
    doc.fillColor("#6B7280").fontSize(14).font("Helvetica")
       .text(title || "Daily Performance Statement", left, top + 5, { align: "right", width: innerWidth });
    
    doc.fillColor("#9CA3AF").fontSize(9)
       .text(`Generated: ${new Date().toLocaleDateString()}`, left, top + 25, { align: "right", width: innerWidth });

    // Accent Line
    doc.moveTo(left, top + 50).lineTo(left + innerWidth, top + 50)
       .strokeColor("#1E3A8A").lineWidth(2).stroke();
    
    doc.y = top + 65;
  };

  const drawFooter = (pageNumber, totalPages) => {
    const { left, right, bottom } = doc.page.margins;
    const innerWidth = pageWidth - left - right;
    const footerY = doc.page.height - bottom - 20;

    doc.save();
    doc.moveTo(left, footerY).lineTo(left + innerWidth, footerY)
       .strokeColor("#E5E7EB").lineWidth(0.5).stroke();

    doc.fillColor("#9CA3AF").fontSize(8).font("Helvetica");
    const footerText = "abelus Custom Solutions | Kigali, Rwanda | info@abelus.rw | +250 788 000 000";
    doc.text(footerText, left, footerY + 10, { width: innerWidth, align: "center" });
    doc.text(`Page ${pageNumber} of ${totalPages}`, left, footerY + 22, { width: innerWidth, align: "center" });
    doc.restore();
  };

  const helpers = {
    section: (label) => {
      doc.moveDown(1.2);
      doc.fillColor("#1E3A8A").fontSize(12).font("Helvetica-Bold")
         .text(label.toUpperCase());
      doc.moveDown(0.4);
    },
    infoBox: (label, text) => {
      const { left } = doc.page.margins;
      const innerWidth = pageWidth - (doc.page.margins.left + doc.page.margins.right);
      const padding = 15;
      
      doc.font("Helvetica-Bold").fontSize(9.5);
      const labelStr = `${label}: `;
      const fullText = labelStr + text;
      const textHeight = doc.heightOfString(fullText, { width: innerWidth - (padding * 2) - 10 });
      const boxHeight = textHeight + (padding * 2);

      doc.save();
      doc.roundedRect(left, doc.y, innerWidth, boxHeight, 4).fill("#F8FAFC");
      doc.rect(left, doc.y, 4, boxHeight).fill("#1E3A8A");
      doc.restore();

      doc.fillColor("#1E293B").fontSize(9.5).font("Helvetica-Bold")
         .text(labelStr, left + padding + 5, doc.y + padding, { lineBreak: false });
      
      const labelWidth = doc.widthOfString(labelStr);
      doc.font("Helvetica").fillColor("#475569")
         .text(text, left + padding + 5 + labelWidth, doc.y + padding, { 
            width: innerWidth - (padding * 2) - 10 - labelWidth 
         });
      
      doc.y += boxHeight + 15;
    },
    metricCards: (metrics) => {
      const { left } = doc.page.margins;
      const innerWidth = pageWidth - (doc.page.margins.left + doc.page.margins.right);
      const spacing = 15;
      const cardWidth = (innerWidth - (spacing * (metrics.length - 1))) / metrics.length;
      const cardHeight = 70;
      const startX = left;
      const startY = doc.y;

      metrics.forEach((m, idx) => {
        const x = startX + (idx * (cardWidth + spacing));
        const color = m.color || "#3B82F6";
        
        doc.save();
        doc.roundedRect(x, startY, cardWidth, cardHeight, 8).fill("#F8FAFC");
        doc.restore();

        doc.fillColor("#64748B").fontSize(8).font("Helvetica")
           .text(m.label, x, startY + 15, { width: cardWidth, align: "center" });
        
        doc.fillColor(color).fontSize(18).font("Helvetica-Bold")
           .text(m.value, x, startY + 35, { width: cardWidth, align: "center" });
      });

      doc.y = startY + cardHeight + 20;
    },
    alert: (text, type = "warning") => {
      const { left } = doc.page.margins;
      const innerWidth = pageWidth - (doc.page.margins.left + doc.page.margins.right);
      const styles = {
        warning: { bg: "#FFFBEB", border: "#FDE68A", text: "#92400E", label: "Discrepancy Note" },
        error: { bg: "#FEF2F2", border: "#FECACA", text: "#B91C1C", label: "Error" },
        success: { bg: "#F0FDF4", border: "#BBF7D0", text: "#166534", label: "Verification" }
      };
      const style = styles[type] || styles.warning;
      const padding = 12;
      const label = style.label + ": ";
      const textHeight = doc.heightOfString(label + text, { width: innerWidth - (padding * 2) });
      const boxHeight = textHeight + (padding * 2);

      doc.save();
      doc.roundedRect(left, doc.y, innerWidth, boxHeight, 4).fill(style.bg);
      doc.roundedRect(left, doc.y, innerWidth, boxHeight, 4).lineWidth(0.5).strokeColor(style.border).stroke();
      doc.restore();

      doc.fillColor(style.text).fontSize(9).font("Helvetica-Bold")
         .text(label, left + padding, doc.y + padding, { lineBreak: false });
      
      const labelWidth = doc.widthOfString(label);
      doc.font("Helvetica").text(text, left + padding + labelWidth, doc.y + padding, { width: innerWidth - (padding * 2) - labelWidth });
      
      doc.y += boxHeight + 20;
    },
    table: ({ columns, rows, totals }) => {
      if (!rows || rows.length === 0) return;
      
      const startX = doc.page.margins.left;
      const totalWidth = columns.reduce((s, c) => s + (c.width || 100), 0);
      const headerHeight = 25;
      const rowHeight = 22;
      let y = doc.y;

      // Header
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
        if (y + rowHeight > doc.page.height - 80) {
          doc.addPage();
          y = doc.page.margins.top;
        }

        // Optional zebra striping
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

      doc.y = y + 10;
    }
  };

  drawHeader();

  try {
    contentBuilder(doc, helpers);
  } catch (err) {
    console.error("PDF Builder Error:", err);
  }

  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    drawFooter(i + 1, pages.count);
  }

  return doc;
};

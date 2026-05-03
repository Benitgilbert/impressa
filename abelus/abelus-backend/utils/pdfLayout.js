import PDFDocument from "pdfkit";

export const createabelusPDF = ({ title, contentBuilder, signatory, logoPath, companyName, subtitle }) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
  const pageWidth = doc.page.width;

  const drawHeader = () => {
    const { left, right, top } = doc.page.margins;
    const innerWidth = pageWidth - left - right;

    // Left Side: Company Branding
    doc.fillColor("#1E3A8A").fontSize(24).font("Helvetica-Bold")
       .text((companyName || "ABELUS").toUpperCase(), left, top);
    
    doc.fillColor("#6B7280").fontSize(10).font("Helvetica")
       .text("Custom Solutions", left, top + 28);

    // Right Side: Report Title
    doc.fillColor("#6B7280").fontSize(14).font("Helvetica")
       .text(title || "Daily Performance Statement", left, top + 5, { align: "right", width: innerWidth });
    
    doc.fillColor("#9CA3AF").fontSize(9)
       .text(subtitle || `Generated: ${new Date().toLocaleDateString()}`, left, top + 25, { align: "right", width: innerWidth });

    // Header Border Line
    doc.moveTo(left, top + 50).lineTo(left + innerWidth, top + 50)
       .strokeColor("#1E3A8A").lineWidth(2).stroke();
    
    doc.y = top + 65;
  };

  const drawFooter = (pageNumber) => {
    const { left, right, bottom } = doc.page.margins;
    const innerWidth = pageWidth - left - right;
    const footerY = doc.page.height - bottom - 20;

    doc.save();
    doc.moveTo(left, footerY).lineTo(left + innerWidth, footerY)
       .strokeColor("#E5E7EB").lineWidth(0.5).stroke();

    doc.fillColor("#9CA3AF").fontSize(8).font("Helvetica");
    const footerText = "abelus Custom Solutions | Kigali, Rwanda | info@abelus.rw | +250 788 000 000";
    doc.text(footerText, left, footerY + 8, { width: innerWidth, align: "center" });
    
    if (pageNumber) {
      doc.text(`Page ${pageNumber}`, left, footerY + 18, { width: innerWidth, align: "center" });
    }
    doc.restore();
  };

  const helpers = {
    section: (label) => {
      doc.moveDown(1.5);
      doc.fillColor("#1E3A8A").fontSize(11).font("Helvetica-Bold")
         .text(label.toUpperCase());
      doc.font("Helvetica");
      doc.moveDown(0.5);
    },
    infoBox: (label, text) => {
      const { left } = doc.page.margins;
      const innerWidth = pageWidth - (doc.page.margins.left + doc.page.margins.right);
      const padding = 15;
      
      doc.font("Helvetica-Bold").fontSize(9);
      const textHeight = doc.heightOfString(`${label}: ${text}`, { width: innerWidth - (padding * 2) - 10 });
      const boxHeight = textHeight + (padding * 2);

      doc.save();
      doc.roundedRect(left, doc.y, innerWidth, boxHeight, 4).fill("#F8FAFC");
      doc.rect(left, doc.y, 4, boxHeight).fill("#1E3A8A");
      doc.restore();

      doc.fillColor("#1E293B").fontSize(9).font("Helvetica-Bold")
         .text(`${label}: `, left + padding, doc.y + padding, { lineBreak: false });
      
      const labelWidth = doc.widthOfString(`${label}: `);
      doc.font("Helvetica").fillColor("#475569")
         .text(text, left + padding + labelWidth, doc.y + padding, { width: innerWidth - (padding * 2) - labelWidth });
      
      doc.y += boxHeight + 15;
    },
    metricCards: (metrics) => {
      const { left } = doc.page.margins;
      const innerWidth = pageWidth - (doc.page.margins.left + doc.page.margins.right);
      const spacing = 12;
      const cardWidth = (innerWidth - (spacing * (metrics.length - 1))) / metrics.length;
      const cardHeight = 65;
      const startX = left;
      const startY = doc.y;

      metrics.forEach((m, idx) => {
        const x = startX + (idx * (cardWidth + spacing));
        const color = m.color || "#3B82F6";
        
        doc.save();
        doc.roundedRect(x, startY, cardWidth, cardHeight, 6).fill(color + "0D"); // 5% opacity
        doc.restore();

        doc.fillColor("#64748B").fontSize(8).font("Helvetica")
           .text(m.label, x, startY + 15, { width: cardWidth, align: "center" });
        
        doc.fillColor(color).fontSize(16).font("Helvetica-Bold")
           .text(m.value, x, startY + 30, { width: cardWidth, align: "center" });
      });

      doc.y = startY + cardHeight + 20;
    },
    alert: (text, type = "warning") => {
      const { left } = doc.page.margins;
      const innerWidth = pageWidth - (doc.page.margins.left + doc.page.margins.right);
      const styles = {
        warning: { bg: "#FFFBEB", border: "#FDE68A", text: "#92400E" },
        error: { bg: "#FEF2F2", border: "#FECACA", text: "#B91C1C" },
        success: { bg: "#F0FDF4", border: "#BBF7D0", text: "#166534" }
      };
      const style = styles[type] || styles.warning;
      const padding = 12;
      const textHeight = doc.heightOfString(text, { width: innerWidth - (padding * 2) });
      const boxHeight = textHeight + (padding * 2);

      doc.save();
      doc.roundedRect(left, doc.y, innerWidth, boxHeight, 4).fill(style.bg);
      doc.roundedRect(left, doc.y, innerWidth, boxHeight, 4).lineWidth(0.5).strokeColor(style.border).stroke();
      doc.restore();

      doc.fillColor(style.text).fontSize(8.5).font("Helvetica-Bold")
         .text(text, left + padding, doc.y + padding, { width: innerWidth - (padding * 2) });
      
      doc.y += boxHeight + 20;
    },
    table: ({ columns, rows }) => {
      if (!rows || rows.length === 0) return;
      
      const startX = doc.page.margins.left;
      const totalWidth = columns.reduce((s, c) => s + (c.width || 100), 0);
      const headerHeight = 22;
      const rowHeight = 20;
      let y = doc.y;

      // Header
      doc.save().rect(startX, y, totalWidth, headerHeight).fill("#1E3A8A").restore();
      doc.fillColor("#FFFFFF").fontSize(8).font("Helvetica-Bold");
      let x = startX + 8;
      columns.forEach(c => {
        doc.text(c.header.toUpperCase(), x, y + 7, { width: (c.width || 100) - 10, ellipsis: true });
        x += (c.width || 100);
      });
      y += headerHeight;

      // Rows
      doc.font("Helvetica").fontSize(8.5);
      rows.forEach((row, idx) => {
        if (y + rowHeight > doc.page.height - 100) {
          doc.addPage();
          y = doc.page.margins.top;
        }

        doc.save().moveTo(startX, y + rowHeight).lineTo(startX + totalWidth, y + rowHeight).strokeColor("#F1F5F9").lineWidth(0.5).stroke().restore();

        doc.fillColor("#334155");
        x = startX + 8;
        columns.forEach(c => {
          let val = row[c.key];
          if (c.key === "status") {
            const isSuccess = String(val).toLowerCase().includes("closed") || String(val).toLowerCase().includes("delivered");
            doc.save();
            const badgeWidth = 45;
            const badgeX = x + ((c.width || 100) - badgeWidth - 16);
            doc.roundedRect(badgeX, y + 4, badgeWidth, 12, 6).fill(isSuccess ? "#DCFCE7" : "#FEE2E2");
            doc.fillColor(isSuccess ? "#166534" : "#991B1B").fontSize(7).font("Helvetica-Bold")
               .text(String(val).toUpperCase(), badgeX, y + 6, { width: badgeWidth, align: "center" });
            doc.restore();
          } else {
            doc.text(String(val ?? "-"), x, y + 6, { width: (c.width || 100) - 10 });
          }
          x += (c.width || 100);
        });
        y += rowHeight;
      });
      doc.y = y + 10;
    },
    card: (items, { title, columns = 3 } = {}) => {
      const { left } = doc.page.margins;
      const innerWidth = pageWidth - (doc.page.margins.left + doc.page.margins.right);
      const padding = 15;
      const rowHeight = 20;
      const rows = Math.ceil(Object.keys(items).length / columns);
      const titleHeight = title ? 25 : 0;
      const boxHeight = (rows * rowHeight) + titleHeight + (padding * 2);

      doc.save();
      doc.roundedRect(left, doc.y, innerWidth, boxHeight, 6).lineWidth(0.5).strokeColor("#E2E8F0").stroke();
      doc.restore();

      let currentY = doc.y + padding;
      if (title) {
        doc.fillColor("#1E293B").fontSize(10).font("Helvetica-Bold").text(title.toUpperCase(), left + padding, currentY);
        currentY += titleHeight;
      }

      doc.fontSize(8.5).font("Helvetica");
      const colWidth = (innerWidth - (padding * 2)) / columns;
      Object.entries(items).forEach(([k, v], idx) => {
        const col = idx % columns;
        const row = Math.floor(idx / columns);
        const x = left + padding + (col * colWidth);
        const y = currentY + (row * rowHeight);
        doc.fillColor("#64748B").text(`${k}: `, x, y, { lineBreak: false });
        const labelWidth = doc.widthOfString(`${k}: `);
        doc.fillColor("#1E293B").font("Helvetica-Bold").text(String(v), x + labelWidth, y);
        doc.font("Helvetica");
      });

      doc.y += boxHeight + 15;
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
    drawFooter(i + 1);
  }

  return doc;
};

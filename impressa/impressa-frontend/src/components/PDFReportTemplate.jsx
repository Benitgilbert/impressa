import React from 'react';

/**
 * Reusable PDF Report Template Component for Impressa
 * 
 * This component generates a professional PDF-ready layout with:
 * - Company header with logo
 * - Dynamic title section
 * - Summary metrics in grid format
 * - Data table with customizable columns
 * - Footer with contact info and signature section
 * 
 * Usage with react-pdf or html2pdf libraries
 */

const PDFReportTemplate = ({
  title = "Report",
  subtitle = "",
  summaryMetrics = [],
  tableColumns = [],
  tableData = [],
  signatory = {},
  generatedDate = new Date(),
  logoUrl = "/logo.png"
}) => {
  const styles = {
    page: {
      fontFamily: "'Helvetica', 'Arial', sans-serif",
      padding: "40px",
      maxWidth: "210mm",
      minHeight: "297mm",
      margin: "0 auto",
      backgroundColor: "#ffffff",
      position: "relative"
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      paddingBottom: "15px",
      borderBottom: "2px solid #E5E7EB",
      marginBottom: "20px"
    },
    headerLeft: {
      display: "flex",
      alignItems: "center",
      gap: "12px"
    },
    logo: {
      width: "50px",
      height: "50px",
      objectFit: "contain"
    },
    companyInfo: {
      display: "flex",
      flexDirection: "column"
    },
    companyName: {
      fontSize: "18px",
      fontWeight: "bold",
      color: "#111827",
      margin: "0"
    },
    tagline: {
      fontSize: "11px",
      color: "#6B7280",
      margin: "0"
    },
    headerRight: {
      textAlign: "right"
    },
    dateText: {
      fontSize: "10px",
      color: "#9CA3AF"
    },
    titleSection: {
      textAlign: "center",
      padding: "20px 0",
      marginBottom: "25px"
    },
    title: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#111827",
      margin: "0 0 5px 0"
    },
    subtitle: {
      fontSize: "12px",
      color: "#6B7280",
      margin: "0"
    },
    summaryBox: {
      backgroundColor: "#EFF6FF",
      border: "1px solid #BFDBFE",
      borderRadius: "8px",
      padding: "15px",
      marginBottom: "25px"
    },
    summaryTitle: {
      fontSize: "14px",
      fontWeight: "bold",
      color: "#1E40AF",
      marginBottom: "10px"
    },
    metricsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "12px",
      marginBottom: "25px"
    },
    metricCard: {
      backgroundColor: "#F9FAFB",
      border: "1px solid #E5E7EB",
      borderRadius: "6px",
      padding: "12px"
    },
    metricLabel: {
      fontSize: "10px",
      color: "#6B7280",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      marginBottom: "4px"
    },
    metricValue: {
      fontSize: "20px",
      fontWeight: "bold",
      color: "#111827"
    },
    sectionTitle: {
      fontSize: "14px",
      fontWeight: "bold",
      color: "#111827",
      marginBottom: "12px",
      paddingBottom: "6px",
      borderBottom: "1px solid #E5E7EB"
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      marginBottom: "20px",
      fontSize: "10px"
    },
    tableHeader: {
      backgroundColor: "#F3F4F6",
      borderBottom: "2px solid #D1D5DB"
    },
    th: {
      padding: "10px 8px",
      textAlign: "left",
      fontWeight: "600",
      color: "#374151",
      fontSize: "10px",
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    },
    td: {
      padding: "10px 8px",
      borderBottom: "1px solid #E5E7EB",
      color: "#111827",
      fontSize: "10px"
    },
    tableRowEven: {
      backgroundColor: "#FAFAFA"
    },
    signatureSection: {
      marginTop: "40px",
      paddingTop: "20px",
      borderTop: "1px solid #E5E7EB"
    },
    signatureGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "30px",
      marginTop: "15px"
    },
    signatureBlock: {
      textAlign: "center"
    },
    signatureLabel: {
      fontSize: "11px",
      color: "#6B7280",
      marginBottom: "8px"
    },
    signatureLine: {
      borderTop: "1px solid #9CA3AF",
      marginTop: "40px",
      paddingTop: "5px"
    },
    signatoryName: {
      fontSize: "12px",
      fontWeight: "bold",
      color: "#111827"
    },
    signatoryTitle: {
      fontSize: "10px",
      color: "#6B7280"
    },
    footer: {
      position: "absolute",
      bottom: "20px",
      left: "40px",
      right: "40px",
      textAlign: "center",
      fontSize: "9px",
      color: "#9CA3AF",
      borderTop: "1px solid #E5E7EB",
      paddingTop: "10px"
    },
    footerContent: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <img src={logoUrl} alt="Impressa Logo" style={styles.logo} />
          <div style={styles.companyInfo}>
            <h1 style={styles.companyName}>impressa</h1>
            <p style={styles.tagline}>Custom Solutions</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <p style={styles.dateText}>{generatedDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>
      </header>

      {/* Title Section */}
      <section style={styles.titleSection}>
        <h2 style={styles.title}>{title}</h2>
        {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
      </section>

      {/* Summary Metrics */}
      {summaryMetrics.length > 0 && (
        <>
          <h3 style={styles.sectionTitle}>Summary</h3>
          <div style={styles.metricsGrid}>
            {summaryMetrics.map((metric, idx) => (
              <div key={idx} style={styles.metricCard}>
                <div style={styles.metricLabel}>{metric.label}</div>
                <div style={styles.metricValue}>{metric.value}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Data Table */}
      {tableData.length > 0 && (
        <>
          <h3 style={styles.sectionTitle}>Details</h3>
          <table style={styles.table}>
            <thead style={styles.tableHeader}>
              <tr>
                {tableColumns.map((col, idx) => (
                  <th key={idx} style={styles.th}>{col.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, idx) => (
                <tr key={idx} style={idx % 2 === 0 ? {} : styles.tableRowEven}>
                  {tableColumns.map((col, colIdx) => (
                    <td key={colIdx} style={styles.td}>{row[col.key]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Signature Section */}
      <section style={styles.signatureSection}>
        <h3 style={styles.sectionTitle}>Approval</h3>
        <div style={styles.signatureGrid}>
          <div style={styles.signatureBlock}>
            <p style={styles.signatureLabel}>Prepared by</p>
            <div style={styles.signatureLine}>
              <p style={styles.signatoryName}>{signatory.preparedBy || "Administrator"}</p>
              <p style={styles.signatoryTitle}>{signatory.preparedTitle || "System Admin"}</p>
            </div>
          </div>
          <div style={styles.signatureBlock}>
            <p style={styles.signatureLabel}>Approved by</p>
            <div style={styles.signatureLine}>
              <p style={styles.signatoryName}>{signatory.approvedBy || "__________________"}</p>
              <p style={styles.signatoryTitle}>{signatory.approvedTitle || "Manager"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <span>impressa Custom Solutions | Kigali, Rwanda</span>
          <span>info@impressa.rw | +250 788 000 000</span>
          <span>Page 1</span>
        </div>
      </footer>
    </div>
  );
};

export default PDFReportTemplate;

/**
 * Example Usage:
 * 
 * import PDFReportTemplate from './PDFReportTemplate';
 * import html2pdf from 'html2pdf.js';
 * 
 * const exportPDF = () => {
 *   const element = document.getElementById('pdf-template');
 *   html2pdf()
 *     .from(element)
 *     .save('report.pdf');
 * };
 * 
 * <PDFReportTemplate
 *   title="Monthly Sales Report"
 *   subtitle="January 2025"
 *   summaryMetrics={[
 *     { label: "Total Orders", value: "1,234" },
 *     { label: "Revenue", value: "$45,678" },
 *     { label: "Delivered", value: "1,100" }
 *   ]}
 *   tableColumns={[
 *     { key: "id", header: "Order ID" },
 *     { key: "customer", header: "Customer" },
 *     { key: "amount", header: "Amount" }
 *   ]}
 *   tableData={[
 *     { id: "A1B2C3", customer: "John Doe", amount: "$250" },
 *     { id: "D4E5F6", customer: "Jane Smith", amount: "$180" }
 *   ]}
 *   signatory={{
 *     preparedBy: "Admin User",
 *     preparedTitle: "System Administrator",
 *     approvedBy: "Manager Name",
 *     approvedTitle: "Operations Manager"
 *   }}
 * />
 */

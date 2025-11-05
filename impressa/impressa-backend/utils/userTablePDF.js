import { createimpressaPDF } from "./pdfLayout.js";

export const generateUserTablePDF = ({ userRows, signatory, logoPath }) => {
  return createimpressaPDF({
    title: "User Table Report",
    logoPath,
    signatory: signatory || { name: "impressa Admin", title: "System Generated" },
    contentBuilder: (doc, helpers) => {
      helpers.table({
        columns: [
          { key: "name", header: "Name", width: 140 },
          { key: "email", header: "Email", width: 180 },
          { key: "role", header: "Role", width: 90 },
          { key: "createdAt", header: "Created At", width: 90 },
        ],
        rows: (userRows || []).map(u => ({
          name: u.name || "",
          email: u.email || "",
          role: u.role || "",
          createdAt: new Date(u.createdAt).toLocaleDateString()
        }))
      });
    }
  });
};

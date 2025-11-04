import mongoose from "mongoose";

const reportLogSchema = new mongoose.Schema({
  type: String,
  filters: Object,
  format: { type: String, default: "pdf" },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  viewedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  viewedAt: [Date],
  downloadedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  downloadedAt: [Date],
  timestamp: { type: Date, default: Date.now },
  aiSummary: { type: String, default: "" },
});

const ReportLog = mongoose.model("ReportLog", reportLogSchema);

export default ReportLog;
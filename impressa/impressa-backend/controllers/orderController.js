import path from "path";
import User from "../models/User.js";
import Order from "../models/Order.js";
import ReportLog from "../models/ReportLog.js";

import { buildReportData } from "../services/reportBuilders.js";
import { createimpressaPDF } from "../utils/pdfLayout.js";
import convertToCSV from "../utils/csvExporter.js";
import convertLogsToCSV from "../utils/logCsvExporter.js";
import generateAISummary from "../utils/aiSummary.js";
import sendReportEmail from "../utils/sendReportEmail.js";

// 📦 Place an order (customer only)
export const placeOrder = async (req, res) => {
  try {
    const order = new Order({
      product: req.body.product,
      customer: req.user.id,
      quantity: req.body.quantity || 1,
      customText: req.body.customText || null,
      customFile: req.body.customFile || null,
      cloudLink: req.body.cloudLink || null,
      cloudPassword: req.body.cloudPassword || null,
    });
    await order.save();
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// 📋 Get all orders (admin only)
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate("product customer");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔄 Update order status (admin only)
export const updateOrderStatus = async (req, res) => {
  try {
    const allowedStatuses = [
      "pending", "approved", "in-production", "ready", "delivered", "cancelled"
    ];
    const newStatus = req.body.status;

    if (!allowedStatuses.includes(newStatus)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: newStatus },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// 🔍 Filtered order view (admin only)
export const getFilteredOrders = async (req, res) => {
  try {
    const query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.customer) query.customer = req.query.customer;
    if (req.query.product) query.product = req.query.product;

    const orders = await Order.find(query)
      .populate("product", "name price")
      .populate("customer", "name email");

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📊 Order analytics (admin only)

export const getOrderAnalytics = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();

    const totalItemsAgg = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$quantity" } } }
    ]);
    const totalItems = totalItemsAgg[0]?.total || 0;

    const statusCounts = await Order.aggregate([
      { $group: { _id: "status", count: { $sum: 1 } } }
    ]);

    const productCounts = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: "$product", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $project: {
          _id: 0,
          productName: "$product.name",
          count: 1
        }
      }
    ]);

    const productQuantitiesAgg = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: "$product", totalQuantity: { $sum: "$quantity" } } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $project: {
          _id: 0,
          productName: "$product.name",
          totalQuantity: 1
        }
      },
      { $sort: { totalQuantity: -1 } }
    ]);

    const productQuantities = productQuantitiesAgg.map(p => ({
      productName: p.productName,
      totalQuantity: p.totalQuantity
    }));

    const topProductName = productQuantities[0]?.productName || "N/A";

    const customizationStatsAgg = await Order.aggregate([
      {
        $group: {
          _id: null,
          usedCustomText: {
            $sum: { $cond: [{ $ifNull: ["$customText", false] }, 1, 0] }
          },
          usedCustomFile: {
            $sum: { $cond: [{ $ifNull: ["$customFile", false] }, 1, 0] }
          },
          usedCloudLink: {
            $sum: { $cond: [{ $ifNull: ["$cloudLink", false] }, 1, 0] }
          }
        }
      }
    ]);
    const customizationStats = customizationStatsAgg[0] || {
      usedCustomText: 0,
      usedCustomFile: 0,
      usedCloudLink: 0
    };

    res.json({
      totalOrders,
      totalItems,
      topProductName,
      productQuantities,
      statusCounts,
      productCounts,
      customizationStats
    });
  } catch (err) {
    console.error("Order analytics failed:", err);
    res.status(500).json({ message: err.message });
  }
};
// 🧾 Generate report (admin only)
export const generateReport = async (req, res) => {
  try {
    const { type, format = "pdf", ...filters } = req.query;
    if (!type) return res.status(400).json({ message: "Report type is required." });

    const admin = await User.findById(req.user.id);
    if (!admin) return res.status(404).json({ message: "Admin profile not found." });

    const { orders, summary } = await buildReportData(type, filters);
    const aiSummary = generateAISummary(type, summary);

    await ReportLog.create({
      type,
      filters,
      generatedBy: admin._id,
      format,
      aiSummary,
    });

    await sendReportEmail({
      to: admin.email,
      subject: `📊 ${type.charAt(0).toUpperCase() + type.slice(1)} Report Ready`,
      text: `Your report has been generated.\n\nSummary:\n${aiSummary}`,
    });

    if (format === "csv") {
      const csv = convertToCSV(orders);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=${type}-report.csv`);
      return res.send(csv);
    }

    const logoPath = path.join(path.resolve(), "assets/logo.png");
    const doc = generateReportPDF(
      orders,
      summary,
      logoPath,
      {
        name: admin.name,
        title: admin.title || "impressa Administrator",
        signatureImage: admin.signatureImage,
        stampImage: admin.stampImage,
      },
      `${type.charAt(0).toUpperCase() + type.slice(1)} Report`
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=${type}-report.pdf`);
    doc.pipe(res);
    doc.end();
  } catch (err) {
    console.error(`${req.query.type} report generation failed:`, err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to generate report." });
    }
  }
};

// 📁 Get report logs
export const getReportLogs = async (req, res) => {
  try {
    const { type, format, user, from, to, page = 1, limit = 20 } = req.query;
    const query = {};
    if (type) query.type = type;
    if (format && format !== "csv") query.format = format;
    if (user) query.generatedBy = user;
    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = new Date(from);
      if (to) query.timestamp.$lte = new Date(to);
    }

    if (format === "csv") {
      const logs = await ReportLog.find(query)
        .populate("generatedBy", "name email")
        .sort({ timestamp: -1 });

      const csv = convertLogsToCSV(logs);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=report-logs.csv");
      return res.send(csv);
    }

    const logs = await ReportLog.find(query)
      .populate("generatedBy", "name email")
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await ReportLog.countDocuments(query);

    res.json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      logs,
    });
  } catch (err) {
    console.error("Failed to fetch report logs:", err);
    res.status(500).json({ message: "Failed to retrieve report logs." });
  }
};

// 👁️ Mark report as viewed
export const markReportViewed = async (req, res) => {
  try {
    const logId = req.params.id;
    const userId = req.user.id;

    await ReportLog.findByIdAndUpdate(logId, {
      $push: {
        viewedBy: userId,
        viewedAt: new Date(),
      },
    });

    res.json({ message: "Report marked as viewed." });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark report as viewed." });
  }
};

// 📥 Mark report as downloaded
export const markReportDownloaded = async (req, res) => {
  try {
    const logId = req.params.id;
    const userId = req.user.id;

    await ReportLog.findByIdAndUpdate(logId, {
      $push: {
        downloadedBy: userId,
        downloadedAt: new Date(),
      },
    });

    res.json({ message: "Report marked as downloaded." });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark report as downloaded." });
  }
};
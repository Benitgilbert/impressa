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
    const customFilePath = req.file ? `/uploads/${req.file.filename}` : (req.body.customFile || null);
    const order = new Order({
      product: req.body.product,
      customer: req.user?.id || null,
      quantity: req.body.quantity || 1,
      customText: req.body.customText || null,
      customFile: customFilePath,
      cloudLink: req.body.cloudLink || null,
      cloudPassword: req.body.cloudPassword || null,
    });
    order.publicId = generatePublicId();
    await order.save();
    res.status(201).json({ _id: order._id, publicId: order.publicId });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const placeOrderGuest = async (req, res) => {
  try {
    const customFilePath = req.file ? `/uploads/${req.file.filename}` : (req.body.customFile || null);
    const order = new Order({
      product: req.body.product,
      customer: null,
      guestName: req.body.guestName || null,
      guestEmail: req.body.guestEmail || null,
      guestPhone: req.body.guestPhone || null,
      quantity: req.body.quantity || 1,
      customText: req.body.customText || null,
      customFile: customFilePath,
      cloudLink: req.body.cloudLink || null,
      cloudPassword: req.body.cloudPassword || null,
    });
    order.publicId = generatePublicId();
    await order.save();
    res.status(201).json({ _id: order._id, publicId: order.publicId });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const trackPublicOrder = async (req, res) => {
  try {
    const id = req.params.id;
    let order = await Order.findOne({ publicId: id }).populate("product", "name price");
    if (!order && id.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(id).populate("product", "name price");
    }
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({
      publicId: order.publicId,
      product: order.product?.name,
      quantity: order.quantity,
      status: order.status,
      createdAt: order.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

function generatePublicId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusing chars
  let out = "";
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

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

    // Validate report type
    const validTypes = ["monthly", "daily", "custom-range", "customer", "status", "revenue"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: `Invalid report type. Must be one of: ${validTypes.join(", ")}` });
    }

    const admin = await User.findById(req.user.id);
    if (!admin) return res.status(404).json({ message: "Admin profile not found." });

    // Build report data with better error handling
    let orders, summary;
    try {
      const result = await buildReportData(type, filters);
      orders = result.orders;
      summary = result.summary;
    } catch (buildError) {
      console.error("buildReportData error:", buildError);
      return res.status(500).json({ message: `Failed to build report data: ${buildError.message}` });
    }

    const aiSummary = generateAISummary(type, summary);

    await ReportLog.create({
      type,
      filters,
      generatedBy: admin._id,
      format,
      aiSummary,
    });

    try {
      await sendReportEmail({
        to: admin.email,
        subject: `📊 ${type.charAt(0).toUpperCase() + type.slice(1)} Report Ready`,
        text: `Your report has been generated.\n\nSummary:\n${aiSummary}`,
      });
    } catch (e) {
      console.warn("sendReportEmail failed, continuing without email:", e.message);
    }

    if (format === "csv") {
      const csv = convertToCSV(orders);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=${type}-report.csv`);
      return res.send(csv);
    }

    // Check if logo exists, otherwise use null
    const logoPath = path.join(path.resolve(), "assets/logo.png");
    let finalLogoPath = null;
    try {
      const fs = await import('fs');
      if (fs.existsSync(logoPath)) {
        finalLogoPath = logoPath;
      } else {
        console.warn("Logo file not found at:", logoPath);
      }
    } catch (err) {
      console.warn("Could not check logo file:", err.message);
    }

    // Monthly business report extras (charts + metrics)
    let charts = null;
    let extraMetrics = {};
    let productRevenue = {};
    let productUnits = {};
    if (type === "monthly") {
      const { getChartImage, buildRevenueTimeConfig, buildOrdersVolumeConfig, buildTopProductsConfig } = await import("../utils/chartImages.js");

      // Determine start/end of the month
      const month = parseInt(filters.month || (new Date().getMonth() + 1));
      const year = parseInt(filters.year || new Date().getFullYear());
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);

      // Aggregate metrics
      let totalRevenue = 0;
      let deliveredCount = 0;
      productRevenue = {};
      productUnits = {};
      const customersInPeriod = new Set();
      orders.forEach(o => {
        const price = o.product?.price || 0;
        const rev = price * (o.quantity || 0);
        totalRevenue += (o.status === 'delivered' ? rev : 0);
        if (o.status === 'delivered') deliveredCount++;
        const name = o.product?.name || "Unknown";
        productRevenue[name] = (productRevenue[name] || 0) + rev;
        productUnits[name] = (productUnits[name] || 0) + (o.quantity || 0);
        if (o.customer?._id) customersInPeriod.add(String(o.customer._id));
      });
      const avgOrderValue = deliveredCount ? +(totalRevenue / deliveredCount).toFixed(2) : 0;

      // New customers = users created within month
      let newCustomers = 0;
      try {
        const UserModel = (await import('../models/User.js')).default;
        newCustomers = await UserModel.countDocuments({ createdAt: { $gte: start, $lt: end } });
      } catch { /* ignore */ }

      // Top product by revenue
      const topProduct = Object.entries(productRevenue).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'N/A';

      // Top customer by spend
      const spendByCustomer = {};
      orders.forEach(o => {
        const cid = String(o.customer?._id || o.customer);
        if (!cid) return;
        const price = o.product?.price || 0;
        const rev = price * (o.quantity || 0);
        spendByCustomer[cid] = (spendByCustomer[cid] || 0) + rev;
      });
      let topCustomerId = null, topCustomerSpend = 0;
      Object.entries(spendByCustomer).forEach(([cid, amt]) => {
        if (amt > topCustomerSpend) { topCustomerSpend = amt; topCustomerId = cid; }
      });
      let topCustomerName = 'N/A';
      if (topCustomerId) {
        try {
          const UserModel = (await import('../models/User.js')).default;
          const u = await UserModel.findById(topCustomerId).select('name email');
          topCustomerName = u?.name || u?.email || topCustomerId;
        } catch { /* ignore */ }
      }

      // Repeat vs new customer ratio (based on whether they had orders before this month)
      const customerIds = Array.from(customersInPeriod);
      let repeatCount = 0, newCount = 0;
      if (customerIds.length) {
        const priorOrders = await (await import('../models/Order.js')).default.find({
          customer: { $in: customerIds },
          createdAt: { $lt: start }
        }).select('customer');
        const priorSet = new Set(priorOrders.map(p => String(p.customer)));
        customerIds.forEach(id => priorSet.has(id) ? repeatCount++ : newCount++);
      }

      // Build day labels
      const dayCount = Math.ceil((end - start) / (1000*60*60*24));
      const labels = Array.from({ length: dayCount }, (_, i) => {
        const d = new Date(start); d.setDate(d.getDate() + i);
        return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      });
      const revenueSeries = Array(dayCount).fill(0);
      const ordersSeries = Array(dayCount).fill(0);
      orders.forEach(o => {
        const idx = Math.floor((new Date(o.createdAt) - start) / (1000*60*60*24));
        if (idx >= 0 && idx < dayCount) {
          const price = o.product?.price || 0;
          revenueSeries[idx] += price * (o.quantity || 0);
          ordersSeries[idx] += 1;
        }
      });

      // Top 5 products by revenue
      const top5 = Object.entries(productRevenue).sort((a,b)=>b[1]-a[1]).slice(0,5);
      const topProdLabels = top5.map(([name]) => name);
      const topProdData = top5.map(([,amt]) => Math.round(amt));

      // Fetch chart images (best-effort)
      try {
        const [revImg, ordImg, topImg] = await Promise.all([
          getChartImage(buildRevenueTimeConfig(labels, revenueSeries)),
          getChartImage(buildOrdersVolumeConfig(labels, ordersSeries)),
          getChartImage(buildTopProductsConfig(topProdLabels, topProdData))
        ]);
        charts = { revImg, ordImg, topImg };
      } catch (chartErr) {
        console.warn("Chart generation failed, continuing without charts:", chartErr.message);
        charts = null;
      }
      extraMetrics = { totalRevenue, totalOrders: orders.length, avgOrderValue, newCustomers, topProduct, topCustomerName, topCustomerSpend, repeatCount, newCount, month, year };
    }

    const monthTitle = (filters.month && filters.year) ? `Monthly Business Report – ${new Date(parseInt(filters.year), parseInt(filters.month)-1, 1).toLocaleDateString('en-US',{ month:'long', year:'numeric'})}` : `${type.charAt(0).toUpperCase() + type.slice(1)} Report`;

    const doc = createimpressaPDF({
      title: monthTitle,
      logoPath: finalLogoPath,
      signatory: {
        name: admin.name,
        title: admin.title || "impressa Administrator",
        signatureImage: admin.signatureImage,
        stampImage: admin.stampImage,
      },
      contentBuilder: (doc, helpers) => {
        try {
          // Executive Summary
          doc.fillColor("#1E40AF").fontSize(10).font("Helvetica-Bold");
          doc.text("Executive Summary", { underline: true });
          doc.font("Helvetica").moveDown(0.2);
          doc.fillColor("#374151").fontSize(9);
          doc.text(aiSummary);
          doc.moveDown(0.8);

          // Summary metrics
          doc.fillColor("#111827").fontSize(11).font("Helvetica-Bold");
          doc.text("Key Metrics", { underline: true });
          doc.font("Helvetica").moveDown(0.3);

          const metrics = type === 'monthly' ? [
            ["Total Revenue", `$${(extraMetrics.totalRevenue||0).toLocaleString()}`],
            ["Total Orders", (extraMetrics.totalOrders||0).toLocaleString()],
            ["Average Order Value", `$${(extraMetrics.avgOrderValue||0).toLocaleString()}`],
            ["New Customers", (extraMetrics.newCustomers||0).toLocaleString()],
            ["Top Product", extraMetrics.topProduct || 'N/A']
          ] : Object.entries(summary).map(([k,v]) => [k, String(v)]);

          const startY = doc.y; const leftX = doc.page.margins.left; const rightX = doc.page.width/2 + 10; const lh = 12;
          metrics.forEach(([k,v], idx) => {
            const col = idx % 2 === 0 ? 0 : 1; const row = Math.floor(idx/2);
            const x = col === 0 ? leftX : rightX; const y = startY + row*lh;
            doc.fillColor('#374151').fontSize(9).text(`${k}: ${v}`, x, y, { width: rightX - leftX - 30, lineBreak: false });
          });
          const rowsUsed = Math.ceil(metrics.length/2); doc.y = startY + rowsUsed*lh; doc.moveDown(0.6);

          if (type === 'monthly' && charts) {
            // Charts section
            doc.fillColor("#111827").fontSize(11).font("Helvetica-Bold");
            doc.text("Charts", { underline: true });
            doc.font("Helvetica").moveDown(0.3);

            const placeChart = (img) => {
              const innerWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
              const imgHeight = 160;
              const spacing = 16;
              let y = doc.y;
              const maxY = doc.page.height - doc.page.margins.bottom - 80;
              if (y + imgHeight > maxY) {
                doc.addPage();
                y = doc.y;
              }
              doc.image(img, doc.page.margins.left, y, { width: innerWidth, height: imgHeight });
              doc.y = y + imgHeight + spacing;
            };
            placeChart(charts.revImg);
            placeChart(charts.ordImg);
            placeChart(charts.topImg);
            doc.moveDown(0.4);

            // Product performance table
            doc.fillColor("#111827").fontSize(11).font("Helvetica-Bold");
            doc.text("Product Performance", { underline: true });
            doc.font("Helvetica").moveDown(0.3);
            const prodData = Object.keys({ ...productUnits, ...productRevenue }).map(name => ({
              name,
              units: (productUnits[name]||0),
              revenue: `$${Math.round(productRevenue[name]||0).toLocaleString()}`,
              returns: 0
            }));
            prodData.sort((a,b) => (parseInt(String(b.units)) - parseInt(String(a.units))));

            helpers.table({
              columns: [
                { key: 'name', header: 'Product Name', width: 180 },
                { key: 'units', header: 'Units Sold', width: 80 },
                { key: 'revenue', header: 'Revenue', width: 100 },
                { key: 'returns', header: 'Returns', width: 70 }
              ],
              rows: prodData.slice(0, 30)
            });

            // Customer insights
            doc.fillColor("#111827").fontSize(11).font("Helvetica-Bold");
            doc.text("Customer Insights", { underline: true });
            doc.font("Helvetica").moveDown(0.3);
            doc.fillColor('#374151').fontSize(9);
            doc.text(`Top customer by spend: ${extraMetrics.topCustomerName} ($${Math.round(extraMetrics.topCustomerSpend||0).toLocaleString()})`);
            doc.text(`Repeat vs new customers: ${extraMetrics.repeatCount||0} repeat / ${extraMetrics.newCount||0} new`);
            doc.moveDown(0.6);
          }

          // Orders table (fallback or additional)
          if (type !== 'monthly') {
            doc.fillColor("#111827").fontSize(11).font("Helvetica-Bold");
            doc.text("Order Details", { underline: true });
            doc.font("Helvetica").moveDown(0.3);

            const tableData = orders.slice(0, 30).map(o => ({
              id: o._id.toString().slice(-6).toUpperCase(),
              product: (o.product?.name || "N/A").substring(0, 22),
              customer: (o.customer?.name || o.customer?.email || "N/A").substring(0, 18),
              qty: String(o.quantity),
              status: o.status.charAt(0).toUpperCase() + o.status.slice(1),
              date: new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit" })
            }));

            helpers.table({
              columns: [
                { key: "id", header: "ID", width: 50 },
                { key: "product", header: "Product", width: 130 },
                { key: "customer", header: "Customer", width: 110 },
                { key: "qty", header: "Qty", width: 35 },
                { key: "status", header: "Status", width: 70 },
                { key: "date", header: "Date", width: 60 }
              ],
              rows: tableData
            });

            if (orders.length > 30) {
              doc.moveDown(0.3);
              doc.fillColor("#6B7280").fontSize(8).text(`Showing 30 of ${orders.length} orders. Download CSV for complete report.`, { align: "center" });
            }
          }
        } catch (contentError) {
          console.error("Content builder error:", contentError);
          doc.fillColor("#DC2626").fontSize(10);
          doc.text("Error generating detailed content. Please contact support.");
        }
      }
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=${type}-report.pdf`);
    doc.pipe(res);
    doc.end();
  } catch (err) {
    console.error(`${req.query.type} report generation failed:`, err);
    console.error("Error stack:", err.stack);
    if (!res.headersSent) {
      res.status(500).json({ 
        message: "Failed to generate report.",
        error: process.env.NODE_ENV === "development" ? err.message : undefined
      });
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
import path from "path";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import ReportLog from "../models/ReportLog.js";
import { recordTransaction } from "./financeController.js";
import Account from "../models/Account.js";
import CommissionSettings from "../models/CommissionSettings.js";
import SellerEarning from "../models/SellerEarning.js";

import { buildReportData } from "../services/reportBuilders.js";
import { createimpressaPDF } from "../utils/pdfLayout.js";
import convertToCSV from "../utils/csvExporter.js";
import convertLogsToCSV from "../utils/logCsvExporter.js";
import generateAISummary from "../utils/aiSummary.js";
import sendReportEmail from "../utils/sendReportEmail.js";
import { sendStatusUpdate } from "../services/emailService.js";
import { notifyAdminNewOrder, notifyOrderPlaced } from "./notificationController.js";

// 📦 Place an order (customer only) - Legacy/Single Item
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

// 🛒 Create Order from Cart (Multi-item)
export const createOrder = async (req, res) => {
  try {
    const { items, billingAddress, shippingAddress, totals, shipping, tax, paymentMethod, guestInfo } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Order must contain items" });
    }

    const orderItems = await Promise.all(items.map(async (item) => {
      const product = await Product.findById(item.product._id || item.product);
      return {
        product: item.product._id || item.product,
        seller: product ? product.seller : (item.product.seller || item.seller),
        productName: item.name,
        quantity: item.quantity,
        price: item.product.price || 0,
        cost: product ? (product.costPrice || 0) : 0,
        subtotal: (item.product.price || 0) * item.quantity,
        customizations: {
          customText: item.customText,
          cloudLink: item.cloudLink,
          cloudPassword: item.cloudPassword
        }
      };
    }));

    const order = new Order({
      customer: req.user?.id || null, // Optional if guest
      guestInfo: guestInfo || {},
      items: orderItems,
      billingAddress,
      shippingAddress,
      totals: {
        subtotal: totals.subtotal,
        shipping: shipping?.cost || 0,
        tax: tax?.totalTax || 0,
        discount: totals.discount || 0,
      }
    });

    order.publicId = generatePublicId();
    await order.save();

    // 💰 Automate Finance: Record Sales Transaction
    try {
      // Find System Accounts (seeded by seedFinance.js)
      const accounts = await Account.find({ code: { $in: ["1100", "2001", "4001"] } });
      const receivableAcc = accounts.find(a => a.code === "1100"); // Payment Gateway Receivable
      const payableAcc = accounts.find(a => a.code === "2001");    // Seller Payable
      const revenueAcc = accounts.find(a => a.code === "4001");    // Commission Revenue

      if (receivableAcc && payableAcc && revenueAcc) {
        // Fetch Commission Settings
        const settings = await CommissionSettings.getSettings();
        const commissionRate = (settings.defaultRate || 10) / 100;
        const subtotal = totals.subtotal || 0;
        const commissionAmount = subtotal * commissionRate;
        const sellerAmount = subtotal - commissionAmount;
        const grandTotal = totals.grandTotal || (subtotal + (shipping?.cost || 0) + (tax?.totalTax || 0));

        // Description
        const productNames = items.slice(0, 3).map(i => i.name).join(", ");
        const desc = `Order #${order.publicId} - ${productNames}${items.length > 3 ? "..." : ""}`;

        await recordTransaction({
          date: new Date(),
          description: desc,
          reference: order.publicId,
          type: "Sales",
          entries: [
            { account: receivableAcc._id, debit: grandTotal }, // We received full amount
            { account: payableAcc._id, credit: sellerAmount }, // We owe seller net amount
            { account: revenueAcc._id, credit: commissionAmount }, // Our profit
            // Note: Shipping/Tax should ideally be credited to respective liability accounts too
            // For simplicity, remaining amount is temporarily balanced to Receivable or Revenue
            // Let's add balancing entry to Revenue for Shipping/Tax for now or ignore if creating imbalance
          ],
          createdBy: req.user?._id
        });
        // Balance check: Debit (GrandTotal) vs Credit (SellerAmount + Commission)
        // GrandTotal = Subtotal + Shipping + Tax
        // Credit = (Subtotal * 0.9) + (Subtotal * 0.1) = Subtotal
        // Difference is Shipping + Tax.
        // We need to credit Shipping/Tax. Let's find those accounts or put to Revenue for now.
      }
    } catch (finErr) {
      console.error("Failed to record automated finance transaction", finErr);
      // Do not fail order creation
    }

    // 5. Create Operational Seller Earnings (for Payout Logic)
    try {
      if (req.user?.role !== "admin") { // Admins don't get 'seller earnings' in this context usually, or handled differently
        // Group items by seller
        const itemsBySeller = {};
        orderItems.forEach(item => {
          const sellerId = item.seller ? item.seller.toString() : "admin";
          if (!itemsBySeller[sellerId]) itemsBySeller[sellerId] = [];
          itemsBySeller[sellerId].push(item);
        });

        const settings = await CommissionSettings.getSettings();
        const rate = (settings.defaultRate || 10);

        for (const sellerId of Object.keys(itemsBySeller)) {
          if (sellerId === "admin") continue; // Skip admin

          for (const item of itemsBySeller[sellerId]) {
            const gross = item.subtotal;
            const commAmt = gross * (rate / 100);
            const net = gross - commAmt;

            await SellerEarning.create({
              seller: sellerId,
              order: order._id,
              orderPublicId: order.publicId,
              product: item.product,
              productName: item.productName,
              quantity: item.quantity,
              itemPrice: item.price,
              grossAmount: gross,
              commissionRate: rate,
              commissionAmount: commAmt,
              netAmount: net,
              status: "pending" // Pending until delivered/completed
            });
          }
        }
      }
    } catch (earnErr) {
      console.error("Failed to create seller earnings:", earnErr);
    }

    // 🔔 Send Notifications
    try {
      // 1. Notify Customer (if registered)
      if (req.user?.id) {
        notifyOrderPlaced(req.user.id, order._id, order.totals.grandTotal);
      }

      // 2. Notify Admin
      notifyAdminNewOrder(
        order._id,
        order.publicId,
        order.totals.grandTotal,
        req.user?.name || (order.guestInfo?.email ? `Guest (${order.guestInfo.email})` : 'Guest')
      );
    } catch (notifErr) {
      console.error("Notification Error:", notifErr);
    }

    res.status(201).json(order);
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ message: "Failed to create order", error: error.message });
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

// 🛍️ Guest places an order (no auth)
export const placeOrderGuest = placeOrder;

// 📜 Get my orders
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

// 🏪 Get Seller Orders
export const getSellerOrders = async (req, res) => {
  try {
    // Find orders where at least one item belongs to this seller
    const orders = await Order.find({ "items.seller": req.user.id })
      .populate("customer", "name email")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch seller orders" });
  }
};

// 📊 Get order analytics
export const getOrderAnalytics = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: "pending" });
    const processingOrders = await Order.countDocuments({ status: "processing" });
    const deliveredOrders = await Order.countDocuments({ status: "delivered" });
    const cancelledOrders = await Order.countDocuments({ status: "cancelled" });

    res.json({
      totalOrders,
      pendingOrders,
      processingOrders,
      deliveredOrders,
      cancelledOrders
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch order analytics" });
  }
};

// 🔍 Track public order
export const trackPublicOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ publicId: req.params.id });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Failed to track order" });
  }
};

// Helper to ensure default accounts exist
const ensureAccount = async (name, type, code) => {
  let account = await Account.findOne({ code });
  if (!account) {
    account = await Account.create({ name, type, code });
  }
  return account._id;
};

// 🔄 Update Order Status & Record Financials
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Order not found" });

    const oldStatus = order.status;
    order.status = status;

    if (status === "delivered" && oldStatus !== "delivered") {
      order.deliveredAt = new Date();

      // 💰 Financial Integration: Record Sale
      const cashAccountId = await ensureAccount("Cash on Hand", "Asset", "1000");
      const salesAccountId = await ensureAccount("Sales Revenue", "Revenue", "4000");

      // Generate description with product names
      const productNames = order.items.map(i => i.productName).join(", ");
      const description = `Order Delivered: ${productNames.length > 50 ? productNames.substring(0, 47) + "..." : productNames}`;

      await recordTransaction({
        date: new Date(),
        description: description,
        reference: order.publicId,
        type: "Sales",
        entries: [
          { account: cashAccountId, debit: order.totals.grandTotal },
          { account: salesAccountId, credit: order.totals.grandTotal }
        ],
        createdBy: req.user._id
      });

      // Update Seller Earnings to 'confirmed' (ready for payout)
      await SellerEarning.updateMany({ order: order._id }, { status: "confirmed" });
    }

    // 💰 Financial Integration: Handle Cancellation/Refund
    if (status === "cancelled" && oldStatus !== "cancelled") {
      // Only reverse if it was previously paid/delivered (where we recorded a transaction)
      // For MVP, assuming "delivered" triggered the sale.
      // If your flow records sale on "placed", change logic accordingly. 
      // Based on code above, sale is recorded on "delivered".

      if (oldStatus === "delivered") {
        const accounts = await Account.find({ code: { $in: ["1100", "2001", "4001"] } });
        const receivableAcc = accounts.find(a => a.code === "1100");
        const payableAcc = accounts.find(a => a.code === "2001");
        const revenueAcc = accounts.find(a => a.code === "4001");

        if (receivableAcc && payableAcc && revenueAcc) {
          const settings = await CommissionSettings.getSettings();
          let rate = settings.defaultRate || 10;

          // If it was a POS order, use POS rate
          if (order.orderType === 'pos') {
            rate = settings.posRate !== undefined ? settings.posRate : rate;
          }

          const commissionRate = rate / 100;
          const subtotal = order.totals.subtotal || 0;
          const commissionAmount = subtotal * commissionRate;
          const sellerAmount = subtotal - commissionAmount;
          const grandTotal = order.totals.grandTotal;

          await recordTransaction({
            date: new Date(),
            description: `Refund/Cancellation: Order #${order.publicId}`,
            reference: order.publicId,
            type: "Expense", // or Refund
            entries: [
              { account: receivableAcc._id, credit: grandTotal }, // Refund Customer (Credit Asset)
              { account: payableAcc._id, debit: sellerAmount },   // Cancel Seller Owed (Debit Liability)
              { account: revenueAcc._id, debit: commissionAmount } // Cancel Revenue (Debit Revenue)
            ],
            createdBy: req.user._id
          });
        }
      }

      // Cancel Seller Earnings so they are not paid out
      await SellerEarning.updateMany({ order: order._id }, { status: "cancelled" });
    }

    await order.save();
    // if (status !== oldStatus) await sendStatusUpdate(order);

    res.json(order);
  } catch (err) {
    console.error("Update order status failed:", err);
    res.status(500).json({ message: "Failed to update order status" });
  }
};

// 🏪 Create POS Order (Physical Sale) - Admin or Seller
export const createPOSOrder = async (req, res) => {
  try {
    const { items, paymentMethod, storeLocation } = req.body;
    const userRole = req.user.role;
    const userId = req.user._id;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Order must contain items" });
    }

    // 1. Calculate totals & Verify Stock
    let subtotal = 0;
    const orderItems = [];
    const sellerEarnings = {}; // Track earnings per seller

    for (const item of items) {
      const product = await Product.findById(item.product).populate('seller', 'name');
      if (!product) throw new Error(`Product not found: ${item.name}`);

      // For sellers, verify they own the product
      if (userRole === 'seller' && product.seller?._id?.toString() !== userId.toString()) {
        throw new Error(`You can only sell your own products: ${product.name}`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
      }

      // Deduct Stock
      product.stock -= item.quantity;
      product.salesCount += item.quantity;
      await product.save();

      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;

      // Track seller for this item
      const sellerId = product.seller?._id || userId; // Admin products = admin as seller

      orderItems.push({
        product: product._id,
        seller: sellerId,
        productName: product.name,
        productImage: product.image,
        quantity: item.quantity,
        price: product.price,
        cost: product.costPrice || 0,
        subtotal: itemSubtotal
      });

      // Accumulate earnings per seller
      if (!sellerEarnings[sellerId]) {
        sellerEarnings[sellerId] = 0;
      }
      sellerEarnings[sellerId] += itemSubtotal;
    }

    // Fetch Commission Settings
    const settings = await CommissionSettings.getSettings();
    const defaultRate = (settings.defaultRate || 10);
    const posRate = (settings.posRate !== undefined ? settings.posRate : defaultRate); // Fallback to default if not set

    // Choose which rate to use for this transaction
    // This is POS, so we use posRate
    const appliedRate = posRate;

    // 2. Create Order with channel tracking
    const order = new Order({
      customer: null, // Walk-in customer
      items: orderItems,
      orderType: "pos",
      channel: "store",
      storeLocation: storeLocation || "",
      processedBy: userId,
      totals: {
        subtotal,
        shipping: 0,
        tax: 0,
        discount: 0,
        grandTotal: subtotal
      },
      payment: {
        method: paymentMethod || "cash",
        status: "completed",
        paidAt: new Date()
      },
      status: "delivered",
      shipping: {
        method: "POS Pickup",
        deliveredAt: new Date()
      }
    });

    order.publicId = generatePublicId();
    await order.save();

    // 3. Record Financial Transaction
    try {
      const cashAccountId = await ensureAccount("Cash on Hand", "Asset", "1000");
      const salesAccountId = await ensureAccount("Sales Revenue", "Revenue", "4000");

      // 4. Determine Finance Logic based on Role
      if (userRole === "admin") {
        // ADMIN POS: Platform keeps 100% of cash and revenue
        const productNames = orderItems.map(i => i.productName).join(", ");
        const description = `POS Sale (Admin): ${productNames.length > 40 ? productNames.substring(0, 37) + "..." : productNames}`;

        await recordTransaction({
          date: new Date(),
          description: description,
          reference: order.publicId,
          type: "Sales",
          entries: [
            { account: cashAccountId, debit: subtotal },
            { account: salesAccountId, credit: subtotal }
          ],
          createdBy: userId
        });

        // Create Seller Earnings for sold items (if they belong to a seller)
        for (const item of orderItems) {
          if (item.seller && item.seller.toString() !== userId.toString()) {
            // Admin sold someone else's product -> Admin owes them money
            const gross = item.subtotal;
            const commAmt = gross * (appliedRate / 100);
            const net = gross - commAmt;

            await SellerEarning.create({
              seller: item.seller,
              order: order._id,
              orderPublicId: order.publicId,
              product: item.product,
              productName: item.productName,
              quantity: item.quantity,
              itemPrice: item.price,
              grossAmount: gross,
              commissionRate: appliedRate,
              commissionAmount: commAmt,
              netAmount: net,
              status: "pending" // Admin collected cash, so payout is Pending
            });
          }
          // If Admin sold Admin product -> No SellerEarning needed (or self-earning ignored)
        }

      } else if (userRole === "seller") {
        // SELLER POS: Seller keeps cash. Platform takes commission (if any).
        // We record a debt (Seller Payable) -> Platform Commission Revenue

        // Re-fetch settings just in case (or reuse) - actually we have appliedRate
        const commissionRate = appliedRate / 100;
        const commissionAmount = subtotal * commissionRate;

        // Create "Paid" Seller Earnings for records (since they already have the money)
        for (const item of orderItems) {
          const gross = item.subtotal;
          const commAmt = gross * (appliedRate / 100);
          const net = gross - commAmt;

          await SellerEarning.create({
            seller: userId,
            order: order._id,
            orderPublicId: order.publicId,
            product: item.product,
            productName: item.productName,
            quantity: item.quantity,
            itemPrice: item.price,
            grossAmount: gross,
            commissionRate: appliedRate,
            commissionAmount: commAmt,
            netAmount: net,
            status: "paid", // Seller has the cash!
            paidAt: new Date()
          });
        }

        // We only record if there is a commission
        if (commissionAmount > 0) {
          const accounts = await Account.find({ code: { $in: ["2001", "4001"] } });
          const payableAcc = accounts.find(a => a.code === "2001");    // Seller Payable (Liability)
          const revenueAcc = accounts.find(a => a.code === "4001");    // Commission Revenue

          if (payableAcc && revenueAcc) {
            await recordTransaction({
              date: new Date(),
              description: `POS Commission (Seller): Order #${order.publicId}`,
              reference: order.publicId,
              type: "Sales",
              entries: [
                // Debit Liability "Seller Payable" (reducing what we owe them from online sales)
                // effectively "charging" them the commission against their balance.
                { account: payableAcc._id, debit: commissionAmount },
                { account: revenueAcc._id, credit: commissionAmount }
              ],
              createdBy: userId
            });
          }
        }
      }
    } catch (finErr) {
      console.error("POS Finance Error:", finErr);
    }

    res.status(201).json(order);
  } catch (err) {
    console.error("POS Order failed:", err);
    res.status(500).json({ message: err.message || "Failed to process POS order" });
  }
};

// 🏪 Get Seller's Products for POS (only their inventory)
export const getSellerPOSProducts = async (req, res) => {
  try {
    const products = await Product.find({
      seller: req.user._id,
      stock: { $gt: 0 },
      visibility: 'public'
    })
      .select('name price stock image sku categories')
      .populate('categories', 'name')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: products
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

// 🏪 Get Admin/Impressa's Products for POS (only company inventory)
export const getAdminPOSProducts = async (req, res) => {
  try {
    // Get all admin users
    const adminUsers = await User.find({ role: 'admin' }).select('_id');
    const adminIds = adminUsers.map(u => u._id);

    // Products owned by admin OR products with no seller (legacy/direct uploads)
    const products = await Product.find({
      $or: [
        { seller: { $in: adminIds } },
        { seller: { $exists: false } },
        { seller: null }
      ],
      stock: { $gt: 0 }
    })
      .select('name price stock image sku categories')
      .populate('categories', 'name')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: products
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

// 🔍 Lookup Product by Barcode (for POS scanning)
export const lookupByBarcode = async (req, res) => {
  try {
    const { barcode, sellerId } = req.query;

    if (!barcode) {
      return res.status(400).json({ success: false, message: "Barcode is required" });
    }

    const normalizedBarcode = barcode.trim().toUpperCase();

    // Build query - if sellerId provided, filter by seller
    const query = {
      $or: [
        { barcode: normalizedBarcode },
        { sku: normalizedBarcode }
      ],
      stock: { $gt: 0 }
    };

    if (sellerId) {
      query.seller = sellerId;
    }

    const product = await Product.findOne(query)
      .select('_id name price stock barcode sku image seller')
      .populate('seller', 'name storeName');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or out of stock"
      });
    }

    res.json({
      success: true,
      product
    });
  } catch (err) {
    console.error("Barcode lookup error:", err);
    res.status(500).json({ success: false, message: "Lookup failed" });
  }
};

// Helper to generate public ID (if not imported)
const generatePublicId = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};
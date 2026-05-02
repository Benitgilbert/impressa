import prisma from "../prisma.js";
import crypto from "crypto";
import logger from "../config/logger.js";
import { recordTransaction } from "./financeController.js";
import { sendOrderConfirmation, sendGiftCardEmail, sendStatusUpdate } from "../utils/emailService.js";
import { notifyAdminNewOrder, notifyOrderPlaced, notifyOrderStatus } from "./notificationController.js";

// --- UTILITIES ---

/**
 * Generate a random public ID for orders
 */
const generatePublicId = () => {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
};

/**
 * Generate a unique gift card code
 */
const generateGiftCardCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "ABEL-"; 
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
    if (i === 3) code += "-";
  }
  return code;
};

/**
 * Ensure a financial account exists, creating it if necessary
 */
const ensureAccount = async (name, type, code) => {
  let account = await prisma.account.findUnique({ where: { code } });
  if (!account) {
    account = await prisma.account.create({ data: { name, type, code } });
  }
  return account.id;
};

/**
 * Get current platform commission settings
 */
const getCommissionSettings = async () => {
  let settings = await prisma.commissionSettings.findFirst();
  if (!settings) {
    settings = await prisma.commissionSettings.create({
      data: { defaultRate: 10 }
    });
  }
  return settings;
};

// --- CONTROLLERS ---

/**
 * 📦 Place an order (legacy/single item)
 */
export const placeOrder = async (req, res) => {
  try {
    const { product, quantity = 1, customText, customFile, cloudLink, cloudPassword } = req.body;
    const customFilePath = req.file ? req.file.path : (customFile || null);

    const order = await prisma.order.create({
      data: {
        publicId: generatePublicId(),
        customerId: req.user?.id || null,
        items: {
          create: [{
            productId: product,
            quantity: Number(quantity),
            customizations: {
              customText,
              customFile: customFilePath,
              cloudLink,
              cloudPassword
            },
            productName: "Legacy Product", // Default name if not fetched
            price: 0,
            subtotal: 0
          }]
        }
      }
    });

    res.status(201).json({ id: order.id, publicId: order.publicId });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * 📦 Place an order (guest)
 */
export const placeOrderGuest = async (req, res) => {
  try {
    const { product, quantity = 1, customText, customFile, cloudLink, cloudPassword, guestInfo } = req.body;
    const customFilePath = req.file ? req.file.path : (customFile || null);

    const order = await prisma.order.create({
      data: {
        publicId: generatePublicId(),
        customerId: null,
        guestInfo: guestInfo || {},
        items: {
          create: [{
            productId: product,
            quantity: Number(quantity),
            customizations: {
              customText,
              customFile: customFilePath,
              cloudLink,
              cloudPassword
            },
            productName: "Guest Order Product",
            price: 0,
            subtotal: 0
          }]
        }
      }
    });

    res.status(201).json({ id: order.id, publicId: order.publicId });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * 🛒 Create Order from Cart (Multi-item)
 */
export const createOrder = async (req, res) => {
  try {
    const { items, billingAddress, shippingAddress, totals, shipping, tax, giftCard } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Order must contain items" });
    }

    // 🔒 Atomic transaction: stock validation + decrement + order creation
    const order = await prisma.$transaction(async (tx) => {
      const orderItemsData = [];

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.product.id || item.product },
          include: { variations: true }
        });

        if (!product) throw new Error(`Product not found: ${item.name}`);

        // Stock Deduction (atomic — uses WHERE to prevent overselling)
        if (item.variationId) {
          const variation = product.variations.find(v => v.sku === item.variationId);
          if (!variation) throw new Error(`Variation ${item.variationId} not found`);

          const decrementQty = Number(item.quantity) * (item.conversionFactor || variation.conversionFactor || 1);
          const updatedVariation = await tx.productVariation.updateMany({
            where: { id: variation.id, stock: { gte: Number(item.quantity) } },
            data: { stock: { decrement: Number(item.quantity) } }
          });
          if (updatedVariation.count === 0) throw new Error(`Insufficient stock for ${product.name} (Variation)`);

          await tx.product.update({
            where: { id: product.id },
            data: { stock: { decrement: decrementQty }, salesCount: { increment: decrementQty } }
          });
        } else {
          const updated = await tx.product.updateMany({
            where: { id: product.id, stock: { gte: Number(item.quantity) } },
            data: { stock: { decrement: Number(item.quantity) }, salesCount: { increment: Number(item.quantity) } }
          });
          if (updated.count === 0) throw new Error(`Insufficient stock for ${product.name}`);
        }

        orderItemsData.push({
          productId: product.id,
          sellerId: product.sellerId,
          productName: item.name || product.name,
          quantity: Number(item.quantity),
          price: Number(item.price || product.price || 0),
          cost: Number(product.costPrice || 0),
          subtotal: Number((item.price || product.price || 0) * item.quantity),
          customizations: {
            customText: item.customText,
            cloudLink: item.cloudLink,
            cloudPassword: item.cloudPassword
          }
        });
      }

      return tx.order.create({
        data: {
          publicId: generatePublicId(),
          customerId: req.user?.id || null,
          guestInfo: req.user ? null : req.body.guestInfo || {},
          billingAddress,
          shippingAddress,
          subtotal: Number(totals.subtotal),
          shippingCost: Number(shipping?.cost || 0),
          tax: Number(tax?.totalTax || 0),
          discount: Number(totals.discount || 0),
          grandTotal: Number(totals.grandTotal),
          items: {
            create: orderItemsData
          }
        },
        include: { items: true, customer: { select: { id: true, name: true, email: true } } }
      });
    }); // End $transaction

    // 📧 Confirmation Email
    try {
      await sendOrderConfirmation(order);
    } catch (emailErr) {
      console.error("Failed to send order confirmation email:", emailErr);
    }

    // 🎁 Gift Card Redemption
    if (giftCard && giftCard.code && giftCard.amountApplied > 0) {
      try {
        const gc = await prisma.giftCard.findUnique({
          where: { code: giftCard.code.toUpperCase() }
        });
        if (gc && gc.isActive && gc.balance >= giftCard.amountApplied) {
          const newBalance = gc.balance - giftCard.amountApplied;
          await prisma.giftCard.update({
            where: { id: gc.id },
            data: {
              balance: newBalance,
              isActive: newBalance > 0
            }
          });
        }
      } catch (gcErr) {
        console.error("Gift card redemption error:", gcErr);
      }
    }

    // 💰 Finance Recording
    try {
      const receivableAccId = await ensureAccount("Payment Gateway Receivable", "Asset", "1100");
      const payableAccId = await ensureAccount("Seller Payable", "Liability", "2001");
      const revenueAccId = await ensureAccount("Commission Revenue", "Revenue", "4001");

      const settings = await getCommissionSettings();
      const commissionRate = (settings.defaultRate || 10) / 100;
      const subtotal = Number(totals.subtotal || 0);
      const commissionAmount = subtotal * commissionRate;
      const sellerAmount = subtotal - commissionAmount;
      const grandTotal = order.grandTotal;

      const productNames = items.slice(0, 3).map(i => i.name).join(", ");
      const desc = `Order #${order.publicId} - ${productNames}${items.length > 3 ? "..." : ""}`;

      await recordTransaction({
        date: new Date(),
        description: desc,
        reference: order.publicId,
        type: "Sales",
        entries: [
          { accountId: receivableAccId, debit: grandTotal },
          { accountId: payableAccId, credit: sellerAmount },
          { accountId: revenueAccId, credit: commissionAmount },
        ],
        createdBy: req.user?.id
      });
    } catch (finErr) {
      console.error("Failed to record finance transaction:", finErr);
    }

    // 💰 Seller Earnings
    try {
      const settings = await getCommissionSettings();
      const rate = (settings.defaultRate || 10);

      for (const item of order.items) {
        if (!item.sellerId) continue;

        const gross = item.subtotal;
        const commAmt = gross * (rate / 100);
        const net = gross - commAmt;

        await prisma.sellerEarning.create({
          data: {
            sellerId: item.sellerId,
            orderId: order.id,
            orderPublicId: order.publicId,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            itemPrice: item.price,
            grossAmount: gross,
            commissionRate: rate,
            commissionAmount: commAmt,
            netAmount: net,
            status: "pending"
          }
        });
      }
    } catch (earnErr) {
      console.error("Failed to create seller earnings:", earnErr);
    }

    // 🔔 Notifications & Gift Card Automation
    try {
      if (req.user?.id) {
        notifyOrderPlaced(req.user.id, order.id, order.grandTotal);
      }

      for (const item of order.items) {
        if (item.productName?.toLowerCase().includes("gift card")) {
          const recipientMatch = item.customizations?.customText?.match(/Recipient:\s*([^\s,]+)/i);
          const recipientEmail = recipientMatch ? recipientMatch[1].trim() : (order.guestInfo?.email || order.customer?.email);

          const gcCode = generateGiftCardCode();
          const newGc = await prisma.giftCard.create({
            data: {
              code: gcCode,
              initialValue: item.price,
              balance: item.price,
              userId: req.user?.id || null,
              isActive: true,
              // recipient info would typically go in custom fields or user profile
            }
          });
          await sendGiftCardEmail(newGc, req.user?.name || order.guestInfo?.name || "A friend");
        }
      }

      notifyAdminNewOrder(order.id, order.publicId, order.grandTotal, req.user?.name || "Guest");
    } catch (notifErr) {
      console.error("Notification Error:", notifErr);
    }

    res.status(201).json(order);
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ message: "Failed to create order", error: error.message });
  }
};

/**
 * 🖨️ Create Service Inquiry (Print Portal)
 */
export const createInquiry = async (req, res) => {
  try {
    const { serviceId, quantity, notes } = req.body;
    const userId = req.user?.id;

    if (!serviceId) {
      return res.status(400).json({ message: "Service ID is required" });
    }

    const product = await prisma.product.findUnique({
      where: { id: serviceId }
    });

    if (!product || product.type !== 'service') {
      return res.status(404).json({ message: "Service not found" });
    }

    let filePath = "";
    if (req.file) {
      filePath = req.file.path;
    } else if (req.files && req.files.length > 0) {
      filePath = req.files[0].path;
    }

    const order = await prisma.order.create({
      data: {
        publicId: `INQ-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        orderType: "online",
        channel: "website",
        status: "quote_requested",
        customerId: userId || null,
        subtotal: 0,
        grandTotal: 0,
        paymentStatus: "pending",
        items: {
          create: [{
            productId: product.id,
            sellerId: product.sellerId,
            productName: product.name,
            quantity: Number(quantity) || 1,
            price: product.price, // Base price for reference
            subtotal: 0,
            customizations: {
              customFile: filePath,
              customerNotes: notes
            }
          }]
        }
      }
    });

    res.status(201).json({ success: true, order });
  } catch (err) {
    console.error("Inquiry Error:", err);
    res.status(500).json({ message: "Failed to send inquiry" });
  }
};

/**
 * 🖨️ Submit Print Quote
 * Moves an inquiry from 'quote_requested' to 'awaiting_payment' with a specific price.
 */
export const submitPrintQuote = async (req, res) => {
  try {
    const { orderId, quoteAmount } = req.body;
    const sellerId = req.user.role === 'cashier' ? req.user.managedById : req.user.id;

    if (!orderId || !quoteAmount) {
      return res.status(400).json({ message: "Order ID and Quote Amount are required" });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    // Verify seller owns at least one item in the order
    const ownsItem = order.items.some(item => item.sellerId === sellerId);
    if (!ownsItem && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to quote for this order" });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        subtotal: Number(quoteAmount),
        grandTotal: Number(quoteAmount), // Simplification: assuming no tax/shipping for basic quote
        status: "awaiting_payment",
        paymentStatus: "pending"
      }
    });

    // Notify customer (Add notification logic here if needed)
    
    res.json({ success: true, message: "Quote submitted successfully", order: updatedOrder });
  } catch (err) {
    console.error("Submit Quote Error:", err);
    res.status(500).json({ message: "Failed to submit quote" });
  }
};

/**
 * 🔄 Update Order Status
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, customer: { select: { id: true, name: true, email: true } } }
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    const oldStatus = order.status;
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        deliveredAt: status === "delivered" ? new Date() : order.deliveredAt
      },
      include: { items: true, customer: { select: { id: true, name: true, email: true } } }
    });

    // 📧 Email
    if (oldStatus !== status) {
      sendStatusUpdate(updatedOrder).catch(err => console.error("Failed to send status email:", err));
    }

    // 🚨 Violation Logic (Fulfillment Delay)
    if (status === "shipped" && oldStatus !== "shipped") {
      const hoursTaken = (new Date() - new Date(order.createdAt)) / 3600000;
      if (hoursTaken > 72 && order.items[0]?.sellerId) {
        await prisma.violation.create({
          data: {
            sellerId: order.items[0].sellerId,
            type: 'slow_fulfillment',
            severity: 'low',
            status: 'active',
            penaltyPoints: 1,
            description: `Order #${order.publicId} fulfilled in ${Math.round(hoursTaken)}h (>72h)`,
            metrics: { currentValue: Math.round(hoursTaken), threshold: 72 }
          }
        });
      }
    }

    // 💰 Financials on Delivery
    if (status === "delivered" && oldStatus !== "delivered") {
      const cashAccId = await ensureAccount("Cash on Hand", "Asset", "1000");
      const salesAccId = await ensureAccount("Sales Revenue", "Revenue", "4000");

      const productNames = order.items.map(i => i.productName).join(", ");
      const desc = `Order Delivered: ${productNames.length > 50 ? productNames.substring(0, 47) + "..." : productNames}`;

      await recordTransaction({
        date: new Date(),
        description: desc,
        reference: order.publicId,
        type: "Sales",
        entries: [
          { accountId: cashAccId, debit: order.grandTotal },
          { accountId: salesAccId, credit: order.grandTotal }
        ],
        createdBy: req.user.id
      });

      await prisma.sellerEarning.updateMany({
        where: { orderId: order.id },
        data: { status: "confirmed" }
      });
    }

    // 💰 Financials on Cancellation
    if (status === "cancelled" && oldStatus !== "cancelled") {
      if (req.user.role === 'seller') {
        await prisma.violation.create({
          data: {
            sellerId: req.user.id,
            type: 'high_cancellation_rate',
            severity: 'medium',
            status: 'active',
            penaltyPoints: 3,
            description: `Seller cancelled Order #${order.publicId}`
          }
        });
      }

      if (oldStatus === "delivered") {
        const receivableAccId = await ensureAccount("Payment Gateway Receivable", "Asset", "1100");
        const payableAccId = await ensureAccount("Seller Payable", "Liability", "2001");
        const revenueAccId = await ensureAccount("Commission Revenue", "Revenue", "4001");

        const settings = await getCommissionSettings();
        const rate = (order.orderType === 'pos' ? (settings.posRate || 10) : (settings.defaultRate || 10)) / 100;
        const commissionAmount = (order.subtotal || 0) * rate;
        const sellerAmount = (order.subtotal || 0) - commissionAmount;

        await recordTransaction({
          date: new Date(),
          description: `Refund/Cancellation: Order #${order.publicId}`,
          reference: order.publicId,
          type: "Expense",
          entries: [
            { accountId: receivableAccId, credit: order.grandTotal },
            { accountId: payableAccId, debit: sellerAmount },
            { accountId: revenueAccId, debit: commissionAmount }
          ],
          createdBy: req.user.id
        });
      }

      await prisma.sellerEarning.updateMany({
        where: { orderId: order.id },
        data: { status: "cancelled" }
      });
    }

    if (updatedOrder.customerId) {
      notifyOrderStatus(updatedOrder.customerId, updatedOrder.id, status);
    }

    res.json(updatedOrder);
  } catch (err) {
    console.error("Update order status failed:", err);
    res.status(500).json({ message: "Failed to update order status" });
  }
};

/**
 * 🏪 Create POS Order
 */
export const createPOSOrder = async (req, res) => {
  try {
    const { items, paymentMethod, storeLocation, clientId } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Order must contain items" });
    }

    // Fetch contract prices if clientId is provided
    let contractPrices = [];
    if (clientId) {
      contractPrices = await prisma.contractPrice.findMany({
        where: { clientId }
      });
    }

    const settings = await getCommissionSettings();
    const appliedRate = settings.posRate || settings.defaultRate || 10;

    // 🔒 Atomic transaction: stock validation + decrement + order creation
    const { order, orderItemsData, subtotal } = await prisma.$transaction(async (tx) => {
      let txSubtotal = 0;
      const txOrderItemsData = [];

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.product },
          include: { variations: true }
        });

        if (!product) throw new Error(`Product not found`);
        
        // Ownership check
        const effectiveSellerId = userRole === 'cashier' ? req.user.managedById : userId;
        if (userRole === 'seller' && product.sellerId !== userId) {
          throw new Error(`You can only sell your own products: ${product.name}`);
        }
        if (userRole === 'cashier' && product.sellerId !== effectiveSellerId) {
          throw new Error(`Unauthorized: This product does not belong to your store.`);
        }

        // 💰 Price Logic
        let price = item.price || product.price;
        if (!item.price) {
          const cp = contractPrices.find(p => p.productId === product.id);
          if (cp) price = cp.price;
        }

        let productName = product.name;

        if (item.variationId) {
          const variation = product.variations.find(v => v.sku === item.variationId);
          if (!variation) throw new Error(`Variation ${item.variationId} not found`);
          
          // 📦 Multi-unit Stock Logic:
          // We use a "Single Source of Truth" pool (product.stock).
          // If selling a Packet (Factor 5), we subtract 5 from the pool.
          if (product.type !== 'service') {
            const decrementQty = Number(item.quantity) * (variation.conversionFactor || 1);
            
            // Validate against master stock
            if (product.stock < decrementQty) {
              throw new Error(`Insufficient total stock for ${product.name}`);
            }

            // We update the variation stock too just for display/legacy consistency, 
            // but the master pool is the Product record.
            await tx.productVariation.update({
              where: { id: variation.id },
              data: { stock: { decrement: Number(item.quantity) } }
            });
          }
          
          if (!item.price) price = variation.price;
          const attrs = variation.attributes || {};
          productName = `${product.name} - ${Object.values(attrs).join(" / ")}`;
        } else {
          if (product.type !== 'service') {
            const updated = await tx.product.updateMany({
              where: { id: product.id, stock: { gte: Number(item.quantity) } },
              data: { stock: { decrement: Number(item.quantity) }, salesCount: { increment: Number(item.quantity) } }
            });
            if (updated.count === 0) throw new Error(`Insufficient stock for ${product.name}`);
          }
        }

        // Update product sales count (and stock for variations, since updateMany above only handles non-variation)
        if (item.variationId || product.type === 'service') {
          const variation = item.variationId ? product.variations.find(v => v.sku === item.variationId) : null;
          const decrementQty = Number(item.quantity) * (item.conversionFactor || variation?.conversionFactor || 1);
          
          await tx.product.update({
            where: { id: product.id },
            data: {
              ...(product.type !== 'service' && item.variationId && { stock: { decrement: decrementQty } }),
              salesCount: { increment: decrementQty }
            }
          });
        }

        const itemSubtotal = price * Number(item.quantity);
        txSubtotal += itemSubtotal;
        txOrderItemsData.push({
          productId: product.id,
          sellerId: product.sellerId,
          productName,
          quantity: Number(item.quantity),
          price,
          cost: Number(product.costPrice || 0),
          subtotal: itemSubtotal
        });
      }

      const txOrder = await tx.order.create({
        data: {
          publicId: generatePublicId(),
          orderType: "pos",
          channel: "store",
          storeLocation: storeLocation || "",
          processedById: userId,
          subtotal: txSubtotal,
          grandTotal: txSubtotal,
          paymentMethod: paymentMethod || "cash",
          paymentStatus: "completed",
          paidAt: new Date(),
          status: "delivered",
          items: {
            create: txOrderItemsData
          }
        }
      });

      // 👥 Abonne Debt Recording (Inside Transaction)
      if (clientId) {
        const cashCollected = Number(req.body.upfrontCashPaid) || 0;
        let remainingUpfront = cashCollected;

        const transactions = txOrderItemsData.map(item => {
          let paidForItem = 0;
          if (remainingUpfront >= item.subtotal) {
            paidForItem = item.subtotal;
            remainingUpfront -= item.subtotal;
          } else if (remainingUpfront > 0) {
            paidForItem = remainingUpfront;
            remainingUpfront = 0;
          }

          const debtAmount = item.subtotal - paidForItem;

          return {
            clientId: clientId,
            orderId: txOrder.id,
            responsibleId: userId,
            // shiftId will be linked later or we can fetch it here if needed
            designation: item.productName,
            quantity: item.quantity,
            pu: item.price,
            pt: item.subtotal,
            amountPaid: paidForItem,
            debtAmount: debtAmount,
            status: debtAmount === 0 ? "paid" : (paidForItem > 0 ? "partially_paid" : "unpaid")
          };
        });

        await tx.abonneTransaction.createMany({
          data: transactions
        });

        await tx.clientAbonne.update({
          where: { id: clientId },
          data: { totalDebt: { increment: txSubtotal - cashCollected } }
        });
      }

      return { order: txOrder, orderItemsData: txOrderItemsData, subtotal: txSubtotal };
    }); // End $transaction

    const activeShift = await prisma.shift.findFirst({
      where: { userId: userId, status: "open" }
    });

    // Link transactions to shift if active
    if (activeShift && clientId) {
      await prisma.abonneTransaction.updateMany({
        where: { orderId: order.id },
        data: { shiftId: activeShift.id }
      });
    }

    // 🕒 Shift Update
    try {
      if (activeShift) {
        const cashCollected = paymentMethod === "client_abonne" ? (Number(req.body.upfrontCashPaid) || 0) : (paymentMethod === "cash" || !paymentMethod ? subtotal : 0);
        const momoCollected = paymentMethod === "mtn_momo" ? subtotal : 0;
        const otherCollected = (paymentMethod !== "cash" && paymentMethod !== "mtn_momo" && paymentMethod !== "client_abonne") ? subtotal : 0;

        await prisma.shift.update({
          where: { id: activeShift.id },
          data: {
            orders: { connect: { id: order.id } },
            totalCashSales: { increment: cashCollected },
            expectedEndingDrawerAmount: { increment: cashCollected },
            totalMomoSales: { increment: momoCollected },
            totalOtherSales: { increment: otherCollected }
          }
        });
      }
    } catch (shiftErr) {
      console.error("Shift update failed:", shiftErr);
    }

    // 💰 Financials
    try {
      const cashAccId = await ensureAccount("Cash on Hand", "Asset", "1000");
      const salesAccId = await ensureAccount("Sales Revenue", "Revenue", "4000");

      if (userRole === "admin") {
        const productNames = orderItemsData.map(i => i.productName).join(", ");
        const desc = `POS Sale (Admin): ${productNames.length > 40 ? productNames.substring(0, 37) + "..." : productNames}`;
        await recordTransaction({
          date: new Date(),
          description: desc,
          reference: order.publicId,
          type: "Sales",
          entries: [
            { accountId: cashAccId, debit: subtotal },
            { accountId: salesAccId, credit: subtotal }
          ],
          createdBy: userId
        });

        for (const item of orderItemsData) {
          if (item.sellerId) {
            const gross = item.subtotal;
            const commAmt = gross * (appliedRate / 100);
            const net = gross - commAmt;
            await prisma.sellerEarning.create({
              data: {
                sellerId: item.sellerId,
                orderId: order.id,
                orderPublicId: order.publicId,
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                itemPrice: item.price,
                grossAmount: gross,
                commissionRate: appliedRate,
                commissionAmount: commAmt,
                netAmount: net,
                status: "pending"
              }
            });
          }
        }
      } else if (userRole === "seller") {
        const commissionAmount = subtotal * (appliedRate / 100);
        for (const item of orderItemsData) {
          const gross = item.subtotal;
          const commAmt = gross * (appliedRate / 100);
          const net = gross - commAmt;
          await prisma.sellerEarning.create({
            data: {
              sellerId: userId,
              orderId: order.id,
              orderPublicId: order.publicId,
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              itemPrice: item.price,
              grossAmount: gross,
              commissionRate: appliedRate,
              commissionAmount: commAmt,
              netAmount: net,
              status: "paid",
              paidAt: new Date()
            }
          });
        }

        if (commissionAmount > 0) {
          const payableAccId = await ensureAccount("Seller Payable", "Liability", "2001");
          const revenueAccId = await ensureAccount("Commission Revenue", "Revenue", "4001");
          await recordTransaction({
            date: new Date(),
            description: `POS Commission (Seller): Order #${order.publicId}`,
            reference: order.publicId,
            type: "Sales",
            entries: [
              { accountId: payableAccId, debit: commissionAmount },
              { accountId: revenueAccId, credit: commissionAmount }
            ],
            createdBy: userId
          });
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

/**
 * 📁 Report Logs
 */
export const getReportLogs = async (req, res) => {
  try {
    const { type, format, user, from, to, page = 1, limit = 20 } = req.query;
    const where = {};
    if (type) where.type = type;
    if (format) where.format = format;
    if (user) where.generatedById = user;
    if (from || to) {
      where.timestamp = {};
      if (from) where.timestamp.gte = new Date(from);
      if (to) where.timestamp.lte = new Date(to);
    }

    const logs = await prisma.reportLog.findMany({
      where,
      include: { generatedBy: { select: { id: true, name: true, email: true } } },
      orderBy: { timestamp: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    const total = await prisma.reportLog.count({ where });

    res.json({
      total,
      page: Number(page),
      limit: Number(limit),
      logs
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to retrieve report logs." });
  }
};

export const markReportViewed = async (req, res) => {
  try {
    const reportId = req.params.id;
    const report = await prisma.reportLog.findUnique({ where: { id: reportId } });
    if (!report) return res.status(404).json({ message: "Report not found" });

    const viewedBy = Array.isArray(report.viewedBy) ? report.viewedBy : [];
    if (!viewedBy.includes(req.user.id)) {
      viewedBy.push(req.user.id);
      await prisma.reportLog.update({
        where: { id: reportId },
        data: { viewedBy }
      });
    }

    res.json({ message: "Report marked as viewed." });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark report as viewed." });
  }
};

export const markReportDownloaded = async (req, res) => {
  try {
    const reportId = req.params.id;
    const report = await prisma.reportLog.findUnique({ where: { id: reportId } });
    if (!report) return res.status(404).json({ message: "Report not found" });

    const downloadedBy = Array.isArray(report.downloadedBy) ? report.downloadedBy : [];
    if (!downloadedBy.includes(req.user.id)) {
      downloadedBy.push(req.user.id);
      await prisma.reportLog.update({
        where: { id: reportId },
        data: { downloadedBy }
      });
    }

    res.json({ message: "Report marked as downloaded." });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark report as downloaded." });
  }
};

/**
 * 📜 Order Queries
 */
export const getMyOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { customerId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

export const getSellerOrders = async (req, res) => {
  try {
    const effectiveSellerId = req.user.role === 'cashier' ? req.user.managedById : req.user.id;
    const orders = await prisma.order.findMany({
      where: { items: { some: { sellerId: effectiveSellerId } } },
      include: { 
        customer: { select: { id: true, name: true, email: true } },
        items: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch seller orders" });
  }
};

export const getOrders = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const where = {};
    if (status && status !== "all") where.status = status;
    if (search) {
      where.OR = [
        { publicId: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: { customer: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    const total = await prisma.order.count({ where });

    res.json({
      success: true,
      orders,
      total,
      pages: Math.ceil(total / limit),
      page: Number(page)
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        customer: { select: { name: true, email: true } },
        items: { include: { product: { select: { name: true, price: true, image: true, sku: true } } } }
      }
    });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch order details" });
  }
};

/**
 * 📊 Analytics & Lookup
 */
export const getOrderAnalytics = async (req, res) => {
  try {
    const total = await prisma.order.count();
    const pending = await prisma.order.count({ where: { status: "pending" } });
    const processing = await prisma.order.count({ where: { status: "processing" } });
    const delivered = await prisma.order.count({ where: { status: "delivered" } });
    const cancelled = await prisma.order.count({ where: { status: "cancelled" } });

    res.json({
      totalOrders: total,
      pendingOrders: pending,
      processingOrders: processing,
      deliveredOrders: delivered,
      cancelledOrders: cancelled
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
};

export const trackPublicOrder = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { publicId: req.params.id } });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Failed to track order" });
  }
};

export const lookupByBarcode = async (req, res) => {
  try {
    const { barcode, sellerId } = req.query;
    if (!barcode) return res.status(400).json({ message: "Barcode required" });
    
    const normalized = barcode.trim().toUpperCase();
    const where = {
      OR: [{ barcode: normalized }, { sku: normalized }],
      stock: { gt: 0 }
    };
    if (sellerId) where.sellerId = sellerId;

    const product = await prisma.product.findFirst({
      where,
      select: { id: true, name: true, price: true, stock: true, barcode: true, sku: true, image: true, sellerId: true }
    });

    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ message: "Lookup failed" });
  }
};

export const getSellerPOSProducts = async (req, res) => {
  try {
    const effectiveSellerId = req.user.role === 'cashier' ? req.user.managedById : req.user.id;
    if (!effectiveSellerId) return res.status(400).json({ message: "No seller association found for this account" });

    const products = await prisma.product.findMany({
      where: { 
        sellerId: effectiveSellerId, 
        visibility: 'public',
        OR: [
          { stock: { gt: 0 } },
          { type: 'service' },
          { type: 'variable' }
        ]
      },
      select: { id: true, name: true, price: true, stock: true, image: true, sku: true, type: true, variations: true },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

export const getAdminPOSProducts = async (req, res) => {
  try {
    const admins = await prisma.user.findMany({ where: { role: 'admin' }, select: { id: true } });
    const adminIds = admins.map(a => a.id);
    const products = await prisma.product.findMany({
      where: { sellerId: { in: adminIds }, stock: { gt: 0 } },
      select: { id: true, name: true, price: true, stock: true, image: true, sku: true, type: true, variations: true },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

/**
 * 📝 Notes & Items Update
 */
export const updateOrderItems = async (req, res) => {
  try {
    const { items } = req.body;
    const orderId = req.params.id;

    // Recalculate totals
    let subtotal = 0;
    items.forEach(item => {
      subtotal += (item.price * item.quantity);
    });

    // In Prisma, we'd typically update items via deleteMany and createMany or similar
    // For now, updating the order totals
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ message: "Order not found" });

    const grandTotal = subtotal + (order.shippingCost || 0) + (order.tax || 0) - (order.discount || 0);

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        subtotal,
        grandTotal,
        // Updating items would require more complex logic in Prisma
      }
    });

    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ message: "Failed to update order items" });
  }
};

export const addOrderNote = async (req, res) => {
  try {
    const { note } = req.body;
    const orderId = req.params.id;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ message: "Order not found" });

    const notes = Array.isArray(order.notes) ? order.notes : [];
    notes.push({
      text: note,
      author: req.user?.name || "System",
      createdAt: new Date()
    });

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { notes }
    });

    res.json({ message: "Note added successfully", data: updated });
  } catch (err) {
    console.error("Add order note error:", err);
    res.status(500).json({ message: "Failed to add note" });
  }
};
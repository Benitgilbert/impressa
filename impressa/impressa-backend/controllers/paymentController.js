import Order from "../models/Order.js";
import { requestToPay, getTransactionStatus } from "../services/momoService.js";

// Process Payment (Initiate)
export const processPayment = async (req, res, next) => {
  try {
    const { orderId, paymentMethod, phone } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      const error = new Error("Order not found");
      error.statusCode = 404;
      throw error;
    }

    if (paymentMethod === "mtn_momo") {
      if (!phone) {
        const error = new Error("Phone number is required for Mobile Money");
        error.statusCode = 400;
        throw error;
      }

      // Initiate MoMo Payment
      const result = await requestToPay({
        amount: order.totals.grandTotal,
        phone,
        orderId: order.publicId, // Use public ID for external reference
      });

      // Update order with transaction reference
      order.payment.method = "mtn_momo";
      order.payment.transactionId = result.referenceId;
      order.payment.status = "pending";
      await order.save();

      res.json({
        success: true,
        data: {
          status: "pending",
          message: "Payment request sent to your phone. Please approve it.",
          transactionId: result.referenceId,
        },
      });
    } else {
      // Handle other methods (e.g., Cash, Stripe placeholder)
      order.payment.method = paymentMethod || "cash";
      order.payment.status = "pending";
      await order.save();

      res.json({ success: true, data: { status: "pending", message: "Order placed successfully" } });
    }
  } catch (error) {
    next(error);
  }
};

// Check Payment Status (Polling Endpoint)
import { recordTransaction } from "./financeController.js";
import Account from "../models/Account.js";

// Helper to ensure default accounts exist (duplicated from orderController, ideally should be shared)
const ensureAccount = async (name, type, code) => {
  let account = await Account.findOne({ code });
  if (!account) {
    account = await Account.create({ name, type, code });
  }
  return account._id;
};

export const checkPaymentStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.payment.method === "mtn_momo" && order.payment.transactionId) {
      let statusData;
      try {
        statusData = await getTransactionStatus(order.payment.transactionId);

        // --- SANDBOX AUTO-APPROVAL (FOR TESTING) ---
        if (process.env.MOMO_ENV === 'sandbox' && (statusData.status === 'PENDING' || !statusData.status)) {
          console.log("🧪 SANDBOX MODE: Simulating Payment Success...");
          statusData.status = 'SUCCESSFUL'; // Force success for testing
        }
        // -------------------------------------------

      } catch (err) {
        // If resource not found (pending creation or propagation), treat as pending
        const msg = err.message || "";
        if (msg.includes("404") || msg.includes("RESOURCE_NOT_FOUND") || msg.includes("Failed to check")) {
          // --- SANDBOX SIMULATION ON 404 ---
          if (process.env.MOMO_ENV === 'sandbox') {
            console.log(`🧪 SANDBOX MODE: Transaction ${order.payment.transactionId} not found (404) -> SIMULATING SUCCESS`);
            statusData = { status: 'SUCCESSFUL' };
          } else {
            // Production behavior: keep waiting
            console.log(`⚠️ Transaction ${order.payment.transactionId} not found yet (404). Continuing poll...`);
            return res.json({ success: true, status: "pending", systemMessage: "Transaction propagating..." });
          }
          // ---------------------------------
        } else {
          throw err; // Real error
        }
      }

      if (statusData.status === "SUCCESSFUL" && order.payment.status !== "completed") {
        order.payment.status = "completed";
        order.payment.paidAt = new Date();
        // For POS, we mark as delivered immediately upon payment (or 'processing' for online)
        // Check if it's POS or Online. Default logic here was 'delivered' for POS? 
        // Let's set it to 'processing' for standard online orders to be safe, or keep existing logic.
        // Existing logic sets 'delivered'. If this is mainly POS, keep it. If online, 'processing' is better.
        // Let's stick to existing logic but maybe fix the status for online orders if needed.
        // For now, preserving existing 'delivered' logic to minimize side effects, 
        // but typically online orders start as 'processing'.

        if (order.channel === 'website') {
          order.status = 'processing';
        } else {
          order.status = 'delivered';
          order.deliveredAt = new Date();
        }

        await order.save();

        // Record Financial Transaction
        const cashAccountId = await ensureAccount("Cash on Hand", "Asset", "1000");
        const salesAccountId = await ensureAccount("Sales Revenue", "Revenue", "4000");

        // Generate description with product names
        const productNames = order.items.map(i => i.productName).join(", ");
        const description = `POS Sale (MoMo): ${productNames.length > 50 ? productNames.substring(0, 47) + "..." : productNames}`;

        await recordTransaction({
          date: new Date(),
          description: description,
          reference: order.publicId,
          type: "Sales",
          entries: [
            { account: cashAccountId, debit: order.totals.grandTotal },
            { account: salesAccountId, credit: order.totals.grandTotal }
          ],
          createdBy: order.customer || null // Or system user if null
        });

      } else if (statusData.status === "FAILED") {
        order.payment.status = "failed";
        await order.save();
      }

      return res.json({
        success: true,
        status: order.payment.status,
        momoStatus: statusData.status
      });
    }

    res.json({ success: true, status: order.payment.status });
  } catch (error) {
    next(error);
  }
};

// Webhook Handler (Optional if polling is used, but good for reliability)
export const handleMomoWebhook = async (req, res) => {
  try {
    const { resourceId, status } = req.body; // MTN sends this payload
    // Note: resourceId is usually the transactionId (referenceId)

    // Find order by transaction ID
    const order = await Order.findOne({ "payment.transactionId": resourceId });

    if (order) {
      if (status === "SUCCESSFUL") {
        order.payment.status = "completed";
        order.payment.paidAt = new Date();
        order.status = "processing";
      } else if (status === "FAILED") {
        order.payment.status = "failed";
      }
      await order.save();
    }

    res.status(200).end();
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).end();
  }
};

import prisma from "../prisma.js";
import { requestToPay, getTransactionStatus } from "../services/momoService.js";
import { recordTransaction } from "./financeController.js";

// Helper to ensure default accounts exist
const ensureAccount = async (name, type, code) => {
  let account = await prisma.account.findUnique({ where: { code } });
  if (!account) {
    account = await prisma.account.create({ data: { name, type, code } });
  }
  return account.id;
};

// Process Payment (Initiate)
export const processPayment = async (req, res, next) => {
  try {
    const { orderId, paymentMethod, phone } = req.body;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
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
        amount: order.grandTotal,
        phone,
        orderId: order.publicId, // Use public ID for external reference
      });

      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentMethod: "mtn_momo",
          transactionId: result.referenceId,
          paymentStatus: "pending"
        }
      });

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
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentMethod: paymentMethod || "cash",
          paymentStatus: "pending"
        }
      });

      res.json({ success: true, data: { status: "pending", message: "Order placed successfully" } });
    }
  } catch (error) {
    next(error);
  }
};

// Check Payment Status (Polling Endpoint)
export const checkPaymentStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await prisma.order.findUnique({ 
        where: { id: orderId },
        include: { items: true }
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.paymentMethod === "mtn_momo" && order.transactionId) {
      let statusData;
      try {
        statusData = await getTransactionStatus(order.transactionId);

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
            console.log(`🧪 SANDBOX MODE: Transaction ${order.transactionId} not found (404) -> SIMULATING SUCCESS`);
            statusData = { status: 'SUCCESSFUL' };
          } else {
            // Production behavior: keep waiting
            console.log(`⚠️ Transaction ${order.transactionId} not found yet (404). Continuing poll...`);
            return res.json({ success: true, status: "pending", systemMessage: "Transaction propagating..." });
          }
          // ---------------------------------
        } else {
          throw err; // Real error
        }
      }

      if (statusData.status === "SUCCESSFUL" && order.paymentStatus !== "completed") {
        const newStatus = order.channel === 'website' ? 'processing' : 'delivered';
        
        await prisma.order.update({
            where: { id: orderId },
            data: {
                paymentStatus: "completed",
                paidAt: new Date(),
                status: newStatus
            }
        });

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
            { account: cashAccountId, debit: order.grandTotal },
            { account: salesAccountId, credit: order.grandTotal }
          ],
          createdBy: order.customerId || null 
        });

      } else if (statusData.status === "FAILED") {
        await prisma.order.update({
            where: { id: orderId },
            data: { paymentStatus: "failed" }
        });
      }

      const latestOrder = await prisma.order.findUnique({ where: { id: orderId } });
      return res.json({
        success: true,
        status: latestOrder.paymentStatus,
        momoStatus: statusData.status
      });
    }

    res.json({ success: true, status: order.paymentStatus });
  } catch (error) {
    next(error);
  }
};

// Webhook Handler
export const handleMomoWebhook = async (req, res) => {
  try {
    const { resourceId, status } = req.body; 

    const order = await prisma.order.findFirst({
        where: { transactionId: resourceId }
    });

    if (order) {
      if (status === "SUCCESSFUL") {
          await prisma.order.update({
              where: { id: order.id },
              data: {
                  paymentStatus: "completed",
                  paidAt: new Date(),
                  status: "processing"
              }
          });
      } else if (status === "FAILED") {
          await prisma.order.update({
              where: { id: order.id },
              data: { paymentStatus: "failed" }
          });
      }
    }

    res.status(200).end();
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).end();
  }
};

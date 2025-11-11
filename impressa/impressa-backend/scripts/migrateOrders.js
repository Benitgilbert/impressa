import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Old Order Schema (for reference)
const oldOrderSchema = new mongoose.Schema({
  product: mongoose.Schema.Types.ObjectId,
  customer: mongoose.Schema.Types.ObjectId,
  guestName: String,
  guestEmail: String,
  guestPhone: String,
  publicId: String,
  quantity: Number,
  customText: String,
  customFile: String,
  cloudLink: String,
  cloudPassword: String,
  status: String,
  createdAt: Date,
});

/**
 * Migration Script: Convert old single-product orders to new multi-item format
 * 
 * This script:
 * 1. Backs up existing orders
 * 2. Transforms old orders to new schema
 * 3. Updates database
 * 
 * Run with: node scripts/migrateOrders.js
 */

async function migrateOrders() {
  try {
    console.log("🔄 Starting order migration...");
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Get the raw collection (bypass mongoose schema validation)
    const db = mongoose.connection.db;
    const ordersCollection = db.collection("orders");

    // Count existing orders
    const totalOrders = await ordersCollection.countDocuments();
    console.log(`📊 Found ${totalOrders} orders to migrate`);

    if (totalOrders === 0) {
      console.log("✅ No orders to migrate");
      process.exit(0);
    }

    // Fetch all orders
    const oldOrders = await ordersCollection.find({}).toArray();

    let migratedCount = 0;
    let skippedCount = 0;

    for (const oldOrder of oldOrders) {
      try {
        // Skip if already migrated (has 'items' array)
        if (oldOrder.items && Array.isArray(oldOrder.items)) {
          console.log(`⏭️  Skipping order ${oldOrder.publicId} - already migrated`);
          skippedCount++;
          continue;
        }

        // Fetch product details if product exists
        let productName = "Unknown Product";
        let productImage = null;
        let productSku = null;
        let productPrice = 0;

        if (oldOrder.product) {
          const productsCollection = db.collection("products");
          const product = await productsCollection.findOne({ _id: oldOrder.product });
          
          if (product) {
            productName = product.name;
            productImage = product.image;
            productSku = product.sku;
            productPrice = product.price;
          }
        }

        // Build the new order structure
        const newOrder = {
          publicId: oldOrder.publicId,
          customer: oldOrder.customer || null,
          guestInfo: {
            name: oldOrder.guestName || null,
            email: oldOrder.guestEmail || null,
            phone: oldOrder.guestPhone || null,
          },
          items: [
            {
              product: oldOrder.product,
              productName: productName,
              productImage: productImage,
              sku: productSku,
              quantity: oldOrder.quantity || 1,
              price: productPrice,
              subtotal: productPrice * (oldOrder.quantity || 1),
              customizations: {
                customText: oldOrder.customText || null,
                customFile: oldOrder.customFile || null,
                cloudLink: oldOrder.cloudLink || null,
                cloudPassword: oldOrder.cloudPassword || null,
              },
            },
          ],
          billingAddress: null, // Will need to be added manually or via future update
          shippingAddress: null,
          sameAsShipping: true,
          totals: {
            subtotal: productPrice * (oldOrder.quantity || 1),
            shipping: 0,
            tax: 0,
            discount: 0,
            grandTotal: productPrice * (oldOrder.quantity || 1),
          },
          couponCode: null,
          discountAmount: 0,
          payment: {
            method: "pending",
            status: "pending",
            transactionId: null,
            paidAt: null,
          },
          shipping: {
            method: null,
            cost: 0,
            trackingNumber: null,
            carrier: null,
            shippedAt: null,
            deliveredAt: null,
          },
          status: mapOldStatus(oldOrder.status),
          notes: [],
          // Keep legacy data for reference
          legacy: {
            product: oldOrder.product,
            quantity: oldOrder.quantity,
            customText: oldOrder.customText,
            customFile: oldOrder.customFile,
            cloudLink: oldOrder.cloudLink,
            cloudPassword: oldOrder.cloudPassword,
          },
          createdAt: oldOrder.createdAt || new Date(),
          updatedAt: new Date(),
        };

        // Update the order in place
        await ordersCollection.updateOne(
          { _id: oldOrder._id },
          { $set: newOrder }
        );

        migratedCount++;
        console.log(`✅ Migrated order ${oldOrder.publicId} (${migratedCount}/${totalOrders})`);
      } catch (error) {
        console.error(`❌ Error migrating order ${oldOrder.publicId}:`, error.message);
      }
    }

    console.log("\n📊 Migration Summary:");
    console.log(`   Total orders: ${totalOrders}`);
    console.log(`   Migrated: ${migratedCount}`);
    console.log(`   Skipped (already migrated): ${skippedCount}`);
    console.log(`   Failed: ${totalOrders - migratedCount - skippedCount}`);

    console.log("\n✅ Migration complete!");
    console.log("\n⚠️  IMPORTANT: Migrated orders have null addresses.");
    console.log("   You may need to update orders with proper address information.\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

/**
 * Map old status values to new status values
 */
function mapOldStatus(oldStatus) {
  const statusMap = {
    "pending": "pending",
    "approved": "confirmed",
    "in-production": "in-production",
    "ready": "ready",
    "delivered": "delivered",
    "cancelled": "cancelled",
  };

  return statusMap[oldStatus] || "pending";
}

// Run migration
migrateOrders();

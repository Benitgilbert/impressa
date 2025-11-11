import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
//import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

dotenv.config();

// ✅ Initialize Express
const app = express();
app.use(cors());
app.use(express.json());
// Static uploads for product images
app.use("/uploads", express.static("uploads"));

// ✅ Connection events for debugging
mongoose.connection.on("connected", () => {
  console.log("✅ Mongoose connected to MongoDB");
});
mongoose.connection.on("error", (err) => {
  console.error("❌ Mongoose connection error:", err.message);
});

// ✅ Start server only after DB connects
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // ✅ Import routes only after DB is ready
    const reportRoutes = (await import("./routes/reportRoutes.js")).default;
    const authRoutes = (await import("./routes/authRoutes.js")).default;
    const productRoutes = (await import("./routes/productRoutes.js")).default;
    const customizationRoutes = (await import("./routes/customizationRoutes.js")).default;
    const orderRoutes = (await import("./routes/orderRoutes.js")).default;
    const analyticsRoutes = (await import("./routes/analyticsRoutes.js")).default;

    // ✅ Register routes
    app.use("/api/auth", authRoutes);
    app.use("/api/products", productRoutes);
    app.use("/api/customizations", customizationRoutes);
    app.use("/api/orders", orderRoutes);
    app.use("/api/reports", reportRoutes);
    app.use("/api/auth", authRoutes);
    app.use("/api", authRoutes);
    app.use("/api/dashboard", dashboardRoutes);
    app.use("/api/analytics", analyticsRoutes);


    app.get("/", (req, res) => {
      res.send("impressa backend is running!");
    });

    // ✅ Start listening
    app.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
    });
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB:", err.message);
    process.exit(1);
  }
};

startServer();
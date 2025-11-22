import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
//import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import logger from "./config/logger.js";

dotenv.config();

// ✅ Initialize Express
const app = express();

// ✅ Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin resources
}));

// ✅ CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5000",
  "http://localhost:3000",
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow localhost
    if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.some(allowed => origin === allowed || origin.endsWith('.replit.dev'))) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser()); // For cart session management

// ✅ Request Logging Middleware
app.use(
  pinoHttp({
    logger,
    customLogLevel: (req, res, err) => {
      if (res.statusCode >= 500 || err) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
    customSuccessMessage: (req, res) => {
      return `${req.method} ${req.url} ${res.statusCode}`;
    },
    customErrorMessage: (req, res, err) => {
      return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
    },
    // Skip logging for health checks
    autoLogging: {
      ignore: (req) => req.url === "/health" || req.url === "/live",
    },
  })
);

// Static uploads for product images
app.use("/uploads", express.static("uploads"));

// ✅ Connection events for debugging
mongoose.connection.on("connected", () => {
  logger.info("✅ Mongoose connected to MongoDB");
});
mongoose.connection.on("error", (err) => {
  logger.error({ err }, "❌ Mongoose connection error");
});
mongoose.connection.on("disconnected", () => {
  logger.warn("⚠️  Mongoose disconnected from MongoDB");
});

// ✅ Start server only after DB connects
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // ✅ Import routes only after DB is ready
    const reportRoutes = (await import("./routes/reportRoutes.js")).default;
    const authRoutes = (await import("./routes/authRoutes.js")).default;
    const productRoutes = (await import("./routes/productRoutes.js")).default;
    const categoryRoutes = (await import("./routes/categoryRoutes.js")).default;
    const customizationRoutes = (await import("./routes/customizationRoutes.js")).default;
    const orderRoutes = (await import("./routes/orderRoutes.js")).default;
    const analyticsRoutes = (await import("./routes/analyticsRoutes.js")).default;
    const healthRoutes = (await import("./routes/healthRoutes.js")).default;
    const cartRoutes = (await import("./routes/cartRoutes.js")).default;
    const couponRoutes = (await import("./routes/couponRoutes.js")).default;
    const checkoutRoutes = (await import("./routes/checkoutRoutes.js")).default;
    const paymentRoutes = (await import("./routes/paymentRoutes.js")).default;

    // ✅ Register health checks first (no auth required)
    app.use("/", healthRoutes);

    // ✅ Register API routes
    app.use("/api/auth", authRoutes);
    app.use("/api/products", productRoutes);
    app.use("/api/categories", categoryRoutes);
    app.use("/api/cart", cartRoutes);
    app.use("/api/coupons", couponRoutes);
    app.use("/api/checkout", checkoutRoutes);
    app.use("/api/payments", paymentRoutes);
    app.use("/api/customizations", customizationRoutes);
    app.use("/api/orders", orderRoutes);
    app.use("/api/reports", reportRoutes);
    app.use("/api", authRoutes);
    app.use("/api/dashboard", dashboardRoutes);
    app.use("/api/analytics", analyticsRoutes);


    app.get("/api", (req, res) => {
      res.json({ 
        success: true, 
        message: "Impressa Backend API is running!",
        version: "1.0.0",
        environment: process.env.NODE_ENV || "development",
        docs: "/api-docs (coming in Phase 4)"
      });
    });

    // ✅ 404 Handler - Must be after all routes
    app.use(notFound);

    // ✅ Global Error Handler - Must be last
    app.use(errorHandler);

    // ✅ Start listening
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
      logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
      logger.info(`📊 Readiness check: http://localhost:${PORT}/ready`);
    });

    // ✅ Graceful Shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received, starting graceful shutdown...`);
      
      // Stop accepting new connections
      server.close(async () => {
        logger.info("HTTP server closed");
        
        try {
          // Close database connections
          await mongoose.connection.close(false);
          logger.info("MongoDB connection closed");
          
          logger.info("Graceful shutdown completed");
          process.exit(0);
        } catch (error) {
          logger.error({ err: error }, "Error during graceful shutdown");
          process.exit(1);
        }
      });
      
      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 30000);
    };

    // Listen for termination signals
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      logger.fatal({ err: error }, "Uncaught Exception");
      gracefulShutdown("UNCAUGHT_EXCEPTION");
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      logger.fatal({ reason, promise }, "Unhandled Promise Rejection");
      gracefulShutdown("UNHANDLED_REJECTION");
    });
  } catch (err) {
    logger.fatal({ err }, "❌ Failed to connect to MongoDB");
    process.exit(1);
  }
};

startServer();

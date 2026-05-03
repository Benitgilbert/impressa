import express from "express";
import path from "path";
import passport from "./config/passport.js";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import prisma from "./prisma.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import logger from "./config/logger.js";

// ✅ Import routes at top level for better Vercel performance
import dashboardRoutes from "./routes/dashboardRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import customizationRoutes from "./routes/customizationRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import checkoutRoutes from "./routes/checkoutRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import attributeRoutes from "./routes/attributeRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";
import deliveryClassRoutes from "./routes/deliveryClassRoutes.js";
import taxRoutes from "./routes/taxRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import financeRoutes from "./routes/financeRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import flashSaleRoutes from "./routes/flashSaleRoutes.js";
import bannerRoutes from "./routes/bannerRoutes.js";
import testimonialRoutes from "./routes/testimonialRoutes.js";
import brandPartnerRoutes from "./routes/brandPartnerRoutes.js";
import siteSettingsRoutes from "./routes/siteSettingsRoutes.js";
import newsletterRoutes from "./routes/newsletterRoutes.js";
import giftCardRoutes from "./routes/giftCardRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import shiftRoutes from "./routes/shiftRoutes.js";
import abonneRoutes from "./routes/abonneRoutes.js";
import giftCardProductRoutes from "./routes/giftCardProductRoutes.js";
import sellerRoutes from "./routes/sellerRoutes.js";
import commissionRoutes from "./routes/commissionRoutes.js";
import productApprovalRoutes from "./routes/productApprovalRoutes.js";
import reviewsAdminRoutes from "./routes/reviewsAdminRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import sellerVerificationRoutes from "./routes/sellerVerificationRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import violationRoutes from "./routes/violationRoutes.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";

dotenv.config();

// ✅ Initialize Express
const app = express();

// 1. ✅ CORS (MUST BE FIRST for Preflight)
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://pastorbonus.vercel.app",
  "https://pastorbonuss.vercel.app",
  "https://abelus.com",
  "https://www.abelus.com",
  "https://abeluss-backend.vercel.app",
  "http://localhost:5000",
  "http://localhost:3000",
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    const normalizedOrigin = origin.toLowerCase().trim();
    
    // Check if origin is in whitelist or is a vercel sub-domain
    const isAllowed = allowedOrigins.some(ao => ao && ao.toLowerCase() === normalizedOrigin) || 
                      normalizedOrigin.endsWith('.vercel.app') || 
                      normalizedOrigin.endsWith('.vercel.dev') ||
                      normalizedOrigin.endsWith('.amplifyapp.com');
                      
    if (isAllowed) {
      callback(null, true);
    } else {
      // In production, be strict. In development, allow.
      const isDev = process.env.NODE_ENV !== 'production';
      callback(null, isDev);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "X-Refresh-Token", "Origin"],
  exposedHeaders: ["Set-Cookie"],
  optionsSuccessStatus: 204
}));

// 2. ✅ Other Global Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(passport.initialize());
app.use(cookieParser());

// ✅ Request Logging Middleware
app.use(
  pinoHttp({
    logger,
    customLogLevel: (req, res, err) => {
      if (res.statusCode >= 500 || err) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
    customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
    customErrorMessage: (req, res, err) => `${req.method} ${req.url} ${res.statusCode} - ${err.message}`,
    autoLogging: {
      ignore: (req) => req.url === "/health" || req.url === "/live",
    },
  })
);

// Static uploads for product images
app.use("/uploads", express.static("uploads"));

// ✅ Register health checks first
app.use("/", healthRoutes);
app.use("/api", healthRoutes);

// ✅ Register API routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/attributes", attributeRoutes);
app.use("/api/shipping", deliveryRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/shipping-classes", deliveryClassRoutes);
app.use("/api/delivery-classes", deliveryClassRoutes);
app.use("/api/taxes", taxRoutes);
app.use("/api/customizations", customizationRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/flash-sales", flashSaleRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/brand-partners", brandPartnerRoutes);
app.use("/api/site-settings", siteSettingsRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/gift-cards", giftCardRoutes);
app.use("/api/shifts", shiftRoutes);
app.use("/api/abonnes", abonneRoutes);
app.use("/api/gift-card-products", giftCardProductRoutes);
app.use("/api/sellers", sellerRoutes);
app.use("/api/commissions", commissionRoutes);
app.use("/api/product-approval", productApprovalRoutes);
app.use("/api/reviews-admin", reviewsAdminRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/seller-verification", sellerVerificationRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/violations", violationRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/expenses", expenseRoutes);

app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "Abelus Backend API is running on Prisma!",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development"
  });
});

// ✅ 404 & Error Handlers
app.use(notFound);
app.use(errorHandler);

// ✅ Database Connection & Server Start
const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL;
const isTest = process.env.NODE_ENV === 'test';

if (!isVercel && !isTest) {
  const startServer = async () => {
    try {
      logger.info("Starting server initialization...");
      await prisma.$connect();
      logger.info("✅ Prisma connected to Supabase");

      const PORT = process.env.PORT || 5000;
      const server = app.listen(PORT, () => {
        logger.info(`🚀 Server running on port ${PORT}`);
      });

      server.on("error", (err) => {
        logger.error({ err }, "Server handle error");
      });

      const gracefulShutdown = async (signal) => {
        logger.info(`${signal} received, shutting down...`);
        server.close(async () => {
          logger.info("Server closed, disconnecting Prisma...");
          await prisma.$disconnect();
          process.exit(0);
        });
      };

      process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
      process.on("SIGINT", () => gracefulShutdown("SIGINT"));

      // Safety: Log if the event loop is empty
      process.on('exit', (code) => {
        logger.info(`Process exiting with code: ${code}`);
      });
      
    } catch (err) {
      logger.fatal({ err }, "❌ Failed to start server during initialization");
      process.exit(1);
    }
  };
  startServer();
}

// ✅ Export app for Vercel
export default app;

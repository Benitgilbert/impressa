import express from "express";
import mongoose from "mongoose";
import logger from "../config/logger.js";

const router = express.Router();

/**
 * Basic health check endpoint
 * Returns 200 if server is running
 */
router.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

/**
 * Readiness check endpoint
 * Returns 200 only if all critical services are available
 * Used by load balancers and orchestrators (Kubernetes, Docker Swarm)
 */
router.get("/ready", async (req, res) => {
  const checks = {
    server: "ok",
    database: "checking",
  };

  let isReady = true;

  // Check MongoDB connection
  try {
    if (mongoose.connection.readyState === 1) {
      checks.database = "ok";
      
      // Ping database to ensure it's responsive
      await mongoose.connection.db.admin().ping();
    } else {
      checks.database = "not connected";
      isReady = false;
    }
  } catch (error) {
    checks.database = "error";
    checks.databaseError = error.message;
    isReady = false;
    logger.error({ err: error }, "Database health check failed");
  }

  const statusCode = isReady ? 200 : 503;
  const status = isReady ? "ready" : "not ready";

  res.status(statusCode).json({
    success: isReady,
    status,
    checks,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Liveness check endpoint
 * Returns 200 if server process is alive (even if dependencies are down)
 * Used to detect if application is completely frozen
 */
router.get("/live", (req, res) => {
  res.json({
    success: true,
    status: "alive",
    timestamp: new Date().toISOString(),
    pid: process.pid,
    memory: process.memoryUsage(),
  });
});

export default router;

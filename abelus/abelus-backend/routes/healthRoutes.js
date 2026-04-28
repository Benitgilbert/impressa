import express from "express";
import prisma from "../prisma.js";
import logger from "../config/logger.js";

const router = express.Router();

/**
 * Root endpoint for basic connectivity check (Render default health check)
 */
router.get("/", (req, res) => {
  res.status(200).send("Abelus Backend is running");
});

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
 * Server time endpoint for synchronization
 */
router.get("/time", (req, res) => {
  const now = new Date();
  res.json({
    success: true,
    iso: now.toISOString(),
    timestamp: now.getTime()
  });
});

/**
 * Readiness check endpoint
 * Returns 200 only if all critical services are available
 */
router.get("/ready", async (req, res) => {
  const checks = {
    server: "ok",
    database: "checking",
  };

  let isReady = true;

  // Check Prisma connection
  try {
    // Ping database using raw query
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
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

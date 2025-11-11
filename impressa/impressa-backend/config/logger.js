import pino from "pino";

const isDevelopment = process.env.NODE_ENV !== "production";

/**
 * Pino Logger Configuration
 * 
 * Log Levels:
 * - fatal: 60
 * - error: 50
 * - warn: 40
 * - info: 30 (default)
 * - debug: 20
 * - trace: 10
 */

const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),
  
  // Pretty print in development
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
          singleLine: false,
        },
      }
    : undefined,

  // Base fields to include in every log
  base: {
    env: process.env.NODE_ENV || "development",
    app: "impressa-backend",
  },

  // Timestamp format
  timestamp: () => `,"time":"${new Date().toISOString()}"`,

  // Serializers for common objects
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      headers: {
        host: req.headers.host,
        "user-agent": req.headers["user-agent"],
      },
      remoteAddress: req.remoteAddress,
      remotePort: req.remotePort,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
      headers: res.getHeaders ? res.getHeaders() : {},
    }),
    err: pino.stdSerializers.err,
  },

  // Redact sensitive information
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "password",
      "newPassword",
      "token",
      "accessToken",
      "refreshToken",
    ],
    censor: "[REDACTED]",
  },
});

export default logger;

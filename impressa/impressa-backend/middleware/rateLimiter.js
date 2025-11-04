import rateLimit from "express-rate-limit";

export const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: "Too many reports generated. Please wait and try again.",
});

export const analyticsLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: "Too many analytics requests. Please slow down.",
});
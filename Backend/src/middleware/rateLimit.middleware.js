import rateLimit from "express-rate-limit";

/**
 * General API rate limiter
 * Limits requests from the same IP within a time window.
 */
export const apiLimiter = rateLimit({
    windowMs: 60000, // 1 minute (short window for dev)
    max: 1000, // 1000 requests per minute
    message: {
        success: false,
        message: "Too many requests. Please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Strict limiter for auth endpoints (prevent brute force)
 */
export const authLimiter = rateLimit({
    windowMs: 900000, // 15 minutes
    max: 10, // 10 attempts per 15 min
    message: {
        success: false,
        message: "Too many login attempts. Please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false
});

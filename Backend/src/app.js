import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import path from "path";
import { fileURLToPath } from "url";

import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";

import env from "./config/env.js";

/* =====================================================
   Authentication Module
===================================================== */

import authRoutes from "./modules/auth/index.js";

/* =====================================================
   Lead Module
===================================================== */

import leadRoutes from "./modules/leads/routes/lead.routes.js";
import leadFollowUpRoutes from "./modules/leads/routes/leadFollowUp.routes.js";
import leadActivityRoutes from "./modules/leads/routes/leadActivity.routes.js";
import leadAttachmentRoutes from "./modules/leads/routes/leadAttachment.routes.js";

/* =====================================================
   Contact Module
===================================================== */

import contactRoutes from "./modules/contacts/index.js";

/* =====================================================
   Customer Module
===================================================== */

import customerRoutes from "./modules/customers/index.js";

/* =====================================================
   Follow-up Module
===================================================== */

import followUpModule from "./modules/followups/index.js";

import { apiLimiter } from "./middleware/rateLimit.middleware.js";

import notFoundMiddleware from "./middleware/notFound.middleware.js";
import errorMiddleware from "./middleware/error.middleware.js";

const app = express();

// Apply rate limiting to all API routes
app.use("/api", apiLimiter);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("✅ app.js loaded");

/* =====================================================
   Global Middleware
===================================================== */

/* =====================================================
   CORS - allow frontend Cloudflare tunnel & local origins
===================================================== */

const allowedOrigins = [
    env.FRONTEND_URL,
    "http://localhost:3100",
    "http://127.0.0.1:3100",
    ...(env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(",") : [])
].filter(Boolean);

app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (curl, mobile apps, etc.)
            if (!origin) return callback(null, true);
            // In development, reflect back any origin
            if (env.NODE_ENV !== "production") {
                return callback(null, origin);
            }
            // In production, check against allowed list
            const allowed = allowedOrigins.some(o =>
                origin === o || origin === o.replace(/\/$/, "")
            );
            if (allowed) {
                callback(null, origin);
            } else {
                console.warn("Blocked by CORS:", origin);
                callback(null, false);
            }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "X-Requested-With",
            "Accept",
            "Origin"
        ],
        optionsSuccessStatus: 204
    })
);

app.use(helmet());
app.use(compression());
app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

app.use(cookieParser());
app.use(morgan("dev"));

/* =====================================================
   Static File Hosting
===================================================== */

app.use(
    "/attachments",
    express.static(path.join(__dirname, "../attachments"))
);

/* =====================================================
   Swagger Documentation
===================================================== */

console.log("✅ Registering Swagger at /api/docs");

console.log(
    "Swagger Paths:",
    Object.keys(swaggerSpec.paths || {})
);

app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
);

/* =====================================================
   Health Routes
===================================================== */

/**
 * @swagger
 * /:
 *   get:
 *     summary: Root endpoint
 *     description: Returns basic project information and status
 *     tags: [Health]
 *     responses:
 *       200: *         description: Project information
 *         content:
 *           application/json:
 *             schema: *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 project:
 *                   type: string
 *                   example: Enterprise CRM
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 status:
 *                   type: string
 *                   example: Running
 */
app.get("/", (req, res) => {

    res.status(200).json({
        success: true,
        project: "Enterprise CRM",
        version: "1.0.0",
        status: "Running"
    });

});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     description: Returns the current health status of the API server
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: string
 *                   example: UP
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2026-07-27T12:00:00.000Z
 */
app.get("/health", (req, res) => {

    res.status(200).json({
        success: true,
        status: "UP",
        timestamp: new Date().toISOString()
    });

});

/* =====================================================
   Authentication Routes
===================================================== */

app.use("/api/auth", authRoutes);

/* =====================================================
   Lead Module Routes
===================================================== */

app.use("/api/leads", leadRoutes);
app.use("/api/leads", leadFollowUpRoutes);
app.use("/api/leads", leadActivityRoutes);
app.use("/api/leads", leadAttachmentRoutes);

/* =====================================================
   Follow-up Module Routes
===================================================== */

app.use("/api/followups", followUpModule.routes);

/* =====================================================
   Followup Attachment Routes
===================================================== */

import followupAttachmentRoutes from "./modules/followups/routes/followupAttachment.routes.js";
app.use("/api/followups", followupAttachmentRoutes);

/* =====================================================
   Contact Module Routes
===================================================== */

app.use("/api/contacts", contactRoutes);

/* =====================================================
   Customer Attachment Routes
===================================================== */

import customerAttachmentRoutes from "./modules/customers/routes/customerAttachment.routes.js";
app.use("/api/customers", customerAttachmentRoutes);

/* =====================================================
   Customer Module Routes
===================================================== */

app.use("/api/customers", customerRoutes);

/* =====================================================
   404 Handler
===================================================== */

app.use(notFoundMiddleware);

/* =====================================================
   Global Error Handler
===================================================== */

app.use(errorMiddleware);

export default app;
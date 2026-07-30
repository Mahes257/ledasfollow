import { Router } from "express";

import LeadController from "../controllers/LeadController.js";
import authenticate from "../../../middleware/authenticate.js";

import {
    createLeadValidator,
    updateLeadValidator,
    validate
} from "../validators/lead.validator.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Leads
 *   description: Lead Management APIs
 */

/**
 * @swagger
 * /api/leads/dashboard:
 *   get:
 *     summary: Get Lead Dashboard
 *     description: Returns lead dashboard statistics.
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard fetched successfully.
 */
router.get("/dashboard", LeadController.dashboard);

/**
 * @swagger
 * /api/leads/pipeline:
 *   get:
 *     summary: Get Lead Pipeline
 *     description: Returns lead pipeline summary.
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pipeline fetched successfully.
 */
router.get("/pipeline", LeadController.pipeline);

/**
 * @swagger
 * /api/leads:
 *   get:
 *     summary: Get All Leads
 *     description: Returns all leads with pagination and filters.
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leads fetched successfully.
 */
router.get("/", LeadController.findAll);

/**
 * @swagger
 * /api/leads/{id}:
 *   get:
 *     summary: Get Lead By ID
 *     description: Returns a single lead.
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lead fetched successfully.
 *       404:
 *         description: Lead not found.
 */
router.get("/:id", LeadController.findById);

/**
 * @swagger
 * /api/leads:
 *   post:
 *     summary: Create Lead
 *     description: Creates a new lead.
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - company
 *               - contactPerson
 *               - phone
 *             properties:
 *               company:
 *                 type: string
 *                 example: Vishak Tech
 *               contactPerson:
 *                 type: string
 *                 example: Sri
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: sri@gmail.com
 *               leadSource:
 *                 type: string
 *                 example: Website
 *               priority:
 *                 type: string
 *                 enum:
 *                   - LOW
 *                   - MEDIUM
 *                   - HIGH
 *                   - URGENT
 *                 example: HIGH
 *     responses:
 *       201:
 *         description: Lead created successfully.
 *       400:
 *         description: Validation failed.
 */
router.post(
    "/",
    createLeadValidator,
    validate,
    LeadController.create
);

/**
 * @swagger
 * /api/leads/{id}:
 *   put:
 *     summary: Update Lead
 *     description: Updates an existing lead.
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Lead updated successfully.
 *       404:
 *         description: Lead not found.
 */
router.put(
    "/:id",
    updateLeadValidator,
    validate,
    LeadController.update
);

/**
 * @swagger
 * /api/leads/{id}:
 *   delete:
 *     summary: Delete Lead
 *     description: Soft deletes a lead.
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lead deleted successfully.
 *       404:
 *         description: Lead not found.
 */
router.delete(
    "/:id",
    LeadController.delete
);

/**
 * @swagger
 * /api/leads/{id}/convert:
 *   post:
 *     summary: Convert Lead to Customer
 *     description: Converts a lead into a customer and updates lead status to CONVERTED.
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Lead converted to customer successfully.
 */
router.post(
    "/:id/convert",
    authenticate,
    LeadController.convert
);

export default router;
import { Router } from "express";

import LeadFollowUpController from "../controllers/LeadFollowUpController.js";

import {
    createFollowUpValidator,
    updateFollowUpValidator,
    validate
} from "../validators/leadFollowUp.validator.js";

import authenticate from "../../../middleware/authenticate.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Follow-ups
 *   description: Lead Follow-up APIs
 */

/**
 * @swagger
 * /api/leads/{leadId}/followups:
 *   post:
 *     summary: Create Follow-up
 *     description: Create a follow-up for a lead.
 *     tags: [Follow-ups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         description: Lead ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - followUpDate
 *             properties:
 *               subject:
 *                 type: string
 *               notes:
 *                 type: string
 *               followUpDate:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *     responses:
 *       201:
 *         description: Follow-up created successfully.
 *       400:
 *         description: Validation failed.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Lead not found.
 */
router.post(
    "/:leadId/followups",
    authenticate,
    createFollowUpValidator,
    validate,
    LeadFollowUpController.create
);

/**
 * @swagger
 * /api/leads/{leadId}/followups:
 *   get:
 *     summary: Get All Follow-ups
 *     description: Retrieve all follow-ups for a lead.
 *     tags: [Follow-ups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         description: Lead ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Follow-ups fetched successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Lead not found.
 */
router.get(
    "/:leadId/followups",
    authenticate,
    LeadFollowUpController.findAll
);

/**
 * @swagger
 * /api/leads/followups/{id}:
 *   get:
 *     summary: Get Follow-up By ID
 *     description: Retrieve a specific follow-up.
 *     tags: [Follow-ups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Follow-up ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Follow-up fetched successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Follow-up not found.
 */
router.get(
    "/followups/:id",
    authenticate,
    LeadFollowUpController.findById
);

/**
 * @swagger
 * /api/leads/followups/{id}:
 *   put:
 *     summary: Update Follow-up
 *     description: Update an existing follow-up.
 *     tags: [Follow-ups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Follow-up ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject:
 *                 type: string
 *               notes:
 *                 type: string
 *               followUpDate:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Follow-up updated successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Follow-up not found.
 */
router.put(
    "/followups/:id",
    authenticate,
    updateFollowUpValidator,
    validate,
    LeadFollowUpController.update
);

/**
 * @swagger
 * /api/leads/followups/{id}:
 *   delete:
 *     summary: Delete Follow-up
 *     description: Delete a follow-up.
 *     tags: [Follow-ups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Follow-up ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Follow-up deleted successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Follow-up not found.
 */
router.delete(
    "/followups/:id",
    authenticate,
    LeadFollowUpController.delete
);

export default router;
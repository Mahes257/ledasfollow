import { Router } from "express";

import LeadActivityController from "../controllers/LeadActivityController.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Activities
 *   description: Lead Activity APIs
 */

/**
 * @swagger
 * /api/leads/{leadId}/activities:
 *   get:
 *     summary: Get Lead Activities
 *     description: Retrieves all activities associated with a specific lead.
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         description: Unique Lead ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Activities fetched successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Lead not found.
 *       500:
 *         description: Internal server error.
 */
router.get(
    "/:leadId/activities",
    LeadActivityController.findAll
);

export default router;
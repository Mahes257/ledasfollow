import { Router } from "express";

import LeadAttachmentController from "../controllers/LeadAttachmentController.js";

import upload from "../../../middleware/leadUpload.middleware.js";

import authenticate from "../../../middleware/authenticate.js";

const router = Router();

// All attachment routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Attachments
 *   description: Lead Attachment APIs
 */

/**
 * @swagger
 * /api/leads/{leadId}/attachments:
 *   post:
 *     summary: Upload Attachment
 *     description: Upload a file for a specific lead.
 *     tags: [Attachments]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Attachment uploaded successfully.
 *       400:
 *         description: Invalid request.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Lead not found.
 */
router.post(
    "/:leadId/attachments",
    upload.single("file"),
    LeadAttachmentController.upload
);

/**
 * @swagger
 * /api/leads/{leadId}/attachments:
 *   get:
 *     summary: Get Lead Attachments
 *     description: Retrieve all attachments for a lead.
 *     tags: [Attachments]
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
 *         description: Attachments fetched successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Lead not found.
 */
router.get(
    "/:leadId/attachments",
    LeadAttachmentController.findAll
);

/**
 * @swagger
 * /api/leads/attachments/{id}:
 *   get:
 *     summary: Get Attachment By ID
 *     description: Retrieve a single attachment by its ID.
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Attachment ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attachment fetched successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Attachment not found.
 */
router.get(
    "/attachments/:id",
    LeadAttachmentController.findOne
);

/**
 * @swagger
 * /api/leads/attachments/{id}/download:
 *   get:
 *     summary: Download Attachment
 *     description: Download an uploaded attachment file.
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Attachment ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File download stream.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Attachment not found.
 */
router.get(
    "/attachments/:id/download",
    LeadAttachmentController.download
);

/**
 * @swagger
 * /api/leads/attachments/{id}:
 *   delete:
 *     summary: Delete Attachment
 *     description: Delete an uploaded attachment.
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Attachment ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attachment deleted successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Attachment not found.
 */
router.delete(
    "/attachments/:id",
    LeadAttachmentController.delete
);

export default router;
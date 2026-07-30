import fs from "fs";

import LeadRepository from "../repositories/LeadRepository.js";
import LeadAttachmentRepository from "../repositories/LeadAttachmentRepository.js";

import LeadActivityService from "./LeadActivityService.js";

import ApiError from "../../../common/errors/ApiError.js";

class LeadAttachmentService {

    async upload(leadId, file) {

        const lead = await LeadRepository.findById(leadId);

        if (!lead) {
            throw new ApiError(
                404,
                "Lead not found."
            );
        }

        if (!file) {
            throw new ApiError(
                400,
                "No file uploaded."
            );
        }

        const attachment =
            await LeadAttachmentRepository.create({

                leadId,

                fileName: file.filename,

                originalName: file.originalname,

                mimeType: file.mimetype,

                fileSize: file.size,

                filePath: file.path

            });

        await LeadActivityService.log(

            leadId,

            "Attachment Uploaded",

            file.originalname

        );

        return attachment;

    }

   async findAll(leadId) {

    const lead = await LeadRepository.findById(leadId);

    if (!lead) {
        throw new ApiError(
            404,
            "Lead not found."
        );
    }

    return await LeadAttachmentRepository.findAll(leadId);

}

    async findOne(id) {

        const attachment =
            await LeadAttachmentRepository.findById(id);

        if (!attachment) {

            throw new ApiError(
                404,
                "Attachment not found."
            );

        }

        return attachment;

    }

    async download(id) {

        const attachment =
            await LeadAttachmentRepository.findById(id);

        if (!attachment) {

            throw new ApiError(
                404,
                "Attachment not found."
            );

        }

        if (!fs.existsSync(attachment.filePath)) {

            throw new ApiError(
                404,
                "Attachment file not found."
            );

        }

        return attachment;

    }

    async delete(id, deletedBy) {

        const attachment =
            await LeadAttachmentRepository.findById(id);

        if (!attachment) {

            throw new ApiError(
                404,
                "Attachment not found."
            );

        }

        await LeadActivityService.log(

            attachment.leadId,

            "Attachment Deleted",

            attachment.originalName

        );

        // Delete physical file from disk
        try {
            if (fs.existsSync(attachment.filePath)) {
                fs.unlinkSync(attachment.filePath);
            }
        } catch (err) {
            console.warn("[LeadAttachment] Failed to delete physical file:", err.message);
        }

        await LeadAttachmentRepository.delete(
            id,
            deletedBy
        );

        return true;

    }

}

export default new LeadAttachmentService();
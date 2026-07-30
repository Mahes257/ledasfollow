import LeadAttachmentService from "../services/LeadAttachmentService.js";
import ApiResponse from "../../../common/responses/ApiResponse.js";

class LeadAttachmentController {

    async upload(req, res, next) {

        try {

            if (!req.file) {

                return ApiResponse.error(
                    res,
                    "No attachment selected.",
                    400
                );

            }

            const attachment =
                await LeadAttachmentService.upload(
                    req.params.leadId,
                    req.file
                );

            return ApiResponse.success(
                res,
                "Attachment uploaded successfully.",
                attachment,
                201
            );

        } catch (error) {

            next(error);

        }

    }

    async findAll(req, res, next) {

        try {

            const attachments =
                await LeadAttachmentService.findAll(
                    req.params.leadId
                );

            return ApiResponse.success(
                res,
                "Attachments fetched successfully.",
                attachments
            );

        } catch (error) {

            next(error);

        }

    }

    async findOne(req, res, next) {

        try {

            const attachment =
                await LeadAttachmentService.findOne(
                    req.params.id
                );

            return ApiResponse.success(
                res,
                "Attachment fetched successfully.",
                attachment
            );

        } catch (error) {

            next(error);

        }

    }

    async download(req, res, next) {

        try {

            const file =
                await LeadAttachmentService.download(
                    req.params.id
                );

            return res.download(
                file.filePath,
                file.originalName
            );

        } catch (error) {

            next(error);

        }

    }

    async delete(req, res, next) {

        try {

            await LeadAttachmentService.delete(
                req.params.id
            );

            return ApiResponse.success(
                res,
                "Attachment deleted successfully."
            );

        } catch (error) {

            next(error);

        }

    }

}

export default new LeadAttachmentController();
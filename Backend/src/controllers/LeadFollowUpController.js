import LeadFollowUpService from "../services/LeadFollowUpService.js";

import ApiResponse from "../../../common/responses/ApiResponse.js";

class LeadFollowUpController {

    /* ----------------------------------------
       Create Follow-up
    ----------------------------------------- */

    async create(req, res, next) {

        try {

            const body = {
                ...req.body,
                createdBy: req.user?.id || null
            };

            const followUp =
                await LeadFollowUpService.create(
                    req.params.leadId,
                    body
                );

            return ApiResponse.success(
                res,
                "Follow-up created successfully.",
                followUp,
                201
            );

        } catch (error) {

            next(error);

        }

    }

    /* ----------------------------------------
       Get All Follow-ups
    ----------------------------------------- */

    async findAll(req, res, next) {

        try {

            const followUps =
                await LeadFollowUpService.findAll(
                    req.params.leadId
                );

            return ApiResponse.success(
                res,
                "Follow-ups fetched successfully.",
                followUps
            );

        } catch (error) {

            next(error);

        }

    }

    /* ----------------------------------------
       Get Follow-up By Id
    ----------------------------------------- */

    async findById(req, res, next) {

        try {

            const followUp =
                await LeadFollowUpService.findById(
                    req.params.id
                );

            return ApiResponse.success(
                res,
                "Follow-up fetched successfully.",
                followUp
            );

        } catch (error) {

            next(error);

        }

    }

    /* ----------------------------------------
       Update Follow-up
    ----------------------------------------- */

    async update(req, res, next) {

        try {

            const followUp =
                await LeadFollowUpService.update(
                    req.params.id,
                    req.body
                );

            return ApiResponse.success(
                res,
                "Follow-up updated successfully.",
                followUp
            );

        } catch (error) {

            next(error);

        }

    }

    /* ----------------------------------------
       Delete Follow-up
    ----------------------------------------- */

    async delete(req, res, next) {

        try {

            await LeadFollowUpService.delete(
                req.params.id
            );

            return ApiResponse.success(
                res,
                "Follow-up deleted successfully.",
                null
            );

        } catch (error) {

            next(error);

        }

    }

}

export default new LeadFollowUpController();
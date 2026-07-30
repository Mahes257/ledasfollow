import LeadActivityService from "../services/LeadActivityService.js";

import ApiResponse from "../../../common/responses/ApiResponse.js";

class LeadActivityController {

    async findAll(req, res, next) {

        try {

            const data = await LeadActivityService.getActivities(

                req.params.leadId

            );

            return ApiResponse.success(

                res,

                "Activities fetched successfully.",

                data

            );

        } catch (error) {

            next(error);

        }

    }

}

export default new LeadActivityController();
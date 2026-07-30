import LeadRepository from "../repositories/LeadRepository.js";
import LeadActivityRepository from "../repositories/LeadActivityRepository.js";

import ApiError from "../../../common/errors/ApiError.js";

class LeadActivityService {

    async log(
        leadId,
        action,
        description = null,
        createdBy = null
    ) {

        return await LeadActivityRepository.create(

            leadId,

            action,

            description,

            createdBy

        );

    }

    async getActivities(leadId) {

        const lead = await LeadRepository.findById(
            leadId
        );

        if (!lead) {

            throw new ApiError(
                404,
                "Lead not found."
            );

        }

        return await LeadActivityRepository.findAll(
            leadId
        );

    }

}

export default new LeadActivityService();
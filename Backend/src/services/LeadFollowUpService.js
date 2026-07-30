import LeadRepository from "../repositories/LeadRepository.js";
import LeadFollowUpRepository from "../repositories/LeadFollowUpRepository.js";

import CreateLeadFollowUpDTO from "../dto/CreateLeadFollowUpDTO.js";

import ApiError from "../../../common/errors/ApiError.js";

class LeadFollowUpService {

    /* ----------------------------------------
       Create Follow-up
    ----------------------------------------- */

    async create(leadId, body) {

        const lead = await LeadRepository.findById(leadId);

        if (!lead) {
            throw new ApiError(
                404,
                "Lead not found."
            );
        }

        const dto = new CreateLeadFollowUpDTO(body);

        return await LeadFollowUpRepository.create(
            leadId,
            dto
        );

    }

    /* ----------------------------------------
       Get All Follow-ups
    ----------------------------------------- */

    async findAll(leadId) {

        const lead = await LeadRepository.findById(leadId);

        if (!lead) {
            throw new ApiError(
                404,
                "Lead not found."
            );
        }

        return await LeadFollowUpRepository.findAll(
            leadId
        );

    }

    /* ----------------------------------------
       Get One Follow-up
    ----------------------------------------- */

    async findById(id) {

        const followUp =
            await LeadFollowUpRepository.findById(id);

        if (!followUp) {
            throw new ApiError(
                404,
                "Follow-up not found."
            );
        }

        return followUp;

    }

    /* ----------------------------------------
       Update Follow-up
    ----------------------------------------- */

    async update(id, body) {

        await this.findById(id);

        return await LeadFollowUpRepository.update(
            id,
            body
        );

    }

    /* ----------------------------------------
       Delete Follow-up
    ----------------------------------------- */

    async delete(id) {

        await this.findById(id);

        return await LeadFollowUpRepository.delete(id);

    }

}

export default new LeadFollowUpService();
import LeadRepository from "../repositories/LeadRepository.js";

import CreateLeadDTO from "../dto/CreateLeadDTO.js";
import UpdateLeadDTO from "../dto/UpdateLeadDTO.js";

import ApiError from "../../../common/errors/ApiError.js";

import { generateLeadNumber } from "../../../utils/documentNumber.js";

import LeadActivityService from "./LeadActivityService.js";

class LeadService {

    /* =====================================================
       CREATE LEAD
    ====================================================== */

    async createLead(
        data,
        userId = null
    ) {

        const enrichedData = {
            ...data,
            createdBy: data.createdBy || userId || null
        };

        const dto = new CreateLeadDTO(enrichedData);
        let lastError = null;

        for (let attempt = 0; attempt < 3; attempt++) {

            try {

                // Generate Lead Number
                const latestLead = await LeadRepository.findLastLeadNumber();

                const lastLeadNumber = latestLead
                    ? latestLead.leadNumber
                    : null;

                dto.leadNumber = generateLeadNumber(lastLeadNumber);

                const lead = await LeadRepository.create(dto);

                // Log Activity
                await LeadActivityService.log(
                    lead.id,
                    "Lead Created",
                    `Lead ${lead.leadNumber} created successfully.`,
                    dto.createdBy
                );

                return lead;

            } catch (err) {

                lastError = err;

                // Prisma unique constraint violation (P2002)
                if (
                    err.code === "P2002" &&
                    err.meta?.target?.includes("leadNumber")
                ) {
                    // Retry with next number
                    continue;
                }

                // Non-unique errors bubble up immediately
                throw err;

            }

        }

        // All retries exhausted
        throw new ApiError(
            409,
            "Lead Number already exists. Please try again."
        );

    }

    /* =====================================================
       GET ALL LEADS
    ====================================================== */

    async getAllLeads(query) {

        return await LeadRepository.findAll(query);

    }

    /* =====================================================
       GET LEAD BY ID
    ====================================================== */

    async getLeadById(id) {

        const lead = await LeadRepository.findById(id);

        if (!lead) {

            throw new ApiError(
                404,
                "Lead not found."
            );

        }

        return lead;

    }

    /* =====================================================
       UPDATE LEAD
    ====================================================== */

    async updateLead(id, data) {

        await this.getLeadById(id);

        const dto = new UpdateLeadDTO(data);

        const lead = await LeadRepository.update(
            id,
            dto
        );

        await LeadActivityService.log(
            id,
            "Lead Updated",
            "Lead information updated.",
            dto.updatedBy
        );

        return lead;

    }

    /* =====================================================
       DELETE LEAD (SOFT DELETE)
    ====================================================== */

    async deleteLead(
        id,
        deletedBy = "SYSTEM"
    ) {

        await this.getLeadById(id);

        const lead = await LeadRepository.softDelete(
            id,
            deletedBy
        );

        await LeadActivityService.log(
            id,
            "Lead Deleted",
            "Lead moved to recycle bin.",
            deletedBy
        );

        return lead;

    }

    /* =====================================================
       DASHBOARD
    ====================================================== */

    async getDashboard() {

        return await LeadRepository.findDashboard();

    }

    /* =====================================================
       PIPELINE
    ====================================================== */

    async getPipeline() {

        return await LeadRepository.findPipeline();

    }

    /* =====================================================
       RECENT LEADS
    ====================================================== */

    async getRecentLeads(limit = 10) {

        return await LeadRepository.findRecent(limit);

    }

    /* =====================================================
       COUNT BY STAGE
    ====================================================== */

    async countByStage() {

        return await LeadRepository.countByStage();

    }

    /* =====================================================
       CONVERT LEAD TO CUSTOMER
    ====================================================== */

    async convertToCustomer(leadId, customerData, userId) {

        const lead = await this.getLeadById(leadId);

        if (lead.leadStatus === "CONVERTED") {
            throw new ApiError(400, "Lead is already converted.");
        }

        const CustomerService = (await import("../../customers/services/CustomerService.js")).default;

        // Create customer from lead data
        const customer = await CustomerService.create({
            name: customerData.name || lead.company,
            contactPerson: customerData.contactPerson || lead.contactPerson,
            email: customerData.email || lead.email,
            phone: customerData.phone || lead.phone,
            mobile: lead.mobile,
            gst: customerData.gst || lead.gstNumber,
            address: customerData.address || lead.address,
            city: customerData.city || lead.city,
            state: customerData.state || lead.state,
            country: customerData.country || lead.country,
            pincode: customerData.pincode || lead.postalCode,
            notes: customerData.notes || lead.remarks || lead.description,
            createdBy: userId
        });

        // Update lead status to CONVERTED and link to customer
        await LeadRepository.update(leadId, {
            leadStatus: "CONVERTED",
            convertedToCustomerId: customer.id,
            updatedBy: userId
        });

        // Log activity
        await LeadActivityService.log(
            leadId,
            "Lead Converted",
            `Lead converted to customer: ${customer.customerNumber}`,
            userId
        );

        return {
            customer,
            leadId: lead.id,
            leadNumber: lead.leadNumber
        };

    }

    /* =====================================================
       COUNT BY STATUS
    ====================================================== */

    async countByStatus() {

        return await LeadRepository.countByStatus();

    }

}

export default new LeadService();
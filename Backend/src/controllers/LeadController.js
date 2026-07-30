import LeadService from "../services/LeadService.js";
import ApiResponse from "../../../common/responses/ApiResponse.js";

class LeadController {

    async create(req, res, next) {

        try {

            const lead = await LeadService.createLead(
                req.body,
                req.user?.id
            );

            return ApiResponse.success(
                res,
                "Lead created successfully.",
                lead,
                201
            );

        } catch (error) {
            next(error);
        }

    }

    async findAll(req, res, next) {

        try {

            const leads = await LeadService.getAllLeads(req.query);

            return ApiResponse.success(
                res,
                "Leads fetched successfully.",
                leads
            );

        } catch (error) {
            next(error);
        }

    }

    async findById(req, res, next) {

        try {

            const lead = await LeadService.getLeadById(req.params.id);

            return ApiResponse.success(
                res,
                "Lead fetched successfully.",
                lead
            );

        } catch (error) {
            next(error);
        }

    }

    async update(req, res, next) {

        try {

            const lead = await LeadService.updateLead(
                req.params.id,
                req.body
            );

            return ApiResponse.success(
                res,
                "Lead updated successfully.",
                lead
            );

        } catch (error) {
            next(error);
        }

    }

    async delete(req, res, next) {

        try {

            await LeadService.deleteLead(
                req.params.id,
                req.user?.id || null
            );

            return ApiResponse.success(
                res,
                "Lead deleted successfully."
            );

        } catch (error) {
            next(error);
        }

    }

    async dashboard(req, res, next) {

        try {

            const dashboard = await LeadService.getDashboard();

            return ApiResponse.success(
                res,
                "Dashboard fetched successfully.",
                dashboard
            );

        } catch (error) {
            next(error);
        }

    }

    async pipeline(req, res, next) {

        try {

            const pipeline = await LeadService.getPipeline();

            return ApiResponse.success(
                res,
                "Pipeline fetched successfully.",
                pipeline
            );

        } catch (error) {
            next(error);
        }

    }

    async convert(req, res, next) {

        try {

            const result = await LeadService.convertToCustomer(
                req.params.id,
                req.body,
                req.user?.id || "SYSTEM"
            );

            return ApiResponse.success(
                res,
                "Lead converted to customer successfully.",
                result
            );

        } catch (error) {
            next(error);
        }

    }

}

export default new LeadController();
window.VT = window.VT || {};

VT.LeadFollowUpSync = {

    async syncAll() {
        try {
            // Cannot fetch all followups at once via API (they're scoped by lead).
            // We'll fetch followups per lead, handling the aggregation here.
            const leads = VT.DataHub.getLeads();
            let allFollowups = [];
            for (const lead of leads) {
                try {
                    const response = await LeadFollowUpApi.getAll(lead.id);
                    if (response && response.data) {
                        const items = Array.isArray(response.data) ? response.data : response.data.data || [];
                        allFollowups = allFollowups.concat(items);
                    }
                } catch (e) {
                    // Skip leads that fail individually
                }
            }
            VT.DataHub.saveLeadFollowups(allFollowups);
            VT.refresh("followups");
            return allFollowups;
        } catch (error) {
            console.error("FollowUp Sync All Failed", error);
            return VT.DataHub.getLeadFollowups();
        }
    },

    async syncByLead(leadId) {
        try {
            const response = await LeadFollowUpApi.getAll(leadId);
            let followups = [];
            if (response && response.data) {
                followups = Array.isArray(response.data) ? response.data : response.data.data || [];
            }
            // Merge with existing followups in DataHub
            const existing = VT.DataHub.getLeadFollowups();
            const filtered = existing.filter(f => f.leadId !== leadId && f.leadNo !== leadId);
            const merged = filtered.concat(followups);
            VT.DataHub.saveLeadFollowups(merged);
            VT.refresh("followups");
            return followups;
        } catch (error) {
            console.error("FollowUp Sync By Lead Failed", error);
            return [];
        }
    },

    async create(leadId, data) {
        const response = await LeadFollowUpApi.create(leadId, data);
        await this.syncByLead(leadId);
        return response;
    },

    async update(id, data) {
        const response = await LeadFollowUpApi.update(id, data);
        // Re-sync all followups to update DataHub
        await this.syncAll();
        return response;
    },

    async delete(id, leadId) {
        const response = await LeadFollowUpApi.delete(id);
        if (leadId) {
            await this.syncByLead(leadId);
        } else {
            await this.syncAll();
        }
        return response;
    },

    async getById(id) {
        try {
            const response = await LeadFollowUpApi.getById(id);
            return response.data || response;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

};

window.VT = window.VT || {};

VT.LeadSync = {

    async syncLeads() {

        try {

            const response = await LeadApi.getAll();

            let leads = [];

            if (response && response.data) {

                if (Array.isArray(response.data)) {

                    leads = response.data;

                } else if (Array.isArray(response.data.data)) {

                    leads = response.data.data;

                }

            }

            VT.DataHub.saveLeads(leads);

            VT.refresh("leads");

            return leads;

        } catch (error) {

            console.error("Lead Sync Failed", error);

            return VT.DataHub.getLeads();

        }

    },

    async syncLead(id) {

        try {

            const response = await LeadApi.getById(id);

            let lead = response.data || response;

            let leads = VT.DataHub.getLeads();

            const index = leads.findIndex(l => l.id === lead.id);

            if (index >= 0) {

                leads[index] = lead;

            } else {

                leads.push(lead);

            }

            VT.DataHub.saveLeads(leads);

            VT.refresh("leads");

            return lead;

        } catch (error) {

            console.error(error);

            return null;

        }

    },

    async createLead(data) {

        try {

            const response = await LeadApi.create(data);

            await this.syncLeads();

            return response;

        } catch (error) {

            console.error("Lead Create Failed", error);

            throw error;

        }

    },

    async updateLead(id, data) {

        try {

            const response = await LeadApi.update(id, data);

            await this.syncLeads();

            return response;

        } catch (error) {

            console.error("Lead Update Failed", error);

            throw error;

        }

    },

    async deleteLead(id) {

        const response = await LeadApi.delete(id);

        await this.syncLeads();

        return response;

    },

    async syncFollowups(leadId) {

        try {

            const response = await LeadApi.getFollowUps(leadId);

            let followups = [];

            if (response && response.data) {

                followups = response.data;

            }

            VT.DataHub.saveLeadFollowups(followups);

            VT.refresh("followups");

            return followups;

        } catch (error) {

            console.error(error);

            return VT.DataHub.getLeadFollowups();

        }

    },

    async createFollowup(leadId, data) {

        const response = await LeadApi.createFollowUp(

            leadId,

            data

        );

        await this.syncFollowups(leadId);

        return response;

    },

    async syncActivities(leadId) {

        try {

            const response = await LeadApi.getActivities(

                leadId

            );

            let activities = [];

            if (response && response.data) {

                activities = response.data;

            }

            VT.DataHub.saveActivities(

                activities

            );

            VT.refresh("activities");

            return activities;

        } catch (error) {

            console.error(error);

            return VT.DataHub.getActivities();

        }

    },

    async syncAttachments(leadId) {

        try {

            const response = await LeadApi.getAttachments(

                leadId

            );

            return response.data || [];

        } catch (error) {

            console.error(error);

            return [];

        }

    }

};
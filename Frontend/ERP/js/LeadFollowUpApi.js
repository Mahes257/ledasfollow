class LeadFollowUpApi {

    static getAll(leadId) {
        return ApiService.get(`/leads/${leadId}/followups`);
    }

    static getById(id) {
        return ApiService.get(`/leads/followups/${id}`);
    }

    static create(leadId, data) {
        return ApiService.post(`/leads/${leadId}/followups`, data);
    }

    static update(id, data) {
        return ApiService.put(`/leads/followups/${id}`, data);
    }

    static delete(id) {
        return ApiService.delete(`/leads/followups/${id}`);
    }

}

window.LeadFollowUpApi = LeadFollowUpApi;

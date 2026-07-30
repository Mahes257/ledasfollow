class LeadApi {

    // ==========================
    // Leads
    // ==========================

    static getAll(params = "") {
        return ApiService.get(`/leads${params ? `?${params}` : ""}`);
    }

    static getById(id) {
        return ApiService.get(`/leads/${id}`);
    }

    static create(data) {
        return ApiService.post("/leads", data);
    }

    static update(id, data) {
        return ApiService.put(`/leads/${id}`, data);
    }

    static delete(id) {
        return ApiService.delete(`/leads/${id}`);
    }

    // ==========================
    // Dashboard
    // ==========================

    static getDashboard() {
        return ApiService.get("/leads/dashboard");
    }

    static getPipeline() {
        return ApiService.get("/leads/pipeline");
    }

    // ==========================
    // Follow Ups
    // ==========================

    static getFollowUps(leadId) {
        return ApiService.get(`/leads/${leadId}/followups`);
    }

    static createFollowUp(leadId, data) {
        return ApiService.post(`/leads/${leadId}/followups`, data);
    }

    // ==========================
    // Activities
    // ==========================

    static getActivities(leadId) {
        return ApiService.get(`/leads/${leadId}/activities`);
    }

    // ==========================
    // Attachments
    // ==========================

    static getAttachments(leadId) {
        return ApiService.get(`/leads/${leadId}/attachments`);
    }

    static async uploadAttachment(leadId, file) {

        const formData = new FormData();
        formData.append("file", file);

        const token = ApiService.getToken();

        const response = await fetch(
            `${ApiService.BASE_URL}/leads/${leadId}/attachments`,
            {
                method: "POST",
                headers: {
                    Authorization: token ? `Bearer ${token}` : ""
                },
                body: formData
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw data;
        }

        return data;

    }

    static downloadAttachment(id) {
        window.open(
            `${ApiService.BASE_URL}/leads/attachments/${id}/download`,
            "_blank"
        );
    }

    static deleteAttachment(id) {
        return ApiService.delete(`/leads/attachments/${id}`);
    }

    // ==========================
    // Get Single Attachment
    // ==========================

    static getAttachmentById(id) {
        return ApiService.get(`/leads/attachments/${id}`);
    }

    // ==========================
    // Convert Lead to Customer
    // ==========================

    static convert(id, data = {}) {
        return ApiService.post(`/leads/${id}/convert`, data);
    }

}

window.LeadApi = LeadApi;
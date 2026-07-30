class ContactApi {

    // ==========================
    // Contacts (CRUD)
    // ==========================

    static getAll(params = "") {
        return ApiService.get(`/contacts${params ? `?${params}` : ""}`);
    }

    static getById(id) {
        return ApiService.get(`/contacts/${id}`);
    }

    static create(data) {
        return ApiService.post("/contacts", data);
    }

    static update(id, data) {
        return ApiService.put(`/contacts/${id}`, data);
    }

    static delete(id) {
        return ApiService.delete(`/contacts/${id}`);
    }

    // ==========================
    // Restore / Duplicate
    // ==========================

    static restore(id) {
        return ApiService.post(`/contacts/${id}/restore`);
    }

    static duplicate(id) {
        return ApiService.post(`/contacts/${id}/duplicate`);
    }

    // ==========================
    // Export / Import
    // ==========================

    static exportContacts(format = "csv") {
        // For CSV/JSON export, download the file
        const token = ApiService.getToken();
        window.open(
            `${ApiService.BASE_URL}/contacts/export?format=${format}&token=${token}`,
            "_blank"
        );
    }

    static importContacts(formData) {
        return ApiService.upload("/contacts/import", formData);
    }

    // ==========================
    // Bulk Operations
    // ==========================

    static bulkDelete(ids) {
        return ApiService.post("/contacts/bulk/delete", { ids });
    }

    static bulkRestore(ids) {
        return ApiService.post("/contacts/bulk/restore", { ids });
    }

    static bulkPermanentDelete(ids) {
        return ApiService.post("/contacts/bulk/permanent-delete", { ids });
    }

}

window.ContactApi = ContactApi;

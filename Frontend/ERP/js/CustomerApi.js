class CustomerApi {

    // ==========================
    // Customers (CRUD)
    // ==========================

    static getAll(params = "") {
        return ApiService.get(`/customers${params ? `?${params}` : ""}`);
    }

    static getById(id) {
        return ApiService.get(`/customers/${id}`);
    }

    static create(data) {
        return ApiService.post("/customers", data);
    }

    static update(id, data) {
        return ApiService.put(`/customers/${id}`, data);
    }

    static delete(id) {
        return ApiService.delete(`/customers/${id}`);
    }

    // ==========================
    // Dashboard / Stats
    // ==========================

    static getDashboard() {
        return ApiService.get("/customers/stats/summary");
    }

    // ==========================
    // Addresses
    // ==========================

    static getAddresses(customerId) {
        return ApiService.get(`/customers/${customerId}/addresses`);
    }

    static createAddress(customerId, data) {
        return ApiService.post(`/customers/${customerId}/addresses`, data);
    }

    static updateAddress(addressId, data) {
        return ApiService.put(`/customers/addresses/${addressId}`, data);
    }

    static deleteAddress(addressId) {
        return ApiService.delete(`/customers/addresses/${addressId}`);
    }

    // ==========================
    // Contact Persons
    // ==========================

    static getContactPersons(customerId) {
        return ApiService.get(`/customers/${customerId}/contacts`);
    }

    static createContactPerson(customerId, data) {
        return ApiService.post(`/customers/${customerId}/contacts`, data);
    }

    static updateContactPerson(contactId, data) {
        return ApiService.put(`/customers/contacts/${contactId}`, data);
    }

    static deleteContactPerson(contactId) {
        return ApiService.delete(`/customers/contacts/${contactId}`);
    }

    // ==========================
    // Visits
    // ==========================

    static getVisits(customerId) {
        return ApiService.get(`/customers/${customerId}/visits`);
    }

    static createVisit(customerId, data) {
        return ApiService.post(`/customers/${customerId}/visits`, data);
    }

    // ==========================
    // Feedback
    // ==========================

    static getFeedback(customerId) {
        return ApiService.get(`/customers/${customerId}/feedback`);
    }

    static createFeedback(customerId, data) {
        return ApiService.post(`/customers/${customerId}/feedback`, data);
    }

    // ==========================
    // Purchase Orders
    // ==========================

    static getPos(customerId) {
        return ApiService.get(`/customers/${customerId}/pos`);
    }

    static createPo(customerId, data) {
        return ApiService.post(`/customers/${customerId}/pos`, data);
    }

    static getPoById(poId) {
        return ApiService.get(`/customers/pos/${poId}`);
    }

    // ==========================
    // Ledger
    // ==========================

    static getLedger(customerId, params = "") {
        return ApiService.get(`/customers/${customerId}/ledger${params ? `?${params}` : ""}`);
    }

}

window.CustomerApi = CustomerApi;

window.VT = window.VT || {};

VT.CustomerSync = {

    // ==========================
    // Customers
    // ==========================

    async syncCustomers() {
        try {
            const response = await CustomerApi.getAll();
            let customers = [];
            if (response && response.data) {
                if (Array.isArray(response.data)) {
                    customers = response.data;
                } else if (Array.isArray(response.data.data)) {
                    customers = response.data.data;
                }
            }
            VT.DataHub.saveClients(customers);
            VT.refresh("clients");
            return customers;
        } catch (error) {
            console.error("Customer Sync Failed", error);
            return VT.DataHub.getClients();
        }
    },

    async syncCustomer(id) {
        try {
            const response = await CustomerApi.getById(id);
            let customer = response.data || response;
            let customers = VT.DataHub.getClients();
            const index = customers.findIndex(c => c.id === customer.id);
            if (index >= 0) {
                customers[index] = customer;
            } else {
                customers.push(customer);
            }
            VT.DataHub.saveClients(customers);
            VT.refresh("clients");
            return customer;
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    async createCustomer(data) {
        const response = await CustomerApi.create(data);
        await this.syncCustomers();
        return response;
    },

    async updateCustomer(id, data) {
        const response = await CustomerApi.update(id, data);
        await this.syncCustomers();
        return response;
    },

    async deleteCustomer(id) {
        const response = await CustomerApi.delete(id);
        await this.syncCustomers();
        return response;
    },

    // ==========================
    // Dashboard
    // ==========================

    async syncDashboard() {
        try {
            return await CustomerApi.getDashboard();
        } catch (error) {
            console.error("Dashboard Sync Failed", error);
            return null;
        }
    },

    // ==========================
    // Addresses
    // ==========================

    async getAddresses(customerId) {
        try {
            const response = await CustomerApi.getAddresses(customerId);
            return response.data || [];
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    async createAddress(customerId, data) {
        const response = await CustomerApi.createAddress(customerId, data);
        return response;
    },

    async updateAddress(addressId, data) {
        const response = await CustomerApi.updateAddress(addressId, data);
        return response;
    },

    async deleteAddress(addressId) {
        const response = await CustomerApi.deleteAddress(addressId);
        return response;
    },

    // ==========================
    // Contact Persons
    // ==========================

    async getContactPersons(customerId) {
        try {
            const response = await CustomerApi.getContactPersons(customerId);
            return response.data || [];
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    async createContactPerson(customerId, data) {
        const response = await CustomerApi.createContactPerson(customerId, data);
        return response;
    },

    async updateContactPerson(contactId, data) {
        const response = await CustomerApi.updateContactPerson(contactId, data);
        return response;
    },

    async deleteContactPerson(contactId) {
        const response = await CustomerApi.deleteContactPerson(contactId);
        return response;
    },

    // ==========================
    // Visits
    // ==========================

    async getVisits(customerId) {
        try {
            const response = await CustomerApi.getVisits(customerId);
            return response.data || [];
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    async createVisit(customerId, data) {
        const response = await CustomerApi.createVisit(customerId, data);
        return response;
    },

    // ==========================
    // Feedback
    // ==========================

    async getFeedback(customerId) {
        try {
            const response = await CustomerApi.getFeedback(customerId);
            return response.data || [];
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    async createFeedback(customerId, data) {
        const response = await CustomerApi.createFeedback(customerId, data);
        return response;
    },

    // ==========================
    // Purchase Orders
    // ==========================

    async getPos(customerId) {
        try {
            const response = await CustomerApi.getPos(customerId);
            return response.data || [];
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    async createPo(customerId, data) {
        const response = await CustomerApi.createPo(customerId, data);
        return response;
    },

    async getPoById(poId) {
        try {
            return await CustomerApi.getPoById(poId);
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    // ==========================
    // Ledger
    // ==========================

    async getLedger(customerId, params = "") {
        try {
            const response = await CustomerApi.getLedger(customerId, params);
            return response.data || [];
        } catch (error) {
            console.error(error);
            return [];
        }
    }

};

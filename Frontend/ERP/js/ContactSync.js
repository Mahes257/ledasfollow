window.VT = window.VT || {};

VT.ContactSync = {

    async syncContacts() {
        try {
            const response = await ContactApi.getAll();
            let contacts = [];
            if (response && response.data) {
                if (Array.isArray(response.data)) {
                    contacts = response.data;
                } else if (Array.isArray(response.data.data)) {
                    contacts = response.data.data;
                }
            }
            VT.DataHub.saveContacts(contacts);
            VT.refresh("contacts");
            return contacts;
        } catch (error) {
            console.error("Contact Sync Failed", error);
            return VT.DataHub.getContacts();
        }
    },

    async syncContact(id) {
        try {
            const response = await ContactApi.getById(id);
            let contact = response.data || response;
            let contacts = VT.DataHub.getContacts();
            const index = contacts.findIndex(c => c.id === contact.id);
            if (index >= 0) {
                contacts[index] = contact;
            } else {
                contacts.push(contact);
            }
            VT.DataHub.saveContacts(contacts);
            VT.refresh("contacts");
            return contact;
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    async createContact(data) {
        const response = await ContactApi.create(data);
        await this.syncContacts();
        return response;
    },

    async updateContact(id, data) {
        const response = await ContactApi.update(id, data);
        await this.syncContacts();
        return response;
    },

    async deleteContact(id) {
        const response = await ContactApi.delete(id);
        await this.syncContacts();
        return response;
    },

    async restoreContact(id) {
        const response = await ContactApi.restore(id);
        await this.syncContacts();
        return response;
    },

    async duplicateContact(id) {
        const response = await ContactApi.duplicate(id);
        await this.syncContacts();
        return response;
    },

    async bulkDelete(ids) {
        const response = await ContactApi.bulkDelete(ids);
        await this.syncContacts();
        return response;
    },

    async bulkRestore(ids) {
        const response = await ContactApi.bulkRestore(ids);
        await this.syncContacts();
        return response;
    },

    exportContacts(format) {
        ContactApi.exportContacts(format);
    }

};

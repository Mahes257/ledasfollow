window.VT = window.VT || {};
VT.App = {
    pageModules: {
        'dashboard':       { module: 'VT.Dashboard', file: 'js/dashboard.js' },
        'sales-dashboard': { module: 'VT.Dashboard', file: 'js/dashboard.js' },
        'quotations':      { module: 'VT.Quotations', file: 'js/quotations.js' },
        'quotation-view':  { module: 'VT.Quotations', file: 'js/quotations.js' },
        'proforma':        { module: 'VT.Proformas', file: 'js/proformas.js' },
        'proforma-view':   { module: 'VT.Proformas', file: 'js/proformas.js' },
        'proforma-create': { module: 'VT.Proformas', file: 'js/proforma-create.js' },
        'proforma-design': { module: 'VT.Proformas', file: 'js/proforma-design.js' },
        'invoices':        { module: 'VT.Invoices',  file: 'js/invoices.js' },
        'purchase':               { module: 'VT.Purchase',  file: 'js/purchase.js' },
        'purchase-orders':        { module: 'VT.Purchase',  file: 'js/purchase.js' },
        'purchase-bills':         { module: 'VT.Purchase',  file: 'js/purchase.js' },
        'purchase-dashboard':     { module: 'VT.Purchase',  file: 'js/purchase.js' },
        'purchase-requisition-list':   { module: 'VT.Purchase',  file: 'js/purchase.js' },
        'purchase-requisition-create': { module: 'VT.Purchase',  file: 'js/purchase.js' },
        'purchase-requisition-view':   { module: 'VT.Purchase',  file: 'js/purchase.js' },
        'rfq-create':             { module: 'VT.Purchase',  file: 'js/purchase.js' },
        'rfq-view':               { module: 'VT.Purchase',  file: 'js/purchase.js' },
        'quotation-comparison':   { module: 'VT.Purchase',  file: 'js/purchase.js' },
        'technical-evaluation':   { module: 'VT.Purchase',  file: 'js/purchase.js' },
        'commercial-evaluation':  { module: 'VT.Purchase',  file: 'js/purchase.js' },
        'price-negotiation':      { module: 'VT.Purchase',  file: 'js/purchase.js' },
        'supplier-selection':     { module: 'VT.Purchase',  file: 'js/purchase.js' },
        'vendor-performance':     { module: 'VT.Vendors',    file: 'js/vendors.js' },
        'crm':             { module: 'VT.CRM',       file: 'js/crm.js' },
        'clients':         { module: 'VT.Clients',   file: 'js/clients.js' },
        'client-create':   { module: 'VT.Clients',   file: 'js/clients.js' },
        'client-view':     { module: 'VT.Clients',   file: 'js/clients.js' },
        'contacts':        { module: 'VT.Contacts',  file: 'js/contacts.js' },
        'contact-create':  { module: 'VT.Contacts',  file: 'js/contacts.js' },
        'contact-view':    { module: 'VT.Contacts',  file: 'js/contacts.js' },
        'contact-edit':    { module: 'VT.Contacts',  file: 'js/contacts.js' },
        'credit-notes':    { module: 'VT.CreditNotes', file: 'js/accounting.js' },
        'creditnotes':     { module: 'VT.CreditNotes', file: 'js/accounting.js' },
        'debit-notes':     { module: 'VT.DebitNotes',  file: 'js/accounting.js' },
        'hrms':            { module: 'VT.HRMS',       file: 'js/hrms.js' },
        'inventory':       { module: 'VT.Inventory',  file: 'js/inventory.js' },
        'vendors':         { module: 'VT.Vendors',    file: 'js/vendors.js' },
        'vendor-create':     { module: 'VT.VendorCreate',    file: 'js/vendor-create.js' },
        'vendor-view':       { module: 'VT.Vendors',    file: 'js/vendors.js' },
        'vendor-edit':       { module: 'VT.Vendors',    file: 'js/vendors.js' },
        'vendor-archive':    { module: 'VT.Vendors',    file: 'js/vendors.js' },
        'leads':              { module: 'VT.Leads', file: 'js/leads.js' },
        'lead-overview':      { module: 'VT.LeadOverview', file: 'js/lead-overview.js' },
        'vl-create':          { module: 'VT.Leads', file: 'js/leads.js' },
        'vl-view':            { module: 'VT.Leads', file: 'js/leads.js' },
        'vl-edit':            { module: 'VT.Leads', file: 'js/leads.js' },
        'vendor-bulk-upload': { module: 'VT.Leads', file: 'js/leads.js' },
        'salesorders':     { module: 'VT.SalesOrders', file: 'js/salesorders.js' },
        'payoutreceipts':  { module: 'VT.PayoutReceipts', file: 'js/payoutreceipts.js' },
        'payout-receipts': { module: 'VT.PayoutReceipts', file: 'js/payoutreceipts.js' },
        'paymentreceipts': { module: 'VT.PaymentReceipts', file: 'js/paymentreceipts.js' },
        'payment-receipts': { module: 'VT.PaymentReceipts', file: 'js/paymentreceipts.js' },
        'payment-receipt-create': { module: 'VT.PaymentReceiptCreate', file: 'js/payment-receipt-create.js' },
        'deliverychallans': { module: 'VT.DeliveryChallans', file: 'js/deliverychallans.js' },
        'delivery-challans': { module: 'VT.DeliveryChallans', file: 'js/deliverychallans.js' },
        'dc-create': { module: 'VT.DeliveryChallans', file: 'js/deliverychallans.js' },
        'delivery-challan-view': { module: 'VT.DeliveryChallans', file: 'js/deliverychallans.js' },
        'delivery-challan-edit': { module: 'VT.DeliveryChallans', file: 'js/deliverychallans.js' },
        'delivery-challan-print': { module: 'VT.DeliveryChallans', file: 'js/deliverychallans.js' },
        'delivery-challan-pdf': { module: 'VT.DeliveryChallans', file: 'js/deliverychallans.js' },
        'delivery-challan-report': { module: 'VT.DeliveryChallans', file: 'js/deliverychallans.js' },
        'cn-create': { module: 'VT.CreditNotes', file: 'js/accounting.js' },
        'expenses': { module: 'VT.Expenses', file: 'js/expense-create.js' },
        'expense-create': { module: 'VT.Expenses', file: 'js/expense-create.js' },
        'expense-edit': { module: 'VT.Expenses', file: 'js/expense-create.js' },
        'cpr-reports': { module: 'VT.CPR', file: 'js/cpr.js' },
        'cost-workout': { module: 'VT.CostWorkout', file: 'js/cost-workout.js' },
        'cost-workout-list': { module: 'VT.CostWorkout', file: 'js/cost-workout.js' },
        'create-cost-workout': { module: 'VT.CostWorkout', file: 'js/cost-workout.js' },
        'followups': { module: 'VT.Followups', file: 'js/followups.js' },
        'followup-create': { module: 'VT.Followups', file: 'js/followups.js' },
        'pr-list': { module: 'VT.PurchaseRequest', file: 'js/pr-module.js' },
        'pr-create': { module: 'VT.PRCreate', file: 'js/pr-create.js' },
        'pr-view': { module: 'VT.PurchaseRequest', file: 'js/pr-module.js' },
        'pr-cost-workout': { module: 'VT.PRCostWorkout', file: 'js/pr-cost-workout.js' },
        'pr-reports': { module: 'VT.PurchaseRequest', file: 'js/pr-module.js' },
        'pr-approval': { module: 'VT.PRApproval', file: 'js/pr-approval.js' },
        'technical-specification-review': { module: 'VT.Purchase', file: 'js/purchase.js' },
        'vendor-sourcing': { module: 'VT.Purchase', file: 'js/purchase.js' },
        'approved-vendors': { module: 'VT.Purchase', file: 'js/purchase.js' },
        'vendor-quotations': { module: 'VT.Purchase', file: 'js/purchase.js' },
        'cost-estimation': { module: 'VT.Purchase', file: 'js/purchase.js' },
        'released-purchase-orders': { module: 'VT.Purchase', file: 'js/purchase.js' },
        'manufacturing-packing': { module: 'VT.Purchase', file: 'js/purchase.js' },
        'vendor-analysis': { module: 'VT.Purchase', file: 'js/purchase.js' },
        'purchase-list': { module: 'VT.Purchase', file: 'js/purchase.js' },
        'purchase-rfq': { module: 'VT.Purchase', file: 'js/purchase.js' },
        'purchase-order-approval': { module: 'VT.Purchase', file: 'js/purchase.js' },
        'purchase-invoice-list': { module: 'VT.Purchase', file: 'js/purchase.js' },
        'purchase-settings': { module: 'VT.Purchase', file: 'js/purchase.js' },
        'lead-summary': { module: 'VT.LeadSummary', file: 'js/lead-summary.js' },
        'lead-pipeline': { module: 'VT.Leads', file: 'js/leads.js' },
        'lead-overview': { module: 'VT.LeadOverview', file: 'js/lead-overview.js' },
        'sales-contracts': { module: 'VT.SalesContracts', file: 'js/sales-contracts.js' },
        'sales-contract': { module: 'VT.SalesContracts', file: 'js/sales-contracts.js' },
        'create-sales-contract': { module: 'VT.SalesContracts', file: 'js/sales-contracts.js' },
        'sales-contract-view': { module: 'VT.SalesContracts', file: 'js/sales-contracts.js' },
        'sales-contract-approval': { module: 'VT.SalesContracts', file: 'js/sales-contracts.js' },
        'sales-contract-print': { module: 'VT.SalesContracts', file: 'js/sales-contracts.js' },
        'sales-contract-pdf': { module: 'VT.SalesContracts', file: 'js/sales-contracts.js' },
        'sales-contract-report': { module: 'VT.SalesContracts', file: 'js/sales-contracts.js' },
        'attendance': { module: 'VT.Attendance', file: 'js/attendance.js' },
    },

    safeCall: function(obj, method) {
        try {
            if (obj && typeof obj[method] === 'function') {
                obj[method]();
                return true;
            }
            return false;
        } catch (e) {
            console.warn('[VT.App] ' + method + ' error:', e.message);
            return false;
        }
    },

    getModule: function(name) {
        var parts = name.split('.');
        var ctx = window;
        for (var i = 0; i < parts.length; i++) {
            ctx = ctx[parts[i]];
            if (!ctx) return null;
        }
        return ctx;
    },

    initCore: function() {
        this.safeCall(this.getModule('VT.Data'), 'init');
        /* Auth protection: requireAuth() redirects to index.html if not logged in.
           On the login page (index.html) this is intentionally skipped. */
        var page = document.body ? document.body.getAttribute('data-page') : '';
        if (page && page !== 'login') {
            this.safeCall(this.getModule('VT.Auth'), 'requireAuth');
        }
        this.safeCall(this.getModule('VT.Sidebar'), 'init');
        this.safeCall(this.getModule('VT.Theme'), 'init');
        this.safeCall(this.getModule('VT.Utils'), 'initActionMenus');
        // Standardized modules (loaded via js/modules/standard.js)
        // VT.EditableSelect, VT.Validation (enhanced), VT.Search,
        // VT.Workflow, VT.CRUD are auto-initializing
    },

    initPageModule: function(page) {
        var mapping = this.pageModules[page];
        if (!mapping) return;
        var mod = this.getModule(mapping.module);
        if (mod) {
            this.safeCall(mod, 'init');
        }
    },

    init: function() {
        this.initCore();
        var page = document.body ? document.body.getAttribute('data-page') : '';
        if (page) {
            this.initPageModule(page);
        }
    }
};

document.addEventListener('DOMContentLoaded', function() {
    VT.App.init();
});

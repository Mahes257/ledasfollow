/* Lead Summary - Central Hub Module */
window.VT = window.VT || {};

VT.LeadSummary = {
    currentLead: null,
    currentTab: 'overview',

    init: function() {
        var params = new URLSearchParams(window.location.search);
        var leadId = params.get('id');
        if (leadId) {
            this.loadLead(leadId);
        } else {
            // Show lead selector
            this.showLeadSelector();
        }
    },

    showLeadSelector: function() {
        var container = document.getElementById('leadSummaryContainer');
        if (!container) return;
        // Get all leads from CRM data
        var leads = JSON.parse(localStorage.getItem('vt_leads') || '[]');
        if (leads.length === 0) {
            var seedLeads = VT.Data && VT.Data.leads ? VT.Data.leads : [];
            if (seedLeads.length > 0) {
                leads = JSON.parse(JSON.stringify(seedLeads));
            }
        }
        var clients = JSON.parse(localStorage.getItem('vt_clients') || '[]');
        if (clients.length === 0 && VT.Data && VT.Data.clients) {
            clients = JSON.parse(JSON.stringify(VT.Data.clients));
        }

        var html = '<div class="sales-breadcrumb"><a href="dashboard.html">VISHAK TECH</a> <i class="fas fa-chevron-right"></i> <span>Lead Summary</span></div>';
        html += '<div class="ls-header"><div class="ls-header-left"><h1><i class="fas fa-chart-simple" style="color:#0B4A3D;margin-right:8px"></i>Lead Summary</h1></div>';
        html += '<div class="ls-header-right"><a href="crm.html" class="btn btn-primary btn-sm"><i class="fas fa-address-card"></i> CRM Dashboard</a></div></div>';

        // Lead selector dropdown
        html += '<div class="ls-lead-card" style="flex-direction:column;align-items:stretch">';
        html += '<div style="font-size:14px;font-weight:600;color:var(--text-primary);margin-bottom:8px"><i class="fas fa-search" style="color:#0B4A3D;margin-right:6px"></i>Select a Lead to View Summary</div>';
        html += '<select id="lsLeadSelect" class="form-input" style="max-width:500px" onchange="VT.LeadSummary.onLeadSelect(this.value)">';
        html += '<option value="">-- Select a Lead --</option>';
        // Add CRM leads
        if (leads.length > 0) {
            html += '<optgroup label="CRM Leads">';
            for (var i = 0; i < leads.length; i++) {
                var l = leads[i];
                var label = (l.leadNo || l.id || 'L-???') + ' - ' + (l.name || l.leadName || 'Unnamed') + (l.company ? ' (' + l.company + ')' : '');
                html += '<option value="' + l.id + '|lead">' + VT.Utils.escapeHtml(label) + '</option>';
            }
            html += '</optgroup>';
        }
        // Add clients as potential leads
        if (clients.length > 0) {
            html += '<optgroup label="Clients">';
            for (var j = 0; j < clients.length; j++) {
                var c = clients[j];
                var label2 = (c.id || 'CLI-???') + ' - ' + (c.businessName || c.name || 'Unnamed');
                html += '<option value="' + c.id + '|client">' + VT.Utils.escapeHtml(label2) + '</option>';
            }
            html += '</optgroup>';
        }
        html += '</select></div>';

        // Quick links to related documents
        html += '<div style="margin-top:20px">';
        html += '<h3 style="font-size:14px;font-weight:600;color:var(--text-secondary);margin-bottom:12px">Quick Access</h3>';
        html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px">';
        html += '<a href="crm.html" class="btn btn-secondary btn-sm" style="justify-content:flex-start"><i class="fas fa-address-card" style="color:#0B4A3D"></i> CRM Dashboard</a>';
        html += '<a href="clients.html" class="btn btn-secondary btn-sm" style="justify-content:flex-start"><i class="fas fa-user-tie" style="color:#2563eb"></i> Clients</a>';
        html += '<a href="pr-list.html" class="btn btn-secondary btn-sm" style="justify-content:flex-start"><i class="fas fa-phone-alt" style="color:#059669"></i> CPR</a>';
        html += '<a href="pr-list.html" class="btn btn-secondary btn-sm" style="justify-content:flex-start"><i class="fas fa-clipboard-list" style="color:#0B4A3D"></i> Purchase Requests</a>';
        html += '<a href="quotations.html" class="btn btn-secondary btn-sm" style="justify-content:flex-start"><i class="fas fa-file-invoice" style="color:#2563eb"></i> Quotations</a>';
        html += '<a href="salesorders.html" class="btn btn-secondary btn-sm" style="justify-content:flex-start"><i class="fas fa-shopping-cart" style="color:#d97706"></i> Sales Orders</a>';
        html += '<a href="invoices.html" class="btn btn-secondary btn-sm" style="justify-content:flex-start"><i class="fas fa-file-invoice-dollar" style="color:#dc2626"></i> Invoices</a>';
        html += '<a href="payment-receipts.html" class="btn btn-secondary btn-sm" style="justify-content:flex-start"><i class="fas fa-money-bill-wave" style="color:#059669"></i> Payments</a>';
        html += '</div></div>';

        container.innerHTML = html;
        if (leads.length === 0 && clients.length === 0) {
            var _self = this;
            document.addEventListener('VT:DataSeeded', function onSeed() {
                document.removeEventListener('VT:DataSeeded', onSeed);
                _self.showLeadSelector();
            });
        }
    },

    onLeadSelect: function(value) {
        if (!value) return;
        var parts = value.split('|');
        var id = parts[0];
        var type = parts[1] || 'lead';
        this.loadLead(id, type);
    },

    loadLead: function(id, type) {
        type = type || 'lead';
        var lead = null;
        if (type === 'lead') {
            var leads = JSON.parse(localStorage.getItem('vt_leads') || '[]');
            if (leads.length === 0 && VT.Data && VT.Data.leads) {
                leads = JSON.parse(JSON.stringify(VT.Data.leads));
            }
            for (var i = 0; i < leads.length; i++) {
                if (leads[i].id === id || leads[i].leadNo === id) { lead = leads[i]; break; }
            }
        } else {
            var clients = JSON.parse(localStorage.getItem('vt_clients') || '[]');
            if (clients.length === 0 && VT.Data && VT.Data.clients) {
                clients = JSON.parse(JSON.stringify(VT.Data.clients));
            }
            for (var j = 0; j < clients.length; j++) {
                if (clients[j].id === id) { lead = clients[j]; lead._type = 'client'; break; }
            }
        }

        if (!lead) {
            var container = document.getElementById('leadSummaryContainer');
            if (container) {
                container.innerHTML = '<div class="ls-empty"><i class="fas fa-exclamation-circle" style="color:#dc2626"></i><h3>Lead Not Found</h3><p>The lead you are looking for does not exist.</p><a href="lead-summary.html" class="btn btn-primary"><i class="fas fa-arrow-left"></i> Select Another Lead</a></div>';
            }
            return;
        }

        this.currentLead = lead;
        this.renderLeadSummary(lead);
    },

    renderLeadSummary: function(lead) {
        var container = document.getElementById('leadSummaryContainer');
        if (!container) return;

        // Gather related documents
        var leadNo = lead.leadNo || lead.id || '';
        var leadName = lead.name || lead.leadName || lead.businessName || 'Unnamed';
        var company = lead.company || lead.companyName || '';
        var email = lead.email || '';
        var phone = lead.phone || '';
        var source = lead.source || 'Direct';
        var stage = lead.stage || 'new';
        var value = lead.value || lead.expectedValue || lead.creditLimit || 0;
        var createdDate = lead.createdAt || lead.createdDate || '';

        var relatedPRs = this.getRelatedDocuments('vt_cprs', leadNo, leadName);
        var relatedQuotations = this.getRelatedDocuments('vt_quotations', leadNo, leadName);
        var relatedSalesContracts = this.getRelatedDocuments('vt_sales_contracts', leadNo, leadName);
        var relatedSOs = this.getRelatedDocuments('vt_sales_orders', leadNo, leadName);
        var relatedDCs = this.getRelatedDocuments('vt_delivery_challans', leadNo, leadName);
        var relatedInvoices = this.getRelatedDocuments('vt_invoices', leadNo, leadName);
        var relatedPayments = this.getRelatedDocuments('vt_payment_receipts', leadNo, leadName);
        var relatedFollowups = this.getRelatedDocuments('vt_lead_followups', leadNo, leadName);

        var totalDocs = relatedPRs.length + relatedQuotations.length + relatedSalesContracts.length + relatedSOs.length + relatedDCs.length + relatedInvoices.length + relatedPayments.length;
        var totalValue = 0;
        relatedInvoices.concat(relatedPayments).forEach(function(d) { totalValue += parseFloat(d.amount || d.total || d.grandTotal || 0); });

        var initial = leadName.charAt(0).toUpperCase();

        container.innerHTML =
            '<div class="sales-breadcrumb">' +
                '<a href="dashboard.html">VISHAK TECH</a> <i class="fas fa-chevron-right"></i> ' +
                '<a href="lead-summary.html">Lead Summary</a> <i class="fas fa-chevron-right"></i> ' +
                '<span>' + VT.Utils.escapeHtml(leadNo) + '</span>' +
            '</div>' +
            '<div class="ls-header">' +
                '<div class="ls-header-left">' +
                    '<h1><i class="fas fa-chart-simple" style="color:#0B4A3D;margin-right:8px"></i>Lead Summary</h1>' +
                '</div>' +
                '<div class="ls-header-right">' +
                    '<a href="lead-summary.html" class="btn btn-ghost btn-sm"><i class="fas fa-arrow-left"></i> Back</a>' +
                    '<a href="crm.html" class="btn btn-secondary btn-sm"><i class="fas fa-address-card"></i> CRM</a>' +
                    '<a href="pr-create.html?lead=' + encodeURIComponent(leadNo) + '" class="btn btn-primary btn-sm"><i class="fas fa-plus"></i> New CPR</a>' +
                '</div>' +
            '</div>' +

            // Lead Card
            '<div class="ls-lead-card">' +
                '<div class="ls-lead-avatar">' + initial + '</div>' +
                '<div class="ls-lead-info">' +
                    '<div class="ls-lead-name">' + VT.Utils.escapeHtml(leadName) + '</div>' +
                    '<div class="ls-lead-company">' + VT.Utils.escapeHtml(company || '-') + '</div>' +
                    '<div class="ls-lead-meta">' +
                        '<span><i class="fas fa-tag"></i> ' + VT.Utils.escapeHtml(leadNo) + '</span>' +
                        '<span><i class="fas fa-envelope"></i> ' + VT.Utils.escapeHtml(email || '-') + '</span>' +
                        '<span><i class="fas fa-phone"></i> ' + VT.Utils.escapeHtml(phone || '-') + '</span>' +
                        '<span><i class="fas fa-calendar"></i> ' + VT.Utils.formatDate(createdDate) + '</span>' +
                        '<span><span class="ls-badge status-' + stage + '">' + stage.charAt(0).toUpperCase() + stage.slice(1) + '</span></span>' +
                    '</div>' +
                '</div>' +
                '<div class="ls-lead-stats">' +
                    '<div class="ls-stat"><div class="ls-stat-value">' + totalDocs + '</div><div class="ls-stat-label">Documents</div></div>' +
                    '<div class="ls-stat"><div class="ls-stat-value">' + VT.Utils.formatCurrency(totalValue) + '</div><div class="ls-stat-label">Total Value</div></div>' +
                    '<div class="ls-stat"><div class="ls-stat-value">' + (source ? source.charAt(0).toUpperCase() + source.slice(1) : '-') + '</div><div class="ls-stat-label">Source</div></div>' +
                '</div>' +
            '</div>' +

            // Tabs
            '<div class="ls-tabs" id="lsTabs">' +
                '<button class="ls-tab active" data-tab="overview" onclick="VT.LeadSummary.switchTab(\'overview\')">Overview</button>' +
                '<button class="ls-tab" data-tab="followups" onclick="VT.LeadSummary.switchTab(\'followups\')">Follow-ups <span class="ls-tab-count">(' + relatedFollowups.length + ')</span></button>' +
                '<button class="ls-tab" data-tab="purchaserequests" onclick="VT.LeadSummary.switchTab(\'purchaserequests\')">Purchase Requests <span class="ls-tab-count">(' + relatedPRs.length + ')</span></button>' +
                '<button class="ls-tab" data-tab="quotations" onclick="VT.LeadSummary.switchTab(\'quotations\')">Quotations <span class="ls-tab-count">(' + relatedQuotations.length + ')</span></button>' +
                '<button class="ls-tab" data-tab="salescontracts" onclick="VT.LeadSummary.switchTab(\'salescontracts\')">Sales Contracts <span class="ls-tab-count">(' + relatedSalesContracts.length + ')</span></button>' +
                '<button class="ls-tab" data-tab="salesorders" onclick="VT.LeadSummary.switchTab(\'salesorders\')">Sales Orders <span class="ls-tab-count">(' + relatedSOs.length + ')</span></button>' +
                '<button class="ls-tab" data-tab="deliverychallans" onclick="VT.LeadSummary.switchTab(\'deliverychallans\')">Delivery Challans <span class="ls-tab-count">(' + relatedDCs.length + ')</span></button>' +
                '<button class="ls-tab" data-tab="invoices" onclick="VT.LeadSummary.switchTab(\'invoices\')">Invoices <span class="ls-tab-count">(' + relatedInvoices.length + ')</span></button>' +
                '<button class="ls-tab" data-tab="payments" onclick="VT.LeadSummary.switchTab(\'payments\')">Payments <span class="ls-tab-count">(' + relatedPayments.length + ')</span></button>' +
                '<button class="ls-tab" data-tab="timeline" onclick="VT.LeadSummary.switchTab(\'timeline\')">Timeline</button>' +
            '</div>' +

            '<div class="ls-content" id="lsContent">' +
                // Overview tab
                '<div class="ls-tab-pane active" id="pane-overview">' +
                    this.renderOverviewTab(lead, relatedPRs, relatedQuotations, relatedSalesContracts, relatedSOs, relatedDCs, relatedInvoices, relatedPayments) +
                '</div>' +
                '<div class="ls-tab-pane" id="pane-followups">' + this.renderFollowupsTab(relatedFollowups) + '</div>' +
                '<div class="ls-tab-pane" id="pane-purchaserequests">' + this.renderDocumentList(relatedPRs, 'pr') + '</div>' +
                '<div class="ls-tab-pane" id="pane-quotations">' + this.renderDocumentList(relatedQuotations, 'qt') + '</div>' +
                '<div class="ls-tab-pane" id="pane-salescontracts">' + this.renderDocumentList(relatedSalesContracts, 'sc') + '</div>' +
                '<div class="ls-tab-pane" id="pane-salesorders">' + this.renderDocumentList(relatedSOs, 'so') + '</div>' +
                '<div class="ls-tab-pane" id="pane-deliverychallans">' + this.renderDocumentList(relatedDCs, 'dc') + '</div>' +
                '<div class="ls-tab-pane" id="pane-invoices">' + this.renderDocumentList(relatedInvoices, 'inv') + '</div>' +
                '<div class="ls-tab-pane" id="pane-payments">' + this.renderDocumentList(relatedPayments, 'pay') + '</div>' +
                '<div class="ls-tab-pane" id="pane-timeline">' + this.renderTimeline(lead, relatedPRs, relatedQuotations, relatedSalesContracts, relatedSOs, relatedDCs, relatedInvoices, relatedPayments) + '</div>' +
            '</div>';
    },

    getRelatedDocuments: function(storageKey, leadNo, clientName) {
        var docs = [];
        try { docs = JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch(e) {}
        // Filter docs that match leadNo or clientName
        return docs.filter(function(d) {
            if (leadNo && (d.leadNo === leadNo || d.lead === leadNo)) return true;
            if (clientName && (d.client === clientName || d.clientName === clientName || d.customerName === clientName || d.receivedFrom === clientName || d.deliveredTo === clientName)) return true;
            if (d.leadNo && leadNo && d.leadNo.indexOf(leadNo) !== -1) return true;
            if (d.lead && leadNo && d.lead.indexOf(leadNo) !== -1) return true;
            return false;
        });
    },

    switchTab: function(tab) {
        this.currentTab = tab;
        // Update tabs
        var tabs = document.querySelectorAll('.ls-tab');
        tabs.forEach(function(t) { t.classList.remove('active'); });
        var activeTab = document.querySelector('.ls-tab[data-tab="' + tab + '"]');
        if (activeTab) activeTab.classList.add('active');
        // Update panes
        var panes = document.querySelectorAll('.ls-tab-pane');
        panes.forEach(function(p) { p.classList.remove('active'); });
        var activePane = document.getElementById('pane-' + tab);
        if (activePane) activePane.classList.add('active');
    },

    renderOverviewTab: function(lead, prs, qts, cpos, sos, dcs, invs, pays) {
        var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">';
        // Workflow progress
        html += '<div class="info-card"><h4><i class="fas fa-diagram-project" style="color:#0B4A3D"></i> Workflow Progress</h4>';
        html += '<div style="margin-top:12px">';
        var steps = [
            { label: 'Lead Created', done: true, icon: 'fa-address-card' },
            { label: 'Purchase Request', done: prs.length > 0, icon: 'fa-clipboard-list', count: prs.length },
            { label: 'Quotation', done: qts.length > 0, icon: 'fa-file-invoice', count: qts.length },
            { label: 'Sales Contract', done: cpos.length > 0, icon: 'fa-file-signature', count: cpos.length },
            { label: 'Sales Order', done: sos.length > 0, icon: 'fa-shopping-cart', count: sos.length },
            { label: 'Delivery Challan', done: dcs.length > 0, icon: 'fa-truck', count: dcs.length },
            { label: 'Invoice', done: invs.length > 0, icon: 'fa-file-invoice-dollar', count: invs.length },
            { label: 'Payment', done: pays.length > 0, icon: 'fa-money-bill-wave', count: pays.length }
        ];
        for (var i = 0; i < steps.length; i++) {
            var s = steps[i];
            var color = s.done ? '#059669' : (i === 0 ? '#0B4A3D' : '#d1d5db');
            var bg = s.done ? '#f0fdf4' : (i === 0 ? '#F8FAF9' : 'transparent');
            html += '<div style="display:flex;align-items:center;gap:10px;padding:6px 0;opacity:' + (s.done ? 1 : 0.4) + '">' +
                '<div style="width:28px;height:28px;border-radius:50%;background:' + bg + ';display:flex;align-items:center;justify-content:center;border:2px solid ' + color + '">' +
                (s.done ? '<i class="fas fa-check" style="font-size:12px;color:' + color + '"></i>' : '<i class="fas ' + s.icon + '" style="font-size:12px;color:' + color + '"></i>') +
                '</div>' +
                '<span style="font-size:13px;font-weight:' + (s.done ? 600 : 400) + ';color:var(--text-primary)">' + s.label + '</span>' +
                (s.count ? '<span class="ls-badge" style="background:#F8FAF9;color:#0B4A3D;font-size:11px">' + s.count + '</span>' : '') +
                '</div>';
        }
        html += '</div></div>';

        // Summary stats
        html += '<div class="info-card"><h4><i class="fas fa-chart-bar" style="color:#0B4A3D"></i> Summary</h4>';
        html += '<div style="margin-top:12px">';
        html += '<div class="info-row"><span class="label">Total Documents</span><span class="value" style="font-weight:700">' + (prs.length + qts.length + cpos.length + sos.length + dcs.length + invs.length + pays.length) + '</span></div>';
        html += '<div class="info-row"><span class="label">Purchase Requests</span><span class="value">' + prs.length + '</span></div>';
        html += '<div class="info-row"><span class="label">Quotations</span><span class="value">' + qts.length + '</span></div>';
        html += '<div class="info-row"><span class="label">Sales Contracts</span><span class="value">' + cpos.length + '</span></div>';
        html += '<div class="info-row"><span class="label">Sales Orders</span><span class="value">' + sos.length + '</span></div>';
        html += '<div class="info-row"><span class="label">Delivery Challans</span><span class="value">' + dcs.length + '</span></div>';
        html += '<div class="info-row"><span class="label">Invoices</span><span class="value">' + invs.length + '</span></div>';
        html += '<div class="info-row"><span class="label">Payments</span><span class="value">' + pays.length + '</span></div>';
        html += '</div></div></div>';

        // Quick Actions - Convert-to links
        html += '<div class="ls-quick-actions" style="margin-bottom:16px">';
        html += '<h3 style="font-size:14px;font-weight:600;color:var(--text-secondary);margin-bottom:10px"><i class="fas fa-bolt" style="color:#0B4A3D;margin-right:6px"></i> Quick Actions</h3>';
        html += '<div style="display:flex;flex-wrap:wrap;gap:8px">';
        html += '<a href="pr-create.html?lead=' + encodeURIComponent(leadNo) + '" class="btn btn-sm" style="background:#F8FAF9;color:#0B4A3D;border:1px solid #E5E7EB;border-radius:8px;padding:7px 14px;font-size:13px;font-weight:600;text-decoration:none;display:inline-flex;align-items:center;gap:6px;transition:all 0.15s ease"><i class="fas fa-clipboard-list"></i> New Purchase Request</a>';
        html += '<a href="quotation-create.html?lead=' + encodeURIComponent(leadNo) + '" class="btn btn-sm" style="background:#eff6ff;color:#2563eb;border:1px solid #93c5fd;border-radius:8px;padding:7px 14px;font-size:13px;font-weight:600;text-decoration:none;display:inline-flex;align-items:center;gap:6px;transition:all 0.15s ease"><i class="fas fa-file-invoice"></i> New Quotation</a>';
        html += '<a href="create-sales-contract.html?leadId=' + encodeURIComponent(leadNo) + '" class="btn btn-sm" style="background:#f0fdf4;color:#059669;border:1px solid #86efac;border-radius:8px;padding:7px 14px;font-size:13px;font-weight:600;text-decoration:none;display:inline-flex;align-items:center;gap:6px;transition:all 0.15s ease"><i class="fas fa-file-signature"></i> New Sales Contract</a>';
        html += '<a href="salesorders.html?lead=' + encodeURIComponent(leadNo) + '" class="btn btn-sm" style="background:#fffbeb;color:#d97706;border:1px solid #fcd34d;border-radius:8px;padding:7px 14px;font-size:13px;font-weight:600;text-decoration:none;display:inline-flex;align-items:center;gap:6px;transition:all 0.15s ease"><i class="fas fa-shopping-cart"></i> New Sales Order</a>';
        html += '</div></div>';

        // Recent documents
        html += '<h3 style="font-size:14px;font-weight:600;color:var(--text-secondary);margin-bottom:12px">Recent Documents</h3>';
        var allDocs = [];
        prs.forEach(function(d) { allDocs.push({ doc: d, type: 'pr', icon: 'fa-clipboard-list', cls: 'pr', label: 'PR', href: 'pr-view.html?id=' + encodeURIComponent(d.id || d.prNo) }); });
        qts.forEach(function(d) { allDocs.push({ doc: d, type: 'qt', icon: 'fa-file-invoice', cls: 'qt', label: 'QT', href: 'preview.html?type=quotation&id=' + d.id }); });
        cpos.forEach(function(d) { allDocs.push({ doc: d, type: 'sc', icon: 'fa-file-signature', cls: 'sc', label: 'sc', href: 'preview.html?type=sales-contract&id=' + d.id }); });
        sos.forEach(function(d) { allDocs.push({ doc: d, type: 'so', icon: 'fa-shopping-cart', cls: 'so', label: 'SO', href: 'salesorders.html?id=' + d.id }); });
        dcs.forEach(function(d) { allDocs.push({ doc: d, type: 'dc', icon: 'fa-truck', cls: 'dc', label: 'DC', href: 'delivery-challan-view.html?id=' + d.id }); });
        invs.forEach(function(d) { allDocs.push({ doc: d, type: 'inv', icon: 'fa-file-invoice-dollar', cls: 'inv', label: 'INV', href: 'invoice-create.html?id=' + d.id }); });
        pays.forEach(function(d) { allDocs.push({ doc: d, type: 'pay', icon: 'fa-money-bill-wave', cls: 'pay', label: 'PAY', href: 'payment-receipt-view.html?id=' + d.id }); });
        allDocs.sort(function(a, b) { return (b.doc.date || b.doc.createdAt || '').localeCompare(a.doc.date || a.doc.createdAt || ''); });
        allDocs = allDocs.slice(0, 10);

        if (allDocs.length === 0) {
            html += '<div class="ls-empty"><i class="fas fa-inbox"></i><h3>No Documents Yet</h3><p>This lead has no associated documents. Start by creating a Purchase Request or Quotation.</p></div>';
        } else {
            for (var k = 0; k < allDocs.length; k++) {
                var item = allDocs[k];
                var d = item.doc;
                var amt = parseFloat(d.grandTotal || d.total || d.amount || d.subtotal || 0);
                var status = d.status || 'Draft';
                html += '<a href="' + item.href + '" class="ls-doc-card" style="text-decoration:none">' +
                    '<div class="ls-doc-icon ' + item.cls + '"><i class="fas ' + item.icon + '"></i></div>' +
                    '<div class="ls-doc-info">' +
                        '<div class="ls-doc-title">' + VT.Utils.escapeHtml(item.label + ': ' + (d.prNo || d.id || d.number || '')) + '</div>' +
                        '<div class="ls-doc-meta">' + VT.Utils.formatDate(d.date || d.createdAt) + ' &middot; ' + VT.Utils.statusBadge(status) + '</div>' +
                    '</div>' +
                    (amt > 0 ? '<div class="ls-doc-amount">' + VT.Utils.formatCurrency(amt) + '</div>' : '') +
                '</a>';
            }
        }
        return html;
    },

    renderFollowupsTab: function(followups) {
        if (!followups || followups.length === 0) {
            return '<div class="ls-empty"><i class="fas fa-phone-alt"></i><h3>No Follow-ups</h3><p>No follow-up activities recorded for this lead.</p><a href="pr-create.html" class="btn btn-primary btn-sm"><i class="fas fa-plus"></i> New CPR</a></div>';
        }
        var html = '<div class="ls-timeline">';
        for (var i = 0; i < followups.length; i++) {
            var f = followups[i];
            html += '<div class="ls-tl-item">' +
                '<div class="ls-tl-dot created"></div>' +
                '<div class="ls-tl-title">' + VT.Utils.escapeHtml(f.remarks || f.notes || 'Follow-up') + '</div>' +
                '<div class="ls-tl-desc">' + (f.mode || 'Call') + ' — ' + VT.Utils.escapeHtml((f.remarks || '').substring(0, 80)) + '</div>' +
                '<div class="ls-tl-time">' + VT.Utils.formatDate(f.followupDate || f.createdAt) + '</div>' +
            '</div>';
        }
        html += '</div>';
        return html;
    },

    renderDocumentList: function(docs, type) {
        if (!docs || docs.length === 0) {
            var emptyMsgs = {
                pr: { icon: 'fa-clipboard-list', text: 'Purchase Requests', link: 'pr-create.html', btnText: 'New Purchase Request' },
                qt: { icon: 'fa-file-invoice', text: 'Quotations', link: 'quotation-create.html', btnText: 'New Quotation' },
                sc: { icon: 'fa-file-signature', text: 'Sales Contracts', link: 'create-sales-contract.html', btnText: 'New Sales Contract' },
                so: { icon: 'fa-shopping-cart', text: 'Sales Orders', link: 'salesorders.html', btnText: 'New Sales Order' },
                dc: { icon: 'fa-truck', text: 'Delivery Challans', link: 'delivery-challan-create.html', btnText: 'New Delivery Challan' },
                inv: { icon: 'fa-file-invoice-dollar', text: 'Invoices', link: 'invoice-create.html', btnText: 'New Invoice' },
                pay: { icon: 'fa-money-bill-wave', text: 'Payments', link: 'payment-receipt-create.html', btnText: 'New Payment' }
            };
            var info = emptyMsgs[type] || { icon: 'fa-file', text: 'Documents', link: '#', btnText: 'Create New' };
            return '<div class="ls-empty"><i class="fas ' + info.icon + '"></i><h3>No ' + info.text + '</h3><p>No ' + info.text.toLowerCase() + ' linked to this lead.</p><a href="' + info.link + '" class="btn btn-primary btn-sm"><i class="fas fa-plus"></i> ' + info.btnText + '</a></div>';
        }
        var html = '';
        var typeConfig = {
            pr: { icon: 'fa-clipboard-list', cls: 'pr', href: function(d) { return 'pr-view.html?id=' + encodeURIComponent(d.id || d.prNo); }, idField: function(d) { return d.prNo || d.id; } },
            qt: { icon: 'fa-file-invoice', cls: 'qt', href: function(d) { return 'preview.html?type=quotation&id=' + d.id; }, idField: function(d) { return d.id; } },
            sc: { icon: 'fa-file-signature', cls: 'sc', href: function(d) { return 'preview.html?type=sales-contract&id=' + d.id; }, idField: function(d) { return d.id; } },
            so: { icon: 'fa-shopping-cart', cls: 'so', href: function(d) { return 'salesorders.html?id=' + d.id; }, idField: function(d) { return d.id; } },
            dc: { icon: 'fa-truck', cls: 'dc', href: function(d) { return 'deliverychallans.html?id=' + d.id; }, idField: function(d) { return d.id; } },
            inv: { icon: 'fa-file-invoice-dollar', cls: 'inv', href: function(d) { return 'invoice-create.html?id=' + d.id; }, idField: function(d) { return d.id; } },
            pay: { icon: 'fa-money-bill-wave', cls: 'pay', href: function(d) { return 'payment-receipt-view.html?id=' + d.id; }, idField: function(d) { return d.id; } }
        };
        var config = typeConfig[type] || typeConfig.pr;
        for (var i = 0; i < docs.length; i++) {
            var d = docs[i];
            var amt = parseFloat(d.grandTotal || d.total || d.amount || d.subtotal || 0);
            var status = d.status || 'Draft';
            html += '<a href="' + config.href(d) + '" class="ls-doc-card" style="text-decoration:none">' +
                '<div class="ls-doc-icon ' + config.cls + '"><i class="fas ' + config.icon + '"></i></div>' +
                '<div class="ls-doc-info">' +
                    '<div class="ls-doc-title">' + VT.Utils.escapeHtml(config.idField(d)) + '</div>' +
                    '<div class="ls-doc-meta">' + VT.Utils.formatDate(d.date || d.createdAt) + ' &middot; ' + VT.Utils.statusBadge(status) + '</div>' +
                '</div>' +
                (amt > 0 ? '<div class="ls-doc-amount">' + VT.Utils.formatCurrency(amt) + '</div>' : '') +
            '</a>';
        }
        return html;
    },

    renderTimeline: function(lead, prs, qts, cpos, sos, dcs, invs, pays) {
        var events = [];
        if (lead.createdAt) events.push({ date: lead.createdAt, title: 'Lead Created', desc: 'Lead ' + (lead.leadNo || lead.id) + ' was created', type: 'created' });
        prs.forEach(function(d) {
            events.push({ date: d.createdAt || d.prDate, title: 'PR: ' + (d.prNo || d.id), desc: 'Purchase Request created - Status: ' + (d.status || 'Pending'), type: 'created' });
            if (d.approvalDate) events.push({ date: d.approvalDate, title: 'PR Approved: ' + (d.prNo || d.id), desc: 'Approved by ' + (d.approvedBy || 'Admin'), type: 'approved' });
            if (d.convertedToPO) events.push({ date: d.createdAt, title: 'PR Converted: ' + (d.prNo || d.id), desc: 'Converted to Purchase Order ' + d.convertedToPO, type: 'converted' });
        });
        qts.forEach(function(d) {
            events.push({ date: d.createdAt || d.date, title: 'Quotation: ' + d.id, desc: 'Quotation created for ' + (d.clientName || '-'), type: 'created' });
            if (d.sentDate) events.push({ date: d.sentDate, title: 'Quotation Sent: ' + d.id, desc: 'Quotation sent to client', type: 'sent' });
            if (d.convertedSO) events.push({ date: d.createdAt, title: 'Quotation Converted: ' + d.id, desc: 'Converted to Sales Order ' + d.convertedSO, type: 'converted' });
        });
        cpos.forEach(function(d) { events.push({ date: d.createdAt || d.date, title: 'Sales Contract: ' + d.id, desc: 'Sales Contract received - ' + (d.status || 'Received'), type: 'created' }); });
        sos.forEach(function(d) { events.push({ date: d.createdAt || d.date, title: 'Sales Order: ' + d.id, desc: 'Sales Order created for ' + (d.client || '-'), type: 'created' }); });
        dcs.forEach(function(d) { events.push({ date: d.createdAt || d.date, title: 'Delivery Challan: ' + d.id, desc: 'Delivery Challan for ' + (d.deliveredTo || d.client || '-'), type: 'created' }); });
        invs.forEach(function(d) { events.push({ date: d.createdAt || d.date, title: 'Invoice: ' + d.id, desc: 'Invoice for ' + (d.clientName || d.client || '-'), type: 'created' }); });
        pays.forEach(function(d) { events.push({ date: d.createdAt || d.date, title: 'Payment: ' + d.id, desc: VT.Utils.formatCurrency(parseFloat(d.amount || 0)) + ' received from ' + (d.receivedFrom || '-'), type: 'completed' }); });

        events.sort(function(a, b) { return (a.date || '').localeCompare(b.date || ''); });

        if (events.length === 0) {
            return '<div class="ls-empty"><i class="fas fa-clock"></i><h3>No Timeline Events</h3><p>No activity recorded for this lead yet.</p></div>';
        }
        var html = '<div class="ls-timeline">';
        for (var i = 0; i < events.length; i++) {
            var e = events[i];
            html += '<div class="ls-tl-item">' +
                '<div class="ls-tl-dot ' + e.type + '"></div>' +
                '<div class="ls-tl-title">' + VT.Utils.escapeHtml(e.title) + '</div>' +
                '<div class="ls-tl-desc">' + VT.Utils.escapeHtml(e.desc) + '</div>' +
                '<div class="ls-tl-time">' + VT.Utils.formatDate(e.date) + '</div>' +
            '</div>';
        }
        html += '</div>';
        return html;
    }
};

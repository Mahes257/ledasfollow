window.VT = window.VT || {};
VT.LeadOverview = {
    lead: null,
    leads: [],
    followups: [],
    quotations: [],
    currentTab: 'overview',

    /* ===== INIT ===== */
    init: function() {
        try {
            var container = document.getElementById('loContainer');
            if (!container) return;

            var params = new URLSearchParams(window.location.search);
            var id = params.get('id');
            if (!id) {
                container.innerHTML = this._errorCard('No Lead ID Provided',
                    'No lead ID was specified in the URL. Please select a lead from the leads list.',
                    'leads.html');
                return;
            }

            // Load leads data
            this.leads = JSON.parse(localStorage.getItem('vt_leads') || '[]');

            // Try to find the lead with ID normalization
            this.lead = this._findLead(id);

            if (!this.lead) {
                // If leads array is empty, seed data may not be loaded yet
                if (this.leads.length === 0) {
                    container.innerHTML = this._loadingHTML('Loading leads data...');
                    var self = this;
                    var handler = function onSeed() {
                        self.leads = JSON.parse(localStorage.getItem('vt_leads') || '[]');
                        self.lead = self._findLead(id);
                        if (self.lead) {
                            document.removeEventListener('VT:DataSeeded', onSeed);
                            self._loadRelated();
                            self.render();
                            self._restoreTab();
                            self._initPopstate();
                        } else {
                            document.removeEventListener('VT:DataSeeded', onSeed);
                            container.innerHTML = self._errorCard('Lead Not Found',
                                'The lead "' + VT.Utils.escapeHtml(id) + '" was not found in the system after data loaded.',
                                'leads.html');
                        }
                    };
                    document.addEventListener('VT:DataSeeded', handler);
                    // Also try with a short timeout in case seed data is loading
                    setTimeout(function() {
                        if (!self.lead) {
                            self.leads = JSON.parse(localStorage.getItem('vt_leads') || '[]');
                            self.lead = self._findLead(id);
                            if (self.lead) {
                                document.removeEventListener('VT:DataSeeded', onSeed);
                                self._loadRelated();
                                self.render();
                                self._restoreTab();
                                self._initPopstate();
                            }
                        }
                    }, 500);
                    return;
                }

                container.innerHTML = this._errorCard('Lead Not Found',
                    'The lead "' + VT.Utils.escapeHtml(id) + '" was not found. It may have been deleted or the ID is invalid.',
                    'leads.html');
                return;
            }

            this._loadRelated();
            this.render();
            this._restoreTab();
            this._initPopstate();

        } catch(e) {
            console.error('[LeadOverview] Error:', e);
            var c = document.getElementById('loContainer');
            if (c) c.innerHTML = this._errorCard('Unable to Load Lead',
                e.message || 'An unexpected error occurred while loading the lead details.',
                'leads.html');
        }
    },

    /* ===== ID NORMALIZATION ===== */
    _normalizeId: function(id) {
        // Already in full format: LEAD-000001 or LEAD-2026-000001
        if (/^LEAD/i.test(id)) {
            var stripped = id.toUpperCase();
            // Also generate year-less variant: LEAD-2026-000003 → LEAD-000003
            var short = stripped.replace(/-\d{4}-/, '-');
            return stripped === short ? [stripped] : [stripped, short];
        }

        // Short format: L-003 → extract the number
        var m = id.match(/^L-?(\d+)$/i);
        if (m) {
            var num = parseInt(m[1], 10);
            var padded = String(num).padStart(6, '0');
            return ['LEAD-' + padded, 'LEAD-2026-' + padded, 'LEAD-2025-' + padded];
        }

        // Just a number: 003
        m = id.match(/^(\d+)$/);
        if (m) {
            var num2 = parseInt(m[1], 10);
            var padded2 = String(num2).padStart(6, '0');
            return ['LEAD-' + padded2, 'LEAD-2026-' + padded2, 'LEAD-2025-' + padded2];
        }

        // Return as-is
        return [id.toUpperCase()];
    },

    _findLead: function(id) {
        var candidates = this._normalizeId(id);
        if (typeof candidates === 'string') candidates = [candidates];

        // Try each candidate format
        for (var c = 0; c < candidates.length; c++) {
            for (var i = 0; i < this.leads.length; i++) {
                if (this.leads[i].id === candidates[c] || this.leads[i].leadNo === candidates[c]) {
                    return this.leads[i];
                }
            }
        }

        // Try matching by extracting the number
        var numMatch = id.match(/(\d+)/);
        if (numMatch) {
            var searchNum = parseInt(numMatch[1], 10);
            for (var j = 0; j < this.leads.length; j++) {
                var idNum = this.leads[j].id.match(/(\d+)/);
                if (idNum && parseInt(idNum[1], 10) === searchNum) {
                    return this.leads[j];
                }
                var lnNum = (this.leads[j].leadNo || '').match(/(\d+)/);
                if (lnNum && parseInt(lnNum[1], 10) === searchNum) {
                    return this.leads[j];
                }
            }
        }

        return null;
    },

    /* ===== LOAD RELATED DATA ===== */
    _loadRelated: function() {
        if (!this.lead) return;

        // Load follow-ups related to this lead
        var allFus = JSON.parse(localStorage.getItem('vt_lead_followups') || '[]');
        this.followups = [];
        for (var i = 0; i < allFus.length; i++) {
            var f = allFus[i];
            // Match by leadId or leadNo
            if (f.leadId === this.lead.id || f.leadNo === this.lead.leadNo ||
                f.leadId === this.lead.leadNo || f.leadNo === this.lead.id) {
                this.followups.push(f);
            }
        }
        // Also try matching by extracting number
        if (this.followups.length === 0) {
            var leadNum = (this.lead.id || '').match(/(\d+)/);
            if (leadNum) {
                var ln = parseInt(leadNum[1], 10);
                for (var j = 0; j < allFus.length; j++) {
                    var fuIdNum = (allFus[j].leadId || '').match(/(\d+)/);
                    var fuNoNum = (allFus[j].leadNo || '').match(/(\d+)/);
                    if ((fuIdNum && parseInt(fuIdNum[1], 10) === ln) ||
                        (fuNoNum && parseInt(fuNoNum[1], 10) === ln)) {
                        this.followups.push(allFus[j]);
                    }
                }
            }
        }

        // Load quotations related to this lead
        try {
            var allQuotes = JSON.parse(localStorage.getItem('vt_quotations') || '[]');
            this.quotations = [];
            for (var k = 0; k < allQuotes.length; k++) {
                var q = allQuotes[k];
                if (q.leadId === this.lead.id || q.leadNo === this.lead.leadNo ||
                    q.leadId === this.lead.leadNo || q.leadNo === this.lead.id ||
                    q.leadId === this.lead.id || q.customerId === this.lead.id) {
                    this.quotations.push(q);
                }
            }
            if (this.quotations.length === 0) {
                var leadNum2 = (this.lead.id || '').match(/(\d+)/);
                if (leadNum2) {
                    var ln2 = parseInt(leadNum2[1], 10);
                    for (var m = 0; m < allQuotes.length; m++) {
                        var qIdNum = (allQuotes[m].leadId || '').match(/(\d+)/);
                        if (qIdNum && parseInt(qIdNum[1], 10) === ln2) {
                            this.quotations.push(allQuotes[m]);
                        }
                    }
                }
            }
        } catch(e) {
            this.quotations = [];
        }

        // Load activities
        try {
            this.activities = JSON.parse(localStorage.getItem('vt_lead_activity_' + this.lead.id) || '[]');
        } catch(e) {
            this.activities = [];
        }
    },

    /* ===== HELPERS ===== */
    _loadingHTML: function(msg) {
        return '<div class="lo-page lo-loading">' +
            '<div class="lo-loading-spinner"><i class="fas fa-spinner"></i></div>' +
            '<h3>' + VT.Utils.escapeHtml(msg || 'Loading...') + '</h3>' +
            '<p class="lo-loading-sub">Please wait while we retrieve lead details</p>' +
            '<div class="lo-loading-skeleton">' +
                '<div class="lo-skeleton-line"></div>' +
                '<div class="lo-skeleton-line"></div>' +
                '<div class="lo-skeleton-line"></div>' +
                '<div class="lo-skeleton-line"></div>' +
                '<div class="lo-skeleton-line"></div>' +
            '</div></div>';
    },

    _errorCard: function(title, message, backUrl) {
        backUrl = backUrl || 'leads.html';
        return '<div class="lo-page lo-error-card">' +
            '<i class="fas fa-exclamation-triangle lo-error-icon"></i>' +
            '<h3>' + VT.Utils.escapeHtml(title) + '</h3>' +
            '<p>' + VT.Utils.escapeHtml(message) + '</p>' +
            '<p class="lo-error-hint">You can return to the Leads list and try again.</p>' +
            '<a href="' + backUrl + '" class="btn btn-primary">' +
            '<i class="fas fa-arrow-left"></i> Back to Leads</a></div>';
    },

    esc: function(x) {
        if (VT.Utils && VT.Utils.escapeHtml) return VT.Utils.escapeHtml(x || '') || '—';
        if (x === null || x === undefined) return '—';
        return String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;') || '—';
    },
    fn: function(n) { return (n === undefined || n === null || n === '') ? '—' : '₹' + Number(n).toLocaleString('en-IN'); },
    fd: function(d) { return d ? (new Date(d)).toLocaleDateString('en-IN',{year:'numeric',month:'short',day:'numeric'}) : '—'; },
    fdt: function(d) { return d ? (new Date(d)).toLocaleDateString('en-IN',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '—'; },

    row: function(label, value) {
        return '<div class="lo-row"><span class="lo-label">' + label + '</span><span class="lo-value">' + value + '</span></div>';
    },

    stageBadge: function(stage) {
        return VT.Badge.stage(stage);
    },

    statusBadge: function(status) {
        var s = (status || 'Active').toLowerCase();
        if (s === 'active') return '<span class="lo-badge lo-badge-success">Active</span>';
        if (s === 'inactive' || s === 'archived') return '<span class="lo-badge lo-badge-neutral">' + (status || '') + '</span>';
        if (s === 'converted') return '<span class="lo-badge lo-badge-converted">Converted</span>';
        if (s === 'deleted') return '<span class="lo-badge lo-badge-danger">Deleted</span>';
        return '<span class="lo-badge lo-badge-primary">' + this.esc(status || 'Active') + '</span>';
    },

    priorityBadge: function(priority) {
        return VT.Badge.priority(priority);
    },

    modeIcon: function(mode) {
        return VT.Badge.modeIcon(mode);
    },

    /* ===== RENDER ===== */
    render: function() {
        try {
            var d = this.lead;
            if (!d) {
                var c = document.getElementById('loContainer');
                if (c) c.innerHTML = this._errorCard('Lead Not Found', 'The lead record is not available.', 'leads.html');
                return;
            }
            document.title = 'Lead Overview - ' + (d.leadNo || d.id) + ' - VISHAK TECH CRM';

            var container = document.getElementById('loContainer');
            if (!container) return;

            if (typeof VT !== 'undefined' && VT.AttachmentService) {
                VT.AttachmentService.init();
            }

            container.innerHTML =
                '<div class="lo-page">' +
                /* Breadcrumb */
                this.breadcrumb() +
                /* Header */
                this.renderHeader(d) +
                /* Tabs */
                '<div class="lo-tabs">' +
                    '<button class="lo-tab active" data-tab="overview" onclick="VT.LeadOverview.switchTab(\'overview\')"><i class="fas fa-th-large"></i> Overview</button>' +
                    '<button class="lo-tab" data-tab="timeline" onclick="VT.LeadOverview.switchTab(\'timeline\')"><i class="fas fa-history"></i> Timeline <span class="lo-tab-count">(' + this._getTimelineEvents().length + ')</span></button>' +
                    '<button class="lo-tab" data-tab="followups" onclick="VT.LeadOverview.switchTab(\'followups\')"><i class="fas fa-phone"></i> Follow-ups <span class="lo-tab-count">(' + this.followups.length + ')</span></button>' +
                    (this.quotations.length > 0 ? '<button class="lo-tab" data-tab="quotations" onclick="VT.LeadOverview.switchTab(\'quotations\')"><i class="fas fa-file-invoice"></i> Quotations <span class="lo-tab-count">(' + this.quotations.length + ')</span></button>' : '') +
                    '<button class="lo-tab" data-tab="documents" onclick="VT.LeadOverview.switchTab(\'documents\')"><i class="fas fa-file"></i> Documents' + ((d.attachments && d.attachments.length) ? ' <span class="lo-tab-count">(' + d.attachments.length + ')</span>' : '') + '</button>' +
                    '<button class="lo-tab" data-tab="notes" onclick="VT.LeadOverview.switchTab(\'notes\')"><i class="fas fa-sticky-note"></i> Notes</button>' +
                    '<button class="lo-tab" data-tab="history" onclick="VT.LeadOverview.switchTab(\'history\')"><i class="fas fa-history"></i> History</button>' +
                '</div>' +
                /* Overview Pane */
                '<div class="lo-pane active" id="pane-overview">' +
                    '<div class="lo-content-grid">' +
                        '<div class="lo-left-column">' +
                            this.renderLeadInfoCard(d) +
                            this.renderContactCard(d) +
                            this.renderBusinessCard(d) +
                            (d.notes || d.requirement || d.description ? this.renderDescriptionCard(d) : '') +
                        '</div>' +
                        '<div class="lo-sidebar">' +
                            this.renderSummaryCard(d) +
                            this.renderAttachmentCard(d) +
                            this.renderTimelineWidget(d) +
                            this.renderActivityLogWidget(d) +
                        '</div>' +
                    '</div>' +
                '</div>' +
                /* Timeline Pane */
                '<div class="lo-pane" id="pane-timeline">' +
                    this.renderFullTimeline(d) +
                '</div>' +
                /* Follow-ups Pane */
                '<div class="lo-pane" id="pane-followups">' +
                    this.renderFollowupsTab(d) +
                '</div>' +
                /* Quotations Pane */
                (this.quotations.length > 0 ? '<div class="lo-pane" id="pane-quotations">' + this.renderQuotationsTab(d) + '</div>' : '') +
                /* Documents Pane */
                '<div class="lo-pane" id="pane-documents">' +
                    this.renderDocumentsTab(d) +
                '</div>' +
                /* Notes Pane */
                '<div class="lo-pane" id="pane-notes">' +
                    this.renderNotesTab(d) +
                '</div>' +
                /* History Pane */
                '<div class="lo-pane" id="pane-history">' +
                    this.renderHistoryTab(d) +
                '</div>' +
                '</div>';

            this.currentTab = 'overview';
        } catch(e) {
            console.error('[LeadOverview] render error:', e);
            var c = document.getElementById('loContainer');
            if (c) c.innerHTML = this._errorCard('Rendering Error', e.message || 'An error occurred while rendering the page.', 'leads.html');
        }
    },

    /* ===== BREADCRUMB ===== */
    breadcrumb: function() {
        return '<div class="lo-breadcrumb">' +
            '<a href="dashboard.html">VISHAK TECH</a> <i class="fas fa-chevron-right"></i>' +
            '<a href="leads.html">Leads</a> <i class="fas fa-chevron-right"></i>' +
            '<span>Lead Overview</span></div>';
    },

    /* ===== HEADER ===== */
    renderHeader: function(d) {
        var initial = (d.name || d.contactPerson || 'L').charAt(0).toUpperCase();
        var expectedVal = d.expectedValue ? '<span><i class="fas fa-rupee-sign"></i> ' + this.fn(d.expectedValue) + '</span>' : '';

        return '<div class="lo-header">' +
            '<div class="lo-header-top">' +
                '<div class="lo-header-left">' +
                    '<div class="lo-avatar">' + initial + '</div>' +
                    '<div class="lo-header-title">' +
                        '<h1>' + this.esc(d.name || d.contactPerson || 'Unnamed Lead') + ' <span>(' + this.esc(d.leadNo || d.id) + ')</span></h1>' +
                        '<div class="lo-header-meta">' +
                            '<span><i class="fas fa-tag"></i> ' + this.esc(d.leadNo || d.id) + '</span>' +
                            '<span>' + this.statusBadge(d.status) + '</span>' +
                            '<span>' + this.stageBadge(d.stage || 'new') + '</span>' +
                            '<span><i class="fas fa-calendar"></i> ' + this.fd(d.createdAt) + '</span>' +
                            '<span><i class="fas fa-user"></i> ' + this.esc(d.assignee || 'Unassigned') + '</span>' +
                            expectedVal +
                            (d.priority ? '<span>' + this.priorityBadge(d.priority) + '</span>' : '') +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="lo-header-actions">' +
                    '<a href="leads.html" class="btn btn-ghost btn-sm"><i class="fas fa-arrow-left"></i> Back</a>' +
                    '<a href="vl-edit.html?id=' + encodeURIComponent(d.id || d.leadNo) + '" class="btn btn-secondary btn-sm"><i class="fas fa-pen"></i> Edit</a>' +
                    '<button class="btn btn-primary btn-sm" onclick="VT.LeadOverview.createFollowup()"><i class="fas fa-phone-alt"></i> Follow-up</button>' +
                    (d.status !== 'converted' && d.status !== 'deleted'
                        ? '<button class="btn btn-sm" style="background:#059669;color:#fff" onclick="VT.LeadOverview.convertToCPR()"><i class="fas fa-clipboard-list"></i> Convert to CPR</button>'
                        : '') +
                    (d.status !== 'deleted'
                        ? '<button class="btn btn-sm btn-soft-danger" onclick="VT.LeadOverview.deleteLead()"><i class="fas fa-trash"></i> Delete</button>'
                        : '') +
                '</div>' +
            '</div>' +
        '</div>';
    },

    /* ===== OVERVIEW PANE - LEFT COLUMN ===== */

    /* Card 1: Lead Information */
    renderLeadInfoCard: function(d) {
        return '<div class="lo-card">' +
            '<h3><i class="fas fa-info-circle"></i> Lead Information</h3>' +
            this.row('Lead Number', '<strong>' + this.esc(d.leadNo || d.id) + '</strong>') +
            this.row('Lead Name', this.esc(d.name || d.contactPerson || '-')) +
            this.row('Company / Business', this.esc(d.company || '-')) +
            this.row('Industry', this.esc(d.industry || '-')) +
            this.row('Lead Source', this.esc(d.source || '-')) +
            this.row('Campaign', this.esc(d.campaign || '-')) +
            this.row('Stage', this.stageBadge(d.stage || 'new')) +
            this.row('Priority', this.priorityBadge(d.priority)) +
            this.row('Lead Owner', this.esc(d.assignee || d.leadOwner || 'Unassigned')) +
            this.row('Expected Value', d.expectedValue ? this.fn(d.expectedValue) : '—') +
            this.row('Expected Close', d.expectedCloseDate ? this.fd(d.expectedCloseDate) : '—') +
            (d.probability ? this.row('Probability', d.probability + '%') : '') +
            this.row('Created Date', this.fd(d.createdAt)) +
            (d.updatedAt ? this.row('Last Updated', this.fd(d.updatedAt)) : '') +
        '</div>';
    },

    /* Card 2: Contact & Address */
    renderContactCard: function(d) {
        return '<div class="lo-card">' +
            '<h3><i class="fas fa-user"></i> Contact & Address</h3>' +
            this.row('Contact Person', this.esc(d.contactPerson || d.name || '-')) +
            this.row('Designation', this.esc(d.designation || '-')) +
            this.row('Phone', this.esc(d.phone || '-')) +
            (d.altPhone ? this.row('Alt Phone', this.esc(d.altPhone)) : '') +
            this.row('Email', '<a href="mailto:' + this.esc(d.email) + '" class="lo-link">' + this.esc(d.email || '-') + '</a>') +
            (d.secondaryContactPerson ? this.row('Secondary Contact', this.esc(d.secondaryContactPerson)) : '') +
            (d.secondaryDesignation ? this.row('Secondary Designation', this.esc(d.secondaryDesignation)) : '') +
            (d.secondaryPhone ? this.row('Secondary Phone', this.esc(d.secondaryPhone)) : '') +
            (d.secondaryEmail ? this.row('Secondary Email', '<a href="mailto:' + this.esc(d.secondaryEmail) + '" class="lo-link">' + this.esc(d.secondaryEmail) + '</a>') : '') +
            (d.website ? this.row('Website', '<a href="' + this.esc(d.website) + '" target="_blank" class="lo-link">' + this.esc(d.website) + ' <i class="fas fa-external-link-alt"></i></a>') : '') +
            (d.gstin ? this.row('GSTIN', this.esc(d.gstin)) : '') +
            (d.pan ? this.row('PAN', this.esc(d.pan)) : '') +
            this.row('Address', this.esc(d.address || '-')) +
            (d.city ? this.row('City', this.esc(d.city)) : '') +
            (d.state ? this.row('State', this.esc(d.state)) : '') +
            (d.country ? this.row('Country', this.esc(d.country)) : '') +
            (d.postalCode || d.pinCode || d.pincode ? this.row('PIN Code', this.esc(d.postalCode || d.pinCode || d.pincode)) : '') +
        '</div>';
    },

    /* Card 3: Business Details */
    renderBusinessCard: function(d) {
        return '<div class="lo-card">' +
            '<h3><i class="fas fa-building"></i> Business Details</h3>' +
            (d.companySize ? this.row('Company Size', this.esc(d.companySize)) : '') +
            (d.annualRevenue ? this.row('Annual Revenue', this.fn(d.annualRevenue)) : '') +
            (d.employeeCount ? this.row('Employee Count', this.esc(d.employeeCount)) : '') +
            (d.products ? this.row('Products / Services', this.esc(d.products)) : '') +
            (d.interestedServices ? this.row('Interested Services', this.esc(d.interestedServices)) : '') +
            (d.rating ? this.row('Lead Rating', '<span class="lo-badge ' + (d.rating === 'hot' ? 'lo-badge-danger' : d.rating === 'warm' ? 'lo-badge-warning' : 'lo-badge-neutral') + '">' + this.esc(d.rating) + '</span>') : '') +
            (d.leadType ? this.row('Lead Type', this.esc(d.leadType)) : '') +
            (d.team ? this.row('Sales Team', this.esc(d.team)) : '') +
            (d.department ? this.row('Department', this.esc(d.department)) : '') +
            (d.sourceDescription ? this.row('Source Description', this.esc(d.sourceDescription)) : '') +
        '</div>';
    },

    /* Card 4: Description & Requirements */
    renderDescriptionCard: function(d) {
        var notes = d.notes || d.requirement || d.description || '';
        var internalNotes = d.internalNotes || '';
        return '<div class="lo-card">' +
            '<h3><i class="fas fa-align-left"></i> Description & Requirements</h3>' +
            (notes ? '<div class="lo-notes-text">' + this.esc(notes) + '</div>' : '<div class="lo-empty"><i class="fas fa-file-alt"></i><h3>No Description</h3></div>') +
            (internalNotes ? '<hr class="lo-divider"><div class="lo-internal-notes"><span class="lo-internal-label">Internal Notes</span><div class="lo-notes-text lo-notes-internal">' + this.esc(internalNotes) + '</div></div>' : '') +
        '</div>';
    },

    /* ===== OVERVIEW PANE - RIGHT SIDEBAR ===== */

    /* Card: Lead Summary */
    renderSummaryCard: function(d) {
        var html = '<div class="lo-card">' +
            '<h3><i class="fas fa-chart-bar"></i> Lead Summary</h3>' +
            this.row('Lead ID', '<strong>' + this.esc(d.leadNo || d.id) + '</strong>') +
            this.row('Company', this.esc(d.company || '-')) +
            this.row('Contact', this.esc(d.contactPerson || d.name || '-')) +
            this.row('Phone', this.esc(d.phone || '-')) +
            this.row('Email', this.esc(d.email || '-')) +
            this.row('Stage', this.stageBadge(d.stage || 'new')) +
            this.row('Expected Value', d.expectedValue ? this.fn(d.expectedValue) : '—') +
            this.row('Total Follow-ups', '' + this.followups.length) +
            (this.quotations.length > 0 ? this.row('Quotations', '' + this.quotations.length) : '') +
            (d.convertedToCPR ? this.row('Converted to CPR', '<a href="pr-view.html?id=' + encodeURIComponent(d.convertedToCPR) + '" class="lo-link">' + this.esc(d.convertedToCPR) + ' <i class="fas fa-external-link-alt"></i></a>') : '') +
            '</div>';
        return html;
    },

    /* Card: Attachments (overview sidebar) */
    renderAttachmentCard: function(d) {
        var docs = d.attachments || [];
        var html = '<div class="lo-card">' +
            '<h3><i class="fas fa-paperclip"></i> Attachments</h3>';

        if (docs.length === 0) {
            html += '<div class="lo-empty"><i class="fas fa-cloud-upload-alt"></i><h3>No Attachments</h3><p>No attachments uploaded.</p></div>';
        } else {
            for (var i = 0; i < docs.length; i++) {
                html += VT.AttachmentService.renderItem(docs[i], i);
            }
        }

        html += '</div>';
        return html;
    },

    /* Card: Timeline Widget (overview sidebar, compact) */
    renderTimelineWidget: function(d) {
        var events = this._getTimelineEvents();
        var maxShow = 6;
        var showCount = Math.min(events.length, maxShow);

        var html = '<div class="lo-card">' +
            '<h3><i class="fas fa-history"></i> Timeline <span style="color:var(--text-muted,#9ca3af);text-transform:none;font-weight:400;font-size:11px;letter-spacing:0">(' + events.length + ' events)</span></h3>' +
            '<div class="lo-timeline" style="max-height:320px;overflow-y:auto">';

        if (events.length === 0) {
            html += '<div class="lo-empty"><i class="fas fa-clock"></i><h3>No Timeline Events</h3></div>';
        } else {
            for (var i = 0; i < showCount; i++) {
                var e = events[i];
                html += '<div class="lo-tl-item">' +
                    '<div class="lo-tl-dot ' + (e.type || 'default') + '"></div>' +
                    '<div class="lo-tl-title">' + this.esc(e.title) + '</div>' +
                    (e.desc ? '<div class="lo-tl-desc">' + this.esc(e.desc.length > 80 ? e.desc.substring(0, 80) + '...' : e.desc) + '</div>' : '') +
                    '<div class="lo-tl-time">' + this.fdt(e.date) + '</div>' +
                '</div>';
            }
            if (events.length > maxShow) {
                html += '<div style="text-align:center;padding:8px 0"><button class="btn btn-ghost btn-sm" onclick="VT.LeadOverview.switchTab(\'timeline\')" style="font-size:12px;color:#0B4A3D">View all ' + events.length + ' events <i class="fas fa-arrow-right" style="font-size:10px"></i></button></div>';
            }
        }

        html += '</div></div>';
        return html;
    },

    /* Card: Activity Log Widget (overview sidebar, compact) */
    renderActivityLogWidget: function(d) {
        var activities = this._getActivityLog();
        var maxShow = 4;
        var showCount = Math.min(activities.length, maxShow);

        var html = '<div class="lo-card">' +
            '<h3><i class="fas fa-clipboard-list"></i> Activity Log</h3>';

        if (activities.length === 0) {
            html += '<div class="lo-empty"><i class="fas fa-clipboard"></i><h3>No Activity</h3></div>';
        } else {
            for (var i = 0; i < showCount; i++) {
                var a = activities[i];
                html += '<div class="lo-activity-item">' +
                    '<div class="lo-activity-icon">' +
                        '<i class="fas ' + a.icon + '"></i>' +
                    '</div>' +
                    '<div class="lo-activity-text">' +
                        '<div>' + this.esc(a.text) + '</div>' +
                        '<div class="lo-activity-time">' + this.fdt(a.date) + '</div>' +
                    '</div>' +
                '</div>';
            }
            if (activities.length > maxShow) {
                html += '<div class="lo-activity-more">+' + (activities.length - maxShow) + ' more</div>';
            }
        }

        html += '</div>';
        return html;
    },

    /* ===== TIMELINE EVENTS ===== */
    _getTimelineEvents: function() {
        var d = this.lead;
        if (!d) return [];
        var events = [];

        // Lead Created
        if (d.createdAt) {
            events.push({ date: d.createdAt, title: 'Lead Created', desc: 'Lead ' + (d.leadNo || d.id) + ' was created', type: 'created' });
        }

        // Activities
        if (this.activities) {
            for (var a = 0; a < this.activities.length; a++) {
                events.push({ date: this.activities[a].date, title: this.activities[a].text, desc: '', type: 'followup' });
            }
        }

        // Follow-ups
        for (var i = 0; i < this.followups.length; i++) {
            var f = this.followups[i];
            var desc = f.remarks || f.notes || '';
            var title = (f.mode || 'Follow-up') + (f.outcome ? ' — ' + f.outcome : '');
            events.push({ date: f.followupDate || f.createdAt, title: title, desc: desc, type: 'followup' });
        }

        // Quotations
        for (var q = 0; q < this.quotations.length; q++) {
            var qt = this.quotations[q];
            events.push({ date: qt.createdAt || qt.created || qt.date, title: 'Quotation: ' + (qt.quotationNo || qt.id || qt.quotationId || ''), desc: 'Amount: ' + (qt.grandTotal || qt.total || 0), type: 'proposal' });
        }

        // Stage changes from seed data activities
        if (d.activities) {
            for (var j = 0; j < d.activities.length; j++) {
                var act = d.activities[j];
                if (act.type && act.type.toLowerCase().indexOf('stage changed') !== -1) {
                    events.push({ date: act.date, title: act.type, desc: '', type: 'created' });
                }
            }
        }

        // Conversion
        if (d.convertedToCPR) {
            events.push({ date: d.updatedAt || d.createdAt, title: 'Converted to CPR: ' + d.convertedToCPR, desc: '', type: 'completed' });
        }

        // Won/Lost
        if (d.stage === 'won') {
            events.push({ date: d.updatedAt || d.createdAt, title: 'Deal Won!', desc: 'Lead ' + (d.leadNo || d.id) + ' was won', type: 'completed' });
        }
        if (d.stage === 'lost') {
            events.push({ date: d.updatedAt || d.createdAt, title: 'Deal Lost', desc: 'Lead ' + (d.leadNo || d.id) + ' was marked as lost', type: 'danger' });
        }

        // Sort newest first
        events.sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); });
        return events;
    },

    _getActivityLog: function() {
        var d = this.lead;
        var activities = [];

        if (d.createdAt) {
            activities.push({ date: d.createdAt, text: 'Lead Created', icon: 'fa-plus-circle' });
        }
        if (d.updatedAt && d.updatedAt !== d.createdAt) {
            activities.push({ date: d.updatedAt, text: 'Lead Updated', icon: 'fa-pen' });
        }
        if (d.status === 'converted') {
            activities.push({ date: d.updatedAt || d.createdAt, text: d.convertedToCPR ? 'Converted to CPR: ' + d.convertedToCPR : 'Lead Converted', icon: 'fa-exchange-alt' });
        }
        if (d.stage === 'won') {
            activities.push({ date: d.updatedAt || d.createdAt, text: 'Stage changed to Won', icon: 'fa-trophy' });
        }
        if (d.stage === 'lost') {
            activities.push({ date: d.updatedAt || d.createdAt, text: 'Stage changed to Lost', icon: 'fa-times-circle' });
        }
        if (d.assignee) {
            activities.push({ date: d.createdAt || d.updatedAt, text: 'Assigned to ' + d.assignee, icon: 'fa-user-check' });
        }

        // Sort newest first
        activities.sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); });
        return activities;
    },

    /* ===== TAB SWITCHING ===== */
    switchTab: function(tab) {
        this.currentTab = tab;
        var tabs = document.querySelectorAll('.lo-tab');
        for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
        var activeTab = document.querySelector('.lo-tab[data-tab="' + tab + '"]');
        if (activeTab) activeTab.classList.add('active');
        var panes = document.querySelectorAll('.lo-pane');
        for (var j = 0; j < panes.length; j++) panes[j].classList.remove('active');
        var activePane = document.getElementById('pane-' + tab);
        if (activePane) activePane.classList.add('active');

        // Update URL with selected tab for persistence on refresh
        var params = new URLSearchParams(window.location.search);
        var id = params.get('id');
        if (id) {
            var base = window.location.pathname;
            var newUrl = base + '?id=' + encodeURIComponent(id);
            if (tab !== 'overview') newUrl += '&tab=' + encodeURIComponent(tab);
            window.history.replaceState(null, '', newUrl);
        }
    },

    /* ===== FULL TAB CONTENT ===== */

    /* Timeline Tab */
    renderFullTimeline: function(d) {
        var events = this._getTimelineEvents();

        var html = '<div class="lo-card">' +
            '<h3><i class="fas fa-history"></i> Full Timeline (' + events.length + ' events)</h3>' +
            '<div class="lo-timeline">';

        if (events.length === 0) {
            html += '<div class="lo-empty"><i class="fas fa-clock"></i><h3>No Timeline Events</h3></div>';
        } else {
            for (var i = 0; i < events.length; i++) {
                var e = events[i];
                html += '<div class="lo-tl-item">' +
                    '<div class="lo-tl-dot ' + (e.type || 'default') + '"></div>' +
                    '<div class="lo-tl-title">' + this.esc(e.title) + '</div>' +
                    (e.desc ? '<div class="lo-tl-desc">' + this.esc(e.desc.length > 200 ? e.desc.substring(0, 200) + '...' : e.desc) + '</div>' : '') +
                    '<div class="lo-tl-time">' + this.fdt(e.date) + '</div>' +
                '</div>';
            }
        }

        html += '</div></div>';
        return html;
    },

    /* Follow-ups Tab */
    renderFollowupsTab: function(d) {
        var html = '<div class="lo-card">' +
            '<h3><i class="fas fa-phone"></i> Follow-ups <span style="color:var(--text-muted,#9ca3af);text-transform:none;font-weight:400;font-size:11px;letter-spacing:0">(' + this.followups.length + ' records)</span></h3>';

        if (this.followups.length === 0) {
            html += '<div class="lo-empty"><i class="fas fa-calendar-check"></i><h3>No Follow-ups</h3>' +
                '<p>Create a follow-up to track interactions with this lead.</p>' +
                '<button class="btn btn-primary btn-sm" onclick="VT.LeadOverview.createFollowup()" style="margin-top:8px"><i class="fas fa-plus"></i> Add Follow-up</button>' +
                '</div>';
        } else {                html += '<div class="lo-table-wrap"><table class="lo-table"><thead><tr>' +
                '<th scope="col">Date</th><th scope="col">Time</th><th scope="col">Mode</th><th scope="col">Status</th><th scope="col">Priority</th><th scope="col">Outcome</th><th scope="col" class="lo-table-actions">Actions</th>' +
                '</tr></thead><tbody>';

            // Sort newest first
            var sorted = this.followups.slice().sort(function(a, b) {
                return (b.followupDate || b.createdAt || '').localeCompare(a.followupDate || a.createdAt || '');
            });

            for (var i = 0; i < sorted.length; i++) {
                var f = sorted[i];
                html += '<tr>' +
                    '<td class="nowrap">' + this.fd(f.followupDate) + '</td>' +
                    '<td>' + this.esc(f.followupTime || '-') + '</td>' +
                    '<td class="lo-table-mode"><i class="fas ' + this.modeIcon(f.mode) + '"></i> ' + this.esc(f.mode || 'Call') + '</td>' +
                    '<td>' + this.statusBadgeCustom(f.status || 'Open') + '</td>' +
                    '<td>' + this.priorityBadge(f.priority) + '</td>' +
                    '<td class="max-w-150">' + this.esc(f.outcome || '-') + '</td>' +
                    '<td class="lo-table-actions"><a href="followup-view.html?id=' + encodeURIComponent(f.id) + '" class="btn btn-ghost btn-sm"><i class="fas fa-eye"></i></a></td>' +
                '</tr>';
            }
            html += '</tbody></table></div>';
        }

        html += '</div>';
        return html;
    },

    statusBadgeCustom: function(status) {
        var s = (status || '').toLowerCase();
        if (s === 'completed') return '<span class="lo-badge lo-badge-success">Completed</span>';
        if (s === 'cancelled') return '<span class="lo-badge lo-badge-danger">Cancelled</span>';
        if (s === 'rescheduled') return '<span class="lo-badge lo-badge-warning">Rescheduled</span>';
        if (s === 'missed') return '<span class="lo-badge lo-badge-danger">Missed</span>';
        if (s === 'open') return '<span class="lo-badge lo-badge-primary">Open</span>';
        return '<span class="lo-badge lo-badge-neutral">' + this.esc(status || 'Open') + '</span>';
    },

    /* Quotations Tab */
    renderQuotationsTab: function(d) {
        var html = '<div class="lo-card">' +
            '<h3><i class="fas fa-file-invoice"></i> Quotations <span style="color:var(--text-muted,#9ca3af);text-transform:none;font-weight:400;font-size:11px;letter-spacing:0">(' + this.quotations.length + ' records)</span></h3>';

        if (this.quotations.length === 0) {
            html += '<div class="lo-empty"><i class="fas fa-file-invoice"></i><h3>No Quotations</h3><p>No quotations have been created for this lead yet.</p></div>';
        } else {
            html += '<div class="lo-table-wrap"><table class="lo-table"><thead><tr>' +
                '<th>Quotation No.</th><th>Date</th><th>Amount</th><th>Status</th><th class="lo-table-actions">Actions</th>' +
                '</tr></thead><tbody>';

            var sorted = this.quotations.slice().sort(function(a, b) {
                return (b.createdAt || b.date || '').localeCompare(a.createdAt || a.date || '');
            });

            for (var i = 0; i < sorted.length; i++) {
                var q = sorted[i];
                var qNo = q.quotationNo || q.quotationId || q.id || '-';
                var qAmount = q.grandTotal || q.total || q.amount || 0;
                html += '<tr>' +
                    '<td><strong>' + this.esc(qNo) + '</strong></td>' +
                    '<td class="nowrap">' + this.fd(q.createdAt || q.date || q.created) + '</td>' +
                    '<td>' + this.fn(qAmount) + '</td>' +
                    '<td>' + this.statusBadgeCustom(q.status || 'Draft') + '</td>' +
                    '<td class="lo-table-actions"><a href="quotation-view.html?id=' + encodeURIComponent(q.id) + '" class="btn btn-ghost btn-sm"><i class="fas fa-eye"></i></a></td>' +
                '</tr>';
            }
            html += '</tbody></table></div>';
        }

        html += '</div>';
        return html;
    },

    /* Documents Tab */
    renderDocumentsTab: function(d) {
        var docs = d.attachments || [];
        var html = '<div class="lo-card">' +
            '<h3><i class="fas fa-file"></i> Uploaded Documents & Attachments <span style="color:var(--text-muted,#9ca3af);text-transform:none;font-weight:400;font-size:11px;letter-spacing:0">(' + docs.length + ' files)</span></h3>';

        if (docs.length === 0) {
            html += '<div class="lo-empty"><i class="fas fa-file"></i><h3>No Documents</h3><p>No documents have been uploaded for this lead.</p></div>';
        } else {
            if (typeof VT !== 'undefined' && VT.AttachmentService) {
                for (var i = 0; i < docs.length; i++) {
                    html += VT.AttachmentService.renderItem(docs[i], i);
                }
            } else {
                for (var i = 0; i < docs.length; i++) {
                    var doc = docs[i];
                    var icon = 'fa-file';
                    if (doc.type) {
                        if (doc.type.indexOf('pdf') !== -1) icon = 'fa-file-pdf';
                        else if (doc.type.indexOf('image') !== -1) icon = 'fa-file-image';
                        else if (doc.type.indexOf('word') !== -1) icon = 'fa-file-word';
                        else if (doc.type.indexOf('spreadsheet') !== -1 || doc.type.indexOf('excel') !== -1) icon = 'fa-file-excel';
                    }
                    var sizeStr = doc.size > 1024 ? Math.round(doc.size / 1024) + ' KB' : (doc.size || '') + ' B';
                    html += '<div class="lo-doc-item">' +
                        '<i class="fas ' + icon + '"></i>' +
                        '<span class="doc-name">' + this.esc(doc.name || doc.filename || 'File') + '</span>' +
                        (doc.size ? '<span class="doc-size">' + sizeStr + '</span>' : '') +
                        '<div class="doc-actions">' +
                            (doc.dataUrl ? '<button class="btn btn-icon btn-sm btn-ghost" title="View"><i class="fas fa-eye"></i></button>' : '<button class="btn btn-icon btn-sm btn-ghost" disabled title="No preview"><i class="fas fa-eye-slash" style="color:#d1d5db"></i></button>') +
                            (doc.dataUrl ? '<button class="btn btn-icon btn-sm btn-ghost" title="Download"><i class="fas fa-download"></i></button>' : '') +
                        '</div>' +
                    '</div>';
                }
            }
        }

        html += '</div>';
        return html;
    },

    /* Notes Tab */
    renderNotesTab: function(d) {
        var notes = d.notes || d.requirement || d.description || '';
        var internalNotes = d.internalNotes || '';
        var html = '<div class="lo-card">' +
            '<h3><i class="fas fa-sticky-note"></i> Notes & Requirements</h3>';

        if (notes || internalNotes) {
            if (notes) html += '<div class="lo-notes-text">' + this.esc(notes) + '</div>';
            if (internalNotes) {
                html += '<hr class="lo-divider"><div class="lo-internal-notes">' +
                    '<span class="lo-internal-label">Internal Notes</span>' +
                    '<div class="lo-notes-text lo-notes-internal">' + this.esc(internalNotes) + '</div></div>';
            }
        } else {
            html += '<div class="lo-empty"><i class="fas fa-sticky-note"></i><h3>No Notes</h3><p>No notes or additional information recorded for this lead.</p></div>';
        }

        html += '</div>';
        return html;
    },

    /* History Tab */
    renderHistoryTab: function(d) {
        var html = '<div class="lo-card">' +
            '<h3><i class="fas fa-history"></i> Lead History</h3>' +
            '<div>';

        if (d.createdAt) {
            html += '<div class="lo-history-row">' +
                '<span class="lo-history-label">Created:</span> <span class="lo-history-value">' + this.fdt(d.createdAt) + '</span></div>';
        }
        if (d.updatedAt) {
            html += '<div class="lo-history-row">' +
                '<span class="lo-history-label">Last Updated:</span> <span class="lo-history-value">' + this.fdt(d.updatedAt) + '</span></div>';
        }
        html += '<div class="lo-history-row">' +
            '<span class="lo-history-label">Lead ID:</span> <span class="lo-history-value">' + this.esc(d.id) + '</span></div>';
        html += '<div class="lo-history-row">' +
            '<span class="lo-history-label">Lead No:</span> <span class="lo-history-value">' + this.esc(d.leadNo || d.id) + '</span></div>';
        html += '<div class="lo-history-row">' +
            '<span class="lo-history-label">Current Status:</span> <span class="lo-history-value">' + this.statusBadge(d.status) + '</span></div>';
        html += '<div class="lo-history-row">' +
            '<span class="lo-history-label">Current Stage:</span> <span class="lo-history-value">' + this.stageBadge(d.stage || 'New') + '</span></div>';

        // Follow-up count
        html += '<div class="lo-history-row">' +
            '<span class="lo-history-label">Total Follow-ups:</span> <span class="lo-history-value">' + this.followups.length + '</span></div>';

        if (d.convertedToCPR) {
            html += '<div class="lo-history-row">' +
                '<span class="lo-history-label">Converted to CPR:</span> <span class="lo-history-value"><a href="pr-view.html?id=' + encodeURIComponent(d.convertedToCPR) + '" class="lo-link">' + this.esc(d.convertedToCPR) + ' <i class="fas fa-external-link-alt"></i></a></span></div>';
        }

        if (d.activities && d.activities.length > 0) {
            html += '<hr class="lo-divider"><div class="lo-history-title">Activity Timeline:</div>';
            var sortedActs = d.activities.slice().sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); });
            for (var i = 0; i < sortedActs.length; i++) {
                html += '<div class="lo-history-activity">' +
                    '<strong>' + this.esc(sortedActs[i].type) + '</strong> <span>' + this.fdt(sortedActs[i].date) + '</span></div>';
            }
        }

        html += '</div></div>';
        return html;
    },

    /* ===== RESTORE TAB FROM URL ===== */
    _restoreTab: function() {
        var params = new URLSearchParams(window.location.search);
        var tab = params.get('tab');
        if (tab && tab !== 'overview') {
            this.switchTab(tab);
        }
    },

    /* ===== ADD POPSTATE LISTENER FOR BACK/FORWARD ===== */
    _initPopstate: function() {
        var self = this;
        if (this._popstateInit) return;
        this._popstateInit = true;
        window.addEventListener('popstate', function() {
            var p = new URLSearchParams(window.location.search);
            var t = p.get('tab') || 'overview';
            self.switchTab(t);
        });
        window.addEventListener('beforeunload', function() { self._saveScrollPosition(); });
        this._restoreScrollPosition();
    },

    _saveScrollPosition: function() {
        var state = { scrollY: window.scrollY || 0 };
        if (typeof VT !== 'undefined' && VT.ViewState) {
            VT.ViewState.saveUserViewState('lead-overview', state);
        } else {
            try { localStorage.setItem('vt_lead_overview_scroll', JSON.stringify(state)); } catch(e) {}
        }
    },

    _restoreScrollPosition: function() {
        var state = null;
        if (typeof VT !== 'undefined' && VT.ViewState) {
            state = VT.ViewState.loadUserViewState('lead-overview');
        } else {
            try { state = JSON.parse(localStorage.getItem('vt_lead_overview_scroll')); } catch(e) {}
        }
        if (state && state.scrollY > 0) {
            setTimeout(function() { window.scrollTo(0, state.scrollY); }, 50);
        }
    },

    /* ===== ACTIONS ===== */

    createFollowup: function() {
        var id = this.lead.id || this.lead.leadNo || '';
        var name = this.lead.name || this.lead.contactPerson || '';
        window.location.href = 'followup-create.html?leadId=' + encodeURIComponent(id) +
            '&customer=' + encodeURIComponent(name) +
            '&return=' + encodeURIComponent('lead-overview.html?id=' + encodeURIComponent(id));
    },

    convertToCPR: function() {
        var self = this;
        if (!confirm('Convert this lead to a Customer Purchase Request (CPR)?')) return;

        var d = this.lead;
        var cprs = JSON.parse(localStorage.getItem('vt_cprs') || '[]');
        var cprId = 'CPR-' + new Date().getFullYear() + '-' + String(cprs.length + 1).padStart(6, '0');
        var cpr = {
            id: cprId, cprNo: cprId, cprDate: new Date().toISOString().split('T')[0],
            customerName: d.name || '', companyName: d.company || '',
            contactPerson: d.contactPerson || d.name || '', mobile: d.phone || '', email: d.email || '',
            address: d.address || '', industry: d.industry || '',
            source: d.source || 'Lead Conversion', assignedExecutive: d.assignee || 'Admin',
            requirementSummary: d.requirement || d.notes || '', items: [],
            expectedOrderValue: d.expectedValue || 0, expectedValue: d.expectedValue || 0,
            priority: d.priority || 'Medium', status: 'Open',
            remarks: 'Converted from lead: ' + (d.leadNo || d.id),
            attachments: [], createdAt: new Date().toISOString(), costWorkoutId: null,
            convertedToQuotation: null, leadSource: d.id, leadNo: d.leadNo || d.id
        };
        cprs.push(cpr);
        localStorage.setItem('vt_cprs', JSON.stringify(cprs));

        // Update lead
        d.status = 'converted';
        d.stage = 'won';
        d.convertedToCPR = cprId;
        var leads = JSON.parse(localStorage.getItem('vt_leads') || '[]');
        for (var i = 0; i < leads.length; i++) {
            if (leads[i].id === d.id) {
                leads[i] = d;
                break;
            }
        }
        localStorage.setItem('vt_leads', JSON.stringify(leads));
        this._addActivity('Lead converted to CPR: ' + cprId, 'fa-exchange-alt');

        VT.Utils.showToast('Lead converted to CPR: ' + cprId, 'success');
        if (confirm('Open the new CPR?')) {
            window.location.href = 'pr-view.html?id=' + encodeURIComponent(cprId);
        } else {
            this.render();
        }
    },

    deleteLead: function() {
        var self = this;
        if (!confirm('Delete this lead? It will be moved to trash.')) return;
        var leads = JSON.parse(localStorage.getItem('vt_leads') || '[]');
        for (var i = 0; i < leads.length; i++) {
            if (leads[i].id === this.lead.id) {
                leads[i].status = 'deleted';
                break;
            }
        }
        localStorage.setItem('vt_leads', JSON.stringify(leads));
        this._addActivity('Lead moved to trash');
        VT.Utils.showToast('Lead moved to trash', 'success');
        window.location.href = 'leads.html';
    },

    /* ===== PRIVATE HELPERS ===== */
    _addActivity: function(text, icon) {
        try {
            if (VT.LeadUtils && VT.LeadUtils.addActivity) {
                VT.LeadUtils.addActivity(this.lead.id, text, icon);
            }
        } catch(e) {}
    }
};

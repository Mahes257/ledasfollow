/* ERP Lead Service — shared Lead lookup, normalization, and auto-fill for all modules */
window.VT = window.VT || {};
(function() {
var S = VT.ERPLeadService = {};

// ---- cached data ----
S._leads = null;
S._followups = null;
S._cprs = null;
S._quotations = null;
S._clients = null;

function _load(arr, key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); }
    catch(e) { return []; }
}

S.refresh = function() {
    S._leads = _load(null, 'vt_leads');
    S._followups = _load(null, 'vt_lead_followups');
    S._cprs = _load(null, 'vt_cprs');
    S._quotations = _load(null, 'vt_quotations');
    S._clients = _load(null, 'vt_clients');
};

// auto-initialize
S.refresh();

// ============================================================
// LEAD NORMALIZATION — return a lead with all standard properties
// ============================================================
S.normalize = function(l) {
    if (!l) return null;
    var std = {
        // identifiers
        id: l.id || '',
        leadNo: l.leadNo || l.leadNumber || '',
        // name / company
        name: l.name || l.contactPerson || l.contactName || '',
        company: l.company || l.companyName || l.businessName || l.organisation || '',
        customerName: l.customerName || l.company || l.companyName || l.businessName || l.organisation || l.name || '',
        // contact
        contactPerson: l.contactPerson || l.contactName || l.name || '',
        phone: l.phone || l.mobile || l.phoneNumber || '',
        mobile: l.mobile || l.phone || '',
        email: l.email || l.emailAddress || '',
        // address
        address: l.address || l.street || '',
        city: l.city || l.town || '',
        state: l.state || '',
        country: l.country || '',
        pincode: l.pincode || l.zip || l.zipCode || '',
        // business info
        source: l.source || l.leadSource || '',
        industry: l.industry || l.industryType || '',
        stage: l.stage || l.currentStage || l.status || '',
        status: l.status || l.stage || l.currentStage || '',
        priority: l.priority || 'medium',
        // assignment
        executive: l.executive || l.assignedExecutive || l.assignee || l.leadOwner || l.assignedTo || '',
        assignee: l.assignee || l.leadOwner || l.executive || l.assignedExecutive || '',
        leadOwner: l.leadOwner || l.assignee || l.executive || l.assignedExecutive || '',
        // financial
        expectedValue: parseFloat(l.expectedValue || l.expectedOrderValue || 0),
        // metadata
        createdAt: l.createdAt || l.createdDate || l.date || '',
        updatedAt: l.updatedAt || l.lastModified || '',
        lastActivityAt: l.lastActivityAt || l.lastFollowUp || '',
        description: l.description || l.requirementSummary || l.remarks || l.notes || '',
        notes: l.notes || l.remarks || l.description || '',
        remarks: l.remarks || l.notes || '',
        gst: l.gst || l.gstNo || l.gstNumber || '',
        // raw source
        _raw: l
    };
    return std;
};

// ============================================================
// LEAD LOOKUP
// ============================================================
S.getAll = function() {
    if (!S._leads) S.refresh();
    return (S._leads || []).slice();
};

S.getById = function(id) {
    if (!id) return null;
    if (!S._leads) S.refresh();
    for (var i = 0; i < S._leads.length; i++) {
        if (S._leads[i].id === id || S._leads[i].leadNo === id) {
            return S.normalize(S._leads[i]);
        }
    }
    return null;
};

S.getByLeadNo = function(leadNo) {
    if (!leadNo) return null;
    if (!S._leads) S.refresh();
    for (var i = 0; i < S._leads.length; i++) {
        if (S._leads[i].leadNo === leadNo || S._leads[i].id === leadNo) {
            return S.normalize(S._leads[i]);
        }
    }
    return null;
};

S.getByCustomer = function(name) {
    if (!name) return null;
    if (!S._leads) S.refresh();
    var q = name.toLowerCase();
    for (var i = 0; i < S._leads.length; i++) {
        var l = S._leads[i];
        var n = (l.company || l.companyName || l.businessName || l.name || l.customerName || '').toLowerCase();
        if (n.indexOf(q) !== -1) return S.normalize(l);
    }
    return null;
};

S.find = function(query) {
    if (!query) return [];
    if (!S._leads) S.refresh();
    var q = query.toLowerCase();
    var results = [];
    for (var i = 0; i < S._leads.length; i++) {
        var l = S._leads[i];
        var searchText = ((l.leadNo || '') + ' ' + (l.company || l.companyName || l.businessName || '') + ' ' + (l.name || l.contactPerson || '') + ' ' + (l.phone || l.mobile || '') + ' ' + (l.email || '')).toLowerCase();
        if (searchText.indexOf(q) !== -1) {
            results.push(S.normalize(l));
        }
    }
    return results;
};

S.getLeadOptions = function() {
    if (!S._leads) S.refresh();
    var items = [];
    for (var i = 0; i < S._leads.length; i++) {
        var l = S._leads[i];
        if (l.status === 'deleted' || l.status === 'archived') continue;
        var n = S.normalize(l);
        var display = n.leadNo + ' \u2014 ' + (n.company || n.name) + (n.name && n.company ? ' (' + n.name + ')' : '');
        var searchText = (n.leadNo + ' ' + n.company + ' ' + n.name + ' ' + n.phone + ' ' + n.email + ' ' + n.mobile).toLowerCase();
        items.push({ id: n.id, leadNo: n.leadNo, display: display, searchText: searchText, lead: l, normalized: n });
    }
    return items;
};

// ============================================================
// POPULATE FORM FIELDS
// ============================================================
S.populateForm = function(lead, prefix) {
    if (!lead) return;
    var n = typeof lead.company === 'string' ? lead : S.normalize(lead);
    if (!n) return;
    prefix = prefix || '';

    function setVal(id, val) {
        var el = document.getElementById(prefix + id);
        if (!el) return;
        el.value = val || '';
    }

    setVal('leadNo', n.leadNo);
    setVal('customer', n.customerName || n.company || n.name);
    setVal('customerName', n.customerName || n.company || n.name);
    setVal('company', n.company || n.customerName);
    setVal('companyName', n.company || n.customerName);
    setVal('contactPerson', n.contactPerson || n.name);
    setVal('contactName', n.contactPerson || n.name);
    setVal('phone', n.phone || n.mobile);
    setVal('mobile', n.mobile || n.phone);
    setVal('email', n.email);
    setVal('leadStatus', n.stage || n.status);
    setVal('status', n.stage || n.status);
    setVal('stage', n.stage || n.status);
    setVal('source', n.source);
    setVal('leadSource', n.source);
    setVal('industry', n.industry);
    setVal('executive', n.executive);
    setVal('assignee', n.assignee);
    setVal('leadOwner', n.leadOwner);
    setVal('expectedValue', n.expectedValue);
    setVal('address', n.address);
    setVal('city', n.city);
    setVal('state', n.state);
    setVal('country', n.country);
    setVal('pincode', n.pincode);
    setVal('gst', n.gst);
    setVal('remarks', n.remarks || n.description);
    setVal('notes', n.notes || n.description);
    setVal('description', n.description);
    setVal('createdAt', n.createdAt);
    setVal('updatedAt', n.updatedAt);

    return n;
};

// ============================================================
// LEAD FOLLOW-UPS (Timeline)
// ============================================================
S.getFollowups = function(leadId) {
    if (!leadId) return [];
    if (!S._followups) S.refresh();
    var results = [];
    for (var i = 0; i < S._followups.length; i++) {
        var f = S._followups[i];
        if (f.leadId === leadId || f.leadNo === leadId) {
            results.push(f);
        }
    }
    results.sort(function(a, b) {
        var da = a.followupDate || '0000-00-00';
        var db = b.followupDate || '0000-00-00';
        if (da !== db) return da > db ? -1 : 1;
        var ta = a.followupTime || '00:00';
        var tb = b.followupTime || '00:00';
        return ta > tb ? -1 : 1;
    });
    return results;
};

S.getLastFollowup = function(leadId) {
    var fus = S.getFollowups(leadId);
    return fus.length > 0 ? fus[0] : null;
};

S.getFollowupCount = function(leadId) {
    return S.getFollowups(leadId).length;
};

// ============================================================
// RELATED RECORDS
// ============================================================
S.getCPRs = function(leadNo) {
    if (!leadNo) return [];
    if (!S._cprs) S.refresh();
    var results = [];
    for (var i = 0; i < S._cprs.length; i++) {
        var c = S._cprs[i];
        if (c.leadNo === leadNo) results.push(c);
    }
    return results;
};

S.getCPRCount = function(leadNo) {
    return S.getCPRs(leadNo).length;
};

S.getQuotations = function(leadNo) {
    if (!leadNo) return [];
    if (!S._quotations) S.refresh();
    var results = [];
    for (var i = 0; i < S._quotations.length; i++) {
        var q = S._quotations[i];
        if (q.leadNo === leadNo || q.sourceLead === leadNo) results.push(q);
    }
    return results;
};

S.getQuotationCount = function(leadNo) {
    return S.getQuotations(leadNo).length;
};

// ============================================================
// LEAD SUMMARY HTML
// ============================================================
S.renderSummaryHTML = function(lead) {
    if (!lead) return '<div style="text-align:center;padding:24px 0;color:#9ca3af;font-size:13px"><i class="fas fa-user" style="font-size:24px;display:block;margin-bottom:8px;color:#d1d5db"></i>Select a lead to view summary</div>';
    var n = typeof lead.company === 'string' ? lead : S.normalize(lead);
    if (!n) return '<div style="text-align:center;padding:24px 0;color:#9ca3af;font-size:13px">Lead not found</div>';

    var fuCount = S.getFollowupCount(n.id || n.leadNo);
    var cprCount = S.getCPRCount(n.leadNo);
    var qtnCount = S.getQuotationCount(n.leadNo);
    var lastFup = S.getLastFollowup(n.id || n.leadNo);

    return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">' +
        '<div style="color:var(--text-secondary,#6b7280)">Lead Number</div><div style="font-weight:500;text-align:right">' + escapeHtml(n.leadNo || '-') + '</div>' +
        '<div style="color:var(--text-secondary,#6b7280)">Customer</div><div style="font-weight:500;text-align:right">' + escapeHtml(n.customerName || '-') + '</div>' +
        '<div style="color:var(--text-secondary,#6b7280)">Company</div><div style="font-weight:500;text-align:right">' + escapeHtml(n.company || '-') + '</div>' +
        '<div style="color:var(--text-secondary,#6b7280)">Executive</div><div style="font-weight:500;text-align:right">' + escapeHtml(n.executive || '-') + '</div>' +
        '<div style="color:var(--text-secondary,#6b7280)">Status</div><div style="font-weight:500;text-align:right">' + escapeHtml(n.status || '-') + '</div>' +
        '<div style="color:var(--text-secondary,#6b7280)">Source</div><div style="font-weight:500;text-align:right">' + escapeHtml(n.source || '-') + '</div>' +
        '<div style="color:var(--text-secondary,#6b7280)">Industry</div><div style="font-weight:500;text-align:right">' + escapeHtml(n.industry || '-') + '</div>' +
        '<div style="color:var(--text-secondary,#6b7280)">Expected Value</div><div style="font-weight:500;text-align:right">' + (VT.Utils && VT.Utils.formatCurrency ? VT.Utils.formatCurrency(n.expectedValue) : '\u20B9' + Number(n.expectedValue||0).toLocaleString('en-IN')) + '</div>' +
        '<div style="color:var(--text-secondary,#6b7280)">Total Follow-ups</div><div style="font-weight:500;text-align:right">' + fuCount + '</div>' +
        '<div style="color:var(--text-secondary,#6b7280)">Total CPRs</div><div style="font-weight:500;text-align:right">' + cprCount + '</div>' +
        '<div style="color:var(--text-secondary,#6b7280)">Total Quotations</div><div style="font-weight:500;text-align:right">' + qtnCount + '</div>' +
        '<div style="color:var(--text-secondary,#6b7280)">Last Activity</div><div style="font-weight:500;text-align:right">' + (lastFup ? formatDate(lastFup.followupDate) : (n.lastActivityAt ? formatDate(n.lastActivityAt) : '-')) + '</div>' +
        '<div style="color:var(--text-secondary,#6b7280)">Next Follow-up</div><div style="font-weight:500;text-align:right">' + (lastFup && lastFup.nextFollowupDate ? formatDate(lastFup.nextFollowupDate) : '-') + '</div>' +
        '<div style="color:var(--text-secondary,#6b7280)">Phone</div><div style="font-weight:500;text-align:right">' + escapeHtml(n.phone || '-') + '</div>' +
        '<div style="color:var(--text-secondary,#6b7280)">Email</div><div style="font-weight:500;text-align:right">' + escapeHtml(n.email || '-') + '</div>' +
        '</div>';
};

function escapeHtml(s) {
    if (!s && s !== 0) return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

function formatDate(d) {
    if (!d) return '-';
    try { var dt = new Date(d); if (isNaN(dt)) return d; return dt.toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'}); }
    catch(e) { return d; }
}

// ============================================================
// TIMELINE HTML
// ============================================================
S.renderTimelineHTML = function(lead) {
    if (!lead) return '<div style="text-align:center;padding:24px 0;color:#9ca3af;font-size:13px"><i class="fas fa-spinner fa-pulse" style="font-size:24px;display:block;margin-bottom:8px"></i>Select a lead to view timeline</div>';
    var n = typeof lead.company === 'string' ? lead : S.normalize(lead);
    if (!n) return '<div style="text-align:center;padding:24px 0;color:#9ca3af;font-size:13px">Lead not found</div>';

    var html = '';
    // Lead Created event
    var leadCreated = n.createdAt || n.updatedAt || '';
    if (leadCreated) {
        html += '<div class="fu-timeline-item completed"><div class="fu-timeline-time">' + timeAgo(leadCreated) + '</div><div class="fu-timeline-text">Lead Created</div><div class="fu-timeline-sub">' + escapeHtml(n.leadNo || '') + ' - ' + escapeHtml(n.name || '') + '</div></div>';
    }

    // Follow-ups
    var followups = S.getFollowups(n.id || n.leadNo);
    if (followups.length > 0) {
        html += '<div class="fu-timeline-item completed" style="padding-bottom:4px"><div class="fu-timeline-time">' + followups.length + ' previous follow-up(s)</div><div class="fu-timeline-text">Follow-up History</div></div>';
        var maxShow = 10;
        for (var i = 0; i < Math.min(followups.length, maxShow); i++) {
            var fu = followups[i];
            var timeStr = timeAgo(fu.followupDate);
            var isCompleted = (fu.status || '').toLowerCase() === 'completed';
            var statusIcon = isCompleted ? 'completed' : '';
            html += '<div class="fu-timeline-item ' + statusIcon + '" style="padding-bottom:4px"><div class="fu-timeline-time">' + timeStr + ' (' + formatDate(fu.followupDate) + ')</div><div class="fu-timeline-text">' + escapeHtml(fu.mode || 'Call') + ' - ' + escapeHtml(fu.remarks ? fu.remarks.substring(0, 60) + (fu.remarks.length > 60 ? '...' : '') : 'No remarks') + '</div><div class="fu-timeline-sub">' + escapeHtml(fu.priority || 'Medium') + ' | ' + escapeHtml(fu.status || 'Open') + '</div></div>';
        }
        if (followups.length > maxShow) {
            html += '<div class="fu-timeline-item" style="padding-bottom:4px"><div class="fu-timeline-text" style="color:#0A4F44">+' + (followups.length - maxShow) + ' more follow-up(s)</div></div>';
        }
    }

    // Current follow-up marker
    html += '<div class="fu-timeline-item active"><div class="fu-timeline-time">Present</div><div class="fu-timeline-text">Current Follow-up</div><div class="fu-timeline-sub">In progress</div></div>';

    return html;
};

function timeAgo(d) {
    if (!d) return '';
    try {
        var dt = new Date(d);
        if (isNaN(dt)) return '';
        var now = new Date();
        var diff = Math.floor((now - dt) / 1000);
        if (diff < 60) return 'Just now';
        if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
        if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
        if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
        return dt.toLocaleDateString('en-IN', {day:'2-digit', month:'short'});
    } catch(e) { return ''; }
}

// ============================================================
// LEAD STATISTICS
// ============================================================
S.getStatistics = function(leadNo) {
    var fus = S.getFollowups(leadNo);
    var cprs = S.getCPRs(leadNo);
    var qtns = S.getQuotations(leadNo);
    var lastFup = fus.length > 0 ? fus[0] : null;
    return {
        totalFollowups: fus.length,
        totalCPRs: cprs.length,
        totalQuotations: qtns.length,
        lastFollowup: lastFup,
        lastFollowupDate: lastFup ? lastFup.followupDate : null,
        nextFollowup: lastFup ? (lastFup.nextFollowupDate || null) : null
    };
};

// ============================================================
// ENSURE all modules pick up the service
// ============================================================
document.addEventListener('VT:DataSeeded', function() { S.refresh(); });
document.addEventListener('VT:DataUpdated', function() { S.refresh(); });
document.addEventListener('storage', function(e) {
    if (e.key && e.key.indexOf('vt_') === 0) S.refresh();
});

})();
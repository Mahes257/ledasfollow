/* VISHAK TECH Enterprise CRM — Leads Module v3.0
   Production-ready module matching Clients module quality.
   Features: Lead Dashboard KPIs, List with Safe-Action Menus,
   Pipeline/Kanban, Lead-to-Client Conversion, Enhanced Export.
   Reuses VT.Utils, VT.Export, VT.Pagination, VT.ColumnManager. */
window.VT = window.VT || {};

VT.Leads = {
    data: [],
    currentPage: 1,
    pageSize: 10,
    sortField: null,
    sortDir: 'asc',
    searchQuery: '',
    filterStatus: '',
    filterStage: '',
    filterSource: '',
    filterPriority: '',
    filterOwner: '',
    filterDateFrom: '',
    filterDateTo: '',
    formAttachments: [],

    defaultCols: { leadNo: true, company: true, name: true, phone: true, email: true, industry: true, source: true, stage: true, assignee: true, priority: true, expectedValue: true, status: true },

    /* ===== Shared helper badges ===== */
    priorityBadge: function(priority) {
        var p = (priority || 'medium').toLowerCase();
        var map = { low:'#6b7280', medium:'#d97706', high:'#dc2626', urgent:'#7c3aed', critical:'#dc2626' };
        var color = map[p] || '#6b7280';
        return '<span class="vl-stage" style="background:' + color + '15;color:' + color + ';border:1px solid ' + color + '30">' + 
            (priority || 'Medium').charAt(0).toUpperCase() + (priority || 'Medium').slice(1) + '</span>';
    },

    stageBadge: function(stage) {
        if (VT.LeadUtils && VT.LeadUtils.stageBadge) {
            return VT.LeadUtils.stageBadge(stage, 'list');
        }
        var s = (stage || 'new').toLowerCase();
        var map = { 'new':'vl-stage-new', 'contacted':'vl-stage-contacted', 'qualified':'vl-stage-qualified',
            'proposal':'vl-stage-proposal','proposal sent':'vl-stage-proposal','negotiation':'vl-stage-negotiation',
            'won':'vl-stage-won','lost':'vl-stage-lost','converted':'vl-stage-converted','inactive':'vl-stage-inactive' };
        var cls = map[s] || 'vl-stage-new';
        return '<span class="vl-stage ' + cls + '">' + (stage ? stage.charAt(0).toUpperCase() + stage.slice(1) : 'New') + '</span>';
    },

    formatCurrency: function(amount) {
        if (VT.Utils && VT.Utils.formatCurrency) {
            return VT.Utils.formatCurrency(amount);
        }
        if (amount === null || amount === undefined || isNaN(amount)) return '\u20B90.00';
        return '\u20B9' + Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    addActivity: function(leadId, text, icon) {
        if (VT.LeadUtils && VT.LeadUtils.addActivity) {
            VT.LeadUtils.addActivity(leadId, text, icon);
        }
    },

    addFollowupAuto: function(leadId, mode, notes, status) {
        var followups = VT.DataHub.getFollowups();
        var id = 'FUP-' + Date.now();
        var now = new Date().toISOString();
        followups.push({
            id: id,
            leadId: leadId,
            mode: mode || 'Call',
            notes: notes || '',
            remarks: notes || '',
            status: status || 'Completed',
            followupDate: now.substring(0, 10),
            createdAt: now,
            updatedAt: now
        });
        VT.DataHub.saveFollowups(followups);
    },

    clearSelection: function() {
        var checkboxes = document.querySelectorAll('.vl-checkbox');
        for (var i = 0; i < checkboxes.length; i++) {
            checkboxes[i].checked = false;
        }
        var selectAll = document.getElementById('selectAll');
        if (selectAll) selectAll.checked = false;
        this.updateBulkActionBar();
    },

    updateBulkActionBar: function() {
        var bar = document.getElementById('bulkActionBar');
        if (!bar) return;
        var checked = document.querySelectorAll('.vl-checkbox:checked');
        var count = checked.length;
        var countEl = bar.querySelector('.bulk-count');
        if (countEl) countEl.textContent = count + ' selected';
        bar.classList.toggle('show', count > 0);
        
        var statusBtns = { bulkRestoreBtn: ['bulkRestoreBtn','bulkPermanentDeleteBtn'] };
        var isDeletedTab = this.filterStatus === 'deleted';
        var restoreBtn = document.getElementById('bulkRestoreBtn');
        var permDelBtn = document.getElementById('bulkPermanentDeleteBtn');
        var delBtn = document.getElementById('bulkDeleteBtn');
        var archiveBtn = document.getElementById('bulkArchiveBtn');
        var assignBtn = document.getElementById('bulkAssignBtn');
        var stageBtn = document.getElementById('bulkStageBtn');
        var exportBtn = document.getElementById('bulkExportBtn');
        
        if (restoreBtn) restoreBtn.style.display = isDeletedTab ? '' : 'none';
        if (permDelBtn) permDelBtn.style.display = isDeletedTab ? '' : 'none';
        if (delBtn) delBtn.style.display = isDeletedTab ? 'none' : '';
        if (archiveBtn) archiveBtn.style.display = isDeletedTab ? 'none' : '';
        if (assignBtn) assignBtn.style.display = isDeletedTab ? 'none' : '';
        if (stageBtn) stageBtn.style.display = isDeletedTab ? 'none' : '';
        if (exportBtn) exportBtn.style.display = isDeletedTab ? 'none' : '';
    },

    updateTabCounts: function() {
        var activeCount = 0, archivedCount = 0, deletedCount = 0;
        for (var i = 0; i < this.data.length; i++) {
            var s = (this.data[i].status || '').toLowerCase();
            if (s === 'deleted') deletedCount++;
            else if (s === 'archived') archivedCount++;
            else activeCount++;
        }
        var countEls = document.querySelectorAll('.tab-count');
        if (countEls.length >= 3) {
            countEls[0].textContent = activeCount;
            countEls[1].textContent = archivedCount;
            countEls[2].textContent = deletedCount;
        }
        // Also update leadKpiGrid counts
        if (VT.Utils && VT.Utils.updateActiveArchivedCounts) {
            VT.Utils.updateActiveArchivedCounts(this.data, 'activeCount', 'archivedCount');
        }
    },

    renderLastFollowupCell: function(d) {
        var followups = VT.DataHub.getFollowups();
        var leadNo = d.leadNo || d.id || '';
        var lastFu = null;
        for (var f = 0; f < followups.length; f++) {
            var fu = followups[f];
            if (fu.leadId === d.id || fu.leadNo === leadNo || fu.lead === d.id) {
                if (!lastFu || (fu.followupDate || fu.createdAt || '') > (lastFu.followupDate || lastFu.createdAt || '')) {
                    lastFu = fu;
                }
            }
        }
        if (!lastFu) return '<td class="vl-date">\u2014</td>';
        var dateStr = lastFu.followupDate || lastFu.createdAt || '';
        if (dateStr) dateStr = dateStr.substring(0, 10);
        var formatted = dateStr ? (VT.Utils && VT.Utils.formatDate ? VT.Utils.formatDate(dateStr) : dateStr) : '\u2014';
        return '<td class="vl-date">' + formatted + '</td>';
    },

    renderNextFollowupCell: function(d) {
        var followups = VT.DataHub.getFollowups();
        var leadNo = d.leadNo || d.id || '';
        var nextFu = null;
        var now = new Date().toISOString().split('T')[0];
        for (var f = 0; f < followups.length; f++) {
            var fu = followups[f];
            if (fu.leadId === d.id || fu.leadNo === leadNo || fu.lead === d.id) {
                var fuStatus = (fu.status || 'pending').toLowerCase();
                if (fuStatus !== 'completed' && fuStatus !== 'cancelled') {
                    var fuDate = (fu.followupDate || fu.date || '').substring(0, 10);
                    if (fuDate && fuDate >= now) {
                        if (!nextFu || fuDate < (nextFu.followupDate || nextFu.date || '').substring(0, 10)) {
                            nextFu = fu;
                        }
                    }
                }
            }
        }
        if (!nextFu) return '<td class="vl-date">\u2014</td>';
        var dateStr = (nextFu.followupDate || nextFu.date || '').substring(0, 10);
        var formatted = dateStr ? (VT.Utils && VT.Utils.formatDate ? VT.Utils.formatDate(dateStr) : dateStr) : '\u2014';
        return '<td class="vl-date">' + formatted + '</td>';
    },

    switchSubtab: function(index) {
        var subtabs = document.querySelectorAll('.segmented-option');
        for (var i = 0; i < subtabs.length; i++) {
            subtabs[i].classList.toggle('active', i === index);
        }
        var statusMap = { 0: '', 1: 'archived', 2: 'deleted' };
        this.filterStatus = statusMap[index] || '';
        this.currentPage = 1;
        this.render();
        this._saveListState();
        this.updateBulkActionBar();
    },

    switchViewTab: function(tabId) {
        var tabs = document.querySelectorAll('[data-view-tab]');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].classList.toggle('active', tabs[i].getAttribute('data-tab') === tabId);
        }
        var sections = document.querySelectorAll('.vl-view-section');
        for (var j = 0; j < sections.length; j++) {
            sections[j].classList.toggle('active', sections[j].id === 'section-' + tabId);
        }
    },

    /* ===== Safe HTML escaping ===== */
    esc: function(str) {
        if (typeof VT !== 'undefined' && VT.Utils && VT.Utils.escapeHtml) {
            return VT.Utils.escapeHtml(str);
        }
        if (!str && str !== 0) return '';
        var d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    },

    init: function() {
        var page = document.body ? document.body.dataset.page : '';
        var knownPages = ['leads', 'vl-create', 'vl-view', 'vl-edit', 'vendor-bulk-upload', 'lead-pipeline'];
        if (knownPages.indexOf(page) === -1) return;
        this.load();
        if (page === 'leads') {
            this.initList();
            this.computeKPIs();
            this.renderKPIs();
        } else if (page === 'vl-create') this.initForm();
        else if (page === 'vl-view') this.initView();
        else if (page === 'vl-edit') this.initEdit();
        else if (page === 'vendor-bulk-upload') this.initBulkUpload();
        else if (page === 'lead-pipeline') this.initPipeline();
    },

    /* =========== DATA =========== */
    load: function() {
        this.data = VT.DataHub.getLeads();
        // PostgreSQL source of truth: refresh from API in background
        var self = this;
        VT.refreshLeadsFromApi().then(function(apiData) {
            if (apiData && apiData.length > 0) {
                self.data = apiData;
                var page = document.body ? document.body.dataset.page : '';
                if (page === 'leads' || page === 'lead-pipeline') {
                    self.computeKPIs();
                    self.renderKPIs();
                    self.render();
                    self.updateTabCounts();
                }
            }
        });
    },

    save: function() {
        VT.DataHub.saveLeads(this.data);
        VT.refresh('leads');
    },

    getNextId: function() {
        var max = 0;
        for (var i = 0; i < this.data.length; i++) {
            var id = this.data[i].id || '';
            // Support both LEAD-000001 and LEAD-2026-000001 formats
            var m = id.match(/^LEAD-(?:\d{4}-)?(\d{6})$/);
            if (m) { var n = parseInt(m[1], 10); if (n > max) max = n; }
        }
        return 'LEAD-' + String(max + 1).padStart(6, '0');
    },

    /* ===== VT.CRUD Integration ===== */
    getCRUD: function() {
        if (!this._crud && typeof VT.CRUD !== 'undefined') {
            this._crud = VT.CRUD.create({ storageKey: 'vt_leads', idPrefix: 'LEAD' });
        }
        return this._crud;
    },

    crudSave: function(record) {
        try { var crud = this.getCRUD(); if (crud) { crud.save(record); VT.refresh('leads'); return; } } catch(e) {}
        if (record.id) {
            for (var i = 0; i < this.data.length; i++) {
                if (this.data[i].id === record.id) { this.data[i] = record; break; }
            }
        } else { this.data.push(record); }
        this.save();
        VT.refresh('leads');
    },

    crudDelete: function(id) {
        try { var crud = this.getCRUD(); if (crud) { crud.delete(id, true); this.load(); this.render(); VT.refresh('leads'); return; } } catch(e) {}
        for (var i = 0; i < this.data.length; i++) {
            if (this.data[i].id === id) { this.data[i].status = 'deleted'; break; }
        }
        this.save(); this.render();
    },

    getNextLeadNo: function() {
        var max = 0;
        for (var i = 0; i < this.data.length; i++) {
            var ln = this.data[i].leadNo || '';
            // Support both LEAD-000001 and LEAD-2026-000001 formats
            var m = ln.match(/^LEAD-(?:\d{4}-)?(\d{6})$/);
            if (m) { var n = parseInt(m[1], 10); if (n > max) max = n; }
        }
        return 'LEAD-' + String(max + 1).padStart(6, '0');
    },

    /* =========== KPI COMPUTATION =========== */
    kpis: {},

    computeKPIs: function() {
        var totalLeads = 0, newLeads = 0, qualified = 0, proposalSent = 0, won = 0, lost = 0;
        var todayFu = 0, overdueFu = 0;
        var today = new Date();
        var todayStr = today.toISOString().split('T')[0];

        var followups = [];
        followups = VT.DataHub.getFollowups();

        for (var i = 0; i < this.data.length; i++) {
            var d = this.data[i];
            if (d.status === 'deleted' || d.status === 'archived') continue;
            totalLeads++;

            var stage = (d.stage || 'new').toLowerCase();

            if (stage === 'new' || stage === '' || !d.stage) newLeads++;
            else if (stage === 'qualified') qualified++;
            else if (stage === 'proposal sent' || stage === 'proposal') proposalSent++;
            else if (stage === 'won') won++;
            else if (stage === 'lost') lost++;

            var leadNo = d.leadNo || d.id || '';
            for (var f = 0; f < followups.length; f++) {
                var fu = followups[f];
                if (fu.leadId === d.id || fu.leadNo === leadNo || fu.lead === d.id) {
                    var fuDate = (fu.date || fu.followupDate || fu.nextFollowup || '').substring(0, 10);
                    var fuStatus = (fu.status || 'pending').toLowerCase();
                    if (fuStatus !== 'completed') {
                        if (fuDate && fuDate < todayStr) overdueFu++;
                        else if (fuDate === todayStr) todayFu++;
                    }
                }
            }
        }

        this.kpis = {
            totalLeads: totalLeads,
            newLeads: newLeads,
            qualified: qualified,
            proposalSent: proposalSent,
            won: won,
            lost: lost,
            todayFollowups: todayFu,
            overdueFollowups: overdueFu
        };
    },

    renderKPIs: function() {
        var grid = document.getElementById('leadKpiGrid');
        if (!grid) return;
        var k = this.kpis;
        var cards = [
            { icon: 'fa-users', label: 'Total Leads', value: k.totalLeads, color: '#0B4A3D' },
            { icon: 'fa-star', label: 'New', value: k.newLeads, color: '#6b7280' },
            { icon: 'fa-check-circle', label: 'Qualified', value: k.qualified, color: '#065f46' },
            { icon: 'fa-file-invoice', label: 'Proposal Sent', value: k.proposalSent, color: '#d97706' },
            { icon: 'fa-trophy', label: 'Won', value: k.won, color: '#059669' },
            { icon: 'fa-times-circle', label: 'Lost', value: k.lost, color: '#ef4444' },
            { icon: 'fa-phone', label: "Today's Follow-ups", value: k.todayFollowups, color: '#f59e0b' },
            { icon: 'fa-exclamation-triangle', label: 'Overdue Follow-ups', value: k.overdueFollowups, color: '#dc2626' }
        ];
        var html = '';
        for (var i = 0; i < cards.length; i++) {
            var card = cards[i];
            html += '<div class="kpi-card" onclick="VT.Leads.filterByKPI(\'' + card.label.toLowerCase().replace(/[^a-z]/g,'') + '\')">' +
                '<div class="kpi-icon" style="background:' + card.color + '15;color:' + card.color + '">' +
                '<i class="fas ' + card.icon + '"></i></div>' +
                '<div class="kpi-info"><div class="kpi-value">' + card.value + '</div>' +
                '<div class="kpi-label">' + card.label + '</div></div></div>';
        }
        grid.innerHTML = html;
    },

    filterByKPI: function(key) {
        var stageMap = {
            'totalleads': '',
            'new': 'new',
            'qualified': 'qualified',
            'proposalsent': 'proposal sent',
            'won': 'won',
            'lost': 'lost'
        };
        this.filterStage = stageMap[key] || '';
        this.filterStatus = '';
        this.currentPage = 1;
        this.render();
        var stageSel = document.getElementById('filterStage');
        if (stageSel) stageSel.value = this.filterStage;
        this._saveListState();
    },

    _saveListState: function() {
        var state = {
            searchQuery: this.searchQuery || '',
            currentPage: this.currentPage || 1,
            sortField: this.sortField || null,
            sortDir: this.sortDir || 'asc',
            filterStatus: this.filterStatus || '',
            filterStage: this.filterStage || '',
            filterSource: this.filterSource || ''
        };
        if (typeof VT !== 'undefined' && VT.ViewState) {
            VT.ViewState.saveUserViewState('leads-list', state);
        } else {
            try { localStorage.setItem('vt_leads_list_state', JSON.stringify(state)); } catch(e) {}
        }
    },

    _restoreListState: function() {
        var state = null;
        if (typeof VT !== 'undefined' && VT.ViewState) {
            state = VT.ViewState.loadUserViewState('leads-list');
        } else {
            try { state = JSON.parse(localStorage.getItem('vt_leads_list_state')); } catch(e) {}
        }
        if (!state) state = {};
        if (state.searchQuery) { this.searchQuery = state.searchQuery; var si = document.getElementById('vlSearchInput'); if (si) si.value = state.searchQuery; }
        if (state.currentPage) { this.currentPage = state.currentPage; }
        if (state.sortField) { this.sortField = state.sortField; }
        if (state.sortDir) { this.sortDir = state.sortDir; }
        if (state.filterStatus) { this.filterStatus = state.filterStatus; }
        if (state.filterStage) { this.filterStage = state.filterStage; var ss = document.getElementById('filterStage'); if (ss) ss.value = state.filterStage; }
        if (state.filterSource) { this.filterSource = state.filterSource; var ss2 = document.getElementById('filterSource'); if (ss2) ss2.value = state.filterSource; }
    },

    _restoreSubtabUI: function() {
        var subtabs = document.querySelectorAll('.segmented-option');
        var tabMap = { '': 0, archived: 1, deleted: 2 };
        var activeIdx = tabMap[this.filterStatus] || 0;
        for (var i = 0; i < subtabs.length; i++) subtabs[i].classList.toggle('active', i === activeIdx);
    },

    /* =========== LIST PAGE =========== */
    initList: function() {
        var self = this;
        VT.ColumnManager.init('vlTable', {
            storageKey: 'vt_leads_cols',
            stickyColumns: ['Actions']
        });
        this._restoreListState();
        this.initExport();
        this._initClickDelegation();
        this.initSearch();
        this.populateOwnerFilter();
        this.populateSourceFilter();
        this.initFilters();
        this._restoreSubtabUI();
        this.render();
        var createBtn = document.getElementById('vlCreateBtn');
        if (createBtn) {
            createBtn.addEventListener('click', function(e) {
                e.preventDefault();
                var menu = document.getElementById('vlCreateMenu');
                if (menu) menu.classList.toggle('show');
            });
            document.addEventListener('click', function(e) {
                var menu = document.getElementById('vlCreateMenu');
                if (menu && !e.target.closest('.vl-create-dropdown')) menu.classList.remove('show');
            });
        }
        document.addEventListener('VT:DataSeeded', function onSeed() {
            self.load();
            if (self.data.length > 0) {
                document.removeEventListener('VT:DataSeeded', onSeed);
                self.computeKPIs();
                self.renderKPIs();
                self.render();
            }
        });
    },

    _initClickDelegation: function() {
        if (this._clickDelegationInitialized) return;
        this._clickDelegationInitialized = true;
        var self = this;

        document.addEventListener('click', function(e) {
            var target = e.target;

            // Safe action menu (safe-menu pattern from clients.js)
            var menuBtn = target.closest('[data-safe-menu]');
            if (menuBtn) {
                self._toggleSafeMenu(menuBtn);
                return;
            }

            var safeItem = target.closest('.safe-menu-item');
            if (safeItem) {
                var action = safeItem.getAttribute('data-safe-action');
                var payload = safeItem.getAttribute('data-safe-payload');
                self._executeSafeAction(action, payload);
                var sm = safeItem.closest('.safe-action-menu');
                if (sm) sm.remove();
                return;
            }

            // Export actions
            var exportLink = target.closest('[data-export-action]');
            if (exportLink) {
                e.preventDefault();
                if (typeof VT !== 'undefined' && VT.Export && VT.Export.closeDD) VT.Export.closeDD('leadsExportMenu');
                var fmt = exportLink.getAttribute('data-export-action');
                if (fmt) self.doExport(fmt);
                return;
            }

            // Stage change in view
            var stageBtn = target.closest('[data-stage-action]');
            if (stageBtn) {
                var leadId = stageBtn.getAttribute('data-lead-id');
                var newStage = stageBtn.getAttribute('data-stage');
                if (leadId && newStage) {
                    self.changeStage(leadId, newStage);
                }
                return;
            }

            // View tab switch
            var viewTab = target.closest('[data-view-tab]');
            if (viewTab) {
                var tabId = viewTab.getAttribute('data-tab');
                if (tabId) self.switchViewTab(tabId);
                return;
            }
        });
    },

    _safeActionMenu: function(items) {
        var encoded = encodeURIComponent(JSON.stringify(items));
        return '<div class="action-menu-wrap"><button type="button" class="action-menu-btn" data-safe-menu="' + encoded + '"><i class="fas fa-ellipsis-v"></i></button></div>';
    },

    _toggleSafeMenu: function(btn) {
        var existing = document.querySelector('.safe-action-menu');
        if (existing) existing.remove();

        var raw = btn.getAttribute('data-safe-menu');
        if (!raw) return;
        var items = JSON.parse(decodeURIComponent(raw));

        var menu = document.createElement('div');
        menu.className = 'safe-action-menu';
        menu.style.cssText = 'position:fixed;background:#fff;border:1px solid #e5e7eb;border-radius:10px;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1),0 4px 6px -2px rgba(0,0,0,0.05);z-index:1000;min-width:200px;max-height:400px;overflow-y:auto;padding:4px';

        for (var i = 0; i < items.length; i++) {
            var it = items[i];
            if (it.heading) {
                var hd = document.createElement('div');
                hd.className = 'action-menu-heading';
                hd.textContent = it.label;
                menu.appendChild(hd);
            } else if (it.divider) {
                var dv = document.createElement('div');
                dv.className = 'menu-divider';
                menu.appendChild(dv);
            } else {
                var bt = document.createElement('button');
                bt.type = 'button';
                bt.className = 'safe-menu-item action-item' + (it.className ? ' ' + it.className : '');
                bt.setAttribute('data-safe-action', it.action || '');
                bt.setAttribute('data-safe-payload', it.payload || '');
                if (it.icon) {
                    var ic = document.createElement('i');
                    ic.className = 'fas ' + it.icon;
                    bt.appendChild(ic);
                }
                var sp = document.createElement('span');
                sp.textContent = it.label;
                bt.appendChild(sp);
                menu.appendChild(bt);
            }
        }

        var rect = btn.getBoundingClientRect();
        var menuW = Math.min(240, window.innerWidth - 16);
        var menuH = Math.min(400, Math.max(200, items.length * 42));
        var margin = 8;

        // Calculate horizontal position — prefer right-aligned, flip to left if needed
        var leftPos = rect.right - menuW;
        if (leftPos < margin) leftPos = margin;
        if (leftPos + menuW > window.innerWidth - margin) {
            leftPos = Math.max(margin, rect.left - menuW);
            // If still overflows, align to left edge
            if (leftPos < margin) leftPos = margin;
        }

        // Calculate vertical position — prefer below, flip above if needed
        var spaceBelow = window.innerHeight - rect.bottom - margin;
        var spaceAbove = rect.top - margin;
        var topPos = rect.bottom + margin;
        var useBottom = false;

        if (spaceBelow < menuH && spaceAbove > spaceBelow) {
            // Open above
            topPos = rect.top - menuH;
            useBottom = true;
        }

        // Ensure menu doesn't overflow viewport top
        if (topPos < margin) {
            topPos = margin;
            useBottom = false;
            menu.style.maxHeight = (window.innerHeight - margin * 2) + 'px';
        }

        menu.style.left = leftPos + 'px';
        if (useBottom) {
            menu.style.top = '';
            menu.style.bottom = (window.innerHeight - rect.top + margin) + 'px';
        } else {
            menu.style.top = topPos + 'px';
            menu.style.bottom = '';
        }

        document.body.appendChild(menu);

        var _closeHandler = function(e2) {
            if (!menu.contains(e2.target) && e2.target !== btn) {
                menu.remove();
                document.removeEventListener('click', _closeHandler, true);
                document.removeEventListener('keydown', _escHandler);
            }
        };
        setTimeout(function() {
            document.addEventListener('click', _closeHandler, true);
        }, 10);

        var _escHandler = function(e) {
            if (e.key === 'Escape') {
                menu.remove();
                document.removeEventListener('keydown', _escHandler);
                document.removeEventListener('click', _closeHandler, true);
            }
        };
        document.addEventListener('keydown', _escHandler);
    },

    _executeSafeAction: function(action, payload) {
        var self = this;
        switch (action) {
            case 'view-lead': window.location.href = 'lead-overview.html?id=' + encodeURIComponent(payload); break;
            case 'edit-lead': window.location.href = 'vl-edit.html?id=' + encodeURIComponent(payload); break;
            case 'delete-lead': self.deleteLead(payload); break;
            case 'create-followup': self.createFollowupNav(payload); break;
            case 'view-followups': self.viewFollowupsNav(payload); break;
            case 'convert-cpr': self.convertToCPR(payload); break;
            case 'convert-client': self.convertToClient(payload); break;
            case 'pipeline': self.moveToPipeline(payload); break;
            case 'change-stage': self.showMoveStageModal(payload); break;
            case 'duplicate': self.duplicateLead(payload); break;
            case 'archive': self.toggleArchive(payload); break;
            case 'restore-lead': self.restoreLead(payload); break;
            case 'permanent-delete': self.permanentDeleteLead(payload); break;
            case 'log-call': self.logCall(payload); break;
            case 'send-email': self.sendEmail(payload); break;
            case 'add-note': self.addNote(payload); break;
            case 'upload-attachment': self.uploadAttachment(payload); break;
            case 'assign-owner': self.showAssignOwnerModal(payload); break;
            case 'change-priority': self.showChangePriorityModal(payload); break;
            case 'generate-pdf': self.generatePDF(payload); break;
            case 'export-lead': self.exportLead(payload); break;
            case 'create-quotation': self.createQuotation(payload); break;
            case 'create-sales-order': self.createSalesOrder(payload); break;
            default: break;
        }
    },

    initSearch: function() {
        var self = this;
        var input = document.getElementById('vlSearchInput');
        if (!input) return;
        if (typeof VT.Search !== 'undefined') {
            VT.Search.init(input, {
                onSearch: function(query) {
                    self.searchQuery = query.toLowerCase().trim();
                    self.currentPage = 1;
                    self.render();
                    self._saveListState();
                },
                debounce: 300,
                placeholder: input.placeholder || 'Search leads...'
            });
        } else {
            input.addEventListener('input', function() {
                self.searchQuery = this.value.toLowerCase().trim();
                self.currentPage = 1;
                self.render();
                self._saveListState();
            });
        }
    },

    initFilters: function() {
        var self = this;
        var filterKey = 'vt_leads_filters';
        var filterMap = {
            filterStatus: 'filterStatus',
            filterStage: 'filterStage',
            filterSource: 'filterSource',
            filterPriority: 'filterPriority',
            filterOwner: 'filterOwner',
            filterDateFrom: 'filterDateFrom',
            filterDateTo: 'filterDateTo'
        };

        // Restore saved filters
        var saved = {};
        if (typeof VT !== 'undefined' && VT.ViewState) {
            saved = VT.ViewState.loadUserViewState('leads-filters') || {};
        } else {
            try { saved = JSON.parse(localStorage.getItem(filterKey)) || {}; } catch(e) {}
        }
        for (var k in filterMap) {
            var el = document.getElementById(filterMap[k]);
            if (!el) continue;
            if (saved[k]) {
                el.value = saved[k];
                self[k] = saved[k];
            }
            (function(k2, el2) {
                el2.addEventListener('change', function() {
                    self[k2] = this.value;
                    self.currentPage = 1;
                    self.render();
                    // Persist filters
                    var filters = {};
                    for (var kk in filterMap) filters[kk] = self[kk];
                    if (typeof VT !== 'undefined' && VT.ViewState) {
                        VT.ViewState.saveUserViewState('leads-filters', filters);
                    } else {
                        try { localStorage.setItem(filterKey, JSON.stringify(filters)); } catch(e) {}
                    }
                    self._saveListState();
                });
            })(k, el);
        }

        var clearBtn = document.getElementById('filterClear');
        if (clearBtn) {
            clearBtn.addEventListener('click', function() {
                for (var k in filterMap) {
                    var el = document.getElementById(filterMap[k]);
                    if (el) el.value = '';
                    self[k] = '';
                }
                self.searchQuery = '';
                var searchInput = document.getElementById('vlSearchInput');
                if (searchInput) searchInput.value = '';
                self.currentPage = 1;
                self.render();
                if (typeof VT !== 'undefined' && VT.ViewState) {
                    VT.ViewState.saveUserViewState('leads-filters', {});
                } else {
                    try { localStorage.removeItem(filterKey); } catch(e) {}
                }
                self._saveListState();
            });
        }
    },

    toggleFilters: function(btn) {
        var el = document.getElementById('filterPanel');
        if (!el) return;
        el.classList.toggle('show');
        if (btn) btn.innerHTML = el.classList.contains('show') ? '<i class="fas fa-filter"></i> Hide Filters' : '<i class="fas fa-filter"></i> Show Filters';
    },

    getFiltered: function() {
        var self = this;
        var result = [];
        var currentTab = this.filterStatus; // '' = active, 'archived', 'deleted'
        
        for (var i = 0; i < this.data.length; i++) {
            var d = this.data[i];
            
            // Subtab filtering
            if (currentTab === 'deleted') {
                if (d.status !== 'deleted') continue;
            } else if (currentTab === 'archived') {
                if (d.status !== 'archived') continue;
            } else {
                // Active tab: skip archived and deleted
                if (d.status === 'archived' || d.status === 'deleted') continue;
            }

            // Search across all fields
            if (this.searchQuery) {
                var q = this.searchQuery.toLowerCase();
                var searchFields = [d.leadNo, d.name, d.company, d.phone, d.email, d.contactPerson, d.id, d.notes, d.requirement, d.address, d.source, d.industry, d.assignee, d.website];
                var found = false;
                for (var s = 0; s < searchFields.length; s++) {
                    if (searchFields[s] && String(searchFields[s]).toLowerCase().indexOf(q) !== -1) { found = true; break; }
                }
                if (!found) continue;
            }

            // Filters (only apply to non-subtab filter values)
            if (this.filterStage && (d.stage || '').toLowerCase() !== this.filterStage.toLowerCase()) continue;
            if (this.filterSource && d.source !== this.filterSource) continue;
            if (this.filterPriority && (d.priority || '').toLowerCase() !== this.filterPriority.toLowerCase()) continue;
            if (this.filterOwner && (d.assignee || '') !== this.filterOwner) continue;
            if (this.filterDateFrom && d.createdAt && d.createdAt < this.filterDateFrom) continue;
            if (this.filterDateTo && d.createdAt && d.createdAt > this.filterDateTo + 'T23:59:59') continue;

            result.push(d);
        }

        // Sort
        if (this.sortField) {
            result.sort(function(a, b) {
                var av = (a[self.sortField] !== undefined && a[self.sortField] !== null) ? a[self.sortField].toString().toLowerCase() : '';
                var bv = (b[self.sortField] !== undefined && b[self.sortField] !== null) ? b[self.sortField].toString().toLowerCase() : '';
                if (self.sortDir === 'asc') return av < bv ? -1 : av > bv ? 1 : 0;
                else return av > bv ? -1 : av < bv ? 1 : 0;
            });
        }
        return result;
    },

    render: function() {
        var tbody = document.getElementById('vlTableBody');
        if (!tbody) return;

        var filtered = this.getFiltered();
        var totalPages = Math.ceil(filtered.length / this.pageSize) || 1;
        if (this.currentPage > totalPages) this.currentPage = totalPages;
        var start = (this.currentPage - 1) * this.pageSize;
        var pageData = filtered.slice(start, start + this.pageSize);
        var self = this;

        var allThs = document.querySelectorAll('#vlTable thead th[data-sort]');
        for (var s = 0; s < allThs.length; s++) {
            allThs[s].classList.remove('sort-asc', 'sort-desc');
            var key = allThs[s].getAttribute('data-sort');
            if (key === this.sortField) {
                allThs[s].classList.add('sort-' + this.sortDir);
            }
        }

        var html = '';
        if (pageData.length === 0) {
            var currentTab = this.filterStatus;
            if (currentTab === 'deleted') {
                html = '<tr><td colspan="20"><div class="deleted-empty-state"><i class="fas fa-trash-undo"></i><h3>No Deleted Leads</h3><p>Your trash is empty. Deleted leads will appear here.</p><button class="btn btn-primary" onclick="VT.Leads.switchSubtab(0)"><i class="fas fa-arrow-left"></i> Back to Active Leads</button></div></td></tr>';
            } else if (currentTab === 'archived') {
                html = '<tr><td colspan="20"><div class="deleted-empty-state"><i class="fas fa-archive"></i><h3>No Archived Leads</h3><p>' + (this.searchQuery ? 'No archived leads matching your search criteria.' : 'Archived leads will appear here.') + '</p>' + (this.searchQuery ? '' : '<button class="btn btn-primary" onclick="VT.Leads.switchSubtab(0)"><i class="fas fa-arrow-left"></i> Back to Active Leads</button>') + '</div></td></tr>';
            } else {
                var emptyIcon = this.searchQuery ? 'fa-search' : 'fa-user-plus';
                var emptyTitle = this.searchQuery ? 'No Matching Leads' : 'No Leads Found';
                var emptyMsg = this.searchQuery
                    ? 'No leads matching your search criteria. Try adjusting your filters or search terms.'
                    : 'Create your first lead to start tracking opportunities and build your sales pipeline.';
                var emptyAction = this.searchQuery
                    ? '<button class="btn btn-ghost btn-sm" onclick="var i=document.getElementById(\'vlSearchInput\');if(i){i.value=\'\';VT.Leads.searchQuery=\'\';VT.Leads.render()}"><i class="fas fa-times"></i> Clear Search</button>'
                    : '<a href="vl-create.html" class="erp-btn-primary"><span class="erp-btn-icon"><i class="fas fa-plus"></i></span> Add Lead</a>';
                html = '<tr><td colspan="20"><div class="vl-empty-state"><i class="fas ' + emptyIcon + '"></i><h3>' + emptyTitle + '</h3><p>' + emptyMsg + '</p>' + emptyAction + '</div></td></tr>';
            }
        } else {
            for (var i = 0; i < pageData.length; i++) {
                var d = pageData[i];
                html += '<tr data-id="' + d.id + '">';
                html += '<td class="checkbox-cell"><input type="checkbox" class="vl-checkbox" value="' + d.id + '"></td>';
                html += '<td class="vl-name col-doc-id"><a href="lead-overview.html?id=' + d.id + '">' + this.esc(d.leadNo || d.id) + '</a></td>';
                html += '<td class="vl-name"><a href="lead-overview.html?id=' + d.id + '">' + this.esc(d.company || '-') + '</a></td>';
                html += '<td>' + this.esc(d.name || d.contactPerson || '-') + '</td>';
                html += '<td>' + this.esc(d.phone || '-') + '</td>';
                html += '<td>' + this.esc(d.email || '-') + '</td>';
                html += '<td>' + this.esc(d.industry || '-') + '</td>';
                html += '<td>' + this.esc(d.source || '-') + '</td>';
                html += '<td>' + this.stageBadge(d.stage || 'new') + '</td>';
                html += '<td>' + this.esc(d.assignee || d.leadOwner || '-') + '</td>';
                html += '<td>' + this.priorityBadge(d.priority || 'medium') + '</td>';
                html += '<td>' + this.formatCurrency(d.expectedValue || d.expectedRevenue || 0) + '</td>';
                html += this.renderLastFollowupCell(d);
                html += this.renderNextFollowupCell(d);
                html += '<td>' + VT.Utils.statusBadge(d.status || 'new') + '</td>';
                html += '<td class="row-actions">' + this.renderActionsMenu(d) + '</td>';
                html += '</tr>';
            }
        }
        tbody.innerHTML = html;
        this.renderPagination(filtered.length, totalPages);
        this.computeKPIs();
        this.renderKPIs();
        this.updateTabCounts();
        this.updateBulkActionBar();
        VT.ColumnManager.apply('vlTable');
    },

    renderActionsMenu: function(d) {
        // Deleted tab: Restore + Permanent Delete only
        if (d.status === 'deleted') {
            return this._safeActionMenu([
                { label: 'Restore Lead', icon: 'fa-undo', action: 'restore-lead', payload: d.id },
                { label: 'Permanent Delete', icon: 'fa-times-circle', className: 'text-danger', action: 'permanent-delete', payload: d.id }
            ]);
        }
        
        // Archived tab: View, Edit, Restore, Delete
        if (d.status === 'archived') {
            var items = [
                { heading: true, label: 'LEAD' },
                { label: 'View Lead', icon: 'fa-eye', action: 'view-lead', payload: d.id },
                { label: 'Edit Lead', icon: 'fa-pen', action: 'edit-lead', payload: d.id },
                { divider: true },
                { heading: true, label: 'STATUS' },
                { label: 'Restore to Active', icon: 'fa-undo', action: 'restore-lead', payload: d.id },
                { label: 'Delete', icon: 'fa-trash', className: 'text-danger', action: 'delete-lead', payload: d.id }
            ];
            return this._safeActionMenu(items);
        }
        
        // Active tab: Full menu
        var stageForSO = (d.stage || '').toLowerCase();
        var items = [
            { heading: true, label: 'LEAD' },
            { label: 'View Lead', icon: 'fa-eye', action: 'view-lead', payload: d.id },
            { label: 'Edit Lead', icon: 'fa-pen', action: 'edit-lead', payload: d.id },
            { divider: true },
            { heading: true, label: 'COMMUNICATION' },
            { label: 'Add Follow-up', icon: 'fa-phone', action: 'create-followup', payload: d.id },
            { label: 'Log Call', icon: 'fa-phone-alt', action: 'log-call', payload: d.id },
            { label: 'Send Email', icon: 'fa-envelope', action: 'send-email', payload: d.id },
            { label: 'Add Note', icon: 'fa-sticky-note', action: 'add-note', payload: d.id },
            { label: 'Upload Attachment', icon: 'fa-paperclip', action: 'upload-attachment', payload: d.id },
            { divider: true },
            { heading: true, label: 'PIPELINE' },
            { label: 'Move Stage', icon: 'fa-tag', action: 'change-stage', payload: d.id },
            { label: 'Assign Owner', icon: 'fa-user-cog', action: 'assign-owner', payload: d.id },
            { label: 'Change Priority', icon: 'fa-flag', action: 'change-priority', payload: d.id },
            { divider: true },
            { heading: true, label: 'DOCUMENTS' },
            { label: 'Generate PDF', icon: 'fa-file-pdf', action: 'generate-pdf', payload: d.id },
            { label: 'Export', icon: 'fa-download', action: 'export-lead', payload: d.id },
            { divider: true },
            { heading: true, label: 'CONVERSION' }
        ];
        if (d.status !== 'converted' && (d.stage === 'qualified' || d.stage === 'won' || d.stage === 'negotiation')) {
            items.push({ label: 'Convert to Client', icon: 'fa-user-tie', action: 'convert-client', payload: d.id });
        }
        items.push(
            { label: 'Create CPR', icon: 'fa-clipboard-list', action: 'convert-cpr', payload: d.id },
            { label: 'Create Quotation', icon: 'fa-file-invoice', action: 'create-quotation', payload: d.id }
        );
        if (stageForSO === 'won') {
            items.push({ label: 'Create Sales Order', icon: 'fa-cart-shopping', action: 'create-sales-order', payload: d.id });
        }
        items.push(
            { divider: true },
            { heading: true, label: 'STATUS' },
            { label: 'Archive', icon: 'fa-archive', action: 'archive', payload: d.id },
            { label: 'Delete', icon: 'fa-trash', className: 'text-danger', action: 'delete-lead', payload: d.id }
        );
        return this._safeActionMenu(items);
    },

    renderPagination: function(total, totalPages) {
        var self = this;
        VT.Pagination.render({
            container: 'vlPagination',
            currentPage: this.currentPage,
            totalPages: totalPages,
            total: total,
            pageSize: this.pageSize,
            pageSizeOptions: [10, 25, 50, 100],
            onPageChange: function(page) {
                self.currentPage = page;
                self.render();
            },
            onPageSizeChange: function(size) {
                self.pageSize = size;
                self.currentPage = 1;
                self.render();
            }
        });
    },

    sort: function(field) {
        if (this.sortField === field) { this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'; }
        else { this.sortField = field; this.sortDir = 'asc'; }
        this.render();
        this._saveListState();
    },

    /* ===== SAFE-ACTION HANDLERS ===== */
    deleteLead: function(id) {
        var self = this;
        if (typeof VT.Confirm !== 'undefined') {
            VT.Confirm.show({
                title: 'Delete Lead',
                message: 'This lead will be moved to trash.',
                confirmText: 'Delete',
                type: 'danger',
                onConfirm: function() {
                    for (var i = 0; i < self.data.length; i++) {
                        if (self.data[i].id === id) { self.data[i].status = 'deleted'; break; }
                    }
                    self.save();
                    self.addActivity(id, 'Lead moved to trash');
                    self.render();
                    VT.Utils.showToast('Lead moved to trash', 'success');
                    VT.refresh('leads')
                }
            });
        } else {
            if (!confirm('Delete this lead? It will be moved to trash.')) return;
            for (var i = 0; i < this.data.length; i++) {
                if (this.data[i].id === id) { this.data[i].status = 'deleted'; break; }
            }
            this.save();
            this.addActivity(id, 'Lead moved to trash');
            this.render();
            VT.Utils.showToast('Lead moved to trash', 'success');
        }
    },

    duplicateLead: function(id) {
        for (var i = 0; i < this.data.length; i++) {
            if (this.data[i].id === id) {
                var copy = JSON.parse(JSON.stringify(this.data[i]));
                copy.id = this.getNextId();
                copy.leadNo = this.getNextLeadNo();
                copy.status = 'new';
                copy.stage = 'new';
                copy.createdAt = new Date().toISOString();
                copy.updatedAt = '';
                delete copy.convertedToCPR;
                if (copy.attachments) delete copy.attachments;
                this.data.push(copy);
                this.save();
                this.render();
                VT.Utils.showToast('Lead duplicated', 'success');
                return;
            }
        }
    },

    toggleArchive: function(id) {
        for (var i = 0; i < this.data.length; i++) {
            if (this.data[i].id === id) {
                this.data[i].status = this.data[i].status === 'archived' ? 'new' : 'archived';
                break;
            }
        }
        this.save(); this.render();
        VT.Utils.showToast('Lead status updated', 'success');
        try { document.dispatchEvent(new CustomEvent('VT:DataUpdated', { bubbles: true, detail: { module: 'leads' } })); } catch(e) {}
    },

    restoreLead: function(id) {
        var self = this;
        if (typeof VT.Confirm !== 'undefined') {
            VT.Confirm.show({
                title: 'Restore Lead',
                message: 'This lead will be restored to Active.',
                confirmText: 'Restore',
                type: 'primary',
                onConfirm: function() {
                    self._doRestoreLead(id);
                }
            });
        } else {
            if (!confirm('Restore this lead to Active?')) return;
            self._doRestoreLead(id);
        }
    },

    _doRestoreLead: function(id) {
        for (var i = 0; i < this.data.length; i++) {
            if (this.data[i].id === id) {
                this.data[i].status = 'new';
                this.data[i].updatedAt = new Date().toISOString();
                delete this.data[i].deletedAt;
                break;
            }
        }
        this.save();
        this.render();
        this.clearSelection();
        VT.Utils.showToast('Lead restored to Active', 'success');
        try { document.dispatchEvent(new CustomEvent('VT:DataUpdated', { bubbles: true, detail: { module: 'leads' } })); } catch(e) {}
    },

    permanentDeleteLead: function(id) {
        var self = this;
        if (typeof VT.Confirm !== 'undefined') {
            VT.Confirm.show({
                title: 'Delete Permanently?',
                message: 'This action cannot be undone. The lead will be permanently removed.',
                confirmText: 'Delete Permanently',
                type: 'danger',
                onConfirm: function() {
                    self._doPermanentDeleteLead(id);
                }
            });
        } else {
            if (!confirm('Permanently delete this lead? This cannot be undone.')) return;
            self._doPermanentDeleteLead(id);
        }
    },

    _doPermanentDeleteLead: function(id) {
        for (var i = this.data.length - 1; i >= 0; i--) {
            if (this.data[i].id === id) {
                this.data.splice(i, 1);
                break;
            }
        }
        this.save();
        this.render();
        this.clearSelection();
        VT.Utils.showToast('Lead permanently deleted', 'success');
        try { document.dispatchEvent(new CustomEvent('VT:DataUpdated', { bubbles: true, detail: { module: 'leads' } })); } catch(e) {}
    },

    createFollowupNav: function(leadId) {
        var lead = this.getLeadById(leadId);
        var name = lead ? (lead.name || lead.contactPerson || '') : '';
        window.location.href = 'followup-create.html?leadId=' + encodeURIComponent(leadId) + '&customer=' + encodeURIComponent(name);
    },

    viewFollowupsNav: function(leadId) {
        window.location.href = 'lead-overview.html?id=' + encodeURIComponent(leadId) + '#followups';
    },

    moveToPipeline: function(leadId) {
        window.location.href = 'lead-pipeline.html?id=' + encodeURIComponent(leadId);
    },

    changeStage: function(id, newStage) {
        for (var i = 0; i < this.data.length; i++) {
            if (this.data[i].id === id) {
                this.data[i].stage = newStage;
                this.data[i].updatedAt = new Date().toISOString();
                this.save();
                this.addActivity(id, 'Stage changed to "' + newStage + '"');
                this.render();
                VT.Utils.showToast('Stage updated to "' + newStage.charAt(0).toUpperCase() + newStage.slice(1) + '"', 'success');
                return;
            }
        }
    },

    getLeadById: function(id) {
        for (var i = 0; i < this.data.length; i++) {
            if (this.data[i].id === id) return this.data[i];
        }
        return null;
    },

    /* ===== CONVERT TO CPR ===== */
    convertToCPR: function(id) {
        this.load();
        var lead = null;
        for (var i = 0; i < this.data.length; i++) {
            if (this.data[i].id === id) { lead = this.data[i]; break; }
        }
        if (!lead) { VT.Utils.showToast('Lead not found', 'danger'); return; }

        var cprs = VT.DataHub.getPurchaseRequests();
        var cprId = 'CPR-' + new Date().getFullYear() + '-' + String(cprs.length + 1).padStart(6, '0');
        var cpr = {
            id: cprId, cprNo: cprId, cprDate: new Date().toISOString().split('T')[0],
            customerName: lead.name || '', companyName: lead.company || '',
            contactPerson: lead.name || '', mobile: lead.phone || '', email: lead.email || '',
            address: lead.address || '', industry: lead.industry || '',
            source: lead.source || 'Lead Conversion', assignedExecutive: lead.assignee || 'Admin',
            requirementSummary: lead.requirement || '', items: [],
            expectedOrderValue: lead.expectedValue || 0, expectedValue: lead.expectedValue || 0,
            priority: lead.priority || 'Medium', status: 'Open',
            remarks: 'Converted from lead: ' + (lead.leadNo || lead.id),
            attachments: [], createdAt: new Date().toISOString(), costWorkoutId: null,
            convertedToQuotation: null, leadSource: lead.id, leadNo: lead.leadNo || lead.id
        };
        cprs.push(cpr);
        VT.DataHub.savePurchaseRequests(cprs);

        // Mark lead as converted
        lead.status = 'converted';
        lead.stage = 'won';
        lead.convertedToCPR = cprId;
        this.save();
        this.addActivity(id, 'Lead converted to CPR: ' + cprId);

        // Dispatch dashboard update
        try { document.dispatchEvent(new CustomEvent('VT:DataUpdated', { bubbles: true, detail: { module: 'leads' } })); } catch(e) {}

        VT.Utils.showToast('Lead converted to CPR: ' + cprId, 'success');
        if (confirm('Open the new CPR?')) {
            window.location.href = 'pr-view.html?id=' + encodeURIComponent(cprId);
        } else {
            this.render();
        }
    },

    /* ===== CONVERT TO CLIENT ===== */
    convertToClient: function(id) {
        var self = this;
        if (typeof VT.Confirm !== 'undefined') {
            VT.Confirm.show({
                title: 'Convert Lead to Client',
                message: 'This lead will be converted to a client record. All lead information will be carried forward.',
                confirmText: 'Convert to Client',
                type: 'primary',
                onConfirm: function() { self._doConvertToClient(id); }
            });
        } else {
            if (!confirm('Convert this lead to a client? All information will be carried forward.')) return;
            this._doConvertToClient(id);
        }
    },

    _doConvertToClient: function(id) {
        this.load();
        var lead = null;
        for (var i = 0; i < this.data.length; i++) {
            if (this.data[i].id === id) { lead = this.data[i]; break; }
        }
        if (!lead) { VT.Utils.showToast('Lead not found', 'danger'); return; }

        var clients = VT.DataHub.getClients();
        var nextId = 'CLI-' + String(clients.length + 1).padStart(6, '0');

        // Gather follow-ups for this lead
        var allFus = VT.DataHub.getFollowups();
        var leadFus = allFus.filter(function(f) { return f.leadId === lead.id || f.leadNo === lead.leadNo || f.lead === lead.id; });
        var linkedContact = {
            name: lead.contactPerson || lead.name || '',
            phone: lead.phone || '',
            email: lead.email || '',
            designation: '',
            isPrimary: true
        };

        var client = {
            id: nextId,
            clientCode: 'CLI' + String(clients.length + 1).padStart(4, '0'),
            name: lead.company || lead.name || '',
            businessName: lead.company || lead.name || '',
            contactPerson: lead.contactPerson || lead.name || '',
            phone: lead.phone || '',
            email: lead.email || '',
            website: lead.website || '',
            industry: lead.industry || '',
            country: lead.country || '',
            state: lead.state || '',
            city: lead.city || '',
            billingStreet: lead.address || '',
            billingCity: lead.city || '',
            billingState: lead.state || '',
            billingCountry: lead.country || '',
            billingPostal: lead.pinCode || lead.pincode || '',
            source: lead.source || 'Lead Conversion',
            salesPerson: lead.assignee || '',
            notes: lead.notes || lead.requirement || '',
            customFields: [],
            category: '',
            currency: 'INR',
            status: 'active',
            clientType: 'Individual',
            taxTreatment: '',
            paymentTerms: '',
            createdAt: new Date().toISOString(),
            linkedContacts: [linkedContact],
            attachments: lead.attachments || [],
            convertedFromLead: lead.id,
            leadNo: lead.leadNo || lead.id,
            activities: (lead.activities || []).slice(),
            followups: leadFus
        };
        clients.push(client);
        VT.DataHub.saveClients(clients);

        lead.convertedToClient = client.id;
        lead.status = 'converted';
        lead.stage = 'won';
        this.save();
        this.addActivity(id, 'Lead converted to Client: ' + client.businessName + ' (' + client.id + ')');

        // Dispatch dashboard update
        try { document.dispatchEvent(new CustomEvent('VT:DataUpdated', { bubbles: true, detail: { module: 'leads' } })); } catch(e) {}

        VT.Utils.showToast('Lead converted to Client: ' + client.businessName, 'success');
        if (typeof VT.Clients !== 'undefined' && VT.Clients.load) {
            VT.Clients.load();
        }
        if (confirm('Open the new client?')) {
            window.location.href = 'client-view.html?id=' + client.id;
        } else {
            this.render();
        }
    },

    /* ===== INIT FORM (vl-create.html) ===== */
    initForm: function() {
        this.load();
        var self = this;
        
        // Auto-generate lead number
        var leadNoField = document.getElementById('field_leadNo');
        if (leadNoField && !leadNoField.value) {
            leadNoField.value = this.getNextLeadNo();
        }
        
        // Populate dropdowns
        this._populateFormDropdowns();
        
        // Save button
        var saveBtn = document.getElementById('saveLead');
        if (saveBtn) {
            saveBtn.addEventListener('click', function(e) {
                e.preventDefault();
                self._saveForm(false, false);
            });
        }
        
        // Save & New button
        var saveNewBtn = document.getElementById('saveNewLead');
        if (saveNewBtn) {
            saveNewBtn.addEventListener('click', function(e) {
                e.preventDefault();
                self._saveForm(false, true);
            });
        }
        
        // Save Draft button
        var draftBtn = document.getElementById('saveDraftLead');
        if (draftBtn) {
            draftBtn.addEventListener('click', function(e) {
                e.preventDefault();
                self._saveForm(true, false);
            });
        }
        
        // Upload zone
        this._initUploadZone();
        
        // Accordion behavior
        this._initAccordions();
    },

    initEdit: function() {
        this.load();
        var self = this;
        
        var params = new URLSearchParams(window.location.search);
        var id = params.get('id');
        if (!id) {
            VT.Utils.showToast('No lead ID provided', 'danger');
            window.location.href = 'leads.html';
            return;
        }
        
        var lead = this.getLeadById(id);
        if (!lead) {
            VT.Utils.showToast('Lead not found', 'danger');
            window.location.href = 'leads.html';
            return;
        }
        
        // Populate dropdowns and then fill form
        this._populateFormDropdowns(function() {
            self._fillForm(lead);
        });
        
        // Save button
        var saveBtn = document.getElementById('saveLead');
        if (saveBtn) {
            saveBtn.addEventListener('click', function(e) {
                e.preventDefault();
                self._saveForm(false, false);
            });
        }
        
        // Save & New button
        var saveNewBtn = document.getElementById('saveNewLead');
        if (saveNewBtn) {
            saveNewBtn.addEventListener('click', function(e) {
                e.preventDefault();
                self._saveForm(false, true);
            });
        }
        
        // Save Draft button
        var draftBtn = document.getElementById('saveDraftLead');
        if (draftBtn) {
            draftBtn.addEventListener('click', function(e) {
                e.preventDefault();
                self._saveForm(true, false);
            });
        }
        
        // Title
        var titleEl = document.getElementById('formTitle');
        if (titleEl) titleEl.textContent = 'Edit Lead: ' + (lead.leadNo || lead.id);
        var titleEl2 = document.getElementById('formTitle2');
        if (titleEl2) titleEl2.textContent = 'Edit Lead: ' + (lead.leadNo || lead.id);
        var breadcrumbEnd = document.getElementById('breadcrumbEnd');
        if (breadcrumbEnd) breadcrumbEnd.textContent = lead.leadNo || lead.id;
        
        // Upload zone
        this._initUploadZone();
        
        // Accordion behavior
        this._initAccordions();
    },

    initView: function() {
        this.load();
        var self = this;
        
        var params = new URLSearchParams(window.location.search);
        var id = params.get('id');
        if (!id) {
            var container = document.getElementById('viewContainer');
            if (container) container.innerHTML = '<div class="sales-empty-state"><i class="fas fa-exclamation-circle"></i><h3>No Lead ID</h3><p>Please select a lead from the list.</p><a href="leads.html" class="btn btn-primary"><i class="fas fa-arrow-left"></i> Back to Leads</a></div>';
            return;
        }
        
        var lead = this.getLeadById(id);
        if (!lead) {
            // Try loading seed data
            VT.Utils.showToast('Lead not found', 'danger');
            window.location.href = 'leads.html';
            return;
        }
        
        var container = document.getElementById('viewContainer');
        if (!container) return;
        
        // Redirect to lead-overview for full detail view
        window.location.href = 'lead-overview.html?id=' + encodeURIComponent(id);
    },

    initPipeline: function() {
        this.load();
        this._initClickDelegation();
        this.renderPipeline();
        this.populatePipelineFilter();
    },

    initBulkUpload: function() {
        this.load();
        VT.Utils.showToast('Bulk upload page', 'info');
    },

    /* ===== PIPELINE RENDERING ===== */
    renderPipeline: function() {
        var container = document.getElementById('pipelineContainer');
        if (!container) return;
        
        var stages = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
        var stageLabels = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
        var stageColors = ['#6b7280', '#3b82f6', '#0B4A3D', '#d97706', '#7c3aed', '#059669', '#dc2626'];
        
        var html = '<div class="pipeline-board">';
        
        for (var s = 0; s < stages.length; s++) {
            var stage = stages[s];
            var stageLeads = [];
            for (var i = 0; i < this.data.length; i++) {
                var d = this.data[i];
                if ((d.stage || 'new').toLowerCase() === stage && d.status !== 'deleted' && d.status !== 'archived') {
                    stageLeads.push(d);
                }
            }
            
            var totalValue = 0;
            for (var v = 0; v < stageLeads.length; v++) {
                totalValue += Number(stageLeads[v].expectedValue || 0);
            }
            
            html += '<div class="pipeline-column" data-stage="' + stage + '">' +
                '<div class="pipeline-column-header" style="border-bottom-color:' + stageColors[s] + '">' +
                    '<div class="pipeline-column-title" style="color:' + stageColors[s] + '">' +
                        '<span style="width:8px;height:8px;border-radius:50%;background:' + stageColors[s] + ';display:inline-block"></span>' +
                        stageLabels[s] +
                    '</div>' +
                    '<div class="pipeline-count-badge">' + stageLeads.length + '</div>' +
                    '<div class="pipeline-column-value">\u20B9' + Number(totalValue).toLocaleString('en-IN') + '</div>' +
                '</div>' +
                '<div class="pipeline-column-body">';
            
            if (stageLeads.length === 0) {
                html += '<div class="pipeline-empty"><i class="fas fa-arrow-right"></i><div class="pipeline-empty-title">Empty</div><div class="pipeline-empty-hint">Drag leads here</div></div>';
            } else {
                for (var l = 0; l < stageLeads.length; l++) {
                    html += this._renderPipelineCard(stageLeads[l]);
                }
            }
            
            html += '</div></div>';
        }
        
        html += '</div>';
        container.innerHTML = html;
    },

    _renderPipelineCard: function(lead) {
        var initial = (lead.name || lead.contactPerson || 'L').charAt(0).toUpperCase();
        var priorityCls = (lead.priority || 'medium').toLowerCase();
        var val = Number(lead.expectedValue || 0);
        return '<div class="pipeline-card" draggable="true" data-id="' + lead.id + '">' +
            '<div class="pipeline-card-priority ' + priorityCls + '"></div>' +
            '<div class="pipeline-card-header">' +
                '<div class="pipeline-card-avatar">' + initial + '</div>' +
                '<div class="pipeline-card-info">' +
                    '<div class="pipeline-card-name">' + this.esc(lead.name || lead.contactPerson || 'Unnamed') + '</div>' +
                    '<div class="pipeline-card-company">' + this.esc(lead.company || '') + '</div>' +
                '</div>' +
                '<div class="pipeline-card-menu">' +
                    '<button type="button" class="action-menu-btn" data-safe-menu="' + encodeURIComponent(JSON.stringify([
                        { label: 'View Lead', icon: 'fa-eye', action: 'view-lead', payload: lead.id },
                        { label: 'Edit Lead', icon: 'fa-pen', action: 'edit-lead', payload: lead.id },
                        { divider: true },
                        { label: 'Add Follow-up', icon: 'fa-phone', action: 'create-followup', payload: lead.id }
                    ])) + '"><i class="fas fa-ellipsis-v"></i></button>' +
                '</div>' +
            '</div>' +
            '<div class="pipeline-card-id-row"><i class="fas fa-tag"></i> ' + this.esc(lead.leadNo || lead.id) + '</div>' +
            (val > 0 ? '<div class="pipeline-card-value-row">\u20B9' + val.toLocaleString('en-IN') + '</div>' : '') +
            '<div class="pipeline-card-meta">' +
                '<span><i class="fas fa-phone"></i> ' + this.esc(lead.phone || '-') + '</span>' +
                '<span><i class="fas fa-envelope"></i> ' + this.esc(lead.email || '-') + '</span>' +
                '<span><i class="fas fa-user"></i> ' + this.esc(lead.assignee || lead.leadOwner || 'Unassigned') + '</span>' +
            '</div>' +
            '<div class="pipeline-card-footer">' +
                '<span class="pipeline-card-source">' + this.esc(lead.source || 'Direct') + '</span>' +
                '<span class="pipeline-card-owner"><i class="fas fa-calendar"></i> ' + (lead.createdAt ? (VT.Utils && VT.Utils.formatDate ? VT.Utils.formatDate(lead.createdAt) : lead.createdAt.substring(0, 10)) : '-') + '</span>' +
            '</div>' +
        '</div>';
    },

    populatePipelineFilter: function() {
        var ownerSel = document.getElementById('pipelineFilterOwner');
        if (!ownerSel) return;
        var owners = {};
        for (var i = 0; i < this.data.length; i++) {
            var o = this.data[i].assignee || this.data[i].leadOwner || 'Unassigned';
            owners[o] = true;
        }
        var ownerList = Object.keys(owners).sort();
        var html = '<option value="">All Owners</option>';
        for (var j = 0; j < ownerList.length; j++) {
            html += '<option value="' + this.esc(ownerList[j]) + '">' + this.esc(ownerList[j]) + '</option>';
        }
        ownerSel.innerHTML = html;
    },

    /* ===== FORM HELPERS ===== */
    _populateFormDropdowns: function(callback) {
        this._populateDropdown('field_industry', ['Information Technology', 'Retail', 'Telecommunications', 'Energy', 'Banking', 'Manufacturing', 'Pharmaceuticals', 'Construction', 'Healthcare', 'Education', 'Hospitality', 'Real Estate', 'Transportation', 'Media', 'Other']);
        this._populateDropdown('field_source', ['Website', 'Referral', 'LinkedIn', 'Trade Show', 'Email Campaign', 'Cold Call', 'Partner', 'Social Media', 'Word of Mouth', 'Other']);
        this._populateDropdown('field_country', ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'UAE', 'Singapore', 'Other']);
        this._populateDropdown('field_state', ['', 'Andhra Pradesh', 'Karnataka', 'Kerala', 'Maharashtra', 'Tamil Nadu', 'Telangana', 'Delhi', 'Gujarat', 'Haryana', 'Rajasthan', 'Uttar Pradesh', 'West Bengal', 'Other']);
        this._populateDropdown('field_city', ['', 'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Other']);
        this._populateDropdown('field_owner', ['Admin', 'Rajesh Kumar', 'Priya Sharma', 'Vikram Patel', 'Ananya Reddy', 'Suresh Menon', 'Arun Nair', 'Kavita Joshi', 'Dr. Meera Iyer', 'Rohan Desai', 'Amitabh Sinha', 'Pradeep Singh', 'Neha Gupta', 'Deepak Sharma']);
        this._populateDropdown('field_stage', ['New', 'Contacted', 'Qualified', 'Proposal', 'Proposal Sent', 'Negotiation', 'Won', 'Lost']);
        this._populateDropdown('field_priority', ['Low', 'Medium', 'High', 'Urgent']);
        this._populateDropdown('field_status', ['Active', 'Inactive']);
        
        if (callback) setTimeout(callback, 50);
    },

    _populateDropdown: function(id, options) {
        var el = document.getElementById(id);
        if (!el) return;
        var html = '';
        if (id !== 'field_country' && id !== 'field_owner') {
            html += '<option value="">Select ' + id.replace('field_', '').replace(/_/g, ' ') + '</option>';
        }
        for (var i = 0; i < options.length; i++) {
            html += '<option value="' + this.esc(options[i]) + '">' + this.esc(options[i]) + '</option>';
        }
        el.innerHTML = html;
    },

    _fillForm: function(lead) {
        var fieldMap = {
            field_name: 'company',
            field_industry: 'industry',
            field_website: 'website',
            field_leadNo: 'leadNo',
            field_source: 'source',
            field_expectedValue: 'expectedValue',
            field_expectedCloseDate: 'expectedCloseDate',
            field_contactPerson: 'contactPerson',
            field_phone: 'phone',
            field_email: 'email',
            field_secondaryContactPerson: 'secondaryContactPerson',
            field_secondaryPhone: 'secondaryPhone',
            field_secondaryEmail: 'secondaryEmail',
            field_secondaryDesignation: 'secondaryDesignation',
            field_country: 'country',
            field_state: 'state',
            field_city: 'city',
            field_pincode: 'pincode',
            field_landmark: 'landmark',
            field_address: 'address',
            field_owner: 'assignee',
            field_stage: 'stage',
            field_priority: 'priority',
            field_status: 'status',
            field_notes: 'notes',
            field_internalNotes: 'internalNotes'
        };
        
        for (var fieldId in fieldMap) {
            var el = document.getElementById(fieldId);
            if (!el) continue;
            var val = lead[fieldMap[fieldId]] || '';
            if (fieldMap[fieldId] === 'expectedValue' && val) {
                val = parseFloat(val);
            }
            el.value = val;
        }
        
        // Load leadId
        var leadIdField = document.getElementById('leadId');
        if (leadIdField) leadIdField.value = lead.id;
        
        // Load attachments if any
        if (lead.attachments && lead.attachments.length > 0) {
            var fileList = document.getElementById('fileList');
            if (fileList) {
                fileList.innerHTML = '';
                for (var a = 0; a < lead.attachments.length; a++) {
                    var att = lead.attachments[a];
                    var icon = 'fa-file';
                    if (att.type) {
                        if (att.type.indexOf('pdf') !== -1) icon = 'fa-file-pdf';
                        else if (att.type.indexOf('image') !== -1) icon = 'fa-file-image';
                        else if (att.type.indexOf('word') !== -1) icon = 'fa-file-word';
                        else if (att.type.indexOf('excel') !== -1 || att.type.indexOf('sheet') !== -1) icon = 'fa-file-excel';
                    }
                    var sizeStr = att.size > 1024 ? Math.round(att.size / 1024) + ' KB' : (att.size || '') + ' B';
                    fileList.innerHTML += '<div class="file-item" data-name="' + this._escAttr(att.name) + '">' +
                        '<i class="fas ' + icon + ' file-item-icon"></i>' +
                        '<span class="file-item-name">' + this._escAttr(att.name || 'File') + '</span>' +
                        '<span class="file-item-size">' + sizeStr + '</span>' +
                        '<button class="btn btn-icon btn-sm btn-ghost file-item-btn remove" onclick="this.closest(\'.file-item\').remove()"><i class="fas fa-times"></i></button>' +
                    '</div>';
                }
            }
        }
        
        this.formAttachments = lead.attachments || [];
    },

    _saveForm: function(isDraft, isNew) {
        var lead = {};
        var fieldMap = {
            field_name: 'company',
            field_industry: 'industry',
            field_website: 'website',
            field_leadNo: 'leadNo',
            field_source: 'source',
            field_expectedValue: 'expectedValue',
            field_expectedCloseDate: 'expectedCloseDate',
            field_contactPerson: 'contactPerson',
            field_phone: 'phone',
            field_email: 'email',
            field_secondaryContactPerson: 'secondaryContactPerson',
            field_secondaryPhone: 'secondaryPhone',
            field_secondaryEmail: 'secondaryEmail',
            field_secondaryDesignation: 'secondaryDesignation',
            field_country: 'country',
            field_state: 'state',
            field_city: 'city',
            field_pincode: 'pincode',
            field_landmark: 'landmark',
            field_address: 'address',
            field_owner: 'assignee',
            field_stage: 'stage',
            field_priority: 'priority',
            field_status: 'status',
            field_notes: 'notes',
            field_internalNotes: 'internalNotes'
        };
        
        for (var fieldId in fieldMap) {
            var el = document.getElementById(fieldId);
            if (el) lead[fieldMap[fieldId]] = el.value;
        }
        
        // Validate required fields
        var required = { field_name: 'Business Name', field_contactPerson: 'Contact Person', field_phone: 'Phone', field_email: 'Email' };
        for (var reqId in required) {
            var reqEl = document.getElementById(reqId);
            if (!reqEl || !reqEl.value.trim()) {
                VT.Utils.showToast(required[reqId] + ' is required', 'danger');
                if (reqEl) reqEl.focus();
                return;
            }
        }
        
        lead.id = document.getElementById('leadId') ? document.getElementById('leadId').value : '';
        lead.leadNo = document.getElementById('field_leadNo') ? document.getElementById('field_leadNo').value : '';
        
        if (!lead.id) {
            lead.id = this.getNextId();
            if (!lead.leadNo) lead.leadNo = this.getNextLeadNo();
            lead.createdAt = new Date().toISOString();
            lead.activities = [{ date: new Date().toISOString(), type: 'Lead Created' }];
            lead.attachments = this.formAttachments;
            this.data.push(lead);
        } else {
            for (var i = 0; i < this.data.length; i++) {
                if (this.data[i].id === lead.id) {
                    var oldLead = this.data[i];
                    lead.createdAt = oldLead.createdAt;
                    lead.activities = oldLead.activities || [];
                    lead.attachments = this.formAttachments.length > 0 ? this.formAttachments : (oldLead.attachments || []);
                    lead.convertedToCPR = oldLead.convertedToCPR;
                    lead.convertedToClient = oldLead.convertedToClient;
                    lead.leadNo = oldLead.leadNo;
                    this.data[i] = lead;
                    break;
                }
            }
        }
        
        lead.status = lead.status || 'active';
        lead.updatedAt = new Date().toISOString();
        if (isDraft) lead.status = 'draft';
        
        this.save();
        this.addActivity(lead.id, isDraft ? 'Lead saved as draft' : 'Lead saved');
        
        if (isNew) {
            // Reset form for new entry
            this._resetForm();
            VT.Utils.showToast('Lead saved. Creating another...', 'success');
        } else {
            VT.Utils.showToast('Lead ' + (lead.leadNo || lead.id) + ' saved successfully', 'success');
            setTimeout(function() {
                window.location.href = 'lead-overview.html?id=' + encodeURIComponent(lead.id);
            }, 500);
        }
    },

    _resetForm: function() {
        var inputs = document.querySelectorAll('.sales-form-input, .sales-form-select, .sales-form-textarea');
        for (var i = 0; i < inputs.length; i++) {
            inputs[i].value = '';
        }
        var leadNoField = document.getElementById('field_leadNo');
        if (leadNoField) leadNoField.value = this.getNextLeadNo();
        var leadIdField = document.getElementById('leadId');
        if (leadIdField) leadIdField.value = '';
        var fileList = document.getElementById('fileList');
        if (fileList) fileList.innerHTML = '';
        this.formAttachments = [];
    },

    _initUploadZone: function() {
        var self = this;
        var zone = document.getElementById('uploadZone');
        var input = document.getElementById('fileInput');
        if (!zone || !input) return;
        
        zone.addEventListener('click', function() { input.click(); });
        
        input.addEventListener('change', function(e) {
            var files = e.target.files;
            if (!files || files.length === 0) return;
            var fileList = document.getElementById('fileList');
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                if (file.size > 10 * 1024 * 1024) {
                    VT.Utils.showToast('File exceeds 10MB limit: ' + file.name, 'warning');
                    continue;
                }
                var reader = new FileReader();
                reader.onload = (function(f) {
                    return function(ev) {
                        var icon = 'fa-file';
                        if (f.type.indexOf('pdf') !== -1) icon = 'fa-file-pdf';
                        else if (f.type.indexOf('image') !== -1) icon = 'fa-file-image';
                        else if (f.type.indexOf('word') !== -1) icon = 'fa-file-word';
                        else if (f.type.indexOf('excel') !== -1 || f.type.indexOf('sheet') !== -1) icon = 'fa-file-excel';
                        var sizeStr = f.size > 1024 ? Math.round(f.size / 1024) + ' KB' : f.size + ' B';
                        if (fileList) {
                            fileList.innerHTML += '<div class="file-item" data-name="' + VT.Utils.escapeHtml(f.name) + '">' +
                                '<i class="fas ' + icon + ' file-item-icon"></i>' +
                                '<span class="file-item-name">' + VT.Utils.escapeHtml(f.name) + '</span>' +
                                '<span class="file-item-size">' + sizeStr + '</span>' +
                                '<button class="btn btn-icon btn-sm btn-ghost file-item-btn remove" onclick="this.closest(\'.file-item\').remove()"><i class="fas fa-times"></i></button>' +
                            '</div>';
                        }
                        // Store in formAttachments
                        self.formAttachments.push({ name: f.name, size: f.size, type: f.type, dataUrl: ev.target.result, uploadedAt: new Date().toISOString() });
                    };
                })(file);
                reader.readAsDataURL(file);
            }
            input.value = '';
        });
        
        zone.addEventListener('dragover', function(e) {
            e.preventDefault();
            zone.classList.add('drag-over');
        });
        zone.addEventListener('dragleave', function() {
            zone.classList.remove('drag-over');
        });
        zone.addEventListener('drop', function(e) {
            e.preventDefault();
            zone.classList.remove('drag-over');
            var files = e.dataTransfer.files;
            if (files && files.length > 0 && input) {
                input.files = files;
                input.dispatchEvent(new Event('change'));
            }
        });
    },

    _initAccordions: function() {
        var headers = document.querySelectorAll('.form-card-header');
        for (var i = 0; i < headers.length; i++) {
            (function(header) {
                header.addEventListener('click', function() {
                    var card = header.closest('.form-card');
                    if (card) card.classList.toggle('open');
                });
            })(headers[i]);
        }
        // Open all by default
        var cards = document.querySelectorAll('.form-card');
        for (var j = 0; j < cards.length; j++) {
            cards[j].classList.add('open');
        }
    },

    _escAttr: function(str) {
        if (!str && str !== 0) return '';
        return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    },

    /* ===== EXPORT ===== */
    initExport: function() {
        var dd = document.getElementById('leadsExportDD');
        if (!dd) return;
        dd.innerHTML = '<div class="export-dropdown-wrap">' +
            '<button class="btn btn-ghost btn-sm" onclick="VT.Leads.toggleExportMenu()"><i class="fas fa-download"></i> Export</button>' +
            '<div class="export-menu" id="leadsExportMenu" style="display:none;position:absolute;right:0;top:100%;background:#fff;border:1px solid #e5e7eb;border-radius:10px;box-shadow:0 10px 25px rgba(0,0,0,0.1);z-index:100;min-width:180px;padding:4px">' +
                '<button class="safe-menu-item action-item" data-export-action="csv"><i class="fas fa-file-csv"></i> Export as CSV</button>' +
                '<button class="safe-menu-item action-item" data-export-action="xlsx"><i class="fas fa-file-excel"></i> Export as Excel</button>' +
                '<button class="safe-menu-item action-item" data-export-action="pdf"><i class="fas fa-file-pdf"></i> Export as PDF</button>' +
            '</div></div>';
    },

    toggleExportMenu: function() {
        var menu = document.getElementById('leadsExportMenu');
        if (!menu) return;
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        if (menu.style.display === 'block') {
            var closeHandler = function(e) {
                if (!e.target.closest('#leadsExportDD, #leadsExportMenu')) {
                    menu.style.display = 'none';
                    document.removeEventListener('click', closeHandler);
                }
            };
            setTimeout(function() { document.addEventListener('click', closeHandler); }, 10);
        }
    },

    doExport: function(format) {
        var filtered = this.getFiltered();
        if (filtered.length === 0) {
            VT.Utils.showToast('No data to export', 'warning');
            return;
        }
        
        var rows = [];
        var headers = ['Lead No', 'Business Name', 'Contact Person', 'Phone', 'Email', 'Industry', 'Lead Source', 'Stage', 'Owner', 'Priority', 'Expected Value', 'Status'];
        rows.push(headers);
        
        for (var i = 0; i < filtered.length; i++) {
            var d = filtered[i];
            rows.push([
                d.leadNo || d.id || '',
                d.company || '',
                d.name || d.contactPerson || '',
                d.phone || '',
                d.email || '',
                d.industry || '',
                d.source || '',
                (d.stage || 'new').charAt(0).toUpperCase() + (d.stage || 'new').slice(1),
                d.assignee || '',
                (d.priority || 'medium').charAt(0).toUpperCase() + (d.priority || 'medium').slice(1),
                d.expectedValue || 0,
                (d.status || 'active').charAt(0).toUpperCase() + (d.status || 'active').slice(1)
            ]);
        }
        
        if (format === 'csv') {
            this._exportCSV(rows);
        } else if (format === 'xlsx') {
            this._exportXLSX(rows);
        } else if (format === 'pdf') {
            this._exportPDF(rows);
        }
    },

    exportLead: function(id) {
        var lead = this.getLeadById(id);
        if (!lead) { VT.Utils.showToast('Lead not found', 'danger'); return; }
        // Export single lead as CSV
        var headers = ['Field', 'Value'];
        var rows = [headers];
        rows.push(['Lead No', lead.leadNo || lead.id || '']);
        rows.push(['Business Name', lead.company || '']);
        rows.push(['Contact Person', lead.name || lead.contactPerson || '']);
        rows.push(['Phone', lead.phone || '']);
        rows.push(['Email', lead.email || '']);
        rows.push(['Industry', lead.industry || '']);
        rows.push(['Source', lead.source || '']);
        rows.push(['Stage', lead.stage || 'new']);
        rows.push(['Owner', lead.assignee || '']);
        rows.push(['Priority', lead.priority || 'medium']);
        rows.push(['Expected Value', lead.expectedValue || 0]);
        rows.push(['Address', lead.address || '']);
        rows.push(['Status', lead.status || 'active']);
        this._exportCSV(rows, (lead.leadNo || lead.id) + '-export');
    },

    _exportCSV: function(rows, filename) {
        filename = filename || 'leads-export';
        var csv = '';
        for (var r = 0; r < rows.length; r++) {
            var row = [];
            for (var c = 0; c < rows[r].length; c++) {
                var val = String(rows[r][c] || '').replace(/"/g, '""');
                row.push('"' + val + '"');
            }
            csv += row.join(',') + '\r\n';
        }
        var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename + '.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        VT.Utils.showToast('Exported: ' + filename + '.csv', 'success');
    },

    _exportXLSX: function(rows, filename) {
        filename = filename || 'leads-export';
        if (typeof XLSX !== 'undefined') {
            var ws = XLSX.utils.aoa_to_sheet(rows);
            var wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Leads');
            XLSX.writeFile(wb, filename + '.xlsx');
            VT.Utils.showToast('Exported: ' + filename + '.xlsx', 'success');
        } else {
            VT.Utils.showToast('Excel export requires SheetJS library', 'warning');
            this._exportCSV(rows, filename);
        }
    },

    _exportPDF: function(rows, filename) {
        filename = filename || 'leads-export';
        if (typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF) {
            var jsPDF = window.jspdf.jsPDF;
            var doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            doc.text('Leads Export - ' + new Date().toLocaleDateString(), 14, 15);
            doc.autoTable({ head: [rows[0]], body: rows.slice(1), startY: 22, theme: 'grid', styles: { fontSize: 8 } });
            doc.save(filename + '.pdf');
            VT.Utils.showToast('Exported: ' + filename + '.pdf', 'success');
        } else {
            VT.Utils.showToast('PDF export requires jsPDF library', 'warning');
        }
    },

    /* ===== POPULATE OWNER FILTER ===== */
    populateOwnerFilter: function() {
        var ownerSel = document.getElementById('filterOwner');
        if (!ownerSel) return;
        var owners = {};
        for (var i = 0; i < this.data.length; i++) {
            var o = this.data[i].assignee || this.data[i].leadOwner || 'Unassigned';
            owners[o] = true;
        }
        var ownerList = Object.keys(owners).sort();
        var html = '<option value="">All Owners</option>';
        for (var j = 0; j < ownerList.length; j++) {
            html += '<option value="' + this.esc(ownerList[j]) + '">' + this.esc(ownerList[j]) + '</option>';
        }
        ownerSel.innerHTML = html;
    },

    populateSourceFilter: function() {
        var sel = document.getElementById('filterSource');
        if (!sel) return;
        var sources = {};
        for (var i = 0; i < this.data.length; i++) {
            var s = this.data[i].source || '';
            if (s) sources[s] = true;
        }
        var list = Object.keys(sources).sort();
        var html = '<option value="">All Sources</option>';
        for (var j = 0; j < list.length; j++) {
            html += '<option value="' + this.esc(list[j]) + '">' + this.esc(list[j]) + '</option>';
        }
        sel.innerHTML = html;
    },

    /* ===== BULK ACTIONS ===== */
    _getSelectedIds: function() {
        var checkboxes = document.querySelectorAll('.vl-checkbox:checked');
        var ids = [];
        for (var i = 0; i < checkboxes.length; i++) {
            ids.push(checkboxes[i].value);
        }
        return ids;
    },

    bulkDelete: function() {
        var ids = this._getSelectedIds();
        if (ids.length === 0) { VT.Utils.showToast('No leads selected', 'warning'); return; }
        if (!confirm('Delete ' + ids.length + ' selected leads? They will be moved to trash.')) return;
        for (var i = 0; i < ids.length; i++) {
            for (var j = 0; j < this.data.length; j++) {
                if (this.data[j].id === ids[i]) {
                    this.data[j].status = 'deleted';
                    this.addActivity(ids[i], 'Bulk delete: Lead moved to trash');
                    break;
                }
            }
        }
        this.save();
        this.render();
        this.clearSelection();
        VT.Utils.showToast(ids.length + ' leads moved to trash', 'success');
    },

    bulkRestore: function() {
        var ids = this._getSelectedIds();
        if (ids.length === 0) { VT.Utils.showToast('No leads selected', 'warning'); return; }
        if (!confirm('Restore ' + ids.length + ' selected leads?')) return;
        for (var i = 0; i < ids.length; i++) {
            for (var j = 0; j < this.data.length; j++) {
                if (this.data[j].id === ids[i]) {
                    this.data[j].status = 'new';
                    this.data[j].updatedAt = new Date().toISOString();
                    delete this.data[j].deletedAt;
                    break;
                }
            }
        }
        this.save();
        this.render();
        this.clearSelection();
        VT.Utils.showToast(ids.length + ' leads restored', 'success');
    },

    bulkPermanentDelete: function() {
        var ids = this._getSelectedIds();
        if (ids.length === 0) { VT.Utils.showToast('No leads selected', 'warning'); return; }
        if (!confirm('Permanently delete ' + ids.length + ' leads? This cannot be undone!')) return;
        for (var i = 0; i < ids.length; i++) {
            for (var j = this.data.length - 1; j >= 0; j--) {
                if (this.data[j].id === ids[i]) {
                    this.data.splice(j, 1);
                    break;
                }
            }
        }
        this.save();
        this.render();
        this.clearSelection();
        VT.Utils.showToast(ids.length + ' leads permanently deleted', 'success');
    },

    bulkArchive: function() {
        var ids = this._getSelectedIds();
        if (ids.length === 0) { VT.Utils.showToast('No leads selected', 'warning'); return; }
        if (!confirm('Archive ' + ids.length + ' selected leads?')) return;
        for (var i = 0; i < ids.length; i++) {
            for (var j = 0; j < this.data.length; j++) {
                if (this.data[j].id === ids[i]) {
                    this.data[j].status = 'archived';
                    break;
                }
            }
        }
        this.save();
        this.render();
        this.clearSelection();
        VT.Utils.showToast(ids.length + ' leads archived', 'success');
    },

    bulkAssignOwner: function() {
        var ids = this._getSelectedIds();
        if (ids.length === 0) { VT.Utils.showToast('No leads selected', 'warning'); return; }
        var name = prompt('Assign owner to ' + ids.length + ' selected leads:');
        if (!name || !name.trim()) return;
        for (var i = 0; i < ids.length; i++) {
            for (var j = 0; j < this.data.length; j++) {
                if (this.data[j].id === ids[i]) {
                    this.data[j].assignee = name.trim();
                    this.addActivity(ids[i], 'Owner assigned: ' + name.trim());
                    break;
                }
            }
        }
        this.save();
        this.render();
        this.clearSelection();
        VT.Utils.showToast('Assigned to ' + name.trim(), 'success');
    },

    bulkChangeStage: function() {
        var ids = this._getSelectedIds();
        if (ids.length === 0) { VT.Utils.showToast('No leads selected', 'warning'); return; }
        var stage = prompt('Change stage for ' + ids.length + ' leads (e.g., qualified, won, lost):');
        if (!stage || !stage.trim()) return;
        var newStage = stage.trim().toLowerCase();
        for (var i = 0; i < ids.length; i++) {
            for (var j = 0; j < this.data.length; j++) {
                if (this.data[j].id === ids[i]) {
                    this.data[j].stage = newStage;
                    this.data[j].updatedAt = new Date().toISOString();
                    this.addActivity(ids[i], 'Stage changed to "' + newStage + '" via bulk');
                    break;
                }
            }
        }
        this.save();
        this.render();
        this.clearSelection();
        VT.Utils.showToast('Stage changed to ' + newStage, 'success');
    },

    bulkExport: function() {
        var ids = this._getSelectedIds();
        if (ids.length === 0) { VT.Utils.showToast('No leads selected', 'warning'); return; }
        var selected = [];
        for (var i = 0; i < this.data.length; i++) {
            if (ids.indexOf(this.data[i].id) !== -1) {
                selected.push(this.data[i]);
            }
        }
        var rows = [['Lead No', 'Business Name', 'Contact Person', 'Phone', 'Email', 'Industry', 'Stage', 'Owner', 'Priority', 'Expected Value', 'Status']];
        for (var j = 0; j < selected.length; j++) {
            var d = selected[j];
            rows.push([
                d.leadNo || d.id || '', d.company || '', d.name || d.contactPerson || '',
                d.phone || '', d.email || '', d.industry || '',
                (d.stage || 'new').charAt(0).toUpperCase() + (d.stage || 'new').slice(1),
                d.assignee || '', (d.priority || 'medium').charAt(0).toUpperCase() + (d.priority || 'medium').slice(1),
                d.expectedValue || 0, (d.status || 'active').charAt(0).toUpperCase() + (d.status || 'active').slice(1)
            ]);
        }
        this._exportCSV(rows, 'selected-leads');
    },

    /* ===== MASTER DATA HELPERS ===== */
    _refreshAllCombos: function() {
        this._populateFormDropdowns();
    },

    showAddIndustryModal: function() {
        if (VT.MasterManager) {
            VT.MasterManager.show('Industry', 'industries', 'field_industry', this._refreshAllCombos.bind(this));
        } else {
            var val = prompt('Enter new industry:');
            if (val && val.trim()) {
                var sel = document.getElementById('field_industry');
                if (sel) {
                    var opt = document.createElement('option');
                    opt.value = val.trim();
                    opt.textContent = val.trim();
                    sel.appendChild(opt);
                    sel.value = val.trim();
                }
            }
        }
    },

    showManageIndustriesModal: function() {
        if (VT.MasterManager) {
            VT.MasterManager.show('Industry', 'industries', 'field_industry');
        } else {
            VT.Utils.showToast('Master data management', 'info');
        }
    },

    /* ===== CONVERSION HELPERS ===== */
    createQuotation: function(id) {
        var lead = this.getLeadById(id);
        if (!lead) { VT.Utils.showToast('Lead not found', 'danger'); return; }
        window.location.href = 'quotation-create.html?leadId=' + encodeURIComponent(id) + '&customer=' + encodeURIComponent(lead.name || lead.contactPerson || '');
    },

    createSalesOrder: function(id) {
        var lead = this.getLeadById(id);
        if (!lead) { VT.Utils.showToast('Lead not found', 'danger'); return; }
        window.location.href = 'sales-order-create.html?leadId=' + encodeURIComponent(id) + '&customer=' + encodeURIComponent(lead.name || lead.contactPerson || '');
    },

    /* ===== NEW ACTION HANDLERS ===== */
    logCall: function(id) {
        var lead = this.getLeadById(id);
        if (!lead) { VT.Utils.showToast('Lead not found', 'danger'); return; }
        var name = lead.contactPerson || lead.name || '';
        var notes = prompt('Call notes for ' + name + ':');
        if (notes === null) return;
        this.addActivity(id, 'Call logged: ' + (notes || 'No notes'));
        this.addFollowupAuto(id, 'Call', notes || 'Logged call', 'Completed');
        VT.Utils.showToast('Call logged for ' + name, 'success');
    },

    sendEmail: function(id) {
        var lead = this.getLeadById(id);
        if (!lead) { VT.Utils.showToast('Lead not found', 'danger'); return; }
        var email = lead.email || '';
        if (!email) { VT.Utils.showToast('No email address for this lead', 'warning'); return; }
        var subject = prompt('Email Subject:', 'Regarding ' + (lead.company || lead.name || ''));
        if (subject === null) return;
        this.addActivity(id, 'Email sent: ' + subject);
        var name = lead.contactPerson || lead.name || '';
        VT.Utils.showToast('Email opened in default client for ' + name, 'success');
        window.location.href = 'mailto:' + encodeURIComponent(email) + '?subject=' + encodeURIComponent(subject);
    },

    addNote: function(id) {
        var lead = this.getLeadById(id);
        if (!lead) { VT.Utils.showToast('Lead not found', 'danger'); return; }
        var note = prompt('Add note for ' + (lead.contactPerson || lead.name || '') + ':');
        if (note === null) return;
        if (!lead.notes) lead.notes = '';
        lead.notes += (lead.notes ? '\n' : '') + '[' + new Date().toLocaleDateString() + '] ' + note;
        this.save();
        this.addActivity(id, 'Note added');
        VT.Utils.showToast('Note added', 'success');
        this.render();
    },

    uploadAttachment: function(id) {
        var self = this;
        var lead = this.getLeadById(id);
        if (!lead) { VT.Utils.showToast('Lead not found', 'danger'); return; }
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg';
        input.onchange = function(e) {
            var file = e.target.files[0];
            if (!file) return;
            if (file.size > 10 * 1024 * 1024) { VT.Utils.showToast('File exceeds 10MB limit', 'warning'); return; }
            var reader = new FileReader();
            reader.onload = function(ev) {
                if (!lead.attachments) lead.attachments = [];
                lead.attachments.push({ name: file.name, size: file.size, type: file.type, dataUrl: ev.target.result, uploadedAt: new Date().toISOString() });
                self.save();
                self.addActivity(id, 'Attachment uploaded: ' + file.name);
                VT.Utils.showToast('Attachment uploaded: ' + file.name, 'success');
            };
            reader.readAsDataURL(file);
        };
        input.click();
    },

    showMoveStageModal: function(id) {
        var lead = this.getLeadById(id);
        if (!lead) { VT.Utils.showToast('Lead not found', 'danger'); return; }
        var stages = ['New', 'Contacted', 'Qualified', 'Proposal', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];
        var current = (lead.stage || 'new').toLowerCase();
        var html = '<div class="modal-overlay" id="moveStageModal" style="display:flex;align-items:center;justify-content:center"><div class="modal" style="max-width:400px">' +
            '<div class="modal-header"><h3><i class="fas fa-tag"></i> Move Stage</h3><button class="modal-close" onclick="document.getElementById(\'moveStageModal\').remove()"><i class="fas fa-times"></i></button></div>' +
            '<div class="modal-body"><div style="display:flex;flex-direction:column;gap:6px">';
        for (var si = 0; si < stages.length; si++) {
            var sk = stages[si].toLowerCase();
            var sel = sk === current ? ' selected' : '';
            html += '<button class="safe-menu-item action-item' + (sk === current ? ' text-success" style="background:#f0fdf4"' : '"') +
                ' onclick="VT.Leads.changeStage(\'' + id + '\',\'' + sk + '\');document.getElementById(\'moveStageModal\').remove()">' +
                '<i class="fas ' + (sk === current ? 'fa-check-circle' : 'fa-circle') + '"></i><span>' + stages[si] + '</span></button>';
        }
        html += '</div></div></div></div>';
        var div = document.createElement('div');
        div.innerHTML = html;
        document.body.appendChild(div.firstElementChild);
    },

    showAssignOwnerModal: function(id) {
        var lead = this.getLeadById(id);
        if (!lead) { VT.Utils.showToast('Lead not found', 'danger'); return; }
        var current = lead.assignee || '';
        var name = prompt('Assign owner for ' + (lead.contactPerson || lead.name || '') + ':\nCurrent: ' + (current || 'Unassigned'));
        if (name === null) return;
        if (!name.trim()) { VT.Utils.showToast('Owner name cannot be empty', 'warning'); return; }
        lead.assignee = name.trim();
        this.save();
        this.addActivity(id, 'Owner assigned: ' + name.trim());
        VT.Utils.showToast('Assigned to ' + name.trim(), 'success');
        this.render();
    },

    showChangePriorityModal: function(id) {
        var lead = this.getLeadById(id);
        if (!lead) { VT.Utils.showToast('Lead not found', 'danger'); return; }
        var priorities = ['Low', 'Medium', 'High', 'Urgent'];
        var current = (lead.priority || 'medium').toLowerCase();
        var html = '<div class="modal-overlay" id="priorityModal" style="display:flex;align-items:center;justify-content:center"><div class="modal" style="max-width:360px">' +
            '<div class="modal-header"><h3><i class="fas fa-flag"></i> Change Priority</h3><button class="modal-close" onclick="document.getElementById(\'priorityModal\').remove()"><i class="fas fa-times"></i></button></div>' +
            '<div class="modal-body"><div style="display:flex;flex-direction:column;gap:6px">';
        var colors = { low: '#6b7280', medium: '#d97706', high: '#dc2626', urgent: '#7c3aed' };
        for (var pi = 0; pi < priorities.length; pi++) {
            var pk = priorities[pi].toLowerCase();
            var sel2 = pk === current ? ' selected' : '';
            html += '<button class="safe-menu-item action-item' + (pk === current ? '" style="background:#f0fdf4"' : '"') +
                ' onclick="VT.Leads._doChangePriority(\'' + id + '\',\'' + pk + '\');document.getElementById(\'priorityModal\').remove()">' +
                '<i class="fas fa-flag" style="color:' + (colors[pk] || '#6b7280') + '"></i><span>' + priorities[pi] + '</span></button>';
        }
        html += '</div></div></div></div>';
        var div = document.createElement('div');
        div.innerHTML = html;
        document.body.appendChild(div.firstElementChild);
    },

    _doChangePriority: function(id, priority) {
        for (var i = 0; i < this.data.length; i++) {
            if (this.data[i].id === id) {
                this.data[i].priority = priority;
                this.save();
                this.addActivity(id, 'Priority changed to ' + priority);
                VT.Utils.showToast('Priority changed to ' + priority.charAt(0).toUpperCase() + priority.slice(1), 'success');
                this.render();
                return;
            }
        }
    },

    generatePDF: function(id) {
        var lead = this.getLeadById(id);
        if (!lead) { VT.Utils.showToast('Lead not found', 'danger'); return; }
        var win = window.open('', '_blank');
        if (!win) { VT.Utils.showToast('Popup blocked. Please allow popups.', 'warning'); return; }
        var now = new Date();
        var dateStr = String(now.getDate()).padStart(2,'0')+'-'+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][now.getMonth()]+'-'+now.getFullYear();
        var timeStr = String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
        var stageClass = (lead.stage||'new').toLowerCase().replace(/\s+/g,'-');
        win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Lead '+this.esc(lead.leadNo||lead.id)+'</title>');
        win.document.write('<style>');
        win.document.write('@page{size:A4;margin:15mm 18mm}');
        win.document.write('*{box-sizing:border-box;margin:0;padding:0}');
        win.document.write('body{font-family:Inter,-apple-system,sans-serif;color:#1e293b;line-height:1.6;font-size:13px}');
        win.document.write('.report-header{display:flex;align-items:center;gap:14px;padding-bottom:16px;border-bottom:3px solid #0B4A3D;margin-bottom:20px}');
        win.document.write('.report-logo{width:48px;height:48px;background:linear-gradient(135deg,#0B4A3D,#136754);border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:20px;flex-shrink:0}');
        win.document.write('.report-brand{flex:1}');
        win.document.write('.report-brand h1{font-size:16px;font-weight:700;color:#0B4A3D;margin:0}');
        win.document.write('.report-brand .report-sub{font-size:11px;color:#94a3b8;margin-top:2px}');
        win.document.write('.report-title{font-size:18px;font-weight:700;color:#0B4A3D;text-align:right}');
        win.document.write('.report-title small{display:block;font-size:11px;font-weight:400;color:#94a3b8;margin-top:2px}');
        win.document.write('.report-meta{display:flex;gap:16px;font-size:11px;color:#64748b;margin-bottom:20px;padding:10px 14px;background:#f8fafc;border-radius:8px;flex-wrap:wrap}');
        win.document.write('.report-meta span{display:flex;align-items:center;gap:4px}');
        win.document.write('.report-body{display:grid;grid-template-columns:1fr 1fr;gap:12px 24px}');
        win.document.write('.field{border-bottom:1px solid #f1f5f9;padding:8px 0}');
        win.document.write('.field.full{grid-column:1 / -1}');
        win.document.write('.field .label{font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:2px}');
        win.document.write('.field .value{font-size:14px;font-weight:500;color:#1e293b}');
        win.document.write('.badge{display:inline-flex;align-items:center;gap:4px;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600}');
        win.document.write('.badge-new{background:#f1f5f9;color:#475569}');
        win.document.write('.badge-contacted{background:#dbeafe;color:#1d4ed8}');
        win.document.write('.badge-qualified{background:#d1fae5;color:#065f46}');
        win.document.write('.badge-proposal,.badge-proposal-sent{background:#fef3c7;color:#92400e}');
        win.document.write('.badge-negotiation{background:#fce7f3;color:#9d174d}');
        win.document.write('.badge-won{background:#d1fae5;color:#065f46;font-weight:700}');
        win.document.write('.badge-lost{background:#fee2e2;color:#dc2626}');
        win.document.write('.report-footer{margin-top:30px;padding-top:12px;border-top:2px solid #e2e8f0;font-size:10px;color:#94a3b8;text-align:center}');
        win.document.write('@media print{@page{size:A4;margin:15mm 18mm}.report-header{border-bottom-color:#0B4A3D!important}.badge{-webkit-print-color-adjust:exact;print-color-adjust:exact}}');
        win.document.write('</style></head><body>');
        win.document.write('<div class="report-header">');
        win.document.write('<div class="report-logo">VT</div>');
        win.document.write('<div class="report-brand"><h1>VISHAK TECH</h1><div class="report-sub">Enterprise CRM — Lead Profile</div></div>');
        win.document.write('<div class="report-title">'+this.esc(lead.leadNo||lead.id)+'<small>Lead Report</small></div>');
        win.document.write('</div>');
        win.document.write('<div class="report-meta">');
        win.document.write('<span>Generated: '+dateStr+' '+timeStr+'</span>');
        try { var u = (VT && VT.Auth && VT.Auth.user) ? VT.Auth.user : null; if (u) { win.document.write('<span>By: '+this.esc(u.name||u.email||'')+'</span>'); } } catch(e){}
        win.document.write('<span>Status: <span class="badge badge-'+stageClass+'">'+(lead.status||'New')+'</span></span>');
        win.document.write('<span>Stage: '+(lead.stage||'New')+'</span>');
        win.document.write('</div>');
        win.document.write('<div class="report-body">');
        win.document.write('<div class="field"><div class="label">Contact Person</div><div class="value">'+this.esc(lead.contactPerson||lead.name||'-')+'</div></div>');
        win.document.write('<div class="field"><div class="label">Company / Business</div><div class="value">'+this.esc(lead.company||'-')+'</div></div>');
        win.document.write('<div class="field"><div class="label">Phone</div><div class="value">'+this.esc(lead.phone||'-')+'</div></div>');
        win.document.write('<div class="field"><div class="label">Email</div><div class="value">'+this.esc(lead.email||'-')+'</div></div>');
        win.document.write('<div class="field"><div class="label">Source</div><div class="value">'+this.esc(lead.source||'-')+'</div></div>');
        win.document.write('<div class="field"><div class="label">Industry</div><div class="value">'+this.esc(lead.industry||'-')+'</div></div>');
        win.document.write('<div class="field"><div class="label">Expected Value</div><div class="value">'+this.formatCurrency(lead.expectedValue||0)+'</div></div>');
        win.document.write('<div class="field"><div class="label">Priority</div><div class="value">'+(lead.priority||'Medium')+'</div></div>');
        win.document.write('<div class="field"><div class="label">Assigned To</div><div class="value">'+this.esc(lead.assignee||lead.leadOwner||'-')+'</div></div>');
        win.document.write('<div class="field"><div class="label">Created Date</div><div class="value">'+((lead.createdAt||'').substring(0,10)||'-')+'</div></div>');
        win.document.write('<div class="field full"><div class="label">Address</div><div class="value">'+this.esc(lead.address||'-')+'</div></div>');
        win.document.write('<div class="field full"><div class="label">Requirement / Notes</div><div class="value">'+this.esc((lead.requirement||lead.notes||'').substring(0,500)||'-')+'</div></div>');
        win.document.write('</div>');
        win.document.write('<div class="report-footer">VISHAK TECH Enterprise Portal — This is a system-generated document</div>');
        win.document.write('</body></html>');
        win.document.close();
        win.focus();
        this.addActivity(id, 'PDF generated');
        VT.Utils.showToast('Lead PDF preview opened', 'success');
    },

    exportLead: function(id) {
        var lead = this.getLeadById(id);
        if (!lead) { VT.Utils.showToast('Lead not found', 'danger'); return; }
        var csv = 'Field,Value\n';
        csv += 'Lead No,' + (lead.leadNo || lead.id) + '\n';
        csv += 'Name,' + (lead.contactPerson || lead.name || '') + '\n';
        csv += 'Company,' + (lead.company || '') + '\n';
        csv += 'Phone,' + (lead.phone || '') + '\n';
        csv += 'Email,' + (lead.email || '') + '\n';
        csv += 'Stage,' + (lead.stage || '') + '\n';
        csv += 'Source,' + (lead.source || '') + '\n';
        csv += 'Priority,' + (lead.priority || '') + '\n';
        csv += 'Expected Value,' + (lead.expectedValue || 0) + '\n';
        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'Lead_' + (lead.leadNo || lead.id) + '.csv';
        link.click();
        URL.revokeObjectURL(link.href);
        this.addActivity(id, 'Lead exported');
        VT.Utils.showToast('Lead exported as CSV', 'success');
    },

    createQuotation: function(id) {
        var lead = this.getLeadById(id);
        if (!lead) { VT.Utils.showToast('Lead not found', 'danger'); return; }
        window.location.href = 'quotation-create.html?leadId=' + encodeURIComponent(id) +
            '&customer=' + encodeURIComponent(lead.contactPerson || lead.name || '') +
            '&company=' + encodeURIComponent(lead.company || '') +
            '&email=' + encodeURIComponent(lead.email || '') +
            '&phone=' + encodeURIComponent(lead.phone || '');
    },

    createSalesOrder: function(id) {
        var lead = this.getLeadById(id);
        if (!lead) { VT.Utils.showToast('Lead not found', 'danger'); return; }
        window.location.href = 'sales-order-create.html?leadId=' + encodeURIComponent(id) +
            '&customer=' + encodeURIComponent(lead.contactPerson || lead.name || '') +
            '&company=' + encodeURIComponent(lead.company || '') +
            '&email=' + encodeURIComponent(lead.email || '') +
            '&phone=' + encodeURIComponent(lead.phone || '');
    },

    addFollowupAuto: function(leadId, mode, notes, status) {
        var lead = this.getLeadById(leadId);
        if (!lead) return;
        var fus = VT.DataHub.getFollowups();
        var fup = {
            id: 'FUP-' + new Date().getTime(),
            leadId: leadId,
            leadNo: lead.leadNo || lead.id,
            customerName: lead.contactPerson || lead.name || '',
            company: lead.company || '',
            mode: mode || 'Other',
            notes: notes || '',
            status: status || 'Completed',
            followupDate: new Date().toISOString().split('T')[0],
            created: new Date().toISOString()
        };
        fus.push(fup);
        VT.DataHub.saveFollowups(fus);
        this.addActivity(leadId, 'Follow-up ' + mode + ' created');
    },

    /* =========== EXPORT =========== */
    initExport: function() {
        if (typeof VT.Export === 'undefined' || !VT.Export.injectStyles) return;
        VT.Export.injectStyles();
        var container = document.getElementById('leadsExportDD');
        if (!container) return;

        container.innerHTML = VT.Export.dropdownHTML('leadsExportMenu');
        var menu = container.querySelector('.export-menu');
        if (!menu) return;
        menu.innerHTML =
            '<a href="#" data-export-action="pdf-summary"><i class="fas fa-file-pdf"></i> PDF Summary</a>' +
            '<a href="#" data-export-action="pdf-detailed"><i class="fas fa-file-pdf"></i> PDF Detailed</a>' +
            '<a href="#" data-export-action="excel"><i class="fas fa-file-excel"></i> Export Excel</a>' +
            '<a href="#" data-export-action="csv"><i class="fas fa-file-csv"></i> Export CSV</a>' +
            '<a href="#" data-export-action="print"><i class="fas fa-print"></i> Print</a>';
    },

    doExport: function(format) {
        var filtered = this.getFiltered();
        if (filtered.length === 0) { VT.Utils.showToast('No leads to export', 'warning'); return; }

        var headers = ['Lead No', 'Description', 'Contact Name', 'Company', 'Phone', 'Email', 'Source', 'Industry', 'Priority', 'Stage', 'Expected Value', 'Status', 'Created Date', 'Assigned To'];
        var rows = [];
        for (var i = 0; i < filtered.length; i++) {
            var d = filtered[i];
            rows.push([
                d.leadNo || d.id,
                d.requirement || '',
                d.name || d.contactPerson || '',
                d.company || '',
                d.phone || '',
                d.email || '',
                d.source || '',
                d.industry || '',
                d.priority || '',
                d.stage || '',
                d.expectedValue || d.expectedRevenue || 0,
                d.status || 'new',
                (d.createdAt || '').substring(0, 10) || '',
                d.assignee || ''
            ]);
        }

        var filename = 'Leads_' + new Date().toISOString().split('T')[0];

        switch (format) {
            case 'csv': {
                var allRows = [headers].concat(rows);
                if (typeof VT.Export !== 'undefined' && VT.Export.csv) {
                    var csv = '';
                    for (var r = 0; r < allRows.length; r++) {
                        csv += allRows[r].map(function(v) { return '"' + String(v || '').replace(/"/g, '""') + '"'; }).join(',') + '\r\n';
                    }
                    var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
                    var link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = filename + '.csv';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(link.href);
                }
                VT.Utils.showToast('Leads exported to CSV', 'success');
                break;
            }
            case 'excel': {
                var allRows2 = [headers].concat(rows);
                if (typeof VT.Export !== 'undefined' && VT.Export.excel) {
                    VT.Export.excel(allRows2, 'Leads', filename + '.xlsx');
                }
                VT.Utils.showToast('Leads exported to Excel', 'success');
                break;
            }
            case 'pdf-summary': {
                if (typeof VT.Export !== 'undefined' && VT.Export.pdf) {
                    var filterInfo = [];
                    if (this.filterStage) filterInfo.push('Stage: ' + this.filterStage);
                    if (this.filterSource) filterInfo.push('Source: ' + this.filterSource);
                    if (this.filterPriority) filterInfo.push('Priority: ' + this.filterPriority);
                    if (this.filterOwner) filterInfo.push('Owner: ' + this.filterOwner);
                    if (this.filterDateFrom || this.filterDateTo) filterInfo.push('Date: ' + (this.filterDateFrom||'...') + ' to ' + (this.filterDateTo||'...'));
                    if (this.searchQuery) filterInfo.push('Search: "' + this.searchQuery + '"');
                    var user = '';
                    try {
                        user = (VT && VT.Auth && VT.Auth.user) ? (VT.Auth.user.name || VT.Auth.user.email || '') : '';
                    } catch(e) {}
                    var footerText = 'VISHAK TECH Enterprise Portal — Generated by Leads CRM';
                    if (user) footerText += ' | ' + user;
                    if (filterInfo.length > 0) footerText += ' | Filters: ' + filterInfo.join(', ');
                    VT.Export.pdf({
                        title: 'Leads Summary Report',
                        headers: headers,
                        rows: rows,
                        filename: filename + '_Summary.pdf',
                        footer: footerText
                    });
                }
                VT.Utils.showToast('Leads summary exported to PDF', 'success');
                break;
            }
            case 'pdf-detailed': {
                this._exportDetailedPDF(filtered);
                break;
            }
            case 'print': {
                if (typeof VT.Export !== 'undefined' && VT.Export.print) {
                    VT.Export.print('.sales-table-wrap', 'Leads');
                } else {
                    window.print();
                }
                break;
            }
        }
    },

    _exportDetailedPDF: function(leads) {
        if (typeof jspdf === 'undefined' && typeof window.jspdf === 'undefined') {
            VT.Utils.showToast('PDF export requires jsPDF library.', 'warning');
            return;
        }
        try {
            var doc = new (window.jspdf || jspdf).jsPDF('l', 'mm', 'a4');
            var pw = doc.internal.pageSize.getWidth();
            var ph = doc.internal.pageSize.getHeight();
            var m = 12, font = 'helvetica', green = [11,74,61], muted = [140,140,140];
            var cw = pw - 2 * m;

            // Get user info
            var userStr = '';
            try { var u = (VT && VT.Auth && VT.Auth.user) ? VT.Auth.user : null; if (u) userStr = ' | ' + (u.name || u.email || ''); } catch(e) {}

            function pageHeader() {
                var y = m;
                doc.setFillColor(green[0], green[1], green[2]);
                doc.roundedRect(m, y, 22, 13, 1.5, 1.5, 'F');
                doc.setFont(font,'bold'); doc.setFontSize(9); doc.setTextColor(255);
                doc.text('VT', m+11, y+8, {align:'center'});
                doc.setFont(font,'bold'); doc.setFontSize(12);
                doc.setTextColor(green[0], green[1], green[2]); doc.text('VISHAK TECH', m+26, y+8.5);
                doc.setFont(font,'bold'); doc.setFontSize(14); doc.setTextColor(40);
                doc.text('Leads Detailed Register', pw-m, y+8.5, {align:'right'});
                y += 16;
                doc.setDrawColor(green[0], green[1], green[2]); doc.setLineWidth(0.5);
                doc.line(m, y, pw-m, y); y += 4.5;
                doc.setFont(font,'normal'); doc.setFontSize(7); doc.setTextColor(muted[0], muted[1], muted[2]);
                var now = new Date();
                var ds = String(now.getDate()).padStart(2,'0')+'-'+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][now.getMonth()]+'-'+now.getFullYear();
                var ts = String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
                doc.text('Generated: '+ds+' '+ts+userStr+'  •  Records: '+leads.length, m, y+1);
                y += 7;
                return y;
            }

            function pageFooter() {
                var totalPages = doc.internal.getNumberOfPages();
                var currentPage = doc.internal.getCurrentPageInfo().pageNumber;
                doc.setFont(font,'normal'); doc.setFontSize(7); doc.setTextColor(muted[0], muted[1], muted[2]);
                doc.text('Page '+currentPage+' of '+totalPages, pw-m, ph-8, {align:'right'});
                doc.text('VISHAK TECH Enterprise Portal — Leads Detailed Register', m, ph-8);
                doc.setDrawColor(green[0], green[1], green[2]); doc.setLineWidth(0.3);
                doc.line(m, ph-10, pw-m, ph-10);
            }

            function drawField(l, v, x, yPos) {
                doc.setFont(font,'bold'); doc.setFontSize(7); doc.setTextColor(muted[0], muted[1], muted[2]);
                doc.text(l, x, yPos);
                doc.setFont(font,'normal'); doc.setFontSize(9); doc.setTextColor(40);
                var val = String(v||'-');
                if (val.length > 55) val = val.substring(0,52)+'...';
                doc.text(val, x, yPos+3.5);
            }

            var yPos = pageHeader();
            for (var i = 0; i < leads.length; i++) {
                var d = leads[i];
                if (yPos + 70 > ph - 15) {
                    pageFooter();
                    doc.addPage(); yPos = pageHeader();
                }
                doc.setFillColor(green[0], green[1], green[2]); doc.setTextColor(255);
                doc.rect(m, yPos, cw, 7, 'F');
                doc.setFont(font,'bold'); doc.setFontSize(10);
                doc.text('#'+(i+1)+'  '+(d.leadNo||d.id)+' - '+(d.name||d.contactPerson||''), m+4, yPos+5);
                yPos += 10;

                drawField('Contact Name', d.name||d.contactPerson, m+3, yPos); yPos += 7;
                drawField('Company', d.company, m+3, yPos);
                drawField('Phone', d.phone, pw/2+3, yPos);
                yPos += 7;
                drawField('Email', d.email, m+3, yPos);
                drawField('Source', d.source, pw/2+3, yPos);
                yPos += 7;
                drawField('Industry', d.industry, m+3, yPos);
                drawField('Stage', d.stage||'New', pw/2+3, yPos);
                yPos += 7;
                drawField('Expected Value', VT.Utils.formatCurrency(d.expectedValue||0), m+3, yPos);
                drawField('Priority', d.priority||'Medium', pw/2+3, yPos);
                yPos += 7;
                drawField('Assigned To', d.assignee||'-', m+3, yPos);
                drawField('Status', d.status||'new', pw/2+3, yPos);
                yPos += 7;
                drawField('Requirement/Notes', (d.requirement||d.notes||'').substring(0,80), m+3, yPos);
                drawField('Address', (d.address||'').substring(0,40), pw/2+3, yPos);
                yPos += 7;
                yPos += 2;
                doc.setDrawColor(218,221,225); doc.setLineWidth(0.3);
                doc.line(m+3, yPos, pw-m-3, yPos);
                yPos += 5;
            }
            // Write footer on final page
            pageFooter();
            doc.save('Leads_Detailed_'+new Date().toISOString().split('T')[0]+'.pdf');
            VT.Utils.showToast('Leads detailed report exported to PDF', 'success');
        } catch (e) {
            console.error('[Leads._exportDetailedPDF]', e);
            VT.Utils.showToast('PDF export error: '+e.message, 'error');
        }
    },

    toggleColVis: function(btn) {
        VT.ColumnManager.toggleMenu('vlTable', btn);
    },

    /* ===== BULK ACTIONS ===== */
    getSelectedIds: function() {
        var checked = document.querySelectorAll('.vl-checkbox:checked');
        var ids = [];
        for (var i = 0; i < checked.length; i++) ids.push(checked[i].value);
        return ids;
    },

    updateBulkActionBar: function() {
        var ids = this.getSelectedIds();
        var bar = document.getElementById('bulkActionBar');
        if (!bar) return;
        var count = bar.querySelector('.bulk-count');
        if (count) count.textContent = ids.length + ' selected';
        bar.classList.toggle('show', ids.length > 0);
        
        // Toggle bulk buttons based on current tab
        var currentTab = this.filterStatus;
        var isDeletedTab = currentTab === 'deleted';
        var isArchivedTab = currentTab === 'archived';
        
        var restoreBtn = document.getElementById('bulkRestoreBtn');
        var permanentDelBtn = document.getElementById('bulkPermanentDeleteBtn');
        var deleteBtn = document.getElementById('bulkDeleteBtn');
        var assignBtn = document.getElementById('bulkAssignBtn');
        var stageBtn = document.getElementById('bulkStageBtn');
        var archiveBtn = document.getElementById('bulkArchiveBtn');
        var exportBtn = document.getElementById('bulkExportBtn');
        
        if (restoreBtn) restoreBtn.style.display = (isDeletedTab || isArchivedTab) ? '' : 'none';
        if (permanentDelBtn) permanentDelBtn.style.display = isDeletedTab ? '' : 'none';
        if (deleteBtn) deleteBtn.style.display = isDeletedTab ? 'none' : '';
        if (assignBtn) assignBtn.style.display = (isDeletedTab || isArchivedTab) ? 'none' : '';
        if (stageBtn) stageBtn.style.display = (isDeletedTab || isArchivedTab) ? 'none' : '';
        if (archiveBtn) archiveBtn.style.display = (isDeletedTab || isArchivedTab) ? 'none' : '';
        if (exportBtn) exportBtn.style.display = '';

        // Select all handler
        var selectAll = document.getElementById('selectAll');
        if (selectAll) {
            selectAll.onchange = function() {
                var checked = this.checked;
                document.querySelectorAll('.vl-checkbox').forEach(function(el) { el.checked = checked; });
                if (typeof VT.Leads !== 'undefined') VT.Leads.updateBulkActionBar();
            };
        }
        // Individual checkbox handler
        document.querySelectorAll('.vl-checkbox').forEach(function(el) {
            el.onchange = function() { if (typeof VT.Leads !== 'undefined') VT.Leads.updateBulkActionBar(); };
        });
    },

    bulkDelete: function() {
        var ids = this.getSelectedIds();
        if (ids.length === 0) {
            VT.Utils.showToast('Please select at least one lead.', 'warning');
            return;
        }
        var self = this;
        if (typeof VT.Confirm !== 'undefined') {
            VT.Confirm.show({
                title: 'Delete Leads',
                message: 'Delete ' + ids.length + ' selected leads? They will be moved to trash.',
                confirmText: 'Delete',
                type: 'danger',
                onConfirm: function() {
                    for (var i = 0; i < self.data.length; i++) {
                        if (ids.indexOf(self.data[i].id) !== -1) self.data[i].status = 'deleted';
                    }
                    self.save(); self.render();
                    VT.Utils.showToast(ids.length + ' leads moved to trash', 'success');
                }
            });
        } else {
            if (!confirm('Delete ' + ids.length + ' selected leads?')) return;
            for (var i = 0; i < this.data.length; i++) {
                if (ids.indexOf(this.data[i].id) !== -1) this.data[i].status = 'deleted';
            }
            this.save(); this.render();
            VT.Utils.showToast(ids.length + ' leads moved to trash', 'success');
        }
    },

    bulkRestore: function() {
        var ids = this.getSelectedIds();
        if (ids.length === 0) {
            VT.Utils.showToast('Please select at least one lead.', 'warning');
            return;
        }
        var self = this;
        if (typeof VT.Confirm !== 'undefined') {
            VT.Confirm.show({
                title: 'Restore Selected Leads?',
                message: 'Restore ' + ids.length + ' selected leads to Active?',
                confirmText: 'Restore',
                type: 'primary',
                onConfirm: function() {
                    self._doBulkRestore(ids);
                }
            });
        } else {
            if (!confirm('Restore ' + ids.length + ' selected leads?')) return;
            self._doBulkRestore(ids);
        }
    },

    _doBulkRestore: function(ids) {
        for (var i = 0; i < this.data.length; i++) {
            if (ids.indexOf(this.data[i].id) !== -1) {
                this.data[i].status = 'new';
                this.data[i].updatedAt = new Date().toISOString();
                delete this.data[i].deletedAt;
            }
        }
        this.save();
        this.render();
        this.clearSelection();
        VT.Utils.showToast(ids.length + ' leads restored to Active', 'success');
        try { document.dispatchEvent(new CustomEvent('VT:DataUpdated', { bubbles: true, detail: { module: 'leads' } })); } catch(e) {}
    },

    bulkPermanentDelete: function() {
        var ids = this.getSelectedIds();
        if (ids.length === 0) {
            VT.Utils.showToast('Please select at least one lead.', 'warning');
            return;
        }
        var self = this;
        if (typeof VT.Confirm !== 'undefined') {
            VT.Confirm.show({
                title: 'Delete Selected Permanently?',
                message: 'This action cannot be undone. ' + ids.length + ' selected leads will be permanently removed.',
                confirmText: 'Delete Permanently',
                type: 'danger',
                onConfirm: function() {
                    self._doBulkPermanentDelete(ids);
                }
            });
        } else {
            if (!confirm('Permanently delete ' + ids.length + ' selected leads? This cannot be undone.')) return;
            self._doBulkPermanentDelete(ids);
        }
    },

    _doBulkPermanentDelete: function(ids) {
        var count = 0;
        for (var i = this.data.length - 1; i >= 0; i--) {
            if (ids.indexOf(this.data[i].id) !== -1) {
                this.data.splice(i, 1);
                count++;
            }
        }
        this.save();
        this.render();
        this.clearSelection();
        VT.Utils.showToast(count + ' leads permanently deleted', 'success');
        try { document.dispatchEvent(new CustomEvent('VT:DataUpdated', { bubbles: true, detail: { module: 'leads' } })); } catch(e) {}
    },

    bulkAssignOwner: function() {
        var ids = this.getSelectedIds();
        if (ids.length === 0) return;
        var newOwner = prompt('Enter owner name to assign to ' + ids.length + ' leads:');
        if (!newOwner || !newOwner.trim()) return;
        for (var i = 0; i < this.data.length; i++) {
            if (ids.indexOf(this.data[i].id) !== -1) this.data[i].assignee = newOwner.trim();
        }
        this.save(); this.render();
        VT.Utils.showToast('Owner assigned to ' + ids.length + ' leads', 'success');
    },

    bulkChangeStage: function() {
        var ids = this.getSelectedIds();
        if (ids.length === 0) return;
        var stages = ['new', 'contacted', 'qualified', 'proposal', 'proposal sent', 'negotiation', 'won', 'lost'];
        var stageStr = prompt('Enter new stage for ' + ids.length + ' leads:\n' + stages.join(', '));
        if (!stageStr || !stageStr.trim()) return;
        stageStr = stageStr.trim().toLowerCase();
        if (stages.indexOf(stageStr) === -1) { VT.Utils.showToast('Invalid stage', 'warning'); return; }
        for (var i = 0; i < this.data.length; i++) {
            if (ids.indexOf(this.data[i].id) !== -1) {
                this.data[i].stage = stageStr;
                this.data[i].updatedAt = new Date().toISOString();
            }
        }
        this.save(); this.render();
        VT.Utils.showToast('Stage changed for ' + ids.length + ' leads', 'success');
    },

    bulkArchive: function() {
        var ids = this.getSelectedIds();
        if (ids.length === 0) return;
        for (var i = 0; i < this.data.length; i++) {
            if (ids.indexOf(this.data[i].id) !== -1) this.data[i].status = 'archived';
        }
        this.save(); this.render();
        VT.Utils.showToast(ids.length + ' leads archived', 'success');
    },

    bulkExport: function() {
        var ids = this.getSelectedIds();
        if (ids.length === 0) return;
        // Filter data to only selected IDs then export
        var allData = this.data;
        this.data = this.data.filter(function(d) { return ids.indexOf(d.id) !== -1; });
        this.doExport('excel');
        this.data = allData;
    },

    switchTab: function(tab) {
        var tabs = document.querySelectorAll('.sales-tab');
        for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
        if (tabs[tab]) tabs[tab].classList.add('active');
    },

    switchSubtab: function(tab) {
        var subtabs = document.querySelectorAll('.segmented-option');
        for (var i = 0; i < subtabs.length; i++) subtabs[i].classList.remove('active');
        if (subtabs[tab]) subtabs[tab].classList.add('active');
        var tabMap = ['', 'archived', 'deleted'];
        this.filterStatus = tabMap[tab] || '';
        this.currentPage = 1;
        this.clearSelection();
        this.render();
        this._saveListState();
    },

    clearSelection: function() {
        var cbs = document.querySelectorAll('.vl-checkbox');
        for (var i = 0; i < cbs.length; i++) cbs[i].checked = false;
        var selectAll = document.getElementById('selectAll');
        if (selectAll) selectAll.checked = false;
        this.updateBulkActionBar();
    },

    /* =========== PIPELINE / KANBAN =========== */
    initPipeline: function() {
        var params = new URLSearchParams(window.location.search);
        var focusId = params.get('id');
        this.load();
        this._initClickDelegation();
        this.renderPipeline(focusId);
    },

    renderPipeline: function(focusId) {
        var container = document.getElementById('pipelineContainer');
        if (!container) return;

        var stages = [
            { key: 'new', label: 'New', color: '#6b7280', icon: 'fa-star' },
            { key: 'contacted', label: 'Contacted', color: '#2563eb', icon: 'fa-phone' },
            { key: 'qualified', label: 'Qualified', color: '#065f46', icon: 'fa-check-circle' },
            { key: 'proposal', label: 'Proposal', color: '#d97706', icon: 'fa-file-invoice' },
            { key: 'proposal sent', label: 'Proposal Sent', color: '#d97706', icon: 'fa-paper-plane' },
            { key: 'negotiation', label: 'Negotiation', color: '#9d174d', icon: 'fa-handshake' },
            { key: 'won', label: 'Won', color: '#059669', icon: 'fa-trophy' },
            { key: 'lost', label: 'Lost', color: '#dc2626', icon: 'fa-times-circle' }
        ];

        // Group leads by stage (excluding deleted)
        var grouped = {};
        for (var si = 0; si < stages.length; si++) grouped[stages[si].key] = [];
        for (var i = 0; i < this.data.length; i++) {
            var d = this.data[i];
            if (d.status === 'deleted' || d.status === 'archived' || d.status === 'converted') continue;
            var stageKey = (d.stage || 'new').toLowerCase();
            if (!grouped[stageKey]) {
                // Map to nearest known stage
                if (stageKey.indexOf('proposal') !== -1) stageKey = 'proposal';
                else if (stageKey === '' || stageKey === 'inactive') stageKey = 'new';
                else stageKey = 'new';
            }
            grouped[stageKey].push(d);
        }

        // Sort each pipeline column by expected value desc
        for (var key in grouped) {
            grouped[key].sort(function(a, b) {
                return (b.expectedValue || b.expectedRevenue || 0) - (a.expectedValue || a.expectedRevenue || 0);
            });
        }

        var html = '<div class="pipeline-header">' +
            '<h2><i class="fas fa-columns"></i> Lead Pipeline <span class="pipeline-subtitle">Drag & drop leads between stages</span></h2>' +
            '<div class="pipeline-actions">' +
            '<button class="btn btn-secondary btn-sm" onclick="VT.Leads.toggleCalendarView()" style="gap:6px"><i class="fas fa-calendar-alt"></i> Calendar</button>' +
            '<a href="leads.html" class="btn btn-ghost btn-sm"><i class="fas fa-arrow-left"></i> Back to List</a></div>' +
            '</div>' +
            '<div class="pipeline-board" id="pipelineBoard">';

        for (var si = 0; si < stages.length; si++) {
            var stage = stages[si];
            var stageLeads = grouped[stage.key] || [];
            var totalValue = 0;
            stageLeads.forEach(function(l) { totalValue += Number(l.expectedValue || l.expectedRevenue || 0); });

            html += '<div class="pipeline-column" data-stage="' + stage.key + '">' +
                '<div class="pipeline-column-header" style="border-bottom-color:' + stage.color + '">' +
                    '<div class="pipeline-column-title">' +
                        '<i class="fas ' + stage.icon + '" style="color:' + stage.color + '"></i> ' +
                        '<span>' + stage.label + '</span>' +
                        '<span class="pipeline-count">' + stageLeads.length + '</span>' +
                    '</div>' +
                    '<div class="pipeline-value">' + this.formatCurrencyShort(totalValue) + '</div>' +
                '</div>' +
                '<div class="pipeline-column-body" data-stage="' + stage.key + '">';

            if (stageLeads.length === 0) {
                html += '<div class="pipeline-empty">No leads</div>';
            } else {
                for (var j = 0; j < stageLeads.length; j++) {
                    var l = stageLeads[j];
                    var initial = (l.contactPerson || l.name || 'L').charAt(0).toUpperCase();
                    var value = l.expectedValue || l.expectedRevenue || 0;
                    var priority = (l.priority || 'medium').toLowerCase();
                    var expClose = l.expectedCloseDate ? this.formatDateShort(l.expectedCloseDate) : '';
                    var stageForSO = (l.stage || '').toLowerCase();
                    var menuItems = [
                        { heading: true, label: 'LEAD' },
                        { label: 'View Lead', icon: 'fa-eye', action: 'view-lead', payload: l.id },
                        { label: 'Edit Lead', icon: 'fa-pen', action: 'edit-lead', payload: l.id },
                        { divider: true },
                        { heading: true, label: 'COMMUNICATION' },
                        { label: 'Add Follow-up', icon: 'fa-phone', action: 'create-followup', payload: l.id },
                        { label: 'Log Call', icon: 'fa-phone-alt', action: 'log-call', payload: l.id },
                        { label: 'Send Email', icon: 'fa-envelope', action: 'send-email', payload: l.id },
                        { label: 'Add Note', icon: 'fa-sticky-note', action: 'add-note', payload: l.id },
                        { label: 'Upload Attachment', icon: 'fa-paperclip', action: 'upload-attachment', payload: l.id },
                        { divider: true },
                        { heading: true, label: 'PIPELINE' },
                        { label: 'Move Stage', icon: 'fa-tag', action: 'change-stage', payload: l.id },
                        { label: 'Assign Owner', icon: 'fa-user-cog', action: 'assign-owner', payload: l.id },
                        { label: 'Change Priority', icon: 'fa-flag', action: 'change-priority', payload: l.id },
                        { divider: true },
                        { heading: true, label: 'DOCUMENTS' },
                        { label: 'Generate PDF', icon: 'fa-file-pdf', action: 'generate-pdf', payload: l.id },
                        { label: 'Export', icon: 'fa-download', action: 'export-lead', payload: l.id },
                        { label: 'Duplicate', icon: 'fa-copy', action: 'duplicate', payload: l.id },
                        { divider: true },
                        { heading: true, label: 'CONVERSION' }
                    ];
                    if (l.status !== 'converted' && (l.stage === 'qualified' || l.stage === 'won' || l.stage === 'negotiation')) {
                        menuItems.push({ label: 'Convert to Client', icon: 'fa-user-tie', action: 'convert-client', payload: l.id });
                    }
                    menuItems.push(
                        { label: 'Create CPR', icon: 'fa-clipboard-list', action: 'convert-cpr', payload: l.id },
                        { label: 'Create Quotation', icon: 'fa-file-invoice', action: 'create-quotation', payload: l.id }
                    );
                    if (stageForSO === 'won') {
                        menuItems.push({ label: 'Create Sales Order', icon: 'fa-cart-shopping', action: 'create-sales-order', payload: l.id });
                    }
                    menuItems.push(
                        { divider: true },
                        { heading: true, label: 'STATUS' },
                        { label: 'Archive', icon: 'fa-archive', action: 'archive', payload: l.id },
                        { label: 'Delete', icon: 'fa-trash', className: 'text-danger', action: 'delete-lead', payload: l.id }
                    );
                    var menuHtml = this._safeActionMenu(menuItems);
                    html += '<div class="pipeline-card" draggable="true" data-id="' + l.id + '" data-stage="' + stage.key + '">' +
                        '<div class="pipeline-card-header">' +
                            '<div class="pipeline-card-avatar">' + initial + '</div>' +
                            '<div class="pipeline-card-info">' +
                                '<div class="pipeline-card-name">' + this.esc(l.contactPerson || l.name || 'Unnamed') + '</div>' +
                                '<div class="pipeline-card-company">' + this.esc(l.company || '-') + '</div>' +
                            '</div>' +
                            '<div class="pipeline-card-menu">' + menuHtml + '</div>' +
                        '</div>' +
                        '<div class="pipeline-card-id-row">' +
                            '<span class="pipeline-card-id">' + this.esc(l.leadNo || l.id) + '</span>' +
                        '</div>' +
                        (value > 0 ? '<div class="pipeline-card-value-row">' + this.formatCurrency(value) + '</div>' : '') +
                        '<div class="pipeline-card-meta">' +
                            '<span><i class="fas fa-tag"></i> ' + this.esc(l.source || 'Direct') + '</span>' +
                            (l.assignee ? '<span><i class="fas fa-user"></i> ' + this.esc(l.assignee) + '</span>' : '') +
                            (expClose ? '<span><i class="fas fa-calendar"></i> ' + expClose + '</span>' : '') +
                        '</div>' +
                        '<div class="pipeline-card-priority ' + priority + '"></div>' +
                    '</div>';
                }
            }

            html += '</div></div>';
        }

        html += '</div>';
        container.innerHTML = html;

        // Focus on a specific lead if id is provided
        if (focusId) {
            setTimeout(function() {
                var card = container.querySelector('[data-id="' + focusId + '"]');
                if (card) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    card.style.boxShadow = '0 0 0 3px #0B4A3D';
                    setTimeout(function() { card.style.boxShadow = ''; }, 2000);
                }
            }, 300);
        }

        this._initPipelineDragDrop();
    },


    /* ===== CALENDAR VIEW FOR FOLLOW-UPS ===== */
    _calendarViewActive: false,
    _calendarDate: null,

    toggleCalendarView: function() {
        this._calendarViewActive = !this._calendarViewActive;
        if (this._calendarViewActive) {
            this._calendarDate = new Date();
            this.renderCalendar();
        } else {
            var container = document.getElementById('pipelineContainer');
            if (container) this.renderPipeline(this.getFocusId());
        }
    },

    renderCalendar: function() {
        var container = document.getElementById('pipelineContainer');
        if (!container) return;

        // Load all follow-ups and related leads
        var followups = VT.DataHub.getFollowups();
        this.load();
        var leads = this.data;

        var currentDate = this._calendarDate || new Date();
        var year = currentDate.getFullYear();
        var month = currentDate.getMonth();
        var monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];

        // Build a lookup: leadId -> lead
        var leadMap = {};
        for (var i = 0; i < leads.length; i++) {
            leadMap[leads[i].id] = leads[i];
            if (leads[i].leadNo) leadMap[leads[i].leadNo] = leads[i];
        }

        // Group follow-ups by date for this month
        var firstDay = new Date(year, month, 1);
        var lastDay = new Date(year, month + 1, 0);
        var daysInMonth = lastDay.getDate();
        var startDayOfWeek = firstDay.getDay(); // 0=Sun

        var followupsByDate = {};
        for (var f = 0; f < followups.length; f++) {
            var fu = followups[f];
            var fuDate = (fu.date || fu.followupDate || '').substring(0, 10);
            if (!fuDate) continue;
            var d = new Date(fuDate);
            if (d.getFullYear() === year && d.getMonth() === month) {
                if (!followupsByDate[fuDate]) followupsByDate[fuDate] = [];
                // Find lead for this follow-up
                var leadInfo = null;
                if (fu.leadId && leadMap[fu.leadId]) leadInfo = leadMap[fu.leadId];
                else if (fu.leadNo && leadMap[fu.leadNo]) leadInfo = leadMap[fu.leadNo];
                followupsByDate[fuDate].push({
                    fu: fu,
                    lead: leadInfo
                });
            }
        }

        // Check if a date has today's follow-ups or overdue
        var today = new Date();
        var todayStr = today.toISOString().split('T')[0];

        var html = '<div class="pipeline-header">' +
            '<h2><i class="fas fa-calendar-alt"></i> Follow-up Calendar <span class="pipeline-subtitle">View lead follow-ups by date</span></h2>' +
            '<div class="pipeline-actions">' +
                '<button class="btn btn-secondary btn-sm" onclick="VT.Leads.toggleCalendarView()"><i class="fas fa-columns"></i> Board View</button>' +
                '<a href="leads.html" class="btn btn-ghost btn-sm"><i class="fas fa-arrow-left"></i> Back to List</a>' +
            '</div>' +
        '</div>' +

        // Month navigation
        '<div class="cal-nav">' +
            '<button class="cal-nav-btn" onclick="VT.Leads._calendarNav(-1)" title="Previous month"><i class="fas fa-chevron-left"></i></button>' +
            '<div class="cal-nav-title">' + monthNames[month] + ' ' + year + '</div>' +
            '<button class="cal-nav-btn" onclick="VT.Leads._calendarNav(1)" title="Next month"><i class="fas fa-chevron-right"></i></button>' +
            '<button class="cal-today-btn" onclick="VT.Leads._calendarToday()"><i class="fas fa-calendar-day"></i> Today</button>' +
        '</div>' +

        // Calendar grid
        '<div class="cal-grid">' +
            '<div class="cal-row cal-header">' +
                '<div class="cal-cell cal-header-cell">Sun</div>' +
                '<div class="cal-cell cal-header-cell">Mon</div>' +
                '<div class="cal-cell cal-header-cell">Tue</div>' +
                '<div class="cal-cell cal-header-cell">Wed</div>' +
                '<div class="cal-cell cal-header-cell">Thu</div>' +
                '<div class="cal-cell cal-header-cell">Fri</div>' +
                '<div class="cal-cell cal-header-cell">Sat</div>' +
            '</div>';

        // Build day cells
        var dayCount = 1;
        var totalCells = startDayOfWeek + daysInMonth;
        var rows = Math.ceil(totalCells / 7);

        for (var r = 0; r < rows; r++) {
            html += '<div class="cal-row">';
            for (var c = 0; c < 7; c++) {
                var cellIdx = r * 7 + c;
                if (cellIdx < startDayOfWeek || dayCount > daysInMonth) {
                    html += '<div class="cal-cell cal-empty"></div>';
                } else {
                    var dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(dayCount).padStart(2, '0');
                    var dayFollowups = followupsByDate[dateStr] || [];
                    var isToday = dateStr === todayStr;
                    var hasFollowups = dayFollowups.length > 0;
                    var pendingCount = 0;
                    var overdueCount = 0;
                    var completedCount = 0;
                    for (var fd = 0; fd < dayFollowups.length; fd++) {
                        var st = (dayFollowups[fd].fu.status || 'pending').toLowerCase();
                        if (st === 'completed') completedCount++;
                        else if (st === 'overdue' || (st === 'pending' && dateStr < todayStr)) overdueCount++;
                        else pendingCount++;
                    }

                    html += '<div class="cal-cell cal-day' +
                        (isToday ? ' cal-today' : '') +
                        (hasFollowups ? ' cal-has-fu' : '') +
                        '" data-date="' + dateStr + '" onclick="VT.Leads._calendarShowDay(this.dataset.date)">' +
                        '<div class="cal-day-num">' + dayCount + '</div>' +
                        (hasFollowups ? '<div class="cal-day-dots">' +
                            (pendingCount > 0 ? '<span class="cal-dot cal-dot-pending" title="' + pendingCount + ' pending"></span>' : '') +
                            (overdueCount > 0 ? '<span class="cal-dot cal-dot-overdue" title="' + overdueCount + ' overdue"></span>' : '') +
                            (completedCount > 0 ? '<span class="cal-dot cal-dot-completed" title="' + completedCount + ' completed"></span>' : '') +
                        '</div>' : '') +
                    '</div>';
                    dayCount++;
                }
            }
            html += '</div>';
        }
        html += '</div>';

        // Day detail panel
        html += '<div class="cal-day-detail" id="calDayDetail" style="display:none"></div>';

        // Legend
        html += '<div class="cal-legend">' +
            '<span><span class="cal-dot cal-dot-pending"></span> Pending</span>' +
            '<span><span class="cal-dot cal-dot-overdue"></span> Overdue</span>' +
            '<span><span class="cal-dot cal-dot-completed"></span> Completed</span>' +
            '<span style="margin-left:16px"><i class="fas fa-info-circle" style="color:#6b7280;font-size:12px"></i> Click a date to view follow-ups</span>' +
        '</div>';

        container.innerHTML = html;
    },

    _calendarNav: function(delta) {
        if (!this._calendarDate) this._calendarDate = new Date();
        this._calendarDate.setMonth(this._calendarDate.getMonth() + delta);
        this.renderCalendar();
    },

    _calendarToday: function() {
        this._calendarDate = new Date();
        this.renderCalendar();
    },

    _calendarShowDay: function(dateStr) {
        var detailPanel = document.getElementById('calDayDetail');
        if (!detailPanel) return;

        // Highlight selected day
        var allDays = document.querySelectorAll('.cal-day');
        for (var i = 0; i < allDays.length; i++) allDays[i].classList.remove('cal-selected');
        var selected = document.querySelector('.cal-day[data-date="' + dateStr + '"]');
        if (selected) selected.classList.add('cal-selected');

        // Load follow-ups for this date
        var followups = VT.DataHub.getFollowups();
        this.load();
        var leads = this.data;

        var leadMap = {};
        for (var i = 0; i < leads.length; i++) {
            leadMap[leads[i].id] = leads[i];
            if (leads[i].leadNo) leadMap[leads[i].leadNo] = leads[i];
        }

        var dayFollowups = followups.filter(function(f) {
            var fd = (f.date || f.followupDate || '').substring(0, 10);
            return fd === dateStr;
        });

        var d = new Date(dateStr + 'T00:00:00');
        var dateLabel = d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        var html = '<div class="cal-day-header">' +
            '<h4><i class="fas fa-calendar-check"></i> ' + dateLabel + '</h4>' +
            '<span class="cal-day-count">' + dayFollowups.length + ' follow-up' + (dayFollowups.length !== 1 ? 's' : '') + '</span>' +
            '<button class="cal-close-btn" onclick="document.getElementById(\'calDayDetail\').style.display=\'none\'"><i class="fas fa-times"></i></button>' +
        '</div>';

        if (dayFollowups.length === 0) {
            html += '<div class="cal-empty-day">No follow-ups scheduled for this day.</div>';
        } else {
            html += '<div class="cal-fu-list">';
            for (var f = 0; f < dayFollowups.length; f++) {
                var fu = dayFollowups[f];
                var leadInfo = null;
                if (fu.leadId && leadMap[fu.leadId]) leadInfo = leadMap[fu.leadId];
                else if (fu.leadNo && leadMap[fu.leadNo]) leadInfo = leadMap[fu.leadNo];

                var statusDot = 'cal-dot-pending';
                var statusLabel = 'Pending';
                if ((fu.status || 'pending').toLowerCase() === 'completed') {
                    statusDot = 'cal-dot-completed';
                    statusLabel = 'Completed';
                } else if ((fu.status || 'pending').toLowerCase() === 'overdue' || (fu.date && fu.date < new Date().toISOString().split('T')[0])) {
                    statusDot = 'cal-dot-overdue';
                    statusLabel = 'Overdue';
                }

                html += '<div class="cal-fu-item" onclick="VT.Leads._calendarOpenLead(\'' + (fu.leadId || '') + '\')">' +
                    '<div class="cal-fu-left">' +
                        '<span class="cal-dot ' + statusDot + '"></span>' +
                        '<div class="cal-fu-info">' +
                            '<div class="cal-fu-title">' + this.esc(fu.title || fu.mode || 'Follow-up') + '</div>' +
                            '<div class="cal-fu-lead">' + (leadInfo ? this.esc(leadInfo.name || leadInfo.contactPerson || 'Unknown') : 'Unknown Lead') +
                                (leadInfo && leadInfo.leadNo ? ' (' + this.esc(leadInfo.leadNo) + ')' : '') +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="cal-fu-right">' +
                        '<span class="cal-fu-status ' + statusDot + '">' + statusLabel + '</span>' +
                        (leadInfo && leadInfo.company ? '<span class="cal-fu-company">' + this.esc(leadInfo.company) + '</span>' : '') +
                    '</div>' +
                '</div>';
            }
            html += '</div>';
        }

        detailPanel.innerHTML = html;
        detailPanel.style.display = 'block';
    },

    _calendarOpenLead: function(leadId) {
        if (leadId) {
            window.location.href = 'lead-overview.html?id=' + encodeURIComponent(leadId);
        }
    },

    /* ===== Populate Owner Filter Dropdown ===== */
    populateOwnerFilter: function() {
        var sel = document.getElementById('filterOwner');
        if (!sel) return;
        var owners = {};
        for (var i = 0; i < this.data.length; i++) {
            var d = this.data[i];
            if (d.owner || d.assignee) {
                owners[d.owner || d.assignee] = true;
            }
        }
        var names = Object.keys(owners).sort();
        var html = '<option value="">All Owners</option>';
        for (var j = 0; j < names.length; j++) {
            html += '<option value="' + this.esc(names[j]) + '">' + this.esc(names[j]) + '</option>';
        }
        sel.innerHTML = html;
    },

    /* ===== PROFILE / VIEW PAGE ===== */
    switchViewTab: function(tabId) {
        var tabs = document.querySelectorAll('.view-tab');
        for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
        var activeTab = document.querySelector('.view-tab[data-tab="' + tabId + '"]');
        if (activeTab) activeTab.classList.add('active');
        var content = document.getElementById('viewTabContent');
        if (!content) return;
        var params = new URLSearchParams(window.location.search);
        var id = params.get('id');
        if (!id) return;
        this.load();
        var lead = null;
        for (var i = 0; i < this.data.length; i++) {
            if (this.data[i].id === id) { lead = this.data[i]; break; }
        }
        if (!lead) return;
        var html = '';
        switch (tabId) {
            case 'overview': html = this.renderOverviewTab(lead); break;
            case 'contacts': html = this.renderContactsTab(lead); break;
            case 'followups': html = this.renderFollowupsTab(lead); break;
            case 'purchase-requests': html = this.renderPurchaseRequestsTab(lead); break;
            case 'quotations': html = this.renderQuotationsTab(lead); break;
            case 'notes': html = this.renderNotesTab(lead); break;
            case 'timeline': html = this.renderTimelineTab(lead); break;
            case 'documents': html = this.renderDocumentsTab(lead); break;
            case 'activities': html = this.renderActivitiesTab(lead); break;
            default: html = this.renderOverviewTab(lead);
        }
        content.innerHTML = html;
    },

    renderOverviewTab: function(lead) {
        var html = '<div class="sales-info-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">';
        // Left column - Lead Information
        html += '<div class="info-card"><h4><i class="fas fa-info-circle"></i> Lead Information</h4>';
        html += '<div class="info-row"><span class="label">Lead Number</span><span class="sales-detail-value">' + this.esc(lead.leadNo || '-') + '</span></div>';
        html += '<div class="info-row"><span class="label">Business Name</span><span class="sales-detail-value">' + this.esc(lead.company || lead.name || '-') + '</span></div>';
        html += '<div class="info-row"><span class="label">Lead Source</span><span class="sales-detail-value">' + this.esc(lead.source || '-') + '</span></div>';
        html += '<div class="info-row"><span class="label">Industry</span><span class="sales-detail-value">' + this.esc(lead.industry || '-') + '</span></div>';
        html += '<div class="info-row"><span class="label">Stage</span><span class="sales-detail-value">' + this.stageBadge(lead.stage || 'new') + '</span></div>';
        html += '<div class="info-row"><span class="label">Priority</span><span class="sales-detail-value">' + this.priorityBadge(lead.priority || 'medium') + '</span></div>';
        html += '<div class="info-row"><span class="label">Expected Value</span><span class="sales-detail-value">' + this.formatCurrency(lead.expectedValue || 0) + '</span></div>';
        html += '<div class="info-row"><span class="label">Lead Owner</span><span class="sales-detail-value">' + this.esc(lead.assignee || lead.leadOwner || '-') + '</span></div>';
        html += '<div class="info-row"><span class="label">Created Date</span><span class="sales-detail-value">' + this.formatDateShort(lead.createdAt) + '</span></div>';
        html += '</div>';
        // Right column - Contact & Address
        html += '<div class="info-card"><h4><i class="fas fa-user"></i> Contact & Address</h4>';
        html += '<div class="info-row"><span class="label">Contact Person</span><span class="sales-detail-value">' + this.esc(lead.contactPerson || lead.name || '-') + '</span></div>';
        html += '<div class="info-row"><span class="label">Email</span><span class="sales-detail-value">' + this.esc(lead.email || '-') + '</span></div>';
        html += '<div class="info-row"><span class="label">Phone</span><span class="sales-detail-value">' + this.esc(lead.phone || '-') + '</span></div>';
        html += '<div class="info-row"><span class="label">Alternate Phone</span><span class="sales-detail-value">' + this.esc(lead.altPhone || lead.alternatePhone || '-') + '</span></div>';
        html += '<div class="info-row"><span class="label">Website</span><span class="sales-detail-value">' + this.esc(lead.website || '-') + '</span></div>';
        html += '<div class="info-row"><span class="label">GSTIN</span><span class="sales-detail-value">' + this.esc(lead.gstin || '-') + '</span></div>';
        html += '<div class="info-row"><span class="label">Country</span><span class="sales-detail-value">' + this.esc(lead.country || '-') + '</span></div>';
        html += '<div class="info-row"><span class="label">State</span><span class="sales-detail-value">' + this.esc(lead.state || '-') + '</span></div>';
        html += '<div class="info-row"><span class="label">City</span><span class="sales-detail-value">' + this.esc(lead.city || '-') + '</span></div>';
        html += '<div class="info-row"><span class="label">Address</span><span class="sales-detail-value">' + this.esc(lead.address || lead.street || '-') + '</span></div>';
        html += '</div>';
        html += '</div>';

        // Notes
        if (lead.notes || lead.requirement) {
            html += '<div class="info-card" style="margin-bottom:24px"><h4><i class="fas fa-sticky-note"></i> Notes</h4>';
            html += '<div style="padding:16px 24px;font-size:13px;color:#374151;line-height:1.6">' + this.esc(lead.notes || lead.requirement || '') + '</div></div>';
        }
        return html;
    },

    renderFollowupsTab: function(lead) {
        var html = '<div class="info-card"><h4><i class="fas fa-phone"></i> Follow-ups</h4>';
        var followups = VT.DataHub.getFollowups();
        var leadFus = followups.filter(function(f) { return f.leadId === lead.id || f.leadNo === lead.leadNo; });
        if (leadFus.length === 0) {
            html += '<div style="text-align:center;padding:30px;color:#9ca3af">No follow-ups recorded</div>';
        } else {
            html += '<table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr style="background:#f8fafc"><th style="padding:10px 16px;text-align:left;font-weight:600;font-size:12px;color:#64748b;border-bottom:2px solid #e5e7eb">Date</th><th style="padding:10px 16px;text-align:left;font-weight:600;font-size:12px;color:#64748b;border-bottom:2px solid #e5e7eb">Mode</th><th style="padding:10px 16px;text-align:left;font-weight:600;font-size:12px;color:#64748b;border-bottom:2px solid #e5e7eb">Remarks</th><th style="padding:10px 16px;text-align:left;font-weight:600;font-size:12px;color:#64748b;border-bottom:2px solid #e5e7eb">Status</th></tr></thead><tbody>';
            for (var i = 0; i < leadFus.length; i++) {
                var f = leadFus[i];
                html += '<tr><td style="padding:10px 16px;border-bottom:1px solid #f3f4f6">' + this.esc(f.date || '-') + '</td><td style="padding:10px 16px;border-bottom:1px solid #f3f4f6">' + this.esc(f.mode || f.type || '-') + '</td><td style="padding:10px 16px;border-bottom:1px solid #f3f4f6">' + this.esc(f.remarks || '-') + '</td><td style="padding:10px 16px;border-bottom:1px solid #f3f4f6">' + VT.Utils.statusBadge(f.status || 'pending') + '</td></tr>';
            }
            html += '</tbody></table>';
        }
        html += '</div>';
        return html;
    },

    renderNotesTab: function(lead) {
        var html = '<div class="info-card"><h4><i class="fas fa-sticky-note"></i> Notes & Requirements</h4>';
        var notes = lead.notes || lead.requirement || '';
        if (notes) {
            html += '<div style="padding:16px 24px;font-size:14px;color:#374151;line-height:1.8;white-space:pre-wrap">' + this.esc(notes) + '</div>';
        } else {
            html += '<div style="text-align:center;padding:30px;color:#9ca3af">No notes recorded</div>';
        }
        html += '</div>';
        return html;
    },

    renderTimelineTab: function(lead) {
        var events = (lead.activities || []).slice();
        if (lead.createdAt) events.push({ date: lead.createdAt, type: 'Lead Created', status: 'created' });
        if (lead.convertedToClient) events.push({ date: lead.updatedAt || lead.createdAt, type: 'Converted to Client: ' + lead.convertedToClient, status: 'converted' });
        if (lead.convertedToCPR) events.push({ date: lead.updatedAt || lead.createdAt, type: 'Converted to CPR: ' + lead.convertedToCPR, status: 'converted' });
        events.sort(function(a, b) { return (a.date || '') < (b.date || '') ? 1 : -1; });
        var html = '<div class="info-card"><h4><i class="fas fa-clock"></i> Activity Timeline</h4>';
        if (events.length === 0) {
            html += '<div style="text-align:center;padding:30px;color:#9ca3af">No activity recorded</div>';
        } else {
            html += '<div class="activity-timeline">';
            for (var i = 0; i < events.length; i++) {
                var e = events[i];
                html += '<div class="activity-item"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span style="background:#0B4A3D15;color:#0B4A3D;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600"><i class="fas fa-circle"></i> ' + this.esc(e.type) + '</span><span style="color:#6b7280;font-size:11px">' + this.esc(e.date) + '</span></div></div>';
            }
            html += '</div>';
        }
        html += '</div>';
        return html;
    },

    renderDocumentsTab: function(lead) {
        var html = '<div class="info-card"><h4><i class="fas fa-folder"></i> Documents</h4>';
        var attachments = lead.attachments || [];
        if (attachments.length === 0) {
            html += '<div style="text-align:center;padding:30px;color:#9ca3af">No documents attached</div>';
        } else {
            html += '<div style="display:grid;gap:8px">';
            for (var i = 0; i < attachments.length; i++) {
                var a = attachments[i];
                var isImage = a.type && a.type.indexOf('image/') === 0;
                var icon = isImage ? 'fa-file-image' : (a.type === 'application/pdf' ? 'fa-file-pdf' : 'fa-file');
                html += '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px"><i class="fas ' + icon + '" style="color:#0B4A3D;font-size:16px"></i><span style="flex:1;font-size:13px;color:#374151">' + this.esc(a.name || 'Document') + '</span>' + (a.dataUrl ? '<button type="button" class="btn btn-ghost btn-sm" onclick="VT.Leads.viewFile(\'' + (a.dataUrl || '').replace(/'/g, "\\'") + '\',\'' + (a.type || '').replace(/'/g, "\\'") + '\',\'' + (this.esc ? this.esc(a.name || 'Document') : (a.name || 'Document')) + '\')" style="color:#0B4A3D"><i class="fas fa-eye"></i></button><button type="button" class="btn btn-ghost btn-sm" onclick="VT.Leads.downloadAttachment(\'' + (a.dataUrl || '').replace(/'/g, "\\'") + '\',\'' + (this.esc ? this.esc(a.name || 'Document') : (a.name || 'Document')) + '\')"><i class="fas fa-download"></i></button>' : '') + '</div>';
            }
            html += '</div>';
        }
        html += '</div>';
        return html;
    },

    renderActivitiesTab: function(lead) {
        return this.renderTimelineTab(lead);
    },

    /* ===== FORM INITIALIZATION ===== */
    _combos: {},

    _initCombobox: function(id, storeKey, opts) {
        opts = opts || {};
        if (typeof VT.ComboBox === 'undefined') return null;
        var combo = VT.ComboBox.init(id, storeKey, opts);
        if (combo) this._combos[id] = combo;
        return combo;
    },

    _setComboValue: function(id, val) {
        val = val || '';
        var c = this._combos[id];
        if (c) { c.setValue(val); }
        else { var el = document.getElementById(id); if (el) el.value = val; }
    },

    _getComboValue: function(id) {
        var c = this._combos[id];
        if (c) return c.getValue();
        var el = document.getElementById(id);
        return el ? el.value : '';
    },

    initForm: function() {
        var self = this;
        var params = new URLSearchParams(window.location.search);
        var editId = params.get('id');
        var editData = null;
        if (editId) {
            this.load();
            for (var i = 0; i < this.data.length; i++) {
                if (this.data[i].id === editId) { editData = this.data[i]; break; }
            }
            var title = document.getElementById('formTitle');
            if (title) title.textContent = 'Edit Lead';
            var title2 = document.getElementById('formTitle2');
            if (title2) title2.textContent = 'Edit Lead';
            var breadcrumbEnd = document.getElementById('breadcrumbEnd');
            if (breadcrumbEnd) breadcrumbEnd.textContent = 'Edit';
        }
        this._combos = {};

        // Auto-generate lead number for new leads
        if (!editId) {
            this.load();
            var leadNoInput = document.getElementById('field_leadNo');
            if (leadNoInput && !leadNoInput.value) {
                leadNoInput.value = this.getNextLeadNo();
            }
        }

        // Prevent browser autofill from copying primary contact to secondary contact fields
        var _secFields = ['field_secondaryContactPerson','field_secondaryPhone','field_secondaryEmail','field_secondaryDesignation'];
        for (var _sf = 0; _sf < _secFields.length; _sf++) {
            var _el = document.getElementById(_secFields[_sf]);
            if (_el) _el.setAttribute('autocomplete', 'off');
        }

        // Lead Source combobox via MasterData
        this._initCombobox('field_source', 'sources', {
            placeholder: 'Select or type lead source',
            getItems: function() {
                if (typeof VT.MasterData === 'undefined') return [];
                return VT.MasterData.getCollection('sources');
            },
            onNewValue: function(val) {
                if (typeof VT.MasterData !== 'undefined') VT.MasterData.addToCollection('sources', val);
            }
        });

        // Stage from MasterData
        this._initCombobox('field_stage', 'stages', {
            placeholder: 'Select or type stage',
            getItems: function() {
                if (typeof VT.MasterData === 'undefined') return [];
                return VT.MasterData.getCollection('stages');
            },
            onNewValue: function(val) {
                if (typeof VT.MasterData !== 'undefined') VT.MasterData.addToCollection('stages', val);
            }
        });

        // Priority from MasterData
        this._initCombobox('field_priority', 'priorities', {
            placeholder: 'Select or type priority',
            getItems: function() {
                if (typeof VT.MasterData === 'undefined') return [];
                return VT.MasterData.getCollection('priorities');
            },
            onNewValue: function(val) {
                if (typeof VT.MasterData !== 'undefined') VT.MasterData.addToCollection('priorities', val);
            }
        });

        // Status from MasterData
        this._initCombobox('field_status', 'statuses', {
            placeholder: 'Select or type status',
            getItems: function() {
                if (typeof VT.MasterData === 'undefined') return [];
                return VT.MasterData.getCollection('statuses');
            },
            onNewValue: function(val) {
                if (typeof VT.MasterData !== 'undefined') VT.MasterData.addToCollection('statuses', val);
            }
        });

        // Lead Owner - searchable combobox from existing data
        this._initCombobox('field_owner', null, {
            placeholder: 'Search or type owner name',
            getItems: function() {
                var owners = {};
                for (var ci = 0; ci < self.data.length; ci++) {
                    var d2 = self.data[ci];
                    if (d2.assignee || d2.leadOwner) owners[d2.assignee || d2.leadOwner] = true;
                }
                return Object.keys(owners).sort();
            },
            onNewValue: function(val) {
                // Allow any typed value as owner
            }
        });

        // Country cascading comboboxes
        var selectedCountry = editData ? editData.country : '';
        var selectedState = editData ? editData.state : '';
        var selectedCity = editData ? editData.city : '';

        function getCountryNames() {
            if (typeof VT.MasterData === 'undefined') return [];
            var c = VT.MasterData.getCountries();
            var names = [];
            for (var i = 0; i < c.length; i++) names.push(c[i].name);
            return names;
        }
        function getStatesFor(country) {
            if (typeof VT.MasterData === 'undefined' || !country) return [];
            var s = VT.MasterData.getStates(country);
            var names = [];
            for (var i = 0; i < s.length; i++) names.push(s[i].name || s[i]);
            return names;
        }
        function getCitiesFor(country, state) {
            if (typeof VT.MasterData === 'undefined' || !country || !state) return [];
            return VT.MasterData.getCities(country, state).slice();
        }

        this._initCombobox('field_country', null, {
            placeholder: 'Select or type country',
            getItems: getCountryNames,
            onChange: function(val) {
                var stateCombo = self._combos['field_state'];
                if (stateCombo) { stateCombo.setValue(''); stateCombo.refresh(); }
                var cityCombo = self._combos['field_city'];
                if (cityCombo) { cityCombo.setValue(''); cityCombo.refresh(); }
            },
            onNewValue: function(val) { if (typeof VT.MasterData !== 'undefined') VT.MasterData.addCustomCountry(val); }
        });
        this._initCombobox('field_state', null, {
            placeholder: 'Select or type state',
            getItems: function() { return getStatesFor(self._getComboValue('field_country')); },
            onChange: function(val) {
                var cityCombo = self._combos['field_city'];
                if (cityCombo) { cityCombo.setValue(''); cityCombo.refresh(); }
            },
            onNewValue: function(val) {
                var country = self._getComboValue('field_country');
                if (country && typeof VT.MasterData !== 'undefined') VT.MasterData.addCustomState(country, val);
            }
        });
        this._initCombobox('field_city', null, {
            placeholder: 'Select or type city',
            getItems: function() { return getCitiesFor(self._getComboValue('field_country'), self._getComboValue('field_state')); },
            onNewValue: function(val) {
                var country = self._getComboValue('field_country');
                var state = self._getComboValue('field_state');
                if (country && state && typeof VT.MasterData !== 'undefined') VT.MasterData.addCustomCity(country, state, val);
            }
        });

        // Industry
        this._initCombobox('field_industry', 'industries', {
            placeholder: 'Select or type industry',
            getItems: function() { if (typeof VT.MasterData === 'undefined') return []; return VT.MasterData.getIndustries(); },
            onNewValue: function(val) { if (typeof VT.MasterData !== 'undefined') VT.MasterData.addIndustry(val); }
        });

        // Set existing values for edit mode
        if (editData) this.populateForm(editData);

        // Ensure DocumentPreview is available for attachment previews
        if (typeof VT === 'undefined' || !VT.DocumentPreview) {
            var dpScript = document.createElement('script');
            dpScript.src = 'js/shared/document-preview.js?v=' + Date.now();
            dpScript.async = false;
            document.body.appendChild(dpScript);
        }

        // Button handlers
        var saveBtn = document.getElementById('saveLead');
        if (saveBtn) saveBtn.addEventListener('click', function() { self.saveForm(false, false); });
        var saveNewBtn = document.getElementById('saveNewLead');
        if (saveNewBtn) saveNewBtn.addEventListener('click', function() { self.saveForm(true, false); });
        var draftBtn = document.getElementById('saveDraftLead');
        if (draftBtn) {
            draftBtn.style.display = 'inline-flex';
            draftBtn.addEventListener('click', function() { self.saveForm(true, true); });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', function _formKeydown(e) {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                self.saveForm(false, false);
            }
            if (e.key === 'Escape') {
                var openMenus = document.querySelectorAll('.safe-action-menu');
                for (var mi = 0; mi < openMenus.length; mi++) openMenus[mi].remove();
                var focusEl = document.querySelector('.vl-form-card-body input:focus, .vl-form-card-body textarea:focus, .vl-form-card-body select:focus');
                if (focusEl) focusEl.blur();
            }
        });

        // Unsaved changes warning
        this._formDirty = false;
        var formFields = document.querySelectorAll('.vl-form-card-body input, .vl-form-card-body textarea, .vl-form-card-body select');
        for (var fi = 0; fi < formFields.length; fi++) {
            formFields[fi].addEventListener('change', function() { self._formDirty = true; });
            formFields[fi].addEventListener('input', function() { self._formDirty = true; });
        }
        window.addEventListener('beforeunload', function(e) {
            self._cleanupForm();
            if (self._formDirty) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            }
        });

        // Autosave draft every 30 seconds
        if (this._autosaveTimer) clearInterval(this._autosaveTimer);
        this._autosaveTimer = setInterval(function() {
            if (!self._formDirty) return;
            var indicator = document.getElementById('autosaveIndicator');
            if (indicator) { indicator.className = 'autosave-indicator saving'; indicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...'; }
            self.load();
            var editId2 = document.getElementById('leadId') ? document.getElementById('leadId').value : '';
            // Only autosave if form has required fields filled
            var nameEl = document.getElementById('field_name');
            if (!nameEl || !nameEl.value.trim()) {
                if (indicator) indicator.className = 'autosave-indicator';
                return;
            }
            self.saveForm(false, true);
            self._formDirty = false;
            if (indicator) { indicator.className = 'autosave-indicator saved'; indicator.innerHTML = '<i class="fas fa-check"></i> Draft saved ' + new Date().toLocaleTimeString(); }
            setTimeout(function() {
                if (indicator) indicator.className = 'autosave-indicator';
            }, 5000);
        }, 30000);

        // Accordion
        this.initAccordion();

        // File upload with drag-drop
        this._initFileUpload();

        // Lead number uniqueness validation on change
        var leadNoField = document.getElementById('field_leadNo');
        if (leadNoField) {
            leadNoField.addEventListener('blur', function() {
                var val = this.value.trim();
                if (!val) return;
                if (!/^LEAD-\d{4}-\d{6}$/.test(val)) {
                    VT.Utils.showToast('Lead number should be in format LEAD-YYYY-NNNNNN', 'warning');
                    return;
                }
                self.load();
                for (var ci = 0; ci < self.data.length; ci++) {
                    if (self.data[ci].leadNo === val && self.data[ci].id !== editId && self.data[ci].status !== 'deleted') {
                        VT.Utils.showToast('Lead number "' + val + '" already exists. Use a unique number.', 'warning');
                        break;
                    }
                }
            });
        }

    },

    populateForm: function(data) {
        var fieldMap = this._getFieldMap();
        for (var fieldId in fieldMap) {
            var dataKey = fieldMap[fieldId];
            var val = data[dataKey] || '';
            var combo = this._combos[fieldId];
            if (combo) { combo.setValue(val); }
            else {
                var el = document.getElementById(fieldId);
                if (el) el.value = val;
            }
        }
        var leadId = document.getElementById('leadId');
        if (leadId) leadId.value = data.id;
        // Pre-populate existing attachments for edit mode
        this.currentAttachments = [];
        if (data.attachments && data.attachments.length) {
            for (var i = 0; i < data.attachments.length; i++) {
                var a = data.attachments[i];
                if (a && a.name) {
                    this.currentAttachments.push({
                        name: a.name,
                        size: a.size || 0,
                        type: a.type || '',
                        lastModified: a.lastModified || Date.now(),
                        dataUrl: a.dataUrl || ''
                    });
                }
            }
        }
        this.renderFileList();
    },

    _getFieldMap: function() {
        return {
            'field_leadNo': 'leadNo',
            'field_name': 'company',
            'field_source': 'source',
            'field_industry': 'industry',
            'field_expectedValue': 'expectedValue',
            'field_stage': 'stage',
            'field_priority': 'priority',
            'field_owner': 'assignee',
            'field_website': 'website',
            'field_contactPerson': 'contactPerson',
            'field_email': 'email',
            'field_phone': 'phone',
            'field_secondaryContactPerson': 'secondaryContactPerson',
            'field_secondaryPhone': 'secondaryPhone',
            'field_secondaryEmail': 'secondaryEmail',
            'field_secondaryDesignation': 'secondaryDesignation',
            'field_country': 'country',
            'field_state': 'state',
            'field_city': 'city',
            'field_pincode': 'pincode',
            'field_address': 'address',
            'field_expectedCloseDate': 'expectedCloseDate',
            'field_status': 'status',
            'field_internalNotes': 'internalNotes',
            'field_notes': 'notes'
        };
    },

    saveForm: function(createNew, isDraft) {
        var self = this;
        if (!this.validateFormFields()) return;

        this.load();
        var editId = document.getElementById('leadId') ? document.getElementById('leadId').value : '';
        var lead = null;

        if (editId) {
            for (var i = 0; i < this.data.length; i++) {
                if (this.data[i].id === editId) { lead = this.data[i]; break; }
            }
        }

        var isNew = !lead;
        if (!lead) {
            lead = {};
            lead.id = this.getNextId();
        }

        var fieldMap = this._getFieldMap();

        for (var id in fieldMap) {
            var key = fieldMap[id];
            lead[key] = this._getComboValue(id);
        }

        // Trim secondary contact fields
        var _trimFields = ['secondaryContactPerson', 'secondaryPhone', 'secondaryEmail', 'secondaryDesignation'];
        for (var _ti = 0; _ti < _trimFields.length; _ti++) {
            if (typeof lead[_trimFields[_ti]] === 'string') lead[_trimFields[_ti]] = lead[_trimFields[_ti]].trim();
        }

        lead.company = lead.name || lead.company || '';
        lead.expectedValue = Number(lead.expectedValue) || 0;
        if (!lead.stage) lead.stage = 'new';
        if (!lead.status) lead.status = 'new';
        if (!lead.assignee) lead.assignee = '';

        if (isNew) {
            lead.createdAt = new Date().toISOString();
            lead.activities = [{ date: lead.createdAt, type: 'Lead Created' }];
        } else {
            lead.updatedAt = new Date().toISOString();
            // Track changes
            var oldLead = null;
            for (var oi = 0; oi < self.data.length; oi++) {
                if (self.data[oi].id === lead.id) { oldLead = self.data[oi]; break; }
            }
            if (oldLead) {
                if ((oldLead.stage || 'new') !== (lead.stage || 'new')) {
                    var act = { date: lead.updatedAt, type: 'Stage changed from "' + (oldLead.stage || 'new') + '" to "' + (lead.stage || 'new') + '"' };
                    if (!lead.activities) lead.activities = [];
                    lead.activities.push(act);
                }
                if ((oldLead.assignee || '') !== (lead.assignee || '')) {
                    var act2 = { date: lead.updatedAt, type: 'Owner changed from "' + (oldLead.assignee || 'unassigned') + '" to "' + (lead.assignee || 'unassigned') + '"' };
                    if (!lead.activities) lead.activities = [];
                    lead.activities.push(act2);
                }
                if (Number(oldLead.expectedValue || 0) !== Number(lead.expectedValue || 0)) {
                    var act3 = { date: lead.updatedAt, type: 'Expected value updated' };
                    if (!lead.activities) lead.activities = [];
                    lead.activities.push(act3);
                }
            }
        }

        lead.attachments = this.collectAttachments();

        // Check lead number uniqueness
        var leadNo = lead.leadNo || '';
        for (var ci = 0; ci < this.data.length; ci++) {
            if (this.data[ci].leadNo === leadNo && this.data[ci].id !== lead.id && this.data[ci].status !== 'deleted') {
                VT.Utils.showToast('Lead number "' + leadNo + '" already exists. Use a unique number.', 'warning');
                return;
            }
        }

        // Duplicate detection: flag matching name + email or name + phone
        var dupName = (lead.name || lead.company || '').toLowerCase().trim();
        var dupEmail = (lead.email || '').toLowerCase().trim();
        var dupPhone = (lead.phone || '').trim();
        var dupWarning = false;
        if (isNew && dupName) {
            for (var di = 0; di < this.data.length; di++) {
                var existing = this.data[di];
                if (existing.status === 'deleted' || existing.id === lead.id) continue;
                var en = (existing.name || existing.company || '').toLowerCase().trim();
                var ee = (existing.email || '').toLowerCase().trim();
                var ep = (existing.phone || '').trim();
                if (en === dupName && (ee === dupEmail || ep === dupPhone)) {
                    dupWarning = true;
                    var dupOf = existing.leadNo || existing.id;
                    VT.Utils.showToast('Warning: Possible duplicate of ' + dupOf + ' (' + (existing.name || existing.company) + ')', 'warning');
                    break;
                }
            }
        }

        if (isNew) {
            this.data.push(lead);
        } else {
            for (var j = 0; j < this.data.length; j++) {
                if (this.data[j].id === lead.id) { this.data[j] = lead; break; }
            }
        }
        this.save();
        if (isDraft) {
            if (!self._draftSaveCount) self._draftSaveCount = 0;
            self._draftSaveCount++;
            VT.Utils.showToast(isNew ? 'Lead draft saved' : 'Lead draft updated', 'success');
            // Don't redirect for drafts
        } else {
            VT.Utils.showToast(isNew ? 'Lead created successfully' : 'Lead updated successfully', 'success');
            if (createNew) {
                window.location.href = 'vl-create.html';
            } else {
                var returnUrl = new URLSearchParams(window.location.search).get('return') || 'leads.html';
                window.location.href = returnUrl;
            }
        }
    },

    validateFormFields: function() {
        var errors = [];
        var name = document.getElementById('field_name');
        if (!name || !name.value.trim()) {
            errors.push('Business Name is required');
            if (name) name.focus();
        }
        var contact = document.getElementById('field_contactPerson');
        if (!contact || !contact.value.trim()) {
            errors.push('Contact Person is required');
            if (!errors.length && contact) contact.focus();
        }
        var email = document.getElementById('field_email');
        var emailVal = email ? email.value.trim() : '';
        if (!emailVal) {
            errors.push('Email is required');
            if (!errors.length && email) email.focus();
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
            errors.push('Invalid email format');
            if (!errors.length && email) email.focus();
        }
        var phone = document.getElementById('field_phone');
        var phoneVal = phone ? phone.value.trim() : '';
        if (!phoneVal) {
            errors.push('Phone is required');
            if (!errors.length && phone) phone.focus();
        } else if (phoneVal.replace(/[\s\-\(\)]+/g, '').length < 10) {
            errors.push('Phone number must be at least 10 digits');
            if (!errors.length && phone) phone.focus();
        }
        // Secondary Contact (optional validation)
        var secEmail = document.getElementById('field_secondaryEmail');
        var secEmailVal = secEmail ? secEmail.value.trim() : '';
        if (secEmailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(secEmailVal)) {
            errors.push('Secondary email format is invalid');
            if (!errors.length && secEmail) secEmail.focus();
        }
        var secPhone = document.getElementById('field_secondaryPhone');
        var secPhoneVal = secPhone ? secPhone.value.trim() : '';
        if (secPhoneVal && secPhoneVal.replace(/[\s\-\(\)]+/g, '').length < 10) {
            errors.push('Secondary phone must be at least 10 digits');
            if (!errors.length && secPhone) secPhone.focus();
        }
        var primaryEmailVal = document.getElementById('field_email') ? document.getElementById('field_email').value.trim() : '';
        if (secEmailVal && secEmailVal.toLowerCase() === primaryEmailVal.toLowerCase()) {
            errors.push('Secondary email must be different from primary email');
            if (!errors.length && secEmail) secEmail.focus();
        }
        var primaryPhoneVal = document.getElementById('field_phone') ? document.getElementById('field_phone').value.trim() : '';
        if (secPhoneVal && secPhoneVal === primaryPhoneVal) {
            errors.push('Secondary phone must be different from primary phone');
            if (!errors.length && secPhone) secPhone.focus();
        }
        if (errors.length > 0) {
            VT.Utils.showToast(errors[0], 'warning');
            return false;
        }
        return true;
    },

    /* ===== ATTACHMENTS ===== */
    currentAttachments: [],

    _initFileUpload: function() {
        var self = this;
        var zone = document.getElementById('uploadZone');
        var fileInput = document.getElementById('fileInput');
        if (!zone || !fileInput) return;

        // Browse click
        zone.addEventListener('click', function(e) {
            if (e.target.tagName !== 'BUTTON') fileInput.click();
        });

        // File input change
        fileInput.addEventListener('change', function(e) {
            self._processFiles(e.target.files);
            e.target.value = '';
        });

        // Drag-drop events
        zone.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            zone.classList.add('drag-over');
        });
        zone.addEventListener('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            zone.classList.remove('drag-over');
        });
        zone.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            zone.classList.remove('drag-over');
            if (e.dataTransfer && e.dataTransfer.files) {
                self._processFiles(e.dataTransfer.files);
            }
        });
    },

    _acceptedTypes: ['.pdf','.doc','.docx','.xls','.xlsx','.png','.jpg','.jpeg'],

    _processFiles: function(files) {
        if (!files || files.length === 0) return;
        for (var i = 0; i < files.length; i++) {
            var f = files[i];
            var ext = '.' + (f.name || '').split('.').pop().toLowerCase();
            if (this._acceptedTypes.indexOf(ext) === -1) {
                VT.Utils.showToast('File type not supported: ' + f.name, 'warning');
                continue;
            }
            if (f.size > 10 * 1024 * 1024) {
                VT.Utils.showToast('File too large (max 10MB): ' + f.name, 'warning');
                continue;
            }
            this._readFile(f);
        }
    },

    _readFile: function(file) {
        var self = this;
        var idx = this.currentAttachments.length;
        var entry = { name: file.name, size: file.size, type: file.type || '', lastModified: file.lastModified, dataUrl: '', progress: 0 };
        this.currentAttachments.push(entry);
        self.renderFileList();

        var reader = new FileReader();
        reader.onprogress = function(ev) {
            if (ev.lengthComputable) {
                var pct = Math.round((ev.loaded / ev.total) * 100);
                if (self.currentAttachments[idx]) {
                    self.currentAttachments[idx].progress = pct;
                    self._updateFileProgress(idx, pct);
                }
            }
        };
        reader.onload = function(ev) {
            if (self.currentAttachments[idx]) {
                self.currentAttachments[idx].dataUrl = ev.target.result;
                self.currentAttachments[idx].progress = 100;
                self._updateFileProgress(idx, 100);
            }
        };
        reader.onerror = function() {
            VT.Utils.showToast('Failed to read file: ' + file.name, 'danger');
        };
        reader.readAsDataURL(file);
    },

    _updateFileProgress: function(idx, pct) {
        var container = document.getElementById('fileList');
        if (!container) return;
        var el = container.querySelector('[data-idx="' + idx + '"] .file-item-progress-bar');
        if (el) el.style.width = pct + '%';
    },

    renderFileList: function() {
        var container = document.getElementById('fileList');
        if (!container) return;
        if (this.currentAttachments.length === 0) { container.innerHTML = ''; return; }
        var html = '';
        for (var i = 0; i < this.currentAttachments.length; i++) {
            var a = this.currentAttachments[i];
            var sizeStr = this.formatFileSize(a.size);
            var isImage = a.type && a.type.indexOf('image/') === 0;
            var icon = isImage ? 'fa-file-image' : (a.type === 'application/pdf' ? 'fa-file-pdf' : 'fa-file');
            var progressHtml = (a.progress !== undefined && a.progress < 100) ?
                '<div class="file-item-progress"><div class="file-item-progress-bar" style="width:' + a.progress + '%"></div></div>' : '';
            html += '<div class="file-item" data-idx="' + i + '">' +
                '<i class="fas ' + icon + ' file-item-icon"></i>' +
                '<span class="file-item-name">' + this.esc(a.name) + '</span>' +
                '<span class="file-item-size">' + sizeStr + '</span>' +
                progressHtml +
                (a.dataUrl ? '<button type="button" class="btn btn-icon btn-sm btn-ghost file-item-btn" onclick="VT.DocumentPreview.show(\'' + (a.dataUrl || '').replace(/'/g, "\\'") + '\',\'' + (a.type || '').replace(/'/g, "\\'") + '\',\'' + (this.esc ? this.esc(a.name || 'file') : (a.name || 'file')) + '\')" title="Preview"><i class="fas fa-eye"></i></button>' : '') +
                '<button type="button" class="btn btn-icon btn-sm btn-ghost file-item-btn remove" onclick="VT.Leads.removeAttachment(' + i + ')" title="Remove"><i class="fas fa-times"></i></button>' +
            '</div>';
        }
        container.innerHTML = html;
    },

    removeAttachment: function(index) {
        if (index >= 0 && index < this.currentAttachments.length) {
            this.currentAttachments.splice(index, 1);
        }
        this.renderFileList();
    },

    formatFileSize: function(bytes) {
        return VT.Format.fileSize(bytes);
    },

    collectAttachments: function() {
        var result = [];
        for (var i = 0; i < this.currentAttachments.length; i++) {
            var a = this.currentAttachments[i];
            result.push({ name: a.name, size: a.size, type: a.type || '', lastModified: a.lastModified, dataUrl: a.dataUrl || '' });
        }
        return result;
    },

    /* ===== ACCORDION ===== */
    initAccordion: function() {
        var headers = document.querySelectorAll('.form-card-header');
        for (var i = 0; i < headers.length; i++) {
            headers[i].addEventListener('click', function() {
                this.parentNode.classList.toggle('open');
            });
        }
    },

    /* ===== MASTER DATA MODALS ===== */
    showAddIndustryModal: function() {
        if (typeof VT.MasterManager !== 'undefined') VT.MasterManager.show('Industry','industries','field_industry',this._refreshAllCombos.bind(this));
        else this._simpleAdd('industries', 'Industry');
    },
    showManageIndustriesModal: function() {
        if (typeof VT.MasterManager !== 'undefined') VT.MasterManager.show('Industry','industries','field_industry',this._refreshAllCombos.bind(this));
    },

    _simpleAdd: function(collection, label) {
        var val = prompt('Enter new ' + label + ':');
        if (!val || !val.trim()) return;
        if (typeof VT.MasterData !== 'undefined') {
            VT.MasterData.addToCollection(collection, val.trim());
        } else {
            try { var data = JSON.parse(localStorage.getItem(collection)) || []; if (data.indexOf(val.trim()) === -1) data.push(val.trim()); localStorage.setItem(collection, JSON.stringify(data)); } catch(e) {}
        }
        this._refreshAllCombos();
        VT.Utils.showToast(label + ' added: ' + val.trim(), 'success');
    },

    _refreshAllCombos: function() {
        for (var key in this._combos) {
            var c = this._combos[key];
            if (c && typeof c.refresh === 'function') c.refresh();
        }
    },

    /* ===== VIEW PAGE (vl-view.html) ===== */
    initView: function() {
        var params = new URLSearchParams(window.location.search);
        var id = params.get('id');
        if (!id) {
            var container = document.getElementById('viewContainer');
            if (container) container.innerHTML = '<div class="empty-state" style="padding:60px 20px;text-align:center"><i class="fas fa-user" style="font-size:40px;color:#d1d5db;margin-bottom:12px"></i><h3>No lead selected</h3></div>';
            return;
        }
        this.load();
        var lead = null;
        for (var i = 0; i < this.data.length; i++) {
            if (this.data[i].id === id) { lead = this.data[i]; break; }
        }
        if (!lead) {
            var container = document.getElementById('viewContainer');
            if (container) container.innerHTML = '<div class="empty-state" style="padding:60px 20px;text-align:center"><i class="fas fa-exclamation-circle" style="font-size:40px;color:#dc2626;margin-bottom:12px"></i><h3>Lead not found</h3><p style="color:#6b7280;font-size:13px">The lead you are looking for does not exist.</p></div>';
            return;
        }
        this._initClickDelegation();
        var container = document.getElementById('viewContainer');
        if (container) {
            container.innerHTML = this.renderProfileView(lead);
        }
    },

    renderProfileView: function(lead) {
        var initial = (lead.name || lead.contactPerson || 'L').charAt(0).toUpperCase();

        var tabs = [
            { id: 'overview', label: 'Overview', icon: 'fa-info-circle' },
            { id: 'contacts', label: 'Contacts', icon: 'fa-address-book' },
            { id: 'followups', label: 'Follow-ups', icon: 'fa-phone' },
            { id: 'purchase-requests', label: 'Purchase Requests', icon: 'fa-clipboard-list' },
            { id: 'quotations', label: 'Quotations', icon: 'fa-file-invoice' },
            { id: 'notes', label: 'Notes', icon: 'fa-sticky-note' },
            { id: 'timeline', label: 'Timeline', icon: 'fa-clock' },
            { id: 'documents', label: 'Documents', icon: 'fa-folder' },
            { id: 'activities', label: 'Activity', icon: 'fa-chart-line' }
        ];

        var tabHtml = '';
        for (var ti = 0; ti < tabs.length; ti++) {
            var t = tabs[ti];
            tabHtml += '<button class="view-tab' + (ti === 0 ? ' active' : '') + '" data-view-tab data-tab="' + t.id + '"><i class="fas ' + t.icon + '"></i> ' + t.label + '</button>';
        }

        return '<div class="view-header">' +
            '<div class="view-header-left">' +
                '<div class="view-logo">' + initial + '</div>' +
                '<div class="view-title">' +
                    '<h2>' + this.esc(lead.name || lead.contactPerson || 'Unnamed Lead') + '</h2>' +
                    '<div class="view-meta">' +
                        '<span><i class="fas fa-tag"></i> ' + this.esc(lead.leadNo || lead.id) + '</span>' +
                        '<span><i class="fas fa-circle"></i> ' + this.stageBadge(lead.stage || 'new') + '</span>' +
                        '<span><i class="fas fa-flag"></i> ' + this.priorityBadge(lead.priority || 'medium') + '</span>' +
                        '<span><i class="fas fa-tasks"></i> ' + this.esc(lead.source || '-') + '</span>' +
                        '<span><i class="fas fa-user"></i> ' + this.esc(lead.assignee || lead.leadOwner || '-') + '</span>' +
                        '<span><i class="fas fa-calendar"></i> ' + this.formatDateShort(lead.createdAt) + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="view-actions">' +
                '<a href="leads.html" class="btn btn-ghost btn-sm"><i class="fas fa-arrow-left"></i> Back</a>' +
                '<a href="vl-edit.html?id=' + lead.id + '" class="btn btn-primary btn-sm"><i class="fas fa-pen"></i> Edit</a>' +
            '</div>' +
        '</div>' +
        '<div class="sales-summary-cards" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:24px">' +
            this.renderViewStats(lead) +
        '</div>' +
        '<div class="view-tabs">' + tabHtml + '</div>' +
        '<div class="view-tab-content" id="viewTabContent">' +
            this.renderOverviewTab(lead) +
        '</div>';
    },

    /* ===== FORMATTING HELPERS ===== */
    formatCurrency: function(amount) {
        return VT.Format.currency(amount);
    },

    formatCurrencyShort: function(amount) {
        return VT.Format.currencyShort(amount);
    },

    formatDateShort: function(dateStr) {
        return VT.Format.dateShort(dateStr);
    },

    /* ===== BADGE HELPERS ===== */
    stageBadge: function(stage) {
        var map = {
            new: { label: 'New', cls: 'badge-neutral' },
            contacted: { label: 'Contacted', cls: 'badge-info' },
            proposal: { label: 'Proposal', cls: 'badge-warning' },
            qualified: { label: 'Qualified', cls: 'badge-success' },
            negotiation: { label: 'Negotiation', cls: 'badge-warning' },
            won: { label: 'Won', cls: 'badge-success' },
            lost: { label: 'Lost', cls: 'badge-danger' }
        };
        var s = map[(stage || 'new').toLowerCase()] || { label: stage || 'New', cls: 'badge-neutral' };
        return '<span class="' + s.cls + '">' + s.label + '</span>';
    },

    priorityBadge: function(priority) {
        var t = (priority || 'medium').toLowerCase().trim();
        var c = 'medium';
        if (t === 'critical') c = 'critical';
        else if (t === 'high') c = 'high';
        else if (t === 'low') c = 'low';
        var display = priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : 'Medium';
        return '<span class="po-priority po-priority-' + c + '">' + display + '</span>';
    },

    /* ===== FOLLOW-UP CELL RENDERS ===== */
    _getLeadFollowups: function(d) {
        var allFus = VT.DataHub.getFollowups();
        return allFus.filter(function(f) { return f.leadId === d.id || f.leadNo === d.leadNo || f.lead === d.id; });
    },

    _fuBadge: function(dateStr) {
        if (!dateStr) return '';
        var today = new Date(); today.setHours(0,0,0,0);
        var fuDate = new Date(dateStr.substring(0,10) + 'T00:00:00');
        var diffDays = Math.round((fuDate - today) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return '<span class="fu-badge fu-badge-overdue"><i class="fas fa-circle"></i> Overdue</span>';
        if (diffDays === 0) return '<span class="fu-badge fu-badge-today"><i class="fas fa-circle"></i> Today</span>';
        if (diffDays === 1) return '<span class="fu-badge fu-badge-tomorrow"><i class="fas fa-circle"></i> Tomorrow</span>';
        return '<span class="fu-badge fu-badge-scheduled">' + this.formatDateShort(dateStr) + '</span>';
    },

    renderLastFollowupCell: function(d) {
        var fups = this._getLeadFollowups(d);
        var past = fups.filter(function(f) { return f.date && f.date.substring(0,10); });
        if (past.length === 0) return '<td class="fu-cell">-</td>';
        var sorted = past.slice().sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); });
        var latest = sorted[0];
        var badge = this._fuBadge(latest.date);
        var tooltipLines = [];
        for (var i = 0; i < sorted.length; i++) {
            var f = sorted[i];
            var fd = this.formatDateShort(f.date);
            var r = f.remarks || 'Follow-up';
            tooltipLines.push('• ' + fd + ' - ' + r);
        }
        return '<td class="fu-cell" data-tooltip="' + VT.Utils.escapeHtml(tooltipLines.join('\n')) + '">' + badge + '</td>';
    },

    renderNextFollowupCell: function(d) {
        var fups = this._getLeadFollowups(d);
        var upcoming = fups.filter(function(f) { return (f.date || f.nextDate || '') >= new Date().toISOString().split('T')[0] && (f.status || 'pending').toLowerCase() !== 'completed'; });
        if (upcoming.length === 0) return '<td class="fu-cell">-</td>';
        var sorted = upcoming.slice().sort(function(a, b) { return (a.date || a.nextDate || '').localeCompare(b.date || b.nextDate || ''); });
        var nearest = sorted[0];
        var badge = this._fuBadge(nearest.date || nearest.nextDate);
        var tooltipLines = [];
        for (var i = 0; i < sorted.length; i++) {
            var f = sorted[i];
            var fd = this.formatDateShort(f.date || f.nextDate);
            var r = f.remarks || 'Follow-up';
            tooltipLines.push('• ' + fd + ' - ' + r);
        }
        return '<td class="fu-cell" data-tooltip="' + VT.Utils.escapeHtml(tooltipLines.join('\n')) + '">' + badge + '</td>';
    },

    /* ===== ACTIVITY LOG ===== */
    addActivity: function(leadId, text) {
        var key = 'vt_lead_activity_' + leadId;
        var list = JSON.parse(localStorage.getItem(key) || '[]');
        list.push({ text: text, date: new Date().toISOString(), author: window.VT && VT.Session ? VT.Session.name : 'Admin' });
        localStorage.setItem(key, JSON.stringify(list));
    },

    /* ===== PIPELINE DRAG & DROP ===== */
    _initPipelineDragDrop: function() {
        var self = this;
        var board = document.getElementById('pipelineBoard');
        if (!board) return;

        board.addEventListener('dragstart', function(e) {
            var card = e.target.closest('.pipeline-card');
            if (!card) return;
            e.dataTransfer.setData('text/plain', card.getAttribute('data-id'));
            card.classList.add('dragging');
        });

        board.addEventListener('dragend', function(e) {
            var card = e.target.closest('.pipeline-card');
            if (card) card.classList.remove('dragging');
            var bodies = board.querySelectorAll('.pipeline-column-body');
            for (var i = 0; i < bodies.length; i++) bodies[i].classList.remove('drag-over');
        });

        board.addEventListener('dragover', function(e) {
            e.preventDefault();
            var body = e.target.closest('.pipeline-column-body');
            if (body) body.classList.add('drag-over');
        });

        board.addEventListener('dragleave', function(e) {
            var body = e.target.closest('.pipeline-column-body');
            if (body) body.classList.remove('drag-over');
        });

        board.addEventListener('drop', function(e) {
            e.preventDefault();
            var id = e.dataTransfer.getData('text/plain');
            var stageEl = e.target.closest('[data-stage]');
            if (!stageEl || !id) return;
            var newStage = stageEl.getAttribute('data-stage');

            // Remove drag-over from all bodies
            var bodies = board.querySelectorAll('.pipeline-column-body');
            for (var i = 0; i < bodies.length; i++) bodies[i].classList.remove('drag-over');

            // Update lead stage
            for (var i = 0; i < self.data.length; i++) {
                if (self.data[i].id === id) {
                    if (self.data[i].stage === newStage) return;
                    self.data[i].stage = newStage;
                    self.data[i].updatedAt = new Date().toISOString();
                    break;
                }
            }
            self.save();
            self.renderPipeline();
            if (VT.Utils) VT.Utils.showToast('Lead moved to ' + newStage.charAt(0).toUpperCase() + newStage.slice(1), 'success');
        });
    },

    getFocusId: function() {
        var params = new URLSearchParams(window.location.search);
        return params.get('id') || null;
    },

    /* ===== UPDATE TAB COUNTS ===== */
    updateTabCounts: function() {
        var total = this.data.length;
        var active = 0;
        for (var i = 0; i < this.data.length; i++) {
            if (this.data[i].status !== 'archived' && this.data[i].status !== 'deleted') active++;
        }
        var archived = this.data.filter(function(d) { return d.status === 'archived'; }).length;
        var deleted = this.data.filter(function(d) { return d.status === 'deleted'; }).length;
        var tabs = document.querySelectorAll('.sales-tab .tab-count');
        if (tabs[0]) tabs[0].textContent = total;
        var subtabs = document.querySelectorAll('.segmented-option');
        if (subtabs[0]) { var span = subtabs[0].querySelector('.tab-count'); if (span) span.textContent = active; }
        if (subtabs[1]) { var span = subtabs[1].querySelector('.tab-count'); if (span) span.textContent = archived; }
        if (subtabs[2]) { var span = subtabs[2].querySelector('.tab-count'); if (span) span.textContent = deleted; }
    },

    /* ===== EDIT PAGE ===== */
    initEdit: function() {
        this.initForm();
    },

    /* ===== Cleanup on page leave ===== */
    _cleanupForm: function() {
        if (this._autosaveTimer) {
            clearInterval(this._autosaveTimer);
            this._autosaveTimer = null;
        }
    },

    initBulkUpload: function() {
        VT.Utils.showToast('Bulk upload page loaded', 'info');
    },

    /* ===== TAB RENDERERS ===== */
    renderContactsTab: function(lead) {
        return '<div class="sales-empty-state" style="text-align:center;padding:40px"><i class="fas fa-address-book" style="font-size:40px;color:#d1d5db;margin-bottom:12px"></i><h4 style="font-size:16px;color:#6b7280;margin:0">Contacts</h4><p style="font-size:13px;color:#9ca3af;margin-top:8px">Contact management for this lead will appear here.</p></div>';
    },

    renderPurchaseRequestsTab: function(lead) {
        return '<div class="sales-empty-state" style="text-align:center;padding:40px"><i class="fas fa-clipboard-list" style="font-size:40px;color:#d1d5db;margin-bottom:12px"></i><h4 style="font-size:16px;color:#6b7280;margin:0">Purchase Requests</h4><p style="font-size:13px;color:#9ca3af;margin-top:8px">Purchase requests for this lead will appear here.</p></div>';
    },

    renderQuotationsTab: function(lead) {
        return '<div class="sales-empty-state" style="text-align:center;padding:40px"><i class="fas fa-file-invoice" style="font-size:40px;color:#d1d5db;margin-bottom:12px"></i><h4 style="font-size:16px;color:#6b7280;margin:0">Quotations</h4><p style="font-size:13px;color:#9ca3af;margin-top:8px">Quotations for this lead will appear here.</p></div>';
    },

    renderViewStats: function(lead) {
        var cards = [
            { label: 'Expected Value', value: this.formatCurrency(lead.expectedValue || 0), icon: 'fa-coins', color: '#0B4A3D' },
            { label: 'Stage', value: lead.stage || 'New', icon: 'fa-tag', color: '#6b7280' },
            { label: 'Priority', value: lead.priority || 'Medium', icon: 'fa-flag', color: '#f59e0b' },
            { label: 'Source', value: lead.source || 'Direct', icon: 'fa-tasks', color: '#3b82f6' }
        ];
        var html = '';
        for (var i = 0; i < cards.length; i++) {
            html += '<div class="sales-summary-card"><div class="sales-summary-value" style="color:' + cards[i].color + '">' + cards[i].value + '</div><div class="sales-summary-label">' + cards[i].label + '</div></div>';
        }
        return html;
    },

    /* ===== PIPELINE ACTION HELPERS ===== */
    pipelineViewLead: function(id) {
        window.location.href = 'lead-overview.html?id=' + encodeURIComponent(id);
    },

    pipelineEditLead: function(id) {
        window.location.href = 'vl-edit.html?id=' + encodeURIComponent(id);
    },

    viewFile: function(dataUrl, type, name) {
        if (!dataUrl) return;
        if (typeof VT !== 'undefined' && VT.DocumentPreview) {
            VT.DocumentPreview.show(dataUrl, type, name);
        }
    },

    downloadAttachment: function(dataUrl, filename) {
        try {
            var link = document.createElement('a');
            link.href = dataUrl;
            link.download = filename || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch(e) {
            if (VT.Utils) VT.Utils.showToast('Unable to download attachment', 'warning');
        }
    }
};
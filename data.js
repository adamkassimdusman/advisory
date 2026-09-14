/**
 * Kivanta Advisory - Data Access Layer & State Engine
 * Manages client-side storage, REST API synchronization, and public/admin dataset resolution.
 */

(function (window) {
  'use strict';

  const STORAGE_KEY = 'kivanta_advisory_db_v1';
  let _db = null;

  const KivantaDB = {
    async init() {
      const localData = localStorage.getItem(STORAGE_KEY);
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          if (parsed && parsed.services && parsed.services.length > 0) {
            _db = parsed;
          }
        } catch (e) {
          console.error('Failed to parse localStorage db, resetting...', e);
        }
      }

      if (!_db || !_db.services || _db.services.length === 0) {
        const primaryPath = window.location.pathname.includes('/admin/') ? '../data/db.json' : 'data/db.json';
        try {
          let resp = await fetch(primaryPath);
          if (!resp.ok) {
            resp = await fetch('/data/db.json');
          }
          if (resp.ok) {
            _db = await resp.json();
            this.persist();
          } else {
            throw new Error('db.json HTTP error ' + resp.status);
          }
        } catch (err) {
          console.warn('Could not fetch db.json, using fallback state', err);
          if (!_db) {
            _db = this.getFallbackDb();
          }
        }
      }

      // Try server sync asynchronously if available
      this.syncWithServer();
      return _db;
    },

    persist() {
      if (_db) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(_db));
        } catch (e) {
          console.error('Failed to persist Kivanta DB', e);
        }
      }
    },

    async syncWithServer() {
      try {
        const resp = await fetch('/api/db');
        if (resp.ok) {
          const serverDb = await resp.json();
          if (serverDb && serverDb.services) {
            _db = serverDb;
            this.persist();
            window.dispatchEvent(new CustomEvent('kivanta-db-updated'));
          }
        }
      } catch (e) {
        // Silent fail if server API is not active
      }
    },

    async pushToServer() {
      try {
        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(_db)
        });
      } catch (e) {
        // Silent fail if server API not present
      }
    },

    getSettings() {
      return _db ? _db.settings : {};
    },

    saveSettings(settings) {
      if (!_db) return;
      _db.settings = { ..._db.settings, ...settings };
      this.persist();
      this.pushToServer();
    },

    getCategories() {
      return _db && _db.categories ? _db.categories.sort((a, b) => a.order - b.order) : [];
    },

    getCategoryBySlug(slug) {
      return this.getCategories().find(c => c.slug === slug || c.id === slug);
    },

    saveCategory(cat) {
      if (!_db) return;
      const idx = _db.categories.findIndex(c => c.id === cat.id);
      if (idx >= 0) {
        _db.categories[idx] = { ..._db.categories[idx], ...cat };
      } else {
        _db.categories.push({ id: cat.id || 'cat_' + Date.now(), ...cat });
      }
      this.persist();
      this.pushToServer();
    },

    deleteCategory(id) {
      if (!_db || !_db.categories) return;
      _db.categories = _db.categories.filter(c => c.id !== id && c.slug !== id);
      this.persist();
      this.pushToServer();
    },

    getServices(includeDrafts = false) {
      if (!_db || !_db.services) return [];
      if (includeDrafts) return _db.services;
      return _db.services.filter(s => s.status === 'published');
    },

    getServiceBySlug(slug) {
      if (!_db || !_db.services) return null;
      return _db.services.find(s => s.slug === slug || s.id === slug) || null;
    },

    saveService(service) {
      if (!_db) return;
      const idx = _db.services.findIndex(s => s.id === service.id || s.slug === service.slug);
      if (idx >= 0) {
        _db.services[idx] = { ..._db.services[idx], ...service };
      } else {
        if (!service.id) service.id = service.slug || 'service_' + Date.now();
        _db.services.push(service);
      }
      this.persist();
      this.pushToServer();
      window.dispatchEvent(new CustomEvent('kivanta-db-updated'));
    },

    deleteService(id) {
      if (!_db) return;
      _db.services = _db.services.filter(s => s.id !== id && s.slug !== id);
      this.persist();
      this.pushToServer();
      window.dispatchEvent(new CustomEvent('kivanta-db-updated'));
    },

    getPricingFees() {
      return _db && _db.pricingFees ? _db.pricingFees : [];
    },

    savePricingFee(fee) {
      if (!_db) return;
      if (!_db.pricingFees) _db.pricingFees = [];
      const idx = _db.pricingFees.findIndex(f => f.id === fee.id || f.serviceId === fee.serviceId);
      if (idx >= 0) {
        _db.pricingFees[idx] = { ..._db.pricingFees[idx], ...fee, lastUpdated: new Date().toISOString().split('T')[0] };
      } else {
        _db.pricingFees.push({ id: 'fee_' + Date.now(), lastUpdated: new Date().toISOString().split('T')[0], ...fee });
      }
      this.persist();
      this.pushToServer();
    },

    deletePricingFee(id) {
      if (!_db || !_db.pricingFees) return;
      _db.pricingFees = _db.pricingFees.filter(f => f.id !== id);
      this.persist();
      this.pushToServer();
    },

    getSolutions() {
      return _db && _db.solutions ? _db.solutions : [];
    },

    saveSolution(solution) {
      if (!_db) return;
      if (!_db.solutions) _db.solutions = [];
      const idx = _db.solutions.findIndex(s => s.id === solution.id);
      if (idx >= 0) {
        _db.solutions[idx] = { ..._db.solutions[idx], ...solution };
      } else {
        _db.solutions.push({ id: 'sol_' + Date.now(), ...solution });
      }
      this.persist();
      this.pushToServer();
    },

    deleteSolution(id) {
      if (!_db || !_db.solutions) return;
      _db.solutions = _db.solutions.filter(s => s.id !== id);
      this.persist();
      this.pushToServer();
    },

    getTestimonials() {
      return _db && _db.testimonials ? _db.testimonials : [];
    },

    saveTestimonial(t) {
      if (!_db) return;
      if (!_db.testimonials) _db.testimonials = [];
      const idx = _db.testimonials.findIndex(x => x.id === t.id);
      if (idx >= 0) {
        _db.testimonials[idx] = { ..._db.testimonials[idx], ...t };
      } else {
        _db.testimonials.push({ id: 'test_' + Date.now(), ...t });
      }
      this.persist();
      this.pushToServer();
    },

    deleteTestimonial(id) {
      if (!_db || !_db.testimonials) return;
      _db.testimonials = _db.testimonials.filter(x => x.id !== id);
      this.persist();
      this.pushToServer();
    },

    getTeam() {
      return _db && _db.team ? _db.team : [];
    },

    saveTeamMember(m) {
      if (!_db) return;
      if (!_db.team) _db.team = [];
      const idx = _db.team.findIndex(x => x.id === m.id);
      if (idx >= 0) {
        _db.team[idx] = { ..._db.team[idx], ...m };
      } else {
        _db.team.push({ id: 'team_' + Date.now(), ...m });
      }
      this.persist();
      this.pushToServer();
    },

    deleteTeamMember(id) {
      if (!_db || !_db.team) return;
      _db.team = _db.team.filter(x => x.id !== id);
      this.persist();
      this.pushToServer();
    },

    getPageSeoMap() {
      return _db && _db.settings && _db.settings.pageSeo ? _db.settings.pageSeo : {};
    },

    savePageSeo(pageKey, seoObj) {
      if (!_db) return;
      if (!_db.settings) _db.settings = {};
      if (!_db.settings.pageSeo) _db.settings.pageSeo = {};
      _db.settings.pageSeo[pageKey] = { ..._db.settings.pageSeo[pageKey], ...seoObj };
      this.persist();
      this.pushToServer();
    },

    getInsights(includeDrafts = false) {
      if (!_db || !_db.insights) return [];
      if (includeDrafts) return _db.insights;
      return _db.insights.filter(i => i.status === 'published');
    },

    getInsightBySlug(slug) {
      return this.getInsights(true).find(i => i.slug === slug || i.id === slug);
    },

    saveInsight(insight) {
      if (!_db) return;
      const idx = _db.insights.findIndex(i => i.id === insight.id || i.slug === insight.slug);
      if (idx >= 0) {
        _db.insights[idx] = { ..._db.insights[idx], ...insight };
      } else {
        if (!insight.id) insight.id = 'insight_' + Date.now();
        _db.insights.unshift(insight);
      }
      this.persist();
      this.pushToServer();
    },

    deleteInsight(id) {
      if (!_db) return;
      _db.insights = _db.insights.filter(i => i.id !== id && i.slug !== id);
      this.persist();
      this.pushToServer();
    },

    getFAQs() {
      return _db && _db.faqs ? _db.faqs.filter(f => f.status === 'published') : [];
    },

    getAllFAQs() {
      return _db && _db.faqs ? _db.faqs : [];
    },

    saveFAQ(faq) {
      if (!_db) return;
      const idx = _db.faqs.findIndex(f => f.id === faq.id);
      if (idx >= 0) {
        _db.faqs[idx] = { ..._db.faqs[idx], ...faq };
      } else {
        _db.faqs.push({ id: 'faq_' + Date.now(), ...faq });
      }
      this.persist();
      this.pushToServer();
    },

    deleteFAQ(id) {
      if (!_db) return;
      _db.faqs = _db.faqs.filter(f => f.id !== id);
      this.persist();
      this.pushToServer();
    },

    getConsultationRequests() {
      return _db && _db.consultationRequests ? _db.consultationRequests : [];
    },

    addConsultationRequest(req) {
      if (!_db) return;
      if (!_db.consultationRequests) _db.consultationRequests = [];
      const newEntry = {
        id: 'consult_' + Date.now(),
        date: new Date().toISOString(),
        status: 'New',
        priority: 'Normal',
        notes: '',
        ...req
      };
      _db.consultationRequests.unshift(newEntry);
      this.persist();
      this.pushToServer();
      return newEntry;
    },

    updateConsultationStatus(id, status, notes = '') {
      if (!_db || !_db.consultationRequests) return;
      const item = _db.consultationRequests.find(r => r.id === id);
      if (item) {
        item.status = status;
        if (notes) item.notes = notes;
        this.persist();
        this.pushToServer();
      }
    },

    getProposalRequests() {
      return _db && _db.proposalRequests ? _db.proposalRequests : [];
    },

    addProposalRequest(req) {
      if (!_db) return;
      if (!_db.proposalRequests) _db.proposalRequests = [];
      const newEntry = {
        id: 'prop_' + Date.now(),
        date: new Date().toISOString(),
        status: 'New',
        notes: '',
        ...req
      };
      _db.proposalRequests.unshift(newEntry);
      this.persist();
      this.pushToServer();
      return newEntry;
    },

    updateProposalStatus(id, status, notes = '') {
      if (!_db || !_db.proposalRequests) return;
      const item = _db.proposalRequests.find(r => r.id === id);
      if (item) {
        item.status = status;
        if (notes) item.notes = notes;
        this.persist();
        this.pushToServer();
      }
    },

    getMedia() {
      return _db && _db.media ? _db.media : [];
    },

    addMedia(item) {
      if (!_db) return;
      if (!_db.media) _db.media = [];
      const newMedia = {
        id: 'med_' + Date.now(),
        uploadDate: new Date().toISOString().split('T')[0],
        ...item
      };
      _db.media.unshift(newMedia);
      this.persist();
      this.pushToServer();
      return newMedia;
    },

    // Contact Messages
    getContactMessages() {
      return _db && _db.contactMessages ? _db.contactMessages : [];
    },

    saveContactMessage(msg) {
      if (!_db) return;
      if (!_db.contactMessages) _db.contactMessages = [];
      const idx = _db.contactMessages.findIndex(m => m.id === msg.id);
      if (idx >= 0) {
        _db.contactMessages[idx] = { ..._db.contactMessages[idx], ...msg };
      } else {
        const newMsg = {
          id: 'msg_' + Date.now(),
          date: new Date().toISOString(),
          status: 'Unread',
          ...msg
        };
        _db.contactMessages.unshift(newMsg);
      }
      this.persist();
      this.pushToServer();
    },

    deleteContactMessage(id) {
      if (!_db || !_db.contactMessages) return;
      _db.contactMessages = _db.contactMessages.filter(m => m.id !== id);
      this.persist();
      this.pushToServer();
    },

    // Admin Users & Roles
    getAdminUsers() {
      return _db && _db.adminUsers ? _db.adminUsers : [];
    },

    saveAdminUser(user) {
      if (!_db) return;
      if (!_db.adminUsers) _db.adminUsers = [];
      const idx = _db.adminUsers.findIndex(u => u.id === user.id || u.username === user.username);
      if (idx >= 0) {
        _db.adminUsers[idx] = { ..._db.adminUsers[idx], ...user };
      } else {
        _db.adminUsers.push({
          id: 'usr_' + Date.now(),
          status: 'Active',
          lastLogin: new Date().toISOString(),
          ...user
        });
      }
      this.persist();
      this.pushToServer();
    },

    deleteAdminUser(id) {
      if (!_db || !_db.adminUsers) return;
      _db.adminUsers = _db.adminUsers.filter(u => u.id !== id && u.username !== id);
      this.persist();
      this.pushToServer();
    },

    // Activity Logs
    getActivityLogs() {
      return _db && _db.activityLogs ? _db.activityLogs : [];
    },

    addActivityLog(log) {
      if (!_db) return;
      if (!_db.activityLogs) _db.activityLogs = [];
      const entry = {
        id: 'act_' + Date.now(),
        timestamp: new Date().toISOString(),
        user: log.user || 'Admin',
        type: log.type || 'system',
        action: log.action || 'Administrative Event',
        description: log.description || ''
      };
      _db.activityLogs.unshift(entry);
      this.persist();
      this.pushToServer();
      return entry;
    },

    // Analytics Summary
    getAnalytics() {
      return _db && _db.analytics ? _db.analytics : {
        overview: { totalVisitors: 0, uniqueVisitors: 0, pageViews: 0, avgSessionDuration: '0m', bounceRate: '0%' },
        topServices: [],
        trafficSources: []
      };
    },

    getFallbackDb() {
      return {
        settings: { companyName: "Kivanta Advisory", tagline: "Kenya Business Advisory & Corporate Support Platform" },
        categories: [],
        services: [],
        pricingFees: [],
        solutions: [],
        insights: [],
        faqs: [],
        consultationRequests: [],
        proposalRequests: [],
        media: [],
        contactMessages: [],
        adminUsers: [],
        activityLogs: [],
        analytics: { overview: {}, topServices: [], trafficSources: [] }
      };
    }
  };

  window.KivantaDB = KivantaDB;
})(window);

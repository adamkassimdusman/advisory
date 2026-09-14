/**
 * Kivanta Advisory - Global Theme System Controller
 * Handles System (default), Light, and Dark mode preferences with zero FOUC,
 * smooth transitions, media query OS listeners, and persistent client-side state.
 */

(function (window) {
  'use strict';

  const STORAGE_KEY = 'kivanta_theme';

  const KivantaTheme = {
    mediaQuery: window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null,

    getPreference() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          return stored;
        }
      } catch (e) {
        console.warn('Unable to access localStorage for theme preference:', e);
      }
      return 'system';
    },

    getSystemTheme() {
      if (this.mediaQuery && this.mediaQuery.matches) {
        return 'dark';
      }
      return 'light';
    },

    getResolvedTheme(preference) {
      const pref = preference || this.getPreference();
      if (pref === 'system') {
        return this.getSystemTheme();
      }
      return pref;
    },

    setPreference(preference) {
      const validPref = (preference === 'light' || preference === 'dark' || preference === 'system')
        ? preference
        : 'system';

      try {
        localStorage.setItem(STORAGE_KEY, validPref);
      } catch (e) {
        console.warn('Unable to save theme preference to localStorage:', e);
      }

      this.applyTheme(validPref, true);
    },

    applyTheme(preference, animate) {
      const pref = preference || this.getPreference();
      const resolved = this.getResolvedTheme(pref);
      const root = document.documentElement;

      if (animate === false) {
        root.classList.add('no-transitions');
      }

      root.setAttribute('data-theme', resolved);
      root.setAttribute('data-theme-preference', pref);

      if (animate === false) {
        // Re-enable CSS transitions after initial paint
        requestAnimationFrame(() => {
          setTimeout(() => {
            root.classList.remove('no-transitions');
          }, 50);
        });
      }

      this.updateUI(pref, resolved);

      // Dispatch global event for custom components
      window.dispatchEvent(new CustomEvent('kivanta:theme-changed', {
        detail: { preference: pref, resolved: resolved }
      }));
    },

    updateUI(preference, resolved) {
      // Synchronize all dropdown selectors
      const selectors = document.querySelectorAll('.theme-selector-select, select[data-theme-select]');
      selectors.forEach(select => {
        if (select.value !== preference) {
          select.value = preference;
        }
      });

      // Synchronize toggle buttons
      const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
      toggleBtns.forEach(btn => {
        const icon = btn.querySelector('i');
        if (icon) {
          if (preference === 'system') {
            icon.className = 'fas fa-desktop';
            btn.setAttribute('title', 'Theme: System (Auto)');
          } else if (resolved === 'dark') {
            icon.className = 'fas fa-moon';
            btn.setAttribute('title', 'Theme: Dark Mode');
          } else {
            icon.className = 'fas fa-sun';
            btn.setAttribute('title', 'Theme: Light Mode');
          }
        }
        btn.setAttribute('aria-label', `Theme Selector: Currently ${preference} mode`);
      });

      // Synchronize 3-way toggle buttons if present
      const options = document.querySelectorAll('[data-theme-option]');
      options.forEach(opt => {
        const val = opt.getAttribute('data-theme-option');
        if (val === preference) {
          opt.classList.add('active');
          opt.setAttribute('aria-checked', 'true');
        } else {
          opt.classList.remove('active');
          opt.setAttribute('aria-checked', 'false');
        }
      });
    },

    bindEvents() {
      // Delegated listener for dropdown select changes
      document.addEventListener('change', (e) => {
        if (e.target && (e.target.matches('.theme-selector-select') || e.target.matches('select[data-theme-select]'))) {
          this.setPreference(e.target.value);
        }
      });

      // Delegated listener for quick toggle button clicks (rotates System -> Light -> Dark -> System)
      document.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('.theme-toggle-btn');
        if (toggleBtn) {
          e.preventDefault();
          const currentPref = this.getPreference();
          let nextPref = 'system';
          if (currentPref === 'system') {
            nextPref = 'light';
          } else if (currentPref === 'light') {
            nextPref = 'dark';
          } else {
            nextPref = 'system';
          }
          this.setPreference(nextPref);
          return;
        }

        const optionBtn = e.target.closest('[data-theme-option]');
        if (optionBtn) {
          e.preventDefault();
          const selected = optionBtn.getAttribute('data-theme-option');
          this.setPreference(selected);
        }
      });

      // OS theme change listener
      if (this.mediaQuery) {
        const handleOSChange = () => {
          if (this.getPreference() === 'system') {
            this.applyTheme('system', true);
          }
        };

        if (this.mediaQuery.addEventListener) {
          this.mediaQuery.addEventListener('change', handleOSChange);
        } else if (this.mediaQuery.addListener) {
          this.mediaQuery.addListener(handleOSChange);
        }
      }
    },

    renderDropdownHtml(extraClass = '') {
      const pref = this.getPreference();
      return `
        <div class="theme-selector-wrapper ${extraClass}">
          <label for="kivanta-theme-select" class="visually-hidden">Select Theme</label>
          <select id="kivanta-theme-select" class="theme-selector-select form-select form-select-sm" data-theme-select aria-label="Select Theme Preference">
            <option value="system" ${pref === 'system' ? 'selected' : ''}>💻 System</option>
            <option value="light" ${pref === 'light' ? 'selected' : ''}>☀️ Light</option>
            <option value="dark" ${pref === 'dark' ? 'selected' : ''}>🌙 Dark</option>
          </select>
        </div>
      `;
    },

    init() {
      // Apply saved preference immediately on engine start
      const pref = this.getPreference();
      this.applyTheme(pref, false);
      this.bindEvents();
    }
  };

  // Expose engine to global scope
  window.KivantaTheme = KivantaTheme;

  // Auto-initialize when DOM ready or earlier
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => KivantaTheme.init());
  } else {
    KivantaTheme.init();
  }

})(window);

(function () {
    'use strict';

    // ---------------------------------------------------------------------------
    // Config access
    // ---------------------------------------------------------------------------

    function getConfigFallback() {
        // Minimal safe defaults if settings/config haven't loaded for some reason.
        const cfg = window.AOC_CONFIG || {};

        const totalDays = Number.isInteger(cfg.totalDays) ? cfg.totalDays : 25;

        return {
            totalDays,
            firstDay: Number.isInteger(cfg.firstDay) ? cfg.firstDay : 1,
            defaultDay: Number.isInteger(cfg.defaultDay) ? cfg.defaultDay : 1,
            year: cfg.year || new Date().getFullYear(),
            autoLoadExample: cfg.autoLoadExample !== false,
            paths: { inputs: 'inputs', solutions: 'solutions', ...(cfg.paths || {}) },
            nav: {
                maxAvailableDay: Number.isInteger(cfg.nav?.maxAvailableDay) ? cfg.nav.maxAvailableDay : totalDays,
                showDisabledFutureDays: cfg.nav?.showDisabledFutureDays !== false,
                ...(cfg.nav || {}),
            },
        };
    }

    function getActiveConfig() {
        // With the new approach, AOCSettings.get() already returns merged defaults
        // (based on AOC_CONFIG) plus session overrides. So router should not merge.
        if (window.AOCSettings && typeof window.AOCSettings.get === 'function') {
            return window.AOCSettings.get();
        }

        return getConfigFallback();
    }

    // ---------------------------------------------------------------------------
    // Helpers: hash parsing
    // ---------------------------------------------------------------------------

    function getCurrentDayFromHash() {
        const raw = (location.hash || '').replace('#', '').trim();
        const n = parseInt(raw, 10);
        if (Number.isNaN(n) || n <= 0) return null;
        return n;
    }

    // ---------------------------------------------------------------------------
    // Day bootstrapping
    // ---------------------------------------------------------------------------

    async function bootDay() {
        if (!window.NavUI || !window.AOCDay) {
            console.error('NavUI or AOCDay module not found.');
            return;
        }

        const day = getCurrentDayFromHash();
        const activeConfig = getActiveConfig();

        if (!day) {
            NavUI.setActiveDay(null);
            await AOCDay.showWelcome();
            return;
        }

        NavUI.setActiveDay(day);
        await AOCDay.setupDay(activeConfig, day);
    }

    // ---------------------------------------------------------------------------
    // Startup hooks
    // ---------------------------------------------------------------------------

    document.addEventListener('includesLoaded', () => {
        if (!window.NavUI || !window.AOCDay) {
            console.error('NavUI or AOCDay module not found.');
            return;
        }

        NavUI.buildDayNav(getActiveConfig());
        bootDay();
    });

    // Rebuild nav if settings change (year/day availability/totalDays might change)
    document.addEventListener('aocSettingsChanged', () => {
        if (!window.NavUI) return;
        NavUI.buildDayNav(getActiveConfig());
        bootDay();
    });

    window.addEventListener('hashchange', () => {
        bootDay();
    });
})();

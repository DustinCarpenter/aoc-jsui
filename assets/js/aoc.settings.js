(function () {
    'use strict';

    // Persist settings across browser sessions
    const STORAGE_KEY = 'aoc.settings';

    function readStored() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    function writeStored(overrides) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    }

    function deepMerge(base, patch) {
        const out = { ...(base || {}) };
        for (const key of Object.keys(patch || {})) {
            const v = patch[key];
            if (v && typeof v === 'object' && !Array.isArray(v)) {
                out[key] = deepMerge(out[key], v);
            } else {
                out[key] = v;
            }
        }
        return out;
    }

    function clampInt(value, min, max, fallback) {
        const n = parseInt(value, 10);
        if (Number.isNaN(n)) return fallback;
        return Math.min(Math.max(n, min), max);
    }

    function getDayCountForYear(year) {
        // AoC: 25 days for 2015–2024, and 12 days from 2025 onward.
        return year >= 2025 ? 12 : 25;
    }

    function computeUnlockedDays(year, totalDays) {
        const now = new Date();
        const currentYear = now.getFullYear();
        const month = now.getMonth(); // 0=Jan, 11=Dec
        const dayOfMonth = now.getDate();

        // Past years: fully unlocked.
        if (year < currentYear) return totalDays;

        // Future years: locked.
        if (year > currentYear) return 0;

        // Current year: unlock by date in December.
        if (month < 11) return 0; // before December
        if (month > 11) return totalDays; // after December

        return Math.min(dayOfMonth, totalDays);
    }

    function migrateLegacyThemeKey(stored) {
        // Legacy key: localStorage["theme"] = "light" | "dark"
        // New source of truth: aoc.settings.theme
        let nextStored = stored || {};
        try {
            const legacy = localStorage.getItem('theme');
            if (!legacy) return nextStored;

            const legacyTheme = legacy === 'light' ? 'light' : 'dark';

            if (typeof nextStored.theme !== 'string') {
                nextStored = { ...nextStored, theme: legacyTheme };
                writeStored(nextStored);
            }

            localStorage.removeItem('theme');
            return nextStored;
        } catch {
            return nextStored;
        }
    }

    function resolveTheme(merged, cfg) {
        // Source of truth is aoc.settings (merged.theme). No standalone key.
        const fromMerged = typeof merged.theme === 'string' ? merged.theme : '';
        const theme = (fromMerged || cfg.theme || 'dark') === 'light' ? 'light' : 'dark';
        return theme;
    }

    function get() {
        const storedRaw = readStored() || {};
        const stored = migrateLegacyThemeKey(storedRaw);

        const cfg = window.AOC_CONFIG || {};
        const merged = deepMerge(cfg, stored);

        const now = new Date();
        const currentYear = now.getFullYear();

        const selectedYear = parseInt(merged.year, 10);
        const year = selectedYear || cfg.year || currentYear;

        const totalDays = getDayCountForYear(year);
        const maxAvailableDay = computeUnlockedDays(year, totalDays);

        const cfgNav = cfg.nav || {};
        const mergedNav = merged.nav || {};

        const theme = resolveTheme(merged, cfg);

        return {
            currentYear,
            year,
            theme,
            autoLoadExample: merged.autoLoadExample !== false,
            autoLoadSolutions: merged.autoLoadSolutions !== false,
            totalDays,
            paths: { inputs: 'inputs', solutions: 'solutions', ...(merged.paths || {}) },
            nav: {
                ...(cfgNav || {}),
                ...(mergedNav || {}),
                showDisabledFutureDays: mergedNav.showDisabledFutureDays !== false,
                maxAvailableDay, // computed, not user-settable
            },

            dayLayout: merged.dayLayout || cfg.dayLayout || 'tabbed',

            // Keep these even if not currently used by UI; they’re harmless defaults
            //firstDay: clampInt(merged.firstDay, 1, totalDays, 1),
            //defaultDay: clampInt(merged.defaultDay, 1, totalDays, 1),
        };
    }

    function set(patch) {
        // Do not allow callers to set computed values
        if (patch && Object.prototype.hasOwnProperty.call(patch, 'totalDays')) {
            delete patch.totalDays;
        }
        if (patch?.nav && Object.prototype.hasOwnProperty.call(patch.nav, 'maxAvailableDay')) {
            delete patch.nav.maxAvailableDay;
        }

        // Normalize theme in the stored settings object (no standalone localStorage["theme"])
        if (patch && typeof patch.theme === 'string') {
            patch.theme = patch.theme === 'light' ? 'light' : 'dark';
        }

        const currentOverrides = migrateLegacyThemeKey(readStored() || {});
        const nextOverrides = deepMerge(currentOverrides, patch);
        writeStored(nextOverrides);

        const settings = get();
        document.dispatchEvent(new CustomEvent('aocSettingsChanged', { detail: { settings } }));
        return settings;
    }

    function reset() {
        localStorage.removeItem(STORAGE_KEY);
        const settings = get();
        document.dispatchEvent(new CustomEvent('aocSettingsChanged', { detail: { settings } }));
        return settings;
    }

    window.AOCSettings = { get, set, reset };
})();

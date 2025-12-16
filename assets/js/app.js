(function () {
    'use strict';

    // ---------------------------------------------------------------------------
    // Early theme bootstrap (prevents light-theme flash)
    // ---------------------------------------------------------------------------

    (function bootstrapTheme() {
        try {
            const raw = localStorage.getItem('aoc.settings');
            const settings = raw ? JSON.parse(raw) : {};
            const theme = settings.theme === 'light' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-bs-theme', theme);
        } catch {
            document.documentElement.setAttribute('data-bs-theme', 'dark');
        }
    })();

    // ---------------------------------------------------------------------------
    // Header helpers
    // ---------------------------------------------------------------------------

    function updateHeaderYear() {
        const el = document.getElementById('aocHeaderYear');
        if (!el) return;

        if (window.AOCSettings && typeof window.AOCSettings.get === 'function') {
            const s = window.AOCSettings.get();
            el.textContent = s?.year ?? '';
            return;
        }

        const cfg = window.AOC_CONFIG || {};
        el.textContent = cfg.year || new Date().getFullYear();
    }

    // ---------------------------------------------------------------------------
    // Theme: light / dark
    // ---------------------------------------------------------------------------

    function dispatchThemeChanged(theme) {
        document.dispatchEvent(new CustomEvent('aocThemeChanged', { detail: { theme } }));
    }

    function getSettingsSafe() {
        if (window.AOCSettings && typeof window.AOCSettings.get === 'function') {
            return window.AOCSettings.get();
        }

        // Fallback: read aoc.settings directly (no standalone theme key)
        try {
            const raw = localStorage.getItem('aoc.settings');
            const s = raw ? JSON.parse(raw) : {};
            return {
                theme: s.theme === 'light' ? 'light' : 'dark',
                year: s.year || new Date().getFullYear(),
                autoLoadExample: s.autoLoadExample !== false,
                autoLoadSolutions: s.autoLoadSolutions !== false,
                totalDays: s.totalDays || 25,
                paths: s.paths || { inputs: 'inputs', solutions: 'solutions' },
                nav: s.nav || { maxAvailableDay: 25, showDisabledFutureDays: true },
                dayLayout: s.dayLayout || 'day',
            };
        } catch {
            return {
                theme: 'dark',
                year: new Date().getFullYear(),
                autoLoadExample: true,
                autoLoadSolutions: true,
                totalDays: 25,
                paths: { inputs: 'inputs', solutions: 'solutions' },
                nav: { maxAvailableDay: 25, showDisabledFutureDays: true },
                dayLayout: 'day',
            };
        }
    }

    function applyTheme(theme) {
        const t = theme === 'light' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-bs-theme', t);
        if (document.body) document.body.setAttribute('data-bs-theme', t);

        dispatchThemeChanged(t);
    }

    function setTheme(theme) {
        if (window.AOCSettings && typeof window.AOCSettings.set === 'function') {
            // AOCSettings.set persists to aoc.settings and dispatches aocSettingsChanged
            window.AOCSettings.set({ theme });
        } else {
            // Fallback: write to aoc.settings (no standalone theme key)
            try {
                const raw = localStorage.getItem('aoc.settings');
                const s = raw ? JSON.parse(raw) : {};
                s.theme = theme === 'light' ? 'light' : 'dark';
                localStorage.setItem('aoc.settings', JSON.stringify(s));
            } catch {
                // ignore
            }
        }
        applyTheme(theme);
    }

    function initTheme() {
        const toggleBtn = document.getElementById('themeToggle');

        const initial = getSettingsSafe();
        applyTheme(initial?.theme || 'dark');

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const current = document.documentElement.getAttribute('data-bs-theme') === 'light' ? 'light' : 'dark';
                const next = current === 'light' ? 'dark' : 'light';
                setTheme(next);
            });
        }

        document.addEventListener('aocSettingsChanged', (e) => {
            const theme = e?.detail?.settings?.theme;
            if (theme) applyTheme(theme);
            updateHeaderYear();
        });
    }

    // ---------------------------------------------------------------------------
    // Includes
    // ---------------------------------------------------------------------------

    function withAssetVersion(url) {
        try {
            const v = window.AOC_ASSET_VERSION;
            if (!v) return url;

            const isLocal = !/^https?:\/\//i.test(url);
            if (!isLocal) return url;

            // Avoid adding duplicate v=...
            if (/[?&]v=/.test(url)) return url;

            const join = url.includes('?') ? '&' : '?';
            return `${url}${join}v=${encodeURIComponent(v)}`;
        } catch {
            return url;
        }
    }

    async function loadIncludes() {
        const includeElements = document.querySelectorAll('[data-include]');
        if (!includeElements.length) {
            document.dispatchEvent(new Event('includesLoaded'));
            return;
        }

        await Promise.all(
            Array.from(includeElements).map(async (el) => {
                let file = el.getAttribute('data-include');
                if (!file) return;

                file = withAssetVersion(file);

                try {
                    const resp = await fetch(file, { cache: 'no-cache' });
                    if (!resp.ok) throw new Error(`Failed to fetch ${file}: ${resp.status}`);
                    el.innerHTML = await resp.text();
                } catch (err) {
                    console.error('Include load failed:', file, err);
                    el.innerHTML = `<p class="text-danger mb-0">Failed to load include: <code>${file}</code></p>`;
                    return;
                }

                el.querySelectorAll('script').forEach((oldScript) => {
                    const newScript = document.createElement('script');

                    if (oldScript.src) {
                        newScript.src = withAssetVersion(oldScript.src);
                    } else {
                        newScript.textContent = oldScript.textContent;
                    }

                    document.body.appendChild(newScript);
                    oldScript.remove();
                });
            })
        );

        document.dispatchEvent(new Event('includesLoaded'));
    }

    // ---------------------------------------------------------------------------
    // Settings UI wiring (modal)
    // ---------------------------------------------------------------------------

    function initSettingsUI() {
        if (!window.AOCSettings || typeof window.AOCSettings.get !== 'function') return;

        const elTheme = document.getElementById('settingTheme');
        if (!elTheme) return;

        const elYear = document.getElementById('settingYear');
        const elMaxAvail = document.getElementById('settingMaxAvailableDay');
        const elContestUnlockHelp = document.getElementById('settingContestUnlockHelp');

        const elAuto = document.getElementById('settingAutoLoadExample');
        const elAutoLoadSolutions = document.getElementById('settingAutoLoadSolutions');

        const elIn = document.getElementById('settingInputsPath');
        const elSol = document.getElementById('settingSolutionsPath');

        const elShowDisabled = document.getElementById('settingShowDisabledDays');
        const elDayLayout = document.getElementById('settingDayLayout');

        function clampInt(value, min, max, fallback) {
            const n = parseInt(value, 10);
            if (Number.isNaN(n)) return fallback;
            return Math.min(Math.max(n, min), max);
        }

        function contestDaysForYear(y) {
            return y >= 2025 ? 12 : 25;
        }

        function computeUnlockedDaysForYear(year, totalDays) {
            const now = new Date();
            const currentYear = now.getFullYear();
            const month = now.getMonth(); // 0=Jan, 11=Dec
            const dayOfMonth = now.getDate();

            if (year < currentYear) return totalDays;
            if (year > currentYear) return 0;

            if (month < 11) return 0;
            if (month > 11) return totalDays;

            return Math.min(dayOfMonth, totalDays);
        }

        function updateContestAndUnlockUI(year) {
            if (!year || Number.isNaN(year)) return;

            const totalDays = contestDaysForYear(year);
            const maxUnlocked = computeUnlockedDaysForYear(year, totalDays);

            if (elMaxAvail) elMaxAvail.value = maxUnlocked;

            if (elContestUnlockHelp) {
                elContestUnlockHelp.textContent = `Contest days: ${totalDays} · Unlocked through day: ${maxUnlocked} (auto)`;
            }
        }

        if (elYear) {
            elYear.addEventListener('input', () => {
                const y = parseInt(elYear.value, 10);
                if (!Number.isNaN(y)) updateContestAndUnlockUI(y);
            });
        }

        function populateFromSettings() {
            const s = window.AOCSettings.get();

            elTheme.value = s.theme || 'dark';

            const y = s.year || new Date().getFullYear();
            if (elYear) elYear.value = y;

            if (elMaxAvail) elMaxAvail.value = s.nav?.maxAvailableDay ?? '';

            if (elContestUnlockHelp) {
                elContestUnlockHelp.textContent = `Contest days: ${s.totalDays ?? ''} · Unlocked through day: ${
                    s.nav?.maxAvailableDay ?? ''
                } (auto)`;
            }

            if (elAuto) elAuto.checked = !!s.autoLoadExample;
            if (elAutoLoadSolutions) elAutoLoadSolutions.checked = !!s.autoLoadSolutions;

            if (elIn) elIn.value = s.paths?.inputs || 'inputs';
            if (elSol) elSol.value = s.paths?.solutions || 'solutions';

            if (elShowDisabled) elShowDisabled.checked = s.nav?.showDisabledFutureDays !== false;
            if (elDayLayout) elDayLayout.value = s.dayLayout || 'day';

            updateContestAndUnlockUI(y);
        }

        populateFromSettings();
        updateHeaderYear();

        const saveBtn = document.getElementById('settingsSaveBtn');
        if (saveBtn) {
            saveBtn.onclick = () => {
                const selectedYear = clampInt(elYear?.value, 2015, 9999, new Date().getFullYear());

                const next = window.AOCSettings.set({
                    theme: elTheme.value,
                    year: selectedYear,
                    dayLayout: elDayLayout?.value || 'day',
                    autoLoadExample: !!elAuto?.checked,
                    autoLoadSolutions: !!elAutoLoadSolutions?.checked,
                    paths: {
                        inputs: elIn?.value.trim() || 'inputs',
                        solutions: elSol?.value.trim() || 'solutions',
                    },
                    nav: {
                        showDisabledFutureDays: !!elShowDisabled?.checked,
                    },
                });

                applyTheme(next.theme);
                updateHeaderYear();
            };
        }

        const resetBtn = document.getElementById('settingsResetBtn');
        if (resetBtn) {
            resetBtn.onclick = () => {
                const next = window.AOCSettings.reset();
                populateFromSettings();
                applyTheme(next.theme);
                updateHeaderYear();
            };
        }

        document.addEventListener('aocSettingsChanged', () => {
            populateFromSettings();
            updateHeaderYear();
        });
    }

    // ---------------------------------------------------------------------------
    // Startup
    // ---------------------------------------------------------------------------

    document.addEventListener('DOMContentLoaded', () => {
        initTheme();
        updateHeaderYear();
        loadIncludes();
    });

    document.addEventListener('includesLoaded', () => {
        initSettingsUI();
    });
})();

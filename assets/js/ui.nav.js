(function () {
    'use strict';

    // ---------------------------------------------------------------------------
    // NavUI: build and update day navigation
    // ---------------------------------------------------------------------------

    function setActiveDay(dayOrNull) {
        const navEl = document.getElementById('dayNav');
        if (!navEl) return;

        const links = navEl.querySelectorAll('a[data-day]');
        links.forEach((a) => {
            const linkDay = parseInt(a.dataset.day, 10);
            if (dayOrNull && linkDay === dayOrNull) {
                a.classList.add('active');
            } else {
                a.classList.remove('active');
            }
        });
    }

    function buildDayNav(config) {
        const navEl = document.getElementById('dayNav');
        if (!navEl) return;

        // Defensive defaults (so settings-only objects won't crash)
        const totalDays = Number.isInteger(config?.totalDays) ? config.totalDays : 25;
        const nav = config?.nav || {};
        const maxAvailable = Number.isInteger(nav.maxAvailableDay) ? nav.maxAvailableDay : totalDays;
        const showDisabled = nav.showDisabledFutureDays !== false;

        navEl.innerHTML = '';

        for (let day = 1; day <= totalDays; day++) {
            const li = document.createElement('li');
            li.className = 'nav-item';

            const a = document.createElement('a');
            a.className = 'nav-link text-warning border border-success ps-3 pe-3 m-1';
            a.textContent = String(day);
            a.dataset.day = String(day);

            if (day <= maxAvailable) {
                a.href = `#${day}`;
            } else if (showDisabled) {
                a.href = 'javascript:void(0)';
                a.classList.add('text-muted', 'disabled');
                a.setAttribute('aria-disabled', 'true');
            } else {
                // hidden entirely
                continue;
            }

            li.appendChild(a);
            navEl.appendChild(li);
        }

        setActiveDay(null);
    }

    // ---------------------------------------------------------------------------
    // Public API
    // ---------------------------------------------------------------------------

    window.NavUI = {
        buildDayNav,
        setActiveDay,
    };
})();

window.AOC_CONFIG = {
    // The year this UI build is "for" (fixed, not user-configurable)
    currentYear: 2025,

    // Default selected AoC year (user can change via Settings)
    year: 2025,

    // NOTE: AoC had 25 days from 2015–2024, and 12 days from 2025 onward.
    // These values are the defaults for the selected year (2025+).
    totalDays: 12,

    // Where project files live (relative paths)
    paths: {
        inputs: 'inputs',
        solutions: 'solutions',
    },

    // Navigation behavior
    nav: {
        // Last day of the challenge
        // If year is < 2025: defaults to 25
        maxAvailableDay: 12,

        // If false, days past maxAvailableDay are hidden entirely
        // If true, they appear disabled
        showDisabledFutureDays: true,
    },

    // Automatically load the input file (if present)
    autoLoadExample: true,

    // Auto-load solution files (if present)
    autoLoadSolutions: true,

    // Solutin Layout: 'day' (side-by-side) or 'tabbed'
    dayLayout: 'tabbed',
};

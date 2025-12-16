# aoc-jsui

A lightweight, zero-build Advent of Code JavaScript scratchpad that runs entirely in your browser.

If you'd like to view it online you can View the hosted version [here](https://aoc.wayspring.net).

---

## ⚡ What is aoc-jsui?

**aoc-jsui** is a small front-end interface for solving Advent of Code puzzles in JavaScript: open a day, paste input (or load a local example), write code, run it, and save your solution files.

There is no backend, no build steps, and no hosted puzzle text. Puzzle descriptions remain on the **Advent Of Code** website: https://www.adventofcode.com  
Inputs and solutions are handled locally via files and your browser.

---

## ❓ Why did I make this?

Honestly, I had as much fun working on the interface as I did working on the puzzles. Nobody _needs_ this system, but it was fun to make and I thought I would share with the AoC community.

---

## ▶️ Quick start

1. Open `index.html` in your browser. You can serve the folder with any static server or use the VS Code Live Server extension:  
   https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer
2. Pick a **Year** in Settings (top toolbar).
3. Click a day in the nav (URL hash updates like `#6`).
4. Paste your input into **Puzzle Input**, or use the local example action to load a file if you keep examples on disk.
5. Write your solution in the editor and click **Run**.
6. Use **Save** to download your JS file, then move it into the appropriate folder.

---

## ⚙️ Settings behavior

-   Settings are stored in your browser (local storage) and persist across sessions.
-   **Theme** switches light/dark and applies to the whole UI.
-   **Day layout** controls how Part 1 / Part 2 are presented: **Tabbed** or **Side-by-side**.
-   The nav’s unlocked days are calculated automatically based on the selected year and today’s date.
-   Tip: If you run into caching while editing locally, bump your asset version (in `index.html`) or hard refresh.

---

## 📥 Inputs

The input box is shared between Part 1 and Part 2. Your personal puzzle input is only used locally in the browser.

### Local example inputs

If you keep example inputs on disk, save them here:

```
inputs/{year}/{day}-input.txt
```

With _Auto-load example input_ enabled, the app will load this file automatically when the day opens. Otherwise you can click **Get local example**.

### Personal puzzle input

Get your input from the official AoC site and paste it into the input box.

This project intentionally does not fetch or store your personalized AoC input.

---

## 🧩 Solutions

### Day-specific solution files

Put your solutions here:

```
solutions/{year}/{day}-1.js
solutions/{year}/{day}-2.js
```

With _Auto-load solutions_ enabled, the app loads these automatically when the day opens.

### Default templates

If a day-specific solution file doesn’t exist, the editor starts from a template:

```
solutions/solution-1.js
solutions/solution-2.js
```

This keeps the editor from opening blank and gives you a consistent starting point.

### Execution contract

-   Your code receives the full input as a string named `input`.
-   Whatever you `return` is shown in the output box for that part.
-   Use the save button to download your work. Place the downloaded file into the correct `solutions/{year}/` folder to have it auto-load next time.

---

## 🧭 How navigation works

The router listens to the URL hash (for example `#5`) and loads the day template, initializes the editors, and then attempts to load inputs/solutions for that day.

-   **Past years:** all days are unlocked.
-   **Current year:** days unlock automatically during December.
-   **Future years:** days remain disabled until the contest starts.

---

## 🧱 Technologies used

This project intentionally sticks to well-known, low-friction web technologies. The goal is to keep the system easy to understand, easy to modify, and easy to run without any build tooling or backend services.

### Core web technologies

-   **HTML5** — page structure, layout, and HTML includes for shared UI fragments.
-   **CSS3** — layout tweaks, theming adjustments, and small utility styles.
-   **Vanilla JavaScript (ES6+)** — all application logic, routing, state handling, and file interactions.
-   **Browser APIs** — `localStorage`, `fetch`, URL hash navigation, and file save/download behavior.

### UI & presentation

-   **Bootstrap 5** — responsive grid, layout utilities, components, and dark/light theme support.  
    https://getbootstrap.com/
-   **Bootstrap Icons** — toolbar, navigation, and action icons.  
    https://icons.getbootstrap.com/

### Code editing & execution

-   **CodeMirror** — in-browser JavaScript editor for Part 1 and Part 2 solutions.  
    https://codemirror.net/
-   **Dynamic evaluation** — user-written solution code executes in a controlled runtime using the input/return contract.
-   **Editor templates** — fallback starter files provide consistent defaults when no solution exists yet.

### Application structure

-   **Hash-based routing** — day navigation driven by the URL hash (`#1`, `#2`, etc.).
-   **Modular JS files** — separate files for routing, settings, navigation, editor management, and day logic.
-   **Configuration-driven behavior** — year selection, layout choice, paths, and feature toggles via config + persisted settings.

### What’s intentionally not used

-   No backend or server-side code
-   No build tools or bundlers
-   No frameworks (React, Vue, etc.)
-   No external APIs for puzzle content or inputs

If you’re comfortable with modern HTML, CSS, and JavaScript, everything in this project should feel approachable and easy to extend.

---

## 🖌️ Formatting & editor setup

This project includes editor formatting conventions so files stay consistent across machines and commits. The intention is to keep diffs clean and avoid “style debates” while you’re focused on solving puzzles.

### Prettier

JavaScript / TypeScript / JSON / HTML / CSS formatting is handled by **Prettier**:  
https://prettier.io/

VS Code extension:  
https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode

-   Recommended: enable **Format on Save**.
-   This repo prefers Prettier for most web files.

### EditorConfig

Basic whitespace rules (indentation, line endings, trimming) are enforced with **EditorConfig** via `.editorconfig`:  
https://editorconfig.org/

VS Code extension:  
https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig

-   Keeps indentation and line endings consistent.
-   Avoids noisy diffs from whitespace changes.

### VS Code notes

Commonly useful extensions (not required):

-   Prettier — https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode
-   EditorConfig — https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig
-   Live Server — https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer

None of these are required — the app runs fine as a plain static site.

---

## 🗂️ Key files

### Core app

-   `assets/js/app.js` — theme + include loader + settings UI wiring
-   `assets/js/aoc.settings.js` — settings persistence + computed values
-   `assets/js/router.js` — hash-based routing
-   `assets/js/aoc.day.js` — day wiring (inputs/outputs/editors/save/load)

### UI modules

-   `assets/js/ui.nav.js` — nav builder + day locking UI
-   `assets/js/ui.editors.js` — CodeMirror setup + run/save/fullscreen
-   `assets/js/config.js` — defaults (year, paths, layout default, etc.)

If you’re reading the source, most behavior is intentionally straightforward: load HTML includes, build the nav, render a day, and glue inputs + editors together.

---

## 🛡️ Notes on AoC content

Advent of Code puzzle content is owned by Advent of Code / Eric Wastl. This project does not ship puzzle text, and avoids storing personal inputs.

If you share this project, keep example inputs and solutions in your own local folders, and link to the official site for puzzle statements.

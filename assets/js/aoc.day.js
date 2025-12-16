(function () {
    'use strict';

    async function ensureTemplateLoaded(templateFile = 'day.html') {
        const container = document.getElementById('dayContainer');
        if (!container) return;

        const currentTemplate = container.dataset.templateName || '';
        const alreadyLoaded = container.dataset.templateLoaded === 'true';

        // If a different layout/template is requested, force a reload.
        if (alreadyLoaded && currentTemplate === templateFile) return;

        try {
            container.classList.add('d-none');

            const resp = await fetch(templateFile, { cache: 'no-cache' });
            if (!resp.ok) throw new Error(`Failed to fetch ${templateFile}: ${resp.status}`);

            container.innerHTML = await resp.text();
            container.dataset.templateLoaded = 'true';
            container.dataset.templateName = templateFile;
        } catch (err) {
            console.error('Failed to load day template:', err);
            container.innerHTML = "<p class='text-danger'>Failed to load day template.</p>";
            container.dataset.templateLoaded = 'false';
            container.dataset.templateName = '';
        }

        container.classList.remove('d-none');
    }

    async function showWelcome() {
        const container = document.getElementById('dayContainer');
        if (!container) return;

        try {
            container.classList.add('d-none');

            const resp = await fetch('welcome.html', { cache: 'no-cache' });
            if (!resp.ok) throw new Error(`Failed to fetch welcome.html: ${resp.status}`);

            container.innerHTML = await resp.text();
            container.dataset.templateLoaded = 'false';
            container.dataset.templateName = '';
        } catch (err) {
            console.error('Failed to load welcome.html:', err);
            container.innerHTML = "<p class='text-danger'>Failed to load welcome content.</p>";
        }

        container.classList.remove('d-none');
    }

    async function fetchTextOrNull(url) {
        try {
            const resp = await fetch(url, { cache: 'no-cache' });
            if (!resp.ok) return null;
            return await resp.text();
        } catch (err) {
            console.warn('Failed to fetch', url, err);
            return null;
        }
    }

    async function applyDayVars(config, day) {
        const { paths, autoLoadExample, year } = config;
        const inputsBase = `${paths.inputs}/${year}`;

        const dayNumber = document.getElementById('dayNumber');
        if (dayNumber) dayNumber.textContent = day;

        document.title = `aoc-jsui | Day ${day} | ${year}`;

        const inputUrl = `https://adventofcode.com/${year}/day/${day}/input`;

        const instructionsBtn = document.getElementById('officialInstructionsBtn');
        if (instructionsBtn) {
            instructionsBtn.href = `https://adventofcode.com/${year}/day/${day}`;
        }

        const officialInputBtn = document.getElementById('officialInputBtn');
        if (officialInputBtn) {
            officialInputBtn.href = inputUrl;
        }

        const puzzleInput = document.getElementById('puzzleInput');
        const linkExample = document.getElementById('loadPuzzleExample');

        const exampleUrl = `${inputsBase}/${day}-input.txt`;

        if (puzzleInput) puzzleInput.value = '';

        if (linkExample) {
            linkExample.onclick = async (e) => {
                e.preventDefault();
                if (!puzzleInput) return;

                const txt = await fetchTextOrNull(exampleUrl);
                puzzleInput.value = txt != null ? txt : '';

                if (txt == null) {
                    alert(`File not found: ${exampleUrl}`);
                }
            };
        }

        if (autoLoadExample && puzzleInput) {
            const txt = await fetchTextOrNull(exampleUrl);
            puzzleInput.value = txt != null ? txt : '';
        }
    }

    async function loadSolutionText(config, day, part) {
        const { paths, year, autoLoadSolutions } = config;

        if (!autoLoadSolutions) {
            EditorUI.setEditorCode(part, '');
            return;
        }

        const dayFile = `${paths.solutions}/${year}/${day}-${part}.js`;

        // NEW: default templates when day file doesn't exist
        const templateFile = `${paths.solutions}/solution-${part}.js`;

        try {
            const resp = await fetch(dayFile, { cache: 'no-cache' });
            if (resp.ok) {
                const code = await resp.text();
                EditorUI.setEditorCode(part, code);
                return;
            }

            // Day file missing -> load template
            const tplResp = await fetch(templateFile, { cache: 'no-cache' });
            if (tplResp.ok) {
                const tplCode = await tplResp.text();
                EditorUI.setEditorCode(part, tplCode);
                return;
            }

            // Neither exists
            EditorUI.setEditorCode(part, '');
        } catch (err) {
            console.warn('Failed to load solution:', dayFile, err);

            // On any error, try template once as a fallback
            try {
                const tplResp = await fetch(templateFile, { cache: 'no-cache' });
                if (tplResp.ok) {
                    const tplCode = await tplResp.text();
                    EditorUI.setEditorCode(part, tplCode);
                    return;
                }
            } catch (tplErr) {
                console.warn('Failed to load template solution:', templateFile, tplErr);
            }

            EditorUI.setEditorCode(part, '');
        }
    }

    function resetPuzzleFields() {
        const puzzleInput = document.getElementById('puzzleInput');
        const out1 = document.getElementById('puzzleOutput');
        const out2 = document.getElementById('puzzleOutput2');

        if (puzzleInput) puzzleInput.value = '';
        if (out1) out1.value = '';
        if (out2) out2.value = '';
    }

    function wireTabbedInputSwap() {
        const inputSection = document.getElementById('puzzleInputSection');
        const slot1 = document.getElementById('puzzleInputSlot1');
        const slot2 = document.getElementById('puzzleInputSlot2');
        if (!inputSection || !slot1 || !slot2) return;

        const moveTo = (slot) => {
            if (!slot) return;
            slot.appendChild(inputSection);
        };

        // Default to Part 1 on initial render
        moveTo(slot1);

        const part1Tab = document.getElementById('part1-tab');
        const part2Tab = document.getElementById('part2-tab');

        const refreshCodeMirrorInPane = (paneId) => {
            const cmEl = document.querySelector(`${paneId} .CodeMirror`);
            const cm = cmEl?.CodeMirror;
            if (cm && typeof cm.refresh === 'function') {
                cm.refresh();
            }
        };

        const refreshSoon = (part) => {
            const paneId = part === 2 ? '#part2-pane' : '#part1-pane';

            requestAnimationFrame(() => {
                refreshCodeMirrorInPane(paneId);
                setTimeout(() => refreshCodeMirrorInPane(paneId), 50);
                setTimeout(() => refreshCodeMirrorInPane(paneId), 250);
            });
        };

        part1Tab?.addEventListener('shown.bs.tab', () => {
            moveTo(slot1);
            refreshSoon(1);
        });

        part2Tab?.addEventListener('shown.bs.tab', () => {
            moveTo(slot2);
            refreshSoon(2);
        });
    }

    function ensurePart1TabActive() {
        const part1Tab = document.getElementById('part1-tab');
        if (!part1Tab) return;

        const bs = window.bootstrap;
        if (bs && bs.Tab && typeof bs.Tab.getOrCreateInstance === 'function') {
            bs.Tab.getOrCreateInstance(part1Tab).show();
            return;
        }

        const part2Tab = document.getElementById('part2-tab');
        const part1Pane = document.getElementById('part1-pane');
        const part2Pane = document.getElementById('part2-pane');

        part1Tab.classList.add('active');
        part1Tab.setAttribute('aria-selected', 'true');
        part2Tab?.classList.remove('active');
        part2Tab?.setAttribute('aria-selected', 'false');

        part1Pane?.classList.add('show', 'active');
        part2Pane?.classList.remove('show', 'active');
    }

    function buildAoCContext(day) {
        const puzzleInput = document.getElementById('puzzleInput');
        const out1 = document.getElementById('puzzleOutput');
        const out2 = document.getElementById('puzzleOutput2');

        return {
            getInput() {
                if (!puzzleInput) return '';
                return puzzleInput.value || '';
            },
            setPart1(result) {
                if (!out1) return;
                out1.value = result === undefined ? '' : String(result);
            },
            setPart2(result) {
                if (!out2) return;
                out2.value = result === undefined ? '' : String(result);
            },
            day,
        };
    }

    async function saveSolution(day, part) {
        const code = EditorUI.getEditorCode(part);
        if (!code.trim()) {
            alert('Nothing to save.');
            return;
        }

        const filename = `${day}-${part}.js`;

        if (window.showSaveFilePicker) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{ description: 'JavaScript', accept: { 'text/javascript': ['.js'] } }],
                });

                const writable = await handle.createWritable();
                await writable.write(code);
                await writable.close();
                return;
            } catch (err) {
                console.warn('SaveAs cancelled or failed:', err);
            }
        }

        const blob = new Blob([code], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();

        URL.revokeObjectURL(url);
    }

    function wireButtons(day) {
        const ctx = buildAoCContext(day);

        const puzzleInput = document.getElementById('puzzleInput');
        const hasInputOrAlert = () => {
            const value = (puzzleInput?.value || '').trim();
            if (!value) {
                alert('No input provided.');
                return false;
            }
            return true;
        };

        const btnRun1 = document.getElementById('btnRunCode1');
        const btnRun2 = document.getElementById('btnRunCode2');
        const btnSave1 = document.getElementById('btnSaveCode1');
        const btnSave2 = document.getElementById('btnSaveCode2');

        if (btnRun1)
            btnRun1.onclick = () => {
                if (!hasInputOrAlert()) return;
                EditorUI.runSolution({
                    part: 1,
                    getInput: ctx.getInput,
                    setOutput: ctx.setPart1,
                });
            };

        if (btnRun2)
            btnRun2.onclick = () => {
                if (!hasInputOrAlert()) return;
                EditorUI.runSolution({
                    part: 2,
                    getInput: ctx.getInput,
                    setOutput: ctx.setPart2,
                });
            };

        if (btnSave1) btnSave1.onclick = () => saveSolution(day, 1);
        if (btnSave2) btnSave2.onclick = () => saveSolution(day, 2);
    }

    async function setupDay(config, day) {
        // Layout selection:
        // - 'tabbed' => day-tabbed.html
        // - anything else (default) => day.html
        const layout = (config?.dayLayout || '').toLowerCase();
        const templateFile = layout === 'tabbed' ? 'day-tabbed.html' : 'day.html';

        await ensureTemplateLoaded(templateFile);

        // Only tabbed layout has tabs/panes to activate and swap input between.
        if (layout === 'tabbed') {
            ensurePart1TabActive();
        }

        EditorUI.initEditors();
        EditorUI.resetEditors();
        resetPuzzleFields();

        if (layout === 'tabbed') {
            wireTabbedInputSwap();
        }

        await applyDayVars(config, day);

        await Promise.all([loadSolutionText(config, day, 1), loadSolutionText(config, day, 2)]);

        // Refresh CodeMirror after render; tabbed refresh happens in wireTabbedInputSwap()
        requestAnimationFrame(() => {
            const cmEl = document.querySelector('#part1-pane .CodeMirror') || document.querySelector('.CodeMirror');
            const cm = cmEl?.CodeMirror;
            if (cm && typeof cm.refresh === 'function') cm.refresh();
        });

        wireButtons(day);
    }

    window.AOCDay = {
        showWelcome,
        setupDay,
    };
})();

(function () {
    'use strict';

    // ---------------------------------------------------------------------------
    // Constants
    // ---------------------------------------------------------------------------

    const EDITOR_PARTS = [1, 2];

    // Map page theme -> CodeMirror theme
    function mapPageThemeToEditorTheme(pageTheme) {
        return pageTheme === 'dark' ? 'material-darker' : 'default';
    }

    function getPageTheme() {
        const theme = document.body.dataset.bsTheme || 'light';
        return theme === 'dark' ? 'dark' : 'light';
    }

    // ---------------------------------------------------------------------------
    // EditorManager: CodeMirror handling only
    // ---------------------------------------------------------------------------

    const EditorManager = (function () {
        const editors = { 1: null, 2: null };
        let currentEditorTheme = mapPageThemeToEditorTheme(getPageTheme());
        let controlsWired = false;
        let fullscreenPart = null; // 1 or 2 when in "large view", null otherwise

        function textareaIdForPart(part) {
            return part === 1 ? 'solutionEditor1' : 'solutionEditor2';
        }

        function getFullscreenButton(part) {
            const id = part === 1 ? 'btnFullscreen1' : 'btnFullscreen2';
            return document.getElementById(id);
        }

        function ensureInstances() {
            if (!window.CodeMirror) return;

            EDITOR_PARTS.forEach((part) => {
                const id = textareaIdForPart(part);
                const ta = document.getElementById(id);
                if (!ta) return;

                const existing = editors[part];

                // If we already have an editor instance, make sure it's still bound to
                // the current textarea and still attached to the DOM. When day.html is
                // re-injected (e.g., welcome -> day), the old textarea is replaced.
                if (existing) {
                    const existingTextarea = typeof existing.getTextArea === 'function' ? existing.getTextArea() : null;
                    const wrapper =
                        typeof existing.getWrapperElement === 'function' ? existing.getWrapperElement() : null;
                    const wrapperInDom = !!(wrapper && document.body.contains(wrapper));
                    const textareaMatches = existingTextarea === ta;

                    if (!wrapperInDom || !textareaMatches) {
                        const preserved = typeof existing.getValue === 'function' ? existing.getValue() : '';

                        try {
                            if (typeof existing.toTextArea === 'function') {
                                existing.toTextArea();
                            }
                        } catch (err) {
                            // If teardown fails for any reason, continue and recreate.
                            console.warn('Failed to detach old CodeMirror instance:', err);
                        }

                        editors[part] = null;
                        ta.value = preserved || '';
                    }
                }

                if (!editors[part]) {
                    editors[part] = CodeMirror.fromTextArea(ta, {
                        lineNumbers: true,
                        mode: 'javascript',
                        theme: currentEditorTheme,
                        autofocus: false,
                        indentUnit: 2,
                        tabSize: 2,
                    });
                } else {
                    // Keep theme in sync
                    editors[part].setOption('theme', currentEditorTheme);
                }
            });
        }

        function applyThemeFromPage(pageTheme) {
            currentEditorTheme = mapPageThemeToEditorTheme(pageTheme);

            EDITOR_PARTS.forEach((part) => {
                const cm = editors[part];
                if (cm) {
                    cm.setOption('theme', currentEditorTheme);
                }
            });
        }

        function getWrapperForPart(part) {
            const cm = editors[part];
            return cm ? cm.getWrapperElement() : null;
        }

        function isFullscreen(part) {
            if (!part) return false;
            const wrapper = getWrapperForPart(part);
            return !!(wrapper && wrapper.classList.contains('cm-fullscreen'));
        }

        function updateBodyOverflow() {
            const anyFullscreen = EDITOR_PARTS.some((p) => isFullscreen(p));
            document.body.style.overflow = anyFullscreen ? 'hidden' : '';
        }

        function updateButtonLabels() {
            EDITOR_PARTS.forEach((part) => {
                const btn = getFullscreenButton(part);
                if (!btn) return;
            });
        }

        function addOverlayExitButton(part) {
            const wrapper = getWrapperForPart(part);
            if (!wrapper) return;

            let exitBtn = wrapper.querySelector('.cm-exit-btn');
            if (!exitBtn) {
                exitBtn = document.createElement('button');
                exitBtn.type = 'button';

                const isDark = (document.body.dataset.bsTheme || 'light') === 'dark';
                exitBtn.className = `cm-exit-btn btn-close${isDark ? ' btn-close-white' : ''}`;
                exitBtn.setAttribute('aria-label', 'Close');

                exitBtn.addEventListener('click', () => {
                    exitFullscreen(part);
                });

                wrapper.appendChild(exitBtn);
            }
        }

        function removeOverlayExitButton(part) {
            const wrapper = getWrapperForPart(part);
            if (!wrapper) return;
            const exitBtn = wrapper.querySelector('.cm-exit-btn');
            if (exitBtn) {
                exitBtn.remove();
            }
        }

        function enterFullscreen(part) {
            const wrapper = getWrapperForPart(part);
            if (!wrapper) return;

            // Exit fullscreen on the other editor if needed
            EDITOR_PARTS.forEach((p) => {
                if (p !== part) {
                    exitFullscreen(p);
                }
            });

            wrapper.classList.add('cm-fullscreen');
            fullscreenPart = part;
            addOverlayExitButton(part);
            updateBodyOverflow();
            updateButtonLabels();
        }

        function exitFullscreen(part) {
            const wrapper = getWrapperForPart(part);
            if (!wrapper) return;

            wrapper.classList.remove('cm-fullscreen');
            removeOverlayExitButton(part);

            if (fullscreenPart === part) {
                fullscreenPart = null;
            }
            updateBodyOverflow();
            updateButtonLabels();
        }

        function toggleFullscreen(part) {
            if (isFullscreen(part)) {
                exitFullscreen(part);
            } else {
                enterFullscreen(part);
            }
        }

        function wireControlsOnce() {
            if (controlsWired) return;
            controlsWired = true;

            // Large-view buttons in the card header
            const btnFs1 = getFullscreenButton(1);
            const btnFs2 = getFullscreenButton(2);

            if (btnFs1) {
                btnFs1.addEventListener('click', () => {
                    toggleFullscreen(1);
                });
            }
            if (btnFs2) {
                btnFs2.addEventListener('click', () => {
                    toggleFullscreen(2);
                });
            }

            // Escape key exits large view on whichever editor is active
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    EDITOR_PARTS.forEach((part) => exitFullscreen(part));
                }
            });

            // Listen for global theme changes from app.js
            document.addEventListener('aocThemeChanged', (e) => {
                const pageTheme = e && e.detail && e.detail.theme ? e.detail.theme : getPageTheme();
                applyThemeFromPage(pageTheme);
            });

            // Initialize labels once
            updateButtonLabels();
        }

        return {
            init() {
                // Sync with current page theme on init
                currentEditorTheme = mapPageThemeToEditorTheme(getPageTheme());
                ensureInstances();
                applyThemeFromPage(getPageTheme());
                wireControlsOnce();
            },
            reset() {
                EDITOR_PARTS.forEach((part) => {
                    const id = textareaIdForPart(part);
                    const ta = document.getElementById(id);
                    if (ta) ta.value = '';
                    const cm = editors[part];
                    if (cm) {
                        cm.setValue('');
                    }
                    // Also ensure any leftover overlay exit buttons are removed
                    removeOverlayExitButton(part);
                    const wrapper = getWrapperForPart(part);
                    if (wrapper) {
                        wrapper.classList.remove('cm-fullscreen');
                    }
                });
                fullscreenPart = null;
                updateBodyOverflow();
                updateButtonLabels();
            },
            setCode(part, code) {
                const value = code || '';
                const id = textareaIdForPart(part);
                const ta = document.getElementById(id);
                if (ta) ta.value = value;
                const cm = editors[part];
                if (cm) {
                    cm.setValue(value);
                }
            },
            getCode(part) {
                const cm = editors[part];
                if (cm) {
                    return cm.getValue() || '';
                }
                const id = textareaIdForPart(part);
                const ta = document.getElementById(id);
                return (ta && ta.value) || '';
            },
        };
    })();

    // ---------------------------------------------------------------------------
    // Solution runner: generic runner for a given "part"
    // ---------------------------------------------------------------------------

    function runSolution(options) {
        const { part, getInput, setOutput } = options || {};
        if (!part) return;

        const code = EditorManager.getCode(part);
        if (!code || !code.trim()) {
            return;
        }

        let inputValue = '';
        if (typeof getInput === 'function') {
            inputValue = getInput();
        }

        try {
            const fn = new Function('input', `"use strict";\n${code}`);
            const result = fn(inputValue);
            if (typeof setOutput === 'function') {
                setOutput(result);
            }
        } catch (err) {
            console.error('Error in user solution code:', err);
            alert(err);
        }
    }

    // ---------------------------------------------------------------------------
    // Public API
    // ---------------------------------------------------------------------------

    window.EditorUI = {
        initEditors() {
            EditorManager.init();
        },
        resetEditors() {
            EditorManager.reset();
        },
        setEditorCode(part, code) {
            EditorManager.setCode(part, code);
        },
        getEditorCode(part) {
            return EditorManager.getCode(part);
        },
        runSolution,
    };
})();

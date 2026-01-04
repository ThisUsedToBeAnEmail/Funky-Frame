/**
 * Funky.CodePreview - Source Code Display Component
 * Syntax highlighting, line numbers, copy, collapse
 * @module Funky.CodePreview
 * @version 1.0.1
 */
(function(window) {
    'use strict';

    // Ensure Funky registry exists
    if (!window.Funky || !window.Funky.register) {
        console.error('[Funky.CodePreview] Registry not found. Load namespace.js first.');
        return;
    }

    var Funky = window.Funky;

    // Guard against double registration
    if (Funky.CodePreview) {
        return;
    }

    // Shortcuts to Funky utilities
    var D = Funky.Dom;
    var Util = Funky.Util;

    // =========================================================================
    // CONSTANTS
    // =========================================================================

    var DEFAULTS = {
        language: 'javascript',      // 'javascript' | 'json' | 'html' | 'css' | 'text'
        lineNumbers: false,          // Show line numbers
        showCopy: true,              // Show copy button
        showLanguage: true,          // Show language label
        collapsible: false,          // Allow collapse/expand
        collapsed: false,            // Start collapsed
        maxHeight: null,             // Max height in px (null = no limit)
        wrapLines: false,            // Wrap long lines
        highlight: null,             // Terms to highlight (uses Funky.Highlight)
        tabSize: 2,                  // Tab display width
        className: '',               // Additional CSS class
        // Canvas mode (editable)
        editable: false,             // Make code editable
        showRun: false,              // Show run button
        onRun: null,                 // Callback when run clicked
        onChange: null,              // Callback when code changes
        autoRun: false,              // Run on every change
        autoRunDelay: 500,           // Debounce delay for auto-run
        showOutput: false,           // Show output panel
        showErrors: true             // Show error panel on run failure
    };

    var CLASSES = {
        container: 'code-preview',
        header: 'code-preview__header',
        language: 'code-preview__language',
        actions: 'code-preview__actions',
        copyBtn: 'code-preview__copy',
        collapseBtn: 'code-preview__collapse',
        runBtn: 'code-preview__run',
        body: 'code-preview__body',
        pre: 'code-preview__pre',
        code: 'code-preview__code',
        lineNumbers: 'code-preview__line-numbers',
        lineNumber: 'code-preview__line-number',
        lines: 'code-preview__lines',
        line: 'code-preview__line',
        collapsed: 'code-preview--collapsed',
        wrapped: 'code-preview--wrapped',
        editable: 'code-preview__code--editable'
    };

    // Language display names
    var LANGUAGE_NAMES = {
        javascript: 'JavaScript',
        js: 'JavaScript',
        json: 'JSON',
        html: 'HTML',
        css: 'CSS',
        text: 'Plain Text'
    };

    // =========================================================================
    // SYNTAX HIGHLIGHTING
    // =========================================================================

    var SyntaxHighlighter = {
        /**
         * Highlight code based on language
         */
        highlight: function(code, language) {
            var lang = (language || 'text').toLowerCase();

            // Normalize language aliases
            if (lang === 'js') lang = 'javascript';

            switch (lang) {
                case 'javascript':
                    return this.highlightJavaScript(code);
                case 'json':
                    return this.highlightJSON(code);
                case 'html':
                    return this.highlightHTML(code);
                case 'css':
                    return this.highlightCSS(code);
                default:
                    return this.escapeHtml(code);
            }
        },

        /**
         * Escape HTML entities
         */
        escapeHtml: function(str) {
            if (Util && Util.escapeHtml) {
                return Util.escapeHtml(str);
            }
            return str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        },

        /**
         * JavaScript syntax highlighting
         */
        highlightJavaScript: function(code) {
            var self = this;
            var result = this.escapeHtml(code);

            // Order matters - process in specific order to avoid conflicts

            // 1. Comments (must be first to avoid highlighting inside comments)
            // Multi-line comments
            result = result.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="syntax-comment">$1</span>');
            // Single-line comments
            result = result.replace(/(\/\/[^\n]*)/g, '<span class="syntax-comment">$1</span>');

            // 2. Strings (before keywords to avoid highlighting inside strings)
            // Template literals
            result = result.replace(/(`[^`]*`)/g, '<span class="syntax-string">$1</span>');
            // Double-quoted strings
            result = result.replace(/(&quot;[^&]*?&quot;)/g, '<span class="syntax-string">$1</span>');
            // Single-quoted strings
            result = result.replace(/(&#039;[^&]*?&#039;)/g, '<span class="syntax-string">$1</span>');

            // 3. Numbers (avoid matching inside HTML entities like &#039;)
            // Use negative match - don't highlight if preceded by &# (HTML entity)
            result = result.replace(/(^|[^&#])(\b\d+\.?\d*\b)/g, function(match, prefix, num) {
                return prefix + '<span class="syntax-number">' + num + '</span>';
            });

            // 4. Keywords - avoid matching inside HTML tags (class="..." etc)
            // Use a more careful approach: only match keywords not inside quotes or after =
            var keywords = [
                'async', 'await', 'break', 'case', 'catch', 'const',
                'continue', 'debugger', 'default', 'delete', 'do', 'else',
                'export', 'extends', 'finally', 'for', 'function', 'if',
                'import', 'in', 'instanceof', 'let', 'new', 'return', 'static',
                'super', 'switch', 'this', 'throw', 'try', 'typeof', 'var',
                'void', 'while', 'with', 'yield'
            ];
            // Note: 'class' removed from keywords to avoid matching class="" in span tags
            var keywordPattern = new RegExp('(^|[^="\'])\\b(' + keywords.join('|') + ')\\b', 'g');
            result = result.replace(keywordPattern, '$1<span class="syntax-keyword">$2</span>');

            // 5. Built-in values - same protection
            result = result.replace(/(^|[^="'])\b(true|false|null|undefined|NaN|Infinity)\b/g,
                '$1<span class="syntax-builtin">$2</span>');

            // 6. Function calls (word followed by parenthesis) - avoid matching inside tags
            result = result.replace(/(^|[^="'])\b([a-zA-Z_$][\w$]*)\s*(?=\()/g,
                '$1<span class="syntax-function">$2</span>');

            return result;
        },

        /**
         * JSON syntax highlighting
         */
        highlightJSON: function(code) {
            var result = this.escapeHtml(code);

            // Property names (before colon)
            result = result.replace(/(&quot;[^&]+?&quot;)\s*:/g,
                '<span class="syntax-property">$1</span>:');

            // String values
            result = result.replace(/:(\s*)(&quot;[^&]*?&quot;)/g,
                ':$1<span class="syntax-string">$2</span>');

            // Numbers
            result = result.replace(/:\s*(-?\d+\.?\d*)/g,
                ': <span class="syntax-number">$1</span>');

            // Booleans and null
            result = result.replace(/:\s*(true|false|null)\b/g,
                ': <span class="syntax-builtin">$1</span>');

            return result;
        },

        /**
         * HTML syntax highlighting
         */
        highlightHTML: function(code) {
            var result = this.escapeHtml(code);

            // Comments first (before other processing)
            result = result.replace(/(&lt;!--[\s\S]*?--&gt;)/g,
                '<span class="syntax-comment">$1</span>');

            // Attribute values (double quotes) - before attributes to avoid conflicts
            result = result.replace(/([\w-]+)(=)(&quot;[^&]*?&quot;)/g,
                '<span class="syntax-attribute">$1</span>$2<span class="syntax-string">$3</span>');

            // Attribute values (single quotes)
            result = result.replace(/([\w-]+)(=)(&#039;[^&]*?&#039;)/g,
                '<span class="syntax-attribute">$1</span>$2<span class="syntax-string">$3</span>');

            // Tags (opening and closing)
            result = result.replace(/(&lt;\/?)([\w-]+)/g,
                '$1<span class="syntax-tag">$2</span>');

            return result;
        },

        /**
         * CSS syntax highlighting
         */
        highlightCSS: function(code) {
            var result = this.escapeHtml(code);

            // Comments
            result = result.replace(/(\/\*[\s\S]*?\*\/)/g,
                '<span class="syntax-comment">$1</span>');

            // Selectors (before opening brace)
            result = result.replace(/([^{}]+)(\{)/g, function(match, selector, brace) {
                // Don't highlight if inside a rule (has semicolon before it)
                if (selector.indexOf(';') !== -1) return match;
                return '<span class="syntax-selector">' + selector.trim() + '</span> ' + brace;
            });

            // Properties
            result = result.replace(/([\w-]+)\s*:/g,
                '<span class="syntax-property">$1</span>:');

            // Values with units
            result = result.replace(/:\s*([^;{}]+)(;)/g, function(match, value, semi) {
                // Highlight numbers with units
                value = value.replace(/(-?\d+\.?\d*)(px|em|rem|%|vh|vw|s|ms)?/g,
                    '<span class="syntax-number">$1$2</span>');
                // Highlight color values
                value = value.replace(/(#[0-9a-fA-F]{3,8})\b/g,
                    '<span class="syntax-string">$1</span>');
                return ': ' + value + semi;
            });

            return result;
        }
    };

    // =========================================================================
    // CODEPREVIEW INSTANCE
    // =========================================================================

    function CodePreviewInstance(element, options) {
        this.element = typeof element === 'string'
            ? document.querySelector(element)
            : element;

        // Initialize all properties first so instance is always in consistent state
        this.options = Object.assign({}, DEFAULTS, options);
        this.code = '';
        this.codeTemplate = '';
        this.isCollapsed = this.options.collapsed;
        this.container = null;
        this.codeElement = null;
        this.binding = null;
        this._autoRunTimer = null;

        if (!this.element) {
            console.error('[CodePreview] Element not found');
            return;
        }

        this._init();
    }

    CodePreviewInstance.prototype._init = function() {
        this._render();
        this._bindEvents();

        // Setup editable mode if enabled
        if (this.options.editable) {
            this._setupEditor();
        }
    };

    CodePreviewInstance.prototype._render = function() {
        var opts = this.options;

        // Create container (use native DOM, not D.create which returns ElementWrapper)
        this.container = document.createElement('div');
        this.container.className = CLASSES.container +
            (opts.wrapLines ? ' ' + CLASSES.wrapped : '') +
            (this.isCollapsed ? ' ' + CLASSES.collapsed : '') +
            (opts.className ? ' ' + opts.className : '');

        // Header (language label + actions)
        if (opts.showLanguage || opts.showCopy || opts.collapsible || opts.showRun) {
            var header = document.createElement('div');
            header.className = CLASSES.header;

            // Language label
            if (opts.showLanguage) {
                var langLabel = document.createElement('span');
                langLabel.className = CLASSES.language;
                langLabel.textContent = LANGUAGE_NAMES[opts.language] || opts.language;
                header.appendChild(langLabel);
            }

            // Actions container
            var actions = document.createElement('div');
            actions.className = CLASSES.actions;

            // Copy button
            if (opts.showCopy) {
                var copyBtn = document.createElement('button');
                copyBtn.className = CLASSES.copyBtn;
                copyBtn.type = 'button';
                copyBtn.setAttribute('aria-label', 'Copy code');
                copyBtn.appendChild(D.icon('fas fa-copy').el);
                this.copyBtn = copyBtn;
                actions.appendChild(copyBtn);
            }

            // Run button
            if (opts.showRun) {
                var runBtn = document.createElement('button');
                runBtn.className = CLASSES.runBtn;
                runBtn.type = 'button';
                runBtn.setAttribute('aria-label', 'Run code');
                runBtn.appendChild(D.icon('fas fa-play').el);
                this.runBtn = runBtn;
                actions.appendChild(runBtn);
            }

            // Collapse button
            if (opts.collapsible) {
                var collapseBtn = document.createElement('button');
                collapseBtn.className = CLASSES.collapseBtn;
                collapseBtn.type = 'button';
                collapseBtn.setAttribute('aria-label', this.isCollapsed ? 'Expand code' : 'Collapse code');
                collapseBtn.setAttribute('aria-expanded', !this.isCollapsed);
                collapseBtn.appendChild(D.icon('fas fa-chevron-down').el);
                this.collapseBtn = collapseBtn;
                actions.appendChild(collapseBtn);
            }

            header.appendChild(actions);
            this.container.appendChild(header);
        }

        // Body (code area)
        var body = document.createElement('div');
        body.className = CLASSES.body;

        if (opts.maxHeight) {
            body.style.maxHeight = opts.maxHeight + 'px';
            body.style.overflowY = 'auto';
        }

        // Pre element
        var pre = document.createElement('pre');
        pre.className = CLASSES.pre;
        pre.style.tabSize = opts.tabSize;
        pre.setAttribute('tabindex', '0');

        // Code element
        var code = document.createElement('code');
        code.className = CLASSES.code;
        this.codeElement = code;

        pre.appendChild(code);
        body.appendChild(pre);
        this.container.appendChild(body);
        this.bodyElement = body;

        // Output panel (created upfront if showOutput enabled, populated lazily)
        if (opts.showOutput) {
            var output = D.div().classAdd('code-preview__output')
                .child(
                    D.div().classAdd('code-preview__output-header')
                        .child(D.icon('fas fa-terminal'), D.text(' Output')),
                    D.create('pre').classAdd('code-preview__output-content')
                ).el;
            this.container.appendChild(output);
        }

        // Replace element content
        D.wrap(this.element).empty();
        this.element.appendChild(this.container);
    };

    CodePreviewInstance.prototype._bindEvents = function() {
        var self = this;

        // Copy button
        if (this.copyBtn) {
            this.copyBtn.addEventListener('click', function(e) {
                e.preventDefault();
                self.copy();
            });
        }

        // Run button
        if (this.runBtn) {
            this.runBtn.addEventListener('click', function(e) {
                e.preventDefault();
                self.run();
            });
        }

        // Collapse button
        if (this.collapseBtn) {
            this.collapseBtn.addEventListener('click', function(e) {
                e.preventDefault();
                self.toggleCollapse();
            });
        }
    };

    /**
     * Set up editable mode
     * @private
     */
    CodePreviewInstance.prototype._setupEditor = function() {
        var self = this;
        var opts = this.options;

        // Make code element contenteditable
        this.codeElement.setAttribute('contenteditable', 'true');
        this.codeElement.setAttribute('spellcheck', 'false');
        this.codeElement.classList.add(CLASSES.editable);

        // Track changes
        this._editHandler = function(e) {
            // Get plain text content
            self.code = self.codeElement.textContent;

            if (opts.onChange) {
                opts.onChange(self.code);
            }

            // Debounced auto-run
            if (opts.autoRun) {
                clearTimeout(self._autoRunTimer);
                self._autoRunTimer = setTimeout(function() {
                    self.run();
                }, opts.autoRunDelay);
            }
        };

        this.codeElement.addEventListener('input', this._editHandler);

        // Handle Tab key for indentation
        this.codeElement.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                e.preventDefault();
                document.execCommand('insertText', false, '  ');
            }
        });
    };

    /**
     * Enable edit mode
     */
    CodePreviewInstance.prototype.enableEdit = function() {
        this.options.editable = true;
        this._setupEditor();
        return this;
    };

    /**
     * Set the code to display
     */
    CodePreviewInstance.prototype.setCode = function(code) {
        this.code = code || '';
        this._renderCode();
        return this;
    };

    /**
     * Render the code with syntax highlighting
     */
    CodePreviewInstance.prototype._renderCode = function() {
        // Guard: skip if instance wasn't properly initialized (element not found)
        if (!this.codeElement) {
            return;
        }

        var opts = this.options;
        var lines = this.code.split('\n');
        var html = '';

        // Don't apply syntax highlighting if editable (would break editing)
        if (opts.editable) {
            this.codeElement.textContent = this.code;
            return;
        }

        if (opts.lineNumbers) {
            // Line numbers mode - use divs for proper flex layout
            var numbersHtml = '';
            var linesHtml = '';

            lines.forEach(function(line, index) {
                var lineNum = index + 1;
                numbersHtml += '<div class="' + CLASSES.lineNumber + '">' + lineNum + '</div>';

                var highlightedLine = SyntaxHighlighter.highlight(line, opts.language);
                // Preserve empty lines with non-breaking space
                if (!highlightedLine) highlightedLine = '&nbsp;';
                linesHtml += '<div class="' + CLASSES.line + '">' + highlightedLine + '</div>';
            });

            html = '<div class="' + CLASSES.lineNumbers + '">' + numbersHtml + '</div>' +
                   '<div class="' + CLASSES.lines + '">' + linesHtml + '</div>';
        } else {
            // Simple mode
            html = SyntaxHighlighter.highlight(this.code, opts.language);
        }

        this.codeElement.innerHTML = html;

        // Apply search highlighting if specified
        if (opts.highlight && Funky.Highlight) {
            Funky.Highlight.apply(this.codeElement, opts.highlight);
        }
    };

    /**
     * Copy code to clipboard
     */
    CodePreviewInstance.prototype.copy = function() {
        var self = this;

        if (Funky.Clipboard) {
            Funky.Clipboard.copy(this.code).then(function() {
                self._showCopyFeedback(true);
            }).catch(function() {
                self._showCopyFeedback(false);
            });
        } else {
            // Fallback
            try {
                navigator.clipboard.writeText(this.code).then(function() {
                    self._showCopyFeedback(true);
                });
            } catch (e) {
                console.warn('[CodePreview] Copy failed:', e);
                self._showCopyFeedback(false);
            }
        }
    };

    CodePreviewInstance.prototype._showCopyFeedback = function(success) {
        if (!this.copyBtn) return;

        var icon = this.copyBtn.querySelector('i');
        var originalClass = icon.className;

        icon.className = success ? 'fas fa-check' : 'fas fa-times';
        this.copyBtn.classList.add(success ? 'success' : 'error');

        setTimeout(function() {
            icon.className = originalClass;
            this.copyBtn.classList.remove('success', 'error');
        }.bind(this), 1500);
    };

    /**
     * Toggle collapse state
     */
    CodePreviewInstance.prototype.toggleCollapse = function() {
        this.isCollapsed = !this.isCollapsed;
        this.container.classList.toggle(CLASSES.collapsed, this.isCollapsed);

        if (this.collapseBtn) {
            this.collapseBtn.setAttribute('aria-expanded', !this.isCollapsed);
            this.collapseBtn.setAttribute('aria-label',
                this.isCollapsed ? 'Expand code' : 'Collapse code');
        }

        return this;
    };

    /**
     * Run the code
     */
    CodePreviewInstance.prototype.run = function() {
        var self = this;
        var opts = this.options;

        // Clear previous output/errors
        this._clearOutput();

        try {
            var result;

            if (opts.onRun) {
                // Custom run handler
                result = opts.onRun(this.code);
            } else {
                // Default: eval in isolated scope
                result = this._safeEval(this.code);
            }

            // Handle promise results
            if (result && typeof result.then === 'function') {
                result.then(function(value) {
                    self._showOutput(value);
                }).catch(function(error) {
                    self._showError(error);
                });
            } else if (result !== undefined) {
                this._showOutput(result);
            }

        } catch (error) {
            this._showError(error);
        }

        return this;
    };

    /**
     * Safe eval with limited scope
     * @private
     */
    CodePreviewInstance.prototype._safeEval = function(code) {
        // Create a function with Funky in scope
        var fn = new Function('Funky', code + '\n//# sourceURL=playground.js');
        return fn(window.Funky);
    };

    /**
     * Show output result
     * @private
     */
    CodePreviewInstance.prototype._showOutput = function(value) {
        if (!this.options.showOutput) return;

        var output = this.container.querySelector('.code-preview__output');
        if (!output) {
            output = document.createElement('div');
            output.className = 'code-preview__output';
            this.container.appendChild(output);
        }

        D.wrap(output).empty().child(
            D.div().classAdd('code-preview__output-header')
                .child(D.icon('fas fa-terminal'), D.text(' Output')),
            D.create('pre').classAdd('code-preview__output-content').text(this._formatOutput(value))
        );
        output.classList.remove('hidden');
    };

    /**
     * Show error
     * @private
     */
    CodePreviewInstance.prototype._showError = function(error) {
        if (!this.options.showErrors) return;

        var errorPanel = this.container.querySelector('.code-preview__error');
        if (!errorPanel) {
            errorPanel = document.createElement('div');
            errorPanel.className = 'code-preview__error';
            this.container.appendChild(errorPanel);
        }

        D.wrap(errorPanel).empty().child(
            D.div().classAdd('code-preview__error-header')
                .child(D.icon('fas fa-exclamation-circle'), D.text(' Error')),
            D.create('pre').classAdd('code-preview__error-content').text(error.message || String(error))
        );
        errorPanel.classList.remove('hidden');
    };

    /**
     * Clear output and errors
     * @private
     */
    CodePreviewInstance.prototype._clearOutput = function() {
        var output = this.container.querySelector('.code-preview__output');
        var error = this.container.querySelector('.code-preview__error');

        if (output) output.classList.add('hidden');
        if (error) error.classList.add('hidden');
    };

    /**
     * Format output value for display
     * @private
     */
    CodePreviewInstance.prototype._formatOutput = function(value) {
        if (value === undefined) return 'undefined';
        if (value === null) return 'null';
        if (typeof value === 'function') return '[Function: ' + (value.name || 'anonymous') + ']';
        if (value instanceof Element) return '[Element: <' + value.tagName.toLowerCase() + '>]';

        try {
            return JSON.stringify(value, null, 2);
        } catch (e) {
            return String(value);
        }
    };

    /**
     * Set highlight terms
     */
    CodePreviewInstance.prototype.setHighlight = function(terms) {
        this.options.highlight = terms;

        if (Funky.Highlight) {
            Funky.Highlight.clear(this.codeElement);
            if (terms) {
                Funky.Highlight.apply(this.codeElement, terms);
            }
        }

        return this;
    };

    /**
     * Update options
     */
    CodePreviewInstance.prototype.setOptions = function(options) {
        Object.assign(this.options, options);
        this._renderCode();
        return this;
    };

    /**
     * Get the current code
     */
    CodePreviewInstance.prototype.getCode = function() {
        return this.code;
    };

    // =========================================================================
    // LIVEBINDING INTEGRATION
    // =========================================================================

    /**
     * Bind to a LiveBinding data source
     * @param {Object} bindingOptions - LiveBinding configuration
     * @returns {CodePreviewInstance}
     */
    CodePreviewInstance.prototype.bindTo = function(bindingOptions) {
        var self = this;

        // Check if LiveBinding is available
        if (!Funky.LiveBinding) {
            console.warn('[CodePreview] Funky.LiveBinding not available');
            return this;
        }

        // Store original code template
        this.codeTemplate = this.code;

        // Create binding
        this.binding = Funky.LiveBinding.bind(this.element, Object.assign({
            source: bindingOptions.source || 'memory',
            key: bindingOptions.key,
            render: function(data) {
                // Interpolate template with data
                var interpolated = self._interpolateTemplate(self.codeTemplate, data);
                self.setCode(interpolated);
                return ''; // We handle rendering ourselves
            },
            showLoading: false
        }, bindingOptions));

        return this;
    };

    /**
     * Interpolate template placeholders with data
     * Supports: {{key}}, {{nested.path}}
     * @private
     */
    CodePreviewInstance.prototype._interpolateTemplate = function(template, data) {
        if (!template || !data) return template || '';

        var self = this;
        var result = template;

        // Simple variable replacement: {{varName}}
        result = result.replace(/\{\{([^#/}]+)\}\}/g, function(match, path) {
            path = path.trim();
            var value = self._getNestedValue(data, path);

            if (value === undefined || value === null) {
                return match; // Keep placeholder if no value
            }

            // Format value based on type
            if (typeof value === 'object') {
                return JSON.stringify(value, null, 2);
            }
            return String(value);
        });

        return result;
    };

    /**
     * Get nested value from object using dot notation
     * @private
     */
    CodePreviewInstance.prototype._getNestedValue = function(obj, path) {
        return path.split('.').reduce(function(current, key) {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    };

    /**
     * Update bound data
     * @param {Object} data - New data
     */
    CodePreviewInstance.prototype.updateData = function(data) {
        if (this.binding) {
            this.binding.setData(data);
        } else {
            // Manual update without binding
            var interpolated = this._interpolateTemplate(this.codeTemplate || this.code, data);
            this.setCode(interpolated);
        }
        return this;
    };

    /**
     * Set code template (for LiveBinding interpolation)
     */
    CodePreviewInstance.prototype.setTemplate = function(template) {
        this.codeTemplate = template;
        return this;
    };

    /**
     * Destroy the instance
     */
    CodePreviewInstance.prototype.destroy = function() {
        // Clean up binding
        if (this.binding) {
            this.binding.destroy();
            this.binding = null;
        }

        // Clean up auto-run timer
        if (this._autoRunTimer) {
            clearTimeout(this._autoRunTimer);
            this._autoRunTimer = null;
        }

        // Remove DOM
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.element = null;
        this.container = null;
        this.codeElement = null;
    };

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    var _instances = Funky.Registry.createInstanceRegistry('CodePreview');

    var CodePreview = {};

    /**
     * Initialize a CodePreview on element
     * @param {string|Element} element - Target element or selector
     * @param {Object} options - Configuration options
     * @returns {CodePreviewInstance}
     */
    CodePreview.init = function(element, options) {
        var instance = new CodePreviewInstance(element, options);
        if (instance.id) {
            _instances.register(instance.id, instance);
        }
        return instance;
    };

    /**
     * @deprecated Use CodePreview.init() instead
     */
    CodePreview.create = function(element, options) {
        if (Funky.debug) {
            console.warn('[Funky.CodePreview] create() is deprecated. Use init() instead.');
        }
        return CodePreview.init(element, options);
    };

    /**
     * Get instance by ID
     * @param {string} id - Instance ID
     * @returns {CodePreviewInstance|null}
     */
    CodePreview.getInstance = function(id) {
        return _instances.get(id);
    };

    /**
     * Destroy CodePreview by ID
     * @param {string} id - Instance ID
     */
    CodePreview.destroy = function(id) {
        var instance = _instances.get(id);
        if (instance) {
            instance.destroy();
        }
    };

    /**
     * Destroy all instances
     */
    CodePreview.destroyAll = function() {
        _instances.destroyAll();
    };

    /**
     * Render code into an element (convenience method)
     */
    CodePreview.render = function(element, code, options) {
        var instance = CodePreview.init(element, options);
        instance.setCode(code);
        return instance;
    };

    /**
     * Generate HTML string (for templates/SSR)
     */
    CodePreview.toHTML = function(code, options) {
        var opts = Object.assign({}, DEFAULTS, options);
        var highlighted = SyntaxHighlighter.highlight(code || '', opts.language);

        var html = '<div class="' + CLASSES.container + '">';

        if (opts.showLanguage) {
            html += '<div class="' + CLASSES.header + '">' +
                    '<span class="' + CLASSES.language + '">' +
                    (LANGUAGE_NAMES[opts.language] || opts.language) +
                    '</span></div>';
        }

        html += '<div class="' + CLASSES.body + '">' +
                '<pre class="' + CLASSES.pre + '">' +
                '<code class="' + CLASSES.code + '">' +
                highlighted +
                '</code></pre></div></div>';

        return html;
    };

    /**
     * Highlight code string (returns HTML)
     */
    CodePreview.highlight = function(code, language) {
        return SyntaxHighlighter.highlight(code || '', language);
    };

    /**
     * Format source code (clean indentation)
     */
    CodePreview.formatSource = function(source) {
        if (!source) return '';

        // Remove function wrapper if present
        var code = source
            .replace(/^function\s*\([^)]*\)\s*\{/, '')
            .replace(/^function\s*\w+\s*\([^)]*\)\s*\{/, '')
            .replace(/^\s*\([^)]*\)\s*=>\s*\{?/, '')
            .replace(/\}[\s;]*$/, '')
            .replace(/^\s*\n/, '')
            .replace(/\n\s*$/, '');

        // Dedent
        var lines = code.split('\n');
        var minIndent = Infinity;

        lines.forEach(function(line) {
            if (line.trim() === '') return;
            var match = line.match(/^(\s*)/);
            if (match) {
                minIndent = Math.min(minIndent, match[1].length);
            }
        });

        if (minIndent > 0 && minIndent < Infinity) {
            code = lines.map(function(line) {
                return line.slice(minIndent);
            }).join('\n');
        }

        return code;
    };

    /**
     * Create a CodePreview with LiveBinding
     * @param {string|Element} element - Target element
     * @param {string} template - Code template with {{placeholders}}
     * @param {Object} options - CodePreview options
     * @param {Object} bindingOptions - LiveBinding options
     * @returns {CodePreviewInstance}
     */
    CodePreview.createWithBinding = function(element, template, options, bindingOptions) {
        var instance = CodePreview.init(element, options);
        instance.setTemplate(template);
        instance.setCode(template); // Show template initially
        instance.bindTo(bindingOptions);
        return instance;
    };

    // Expose instance class for direct use
    CodePreview.Instance = CodePreviewInstance;

    // =========================================================================
    // EXPORT
    // =========================================================================

    Funky.register('CodePreview', CodePreview);

})(window);

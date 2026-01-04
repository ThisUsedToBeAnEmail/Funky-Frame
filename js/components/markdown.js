/**
 * Funky.Markdown - Markdown renderer component
 * @namespace Funky.Markdown
 * @requires Funky.Dom
 * @optional Funky.CodePreview, Funky.Clipboard, Funky.Tooltip
 */
(function(window) {
    'use strict';

    // Guard against missing registry
    if (!window.Funky || !window.Funky.register) {
        console.error('[Funky.Markdown] Registry not found. Load namespace.js first.');
        return;
    }

    // Guard against double registration
    if (window.Funky.Markdown) {
        return;
    }

    var Funky = window.Funky;
    var D = Funky.Dom;
    var Util = Funky.Util;

    // =========================================================================
    // PRIVATE STATE
    // =========================================================================

    var _tableCounter = 0;
    var _pendingTables = [];
    var _fileCache = {};
    var _pendingRequests = {};

    // =========================================================================
    // DEFAULT OPTIONS
    // =========================================================================

    var DEFAULTS = {
        sanitize: true,
        highlightCode: true,
        languages: ['javascript', 'js', 'html', 'css', 'json', 'bash', 'shell'],
        linkTarget: null,
        linkClass: null,
        headingIds: true,
        headingPrefix: '',
        headingAnchors: true,
        toc: false,
        tocContainer: null,
        tocMaxLevel: 3,
        tocHighlight: true,
        // TOC Panel (slide-out panel with TreeView)
        tocPanel: false,
        tocPanelStartOpen: false,
        tocPanelPosition: 'top-left', // 'top-left', 'top-right', 'bottom-left', 'bottom-right'
        tocPanelSticky: false, // Make toggle button sticky while scrolling content
        copyButton: true,
        lineNumbers: false,
        codeMaxHeight: null,
        baseUrl: '',
        // Navigation (Phase 04)
        quickNav: false,
        keyboard: true,
        scrollTracking: true,
        // Tables (Phase 03)
        tables: true,
        funkyTableOptions: {
            paging: 'auto',
            pageLength: 25,
            searching: true,
            ordering: true,
            info: 'auto',
            buttons: {
                enabled: true,
                export: ['csv', 'xlsx']
            },
            density: 'compact',
            striped: true,
            hover: true,
            bordered: true
        },
        // File loading (Phase 04)
        cache: true,
        onLoad: null,
        onRetry: null,
        loadingIndicator: 'skeleton',
        // Accessibility
        announcements: true,
        abbreviations: {},
        onRender: null,
        onError: null
    };

    // =========================================================================
    // HTML ESCAPING
    // =========================================================================

    /**
     * Escape HTML entities
     * @param {string} str - String to escape
     * @returns {string}
     */
    function escapeHtml(str) {
        if (Util && Util.escapeHtml) {
            return Util.escapeHtml(str);
        }
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Escape regex special characters
     * @param {string} str - String to escape
     * @returns {string}
     */
    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // =========================================================================
    // TABLE PARSING
    // =========================================================================

    /**
     * Parse a GFM table
     * @param {Array} lines - All source lines
     * @param {number} startLine - Starting line index
     * @returns {Object|null}
     */
    function parseTable(lines, startLine) {
        // Header row
        var headerLine = lines[startLine];
        var headerCells = parseTableRow(headerLine);
        if (!headerCells) return null;

        // Separator row (determines alignment)
        var sepLine = lines[startLine + 1];
        var alignments = parseTableSeparator(sepLine);
        if (!alignments || alignments.length !== headerCells.length) return null;

        // Body rows
        var bodyRows = [];
        var i = startLine + 2;

        while (i < lines.length) {
            var rowLine = lines[i];

            // Empty line or non-table line ends table
            if (/^\s*$/.test(rowLine) || rowLine.charAt(0) !== '|') {
                break;
            }

            var cells = parseTableRow(rowLine);
            if (cells) {
                // Pad or trim to match header length
                while (cells.length < headerCells.length) {
                    cells.push('');
                }
                if (cells.length > headerCells.length) {
                    cells = cells.slice(0, headerCells.length);
                }
                bodyRows.push(cells);
            }
            i++;
        }

        return {
            type: 'table',
            headers: headerCells,
            alignments: alignments,
            rows: bodyRows,
            _endLine: i - 1
        };
    }

    /**
     * Parse a table row into cells
     * @param {string} line - Table row line
     * @returns {Array|null}
     */
    function parseTableRow(line) {
        // Remove leading/trailing pipes and split
        var trimmed = line.replace(/^\||\|$/g, '');
        var cells = trimmed.split('|').map(function(cell) {
            return cell.trim();
        });
        return cells.length > 0 ? cells : null;
    }

    /**
     * Parse table separator row for alignments
     * @param {string} line - Separator line
     * @returns {Array|null}
     */
    function parseTableSeparator(line) {
        if (!/^\|[\s\-:|]+\|$/.test(line)) return null;

        var trimmed = line.replace(/^\||\|$/g, '');
        var parts = trimmed.split('|');

        var alignments = parts.map(function(part) {
            part = part.trim();

            // Check alignment markers
            var left = part.charAt(0) === ':';
            var right = part.charAt(part.length - 1) === ':';

            // Validate it's a proper separator (only dashes and colons)
            if (!/^:?-+:?$/.test(part)) return null;

            if (left && right) return 'center';
            if (right) return 'right';
            if (left) return 'left';
            return 'left'; // Default
        });

        // Check for null (invalid separator)
        if (alignments.indexOf(null) !== -1) return null;

        return alignments;
    }

    // =========================================================================
    // BLOCK PARSER
    // =========================================================================

    /**
     * Parse abbreviation definitions from source
     * @param {string} source - Markdown source
     * @returns {Object} Map of abbreviation term -> definition
     */
    function parseAbbreviationDefinitions(source) {
        var abbrs = {};
        var regex = /^\*\[([^\]]+)\]:\s*(.+)$/gm;
        var match;

        while ((match = regex.exec(source)) !== null) {
            abbrs[match[1]] = match[2].trim();
        }

        return abbrs;
    }

    /**
     * Remove abbreviation definitions from source
     * @param {string} source - Markdown source
     * @returns {string} Source with definitions removed
     */
    function removeAbbreviationDefinitions(source) {
        return source.replace(/^\*\[[^\]]+\]:\s*.+$/gm, '').replace(/\n{3,}/g, '\n\n');
    }

    /**
     * Parse markdown into block tokens
     * @param {string} source - Markdown source
     * @returns {Array} Block tokens
     */
    function parseBlocks(source) {
        var tokens = [];
        var lines = source.split('\n');
        var i = 0;

        while (i < lines.length) {
            var line = lines[i];

            // Empty line
            if (/^\s*$/.test(line)) {
                i++;
                continue;
            }

            // Fenced code block (``` or ~~~)
            var codeMatch = line.match(/^(`{3,}|~{3,})(\w*)?$/);
            if (codeMatch) {
                var fence = codeMatch[1];
                var lang = codeMatch[2] || '';
                var codeLines = [];
                i++;
                while (i < lines.length && lines[i].indexOf(fence) !== 0) {
                    codeLines.push(lines[i]);
                    i++;
                }
                tokens.push({
                    type: 'code_block',
                    language: lang,
                    content: codeLines.join('\n')
                });
                i++;
                continue;
            }

            // Heading (# to ######)
            var headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
            if (headingMatch) {
                tokens.push({
                    type: 'heading',
                    level: headingMatch[1].length,
                    content: headingMatch[2].trim()
                });
                i++;
                continue;
            }

            // Horizontal rule
            if (/^(\*{3,}|-{3,}|_{3,})\s*$/.test(line)) {
                tokens.push({ type: 'hr' });
                i++;
                continue;
            }

            // Table detection - must have header row and separator row
            var tableMatch = line.match(/^\|(.+)\|$/);
            if (tableMatch && i + 1 < lines.length) {
                var separatorLine = lines[i + 1];
                var sepMatch = separatorLine.match(/^\|([\s\-:|]+)\|$/);

                if (sepMatch) {
                    var table = parseTable(lines, i);
                    if (table) {
                        tokens.push(table);
                        i = table._endLine + 1;
                        continue;
                    }
                }
            }

            // Blockquote
            if (line.charAt(0) === '>') {
                var quoteLines = [];
                while (i < lines.length && (lines[i].charAt(0) === '>' || /^\s*$/.test(lines[i]))) {
                    if (/^\s*$/.test(lines[i])) {
                        // Check if next line continues quote
                        if (i + 1 < lines.length && lines[i + 1].charAt(0) === '>') {
                            quoteLines.push('');
                        } else {
                            break;
                        }
                    } else {
                        quoteLines.push(lines[i].replace(/^>\s?/, ''));
                    }
                    i++;
                }
                tokens.push({
                    type: 'blockquote',
                    content: quoteLines.join('\n')
                });
                continue;
            }

            // Unordered list (with task list support)
            var ulMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
            if (ulMatch) {
                var listItems = [];
                var baseIndent = ulMatch[1].length;
                while (i < lines.length) {
                    // Check for task list item first
                    var taskMatch = lines[i].match(/^(\s*)[-*+]\s+\[([ xX])\]\s+(.*)$/);
                    var itemMatch = lines[i].match(/^(\s*)[-*+]\s+(.*)$/);

                    if (taskMatch && taskMatch[1].length === baseIndent) {
                        // Task list item
                        var checked = taskMatch[2].toLowerCase() === 'x';
                        listItems.push({
                            content: taskMatch[3],
                            indent: 0,
                            isTask: true,
                            checked: checked
                        });
                        i++;
                    } else if (taskMatch && taskMatch[1].length > baseIndent) {
                        // Nested task item
                        var nestedChecked = taskMatch[2].toLowerCase() === 'x';
                        listItems.push({
                            content: taskMatch[3],
                            indent: Math.floor((taskMatch[1].length - baseIndent) / 2),
                            isTask: true,
                            checked: nestedChecked
                        });
                        i++;
                    } else if (itemMatch && itemMatch[1].length === baseIndent) {
                        listItems.push({
                            content: itemMatch[2],
                            indent: 0
                        });
                        i++;
                    } else if (itemMatch && itemMatch[1].length > baseIndent) {
                        // Nested item - add to last item
                        listItems.push({
                            content: itemMatch[2],
                            indent: Math.floor((itemMatch[1].length - baseIndent) / 2)
                        });
                        i++;
                    } else if (/^\s*$/.test(lines[i])) {
                        i++;
                        // Check if list continues
                        if (i < lines.length) {
                            var nextMatch = lines[i].match(/^(\s*)[-*+]\s+/);
                            if (!nextMatch || nextMatch[1].length < baseIndent) {
                                break;
                            }
                        }
                    } else {
                        break;
                    }
                }
                tokens.push({
                    type: 'ul',
                    items: listItems
                });
                continue;
            }

            // Ordered list
            var olMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
            if (olMatch) {
                var olItems = [];
                var olIndent = olMatch[1].length;
                while (i < lines.length) {
                    var olItemMatch = lines[i].match(/^(\s*)(\d+)\.\s+(.*)$/);
                    if (olItemMatch && olItemMatch[1].length === olIndent) {
                        olItems.push({
                            content: olItemMatch[3],
                            indent: 0
                        });
                        i++;
                    } else if (/^\s*$/.test(lines[i])) {
                        i++;
                        if (i < lines.length) {
                            var nextOlMatch = lines[i].match(/^(\s*)(\d+)\.\s+/);
                            if (!nextOlMatch) break;
                        }
                    } else {
                        break;
                    }
                }
                tokens.push({
                    type: 'ol',
                    items: olItems
                });
                continue;
            }

            // Indented code block (4 spaces or 1 tab)
            var indentMatch = line.match(/^(    |\t)(.*)$/);
            if (indentMatch) {
                var indentedLines = [];
                while (i < lines.length) {
                    var indented = lines[i].match(/^(    |\t)(.*)$/);
                    if (indented) {
                        indentedLines.push(indented[2]);
                        i++;
                    } else if (/^\s*$/.test(lines[i])) {
                        // Empty line - check if next line continues code
                        if (i + 1 < lines.length && /^(    |\t)/.test(lines[i + 1])) {
                            indentedLines.push('');
                            i++;
                        } else {
                            break;
                        }
                    } else {
                        break;
                    }
                }
                tokens.push({
                    type: 'code_block',
                    language: '',
                    content: indentedLines.join('\n')
                });
                continue;
            }

            // Paragraph (default)
            var paraLines = [];
            while (i < lines.length && !/^\s*$/.test(lines[i])) {
                // Check for block-level interrupt
                if (/^#{1,6}\s/.test(lines[i]) ||
                    /^(`{3,}|~{3,})/.test(lines[i]) ||
                    /^>/.test(lines[i]) ||
                    /^[-*+]\s/.test(lines[i]) ||
                    /^\d+\.\s/.test(lines[i]) ||
                    /^(\*{3,}|-{3,}|_{3,})\s*$/.test(lines[i]) ||
                    /^(    |\t)/.test(lines[i])) {
                    break;
                }
                paraLines.push(lines[i]);
                i++;
            }
            if (paraLines.length > 0) {
                tokens.push({
                    type: 'paragraph',
                    content: paraLines.join('\n')
                });
            }
        }

        return tokens;
    }

    // =========================================================================
    // INLINE PARSER
    // =========================================================================

    /**
     * Parse inline markdown elements
     * @param {string} text - Text to parse
     * @param {Object} options - Render options
     * @returns {string} HTML string
     */
    function parseInline(text, options) {
        if (options.sanitize) {
            text = escapeHtml(text);
        }

        // Process escapes first (before other patterns)
        // \* \_ \` \[ \] \( \) \# \+ \- \. \! \| \\
        var escapePattern = /\\([\\`*_{}[\]()#+\-.!|])/g;
        text = text.replace(escapePattern, function(match, char) {
            // Use a placeholder to prevent further processing
            return '\x00ESC' + char.charCodeAt(0) + '\x00';
        });

        // Images ![alt](src "title")
        text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g, function(match, alt, src, title) {
            var titleAttr = title ? ' title="' + title + '"' : '';
            return '<img src="' + src + '" alt="' + alt + '"' + titleAttr + ' class="funky-markdown__img">';
        });

        // Also handle unescaped images (when sanitize is false)
        text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, function(match, alt, src, title) {
            var titleAttr = title ? ' title="' + escapeHtml(title) + '"' : '';
            return '<img src="' + escapeHtml(src) + '" alt="' + escapeHtml(alt) + '"' + titleAttr + ' class="funky-markdown__img">';
        });

        // Links [text](url "title") - escaped quotes version
        text = text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g, function(match, linkText, url, title) {
            var attrs = 'href="' + url + '"';
            if (title) {
                attrs += ' title="' + title + '"';
            }
            if (options.linkTarget) {
                attrs += ' target="' + options.linkTarget + '"';
                if (options.linkTarget === '_blank') {
                    attrs += ' rel="noopener noreferrer"';
                }
            }
            if (options.linkClass) {
                attrs += ' class="' + options.linkClass + '"';
            }
            return '<a ' + attrs + '>' + linkText + '</a>';
        });

        // Links [text](url "title") - unescaped version (when sanitize is false)
        text = text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, function(match, linkText, url, title) {
            var attrs = 'href="' + escapeHtml(url) + '"';
            if (title) {
                attrs += ' title="' + escapeHtml(title) + '"';
            }
            if (options.linkTarget) {
                attrs += ' target="' + options.linkTarget + '"';
                if (options.linkTarget === '_blank') {
                    attrs += ' rel="noopener noreferrer"';
                }
            }
            if (options.linkClass) {
                attrs += ' class="' + options.linkClass + '"';
            }
            return '<a ' + attrs + '>' + linkText + '</a>';
        });

        // Bold + Italic ***text*** or ___text___ (ES5 compatible)
        text = text.replace(/(\*{3}|_{3})([^*_]+)\1/g, '<strong><em>$2</em></strong>');

        // Bold **text** or __text__
        text = text.replace(/(\*{2}|_{2})([^*_]+)\1/g, '<strong>$2</strong>');

        // Italic *text* or _text_
        text = text.replace(/(\*|_)([^*_]+)\1/g, '<em>$2</em>');

        // Strikethrough ~~text~~
        text = text.replace(/~~([^~]+)~~/g, '<del>$1</del>');

        // Inline code `code`
        text = text.replace(/`([^`]+)`/g, '<code class="funky-markdown__code">$1</code>');

        // Autolinks - Angle bracket style <url> (process first to avoid conflicts)
        text = text.replace(/&lt;(https?:\/\/[^&]+)&gt;/g, function(match, url) {
            var attrs = 'href="' + url + '"';
            if (options.linkTarget) {
                attrs += ' target="' + options.linkTarget + '"';
                attrs += ' rel="noopener noreferrer"';
            }
            return '<a ' + attrs + ' class="funky-markdown__link funky-markdown__link--auto">' + url + '</a>';
        });

        // Autolinks - Angle bracket email <email>
        text = text.replace(/&lt;([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})&gt;/g, function(match, email) {
            return '<a href="mailto:' + email + '" class="funky-markdown__link funky-markdown__link--email">' + email + '</a>';
        });

        // Autolinks - Bare URLs (only if not already in a link)
        text = text.replace(/(^|[^"'>])(https?:\/\/[^\s<>\[\]()]+)/g, function(match, prefix, url) {
            var attrs = 'href="' + url + '"';
            if (options.linkTarget) {
                attrs += ' target="' + options.linkTarget + '"';
                if (options.linkTarget === '_blank') {
                    attrs += ' rel="noopener noreferrer"';
                }
            }
            attrs += ' class="funky-markdown__link funky-markdown__link--auto"';
            return prefix + '<a ' + attrs + '>' + url + '</a>';
        });

        // Autolinks - Bare email addresses
        text = text.replace(/(^|[^"'>])([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, function(match, prefix, email) {
            return prefix + '<a href="mailto:' + email + '" class="funky-markdown__link funky-markdown__link--email">' + email + '</a>';
        });

        // Abbreviations (uses Funky.Tooltip when available)
        if (options.abbreviations && Object.keys(options.abbreviations).length > 0) {
            text = processAbbreviations(text, options.abbreviations);
        }

        // Line breaks (two spaces at end of line)
        text = text.replace(/  \n/g, '<br>\n');

        // Restore escaped characters at the end
        text = text.replace(/\x00ESC(\d+)\x00/g, function(match, code) {
            return String.fromCharCode(parseInt(code, 10));
        });

        return text;
    }

    /**
     * Process abbreviations in text
     * Wraps known terms in <abbr> with tooltip support
     * @param {string} text - Text to process
     * @param {Object} abbreviations - Map of term -> definition
     * @returns {string}
     */
    function processAbbreviations(text, abbreviations) {
        Object.keys(abbreviations).forEach(function(term) {
            var definition = abbreviations[term];
            // Match whole words only
            var regex = new RegExp('\\b(' + escapeRegex(term) + ')\\b', 'g');
            
            text = text.replace(regex, function(match) {
                // Use data-tooltip for Funky.Tooltip integration
                return '<abbr class="funky-markdown__abbr" title="' + escapeHtml(definition) + 
                       '" data-tooltip="' + escapeHtml(definition) + '">' + match + '</abbr>';
            });
        });
        return text;
    }

    // =========================================================================
    // RENDERER
    // =========================================================================

    /**
     * Generate slug from text for heading IDs
     * @param {string} text - Heading text
     * @param {string} prefix - ID prefix
     * @param {Object} usedIds - Track used IDs for duplicates
     * @returns {string}
     */
    function slugify(text, prefix, usedIds) {
        var slug = text
            .toLowerCase()
            .replace(/<[^>]+>/g, '')  // Remove HTML tags
            .replace(/[^\w\s-]/g, '') // Remove special chars
            .replace(/\s+/g, '-')     // Replace spaces with dashes
            .replace(/-+/g, '-')      // Collapse multiple dashes
            .replace(/^-|-$/g, '');   // Trim dashes

        var baseId = (prefix || '') + slug;

        // Handle duplicate IDs
        if (usedIds) {
            if (usedIds[baseId]) {
                var count = usedIds[baseId];
                usedIds[baseId] = count + 1;
                return baseId + '-' + count;
            }
            usedIds[baseId] = 1;
        }

        return baseId;
    }

    /**
     * Render block tokens to HTML
     * @param {Array} tokens - Block tokens
     * @param {Object} options - Render options
     * @returns {string} HTML string
     */
    function renderBlocks(tokens, options) {
        var html = [];
        var headings = [];
        var usedIds = {}; // Track duplicate heading IDs

        tokens.forEach(function(token) {
            switch (token.type) {
                case 'heading':
                    var hContent = parseInline(token.content, options);
                    var hId = '';
                    var anchor = '';
                    if (options.headingIds) {
                        hId = slugify(token.content, options.headingPrefix, usedIds);
                        headings.push({
                            level: token.level,
                            text: token.content,
                            id: hId
                        });
                        // Add anchor link for heading navigation
                        if (options.headingAnchors) {
                            anchor = '<a href="#' + hId + '" class="funky-markdown__anchor" aria-hidden="true">#</a>';
                        }
                    }
                    html.push('<h' + token.level +
                        ' class="funky-markdown__h' + token.level + '"' +
                        (hId ? ' id="' + hId + '"' : '') +
                        '>' + hContent + anchor + '</h' + token.level + '>');
                    break;

                case 'paragraph':
                    html.push('<p class="funky-markdown__p">' + 
                        parseInline(token.content, options) + '</p>');
                    break;

                case 'blockquote':
                    var quoteTokens = parseBlocks(token.content);
                    var quoteHtml = renderBlocks(quoteTokens, options);
                    html.push('<blockquote class="funky-markdown__blockquote">' + 
                        quoteHtml + '</blockquote>');
                    break;

                case 'ul':
                    html.push(renderList(token.items, 'ul', options));
                    break;

                case 'ol':
                    html.push(renderList(token.items, 'ol', options));
                    break;

                case 'code_block':
                    html.push(renderCodeBlock(token.content, token.language, options));
                    break;

                case 'table':
                    html.push(renderTable(token, options));
                    break;

                case 'hr':
                    html.push('<hr class="funky-markdown__hr">');
                    break;
            }
        });

        // Store headings for TOC generation
        options._headings = headings;

        return html.join('\n');
    }

    /**
     * Render a list (ul or ol) with task list support
     * @param {Array} items - List items
     * @param {string} type - 'ul' or 'ol'
     * @param {Object} options - Render options
     * @returns {string}
     */
    function renderList(items, type, options) {
        // Check if this is a task list
        var isTaskList = items.some(function(item) { return item.isTask; });

        var listClass = 'funky-markdown__' + type;
        if (isTaskList) {
            listClass += ' funky-markdown__task-list';
        }

        var html = ['<' + type + ' class="' + listClass + '">'];

        items.forEach(function(item) {
            var content = parseInline(item.content, options);

            if (item.isTask) {
                var checked = item.checked ? ' checked disabled' : ' disabled';
                var itemClass = 'funky-markdown__li funky-markdown__task-item';
                if (item.checked) {
                    itemClass += ' funky-markdown__task-item--checked';
                }
                html.push('<li class="' + itemClass + '">');
                html.push('<input type="checkbox"' + checked + ' class="funky-markdown__task-checkbox">');
                html.push('<span class="funky-markdown__task-text">' + content + '</span>');
                html.push('</li>');
            } else {
                html.push('<li class="funky-markdown__li">' + content + '</li>');
            }
        });

        html.push('</' + type + '>');
        return html.join('\n');
    }

    // =========================================================================
    // TABLE RENDERING
    // =========================================================================

    /**
     * Render a table token
     * @param {Object} token - Table token
     * @param {Object} options - Render options
     * @returns {string}
     */
    function renderTable(token, options) {
        var tableId = 'md-table-' + (++_tableCounter);

        // Use Funky.Table when available and enabled
        if (options.tables !== false && Funky.Table) {
            return renderFunkyTable(token, tableId, options);
        }

        // Fallback: Static HTML table
        return renderStaticTable(token, options);
    }

    /**
     * Render a static HTML table (fallback when Funky.Table unavailable)
     * @param {Object} token - Table token
     * @param {Object} options - Render options
     * @returns {string}
     */
    function renderStaticTable(token, options) {
        var html = ['<div class="funky-markdown__table-wrapper">'];
        html.push('<table class="funky-markdown__table">');

        // Thead
        html.push('<thead>');
        html.push('<tr>');
        token.headers.forEach(function(cell, i) {
            var align = token.alignments[i];
            var alignAttr = align !== 'left' ? ' style="text-align: ' + align + '"' : '';
            html.push('<th' + alignAttr + '>' + parseInline(cell, options) + '</th>');
        });
        html.push('</tr>');
        html.push('</thead>');

        // Tbody
        if (token.rows.length > 0) {
            html.push('<tbody>');
            token.rows.forEach(function(row) {
                html.push('<tr>');
                row.forEach(function(cell, i) {
                    var align = token.alignments[i];
                    var alignAttr = align !== 'left' ? ' style="text-align: ' + align + '"' : '';
                    html.push('<td' + alignAttr + '>' + parseInline(cell, options) + '</td>');
                });
                html.push('</tr>');
            });
            html.push('</tbody>');
        }

        html.push('</table>');
        html.push('</div>');
        return html.join('\n');
    }

    /**
     * Render an interactive Funky.Table (default when available)
     * @param {Object} token - Table token
     * @param {string} tableId - Unique table ID
     * @param {Object} options - Render options
     * @returns {string}
     */
    function renderFunkyTable(token, tableId, options) {
        // Convert markdown table to Funky.Table format
        var columns = token.headers.map(function(header, i) {
            var align = token.alignments[i];
            return {
                data: 'col' + i,
                title: header,
                className: align !== 'left' ? 'text-' + align : '',
                render: function(data) {
                    return parseInline(data, options);
                }
            };
        });

        var data = token.rows.map(function(row, rowIndex) {
            var rowObj = { id: rowIndex };
            row.forEach(function(cell, i) {
                rowObj['col' + i] = cell;
            });
            return rowObj;
        });

        // Documentation-optimized defaults
        var baseOpts = options.funkyTableOptions || DEFAULTS.funkyTableOptions;
        var tableOpts = Object.assign({}, baseOpts);

        // Auto-calculate paging and info based on data length
        if (tableOpts.paging === 'auto') {
            tableOpts.paging = data.length > 25;
        }
        if (tableOpts.info === 'auto') {
            tableOpts.info = data.length > 10;
        }

        tableOpts.ariaLabel = 'Documentation table';

        // Store config for post-render initialization
        _pendingTables.push({
            id: tableId,
            columns: columns,
            data: data,
            options: tableOpts
        });

        // Return placeholder that will be initialized after DOM insertion
        return '<div class="funky-markdown__table-wrapper funky-markdown__table-wrapper--interactive">' +
               '<table id="' + tableId + '"></table>' +
               '</div>';
    }

    /**
     * Initialize pending Funky.Tables after DOM insertion
     * @private
     */
    function _initPendingTables() {
        if (!Funky.Table) return;

        _pendingTables.forEach(function(config) {
            var container = document.getElementById(config.id);
            if (container) {
                Funky.Table.init('#' + config.id, Object.assign({
                    data: config.data,
                    columns: config.columns
                }, config.options));
            }
        });

        _pendingTables = [];
    }

    // =========================================================================
    // CODE BLOCK HELPERS
    // =========================================================================

    /**
     * Normalize language aliases
     * @param {string} lang - Language hint
     * @returns {string}
     */
    function normalizeLanguage(lang) {
        if (!lang) return '';
        
        var aliases = {
            'js': 'javascript',
            'ts': 'typescript',
            'py': 'python',
            'rb': 'ruby',
            'sh': 'shell',
            'bash': 'shell',
            'zsh': 'shell',
            'yml': 'yaml',
            'md': 'markdown'
        };
        
        lang = lang.toLowerCase().trim();
        return aliases[lang] || lang;
    }

    /**
     * Get display name for language
     * @param {string} lang - Normalized language
     * @returns {string}
     */
    function getLanguageDisplay(lang) {
        if (!lang) return '';
        
        var names = {
            'javascript': 'JavaScript',
            'typescript': 'TypeScript',
            'html': 'HTML',
            'css': 'CSS',
            'json': 'JSON',
            'shell': 'Shell',
            'python': 'Python',
            'ruby': 'Ruby',
            'sql': 'SQL',
            'yaml': 'YAML',
            'markdown': 'Markdown',
            'perl': 'Perl',
            'php': 'PHP',
            'java': 'Java',
            'c': 'C',
            'cpp': 'C++',
            'csharp': 'C#',
            'go': 'Go',
            'rust': 'Rust',
            'swift': 'Swift'
        };
        
        return names[lang] || lang.charAt(0).toUpperCase() + lang.slice(1);
    }

    /**
     * Highlight code using available highlighter
     * @param {string} code - Code to highlight
     * @param {string} language - Language
     * @returns {string}
     */
    function highlightSyntax(code, language) {
        // Try Funky.CodePreview.highlight first (public API)
        if (Funky.CodePreview && typeof Funky.CodePreview.highlight === 'function') {
            return Funky.CodePreview.highlight(code, language);
        }
        
        // Try Prism.js if available
        if (window.Prism && Prism.languages && Prism.languages[language]) {
            return Prism.highlight(code, Prism.languages[language], language);
        }
        
        // Try highlight.js if available
        if (window.hljs) {
            try {
                var result = hljs.highlight(code, { language: language });
                return result.value;
            } catch (e) {
                // Language not supported
            }
        }
        
        // No highlighting available - return escaped
        return escapeHtml(code);
    }

    /**
     * Bind copy button click handlers
     * @param {Element} container - Container element
     */
    function bindCopyButtons(container) {
        var buttons = container.querySelectorAll('[data-code-copy]');
        
        for (var i = 0; i < buttons.length; i++) {
            (function(btn) {
                btn.addEventListener('click', function(e) {
                    var wrapper = btn.closest('.funky-markdown__pre-wrapper');
                    if (!wrapper) return;
                    
                    var codeEl = wrapper.querySelector('.funky-markdown__code-block');
                    if (!codeEl) return;
                    
                    var code = codeEl.textContent;
                    var pre = wrapper.querySelector('pre');
                    var lang = pre ? pre.dataset.language : '';
                    
                    copyToClipboard(code, btn, container, lang);
                });
            })(buttons[i]);
        }
    }

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @param {Element} button - Button element
     * @param {Element} container - Container for event
     * @param {string} language - Language for event
     */
    function copyToClipboard(text, button, container, language) {
        var success = false;
        
        // Try Funky.Clipboard
        if (Funky.Clipboard && typeof Funky.Clipboard.copy === 'function') {
            Funky.Clipboard.copy(text);
            success = true;
            showCopyFeedback(button, true);
            emitCopyEvent(container, text, language);
            return;
        }
        
        // Try modern API
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function() {
                showCopyFeedback(button, true);
                emitCopyEvent(container, text, language);
            }).catch(function() {
                showCopyFeedback(button, false);
            });
            return;
        }
        
        // Fallback to execCommand
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            success = document.execCommand('copy');
        } catch (e) {
            success = false;
        }
        document.body.removeChild(textarea);
        
        showCopyFeedback(button, success);
        if (success) {
            emitCopyEvent(container, text, language);
        }
    }

    /**
     * Emit copy event
     * @param {Element} container - Container element
     * @param {string} code - Copied code
     * @param {string} language - Language
     */
    function emitCopyEvent(container, code, language) {
        var event = new CustomEvent('funky.markdown.copy', {
            bubbles: true,
            detail: { code: code, language: language }
        });
        container.dispatchEvent(event);
    }

    /**
     * Show copy feedback on button
     * @param {Element} button - Button element
     * @param {boolean} success - Whether copy succeeded
     */
    function showCopyFeedback(button, success) {
        var icon = button.querySelector('i');
        if (!icon) return;
        
        var originalClass = icon.className;
        
        if (success) {
            icon.className = 'fas fa-check';
            button.classList.add('funky-markdown__copy-btn--success');
        } else {
            icon.className = 'fas fa-times';
            button.classList.add('funky-markdown__copy-btn--error');
        }
        
        setTimeout(function() {
            icon.className = originalClass;
            button.classList.remove('funky-markdown__copy-btn--success', 'funky-markdown__copy-btn--error');
        }, 2000);
    }

    /**
     * Render a code block with syntax highlighting
     * @param {string} code - Code content
     * @param {string} language - Language hint
     * @param {Object} options - Render options
     * @returns {string}
     */
    function renderCodeBlock(code, language, options) {
        var escapedCode = escapeHtml(code);
        var langNormalized = normalizeLanguage(language);
        var langDisplay = getLanguageDisplay(langNormalized);
        var lineCount = code.split('\n').length;
        var needsCollapse = options.codeMaxHeight && lineCount > 20;
        
        var html = [];
        
        // Wrapper with header
        var wrapperClasses = ['funky-markdown__pre-wrapper'];
        if (needsCollapse) {
            wrapperClasses.push('funky-markdown__pre-wrapper--collapsible');
        }
        html.push('<div class="' + wrapperClasses.join(' ') + '">');
        
        // Header with language label and copy button
        if (langDisplay || options.copyButton) {
            html.push('<div class="funky-markdown__code-header">');
            if (langDisplay) {
                html.push('<span class="funky-markdown__code-lang">' + langDisplay + '</span>');
            } else {
                html.push('<span class="funky-markdown__code-lang"></span>');
            }
            // Show line count for collapsible blocks
            if (needsCollapse) {
                html.push('<span class="funky-markdown__code-lines">' + lineCount + ' lines</span>');
            }
            if (options.copyButton) {
                html.push('<button type="button" class="funky-markdown__copy-btn" data-code-copy aria-label="Copy code">');
                html.push('<i class="fas fa-copy"></i>');
                html.push('</button>');
            }
            html.push('</div>');
        }
        
        // Pre element
        var preClasses = ['funky-markdown__pre'];
        if (langDisplay || options.copyButton) {
            preClasses.push('funky-markdown__pre--with-header');
        }
        if (options.lineNumbers) {
            preClasses.push('funky-markdown__pre--line-numbers');
        }
        if (needsCollapse) {
            preClasses.push('funky-markdown__pre--collapsed');
        }
        
        var preAttrs = ' data-language="' + (langNormalized || '') + '"';
        if (needsCollapse && options.codeMaxHeight) {
            preAttrs += ' style="max-height: ' + options.codeMaxHeight + 'px"';
        }
        
        html.push('<pre class="' + preClasses.join(' ') + '"' + preAttrs + '>');
        
        // Line numbers if enabled
        if (options.lineNumbers) {
            html.push('<span class="funky-markdown__line-numbers" aria-hidden="true">');
            for (var i = 1; i <= lineCount; i++) {
                html.push('<span>' + i + '</span>');
            }
            html.push('</span>');
        }
        
        // Code element
        var codeClasses = ['funky-markdown__code-block'];
        if (langNormalized) {
            codeClasses.push('language-' + langNormalized);
        }
        
        html.push('<code class="' + codeClasses.join(' ') + '">');
        html.push(escapedCode);
        html.push('</code>');
        
        html.push('</pre>');
        html.push('</div>');
        
        return html.join('');
    }

    // =========================================================================
    // FILE LOADING HELPERS
    // =========================================================================

    /**
     * Show loading state in container
     * @param {Element} container - Container element
     * @param {Object} options - Options
     */
    function showLoadingState(container, options) {
        // Clear existing content
        container.innerHTML = '';

        // Try Funky.Skeleton for placeholder content
        if (options.loadingIndicator === 'skeleton' && Funky.Skeleton && typeof Funky.Skeleton.create === 'function') {
            var skeleton = D.create('div')
                .classAdd('funky-markdown__loading');

            // Title skeleton
            skeleton.append(
                Funky.Skeleton.create({ type: 'title', width: '60%' })
            );

            // Paragraph skeletons
            for (var i = 0; i < 3; i++) {
                skeleton.append(
                    Funky.Skeleton.create({ type: 'text', lines: 3 })
                );
            }

            container.appendChild(skeleton.el || skeleton);
            return;
        }

        // Try Funky.Spinner
        if (options.loadingIndicator === 'spinner' && Funky.Spinner && typeof Funky.Spinner.create === 'function') {
            var spinner = D.create('div')
                .classAdd('funky-markdown__loading')
                .append(
                    Funky.Spinner.create({
                        size: 'md',
                        text: 'Loading...'
                    })
                );

            container.appendChild(spinner.el || spinner);
            return;
        }

        // Fallback loading indicator
        var loadingEl = D.create('div')
            .classAdd('funky-markdown__loading', 'funky-markdown__loading--fallback')
            .html('<span class="funky-markdown__spinner"></span> Loading...');

        container.appendChild(loadingEl.el || loadingEl);
    }

    /**
     * Show error state in container
     * @param {Element} container - Container element
     * @param {Error} error - Error object
     * @param {string} url - Failed URL
     * @param {Object} options - Options
     */
    function showErrorState(container, error, url, options) {
        // Clear existing content
        container.innerHTML = '';

        // Try Funky.EmptyState
        if (Funky.EmptyState && typeof Funky.EmptyState.render === 'function') {
            var emptyState = Funky.EmptyState.render({
                type: 'error',
                icon: 'fas fa-exclamation-triangle',
                title: 'Failed to load content',
                message: error.message,
                action: options.onRetry ? {
                    text: 'Retry',
                    onClick: function() {
                        Markdown.renderFile(url, container, options);
                    }
                } : null
            });

            container.appendChild(emptyState.el || emptyState);
            return;
        }

        // Fallback error display
        var errorEl = D.create('div')
            .classAdd('funky-markdown__error');

        var iconEl = D.create('div')
            .classAdd('funky-markdown__error-icon')
            .html('<i class="fas fa-exclamation-triangle"></i>');

        var titleEl = D.create('div')
            .classAdd('funky-markdown__error-title')
            .text('Failed to load content');

        var messageEl = D.create('div')
            .classAdd('funky-markdown__error-message')
            .text(error.message);

        errorEl.append(iconEl).append(titleEl).append(messageEl);

        // Retry button if callback provided
        if (options.onRetry) {
            var retryBtn = D.create('button')
                .classAdd('funky-markdown__error-retry', 'btn', 'btn-outline-primary', 'btn-sm')
                .attr('type', 'button')
                .text('Retry')
                .on('click', function() {
                    Markdown.renderFile(url, container, options);
                });

            errorEl.append(retryBtn);
        }

        container.appendChild(errorEl.el || errorEl);
    }

    /**
     * Resolve relative URLs in HTML content
     * @param {string} html - HTML content
     * @param {string} baseUrl - Base URL
     * @returns {string}
     */
    function resolveRelativeUrls(html, baseUrl) {
        if (!baseUrl) return html;

        // Ensure baseUrl ends with /
        var lastSlash = baseUrl.lastIndexOf('/');
        if (lastSlash !== -1 && lastSlash < baseUrl.length - 1) {
            baseUrl = baseUrl.substring(0, lastSlash + 1);
        }

        // Resolve relative image sources
        html = html.replace(/src="(?!https?:\/\/|\/|data:)([^"]+)"/g, function(match, src) {
            return 'src="' + baseUrl + src + '"';
        });

        // Resolve relative href links
        html = html.replace(/href="(?!https?:\/\/|\/|#|mailto:)([^"]+)"/g, function(match, href) {
            return 'href="' + baseUrl + href + '"';
        });

        return html;
    }

    // =========================================================================
    // NAVIGATION HELPERS
    // =========================================================================

    /**
     * Initialize QuickNav with document headings
     * @param {Element} container - Markdown container
     * @param {Array} headings - Generated headings from TOC
     * @param {Object} options - Options
     * @private
     */
    function initQuickNav(container, headings, options) {
        if (!options.quickNav || !Funky.QuickNav) return;

        // Build sections from headings
        var sections = headings.map(function(h) {
            return {
                id: h.id,
                title: h.text,
                level: h.level
            };
        });

        // Configure QuickNav with markdown sections
        Funky.QuickNav.init({
            container: container,
            sections: sections,
            position: 'bottom-right',
            backToTop: true,
            showTrigger: 'scroll',
            scrollThreshold: 200,
            announceNavigation: options.announcements
        });
    }

    /**
     * Initialize scroll tracking for TOC highlight
     * @param {Element} container - Markdown container
     * @param {Array} headings - Generated headings
     * @param {Object} options - Options
     * @private
     */
    function initScrollTracker(container, headings, options) {
        if (!options.scrollTracking || !options.tocHighlight) return;
        if (!Funky.ScrollTracker) return;

        var tocContainer = options.tocContainer ? D.one(options.tocContainer) : null;
        if (!tocContainer) return;

        var thresholds = headings.map(function(h) {
            var el = document.getElementById(h.id);
            return el ? el.offsetTop : 0;
        });

        var tracker = Funky.ScrollTracker.create({
            thresholds: thresholds,
            onThreshold: function(data) {
                // Highlight active TOC item
                var activeId = headings[data.thresholdIndex].id;
                highlightTocItem(tocContainer, activeId);
            },
            onScroll: function(data) {
                // Emit scroll event
                Markdown._emit(container, 'scroll', {
                    progress: data.scrollY / (document.body.scrollHeight - window.innerHeight),
                    direction: data.direction
                });
            }
        });

        // Store for cleanup
        container._scrollTracker = tracker;
    }

    /**
     * Highlight active TOC item
     * @param {Element} tocContainer
     * @param {string} activeId
     */
    function highlightTocItem(tocContainer, activeId) {
        var nativeToc = tocContainer.el || tocContainer;

        // Remove current highlight
        var current = nativeToc.querySelector('.funky-markdown__toc-link--active');
        if (current) {
            current.classList.remove('funky-markdown__toc-link--active');
        }

        // Add to new
        var link = nativeToc.querySelector('[href="#' + activeId + '"]');
        if (link) {
            link.classList.add('funky-markdown__toc-link--active');
        }
    }

    // =========================================================================
    // TOC PANEL HELPERS
    // =========================================================================

    /**
     * Build nested tree data from flat headings array
     * @param {Array} headings - Flat headings array
     * @returns {Array} Nested tree data for TreeView
     */
    function buildTocTreeData(headings) {
        var treeData = [];
        var nodeStack = [{ children: treeData, level: 0 }];

        for (var i = 0; i < headings.length; i++) {
            var h = headings[i];
            var node = {
                id: 'toc-' + h.id,
                label: h.text,
                icon: h.level === 1 ? 'fa-bookmark' : 'fa-angle-right',
                data: { anchor: h.id, level: h.level }
            };

            // Pop stack until we find a parent with lower level
            while (nodeStack.length > 1 && nodeStack[nodeStack.length - 1].level >= h.level) {
                nodeStack.pop();
            }

            // Add to parent's children
            var parent = nodeStack[nodeStack.length - 1];
            if (!parent.children) parent.children = [];
            parent.children.push(node);

            // Push this node for potential children
            nodeStack.push({ children: [], level: h.level, node: node });
            node.children = nodeStack[nodeStack.length - 1].children;
        }

        // Clean up empty children arrays
        function cleanTree(nodes) {
            for (var j = 0; j < nodes.length; j++) {
                if (nodes[j].children && nodes[j].children.length === 0) {
                    delete nodes[j].children;
                } else if (nodes[j].children) {
                    cleanTree(nodes[j].children);
                }
            }
        }
        cleanTree(treeData);

        return treeData;
    }

    /**
     * Collect all node IDs from tree data
     * @param {Array} nodes - Tree nodes
     * @returns {Array} All node IDs
     */
    function collectTreeIds(nodes) {
        var ids = [];
        for (var i = 0; i < nodes.length; i++) {
            ids.push(nodes[i].id);
            if (nodes[i].children) {
                ids = ids.concat(collectTreeIds(nodes[i].children));
            }
        }
        return ids;
    }

    /**
     * Create TOC panel structure using modal-slide-panel
     * @param {Element} container - Markdown container
     * @param {Object} options - Options
     * @returns {Object} Panel elements { modal, toggleBtn, treeEl, modalId }
     */
    function createTocPanel(container, options) {
        var nativeEl = container.el || container;
        var position = options.tocPanelPosition || 'top-left';
        var isRight = position.indexOf('right') !== -1;

        // Generate unique modal ID
        var modalId = 'funky-toc-panel-' + Date.now();

        // Create modal using Funky.Modal.init() for slide panel
        var modal = Funky.Modal.init({
            id: modalId,
            title: '<i class="fas fa-list-ul me-2"></i>Contents',
            slidePanel: true,
            showClose: true,
            scrollable: true,
            bodyId: modalId + '-tree'
        });

        // Get tree container (modal body)
        var treeEl = document.getElementById(modalId + '-tree');

        // Create toggle button with position classes
        var toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        var classes = ['funky-markdown__toc-toggle', 'funky-markdown__toc-toggle--' + position];
        if (options.tocPanelSticky) {
            classes.push('funky-markdown__toc-toggle--sticky');
        }
        toggleBtn.className = classes.join(' ');
        toggleBtn.title = 'Open Table of Contents';
        toggleBtn.setAttribute('aria-label', 'Open table of contents');
        toggleBtn.setAttribute('aria-controls', modalId);
        toggleBtn.innerHTML = '<i class="fas fa-list-ul"></i><span class="funky-markdown__toc-toggle-text">TOC</span>';

        return {
            modal: modal,
            toggleBtn: toggleBtn,
            treeEl: treeEl,
            modalId: modalId,
            isRight: isRight
        };
    }

    /**
     * Initialize TOC panel with TreeView using Modal slide-panel
     * @param {Element} container - Markdown container
     * @param {Array} headings - Headings array
     * @param {Object} options - Options
     * @returns {Object} Panel instance with open/close/destroy methods
     */
    function initTocPanel(container, headings, options) {
        if (!headings || headings.length === 0) return null;
        if (!Funky.Modal) {
            console.warn('[Funky.Markdown] Funky.Modal not available for TOC panel');
            return null;
        }

        var nativeEl = container.el || container;
        var elements = createTocPanel(container, options);
        var treeInstance = null;

        // Add panel class to container
        nativeEl.classList.add('funky-markdown--has-toc-panel');

        // Insert toggle button into container
        nativeEl.appendChild(elements.toggleBtn);

        // Build TreeView if available
        if (Funky.TreeView && elements.treeEl) {
            var treeData = buildTocTreeData(headings);
            var allIds = collectTreeIds(treeData);

            treeInstance = Funky.TreeView.init(elements.treeEl, {
                data: treeData,
                selectable: 'single',
                showGuides: true,
                indentSize: 16,
                expandedIds: allIds,
                iconMap: {
                    folder: 'fa-bookmark',
                    folderOpen: 'fa-bookmark',
                    file: 'fa-angle-right'
                }
            });

            // Handle node selection - navigate and close panel
            elements.treeEl.addEventListener('funky.tree-view.select', function(e) {
                if (e.detail && e.detail.nodes && e.detail.nodes.length > 0) {
                    var selectedNode = e.detail.nodes[0];
                    if (selectedNode && selectedNode.data) {
                        var anchor = selectedNode.data.anchor;
                        var target = document.getElementById(anchor);
                        if (target) {
                            // Close modal first, then scroll
                            Funky.Modal.hide('#' + elements.modalId);
                            setTimeout(function() {
                                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }, 100);
                        }
                    }
                }
            });
        } else if (elements.treeEl) {
            // Fallback: simple list
            var tocHtml = '<nav class="funky-markdown__toc-list"><ul>';
            for (var j = 0; j < headings.length; j++) {
                var h = headings[j];
                tocHtml += '<li class="funky-markdown__toc-item funky-markdown__toc-item--level-' + h.level + '">';
                tocHtml += '<a href="#' + h.id + '" class="funky-markdown__toc-link">' + escapeHtml(h.text) + '</a>';
                tocHtml += '</li>';
            }
            tocHtml += '</ul></nav>';
            elements.treeEl.innerHTML = tocHtml;

            // Handle link clicks
            elements.treeEl.addEventListener('click', function(e) {
                var link = e.target.closest('a');
                if (link && link.hash) {
                    e.preventDefault();
                    var target = document.getElementById(link.hash.slice(1));
                    if (target) {
                        Funky.Modal.hide('#' + elements.modalId);
                        setTimeout(function() {
                            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                    }
                }
            });
        }

        // Open panel handler
        function openPanel() {
            Funky.Modal.show('#' + elements.modalId);
        }

        // Close panel handler
        function closePanel() {
            Funky.Modal.hide('#' + elements.modalId);
        }

        // Bind toggle button
        elements.toggleBtn.addEventListener('click', openPanel);

        // Open immediately if configured
        if (options.tocPanelStartOpen) {
            openPanel();
        }

        // Return instance
        return {
            open: openPanel,
            close: closePanel,
            isOpen: function() {
                var instance = Funky.Modal.getInstance('#' + elements.modalId);
                return instance ? instance.isShown : false;
            },
            destroy: function() {
                // Destroy TreeView
                if (treeInstance && typeof treeInstance.destroy === 'function') {
                    treeInstance.destroy();
                }
                // Destroy modal
                Funky.Modal.destroy('#' + elements.modalId);
                // Remove toggle button
                if (elements.toggleBtn.parentNode) {
                    elements.toggleBtn.parentNode.removeChild(elements.toggleBtn);
                }
                nativeEl.classList.remove('funky-markdown--has-toc-panel');
            }
        };
    }

    /**
     * Initialize keyboard shortcuts for document navigation
     * @param {Element} container - Markdown container
     * @param {Array} headings - Generated headings
     * @param {Object} options - Options
     * @private
     */
    function initKeyboardNav(container, headings, options) {
        if (!options.keyboard || !Funky.Keyboard) return;

        var currentHeadingIndex = -1;
        var scope = 'markdown-' + (container.id || 'doc');

        // Register shortcuts in markdown scope
        Funky.Keyboard.register([
            {
                key: 'j',
                scope: scope,
                description: 'Next heading',
                handler: function() {
                    currentHeadingIndex = Math.min(currentHeadingIndex + 1, headings.length - 1);
                    navigateToHeading(headings, currentHeadingIndex, options);
                }
            },
            {
                key: 'k',
                scope: scope,
                description: 'Previous heading',
                handler: function() {
                    currentHeadingIndex = Math.max(currentHeadingIndex - 1, 0);
                    navigateToHeading(headings, currentHeadingIndex, options);
                }
            },
            {
                key: 'g g',
                scope: scope,
                description: 'Go to top',
                handler: function() {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    if (options.announcements && Funky.Announce) {
                        Funky.Announce.polite('Navigated to top');
                    }
                }
            },
            {
                key: 'shift+g',
                scope: scope,
                description: 'Go to bottom',
                handler: function() {
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                    if (options.announcements && Funky.Announce) {
                        Funky.Announce.polite('Navigated to bottom');
                    }
                }
            },
            {
                key: '/',
                scope: scope,
                description: 'Search document',
                handler: function(e) {
                    e.preventDefault();
                    // Focus search if available (QuickNav or external)
                    if (Funky.QuickNav && Funky.QuickNav.focusSearch) {
                        Funky.QuickNav.focusSearch();
                    }
                }
            },
            {
                key: 'c',
                scope: scope,
                description: 'Copy focused code block',
                handler: function() {
                    var focused = document.activeElement.closest('.funky-markdown__pre-wrapper');
                    if (focused) {
                        var copyBtn = focused.querySelector('.funky-markdown__copy-btn');
                        if (copyBtn) copyBtn.click();
                    }
                }
            }
        ]);

        // Push scope when container focused
        container.addEventListener('focusin', function() {
            Funky.Keyboard.pushScope(scope);
        });

        container.addEventListener('focusout', function(e) {
            if (!container.contains(e.relatedTarget)) {
                Funky.Keyboard.popScope(scope);
            }
        });

        // Store for cleanup
        container._keyboardScope = scope;
    }

    /**
     * Navigate to heading by index
     * @param {Array} headings
     * @param {number} index
     * @param {Object} options
     */
    function navigateToHeading(headings, index, options) {
        if (index < 0) index = 0;
        if (index >= headings.length) index = headings.length - 1;

        var heading = headings[index];
        if (!heading) return;

        var el = document.getElementById(heading.id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // Announce for screen readers
            if (options.announcements && Funky.Announce) {
                Funky.Announce.polite('Navigated to ' + heading.text);
            }
        }
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    var Markdown = {
        /**
         * Render markdown source to HTML string
         * @param {string} source - Markdown source
         * @param {Object} options - Render options
         * @returns {string} HTML string
         */
        render: function(source, options) {
            options = Object.assign({}, DEFAULTS, options);

            if (!source || typeof source !== 'string') {
                return '';
            }

            // Normalize line endings
            source = source.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

            // Parse abbreviation definitions from source and merge with options
            var parsedAbbrs = parseAbbreviationDefinitions(source);
            if (Object.keys(parsedAbbrs).length > 0) {
                options.abbreviations = Object.assign({}, options.abbreviations || {}, parsedAbbrs);
                source = removeAbbreviationDefinitions(source);
            }

            // Parse and render
            var tokens = parseBlocks(source);
            var html = renderBlocks(tokens, options);

            return html;
        },

        /**
         * Render markdown into a container element
         * @param {Element|string} container - Container element or selector
         * @param {string} source - Markdown source
         * @param {Object} options - Render options
         * @returns {Element} Container element
         */
        renderTo: function(container, source, options) {
            options = Object.assign({}, DEFAULTS, options);

            var el = typeof container === 'string' ? D.one(container) : container;
            if (!el) {
                console.error('[Funky.Markdown] Container not found:', container);
                return null;
            }

            // Get native element if Funky.Dom wrapper
            var nativeEl = el.el || el;

            // Add base class
            nativeEl.classList.add('funky-markdown');

            // Add density class if specified
            if (options.density === 'compact') {
                nativeEl.classList.add('funky-markdown--compact');
            } else if (options.density === 'comfortable') {
                nativeEl.classList.add('funky-markdown--comfortable');
            }

            // Reset table counter for new render
            _tableCounter = 0;
            _pendingTables = [];

            // Render content - call internal render logic directly to share options
            if (!source || typeof source !== 'string') {
                nativeEl.innerHTML = '';
                return el;
            }

            // Normalize line endings
            source = source.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

            // Parse abbreviation definitions from source and merge with options
            var parsedAbbrs = parseAbbreviationDefinitions(source);
            if (Object.keys(parsedAbbrs).length > 0) {
                options.abbreviations = Object.assign({}, options.abbreviations || {}, parsedAbbrs);
                source = removeAbbreviationDefinitions(source);
            }

            // Parse and render
            var tokens = parseBlocks(source);
            var html = renderBlocks(tokens, options);
            nativeEl.innerHTML = html;

            // Initialize pending Funky.Tables after DOM insertion
            _initPendingTables();

            // Apply syntax highlighting if enabled
            if (options.highlightCode) {
                this.highlightCode(nativeEl);
            }

            // Generate TOC if enabled
            if (options.toc && options._headings && options._headings.length > 0) {
                this.renderToc(options._headings, options);
            }

            // Initialize TOC panel if enabled
            if (options.tocPanel && options._headings && options._headings.length > 0) {
                // Clean up existing panel
                if (nativeEl._tocPanel) {
                    nativeEl._tocPanel.destroy();
                }
                nativeEl._tocPanel = initTocPanel(nativeEl, options._headings, options);
            }

            // Emit event with headings data
            this._emit(nativeEl, 'render', {
                source: source,
                html: html,
                element: nativeEl,
                headings: options._headings || []
            });

            // Callback
            if (typeof options.onRender === 'function') {
                options.onRender(nativeEl, html);
            }

            return el;
        },

        /**
         * Fetch and render a markdown file
         * @param {string} url - URL to fetch
         * @param {Element|string} container - Container element or selector
         * @param {Object} options - Render options
         * @returns {Promise}
         */
        renderFile: function(url, container, options) {
            options = Object.assign({}, DEFAULTS, options);

            var el = typeof container === 'string' ? D.one(container) : container;
            if (!el) {
                console.error('[Funky.Markdown] Container not found:', container);
                return Promise.reject(new Error('Container not found'));
            }

            var nativeEl = el.el || el;
            var self = this;

            // Add base class and loading state
            nativeEl.classList.add('funky-markdown', 'funky-markdown--loading');

            // Check cache first
            if (options.cache && _fileCache[url]) {
                nativeEl.classList.remove('funky-markdown--loading');
                self.renderTo(container, _fileCache[url], options);

                // Emit load event
                self._emit(nativeEl, 'load', {
                    url: url,
                    element: nativeEl,
                    fromCache: true
                });

                // Callback
                if (typeof options.onLoad === 'function') {
                    options.onLoad(nativeEl, _fileCache[url]);
                }

                return Promise.resolve(_fileCache[url]);
            }

            // Check for pending request to same URL
            if (_pendingRequests[url]) {
                return _pendingRequests[url].then(function(source) {
                    nativeEl.classList.remove('funky-markdown--loading');
                    self.renderTo(container, source, options);

                    // Emit load event
                    self._emit(nativeEl, 'load', {
                        url: url,
                        element: nativeEl,
                        fromPending: true
                    });

                    // Callback
                    if (typeof options.onLoad === 'function') {
                        options.onLoad(nativeEl, source);
                    }

                    return source;
                });
            }

            // Show loading state
            showLoadingState(nativeEl, options);

            // Fetch the file
            var fetchPromise = fetch(url)
                .then(function(response) {
                    if (!response.ok) {
                        throw new Error('HTTP ' + response.status + ': ' + response.statusText);
                    }
                    return response.text();
                })
                .then(function(source) {
                    // Cache the result
                    if (options.cache) {
                        _fileCache[url] = source;
                    }

                    // Remove from pending
                    delete _pendingRequests[url];

                    // Remove loading state
                    nativeEl.classList.remove('funky-markdown--loading');

                    // Render content
                    self.renderTo(container, source, options);

                    // Emit load event
                    self._emit(nativeEl, 'load', {
                        url: url,
                        element: nativeEl
                    });

                    // Callback
                    if (typeof options.onLoad === 'function') {
                        options.onLoad(nativeEl, source);
                    }

                    return source;
                })
                .catch(function(error) {
                    // Remove from pending
                    delete _pendingRequests[url];

                    // Remove loading state
                    nativeEl.classList.remove('funky-markdown--loading');
                    nativeEl.classList.add('funky-markdown--error');

                    // Show error state
                    showErrorState(nativeEl, error, url, options);

                    // Emit error event
                    self._emit(nativeEl, 'error', {
                        url: url,
                        error: error,
                        element: nativeEl
                    });

                    // Callback
                    if (typeof options.onError === 'function') {
                        options.onError(error, nativeEl);
                    }

                    throw error;
                });

            // Store pending request
            _pendingRequests[url] = fetchPromise;

            return fetchPromise;
        },

        /**
         * Prefetch markdown files into cache
         * @param {string|Array} urls - URL or array of URLs to prefetch
         * @returns {Promise}
         */
        prefetch: function(urls) {
            if (typeof urls === 'string') {
                urls = [urls];
            }

            var promises = urls.map(function(url) {
                // Skip if already cached
                if (_fileCache[url]) {
                    return Promise.resolve(_fileCache[url]);
                }

                return fetch(url)
                    .then(function(response) {
                        if (!response.ok) {
                            throw new Error('HTTP ' + response.status);
                        }
                        return response.text();
                    })
                    .then(function(source) {
                        _fileCache[url] = source;
                        return source;
                    })
                    .catch(function(error) {
                        console.warn('[Funky.Markdown] Prefetch failed for:', url, error);
                        return null;
                    });
            });

            return Promise.all(promises);
        },

        /**
         * Clear the file cache
         * @param {string} url - Optional specific URL to clear
         */
        clearCache: function(url) {
            if (url) {
                delete _fileCache[url];
            } else {
                _fileCache = {};
            }
        },

        /**
         * Get cached content
         * @param {string} url - URL to check
         * @returns {string|null}
         */
        getCached: function(url) {
            return _fileCache[url] || null;
        },

        /**
         * Highlight code blocks in container
         * @param {Element|string} container - Container element
         */
        highlightCode: function(container) {
            var el = typeof container === 'string' ? D.one(container) : container;
            if (!el) return;

            var nativeEl = el.el || el;
            // Support both funky-markdown code blocks and standard code blocks with language-* class
            var codeBlocks = nativeEl.querySelectorAll('.funky-markdown__code-block, code[class*="language-"]');

            for (var i = 0; i < codeBlocks.length; i++) {
                var codeEl = codeBlocks[i];
                var langMatch = codeEl.className.match(/language-(\w+)/);
                var lang = langMatch ? langMatch[1] : null;

                if (!lang) continue;

                var code = codeEl.textContent;
                var highlighted = highlightSyntax(code, lang);

                if (highlighted !== escapeHtml(code)) {
                    codeEl.innerHTML = highlighted;
                }
            }

            // Bind copy buttons
            bindCopyButtons(nativeEl);
        },

        /**
         * Generate table of contents from headings
         * @param {string} source - Markdown source
         * @param {Object} options - Options
         * @returns {Array} Heading objects
         */
        generateToc: function(source, options) {
            var opts = Object.assign({}, DEFAULTS, options);

            if (!source || typeof source !== 'string') {
                return [];
            }

            // Normalize line endings
            source = source.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

            // Parse and render to collect headings
            var tokens = parseBlocks(source);
            renderBlocks(tokens, opts);

            return opts._headings || [];
        },

        /**
         * Extract headings from markdown source (alias for generateToc)
         * @param {string} source - Markdown source
         * @param {Object} options - Options
         * @returns {Array} Heading objects
         */
        extractHeadings: function(source, options) {
            return this.generateToc(source, options);
        },

        /**
         * Render table of contents
         * @param {Array} headings - Heading objects
         * @param {Object} options - Options (tocContainer, maxLevel, tocMaxLevel)
         * @returns {string} HTML string (when no container provided)
         */
        renderToc: function(headings, options) {
            options = options || {};
            var maxLevel = options.maxLevel || options.tocMaxLevel || 6;

            // Filter by max level
            var filtered = headings.filter(function(h) {
                return h.level <= maxLevel;
            });

            if (filtered.length === 0) return '';

            // Build TOC HTML
            var html = ['<nav class="funky-markdown__toc" aria-label="Table of contents">'];
            html.push('<h4 class="funky-markdown__toc-title">Contents</h4>');
            html.push('<ul class="funky-markdown__toc-list">');

            for (var i = 0; i < filtered.length; i++) {
                var heading = filtered[i];
                html.push('<li class="funky-markdown__toc-item funky-markdown__toc-item--level-' + heading.level + '">');
                html.push('<a href="#' + heading.id + '" class="funky-markdown__toc-link">' + escapeHtml(heading.text) + '</a>');
                html.push('</li>');
            }

            html.push('</ul>');
            html.push('</nav>');

            var tocHtml = html.join('');

            // If container provided, render to it
            if (options.tocContainer) {
                var container = typeof options.tocContainer === 'string'
                    ? D.one(options.tocContainer)
                    : options.tocContainer;

                if (container) {
                    var nativeEl = container.el || container;
                    nativeEl.innerHTML = tocHtml;
                }
            }

            // Always return HTML string
            return tocHtml;
        },

        /**
         * Get TOC panel instance for a container
         * @param {Element|string} container - Container element or selector
         * @returns {Object|null} Panel instance with open/close/destroy methods
         */
        getTocPanel: function(container) {
            var el = typeof container === 'string' ? D.one(container) : container;
            if (!el) return null;
            var nativeEl = el.el || el;
            return nativeEl._tocPanel || null;
        },

        /**
         * Emit a custom event
         * @private
         */
        _emit: function(element, eventName, detail) {
            var event = new CustomEvent('funky.markdown.' + eventName, {
                bubbles: true,
                detail: detail
            });
            element.dispatchEvent(event);
        }
    };

    // =========================================================================
    // REGISTER
    // =========================================================================

    Funky.register('Markdown', Markdown);

})(window);

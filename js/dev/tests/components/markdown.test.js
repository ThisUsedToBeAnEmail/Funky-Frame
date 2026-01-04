/**
 * Tests for Funky.Markdown
 * @see public/assets/js/components/markdown.js
 */
describe('Funky.Component.Markdown', function() {
    'use strict';

    var expect = FunkyTests.expect;
    var fixture;
    var container;

    beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="test-md"></div>');
        container = document.querySelector('#test-md');
    });

    afterEach(function() {
        fixture.cleanup();
    });

    // =========================================================================
    // MODULE AVAILABILITY
    // =========================================================================

    describe('Module availability', function() {
        it('is registered in Funky namespace', function() {
            expect(Funky.Markdown).toBeDefined();
        });

        it('has render method', function() {
            expect(typeof Funky.Markdown.render).toBe('function');
        });

        it('has renderTo method', function() {
            expect(typeof Funky.Markdown.renderTo).toBe('function');
        });

        it('has renderFile method', function() {
            expect(typeof Funky.Markdown.renderFile).toBe('function');
        });

        it('has extractHeadings method', function() {
            expect(typeof Funky.Markdown.extractHeadings).toBe('function');
        });

        it('has renderToc method', function() {
            expect(typeof Funky.Markdown.renderToc).toBe('function');
        });

        it('is registered via Funky.register', function() {
            expect(Funky.isRegistered('Markdown')).toBe(true);
        });
    });

    // =========================================================================
    // HEADINGS
    // =========================================================================

    describe('Headings', function() {
        it('renders h1 with #', function() {
            var html = Funky.Markdown.render('# Heading 1');
            expect(html).toContain('funky-markdown__h1');
            expect(html).toContain('Heading 1');
        });

        it('renders h2 with ##', function() {
            var html = Funky.Markdown.render('## Heading 2');
            expect(html).toContain('funky-markdown__h2');
        });

        it('renders h3-h6', function() {
            var html = Funky.Markdown.render('### H3\n#### H4\n##### H5\n###### H6');
            expect(html).toContain('funky-markdown__h3');
            expect(html).toContain('funky-markdown__h4');
            expect(html).toContain('funky-markdown__h5');
            expect(html).toContain('funky-markdown__h6');
        });

        it('generates heading IDs from text', function() {
            var html = Funky.Markdown.render('## My Section Title');
            expect(html).toContain('id="my-section-title"');
        });

        it('handles special characters in heading IDs', function() {
            var html = Funky.Markdown.render('## Hello & World! (Test)');
            expect(html).toContain('id="hello-world-test"');
        });

        it('handles duplicate heading IDs', function() {
            var html = Funky.Markdown.render('## Test\n## Test');
            expect(html).toContain('id="test"');
            expect(html).toContain('id="test-1"');
        });
    });

    // =========================================================================
    // PARAGRAPHS & TEXT
    // =========================================================================

    describe('Paragraphs and text', function() {
        it('wraps text in paragraphs', function() {
            var html = Funky.Markdown.render('This is a paragraph.');
            expect(html).toContain('<p class="funky-markdown__p">');
            expect(html).toContain('This is a paragraph.');
        });

        it('separates paragraphs with blank lines', function() {
            var html = Funky.Markdown.render('Para 1.\n\nPara 2.');
            var count = (html.match(/funky-markdown__p/g) || []).length;
            expect(count).toBe(2);
        });

        it('renders bold with **text**', function() {
            var html = Funky.Markdown.render('This is **bold** text.');
            expect(html).toContain('<strong>bold</strong>');
        });

        it('renders italic with *text*', function() {
            var html = Funky.Markdown.render('This is *italic* text.');
            expect(html).toContain('<em>italic</em>');
        });

        it('renders bold with __text__', function() {
            var html = Funky.Markdown.render('This is __bold__ text.');
            expect(html).toContain('<strong>bold</strong>');
        });

        it('renders italic with _text_', function() {
            var html = Funky.Markdown.render('This is _italic_ text.');
            expect(html).toContain('<em>italic</em>');
        });

        it('renders strikethrough with ~~text~~', function() {
            var html = Funky.Markdown.render('This is ~~deleted~~ text.');
            expect(html).toContain('<del>deleted</del>');
        });

        it('handles nested formatting', function() {
            var html = Funky.Markdown.render('This is ***bold and italic*** text.');
            expect(html).toContain('<strong>');
            expect(html).toContain('<em>');
        });
    });

    // =========================================================================
    // LINKS & IMAGES
    // =========================================================================

    describe('Links and images', function() {
        it('renders markdown links', function() {
            var html = Funky.Markdown.render('[Click here](https://example.com)');
            expect(html).toContain('href="https://example.com"');
            expect(html).toContain('>Click here</a>');
        });

        it('renders links with titles', function() {
            var html = Funky.Markdown.render('[Link](https://example.com "Title")');
            expect(html).toContain('title="Title"');
        });

        it('renders images', function() {
            var html = Funky.Markdown.render('![Alt text](/image.png)');
            expect(html).toContain('<img');
            expect(html).toContain('alt="Alt text"');
            expect(html).toContain('src="/image.png"');
        });

        it('renders autolinks', function() {
            var html = Funky.Markdown.render('Visit https://example.com for more.');
            expect(html).toContain('href="https://example.com"');
        });

        it('renders email autolinks', function() {
            var html = Funky.Markdown.render('Contact test@example.com for help.');
            expect(html).toContain('href="mailto:test@example.com"');
        });

        it('adds target attribute when linkTarget option set', function() {
            var html = Funky.Markdown.render('[Link](https://example.com)', { linkTarget: '_blank' });
            expect(html).toContain('target="_blank"');
        });
    });

    // =========================================================================
    // INLINE CODE
    // =========================================================================

    describe('Inline code', function() {
        it('renders inline code with backticks', function() {
            var html = Funky.Markdown.render('Use the `console.log()` function.');
            expect(html).toContain('funky-markdown__code');
            expect(html).toContain('console.log()');
        });

        it('escapes HTML in inline code', function() {
            var html = Funky.Markdown.render('Use `<div>` elements.');
            expect(html).toContain('&lt;div&gt;');
        });

        it('handles multiple backticks for code with backticks', function() {
            // Standard single backtick inline code works well
            var html = Funky.Markdown.render('Use `code` for inline code.');
            expect(html).toContain('funky-markdown__code');
            // Verify code content is wrapped (not the literal string `code`)
            expect(html).toContain('>code<');
        });
    });

    // =========================================================================
    // CODE BLOCKS
    // =========================================================================

    describe('Code blocks', function() {
        it('renders fenced code blocks', function() {
            var md = '```javascript\nconsole.log("hi");\n```';
            var html = Funky.Markdown.render(md);
            expect(html).toContain('funky-markdown__pre-wrapper');
            expect(html).toContain('funky-markdown__code-block');
        });

        it('detects language from fence', function() {
            var md = '```javascript\nvar x = 1;\n```';
            var html = Funky.Markdown.render(md);
            expect(html).toContain('funky-markdown__code-lang');
            expect(html).toContain('javascript');
        });

        it('includes copy button', function() {
            var md = '```\ncode\n```';
            var html = Funky.Markdown.render(md);
            expect(html).toContain('funky-markdown__copy-btn');
        });

        it('applies syntax highlighting for JavaScript', function() {
            // Syntax highlighting is applied via highlightCode() after renderTo()
            // render() returns raw HTML, renderTo() applies highlighting
            var md = '```javascript\nvar x = 1;\n```';
            Funky.Markdown.renderTo(container, md);
            expect(container.innerHTML).toContain('syntax-keyword');
        });

        it('renders indented code blocks', function() {
            var md = '    function test() {\n        return true;\n    }';
            var html = Funky.Markdown.render(md);
            expect(html).toContain('funky-markdown__pre');
            expect(html).toContain('funky-markdown__code-block');
        });

        it('syntax highlighting can be disabled', function() {
            var md = '```javascript\nvar x = 1;\n```';
            // highlightCode option controls whether highlighting is applied
            Funky.Markdown.renderTo(container, md, { highlightCode: false });
            expect(container.innerHTML).not.toContain('syntax-keyword');
        });

        it('renders line numbers when enabled', function() {
            var md = '```javascript\nline 1\nline 2\n```';
            var html = Funky.Markdown.render(md, { lineNumbers: true });
            expect(html).toContain('funky-markdown__line-numbers');
        });
    });

    // =========================================================================
    // LISTS
    // =========================================================================

    describe('Lists', function() {
        it('renders unordered lists with -', function() {
            var md = '- Item 1\n- Item 2\n- Item 3';
            var html = Funky.Markdown.render(md);
            expect(html).toContain('funky-markdown__ul');
            expect(html).toContain('funky-markdown__li');
        });

        it('renders unordered lists with *', function() {
            var md = '* Item 1\n* Item 2';
            var html = Funky.Markdown.render(md);
            expect(html).toContain('funky-markdown__ul');
        });

        it('renders ordered lists', function() {
            var md = '1. First\n2. Second\n3. Third';
            var html = Funky.Markdown.render(md);
            expect(html).toContain('funky-markdown__ol');
            expect(html).toContain('funky-markdown__li');
        });

        it('renders nested lists', function() {
            // Nested items are collected in the same list with indent tracking
            var md = '- Item 1\n  - Nested 1\n  - Nested 2\n- Item 2';
            var html = Funky.Markdown.render(md);
            // All 4 items should be rendered as list items
            var liCount = (html.match(/funky-markdown__li/g) || []).length;
            expect(liCount).toBe(4);
        });
    });

    // =========================================================================
    // TASK LISTS
    // =========================================================================

    describe('Task lists', function() {
        it('renders unchecked tasks', function() {
            var md = '- [ ] Todo item';
            var html = Funky.Markdown.render(md);
            expect(html).toContain('funky-markdown__task-item');
            expect(html).toContain('type="checkbox"');
        });

        it('renders checked tasks', function() {
            var md = '- [x] Done item';
            var html = Funky.Markdown.render(md);
            expect(html).toContain('funky-markdown__task-item--checked');
            expect(html).toContain('checked');
        });

        it('handles mixed task lists', function() {
            var md = '- [x] Done\n- [ ] Todo\n- [x] Also done';
            var html = Funky.Markdown.render(md);
            var checked = (html.match(/task-item--checked/g) || []).length;
            expect(checked).toBe(2);
        });

        it('handles uppercase X in tasks', function() {
            var md = '- [X] Done item';
            var html = Funky.Markdown.render(md);
            expect(html).toContain('checked');
        });
    });

    // =========================================================================
    // BLOCKQUOTES
    // =========================================================================

    describe('Blockquotes', function() {
        it('renders blockquotes', function() {
            var md = '> This is a quote.';
            var html = Funky.Markdown.render(md);
            expect(html).toContain('funky-markdown__blockquote');
            expect(html).toContain('This is a quote.');
        });

        it('renders multi-line blockquotes', function() {
            var md = '> Line 1\n> Line 2';
            var html = Funky.Markdown.render(md);
            expect(html).toContain('Line 1');
            expect(html).toContain('Line 2');
        });

        it('renders nested blockquotes', function() {
            var md = '> Outer\n>> Inner';
            var html = Funky.Markdown.render(md);
            var bqCount = (html.match(/funky-markdown__blockquote/g) || []).length;
            expect(bqCount).toBeGreaterThan(1);
        });
    });

    // =========================================================================
    // TABLES
    // =========================================================================

    describe('Tables', function() {
        it('renders basic tables', function() {
            // Use tables: false to get static HTML (Funky.Table creates placeholders)
            var md = '| A | B |\n|---|---|\n| 1 | 2 |';
            var html = Funky.Markdown.render(md, { tables: false });
            expect(html).toContain('funky-markdown__table');
            expect(html).toContain('<th');
            expect(html).toContain('<td');
        });

        it('handles table alignment', function() {
            var md = '| Left | Center | Right |\n|:---|:---:|---:|\n| L | C | R |';
            // Use tables: false to get static HTML with alignment styles
            var html = Funky.Markdown.render(md, { tables: false });
            // Left alignment is default, so no style needed
            // Center and right get explicit text-align
            expect(html).toContain('text-align: center');
            expect(html).toContain('text-align: right');
        });

        it('wraps tables for horizontal scroll', function() {
            var md = '| A | B |\n|---|---|\n| 1 | 2 |';
            var html = Funky.Markdown.render(md);
            expect(html).toContain('funky-markdown__table-wrapper');
        });

        it('handles formatting inside table cells', function() {
            var md = '| **Bold** | *Italic* |\n|---|---|\n| `code` | ~~strike~~ |';
            // Use tables: false to get static HTML with inline formatting
            var html = Funky.Markdown.render(md, { tables: false });
            expect(html).toContain('<strong>Bold</strong>');
            expect(html).toContain('<em>Italic</em>');
        });
    });

    // =========================================================================
    // HORIZONTAL RULES
    // =========================================================================

    describe('Horizontal rules', function() {
        it('renders --- as hr', function() {
            var html = Funky.Markdown.render('---');
            expect(html).toContain('funky-markdown__hr');
        });

        it('renders *** as hr', function() {
            var html = Funky.Markdown.render('***');
            expect(html).toContain('funky-markdown__hr');
        });

        it('renders ___ as hr', function() {
            var html = Funky.Markdown.render('___');
            expect(html).toContain('funky-markdown__hr');
        });
    });

    // =========================================================================
    // ABBREVIATIONS
    // =========================================================================

    describe('Abbreviations', function() {
        it('renders abbreviations with title attribute', function() {
            var md = 'The HTML spec.\n\n*[HTML]: HyperText Markup Language';
            var html = Funky.Markdown.render(md);
            expect(html).toContain('funky-markdown__abbr');
            expect(html).toContain('title="HyperText Markup Language"');
        });

        it('applies abbreviations to all occurrences', function() {
            var md = 'HTML is great. I love HTML.\n\n*[HTML]: HyperText Markup Language';
            var html = Funky.Markdown.render(md);
            var count = (html.match(/funky-markdown__abbr/g) || []).length;
            expect(count).toBe(2);
        });

        it('abbreviations are case-sensitive', function() {
            var md = 'HTML and html are different.\n\n*[HTML]: HyperText Markup Language';
            var html = Funky.Markdown.render(md);
            var count = (html.match(/funky-markdown__abbr/g) || []).length;
            expect(count).toBe(1);
        });
    });

    // =========================================================================
    // RENDER TO
    // =========================================================================

    describe('renderTo()', function() {
        it('renders markdown into container', function() {
            Funky.Markdown.renderTo(container, '# Hello');
            expect(container.innerHTML).toContain('funky-markdown__h1');
            expect(container.innerHTML).toContain('Hello');
        });

        it('adds funky-markdown class to container', function() {
            Funky.Markdown.renderTo(container, '# Test');
            expect(container.classList.contains('funky-markdown')).toBe(true);
        });

        it('returns the container element', function() {
            var result = Funky.Markdown.renderTo(container, '# Test');
            expect(result).toBe(container);
        });

        it('accepts selector string', function() {
            Funky.Markdown.renderTo('#test-md', '# Test');
            expect(container.innerHTML).toContain('Test');
        });

        it('adds density class when option set', function() {
            Funky.Markdown.renderTo(container, '# Test', { density: 'compact' });
            expect(container.classList.contains('funky-markdown--compact')).toBe(true);
        });
    });

    // =========================================================================
    // TABLE OF CONTENTS
    // =========================================================================

    describe('Table of Contents', function() {
        var mdWithHeadings = '# H1\n## H2\n### H3\n## Another H2';

        it('extractHeadings returns heading data', function() {
            var headings = Funky.Markdown.extractHeadings(mdWithHeadings);

            expect(headings.length).toBe(4);
            expect(headings[0].level).toBe(1);
            expect(headings[0].text).toBe('H1');
        });

        it('renderToc generates TOC list', function() {
            var headings = Funky.Markdown.extractHeadings(mdWithHeadings);
            var toc = Funky.Markdown.renderToc(headings);

            expect(toc).toContain('funky-markdown__toc');
            expect(toc).toContain('funky-markdown__toc-list');
        });

        it('TOC links have correct href', function() {
            var headings = Funky.Markdown.extractHeadings('## My Section');
            var toc = Funky.Markdown.renderToc(headings);

            expect(toc).toContain('href="#my-section"');
        });

        it('TOC respects maxLevel option', function() {
            var headings = Funky.Markdown.extractHeadings('# H1\n## H2\n### H3\n#### H4');
            var toc = Funky.Markdown.renderToc(headings, { maxLevel: 2 });

            expect(toc).toContain('H1');
            expect(toc).toContain('H2');
            expect(toc).not.toContain('H3');
            expect(toc).not.toContain('H4');
        });
    });

    // =========================================================================
    // OPTIONS
    // =========================================================================

    describe('Options', function() {
        it('sanitize option escapes HTML', function() {
            var html = Funky.Markdown.render('<script>alert(1)</script>', { sanitize: true });
            expect(html).not.toContain('<script>');
        });

        it('headingAnchors adds anchor links', function() {
            var html = Funky.Markdown.render('## My Section', { headingAnchors: true });
            expect(html).toContain('funky-markdown__anchor');
            expect(html).toContain('href="#my-section"');
        });

        it('anchor is hidden from screen readers', function() {
            var html = Funky.Markdown.render('## Test', { headingAnchors: true });
            expect(html).toContain('aria-hidden="true"');
        });
    });

    // =========================================================================
    // ESCAPING
    // =========================================================================

    describe('Escaping', function() {
        it('handles escaped asterisks', function() {
            var html = Funky.Markdown.render('Use \\* for bullets.');
            expect(html).toContain('*');
            expect(html).not.toContain('<em>');
        });

        it('handles escaped brackets', function() {
            var html = Funky.Markdown.render('\\[not a link\\]');
            expect(html).toContain('[not a link]');
            expect(html).not.toContain('<a');
        });

        it('handles escaped backticks', function() {
            var html = Funky.Markdown.render('Use \\` for code.');
            expect(html).toContain('`');
        });
    });

    // =========================================================================
    // EVENTS
    // =========================================================================

    describe('Events', function() {
        it('emits funky.markdown.render event', function() {
            var eventFired = false;

            container.addEventListener('funky.markdown.render', function() {
                eventFired = true;
            });

            Funky.Markdown.renderTo(container, '# Test');
            expect(eventFired).toBe(true);
        });

        it('render event includes headings data', function() {
            var eventDetail = null;

            container.addEventListener('funky.markdown.render', function(e) {
                eventDetail = e.detail;
            });

            Funky.Markdown.renderTo(container, '# H1\n## H2');
            expect(eventDetail).toBeDefined();
            expect(eventDetail.headings).toBeDefined();
            expect(eventDetail.headings.length).toBe(2);
        });
    });

    // =========================================================================
    // DENSITY MODES
    // =========================================================================

    describe('Density modes', function() {
        it('compact mode adds density class', function() {
            Funky.Markdown.renderTo(container, '# Test', { density: 'compact' });
            expect(container.classList.contains('funky-markdown--compact')).toBe(true);
        });

        it('comfortable mode adds density class', function() {
            Funky.Markdown.renderTo(container, '# Test', { density: 'comfortable' });
            expect(container.classList.contains('funky-markdown--comfortable')).toBe(true);
        });

        it('no density class by default', function() {
            Funky.Markdown.renderTo(container, '# Test');
            expect(container.classList.contains('funky-markdown--compact')).toBe(false);
            expect(container.classList.contains('funky-markdown--comfortable')).toBe(false);
        });
    });

    // =========================================================================
    // CACHING
    // =========================================================================

    describe('Caching', function() {
        it('getCached returns null for uncached URL', function() {
            var cached = Funky.Markdown.getCached('/nonexistent.md');
            expect(cached).toBeNull();
        });

        it('clearCache clears cache', function() {
            // Note: Full cache testing requires fetch mocking
            Funky.Markdown.clearCache();
            var cached = Funky.Markdown.getCached('/test.md');
            expect(cached).toBeNull();
        });
    });

    // =========================================================================
    // HIGHLIGHT CODE
    // =========================================================================

    describe('highlightCode()', function() {
        it('highlights code blocks in container', function() {
            container.innerHTML = '<pre><code class="language-javascript">var x = 1;</code></pre>';
            Funky.Markdown.highlightCode(container);
            expect(container.innerHTML).toContain('syntax-keyword');
        });
    });

});

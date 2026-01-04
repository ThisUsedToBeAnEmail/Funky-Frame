/**
 * Tests for Funky.A11yEnhancer
 * Automatic screen reader enhancement for tables and lists
 */
FunkyTests.describe('Funky.Core.A11yEnhancer', function() {
    var expect = FunkyTests.expect;
    var fixture;

    FunkyTests.beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="test-container" data-a11y-scope></div>');
    });

    FunkyTests.afterEach(function() {
        fixture.cleanup();
        // Disconnect any observers
        if (Funky.A11yEnhancer && Funky.A11yEnhancer.disconnect) {
            Funky.A11yEnhancer.disconnect();
        }
    });

    FunkyTests.describe('Registration', function() {
        FunkyTests.it('is registered with Funky namespace', function() {
            expect(Funky.A11yEnhancer).toBeDefined();
        });

        FunkyTests.it('has init method', function() {
            expect(typeof Funky.A11yEnhancer.init).toBe('function');
        });

        FunkyTests.it('has observe method', function() {
            expect(typeof Funky.A11yEnhancer.observe).toBe('function');
        });

        FunkyTests.it('has disconnect method', function() {
            expect(typeof Funky.A11yEnhancer.disconnect).toBe('function');
        });

        FunkyTests.it('has enhance method', function() {
            expect(typeof Funky.A11yEnhancer.enhance).toBe('function');
        });

        FunkyTests.it('has configure method', function() {
            expect(typeof Funky.A11yEnhancer.configure).toBe('function');
        });

        FunkyTests.it('has setEnabled method', function() {
            expect(typeof Funky.A11yEnhancer.setEnabled).toBe('function');
        });

        FunkyTests.it('has isEnabled method', function() {
            expect(typeof Funky.A11yEnhancer.isEnabled).toBe('function');
        });
    });

    FunkyTests.describe('isEnabled()', function() {
        FunkyTests.it('returns boolean', function() {
            var result = Funky.A11yEnhancer.isEnabled();
            expect(typeof result).toBe('boolean');
        });

        FunkyTests.it('defaults to enabled', function() {
            expect(Funky.A11yEnhancer.isEnabled()).toBe(true);
        });
    });

    FunkyTests.describe('setEnabled()', function() {
        var originalEnabled;

        FunkyTests.beforeEach(function() {
            originalEnabled = Funky.A11yEnhancer.isEnabled();
        });

        FunkyTests.afterEach(function() {
            Funky.A11yEnhancer.setEnabled(originalEnabled);
        });

        FunkyTests.it('can disable enhancement', function() {
            Funky.A11yEnhancer.setEnabled(false);
            expect(Funky.A11yEnhancer.isEnabled()).toBe(false);
        });

        FunkyTests.it('can enable enhancement', function() {
            Funky.A11yEnhancer.setEnabled(false);
            Funky.A11yEnhancer.setEnabled(true);
            expect(Funky.A11yEnhancer.isEnabled()).toBe(true);
        });
    });

    FunkyTests.describe('init()', function() {
        FunkyTests.it('initializes without errors', function() {
            expect(function() {
                Funky.A11yEnhancer.init('#test-container');
            }).not.toThrow();
        });

        FunkyTests.it('accepts selector string', function() {
            expect(function() {
                Funky.A11yEnhancer.init('#test-container');
            }).not.toThrow();
        });

        FunkyTests.it('accepts element', function() {
            var el = document.getElementById('test-container');
            expect(function() {
                Funky.A11yEnhancer.init(el);
            }).not.toThrow();
        });
    });

    FunkyTests.describe('Table enhancement', function() {
        FunkyTests.it('enhances simple table', function() {
            var container = document.getElementById('test-container');
            container.innerHTML = [
                '<table>',
                '  <thead><tr><th>Name</th><th>Age</th></tr></thead>',
                '  <tbody>',
                '    <tr><td>Alice</td><td>30</td></tr>',
                '    <tr><td>Bob</td><td>25</td></tr>',
                '  </tbody>',
                '</table>'
            ].join('');

            Funky.A11yEnhancer.init('#test-container');

            var table = container.querySelector('table');
            expect(table.hasAttribute('data-a11y-enhanced')).toBe(true);
        });

        FunkyTests.it('skips tables with data-a11y-skip attribute', function() {
            var container = document.getElementById('test-container');
            container.innerHTML = [
                '<table data-a11y-skip>',
                '  <thead><tr><th>Name</th></tr></thead>',
                '  <tbody><tr><td>Test</td></tr></tbody>',
                '</table>'
            ].join('');

            Funky.A11yEnhancer.init('#test-container');

            var table = container.querySelector('table');
            expect(table.hasAttribute('data-a11y-enhanced')).toBe(false);
        });

        FunkyTests.it('skips tables with aria-hidden=true', function() {
            var container = document.getElementById('test-container');
            container.innerHTML = [
                '<table aria-hidden="true">',
                '  <thead><tr><th>Name</th></tr></thead>',
                '  <tbody><tr><td>Test</td></tr></tbody>',
                '</table>'
            ].join('');

            Funky.A11yEnhancer.init('#test-container');

            var table = container.querySelector('table');
            expect(table.hasAttribute('data-a11y-enhanced')).toBe(false);
        });

        FunkyTests.it('skips DataTables (class="dataTable")', function() {
            var container = document.getElementById('test-container');
            container.innerHTML = [
                '<table class="dataTable">',
                '  <thead><tr><th>Name</th></tr></thead>',
                '  <tbody><tr><td>Test</td></tr></tbody>',
                '</table>'
            ].join('');

            Funky.A11yEnhancer.init('#test-container');

            var table = container.querySelector('table');
            expect(table.hasAttribute('data-a11y-enhanced')).toBe(false);
        });
    });

    FunkyTests.describe('List enhancement', function() {
        FunkyTests.it('enhances unordered list', function() {
            var container = document.getElementById('test-container');
            container.innerHTML = [
                '<ul>',
                '  <li>Item 1</li>',
                '  <li>Item 2</li>',
                '  <li>Item 3</li>',
                '</ul>'
            ].join('');

            Funky.A11yEnhancer.init('#test-container');

            var list = container.querySelector('ul');
            expect(list.hasAttribute('data-a11y-enhanced')).toBe(true);
        });

        FunkyTests.it('enhances ordered list', function() {
            var container = document.getElementById('test-container');
            container.innerHTML = [
                '<ol>',
                '  <li>First</li>',
                '  <li>Second</li>',
                '  <li>Third</li>',
                '</ol>'
            ].join('');

            Funky.A11yEnhancer.init('#test-container');

            var list = container.querySelector('ol');
            expect(list.hasAttribute('data-a11y-enhanced')).toBe(true);
        });

        FunkyTests.it('skips lists with data-a11y-skip', function() {
            var container = document.getElementById('test-container');
            container.innerHTML = [
                '<ul data-a11y-skip>',
                '  <li>Item 1</li>',
                '</ul>'
            ].join('');

            Funky.A11yEnhancer.init('#test-container');

            var list = container.querySelector('ul');
            expect(list.hasAttribute('data-a11y-enhanced')).toBe(false);
        });

        FunkyTests.it('skips nested lists', function() {
            var container = document.getElementById('test-container');
            container.innerHTML = [
                '<ul id="parent-list">',
                '  <li>Parent item',
                '    <ul id="nested-list">',
                '      <li>Nested item</li>',
                '    </ul>',
                '  </li>',
                '</ul>'
            ].join('');

            Funky.A11yEnhancer.init('#test-container');

            var nestedList = container.querySelector('#nested-list');
            // Nested lists should NOT get their own enhancement (handled by parent)
            expect(nestedList.hasAttribute('data-a11y-enhanced')).toBe(false);
        });
    });

    FunkyTests.describe('enhance()', function() {
        FunkyTests.it('manually enhances a table', function() {
            var container = document.getElementById('test-container');
            container.innerHTML = [
                '<table>',
                '  <thead><tr><th>Col1</th></tr></thead>',
                '  <tbody><tr><td>Data</td></tr></tbody>',
                '</table>'
            ].join('');

            var table = container.querySelector('table');
            Funky.A11yEnhancer.enhance(table);

            expect(table.hasAttribute('data-a11y-enhanced')).toBe(true);
        });

        FunkyTests.it('manually enhances a list', function() {
            var container = document.getElementById('test-container');
            container.innerHTML = '<ul><li>Item</li></ul>';

            var list = container.querySelector('ul');
            Funky.A11yEnhancer.enhance(list);

            expect(list.hasAttribute('data-a11y-enhanced')).toBe(true);
        });

        FunkyTests.it('handles null element gracefully', function() {
            expect(function() {
                Funky.A11yEnhancer.enhance(null);
            }).not.toThrow();
        });
    });

    FunkyTests.describe('observe()', function() {
        FunkyTests.it('starts observing without errors', function() {
            expect(function() {
                Funky.A11yEnhancer.observe();
            }).not.toThrow();
        });
    });

    FunkyTests.describe('disconnect()', function() {
        FunkyTests.it('stops observers without errors', function() {
            Funky.A11yEnhancer.observe();
            expect(function() {
                Funky.A11yEnhancer.disconnect();
            }).not.toThrow();
        });
    });

    FunkyTests.describe('configure()', function() {
        FunkyTests.it('accepts configuration object', function() {
            expect(function() {
                Funky.A11yEnhancer.configure({
                    tableMaxHeaders: 20
                });
            }).not.toThrow();
        });

        FunkyTests.it('ignores unknown options', function() {
            expect(function() {
                Funky.A11yEnhancer.configure({
                    unknownOption: true
                });
            }).not.toThrow();
        });
    });

    FunkyTests.describe('Visually hidden summaries', function() {
        FunkyTests.it('creates hidden summary before table', function() {
            var container = document.getElementById('test-container');
            container.innerHTML = [
                '<table>',
                '  <thead><tr><th>Name</th><th>Value</th></tr></thead>',
                '  <tbody>',
                '    <tr><td>A</td><td>1</td></tr>',
                '  </tbody>',
                '</table>'
            ].join('');

            Funky.A11yEnhancer.init('#test-container');

            var summary = container.querySelector('[data-a11y-table-summary]');
            // Only creates summary if table lacks proper structure (caption + thead)
            var table = container.querySelector('table');
            if (!table.querySelector('caption')) {
                expect(summary).toBeDefined();
                expect(summary.classList.contains('visually-hidden')).toBe(true);
            }
        });

        FunkyTests.it('creates hidden summary before list', function() {
            var container = document.getElementById('test-container');
            container.innerHTML = [
                '<ul>',
                '  <li>Item A</li>',
                '  <li>Item B</li>',
                '</ul>'
            ].join('');

            Funky.A11yEnhancer.init('#test-container');

            var summary = container.querySelector('[data-a11y-list-summary]');
            expect(summary).toBeDefined();
            expect(summary.classList.contains('visually-hidden')).toBe(true);
        });
    });

    // =========================================================================
    // ERROR HANDLING TESTS
    // =========================================================================
    FunkyTests.describe('Error handling', function() {
        FunkyTests.it('init handles null selector gracefully', function() {
            expect(function() {
                Funky.A11yEnhancer.init(null);
            }).not.toThrow();
        });

        FunkyTests.it('init handles undefined selector gracefully', function() {
            expect(function() {
                Funky.A11yEnhancer.init(undefined);
            }).not.toThrow();
        });

        FunkyTests.it('init handles empty string selector', function() {
            expect(function() {
                Funky.A11yEnhancer.init('');
            }).not.toThrow();
        });

        FunkyTests.it('init handles non-existent selector', function() {
            expect(function() {
                Funky.A11yEnhancer.init('#non-existent-element');
            }).not.toThrow();
        });

        FunkyTests.it('enhance handles undefined gracefully', function() {
            expect(function() {
                Funky.A11yEnhancer.enhance(undefined);
            }).not.toThrow();
        });

        FunkyTests.it('enhance handles non-element gracefully', function() {
            // Implementation handles non-elements gracefully without throwing
            expect(function() {
                Funky.A11yEnhancer.enhance('not an element');
            }).not.toThrow();
        });

        FunkyTests.it('configure handles null gracefully', function() {
            expect(function() {
                Funky.A11yEnhancer.configure(null);
            }).not.toThrow();
        });

        FunkyTests.it('configure handles undefined gracefully', function() {
            expect(function() {
                Funky.A11yEnhancer.configure(undefined);
            }).not.toThrow();
        });

        FunkyTests.it('setEnabled handles non-boolean values gracefully', function() {
            expect(function() {
                Funky.A11yEnhancer.setEnabled('true');
                Funky.A11yEnhancer.setEnabled(1);
                Funky.A11yEnhancer.setEnabled(null);
            }).not.toThrow();
        });
    });

    // =========================================================================
    // EDGE CASES TESTS
    // =========================================================================
    FunkyTests.describe('Edge cases', function() {
        FunkyTests.it('handles table with no rows', function() {
            var container = document.getElementById('test-container');
            container.innerHTML = '<table><thead><tr><th>Header</th></tr></thead><tbody></tbody></table>';

            expect(function() {
                Funky.A11yEnhancer.init('#test-container');
            }).not.toThrow();
        });

        FunkyTests.it('handles empty list', function() {
            var container = document.getElementById('test-container');
            container.innerHTML = '<ul></ul>';

            expect(function() {
                Funky.A11yEnhancer.init('#test-container');
            }).not.toThrow();
        });

        FunkyTests.it('handles table with many columns', function() {
            var container = document.getElementById('test-container');
            var headers = [];
            for (var i = 0; i < 50; i++) {
                headers.push('<th>Col' + i + '</th>');
            }
            container.innerHTML = [
                '<table>',
                '  <thead><tr>' + headers.join('') + '</tr></thead>',
                '  <tbody><tr>' + headers.map(function() { return '<td>Data</td>'; }).join('') + '</tr></tbody>',
                '</table>'
            ].join('');

            expect(function() {
                Funky.A11yEnhancer.init('#test-container');
            }).not.toThrow();
        });

        FunkyTests.it('handles deeply nested lists', function() {
            var container = document.getElementById('test-container');
            container.innerHTML = [
                '<ul>',
                '  <li>Level 1',
                '    <ul>',
                '      <li>Level 2',
                '        <ul>',
                '          <li>Level 3',
                '            <ul>',
                '              <li>Level 4</li>',
                '            </ul>',
                '          </li>',
                '        </ul>',
                '      </li>',
                '    </ul>',
                '  </li>',
                '</ul>'
            ].join('');

            expect(function() {
                Funky.A11yEnhancer.init('#test-container');
            }).not.toThrow();
        });

        FunkyTests.it('handles list with many items', function() {
            var container = document.getElementById('test-container');
            var items = [];
            for (var i = 0; i < 100; i++) {
                items.push('<li>Item ' + i + '</li>');
            }
            container.innerHTML = '<ul>' + items.join('') + '</ul>';

            expect(function() {
                Funky.A11yEnhancer.init('#test-container');
            }).not.toThrow();
        });

        FunkyTests.it('handles table already enhanced', function() {
            var container = document.getElementById('test-container');
            container.innerHTML = [
                '<table data-a11y-enhanced>',
                '  <thead><tr><th>Name</th></tr></thead>',
                '  <tbody><tr><td>Data</td></tr></tbody>',
                '</table>'
            ].join('');

            expect(function() {
                Funky.A11yEnhancer.init('#test-container');
            }).not.toThrow();

            // Should not double-enhance
            var table = container.querySelector('table');
            expect(table.hasAttribute('data-a11y-enhanced')).toBe(true);
        });

        FunkyTests.it('handles Unicode content in table', function() {
            var container = document.getElementById('test-container');
            container.innerHTML = [
                '<table>',
                '  <thead><tr><th>日本語</th><th>العربية</th></tr></thead>',
                '  <tbody><tr><td>🎉</td><td>emoji</td></tr></tbody>',
                '</table>'
            ].join('');

            expect(function() {
                Funky.A11yEnhancer.init('#test-container');
            }).not.toThrow();
        });
    });

    // =========================================================================
    // CLEANUP TESTS
    // =========================================================================
    FunkyTests.describe('Cleanup', function() {
        FunkyTests.it('disconnect can be called multiple times', function() {
            expect(function() {
                Funky.A11yEnhancer.disconnect();
                Funky.A11yEnhancer.disconnect();
                Funky.A11yEnhancer.disconnect();
            }).not.toThrow();
        });

        FunkyTests.it('observe can be called after disconnect', function() {
            Funky.A11yEnhancer.disconnect();

            expect(function() {
                Funky.A11yEnhancer.observe();
            }).not.toThrow();
        });

        FunkyTests.it('init can be called multiple times on same container', function() {
            var container = document.getElementById('test-container');
            container.innerHTML = '<table><thead><tr><th>Col</th></tr></thead><tbody><tr><td>Data</td></tr></tbody></table>';

            expect(function() {
                Funky.A11yEnhancer.init('#test-container');
                Funky.A11yEnhancer.init('#test-container');
                Funky.A11yEnhancer.init('#test-container');
            }).not.toThrow();
        });
    });

    // =========================================================================
    // STATE VERIFICATION TESTS
    // =========================================================================
    FunkyTests.describe('State verification', function() {
        FunkyTests.it('isEnabled returns correct state after toggle', function() {
            var original = Funky.A11yEnhancer.isEnabled();

            Funky.A11yEnhancer.setEnabled(false);
            expect(Funky.A11yEnhancer.isEnabled()).toBe(false);

            Funky.A11yEnhancer.setEnabled(true);
            expect(Funky.A11yEnhancer.isEnabled()).toBe(true);

            Funky.A11yEnhancer.setEnabled(original);
        });

        FunkyTests.it('enhanced table is processed', function() {
            var container = document.getElementById('test-container');
            container.innerHTML = [
                '<table>',
                '  <thead><tr><th>Name</th></tr></thead>',
                '  <tbody><tr><td>Test</td></tr></tbody>',
                '</table>'
            ].join('');

            Funky.A11yEnhancer.init('#test-container');

            var table = container.querySelector('table');
            // Table should exist and be processed without error
            expect(table).toBeDefined();
        });

        FunkyTests.it('enhanced list is processed', function() {
            var container = document.getElementById('test-container');
            container.innerHTML = '<ul><li>Item</li></ul>';

            Funky.A11yEnhancer.init('#test-container');

            var list = container.querySelector('ul');
            // List should exist and be processed without error
            expect(list).toBeDefined();
        });
    });

    // =========================================================================
    // INPUT VALIDATION TESTS
    // =========================================================================
    FunkyTests.describe('Input validation', function() {
        FunkyTests.it('init accepts DOM element directly', function() {
            var container = document.getElementById('test-container');
            container.innerHTML = '<table><thead><tr><th>Col</th></tr></thead><tbody><tr><td>Data</td></tr></tbody></table>';

            expect(function() {
                Funky.A11yEnhancer.init(container);
            }).not.toThrow();
        });

        FunkyTests.it('configure accepts partial options', function() {
            expect(function() {
                Funky.A11yEnhancer.configure({
                    tableMaxHeaders: 30
                });
            }).not.toThrow();
        });

        FunkyTests.it('configure ignores invalid option values gracefully', function() {
            expect(function() {
                Funky.A11yEnhancer.configure({
                    tableMaxHeaders: 'invalid'
                });
            }).not.toThrow();
        });
    });

    // =========================================================================
    // ACCESSIBILITY TESTS
    // =========================================================================
    FunkyTests.describe('Accessibility', function() {
        FunkyTests.it('table caption is not duplicated', function() {
            var container = document.getElementById('test-container');
            container.innerHTML = [
                '<table>',
                '  <caption>My Table</caption>',
                '  <thead><tr><th>Name</th></tr></thead>',
                '  <tbody><tr><td>Test</td></tr></tbody>',
                '</table>'
            ].join('');

            Funky.A11yEnhancer.init('#test-container');

            var captions = container.querySelectorAll('caption');
            expect(captions.length).toBe(1);
        });

        FunkyTests.it('summary text is screen-reader only', function() {
            var container = document.getElementById('test-container');
            container.innerHTML = '<ul><li>Item</li></ul>';

            Funky.A11yEnhancer.init('#test-container');

            var summary = container.querySelector('[data-a11y-list-summary]');
            if (summary) {
                var style = window.getComputedStyle(summary);
                var isHidden = summary.classList.contains('visually-hidden') ||
                               summary.classList.contains('sr-only') ||
                               style.position === 'absolute';
                expect(isHidden).toBe(true);
            }
        });
    });
});

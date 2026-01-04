/**
 * Funky.Diff Tests
 *
 * Tests for the visual diff viewer component that compares
 * text, JSON, and audit trail changes.
 */

describe('Funky.Component.Diff', function() {

    var Diff;
    var fixture;

    beforeEach(function() {
        // Get fresh reference - module may load after test file
        Diff = Funky.Diff;

        fixture = FunkyTests.fixture('<div id="diff-container"></div>');
    });

    afterEach(function() {
        if (fixture) {
            fixture.destroy();
        }
    });

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('Diff')).toBe(true);
        });

        it('has compute method', function() {
            expect(typeof Diff.compute).toBe('function');
        });

        it('has computeJson method', function() {
            expect(typeof Diff.computeJson).toBe('function');
        });

        it('has show method', function() {
            expect(typeof Diff.show).toBe('function');
        });

        it('has json method', function() {
            expect(typeof Diff.json).toBe('function');
        });

        it('has audit method', function() {
            expect(typeof Diff.audit).toBe('function');
        });

        it('has getSummary method', function() {
            expect(typeof Diff.getSummary).toBe('function');
        });

        it('exposes DiffType constants', function() {
            expect(Diff.DiffType).toBeDefined();
            expect(Diff.DiffType.EQUAL).toBe('equal');
            expect(Diff.DiffType.ADD).toBe('add');
            expect(Diff.DiffType.REMOVE).toBe('remove');
            expect(Diff.DiffType.CHANGE).toBe('change');
        });

        it('exposes Engine', function() {
            expect(Diff.Engine).toBeDefined();
            expect(typeof Diff.Engine.diff).toBe('function');
        });

    });

    describe('compute() - Text Diff', function() {

        it('returns empty array for identical text', function() {
            var result = Diff.compute('hello', 'hello');
            var changes = result.filter(function(r) { return r.type !== 'equal'; });

            expect(changes.length).toBe(0);
        });

        it('detects added lines', function() {
            var result = Diff.compute('line1', 'line1\nline2');
            var additions = result.filter(function(r) { return r.type === 'add'; });

            expect(additions.length).toBe(1);
            expect(additions[0].right).toBe('line2');
        });

        it('detects removed lines', function() {
            var result = Diff.compute('line1\nline2', 'line1');
            var removals = result.filter(function(r) { return r.type === 'remove'; });

            expect(removals.length).toBe(1);
            expect(removals[0].left).toBe('line2');
        });

        it('detects changed lines', function() {
            var result = Diff.compute('hello', 'goodbye');
            var changes = result.filter(function(r) { return r.type === 'change'; });

            expect(changes.length).toBe(1);
            expect(changes[0].left).toBe('hello');
            expect(changes[0].right).toBe('goodbye');
        });

        it('handles empty left string', function() {
            var result = Diff.compute('', 'new line');
            // When left is empty string, the algorithm sees [''] vs ['new line']
            // This results in a change operation (empty -> new line)
            var changes = result.filter(function(r) { return r.type !== 'equal'; });

            expect(changes.length).toBeGreaterThan(0);
        });

        it('handles empty right string', function() {
            var result = Diff.compute('old line', '');
            // When right is empty string, the algorithm sees ['old line'] vs ['']
            // This results in a change operation (old line -> empty)
            var changes = result.filter(function(r) { return r.type !== 'equal'; });

            expect(changes.length).toBeGreaterThan(0);
        });

        it('handles multi-line changes', function() {
            var left = 'line1\nline2\nline3';
            var right = 'line1\nmodified\nline3';

            var result = Diff.compute(left, right);
            var changes = result.filter(function(r) { return r.type === 'change'; });

            expect(changes.length).toBe(1);
        });

        it('includes line numbers', function() {
            var result = Diff.compute('line1\nline2', 'line1\nline2');

            expect(result[0].leftLine).toBe(1);
            expect(result[1].leftLine).toBe(2);
        });

    });

    describe('computeJson() - JSON Diff', function() {

        it('returns equal for identical objects', function() {
            var left = { a: 1, b: 2 };
            var right = { a: 1, b: 2 };

            var result = Diff.computeJson(left, right);
            var changes = result.filter(function(r) { return r.type !== 'equal'; });

            expect(changes.length).toBe(0);
        });

        it('detects added properties', function() {
            var left = { a: 1 };
            var right = { a: 1, b: 2 };

            var result = Diff.computeJson(left, right);
            var additions = result.filter(function(r) { return r.type === 'add'; });

            expect(additions.length).toBe(1);
            expect(additions[0].path).toBe('b');
        });

        it('detects removed properties', function() {
            var left = { a: 1, b: 2 };
            var right = { a: 1 };

            var result = Diff.computeJson(left, right);
            var removals = result.filter(function(r) { return r.type === 'remove'; });

            expect(removals.length).toBe(1);
            expect(removals[0].path).toBe('b');
        });

        it('detects changed values', function() {
            var left = { a: 1 };
            var right = { a: 2 };

            var result = Diff.computeJson(left, right);
            var changes = result.filter(function(r) { return r.type === 'change'; });

            expect(changes.length).toBe(1);
            expect(changes[0].left).toBe(1);
            expect(changes[0].right).toBe(2);
        });

        it('handles nested objects', function() {
            var left = { nested: { a: 1 } };
            var right = { nested: { a: 2 } };

            var result = Diff.computeJson(left, right);
            var changes = result.filter(function(r) { return r.type === 'change'; });

            expect(changes.length).toBe(1);
            expect(changes[0].path).toBe('nested.a');
        });

        it('handles arrays', function() {
            var left = { arr: [1, 2, 3] };
            var right = { arr: [1, 2, 4] };

            var result = Diff.computeJson(left, right);
            var changes = result.filter(function(r) { return r.type === 'change'; });

            expect(changes.length).toBe(1);
        });

        it('handles null values', function() {
            var left = { a: null };
            var right = { a: 1 };

            var result = Diff.computeJson(left, right);
            var changes = result.filter(function(r) { return r.type !== 'equal'; });

            expect(changes.length).toBe(1);
        });

        it('handles type changes', function() {
            var left = { a: '1' };
            var right = { a: 1 };

            var result = Diff.computeJson(left, right);
            var changes = result.filter(function(r) { return r.type === 'change'; });

            expect(changes.length).toBe(1);
        });

    });

    describe('getSummary()', function() {

        it('returns summary object', function() {
            var diff = Diff.compute('a\nb\nc', 'a\nmodified\nc\nd');
            var summary = Diff.getSummary(diff);

            expect(summary).toBeDefined();
            expect(typeof summary.added).toBe('number');
            expect(typeof summary.removed).toBe('number');
            expect(typeof summary.changed).toBe('number');
            expect(typeof summary.equal).toBe('number');
        });

        it('counts additions correctly', function() {
            var diff = Diff.compute('a', 'a\nb\nc');
            var summary = Diff.getSummary(diff);

            expect(summary.added).toBe(2);
        });

        it('counts removals correctly', function() {
            var diff = Diff.compute('a\nb\nc', 'a');
            var summary = Diff.getSummary(diff);

            expect(summary.removed).toBe(2);
        });

        it('counts changes correctly', function() {
            var diff = Diff.compute('old', 'new');
            var summary = Diff.getSummary(diff);

            expect(summary.changed).toBe(1);
        });

        it('includes total', function() {
            var diff = Diff.compute('a\nb', 'a\nc');
            var summary = Diff.getSummary(diff);

            expect(summary.total).toBe(diff.length);
        });

    });

    describe('show() - Text Diff UI', function() {

        it('renders diff in container', function() {
            Diff.show('#diff-container', {
                left: 'hello',
                right: 'world'
            });

            var container = document.getElementById('diff-container');
            expect(container.innerHTML).not.toBe('');
        });

        it('creates funky-diff element', function() {
            Diff.show('#diff-container', {
                left: 'hello',
                right: 'hello'
            });

            var diffEl = document.querySelector('.funky-diff');
            expect(diffEl).not.toBeNull();
        });

        it('renders side-by-side by default', function() {
            Diff.show('#diff-container', {
                left: 'a',
                right: 'b'
            });

            var diffEl = document.querySelector('.funky-diff-side-by-side');
            expect(diffEl).not.toBeNull();
        });

        it('renders inline mode when specified', function() {
            Diff.show('#diff-container', {
                left: 'a',
                right: 'b',
                mode: 'inline'
            });

            var diffEl = document.querySelector('.funky-diff-inline');
            expect(diffEl).not.toBeNull();
        });

        it('renders split mode', function() {
            Diff.show('#diff-container', {
                left: 'a',
                right: 'b',
                mode: 'split'
            });

            var diffEl = document.querySelector('.funky-diff-split');
            expect(diffEl).not.toBeNull();
        });

        it('renders headers', function() {
            Diff.show('#diff-container', {
                left: 'a',
                right: 'b',
                headers: {
                    left: 'Original',
                    right: 'Modified'
                }
            });

            var header = document.querySelector('.diff-header');
            expect(header.textContent).toContain('Original');
            expect(header.textContent).toContain('Modified');
        });

        it('renders line numbers by default', function() {
            Diff.show('#diff-container', {
                left: 'line1\nline2',
                right: 'line1\nline2',
                lineNumbers: true
            });

            var lineNumbers = document.querySelectorAll('.diff-line-number');
            expect(lineNumbers.length).toBeGreaterThan(0);
        });

        it('returns instance with diff and summary', function() {
            var instance = Diff.show('#diff-container', {
                left: 'a',
                right: 'b'
            });

            expect(instance.diff).toBeDefined();
            expect(instance.summary).toBeDefined();
            expect(instance.element).toBeDefined();
        });

        it('instance has destroy method', function() {
            var instance = Diff.show('#diff-container', {
                left: 'a',
                right: 'b'
            });

            expect(typeof instance.destroy).toBe('function');
        });

        it('instance has refresh method', function() {
            var instance = Diff.show('#diff-container', {
                left: 'a',
                right: 'b'
            });

            expect(typeof instance.refresh).toBe('function');
        });

        it('returns null for missing container', function() {
            var instance = Diff.show('#non-existent', {
                left: 'a',
                right: 'b'
            });

            expect(instance).toBeNull();
        });

        it('renders diff-add class for additions', function() {
            Diff.show('#diff-container', {
                left: '',
                right: 'new line'
            });

            var addLines = document.querySelectorAll('.diff-add');
            expect(addLines.length).toBeGreaterThan(0);
        });

        it('renders diff-remove class for removals', function() {
            Diff.show('#diff-container', {
                left: 'old line',
                right: ''
            });

            var removeLines = document.querySelectorAll('.diff-remove');
            expect(removeLines.length).toBeGreaterThan(0);
        });

    });

    describe('json() - JSON Diff UI', function() {

        it('renders JSON diff in container', function() {
            Diff.json('#diff-container', {
                left: { a: 1 },
                right: { a: 2 }
            });

            var container = document.getElementById('diff-container');
            expect(container.innerHTML).not.toBe('');
        });

        it('creates funky-diff-json element', function() {
            Diff.json('#diff-container', {
                left: { a: 1 },
                right: { a: 1 }
            });

            var diffEl = document.querySelector('.funky-diff-json');
            expect(diffEl).not.toBeNull();
        });

        it('renders headers', function() {
            Diff.json('#diff-container', {
                left: {},
                right: {},
                headers: { left: 'Before', right: 'After' }
            });

            var header = document.querySelector('.diff-header');
            expect(header.textContent).toContain('Before');
            expect(header.textContent).toContain('After');
        });

        it('renders summary', function() {
            Diff.json('#diff-container', {
                left: { a: 1 },
                right: { a: 2, b: 3 }
            });

            var summary = document.querySelector('.diff-json-summary');
            expect(summary).not.toBeNull();
        });

        it('returns instance with diff and summary', function() {
            var instance = Diff.json('#diff-container', {
                left: { a: 1 },
                right: { a: 2 }
            });

            expect(instance.diff).toBeDefined();
            expect(instance.summary).toBeDefined();
            expect(instance.element).toBeDefined();
        });

        it('instance has expand/collapse methods', function() {
            var instance = Diff.json('#diff-container', {
                left: { nested: { a: 1 } },
                right: { nested: { a: 2 } }
            });

            expect(typeof instance.expand).toBe('function');
            expect(typeof instance.collapse).toBe('function');
            expect(typeof instance.expandAll).toBe('function');
            expect(typeof instance.collapseAll).toBe('function');
        });

        it('instance has destroy method', function() {
            var instance = Diff.json('#diff-container', {
                left: {},
                right: {}
            });

            expect(typeof instance.destroy).toBe('function');
        });

        it('renders JSON values with type classes', function() {
            Diff.json('#diff-container', {
                left: { str: 'hello', num: 42, bool: true },
                right: { str: 'hello', num: 42, bool: true }
            });

            var strings = document.querySelectorAll('.diff-json-string');
            var numbers = document.querySelectorAll('.diff-json-number');
            var booleans = document.querySelectorAll('.diff-json-boolean');

            expect(strings.length).toBeGreaterThan(0);
            expect(numbers.length).toBeGreaterThan(0);
            expect(booleans.length).toBeGreaterThan(0);
        });

        it('hides unchanged when showUnchanged is false', function() {
            Diff.json('#diff-container', {
                left: { a: 1, b: 2 },
                right: { a: 1, b: 3 },
                showUnchanged: false
            });

            var equalRows = document.querySelectorAll('.diff-equal');
            expect(equalRows.length).toBe(0);
        });

    });

    describe('audit() - Audit Diff UI', function() {

        it('renders audit diff in container', function() {
            Diff.audit('#diff-container', {
                before: { name: 'Old' },
                after: { name: 'New' }
            });

            var container = document.getElementById('diff-container');
            expect(container.innerHTML).not.toBe('');
        });

        it('creates funky-diff-audit element', function() {
            Diff.audit('#diff-container', {
                before: {},
                after: {}
            });

            var diffEl = document.querySelector('.funky-diff-audit');
            expect(diffEl).not.toBeNull();
        });

        it('renders action badge', function() {
            Diff.audit('#diff-container', {
                before: {},
                after: {},
                action: 'UPDATE'
            });

            var badge = document.querySelector('.diff-audit-action');
            expect(badge).not.toBeNull();
            expect(badge.textContent).toBe('UPDATE');
        });

        it('renders user info', function() {
            Diff.audit('#diff-container', {
                before: {},
                after: {},
                user: 'john.doe'
            });

            var user = document.querySelector('.diff-audit-user');
            expect(user.textContent).toContain('john.doe');
        });

        it('renders timestamp', function() {
            Diff.audit('#diff-container', {
                before: {},
                after: {},
                timestamp: '2024-01-15T10:30:00Z'
            });

            var time = document.querySelector('.diff-audit-time');
            expect(time).not.toBeNull();
        });

        it('renders changes table', function() {
            Diff.audit('#diff-container', {
                before: { name: 'Old' },
                after: { name: 'New' }
            });

            var table = document.querySelector('.diff-audit-table');
            expect(table).not.toBeNull();
        });

        it('renders field labels', function() {
            Diff.audit('#diff-container', {
                before: { user_name: 'old' },
                after: { user_name: 'new' },
                labels: { user_name: 'User Name' }
            });

            var fieldCell = document.querySelector('.diff-audit-field');
            expect(fieldCell.textContent).toBe('User Name');
        });

        it('uses formatted label when not provided', function() {
            Diff.audit('#diff-container', {
                before: { first_name: 'John' },
                after: { first_name: 'Jane' }
            });

            var fieldCell = document.querySelector('.diff-audit-field');
            expect(fieldCell.textContent).toBe('First Name');
        });

        it('returns instance with changes and summary', function() {
            var instance = Diff.audit('#diff-container', {
                before: { a: 1 },
                after: { a: 2 }
            });

            expect(instance.changes).toBeDefined();
            expect(instance.summary).toBeDefined();
        });

        it('instance has destroy method', function() {
            var instance = Diff.audit('#diff-container', {
                before: {},
                after: {}
            });

            expect(typeof instance.destroy).toBe('function');
        });

        it('hides unchanged when hideUnchanged is true', function() {
            Diff.audit('#diff-container', {
                before: { a: 1, b: 2 },
                after: { a: 1, b: 3 },
                hideUnchanged: true
            });

            var rows = document.querySelectorAll('.diff-audit-table tbody tr');
            expect(rows.length).toBe(1); // Only b changed
        });

        it('shows no changes message when appropriate', function() {
            Diff.audit('#diff-container', {
                before: { a: 1 },
                after: { a: 1 },
                hideUnchanged: true
            });

            var summary = document.querySelector('.diff-audit-summary');
            expect(summary.textContent).toContain('No changes');
        });

    });

    describe('Word-level Diff', function() {

        it('detects word changes within lines', function() {
            var result = Diff.compute('hello world', 'hello universe');
            var changes = result.filter(function(r) { return r.type === 'change'; });

            expect(changes.length).toBe(1);
            expect(changes[0].words).toBeDefined();
        });

        it('renders word diff highlights', function() {
            Diff.show('#diff-container', {
                left: 'the quick brown fox',
                right: 'the slow brown fox',
                wordDiff: true
            });

            // Check for word-level highlighting classes
            var wordAdds = document.querySelectorAll('.diff-word-add');
            var wordRemoves = document.querySelectorAll('.diff-word-remove');

            expect(wordAdds.length + wordRemoves.length).toBeGreaterThan(0);
        });

    });

    describe('Engine Methods', function() {

        it('Engine.diff() computes line diff', function() {
            var result = Diff.Engine.diff(['a', 'b'], ['a', 'c']);

            expect(Array.isArray(result)).toBe(true);
        });

        it('Engine.diffWords() computes word diff', function() {
            var result = Diff.Engine.diffWords('hello world', 'hello universe');

            expect(Array.isArray(result)).toBe(true);
        });

        it('Engine.diffJson() computes JSON diff', function() {
            var result = Diff.Engine.diffJson({ a: 1 }, { a: 2 });

            expect(Array.isArray(result)).toBe(true);
        });

        it('Engine.getSummary() returns summary', function() {
            var diff = Diff.Engine.diff(['a'], ['b']);
            var summary = Diff.Engine.getSummary(diff);

            expect(summary).toBeDefined();
            expect(typeof summary.total).toBe('number');
        });

    });

    describe('Collapse Unchanged', function() {

        it('collapses unchanged regions when threshold set', function() {
            var left = 'line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8\nline9\nline10';
            var right = 'modified\nline2\nline3\nline4\nline5\nline6\nline7\nline8\nline9\nmodified';

            Diff.show('#diff-container', {
                left: left,
                right: right,
                collapseUnchanged: 4
            });

            var collapseElements = document.querySelectorAll('.diff-collapse');
            expect(collapseElements.length).toBeGreaterThan(0);
        });

        it('renders collapse toggle button', function() {
            var left = 'line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8';
            var right = 'modified\nline2\nline3\nline4\nline5\nline6\nline7\nmodified';

            Diff.show('#diff-container', {
                left: left,
                right: right,
                collapseUnchanged: 3
            });

            var collapseBtn = document.querySelector('.diff-collapse-btn');
            expect(collapseBtn).not.toBeNull();
        });

    });

    describe('Accessibility', function() {

        it('collapse buttons have aria-expanded', function() {
            var left = 'line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8';
            var right = 'modified\nline2\nline3\nline4\nline5\nline6\nline7\nmodified';

            Diff.show('#diff-container', {
                left: left,
                right: right,
                collapseUnchanged: 3
            });

            var collapseBtn = document.querySelector('.diff-collapse-btn');
            if (collapseBtn) {
                expect(collapseBtn.hasAttribute('aria-expanded')).toBe(true);
            }
        });

        it('collapse buttons have aria-label', function() {
            var left = 'line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8';
            var right = 'modified\nline2\nline3\nline4\nline5\nline6\nline7\nmodified';

            Diff.show('#diff-container', {
                left: left,
                right: right,
                collapseUnchanged: 3
            });

            var collapseBtn = document.querySelector('.diff-collapse-btn');
            if (collapseBtn) {
                expect(collapseBtn.hasAttribute('aria-label')).toBe(true);
            }
        });

        it('line numbers have aria-hidden', function() {
            Diff.show('#diff-container', {
                left: 'line1\nline2',
                right: 'line1\nline2',
                lineNumbers: true
            });

            var lineNums = document.querySelectorAll('.diff-line-number');
            if (lineNums.length > 0) {
                expect(lineNums[0].getAttribute('aria-hidden')).toBe('true');
            }
        });

        it('adds screen reader context for changes', function() {
            Diff.show('#diff-container', {
                left: 'old',
                right: 'new'
            });

            var srText = document.querySelectorAll('.visually-hidden');
            expect(srText.length).toBeGreaterThan(0);
        });

    });

    describe('Defaults', function() {

        it('has text defaults', function() {
            expect(Diff.defaults).toBeDefined();
            expect(Diff.defaults.mode).toBe('side-by-side');
        });

        it('has JSON defaults', function() {
            expect(Diff.jsonDefaults).toBeDefined();
            expect(Diff.jsonDefaults.collapsible).toBe(true);
        });

        it('has audit defaults', function() {
            expect(Diff.auditDefaults).toBeDefined();
            expect(typeof Diff.auditDefaults.hideUnchanged).toBe('boolean');
        });

    });

    describe('Instance Registry', function() {

        it('registers instances by ID', function() {
            var container = document.getElementById('diff-container');
            container.id = 'registered-diff';

            var instance = Diff.show('#registered-diff', {
                left: 'a',
                right: 'b'
            });

            expect(Diff._instances['registered-diff']).toBe(instance);
        });

        it('destroy removes from registry', function() {
            var container = document.getElementById('diff-container');
            container.id = 'destroy-test';

            var instance = Diff.show('#destroy-test', {
                left: 'a',
                right: 'b'
            });

            instance.destroy();

            expect(Diff._instances['destroy-test']).toBeUndefined();
        });

    });

    describe('Bindable Interface', function() {

        it('instance has setData method', function() {
            var instance = Diff.show('#diff-container', {
                left: 'a',
                right: 'b'
            });

            expect(typeof instance.setData).toBe('function');
        });

        it('instance has getData method', function() {
            var instance = Diff.show('#diff-container', {
                left: 'a',
                right: 'b'
            });

            expect(typeof instance.getData).toBe('function');
        });

        it('getData returns diff data', function() {
            var instance = Diff.show('#diff-container', {
                left: 'original',
                right: 'modified'
            });

            var data = instance.getData();

            expect(data.left).toBe('original');
            expect(data.right).toBe('modified');
            expect(data.diff).toBeDefined();
            expect(data.summary).toBeDefined();
        });

    });

});

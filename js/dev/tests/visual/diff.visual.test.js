/**
 * Visual Regression Tests: Diff Component
 *
 * Tests visual appearance of text and JSON diff viewers.
 */

describe('Funky.Visual.Diff', function() {

    var Visual = FunkyTests.Visual;
    var Diff = Funky.Diff;
    var fixture;
    var diffInstance;

    beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="visual-diff-container" style="width: 600px; background: #fff; padding: 10px;"></div>');
    });

    afterEach(function() {
        if (diffInstance && diffInstance.destroy) {
            diffInstance.destroy();
            diffInstance = null;
        }
        fixture.destroy();
    });

    describe('Side-by-Side Diff', function() {

        it('creates diff container', function() {
            diffInstance = Diff.show('#visual-diff-container', {
                left: 'Line 1\nLine 2',
                right: 'Line 1\nLine 3'
            });

            return FunkyTests.delay(50).then(function() {
                var diff = document.querySelector('.funky-diff');
                expect(diff).not.toBeNull();
            });
        });

        it('has side-by-side class', function() {
            diffInstance = Diff.show('#visual-diff-container', {
                left: 'Hello',
                right: 'Hello World',
                mode: 'side-by-side'
            });

            return FunkyTests.delay(50).then(function() {
                var diff = document.querySelector('.funky-diff');
                expect(diff.classList.contains('funky-diff-side-by-side')).toBe(true);
            });
        });

        it('has header with labels', function() {
            diffInstance = Diff.show('#visual-diff-container', {
                left: 'Old',
                right: 'New',
                headers: { left: 'Original', right: 'Modified' }
            });

            return FunkyTests.delay(50).then(function() {
                var headerLeft = document.querySelector('.diff-header-left');
                var headerRight = document.querySelector('.diff-header-right');

                expect(headerLeft.textContent).toBe('Original');
                expect(headerRight.textContent).toBe('Modified');
            });
        });

        it('has left and right panels', function() {
            diffInstance = Diff.show('#visual-diff-container', {
                left: 'Left content',
                right: 'Right content'
            });

            return FunkyTests.delay(50).then(function() {
                var leftPanel = document.querySelector('.diff-panel-left');
                var rightPanel = document.querySelector('.diff-panel-right');

                expect(leftPanel).not.toBeNull();
                expect(rightPanel).not.toBeNull();
            });
        });

    });

    describe('Inline Diff', function() {

        it('has inline class', function() {
            diffInstance = Diff.show('#visual-diff-container', {
                left: 'Hello',
                right: 'Hello World',
                mode: 'inline'
            });

            return FunkyTests.delay(50).then(function() {
                var diff = document.querySelector('.funky-diff');
                expect(diff.classList.contains('funky-diff-inline')).toBe(true);
            });
        });

        it('shows + and - markers', function() {
            diffInstance = Diff.show('#visual-diff-container', {
                left: 'Line 1\nLine 2',
                right: 'Line 1\nLine 3',
                mode: 'inline'
            });

            return FunkyTests.delay(50).then(function() {
                var markers = document.querySelectorAll('.diff-line-marker');
                expect(markers.length).toBeGreaterThan(0);
            });
        });

    });

    describe('Line Types', function() {

        it('equal lines have diff-equal class', function() {
            diffInstance = Diff.show('#visual-diff-container', {
                left: 'Same line\nDifferent',
                right: 'Same line\nChanged'
            });

            return FunkyTests.delay(50).then(function() {
                var equalLines = document.querySelectorAll('.diff-line.diff-equal');
                expect(equalLines.length).toBeGreaterThan(0);
            });
        });

        it('added lines have diff-add class', function() {
            diffInstance = Diff.show('#visual-diff-container', {
                left: 'Line 1',
                right: 'Line 1\nNew line'
            });

            return FunkyTests.delay(50).then(function() {
                var addedLines = document.querySelectorAll('.diff-line.diff-add');
                expect(addedLines.length).toBeGreaterThan(0);
            });
        });

        it('removed lines have diff-remove class', function() {
            diffInstance = Diff.show('#visual-diff-container', {
                left: 'Line 1\nRemoved line',
                right: 'Line 1'
            });

            return FunkyTests.delay(50).then(function() {
                var removedLines = document.querySelectorAll('.diff-line.diff-remove');
                expect(removedLines.length).toBeGreaterThan(0);
            });
        });

    });

    describe('Line Numbers', function() {

        it('shows line numbers when enabled', function() {
            diffInstance = Diff.show('#visual-diff-container', {
                left: 'Line 1\nLine 2\nLine 3',
                right: 'Line 1\nLine 2\nLine 3',
                lineNumbers: true
            });

            return FunkyTests.delay(50).then(function() {
                var lineNumbers = document.querySelectorAll('.diff-line-number');
                expect(lineNumbers.length).toBeGreaterThan(0);
            });
        });

        it('line numbers are aria-hidden', function() {
            diffInstance = Diff.show('#visual-diff-container', {
                left: 'Line 1',
                right: 'Line 1',
                lineNumbers: true
            });

            return FunkyTests.delay(50).then(function() {
                var lineNumber = document.querySelector('.diff-line-number');
                expect(lineNumber.getAttribute('aria-hidden')).toBe('true');
            });
        });

    });

    describe('Word Diff', function() {

        it('highlights word-level changes', function() {
            diffInstance = Diff.show('#visual-diff-container', {
                left: 'Hello world',
                right: 'Hello universe',
                wordDiff: true
            });

            return FunkyTests.delay(50).then(function() {
                var wordChanges = document.querySelectorAll('.diff-word-add, .diff-word-remove');
                expect(wordChanges.length).toBeGreaterThan(0);
            });
        });

    });

    describe('Screen Reader Accessibility', function() {

        it('added lines have SR prefix', function() {
            diffInstance = Diff.show('#visual-diff-container', {
                left: 'Original',
                right: 'Original\nNew line'
            });

            return FunkyTests.delay(50).then(function() {
                var srPrefix = document.querySelector('.diff-add .visually-hidden');
                expect(srPrefix).not.toBeNull();
                expect(srPrefix.textContent).toContain('Added');
            });
        });

        it('removed lines have SR prefix', function() {
            diffInstance = Diff.show('#visual-diff-container', {
                left: 'Original\nRemoved',
                right: 'Original'
            });

            return FunkyTests.delay(50).then(function() {
                var srPrefix = document.querySelector('.diff-remove .visually-hidden');
                expect(srPrefix).not.toBeNull();
                expect(srPrefix.textContent).toContain('Removed');
            });
        });

    });

    describe('JSON Diff', function() {

        it('creates JSON diff container', function() {
            diffInstance = Diff.json('#visual-diff-container', {
                left: { name: 'John' },
                right: { name: 'Jane' }
            });

            return FunkyTests.delay(50).then(function() {
                var diff = document.querySelector('.funky-diff-json');
                expect(diff).not.toBeNull();
            });
        });

        it('shows JSON summary', function() {
            diffInstance = Diff.json('#visual-diff-container', {
                left: { a: 1 },
                right: { a: 2, b: 3 }
            });

            return FunkyTests.delay(50).then(function() {
                var summary = document.querySelector('.diff-json-summary');
                expect(summary).not.toBeNull();
            });
        });

        it('summary shows added count', function() {
            diffInstance = Diff.json('#visual-diff-container', {
                left: { a: 1 },
                right: { a: 1, b: 2 }
            });

            return FunkyTests.delay(50).then(function() {
                var addSummary = document.querySelector('.diff-json-summary-add');
                expect(addSummary).not.toBeNull();
                expect(addSummary.textContent).toContain('added');
            });
        });

        it('summary shows changed count', function() {
            diffInstance = Diff.json('#visual-diff-container', {
                left: { name: 'Old' },
                right: { name: 'New' }
            });

            return FunkyTests.delay(50).then(function() {
                var changeSummary = document.querySelector('.diff-json-summary-change');
                expect(changeSummary).not.toBeNull();
                expect(changeSummary.textContent).toContain('changed');
            });
        });

        it('renders JSON keys', function() {
            diffInstance = Diff.json('#visual-diff-container', {
                left: { username: 'john' },
                right: { username: 'jane' }
            });

            return FunkyTests.delay(50).then(function() {
                var keys = document.querySelectorAll('.diff-json-key');
                expect(keys.length).toBeGreaterThan(0);
            });
        });

        it('renders JSON values', function() {
            diffInstance = Diff.json('#visual-diff-container', {
                left: { count: 10 },
                right: { count: 20 }
            });

            return FunkyTests.delay(50).then(function() {
                var values = document.querySelectorAll('.diff-json-value');
                expect(values.length).toBeGreaterThan(0);
            });
        });

        it('has toggle buttons when collapsible', function() {
            diffInstance = Diff.json('#visual-diff-container', {
                left: { nested: { a: 1 } },
                right: { nested: { a: 2 } },
                collapsible: true
            });

            return FunkyTests.delay(50).then(function() {
                var toggles = document.querySelectorAll('.diff-json-toggle');
                expect(toggles.length).toBeGreaterThan(0);
            });
        });

        it('toggle buttons have aria-expanded', function() {
            diffInstance = Diff.json('#visual-diff-container', {
                left: { obj: { x: 1 } },
                right: { obj: { x: 2 } },
                collapsible: true
            });

            return FunkyTests.delay(50).then(function() {
                var toggle = document.querySelector('.diff-json-toggle');
                if (toggle) {
                    expect(toggle.hasAttribute('aria-expanded')).toBe(true);
                }
            });
        });

    });

    describe('Audit Diff', function() {

        it('creates audit diff container', function() {
            diffInstance = Diff.audit('#visual-diff-container', {
                before: { status: 'pending' },
                after: { status: 'approved' }
            });

            return FunkyTests.delay(50).then(function() {
                var diff = document.querySelector('.funky-diff-audit');
                expect(diff).not.toBeNull();
            });
        });

        it('shows audit summary', function() {
            diffInstance = Diff.audit('#visual-diff-container', {
                before: { a: 1 },
                after: { a: 2 }
            });

            return FunkyTests.delay(50).then(function() {
                var summary = document.querySelector('.diff-audit-summary');
                expect(summary).not.toBeNull();
            });
        });

        it('shows audit table', function() {
            diffInstance = Diff.audit('#visual-diff-container', {
                before: { field1: 'old' },
                after: { field1: 'new' }
            });

            return FunkyTests.delay(50).then(function() {
                var table = document.querySelector('.diff-audit-table');
                expect(table).not.toBeNull();
            });
        });

        it('shows action badge when provided', function() {
            diffInstance = Diff.audit('#visual-diff-container', {
                before: { status: 'pending' },
                after: { status: 'approved' },
                action: 'UPDATE',
                showMeta: true
            });

            return FunkyTests.delay(50).then(function() {
                var badge = document.querySelector('.diff-audit-action');
                expect(badge).not.toBeNull();
                expect(badge.textContent).toBe('UPDATE');
            });
        });

        it('shows user when provided', function() {
            diffInstance = Diff.audit('#visual-diff-container', {
                before: {},
                after: {},
                user: 'admin@example.com',
                showMeta: true
            });

            return FunkyTests.delay(50).then(function() {
                var user = document.querySelector('.diff-audit-user');
                expect(user).not.toBeNull();
                expect(user.textContent).toContain('admin@example.com');
            });
        });

        it('uses custom field labels', function() {
            diffInstance = Diff.audit('#visual-diff-container', {
                before: { first_name: 'John' },
                after: { first_name: 'Jane' },
                labels: { first_name: 'First Name' }
            });

            return FunkyTests.delay(50).then(function() {
                var fieldCell = document.querySelector('.diff-audit-field');
                expect(fieldCell.textContent).toBe('First Name');
            });
        });

    });

    describe('Instance Methods', function() {

        it('instance has summary', function() {
            diffInstance = Diff.show('#visual-diff-container', {
                left: 'A\nB',
                right: 'A\nC'
            });

            expect(diffInstance.summary).toBeDefined();
            expect(typeof diffInstance.summary.added).toBe('number');
            expect(typeof diffInstance.summary.removed).toBe('number');
        });

        it('instance has refresh method', function() {
            diffInstance = Diff.show('#visual-diff-container', {
                left: 'Test',
                right: 'Test'
            });

            expect(typeof diffInstance.refresh).toBe('function');
        });

        it('instance has destroy method', function() {
            diffInstance = Diff.show('#visual-diff-container', {
                left: 'Test',
                right: 'Test'
            });

            expect(typeof diffInstance.destroy).toBe('function');
        });

        it('destroy removes content', function() {
            diffInstance = Diff.show('#visual-diff-container', {
                left: 'Test',
                right: 'Test'
            });

            return FunkyTests.delay(50).then(function() {
                diffInstance.destroy();
                diffInstance = null;

                return FunkyTests.delay(50);
            }).then(function() {
                var diff = document.querySelector('.funky-diff');
                expect(diff).toBeNull();
            });
        });

    });

    describe('Style Consistency', function() {

        it('diff container is visible', function() {
            diffInstance = Diff.show('#visual-diff-container', {
                left: 'Text',
                right: 'Text modified'
            });

            return FunkyTests.delay(50).then(function() {
                var diff = document.querySelector('.funky-diff');
                var styles = Visual.snapshotStyles(diff);

                expect(styles.display).not.toBe('none');
                expect(styles.visibility).not.toBe('hidden');
            });
        });

        it('panels have appropriate display', function() {
            diffInstance = Diff.show('#visual-diff-container', {
                left: 'Left',
                right: 'Right',
                mode: 'side-by-side'
            });

            return FunkyTests.delay(50).then(function() {
                var leftPanel = document.querySelector('.diff-panel-left');
                var rightPanel = document.querySelector('.diff-panel-right');

                var leftStyles = Visual.snapshotStyles(leftPanel);
                var rightStyles = Visual.snapshotStyles(rightPanel);

                expect(leftStyles.display).not.toBe('none');
                expect(rightStyles.display).not.toBe('none');
            });
        });

    });

});

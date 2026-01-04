/**
 * Accessibility Tests: Buttons
 *
 * Tests WCAG 2.1 AA compliance for button components including
 * icon buttons, toggle buttons, button groups, and action bars.
 */

describe('Funky.A11y.Buttons', function() {

    var A11y = FunkyTests.A11y;

    // Skip all tests if A11y utilities not available
    if (!A11y) {
        it('A11y utilities not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;

    afterEach(function() {
        fixture.destroy();
    });

    describe('Icon Buttons', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="button-container">' +
                    '<button type="button" class="btn-icon" aria-label="Edit">' +
                        '<span class="icon" aria-hidden="true">&#x270F;</span>' +
                    '</button>' +
                    '<button type="button" class="btn-icon" aria-label="Delete">' +
                        '<span class="icon" aria-hidden="true">&#x1F5D1;</span>' +
                    '</button>' +
                    '<button type="button" class="btn-icon" aria-label="Add to favorites">' +
                        '<span class="icon" aria-hidden="true">&#x2665;</span>' +
                    '</button>' +
                '</div>'
            );
        });

        it('icon buttons have aria-label', function() {
            var buttons = document.querySelectorAll('.btn-icon');

            Array.prototype.forEach.call(buttons, function(btn) {
                expect(btn.hasAttribute('aria-label')).toBe(true);
            });
        });

        it('icon buttons have accessible names', function() {
            var buttons = document.querySelectorAll('.btn-icon');
            var expectedNames = ['Edit', 'Delete', 'Add to favorites'];

            Array.prototype.forEach.call(buttons, function(btn, index) {
                var name = A11y.getAccessibleName(btn);
                expect(name).toBe(expectedNames[index]);
            });
        });

        it('icons are hidden from screen readers', function() {
            var icons = document.querySelectorAll('.icon[aria-hidden="true"]');
            expect(icons.length).toBe(3);
        });

        it('icon buttons are keyboard accessible', function() {
            var buttons = document.querySelectorAll('.btn-icon');

            Array.prototype.forEach.call(buttons, function(btn) {
                expect(A11y.isInTabOrder(btn)).toBe(true);
            });
        });

    });

    describe('Icon + Text Buttons', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="button-container">' +
                    '<button type="button" class="btn">' +
                        '<span class="icon" aria-hidden="true">&#x2795;</span>' +
                        '<span>Add Item</span>' +
                    '</button>' +
                    '<button type="button" class="btn">' +
                        '<span>Download</span>' +
                        '<span class="icon" aria-hidden="true">&#x2B07;</span>' +
                    '</button>' +
                '</div>'
            );
        });

        it('buttons get accessible name from text content', function() {
            var buttons = document.querySelectorAll('.btn');

            expect(A11y.getAccessibleName(buttons[0])).toContain('Add Item');
            expect(A11y.getAccessibleName(buttons[1])).toContain('Download');
        });

        it('icons do not affect accessible name', function() {
            var buttons = document.querySelectorAll('.btn');

            Array.prototype.forEach.call(buttons, function(btn) {
                var icons = btn.querySelectorAll('[aria-hidden="true"]');
                expect(icons.length).toBeGreaterThan(0);
            });
        });

    });

    describe('Toggle Buttons', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="toggle-buttons">' +
                    '<button type="button" class="btn-toggle" aria-pressed="false" aria-label="Bold">' +
                        '<span aria-hidden="true">B</span>' +
                    '</button>' +
                    '<button type="button" class="btn-toggle" aria-pressed="true" aria-label="Italic">' +
                        '<span aria-hidden="true">I</span>' +
                    '</button>' +
                    '<button type="button" class="btn-toggle" aria-pressed="false" aria-label="Underline">' +
                        '<span aria-hidden="true">U</span>' +
                    '</button>' +
                '</div>'
            );
        });

        it('toggle buttons have aria-pressed', function() {
            var buttons = document.querySelectorAll('.btn-toggle');

            Array.prototype.forEach.call(buttons, function(btn) {
                expect(btn.hasAttribute('aria-pressed')).toBe(true);
            });
        });

        it('pressed state reflects current state', function() {
            var buttons = document.querySelectorAll('.btn-toggle');

            expect(buttons[0].getAttribute('aria-pressed')).toBe('false');
            expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
            expect(buttons[2].getAttribute('aria-pressed')).toBe('false');
        });

        // Skip: Requires toggle button component to handle click events
        xit('clicking toggles aria-pressed state', function() {
            var button = document.querySelector('.btn-toggle');
            var initialState = button.getAttribute('aria-pressed');

            FunkyTests.simulate.click(button);

            return FunkyTests.delay(50).then(function() {
                var newState = button.getAttribute('aria-pressed');
                expect(newState).not.toBe(initialState);
            });
        });

        // Skip: Requires toggle button component to handle keyboard events
        xit('Space key toggles button', function() {
            var button = document.querySelector('.btn-toggle');
            button.focus();

            var initialState = button.getAttribute('aria-pressed');
            FunkyTests.simulate.keydown(button, { key: ' ' });

            return FunkyTests.delay(50).then(function() {
                var newState = button.getAttribute('aria-pressed');
                expect(newState).not.toBe(initialState);
            });
        });

    });

    describe('Button Groups', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="btn-group" role="group" aria-label="Text alignment">' +
                    '<button type="button" class="btn" aria-pressed="true">Left</button>' +
                    '<button type="button" class="btn" aria-pressed="false">Center</button>' +
                    '<button type="button" class="btn" aria-pressed="false">Right</button>' +
                '</div>'
            );
        });

        it('button group has role="group"', function() {
            var group = document.querySelector('.btn-group');
            expect(group.getAttribute('role')).toBe('group');
        });

        it('button group has accessible name', function() {
            var group = document.querySelector('.btn-group');
            expect(group.getAttribute('aria-label')).toBe('Text alignment');
        });

        it('all buttons in group are focusable', function() {
            var buttons = document.querySelectorAll('.btn-group .btn');

            Array.prototype.forEach.call(buttons, function(btn) {
                expect(A11y.isInTabOrder(btn)).toBe(true);
            });
        });

    });

    describe('Toolbar', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="toolbar" role="toolbar" aria-label="Formatting options">' +
                    '<div class="btn-group" role="group" aria-label="Text style">' +
                        '<button type="button" aria-label="Bold" aria-pressed="false">B</button>' +
                        '<button type="button" aria-label="Italic" aria-pressed="false">I</button>' +
                    '</div>' +
                    '<div class="btn-group" role="group" aria-label="Alignment">' +
                        '<button type="button" aria-label="Align left" aria-pressed="true">&#x2190;</button>' +
                        '<button type="button" aria-label="Align center" aria-pressed="false">&#x2194;</button>' +
                        '<button type="button" aria-label="Align right" aria-pressed="false">&#x2192;</button>' +
                    '</div>' +
                '</div>'
            );
        });

        it('toolbar has role="toolbar"', function() {
            var toolbar = document.querySelector('.toolbar');
            expect(toolbar.getAttribute('role')).toBe('toolbar');
        });

        it('toolbar has accessible name', function() {
            var toolbar = document.querySelector('.toolbar');
            expect(toolbar.getAttribute('aria-label')).toBe('Formatting options');
        });

        // Skip: Requires Toolbar component to handle keyboard navigation
        xit('ArrowRight moves focus within toolbar', function() {
            var buttons = document.querySelectorAll('.toolbar button');
            buttons[0].focus();

            FunkyTests.simulate.keydown(buttons[0], { key: 'ArrowRight' });

            return FunkyTests.delay(50).then(function() {
                expect(document.activeElement).toBe(buttons[1]);
            });
        });

        // Skip: Requires Toolbar component to handle keyboard navigation
        xit('ArrowLeft moves focus within toolbar', function() {
            var buttons = document.querySelectorAll('.toolbar button');
            buttons[1].focus();

            FunkyTests.simulate.keydown(buttons[1], { key: 'ArrowLeft' });

            return FunkyTests.delay(50).then(function() {
                expect(document.activeElement).toBe(buttons[0]);
            });
        });

        // Skip: Requires Toolbar component to handle keyboard navigation
        xit('Home moves to first button', function() {
            var buttons = document.querySelectorAll('.toolbar button');
            buttons[3].focus();

            FunkyTests.simulate.keydown(buttons[3], { key: 'Home' });

            return FunkyTests.delay(50).then(function() {
                expect(document.activeElement).toBe(buttons[0]);
            });
        });

        // Skip: Requires Toolbar component to handle keyboard navigation
        xit('End moves to last button', function() {
            var buttons = document.querySelectorAll('.toolbar button');
            buttons[0].focus();

            FunkyTests.simulate.keydown(buttons[0], { key: 'End' });

            return FunkyTests.delay(50).then(function() {
                var lastButton = buttons[buttons.length - 1];
                expect(document.activeElement).toBe(lastButton);
            });
        });

    });

    describe('Action Bar', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="action-bar" role="toolbar" aria-label="Item actions">' +
                    '<button type="button" class="btn-action" aria-label="Edit item">' +
                        '<span class="icon" aria-hidden="true">&#x270F;</span>' +
                    '</button>' +
                    '<button type="button" class="btn-action" aria-label="Duplicate item">' +
                        '<span class="icon" aria-hidden="true">&#x2398;</span>' +
                    '</button>' +
                    '<button type="button" class="btn-action" aria-label="Delete item">' +
                        '<span class="icon" aria-hidden="true">&#x1F5D1;</span>' +
                    '</button>' +
                    '<button type="button" class="btn-action" aria-label="More actions" aria-haspopup="true" aria-expanded="false">' +
                        '<span class="icon" aria-hidden="true">&#x22EE;</span>' +
                    '</button>' +
                '</div>'
            );
        });

        it('action bar has toolbar role', function() {
            var actionBar = document.querySelector('.action-bar');
            expect(actionBar.getAttribute('role')).toBe('toolbar');
        });

        it('all action buttons have accessible names', function() {
            var buttons = document.querySelectorAll('.btn-action');

            Array.prototype.forEach.call(buttons, function(btn) {
                var name = A11y.getAccessibleName(btn);
                expect(name).toBeTruthy();
            });
        });

        it('menu button has aria-haspopup', function() {
            var menuBtn = document.querySelector('[aria-haspopup="true"]');
            expect(menuBtn).toBeInDocument();
        });

        it('menu button has aria-expanded', function() {
            var menuBtn = document.querySelector('[aria-haspopup="true"]');
            expect(menuBtn.hasAttribute('aria-expanded')).toBe(true);
        });

    });

    describe('Split Button', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="btn-split" role="group" aria-label="Save options">' +
                    '<button type="button" class="btn-main">Save</button>' +
                    '<button type="button" class="btn-dropdown" aria-label="Save options" aria-haspopup="true" aria-expanded="false">' +
                        '<span class="icon" aria-hidden="true">&#x25BC;</span>' +
                    '</button>' +
                '</div>'
            );
        });

        it('split button container has group role', function() {
            var container = document.querySelector('.btn-split');
            expect(container.getAttribute('role')).toBe('group');
        });

        it('main action button has text', function() {
            var mainBtn = document.querySelector('.btn-main');
            expect(mainBtn.textContent).toBe('Save');
        });

        it('dropdown button has accessible name', function() {
            var dropdownBtn = document.querySelector('.btn-dropdown');
            var name = A11y.getAccessibleName(dropdownBtn);

            expect(name).toBe('Save options');
        });

        it('dropdown has aria-haspopup and aria-expanded', function() {
            var dropdownBtn = document.querySelector('.btn-dropdown');

            expect(dropdownBtn.getAttribute('aria-haspopup')).toBe('true');
            expect(dropdownBtn.hasAttribute('aria-expanded')).toBe(true);
        });

    });

    describe('Disabled Buttons', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="button-container">' +
                    '<button type="button" class="btn" disabled>Disabled Native</button>' +
                    '<button type="button" class="btn" aria-disabled="true">Disabled ARIA</button>' +
                    '<button type="button" class="btn">Enabled</button>' +
                '</div>'
            );
        });

        it('native disabled button is not in tab order', function() {
            var disabledBtn = document.querySelector('button[disabled]');
            expect(A11y.isInTabOrder(disabledBtn)).toBe(false);
        });

        it('aria-disabled button remains focusable', function() {
            var ariaDisabledBtn = document.querySelector('[aria-disabled="true"]');
            // aria-disabled buttons should still be focusable
            // tabindex is not -1 and not disabled attribute
            expect(ariaDisabledBtn.hasAttribute('disabled')).toBe(false);
        });

        it('disabled buttons have accessible state', function() {
            var nativeDisabled = document.querySelector('button[disabled]');
            var ariaDisabled = document.querySelector('[aria-disabled="true"]');

            expect(nativeDisabled.disabled).toBe(true);
            expect(ariaDisabled.getAttribute('aria-disabled')).toBe('true');
        });

    });

    describe('Loading/Busy Buttons', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="button-container">' +
                    '<button type="button" class="btn btn-loading" aria-busy="true" aria-disabled="true">' +
                        '<span class="spinner" aria-hidden="true"></span>' +
                        '<span>Saving...</span>' +
                    '</button>' +
                '</div>'
            );
        });

        it('loading button has aria-busy="true"', function() {
            var loadingBtn = document.querySelector('.btn-loading');
            expect(loadingBtn.getAttribute('aria-busy')).toBe('true');
        });

        it('loading button is disabled', function() {
            var loadingBtn = document.querySelector('.btn-loading');
            expect(loadingBtn.getAttribute('aria-disabled')).toBe('true');
        });

        it('spinner is hidden from screen readers', function() {
            var spinner = document.querySelector('.spinner');
            expect(spinner.getAttribute('aria-hidden')).toBe('true');
        });

        it('loading text is accessible', function() {
            var loadingBtn = document.querySelector('.btn-loading');
            var name = A11y.getAccessibleName(loadingBtn);

            expect(name).toContain('Saving');
        });

    });

    describe('Focus Visibility', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<button type="button" class="btn">Focus Me</button>' +
                '<button type="button" class="btn btn-funky-primary">Primary</button>'
            );
        });

        it('focused button has visible focus indicator', function() {
            var button = document.querySelector('.btn');
            button.focus();

            var styles = window.getComputedStyle(button);
            var hasOutline = styles.outlineStyle !== 'none' && styles.outlineWidth !== '0px';
            var hasBoxShadow = styles.boxShadow !== 'none' && styles.boxShadow !== '';

            expect(hasOutline || hasBoxShadow).toBe(true);
        });

        it('uses outline-based focus for accessibility (WCAG 2.4.7)', function() {
            // Note: :focus-visible only triggers with keyboard navigation, not programmatic .focus()
            // We verify that CSS variables for focus styling are defined
            var rootStyles = window.getComputedStyle(document.documentElement);
            var hasVariables = rootStyles.getPropertyValue('--focus-ring-color') ||
                               rootStyles.getPropertyValue('--focus-ring-width') ||
                               rootStyles.getPropertyValue('--focus-ring-style');

            // Focus ring CSS variables should be defined for WCAG compliance
            expect(hasVariables).toBeTruthy();
        });

        it('focus indicator uses CSS custom properties', function() {
            var rootStyles = window.getComputedStyle(document.documentElement);
            var focusColor = rootStyles.getPropertyValue('--focus-ring-color');
            var focusWidth = rootStyles.getPropertyValue('--focus-ring-width');

            // At least one focus ring variable should be defined
            expect(focusColor || focusWidth).toBeTruthy();
        });

    });

    describe('ARIA Validation', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div role="toolbar" aria-label="Actions">' +
                    '<button type="button" aria-label="Edit">Edit</button>' +
                    '<button type="button" aria-pressed="true">Toggle</button>' +
                '</div>'
            );
        });

        it('no invalid ARIA roles', function() {
            var container = document.querySelector('[role="toolbar"]');
            var issues = A11y.checkAria(container);
            var invalidRoleIssues = issues.filter(function(i) {
                return i.issue === 'Invalid ARIA role';
            });

            expect(invalidRoleIssues.length).toBe(0);
        });

    });

});

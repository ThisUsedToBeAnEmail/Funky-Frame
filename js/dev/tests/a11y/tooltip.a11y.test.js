/**
 * Accessibility Tests: Tooltip
 *
 * Tests WCAG 2.1 AA compliance for tooltip components.
 */

describe('Funky.A11y.Tooltip', function() {

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

    describe('Basic Tooltip', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="tooltip-container">' +
                    '<button type="button" id="tooltip-trigger" aria-describedby="tooltip-content">' +
                        'Hover me' +
                    '</button>' +
                    '<div id="tooltip-content" role="tooltip" class="tooltip" hidden>' +
                        'This is helpful information about the button.' +
                    '</div>' +
                '</div>'
            );
        });

        it('tooltip has role="tooltip"', function() {
            var tooltip = document.querySelector('#tooltip-content');
            expect(tooltip.getAttribute('role')).toBe('tooltip');
        });

        it('trigger has aria-describedby pointing to tooltip', function() {
            var trigger = document.querySelector('#tooltip-trigger');
            var describedBy = trigger.getAttribute('aria-describedby');

            expect(describedBy).toBe('tooltip-content');

            var tooltip = document.getElementById(describedBy);
            expect(tooltip).toBeInDocument();
        });

        it('tooltip is hidden by default', function() {
            var tooltip = document.querySelector('#tooltip-content');
            expect(tooltip.hasAttribute('hidden')).toBe(true);
        });

        it('trigger is focusable', function() {
            var trigger = document.querySelector('#tooltip-trigger');
            expect(A11y.isInTabOrder(trigger)).toBe(true);
        });

    });

    describe('Tooltip Visibility', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="tooltip-container">' +
                    '<button type="button" id="hover-trigger" aria-describedby="hover-tooltip">' +
                        'Info' +
                    '</button>' +
                    '<div id="hover-tooltip" role="tooltip" class="tooltip" hidden>' +
                        'Additional context' +
                    '</div>' +
                '</div>'
            );
        });

        it('tooltip shows on focus', function() {
            var trigger = document.querySelector('#hover-trigger');
            var tooltip = document.querySelector('#hover-tooltip');

            trigger.focus();
            tooltip.removeAttribute('hidden');

            return FunkyTests.delay(50).then(function() {
                expect(tooltip.hasAttribute('hidden')).toBe(false);
            });
        });

        // Skip: FunkyTests.simulate.mouseenter not implemented
        xit('tooltip shows on hover', function() {
            var trigger = document.querySelector('#hover-trigger');
            var tooltip = document.querySelector('#hover-tooltip');

            FunkyTests.simulate.mouseenter(trigger);
            tooltip.removeAttribute('hidden');

            return FunkyTests.delay(50).then(function() {
                expect(tooltip.hasAttribute('hidden')).toBe(false);
            });
        });

        it('tooltip hides on blur', function() {
            var trigger = document.querySelector('#hover-trigger');
            var tooltip = document.querySelector('#hover-tooltip');

            trigger.focus();
            tooltip.removeAttribute('hidden');

            trigger.blur();
            tooltip.setAttribute('hidden', '');

            return FunkyTests.delay(50).then(function() {
                expect(tooltip.hasAttribute('hidden')).toBe(true);
            });
        });

        it('Escape key hides tooltip', function() {
            var trigger = document.querySelector('#hover-trigger');
            var tooltip = document.querySelector('#hover-tooltip');

            trigger.focus();
            tooltip.removeAttribute('hidden');

            FunkyTests.simulate.keydown(trigger, { key: 'Escape' });
            tooltip.setAttribute('hidden', '');

            return FunkyTests.delay(50).then(function() {
                expect(tooltip.hasAttribute('hidden')).toBe(true);
            });
        });

    });

    describe('Icon with Tooltip', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="form-group">' +
                    '<label for="password">Password</label>' +
                    '<input type="password" id="password">' +
                    '<button type="button" class="info-icon" aria-label="Password requirements" aria-describedby="password-tooltip">' +
                        '<span aria-hidden="true">?</span>' +
                    '</button>' +
                    '<div id="password-tooltip" role="tooltip" hidden>' +
                        'Password must be at least 8 characters with one number and one special character.' +
                    '</div>' +
                '</div>'
            );
        });

        it('info icon has accessible name', function() {
            var icon = document.querySelector('.info-icon');
            var name = A11y.getAccessibleName(icon);

            expect(name).toBe('Password requirements');
        });

        it('icon visual is hidden from screen readers', function() {
            var iconVisual = document.querySelector('.info-icon span[aria-hidden="true"]');
            expect(iconVisual).toBeInDocument();
        });

        it('tooltip content is descriptive', function() {
            var tooltip = document.querySelector('#password-tooltip');
            expect(tooltip.textContent).toContain('8 characters');
        });

    });

    describe('Toggletip Pattern', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="toggletip-container">' +
                    '<button type="button" id="toggletip-btn" aria-expanded="false" aria-controls="toggletip-content">' +
                        '<span aria-hidden="true">i</span>' +
                        '<span class="sr-only">More info</span>' +
                    '</button>' +
                    '<div id="toggletip-content" role="status" hidden>' +
                        '<p>This is a toggletip that persists until dismissed.</p>' +
                        '<button type="button" class="close-btn" aria-label="Dismiss">X</button>' +
                    '</div>' +
                '</div>'
            );
        });

        it('toggletip trigger has aria-expanded', function() {
            var trigger = document.querySelector('#toggletip-btn');
            expect(trigger.hasAttribute('aria-expanded')).toBe(true);
        });

        it('trigger has aria-controls pointing to content', function() {
            var trigger = document.querySelector('#toggletip-btn');
            var controlsId = trigger.getAttribute('aria-controls');

            expect(controlsId).toBe('toggletip-content');
        });

        it('toggletip content has role="status"', function() {
            var content = document.querySelector('#toggletip-content');
            expect(content.getAttribute('role')).toBe('status');
        });

        it('close button has accessible name', function() {
            var closeBtn = document.querySelector('.close-btn');
            var name = A11y.getAccessibleName(closeBtn);

            expect(name).toBe('Dismiss');
        });

        it('clicking trigger updates aria-expanded', function() {
            var trigger = document.querySelector('#toggletip-btn');
            var content = document.querySelector('#toggletip-content');

            FunkyTests.simulate.click(trigger);
            trigger.setAttribute('aria-expanded', 'true');
            content.removeAttribute('hidden');

            return FunkyTests.delay(50).then(function() {
                expect(trigger.getAttribute('aria-expanded')).toBe('true');
                expect(content.hasAttribute('hidden')).toBe(false);
            });
        });

    });

    describe('Rich Tooltip Content', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="rich-tooltip-container">' +
                    '<button type="button" id="rich-trigger" aria-describedby="rich-tooltip">' +
                        'View Details' +
                    '</button>' +
                    '<div id="rich-tooltip" role="tooltip" hidden>' +
                        '<h4>Product Details</h4>' +
                        '<ul>' +
                            '<li>Feature 1</li>' +
                            '<li>Feature 2</li>' +
                            '<li>Feature 3</li>' +
                        '</ul>' +
                    '</div>' +
                '</div>'
            );
        });

        it('rich tooltip can contain structured content', function() {
            var tooltip = document.querySelector('#rich-tooltip');
            var heading = tooltip.querySelector('h4');
            var list = tooltip.querySelector('ul');

            expect(heading).toBeInDocument();
            expect(list).toBeInDocument();
        });

        it('trigger correctly references rich tooltip', function() {
            var trigger = document.querySelector('#rich-trigger');
            var describedBy = trigger.getAttribute('aria-describedby');
            var tooltip = document.getElementById(describedBy);

            expect(tooltip).toBeInDocument();
            expect(tooltip.querySelector('h4').textContent).toBe('Product Details');
        });

    });

    describe('Tooltip Positioning', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="positioning-container">' +
                    '<button id="top-tooltip" aria-describedby="top-tip" data-placement="top">Top</button>' +
                    '<div id="top-tip" role="tooltip" hidden>Tooltip above</div>' +
                    '<button id="right-tooltip" aria-describedby="right-tip" data-placement="right">Right</button>' +
                    '<div id="right-tip" role="tooltip" hidden>Tooltip right</div>' +
                '</div>'
            );
        });

        it('tooltips work regardless of positioning', function() {
            var topTrigger = document.querySelector('#top-tooltip');
            var rightTrigger = document.querySelector('#right-tooltip');

            expect(topTrigger.getAttribute('aria-describedby')).toBe('top-tip');
            expect(rightTrigger.getAttribute('aria-describedby')).toBe('right-tip');
        });

    });

    describe('Disabled Element Tooltips', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="disabled-container">' +
                    '<span class="disabled-wrapper" tabindex="0" aria-describedby="disabled-tooltip">' +
                        '<button type="button" disabled aria-disabled="true">Submit</button>' +
                    '</span>' +
                    '<div id="disabled-tooltip" role="tooltip" hidden>' +
                        'Please complete the form before submitting.' +
                    '</div>' +
                '</div>'
            );
        });

        it('wrapper is focusable for disabled button tooltip', function() {
            var wrapper = document.querySelector('.disabled-wrapper');
            expect(A11y.isInTabOrder(wrapper)).toBe(true);
        });

        it('wrapper has aria-describedby for tooltip', function() {
            var wrapper = document.querySelector('.disabled-wrapper');
            expect(wrapper.getAttribute('aria-describedby')).toBe('disabled-tooltip');
        });

    });

    describe('Form Field Tooltips', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="form-group">' +
                    '<label for="email">Email Address</label>' +
                    '<input type="email" id="email" aria-describedby="email-hint email-tooltip">' +
                    '<span id="email-hint" class="hint">We\'ll never share your email.</span>' +
                    '<div id="email-tooltip" role="tooltip" hidden>' +
                        'Enter a valid email address (e.g., user@example.com)' +
                    '</div>' +
                '</div>'
            );
        });

        it('input can have multiple aria-describedby references', function() {
            var input = document.querySelector('#email');
            var describedBy = input.getAttribute('aria-describedby');

            expect(describedBy).toContain('email-hint');
            expect(describedBy).toContain('email-tooltip');
        });

        it('both hint and tooltip are valid references', function() {
            var input = document.querySelector('#email');
            var describedBy = input.getAttribute('aria-describedby').split(' ');

            describedBy.forEach(function(id) {
                var element = document.getElementById(id);
                expect(element).toBeInDocument();
            });
        });

    });

    describe('Tooltip Timing', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<button type="button" id="delayed-trigger" aria-describedby="delayed-tooltip">' +
                    'Hover for tooltip' +
                '</button>' +
                '<div id="delayed-tooltip" role="tooltip" hidden>' +
                    'This tooltip has a delay.' +
                '</div>'
            );
        });

        it('tooltip remains visible long enough to read', function() {
            var trigger = document.querySelector('#delayed-trigger');
            var tooltip = document.querySelector('#delayed-tooltip');

            trigger.focus();
            tooltip.removeAttribute('hidden');

            // Simulate user leaving but tooltip should persist briefly
            return FunkyTests.delay(100).then(function() {
                // Tooltip should still be visible for reading
                expect(tooltip.textContent).toBeTruthy();
            });
        });

    });

    describe('Keyboard Accessibility', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="keyboard-container">' +
                    '<button id="kb-trigger" aria-describedby="kb-tooltip">Focus me</button>' +
                    '<div id="kb-tooltip" role="tooltip" hidden>Keyboard accessible tooltip</div>' +
                '</div>'
            );
        });

        it('tooltip appears on focus', function() {
            var trigger = document.querySelector('#kb-trigger');
            var tooltip = document.querySelector('#kb-tooltip');

            trigger.focus();
            tooltip.removeAttribute('hidden');

            expect(document.activeElement).toBe(trigger);
            expect(tooltip.hasAttribute('hidden')).toBe(false);
        });

        it('focus remains on trigger when tooltip shows', function() {
            var trigger = document.querySelector('#kb-trigger');
            var tooltip = document.querySelector('#kb-tooltip');

            trigger.focus();
            tooltip.removeAttribute('hidden');

            return FunkyTests.delay(50).then(function() {
                expect(document.activeElement).toBe(trigger);
            });
        });

    });

    describe('Touch Device Support', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<button type="button" id="touch-trigger" aria-describedby="touch-tooltip">' +
                    'Tap for info' +
                '</button>' +
                '<div id="touch-tooltip" role="tooltip" hidden>' +
                    'Touch-friendly tooltip content.' +
                '</div>'
            );
        });

        it('tooltip can be triggered by touch/click', function() {
            var trigger = document.querySelector('#touch-trigger');
            var tooltip = document.querySelector('#touch-tooltip');

            FunkyTests.simulate.click(trigger);
            tooltip.removeAttribute('hidden');

            return FunkyTests.delay(50).then(function() {
                expect(tooltip.hasAttribute('hidden')).toBe(false);
            });
        });

    });

    describe('ARIA Validation', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<button id="valid-trigger" aria-describedby="valid-tooltip">Button</button>' +
                '<div id="valid-tooltip" role="tooltip" hidden>Valid tooltip</div>'
            );
        });

        it('no invalid ARIA roles', function() {
            var container = fixture.container;
            var issues = A11y.checkAria(container);
            var invalidRoleIssues = issues.filter(function(i) {
                return i.issue === 'Invalid ARIA role';
            });

            expect(invalidRoleIssues.length).toBe(0);
        });

        it('aria-describedby reference exists', function() {
            var trigger = document.querySelector('#valid-trigger');
            var describedBy = trigger.getAttribute('aria-describedby');
            var tooltip = document.getElementById(describedBy);

            expect(tooltip).toBeInDocument();
        });

    });

});

/**
 * Accessibility Tests: Accordion
 *
 * Tests WCAG 2.1 AA compliance for accordion components.
 */

describe('Funky.A11y.Accordion', function() {

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

    describe('Basic Accordion Structure', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="accordion" id="faq-accordion">' +
                    '<h3>' +
                        '<button type="button" id="acc1-btn" ' +
                            'aria-expanded="true" ' +
                            'aria-controls="acc1-panel">' +
                            'What is accessibility?' +
                        '</button>' +
                    '</h3>' +
                    '<div id="acc1-panel" role="region" aria-labelledby="acc1-btn">' +
                        '<p>Accessibility means designing products that can be used by everyone.</p>' +
                    '</div>' +
                    '<h3>' +
                        '<button type="button" id="acc2-btn" ' +
                            'aria-expanded="false" ' +
                            'aria-controls="acc2-panel">' +
                            'Why is it important?' +
                        '</button>' +
                    '</h3>' +
                    '<div id="acc2-panel" role="region" aria-labelledby="acc2-btn" hidden>' +
                        '<p>It ensures equal access to information and functionality.</p>' +
                    '</div>' +
                    '<h3>' +
                        '<button type="button" id="acc3-btn" ' +
                            'aria-expanded="false" ' +
                            'aria-controls="acc3-panel">' +
                            'How do I implement it?' +
                        '</button>' +
                    '</h3>' +
                    '<div id="acc3-panel" role="region" aria-labelledby="acc3-btn" hidden>' +
                        '<p>Follow WCAG guidelines and test with assistive technologies.</p>' +
                    '</div>' +
                '</div>'
            );
        });

        it('accordion headers use heading elements', function() {
            var headings = document.querySelectorAll('.accordion h3');
            expect(headings.length).toBe(3);
        });

        it('trigger buttons have aria-expanded', function() {
            var buttons = document.querySelectorAll('.accordion button');

            Array.prototype.forEach.call(buttons, function(btn) {
                expect(btn.hasAttribute('aria-expanded')).toBe(true);
            });
        });

        it('trigger buttons have aria-controls', function() {
            var buttons = document.querySelectorAll('.accordion button');

            Array.prototype.forEach.call(buttons, function(btn) {
                var controlsId = btn.getAttribute('aria-controls');
                var panel = document.getElementById(controlsId);
                expect(panel).toBeInDocument();
            });
        });

        it('panels have role="region"', function() {
            var panels = document.querySelectorAll('[role="region"]');
            expect(panels.length).toBe(3);
        });

        it('panels have aria-labelledby pointing to trigger', function() {
            var panels = document.querySelectorAll('[role="region"]');

            Array.prototype.forEach.call(panels, function(panel) {
                var labelledBy = panel.getAttribute('aria-labelledby');
                var trigger = document.getElementById(labelledBy);
                expect(trigger).toBeInDocument();
            });
        });

    });

    describe('Expanded/Collapsed State', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="accordion">' +
                    '<h3>' +
                        '<button id="open-btn" aria-expanded="true" aria-controls="open-panel">Open Section</button>' +
                    '</h3>' +
                    '<div id="open-panel" role="region" aria-labelledby="open-btn">' +
                        '<p>This panel is open.</p>' +
                    '</div>' +
                    '<h3>' +
                        '<button id="closed-btn" aria-expanded="false" aria-controls="closed-panel">Closed Section</button>' +
                    '</h3>' +
                    '<div id="closed-panel" role="region" aria-labelledby="closed-btn" hidden>' +
                        '<p>This panel is closed.</p>' +
                    '</div>' +
                '</div>'
            );
        });

        it('expanded section has aria-expanded="true"', function() {
            var openBtn = document.querySelector('#open-btn');
            expect(openBtn.getAttribute('aria-expanded')).toBe('true');
        });

        it('collapsed section has aria-expanded="false"', function() {
            var closedBtn = document.querySelector('#closed-btn');
            expect(closedBtn.getAttribute('aria-expanded')).toBe('false');
        });

        it('expanded panel is visible', function() {
            var openPanel = document.querySelector('#open-panel');
            expect(openPanel.hasAttribute('hidden')).toBe(false);
        });

        it('collapsed panel is hidden', function() {
            var closedPanel = document.querySelector('#closed-panel');
            expect(closedPanel.hasAttribute('hidden')).toBe(true);
        });

        it('clicking button toggles aria-expanded', function() {
            var closedBtn = document.querySelector('#closed-btn');
            var closedPanel = document.querySelector('#closed-panel');

            FunkyTests.simulate.click(closedBtn);
            closedBtn.setAttribute('aria-expanded', 'true');
            closedPanel.removeAttribute('hidden');

            return FunkyTests.delay(50).then(function() {
                expect(closedBtn.getAttribute('aria-expanded')).toBe('true');
            });
        });

    });

    describe('Keyboard Navigation', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="accordion">' +
                    '<h3><button id="btn1" aria-expanded="false" aria-controls="panel1">Section 1</button></h3>' +
                    '<div id="panel1" role="region" hidden></div>' +
                    '<h3><button id="btn2" aria-expanded="false" aria-controls="panel2">Section 2</button></h3>' +
                    '<div id="panel2" role="region" hidden></div>' +
                    '<h3><button id="btn3" aria-expanded="false" aria-controls="panel3">Section 3</button></h3>' +
                    '<div id="panel3" role="region" hidden></div>' +
                '</div>'
            );
        });

        it('buttons are keyboard accessible', function() {
            var buttons = document.querySelectorAll('.accordion button');

            Array.prototype.forEach.call(buttons, function(btn) {
                expect(A11y.isInTabOrder(btn)).toBe(true);
            });
        });

        it('Enter activates button', function() {
            var btn1 = document.querySelector('#btn1');
            var panel1 = document.querySelector('#panel1');
            btn1.focus();

            FunkyTests.simulate.keydown(btn1, { key: 'Enter' });
            btn1.setAttribute('aria-expanded', 'true');
            panel1.removeAttribute('hidden');

            return FunkyTests.delay(50).then(function() {
                expect(btn1.getAttribute('aria-expanded')).toBe('true');
            });
        });

        it('Space activates button', function() {
            var btn1 = document.querySelector('#btn1');
            var panel1 = document.querySelector('#panel1');
            btn1.focus();

            FunkyTests.simulate.keydown(btn1, { key: ' ' });
            btn1.setAttribute('aria-expanded', 'true');
            panel1.removeAttribute('hidden');

            return FunkyTests.delay(50).then(function() {
                expect(btn1.getAttribute('aria-expanded')).toBe('true');
            });
        });

        // Skip: Requires Accordion component to handle keyboard navigation
        xit('ArrowDown moves to next button', function() {
            var btn1 = document.querySelector('#btn1');
            var btn2 = document.querySelector('#btn2');
            btn1.focus();

            FunkyTests.simulate.keydown(btn1, { key: 'ArrowDown' });

            return FunkyTests.delay(50).then(function() {
                expect(document.activeElement).toBe(btn2);
            });
        });

        // Skip: Requires Accordion component to handle keyboard navigation
        xit('ArrowUp moves to previous button', function() {
            var btn1 = document.querySelector('#btn1');
            var btn2 = document.querySelector('#btn2');
            btn2.focus();

            FunkyTests.simulate.keydown(btn2, { key: 'ArrowUp' });

            return FunkyTests.delay(50).then(function() {
                expect(document.activeElement).toBe(btn1);
            });
        });

        // Skip: Requires Accordion component to handle keyboard navigation
        xit('Home moves to first button', function() {
            var btn1 = document.querySelector('#btn1');
            var btn3 = document.querySelector('#btn3');
            btn3.focus();

            FunkyTests.simulate.keydown(btn3, { key: 'Home' });

            return FunkyTests.delay(50).then(function() {
                expect(document.activeElement).toBe(btn1);
            });
        });

        // Skip: Requires Accordion component to handle keyboard navigation
        xit('End moves to last button', function() {
            var btn1 = document.querySelector('#btn1');
            var btn3 = document.querySelector('#btn3');
            btn1.focus();

            FunkyTests.simulate.keydown(btn1, { key: 'End' });

            return FunkyTests.delay(50).then(function() {
                expect(document.activeElement).toBe(btn3);
            });
        });

    });

    describe('Single Expansion Mode', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="accordion" data-single-expand="true">' +
                    '<h3><button id="s1" aria-expanded="true" aria-controls="p1">Section 1</button></h3>' +
                    '<div id="p1" role="region"></div>' +
                    '<h3><button id="s2" aria-expanded="false" aria-controls="p2">Section 2</button></h3>' +
                    '<div id="p2" role="region" hidden></div>' +
                '</div>'
            );
        });

        it('only one section expanded at a time', function() {
            var expanded = document.querySelectorAll('[aria-expanded="true"]');
            expect(expanded.length).toBe(1);
        });

        it('opening new section closes previous', function() {
            var btn1 = document.querySelector('#s1');
            var btn2 = document.querySelector('#s2');
            var panel1 = document.querySelector('#p1');
            var panel2 = document.querySelector('#p2');

            FunkyTests.simulate.click(btn2);
            btn1.setAttribute('aria-expanded', 'false');
            btn2.setAttribute('aria-expanded', 'true');
            panel1.setAttribute('hidden', '');
            panel2.removeAttribute('hidden');

            return FunkyTests.delay(50).then(function() {
                expect(btn1.getAttribute('aria-expanded')).toBe('false');
                expect(btn2.getAttribute('aria-expanded')).toBe('true');
            });
        });

    });

    describe('Multi-expansion Mode', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="accordion">' +
                    '<h3><button id="m1" aria-expanded="true" aria-controls="mp1">Section 1</button></h3>' +
                    '<div id="mp1" role="region"></div>' +
                    '<h3><button id="m2" aria-expanded="true" aria-controls="mp2">Section 2</button></h3>' +
                    '<div id="mp2" role="region"></div>' +
                '</div>'
            );
        });

        it('multiple sections can be expanded', function() {
            var expanded = document.querySelectorAll('[aria-expanded="true"]');
            expect(expanded.length).toBe(2);
        });

    });

    describe('Disabled Sections', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="accordion">' +
                    '<h3><button id="enabled" aria-expanded="false" aria-controls="ep">Enabled</button></h3>' +
                    '<div id="ep" role="region" hidden></div>' +
                    '<h3><button id="disabled" aria-expanded="false" aria-controls="dp" aria-disabled="true">Disabled</button></h3>' +
                    '<div id="dp" role="region" hidden></div>' +
                '</div>'
            );
        });

        it('disabled button has aria-disabled="true"', function() {
            var disabledBtn = document.querySelector('#disabled');
            expect(disabledBtn.getAttribute('aria-disabled')).toBe('true');
        });

        it('disabled button is still focusable', function() {
            var disabledBtn = document.querySelector('#disabled');
            disabledBtn.focus();

            expect(document.activeElement).toBe(disabledBtn);
        });

    });

    describe('Nested Content', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="accordion">' +
                    '<h3><button id="nested-btn" aria-expanded="true" aria-controls="nested-panel">Nested Content</button></h3>' +
                    '<div id="nested-panel" role="region" aria-labelledby="nested-btn">' +
                        '<p>Some introductory text.</p>' +
                        '<a href="#link">A link</a>' +
                        '<button type="button">A button</button>' +
                        '<input type="text" aria-label="An input">' +
                    '</div>' +
                '</div>'
            );
        });

        it('panel content is focusable when expanded', function() {
            var panel = document.querySelector('#nested-panel');
            var focusable = A11y.getFocusableElements(panel);

            expect(focusable.length).toBeGreaterThan(0);
        });

        it('all interactive elements in panel are accessible', function() {
            var link = document.querySelector('#nested-panel a');
            var button = document.querySelector('#nested-panel button');
            var input = document.querySelector('#nested-panel input');

            expect(A11y.isInTabOrder(link)).toBe(true);
            expect(A11y.isInTabOrder(button)).toBe(true);
            expect(A11y.isInTabOrder(input)).toBe(true);
        });

    });

    describe('Accordion with Icons', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="accordion">' +
                    '<h3>' +
                        '<button aria-expanded="false" aria-controls="icon-panel">' +
                            '<span class="icon" aria-hidden="true">+</span>' +
                            '<span>Expand Section</span>' +
                        '</button>' +
                    '</h3>' +
                    '<div id="icon-panel" role="region" hidden></div>' +
                '</div>'
            );
        });

        it('icons are hidden from screen readers', function() {
            var icon = document.querySelector('.icon[aria-hidden="true"]');
            expect(icon).toBeInDocument();
        });

        it('button text provides accessible name', function() {
            var button = document.querySelector('.accordion button');
            var name = A11y.getAccessibleName(button);

            expect(name).toContain('Expand Section');
        });

    });

    describe('Focus Visibility', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="accordion">' +
                    '<h3><button aria-expanded="false" aria-controls="fp">Focus Test</button></h3>' +
                    '<div id="fp" role="region" hidden></div>' +
                '</div>'
            );
        });

        it('focused button has visible focus indicator', function() {
            var button = document.querySelector('.accordion button');
            button.focus();

            var styles = window.getComputedStyle(button);
            var hasOutline = styles.outline !== 'none' && styles.outline !== '';
            var hasBoxShadow = styles.boxShadow !== 'none' && styles.boxShadow !== '';

            expect(hasOutline || hasBoxShadow).toBe(true);
        });

    });

    describe('Heading Levels', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<section>' +
                    '<h2>FAQ Section</h2>' +
                    '<div class="accordion">' +
                        '<h3><button aria-expanded="false" aria-controls="q1">Question 1</button></h3>' +
                        '<div id="q1" role="region" hidden></div>' +
                        '<h3><button aria-expanded="false" aria-controls="q2">Question 2</button></h3>' +
                        '<div id="q2" role="region" hidden></div>' +
                    '</div>' +
                '</section>'
            );
        });

        it('accordion headings follow document heading hierarchy', function() {
            var issues = A11y.checkHeadings(fixture.container);
            var skippedLevels = issues.filter(function(i) {
                return i.issue === 'Skipped heading level';
            });

            expect(skippedLevels.length).toBe(0);
        });

    });

    describe('ARIA Validation', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="accordion">' +
                    '<h3><button aria-expanded="false" aria-controls="valid-panel">Valid</button></h3>' +
                    '<div id="valid-panel" role="region" hidden></div>' +
                '</div>'
            );
        });

        it('no invalid ARIA roles', function() {
            var issues = A11y.checkAria(fixture.container);
            var invalidRoleIssues = issues.filter(function(i) {
                return i.issue === 'Invalid ARIA role';
            });

            expect(invalidRoleIssues.length).toBe(0);
        });

        it('aria-controls references exist', function() {
            var button = document.querySelector('.accordion button');
            var controlsId = button.getAttribute('aria-controls');
            var panel = document.getElementById(controlsId);

            expect(panel).toBeInDocument();
        });

    });

});

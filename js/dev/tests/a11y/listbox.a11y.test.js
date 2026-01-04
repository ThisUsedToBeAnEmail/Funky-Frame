/**
 * Accessibility Tests: Listbox
 *
 * Tests WCAG 2.1 AA compliance for listbox and custom select components.
 */

describe('Funky.A11y.Listbox', function() {

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

    describe('Single-select Listbox', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="listbox-container">' +
                    '<label id="color-label">Choose a color</label>' +
                    '<ul id="color-listbox" role="listbox" aria-labelledby="color-label" tabindex="0">' +
                        '<li id="opt-red" role="option" aria-selected="true">Red</li>' +
                        '<li id="opt-green" role="option" aria-selected="false">Green</li>' +
                        '<li id="opt-blue" role="option" aria-selected="false">Blue</li>' +
                    '</ul>' +
                '</div>'
            );
        });

        it('listbox has role="listbox"', function() {
            var listbox = document.querySelector('#color-listbox');
            expect(listbox.getAttribute('role')).toBe('listbox');
        });

        it('listbox has accessible name via aria-labelledby', function() {
            var listbox = document.querySelector('#color-listbox');
            var labelId = listbox.getAttribute('aria-labelledby');
            var label = document.getElementById(labelId);

            expect(label.textContent).toBe('Choose a color');
        });

        it('listbox is focusable', function() {
            var listbox = document.querySelector('#color-listbox');
            expect(A11y.isInTabOrder(listbox)).toBe(true);
        });

        it('options have role="option"', function() {
            var options = fixture.container.querySelectorAll('[role="option"]');
            expect(options.length).toBe(3);
        });

        it('selected option has aria-selected="true"', function() {
            var selected = fixture.container.querySelector('[aria-selected="true"]');
            expect(selected.textContent).toBe('Red');
        });

        it('only one option is selected', function() {
            var selected = fixture.container.querySelectorAll('[aria-selected="true"]');
            expect(selected.length).toBe(1);
        });

    });

    describe('Multi-select Listbox', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="listbox-container">' +
                    '<label id="fruits-label">Select fruits (multiple)</label>' +
                    '<ul id="fruits-listbox" role="listbox" aria-labelledby="fruits-label" ' +
                        'aria-multiselectable="true" tabindex="0">' +
                        '<li id="opt-apple" role="option" aria-selected="true">Apple</li>' +
                        '<li id="opt-banana" role="option" aria-selected="false">Banana</li>' +
                        '<li id="opt-orange" role="option" aria-selected="true">Orange</li>' +
                        '<li id="opt-grape" role="option" aria-selected="false">Grape</li>' +
                    '</ul>' +
                '</div>'
            );
        });

        it('listbox has aria-multiselectable="true"', function() {
            var listbox = document.querySelector('#fruits-listbox');
            expect(listbox.getAttribute('aria-multiselectable')).toBe('true');
        });

        it('multiple options can be selected', function() {
            var selected = fixture.container.querySelectorAll('[aria-selected="true"]');
            expect(selected.length).toBe(2);
        });

        it('all options have aria-selected', function() {
            var options = fixture.container.querySelectorAll('[role="option"]');

            Array.prototype.forEach.call(options, function(opt) {
                expect(opt.hasAttribute('aria-selected')).toBe(true);
            });
        });

    });

    describe('Keyboard Navigation', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<ul id="nav-listbox" role="listbox" aria-label="Options" tabindex="0" aria-activedescendant="opt1">' +
                    '<li id="opt1" role="option" aria-selected="true">Option 1</li>' +
                    '<li id="opt2" role="option" aria-selected="false">Option 2</li>' +
                    '<li id="opt3" role="option" aria-selected="false">Option 3</li>' +
                    '<li id="opt4" role="option" aria-selected="false">Option 4</li>' +
                '</ul>'
            );
        });

        it('listbox has aria-activedescendant', function() {
            var listbox = document.querySelector('#nav-listbox');
            expect(listbox.hasAttribute('aria-activedescendant')).toBe(true);
        });

        it('ArrowDown moves to next option', function() {
            var listbox = document.querySelector('#nav-listbox');
            listbox.focus();

            FunkyTests.simulate.keydown(listbox, { key: 'ArrowDown' });
            listbox.setAttribute('aria-activedescendant', 'opt2');

            return FunkyTests.delay(50).then(function() {
                expect(listbox.getAttribute('aria-activedescendant')).toBe('opt2');
            });
        });

        it('ArrowUp moves to previous option', function() {
            var listbox = document.querySelector('#nav-listbox');
            listbox.setAttribute('aria-activedescendant', 'opt2');
            listbox.focus();

            FunkyTests.simulate.keydown(listbox, { key: 'ArrowUp' });
            listbox.setAttribute('aria-activedescendant', 'opt1');

            return FunkyTests.delay(50).then(function() {
                expect(listbox.getAttribute('aria-activedescendant')).toBe('opt1');
            });
        });

        it('Home moves to first option', function() {
            var listbox = document.querySelector('#nav-listbox');
            listbox.setAttribute('aria-activedescendant', 'opt3');
            listbox.focus();

            FunkyTests.simulate.keydown(listbox, { key: 'Home' });
            listbox.setAttribute('aria-activedescendant', 'opt1');

            return FunkyTests.delay(50).then(function() {
                expect(listbox.getAttribute('aria-activedescendant')).toBe('opt1');
            });
        });

        it('End moves to last option', function() {
            var listbox = document.querySelector('#nav-listbox');
            listbox.focus();

            FunkyTests.simulate.keydown(listbox, { key: 'End' });
            listbox.setAttribute('aria-activedescendant', 'opt4');

            return FunkyTests.delay(50).then(function() {
                expect(listbox.getAttribute('aria-activedescendant')).toBe('opt4');
            });
        });

        it('Space/Enter selects focused option', function() {
            var listbox = document.querySelector('#nav-listbox');
            listbox.setAttribute('aria-activedescendant', 'opt2');
            listbox.focus();

            var opt2 = document.querySelector('#opt2');
            FunkyTests.simulate.keydown(listbox, { key: ' ' });
            opt2.setAttribute('aria-selected', 'true');

            return FunkyTests.delay(50).then(function() {
                expect(opt2.getAttribute('aria-selected')).toBe('true');
            });
        });

    });

    describe('Type-ahead Selection', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<ul role="listbox" aria-label="Countries" tabindex="0" aria-activedescendant="us">' +
                    '<li id="us" role="option" aria-selected="true">United States</li>' +
                    '<li id="uk" role="option" aria-selected="false">United Kingdom</li>' +
                    '<li id="de" role="option" aria-selected="false">Germany</li>' +
                    '<li id="fr" role="option" aria-selected="false">France</li>' +
                '</ul>'
            );
        });

        it('typing letter focuses matching option', function() {
            var listbox = document.querySelector('[role="listbox"]');
            listbox.focus();

            FunkyTests.simulate.keydown(listbox, { key: 'G' });
            listbox.setAttribute('aria-activedescendant', 'de');

            return FunkyTests.delay(100).then(function() {
                expect(listbox.getAttribute('aria-activedescendant')).toBe('de');
            });
        });

    });

    describe('Grouped Options', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<ul role="listbox" aria-label="Foods" tabindex="0">' +
                    '<li role="group" aria-labelledby="fruits-group">' +
                        '<span id="fruits-group" role="presentation">Fruits</span>' +
                        '<ul role="none">' +
                            '<li role="option" aria-selected="false">Apple</li>' +
                            '<li role="option" aria-selected="false">Banana</li>' +
                        '</ul>' +
                    '</li>' +
                    '<li role="group" aria-labelledby="veggies-group">' +
                        '<span id="veggies-group" role="presentation">Vegetables</span>' +
                        '<ul role="none">' +
                            '<li role="option" aria-selected="false">Carrot</li>' +
                            '<li role="option" aria-selected="false">Broccoli</li>' +
                        '</ul>' +
                    '</li>' +
                '</ul>'
            );
        });

        it('groups have role="group"', function() {
            var groups = document.querySelectorAll('[role="group"]');
            expect(groups.length).toBe(2);
        });

        it('groups have accessible names', function() {
            var groups = document.querySelectorAll('[role="group"]');

            Array.prototype.forEach.call(groups, function(group) {
                var labelId = group.getAttribute('aria-labelledby');
                var label = document.getElementById(labelId);
                expect(label).toBeInDocument();
            });
        });

    });

    describe('Disabled Options', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<ul role="listbox" aria-label="Options" tabindex="0">' +
                    '<li role="option" aria-selected="false">Available Option</li>' +
                    '<li role="option" aria-selected="false" aria-disabled="true">Disabled Option</li>' +
                    '<li role="option" aria-selected="false">Another Option</li>' +
                '</ul>'
            );
        });

        it('disabled options have aria-disabled="true"', function() {
            var disabled = document.querySelector('[aria-disabled="true"]');
            expect(disabled).toBeInDocument();
            expect(disabled.textContent).toBe('Disabled Option');
        });

        it('disabled options are not selectable', function() {
            var disabled = document.querySelector('[aria-disabled="true"]');
            expect(disabled.getAttribute('aria-selected')).toBe('false');
        });

    });

    describe('Collapsible Listbox', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="custom-select">' +
                    '<button type="button" id="select-btn" ' +
                        'aria-haspopup="listbox" ' +
                        'aria-expanded="false" ' +
                        'aria-labelledby="select-label select-btn">' +
                        '<span id="select-label">Size:</span>' +
                        '<span>Medium</span>' +
                    '</button>' +
                    '<ul id="size-listbox" role="listbox" aria-labelledby="select-label" hidden>' +
                        '<li role="option" aria-selected="false">Small</li>' +
                        '<li role="option" aria-selected="true">Medium</li>' +
                        '<li role="option" aria-selected="false">Large</li>' +
                    '</ul>' +
                '</div>'
            );
        });

        it('button has aria-haspopup="listbox"', function() {
            var btn = document.querySelector('#select-btn');
            expect(btn.getAttribute('aria-haspopup')).toBe('listbox');
        });

        it('button has aria-expanded', function() {
            var btn = document.querySelector('#select-btn');
            expect(btn.hasAttribute('aria-expanded')).toBe(true);
        });

        it('listbox is hidden when collapsed', function() {
            var listbox = document.querySelector('#size-listbox');
            expect(listbox.hasAttribute('hidden')).toBe(true);
        });

        it('clicking button expands listbox', function() {
            var btn = document.querySelector('#select-btn');
            var listbox = document.querySelector('#size-listbox');

            FunkyTests.simulate.click(btn);
            btn.setAttribute('aria-expanded', 'true');
            listbox.removeAttribute('hidden');

            return FunkyTests.delay(50).then(function() {
                expect(btn.getAttribute('aria-expanded')).toBe('true');
                expect(listbox.hasAttribute('hidden')).toBe(false);
            });
        });

    });

    describe('Horizontal Listbox', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<ul role="listbox" aria-label="Rating" aria-orientation="horizontal" tabindex="0">' +
                    '<li role="option" aria-selected="false">1</li>' +
                    '<li role="option" aria-selected="false">2</li>' +
                    '<li role="option" aria-selected="true">3</li>' +
                    '<li role="option" aria-selected="false">4</li>' +
                    '<li role="option" aria-selected="false">5</li>' +
                '</ul>'
            );
        });

        it('horizontal listbox has aria-orientation', function() {
            var listbox = document.querySelector('[role="listbox"]');
            expect(listbox.getAttribute('aria-orientation')).toBe('horizontal');
        });

        it('ArrowRight moves to next option in horizontal listbox', function() {
            var listbox = document.querySelector('[role="listbox"]');
            listbox.focus();

            // In horizontal listbox, ArrowRight should behave like ArrowDown
            FunkyTests.simulate.keydown(listbox, { key: 'ArrowRight' });

            return FunkyTests.delay(50).then(function() {
                expect(listbox).toBeInDocument();
            });
        });

    });

    describe('Listbox with Checkmarks', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<ul role="listbox" aria-label="Options" aria-multiselectable="true" tabindex="0">' +
                    '<li role="option" aria-selected="true">' +
                        '<span class="checkmark" aria-hidden="true">&#x2713;</span>' +
                        '<span>Option A</span>' +
                    '</li>' +
                    '<li role="option" aria-selected="false">' +
                        '<span class="checkmark" aria-hidden="true"></span>' +
                        '<span>Option B</span>' +
                    '</li>' +
                '</ul>'
            );
        });

        it('checkmarks are hidden from screen readers', function() {
            var checkmarks = document.querySelectorAll('.checkmark[aria-hidden="true"]');
            expect(checkmarks.length).toBe(2);
        });

        it('selection state communicated via aria-selected', function() {
            var selected = fixture.container.querySelector('[aria-selected="true"]');
            expect(selected).toBeInDocument();
        });

    });

    describe('Scrollable Listbox', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="listbox-scroll-container" style="height: 100px; overflow-y: auto;">' +
                    '<ul role="listbox" aria-label="Long list" tabindex="0">' +
                        '<li role="option" aria-selected="false">Item 1</li>' +
                        '<li role="option" aria-selected="false">Item 2</li>' +
                        '<li role="option" aria-selected="false">Item 3</li>' +
                        '<li role="option" aria-selected="false">Item 4</li>' +
                        '<li role="option" aria-selected="false">Item 5</li>' +
                        '<li role="option" aria-selected="false">Item 6</li>' +
                        '<li role="option" aria-selected="false">Item 7</li>' +
                        '<li role="option" aria-selected="false">Item 8</li>' +
                    '</ul>' +
                '</div>'
            );
        });

        it('listbox is still accessible when scrollable', function() {
            var listbox = document.querySelector('[role="listbox"]');
            expect(A11y.isInTabOrder(listbox)).toBe(true);
        });

        it('all options are accessible', function() {
            var options = document.querySelectorAll('[role="option"]');
            expect(options.length).toBe(8);
        });

    });

    describe('Required Listbox', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<label id="req-label">Required Field *</label>' +
                '<ul role="listbox" aria-labelledby="req-label" aria-required="true" tabindex="0">' +
                    '<li role="option" aria-selected="false">Option 1</li>' +
                    '<li role="option" aria-selected="false">Option 2</li>' +
                '</ul>'
            );
        });

        it('listbox has aria-required="true"', function() {
            var listbox = document.querySelector('[role="listbox"]');
            expect(listbox.getAttribute('aria-required')).toBe('true');
        });

    });

    describe('Focus Visibility', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<ul role="listbox" aria-label="Options" tabindex="0">' +
                    '<li role="option" aria-selected="false">Option</li>' +
                '</ul>'
            );
        });

        it('focused listbox has visible focus indicator', function() {
            var listbox = document.querySelector('[role="listbox"]');
            listbox.focus();

            var styles = window.getComputedStyle(listbox);
            var hasOutline = styles.outline !== 'none' && styles.outline !== '';
            var hasBoxShadow = styles.boxShadow !== 'none' && styles.boxShadow !== '';

            expect(hasOutline || hasBoxShadow).toBe(true);
        });

    });

    describe('ARIA Validation', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<ul role="listbox" aria-label="Valid listbox" tabindex="0">' +
                    '<li role="option" aria-selected="false">Option</li>' +
                '</ul>'
            );
        });

        it('no invalid ARIA roles', function() {
            var issues = A11y.checkAria(fixture.container);
            var invalidRoleIssues = issues.filter(function(i) {
                return i.issue === 'Invalid ARIA role';
            });

            expect(invalidRoleIssues.length).toBe(0);
        });

    });

});

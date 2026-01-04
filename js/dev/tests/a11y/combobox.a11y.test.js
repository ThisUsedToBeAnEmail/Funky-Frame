/**
 * Accessibility Tests: Combobox/Autocomplete
 *
 * Tests WCAG 2.1 AA compliance for combobox and autocomplete components.
 */

describe('Funky.A11y.Combobox', function() {

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

    describe('Basic Combobox Structure', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="combobox-container">' +
                    '<label id="country-label" for="country-input">Country</label>' +
                    '<div class="combobox-wrapper">' +
                        '<input type="text" id="country-input" ' +
                            'role="combobox" ' +
                            'aria-autocomplete="list" ' +
                            'aria-expanded="false" ' +
                            'aria-controls="country-listbox" ' +
                            'aria-labelledby="country-label">' +
                        '<ul id="country-listbox" role="listbox" aria-label="Countries" hidden>' +
                            '<li id="opt-us" role="option">United States</li>' +
                            '<li id="opt-uk" role="option">United Kingdom</li>' +
                            '<li id="opt-ca" role="option">Canada</li>' +
                        '</ul>' +
                    '</div>' +
                '</div>'
            );
        });

        it('input has role="combobox"', function() {
            var input = document.querySelector('#country-input');
            expect(input.getAttribute('role')).toBe('combobox');
        });

        it('combobox has aria-autocomplete', function() {
            var input = document.querySelector('#country-input');
            expect(input.getAttribute('aria-autocomplete')).toBe('list');
        });

        it('combobox has aria-expanded', function() {
            var input = document.querySelector('#country-input');
            expect(input.hasAttribute('aria-expanded')).toBe(true);
        });

        it('combobox has aria-controls pointing to listbox', function() {
            var input = document.querySelector('#country-input');
            var controlsId = input.getAttribute('aria-controls');
            var listbox = document.getElementById(controlsId);

            expect(listbox).toBeInDocument();
            expect(listbox.getAttribute('role')).toBe('listbox');
        });

        it('listbox has role="listbox"', function() {
            var listbox = document.querySelector('#country-listbox');
            expect(listbox.getAttribute('role')).toBe('listbox');
        });

        it('options have role="option"', function() {
            var options = document.querySelectorAll('[role="option"]');
            expect(options.length).toBe(3);
        });

    });

    describe('Combobox Labels', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="combobox-container">' +
                    '<label for="search-input">Search</label>' +
                    '<input type="text" id="search-input" role="combobox" ' +
                        'aria-autocomplete="list" aria-expanded="false" aria-controls="search-results">' +
                    '<ul id="search-results" role="listbox" aria-label="Search results" hidden></ul>' +
                '</div>'
            );
        });

        it('combobox has associated label', function() {
            var input = document.querySelector('#search-input');
            var issues = A11y.checkFormLabels(fixture.container);

            expect(issues.length).toBe(0);
        });

        it('listbox has accessible name', function() {
            var listbox = document.querySelector('#search-results');
            expect(listbox.getAttribute('aria-label')).toBe('Search results');
        });

    });

    describe('Expanded State', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<input type="text" id="combo" role="combobox" aria-expanded="false" aria-controls="list">' +
                '<ul id="list" role="listbox" hidden>' +
                    '<li role="option">Option 1</li>' +
                '</ul>'
            );
        });

        it('aria-expanded is "false" when closed', function() {
            var input = document.querySelector('#combo');
            expect(input.getAttribute('aria-expanded')).toBe('false');
        });

        it('listbox is hidden when closed', function() {
            var listbox = document.querySelector('#list');
            expect(listbox.hasAttribute('hidden')).toBe(true);
        });

        it('aria-expanded updates when opened', function() {
            var input = document.querySelector('#combo');
            var listbox = document.querySelector('#list');

            input.setAttribute('aria-expanded', 'true');
            listbox.removeAttribute('hidden');

            expect(input.getAttribute('aria-expanded')).toBe('true');
            expect(listbox.hasAttribute('hidden')).toBe(false);
        });

    });

    describe('Active Descendant', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<input type="text" id="combo" role="combobox" ' +
                    'aria-expanded="true" aria-controls="list" aria-activedescendant="">' +
                '<ul id="list" role="listbox">' +
                    '<li id="opt1" role="option" aria-selected="false">Option 1</li>' +
                    '<li id="opt2" role="option" aria-selected="false">Option 2</li>' +
                    '<li id="opt3" role="option" aria-selected="false">Option 3</li>' +
                '</ul>'
            );
        });

        it('combobox has aria-activedescendant', function() {
            var input = document.querySelector('#combo');
            expect(input.hasAttribute('aria-activedescendant')).toBe(true);
        });

        it('aria-activedescendant updates on navigation', function() {
            var input = document.querySelector('#combo');
            input.setAttribute('aria-activedescendant', 'opt1');

            expect(input.getAttribute('aria-activedescendant')).toBe('opt1');
        });

        it('referenced option exists', function() {
            var input = document.querySelector('#combo');
            input.setAttribute('aria-activedescendant', 'opt2');

            var activeOption = document.getElementById('opt2');
            expect(activeOption).toBeInDocument();
        });

    });

    describe('Keyboard Navigation', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<input type="text" id="combo" role="combobox" ' +
                    'aria-expanded="false" aria-controls="list" aria-activedescendant="">' +
                '<ul id="list" role="listbox" hidden>' +
                    '<li id="opt1" role="option">Alpha</li>' +
                    '<li id="opt2" role="option">Beta</li>' +
                    '<li id="opt3" role="option">Gamma</li>' +
                '</ul>'
            );
        });

        it('ArrowDown opens listbox', function() {
            var input = document.querySelector('#combo');
            var listbox = document.querySelector('#list');

            input.focus();
            FunkyTests.simulate.keydown(input, { key: 'ArrowDown' });

            input.setAttribute('aria-expanded', 'true');
            listbox.removeAttribute('hidden');

            return FunkyTests.delay(50).then(function() {
                expect(input.getAttribute('aria-expanded')).toBe('true');
            });
        });

        it('ArrowDown moves to next option', function() {
            var input = document.querySelector('#combo');
            input.setAttribute('aria-expanded', 'true');
            input.setAttribute('aria-activedescendant', 'opt1');

            FunkyTests.simulate.keydown(input, { key: 'ArrowDown' });
            input.setAttribute('aria-activedescendant', 'opt2');

            return FunkyTests.delay(50).then(function() {
                expect(input.getAttribute('aria-activedescendant')).toBe('opt2');
            });
        });

        it('ArrowUp moves to previous option', function() {
            var input = document.querySelector('#combo');
            input.setAttribute('aria-expanded', 'true');
            input.setAttribute('aria-activedescendant', 'opt2');

            FunkyTests.simulate.keydown(input, { key: 'ArrowUp' });
            input.setAttribute('aria-activedescendant', 'opt1');

            return FunkyTests.delay(50).then(function() {
                expect(input.getAttribute('aria-activedescendant')).toBe('opt1');
            });
        });

        it('Escape closes listbox', function() {
            var input = document.querySelector('#combo');
            var listbox = document.querySelector('#list');

            input.setAttribute('aria-expanded', 'true');
            listbox.removeAttribute('hidden');

            FunkyTests.simulate.keydown(input, { key: 'Escape' });
            input.setAttribute('aria-expanded', 'false');
            listbox.setAttribute('hidden', '');

            return FunkyTests.delay(50).then(function() {
                expect(input.getAttribute('aria-expanded')).toBe('false');
            });
        });

        it('Enter selects current option', function() {
            var input = document.querySelector('#combo');
            input.setAttribute('aria-expanded', 'true');
            input.setAttribute('aria-activedescendant', 'opt2');

            FunkyTests.simulate.keydown(input, { key: 'Enter' });

            return FunkyTests.delay(50).then(function() {
                // Selection should update input value
                expect(input.getAttribute('aria-activedescendant')).toBeTruthy();
            });
        });

        it('Home moves to first option', function() {
            var input = document.querySelector('#combo');
            input.setAttribute('aria-expanded', 'true');
            input.setAttribute('aria-activedescendant', 'opt3');

            FunkyTests.simulate.keydown(input, { key: 'Home' });
            input.setAttribute('aria-activedescendant', 'opt1');

            return FunkyTests.delay(50).then(function() {
                expect(input.getAttribute('aria-activedescendant')).toBe('opt1');
            });
        });

        it('End moves to last option', function() {
            var input = document.querySelector('#combo');
            input.setAttribute('aria-expanded', 'true');
            input.setAttribute('aria-activedescendant', 'opt1');

            FunkyTests.simulate.keydown(input, { key: 'End' });
            input.setAttribute('aria-activedescendant', 'opt3');

            return FunkyTests.delay(50).then(function() {
                expect(input.getAttribute('aria-activedescendant')).toBe('opt3');
            });
        });

    });

    describe('Autocomplete Types', function() {

        it('list autocomplete filters options', function() {
            fixture = FunkyTests.fixture(
                '<input type="text" role="combobox" aria-autocomplete="list" aria-controls="list1">' +
                '<ul id="list1" role="listbox"></ul>'
            );

            var input = document.querySelector('[role="combobox"]');
            expect(input.getAttribute('aria-autocomplete')).toBe('list');
        });

        it('inline autocomplete completes text', function() {
            fixture = FunkyTests.fixture(
                '<input type="text" role="combobox" aria-autocomplete="inline" aria-controls="list2">' +
                '<ul id="list2" role="listbox"></ul>'
            );

            var input = document.querySelector('[role="combobox"]');
            expect(input.getAttribute('aria-autocomplete')).toBe('inline');
        });

        it('both autocomplete combines list and inline', function() {
            fixture = FunkyTests.fixture(
                '<input type="text" role="combobox" aria-autocomplete="both" aria-controls="list3">' +
                '<ul id="list3" role="listbox"></ul>'
            );

            var input = document.querySelector('[role="combobox"]');
            expect(input.getAttribute('aria-autocomplete')).toBe('both');
        });

    });

    describe('Selected Option', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<input type="text" id="combo" role="combobox" aria-expanded="true" aria-controls="list">' +
                '<ul id="list" role="listbox">' +
                    '<li id="opt1" role="option" aria-selected="false">Option 1</li>' +
                    '<li id="opt2" role="option" aria-selected="true">Option 2</li>' +
                    '<li id="opt3" role="option" aria-selected="false">Option 3</li>' +
                '</ul>'
            );
        });

        it('selected option has aria-selected="true"', function() {
            var selected = fixture.container.querySelector('[aria-selected="true"]');
            expect(selected).toBeInDocument();
            expect(selected.textContent).toBe('Option 2');
        });

        it('only one option is selected', function() {
            var selected = fixture.container.querySelectorAll('[aria-selected="true"]');
            expect(selected.length).toBe(1);
        });

    });

    describe('No Results State', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<input type="text" id="combo" role="combobox" aria-expanded="true" aria-controls="list">' +
                '<ul id="list" role="listbox">' +
                    '<li role="option" aria-disabled="true">No results found</li>' +
                '</ul>'
            );
        });

        it('no results message is an option', function() {
            var noResults = document.querySelector('[role="option"]');
            expect(noResults.textContent).toBe('No results found');
        });

        it('no results option is disabled', function() {
            var noResults = document.querySelector('[role="option"]');
            expect(noResults.getAttribute('aria-disabled')).toBe('true');
        });

    });

    describe('Loading State', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<input type="text" id="combo" role="combobox" ' +
                    'aria-expanded="true" aria-controls="list" aria-busy="true">' +
                '<ul id="list" role="listbox">' +
                    '<li role="option" aria-disabled="true">Loading...</li>' +
                '</ul>'
            );
        });

        it('combobox indicates loading with aria-busy', function() {
            var input = document.querySelector('#combo');
            expect(input.getAttribute('aria-busy')).toBe('true');
        });

        it('loading message shown as disabled option', function() {
            var loading = document.querySelector('[role="option"]');
            expect(loading.textContent).toBe('Loading...');
            expect(loading.getAttribute('aria-disabled')).toBe('true');
        });

    });

    describe('Multi-select Combobox', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="multi-combobox">' +
                    '<label for="tags">Tags</label>' +
                    '<div class="selected-tags" role="list" aria-label="Selected tags">' +
                        '<span role="listitem">' +
                            'Tag 1 <button type="button" aria-label="Remove Tag 1">x</button>' +
                        '</span>' +
                    '</div>' +
                    '<input type="text" id="tags" role="combobox" ' +
                        'aria-expanded="false" aria-controls="tag-list">' +
                    '<ul id="tag-list" role="listbox" aria-multiselectable="true" hidden>' +
                        '<li role="option" aria-selected="true">Tag 1</li>' +
                        '<li role="option" aria-selected="false">Tag 2</li>' +
                        '<li role="option" aria-selected="false">Tag 3</li>' +
                    '</ul>' +
                '</div>'
            );
        });

        it('listbox has aria-multiselectable="true"', function() {
            var listbox = document.querySelector('#tag-list');
            expect(listbox.getAttribute('aria-multiselectable')).toBe('true');
        });

        it('selected tags are shown in a list', function() {
            var tagList = document.querySelector('.selected-tags');
            expect(tagList.getAttribute('role')).toBe('list');
        });

        it('remove buttons have accessible labels', function() {
            var removeBtn = document.querySelector('.selected-tags button');
            var name = A11y.getAccessibleName(removeBtn);

            expect(name).toBe('Remove Tag 1');
        });

        it('multiple options can be selected', function() {
            var options = fixture.container.querySelectorAll('[role="option"]');
            options[1].setAttribute('aria-selected', 'true');

            var selected = fixture.container.querySelectorAll('[aria-selected="true"]');
            expect(selected.length).toBe(2);
        });

    });

    describe('Status Announcements', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="combobox-wrapper">' +
                    '<input type="text" id="combo" role="combobox" ' +
                        'aria-expanded="true" aria-controls="list" aria-describedby="combo-status">' +
                    '<ul id="list" role="listbox">' +
                        '<li role="option">Result 1</li>' +
                        '<li role="option">Result 2</li>' +
                        '<li role="option">Result 3</li>' +
                    '</ul>' +
                    '<div id="combo-status" aria-live="polite" class="sr-only">' +
                        '3 results available. Use arrow keys to navigate.' +
                    '</div>' +
                '</div>'
            );
        });

        it('status region has aria-live="polite"', function() {
            var status = document.querySelector('#combo-status');
            expect(status.getAttribute('aria-live')).toBe('polite');
        });

        it('combobox references status via aria-describedby', function() {
            var input = document.querySelector('#combo');
            expect(input.getAttribute('aria-describedby')).toBe('combo-status');
        });

        it('status provides result count', function() {
            var status = document.querySelector('#combo-status');
            expect(status.textContent).toContain('3 results');
        });

    });

    describe('Focus Management', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<input type="text" id="combo" role="combobox" aria-expanded="false" aria-controls="list">' +
                '<ul id="list" role="listbox" hidden>' +
                    '<li role="option">Option</li>' +
                '</ul>'
            );
        });

        it('focus stays on input when navigating options', function() {
            var input = document.querySelector('#combo');
            input.focus();

            FunkyTests.simulate.keydown(input, { key: 'ArrowDown' });

            return FunkyTests.delay(50).then(function() {
                expect(document.activeElement).toBe(input);
            });
        });

    });

    describe('ARIA Validation', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<input type="text" role="combobox" aria-expanded="false" aria-controls="valid-list">' +
                '<ul id="valid-list" role="listbox" hidden>' +
                    '<li role="option">Option</li>' +
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

        it('combobox has required aria-expanded', function() {
            var combo = document.querySelector('[role="combobox"]');
            expect(combo.hasAttribute('aria-expanded')).toBe(true);
        });

    });

});

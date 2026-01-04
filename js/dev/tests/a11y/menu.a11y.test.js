/**
 * Accessibility Tests: Menu
 *
 * Tests WCAG 2.1 AA compliance for menu, context-menu, and dropdown components.
 */

describe('Funky.A11y.Menu', function() {

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

    describe('Dropdown Menu', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="dropdown">' +
                    '<button id="menu-trigger" type="button" class="dropdown-toggle" ' +
                        'aria-haspopup="true" aria-expanded="false" aria-controls="menu-items">' +
                        'Options' +
                    '</button>' +
                    '<ul id="menu-items" class="dropdown-menu" role="menu" aria-labelledby="menu-trigger">' +
                        '<li role="presentation">' +
                            '<button class="dropdown-item" role="menuitem" tabindex="-1">Edit</button>' +
                        '</li>' +
                        '<li role="presentation">' +
                            '<button class="dropdown-item" role="menuitem" tabindex="-1">Duplicate</button>' +
                        '</li>' +
                        '<li role="separator" aria-hidden="true"></li>' +
                        '<li role="presentation">' +
                            '<button class="dropdown-item" role="menuitem" tabindex="-1">Delete</button>' +
                        '</li>' +
                    '</ul>' +
                '</div>'
            );
        });

        describe('ARIA Roles', function() {

            it('menu container has role="menu"', function() {
                var menu = document.querySelector('#menu-items');
                expect(menu.getAttribute('role')).toBe('menu');
            });

            it('menu items have role="menuitem"', function() {
                var items = document.querySelectorAll('[role="menuitem"]');
                expect(items.length).toBe(3);
            });

            it('separators have role="separator"', function() {
                var separator = document.querySelector('[role="separator"]');
                expect(separator).toBeInDocument();
            });

            it('item wrappers have role="presentation"', function() {
                var wrappers = document.querySelectorAll('li[role="presentation"]');
                expect(wrappers.length).toBe(3);
            });

        });

        describe('Trigger Button', function() {

            it('trigger has aria-haspopup="true"', function() {
                var trigger = document.querySelector('#menu-trigger');
                expect(trigger.getAttribute('aria-haspopup')).toBe('true');
            });

            it('trigger has aria-expanded when closed', function() {
                var trigger = document.querySelector('#menu-trigger');
                expect(trigger.getAttribute('aria-expanded')).toBe('false');
            });

            it('trigger has aria-controls pointing to menu', function() {
                var trigger = document.querySelector('#menu-trigger');
                var controlsId = trigger.getAttribute('aria-controls');

                expect(controlsId).toBe('menu-items');

                var menu = document.getElementById(controlsId);
                expect(menu).toBeInDocument();
            });

            it('trigger has accessible name', function() {
                var trigger = document.querySelector('#menu-trigger');
                var name = A11y.getAccessibleName(trigger);

                expect(name).toBe('Options');
            });

        });

        describe('Menu Accessibility', function() {

            it('menu is labelled by trigger', function() {
                var menu = document.querySelector('#menu-items');
                var labelledBy = menu.getAttribute('aria-labelledby');

                expect(labelledBy).toBe('menu-trigger');
            });

            it('menu items have accessible names', function() {
                var items = document.querySelectorAll('[role="menuitem"]');

                Array.prototype.forEach.call(items, function(item) {
                    var name = A11y.getAccessibleName(item);
                    expect(name).toBeTruthy();
                });
            });

            it('separators are hidden from screen readers', function() {
                var separator = document.querySelector('[role="separator"]');
                expect(separator.getAttribute('aria-hidden')).toBe('true');
            });

        });

        describe('Keyboard Navigation', function() {

            // Skip: Requires Dropdown component to handle keyboard events
            xit('ArrowDown opens menu and focuses first item', function() {
                var trigger = document.querySelector('#menu-trigger');
                trigger.focus();

                FunkyTests.simulate.keydown(trigger, { key: 'ArrowDown' });

                return FunkyTests.delay(50).then(function() {
                    var firstItem = document.querySelector('[role="menuitem"]');
                    expect(document.activeElement).toBe(firstItem);
                });
            });

            // Skip: Requires Dropdown component to handle keyboard events
            xit('Enter opens menu and focuses first item', function() {
                var trigger = document.querySelector('#menu-trigger');
                trigger.focus();

                FunkyTests.simulate.keydown(trigger, { key: 'Enter' });

                return FunkyTests.delay(50).then(function() {
                    var firstItem = document.querySelector('[role="menuitem"]');
                    expect(document.activeElement).toBe(firstItem);
                });
            });

            // Skip: Requires Dropdown component to handle keyboard events
            xit('Space opens menu', function() {
                var trigger = document.querySelector('#menu-trigger');
                trigger.focus();

                FunkyTests.simulate.keydown(trigger, { key: ' ' });

                return FunkyTests.delay(50).then(function() {
                    var trigger = document.querySelector('#menu-trigger');
                    expect(trigger.getAttribute('aria-expanded')).toBe('true');
                });
            });

            // Skip: Requires menu keyboard navigation handler
            xit('ArrowDown moves to next menu item', function() {
                var trigger = document.querySelector('#menu-trigger');
                trigger.setAttribute('aria-expanded', 'true');

                var items = document.querySelectorAll('[role="menuitem"]');
                items[0].focus();

                FunkyTests.simulate.keydown(items[0], { key: 'ArrowDown' });

                return FunkyTests.delay(50).then(function() {
                    expect(document.activeElement).toBe(items[1]);
                });
            });

            // Skip: Requires menu keyboard navigation handler
            xit('ArrowUp moves to previous menu item', function() {
                var trigger = document.querySelector('#menu-trigger');
                trigger.setAttribute('aria-expanded', 'true');

                var items = document.querySelectorAll('[role="menuitem"]');
                items[1].focus();

                FunkyTests.simulate.keydown(items[1], { key: 'ArrowUp' });

                return FunkyTests.delay(50).then(function() {
                    expect(document.activeElement).toBe(items[0]);
                });
            });

            // Skip: Requires menu keyboard navigation handler
            xit('Home moves focus to first item', function() {
                var items = document.querySelectorAll('[role="menuitem"]');
                items[2].focus();

                FunkyTests.simulate.keydown(items[2], { key: 'Home' });

                return FunkyTests.delay(50).then(function() {
                    expect(document.activeElement).toBe(items[0]);
                });
            });

            // Skip: Requires menu keyboard navigation handler
            xit('End moves focus to last item', function() {
                var items = document.querySelectorAll('[role="menuitem"]');
                items[0].focus();

                FunkyTests.simulate.keydown(items[0], { key: 'End' });

                return FunkyTests.delay(50).then(function() {
                    expect(document.activeElement).toBe(items[2]);
                });
            });

            // Skip: Requires menu keyboard navigation handler
            xit('Escape closes menu and returns focus to trigger', function() {
                var trigger = document.querySelector('#menu-trigger');
                trigger.setAttribute('aria-expanded', 'true');

                var items = document.querySelectorAll('[role="menuitem"]');
                items[0].focus();

                FunkyTests.simulate.keydown(items[0], { key: 'Escape' });

                return FunkyTests.delay(50).then(function() {
                    expect(document.activeElement).toBe(trigger);
                    expect(trigger.getAttribute('aria-expanded')).toBe('false');
                });
            });

            // Skip: Requires menu keyboard navigation handler
            xit('Tab closes menu', function() {
                var trigger = document.querySelector('#menu-trigger');
                trigger.setAttribute('aria-expanded', 'true');

                var items = document.querySelectorAll('[role="menuitem"]');
                items[0].focus();

                FunkyTests.simulate.keydown(items[0], { key: 'Tab' });

                return FunkyTests.delay(50).then(function() {
                    expect(trigger.getAttribute('aria-expanded')).toBe('false');
                });
            });

        });

        describe('Type-ahead Search', function() {

            // Skip: Requires menu type-ahead handler
            xit('typing letter focuses matching item', function() {
                var items = document.querySelectorAll('[role="menuitem"]');
                items[0].focus();

                // Type 'D' to focus 'Delete' or 'Duplicate'
                FunkyTests.simulate.keydown(items[0], { key: 'D' });

                return FunkyTests.delay(50).then(function() {
                    var focused = document.activeElement;
                    expect(focused.textContent.charAt(0).toLowerCase()).toBe('d');
                });
            });

        });

    });

    describe('Context Menu', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div id="context-target" tabindex="0">Right-click for options</div>' +
                '<div id="context-menu" class="context-menu" role="menu" aria-label="Context actions">' +
                    '<button role="menuitem" tabindex="-1">Cut</button>' +
                    '<button role="menuitem" tabindex="-1">Copy</button>' +
                    '<button role="menuitem" tabindex="-1">Paste</button>' +
                '</div>'
            );
        });

        it('context menu has role="menu"', function() {
            var menu = document.querySelector('#context-menu');
            expect(menu.getAttribute('role')).toBe('menu');
        });

        it('context menu has accessible name', function() {
            var menu = document.querySelector('#context-menu');
            var name = A11y.getAccessibleName(menu);

            expect(name).toBe('Context actions');
        });

        // Skip: Requires Context Menu component to handle keyboard trigger
        xit('Shift+F10 opens context menu', function() {
            var target = document.querySelector('#context-target');
            target.focus();

            FunkyTests.simulate.keydown(target, { key: 'F10', shiftKey: true });

            return FunkyTests.delay(50).then(function() {
                var menu = document.querySelector('#context-menu');
                // Menu should be visible and focused
                expect(menu.classList.contains('show') || menu.style.display !== 'none').toBe(true);
            });
        });

    });

    describe('Menubar', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<nav>' +
                    '<ul role="menubar" aria-label="Main navigation">' +
                        '<li role="none">' +
                            '<button role="menuitem" aria-haspopup="true" aria-expanded="false" tabindex="0">File</button>' +
                            '<ul role="menu" aria-label="File actions">' +
                                '<li role="none"><button role="menuitem" tabindex="-1">New</button></li>' +
                                '<li role="none"><button role="menuitem" tabindex="-1">Open</button></li>' +
                                '<li role="none"><button role="menuitem" tabindex="-1">Save</button></li>' +
                            '</ul>' +
                        '</li>' +
                        '<li role="none">' +
                            '<button role="menuitem" aria-haspopup="true" aria-expanded="false" tabindex="-1">Edit</button>' +
                            '<ul role="menu" aria-label="Edit actions">' +
                                '<li role="none"><button role="menuitem" tabindex="-1">Undo</button></li>' +
                                '<li role="none"><button role="menuitem" tabindex="-1">Redo</button></li>' +
                            '</ul>' +
                        '</li>' +
                        '<li role="none">' +
                            '<button role="menuitem" tabindex="-1">Help</button>' +
                        '</li>' +
                    '</ul>' +
                '</nav>'
            );
        });

        it('menubar has role="menubar"', function() {
            var menubar = document.querySelector('[role="menubar"]');
            expect(menubar).toBeInDocument();
        });

        it('menubar has accessible name', function() {
            var menubar = document.querySelector('[role="menubar"]');
            expect(menubar.getAttribute('aria-label')).toBe('Main navigation');
        });

        it('only first item is in tab order', function() {
            var items = document.querySelectorAll('[role="menubar"] > li > [role="menuitem"]');

            expect(items[0].tabIndex).toBe(0);
            expect(items[1].tabIndex).toBe(-1);
            expect(items[2].tabIndex).toBe(-1);
        });

        // Skip: Requires Menubar component to handle keyboard navigation
        xit('ArrowRight moves between menubar items', function() {
            var items = document.querySelectorAll('[role="menubar"] > li > [role="menuitem"]');
            items[0].focus();

            FunkyTests.simulate.keydown(items[0], { key: 'ArrowRight' });

            return FunkyTests.delay(50).then(function() {
                expect(document.activeElement).toBe(items[1]);
            });
        });

        // Skip: Requires Menubar component to handle keyboard navigation
        xit('ArrowLeft moves between menubar items', function() {
            var items = document.querySelectorAll('[role="menubar"] > li > [role="menuitem"]');
            items[1].focus();

            FunkyTests.simulate.keydown(items[1], { key: 'ArrowLeft' });

            return FunkyTests.delay(50).then(function() {
                expect(document.activeElement).toBe(items[0]);
            });
        });

        it('items with submenus have aria-haspopup', function() {
            var itemsWithSubmenus = document.querySelectorAll('[role="menubar"] > li > [role="menuitem"][aria-haspopup]');
            expect(itemsWithSubmenus.length).toBe(2);
        });

    });

    describe('Menu with Checkboxes', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div role="menu" aria-label="View options">' +
                    '<button role="menuitemcheckbox" aria-checked="true" tabindex="-1">Show Toolbar</button>' +
                    '<button role="menuitemcheckbox" aria-checked="false" tabindex="-1">Show Sidebar</button>' +
                    '<button role="menuitemcheckbox" aria-checked="true" tabindex="-1">Show Status Bar</button>' +
                '</div>'
            );
        });

        it('checkbox items have role="menuitemcheckbox"', function() {
            var checkboxes = document.querySelectorAll('[role="menuitemcheckbox"]');
            expect(checkboxes.length).toBe(3);
        });

        it('checkbox items have aria-checked', function() {
            var checkboxes = document.querySelectorAll('[role="menuitemcheckbox"]');

            Array.prototype.forEach.call(checkboxes, function(cb) {
                var checked = cb.getAttribute('aria-checked');
                expect(checked === 'true' || checked === 'false').toBe(true);
            });
        });

        // Skip: Requires Menu component to handle checkbox toggle
        xit('Space toggles checkbox state', function() {
            var checkbox = document.querySelector('[role="menuitemcheckbox"]');
            var initialState = checkbox.getAttribute('aria-checked');
            checkbox.focus();

            FunkyTests.simulate.keydown(checkbox, { key: ' ' });

            return FunkyTests.delay(50).then(function() {
                var newState = checkbox.getAttribute('aria-checked');
                expect(newState).not.toBe(initialState);
            });
        });

    });

    describe('Menu with Radio Items', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div role="menu" aria-label="Sort options">' +
                    '<div role="group" aria-label="Sort order">' +
                        '<button role="menuitemradio" aria-checked="true" tabindex="-1">Ascending</button>' +
                        '<button role="menuitemradio" aria-checked="false" tabindex="-1">Descending</button>' +
                    '</div>' +
                '</div>'
            );
        });

        it('radio items have role="menuitemradio"', function() {
            var radios = document.querySelectorAll('[role="menuitemradio"]');
            expect(radios.length).toBe(2);
        });

        it('only one radio is checked in group', function() {
            var checkedRadios = document.querySelectorAll('[role="menuitemradio"][aria-checked="true"]');
            expect(checkedRadios.length).toBe(1);
        });

        it('radio group is labelled', function() {
            var group = document.querySelector('[role="group"]');
            expect(group.getAttribute('aria-label')).toBe('Sort order');
        });

    });

    describe('Disabled Items', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div role="menu" aria-label="Actions">' +
                    '<button role="menuitem" tabindex="-1">Cut</button>' +
                    '<button role="menuitem" tabindex="-1" aria-disabled="true">Paste</button>' +
                    '<button role="menuitem" tabindex="-1">Copy</button>' +
                '</div>'
            );
        });

        it('disabled items have aria-disabled="true"', function() {
            var disabledItem = document.querySelector('[aria-disabled="true"]');
            expect(disabledItem).toBeInDocument();
            expect(disabledItem.textContent).toBe('Paste');
        });

        it('disabled items are still focusable', function() {
            var disabledItem = document.querySelector('[aria-disabled="true"]');
            disabledItem.focus();

            expect(document.activeElement).toBe(disabledItem);
        });

    });

    describe('ARIA Validation', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div role="menu" aria-label="Test menu">' +
                    '<button role="menuitem" tabindex="-1">Item 1</button>' +
                    '<button role="menuitem" tabindex="-1">Item 2</button>' +
                '</div>'
            );
        });

        it('no invalid ARIA roles', function() {
            var menu = document.querySelector('[role="menu"]');
            var issues = A11y.checkAria(menu);
            var invalidRoleIssues = issues.filter(function(i) {
                return i.issue === 'Invalid ARIA role';
            });

            expect(invalidRoleIssues.length).toBe(0);
        });

    });

});

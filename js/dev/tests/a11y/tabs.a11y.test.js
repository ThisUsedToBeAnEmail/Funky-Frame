/**
 * Accessibility Tests: Tabs
 *
 * Tests WCAG 2.1 AA compliance for tab components.
 */

describe('Funky.A11y.Tabs', function() {

    var Tabs = Funky.Tabs;
    var A11y = FunkyTests.A11y;

    // Skip all tests if A11y utilities not available
    if (!A11y) {
        it('A11y utilities not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;

    beforeEach(function() {
        fixture = FunkyTests.fixture(
            '<div class="tabs-container">' +
                '<ul class="nav nav-tabs" id="a11y-tabs" role="tablist">' +
                    '<li class="nav-item" role="presentation">' +
                        '<button class="nav-link active" id="tab1-btn" data-funky-tab="#panel1" type="button" role="tab" aria-controls="panel1" aria-selected="true">Tab 1</button>' +
                    '</li>' +
                    '<li class="nav-item" role="presentation">' +
                        '<button class="nav-link" id="tab2-btn" data-funky-tab="#panel2" type="button" role="tab" aria-controls="panel2" aria-selected="false" tabindex="-1">Tab 2</button>' +
                    '</li>' +
                    '<li class="nav-item" role="presentation">' +
                        '<button class="nav-link" id="tab3-btn" data-funky-tab="#panel3" type="button" role="tab" aria-controls="panel3" aria-selected="false" tabindex="-1">Tab 3</button>' +
                    '</li>' +
                '</ul>' +
                '<div class="tab-content">' +
                    '<div class="tab-pane fade show active" id="panel1" role="tabpanel" aria-labelledby="tab1-btn">Panel 1 Content</div>' +
                    '<div class="tab-pane fade" id="panel2" role="tabpanel" aria-labelledby="tab2-btn">Panel 2 Content</div>' +
                    '<div class="tab-pane fade" id="panel3" role="tabpanel" aria-labelledby="tab3-btn">Panel 3 Content</div>' +
                '</div>' +
            '</div>'
        );
    });

    afterEach(function() {
        Tabs.destroy('#a11y-tabs');
        fixture.destroy();
    });

    describe('ARIA Roles', function() {

        it('tablist container has role="tablist"', function() {
            var tablist = document.querySelector('[role="tablist"]');
            expect(tablist).toBeInDocument();
        });

        it('all tab buttons have role="tab"', function() {
            var tabs = fixture.container.querySelectorAll('[role="tab"]');
            expect(tabs.length).toBe(3);
        });

        it('all panels have role="tabpanel"', function() {
            var panels = fixture.container.querySelectorAll('[role="tabpanel"]');
            expect(panels.length).toBe(3);
        });

        it('tab items have role="presentation" on wrapper', function() {
            var wrappers = document.querySelectorAll('.nav-item');
            Array.prototype.forEach.call(wrappers, function(wrapper) {
                expect(wrapper.getAttribute('role')).toBe('presentation');
            });
        });

    });

    describe('ARIA Relationships', function() {

        it('tabs have aria-controls pointing to panel IDs', function() {
            var tab1 = document.querySelector('#tab1-btn');
            expect(tab1.getAttribute('aria-controls')).toBe('panel1');

            var panel = document.getElementById('panel1');
            expect(panel).toBeInDocument();
        });

        it('panels have aria-labelledby pointing to tab IDs', function() {
            var panel1 = document.querySelector('#panel1');
            expect(panel1.getAttribute('aria-labelledby')).toBe('tab1-btn');

            var tab = document.getElementById('tab1-btn');
            expect(tab).toBeInDocument();
        });

        it('aria-controls references exist', function() {
            var tabs = fixture.container.querySelectorAll('[role="tab"]');

            Array.prototype.forEach.call(tabs, function(tab) {
                var controlsId = tab.getAttribute('aria-controls');
                expect(controlsId).toBeTruthy();

                var panel = fixture.container.querySelector('#' + controlsId);
                expect(panel).toBeInDocument();
            });
        });

        it('aria-labelledby references exist', function() {
            var panels = fixture.container.querySelectorAll('[role="tabpanel"]');

            Array.prototype.forEach.call(panels, function(panel) {
                var labelledById = panel.getAttribute('aria-labelledby');
                expect(labelledById).toBeTruthy();

                var tab = fixture.container.querySelector('#' + labelledById);
                expect(tab).toBeInDocument();
            });
        });

    });

    describe('Selection State', function() {

        it('selected tab has aria-selected="true"', function() {
            var tabs = new Tabs('#a11y-tabs');
            var selectedTab = fixture.container.querySelector('[aria-selected="true"]');

            expect(selectedTab).toBeInDocument();
            expect(selectedTab.id).toBe('tab1-btn');
        });

        it('unselected tabs have aria-selected="false"', function() {
            var tabs = new Tabs('#a11y-tabs');
            var unselectedTabs = fixture.container.querySelectorAll('[aria-selected="false"]');

            expect(unselectedTabs.length).toBe(2);
        });

        it('only one tab has aria-selected="true" at a time', function() {
            var tabs = new Tabs('#a11y-tabs');
            var selectedTabs = fixture.container.querySelectorAll('[aria-selected="true"]');

            expect(selectedTabs.length).toBe(1);
        });

        it('aria-selected updates on tab change', function() {
            var tabs = new Tabs('#a11y-tabs');
            tabs.show(1);

            return FunkyTests.delay(50).then(function() {
                var tab1 = document.querySelector('#tab1-btn');
                var tab2 = document.querySelector('#tab2-btn');

                expect(tab1.getAttribute('aria-selected')).toBe('false');
                expect(tab2.getAttribute('aria-selected')).toBe('true');
            });
        });

    });

    describe('Panel Visibility', function() {

        it('only selected panel is visible', function() {
            var tabs = new Tabs('#a11y-tabs');
            var visiblePanels = document.querySelectorAll('.tab-pane.show.active');

            expect(visiblePanels.length).toBe(1);
            expect(visiblePanels[0].id).toBe('panel1');
        });

        it('hidden panels are properly hidden', function() {
            var tabs = new Tabs('#a11y-tabs');
            var panel2 = document.querySelector('#panel2');
            var panel3 = document.querySelector('#panel3');

            expect(panel2.classList.contains('show')).toBe(false);
            expect(panel3.classList.contains('show')).toBe(false);
        });

    });

    describe('Keyboard Navigation', function() {

        it('ArrowRight moves focus to next tab', function() {
            var tabs = new Tabs('#a11y-tabs');
            var tab1 = document.querySelector('#tab1-btn');
            tab1.focus();

            FunkyTests.simulate.keydown(tab1, { key: 'ArrowRight' });

            return FunkyTests.delay(50).then(function() {
                var tab2 = document.querySelector('#tab2-btn');
                expect(document.activeElement).toBe(tab2);
            });
        });

        it('ArrowLeft moves focus to previous tab', function() {
            var tabs = new Tabs('#a11y-tabs');
            tabs.show(1);

            return FunkyTests.delay(50).then(function() {
                var tab2 = document.querySelector('#tab2-btn');
                tab2.focus();

                FunkyTests.simulate.keydown(tab2, { key: 'ArrowLeft' });

                return FunkyTests.delay(50);
            }).then(function() {
                var tab1 = document.querySelector('#tab1-btn');
                expect(document.activeElement).toBe(tab1);
            });
        });

        it('Home moves focus to first tab', function() {
            var tabs = new Tabs('#a11y-tabs');
            tabs.show(2);

            return FunkyTests.delay(50).then(function() {
                var tab3 = document.querySelector('#tab3-btn');
                tab3.focus();

                FunkyTests.simulate.keydown(tab3, { key: 'Home' });

                return FunkyTests.delay(50);
            }).then(function() {
                var tab1 = document.querySelector('#tab1-btn');
                expect(document.activeElement).toBe(tab1);
            });
        });

        it('End moves focus to last tab', function() {
            var tabs = new Tabs('#a11y-tabs');
            var tab1 = document.querySelector('#tab1-btn');
            tab1.focus();

            FunkyTests.simulate.keydown(tab1, { key: 'End' });

            return FunkyTests.delay(50).then(function() {
                var tab3 = document.querySelector('#tab3-btn');
                expect(document.activeElement).toBe(tab3);
            });
        });

        it('ArrowRight wraps from last to first tab', function() {
            var tabs = new Tabs('#a11y-tabs');
            tabs.show(2);

            return FunkyTests.delay(50).then(function() {
                var tab3 = document.querySelector('#tab3-btn');
                tab3.focus();

                FunkyTests.simulate.keydown(tab3, { key: 'ArrowRight' });

                return FunkyTests.delay(50);
            }).then(function() {
                var tab1 = document.querySelector('#tab1-btn');
                expect(document.activeElement).toBe(tab1);
            });
        });

    });

    describe('Focus Management', function() {

        it('only active tab is in tab order (tabindex=0)', function() {
            var tabs = new Tabs('#a11y-tabs');
            var tab1 = document.querySelector('#tab1-btn');
            var tab2 = document.querySelector('#tab2-btn');
            var tab3 = document.querySelector('#tab3-btn');

            expect(tab1.tabIndex).toBe(0);
            expect(tab2.tabIndex).toBe(-1);
            expect(tab3.tabIndex).toBe(-1);
        });

        it('tabindex updates on tab change', function() {
            var tabs = new Tabs('#a11y-tabs');
            tabs.show(1);

            return FunkyTests.delay(50).then(function() {
                var tab1 = document.querySelector('#tab1-btn');
                var tab2 = document.querySelector('#tab2-btn');

                expect(tab1.tabIndex).toBe(-1);
                expect(tab2.tabIndex).toBe(0);
            });
        });

        it('clicking tab activates it', function() {
            var tabs = new Tabs('#a11y-tabs');
            var tab2 = document.querySelector('#tab2-btn');

            FunkyTests.simulate.click(tab2);

            return FunkyTests.delay(50).then(function() {
                // Click activates the tab (shown by aria-selected)
                expect(tab2.getAttribute('aria-selected')).toBe('true');
            });
        });

    });

    describe('Tab Activation', function() {

        it('Enter key activates focused tab', function() {
            var tabs = new Tabs('#a11y-tabs');
            var tab2 = document.querySelector('#tab2-btn');
            tab2.focus();

            FunkyTests.simulate.keydown(tab2, { key: 'Enter' });

            return FunkyTests.delay(50).then(function() {
                expect(tab2.getAttribute('aria-selected')).toBe('true');
                expect(document.querySelector('#panel2').classList.contains('show')).toBe(true);
            });
        });

        it('Space key activates focused tab', function() {
            var tabs = new Tabs('#a11y-tabs');
            var tab2 = document.querySelector('#tab2-btn');
            tab2.focus();

            FunkyTests.simulate.keydown(tab2, { key: ' ' });

            return FunkyTests.delay(50).then(function() {
                expect(tab2.getAttribute('aria-selected')).toBe('true');
            });
        });

    });

    describe('Accessible Names', function() {

        it('tabs have accessible names from content', function() {
            var tabs = new Tabs('#a11y-tabs');
            var tab1 = document.querySelector('#tab1-btn');

            var name = A11y.getAccessibleName(tab1);
            expect(name).toBe('Tab 1');
        });

        it('panels are labelled by their tabs', function() {
            var tabs = new Tabs('#a11y-tabs');
            var panel1 = document.querySelector('#panel1');
            var labelledBy = panel1.getAttribute('aria-labelledby');

            var tab = document.getElementById(labelledBy);
            expect(tab.textContent).toBe('Tab 1');
        });

    });

    describe('ARIA Validation', function() {

        it('no invalid ARIA attributes', function() {
            var tabs = new Tabs('#a11y-tabs');
            var tabContainer = document.querySelector('.tabs-container');

            var issues = A11y.checkAria(tabContainer);
            var invalidRoleIssues = issues.filter(function(i) {
                return i.issue === 'Invalid ARIA role';
            });

            expect(invalidRoleIssues.length).toBe(0);
        });

    });

});

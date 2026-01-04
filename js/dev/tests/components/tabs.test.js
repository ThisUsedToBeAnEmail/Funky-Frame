/**
 * Funky.Tabs Tests
 *
 * Tests for the native tab system.
 */

describe('Funky.Component.Tabs', function() {

    var Tabs = Funky.Tabs;
    var fixture;

    beforeEach(function() {
        fixture = FunkyTests.fixture(
            '<div id="tabs-test">' +
                '<ul class="nav nav-tabs" id="myTabs" role="tablist">' +
                    '<li class="nav-item" role="presentation">' +
                        '<button class="nav-link active" data-funky-tab="#tab1" type="button">Tab 1</button>' +
                    '</li>' +
                    '<li class="nav-item" role="presentation">' +
                        '<button class="nav-link" data-funky-tab="#tab2" type="button">Tab 2</button>' +
                    '</li>' +
                    '<li class="nav-item" role="presentation">' +
                        '<button class="nav-link" data-funky-tab="#tab3" type="button">Tab 3</button>' +
                    '</li>' +
                '</ul>' +
                '<div class="tab-content">' +
                    '<div class="tab-pane fade show active" id="tab1">Content 1</div>' +
                    '<div class="tab-pane fade" id="tab2">Content 2</div>' +
                    '<div class="tab-pane fade" id="tab3">Content 3</div>' +
                '</div>' +
            '</div>'
        );
    });

    afterEach(function() {
        Tabs.destroy('#myTabs');
        fixture.destroy();
    });

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('Tabs')).toBe(true);
        });

        it('is a constructor', function() {
            expect(typeof Tabs).toBe('function');
        });

        it('has static init method', function() {
            expect(typeof Tabs.init).toBe('function');
        });

        it('has static show method', function() {
            expect(typeof Tabs.show).toBe('function');
        });

        it('has getInstance method', function() {
            expect(typeof Tabs.getInstance).toBe('function');
        });

        it('has getOrCreateInstance method', function() {
            expect(typeof Tabs.getOrCreateInstance).toBe('function');
        });

    });

    describe('Constructor', function() {

        it('creates instance from selector', function() {
            var tabs = new Tabs('#myTabs');
            expect(tabs).toBeDefined();
            expect(tabs.el).toBe(document.getElementById('myTabs'));
        });

        it('creates instance from element', function() {
            var el = document.getElementById('myTabs');
            var tabs = new Tabs(el);
            expect(tabs.el).toBe(el);
        });

        it('finds tab buttons', function() {
            var tabs = new Tabs('#myTabs');
            expect(tabs.tabButtons.length).toBe(3);
        });

        it('finds tab panels', function() {
            var tabs = new Tabs('#myTabs');
            expect(tabs.tabPanels.length).toBe(3);
        });

    });

    describe('show()', function() {

        it('shows tab by index', function() {
            var tabs = new Tabs('#myTabs');
            tabs.show(1);

            return FunkyTests.delay(50).then(function() {
                var panel2 = document.getElementById('tab2');
                expect(panel2.classList.contains('show')).toBe(true);
                expect(panel2.classList.contains('active')).toBe(true);
            });
        });

        it('shows tab by selector', function() {
            var tabs = new Tabs('#myTabs');
            tabs.show('#tab2');

            return FunkyTests.delay(50).then(function() {
                var panel2 = document.getElementById('tab2');
                expect(panel2.classList.contains('show')).toBe(true);
            });
        });

        it('shows tab by button element', function() {
            var tabs = new Tabs('#myTabs');
            var button = document.querySelector('[data-funky-tab="#tab2"]');
            tabs.show(button);

            return FunkyTests.delay(50).then(function() {
                expect(button.classList.contains('active')).toBe(true);
            });
        });

        it('hides previous tab', function() {
            var tabs = new Tabs('#myTabs');
            tabs.show(1);

            return FunkyTests.delay(50).then(function() {
                var panel1 = document.getElementById('tab1');
                expect(panel1.classList.contains('show')).toBe(false);
                expect(panel1.classList.contains('active')).toBe(false);
            });
        });

        it('updates button active state', function() {
            var tabs = new Tabs('#myTabs');
            tabs.show(1);

            return FunkyTests.delay(50).then(function() {
                var buttons = document.querySelectorAll('[data-funky-tab]');
                expect(buttons[0].classList.contains('active')).toBe(false);
                expect(buttons[1].classList.contains('active')).toBe(true);
            });
        });

    });

    describe('getActive()', function() {

        it('returns current active tab info', function() {
            var tabs = new Tabs('#myTabs');
            var active = tabs.getActive();

            expect(active).toBeDefined();
            expect(active.tabId).toBe('tab1');
            expect(active.button).toBeDefined();
            expect(active.panel).toBeDefined();
        });

        it('updates after tab change', function() {
            var tabs = new Tabs('#myTabs');
            tabs.show(2);

            return FunkyTests.delay(50).then(function() {
                var active = tabs.getActive();
                expect(active.tabId).toBe('tab3');
            });
        });

    });

    describe('getTab()', function() {

        it('gets tab by index', function() {
            var tabs = new Tabs('#myTabs');
            var tab = tabs.getTab(1);

            expect(tab).toBeDefined();
            expect(tab.getAttribute('data-funky-tab')).toBe('#tab2');
        });

        it('gets tab by panel ID', function() {
            var tabs = new Tabs('#myTabs');
            var tab = tabs.getTab('#tab2');

            expect(tab).toBeDefined();
        });

        it('returns null for non-existent', function() {
            var tabs = new Tabs('#myTabs');
            var tab = tabs.getTab(99);

            expect(tab).toBeNull();
        });

    });

    describe('Click handling', function() {

        it('clicking tab button shows tab', function() {
            var tabs = new Tabs('#myTabs');
            var button = document.querySelector('[data-funky-tab="#tab2"]');

            FunkyTests.simulate.click(button);

            return FunkyTests.delay(50).then(function() {
                expect(button.classList.contains('active')).toBe(true);
                expect(document.getElementById('tab2').classList.contains('show')).toBe(true);
            });
        });

    });

    describe('Keyboard navigation', function() {

        it('ArrowRight moves to next tab', function() {
            var tabs = new Tabs('#myTabs');
            var button1 = document.querySelector('[data-funky-tab="#tab1"]');
            button1.focus();

            FunkyTests.simulate.keydown(button1, { key: 'ArrowRight' });

            return FunkyTests.delay(50).then(function() {
                var button2 = document.querySelector('[data-funky-tab="#tab2"]');
                expect(button2.classList.contains('active')).toBe(true);
            });
        });

        it('ArrowLeft moves to previous tab', function() {
            var tabs = new Tabs('#myTabs');
            tabs.show(1);

            return FunkyTests.delay(200).then(function() {
                var button2 = document.querySelector('[data-funky-tab="#tab2"]');
                button2.focus();

                FunkyTests.simulate.keydown(button2, { key: 'ArrowLeft' });

                return FunkyTests.delay(200);
            }).then(function() {
                var button1 = document.querySelector('[data-funky-tab="#tab1"]');
                expect(button1.classList.contains('active')).toBe(true);
            });
        });

        it('Home moves to first tab', function() {
            var tabs = new Tabs('#myTabs');
            tabs.show(2);

            return FunkyTests.delay(200).then(function() {
                var button3 = document.querySelector('[data-funky-tab="#tab3"]');
                button3.focus();

                FunkyTests.simulate.keydown(button3, { key: 'Home' });

                return FunkyTests.delay(200);
            }).then(function() {
                var button1 = document.querySelector('[data-funky-tab="#tab1"]');
                expect(button1.classList.contains('active')).toBe(true);
            });
        });

        it('End moves to last tab', function() {
            var tabs = new Tabs('#myTabs');
            var button1 = document.querySelector('[data-funky-tab="#tab1"]');
            button1.focus();

            FunkyTests.simulate.keydown(button1, { key: 'End' });

            return FunkyTests.delay(50).then(function() {
                var button3 = document.querySelector('[data-funky-tab="#tab3"]');
                expect(button3.classList.contains('active')).toBe(true);
            });
        });

    });

    describe('Accessibility', function() {

        it('buttons have role="tab"', function() {
            new Tabs('#myTabs');
            var buttons = document.querySelectorAll('[data-funky-tab]');

            buttons.forEach(function(button) {
                expect(button.getAttribute('role')).toBe('tab');
            });
        });

        it('buttons have aria-controls', function() {
            new Tabs('#myTabs');
            var button = document.querySelector('[data-funky-tab="#tab1"]');

            expect(button.getAttribute('aria-controls')).toBe('tab1');
        });

        it('active button has aria-selected="true"', function() {
            new Tabs('#myTabs');
            var button = document.querySelector('[data-funky-tab="#tab1"]');

            expect(button.getAttribute('aria-selected')).toBe('true');
        });

        it('inactive buttons have aria-selected="false"', function() {
            new Tabs('#myTabs');
            var button = document.querySelector('[data-funky-tab="#tab2"]');

            expect(button.getAttribute('aria-selected')).toBe('false');
        });

        it('panels have role="tabpanel"', function() {
            new Tabs('#myTabs');
            var panels = document.querySelectorAll('.tab-pane');

            panels.forEach(function(panel) {
                expect(panel.getAttribute('role')).toBe('tabpanel');
            });
        });

    });

    describe('Events', function() {

        it('emits funky:tabs:show event', function() {
            var eventFired = false;
            var tabs = new Tabs('#myTabs');

            Funky.PubSub.on('funky:tabs:show', function() {
                eventFired = true;
            });

            tabs.show(1);

            expect(eventFired).toBe(true);

            Funky.PubSub.off('funky:tabs:show');
        });

        it('emits funky:tabs:shown event after transition', function() {
            var eventFired = false;
            var tabs = new Tabs('#myTabs');

            Funky.PubSub.on('funky:tabs:shown', function() {
                eventFired = true;
            });

            tabs.show(1);

            return FunkyTests.delay(200).then(function() {
                expect(eventFired).toBe(true);
                Funky.PubSub.off('funky:tabs:shown');
            });
        });

        it('calls onChange callback', function() {
            var changedTo = null;
            var tabs = new Tabs('#myTabs', {
                onChange: function(tabId) {
                    changedTo = tabId;
                }
            });

            tabs.show(1);

            expect(changedTo).toBe('tab2');
        });

    });

    describe('Options', function() {

        it('activeTab option sets initial tab by index', function() {
            var tabs = new Tabs('#myTabs', { activeTab: 1 });
            var active = tabs.getActive();

            expect(active.tabId).toBe('tab2');
        });

        it('activeTab option sets initial tab by ID', function() {
            var tabs = new Tabs('#myTabs', { activeTab: '#tab3' });
            var active = tabs.getActive();

            expect(active.tabId).toBe('tab3');
        });

    });

    describe('Static methods', function() {

        it('Tabs.show() works', function() {
            Tabs.show('#tab2');

            return FunkyTests.delay(50).then(function() {
                var panel = document.getElementById('tab2');
                expect(panel.classList.contains('show')).toBe(true);
            });
        });

        it('getInstance returns existing instance', function() {
            var tabs = new Tabs('#myTabs');
            var instance = Tabs.getInstance('#myTabs');

            expect(instance).toBe(tabs);
        });

        it('getOrCreateInstance creates if needed', function() {
            var instance = Tabs.getOrCreateInstance('#myTabs');
            expect(instance).toBeDefined();
        });

    });

    describe('dispose()', function() {

        it('cleans up instance', function() {
            var tabs = new Tabs('#myTabs');
            tabs.dispose();

            expect(tabs.tabButtons.length).toBe(0);
            expect(tabs.tabPanels.length).toBe(0);
        });

        it('removes from instances registry', function() {
            var tabs = new Tabs('#myTabs');
            tabs.dispose();

            expect(Tabs.getInstance('#myTabs')).toBeNull();
        });

    });

});

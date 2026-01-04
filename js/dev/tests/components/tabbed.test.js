/**
 * Funky.Tabbed Tests
 *
 * Tests for the Tabbed component which manages tabs with support for
 * CRUD, DataTable, Form, and Custom tab types with lifecycle hooks.
 */

describe('Funky.Component.Tabbed', function() {

    var Tabbed = Funky.Tabbed;
    var Tabs = Funky.Tabs;
    var fixture;
    var tabbed;
    var tabsId;
    var contentId;
    var testCounter = 0;

    beforeEach(function() {
        testCounter++;
        var unique = testCounter + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        tabsId = 'tabbed-test-' + unique;
        contentId = tabsId + 'Content';

        // Clear URL hash to prevent interference with tab selection
        if (window.location.hash) {
            history.replaceState(null, '', window.location.pathname + window.location.search);
        }

        // Create tabs structure matching Funky.Tabs pattern
        fixture = FunkyTests.fixture(
            '<ul id="' + tabsId + '" class="nav nav-tabs" role="tablist">' +
                '<li class="nav-item" role="presentation">' +
                    '<button class="nav-link active" id="tab1-tab" data-funky-tab="#tab1" type="button" role="tab" aria-controls="tab1" aria-selected="true">Tab 1</button>' +
                '</li>' +
                '<li class="nav-item" role="presentation">' +
                    '<button class="nav-link" id="tab2-tab" data-funky-tab="#tab2" type="button" role="tab" aria-controls="tab2" aria-selected="false">Tab 2</button>' +
                '</li>' +
                '<li class="nav-item" role="presentation">' +
                    '<button class="nav-link" id="tab3-tab" data-funky-tab="#tab3" type="button" role="tab" aria-controls="tab3" aria-selected="false">Tab 3</button>' +
                '</li>' +
            '</ul>' +
            '<div id="' + contentId + '" class="tab-content">' +
                '<div class="tab-pane fade show active" id="tab1" role="tabpanel" aria-labelledby="tab1-tab"></div>' +
                '<div class="tab-pane fade" id="tab2" role="tabpanel" aria-labelledby="tab2-tab"></div>' +
                '<div class="tab-pane fade" id="tab3" role="tabpanel" aria-labelledby="tab3-tab"></div>' +
            '</div>'
        );

        // Initialize Funky.Tabs on the container
        if (Tabs && Tabs.init) {
            Tabs.init('#' + tabsId);
        }
    });

    afterEach(function() {
        if (tabbed && typeof tabbed.destroy === 'function') {
            tabbed.destroy();
            tabbed = null;
        }

        // Clean up localStorage
        localStorage.removeItem('funky_tabbed_' + tabsId);

        fixture.destroy();
    });

    // =========================================================================
    // Module Structure
    // =========================================================================

    describe('Module Structure', function() {

        it('Funky.Tabbed is registered', function() {
            expect(Tabbed).toBeDefined();
        });

        it('has init method', function() {
            expect(typeof Tabbed.init).toBe('function');
        });

        it('has getInstance method', function() {
            expect(typeof Tabbed.getInstance).toBe('function');
        });

        it('has destroyAll method', function() {
            expect(typeof Tabbed.destroyAll).toBe('function');
        });

    });

    // =========================================================================
    // Initialisation
    // =========================================================================

    describe('Initialisation', function() {

        it('creates instance with config', function() {
            tabbed = Tabbed.init({
                containerId: tabsId,
                tabs: [
                    { id: 'tab1', label: 'Tab 1', type: 'custom' },
                    { id: 'tab2', label: 'Tab 2', type: 'custom' }
                ]
            });

            expect(tabbed).toBeDefined();
        });

        it('assigns ID from config', function() {
            tabbed = Tabbed.init({
                id: 'myTabbedInstance',
                containerId: tabsId,
                tabs: [{ id: 'tab1', type: 'custom' }]
            });

            expect(tabbed.id).toBe('myTabbedInstance');
        });

        it('auto-derives content container ID', function() {
            tabbed = Tabbed.init({
                containerId: tabsId,
                tabs: [{ id: 'tab1', type: 'custom' }]
            });

            expect(tabbed.contentContainerId).toBe(contentId);
        });

        it('stores tab container reference', function() {
            tabbed = Tabbed.init({
                containerId: tabsId,
                tabs: [{ id: 'tab1', type: 'custom' }]
            });

            expect(tabbed.tabContainer).toBe(document.getElementById(tabsId));
        });

        it('stores content container reference', function() {
            tabbed = Tabbed.init({
                containerId: tabsId,
                tabs: [{ id: 'tab1', type: 'custom' }]
            });

            expect(tabbed.contentContainer).toBe(document.getElementById(contentId));
        });

        it('registers tabs from array config', function() {
            tabbed = Tabbed.init({
                containerId: tabsId,
                tabs: [
                    { id: 'tab1', label: 'Tab 1', type: 'custom' },
                    { id: 'tab2', label: 'Tab 2', type: 'custom' }
                ]
            });

            expect(tabbed.tabs['tab1']).toBeDefined();
            expect(tabbed.tabs['tab2']).toBeDefined();
        });

        it('registers tabs from object config', function() {
            tabbed = Tabbed.init({
                containerId: tabsId,
                tabs: {
                    tab1: { label: 'Tab 1', type: 'custom' },
                    tab2: { label: 'Tab 2', type: 'custom' }
                }
            });

            expect(tabbed.tabs['tab1']).toBeDefined();
            expect(tabbed.tabs['tab2']).toBeDefined();
        });

        it('maintains tab order', function() {
            tabbed = Tabbed.init({
                containerId: tabsId,
                tabs: [
                    { id: 'tab1', type: 'custom' },
                    { id: 'tab2', type: 'custom' },
                    { id: 'tab3', type: 'custom' }
                ]
            });

            expect(tabbed.tabOrder).toEqual(['tab1', 'tab2', 'tab3']);
        });

    });

    // =========================================================================
    // Tab Registration
    // =========================================================================

    describe('Tab Registration', function() {

        it('stores tab ID', function() {
            tabbed = Tabbed.init({
                containerId: tabsId,
                tabs: [{ id: 'tab1', type: 'custom' }]
            });

            expect(tabbed.tabs['tab1'].id).toBe('tab1');
        });

        it('stores tab label', function() {
            tabbed = Tabbed.init({
                containerId: tabsId,
                tabs: [{ id: 'tab1', label: 'My Tab', type: 'custom' }]
            });

            expect(tabbed.tabs['tab1'].label).toBe('My Tab');
        });

        it('defaults label to ID', function() {
            tabbed = Tabbed.init({
                containerId: tabsId,
                tabs: [{ id: 'tab1', type: 'custom' }]
            });

            expect(tabbed.tabs['tab1'].label).toBe('tab1');
        });

        it('stores tab type', function() {
            tabbed = Tabbed.init({
                containerId: tabsId,
                tabs: [{ id: 'tab1', type: 'form' }]
            });

            expect(tabbed.tabs['tab1'].type).toBe('form');
        });

        it('defaults type to custom', function() {
            tabbed = Tabbed.init({
                containerId: tabsId,
                tabs: [{ id: 'tab1' }]
            });

            expect(tabbed.tabs['tab1'].type).toBe('custom');
        });

        it('stores tab config', function() {
            tabbed = Tabbed.init({
                containerId: tabsId,
                tabs: [{ id: 'tab1', type: 'custom', config: { foo: 'bar' } }]
            });

            expect(tabbed.tabs['tab1'].config.foo).toBe('bar');
        });

        it('stores lifecycle callbacks', function() {
            var onInit = function() {};
            var onShow = function() {};
            var onHide = function() {};

            tabbed = Tabbed.init({
                containerId: tabsId,
                tabs: [{ id: 'tab1', type: 'custom', onInit: onInit, onShow: onShow, onHide: onHide }]
            });

            expect(tabbed.tabs['tab1'].onInit).toBe(onInit);
            expect(tabbed.tabs['tab1'].onShow).toBe(onShow);
            expect(tabbed.tabs['tab1'].onHide).toBe(onHide);
        });

    });

    // =========================================================================
    // Initial Tab Selection
    // =========================================================================

    describe('Initial Tab Selection', function() {

        it('uses defaultTab from config', function(done) {
            tabbed = Tabbed.init({
                containerId: tabsId,
                defaultTab: 'tab2',
                tabs: [
                    { id: 'tab1', type: 'custom' },
                    { id: 'tab2', type: 'custom' }
                ]
            });

            // Wait for async initialization
            setTimeout(function() {
                expect(tabbed.activeTabId).toBe('tab2');
                done();
            }, 200);
        });

        it('uses first tab when no default specified', function(done) {
            tabbed = Tabbed.init({
                containerId: tabsId,
                tabs: [
                    { id: 'tab1', type: 'custom' },
                    { id: 'tab2', type: 'custom' }
                ]
            });

            setTimeout(function() {
                expect(tabbed.activeTabId).toBe('tab1');
                done();
            }, 200);
        });

    });

    // =========================================================================
    // Tab Lifecycle - Custom Type
    // =========================================================================

    describe('Custom Tab Lifecycle', function() {

        it('calls onInit when tab first shown', function(done) {
            var initCalled = false;

            tabbed = Tabbed.init({
                containerId: tabsId,
                tabs: [
                    {
                        id: 'tab1',
                        type: 'custom',
                        onInit: function() {
                            initCalled = true;
                        }
                    }
                ]
            });

            setTimeout(function() {
                expect(initCalled).toBe(true);
                done();
            }, 200);
        });

        it('passes container to onInit', function(done) {
            var receivedContainer = null;

            tabbed = Tabbed.init({
                containerId: tabsId,
                tabs: [
                    {
                        id: 'tab1',
                        type: 'custom',
                        onInit: function(container) {
                            receivedContainer = container;
                        }
                    }
                ]
            });

            setTimeout(function() {
                expect(receivedContainer).toBe(document.getElementById('tab1'));
                done();
            }, 200);
        });

        it('creates instance object for custom tabs', function(done) {
            tabbed = Tabbed.init({
                containerId: tabsId,
                tabs: [{ id: 'tab1', type: 'custom' }]
            });

            setTimeout(function() {
                var instance = tabbed.getTabInstance('tab1');
                expect(instance).toBeDefined();
                expect(instance.container).toBe(document.getElementById('tab1'));
                expect(instance.tabId).toBe('tab1');
                done();
            }, 200);
        });

    });

    // =========================================================================
    // Public API
    // =========================================================================

    describe('getActiveTab()', function() {

        it('returns active tab ID', function(done) {
            tabbed = Tabbed.init({
                containerId: tabsId,
                defaultTab: 'tab2',
                tabs: [
                    { id: 'tab1', type: 'custom' },
                    { id: 'tab2', type: 'custom' }
                ]
            });

            setTimeout(function() {
                expect(tabbed.getActiveTab()).toBe('tab2');
                done();
            }, 200);
        });

    });

    describe('getTabInstance()', function() {

        it('returns tab instance by ID', function(done) {
            tabbed = Tabbed.init({
                containerId: tabsId,
                tabs: [{ id: 'tab1', type: 'custom' }]
            });

            setTimeout(function() {
                var instance = tabbed.getTabInstance('tab1');
                expect(instance).toBeDefined();
                done();
            }, 200);
        });

        it('returns null for non-existent tab', function() {
            tabbed = Tabbed.init({
                containerId: tabsId,
                tabs: [{ id: 'tab1', type: 'custom' }]
            });

            expect(tabbed.getTabInstance('nonexistent')).toBe(null);
        });

        it('returns null for uninitialized tab', function() {
            tabbed = Tabbed.init({
                containerId: tabsId,
                defaultTab: 'tab1',
                tabs: [
                    { id: 'tab1', type: 'custom' },
                    { id: 'tab2', type: 'custom' }
                ]
            });

            // tab2 hasn't been shown yet
            expect(tabbed.getTabInstance('tab2')).toBe(null);
        });

    });

    describe('switchTab()', function() {

        it('switches to specified tab', function(done) {
            tabbed = Tabbed.init({
                containerId: tabsId,
                tabs: [
                    { id: 'tab1', type: 'custom' },
                    { id: 'tab2', type: 'custom' }
                ]
            });

            setTimeout(function() {
                tabbed.switchTab('tab2');

                setTimeout(function() {
                    expect(tabbed.activeTabId).toBe('tab2');
                    done();
                }, 200);
            }, 200);
        });

    });

    // =========================================================================
    // Remember Tab
    // =========================================================================

    describe('Remember Tab', function() {

        it('stores tab in localStorage when rememberTab enabled', function(done) {
            tabbed = Tabbed.init({
                containerId: tabsId,
                rememberTab: true,
                tabs: [
                    { id: 'tab1', type: 'custom' },
                    { id: 'tab2', type: 'custom' }
                ]
            });

            setTimeout(function() {
                var stored = localStorage.getItem('funky_tabbed_' + tabbed.id);
                expect(stored).toBe('tab1');
                done();
            }, 200);
        });

        it('restores tab from localStorage', function(done) {
            // Pre-set the stored tab
            localStorage.setItem('funky_tabbed_' + tabsId, 'tab2');

            tabbed = Tabbed.init({
                id: tabsId,
                containerId: tabsId,
                rememberTab: true,
                tabs: [
                    { id: 'tab1', type: 'custom' },
                    { id: 'tab2', type: 'custom' }
                ]
            });

            setTimeout(function() {
                expect(tabbed.activeTabId).toBe('tab2');
                done();
            }, 200);
        });

    });

    // =========================================================================
    // Tab Initialization Tracking
    // =========================================================================

    describe('Tab Initialization Tracking', function() {

        it('tracks initialized tabs', function(done) {
            tabbed = Tabbed.init({
                containerId: tabsId,
                tabs: [{ id: 'tab1', type: 'custom' }]
            });

            setTimeout(function() {
                expect(tabbed.initializedTabs['tab1']).toBe(true);
                done();
            }, 200);
        });

        it('only initializes tab once', function(done) {
            var initCount = 0;

            tabbed = Tabbed.init({
                containerId: tabsId,
                tabs: [
                    {
                        id: 'tab1',
                        type: 'custom',
                        onInit: function() { initCount++; }
                    },
                    { id: 'tab2', type: 'custom' }
                ]
            });

            setTimeout(function() {
                // Switch away and back
                tabbed.switchTab('tab2');
                setTimeout(function() {
                    tabbed.switchTab('tab1');
                    setTimeout(function() {
                        expect(initCount).toBe(1);
                        done();
                    }, 200);
                }, 200);
            }, 200);
        });

    });

    // =========================================================================
    // Form Tab Type
    // =========================================================================

    describe('Form Tab Type', function() {

        it('creates form instance with load and save methods', function(done) {
            tabbed = Tabbed.init({
                containerId: tabsId,
                tabs: [{
                    id: 'tab1',
                    type: 'form',
                    config: {
                        apiUrl: '/api/settings'
                    }
                }]
            });

            setTimeout(function() {
                var instance = tabbed.getTabInstance('tab1');
                expect(instance).toBeDefined();
                expect(typeof instance.load).toBe('function');
                expect(typeof instance.save).toBe('function');
                done();
            }, 200);
        });

        it('form instance has container reference', function(done) {
            tabbed = Tabbed.init({
                containerId: tabsId,
                tabs: [{
                    id: 'tab1',
                    type: 'form',
                    config: {}
                }]
            });

            setTimeout(function() {
                var instance = tabbed.getTabInstance('tab1');
                expect(instance.container).toBe(document.getElementById('tab1'));
                done();
            }, 200);
        });

    });

    // =========================================================================
    // Destroy
    // =========================================================================

    describe('destroy()', function() {

        it('calls onDestroy for each initialized tab', function(done) {
            var destroyCalled = false;

            tabbed = Tabbed.init({
                containerId: tabsId,
                tabs: [{
                    id: 'tab1',
                    type: 'custom',
                    onDestroy: function() {
                        destroyCalled = true;
                    }
                }]
            });

            setTimeout(function() {
                tabbed.destroy();
                tabbed = null;

                expect(destroyCalled).toBe(true);
                done();
            }, 200);
        });

        it('unregisters instance', function(done) {
            tabbed = Tabbed.init({
                id: 'testInstance',
                containerId: tabsId,
                tabs: [{ id: 'tab1', type: 'custom' }]
            });

            setTimeout(function() {
                tabbed.destroy();
                tabbed = null;

                // getInstance returns null for non-existent instances
                expect(Tabbed.getInstance('testInstance')).toBe(null);
                done();
            }, 200);
        });

    });

    // =========================================================================
    // getInstance
    // =========================================================================

    describe('getInstance()', function() {

        it('returns instance by ID', function() {
            tabbed = Tabbed.init({
                id: 'myInstance',
                containerId: tabsId,
                tabs: [{ id: 'tab1', type: 'custom' }]
            });

            expect(Tabbed.getInstance('myInstance')).toBe(tabbed);
        });

        it('returns null for non-existent ID', function() {
            expect(Tabbed.getInstance('nonexistent')).toBe(null);
        });

    });

});

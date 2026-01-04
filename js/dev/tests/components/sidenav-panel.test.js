/**
 * Funky.SideNavPanel Tests
 *
 * Tests for the SideNavPanel component which pairs SideNav with content panels.
 * Validates initialization, panel rendering, navigation, lazy loading, and lifecycle.
 */

describe('Funky.Component.SideNavPanel', function() {

    var SideNavPanel = Funky.SideNavPanel;
    var SideNav = Funky.SideNav;
    var fixture;
    var panel;
    var containerId;
    var panelsId;
    var testCounter = 0;

    // Sample items with content
    var sampleItems = [
        { id: 'home', label: 'Home', icon: 'fa-home', content: '<p>Home content</p>' },
        { id: 'settings', label: 'Settings', icon: 'fa-cog', content: '<p>Settings content</p>' },
        { id: 'users', label: 'Users', icon: 'fa-users', content: '<p>Users content</p>' }
    ];

    beforeEach(function() {
        testCounter++;
        var unique = testCounter + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        containerId = 'sidenav-panel-test-' + unique;
        panelsId = 'panels-test-' + unique;
        fixture = FunkyTests.fixture(
            '<div id="' + containerId + '"></div>' +
            '<div id="' + panelsId + '"></div>'
        );
    });

    afterEach(function() {
        if (panel && typeof panel.destroy === 'function') {
            panel.destroy();
            panel = null;
        }

        // Clean up any orphaned SideNav instances
        var sidenavInstance = SideNav.getInstance(containerId);
        if (sidenavInstance) {
            sidenavInstance.destroy();
        }

        fixture.destroy();
    });

    // =========================================================================
    // Module Structure
    // =========================================================================

    describe('Module Structure', function() {

        it('Funky.SideNavPanel is registered', function() {
            expect(SideNavPanel).toBeDefined();
        });

        it('has init method', function() {
            expect(typeof SideNavPanel.init).toBe('function');
        });

    });

    // =========================================================================
    // Initialisation
    // =========================================================================

    describe('Initialisation', function() {

        it('creates instance with config', function() {
            panel = SideNavPanel.init({
                sidenav: '#' + containerId,
                panels: '#' + panelsId,
                items: sampleItems
            });

            expect(panel).toBeDefined();
        });

        it('creates SideNav instance', function() {
            panel = SideNavPanel.init({
                sidenav: '#' + containerId,
                panels: '#' + panelsId,
                items: sampleItems
            });

            expect(panel.sidenav).toBeDefined();
            expect(panel.sidenav instanceof SideNav).toBe(true);
        });

        it('accepts existing SideNav instance', function() {
            var existingNav = SideNav.init('#' + containerId, {
                items: [
                    { id: 'home', label: 'Home', icon: 'fa-home' },
                    { id: 'settings', label: 'Settings', icon: 'fa-cog' }
                ]
            });

            panel = SideNavPanel.init({
                sidenav: existingNav,
                panels: '#' + panelsId,
                items: sampleItems
            });

            expect(panel.sidenav).toBe(existingNav);
        });

        it('stores panels container reference', function() {
            panel = SideNavPanel.init({
                sidenav: '#' + containerId,
                panels: '#' + panelsId,
                items: sampleItems
            });

            expect(panel.panelsContainer).toBe(document.getElementById(panelsId));
        });

        it('adds sidenav-panels class to container', function() {
            panel = SideNavPanel.init({
                sidenav: '#' + containerId,
                panels: '#' + panelsId,
                items: sampleItems
            });

            var container = document.getElementById(panelsId);
            expect(container.classList.contains('sidenav-panels')).toBe(true);
        });

        it('adds animation class to container', function() {
            panel = SideNavPanel.init({
                sidenav: '#' + containerId,
                panels: '#' + panelsId,
                items: sampleItems,
                animation: 'slide'
            });

            var container = document.getElementById(panelsId);
            expect(container.classList.contains('sidenav-panels--slide')).toBe(true);
        });

    });

    // =========================================================================
    // Panel Creation
    // =========================================================================

    describe('Panel Creation', function() {

        it('creates panel elements for each item', function() {
            panel = SideNavPanel.init({
                sidenav: '#' + containerId,
                panels: '#' + panelsId,
                items: sampleItems
            });

            var panelEls = document.querySelectorAll('#' + panelsId + ' .sidenav-panel');
            expect(panelEls.length).toBe(3);
        });

        it('assigns correct ID to panels', function() {
            panel = SideNavPanel.init({
                sidenav: '#' + containerId,
                panels: '#' + panelsId,
                items: sampleItems
            });

            var homePanel = document.getElementById('sidenav-panel-home');
            expect(homePanel).not.toBe(null);
        });

        it('assigns data-panel attribute', function() {
            panel = SideNavPanel.init({
                sidenav: '#' + containerId,
                panels: '#' + panelsId,
                items: sampleItems
            });

            var panelEl = document.querySelector('#' + panelsId + ' [data-panel="home"]');
            expect(panelEl).not.toBe(null);
        });

        it('panels have role="tabpanel"', function() {
            panel = SideNavPanel.init({
                sidenav: '#' + containerId,
                panels: '#' + panelsId,
                items: sampleItems
            });

            var panelEl = document.querySelector('#' + panelsId + ' .sidenav-panel');
            expect(panelEl.getAttribute('role')).toBe('tabpanel');
        });

        it('panels have aria-labelledby', function() {
            panel = SideNavPanel.init({
                sidenav: '#' + containerId,
                panels: '#' + panelsId,
                items: sampleItems
            });

            var panelEl = document.querySelector('#' + panelsId + ' [data-panel="home"]');
            expect(panelEl.getAttribute('aria-labelledby')).toBe('sidenav-item-home');
        });

        it('panels start hidden', function() {
            panel = SideNavPanel.init({
                sidenav: '#' + containerId,
                panels: '#' + panelsId,
                items: sampleItems,
                selected: null
            });

            var panelEl = document.querySelector('#' + panelsId + ' [data-panel="settings"]');
            expect(panelEl.style.display).toBe('none');
        });

    });

    // =========================================================================
    // Lazy Loading
    // =========================================================================

    describe('Lazy Loading', function() {

        it('does not render content immediately when lazyLoad is true', function() {
            panel = SideNavPanel.init({
                sidenav: '#' + containerId,
                panels: '#' + panelsId,
                items: sampleItems,
                lazyLoad: true,
                selected: 'home'
            });

            // Settings panel should be empty (not rendered yet)
            var settingsPanel = document.querySelector('#' + panelsId + ' [data-panel="settings"]');
            expect(settingsPanel.innerHTML).toBe('');
        });

        it('renders all content immediately when lazyLoad is false', function() {
            panel = SideNavPanel.init({
                sidenav: '#' + containerId,
                panels: '#' + panelsId,
                items: sampleItems,
                lazyLoad: false
            });

            // All panels should have content
            var settingsPanel = document.querySelector('#' + panelsId + ' [data-panel="settings"]');
            expect(settingsPanel.innerHTML).toContain('Settings content');
        });

        it('renders content when panel is first activated', function() {
            panel = SideNavPanel.init({
                sidenav: '#' + containerId,
                panels: '#' + panelsId,
                items: sampleItems,
                lazyLoad: true,
                selected: 'home'
            });

            // Activate settings panel
            panel.select('settings');

            var settingsPanel = document.querySelector('#' + panelsId + ' [data-panel="settings"]');
            expect(settingsPanel.innerHTML).toContain('Settings content');
        });

    });

    // =========================================================================
    // Initial Selection
    // =========================================================================

    describe('Initial Selection', function() {

        it('activates selected panel on init', function() {
            panel = SideNavPanel.init({
                sidenav: '#' + containerId,
                panels: '#' + panelsId,
                items: sampleItems,
                selected: 'settings'
            });

            expect(panel.activePanel).toBe('settings');
        });

        it('activates first item when no selection specified', function() {
            panel = SideNavPanel.init({
                sidenav: '#' + containerId,
                panels: '#' + panelsId,
                items: sampleItems
            });

            expect(panel.activePanel).toBe('home');
        });

        it('renders content for selected panel', function() {
            panel = SideNavPanel.init({
                sidenav: '#' + containerId,
                panels: '#' + panelsId,
                items: sampleItems,
                lazyLoad: true,
                selected: 'home'
            });

            var homePanel = document.querySelector('#' + panelsId + ' [data-panel="home"]');
            expect(homePanel.innerHTML).toContain('Home content');
        });

    });

    // =========================================================================
    // Navigation
    // =========================================================================

    describe('select()', function() {

        it('activates panel by ID', function() {
            panel = SideNavPanel.init({
                sidenav: '#' + containerId,
                panels: '#' + panelsId,
                items: sampleItems,
                selected: 'home'
            });

            panel.select('users');

            expect(panel.activePanel).toBe('users');
        });

        it('shows selected panel', function() {
            panel = SideNavPanel.init({
                sidenav: '#' + containerId,
                panels: '#' + panelsId,
                items: sampleItems,
                selected: 'home'
            });

            panel.select('users');

            var usersPanel = document.querySelector('#' + panelsId + ' [data-panel="users"]');
            expect(usersPanel.style.display).not.toBe('none');
        });

        it('hides previous panel', function() {
            panel = SideNavPanel.init({
                sidenav: '#' + containerId,
                panels: '#' + panelsId,
                items: sampleItems,
                selected: 'home'
            });

            panel.select('users');

            var homePanel = document.querySelector('#' + panelsId + ' [data-panel="home"]');
            expect(homePanel.style.display).toBe('none');
        });

        it('updates aria-hidden on panels', function() {
            panel = SideNavPanel.init({
                sidenav: '#' + containerId,
                panels: '#' + panelsId,
                items: sampleItems,
                selected: 'home'
            });

            panel.select('users');

            var usersPanel = document.querySelector('#' + panelsId + ' [data-panel="users"]');
            var homePanel = document.querySelector('#' + panelsId + ' [data-panel="home"]');

            expect(usersPanel.getAttribute('aria-hidden')).toBe('false');
            expect(homePanel.getAttribute('aria-hidden')).toBe('true');
        });

    });

    // =========================================================================
    // Public API
    // =========================================================================

    describe('getPanel()', function() {

        it('returns panel element by ID', function() {
            panel = SideNavPanel.init({
                sidenav: '#' + containerId,
                panels: '#' + panelsId,
                items: sampleItems
            });

            var homePanel = panel.getPanel('home');

            expect(homePanel).not.toBe(null);
            expect(homePanel.getAttribute('data-panel')).toBe('home');
        });

        it('returns undefined for non-existent ID', function() {
            panel = SideNavPanel.init({
                sidenav: '#' + containerId,
                panels: '#' + panelsId,
                items: sampleItems
            });

            var result = panel.getPanel('nonexistent');

            expect(result).toBe(null);
        });

    });

    describe('getActive()', function() {

        it('returns active panel ID', function() {
            panel = SideNavPanel.init({
                sidenav: '#' + containerId,
                panels: '#' + panelsId,
                items: sampleItems,
                selected: 'settings'
            });

            expect(panel.getActive()).toBe('settings');
        });

    });

    // =========================================================================
    // Render Function
    // =========================================================================

    describe('Render Function', function() {

        it('calls render function with panel element', function() {
            var renderCalled = false;
            var receivedPanel = null;

            panel = SideNavPanel.init({
                sidenav: '#' + containerId,
                panels: '#' + panelsId,
                items: [
                    {
                        id: 'dynamic',
                        label: 'Dynamic',
                        render: function(panelEl) {
                            renderCalled = true;
                            receivedPanel = panelEl;
                            panelEl.innerHTML = '<p>Dynamically rendered</p>';
                        }
                    }
                ],
                selected: 'dynamic'
            });

            expect(renderCalled).toBe(true);
            expect(receivedPanel).not.toBe(null);
        });

        it('renders dynamic content', function() {
            panel = SideNavPanel.init({
                sidenav: '#' + containerId,
                panels: '#' + panelsId,
                items: [
                    {
                        id: 'dynamic',
                        label: 'Dynamic',
                        render: function(panelEl) {
                            panelEl.innerHTML = '<span class="dynamic-content">Dynamic!</span>';
                        }
                    }
                ],
                selected: 'dynamic'
            });

            var content = document.querySelector('#' + panelsId + ' .dynamic-content');
            expect(content).not.toBe(null);
            expect(content.textContent).toBe('Dynamic!');
        });

    });

    // =========================================================================
    // Nested Items
    // =========================================================================

    describe('Nested Items', function() {

        it('creates panels for nested children', function() {
            panel = SideNavPanel.init({
                sidenav: '#' + containerId,
                panels: '#' + panelsId,
                items: [
                    {
                        id: 'admin',
                        label: 'Admin',
                        children: [
                            { id: 'users-admin', label: 'Users', content: '<p>Admin users</p>' },
                            { id: 'roles', label: 'Roles', content: '<p>Roles</p>' }
                        ]
                    }
                ]
            });

            var usersPanel = document.querySelector('#' + panelsId + ' [data-panel="users-admin"]');
            var rolesPanel = document.querySelector('#' + panelsId + ' [data-panel="roles"]');

            expect(usersPanel).not.toBe(null);
            expect(rolesPanel).not.toBe(null);
        });

        it('activates first nested child by default', function() {
            panel = SideNavPanel.init({
                sidenav: '#' + containerId,
                panels: '#' + panelsId,
                items: [
                    {
                        id: 'admin',
                        label: 'Admin',
                        children: [
                            { id: 'users-admin', label: 'Users', content: '<p>Admin users</p>' },
                            { id: 'roles', label: 'Roles', content: '<p>Roles</p>' }
                        ]
                    }
                ]
            });

            expect(panel.activePanel).toBe('users-admin');
        });

    });

    // =========================================================================
    // Callbacks
    // =========================================================================

    describe('Callbacks', function() {

        it('calls onInit when panel is first rendered', function() {
            var initCalled = false;
            var initPanelId = null;

            panel = SideNavPanel.init({
                sidenav: '#' + containerId,
                panels: '#' + panelsId,
                items: sampleItems,
                selected: 'home',
                onInit: function(id, panelEl) {
                    initCalled = true;
                    initPanelId = id;
                }
            });

            expect(initCalled).toBe(true);
            expect(initPanelId).toBe('home');
        });

    });

    // =========================================================================
    // Destroy
    // =========================================================================

    describe('destroy()', function() {

        it('removes panel elements', function() {
            panel = SideNavPanel.init({
                sidenav: '#' + containerId,
                panels: '#' + panelsId,
                items: sampleItems
            });

            panel.destroy();
            panel = null;

            var panelEls = document.querySelectorAll('#' + panelsId + ' .sidenav-panel');
            expect(panelEls.length).toBe(0);
        });

        it('destroys SideNav if created', function() {
            panel = SideNavPanel.init({
                sidenav: '#' + containerId,
                panels: '#' + panelsId,
                items: sampleItems
            });

            var sidenav = panel.sidenav;
            panel.destroy();
            panel = null;

            // SideNav should be destroyed
            expect(SideNav.getInstance(containerId)).toBe(null);
        });

        it('clears internal state', function() {
            panel = SideNavPanel.init({
                sidenav: '#' + containerId,
                panels: '#' + panelsId,
                items: sampleItems
            });

            var instance = panel;
            panel.destroy();
            panel = null;

            expect(Object.keys(instance.panels).length).toBe(0);
        });

    });

    // =========================================================================
    // refreshPanel
    // =========================================================================

    describe('refreshPanel()', function() {

        it('re-renders panel content', function() {
            var renderCount = 0;

            panel = SideNavPanel.init({
                sidenav: '#' + containerId,
                panels: '#' + panelsId,
                items: [
                    {
                        id: 'counter',
                        label: 'Counter',
                        render: function(panelEl) {
                            renderCount++;
                            panelEl.innerHTML = '<p>Render count: ' + renderCount + '</p>';
                        }
                    }
                ],
                selected: 'counter'
            });

            expect(renderCount).toBe(1);

            panel.refreshPanel('counter');

            expect(renderCount).toBe(2);
        });

    });

});

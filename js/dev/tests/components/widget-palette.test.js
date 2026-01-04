/**
 * Tests for Funky.WidgetPalette component
 *
 * WidgetPalette provides a collapsible sidebar with draggable widget cards
 * for adding widgets to a DashboardGrid.
 */
FunkyTests.describe('Funky.Component.WidgetPalette', function() {
    'use strict';

    var WidgetPalette = Funky.WidgetPalette;

    // Skip all tests if WidgetPalette not available
    if (!WidgetPalette) {
        FunkyTests.it('WidgetPalette module not available', function() {
            FunkyTests.expect(true).toBe(true);
        });
        return;
    }

    var expect = FunkyTests.expect;
    var spyOn = FunkyTests.spyOn;
    var fixture;
    var testCounter = 0;
    var originalGetCategories;
    var originalGetWidgetTypes;
    var originalSearchWidgets;
    var originalGetWidgetMeta;

    /**
     * Generate unique IDs for test isolation
     */
    function uniqueId(prefix) {
        testCounter++;
        var unique = testCounter + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        return (prefix || 'widget-palette') + '-test-' + unique;
    }

    /**
     * Mock widget types for testing
     */
    var mockWidgetTypes = [
        {
            type: 'chart',
            name: 'Chart Widget',
            description: 'Display data charts',
            icon: 'fa-chart-bar',
            category: 'visualization',
            defaults: { width: 4, height: 3 }
        },
        {
            type: 'table',
            name: 'Table Widget',
            description: 'Display tabular data',
            icon: 'fa-table',
            category: 'data',
            defaults: { width: 6, height: 4 }
        },
        {
            type: 'metric',
            name: 'Metric Widget',
            description: 'Show key metrics',
            icon: 'fa-tachometer-alt',
            category: 'visualization',
            defaults: { width: 2, height: 2 }
        }
    ];

    /**
     * Mock DashboardGrid methods
     */
    function setupMocks() {
        if (Funky.DashboardGrid) {
            originalGetCategories = Funky.DashboardGrid.getCategories;
            originalGetWidgetTypes = Funky.DashboardGrid.getWidgetTypes;
            originalSearchWidgets = Funky.DashboardGrid.searchWidgets;
            originalGetWidgetMeta = Funky.DashboardGrid.getWidgetMeta;

            Funky.DashboardGrid.getCategories = function() {
                return ['visualization', 'data'];
            };

            Funky.DashboardGrid.getWidgetTypes = function(category) {
                if (category) {
                    return mockWidgetTypes.filter(function(w) {
                        return w.category === category;
                    });
                }
                return mockWidgetTypes;
            };

            Funky.DashboardGrid.searchWidgets = function(query) {
                var lowerQuery = query.toLowerCase();
                return mockWidgetTypes.filter(function(w) {
                    return w.name.toLowerCase().indexOf(lowerQuery) !== -1 ||
                           w.description.toLowerCase().indexOf(lowerQuery) !== -1;
                });
            };

            Funky.DashboardGrid.getWidgetMeta = function(type) {
                return mockWidgetTypes.find(function(w) {
                    return w.type === type;
                }) || null;
            };
        }
    }

    /**
     * Restore original methods
     */
    function restoreMocks() {
        if (Funky.DashboardGrid) {
            if (originalGetCategories) Funky.DashboardGrid.getCategories = originalGetCategories;
            if (originalGetWidgetTypes) Funky.DashboardGrid.getWidgetTypes = originalGetWidgetTypes;
            if (originalSearchWidgets) Funky.DashboardGrid.searchWidgets = originalSearchWidgets;
            if (originalGetWidgetMeta) Funky.DashboardGrid.getWidgetMeta = originalGetWidgetMeta;
        }
    }

    FunkyTests.beforeEach(function() {
        var containerId = uniqueId('container');
        fixture = FunkyTests.fixture('<div id="' + containerId + '"></div>');
        fixture.containerId = containerId;
        setupMocks();
    });

    FunkyTests.afterEach(function() {
        restoreMocks();

        // Clean up any palettes
        var palettes = document.querySelectorAll('.widget-palette');
        palettes.forEach(function(palette) {
            if (palette.parentNode) {
                palette.remove();
            }
        });

        // Clean up drag proxies
        var proxies = document.querySelectorAll('.widget-palette__drag-proxy');
        proxies.forEach(function(proxy) {
            if (proxy.parentNode) {
                proxy.remove();
            }
        });

        fixture.cleanup();
    });

    // =========================================================================
    // Module Structure Tests
    // =========================================================================

    FunkyTests.describe('Module Structure', function() {

        FunkyTests.it('should be available in Funky namespace', function() {
            expect(Funky.WidgetPalette).toBeDefined();
        });

        FunkyTests.it('should be a factory object with constructor', function() {
            expect(typeof WidgetPalette).toBe('object');
            expect(typeof WidgetPalette.constructor).toBe('function');
        });

        FunkyTests.it('should have init method', function() {
            expect(typeof WidgetPalette.init).toBe('function');
        });
    });

    // =========================================================================
    // Factory init() Tests
    // =========================================================================

    FunkyTests.describe('Factory init()', function() {

        FunkyTests.it('should create instance without options', function() {
            var palette = WidgetPalette.init();
            expect(palette).toBeDefined();
            palette.destroy();
        });

        FunkyTests.it('should create instance with empty options', function() {
            var palette = WidgetPalette.init({});
            expect(palette).toBeDefined();
            palette.destroy();
        });

        FunkyTests.it('should default to left position', function() {
            var palette = WidgetPalette.init();
            expect(palette.options.position).toBe('left');
            palette.destroy();
        });

        FunkyTests.it('should accept right position', function() {
            var palette = WidgetPalette.init({ position: 'right' });
            expect(palette.options.position).toBe('right');
            palette.destroy();
        });

        FunkyTests.it('should default to collapsed state', function() {
            var palette = WidgetPalette.init();
            expect(palette.options.collapsed).toBe(true);
            expect(palette.isCollapsed()).toBe(true);
            palette.destroy();
        });

        FunkyTests.it('should accept collapsed false option', function() {
            var palette = WidgetPalette.init({ collapsed: false });
            expect(palette.isCollapsed()).toBe(false);
            palette.destroy();
        });

        FunkyTests.it('should store grid option', function() {
            var mockGrid = { addWidget: function() {} };
            var palette = WidgetPalette.init({ grid: mockGrid });
            expect(palette.options.grid).toBe(mockGrid);
            palette.destroy();
        });

        FunkyTests.it('should accept custom container', function() {
            var container = document.getElementById(fixture.containerId);
            var palette = WidgetPalette.init({ container: container });

            var paletteEl = container.querySelector('.widget-palette');
            expect(paletteEl).not.toBeNull();

            palette.destroy();
        });

        FunkyTests.it('should initialize search query as empty', function() {
            var palette = WidgetPalette.init();
            expect(palette._searchQuery).toBe('');
            palette.destroy();
        });

        FunkyTests.it('should initialize collapsed categories as empty', function() {
            var palette = WidgetPalette.init();
            expect(palette._collapsedCategories).toEqual({});
            palette.destroy();
        });
    });

    // =========================================================================
    // UI Structure Tests
    // =========================================================================

    FunkyTests.describe('UI Structure', function() {

        FunkyTests.it('should create palette element', function() {
            var palette = WidgetPalette.init();
            expect(palette._palette).toBeDefined();
            expect(palette._palette.el).not.toBeNull();
            palette.destroy();
        });

        FunkyTests.it('should have palette class', function() {
            var palette = WidgetPalette.init();
            expect(palette._palette.el.classList.contains('widget-palette')).toBe(true);
            palette.destroy();
        });

        FunkyTests.it('should have left position class by default', function() {
            var palette = WidgetPalette.init();
            expect(palette._palette.el.classList.contains('widget-palette--left')).toBe(true);
            palette.destroy();
        });

        FunkyTests.it('should have right position class when specified', function() {
            var palette = WidgetPalette.init({ position: 'right' });
            expect(palette._palette.el.classList.contains('widget-palette--right')).toBe(true);
            palette.destroy();
        });

        FunkyTests.it('should have collapsed class when collapsed', function() {
            var palette = WidgetPalette.init({ collapsed: true });
            expect(palette._palette.el.classList.contains('widget-palette--collapsed')).toBe(true);
            palette.destroy();
        });

        FunkyTests.it('should not have collapsed class when expanded', function() {
            var palette = WidgetPalette.init({ collapsed: false });
            expect(palette._palette.el.classList.contains('widget-palette--collapsed')).toBe(false);
            palette.destroy();
        });

        FunkyTests.it('should have toggle button', function() {
            var palette = WidgetPalette.init();
            expect(palette._elements.toggle).toBeDefined();
            palette.destroy();
        });

        FunkyTests.it('should have toggle with aria-label', function() {
            var palette = WidgetPalette.init();
            var toggleEl = palette._elements.toggle.el;
            expect(toggleEl.getAttribute('aria-label')).toBe('Open widget palette');
            palette.destroy();
        });

        FunkyTests.it('should have close button', function() {
            var palette = WidgetPalette.init();
            expect(palette._elements.closeBtn).toBeDefined();
            palette.destroy();
        });

        FunkyTests.it('should have close button with aria-label', function() {
            var palette = WidgetPalette.init();
            var closeBtnEl = palette._elements.closeBtn.el;
            expect(closeBtnEl.getAttribute('aria-label')).toBe('Close palette');
            palette.destroy();
        });

        FunkyTests.it('should have search input', function() {
            var palette = WidgetPalette.init();
            expect(palette._elements.searchInput).toBeDefined();
            palette.destroy();
        });

        FunkyTests.it('should have search input with aria-label', function() {
            var palette = WidgetPalette.init();
            var searchEl = palette._elements.searchInput.el;
            expect(searchEl.getAttribute('aria-label')).toBe('Search widgets');
            palette.destroy();
        });

        FunkyTests.it('should have content container', function() {
            var palette = WidgetPalette.init();
            expect(palette._elements.content).toBeDefined();
            palette.destroy();
        });

        FunkyTests.it('should have panel with complementary role', function() {
            var palette = WidgetPalette.init();
            var panel = palette._palette.el.querySelector('.widget-palette__panel');
            expect(panel.getAttribute('role')).toBe('complementary');
            palette.destroy();
        });

        FunkyTests.it('should have panel with aria-label', function() {
            var palette = WidgetPalette.init();
            var panel = palette._palette.el.querySelector('.widget-palette__panel');
            expect(panel.getAttribute('aria-label')).toBe('Widget palette');
            palette.destroy();
        });
    });

    // =========================================================================
    // Expand/Collapse Tests
    // =========================================================================

    FunkyTests.describe('Expand/Collapse', function() {

        FunkyTests.it('should expand palette', function() {
            var palette = WidgetPalette.init({ collapsed: true });
            expect(palette.isCollapsed()).toBe(true);

            palette.expand();

            expect(palette.isCollapsed()).toBe(false);
            expect(palette._palette.el.classList.contains('widget-palette--collapsed')).toBe(false);

            palette.destroy();
        });

        FunkyTests.it('should collapse palette', function() {
            var palette = WidgetPalette.init({ collapsed: false });
            expect(palette.isCollapsed()).toBe(false);

            palette.collapse();

            expect(palette.isCollapsed()).toBe(true);
            expect(palette._palette.el.classList.contains('widget-palette--collapsed')).toBe(true);

            palette.destroy();
        });

        FunkyTests.it('should toggle from collapsed to expanded', function() {
            var palette = WidgetPalette.init({ collapsed: true });

            palette.toggle();

            expect(palette.isCollapsed()).toBe(false);

            palette.destroy();
        });

        FunkyTests.it('should toggle from expanded to collapsed', function() {
            var palette = WidgetPalette.init({ collapsed: false });

            palette.toggle();

            expect(palette.isCollapsed()).toBe(true);

            palette.destroy();
        });

        FunkyTests.it('should update toggle aria-label on expand', function() {
            var palette = WidgetPalette.init({ collapsed: true });

            palette.expand();

            var toggleEl = palette._elements.toggle.el;
            expect(toggleEl.getAttribute('aria-label')).toBe('Close widget palette');

            palette.destroy();
        });

        FunkyTests.it('should update toggle aria-label on collapse', function() {
            var palette = WidgetPalette.init({ collapsed: false });

            palette.collapse();

            var toggleEl = palette._elements.toggle.el;
            expect(toggleEl.getAttribute('aria-label')).toBe('Open widget palette');

            palette.destroy();
        });

        FunkyTests.it('should emit expand event', function() {
            var eventEmitted = false;
            var handler = function() { eventEmitted = true; };
            Funky.PubSub.on('funky:widget-palette:expand', handler);

            var palette = WidgetPalette.init({ collapsed: true });
            palette.expand();

            expect(eventEmitted).toBe(true);

            Funky.PubSub.off('funky:widget-palette:expand', handler);
            palette.destroy();
        });

        FunkyTests.it('should emit collapse event', function() {
            var eventEmitted = false;
            var handler = function() { eventEmitted = true; };
            Funky.PubSub.on('funky:widget-palette:collapse', handler);

            var palette = WidgetPalette.init({ collapsed: false });
            palette.collapse();

            expect(eventEmitted).toBe(true);

            Funky.PubSub.off('funky:widget-palette:collapse', handler);
            palette.destroy();
        });

        FunkyTests.it('should expand on toggle button click', function() {
            var palette = WidgetPalette.init({ collapsed: true });

            palette._elements.toggle.el.click();

            expect(palette.isCollapsed()).toBe(false);

            palette.destroy();
        });

        FunkyTests.it('should collapse on close button click', function() {
            var palette = WidgetPalette.init({ collapsed: false });

            palette._elements.closeBtn.el.click();

            expect(palette.isCollapsed()).toBe(true);

            palette.destroy();
        });
    });

    // =========================================================================
    // Widget Rendering Tests
    // =========================================================================

    FunkyTests.describe('Widget Rendering', function() {

        FunkyTests.it('should render widget categories', function() {
            var palette = WidgetPalette.init({ collapsed: false });

            var contentEl = palette._elements.content.el;
            var categories = contentEl.querySelectorAll('.widget-palette__category');

            expect(categories.length).toBe(2); // visualization and data

            palette.destroy();
        });

        FunkyTests.it('should render category headers', function() {
            var palette = WidgetPalette.init({ collapsed: false });

            var contentEl = palette._elements.content.el;
            var headers = contentEl.querySelectorAll('.widget-palette__category-header');

            expect(headers.length).toBe(2);

            palette.destroy();
        });

        FunkyTests.it('should render category with button role', function() {
            var palette = WidgetPalette.init({ collapsed: false });

            var contentEl = palette._elements.content.el;
            var header = contentEl.querySelector('.widget-palette__category-header');

            expect(header.getAttribute('role')).toBe('button');

            palette.destroy();
        });

        FunkyTests.it('should render category with aria-expanded', function() {
            var palette = WidgetPalette.init({ collapsed: false });

            var contentEl = palette._elements.content.el;
            var header = contentEl.querySelector('.widget-palette__category-header');

            expect(header.getAttribute('aria-expanded')).toBe('true');

            palette.destroy();
        });

        FunkyTests.it('should render widget cards', function() {
            var palette = WidgetPalette.init({ collapsed: false });

            var contentEl = palette._elements.content.el;
            var cards = contentEl.querySelectorAll('.widget-palette__card');

            expect(cards.length).toBe(3);

            palette.destroy();
        });

        FunkyTests.it('should render cards as draggable', function() {
            var palette = WidgetPalette.init({ collapsed: false });

            var contentEl = palette._elements.content.el;
            var card = contentEl.querySelector('.widget-palette__card');

            expect(card.getAttribute('draggable')).toBe('true');

            palette.destroy();
        });

        FunkyTests.it('should render cards with data-type attribute', function() {
            var palette = WidgetPalette.init({ collapsed: false });

            var contentEl = palette._elements.content.el;
            var card = contentEl.querySelector('[data-type="chart"]');

            expect(card).not.toBeNull();

            palette.destroy();
        });

        FunkyTests.it('should render cards with listitem role', function() {
            var palette = WidgetPalette.init({ collapsed: false });

            var contentEl = palette._elements.content.el;
            var card = contentEl.querySelector('.widget-palette__card');

            expect(card.getAttribute('role')).toBe('listitem');

            palette.destroy();
        });

        FunkyTests.it('should render cards with tabindex', function() {
            var palette = WidgetPalette.init({ collapsed: false });

            var contentEl = palette._elements.content.el;
            var card = contentEl.querySelector('.widget-palette__card');

            expect(card.getAttribute('tabindex')).toBe('0');

            palette.destroy();
        });

        FunkyTests.it('should render widget name', function() {
            var palette = WidgetPalette.init({ collapsed: false });

            var contentEl = palette._elements.content.el;
            var cardName = contentEl.querySelector('.widget-palette__card-name');

            expect(cardName).not.toBeNull();

            palette.destroy();
        });

        FunkyTests.it('should render widget description', function() {
            var palette = WidgetPalette.init({ collapsed: false });

            var contentEl = palette._elements.content.el;
            var cardDesc = contentEl.querySelector('.widget-palette__card-desc');

            expect(cardDesc).not.toBeNull();

            palette.destroy();
        });

        FunkyTests.it('should render widget icon', function() {
            var palette = WidgetPalette.init({ collapsed: false });

            var contentEl = palette._elements.content.el;
            var cardIcon = contentEl.querySelector('.widget-palette__card-icon');

            expect(cardIcon).not.toBeNull();

            palette.destroy();
        });

        FunkyTests.it('should show widget count in category header', function() {
            var palette = WidgetPalette.init({ collapsed: false });

            var contentEl = palette._elements.content.el;
            var title = contentEl.querySelector('.widget-palette__category-title');

            expect(title.textContent).toContain('(');

            palette.destroy();
        });

        FunkyTests.it('should show empty message when no widgets match', function() {
            Funky.DashboardGrid.searchWidgets = function() { return []; };

            var palette = WidgetPalette.init({ collapsed: false });
            palette._searchQuery = 'nonexistent';
            palette._renderWidgets();

            var contentEl = palette._elements.content.el;
            var emptyEl = contentEl.querySelector('.widget-palette__empty');

            expect(emptyEl).not.toBeNull();
            expect(emptyEl.textContent).toBe('No widgets found');

            palette.destroy();
        });
    });

    // =========================================================================
    // Search Tests
    // =========================================================================

    FunkyTests.describe('Search', function() {

        FunkyTests.it('should filter widgets by search query', function() {
            var palette = WidgetPalette.init({ collapsed: false });

            palette._searchQuery = 'chart';
            palette._renderWidgets();

            var contentEl = palette._elements.content.el;
            var cards = contentEl.querySelectorAll('.widget-palette__card');

            expect(cards.length).toBe(1);

            palette.destroy();
        });

        FunkyTests.it('should update search query on input', function() {
            var palette = WidgetPalette.init({ collapsed: false });

            palette._elements.searchInput.el.value = 'table';
            palette._elements.searchInput.el.dispatchEvent(new Event('input'));

            expect(palette._searchQuery).toBe('table');

            palette.destroy();
        });

        FunkyTests.it('should re-render widgets on search', function() {
            var palette = WidgetPalette.init({ collapsed: false });

            var contentEl = palette._elements.content.el;
            var initialCards = contentEl.querySelectorAll('.widget-palette__card').length;

            palette._elements.searchInput.el.value = 'metric';
            palette._elements.searchInput.el.dispatchEvent(new Event('input'));

            var filteredCards = contentEl.querySelectorAll('.widget-palette__card').length;

            expect(filteredCards).toBeLessThan(initialCards);

            palette.destroy();
        });
    });

    // =========================================================================
    // Category Toggle Tests
    // =========================================================================

    FunkyTests.describe('Category Toggle', function() {

        FunkyTests.it('should track collapsed categories', function() {
            var palette = WidgetPalette.init({ collapsed: false });

            var contentEl = palette._elements.content.el;
            var header = contentEl.querySelector('.widget-palette__category-header');
            header.click();

            var categories = Object.keys(palette._collapsedCategories);
            expect(categories.length).toBeGreaterThan(0);

            palette.destroy();
        });

        FunkyTests.it('should toggle category collapsed class', function() {
            var palette = WidgetPalette.init({ collapsed: false });

            var contentEl = palette._elements.content.el;
            var category = contentEl.querySelector('.widget-palette__category');
            var header = category.querySelector('.widget-palette__category-header');

            header.click();

            expect(category.classList.contains('widget-palette__category--collapsed')).toBe(true);

            palette.destroy();
        });

        FunkyTests.it('should update aria-expanded on toggle', function() {
            var palette = WidgetPalette.init({ collapsed: false });

            var contentEl = palette._elements.content.el;
            var header = contentEl.querySelector('.widget-palette__category-header');

            expect(header.getAttribute('aria-expanded')).toBe('true');

            header.click();

            expect(header.getAttribute('aria-expanded')).toBe('false');

            palette.destroy();
        });
    });

    // =========================================================================
    // Refresh Tests
    // =========================================================================

    FunkyTests.describe('Refresh', function() {

        FunkyTests.it('should refresh widget list', function() {
            var palette = WidgetPalette.init({ collapsed: false });

            // Change mock data
            var original = Funky.DashboardGrid.getWidgetTypes;
            Funky.DashboardGrid.getWidgetTypes = function() {
                return [mockWidgetTypes[0]]; // Only return first widget
            };

            palette.refresh();

            var contentEl = palette._elements.content.el;
            var cards = contentEl.querySelectorAll('.widget-palette__card');

            expect(cards.length).toBe(1);

            Funky.DashboardGrid.getWidgetTypes = original;
            palette.destroy();
        });
    });

    // =========================================================================
    // Destroy Tests
    // =========================================================================

    FunkyTests.describe('Destroy', function() {

        FunkyTests.it('should remove palette from DOM', function() {
            var palette = WidgetPalette.init();
            var paletteEl = palette._palette.el;

            expect(paletteEl.parentNode).not.toBeNull();

            palette.destroy();

            expect(paletteEl.parentNode).toBeNull();
        });

        FunkyTests.it('should clear palette reference', function() {
            var palette = WidgetPalette.init();

            palette.destroy();

            expect(palette._palette).toBeNull();
        });

        FunkyTests.it('should clear elements reference', function() {
            var palette = WidgetPalette.init();

            palette.destroy();

            expect(Object.keys(palette._elements).length).toBe(0);
        });

        FunkyTests.it('should clear drag state', function() {
            var palette = WidgetPalette.init();
            palette._dragState = { test: true };

            palette.destroy();

            expect(palette._dragState).toBeNull();
        });
    });

    // =========================================================================
    // Add Widget Event Tests
    // =========================================================================

    FunkyTests.describe('Add Widget Events', function() {

        FunkyTests.it('should emit add event on keyboard activation', function() {
            var eventData = null;
            var handler = function(data) { eventData = data; };
            Funky.PubSub.on('funky:widget-palette:add', handler);

            var palette = WidgetPalette.init({ collapsed: false });

            var contentEl = palette._elements.content.el;
            var card = contentEl.querySelector('[data-type="chart"]');

            // Must set bubbles: true for event to reach content handler
            var event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
            card.dispatchEvent(event);

            expect(eventData).not.toBeNull();
            expect(eventData.type).toBe('chart');

            Funky.PubSub.off('funky:widget-palette:add', handler);
            palette.destroy();
        });

        FunkyTests.it('should emit add event on Space key', function() {
            var eventData = null;
            var handler = function(data) { eventData = data; };
            Funky.PubSub.on('funky:widget-palette:add', handler);

            var palette = WidgetPalette.init({ collapsed: false });

            var contentEl = palette._elements.content.el;
            var card = contentEl.querySelector('[data-type="table"]');

            // Must set bubbles: true for event to reach content handler
            var event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
            card.dispatchEvent(event);

            expect(eventData).not.toBeNull();
            expect(eventData.type).toBe('table');

            Funky.PubSub.off('funky:widget-palette:add', handler);
            palette.destroy();
        });

        FunkyTests.it('should call grid.addWidget on keyboard activation', function() {
            var addWidgetCalled = false;
            var addedConfig = null;
            var mockGrid = {
                addWidget: function(config) {
                    addWidgetCalled = true;
                    addedConfig = config;
                }
            };

            var palette = WidgetPalette.init({ collapsed: false, grid: mockGrid });

            var contentEl = palette._elements.content.el;
            var card = contentEl.querySelector('[data-type="metric"]');

            // Must set bubbles: true for event to reach content handler
            var event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
            card.dispatchEvent(event);

            expect(addWidgetCalled).toBe(true);
            expect(addedConfig.type).toBe('metric');

            palette.destroy();
        });

        FunkyTests.it('should use default dimensions from widget meta', function() {
            var addedConfig = null;
            var mockGrid = {
                addWidget: function(config) {
                    addedConfig = config;
                }
            };

            var palette = WidgetPalette.init({ collapsed: false, grid: mockGrid });

            var contentEl = palette._elements.content.el;
            var card = contentEl.querySelector('[data-type="chart"]');

            // Must set bubbles: true for event to reach content handler
            var event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
            card.dispatchEvent(event);

            expect(addedConfig.width).toBe(4);
            expect(addedConfig.height).toBe(3);

            palette.destroy();
        });
    });

    // =========================================================================
    // isCollapsed Tests
    // =========================================================================

    FunkyTests.describe('isCollapsed', function() {

        FunkyTests.it('should return true when collapsed', function() {
            var palette = WidgetPalette.init({ collapsed: true });
            expect(palette.isCollapsed()).toBe(true);
            palette.destroy();
        });

        FunkyTests.it('should return false when expanded', function() {
            var palette = WidgetPalette.init({ collapsed: false });
            expect(palette.isCollapsed()).toBe(false);
            palette.destroy();
        });

        FunkyTests.it('should update after expand', function() {
            var palette = WidgetPalette.init({ collapsed: true });
            palette.expand();
            expect(palette.isCollapsed()).toBe(false);
            palette.destroy();
        });

        FunkyTests.it('should update after collapse', function() {
            var palette = WidgetPalette.init({ collapsed: false });
            palette.collapse();
            expect(palette.isCollapsed()).toBe(true);
            palette.destroy();
        });
    });
});

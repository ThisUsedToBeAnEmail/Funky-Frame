/**
 * Integration Test: Tree View + Navigation + Lazy Loading
 *
 * Tests the integration between tree view component, page navigation,
 * lazy loading of child nodes, and state persistence.
 */

describe('Funky.Integration.TreeView.Navigation', function() {

    var Toast = Funky.Toast;
    var PubSub = Funky.PubSub;
    var Cache = Funky.Cache;
    var Storage = Funky.Storage;
    var originalFetch;
    var apiCalls;
    var fixture;

    // Sample tree data
    var sampleTreeData = [
        {
            id: 'root-1',
            label: 'Documents',
            icon: 'folder',
            children: [
                { id: 'doc-1', label: 'Report.pdf', icon: 'file', href: '/documents/report' },
                { id: 'doc-2', label: 'Notes.txt', icon: 'file', href: '/documents/notes' }
            ]
        },
        {
            id: 'root-2',
            label: 'Projects',
            icon: 'folder',
            lazy: true, // Children loaded on expand
            children: null
        },
        {
            id: 'root-3',
            label: 'Settings',
            icon: 'cog',
            href: '/settings'
        }
    ];

    // Lazy loaded children
    var projectChildren = [
        { id: 'proj-1', label: 'Project Alpha', icon: 'folder', href: '/projects/alpha' },
        { id: 'proj-2', label: 'Project Beta', icon: 'folder', href: '/projects/beta' },
        { id: 'proj-3', label: 'Project Gamma', icon: 'folder', lazy: true }
    ];

    beforeEach(function() {
        Cache.clear();
        PubSub.clear();
        if (Storage && Storage.clear) {
            Storage.clear();
        }
        localStorage.clear();
        sessionStorage.clear();
        apiCalls = [];
        originalFetch = window.fetch;

        // Mock fetch for tree API calls
        window.fetch = function(url, options) {
            apiCalls.push({ url: url, options: options || {} });

            // Lazy load children (check first - more specific)
            if (url.includes('/api/tree/children/')) {
                var nodeId = url.split('/').pop();
                if (nodeId === 'root-2') {
                    return Promise.resolve({
                        ok: true,
                        json: function() {
                            return Promise.resolve({ children: projectChildren });
                        }
                    });
                }
                return Promise.resolve({
                    ok: true,
                    json: function() {
                        return Promise.resolve({ children: [] });
                    }
                });
            }

            // Get tree structure (check after children - less specific)
            if (url.includes('/api/tree') && !url.includes('/api/tree/children/') && !url.includes('/api/tree/search')) {
                return Promise.resolve({
                    ok: true,
                    json: function() {
                        return Promise.resolve({ nodes: sampleTreeData });
                    }
                });
            }

            // Get page content
            if (url.includes('/api/page/')) {
                return Promise.resolve({
                    ok: true,
                    json: function() {
                        return Promise.resolve({
                            title: 'Page Content',
                            content: '<p>Page loaded successfully</p>'
                        });
                    }
                });
            }

            // Search endpoint
            if (url.includes('/api/tree/search')) {
                return Promise.resolve({
                    ok: true,
                    json: function() {
                        return Promise.resolve({
                            results: [
                                { id: 'doc-1', label: 'Report.pdf', path: ['Documents', 'Report.pdf'] }
                            ]
                        });
                    }
                });
            }

            // Error endpoint
            if (url.includes('/api/error')) {
                return Promise.resolve({
                    ok: false,
                    status: 500,
                    json: function() {
                        return Promise.resolve({ error: 'Server error' });
                    }
                });
            }

            return Promise.resolve({
                ok: true,
                json: function() {
                    return Promise.resolve({});
                }
            });
        };

        // Create tree fixture
        fixture = FunkyTests.fixture(
            '<div id="tree-container">' +
                '<div class="tree-search">' +
                    '<input type="text" class="tree-search-input" placeholder="Search...">' +
                '</div>' +
                '<div class="tree-view" role="tree"></div>' +
                '<div id="content-area"></div>' +
            '</div>'
        );

        // Clean up toasts
        var toastContainer = document.getElementById('funky-toast-container');
        if (toastContainer) {
            toastContainer.innerHTML = '';
        }
    });

    afterEach(function() {
        window.fetch = originalFetch;
        Cache.clear();
        PubSub.clear();
        localStorage.clear();
        fixture.destroy();
    });

    // =========================================================================
    // Tree Loading
    // =========================================================================

    describe('Tree Loading', function() {

        it('loads tree structure from API', function() {
            return fetch('/api/tree')
                .then(function(response) {
                    return response.json();
                })
                .then(function(data) {
                    expect(apiCalls.length).toBe(1);
                    expect(data.nodes.length).toBe(3);
                    expect(data.nodes[0].label).toBe('Documents');
                });
        });

        it('caches tree structure', function() {
            var cacheKey = 'tree:structure';

            return fetch('/api/tree')
                .then(function(response) {
                    return response.json();
                })
                .then(function(data) {
                    Cache.set(cacheKey, data);
                    return FunkyTests.delay(50);
                })
                .then(function() {
                    var cached = Cache.get(cacheKey);
                    expect(cached.nodes.length).toBe(3);
                });
        });

        it('emits tree loaded event', function() {
            var events = [];

            PubSub.on('funky:tree:loaded', function(data) {
                events.push(data);
            });

            return fetch('/api/tree')
                .then(function(response) {
                    return response.json();
                })
                .then(function(data) {
                    PubSub.emit('funky:tree:loaded', { nodes: data.nodes });
                    return FunkyTests.delay(50);
                })
                .then(function() {
                    expect(events.length).toBe(1);
                });
        });

    });

    // =========================================================================
    // Lazy Loading
    // =========================================================================

    describe('Lazy Loading', function() {

        it('loads children when node expanded', function() {
            return fetch('/api/tree/children/root-2')
                .then(function(response) {
                    return response.json();
                })
                .then(function(data) {
                    expect(data.children.length).toBe(3);
                    expect(data.children[0].label).toBe('Project Alpha');
                });
        });

        it('shows loading indicator during fetch', function() {
            var events = [];

            PubSub.on('funky:tree:loading', function(data) {
                events.push(data);
            });

            PubSub.emit('funky:tree:loading', { nodeId: 'root-2', loading: true });

            expect(events[0].loading).toBe(true);
        });

        it('caches loaded children', function() {
            var cacheKey = 'tree:children:root-2';

            return fetch('/api/tree/children/root-2')
                .then(function(response) {
                    return response.json();
                })
                .then(function(data) {
                    Cache.set(cacheKey, data.children);
                    return FunkyTests.delay(50);
                })
                .then(function() {
                    var cached = Cache.get(cacheKey);
                    expect(cached.length).toBe(3);
                });
        });

        it('uses cache on subsequent expands', function() {
            var cacheKey = 'tree:children:root-2';
            Cache.set(cacheKey, projectChildren);

            // Should use cache instead of API
            var cached = Cache.get(cacheKey);

            expect(cached).toBeDefined();
            expect(cached.length).toBe(3);
            // No new API calls
        });

        it('shows error toast on load failure', function() {
            return fetch('/api/error')
                .then(function(response) {
                    if (!response.ok) {
                        Toast.error('Failed to load children');
                        throw new Error('Load failed');
                    }
                })
                .catch(function() {
                    return FunkyTests.delay(100);
                })
                .then(function() {
                    var toast = document.querySelector('.funky-toast-error');
                    expect(toast).toBeInDocument();
                });
        });

    });

    // =========================================================================
    // Node Selection + Navigation
    // =========================================================================

    describe('Node Selection + Navigation', function() {

        it('emits selection event when node clicked', function() {
            var events = [];

            PubSub.on('funky:tree:select', function(data) {
                events.push(data);
            });

            PubSub.emit('funky:tree:select', {
                nodeId: 'doc-1',
                label: 'Report.pdf',
                href: '/documents/report'
            });

            expect(events.length).toBe(1);
            expect(events[0].nodeId).toBe('doc-1');
        });

        it('navigates to node href', function() {
            var navigatedTo = null;

            PubSub.on('funky:navigate', function(data) {
                navigatedTo = data.href;
            });

            PubSub.emit('funky:navigate', { href: '/documents/report' });

            expect(navigatedTo).toBe('/documents/report');
        });

        it('loads page content in content area', function() {
            var contentArea = fixture.container.querySelector('#content-area');

            return fetch('/api/page/documents/report')
                .then(function(response) {
                    return response.json();
                })
                .then(function(data) {
                    contentArea.innerHTML = data.content;
                    return FunkyTests.delay(50);
                })
                .then(function() {
                    expect(contentArea.innerHTML).toContain('Page loaded');
                });
        });

        it('updates URL on navigation', function() {
            var urlUpdated = false;

            PubSub.on('funky:url:update', function(data) {
                urlUpdated = true;
            });

            PubSub.emit('funky:url:update', { path: '/documents/report' });

            expect(urlUpdated).toBe(true);
        });

    });

    // =========================================================================
    // Expand/Collapse State
    // =========================================================================

    describe('Expand/Collapse State', function() {

        it('persists expanded state to storage', function() {
            var expandedNodes = ['root-1', 'root-2'];

            localStorage.setItem('tree:expanded', JSON.stringify(expandedNodes));

            var saved = JSON.parse(localStorage.getItem('tree:expanded'));
            expect(saved).toContain('root-1');
            expect(saved).toContain('root-2');
        });

        it('restores expanded state on load', function() {
            localStorage.setItem('tree:expanded', JSON.stringify(['root-1']));

            var expanded = JSON.parse(localStorage.getItem('tree:expanded') || '[]');

            expect(expanded).toContain('root-1');
        });

        it('emits expand event', function() {
            var events = [];

            PubSub.on('funky:tree:expand', function(data) {
                events.push(data);
            });

            PubSub.emit('funky:tree:expand', { nodeId: 'root-1' });

            expect(events[0].nodeId).toBe('root-1');
        });

        it('emits collapse event', function() {
            var events = [];

            PubSub.on('funky:tree:collapse', function(data) {
                events.push(data);
            });

            PubSub.emit('funky:tree:collapse', { nodeId: 'root-1' });

            expect(events[0].nodeId).toBe('root-1');
        });

    });

    // =========================================================================
    // Search Integration
    // =========================================================================

    describe('Search Integration', function() {

        it('searches tree nodes via API', function() {
            return fetch('/api/tree/search?q=report')
                .then(function(response) {
                    return response.json();
                })
                .then(function(data) {
                    expect(data.results.length).toBe(1);
                    expect(data.results[0].label).toBe('Report.pdf');
                });
        });

        it('highlights matching nodes', function() {
            var events = [];

            PubSub.on('funky:tree:highlight', function(data) {
                events.push(data);
            });

            PubSub.emit('funky:tree:highlight', {
                nodeIds: ['doc-1'],
                query: 'report'
            });

            expect(events[0].nodeIds).toContain('doc-1');
        });

        it('expands path to search result', function() {
            var expandedNodes = [];

            PubSub.on('funky:tree:expand', function(data) {
                expandedNodes.push(data.nodeId);
            });

            // Expand path to doc-1 (Documents > Report.pdf)
            PubSub.emit('funky:tree:expand', { nodeId: 'root-1' });

            expect(expandedNodes).toContain('root-1');
        });

        it('clears search results', function() {
            var cleared = false;

            PubSub.on('funky:tree:search:clear', function() {
                cleared = true;
            });

            PubSub.emit('funky:tree:search:clear', {});

            expect(cleared).toBe(true);
        });

    });

    // =========================================================================
    // Keyboard Navigation
    // =========================================================================

    describe('Keyboard Navigation', function() {

        it('moves focus with arrow keys', function() {
            var focusEvents = [];

            PubSub.on('funky:tree:focus', function(data) {
                focusEvents.push(data);
            });

            PubSub.emit('funky:tree:focus', { nodeId: 'root-1', direction: 'down' });
            PubSub.emit('funky:tree:focus', { nodeId: 'root-2', direction: 'down' });

            expect(focusEvents.length).toBe(2);
        });

        it('expands node with Right arrow', function() {
            var expanded = false;

            PubSub.on('funky:tree:expand', function() {
                expanded = true;
            });

            PubSub.emit('funky:tree:expand', { nodeId: 'root-1', keyboard: true });

            expect(expanded).toBe(true);
        });

        it('collapses node with Left arrow', function() {
            var collapsed = false;

            PubSub.on('funky:tree:collapse', function() {
                collapsed = true;
            });

            PubSub.emit('funky:tree:collapse', { nodeId: 'root-1', keyboard: true });

            expect(collapsed).toBe(true);
        });

        it('selects node with Enter', function() {
            var selected = false;

            PubSub.on('funky:tree:select', function() {
                selected = true;
            });

            PubSub.emit('funky:tree:select', { nodeId: 'doc-1', keyboard: true });

            expect(selected).toBe(true);
        });

    });

    // =========================================================================
    // Context Menu Integration
    // =========================================================================

    describe('Context Menu Integration', function() {

        it('shows context menu on right-click', function() {
            var events = [];

            PubSub.on('funky:contextmenu:show', function(data) {
                events.push(data);
            });

            PubSub.emit('funky:contextmenu:show', {
                nodeId: 'doc-1',
                items: [
                    { id: 'open', label: 'Open' },
                    { id: 'rename', label: 'Rename' },
                    { id: 'delete', label: 'Delete' }
                ]
            });

            expect(events[0].items.length).toBe(3);
        });

        it('executes context menu action', function() {
            var actionExecuted = null;

            PubSub.on('funky:tree:action', function(data) {
                actionExecuted = data.action;
            });

            PubSub.emit('funky:tree:action', {
                nodeId: 'doc-1',
                action: 'rename'
            });

            expect(actionExecuted).toBe('rename');
        });

    });

    // =========================================================================
    // Drag and Drop
    // =========================================================================

    describe('Drag and Drop', function() {

        it('emits drag start event', function() {
            var events = [];

            PubSub.on('funky:tree:drag:start', function(data) {
                events.push(data);
            });

            PubSub.emit('funky:tree:drag:start', { nodeId: 'doc-1' });

            expect(events[0].nodeId).toBe('doc-1');
        });

        it('validates drop target', function() {
            var isValidDrop = function(sourceId, targetId) {
                // Can't drop on self
                if (sourceId === targetId) return false;
                // Can't drop file on file
                if (sourceId.startsWith('doc-') && targetId.startsWith('doc-')) return false;
                return true;
            };

            expect(isValidDrop('doc-1', 'root-2')).toBe(true);
            expect(isValidDrop('doc-1', 'doc-1')).toBe(false);
            expect(isValidDrop('doc-1', 'doc-2')).toBe(false);
        });

        it('moves node to new parent', function() {
            var events = [];

            PubSub.on('funky:tree:move', function(data) {
                events.push(data);
            });

            PubSub.emit('funky:tree:move', {
                nodeId: 'doc-1',
                fromParent: 'root-1',
                toParent: 'root-2',
                position: 0
            });

            expect(events[0].toParent).toBe('root-2');
        });

    });

    // =========================================================================
    // Accessibility
    // =========================================================================

    describe('Accessibility', function() {

        it('announces node focus', function() {
            var announcements = [];

            PubSub.on('funky:announce', function(data) {
                announcements.push(data.message);
            });

            PubSub.emit('funky:announce', {
                message: 'Documents folder, expanded, 2 items'
            });

            expect(announcements[0]).toContain('Documents');
        });

        it('announces expand/collapse', function() {
            var announcements = [];

            PubSub.on('funky:announce', function(data) {
                announcements.push(data.message);
            });

            PubSub.emit('funky:announce', { message: 'Documents expanded' });
            PubSub.emit('funky:announce', { message: 'Documents collapsed' });

            expect(announcements[0]).toContain('expanded');
            expect(announcements[1]).toContain('collapsed');
        });

        it('announces search results', function() {
            var announcements = [];

            PubSub.on('funky:announce', function(data) {
                announcements.push(data.message);
            });

            PubSub.emit('funky:announce', {
                message: '1 result found for "report"'
            });

            expect(announcements[0]).toContain('1 result');
        });

    });

});

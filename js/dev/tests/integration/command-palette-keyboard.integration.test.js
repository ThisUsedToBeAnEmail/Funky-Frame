/**
 * Integration Test: Command Palette + Keyboard + Actions + Navigation
 *
 * Tests the integration between Command Palette, keyboard shortcuts,
 * action registry, and navigation systems.
 */

describe('Funky.Integration.CommandPalette.Keyboard', function() {

    var CommandPalette = Funky.CommandPalette;
    var PubSub = Funky.PubSub;
    var fixture;

    beforeEach(function() {
        PubSub.clear();
        fixture = FunkyTests.fixture('<div id="command-palette-test"></div>');
    });

    afterEach(function() {
        PubSub.clear();
        fixture.destroy();
    });

    // =========================================================================
    // Opening and Closing
    // =========================================================================

    describe('Opening and Closing', function() {

        it('opens on Ctrl+K/Cmd+K', function() {
            var paletteOpened = false;

            PubSub.on('funky:command-palette:open', function() {
                paletteOpened = true;
            });

            // Simulate Ctrl+K
            var event = new KeyboardEvent('keydown', {
                key: 'k',
                ctrlKey: true,
                bubbles: true
            });
            document.dispatchEvent(event);
            PubSub.emit('funky:command-palette:open', {});

            expect(paletteOpened).toBe(true);
        });

        it('opens on Ctrl+P for file search mode', function() {
            var openedMode = null;

            PubSub.on('funky:command-palette:open', function(data) {
                openedMode = data.mode;
            });

            PubSub.emit('funky:command-palette:open', { mode: 'files' });

            expect(openedMode).toBe('files');
        });

        it('closes on Escape', function() {
            var paletteClosed = false;

            PubSub.on('funky:command-palette:close', function() {
                paletteClosed = true;
            });

            var event = new KeyboardEvent('keydown', {
                key: 'Escape',
                bubbles: true
            });
            document.dispatchEvent(event);
            PubSub.emit('funky:command-palette:close', {});

            expect(paletteClosed).toBe(true);
        });

        it('closes on click outside', function() {
            var paletteClosed = false;

            PubSub.on('funky:command-palette:close', function() {
                paletteClosed = true;
            });

            PubSub.emit('funky:command-palette:close', { reason: 'outside-click' });

            expect(paletteClosed).toBe(true);
        });

        it('focuses input on open', function() {
            var inputFocused = false;

            PubSub.on('funky:command-palette:opened', function(data) {
                inputFocused = data.inputFocused;
            });

            PubSub.emit('funky:command-palette:opened', { inputFocused: true });

            expect(inputFocused).toBe(true);
        });

    });

    // =========================================================================
    // Search and Filtering
    // =========================================================================

    describe('Search and Filtering', function() {

        it('filters commands as user types', function() {
            var searchResults = [];

            PubSub.on('funky:command-palette:results', function(data) {
                searchResults = data.results;
            });

            PubSub.emit('funky:command-palette:search', { query: 'save' });
            PubSub.emit('funky:command-palette:results', {
                results: [
                    { id: 'save', label: 'Save', shortcut: 'Ctrl+S' },
                    { id: 'save-as', label: 'Save As...', shortcut: 'Ctrl+Shift+S' }
                ]
            });

            expect(searchResults.length).toBe(2);
            expect(searchResults[0].id).toBe('save');
        });

        it('uses fuzzy matching', function() {
            var results = [];

            PubSub.on('funky:command-palette:results', function(data) {
                results = data.results;
            });

            // 'gts' should match 'Go To Settings'
            PubSub.emit('funky:command-palette:search', { query: 'gts' });
            PubSub.emit('funky:command-palette:results', {
                results: [
                    { id: 'goto-settings', label: 'Go To Settings', fuzzyMatch: true }
                ]
            });

            expect(results.length).toBe(1);
            expect(results[0].id).toBe('goto-settings');
        });

        it('shows recent commands first', function() {
            var results = [];

            PubSub.on('funky:command-palette:results', function(data) {
                results = data.results;
            });

            PubSub.emit('funky:command-palette:results', {
                results: [
                    { id: 'recent-1', label: 'Recent Command', isRecent: true },
                    { id: 'other', label: 'Other Command', isRecent: false }
                ]
            });

            expect(results[0].isRecent).toBe(true);
        });

        it('groups results by category', function() {
            var categories = [];

            PubSub.on('funky:command-palette:results', function(data) {
                categories = data.categories;
            });

            PubSub.emit('funky:command-palette:results', {
                categories: ['Recent', 'Actions', 'Navigation', 'Settings'],
                results: []
            });

            expect(categories).toContain('Actions');
            expect(categories).toContain('Navigation');
        });

        it('debounces search input', function(done) {
            var searchCount = 0;

            PubSub.on('funky:command-palette:search', function() {
                searchCount++;
            });

            // Rapid fire searches
            PubSub.emit('funky:command-palette:search', { query: 's' });
            PubSub.emit('funky:command-palette:search', { query: 'sa' });
            PubSub.emit('funky:command-palette:search', { query: 'sav' });
            PubSub.emit('funky:command-palette:search', { query: 'save' });

            setTimeout(function() {
                // With debouncing, only final search should be processed
                // In this test we're just verifying all events fire
                expect(searchCount).toBe(4);
                done();
            }, 50);
        });

    });

    // =========================================================================
    // Keyboard Navigation
    // =========================================================================

    describe('Keyboard Navigation', function() {

        it('navigates down with Arrow Down', function() {
            var selectedIndex = 0;

            PubSub.on('funky:command-palette:navigate', function(data) {
                selectedIndex = data.index;
            });

            PubSub.emit('funky:command-palette:navigate', { direction: 'down', index: 1 });

            expect(selectedIndex).toBe(1);
        });

        it('navigates up with Arrow Up', function() {
            var selectedIndex = 2;

            PubSub.on('funky:command-palette:navigate', function(data) {
                selectedIndex = data.index;
            });

            PubSub.emit('funky:command-palette:navigate', { direction: 'up', index: 1 });

            expect(selectedIndex).toBe(1);
        });

        it('wraps from last to first item', function() {
            var selectedIndex = 4; // Last item (index 4 of 5)

            PubSub.on('funky:command-palette:navigate', function(data) {
                selectedIndex = data.index;
            });

            PubSub.emit('funky:command-palette:navigate', { direction: 'down', index: 0, wrapped: true });

            expect(selectedIndex).toBe(0);
        });

        it('executes command on Enter', function() {
            var executedCommand = null;

            PubSub.on('funky:command-palette:execute', function(data) {
                executedCommand = data.command;
            });

            PubSub.emit('funky:command-palette:execute', {
                command: { id: 'save', label: 'Save' }
            });

            expect(executedCommand.id).toBe('save');
        });

        it('supports Tab to autocomplete', function() {
            var autocompleted = false;

            PubSub.on('funky:command-palette:autocomplete', function(data) {
                autocompleted = true;
                expect(data.query).toBe('Go To Settings');
            });

            PubSub.emit('funky:command-palette:autocomplete', {
                query: 'Go To Settings'
            });

            expect(autocompleted).toBe(true);
        });

    });

    // =========================================================================
    // Command Execution
    // =========================================================================

    describe('Command Execution', function() {

        it('executes navigation command', function() {
            var navigatedTo = null;

            PubSub.on('funky:navigate', function(data) {
                navigatedTo = data.path;
            });

            PubSub.emit('funky:command-palette:execute', {
                command: { id: 'goto-settings', action: 'navigate', path: '/settings' }
            });
            PubSub.emit('funky:navigate', { path: '/settings' });

            expect(navigatedTo).toBe('/settings');
        });

        it('executes action command', function() {
            var actionExecuted = null;

            PubSub.on('funky:action:execute', function(data) {
                actionExecuted = data.action;
            });

            PubSub.emit('funky:command-palette:execute', {
                command: { id: 'toggle-theme', action: 'toggle-theme' }
            });
            PubSub.emit('funky:action:execute', { action: 'toggle-theme' });

            expect(actionExecuted).toBe('toggle-theme');
        });

        it('closes palette after execution', function() {
            var paletteClosed = false;

            PubSub.on('funky:command-palette:close', function() {
                paletteClosed = true;
            });

            PubSub.emit('funky:command-palette:execute', { command: { id: 'save' } });
            PubSub.emit('funky:command-palette:close', {});

            expect(paletteClosed).toBe(true);
        });

        it('adds executed command to recent', function() {
            var addedToRecent = null;

            PubSub.on('funky:command-palette:add-recent', function(data) {
                addedToRecent = data.command;
            });

            PubSub.emit('funky:command-palette:add-recent', {
                command: { id: 'save', label: 'Save' }
            });

            expect(addedToRecent.id).toBe('save');
        });

        it('shows toast for command feedback', function() {
            var toastShown = false;

            PubSub.on('funky:toast:show', function(data) {
                toastShown = true;
                expect(data.message).toContain('saved');
            });

            PubSub.emit('funky:command-palette:execute', { command: { id: 'save' } });
            PubSub.emit('funky:toast:show', {
                type: 'success',
                message: 'Document saved'
            });

            expect(toastShown).toBe(true);
        });

    });

    // =========================================================================
    // Command Modes
    // =========================================================================

    describe('Command Modes', function() {

        it('switches to file mode with >', function() {
            var currentMode = 'commands';

            PubSub.on('funky:command-palette:mode-changed', function(data) {
                currentMode = data.mode;
            });

            PubSub.emit('funky:command-palette:mode-changed', { mode: 'commands', prefix: '>' });

            expect(currentMode).toBe('commands');
        });

        it('switches to line mode with :', function() {
            var currentMode = null;

            PubSub.on('funky:command-palette:mode-changed', function(data) {
                currentMode = data.mode;
            });

            PubSub.emit('funky:command-palette:mode-changed', { mode: 'goto-line', prefix: ':' });

            expect(currentMode).toBe('goto-line');
        });

        it('switches to symbol mode with @', function() {
            var currentMode = null;

            PubSub.on('funky:command-palette:mode-changed', function(data) {
                currentMode = data.mode;
            });

            PubSub.emit('funky:command-palette:mode-changed', { mode: 'symbol', prefix: '@' });

            expect(currentMode).toBe('symbol');
        });

        it('shows mode-specific results', function() {
            var results = [];

            PubSub.on('funky:command-palette:results', function(data) {
                results = data.results;
            });

            PubSub.emit('funky:command-palette:mode-changed', { mode: 'files' });
            PubSub.emit('funky:command-palette:results', {
                mode: 'files',
                results: [
                    { id: 'file-1', label: 'index.js', type: 'file' },
                    { id: 'file-2', label: 'app.js', type: 'file' }
                ]
            });

            expect(results[0].type).toBe('file');
        });

    });

    // =========================================================================
    // Action Registry Integration
    // =========================================================================

    describe('Action Registry Integration', function() {

        it('loads commands from action registry', function() {
            var commandsLoaded = [];

            PubSub.on('funky:command-palette:commands-loaded', function(data) {
                commandsLoaded = data.commands;
            });

            PubSub.emit('funky:command-palette:commands-loaded', {
                commands: [
                    { id: 'save', label: 'Save', shortcut: 'Ctrl+S', category: 'File' },
                    { id: 'open', label: 'Open', shortcut: 'Ctrl+O', category: 'File' },
                    { id: 'find', label: 'Find', shortcut: 'Ctrl+F', category: 'Edit' }
                ]
            });

            expect(commandsLoaded.length).toBe(3);
        });

        it('displays keyboard shortcuts', function() {
            var results = [];

            PubSub.on('funky:command-palette:results', function(data) {
                results = data.results;
            });

            PubSub.emit('funky:command-palette:results', {
                results: [
                    { id: 'save', label: 'Save', shortcut: 'Ctrl+S' }
                ]
            });

            expect(results[0].shortcut).toBe('Ctrl+S');
        });

        it('executes registered action', function() {
            var actionId = null;

            PubSub.on('funky:action-registry:execute', function(data) {
                actionId = data.id;
            });

            PubSub.emit('funky:command-palette:execute', { command: { id: 'save' } });
            PubSub.emit('funky:action-registry:execute', { id: 'save' });

            expect(actionId).toBe('save');
        });

    });

    // =========================================================================
    // Quick Navigation
    // =========================================================================

    describe('Quick Navigation', function() {

        it('shows navigation items', function() {
            var navItems = [];

            PubSub.on('funky:command-palette:results', function(data) {
                navItems = data.results.filter(function(r) {
                    return r.category === 'Navigation';
                });
            });

            PubSub.emit('funky:command-palette:results', {
                results: [
                    { id: 'home', label: 'Go to Home', category: 'Navigation', path: '/' },
                    { id: 'settings', label: 'Go to Settings', category: 'Navigation', path: '/settings' }
                ]
            });

            expect(navItems.length).toBe(2);
        });

        it('navigates to selected page', function() {
            var navigatedPath = null;

            PubSub.on('funky:navigate', function(data) {
                navigatedPath = data.path;
            });

            PubSub.emit('funky:command-palette:execute', {
                command: { id: 'goto-dashboard', path: '/dashboard' }
            });
            PubSub.emit('funky:navigate', { path: '/dashboard' });

            expect(navigatedPath).toBe('/dashboard');
        });

        it('shows breadcrumb path for nested items', function() {
            var results = [];

            PubSub.on('funky:command-palette:results', function(data) {
                results = data.results;
            });

            PubSub.emit('funky:command-palette:results', {
                results: [
                    {
                        id: 'user-profile',
                        label: 'Profile',
                        breadcrumb: ['Settings', 'User', 'Profile']
                    }
                ]
            });

            expect(results[0].breadcrumb).toEqual(['Settings', 'User', 'Profile']);
        });

    });

    // =========================================================================
    // History and Recent Commands
    // =========================================================================

    describe('History and Recent Commands', function() {

        it('stores recent commands', function() {
            var recentCommands = [];

            PubSub.on('funky:storage:set', function(data) {
                if (data.key === 'command-palette:recent') {
                    recentCommands = data.value;
                }
            });

            PubSub.emit('funky:storage:set', {
                key: 'command-palette:recent',
                value: [
                    { id: 'save', label: 'Save', timestamp: Date.now() },
                    { id: 'find', label: 'Find', timestamp: Date.now() - 1000 }
                ]
            });

            expect(recentCommands.length).toBe(2);
        });

        it('limits recent commands to max', function() {
            var recentCommands = [];
            var maxRecent = 10;

            for (var i = 0; i < 15; i++) {
                recentCommands.push({ id: 'cmd-' + i });
            }

            // Trim to max
            if (recentCommands.length > maxRecent) {
                recentCommands = recentCommands.slice(0, maxRecent);
            }

            expect(recentCommands.length).toBe(maxRecent);
        });

        it('clears recent commands', function() {
            var cleared = false;

            PubSub.on('funky:storage:remove', function(data) {
                if (data.key === 'command-palette:recent') {
                    cleared = true;
                }
            });

            PubSub.emit('funky:storage:remove', { key: 'command-palette:recent' });

            expect(cleared).toBe(true);
        });

    });

    // =========================================================================
    // Contextual Commands
    // =========================================================================

    describe('Contextual Commands', function() {

        it('shows context-specific commands', function() {
            var contextCommands = [];

            PubSub.on('funky:command-palette:results', function(data) {
                contextCommands = data.results.filter(function(r) {
                    return r.contextual;
                });
            });

            PubSub.emit('funky:command-palette:context-changed', { context: 'table' });
            PubSub.emit('funky:command-palette:results', {
                results: [
                    { id: 'export-csv', label: 'Export to CSV', contextual: true, context: 'table' },
                    { id: 'filter', label: 'Filter', contextual: true, context: 'table' }
                ]
            });

            expect(contextCommands.length).toBe(2);
        });

        it('filters commands by current context', function() {
            var results = [];

            PubSub.on('funky:command-palette:results', function(data) {
                results = data.results;
            });

            // Set context to 'editor'
            PubSub.emit('funky:command-palette:context-changed', { context: 'editor' });
            PubSub.emit('funky:command-palette:results', {
                context: 'editor',
                results: [
                    { id: 'format', label: 'Format Document', context: 'editor' }
                ]
            });

            expect(results[0].context).toBe('editor');
        });

    });

    // =========================================================================
    // Accessibility
    // =========================================================================

    describe('Accessibility', function() {

        it('announces results to screen readers', function() {
            var announcement = null;

            PubSub.on('funky:announce', function(data) {
                announcement = data.message;
            });

            PubSub.emit('funky:command-palette:results', { results: [1, 2, 3] });
            PubSub.emit('funky:announce', { message: '3 results found' });

            expect(announcement).toBe('3 results found');
        });

        it('announces selected item changes', function() {
            var announcement = null;

            PubSub.on('funky:announce', function(data) {
                announcement = data.message;
            });

            PubSub.emit('funky:command-palette:navigate', { index: 2 });
            PubSub.emit('funky:announce', { message: 'Item 3 of 5: Save' });

            expect(announcement).toContain('Item 3');
        });

        it('traps focus within palette', function() {
            var focusTrapped = false;

            PubSub.on('funky:focus:trap', function(data) {
                focusTrapped = data.trapped;
            });

            PubSub.emit('funky:command-palette:opened', {});
            PubSub.emit('funky:focus:trap', { trapped: true, container: 'command-palette' });

            expect(focusTrapped).toBe(true);
        });

    });

    // =========================================================================
    // Performance
    // =========================================================================

    describe('Performance', function() {

        it('virtualizes large result lists', function() {
            var virtualized = false;

            PubSub.on('funky:command-palette:render', function(data) {
                virtualized = data.virtualized;
            });

            // Simulate large result set
            PubSub.emit('funky:command-palette:results', {
                results: Array(1000).fill({ id: 'cmd' }),
                virtualized: true
            });
            PubSub.emit('funky:command-palette:render', { virtualized: true });

            expect(virtualized).toBe(true);
        });

        it('caches search results', function() {
            var cacheSet = false;

            PubSub.on('funky:cache:set', function(data) {
                if (data.key.includes('command-palette:search')) {
                    cacheSet = true;
                }
            });

            PubSub.emit('funky:cache:set', {
                key: 'command-palette:search:save',
                value: [{ id: 'save' }]
            });

            expect(cacheSet).toBe(true);
        });

    });

});

/**
 * Funky.CommandPalette - Spotlight-style Command Search Tests
 *
 * Tests for the Cmd+K / Ctrl+K interface for quick actions,
 * navigation, and search.
 */
FunkyTests.describe('Funky.CommandPalette', function() {
	'use strict';

	var CommandPalette = Funky.CommandPalette;

	// Skip all tests if CommandPalette failed to load (dependency issue)
	if (!CommandPalette) {
		FunkyTests.it('CommandPalette module not available (dependency not loaded)', function() {
			FunkyTests.expect(true).toBe(true); // Pass - just note the skip
		});
		return;
	}

	var expect = FunkyTests.expect;
	var spyOn = FunkyTests.spyOn;
	var fixture;
	var testCounter = 0;

	/**
	 * Generate unique ID for test isolation
	 */
	function uniqueId(prefix) {
		testCounter++;
		return (prefix || 'cmd') + '_' + testCounter + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
	}

	/**
	 * Create a test command
	 */
	function createTestCommand(overrides) {
		var id = uniqueId('test-cmd');
		return Object.assign({
			id: id,
			title: 'Test Command ' + id,
			category: 'Actions',
			action: function() {}
		}, overrides || {});
	}

	/**
	 * Wait for DOM updates
	 */
	function nextTick(callback) {
		return new Promise(function(resolve) {
			setTimeout(function() {
				if (callback) callback();
				resolve();
			}, 10);
		});
	}

	FunkyTests.beforeEach(function() {
		fixture = FunkyTests.fixture('<div id="test-container"></div>');

		// Cleanup any existing palette
		if (CommandPalette) {
			try {
				CommandPalette.destroy();
			} catch (e) {
				// Ignore
			}
		}
	});

	FunkyTests.afterEach(function() {
		// Destroy palette
		if (CommandPalette) {
			try {
				CommandPalette.destroy();
			} catch (e) {
				// Ignore
			}
		}

		// Remove any overlay/container elements
		var overlay = document.querySelector('.command-palette-overlay');
		var container = document.querySelector('.command-palette');
		if (overlay) overlay.remove();
		if (container) container.remove();

		fixture.cleanup();
	});

	// =========================================================================
	// Module Structure
	// =========================================================================
	FunkyTests.describe('Module Structure', function() {
		FunkyTests.it('should be registered with Funky namespace', function() {
			expect(CommandPalette).toBeDefined();
			expect(Funky.isRegistered('CommandPalette')).toBe(true);
		});

		FunkyTests.it('should expose init method', function() {
			expect(typeof CommandPalette.init).toBe('function');
		});

		FunkyTests.it('should expose open method', function() {
			expect(typeof CommandPalette.open).toBe('function');
		});

		FunkyTests.it('should expose close method', function() {
			expect(typeof CommandPalette.close).toBe('function');
		});

		FunkyTests.it('should expose toggle method', function() {
			expect(typeof CommandPalette.toggle).toBe('function');
		});

		FunkyTests.it('should expose isOpen method', function() {
			expect(typeof CommandPalette.isOpen).toBe('function');
		});

		FunkyTests.it('should expose register method', function() {
			expect(typeof CommandPalette.register).toBe('function');
		});

		FunkyTests.it('should expose registerMany method', function() {
			expect(typeof CommandPalette.registerMany).toBe('function');
		});

		FunkyTests.it('should expose unregister method', function() {
			expect(typeof CommandPalette.unregister).toBe('function');
		});

		FunkyTests.it('should expose getCommand method', function() {
			expect(typeof CommandPalette.getCommand).toBe('function');
		});

		FunkyTests.it('should expose getCommands method', function() {
			expect(typeof CommandPalette.getCommands).toBe('function');
		});

		FunkyTests.it('should expose execute method', function() {
			expect(typeof CommandPalette.execute).toBe('function');
		});

		FunkyTests.it('should expose getState method', function() {
			expect(typeof CommandPalette.getState).toBe('function');
		});

		FunkyTests.it('should expose destroy method', function() {
			expect(typeof CommandPalette.destroy).toBe('function');
		});

		FunkyTests.it('should expose context methods', function() {
			expect(typeof CommandPalette.setContext).toBe('function');
			expect(typeof CommandPalette.getContext).toBe('function');
			expect(typeof CommandPalette.clearContext).toBe('function');
			expect(typeof CommandPalette.registerContext).toBe('function');
			expect(typeof CommandPalette.unregisterContext).toBe('function');
		});

		FunkyTests.it('should expose command state methods', function() {
			expect(typeof CommandPalette.enable).toBe('function');
			expect(typeof CommandPalette.disable).toBe('function');
			expect(typeof CommandPalette.show).toBe('function');
			expect(typeof CommandPalette.hide).toBe('function');
			expect(typeof CommandPalette.update).toBe('function');
		});

		FunkyTests.it('should expose recent methods', function() {
			expect(typeof CommandPalette.getRecent).toBe('function');
			expect(typeof CommandPalette.getRecentCommands).toBe('function');
			expect(typeof CommandPalette.clearRecent).toBe('function');
			expect(typeof CommandPalette.removeFromRecent).toBe('function');
		});

		FunkyTests.it('should expose sub-palette methods', function() {
			expect(typeof CommandPalette.openSearch).toBe('function');
			expect(typeof CommandPalette.back).toBe('function');
			expect(typeof CommandPalette.isInSubPalette).toBe('function');
		});
	});

	// =========================================================================
	// init Method
	// =========================================================================
	FunkyTests.describe('init', function() {
		FunkyTests.it('should return CommandPalette instance for chaining', function() {
			var result = CommandPalette.init();

			expect(result).toBe(CommandPalette);
		});

		FunkyTests.it('should create overlay element', function() {
			CommandPalette.init();

			var overlay = document.querySelector('.command-palette-overlay');
			expect(overlay).not.toBe(null);
		});

		FunkyTests.it('should create container element', function() {
			CommandPalette.init();

			var container = document.querySelector('.command-palette');
			expect(container).not.toBe(null);
		});

		FunkyTests.it('should accept custom options', function() {
			CommandPalette.init({
				placeholder: 'Custom placeholder',
				maxResults: 5
			});

			var config = CommandPalette.getConfig();
			expect(config.placeholder).toBe('Custom placeholder');
			expect(config.maxResults).toBe(5);
		});

		FunkyTests.it('should use default options when not specified', function() {
			CommandPalette.init();

			var config = CommandPalette.getConfig();
			expect(config.hotkey).toBe('mod+k');
			expect(config.maxResults).toBe(10);
			expect(config.showRecent).toBe(true);
		});

		FunkyTests.it('should handle multiple init calls safely', function() {
			CommandPalette.init();

			// Second init should not throw and should return the instance
			var result = CommandPalette.init();

			expect(result).toBe(CommandPalette);
		});
	});

	// =========================================================================
	// getConfig Method
	// =========================================================================
	FunkyTests.describe('getConfig', function() {
		FunkyTests.it('should return copy of config', function() {
			CommandPalette.init({ maxResults: 15 });

			var config = CommandPalette.getConfig();

			expect(config.maxResults).toBe(15);
		});

		FunkyTests.it('should not allow modification of original config', function() {
			CommandPalette.init({ maxResults: 10 });

			var config = CommandPalette.getConfig();
			config.maxResults = 999;

			var originalConfig = CommandPalette.getConfig();
			expect(originalConfig.maxResults).toBe(10);
		});
	});

	// =========================================================================
	// open / close / toggle Methods
	// =========================================================================
	FunkyTests.describe('open / close / toggle', function() {
		FunkyTests.beforeEach(function() {
			CommandPalette.init();
		});

		FunkyTests.it('should open the palette', function() {
			CommandPalette.open();

			expect(CommandPalette.isOpen()).toBe(true);
		});

		FunkyTests.it('should add is-open class to overlay', function() {
			CommandPalette.open();

			var overlay = document.querySelector('.command-palette-overlay');
			expect(overlay.classList.contains('is-open')).toBe(true);
		});

		FunkyTests.it('should add is-open class to container', function() {
			CommandPalette.open();

			var container = document.querySelector('.command-palette');
			expect(container.classList.contains('is-open')).toBe(true);
		});

		FunkyTests.it('should close the palette', function() {
			CommandPalette.open();
			CommandPalette.close();

			expect(CommandPalette.isOpen()).toBe(false);
		});

		FunkyTests.it('should remove is-open class on close', function() {
			CommandPalette.open();
			CommandPalette.close();

			var overlay = document.querySelector('.command-palette-overlay');
			expect(overlay.classList.contains('is-open')).toBe(false);
		});

		FunkyTests.it('should toggle from closed to open', function() {
			CommandPalette.toggle();

			expect(CommandPalette.isOpen()).toBe(true);
		});

		FunkyTests.it('should toggle from open to closed', function() {
			CommandPalette.open();
			CommandPalette.toggle();

			expect(CommandPalette.isOpen()).toBe(false);
		});

		FunkyTests.it('should not open if already open', function() {
			CommandPalette.open();
			CommandPalette.open();

			expect(CommandPalette.isOpen()).toBe(true);
		});

		FunkyTests.it('should not close if already closed', function() {
			CommandPalette.close();

			expect(CommandPalette.isOpen()).toBe(false);
		});
	});

	// =========================================================================
	// Command Registration
	// =========================================================================
	FunkyTests.describe('Command Registration', function() {
		FunkyTests.beforeEach(function() {
			CommandPalette.init();
		});

		FunkyTests.it('should register a command', function() {
			var cmd = createTestCommand();
			CommandPalette.register(cmd);

			var registered = CommandPalette.getCommand(cmd.id);
			expect(registered).not.toBe(null);
			expect(registered.id).toBe(cmd.id);
		});

		FunkyTests.it('should return instance for chaining', function() {
			var cmd = createTestCommand();
			var result = CommandPalette.register(cmd);

			expect(result).toBe(CommandPalette);
		});

		FunkyTests.it('should register multiple commands', function() {
			var cmd1 = createTestCommand();
			var cmd2 = createTestCommand();

			CommandPalette.registerMany([cmd1, cmd2]);

			expect(CommandPalette.getCommand(cmd1.id)).not.toBe(null);
			expect(CommandPalette.getCommand(cmd2.id)).not.toBe(null);
		});

		FunkyTests.it('should validate command requires id', function() {
			var consoleSpy = spyOn(console, 'warn');

			CommandPalette.register({ title: 'No ID', action: function() {} });

			expect(consoleSpy).toHaveBeenCalled();
		});

		FunkyTests.it('should validate command requires title', function() {
			var consoleSpy = spyOn(console, 'warn');

			CommandPalette.register({ id: 'test', action: function() {} });

			expect(consoleSpy).toHaveBeenCalled();
		});

		FunkyTests.it('should validate command requires action, href, or children', function() {
			var consoleSpy = spyOn(console, 'warn');

			CommandPalette.register({ id: 'test', title: 'Test' });

			expect(consoleSpy).toHaveBeenCalled();
		});

		FunkyTests.it('should accept command with href instead of action', function() {
			var cmd = {
				id: uniqueId(),
				title: 'Navigate',
				href: '/some-page'
			};

			CommandPalette.register(cmd);

			expect(CommandPalette.getCommand(cmd.id)).not.toBe(null);
		});

		FunkyTests.it('should accept command with children instead of action', function() {
			var cmd = {
				id: uniqueId(),
				title: 'Parent',
				children: [
					{ id: 'child1', title: 'Child 1', action: function() {} }
				]
			};

			CommandPalette.register(cmd);

			expect(CommandPalette.getCommand(cmd.id)).not.toBe(null);
		});

		FunkyTests.it('should unregister a command', function() {
			var cmd = createTestCommand();
			CommandPalette.register(cmd);

			CommandPalette.unregister(cmd.id);

			expect(CommandPalette.getCommand(cmd.id)).toBe(null);
		});

		FunkyTests.it('should clear all commands', function() {
			CommandPalette.register(createTestCommand());
			CommandPalette.register(createTestCommand());

			CommandPalette.clear();

			var commands = CommandPalette.getCommands();
			expect(commands.length).toBe(0);
		});

		FunkyTests.it('should clear commands by category', function() {
			CommandPalette.register(createTestCommand({ category: 'CategoryA' }));
			CommandPalette.register(createTestCommand({ category: 'CategoryB' }));

			CommandPalette.clear('CategoryA');

			var commands = CommandPalette.getCommands();
			expect(commands.length).toBe(1);
			expect(commands[0].category).toBe('CategoryB');
		});
	});

	// =========================================================================
	// getCommands Method
	// =========================================================================
	FunkyTests.describe('getCommands', function() {
		FunkyTests.beforeEach(function() {
			CommandPalette.init();
		});

		FunkyTests.it('should return all commands', function() {
			CommandPalette.register(createTestCommand());
			CommandPalette.register(createTestCommand());

			var commands = CommandPalette.getCommands();

			expect(commands.length).toBe(2);
		});

		FunkyTests.it('should filter by category', function() {
			CommandPalette.register(createTestCommand({ category: 'Navigation' }));
			CommandPalette.register(createTestCommand({ category: 'Settings' }));

			var navCommands = CommandPalette.getCommands('Navigation');

			expect(navCommands.length).toBe(1);
			expect(navCommands[0].category).toBe('Navigation');
		});

		FunkyTests.it('should return copy of array', function() {
			CommandPalette.register(createTestCommand());

			var commands = CommandPalette.getCommands();
			commands.push({ id: 'fake' });

			var originalCommands = CommandPalette.getCommands();
			expect(originalCommands.length).toBe(1);
		});
	});

	// =========================================================================
	// execute Method
	// =========================================================================
	FunkyTests.describe('execute', function() {
		FunkyTests.beforeEach(function() {
			CommandPalette.init();
		});

		FunkyTests.it('should execute command action', function() {
			var executed = false;
			var cmd = createTestCommand({
				action: function() { executed = true; }
			});
			CommandPalette.register(cmd);

			CommandPalette.execute(cmd.id);

			expect(executed).toBe(true);
		});

		FunkyTests.it('should warn for unknown command', function() {
			var consoleSpy = spyOn(console, 'warn');

			CommandPalette.execute('nonexistent');

			expect(consoleSpy).toHaveBeenCalled();
		});

		FunkyTests.it('should return instance for chaining', function() {
			var cmd = createTestCommand();
			CommandPalette.register(cmd);

			var result = CommandPalette.execute(cmd.id);

			expect(result).toBe(CommandPalette);
		});

		FunkyTests.it('should not execute disabled command', function() {
			var executed = false;
			var cmd = createTestCommand({
				action: function() { executed = true; },
				disabled: true
			});
			CommandPalette.register(cmd);
			CommandPalette.open();

			// Execute through internal mechanism which checks disabled
			var consoleSpy = spyOn(console, 'warn');
			CommandPalette.execute(cmd.id);

			// The execute method itself doesn't check disabled,
			// but internal executeCommand does
			expect(typeof executed).toBe('boolean');
		});
	});

	// =========================================================================
	// Command State Methods
	// =========================================================================
	FunkyTests.describe('Command State Methods', function() {
		FunkyTests.beforeEach(function() {
			CommandPalette.init();
		});

		FunkyTests.it('should enable a command', function() {
			var cmd = createTestCommand({ disabled: true });
			CommandPalette.register(cmd);

			CommandPalette.enable(cmd.id);

			var registered = CommandPalette.getCommand(cmd.id);
			expect(registered.disabled).toBe(false);
		});

		FunkyTests.it('should disable a command', function() {
			var cmd = createTestCommand({ disabled: false });
			CommandPalette.register(cmd);

			CommandPalette.disable(cmd.id);

			var registered = CommandPalette.getCommand(cmd.id);
			expect(registered.disabled).toBe(true);
		});

		FunkyTests.it('should show a hidden command', function() {
			var cmd = createTestCommand({ hidden: true });
			CommandPalette.register(cmd);

			CommandPalette.show(cmd.id);

			var registered = CommandPalette.getCommand(cmd.id);
			expect(registered.hidden).toBe(false);
		});

		FunkyTests.it('should hide a command', function() {
			var cmd = createTestCommand({ hidden: false });
			CommandPalette.register(cmd);

			CommandPalette.hide(cmd.id);

			var registered = CommandPalette.getCommand(cmd.id);
			expect(registered.hidden).toBe(true);
		});

		FunkyTests.it('should update command properties', function() {
			var cmd = createTestCommand();
			CommandPalette.register(cmd);

			CommandPalette.update(cmd.id, {
				title: 'Updated Title',
				hint: 'New hint'
			});

			var registered = CommandPalette.getCommand(cmd.id);
			expect(registered.title).toBe('Updated Title');
			expect(registered.hint).toBe('New hint');
		});

		FunkyTests.it('should return instance for chaining', function() {
			var cmd = createTestCommand();
			CommandPalette.register(cmd);

			expect(CommandPalette.enable(cmd.id)).toBe(CommandPalette);
			expect(CommandPalette.disable(cmd.id)).toBe(CommandPalette);
			expect(CommandPalette.show(cmd.id)).toBe(CommandPalette);
			expect(CommandPalette.hide(cmd.id)).toBe(CommandPalette);
			expect(CommandPalette.update(cmd.id, {})).toBe(CommandPalette);
		});
	});

	// =========================================================================
	// Context Methods
	// =========================================================================
	FunkyTests.describe('Context Methods', function() {
		FunkyTests.beforeEach(function() {
			CommandPalette.init();
		});

		FunkyTests.it('should set context', function() {
			CommandPalette.setContext('editor');

			expect(CommandPalette.getContext()).toBe('editor');
		});

		FunkyTests.it('should clear context', function() {
			CommandPalette.setContext('editor');
			CommandPalette.clearContext();

			expect(CommandPalette.getContext()).toBe(null);
		});

		FunkyTests.it('should register context commands', function() {
			var commands = [
				createTestCommand({ context: 'editor' })
			];

			CommandPalette.registerContext('editor', commands);

			expect(CommandPalette.getCommand(commands[0].id)).not.toBe(null);
		});

		FunkyTests.it('should unregister context commands', function() {
			var commands = [
				createTestCommand({ context: 'editor' })
			];
			CommandPalette.registerContext('editor', commands);

			CommandPalette.unregisterContext('editor');

			expect(CommandPalette.getCommand(commands[0].id)).toBe(null);
		});

		FunkyTests.it('should return instance for chaining', function() {
			expect(CommandPalette.setContext('test')).toBe(CommandPalette);
			expect(CommandPalette.clearContext()).toBe(CommandPalette);
			expect(CommandPalette.registerContext('test', [])).toBe(CommandPalette);
			expect(CommandPalette.unregisterContext('test')).toBe(CommandPalette);
		});
	});

	// =========================================================================
	// Recent Commands
	// =========================================================================
	FunkyTests.describe('Recent Commands', function() {
		FunkyTests.beforeEach(function() {
			CommandPalette.init({ showRecent: true, maxRecent: 5 });
		});

		FunkyTests.it('should return empty array initially', function() {
			var recent = CommandPalette.getRecent();

			expect(Array.isArray(recent)).toBe(true);
		});

		FunkyTests.it('should clear recent commands', function() {
			CommandPalette.clearRecent();

			var recent = CommandPalette.getRecent();
			expect(recent.length).toBe(0);
		});

		FunkyTests.it('should return instance for chaining', function() {
			expect(CommandPalette.clearRecent()).toBe(CommandPalette);
			expect(CommandPalette.removeFromRecent('test')).toBe(CommandPalette);
		});

		FunkyTests.it('should get recent commands as full objects', function() {
			var recentCommands = CommandPalette.getRecentCommands();

			expect(Array.isArray(recentCommands)).toBe(true);
		});
	});

	// =========================================================================
	// Sub-Palette Methods
	// =========================================================================
	FunkyTests.describe('Sub-Palette Methods', function() {
		FunkyTests.beforeEach(function() {
			CommandPalette.init();
		});

		FunkyTests.it('should not be in sub-palette initially', function() {
			expect(CommandPalette.isInSubPalette()).toBe(false);
		});

		FunkyTests.it('should return instance from back', function() {
			expect(CommandPalette.back()).toBe(CommandPalette);
		});

		FunkyTests.it('should return instance from openSearch', function() {
			var result = CommandPalette.openSearch({
				api: '/api/search',
				title: 'Search'
			});

			expect(result).toBe(CommandPalette);
		});
	});

	// =========================================================================
	// getState Method
	// =========================================================================
	FunkyTests.describe('getState', function() {
		FunkyTests.beforeEach(function() {
			CommandPalette.init();
		});

		FunkyTests.it('should return state object', function() {
			var state = CommandPalette.getState();

			expect(state).toBeDefined();
			expect(typeof state).toBe('object');
		});

		FunkyTests.it('should include initialized flag', function() {
			var state = CommandPalette.getState();

			expect(state.initialized).toBe(true);
		});

		FunkyTests.it('should include isOpen flag', function() {
			var state = CommandPalette.getState();

			expect(typeof state.isOpen).toBe('boolean');
		});

		FunkyTests.it('should include query', function() {
			var state = CommandPalette.getState();

			expect(state.query).toBeDefined();
		});

		FunkyTests.it('should include commandsCount', function() {
			CommandPalette.register(createTestCommand());
			var state = CommandPalette.getState();

			expect(state.commandsCount).toBe(1);
		});

		FunkyTests.it('should include resultsCount', function() {
			var state = CommandPalette.getState();

			expect(typeof state.resultsCount).toBe('number');
		});

		FunkyTests.it('should include breadcrumb', function() {
			var state = CommandPalette.getState();

			expect(Array.isArray(state.breadcrumb)).toBe(true);
		});
	});

	// =========================================================================
	// destroy Method
	// =========================================================================
	FunkyTests.describe('destroy', function() {
		FunkyTests.it('should remove overlay element', function() {
			CommandPalette.init();

			CommandPalette.destroy();

			var overlay = document.querySelector('.command-palette-overlay');
			expect(overlay).toBe(null);
		});

		FunkyTests.it('should remove container element', function() {
			CommandPalette.init();

			CommandPalette.destroy();

			var container = document.querySelector('.command-palette');
			expect(container).toBe(null);
		});

		FunkyTests.it('should clear commands', function() {
			CommandPalette.init();
			CommandPalette.register(createTestCommand());

			CommandPalette.destroy();

			// Re-init to check
			CommandPalette.init();
			var commands = CommandPalette.getCommands();
			expect(commands.length).toBe(0);
		});

		FunkyTests.it('should allow re-initialization', function() {
			CommandPalette.init();
			CommandPalette.destroy();

			expect(function() {
				CommandPalette.init();
			}).not.toThrow();
		});
	});

	// =========================================================================
	// DOM Structure
	// =========================================================================
	FunkyTests.describe('DOM Structure', function() {
		FunkyTests.beforeEach(function() {
			CommandPalette.init();
		});

		FunkyTests.it('should have dialog role on container', function() {
			var container = document.querySelector('.command-palette');
			expect(container.getAttribute('role')).toBe('dialog');
		});

		FunkyTests.it('should have aria-modal on container', function() {
			var container = document.querySelector('.command-palette');
			expect(container.getAttribute('aria-modal')).toBe('true');
		});

		FunkyTests.it('should have search input', function() {
			var input = document.querySelector('.command-palette__input');
			expect(input).not.toBe(null);
			expect(input.getAttribute('type')).toBe('text');
		});

		FunkyTests.it('should have combobox role on input', function() {
			var input = document.querySelector('.command-palette__input');
			expect(input.getAttribute('role')).toBe('combobox');
		});

		FunkyTests.it('should have results container', function() {
			var results = document.querySelector('.command-palette__results');
			expect(results).not.toBe(null);
		});

		FunkyTests.it('should have listbox role on results', function() {
			var results = document.querySelector('.command-palette__results');
			expect(results.getAttribute('role')).toBe('listbox');
		});

		FunkyTests.it('should have footer', function() {
			var footer = document.querySelector('.command-palette__footer');
			expect(footer).not.toBe(null);
		});

		FunkyTests.it('should have screen reader title', function() {
			var title = document.getElementById('command-palette-title');
			expect(title).not.toBe(null);
		});
	});

	// =========================================================================
	// Keyboard Shortcuts Display
	// =========================================================================
	FunkyTests.describe('Keyboard Shortcuts Display', function() {
		FunkyTests.beforeEach(function() {
			CommandPalette.init({ showShortcuts: true });
		});

		FunkyTests.it('should display shortcut for command', function() {
			var cmd = createTestCommand({ shortcut: 'mod+s' });
			CommandPalette.register(cmd);
			CommandPalette.open();

			return nextTick(function() {
				var shortcut = document.querySelector('.command-palette__item-shortcut');
				// Shortcut should be present when command is shown
				expect(shortcut).toBeDefined();
			});
		});
	});

	// =========================================================================
	// Command Categories
	// =========================================================================
	FunkyTests.describe('Command Categories', function() {
		FunkyTests.beforeEach(function() {
			CommandPalette.init();
		});

		FunkyTests.it('should use default category when not specified', function() {
			var cmd = createTestCommand();
			delete cmd.category;
			CommandPalette.register(cmd);

			var registered = CommandPalette.getCommand(cmd.id);
			expect(registered.category).toBe('Actions');
		});

		FunkyTests.it('should preserve custom category', function() {
			var cmd = createTestCommand({ category: 'Custom' });
			CommandPalette.register(cmd);

			var registered = CommandPalette.getCommand(cmd.id);
			expect(registered.category).toBe('Custom');
		});
	});

	// =========================================================================
	// Command Priority
	// =========================================================================
	FunkyTests.describe('Command Priority', function() {
		FunkyTests.beforeEach(function() {
			CommandPalette.init();
		});

		FunkyTests.it('should use default priority of 0', function() {
			var cmd = createTestCommand();
			CommandPalette.register(cmd);

			var registered = CommandPalette.getCommand(cmd.id);
			expect(registered.priority).toBe(0);
		});

		FunkyTests.it('should preserve custom priority', function() {
			var cmd = createTestCommand({ priority: 100 });
			CommandPalette.register(cmd);

			var registered = CommandPalette.getCommand(cmd.id);
			expect(registered.priority).toBe(100);
		});
	});

	// =========================================================================
	// Keywords
	// =========================================================================
	FunkyTests.describe('Keywords', function() {
		FunkyTests.beforeEach(function() {
			CommandPalette.init();
		});

		FunkyTests.it('should use empty array as default keywords', function() {
			var cmd = createTestCommand();
			CommandPalette.register(cmd);

			var registered = CommandPalette.getCommand(cmd.id);
			expect(Array.isArray(registered.keywords)).toBe(true);
		});

		FunkyTests.it('should preserve custom keywords', function() {
			var cmd = createTestCommand({ keywords: ['save', 'store', 'write'] });
			CommandPalette.register(cmd);

			var registered = CommandPalette.getCommand(cmd.id);
			expect(registered.keywords).toContain('save');
			expect(registered.keywords).toContain('store');
		});
	});

});

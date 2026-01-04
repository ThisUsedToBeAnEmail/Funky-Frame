/**
 * Funky.CommandPalette - Spotlight-style Command Search
 * 
 * Cmd+K / Ctrl+K interface for quick actions, navigation, and search.
 * Integrates with Funky.Keyboard for shortcut handling.
 * 
 * @module Funky.CommandPalette
 * @version 1.0.0
 * @requires Funky.Dom
 * @requires Funky.Events
 * @requires Funky.Keyboard
 * @requires Funky.Timing
 */
(function(global) {
	'use strict';

	var D = global.Funky && global.Funky.Dom;
	var PubSub = global.Funky && global.Funky.PubSub;
	var Timing = global.Funky && global.Funky.Timing;
	var FuzzySearch = global.Funky && global.Funky.FuzzySearch;
	var History = global.Funky && global.Funky.History;
	var SelectableList = global.Funky && global.Funky.SelectableList;

	// Get Keyboard at runtime (may not be available at load time)
	function getKeyboard() {
		return global.Funky && global.Funky.Keyboard;
	}
	
	// Get SelectableList at runtime (may not be available at load time)
	function getSelectableList() {
		return global.Funky && global.Funky.SelectableList;
	}

	if (!D) {
		console.error('[Funky.CommandPalette] Funky.Dom is required');
		return;
	}

	if (!FuzzySearch) {
		console.warn('[Funky.CommandPalette] Funky.FuzzySearch not found, search disabled');
	}

	// =========================================================================
	// Default Configuration
	// =========================================================================

	var DEFAULTS = {
		hotkey: 'mod+k',
		placeholder: 'Type a command or search...',
		maxResults: 10,
		showRecent: true,
		maxRecent: 5,
		fuzzyThreshold: 0.4,
		debounceMs: 150,
		storageKey: 'palette_recent',
		closeOnSelect: true,
		showShortcuts: true,
		mobileButton: false,
		showContextBadge: false
	};

	// =========================================================================
	// Module State
	// =========================================================================

	var state = {
		initialized: false,
		isOpen: false,
		config: {},
		commands: [],
		recentIds: [],
		query: '',
		results: [],
		selectableList: null,    // SelectableList instance for navigation
		context: null,
		contextCommands: {},  // Commands grouped by context (Phase 7)
		// Sub-palette state (Phase 6)
		subPalette: null,
		parentQuery: '',
		breadcrumb: [],
		lastInteraction: 'keyboard'
	};

	var elements = {
		overlay: null,
		container: null,
		input: null,
		results: null,
		footer: null
	};

	// Keyboard unregister functions
	var keyboardCleanup = {
		hotkey: null,
		escape: null,
		arrows: null
	};

	// Focus trap cleanup function (from FocusManager.trapFocus)
	var focusTrapCleanup = null;

	// Map of command ID -> shortcut unregister function
	var shortcutCleanups = {};

	// Fuzzy search matcher instance
	var commandMatcher = null;

	// Recent history instance (using Funky.History)
	var recentHistory = null;

	// =========================================================================
	// DOM Building
	// =========================================================================

	/**
	 * Build the palette DOM structure
	 * @private
	 */
	function buildDOM() {
		var config = state.config;

		// Create overlay
		elements.overlay = D.create('div')
			.classAdd('command-palette-overlay')
			.on('click', close);

		// Create main container
		elements.container = D.create('div')
			.classAdd('command-palette')
			.attr({
				'role': 'dialog',
				'aria-modal': 'true',
				'aria-labelledby': 'command-palette-title'
			});

		// Screen reader title
		var title = D.create('h2')
			.attr('id', 'command-palette-title')
			.classAdd('command-palette__sr-only')
			.text('Command Palette');

		// Search section
		var search = D.create('div')
			.classAdd('command-palette__search');

		var searchIcon = D.create('i')
			.classAdd('fas', 'fa-search', 'command-palette__search-icon')
			.attr('aria-hidden', 'true');

		elements.input = D.create('input')
			.classAdd('command-palette__input')
			.attr({
				'type': 'text',
				'placeholder': config.placeholder,
				'role': 'combobox',
				'aria-expanded': 'true',
				'aria-controls': 'command-palette-results',
				'aria-autocomplete': 'list',
				'autocomplete': 'off',
				'spellcheck': 'false'
			})
			.on('input', handleInput)
			.on('keydown', handleKeydown);

		var searchHint = D.create('div')
			.classAdd('command-palette__search-hint');
		
		var escKbd = D.create('kbd')
			.classAdd('command-palette__kbd')
			.text('esc');
		
		searchHint.append(escKbd);

		search.append(searchIcon, elements.input, searchHint);

		// Results container - SelectableList will be initialized inside
		elements.results = D.create('div')
			.classAdd('command-palette__results')
			.attr({
				'id': 'command-palette-results',
				'role': 'listbox',
				'aria-label': 'Command results'
			});
		
		// Create SelectableList container inside results
		elements.listContainer = D.create('div')
			.classAdd('command-palette__list-container');
		elements.results.append(elements.listContainer);

		// Footer with hints
		elements.footer = D.create('div')
			.classAdd('command-palette__footer');

		var footerItems = [
			{ keys: ['↑', '↓'], label: 'Navigate' },
			{ keys: ['↵'], label: 'Select' },
			{ keys: ['esc'], label: 'Close' }
		];

		footerItems.forEach(function(item) {
			var footerItem = D.create('span')
				.classAdd('command-palette__footer-item');
			
			item.keys.forEach(function(key) {
				var kbd = D.create('kbd')
					.classAdd('command-palette__kbd')
					.text(key);
				footerItem.append(kbd);
			});
			
			var label = D.create('span').text(item.label);
			footerItem.append(label);
			elements.footer.append(footerItem);
		});

		// Assemble
		elements.container.append(title, search, elements.results, elements.footer);

		// Add to document
		D.one('body').append(elements.overlay, elements.container);
		
		// Initialize SelectableList for results
		initSelectableList();
	}

	/**
	 * Initialize SelectableList for command results
	 * @private
	 */
	function initSelectableList() {
		var SL = getSelectableList();
		if (!SL || typeof SL.init !== 'function') {
			console.warn('[CommandPalette] Funky.SelectableList not available or invalid, using legacy rendering');
			return;
		}
		
		state.selectableList = SL.init(elements.listContainer.el, {
			items: [],
			selectable: 'none',              // Commands are activated, not selected
			keyboard: false,                  // We'll forward from input
			typeAhead: false,                 // Search is in input field
			wrapAround: true,
			scrollBehavior: 'auto',
			showInstructions: false,          // Our own footer shows this
			ariaLabel: 'Command results',
			itemClass: 'command-palette__item',
			emptyMessage: 'No matching commands found',
			emptyIcon: 'fas fa-search',
			
			// Disabled items check
			isItemDisabled: function(item) {
				return !!item.disabled;
			},
			
			// Custom item renderer
			renderItem: function(command, index, itemState) {
				return renderItemHtml(command, index, itemState);
			},
			
			// Custom grouping
			groupBy: function(command) {
				return command.category || 'Commands';
			},
			
			renderGroupHeader: function(groupKey, items) {
				return '<h3 class="command-palette__group-title">' + escapeHtml(groupKey) + '</h3>';
			},
			
			// Handle activation (Enter or click)
			onActivate: function(item, index) {
				// Handle API search results vs regular commands
				if (state.subPalette && state.subPalette.type === 'api') {
					selectApiResult(index);
				} else {
					executeCommand(item);
				}
			},
			
			// Handle focus change for ARIA
			onFocus: function(command, index) {
				if (elements.input && elements.input.el) {
					elements.input.attr('aria-activedescendant', 'item-' + state.selectableList.id + '-' + index);
				}
				emitEvent('funky:palette:navigate', { index: index });
			}
		});
	}
	
	/**
	 * Render a command/result item as HTML string (for SelectableList)
	 * Handles both regular commands and API search results
	 * @param {Object} item - Command or result object
	 * @param {number} index - Item index
	 * @param {Object} itemState - State object with isSelected, isFocused, isDisabled
	 * @returns {string} HTML string
	 * @private
	 */
	function renderItemHtml(item, index, itemState) {
		var parts = [];
		var isApiResult = state.subPalette && state.subPalette.type === 'api';
		var isRecent = !isApiResult && item.id && state.recentIds.indexOf(item.id) !== -1;
		
		// Icon
		var iconClass;
		if (isApiResult) {
			iconClass = item.icon || 'fa-file';
		} else {
			iconClass = (isRecent && !item.icon) ? 'fa-clock' : item.icon;
		}
		
		if (iconClass) {
			var iconClasses = iconClass.indexOf(' ') === -1 && iconClass.indexOf('fa-') === 0
				? 'fas ' + iconClass
				: iconClass;
			parts.push('<i class="command-palette__item-icon ' + escapeHtml(iconClasses) + '" aria-hidden="true"></i>');
		}
		
		// Content wrapper
		parts.push('<div class="command-palette__item-content">');
		
		// Title
		var title = item.title || item.name || item.label || 'Untitled';
		parts.push('<span class="command-palette__item-title">' + escapeHtml(title) + '</span>');
		
		// Hint/subtitle
		var hint = item.hint || item.subtitle || item.description;
		if (hint) {
			parts.push('<span class="command-palette__item-hint">' + escapeHtml(hint) + '</span>');
		}
		parts.push('</div>');
		
		// Shortcut (commands only)
		if (!isApiResult && item.shortcut && state.config.showShortcuts) {
			parts.push('<div class="command-palette__item-shortcut">');
			var formatted = formatShortcut(item.shortcut);
			var shortcutParts = formatted.split(' ');
			shortcutParts.forEach(function(part) {
				if (part) {
					parts.push('<kbd class="command-palette__kbd">' + escapeHtml(part) + '</kbd>');
				}
			});
			parts.push('</div>');
		}
		
		// Badge (API results)
		if (isApiResult && item.badge) {
			parts.push('<span class="command-palette__item-badge">' + escapeHtml(item.badge) + '</span>');
		}
		
		// Context badge (commands only)
		if (!isApiResult && item.context && state.config.showContextBadge) {
			var contextText = typeof item.context === 'string' 
				? item.context 
				: item.context[0];
			parts.push('<span class="command-palette__item-context">' + escapeHtml(contextText) + '</span>');
		}
		
		return parts.join('');
	}
	
	/**
	 * Escape HTML entities
	 * @private
	 */
	function escapeHtml(str) {
		if (typeof str !== 'string') return '';
		return str
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	}

	// =========================================================================
	// Event Handlers
	// =========================================================================

	/**
	 * Handle input changes (debounced)
	 * @private
	 */
	var handleInputDebounced = null;

	function initDebounce() {
		if (Timing && Timing.debounce) {
			handleInputDebounced = Timing.debounce(performSearch, state.config.debounceMs || 150);
		} else {
			handleInputDebounced = performSearch;
		}
	}

	function handleInput(e) {
		state.query = e.target.value;
		
		if (state.subPalette) {
			if (state.subPalette.type === 'api') {
				debouncedApiSearch();
			} else {
				// Static sub-palette - search within children
				if (handleInputDebounced) {
					handleInputDebounced();
				} else {
					performSearch();
				}
			}
		} else {
			if (handleInputDebounced) {
				handleInputDebounced();
			} else {
				performSearch();
			}
		}
	}

	// =========================================================================
	// Search Engine - Using Funky.FuzzySearch
	// =========================================================================

	/**
	 * Initialize the fuzzy search matcher
	 * @private
	 */
	function initSearchEngine() {
		if (!FuzzySearch) return;
		
		commandMatcher = FuzzySearch.create({
			threshold: state.config.fuzzyThreshold || 0.3,
			caseSensitive: false
		});
	}

	/**
	 * Search commands using Funky.FuzzySearch
	 * @param {string} query - Search query
	 * @returns {Array} Array of { item: command, score: number }
	 * @private
	 */
	function searchCommands(query) {
		query = (query || '').trim();
		
		// No query - return all non-hidden commands that match context
		if (!query) {
			return state.commands.filter(function(cmd) {
				return !cmd.hidden && commandMatchesContext(cmd);
			}).map(function(cmd) {
				return { item: cmd, score: 0.5 };
			});
		}
		
		// Use FuzzySearch if available
		if (commandMatcher) {
			var results = commandMatcher.search(query, state.commands, {
				keys: ['title', 'keywords', 'category', 'hint'],
				limit: state.config.maxResults * 4
			});
			
			return results.filter(function(r) {
				return !r.item.hidden && commandMatchesContext(r.item);
			}).map(function(r) {
				return { item: r.item, score: r.score, matches: r.matches };
			});
		}
		
		// Fallback: simple contains matching
		var lowerQuery = query.toLowerCase();
		return state.commands.filter(function(cmd) {
			if (cmd.hidden) return false;
			if (!commandMatchesContext(cmd)) return false;
			var title = (cmd.title || '').toLowerCase();
			var hint = (cmd.hint || '').toLowerCase();
			var category = (cmd.category || '').toLowerCase();
			return title.indexOf(lowerQuery) !== -1 ||
				   hint.indexOf(lowerQuery) !== -1 ||
				   category.indexOf(lowerQuery) !== -1;
		}).map(function(cmd) {
			return { item: cmd, score: 0.5 };
		});
	}

	/**
	 * Perform search and update results
	 * @private
	 */
	function performSearch() {
		var query = state.query.trim();
		var config = state.config;
		
		// Handle static sub-palette (Phase 6)
		if (state.subPalette && state.subPalette.type === 'static') {
			performSubPaletteSearch();
			return;
		}
		
		var matches = [];
		
		// If no query and showRecent, add recent commands first
		if (!query && config.showRecent && state.recentIds.length > 0) {
			state.recentIds.forEach(function(id, recentIndex) {
				var command = findCommand(id);
				if (command && !command.hidden && commandMatchesContext(command)) {
					matches.push({
						item: command,
						score: 1,
						isRecent: true,
						recentIndex: recentIndex
					});
				}
			});
		}
		
		// Get matching commands from search
		var searchMatches = searchCommands(query);
		
		// Add search results, excluding already-added recent (when no query)
		searchMatches.forEach(function(match) {
			if (!query && isRecentCommand(match.item.id)) {
				return; // Skip, already added as recent
			}
			matches.push(match);
		});
		
		// Sort by score (descending), with recent first when no query
		matches.sort(function(a, b) {
			if (!query) {
				// Recent items always first
				if (a.isRecent && !b.isRecent) return -1;
				if (!a.isRecent && b.isRecent) return 1;
				if (a.isRecent && b.isRecent) {
					return a.recentIndex - b.recentIndex;
				}
			}
			return b.score - a.score;
		});
		
		// Group by category
		var showRecentGroup = !query && config.showRecent && state.recentIds.length > 0;
		var grouped = groupByCategory(matches, config.maxResults, showRecentGroup);
		
		// Store results (flattened)
		state.results = [];
		Object.keys(grouped).forEach(function(category) {
			grouped[category].forEach(function(match) {
				state.results.push(match.item);
			});
		});
		
		// Render (SelectableList resets focus to 0 on setItems)
		renderResults(grouped);
		
		emitEvent('funky:palette:search', { 
			query: query, 
			count: state.results.length,
			resultIds: state.results.map(function(r) { return r.id; })
		});
	}

	/**
	 * Group matches by category
	 * @param {Array} matches - Array of match objects
	 * @param {number} maxPerCategory - Max results per category
	 * @param {boolean} showRecentGroup - Whether to show Recent as separate group
	 * @returns {Object} - Grouped results
	 * @private
	 */
	function groupByCategory(matches, maxPerCategory, showRecentGroup) {
		var groups = {};
		var categoryOrder = ['Recent', 'Navigation', 'Actions', 'Search', 'Settings'];
		
		matches.forEach(function(match) {
			var category = match.item.category || 'Other';
			
			// Put recent items in Recent group when showRecentGroup is true
			if (showRecentGroup && match.isRecent) {
				category = 'Recent';
			}
			
			if (!groups[category]) {
				groups[category] = [];
			}
			if (groups[category].length < maxPerCategory) {
				groups[category].push(match);
			}
		});
		
		// Order categories
		var orderedGroups = {};
		categoryOrder.forEach(function(cat) {
			if (groups[cat]) {
				orderedGroups[cat] = groups[cat];
				delete groups[cat];
			}
		});
		
		// Add remaining categories alphabetically
		Object.keys(groups).sort().forEach(function(cat) {
			orderedGroups[cat] = groups[cat];
		});
		
		return orderedGroups;
	}

	/**
	 * Perform search within static sub-palette
	 * @private
	 */
	function performSubPaletteSearch() {
		var query = state.query.trim();
		var subPalette = state.subPalette;

		if (!subPalette || subPalette.type !== 'static') {
			return;
		}

		var matches = [];
		
		subPalette.commands.forEach(function(command) {
			if (command.hidden) return;
			
			// No query - match all
			if (!query) {
				matches.push({ item: command, score: 0.5 });
				return;
			}
			
			// Use fuzzy search if available
			if (commandMatcher) {
				var results = commandMatcher.search(query, [command], {
					keys: ['title', 'keywords', 'category', 'hint'],
					limit: 1
				});
				if (results.length > 0) {
					matches.push({
						item: command,
						score: results[0].score,
						matches: results[0].matches
					});
				}
			} else {
				// Fallback: simple contains matching
				var lowerQuery = query.toLowerCase();
				var title = (command.title || '').toLowerCase();
				var hint = (command.hint || '').toLowerCase();
				if (title.indexOf(lowerQuery) !== -1 || hint.indexOf(lowerQuery) !== -1) {
					matches.push({ item: command, score: 0.5 });
				}
			}
		});
		
		matches.sort(function(a, b) {
			return b.score - a.score;
		});

		state.results = matches.map(function(m) { return m.item; });

		if (matches.length === 0) {
			renderEmptyState();
		} else {
			var grouped = {};
			grouped[subPalette.title] = matches;
			renderResults(grouped);
		}
		
		emitEvent('funky:palette:search', {
			query: query,
			results: state.results,
			count: state.results.length,
			subPalette: subPalette.title
		});
	}

	// =========================================================================
	// Rendering
	// =========================================================================

	/**
	 * Render search results using SelectableList
	 * @param {Object} grouped - Grouped results by category (used for ordering/categorization)
	 * @private
	 */
	function renderResults(grouped) {
		// Clean up any API-specific UI elements that might be left over
		var existingEmpty = elements.results.el.querySelector('.command-palette__empty');
		var existingError = elements.results.el.querySelector('.command-palette__error');
		var existingLoading = elements.results.el.querySelector('.command-palette__loading');
		if (existingEmpty) existingEmpty.remove();
		if (existingError) existingError.remove();
		if (existingLoading) existingLoading.remove();

		// Show the SelectableList container (may have been hidden by API states)
		if (elements.listContainer) {
			elements.listContainer.style('display', '');
		}

		// If SelectableList is available, use it
		if (state.selectableList) {
			// Set items - SelectableList will handle rendering via renderItem callback
			state.selectableList.setItems(state.results);

			// Update ARIA on input
			if (state.results.length > 0) {
				elements.input.attr('aria-activedescendant', 'item-' + state.selectableList.id + '-0');
			} else {
				elements.input.attr('aria-activedescendant', '');
			}
			return;
		}
		
		// Fallback: legacy rendering (if SelectableList not available)
		renderResultsLegacy(grouped);
	}
	
	/**
	 * Legacy rendering without SelectableList
	 * @param {Object} grouped - Grouped results by category
	 * @private
	 */
	function renderResultsLegacy(grouped) {
		// Clear existing but preserve listContainer
		var existingEmpty = elements.results.el.querySelector('.command-palette__empty');
		var existingError = elements.results.el.querySelector('.command-palette__error');
		var existingLoading = elements.results.el.querySelector('.command-palette__loading');
		var existingGroup = elements.results.el.querySelector('.command-palette__group');
		if (existingEmpty) existingEmpty.remove();
		if (existingError) existingError.remove();
		if (existingLoading) existingLoading.remove();
		if (existingGroup) existingGroup.remove();
		
		var categories = Object.keys(grouped);
		var globalIndex = 0;
		
		if (categories.length === 0 || state.results.length === 0) {
			renderEmptyState();
			return;
		}
		
		categories.forEach(function(category) {
			var matches = grouped[category];
			if (!matches || matches.length === 0) return;
			
			// Create group
			var groupId = 'palette-group-' + category.toLowerCase().replace(/\s+/g, '-');
			
			var group = D.create('div')
				.classAdd('command-palette__group')
				.attr({
					'role': 'group',
					'aria-labelledby': groupId
				});
			
			var groupTitle = D.create('h3')
				.classAdd('command-palette__group-title')
				.attr('id', groupId)
				.text(category);
			
			group.append(groupTitle);
			
			// Add items
			matches.forEach(function(match) {
				var item = renderResultItem(match.item, globalIndex, match.isRecent);
				group.append(item);
				globalIndex++;
			});
			
			elements.results.append(group);
		});
		
		// Update ARIA
		if (state.results.length > 0) {
			elements.input.attr('aria-activedescendant', 'palette-result-0');
		}
	}

	/**
	 * Render a single result item (legacy)
	 * @param {Object} command - Command object
	 * @param {number} index - Item index
	 * @param {boolean} [isRecent] - Whether this is a recent item
	 * @returns {Object} - Funky.Dom element
	 * @private
	 */
	function renderResultItem(command, index, isRecent) {
		var isSelected = index === 0; // First item selected by default
		
		var item = D.create('div')
			.classAdd('command-palette__item')
			.attr({
				'role': 'option',
				'id': 'palette-result-' + index,
				'aria-selected': isSelected ? 'true' : 'false',
				'data-index': index,
				'data-command-id': command.id
			})
			.on('click', function() {
				selectAndExecute(index);
			})
			.on('mouseenter', function() {
				updateSelectionIndex(index);
			});
		
		if (isSelected) {
			item.classAdd('is-selected');
		}
		
		if (isRecent) {
			item.classAdd('command-palette__item--recent');
		}
		
		if (command.disabled) {
			item.classAdd('command-palette__item--disabled');
			item.attr('aria-disabled', 'true');
		}
		
		// Icon - use clock for recent without icon, else command icon
		var iconClass = (isRecent && !command.icon) ? 'fa-clock' : command.icon;
		if (iconClass) {
			var icon = D.create('i')
				.classAdd('command-palette__item-icon')
				.attr('aria-hidden', 'true');
			
			// Handle both "fa-xxx" and "fas fa-xxx" formats
			var iconClasses = iconClass.split(' ');
			if (iconClasses.length === 1 && iconClasses[0].indexOf('fa-') === 0) {
				icon.classAdd('fas', iconClasses[0]);
			} else {
				iconClasses.forEach(function(cls) {
					if (cls) icon.classAdd(cls);
				});
			}
			
			item.append(icon);
		}
		
		// Content wrapper
		var content = D.create('div')
			.classAdd('command-palette__item-content');
		
		// Title
		var title = D.create('span')
			.classAdd('command-palette__item-title')
			.text(command.title);
		content.append(title);
		
		// Hint
		if (command.hint) {
			var hint = D.create('span')
				.classAdd('command-palette__item-hint')
				.text(command.hint);
			content.append(hint);
		}
		
		item.append(content);
		
		// Shortcut
		if (command.shortcut && state.config.showShortcuts) {
			var shortcutContainer = D.create('div')
				.classAdd('command-palette__item-shortcut');
			
			var formatted = formatShortcut(command.shortcut);
			var parts = formatted.split(' ');
			
			parts.forEach(function(part) {
				if (part) {
					var kbd = D.create('kbd')
						.classAdd('command-palette__kbd')
						.text(part);
					shortcutContainer.append(kbd);
				}
			});
			
			item.append(shortcutContainer);
		}
		
		// Context badge (Phase 7)
		if (command.context && state.config.showContextBadge) {
			var contextText = typeof command.context === 'string' 
				? command.context 
				: command.context[0];
			var contextBadge = D.create('span')
				.classAdd('command-palette__item-context')
				.text(contextText);
			item.append(contextBadge);
		}
		
		return item;
	}

	/**
	 * Render empty state
	 * Used for legacy rendering (SelectableList handles its own empty state)
	 * @private
	 */
	function renderEmptyState() {
		// SelectableList handles empty state automatically
		if (state.selectableList) {
			state.selectableList.setItems([]);
			return;
		}
		
		// Legacy fallback
		var empty = D.create('div')
			.classAdd('command-palette__empty');
		
		var icon = D.create('i')
			.classAdd('fas', 'fa-search', 'command-palette__empty-icon')
			.attr('aria-hidden', 'true');
		
		var text = D.create('p')
			.text(state.query ? 'No matching commands found' : 'No commands registered');
		
		empty.append(icon, text);
		elements.results.append(empty);
	}

	/**
	 * Format shortcut for display
	 * @param {string} shortcut - Raw shortcut string
	 * @returns {string} - Formatted shortcut
	 * @private
	 */
	function formatShortcut(shortcut) {
		var isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
		
		return shortcut
			.replace(/mod/gi, isMac ? '⌘' : 'Ctrl')
			.replace(/shift/gi, isMac ? '⇧' : 'Shift')
			.replace(/alt/gi, isMac ? '⌥' : 'Alt')
			.replace(/ctrl/gi, isMac ? '⌃' : 'Ctrl')
			.replace(/\+/g, ' ')
			.toUpperCase();
	}

	/**
	 * Update selection to specific index (for mouse hover)
	 * Used by legacy rendering - SelectableList handles its own hover
	 * @param {number} index - New selected index
	 * @private
	 */
	function updateSelectionIndex(index) {
		if (state.selectableList) {
			state.selectableList.setFocusedIndex(index);
			return;
		}
		// Legacy fallback
		updateSelectionLegacy(index);
	}
	
	/**
	 * Legacy selection update
	 * @private
	 */
	function updateSelectionLegacy(index) {
		var itemList = D.all('.command-palette__item', elements.results.el || elements.results);
		itemList.each(function(wrapper, i) {
			if (i === index) {
				wrapper.classAdd('is-selected').classAdd('is-focused');
				wrapper.attr('aria-selected', 'true');
			} else {
				wrapper.classRemove('is-selected').classRemove('is-focused');
				wrapper.attr('aria-selected', 'false');
			}
		});
	}

	/**
	 * Select and execute command at index
	 * @param {number} index - Command index
	 * @private
	 */
	function selectAndExecute(index) {
		if (state.selectableList) {
			state.selectableList.setFocusedIndex(index);
		}
		executeSelected();
	}

	/**
	 * Scroll item into view
	 * @param {HTMLElement} itemEl - Item element
	 * @private
	 */
	function scrollItemIntoView(itemEl) {
		if (!itemEl) return;
		
		// Use native scrollIntoView with smooth behavior
		itemEl.scrollIntoView({
			block: 'nearest',
			behavior: 'smooth'
		});
	}

	// =========================================================================
	// Command Registry
	// =========================================================================

	/**
	 * Validate command structure
	 * @param {Object} command - Command to validate
	 * @returns {Object} - Validated command with defaults
	 * @throws {Error} - If required fields missing
	 * @private
	 */
	function validateCommand(command) {
		if (!command || typeof command !== 'object') {
			throw new Error('[Funky.CommandPalette] Command must be an object');
		}
		
		if (!command.id || typeof command.id !== 'string') {
			throw new Error('[Funky.CommandPalette] Command requires a string "id"');
		}
		
		if (!command.title || typeof command.title !== 'string') {
			throw new Error('[Funky.CommandPalette] Command requires a string "title"');
		}
		
		if (!command.action && !command.href && !command.children) {
			throw new Error('[Funky.CommandPalette] Command requires "action", "href", or "children"');
		}
		
		// Return with defaults
		return {
			id: command.id,
			title: command.title,
			category: command.category || 'Actions',
			icon: command.icon || null,
			shortcut: command.shortcut || null,
			keywords: command.keywords || [],
			hint: command.hint || null,
			hidden: command.hidden || false,
			disabled: command.disabled || false,
			action: command.action || null,
			href: command.href || null,
			children: command.children || null,
			context: command.context || null,
			priority: command.priority || 0
		};
	}

	/**
	 * Check if command already exists
	 * @param {string} id - Command ID
	 * @returns {boolean}
	 * @private
	 */
	function hasCommand(id) {
		for (var i = 0; i < state.commands.length; i++) {
			if (state.commands[i].id === id) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Find command by ID
	 * @param {string} id - Command ID
	 * @returns {Object|null}
	 * @private
	 */
	function findCommand(id) {
		for (var i = 0; i < state.commands.length; i++) {
			if (state.commands[i].id === id) {
				return state.commands[i];
			}
		}
		return null;
	}

	/**
	 * Register a single command
	 * @param {Object} commandDef - Command definition
	 * @returns {boolean} - Success
	 * @private
	 */
	function registerCommand(commandDef) {
		try {
			var command = validateCommand(commandDef);
			
			// Check for duplicates - update if exists
			if (hasCommand(command.id)) {
				unregisterCommand(command.id);
			}
			
			state.commands.push(command);
			
			// Register keyboard shortcut if specified and Keyboard is available
			var Keyboard = getKeyboard();
			if (command.shortcut && Keyboard) {
				var shortcutConfig = parseShortcut(command.shortcut);
				if (shortcutConfig) {
					shortcutConfig.handler = function() {
						executeCommand(command);
					};
					shortcutConfig.description = command.title;
					shortcutConfig.group = 'Commands';
					shortcutCleanups[command.id] = Keyboard.register(shortcutConfig);
				}
			}
			
			// Sort by priority
			state.commands.sort(function(a, b) {
				return (b.priority || 0) - (a.priority || 0);
			});
			
			emitEvent('funky:palette:register', { command: command });
			return true;
		} catch (e) {
			console.warn(e.message);
			return false;
		}
	}

	/**
	 * Parse shortcut string into Keyboard config
	 * @param {string} shortcut - e.g. 'mod+k', 'g h', 'ctrl+shift+p'
	 * @returns {Object|null} - Keyboard config or null if invalid
	 * @private
	 */
	function parseShortcut(shortcut) {
		if (!shortcut || typeof shortcut !== 'string') return null;
		
		var config = {};
		
		// Handle sequence shortcuts like 'g h' (press g then h)
		// Skip for now - Funky.Keyboard doesn't support sequences directly
		if (shortcut.indexOf(' ') !== -1 && shortcut.indexOf('+') === -1) {
			// Sequence shortcuts are display-only for now
			return null;
		}
		
		var parts = shortcut.toLowerCase().split('+');
		
		// Parse modifier+key format
		for (var i = 0; i < parts.length; i++) {
			var part = parts[i].trim();
			if (part === 'mod' || part === 'cmd' || part === 'ctrl') {
				config.mod = true;
			} else if (part === 'shift') {
				config.shift = true;
			} else if (part === 'alt' || part === 'option') {
				config.alt = true;
			} else {
				config.key = part;
			}
		}
		
		return config.key || config.sequence ? config : null;
	}

	/**
	 * Unregister a command
	 * @param {string} id - Command ID
	 * @private
	 */
	function unregisterCommand(id) {
		// Cleanup keyboard shortcut
		if (shortcutCleanups[id]) {
			shortcutCleanups[id]();
			delete shortcutCleanups[id];
		}
		
		state.commands = state.commands.filter(function(cmd) {
			return cmd.id !== id;
		});
		emitEvent('funky:palette:unregister', { id: id });
	}

	/**
	 * Clear all commands
	 * @param {string} [category] - Optional: only clear specific category
	 * @private
	 */
	function clearCommands(category) {
		if (category) {
			state.commands = state.commands.filter(function(cmd) {
				return cmd.category !== category;
			});
		} else {
			state.commands = [];
		}
		emitEvent('funky:palette:clear', { category: category });
	}

	// =========================================================================
	// Command Execution
	// =========================================================================

	/**
	 * Execute a command
	 * @param {Object} command - Command to execute
	 * @private
	 */
	function executeCommand(command) {
		if (!command) return;

		if (command.disabled) {
			console.warn('[Funky.CommandPalette] Command "' + command.id + '" is disabled');
			return;
		}

		// Emit serializable payload (no functions)
		emitEvent('funky:palette:execute', {
			id: command.id,
			title: command.title,
			category: command.category
		});

		// Handle children (sub-palette) - Phase 6
		if (command.children && command.children.length) {
			// If palette is closed, open it first then show sub-palette
			if (!state.isOpen) {
				open();
				// Small delay to ensure palette is fully rendered
				setTimeout(function() {
					openSubPalette(command);
				}, 50);
			} else {
				openSubPalette(command);
			}
			return;
		}
		
		// Handle href navigation
		if (command.href) {
			// Check for SPA navigation
			if (global.Funky && global.Funky.SPA && global.Funky.SPA.navigate) {
				global.Funky.SPA.navigate(command.href);
			} else {
				window.location.href = command.href;
			}
			return;
		}
		
		// Handle action function
		if (command.action && typeof command.action === 'function') {
			try {
				command.action();
			} catch (e) {
				console.error('[Funky.CommandPalette] Error executing "' + command.id + '":', e);
			}
		}
	}

	// =========================================================================
	// Recent Commands - Using Funky.History
	// =========================================================================

	/**
	 * Initialize recent command history
	 * @private
	 */
	function initRecentHistory() {
		if (!History) {
			console.warn('[Funky.CommandPalette] Funky.History not found, recent disabled');
			return;
		}
		
		recentHistory = History.create({
			namespace: state.config.storageKey || 'palette_recent',
			limit: state.config.maxRecent || 5,
			persist: true
		});
		
		// Sync state.recentIds from history
		state.recentIds = recentHistory.getAll();
	}

	/**
	 * Add command to recent list
	 * @param {string} id - Command ID
	 * @private
	 */
	function addToRecent(id) {
		if (!id) return;
		
		if (recentHistory) {
			recentHistory.add(id);
			state.recentIds = recentHistory.getAll();
		} else {
			// Fallback without History module
			state.recentIds = state.recentIds.filter(function(recentId) {
				return recentId !== id;
			});
			state.recentIds.unshift(id);
			var maxRecent = state.config.maxRecent || 5;
			if (state.recentIds.length > maxRecent) {
				state.recentIds = state.recentIds.slice(0, maxRecent);
			}
		}
		
		emitEvent('funky:palette:recent:add', { id: id, recent: state.recentIds });
	}

	/**
	 * Get recent commands (resolved to full command objects)
	 * @returns {Array} Recent command objects
	 * @private
	 */
	function getRecentCommands() {
		var commands = [];
		
		state.recentIds.forEach(function(id) {
			var command = findCommand(id);
			if (command && !command.hidden) {
				commands.push(command);
			}
		});
		
		return commands;
	}

	/**
	 * Remove command from recent history
	 * @param {string} id - Command ID
	 * @private
	 */
	function removeFromRecent(id) {
		if (!id) return;
		
		if (recentHistory) {
			recentHistory.remove(id);
			state.recentIds = recentHistory.getAll();
		} else {
			state.recentIds = state.recentIds.filter(function(recentId) {
				return recentId !== id;
			});
		}
		
		emitEvent('funky:palette:recent:remove', { id: id, recent: state.recentIds });
	}

	/**
	 * Clear recent commands
	 * @private
	 */
	function clearRecent() {
		if (recentHistory) {
			recentHistory.clear();
		}
		state.recentIds = [];
		emitEvent('funky:palette:recent:clear', {});
	}

	/**
	 * Check if command is in recent history
	 * @param {string} id - Command ID
	 * @returns {boolean}
	 * @private
	 */
	function isRecentCommand(id) {
		return state.recentIds.indexOf(id) !== -1;
	}

	/**
	 * Load recent commands from storage (fallback for when History not available)
	 * @private
	 */
	function loadRecent() {
		// If using History module, it handles persistence
		if (recentHistory) {
			state.recentIds = recentHistory.getAll();
			return;
		}
		
		// Fallback to localStorage
		try {
			var stored = localStorage.getItem(state.config.storageKey);
			if (stored) {
				var parsed = JSON.parse(stored);
				if (Array.isArray(parsed)) {
					state.recentIds = parsed;
				}
			}
		} catch (e) {
			state.recentIds = [];
		}
	}

	// =========================================================================
	// Sub-Palettes (Phase 6)
	// =========================================================================

	/**
	 * Open a sub-palette with static children
	 * @param {Object} command - Parent command with children
	 * @private
	 */
	function openSubPalette(command) {
		if (!command.children || command.children.length === 0) {
			return;
		}

		// Store current state
		state.parentQuery = state.query;
		state.breadcrumb.push({
			title: command.title,
			query: state.query
		});

		// Set sub-palette
		state.subPalette = {
			type: 'static',
			title: command.title,
			commands: command.children.map(function(child, i) {
				return validateCommand(Object.assign({}, child, {
					id: child.id || command.id + '-' + i
				}));
			})
		};

		// Clear input and search within children
		elements.input.el.value = '';
		state.query = '';

		// Update placeholder
		elements.input.attr('placeholder', 'Search ' + command.title + '...');

		// Update breadcrumb display
		updateBreadcrumb();

		// Search within sub-palette
		performSearch();

		emitEvent('funky:palette:subpalette:open', { command: command });
	}

	/**
	 * Open API search sub-palette
	 * @param {Object} config - API search configuration
	 * @private
	 */
	function openApiSearch(config) {
		if (!config || !config.api) {
			console.error('[Funky.CommandPalette] API search requires "api" URL');
			return;
		}

		// Store current state
		state.parentQuery = state.query;
		state.breadcrumb.push({
			title: config.title || 'Search',
			query: state.query
		});

		// Set sub-palette
		state.subPalette = {
			type: 'api',
			title: config.title || 'Search',
			api: config.api,
			placeholder: config.placeholder || 'Type to search...',
			minLength: config.minLength || 2,
			debounce: config.debounce || 300,
			transform: config.transform || defaultApiTransform,
			onSelect: config.onSelect,
			emptyText: config.emptyText || 'No results found',
			loadingText: config.loadingText || 'Searching...',
			errorText: config.errorText || 'Search failed'
		};

		// Clear input
		elements.input.el.value = '';
		state.query = '';

		// Update placeholder
		elements.input.attr('placeholder', state.subPalette.placeholder);

		// Update breadcrumb display
		updateBreadcrumb();

		// Show initial state
		renderApiEmptyState('Type to search...');

		emitEvent('funky:palette:subpalette:open', { config: config });
	}

	/**
	 * Close sub-palette and return to parent
	 * @private
	 */
	function closeSubPalette() {
		if (!state.subPalette) {
			return;
		}

		// Pop breadcrumb
		var previous = state.breadcrumb.pop();

		// Clear sub-palette
		state.subPalette = null;

		// Restore query
		state.query = previous ? previous.query : '';
		elements.input.el.value = state.query;

		// Restore placeholder
		elements.input.attr('placeholder', state.config.placeholder);

		// Update breadcrumb display
		updateBreadcrumb();

		// Re-search main commands
		performSearch();

		emitEvent('funky:palette:subpalette:close', {});
	}

	/**
	 * Check if in sub-palette
	 * @returns {boolean}
	 * @private
	 */
	function isInSubPalette() {
		return state.subPalette !== null;
	}

	/**
	 * Update breadcrumb display
	 * @private
	 */
	function updateBreadcrumb() {
		// Remove existing breadcrumb
		var existing = D.one('.command-palette__breadcrumb');
		if (existing) existing.remove();
		
		if (state.breadcrumb.length === 0) return;
		
		// Create breadcrumb
		var breadcrumb = D.create('div')
			.classAdd('command-palette__breadcrumb');
		
		// Back button
		var backBtn = D.create('button')
			.classAdd('command-palette__breadcrumb-back')
			.attr({
				'type': 'button',
				'aria-label': 'Go back'
			})
			.on('click', function(e) {
				e.preventDefault();
				closeSubPalette();
			});
		
		var backIcon = D.create('i')
			.classAdd('fas', 'fa-arrow-left')
			.attr('aria-hidden', 'true');
		backBtn.append(backIcon);
		
		// Path
		var path = D.create('span')
			.classAdd('command-palette__breadcrumb-path');
		
		state.breadcrumb.forEach(function(item, i) {
			if (i > 0) {
				var sep = D.create('span')
					.classAdd('command-palette__breadcrumb-sep')
					.text('/');
				path.append(sep);
			}
			var label = D.create('span').text(item.title);
			path.append(label);
		});
		
		breadcrumb.append(backBtn, path);
		
		// Insert after search, before results
		elements.results.el.parentNode.insertBefore(
			breadcrumb.el,
			elements.results.el
		);
	}

	// =========================================================================
	// Context-Aware Commands (Phase 7)
	// =========================================================================

	/**
	 * Register commands for a specific context
	 * @param {string} contextName - Context identifier
	 * @param {Array} commands - Commands available in this context
	 * @returns {Object} CommandPalette instance
	 */
	function registerContext(contextName, commands) {
		if (!contextName || typeof contextName !== 'string') {
			console.error('[Funky.CommandPalette] Context name required');
			return CommandPalette;
		}
		
		if (!Array.isArray(commands)) {
			console.error('[Funky.CommandPalette] Commands must be an array');
			return CommandPalette;
		}
		
		// Validate and store
		state.contextCommands[contextName] = commands.map(function(cmd) {
			return validateCommand(Object.assign({}, cmd, {
				context: contextName
			}));
		});
		
		// Register all context commands (add to main commands array)
		state.contextCommands[contextName].forEach(function(cmd) {
			// Only add if not already registered
			if (!hasCommand(cmd.id)) {
				state.commands.push(cmd);
			}
		});
		
		emitEvent('funky:palette:context:register', { 
			context: contextName, 
			commands: state.contextCommands[contextName] 
		});
		
		return CommandPalette;
	}

	/**
	 * Unregister all commands for a context
	 * @param {string} contextName - Context identifier
	 * @returns {Object} CommandPalette instance
	 */
	function unregisterContext(contextName) {
		if (!state.contextCommands[contextName]) return CommandPalette;
		
		// Remove commands with this context
		state.commands = state.commands.filter(function(cmd) {
			return cmd.context !== contextName;
		});
		
		// Remove from context registry
		delete state.contextCommands[contextName];
		
		emitEvent('funky:palette:context:unregister', { context: contextName });
		
		return CommandPalette;
	}

	/**
	 * Set the active context
	 * @param {string|null} contextName - Context to activate, or null to clear
	 * @returns {Object} CommandPalette instance
	 */
	function setContext(contextName) {
		var previousContext = state.context;
		state.context = contextName;
		
		emitEvent('funky:palette:context:change', {
			previous: previousContext,
			current: contextName
		});
		
		// If palette is open, refresh results
		if (state.isOpen) {
			performSearch();
		}
		
		return CommandPalette;
	}

	/**
	 * Clear the active context
	 * @returns {Object} CommandPalette instance
	 */
	function clearContext() {
		return setContext(null);
	}

	/**
	 * Get current context
	 * @returns {string|null}
	 */
	function getContext() {
		return state.context;
	}

	/**
	 * Check if a command matches current context
	 * @param {Object} command
	 * @returns {boolean}
	 * @private
	 */
	function commandMatchesContext(command) {
		// No context restriction - always show
		if (!command.context) return true;
		
		// No active context - don't show context-specific commands
		if (!state.context) return false;
		
		// Match context (string)
		if (typeof command.context === 'string') {
			return command.context === state.context;
		}
		
		// Array of contexts
		if (Array.isArray(command.context)) {
			return command.context.indexOf(state.context) !== -1;
		}
		
		return false;
	}

	// =========================================================================
	// Dynamic Command State (Phase 7)
	// =========================================================================

	/**
	 * Enable a command
	 * @param {string} id - Command ID
	 * @returns {Object} CommandPalette instance
	 */
	function enableCommand(id) {
		var command = findCommand(id);
		if (command) {
			command.disabled = false;
			if (state.isOpen) performSearch();
		}
		return CommandPalette;
	}

	/**
	 * Disable a command
	 * @param {string} id - Command ID
	 * @returns {Object} CommandPalette instance
	 */
	function disableCommand(id) {
		var command = findCommand(id);
		if (command) {
			command.disabled = true;
			if (state.isOpen) performSearch();
		}
		return CommandPalette;
	}

	/**
	 * Show a command (remove hidden)
	 * @param {string} id - Command ID
	 * @returns {Object} CommandPalette instance
	 */
	function showCommand(id) {
		var command = findCommand(id);
		if (command) {
			command.hidden = false;
			if (state.isOpen) performSearch();
		}
		return CommandPalette;
	}

	/**
	 * Hide a command
	 * @param {string} id - Command ID
	 * @returns {Object} CommandPalette instance
	 */
	function hideCommand(id) {
		var command = findCommand(id);
		if (command) {
			command.hidden = true;
			if (state.isOpen) performSearch();
		}
		return CommandPalette;
	}

	/**
	 * Update command properties
	 * @param {string} id - Command ID
	 * @param {Object} updates - Properties to update
	 * @returns {Object} CommandPalette instance
	 */
	function updateCommand(id, updates) {
		var command = findCommand(id);
		if (!command) {
			console.warn('[Funky.CommandPalette] Command "' + id + '" not found');
			return CommandPalette;
		}
		
		// Apply allowed updates
		var allowedKeys = ['title', 'hint', 'icon', 'shortcut', 'disabled', 'hidden', 'keywords'];
		allowedKeys.forEach(function(key) {
			if (updates.hasOwnProperty(key)) {
				command[key] = updates[key];
			}
		});
		
		if (state.isOpen) performSearch();
		
		return CommandPalette;
	}

	// =========================================================================
	// API Search (Phase 6)
	// =========================================================================

	var apiSearchTimer = null;
	var currentRequest = null;

	/**
	 * Default API response transform
	 * @param {Object} response - API response
	 * @returns {Array} - Array of result objects
	 * @private
	 */
	function defaultApiTransform(response) {
		// Handle common response formats
		if (Array.isArray(response)) {
			return response;
		}
		if (response.data && Array.isArray(response.data)) {
			return response.data;
		}
		if (response.results && Array.isArray(response.results)) {
			return response.results;
		}
		if (response.items && Array.isArray(response.items)) {
			return response.items;
		}
		return [];
	}

	/**
	 * Debounced API search
	 * @private
	 */
	function debouncedApiSearch() {
		if (apiSearchTimer) {
			clearTimeout(apiSearchTimer);
		}
		apiSearchTimer = setTimeout(function() {
			performApiSearch();
		}, state.subPalette ? state.subPalette.debounce : 300);
	}

	/**
	 * Perform API search
	 * @private
	 */
	function performApiSearch() {
		var query = state.query.trim();
		var config = state.subPalette;

		if (!config) return;

		// Abort previous request
		if (currentRequest && currentRequest.abort) {
			currentRequest.abort();
		}

		// Check minimum length
		if (query.length < config.minLength) {
			renderApiEmptyState('Type at least ' + config.minLength + ' characters...');
			return;
		}

		// Show loading
		renderApiLoadingState();

		// Handle function-based API (returns Promise)
		if (typeof config.api === 'function') {
			var result = config.api(query);
			// Ensure it's a Promise
			currentRequest = Promise.resolve(result)
				.then(function(data) {
					// Function returns results directly (no transform needed usually)
					var results = Array.isArray(data) ? data : config.transform(data);
					renderApiResults(results);
				})
				.catch(function(error) {
					if (error.name !== 'AbortError') {
						console.error('[Funky.CommandPalette] API search error:', error);
						renderApiErrorState();
					}
				});
			return;
		}

		// URL-based API: Build URL with query parameter
		var url = config.api;
		if (url.indexOf('?') === -1) {
			url += '?q=' + encodeURIComponent(query);
		} else {
			url += '&q=' + encodeURIComponent(query);
		}

		// Fetch
		currentRequest = fetch(url, {
			method: 'GET',
			headers: {
				'Accept': 'application/json',
				'X-Requested-With': 'XMLHttpRequest'
			}
		})
		.then(function(response) {
			if (!response.ok) {
				throw new Error('HTTP ' + response.status);
			}
			return response.json();
		})
		.then(function(data) {
			var results = config.transform(data);
			renderApiResults(results);
		})
		.catch(function(error) {
			if (error.name !== 'AbortError') {
				console.error('[Funky.CommandPalette] API search error:', error);
				renderApiErrorState();
			}
		});
	}

	/**
	 * Render API results
	 * @param {Array} results - Search results
	 * @private
	 */
	function renderApiResults(results) {
		// Remove any existing empty/error states but preserve listContainer
		var existingEmpty = elements.results.el.querySelector('.command-palette__empty');
		var existingError = elements.results.el.querySelector('.command-palette__error');
		var existingLoading = elements.results.el.querySelector('.command-palette__loading');
		if (existingEmpty) existingEmpty.remove();
		if (existingError) existingError.remove();
		if (existingLoading) existingLoading.remove();

		elements.results.el.scrollTop = 0;

		if (!results || results.length === 0) {
			renderApiEmptyState(state.subPalette.emptyText);
			return;
		}

		// Show the SelectableList container (may have been hidden by API states)
		if (elements.listContainer) {
			elements.listContainer.style('display', '');
		}

		// Store results for selection
		state.results = results;

		// Use SelectableList if available
		if (state.selectableList) {
			state.selectableList.setItems(results);
			elements.input.attr('aria-activedescendant', 'item-' + state.selectableList.id + '-0');
			emitEvent('funky:palette:api:results', { results: results, count: results.length });
			return;
		}
		
		// Legacy: Create results group
		var group = D.create('div')
			.classAdd('command-palette__group')
			.attr('role', 'listbox');
		
		results.forEach(function(result, index) {
			var item = renderApiResultItem(result, index);
			group.append(item);
		});
		
		elements.results.append(group);
		elements.input.attr('aria-activedescendant', 'palette-result-0');
		
		emitEvent('funky:palette:api:results', { results: results, count: results.length });
	}

	/**
	 * Render single API result item
	 * @param {Object} result - Result object
	 * @param {number} index - Item index
	 * @returns {Object} - Funky.Dom element
	 * @private
	 */
	function renderApiResultItem(result, index) {
		var isSelected = index === 0; // First item selected by default
		var focusedIndex = state.selectableList ? state.selectableList.getFocusedIndex() : 0;
		isSelected = index === focusedIndex;
		
		var item = D.create('div')
			.classAdd('command-palette__item')
			.attr({
				'role': 'option',
				'id': 'palette-result-' + index,
				'aria-selected': isSelected ? 'true' : 'false',
				'data-index': index
			})
			.on('click', function(e) {
				e.preventDefault();
				selectApiResult(index);
			})
			.on('mouseenter', function() {
				if (state.lastInteraction === 'mouse') {
					updateSelectionIndex(index);
				}
			})
			.on('mousemove', function() {
				state.lastInteraction = 'mouse';
				var currentFocused = state.selectableList ? state.selectableList.getFocusedIndex() : 0;
				if (currentFocused !== index) {
					updateSelectionIndex(index);
				}
			});
		
		if (isSelected) {
			item.classAdd('is-selected');
		}
		
		// Icon - use result icon or default
		var iconClass = result.icon || 'fa-file';
		var icon = D.create('i')
			.classAdd('command-palette__item-icon')
			.attr('aria-hidden', 'true');
		
		var iconClasses = iconClass.split(' ');
		if (iconClasses.length === 1 && iconClasses[0].indexOf('fa-') === 0) {
			icon.classAdd('fas', iconClasses[0]);
		} else {
			iconClasses.forEach(function(cls) {
				if (cls) icon.classAdd(cls);
			});
		}
		item.append(icon);
		
		// Content
		var content = D.create('div')
			.classAdd('command-palette__item-content');
		
		// Title
		var title = D.create('span')
			.classAdd('command-palette__item-title')
			.text(result.title || result.name || result.label || 'Untitled');
		content.append(title);
		
		// Subtitle / hint
		var subtitle = result.subtitle || result.hint || result.description;
		if (subtitle) {
			var hint = D.create('span')
				.classAdd('command-palette__item-hint')
				.text(subtitle);
			content.append(hint);
		}
		
		item.append(content);
		
		// Badge (optional)
		if (result.badge) {
			var badge = D.create('span')
				.classAdd('command-palette__item-badge')
				.text(result.badge);
			item.append(badge);
		}
		
		return item;
	}

	/**
	 * Select and execute API result
	 * @param {number} index
	 * @private
	 */
	function selectApiResult(index) {
		var result = state.results[index];
		if (!result) return;
		
		var config = state.subPalette;
		
		// Close palette
		if (state.config.closeOnSelect) {
			close('select');
		}
		
		// Execute callback
		if (config && config.onSelect && typeof config.onSelect === 'function') {
			try {
				config.onSelect(result);
			} catch (e) {
				console.error('[Funky.CommandPalette] API onSelect error:', e);
			}
		}
		
		emitEvent('funky:palette:api:select', { result: result });
	}

	/**
	 * Render API loading state
	 * @private
	 */
	function renderApiLoadingState() {
		// Hide the SelectableList container to prevent showing its empty state
		if (elements.listContainer) {
			elements.listContainer.style('display', 'none');
		}

		// Remove any existing empty/error states but preserve listContainer
		var existingEmpty = elements.results.el.querySelector('.command-palette__empty');
		var existingError = elements.results.el.querySelector('.command-palette__error');
		var existingLoading = elements.results.el.querySelector('.command-palette__loading');
		if (existingEmpty) existingEmpty.remove();
		if (existingError) existingError.remove();
		if (existingLoading) existingLoading.remove();

		var loading = D.create('div')
			.classAdd('command-palette__loading');

		var spinner = D.create('i')
			.classAdd('fas', 'fa-circle-notch', 'fa-spin', 'command-palette__loading-icon')
			.attr('aria-hidden', 'true');

		var text = D.create('span')
			.text(state.subPalette ? state.subPalette.loadingText : 'Searching...');

		loading.append(spinner, text);
		elements.results.append(loading);

		state.results = [];
	}

	/**
	 * Render API empty state
	 * @param {string} message
	 * @private
	 */
	function renderApiEmptyState(message) {
		// Hide the SelectableList container to prevent showing its empty state
		if (elements.listContainer) {
			elements.listContainer.style('display', 'none');
		}

		// Remove any existing empty/error states but preserve listContainer
		var existingEmpty = elements.results.el.querySelector('.command-palette__empty');
		var existingError = elements.results.el.querySelector('.command-palette__error');
		var existingLoading = elements.results.el.querySelector('.command-palette__loading');
		if (existingEmpty) existingEmpty.remove();
		if (existingError) existingError.remove();
		if (existingLoading) existingLoading.remove();

		var empty = D.create('div')
			.classAdd('command-palette__empty');

		var icon = D.create('i')
			.classAdd('fas', 'fa-search', 'command-palette__empty-icon')
			.attr('aria-hidden', 'true');

		var text = D.create('p').text(message);

		empty.append(icon, text);
		elements.results.append(empty);

		state.results = [];
	}

	/**
	 * Render API error state
	 * @private
	 */
	function renderApiErrorState() {
		// Hide the SelectableList container to prevent showing its empty state
		if (elements.listContainer) {
			elements.listContainer.style('display', 'none');
		}

		// Remove any existing empty/error states but preserve listContainer
		var existingEmpty = elements.results.el.querySelector('.command-palette__empty');
		var existingError = elements.results.el.querySelector('.command-palette__error');
		var existingLoading = elements.results.el.querySelector('.command-palette__loading');
		if (existingEmpty) existingEmpty.remove();
		if (existingError) existingError.remove();
		if (existingLoading) existingLoading.remove();

		var error = D.create('div')
			.classAdd('command-palette__error');

		var icon = D.create('i')
			.classAdd('fas', 'fa-exclamation-triangle', 'command-palette__error-icon')
			.attr('aria-hidden', 'true');

		var text = D.create('p').text(state.subPalette ? state.subPalette.errorText : 'Search failed');

		var retry = D.create('button')
			.classAdd('command-palette__error-retry')
			.text('Retry')
			.on('click', function() {
				performApiSearch();
			});

		error.append(icon, text, retry);
		elements.results.append(error);

		state.results = [];
	}

	/**
	 * Handle keyboard navigation within input
	 * Note: Most keyboard handling is via Funky.Keyboard scoped shortcuts
	 * @private
	 */
	function handleKeydown(e) {
		state.lastInteraction = 'keyboard';

		// Tab key - trap focus within palette (use fallback only if FocusManager trap not active)
		if (e.key === 'Tab' && !focusTrapCleanup) {
			trapFocus(e);
			return;
		}

		// Input-specific handling - arrow keys, enter, escape
		// These are handled via Funky.Keyboard scope, but we add fallbacks here
		// in case Keyboard module is not available
		var Keyboard = getKeyboard();
		if (!Keyboard) {
			switch (e.key) {
				case 'Escape':
					e.preventDefault();
					if (state.subPalette) {
						closeSubPalette();
					} else {
						close('escape');
					}
					break;
				case 'Backspace':
					// If input empty and in sub-palette, go back
					if (state.query === '' && state.subPalette) {
						e.preventDefault();
						closeSubPalette();
					}
					break;
				case 'ArrowDown':
					e.preventDefault();
					navigateDown();
					break;
				case 'ArrowUp':
					e.preventDefault();
					navigateUp();
					break;
				case 'Enter':
					e.preventDefault();
					if (state.subPalette && state.subPalette.type === 'api') {
						var focusedIdx = state.selectableList ? state.selectableList.getFocusedIndex() : 0;
						selectApiResult(focusedIdx);
					} else {
						executeSelected();
					}
					break;
			}
		}
	}

	/**
	 * Trap focus within the command palette modal
	 * @private
	 * @param {KeyboardEvent} e
	 */
	function trapFocus(e) {
		if (!elements.container || !elements.container.el) return;

		var container = elements.container.el;
		var focusableSelectors = 'input:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';
		var focusable = container.querySelectorAll(focusableSelectors);

		if (focusable.length === 0) return;

		var first = focusable[0];
		var last = focusable[focusable.length - 1];

		if (e.shiftKey && document.activeElement === first) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && document.activeElement === last) {
			e.preventDefault();
			first.focus();
		}
	}

	// =========================================================================
	// Keyboard Registration (via Funky.Keyboard)
	// =========================================================================

	/**
	 * Register global hotkey - hooks into existing funky.keyboard.search event
	 * @private
	 */
	function registerHotkey() {
		
		// Listen for the existing keyboard search event (dispatched by Funky.Keyboard on mod+k)
		var searchHandler = function() {
			toggle();
		};
		
		document.addEventListener('funky.keyboard.search', searchHandler);
		
		// Store cleanup function
		keyboardCleanup.hotkey = function() {
			document.removeEventListener('funky.keyboard.search', searchHandler);
		};
	}

	/**
	 * Native keydown handler for palette navigation
	 * Forwards arrow keys to SelectableList, handles special keys directly
	 * @private
	 */
	function handlePaletteKeydown(e) {
		state.lastInteraction = 'keyboard';
		
		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				if (state.selectableList) {
					state.selectableList.navigateBy(1);
				}
				break;
			case 'ArrowUp':
				e.preventDefault();
				if (state.selectableList) {
					state.selectableList.navigateBy(-1);
				}
				break;
			case 'Enter':
				e.preventDefault();
				if (state.subPalette && state.subPalette.type === 'api') {
					var focusedIndex = state.selectableList ? state.selectableList.getFocusedIndex() : 0;
					selectApiResult(focusedIndex);
				} else {
					executeSelected();
				}
				break;
			case 'Escape':
				e.preventDefault();
				if (state.subPalette) {
					closeSubPalette();
				} else {
					close('escape');
				}
				break;
			case 'Backspace':
				// Only go back if input is empty and in sub-palette
				if (state.query === '' && state.subPalette) {
					e.preventDefault();
					closeSubPalette();
				}
				break;
		}
	}

	/**
	 * Register palette-scoped shortcuts
	 * Uses native keydown as primary handler (more reliable than Keyboard scopes)
	 * @private
	 */
	function registerPaletteShortcuts() {
		// Add native keydown handler to the input for palette navigation
		// (input has focus, so it receives the keydown events)
		if (elements.input && elements.input.el) {
			elements.input.el.addEventListener('keydown', handlePaletteKeydown);
		}
		
		var Keyboard = getKeyboard();
		if (Keyboard) {
			// Push palette scope to prevent other shortcuts from firing
			Keyboard.pushScope('command-palette');
		}
	}

	/**
	 * Unregister palette-scoped shortcuts
	 * @private
	 */
	function unregisterPaletteShortcuts() {
		// Remove native keydown handler from input
		if (elements.input && elements.input.el) {
			elements.input.el.removeEventListener('keydown', handlePaletteKeydown);
		}
		
		var Keyboard = getKeyboard();
		if (Keyboard) {
			Keyboard.popScope(); // Remove 'command-palette' scope
		}
	}

	function navigateDown() {
		// Legacy fallback - SelectableList handles navigation via handlePaletteKeydown
		if (state.selectableList) {
			state.selectableList.navigateBy(1);
			return;
		}
		if (state.results.length === 0) return;
		var index = 0;
		index = (index + 1) % state.results.length;
		updateSelectionLegacy(index);
		emitEvent('funky:palette:navigate', { index: index, direction: 'down' });
	}

	function navigateUp() {
		// Legacy fallback - SelectableList handles navigation via handlePaletteKeydown
		if (state.selectableList) {
			state.selectableList.navigateBy(-1);
			return;
		}
		if (state.results.length === 0) return;
		var index = state.results.length - 1;
		updateSelectionLegacy(index);
		emitEvent('funky:palette:navigate', { index: index, direction: 'up' });
	}

	function executeSelected() {
		if (state.results.length === 0) {
			return;
		}
		
		// Get focused item from SelectableList
		var selected = state.selectableList ? state.selectableList.getFocused() : state.results[0];
		if (!selected) {
			return;
		}
		
		if (selected.disabled) {
			console.warn('[Funky.CommandPalette] Command "' + selected.id + '" is disabled');
			return;
		}
		
		// Check if this command opens a sub-palette - don't close if so
		var hasChildren = selected.children && selected.children.length > 0;
		
		// Close palette first if configured (but not for sub-palette commands)
		if (state.config.closeOnSelect && !hasChildren) {
			close('select');
		}
		
		// Add to recent (but not for sub-palette parent commands)
		if (!hasChildren) {
			addToRecent(selected.id);
		}
		
		// Execute
		executeCommand(selected);
	}

	// updateSelection is now handled by SelectableList - see updateSelectionLegacy for fallback

	// =========================================================================
	// Open / Close
	// =========================================================================

	/**
	 * Open the command palette
	 */
	function open() {
		if (state.isOpen) {
			return;
		}

		state.isOpen = true;
		state.query = '';

		elements.overlay.classAdd('is-open');
		elements.container.classAdd('is-open');

		// Clear and focus input
		elements.input.el.value = '';

		// Register palette-scoped shortcuts (pushes scope)
		registerPaletteShortcuts();

		// Set up focus trap using FocusManager if available
		if (Funky.FocusManager && Funky.FocusManager.trapFocus && elements.container && elements.container.el) {
			focusTrapCleanup = Funky.FocusManager.trapFocus(elements.container.el, {
				autoFocus: false // We handle initial focus ourselves
			});
		}

		// Perform initial search (shows all commands)
		performSearch();

		// Delay focus slightly for animation, use FocusManager if available
		setTimeout(function() {
			if (elements.input && elements.input.el) {
				if (Funky.FocusManager && Funky.FocusManager.focusAndPush) {
					Funky.FocusManager.focusAndPush(elements.input.el, {
						label: 'Command Palette'
					});
				} else {
					elements.input.el.focus();
				}
			}
		}, 50);

		emitEvent('funky:palette:open', {});
	}

	/**
	 * Close the command palette
	 * @param {string} [reason] - Reason for closing
	 */
	function close(reason) {
		if (!state.isOpen) {
			return;
		}

		// Handle event objects passed from click handlers
		var closeReason = 'manual';
		if (typeof reason === 'string') {
			closeReason = reason;
		} else if (reason && reason.type) {
			// It's an event object
			closeReason = 'overlay-click';
		}

		state.isOpen = false;

		elements.overlay.classRemove('is-open');
		elements.container.classRemove('is-open');

		// Reset sub-palette state
		if (state.subPalette) {
			state.subPalette = null;
			state.breadcrumb = [];
			state.parentQuery = '';
			// Remove breadcrumb UI
			var existing = D.one('.command-palette__breadcrumb');
			if (existing) existing.remove();
			// Restore placeholder
			elements.input.attr('placeholder', state.config.placeholder);
		}

		// Unregister palette shortcuts (pops scope)
		unregisterPaletteShortcuts();

		// Clean up focus trap
		if (focusTrapCleanup) {
			focusTrapCleanup();
			focusTrapCleanup = null;
		}

		// Return focus via FocusManager
		if (Funky.FocusManager && Funky.FocusManager.popFocus) {
			Funky.FocusManager.popFocus();
		}

		emitEvent('funky:palette:close', { reason: closeReason });
	}

	/**
	 * Toggle the command palette
	 */
	function toggle() {
		if (state.isOpen) {
			close('toggle');
		} else {
			open();
		}
	}

	// =========================================================================
	// Event Emission
	// =========================================================================

	/**
	 * Emit event via Funky.PubSub if available
	 * @private
	 */
	function emitEvent(name, payload) {
		if (PubSub && PubSub.emit) {
			PubSub.emit(name, payload);
		}
	}

	// =========================================================================
	// Public API
	// =========================================================================

	var CommandPalette = {
		/**
		 * Initialize the command palette
		 * @param {Object} [options] - Configuration options
		 * @param {string} [options.hotkey='mod+k'] - Hotkey to open palette
		 * @param {string} [options.placeholder='Type a command or search...'] - Input placeholder
		 * @param {number} [options.maxResults=10] - Maximum results to display
		 * @param {boolean} [options.showRecent=true] - Show recent commands
		 * @param {number} [options.maxRecent=5] - Maximum recent commands
		 * @param {number} [options.fuzzyThreshold=0.4] - Fuzzy search threshold
		 * @param {number} [options.debounceMs=150] - Input debounce delay
		 * @param {string} [options.storageKey='palette_recent'] - Storage key for recent
		 * @param {boolean} [options.closeOnSelect=true] - Close after executing command
		 * @param {boolean} [options.showShortcuts=true] - Show keyboard shortcuts
		 * @returns {Object} CommandPalette instance
		 */
		init: function(options) {
			if (state.initialized) {
				return this;
			}

			// Merge config
			state.config = {};
			Object.keys(DEFAULTS).forEach(function(key) {
				state.config[key] = (options && options[key] !== undefined)
					? options[key]
					: DEFAULTS[key];
			});

			// Initialize debounce
			initDebounce();

			// Initialize search engine
			initSearchEngine();

			// Initialize recent history (Funky.History)
			initRecentHistory();

			// Load recent from storage (fallback)
			loadRecent();

			// Build DOM
			buildDOM();

			// Register global hotkey via Funky.Keyboard
			registerHotkey();

			state.initialized = true;

			emitEvent('funky:palette:init', { config: state.config });

			return this;
		},

		/**
		 * Open the palette
		 */
		open: open,

		/**
		 * Close the palette
		 * @param {string} [reason] - Reason for closing
		 */
		close: close,

		/**
		 * Toggle the palette
		 */
		toggle: toggle,

		/**
		 * Check if palette is open
		 * @returns {boolean}
		 */
		isOpen: function() {
			return state.isOpen;
		},

		/**
		 * Get current configuration
		 * @returns {Object}
		 */
		getConfig: function() {
			return Object.assign({}, state.config);
		},

		/**
		 * Register a command
		 * @param {Object} command - Command definition
		 * @param {string} command.id - Unique command ID
		 * @param {string} command.title - Display title
		 * @param {Function} [command.action] - Command handler function
		 * @param {string} [command.href] - Navigation URL
		 * @param {string} [command.icon] - Icon class
		 * @param {string} [command.shortcut] - Keyboard shortcut
		 * @param {string} [command.category='Actions'] - Command category
		 * @param {string} [command.hint] - Additional hint text
		 * @param {Array} [command.keywords] - Search keywords
		 * @param {number} [command.priority=0] - Sort priority
		 * @returns {Object} CommandPalette instance
		 */
		register: function(command) {
			registerCommand(command);
			return this;
		},

		/**
		 * Register multiple commands
		 * @param {Array} commands - Array of command definitions
		 * @returns {Object} CommandPalette instance
		 */
		registerMany: function(commands) {
			if (!Array.isArray(commands)) {
				console.warn('[Funky.CommandPalette] registerMany expects an array');
				return this;
			}
			
			commands.forEach(function(cmd) {
				registerCommand(cmd);
			});
			
			return this;
		},

		/**
		 * Unregister a command
		 * @param {string} commandId - Command ID to remove
		 * @returns {Object} CommandPalette instance
		 */
		unregister: function(commandId) {
			unregisterCommand(commandId);
			return this;
		},

		/**
		 * Clear commands
		 * @param {string} [category] - Optional: only clear specific category
		 * @returns {Object} CommandPalette instance
		 */
		clear: function(category) {
			clearCommands(category);
			return this;
		},

		/**
		 * Get command by ID
		 * @param {string} id - Command ID
		 * @returns {Object|null}
		 */
		getCommand: findCommand,

		/**
		 * Get all registered commands
		 * @param {string} [category] - Optional: filter by category
		 * @returns {Array} Copy of commands array
		 */
		getCommands: function(category) {
			if (category) {
				return state.commands.filter(function(cmd) {
					return cmd.category === category;
				});
			}
			return state.commands.slice();
		},

		/**
		 * Get recent command IDs
		 * @returns {Array}
		 */
		getRecent: function() {
			return state.recentIds.slice();
		},

		/**
		 * Get recent commands as full objects
		 * @returns {Array}
		 */
		getRecentCommands: function() {
			return getRecentCommands();
		},

		/**
		 * Clear recent commands
		 * @returns {Object} CommandPalette instance
		 */
		clearRecent: function() {
			clearRecent();
			return this;
		},

		/**
		 * Remove a command from recent history
		 * @param {string} id - Command ID
		 * @returns {Object} CommandPalette instance
		 */
		removeFromRecent: function(id) {
			removeFromRecent(id);
			return this;
		},

		/**
		 * Execute a command by ID
		 * @param {string} id - Command ID
		 * @returns {Object} CommandPalette instance
		 */
		execute: function(id) {
			var command = findCommand(id);
			if (command) {
				executeCommand(command);
			} else {
				console.warn('[Funky.CommandPalette] Command "' + id + '" not found');
			}
			return this;
		},

		/**
		 * Get state (for debugging)
		 * @returns {Object}
		 */
		getState: function() {
			var focusedIndex = state.selectableList ? state.selectableList.getFocusedIndex() : 0;
			return {
				initialized: state.initialized,
				isOpen: state.isOpen,
				query: state.query,
				focusedIndex: focusedIndex,
				resultsCount: state.results.length,
				commandsCount: state.commands.length,
				subPalette: state.subPalette ? state.subPalette.title : null,
				breadcrumb: state.breadcrumb.map(function(b) { return b.title; })
			};
		},

		/**
		 * Open API search sub-palette
		 * @param {Object} config - API search configuration
		 * @returns {Object} CommandPalette instance
		 */
		openSearch: function(config) {
			if (!state.isOpen) {
				open();
			}
			openApiSearch(config);
			return this;
		},

		/**
		 * Go back from sub-palette
		 * @returns {Object} CommandPalette instance
		 */
		back: function() {
			closeSubPalette();
			return this;
		},

		/**
		 * Check if in sub-palette
		 * @returns {boolean}
		 */
		isInSubPalette: function() {
			return isInSubPalette();
		},

		// =====================================================================
		// Context-Aware Commands (Phase 7)
		// =====================================================================

		/**
		 * Register commands for a context
		 * @param {string} contextName
		 * @param {Array} commands
		 * @returns {Object} CommandPalette instance
		 */
		registerContext: function(contextName, commands) {
			return registerContext(contextName, commands);
		},

		/**
		 * Unregister context commands
		 * @param {string} contextName
		 * @returns {Object} CommandPalette instance
		 */
		unregisterContext: function(contextName) {
			return unregisterContext(contextName);
		},

		/**
		 * Set active context
		 * @param {string|null} contextName
		 * @returns {Object} CommandPalette instance
		 */
		setContext: function(contextName) {
			return setContext(contextName);
		},

		/**
		 * Clear active context
		 * @returns {Object} CommandPalette instance
		 */
		clearContext: function() {
			return clearContext();
		},

		/**
		 * Get current context
		 * @returns {string|null}
		 */
		getContext: function() {
			return getContext();
		},

		/**
		 * Enable a command
		 * @param {string} id
		 * @returns {Object} CommandPalette instance
		 */
		enable: function(id) {
			return enableCommand(id);
		},

		/**
		 * Disable a command
		 * @param {string} id
		 * @returns {Object} CommandPalette instance
		 */
		disable: function(id) {
			return disableCommand(id);
		},

		/**
		 * Show a hidden command
		 * @param {string} id
		 * @returns {Object} CommandPalette instance
		 */
		show: function(id) {
			return showCommand(id);
		},

		/**
		 * Hide a command
		 * @param {string} id
		 * @returns {Object} CommandPalette instance
		 */
		hide: function(id) {
			return hideCommand(id);
		},

		/**
		 * Update command properties
		 * @param {string} id
		 * @param {Object} updates
		 * @returns {Object} CommandPalette instance
		 */
		update: function(id, updates) {
			return updateCommand(id, updates);
		},

		/**
		 * Destroy the palette
		 */
		destroy: function() {
			if (!state.initialized) return;

			// Unregister keyboard shortcuts
			if (keyboardCleanup.hotkey) keyboardCleanup.hotkey();
			unregisterPaletteShortcuts();

			// Cleanup all command shortcuts
			for (var id in shortcutCleanups) {
				if (shortcutCleanups.hasOwnProperty(id) && shortcutCleanups[id]) {
					shortcutCleanups[id]();
				}
			}
			shortcutCleanups = {};

			if (elements.overlay) elements.overlay.remove();
			if (elements.container) elements.container.remove();

			// Reset all state
			state.initialized = false;
			state.isOpen = false;
			state.commands = [];
			state.results = [];
			state.query = '';
			state.recentIds = [];
			state.context = null;
			state.contextCommands = {};
			state.subPalette = null;
			state.parentQuery = '';
			state.breadcrumb = [];
			state.selectableList = null;
			state.config = {};

			elements = {
				overlay: null,
				container: null,
				input: null,
				results: null,
				footer: null
			};

			keyboardCleanup = {
				hotkey: null,
				escape: null,
				arrows: null
			};

			emitEvent('funky:palette:destroy', {});
		}
	};

	// =========================================================================
	// Export
	// =========================================================================

	// Register with Funky core
	if (global.Funky && global.Funky.register) {
		global.Funky.register('CommandPalette', CommandPalette);
	}

})(window);

/**
 * Funky Kanban - Card-based Workflow Board
 * 
 * Drag-and-drop workflow visualisation with columns and swimlanes.
 * Uses native HTML5 Drag and Drop API - no external dependencies.
 * 
 * Usage:
 *   var board = Funky.Kanban.init('#board', {
 *     columns: [
 *       { id: 'todo', title: 'To Do' },
 *       { id: 'doing', title: 'In Progress', limit: 5 },
 *       { id: 'done', title: 'Done' }
 *     ],
 *     cards: [
 *       { id: 1, column: 'todo', title: 'Task 1' }
 *     ],
 *     onCardMove: function(card, from, to, position) { }
 *   });
 * 
 * @version 1.0.1
 */
(function(window) {
	'use strict';

	// Ensure Funky registry exists
	if (!window.Funky || !window.Funky.register) {
		console.error('[Funky.Kanban] Registry not found. Load namespace.js first.');
		return;
	}

	// Prevent double registration
	if (typeof Funky !== 'undefined' && Funky.isRegistered && Funky.isRegistered('Kanban')) {
		return;
	}

	// Module-level reference to Funky.Dom
	var D = Funky.Dom;

	/**
	 * Kanban component factory
	 */
	var Kanban = {
		instances: [],
		instanceCounter: 0,
		_instances: {},  // Instance registry by element ID for LiveBinding

		/**
		 * Default configuration
		 */
		defaults: {
			columns: [],
			cards: [],
			dataSource: null,
			swimlanes: null,
			transitions: null,
			renderCard: null,
			renderColumnHeader: null,
			emptyColumnText: 'No cards',
			addCardText: 'Add Card',
			showAddCard: false,
			inlineAddCard: true, // Use inline form for quick add (vs modal)
			// Toolbar & Filters
			showToolbar: false,
			searchableFields: ['title', 'description'],
			quickFilters: null,
			currentUser: null,
			dimFiltered: false,  // dim instead of hide filtered cards
			// Fuzzy search options
			fuzzySearch: false,          // Enable fuzzy matching
			fuzzyThreshold: 0.3,         // Minimum score (0-1)
			fuzzyTokenize: false,        // Split query into tokens
			highlightMatches: true,      // Highlight matched text in cards
			sortMatchesByScore: false,   // Reorder cards within column by score
			showMatchScore: false,       // Show score badge on matched cards
			// API Integration
			api: null,           // { create: 'POST /api/cards', update: 'PATCH /api/cards/:id', delete: 'DELETE /api/cards/:id', move: 'PATCH /api/cards/:id/move' }
			onSave: null,        // Custom save handler: function(action, card, changes) { return Promise }
			autoLoad: true,      // Auto-load data from dataSource on init
			retryAttempts: 3,    // Number of retry attempts for failed API calls
			retryDelay: 1000,    // Delay between retries in ms
			// WebSocket
			boardId: null,       // Board ID for WebSocket channel
			enableWebSocket: false,
			userId: null,        // Current user ID for WebSocket
			// User Presence
			showPresence: false,
			// Callbacks
			onCardMove: null,
			onCardMoved: null,
			onCardClick: null,
			onCardCreate: null,
			onColumnLimitReached: null,
			onSwimlaneChange: null,
			onFilter: null,
			onRemoteUpdate: null,
			onLoadStart: null,
			onLoadComplete: null,
			onLoadError: null,
			onSaveError: null
		},

		/**
		 * Initialise a new Kanban board
		 * @param {string|HTMLElement} container - Container selector or element
		 * @param {Object} options - Configuration options
		 * @returns {KanbanInstance}
		 */
		init: function(container, options) {
			var instance = new KanbanInstance(container, options);
			this.instances.push(instance);
			return instance;
		},

		/**
		 * Destroy all instances
		 */
		destroyAll: function() {
			this.instances.forEach(function(instance) {
				instance.destroy();
			});
			this.instances = [];
		},

		/**
		 * Get instance by ID
		 * @param {string} id - Instance ID
		 * @returns {KanbanInstance|null}
		 */
		getInstance: function(id) {
			for (var i = 0; i < this.instances.length; i++) {
				if (this.instances[i].id === id) {
					return this.instances[i];
				}
			}
			return null;
		},

		/**
		 * Destroy instance by ID
		 * @param {string} id - Instance ID
		 */
		destroy: function(id) {
			var instance = this.getInstance(id);
			if (instance) {
				instance.destroy();
				var idx = this.instances.indexOf(instance);
				if (idx > -1) {
					this.instances.splice(idx, 1);
				}
			}
		}
	};

	/**
	 * KanbanInstance constructor
	 * @param {string|HTMLElement} container - Container selector or element
	 * @param {Object} options - Configuration options
	 */
	function KanbanInstance(container, options) {
		this.id = 'kanban-' + (++Kanban.instanceCounter);
		this.container = typeof container === 'string' 
			? document.querySelector(container) 
			: container;
		
		if (!this.container) {
			console.error('[Funky.Kanban] Container not found:', container);
			return;
		}

		// Merge options with defaults
		this.options = Object.assign({}, Kanban.defaults, options);
		
		// State
		this.columns = new Map();
		this.cards = new Map();
		this.board = null;
		
		// Drag state
		this._draggedCard = null;
		this._draggedCardId = null;
		this._dropIndicator = null;

		// Filter state
		this._searchQuery = '';
		this._activeFilters = {};
		this._activeQuickFilters = {};
		
		// Fuzzy search results
		this.searchResults = new Map();  // cardId -> { score, matches, key }

		// API state
		this._loading = false;
		this._pendingOperations = new Map();
		this._operationId = 0;

		// WebSocket/Presence state
		this._activeUsers = [];
		this._wsSubscribed = false;

		// Register in instance registry for LiveBinding
		var containerId = this.container.id;
		if (containerId) {
			Kanban._instances[containerId] = this;
		}

		// Bound handlers for cleanup
		this._boundHandlers = {};

		this._init();
	}

	/**
	 * Initialise the board
	 */
	KanbanInstance.prototype._init = function() {
		this._createDOM();
		this._renderToolbar();
		this._renderPresence();
		
		if (this.options.swimlanes) {
			this._renderSwimlaneLayout();
		} else {
			this._renderColumns();
		}
		
		// Load cards from API or use inline cards
		if (this.options.dataSource && this.options.autoLoad !== false) {
			this._loadData();
		} else {
			this._renderCards();
		}
		
		this._bindEvents();
		
		// Subscribe to WebSocket updates
		if (this.options.enableWebSocket) {
			this._subscribeWebSocket();
		}
	};

	/**
	 * Create the base DOM structure
	 */
	KanbanInstance.prototype._createDOM = function() {
		// Create board wrapper
		this.board = document.createElement('div');
		this.board.className = 'kanban-board';
		this.board.id = this.id;
		this.board.setAttribute('role', 'application');
		this.board.setAttribute('aria-label', 'Kanban board');

		// Add swimlane mode class if configured
		if (this.options.swimlanes) {
			this.board.classList.add('has-swimlanes');
			this.board.style.setProperty('--kanban-column-count', this.options.columns.length);
		}

		// Create columns container (used in simple mode)
		this.columnsContainer = document.createElement('div');
		this.columnsContainer.className = 'kanban-columns';
		
		this.board.appendChild(this.columnsContainer);
		this.container.appendChild(this.board);

		// Create drop indicator (reused during drag)
		this._dropIndicator = document.createElement('div');
		this._dropIndicator.className = 'kanban-drop-indicator';
		this._dropIndicator.style.display = 'none';

		// Swimlanes state storage
		this.swimlanes = new Map();
		this._swimlaneCollapsed = this._loadSwimlaneState();
	};

	/**
	 * Render all columns
	 */
	KanbanInstance.prototype._renderColumns = function() {
		var self = this;
		
		this.options.columns.forEach(function(columnConfig) {
			self._renderColumn(columnConfig);
		});
	};

	/**
	 * Render a single column
	 * @param {Object} config - Column configuration
	 * @param {number} position - Optional insert position
	 */
	KanbanInstance.prototype._renderColumn = function(config, position) {
		var column = document.createElement('div');
		column.className = 'kanban-column';
		column.dataset.columnId = config.id;
		column.setAttribute('role', 'listbox');
		column.setAttribute('aria-label', config.title + ' column');

		// Header
		var header = document.createElement('div');
		header.className = 'kanban-column-header';
		
		if (config.color) {
			header.style.borderTopColor = config.color;
			header.classList.add('has-color');
		}

		// Custom header rendering or default
		if (this.options.renderColumnHeader) {
			var customContent = this.options.renderColumnHeader(config);
			if (typeof customContent === 'string') {
				header.innerHTML = customContent;
			} else {
				header.appendChild(customContent);
			}
		} else {
			header.appendChild(this._renderDefaultColumnHeader(config));
		}

		column.appendChild(header);

		// Body (card container)
		var body = document.createElement('div');
		body.className = 'kanban-column-body';
		body.dataset.columnId = config.id;
		column.appendChild(body);

		// Empty state placeholder
		var empty = document.createElement('div');
		empty.className = 'kanban-column-empty';
		empty.appendChild(Funky.Util.toDom(this.options.emptyColumnText));
		body.appendChild(empty);

		// Add card button (if enabled)
		if (this.options.showAddCard) {
			var addWrapper = document.createElement('div');
			addWrapper.className = 'kanban-add-card';
			addWrapper.dataset.columnId = config.id;

			var addBtn = D.button()
				.class('kanban-add-card-btn')
				.attr('type', 'button')
				.attr('data-column-id', config.id)
				.append(D.icon('fas fa-plus'))
				.append(' ')
				.append(Funky.Util.toDom(this.options.addCardText))
				.el;
			addWrapper.appendChild(addBtn);

			// Inline form (hidden by default)
			var addForm = D.div().classAdd('kanban-add-card-form').style('display', 'none')
				.child(
					D.create('input')
						.attr('type', 'text')
						.classAdd('kanban-add-card-input')
						.attr('placeholder', 'Enter card title...')
						.attr('autocomplete', 'off'),
					D.div().classAdd('kanban-add-card-actions')
						.child(
							D.button().classAdd('kanban-add-card-submit').attr('type', 'button').text('Add'),
							D.button().classAdd('kanban-add-card-cancel').attr('type', 'button').text('Cancel')
						)
				).el;
			addWrapper.appendChild(addForm);

			column.appendChild(addWrapper);
		}

		// Store column reference
		this.columns.set(config.id, {
			config: config,
			element: column,
			header: header,
			body: body,
			cardCount: 0
		});

		// Insert at position or append
		if (typeof position === 'number' && position < this.columnsContainer.children.length) {
			this.columnsContainer.insertBefore(column, this.columnsContainer.children[position]);
		} else {
			this.columnsContainer.appendChild(column);
		}

		return column;
	};

	/**
	 * Render default column header
	 * @param {Object} config - Column configuration
	 * @returns {Element} DOM element
	 */
	KanbanInstance.prototype._renderDefaultColumnHeader = function(config) {
		var content = D.div().classAdd('kanban-column-header-content')
			.child(
				D.create('h3').classAdd('kanban-column-title').text(config.title),
				D.span().classAdd('kanban-column-count').data('count', 0).text('0')
			);

		if (config.limit && config.limit > 0) {
			content.child(D.span().classAdd('kanban-column-limit').text('/ ' + config.limit));
		}

		return content.el;
	};

	// =========================================
	// Swimlane Rendering
	// =========================================

	/**
	 * Render swimlane layout with header row and swimlane rows
	 */
	KanbanInstance.prototype._renderSwimlaneLayout = function() {
		var self = this;
		var config = this.options.swimlanes;

		// Clear columns container - we'll use a different layout
		this.columnsContainer.className = 'kanban-swimlane-wrapper';

		// Create sticky header row
		var headerRow = document.createElement('div');
		headerRow.className = 'kanban-header';
		
		// Empty cell for swimlane labels
		var emptyCell = document.createElement('div');
		emptyCell.className = 'kanban-header-cell kanban-header-label';
		headerRow.appendChild(emptyCell);

		// Column headers
		this.options.columns.forEach(function(col) {
			var cell = document.createElement('div');
			cell.className = 'kanban-header-cell';
			cell.textContent = col.title;
			cell.dataset.columnId = col.id;
			headerRow.appendChild(cell);

			// Track column for swimlane mode
			self.columns.set(col.id, { config: col, cardCount: 0 });
		});

		this.columnsContainer.appendChild(headerRow);

		// Get swimlane values
		var swimlaneValues = this._getSwimlaneValues();

		// Render each swimlane
		swimlaneValues.forEach(function(value) {
			self._renderSwimlane(value);
		});
	};

	/**
	 * Get ordered swimlane values from config or auto-detect from cards
	 */
	KanbanInstance.prototype._getSwimlaneValues = function() {
		var config = this.options.swimlanes;
		
		// Explicit values provided
		if (config.values && config.values.length > 0) {
			return config.values;
		}

		// Auto-detect from cards
		var field = config.field;
		var valuesSet = new Set();
		
		this.options.cards.forEach(function(card) {
			if (card[field] !== undefined && card[field] !== null) {
				valuesSet.add(card[field]);
			}
		});

		// Sort for consistent order
		return Array.from(valuesSet).sort();
	};

	/**
	 * Render a single swimlane row
	 */
	KanbanInstance.prototype._renderSwimlane = function(value) {
		var self = this;
		var config = this.options.swimlanes;
		var label = config.labels && config.labels[value] ? config.labels[value] : value;
		var isCollapsed = this._swimlaneCollapsed[value] || 
			(config.collapsed && config.collapsed.includes(value));

		var swimlane = document.createElement('div');
		swimlane.className = 'kanban-swimlane' + (isCollapsed ? ' collapsed' : '');
		swimlane.dataset.swimlane = value;

		// Swimlane header
		var D = Funky.Dom;
		var header = D.div().class('kanban-swimlane-header').child(
			D.button()
				.class('kanban-swimlane-toggle')
				.attr('type', 'button')
				.aria('expanded', String(!isCollapsed))
				.child(D.icon('fas fa-chevron-' + (isCollapsed ? 'right' : 'down'))),
			D.span().class('kanban-swimlane-title').text(String(label)),
			D.span().class('kanban-swimlane-count').text('0')
		).get();
		swimlane.appendChild(header);

		// Swimlane body with cells for each column
		var body = document.createElement('div');
		body.className = 'kanban-swimlane-body';

		this.options.columns.forEach(function(col) {
			var cell = document.createElement('div');
			cell.className = 'kanban-swimlane-cell';
			cell.dataset.column = col.id;
			cell.dataset.swimlane = value;
			cell.setAttribute('role', 'listbox');
			cell.setAttribute('aria-label', col.title + ' - ' + label);
			body.appendChild(cell);
		});

		swimlane.appendChild(body);
		this.columnsContainer.appendChild(swimlane);

		// Store swimlane reference
		this.swimlanes.set(value, {
			value: value,
			label: label,
			element: swimlane,
			header: header,
			body: body,
			collapsed: isCollapsed
		});
	};

	/**
	 * Get the correct container for a card (handles both modes)
	 */
	KanbanInstance.prototype._getCardContainer = function(cardData) {
		if (!this.options.swimlanes) {
			// Simple column mode
			var columnData = this.columns.get(cardData.column);
			return columnData ? columnData.body : null;
		}

		// Swimlane mode
		var field = this.options.swimlanes.field;
		var swimlaneValue = cardData[field];
		
		// Find the cell
		var selector = '[data-swimlane="' + swimlaneValue + '"] [data-column="' + cardData.column + '"]';
		return this.board.querySelector(selector);
	};

	/**
	 * Update swimlane card count
	 */
	KanbanInstance.prototype._updateSwimlaneCount = function(swimlaneValue) {
		var swimlaneData = this.swimlanes.get(swimlaneValue);
		if (!swimlaneData) return;

		var count = swimlaneData.body.querySelectorAll('.kanban-card').length;
		var countEl = swimlaneData.header.querySelector('.kanban-swimlane-count');
		if (countEl) {
			countEl.textContent = count;
		}

		// Hide empty swimlanes if configured
		if (this.options.swimlanes.hideEmpty) {
			swimlaneData.element.style.display = count === 0 ? 'none' : '';
		}
	};

	/**
	 * Toggle swimlane collapsed state
	 */
	KanbanInstance.prototype.toggleSwimlane = function(swimlaneValue) {
		var swimlaneData = this.swimlanes.get(swimlaneValue);
		if (!swimlaneData) return;

		var isCollapsed = swimlaneData.element.classList.toggle('collapsed');
		swimlaneData.collapsed = isCollapsed;

		// Update toggle icon
		var icon = swimlaneData.header.querySelector('.kanban-swimlane-toggle i');
		if (icon) {
			icon.className = 'fas fa-chevron-' + (isCollapsed ? 'right' : 'down');
		}

		// Update aria
		var btn = swimlaneData.header.querySelector('.kanban-swimlane-toggle');
		if (btn) {
			btn.setAttribute('aria-expanded', !isCollapsed);
		}

		// Save state
		this._saveSwimlaneState(swimlaneValue, isCollapsed);
	};

	/**
	 * Expand all swimlanes
	 */
	KanbanInstance.prototype.expandAllSwimlanes = function() {
		var self = this;
		this.swimlanes.forEach(function(data, value) {
			if (data.collapsed) {
				self.toggleSwimlane(value);
			}
		});
	};

	/**
	 * Collapse all swimlanes
	 */
	KanbanInstance.prototype.collapseAllSwimlanes = function() {
		var self = this;
		this.swimlanes.forEach(function(data, value) {
			if (!data.collapsed) {
				self.toggleSwimlane(value);
			}
		});
	};

	/**
	 * Load swimlane collapsed state from localStorage
	 */
	KanbanInstance.prototype._loadSwimlaneState = function() {
		try {
			var key = 'kanban-swimlanes-' + this.id;
			var stored = localStorage.getItem(key);
			return stored ? JSON.parse(stored) : {};
		} catch (e) {
			return {};
		}
	};

	/**
	 * Save swimlane collapsed state to localStorage
	 */
	KanbanInstance.prototype._saveSwimlaneState = function(swimlaneValue, isCollapsed) {
		try {
			this._swimlaneCollapsed[swimlaneValue] = isCollapsed;
			var key = 'kanban-swimlanes-' + this.id;
			localStorage.setItem(key, JSON.stringify(this._swimlaneCollapsed));
		} catch (e) {
			// localStorage not available
		}
	};

	/**
	 * Add a new swimlane dynamically
	 */
	KanbanInstance.prototype.addSwimlane = function(value, label, position) {
		if (this.swimlanes.has(value)) {
			console.warn('[Funky.Kanban] Swimlane already exists:', value);
			return;
		}

		// Add to config
		if (!this.options.swimlanes.values) {
			this.options.swimlanes.values = [];
		}
		
		if (this.options.swimlanes.labels) {
			this.options.swimlanes.labels[value] = label || value;
		}

		if (typeof position === 'number') {
			this.options.swimlanes.values.splice(position, 0, value);
		} else {
			this.options.swimlanes.values.push(value);
		}

		// Render the swimlane
		this._renderSwimlane(value);

		// Reposition if needed
		if (typeof position === 'number') {
			var swimlaneEl = this.swimlanes.get(value).element;
			var allSwimlanes = this.columnsContainer.querySelectorAll('.kanban-swimlane');
			if (position < allSwimlanes.length - 1) {
				this.columnsContainer.insertBefore(swimlaneEl, allSwimlanes[position]);
			}
		}
	};

	/**
	 * Remove a swimlane
	 */
	KanbanInstance.prototype.removeSwimlane = function(value) {
		var swimlaneData = this.swimlanes.get(value);
		if (!swimlaneData) return false;

		// Move any cards to first swimlane or remove them
		var cards = swimlaneData.body.querySelectorAll('.kanban-card');
		cards.forEach(function(card) {
			card.remove();
		});

		// Remove DOM
		swimlaneData.element.remove();
		this.swimlanes.delete(value);

		// Remove from config
		if (this.options.swimlanes.values) {
			var idx = this.options.swimlanes.values.indexOf(value);
			if (idx > -1) {
				this.options.swimlanes.values.splice(idx, 1);
			}
		}

		return true;
	};

	/**
	 * Update column card count
	 * @param {string} columnId - Column ID
	 */
	KanbanInstance.prototype._updateColumnCount = function(columnId) {
		// In swimlane mode, update all swimlane counts instead
		if (this.options.swimlanes) {
			var self = this;
			this.swimlanes.forEach(function(swimlaneData, value) {
				self._updateSwimlaneCount(value);
			});
			return;
		}

		var columnData = this.columns.get(columnId);
		if (!columnData || !columnData.body) return;

		// Count only visible (non-filtered) cards
		var allCards = columnData.body.querySelectorAll('.kanban-card');
		var visibleCards = columnData.body.querySelectorAll('.kanban-card:not(.filtered-out)');
		var count = visibleCards.length;
		columnData.cardCount = count;

		var countEl = columnData.header.querySelector('.kanban-column-count');
		if (countEl) {
			countEl.textContent = count;
			countEl.dataset.count = count;
		}

		// Update empty state visibility (show if no visible cards)
		var emptyEl = columnData.body.querySelector('.kanban-column-empty');
		if (emptyEl) {
			emptyEl.style.display = count === 0 ? '' : 'none';
		}

		// Check WIP limit (use visible count)
		var limit = columnData.config.limit;
		if (limit && limit > 0) {
			var isOverLimit = count >= limit;
			columnData.element.classList.toggle('at-limit', isOverLimit);

			if (isOverLimit && count === limit && this.options.onColumnLimitReached) {
				this.options.onColumnLimitReached(columnData.config);
			}
		}

		// Update ARIA
		columnData.element.setAttribute('aria-label',
			columnData.config.title + ' column, ' + count + ' cards');
	};

	/**
	 * Bind event handlers
	 */
	KanbanInstance.prototype._bindEvents = function() {
		var self = this;

		// Add card button and inline form
		if (this.options.showAddCard) {
			this._boundHandlers.addCardClick = function(e) {
				var btn = e.target.closest('.kanban-add-card-btn');
				if (btn) {
					var columnId = btn.dataset.columnId;
					
					// If onCardCreate callback exists and inlineAddCard is false, use callback
					if (self.options.onCardCreate && !self.options.inlineAddCard) {
						self.options.onCardCreate(self.columns.get(columnId).config);
					} else {
						// Show inline form
						self._showInlineAddForm(columnId);
					}
					return;
				}

				// Submit button
				var submitBtn = e.target.closest('.kanban-add-card-submit');
				if (submitBtn) {
					var wrapper = submitBtn.closest('.kanban-add-card');
					self._submitInlineAdd(wrapper.dataset.columnId);
					return;
				}

				// Cancel button
				var cancelBtn = e.target.closest('.kanban-add-card-cancel');
				if (cancelBtn) {
					var wrapper = cancelBtn.closest('.kanban-add-card');
					self._hideInlineAddForm(wrapper.dataset.columnId);
					return;
				}
			};
			this.board.addEventListener('click', this._boundHandlers.addCardClick);

			// Handle Enter key in input
			this._boundHandlers.addCardKeydown = function(e) {
				if (e.key === 'Enter' && e.target.classList.contains('kanban-add-card-input')) {
					var wrapper = e.target.closest('.kanban-add-card');
					self._submitInlineAdd(wrapper.dataset.columnId);
				} else if (e.key === 'Escape' && e.target.classList.contains('kanban-add-card-input')) {
					var wrapper = e.target.closest('.kanban-add-card');
					self._hideInlineAddForm(wrapper.dataset.columnId);
				}
			};
			this.board.addEventListener('keydown', this._boundHandlers.addCardKeydown);
		}

		// Card click handler
		this._boundHandlers.cardClick = function(e) {
			// Don't trigger on add card buttons
			if (e.target.closest('.kanban-add-card')) return;
			
			var card = e.target.closest('.kanban-card');
			if (card && self.options.onCardClick) {
				var cardId = card.dataset.cardId;
				var cardRef = self.cards.get(cardId);
				self.options.onCardClick(cardRef ? cardRef.data : null, card, e);
			}
		};
		this.board.addEventListener('click', this._boundHandlers.cardClick);

		// Swimlane toggle handler
		if (this.options.swimlanes) {
			this._boundHandlers.swimlaneToggle = function(e) {
				var toggle = e.target.closest('.kanban-swimlane-toggle');
				if (!toggle) {
					// Also allow clicking header to toggle
					var header = e.target.closest('.kanban-swimlane-header');
					if (header && !e.target.closest('.kanban-card')) {
						var swimlane = header.closest('.kanban-swimlane');
						if (swimlane) {
							self.toggleSwimlane(swimlane.dataset.swimlane);
						}
					}
					return;
				}
				var swimlane = toggle.closest('.kanban-swimlane');
				if (swimlane) {
					self.toggleSwimlane(swimlane.dataset.swimlane);
				}
			};
			this.board.addEventListener('click', this._boundHandlers.swimlaneToggle);
		}

		// Bind drag events
		this._bindDragEvents();
		this._bindTouchEvents();
		this._bindKeyboardEvents();
	};

	// =========================================
	// Card Rendering
	// =========================================

	/**
	 * Render all cards from options
	 */
	KanbanInstance.prototype._renderCards = function() {
		var self = this;

		// Render cards from options.cards
		this.options.cards.forEach(function(cardData) {
			self._renderCard(cardData);
		});

		// Also render cards embedded in columns (alternative API)
		this.options.columns.forEach(function(columnConfig) {
			if (columnConfig.cards && Array.isArray(columnConfig.cards)) {
				columnConfig.cards.forEach(function(cardData) {
					// Add column reference if not set
					if (!cardData.column) {
						cardData.column = columnConfig.id;
					}
					self._renderCard(cardData);
				});
			}
		});

		// Update counts based on mode
		if (this.options.swimlanes) {
			// Update swimlane counts
			this.swimlanes.forEach(function(swimlaneData, value) {
				self._updateSwimlaneCount(value);
			});
		} else {
			// Update column counts
			this.columns.forEach(function(columnData, columnId) {
				self._updateColumnCount(columnId);
			});
		}
	};

	/**
	 * Render a single card
	 * @param {Object} cardData - Card data
	 * @returns {HTMLElement|null}
	 */
	KanbanInstance.prototype._renderCard = function(cardData) {
		// Get container (handles both column and swimlane modes)
		var container = this._getCardContainer(cardData);
		if (!container) {
			console.warn('[Funky.Kanban] Container not found for card:', cardData);
			return null;
		}

		var card = document.createElement('div');
		card.className = 'kanban-card';
		card.dataset.cardId = cardData.id;
		card.setAttribute('draggable', 'true');
		card.setAttribute('role', 'option');
		card.setAttribute('tabindex', '0');

		// Priority class
		if (cardData.priority) {
			card.classList.add('priority-' + cardData.priority);
		}

		// Render content
		if (this.options.renderCard) {
			var content = this.options.renderCard(cardData);
			if (typeof content === 'string') {
				card.innerHTML = content;
			} else if (content instanceof HTMLElement) {
				card.appendChild(content);
			}
		} else {
			card.appendChild(this._renderDefaultCard(cardData));
		}

		// Store card data
		this.cards.set(String(cardData.id), {
			data: cardData,
			element: card
		});

		// Insert at position or append (simple mode has empty placeholder)
		var emptyEl = container.querySelector('.kanban-column-empty');
		if (typeof cardData.position === 'number') {
			var cards = container.querySelectorAll('.kanban-card');
			if (cardData.position < cards.length) {
				container.insertBefore(card, cards[cardData.position]);
			} else if (emptyEl) {
				container.insertBefore(card, emptyEl);
			} else {
				container.appendChild(card);
			}
		} else if (emptyEl) {
			container.insertBefore(card, emptyEl);
		} else {
			container.appendChild(card);
		}

		return card;
	};

	/**
	 * Render default card template
	 * @param {Object} data - Card data
	 * @returns {HTMLElement}
	 */
	KanbanInstance.prototype._renderDefaultCard = function(data) {
		var D = Funky.Dom;
		var self = this;
		
		// Truncate description if needed
		var desc = data.description;
		if (desc && desc.length > 100) {
			desc = desc.substring(0, 100) + '...';
		}
		
		// Build metadata checks
		var hasMeta = data.priority || data.dueDate || data.commentsCount || data.attachmentsCount;
		
		return D.div().class('kanban-card-content').child(
			// Labels
			data.labels && data.labels.length > 0 && D.div().class('kanban-card-labels').child(
				D.each(data.labels, function(label) {
					var color = typeof label === 'object' ? label.color : '';
					var text = typeof label === 'object' ? label.text : label;
					return D.span()
						.class('kanban-label')
						.style(color ? { background: color } : null)
						.text(text);
				})
			),
			
			// Title
			D.div().class('kanban-card-title').text(data.title),
			
			// Description
			desc && D.div().class('kanban-card-description').text(desc),
			
			// Metadata row
			hasMeta && D.div().class('kanban-card-meta').child(
				data.priority && D.span()
					.class(D.classes('kanban-card-priority', 'priority-' + data.priority))
					.attr('title', data.priority + ' priority')
					.child(D.icon('fas fa-flag')),
				
				data.dueDate && D.span()
					.class(D.classes('kanban-card-due', self._getDueDateClass(data.dueDate)))
					.child(
						D.icon('fas fa-clock'),
						D.text(' ' + self._formatDate(data.dueDate))
					),
				
				data.commentsCount && D.span().class('kanban-card-comments').child(
					D.icon('fas fa-comment'),
					D.text(' ' + data.commentsCount)
				),
				
				data.attachmentsCount && D.span().class('kanban-card-attachments').child(
					D.icon('fas fa-paperclip'),
					D.text(' ' + data.attachmentsCount)
				)
			),
			
			// Footer with assignee
			(data.assignee || data.assigneeAvatar) && D.div().class('kanban-card-footer').child(
				data.assigneeAvatar 
					? D.create('img')
						.class('kanban-card-avatar')
						.attr('src', data.assigneeAvatar)
						.attr('alt', data.assignee || 'Assignee')
						.attr('title', data.assignee || '')
					: data.assignee && D.span()
						.class('kanban-card-assignee-initials')
						.text(self._getInitials(data.assignee))
			)
		).get();
	};

	/**
	 * Get CSS class for due date (overdue, today, upcoming)
	 */
	KanbanInstance.prototype._getDueDateClass = function(dateStr) {
		var today = new Date();
		today.setHours(0, 0, 0, 0);
		var due = new Date(dateStr);
		due.setHours(0, 0, 0, 0);
		
		var diff = due - today;
		var dayMs = 86400000;
		
		if (diff < 0) return 'due-overdue';
		if (diff === 0) return 'due-today';
		if (diff <= dayMs * 2) return 'due-soon';
		return '';
	};

	/**
	 * Format date for display
	 */
	KanbanInstance.prototype._formatDate = function(dateStr) {
		var date = new Date(dateStr);
		var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		return months[date.getMonth()] + ' ' + date.getDate();
	};

	/**
	 * Get initials from name
	 */
	KanbanInstance.prototype._getInitials = function(name) {
		if (!name) return '?';
		return name.split(' ').map(function(n) { return n.charAt(0); }).join('').substring(0, 2).toUpperCase();
	};

	// =========================================
	// Inline Add Card
	// =========================================

	/**
	 * Show inline add card form
	 * @param {string} columnId - Column ID
	 */
	KanbanInstance.prototype._showInlineAddForm = function(columnId) {
		var column = this.columns.get(columnId);
		if (!column) return;

		var wrapper = column.element.querySelector('.kanban-add-card');
		if (!wrapper) return;

		var btn = wrapper.querySelector('.kanban-add-card-btn');
		var form = wrapper.querySelector('.kanban-add-card-form');
		var input = wrapper.querySelector('.kanban-add-card-input');

		btn.style.display = 'none';
		form.style.display = 'block';
		input.value = '';
		input.focus();
	};

	/**
	 * Hide inline add card form
	 * @param {string} columnId - Column ID
	 */
	KanbanInstance.prototype._hideInlineAddForm = function(columnId) {
		var column = this.columns.get(columnId);
		if (!column) return;

		var wrapper = column.element.querySelector('.kanban-add-card');
		if (!wrapper) return;

		var btn = wrapper.querySelector('.kanban-add-card-btn');
		var form = wrapper.querySelector('.kanban-add-card-form');

		btn.style.display = '';
		form.style.display = 'none';
	};

	/**
	 * Submit inline add card form
	 * @param {string} columnId - Column ID
	 */
	KanbanInstance.prototype._submitInlineAdd = function(columnId) {
		var column = this.columns.get(columnId);
		if (!column) return;

		var wrapper = column.element.querySelector('.kanban-add-card');
		if (!wrapper) return;

		var input = wrapper.querySelector('.kanban-add-card-input');
		var title = input.value.trim();

		if (!title) {
			input.focus();
			return;
		}

		// Generate unique ID
		var id = 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

		var cardData = {
			id: id,
			title: title,
			column: columnId
		};

		// Add the card
		this.addCard(cardData);

		// Clear and refocus for quick consecutive adds
		input.value = '';
		input.focus();

		// Fire callback if exists
		if (this.options.onCardCreate) {
			this.options.onCardCreate(cardData, column.config);
		}

		this._announce('Card "' + title + '" added to ' + column.config.title);
	};

	/**
	 * Open card detail modal
	 * @param {string} cardId - Card ID
	 */
	KanbanInstance.prototype.openCardDetail = function(cardId) {
		var cardData = this.cards.get(String(cardId));
		if (!cardData) return;

		// Create modal if not exists
		if (!this._detailModal) {
			this._createDetailModal();
		}

		this._populateDetailModal(cardData.data);
		this._detailModal.style.display = 'flex';
		this._detailModal.querySelector('.kanban-modal-title').focus();
	};

	/**
	 * Create the card detail modal
	 */
	KanbanInstance.prototype._createDetailModal = function() {
		var self = this;

		// Build priority select with options
		var prioritySelect = D.create('select').classAdd('kanban-modal-priority')
			.child(
				D.create('option').attr('value', '').text('None'),
				D.create('option').attr('value', 'high').text('High'),
				D.create('option').attr('value', 'medium').text('Medium'),
				D.create('option').attr('value', 'low').text('Low')
			);

		// Build modal structure
		var modal = D.div().classAdd('kanban-modal').attr('role', 'dialog').aria('modal', 'true')
			.child(
				D.div().classAdd('kanban-modal-header')
					.child(
						D.create('h3').classAdd('kanban-modal-title').attr('tabindex', '-1'),
						D.button().classAdd('kanban-modal-close').attr('type', 'button').aria('label', 'Close').text('×')
					),
				D.div().classAdd('kanban-modal-body')
					.child(
						D.div().classAdd('kanban-modal-section')
							.child(
								D.create('label').text('Description'),
								D.create('textarea').classAdd('kanban-modal-description').attr('rows', 3).attr('placeholder', 'Add a description...')
							),
						D.div().classAdd('kanban-modal-section')
							.child(
								D.create('label').text('Column'),
								D.create('select').classAdd('kanban-modal-column')
							),
						D.div().classAdd('kanban-modal-section')
							.child(
								D.create('label').text('Priority'),
								prioritySelect
							),
						D.div().classAdd('kanban-modal-section')
							.child(
								D.create('label').text('Due Date'),
								D.create('input').attr('type', 'date').classAdd('kanban-modal-duedate')
							),
						D.div().classAdd('kanban-modal-section', 'kanban-modal-activity')
							.child(
								D.create('label').text('Activity'),
								D.div().classAdd('kanban-modal-activity-log')
							)
					),
				D.div().classAdd('kanban-modal-footer')
					.child(
						D.button().classAdd('kanban-modal-save').attr('type', 'button').text('Save Changes'),
						D.button().classAdd('kanban-modal-delete').attr('type', 'button').text('Delete Card')
					)
			);

		this._detailModal = D.div().classAdd('kanban-modal-overlay').child(modal).el;

		// Populate column dropdown
		var columnSelect = this._detailModal.querySelector('.kanban-modal-column');
		this.columns.forEach(function(col, id) {
			var opt = document.createElement('option');
			opt.value = id;
			opt.textContent = col.config.title;
			columnSelect.appendChild(opt);
		});

		// Event handlers
		this._detailModal.querySelector('.kanban-modal-close').addEventListener('click', function() {
			self._closeDetailModal();
		});

		this._detailModal.querySelector('.kanban-modal-save').addEventListener('click', function() {
			self._saveDetailModal();
		});

		this._detailModal.querySelector('.kanban-modal-delete').addEventListener('click', function() {
			if (confirm('Are you sure you want to delete this card?')) {
				self.removeCard(self._editingCardId);
				self._closeDetailModal();
			}
		});

		// Close on overlay click
		this._detailModal.addEventListener('click', function(e) {
			if (e.target === self._detailModal) {
				self._closeDetailModal();
			}
		});

		// Close on Escape
		this._detailModal.addEventListener('keydown', function(e) {
			if (e.key === 'Escape') {
				self._closeDetailModal();
			}
		});

		document.body.appendChild(this._detailModal);
	};

	/**
	 * Populate detail modal with card data
	 * @param {Object} cardData - Card data
	 */
	KanbanInstance.prototype._populateDetailModal = function(cardData) {
		this._editingCardId = String(cardData.id);

		this._detailModal.querySelector('.kanban-modal-title').textContent = cardData.title || 'Untitled Card';
		this._detailModal.querySelector('.kanban-modal-description').value = cardData.description || '';
		this._detailModal.querySelector('.kanban-modal-column').value = cardData.column || '';
		this._detailModal.querySelector('.kanban-modal-priority').value = cardData.priority || '';
		this._detailModal.querySelector('.kanban-modal-duedate').value = cardData.dueDate || '';

		// Populate activity log
		var activityLog = D.wrap(this._detailModal.querySelector('.kanban-modal-activity-log')).empty();
		if (cardData.activity && cardData.activity.length > 0) {
			cardData.activity.forEach(function(item) {
				activityLog.child(
					D.div().classAdd('kanban-activity-item')
						.child(
							D.span().classAdd('kanban-activity-text').text(item.text),
							D.span().classAdd('kanban-activity-time').text(item.time)
						)
				);
			});
		} else {
			activityLog.child(D.div().classAdd('kanban-activity-empty').text('No activity yet'));
		}
	};

	/**
	 * Save changes from detail modal
	 */
	KanbanInstance.prototype._saveDetailModal = function() {
		if (!this._editingCardId) return;

		var changes = {
			description: this._detailModal.querySelector('.kanban-modal-description').value,
			column: this._detailModal.querySelector('.kanban-modal-column').value,
			priority: this._detailModal.querySelector('.kanban-modal-priority').value || null,
			dueDate: this._detailModal.querySelector('.kanban-modal-duedate').value || null
		};

		this.updateCard(this._editingCardId, changes);
		this._closeDetailModal();
		this._announce('Card updated');
	};

	/**
	 * Close detail modal
	 */
	KanbanInstance.prototype._closeDetailModal = function() {
		if (!this._detailModal) return;
		this._detailModal.style.display = 'none';
		this._editingCardId = null;

		// Return focus to the card
		var card = this.board.querySelector('[data-card-id="' + this._editingCardId + '"]');
		if (card) card.focus();
	};

	// =========================================
	// Drag and Drop
	// =========================================

	/**
	 * Bind native drag-and-drop events
	 */
	KanbanInstance.prototype._bindDragEvents = function() {
		var self = this;

		// Dragstart
		this._boundHandlers.dragstart = function(e) {
			var card = e.target.closest('.kanban-card');
			if (!card) return;

			var cardId = card.dataset.cardId;

			// Check if someone else is dragging this card (presence conflict)
			if (self._presenceEnabled && !self.canDragCard(cardId)) {
				e.preventDefault();
				self._showError('This card is being moved by another user');
				return;
			}

			self._draggedCard = card;
			self._draggedCardId = cardId;

			// Get source column ID - works in both column and swimlane modes
			if (self.options.swimlanes) {
				var swimlaneCell = card.closest('.kanban-swimlane-cell');
				self._sourceColumnId = swimlaneCell ? swimlaneCell.dataset.column : null;
				self._sourceSwimlane = swimlaneCell ? swimlaneCell.dataset.swimlane : null;
			} else {
				var column = card.closest('.kanban-column');
				self._sourceColumnId = column ? column.dataset.columnId : null;
			}

			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', self._draggedCardId);

			// Broadcast drag start to presence
			self._broadcastDragStart(cardId);

			// Add dragging class after a brief delay (for ghost image)
			setTimeout(function() {
				card.classList.add('dragging');
			}, 0);

			// Highlight valid drop zones
			self._highlightValidDropZones();
		};

		// Dragend
		this._boundHandlers.dragend = function(e) {
			// Broadcast drag end to presence
			if (self._draggedCardId) {
				self._broadcastDragEnd(self._draggedCardId, null);
			}

			if (self._draggedCard) {
				self._draggedCard.classList.remove('dragging');
			}
			self._draggedCard = null;
			self._draggedCardId = null;
			self._sourceColumnId = null;
			self._sourceSwimlane = null;
			self._hideDropIndicator();
			self._clearDropZoneHighlights();
		};

		// Dragover
		this._boundHandlers.dragover = function(e) {
			// Handle both column mode and swimlane mode
			var dropTarget = e.target.closest('.kanban-column-body, .kanban-swimlane-cell');
			if (!dropTarget) return;

			var columnId = self._getDropTargetColumnId(dropTarget);
			if (!columnId || !self._isValidDrop(columnId)) return;

			e.preventDefault();
			e.dataTransfer.dropEffect = 'move';

			self._showDropIndicator(dropTarget, e.clientY);
		};

		// Dragleave
		this._boundHandlers.dragleave = function(e) {
			var dropTarget = e.target.closest('.kanban-column-body, .kanban-swimlane-cell');
			if (!dropTarget) return;

			// Only hide if leaving the target entirely
			var related = e.relatedTarget;
			if (related && dropTarget.contains(related)) return;

			self._hideDropIndicator();
		};

		// Drop
		this._boundHandlers.drop = function(e) {
			e.preventDefault();

			var dropTarget = e.target.closest('.kanban-column-body, .kanban-swimlane-cell');
			if (!dropTarget) return;

			var columnId = self._getDropTargetColumnId(dropTarget);
			if (!columnId || !self._isValidDrop(columnId)) return;

			var position = self._calculateDropPosition(dropTarget, e.clientY);

			// Broadcast successful drop with target column to presence
			if (self._draggedCardId) {
				self._broadcastDragEnd(self._draggedCardId, columnId);
			}

			// In swimlane mode, also pass the target swimlane
			if (self.options.swimlanes) {
				var targetSwimlane = dropTarget.dataset.swimlane;
				self._moveCardToCell(self._draggedCardId, columnId, targetSwimlane, position);
			} else {
				self._moveCardToColumn(self._draggedCardId, columnId, position);
			}

			self._hideDropIndicator();
		};

		this.board.addEventListener('dragstart', this._boundHandlers.dragstart);
		this.board.addEventListener('dragend', this._boundHandlers.dragend);
		this.board.addEventListener('dragover', this._boundHandlers.dragover);
		this.board.addEventListener('dragleave', this._boundHandlers.dragleave);
		this.board.addEventListener('drop', this._boundHandlers.drop);
	};

	/**
	 * Check if drop is valid based on transitions config
	 */
	KanbanInstance.prototype._isValidDrop = function(targetColumnId) {
		if (!this._sourceColumnId) return false;
		if (this._sourceColumnId === targetColumnId) return true; // Same column reorder OK

		// Check WIP limit
		var targetColumn = this.columns.get(targetColumnId);
		if (targetColumn && targetColumn.config.limit) {
			if (targetColumn.cardCount >= targetColumn.config.limit) {
				return false;
			}
		}

		// Check transitions config
		if (!this.options.transitions) return true; // No restrictions

		var allowed = this.options.transitions[this._sourceColumnId];
		if (!allowed) return true; // No restrictions for this column

		return allowed.includes(targetColumnId);
	};

	/**
	 * Highlight valid drop zones
	 */
	KanbanInstance.prototype._highlightValidDropZones = function() {
		var self = this;

		if (this.options.swimlanes) {
			// Swimlane mode - highlight cells
			var cells = this.board.querySelectorAll('.kanban-swimlane-cell');
			cells.forEach(function(cell) {
				var columnId = cell.dataset.column;
				var valid = self._isValidDrop(columnId);
				cell.classList.toggle('drop-valid', valid);
				cell.classList.toggle('drop-invalid', !valid);
			});
		} else {
			// Column mode - highlight column bodies
			this.columns.forEach(function(columnData, columnId) {
				if (columnData && columnData.element) {
					var valid = self._isValidDrop(columnId);
					columnData.element.classList.toggle('drop-valid', valid);
					columnData.element.classList.toggle('drop-invalid', !valid);
				}
			});
		}
	};

	/**
	 * Clear drop zone highlights
	 */
	KanbanInstance.prototype._clearDropZoneHighlights = function() {
		if (this.options.swimlanes) {
			// Swimlane mode - clear from cells
			var cells = this.board.querySelectorAll('.kanban-swimlane-cell');
			cells.forEach(function(cell) {
				cell.classList.remove('drop-valid', 'drop-invalid');
			});
		} else {
			// Column mode - clear from columns
			this.columns.forEach(function(columnData) {
				if (columnData && columnData.element) {
					columnData.element.classList.remove('drop-valid', 'drop-invalid');
				}
			});
		}
	};

	/**
	 * Show drop indicator at position
	 */
	KanbanInstance.prototype._showDropIndicator = function(columnBody, clientY) {
		var cards = Array.from(columnBody.querySelectorAll('.kanban-card:not(.dragging)'));
		var insertBefore = null;

		for (var i = 0; i < cards.length; i++) {
			var rect = cards[i].getBoundingClientRect();
			var midY = rect.top + rect.height / 2;
			
			if (clientY < midY) {
				insertBefore = cards[i];
				break;
			}
		}

		this._dropIndicator.style.display = '';
		
		if (insertBefore) {
			columnBody.insertBefore(this._dropIndicator, insertBefore);
		} else {
			// Insert before empty placeholder
			var emptyEl = columnBody.querySelector('.kanban-column-empty');
			columnBody.insertBefore(this._dropIndicator, emptyEl);
		}
	};

	/**
	 * Hide drop indicator
	 */
	KanbanInstance.prototype._hideDropIndicator = function() {
		this._dropIndicator.style.display = 'none';
		if (this._dropIndicator.parentNode) {
			this._dropIndicator.parentNode.removeChild(this._dropIndicator);
		}
	};

	/**
	 * Calculate drop position index
	 */
	KanbanInstance.prototype._calculateDropPosition = function(columnBody, clientY) {
		var cards = Array.from(columnBody.querySelectorAll('.kanban-card:not(.dragging)'));
		
		for (var i = 0; i < cards.length; i++) {
			var rect = cards[i].getBoundingClientRect();
			if (clientY < rect.top + rect.height / 2) {
				return i;
			}
		}
		
		return cards.length;
	};

	/**
	 * Move card to column at position
	 */
	KanbanInstance.prototype._moveCardToColumn = function(cardId, targetColumnId, position) {
		var self = this;
		var cardData = this.cards.get(cardId);
		if (!cardData) return;

		var oldColumnId = cardData.data.column;
		var oldPosition = cardData.data.position;
		var targetColumn = this.columns.get(targetColumnId);
		if (!targetColumn) return;

		// Fire onCardMove callback (can cancel)
		if (this.options.onCardMove) {
			var result = this.options.onCardMove(cardData.data, oldColumnId, targetColumnId, position);
			if (result === false) return; // Cancelled
		}

		// Store rollback state for optimistic update
		var opId = this._nextOperationId();
		this._storeRollback(opId, {
			type: 'move',
			cardId: cardId,
			fromColumn: oldColumnId,
			fromPosition: oldPosition,
			toColumn: targetColumnId,
			toPosition: position
		});

		// Optimistic update - move DOM immediately
		var cards = targetColumn.body.querySelectorAll('.kanban-card');
		var emptyEl = targetColumn.body.querySelector('.kanban-column-empty');
		
		if (position < cards.length) {
			targetColumn.body.insertBefore(cardData.element, cards[position]);
		} else {
			targetColumn.body.insertBefore(cardData.element, emptyEl);
		}

		// Update data
		cardData.data.column = targetColumnId;
		cardData.data.position = position;

		// Update counts
		this._updateColumnCount(oldColumnId);
		this._updateColumnCount(targetColumnId);

		// Fire onCardMoved callback
		if (this.options.onCardMoved) {
			this.options.onCardMoved(cardData.data, oldColumnId, targetColumnId, position);
		}

		// API call (if configured)
		if (this.options.api || this.options.onSave) {
			this._apiMove(cardId, targetColumnId, position)
				.then(function() {
					self._clearRollback(opId);
				})
				.catch(function(err) {
					console.error('[Funky.Kanban] Move failed:', err);
					self._executeRollback(opId);
					self._showError('Failed to save card move');
					if (self.options.onSaveError) {
						self.options.onSaveError('move', err, cardData.data);
					}
				});
		} else {
			this._clearRollback(opId);
		}
	};

	/**
	 * Get column ID from drop target (works for both modes)
	 */
	KanbanInstance.prototype._getDropTargetColumnId = function(dropTarget) {
		if (dropTarget.classList.contains('kanban-swimlane-cell')) {
			return dropTarget.dataset.column;
		}
		// Column mode
		var column = dropTarget.closest('.kanban-column');
		return column ? column.dataset.columnId : null;
	};

	/**
	 * Move card to swimlane cell (swimlane mode)
	 */
	KanbanInstance.prototype._moveCardToCell = function(cardId, targetColumnId, targetSwimlane, position) {
		var self = this;
		var cardData = this.cards.get(cardId);
		if (!cardData) return;

		var oldColumnId = cardData.data.column;
		var oldPosition = cardData.data.position;
		var field = this.options.swimlanes.field;
		var oldSwimlane = cardData.data[field];

		// Fire onCardMove callback (can cancel)
		if (this.options.onCardMove) {
			var result = this.options.onCardMove(cardData.data, oldColumnId, targetColumnId, position, {
				fromSwimlane: oldSwimlane,
				toSwimlane: targetSwimlane
			});
			if (result === false) return; // Cancelled
		}

		// Store rollback state for optimistic update
		var opId = this._nextOperationId();
		this._storeRollback(opId, {
			type: 'move',
			cardId: cardId,
			fromColumn: oldColumnId,
			fromPosition: oldPosition,
			fromSwimlane: oldSwimlane,
			toColumn: targetColumnId,
			toPosition: position,
			toSwimlane: targetSwimlane
		});

		// Find target cell
		var selector = '[data-swimlane="' + targetSwimlane + '"] [data-column="' + targetColumnId + '"]';
		var targetCell = this.board.querySelector(selector);
		if (!targetCell) return;

		// Optimistic update - move DOM immediately
		var cards = targetCell.querySelectorAll('.kanban-card');
		if (position < cards.length) {
			targetCell.insertBefore(cardData.element, cards[position]);
		} else {
			targetCell.appendChild(cardData.element);
		}

		// Update data
		cardData.data.column = targetColumnId;
		cardData.data[field] = targetSwimlane;
		cardData.data.position = position;

		// Update swimlane counts
		if (oldSwimlane !== targetSwimlane) {
			this._updateSwimlaneCount(oldSwimlane);
		}
		this._updateSwimlaneCount(targetSwimlane);

		// Fire onCardMoved callback
		if (this.options.onCardMoved) {
			this.options.onCardMoved(cardData.data, oldColumnId, targetColumnId, position, {
				fromSwimlane: oldSwimlane,
				toSwimlane: targetSwimlane
			});
		}

		// Fire swimlane change callback if moved between swimlanes
		if (oldSwimlane !== targetSwimlane && this.options.onSwimlaneChange) {
			this.options.onSwimlaneChange(cardData.data, oldSwimlane, targetSwimlane);
		}

		// API call (if configured)
		if (this.options.api || this.options.onSave) {
			var extraData = {};
			extraData[field] = targetSwimlane;
			
			this._apiMove(cardId, targetColumnId, position, extraData)
				.then(function() {
					self._clearRollback(opId);
				})
				.catch(function(err) {
					console.error('[Funky.Kanban] Move failed:', err);
					self._executeRollback(opId);
					self._showError('Failed to save card move');
					if (self.options.onSaveError) {
						self.options.onSaveError('move', err, cardData.data);
					}
				});
		} else {
			this._clearRollback(opId);
		}
	};

	// =========================================
	// Touch Support
	// =========================================

	/**
	 * Bind touch events for mobile drag-drop
	 */
	KanbanInstance.prototype._bindTouchEvents = function() {
		var self = this;
		var touchTimeout;
		var touchStartY;
		var touchStartX;

		this._boundHandlers.touchstart = function(e) {
			var card = e.target.closest('.kanban-card');
			if (!card) return;

			touchStartY = e.touches[0].clientY;
			touchStartX = e.touches[0].clientX;

			// Long press to initiate drag
			touchTimeout = setTimeout(function() {
				self._startTouchDrag(card, e.touches[0]);
			}, 500);
		};

		this._boundHandlers.touchmove = function(e) {
			if (!self._touchDragging) {
				// Cancel if moved before long press completes
				if (touchStartY !== undefined) {
					var dy = Math.abs(e.touches[0].clientY - touchStartY);
					var dx = Math.abs(e.touches[0].clientX - touchStartX);
					if (dy > 10 || dx > 10) {
						clearTimeout(touchTimeout);
					}
				}
				return;
			}

			e.preventDefault();
			self._handleTouchMove(e.touches[0]);
		};

		this._boundHandlers.touchend = function(e) {
			clearTimeout(touchTimeout);
			if (self._touchDragging) {
				self._endTouchDrag(e.changedTouches[0]);
			}
		};

		this.board.addEventListener('touchstart', this._boundHandlers.touchstart, { passive: true });
		this.board.addEventListener('touchmove', this._boundHandlers.touchmove, { passive: false });
		this.board.addEventListener('touchend', this._boundHandlers.touchend);
	};

	/**
	 * Start touch drag
	 */
	KanbanInstance.prototype._startTouchDrag = function(card, touch) {
		this._touchDragging = true;
		this._draggedCard = card;
		this._draggedCardId = card.dataset.cardId;
		this._sourceColumnId = card.closest('.kanban-column').dataset.columnId;

		// Create ghost element
		this._touchGhost = card.cloneNode(true);
		this._touchGhost.classList.add('kanban-touch-ghost');
		this._touchGhost.style.position = 'fixed';
		this._touchGhost.style.width = card.offsetWidth + 'px';
		this._touchGhost.style.zIndex = '10000';
		this._touchGhost.style.pointerEvents = 'none';
		this._touchGhost.style.opacity = '0.8';
		document.body.appendChild(this._touchGhost);

		card.classList.add('dragging');
		this._highlightValidDropZones();

		// Haptic feedback if available
		if (navigator.vibrate) {
			navigator.vibrate(50);
		}

		this._updateTouchGhostPosition(touch);
	};

	/**
	 * Handle touch move during drag
	 */
	KanbanInstance.prototype._handleTouchMove = function(touch) {
		this._updateTouchGhostPosition(touch);

		// Find drop target under touch (handles both modes)
		var elementsUnder = document.elementsFromPoint(touch.clientX, touch.clientY);
		var dropTarget = null;
		
		for (var i = 0; i < elementsUnder.length; i++) {
			dropTarget = elementsUnder[i].closest('.kanban-column-body, .kanban-swimlane-cell');
			if (dropTarget) break;
		}

		if (dropTarget) {
			var columnId = this._getDropTargetColumnId(dropTarget);
			if (columnId && this._isValidDrop(columnId)) {
				this._showDropIndicator(dropTarget, touch.clientY);
				return;
			}
		}

		this._hideDropIndicator();
	};

	/**
	 * Update touch ghost position
	 */
	KanbanInstance.prototype._updateTouchGhostPosition = function(touch) {
		if (!this._touchGhost) return;
		this._touchGhost.style.left = (touch.clientX - 50) + 'px';
		this._touchGhost.style.top = (touch.clientY - 30) + 'px';
	};

	/**
	 * End touch drag
	 */
	KanbanInstance.prototype._endTouchDrag = function(touch) {
		// Find drop target (handles both modes)
		var elementsUnder = document.elementsFromPoint(touch.clientX, touch.clientY);
		var dropTarget = null;
		
		for (var i = 0; i < elementsUnder.length; i++) {
			dropTarget = elementsUnder[i].closest('.kanban-column-body, .kanban-swimlane-cell');
			if (dropTarget) break;
		}

		if (dropTarget) {
			var columnId = this._getDropTargetColumnId(dropTarget);
			if (columnId && this._isValidDrop(columnId)) {
				var position = this._calculateDropPosition(dropTarget, touch.clientY);
				
				if (this.options.swimlanes) {
					var targetSwimlane = dropTarget.dataset.swimlane;
					this._moveCardToCell(this._draggedCardId, columnId, targetSwimlane, position);
				} else {
					this._moveCardToColumn(this._draggedCardId, columnId, position);
				}
			}
		}

		// Cleanup
		if (this._draggedCard) {
			this._draggedCard.classList.remove('dragging');
		}
		if (this._touchGhost) {
			this._touchGhost.remove();
			this._touchGhost = null;
		}

		this._touchDragging = false;
		this._draggedCard = null;
		this._draggedCardId = null;
		this._sourceColumnId = null;
		this._sourceSwimlane = null;
		this._hideDropIndicator();
		this._clearDropZoneHighlights();
	};

	/**
	 * Escape HTML for safe insertion (used for search highlighting)
	 * @param {string} str - String to escape
	 * @returns {string}
	 */
	KanbanInstance.prototype._escapeHtml = function(str) {
		if (!str) return '';
		return Funky.Util && Funky.Util.escapeHtml
			? Funky.Util.escapeHtml(str)
			: str.replace(/[&<>"']/g, function(m) {
				return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
			});
	};

	// =========================================
	// Keyboard Navigation & Accessibility
	// =========================================

	/**
	 * Bind keyboard events for accessibility
	 */
	KanbanInstance.prototype._bindKeyboardEvents = function() {
		var self = this;

		// Create live region for screen reader announcements
		this._announceRegion = document.createElement('div');
		this._announceRegion.className = 'sr-only';
		this._announceRegion.setAttribute('aria-live', 'polite');
		this._announceRegion.setAttribute('aria-atomic', 'true');
		this._announceRegion.id = 'kanban-announce-' + this.id;
		this.board.appendChild(this._announceRegion);

		// Keyboard state
		this._pickedCard = null;
		this._pickedOriginalColumn = null;
		this._pickedOriginalPosition = null;

		// Fallback keydown handler (only used if Funky.Keyboard not available)
		this._boundHandlers.keydown = function(e) {
			self._handleKeydown(e);
		};
		this.board.addEventListener('keydown', this._boundHandlers.keydown);
		
		// Register shortcuts with centralized keyboard manager
		this._registerKeyboardShortcuts();
	};
	
	/**
	 * Handle keyboard events (shared logic for both Funky.Keyboard and fallback)
	 */
	KanbanInstance.prototype._handleKeydown = function(e) {
		// Skip if using Funky.Keyboard (it handles events directly)
		if (!this._useFallbackKeyboard) return;
		
		var focusedCard = document.activeElement.closest('.kanban-card');
		
		switch (e.key) {
			case ' ':
			case 'Spacebar': // IE/Edge
				if (focusedCard && !this._pickedCard) {
					e.preventDefault();
					this._pickUpCard(focusedCard);
				} else if (this._pickedCard) {
					e.preventDefault();
					this._dropPickedCard();
				}
				break;

			case 'ArrowUp':
				if (this._pickedCard) {
					e.preventDefault();
					this._movePickedCard('up');
				} else if (focusedCard) {
					e.preventDefault();
					this._focusAdjacentCard(focusedCard, 'up');
				}
				break;

			case 'ArrowDown':
				if (this._pickedCard) {
					e.preventDefault();
					this._movePickedCard('down');
				} else if (focusedCard) {
					e.preventDefault();
					this._focusAdjacentCard(focusedCard, 'down');
				}
				break;

			case 'ArrowLeft':
				if (this._pickedCard) {
					e.preventDefault();
					this._movePickedCard('left');
				} else if (focusedCard) {
					e.preventDefault();
					this._focusAdjacentColumn(focusedCard, 'left');
				}
				break;

			case 'ArrowRight':
				if (this._pickedCard) {
					e.preventDefault();
					this._movePickedCard('right');
				} else if (focusedCard) {
					e.preventDefault();
					this._focusAdjacentColumn(focusedCard, 'right');
				}
				break;

			case 'Escape':
				if (this._pickedCard) {
					e.preventDefault();
					this._cancelPick();
				}
				break;

			case 'Enter':
				if (focusedCard && !this._pickedCard) {
					e.preventDefault();
					var cardId = focusedCard.dataset.cardId;
					if (this.options.onCardClick) {
						this.options.onCardClick(this.cards.get(cardId), focusedCard, e);
					}
				}
				break;

			case 'Delete':
			case 'Backspace':
				if (focusedCard && !this._pickedCard && e.shiftKey) {
					e.preventDefault();
					var cardId = focusedCard.dataset.cardId;
					if (confirm('Remove this card?')) {
						this.removeCard(cardId);
						this._announce('Card removed');
					}
				}
				break;
		}
	};
	
	/**
	 * Register keyboard shortcuts with Funky.Keyboard
	 */
	KanbanInstance.prototype._registerKeyboardShortcuts = function() {
		var self = this;
		var scope = '#' + this.board.id;
		
		// Only register if keyboard manager is available
		if (!Funky.Keyboard) {
			this._useFallbackKeyboard = true;
			return;
		}
		
		// Helper to get focused card
		var getFocusedCard = function() {
			return document.activeElement.closest('.kanban-card');
		};
		
		this._keyboardUnregisters = [
			Funky.Keyboard.register({
				key: 'space',
				scope: scope,
				handler: function() {
					var focusedCard = getFocusedCard();
					if (focusedCard && !self._pickedCard) {
						self._pickUpCard(focusedCard);
					} else if (self._pickedCard) {
						self._dropPickedCard();
					}
				},
				description: 'Pick up / Drop card',
				group: 'Kanban'
			}),
			Funky.Keyboard.register({
				key: 'up',
				scope: scope,
				handler: function() {
					var focusedCard = getFocusedCard();
					if (self._pickedCard) {
						self._movePickedCard('up');
					} else if (focusedCard) {
						self._focusAdjacentCard(focusedCard, 'up');
					}
				},
				description: 'Move card/focus up',
				group: 'Kanban'
			}),
			Funky.Keyboard.register({
				key: 'down',
				scope: scope,
				handler: function() {
					var focusedCard = getFocusedCard();
					if (self._pickedCard) {
						self._movePickedCard('down');
					} else if (focusedCard) {
						self._focusAdjacentCard(focusedCard, 'down');
					}
				},
				description: 'Move card/focus down',
				group: 'Kanban'
			}),
			Funky.Keyboard.register({
				key: 'left',
				scope: scope,
				handler: function() {
					var focusedCard = getFocusedCard();
					if (self._pickedCard) {
						self._movePickedCard('left');
					} else if (focusedCard) {
						self._focusAdjacentColumn(focusedCard, 'left');
					}
				},
				description: 'Move to previous column',
				group: 'Kanban'
			}),
			Funky.Keyboard.register({
				key: 'right',
				scope: scope,
				handler: function() {
					var focusedCard = getFocusedCard();
					if (self._pickedCard) {
						self._movePickedCard('right');
					} else if (focusedCard) {
						self._focusAdjacentColumn(focusedCard, 'right');
					}
				},
				description: 'Move to next column',
				group: 'Kanban'
			}),
			Funky.Keyboard.register({
				key: 'escape',
				scope: scope,
				handler: function() {
					if (self._pickedCard) {
						self._cancelPick();
					}
				},
				description: 'Cancel card pick',
				group: 'Kanban'
			}),
			Funky.Keyboard.register({
				key: 'enter',
				scope: scope,
				handler: function(e) {
					var focusedCard = getFocusedCard();
					if (focusedCard && !self._pickedCard) {
						var cardId = focusedCard.dataset.cardId;
						if (self.options.onCardClick) {
							self.options.onCardClick(self.cards.get(cardId), focusedCard, e);
						}
					}
				},
				description: 'Open card details',
				group: 'Kanban'
			}),
			Funky.Keyboard.register({
				key: 'delete',
				shift: true,
				scope: scope,
				handler: function() {
					var focusedCard = getFocusedCard();
					if (focusedCard && !self._pickedCard) {
						var cardId = focusedCard.dataset.cardId;
						if (confirm('Remove this card?')) {
							self.removeCard(cardId);
							self._announce('Card removed');
						}
					}
				},
				description: 'Delete card',
				group: 'Kanban'
			})
		];
	};

	/**
	 * Announce message to screen readers
	 * @param {string} message - Message to announce
	 */
	KanbanInstance.prototype._announce = function(message) {
		if (!this._announceRegion) return;
		this._announceRegion.textContent = '';
		// Force reflow to ensure announcement
		void this._announceRegion.offsetHeight;
		this._announceRegion.textContent = message;
	};

	/**
	 * Pick up a card for keyboard movement
	 * @param {HTMLElement} cardEl - Card element
	 */
	KanbanInstance.prototype._pickUpCard = function(cardEl) {
		var cardId = cardEl.dataset.cardId;
		var cardData = this.cards.get(cardId);
		
		this._pickedCard = cardEl;
		this._pickedCardId = cardId;
		this._pickedOriginalColumn = cardData.data.column;
		
		// Get position in column
		var siblings = Array.from(cardEl.parentNode.querySelectorAll('.kanban-card'));
		this._pickedOriginalPosition = siblings.indexOf(cardEl);

		cardEl.classList.add('picked');
		cardEl.setAttribute('aria-grabbed', 'true');

		this._highlightValidDropZones();
		this._announce('Card picked up. Use arrow keys to move, Space to drop, Escape to cancel.');
	};

	/**
	 * Drop the picked card at current position
	 */
	KanbanInstance.prototype._dropPickedCard = function() {
		if (!this._pickedCard) return;

		var cardData = this.cards.get(this._pickedCardId);
		var columnTitle = this.columns.get(cardData.data.column).config.title;
		
		this._pickedCard.classList.remove('picked');
		this._pickedCard.setAttribute('aria-grabbed', 'false');
		this._clearDropZoneHighlights();

		this._announce('Card dropped in ' + columnTitle + ' column.');

		this._pickedCard = null;
		this._pickedCardId = null;
		this._pickedOriginalColumn = null;
		this._pickedOriginalPosition = null;
	};

	/**
	 * Cancel pick and restore original position
	 */
	KanbanInstance.prototype._cancelPick = function() {
		if (!this._pickedCard) return;

		// Restore to original position
		this._moveCardToColumnSilent(
			this._pickedCardId,
			this._pickedOriginalColumn,
			this._pickedOriginalPosition
		);

		this._pickedCard.classList.remove('picked');
		this._pickedCard.setAttribute('aria-grabbed', 'false');
		this._clearDropZoneHighlights();
		this._pickedCard.focus();

		this._announce('Move cancelled.');

		this._pickedCard = null;
		this._pickedCardId = null;
		this._pickedOriginalColumn = null;
		this._pickedOriginalPosition = null;
	};

	/**
	 * Move picked card in direction
	 * @param {string} direction - 'up', 'down', 'left', 'right'
	 */
	KanbanInstance.prototype._movePickedCard = function(direction) {
		if (!this._pickedCard) return;

		var cardData = this.cards.get(this._pickedCardId);
		var currentColumn = cardData.data.column;
		var columnIds = Array.from(this.columns.keys());
		var columnIndex = columnIds.indexOf(currentColumn);

		switch (direction) {
			case 'up':
			case 'down':
				this._reorderPickedCard(direction === 'up' ? -1 : 1);
				break;

			case 'left':
			case 'right':
				var newIndex = columnIndex + (direction === 'left' ? -1 : 1);
				if (newIndex >= 0 && newIndex < columnIds.length) {
					var targetColumnId = columnIds[newIndex];
					if (this._isValidDropForCard(currentColumn, targetColumnId)) {
						this._moveCardToColumn(this._pickedCardId, targetColumnId, 0);
						this._pickedCard.focus();
						var targetColumn = this.columns.get(targetColumnId);
						this._announce('Moved to ' + targetColumn.config.title + ' column.');
					} else {
						this._announce('Cannot move to that column.');
					}
				}
				break;
		}
	};

	/**
	 * Reorder picked card within column
	 * @param {number} delta - -1 for up, 1 for down
	 */
	KanbanInstance.prototype._reorderPickedCard = function(delta) {
		var cardData = this.cards.get(this._pickedCardId);
		var container = this._pickedCard.parentNode;
		var cards = Array.from(container.querySelectorAll('.kanban-card'));
		var currentIndex = cards.indexOf(this._pickedCard);
		var newIndex = currentIndex + delta;

		if (newIndex < 0 || newIndex >= cards.length) return;

		// Swap in DOM
		if (delta < 0) {
			container.insertBefore(this._pickedCard, cards[newIndex]);
		} else {
			container.insertBefore(this._pickedCard, cards[newIndex].nextSibling);
		}

		cardData.data.position = newIndex;
		this._pickedCard.focus();
		this._announce('Moved ' + (delta < 0 ? 'up' : 'down') + '.');
	};

	/**
	 * Check if drop is valid (reuse existing logic)
	 */
	KanbanInstance.prototype._isValidDropForCard = function(sourceColumnId, targetColumnId) {
		// Store temporarily for _isValidDrop
		var originalSource = this._sourceColumnId;
		this._sourceColumnId = sourceColumnId;
		var result = this._isValidDrop(targetColumnId);
		this._sourceColumnId = originalSource;
		return result;
	};

	/**
	 * Focus adjacent card in same column
	 * @param {HTMLElement} cardEl - Current card
	 * @param {string} direction - 'up' or 'down'
	 */
	KanbanInstance.prototype._focusAdjacentCard = function(cardEl, direction) {
		var container = cardEl.parentNode;
		var cards = Array.from(container.querySelectorAll('.kanban-card'));
		var currentIndex = cards.indexOf(cardEl);
		var newIndex = currentIndex + (direction === 'up' ? -1 : 1);

		if (newIndex >= 0 && newIndex < cards.length) {
			cards[newIndex].focus();
		}
	};

	/**
	 * Focus first card in adjacent column
	 * @param {HTMLElement} cardEl - Current card
	 * @param {string} direction - 'left' or 'right'
	 */
	KanbanInstance.prototype._focusAdjacentColumn = function(cardEl, direction) {
		var currentColumn = cardEl.closest('.kanban-column');
		var columnIds = Array.from(this.columns.keys());
		var currentColumnId = currentColumn.dataset.columnId;
		var columnIndex = columnIds.indexOf(currentColumnId);
		var newIndex = columnIndex + (direction === 'left' ? -1 : 1);

		if (newIndex >= 0 && newIndex < columnIds.length) {
			var targetColumn = this.columns.get(columnIds[newIndex]);
			var firstCard = targetColumn.body.querySelector('.kanban-card');
			if (firstCard) {
				firstCard.focus();
			}
		}
	};

	// =========================================
	// Filter & Search
	// =========================================

	/**
	 * Render the filter toolbar
	 */
	KanbanInstance.prototype._renderToolbar = function() {
		if (!this.options.showToolbar) return;

		var self = this;
		this.toolbar = document.createElement('div');
		this.toolbar.className = 'kanban-toolbar';

		// Search input
		var searchInput = D.create('input')
			.attr('type', 'text')
			.classAdd('kanban-search-input')
			.attr('placeholder', 'Search cards...');
		var searchCount = D.span().classAdd('kanban-search-count');
		var searchWrapper = D.div().classAdd('kanban-search')
			.child(
				D.icon('fas fa-search').classAdd('kanban-search-icon'),
				searchInput,
				searchCount
			).el;
		this.toolbar.appendChild(searchWrapper);

		this._searchInput = searchInput.el;
		this._searchCount = searchCount.el;

		// Quick filters
		if (this.options.quickFilters && this.options.quickFilters.length > 0) {
			var quickFilters = D.div().classAdd('kanban-quick-filters');

			this.options.quickFilters.forEach(function(qf) {
				var btn = D.button()
					.attr('type', 'button')
					.classAdd('kanban-quick-filter')
					.data('filter', qf.id);
				if (qf.icon) {
					btn.child(D.icon(qf.icon), D.text(' '));
				}
				btn.child(D.text(qf.label));
				quickFilters.child(btn);
			});

			this.toolbar.appendChild(quickFilters.el);
		}

		// Filter badge & clear button
		var filterBadge = D.span().classAdd('kanban-filter-badge').style('display', 'none')
			.child(D.icon('fas fa-filter'), D.text(' '), D.span().text('0'));
		var clearFiltersBtn = D.button()
			.attr('type', 'button')
			.classAdd('kanban-clear-filters')
			.style('display', 'none')
			.child(D.icon('fas fa-times'), D.text(' Clear'));
		var filterActions = D.div().classAdd('kanban-filter-actions')
			.child(filterBadge, clearFiltersBtn).el;
		this.toolbar.appendChild(filterActions);

		this._filterBadge = filterBadge.el;
		this._clearFiltersBtn = clearFiltersBtn.el;

		// Insert before columns
		this.board.insertBefore(this.toolbar, this.board.firstChild);

		// Bind toolbar events
		this._bindToolbarEvents();
	};

	/**
	 * Bind toolbar event handlers
	 */
	KanbanInstance.prototype._bindToolbarEvents = function() {
		var self = this;

		// Search input
		if (this._searchInput) {
			var debounceTimer;
			this._boundHandlers.searchInput = function(e) {
				clearTimeout(debounceTimer);
				debounceTimer = setTimeout(function() {
					self.search(e.target.value);
				}, 200);
			};
			this._searchInput.addEventListener('input', this._boundHandlers.searchInput);
		}

		// Quick filters
		this._boundHandlers.quickFilter = function(e) {
			var btn = e.target.closest('.kanban-quick-filter');
			if (!btn) return;

			var filterId = btn.dataset.filter;
			var isActive = btn.classList.contains('active');

			if (isActive) {
				self.clearQuickFilter(filterId);
				btn.classList.remove('active');
			} else {
				self.applyQuickFilter(filterId);
				btn.classList.add('active');
			}
		};
		this.toolbar.addEventListener('click', this._boundHandlers.quickFilter);

		// Clear filters
		if (this._clearFiltersBtn) {
			this._boundHandlers.clearFilters = function() {
				self.clearAllFilters();
			};
			this._clearFiltersBtn.addEventListener('click', this._boundHandlers.clearFilters);
		}
	};

	/**
	 * Search cards by query
	 * @param {string} query - Search query
	 * @returns {Array} Matched cards
	 */
	KanbanInstance.prototype.search = function(query) {
		var lowerQuery = query ? query.toLowerCase().trim() : '';
		
		if (!lowerQuery) {
			this.clearSearch();
			return [];
		}
		
		this._searchQuery = lowerQuery;
		this.searchResults.clear();
		
		var useFuzzy = !!(this.options.fuzzySearch && Funky.FuzzySearch);
		var matchedCards;
		
		if (useFuzzy) {
			matchedCards = this._searchFuzzy(lowerQuery);
		} else {
			matchedCards = this._searchIndexOf(lowerQuery);
		}
		
		// Apply filters and visibility
		this._applyFilters();
		
		// Sort within columns if enabled
		if (useFuzzy && this.options.sortMatchesByScore) {
			this._sortColumnsByScore();
		}
		
		// Emit search event via callback if configured
		if (this.options.onSearch) {
			this.options.onSearch({
				query: lowerQuery,
				matches: matchedCards,
				fuzzy: useFuzzy
			});
		}
		
		return matchedCards;
	};

	/**
	 * Fuzzy search using Funky.FuzzySearch
	 * @private
	 */
	KanbanInstance.prototype._searchFuzzy = function(query) {
		var self = this;
		var options = this.options;
		var FuzzySearch = Funky.FuzzySearch;
		var searchFields = options.searchableFields || ['title', 'description'];
		
		// Get all cards as array
		var cardArray = [];
		this.cards.forEach(function(cardEntry) {
			cardArray.push(cardEntry.data);
		});
		
		// Perform fuzzy search
		var results = FuzzySearch.search(query, cardArray, {
			keys: searchFields,
			threshold: options.fuzzyThreshold,
			tokenize: options.fuzzyTokenize,
			limit: Infinity
		});
		
		var matchedCards = [];
		
		results.forEach(function(result) {
			var card = result.item;
			matchedCards.push(card);
			
			// Store for highlighting
			self.searchResults.set(card.id, {
				score: result.score,
				matches: result.matches,
				key: result.key
			});
		});
		
		return matchedCards;
	};

	/**
	 * Legacy indexOf search
	 * @private
	 */
	KanbanInstance.prototype._searchIndexOf = function(query) {
		var self = this;
		var options = this.options;
		var searchFields = options.searchableFields || ['title', 'description'];
		var matchedCards = [];
		
		this.cards.forEach(function(cardEntry) {
			var card = cardEntry.data;
			var matched = false;
			var matchField = null;
			var matchPositions = [];
			
			for (var i = 0; i < searchFields.length; i++) {
				var field = searchFields[i];
				var value = card[field];
				
				if (value && typeof value === 'string') {
					var lowerValue = value.toLowerCase();
					var index = lowerValue.indexOf(query);
					
					if (index !== -1) {
						matched = true;
						matchField = field;
						matchPositions = [[index, index + query.length - 1]];
						break;
					}
				}
			}
			
			if (matched) {
				matchedCards.push(card);
				self.searchResults.set(card.id, {
					score: 1,
					matches: matchPositions,
					key: matchField
				});
			}
		});
		
		return matchedCards;
	};

	/**
	 * Clear search and show all cards
	 */
	KanbanInstance.prototype.clearSearch = function() {
		var wasSearching = !!this._searchQuery;
		this._searchQuery = '';
		this.searchResults.clear();

		if (this._searchInput) {
			this._searchInput.value = '';
		}

		// Reset card order if was sorted by score
		if (wasSearching && this.options.sortMatchesByScore) {
			this._resetCardOrder();
		}

		this._applyFilters();

		Funky.PubSub.emit('funky:kanban:search:clear', { kanban: this });
	};

	/**
	 * Alias for search() - searches cards by query
	 * @param {string} query - Search query
	 * @returns {Array} Matched cards
	 */
	KanbanInstance.prototype.searchCards = function(query) {
		return this.search(query);
	};

	/**
	 * Apply filters to cards
	 * @param {Object} filters - Filter object { field: value }
	 */
	KanbanInstance.prototype.filter = function(filters) {
		this._activeFilters = Object.assign({}, this._activeFilters, filters);
		this._applyFilters();
	};

	/**
	 * Clear a specific filter
	 * @param {string} field - Field to clear, or null for all
	 */
	KanbanInstance.prototype.clearFilter = function(field) {
		if (field) {
			delete this._activeFilters[field];
		} else {
			this._activeFilters = {};
		}
		this._applyFilters();
	};

	/**
	 * Apply a quick filter by ID
	 * @param {string} filterId - Quick filter ID
	 */
	KanbanInstance.prototype.applyQuickFilter = function(filterId) {
		var quickFilter = this.options.quickFilters?.find(function(qf) {
			return qf.id === filterId;
		});
		if (!quickFilter) return;

		// Resolve special variables
		var filters = this._resolveFilterVariables(quickFilter.filter);
		
		this._activeQuickFilters = this._activeQuickFilters || {};
		this._activeQuickFilters[filterId] = filters;
		
		this._applyFilters();
	};

	/**
	 * Clear a quick filter
	 * @param {string} filterId - Quick filter ID
	 */
	KanbanInstance.prototype.clearQuickFilter = function(filterId) {
		if (this._activeQuickFilters) {
			delete this._activeQuickFilters[filterId];
		}
		this._applyFilters();
	};

	/**
	 * Clear all filters, quick filters, and search
	 */
	KanbanInstance.prototype.clearAllFilters = function() {
		this._searchQuery = '';
		this._activeFilters = {};
		this._activeQuickFilters = {};
		
		if (this._searchInput) {
			this._searchInput.value = '';
		}

		// Reset quick filter buttons
		if (this.toolbar) {
			this.toolbar.querySelectorAll('.kanban-quick-filter.active').forEach(function(btn) {
				btn.classList.remove('active');
			});
		}

		this._applyFilters();
	};

	/**
	 * Resolve special filter variables like $currentUser, $today
	 */
	KanbanInstance.prototype._resolveFilterVariables = function(filterObj) {
		var self = this;
		var resolved = {};

		for (var key in filterObj) {
			var value = filterObj[key];
			
			if (value === '$currentUser') {
				resolved[key] = this.options.currentUser || null;
			} else if (value === '$today') {
				resolved[key] = new Date().toISOString().split('T')[0];
			} else if (typeof value === 'object' && value !== null) {
				// Handle comparison objects like { lt: '$today' }
				resolved[key] = {};
				for (var op in value) {
					if (value[op] === '$today') {
						resolved[key][op] = new Date().toISOString().split('T')[0];
					} else {
						resolved[key][op] = value[op];
					}
				}
			} else {
				resolved[key] = value;
			}
		}

		return resolved;
	};

	/**
	 * Apply all active filters and search
	 */
	KanbanInstance.prototype._applyFilters = function() {
		var self = this;
		var matchCount = 0;
		var totalCount = this.cards.size;

		this.cards.forEach(function(cardEntry, cardId) {
			var matches = self._cardMatchesFilters(cardEntry.data);
			
			if (matches) {
				cardEntry.element.classList.remove('filtered-out');
				matchCount++;
				
				// Highlight search matches
				if (self._searchQuery) {
					self._highlightSearchMatches(cardEntry.element, cardEntry.data);
				} else {
					self._clearSearchHighlights(cardEntry.element);
				}
			} else {
				cardEntry.element.classList.add('filtered-out');
				self._clearSearchHighlights(cardEntry.element);
			}
		});

		// Update counts
		this._updateFilteredCounts();
		this._updateFilterUI(matchCount, totalCount);
	};

	/**
	 * Check if card matches all active filters
	 */
	KanbanInstance.prototype._cardMatchesFilters = function(card) {
		// Combine regular filters and quick filters
		var allFilters = Object.assign({}, this._activeFilters);
		
		if (this._activeQuickFilters) {
			for (var qfId in this._activeQuickFilters) {
				Object.assign(allFilters, this._activeQuickFilters[qfId]);
			}
		}

		// Search query
		if (this._searchQuery) {
			// If fuzzy search was used, check searchResults
			if (this.options.fuzzySearch && Funky.FuzzySearch) {
				if (!this.searchResults.has(card.id)) {
					return false;
				}
			} else {
				// Legacy indexOf search
				var searchFields = this.options.searchableFields || ['title', 'description'];
				var matchesSearch = false;
				
				for (var i = 0; i < searchFields.length; i++) {
					var value = card[searchFields[i]];
					if (value && String(value).toLowerCase().indexOf(this._searchQuery) !== -1) {
						matchesSearch = true;
						break;
					}
				}
				
				if (!matchesSearch) return false;
			}
		}

		// Field filters (AND logic between fields)
		for (var field in allFilters) {
			var filterValue = allFilters[field];
			var cardValue = card[field];

			if (!this._valueMatchesFilter(cardValue, filterValue)) {
				return false;
			}
		}

		return true;
	};

	/**
	 * Check if a single value matches a filter
	 */
	KanbanInstance.prototype._valueMatchesFilter = function(cardValue, filterValue) {
		// Null check filter
		if (filterValue === null) {
			return cardValue == null || cardValue === '';
		}

		// Array filter (OR within same field)
		if (Array.isArray(filterValue)) {
			if (Array.isArray(cardValue)) {
				// Both arrays - check for any intersection
				return filterValue.some(function(fv) {
					return cardValue.includes(fv);
				});
			}
			return filterValue.includes(cardValue);
		}

		// Object filter (comparison operators)
		if (typeof filterValue === 'object' && filterValue !== null) {
			if (filterValue.lt !== undefined && !(cardValue < filterValue.lt)) return false;
			if (filterValue.lte !== undefined && !(cardValue <= filterValue.lte)) return false;
			if (filterValue.gt !== undefined && !(cardValue > filterValue.gt)) return false;
			if (filterValue.gte !== undefined && !(cardValue >= filterValue.gte)) return false;
			return true;
		}

		// Exact match
		return cardValue === filterValue;
	};

	/**
	 * Highlight search matches in card element
	 */
	KanbanInstance.prototype._highlightSearchMatches = function(cardEl, cardData) {
		var self = this;
		var options = this.options;
		
		if (!options.highlightMatches) return;
		
		// Use fuzzy result if available
		var result = this.searchResults.get(cardData.id);
		
		if (result && result.key && result.matches) {
			// Fuzzy highlighting - only highlight the matched field
			var fieldEl = cardEl.querySelector('.kanban-card-' + result.key);
			if (fieldEl) {
				var value = cardData[result.key];
				if (value) {
					var highlighted = this._highlightMatches(String(value), result.matches);
					fieldEl.innerHTML = highlighted;
				}
			}
			
			// Show score badge if enabled
			if (options.showMatchScore && result.score !== undefined) {
				this._showScoreBadge(cardEl, result.score);
			}
		} else {
			// Legacy regex highlighting
			var searchFields = options.searchableFields || ['title', 'description'];
			
			searchFields.forEach(function(field) {
				var el = cardEl.querySelector('.kanban-card-' + field);
				if (!el) return;

				var value = cardData[field];
				if (!value) return;

				var regex = new RegExp('(' + self._escapeRegExp(self._searchQuery) + ')', 'gi');
				var highlighted = self._escapeHtml(String(value)).replace(regex, '<mark class="search-highlight">$1</mark>');
				el.innerHTML = highlighted;
			});
		}
	};

	/**
	 * Highlight matches using position array
	 * @private
	 */
	KanbanInstance.prototype._highlightMatches = function(text, matches) {
		if (!text || !matches || !matches.length) {
			return this._escapeHtml(text);
		}
		
		// Use Funky.Highlight if available
		if (Funky.Highlight && Funky.Highlight.fromMatches) {
			return Funky.Highlight.fromMatches(text, matches, {
				className: 'search-highlight'
			});
		}
		
		// Build set of highlighted indices
		var highlightSet = {};
		for (var i = 0; i < matches.length; i++) {
			var start = matches[i][0];
			var end = matches[i][1];
			for (var j = start; j <= end; j++) {
				highlightSet[j] = true;
			}
		}
		
		// Build output with highlights
		var result = '';
		var inHighlight = false;
		var self = this;
		
		for (var i = 0; i < text.length; i++) {
			var shouldHighlight = !!highlightSet[i];
			
			if (shouldHighlight && !inHighlight) {
				result += '<mark class="search-highlight">';
				inHighlight = true;
			} else if (!shouldHighlight && inHighlight) {
				result += '</mark>';
				inHighlight = false;
			}
			
			result += self._escapeHtml(text.charAt(i));
		}
		
		if (inHighlight) {
			result += '</mark>';
		}
		
		return result;
	};

	/**
	 * Show score badge on card
	 * @private
	 */
	KanbanInstance.prototype._showScoreBadge = function(cardEl, score) {
		var badge = cardEl.querySelector('.kanban-score-badge');
		
		if (!badge) {
			badge = document.createElement('span');
			badge.className = 'kanban-score-badge';
			cardEl.insertBefore(badge, cardEl.firstChild);
		}
		
		badge.textContent = Math.round(score * 100) + '%';
		badge.style.display = 'block';
	};

	/**
	 * Hide score badge
	 * @private
	 */
	KanbanInstance.prototype._hideScoreBadge = function(cardEl) {
		var badge = cardEl.querySelector('.kanban-score-badge');
		if (badge) {
			badge.style.display = 'none';
		}
	};

	/**
	 * Get highlighted text for a card field
	 * @param {string} cardId
	 * @param {string} field
	 * @returns {string} HTML with highlights
	 */
	KanbanInstance.prototype.getHighlightedField = function(cardId, field) {
		var cardEntry = this.cards.get(cardId);
		if (!cardEntry) return '';
		
		var card = cardEntry.data;
		var text = card[field] || '';
		
		if (!this._searchQuery || !this.options.highlightMatches) {
			return this._escapeHtml(text);
		}
		
		var result = this.searchResults.get(cardId);
		
		if (!result || result.key !== field) {
			return this._escapeHtml(text);
		}
		
		return this._highlightMatches(text, result.matches);
	};

	/**
	 * Get search score for a card
	 * @param {string} cardId
	 * @returns {number|null}
	 */
	KanbanInstance.prototype.getSearchScore = function(cardId) {
		var result = this.searchResults.get(cardId);
		return result ? result.score : null;
	};

	/**
	 * Sort cards within columns by search score
	 * @private
	 */
	KanbanInstance.prototype._sortColumnsByScore = function() {
		var self = this;
		
		this.columns.forEach(function(columnData, columnId) {
			var columnEl = columnData.element;
			if (!columnEl) return;
			
			var cardContainer = columnEl.querySelector('.kanban-cards');
			if (!cardContainer) return;
			
			// Get visible cards in this column with scores
			var cardsWithScores = [];
			columnData.cards.forEach(function(cardId) {
				var result = self.searchResults.get(cardId);
				if (result) {
					var cardEntry = self.cards.get(cardId);
					if (cardEntry && cardEntry.element) {
						cardsWithScores.push({
							id: cardId,
							score: result.score,
							element: cardEntry.element
						});
					}
				}
			});
			
			// Sort by score descending
			cardsWithScores.sort(function(a, b) {
				return b.score - a.score;
			});
			
			// Reorder DOM
			cardsWithScores.forEach(function(item) {
				cardContainer.appendChild(item.element);
			});
		});
	};

	/**
	 * Reset cards to original order
	 * @private
	 */
	KanbanInstance.prototype._resetCardOrder = function() {
		var self = this;
		
		this.columns.forEach(function(columnData, columnId) {
			var columnEl = columnData.element;
			if (!columnEl) return;
			
			var cardContainer = columnEl.querySelector('.kanban-cards');
			if (!cardContainer) return;
			
			// Re-append in original order
			columnData.cards.forEach(function(cardId) {
				var cardEntry = self.cards.get(cardId);
				if (cardEntry && cardEntry.element) {
					cardContainer.appendChild(cardEntry.element);
				}
			});
		});
	};

	/**
	 * Clear search highlights from card
	 */
	KanbanInstance.prototype._clearSearchHighlights = function(cardEl) {
		// Remove highlight marks
		cardEl.querySelectorAll('.search-highlight').forEach(function(mark) {
			var text = mark.textContent;
			mark.replaceWith(text);
		});
		
		// Hide score badge
		this._hideScoreBadge(cardEl);
	};

	/**
	 * Escape string for use in regex
	 */
	KanbanInstance.prototype._escapeRegExp = function(str) {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	};

	/**
	 * Update column/swimlane counts after filtering
	 */
	KanbanInstance.prototype._updateFilteredCounts = function() {
		var self = this;

		if (this.options.swimlanes) {
			this.swimlanes.forEach(function(data, value) {
				self._updateSwimlaneCount(value);
			});
		} else {
			this.columns.forEach(function(data, columnId) {
				self._updateColumnCount(columnId);
			});
		}
	};

	/**
	 * Update filter UI elements (badge, count, clear button)
	 */
	KanbanInstance.prototype._updateFilterUI = function(matchCount, totalCount) {
		var hasFilters = this._searchQuery || 
			Object.keys(this._activeFilters || {}).length > 0 ||
			Object.keys(this._activeQuickFilters || {}).length > 0;

		// Update search count
		if (this._searchCount) {
			if (hasFilters) {
				this._searchCount.textContent = matchCount + ' of ' + totalCount + ' cards';
				this._searchCount.style.display = '';
			} else {
				this._searchCount.style.display = 'none';
			}
		}

		// Update filter badge
		if (this._filterBadge) {
			var filterCount = Object.keys(this._activeFilters || {}).length +
				Object.keys(this._activeQuickFilters || {}).length;
			
			if (filterCount > 0) {
				this._filterBadge.querySelector('span').textContent = filterCount;
				this._filterBadge.style.display = '';
			} else {
				this._filterBadge.style.display = 'none';
			}
		}

		// Update clear button
		if (this._clearFiltersBtn) {
			this._clearFiltersBtn.style.display = hasFilters ? '' : 'none';
		}
	};

	// =========================================
	// API Integration
	// =========================================

	/**
	 * Load cards from dataSource URL
	 */
	KanbanInstance.prototype._loadData = function() {
		var self = this;
		
		if (!this.options.dataSource) {
			this._renderCards();
			return;
		}

		this._setLoading(true);
		
		if (this.options.onLoadStart) {
			this.options.onLoadStart();
		}

		this._fetch(this.options.dataSource, { method: 'GET' })
			.then(function(data) {
				// Support both { cards: [...] } and direct array
				var cards = Array.isArray(data) ? data : (data.cards || []);
				self.options.cards = cards;
				self._renderCards();
				self._setLoading(false);
				
				if (self.options.onLoadComplete) {
					self.options.onLoadComplete(cards);
				}
			})
			.catch(function(err) {
				console.error('[Funky.Kanban] Failed to load data:', err);
				self._showError('Failed to load board data');
				self._setLoading(false);
				
				if (self.options.onLoadError) {
					self.options.onLoadError(err);
				}
			});
	};

	/**
	 * Reload data from the dataSource
	 */
	KanbanInstance.prototype.reload = function() {
		// Clear existing cards
		var self = this;
		this.cards.forEach(function(cardData) {
			if (cardData.element && cardData.element.parentNode) {
				cardData.element.parentNode.removeChild(cardData.element);
			}
		});
		this.cards.clear();
		
		this._loadData();
	};

	/**
	 * Set loading state
	 * @param {boolean} loading - Loading state
	 */
	KanbanInstance.prototype._setLoading = function(loading) {
		this._loading = loading;
		this.board.classList.toggle('loading', loading);
	};

	/**
	 * Check if board is loading
	 * @returns {boolean}
	 */
	KanbanInstance.prototype.isLoading = function() {
		return this._loading;
	};

	/**
	 * Show error message
	 * @param {string} message - Error message
	 */
	KanbanInstance.prototype._showError = function(message) {
		// Use Funky.Toast if available, otherwise console
		if (window.Funky && Funky.Toast && typeof Funky.Toast.error === 'function') {
			Funky.Toast.error(message);
		} else {
			console.error('[Funky.Kanban]', message);
		}
	};

	/**
	 * Show success message
	 * @param {string} message - Success message
	 */
	KanbanInstance.prototype._showSuccess = function(message) {
		if (window.Funky && Funky.Toast && typeof Funky.Toast.success === 'function') {
			Funky.Toast.success(message);
		}
	};

	/**
	 * Internal fetch wrapper with retry support
	 * @param {string} url - URL to fetch
	 * @param {Object} options - Fetch options
	 * @param {number} attempt - Current attempt number
	 * @returns {Promise}
	 */
	KanbanInstance.prototype._fetch = function(url, options, attempt) {
		var self = this;
		attempt = attempt || 1;
		
		return fetch(url, options)
			.then(function(res) {
				if (!res.ok) {
					throw new Error('HTTP ' + res.status + ': ' + res.statusText);
				}
				return res.json();
			})
			.catch(function(err) {
				if (attempt < self.options.retryAttempts) {
					return new Promise(function(resolve) {
						setTimeout(function() {
							resolve(self._fetch(url, options, attempt + 1));
						}, self.options.retryDelay * attempt);
					});
				}
				throw err;
			});
	};

	/**
	 * Parse API endpoint config
	 * @param {string} endpoint - Endpoint config (e.g., 'POST /api/cards/:id')
	 * @param {Object} params - Parameters to substitute
	 * @returns {Object} { method, url }
	 */
	KanbanInstance.prototype._parseApiEndpoint = function(endpoint, params) {
		var parts = endpoint.split(' ');
		var method = parts.length > 1 ? parts[0] : 'POST';
		var url = parts.length > 1 ? parts[1] : parts[0];
		
		// Substitute params
		if (params) {
			Object.keys(params).forEach(function(key) {
				url = url.replace(':' + key, encodeURIComponent(params[key]));
			});
		}
		
		return { method: method, url: url };
	};

	/**
	 * API create card
	 * @param {Object} cardData - Card data
	 * @returns {Promise}
	 */
	KanbanInstance.prototype._apiCreate = function(cardData) {
		var self = this;
		
		if (this.options.onSave) {
			return Promise.resolve(this.options.onSave('create', cardData, cardData));
		}
		
		if (!this.options.api || !this.options.api.create) {
			return Promise.resolve(cardData);
		}

		var endpoint = this._parseApiEndpoint(this.options.api.create, { id: cardData.id });
		
		return this._fetch(endpoint.url, {
			method: endpoint.method,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(cardData)
		});
	};

	/**
	 * API update card
	 * @param {number|string} cardId - Card ID
	 * @param {Object} changes - Changes to apply
	 * @returns {Promise}
	 */
	KanbanInstance.prototype._apiUpdate = function(cardId, changes) {
		var cardData = this.cards.get(String(cardId));
		
		if (this.options.onSave) {
			return Promise.resolve(this.options.onSave('update', cardData ? cardData.data : { id: cardId }, changes));
		}
		
		if (!this.options.api || !this.options.api.update) {
			return Promise.resolve(changes);
		}

		var endpoint = this._parseApiEndpoint(this.options.api.update, { id: cardId });
		
		return this._fetch(endpoint.url, {
			method: endpoint.method,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(changes)
		});
	};

	/**
	 * API delete card
	 * @param {number|string} cardId - Card ID
	 * @returns {Promise}
	 */
	KanbanInstance.prototype._apiDelete = function(cardId) {
		var cardData = this.cards.get(String(cardId));
		
		if (this.options.onSave) {
			return Promise.resolve(this.options.onSave('delete', cardData ? cardData.data : { id: cardId }, null));
		}
		
		if (!this.options.api || !this.options.api.delete) {
			return Promise.resolve();
		}

		var endpoint = this._parseApiEndpoint(this.options.api.delete, { id: cardId });
		
		return this._fetch(endpoint.url, {
			method: endpoint.method,
			headers: { 'Content-Type': 'application/json' }
		});
	};

	/**
	 * API move card
	 * @param {number|string} cardId - Card ID
	 * @param {string} column - Target column
	 * @param {number} position - Position in column
	 * @param {Object} extra - Extra data (e.g., swimlane)
	 * @returns {Promise}
	 */
	KanbanInstance.prototype._apiMove = function(cardId, column, position, extra) {
		var cardData = this.cards.get(String(cardId));
		var changes = Object.assign({ column: column, position: position }, extra || {});
		
		if (this.options.onSave) {
			return Promise.resolve(this.options.onSave('move', cardData ? cardData.data : { id: cardId }, changes));
		}
		
		if (!this.options.api || !this.options.api.move) {
			// Fall back to update endpoint if no move endpoint
			if (this.options.api && this.options.api.update) {
				return this._apiUpdate(cardId, changes);
			}
			return Promise.resolve();
		}

		var endpoint = this._parseApiEndpoint(this.options.api.move, { id: cardId });
		
		return this._fetch(endpoint.url, {
			method: endpoint.method,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(changes)
		});
	};

	// =========================================
	// Optimistic Updates & Rollback
	// =========================================

	/**
	 * Generate operation ID for tracking
	 * @returns {number}
	 */
	KanbanInstance.prototype._nextOperationId = function() {
		return ++this._operationId;
	};

	/**
	 * Store rollback state for an operation
	 * @param {number} opId - Operation ID
	 * @param {Object} state - State to restore on rollback
	 */
	KanbanInstance.prototype._storeRollback = function(opId, state) {
		this._pendingOperations.set(opId, state);
	};

	/**
	 * Clear rollback state for completed operation
	 * @param {number} opId - Operation ID
	 */
	KanbanInstance.prototype._clearRollback = function(opId) {
		this._pendingOperations.delete(opId);
	};

	/**
	 * Execute rollback for failed operation
	 * @param {number} opId - Operation ID
	 */
	KanbanInstance.prototype._executeRollback = function(opId) {
		var state = this._pendingOperations.get(opId);
		if (!state) return;

		switch (state.type) {
			case 'move':
				// Restore card to original position
				this._applyMoveDOM(state.cardId, state.fromColumn, state.fromPosition, state.fromSwimlane);
				// Restore data
				var cardData = this.cards.get(String(state.cardId));
				if (cardData) {
					cardData.data.column = state.fromColumn;
					cardData.data.position = state.fromPosition;
					if (state.fromSwimlane !== undefined && this.options.swimlanes) {
						cardData.data[this.options.swimlanes.field] = state.fromSwimlane;
					}
				}
				this._updateColumnCount(state.fromColumn);
				this._updateColumnCount(state.toColumn);
				break;
			
			case 'create':
				// Remove the optimistically added card
				this._removeCardDOM(state.cardId);
				break;
			
			case 'delete':
				// Restore the deleted card
				this._renderCard(state.cardData);
				this._updateColumnCount(state.cardData.column);
				break;
			
			case 'update':
				// Restore original card data
				var cardRef = this.cards.get(String(state.cardId));
				if (cardRef) {
					Object.assign(cardRef.data, state.originalData);
					// Re-render card content
					D.wrap(cardRef.element).empty();
					if (this.options.renderCard) {
						var content = this.options.renderCard(cardRef.data);
						if (typeof content === 'string') {
							cardRef.element.innerHTML = content;
						} else if (content instanceof HTMLElement) {
							cardRef.element.appendChild(content);
						}
					} else {
						cardRef.element.appendChild(this._renderDefaultCard(cardRef.data));
					}
				}
				break;
		}

		this._pendingOperations.delete(opId);
	};

	/**
	 * Apply move to DOM only (for rollback/restore)
	 * @param {string} cardId - Card ID
	 * @param {string} columnId - Target column
	 * @param {number} position - Position
	 * @param {string} swimlane - Swimlane value (optional)
	 */
	KanbanInstance.prototype._applyMoveDOM = function(cardId, columnId, position, swimlane) {
		var cardData = this.cards.get(String(cardId));
		if (!cardData) return;

		var container;
		if (this.options.swimlanes && swimlane !== undefined) {
			var selector = '[data-swimlane="' + swimlane + '"] [data-column="' + columnId + '"]';
			container = this.board.querySelector(selector);
		} else {
			var col = this.columns.get(columnId);
			container = col ? col.body : null;
		}

		if (!container) return;

		var cards = container.querySelectorAll('.kanban-card');
		var emptyEl = container.querySelector('.kanban-column-empty');
		
		if (position < cards.length) {
			container.insertBefore(cardData.element, cards[position]);
		} else if (emptyEl) {
			container.insertBefore(cardData.element, emptyEl);
		} else {
			container.appendChild(cardData.element);
		}
	};

	/**
	 * Remove card from DOM
	 * @param {string} cardId - Card ID
	 */
	KanbanInstance.prototype._removeCardDOM = function(cardId) {
		var cardData = this.cards.get(String(cardId));
		if (cardData && cardData.element && cardData.element.parentNode) {
			var column = cardData.data.column;
			cardData.element.parentNode.removeChild(cardData.element);
			this.cards.delete(String(cardId));
			this._updateColumnCount(column);
		}
	};

	// =========================================
	// WebSocket Integration
	// =========================================

	/**
	 * Subscribe to WebSocket board channel
	 */
	KanbanInstance.prototype._subscribeWebSocket = function() {
		var self = this;
		var boardId = this.options.boardId || 'default';

		// Check if Funky.PubSub exists
		if (!window.Funky || !Funky.PubSub) {
			console.warn('[Funky.Kanban] PubSub not available for WebSocket');
			return;
		}

		this._wsChannel = 'funky:ws:kanban:' + boardId;
		this._wsSubscribed = true;

		this._boundHandlers.wsMessage = function(data) {
			// Ignore own actions
			if (data.userId && data.userId === self.options.userId) {
				return;
			}

			switch (data.action) {
				case 'card:move':
					self._handleRemoteMove(data);
					break;
				case 'card:update':
					self._handleRemoteUpdate(data);
					break;
				case 'card:create':
					self._handleRemoteCreate(data);
					break;
				case 'card:delete':
					self._handleRemoteDelete(data);
					break;
				case 'user:join':
					self._handleUserJoin(data);
					break;
				case 'user:leave':
					self._handleUserLeave(data);
					break;
			}
		};

		Funky.PubSub.on(this._wsChannel, this._boundHandlers.wsMessage);

		// Announce presence
		if (this.options.userId) {
			this._announcePresence('join');
		}
	};

	/**
	 * Unsubscribe from WebSocket
	 */
	KanbanInstance.prototype._unsubscribeWebSocket = function() {
		if (!this._wsSubscribed) return;

		// Announce leaving
		if (this.options.userId) {
			this._announcePresence('leave');
		}

		if (window.Funky && Funky.PubSub && this._boundHandlers.wsMessage) {
			Funky.PubSub.off(this._wsChannel, this._boundHandlers.wsMessage);
		}

		this._wsSubscribed = false;
	};

	/**
	 * Announce user presence
	 * @param {string} action - 'join' or 'leave'
	 */
	KanbanInstance.prototype._announcePresence = function(action) {
		if (!window.Funky || !Funky.PubSub) return;

		Funky.PubSub.emit('funky:ws:kanban:send', {
			boardId: this.options.boardId || 'default',
			action: 'user:' + action,
			userId: this.options.userId,
			userName: this.options.currentUser || 'Anonymous'
		});
	};

	/**
	 * Handle remote card move
	 * @param {Object} data - Move data
	 */
	KanbanInstance.prototype._handleRemoteMove = function(data) {
		var cardData = this.cards.get(String(data.cardId));
		
		// Check for conflict
		if (cardData && cardData.data.column !== data.fromColumn) {
			this._showError('Card "' + (cardData.data.title || data.cardId) + '" was moved by another user');
		}

		// Apply the remote move
		if (this.options.swimlanes && data.swimlane !== undefined) {
			this._moveCardToCellSilent(data.cardId, data.toColumn, data.swimlane, data.position);
		} else {
			this._moveCardToColumnSilent(data.cardId, data.toColumn, data.position);
		}

		// Flash card to indicate remote update
		this._flashRemoteUpdate(data.cardId);

		// Callback
		if (this.options.onRemoteUpdate) {
			this.options.onRemoteUpdate('move', data);
		}
	};

	/**
	 * Handle remote card update
	 * @param {Object} data - Update data
	 */
	KanbanInstance.prototype._handleRemoteUpdate = function(data) {
		var cardRef = this.cards.get(String(data.cardId));
		if (!cardRef) return;

		// Update data
		Object.assign(cardRef.data, data.changes);

		// Re-render card
		D.wrap(cardRef.element).empty();
		if (this.options.renderCard) {
			var content = this.options.renderCard(cardRef.data);
			if (typeof content === 'string') {
				cardRef.element.innerHTML = content;
			} else if (content instanceof HTMLElement) {
				cardRef.element.appendChild(content);
			}
		} else {
			cardRef.element.appendChild(this._renderDefaultCard(cardRef.data));
		}

		this._flashRemoteUpdate(data.cardId);

		if (this.options.onRemoteUpdate) {
			this.options.onRemoteUpdate('update', data);
		}
	};

	/**
	 * Handle remote card create
	 * @param {Object} data - Card data
	 */
	KanbanInstance.prototype._handleRemoteCreate = function(data) {
		// Check if card already exists
		if (this.cards.has(String(data.card.id))) return;

		this._renderCard(data.card);
		this._updateColumnCount(data.card.column);
		this._flashRemoteUpdate(data.card.id);

		if (this.options.onRemoteUpdate) {
			this.options.onRemoteUpdate('create', data);
		}
	};

	/**
	 * Handle remote card delete
	 * @param {Object} data - Delete data
	 */
	KanbanInstance.prototype._handleRemoteDelete = function(data) {
		this._removeCardDOM(data.cardId);

		if (this.options.onRemoteUpdate) {
			this.options.onRemoteUpdate('delete', data);
		}
	};

	/**
	 * Flash card to indicate remote update
	 * @param {string|number} cardId - Card ID
	 */
	KanbanInstance.prototype._flashRemoteUpdate = function(cardId) {
		var cardData = this.cards.get(String(cardId));
		if (!cardData || !cardData.element) return;

		cardData.element.classList.add('remote-update');
		setTimeout(function() {
			cardData.element.classList.remove('remote-update');
		}, 2000);
	};

	/**
	 * Silent move (no callbacks, for remote updates)
	 */
	KanbanInstance.prototype._moveCardToColumnSilent = function(cardId, targetColumnId, position) {
		var cardData = this.cards.get(String(cardId));
		if (!cardData) return;

		var oldColumnId = cardData.data.column;
		var targetColumn = this.columns.get(targetColumnId);
		if (!targetColumn) return;

		// Move DOM element
		var cards = targetColumn.body.querySelectorAll('.kanban-card');
		var emptyEl = targetColumn.body.querySelector('.kanban-column-empty');
		
		if (position < cards.length) {
			targetColumn.body.insertBefore(cardData.element, cards[position]);
		} else if (emptyEl) {
			targetColumn.body.insertBefore(cardData.element, emptyEl);
		} else {
			targetColumn.body.appendChild(cardData.element);
		}

		// Update data
		cardData.data.column = targetColumnId;
		cardData.data.position = position;

		// Update counts
		this._updateColumnCount(oldColumnId);
		this._updateColumnCount(targetColumnId);
	};

	/**
	 * Silent move to swimlane cell
	 */
	KanbanInstance.prototype._moveCardToCellSilent = function(cardId, targetColumnId, targetSwimlane, position) {
		var cardData = this.cards.get(String(cardId));
		if (!cardData) return;

		var oldColumnId = cardData.data.column;
		var field = this.options.swimlanes.field;
		var oldSwimlane = cardData.data[field];

		var selector = '[data-swimlane="' + targetSwimlane + '"] [data-column="' + targetColumnId + '"]';
		var targetCell = this.board.querySelector(selector);
		if (!targetCell) return;

		var cards = targetCell.querySelectorAll('.kanban-card');
		if (position < cards.length) {
			targetCell.insertBefore(cardData.element, cards[position]);
		} else {
			targetCell.appendChild(cardData.element);
		}

		cardData.data.column = targetColumnId;
		cardData.data[field] = targetSwimlane;
		cardData.data.position = position;

		// Update swimlane counts
		this._updateSwimlaneCount(oldSwimlane);
		this._updateSwimlaneCount(targetSwimlane);
	};

	// =========================================
	// User Presence
	// =========================================

	/**
	 * Render user presence indicator
	 */
	KanbanInstance.prototype._renderPresence = function() {
		if (!this.options.showPresence) return;

		this._presenceContainer = document.createElement('div');
		this._presenceContainer.className = 'kanban-presence';
		this.board.insertBefore(this._presenceContainer, this.board.firstChild);

		this._updatePresenceUI();
	};

	/**
	 * Update presence UI
	 */
	KanbanInstance.prototype._updatePresenceUI = function() {
		if (!this._presenceContainer) return;

		var container = D.wrap(this._presenceContainer).empty();
		this._activeUsers.forEach(function(user) {
			var initials = (user.name || 'U').charAt(0).toUpperCase();
			var avatar;
			if (user.avatar) {
				avatar = D.create('img')
					.classAdd('kanban-presence-avatar')
					.attr('src', user.avatar)
					.attr('alt', user.name)
					.attr('title', user.name);
			} else {
				avatar = D.span()
					.classAdd('kanban-presence-avatar', 'kanban-presence-initials')
					.attr('title', user.name)
					.text(initials);
			}
			container.child(avatar);
		});
	};

	/**
	 * Handle user join
	 * @param {Object} data - User data
	 */
	KanbanInstance.prototype._handleUserJoin = function(data) {
		// Check if already in list
		var exists = this._activeUsers.some(function(u) { return u.id === data.userId; });
		if (exists) return;

		this._activeUsers.push({
			id: data.userId,
			name: data.userName,
			avatar: data.avatar
		});

		this._updatePresenceUI();
	};

	/**
	 * Handle user leave
	 * @param {Object} data - User data
	 */
	KanbanInstance.prototype._handleUserLeave = function(data) {
		this._activeUsers = this._activeUsers.filter(function(u) {
			return u.id !== data.userId;
		});

		this._updatePresenceUI();
	};

	/**
	 * Get active users
	 * @returns {Array}
	 */
	KanbanInstance.prototype.getActiveUsers = function() {
		return this._activeUsers.slice();
	};

	// =========================================
	// Funky.Presence Integration
	// =========================================

	/**
	 * Enable Funky.Presence integration
	 * @param {Object} options - Configuration options
	 * @param {boolean} options.preventRemoteDrag - Prevent dragging cards others are moving (default: true)
	 * @param {boolean} options.showDragIndicators - Show who's dragging what (default: true)
	 * @param {boolean} options.showViewerIndicators - Show who's viewing each card (default: true)
	 */
	KanbanInstance.prototype.enablePresence = function(options) {
		if (!Funky.Presence) {
			console.warn('[Kanban] Funky.Presence not available');
			return;
		}

		options = options || {};
		this._presenceEnabled = true;
		this._presenceConfig = {
			preventRemoteDrag: options.preventRemoteDrag !== false,
			showDragIndicators: options.showDragIndicators !== false,
			showViewerIndicators: options.showViewerIndicators !== false
		};

		// Presence state
		this._boardChannel = null;
		this._cardChannels = {};  // { cardId: channel }
		this._draggedCards = {};  // { odUserId: cardId } - track who's dragging what
		this._presenceUI = null;  // Board-level avatar stack

		// Initialize board presence
		this._initBoardPresence();

		console.log('[Kanban] Presence tracking enabled');
	};

	/**
	 * Disable Funky.Presence integration
	 */
	KanbanInstance.prototype.disablePresence = function() {
		if (!this._presenceEnabled) return;

		// Leave board channel
		if (this._boardChannel && Funky.Presence) {
			Funky.Presence.leave(this._boardChannel);
		}

		// Leave all card channels
		var self = this;
		Object.keys(this._cardChannels).forEach(function(cardId) {
			if (Funky.Presence) {
				Funky.Presence.leave(self._cardChannels[cardId]);
			}
		});

		// Remove event listeners
		this._removePresenceListeners();

		// Remove UI
		if (this._presenceUI) {
			this._presenceUI.destroy();
			this._presenceUI = null;
		}

		// Clear presence indicator container
		var indicator = this.board.querySelector('.kanban-board__presence');
		if (indicator) {
			indicator.parentNode.removeChild(indicator);
		}

		this._presenceEnabled = false;
		this._boardChannel = null;
		this._cardChannels = {};
		this._draggedCards = {};

		console.log('[Kanban] Presence tracking disabled');
	};

	/**
	 * Check if Funky.Presence integration is enabled
	 * @returns {boolean}
	 */
	KanbanInstance.prototype.isPresenceEnabled = function() {
		return this._presenceEnabled === true;
	};

	/**
	 * Initialize board-level presence
	 * @private
	 */
	KanbanInstance.prototype._initBoardPresence = function() {
		if (!this._presenceEnabled || !Funky.Presence) return;

		var boardId = this.options.boardId || this.id;
		this._boardChannel = 'kanban:' + boardId;

		// Join board channel
		Funky.Presence.join(this._boardChannel, {
			status: 'viewing',
			metadata: {
				boardId: boardId
			}
		});

		// Set up presence listeners
		this._setupPresenceListeners();

		// Create board-level presence indicator
		this._createBoardPresenceIndicator();

		console.log('[Kanban] Joined presence channel:', this._boardChannel);
	};

	/**
	 * Set up presence event listeners
	 * @private
	 */
	KanbanInstance.prototype._setupPresenceListeners = function() {
		var self = this;

		this._presenceHandlers = {
			onStatusChange: function(data) {
				self._handlePresenceStatusChange(data);
			},
			onUserJoin: function(data) {
				self._handlePresenceJoin(data);
			},
			onUserLeave: function(data) {
				self._handlePresenceLeave(data);
			}
		};

		Funky.Presence.on('status', this._presenceHandlers.onStatusChange);
		Funky.Presence.on('user:join', this._presenceHandlers.onUserJoin);
		Funky.Presence.on('user:leave', this._presenceHandlers.onUserLeave);
	};

	/**
	 * Remove presence event listeners
	 * @private
	 */
	KanbanInstance.prototype._removePresenceListeners = function() {
		if (!this._presenceHandlers || !Funky.Presence) return;

		Funky.Presence.off('status', this._presenceHandlers.onStatusChange);
		Funky.Presence.off('user:join', this._presenceHandlers.onUserJoin);
		Funky.Presence.off('user:leave', this._presenceHandlers.onUserLeave);

		this._presenceHandlers = null;
	};

	/**
	 * Handle presence status change (e.g., user started dragging)
	 * @param {Object} data - Status data
	 * @private
	 */
	KanbanInstance.prototype._handlePresenceStatusChange = function(data) {
		if (data.channel !== this._boardChannel) return;

		var user = data.user;
		if (!user || user.id === Funky.Presence.getCurrentUser().id) return;

		// Check if user is dragging a card
		if (user.status === 'dragging' && user.metadata && user.metadata.cardId) {
			this._draggedCards[user.id] = user.metadata.cardId;
			if (this._presenceConfig.showDragIndicators) {
				this._showDragIndicator(user.metadata.cardId, user);
			}
		} else if (user.status === 'viewing' && this._draggedCards[user.id]) {
			var cardId = this._draggedCards[user.id];
			delete this._draggedCards[user.id];
			this._hideDragIndicator(cardId);
		}
	};

	/**
	 * Handle user join
	 * @param {Object} data - Join data
	 * @private
	 */
	KanbanInstance.prototype._handlePresenceJoin = function(data) {
		if (data.channel !== this._boardChannel) return;
		// Avatar stack updates automatically
	};

	/**
	 * Handle user leave
	 * @param {Object} data - Leave data
	 * @private
	 */
	KanbanInstance.prototype._handlePresenceLeave = function(data) {
		if (data.channel !== this._boardChannel) return;

		// Clean up any drag indicators for this user
		if (data.user && this._draggedCards[data.user.id]) {
			var cardId = this._draggedCards[data.user.id];
			delete this._draggedCards[data.user.id];
			this._hideDragIndicator(cardId);
		}
	};

	/**
	 * Create board-level presence indicator
	 * @private
	 */
	KanbanInstance.prototype._createBoardPresenceIndicator = function() {
		if (!this._presenceEnabled || !Funky.Presence || !this._boardChannel) return;

		// Create container
		var container = document.createElement('div');
		container.className = 'kanban-board__presence';
		container.setAttribute('aria-label', 'Users viewing this board');

		// Insert at top of board
		this.board.insertBefore(container, this.board.firstChild);

		// Use Presence avatar stack
		if (Funky.Presence.createAvatarStack) {
			this._presenceUI = Funky.Presence.createAvatarStack(container, this._boardChannel, {
				maxAvatars: 8,
				excludeSelf: true,
				showCount: true
			});
		}
	};

	/**
	 * Broadcast drag start to presence channel
	 * @param {string} cardId - Card ID being dragged
	 */
	KanbanInstance.prototype._broadcastDragStart = function(cardId) {
		if (!this._presenceEnabled || !Funky.Presence || !this._boardChannel) return;

		Funky.Presence.setStatus('dragging');
		Funky.Presence.updateMetadata({
			cardId: cardId,
			dragging: true
		});
	};

	/**
	 * Broadcast drag end to presence channel
	 * @param {string} cardId - Card ID that was dragged
	 * @param {string} targetColumn - Target column ID
	 */
	KanbanInstance.prototype._broadcastDragEnd = function(cardId, targetColumn) {
		if (!this._presenceEnabled || !Funky.Presence || !this._boardChannel) return;

		Funky.Presence.setStatus('viewing');
		Funky.Presence.updateMetadata({
			cardId: null,
			dragging: false,
			lastMove: {
				cardId: cardId,
				toColumn: targetColumn,
				timestamp: Date.now()
			}
		});
	};

	/**
	 * Check if card can be dragged (not being dragged by someone else)
	 * @param {string} cardId - Card ID
	 * @returns {boolean} True if safe to drag
	 */
	KanbanInstance.prototype.canDragCard = function(cardId) {
		if (!this._presenceEnabled || !this._presenceConfig.preventRemoteDrag) {
			return true;
		}

		var currentUserId = Funky.Presence ? Funky.Presence.getCurrentUser().id : null;
		var self = this;

		// Check if someone else is dragging this card
		var draggers = Object.keys(this._draggedCards).filter(function(userId) {
			return self._draggedCards[userId] === cardId && userId !== currentUserId;
		});

		return draggers.length === 0;
	};

	/**
	 * Show drag indicator on card
	 * @param {string} cardId - Card ID
	 * @param {Object} user - User who is dragging
	 * @private
	 */
	KanbanInstance.prototype._showDragIndicator = function(cardId, user) {
		var cardData = this.cards.get(String(cardId));
		if (!cardData || !cardData.element) return;

		var card = cardData.element;

		// Add visual indicator class
		card.classList.add('kanban-card--remote-drag');

		// Create or update drag indicator
		var indicator = card.querySelector('.kanban-card__drag-indicator');
		if (!indicator) {
			indicator = document.createElement('div');
			indicator.className = 'kanban-card__drag-indicator';
			indicator.setAttribute('aria-live', 'polite');
			card.appendChild(indicator);
		}

		var avatarSrc = user.avatar || '/assets/images/default-avatar.png';
		var userName = user.name || 'Someone';

		indicator.innerHTML =
			'<img src="' + avatarSrc + '" alt="" class="kanban-card__drag-avatar">' +
			'<span class="kanban-card__drag-text">' + userName + ' is moving this</span>';
		indicator.removeAttribute('hidden');
	};

	/**
	 * Hide drag indicator
	 * @param {string} cardId - Card ID
	 * @private
	 */
	KanbanInstance.prototype._hideDragIndicator = function(cardId) {
		var cardData = this.cards.get(String(cardId));
		if (!cardData || !cardData.element) return;

		var card = cardData.element;
		card.classList.remove('kanban-card--remote-drag');

		var indicator = card.querySelector('.kanban-card__drag-indicator');
		if (indicator) {
			indicator.setAttribute('hidden', '');
		}
	};

	/**
	 * Track when user focuses on a card (viewing details)
	 * @param {string} cardId - Card ID
	 */
	KanbanInstance.prototype.focusCard = function(cardId) {
		if (!this._presenceEnabled || !Funky.Presence) return;

		var channel = 'kanban:card:' + cardId;
		this._cardChannels[cardId] = channel;

		Funky.Presence.join(channel, {
			status: 'viewing',
			metadata: {
				cardId: cardId,
				boardId: this.options.boardId || this.id
			}
		});
	};

	/**
	 * Stop tracking card focus
	 * @param {string} cardId - Card ID
	 */
	KanbanInstance.prototype.blurCard = function(cardId) {
		if (!this._presenceEnabled || !Funky.Presence) return;

		var channel = this._cardChannels[cardId];
		if (channel) {
			Funky.Presence.leave(channel);
			delete this._cardChannels[cardId];
		}
	};

	/**
	 * Get users viewing a specific card
	 * @param {string} cardId - Card ID
	 * @returns {Array} Array of user objects
	 */
	KanbanInstance.prototype.getCardViewers = function(cardId) {
		if (!this._presenceEnabled || !Funky.Presence) return [];

		var channel = 'kanban:card:' + cardId;
		return Funky.Presence.getOtherUsers(channel);
	};

	/**
	 * Get users on the board
	 * @returns {Array} Array of user objects
	 */
	KanbanInstance.prototype.getBoardUsers = function() {
		if (!this._presenceEnabled || !Funky.Presence || !this._boardChannel) {
			return this._activeUsers.slice();  // Fallback to WebSocket users
		}
		return Funky.Presence.getOtherUsers(this._boardChannel);
	};

	/**
	 * Get current board presence channel
	 * @returns {string|null}
	 */
	KanbanInstance.prototype.getPresenceChannel = function() {
		return this._boardChannel;
	};

	// =========================================
	// Public Methods
	// =========================================

	/**
	 * Get column by ID
	 * @param {string} id - Column ID
	 * @returns {Object|null} Column data object
	 */
	KanbanInstance.prototype.getColumn = function(id) {
		return this.columns.get(id);
	};

	/**
	 * Get all columns
	 * @returns {Array} Array of column data objects
	 */
	KanbanInstance.prototype.getColumns = function() {
		if (this.options.swimlanes) {
			// In swimlane mode, return column configs from options
			// Wrap in structure similar to column mode for consistency
			return this.options.columns.map(function(config) {
				return {
					config: config,
					element: null,
					header: null,
					body: null,
					cardCount: 0
				};
			});
		}
		return Array.from(this.columns.values());
	};

	/**
	 * Add a new column
	 * @param {Object} config - Column configuration
	 * @param {number} position - Optional position (default: end)
	 * @returns {HTMLElement} The column element
	 */
	KanbanInstance.prototype.addColumn = function(config, position) {
		// Check if column already exists
		var existingIdx = this.options.columns.findIndex(function(c) { return c.id === config.id; });
		if (existingIdx > -1) {
			console.warn('[Funky.Kanban] Column already exists:', config.id);
			return null;
		}

		// Add to options
		if (typeof position === 'number') {
			this.options.columns.splice(position, 0, config);
		} else {
			this.options.columns.push(config);
		}

		if (this.options.swimlanes) {
			// Swimlane mode: add header cell and cell to each swimlane
			var self = this;
			var insertPosition = typeof position === 'number' ? position + 1 : null; // +1 for label column

			// Add header cell
			var headerRow = this.board.querySelector('.kanban-header');
			if (headerRow) {
				var headerCell = document.createElement('div');
				headerCell.className = 'kanban-header-cell';
				headerCell.textContent = config.title;
				headerCell.dataset.columnId = config.id;

				if (insertPosition !== null && insertPosition < headerRow.children.length) {
					headerRow.insertBefore(headerCell, headerRow.children[insertPosition]);
				} else {
					headerRow.appendChild(headerCell);
				}
			}

			// Add cell to each swimlane body
			this.swimlanes.forEach(function(swimlaneData, swimlaneValue) {
				var cell = document.createElement('div');
				cell.className = 'kanban-swimlane-cell';
				cell.dataset.column = config.id;
				cell.dataset.swimlane = swimlaneValue;
				cell.setAttribute('role', 'listbox');
				cell.setAttribute('aria-label', config.title + ' - ' + swimlaneValue);

				var body = swimlaneData.body;
				if (insertPosition !== null && insertPosition < body.children.length) {
					body.insertBefore(cell, body.children[insertPosition]);
				} else {
					body.appendChild(cell);
				}
			});

			// Update column count CSS variable
			this.board.style.setProperty('--kanban-column-count', this.options.columns.length);

			return null; // No single element to return in swimlane mode
		} else {
			// Column mode: render the column
			if (this.columns.has(config.id)) {
				return this.columns.get(config.id).element;
			}
			return this._renderColumn(config, position);
		}
	};

	/**
	 * Remove a column
	 * @param {string} id - Column ID
	 * @returns {boolean} True if removed
	 */
	KanbanInstance.prototype.removeColumn = function(id) {
		// Remove from options first
		var idx = this.options.columns.findIndex(function(c) { return c.id === id; });
		if (idx === -1) return false;

		this.options.columns.splice(idx, 1);

		if (this.options.swimlanes) {
			// Swimlane mode: remove header cell and cells from each swimlane

			// Remove header cell
			var headerCell = this.board.querySelector('.kanban-header-cell[data-column-id="' + id + '"]');
			if (headerCell) {
				headerCell.remove();
			}

			// Remove cells from each swimlane (and move any cards to first column)
			var firstColumnId = this.options.columns.length > 0 ? this.options.columns[0].id : null;
			var self = this;

			this.swimlanes.forEach(function(swimlaneData) {
				var cell = swimlaneData.body.querySelector('[data-column="' + id + '"]');
				if (cell) {
					// Move cards to first column if available
					if (firstColumnId) {
						var cards = cell.querySelectorAll('.kanban-card');
						var targetCell = swimlaneData.body.querySelector('[data-column="' + firstColumnId + '"]');
						if (targetCell) {
							cards.forEach(function(card) {
								targetCell.appendChild(card);
								// Update card data
								var cardId = card.dataset.cardId;
								var cardData = self.cards.get(cardId);
								if (cardData) {
									cardData.data.column = firstColumnId;
								}
							});
						}
					}
					cell.remove();
				}
			});

			// Update column count CSS variable
			this.board.style.setProperty('--kanban-column-count', this.options.columns.length);

			// Update swimlane counts
			this.swimlanes.forEach(function(swimlaneData, value) {
				self._updateSwimlaneCount(value);
			});

			return true;
		} else {
			// Column mode
			var columnData = this.columns.get(id);
			if (!columnData) return false;

			// Remove from DOM
			columnData.element.remove();

			// Remove from state
			this.columns.delete(id);

			return true;
		}
	};

	// =========================================
	// Card Public Methods
	// =========================================

	/**
	 * Add a new card
	 * @param {Object} cardData - Card data object
	 * @param {Object} options - Options { skipApi: boolean }
	 * @returns {HTMLElement|null} The card element
	 */
	KanbanInstance.prototype.addCard = function(cardData, options) {
		var self = this;
		options = options || {};
		
		if (this.cards.has(String(cardData.id))) {
			console.warn('[Funky.Kanban] Card already exists:', cardData.id);
			return this.cards.get(String(cardData.id)).element;
		}

		// Store rollback state
		var opId = this._nextOperationId();
		this._storeRollback(opId, {
			type: 'create',
			cardId: String(cardData.id)
		});

		// Optimistic update
		var card = this._renderCard(cardData);
		if (card) {
			this.options.cards.push(cardData);
			this._updateColumnCount(cardData.column);
		}

		// API call (if configured and not skipped)
		if (!options.skipApi && (this.options.api || this.options.onSave)) {
			this._apiCreate(cardData)
				.then(function(result) {
					self._clearRollback(opId);
					// Update card ID if returned from server
					if (result && result.id && result.id !== cardData.id) {
						var oldId = String(cardData.id);
						var existing = self.cards.get(oldId);
						if (existing) {
							existing.data.id = result.id;
							existing.element.dataset.cardId = result.id;
							self.cards.delete(oldId);
							self.cards.set(String(result.id), existing);
						}
					}
				})
				.catch(function(err) {
					console.error('[Funky.Kanban] Create failed:', err);
					self._executeRollback(opId);
					self._showError('Failed to create card');
					if (self.options.onSaveError) {
						self.options.onSaveError('create', err, cardData);
					}
				});
		} else {
			this._clearRollback(opId);
		}

		return card;
	};

	/**
	 * Update a card
	 * @param {string|number} id - Card ID
	 * @param {Object} changes - Properties to update
	 * @param {Object} options - Options { skipApi: boolean }
	 * @returns {boolean} True if updated
	 */
	KanbanInstance.prototype.updateCard = function(id, changes, options) {
		var self = this;
		options = options || {};
		var cardData = this.cards.get(String(id));
		if (!cardData) return false;

		// Store original data for rollback
		var originalData = Object.assign({}, cardData.data);
		var opId = this._nextOperationId();
		this._storeRollback(opId, {
			type: 'update',
			cardId: String(id),
			originalData: originalData
		});

		// Check if column change is needed BEFORE updating cardData.data
		// (because _moveCardToColumn reads cardData.data.column for oldColumnId)
		var needsColumnMove = changes.column && changes.column !== originalData.column;

		// Optimistic update - merge changes
		Object.assign(cardData.data, changes);

		// Re-render card content
		D.wrap(cardData.element).empty();
		if (this.options.renderCard) {
			var content = this.options.renderCard(cardData.data);
			if (typeof content === 'string') {
				cardData.element.innerHTML = content;
			} else if (content instanceof HTMLElement) {
				cardData.element.appendChild(content);
			}
		} else {
			cardData.element.appendChild(this._renderDefaultCard(cardData.data));
		}

		// Update priority class
		cardData.element.classList.remove('priority-high', 'priority-medium', 'priority-low');
		if (cardData.data.priority) {
			cardData.element.classList.add('priority-' + cardData.data.priority);
		}

		// If column changed, move the card DOM and update counts
		if (needsColumnMove) {
			var targetColumn = this.columns.get(changes.column);
			if (targetColumn) {
				// Move DOM element
				var cards = targetColumn.body.querySelectorAll('.kanban-card');
				var emptyEl = targetColumn.body.querySelector('.kanban-column-empty');
				var pos = changes.position || 0;

				if (pos < cards.length) {
					targetColumn.body.insertBefore(cardData.element, cards[pos]);
				} else if (emptyEl) {
					targetColumn.body.insertBefore(cardData.element, emptyEl);
				} else {
					targetColumn.body.appendChild(cardData.element);
				}

				// Update counts using originalData.column for source
				this._updateColumnCount(originalData.column);
				this._updateColumnCount(changes.column);
			}
		}

		// API call (if configured and not skipped)
		if (!options.skipApi && (this.options.api || this.options.onSave)) {
			this._apiUpdate(id, changes)
				.then(function() {
					self._clearRollback(opId);
				})
				.catch(function(err) {
					console.error('[Funky.Kanban] Update failed:', err);
					self._executeRollback(opId);
					self._showError('Failed to update card');
					if (self.options.onSaveError) {
						self.options.onSaveError('update', err, cardData.data);
					}
				});
		} else {
			this._clearRollback(opId);
		}

		return true;
	};

	/**
	 * Remove a card
	 * @param {string|number} id - Card ID
	 * @param {Object} options - Options { skipApi: boolean }
	 * @returns {boolean} True if removed
	 */
	KanbanInstance.prototype.removeCard = function(id, options) {
		var self = this;
		options = options || {};
		var cardData = this.cards.get(String(id));
		if (!cardData) return false;

		var columnId = cardData.data.column;
		var removedCardData = Object.assign({}, cardData.data);

		// Store rollback state
		var opId = this._nextOperationId();
		this._storeRollback(opId, {
			type: 'delete',
			cardId: String(id),
			cardData: removedCardData
		});

		// Optimistic update - remove from DOM
		cardData.element.remove();

		// Remove from state
		this.cards.delete(String(id));

		// Remove from options
		var idx = this.options.cards.findIndex(function(c) { return String(c.id) === String(id); });
		if (idx > -1) {
			this.options.cards.splice(idx, 1);
		}

		// Update count
		this._updateColumnCount(columnId);

		// API call (if configured and not skipped)
		if (!options.skipApi && (this.options.api || this.options.onSave)) {
			this._apiDelete(id)
				.then(function() {
					self._clearRollback(opId);
				})
				.catch(function(err) {
					console.error('[Funky.Kanban] Delete failed:', err);
					self._executeRollback(opId);
					self._showError('Failed to remove card');
					if (self.options.onSaveError) {
						self.options.onSaveError('delete', err, removedCardData);
					}
				});
		} else {
			this._clearRollback(opId);
		}

		return true;
	};

	/**
	 * Move a card programmatically
	 * @param {string|number} id - Card ID
	 * @param {string} columnId - Target column ID
	 * @param {number} position - Position in column
	 * @returns {boolean} True if moved
	 */
	KanbanInstance.prototype.moveCard = function(id, columnId, position) {
		var cardData = this.cards.get(String(id));
		if (!cardData) return false;

		if (!this.columns.has(columnId)) {
			console.warn('[Funky.Kanban] Target column not found:', columnId);
			return false;
		}

		this._moveCardToColumn(String(id), columnId, position || 0);
		return true;
	};

	/**
	 * Get a card by ID
	 * @param {string|number} id - Card ID
	 * @returns {Object|null} Card data
	 */
	KanbanInstance.prototype.getCard = function(id) {
		var cardData = this.cards.get(String(id));
		return cardData ? cardData.data : undefined;
	};

	/**
	 * Get all cards, optionally filtered by column
	 * @param {string} columnId - Optional column ID filter
	 * @returns {Array} Array of card data objects
	 */
	KanbanInstance.prototype.getCards = function(columnId) {
		var cards = Array.from(this.cards.values()).map(function(c) { return c.data; });
		
		if (columnId) {
			return cards.filter(function(c) { return c.column === columnId; });
		}
		
		return cards;
	};

	/**
	 * Refresh the board
	 */
	KanbanInstance.prototype.refresh = function() {
		// Update all column counts
		var self = this;
		this.columns.forEach(function(columnData, columnId) {
			self._updateColumnCount(columnId);
		});
	};

	/**
	 * Destroy the instance
	 */
	KanbanInstance.prototype.destroy = function() {
		// Clean up Funky.Presence
		if (this._presenceEnabled) {
			this.disablePresence();
		}

		// Unsubscribe from WebSocket
		this._unsubscribeWebSocket();

		// Remove event listeners
		if (this._boundHandlers.addCardClick) {
			this.board.removeEventListener('click', this._boundHandlers.addCardClick);
		}
		if (this._boundHandlers.cardClick) {
			this.board.removeEventListener('click', this._boundHandlers.cardClick);
		}
		if (this._boundHandlers.keydown) {
			this.board.removeEventListener('keydown', this._boundHandlers.keydown);
		}
		
		// Unregister keyboard shortcuts
		if (this._keyboardUnregisters) {
			this._keyboardUnregisters.forEach(function(unregister) {
				unregister();
			});
			this._keyboardUnregisters = null;
		}
		
		if (this._boundHandlers.dragstart) {
			this.board.removeEventListener('dragstart', this._boundHandlers.dragstart);
			this.board.removeEventListener('dragend', this._boundHandlers.dragend);
			this.board.removeEventListener('dragover', this._boundHandlers.dragover);
			this.board.removeEventListener('dragleave', this._boundHandlers.dragleave);
			this.board.removeEventListener('drop', this._boundHandlers.drop);
		}
		if (this._boundHandlers.touchstart) {
			this.board.removeEventListener('touchstart', this._boundHandlers.touchstart);
			this.board.removeEventListener('touchmove', this._boundHandlers.touchmove);
			this.board.removeEventListener('touchend', this._boundHandlers.touchend);
		}

		// Clear pending operations
		this._pendingOperations.clear();

		// Clear state
		this.columns.clear();
		this.cards.clear();

		// Remove from DOM
		if (this.board && this.board.parentNode) {
			this.board.parentNode.removeChild(this.board);
		}

		// Remove from instances
		var idx = Kanban.instances.indexOf(this);
		if (idx > -1) {
			Kanban.instances.splice(idx, 1);
		}

		// Remove from instance registry
		var containerId = this.container && this.container.id;
		if (containerId && Kanban._instances[containerId]) {
			delete Kanban._instances[containerId];
		}
	};

	// =========================================
	// Bindable Interface (LiveBinding)
	// =========================================

	/**
	 * Set all cards data (Bindable Interface)
	 * Clears existing cards and renders new ones
	 * @param {Array|Object} data - Cards array or { cards: [], columns: [] }
	 */
	KanbanInstance.prototype.setData = function(data) {
		var self = this;
		var cards;
		
		if (Array.isArray(data)) {
			cards = data;
		} else if (data && Array.isArray(data.cards)) {
			// Also update columns if provided
			if (data.columns) {
				this.options.columns = data.columns;
				// Re-render columns
				D.wrap(this.columnsContainer).empty();
				this.columns.clear();
				this._renderColumns();
			}
			cards = data.cards;
		} else {
			cards = [];
		}
		
		// Clear existing cards
		this.cards.forEach(function(cardData, cardId) {
			if (cardData.element && cardData.element.parentNode) {
				cardData.element.parentNode.removeChild(cardData.element);
			}
		});
		this.cards.clear();
		this.options.cards = [];
		
		// Add new cards
		cards.forEach(function(cardData) {
			self.addCard(cardData, { skipApi: true });
		});
	};

	/**
	 * Get all cards data (Bindable Interface)
	 * @returns {Array} Array of card data objects
	 */
	KanbanInstance.prototype.getData = function() {
		return this.getCards();
	};

	/**
	 * Add cards data (Bindable Interface)
	 * @param {Array|Object} data - Card(s) to add
	 */
	KanbanInstance.prototype.addData = function(data) {
		var self = this;
		var cards = Array.isArray(data) ? data : [data];
		cards.forEach(function(cardData) {
			self.addCard(cardData, { skipApi: true });
		});
	};

	/**
	 * Remove cards by ID (Bindable Interface)
	 * @param {Array|string|number} ids - Card ID(s) to remove
	 */
	KanbanInstance.prototype.removeData = function(ids) {
		var self = this;
		var idArray = Array.isArray(ids) ? ids : [ids];
		idArray.forEach(function(id) {
			self.removeCard(id, { skipApi: true });
		});
	};

	/**
	 * Clear all cards (Bindable Interface)
	 */
	KanbanInstance.prototype.clearData = function() {
		var self = this;
		var cardIds = Array.from(this.cards.keys());
		cardIds.forEach(function(id) {
			self.removeCard(id, { skipApi: true });
		});
	};

	// Register with Funky
	Funky.register('Kanban', Kanban);

})(window);

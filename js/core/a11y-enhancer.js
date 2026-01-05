/**
 * Funky.A11yEnhancer - Automatic Screen Reader Enhancement
 * 
 * Automatically enhances tables and lists within scoped containers
 * with visually-hidden text alternatives for screen readers that
 * don't render visual table/list structures.
 * 
 * Usage:
 *   // Add scope attribute to container
 *   <main data-a11y-scope>
 *     <table>...</table>
 *     <ul>...</ul>
 *   </main>
 *   
 *   // Manual initialization
 *   Funky.A11yEnhancer.init();
 *   
 *   // Start observing for dynamic content
 *   Funky.A11yEnhancer.observe();
 *   
 *   // Skip specific elements
 *   <table data-a11y-skip>...</table>
 * 
 * @version 1.0.2
 */
(function(window) {
	'use strict';

	// Ensure Funky registry exists
	if (!window.Funky || !window.Funky.register) {
		console.error('[Funky.A11yEnhancer] Registry not found. Load namespace.js first.');
		return;
	}

	// Prevent double-registration
	if (Funky.isRegistered('A11yEnhancer')) {
		return;
	}

	// Shortcuts
	var D = Funky.Dom;

	// Store observers for cleanup
	var observers = [];

	// Bullet characters by depth for unordered lists
	var UL_BULLETS = ['•', '◦', '▪'];

	// Configuration
	var config = {
		scopeSelector: '[data-a11y-scope]',
		skipAttribute: 'data-a11y-skip',
		enhancedAttribute: 'data-a11y-enhanced',
		tableMaxHeaders: 10,
		enabled: true
	};

	/**
	 * Get bullet character for unordered list at given depth
	 * @param {number} depth - Nesting depth (0-based)
	 * @returns {string}
	 */
	function getBullet(depth) {
		return UL_BULLETS[depth % UL_BULLETS.length];
	}

	/**
	 * Get indent string for given depth
	 * @param {number} depth - Nesting depth (0-based)
	 * @returns {string}
	 */
	function getIndent(depth) {
		var indent = '';
		for (var i = 0; i < depth; i++) {
			indent += '  ';
		}
		return indent;
	}

	/**
	 * Extract direct text content from element (not nested elements)
	 * @param {HTMLElement} element
	 * @returns {string}
	 */
	function getDirectText(element) {
		var text = '';
		for (var i = 0; i < element.childNodes.length; i++) {
			var node = element.childNodes[i];
			if (node.nodeType === Node.TEXT_NODE) {
				text += node.textContent;
			} else if (node.nodeType === Node.ELEMENT_NODE) {
				// Include inline elements but not nested lists
				var tagName = node.tagName.toLowerCase();
				if (tagName !== 'ul' && tagName !== 'ol') {
					text += node.textContent;
				}
			}
		}
		return text.trim().replace(/\s+/g, ' ');
	}

	/**
	 * Get nested list within an li element
	 * @param {HTMLElement} li
	 * @returns {HTMLElement|null}
	 */
	function getNestedList(li) {
		var children = li.children;
		for (var i = 0; i < children.length; i++) {
			var tagName = children[i].tagName.toLowerCase();
			if (tagName === 'ul' || tagName === 'ol') {
				return children[i];
			}
		}
		return null;
	}

	/**
	 * Recursively walk a list structure and generate text representation
	 * @param {HTMLElement} listElement - ul or ol element
	 * @param {number} depth - Current nesting depth
	 * @returns {Array<string>} Lines of text
	 */
	function walkList(listElement, depth) {
		var lines = [];
		var isOrdered = listElement.tagName.toLowerCase() === 'ol';
		var counter = 1;
		var items = listElement.children;

		for (var i = 0; i < items.length; i++) {
			var item = items[i];
			if (item.tagName.toLowerCase() !== 'li') {
				continue;
			}

			var indent = getIndent(depth);
			var prefix = isOrdered ? (counter + '. ') : (getBullet(depth) + ' ');
			var text = getDirectText(item);

			if (text) {
				lines.push(indent + prefix + text);
			}

			// Check for nested list
			var nestedList = getNestedList(item);
			if (nestedList) {
				var nestedLines = walkList(nestedList, depth + 1);
				lines = lines.concat(nestedLines);
			}

			counter++;
		}

		return lines;
	}

	/**
	 * Create visually-hidden element with text content
	 * @param {string} text
	 * @param {string} [tag='span']
	 * @returns {HTMLElement}
	 */
	function createHiddenText(text, tag) {
		var el = document.createElement(tag || 'span');
		el.className = 'visually-hidden';
		// No role - let it be inline text that's read naturally in document flow
		el.textContent = text;
		return el;
	}

	/**
	 * Enhance a standard table with visually-hidden summary
	 * @param {HTMLElement} table
	 */
	function enhanceTable(table) {
		// Skip if already enhanced, marked to skip, or already aria-hidden
		if (table.hasAttribute(config.enhancedAttribute) || 
			table.hasAttribute(config.skipAttribute) ||
			table.getAttribute('aria-hidden') === 'true') {
			return;
		}

		// Skip tables that already have proper semantic structure (caption + thead)
		// These are already accessible to screen readers
		var caption = table.querySelector('caption');
		var thead = table.querySelector('thead');
		if (caption && thead) {
			// Well-structured table - just mark as enhanced, don't add alternative
			table.setAttribute(config.enhancedAttribute, 'true');
			return;
		}

		var captionText = caption ? caption.textContent.trim() : '';
		var tbody = table.querySelector('tbody') || table;
		var headerRow = thead ? thead.querySelector('tr') : table.querySelector('tr');
		var headers = [];

		if (headerRow) {
			var ths = headerRow.querySelectorAll('th');
			for (var i = 0; i < ths.length && i < config.tableMaxHeaders; i++) {
				var headerText = ths[i].textContent.trim();
				if (headerText) {
					headers.push(headerText);
				}
			}
		}

		var rows = tbody.querySelectorAll('tr');
		var rowCount = thead ? rows.length : Math.max(0, rows.length - 1);

		// Build summary text
		var summaryParts = [];
		if (captionText) {
			summaryParts.push('Table: ' + captionText + '.');
		} else {
			summaryParts.push('Table.');
		}
		summaryParts.push(headers.length + ' columns, ' + rowCount + ' rows.');
		if (headers.length > 0) {
			summaryParts.push('Columns: ' + headers.join(', ') + '.');
		}

		var summary = summaryParts.join(' ');

		// Create hidden summary element
		var hiddenEl = createHiddenText(summary);
		hiddenEl.setAttribute('data-a11y-table-summary', '');

		// Insert before table
		table.parentNode.insertBefore(hiddenEl, table);

		// Mark table as enhanced (but don't hide - let screen readers read both)
		table.setAttribute(config.enhancedAttribute, 'true');
	}

	/**
	 * Enhance a DataTable with visible-row content
	 * @param {HTMLElement} table
	 */
	function enhanceDataTable(table) {
		// Find or create live region for this table
		var tableId = table.id || 'datatable-' + Date.now();
		var liveRegionId = tableId + '-a11y-live';
		var liveRegion = document.getElementById(liveRegionId);

		if (!liveRegion) {
			liveRegion = document.createElement('div');
			liveRegion.id = liveRegionId;
			liveRegion.className = 'visually-hidden';
			liveRegion.setAttribute('role', 'status');
			liveRegion.setAttribute('aria-live', 'polite');
			liveRegion.setAttribute('aria-atomic', 'true');
			table.parentNode.insertBefore(liveRegion, table);
		}

		// Get table headers
		var headerRow = table.querySelector('thead tr');
		var headers = [];
		if (headerRow) {
			var ths = headerRow.querySelectorAll('th');
			for (var i = 0; i < ths.length; i++) {
				headers.push(ths[i].textContent.trim());
			}
		}

		// Get visible rows from tbody
		var tbody = table.querySelector('tbody');
		if (!tbody) return;

		var rows = tbody.querySelectorAll('tr');
		var rowTexts = [];

		for (var r = 0; r < rows.length; r++) {
			var row = rows[r];
			var cells = row.querySelectorAll('td');
			var cellTexts = [];

			for (var c = 0; c < cells.length; c++) {
				var cellText = cells[c].textContent.trim().replace(/\s+/g, ' ');
				if (headers[c] && cellText) {
					cellTexts.push(headers[c] + ': ' + cellText);
				} else if (cellText) {
					cellTexts.push(cellText);
				}
			}

			if (cellTexts.length > 0) {
				rowTexts.push('Row ' + (r + 1) + ': ' + cellTexts.join(', ') + '.');
			}
		}

		// Get pagination info if available
		var wrapper = table.closest('.dataTables_wrapper');
		var info = '';
		if (wrapper) {
			var infoEl = wrapper.querySelector('.dataTables_info');
			if (infoEl) {
				info = infoEl.textContent.trim();
			}
		}

		// Build announcement
		var announcement = '';
		if (info) {
			announcement = info + '. ';
		}
		announcement += rowTexts.join(' ');

		liveRegion.textContent = announcement;

		// Mark table
		table.setAttribute(config.enhancedAttribute, 'true');
		table.setAttribute('aria-hidden', 'true');
	}

	/**
	 * Enhance a list with visually-hidden text representation
	 * @param {HTMLElement} list - ul or ol element
	 */
	function enhanceList(list) {
		// Skip if already enhanced, marked to skip, or already aria-hidden
		if (list.hasAttribute(config.enhancedAttribute) || 
			list.hasAttribute(config.skipAttribute) ||
			list.getAttribute('aria-hidden') === 'true') {
			return;
		}

		// Skip nested lists (they're handled by parent)
		if (list.parentNode && list.parentNode.tagName.toLowerCase() === 'li') {
			return;
		}

		// Skip lists inside elements that are aria-hidden (e.g., code examples in <pre>)
		var parent = list.parentNode;
		while (parent && parent !== document.body) {
			if (parent.getAttribute('aria-hidden') === 'true') {
				return;
			}
			parent = parent.parentNode;
		}

		// Walk the list structure
		var lines = walkList(list, 0);
		if (lines.length === 0) {
			return;
		}

		// Build text representation - use semicolons for inline reading
		var listType = list.tagName.toLowerCase() === 'ol' ? 'Ordered list' : 'List';
		var text = listType + ' with ' + lines.length + ' items: ' + lines.join('; ') + '.';

		// Create hidden element
		var hiddenEl = createHiddenText(text);
		hiddenEl.setAttribute('data-a11y-list-summary', '');

		// Insert before list
		list.parentNode.insertBefore(hiddenEl, list);

		// Mark list as enhanced (but don't hide - let screen readers read both)
		list.setAttribute(config.enhancedAttribute, 'true');
	}

	/**
	 * Enhance all tables and lists within a container
	 * @param {HTMLElement} container
	 */
	function enhanceContainer(container) {
		if (!config.enabled) return;

		// Enhance tables (skip DataTables - they're handled separately)
		var tables = container.querySelectorAll('table:not(.dataTable)');
		for (var t = 0; t < tables.length; t++) {
			enhanceTable(tables[t]);
		}

		// Enhance lists (only top-level, not nested)
		var lists = container.querySelectorAll('ul, ol');
		for (var l = 0; l < lists.length; l++) {
			enhanceList(lists[l]);
		}
	}

	// =========================================================================
	// Public API
	// =========================================================================

	var A11yEnhancer = {
		/**
		 * Initialize enhancement for all scoped containers
		 * @param {HTMLElement|string} [scope] - Optional specific container to initialize
		 */
		init: function(scope) {
			if (!config.enabled) return;

			var containers;
			if (scope) {
				var el = typeof scope === 'string' ? document.querySelector(scope) : scope;
				containers = el ? [el] : [];
			} else {
				containers = document.querySelectorAll(config.scopeSelector);
			}

			for (var i = 0; i < containers.length; i++) {
				enhanceContainer(containers[i]);
			}
		},

		/**
		 * Start observing scoped containers for dynamic content
		 */
		observe: function() {
			if (!config.enabled) return;

			var containers = document.querySelectorAll(config.scopeSelector);

			for (var i = 0; i < containers.length; i++) {
				var container = containers[i];

				// Skip if already observing
				if (container.hasAttribute('data-a11y-observing')) {
					continue;
				}

				var observer = new MutationObserver(function(mutations) {
					mutations.forEach(function(mutation) {
						mutation.addedNodes.forEach(function(node) {
							if (node.nodeType === Node.ELEMENT_NODE) {
								// Check if the added node is a table or list
								var tagName = node.tagName.toLowerCase();
								if (tagName === 'table' && !node.classList.contains('dataTable')) {
									enhanceTable(node);
								} else if (tagName === 'ul' || tagName === 'ol') {
									enhanceList(node);
								}

								// Also check children
								if (node.querySelectorAll) {
									var tables = node.querySelectorAll('table:not(.dataTable)');
									for (var t = 0; t < tables.length; t++) {
										enhanceTable(tables[t]);
									}
									var lists = node.querySelectorAll('ul, ol');
									for (var l = 0; l < lists.length; l++) {
										enhanceList(lists[l]);
									}
								}
							}
						});
					});
				});

				observer.observe(container, {
					childList: true,
					subtree: true
				});

				observers.push(observer);
				container.setAttribute('data-a11y-observing', 'true');
			}
		},

		/**
		 * Stop all observers
		 */
		disconnect: function() {
			observers.forEach(function(observer) {
				observer.disconnect();
			});
			observers = [];

			var containers = document.querySelectorAll('[data-a11y-observing]');
			for (var i = 0; i < containers.length; i++) {
				containers[i].removeAttribute('data-a11y-observing');
			}
		},

		/**
		 * Manually enhance a specific element
		 * @param {HTMLElement} element - Table or list element
		 */
		enhance: function(element) {
			if (!element || !element.tagName) return;

			var tagName = element.tagName.toLowerCase();
			if (tagName === 'table') {
				if (element.classList.contains('dataTable')) {
					enhanceDataTable(element);
				} else {
					enhanceTable(element);
				}
			} else if (tagName === 'ul' || tagName === 'ol') {
				enhanceList(element);
			}
		},

		/**
		 * Handle DataTable draw event
		 * @param {Event} e - DataTables draw event
		 * @param {Object} settings - DataTables settings
		 */
		onDataTableDraw: function(e, settings) {
			var table = settings.nTable;
			if (table) {
				enhanceDataTable(table);
			}
		},

		/**
		 * Configure the enhancer
		 * @param {Object} options
		 */
		configure: function(options) {
			if (options) {
				for (var key in options) {
					if (options.hasOwnProperty(key) && config.hasOwnProperty(key)) {
						config[key] = options[key];
					}
				}
			}
		},

		/**
		 * Enable/disable enhancement
		 * @param {boolean} enabled
		 */
		setEnabled: function(enabled) {
			config.enabled = enabled;
		},

		/**
		 * Check if enhancement is enabled
		 * @returns {boolean}
		 */
		isEnabled: function() {
			return config.enabled;
		}
	};

	// =========================================================================
	// Auto-initialization
	// =========================================================================

	function autoInit() {
		A11yEnhancer.init();
		A11yEnhancer.observe();

		// Listen for DataTables draw events
		document.addEventListener('draw.dt', A11yEnhancer.onDataTableDraw);
	}

	// Initialize on DOM ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', autoInit);
	} else {
		autoInit();
	}

	// Re-initialize on SPA navigation
	document.addEventListener('funky.spa.pageload', function() {
		A11yEnhancer.init();
		A11yEnhancer.observe();
	});

	// Register component
	Funky.register('A11yEnhancer', A11yEnhancer);

})(window);

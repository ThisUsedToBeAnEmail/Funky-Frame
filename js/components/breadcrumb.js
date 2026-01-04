/**
 * Funky Breadcrumb - Dynamic Breadcrumb Generation
 * 
 * Auto-generates breadcrumbs from URL path with:
 * - Route label mappings
 * - Custom page title support via data attributes
 * - Auto-initialization on page load and SPA navigation
 * 
 * Usage:
 *   Funky.Breadcrumb.render('#breadcrumbContainer');
 *   var crumbs = Funky.Breadcrumb.generate('/web/trades/123/edit');
 * 
 * Auto-init:
 *   <nav id="pageBreadcrumb"></nav>
 *   <div data-breadcrumb-auto></div>
 * 
 * @version 1.0.0
 */
(function(window) {
	'use strict';

	// Ensure Funky registry exists
	if (!window.Funky || !window.Funky.register) {
		console.error('[Funky.Breadcrumb] Registry not found. Load namespace.js first.');
		return;
	}

	// Instance registry
	var _instances = Funky.Registry.createInstanceRegistry('Breadcrumb');

	var FunkyBreadcrumb = {
		// Route label mappings (breadcrumb labels - may differ from page titles)
		labels: {
			'trade': 'Trades',
			'trades': 'Trades',
			'trade_action': 'Trade Actions',
			'trade_actions': 'Trade Actions',
			'client': 'Clients',
			'clients': 'Clients',
			'client_relationship': 'Client Relationships',
			'client_relationships': 'Client Relationships',
			'allocation': 'Allocations',
			'allocations': 'Allocations',
			'security': 'Securities',
			'securities': 'Securities',
			'fx_rate': 'FX Rates',
			'fx_rates': 'FX Rates',
			'template': 'Templates',
			'templates': 'Templates',
			'report_format': 'Report Formats',
			'report_formats': 'Report Formats',
			'user': 'Users',
			'users': 'Users',
			'audit_log': 'Audit Log',
			'audit_logs': 'Audit Log',
			'trade_allocation': 'Trade Allocations',
			'trade_allocations': 'Trade Allocations',
			'realtime': 'Real-Time Files',
			'queue': 'Queue',
			'profile': 'Profile',
			'home': 'Dashboard',
			'list': 'List',
			'edit': 'Edit',
			'view': 'View',
			'new': 'New',
			'create': 'Create'
		},

		/**
		 * Add or update label mappings
		 * @param {Object} newLabels - Object of route -> label mappings
		 */
		addLabels: function(newLabels) {
			Object.assign(this.labels, newLabels);
		},

		/**
		 * Generate breadcrumbs from current URL
		 * @param {string} path - URL path (defaults to current location)
		 * @returns {Array} Array of breadcrumb items { label, url, active, icon }
		 */
		generate: function(path) {
			var self = this;
			path = path || window.location.pathname;
			var parts = path.split('/').filter(function(p) { return p && p !== 'web'; });
			var crumbs = [{ label: 'Home', url: '/', icon: 'fa-home' }];

			var currentPath = '';

			parts.forEach(function(part, index) {
				currentPath += '/' + part;
				var isLast = index === parts.length - 1;

				// Skip numeric IDs in breadcrumbs (but include in URL)
				if (/^\d+$/.test(part)) return;

				// Get label from mappings or format the part
				var label = self.labels[part] || self.formatLabel(part);

				// Check for custom data attribute on page
				var pageTitle = document.querySelector('[data-breadcrumb-title]');
				if (isLast && pageTitle) {
					label = pageTitle.getAttribute('data-breadcrumb-title');
				}

				crumbs.push({
					label: label,
					url: isLast ? null : currentPath,
					active: isLast
				});
			});

			return crumbs;
		},

		/**
		 * Format a URL segment as a label
		 */
		formatLabel: function(segment) {
			return segment
				.replace(/_/g, ' ')
				.replace(/-/g, ' ')
				.replace(/\b\w/g, function(c) { return c.toUpperCase(); });
		},

		/**
		 * Render breadcrumbs to a container
		 * @param {HTMLElement|string} container - Container element or selector
		 */
		render: function(container) {
			var el = typeof container === 'string' ? document.querySelector(container) : container;
			if (!el) return;

			var crumbs = this.generate();
			this._renderCrumbs(el, crumbs);
		},

		/**
		 * Internal: Render breadcrumb items to container
		 * @param {HTMLElement} el - Container element
		 * @param {Array} crumbs - Array of breadcrumb items
		 */
		_renderCrumbs: function(el, crumbs) {
			var D = Funky.Dom;
			var isNav = el.tagName === 'NAV';

			var olEl = D.ol().class('breadcrumb-pro');

			crumbs.forEach(function(crumb, i) {
				var liEl = D.li().class(D.classes('breadcrumb-item', crumb.active && 'active'));

				// Add aria-current to the active (current page) item
				if (crumb.active) {
					liEl.aria('current', 'page');
				}

				if (i === 0 && crumb.icon) {
					liEl.child(
						D.a()
							.attr('href', crumb.url || '/')
							.class('breadcrumb-home')
							.attr('title', crumb.label)
							.aria('label', crumb.label)
							.child(D.icon('fas ' + crumb.icon).aria('hidden', 'true'))
					);
				} else if (crumb.url) {
					liEl.child(D.a().attr('href', crumb.url).text(crumb.label));
				} else {
					liEl.child(D.span().text(crumb.label));
				}

				olEl.child(liEl);
			});

			el.replaceChildren();
			if (isNav) {
				el.appendChild(olEl.el);
			} else {
				var navEl = D.nav().aria('label', 'Breadcrumb').child(olEl);
				el.appendChild(navEl.el);
			}

			// Register by container ID
			var containerId = el.id;
			if (containerId) {
				_instances.register(containerId, {
					container: el,
					crumbs: crumbs
				});
			}
		},

		/**
		 * Bindable Interface: Set breadcrumb data
		 * @param {Array} data - Array of {label, url} objects
		 */
		setData: function(data) {
			if (!Array.isArray(data)) {
				console.warn('[Funky.Breadcrumb] setData expects an array');
				return;
			}

			// Convert data array to crumbs format
			var crumbs = data.map(function(item, index) {
				return {
					label: item.label || '',
					url: item.url || null,
					active: index === data.length - 1,
					icon: item.icon || (index === 0 ? 'fa-home' : null)
				};
			});

			// Update all registered instances
			var self = this;
			var allInstances = _instances.getAll();
			Object.keys(allInstances).forEach(function(containerId) {
				var instance = allInstances[containerId];
				if (instance && instance.container) {
					self._renderCrumbs(instance.container, crumbs);
				}
			});

			// If no instances registered yet, try the persistent bar
			if (Object.keys(allInstances).length === 0) {
				var persistentBar = document.getElementById('pageBreadcrumb');
				if (persistentBar) {
					this._renderCrumbs(persistentBar, crumbs);
				}
			}
		},

		/**
		 * Auto-initialize breadcrumbs in containers with data-breadcrumb-auto
		 * Also renders to #pageBreadcrumb if it exists (persistent breadcrumb bar)
		 */
		autoInit: function() {
			var self = this;

			// Render to persistent breadcrumb bar if present
			var persistentBar = document.getElementById('pageBreadcrumb');
			if (persistentBar) {
				this.render(persistentBar);
			}

			// Also render to any containers with data-breadcrumb-auto
			var containers = document.querySelectorAll('[data-breadcrumb-auto]');
			containers.forEach(function(el) {
				self.render(el);
			});
		},

		/**
		 * Get instance by ID
		 * @param {string} id - Instance ID (container ID)
		 * @returns {Object|null}
		 */
		getInstance: function(id) {
			return _instances.get(id);
		},

		/**
		 * Destroy instance by ID
		 * @param {string} id - Instance ID
		 */
		destroy: function(id) {
			var instance = _instances.get(id);
			if (instance && instance.container) {
				instance.container.innerHTML = '';
			}
			_instances.unregister(id);
		},

		/**
		 * Destroy all instances
		 */
		destroyAll: function() {
			_instances.destroyAll();
		}
	};

	// Auto-init on document ready
	document.addEventListener('DOMContentLoaded', function() {
		FunkyBreadcrumb.autoInit();
	});

	// Re-init after SPA navigation
	document.addEventListener('funky.spa.pageload', function() {
		FunkyBreadcrumb.autoInit();
	});

	// Register with Funky namespace
	Funky.register('Breadcrumb', FunkyBreadcrumb);

})(window);

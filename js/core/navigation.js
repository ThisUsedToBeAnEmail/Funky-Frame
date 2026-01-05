/**
 * Funky Navigation - Sidebar navigation utilities
 * Handles scroll position persistence across page loads
 * 
 * Usage:
 *   Funky.Navigation.saveScrollPosition();
 *   Funky.Navigation.restoreScrollPosition();
 * 
 * @version 1.0.2
 */
(function(window) {
	'use strict';

	// Ensure Funky registry exists
	if (!window.Funky || !window.Funky.register) {
		console.error('[Funky.Navigation] Registry not found. Load namespace.js first.');
		return;
	}

	var SCROLL_STORAGE_KEY = 'funky_nav_scroll_position';

	var Navigation = {
		/**
		 * Update --header-height CSS variable based on actual header size
		 */
		updateHeaderHeight: function() {
			var header = document.querySelector('.top-header');
			if (header) {
				var height = header.offsetHeight;
				document.documentElement.style.setProperty('--header-height', height + 'px');
			}
		},

		/**
		 * Restore scroll position immediately to avoid flash
		 */
		restoreScrollPosition: function() {
			var sidebarNav = document.querySelector('.sidebar-nav');
			if (!sidebarNav) return;

			var savedPosition = sessionStorage.getItem(SCROLL_STORAGE_KEY);
			if (savedPosition !== null) {
				var scrollPos = parseInt(savedPosition, 10);
				sidebarNav.scrollTop = scrollPos;
				// Force reflow and try again to ensure it sticks
				setTimeout(function() {
					sidebarNav.scrollTop = scrollPos;
				}, 0);
				// One more time after a short delay for good measure
				setTimeout(function() {
					sidebarNav.scrollTop = scrollPos;
				}, 50);
			}
		},

		/**
		 * Save scroll position
		 */
		saveScrollPosition: function() {
			var sidebarNav = document.querySelector('.sidebar-nav');
			if (sidebarNav) {
				sessionStorage.setItem(SCROLL_STORAGE_KEY, sidebarNav.scrollTop);
			}
		},

		/**
		 * Initialize navigation scroll persistence
		 */
		init: function() {
			var self = this;
			var sidebarNav = document.querySelector('.sidebar-nav');
			if (!sidebarNav) return;

			// Save scroll position before navigating away
			var navLinks = sidebarNav.querySelectorAll('.nav-link');
			navLinks.forEach(function(link) {
				link.addEventListener('click', function() {
					self.saveScrollPosition();
				});
			});

			// Also save on any sidebar scroll (debounced)
			var scrollTimeout;
			sidebarNav.addEventListener('scroll', function() {
				clearTimeout(scrollTimeout);
				scrollTimeout = setTimeout(function() {
					self.saveScrollPosition();
				}, 100);
			});

			// Save before page unload
			window.addEventListener('beforeunload', function() {
				self.saveScrollPosition();
			});

			// Set header height on init and resize
			self.updateHeaderHeight();
			window.addEventListener('resize', function() {
				self.updateHeaderHeight();
			});
		}
	};

	// Restore as early as possible
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', function() {
			Navigation.updateHeaderHeight();
			Navigation.restoreScrollPosition();
		});
	} else {
		Navigation.updateHeaderHeight();
		Navigation.restoreScrollPosition();
	}

	// Also restore after full page load
	window.addEventListener('load', function() {
		Navigation.restoreScrollPosition();
	});

	// Setup save handlers after DOM is ready
	document.addEventListener('DOMContentLoaded', function() {
		Navigation.init();
	});

	// Register with Funky namespace
	Funky.register('Navigation', Navigation);

})(window);

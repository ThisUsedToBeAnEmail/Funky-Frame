/**
 * WIP Overlay - Work In Progress Page Overlay
 * A simple overlay to indicate pages that are still under development
 * @module Funky.WIPOverlay
 * @version 1.0.0
 *
 * Usage (Instance-based - recommended for SPAs):
 *   Funky.WIPOverlay.init({
 *     id: 'myOverlay',
 *     message: 'This page is under construction',
 *     showInDev: true
 *   });
 *   Funky.WIPOverlay.show('myOverlay');
 *   Funky.WIPOverlay.hide('myOverlay');
 *
 * Usage (Legacy singleton - for backward compatibility):
 *   Funky.WIPOverlay.init({ message: 'Under construction' });
 *   Funky.WIPOverlay.show();
 *
 * Quick disable in development:
 *   Add ?nowip to the URL: http://localhost:3000/page?nowip
 *   Or via Funky.Storage: Funky.Storage.setRaw('wip_disabled', 'true');
 */
(function(window) {
	'use strict';

	// Registry guard - prevent double registration
	if (typeof Funky !== 'undefined' && Funky.isRegistered && Funky.isRegistered('WIPOverlay')) {
		return;
	}

	// Default instance ID for backward compatibility
	var DEFAULT_ID = '__default__';

	// Default config template
	var DEFAULT_CONFIG = {
		message: '🚧 Work In Progress 🚧',
		subMessage: 'This page is currently under development',
		showInDev: true,
		allowClose: true,
		scopeToContainer: null, // CSS selector to scope overlay to specific element
		backgroundColor: 'rgba(0, 0, 0, 0.95)',
		textColor: '#ffffff',
		accentColor: '#ff6600',
		zIndex: 999, // Below sidebar (z-index: 1000) to keep navigation accessible
		animation: 'fade', // 'fade', 'slide', 'zoom', or 'none'
		showProgress: true,
		estimatedCompletion: null, // e.g., '2025-12-15' or 'Q1 2026'
		contactEmail: null, // e.g., 'support@funky.com'
		showFeatures: true,
		features: [
			'UI Design Complete',
			'Backend Integration',
			'Testing Phase',
			'Final Review'
		]
	};

	/**
	 * WIPOverlayInstance Constructor - represents a single overlay instance
	 * @param {string} id - Unique identifier for this instance
	 * @param {object} options - Configuration options
	 */
	function WIPOverlayInstance(id, options) {
		this.id = id;
		this.overlay = null;
		this.isVisible = false;
		this._keyHandler = null;
		this.config = Object.assign({}, DEFAULT_CONFIG);

		// Merge options
		if (options) {
			var self = this;
			Object.keys(options).forEach(function(key) {
				if (options[key] !== undefined) {
					self.config[key] = options[key];
				}
			});
		}
	}

	/**
	 * Check if overlay should be shown (instance method)
	 * @returns {boolean}
	 */
	WIPOverlayInstance.prototype._shouldShow = function() {
		// Check URL parameter
		var urlParams = new URLSearchParams(window.location.search);
		if (urlParams.has('nowip')) {
			return false;
		}

		// Check localStorage via Funky.Storage
		var disabled = Funky.Storage.getRaw('wip_disabled', null);
		if (disabled === 'true') {
			return false;
		}

		// Check session storage for session disable
		if (sessionStorage.getItem('funky_wip_disabled_session') === 'true') {
			return false;
		}

		return true;
	};

	/**
	 * Check if in development environment
	 * @returns {boolean}
	 */
	WIPOverlayInstance.prototype._isDevelopment = function() {
		return window.location.hostname === 'localhost' ||
			window.location.hostname === '127.0.0.1' ||
			window.location.hostname === '' ||
			window.location.port === '3000' ||
			window.location.port === '5000' ||
			window.location.hostname.includes('.local');
	};

	/**
	 * Create the overlay element
	 */
	WIPOverlayInstance.prototype._createOverlay = function() {
		var D = Funky.Dom;
		var self = this;

		// Create overlay container with accessibility attributes
		var overlayId = 'funky-wip-overlay-' + this.id;
		this.overlay = document.createElement('div');
		this.overlay.id = overlayId;
		this.overlay.className = 'funky-wip-overlay';
		this.overlay.setAttribute('role', 'dialog');
		this.overlay.setAttribute('aria-modal', 'true');
		this.overlay.setAttribute('aria-labelledby', overlayId + '-title');
		this.overlay.setAttribute('aria-describedby', overlayId + '-description');

		// Create content container
		const content = document.createElement('div');
		content.className = 'funky-wip-content';

		// Create animated construction icon (decorative)
		const icon = document.createElement('div');
		icon.className = 'funky-wip-icon';
		icon.textContent = '🚧';
		icon.setAttribute('aria-hidden', 'true');
		content.appendChild(icon);

		// Main message
		var message = document.createElement('h1');
		message.id = overlayId + '-title';
		message.className = 'funky-wip-message';
		message.textContent = this.config.message;
		content.appendChild(message);

		// Sub message
		if (this.config.subMessage) {
			var subMessage = document.createElement('p');
			subMessage.id = overlayId + '-description';
			subMessage.className = 'funky-wip-submessage';
			subMessage.textContent = this.config.subMessage;
			content.appendChild(subMessage);
		}

		// Progress indicator
		if (this.config.showProgress) {
			const progressContainer = document.createElement('div');
			progressContainer.className = 'funky-wip-progress-container';

			const progressBar = document.createElement('div');
			progressBar.className = 'funky-wip-progress-bar';

			const progress = document.createElement('div');
			progress.className = 'funky-wip-progress';
			progress.style.width = this._calculateProgress() + '%';

			progressBar.appendChild(progress);
			progressContainer.appendChild(progressBar);

			const progressText = document.createElement('div');
			progressText.className = 'funky-wip-progress-text';
			progressText.textContent = this._calculateProgress() + '% Complete';
			progressContainer.appendChild(progressText);

			content.appendChild(progressContainer);
		}

		// Features list
		if (this.config.showFeatures && this.config.features.length > 0) {
			const featuresContainer = document.createElement('div');
			featuresContainer.className = 'funky-wip-features';

			const featuresTitle = document.createElement('h3');
			featuresTitle.textContent = 'Development Status:';
			featuresContainer.appendChild(featuresTitle);

			const featuresList = document.createElement('ul');
			this.config.features.forEach(function(feature, index) {
				const li = document.createElement('li');

				// Support both string and object formats
				let label, completed;
				if (typeof feature === 'object') {
					label = feature.label || feature.name || 'Feature ' + (index + 1);
					completed = feature.completed || false;
				} else {
					label = feature;
					completed = index < Math.floor(self.config.features.length * (self._calculateProgress() / 100));
				}

				li.className = completed ? 'completed' : 'pending';
				li.appendChild(D.span().class('status-icon').text(completed ? '✓' : '⏳').get());
				li.appendChild(document.createTextNode(' ' + label));
				featuresList.appendChild(li);
			});

			featuresContainer.appendChild(featuresList);
			content.appendChild(featuresContainer);
		}

		// Estimated completion
		if (this.config.estimatedCompletion) {
			const eta = D.p().class('funky-wip-eta').child(
				D.strong().text('Estimated Completion:'),
				D.text(' ' + this.config.estimatedCompletion)
			).el;
			content.appendChild(eta);
		}

		// Contact info
		if (this.config.contactEmail) {
			const contact = D.p().class('funky-wip-contact').child(
				D.text('Questions? Contact us at '),
				D.a().attr('href', 'mailto:' + this.config.contactEmail).text(this.config.contactEmail)
			).el;
			content.appendChild(contact);
		}

		// Close button (if allowed)
		if (this.config.allowClose) {
			const closeBtn = D.button()
				.class('funky-wip-close')
				.attr('type', 'button')
				.aria('label', 'Close overlay (for this session)')
				.child(D.span().aria('hidden', 'true').text('✕'))
				.get();
			closeBtn.onclick = function() {
				self.hide();
			};
			content.appendChild(closeBtn);

			const disclaimer = D.p().class('funky-wip-disclaimer').child(
				D.small().text('⚠️ Note: This page may not function correctly. Close overlay at your own risk.')
			).el;
			content.appendChild(disclaimer);
		} else {
			const disclaimer = D.p().class('funky-wip-disclaimer').child(
				D.small().text('💡 This page will be available soon')
			).el;
			content.appendChild(disclaimer);
		}

		// Development helpers
		if (this._isDevelopment()) {
			const devTools = D.div().class('funky-wip-dev-tools').child(
				D.p().class('funky-wip-dev-title').text('🔧 Developer Tools:'),
				D.button().class('funky-wip-dev-btn').attr('onclick', 'WIPOverlay.disableForSession()').text('Disable for Session'),
				D.button().class('funky-wip-dev-btn').attr('onclick', 'WIPOverlay.disablePermanently()').text('Disable Permanently'),
				D.button().class('funky-wip-dev-btn').attr('onclick', 'location.reload()').text('Reload Page')
			).el;
			content.appendChild(devTools);
		}

		this.overlay.appendChild(content);

		// Add styles
		this._injectStyles();

		// Add animation class
		if (this.config.animation !== 'none') {
			this.overlay.classList.add('wip-animation-' + this.config.animation);
		}

		// Append to container or body when DOM is ready
		const appendOverlay = function() {
			let targetContainer = document.body;

			if (this.config.scopeToContainer) {
				const container = document.querySelector(this.config.scopeToContainer);
				if (container) {
					targetContainer = container;
					// Make container position relative if not already positioned
					const position = window.getComputedStyle(container).position;
					if (position === 'static') {
						container.style.position = 'relative';
					}
					// Update overlay to be absolute within container bounds
					this.overlay.style.position = 'absolute';
					this.overlay.style.top = '0';
					this.overlay.style.left = '0';
					this.overlay.style.right = '0';
					this.overlay.style.bottom = '0';
					this.overlay.style.width = '100%';
					this.overlay.style.height = '100%';
					this.overlay.style.minHeight = 'unset';
					// Allow overlay to scroll
					this.overlay.style.overflowY = 'auto';
					// Adjust content for scoped container
					const content = this.overlay.querySelector('.funky-wip-content');
					if (content) {
						content.style.maxHeight = '100%';
						content.style.height = '100%';
						content.style.margin = '0 auto';
						content.style.borderRadius = '0';
					}
				} else {
					console.warn('[WIPOverlay] Container not found:', this.config.scopeToContainer);
				}
			}

			targetContainer.appendChild(this.overlay);
		}.bind(this);

		if (document.body) {
			// Small delay to ensure container exists
			setTimeout(appendOverlay, 50);
		} else {
			document.addEventListener('DOMContentLoaded', appendOverlay);
		}
	};

	/**
	 * Calculate progress percentage
	 * @returns {number} Progress percentage (0-100)
	 */
	WIPOverlayInstance.prototype._calculateProgress = function() {
		// Use explicit progress if provided
		if (this.config.progress !== undefined && this.config.progress !== null) {
			return Math.max(0, Math.min(100, this.config.progress));
		}

		// Calculate from features if they have completed property
		if (this.config.features && this.config.features.length > 0) {
			const completedCount = this.config.features.filter(function(feature) {
				return typeof feature === 'object' ? feature.completed : false;
			}).length;

			if (completedCount > 0) {
				return Math.round((completedCount / this.config.features.length) * 100);
			}
		}

		// Default progress
		return 65;
	};

	/**
	 * Inject CSS styles
	 */
	WIPOverlayInstance.prototype._injectStyles = function() {
		if (document.getElementById('funky-wip-styles')) {
			return; // Styles already injected
		}

		const style = document.createElement('style');
		style.id = 'funky-wip-styles';
		style.textContent = `
      .funky-wip-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: ${this.config.backgroundColor};
        color: ${this.config.textColor};
        z-index: ${this.config.zIndex};
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        opacity: 0;
        transition: opacity 0.5s ease;
      }
      
      .funky-wip-overlay.visible {
        opacity: 1;
      }
      
      .funky-wip-content {
        text-align: center;
        max-width: 600px;
        max-height: 90vh;
        padding: 40px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 20px;
        border: 2px solid ${this.config.accentColor};
        box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
        position: relative;
        overflow-y: auto;
        overflow-x: hidden;
      }
      
      /* Scrollbar styling for content */
      .funky-wip-content::-webkit-scrollbar {
        width: 8px;
      }
      
      .funky-wip-content::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
      }
      
      .funky-wip-content::-webkit-scrollbar-thumb {
        background: ${this.config.accentColor};
        border-radius: 10px;
      }
      
      .funky-wip-content::-webkit-scrollbar-thumb:hover {
        background: #ffaa00;
      }
      
      .funky-wip-icon {
        font-size: 80px;
        animation: bounce 2s infinite;
        margin-bottom: 20px;
      }
      
      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-20px); }
        60% { transform: translateY(-10px); }
      }
      
      .funky-wip-message {
        font-size: 36px;
        font-weight: bold;
        margin: 0 0 15px 0;
        color: ${this.config.accentColor};
        text-shadow: 0 2px 10px rgba(255, 102, 0, 0.5);
      }
      
      .funky-wip-submessage {
        font-size: 18px;
        margin: 0 0 30px 0;
        opacity: 0.9;
      }
      
      .funky-wip-progress-container {
        margin: 30px 0;
      }
      
      .funky-wip-progress-bar {
        width: 100%;
        height: 30px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 15px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      
      .funky-wip-progress {
        height: 100%;
        background: linear-gradient(90deg, ${this.config.accentColor}, #ffaa00);
        border-radius: 15px;
        transition: width 1s ease;
        animation: shimmer 2s infinite;
      }
      
      @keyframes shimmer {
        0% { opacity: 0.8; }
        50% { opacity: 1; }
        100% { opacity: 0.8; }
      }
      
      .funky-wip-progress-text {
        margin-top: 10px;
        font-size: 14px;
        font-weight: bold;
        color: ${this.config.accentColor};
      }
      
      .funky-wip-features {
        margin: 30px 0;
        text-align: left;
      }
      
      .funky-wip-features h3 {
        font-size: 20px;
        margin: 0 0 15px 0;
        text-align: center;
      }
      
      .funky-wip-features ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      
      .funky-wip-features li {
        padding: 10px;
        margin: 8px 0;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        border-left: 3px solid ${this.config.accentColor};
        display: flex;
        align-items: center;
      }
      
      .funky-wip-features li.completed {
        border-left-color: #10b981;
      }
      
      .funky-wip-features li.pending {
        border-left-color: #6b7280;
        opacity: 0.7;
      }
      
      .funky-wip-features .status-icon {
        margin-right: 10px;
        font-size: 18px;
      }
      
      .funky-wip-eta {
        margin: 20px 0;
        font-size: 16px;
        padding: 15px;
        background: rgba(255, 102, 0, 0.1);
        border-radius: 10px;
        border: 1px solid rgba(255, 102, 0, 0.3);
      }
      
      .funky-wip-contact {
        margin: 20px 0;
        font-size: 14px;
      }
      
      .funky-wip-contact a {
        color: ${this.config.accentColor};
        text-decoration: none;
        font-weight: bold;
      }
      
      .funky-wip-contact a:hover {
        text-decoration: underline;
      }
      
      .funky-wip-close {
        position: absolute;
        top: 15px;
        right: 15px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        border: 2px solid rgba(255, 255, 255, 0.3);
        color: ${this.config.textColor};
        font-size: 24px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
      }
      
      .funky-wip-close:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: rotate(90deg);
      }
      
      .funky-wip-disclaimer {
        margin: 20px 0 0 0;
        font-size: 12px;
        color: #fbbf24;
      }
      
      .funky-wip-dev-tools {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
      }
      
      .funky-wip-dev-title {
        font-size: 14px;
        margin-bottom: 10px;
        opacity: 0.7;
      }
      
      .funky-wip-dev-btn {
        margin: 5px;
        padding: 8px 16px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: ${this.config.textColor};
        border-radius: 5px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.3s ease;
      }
      
      .funky-wip-dev-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-2px);
      }
      
      /* Animation variants */
      .wip-animation-fade {
        animation: fadeIn 0.5s ease forwards;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .wip-animation-slide .funky-wip-content {
        animation: slideDown 0.6s ease forwards;
      }
      
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-50px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .wip-animation-zoom .funky-wip-content {
        animation: zoomIn 0.5s ease forwards;
      }
      
      @keyframes zoomIn {
        from {
          opacity: 0;
          transform: scale(0.5);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      
      /* Responsive */
      @media (max-width: 768px) {
        .funky-wip-overlay {
          /* Add top offset for mobile navigation */
          top: 60px;
          height: calc(100vh - 60px);
        }
        
        .funky-wip-content {
          margin: 15px;
          padding: 25px 15px;
          max-width: calc(100% - 30px);
          max-height: calc(90vh - 60px);
        }
        
        .funky-wip-icon {
          font-size: 50px;
          margin-bottom: 15px;
        }
        
        .funky-wip-message {
          font-size: 22px;
          line-height: 1.2;
        }
        
        .funky-wip-submessage {
          font-size: 14px;
          margin-bottom: 20px;
        }
        
        .funky-wip-progress-container {
          margin: 20px 0;
        }
        
        .funky-wip-progress-bar {
          height: 25px;
        }
        
        .funky-wip-progress-text {
          font-size: 13px;
        }
        
        .funky-wip-features {
          font-size: 13px;
          margin: 20px 0;
        }
        
        .funky-wip-features h3 {
          font-size: 16px;
          margin-bottom: 10px;
        }
        
        .funky-wip-features li {
          padding: 8px;
          font-size: 13px;
        }
        
        .funky-wip-features .status-icon {
          font-size: 16px;
          margin-right: 8px;
        }
        
        .funky-wip-eta {
          padding: 12px;
          font-size: 14px;
          margin: 15px 0;
        }
        
        .funky-wip-contact {
          font-size: 13px;
          margin: 15px 0;
        }
        
        .funky-wip-close {
          width: 35px;
          height: 35px;
          font-size: 20px;
          top: 10px;
          right: 10px;
        }
        
        .funky-wip-disclaimer {
          font-size: 11px;
          margin-top: 15px;
        }
        
        .funky-wip-dev-tools {
          margin-top: 20px;
          padding-top: 15px;
        }
        
        .funky-wip-dev-btn {
          padding: 6px 12px;
          font-size: 11px;
          margin: 3px;
        }
      }
      
      /* Extra small devices */
      @media (max-width: 480px) {
        .funky-wip-overlay {
          top: 56px;
          height: calc(100vh - 56px);
        }
        
        .funky-wip-content {
          margin: 10px;
          padding: 20px 12px;
          max-width: calc(100% - 20px);
          max-height: calc(90vh - 56px);
          border-radius: 15px;
        }
        
        .funky-wip-icon {
          font-size: 40px;
          margin-bottom: 10px;
        }
        
        .funky-wip-message {
          font-size: 18px;
        }
        
        .funky-wip-submessage {
          font-size: 13px;
        }
        
        .funky-wip-features h3 {
          font-size: 15px;
        }
        
        .funky-wip-features li {
          padding: 6px;
          font-size: 12px;
        }
      }
    `;

		document.head.appendChild(style);
	};

	/**
	 * Show the overlay (internal)
	 */
	WIPOverlayInstance.prototype._show = function() {
		var self = this;
		if (this.overlay) {
			setTimeout(function() {
				self.overlay.classList.add('visible');
				self.isVisible = true;

				// Focus the close button if present for keyboard accessibility
				var closeBtn = self.overlay.querySelector('.funky-wip-close');
				if (closeBtn) {
					closeBtn.focus();
				}

				// Add keyboard listener for Escape
				self._keyHandler = function(e) {
					if (e.key === 'Escape' && self.config.allowClose) {
						self.hide();
					}
				};
				document.addEventListener('keydown', self._keyHandler);

				// Announce to screen readers
				if (Funky.Announce) {
					Funky.Announce.assertive('Work in progress overlay opened. ' + self.config.message);
				}
			}, 100);
		}
	};

	/**
	 * Show the overlay (public method)
	 * If overlay was previously hidden/destroyed, re-creates it
	 * @returns {WIPOverlayInstance} this for chaining
	 */
	WIPOverlayInstance.prototype.show = function() {
		// Check if overlay should be shown
		if (!this._shouldShow()) {
			console.log('[WIPOverlay] Disabled via URL parameter or localStorage');
			return this;
		}

		// Check if in development environment and showInDev is false
		if (this._isDevelopment() && !this.config.showInDev) {
			console.log('[WIPOverlay] Development environment detected, overlay disabled');
			return this;
		}

		// If overlay doesn't exist or was removed, re-create it
		if (!this.overlay || !this.overlay.parentNode) {
			this._createOverlay();
		}
		this._show();
		return this;
	};

	/**
	 * Hide the overlay
	 * @returns {WIPOverlayInstance} this for chaining
	 */
	WIPOverlayInstance.prototype.hide = function() {
		var self = this;
		if (this.overlay) {
			this.overlay.classList.remove('visible');

			// Remove keyboard listener
			if (this._keyHandler) {
				document.removeEventListener('keydown', this._keyHandler);
				this._keyHandler = null;
			}

			setTimeout(function() {
				if (self.overlay && self.overlay.parentNode) {
					self.overlay.parentNode.removeChild(self.overlay);
				}
				self.isVisible = false;

				// Announce closure to screen readers
				if (Funky.Announce) {
					Funky.Announce.polite('Overlay closed');
				}
			}, 500);
		}
		return this;
	};

	/**
	 * Toggle overlay visibility
	 * @returns {WIPOverlayInstance} this for chaining
	 */
	WIPOverlayInstance.prototype.toggle = function() {
		if (this.isVisible) {
			this.hide();
		} else {
			this.show();
		}
		return this;
	};

	/**
	 * Check if overlay is currently visible
	 * @returns {boolean}
	 */
	WIPOverlayInstance.prototype.isShown = function() {
		return this.isVisible;
	};

	/**
	 * Destroy this instance
	 */
	WIPOverlayInstance.prototype.destroy = function() {
		// Remove keyboard listener
		if (this._keyHandler) {
			document.removeEventListener('keydown', this._keyHandler);
			this._keyHandler = null;
		}

		// Remove overlay from DOM
		if (this.overlay && this.overlay.parentNode) {
			this.overlay.parentNode.removeChild(this.overlay);
		}
		this.overlay = null;
		this.isVisible = false;
	};

	// =========================================================================
	// WIPOverlay Manager - Registry-based API for multiple instances
	// =========================================================================

	var WIPOverlay = {
		/**
		 * Instance registry
		 */
		_instances: {},

		/**
		 * Initialize a WIP overlay instance
		 * @param {Object} options - Configuration options
		 * @param {string} [options.id] - Unique identifier (defaults to '__default__')
		 * @param {string} options.message - Main message to display
		 * @param {string} options.subMessage - Secondary message
		 * @param {boolean} options.showInDev - Show even in development environment
		 * @param {boolean} options.allowClose - Allow users to close the overlay
		 * @param {string} options.scopeToContainer - CSS selector to scope overlay to specific element
		 * @param {string} options.animation - Animation type: 'fade', 'slide', 'zoom', 'none'
		 * @param {boolean} options.showProgress - Show progress indicator
		 * @param {number} options.progress - Progress percentage (0-100)
		 * @param {string} options.estimatedCompletion - Estimated completion date
		 * @param {string} options.contactEmail - Contact email for inquiries
		 * @param {boolean} options.showFeatures - Show features list
		 * @param {Array} options.features - List of features/milestones
		 * @returns {WIPOverlayInstance} The created instance
		 */
		init: function(options) {
			var id = (options && options.id) || DEFAULT_ID;

			// Destroy existing instance if present
			if (this._instances[id]) {
				this._instances[id].destroy();
			}

			// Create new instance
			var instance = new WIPOverlayInstance(id, options);
			this._instances[id] = instance;

			return instance;
		},

		/**
		 * Get an instance by ID
		 * @param {string} [id] - Instance ID (defaults to '__default__')
		 * @returns {WIPOverlayInstance|null}
		 */
		getInstance: function(id) {
			return this._instances[id || DEFAULT_ID] || null;
		},

		/**
		 * Show an overlay instance
		 * @param {string} [id] - Instance ID (defaults to '__default__')
		 * @returns {WIPOverlay} this for chaining
		 */
		show: function(id) {
			var instance = this._instances[id || DEFAULT_ID];
			if (instance) {
				instance.show();
			} else {
				console.warn('[WIPOverlay] Instance not found:', id || DEFAULT_ID);
			}
			return this;
		},

		/**
		 * Hide an overlay instance
		 * @param {string} [id] - Instance ID (defaults to '__default__')
		 * @returns {WIPOverlay} this for chaining
		 */
		hide: function(id) {
			var instance = this._instances[id || DEFAULT_ID];
			if (instance) {
				instance.hide();
			}
			return this;
		},

		/**
		 * Toggle an overlay instance
		 * @param {string} [id] - Instance ID (defaults to '__default__')
		 * @returns {WIPOverlay} this for chaining
		 */
		toggle: function(id) {
			var instance = this._instances[id || DEFAULT_ID];
			if (instance) {
				instance.toggle();
			}
			return this;
		},

		/**
		 * Check if an overlay instance is visible
		 * @param {string} [id] - Instance ID (defaults to '__default__')
		 * @returns {boolean}
		 */
		isShown: function(id) {
			var instance = this._instances[id || DEFAULT_ID];
			return instance ? instance.isShown() : false;
		},

		/**
		 * Destroy an overlay instance
		 * @param {string} [id] - Instance ID (defaults to '__default__')
		 * @returns {WIPOverlay} this for chaining
		 */
		destroy: function(id) {
			var instanceId = id || DEFAULT_ID;
			var instance = this._instances[instanceId];
			if (instance) {
				instance.destroy();
				delete this._instances[instanceId];
			}
			return this;
		},

		/**
		 * Destroy all overlay instances
		 * @returns {WIPOverlay} this for chaining
		 */
		destroyAll: function() {
			var self = this;
			Object.keys(this._instances).forEach(function(id) {
				self.destroy(id);
			});
			return this;
		},

		/**
		 * Disable all overlays for current session
		 */
		disableForSession: function() {
			sessionStorage.setItem('funky_wip_disabled_session', 'true');
			this.destroyAll();
			console.log('[WIPOverlay] Disabled for this session. Reload the page to re-enable.');
		},

		/**
		 * Disable all overlays permanently (stored in localStorage)
		 */
		disablePermanently: function() {
			Funky.Storage.setRaw('wip_disabled', 'true');
			this.destroyAll();
			console.log('[WIPOverlay] Disabled permanently. To re-enable, run Funky.WIPOverlay.enable()');
		},

		/**
		 * Re-enable overlays (clear localStorage flag)
		 */
		enable: function() {
			Funky.Storage.remove('wip_disabled');
			sessionStorage.removeItem('funky_wip_disabled_session');
			console.log('[WIPOverlay] Re-enabled. Reload page to see overlay.');
		}
	};

	// Register with Funky
	if (typeof Funky !== 'undefined' && Funky.register) {
		Funky.register('WIPOverlay', WIPOverlay);
	}

	// Console helpers
	console.log('%c[WIPOverlay] 🚧 Loaded (v2.0 - instance-based)', 'color: #ff6600; font-weight: bold;');
	console.log('%cQuick disable: Add ?nowip to URL or run: Funky.Storage.setRaw("wip_disabled", "true")', 'color: #888;');

})(window);

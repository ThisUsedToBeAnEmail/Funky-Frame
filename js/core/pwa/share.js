/**
 * Funky.PWA.Share - Web Share API
 *
 * Invokes the native OS share dialog for sharing content through
 * user's preferred apps (email, messaging, social media, etc.).
 *
 * Browser Support:
 * - Chrome 89+ (desktop), 61+ (Android)
 * - Safari 12.1+
 * - Edge 93+
 * - Firefox 71+ (Android only)
 *
 * @namespace Funky.PWA.Share
 */
(function(global) {
	'use strict';

	var Funky = global.Funky || {};

	// =========================================================================
	// SHARE API
	// =========================================================================

	var Share = {
		/**
		 * Check if Web Share API is supported
		 * @returns {boolean}
		 */
		isSupported: function() {
			return typeof navigator.share === 'function';
		},

		/**
		 * Check if specific data can be shared
		 * @param {Object} data - { title, text, url, files }
		 * @returns {boolean}
		 */
		canShare: function(data) {
			if (typeof navigator.canShare === 'function') {
				try {
					return navigator.canShare(data);
				} catch (e) {
					return false;
				}
			}

			// Fallback: assume basic sharing works if share exists
			// File sharing requires canShare check, so return false for files
			return this.isSupported() && !data.files;
		},

		/**
		 * Share content using native dialog
		 * @param {Object} data - { title, text, url, files }
		 * @returns {Promise<boolean>} Resolves to true on success, false if cancelled
		 */
		share: function(data) {
			var self = this;

			if (!this.isSupported()) {
				return Promise.reject(new Error('Web Share API not supported'));
			}

			// Validate data
			if (!data || (!data.title && !data.text && !data.url && !data.files)) {
				return Promise.reject(new Error('Nothing to share'));
			}

			// Build share data object (only include defined properties)
			var shareData = {};
			if (data.title) shareData.title = data.title;
			if (data.text) shareData.text = data.text;
			if (data.url) shareData.url = data.url;
			if (data.files) shareData.files = data.files;

			return navigator.share(shareData)
				.then(function() {
					// Emit success event
					if (Funky.PubSub) {
						Funky.PubSub.emit('funky:pwa:shared', {
							title: data.title,
							text: data.text,
							url: data.url,
							hasFiles: !!(data.files && data.files.length)
						});
					}
					return true;
				})
				.catch(function(error) {
					// User cancelled - not an error
					if (error.name === 'AbortError') {
						return false;
					}
					// Re-throw actual errors
					throw error;
				});
		},

		/**
		 * Share a URL (convenience method)
		 * @param {string} url - URL to share
		 * @param {string} [title] - Optional title (defaults to document.title)
		 * @param {string} [text] - Optional text description
		 * @returns {Promise<boolean>}
		 */
		shareUrl: function(url, title, text) {
			var data = {
				url: url,
				title: title || document.title
			};
			if (text) {
				data.text = text;
			}
			return this.share(data);
		},

		/**
		 * Share text (convenience method)
		 * @param {string} text - Text to share
		 * @param {string} [title] - Optional title
		 * @returns {Promise<boolean>}
		 */
		shareText: function(text, title) {
			var data = { text: text };
			if (title) {
				data.title = title;
			}
			return this.share(data);
		},

		/**
		 * Share files
		 * @param {File|File[]} files - File or array of Files to share
		 * @param {string} [title] - Optional title
		 * @param {string} [text] - Optional text
		 * @returns {Promise<boolean>}
		 */
		shareFiles: function(files, title, text) {
			// Normalize to array
			if (!Array.isArray(files)) {
				files = [files];
			}

			// Filter out non-File objects
			files = files.filter(function(f) {
				return f instanceof File;
			});

			if (files.length === 0) {
				return Promise.reject(new Error('No valid files to share'));
			}

			var data = { files: files };
			if (title) data.title = title;
			if (text) data.text = text;

			// Check if file sharing is supported
			if (!this.canShare(data)) {
				return Promise.reject(new Error('File sharing not supported'));
			}

			return this.share(data);
		},

		/**
		 * Convert a canvas element to a shareable File
		 * @param {HTMLCanvasElement} canvas - Canvas element
		 * @param {string} [filename='image.png'] - Output filename
		 * @param {string} [mimeType='image/png'] - Output MIME type
		 * @returns {Promise<File>}
		 */
		canvasToFile: function(canvas, filename, mimeType) {
			filename = filename || 'image.png';
			mimeType = mimeType || 'image/png';

			return new Promise(function(resolve, reject) {
				try {
					canvas.toBlob(function(blob) {
						if (blob) {
							var file = new File([blob], filename, { type: mimeType });
							resolve(file);
						} else {
							reject(new Error('Failed to create blob from canvas'));
						}
					}, mimeType);
				} catch (error) {
					reject(error);
				}
			});
		},

		/**
		 * Convert a Blob to a shareable File
		 * @param {Blob} blob - Blob object
		 * @param {string} filename - Output filename
		 * @returns {File}
		 */
		blobToFile: function(blob, filename) {
			return new File([blob], filename, { type: blob.type });
		},

		/**
		 * Fallback: Copy text to clipboard when share not supported
		 * @param {string} text - Text to copy
		 * @param {string} [successMessage='Copied to clipboard'] - Toast message
		 * @returns {Promise<boolean>}
		 */
		fallbackCopy: function(text, successMessage) {
			successMessage = successMessage || 'Copied to clipboard';

			// Use Funky.Clipboard if available
			if (Funky.Clipboard && typeof Funky.Clipboard.copy === 'function') {
				return Funky.Clipboard.copy(text).then(function(success) {
					if (success && Funky.Toast) {
						Funky.Toast.info(successMessage);
					}
					return success;
				});
			}

			// Direct clipboard API
			if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
				return navigator.clipboard.writeText(text)
					.then(function() {
						if (Funky.Toast) {
							Funky.Toast.info(successMessage);
						}
						return true;
					})
					.catch(function(error) {
						console.warn('[Funky.PWA.Share] Clipboard copy failed:', error);
						return false;
					});
			}

			// Legacy fallback using execCommand
			try {
				var textarea = document.createElement('textarea');
				textarea.value = text;
				textarea.style.position = 'fixed';
				textarea.style.opacity = '0';
				document.body.appendChild(textarea);
				textarea.select();
				var success = document.execCommand('copy');
				document.body.removeChild(textarea);

				if (success && Funky.Toast) {
					Funky.Toast.info(successMessage);
				}
				return Promise.resolve(success);
			} catch (error) {
				console.warn('[Funky.PWA.Share] execCommand copy failed:', error);
				return Promise.resolve(false);
			}
		},

		/**
		 * Share or fallback to clipboard copy
		 * Automatically uses clipboard if share not supported
		 * @param {Object} data - { title, text, url }
		 * @returns {Promise<boolean>}
		 */
		shareOrCopy: function(data) {
			var self = this;

			if (this.isSupported()) {
				return this.share(data).catch(function() {
					// If share fails, try clipboard
					var text = data.url || data.text || data.title;
					return self.fallbackCopy(text);
				});
			}

			// Not supported - use clipboard
			var text = data.url || data.text || data.title;
			return this.fallbackCopy(text);
		}
	};

	// =========================================================================
	// AUTO-INIT SHARE BUTTONS
	// =========================================================================

	/**
	 * Initialize share buttons with data-share-url attribute
	 */
	function initShareButtons() {
		if (typeof Funky.Events === 'undefined') {
			return;
		}

		Funky.Events.delegate(document.body, '[data-share-url]', 'click', function(e) {
			e.preventDefault();

			var url = this.getAttribute('data-share-url');
			var title = this.getAttribute('data-share-title') || document.title;
			var text = this.getAttribute('data-share-text');
			var fallback = this.getAttribute('data-share-fallback') !== 'false';

			if (fallback) {
				Share.shareOrCopy({ url: url, title: title, text: text });
			} else if (Share.isSupported()) {
				Share.shareUrl(url, title, text);
			}
		});
	}

	// =========================================================================
	// REGISTRATION
	// =========================================================================

	// Ensure namespaces exist
	Funky.PWA = Funky.PWA || {};
	Funky.PWA.Share = Share;

	// Register with Funky.register if available
	if (typeof Funky.register === 'function') {
		Funky.register('PWA.Share', Share);
	}

	// Setup auto-init after DOM ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initShareButtons);
	} else {
		initShareButtons();
	}

	// Safely assign to global (may fail if Funky is frozen in test environments)
	try {
		global.Funky = Funky;
	} catch (e) {
		// Funky namespace already exists and is read-only
	}

})(typeof window !== 'undefined' ? window : this);

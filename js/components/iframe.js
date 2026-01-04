/**
 * Funky.Iframe - Flexible iframe embedding component
 * 
 * Supports three display modes:
 * - embed: Inline iframe within a container
 * - modal: Iframe displayed in a modal dialog
 * - detached: Iframe opened in external window/tab with overlay
 * 
 * @example
 * // Embed mode
 * var iframe = Funky.Iframe.create('#container', { 
 *   src: '/page.html',
 *   mode: 'embed'
 * });
 * 
 * // Modal mode
 * var iframe = Funky.Iframe.create('#trigger', {
 *   src: '/page.html', 
 *   mode: 'modal'
 * });
 * 
 * // Detached mode (external window)
 * var iframe = Funky.Iframe.create('#trigger', {
 *   src: '/page.html',
 *   mode: 'detached'
 * });
 */
(function(window) {
    'use strict';

    // Ensure Funky registry exists
    if (!window.Funky || !window.Funky.register) {
        console.error('[Funky.Iframe] Registry not found. Load namespace.js first.');
        return;
    }

    var D = Funky.Dom;
    var E = Funky.Events;

    var SELECTOR = '[data-iframe]';
    var instances = Funky.Registry.createInstanceRegistry('Iframe');
    var instanceIdCounter = 0;
    var observer = null;

    // =========================================================================
    // DEFAULT CONFIGURATION
    // =========================================================================

    var defaults = {
        // Core
        src: '/test-runner',          // Default source URL
        mode: 'embed',                // Display mode: 'embed', 'modal', 'detached'
        id: null,                     // Iframe ID (auto-generated if not provided)
        
        // Dimensions
        width: '100%',                // Width (CSS value or number)
        height: '400px',              // Height (CSS value or number)
        minHeight: '200px',           // Minimum height
        autoResize: true,             // Auto-resize based on content
        
        // Iframe attributes
        sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups',
        scrolling: 'auto',            // 'auto', 'yes', 'no'
        allowFullscreen: true,
        loading: 'lazy',              // 'lazy', 'eager'
        referrerPolicy: 'strict-origin-when-cross-origin',
        
        // CSS classes
        containerClass: 'funky-iframe-container',
        iframeClass: 'funky-iframe',
        
        // Security
        allowedOrigin: null,          // Origin allowed for postMessage (null = any)
        
        // Modal mode options
        modalSize: 'lg',              // 'sm', 'md', 'lg', 'xl', 'fullscreen'
        modalTitle: '',               // Modal header title
        modalClosable: true,          // Show close button
        
        // Detached mode options
        windowWidth: 800,             // External window width
        windowHeight: 600,            // External window height
        windowFeatures: {             // window.open() features
            toolbar: 'no',
            location: 'no',
            directories: 'no',
            status: 'no',
            menubar: 'no',
            scrollbars: 'yes',
            resizable: 'yes',
            copyhistory: 'no'
        },
        triggerText: 'Open',          // Text for trigger button
        triggerIcon: null,            // Icon class for trigger (e.g., 'fas fa-external-link-alt')
        triggerClass: 'btn btn-primary funky-iframe-trigger',
        overlayMessage: "Window opened in a new tab. Don't see it?",
        findWindowText: 'Find Window',
        closeWindowText: '×',
        
        // Callbacks
        onLoad: null,                 // Called when iframe loads
        onReady: null,                // Called when iframe signals ready
        onMessage: null,              // Called on postMessage from iframe
        onAction: null,               // Called for 'action' postMessages
        onResize: null,               // Called when iframe resizes
        onClose: null,                // Called when modal/window closes
        onError: null                 // Called on error
    };

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    /**
     * Iframe constructor
     * @param {string|Element} element - Container element or selector
     * @param {Object} options - Configuration options
     */
    function Iframe(element, options) {
        // Resolve element
        if (typeof element === 'string') {
            this.element = document.querySelector(element);
        } else if (element && element.el) {
            // Unwrap ElementWrapper
            this.element = element.el;
        } else {
            this.element = element;
        }

        if (!this.element) {
            console.error('[Funky.Iframe] Container element not found');
            return;
        }

        // Merge options
        this.options = {};
        for (var key in defaults) {
            if (defaults.hasOwnProperty(key)) {
                this.options[key] = options && options.hasOwnProperty(key) 
                    ? options[key] 
                    : defaults[key];
            }
        }

        // Validate required options
        if (!this.options.src) {
            console.error('[Funky.Iframe] src option is required');
            return;
        }

        // Generate ID if not provided
        this.id = this.options.id || this._generateId();
        
        // Store ID on element
        this.element.setAttribute('data-iframe-id', this.id);
        
        // State
        this.iframe = null;           // Iframe element (embed/modal modes)
        this.modal = null;            // Modal instance (modal mode)
        this.externalWindow = null;   // External window reference (detached mode)
        this.overlay = null;          // Overlay element (detached mode)
        this.trigger = null;          // Trigger button element
        this.destroyed = false;

        // Initialize
        this._init();
    }

    // =========================================================================
    // PRIVATE METHODS
    // =========================================================================

    /**
     * Generate unique ID
     * @private
     */
    Iframe.prototype._generateId = function() {
        return 'iframe_' + (++instanceIdCounter) + '_' + Date.now();
    };

    /**
     * Initialize component
     * @private
     */
    Iframe.prototype._init = function() {
        var opts = this.options;

        // Render based on mode
        switch (opts.mode) {
            case 'modal':
                this._renderModal();
                break;
            case 'detached':
                this._renderDetached();
                break;
            case 'embed':
            default:
                this._renderEmbed();
                break;
        }

        // Setup postMessage listener
        this._setupPostMessage();

        // Emit init event
        E.emit(this.element, 'funky.iframe.init', { iframe: this });
    };

    /**
     * Create the iframe element with all attributes
     * @private
     * @returns {HTMLIFrameElement}
     */
    Iframe.prototype._createIframeElement = function() {
        var self = this;
        var opts = this.options;

        var iframe = document.createElement('iframe');
        iframe.id = this.id;
        iframe.className = opts.iframeClass;
        iframe.src = opts.src;

        // Dimensions
        iframe.style.width = typeof opts.width === 'number' ? opts.width + 'px' : opts.width;
        iframe.style.height = typeof opts.height === 'number' ? opts.height + 'px' : opts.height;
        if (opts.minHeight) {
            iframe.style.minHeight = typeof opts.minHeight === 'number' ? opts.minHeight + 'px' : opts.minHeight;
        }

        // Attributes
        if (opts.sandbox) {
            iframe.setAttribute('sandbox', opts.sandbox);
        }
        if (opts.scrolling && opts.scrolling !== 'auto') {
            iframe.setAttribute('scrolling', opts.scrolling);
        }
        if (opts.allowFullscreen) {
            iframe.setAttribute('allowfullscreen', '');
        }
        if (opts.loading) {
            iframe.setAttribute('loading', opts.loading);
        }
        if (opts.referrerPolicy) {
            iframe.setAttribute('referrerpolicy', opts.referrerPolicy);
        }

        // Accessibility
        iframe.setAttribute('title', opts.modalTitle || 'Embedded content');

        // Load event
        iframe.onload = function() {
            E.emit(self.element, 'funky.iframe.loaded', { iframe: self });
            if (opts.onLoad) {
                opts.onLoad(self);
            }
        };

        // Error event
        iframe.onerror = function(err) {
            E.emit(self.element, 'funky.iframe.error', { iframe: self, error: err });
            if (opts.onError) {
                opts.onError(self, err);
            }
        };

        return iframe;
    };

    /**
     * Render iframe in embed mode (inline)
     * @private
     */
    Iframe.prototype._renderEmbed = function() {
        var opts = this.options;

        // Add embed modifier class to container
        this.element.classList.add(opts.containerClass);
        this.element.classList.add(opts.containerClass + '--embed');

        // Create and append iframe
        this.iframe = this._createIframeElement();
        this.element.appendChild(this.iframe);

        // Setup auto-resize if enabled
        if (opts.autoResize) {
            this._setupResizeObserver();
        }
    };

    /**
     * Setup ResizeObserver for auto-resize
     * @private
     */
    Iframe.prototype._setupResizeObserver = function() {
        var self = this;

        // Only works for same-origin iframes
        // For cross-origin, rely on postMessage resize events
        this._resizeObserver = null;

        // Try to observe iframe content if same-origin
        if (this.iframe) {
            this.iframe.onload = function() {
                try {
                    if (!self.iframe || !self.iframe.contentWindow) return; // Guard for destroyed iframe
                    var doc = self.iframe.contentDocument || self.iframe.contentWindow.document;
                    if (doc && doc.body) {
                        // Observe body size changes
                        if (typeof ResizeObserver !== 'undefined') {
                            self._resizeObserver = new ResizeObserver(function(entries) {
                                for (var i = 0; i < entries.length; i++) {
                                    var entry = entries[i];
                                    var height = entry.contentRect.height;
                                    if (height > 0) {
                                        self.iframe.style.height = height + 'px';
                                        E.emit(self.element, 'funky.iframe.resized', {
                                            iframe: self,
                                            width: self.iframe.offsetWidth,
                                            height: height
                                        });
                                        if (self.options.onResize) {
                                            self.options.onResize(self, self.iframe.offsetWidth, height);
                                        }
                                    }
                                }
                            });
                            self._resizeObserver.observe(doc.body);
                        }
                    }
                } catch (e) {
                    // Cross-origin - can't access contentDocument
                    // Will rely on postMessage for resize
                }

                // Also call original onLoad
                E.emit(self.element, 'funky.iframe.loaded', { iframe: self });
                if (self.options.onLoad) {
                    self.options.onLoad(self);
                }
            };
        }
    };

    // =========================================================================
    // PUBLIC METHODS - EMBED MODE
    // =========================================================================

    /**
     * Scroll iframe to specific coordinates
     * @param {number} x - Horizontal position
     * @param {number} y - Vertical position
     */
    Iframe.prototype.setWindow = function(x, y) {
        if (!this.iframe) return;

        try {
            var win = this.iframe.contentWindow;
            if (win) {
                win.scrollTo(x, y);
            }
        } catch (e) {
            // Cross-origin - can't access contentWindow.scrollTo
            console.warn('[Funky.Iframe] Cannot scroll cross-origin iframe');
        }
    };

    /**
     * Scroll iframe by relative amount
     * @param {number} x - Horizontal offset
     * @param {number} y - Vertical offset
     */
    Iframe.prototype.scrollWindow = function(x, y) {
        if (!this.iframe) return;

        try {
            var win = this.iframe.contentWindow;
            if (win) {
                win.scrollBy(x, y);
            }
        } catch (e) {
            // Cross-origin - can't access contentWindow.scrollBy
            console.warn('[Funky.Iframe] Cannot scroll cross-origin iframe');
        }
    };

    /**
     * Manually resize the iframe
     * @param {string|number} width - New width
     * @param {string|number} height - New height
     */
    Iframe.prototype.resize = function(width, height) {
        if (!this.iframe) return;

        if (width !== undefined && width !== null) {
            this.iframe.style.width = typeof width === 'number' ? width + 'px' : width;
        }
        if (height !== undefined && height !== null) {
            this.iframe.style.height = typeof height === 'number' ? height + 'px' : height;
        }

        E.emit(this.element, 'funky.iframe.resized', {
            iframe: this,
            width: this.iframe.offsetWidth,
            height: this.iframe.offsetHeight
        });

        if (this.options.onResize) {
            this.options.onResize(this, this.iframe.offsetWidth, this.iframe.offsetHeight);
        }
    };

    /**
     * Get the iframe element
     * @returns {HTMLIFrameElement|null}
     */
    Iframe.prototype.getIframe = function() {
        return this.iframe;
    };

    /**
     * Reload the iframe content
     */
    Iframe.prototype.reload = function() {
        if (!this.iframe) return;

        try {
            this.iframe.contentWindow.location.reload();
        } catch (e) {
            // Cross-origin fallback
            this.iframe.src = this.iframe.src;
        }
    };

    /**
     * Change the iframe source
     * @param {string} src - New source URL
     */
    Iframe.prototype.setSrc = function(src) {
        this.options.src = src;
        if (this.iframe) {
            this.iframe.src = src;
        }
    };

    // =========================================================================
    // MODAL MODE
    // =========================================================================

    /**
     * Render iframe in modal mode
     * @private
     */
    Iframe.prototype._renderModal = function() {
        var self = this;
        var opts = this.options;

        // Create trigger button
        var trigger = D.create('button')
            .classAdd(opts.triggerClass)
            .attr('type', 'button');

        // Add icon if specified
        if (opts.triggerIcon) {
            var icon = D.create('i').classAdd(opts.triggerIcon);
            trigger.el.appendChild(icon.el);
            trigger.el.appendChild(document.createTextNode(' ' + opts.triggerText));
        } else {
            trigger.text(opts.triggerText);
        }

        trigger.on('click', function(e) {
            e.preventDefault();
            self.openModal();
        });

        // Append trigger to container
        this.element.appendChild(trigger.el);
        this.trigger = trigger.el;
    };

    /**
     * Create the modal element with iframe
     * @private
     */
    Iframe.prototype._createModalElement = function() {
        var self = this;
        var opts = this.options;
        var modalId = this.id + '_modal';

        // Check if Funky.Modal is available
        if (!Funky.Modal || !Funky.Modal.create) {
            console.error('[Funky.Iframe] Funky.Modal not found');
            return null;
        }

        // Create iframe element first
        this.iframe = this._createIframeElement();
        this.iframe.style.width = '100%';
        this.iframe.style.height = '100%';
        this.iframe.style.minHeight = '400px';
        this.iframe.style.border = 'none';

        // Create modal using Funky.Modal.create
        var modalEl = Funky.Modal.create({
            id: modalId,
            title: opts.modalTitle,
            body: this.iframe,
            size: opts.modalSize,
            scrollable: false,
            centered: true,
            showClose: opts.modalClosable,
            footerButtons: []
        });

        return modalEl;
    };

    /**
     * Open the modal
     */
    Iframe.prototype.openModal = function() {
        var self = this;
        var opts = this.options;
        var modalId = this.id + '_modal';

        // Create modal if not exists
        var modalEl = document.getElementById(modalId);
        if (!modalEl) {
            modalEl = this._createModalElement();
            if (!modalEl) return;
        }

        // Get or create modal instance
        this.modal = Funky.Modal.getInstance(modalEl) || new Funky.Modal(modalEl, {
            backdrop: true,
            keyboard: opts.modalClosable
        });

        // Listen for close (once - auto-removes after firing)
        E.once(modalEl, 'funky.modal.hidden', function() {
            E.emit(self.element, 'funky.iframe.closed', { iframe: self, mode: 'modal' });
            if (opts.onClose) {
                opts.onClose(self);
            }
        });

        // Show modal
        this.modal.show();

        // Emit opened event
        E.emit(this.element, 'funky.iframe.opened', { iframe: this, mode: 'modal' });
    };

    /**
     * Close the modal
     */
    Iframe.prototype.closeModal = function() {
        if (this.modal) {
            this.modal.hide();
        }
    };

    /**
     * Check if modal is open
     * @returns {boolean}
     */
    Iframe.prototype.isModalOpen = function() {
        if (!this.modal) return false;
        var modalEl = document.getElementById(this.id + '_modal');
        return modalEl && modalEl.classList.contains('show');
    };

    // =========================================================================
    // DETACHED MODE
    // =========================================================================

    /**
     * Render iframe in detached mode (external window)
     * @private
     */
    Iframe.prototype._renderDetached = function() {
        var self = this;
        var opts = this.options;

        // Create trigger button
        var trigger = D.create('button')
            .classAdd(opts.triggerClass)
            .attr('type', 'button');

        // Add icon if specified
        if (opts.triggerIcon) {
            var icon = D.create('i').classAdd(opts.triggerIcon);
            trigger.el.appendChild(icon.el);
            trigger.el.appendChild(document.createTextNode(' ' + opts.triggerText));
        } else {
            trigger.text(opts.triggerText);
        }

        trigger.on('click', function(e) {
            e.preventDefault();
            self.openWindow();
        });

        // Append trigger to container
        this.element.appendChild(trigger.el);
        this.trigger = trigger.el;

        // Setup unload handler
        this._setupUnloadHandler();
    };

    /**
     * Build window.open() features string
     * @private
     */
    Iframe.prototype._buildWindowFeatures = function() {
        var opts = this.options;
        var f = opts.windowFeatures;

        // Calculate centered position
        var left = Math.round((screen.width / 2) - (opts.windowWidth / 2));
        var top = Math.round((screen.height / 2) - (opts.windowHeight / 2));

        var features = [
            'width=' + opts.windowWidth,
            'height=' + opts.windowHeight,
            'left=' + left,
            'top=' + top,
            'toolbar=' + (f.toolbar || 'no'),
            'location=' + (f.location || 'no'),
            'directories=' + (f.directories || 'no'),
            'status=' + (f.status || 'no'),
            'menubar=' + (f.menubar || 'no'),
            'scrollbars=' + (f.scrollbars || 'yes'),
            'resizable=' + (f.resizable || 'yes'),
            'copyhistory=' + (f.copyhistory || 'no')
        ];

        return features.join(',');
    };

    /**
     * Open content in external window
     */
    Iframe.prototype.openWindow = function() {
        var self = this;
        var opts = this.options;

        // Build window features string
        var features = this._buildWindowFeatures();

        // Open window
        this.externalWindow = window.open('', '_blank', features);

        if (!this.externalWindow) {
            console.error('[Funky.Iframe] Popup blocked');
            if (opts.onError) {
                opts.onError(this, { type: 'popup_blocked', message: 'Popup was blocked by browser' });
            }
            E.emit(this.element, 'funky.iframe.error', {
                iframe: this,
                error: { type: 'popup_blocked', message: 'Popup was blocked by browser' }
            });
            return;
        }

        // Create overlay
        this._createOverlay();

        // Load URL after short delay (allows overlay to animate in)
        setTimeout(function() {
            if (self.externalWindow) {
                self.externalWindow.location.href = opts.src;
            }
        }, 100);

        // Poll for window close
        this._startWindowPoll();

        // Emit event
        E.emit(this.element, 'funky.iframe.opened', { iframe: this, mode: 'detached' });
    };

    /**
     * Create fullscreen overlay for detached window
     * @private
     */
    Iframe.prototype._createOverlay = function() {
        var self = this;
        var opts = this.options;

        // Create overlay container
        var overlay = D.create('div')
            .classAdd('funky-iframe-overlay')
            .attr('data-iframe-id', this.id);

        // Close button (top right)
        var closeBtn = D.create('a')
            .classAdd('funky-iframe-overlay-close')
            .attr('href', '#')
            .attr('aria-label', 'Close external window')
            .html(opts.closeWindowText);

        closeBtn.on('click', function(e) {
            e.preventDefault();
            self.closeWindow();
        });

        overlay.append(closeBtn);

        // Center message container
        var messageContainer = D.create('div')
            .classAdd('funky-iframe-overlay-message');

        // Message text
        var messageText = D.create('p')
            .classAdd('funky-iframe-overlay-text')
            .text(opts.overlayMessage);

        messageContainer.append(messageText);

        // Find window button
        var findBtn = D.create('a')
            .classAdd('funky-iframe-overlay-find')
            .attr('href', '#')
            .text(opts.findWindowText);

        findBtn.on('click', function(e) {
            e.preventDefault();
            self.focusWindow();
        });

        messageContainer.append(findBtn);
        overlay.append(messageContainer);

        // Add to body
        document.body.appendChild(overlay.el);
        this.overlay = overlay.el;

        // Animate in
        setTimeout(function() {
            if (self.overlay) {
                self.overlay.classList.add('funky-iframe-overlay--visible');
            }
        }, 10);

        // Prevent body scroll while overlay is shown
        document.body.classList.add('funky-iframe-overlay-open');
    };

    /**
     * Remove overlay
     * @private
     */
    Iframe.prototype._removeOverlay = function() {
        var self = this;

        if (!this.overlay) return;

        // Animate out
        this.overlay.classList.remove('funky-iframe-overlay--visible');

        // Remove after animation
        setTimeout(function() {
            if (self.overlay && self.overlay.parentNode) {
                self.overlay.parentNode.removeChild(self.overlay);
                self.overlay = null;
            }
        }, 300);

        // Re-enable body scroll
        document.body.classList.remove('funky-iframe-overlay-open');
    };

    /**
     * Focus the external window
     */
    Iframe.prototype.focusWindow = function() {
        if (this.externalWindow && !this.externalWindow.closed) {
            this.externalWindow.focus();
        }
    };

    /**
     * Close the external window
     */
    Iframe.prototype.closeWindow = function() {
        if (this.externalWindow && !this.externalWindow.closed) {
            this.externalWindow.close();
        }
        this._onWindowClosed();
    };

    /**
     * Start polling for window closure
     * @private
     */
    Iframe.prototype._startWindowPoll = function() {
        var self = this;

        this._windowPollInterval = setInterval(function() {
            if (!self.externalWindow || self.externalWindow.closed) {
                self._onWindowClosed();
            }
        }, 500);
    };

    /**
     * Handle window closed
     * @private
     */
    Iframe.prototype._onWindowClosed = function() {
        var opts = this.options;

        // Stop polling
        if (this._windowPollInterval) {
            clearInterval(this._windowPollInterval);
            this._windowPollInterval = null;
        }

        // Remove overlay
        this._removeOverlay();

        // Clear reference
        this.externalWindow = null;

        // Callback
        if (opts.onClose) {
            opts.onClose(this);
        }

        // Emit event
        E.emit(this.element, 'funky.iframe.closed', { iframe: this, mode: 'detached' });
    };

    /**
     * Setup unload handler to close external window
     * @private
     */
    Iframe.prototype._setupUnloadHandler = function() {
        var self = this;

        this._unloadHandler = function() {
            if (self.externalWindow && !self.externalWindow.closed) {
                self.externalWindow.close();
            }
        };

        window.addEventListener('beforeunload', this._unloadHandler);
    };

    /**
     * Check if external window is open
     * @returns {boolean}
     */
    Iframe.prototype.isWindowOpen = function() {
        return this.externalWindow && !this.externalWindow.closed;
    };

    // =========================================================================
    // POSTMESSAGE BRIDGE
    // =========================================================================

    /**
     * Setup postMessage listener for cross-origin communication
     * @private
     */
    Iframe.prototype._setupPostMessage = function() {
        var self = this;

        this._messageHandler = function(event) {
            self._handleMessage(event);
        };

        window.addEventListener('message', this._messageHandler);
    };

    /**
     * Handle incoming postMessage
     * @private
     */
    Iframe.prototype._handleMessage = function(event) {
        var opts = this.options;

        // Origin validation (if configured)
        if (opts.allowedOrigin && event.origin !== opts.allowedOrigin) {
            return;
        }

        // Parse message data
        var data;
        if (typeof event.data === 'string') {
            try {
                data = JSON.parse(event.data);
            } catch (e) {
                // Not JSON, ignore
                return;
            }
        } else {
            data = event.data;
        }

        // Must have action
        if (!data || !data.action) {
            return;
        }

        // Handle the action
        this._handlePostMessageAction(data, event);
    };

    /**
     * Handle postMessage action
     * @private
     */
    Iframe.prototype._handlePostMessageAction = function(data, event) {
        var opts = this.options;
        var action = data.action;

        switch (action) {
            case 'resize':
                this._handleResizeAction(data);
                break;

            case 'close':
                this._handleCloseAction(data);
                break;

            case 'redirect':
                this._handleRedirectAction(data);
                break;

            case 'action':
                this._handleActionAction(data);
                break;

            default:
                // Check for custom handler
                if (opts.onMessage) {
                    opts.onMessage(this, data, event);
                }
                
                // Emit generic event
                E.emit(this.element, 'funky.iframe.message', {
                    iframe: this,
                    data: data,
                    event: event
                });
        }
    };

    /**
     * Handle resize action from iframe
     * @private
     */
    Iframe.prototype._handleResizeAction = function(data) {
        if (!this.iframe) return;

        var height = data.height;
        var width = data.width;

        if (height) {
            this.iframe.style.height = (typeof height === 'number') ? height + 'px' : height;
        }

        if (width) {
            this.iframe.style.width = (typeof width === 'number') ? width + 'px' : width;
        }

        E.emit(this.element, 'funky.iframe.resized', {
            iframe: this,
            width: width,
            height: height
        });

        if (this.options.onResize) {
            this.options.onResize(this, width, height);
        }
    };

    /**
     * Handle close action from iframe
     * @private
     */
    Iframe.prototype._handleCloseAction = function(data) {
        var mode = this.options.mode;

        if (mode === 'modal') {
            this.closeModal();
        } else if (mode === 'detached') {
            // External window should close itself, but we clean up overlay
            this._onWindowClosed();
        }

        E.emit(this.element, 'funky.iframe.close-requested', { iframe: this, data: data });
    };

    /**
     * Handle redirect action from iframe
     * @private
     */
    Iframe.prototype._handleRedirectAction = function(data) {
        var url = data.url;

        if (!url) {
            console.warn('[Funky.Iframe] Redirect action missing URL');
            return;
        }

        // Validate URL (basic check)
        if (url.indexOf('javascript:') === 0) {
            console.error('[Funky.Iframe] Blocked dangerous redirect');
            return;
        }

        // Redirect parent window
        window.location.href = url;
    };

    /**
     * Handle generic action with callback
     * @private
     */
    Iframe.prototype._handleActionAction = function(data) {
        var opts = this.options;
        var actionName = data.name || data.type;
        var payload = data.payload || data.data || {};

        // Check for registered callback
        if (opts.onAction) {
            opts.onAction(this, actionName, payload);
        }

        // Emit specific action event
        E.emit(this.element, 'funky.iframe.action', {
            iframe: this,
            action: actionName,
            payload: payload
        });

        // Also emit namespaced event for specific action handlers
        E.emit(this.element, 'funky.iframe.action.' + actionName, {
            iframe: this,
            payload: payload
        });
    };

    /**
     * Send message to iframe
     * @param {Object|string} message - Message to send
     * @param {string} [targetOrigin] - Target origin (defaults to allowedOrigin or '*')
     * @returns {boolean} - True if sent successfully
     */
    Iframe.prototype.postMessage = function(message, targetOrigin) {
        var opts = this.options;

        // For embed/modal modes, use the iframe
        if (this.iframe) {
            // Double-check contentWindow exists (iframe may have been removed from DOM)
            var contentWindow = this.iframe.contentWindow;
            if (!contentWindow) {
                console.warn('[Funky.Iframe] contentWindow not available');
                return false;
            }

            var data = (typeof message === 'object') ? JSON.stringify(message) : message;
            var origin = targetOrigin || opts.allowedOrigin || '*';

            try {
                contentWindow.postMessage(data, origin);
                return true;
            } catch (e) {
                console.error('[Funky.Iframe] postMessage failed:', e);
                return false;
            }
        }

        // For detached mode, use the external window
        if (this.externalWindow && !this.externalWindow.closed) {
            var data = (typeof message === 'object') ? JSON.stringify(message) : message;
            var origin = targetOrigin || opts.allowedOrigin || '*';

            try {
                this.externalWindow.postMessage(data, origin);
                return true;
            } catch (e) {
                console.error('[Funky.Iframe] postMessage to window failed:', e);
                return false;
            }
        }

        console.warn('[Funky.Iframe] Cannot postMessage - no iframe or window available');
        return false;
    };

    /**
     * Clean up message handler
     * @private
     */
    Iframe.prototype._cleanupPostMessage = function() {
        if (this._messageHandler) {
            window.removeEventListener('message', this._messageHandler);
            this._messageHandler = null;
        }
    };

    // =========================================================================
    // DESTROY
    // =========================================================================

    /**
     * Destroy instance and cleanup
     */
    Iframe.prototype.destroy = function() {
        if (this.destroyed) return;
        this.destroyed = true;

        // Clean up postMessage listener
        this._cleanupPostMessage();

        // Disconnect ResizeObserver
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }

        // Stop window polling
        if (this._windowPollInterval) {
            clearInterval(this._windowPollInterval);
            this._windowPollInterval = null;
        }

        // Remove unload handler
        if (this._unloadHandler) {
            window.removeEventListener('beforeunload', this._unloadHandler);
            this._unloadHandler = null;
        }

        // Close external window if open
        if (this.externalWindow && !this.externalWindow.closed) {
            this.externalWindow.close();
        }

        // Remove overlay
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
            document.body.classList.remove('funky-iframe-overlay-open');
        }

        // Dispose modal
        if (this.modal && this.modal.dispose) {
            this.modal.dispose();
        }

        // Remove modal element
        var modalEl = document.getElementById(this.id + '_modal');
        if (modalEl && modalEl.parentNode) {
            modalEl.parentNode.removeChild(modalEl);
        }

        // Remove iframe
        if (this.iframe && this.iframe.parentNode) {
            this.iframe.parentNode.removeChild(this.iframe);
        }

        // Remove trigger
        if (this.trigger && this.trigger.parentNode) {
            this.trigger.parentNode.removeChild(this.trigger);
        }

        // Remove from instances
        instances.unregister(this.id);

        // Clear element attribute (guard for destroyed element)
        if (this.element) {
            this.element.removeAttribute('data-iframe-id');
            // Emit destroyed event
            E.emit(this.element, 'funky.iframe.destroyed', { id: this.id });
        }
    };

    // =========================================================================
    // STATIC API
    // =========================================================================

    var Iframe_API = {
        _instances: instances,

        /**
         * Initialize an iframe instance
         * @param {HTMLElement|string} target - Container element or selector
         * @param {Object} options - Configuration options
         * @returns {Iframe}
         */
        init: function(target, options) {
            var el = typeof target === 'string' ? D.one(target) : target;
            if (!el) {
                console.error('[Funky.Iframe] Target not found:', target);
                return null;
            }

            // Unwrap ElementWrapper
            if (el.el) el = el.el;

            // Check for existing instance
            var existingId = el.getAttribute('data-iframe-id');
            if (existingId && instances.get(existingId)) {
                return instances.get(existingId);
            }

            var iframe = new Iframe(el, options);
            instances.register(iframe.id, iframe);
            return iframe;
        },

        /**
         * @deprecated Use init() instead
         */
        create: function(target, options) {
            return this.init(target, options);
        },

        /**
         * Get iframe instance by element
         */
        getInstance: function(target) {
            var el = typeof target === 'string' ? D.one(target) : target;
            if (!el) return null;
            if (el.el) el = el.el;

            var id = el.getAttribute('data-iframe-id');
            return id ? instances.get(id) : null;
        },

        /**
         * Initialize all iframes in container (data-attribute auto-init)
         * @param {HTMLElement} container - Container to search in
         * @returns {number} Number of iframes initialized
         */
        initAll: function(container) {
            container = container || document;
            var count = 0;

            D.all(container.querySelectorAll(SELECTOR)).each(function(el) {
                var element = el.el || el;
                if (element.getAttribute('data-iframe-id')) return;

                var options = parseDataAttributes(element);
                var iframe = new Iframe(element, options);
                instances.register(iframe.id, iframe);
                count++;
            });

            if (count > 0) {
                E.emit(document, 'funky.iframe.init', { count: count });
            }

            return count;
        },

        /**
         * Start observing DOM for new iframes
         */
        observe: function() {
            if (observer) return;

            observer = new MutationObserver(function(mutations) {
                var needsInit = false;

                mutations.forEach(function(mutation) {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1) {
                            if (node.matches && node.matches(SELECTOR)) {
                                needsInit = true;
                            } else if (node.querySelector && node.querySelector(SELECTOR)) {
                                needsInit = true;
                            }
                        }
                    });
                });

                if (needsInit) {
                    Iframe_API.initAll();
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        },

        /**
         * Destroy instance by ID
         * @param {string} id - Instance ID
         */
        destroy: function(id) {
            var instance = instances.get(id);
            if (instance) {
                instance.destroy();
            }
        },

        /**
         * Destroy all instances
         */
        destroyAll: function() {
            instances.destroyAll();
        }
    };

    // =========================================================================
    // UTILITIES
    // =========================================================================

    /**
     * Parse data attributes to options
     */
    function parseDataAttributes(el) {
        var opts = {};

        if (el.dataset.src) opts.src = el.dataset.src;
        if (el.dataset.mode) opts.mode = el.dataset.mode;
        if (el.dataset.width) opts.width = el.dataset.width;
        if (el.dataset.height) opts.height = el.dataset.height;
        if (el.dataset.modalTitle) opts.modalTitle = el.dataset.modalTitle;
        if (el.dataset.modalSize) opts.modalSize = el.dataset.modalSize;
        if (el.dataset.triggerText) opts.triggerText = el.dataset.triggerText;
        if (el.dataset.triggerIcon) opts.triggerIcon = el.dataset.triggerIcon;
        if (el.dataset.triggerClass) opts.triggerClass = el.dataset.triggerClass;
        if (el.dataset.overlayMessage) opts.overlayMessage = el.dataset.overlayMessage;
        if (el.dataset.windowWidth) opts.windowWidth = parseInt(el.dataset.windowWidth, 10);
        if (el.dataset.windowHeight) opts.windowHeight = parseInt(el.dataset.windowHeight, 10);
        if (el.dataset.allowedOrigin) opts.allowedOrigin = el.dataset.allowedOrigin;
        if (el.dataset.title) opts.title = el.dataset.title;
        if (el.dataset.autoResize === 'false') opts.autoResize = false;
        if (el.dataset.modalClosable === 'false') opts.modalClosable = false;

        return opts;
    }

    // =========================================================================
    // REGISTRATION
    // =========================================================================

    Funky.register('Iframe', Iframe_API);

    // Auto-init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            Iframe_API.initAll();
            Iframe_API.observe();
        });
    } else {
        Iframe_API.initAll();
        Iframe_API.observe();
    }

})(window);

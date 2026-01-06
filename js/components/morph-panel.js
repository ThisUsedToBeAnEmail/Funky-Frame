/**
 * Funky.MorphPanel - Smooth trigger-to-panel morphing component
 * 
 * Creates panels that morph from trigger elements using FLIP animation.
 * SlidePanel-compatible API with Funky.Morph integration.
 * 
 * @namespace Funky.MorphPanel
 * @requires Funky.Dom
 * @requires Funky.Morph
 * @optional Funky.FocusManager
 * @optional Funky.Announce
 * @version 1.0.3
 */
(function(global) {
    'use strict';

    // =========================================================================
    // Dependency Checks
    // =========================================================================

    if (!global.Funky || !global.Funky.register) {
        console.error('[Funky.MorphPanel] Registry not found. Load namespace.js first.');
        return;
    }

    // Prevent double registration
    if (global.Funky.isRegistered && global.Funky.isRegistered('MorphPanel')) {
        return;
    }

    var Funky = global.Funky;
    var D = Funky.Dom;
    var E = Funky.Events;
    var Morph = Funky.Morph;

    if (!D) {
        console.error('[Funky.MorphPanel] Funky.Dom not found. Load dom.js first.');
        return;
    }

    // =========================================================================
    // PRIVATE STATE
    // =========================================================================

    var _panels = Funky.Registry.create('morphPanelConfigs');  // Registered panel configs
    var _instances = Funky.Registry.createInstanceRegistry('MorphPanel');  // Active panel instances
    var _activePanel = null;    // Currently open panel ID
    var _scrollPosition = 0;    // Saved scroll position for lock

    // =========================================================================
    // DEFAULT OPTIONS
    // =========================================================================

    var DEFAULTS = {
        // Position & Size
        position: 'center',      // 'left'|'right'|'top'|'bottom'|'center'
        size: 'md',              // 'sm'|'md'|'lg'|'xl'|'full'
        
        // Animation
        preset: 'expand',        // Morph preset
        duration: 300,           // Animation duration
        
        // Behavior
        backdrop: true,          // Show backdrop overlay
        keyboard: true,          // Escape to close
        focusTrap: true,         // Trap focus inside
        scrollLock: true,        // Lock body scroll
        closeButton: true,       // Show close button
        closeOnBackdrop: true,   // Close when backdrop clicked
        
        // Callbacks
        onShow: null,
        onShown: null,
        onHide: null,
        onHidden: null,
        
        // Form Mode
        schema: null,            // Native form schema object
        schemaPath: null,        // OpenAPI schema path to load
        
        // API Integration
        apiUrl: null,            // API endpoint for CRUD
        entity: null,            // Entity name for cache invalidation
        entityLabel: null,       // Human-readable label
        
        // Form Behavior
        validateOnBlur: true,
        validateOnChange: true,
        resetOnClose: true,
        
        // Form Callbacks
        enhanceSchema: null,     // function(schema, data) => schema
        onChange: null,          // function(field, value, data)
        onSubmit: null,          // function(data, mode) => Promise
        onSave: null,            // function(data, mode)
        onError: null,           // function(errors)
        
        // Form UI
        submitText: 'Save',
        cancelText: 'Cancel',
        createTitle: null,       // Title for create mode
        editTitle: null          // Title for edit mode
    };

    // =========================================================================
    // UTILITY FUNCTIONS
    // =========================================================================

    /**
     * Merge options with defaults
     * @param {Object} options - User options
     * @returns {Object} Merged options
     */
    function mergeOptions(options) {
        var result = {};
        var key;
        for (key in DEFAULTS) {
            if (DEFAULTS.hasOwnProperty(key)) {
                result[key] = DEFAULTS[key];
            }
        }
        for (key in options) {
            if (options.hasOwnProperty(key)) {
                result[key] = options[key];
            }
        }
        return result;
    }

    // =========================================================================
    // SCROLL LOCK
    // =========================================================================

    /**
     * Lock body scroll
     */
    function lockScroll() {
        _scrollPosition = window.pageYOffset;
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = '-' + _scrollPosition + 'px';
        document.body.style.width = '100%';
    }

    /**
     * Unlock body scroll
     */
    function unlockScroll() {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, _scrollPosition);
    }

    // =========================================================================
    // POSITION HELPERS
    // =========================================================================

    /**
     * Get fallback transform for position when no trigger (CSS animation only)
     * @param {string} position - Panel position
     * @param {boolean} visible - Whether panel should be visible
     * @returns {string} CSS transform value
     */
    function getFallbackTransform(position, visible) {
        var transforms = {
            center: {
                hidden: 'translate(-50%, -50%) scale(0.95)',
                visible: 'translate(-50%, -50%) scale(1)'
            },
            left: {
                hidden: 'translateX(-100%)',
                visible: 'translateX(0)'
            },
            right: {
                hidden: 'translateX(100%)',
                visible: 'translateX(0)'
            },
            top: {
                hidden: 'translateX(-50%) translateY(-100%)',
                visible: 'translateX(-50%) translateY(0)'
            },
            bottom: {
                hidden: 'translateX(-50%) translateY(100%)',
                visible: 'translateX(-50%) translateY(0)'
            }
        };

        var positionTransforms = transforms[position] || transforms.center;
        return visible ? positionTransforms.visible : positionTransforms.hidden;
    }

    /**
     * Get optimal morph preset for position
     * @param {string} position - Panel position
     * @param {string} defaultPreset - User-specified preset (may override)
     * @returns {string} Morph preset name
     */
    function getPresetForPosition(position, defaultPreset) {
        // If user specified a preset, use it
        if (defaultPreset && defaultPreset !== 'auto') {
            return defaultPreset;
        }

        // Auto-select based on position
        var positionPresets = {
            center: 'expand',
            left: 'slide',
            right: 'slide',
            top: 'slide',
            bottom: 'slide'
        };

        return positionPresets[position] || 'expand';
    }

    // =========================================================================
    // FOCUS TRAP
    // =========================================================================

    /**
     * Create focus trap for container
     * @param {Element} container - Container element
     * @returns {Function} Cleanup function
     */
    function trapFocus(container) {
        // Use FocusManager if available
        if (Funky.FocusManager && typeof Funky.FocusManager.trapFocus === 'function') {
            return Funky.FocusManager.trapFocus(container);
        }

        // Inline fallback
        var focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), ' +
            'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
        
        function handleKeydown(e) {
            if (e.key !== 'Tab') return;

            var focusable = container.querySelectorAll(focusableSelector);
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

        container.addEventListener('keydown', handleKeydown);

        // Return cleanup function
        return function() {
            container.removeEventListener('keydown', handleKeydown);
        };
    }

    // =========================================================================
    // PANEL INSTANCE
    // =========================================================================

    /**
     * Panel instance constructor
     * @param {string} panelId - Panel identifier
     * @param {Object} config - Panel configuration
     */
    function PanelInstance(panelId, config) {
        this.id = panelId;
        this.config = config;
        this.trigger = null;
        this.element = null;
        this.backdrop = null;
        this.isVisible = false;
        this._focusTrapCleanup = null;
        this._keydownHandler = null;
        this._previousFocus = null;
        this._morphController = null;
        
        // Form mode state
        this._form = null;
        this._mode = null;         // 'create' | 'edit' | null
        this._entityData = null;

        this._build();
    }

    /**
     * Check if panel is configured for form mode
     * @private
     * @returns {boolean}
     */
    PanelInstance.prototype._isFormMode = function() {
        return !!(this.config.schema || this.config.schemaPath);
    };

    /**
     * Build panel DOM structure
     * @private
     */
    PanelInstance.prototype._build = function() {
        var self = this;
        var config = this.config;
        var isFormMode = this._isFormMode();

        // Create backdrop
        this.backdrop = D.create('div')
            .classAdd('funky-morph-panel__backdrop');

        // Create panel container
        this.element = D.create('div')
            .classAdd('funky-morph-panel')
            .classAdd('funky-morph-panel--' + config.position)
            .classAdd('funky-morph-panel--' + config.size)
            .attr('role', 'dialog')
            .attr('aria-modal', 'true')
            .attr('aria-hidden', 'true')
            .attr('id', this.id);

        // Add form mode class if applicable
        if (isFormMode) {
            this.element.classAdd('funky-morph-panel--form');
        }

        // Header
        var header = D.create('div')
            .classAdd('funky-morph-panel__header');

        var title = D.create('h2')
            .classAdd('funky-morph-panel__title')
            .attr('id', this.id + '-title');

        header.append(title);

        // Close button
        if (config.closeButton) {
            var closeBtn = D.create('button')
                .classAdd('funky-morph-panel__close')
                .attr('type', 'button')
                .attr('aria-label', 'Close');

            if (D.icon) {
                closeBtn.append(D.icon('fas fa-times'));
            } else {
                closeBtn.html('&times;');
            }

            closeBtn.on('click', function() {
                MorphPanel.hide(self.id);
            });

            header.append(closeBtn);
        }

        // Body
        var body = D.create('div')
            .classAdd('funky-morph-panel__body');

        // Footer
        var footer = D.create('div')
            .classAdd('funky-morph-panel__footer');

        // Add form footer buttons if in form mode
        if (isFormMode) {
            this._buildFormFooter(footer);
        } else {
            footer.style({ display: 'none' });
        }

        // Drag handle for mobile swipe
        var dragHandle = D.create('div')
            .classAdd('funky-morph-panel__drag-handle')
            .attr('aria-hidden', 'true');

        // Assemble
        this.element
            .append(dragHandle)
            .append(header)
            .append(body)
            .append(footer)
            .attr('aria-labelledby', this.id + '-title');

        // Store references
        this._header = header;
        this._title = title;
        this._dragHandle = dragHandle;
        this._body = body;
        this._footer = footer;

        // Backdrop click handler
        if (config.closeOnBackdrop) {
            var backdropEl = this.backdrop.el || this.backdrop;
            backdropEl.addEventListener('click', function(e) {
                // Only close if clicking directly on backdrop, not bubbled from panel
                if (e.target === backdropEl) {
                    MorphPanel.hide(self.id);
                }
            });
        }
    };

    /**
     * Build form footer with Cancel and Submit buttons
     * @private
     */
    PanelInstance.prototype._buildFormFooter = function(footer) {
        var self = this;
        var config = this.config;

        // Cancel button
        var cancelBtn = D.create('button')
            .classAdd('btn', 'btn-secondary')
            .attr('type', 'button')
            .text(config.cancelText)
            .on('click', function() {
                MorphPanel.hide(self.id);
            });

        // Submit button
        var submitBtn = D.create('button')
            .classAdd('btn', 'btn-primary')
            .attr('type', 'button')
            .text(config.submitText)
            .on('click', function() {
                self._handleSubmit();
            });

        this._cancelBtn = cancelBtn;
        this._submitBtn = submitBtn;

        footer.append(cancelBtn).append(submitBtn);
    };

    /**
     * Check if morph animation should be used
     * @private
     * @returns {boolean}
     */
    PanelInstance.prototype._shouldUseMorph = function() {
        // Need trigger element and Morph library
        if (!this.trigger) return false;
        if (!Morph || typeof Morph.to !== 'function') return false;

        // Get trigger dimensions - skip morph for very small triggers
        var triggerEl = this.trigger.el || this.trigger;
        var rect = triggerEl.getBoundingClientRect();
        if (rect.width < 10 || rect.height < 10) return false;

        return true;
    };

    /**
     * Get direction for slide-based reverse animation
     * @private
     * @returns {string} Direction: 'left', 'right', 'up', 'down'
     */
    PanelInstance.prototype._getReverseDirection = function() {
        var position = this.config.position;
        var directionMap = {
            center: 'down',
            left: 'left',
            right: 'right',
            top: 'up',
            bottom: 'down'
        };
        return directionMap[position] || 'down';
    };

    /**
     * Setup swipe-to-dismiss for mobile/touch devices
     * @private
     */
    PanelInstance.prototype._setupSwipeToDismiss = function() {
        var self = this;
        var config = this.config;
        var position = config.position;

        // Only enable for side/bottom positions
        if (position === 'center' && config.size !== 'full') return;

        var panelEl = this.element.el || this.element;
        var startX = 0;
        var startY = 0;
        var currentX = 0;
        var currentY = 0;
        var isDragging = false;

        var threshold = 100; // Minimum swipe distance
        var maxOpacity = 0.5; // Backdrop opacity

        function onTouchStart(e) {
            if (e.touches.length !== 1) return;
            var touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            currentX = startX;
            currentY = startY;
            isDragging = true;
            panelEl.style.transition = 'none';
        }

        function onTouchMove(e) {
            if (!isDragging || e.touches.length !== 1) return;

            var touch = e.touches[0];
            currentX = touch.clientX;
            currentY = touch.clientY;

            var deltaX = currentX - startX;
            var deltaY = currentY - startY;

            // Determine valid swipe direction based on position
            var translate = '';
            var progress = 0;

            if (position === 'left' && deltaX < 0) {
                translate = 'translateX(' + deltaX + 'px)';
                progress = Math.abs(deltaX) / panelEl.offsetWidth;
            } else if (position === 'right' && deltaX > 0) {
                translate = 'translateX(' + deltaX + 'px)';
                progress = Math.abs(deltaX) / panelEl.offsetWidth;
            } else if ((position === 'bottom' || position === 'center') && deltaY > 0) {
                translate = 'translateY(' + deltaY + 'px)';
                progress = Math.abs(deltaY) / panelEl.offsetHeight;
            } else if (position === 'top' && deltaY < 0) {
                translate = 'translateY(' + deltaY + 'px)';
                progress = Math.abs(deltaY) / panelEl.offsetHeight;
            }

            if (translate) {
                panelEl.style.transform = translate;
                // Fade backdrop
                var backdropEl = self.backdrop.el || self.backdrop;
                backdropEl.style.backgroundColor = 'rgba(0, 0, 0, ' + (maxOpacity * (1 - progress)) + ')';
            }
        }

        function onTouchEnd() {
            if (!isDragging) return;
            isDragging = false;

            var deltaX = currentX - startX;
            var deltaY = currentY - startY;

            // Check if swipe exceeds threshold
            var shouldDismiss = false;

            if (position === 'left' && deltaX < -threshold) {
                shouldDismiss = true;
            } else if (position === 'right' && deltaX > threshold) {
                shouldDismiss = true;
            } else if ((position === 'bottom' || position === 'center') && deltaY > threshold) {
                shouldDismiss = true;
            } else if (position === 'top' && deltaY < -threshold) {
                shouldDismiss = true;
            }

            panelEl.style.transition = '';
            panelEl.style.transform = '';
            var backdropEl = self.backdrop.el || self.backdrop;
            backdropEl.style.backgroundColor = '';

            if (shouldDismiss) {
                MorphPanel.hide(self.id);
            }
        }

        panelEl.addEventListener('touchstart', onTouchStart, { passive: true });
        panelEl.addEventListener('touchmove', onTouchMove, { passive: true });
        panelEl.addEventListener('touchend', onTouchEnd);
        panelEl.addEventListener('touchcancel', onTouchEnd);

        // Store cleanup function
        this._swipeCleanup = function() {
            panelEl.removeEventListener('touchstart', onTouchStart);
            panelEl.removeEventListener('touchmove', onTouchMove);
            panelEl.removeEventListener('touchend', onTouchEnd);
            panelEl.removeEventListener('touchcancel', onTouchEnd);
        };
    };

    /**
     * Show panel with morph animation from trigger
     * @param {Element|string} trigger - Trigger element
     */
    PanelInstance.prototype.show = function(trigger) {
        var self = this;
        var config = this.config;

        if (this.isVisible) return this;

        // Resolve trigger element
        this.trigger = trigger ? (typeof trigger === 'string' ? D.one(trigger) : trigger) : null;
        
        // Get raw trigger element
        var triggerEl = this.trigger ? (this.trigger.el || this.trigger) : null;
        
        this._previousFocus = document.activeElement;

        // Emit beforeShow
        this._emit('show', { panelId: this.id, trigger: triggerEl });

        if (typeof config.onShow === 'function') {
            config.onShow(this);
        }

        // Add to DOM
        var body = D.one('body');
        body.append(this.backdrop);
        body.append(this.element);

        // Show backdrop
        if (config.backdrop) {
            // Small delay for CSS transition
            requestAnimationFrame(function() {
                self.backdrop.classAdd('funky-morph-panel__backdrop--visible');
            });
        }

        // Lock scroll
        if (config.scrollLock) {
            lockScroll();
        }

        // Get raw panel element
        var panelEl = this.element.el || this.element;

        // Determine if we should use FLIP morph animation
        if (this._shouldUseMorph()) {
            // Hide trigger during animation
            triggerEl.style.visibility = 'hidden';

            // Mark as morphing
            this.element.classAdd('funky-morph-panel--morphing');

            // Get position-optimal preset
            var preset = getPresetForPosition(config.position, config.preset);

            // FLIP animation from trigger to panel
            this._morphController = Morph.to({
                from: triggerEl,
                to: panelEl,
                preset: preset,
                duration: config.duration,
                onComplete: function() {
                    self._onShowComplete();
                }
            });
        } else {
            // No trigger or no Morph - use CSS transition based on position
            // Force a reflow to ensure initial state is applied
            panelEl.offsetHeight;
            
            // Add visible class to trigger CSS transition
            this.element.classAdd('funky-morph-panel--visible');
            
            setTimeout(function() {
                self._onShowComplete();
            }, config.duration);
        }

        this.element.attr('aria-hidden', 'false');
        this.isVisible = true;
        return this;
    };

    /**
     * Called after show animation completes
     * @private
     */
    PanelInstance.prototype._onShowComplete = function() {
        var self = this;
        var config = this.config;

        this.element.classAdd('funky-morph-panel--visible');
        this.element.classRemove('funky-morph-panel--morphing');
        this._morphController = null;

        // Get raw element for focus
        var panelEl = this.element.el || this.element;

        // Setup focus trap
        if (config.focusTrap) {
            this._focusTrapCleanup = trapFocus(panelEl);
        }

        // Focus first focusable element
        var focusable = panelEl.querySelector(
            'input:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable) {
            focusable.focus();
        } else {
            panelEl.setAttribute('tabindex', '-1');
            panelEl.focus();
        }

        // Setup keyboard handler for Escape
        if (config.keyboard) {
            if (Funky.Keyboard) {
                // Push morph-panel scope so Escape handler becomes active
                Funky.Keyboard.pushScope('morph-panel');
                this._keyboardUnregister = Funky.Keyboard.register({
                    key: 'escape',
                    scope: 'morph-panel',
                    allowInInput: true,
                    priority: 10, // Higher than Morph.to() internal handler (0)
                    handler: function() {
                        // Only close if this panel is visible
                        if (self.isVisible) {
                            MorphPanel.hide(self.id);
                        }
                    },
                    description: 'Close panel',
                    group: 'Morph Panel',
                    preventDefault: true
                });
            } else {
                // Fallback for environments without Funky.Keyboard
                this._keydownHandler = function(e) {
                    if (e.key === 'Escape') {
                        MorphPanel.hide(self.id);
                    }
                };
                document.addEventListener('keydown', this._keydownHandler);
            }
        }

        // Setup swipe-to-dismiss for touch devices
        this._setupSwipeToDismiss();

        // Announce for screen readers
        if (Funky.Announce) {
            var titleEl = this._title.el || this._title;
            var titleText = titleEl.textContent || 'Panel';
            Funky.Announce.polite(titleText + ' opened');
        }

        this._emit('shown', { panelId: this.id });

        if (typeof config.onShown === 'function') {
            config.onShown(this);
        }
    };

    /**
     * Hide panel with reverse morph animation
     */
    PanelInstance.prototype.hide = function() {
        var self = this;
        var config = this.config;

        if (!this.isVisible) return this;

        // Cancel any active morph
        if (this._morphController && this._morphController.cancel) {
            this._morphController.cancel();
            this._morphController = null;
        }

        // Emit beforeHide
        this._emit('hide', { panelId: this.id });

        if (typeof config.onHide === 'function') {
            config.onHide(this);
        }

        // Cleanup focus trap
        if (this._focusTrapCleanup) {
            this._focusTrapCleanup();
            this._focusTrapCleanup = null;
        }

        // Cleanup keyboard handler and pop scope
        if (this._keyboardUnregister) {
            this._keyboardUnregister();
            this._keyboardUnregister = null;
            // Pop the morph-panel scope we pushed in show()
            if (Funky.Keyboard && Funky.Keyboard.popScope) {
                Funky.Keyboard.popScope();
            }
        }
        if (this._keydownHandler) {
            document.removeEventListener('keydown', this._keydownHandler);
            this._keydownHandler = null;
        }

        // Cleanup swipe handler
        if (this._swipeCleanup) {
            this._swipeCleanup();
            this._swipeCleanup = null;
        }

        this.element.classRemove('funky-morph-panel--visible');
        this.element.classAdd('funky-morph-panel--morphing');

        // Get raw elements
        var panelEl = this.element.el || this.element;
        var triggerEl = this.trigger ? (this.trigger.el || this.trigger) : null;

        // Reverse morph animation back to trigger
        if (this._shouldUseMorph() && triggerEl) {
            // Get position-optimal preset
            var preset = getPresetForPosition(config.position, config.preset);

            this._morphController = Morph.reverse(panelEl, {
                preset: preset,
                duration: config.duration,
                direction: this._getReverseDirection(),
                onComplete: function() {
                    self._onHideComplete();
                }
            });

            // Fallback if Morph.reverse fails (no reverse data)
            if (!this._morphController) {
                setTimeout(function() {
                    self._onHideComplete();
                }, config.duration);
            }
        } else {
            // CSS-only hide animation (transition handled by removing --visible class)
            setTimeout(function() {
                self._onHideComplete();
            }, config.duration);
        }
        return this;
    };

    /**
     * Called after hide animation completes
     * @private
     */
    PanelInstance.prototype._onHideComplete = function() {
        var config = this.config;

        this._morphController = null;

        // Hide backdrop
        this.backdrop.classRemove('funky-morph-panel__backdrop--visible');

        // Get raw elements for DOM manipulation
        var panelEl = this.element.el || this.element;
        var backdropEl = this.backdrop.el || this.backdrop;
        var triggerEl = this.trigger ? (this.trigger.el || this.trigger) : null;

        // Remove from DOM
        if (panelEl.parentNode) {
            panelEl.parentNode.removeChild(panelEl);
        }
        if (backdropEl.parentNode) {
            backdropEl.parentNode.removeChild(backdropEl);
        }

        // Restore trigger visibility
        if (triggerEl) {
            triggerEl.style.visibility = '';
        }

        // Unlock scroll
        if (config.scrollLock) {
            unlockScroll();
        }

        // Restore focus
        if (this._previousFocus && this._previousFocus.focus) {
            this._previousFocus.focus();
        }

        this.element.attr('aria-hidden', 'true');
        this.element.classRemove('funky-morph-panel--morphing');
        this.isVisible = false;

        // Form cleanup
        if (this._form) {
            // Reset form if configured
            if (config.resetOnClose && typeof this._form.reset === 'function') {
                this._form.reset();
            }
            // Destroy form if it has destroy method
            if (typeof this._form.destroy === 'function') {
                this._form.destroy();
            }
        }

        // Clear form state
        this._form = null;
        this._mode = null;
        this._entityData = null;

        // Announce for screen readers
        if (Funky.Announce) {
            Funky.Announce.polite('Panel closed');
        }

        var triggerForEvent = this.trigger ? (this.trigger.el || this.trigger) : null;
        this._emit('hidden', { panelId: this.id, trigger: triggerForEvent });

        if (typeof config.onHidden === 'function') {
            config.onHidden(this);
        }

        _activePanel = null;
    };

    /**
     * Toggle panel visibility
     * @param {Element|string} [trigger] - Trigger element for show
     * @returns {PanelInstance} this for chaining
     */
    PanelInstance.prototype.toggle = function(trigger) {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show(trigger);
        }
        return this;
    };

    /**
     * Set panel data (SlidePanel-compatible)
     * @param {Object} data - { title, content, footer }
     * @returns {PanelInstance}
     */
    PanelInstance.prototype.setData = function(data) {
        var titleEl = this._title.el || this._title;
        var bodyEl = this._body.el || this._body;
        var footerEl = this._footer.el || this._footer;

        if (data.title !== undefined) {
            titleEl.textContent = data.title;
        }

        if (data.content !== undefined) {
            if (typeof data.content === 'string') {
                bodyEl.innerHTML = data.content;
            } else if (data.content && data.content.nodeType) {
                bodyEl.innerHTML = '';
                bodyEl.appendChild(data.content);
            } else if (data.content && data.content.el) {
                // Funky.Dom wrapped element
                bodyEl.innerHTML = '';
                bodyEl.appendChild(data.content.el);
            }
        }

        if (data.footer !== undefined) {
            if (typeof data.footer === 'string') {
                footerEl.innerHTML = data.footer;
            } else if (data.footer && data.footer.nodeType) {
                footerEl.innerHTML = '';
                footerEl.appendChild(data.footer);
            } else if (data.footer && data.footer.el) {
                footerEl.innerHTML = '';
                footerEl.appendChild(data.footer.el);
            }
            footerEl.style.display = data.footer ? '' : 'none';
        }

        return this;
    };

    /**
     * Get panel body element for direct manipulation
     * @returns {Element}
     */
    PanelInstance.prototype.getBody = function() {
        return this._body.el || this._body;
    };

    /**
     * Get panel header element
     * @returns {Element}
     */
    PanelInstance.prototype.getHeader = function() {
        return this._header.el || this._header;
    };

    /**
     * Get panel footer element
     * @returns {Element}
     */
    PanelInstance.prototype.getFooter = function() {
        return this._footer.el || this._footer;
    };

    /**
     * Enable/disable form mode
     * Form mode adjusts body padding and prepares for form rendering
     * @param {boolean} enabled - Enable or disable form mode
     * @returns {PanelInstance}
     */
    PanelInstance.prototype.setFormMode = function(enabled) {
        if (enabled) {
            this.element.classAdd('funky-morph-panel--form');
        } else {
            this.element.classRemove('funky-morph-panel--form');
        }
        return this;
    };

    /**
     * Check if form mode is enabled
     * @returns {boolean}
     */
    PanelInstance.prototype.isFormMode = function() {
        var el = this.element.el || this.element;
        return el.classList.contains('funky-morph-panel--form');
    };

    /**
     * Set loading state
     * @param {boolean} loading - Enable or disable loading state
     * @returns {PanelInstance}
     */
    PanelInstance.prototype.setLoading = function(loading) {
        if (loading) {
            this.element.classAdd('funky-morph-panel--loading');
        } else {
            this.element.classRemove('funky-morph-panel--loading');
        }
        return this;
    };

    // =========================================================================
    // FORM MODE METHODS
    // =========================================================================

    /**
     * Open panel for creating new entity
     * @param {Element|string|null} trigger - Trigger element
     * @param {Object} initialData - Initial form values (optional)
     */
    PanelInstance.prototype.create = function(trigger, initialData) {
        var self = this;
        var config = this.config;

        this._mode = 'create';
        this._entityData = initialData || {};

        // Set title
        var titleText = config.createTitle || 'Create ' + (config.entityLabel || 'Item');
        var titleEl = this._title.el || this._title;
        titleEl.textContent = titleText;

        // Load schema and init form
        this._loadSchema(function(schema) {
            if (schema) {
                self._initForm(schema, self._entityData);
            }
            self.show(trigger);
        });
    };

    /**
     * Open panel for editing existing entity
     * @param {Element|string|null} trigger - Trigger element
     * @param {Object} data - Entity data to edit
     */
    PanelInstance.prototype.edit = function(trigger, data) {
        var self = this;
        var config = this.config;

        this._mode = 'edit';
        this._entityData = data || {};

        // Set title
        var titleText = config.editTitle || 'Edit ' + (config.entityLabel || 'Item');
        var titleEl = this._title.el || this._title;
        titleEl.textContent = titleText;

        // Load schema and init form
        this._loadSchema(function(schema) {
            if (schema) {
                self._initForm(schema, self._entityData);
            }
            self.show(trigger);
        });
    };

    /**
     * Load schema (from config or OpenAPI)
     * @private
     * @param {Function} callback - Called with schema
     */
    PanelInstance.prototype._loadSchema = function(callback) {
        var config = this.config;

        if (config.schema) {
            // Use provided schema
            var schema = config.schema;
            
            // Apply enhanceSchema if provided
            if (typeof config.enhanceSchema === 'function') {
                schema = config.enhanceSchema(schema, this._entityData, this._mode);
            }
            
            callback(schema);
        } else if (config.schemaPath && Funky.Schema) {
            // Load from OpenAPI
            var self = this;
            Funky.Schema.get(config.schemaPath).then(function(schema) {
                if (typeof config.enhanceSchema === 'function') {
                    schema = config.enhanceSchema(schema, self._entityData, self._mode);
                }
                callback(schema);
            }).catch(function(err) {
                console.error('[Funky.MorphPanel] Failed to load schema:', err);
                callback(null);
            });
        } else {
            callback(null);
        }
    };

    /**
     * Initialize form inside panel body
     * @private
     * @param {Object} schema - Form schema
     * @param {Object} data - Initial data
     */
    PanelInstance.prototype._initForm = function(schema, data) {
        var self = this;
        var config = this.config;

        // Check if Funky.Form exists
        if (!Funky.Form) {
            console.error('[Funky.MorphPanel] Funky.Form required for form mode. Load form.js first.');
            return;
        }

        // Clear previous form
        var bodyEl = this._body.el || this._body;
        bodyEl.innerHTML = '';

        // Create form container
        var formContainer = D.create('div')
            .classAdd('funky-morph-panel__form');
        
        var formContainerEl = formContainer.el || formContainer;
        bodyEl.appendChild(formContainerEl);

        // Create form instance
        this._form = Funky.Form.create(formContainerEl, {
            schema: schema,
            data: data,
            validateOnBlur: config.validateOnBlur,
            validateOnChange: config.validateOnChange,
            onChange: function(field, value, formData) {
                if (typeof config.onChange === 'function') {
                    config.onChange(field, value, formData);
                }
            }
        });
    };

    /**
     * Get form instance
     * @returns {Object|null} Form instance or null
     */
    PanelInstance.prototype.getForm = function() {
        return this._form || null;
    };

    /**
     * Handle form submission
     * @private
     */
    PanelInstance.prototype._handleSubmit = function() {
        var self = this;
        var config = this.config;

        if (!this._form) {
            // No form, just close
            MorphPanel.hide(this.id);
            return;
        }

        // Validate form
        var isValid = this._form.validate();
        if (!isValid) {
            // Announce validation error
            if (Funky.Announce) {
                Funky.Announce.assertive('Please fix the form errors');
            }
            return;
        }

        // Get form data
        var data = this._form.getData();

        // Emit submit event
        this._emit('submit', { panelId: this.id, data: data, mode: this._mode });

        // Show loading state
        this._setSubmitLoading(true);

        // Use custom onSubmit or default API handling
        var submitPromise;

        if (typeof config.onSubmit === 'function') {
            submitPromise = config.onSubmit(data, this._mode);
        } else if (config.apiUrl) {
            submitPromise = this._defaultApiSubmit(data);
        } else {
            // No submit handler, just close
            this._onSubmitSuccess(data);
            return;
        }

        // Handle promise result
        if (submitPromise && typeof submitPromise.then === 'function') {
            submitPromise
                .then(function(result) {
                    self._onSubmitSuccess(result || data);
                })
                .catch(function(error) {
                    self._onSubmitError(error);
                });
        } else {
            // Non-promise return, treat as success
            this._onSubmitSuccess(data);
        }
    };

    /**
     * Default API submission
     * @private
     * @param {Object} data - Form data
     * @returns {Promise}
     */
    PanelInstance.prototype._defaultApiSubmit = function(data) {
        var config = this.config;
        var url = config.apiUrl;
        var method = 'POST';

        // For edit mode, add ID and use PUT
        if (this._mode === 'edit' && data.id) {
            url = url + '/' + data.id;
            method = 'PUT';
        }

        return fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        }).then(function(response) {
            if (!response.ok) {
                return response.json().then(function(err) {
                    throw err;
                });
            }
            return response.json();
        });
    };

    /**
     * Handle successful submission
     * @private
     * @param {Object} data - Result data
     */
    PanelInstance.prototype._onSubmitSuccess = function(data) {
        var config = this.config;

        this._setSubmitLoading(false);

        // Emit save event
        this._emit('save', { panelId: this.id, data: data, mode: this._mode });

        // Call onSave callback
        if (typeof config.onSave === 'function') {
            config.onSave(data, this._mode);
        }

        // Show success toast
        if (Funky.Toast) {
            var message = this._mode === 'create' 
                ? (config.entityLabel || 'Item') + ' created successfully'
                : (config.entityLabel || 'Item') + ' updated successfully';
            Funky.Toast.success(message);
        }

        // Invalidate cache if entity specified
        if (config.entity && Funky.Cache) {
            Funky.Cache.invalidate(config.entity);
        }

        // Announce success
        if (Funky.Announce) {
            Funky.Announce.polite('Saved successfully');
        }

        // Close panel
        MorphPanel.hide(this.id);
    };

    /**
     * Handle submission error
     * @private
     * @param {Object} error - Error object
     */
    PanelInstance.prototype._onSubmitError = function(error) {
        var config = this.config;

        this._setSubmitLoading(false);

        // Extract error messages
        var errors = error.errors || error.message || 'An error occurred';

        // Emit error event
        this._emit('error', { panelId: this.id, errors: errors });

        // Call onError callback
        if (typeof config.onError === 'function') {
            config.onError(errors);
        }

        // Show error toast
        if (Funky.Toast) {
            var message = typeof errors === 'string' ? errors : 'Failed to save';
            Funky.Toast.error(message);
        }

        // Apply field errors to form
        if (this._form && error.errors && typeof error.errors === 'object') {
            this._form.setErrors(error.errors);
        }

        // Announce error
        if (Funky.Announce) {
            Funky.Announce.assertive('Failed to save. Please check the form.');
        }
    };

    /**
     * Set loading state on submit button
     * @private
     * @param {boolean} loading - Loading state
     */
    PanelInstance.prototype._setSubmitLoading = function(loading) {
        if (!this._submitBtn) return;

        var btnEl = this._submitBtn.el || this._submitBtn;

        if (loading) {
            btnEl.setAttribute('disabled', 'disabled');
            this._submitBtnOriginalText = btnEl.textContent;
            
            if (Funky.Spinner) {
                btnEl.innerHTML = '';
                var spinner = Funky.Spinner.create({ size: 'sm' });
                var spinnerEl = spinner.el || spinner;
                btnEl.appendChild(spinnerEl);
            } else {
                btnEl.textContent = 'Saving...';
            }
        } else {
            btnEl.removeAttribute('disabled');
            btnEl.textContent = this._submitBtnOriginalText || this.config.submitText;
        }
    };

    /**
     * Emit event
     * @private
     * @param {string} eventName - Event name
     * @param {Object} detail - Event detail
     */
    PanelInstance.prototype._emit = function(eventName, detail) {
        var event = new CustomEvent('funky.morphpanel.' + eventName, {
            bubbles: true,
            detail: detail
        });
        document.dispatchEvent(event);

        // Also emit on Funky.Events if available
        if (E && typeof E.emit === 'function') {
            E.emit(document, 'funky.morphpanel.' + eventName, detail);
        }
    };

    /**
     * Destroy instance
     */
    PanelInstance.prototype.destroy = function() {
        if (this.isVisible) {
            // Quick hide without animation
            if (this._focusTrapCleanup) {
                this._focusTrapCleanup();
            }
            if (this._keydownHandler) {
                document.removeEventListener('keydown', this._keydownHandler);
            }
            if (this._swipeCleanup) {
                this._swipeCleanup();
            }
            if (this._morphController && this._morphController.cancel) {
                this._morphController.cancel();
            }
            if (this.config.scrollLock) {
                unlockScroll();
            }
        }
        
        var panelEl = this.element.el || this.element;
        var backdropEl = this.backdrop.el || this.backdrop;

        if (panelEl.parentNode) {
            panelEl.parentNode.removeChild(panelEl);
        }
        if (backdropEl.parentNode) {
            backdropEl.parentNode.removeChild(backdropEl);
        }

        // Restore trigger
        if (this.trigger) {
            var triggerEl = this.trigger.el || this.trigger;
            triggerEl.style.visibility = '';
        }
    };

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    var MorphPanel = {
        /**
         * Register a panel configuration
         * @param {string} panelId - Unique panel identifier
         * @param {Object} options - Panel configuration
         * @returns {Object} MorphPanel for chaining
         */
        register: function(panelId, options) {
            _panels.register(panelId, mergeOptions(options || {}));
            return this;
        },

        /**
         * Show a panel, morphing from trigger element
         * @param {Element|string|null} trigger - Trigger element or selector
         * @param {string} panelId - Panel ID to show
         * @returns {Object} MorphPanel for chaining
         */
        show: function(trigger, panelId) {
            // Close any active panel first
            if (_activePanel && _activePanel !== panelId) {
                this.hide(_activePanel);
            }

            var config = _panels.get(panelId);
            if (!config) {
                console.error('[Funky.MorphPanel] Panel not registered:', panelId);
                return this;
            }

            // Get or create instance
            var instance = _instances.get(panelId);
            if (!instance) {
                instance = new PanelInstance(panelId, config);
                _instances.register(panelId, instance);
            }

            instance.show(trigger);
            _activePanel = panelId;

            return this;
        },

        /**
         * Hide a panel
         * @param {string} panelId - Panel ID to hide
         * @returns {Object} MorphPanel for chaining
         */
        hide: function(panelId) {
            var instance = _instances.get(panelId);
            if (instance && instance.isVisible) {
                instance.hide();
            }
            return this;
        },

        /**
         * Set panel data (SlidePanel-compatible)
         * @param {string} panelId - Panel ID
         * @param {Object} data - { title, content, footer }
         * @returns {Object} MorphPanel for chaining
         */
        setData: function(panelId, data) {
            var instance = _instances.get(panelId);
            if (instance) {
                instance.setData(data);
            }
            return this;
        },

        /**
         * Get panel instance
         * @param {string} panelId - Panel ID
         * @returns {PanelInstance|null}
         */
        getInstance: function(panelId) {
            return _instances.get(panelId);
        },

        /**
         * Check if panel is visible
         * @param {string} panelId - Panel ID
         * @returns {boolean}
         */
        isVisible: function(panelId) {
            var instance = _instances.get(panelId);
            return instance ? instance.isVisible : false;
        },

        /**
         * Get currently active panel ID
         * @returns {string|null}
         */
        getActivePanel: function() {
            return _activePanel;
        },

        /**
         * Destroy a panel instance
         * @param {string} panelId - Panel ID
         * @returns {Object} MorphPanel for chaining
         */
        destroy: function(panelId) {
            var instance = _instances.get(panelId);
            if (instance) {
                instance.destroy();
                _instances.unregister(panelId);
            }
            _panels.unregister(panelId);
            if (_activePanel === panelId) {
                _activePanel = null;
            }
            return this;
        },

        /**
         * Destroy all panels
         * @returns {Object} MorphPanel for chaining
         */
        destroyAll: function() {
            var self = this;
            _instances.list().forEach(function(id) {
                self.destroy(id);
            });
            return this;
        },

        /**
         * Get default options
         * @returns {Object}
         */
        getDefaults: function() {
            return Object.assign({}, DEFAULTS);
        },

        // =====================================================================
        // FORM MODE API
        // =====================================================================

        /**
         * Open panel for creating new entity
         * @param {Element|string|null} trigger - Trigger element
         * @param {string} panelId - Panel ID
         * @param {Object} initialData - Initial form values (optional)
         * @returns {Object} MorphPanel for chaining
         */
        create: function(trigger, panelId, initialData) {
            // Close any active panel first
            if (_activePanel && _activePanel !== panelId) {
                this.hide(_activePanel);
            }

            var config = _panels.get(panelId);
            if (!config) {
                console.error('[Funky.MorphPanel] Panel not registered:', panelId);
                return this;
            }

            // Get or create instance
            var instance = _instances.get(panelId);
            if (!instance) {
                instance = new PanelInstance(panelId, config);
                _instances.register(panelId, instance);
            }

            instance.create(trigger, initialData);
            _activePanel = panelId;

            return this;
        },

        /**
         * Open panel for editing existing entity
         * @param {Element|string|null} trigger - Trigger element
         * @param {string} panelId - Panel ID
         * @param {Object} data - Entity data to edit
         * @returns {Object} MorphPanel for chaining
         */
        edit: function(trigger, panelId, data) {
            // Close any active panel first
            if (_activePanel && _activePanel !== panelId) {
                this.hide(_activePanel);
            }

            var config = _panels.get(panelId);
            if (!config) {
                console.error('[Funky.MorphPanel] Panel not registered:', panelId);
                return this;
            }

            // Get or create instance
            var instance = _instances.get(panelId);
            if (!instance) {
                instance = new PanelInstance(panelId, config);
                _instances.register(panelId, instance);
            }

            instance.edit(trigger, data);
            _activePanel = panelId;

            return this;
        },

        /**
         * Get form instance from panel
         * @param {string} panelId - Panel ID
         * @returns {Object|null} Form instance or null
         */
        getForm: function(panelId) {
            var instance = _instances.get(panelId);
            return instance ? instance.getForm() : null;
        }
    };

    // =========================================================================
    // REGISTER
    // =========================================================================

    if (Funky.register) {
        Funky.register('MorphPanel', MorphPanel);
    }

})(window);

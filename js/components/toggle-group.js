/**
 * Funky.ToggleGroup
 * Segmented control with radio/checkbox behavior
 *
 * @requires Funky.Dom
 * @requires Funky.Registry
 * @requires Funky.Events
 * @optional Funky.PubSub
 * @optional Funky.Announce
 *
 * @example
 * // Declarative
 * <div data-toggle-group data-name="view_mode" data-options='[...]'></div>
 * Funky.ToggleGroup.initAll();
 *
 * // Programmatic
 * var toggle = Funky.ToggleGroup.init('#container', {
 *     mode: 'single',
 *     options: [
 *         { value: 'list', label: 'List', icon: 'fa-list' },
 *         { value: 'grid', label: 'Grid', icon: 'fa-th' }
 *     ],
 *     value: 'list',
 *     onChange: function(value, option) {
 *         console.log('Selected:', value);
 *     }
 * });
 */
(function(global) {
    'use strict';

    // Ensure Funky namespace exists
    if (!global.Funky || !global.Funky.register) {
        console.error('[Funky.ToggleGroup] Registry not found. Load namespace.js first.');
        return;
    }

    // Prevent duplicate registration
    if (global.Funky.isRegistered && global.Funky.isRegistered('ToggleGroup')) {
        return;
    }

    var Funky = global.Funky;
    var D = Funky.Dom;
    var E = Funky.Events;
    var Announce = Funky.Announce;

    // =========================================================================
    // Constants
    // =========================================================================

    var _instanceCounter = 0;
    var _instances = Funky.Registry.createInstanceRegistry('ToggleGroup');

    var DEFAULTS = {
        // Mode
        mode: 'single',           // 'single' | 'multiple'

        // Options
        options: [],              // [{ value, label, icon?, disabled?, badge?, badgeVariant?, group? }]

        // Initial value
        value: null,              // string or array for multiple

        // Behavior
        allowEmpty: false,        // Can deselect all in single mode
        required: false,
        disabled: false,
        groupBehavior: null,      // 'single' - only one per group can be selected in multiple mode

        // Appearance
        size: 'md',               // 'sm' | 'md' | 'lg'
        variant: 'default',       // 'default' | 'outline' | 'pills'
        orientation: 'horizontal',
        equalWidth: false,
        iconOnly: false,

        // Responsive behavior
        responsive: false,        // Enable responsive mode (CSS-based stacking)
        breakpoints: null,        // MediaQuery breakpoint config: { orientation: {sm,md,lg}, size: {sm,md,lg} }

        // Loading state (Phase 3)
        loading: false,           // Show loading state initially
        loadingSkeletons: 3,      // Number of skeleton placeholders
        loadingText: 'Loading options...', // Screen reader text

        // Tooltips (Phase 3)
        showTooltips: true,       // Show tooltips for icon-only mode (default: true when iconOnly)
        tooltipPlacement: 'bottom', // 'top' | 'bottom' | 'left' | 'right'

        // Custom rendering (Phase 3)
        renderOption: null,       // function(option, isActive, isDisabled) - custom button content

        // Form
        name: null,

        // Label for accessibility
        label: null,

        // Callbacks
        onChange: null,

        // Event broadcasting
        channel: null,            // PubSub channel name (e.g., 'view-mode')
        announceChanges: true     // Announce changes to screen readers
    };

    // =========================================================================
    // Constructor
    // =========================================================================

    /**
     * ToggleGroup constructor
     * @constructor
     * @param {HTMLElement|string} container - Container element or selector
     * @param {Object} config - Configuration options
     */
    function ToggleGroup(container, config) {
        this.container = typeof container === 'string'
            ? document.querySelector(container)
            : container;

        if (!this.container) {
            console.error('[ToggleGroup] Container not found');
            return;
        }

        this.config = {};
        for (var key in DEFAULTS) {
            if (DEFAULTS.hasOwnProperty(key)) {
                this.config[key] = DEFAULTS[key];
            }
        }
        if (config) {
            for (var k in config) {
                if (config.hasOwnProperty(k)) {
                    this.config[k] = config[k];
                }
            }
        }

        this.id = config && config.id ? config.id : 'toggle-group-' + (++_instanceCounter);

        // State
        this._value = this._normalizeValue(this.config.value);
        this._disabled = this.config.disabled;
        this._buttons = [];
        this._hiddenInput = null;
        this._focusedIndex = -1;

        // Event handlers (for cleanup)
        this._clickHandler = null;
        this._keyHandler = null;
        this._mediaQueryUnsub = null;

        // Phase 3: Advanced features state
        this._loading = this.config.loading;
        this._tooltips = [];
        this._binding = null;

        this._init();
    }

    // =========================================================================
    // Initialization
    // =========================================================================

    ToggleGroup.prototype._init = function() {
        this._parseOptions();

        // Show loading state or render options
        if (this._loading) {
            this._renderLoadingState();
        } else {
            this._render();
        }

        this._bindEvents();
        this._updateHiddenInput();
        this._initResponsive();
    };

    /**
     * Parse options from data attributes if not provided in config
     * @private
     */
    ToggleGroup.prototype._parseOptions = function() {
        // Parse options from data attribute if not provided
        if (this.config.options.length === 0) {
            var optionsAttr = this.container.getAttribute('data-options');
            if (optionsAttr) {
                try {
                    this.config.options = JSON.parse(optionsAttr);
                } catch (e) {
                    console.error('[ToggleGroup] Invalid options JSON');
                }
            }
        }

        // Parse other data attributes
        if (!this.config.name) {
            this.config.name = this.container.getAttribute('data-name');
        }
        if (this.config.value === null) {
            var valueAttr = this.container.getAttribute('data-value');
            if (valueAttr) {
                this._value = this._normalizeValue(valueAttr);
            }
        }
        if (this.container.hasAttribute('data-mode')) {
            this.config.mode = this.container.getAttribute('data-mode');
        }
        if (this.container.hasAttribute('data-size')) {
            this.config.size = this.container.getAttribute('data-size');
        }
        if (this.container.hasAttribute('data-variant')) {
            this.config.variant = this.container.getAttribute('data-variant');
        }
        if (this.container.hasAttribute('data-orientation')) {
            this.config.orientation = this.container.getAttribute('data-orientation');
        }
        if (this.container.hasAttribute('data-allow-empty')) {
            this.config.allowEmpty = this.container.getAttribute('data-allow-empty') === 'true';
        }
        if (this.container.hasAttribute('data-disabled')) {
            this._disabled = this.container.getAttribute('data-disabled') === 'true';
        }
        if (this.container.hasAttribute('data-required')) {
            this.config.required = this.container.getAttribute('data-required') === 'true';
        }
        if (this.container.hasAttribute('data-equal-width')) {
            this.config.equalWidth = this.container.getAttribute('data-equal-width') === 'true';
        }
        if (this.container.hasAttribute('data-icon-only')) {
            this.config.iconOnly = this.container.getAttribute('data-icon-only') === 'true';
        }
        if (this.container.hasAttribute('data-label')) {
            this.config.label = this.container.getAttribute('data-label');
        }
        if (this.container.hasAttribute('data-channel')) {
            this.config.channel = this.container.getAttribute('data-channel');
        }
    };

    /**
     * Normalize value based on mode
     * @private
     * @param {*} value - Value to normalize
     * @returns {*} Normalized value
     */
    ToggleGroup.prototype._normalizeValue = function(value) {
        if (this.config.mode === 'multiple') {
            if (Array.isArray(value)) return value;
            if (value === null || value === undefined) return [];
            // Try parsing JSON for multiple values
            if (typeof value === 'string' && value.charAt(0) === '[') {
                try {
                    return JSON.parse(value);
                } catch (e) {
                    return [value];
                }
            }
            return [value];
        }
        return value;
    };

    // =========================================================================
    // Rendering
    // =========================================================================

    /**
     * Render the toggle group
     * @private
     */
    ToggleGroup.prototype._render = function() {
        var self = this;
        var isRadio = this.config.mode === 'single';

        // Clear container
        this.container.innerHTML = '';

        // Set container attributes
        this.container.className = 'funky-toggle-group';
        this.container.setAttribute('role', isRadio ? 'radiogroup' : 'group');
        this.container.setAttribute('aria-label', this.config.label || 'Toggle group');

        if (this._disabled) {
            this.container.setAttribute('aria-disabled', 'true');
        }

        // Add modifier classes
        this.container.classList.add('funky-toggle-group--' + this.config.size);
        this.container.classList.add('funky-toggle-group--' + this.config.variant);

        if (this.config.orientation === 'vertical') {
            this.container.classList.add('funky-toggle-group--vertical');
        }
        if (this.config.equalWidth) {
            this.container.classList.add('funky-toggle-group--equal');
        }
        if (this.config.iconOnly) {
            this.container.classList.add('funky-toggle-group--icon-only');
        }
        if (this.config.responsive) {
            this.container.classList.add('funky-toggle-group--responsive');
        }

        // Create hidden input for form integration
        if (this.config.name) {
            this._hiddenInput = document.createElement('input');
            this._hiddenInput.type = 'hidden';
            this._hiddenInput.name = this.config.name;
            if (this.config.required) {
                this._hiddenInput.required = true;
            }
            this.container.appendChild(this._hiddenInput);
        }

        // Create buttons (handle separators)
        this._buttons = [];
        var buttonIndex = 0;
        this.config.options.forEach(function(option) {
            // Handle separator
            if (option.type === 'separator') {
                var separator = self._createSeparator();
                self.container.appendChild(separator);
                return;
            }

            var btn = self._createButton(option, buttonIndex);
            self.container.appendChild(btn);
            self._buttons.push(btn);
            buttonIndex++;
        });
    };

    /**
     * Create a button element for an option
     * @private
     * @param {Object} option - Option object
     * @param {number} index - Option index
     * @returns {HTMLElement} Button element
     */
    ToggleGroup.prototype._createButton = function(option, index) {
        var self = this;
        var isRadio = this.config.mode === 'single';
        var isSelected = this._isSelected(option.value);
        var isDisabled = this._disabled || option.disabled;

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'funky-toggle-group__btn';
        btn.setAttribute('role', isRadio ? 'radio' : 'checkbox');
        btn.setAttribute('aria-checked', isSelected ? 'true' : 'false');
        btn.setAttribute('data-value', option.value);
        btn.setAttribute('data-index', index);

        // Add group attribute if present
        if (option.group) {
            btn.setAttribute('data-group', option.group);
        }

        // Roving tabindex - first button or selected button gets tabindex 0
        if (isRadio) {
            btn.tabIndex = isSelected ? 0 : (index === 0 && !this._hasSelection() ? 0 : -1);
        } else {
            btn.tabIndex = index === 0 ? 0 : -1;
        }

        if (isSelected) {
            btn.classList.add('funky-toggle-group__btn--active');
        }
        if (isDisabled) {
            btn.classList.add('funky-toggle-group__btn--disabled');
            btn.setAttribute('aria-disabled', 'true');
            btn.disabled = true;
        }

        // Render button content (custom or default)
        this._renderButtonContent(btn, option, isSelected, isDisabled);

        // Add badge if present
        if (option.badge !== undefined && option.badge !== null) {
            var badge = this._createBadge(option);
            btn.appendChild(badge);
        }

        // Initialize tooltip for icon-only mode
        if (this.config.iconOnly && this.config.showTooltips !== false) {
            this._initTooltip(btn, option);
        }

        return btn;
    };

    /**
     * Render button content (custom or default)
     * @private
     * @param {HTMLElement} btn - Button element
     * @param {Object} option - Option object
     * @param {boolean} isSelected - Whether option is selected
     * @param {boolean} isDisabled - Whether option is disabled
     */
    ToggleGroup.prototype._renderButtonContent = function(btn, option, isSelected, isDisabled) {
        // Use custom render function if provided
        if (typeof this.config.renderOption === 'function') {
            var customContent = this.config.renderOption(option, isSelected, isDisabled);

            if (customContent) {
                // Handle Funky.Dom wrapped element
                if (customContent.el) {
                    btn.appendChild(customContent.el);
                    return;
                }
                // Handle native DOM element
                if (customContent.nodeType) {
                    btn.appendChild(customContent);
                    return;
                }
                // Handle HTML string
                if (typeof customContent === 'string') {
                    btn.innerHTML = customContent;
                    return;
                }
            }
        }

        // Default rendering
        this._renderDefaultContent(btn, option);
    };

    /**
     * Default button content rendering
     * @private
     * @param {HTMLElement} btn - Button element
     * @param {Object} option - Option object
     */
    ToggleGroup.prototype._renderDefaultContent = function(btn, option) {
        // Icon
        if (option.icon) {
            var icon = document.createElement('i');
            icon.className = 'fas ' + option.icon;
            icon.setAttribute('aria-hidden', 'true');
            btn.appendChild(icon);
        }

        // Label
        if (option.label && !this.config.iconOnly) {
            var span = document.createElement('span');
            span.textContent = option.label;
            btn.appendChild(span);
        } else if (option.label && this.config.iconOnly) {
            btn.setAttribute('aria-label', option.label);
            // Add visually hidden text for screen readers
            var srText = document.createElement('span');
            srText.className = 'visually-hidden';
            srText.textContent = option.label;
            btn.appendChild(srText);
        }
    };

    /**
     * Create separator element
     * @private
     * @returns {HTMLElement}
     */
    ToggleGroup.prototype._createSeparator = function() {
        var separator = document.createElement('span');
        separator.className = 'funky-toggle-group__separator';
        separator.setAttribute('aria-hidden', 'true');
        return separator;
    };

    /**
     * Create badge element
     * @private
     * @param {Object} option - Option object with badge property
     * @returns {HTMLElement}
     */
    ToggleGroup.prototype._createBadge = function(option) {
        var badge = document.createElement('span');
        badge.className = 'funky-toggle-group__badge';
        badge.setAttribute('data-badge-value', option.value);
        badge.textContent = String(option.badge);

        if (option.badgeVariant) {
            badge.classList.add('funky-toggle-group__badge--' + option.badgeVariant);
        }

        return badge;
    };

    /**
     * Initialize tooltip for a button
     * @private
     * @param {HTMLElement} btn - Button element
     * @param {Object} option - Option object
     */
    ToggleGroup.prototype._initTooltip = function(btn, option) {
        var Tooltip = Funky.Tooltip;

        // Use Funky.Tooltip if available
        if (Tooltip && Tooltip.init) {
            Tooltip.init(btn, {
                content: option.label,
                placement: this.config.tooltipPlacement || 'bottom',
                delay: 200
            });
            this._tooltips.push(btn);
        } else {
            // Fallback to native title attribute
            btn.setAttribute('title', option.label);
        }
    };

    /**
     * Destroy all tooltips
     * @private
     */
    ToggleGroup.prototype._destroyTooltips = function() {
        var Tooltip = Funky.Tooltip;

        if (this._tooltips.length > 0 && Tooltip && Tooltip.destroy) {
            for (var i = 0; i < this._tooltips.length; i++) {
                Tooltip.destroy(this._tooltips[i]);
            }
        }

        this._tooltips = [];
    };

    /**
     * Render loading state with skeleton placeholders
     * @private
     */
    ToggleGroup.prototype._renderLoadingState = function() {
        var self = this;
        var Skeleton = Funky.Skeleton;

        // Set container attributes
        this.container.className = 'funky-toggle-group funky-toggle-group--loading';
        this.container.classList.add('funky-toggle-group--' + this.config.size);
        this.container.classList.add('funky-toggle-group--' + this.config.variant);
        this.container.setAttribute('aria-busy', 'true');
        this.container.setAttribute('role', this.config.mode === 'single' ? 'radiogroup' : 'group');
        this.container.setAttribute('aria-label', this.config.label || 'Toggle group');

        if (this.config.orientation === 'vertical') {
            this.container.classList.add('funky-toggle-group--vertical');
        }

        // Clear existing content
        this.container.innerHTML = '';
        this._buttons = [];

        var skeletonCount = this.config.loadingSkeletons || 3;

        // Use Funky.Skeleton if available, else CSS-only skeleton
        if (Skeleton && Skeleton.create) {
            for (var i = 0; i < skeletonCount; i++) {
                var skeleton = Skeleton.create({
                    type: 'button',
                    width: this.config.iconOnly ? 36 : 80,
                    height: this.config.size === 'sm' ? 28 : (this.config.size === 'lg' ? 44 : 36)
                });
                this.container.appendChild(skeleton);
            }
        } else {
            // CSS-only skeleton fallback
            for (var j = 0; j < skeletonCount; j++) {
                var placeholder = document.createElement('div');
                placeholder.className = 'funky-toggle-group__skeleton';
                placeholder.setAttribute('aria-hidden', 'true');
                this.container.appendChild(placeholder);
            }
        }

        // Screen reader text
        var srText = document.createElement('span');
        srText.className = 'visually-hidden';
        srText.textContent = this.config.loadingText || 'Loading options...';
        this.container.appendChild(srText);
    };

    /**
     * Check if there's a current selection
     * @private
     * @returns {boolean}
     */
    ToggleGroup.prototype._hasSelection = function() {
        if (this.config.mode === 'multiple') {
            return this._value.length > 0;
        }
        return this._value !== null && this._value !== undefined;
    };

    // =========================================================================
    // Event Handling
    // =========================================================================

    /**
     * Bind event handlers
     * @private
     */
    ToggleGroup.prototype._bindEvents = function() {
        var self = this;

        // Click handler
        this._clickHandler = function(e) {
            var btn = e.target.closest('.funky-toggle-group__btn');
            if (!btn || btn.disabled) return;

            var value = btn.getAttribute('data-value');
            self._handleSelect(value);
        };
        this.container.addEventListener('click', this._clickHandler);

        // Keyboard handler - use Funky.Keyboard for F1 help integration
        this._keyboardUnregisters = [];
        var containerId = this.container.id || ('toggle-group-' + this.id);
        if (!this.container.id) {
            this.container.id = containerId;
        }

        if (Funky.Keyboard) {
            var isHorizontal = this.config.orientation === 'horizontal';
            var navKeys = [
                { key: isHorizontal ? 'arrowleft' : 'arrowup', description: 'Previous option' },
                { key: isHorizontal ? 'arrowright' : 'arrowdown', description: 'Next option' },
                { key: 'home', description: 'First option' },
                { key: 'end', description: 'Last option' },
                { key: 'enter', description: 'Select option' },
                { key: 'space', description: 'Select option' }
            ];

            navKeys.forEach(function(keyDef) {
                self._keyboardUnregisters.push(Funky.Keyboard.register({
                    key: keyDef.key,
                    scope: '#' + containerId,
                    handler: function(e) {
                        self._handleKeydown(e);
                    },
                    description: keyDef.description,
                    group: 'Toggle Group',
                    preventDefault: true
                }));
            });
        } else {
            // Fallback for environments without Funky.Keyboard
            this._keyHandler = function(e) {
                self._handleKeydown(e);
            };
            this.container.addEventListener('keydown', this._keyHandler);
        }
    };

    /**
     * Handle option selection
     * @private
     * @param {string} value - Selected value
     */
    ToggleGroup.prototype._handleSelect = function(value) {
        var previous = this.config.mode === 'multiple'
            ? this._value.slice()
            : this._value;

        if (this.config.mode === 'single') {
            // Single select - toggle or select
            if (this._value === value && this.config.allowEmpty) {
                this._value = null;
            } else {
                this._value = value;
            }
        } else {
            // Multiple select - toggle in array with group behavior support
            var option = this._findOption(value);
            var idx = this._value.indexOf(value);

            // Handle group behavior - deselect others in same group
            if (option && option.group && this.config.groupBehavior === 'single') {
                var self = this;
                this._value = this._value.filter(function(v) {
                    var opt = self._findOption(v);
                    return !opt || opt.group !== option.group;
                });
                idx = -1; // Force add since we may have removed it
            }

            if (idx === -1) {
                this._value.push(value);
            } else if (this.config.allowEmpty || this._value.length > 1) {
                this._value.splice(idx, 1);
            }
        }

        this._updateButtons();
        this._updateHiddenInput();
        this._emitChange(previous);
    };

    /**
     * Find option by value
     * @private
     * @param {string} value - Option value
     * @returns {Object|null}
     */
    ToggleGroup.prototype._findOption = function(value) {
        for (var i = 0; i < this.config.options.length; i++) {
            if (this.config.options[i].value === value) {
                return this.config.options[i];
            }
        }
        return null;
    };

    /**
     * Find button by value
     * @private
     * @param {string} value - Option value
     * @returns {HTMLElement|null}
     */
    ToggleGroup.prototype._findButton = function(value) {
        for (var i = 0; i < this._buttons.length; i++) {
            if (this._buttons[i].getAttribute('data-value') === value) {
                return this._buttons[i];
            }
        }
        return null;
    };

    /**
     * Handle keyboard navigation
     * @private
     * @param {KeyboardEvent} e - Keyboard event
     */
    ToggleGroup.prototype._handleKeydown = function(e) {
        var key = e.key;
        var isHorizontal = this.config.orientation === 'horizontal';
        var prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';
        var nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';

        switch (key) {
            case prevKey:
                e.preventDefault();
                this._moveFocus(-1);
                break;
            case nextKey:
                e.preventDefault();
                this._moveFocus(1);
                break;
            case 'Home':
                e.preventDefault();
                this._focusFirst();
                break;
            case 'End':
                e.preventDefault();
                this._focusLast();
                break;
            case ' ':
            case 'Enter':
                e.preventDefault();
                var focused = this.container.querySelector('.funky-toggle-group__btn:focus');
                if (focused && !focused.disabled) {
                    var value = focused.getAttribute('data-value');
                    this._handleSelect(value);
                }
                break;
        }
    };

    /**
     * Move focus to next/previous button
     * @private
     * @param {number} direction - -1 for previous, 1 for next
     */
    ToggleGroup.prototype._moveFocus = function(direction) {
        var buttons = this._getEnabledButtons();
        if (buttons.length === 0) return;

        var current = this.container.querySelector('.funky-toggle-group__btn:focus');
        var currentIndex = buttons.indexOf(current);

        var newIndex;
        if (currentIndex === -1) {
            newIndex = direction > 0 ? 0 : buttons.length - 1;
        } else {
            newIndex = currentIndex + direction;
            if (newIndex < 0) newIndex = buttons.length - 1;
            if (newIndex >= buttons.length) newIndex = 0;
        }

        this._focusButton(buttons[newIndex]);
    };

    /**
     * Focus first enabled button
     * @private
     */
    ToggleGroup.prototype._focusFirst = function() {
        var buttons = this._getEnabledButtons();
        if (buttons.length > 0) {
            this._focusButton(buttons[0]);
        }
    };

    /**
     * Focus last enabled button
     * @private
     */
    ToggleGroup.prototype._focusLast = function() {
        var buttons = this._getEnabledButtons();
        if (buttons.length > 0) {
            this._focusButton(buttons[buttons.length - 1]);
        }
    };

    /**
     * Focus a specific button
     * @private
     * @param {HTMLElement} btn - Button to focus
     */
    ToggleGroup.prototype._focusButton = function(btn) {
        // Reset all tabIndex
        this._buttons.forEach(function(b) {
            b.tabIndex = -1;
        });
        btn.tabIndex = 0;
        btn.focus();
    };

    /**
     * Get array of enabled buttons
     * @private
     * @returns {HTMLElement[]}
     */
    ToggleGroup.prototype._getEnabledButtons = function() {
        return this._buttons.filter(function(btn) {
            return !btn.disabled;
        });
    };

    // =========================================================================
    // State Updates
    // =========================================================================

    /**
     * Check if a value is selected
     * @private
     * @param {string} value - Value to check
     * @returns {boolean}
     */
    ToggleGroup.prototype._isSelected = function(value) {
        if (this.config.mode === 'multiple') {
            return this._value.indexOf(value) !== -1;
        }
        return this._value === value;
    };

    /**
     * Update button states to reflect current value
     * @private
     */
    ToggleGroup.prototype._updateButtons = function() {
        var self = this;
        this._buttons.forEach(function(btn) {
            var value = btn.getAttribute('data-value');
            var isSelected = self._isSelected(value);

            btn.classList.toggle('funky-toggle-group__btn--active', isSelected);
            btn.setAttribute('aria-checked', isSelected ? 'true' : 'false');

            // Update tabindex for roving tabindex
            if (self.config.mode === 'single' && isSelected) {
                btn.tabIndex = 0;
            }
        });
    };

    /**
     * Update hidden input value
     * @private
     */
    ToggleGroup.prototype._updateHiddenInput = function() {
        if (!this._hiddenInput) return;

        if (this.config.mode === 'multiple') {
            this._hiddenInput.value = JSON.stringify(this._value);
        } else {
            this._hiddenInput.value = this._value || '';
        }
    };

    /**
     * Emit change event
     * @private
     * @param {*} previous - Previous value
     */
    ToggleGroup.prototype._emitChange = function(previous) {
        var option = this._getSelectedOption();
        var detail = {
            value: this._value,
            option: option,
            previous: previous,
            instanceId: this.id
        };

        // Callback
        if (typeof this.config.onChange === 'function') {
            this.config.onChange(this._value, option);
        }

        // DOM event
        var event;
        if (typeof CustomEvent === 'function') {
            event = new CustomEvent('togglegroup:change', {
                bubbles: true,
                detail: detail
            });
        } else {
            // IE11 fallback
            event = document.createEvent('CustomEvent');
            event.initCustomEvent('togglegroup:change', true, false, detail);
        }
        this.container.dispatchEvent(event);

        // Global event bus (Funky.Events)
        if (E && E.emit) {
            E.emit('togglegroup:change', detail);

            // Also emit specific event for this instance
            if (this.config.name) {
                E.emit('togglegroup:' + this.config.name + ':change', detail);
            }
        }

        // PubSub channel broadcasting
        if (this.config.channel && Funky.PubSub) {
            Funky.PubSub.publish('togglegroup', this.config.channel, detail);
        }

        // Screen reader announcement
        if (this.config.announceChanges && Announce && Announce.polite) {
            var message = this._getAnnouncementMessage(option);
            if (message) {
                Announce.polite(message);
            }
        }
    };

    /**
     * Get announcement message for screen readers
     * @private
     * @param {Object|Array} option - Selected option(s)
     * @returns {string|null}
     */
    ToggleGroup.prototype._getAnnouncementMessage = function(option) {
        if (this.config.mode === 'multiple') {
            var count = this._value.length;
            if (count === 0) {
                return 'No options selected';
            }
            return count + ' option' + (count === 1 ? '' : 's') + ' selected';
        }

        if (option && option.label) {
            return option.label + ' selected';
        }

        return null;
    };

    /**
     * Get the currently selected option(s)
     * @private
     * @returns {Object|Array|null}
     */
    ToggleGroup.prototype._getSelectedOption = function() {
        var self = this;
        if (this.config.mode === 'multiple') {
            return this.config.options.filter(function(opt) {
                return self._value.indexOf(opt.value) !== -1;
            });
        }
        for (var i = 0; i < this.config.options.length; i++) {
            if (this.config.options[i].value === this._value) {
                return this.config.options[i];
            }
        }
        return null;
    };

    // =========================================================================
    // Public API
    // =========================================================================

    /**
     * Get current value
     * @returns {string|Array}
     */
    ToggleGroup.prototype.getValue = function() {
        return this._value;
    };

    /**
     * Set value
     * @param {string|Array} value - New value
     * @returns {ToggleGroup} this for chaining
     */
    ToggleGroup.prototype.setValue = function(value) {
        this._value = this._normalizeValue(value);
        this._updateButtons();
        this._updateHiddenInput();
        return this;
    };

    /**
     * Get all options
     * @returns {Array}
     */
    ToggleGroup.prototype.getOptions = function() {
        return this.config.options.slice();
    };

    /**
     * Set new options
     * @param {Array} options - New options array
     * @returns {ToggleGroup} this for chaining
     */
    ToggleGroup.prototype.setOptions = function(options) {
        // Remove old event listeners
        if (this._clickHandler) {
            this.container.removeEventListener('click', this._clickHandler);
        }
        // Cleanup keyboard handlers before re-adding
        if (this._keyboardUnregisters && this._keyboardUnregisters.length) {
            this._keyboardUnregisters.forEach(function(unregister) {
                if (unregister) unregister();
            });
            this._keyboardUnregisters = [];
        }
        if (this._keyHandler) {
            this.container.removeEventListener('keydown', this._keyHandler);
        }

        this.config.options = options;
        this._render();
        this._bindEvents();
        this._updateHiddenInput();
        return this;
    };

    /**
     * Disable entire group
     * @returns {ToggleGroup} this for chaining
     */
    ToggleGroup.prototype.disable = function() {
        this._disabled = true;
        this.container.setAttribute('aria-disabled', 'true');
        this._buttons.forEach(function(btn) {
            btn.disabled = true;
            btn.classList.add('funky-toggle-group__btn--disabled');
        });
        return this;
    };

    /**
     * Enable entire group
     * @returns {ToggleGroup} this for chaining
     */
    ToggleGroup.prototype.enable = function() {
        this._disabled = false;
        this.container.removeAttribute('aria-disabled');
        var self = this;
        this._buttons.forEach(function(btn, i) {
            var option = self.config.options[i];
            if (!option.disabled) {
                btn.disabled = false;
                btn.classList.remove('funky-toggle-group__btn--disabled');
            }
        });
        return this;
    };

    /**
     * Disable a specific option
     * @param {string} value - Option value to disable
     * @returns {ToggleGroup} this for chaining
     */
    ToggleGroup.prototype.disableOption = function(value) {
        var self = this;
        this._buttons.forEach(function(btn, i) {
            if (btn.getAttribute('data-value') === value) {
                btn.disabled = true;
                btn.classList.add('funky-toggle-group__btn--disabled');
                btn.setAttribute('aria-disabled', 'true');
                self.config.options[i].disabled = true;
            }
        });
        return this;
    };

    /**
     * Enable a specific option
     * @param {string} value - Option value to enable
     * @returns {ToggleGroup} this for chaining
     */
    ToggleGroup.prototype.enableOption = function(value) {
        var self = this;
        if (this._disabled) return this; // Can't enable individual options if whole group is disabled

        this._buttons.forEach(function(btn, i) {
            if (btn.getAttribute('data-value') === value) {
                btn.disabled = false;
                btn.classList.remove('funky-toggle-group__btn--disabled');
                btn.removeAttribute('aria-disabled');
                self.config.options[i].disabled = false;
            }
        });
        return this;
    };

    // =========================================================================
    // Runtime Appearance Methods (Phase 2)
    // =========================================================================

    /**
     * Change size at runtime
     * @param {string} size - 'sm', 'md', or 'lg'
     * @returns {ToggleGroup} this for chaining
     */
    ToggleGroup.prototype.setSize = function(size) {
        var validSizes = ['sm', 'md', 'lg'];
        if (validSizes.indexOf(size) === -1) return this;

        this.container.classList.remove('funky-toggle-group--sm');
        this.container.classList.remove('funky-toggle-group--md');
        this.container.classList.remove('funky-toggle-group--lg');
        this.container.classList.add('funky-toggle-group--' + size);

        this.config.size = size;
        return this;
    };

    /**
     * Change variant at runtime
     * @param {string} variant - 'default', 'outline', or 'pills'
     * @returns {ToggleGroup} this for chaining
     */
    ToggleGroup.prototype.setVariant = function(variant) {
        var validVariants = ['default', 'outline', 'pills'];
        if (validVariants.indexOf(variant) === -1) return this;

        this.container.classList.remove('funky-toggle-group--default');
        this.container.classList.remove('funky-toggle-group--outline');
        this.container.classList.remove('funky-toggle-group--pills');
        this.container.classList.add('funky-toggle-group--' + variant);

        this.config.variant = variant;
        return this;
    };

    /**
     * Change orientation at runtime
     * @param {string} orientation - 'horizontal' or 'vertical'
     * @returns {ToggleGroup} this for chaining
     */
    ToggleGroup.prototype.setOrientation = function(orientation) {
        if (orientation === 'vertical') {
            this.container.classList.add('funky-toggle-group--vertical');
        } else {
            this.container.classList.remove('funky-toggle-group--vertical');
        }
        this.config.orientation = orientation;
        return this;
    };

    /**
     * Set loading state
     * @param {boolean} loading - Whether component is loading
     * @returns {ToggleGroup} this for chaining
     */
    ToggleGroup.prototype.setLoading = function(loading) {
        this._loading = loading;

        if (loading) {
            this.container.classList.add('funky-toggle-group--loading');
            this.container.setAttribute('aria-busy', 'true');
            this._renderLoadingState();
        } else {
            this.container.classList.remove('funky-toggle-group--loading');
            this.container.setAttribute('aria-busy', 'false');
            this._destroyTooltips();
            this._render();
            this._updateButtons();
        }
        return this;
    };

    /**
     * Check if component is loading
     * @returns {boolean}
     */
    ToggleGroup.prototype.isLoading = function() {
        return this._loading;
    };

    // =========================================================================
    // Badge Methods (Phase 3)
    // =========================================================================

    /**
     * Update badge for an option
     * @param {string} value - Option value
     * @param {number|string} badge - New badge content
     * @param {Object} [opts] - Options
     * @param {boolean} [opts.hide] - Hide badge if value is 0 or empty
     * @param {string} [opts.variant] - Badge variant (success, warning, danger, info)
     * @returns {ToggleGroup} this for chaining
     */
    ToggleGroup.prototype.updateBadge = function(value, badge, opts) {
        opts = opts || {};

        // Find and update option
        var option = this._findOption(value);
        if (!option) return this;

        option.badge = badge;
        if (opts.variant) {
            option.badgeVariant = opts.variant;
        }

        // Find button
        var btn = this._findButton(value);
        if (!btn) return this;

        // Find existing badge element
        var badgeEl = btn.querySelector('[data-badge-value="' + value + '"]');

        // Handle hide option
        if (opts.hide && (badge === 0 || badge === '' || badge === null || badge === undefined)) {
            if (badgeEl) {
                badgeEl.parentNode.removeChild(badgeEl);
            }
            option.badge = null;
            return this;
        }

        if (badgeEl) {
            // Update existing badge
            badgeEl.textContent = String(badge);

            // Update variant if provided
            if (opts.variant) {
                badgeEl.className = 'funky-toggle-group__badge funky-toggle-group__badge--' + opts.variant;
            }
        } else {
            // Create new badge
            var newBadge = this._createBadge(option);
            btn.appendChild(newBadge);
        }

        return this;
    };

    // =========================================================================
    // LiveBinding Interface (Phase 3)
    // =========================================================================

    /**
     * Set toggle state from data object
     * @param {Object} data - Data object with value and optionally options
     * @returns {ToggleGroup} this for chaining
     */
    ToggleGroup.prototype.setData = function(data) {
        if (!data) return this;

        // Update options if provided
        if (data.options) {
            this.setOptions(data.options);
        }

        // Update value
        if (data.value !== undefined) {
            this.setValue(data.value);
        }

        // Update disabled state
        if (data.disabled !== undefined) {
            if (data.disabled) {
                this.disable();
            } else {
                this.enable();
            }
        }

        // Update individual option states
        if (data.disabledOptions && Array.isArray(data.disabledOptions)) {
            var self = this;
            data.disabledOptions.forEach(function(optValue) {
                self.disableOption(optValue);
            });
        }

        // Update badges
        if (data.badges) {
            var self = this;
            var keys = Object.keys(data.badges);
            for (var i = 0; i < keys.length; i++) {
                var optValue = keys[i];
                self.updateBadge(optValue, data.badges[optValue]);
            }
        }

        return this;
    };

    /**
     * Get current toggle state as data object
     * @returns {Object} Current state
     */
    ToggleGroup.prototype.getData = function() {
        var self = this;

        return {
            value: this._value,
            options: this.config.options.slice(),
            disabled: this._disabled,
            disabledOptions: this.config.options
                .filter(function(opt) { return opt.disabled; })
                .map(function(opt) { return opt.value; })
        };
    };

    /**
     * Bind to LiveBinding source
     * @param {Object} config - Binding configuration
     * @param {string} config.source - Source type: 'websocket' | 'api' | 'pubsub'
     * @param {string} [config.channel] - WebSocket/PubSub channel
     * @param {string} [config.url] - API URL for polling
     * @param {number} [config.interval] - Polling interval (ms)
     * @param {Function} [config.transform] - Transform function for incoming data
     * @returns {ToggleGroup} this for chaining
     */
    ToggleGroup.prototype.bindTo = function(config) {
        var self = this;
        var LiveBinding = Funky.LiveBinding;

        if (!LiveBinding) {
            console.warn('[ToggleGroup] Funky.LiveBinding not available');
            return this;
        }

        // Store binding for cleanup
        this._binding = LiveBinding.bind(this.container, {
            source: config.source,
            channel: config.channel,
            url: config.url,
            interval: config.interval,
            transform: config.transform,
            onData: function(data) {
                var transformed = config.transform ? config.transform(data) : data;
                self.setData(transformed);
            }
        });

        return this;
    };

    /**
     * Unbind from LiveBinding source
     * @returns {ToggleGroup} this for chaining
     */
    ToggleGroup.prototype.unbind = function() {
        if (this._binding && this._binding.destroy) {
            this._binding.destroy();
            this._binding = null;
        }
        return this;
    };

    // =========================================================================
    // Responsive Behavior (Phase 2)
    // =========================================================================

    /**
     * Initialize responsive behavior via Funky.MediaQuery
     * @private
     */
    ToggleGroup.prototype._initResponsive = function() {
        var self = this;
        var MediaQuery = Funky.MediaQuery;

        // Only init if breakpoints config provided and MediaQuery available
        if (!this.config.breakpoints || !MediaQuery) {
            return;
        }

        // Subscribe to breakpoint changes
        this._mediaQueryUnsub = MediaQuery.onChange(function(breakpoint) {
            self._applyBreakpoint(breakpoint);
        });

        // Apply current breakpoint
        var current = MediaQuery.current ? MediaQuery.current() : null;
        if (current) {
            this._applyBreakpoint(current);
        }
    };

    /**
     * Apply styles for a specific breakpoint
     * @private
     * @param {string} breakpoint - Breakpoint name (sm, md, lg, etc)
     */
    ToggleGroup.prototype._applyBreakpoint = function(breakpoint) {
        var breakpoints = this.config.breakpoints;
        if (!breakpoints) return;

        // Apply orientation if configured for this breakpoint
        if (breakpoints.orientation && breakpoints.orientation[breakpoint]) {
            this.setOrientation(breakpoints.orientation[breakpoint]);
        }

        // Apply size if configured for this breakpoint
        if (breakpoints.size && breakpoints.size[breakpoint]) {
            this.setSize(breakpoints.size[breakpoint]);
        }
    };

    /**
     * Check if user prefers reduced motion
     * @private
     * @returns {boolean}
     */
    ToggleGroup.prototype._prefersReducedMotion = function() {
        return window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    };

    // =========================================================================
    // Cleanup
    // =========================================================================

    /**
     * Destroy the instance
     */
    ToggleGroup.prototype.destroy = function() {
        // Unbind from LiveBinding (Phase 3)
        this.unbind();

        // Destroy tooltips (Phase 3)
        this._destroyTooltips();

        // Unsubscribe from MediaQuery
        if (this._mediaQueryUnsub) {
            this._mediaQueryUnsub();
        }

        // Remove event listeners
        if (this._clickHandler) {
            this.container.removeEventListener('click', this._clickHandler);
        }
        // Cleanup keyboard handlers
        if (this._keyboardUnregisters && this._keyboardUnregisters.length) {
            this._keyboardUnregisters.forEach(function(unregister) {
                if (unregister) unregister();
            });
            this._keyboardUnregisters = [];
        }
        if (this._keyHandler) {
            this.container.removeEventListener('keydown', this._keyHandler);
        }

        // Clear container
        this.container.innerHTML = '';
        this.container.className = '';
        this.container.removeAttribute('role');
        this.container.removeAttribute('aria-label');
        this.container.removeAttribute('aria-disabled');
        this.container.removeAttribute('aria-busy');

        // Clear references
        this._buttons = [];
        this._hiddenInput = null;
        this._clickHandler = null;
        this._keyHandler = null;
        this._mediaQueryUnsub = null;
        this._tooltips = [];
        this._binding = null;

        // Unregister
        _instances.unregister(this.id);
    };

    // =========================================================================
    // Static Methods
    // =========================================================================

    /**
     * Initialize a toggle group
     * @param {HTMLElement|string} container - Container element or selector
     * @param {Object} config - Configuration options
     * @returns {ToggleGroup}
     */
    ToggleGroup.init = function(container, config) {
        config = config || {};
        var instance = new ToggleGroup(container, config);

        if (instance.container) {
            _instances.register(instance.id, instance);
        }

        return instance;
    };

    /**
     * Get instance by ID or element
     * @param {string|HTMLElement} idOrElement - Instance ID or container element
     * @returns {ToggleGroup|null}
     */
    ToggleGroup.getInstance = function(idOrElement) {
        if (typeof idOrElement === 'string') {
            // Try as ID first
            var byId = _instances.get(idOrElement);
            if (byId) return byId;

            // Try as selector
            var el = document.querySelector(idOrElement);
            if (el) {
                return _instances.getByElement(el);
            }
            return null;
        }

        return _instances.getByElement(idOrElement);
    };

    /**
     * Destroy all instances
     */
    ToggleGroup.destroyAll = function() {
        _instances.forEach(function(instance) {
            if (instance && instance.destroy) {
                instance.destroy();
            }
        });
    };

    /**
     * Auto-initialize from data attributes
     * @param {string} [selector] - Optional selector (default: [data-toggle-group])
     * @returns {ToggleGroup[]}
     */
    ToggleGroup.initAll = function(selector) {
        selector = selector || '[data-toggle-group]';
        var elements = document.querySelectorAll(selector);
        var instances = [];

        elements.forEach(function(el) {
            // Skip if already initialized
            if (_instances.getByElement(el)) return;

            var instance = ToggleGroup.init(el, {});
            instances.push(instance);
        });

        return instances;
    };

    // =========================================================================
    // Registration
    // =========================================================================

    Funky.register('ToggleGroup', ToggleGroup);

})(window);

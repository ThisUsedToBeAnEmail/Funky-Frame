/**
 * Funky.Mask - Input masking for formatted data entry
 * 
 * Provides real-time input formatting for phone numbers, credit cards,
 * dates, and custom patterns with full cursor management support.
 * 
 * Pattern characters:
 * - '9' = digit [0-9]
 * - 'A' = letter [A-Za-z]
 * - '*' = alphanumeric [A-Za-z0-9]
 * - 'X' = any character
 * - Other characters are literals
 * 
 * @module Funky.Mask
 * @version 1.0.3
 * @requires Funky.Dom
 * @requires Funky.PubSub
 * 
 * @example
 * // Declarative usage
 * <input type="tel" data-mask="phone" placeholder="(___) ___-____">
 * 
 * @example
 * // Programmatic usage
 * var mask = new Funky.Mask('#phone', { pattern: 'phone' });
 * mask.getRaw();       // "5551234567"
 * mask.getFormatted(); // "(555) 123-4567"
 */
(function(global) {
    'use strict';

    // Ensure Funky namespace exists
    var Funky = global.Funky || (global.Funky = {});

    if (Funky.Mask) {
        console.warn('[Funky.Mask] Already initialised');
        return;
    }

    var D = Funky.Dom;
    var P = Funky.PubSub;

    if (!D) {
        console.error('[Funky.Mask] Funky.Dom required');
        return;
    }

    // =========================================================================
    // Constants
    // =========================================================================

    /**
     * Pattern character definitions
     * Each key is a mask character, value is the regex it matches
     */
    var DEFAULT_DEFINITIONS = {
        '9': /[0-9]/,
        'A': /[A-Za-z]/,
        '*': /[A-Za-z0-9]/,
        'X': /./
    };

    /**
     * Default options for MaskInstance
     */
    var DEFAULTS = {
        pattern: null,           // Pattern string or preset name
        placeholder: '_',        // Placeholder character for unfilled positions
        definitions: null,       // Custom character definitions (merged with defaults)
        transform: null,         // 'uppercase', 'lowercase', or null
        eager: true,             // Eagerly add literals as user types
        showMask: false,         // Show placeholder mask in empty input
        clearIncomplete: false,  // Clear value on blur if incomplete
        validate: null           // Validator name (added in Phase 2)
    };

    // =========================================================================
    // MaskInstance Constructor
    // =========================================================================

    /**
     * MaskInstance - Manages masking for a single input element
     * @constructor
     * @param {HTMLInputElement} element - The input element
     * @param {Object} options - Configuration options
     */
    function MaskInstance(element, options) {
        // Allow passing selector
        if (typeof element === 'string') {
            element = D.one(element);
            if (element) {
                element = element.raw();
            }
        } else if (element && element.raw) {
            element = element.raw();
        }

        if (!element || element.tagName !== 'INPUT') {
            console.error('[Funky.Mask] Valid input element required');
            return;
        }

        // Prevent double initialization
        if (element._funkyMask) {
            return element._funkyMask;
        }

        this._element = element;
        this._options = this._mergeOptions(options || {});
        this._raw = '';
        this._formatted = '';
        this._tokens = [];
        this._isComplete = false;
        this._definitions = this._buildDefinitions();
        this._handlers = {};

        this._init();

        // Store reference on element
        element._funkyMask = this;
        element.setAttribute('data-mask-initialized', 'true');
    }

    /**
     * Merge options with defaults
     * @private
     * @param {Object} options - User options
     * @returns {Object} Merged options
     */
    MaskInstance.prototype._mergeOptions = function(options) {
        var merged = {};
        var key;

        for (key in DEFAULTS) {
            if (DEFAULTS.hasOwnProperty(key)) {
                merged[key] = DEFAULTS[key];
            }
        }

        for (key in options) {
            if (options.hasOwnProperty(key)) {
                merged[key] = options[key];
            }
        }

        return merged;
    };

    /**
     * Build definitions object from defaults and custom
     * @private
     * @returns {Object} Character definitions
     */
    MaskInstance.prototype._buildDefinitions = function() {
        var definitions = {};
        var key;

        for (key in DEFAULT_DEFINITIONS) {
            if (DEFAULT_DEFINITIONS.hasOwnProperty(key)) {
                definitions[key] = DEFAULT_DEFINITIONS[key];
            }
        }

        if (this._options.definitions) {
            for (key in this._options.definitions) {
                if (this._options.definitions.hasOwnProperty(key)) {
                    definitions[key] = this._options.definitions[key];
                }
            }
        }

        return definitions;
    };

    // =========================================================================
    // Initialization
    // =========================================================================

    /**
     * Counter for unique hint IDs
     */
    var maskHintCounter = 0;

    /**
     * Initialize the mask instance
     * @private
     */
    MaskInstance.prototype._init = function() {
        var pattern = this._options.pattern;

        if (!pattern) {
            console.error('[Funky.Mask] Pattern required');
            return;
        }

        // Resolve pattern preset (Phase 2 will add PATTERNS registry)
        this._resolvedPattern = {};
        if (Mask.PATTERNS && Mask.PATTERNS[pattern]) {
            var preset = Mask.PATTERNS[pattern];
            this._resolvedPattern = preset;
            pattern = preset.pattern;
            // Merge preset options
            if (preset.transform && !this._options.transform) {
                this._options.transform = preset.transform;
            }
            if (preset.validate && !this._options.validate) {
                this._options.validate = preset.validate;
            }
        }

        // Parse the pattern into tokens
        this._tokens = this._parsePattern(pattern);

        // Track completion state for announcements
        this._wasComplete = false;

        // Bind input events
        this._bindEvents();

        // Setup accessibility
        this._setupAccessibility();

        // If element already has a value, apply mask
        if (this._element.value) {
            this._raw = this._extractRawFromAny(this._element.value);
            this._updateDisplay();
        } else if (this._options.showMask) {
            this._updateDisplay();
        }
    };

    // =========================================================================
    // Accessibility
    // =========================================================================

    /**
     * Setup accessibility attributes for the input
     * @private
     */
    MaskInstance.prototype._setupAccessibility = function() {
        var el = this._element;

        // Warn if input lacks accessible name
        if (!el.hasAttribute('aria-label') &&
            !el.hasAttribute('aria-labelledby') &&
            !el.id) {
            console.warn('[Funky.Mask] Input lacks accessible name. Add aria-label or id with associated label.');
        }

        // Add describedby for format hint if not present
        if (!el.hasAttribute('aria-describedby')) {
            var hintId = this._createFormatHint();
            if (hintId) {
                el.setAttribute('aria-describedby', hintId);
            }
        }

        // Set inputmode if not already set
        var inputMode = this._resolvedPattern.inputMode;
        if (!el.hasAttribute('inputmode') && inputMode) {
            el.setAttribute('inputmode', inputMode);
        }

        // Set autocomplete if specified
        var autocomplete = this._resolvedPattern.autocomplete;
        if (autocomplete && !el.hasAttribute('autocomplete')) {
            el.setAttribute('autocomplete', autocomplete);
        }

        // Add aria-invalid (controlled by validation)
        el.setAttribute('aria-invalid', 'false');
    };

    /**
     * Create visually hidden format hint
     * @private
     * @returns {string|null} ID of hint element
     */
    MaskInstance.prototype._createFormatHint = function() {
        // Don't create if parent doesn't exist
        if (!this._element.parentNode) {
            return null;
        }

        var placeholder = this._options.placeholder;

        // Generate hint from pattern
        var hintText = this._generateHintFromPattern();
        if (!hintText) {
            return null;
        }

        // Check if hint already exists
        var existingHint = this._element.parentNode.querySelector('.funky-mask-hint');
        if (existingHint) {
            return existingHint.id;
        }

        // Create hidden hint element
        var hintId = 'mask-hint-' + (++maskHintCounter);
        var hint = document.createElement('span');
        hint.id = hintId;
        hint.className = 'funky-mask-hint visually-hidden';
        hint.textContent = 'Format: ' + hintText;

        // Insert after input
        this._element.parentNode.insertBefore(hint, this._element.nextSibling);
        this._hintElement = hint;

        return hintId;
    };

    /**
     * Generate readable hint from pattern tokens
     * @private
     * @returns {string}
     */
    MaskInstance.prototype._generateHintFromPattern = function() {
        var tokens = this._tokens;
        var hint = '';

        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            if (token.type === 'literal') {
                hint += token.char;
            } else if (token.char === '9') {
                hint += '#'; // Digit placeholder
            } else if (token.char === 'A') {
                hint += 'X'; // Letter placeholder
            } else {
                hint += '_';
            }
        }

        return hint;
    };

    /**
     * Get or create the live region for screen reader announcements
     * @private
     * @returns {HTMLElement}
     */
    MaskInstance.prototype._getLiveRegion = function() {
        var regionId = 'funky-mask-live-region';
        var region = document.getElementById(regionId);

        if (!region) {
            region = document.createElement('div');
            region.id = regionId;
            region.className = 'visually-hidden';
            region.setAttribute('aria-live', 'polite');
            region.setAttribute('aria-atomic', 'true');
            document.body.appendChild(region);
        }

        return region;
    };

    /**
     * Announce message to screen readers
     * @private
     * @param {string} message - Message to announce
     * @param {string} priority - 'polite' or 'assertive'
     */
    MaskInstance.prototype._announce = function(message, priority) {
        var region = this._getLiveRegion();

        if (priority === 'assertive') {
            region.setAttribute('aria-live', 'assertive');
        } else {
            region.setAttribute('aria-live', 'polite');
        }

        // Clear and set to trigger announcement
        region.textContent = '';

        // Small delay to ensure announcement
        setTimeout(function() {
            region.textContent = message;
        }, 50);
    };

    /**
     * Announce validation result to screen readers
     * @private
     * @param {Object} result - Validation result with valid and error properties
     */
    MaskInstance.prototype._announceValidation = function(result) {
        if (!result.valid && result.error) {
            this._announce(result.error, 'assertive');
            this._element.setAttribute('aria-invalid', 'true');
        } else if (result.valid) {
            this._element.setAttribute('aria-invalid', 'false');
        }
    };

    /**
     * Announce completion status change
     * @private
     */
    MaskInstance.prototype._announceCompletion = function() {
        if (this._isComplete && !this._wasComplete) {
            this._announce('Input complete', 'polite');
        }
        this._wasComplete = this._isComplete;
    };

    /**
     * Show validation error accessibly
     * @private
     * @param {string} message - Error message
     */
    MaskInstance.prototype._showError = function(message) {
        var el = this._element;
        var errorId = (el.id || 'mask-input') + '-error';

        // Find or create error element
        var errorEl = document.getElementById(errorId);
        if (!errorEl && el.parentNode) {
            errorEl = document.createElement('span');
            errorEl.id = errorId;
            errorEl.className = 'funky-mask-error';
            errorEl.setAttribute('aria-live', 'polite');
            el.parentNode.insertBefore(errorEl, el.nextSibling);
        }

        if (errorEl) {
            // Set error message
            errorEl.textContent = message;
            errorEl.hidden = false;

            // Link to input
            var describedBy = el.getAttribute('aria-describedby') || '';
            if (describedBy.indexOf(errorId) === -1) {
                el.setAttribute('aria-describedby', (describedBy + ' ' + errorId).trim());
            }
        }

        // Mark as invalid
        el.setAttribute('aria-invalid', 'true');
        D.one(el).classAdd('funky-mask-invalid');
    };

    /**
     * Clear validation error
     * @private
     */
    MaskInstance.prototype._clearError = function() {
        var el = this._element;
        var errorId = (el.id || 'mask-input') + '-error';
        var errorEl = document.getElementById(errorId);

        if (errorEl) {
            errorEl.hidden = true;
            errorEl.textContent = '';
        }

        el.setAttribute('aria-invalid', 'false');
        D.one(el).classRemove('funky-mask-invalid');
    };

    // =========================================================================
    // Pattern Parser
    // =========================================================================

    /**
     * Parse a pattern string into tokens
     * @private
     * @param {string} pattern - Pattern like "(999) 999-9999"
     * @returns {Array} Array of token objects
     */
    MaskInstance.prototype._parsePattern = function(pattern) {
        var tokens = [];
        var i = 0;
        var maskIndex = 0;

        while (i < pattern.length) {
            var char = pattern.charAt(i);
            var escaped = false;

            // Handle escape character
            if (char === '\\' && i + 1 < pattern.length) {
                i++;
                char = pattern.charAt(i);
                escaped = true;
            }

            if (!escaped && this._definitions[char]) {
                // Mask character
                tokens.push({
                    type: 'mask',
                    char: char,
                    regex: this._definitions[char],
                    index: maskIndex
                });
                maskIndex++;
            } else {
                // Literal character
                tokens.push({
                    type: 'literal',
                    char: char
                });
            }

            i++;
        }

        return tokens;
    };

    /**
     * Get the count of mask (non-literal) characters
     * @private
     * @returns {number}
     */
    MaskInstance.prototype._getMaskCharCount = function() {
        var count = 0;
        for (var i = 0; i < this._tokens.length; i++) {
            if (this._tokens[i].type === 'mask') {
                count++;
            }
        }
        return count;
    };

    // =========================================================================
    // Event Handling
    // =========================================================================

    /**
     * Bind input events
     * @private
     */
    MaskInstance.prototype._bindEvents = function() {
        var self = this;

        this._handlers = {
            input: function(e) {
                self._handleInput(e);
            },
            keydown: function(e) {
                self._handleKeydown(e);
            },
            paste: function(e) {
                self._handlePaste(e);
            },
            focus: function(e) {
                self._handleFocus(e);
            },
            blur: function(e) {
                self._handleBlur(e);
            }
        };

        var el = this._element;
        el.addEventListener('input', this._handlers.input);
        el.addEventListener('keydown', this._handlers.keydown);
        el.addEventListener('paste', this._handlers.paste);
        el.addEventListener('focus', this._handlers.focus);
        el.addEventListener('blur', this._handlers.blur);
    };

    /**
     * Unbind input events
     * @private
     */
    MaskInstance.prototype._unbindEvents = function() {
        var el = this._element;

        if (this._handlers.input) {
            el.removeEventListener('input', this._handlers.input);
            el.removeEventListener('keydown', this._handlers.keydown);
            el.removeEventListener('paste', this._handlers.paste);
            el.removeEventListener('focus', this._handlers.focus);
            el.removeEventListener('blur', this._handlers.blur);
        }

        this._handlers = {};
    };

    /**
     * Handle input event
     * @private
     * @param {InputEvent} e
     */
    MaskInstance.prototype._handleInput = function(e) {
        // Get current value from element
        var currentValue = this._element.value;
        var selStart = this._element.selectionStart;

        // Extract raw value from whatever was typed
        this._raw = this._extractRawFromAny(currentValue);

        // Truncate to max length
        var maxLen = this._getMaskCharCount();
        if (this._raw.length > maxLen) {
            this._raw = this._raw.substring(0, maxLen);
        }

        // Update display
        this._updateDisplay();

        // Calculate new cursor position
        var rawLen = this._raw.length;
        var newPos = this._rawToFormattedPosition(rawLen);

        // If there's room and we're at a literal position, advance past it
        if (this._options.eager && newPos < this._tokens.length) {
            while (newPos < this._tokens.length && this._tokens[newPos].type === 'literal') {
                newPos++;
            }
        }

        this._setCursor(newPos, true);
        this._emit('input');

        // Check for complete and announce
        if (this._isComplete) {
            this._emit('complete');
            this._announceCompletion();
            this.validate(); // Auto-validate on complete
        }
        this._wasComplete = this._isComplete;
    };

    /**
     * Handle keydown event
     * @private
     * @param {KeyboardEvent} e
     */
    MaskInstance.prototype._handleKeydown = function(e) {
        var key = e.key;

        // Handle backspace specially to skip over literals
        if (key === 'Backspace') {
            var selStart = this._element.selectionStart;
            var selEnd = this._element.selectionEnd;

            // If there's a selection, let default behavior handle it
            if (selEnd > selStart) {
                return;
            }

            // Find the position in raw value
            var rawPos = this._formattedToRawPosition(selStart);

            // If we're at a literal, we need to skip back to the previous mask char
            if (rawPos > 0) {
                // Delete the character at rawPos - 1
                this._raw = this._raw.substring(0, rawPos - 1) + this._raw.substring(rawPos);
                this._updateDisplay();

                // Position cursor
                var newPos = this._rawToFormattedPosition(rawPos - 1);
                this._setCursor(newPos, false);

                this._emit('input');
                e.preventDefault();
            } else if (selStart > 0) {
                // We're at a literal at the start, skip back
                var prevPos = selStart - 1;
                while (prevPos > 0 && this._tokens[prevPos] && this._tokens[prevPos].type === 'literal') {
                    prevPos--;
                }
                this._setCursor(prevPos, false);
                e.preventDefault();
            }
        }

        // Handle delete key
        if (key === 'Delete') {
            var selStart = this._element.selectionStart;
            var selEnd = this._element.selectionEnd;

            if (selEnd > selStart) {
                return;
            }

            var rawPos = this._formattedToRawPosition(selStart);

            // Skip over literals to find next mask char to delete
            var formattedPos = selStart;
            while (formattedPos < this._tokens.length && this._tokens[formattedPos].type === 'literal') {
                formattedPos++;
            }

            var newRawPos = this._formattedToRawPosition(formattedPos);

            if (newRawPos < this._raw.length) {
                this._raw = this._raw.substring(0, newRawPos) + this._raw.substring(newRawPos + 1);
                this._updateDisplay();
                this._setCursor(formattedPos, true);
                this._emit('input');
                e.preventDefault();
            }
        }
    };

    /**
     * Handle paste event
     * @private
     * @param {ClipboardEvent} e
     */
    MaskInstance.prototype._handlePaste = function(e) {
        e.preventDefault();

        var pastedText = '';
        if (e.clipboardData) {
            pastedText = e.clipboardData.getData('text/plain');
        } else if (global.clipboardData) {
            pastedText = global.clipboardData.getData('Text');
        }

        if (!pastedText) {
            return;
        }

        // Extract only valid characters from pasted text
        var cleanPasted = this._extractRawFromAny(pastedText);

        // Get current selection positions
        var selStart = this._element.selectionStart;
        var selEnd = this._element.selectionEnd;
        var rawStart = this._formattedToRawPosition(selStart);
        var rawEnd = this._formattedToRawPosition(selEnd);

        // If selection exists, remove selected portion
        if (rawEnd > rawStart) {
            this._raw = this._raw.substring(0, rawStart) + this._raw.substring(rawEnd);
        }

        // Insert cleaned pasted text at cursor position
        this._raw = this._raw.substring(0, rawStart) + cleanPasted + this._raw.substring(rawStart);

        // Truncate to max length
        var maxLen = this._getMaskCharCount();
        if (this._raw.length > maxLen) {
            this._raw = this._raw.substring(0, maxLen);
        }

        // Update display
        this._updateDisplay();

        // Position cursor after pasted content
        var newRawPos = Math.min(rawStart + cleanPasted.length, this._raw.length);
        this._setCursor(this._rawToFormattedPosition(newRawPos), true);

        this._emit('input');

        if (this._isComplete) {
            this._emit('complete');
            this.validate(); // Auto-validate on complete
        }
    };

    /**
     * Handle focus event
     * @private
     * @param {FocusEvent} e
     */
    MaskInstance.prototype._handleFocus = function(e) {
        if (this._options.showMask && !this._raw) {
            this._updateDisplay();
        }

        // Add focus class
        D.one(this._element).classAdd('funky-mask-focused');

        // Position cursor at first empty position
        var firstEmpty = this._rawToFormattedPosition(this._raw.length);
        var self = this;

        // Use timeout to ensure focus is complete
        setTimeout(function() {
            self._setCursor(firstEmpty, true);
        }, 0);

        this._emit('focus');
    };

    /**
     * Handle blur event
     * @private
     * @param {FocusEvent} e
     */
    MaskInstance.prototype._handleBlur = function(e) {
        // Remove focus class
        D.one(this._element).classRemove('funky-mask-focused');

        if (this._options.clearIncomplete && !this._isComplete) {
            this._raw = '';
            this._updateDisplay();
        }

        // If showMask is false and input is empty, clear placeholder
        if (!this._options.showMask && !this._raw) {
            this._element.value = '';
        }

        // Run validation on blur if validator is set
        if (this._options.validate && this._raw) {
            var result = this.validate();
            if (result && !result.valid) {
                this._announceValidation(result);
            }
        }

        this._emit('blur');
    };

    // =========================================================================
    // Cursor Management
    // =========================================================================

    /**
     * Calculate formatted position from raw position
     * @private
     * @param {number} rawPosition - Position in raw value
     * @returns {number} Position in formatted value
     */
    MaskInstance.prototype._rawToFormattedPosition = function(rawPosition) {
        var position = 0;
        var rawCount = 0;

        for (var i = 0; i < this._tokens.length; i++) {
            if (rawCount >= rawPosition) {
                break;
            }

            if (this._tokens[i].type === 'mask') {
                rawCount++;
            }
            position++;
        }

        return position;
    };

    /**
     * Calculate raw position from formatted position
     * @private
     * @param {number} formattedPosition - Position in formatted value
     * @returns {number} Position in raw value
     */
    MaskInstance.prototype._formattedToRawPosition = function(formattedPosition) {
        var rawPosition = 0;

        for (var i = 0; i < formattedPosition && i < this._tokens.length; i++) {
            if (this._tokens[i].type === 'mask') {
                rawPosition++;
            }
        }

        return rawPosition;
    };

    /**
     * Set cursor position
     * @private
     * @param {number} position - Desired position
     * @param {boolean} forward - Direction of movement (for skipping literals)
     */
    MaskInstance.prototype._setCursor = function(position, forward) {
        var el = this._element;
        var newPos = position;

        // Skip over literals in the appropriate direction
        if (forward !== false) {
            while (newPos < this._tokens.length &&
                   this._tokens[newPos] &&
                   this._tokens[newPos].type === 'literal') {
                newPos++;
            }
        } else {
            while (newPos > 0 &&
                   this._tokens[newPos - 1] &&
                   this._tokens[newPos - 1].type === 'literal') {
                newPos--;
            }
        }

        // Clamp to valid range
        newPos = Math.max(0, Math.min(newPos, this._formatted.length));

        // Use requestAnimationFrame for proper timing
        requestAnimationFrame(function() {
            if (el === document.activeElement) {
                el.setSelectionRange(newPos, newPos);
            }
        });
    };

    // =========================================================================
    // Mask Application
    // =========================================================================

    /**
     * Apply mask pattern to a raw value
     * @private
     * @param {string} raw - Unformatted value
     * @returns {string} Formatted value
     */
    MaskInstance.prototype._applyMask = function(raw) {
        var result = '';
        var rawIndex = 0;

        for (var i = 0; i < this._tokens.length; i++) {
            var token = this._tokens[i];

            if (token.type === 'literal') {
                // Add literal if we have more raw chars to process, or showMask is true
                if (rawIndex < raw.length || this._options.showMask) {
                    result += token.char;
                }
            } else if (token.type === 'mask') {
                if (rawIndex < raw.length) {
                    var char = raw.charAt(rawIndex);

                    // Apply transform
                    if (this._options.transform === 'uppercase') {
                        char = char.toUpperCase();
                    } else if (this._options.transform === 'lowercase') {
                        char = char.toLowerCase();
                    }

                    // Validate against regex
                    if (token.regex.test(char)) {
                        result += char;
                    }
                    rawIndex++;
                } else if (this._options.showMask) {
                    result += this._options.placeholder;
                }
            }
        }

        this._isComplete = rawIndex === this._getMaskCharCount() && raw.length >= this._getMaskCharCount();

        return result;
    };

    /**
     * Extract raw characters from any input (formatted or raw)
     * Uses token-aware extraction to avoid matching literals against wildcard definitions
     * @private
     * @param {string} value - Input value
     * @returns {string} Raw characters only
     */
    MaskInstance.prototype._extractRawFromAny = function(value) {
        var raw = '';
        var tokenIndex = 0;
        var i = 0;

        while (i < value.length && tokenIndex < this._tokens.length) {
            var char = value.charAt(i);
            var token = this._tokens[tokenIndex];

            // Skip the placeholder character
            if (char === this._options.placeholder) {
                i++;
                continue;
            }

            if (token.type === 'literal') {
                // If this char matches the expected literal, skip both
                if (char === token.char) {
                    i++;
                    tokenIndex++;
                } else {
                    // Char doesn't match literal - could be raw input without literals
                    // Check if it matches the next mask token instead
                    var nextMaskToken = this._findNextMaskToken(tokenIndex);
                    if (nextMaskToken && nextMaskToken.token.regex.test(char)) {
                        // Skip to that mask token
                        tokenIndex = nextMaskToken.index;
                        raw += char;
                        i++;
                        tokenIndex++;
                    } else {
                        // Not a valid character, skip it
                        i++;
                    }
                }
            } else if (token.type === 'mask') {
                // Check if char matches this mask's regex
                if (token.regex.test(char)) {
                    raw += char;
                    i++;
                    tokenIndex++;
                } else {
                    // Doesn't match - might be a literal that user typed, skip it
                    i++;
                }
            }
        }

        // Handle any remaining characters after all tokens processed
        // (for raw input that might be longer)
        while (i < value.length) {
            var char = value.charAt(i);
            // Only add if we haven't exceeded mask capacity and char is valid for any mask position
            if (raw.length < this._getMaskCharCount()) {
                // Find any remaining mask definitions this char might match
                var matched = false;
                for (var j = tokenIndex; j < this._tokens.length; j++) {
                    if (this._tokens[j].type === 'mask' && this._tokens[j].regex.test(char)) {
                        raw += char;
                        matched = true;
                        break;
                    }
                }
            }
            i++;
        }

        return raw;
    };

    /**
     * Find the next mask token starting from given index
     * @private
     * @param {number} startIndex - Starting token index
     * @returns {Object|null} { token, index } or null
     */
    MaskInstance.prototype._findNextMaskToken = function(startIndex) {
        for (var i = startIndex; i < this._tokens.length; i++) {
            if (this._tokens[i].type === 'mask') {
                return { token: this._tokens[i], index: i };
            }
        }
        return null;
    };

    /**
     * Update the input display with formatted value
     * @private
     */
    MaskInstance.prototype._updateDisplay = function() {
        this._formatted = this._applyMask(this._raw);
        this._element.value = this._formatted;
    };

    // =========================================================================
    // Event Emission
    // =========================================================================

    /**
     * Emit an event
     * @private
     * @param {string} eventName - Event name (without 'mask:' prefix)
     * @param {Object} [extraDetail] - Additional properties to include in event detail
     */
    MaskInstance.prototype._emit = function(eventName, extraDetail) {
        var detail = {
            raw: this._raw,
            formatted: this._formatted,
            complete: this._isComplete,
            element: this._element
        };

        // Merge extra detail if provided
        if (extraDetail) {
            for (var key in extraDetail) {
                if (extraDetail.hasOwnProperty(key)) {
                    detail[key] = extraDetail[key];
                }
            }
        }

        // Emit via PubSub if available
        if (P && P.emit) {
            P.emit('funky:mask:' + eventName, detail);
        }

        // Dispatch DOM CustomEvent (uses dot notation)
        if (Funky.Events && Funky.Events.emit) {
            Funky.Events.emit(this._element, 'funky.mask.' + eventName, detail);
        }
    };

    // =========================================================================
    // Public API
    // =========================================================================

    /**
     * Get raw (unformatted) value
     * @returns {string}
     */
    MaskInstance.prototype.getRaw = function() {
        return this._raw;
    };

    /**
     * Get formatted value
     * @returns {string}
     */
    MaskInstance.prototype.getFormatted = function() {
        return this._formatted;
    };

    /**
     * Check if mask is completely filled
     * @returns {boolean}
     */
    MaskInstance.prototype.isComplete = function() {
        return this._isComplete;
    };

    /**
     * Check if value is valid (uses registered validators)
     * @returns {boolean}
     */
    MaskInstance.prototype.isValid = function() {
        return this.validate().valid;
    };

    /**
     * Validate the current value
     * @returns {Object} { valid: boolean, error: string|null }
     */
    MaskInstance.prototype.validate = function() {
        // Get validator name from options or pattern preset
        var validatorName = this._options.validate;

        // If pattern is a preset, check if it has a default validator
        if (!validatorName && Mask.PATTERNS[this._options.pattern]) {
            validatorName = Mask.PATTERNS[this._options.pattern].validate;
        }

        // No validator - just check completeness
        if (!validatorName) {
            var result = { valid: this._isComplete, error: this._isComplete ? null : 'Incomplete' };
            this._updateValidationState(result);
            return result;
        }

        // Get validator function
        var validator = Mask.VALIDATORS[validatorName];
        if (!validator) {
            console.warn('[Funky.Mask] Unknown validator: ' + validatorName);
            return { valid: true, error: null };
        }

        // Run validation
        var result = validator(this._raw);
        this._updateValidationState(result);

        return result;
    };

    /**
     * Update validation state on element
     * @private
     */
    MaskInstance.prototype._updateValidationState = function(result) {
        var $el = D.one(this._element);

        // Update custom validity
        if (this._element.setCustomValidity) {
            this._element.setCustomValidity(result.error || '');
        }

        // Update ARIA
        this._element.setAttribute('aria-invalid', !result.valid);

        // Update classes
        if (result.valid) {
            $el.classRemove('funky-mask-invalid').classAdd('funky-mask-valid');
        } else {
            $el.classRemove('funky-mask-valid').classAdd('funky-mask-invalid');
        }

        // Emit validation event
        this._emit('valid', {
            raw: this._raw,
            valid: result.valid,
            error: result.error
        });
    };

    /**
     * Set value programmatically
     * @param {string} value - Value to set (can be raw or formatted)
     */
    MaskInstance.prototype.setValue = function(value) {
        this._raw = this._extractRawFromAny(value || '');

        // Truncate to max length
        var maxLen = this._getMaskCharCount();
        if (this._raw.length > maxLen) {
            this._raw = this._raw.substring(0, maxLen);
        }

        this._updateDisplay();
        this._emit('input');

        if (this._isComplete) {
            this._emit('complete');
            this.validate(); // Auto-validate on complete
        }
    };

    /**
     * Clear the mask
     */
    MaskInstance.prototype.clear = function() {
        this._raw = '';
        this._updateDisplay();
        this._emit('input');
    };

    /**
     * Get the input element
     * @returns {HTMLInputElement}
     */
    MaskInstance.prototype.getElement = function() {
        return this._element;
    };

    /**
     * Get the options
     * @returns {Object}
     */
    MaskInstance.prototype.getOptions = function() {
        return this._options;
    };

    /**
     * Destroy the mask instance
     */
    MaskInstance.prototype.destroy = function() {
        this._unbindEvents();

        // Remove accessibility elements
        if (this._hintElement && this._hintElement.parentNode) {
            this._hintElement.parentNode.removeChild(this._hintElement);
        }

        // Remove error element if created
        var errorId = (this._element.id || 'mask-input') + '-error';
        var errorEl = document.getElementById(errorId);
        if (errorEl && errorEl.parentNode) {
            errorEl.parentNode.removeChild(errorEl);
        }

        // Clean up attributes
        this._element.removeAttribute('data-mask-initialized');
        this._element.removeAttribute('aria-invalid');
        this._element.removeAttribute('aria-describedby');
        D.one(this._element).classRemove('funky-mask-focused').classRemove('funky-mask-invalid');

        delete this._element._funkyMask;
    };

    // =========================================================================
    // RedactInstance - Sensitive Data Display
    // =========================================================================

    /**
     * Default options for RedactInstance
     */
    var REDACT_DEFAULTS = {
        value: null,           // The actual value to redact
        pattern: null,         // Pattern for formatting (e.g., 'credit-card')
        char: '•',             // Redaction character
        reveal: 'click',       // 'click', 'hover', 'button', 'none'
        autoHide: 0,           // Auto-hide delay (ms), 0 = disabled
        showFirst: 0,          // Show first N characters
        showLast: 0,           // Show last N characters
        onReveal: null,        // Callback when revealed
        onHide: null,          // Callback when hidden
        audit: false,          // Enable audit logging
        auditUrl: null,        // URL for audit POST
        auditData: null        // Additional audit data
    };

    /**
     * RedactInstance - Manages redacted display of sensitive data
     * @constructor
     * @param {HTMLElement} element - The display element (span, div, etc.)
     * @param {Object} options - Configuration options
     */
    function RedactInstance(element, options) {
        // Allow passing selector
        if (typeof element === 'string') {
            element = D.one(element);
            if (element) {
                element = element.raw();
            }
        } else if (element && element.raw) {
            element = element.raw();
        }

        if (!element) {
            console.error('[Funky.Mask.Redact] Valid element required');
            return;
        }

        // Prevent double initialization
        if (element._funkyRedact) {
            return element._funkyRedact;
        }

        this._element = element;
        this._options = this._mergeOptions(options || {});
        this._value = '';
        this._isRevealed = false;
        this._hideTimer = null;
        this._toggleButton = null;
        this._handlers = {};

        this._init();

        // Store reference on element
        element._funkyRedact = this;
    }

    /**
     * Merge options with defaults
     * @private
     * @param {Object} options - User options
     * @returns {Object} Merged options
     */
    RedactInstance.prototype._mergeOptions = function(options) {
        var merged = {};
        var key;

        for (key in REDACT_DEFAULTS) {
            if (REDACT_DEFAULTS.hasOwnProperty(key)) {
                merged[key] = REDACT_DEFAULTS[key];
            }
        }

        for (key in options) {
            if (options.hasOwnProperty(key)) {
                merged[key] = options[key];
            }
        }

        return merged;
    };

    /**
     * Initialize the redact instance
     * @private
     */
    RedactInstance.prototype._init = function() {
        // Get value from element or options
        this._value = this._options.value ||
                      this._element.getAttribute('data-redact-value') ||
                      '';

        // Parse options from data attributes
        this._parseDataAttributes();

        // Set initial display
        this._updateDisplay();

        // Bind reveal triggers
        this._bindTriggers();

        // Add accessibility attributes
        this._setupAccessibility();

        // Mark as initialized
        this._element.setAttribute('data-redact-initialized', 'true');
    };

    /**
     * Parse data attributes for options
     * @private
     */
    RedactInstance.prototype._parseDataAttributes = function() {
        var el = this._element;

        if (el.hasAttribute('data-redact-pattern')) {
            this._options.pattern = el.getAttribute('data-redact-pattern');
        }
        if (el.hasAttribute('data-redact-reveal')) {
            this._options.reveal = el.getAttribute('data-redact-reveal');
        }
        if (el.hasAttribute('data-redact-auto-hide')) {
            this._options.autoHide = parseInt(el.getAttribute('data-redact-auto-hide'), 10) || 0;
        }
        if (el.hasAttribute('data-redact-show-first')) {
            this._options.showFirst = parseInt(el.getAttribute('data-redact-show-first'), 10) || 0;
        }
        if (el.hasAttribute('data-redact-show-last')) {
            this._options.showLast = parseInt(el.getAttribute('data-redact-show-last'), 10) || 0;
        }
        if (el.hasAttribute('data-redact-char')) {
            this._options.char = el.getAttribute('data-redact-char').charAt(0);
        }
        if (el.hasAttribute('data-redact-audit')) {
            this._options.audit = el.getAttribute('data-redact-audit') === 'true';
        }
        if (el.hasAttribute('data-redact-audit-url')) {
            this._options.auditUrl = el.getAttribute('data-redact-audit-url');
        }
    };

    /**
     * Setup accessibility attributes
     * @private
     */
    RedactInstance.prototype._setupAccessibility = function() {
        var el = this._element;
        var reveal = this._options.reveal;

        // Make element focusable if it's a reveal trigger
        if (reveal === 'click') {
            if (!el.hasAttribute('tabindex')) {
                el.setAttribute('tabindex', '0');
            }
            el.setAttribute('role', 'button');
            el.setAttribute('aria-pressed', 'false');

            // Create descriptive label
            this._createRedactDescription();
        }

        el.setAttribute('aria-expanded', 'false');
    };

    /**
     * Create screen reader description for redact element
     * @private
     */
    RedactInstance.prototype._createRedactDescription = function() {
        var el = this._element;

        if (!el.hasAttribute('aria-label')) {
            var fieldName = el.getAttribute('data-field') || 'Sensitive data';
            var label = fieldName + ', partially hidden';

            if (this._options.reveal === 'click') {
                label += '. Press Enter or Space to reveal.';
            } else if (this._options.reveal === 'hover') {
                label += '. Hover to reveal.';
            } else if (this._options.reveal === 'button') {
                label += '. Use the toggle button to reveal.';
            }

            el.setAttribute('aria-label', label);
        }
    };

    /**
     * Get or create the live region for screen reader announcements
     * @private
     * @returns {HTMLElement}
     */
    RedactInstance.prototype._getLiveRegion = function() {
        // Reuse the same live region as MaskInstance
        return MaskInstance.prototype._getLiveRegion.call(this);
    };

    /**
     * Announce state change to screen readers
     * @private
     */
    RedactInstance.prototype._announceStateChange = function() {
        var region = this._getLiveRegion();
        var fieldName = this._element.getAttribute('data-field') || 'Value';

        if (this._isRevealed) {
            region.textContent = fieldName + ' revealed';
        } else {
            region.textContent = fieldName + ' hidden';
        }
    };

    // =========================================================================
    // Redaction Logic
    // =========================================================================

    /**
     * Generate redacted display string
     * @private
     * @returns {string} Redacted value
     */
    RedactInstance.prototype._getRedactedValue = function() {
        var value = this._value;
        var char = this._options.char;
        var showFirst = this._options.showFirst;
        var showLast = this._options.showLast;

        if (!value) {
            return '';
        }

        var len = value.length;
        var result = '';

        for (var i = 0; i < len; i++) {
            if (i < showFirst) {
                // Show first N characters
                result += value.charAt(i);
            } else if (i >= len - showLast) {
                // Show last N characters
                result += value.charAt(i);
            } else {
                result += char;
            }
        }

        // Apply pattern formatting if specified
        if (this._options.pattern) {
            result = this._applyPatternFormatting(result);
        }

        return result;
    };

    /**
     * Get formatted full value
     * @private
     * @returns {string} Formatted revealed value
     */
    RedactInstance.prototype._getRevealedValue = function() {
        if (this._options.pattern) {
            return this._applyPatternFormatting(this._value);
        }
        return this._value;
    };

    /**
     * Apply pattern formatting to value
     * @private
     * @param {string} value - Value to format
     * @returns {string} Formatted value
     */
    RedactInstance.prototype._applyPatternFormatting = function(value) {
        var patternName = this._options.pattern;
        var patternConfig = Mask.PATTERNS[patternName];

        if (!patternConfig) {
            return value;
        }

        // Get pattern string
        var patternStr = typeof patternConfig.pattern === 'function' ?
            patternConfig.pattern(value) : patternConfig.pattern;

        if (!patternStr) {
            return value;
        }

        // Parse pattern and apply
        var result = '';
        var valueIndex = 0;
        var i = 0;

        while (i < patternStr.length) {
            var char = patternStr.charAt(i);

            // Check if it's a mask character
            if (DEFAULT_DEFINITIONS[char]) {
                if (valueIndex < value.length) {
                    result += value.charAt(valueIndex);
                    valueIndex++;
                }
            } else {
                // Literal character
                result += char;
            }

            i++;
        }

        return result;
    };

    // =========================================================================
    // Reveal Triggers
    // =========================================================================

    /**
     * Bind reveal triggers based on options
     * @private
     */
    RedactInstance.prototype._bindTriggers = function() {
        var self = this;
        var reveal = this._options.reveal;

        if (reveal === 'click') {
            this._element.style.cursor = 'pointer';

            this._handlers.click = function() {
                self.toggle();
            };
            this._element.addEventListener('click', this._handlers.click);

            // Also handle keyboard
            this._handlers.keydown = function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    self.toggle();
                } else if (e.key === 'Escape' && self._isRevealed) {
                    self.hide();
                }
            };
            this._element.addEventListener('keydown', this._handlers.keydown);

        } else if (reveal === 'hover') {
            this._handlers.mouseenter = function() {
                self.reveal();
            };
            this._handlers.mouseleave = function() {
                self.hide();
            };
            this._element.addEventListener('mouseenter', this._handlers.mouseenter);
            this._element.addEventListener('mouseleave', this._handlers.mouseleave);

        } else if (reveal === 'button') {
            this._bindToggleButton();
        }
        // 'none' = programmatic only
    };

    /**
     * Find and bind toggle button
     * @private
     */
    RedactInstance.prototype._bindToggleButton = function() {
        var self = this;

        // Look for button with data-redact-toggle matching this element's id
        var id = this._element.id;
        var button = null;

        if (id) {
            button = document.querySelector('[data-redact-toggle="' + id + '"]');
        }

        // Fallback: look in parent for toggle button
        if (!button && this._element.parentNode) {
            button = this._element.parentNode.querySelector('[data-redact-toggle]');
        }

        if (button) {
            this._toggleButton = button;

            this._handlers.buttonClick = function() {
                self.toggle();
            };
            button.addEventListener('click', this._handlers.buttonClick);

            this._updateButtonState();
        }
    };

    /**
     * Update toggle button icon/text
     * @private
     */
    RedactInstance.prototype._updateButtonState = function() {
        if (!this._toggleButton) {
            return;
        }

        var icon = this._toggleButton.querySelector('i, svg');

        if (icon) {
            // Toggle between eye/eye-slash icons
            if (this._isRevealed) {
                icon.className = icon.className
                    .replace('fa-eye', 'fa-eye-slash')
                    .replace('eye-icon', 'eye-slash-icon');
            } else {
                icon.className = icon.className
                    .replace('fa-eye-slash', 'fa-eye')
                    .replace('eye-slash-icon', 'eye-icon');
            }
        }

        // Update aria attributes
        var label = this._isRevealed ? 'Hide value' : 'Show value';
        this._toggleButton.setAttribute('aria-label', label);
        this._toggleButton.setAttribute('aria-pressed', this._isRevealed ? 'true' : 'false');

        // Update aria-controls if element has id
        if (this._element.id) {
            this._toggleButton.setAttribute('aria-controls', this._element.id);
        }
    };

    // =========================================================================
    // Reveal/Hide Methods
    // =========================================================================

    /**
     * Reveal the full value
     */
    RedactInstance.prototype.reveal = function() {
        if (this._isRevealed) {
            return this;
        }

        this._isRevealed = true;
        this._updateDisplay();
        this._updateButtonState();

        // Announce to screen readers
        this._announceStateChange();

        // Audit logging
        if (this._options.audit) {
            this._logAudit('reveal');
        }

        // Callback
        if (typeof this._options.onReveal === 'function') {
            this._options.onReveal(this._element, this._value);
        }

        // Emit event
        this._emit('reveal', {
            value: this._value
        });

        // Auto-hide timer
        if (this._options.autoHide > 0) {
            this._startAutoHide();
        }
        return this;
    };

    /**
     * Hide the value (show redacted)
     */
    RedactInstance.prototype.hide = function() {
        if (!this._isRevealed) {
            return this;
        }

        this._clearAutoHide();
        this._isRevealed = false;
        this._updateDisplay();
        this._updateButtonState();

        // Announce to screen readers
        this._announceStateChange();

        // Callback
        if (typeof this._options.onHide === 'function') {
            this._options.onHide(this._element);
        }

        // Emit event
        this._emit('hide', {});
        return this;
    };

    /**
     * Toggle reveal state
     */
    RedactInstance.prototype.toggle = function() {
        if (this._isRevealed) {
            this.hide();
        } else {
            this.reveal();
        }
        return this;
    };

    // =========================================================================
    // Auto-Hide Timer
    // =========================================================================

    /**
     * Start auto-hide timer
     * @private
     */
    RedactInstance.prototype._startAutoHide = function() {
        var self = this;

        this._clearAutoHide();

        this._hideTimer = setTimeout(function() {
            self.hide();
        }, this._options.autoHide);
    };

    /**
     * Clear auto-hide timer
     * @private
     */
    RedactInstance.prototype._clearAutoHide = function() {
        if (this._hideTimer) {
            clearTimeout(this._hideTimer);
            this._hideTimer = null;
        }
    };

    // =========================================================================
    // Display Update
    // =========================================================================

    /**
     * Update the display element
     * @private
     */
    RedactInstance.prototype._updateDisplay = function() {
        var value = this._isRevealed ?
            this._getRevealedValue() :
            this._getRedactedValue();

        this._element.textContent = value;

        // Update classes
        var dEl = D.one(this._element);
        if (this._isRevealed) {
            dEl.classRemove('funky-redact-hidden')
               .classAdd('funky-redact-revealed');
        } else {
            dEl.classRemove('funky-redact-revealed')
               .classAdd('funky-redact-hidden');
        }

        // Update aria attributes
        this._element.setAttribute('aria-expanded', this._isRevealed ? 'true' : 'false');

        // Update aria-pressed if element is a button role
        if (this._options.reveal === 'click') {
            this._element.setAttribute('aria-pressed', this._isRevealed ? 'true' : 'false');
        }
    };

    // =========================================================================
    // Audit Logging
    // =========================================================================

    /**
     * Log audit event
     * @private
     * @param {string} action - 'reveal' or 'hide'
     */
    RedactInstance.prototype._logAudit = function(action) {
        var url = this._options.auditUrl || '/api/audit/sensitive-data';

        var data = {
            action: action,
            elementId: this._element.id || null,
            timestamp: new Date().toISOString(),
            field: this._element.getAttribute('data-field') || null
        };

        // Merge additional audit data
        if (this._options.auditData) {
            for (var key in this._options.auditData) {
                if (this._options.auditData.hasOwnProperty(key)) {
                    data[key] = this._options.auditData[key];
                }
            }
        }

        // Use Funky.Api if available, otherwise fetch
        if (Funky && Funky.Api && typeof Funky.Api.post === 'function') {
            Funky.Api.post(url, data).catch(function(err) {
                console.warn('[Funky.Mask.Redact] Audit log failed', err);
            });
        } else if (typeof fetch === 'function') {
            fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }).catch(function(err) {
                console.warn('[Funky.Mask.Redact] Audit log failed', err);
            });
        }
    };

    // =========================================================================
    // Event Emission
    // =========================================================================

    /**
     * Emit an event
     * @private
     * @param {string} eventName - Event name (without 'mask:' prefix)
     * @param {Object} extraDetail - Additional detail properties
     */
    RedactInstance.prototype._emit = function(eventName, extraDetail) {
        var detail = {
            element: this._element,
            revealed: this._isRevealed
        };

        // Merge extra detail
        if (extraDetail) {
            for (var key in extraDetail) {
                if (extraDetail.hasOwnProperty(key)) {
                    detail[key] = extraDetail[key];
                }
            }
        }

        // Emit via PubSub if available
        if (P && P.emit) {
            P.emit('funky:mask:' + eventName, detail);
        }

        // Dispatch DOM CustomEvent (uses dot notation)
        if (Funky.Events && Funky.Events.emit) {
            Funky.Events.emit(this._element, 'funky.mask.' + eventName, detail);
        }
    };

    // =========================================================================
    // Copy Support
    // =========================================================================

    /**
     * Copy value to clipboard
     * @param {boolean} revealed - Copy revealed value (true) or redacted value (false)
     * @returns {Promise}
     */
    RedactInstance.prototype.copy = function(revealed) {
        var value = revealed !== false ? this._value : this._getRedactedValue();

        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(value);
        }

        // Fallback for older browsers
        var textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();

        try {
            document.execCommand('copy');
            document.body.removeChild(textarea);
            return Promise.resolve();
        } catch (err) {
            document.body.removeChild(textarea);
            return Promise.reject(err);
        }
    };

    // =========================================================================
    // Public API
    // =========================================================================

    /**
     * Get the actual value
     * @returns {string}
     */
    RedactInstance.prototype.getValue = function() {
        return this._value;
    };

    /**
     * Set a new value
     * @param {string} value - New value
     */
    RedactInstance.prototype.setValue = function(value) {
        this._value = value || '';
        this._updateDisplay();
    };

    /**
     * Check if value is currently revealed
     * @returns {boolean}
     */
    RedactInstance.prototype.isRevealed = function() {
        return this._isRevealed;
    };

    /**
     * Get the element
     * @returns {HTMLElement}
     */
    RedactInstance.prototype.getElement = function() {
        return this._element;
    };

    /**
     * Destroy the redact instance
     */
    RedactInstance.prototype.destroy = function() {
        this._clearAutoHide();

        // Remove event listeners
        if (this._handlers.click) {
            this._element.removeEventListener('click', this._handlers.click);
        }
        if (this._handlers.keydown) {
            this._element.removeEventListener('keydown', this._handlers.keydown);
        }
        if (this._handlers.mouseenter) {
            this._element.removeEventListener('mouseenter', this._handlers.mouseenter);
        }
        if (this._handlers.mouseleave) {
            this._element.removeEventListener('mouseleave', this._handlers.mouseleave);
        }
        if (this._handlers.buttonClick && this._toggleButton) {
            this._toggleButton.removeEventListener('click', this._handlers.buttonClick);
        }

        this._handlers = {};

        // Remove attributes
        this._element.removeAttribute('data-redact-initialized');
        this._element.removeAttribute('tabindex');
        this._element.removeAttribute('role');
        this._element.removeAttribute('aria-label');
        this._element.removeAttribute('aria-expanded');
        this._element.style.cursor = '';

        delete this._element._funkyRedact;
    };

    // =========================================================================
    // Mask Static API (Factory)
    // =========================================================================

    /**
     * Mask factory/namespace
     * @constructor
     */
    function Mask(element, options) {
        return new MaskInstance(element, options);
    }

    /**
     * Patterns registry - Built-in pattern presets
     */
    Mask.PATTERNS = {
        // US Phone: (555) 123-4567
        'phone': {
            pattern: '(999) 999-9999',
            placeholder: '_',
            inputType: 'tel',
            inputMode: 'numeric'
        },

        // International Phone: +1 (555) 123-4567
        'phone-intl': {
            pattern: '+9 (999) 999-9999',
            placeholder: '_',
            inputType: 'tel',
            inputMode: 'tel'
        },

        // Credit Card: 4111 1111 1111 1234
        'credit-card': {
            pattern: '9999 9999 9999 9999',
            placeholder: '_',
            inputType: 'text',
            inputMode: 'numeric',
            validate: 'luhn',
            autocomplete: 'cc-number'
        },

        // SSN: 123-45-6789
        'ssn': {
            pattern: '999-99-9999',
            placeholder: '_',
            inputMode: 'numeric'
        },

        // Date (US): 12/25/2025
        'date': {
            pattern: '99/99/9999',
            placeholder: 'mm/dd/yyyy',
            validate: 'date-us',
            inputMode: 'numeric'
        },

        // Date (ISO): 2025-12-25
        'date-iso': {
            pattern: '9999-99-99',
            placeholder: 'yyyy-mm-dd',
            validate: 'date-iso',
            inputMode: 'numeric'
        },

        // Date (EU): 25/12/2025
        'date-eu': {
            pattern: '99/99/9999',
            placeholder: 'dd/mm/yyyy',
            validate: 'date-eu',
            inputMode: 'numeric'
        },

        // Time (24hr): 14:30
        'time': {
            pattern: '99:99',
            placeholder: 'hh:mm',
            validate: 'time-24',
            inputMode: 'numeric'
        },

        // Time (12hr): 02:30 PM
        'time-12': {
            pattern: '99:99 AA',
            placeholder: 'hh:mm AM',
            validate: 'time-12',
            transform: 'uppercase'
        },

        // US ZIP: 12345
        'zip': {
            pattern: '99999',
            placeholder: '_',
            inputMode: 'numeric'
        },

        // US ZIP+4: 12345-6789
        'zip-plus4': {
            pattern: '99999-9999',
            placeholder: '_',
            inputMode: 'numeric'
        },

        // CVV: 123 or 1234 (for AMEX)
        'cvv': {
            pattern: '9999',
            placeholder: '',
            inputMode: 'numeric'
        },

        // Expiration Date: 12/25
        'expiry': {
            pattern: '99/99',
            placeholder: 'MM/YY',
            validate: 'expiry',
            inputMode: 'numeric',
            autocomplete: 'cc-exp'
        }
    };

    /**
     * Helper: Validate date components
     * @private
     */
    function _validateDate(month, day, year) {
        if (month < 1 || month > 12) {
            return { valid: false, error: 'Invalid month' };
        }

        if (year < 1900 || year > 2100) {
            return { valid: false, error: 'Invalid year' };
        }

        // Days per month (accounting for leap years)
        var daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

        // Check leap year
        if (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) {
            daysInMonth[1] = 29;
        }

        if (day < 1 || day > daysInMonth[month - 1]) {
            return { valid: false, error: 'Invalid day for month' };
        }

        return { valid: true, error: null };
    }

    /**
     * Validators registry - Built-in validators
     */
    Mask.VALIDATORS = {
        /**
         * Luhn algorithm for credit card validation
         */
        'luhn': function(value) {
            if (!value || value.length < 13) {
                return { valid: false, error: 'Card number too short' };
            }

            var sum = 0;
            var isEven = false;

            for (var i = value.length - 1; i >= 0; i--) {
                var digit = parseInt(value.charAt(i), 10);

                if (isEven) {
                    digit *= 2;
                    if (digit > 9) {
                        digit -= 9;
                    }
                }

                sum += digit;
                isEven = !isEven;
            }

            return {
                valid: sum % 10 === 0,
                error: sum % 10 === 0 ? null : 'Invalid card number'
            };
        },

        /**
         * US date validation (MM/DD/YYYY)
         */
        'date-us': function(value) {
            if (value.length !== 8) {
                return { valid: false, error: 'Incomplete date' };
            }

            var month = parseInt(value.substring(0, 2), 10);
            var day = parseInt(value.substring(2, 4), 10);
            var year = parseInt(value.substring(4, 8), 10);

            return _validateDate(month, day, year);
        },

        /**
         * ISO date validation (YYYY-MM-DD)
         */
        'date-iso': function(value) {
            if (value.length !== 8) {
                return { valid: false, error: 'Incomplete date' };
            }

            var year = parseInt(value.substring(0, 4), 10);
            var month = parseInt(value.substring(4, 6), 10);
            var day = parseInt(value.substring(6, 8), 10);

            return _validateDate(month, day, year);
        },

        /**
         * EU date validation (DD/MM/YYYY)
         */
        'date-eu': function(value) {
            if (value.length !== 8) {
                return { valid: false, error: 'Incomplete date' };
            }

            var day = parseInt(value.substring(0, 2), 10);
            var month = parseInt(value.substring(2, 4), 10);
            var year = parseInt(value.substring(4, 8), 10);

            return _validateDate(month, day, year);
        },

        /**
         * 24-hour time validation
         */
        'time-24': function(value) {
            if (value.length !== 4) {
                return { valid: false, error: 'Incomplete time' };
            }

            var hours = parseInt(value.substring(0, 2), 10);
            var minutes = parseInt(value.substring(2, 4), 10);

            if (hours < 0 || hours > 23) {
                return { valid: false, error: 'Invalid hours (0-23)' };
            }
            if (minutes < 0 || minutes > 59) {
                return { valid: false, error: 'Invalid minutes (0-59)' };
            }

            return { valid: true, error: null };
        },

        /**
         * 12-hour time validation
         */
        'time-12': function(value) {
            if (value.length < 4) {
                return { valid: false, error: 'Incomplete time' };
            }

            var hours = parseInt(value.substring(0, 2), 10);
            var minutes = parseInt(value.substring(2, 4), 10);

            if (hours < 1 || hours > 12) {
                return { valid: false, error: 'Invalid hours (1-12)' };
            }
            if (minutes < 0 || minutes > 59) {
                return { valid: false, error: 'Invalid minutes (0-59)' };
            }

            return { valid: true, error: null };
        },

        /**
         * Credit card expiry validation (MM/YY)
         */
        'expiry': function(value) {
            if (value.length !== 4) {
                return { valid: false, error: 'Incomplete expiry' };
            }

            var month = parseInt(value.substring(0, 2), 10);
            var year = parseInt('20' + value.substring(2, 4), 10);

            if (month < 1 || month > 12) {
                return { valid: false, error: 'Invalid month (01-12)' };
            }

            // Check if card is expired
            var now = new Date();
            var expiry = new Date(year, month); // First day of next month

            if (expiry <= now) {
                return { valid: false, error: 'Card expired' };
            }

            return { valid: true, error: null };
        }
    };

    /**
     * Detect credit card type from number
     * @param {string} number - Card number (raw digits)
     * @returns {string|null} Card type or null
     */
    Mask.detectCardType = function(number) {
        if (!number) return null;

        var patterns = {
            'visa': /^4/,
            'mastercard': /^5[1-5]/,
            'amex': /^3[47]/,
            'discover': /^6(?:011|5)/,
            'diners': /^3(?:0[0-5]|[68])/,
            'jcb': /^(?:2131|1800|35\d{3})/
        };

        for (var type in patterns) {
            if (patterns.hasOwnProperty(type) && patterns[type].test(number)) {
                return type;
            }
        }

        return null;
    };

    /**
     * Auto-initialize all data-mask elements
     */
    Mask.init = function() {
        D.all('[data-mask]:not([data-mask-initialized])').each(function(el) {
            var rawEl = el.raw();
            var pattern = el.attr('data-mask');
            var placeholder = el.attr('data-mask-placeholder');
            var transform = el.attr('data-mask-transform');
            var validate = el.attr('data-mask-validate');
            var showMask = el.attr('data-mask-show') === 'true';
            var clearIncomplete = el.attr('data-mask-clear-incomplete') === 'true';

            new MaskInstance(rawEl, {
                pattern: pattern,
                placeholder: placeholder ? placeholder.charAt(0) : '_',
                transform: transform || null,
                validate: validate || null,
                showMask: showMask,
                clearIncomplete: clearIncomplete
            });
        });
    };

    /**
     * Get mask instance for an element
     * @param {HTMLElement|string} element - Element or selector
     * @returns {MaskInstance|null}
     */
    Mask.get = function(element) {
        var el;

        if (typeof element === 'string') {
            var found = D.one(element);
            el = found ? found.raw() : null;
        } else if (element && element.raw) {
            el = element.raw();
        } else {
            el = element;
        }

        return el ? el._funkyMask || null : null;
    };

    /**
     * Destroy all mask instances
     */
    Mask.destroyAll = function() {
        D.all('[data-mask-initialized]').each(function(el) {
            var mask = el.raw()._funkyMask;
            if (mask) {
                mask.destroy();
            }
        });
    };

    /**
     * Register a custom pattern
     * @param {string} name - Pattern name
     * @param {Object|string} config - Pattern config or pattern string
     */
    Mask.registerPattern = function(name, config) {
        if (typeof config === 'string') {
            config = { pattern: config };
        }
        Mask.PATTERNS[name] = config;
    };

    /**
     * Register a custom validator (Phase 2)
     * @param {string} name - Validator name
     * @param {Function} fn - Validator function
     */
    Mask.registerValidator = function(name, fn) {
        Mask.VALIDATORS[name] = fn;
    };

    // =========================================================================
    // Redact Static API
    // =========================================================================

    /**
     * Initialize redact mode on elements
     * @param {string|HTMLElement|NodeList} selector - Elements to redact
     * @param {Object} options - Options for all elements
     * @returns {RedactInstance|Array<RedactInstance>}
     */
    Mask.redact = function(selector, options) {
        var elements = [];

        if (typeof selector === 'string') {
            D.all(selector).each(function(el) {
                elements.push(el.raw());
            });
        } else if (selector && selector.length !== undefined && typeof selector !== 'string') {
            // NodeList or array
            for (var i = 0; i < selector.length; i++) {
                var item = selector[i];
                elements.push(item.raw ? item.raw() : item);
            }
        } else if (selector) {
            // Single element
            elements.push(selector.raw ? selector.raw() : selector);
        }

        var instances = [];

        for (var j = 0; j < elements.length; j++) {
            instances.push(new RedactInstance(elements[j], options || {}));
        }

        return instances.length === 1 ? instances[0] : instances;
    };

    /**
     * Auto-initialize all data-redact elements
     */
    Mask.initRedact = function() {
        D.all('[data-redact]:not([data-redact-initialized])').each(function(el) {
            new RedactInstance(el.raw());
        });
    };

    /**
     * Get redact instance for an element
     * @param {HTMLElement|string} element
     * @returns {RedactInstance|null}
     */
    Mask.getRedact = function(element) {
        var el;

        if (typeof element === 'string') {
            var found = D.one(element);
            el = found ? found.raw() : null;
        } else if (element && element.raw) {
            el = element.raw();
        } else {
            el = element;
        }

        return el ? el._funkyRedact || null : null;
    };

    /**
     * Destroy all redact instances
     */
    Mask.destroyAllRedact = function() {
        D.all('[data-redact-initialized]').each(function(el) {
            var redact = el.raw()._funkyRedact;
            if (redact) {
                redact.destroy();
            }
        });
    };

    // =========================================================================
    // LiveBinding Integration
    // =========================================================================

    /**
     * Register Mask and Redact as LiveBinding component adapters
     * @private
     */
    function registerLiveBindingAdapters() {
        // Check if LiveBinding exists
        if (!Funky.LiveBinding || typeof Funky.LiveBinding.registerComponent !== 'function') {
            return;
        }

        var LiveBinding = Funky.LiveBinding;

        /**
         * Mask component adapter for LiveBinding
         * Handles inputs with both data-live and data-mask
         */
        LiveBinding.registerComponent('mask', {
            /**
             * Check if this adapter applies to an element
             * @param {HTMLElement} element
             * @returns {boolean}
             */
            supports: function(element) {
                return element.tagName === 'INPUT' &&
                       element.hasAttribute('data-mask');
            },

            /**
             * Bind mask to element
             * @param {HTMLElement} element
             * @param {Object} options - Binding options
             * @returns {Object} Component interface with update() and destroy()
             */
            bind: function(element, options) {
                var pattern = element.getAttribute('data-mask');

                // Create mask instance if not exists
                var mask = element._funkyMask;
                if (!mask) {
                    mask = new MaskInstance(element, {
                        pattern: pattern,
                        placeholder: element.getAttribute('data-mask-placeholder') || '_',
                        transform: element.getAttribute('data-mask-transform'),
                        validate: element.getAttribute('data-mask-validate')
                    });
                }

                // Track binding state to prevent echo
                var fromBinding = false;

                // Listen for mask changes to update binding
                var inputHandler = function(e) {
                    if (fromBinding) return;
                    if (options.onInput && typeof options.onInput === 'function') {
                        // Send raw value back to binding
                        var fieldName = element.name || element.id || 'value';
                        options.onInput(fieldName, e.detail.raw, element);
                    }
                };
                element.addEventListener('mask:input', inputHandler);

                return {
                    /**
                     * Update mask value from binding data
                     * @param {*} data - Data from binding (expects raw value)
                     */
                    update: function(data) {
                        if (!mask) return;

                        // Handle object with field name or direct value
                        var value = data;
                        if (data && typeof data === 'object') {
                            var fieldName = element.name || element.id || 'value';
                            value = data[fieldName];
                        }

                        if (value !== undefined && value !== null) {
                            fromBinding = true;
                            mask.setValue(String(value));
                            fromBinding = false;
                        }
                    },

                    /**
                     * Get current value
                     * @returns {*}
                     */
                    getData: function() {
                        return mask ? mask.getRaw() : element.value;
                    },

                    /**
                     * Destroy mask
                     */
                    destroy: function() {
                        element.removeEventListener('mask:input', inputHandler);
                        if (mask) {
                            mask.destroy();
                        }
                    }
                };
            }
        });

        /**
         * Redact component adapter for LiveBinding
         * Handles elements with both data-live and data-redact
         */
        LiveBinding.registerComponent('redact', {
            /**
             * Check if this adapter applies to an element
             * @param {HTMLElement} element
             * @returns {boolean}
             */
            supports: function(element) {
                return element.hasAttribute('data-redact') &&
                       element.tagName !== 'INPUT';
            },

            /**
             * Bind redact to element
             * @param {HTMLElement} element
             * @param {Object} options - Binding options
             * @returns {Object} Component interface with update() and destroy()
             */
            bind: function(element, options) {
                // Create redact instance if not exists
                var redact = element._funkyRedact;
                if (!redact) {
                    redact = new RedactInstance(element, {});
                }

                return {
                    /**
                     * Update redact value from binding data
                     * @param {*} data - Data from binding
                     */
                    update: function(data) {
                        if (!redact) return;

                        // Handle object with field name or direct value
                        var value = data;
                        if (data && typeof data === 'object') {
                            var fieldName = element.getAttribute('data-field') || 'value';
                            value = data[fieldName];
                        }

                        if (value !== undefined && value !== null) {
                            redact._value = String(value);
                            redact._updateDisplay();
                        }
                    },

                    /**
                     * Get current value
                     * @returns {*}
                     */
                    getData: function() {
                        return redact ? redact._value : element.textContent;
                    },

                    /**
                     * Destroy redact
                     */
                    destroy: function() {
                        if (redact) {
                            redact.destroy();
                        }
                    }
                };
            }
        });

        // Register the component registries for LiveBinding to check
        if (typeof LiveBinding.registerRegistry === 'function') {
            LiveBinding.registerRegistry('Mask');
        }
    }

    /**
     * Format value using a mask pattern
     * Utility function for use outside of input context
     * @param {string} raw - Raw unformatted value
     * @param {string} patternName - Pattern name or pattern string
     * @returns {string} Formatted value
     */
    Mask.format = function(raw, patternName) {
        if (!raw) return '';

        // Resolve pattern
        var pattern = Mask.PATTERNS[patternName];
        var patternStr = pattern ? pattern.pattern : patternName;

        if (!patternStr) return raw;

        // Create temporary mask to format
        var tempInput = document.createElement('input');
        var tempMask = new MaskInstance(tempInput, {
            pattern: patternStr
        });

        tempMask.setValue(raw);
        var formatted = tempMask.getFormatted();
        tempMask.destroy();

        return formatted;
    };

    /**
     * Redact value for display
     * Utility function for use outside of redact instance
     * @param {string} value - Value to redact
     * @param {Object} options - Redact options (showFirst, showLast, char, pattern)
     * @returns {string} Redacted value
     */
    Mask.redactValue = function(value, options) {
        if (!value) return '';

        options = options || {};
        var char = options.char || '•';
        var showFirst = options.showFirst || 0;
        var showLast = options.showLast || 0;

        var result = '';
        var len = value.length;

        for (var i = 0; i < len; i++) {
            if (i < showFirst) {
                result += value.charAt(i);
            } else if (i >= len - showLast) {
                result += value.charAt(i);
            } else {
                result += char;
            }
        }

        // Apply pattern formatting if specified
        if (options.pattern) {
            result = Mask.format(result, options.pattern);
        }

        return result;
    };

    // =========================================================================
    // Export
    // =========================================================================

    if (Funky.register) {
        Funky.register('Mask', Mask);
    }

    // Also expose MaskInstance for advanced usage
    Mask.Instance = MaskInstance;

    // Expose RedactInstance
    Mask.Redact = RedactInstance;

    // Register LiveBinding adapters after export
    // Use setTimeout to ensure LiveBinding is loaded
    setTimeout(registerLiveBindingAdapters, 0);

})(window);

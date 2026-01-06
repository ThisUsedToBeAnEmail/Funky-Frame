/**
 * Funky.InlineEdit
 * 
 * Click-to-edit any element with automatic API save.
 * 
 * @example
 * <span class="inline-edit" 
 *       role="button"
 *       tabindex="0"
 *       data-entity="client" 
 *       data-id="123" 
 *       data-field="name">John Smith</span>
 */
(function(window) {
    'use strict';

    // Ensure Funky registry exists
    if (!window.Funky || !window.Funky.register) {
        console.error('[Funky.InlineEdit] Registry not found. Load namespace.js first.');
        return;
    }

    var D = Funky.Dom;
    var E = Funky.Events;

    var SELECTOR = '.inline-edit';
    var instances = [];

    // ─────────────────────────────────────────────────────────────
    // Presence Integration State
    // ─────────────────────────────────────────────────────────────

    var _presenceEnabled = false;
    var _presenceConfig = {
        showOtherEditors: true,
        conflictWarning: true
    };
    var _editingChannels = {};  // { fieldId: channel }

    /**
     * Generate presence channel for an editable field
     * @param {InlineEdit} instance - The InlineEdit instance
     * @returns {string|null} Channel name
     */
    function getFieldChannel(instance) {
        var el = instance.el;

        // Use explicit data attribute if provided
        var channel = el.getAttribute('data-presence-channel');
        if (channel) return channel;

        // Generate from entity/id/field context
        if (instance.entity && instance.id && instance.field) {
            return 'field:' + instance.entity + ':' + instance.id + ':' + instance.field;
        }

        // Try data-record-id attribute
        var recordId = el.getAttribute('data-record-id');
        if (!recordId) {
            var parent = el.closest('[data-record-id]');
            if (parent) recordId = parent.getAttribute('data-record-id');
        }

        if (recordId && instance.field) {
            return 'field:' + recordId + ':' + instance.field;
        }

        return null;
    }

    /**
     * Start editing presence for a field
     * @param {InlineEdit} instance - The InlineEdit instance
     * @private
     */
    function startEditingPresence(instance) {
        if (!_presenceEnabled || !Funky.Presence) return;

        var channel = getFieldChannel(instance);
        if (!channel) return;

        var fieldId = instance.entity + ':' + instance.id + ':' + instance.field;
        _editingChannels[fieldId] = channel;

        // Join channel with editing status
        Funky.Presence.join(channel, {
            status: 'editing',
            metadata: {
                entity: instance.entity,
                recordId: instance.id,
                fieldName: instance.field
            }
        });

        // Store channel reference on instance
        instance._presenceChannel = channel;
    }

    /**
     * Stop editing presence for a field
     * @param {InlineEdit} instance - The InlineEdit instance
     * @private
     */
    function stopEditingPresence(instance) {
        if (!_presenceEnabled || !Funky.Presence) return;

        var channel = instance._presenceChannel;
        if (!channel) return;

        var fieldId = instance.entity + ':' + instance.id + ':' + instance.field;

        Funky.Presence.leave(channel);
        delete _editingChannels[fieldId];
        instance._presenceChannel = null;

        // Remove any presence indicator
        removePresenceIndicator(instance);
    }

    /**
     * Show other editors indicator
     * @param {InlineEdit} instance - The InlineEdit instance
     * @private
     */
    function showOtherEditors(instance) {
        if (!_presenceEnabled || !Funky.Presence || !_presenceConfig.showOtherEditors) return;

        var channel = instance._presenceChannel || getFieldChannel(instance);
        if (!channel) return;

        var otherUsers = Funky.Presence.getOtherUsers(channel);
        var editingUsers = otherUsers.filter(function(u) {
            return u.status === 'editing';
        });

        var wrapper = instance.el.parentNode;
        var indicator = wrapper.querySelector('.inline-edit__presence');

        if (editingUsers.length > 0) {
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.className = 'inline-edit__presence';
                indicator.setAttribute('aria-live', 'polite');
                wrapper.appendChild(indicator);
            }

            var names = editingUsers.map(function(u) { return u.name; }).join(', ');
            var verb = editingUsers.length === 1 ? ' is editing' : ' are editing';
            indicator.innerHTML = '<span class="inline-edit__presence-dot"></span>' +
                                  '<span class="inline-edit__presence-text">' +
                                  names + verb + '</span>';
            indicator.removeAttribute('hidden');
        } else if (indicator) {
            indicator.setAttribute('hidden', '');
        }
    }

    /**
     * Remove presence indicator
     * @param {InlineEdit} instance - The InlineEdit instance
     * @private
     */
    function removePresenceIndicator(instance) {
        var wrapper = instance.el.parentNode;
        if (!wrapper) return;

        var indicator = wrapper.querySelector('.inline-edit__presence');
        if (indicator) {
            indicator.parentNode.removeChild(indicator);
        }
    }

    /**
     * Check for editing conflicts before starting edit
     * @param {InlineEdit} instance - The InlineEdit instance
     * @returns {boolean} True if safe to edit
     */
    function checkEditConflict(instance) {
        if (!_presenceEnabled || !Funky.Presence || !_presenceConfig.conflictWarning) {
            return true;
        }

        var channel = getFieldChannel(instance);
        if (!channel) return true;

        // First join temporarily to see who's there
        var otherUsers = Funky.Presence.getOtherUsers(channel);
        var editingUsers = otherUsers.filter(function(u) {
            return u.status === 'editing';
        });

        if (editingUsers.length > 0) {
            var names = editingUsers.map(function(u) { return u.name; }).join(', ');
            var verb = editingUsers.length === 1 ? ' is' : ' are';
            var proceed = confirm(names + verb + ' currently editing this field. Continue anyway?');
            return proceed;
        }

        return true;
    }

    /**
     * Set up presence event listeners for an instance
     * @param {InlineEdit} instance - The InlineEdit instance
     * @private
     */
    function setupPresenceListeners(instance) {
        if (!_presenceEnabled || !Funky.Presence) return;

        var channel = instance._presenceChannel;
        if (!channel) return;

        var onJoin = function(data) {
            if (data.channel === channel) {
                showOtherEditors(instance);
            }
        };

        var onLeave = function(data) {
            if (data.channel === channel) {
                showOtherEditors(instance);
            }
        };

        Funky.Presence.on('user:join', onJoin);
        Funky.Presence.on('user:leave', onLeave);

        // Store for cleanup
        instance._presenceListeners = {
            onJoin: onJoin,
            onLeave: onLeave
        };
    }

    /**
     * Remove presence event listeners for an instance
     * @param {InlineEdit} instance - The InlineEdit instance
     * @private
     */
    function removePresenceListeners(instance) {
        if (!instance._presenceListeners || !Funky.Presence) return;

        Funky.Presence.off('user:join', instance._presenceListeners.onJoin);
        Funky.Presence.off('user:leave', instance._presenceListeners.onLeave);
        instance._presenceListeners = null;
    }

    /**
     * InlineEdit instance
     * @param {HTMLElement} el - The editable element
     */
    function InlineEdit(el) {
        this.el = el;
        this.entity = el.getAttribute('data-entity') || '';
        this.id = el.getAttribute('data-id') || '';
        this.field = el.getAttribute('data-field') || '';
        this.type = el.getAttribute('data-type') || 'text';
        this.api = el.getAttribute('data-api') || '/api/' + this.entity + '/' + this.id;
        this.local = el.getAttribute('data-local') === 'true';

        this.originalValue = el.textContent.trim();
        this.isEditing = false;
        this.isSaving = false;
        this.input = null;
        this._lastKnownValue = this.originalValue;

        this._bindEvents();
    }

    InlineEdit.prototype = {
        /**
         * Bind click/keyboard events to trigger edit mode
         */
        _bindEvents: function() {
            var self = this;
            var wrapper = D.wrap(this.el);
            
            // Click to edit
            wrapper.on('click', function(e) {
                if (!self.isEditing && self.isEnabled()) {
                    self.startEdit();
                }
            });
            
            // Enter/Space to edit (for keyboard users)
            wrapper.on('keydown', function(e) {
                if (!self.isEditing && self.isEnabled() && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    self.startEdit();
                }
            });
        },

        /**
         * Start edit mode
         */
        startEdit: function() {
            if (this.isEditing || this.isSaving) return;

            // Check for presence conflicts before starting
            if (!checkEditConflict(this)) {
                return;
            }

            this.isEditing = true;

            // Get original value - if empty (has placeholder), treat as empty string
            if (this.el.getAttribute('data-empty') === 'true') {
                this.originalValue = '';
            } else {
                this.originalValue = this.el.textContent.trim();
            }

            // Create input (implemented in phase 2)
            this._createInput();

            // Start presence tracking
            startEditingPresence(this);
            setupPresenceListeners(this);
            showOtherEditors(this);

            E.emit(this.el, 'funky.inline-edit.start', {
                entity: this.entity,
                id: this.id,
                field: this.field,
                element: this.el
            });
        },

        /**
         * Cancel edit mode
         */
        cancelEdit: function() {
            if (!this.isEditing) return;

            // Stop presence tracking
            removePresenceListeners(this);
            stopEditingPresence(this);

            this._restoreDisplay(this.originalValue);
            this.isEditing = false;

            E.emit(this.el, 'funky.inline-edit.cancel', {
                entity: this.entity,
                id: this.id,
                field: this.field
            });
        },

        // ─────────────────────────────────────────────────────────────
        // Save & API Integration
        // ─────────────────────────────────────────────────────────────

        /**
         * Save the new value
         */
        save: function() {
            var self = this;
            
            if (!this.isEditing || this.isSaving) return;
            
            var newValue = this._getInputValue();
            var displayValue = this._getDisplayValue();
            
            // No change - just cancel
            if (newValue === this.originalValue || displayValue === this.el.textContent) {
                this.cancelEdit();
                return;
            }
            
            // Client-side validation
            var validationError = this._validate(newValue);
            if (validationError) {
                this._showError(validationError);
                return;
            }
            
            // Start saving
            this.isSaving = true;
            this._showSavingState();

            // Optimistic update
            var oldValue = this.originalValue;
            this._restoreDisplay(displayValue);
            D.wrap(this.el).classAdd('inline-edit-saving');

            // Local mode - skip API call
            if (this.local) {
                var localSelf = this;
                // Simulate async save for consistency
                setTimeout(function() {
                    localSelf._onSaveSuccess(oldValue, newValue, displayValue);
                }, 50);
                return;
            }

            // Build API request
            var payload = {};
            payload[this.field] = newValue;

            Funky.Api.patch(this.api, payload)
                .then(function(response) {
                    self._onSaveSuccess(oldValue, newValue, displayValue);
                })
                .catch(function(error) {
                    self._onSaveError(oldValue, error);
                });
        },

        /**
         * Validate the input value
         * @param {string} value - Value to validate
         * @returns {string|null} Error message or null if valid
         */
        _validate: function(value) {
            var required = this.el.getAttribute('data-required') === 'true';
            
            if (required && !value.trim()) {
                return 'This field is required';
            }
            
            if (this.type === 'number') {
                var num = parseFloat(value);
                if (isNaN(num)) {
                    return 'Please enter a valid number';
                }
                
                var min = this.el.getAttribute('data-min');
                var max = this.el.getAttribute('data-max');
                
                if (min !== null && num < parseFloat(min)) {
                    return 'Value must be at least ' + min;
                }
                if (max !== null && num > parseFloat(max)) {
                    return 'Value must be at most ' + max;
                }
            }
            
            var pattern = this.el.getAttribute('data-pattern');
            if (pattern) {
                var regex = new RegExp(pattern);
                if (!regex.test(value)) {
                    return this.el.getAttribute('data-pattern-message') || 'Invalid format';
                }
            }
            
            return null;
        },

        /**
         * Show saving state (spinner)
         */
        _showSavingState: function() {
            D.wrap(this.el).classAdd('inline-edit-saving');
        },

        /**
         * Handle successful save
         * @param {string} oldValue - Previous value
         * @param {string} newValue - New value (for API)
         * @param {string} displayValue - Display value
         */
        _onSaveSuccess: function(oldValue, newValue, displayValue) {
            var self = this;

            // Stop presence tracking
            removePresenceListeners(this);
            stopEditingPresence(this);

            this.isSaving = false;
            this.isEditing = false;
            this.originalValue = displayValue;
            this._lastKnownValue = displayValue;
            
            var wrapper = D.wrap(this.el);
            wrapper.classRemove('inline-edit-saving');
            wrapper.classAdd('inline-edit-success');
            
            // Remove success state after animation
            setTimeout(function() {
                wrapper.classRemove('inline-edit-success');
            }, 1500);
            
            // Emit save event
            E.emit(this.el, 'funky.inline-edit.save', {
                entity: this.entity,
                id: this.id,
                field: this.field,
                oldValue: oldValue,
                newValue: newValue
            });
            
            // Show toast with undo option
            if (Funky.Toast) {
                Funky.Toast.show({
                    message: 'Updated ' + this.field,
                    type: 'success',
                    duration: 5000,
                    action: {
                        label: 'Undo',
                        callback: function() {
                            self._undo(oldValue, newValue);
                        }
                    }
                });
            }
            
            // Invalidate cache if available
            if (Funky.Cache) {
                Funky.Cache.invalidate(this.entity, this.id);
            }
        },

        /**
         * Handle save error
         * @param {string} oldValue - Original value to restore
         * @param {Error} error - Error object
         */
        _onSaveError: function(oldValue, error) {
            var self = this;

            // Stop presence tracking
            removePresenceListeners(this);
            stopEditingPresence(this);

            this.isSaving = false;
            this.isEditing = false;
            
            // Rollback to original value
            this.el.textContent = oldValue;
            this.originalValue = oldValue;
            
            var wrapper = D.wrap(this.el);
            wrapper.classRemove('inline-edit-saving');
            wrapper.classAdd('inline-edit-error');
            
            // Remove error state after animation
            setTimeout(function() {
                wrapper.classRemove('inline-edit-error');
            }, 3000);
            
            // Parse error message
            var message = 'Failed to save';
            if (error && error.response && error.response.error) {
                message = error.response.error;
            } else if (error && error.message) {
                message = error.message;
            }
            
            // Emit error event
            E.emit(this.el, 'funky.inline-edit.error', {
                entity: this.entity,
                id: this.id,
                field: this.field,
                error: message
            });
            
            // Toast notification
            if (Funky.Toast) {
                Funky.Toast.show({
                    message: message,
                    type: 'error'
                });
            }
        },

        /**
         * Show error tooltip on input
         * @param {string} message - Error message
         */
        _showError: function(message) {
            if (this.input) {
                this.input.setCustomValidity(message);
                this.input.reportValidity();
            }
        },

        /**
         * Undo the last change
         * @param {string} oldValue - Value to restore
         * @param {string} newValue - Current value (for API rollback)
         */
        _undo: function(oldValue, newValue) {
            var self = this;

            // Build API request to restore old value
            var payload = {};
            payload[this.field] = oldValue;

            D.wrap(this.el).classAdd('inline-edit-saving');

            // Local mode - skip API call
            if (this.local) {
                setTimeout(function() {
                    self.el.textContent = oldValue;
                    self.originalValue = oldValue;
                    self._lastKnownValue = oldValue;
                    D.wrap(self.el).classRemove('inline-edit-saving');

                    E.emit(self.el, 'funky.inline-edit.undo', {
                        entity: self.entity,
                        id: self.id,
                        field: self.field,
                        value: oldValue
                    });

                    if (Funky.Toast) {
                        Funky.Toast.show({
                            message: 'Change undone',
                            type: 'info'
                        });
                    }
                }, 50);
                return;
            }

            Funky.Api.patch(this.api, payload)
                .then(function() {
                    self.el.textContent = oldValue;
                    self.originalValue = oldValue;
                    self._lastKnownValue = oldValue;
                    D.wrap(self.el).classRemove('inline-edit-saving');

                    E.emit(self.el, 'funky.inline-edit.undo', {
                        entity: self.entity,
                        id: self.id,
                        field: self.field,
                        value: oldValue
                    });

                    if (Funky.Toast) {
                        Funky.Toast.show({
                            message: 'Change undone',
                            type: 'info'
                        });
                    }
                })
                .catch(function(error) {
                    D.wrap(self.el).classRemove('inline-edit-saving');

                    if (Funky.Toast) {
                        Funky.Toast.show({
                            message: 'Failed to undo',
                            type: 'error'
                        });
                    }
                });
        },

        // ─────────────────────────────────────────────────────────────
        // Input Creation
        // ─────────────────────────────────────────────────────────────

        /**
         * Create input element based on type
         */
        _createInput: function() {
            var self = this;
            var type = this.type;
            
            // Hide the display element
            this.el.style.display = 'none';
            
            // Create appropriate input
            switch (type) {
                case 'select':
                    this.input = this._createSelect();
                    break;
                case 'textarea':
                    this.input = this._createTextarea();
                    break;
                case 'date':
                    this.input = this._createDateInput();
                    break;
                case 'number':
                    this.input = this._createNumberInput();
                    break;
                default:
                    this.input = this._createTextInput();
            }
            
            // Insert input after display element
            this.el.parentNode.insertBefore(this.input, this.el.nextSibling);
            
            // Focus and select
            this.input.focus();
            if (this.input.select) {
                this.input.select();
            }
            
            // Bind input events
            this._bindInputEvents();
        },

        /**
         * Create text input
         * @returns {HTMLInputElement}
         */
        _createTextInput: function() {
            var input = document.createElement('input');
            input.type = 'text';
            input.className = 'inline-edit-input';
            input.value = this.originalValue;
            input.placeholder = this.el.getAttribute('data-placeholder') || '';
            
            if (this.el.getAttribute('data-required') === 'true') {
                input.required = true;
            }
            
            return input;
        },

        /**
         * Create number input
         * @returns {HTMLInputElement}
         */
        _createNumberInput: function() {
            var input = document.createElement('input');
            input.type = 'number';
            input.className = 'inline-edit-input';
            input.value = this.originalValue;
            
            var min = this.el.getAttribute('data-min');
            var max = this.el.getAttribute('data-max');
            var step = this.el.getAttribute('data-step');
            
            if (min !== null) input.min = min;
            if (max !== null) input.max = max;
            if (step !== null) input.step = step;
            
            return input;
        },

        /**
         * Create select dropdown
         * @returns {HTMLSelectElement}
         */
        _createSelect: function() {
            var select = document.createElement('select');
            select.className = 'inline-edit-input inline-edit-select';
            
            var optionsAttr = this.el.getAttribute('data-options');
            var options = [];
            
            try {
                options = JSON.parse(optionsAttr) || [];
            } catch (e) {
                console.warn('[InlineEdit] Invalid data-options JSON:', optionsAttr);
            }
            
            var self = this;
            options.forEach(function(opt) {
                var option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.label || opt.value;
                select.appendChild(option);
            });
            
            // Set current value
            select.value = this._getValueFromLabel(options, this.originalValue);
            
            return select;
        },

        /**
         * Get value from label for select options
         * @param {Array} options - Options array
         * @param {string} label - Current display label
         * @returns {string} value
         */
        _getValueFromLabel: function(options, label) {
            for (var i = 0; i < options.length; i++) {
                if (options[i].label === label || options[i].value === label) {
                    return options[i].value;
                }
            }
            return label;
        },

        /**
         * Get label from value for select options
         * @param {string} value - Selected value
         * @returns {string} label
         */
        _getLabelFromValue: function(value) {
            var optionsAttr = this.el.getAttribute('data-options');
            var options = [];
            
            try {
                options = JSON.parse(optionsAttr) || [];
            } catch (e) {
                return value;
            }
            
            for (var i = 0; i < options.length; i++) {
                if (options[i].value === value) {
                    return options[i].label || options[i].value;
                }
            }
            return value;
        },

        /**
         * Create textarea
         * @returns {HTMLTextAreaElement}
         */
        _createTextarea: function() {
            var textarea = document.createElement('textarea');
            textarea.className = 'inline-edit-input inline-edit-textarea';
            textarea.value = this.originalValue;
            textarea.rows = 3;
            textarea.placeholder = this.el.getAttribute('data-placeholder') || '';
            
            return textarea;
        },

        /**
         * Create date input
         * @returns {HTMLInputElement}
         */
        _createDateInput: function() {
            var input = document.createElement('input');
            input.type = 'date';
            input.className = 'inline-edit-input';
            input.value = this.originalValue;
            
            var min = this.el.getAttribute('data-min');
            var max = this.el.getAttribute('data-max');
            
            if (min) input.min = min;
            if (max) input.max = max;
            
            return input;
        },

        /**
         * Bind events to the input element
         */
        _bindInputEvents: function() {
            var self = this;
            var wrapper = D.wrap(this.input);
            
            // Save on blur
            wrapper.on('blur', function() {
                // Small delay to allow click events to fire first
                setTimeout(function() {
                    if (self.isEditing && !self.isSaving) {
                        self.save();
                    }
                }, 150);
            });
            
            // Keyboard handling
            wrapper.on('keydown', function(e) {
                switch (e.key) {
                    case 'Enter':
                        // For textarea, Shift+Enter adds newline
                        if (self.type === 'textarea' && e.shiftKey) {
                            return;
                        }
                        e.preventDefault();
                        self.save();
                        break;
                        
                    case 'Escape':
                        e.preventDefault();
                        self.cancelEdit();
                        break;
                }
            });
        },

        /**
         * Get the current input value
         * @returns {string}
         */
        _getInputValue: function() {
            if (!this.input) return this.originalValue;
            return this.input.value;
        },

        /**
         * Get the display value (for selects, this is the label)
         * @returns {string}
         */
        _getDisplayValue: function() {
            var value = this._getInputValue();
            
            if (this.type === 'select') {
                return this._getLabelFromValue(value);
            }
            
            return value;
        },

        /**
         * Restore the display element with a value
         * @param {string} value - Value to display
         */
        _restoreDisplay: function(value) {
            if (this.input && this.input.parentNode) {
                this.input.parentNode.removeChild(this.input);
            }
            this.input = null;
            
            // Show placeholder if value is empty to maintain clickable area
            if (!value || !value.trim()) {
                var placeholder = this.el.getAttribute('data-placeholder') || 'Click to edit';
                this.el.textContent = '';
                this.el.setAttribute('data-empty', 'true');
                // Use Funky.Dom for XSS-safe placeholder
                D.wrap(this.el).empty().child(
                    D.span().classAdd('inline-edit-placeholder').text(placeholder)
                );
            } else {
                this.el.removeAttribute('data-empty');
                this.el.textContent = value;
            }
            
            this.el.style.display = '';
            this.el.focus();
        },

        /**
         * Enable or disable editing
         * @param {boolean} enabled - Whether editing is enabled
         */
        setEnabled: function(enabled) {
            var wrapper = D.wrap(this.el);
            
            if (enabled) {
                wrapper.classRemove('disabled');
                this.el.removeAttribute('aria-disabled');
                this.el.setAttribute('tabindex', '0');
            } else {
                wrapper.classAdd('disabled');
                this.el.setAttribute('aria-disabled', 'true');
                this.el.setAttribute('tabindex', '-1');
                
                // Cancel edit if currently editing
                if (this.isEditing) {
                    this.cancelEdit();
                }
            }
        },

        /**
         * Check if editing is enabled
         * @returns {boolean}
         */
        isEnabled: function() {
            return !D.one(this.el).classHas('disabled');
        },

        // ─────────────────────────────────────────────────────────────
        // LiveBinding Integration
        // ─────────────────────────────────────────────────────────────

        /**
         * Bind this InlineEdit to a LiveBinding data source
         * @param {Object} options - LiveBinding options
         * @param {string} options.source - Data source type ('api', 'event', 'state', 'websocket')
         * @param {string} [options.url] - API URL for 'api' source
         * @param {string} [options.event] - Event name for 'event' source
         * @param {string} [options.channel] - WebSocket channel for 'websocket' source
         * @param {string} [options.valuePath] - Path to value in data (e.g., 'client.name')
         * @param {string} [options.permissionPath] - Path to permission (e.g., 'permissions.canEdit')
         * @returns {InlineEdit} this for chaining
         */
        bindLive: function(options) {
            var self = this;
            
            if (!global.Funky.LiveBinding) {
                console.warn('[InlineEdit] LiveBinding not available');
                return this;
            }
            
            this._liveOptions = options;
            
            // Create hidden container for LiveBinding
            var container = D.create('span')
                .classAdd('inline-edit-live-state')
                .attr('data-inline-edit-live', this.entity + '-' + this.id + '-' + this.field)
                .css({ display: 'none' })
                .appendTo(this.el.parentNode)
                .el;
            
            this._liveContainer = container;
            
            // Bind with LiveBinding
            this._liveBinding = global.Funky.LiveBinding.bind(container, {
                source: options.source,
                url: options.url,
                event: options.event,
                channel: options.channel,
                transform: function(data) {
                    self._onLiveData(data, options);
                    return data;
                }
            });
            
            return this;
        },

        /**
         * Handle incoming live data
         * @param {Object} data - Data from LiveBinding
         * @param {Object} options - Bind options with paths
         */
        _onLiveData: function(data, options) {
            var self = this;
            
            if (!data || typeof data !== 'object') return;
            
            // Extract value using path
            if (options.valuePath) {
                var newValue = this._getValueByPath(data, options.valuePath);
                
                if (newValue !== undefined && String(newValue) !== this._lastKnownValue) {
                    this._handleRemoteUpdate(String(newValue));
                }
            }
            
            // Extract permission using path
            if (options.permissionPath) {
                var canEdit = this._getValueByPath(data, options.permissionPath);
                
                if (typeof canEdit === 'boolean') {
                    this.setEnabled(canEdit);
                }
            }
        },

        /**
         * Get value from object using dot-notation path
         * @param {Object} obj - Data object
         * @param {string} path - Dot-notation path (e.g., 'client.name')
         * @returns {*} Value at path
         */
        _getValueByPath: function(obj, path) {
            var parts = path.split('.');
            var value = obj;
            
            for (var i = 0; i < parts.length; i++) {
                if (value === null || value === undefined) return undefined;
                value = value[parts[i]];
            }
            
            return value;
        },

        /**
         * Handle a remote update to the value
         * @param {string} newValue - New value from remote source
         */
        _handleRemoteUpdate: function(newValue) {
            var self = this;
            var displayValue = String(newValue);
            
            // If currently editing, warn about conflict
            if (this.isEditing) {
                this._showConflictWarning(displayValue);
                return;
            }
            
            // Update display
            var oldValue = this._lastKnownValue;
            this._lastKnownValue = displayValue;
            this.originalValue = displayValue;
            this.el.textContent = displayValue;
            
            // Show visual indicator of remote change
            var wrapper = D.wrap(this.el);
            wrapper.classAdd('inline-edit-remote-update');
            
            setTimeout(function() {
                wrapper.classRemove('inline-edit-remote-update');
            }, 1500);
            
            // Emit event
            E.emit(this.el, 'funky.inline-edit.remote-update', {
                entity: this.entity,
                id: this.id,
                field: this.field,
                oldValue: oldValue,
                newValue: displayValue
            });
        },

        /**
         * Show conflict warning when editing and remote update arrives
         * @param {string} remoteValue - The new remote value
         */
        _showConflictWarning: function(remoteValue) {
            var self = this;
            
            // Store remote value for potential use
            this._conflictValue = remoteValue;
            
            // Add conflict indicator
            D.wrap(this.el.parentNode).classAdd('inline-edit-conflict');
            
            // Emit conflict event
            E.emit(this.el, 'funky.inline-edit.conflict', {
                entity: this.entity,
                id: this.id,
                field: this.field,
                localValue: this._getInputValue(),
                remoteValue: remoteValue
            });
            
            // Toast with options
            if (Funky.Toast) {
                Funky.Toast.show({
                    message: 'This field was updated by another user',
                    type: 'warning',
                    duration: 10000,
                    actions: [
                        {
                            label: 'Keep mine',
                            callback: function() {
                                self._conflictValue = null;
                                D.wrap(self.el.parentNode).classRemove('inline-edit-conflict');
                            }
                        },
                        {
                            label: 'Use theirs',
                            callback: function() {
                                self.cancelEdit();
                                self._handleRemoteUpdate(self._conflictValue);
                                self._conflictValue = null;
                            }
                        }
                    ]
                });
            }
        },

        /**
         * Subscribe to WebSocket updates for this field
         * @param {string} channel - WebSocket channel (e.g., 'client:123')
         * @returns {InlineEdit} this for chaining
         */
        subscribeWebSocket: function(channel) {
            var self = this;

            if (!Funky.WebSocket) {
                console.warn('[InlineEdit] WebSocket not available');
                return this;
            }

            this._wsChannel = channel;

            // Subscribe returns an unsubscribe function
            this._wsUnsubscribe = Funky.WebSocket.subscribe(channel, function(data) {
                // Check if this update affects our field
                if (data.field === self.field || data[self.field] !== undefined) {
                    var newValue = data.field === self.field ? data.value : data[self.field];

                    if (String(newValue) !== self._lastKnownValue) {
                        self._handleRemoteUpdate(String(newValue));
                    }
                }
            });

            return this;
        },

        /**
         * Unsubscribe from WebSocket updates
         */
        unsubscribeWebSocket: function() {
            if (this._wsUnsubscribe) {
                this._wsUnsubscribe();
                this._wsUnsubscribe = null;
            }
            this._wsChannel = null;
        },

        /**
         * Destroy instance
         */
        destroy: function() {
            if (this.isEditing) {
                this.cancelEdit();
            }

            // Clean up presence
            removePresenceListeners(this);
            stopEditingPresence(this);

            // Clean up LiveBinding
            if (this._liveBinding && this._liveBinding.destroy) {
                this._liveBinding.destroy();
            }
            if (this._liveContainer && this._liveContainer.parentNode) {
                this._liveContainer.parentNode.removeChild(this._liveContainer);
            }

            // Unsubscribe WebSocket
            this.unsubscribeWebSocket();

            this.el._inlineEdit = null;
            this.el = null;
        }
    };

    /**
     * Initialize all inline edit elements on page
     */
    function init() {
        D.all(SELECTOR).each(function(wrapper) {
            var el = wrapper.el;
            if (el._inlineEdit) return;
            
            var instance = new InlineEdit(el);
            el._inlineEdit = instance;
            instances.push(instance);
        });
    }

    /**
     * Get InlineEdit instance for element
     * @param {HTMLElement|string} el - Element or selector
     * @returns {InlineEdit|null}
     */
    function getInstance(el) {
        if (typeof el === 'string') {
            var wrapper = D.one(el);
            el = wrapper ? wrapper.el : null;
        }
        return el && el._inlineEdit ? el._inlineEdit : null;
    }

    /**
     * Destroy all instances
     */
    function destroyAll() {
        instances.forEach(function(instance) {
            instance.destroy();
        });
        instances = [];
    }

    // Auto-init on DOMContentLoaded and SPA navigation
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    document.addEventListener('funky.spa.pageload', init);

    /**
     * Enable presence tracking for InlineEdit
     * @param {Object} options - Configuration options
     * @param {boolean} options.showOtherEditors - Show indicator when others are editing (default: true)
     * @param {boolean} options.conflictWarning - Warn when someone else is editing (default: true)
     */
    function enablePresence(options) {
        if (!Funky.Presence) {
            console.warn('[InlineEdit] Funky.Presence not available');
            return;
        }

        options = options || {};
        _presenceEnabled = true;
        _presenceConfig = {
            showOtherEditors: options.showOtherEditors !== false,
            conflictWarning: options.conflictWarning !== false
        };

        console.log('[InlineEdit] Presence tracking enabled');
    }

    /**
     * Disable presence tracking for InlineEdit
     */
    function disablePresence() {
        _presenceEnabled = false;

        // Leave all editing channels
        var fields = Object.keys(_editingChannels);
        for (var i = 0; i < fields.length; i++) {
            var channel = _editingChannels[fields[i]];
            if (Funky.Presence) {
                Funky.Presence.leave(channel);
            }
        }
        _editingChannels = {};

        console.log('[InlineEdit] Presence tracking disabled');
    }

    /**
     * Check if presence tracking is enabled
     * @returns {boolean}
     */
    function isPresenceEnabled() {
        return _presenceEnabled;
    }

    // Register component
    Funky.register('InlineEdit', {
        init: init,
        getInstance: getInstance,
        destroyAll: destroyAll,
        enablePresence: enablePresence,
        disablePresence: disablePresence,
        isPresenceEnabled: isPresenceEnabled
    });

})(window);

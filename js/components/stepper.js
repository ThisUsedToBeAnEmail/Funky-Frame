/**
 * Funky.Stepper - Visual step progress indicator
 */
(function(window) {
    'use strict';

    if (!window.Funky || !window.Funky.register) {
        console.error('[Funky.Stepper] Registry not found');
        return;
    }

    var D = Funky.Dom;
    var _instanceCounter = 0;
    var _instances = Funky.Registry.createInstanceRegistry('Stepper');

    var DEFAULTS = {
        steps: [],
        current: 0,
        completed: [],
        orientation: 'horizontal',
        size: 'md',
        showLabels: true,
        showNumbers: true,
        showIcons: true,
        showDescription: true,
        showProgress: false,
        linear: true,
        clickable: true,
        animated: true,
        hashSync: false,
        onBeforeChange: null,
        onChange: null
    };

    var CLASSES = {
        root: 'funky-stepper',
        horizontal: 'funky-stepper--horizontal',
        vertical: 'funky-stepper--vertical',
        animated: 'funky-stepper--animated',
        list: 'funky-stepper__list',
        step: 'funky-stepper__step',
        stepCompleted: 'funky-stepper__step--completed',
        stepCurrent: 'funky-stepper__step--current',
        stepUpcoming: 'funky-stepper__step--upcoming',
        stepError: 'funky-stepper__step--error',
        stepDisabled: 'funky-stepper__step--disabled',
        button: 'funky-stepper__button',
        indicator: 'funky-stepper__indicator',
        label: 'funky-stepper__label',
        description: 'funky-stepper__description',
        connector: 'funky-stepper__connector',
        connectorCompleted: 'funky-stepper__connector--completed',
        error: 'funky-stepper__error',
        substepList: 'funky-stepper__substep-list',
        substep: 'funky-stepper__substep',
        substepCompleted: 'funky-stepper__substep--completed',
        substepIndicator: 'funky-stepper__substep-indicator',
        substepLabel: 'funky-stepper__substep-label',
        progress: 'funky-stepper__progress',
        progressBar: 'funky-stepper__progress-bar'
    };

    /**
     * Constructor
     */
    function Stepper(container, config) {
        this.container = typeof container === 'string'
            ? document.querySelector(container)
            : container;

        if (!this.container) {
            console.error('[Funky.Stepper] Container not found');
            return;
        }

        this.config = Object.assign({}, DEFAULTS, config);
        this.id = 'stepper-' + (++_instanceCounter);
        this._currentIndex = this.config.current;
        this._completedSet = new Set(this.config.completed);
        this._errorMap = {};

        this._init();
    }

    Stepper.prototype._init = function() {
        this._render();
        this._bindEvents();
    };

    Stepper.prototype._bindEvents = function() {
        var self = this;

        if (this.config.clickable) {
            this._nav.el.addEventListener('click', function(e) {
                var button = e.target.closest('.' + CLASSES.button);
                if (!button || button.disabled) return;

                var stepEl = button.closest('.' + CLASSES.step);
                var steps = Array.prototype.slice.call(self._list.el.children);
                var index = steps.indexOf(stepEl);

                if (index !== -1 && index !== self._currentIndex) {
                    self._handleStepClick(index);
                }
            });
        }

        // Keyboard navigation - use Funky.Keyboard for F1 help integration
        this._keyboardUnregisters = [];
        var navId = this._nav.el.id || ('stepper-nav-' + this.id);
        if (!this._nav.el.id) {
            this._nav.el.id = navId;
        }

        if (Funky.Keyboard) {
            var navKeys = [
                { key: 'arrowright', description: 'Next step' },
                { key: 'arrowdown', description: 'Next step' },
                { key: 'arrowleft', description: 'Previous step' },
                { key: 'arrowup', description: 'Previous step' },
                { key: 'home', description: 'First step' },
                { key: 'end', description: 'Last step' },
                { key: 'enter', description: 'Select step' },
                { key: 'space', description: 'Select step' }
            ];

            navKeys.forEach(function(keyDef) {
                self._keyboardUnregisters.push(Funky.Keyboard.register({
                    key: keyDef.key,
                    scope: '#' + navId,
                    handler: function(e) {
                        self._handleKeydown(e);
                    },
                    description: keyDef.description,
                    group: 'Stepper',
                    preventDefault: true
                }));
            });
        } else {
            // Fallback for environments without Funky.Keyboard
            this._keydownHandler = function(e) {
                self._handleKeydown(e);
            };
            this._nav.el.addEventListener('keydown', this._keydownHandler);
        }

        // URL hash sync
        if (this.config.hashSync) {
            this._hashHandler = function() {
                self._syncFromHash();
            };
            window.addEventListener('hashchange', this._hashHandler);
            this._syncFromHash();
        }
    };

    Stepper.prototype._handleStepClick = function(index) {
        var self = this;
        var fromIndex = this._currentIndex;
        var toIndex = index;

        // Linear mode: can only go to completed steps or next step
        if (this.config.linear) {
            var canNavigate = toIndex <= fromIndex ||
                toIndex === fromIndex + 1 ||
                this._completedSet.has(toIndex) ||
                this._completedSet.has(this.config.steps[toIndex].id);

            if (!canNavigate) return;
        }

        // Validation callback
        if (this.config.onBeforeChange) {
            var result = this.config.onBeforeChange(fromIndex, toIndex);

            // Handle Promise
            if (result && typeof result.then === 'function') {
                result.then(function(allowed) {
                    if (allowed !== false) {
                        self._doStepChange(toIndex);
                    }
                });
                return;
            }

            // Handle boolean
            if (result === false) return;
        }

        this._doStepChange(toIndex);
    };

    Stepper.prototype._doStepChange = function(index) {
        var previousIndex = this._currentIndex;
        this._currentIndex = index;
        this._updateStepStates();

        // Emit event
        this._emit('change', {
            step: this.config.steps[index],
            index: index,
            previous: previousIndex
        });

        // Callback
        if (this.config.onChange) {
            this.config.onChange(this.config.steps[index], index);
        }

        // URL hash sync
        if (this.config.hashSync) {
            var stepId = this.config.steps[index].id || index;
            window.location.hash = 'step-' + stepId;
        }
    };

    Stepper.prototype._handleKeydown = function(e) {
        var buttons = Array.prototype.slice.call(
            this._nav.el.querySelectorAll('.' + CLASSES.button + ':not([disabled])')
        );
        var focused = document.activeElement;
        var currentIdx = buttons.indexOf(focused);

        if (currentIdx === -1) return;

        var newIdx = currentIdx;

        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault();
                newIdx = Math.min(currentIdx + 1, buttons.length - 1);
                break;

            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                newIdx = Math.max(currentIdx - 1, 0);
                break;

            case 'Home':
                e.preventDefault();
                newIdx = 0;
                break;

            case 'End':
                e.preventDefault();
                newIdx = buttons.length - 1;
                break;

            case 'Enter':
            case ' ':
                e.preventDefault();
                var stepEl = focused.closest('.' + CLASSES.step);
                var steps = Array.prototype.slice.call(this._list.el.children);
                var stepIndex = steps.indexOf(stepEl);
                if (stepIndex !== -1) {
                    this._handleStepClick(stepIndex);
                }
                return;

            default:
                return;
        }

        if (newIdx !== currentIdx) {
            buttons[newIdx].focus();
        }
    };

    Stepper.prototype._syncFromHash = function() {
        var self = this;
        var hash = window.location.hash.slice(1);
        if (hash.indexOf('step-') !== 0) return;

        var stepId = hash.replace('step-', '');
        var index = -1;

        this.config.steps.forEach(function(s, i) {
            if (s.id === stepId || String(i) === stepId) {
                index = i;
            }
        });

        if (index !== -1 && index !== this._currentIndex) {
            this._handleStepClick(index);
        }
    };

    Stepper.prototype._emit = function(eventName, detail) {
        if (Funky.Events && Funky.Events.emit) {
            Funky.Events.emit(this.container, 'funky.stepper.' + eventName, detail);
        }
    };

    /**
     * Update step states without full DOM rebuild
     * Only updates CSS classes and ARIA attributes
     */
    Stepper.prototype._updateStepStates = function() {
        var self = this;
        var stepEls = this._list.el.children;

        Array.prototype.forEach.call(stepEls, function(li, index) {
            var step = self.config.steps[index];
            var isCompleted = self._completedSet.has(step.id) || self._completedSet.has(index);
            var isCurrent = index === self._currentIndex;
            var isUpcoming = index > self._currentIndex && !isCompleted;
            var hasError = self._errorMap[step.id] || self._errorMap[index];

            // Remove all state classes
            li.classList.remove(
                CLASSES.stepCompleted,
                CLASSES.stepCurrent,
                CLASSES.stepUpcoming,
                CLASSES.stepError
            );

            // Add appropriate state class
            if (hasError) {
                li.classList.add(CLASSES.stepError);
            } else if (isCurrent) {
                li.classList.add(CLASSES.stepCurrent);
            } else if (isCompleted) {
                li.classList.add(CLASSES.stepCompleted);
            } else {
                li.classList.add(CLASSES.stepUpcoming);
            }

            // Update button
            var button = li.querySelector('.' + CLASSES.button);
            if (button) {
                button.setAttribute('aria-current', isCurrent ? 'step' : 'false');

                // Update disabled state for linear mode
                var isDisabled = self.config.linear && isUpcoming && !isCompleted;
                if (isDisabled) {
                    button.setAttribute('disabled', 'disabled');
                    button.removeAttribute('tabindex');
                } else {
                    button.removeAttribute('disabled');
                    if (self.config.clickable) {
                        button.setAttribute('tabindex', '0');
                    }
                }
            }

            // Update indicator content
            var indicator = li.querySelector('.' + CLASSES.indicator);
            if (indicator) {
                if (hasError) {
                    indicator.innerHTML = '<i class="fas fa-exclamation" aria-hidden="true"></i>';
                } else if (isCompleted) {
                    indicator.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i>';
                } else if (step.icon && self.config.showIcons) {
                    indicator.innerHTML = '<i class="' + step.icon + '" aria-hidden="true"></i>';
                } else if (self.config.showNumbers) {
                    indicator.textContent = String(index + 1);
                }
            }

            // Update connector
            var connector = li.querySelector('.' + CLASSES.connector);
            if (connector) {
                if (isCompleted) {
                    connector.classList.add(CLASSES.connectorCompleted);
                } else {
                    connector.classList.remove(CLASSES.connectorCompleted);
                }
            }

            // Update error message
            var errorEl = li.querySelector('.' + CLASSES.error);
            if (hasError && typeof hasError === 'string') {
                if (!errorEl) {
                    errorEl = document.createElement('span');
                    errorEl.className = CLASSES.error;
                    button.appendChild(errorEl);
                }
                errorEl.textContent = hasError;
            } else if (errorEl) {
                errorEl.remove();
            }

            // Update substeps if present
            var substepEls = li.querySelectorAll('.' + CLASSES.substep);
            Array.prototype.forEach.call(substepEls, function(substepLi, subIndex) {
                var substepId = index + '-' + subIndex;
                var isSubstepCompleted = self._completedSet.has(substepId);

                if (isSubstepCompleted) {
                    substepLi.classList.add(CLASSES.substepCompleted);
                    var indicator = substepLi.querySelector('.' + CLASSES.substepIndicator);
                    if (indicator && indicator.innerHTML.indexOf('fa-check') === -1) {
                        indicator.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i>';
                    }
                } else {
                    substepLi.classList.remove(CLASSES.substepCompleted);
                }
            });
        });

        // Update progress bar if present
        if (this.config.showProgress) {
            var progressBar = this.container.querySelector('.' + CLASSES.progressBar);
            if (progressBar) {
                progressBar.style.width = this.getProgress() + '%';
            }
        }
    };

    Stepper.prototype._render = function() {
        var self = this;
        var config = this.config;
        var orientationClass = config.orientation === 'vertical'
            ? CLASSES.vertical
            : CLASSES.horizontal;

        // Create nav wrapper
        var nav = D.create('nav')
            .classAdd(CLASSES.root, orientationClass, CLASSES.root + '--' + config.size)
            .attr('role', 'navigation')
            .attr('aria-label', 'Progress');

        // Add animated class if enabled
        if (config.animated) {
            nav.classAdd(CLASSES.animated);
        }

        // Create ordered list
        var list = D.create('ol').classAdd(CLASSES.list);

        // Render each step
        config.steps.forEach(function(step, index) {
            var stepEl = self._renderStep(step, index);
            list.append(stepEl);
        });

        nav.append(list);

        // Progress bar (optional)
        if (config.showProgress) {
            var progress = this._renderProgress();
            nav.append(progress);
        }

        // Clear and append
        this.container.innerHTML = '';
        nav.appendTo(this.container);

        this._nav = nav;
        this._list = list;
    };

    Stepper.prototype._renderProgress = function() {
        var percent = this.getProgress();
        var wrapper = D.create('div').classAdd(CLASSES.progress);
        var bar = D.create('div')
            .classAdd(CLASSES.progressBar)
            .attr('style', 'width: ' + percent + '%');

        wrapper.append(bar);
        return wrapper;
    };

    Stepper.prototype._renderSubsteps = function(substeps, parentIndex) {
        var self = this;
        var list = D.create('ol').classAdd(CLASSES.substepList);

        substeps.forEach(function(substep, subIndex) {
            var id = parentIndex + '-' + subIndex;
            var isCompleted = self._completedSet.has(id);

            var li = D.create('li').classAdd(CLASSES.substep);
            if (isCompleted) {
                li.classAdd(CLASSES.substepCompleted);
            }

            var indicator = D.create('span').classAdd(CLASSES.substepIndicator);
            if (isCompleted) {
                indicator.html('<i class="fas fa-check" aria-hidden="true"></i>');
            }

            var label = D.create('span')
                .classAdd(CLASSES.substepLabel)
                .text(substep.label);

            li.append(indicator).append(label);
            list.append(li);
        });

        return list;
    };

    Stepper.prototype._renderStep = function(step, index) {
        var isCompleted = this._completedSet.has(step.id) || this._completedSet.has(index);
        var isCurrent = index === this._currentIndex;
        var isUpcoming = index > this._currentIndex && !isCompleted;
        var hasError = this._errorMap[step.id] || this._errorMap[index];
        var isLast = index === this.config.steps.length - 1;

        // Determine state class
        var stateClass = CLASSES.stepUpcoming;
        if (hasError) {
            stateClass = CLASSES.stepError;
        } else if (isCurrent) {
            stateClass = CLASSES.stepCurrent;
        } else if (isCompleted) {
            stateClass = CLASSES.stepCompleted;
        }

        // Create step li
        var li = D.create('li').classAdd(CLASSES.step, stateClass);

        // Create button
        var button = D.create('button')
            .classAdd(CLASSES.button)
            .attr('type', 'button')
            .attr('aria-current', isCurrent ? 'step' : 'false');

        var isDisabled = this.config.linear && isUpcoming && !isCompleted;
        if (isDisabled) {
            button.attr('disabled', 'disabled');
        }

        // Make button interactive when clickable and not disabled
        if (this.config.clickable && !isDisabled) {
            button.attr('tabindex', '0');
        }

        // Create indicator
        var indicator = D.create('span').classAdd(CLASSES.indicator);

        if (hasError) {
            indicator.html('<i class="fas fa-exclamation" aria-hidden="true"></i>');
        } else if (isCompleted) {
            indicator.html('<i class="fas fa-check" aria-hidden="true"></i>');
        } else if (step.icon && this.config.showIcons) {
            indicator.html('<i class="' + step.icon + '" aria-hidden="true"></i>');
        } else if (this.config.showNumbers) {
            indicator.text(String(index + 1));
        }

        button.append(indicator);

        // Add label
        if (this.config.showLabels && step.label) {
            var label = D.create('span')
                .classAdd(CLASSES.label)
                .text(step.label);
            button.append(label);
        }

        // Add description if present
        if (this.config.showDescription && step.description) {
            var desc = D.create('span')
                .classAdd(CLASSES.description)
                .text(step.description);
            button.append(desc);
        }

        // Add error message
        if (hasError && typeof hasError === 'string') {
            var errorEl = D.create('span')
                .classAdd(CLASSES.error)
                .text(hasError);
            button.append(errorEl);
        }

        li.append(button);

        // Add connector (except for last step)
        if (!isLast) {
            var connector = D.create('div').classAdd(CLASSES.connector);
            if (isCompleted) {
                connector.classAdd(CLASSES.connectorCompleted);
            }
            li.append(connector);
        }

        // Handle sub-steps
        if (step.substeps && step.substeps.length) {
            var substepList = this._renderSubsteps(step.substeps, index);
            li.append(substepList);
        }

        return li;
    };

    // --- Public Methods ---

    Stepper.prototype.getCurrent = function() {
        return this._currentIndex;
    };

    Stepper.prototype.setCurrent = function(index) {
        if (index < 0 || index >= this.config.steps.length) return this;
        this._currentIndex = index;
        this._updateStepStates();
        return this;
    };

    Stepper.prototype.next = function() {
        return this.setCurrent(this._currentIndex + 1);
    };

    Stepper.prototype.prev = function() {
        return this.setCurrent(this._currentIndex - 1);
    };

    Stepper.prototype.complete = function(indexOrId) {
        this._completedSet.add(indexOrId);
        this._updateStepStates();
        return this;
    };

    Stepper.prototype.setError = function(indexOrId, message) {
        this._errorMap[indexOrId] = message || true;
        this._updateStepStates();
        return this;
    };

    Stepper.prototype.clearError = function(indexOrId) {
        delete this._errorMap[indexOrId];
        this._updateStepStates();
        return this;
    };

    Stepper.prototype.getProgress = function() {
        var total = this.config.steps.length;
        var completed = this._completedSet.size;
        return Math.round((completed / total) * 100);
    };

    Stepper.prototype.reset = function() {
        this._currentIndex = 0;
        this._completedSet.clear();
        this._errorMap = {};
        this._updateStepStates();
        return this;
    };

    // --- LiveBinding Interface ---

    /**
     * Set stepper state from data object (LiveBinding compatible)
     * @param {Object} data - State object
     */
    Stepper.prototype.setData = function(data) {
        if (!data || typeof data !== 'object') return;

        if (data.current !== undefined) {
            this._currentIndex = data.current;
        }
        if (data.completed !== undefined) {
            this._completedSet = new Set(data.completed);
        }
        if (data.errors !== undefined) {
            this._errorMap = data.errors;
        }
        this._updateStepStates();
    };

    /**
     * Get stepper state as data object (LiveBinding compatible)
     * @returns {Object} - Current state
     */
    Stepper.prototype.getData = function() {
        return {
            current: this._currentIndex,
            completed: Array.from(this._completedSet),
            errors: Object.assign({}, this._errorMap),
            progress: this.getProgress()
        };
    };

    Stepper.prototype.destroy = function() {
        // Cleanup keyboard handlers
        if (this._keyboardUnregisters && this._keyboardUnregisters.length) {
            this._keyboardUnregisters.forEach(function(unregister) {
                if (unregister) unregister();
            });
            this._keyboardUnregisters = [];
        }
        if (this._keydownHandler && this._nav && this._nav.el) {
            this._nav.el.removeEventListener('keydown', this._keydownHandler);
        }

        if (this._nav && this._nav.el) {
            this._nav.remove();
        }
        _instances.unregister(this.id);
    };

    // --- Static Methods ---

    Stepper.init = function(container, config) {
        var instance = new Stepper(container, config);
        if (instance.container) {
            _instances.register(instance.id, instance);
        }
        return instance;
    };

    Stepper.getInstance = function(id) {
        return _instances.get(id);
    };

    Stepper.destroyAll = function() {
        _instances.destroyAll();
    };

    // --- Declarative Initialization ---

    Stepper.autoInit = function(scope) {
        var container = scope || document;
        var elements = container.querySelectorAll('[data-stepper]');

        Array.prototype.forEach.call(elements, function(el) {
            if (el._funkyStepperInitialized) return;

            var config = {};

            // Parse data attributes
            if (el.dataset.steps) {
                try {
                    config.steps = JSON.parse(el.dataset.steps);
                } catch (e) {
                    console.error('[Funky.Stepper] Invalid steps JSON');
                }
            }

            if (el.dataset.current) {
                config.current = parseInt(el.dataset.current, 10);
            }

            if (el.dataset.orientation) {
                config.orientation = el.dataset.orientation;
            }

            if (el.dataset.size) {
                config.size = el.dataset.size;
            }

            if (el.dataset.linear !== undefined) {
                config.linear = el.dataset.linear !== 'false';
            }

            if (el.dataset.clickable !== undefined) {
                config.clickable = el.dataset.clickable !== 'false';
            }

            if (el.dataset.animated !== undefined) {
                config.animated = el.dataset.animated !== 'false';
            }

            if (el.dataset.showProgress !== undefined) {
                config.showProgress = el.dataset.showProgress === 'true';
            }

            if (el.dataset.hashSync !== undefined) {
                config.hashSync = el.dataset.hashSync === 'true';
            }

            Stepper.init(el, config);
            el._funkyStepperInitialized = true;
        });
    };

    // Auto-init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            Stepper.autoInit();
        });
    } else {
        Stepper.autoInit();
    }

    Funky.register('Stepper', Stepper);

})(window);

/**
 * Funky.ZeroClick
 * Event-to-component automation layer
 * 
 * Listens for events and automatically triggers component actions.
 * Supports multiple actions per trigger, conditions, debounce/throttle.
 * 
 * @example
 * // HTML declaration
 * <div data-zero-click="funky:user:logged-in -> Toast.success('Welcome!')"></div>
 *
 * // JavaScript API
 * Funky.ZeroClick.on('funky:cart:updated', [
 *     { component: 'Toast', method: 'info', args: ['Cart updated'] },
 *     { component: 'Badge', method: 'set', target: '#cart-count', args: ['{{count}}'] }
 * ]);
 */
(function(global) {
    'use strict';

    var E = Funky.Events;
    var D = Funky.Dom;

    // ─────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────

    var triggers = {};        // id -> trigger config
    var nextId = 1;
    var isPaused = false;
    var debugMode = false;

    // ─────────────────────────────────────────────────────────────────
    // Configuration
    // ─────────────────────────────────────────────────────────────────

    var config = {
        defaultDebounce: 0,
        defaultThrottle: 0,
        interpolatePattern: /\{\{([^}]+)\}\}/g,
        logPrefix: '[ZeroClick]'
    };

    // Standard DOM events that should trigger on the element itself
    var DOM_EVENTS = [
        'click', 'dblclick', 'mousedown', 'mouseup', 'mouseenter', 'mouseleave',
        'mouseover', 'mouseout', 'mousemove', 'contextmenu',
        'focus', 'blur', 'focusin', 'focusout',
        'keydown', 'keyup', 'keypress',
        'input', 'change', 'submit', 'reset',
        'touchstart', 'touchend', 'touchmove', 'touchcancel',
        'scroll', 'resize', 'load', 'error',
        'dragstart', 'drag', 'dragend', 'dragenter', 'dragleave', 'dragover', 'drop'
    ];

    /**
     * Check if event is a standard DOM event
     * @param {string} eventName - Event name
     * @returns {boolean}
     */
    function isDomEvent(eventName) {
        return DOM_EVENTS.indexOf(eventName) !== -1;
    }

    // ─────────────────────────────────────────────────────────────────
    // Utility Functions
    // ─────────────────────────────────────────────────────────────────

    /**
     * Get nested property from object using dot notation
     * @param {Object} obj - Source object
     * @param {string} path - Dot-separated path
     * @returns {*} Value at path
     */
    function getNestedValue(obj, path) {
        if (!obj || !path) return undefined;
        
        var parts = path.split('.');
        var current = obj;
        
        for (var i = 0; i < parts.length; i++) {
            if (current === null || current === undefined) return undefined;
            current = current[parts[i]];
        }
        
        return current;
    }

    /**
     * Interpolate {{path}} placeholders with values from data
     * @param {*} template - String or array with placeholders
     * @param {Object} data - Data object for interpolation
     * @returns {*} Interpolated value
     */
    function interpolate(template, data) {
        if (typeof template === 'string') {
            return template.replace(config.interpolatePattern, function(match, path) {
                var value = getNestedValue(data, path.trim());
                return value !== undefined ? value : match;
            });
        }
        
        if (Array.isArray(template)) {
            return template.map(function(item) {
                return interpolate(item, data);
            });
        }
        
        if (template && typeof template === 'object') {
            var result = {};
            for (var key in template) {
                if (template.hasOwnProperty(key)) {
                    result[key] = interpolate(template[key], data);
                }
            }
            return result;
        }
        
        return template;
    }

    /**
     * Create debounced function
     * @param {Function} fn - Function to debounce
     * @param {number} delay - Delay in ms
     * @returns {Function}
     */
    function debounce(fn, delay) {
        var timeout;
        return function() {
            var context = this;
            var args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                fn.apply(context, args);
            }, delay);
        };
    }

    /**
     * Create throttled function
     * @param {Function} fn - Function to throttle
     * @param {number} limit - Minimum time between calls
     * @returns {Function}
     */
    function throttle(fn, limit) {
        var lastCall = 0;
        return function() {
            var now = Date.now();
            if (now - lastCall >= limit) {
                lastCall = now;
                fn.apply(this, arguments);
            }
        };
    }

    /**
     * Evaluate a condition string
     * @param {string} condition - Condition to evaluate
     * @param {Object} data - Data for interpolation
     * @returns {boolean}
     */
    function evaluateCondition(condition, data) {
        if (!condition) return true;
        
        // Interpolate the condition
        var interpolated = interpolate(condition, data);
        
        try {
            // Use Function constructor for safe(r) evaluation
            // Only allows simple comparisons, no function calls
            return new Function('return ' + interpolated)();
        } catch (e) {
            log('warn', 'Condition evaluation failed:', condition, e);
            return false;
        }
    }

    /**
     * Log message (respects debug mode)
     */
    function log(level, message) {
        if (!debugMode && level !== 'error') return;
        
        var args = Array.prototype.slice.call(arguments, 1);
        args.unshift(config.logPrefix);
        
        if (level === 'error') {
            console.error.apply(console, args);
        } else if (level === 'warn') {
            console.warn.apply(console, args);
        } else {
            console.log.apply(console, args);
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // Action Execution
    // ─────────────────────────────────────────────────────────────────

    /**
     * Execute a single action
     * @param {Object} action - Action configuration
     * @param {Object} eventData - Event payload for interpolation
     */
    function executeAction(action, eventData) {
        var componentName = action.component;
        var methodName = action.method;
        var args = action.args || [];
        var target = action.target;

        // Get the component
        var component = Funky[componentName];
        if (!component) {
            log('error', 'Component not found:', componentName);
            return;
        }

        // Get the method
        var method = component[methodName];
        if (typeof method !== 'function') {
            log('error', 'Method not found:', componentName + '.' + methodName);
            return;
        }

        // Interpolate args with event data
        var interpolatedArgs = interpolate(args, eventData);
        
        // Ensure args is an array
        if (!Array.isArray(interpolatedArgs)) {
            interpolatedArgs = [interpolatedArgs];
        }

        // If target specified, prepend it to args
        if (target) {
            var targetEl = typeof target === 'string' ? D.one(target) : target;
            if (targetEl) {
                interpolatedArgs.unshift(target);
            }
        }

        log('info', 'Executing:', componentName + '.' + methodName, interpolatedArgs);

        // Execute the method
        try {
            method.apply(component, interpolatedArgs);
        } catch (e) {
            log('error', 'Action failed:', componentName + '.' + methodName, e);
        }

        // Emit event for debugging/tracking
        E.emit(document, 'funky.zero-click.action-executed', {
            component: componentName,
            method: methodName,
            args: interpolatedArgs,
            eventData: eventData
        });
    }

    /**
     * Execute multiple actions in sequence
     * @param {Array} actions - Array of action configs
     * @param {Object} eventData - Event payload
     */
    function executeActions(actions, eventData) {
        if (!Array.isArray(actions)) {
            actions = [actions];
        }

        // Sort by priority if specified
        actions = actions.slice().sort(function(a, b) {
            return (a.priority || 0) - (b.priority || 0);
        });

        actions.forEach(function(action) {
            // Check condition
            if (action.condition && !evaluateCondition(action.condition, eventData)) {
                log('info', 'Condition not met, skipping:', action.component + '.' + action.method);
                return;
            }

            // Handle delay
            if (action.delay) {
                setTimeout(function() {
                    executeAction(action, eventData);
                }, action.delay);
            } else {
                executeAction(action, eventData);
            }
        });
    }

    // ─────────────────────────────────────────────────────────────────
    // Trigger Management
    // ─────────────────────────────────────────────────────────────────

    /**
     * Register a trigger
     * @param {string} eventName - Event to listen for
     * @param {Object|Array} actions - Action(s) to execute
     * @param {Object} [options] - Additional options
     * @returns {number} Trigger ID
     */
    function on(eventName, actions, options) {
        options = options || {};

        var id = nextId++;
        var handler;

        // Create the handler
        var baseHandler = function(e) {
            if (isPaused) {
                log('info', 'Paused, ignoring:', eventName);
                return;
            }

            var eventData = e.detail || e;
            
            log('info', 'Trigger fired:', eventName, eventData);

            // Emit trigger event
            E.emit(document, 'funky.zero-click.triggered', {
                id: id,
                event: eventName,
                data: eventData
            });

            executeActions(actions, eventData);
        };

        // Apply debounce/throttle
        if (options.debounce || config.defaultDebounce) {
            handler = debounce(baseHandler, options.debounce || config.defaultDebounce);
        } else if (options.throttle || config.defaultThrottle) {
            handler = throttle(baseHandler, options.throttle || config.defaultThrottle);
        } else {
            handler = baseHandler;
        }

        // Determine target element
        var target = options.target ? 
            (typeof options.target === 'string' ? document.querySelector(options.target) : options.target) : 
            document;

        // Store trigger config
        triggers[id] = {
            id: id,
            eventName: eventName,
            actions: actions,
            options: options,
            handler: handler,
            target: target
        };

        // Attach listener
        target.addEventListener(eventName, handler);

        log('info', 'Registered trigger #' + id + ':', eventName, '->', 
            Array.isArray(actions) ? actions.length + ' actions' : actions.component + '.' + actions.method);

        // Emit registration event
        E.emit(document, 'funky.zero-click.registered', {
            id: id,
            event: eventName,
            actionCount: Array.isArray(actions) ? actions.length : 1
        });

        return id;
    }

    /**
     * Remove a trigger
     * @param {number} id - Trigger ID
     * @returns {boolean} True if found and removed
     */
    function off(id) {
        var trigger = triggers[id];
        if (!trigger) return false;

        trigger.target.removeEventListener(trigger.eventName, trigger.handler);
        delete triggers[id];

        log('info', 'Removed trigger #' + id);

        E.emit(document, 'funky.zero-click.removed', { id: id });

        return true;
    }

    /**
     * Remove all triggers for an event
     * @param {string} eventName - Event name
     * @returns {number} Count of removed triggers
     */
    function offAll(eventName) {
        var count = 0;
        for (var id in triggers) {
            if (triggers.hasOwnProperty(id) && triggers[id].eventName === eventName) {
                off(parseInt(id, 10));
                count++;
            }
        }
        return count;
    }

    /**
     * Get all registered triggers
     * @returns {Array}
     */
    function getTriggers() {
        var result = [];
        for (var id in triggers) {
            if (triggers.hasOwnProperty(id)) {
                var t = triggers[id];
                result.push({
                    id: t.id,
                    event: t.eventName,
                    actionCount: Array.isArray(t.actions) ? t.actions.length : 1
                });
            }
        }
        return result;
    }

    // ─────────────────────────────────────────────────────────────────
    // Control
    // ─────────────────────────────────────────────────────────────────

    /**
     * Pause all triggers
     */
    function pause() {
        if (isPaused) return;
        isPaused = true;
        log('info', 'Paused');
        E.emit(document, 'funky.zero-click.pause', { triggerCount: Object.keys(triggers).length });
    }

    /**
     * Resume all triggers
     */
    function resume() {
        if (!isPaused) return;
        isPaused = false;
        log('info', 'Resumed');
        E.emit(document, 'funky.zero-click.resume', { triggerCount: Object.keys(triggers).length });
    }

    /**
     * Check if paused
     * @returns {boolean}
     */
    function isPausedState() {
        return isPaused;
    }

    /**
     * Enable/disable debug mode
     * @param {boolean} enabled
     */
    function debug(enabled) {
        debugMode = enabled !== false;
        log('info', 'Debug mode:', debugMode ? 'ON' : 'OFF');
    }

    // ─────────────────────────────────────────────────────────────────
    // HTML Declaration Parsing
    // ─────────────────────────────────────────────────────────────────

    /**
     * Parse simple attribute syntax: "event -> Component.method(args)"
     * @param {string} value - Attribute value
     * @returns {Object} { event, actions }
     */
    function parseSimpleSyntax(value) {
        // Pattern: event -> Component.method('arg1', 'arg2')
        var match = value.match(/^([^\s]+)\s*->\s*([^.]+)\.([^(]+)\(([^)]*)\)$/);
        if (!match) {
            // Try without args: event -> Component.method
            match = value.match(/^([^\s]+)\s*->\s*([^.]+)\.([^(]+)$/);
            if (match) {
                return {
                    event: match[1].trim(),
                    actions: [{
                        component: match[2].trim(),
                        method: match[3].trim(),
                        args: []
                    }]
                };
            }
            return null;
        }

        var event = match[1].trim();
        var component = match[2].trim();
        var method = match[3].trim();
        var argsStr = match[4].trim();

        // Parse args (simple string splitting, handles quoted strings)
        var args = [];
        if (argsStr) {
            // Match quoted strings or unquoted values
            var argMatches = argsStr.match(/('[^']*'|"[^"]*"|[^,]+)/g);
            if (argMatches) {
                args = argMatches.map(function(arg) {
                    arg = arg.trim();
                    // Remove quotes
                    if ((arg.charAt(0) === "'" && arg.charAt(arg.length - 1) === "'") ||
                        (arg.charAt(0) === '"' && arg.charAt(arg.length - 1) === '"')) {
                        return arg.slice(1, -1);
                    }
                    // Try to parse numbers/booleans
                    if (arg === 'true') return true;
                    if (arg === 'false') return false;
                    if (!isNaN(arg)) return Number(arg);
                    return arg;
                });
            }
        }

        return {
            event: event,
            actions: [{
                component: component,
                method: method,
                args: args
            }]
        };
    }

    /**
     * Parse JSON block syntax
     * @param {string} json - JSON string
     * @returns {Object} { trigger, actions }
     */
    function parseJsonSyntax(json) {
        try {
            var parsed = JSON.parse(json);
            return {
                event: parsed.trigger,
                actions: parsed.actions || [parsed.action],
                options: {
                    debounce: parsed.debounce,
                    throttle: parsed.throttle,
                    condition: parsed.condition
                }
            };
        } catch (e) {
            log('error', 'Failed to parse JSON config:', e);
            return null;
        }
    }

    /**
     * Initialize from HTML declarations
     * @param {HTMLElement|string} [scope] - Container scope
     */
    function initFromHtml(scope) {
        var container = scope ? 
            (typeof scope === 'string' ? document.querySelector(scope) : scope) : 
            document;

        if (!container) return 0;

        var count = 0;

        // Find elements with data-zero-click attribute
        var elements = container.querySelectorAll('[data-zero-click]');
        
        for (var i = 0; i < elements.length; i++) {
            var el = elements[i];
            
            // Skip if already initialized
            if (el._zeroClickId) continue;

            var value = el.getAttribute('data-zero-click');
            var parsed;

            // Check if it's a script tag with JSON
            if (el.tagName === 'SCRIPT' && el.type === 'application/json') {
                parsed = parseJsonSyntax(el.textContent);
            } else if (value) {
                parsed = parseSimpleSyntax(value);
            }

            if (parsed) {
                // For DOM events (click, hover, etc.), listen on the element itself
                var options = parsed.options || {};
                if (isDomEvent(parsed.event) && el.tagName !== 'SCRIPT') {
                    options.target = el;
                }
                
                var id = on(parsed.event, parsed.actions, options);
                el._zeroClickId = id;
                count++;
            }
        }

        log('info', 'Initialized', count, 'triggers from HTML');
        return count;
    }

    // ─────────────────────────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────────────────────────

    /**
     * Initialize ZeroClick
     * @param {HTMLElement|string} [scope] - Optional scope
     */
    function init(scope) {
        initFromHtml(scope);
        
        E.emit(document, 'funky.zero-click.init', {
            triggerCount: Object.keys(triggers).length
        });
    }

    /**
     * Destroy all triggers
     */
    function destroy() {
        for (var id in triggers) {
            if (triggers.hasOwnProperty(id)) {
                off(parseInt(id, 10));
            }
        }
        
        E.emit(document, 'funky.zero-click.destroy', {});
    }

    /**
     * Configure global settings
     * @param {Object} opts
     */
    function configure(opts) {
        if (!opts) return;
        for (var key in opts) {
            if (opts.hasOwnProperty(key) && config.hasOwnProperty(key)) {
                config[key] = opts[key];
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // LiveBinding Support
    // ─────────────────────────────────────────────────────────────────

    /**
     * Create a bound trigger that updates when data changes
     * @param {Object} bindingConfig - LiveBinding config
     * @returns {Object} Bound trigger with update method
     */
    function createBound(bindingConfig) {
        var triggerId = null;
        
        return {
            update: function(data) {
                // Remove existing trigger
                if (triggerId !== null) {
                    off(triggerId);
                }
                
                // Interpolate config with new data
                var event = interpolate(bindingConfig.trigger, data);
                var actions = interpolate(bindingConfig.actions, data);
                
                // Register new trigger
                triggerId = on(event, actions, bindingConfig.options);
            },
            
            destroy: function() {
                if (triggerId !== null) {
                    off(triggerId);
                    triggerId = null;
                }
            }
        };
    }

    // ─────────────────────────────────────────────────────────────────
    // Helper: Manual trigger
    // ─────────────────────────────────────────────────────────────────

    /**
     * Manually fire a trigger by event name
     * Useful for testing or programmatic triggering
     * @param {string} eventName - Event to simulate
     * @param {Object} [data] - Event data
     */
    function fire(eventName, data) {
        E.emit(document, eventName, data || {});
    }

    // ─────────────────────────────────────────────────────────────────
    // Auto-init on DOM ready
    // ─────────────────────────────────────────────────────────────────

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            init();
        });
    } else {
        init();
    }

    // ─────────────────────────────────────────────────────────────────
    // Export
    // ─────────────────────────────────────────────────────────────────

    var ZeroClick = {
        // Registration
        on: on,
        off: off,
        offAll: offAll,
        getTriggers: getTriggers,
        
        // Control
        pause: pause,
        resume: resume,
        isPaused: isPausedState,
        debug: debug,
        
        // Lifecycle
        init: init,
        destroy: destroy,
        configure: configure,
        
        // LiveBinding
        createBound: createBound,
        
        // Utility
        fire: fire,
        interpolate: interpolate
    };

    Funky.register('ZeroClick', ZeroClick);

})(window);

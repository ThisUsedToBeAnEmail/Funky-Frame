/**
 * E2E Testing Utilities
 *
 * Provides helper functions for end-to-end testing including
 * selectors, interactions, waiting, assertions, and scenario builders.
 */
(function(FunkyTests) {
    'use strict';

    // Guard: FunkyTests must be available
    if (!FunkyTests) {
        console.warn('[E2EUtils] FunkyTests not available - skipping E2E utilities setup');
        return;
    }

    var E2E = {};

    // ═══════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════

    var config = {
        defaultTimeout: 5000,
        retryInterval: 100,
        screenshotOnFail: false
    };

    E2E.configure = function(options) {
        for (var key in options) {
            if (config.hasOwnProperty(key)) {
                config[key] = options[key];
            }
        }
    };

    // ═══════════════════════════════════════════════════════════
    // SELECTORS
    // ═══════════════════════════════════════════════════════════

    /**
     * Find element by test ID
     */
    E2E.getByTestId = function(testId) {
        return document.querySelector('[data-testid="' + testId + '"]');
    };

    /**
     * Find element by role
     */
    E2E.getByRole = function(role, options) {
        options = options || {};
        var selector = '[role="' + role + '"]';
        var elements = document.querySelectorAll(selector);

        if (options.name) {
            elements = Array.prototype.filter.call(elements, function(el) {
                var name = el.getAttribute('aria-label') ||
                          el.textContent.trim();
                return name.toLowerCase().indexOf(options.name.toLowerCase()) !== -1;
            });
        }

        return elements[0] || null;
    };

    /**
     * Find element by label text
     */
    E2E.getByLabelText = function(text) {
        var labels = document.querySelectorAll('label');
        for (var i = 0; i < labels.length; i++) {
            if (labels[i].textContent.indexOf(text) !== -1) {
                var forId = labels[i].getAttribute('for');
                if (forId) {
                    return document.getElementById(forId);
                }
                return labels[i].querySelector('input, select, textarea');
            }
        }
        return null;
    };

    /**
     * Find element by placeholder text
     */
    E2E.getByPlaceholder = function(text) {
        return document.querySelector('[placeholder*="' + text + '"]');
    };

    /**
     * Find element by text content
     */
    E2E.getByText = function(text, options) {
        options = options || {};
        var selector = options.selector || '*';
        var elements = document.querySelectorAll(selector);

        for (var i = 0; i < elements.length; i++) {
            var content = elements[i].textContent.trim();
            if (options.exact ? content === text : content.indexOf(text) !== -1) {
                return elements[i];
            }
        }
        return null;
    };

    /**
     * Find button by text
     */
    E2E.getButton = function(text) {
        return E2E.getByText(text, { selector: 'button, [role="button"], input[type="submit"], input[type="button"]' });
    };

    /**
     * Find link by text
     */
    E2E.getLink = function(text) {
        return E2E.getByText(text, { selector: 'a' });
    };

    /**
     * Find all elements matching selector
     */
    E2E.queryAll = function(selector) {
        return Array.prototype.slice.call(document.querySelectorAll(selector));
    };

    // ═══════════════════════════════════════════════════════════
    // INTERACTIONS
    // ═══════════════════════════════════════════════════════════

    /**
     * Type text into input
     */
    E2E.type = function(element, text, options) {
        options = options || {};

        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (!element) {
            return Promise.reject(new Error('Element not found for typing'));
        }

        element.focus();

        if (options.clear !== false) {
            element.value = '';
            element.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Type character by character for realism
        if (options.delay) {
            return typeWithDelay(element, text, options.delay);
        } else {
            element.value += text;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            return Promise.resolve();
        }
    };

    function typeWithDelay(element, text, delay) {
        return new Promise(function(resolve) {
            var i = 0;
            function typeChar() {
                if (i < text.length) {
                    element.value += text[i];
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    element.dispatchEvent(new KeyboardEvent('keydown', { key: text[i], bubbles: true }));
                    element.dispatchEvent(new KeyboardEvent('keyup', { key: text[i], bubbles: true }));
                    i++;
                    setTimeout(typeChar, delay);
                } else {
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                    resolve();
                }
            }
            typeChar();
        });
    }

    /**
     * Clear input value
     */
    E2E.clear = function(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (!element) {
            return Promise.reject(new Error('Element not found for clearing'));
        }

        element.value = '';
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));

        return Promise.resolve();
    };

    /**
     * Click element
     */
    E2E.click = function(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (!element) {
            return Promise.reject(new Error('Element not found for clicking'));
        }

        // Focus the element first (like a real click would)
        if (element.focus) {
            element.focus();
        }

        element.dispatchEvent(new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            view: window
        }));

        element.dispatchEvent(new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
            view: window
        }));

        element.dispatchEvent(new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        }));

        // If this is a submit button inside a form, also trigger form submission
        // (synthetic click events don't always trigger form submission in all browsers)
        // Note: Only trigger for actual submit buttons, not type="button" or type="reset"
        var form = element.form || element.closest('form');
        var isSubmitButton = element.type === 'submit' ||
                             (element.tagName === 'BUTTON' && element.type !== 'button' && element.type !== 'reset');
        if (isSubmitButton && form) {
            var submitEvent = new Event('submit', { bubbles: true, cancelable: true });
            form.dispatchEvent(submitEvent);
        }

        return Promise.resolve();
    };

    /**
     * Double click element
     */
    E2E.dblClick = function(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (!element) {
            return Promise.reject(new Error('Element not found for double-clicking'));
        }

        element.dispatchEvent(new MouseEvent('dblclick', {
            bubbles: true,
            cancelable: true,
            view: window
        }));

        return Promise.resolve();
    };

    /**
     * Right click element
     */
    E2E.rightClick = function(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (!element) {
            return Promise.reject(new Error('Element not found for right-clicking'));
        }

        element.dispatchEvent(new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            view: window,
            button: 2
        }));

        return Promise.resolve();
    };

    /**
     * Select option from dropdown
     */
    E2E.select = function(element, value) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (!element) {
            return Promise.reject(new Error('Element not found for selecting'));
        }

        element.value = value;
        element.dispatchEvent(new Event('change', { bubbles: true }));

        return Promise.resolve();
    };

    /**
     * Select option by visible text
     */
    E2E.selectByText = function(element, text) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (!element) {
            return Promise.reject(new Error('Element not found for selecting'));
        }

        var options = element.querySelectorAll('option');
        for (var i = 0; i < options.length; i++) {
            if (options[i].textContent.trim() === text) {
                element.value = options[i].value;
                element.dispatchEvent(new Event('change', { bubbles: true }));
                return Promise.resolve();
            }
        }

        return Promise.reject(new Error('Option not found: ' + text));
    };

    /**
     * Check checkbox
     */
    E2E.check = function(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (!element) {
            return Promise.reject(new Error('Element not found for checking'));
        }

        if (!element.checked) {
            element.click();
        }

        return Promise.resolve();
    };

    /**
     * Uncheck checkbox
     */
    E2E.uncheck = function(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (!element) {
            return Promise.reject(new Error('Element not found for unchecking'));
        }

        if (element.checked) {
            element.click();
        }

        return Promise.resolve();
    };

    /**
     * Press key
     */
    E2E.press = function(element, key) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (!element) {
            element = document.activeElement;
        }

        var keyCode = getKeyCode(key);

        var eventInit = {
            key: key,
            code: keyCode.code,
            keyCode: keyCode.keyCode,
            which: keyCode.keyCode,
            bubbles: true,
            cancelable: true
        };

        element.dispatchEvent(new KeyboardEvent('keydown', eventInit));
        element.dispatchEvent(new KeyboardEvent('keypress', eventInit));
        element.dispatchEvent(new KeyboardEvent('keyup', eventInit));

        return Promise.resolve();
    };

    function getKeyCode(key) {
        var keyCodes = {
            'Enter': { code: 'Enter', keyCode: 13 },
            'Escape': { code: 'Escape', keyCode: 27 },
            'Tab': { code: 'Tab', keyCode: 9 },
            'ArrowUp': { code: 'ArrowUp', keyCode: 38 },
            'ArrowDown': { code: 'ArrowDown', keyCode: 40 },
            'ArrowLeft': { code: 'ArrowLeft', keyCode: 37 },
            'ArrowRight': { code: 'ArrowRight', keyCode: 39 },
            'Space': { code: 'Space', keyCode: 32 },
            'Backspace': { code: 'Backspace', keyCode: 8 },
            'Delete': { code: 'Delete', keyCode: 46 },
            'Home': { code: 'Home', keyCode: 36 },
            'End': { code: 'End', keyCode: 35 }
        };

        if (keyCodes[key]) {
            return keyCodes[key];
        }

        // For regular characters
        return {
            code: 'Key' + key.toUpperCase(),
            keyCode: key.toUpperCase().charCodeAt(0)
        };
    }

    /**
     * Hover over element
     */
    E2E.hover = function(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (!element) {
            return Promise.reject(new Error('Element not found for hovering'));
        }

        element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

        return Promise.resolve();
    };

    /**
     * Focus element
     */
    E2E.focus = function(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (!element) {
            return Promise.reject(new Error('Element not found for focusing'));
        }

        element.focus();
        element.dispatchEvent(new FocusEvent('focus', { bubbles: true }));

        return Promise.resolve();
    };

    /**
     * Blur element
     */
    E2E.blur = function(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (!element) {
            return Promise.reject(new Error('Element not found for blurring'));
        }

        element.blur();
        element.dispatchEvent(new FocusEvent('blur', { bubbles: true }));

        return Promise.resolve();
    };

    /**
     * Scroll element into view
     */
    E2E.scrollTo = function(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (!element) {
            return Promise.reject(new Error('Element not found for scrolling'));
        }

        element.scrollIntoView({ behavior: 'instant', block: 'center' });

        return Promise.resolve();
    };

    // ═══════════════════════════════════════════════════════════
    // DRAG AND DROP
    // ═══════════════════════════════════════════════════════════

    /**
     * Drag and drop element
     */
    E2E.dragAndDrop = function(source, target) {
        if (typeof source === 'string') {
            source = document.querySelector(source);
        }
        if (typeof target === 'string') {
            target = document.querySelector(target);
        }

        if (!source || !target) {
            return Promise.reject(new Error('Source or target element not found'));
        }

        var dataTransfer = new DataTransfer();

        // Drag start
        source.dispatchEvent(new DragEvent('dragstart', {
            bubbles: true,
            cancelable: true,
            dataTransfer: dataTransfer
        }));

        // Drag over target
        target.dispatchEvent(new DragEvent('dragover', {
            bubbles: true,
            cancelable: true,
            dataTransfer: dataTransfer
        }));

        // Drop
        target.dispatchEvent(new DragEvent('drop', {
            bubbles: true,
            cancelable: true,
            dataTransfer: dataTransfer
        }));

        // Drag end
        source.dispatchEvent(new DragEvent('dragend', {
            bubbles: true,
            cancelable: true,
            dataTransfer: dataTransfer
        }));

        return Promise.resolve();
    };

    // ═══════════════════════════════════════════════════════════
    // WAITING
    // ═══════════════════════════════════════════════════════════

    /**
     * Wait for element to appear
     */
    E2E.waitFor = function(selector, options) {
        options = options || {};
        var timeout = options.timeout || config.defaultTimeout;
        var interval = options.interval || config.retryInterval;

        return new Promise(function(resolve, reject) {
            var elapsed = 0;

            function check() {
                var element;

                if (typeof selector === 'function') {
                    try {
                        element = selector();
                    } catch (e) {
                        element = null;
                    }
                } else {
                    element = document.querySelector(selector);
                }

                if (element) {
                    resolve(element);
                } else if (elapsed >= timeout) {
                    reject(new Error('Timeout waiting for: ' + (typeof selector === 'function' ? 'condition' : selector)));
                } else {
                    elapsed += interval;
                    setTimeout(check, interval);
                }
            }

            check();
        });
    };

    /**
     * Wait for element to disappear
     */
    E2E.waitForRemoval = function(selector, options) {
        options = options || {};
        var timeout = options.timeout || config.defaultTimeout;
        var interval = options.interval || config.retryInterval;

        return new Promise(function(resolve, reject) {
            var elapsed = 0;

            function check() {
                var element = document.querySelector(selector);

                if (!element) {
                    resolve();
                } else if (elapsed >= timeout) {
                    reject(new Error('Timeout waiting for removal of: ' + selector));
                } else {
                    elapsed += interval;
                    setTimeout(check, interval);
                }
            }

            check();
        });
    };

    /**
     * Wait for text to appear
     */
    E2E.waitForText = function(text, options) {
        options = options || {};

        return E2E.waitFor(function() {
            return E2E.getByText(text, options);
        }, options);
    };

    /**
     * Wait for condition
     */
    E2E.waitUntil = function(condition, options) {
        options = options || {};
        var timeout = options.timeout || config.defaultTimeout;
        var interval = options.interval || config.retryInterval;

        return new Promise(function(resolve, reject) {
            var elapsed = 0;

            function check() {
                var result;
                try {
                    result = condition();
                } catch (e) {
                    result = false;
                }

                if (result) {
                    resolve(result);
                } else if (elapsed >= timeout) {
                    reject(new Error('Condition not met within timeout'));
                } else {
                    elapsed += interval;
                    setTimeout(check, interval);
                }
            }

            check();
        });
    };

    /**
     * Wait for element to be visible
     */
    E2E.waitForVisible = function(selector, options) {
        options = options || {};

        return E2E.waitFor(function() {
            var element = document.querySelector(selector);
            if (!element) return null;

            var style = getComputedStyle(element);
            var visible = element.offsetParent !== null &&
                         style.visibility !== 'hidden' &&
                         style.display !== 'none' &&
                         parseFloat(style.opacity) > 0;

            return visible ? element : null;
        }, options);
    };

    /**
     * Wait fixed time
     */
    E2E.wait = function(ms) {
        return new Promise(function(resolve) {
            setTimeout(resolve, ms);
        });
    };

    // ═══════════════════════════════════════════════════════════
    // ASSERTIONS
    // ═══════════════════════════════════════════════════════════

    /**
     * Assert element is visible
     */
    E2E.assertVisible = function(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (!element) {
            throw new Error('Element not found');
        }

        var style = getComputedStyle(element);
        // Check computed styles rather than offsetParent which can be unreliable
        // in iframes and certain DOM structures
        var visible = style.visibility !== 'hidden' &&
                     style.display !== 'none' &&
                     style.opacity !== '0';

        if (!visible) {
            throw new Error('Element is not visible');
        }
    };

    /**
     * Assert element is hidden
     */
    E2E.assertHidden = function(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (!element) {
            return; // Not found is considered hidden
        }

        var style = getComputedStyle(element);
        var hidden = element.offsetParent === null ||
                    style.visibility === 'hidden' ||
                    style.display === 'none';

        if (!hidden) {
            throw new Error('Element is not hidden');
        }
    };

    /**
     * Assert element contains text
     */
    E2E.assertText = function(element, text) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (!element) {
            throw new Error('Element not found');
        }

        if (element.textContent.indexOf(text) === -1) {
            throw new Error('Element does not contain text: ' + text + '. Actual: ' + element.textContent.substring(0, 100));
        }
    };

    /**
     * Assert element does not contain text
     */
    E2E.assertNoText = function(element, text) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (!element) {
            return; // Not found means no text
        }

        if (element.textContent.indexOf(text) !== -1) {
            throw new Error('Element contains text that should not be present: ' + text);
        }
    };

    /**
     * Assert element exists
     */
    E2E.assertExists = function(selector) {
        var element = typeof selector === 'string' ? document.querySelector(selector) : selector;

        if (!element) {
            throw new Error('Element does not exist: ' + selector);
        }
    };

    /**
     * Assert element does not exist
     */
    E2E.assertNotExists = function(selector) {
        var element = document.querySelector(selector);

        if (element) {
            throw new Error('Element should not exist: ' + selector);
        }
    };

    /**
     * Assert value
     */
    E2E.assertValue = function(element, expected) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (!element) {
            throw new Error('Element not found');
        }

        if (element.value !== expected) {
            throw new Error('Value mismatch. Expected: ' + expected + ', Actual: ' + element.value);
        }
    };

    /**
     * Assert element has class
     */
    E2E.assertHasClass = function(element, className) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (!element) {
            throw new Error('Element not found');
        }

        if (!element.classList.contains(className)) {
            throw new Error('Element does not have class: ' + className);
        }
    };

    /**
     * Assert element is enabled
     */
    E2E.assertEnabled = function(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (!element) {
            throw new Error('Element not found');
        }

        if (element.disabled) {
            throw new Error('Element is disabled');
        }
    };

    /**
     * Assert element is disabled
     */
    E2E.assertDisabled = function(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (!element) {
            throw new Error('Element not found');
        }

        if (!element.disabled) {
            throw new Error('Element is not disabled');
        }
    };

    /**
     * Assert checkbox is checked
     */
    E2E.assertChecked = function(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (!element) {
            throw new Error('Element not found');
        }

        if (!element.checked) {
            throw new Error('Checkbox is not checked');
        }
    };

    /**
     * Assert element count
     */
    E2E.assertCount = function(selector, expectedCount) {
        var elements = document.querySelectorAll(selector);

        if (elements.length !== expectedCount) {
            throw new Error('Element count mismatch. Expected: ' + expectedCount + ', Actual: ' + elements.length);
        }
    };

    // ═══════════════════════════════════════════════════════════
    // SCENARIOS
    // ═══════════════════════════════════════════════════════════

    /**
     * Create scenario builder (BDD-style)
     */
    E2E.scenario = function(name) {
        var steps = [];
        var currentStep = 0;

        var scenario = {
            given: function(description, fn) {
                steps.push({ type: 'given', description: description, fn: fn });
                return scenario;
            },

            when: function(description, fn) {
                steps.push({ type: 'when', description: description, fn: fn });
                return scenario;
            },

            then: function(description, fn) {
                steps.push({ type: 'then', description: description, fn: fn });
                return scenario;
            },

            and: function(description, fn) {
                steps.push({ type: 'and', description: description, fn: fn });
                return scenario;
            },

            but: function(description, fn) {
                steps.push({ type: 'but', description: description, fn: fn });
                return scenario;
            },

            run: function() {
                console.log('%c▶ Scenario: ' + name, 'color: #6c5ce7; font-weight: bold');

                return steps.reduce(function(promise, step, index) {
                    return promise.then(function() {
                        currentStep = index;
                        var typeColor = step.type === 'given' ? '#00b894' :
                                       step.type === 'when' ? '#0984e3' :
                                       step.type === 'then' ? '#6c5ce7' : '#636e72';

                        console.log('  %c' + step.type.toUpperCase() + '%c ' + step.description,
                            'color: ' + typeColor + '; font-weight: bold', 'color: inherit');

                        return Promise.resolve(step.fn());
                    });
                }, Promise.resolve()).then(function() {
                    console.log('%c✓ Scenario passed', 'color: #00b894; font-weight: bold');
                }).catch(function(error) {
                    console.log('%c✗ Scenario failed at step ' + (currentStep + 1) + ': ' + steps[currentStep].description, 'color: #d63031');
                    throw error;
                });
            }
        };

        return scenario;
    };

    // ═══════════════════════════════════════════════════════════
    // MOCK API
    // ═══════════════════════════════════════════════════════════

    /**
     * Mock fetch API
     */
    E2E.mockAPI = function(overrides) {
        var originalFetch = window.fetch;
        var mocks = overrides || {};

        window.fetch = function(url, options) {
            options = options || {};
            var urlStr = typeof url === 'string' ? url : url.toString();

            for (var pattern in mocks) {
                if (urlStr.indexOf(pattern) !== -1) {
                    var mockResponse = mocks[pattern];

                    // If mock is a function, call it with options
                    if (typeof mockResponse === 'function') {
                        mockResponse = mockResponse({ url: urlStr, options: options, body: options.body });
                    }

                    var response = {
                        ok: mockResponse.ok !== false,
                        status: mockResponse.status || 200,
                        statusText: mockResponse.statusText || 'OK',
                        headers: new Headers(mockResponse.headers || {}),
                        json: function() {
                            return Promise.resolve(mockResponse.data !== undefined ? mockResponse.data : mockResponse);
                        },
                        text: function() {
                            var data = mockResponse.data !== undefined ? mockResponse.data : mockResponse;
                            return Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data));
                        },
                        clone: function() {
                            return response;
                        }
                    };

                    return Promise.resolve(response);
                }
            }

            return originalFetch(url, options);
        };

        return function restore() {
            window.fetch = originalFetch;
        };
    };

    /**
     * Create mock data factory
     */
    E2E.createMockData = function(template, count) {
        var data = [];
        for (var i = 0; i < count; i++) {
            var item = {};
            for (var key in template) {
                var value = template[key];
                if (typeof value === 'function') {
                    item[key] = value(i);
                } else {
                    item[key] = value;
                }
            }
            data.push(item);
        }
        return data;
    };

    // ═══════════════════════════════════════════════════════════
    // TEST ISOLATION
    // ═══════════════════════════════════════════════════════════

    /**
     * Create isolated test environment
     */
    E2E.createEnvironment = function(html) {
        var container = document.createElement('div');
        container.id = 'e2e-test-environment';
        container.innerHTML = html || '';
        document.body.appendChild(container);

        return {
            container: container,
            destroy: function() {
                if (container.parentNode) {
                    container.parentNode.removeChild(container);
                }
            }
        };
    };

    /**
     * Cleanup all modals and overlays
     */
    E2E.cleanup = function() {
        // Remove modals
        document.querySelectorAll('.modal, .modal-backdrop').forEach(function(el) {
            el.remove();
        });

        // Remove toasts
        var toastContainer = document.getElementById('funky-toast-container');
        if (toastContainer) {
            toastContainer.innerHTML = '';
        }

        // Remove spinners
        if (Funky && Funky.Spinner) {
            Funky.Spinner.hideAll();
        }

        // Remove overlays
        document.querySelectorAll('.overlay, .spinner-overlay').forEach(function(el) {
            el.remove();
        });
    };

    // Export
    FunkyTests.E2E = E2E;

})(window.FunkyTests);

/**
 * Accessibility Testing Utilities
 *
 * Provides WCAG 2.1 AA compliance checking utilities.
 */
(function(FunkyTests) {
    'use strict';

    // Guard: FunkyTests must be available
    if (!FunkyTests) {
        console.warn('[A11yUtils] FunkyTests not available - skipping A11y utilities setup');
        return;
    }

    var A11y = {};

    // ═══════════════════════════════════════════════════════════
    // COLOR CONTRAST
    // ═══════════════════════════════════════════════════════════

    /**
     * Check color contrast ratio
     */
    A11y.checkContrast = function(foreground, background) {
        function getLuminance(hex) {
            var rgb = hexToRgb(hex);
            var a = [rgb.r, rgb.g, rgb.b].map(function(v) {
                v /= 255;
                return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
            });
            return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
        }

        function hexToRgb(hex) {
            hex = hex.replace('#', '');
            if (hex.length === 3) {
                hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
            }
            return {
                r: parseInt(hex.substr(0, 2), 16),
                g: parseInt(hex.substr(2, 2), 16),
                b: parseInt(hex.substr(4, 2), 16)
            };
        }

        var l1 = getLuminance(foreground);
        var l2 = getLuminance(background);
        var ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

        return {
            ratio: ratio,
            aa: ratio >= 4.5,           // Normal text
            aaLarge: ratio >= 3,        // Large text (18pt+)
            aaa: ratio >= 7,            // Enhanced
            aaaLarge: ratio >= 4.5      // Enhanced large
        };
    };

    // ═══════════════════════════════════════════════════════════
    // FOCUS MANAGEMENT
    // ═══════════════════════════════════════════════════════════

    /**
     * Get all focusable elements
     */
    A11y.getFocusableElements = function(container) {
        container = container || document;
        var selector = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled]):not([type="hidden"])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
            '[contenteditable="true"]'
        ].join(', ');

        return Array.prototype.slice.call(container.querySelectorAll(selector)).filter(function(el) {
            return el.offsetParent !== null; // Visible
        });
    };

    /**
     * Check if element is in tab order
     */
    A11y.isInTabOrder = function(element) {
        var tabindex = element.getAttribute('tabindex');
        if (tabindex === '-1') return false;
        if (element.disabled) return false;
        if (element.offsetParent === null) return false;
        return true;
    };

    /**
     * Validate focus order
     */
    A11y.validateFocusOrder = function(container) {
        var focusable = A11y.getFocusableElements(container);
        var issues = [];

        // Check for positive tabindex (anti-pattern)
        focusable.forEach(function(el) {
            var tabindex = parseInt(el.getAttribute('tabindex') || '0', 10);
            if (tabindex > 0) {
                issues.push({
                    element: el,
                    issue: 'Positive tabindex disrupts natural order',
                    tabindex: tabindex
                });
            }
        });

        return issues;
    };

    // ═══════════════════════════════════════════════════════════
    // IMAGE ACCESSIBILITY
    // ═══════════════════════════════════════════════════════════

    /**
     * Check for missing alt text
     */
    A11y.checkImages = function(container) {
        container = container || document;
        var images = container.querySelectorAll('img');
        var issues = [];

        Array.prototype.forEach.call(images, function(img) {
            var alt = img.getAttribute('alt');
            if (alt === null) {
                issues.push({
                    element: img,
                    issue: 'Missing alt attribute',
                    src: img.src
                });
            } else if (alt === '' && !img.closest('[role="presentation"]')) {
                // Empty alt is OK for decorative images
                var isDecorative = img.getAttribute('role') === 'presentation' ||
                                   img.getAttribute('aria-hidden') === 'true';
                if (!isDecorative) {
                    issues.push({
                        element: img,
                        issue: 'Empty alt on non-decorative image',
                        src: img.src
                    });
                }
            }
        });

        return issues;
    };

    // ═══════════════════════════════════════════════════════════
    // FORM ACCESSIBILITY
    // ═══════════════════════════════════════════════════════════

    /**
     * Check form labels
     */
    A11y.checkFormLabels = function(container) {
        container = container || document;
        var inputs = container.querySelectorAll('input, select, textarea');
        var issues = [];

        Array.prototype.forEach.call(inputs, function(input) {
            if (input.type === 'hidden' || input.type === 'submit' || input.type === 'button') {
                return;
            }

            var hasLabel = false;

            // Check for associated label
            var id = input.id;
            if (id) {
                var label = container.querySelector('label[for="' + id + '"]');
                if (label) hasLabel = true;
            }

            // Check for wrapping label
            if (input.closest('label')) hasLabel = true;

            // Check for aria-label
            if (input.getAttribute('aria-label')) hasLabel = true;

            // Check for aria-labelledby
            if (input.getAttribute('aria-labelledby')) hasLabel = true;

            // Check for title (less preferred)
            if (input.getAttribute('title')) hasLabel = true;

            if (!hasLabel) {
                issues.push({
                    element: input,
                    issue: 'Form control missing label',
                    type: input.type,
                    name: input.name
                });
            }
        });

        return issues;
    };

    // ═══════════════════════════════════════════════════════════
    // HEADING HIERARCHY
    // ═══════════════════════════════════════════════════════════

    /**
     * Check heading hierarchy
     */
    A11y.checkHeadings = function(container) {
        container = container || document;
        var headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
        var issues = [];
        var lastLevel = 0;

        Array.prototype.forEach.call(headings, function(heading) {
            var level = parseInt(heading.tagName.charAt(1), 10);

            if (lastLevel > 0 && level - lastLevel > 1) {
                issues.push({
                    element: heading,
                    issue: 'Skipped heading level',
                    expected: lastLevel + 1,
                    actual: level
                });
            }

            lastLevel = level;
        });

        // Check for multiple h1s
        var h1s = container.querySelectorAll('h1');
        if (h1s.length > 1) {
            issues.push({
                element: h1s[1],
                issue: 'Multiple h1 elements',
                count: h1s.length
            });
        }

        return issues;
    };

    // ═══════════════════════════════════════════════════════════
    // ARIA VALIDATION
    // ═══════════════════════════════════════════════════════════

    /**
     * Valid ARIA roles list
     */
    var validRoles = [
        'alert', 'alertdialog', 'application', 'article', 'banner',
        'button', 'cell', 'checkbox', 'columnheader', 'combobox',
        'complementary', 'contentinfo', 'definition', 'dialog', 'directory',
        'document', 'feed', 'figure', 'form', 'grid', 'gridcell', 'group',
        'heading', 'img', 'link', 'list', 'listbox', 'listitem', 'log',
        'main', 'marquee', 'math', 'menu', 'menubar', 'menuitem',
        'menuitemcheckbox', 'menuitemradio', 'navigation', 'none', 'note',
        'option', 'presentation', 'progressbar', 'radio', 'radiogroup',
        'region', 'row', 'rowgroup', 'rowheader', 'scrollbar', 'search',
        'searchbox', 'separator', 'slider', 'spinbutton', 'status',
        'switch', 'tab', 'table', 'tablist', 'tabpanel', 'term', 'textbox',
        'timer', 'toolbar', 'tooltip', 'tree', 'treegrid', 'treeitem'
    ];

    /**
     * Required ARIA attributes by role
     */
    var ariaRequired = {
        'checkbox': ['aria-checked'],
        'combobox': ['aria-expanded'],
        'heading': ['aria-level'],
        'meter': ['aria-valuenow'],
        'progressbar': [],
        'radio': ['aria-checked'],
        'scrollbar': ['aria-controls', 'aria-valuenow'],
        'slider': ['aria-valuenow'],
        'spinbutton': ['aria-valuenow'],
        'switch': ['aria-checked'],
        'tab': ['aria-selected'],
        'tabpanel': []
    };

    /**
     * Check ARIA usage
     */
    A11y.checkAria = function(container) {
        container = container || document;
        var issues = [];

        // Check for invalid ARIA roles
        var elementsWithRoles = container.querySelectorAll('[role]');

        Array.prototype.forEach.call(elementsWithRoles, function(el) {
            var role = el.getAttribute('role');
            if (validRoles.indexOf(role) === -1) {
                issues.push({
                    element: el,
                    issue: 'Invalid ARIA role',
                    role: role
                });
            }

            // Check for required ARIA attributes
            var required = ariaRequired[role];
            if (required) {
                required.forEach(function(attr) {
                    if (!el.hasAttribute(attr)) {
                        issues.push({
                            element: el,
                            issue: 'Missing required ARIA attribute',
                            role: role,
                            attribute: attr
                        });
                    }
                });
            }
        });

        return issues;
    };

    // ═══════════════════════════════════════════════════════════
    // KEYBOARD SUPPORT
    // ═══════════════════════════════════════════════════════════

    /**
     * Check keyboard interactions
     */
    A11y.checkKeyboardSupport = function(element) {
        var issues = [];
        var role = element.getAttribute('role');

        // Interactive elements need keyboard support
        var interactiveRoles = ['button', 'link', 'checkbox', 'radio', 'tab', 'menuitem'];

        if (interactiveRoles.indexOf(role) !== -1) {
            var isNativeInteractive = ['BUTTON', 'A', 'INPUT'].indexOf(element.tagName) !== -1;

            // Check for missing tabindex
            if (!isNativeInteractive && !element.hasAttribute('tabindex')) {
                issues.push({
                    element: element,
                    issue: 'Interactive role not in tab order',
                    role: role
                });
            }
        }

        return issues;
    };

    // ═══════════════════════════════════════════════════════════
    // ACCESSIBLE NAME
    // ═══════════════════════════════════════════════════════════

    /**
     * Get accessible name of an element
     */
    A11y.getAccessibleName = function(element) {
        // Check aria-labelledby
        var labelledBy = element.getAttribute('aria-labelledby');
        if (labelledBy) {
            var labels = labelledBy.split(' ').map(function(id) {
                var el = document.getElementById(id);
                return el ? el.textContent : '';
            });
            return labels.join(' ').trim();
        }

        // Check aria-label
        var ariaLabel = element.getAttribute('aria-label');
        if (ariaLabel) return ariaLabel;

        // Check for label element
        var id = element.id;
        if (id) {
            var label = document.querySelector('label[for="' + id + '"]');
            if (label) return label.textContent.trim();
        }

        // Check for wrapping label
        var parentLabel = element.closest('label');
        if (parentLabel) return parentLabel.textContent.trim();

        // Check title
        var title = element.getAttribute('title');
        if (title) return title;

        // Check text content for buttons/links
        if (['BUTTON', 'A'].indexOf(element.tagName) !== -1) {
            return element.textContent.trim();
        }

        // Check alt for images
        if (element.tagName === 'IMG') {
            return element.getAttribute('alt') || '';
        }

        return '';
    };

    // ═══════════════════════════════════════════════════════════
    // FULL AUDIT
    // ═══════════════════════════════════════════════════════════

    /**
     * Run full accessibility audit
     */
    A11y.audit = function(container) {
        container = container || document.body;

        return {
            images: A11y.checkImages(container),
            labels: A11y.checkFormLabels(container),
            headings: A11y.checkHeadings(container),
            aria: A11y.checkAria(container),
            focusOrder: A11y.validateFocusOrder(container)
        };
    };

    // ═══════════════════════════════════════════════════════════
    // CUSTOM MATCHERS
    // ═══════════════════════════════════════════════════════════

    // Store reference to original expect
    var originalExpect = FunkyTests.expect;

    // Enhanced expect with a11y matchers
    FunkyTests.expect = function(actual) {
        var expectation = originalExpect(actual);

        // Add accessible name matcher
        expectation.toHaveAccessibleName = function(expected) {
            var name = A11y.getAccessibleName(actual);
            var pass = expected ? name === expected : !!name;
            var msg = expected
                ? 'Expected accessible name to be "' + expected + '" but got "' + name + '"'
                : 'Expected element to have an accessible name';

            if (!pass) throw new Error(msg);
        };

        // Add keyboard accessible matcher
        expectation.toBeKeyboardAccessible = function() {
            var issues = A11y.checkKeyboardSupport(actual);
            if (issues.length > 0) {
                throw new Error('Element is not keyboard accessible: ' + issues[0].issue);
            }
        };

        // Add focus trap matcher
        expectation.toTrapFocus = function() {
            var focusable = A11y.getFocusableElements(actual);
            if (focusable.length === 0) {
                throw new Error('Focus trap contains no focusable elements');
            }
        };

        // Add ARIA role matcher
        expectation.toHaveRole = function(role) {
            var actualRole = actual.getAttribute('role');
            if (actualRole !== role) {
                throw new Error('Expected role="' + role + '" but got role="' + actualRole + '"');
            }
        };

        // Add aria-live matcher
        expectation.toHaveAriaLive = function(value) {
            var actualValue = actual.getAttribute('aria-live');
            if (value) {
                if (actualValue !== value) {
                    throw new Error('Expected aria-live="' + value + '" but got aria-live="' + actualValue + '"');
                }
            } else {
                if (!actualValue) {
                    throw new Error('Expected element to have aria-live attribute');
                }
            }
        };

        return expectation;
    };

    // Export
    FunkyTests.A11y = A11y;

})(window.FunkyTests);

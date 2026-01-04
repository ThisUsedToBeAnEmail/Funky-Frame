/**
 * Funky.VDom - Virtual DOM Module
 * 
 * Provides virtual DOM creation with chainable builder and object configuration APIs.
 * 
 * **Why use Funky.VDom?**
 * - Cleaner code: Declarative API that mirrors HTML structure
 * - XSS Safety: Automatic escaping with .text(), explicit trust with .html()
 * - Efficient updates: diff/patch only touches changed nodes
 * - State preservation: Keyed reconciliation preserves focus/input values
 * 
 * **When to use VDom vs Dom:**
 * - Use Funky.Dom (direct) for: Simple creation, one-time renders, DOM manipulation
 * - Use Funky.VDom (this) for: Reactive UIs, frequent updates, data-bound lists
 * 
 * **Performance considerations:**
 * - Initial render: Funky.Dom is faster (no VNode allocation overhead)
 * - Updates: Funky.VDom wins when updating parts of existing UI via diff/patch
 * - The main value is efficient updates for reactive data-bound interfaces
 * 
 * @example
 * var V = Funky.VDom;
 * 
 * // Chainable builder
 * V.div().class('card').child(V.h2().text('Title')).build();
 * 
 * // Object config
 * V.create({ tag: 'div', class: 'card', children: [{ tag: 'h2', text: 'Title' }] });
 * 
 * // Render to real DOM
 * document.body.appendChild(V.render(vnode));
 */
(function(window) {
    'use strict';

    // Guard against double registration
    if (typeof Funky !== 'undefined' && Funky.isRegistered && Funky.isRegistered('VDom')) {
        return;
    }

    // Registry dependency check
    if (!window.Funky || !window.Funky.register) {
        console.error('[Funky.VDom] Registry not found. Load namespace.js first.');
        return;
    }

    // =========================================================================
    // Constants
    // =========================================================================

    var TYPES = {
        ELEMENT: 'element',
        TEXT: 'text',
        FRAGMENT: 'fragment',
        HTML: 'html'
    };

    var PATCH_TYPES = {
        REPLACE: 'replace',
        ATTRS: 'attrs',
        TEXT: 'text',
        CHILDREN: 'children',
        INSERT: 'insert',
        REMOVE: 'remove',
        REORDER: 'reorder'
    };

    // =========================================================================
    // VNode Creation
    // =========================================================================

    /**
     * Create an element VNode (hyperscript function)
     * @param {string} tag - HTML tag name
     * @param {Object} [attrs] - Attributes object
     * @param {Array|string|VNode} [children] - Child nodes
     * @returns {VNode}
     */
    function h(tag, attrs, children) {
        return {
            type: TYPES.ELEMENT,
            tag: tag,
            attrs: attrs || {},
            children: normalizeChildren(children),
            key: attrs && attrs.key !== undefined ? attrs.key : null,
            _isVNode: true
        };
    }

    /**
     * Create a text VNode (auto-escapes when rendered)
     * @param {*} value - Text content
     * @returns {VNode}
     */
    function text(value) {
        return {
            type: TYPES.TEXT,
            value: value == null ? '' : String(value),
            _isVNode: true
        };
    }

    /**
     * Create a fragment VNode (multiple root nodes)
     * @param {Array} children - Child VNodes
     * @returns {VNode}
     */
    function fragment(children) {
        return {
            type: TYPES.FRAGMENT,
            children: normalizeChildren(children),
            _isVNode: true
        };
    }

    /**
     * Create a trusted HTML VNode (no escaping - use with caution)
     * @param {string} htmlString - Pre-sanitized HTML
     * @returns {VNode}
     */
    function html(htmlString) {
        return {
            type: TYPES.HTML,
            value: htmlString || '',
            _isVNode: true
        };
    }

    // =========================================================================
    // Convenience Helpers
    // =========================================================================

    /**
     * Create a FontAwesome icon VNode with automatic ARIA handling
     * @param {string} iconClass - Icon classes (e.g., 'fas fa-check')
     * @param {string|Object} [options] - Additional classes or options object
     * @param {string} options.class - Additional classes
     * @param {string} options['aria-label'] - Semantic label (makes icon meaningful)
     * @returns {VNode}
     *
     * @example
     * // Decorative icon (default) - hidden from screen readers
     * V.icon('fas fa-check')
     * // <i class="fas fa-check" aria-hidden="true"></i>
     *
     * // Semantic icon - readable by screen readers
     * V.icon('fas fa-check', { 'aria-label': 'Completed' })
     * // <i class="fas fa-check" role="img" aria-label="Completed"></i>
     *
     * // Backwards compatible - additional class as string
     * V.icon('fas fa-spinner', 'fa-spin')
     * // <i class="fas fa-spinner fa-spin" aria-hidden="true"></i>
     */
    function icon(iconClass, options) {
        var attrs = {};
        var opts = typeof options === 'string' ? { class: options } : (options || {});

        // Build class name
        attrs.class = iconClass + (opts.class ? ' ' + opts.class : '');

        // Determine if icon is semantic or decorative
        if (opts['aria-label']) {
            // Semantic icon - has meaning for screen readers
            attrs.role = 'img';
            attrs['aria-label'] = opts['aria-label'];
        } else {
            // Decorative icon - hidden from screen readers
            attrs['aria-hidden'] = 'true';
        }

        // Copy other attributes (except class and aria-label which we handled)
        for (var key in opts) {
            if (key !== 'class' && key !== 'aria-label') {
                attrs[key] = opts[key];
            }
        }

        return h('i', attrs, []);
    }

    /**
     * Conditional rendering - returns result if condition is truthy
     * @param {*} condition - Condition to evaluate
     * @param {Function|VNode} thenFn - VNode or function returning VNode when truthy
     * @param {Function|VNode} [elseFn] - VNode or function returning VNode when falsy
     * @returns {VNode|null}
     * @example
     * when(user.isAdmin, function() { return D.button().text('Admin'); })
     * when(hasItems, renderList, renderEmpty)
     */
    function when(condition, thenFn, elseFn) {
        if (condition) {
            return typeof thenFn === 'function' ? thenFn() : thenFn;
        } else if (elseFn) {
            return typeof elseFn === 'function' ? elseFn() : elseFn;
        }
        return null;
    }

    /**
     * Conditional rendering - returns result if condition is falsy
     * @param {*} condition - Condition to evaluate
     * @param {Function|VNode} thenFn - VNode or function returning VNode when falsy
     * @param {Function|VNode} [elseFn] - VNode or function returning VNode when truthy
     * @returns {VNode|null}
     * @example
     * unless(isLoading, function() { return D.div().text('Loaded!'); })
     */
    function unless(condition, thenFn, elseFn) {
        return when(!condition, thenFn, elseFn);
    }

    /**
     * List rendering with automatic key assignment
     * @param {Array} items - Array of items to render
     * @param {Function} renderFn - Function(item, index) returning VNode
     * @param {string|Function} [keyProp] - Property name or function for key extraction
     * @returns {Array<VNode>}
     * @example
     * each(items, function(item) { return D.li().text(item.name); })
     * each(items, renderItem, 'id')  // Use item.id as key
     * each(items, renderItem, function(item) { return item.uuid; })
     */
    function each(items, renderFn, keyProp) {
        if (!items || !items.length) {
            return [];
        }

        // Guard against null/undefined renderFn
        if (typeof renderFn !== 'function') {
            return [];
        }

        var result = [];
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var vnode = renderFn(item, i);

            // Auto-assign key if not set
            // Handle both VNodes (plain objects with _isVNode) and Builders
            var isBuilder = vnode && typeof vnode.key === 'function';
            var isVNode = vnode && vnode._isVNode === true;
            var currentKey = isBuilder ? vnode._key : (isVNode ? vnode.key : null);

            if ((isBuilder || isVNode) && currentKey == null) {
                var newKey;
                if (typeof keyProp === 'function') {
                    newKey = keyProp(item, i);
                } else if (typeof keyProp === 'string' && item[keyProp] !== undefined) {
                    newKey = item[keyProp];
                } else if (item && item.id !== undefined) {
                    newKey = item.id;
                } else {
                    newKey = i;
                }

                if (isBuilder) {
                    vnode._key = newKey;
                } else {
                    vnode.key = newKey;
                }
            }

            if (vnode) {
                // Auto-build Builders to VNodes for consistent return type
                if (isBuilder && typeof vnode.build === 'function') {
                    vnode = vnode.build();
                }
                result.push(vnode);
            }
        }

        return result;
    }

    /**
     * Dynamic class name builder
     * @param {...(string|Array|Object)} args - Class names, arrays, or condition objects
     * @returns {string} Space-separated class names
     * @example
     * classes('card', isActive && 'active', { 'has-error': hasError })
     * // → 'card active has-error' (depending on conditions)
     */
    function classes() {
        var result = [];
        var args = arguments;

        for (var i = 0; i < args.length; i++) {
            var arg = args[i];
            if (!arg) continue;

            if (typeof arg === 'string') {
                result.push(arg);
            } else if (Array.isArray(arg)) {
                // Recursively process arrays
                var nested = classes.apply(null, arg);
                if (nested) {
                    result.push(nested);
                }
            } else if (typeof arg === 'object') {
                // Object with condition values
                var keys = Object.keys(arg);
                for (var j = 0; j < keys.length; j++) {
                    if (arg[keys[j]]) {
                        result.push(keys[j]);
                    }
                }
            }
        }

        return result.join(' ');
    }

    /**
     * Dynamic style builder - merges multiple style objects
     * @param {...Object} args - Style objects (falsy values are skipped)
     * @returns {Object} Merged style object
     * @example
     * styles({ color: 'red' }, isHidden && { display: 'none' }, customStyles)
     */
    function styles() {
        var result = {};
        var args = arguments;

        for (var i = 0; i < args.length; i++) {
            var arg = args[i];
            if (arg && typeof arg === 'object') {
                var keys = Object.keys(arg);
                for (var j = 0; j < keys.length; j++) {
                    var key = keys[j];
                    if (arg[key] != null) {
                        result[key] = arg[key];
                    }
                }
            }
        }

        return result;
    }

    // =========================================================================
    // Accessibility Helpers
    // =========================================================================

    /**
     * Create screen reader only text VNode (visually hidden)
     * @param {string} textContent - Text for screen readers
     * @returns {VNode}
     *
     * @example
     * V.srOnly('Opens in new window')
     * // <span class="visually-hidden">Opens in new window</span>
     */
    function srOnly(textContent) {
        return h('span', { class: 'visually-hidden' }, [text(textContent || '')]);
    }

    /**
     * Create an ARIA live region VNode
     * @param {string} [mode='polite'] - 'polite' or 'assertive'
     * @param {string} [initialContent] - Initial content
     * @returns {VNode}
     *
     * @example
     * V.liveRegion('polite')
     * V.liveRegion('assertive', 'Error occurred')
     */
    function liveRegion(mode, initialContent) {
        var attrs = {
            class: 'visually-hidden',
            'aria-live': mode === 'assertive' ? 'assertive' : 'polite',
            'aria-atomic': 'true',
            role: mode === 'assertive' ? 'alert' : 'status'
        };

        var children = initialContent ? [text(initialContent)] : [];
        return h('div', attrs, children);
    }

    /**
     * Create an accessible form label VNode
     * @param {string} forId - ID of associated input
     * @param {string} labelText - Label text
     * @param {Object} [options] - Options
     * @param {boolean} options.required - Show required indicator
     * @param {boolean} options.hidden - Make label visually hidden
     * @returns {VNode}
     *
     * @example
     * V.label('email', 'Email Address')
     * V.label('email', 'Email', { required: true })
     */
    function label(forId, labelText, options) {
        var opts = options || {};
        var attrs = { for: forId };

        if (opts.hidden) {
            attrs.class = 'visually-hidden';
        }

        var children = [text(labelText)];

        if (opts.required) {
            children.push(h('span', {
                class: 'text-danger',
                'aria-hidden': 'true'
            }, [text(' *')]));

            children.push(h('span', {
                class: 'visually-hidden'
            }, [text(' (required)')]));
        }

        return h('label', attrs, children);
    }

    /**
     * Create a complete accessible form field VNode
     * @param {Object} config - Field configuration
     * @returns {VNode}
     *
     * @example
     * V.formField({
     *   id: 'email',
     *   type: 'email',
     *   label: 'Email Address',
     *   required: true,
     *   description: 'We will never share your email'
     * })
     */
    function formField(config) {
        var fieldId = config.id;
        var descId = fieldId + '-desc';
        var errorId = fieldId + '-error';
        var describedBy = [];

        if (config.description) describedBy.push(descId);
        if (config.error) describedBy.push(errorId);

        var children = [];

        // Label
        children.push(label(fieldId, config.label, { required: config.required }));

        // Input attributes
        var inputAttrs = {
            type: config.type || 'text',
            id: fieldId,
            name: config.name || fieldId,
            class: 'form-control' + (config.class ? ' ' + config.class : '') + (config.error ? ' is-invalid' : '')
        };

        if (config.value != null) inputAttrs.value = config.value;
        if (config.placeholder) inputAttrs.placeholder = config.placeholder;

        if (config.required) {
            inputAttrs.required = true;
            inputAttrs['aria-required'] = 'true';
        }

        if (config.error) {
            inputAttrs['aria-invalid'] = 'true';
        }

        if (describedBy.length > 0) {
            inputAttrs['aria-describedby'] = describedBy.join(' ');
        }

        children.push(h('input', inputAttrs, []));

        // Description
        if (config.description) {
            children.push(h('div', {
                class: 'form-text',
                id: descId
            }, [text(config.description)]));
        }

        // Error
        if (config.error) {
            children.push(h('div', {
                class: 'invalid-feedback d-block',
                id: errorId,
                role: 'alert'
            }, [text(config.error)]));
        }

        return h('div', { class: 'mb-3' }, children);
    }

    /**
     * Create an action button VNode (type="button")
     * @param {string} buttonText - Button text
     * @param {Object} [options] - Options
     * @returns {VNode}
     *
     * @example
     * V.actionButton('Save', { icon: 'fas fa-save', class: 'btn btn-primary' })
     */
    function actionButton(buttonText, options) {
        var opts = options || {};
        var attrs = { type: 'button' };
        var children = [];

        if (opts.class) attrs.class = opts.class;

        if (opts.disabled || opts.loading) {
            attrs.disabled = true;
            attrs['aria-disabled'] = 'true';
        }

        if (opts.loading) {
            attrs['aria-busy'] = 'true';
            children.push(icon('fas fa-spinner fa-spin'));
            children.push(text(' '));
            children.push(text(opts.loadingText || buttonText));
        } else {
            if (opts.icon) {
                children.push(icon(opts.icon));
                children.push(text(' '));
            }
            children.push(text(buttonText));
        }

        return h('button', attrs, children);
    }

    /**
     * Create a submit button VNode (type="submit")
     * @param {string} buttonText - Button text
     * @param {Object} [options] - Options
     * @returns {VNode}
     */
    function submitButton(buttonText, options) {
        var opts = options || {};
        var attrs = { type: 'submit' };
        var children = [];

        if (opts.class) attrs.class = opts.class;

        if (opts.disabled || opts.loading) {
            attrs.disabled = true;
            attrs['aria-disabled'] = 'true';
        }

        if (opts.loading) {
            attrs['aria-busy'] = 'true';
            children.push(icon('fas fa-spinner fa-spin'));
            children.push(text(' '));
            children.push(text(opts.loadingText || 'Submitting...'));
        } else {
            if (opts.icon) {
                children.push(icon(opts.icon));
                children.push(text(' '));
            }
            children.push(text(buttonText));
        }

        return h('button', attrs, children);
    }

    /**
     * Create an icon-only button VNode (requires aria-label)
     * @param {string} iconClass - Icon classes
     * @param {Object} options - Options (aria-label required)
     * @returns {VNode}
     *
     * @example
     * V.iconButton('fas fa-trash', { 'aria-label': 'Delete item', class: 'btn btn-danger' })
     */
    function iconButton(iconClass, options) {
        var opts = options || {};

        if (!opts['aria-label']) {
            console.error('[Funky.VDom] iconButton requires aria-label option for accessibility');
        }

        var attrs = { type: 'button' };

        if (opts['aria-label']) {
            attrs['aria-label'] = opts['aria-label'];
        }

        if (opts.class) attrs.class = opts.class;
        if (opts.title) attrs.title = opts.title;

        if (opts.disabled) {
            attrs.disabled = true;
            attrs['aria-disabled'] = 'true';
        }

        return h('button', attrs, [icon(iconClass)]);
    }

    /**
     * Create a skip target VNode with data attributes for Funky.SkipLink integration
     * The SkipLink component will automatically discover this target and create navigation
     *
     * @param {string} targetName - Skip target name (used in data-skip-target)
     * @param {string} label - Label for the skip link (shown in keyboard help)
     * @param {Object} [options] - Options
     * @param {number} options.order - Sort order for F-key shortcuts (default: 999)
     * @param {string} options.tag - HTML tag to create (default: 'div')
     * @param {string} options.id - Element ID (defaults to 'skip-' + targetName)
     * @returns {VNode}
     *
     * @example
     * // Create a skip target for the SkipLink component
     * V.skipTarget('intro', 'Introduction', { order: 1 })
     * // <div id="skip-intro" data-skip-target="intro" data-skip-label="Introduction" data-skip-order="1"></div>
     *
     * // As a section with children
     * V.skipTarget('content', 'Main Content', { tag: 'section', order: 2 })
     * // <section id="skip-content" data-skip-target="content" data-skip-label="Main Content" data-skip-order="2"></section>
     */
    function skipTarget(targetName, label, options) {
        var opts = options || {};
        var attrs = {
            id: opts.id || 'skip-' + targetName,
            'data-skip-target': targetName,
            'data-skip-label': label
        };
        if (opts.order != null) {
            attrs['data-skip-order'] = opts.order;
        }
        return h(opts.tag || 'div', attrs, []);
    }

    /**
     * Create an accessible search box VNode with associated label
     * @param {Object} config - Search configuration
     * @param {string} config.id - Input ID (required)
     * @param {string} [config.label='Search'] - Label text
     * @param {string} [config.placeholder] - Placeholder text
     * @param {string} [config.name] - Input name (defaults to id)
     * @param {string} [config.class] - Additional classes for input
     * @param {boolean} [config.hideLabel=false] - Visually hide label
     * @param {string} [config.buttonText] - Submit button text (omit for no button)
     * @param {string} [config.buttonIcon] - Submit button icon (default: 'fas fa-search')
     * @returns {VNode}
     *
     * @example
     * V.searchBox({ id: 'site-search', placeholder: 'Search...' })
     */
    function searchBox(config) {
        var searchId = config.id;
        var labelText = config.label || 'Search';

        var children = [];

        // Label (visually hidden by default)
        children.push(h('label', {
            for: searchId,
            class: config.hideLabel !== false ? 'visually-hidden' : ''
        }, [text(labelText)]));

        // Input wrapper children
        var inputWrapperChildren = [];

        // Search input
        var inputAttrs = {
            type: 'search',
            id: searchId,
            name: config.name || searchId,
            role: 'searchbox',
            class: 'form-control' + (config.class ? ' ' + config.class : '')
        };
        if (config.placeholder) inputAttrs.placeholder = config.placeholder;
        if (config.value) inputAttrs.value = config.value;

        inputWrapperChildren.push(h('input', inputAttrs, []));

        // Optional submit button
        if (config.buttonText || config.buttonIcon !== false) {
            var btnChildren = [icon(config.buttonIcon || 'fas fa-search')];
            var btnAttrs = { type: 'submit', class: 'btn btn-search' };

            if (config.buttonText) {
                btnChildren.push(text(' ' + config.buttonText));
            } else {
                btnAttrs['aria-label'] = labelText;
            }

            inputWrapperChildren.push(h('button', btnAttrs, btnChildren));
        }

        children.push(h('div', { class: 'search-input-wrapper' }, inputWrapperChildren));

        return h('form', {
            role: 'search',
            class: 'search-form' + (config.formClass ? ' ' + config.formClass : '')
        }, children);
    }

    /**
     * Create an accessible progress bar VNode
     * @param {Object} config - Progress configuration
     * @param {number} config.value - Current value (0-100 or within min/max)
     * @param {number} [config.min=0] - Minimum value
     * @param {number} [config.max=100] - Maximum value
     * @param {string} [config.label] - Accessible label (required for screen readers)
     * @param {boolean} [config.showValue=false] - Show percentage text
     * @param {string} [config.class] - Additional classes
     * @param {string} [config.id] - Element ID
     * @returns {VNode}
     *
     * @example
     * V.progressBar({ value: 75, label: 'Upload progress' })
     */
    function progressBar(config) {
        var value = config.value || 0;
        var min = config.min != null ? config.min : 0;
        var max = config.max != null ? config.max : 100;
        var percent = ((value - min) / (max - min)) * 100;

        var attrs = {
            role: 'progressbar',
            'aria-valuenow': value,
            'aria-valuemin': min,
            'aria-valuemax': max,
            class: 'progress' + (config.class ? ' ' + config.class : '')
        };

        if (config.id) attrs.id = config.id;
        if (config.label) {
            attrs['aria-label'] = config.label;
        } else {
            console.warn('[Funky.VDom] progressBar should have a label for accessibility');
        }

        var fillChildren = config.showValue ? [text(Math.round(percent) + '%')] : [];

        return h('div', attrs, [
            h('div', {
                class: 'progress-bar',
                style: { width: percent + '%' }
            }, fillChildren)
        ]);
    }

    /**
     * Create an accessible loading indicator VNode
     * @param {Object} [config] - Loading configuration
     * @param {string} [config.label='Loading'] - Accessible label
     * @param {string} [config.size] - Size class (e.g., 'sm', 'lg', 'xl')
     * @param {boolean} [config.inline=false] - Inline spinner
     * @param {string} [config.class] - Additional classes
     * @returns {VNode}
     *
     * @example
     * V.loadingIndicator({ label: 'Loading results' })
     */
    function loadingIndicator(config) {
        var opts = config || {};
        var labelText = opts.label || 'Loading';

        var containerClass = 'loading-indicator' + (opts.class ? ' ' + opts.class : '');
        if (opts.inline) containerClass += ' loading-inline';

        var spinnerClass = 'fas fa-spinner fa-spin';
        if (opts.size === 'sm') spinnerClass += ' fa-sm';
        else if (opts.size === 'lg') spinnerClass += ' fa-lg';
        else if (opts.size === 'xl') spinnerClass += ' fa-2x';

        return h('div', {
            role: 'status',
            'aria-busy': 'true',
            'aria-label': labelText,
            class: containerClass
        }, [
            icon(spinnerClass),
            h('span', { class: 'visually-hidden' }, [text(labelText)])
        ]);
    }

    /**
     * Create an accessible alert box VNode
     * @param {string} message - Alert message
     * @param {Object} [config] - Alert configuration
     * @param {string} [config.type='info'] - Alert type: 'info', 'success', 'warning', 'error'
     * @param {boolean} [config.dismissible=false] - Show dismiss button
     * @param {string} [config.icon] - Custom icon class
     * @param {string} [config.class] - Additional classes
     * @param {string} [config.id] - Element ID
     * @returns {VNode}
     *
     * @example
     * V.alertBox('Form submitted successfully', { type: 'success', dismissible: true })
     */
    function alertBox(message, config) {
        var opts = config || {};
        var type = opts.type || 'info';

        var typeMap = {
            info: { class: 'alert-info', icon: 'fas fa-info-circle' },
            success: { class: 'alert-success', icon: 'fas fa-check-circle' },
            warning: { class: 'alert-warning', icon: 'fas fa-exclamation-triangle' },
            error: { class: 'alert-danger', icon: 'fas fa-exclamation-circle' }
        };

        var typeConfig = typeMap[type] || typeMap.info;
        var containerClass = 'alert ' + typeConfig.class + (opts.class ? ' ' + opts.class : '');
        if (opts.dismissible) containerClass += ' alert-dismissible';

        var attrs = { role: 'alert', class: containerClass };
        if (opts.id) attrs.id = opts.id;

        var children = [
            icon(opts.icon || typeConfig.icon),
            text(' ' + message)
        ];

        if (opts.dismissible) {
            children.push(h('button', {
                type: 'button',
                'aria-label': 'Dismiss alert',
                class: 'btn-close',
                'data-bs-dismiss': 'alert'
            }, []));
        }

        return h('div', attrs, children);
    }

    /**
     * Create an accessible modal dialog VNode
     * @param {Object} config - Dialog configuration
     * @param {string} config.id - Dialog ID (required)
     * @param {string} config.title - Dialog title (required for accessibility)
     * @param {string|VNode} [config.content] - Dialog body content
     * @param {Array} [config.buttons] - Footer button configurations
     * @param {boolean} [config.closeButton=true] - Show close button in header
     * @param {string} [config.size] - Size: 'sm', 'lg', 'xl', 'fullscreen'
     * @param {boolean} [config.centered=false] - Vertically centered
     * @param {string} [config.class] - Additional classes for dialog
     * @returns {VNode}
     *
     * @example
     * V.dialog({
     *   id: 'confirm-dialog',
     *   title: 'Confirm Action',
     *   content: 'Are you sure you want to proceed?',
     *   buttons: [
     *     { text: 'Cancel', class: 'btn btn-secondary', dismiss: true },
     *     { text: 'Confirm', class: 'btn btn-primary', id: 'confirm-btn' }
     *   ]
     * })
     */
    function dialog(config) {
        var dialogId = config.id;
        var titleId = dialogId + '-title';

        // Header children
        var headerChildren = [
            h('h5', { class: 'modal-title', id: titleId }, [text(config.title)])
        ];

        if (config.closeButton !== false) {
            headerChildren.push(h('button', {
                type: 'button',
                class: 'btn-close',
                'data-bs-dismiss': 'modal',
                'aria-label': 'Close'
            }, []));
        }

        // Body content
        var bodyChildren = [];
        if (config.content) {
            if (typeof config.content === 'string') {
                bodyChildren.push(text(config.content));
            } else if (isVNode(config.content)) {
                bodyChildren.push(config.content);
            } else if (config.content && typeof config.content.build === 'function') {
                bodyChildren.push(config.content.build());
            }
        }

        // Content children
        var contentChildren = [
            h('div', { class: 'modal-header' }, headerChildren),
            h('div', { class: 'modal-body' }, bodyChildren)
        ];

        // Footer with buttons
        if (config.buttons && config.buttons.length > 0) {
            var footerChildren = [];
            for (var i = 0; i < config.buttons.length; i++) {
                var btnConfig = config.buttons[i];
                var btnAttrs = {
                    type: 'button',
                    class: btnConfig.class || 'btn btn-secondary'
                };
                if (btnConfig.id) btnAttrs.id = btnConfig.id;
                if (btnConfig.dismiss) btnAttrs['data-bs-dismiss'] = 'modal';

                var btnChildren = [];
                if (btnConfig.icon) {
                    btnChildren.push(icon(btnConfig.icon));
                    btnChildren.push(text(' '));
                }
                btnChildren.push(text(btnConfig.text));

                footerChildren.push(h('button', btnAttrs, btnChildren));
            }
            contentChildren.push(h('div', { class: 'modal-footer' }, footerChildren));
        }

        // Dialog structure
        var sizeClass = config.size ? ' modal-' + config.size : '';
        var centeredClass = config.centered ? ' modal-dialog-centered' : '';

        return h('div', {
            class: 'modal fade',
            id: dialogId,
            tabindex: '-1',
            role: 'dialog',
            'aria-labelledby': titleId,
            'aria-modal': 'true'
        }, [
            h('div', {
                class: 'modal-dialog' + sizeClass + centeredClass,
                role: 'document'
            }, [
                h('div', {
                    class: 'modal-content' + (config.class ? ' ' + config.class : '')
                }, contentChildren)
            ])
        ]);
    }

    /**
     * Normalize children to array of VNodes
     * @param {*} children - Raw children input
     * @returns {Array<VNode>}
     */
    function normalizeChildren(children) {
        if (children == null) {
            return [];
        }

        if (!Array.isArray(children)) {
            children = [children];
        }

        var result = [];
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            
            // Skip null/undefined/false
            if (child == null || child === false) {
                continue;
            }

            // Convert primitives to text nodes
            if (typeof child === 'string' || typeof child === 'number') {
                result.push(text(child));
            }
            // Accept VNodes directly
            else if (isVNode(child)) {
                result.push(child);
            }
            // Accept Builder instances
            else if (child && typeof child.build === 'function') {
                result.push(child.build());
            }
            // Flatten nested arrays
            else if (Array.isArray(child)) {
                var nested = normalizeChildren(child);
                for (var j = 0; j < nested.length; j++) {
                    result.push(nested[j]);
                }
            }
        }

        return result;
    }

    /**
     * Check if value is a VNode
     * @param {*} value
     * @returns {boolean}
     */
    function isVNode(value) {
        return value != null && value._isVNode === true;
    }

    // =========================================================================
    // Rendering
    // =========================================================================

    /**
     * Render a VNode tree to real DOM
     * @param {VNode} vnode
     * @returns {Node|DocumentFragment}
     */
    function render(vnode) {
        // Accept Builder instances
        if (vnode && typeof vnode.build === 'function') {
            vnode = vnode.build();
        }

        // Handle null/undefined
        if (vnode == null) {
            return document.createTextNode('');
        }

        // Handle plain strings
        if (typeof vnode === 'string') {
            return document.createTextNode(vnode);
        }

        // Validate VNode
        if (!isVNode(vnode)) {
            console.warn('[Funky.VDom] Invalid VNode:', vnode);
            return document.createTextNode('');
        }

        // Text node
        if (vnode.type === TYPES.TEXT) {
            return document.createTextNode(vnode.value);
        }

        // HTML node (trusted content)
        if (vnode.type === TYPES.HTML) {
            var wrapper = document.createElement('div');
            wrapper.innerHTML = vnode.value;
            var frag = document.createDocumentFragment();
            while (wrapper.firstChild) {
                frag.appendChild(wrapper.firstChild);
            }
            return frag;
        }

        // Fragment
        if (vnode.type === TYPES.FRAGMENT) {
            var fragNode = document.createDocumentFragment();
            var fragChildren = vnode.children || [];
            for (var i = 0; i < fragChildren.length; i++) {
                fragNode.appendChild(render(fragChildren[i]));
            }
            return fragNode;
        }

        // Element node
        var el = document.createElement(vnode.tag);

        // Set attributes
        var attrs = vnode.attrs || {};
        var attrKeys = Object.keys(attrs);
        for (var a = 0; a < attrKeys.length; a++) {
            var key = attrKeys[a];
            var val = attrs[key];

            // Skip internal/null attributes
            if (key === 'key' || val == null || val === false) {
                continue;
            }

            // Event handlers
            if (key.indexOf('on') === 0 && typeof val === 'function') {
                var eventName = key.slice(2).toLowerCase();
                el.addEventListener(eventName, val);
            }
            // Style object
            else if (key === 'style' && typeof val === 'object') {
                var styleKeys = Object.keys(val);
                for (var s = 0; s < styleKeys.length; s++) {
                    var styleProp = styleKeys[s];
                    if (val[styleProp] != null) {
                        el.style[styleProp] = val[styleProp];
                    }
                }
            }
            // Class
            else if (key === 'class' || key === 'className') {
                el.className = val;
            }
            // Boolean attributes
            else if (val === true) {
                el.setAttribute(key, '');
            }
            // Regular attributes
            else {
                el.setAttribute(key, String(val));
            }
        }

        // Render children
        var children = vnode.children || [];
        for (var c = 0; c < children.length; c++) {
            el.appendChild(render(children[c]));
        }

        // Store vnode reference for diffing
        el._vnode = vnode;

        return el;
    }

    // =========================================================================
    // Diffing
    // =========================================================================

    /**
     * Diff two VNode trees and return patches
     * @param {VNode} oldVNode
     * @param {VNode} newVNode
     * @returns {Array} patches
     */
    function diff(oldVNode, newVNode) {
        var patches = [];
        diffNodes(oldVNode, newVNode, patches, []);
        return patches;
    }

    /**
     * Recursive diff implementation
     */
    function diffNodes(oldNode, newNode, patches, path) {
        // New node is null - remove
        if (newNode == null) {
            if (oldNode != null) {
                patches.push({
                    type: PATCH_TYPES.REMOVE,
                    path: path.slice()
                });
            }
            return;
        }

        // Old node is null - insert
        if (oldNode == null) {
            patches.push({
                type: PATCH_TYPES.INSERT,
                path: path.slice(),
                vnode: newNode
            });
            return;
        }

        // Different types - replace
        if (oldNode.type !== newNode.type) {
            patches.push({
                type: PATCH_TYPES.REPLACE,
                path: path.slice(),
                vnode: newNode
            });
            return;
        }

        // Text nodes - compare values
        if (newNode.type === TYPES.TEXT) {
            if (oldNode.value !== newNode.value) {
                patches.push({
                    type: PATCH_TYPES.TEXT,
                    path: path.slice(),
                    value: newNode.value
                });
            }
            return;
        }

        // HTML nodes - compare values
        if (newNode.type === TYPES.HTML) {
            if (oldNode.value !== newNode.value) {
                patches.push({
                    type: PATCH_TYPES.REPLACE,
                    path: path.slice(),
                    vnode: newNode
                });
            }
            return;
        }

        // Fragment - diff children
        if (newNode.type === TYPES.FRAGMENT) {
            diffChildren(oldNode.children || [], newNode.children || [], patches, path);
            return;
        }

        // Element nodes - check tag
        if (oldNode.tag !== newNode.tag) {
            patches.push({
                type: PATCH_TYPES.REPLACE,
                path: path.slice(),
                vnode: newNode
            });
            return;
        }

        // Diff attributes
        var attrPatches = diffAttrs(oldNode.attrs || {}, newNode.attrs || {});
        if (attrPatches) {
            patches.push({
                type: PATCH_TYPES.ATTRS,
                path: path.slice(),
                attrs: attrPatches
            });
        }

        // Diff children
        diffChildren(oldNode.children || [], newNode.children || [], patches, path);
    }

    /**
     * Diff attributes between old and new
     */
    function diffAttrs(oldAttrs, newAttrs) {
        var patches = null;
        var key;

        // Check for changed/added attrs
        var newKeys = Object.keys(newAttrs);
        for (var i = 0; i < newKeys.length; i++) {
            key = newKeys[i];
            if (key === 'key') continue;
            
            if (oldAttrs[key] !== newAttrs[key]) {
                if (!patches) patches = {};
                patches[key] = newAttrs[key];
            }
        }

        // Check for removed attrs
        var oldKeys = Object.keys(oldAttrs);
        for (var j = 0; j < oldKeys.length; j++) {
            key = oldKeys[j];
            if (key === 'key') continue;
            
            if (!(key in newAttrs)) {
                if (!patches) patches = {};
                patches[key] = null; // null means remove
            }
        }

        return patches;
    }

    /**
     * Diff children arrays with keyed reconciliation
     */
    function diffChildren(oldChildren, newChildren, patches, path) {
        var oldKeyed = {};
        var newKeyed = {};
        var i, child, key;

        // Build keyed maps
        for (i = 0; i < oldChildren.length; i++) {
            child = oldChildren[i];
            key = child && child.key;
            if (key != null) {
                oldKeyed[key] = { index: i, vnode: child };
            }
        }

        for (i = 0; i < newChildren.length; i++) {
            child = newChildren[i];
            key = child && child.key;
            if (key != null) {
                newKeyed[key] = { index: i, vnode: child };
            }
        }

        var hasKeys = Object.keys(oldKeyed).length > 0 || Object.keys(newKeyed).length > 0;

        if (hasKeys) {
            // Keyed diffing
            diffKeyedChildren(oldChildren, newChildren, oldKeyed, newKeyed, patches, path);
        } else {
            // Simple index-based diffing
            var maxLen = Math.max(oldChildren.length, newChildren.length);
            for (i = 0; i < maxLen; i++) {
                var childPath = path.concat([i]);
                diffNodes(oldChildren[i] || null, newChildren[i] || null, patches, childPath);
            }
        }
    }

    /**
     * Keyed children diffing for efficient list updates
     */
    function diffKeyedChildren(oldChildren, newChildren, oldKeyed, newKeyed, patches, path) {
        var moves = [];
        var i, key, oldItem, newItem;

        // Find removed keys
        var oldKeyList = Object.keys(oldKeyed);
        for (i = 0; i < oldKeyList.length; i++) {
            key = oldKeyList[i];
            if (!(key in newKeyed)) {
                patches.push({
                    type: PATCH_TYPES.REMOVE,
                    path: path.concat([oldKeyed[key].index]),
                    key: key
                });
            }
        }

        // Process new children in order
        for (i = 0; i < newChildren.length; i++) {
            var newChild = newChildren[i];
            key = newChild && newChild.key;
            var childPath = path.concat([i]);

            if (key != null && key in oldKeyed) {
                // Existing keyed node - diff it
                oldItem = oldKeyed[key];
                diffNodes(oldItem.vnode, newChild, patches, childPath);
                
                // Track if it moved
                if (oldItem.index !== i) {
                    moves.push({ from: oldItem.index, to: i, key: key });
                }
            } else if (key != null) {
                // New keyed node
                patches.push({
                    type: PATCH_TYPES.INSERT,
                    path: childPath,
                    vnode: newChild,
                    key: key
                });
            } else {
                // Non-keyed - simple diff
                var oldChild = oldChildren[i];
                diffNodes(oldChild || null, newChild, patches, childPath);
            }
        }

        // Add reorder patch if needed
        if (moves.length > 0) {
            patches.push({
                type: PATCH_TYPES.REORDER,
                path: path,
                moves: moves
            });
        }
    }

    // =========================================================================
    // Patching
    // =========================================================================

    /**
     * Apply patches to a DOM element
     * @param {Element} rootElement
     * @param {Array} patches
     */
    function patch(rootElement, patches) {
        for (var i = 0; i < patches.length; i++) {
            applyPatch(rootElement, patches[i]);
        }
    }

    /**
     * Apply a single patch
     */
    function applyPatch(root, patchOp) {
        var element = getElementAtPath(root, patchOp.path);
        
        if (!element && patchOp.type !== PATCH_TYPES.INSERT) {
            console.warn('[Funky.VDom] Could not find element at path:', patchOp.path);
            return;
        }

        switch (patchOp.type) {
            case PATCH_TYPES.REPLACE:
                if (element && element.parentNode) {
                    var newEl = render(patchOp.vnode);
                    element.parentNode.replaceChild(newEl, element);
                }
                break;

            case PATCH_TYPES.ATTRS:
                applyAttrPatch(element, patchOp.attrs);
                break;

            case PATCH_TYPES.TEXT:
                if (element.nodeType === Node.TEXT_NODE) {
                    element.textContent = patchOp.value;
                }
                break;

            case PATCH_TYPES.INSERT:
                var parent = patchOp.path.length > 0 
                    ? getElementAtPath(root, patchOp.path.slice(0, -1))
                    : root;
                if (parent) {
                    var insertIndex = patchOp.path[patchOp.path.length - 1];
                    var newChild = render(patchOp.vnode);
                    var refChild = parent.childNodes[insertIndex];
                    if (refChild) {
                        parent.insertBefore(newChild, refChild);
                    } else {
                        parent.appendChild(newChild);
                    }
                }
                break;

            case PATCH_TYPES.REMOVE:
                if (element && element.parentNode) {
                    element.parentNode.removeChild(element);
                }
                break;

            case PATCH_TYPES.REORDER:
                // Reorder is complex - for now, handled by individual moves
                // Future optimization: batch moves
                break;
        }
    }

    /**
     * Apply attribute patches to an element
     */
    function applyAttrPatch(element, attrs) {
        var keys = Object.keys(attrs);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var val = attrs[key];

            // Remove attribute
            if (val == null || val === false) {
                if (key.indexOf('on') === 0) {
                    // Can't easily remove event listeners without reference
                    // For now, skip - proper implementation would track listeners
                } else if (key === 'class' || key === 'className') {
                    element.className = '';
                } else if (key === 'style') {
                    element.style.cssText = '';
                } else {
                    element.removeAttribute(key);
                }
                continue;
            }

            // Event handlers - skip in patch (would need listener tracking)
            if (key.indexOf('on') === 0) {
                // For proper event patching, would need to track old handlers
                continue;
            }

            // Style object
            if (key === 'style' && typeof val === 'object') {
                var styleKeys = Object.keys(val);
                for (var s = 0; s < styleKeys.length; s++) {
                    element.style[styleKeys[s]] = val[styleKeys[s]] || '';
                }
                continue;
            }

            // Class
            if (key === 'class' || key === 'className') {
                element.className = val;
                continue;
            }

            // Boolean attribute
            if (val === true) {
                element.setAttribute(key, '');
                continue;
            }

            // Regular attribute
            element.setAttribute(key, String(val));
        }
    }

    /**
     * Get DOM element at path from root
     */
    function getElementAtPath(root, path) {
        var el = root;
        for (var i = 0; i < path.length; i++) {
            if (!el || !el.childNodes) return null;
            el = el.childNodes[path[i]];
        }
        return el;
    }

    // =========================================================================
    // Builder Class (Chainable API)
    // =========================================================================

    /**
     * Chainable builder for creating VNodes
     * @param {string} tag - HTML tag name
     * @param {Builder} [parent] - Parent builder (for traversal)
     * @constructor
     */
    function Builder(tag, parent) {
        this._tag = tag;
        this._attrs = {};
        this._children = [];  // Array of Builder or VNode
        this._key = null;
        this._parent = parent || null;  // Parent Builder for traversal

        // Button gets type="button" by default to prevent accidental form submissions
        // Use V.submitButton() for submit buttons, or .attr('type', 'submit') to override
        if (tag === 'button') {
            this._attrs.type = 'button';
        }
    }

    Builder.prototype = {
        constructor: Builder,

        /**
         * Set CSS class(es) - replaces existing classes
         * @param {string} value - Class name(s)
         * @returns {Builder}
         */
        class: function(value) {
            if (value != null && value !== false) {
                this._attrs.class = value;
            }
            return this;
        },

        /**
         * Add CSS class(es) to existing classes
         * @param {string} value - Class name(s) to add
         * @returns {Builder}
         */
        classAdd: function(value) {
            if (value != null && value !== false && value !== '') {
                var current = this._attrs.class || '';
                var classes = current ? current.split(/\s+/) : [];
                var toAdd = String(value).split(/\s+/);
                for (var i = 0; i < toAdd.length; i++) {
                    if (toAdd[i] && classes.indexOf(toAdd[i]) === -1) {
                        classes.push(toAdd[i]);
                    }
                }
                this._attrs.class = classes.join(' ');
            }
            return this;
        },

        /**
         * Remove CSS class(es) from existing classes
         * @param {string} value - Class name(s) to remove
         * @returns {Builder}
         */
        classRemove: function(value) {
            if (value != null && value !== false && value !== '' && this._attrs.class) {
                var classes = this._attrs.class.split(/\s+/);
                var toRemove = String(value).split(/\s+/);
                var result = [];
                for (var i = 0; i < classes.length; i++) {
                    if (toRemove.indexOf(classes[i]) === -1) {
                        result.push(classes[i]);
                    }
                }
                this._attrs.class = result.join(' ');
            }
            return this;
        },

        /**
         * Toggle CSS class(es) based on condition
         * @param {string} value - Class name(s) to toggle
         * @param {boolean} [condition] - If true add, if false remove. If omitted, toggles.
         * @returns {Builder}
         */
        classToggle: function(value, condition) {
            if (value == null || value === false || value === '') {
                return this;
            }
            // If condition is explicitly provided, use it
            if (arguments.length > 1) {
                if (condition) {
                    return this.classAdd(value);
                } else {
                    return this.classRemove(value);
                }
            }
            // No condition - toggle based on current state
            var current = this._attrs.class || '';
            var classes = current ? current.split(/\s+/) : [];
            var toToggle = String(value).split(/\s+/);
            for (var i = 0; i < toToggle.length; i++) {
                var cls = toToggle[i];
                if (!cls) continue;
                var idx = classes.indexOf(cls);
                if (idx === -1) {
                    classes.push(cls);
                } else {
                    classes.splice(idx, 1);
                }
            }
            this._attrs.class = classes.join(' ');
            return this;
        },

        /**
         * Check if builder has a class
         * @param {string} value - Class name to check
         * @returns {boolean}
         */
        hasClass: function(value) {
            if (!value || !this._attrs.class) return false;
            var classes = this._attrs.class.split(/\s+/);
            return classes.indexOf(value) !== -1;
        },

        /**
         * Check if builder has a class (alias for hasClass, follows classAdd/classRemove naming)
         * @param {string} value - Class name to check
         * @returns {boolean}
         */
        classHas: function(value) {
            return this.hasClass(value);
        },

        /**
         * Set element ID
         * @param {string} value
         * @returns {Builder}
         */
        id: function(value) {
            this._attrs.id = value;
            return this;
        },

        /**
         * Set any attribute
         * @param {string} name - Attribute name
         * @param {*} value - Attribute value
         * @returns {Builder}
         */
        attr: function(name, value) {
            this._attrs[name] = value;
            return this;
        },

        /**
         * Remove an attribute
         * @param {string} name - Attribute name to remove
         * @returns {Builder}
         */
        attrRemove: function(name) {
            delete this._attrs[name];
            return this;
        },

        /**
         * Toggle an attribute based on condition
         * @param {string} name - Attribute name
         * @param {boolean} condition - If true set attribute, if false remove it
         * @param {*} [value=true] - Value to set when condition is true (defaults to true for boolean attrs)
         * @returns {Builder}
         */
        attrToggle: function(name, condition, value) {
            if (condition) {
                this._attrs[name] = arguments.length > 2 ? value : true;
            } else {
                delete this._attrs[name];
            }
            return this;
        },

        /**
         * Set data-* attribute
         * @param {string} name - Data attribute name (without 'data-' prefix)
         * @param {*} value
         * @returns {Builder}
         */
        data: function(name, value) {
            this._attrs['data-' + name] = value;
            return this;
        },

        /**
         * Set aria-* attribute
         * @param {string} name - Aria attribute name (without 'aria-' prefix)
         * @param {*} value
         * @returns {Builder}
         */
        aria: function(name, value) {
            this._attrs['aria-' + name] = value;
            return this;
        },

        /**
         * Set inline styles
         * @param {Object|string} styleOrProp - Style object or property name
         * @param {string} [value] - Value when first arg is property name
         * @returns {Builder}
         */
        style: function(styleOrProp, value) {
            if (styleOrProp != null && styleOrProp !== false) {
                // Support both .style('prop', 'val') and .style({ prop: 'val' })
                if (typeof styleOrProp === 'string' && arguments.length === 2) {
                    // Convert single property to object and merge with existing
                    if (!this._attrs.style || typeof this._attrs.style === 'string') {
                        this._attrs.style = {};
                    }
                    this._attrs.style[styleOrProp] = value;
                } else {
                    this._attrs.style = styleOrProp;
                }
            }
            return this;
        },

        /**
         * Hide element with fade animation (adds 'funky-hidden' class)
         * @param {boolean} [showInstead=false] - If true, shows instead of hiding
         * @returns {Builder}
         */
        hide: function(showInstead) {
            if (showInstead) {
                return this.classRemove('funky-hidden');
            }
            return this.classAdd('funky-hidden');
        },

        /**
         * Show element (removes 'funky-hidden' class) - alias for hide(true)
         * @returns {Builder}
         */
        show: function() {
            return this.classRemove('funky-hidden');
        },

        /**
         * Toggle visibility (toggles 'funky-hidden' class)
         * @param {boolean} [condition] - Force show/hide
         * @returns {Builder}
         */
        toggle: function(condition) {
            if (arguments.length > 0) {
                return this.classToggle('funky-hidden', !condition);
            }
            return this.classToggle('funky-hidden');
        },

        /**
         * Check if builder has no children
         * @returns {boolean}
         */
        isEmpty: function() {
            return this._children.length === 0;
        },

        /**
         * Add event handler
         * @param {string} event - Event name (without 'on' prefix)
         * @param {Function} handler
         * @returns {Builder}
         */
        on: function(event, handler) {
            this._attrs['on' + event] = handler;
            return this;
        },

        /**
         * Set unique key for diffing
         * @param {string|number} value
         * @returns {Builder}
         */
        key: function(value) {
            this._key = value;
            return this;
        },

        /**
         * Add child nodes
         * @param {...*} children - Child nodes (VNodes, Builders, strings, arrays)
         * @returns {Builder}
         */
        child: function(/* ...children */) {
            var self = this;
            for (var i = 0; i < arguments.length; i++) {
                var child = arguments[i];
                if (Array.isArray(child)) {
                    for (var j = 0; j < child.length; j++) {
                        self._addChild(child[j]);
                    }
                } else {
                    self._addChild(child);
                }
            }
            return this;
        },

        /**
         * Internal: add a single child (keeps Builders as Builders for traversal)
         * @private
         */
        _addChild: function(child) {
            if (child == null || child === false) return;
            
            if (typeof child === 'string' || typeof child === 'number') {
                this._children.push(text(String(child)));
            } else if (child instanceof Builder) {
                // Set parent relationship for traversal
                child._parent = this;
                this._children.push(child);
            } else if (isVNode(child)) {
                this._children.push(child);
            }
        },

        /**
         * Add text content (shorthand for child with string)
         * @param {*} value
         * @returns {Builder}
         */
        text: function(value) {
            if (value != null) {
                this._children.push(text(String(value)));
            }
            return this;
        },

        /**
         * Append child (alias for child, for API parity with Dom)
         * @param {*} child - Child node (VNode, Builder, string, number)
         * @returns {Builder}
         */
        append: function(child) {
            return this.child(child);
        },

        /**
         * Prepend child at the beginning
         * @param {*} child - Child node (VNode, Builder, string, number)
         * @returns {Builder}
         */
        prepend: function(child) {
            if (child == null || child === false) return this;
            
            if (typeof child === 'string' || typeof child === 'number') {
                this._children.unshift(text(String(child)));
            } else if (child instanceof Builder) {
                child._parent = this;
                this._children.unshift(child);
            } else if (isVNode(child)) {
                this._children.unshift(child);
            }
            
            return this;
        },

        /**
         * Clear all children
         * @returns {Builder}
         */
        empty: function() {
            // Clear parent references
            for (var i = 0; i < this._children.length; i++) {
                var child = this._children[i];
                if (child instanceof Builder) {
                    child._parent = null;
                }
            }
            this._children = [];
            return this;
        },

        /**
         * Set value attribute (for form inputs)
         * @param {*} value
         * @returns {Builder}
         */
        val: function(value) {
            this._attrs.value = value;
            return this;
        },

        /**
         * Add trusted HTML content (use with caution)
         * @param {string} trustedHtml
         * @returns {Builder}
         */
        html: function(trustedHtml) {
            if (trustedHtml != null) {
                this._children.push({
                    type: TYPES.HTML,
                    value: trustedHtml,
                    _isVNode: true
                });
            }
            return this;
        },

        /**
         * Build the final VNode (converts Builders to VNodes recursively)
         * @returns {VNode}
         */
        build: function() {
            // Convert children - Builders become VNodes
            var builtChildren = [];
            for (var i = 0; i < this._children.length; i++) {
                var child = this._children[i];
                if (child instanceof Builder) {
                    builtChildren.push(child.build());
                } else {
                    builtChildren.push(child);
                }
            }
            
            var vnode = {
                type: TYPES.ELEMENT,
                tag: this._tag,
                attrs: this._attrs,
                children: builtChildren,
                key: this._key,
                _isVNode: true
            };
            return vnode;
        },

        // =====================================================================
        // Traversal Methods
        // =====================================================================

        /**
         * Get parent builder
         * @returns {Builder|null}
         */
        parent: function() {
            return this._parent;
        },

        /**
         * Find closest ancestor matching selector (tag, .class, or #id)
         * @param {string} selector - Simple selector (tag, .class, or #id)
         * @returns {Builder|null}
         */
        closest: function(selector) {
            var current = this._parent;
            while (current) {
                if (this._matchesSelector(current, selector)) {
                    return current;
                }
                current = current._parent;
            }
            return null;
        },

        /**
         * Get all sibling builders (excludes self)
         * @param {string} [selector] - Optional filter
         * @returns {Array<Builder>}
         */
        siblings: function(selector) {
            if (!this._parent) return [];
            var self = this;
            var siblings = [];
            for (var i = 0; i < this._parent._children.length; i++) {
                var child = this._parent._children[i];
                if (child instanceof Builder && child !== self) {
                    if (!selector || this._matchesSelector(child, selector)) {
                        siblings.push(child);
                    }
                }
            }
            return siblings;
        },

        /**
         * Get next sibling builder
         * @param {string} [selector] - Optional filter
         * @returns {Builder|null}
         */
        next: function(selector) {
            if (!this._parent) return null;
            var found = false;
            for (var i = 0; i < this._parent._children.length; i++) {
                var child = this._parent._children[i];
                if (found && child instanceof Builder) {
                    if (!selector || this._matchesSelector(child, selector)) {
                        return child;
                    }
                }
                if (child === this) {
                    found = true;
                }
            }
            return null;
        },

        /**
         * Get previous sibling builder
         * @param {string} [selector] - Optional filter
         * @returns {Builder|null}
         */
        prev: function(selector) {
            if (!this._parent) return null;
            var prev = null;
            for (var i = 0; i < this._parent._children.length; i++) {
                var child = this._parent._children[i];
                if (child === this) {
                    return prev;
                }
                if (child instanceof Builder) {
                    if (!selector || this._matchesSelector(child, selector)) {
                        prev = child;
                    }
                }
            }
            return null;
        },

        /**
         * Get index among siblings
         * @returns {number} 0-based index, or -1 if no parent
         */
        index: function() {
            if (!this._parent) return -1;
            for (var i = 0; i < this._parent._children.length; i++) {
                if (this._parent._children[i] === this) {
                    return i;
                }
            }
            return -1;
        },

        /**
         * Find all descendant builders matching selector
         * @param {string} selector - Simple selector (tag, .class, or #id)
         * @returns {Array<Builder>}
         */
        find: function(selector) {
            var results = [];
            this._findRecursive(this, selector, results);
            return results;
        },

        /**
         * Find first descendant builder matching selector
         * @param {string} selector - Simple selector (tag, .class, or #id)
         * @returns {Builder|null}
         */
        findOne: function(selector) {
            return this._findOneRecursive(this, selector);
        },

        /**
         * Alias for findOne
         * @param {string} selector
         * @returns {Builder|null}
         */
        one: function(selector) {
            return this.findOne(selector);
        },

        /**
         * Internal: recursive find
         * @private
         */
        _findRecursive: function(builder, selector, results) {
            for (var i = 0; i < builder._children.length; i++) {
                var child = builder._children[i];
                if (child instanceof Builder) {
                    if (this._matchesSelector(child, selector)) {
                        results.push(child);
                    }
                    this._findRecursive(child, selector, results);
                }
            }
        },

        /**
         * Internal: recursive findOne
         * @private
         */
        _findOneRecursive: function(builder, selector) {
            for (var i = 0; i < builder._children.length; i++) {
                var child = builder._children[i];
                if (child instanceof Builder) {
                    if (this._matchesSelector(child, selector)) {
                        return child;
                    }
                    var found = this._findOneRecursive(child, selector);
                    if (found) return found;
                }
            }
            return null;
        },

        /**
         * Internal: check if builder matches simple selector
         * @private
         */
        _matchesSelector: function(builder, selector) {
            if (!selector) return true;
            
            // Tag selector
            if (selector.charAt(0) !== '.' && selector.charAt(0) !== '#') {
                return builder._tag === selector;
            }
            
            // Class selector
            if (selector.charAt(0) === '.') {
                var className = selector.substring(1);
                var classes = (builder._attrs.class || '').split(/\s+/);
                return classes.indexOf(className) !== -1;
            }
            
            // ID selector
            if (selector.charAt(0) === '#') {
                var id = selector.substring(1);
                return builder._attrs.id === id;
            }
            
            return false;
        },

        // =====================================================================
        // Manipulation Methods
        // =====================================================================

        /**
         * Clone this builder (deep by default)
         * @param {boolean} [deep=true] - Clone children too
         * @returns {Builder}
         */
        clone: function(deep) {
            var cloned = new Builder(this._tag);
            // Copy attrs
            var keys = Object.keys(this._attrs);
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                var val = this._attrs[key];
                // Deep clone objects (like style)
                if (typeof val === 'object' && val !== null) {
                    cloned._attrs[key] = JSON.parse(JSON.stringify(val));
                } else {
                    cloned._attrs[key] = val;
                }
            }
            cloned._key = this._key;
            
            // Clone children if deep
            if (deep !== false) {
                for (var j = 0; j < this._children.length; j++) {
                    var child = this._children[j];
                    if (child instanceof Builder) {
                        var clonedChild = child.clone(true);
                        clonedChild._parent = cloned;
                        cloned._children.push(clonedChild);
                    } else if (isVNode(child)) {
                        // Deep clone VNode
                        cloned._children.push(JSON.parse(JSON.stringify(child)));
                    }
                }
            }
            
            return cloned;
        },

        /**
         * Replace this builder with another in parent's children
         * @param {Builder} replacement - New builder to take this one's place
         * @returns {Builder} The replacement builder
         */
        replaceWith: function(replacement) {
            if (!this._parent) return replacement;
            var idx = this.index();
            if (idx !== -1) {
                if (replacement instanceof Builder) {
                    replacement._parent = this._parent;
                }
                this._parent._children[idx] = replacement;
                this._parent = null;
            }
            return replacement;
        },

        /**
         * Remove this builder from parent
         * @returns {Builder} This builder (now orphaned)
         */
        remove: function() {
            if (!this._parent) return this;
            var idx = this.index();
            if (idx !== -1) {
                this._parent._children.splice(idx, 1);
                this._parent = null;
            }
            return this;
        },

        /**
         * Append this builder to a parent builder
         * @param {Builder} parent - Parent to append to
         * @returns {Builder} This builder
         */
        appendTo: function(parent) {
            if (parent instanceof Builder) {
                // Remove from current parent if exists
                if (this._parent) {
                    this.remove();
                }
                this._parent = parent;
                parent._children.push(this);
            }
            return this;
        },

        /**
         * Get style value (from attrs.style object)
         * @param {string} prop - CSS property name
         * @returns {string|undefined}
         */
        css: function(prop) {
            if (!this._attrs.style || typeof this._attrs.style !== 'object') {
                return undefined;
            }
            return this._attrs.style[prop];
        },

        /**
         * Check if this builder is valid (has a tag)
         * @returns {boolean}
         */
        exists: function() {
            return typeof this._tag === 'string' && this._tag.length > 0;
        },

        /**
         * Get raw builder (for API compatibility with Dom)
         * @returns {Builder}
         */
        raw: function() {
            return this;
        }
    };

    // =========================================================================
    // Tag Shorthand Methods
    // =========================================================================

    var TAGS = [
        // Structure
        'div', 'span', 'section', 'article', 'header', 'footer', 'nav', 'main', 'aside',
        // Text
        'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'small', 'code', 'pre', 'blockquote',
        // Lists
        'ul', 'ol', 'li', 'dl', 'dt', 'dd',
        // Tables
        'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
        // Forms
        'form', 'input', 'textarea', 'select', 'option', 'optgroup', 'button', 'label', 'fieldset', 'legend',
        // Media
        'img', 'video', 'audio', 'source', 'canvas', 'picture', 'figure', 'figcaption',
        // Interactive
        'a', 'details', 'summary', 'dialog',
        // Other
        'i', 'b', 'u', 's', 'br', 'hr', 'kbd', 'abbr', 'mark', 'time', 'progress', 'meter'
    ];

    /**
     * Create tag shorthand methods on Dom object
     * @param {Object} target - Object to add methods to
     */
    function createTagMethods(target) {
        for (var i = 0; i < TAGS.length; i++) {
            (function(tag) {
                target[tag] = function() {
                    return new Builder(tag);
                };
            })(TAGS[i]);
        }
    }

    // =========================================================================
    // Object Config API
    // =========================================================================

    /**
     * Create VNode from object configuration
     * @param {Object|string|Array} config
     * @returns {VNode}
     */
    function create(config) {
        // Handle string as text node
        if (typeof config === 'string') {
            return text(config);
        }

        // Handle array as fragment
        if (Array.isArray(config)) {
            return fragment(config.map(create));
        }

        // Handle null/undefined
        if (!config) {
            return null;
        }

        // Handle existing VNode
        if (isVNode(config)) {
            return config;
        }

        // Require tag
        if (!config.tag) {
            console.warn('[Funky.VDom] create() config requires tag property:', config);
            return null;
        }

        var attrs = {};

        // Direct class/id
        if (config.class != null) attrs.class = config.class;
        if (config.id != null) attrs.id = config.id;
        if (config.style != null) attrs.style = config.style;

        // Common attribute shorthands
        var shorthands = [
            'type', 'name', 'value', 'placeholder', 'href', 'src', 'alt', 'title',
            'role', 'tabindex', 'disabled', 'readonly', 'required', 'checked',
            'min', 'max', 'step', 'pattern', 'maxlength', 'minlength',
            'rows', 'cols', 'wrap', 'autocomplete', 'autofocus',
            'target', 'rel', 'download', 'action', 'method', 'enctype',
            'width', 'height', 'loading', 'decoding'
        ];
        for (var s = 0; s < shorthands.length; s++) {
            var shorthand = shorthands[s];
            if (config[shorthand] !== undefined) {
                attrs[shorthand] = config[shorthand];
            }
        }

        // Explicit attrs object (overrides shorthands)
        if (config.attrs) {
            var attrKeys = Object.keys(config.attrs);
            for (var a = 0; a < attrKeys.length; a++) {
                attrs[attrKeys[a]] = config.attrs[attrKeys[a]];
            }
        }

        // Data attributes
        if (config.data) {
            var dataKeys = Object.keys(config.data);
            for (var d = 0; d < dataKeys.length; d++) {
                attrs['data-' + dataKeys[d]] = config.data[dataKeys[d]];
            }
        }

        // Aria attributes
        if (config.aria) {
            var ariaKeys = Object.keys(config.aria);
            for (var ar = 0; ar < ariaKeys.length; ar++) {
                attrs['aria-' + ariaKeys[ar]] = config.aria[ariaKeys[ar]];
            }
        }

        // Event handlers
        if (config.on) {
            var eventKeys = Object.keys(config.on);
            for (var e = 0; e < eventKeys.length; e++) {
                attrs['on' + eventKeys[e]] = config.on[eventKeys[e]];
            }
        }

        // Build children
        var children = [];

        // Text content
        if (config.text !== undefined) {
            children.push(text(String(config.text)));
        }

        // Trusted HTML content
        if (config.html !== undefined) {
            children.push({
                type: TYPES.HTML,
                value: config.html,
                _isVNode: true
            });
        }

        // Child configs
        if (config.children) {
            for (var c = 0; c < config.children.length; c++) {
                var childVNode = create(config.children[c]);
                if (childVNode) {
                    children.push(childVNode);
                }
            }
        }

        return {
            type: TYPES.ELEMENT,
            tag: config.tag,
            attrs: attrs,
            children: children,
            key: config.key != null ? config.key : null,
            _isVNode: true
        };
    }

    // =========================================================================
    // Public API
    // =========================================================================

    var VDom = {
        // Core VNode creation
        h: h,
        text: text,
        fragment: fragment,
        html: html,

        // Object config API
        create: create,

        // Convenience helpers
        icon: icon,
        when: when,
        unless: unless,
        each: each,
        classes: classes,
        styles: styles,

        // Accessibility helpers
        srOnly: srOnly,
        liveRegion: liveRegion,
        label: label,
        formField: formField,
        actionButton: actionButton,
        submitButton: submitButton,
        iconButton: iconButton,
        skipTarget: skipTarget,
        searchBox: searchBox,
        progressBar: progressBar,
        loadingIndicator: loadingIndicator,
        alertBox: alertBox,
        dialog: dialog,

        // Rendering
        render: render,

        // Diffing
        diff: diff,
        patch: patch,

        // Utilities
        isVNode: isVNode,
        normalizeChildren: normalizeChildren,

        // Builder class (for advanced usage)
        Builder: Builder,

        // Constants (for advanced usage)
        TYPES: TYPES,
        PATCH_TYPES: PATCH_TYPES
    };

    // Add tag shorthand methods (div, span, etc.)
    createTagMethods(VDom);

    // Register module
    Funky.register('VDom', VDom);

})(window);

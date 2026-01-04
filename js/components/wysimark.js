/**
 * Funky.Wysimark
 * 
 * WYSIWYG Markdown editor component using Wysimark.
 * Provides visual editing with clean Markdown output.
 * 
 * @example
 * var editor = Funky.Wysimark.init('#editor', {
 *   initialMarkdown: '# Hello World',
 *   placeholder: 'Start typing...',
 *   onChange: function(markdown) {
 *     console.log('Content:', markdown);
 *   }
 * });
 */
(function(Funky) {
  'use strict';

  // Instance storage
  var instances = new WeakMap();

  // Default options
  var DEFAULTS = {
    initialMarkdown: '',
    placeholder: '',
    height: 'auto',
    minHeight: 200,
    maxHeight: null,
    readOnly: false,
    onChange: null,
    onFocus: null,
    onBlur: null
  };

  /**
   * Wysimark component
   */
  var Wysimark = {

    /**
     * Create a new Wysimark editor instance (primary factory method)
     * @param {string|Element} selector - CSS selector or DOM element
     * @param {Object} options - Configuration options
     * @returns {Object} Editor instance with methods
     */
    init: function(selector, options) {
      // Resolve element
      var container = typeof selector === 'string' 
        ? document.querySelector(selector) 
        : selector;

      if (!container) {
        console.error('[Funky.Wysimark] Container not found:', selector);
        return null;
      }

      // Check if already initialized
      if (instances.has(container)) {
        console.warn('[Funky.Wysimark] Already initialized on element');
        return instances.get(container);
      }

      // Check if createWysimark is available
      if (typeof window.createWysimark !== 'function') {
        console.error('[Funky.Wysimark] Wysimark library not loaded. Include wysmark.js before this component.');
        return null;
      }

      // Merge options
      var opts = Object.assign({}, DEFAULTS, options);

      // Create wrapper
      var wrapper = document.createElement('div');
      wrapper.className = 'funky-wysimark';
      
      if (opts.readOnly) {
        wrapper.classList.add('funky-wysimark--readonly');
      }

      if (opts.height !== 'auto') {
        wrapper.classList.add('funky-wysimark--fixed');
      }

      // Create editor container
      var editorEl = document.createElement('div');
      editorEl.className = 'funky-wysimark-editor';
      wrapper.appendChild(editorEl);

      // Apply height styles
      if (opts.height !== 'auto') {
        var h = typeof opts.height === 'number' ? opts.height + 'px' : opts.height;
        wrapper.style.height = h;
      }

      if (opts.minHeight) {
        wrapper.style.minHeight = opts.minHeight + 'px';
      }

      if (opts.maxHeight) {
        wrapper.style.maxHeight = opts.maxHeight + 'px';
        wrapper.style.overflowY = 'auto';
      }

      // Insert wrapper
      container.appendChild(wrapper);

      // Create Wysimark editor
      var wysimarkInstance = window.createWysimark(editorEl, {
        initialMarkdown: opts.initialMarkdown || '',
        placeholder: opts.placeholder || '',
        onChange: function(markdown) {
          if (opts.onChange) {
            opts.onChange(markdown);
          }
          // Dispatch custom event
          container.dispatchEvent(new CustomEvent('funky.wysimark.change', {
            bubbles: true,
            detail: { markdown: markdown }
          }));
        }
      });

      // Track focus/blur via wrapper
      wrapper.addEventListener('focusin', function() {
        if (opts.onFocus) opts.onFocus();
        container.dispatchEvent(new CustomEvent('funky.wysimark.focus', { bubbles: true }));
      });

      wrapper.addEventListener('focusout', function(e) {
        // Check if focus left the editor entirely
        if (!wrapper.contains(e.relatedTarget)) {
          if (opts.onBlur) opts.onBlur();
          container.dispatchEvent(new CustomEvent('funky.wysimark.blur', { bubbles: true }));
        }
      });

      // Create instance object
      var instance = {
        element: container,
        wrapper: wrapper,
        _wysimark: wysimarkInstance,
        options: opts,

        /**
         * Get Markdown content
         * @returns {string} Markdown content
         */
        getMarkdown: function() {
          return wysimarkInstance.getMarkdown();
        },

        /**
         * Set Markdown content
         * @param {string} markdown - Markdown content
         */
        setMarkdown: function(markdown) {
          wysimarkInstance.setMarkdown(markdown || '');
        },

        /**
         * Check if editor is empty
         * @returns {boolean}
         */
        isEmpty: function() {
          var md = this.getMarkdown();
          return !md || md.trim() === '';
        },

        /**
         * Focus the editor
         */
        focus: function() {
          var editable = wrapper.querySelector('[contenteditable="true"]');
          if (editable) {
            editable.focus();
          }
        },

        /**
         * Destroy the editor instance
         */
        destroy: function() {
          if (wysimarkInstance && typeof wysimarkInstance.unmount === 'function') {
            wysimarkInstance.unmount();
          }
          if (wrapper.parentNode) {
            wrapper.parentNode.removeChild(wrapper);
          }
          instances.delete(container);
          container.dispatchEvent(new CustomEvent('funky.wysimark.destroy', { bubbles: true }));
        }
      };

      // Store instance
      instances.set(container, instance);

      // Dispatch ready event
      container.dispatchEvent(new CustomEvent('funky.wysimark.ready', {
        bubbles: true,
        detail: { instance: instance }
      }));

      return instance;
    },

    /**
     * @deprecated Use Wysimark.init() instead
     */
    create: function(selector, options) {
      if (Funky.debug) {
        console.warn('[Funky.Wysimark] create() is deprecated. Use init() instead.');
      }
      return Wysimark.init(selector, options);
    },

    /**
     * Get instance for an element
     * @param {string|Element} selector - CSS selector or DOM element
     * @returns {Object|null} Instance or null
     */
    getInstance: function(selector) {
      var el = typeof selector === 'string' 
        ? document.querySelector(selector) 
        : selector;
      return el ? instances.get(el) || null : null;
    },

    /**
     * Destroy instance for an element
     * @param {string|Element} selector - CSS selector or DOM element
     */
    destroy: function(selector) {
      var instance = Wysimark.getInstance(selector);
      if (instance) {
        instance.destroy();
      }
    },

    /**
     * Destroy all instances
     */
    destroyAll: function() {
      // WeakMap doesn't support iteration, so we need to track elements separately
      // For now, this is a no-op since we use WeakMap
      console.warn('[Funky.Wysimark] destroyAll() not fully supported with WeakMap storage');
    },

    /**
     * Initialize all elements with data-wysimark attribute
     * @returns {Array} Array of created instances
     */
    initAll: function() {
      var elements = document.querySelectorAll('[data-wysimark]');
      var created = [];

      elements.forEach(function(el) {
        if (instances.has(el)) return;

        var opts = {};
        
        // Parse data attributes
        if (el.dataset.wysimarkMarkdown) {
          opts.initialMarkdown = el.dataset.wysimarkMarkdown;
        }
        if (el.dataset.wysimarkPlaceholder) {
          opts.placeholder = el.dataset.wysimarkPlaceholder;
        }
        if (el.dataset.wysimarkHeight) {
          opts.height = isNaN(el.dataset.wysimarkHeight) 
            ? el.dataset.wysimarkHeight 
            : parseInt(el.dataset.wysimarkHeight, 10);
        }
        if (el.dataset.wysimarkMinHeight) {
          opts.minHeight = parseInt(el.dataset.wysimarkMinHeight, 10);
        }
        if (el.dataset.wysimarkMaxHeight) {
          opts.maxHeight = parseInt(el.dataset.wysimarkMaxHeight, 10);
        }
        if (el.dataset.wysimarkReadonly !== undefined) {
          opts.readOnly = el.dataset.wysimarkReadonly !== 'false';
        }

        var instance = Wysimark.init(el, opts);
        if (instance) created.push(instance);
      });

      return created;
    }
  };

  // Expose to Funky namespace
  if (Funky.register) {
    Funky.register('Wysimark', Wysimark);
  }

})(window.Funky = window.Funky || {});

/**
 * Funky.Truncate - Text Truncation Component
 * Smart text truncation with show more/less toggle
 * @module Funky.Truncate
 * @version 1.0.1
 */
(function(window) {
  'use strict';

  // Ensure Funky registry exists
  if (!window.Funky || !window.Funky.register) {
    console.error('[Funky.Truncate] Registry not found. Load namespace.js first.');
    return;
  }

  var Funky = window.Funky;

  // Guard against double registration
  if (Funky.Truncate) {
    return;
  }

  // ==========================================================================
  // DEFAULTS
  // ==========================================================================

  var DEFAULTS = {
    limit: 100,
    lines: null,
    moreText: 'Show more',
    lessText: 'Show less',
    ellipsis: '...',
    animate: true,
    inline: false,
    expandedClass: 'expanded'
  };

  // ==========================================================================
  // INTERNAL TRACKING
  // ==========================================================================

  var instances = new WeakMap();

  // ==========================================================================
  // HELPER FUNCTIONS
  // ==========================================================================

  function getElement(selectorOrElement) {
    if (typeof selectorOrElement === 'string') {
      return document.querySelector(selectorOrElement);
    }
    return selectorOrElement;
  }

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function truncateAtWord(text, limit) {
    if (text.length <= limit) return text;
    var truncated = text.substr(0, limit);
    var lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > limit * 0.8) {
      truncated = truncated.substr(0, lastSpace);
    }
    return truncated;
  }

  // ==========================================================================
  // TRUNCATE INSTANCE
  // ==========================================================================

  function TruncateInstance(element, options) {
    this.element = element;
    this.options = Object.assign({}, DEFAULTS, options);
    this.originalText = element.textContent;
    this.isExpanded = false;
    this.toggleEl = null;
    this.truncatedText = '';
    this.init();
  }

  TruncateInstance.prototype.init = function() {
    var opts = this.options;
    var text = this.originalText;

    // Check if truncation needed
    if (opts.lines) {
      this.initLineClamp();
    } else if (text.length > opts.limit) {
      this.initCharLimit();
    }
  };

  TruncateInstance.prototype.initLineClamp = function() {
    var el = this.element;
    var opts = this.options;

    el.classList.add('funky-truncate', 'funky-truncate-lines');
    el.classList.add('funky-truncate-lines-' + Math.min(opts.lines, 5));
    
    if (opts.animate) {
      el.classList.add('animate');
    }

    // Check if content is actually clamped (needs to be in DOM first)
    var self = this;
    requestAnimationFrame(function() {
      if (el.scrollHeight > el.clientHeight + 2) {
        self.addToggle();
      }
    });
  };

  TruncateInstance.prototype.initCharLimit = function() {
    var el = this.element;
    var opts = this.options;
    var text = this.originalText;

    var truncated = truncateAtWord(text, opts.limit);
    this.truncatedText = truncated;

    el.classList.add('funky-truncate');
    if (opts.inline) {
      el.classList.add('funky-truncate-inline');
    } else {
      el.classList.add('funky-truncate-block');
    }
    
    if (opts.animate) {
      el.classList.add('animate');
    }

    this.render();
  };

  TruncateInstance.prototype.render = function() {
    var el = this.element;
    var opts = this.options;

    if (this.isExpanded) {
      el.innerHTML = escapeHtml(this.originalText) + ' ' + this.createToggleHtml(opts.lessText);
      el.classList.add(opts.expandedClass);
    } else {
      el.innerHTML = escapeHtml(this.truncatedText) + 
        '<span class="funky-truncate-ellipsis">' + escapeHtml(opts.ellipsis) + '</span> ' + 
        this.createToggleHtml(opts.moreText);
      el.classList.remove(opts.expandedClass);
    }

    this.bindToggle();
  };

  TruncateInstance.prototype.addToggle = function() {
    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'funky-truncate-toggle';
    toggle.textContent = this.options.moreText;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', this.element.id || '');

    // Add toggle after the element or append to parent
    if (this.element.nextSibling) {
      this.element.parentNode.insertBefore(toggle, this.element.nextSibling);
    } else {
      this.element.parentNode.appendChild(toggle);
    }

    this.toggleEl = toggle;
    this.bindToggle();
  };

  TruncateInstance.prototype.createToggleHtml = function(text) {
    var expanded = this.isExpanded ? 'true' : 'false';
    return '<button type="button" class="funky-truncate-toggle" aria-expanded="' + expanded + '">' + escapeHtml(text) + '</button>';
  };

  TruncateInstance.prototype.bindToggle = function() {
    var self = this;
    var toggle = this.toggleEl || this.element.querySelector('.funky-truncate-toggle');
    if (toggle) {
      toggle.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        self.toggle();
      };
    }
  };

  TruncateInstance.prototype.toggle = function() {
    if (this.isExpanded) {
      this.collapse();
    } else {
      this.expand();
    }
    return this;
  };

  TruncateInstance.prototype.expand = function() {
    this.isExpanded = true;
    var opts = this.options;

    if (opts.lines) {
      this.element.classList.add(opts.expandedClass);
      if (this.toggleEl) {
        this.toggleEl.textContent = opts.lessText;
        this.toggleEl.setAttribute('aria-expanded', 'true');
      }
    } else {
      this.render();
    }

    // Announce expansion to screen readers
    if (Funky.Announce) {
      Funky.Announce.polite('Text expanded');
    }

    this.element.dispatchEvent(new CustomEvent('funky.truncate.expand', { bubbles: true }));
    return this;
  };

  TruncateInstance.prototype.collapse = function() {
    this.isExpanded = false;
    var opts = this.options;

    if (opts.lines) {
      this.element.classList.remove(opts.expandedClass);
      if (this.toggleEl) {
        this.toggleEl.textContent = opts.moreText;
        this.toggleEl.setAttribute('aria-expanded', 'false');
      }
    } else {
      this.render();
    }

    // Announce collapse to screen readers
    if (Funky.Announce) {
      Funky.Announce.polite('Text collapsed');
    }

    this.element.dispatchEvent(new CustomEvent('funky.truncate.collapse', { bubbles: true }));
    return this;
  };

  TruncateInstance.prototype.destroy = function() {
    // Remove external toggle if exists
    if (this.toggleEl && this.toggleEl.parentNode) {
      this.toggleEl.parentNode.removeChild(this.toggleEl);
    }
    
    // Restore original text
    this.element.textContent = this.originalText;
    
    // Remove classes
    this.element.classList.remove('funky-truncate', 'funky-truncate-lines', 
      'funky-truncate-inline', 'funky-truncate-block', 'animate',
      this.options.expandedClass);
    for (var i = 1; i <= 5; i++) {
      this.element.classList.remove('funky-truncate-lines-' + i);
    }
  };

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  var Truncate = {};

  /**
   * Apply truncation to an element
   * @param {string|Element} selector - CSS selector or DOM element
   * @param {Object} options - Configuration options
   * @returns {TruncateInstance} Instance
   */
  Truncate.apply = function(selector, options) {
    var el = getElement(selector);
    if (!el) {
      console.warn('Truncate.apply: Element not found:', selector);
      return null;
    }

    // Destroy existing if present
    Truncate.destroy(selector);

    var instance = new TruncateInstance(el, options);
    instances.set(el, instance);

    return instance;
  };

  /**
   * Expand truncated text
   * @param {string|Element} selector
   */
  Truncate.expand = function(selector) {
    var el = getElement(selector);
    var instance = el && instances.get(el);
    if (instance) {
      instance.expand();
    }
  };

  /**
   * Collapse text back to truncated state
   * @param {string|Element} selector
   */
  Truncate.collapse = function(selector) {
    var el = getElement(selector);
    var instance = el && instances.get(el);
    if (instance) {
      instance.collapse();
    }
  };

  /**
   * Toggle between expanded and collapsed
   * @param {string|Element} selector
   */
  Truncate.toggle = function(selector) {
    var el = getElement(selector);
    var instance = el && instances.get(el);
    if (instance) {
      instance.toggle();
    }
  };

  /**
   * Remove truncation and restore original text
   * @param {string|Element} selector
   */
  Truncate.destroy = function(selector) {
    var el = getElement(selector);
    var instance = el && instances.get(el);
    if (instance) {
      instance.destroy();
      instances.delete(el);
    }
  };

  /**
   * Check if text is currently expanded
   * @param {string|Element} selector
   * @returns {boolean}
   */
  Truncate.isExpanded = function(selector) {
    var el = getElement(selector);
    var instance = el && instances.get(el);
    return instance ? instance.isExpanded : false;
  };

  /**
   * Utility: Truncate a text string
   * @param {string} text - Text to truncate
   * @param {number} limit - Character limit
   * @param {string} ellipsis - Ellipsis string
   * @returns {string} Truncated text
   */
  Truncate.text = function(text, limit, ellipsis) {
    if (!text || text.length <= limit) return text;
    return truncateAtWord(text, limit) + (ellipsis || '...');
  };

  /**
   * Auto-initialize from data attributes
   * @param {Element} container - Container to search within
   */
  Truncate.initAll = function(container) {
    container = container || document;
    
    // data-truncate="100" (character limit)
    var charEls = container.querySelectorAll('[data-truncate]');
    for (var i = 0; i < charEls.length; i++) {
      var el = charEls[i];
      var limit = parseInt(el.dataset.truncate, 10);
      if (limit > 0) {
        Truncate.apply(el, { limit: limit });
      }
    }

    // data-truncate-lines="3"
    var lineEls = container.querySelectorAll('[data-truncate-lines]');
    for (var j = 0; j < lineEls.length; j++) {
      var lineEl = lineEls[j];
      var lines = parseInt(lineEl.dataset.truncateLines, 10);
      if (lines > 0) {
        Truncate.apply(lineEl, { lines: lines });
      }
    }
  };

  // Alias for API consistency
  Truncate.init = Truncate.apply;

  // ==========================================================================
  // EXPORT
  // ==========================================================================

  // Register with Funky securely
  Funky.register('Truncate', Truncate);

})(window);

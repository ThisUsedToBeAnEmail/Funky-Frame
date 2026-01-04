/**
 * Funky.Highlight - Text Highlighting Component
 * Highlight search terms and keywords in content
 * @module Funky.Highlight
 * @version 1.0.0
 */
(function(window) {
  'use strict';

  // Ensure Funky registry exists
  if (!window.Funky || !window.Funky.register) {
    console.error('[Funky.Highlight] Registry not found. Load namespace.js first.');
    return;
  }

  var Funky = window.Funky;

  // Guard against double registration
  if (Funky.Highlight) {
    return;
  }

  // ==========================================================================
  // DEFAULTS
  // ==========================================================================

  var DEFAULTS = {
    className: 'funky-highlight',
    currentClass: 'funky-highlight-current',
    caseSensitive: false,
    wholeWord: false,
    maxMatches: 1000,
    animate: true
  };

  // ==========================================================================
  // INTERNAL STATE
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

  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function escapeHtml(str) {
    if (!str) return '';
    if (Funky.Util && Funky.Util.escapeHtml) {
      return Funky.Util.escapeHtml(str);
    }
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ==========================================================================
  // HIGHLIGHT INSTANCE
  // ==========================================================================

  function HighlightInstance(element, terms, options) {
    this.element = element;
    this.terms = Array.isArray(terms) ? terms.filter(Boolean) : [terms].filter(Boolean);
    this.options = Object.assign({}, DEFAULTS, options);
    this.matches = [];
    this.currentIndex = -1;
    this.originalHTML = element.innerHTML;
    
    if (this.terms.length > 0) {
      this.highlight();
    }
  }

  HighlightInstance.prototype.highlight = function() {
    var self = this;
    var opts = this.options;
    var matchCount = 0;

    // Restore original first
    this.element.innerHTML = this.originalHTML;
    this.matches = [];
    this.currentIndex = -1;

    // Process each term
    this.terms.forEach(function(term, termIndex) {
      if (!term || term.length === 0) return;
      if (matchCount >= opts.maxMatches) return;

      var textNodes = self.getTextNodes(self.element);
      
      textNodes.forEach(function(textNode) {
        if (matchCount >= opts.maxMatches) return;
        
        var text = textNode.textContent;
        var pattern = self.buildPattern(term);
        var match;
        var replacements = [];

        // Reset lastIndex for global regex
        pattern.lastIndex = 0;

        while ((match = pattern.exec(text)) !== null && matchCount < opts.maxMatches) {
          replacements.push({
            start: match.index,
            end: match.index + match[0].length,
            text: match[0],
            termIndex: termIndex
          });
          matchCount++;
          
          // Prevent infinite loop for zero-length matches
          if (match[0].length === 0) break;
        }

        if (replacements.length > 0) {
          self.replaceMatches(textNode, replacements);
        }
      });
    });

    // Collect all highlight elements
    this.matches = Array.prototype.slice.call(
      this.element.querySelectorAll('.' + opts.className)
    );
  };

  HighlightInstance.prototype.getTextNodes = function(node) {
    var textNodes = [];
    var walker = document.createTreeWalker(
      node,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          // Skip script and style elements
          var parent = node.parentNode;
          if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) {
            return NodeFilter.FILTER_REJECT;
          }
          // Skip already highlighted elements
          if (parent && parent.classList && parent.classList.contains('funky-highlight')) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      },
      false
    );

    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    return textNodes;
  };

  HighlightInstance.prototype.buildPattern = function(term) {
    var escaped = escapeRegExp(term);
    var pattern = this.options.wholeWord ? '\\b' + escaped + '\\b' : escaped;
    var flags = this.options.caseSensitive ? 'g' : 'gi';
    return new RegExp(pattern, flags);
  };

  HighlightInstance.prototype.replaceMatches = function(textNode, replacements) {
    var opts = this.options;
    var fragment = document.createDocumentFragment();
    var text = textNode.textContent;
    var lastEnd = 0;

    // Sort by start position
    replacements.sort(function(a, b) { return a.start - b.start; });

    replacements.forEach(function(r) {
      // Text before match
      if (r.start > lastEnd) {
        fragment.appendChild(document.createTextNode(text.slice(lastEnd, r.start)));
      }

      // Highlighted match
      var mark = document.createElement('mark');
      mark.className = opts.className + (opts.animate ? ' animate' : '');
      mark.setAttribute('data-term-index', r.termIndex);
      mark.textContent = r.text;
      fragment.appendChild(mark);

      lastEnd = r.end;
    });

    // Text after last match
    if (lastEnd < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastEnd)));
    }

    if (textNode.parentNode) {
      textNode.parentNode.replaceChild(fragment, textNode);
    }
  };

  HighlightInstance.prototype.next = function() {
    if (this.matches.length === 0) return null;
    
    // Remove current from previous
    if (this.currentIndex >= 0 && this.matches[this.currentIndex]) {
      this.matches[this.currentIndex].classList.remove(this.options.currentClass);
    }

    this.currentIndex = (this.currentIndex + 1) % this.matches.length;
    var current = this.matches[this.currentIndex];
    current.classList.add(this.options.currentClass);
    
    if (this.options.animate) {
      current.classList.add('animate');
    }
    
    this.scrollIntoView(current);
    
    this.element.dispatchEvent(new CustomEvent('funky.highlight.navigate', {
      bubbles: true,
      detail: { index: this.currentIndex, total: this.matches.length, element: current }
    }));

    // Announce to screen readers
    if (Funky.Announce) {
      Funky.Announce.polite('Match ' + (this.currentIndex + 1) + ' of ' + this.matches.length);
    }

    return current;
  };

  HighlightInstance.prototype.prev = function() {
    if (this.matches.length === 0) return null;

    if (this.currentIndex >= 0 && this.matches[this.currentIndex]) {
      this.matches[this.currentIndex].classList.remove(this.options.currentClass);
    }

    this.currentIndex = this.currentIndex <= 0 ? this.matches.length - 1 : this.currentIndex - 1;
    var current = this.matches[this.currentIndex];
    current.classList.add(this.options.currentClass);

    if (this.options.animate) {
      current.classList.add('animate');
    }

    this.scrollIntoView(current);

    this.element.dispatchEvent(new CustomEvent('funky.highlight.navigate', {
      bubbles: true,
      detail: { index: this.currentIndex, total: this.matches.length, element: current }
    }));

    // Announce to screen readers
    if (Funky.Announce) {
      Funky.Announce.polite('Match ' + (this.currentIndex + 1) + ' of ' + this.matches.length);
    }

    return current;
  };

  HighlightInstance.prototype.scrollIntoView = function(el) {
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  HighlightInstance.prototype.scrollToFirst = function() {
    this.currentIndex = -1;
    return this.next();
  };

  HighlightInstance.prototype.goTo = function(index) {
    if (index < 0 || index >= this.matches.length) return null;
    
    if (this.currentIndex >= 0 && this.matches[this.currentIndex]) {
      this.matches[this.currentIndex].classList.remove(this.options.currentClass);
    }
    
    this.currentIndex = index;
    var current = this.matches[this.currentIndex];
    current.classList.add(this.options.currentClass);
    this.scrollIntoView(current);
    
    return current;
  };

  HighlightInstance.prototype.clear = function() {
    this.element.innerHTML = this.originalHTML;
    this.matches = [];
    this.currentIndex = -1;
  };

  HighlightInstance.prototype.getCount = function() {
    return this.matches.length;
  };

  HighlightInstance.prototype.getCurrentIndex = function() {
    return this.currentIndex;
  };

  HighlightInstance.prototype.getMatches = function() {
    return this.matches;
  };

  // ==========================================================================
  // FUZZY HIGHLIGHT INSTANCE
  // ==========================================================================

  function FuzzyHighlightInstance(element, query, options, threshold) {
    this.element = element;
    this.query = query;
    this.options = Object.assign({}, DEFAULTS, options);
    this.threshold = threshold;
    this.matches = [];
    this.currentIndex = -1;
    this.originalHTML = element.innerHTML;
    
    if (this.query && this.query.length > 0) {
      this.highlight();
    }
  }

  FuzzyHighlightInstance.prototype.highlight = function() {
    var self = this;
    var opts = this.options;
    var FuzzySearch = Funky.FuzzySearch;
    
    // Restore original
    this.element.innerHTML = this.originalHTML;
    this.matches = [];
    this.currentIndex = -1;
    
    if (!FuzzySearch) return;
    
    var textNodes = this.getTextNodes(this.element);
    var matchCount = 0;
    
    textNodes.forEach(function(textNode) {
      if (matchCount >= opts.maxMatches) return;
      
      var text = textNode.textContent;
      var result = FuzzySearch.match(self.query, text, {
        caseSensitive: opts.caseSensitive
      });
      
      if (!result || result.score < self.threshold) return;
      
      // Convert positions to replacements format
      var replacements = result.matches.map(function(pos) {
        return {
          start: pos[0],
          end: pos[1] + 1,
          text: text.slice(pos[0], pos[1] + 1),
          termIndex: 0
        };
      });
      
      if (replacements.length > 0) {
        self.replaceMatches(textNode, replacements);
        matchCount += replacements.length;
      }
    });
    
    // Collect highlight elements
    this.matches = Array.prototype.slice.call(
      this.element.querySelectorAll('.' + opts.className)
    );
  };

  // Inherit methods from HighlightInstance
  FuzzyHighlightInstance.prototype.getTextNodes = HighlightInstance.prototype.getTextNodes;
  FuzzyHighlightInstance.prototype.replaceMatches = HighlightInstance.prototype.replaceMatches;
  FuzzyHighlightInstance.prototype.next = HighlightInstance.prototype.next;
  FuzzyHighlightInstance.prototype.prev = HighlightInstance.prototype.prev;
  FuzzyHighlightInstance.prototype.scrollIntoView = HighlightInstance.prototype.scrollIntoView;
  FuzzyHighlightInstance.prototype.scrollToFirst = HighlightInstance.prototype.scrollToFirst;
  FuzzyHighlightInstance.prototype.goTo = HighlightInstance.prototype.goTo;
  FuzzyHighlightInstance.prototype.clear = HighlightInstance.prototype.clear;
  FuzzyHighlightInstance.prototype.getCount = HighlightInstance.prototype.getCount;
  FuzzyHighlightInstance.prototype.getCurrentIndex = HighlightInstance.prototype.getCurrentIndex;
  FuzzyHighlightInstance.prototype.getMatches = HighlightInstance.prototype.getMatches;

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  var Highlight = {};

  /**
   * Apply highlighting to an element
   * @param {string|Element} selector - CSS selector or DOM element
   * @param {string|string[]} terms - Term(s) to highlight
   * @param {Object} options - Configuration options
   * @returns {HighlightInstance} Instance
   */
  Highlight.apply = function(selector, terms, options) {
    var el = getElement(selector);
    if (!el) {
      console.warn('Highlight.apply: Element not found:', selector);
      return null;
    }

    // Clear existing highlights
    Highlight.clear(el);

    var instance = new HighlightInstance(el, terms, options);
    instances.set(el, instance);
    
    el.dispatchEvent(new CustomEvent('funky.highlight.applied', {
      bubbles: true,
      detail: { count: instance.getCount(), terms: instance.terms }
    }));

    // Announce to screen readers
    if (Funky.Announce) {
      var count = instance.getCount();
      if (count > 0) {
        Funky.Announce.polite('Found ' + count + ' match' + (count === 1 ? '' : 'es'));
      } else {
        Funky.Announce.polite('No matches found');
      }
    }

    return instance;
  };

  /**
   * Clear highlights from element
   * @param {string|Element} selector
   */
  Highlight.clear = function(selector) {
    var el = getElement(selector);
    var instance = el && instances.get(el);
    if (instance) {
      instance.clear();
      instances.delete(el);
      
      el.dispatchEvent(new CustomEvent('funky.highlight.cleared', { bubbles: true }));
    }
  };

  /**
   * Navigate to next match
   * @param {string|Element} selector
   * @returns {Element|null} Current match element
   */
  Highlight.next = function(selector) {
    var el = getElement(selector);
    var instance = el && instances.get(el);
    return instance ? instance.next() : null;
  };

  /**
   * Navigate to previous match
   * @param {string|Element} selector
   * @returns {Element|null} Current match element
   */
  Highlight.prev = function(selector) {
    var el = getElement(selector);
    var instance = el && instances.get(el);
    return instance ? instance.prev() : null;
  };

  /**
   * Scroll to first match
   * @param {string|Element} selector
   * @returns {Element|null} First match element
   */
  Highlight.scrollToFirst = function(selector) {
    var el = getElement(selector);
    var instance = el && instances.get(el);
    return instance ? instance.scrollToFirst() : null;
  };

  /**
   * Go to specific match by index
   * @param {string|Element} selector
   * @param {number} index - Match index (0-based)
   * @returns {Element|null} Match element
   */
  Highlight.goTo = function(selector, index) {
    var el = getElement(selector);
    var instance = el && instances.get(el);
    return instance ? instance.goTo(index) : null;
  };

  /**
   * Count matches in element
   * @param {string|Element} selector
   * @param {string|string[]} [terms] - Optional terms (uses existing if omitted)
   * @param {Object} [options] - Options
   * @returns {number} Match count
   */
  Highlight.count = function(selector, terms, options) {
    var el = getElement(selector);
    if (!el) return 0;
    
    var instance = instances.get(el);
    
    // If no terms provided and instance exists, return existing count
    if (!terms && instance) {
      return instance.getCount();
    }
    
    // If terms provided, create temp instance for counting
    if (terms) {
      var tempInstance = new HighlightInstance(el, terms, options);
      var count = tempInstance.getCount();
      tempInstance.clear();
      return count;
    }
    
    return 0;
  };

  /**
   * Get current match index
   * @param {string|Element} selector
   * @returns {number} Current index (-1 if none)
   */
  Highlight.getCurrentIndex = function(selector) {
    var el = getElement(selector);
    var instance = el && instances.get(el);
    return instance ? instance.getCurrentIndex() : -1;
  };

  /**
   * Utility: Mark text string (returns HTML)
   * @param {string} text - Text to mark
   * @param {string|string[]} terms - Terms to highlight
   * @param {Object} [options] - Options
   * @returns {string} HTML string with marked terms
   */
  Highlight.mark = function(text, terms, options) {
    if (!text) return '';
    
    var opts = Object.assign({}, DEFAULTS, options);
    var termsArray = Array.isArray(terms) ? terms : [terms];
    var result = text;

    // Escape HTML first
    result = result
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    termsArray.forEach(function(term, index) {
      if (!term) return;
      var escaped = escapeRegExp(term);
      var pattern = opts.wholeWord ? '\\b' + escaped + '\\b' : escaped;
      var flags = opts.caseSensitive ? 'g' : 'gi';
      var regex = new RegExp('(' + pattern + ')', flags);
      result = result.replace(regex, '<mark class="' + opts.className + '" data-term-index="' + index + '">$1</mark>');
    });

    return result;
  };

  /**
   * Mark text with position array (for FuzzySearch integration)
   * @param {string} text - Text to mark
   * @param {Array} positions - Array of [start, end] tuples from FuzzySearch
   * @param {Object} [options] - Options
   * @returns {string} HTML string with marked positions
   */
  Highlight.markWithPositions = function(text, positions, options) {
    if (!text) return '';
    if (!positions || !positions.length) {
      return escapeHtml(text);
    }
    
    var opts = Object.assign({}, DEFAULTS, options);
    var tagName = opts.tagName || 'mark';
    var prefix = options && options.prefix ? options.prefix : '<' + tagName + ' class="' + opts.className + '">';
    var suffix = options && options.suffix ? options.suffix : '</' + tagName + '>';
    
    // Normalize positions to {start, end} format and sort
    var normalized = positions.map(function(pos) {
      if (Array.isArray(pos)) {
        return { start: pos[0], end: pos[1] };
      }
      return pos;
    }).sort(function(a, b) {
      return a.start - b.start;
    });
    
    // Merge consecutive/overlapping positions
    var merged = [];
    normalized.forEach(function(pos) {
      var last = merged[merged.length - 1];
      if (last && pos.start <= last.end + 1) {
        // Extend previous range
        last.end = Math.max(last.end, pos.end);
      } else {
        merged.push({ start: pos.start, end: pos.end });
      }
    });
    
    // Build result
    var result = '';
    var lastEnd = 0;
    
    merged.forEach(function(pos) {
      // Text before match (escaped)
      if (pos.start > lastEnd) {
        result += escapeHtml(text.slice(lastEnd, pos.start));
      }
      // Highlighted match
      result += prefix + escapeHtml(text.slice(pos.start, pos.end + 1)) + suffix;
      lastEnd = pos.end + 1;
    });
    
    // Text after last match
    if (lastEnd < text.length) {
      result += escapeHtml(text.slice(lastEnd));
    }
    
    return result;
  };

  /**
   * Alias for markWithPositions (for components using Funky.Highlight.fromMatches)
   */
  Highlight.fromMatches = Highlight.markWithPositions;

  /**
   * Fuzzy mark text (combines FuzzySearch + highlighting)
   * @param {string} query - Search query
   * @param {string} text - Text to highlight
   * @param {Object} [options] - Options (threshold, className, etc.)
   * @returns {string} HTML string with fuzzy matches highlighted
   */
  Highlight.fuzzyMark = function(query, text, options) {
    if (!text) return '';
    if (!query) return escapeHtml(text);
    
    // Check if FuzzySearch is available
    if (!Funky.FuzzySearch) {
      console.warn('Highlight.fuzzyMark: Funky.FuzzySearch not loaded, falling back to mark()');
      return Highlight.mark(text, query, options);
    }
    
    var opts = Object.assign({}, DEFAULTS, options);
    var fuzzyOpts = {
      caseSensitive: opts.caseSensitive
    };
    
    var result = Funky.FuzzySearch.match(query, text, fuzzyOpts);
    
    // Check threshold
    var threshold = options && typeof options.threshold === 'number' ? options.threshold : 0;
    if (!result || result.score < threshold) {
      return escapeHtml(text);
    }
    
    return Highlight.markWithPositions(text, result.matches, options);
  };

  /**
   * Apply fuzzy highlighting to DOM element
   * @param {string|Element} selector - CSS selector or DOM element
   * @param {string} query - Search query
   * @param {Object} [options] - Options
   * @returns {HighlightInstance|null} Instance
   */
  Highlight.fuzzyApply = function(selector, query, options) {
    var el = getElement(selector);
    if (!el) {
      console.warn('Highlight.fuzzyApply: Element not found:', selector);
      return null;
    }
    
    if (!Funky.FuzzySearch) {
      console.warn('Highlight.fuzzyApply: Funky.FuzzySearch not loaded, falling back to apply()');
      return Highlight.apply(selector, query, options);
    }
    
    // Clear existing
    Highlight.clear(el);
    
    var opts = Object.assign({}, DEFAULTS, options);
    var threshold = options && typeof options.threshold === 'number' ? options.threshold : 0.3;
    
    // Create fuzzy-aware instance
    var instance = new FuzzyHighlightInstance(el, query, opts, threshold);
    instances.set(el, instance);
    
    el.dispatchEvent(new CustomEvent('funky.highlight.applied', {
      bubbles: true,
      detail: { count: instance.getCount(), query: query, fuzzy: true }
    }));
    
    if (Funky.Announce) {
      var count = instance.getCount();
      if (count > 0) {
        Funky.Announce.polite('Found ' + count + ' fuzzy match' + (count === 1 ? '' : 'es'));
      } else {
        Funky.Announce.polite('No matches found');
      }
    }
    
    return instance;
  };

  /**
   * Check if element has active highlights
   * @param {string|Element} selector
   * @returns {boolean}
   */
  Highlight.hasHighlights = function(selector) {
    var el = getElement(selector);
    var instance = el && instances.get(el);
    return instance ? instance.getCount() > 0 : false;
  };

  /**
   * FuzzyHighlightInstance class - exposed for direct instantiation
   */
  Highlight.FuzzyHighlightInstance = FuzzyHighlightInstance;

  // ==========================================================================
  // EXPORT
  // ==========================================================================

  // Register with Funky securely
  Funky.register('Highlight', Highlight);

})(window);

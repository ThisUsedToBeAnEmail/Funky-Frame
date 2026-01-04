/**
 * Funky.Clipboard - Copy to Clipboard Component
 * Copy to clipboard with visual feedback
 * @module Funky.Clipboard
 * @version 1.0.1
 */
(function(window) {
  'use strict';

  // Ensure Funky registry exists
  if (!window.Funky || !window.Funky.register) {
    console.error('[Funky.Clipboard] Registry not found. Load namespace.js first.');
    return;
  }

  var Funky = window.Funky;

  // Guard against double registration
  if (Funky.Clipboard) {
    return;
  }

  /**
   * Clipboard Component
   * Provides copy-to-clipboard functionality with visual feedback
   */
  var Clipboard = {
    /**
     * Default configuration
     */
    defaults: {
      duration: 2000,           // Duration to show success state (ms)
      tooltip: 'Copied!',       // Tooltip text on success
      errorTooltip: 'Failed!',  // Tooltip text on error
      showTooltip: true,        // Whether to show tooltip feedback
      showNotification: true,   // Whether to show global notification for programmatic copy
      iconCopy: 'fa-copy',      // Default copy icon class
      iconSuccess: 'fa-check',  // Success icon class
      onCopy: null,             // Callback on successful copy
      onError: null             // Callback on copy error
    },

    /**
     * Check if Clipboard API is supported
     * @returns {boolean}
     */
    isSupported: function() {
      return !!(navigator.clipboard && navigator.clipboard.writeText) ||
             !!(document.queryCommandSupported && document.queryCommandSupported('copy'));
    },

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @param {Object} options - Optional callbacks
     * @returns {Promise<boolean>}
     */
    copy: function(text, options) {
      var self = this;
      var opts = Object.assign({}, this.defaults, options);

      return new Promise(function(resolve, reject) {
        // Try modern Clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text)
            .then(function() {
              if (typeof opts.onCopy === 'function') {
                opts.onCopy(text);
              }
              if (opts.showNotification) {
                self._showGlobalNotification(true, opts);
              }
              resolve(true);
            })
            .catch(function(err) {
              // Fallback to execCommand
              self._fallbackCopy(text, opts, resolve, reject);
            });
        } else {
          // Use fallback method
          self._fallbackCopy(text, opts, resolve, reject);
        }
      });
    },

    /**
     * Fallback copy using execCommand
     * @private
     */
    _fallbackCopy: function(text, opts, resolve, reject) {
      var self = this;
      var textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);

      try {
        var success = document.execCommand('copy');
        document.body.removeChild(textarea);

        if (success) {
          if (typeof opts.onCopy === 'function') {
            opts.onCopy(text);
          }
          if (opts.showNotification) {
            self._showGlobalNotification(true, opts);
          }
          resolve(true);
        } else {
          if (typeof opts.onError === 'function') {
            opts.onError(new Error('Copy command failed'));
          }
          if (opts.showNotification) {
            self._showGlobalNotification(false, opts);
          }
          reject(new Error('Copy command failed'));
        }
      } catch (err) {
        document.body.removeChild(textarea);
        if (typeof opts.onError === 'function') {
          opts.onError(err);
        }
        if (opts.showNotification) {
          self._showGlobalNotification(false, opts);
        }
        reject(err);
      }
    },

    /**
     * Copy content from a DOM element
     * @param {string|Element} selector - Element or selector to copy from
     * @param {Object} options - Optional configuration
     * @returns {Promise<boolean>}
     */
    copyFrom: function(selector, options) {
      var element = typeof selector === 'string' 
        ? document.querySelector(selector) 
        : selector;

      if (!element) {
        return Promise.reject(new Error('Element not found: ' + selector));
      }

      // Get text content based on element type
      var text;
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        text = element.value;
      } else if (element.tagName === 'SELECT') {
        var selectedOption = element.options[element.selectedIndex];
        text = selectedOption ? selectedOption.text : '';
      } else {
        text = element.textContent || element.innerText;
      }

      return this.copy(text.trim(), options);
    },

    /**
     * Attach clipboard functionality to a button/element
     * @param {string|Element} buttonSelector - Button element or selector
     * @param {Object} config - Configuration options
     * @returns {Object} Controller object with destroy method
     */
    attach: function(buttonSelector, config) {
      const button = typeof buttonSelector === 'string'
        ? document.querySelector(buttonSelector)
        : buttonSelector;

      if (!button) {
        console.warn('[Clipboard] Button not found:', buttonSelector);
        return null;
      }

      var opts = Object.assign({}, this.defaults, config);
      var self = this;

      // Add base class
      button.classList.add('funky-clipboard-btn');

      // Ensure proper icon structure
      this._ensureIcons(button, opts);

      // Click handler
      var handleClick = function(e) {
        e.preventDefault();

        // Determine text to copy
        var text;
        var target = button.dataset.clipboard;
        var staticText = button.dataset.clipboardText;
        var valueSel = button.dataset.clipboardValue;

        if (staticText) {
          text = staticText;
        } else if (valueSel) {
          var valueEl = document.querySelector(valueSel);
          text = valueEl ? (valueEl.value || valueEl.textContent) : '';
        } else if (target) {
          var targetEl = document.querySelector(target);
          text = targetEl ? (targetEl.value || targetEl.textContent) : '';
        } else if (opts.text) {
          text = typeof opts.text === 'function' ? opts.text() : opts.text;
        }

        if (!text) {
          console.warn('[Clipboard] No text to copy');
          return;
        }

        self.copy(text.trim(), opts)
          .then(function() {
            self._showSuccess(button, opts);
          })
          .catch(function(err) {
            self._showError(button, opts);
          });
      };

      button.addEventListener('click', handleClick);

      // Return controller
      return {
        destroy: function() {
          button.removeEventListener('click', handleClick);
          button.classList.remove('funky-clipboard-btn', 'copied', 'error', 'show-tooltip');
        },
        copy: function(text) {
          return self.copy(text || button.dataset.clipboardText, opts);
        }
      };
    },

    /**
     * Initialize all elements with data-clipboard attribute
     * @param {string|HTMLElement} containerSelector - Optional container to scope initialization (selector string or element)
     * @returns {Array} Array of controller objects
     */
    init: function(containerSelector) {
      var self = this;
      var container;
      
      if (!containerSelector) {
        container = document;
      } else if (typeof containerSelector === 'string') {
        container = document.querySelector(containerSelector);
      } else if (containerSelector instanceof HTMLElement) {
        container = containerSelector;
      } else {
        container = document;
      }

      if (!container) return [];

      var buttons = container.querySelectorAll('[data-clipboard], [data-clipboard-text]');
      var controllers = [];

      buttons.forEach(function(button) {
        // Skip if already initialized
        if (button._clipboardController) return;

        var controller = self.attach(button);
        if (controller) {
          button._clipboardController = controller;
          controllers.push(controller);
        }
      });

      return controllers;
    },

    /**
     * Create an inline clipboard element
     * @param {string} text - Text to display and copy
     * @param {Object} options - Configuration options
     * @returns {HTMLElement}
     */
    createInline: function(text, options) {
      var opts = Object.assign({}, this.defaults, options);

      var wrapper = document.createElement('span');
      wrapper.className = 'funky-clipboard-inline';

      var textSpan = document.createElement('span');
      textSpan.className = 'funky-clipboard-text';
      textSpan.textContent = text;

      var D = Funky.Dom;
      var button = D.button()
        .attr('type', 'button')
        .class('funky-clipboard-btn')
        .attr('data-clipboard-text', text)
        .attr('aria-label', 'Copy to clipboard')
        .append(D.icon('fas fa-copy'))
        .append(D.icon('fas fa-check'))
        .el;

      wrapper.appendChild(textSpan);
      wrapper.appendChild(button);

      // Attach functionality
      this.attach(button, opts);

      return wrapper;
    },

    /**
     * Ensure button has proper icon structure
     * @private
     */
    _ensureIcons: function(button, opts) {
      // Check if button already has icons
      var hasCopyIcon = button.querySelector('.fa-copy, .fa-clipboard, .fa-clone');
      var hasCheckIcon = button.querySelector('.fa-check');

      if (!hasCopyIcon && !hasCheckIcon) {
        // Add default icons if none exist
        var D = Funky.Dom;
        button.replaceChildren(
          D.icon('fas ' + opts.iconCopy).aria('hidden', 'true').el,
          D.icon('fas ' + opts.iconSuccess).aria('hidden', 'true').el
        );
      } else if (!hasCheckIcon) {
        // Add check icon if missing
        var checkIcon = document.createElement('i');
        checkIcon.className = 'fas ' + opts.iconSuccess;
        checkIcon.setAttribute('aria-hidden', 'true');
        button.appendChild(checkIcon);
      }

      // Ensure existing icons are hidden from screen readers
      button.querySelectorAll('i.fas, i.fa').forEach(function(icon) {
        icon.setAttribute('aria-hidden', 'true');
      });

      // Ensure button has an accessible label if it only has icons
      if (!button.textContent.trim() && !button.getAttribute('aria-label')) {
        button.setAttribute('aria-label', 'Copy to clipboard');
      }
    },

    /**
     * Show success state on button
     * @private
     */
    _showSuccess: function(button, opts) {
      button.classList.remove('error');
      button.classList.add('copied');

      if (opts.showTooltip) {
        button.setAttribute('data-clipboard-tooltip', opts.tooltip);
        button.classList.add('show-tooltip');
      }

      // Announce to screen readers
      if (Funky.Announce) {
        Funky.Announce.polite('Copied to clipboard');
      }

      // Reset after duration
      setTimeout(() => {
        button.classList.remove('copied', 'show-tooltip');
      }, opts.duration);
    },

    /**
     * Show error state on button
     * @private
     */
    _showError: function(button, opts) {
      button.classList.remove('copied');
      button.classList.add('error');

      if (opts.showTooltip) {
        button.setAttribute('data-clipboard-tooltip', opts.errorTooltip);
        button.classList.add('show-tooltip');
      }

      // Announce to screen readers
      if (Funky.Announce) {
        Funky.Announce.assertive('Failed to copy to clipboard');
      }

      // Reset after duration
      setTimeout(function() {
        button.classList.remove('error', 'show-tooltip');
      }, opts.duration);
    },

    /**
     * Show a subtle global notification when copy is successful
     * Used for programmatic copy() calls without a button
     * @private
     */
    _showGlobalNotification: function(success, opts) {
      // Create or reuse the notification element
      var notification = document.getElementById('funky-clipboard-notification');

      if (!notification) {
        notification = document.createElement('div');
        notification.id = 'funky-clipboard-notification';
        notification.className = 'funky-clipboard-notification';
        notification.setAttribute('role', 'status');
        notification.setAttribute('aria-live', 'polite');
        notification.setAttribute('aria-atomic', 'true');
        document.body.appendChild(notification);
      }
      
      // Clear any existing animation
      notification.classList.remove('show', 'success', 'error');
      
      // Set content and state
      var icon = success ? 'fa-check' : 'fa-times';
      var text = success ? opts.tooltip : opts.errorTooltip;
      notification.replaceChildren(
        Funky.Dom.icon('fas ' + icon).el,
        document.createTextNode(' ' + text)
      );
      notification.classList.add(success ? 'success' : 'error');
      
      // Trigger show animation
      // Use requestAnimationFrame to ensure the class changes trigger transitions
      requestAnimationFrame(function() {
        notification.classList.add('show');
      });
      
      // Hide after duration
      setTimeout(function() {
        notification.classList.remove('show');
      }, Math.min(opts.duration, 1500));
    }
  };

  // ==========================================================================
  // EXPORT
  // ==========================================================================

  // Register with Funky securely
  Funky.register('Clipboard', Clipboard);

  // Auto-initialize on DOMContentLoaded if not already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      Funky.Clipboard.init();
    });
  } else {
    // DOM already loaded, initialize on next tick
    setTimeout(function() {
      Funky.Clipboard.init();
    }, 0);
  }

})(window);

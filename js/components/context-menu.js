/**
 * Funky.ContextMenu - Right-Click Context Menu Component
 * Native-feeling context menus with submenus and keyboard navigation
 * @module Funky.ContextMenu
 * @version 1.0.3
 */
(function(window) {
  'use strict';

  // Guard: Check Funky registry exists
  if (!window.Funky || !window.Funky.register) {
    console.error('[Funky.ContextMenu] Registry not found. Load namespace.js first.');
    return;
  }

  var Funky = window.Funky;
  var D = Funky.Dom;

  // Guard against double registration
  if (Funky.ContextMenu) {
    return;
  }

  // ==========================================================================
  // DEFAULTS
  // ==========================================================================
  var DEFAULTS = {
    items: [],                  // Array or function(target) returning items
    onSelect: null,             // Callback: onSelect(itemId, targetElement, event)
    onShow: null,               // Callback before menu shows
    onHide: null,               // Callback when menu hides
    className: '',              // Additional CSS class
    minWidth: 160,              // Minimum width (px)
    maxWidth: 320,              // Maximum width (px)
    zIndex: 10000,              // Z-index
    longPressDelay: 500,        // Long-press delay for touch (ms)
    disabled: false             // Disable the context menu
  };

  // ==========================================================================
  // STATE
  // ==========================================================================
  var activeMenu = null;        // Currently visible menu
  var attachments = [];         // All attached context menus
  var focusedIndex = -1;        // Currently focused item index
  var submenus = [];            // Stack of open submenus
  var currentMenuItems = [];    // Flattened items for keyboard nav
  var keyboardUnregisters = []; // Keyboard shortcut cleanup functions
  var useFallbackKeyboard = false; // Fallback flag
  var focusTrapCleanup = null;  // Cleanup function for FocusManager.trapFocus

  // ==========================================================================
  // ATTACHMENT CLASS
  // ==========================================================================
  function Attachment(target, options) {
    this.target = target;       // Selector string, Element, or window
    this.options = Object.assign({}, DEFAULTS, options);
    this.elements = [];         // Resolved elements
    this.destroyed = false;
    this._gestureTrackers = []; // GestureTracker instances for touch
    this._isGlobal = false;
    
    // Create item registry for static items
    this._itemRegistry = null;
    this._initItemRegistry();
    
    this._init();
  }

  /**
   * Initialize item registry for static menus
   * @private
   */
  Attachment.prototype._initItemRegistry = function() {
    // Only create registry if items is an array (static)
    if (Array.isArray(this.options.items)) {
      var self = this;
      this._itemRegistry = Funky.ActionRegistry.create({
        schema: {
          label: '',
          icon: null,
          shortcut: null,
          disabled: false,
          hidden: false,
          order: 50,
          divider: false,
          header: null,
          items: null,
          variant: null
        }
      });
      
      // Populate from initial items
      this.options.items.forEach(function(item, index) {
        if (item.divider) {
          self._itemRegistry.add({
            id: '__divider_' + index,
            divider: true,
            order: item.order !== undefined ? item.order : index
          });
        } else if (item.header) {
          self._itemRegistry.add({
            id: '__header_' + index,
            header: item.header,
            order: item.order !== undefined ? item.order : index
          });
        } else {
          self._itemRegistry.add(Object.assign({
            id: item.id || '__item_' + index,
            order: item.order !== undefined ? item.order : index
          }, item));
        }
      });
    }
  };

  /**
   * Get items for menu display
   * @param {Element} targetEl - Target element
   * @param {Event} event - Original event
   * @returns {Array} Items array
   * @private
   */
  Attachment.prototype._getItems = function(targetEl, event) {
    // If items is a function, call it
    if (typeof this.options.items === 'function') {
      return this.options.items(targetEl, event) || [];
    }
    
    // If using registry, get sorted items
    if (this._itemRegistry) {
      return this._itemRegistry.getSorted();
    }
    
    // Fallback to options array
    return this.options.items || [];
  };

  /**
   * Add an item to a static context menu
   * @param {Object} item - Item config (requires id)
   * @returns {Attachment} this for chaining
   */
  Attachment.prototype.addItem = function(item) {
    if (!this._itemRegistry) {
      console.warn('[ContextMenu] Cannot add items to dynamic menu');
      return this;
    }
    this._itemRegistry.add(item);
    return this;
  };

  /**
   * Remove an item from a static context menu
   * @param {string} id - Item ID
   * @returns {Attachment} this for chaining
   */
  Attachment.prototype.removeItem = function(id) {
    if (this._itemRegistry) {
      this._itemRegistry.remove(id);
    }
    return this;
  };

  /**
   * Update an item in a static context menu
   * @param {string} id - Item ID
   * @param {Object} updates - Properties to update
   * @returns {Attachment} this for chaining
   */
  Attachment.prototype.updateItem = function(id, updates) {
    if (this._itemRegistry) {
      this._itemRegistry.update(id, updates);
    }
    return this;
  };

  /**
   * Enable/disable an item
   * @param {string} id - Item ID
   * @param {boolean} enabled - Enable or disable
   * @returns {Attachment} this for chaining
   */
  Attachment.prototype.setItemEnabled = function(id, enabled) {
    if (this._itemRegistry) {
      this._itemRegistry.update(id, { disabled: !enabled });
    }
    return this;
  };

  /**
   * Show/hide an item
   * @param {string} id - Item ID
   * @param {boolean} visible - Show or hide
   * @returns {Attachment} this for chaining
   */
  Attachment.prototype.setItemVisible = function(id, visible) {
    if (this._itemRegistry) {
      if (visible) {
        this._itemRegistry.show(id);
      } else {
        this._itemRegistry.hide(id);
      }
    }
    return this;
  };

  /**
   * Get an item by ID
   * @param {string} id - Item ID
   * @returns {Object|null} Item config or null
   */
  Attachment.prototype.getItem = function(id) {
    if (this._itemRegistry) {
      return this._itemRegistry.get(id);
    }
    return null;
  };

  Attachment.prototype._init = function() {
    var self = this;
    
    // Resolve target elements
    if (this.target === window || this.target === document) {
      this.elements = [document.body];
      this._isGlobal = true;
    } else if (typeof this.target === 'string') {
      this.elements = Array.from(document.querySelectorAll(this.target));
    } else if (this.target instanceof Element) {
      this.elements = [this.target];
    } else if (this.target instanceof NodeList || Array.isArray(this.target)) {
      this.elements = Array.from(this.target);
    }
    
    // Bind handlers
    this._handleContextMenu = this._onContextMenu.bind(this);
    
    // Attach event listeners
    this.elements.forEach(function(el) {
      el.addEventListener('contextmenu', self._handleContextMenu);
      
      // Touch support via GestureTracker for long-press
      var tracker = Funky.GestureTracker.create({
        target: el,
        namespace: 'contextmenu-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        gestures: ['longpress'],
        longPressDelay: self.options.longPressDelay,
        hapticFeedback: true,
        
        onLongPress: function(data) {
          if (self.options.disabled) return;
          
          var targetEl = self._isGlobal ? data.target : self._findTarget(data.target);
          if (targetEl || self._isGlobal) {
            var items = self._getItems(targetEl || data.target, null);
            var showOptions = Object.assign({}, self.options, { items: items });
            ContextMenu._showMenu(data.x, data.y, showOptions, targetEl || data.target, null);
          }
        }
      });
      
      self._gestureTrackers.push(tracker);
    });
  };

  Attachment.prototype._onContextMenu = function(e) {
    if (this.options.disabled) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Find the actual target element (for delegated events)
    var targetEl = this._isGlobal ? e.target : this._findTarget(e.target);
    if (!targetEl && !this._isGlobal) return;
    
    // Get items using registry or function
    var items = this._getItems(targetEl || e.target, e);
    var showOptions = Object.assign({}, this.options, { items: items });
    
    ContextMenu._showMenu(e.clientX, e.clientY, showOptions, targetEl || e.target, e);
  };



  Attachment.prototype._findTarget = function(el) {
    // For delegated selector, find matching parent
    if (typeof this.target === 'string') {
      var found = D.one(el).closest(this.target);
      return found ? found.raw() : null;
    }
    // Check if element is in our list
    var found = null;
    this.elements.forEach(function(target) {
      if (target === el || target.contains(el)) {
        found = target;
      }
    });
    return found;
  };

  Attachment.prototype.destroy = function() {
    var self = this;
    
    this.elements.forEach(function(el) {
      el.removeEventListener('contextmenu', self._handleContextMenu);
    });
    
    // Destroy all gesture trackers
    this._gestureTrackers.forEach(function(tracker) {
      tracker.destroy();
    });
    this._gestureTrackers = [];
    
    this.destroyed = true;
  };

  // ==========================================================================
  // MENU RENDERING
  // ==========================================================================
  function renderMenu(items, options) {
    var menu = document.createElement('ul');
    menu.className = 'funky-contextmenu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('tabindex', '-1');
    
    if (options.className) {
      menu.classList.add(options.className);
    }
    
    if (options.minWidth) {
      menu.style.minWidth = options.minWidth + 'px';
    }
    if (options.maxWidth) {
      menu.style.maxWidth = options.maxWidth + 'px';
    }
    if (options.zIndex) {
      menu.style.zIndex = options.zIndex;
    }
    
    items.forEach(function(item, index) {
      if (item.hidden) return;
      
      var el;
      
      if (item.divider) {
        el = document.createElement('li');
        el.className = 'funky-contextmenu-divider';
        el.setAttribute('role', 'separator');
      } else if (item.header) {
        el = document.createElement('li');
        el.className = 'funky-contextmenu-header';
        el.textContent = item.header;
        el.setAttribute('role', 'presentation');
      } else {
        el = document.createElement('li');
        el.className = 'funky-contextmenu-item';
        el.setAttribute('role', 'menuitem');
        el.setAttribute('data-index', index);
        el.setAttribute('data-id', item.id || '');
        
        // Variant
        if (item.variant) {
          el.classList.add('funky-contextmenu-item-' + item.variant);
        }
        
        // Disabled
        if (item.disabled) {
          el.classList.add('is-disabled');
          el.setAttribute('aria-disabled', 'true');
        }
        
        // Icon
        if (item.icon) {
          var D = Funky.Dom;
          var icon = D.span()
            .class('funky-contextmenu-icon')
            .append(D.icon('fas ' + item.icon))
            .el;
          el.appendChild(icon);
        }
        
        // Label
        var label = document.createElement('span');
        label.className = 'funky-contextmenu-label';
        label.textContent = item.label || '';
        el.appendChild(label);
        
        // Shortcut
        if (item.shortcut) {
          var shortcut = document.createElement('span');
          shortcut.className = 'funky-contextmenu-shortcut';
          shortcut.textContent = item.shortcut;
          el.appendChild(shortcut);
          el.setAttribute('aria-keyshortcuts', item.shortcut);
        }

        // Submenu arrow
        if (item.items && item.items.length > 0) {
          var D = Funky.Dom;
          var arrow = D.span()
            .class('funky-contextmenu-arrow')
            .append(D.icon('fas fa-chevron-right'))
            .el;
          el.appendChild(arrow);
          el.setAttribute('data-has-submenu', 'true');
          el.setAttribute('aria-haspopup', 'menu');
          el.setAttribute('aria-expanded', 'false');
        }
      }
      
      menu.appendChild(el);
    });
    
    return menu;
  }

  // ==========================================================================
  // POSITIONING
  // ==========================================================================
  function positionMenu(menu, x, y, isSubmenu, parentItem) {
    document.body.appendChild(menu);
    
    var rect = menu.getBoundingClientRect();
    var viewportWidth = window.innerWidth;
    var viewportHeight = window.innerHeight;
    var padding = 8;
    
    var left = x;
    var top = y;
    
    if (isSubmenu && parentItem) {
      // Position submenu relative to parent item
      var parentRect = parentItem.getBoundingClientRect();
      var parentMenuRect = parentItem.closest('.funky-contextmenu').getBoundingClientRect();
      
      left = parentMenuRect.right - 4;
      top = parentRect.top - 4;
      
      // Check if submenu would go off right edge
      if (left + rect.width > viewportWidth - padding) {
        left = parentMenuRect.left - rect.width + 4;
        menu.classList.add('is-submenu-left');
      }
    } else {
      // Check if menu would go off right edge
      if (left + rect.width > viewportWidth - padding) {
        left = viewportWidth - rect.width - padding;
      }
    }
    
    // Check if menu would go off bottom edge
    if (top + rect.height > viewportHeight - padding) {
      top = viewportHeight - rect.height - padding;
    }
    
    // Ensure menu doesn't go off left or top
    left = Math.max(padding, left);
    top = Math.max(padding, top);
    
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
    
    // Trigger animation
    requestAnimationFrame(function() {
      menu.classList.add('is-visible');
    });
  }

  // ==========================================================================
  // KEYBOARD NAVIGATION
  // ==========================================================================
  function getActiveItems(menu) {
    return Array.from(menu.querySelectorAll('.funky-contextmenu-item:not(.is-disabled)'));
  }

  /**
   * Register keyboard shortcuts with Funky.Keyboard
   */
  function registerKeyboardShortcuts() {
    if (!Funky.Keyboard) {
      useFallbackKeyboard = true;
      return;
    }
    
    // Push context menu scope
    Funky.Keyboard.pushScope('context-menu');
    
    keyboardUnregisters = [
      Funky.Keyboard.register({
        key: 'down',
        scope: 'context-menu',
        handler: function() {
          if (!activeMenu) return;
          var currentMenu = submenus.length > 0 ? submenus[submenus.length - 1].menu : activeMenu.menu;
          var items = getActiveItems(currentMenu);
          if (!items.length) return;
          focusedIndex = (focusedIndex + 1) % items.length;
          updateFocus(items);
        },
        description: 'Move down',
        group: 'Context Menu'
      }),
      
      Funky.Keyboard.register({
        key: 'up',
        scope: 'context-menu',
        handler: function() {
          if (!activeMenu) return;
          var currentMenu = submenus.length > 0 ? submenus[submenus.length - 1].menu : activeMenu.menu;
          var items = getActiveItems(currentMenu);
          if (!items.length) return;
          focusedIndex = focusedIndex <= 0 ? items.length - 1 : focusedIndex - 1;
          updateFocus(items);
        },
        description: 'Move up',
        group: 'Context Menu'
      }),
      
      Funky.Keyboard.register({
        key: 'right',
        scope: 'context-menu',
        handler: function() {
          if (!activeMenu) return;
          var currentMenu = submenus.length > 0 ? submenus[submenus.length - 1].menu : activeMenu.menu;
          var items = getActiveItems(currentMenu);
          if (focusedIndex >= 0 && items[focusedIndex] && items[focusedIndex].hasAttribute('data-has-submenu')) {
            openSubmenu(items[focusedIndex]);
          }
        },
        description: 'Open submenu',
        group: 'Context Menu'
      }),
      
      Funky.Keyboard.register({
        key: 'left',
        scope: 'context-menu',
        handler: function() {
          if (!activeMenu) return;
          if (submenus.length > 0) {
            closeSubmenu();
          }
        },
        description: 'Close submenu',
        group: 'Context Menu'
      }),
      
      Funky.Keyboard.register({
        key: 'enter',
        scope: 'context-menu',
        handler: function() {
          if (!activeMenu) return;
          var currentMenu = submenus.length > 0 ? submenus[submenus.length - 1].menu : activeMenu.menu;
          var items = getActiveItems(currentMenu);
          if (focusedIndex >= 0 && items[focusedIndex]) {
            selectItem(items[focusedIndex]);
          }
        },
        description: 'Select item',
        group: 'Context Menu'
      }),
      
      Funky.Keyboard.register({
        key: 'space',
        scope: 'context-menu',
        handler: function() {
          if (!activeMenu) return;
          var currentMenu = submenus.length > 0 ? submenus[submenus.length - 1].menu : activeMenu.menu;
          var items = getActiveItems(currentMenu);
          if (focusedIndex >= 0 && items[focusedIndex]) {
            selectItem(items[focusedIndex]);
          }
        },
        description: 'Select item',
        group: 'Context Menu'
      }),
      
      Funky.Keyboard.register({
        key: 'escape',
        scope: 'context-menu',
        priority: 10, // Higher than Morph.to() internal handler (0)
        handler: function() {
          ContextMenu.hide();
        },
        description: 'Close menu',
        group: 'Context Menu'
      }),
      
      Funky.Keyboard.register({
        key: 'tab',
        scope: 'context-menu',
        handler: function() {
          ContextMenu.hide();
        },
        description: 'Close menu',
        group: 'Context Menu'
      })
    ];
  }
  
  /**
   * Unregister keyboard shortcuts
   */
  function unregisterKeyboardShortcuts() {
    if (!Funky.Keyboard) return;
    
    keyboardUnregisters.forEach(function(unregister) {
      if (typeof unregister === 'function') {
        unregister();
      }
    });
    keyboardUnregisters = [];
    
    // Pop context menu scope
    Funky.Keyboard.popScope();
  }

  function handleKeydown(e) {
    // Only use fallback if Funky.Keyboard not available
    if (!useFallbackKeyboard) return;
    
    if (!activeMenu) return;
    
    // Get the current menu (submenu if open, otherwise main menu)
    var currentMenu = submenus.length > 0 ? submenus[submenus.length - 1].menu : activeMenu.menu;
    var items = getActiveItems(currentMenu);
    if (!items.length) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        focusedIndex = (focusedIndex + 1) % items.length;
        updateFocus(items);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        focusedIndex = focusedIndex <= 0 ? items.length - 1 : focusedIndex - 1;
        updateFocus(items);
        break;
        
      case 'ArrowRight':
        e.preventDefault();
        // Open submenu if focused item has one
        if (focusedIndex >= 0 && items[focusedIndex] && items[focusedIndex].hasAttribute('data-has-submenu')) {
          openSubmenu(items[focusedIndex]);
        }
        break;
        
      case 'ArrowLeft':
        e.preventDefault();
        // Close current submenu
        if (submenus.length > 0) {
          closeSubmenu();
        }
        break;
        
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && items[focusedIndex]) {
          selectItem(items[focusedIndex]);
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        ContextMenu.hide();
        break;
        
      case 'Tab':
        e.preventDefault();
        ContextMenu.hide();
        break;
    }
  }

  function updateFocus(items) {
    // Clear all focus
    document.querySelectorAll('.funky-contextmenu-item.is-focused').forEach(function(item) {
      item.classList.remove('is-focused');
    });
    
    // Set focus on current item
    if (focusedIndex >= 0 && items[focusedIndex]) {
      items[focusedIndex].classList.add('is-focused');
      items[focusedIndex].scrollIntoView({ block: 'nearest' });
    }
  }

  function selectItem(itemEl) {
    if (itemEl.classList.contains('is-disabled')) return;
    
    var itemId = itemEl.getAttribute('data-id');
    
    // Check for submenu
    if (itemEl.hasAttribute('data-has-submenu')) {
      openSubmenu(itemEl);
      return;
    }
    
    // Trigger callback
    if (activeMenu && activeMenu.options.onSelect) {
      activeMenu.options.onSelect(itemId, activeMenu.targetElement, activeMenu.originalEvent);
    }
    
    ContextMenu.hide();
  }

  function openSubmenu(itemEl) {
    // Find item data
    var index = parseInt(itemEl.getAttribute('data-index'), 10);
    
    // Determine which items array to use
    var parentItems;
    if (submenus.length > 0) {
      parentItems = submenus[submenus.length - 1].items;
    } else {
      parentItems = activeMenu.items;
    }
    
    var itemData = parentItems[index];
    if (!itemData || !itemData.items || !itemData.items.length) return;
    
    // Close any existing submenus at this level or deeper
    // (Find if this item's parent is already in the chain)
    var parentMenu = itemEl.closest('.funky-contextmenu');
    var closeFrom = -1;
    for (var i = 0; i < submenus.length; i++) {
      if (submenus[i].menu === parentMenu) {
        closeFrom = i + 1;
        break;
      }
    }
    if (closeFrom === -1 && parentMenu === activeMenu.menu) {
      closeFrom = 0;
    }
    
    if (closeFrom >= 0) {
      while (submenus.length > closeFrom) {
        var sub = submenus.pop();
        // Update aria-expanded on parent item
        if (sub.parentItem) {
          sub.parentItem.setAttribute('aria-expanded', 'false');
        }
        if (sub.menu && sub.menu.parentNode) {
          sub.menu.parentNode.removeChild(sub.menu);
        }
      }
    }

    // Create submenu
    var submenu = renderMenu(itemData.items, activeMenu.options);
    submenu.classList.add('is-submenu');
    positionMenu(submenu, 0, 0, true, itemEl);

    // Update aria-expanded on parent item
    itemEl.setAttribute('aria-expanded', 'true');

    submenus.push({
      menu: submenu,
      parentItem: itemEl,
      items: itemData.items
    });
    
    // Focus first item in submenu
    focusedIndex = 0;
    updateFocus(getActiveItems(submenu));
  }

  function closeSubmenu() {
    if (submenus.length === 0) return;

    var sub = submenus.pop();

    // Update aria-expanded on parent item
    if (sub.parentItem) {
      sub.parentItem.setAttribute('aria-expanded', 'false');
    }

    if (sub.menu && sub.menu.parentNode) {
      sub.menu.parentNode.removeChild(sub.menu);
    }

    // Restore focus to parent menu
    var parentMenu = submenus.length > 0 ? submenus[submenus.length - 1].menu : activeMenu.menu;
    var items = getActiveItems(parentMenu);
    focusedIndex = items.indexOf(sub.parentItem);
    if (focusedIndex === -1) focusedIndex = 0;
    updateFocus(items);
  }

  // ==========================================================================
  // HOVER HANDLING FOR SUBMENUS
  // ==========================================================================
  var hoverTimer = null;

  function handleItemHover(e) {
    var target = Funky.Dom.one(e.target);
    if (!target) return;
    var item = target.closest('.funky-contextmenu-item');
    if (!item || !activeMenu) return;

    var itemEl = item.raw();
    if (!itemEl) return;

    // Clear any pending hover timer
    clearTimeout(hoverTimer);

    // Update focus
    var menu = item.closest('.funky-contextmenu');
    if (!menu) return;
    var menuEl = menu.raw();
    var items = getActiveItems(menuEl);
    focusedIndex = items.indexOf(itemEl);
    updateFocus(items);

    // Handle submenu
    if (itemEl.hasAttribute('data-has-submenu')) {
      hoverTimer = setTimeout(function() {
        openSubmenu(itemEl);
      }, 150);
    } else {
      // Close submenus if hovering non-submenu item in parent
      var parentMenu = menu.raw();
      var closeFrom = -1;
      
      if (parentMenu === activeMenu.menu) {
        closeFrom = 0;
      } else {
        for (var i = 0; i < submenus.length; i++) {
          if (submenus[i].menu === parentMenu) {
            closeFrom = i + 1;
            break;
          }
        }
      }
      
      if (closeFrom >= 0 && submenus.length > closeFrom) {
        hoverTimer = setTimeout(function() {
          while (submenus.length > closeFrom) {
            var sub = submenus.pop();
            // Update aria-expanded on parent item
            if (sub.parentItem) {
              sub.parentItem.setAttribute('aria-expanded', 'false');
            }
            if (sub.menu && sub.menu.parentNode) {
              sub.menu.parentNode.removeChild(sub.menu);
            }
          }
        }, 150);
      }
    }
  }

  // ==========================================================================
  // GLOBAL EVENT HANDLERS
  // ==========================================================================
  function handleOutsideClick(e) {
    if (!activeMenu) return;

    // Check if click is inside any menu
    var isInsideMenu = D.one(e.target).closest('.funky-contextmenu');
    if (isInsideMenu) {
      // Check if clicking an item
      var item = D.one(e.target).closest('.funky-contextmenu-item');
      var itemEl = item ? item.raw() : null;
      if (itemEl && !itemEl.classList.contains('is-disabled')) {
        selectItem(itemEl);
      }
      return;
    }

    ContextMenu.hide();
  }

  function handleScroll() {
    if (activeMenu) {
      ContextMenu.hide();
    }
  }

  function handleResize() {
    if (activeMenu) {
      ContextMenu.hide();
    }
  }

  // Setup global listeners
  var globalListenersAttached = false;

  function attachGlobalListeners() {
    if (globalListenersAttached) return;
    document.addEventListener('click', handleOutsideClick, true);
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('mouseover', handleItemHover);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    globalListenersAttached = true;
  }

  function detachGlobalListeners() {
    if (!globalListenersAttached) return;
    document.removeEventListener('click', handleOutsideClick, true);
    document.removeEventListener('keydown', handleKeydown);
    document.removeEventListener('mouseover', handleItemHover);
    window.removeEventListener('scroll', handleScroll, true);
    window.removeEventListener('resize', handleResize);
    globalListenersAttached = false;
  }

  // Attach global listeners on module load
  attachGlobalListeners();

  // ==========================================================================
  // MAIN COMPONENT OBJECT
  // ==========================================================================
  var ContextMenu = {
    defaults: DEFAULTS,
    
    /**
     * Attach context menu to elements
     * @param {string|Element|NodeList|Window} target - Target element(s)
     * @param {Object} options - Configuration options
     * @returns {Attachment} Attachment instance
     */
    attach: function(target, options) {
      var attachment = new Attachment(target, options);
      attachments.push(attachment);
      return attachment;
    },
    
    /**
     * Show context menu programmatically
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {Object} options - Configuration options
     */
    show: function(x, y, options) {
      options = Object.assign({}, DEFAULTS, options);
      this._showMenu(x, y, options, null, null);
    },
    
    /**
     * Internal show menu
     * @private
     */
    _showMenu: function(x, y, options, targetElement, originalEvent) {
      // Hide any existing menu
      this.hide();
      
      // Get items
      var items = typeof options.items === 'function'
        ? options.items(targetElement)
        : options.items;
      
      if (!items || !items.length) return;
      
      // Callback before show
      if (options.onShow) {
        var result = options.onShow(targetElement, originalEvent);
        if (result === false) return;
      }
      
      // Create and position menu
      var menu = renderMenu(items, options);
      positionMenu(menu, x, y, false, null);
      
      // Store active state
      activeMenu = {
        menu: menu,
        options: options,
        targetElement: targetElement,
        originalEvent: originalEvent,
        items: items
      };

      focusedIndex = -1;
      submenus = [];

      // Register keyboard shortcuts
      registerKeyboardShortcuts();

      // Set up focus trap with FocusManager if available
      if (Funky.FocusManager && Funky.FocusManager.trapFocus) {
        // Push current focus to history before focusing menu
        Funky.FocusManager.focusAndPush(menu, { label: 'Context Menu' });

        // Set up focus trap (autoFocus: false since we already focused)
        focusTrapCleanup = Funky.FocusManager.trapFocus(menu, {
          autoFocus: false
        });
      } else {
        // Fallback: just focus menu for keyboard navigation
        menu.focus();
      }
    },
    
    /**
     * Hide context menu
     */
    hide: function() {
      if (!activeMenu) return;

      // Unregister keyboard shortcuts
      unregisterKeyboardShortcuts();

      // Clean up focus trap
      if (focusTrapCleanup) {
        focusTrapCleanup();
        focusTrapCleanup = null;
      }

      // Clear hover timer
      clearTimeout(hoverTimer);

      // Close submenus
      submenus.forEach(function(sub) {
        // Update aria-expanded on parent item
        if (sub.parentItem) {
          sub.parentItem.setAttribute('aria-expanded', 'false');
        }
        if (sub.menu && sub.menu.parentNode) {
          sub.menu.parentNode.removeChild(sub.menu);
        }
      });
      submenus = [];

      // Remove main menu
      if (activeMenu.menu && activeMenu.menu.parentNode) {
        activeMenu.menu.parentNode.removeChild(activeMenu.menu);
      }

      // Callback
      if (activeMenu.options.onHide) {
        activeMenu.options.onHide();
      }

      activeMenu = null;
      focusedIndex = -1;

      // Restore focus to previous element
      if (Funky.FocusManager && Funky.FocusManager.popFocus) {
        Funky.FocusManager.popFocus();
      }
    },
    
    /**
     * Destroy all attachments
     * @param {boolean} [removeGlobalListeners=false] - Also remove global document/window listeners
     */
    destroyAll: function(removeGlobalListeners) {
      this.hide();
      attachments.forEach(function(a) {
        a.destroy();
      });
      attachments = [];

      // Optionally remove global listeners for complete cleanup
      if (removeGlobalListeners) {
        detachGlobalListeners();
      }
    },

    /**
     * Remove global document/window event listeners
     * Call this for complete cleanup when context menu functionality is no longer needed
     */
    destroyGlobalListeners: function() {
      detachGlobalListeners();
    },

    /**
     * Re-attach global listeners if previously detached
     */
    reattachGlobalListeners: function() {
      attachGlobalListeners();
    },
    
    /**
     * Get attachment for an element
     * @param {string|Element|Window} target - Target to find
     * @returns {Attachment|undefined} Attachment instance
     */
    get: function(target) {
      return attachments.find(function(a) {
        return a.target === target;
      });
    },
    
    /**
     * Destroy specific attachment
     * @param {string|Element|Window} target - Target to destroy
     */
    destroy: function(target) {
      var index = attachments.findIndex(function(a) {
        return a.target === target;
      });
      
      if (index !== -1) {
        attachments[index].destroy();
        attachments.splice(index, 1);
      }
    },
    
    /**
     * Check if a menu is currently visible
     * @returns {boolean}
     */
    isVisible: function() {
      return activeMenu !== null;
    }
  };

  // ==========================================================================
  // EXPORT
  // ==========================================================================
  Funky.register('ContextMenu', ContextMenu);

})(window);

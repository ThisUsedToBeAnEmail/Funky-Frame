/**
 * Funky.QueueStatus - Visual queue status indicator
 *
 * Shows pending count, sync status, and provides a viewer modal.
 * Works with both Funky.JobQueue and Funky.RequestQueue.
 *
 * @example
 *   Funky.QueueStatus.init({ container: '#header' });
 *   Funky.QueueStatus.showModal();
 *
 * @version 1.0.0
 */
(function(global) {
  'use strict';

  // Registry check - must load namespace.js first
  if (!global.Funky || !global.Funky.register) {
    console.error('[Funky.QueueStatus] Registry not found. Load namespace.js first.');
    return;
  }

  // Prevent double-registration
  if (global.Funky.isRegistered('QueueStatus')) {
    return;
  }

  var Funky = global.Funky;
  var D = Funky.Dom;
  var E = Funky.Events;

  var QueueStatus = {};

  // ============================================
  // STATE
  // ============================================

  var state = {
    element: null,
    badge: null,
    iconEl: null,
    srText: null,
    initialized: false,
    visible: true,
    offline: false,
    queueInstance: null  // Reference to a JobQueue instance if provided
  };

  var config = {
    container: 'body',
    position: 'fixed',      // 'fixed', 'inline'
    showWhenEmpty: false,
    clickAction: 'modal',   // 'modal', 'custom', 'none'
    animations: true,
    // Queue source - auto-detect or specify
    queueSource: 'auto',    // 'auto', 'requestqueue', 'jobqueue'
    queueName: null         // If queueSource is 'jobqueue', specify the queue name
  };

  // ============================================
  // QUEUE ACCESS HELPERS
  // ============================================

  /**
   * Get the queue to use for status
   * @private
   * @returns {Object|null}
   */
  function getQueue() {
    // If a queue instance was directly provided, use it
    if (state.queueInstance) {
      return state.queueInstance;
    }
    
    if (config.queueSource === 'requestqueue') {
      return Funky.RequestQueue || null;
    }
    if (config.queueSource === 'jobqueue' && config.queueName) {
      // Get JobQueue by name via static method
      return Funky.JobQueue && Funky.JobQueue.get ? Funky.JobQueue.get(config.queueName) : null;
    }
    // Auto-detect: prefer RequestQueue if enabled
    if (Funky.RequestQueue && Funky.RequestQueue.isEnabled && Funky.RequestQueue.isEnabled()) {
      return Funky.RequestQueue;
    }
    return null;
  }

  /**
   * Get count from queue
   * @private
   * @param {string} [status]
   * @returns {number}
   */
  function getCount(status) {
    var queue = getQueue();
    if (!queue) return 0;
    
    // Handle both JobQueue instance and RequestQueue static methods
    if (typeof queue.count === 'function') {
      return queue.count(status);
    }
    return 0;
  }

  /**
   * Get all items from queue
   * @private
   * @returns {Array}
   */
  function getAll() {
    var queue = getQueue();
    if (!queue) return [];
    
    // Handle both JobQueue instance and RequestQueue
    if (typeof queue.getAll === 'function') {
      return queue.getAll();
    }
    return [];
  }

  /**
   * Check if online
   * @private
   * @returns {boolean}
   */
  function isOnline() {
    // Use local offline state if set
    if (state.offline) return false;
    
    var queue = getQueue();
    if (queue && typeof queue.isOnline === 'function') {
      return queue.isOnline();
    }
    return navigator.onLine;
  }

  /**
   * Get conflicts from queue
   * @private
   * @returns {Array}
   */
  function getConflicts() {
    var queue = getQueue();
    if (queue && typeof queue.getConflicts === 'function') {
      return queue.getConflicts();
    }
    return [];
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  /**
   * Initialize queue status indicator
   * @param {Object} [options]
   * @param {string|Element} [options.container='body'] - Container element
   * @param {string} [options.position='fixed'] - 'fixed' or 'inline'
   * @param {boolean} [options.showWhenEmpty=false] - Show when no items
   * @param {string} [options.clickAction='modal'] - 'modal', 'custom', 'none'
   * @param {boolean} [options.animations=true] - Enable animations
   * @param {Object} [options.queue] - JobQueue instance to monitor directly
   * @param {string} [options.queueName] - JobQueue name (if not passing instance)
   */
  QueueStatus.init = function(options) {
    if (state.initialized) return;

    options = options || {};
    
    // Store queue instance if provided
    if (options.queue) {
      state.queueInstance = options.queue;
      delete options.queue;  // Don't store in config
    }
    
    for (var key in options) {
      if (options.hasOwnProperty(key)) {
        config[key] = options[key];
      }
    }

    createElements();
    bindEvents();
    updateDisplay();

    state.initialized = true;
  };

  /**
   * Destroy component
   */
  QueueStatus.destroy = function() {
    if (!state.initialized) return;

    if (state.element) {
      state.element.remove();
    }

    unbindEvents();

    state.element = null;
    state.badge = null;
    state.iconEl = null;
    state.srText = null;
    state.initialized = false;
  };

  // ============================================
  // DOM CREATION
  // ============================================

  /**
   * Create DOM elements
   * @private
   */
  function createElements() {
    if (!D || !D.create) {
      console.error('[QueueStatus] Funky.Dom not found');
      return;
    }

    var container = typeof config.container === 'string'
      ? D.one(config.container)
      : config.container;

    if (!container) {
      console.error('[QueueStatus] Container not found:', config.container);
      return;
    }

    // Main container
    state.element = D.create('div')
      .classAdd('queue-status')
      .classAdd('queue-status--' + config.position)
      .attr('role', 'status')
      .attr('aria-live', 'polite')
      .attr('aria-label', 'Sync queue status');

    // Icon
    state.iconEl = D.create('span')
      .classAdd('queue-status__icon');
    state.iconEl.get().innerHTML = getStatusIcon('idle');

    // Badge (count)
    state.badge = D.create('span')
      .classAdd('queue-status__badge')
      .attr('aria-hidden', 'true')
      .text('0');

    // Status text (for screen readers)
    state.srText = D.create('span')
      .classAdd('visually-hidden')
      .text('0 pending changes');

    state.element
      .append(state.iconEl)
      .append(state.badge)
      .append(state.srText)
      .appendTo(container);

    // Click handler
    if (config.clickAction !== 'none') {
      state.element
        .style({ cursor: 'pointer' })
        .on('click', handleClick);
    }
  }

  /**
   * Get SVG icon for status
   * @private
   * @param {string} status
   * @returns {string}
   */
  function getStatusIcon(status) {
    var icons = {
      idle: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>',
      syncing: '<svg viewBox="0 0 24 24" width="20" height="20" class="spinning"><path fill="currentColor" d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>',
      offline: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M19.35 10.04C18.67 6.59 15.64 4 12 4c-1.48 0-2.85.43-4.01 1.17l1.46 1.46C10.21 6.23 11.08 6 12 6c3.04 0 5.5 2.46 5.5 5.5v.5H19c1.66 0 3 1.34 3 3 0 1.13-.64 2.11-1.56 2.62l1.45 1.45C23.16 18.16 24 16.68 24 15c0-2.64-2.05-4.78-4.65-4.96zM3 5.27l2.75 2.74C2.56 8.15 0 10.77 0 14c0 3.31 2.69 6 6 6h11.73l2 2L21 20.73 4.27 4 3 5.27zM7.73 10l8 8H6c-2.21 0-4-1.79-4-4s1.79-4 4-4h1.73z"/></svg>',
      error: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>',
      conflict: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>'
    };
    return icons[status] || icons.idle;
  }

  // ============================================
  // EVENT BINDING
  // ============================================

  /**
   * Bind queue events
   * @private
   */
  function bindEvents() {
    var PubSub = Funky.PubSub;
    
    // RequestQueue events (DOM events with dot notation)
    if (E) {
      E.on(document, 'requestqueue.changed', updateDisplay);
      E.on(document, 'requestqueue.online', handleOnline);
      E.on(document, 'requestqueue.offline', handleOffline);
      E.on(document, 'requestqueue.processing', handleProcessing);
      E.on(document, 'requestqueue.success', handleSuccess);
      E.on(document, 'requestqueue.failed', handleFailed);
      E.on(document, 'requestqueue.conflict', handleConflict);
      E.on(document, 'requestqueue.conflict.resolved', updateDisplay);
    }
    
    // If a JobQueue instance is provided, listen via PubSub (colon notation)
    if (state.queueInstance && PubSub) {
      var prefix = 'jobqueue:' + state.queueInstance.name + ':';
      PubSub.on(prefix + 'changed', updateDisplay);
      PubSub.on(prefix + 'added', updateDisplay);
      PubSub.on(prefix + 'processing', handleProcessing);
      PubSub.on(prefix + 'success', handleSuccess);
      PubSub.on(prefix + 'failed', handleFailed);
      PubSub.on(prefix + 'paused', updateDisplay);
      PubSub.on(prefix + 'resumed', updateDisplay);
      PubSub.on(prefix + 'empty', updateDisplay);
    }
    
    // Browser online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }

  /**
   * Unbind queue events
   * @private
   */
  function unbindEvents() {
    var PubSub = Funky.PubSub;
    
    // RequestQueue events (DOM events)
    if (E) {
      E.off(document, 'requestqueue.changed', updateDisplay);
      E.off(document, 'requestqueue.online', handleOnline);
      E.off(document, 'requestqueue.offline', handleOffline);
      E.off(document, 'requestqueue.processing', handleProcessing);
      E.off(document, 'requestqueue.success', handleSuccess);
      E.off(document, 'requestqueue.failed', handleFailed);
      E.off(document, 'requestqueue.conflict', handleConflict);
      E.off(document, 'requestqueue.conflict.resolved', updateDisplay);
    }
    
    // Unbind JobQueue events via PubSub
    if (state.queueInstance && PubSub) {
      var prefix = 'jobqueue:' + state.queueInstance.name + ':';
      PubSub.off(prefix + 'changed', updateDisplay);
      PubSub.off(prefix + 'added', updateDisplay);
      PubSub.off(prefix + 'processing', handleProcessing);
      PubSub.off(prefix + 'success', handleSuccess);
      PubSub.off(prefix + 'failed', handleFailed);
      PubSub.off(prefix + 'paused', updateDisplay);
      PubSub.off(prefix + 'resumed', updateDisplay);
      PubSub.off(prefix + 'empty', updateDisplay);
    }
    
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  }

  // ============================================
  // EVENT HANDLERS
  // ============================================

  /**
   * Handle online event
   * @private
   */
  function handleOnline() {
    state.offline = false;
    
    if (!state.element) return;

    state.element
      .classRemove('queue-status--offline')
      .classAdd('queue-status--online');

    updateIcon('idle');
    updateDisplay();
  }

  /**
   * Handle offline event
   * @private
   */
  function handleOffline() {
    state.offline = true;
    
    if (!state.element) return;

    state.element
      .classRemove('queue-status--online')
      .classAdd('queue-status--offline');

    updateIcon('offline');
    updateDisplay();
  }

  /**
   * Handle processing event
   * @private
   */
  function handleProcessing() {
    if (!state.element) return;

    state.element.classAdd('queue-status--syncing');
    updateIcon('syncing');
  }

  /**
   * Handle success event
   * @private
   */
  function handleSuccess() {
    if (!state.element) return;

    state.element.classRemove('queue-status--syncing');
    updateDisplay();

    // Success animation
    if (config.animations) {
      state.element.classAdd('queue-status--success');
      setTimeout(function() {
        if (state.element) {
          state.element.classRemove('queue-status--success');
        }
      }, 1000);
    }
  }

  /**
   * Handle failed event
   * @private
   */
  function handleFailed() {
    if (!state.element) return;

    state.element
      .classRemove('queue-status--syncing')
      .classAdd('queue-status--error');

    updateIcon('error');
    updateDisplay();
  }

  /**
   * Handle conflict event
   * @private
   */
  function handleConflict() {
    if (!state.element) return;

    state.element.classAdd('queue-status--conflict');
    updateIcon('conflict');
    updateDisplay();
  }

  /**
   * Handle click on indicator
   * @private
   */
  function handleClick() {
    if (config.clickAction === 'modal') {
      QueueStatus.showModal();
    } else if (config.clickAction === 'custom') {
      E.emit(document, 'funky.queue-status.clicked');
    }
  }

  // ============================================
  // DISPLAY UPDATES
  // ============================================

  /**
   * Update display based on queue state
   * @private
   */
  function updateDisplay() {
    if (!state.element || !state.badge) return;

    var pending = getCount('pending');
    var processing = getCount('processing');
    var failed = getCount('failed');
    var conflicts = getConflicts().length;

    var total = pending + processing + failed + conflicts;

    // Update badge
    state.badge.text(total > 99 ? '99+' : String(total));

    // Update screen reader text
    if (state.srText) {
      var message = total + ' pending change' + (total !== 1 ? 's' : '');
      if (failed > 0) {
        message += ', ' + failed + ' failed';
      }
      if (conflicts > 0) {
        message += ', ' + conflicts + ' conflict' + (conflicts !== 1 ? 's' : '');
      }
      state.srText.text(message);
    }

    // Visibility
    if (total === 0 && !config.showWhenEmpty) {
      state.element.classAdd('queue-status--hidden');
    } else {
      state.element.classRemove('queue-status--hidden');
    }

    // Clear status classes
    state.element
      .classRemove('queue-status--error')
      .classRemove('queue-status--conflict');

    // Update icon based on status
    if (conflicts > 0) {
      state.element.classAdd('queue-status--conflict');
      updateIcon('conflict');
    } else if (failed > 0) {
      state.element.classAdd('queue-status--error');
      updateIcon('error');
    } else if (!isOnline()) {
      updateIcon('offline');
    } else {
      updateIcon('idle');
    }
  }

  /**
   * Update status icon
   * @private
   * @param {string} status
   */
  function updateIcon(status) {
    if (state.iconEl) {
      state.iconEl.get().innerHTML = getStatusIcon(status);
    }
  }

  // ============================================
  // MODAL
  // ============================================

  var MODAL_ID = 'funky-queue-status-modal';

  /**
   * Show queue viewer modal
   */
  QueueStatus.showModal = function() {
    var Modal = Funky.Modal;

    if (!Modal || !Modal.create) {
      if (E) {
        E.emit(document, 'funky.queue-status.modal-requested');
      }
      return;
    }

    var queue = getQueue();
    var online = isOnline();

    // Remove existing modal if present
    var existingModal = document.getElementById(MODAL_ID);
    if (existingModal) {
      var instance = Modal.getInstance(existingModal);
      if (instance) {
        instance.dispose();
      }
      existingModal.remove();
    }

    // Build footer buttons
    var footerButtons = [
      {
        text: 'Sync Now',
        class: 'btn btn-primary queue-modal__btn',
        id: MODAL_ID + '-sync',
        onClick: function() {
          if (queue && queue.sync) {
            queue.sync();
          }
          Modal.hide('#' + MODAL_ID);
        }
      },
      {
        text: 'Retry Failed',
        class: 'btn btn-secondary queue-modal__btn',
        id: MODAL_ID + '-retry',
        onClick: function() {
          if (queue && queue.retryAll) {
            queue.retryAll();
          }
          Modal.hide('#' + MODAL_ID);
        }
      },
      {
        text: 'Clear All',
        class: 'btn btn-outline-danger queue-modal__btn',
        id: MODAL_ID + '-clear',
        onClick: function() {
          if (confirm('Discard all pending changes?')) {
            if (queue && queue.clear) {
              queue.clear();
            }
            Modal.hide('#' + MODAL_ID);
          }
        }
      },
      {
        text: 'Close',
        class: 'btn btn-secondary queue-modal__btn',
        close: true
      }
    ];

    // Create modal
    var modalEl = Modal.create({
      id: MODAL_ID,
      title: 'Pending Changes',
      body: buildModalContent(),
      size: 'lg',
      scrollable: true,
      footerButtons: footerButtons
    });

    // Disable buttons based on state
    var syncBtn = document.getElementById(MODAL_ID + '-sync');
    var retryBtn = document.getElementById(MODAL_ID + '-retry');
    
    if (syncBtn && (!online || getCount('pending') === 0)) {
      syncBtn.disabled = true;
    }
    if (retryBtn && getCount('failed') === 0) {
      retryBtn.disabled = true;
    }

    // Show modal
    Modal.show('#' + MODAL_ID);
  };

  /**
   * Build modal content
   * @private
   * @returns {Element}
   */
  function buildModalContent() {
    var items = getAll();

    if (items.length === 0) {
      return D.create('p')
        .classAdd('text-muted', 'text-center', 'py-4')
        .text('No pending changes')
        .get();
    }

    var container = D.create('div').classAdd('queue-modal');

    // Status summary
    var summary = D.create('div').classAdd('queue-modal__summary', 'mb-3');
    var pending = getCount('pending');
    var processing = getCount('processing');
    var failed = getCount('failed');
    var conflicts = getConflicts().length;

    var summaryParts = [];
    if (pending > 0) summaryParts.push(pending + ' pending');
    if (processing > 0) summaryParts.push(processing + ' syncing');
    if (failed > 0) summaryParts.push(failed + ' failed');
    if (conflicts > 0) summaryParts.push(conflicts + ' conflicts');

    var summaryTextEl = D.create('span');
    summaryTextEl.get().innerHTML = '<strong>Status:</strong> ' + summaryParts.join(', ');
    summary.append(summaryTextEl);

    // Online/offline indicator
    var online = isOnline();
    var onlineStatus = D.create('span')
      .classAdd('badge', online ? 'bg-success' : 'bg-warning')
      .text(online ? 'Online' : 'Offline')
      .style({ marginLeft: '0.5rem' });

    summary.append(onlineStatus);
    container.append(summary);

    // Items list
    var list = D.create('div').classAdd('queue-modal__list');

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var row = buildItemRow(item);
      list.append(row);
    }

    container.append(list);

    return container.get();
  }

  /**
   * Build a single item row
   * @private
   * @param {Object} item
   * @returns {Element}
   */
  function buildItemRow(item) {
    var status = item.conflictStatus || item.status;
    var data = item.data || {};

    var row = D.create('div')
      .classAdd('queue-modal__item')
      .classAdd('queue-modal__item--' + status);

    // Info section
    var info = D.create('div').classAdd('queue-modal__item-info');

    var method = D.create('span')
      .classAdd('queue-modal__item-method')
      .text(data.method || item.type || 'JOB');

    var desc = D.create('span')
      .classAdd('queue-modal__item-description')
      .text(data.description || data.url || 'Job #' + item.id);

    info.append(method, desc);

    // Status badge
    var statusBadge = D.create('div').classAdd('queue-modal__item-status');
    var badge = D.create('span')
      .classAdd('badge', getStatusBadgeClass(status))
      .text(status);
    statusBadge.append(badge);

    // Actions
    var actions = createItemActions(item);

    row.append(info, statusBadge, actions);

    return row;
  }

  /**
   * Get Bootstrap badge class for status
   * @private
   * @param {string} status
   * @returns {string}
   */
  function getStatusBadgeClass(status) {
    var classes = {
      pending: 'bg-secondary',
      processing: 'bg-info',
      failed: 'bg-danger',
      conflict: 'bg-warning'
    };
    return classes[status] || 'bg-secondary';
  }

  /**
   * Create action buttons for item
   * @private
   * @param {Object} item
   * @returns {Element}
   */
  function createItemActions(item) {
    var queue = getQueue();
    var status = item.conflictStatus || item.status;

    var actions = D.create('div').classAdd('queue-modal__item-actions', 'btn-group', 'btn-group-sm');

    if (status === 'failed') {
      var retryBtn = D.create('button')
        .classAdd('btn', 'btn-outline-primary')
        .text('Retry')
        .on('click', function() {
          if (queue && queue.retry) {
            queue.retry(item.id);
          }
        });
      actions.append(retryBtn);
    }

    if (status === 'conflict') {
      var resolveBtn = D.create('button')
        .classAdd('btn', 'btn-outline-warning')
        .text('Resolve')
        .on('click', function() {
          if (queue && queue.resolveConflict) {
            // Trigger prompt resolution
            queue.resolveConflict(item.id, 'client-wins');
          }
        });
      actions.append(resolveBtn);
    }

    var removeBtn = D.create('button')
      .classAdd('btn', 'btn-outline-danger')
      .text('Remove')
      .on('click', function() {
        if (queue && queue.remove) {
          queue.remove(item.id);
        }
      });
    actions.append(removeBtn);

    return actions;
  }

  // ============================================
  // PUBLIC METHODS
  // ============================================

  /**
   * Show or hide the indicator
   * @param {boolean} visible
   */
  QueueStatus.setVisible = function(visible) {
    state.visible = visible;
    if (state.element) {
      state.element.classToggle('queue-status--hidden', !visible);
    }
  };

  /**
   * Force refresh display
   */
  QueueStatus.refresh = function() {
    updateDisplay();
  };

  /**
   * Check if initialized
   * @returns {boolean}
   */
  QueueStatus.isInitialized = function() {
    return state.initialized;
  };

  // ============================================
  // EXPORT
  // ============================================

  Funky.register('QueueStatus', QueueStatus);

})(window);

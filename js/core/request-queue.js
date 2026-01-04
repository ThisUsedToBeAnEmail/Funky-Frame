/**
 * Funky.RequestQueue - HTTP Request Queue for Offline Support
 *
 * Built on Funky.JobQueue, adds:
 * - Online/offline detection
 * - Funky.Api wrapper
 * - HTTP-specific handling
 *
 * 100% OPTIONAL - If this script is not loaded, everything works exactly as before.
 * Even when loaded, nothing happens until enable() is explicitly called.
 *
 * @example
 *   Funky.RequestQueue.enable();
 *
 *   // Now API calls auto-queue when offline
 *   Funky.Api.post('/api/trades', { symbol: 'AAPL' });
 *
 * @version 1.0.1
 */
(function(global) {
  'use strict';

  // Registry check - must load namespace.js first
  if (!global.Funky || !global.Funky.register) {
    console.error('[Funky.RequestQueue] Registry not found. Load namespace.js first.');
    return;
  }

  var Funky = global.Funky;

  // Prevent double-registration
  if (Funky.has('RequestQueue')) {
    return;
  }
  var E = Funky.Events;
  var PubSub = Funky.PubSub;
  var JobQueue = Funky.JobQueue;

  var RequestQueue = {};

  // ============================================
  // STATE
  // ============================================

  var state = {
    online: navigator.onLine,
    enabled: false,
    queue: null,              // JobQueue instance (lazy init)
    originalApi: null,        // Original Funky.Api methods
    listenersAttached: false, // Network listeners attached?
    inQueueAwareRequest: false, // Recursion guard
    _onlineHandler: null,     // Handler reference for cleanup
    _offlineHandler: null     // Handler reference for cleanup
  };

  var config = {
    queueName: 'funky-requests',
    queueableMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],
    queueableUrls: null,      // null = all URLs queueable
    excludeUrls: [],          // URLs to never queue
    autoProcess: true,
    persist: true,            // Persist to IndexedDB
    maxAttempts: 3,
    timeout: 30000
  };

  // ============================================
  // CONFLICT RESOLUTION CONFIG
  // ============================================

  var conflictConfig = {
    // Default strategy when no handler registered
    // Options: 'server-wins', 'client-wins', 'prompt', 'merge'
    defaultStrategy: 'prompt',

    // Strategy handlers by URL pattern
    strategies: {}
  };

  // ============================================
  // INITIALIZATION (LAZY - only when enabled)
  // ============================================

  /**
   * Initialize network listeners (called only when enabled)
   * @private
   */
  function initNetworkListeners() {
    if (state.listenersAttached) return;

    // Store handler references for cleanup
    state._onlineHandler = function() {
      state.online = true;
      if (state.enabled) {
        PubSub.emit('funky:request-queue:online');
        if (state.queue && config.autoProcess) {
          state.queue.resume();
        }
      }
    };

    state._offlineHandler = function() {
      state.online = false;
      if (state.enabled) {
        PubSub.emit('funky:request-queue:offline');
        if (state.queue) {
          state.queue.pause();
        }
      }
    };

    window.addEventListener('online', state._onlineHandler);
    window.addEventListener('offline', state._offlineHandler);

    state.listenersAttached = true;
  }

  /**
   * Initialize the underlying JobQueue (called only when enabled)
   * @private
   * @returns {Promise}
   */
  function initJobQueue() {
    if (state.queue) return Promise.resolve(); // Already initialized

    if (!JobQueue) {
      console.error('[RequestQueue] Funky.JobQueue not found');
      return Promise.reject(new Error('JobQueue not available'));
    }

    state.queue = new JobQueue({
      name: config.queueName,
      processor: processRequest,
      autoProcess: config.autoProcess,
      persist: config.persist,
      maxAttempts: config.maxAttempts,
      timeout: config.timeout
    });

    // Forward relevant events
    state.queue.on('success', function(data) {
      PubSub.emit('funky:request-queue:success', data);
    });

    state.queue.on('failed', function(data) {
      PubSub.emit('funky:request-queue:failed', data);
      // Check for conflict (409) and handle
      handleJobFailure(data);
    });

    state.queue.on('changed', function(data) {
      PubSub.emit('funky:request-queue:changed', data);
    });

    state.queue.on('processing', function(data) {
      PubSub.emit('funky:request-queue:processing', data);
    });

    state.queue.on('retry', function(data) {
      PubSub.emit('funky:request-queue:retry', data);
    });

    // Initialize storage if persistence enabled
    if (config.persist) {
      return state.queue.init().then(function() {
        // Start paused if offline
        if (!state.online) {
          state.queue.pause();
        }
      });
    }

    // Start paused if offline
    if (!state.online) {
      state.queue.pause();
    }

    return Promise.resolve();
  }

  // ============================================
  // REQUEST PROCESSOR
  // ============================================

  /**
   * Process a request job
   * @private
   * @param {Object} job
   * @returns {Promise}
   */
  function processRequest(job) {
    var request = job.data;

    return new Promise(function(resolve, reject) {
      var Api = global.Funky && global.Funky.Api;

      // Use original API if available, otherwise fallback to fetch
      var requestFn = (state.originalApi && state.originalApi.request) ||
                      (Api && Api.request && Api.request.bind(Api)) ||
                      fallbackFetch;

      // Include any force headers from conflict resolution
      var headers = Object.assign({}, request.headers || {});

      requestFn({
        method: request.method,
        url: request.url,
        data: request.data,
        headers: headers
      }).then(function(response) {
        resolve(response);
      }).catch(function(error) {
        // Check for conflict (409)
        if (error.status === 409) {
          error.isConflict = true;
          // Try to extract server data from response
          if (error.response && error.response.serverVersion) {
            error.serverData = error.response.serverVersion;
          }
        }
        reject(error);
      });
    });
  }

  // ============================================
  // CONFLICT DETECTION & RESOLUTION
  // ============================================

  /**
   * Handle job failure - check for conflicts
   * Called by JobQueue's failed event
   * @private
   * @param {Object} data - Event data with job and error
   */
  function handleJobFailure(data) {
    var job = data.job;
    var error = data.error;

    // Check for HTTP 409 conflict
    if (error && error.status === 409) {
      handleConflict(job, error);
    }
  }

  /**
   * Handle a conflict error
   * @private
   * @param {Object} job - The failed job
   * @param {Object} error - The error with conflict info
   */
  function handleConflict(job, error) {
    // Get the item reference from queue
    var item = state.queue ? state.queue.get(job.id) : null;
    if (!item) return;

    // Mark as conflict status (if queue supports it, otherwise stays failed)
    item.conflictStatus = 'conflict';
    item.serverData = error.serverData || null;

    var strategy = getStrategyForUrl(item.data.url);

    PubSub.emit('funky:request-queue:conflict', {
      item: item,
      strategy: strategy,
      error: error
    });

    // Resolve based on strategy
    resolveConflictByStrategy(item, strategy);
  }

  /**
   * Get conflict strategy for URL
   * @private
   * @param {string} url
   * @returns {string|Function}
   */
  function getStrategyForUrl(url) {
    var patterns = Object.keys(conflictConfig.strategies);

    for (var i = 0; i < patterns.length; i++) {
      var pattern = patterns[i];
      if (urlMatches(url, pattern)) {
        return conflictConfig.strategies[pattern];
      }
    }

    return conflictConfig.defaultStrategy;
  }

  /**
   * Resolve conflict using strategy
   * @private
   * @param {Object} item - Queue item
   * @param {string|Function} strategy - Resolution strategy
   */
  function resolveConflictByStrategy(item, strategy) {
    switch (strategy) {
      case 'server-wins':
        resolveServerWins(item);
        break;
      case 'client-wins':
        resolveClientWins(item);
        break;
      case 'merge':
        attemptAutoMerge(item);
        break;
      case 'prompt':
        promptUserForResolution(item);
        break;
      default:
        if (typeof strategy === 'function') {
          // Custom strategy function
          strategy(item, {
            resolve: function() { resolveClientWins(item); },
            discard: function() { resolveServerWins(item); },
            merge: function() { attemptAutoMerge(item); },
            custom: function(data) { resolveWithCustomData(item, data); }
          });
        } else {
          promptUserForResolution(item);
        }
    }
  }

  /**
   * Server wins - discard local changes
   * @private
   * @param {Object} item
   */
  function resolveServerWins(item) {
    if (state.queue) {
      state.queue.remove(item.id);
    }

    PubSub.emit('funky:request-queue:conflict:resolved', {
      item: item,
      strategy: 'server-wins',
      discarded: true
    });
  }

  /**
   * Client wins - retry with force flag
   * @private
   * @param {Object} item
   */
  function resolveClientWins(item) {
    if (!state.queue) return;

    // Add override header for server to accept
    item.data.headers = item.data.headers || {};
    item.data.headers['X-Force-Update'] = 'true';

    // Reset conflict status
    item.conflictStatus = null;

    // Retry the job
    state.queue.retry(item.id);

    PubSub.emit('funky:request-queue:conflict:resolved', {
      item: item,
      strategy: 'client-wins',
      retrying: true
    });
  }

  /**
   * Attempt automatic merge of client and server data
   * @private
   * @param {Object} item
   */
  function attemptAutoMerge(item) {
    if (!item.serverData || !item.data.data) {
      // Can't merge without both versions
      promptUserForResolution(item);
      return;
    }

    // Simple merge: local changes override server
    // More sophisticated merge would compare field-by-field
    var merged = Object.assign({}, item.serverData, item.data.data);

    // Update item with merged data
    item.data.data = merged;
    item.data.headers = item.data.headers || {};
    item.data.headers['X-Merged'] = 'true';

    // Reset conflict status
    item.conflictStatus = null;

    // Retry the job
    if (state.queue) {
      state.queue.retry(item.id);
    }

    PubSub.emit('funky:request-queue:conflict:resolved', {
      item: item,
      strategy: 'merge',
      merged: merged
    });
  }

  /**
   * Resolve with custom data provided by user
   * @private
   * @param {Object} item
   * @param {Object} customData
   */
  function resolveWithCustomData(item, customData) {
    item.data.data = customData;

    // Reset conflict status
    item.conflictStatus = null;

    // Retry the job
    if (state.queue) {
      state.queue.retry(item.id);
    }

    PubSub.emit('funky:request-queue:conflict:resolved', {
      item: item,
      strategy: 'custom',
      data: customData
    });
  }

  /**
   * Prompt user for conflict resolution via Modal
   * @private
   * @param {Object} item
   */
  function promptUserForResolution(item) {
    var Modal = global.Funky && global.Funky.Modal;

    if (!Modal || !Modal.show) {
      // Fallback: emit event for custom handling
      PubSub.emit('funky:request-queue:conflict:prompt', { item: item });
      return;
    }

    Modal.show({
      title: 'Sync Conflict',
      icon: 'warning',
      content: buildConflictModalContent(item),
      buttons: [
        {
          label: 'Keep My Changes',
          variant: 'primary',
          action: function() {
            resolveClientWins(item);
            Modal.hide();
          }
        },
        {
          label: 'Use Server Version',
          variant: 'secondary',
          action: function() {
            resolveServerWins(item);
            Modal.hide();
          }
        },
        {
          label: 'Review',
          variant: 'outline',
          action: function() {
            Modal.hide();
            PubSub.emit('funky:request-queue:conflict:review', { item: item });
          }
        }
      ],
      closeButton: false  // Force user to choose
    });
  }

  /**
   * Build conflict modal content
   * @private
   * @param {Object} item
   * @returns {string|Element}
   */
  function buildConflictModalContent(item) {
    var D = global.Funky && global.Funky.Dom;
    var desc = item.data.description || item.data.method + ' ' + item.data.url;

    if (!D || !D.create) {
      return '<p>Your changes conflict with updates made on the server. ' +
             'How would you like to resolve this?</p>' +
             '<p><strong>Action:</strong> ' + desc + '</p>';
    }

    return D.create('div').classAdd('queue-conflict-content')
      .append(
        D.create('p').text('Your changes conflict with updates made on the server.'),
        D.create('div').classAdd('conflict-details')
          .append(
            D.create('strong').text('Action: '),
            D.create('span').text(desc)
          )
      )
      .raw();
  }

  /**
   * Fallback fetch implementation
   * @private
   * @param {Object} options
   * @returns {Promise}
   */
  function fallbackFetch(options) {
    var fetchOptions = {
      method: options.method || 'GET',
      headers: Object.assign({
        'Content-Type': 'application/json'
      }, options.headers || {})
    };

    if (options.data && options.method !== 'GET') {
      fetchOptions.body = JSON.stringify(options.data);
    }

    return fetch(options.url, fetchOptions).then(function(response) {
      if (!response.ok) {
        var error = new Error('HTTP ' + response.status);
        error.status = response.status;
        throw error;
      }
      return response.json();
    });
  }

  // ============================================
  // API WRAPPING
  // ============================================

  /**
   * Enable automatic queueing for Funky.Api
   * @param {Object} [options]
   * @param {Array<string>} [options.methods] - HTTP methods to queue (default: POST, PUT, PATCH, DELETE)
   * @param {Array<string|RegExp>} [options.urls] - URL patterns to queue (default: all)
   * @param {Array<string|RegExp>} [options.exclude] - URL patterns to never queue
   * @returns {Promise} Resolves when enabled
   */
  RequestQueue.enable = function(options) {
    if (state.enabled) {
      console.warn('[RequestQueue] Already enabled');
      return Promise.resolve();
    }

    options = options || {};

    // Merge config
    if (options.methods) config.queueableMethods = options.methods;
    if (options.urls) config.queueableUrls = options.urls;
    if (options.exclude) config.excludeUrls = options.exclude;
    if (options.persist !== undefined) config.persist = options.persist;
    if (options.maxAttempts) config.maxAttempts = options.maxAttempts;
    if (options.timeout) config.timeout = options.timeout;

    // Lazy initialization - only when actually enabled
    initNetworkListeners();

    return initJobQueue().then(function() {
      var Api = global.Funky && global.Funky.Api;
      if (!Api) {
        console.error('[RequestQueue] Funky.Api not found');
        return;
      }

      // Store original methods
      state.originalApi = {
        request: Api.request.bind(Api)
      };

      // Store convenience methods if they exist
      ['get', 'post', 'put', 'patch', 'delete'].forEach(function(method) {
        if (typeof Api[method] === 'function') {
          state.originalApi[method] = Api[method].bind(Api);
        }
      });

      // Wrap main request method
      Api.request = function(requestOptions) {
        return queueAwareRequest(requestOptions);
      };

      // Wrap convenience methods
      ['get', 'post', 'put', 'patch', 'delete'].forEach(function(method) {
        if (state.originalApi[method]) {
          Api[method] = function(url, data, options) {
            return queueAwareRequest({
              method: method.toUpperCase(),
              url: url,
              data: data,
              options: options
            });
          };
        }
      });

      state.enabled = true;
      PubSub.emit('funky:request-queue:enabled');
    });
  };

  /**
   * Disable automatic queueing, restore original Funky.Api
   */
  RequestQueue.disable = function() {
    if (!state.enabled) return;

    var Api = global.Funky && global.Funky.Api;
    if (Api && state.originalApi) {
      // Restore original methods
      Api.request = state.originalApi.request;

      ['get', 'post', 'put', 'patch', 'delete'].forEach(function(method) {
        if (state.originalApi[method]) {
          Api[method] = state.originalApi[method];
        }
      });
    }

    state.enabled = false;
    state.originalApi = null;
    PubSub.emit('funky:request-queue:disabled');
  };

  /**
   * Destroy RequestQueue completely, removing all event listeners
   * Call this when the module is no longer needed
   */
  RequestQueue.destroy = function() {
    // Disable first to restore API
    RequestQueue.disable();

    // Remove network listeners
    if (state.listenersAttached) {
      if (state._onlineHandler) {
        window.removeEventListener('online', state._onlineHandler);
        state._onlineHandler = null;
      }
      if (state._offlineHandler) {
        window.removeEventListener('offline', state._offlineHandler);
        state._offlineHandler = null;
      }
      state.listenersAttached = false;
    }

    // Clear queue
    if (state.queue) {
      state.queue = null;
    }
  };

  // ============================================
  // QUEUE-AWARE REQUEST HANDLING
  // ============================================

  /**
   * Queue-aware request handler
   * @private
   * @param {Object} options
   * @returns {Promise}
   */
  function queueAwareRequest(options) {
    // Recursion guard - if we're already in queueAwareRequest, use native fetch
    if (state.inQueueAwareRequest) {
      return nativeFetch(options);
    }

    var method = (options.method || 'GET').toUpperCase();

    // Check if should queue when offline
    if (shouldQueue(method, options.url)) {
      if (!state.online) {
        return queueRequest(options);
      }
    }

    // Use stored originalApi if available
    var requestFn = state.originalApi && state.originalApi.request;
    if (requestFn) {
      // Set recursion guard before calling
      state.inQueueAwareRequest = true;
      return requestFn(options)
        .then(function(result) {
          state.inQueueAwareRequest = false;
          return result;
        })
        .catch(function(error) {
          state.inQueueAwareRequest = false;
          // Network error while online? Try queueing
          if (isNetworkError(error) && shouldQueue(method, options.url)) {
            console.log('[RequestQueue] Network error, queueing for retry');
            return queueRequest(options);
          }
          throw error;
        });
    }

    // No originalApi - use native fetch fallback
    return nativeFetch(options);
  }

  /**
   * Native fetch fallback when no API is available
   * @private
   */
  function nativeFetch(options) {
    // Guard against missing options or URL
    if (!options || !options.url) {
      return Promise.reject(new Error('URL is required for fetch'));
    }

    var url = options.url;
    var method = (options.method || 'GET').toUpperCase();
    var fetchOptions = {
      method: method,
      headers: options.headers || {}
    };

    if (options.data && method !== 'GET') {
      fetchOptions.body = JSON.stringify(options.data);
      fetchOptions.headers['Content-Type'] = fetchOptions.headers['Content-Type'] || 'application/json';
    }

    return fetch(url, fetchOptions).then(function(response) {
      if (!response.ok) {
        return Promise.reject(new Error('HTTP error ' + response.status));
      }
      return response.json().catch(function() {
        return response.text();
      });
    });
  }

  /**
   * Check if request should be queued
   * @private
   * @param {string} method
   * @param {string} url
   * @returns {boolean}
   */
  function shouldQueue(method, url) {
    // Check method
    if (config.queueableMethods.indexOf(method) === -1) {
      return false;
    }

    // Check excluded URLs
    for (var i = 0; i < config.excludeUrls.length; i++) {
      if (urlMatches(url, config.excludeUrls[i])) {
        return false;
      }
    }

    // Check allowed URLs (if specified)
    if (config.queueableUrls) {
      for (var j = 0; j < config.queueableUrls.length; j++) {
        if (urlMatches(url, config.queueableUrls[j])) {
          return true;
        }
      }
      return false;
    }

    return true;
  }

  /**
   * Check if URL matches pattern
   * @private
   * @param {string} url
   * @param {string|RegExp} pattern
   * @returns {boolean}
   */
  function urlMatches(url, pattern) {
    if (pattern instanceof RegExp) {
      return pattern.test(url);
    }
    if (pattern.indexOf('*') !== -1) {
      var regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return regex.test(url);
    }
    return url.indexOf(pattern) !== -1;
  }

  /**
   * Check if error is a network error
   * @private
   * @param {Error} error
   * @returns {boolean}
   */
  function isNetworkError(error) {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      return true;
    }
    return !error.status;
  }

  /**
   * Queue a request for later processing
   * @private
   * @param {Object} options
   * @returns {Promise}
   */
  function queueRequest(options) {
    return new Promise(function(resolve) {
      var job = state.queue.add({
        type: 'http-request',
        data: {
          method: options.method || 'GET',
          url: options.url,
          data: options.data,
          headers: options.headers,
          description: options.description || generateDescription(options)
        },
        meta: {
          queuedAt: new Date().toISOString()
        }
      });

      PubSub.emit('funky:request-queue:queued', { job: job, options: options });

      // Return "queued" response
      resolve({
        queued: true,
        queueId: job.id,
        message: 'Request queued for later processing'
      });
    });
  }

  /**
   * Generate description from request options
   * @private
   * @param {Object} options
   * @returns {string}
   */
  function generateDescription(options) {
    var method = options.method || 'GET';
    var parts = options.url.split('/').filter(function(p) { return p; });
    var resource = parts[parts.length - 1] || 'resource';

    // If last part is an ID (numeric), use the part before it
    if (/^\d+$/.test(resource)) {
      resource = parts[parts.length - 2] || 'resource';
    }

    var action = {
      POST: 'Create',
      PUT: 'Update',
      PATCH: 'Update',
      DELETE: 'Delete'
    }[method] || method;

    return action + ' ' + resource;
  }

  // ============================================
  // PUBLIC API (delegates to JobQueue)
  // ============================================

  /**
   * Check if online
   * @returns {boolean}
   */
  RequestQueue.isOnline = function() {
    return state.online;
  };

  /**
   * Check if enabled
   * @returns {boolean}
   */
  RequestQueue.isEnabled = function() {
    return state.enabled;
  };

  /**
   * Get all queued requests
   * @param {Object} [filter] - Filter options
   * @returns {Array}
   */
  RequestQueue.getAll = function(filter) {
    return state.queue ? state.queue.getAll(filter) : [];
  };

  /**
   * Get a queued request by ID
   * @param {number} id
   * @returns {Object|null}
   */
  RequestQueue.get = function(id) {
    return state.queue ? state.queue.get(id) : null;
  };

  /**
   * Get count of queued requests
   * @param {string} [status] - Filter by status
   * @returns {number}
   */
  RequestQueue.count = function(status) {
    return state.queue ? state.queue.count(status) : 0;
  };

  /**
   * Remove a request from the queue
   * @param {number} id
   * @returns {boolean}
   */
  RequestQueue.remove = function(id) {
    return state.queue ? state.queue.remove(id) : false;
  };

  /**
   * Clear the queue
   * @param {string} [status] - Only clear requests with this status
   */
  RequestQueue.clear = function(status) {
    if (state.queue) state.queue.clear(status);
  };

  /**
   * Retry a failed request
   * @param {number} id
   * @returns {boolean}
   */
  RequestQueue.retry = function(id) {
    return state.queue ? state.queue.retry(id) : false;
  };

  /**
   * Retry all failed requests
   * @returns {number} Number of requests reset for retry
   */
  RequestQueue.retryAll = function() {
    return state.queue ? state.queue.retryAll() : 0;
  };

  /**
   * Force sync all pending requests
   * @returns {Promise<Object>} Results: { success, failed, pending }
   */
  RequestQueue.sync = function() {
    if (!state.queue || !state.online) {
      return Promise.resolve({ success: 0, failed: 0, pending: 0 });
    }

    state.queue.resume();
    return state.queue.sync();
  };

  /**
   * Pause processing
   */
  RequestQueue.pause = function() {
    if (state.queue) state.queue.pause();
  };

  /**
   * Resume processing
   */
  RequestQueue.resume = function() {
    if (state.queue) state.queue.resume();
  };

  // ============================================
  // EVENTS
  // ============================================

  /**
   * Subscribe to RequestQueue events
   * @param {string} event - Event name (without prefix)
   * @param {Function} handler
   * @returns {Object} RequestQueue for chaining
   */
  RequestQueue.on = function(event, handler) {
    if (PubSub && PubSub.on) {
      PubSub.on('funky:request-queue:' + event, handler);
    }
    return RequestQueue;
  };

  /**
   * Unsubscribe from RequestQueue events
   * @param {string} event - Event name (without prefix)
   * @param {Function} handler
   * @returns {Object} RequestQueue for chaining
   */
  RequestQueue.off = function(event, handler) {
    if (PubSub && PubSub.off) {
      PubSub.off('funky:request-queue:' + event, handler);
    }
    return RequestQueue;
  };

  // ============================================
  // CONFLICT RESOLUTION API
  // ============================================

  /**
   * Set default conflict resolution strategy
   * @param {string} strategy - 'server-wins', 'client-wins', 'prompt', 'merge'
   */
  RequestQueue.setDefaultConflictStrategy = function(strategy) {
    conflictConfig.defaultStrategy = strategy;
  };

  /**
   * Register conflict strategy for URL pattern
   * @param {string|RegExp} pattern - URL pattern to match
   * @param {string|Function} strategy - Strategy name or custom handler
   *
   * @example
   *   // Use specific strategy for URL pattern
   *   RequestQueue.setConflictStrategy('/api/trades/*', 'prompt');
   *
   *   // Custom handler
   *   RequestQueue.setConflictStrategy('/api/docs/*', function(item, actions) {
   *     if (item.data.priority === 'high') {
   *       actions.resolve();  // Client wins
   *     } else {
   *       actions.discard();  // Server wins
   *     }
   *   });
   */
  RequestQueue.setConflictStrategy = function(pattern, strategy) {
    conflictConfig.strategies[pattern] = strategy;
  };

  /**
   * Get all items with conflict status
   * @returns {Array}
   */
  RequestQueue.getConflicts = function() {
    if (!state.queue) return [];

    var all = state.queue.getAll({ status: 'failed' });
    return all.filter(function(item) {
      return item.conflictStatus === 'conflict';
    });
  };

  /**
   * Resolve a specific conflict
   * @param {number} id - Queue item ID
   * @param {string} strategy - 'server-wins', 'client-wins', 'merge', 'custom'
   * @param {Object} [customData] - Custom data for 'custom' strategy
   * @returns {boolean} True if conflict was found and resolved
   */
  RequestQueue.resolveConflict = function(id, strategy, customData) {
    var item = state.queue ? state.queue.get(id) : null;
    if (!item) return false;

    switch (strategy) {
      case 'server-wins':
        resolveServerWins(item);
        break;
      case 'client-wins':
        resolveClientWins(item);
        break;
      case 'merge':
        attemptAutoMerge(item);
        break;
      case 'custom':
        if (customData) {
          resolveWithCustomData(item, customData);
        }
        break;
      default:
        return false;
    }

    return true;
  };

  /**
   * Resolve all conflicts with the same strategy
   * @param {string} strategy - 'server-wins', 'client-wins', 'merge'
   * @returns {number} Number of conflicts resolved
   */
  RequestQueue.resolveAllConflicts = function(strategy) {
    var conflicts = RequestQueue.getConflicts();
    var resolved = 0;

    conflicts.forEach(function(item) {
      if (RequestQueue.resolveConflict(item.id, strategy)) {
        resolved++;
      }
    });

    return resolved;
  };

  // ============================================
  // DEBUG
  // ============================================

  /**
   * Get debug information
   * @returns {Object}
   */
  RequestQueue.debug = function() {
    return {
      online: state.online,
      enabled: state.enabled,
      listenersAttached: state.listenersAttached,
      config: config,
      conflictConfig: conflictConfig,
      conflicts: RequestQueue.getConflicts(),
      queue: state.queue ? state.queue.debug() : null
    };
  };

  // ============================================
  // EXPORT ONLY - NO AUTO-INIT
  // ============================================
  //
  // Script loading has ZERO side effects.
  // Nothing happens until enable() is explicitly called.
  //

  Funky.register('RequestQueue', RequestQueue);

})(window);

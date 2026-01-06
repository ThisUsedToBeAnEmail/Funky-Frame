/**
 * Funky.JobQueue - Generic Job Queue
 *
 * A flexible job queue for deferred/background processing.
 * Not tied to HTTP or PWA - process anything with your own processor function.
 * Supports IndexedDB persistence with localStorage fallback.
 *
 * @example
 *   var queue = new Funky.JobQueue({
 *     name: 'my-jobs',
 *     processor: function(job) {
 *       return doSomethingAsync(job.data);
 *     },
 *     persist: true  // Enable persistence (default: false)
 *   });
 *
 *   // Initialize storage (if persist: true)
 *   queue.init().then(function() {
 *     queue.add({ type: 'task', data: { foo: 'bar' } });
 *   });
 *
 * @version 1.0.3
 */
(function(global) {
  'use strict';

  // Registry check - must load namespace.js first
  if (!global.Funky || !global.Funky.register) {
    console.error('[Funky.JobQueue] Registry not found. Load namespace.js first.');
    return;
  }

  // Prevent double-registration
  if (global.Funky.isRegistered('JobQueue')) {
    return;
  }

  var Funky = global.Funky;

  // Track all queue instances by name
  var instances = {};

  // ============================================
  // INDEXEDDB STORAGE
  // ============================================

  /**
   * Open IndexedDB connection
   * @private
   * @param {string} dbName - Database name
   * @param {string} storeName - Object store name
   * @param {number} version - Schema version
   * @returns {Promise<IDBDatabase|null>}
   */
  function openDatabase(dbName, storeName, version) {
    return new Promise(function(resolve, reject) {
      if (!window.indexedDB) {
        resolve(null);
        return;
      }

      var request = indexedDB.open(dbName, version);

      request.onerror = function(event) {
        console.warn('[JobQueue] IndexedDB error, falling back to localStorage');
        resolve(null);
      };

      request.onsuccess = function(event) {
        resolve(event.target.result);
      };

      request.onupgradeneeded = function(event) {
        var db = event.target.result;

        // Create object store if doesn't exist
        if (!db.objectStoreNames.contains(storeName)) {
          var store = db.createObjectStore(storeName, {
            keyPath: 'id',
            autoIncrement: false
          });

          // Create indexes for querying
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('priority', 'priority', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  /**
   * Get all items from IndexedDB
   * @private
   * @param {IDBDatabase} db
   * @param {string} storeName
   * @returns {Promise<Array>}
   */
  function idbGetAll(db, storeName) {
    return new Promise(function(resolve, reject) {
      var transaction = db.transaction([storeName], 'readonly');
      var store = transaction.objectStore(storeName);
      var request = store.getAll();

      request.onsuccess = function() {
        resolve(request.result || []);
      };

      request.onerror = function() {
        reject(request.error);
      };
    });
  }

  /**
   * Save item to IndexedDB
   * @private
   * @param {IDBDatabase} db
   * @param {string} storeName
   * @param {Object} item
   * @returns {Promise}
   */
  function idbSave(db, storeName, item) {
    return new Promise(function(resolve, reject) {
      var transaction = db.transaction([storeName], 'readwrite');
      var store = transaction.objectStore(storeName);
      var request = store.put(item);

      request.onsuccess = function() {
        resolve(request.result);
      };

      request.onerror = function() {
        reject(request.error);
      };
    });
  }

  /**
   * Delete item from IndexedDB
   * @private
   * @param {IDBDatabase} db
   * @param {string} storeName
   * @param {number} id
   * @returns {Promise}
   */
  function idbDelete(db, storeName, id) {
    return new Promise(function(resolve, reject) {
      var transaction = db.transaction([storeName], 'readwrite');
      var store = transaction.objectStore(storeName);
      var request = store.delete(id);

      request.onsuccess = function() {
        resolve();
      };

      request.onerror = function() {
        reject(request.error);
      };
    });
  }

  /**
   * Clear items from IndexedDB
   * @private
   * @param {IDBDatabase} db
   * @param {string} storeName
   * @param {string} [status] - Optional status filter
   * @returns {Promise}
   */
  function idbClear(db, storeName, status) {
    return new Promise(function(resolve, reject) {
      if (!status) {
        // Clear everything
        var transaction = db.transaction([storeName], 'readwrite');
        var store = transaction.objectStore(storeName);
        var request = store.clear();

        request.onsuccess = function() { resolve(); };
        request.onerror = function() { reject(request.error); };
      } else {
        // Delete by status - get all first, then delete matching
        idbGetAll(db, storeName).then(function(items) {
          var transaction = db.transaction([storeName], 'readwrite');
          var store = transaction.objectStore(storeName);
          var deleted = 0;

          items.forEach(function(item) {
            if (item.status === status) {
              store.delete(item.id);
              deleted++;
            }
          });

          transaction.oncomplete = function() { resolve(deleted); };
          transaction.onerror = function() { reject(transaction.error); };
        }).catch(reject);
      }
    });
  }

  // ============================================
  // LOCALSTORAGE FALLBACK
  // ============================================

  /**
   * Get all items from localStorage
   * @private
   * @param {string} key - Storage key
   * @returns {Array}
   */
  function lsGetAll(key) {
    try {
      var data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('[JobQueue] localStorage read error:', e);
      return [];
    }
  }

  /**
   * Save all items to localStorage
   * @private
   * @param {string} key - Storage key
   * @param {Array} items
   * @returns {boolean} Success
   */
  function lsSaveAll(key, items) {
    try {
      localStorage.setItem(key, JSON.stringify(items));
      return true;
    } catch (e) {
      console.error('[JobQueue] localStorage write error:', e);
      return false;
    }
  }

  // ============================================
  // CONSTRUCTOR
  // ============================================

  /**
   * Create a new JobQueue instance
   * @constructor
   * @param {Object} options - Configuration options
   * @param {string} options.name - Unique queue name (required, used for persistence key)
   * @param {Function} options.processor - Function to process jobs (required), receives (job), should return Promise
   * @param {number} [options.retryDelay=1000] - Base retry delay in ms
   * @param {number} [options.maxRetryDelay=30000] - Maximum retry delay in ms
   * @param {number} [options.backoffMultiplier=2] - Exponential backoff multiplier
   * @param {number} [options.maxAttempts=3] - Default max attempts per job
   * @param {boolean} [options.autoProcess=true] - Auto-process when jobs added
   * @param {number} [options.timeout=0] - Processor timeout in ms (0 = no timeout)
   * @param {number} [options.processInterval=5000] - Auto-process check interval in ms
   * @param {boolean} [options.persist=false] - Enable persistence to IndexedDB/localStorage
   * @param {string} [options.dbName] - IndexedDB database name (default: 'funky_jobqueue')
   * @param {string} [options.storeName] - IndexedDB store name (default: queue name)
   * @param {number} [options.dbVersion=1] - IndexedDB schema version
   */
  function JobQueue(options) {
    options = options || {};

    if (!options.name || typeof options.name !== 'string') {
      throw new Error('JobQueue: name must be a string');
    }
    if (!options.processor || typeof options.processor !== 'function') {
      throw new Error('JobQueue: processor function is required');
    }
    if (instances[options.name]) {
      throw new Error('JobQueue: queue "' + options.name + '" already exists');
    }

    this.name = options.name;
    this.processor = options.processor;

    // Configuration with defaults
    this.config = {
      retryDelay: options.retryDelay || 1000,
      maxRetryDelay: options.maxRetryDelay || 30000,
      backoffMultiplier: options.backoffMultiplier || 2,
      maxAttempts: options.maxAttempts || 3,
      autoProcess: options.autoProcess !== false,
      timeout: options.timeout || 0,
      processInterval: options.processInterval || 5000,
      // Storage config
      persist: options.persist === true,
      dbName: options.dbName || 'funky_jobqueue',
      storeName: options.storeName || this.name,
      dbVersion: options.dbVersion || 1,
      fallbackKey: 'funky_jobqueue_' + this.name
    };

    // Internal state
    this.state = {
      items: [],
      processing: false,
      paused: false,
      nextId: 1,
      currentJob: null,      // Currently processing job
      processTimer: null     // Auto-process interval timer
    };

    // Storage state (for persist: true)
    this._storage = {
      db: null,           // IndexedDB instance
      useIndexedDB: false,
      ready: false,
      initializing: false
    };

    // Event namespace for this queue instance (PubSub colon notation)
    this.eventPrefix = 'jobqueue:' + this.name + ':';

    // Register instance
    instances[options.name] = this;

    // Emit ready event (storage not ready yet if persist: true)
    this._emit('ready');
  }

  // ============================================
  // STORAGE API
  // ============================================

  /**
   * Initialize storage (call this if persist: true)
   * Loads persisted jobs and resumes processing
   * @returns {Promise} Resolves with loaded items array
   */
  JobQueue.prototype.init = function() {
    var self = this;

    // No-op if persistence disabled
    if (!this.config.persist) {
      return Promise.resolve([]);
    }

    // Prevent double init
    if (this._storage.ready || this._storage.initializing) {
      return Promise.resolve(this.state.items);
    }

    this._storage.initializing = true;

    return openDatabase(
      this.config.dbName,
      this.config.storeName,
      this.config.dbVersion
    ).then(function(db) {
      if (db) {
        self._storage.db = db;
        self._storage.useIndexedDB = true;
      } else {
        self._storage.useIndexedDB = false;
      }
      return self._loadFromStorage();
    }).then(function(items) {
      self._storage.ready = true;
      self._storage.initializing = false;

      self._emit('funky:job-queue:storage:ready', {
        count: items.length,
        type: self._storage.useIndexedDB ? 'indexeddb' : 'localstorage'
      });

      // If we have pending items and autoProcess is enabled, start processing
      if (self.config.autoProcess && !self.state.paused && self.count('pending') > 0) {
        self.process();
      }

      return items;
    }).catch(function(err) {
      console.error('[JobQueue] Storage init failed:', err);
      self._storage.ready = true; // Mark ready anyway (in-memory fallback)
      self._storage.initializing = false;
      self._emit('funky:job-queue:storage:error', { error: err });
      return [];
    });
  };

  /**
   * Load items from storage into state
   * @private
   * @returns {Promise<Array>}
   */
  JobQueue.prototype._loadFromStorage = function() {
    var self = this;

    if (this._storage.useIndexedDB) {
      return idbGetAll(this._storage.db, this.config.storeName).then(function(items) {
        self.state.items = items;
        self._updateNextId();
        return items;
      });
    } else {
      // localStorage fallback
      this.state.items = lsGetAll(this.config.fallbackKey);
      this._updateNextId();
      return Promise.resolve(this.state.items);
    }
  };

  /**
   * Update nextId based on existing items
   * @private
   */
  JobQueue.prototype._updateNextId = function() {
    if (this.state.items.length > 0) {
      var maxId = 0;
      for (var i = 0; i < this.state.items.length; i++) {
        if (this.state.items[i].id > maxId) {
          maxId = this.state.items[i].id;
        }
      }
      this.state.nextId = maxId + 1;
    }
  };

  /**
   * Save an item to storage
   * @private
   * @param {Object} item
   * @returns {Promise}
   */
  JobQueue.prototype._saveToStorage = function(item) {
    if (!this.config.persist || !this._storage.ready) {
      return Promise.resolve();
    }

    var self = this;

    if (this._storage.useIndexedDB) {
      return idbSave(this._storage.db, this.config.storeName, item).catch(function(err) {
        console.error('[JobQueue] Failed to save item:', err);
        self._emit('funky:job-queue:storage:error', { error: err, operation: 'save' });
      });
    } else {
      lsSaveAll(this.config.fallbackKey, this.state.items);
      return Promise.resolve();
    }
  };

  /**
   * Delete an item from storage
   * @private
   * @param {number} id
   * @returns {Promise}
   */
  JobQueue.prototype._deleteFromStorage = function(id) {
    if (!this.config.persist || !this._storage.ready) {
      return Promise.resolve();
    }

    var self = this;

    if (this._storage.useIndexedDB) {
      return idbDelete(this._storage.db, this.config.storeName, id).catch(function(err) {
        console.error('[JobQueue] Failed to delete item:', err);
        self._emit('funky:job-queue:storage:error', { error: err, operation: 'delete' });
      });
    } else {
      lsSaveAll(this.config.fallbackKey, this.state.items);
      return Promise.resolve();
    }
  };

  /**
   * Clear storage
   * @private
   * @param {string} [status] - Optional status filter
   * @returns {Promise}
   */
  JobQueue.prototype._clearStorage = function(status) {
    if (!this.config.persist || !this._storage.ready) {
      return Promise.resolve();
    }

    var self = this;

    if (this._storage.useIndexedDB) {
      return idbClear(this._storage.db, this.config.storeName, status).catch(function(err) {
        console.error('[JobQueue] Failed to clear storage:', err);
        self._emit('funky:job-queue:storage:error', { error: err, operation: 'clear' });
      });
    } else {
      lsSaveAll(this.config.fallbackKey, this.state.items);
      return Promise.resolve();
    }
  };

  /**
   * Check if using IndexedDB
   * @returns {boolean}
   */
  JobQueue.prototype.isIndexedDB = function() {
    return this._storage.useIndexedDB;
  };

  /**
   * Check if storage is ready
   * @returns {boolean}
   */
  JobQueue.prototype.isStorageReady = function() {
    return this._storage.ready || !this.config.persist;
  };

  // ============================================
  // JOB CREATION
  // ============================================

  /**
   * Create a job item from user data
   * @private
   * @param {Object} jobData - User-provided job data
   * @returns {Object} Complete job object
   */
  JobQueue.prototype._createJob = function(jobData) {
    jobData = jobData || {};

    return {
      id: this.state.nextId++,
      type: jobData.type || 'default',
      data: jobData.data || {},
      priority: jobData.priority || 'normal',  // 'high', 'normal', 'low'
      status: 'pending',   // 'pending', 'processing', 'failed', 'completed'
      attempts: 0,
      maxAttempts: jobData.maxAttempts || this.config.maxAttempts,
      createdAt: new Date().toISOString(),
      lastAttempt: null,
      error: null,
      result: null,
      meta: jobData.meta || {}  // User-defined metadata
    };
  };

  // ============================================
  // QUEUE OPERATIONS
  // ============================================

  /**
   * Add a job to the queue
   * @param {Object} jobData - Job configuration
   * @param {string} [jobData.type] - Job type identifier
   * @param {Object} [jobData.data] - Job payload data
   * @param {string} [jobData.priority='normal'] - Priority: 'high', 'normal', 'low'
   * @param {number} [jobData.maxAttempts] - Override default max attempts
   * @param {Object} [jobData.meta] - Custom metadata
   * @returns {Object} The created job
   */
  JobQueue.prototype.add = function(jobData) {
    var job = this._createJob(jobData);
    this.state.items.push(job);

    // Persist to storage
    this._saveToStorage(job);

    this._emit('added', { job: this._copyJob(job) });
    this._emit('changed', { count: this.state.items.length });

    // Auto-process if enabled and not paused/processing
    if (this.config.autoProcess && !this.state.paused && !this.state.processing) {
      this.process();
    }

    return this._copyJob(job);
  };

  /**
   * Remove a job from the queue by ID
   * @param {number} id - Job ID
   * @returns {boolean} True if job was removed
   */
  JobQueue.prototype.remove = function(id) {
    var index = this._findIndex(id);
    if (index === -1) return false;

    var job = this.state.items.splice(index, 1)[0];

    // Remove from storage
    this._deleteFromStorage(id);

    this._emit('removed', { job: this._copyJob(job) });
    this._emit('changed', { count: this.state.items.length });

    return true;
  };

  /**
   * Get a job by ID
   * @param {number} id - Job ID
   * @returns {Object|null} Job copy or null if not found
   */
  JobQueue.prototype.get = function(id) {
    var index = this._findIndex(id);
    return index !== -1 ? this._copyJob(this.state.items[index]) : null;
  };

  /**
   * Get all jobs, optionally filtered
   * @param {Object} [filter] - Filter options
   * @param {string} [filter.status] - Filter by status
   * @param {string} [filter.type] - Filter by type
   * @param {string} [filter.priority] - Filter by priority
   * @returns {Array} Array of job copies
   */
  JobQueue.prototype.getAll = function(filter) {
    var self = this;
    filter = filter || {};
    var items = this.state.items;

    if (filter.status) {
      items = items.filter(function(job) {
        return job.status === filter.status;
      });
    }

    if (filter.type) {
      items = items.filter(function(job) {
        return job.type === filter.type;
      });
    }

    if (filter.priority) {
      items = items.filter(function(job) {
        return job.priority === filter.priority;
      });
    }

    return items.map(function(job) {
      return self._copyJob(job);
    });
  };

  /**
   * Get count of jobs in queue
   * @param {string} [status] - Filter by status
   * @returns {number} Job count
   */
  JobQueue.prototype.count = function(status) {
    if (!status) return this.state.items.length;

    var count = 0;
    for (var i = 0; i < this.state.items.length; i++) {
      if (this.state.items[i].status === status) count++;
    }
    return count;
  };

  /**
   * Clear jobs from queue
   * @param {string} [status] - Only clear jobs with this status (clears all if omitted)
   */
  JobQueue.prototype.clear = function(status) {
    if (status) {
      this.state.items = this.state.items.filter(function(job) {
        return job.status !== status;
      });
    } else {
      this.state.items = [];
    }

    // Clear from storage
    this._clearStorage(status);

    this._emit('cleared', { status: status || null });
    this._emit('changed', { count: this.state.items.length });
  };

  /**
   * Retry a failed job
   * @param {number} id - Job ID
   * @returns {boolean} True if job was found and reset for retry
   */
  JobQueue.prototype.retry = function(id) {
    var job = this._getJobRef(id);
    if (!job || job.status !== 'failed') return false;

    job.status = 'pending';
    job.attempts = 0;
    job.error = null;

    // Persist update
    this._saveToStorage(job);

    this._emit('retried', { job: this._copyJob(job) });

    if (this.config.autoProcess && !this.state.paused && !this.state.processing) {
      this.process();
    }

    return true;
  };

  /**
   * Retry all failed jobs
   * @returns {number} Number of jobs reset for retry
   */
  JobQueue.prototype.retryAll = function() {
    var self = this;
    var count = 0;

    for (var i = 0; i < this.state.items.length; i++) {
      var job = this.state.items[i];
      if (job.status === 'failed') {
        job.status = 'pending';
        job.attempts = 0;
        job.error = null;
        // Persist each updated job
        this._saveToStorage(job);
        count++;
      }
    }

    if (count > 0) {
      this._emit('changed', { count: this.state.items.length });

      if (this.config.autoProcess && !this.state.paused && !this.state.processing) {
        this.process();
      }
    }

    return count;
  };

  // ============================================
  // PROCESSING CONTROL
  // ============================================

  /**
   * Pause processing (jobs still queue, just don't process)
   */
  JobQueue.prototype.pause = function() {
    if (!this.state.paused) {
      this.state.paused = true;
      this._emit('paused');
    }
  };

  /**
   * Resume processing
   */
  JobQueue.prototype.resume = function() {
    if (this.state.paused) {
      this.state.paused = false;
      this._emit('resumed');

      if (this.config.autoProcess && this.count('pending') > 0 && !this.state.processing) {
        this.process();
      }
    }
  };

  /**
   * Check if queue is paused
   * @returns {boolean}
   */
  JobQueue.prototype.isPaused = function() {
    return this.state.paused;
  };

  /**
   * Check if queue is currently processing a job
   * @returns {boolean}
   */
  JobQueue.prototype.isProcessing = function() {
    return this.state.processing;
  };

  /**
   * Get the currently processing job (if any)
   * @returns {Object|null} Copy of current job or null
   */
  JobQueue.prototype.getCurrentJob = function() {
    return this.state.currentJob ? this._copyJob(this.state.currentJob) : null;
  };

  /**
   * Start automatic processing at configured interval
   * Useful for periodically checking and processing pending jobs
   */
  JobQueue.prototype.startAutoProcess = function() {
    var self = this;

    // Already running
    if (this.state.processTimer) return;

    this.state.processTimer = setInterval(function() {
      if (!self.state.paused && self.count('pending') > 0 && !self.state.processing) {
        self.process();
      }
    }, this.config.processInterval);

    this._emit('funky:job-queue:autoprocess:started', { interval: this.config.processInterval });
  };

  /**
   * Stop automatic processing
   */
  JobQueue.prototype.stopAutoProcess = function() {
    if (this.state.processTimer) {
      clearInterval(this.state.processTimer);
      this.state.processTimer = null;
      this._emit('funky:job-queue:autoprocess:stopped');
    }
  };

  /**
   * Check if auto-processing is running
   * @returns {boolean}
   */
  JobQueue.prototype.isAutoProcessing = function() {
    return this.state.processTimer !== null;
  };

  /**
   * Sync all pending jobs - process until queue is empty
   * Returns a promise that resolves with results summary
   * @returns {Promise<Object>} Results: { success, failed, pending }
   */
  JobQueue.prototype.sync = function() {
    var self = this;

    return new Promise(function(resolve) {
      var results = { success: 0, failed: 0, pending: 0 };

      // If nothing to process, resolve immediately
      if (self.count('pending') === 0 && !self.state.processing) {
        results.pending = 0;
        self._emit('synced', results);
        resolve(results);
        return;
      }

      // Track results via events
      var onSuccess = function() { results.success++; };
      var onFailed = function() { results.failed++; };

      self.on('success', onSuccess);
      self.on('failed', onFailed);

      // Check if sync is complete
      var checkComplete = function() {
        if (self.count('pending') === 0 && !self.state.processing) {
          // Clean up listeners
          self.off('success', onSuccess);
          self.off('failed', onFailed);

          results.pending = self.count('failed');
          self._emit('synced', results);
          resolve(results);
        } else {
          setTimeout(checkComplete, 100);
        }
      };

      // Resume if paused (sync is explicit user action)
      if (self.state.paused) {
        self.resume();
      }

      // Start processing if not already
      if (!self.state.processing) {
        self.process();
      }

      checkComplete();
    });
  };

  /**
   * Process next pending job
   * Includes timeout handling if configured
   * Uses mutex guard to prevent race conditions from concurrent calls
   */
  JobQueue.prototype.process = function() {
    var self = this;

    // Don't process if paused or already processing
    if (this.state.paused || this.state.processing) {
      return;
    }

    // Mutex guard: prevent race condition from concurrent process() calls
    // Set processing flag immediately before any async operations
    this.state.processing = true;

    // Get next pending job (sorted by priority)
    var job = this._getNextJob();
    if (!job) {
      // Release mutex if no job to process
      this.state.processing = false;
      this._emit('empty');
      return;
    }

    // Mark job as processing
    this.state.currentJob = job;
    job.status = 'processing';
    job.lastAttempt = new Date().toISOString();
    job.attempts++;

    // Persist processing state
    this._saveToStorage(job);

    this._emit('processing', { job: this._copyJob(job) });

    // Call user's processor with optional timeout
    this._executeWithTimeout(job).then(function(res) {
      self._handleJobSuccess(job, res);
    }).catch(function(err) {
      self._handleJobError(job, err);
    });
  };

  /**
   * Execute processor with optional timeout
   * @private
   * @param {Object} job - Job to process
   * @returns {Promise}
   */
  JobQueue.prototype._executeWithTimeout = function(job) {
    var self = this;
    var timeout = this.config.timeout;

    return new Promise(function(resolve, reject) {
      var timeoutId = null;
      var completed = false;

      // Set up timeout if configured
      if (timeout > 0) {
        timeoutId = setTimeout(function() {
          if (!completed) {
            completed = true;
            var err = new Error('Job timeout after ' + timeout + 'ms');
            err.code = 'TIMEOUT';
            reject(err);
          }
        }, timeout);
      }

      // Call the processor
      var result;
      try {
        result = self.processor(self._copyJob(job));
      } catch (err) {
        if (!completed) {
          completed = true;
          if (timeoutId) clearTimeout(timeoutId);
          reject(err);
        }
        return;
      }

      // Handle promise or sync result
      if (result && typeof result.then === 'function') {
        result.then(function(res) {
          if (!completed) {
            completed = true;
            if (timeoutId) clearTimeout(timeoutId);
            resolve(res);
          }
        }).catch(function(err) {
          if (!completed) {
            completed = true;
            if (timeoutId) clearTimeout(timeoutId);
            reject(err);
          }
        });
      } else {
        // Sync success
        if (!completed) {
          completed = true;
          if (timeoutId) clearTimeout(timeoutId);
          resolve(result);
        }
      }
    });
  };

  /**
   * Get next job to process (priority sorted)
   * @private
   * @returns {Object|null} Job reference or null
   */
  JobQueue.prototype._getNextJob = function() {
    var priorityOrder = { high: 0, normal: 1, low: 2 };
    var pending = [];

    for (var i = 0; i < this.state.items.length; i++) {
      if (this.state.items[i].status === 'pending') {
        pending.push(this.state.items[i]);
      }
    }

    if (pending.length === 0) return null;

    // Sort by priority, then by creation time
    pending.sort(function(a, b) {
      var priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    return pending[0];
  };

  /**
   * Handle successful job completion
   * @private
   */
  JobQueue.prototype._handleJobSuccess = function(job, result) {
    // Remove from queue
    var index = this._findIndex(job.id);
    if (index !== -1) {
      this.state.items.splice(index, 1);
    }

    job.status = 'completed';
    job.result = result;

    // Remove from storage (completed jobs don't persist)
    this._deleteFromStorage(job.id);

    this.state.processing = false;
    this.state.currentJob = null;

    this._emit('success', { job: this._copyJob(job), result: result });
    this._emit('changed', { count: this.state.items.length });

    // Process next if available
    if (this.config.autoProcess && !this.state.paused && this.count('pending') > 0) {
      var self = this;
      setTimeout(function() {
        self.process();
      }, 0);
    }
  };

  /**
   * Handle job error
   * @private
   */
  JobQueue.prototype._handleJobError = function(job, error) {
    var errorObj = {
      message: error.message || String(error),
      code: error.code || null,
      timestamp: new Date().toISOString()
    };

    job.error = errorObj;

    // Check if should retry
    if (job.attempts < job.maxAttempts) {
      job.status = 'pending';
      var delay = this._calculateRetryDelay(job.attempts);

      // Persist updated job state
      this._saveToStorage(job);

      this.state.currentJob = null;

      this._emit('retry', {
        job: this._copyJob(job),
        attempt: job.attempts,
        nextRetry: delay
      });

      // Schedule retry
      var self = this;
      this.state.processing = false;

      setTimeout(function() {
        if (!self.state.paused && self.config.autoProcess) {
          self.process();
        }
      }, delay);
    } else {
      // Max attempts reached
      job.status = 'failed';

      // Persist failed status
      this._saveToStorage(job);

      this.state.processing = false;
      this.state.currentJob = null;

      this._emit('failed', { job: this._copyJob(job), error: errorObj });
      this._emit('changed', { count: this.state.items.length });

      // Continue to next job
      if (this.config.autoProcess && !this.state.paused && this.count('pending') > 0) {
        var self2 = this;
        setTimeout(function() {
          self2.process();
        }, 0);
      }
    }
  };

  /**
   * Calculate retry delay with exponential backoff and jitter
   * @private
   * @param {number} attempts - Number of previous attempts
   * @returns {number} Delay in ms
   */
  JobQueue.prototype._calculateRetryDelay = function(attempts) {
    var delay = this.config.retryDelay * Math.pow(this.config.backoffMultiplier, attempts - 1);
    // Add jitter (±20%)
    var jitter = delay * 0.2 * (Math.random() * 2 - 1);
    delay = Math.min(delay + jitter, this.config.maxRetryDelay);
    return Math.round(delay);
  };

  // ============================================
  // EVENTS
  // ============================================

  /**
   * Subscribe to queue events
   * @param {string} event - Event name (without prefix)
   * @param {Function} handler - Event handler
   * @returns {JobQueue} this (for chaining)
   */
  JobQueue.prototype.on = function(event, handler) {
    var PubSub = Funky.PubSub;
    if (PubSub && PubSub.on) {
      PubSub.on(this.eventPrefix + event, handler);
    }
    return this;
  };

  /**
   * Unsubscribe from queue events
   * @param {string} event - Event name (without prefix)
   * @param {Function} handler - Event handler to remove
   * @returns {JobQueue} this (for chaining)
   */
  JobQueue.prototype.off = function(event, handler) {
    var PubSub = Funky.PubSub;
    if (PubSub && PubSub.off) {
      PubSub.off(this.eventPrefix + event, handler);
    }
    return this;
  };

  /**
   * Emit event with data
   * @private
   * @param {string} event - Event name (without prefix)
   * @param {*} [data] - Event data
   */
  JobQueue.prototype._emit = function(event, data) {
    var PubSub = Funky.PubSub;
    if (PubSub && PubSub.emit) {
      PubSub.emit(this.eventPrefix + event, data);
    }
  };

  // ============================================
  // INTERNAL HELPERS
  // ============================================

  /**
   * Find job index by ID
   * @private
   */
  JobQueue.prototype._findIndex = function(id) {
    for (var i = 0; i < this.state.items.length; i++) {
      if (this.state.items[i].id === id) return i;
    }
    return -1;
  };

  /**
   * Get direct reference to job (for internal mutation)
   * @private
   */
  JobQueue.prototype._getJobRef = function(id) {
    var index = this._findIndex(id);
    return index !== -1 ? this.state.items[index] : null;
  };

  /**
   * Create a deep copy of a job (to prevent external mutation)
   * @private
   */
  JobQueue.prototype._copyJob = function(job) {
    return JSON.parse(JSON.stringify(job));
  };

  // ============================================
  // STATIC METHODS
  // ============================================

  /**
   * Get a queue instance by name
   * @static
   * @param {string} name - Queue name
   * @returns {JobQueue|null}
   */
  JobQueue.get = function(name) {
    return instances[name] || null;
  };

  /**
   * Get all registered queue names
   * @static
   * @returns {Array<string>}
   */
  JobQueue.list = function() {
    return Object.keys(instances);
  };

  /**
   * Destroy a queue instance
   * @static
   * @param {string} name - Queue name
   * @returns {boolean} True if queue existed and was destroyed
   */
  JobQueue.destroy = function(name) {
    if (instances[name]) {
      instances[name].stopAutoProcess();
      instances[name].clear();
      instances[name]._emit('destroyed');
      delete instances[name];
      return true;
    }
    return false;
  };

  // ============================================
  // DEBUG
  // ============================================

  /**
   * Get debug information about the queue
   * @returns {Object} Debug state
   */
  JobQueue.prototype.debug = function() {
    return {
      name: this.name,
      config: this.config,
      state: {
        itemCount: this.state.items.length,
        processing: this.state.processing,
        paused: this.state.paused,
        nextId: this.state.nextId,
        currentJob: this.state.currentJob ? this._copyJob(this.state.currentJob) : null,
        autoProcessing: this.state.processTimer !== null
      },
      storage: {
        enabled: this.config.persist,
        ready: this._storage.ready,
        type: this._storage.useIndexedDB ? 'indexeddb' : 'localstorage'
      },
      counts: {
        pending: this.count('pending'),
        processing: this.count('processing'),
        failed: this.count('failed'),
        total: this.state.items.length
      },
      items: this.getAll()
    };
  };

  // ============================================
  // EXPORT
  // ============================================

  Funky.register('JobQueue', JobQueue);

})(window);

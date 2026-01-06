/**
 * Mock API - Fetch interceptor for serverless playground
 * Only intercepts JSON API endpoints (/api/*).
 * HTML pages are real files loaded via standard fetch.
 */
(function(global) {
  'use strict';

  // Mock CSRF token FIRST - prevents "CSRF token not found" errors
  // Must happen before any other code that might check for CSRF token
  // Set CSRF cookie (Funky.CSRF reads from cookie, not meta tag)
  if (document.cookie.indexOf('csrf_token=') === -1) {
    document.cookie = 'csrf_token=mock-csrf-token-for-playground; path=/';
  }
  // Also add meta tag for backwards compatibility
  if (!document.querySelector('meta[name="csrf-token"]')) {
    var csrfMeta = document.createElement('meta');
    csrfMeta.name = 'csrf-token';
    csrfMeta.content = 'mock-csrf-token-for-playground';
    document.head.appendChild(csrfMeta);
  }

  var MockAPI = {
    // Products endpoint with pagination
    '/api/playground/products': function(params) {
      var page = (params && params.page) || 1;
      var limit = (params && params.limit) || 10;
      var products = [];
      var categories = ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books'];

      for (var i = 0; i < limit; i++) {
        var id = (page - 1) * limit + i + 1;
        products.push({
          id: id,
          name: 'Product ' + id,
          price: parseFloat((Math.random() * 500 + 10).toFixed(2)),
          category: categories[id % categories.length],
          stock: Math.floor(Math.random() * 200),
          status: Math.random() > 0.2 ? 'In Stock' : 'Low Stock'
        });
      }

      return {
        data: products,
        total: 500,
        page: page,
        pages: Math.ceil(500 / limit)
      };
    },

    // Categories
    '/api/playground/categories': [
      { id: 1, name: 'Electronics', count: 142 },
      { id: 2, name: 'Clothing', count: 89 },
      { id: 3, name: 'Home & Garden', count: 67 },
      { id: 4, name: 'Sports', count: 45 },
      { id: 5, name: 'Books', count: 234 }
    ],

    // Users
    '/api/playground/users': [
      { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin', status: 'online' },
      { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'Editor', status: 'away' },
      { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', role: 'Viewer', status: 'offline' },
      { id: 4, name: 'Diana Ross', email: 'diana@example.com', role: 'Editor', status: 'online' },
      { id: 5, name: 'Eve Wilson', email: 'eve@example.com', role: 'Viewer', status: 'online' }
    ],

    // User preferences
    '/api/users/preferences': {
      theme: 'light',
      sidebarCollapsed: false,
      modalSlidePosition: 'right',
      notifications: true,
      language: 'en'
    },

    // Events for timeline/calendar
    '/api/playground/events': [
      { id: 1, title: 'Team Meeting', date: '2024-01-15', time: '10:00', type: 'meeting' },
      { id: 2, title: 'Project Deadline', date: '2024-01-20', time: '17:00', type: 'deadline' },
      { id: 3, title: 'Product Launch', date: '2024-01-25', time: '09:00', type: 'event' },
      { id: 4, title: 'Code Review', date: '2024-01-18', time: '14:00', type: 'meeting' },
      { id: 5, title: 'Sprint Planning', date: '2024-01-22', time: '11:00', type: 'meeting' }
    ],

    // Tasks for kanban
    '/api/playground/tasks': [
      { id: 1, title: 'Design homepage', column: 'todo', priority: 'high', assignee: 'Alice' },
      { id: 2, title: 'Write documentation', column: 'todo', priority: 'medium', assignee: 'Bob' },
      { id: 3, title: 'Build API endpoints', column: 'in-progress', priority: 'high', assignee: 'Charlie' },
      { id: 4, title: 'Setup CI/CD', column: 'in-progress', priority: 'low', assignee: 'Diana' },
      { id: 5, title: 'Deploy to staging', column: 'done', priority: 'medium', assignee: 'Eve' }
    ],

    // Search endpoint
    '/api/playground/search': function(params) {
      var query = (params && params.q) || '';
      var results = [];

      if (query.length >= 2) {
        var items = ['Dashboard', 'Settings', 'Users', 'Products', 'Orders', 'Reports', 'Analytics', 'Help'];
        items.forEach(function(item, index) {
          if (item.toLowerCase().indexOf(query.toLowerCase()) !== -1) {
            results.push({ id: index + 1, title: item, type: 'page' });
          }
        });
      }

      return { results: results, query: query };
    },

    // Combobox options
    '/api/playground/options': function(params) {
      var search = (params && params.search) || '';
      var options = [
        { value: 'us', label: 'United States' },
        { value: 'uk', label: 'United Kingdom' },
        { value: 'ca', label: 'Canada' },
        { value: 'au', label: 'Australia' },
        { value: 'de', label: 'Germany' },
        { value: 'fr', label: 'France' },
        { value: 'jp', label: 'Japan' },
        { value: 'cn', label: 'China' },
        { value: 'in', label: 'India' },
        { value: 'br', label: 'Brazil' }
      ];

      if (search) {
        options = options.filter(function(opt) {
          return opt.label.toLowerCase().indexOf(search.toLowerCase()) !== -1;
        });
      }

      return { options: options };
    },

    // Advanced Filter - filter field options
    '/api/playground/filter_options': function(params) {
      return {
        multi_select_fields: [
          {
            name: 'status',
            label: 'Status',
            options: [
              { value: 'active', label: 'Active', count: 145 },
              { value: 'pending', label: 'Pending', count: 32 },
              { value: 'inactive', label: 'Inactive', count: 18 },
              { value: 'archived', label: 'Archived', count: 5 }
            ]
          },
          {
            name: 'category',
            label: 'Category',
            options: [
              { value: 'sales', label: 'Sales', count: 89 },
              { value: 'marketing', label: 'Marketing', count: 45 },
              { value: 'support', label: 'Support', count: 67 },
              { value: 'engineering', label: 'Engineering', count: 34 }
            ]
          },
          {
            name: 'priority',
            label: 'Priority',
            options: [
              { value: 'low', label: 'Low', count: 78 },
              { value: 'medium', label: 'Medium', count: 112 },
              { value: 'high', label: 'High', count: 45 },
              { value: 'critical', label: 'Critical', count: 12 }
            ]
          },
          {
            name: 'assignee',
            label: 'Assignee',
            options: [
              { value: 'alice', label: 'Alice Johnson', count: 56 },
              { value: 'bob', label: 'Bob Smith', count: 43 },
              { value: 'charlie', label: 'Charlie Brown', count: 38 },
              { value: 'diana', label: 'Diana Ross', count: 29 }
            ]
          }
        ],
        range_fields: [
          {
            name: 'amount',
            label: 'Amount',
            min: 0,
            max: 100000
          },
          {
            name: 'quantity',
            label: 'Quantity',
            min: 0,
            max: 1000
          }
        ],
        date_fields: [
          {
            name: 'created_at',
            label: 'Created Date'
          },
          {
            name: 'updated_at',
            label: 'Updated Date'
          }
        ]
      };
    },

    // Advanced Filter - saved filters CRUD
    '/api/playground/saved_filters': function(params, method) {
      // In-memory storage for demo (resets on reload)
      if (!global._mockSavedFilters) {
        global._mockSavedFilters = [
          { id: 1, name: 'Active Users', description: 'All active users', params: { status: 'active' }, filters: { status: 'active' }, filter_hash: 'mock-hash-1', url_shortcut_id: 'abc123', is_default: false, created_at: '2024-01-10' },
          { id: 2, name: 'High Priority', description: 'Critical and high priority items', params: { priority: 'high' }, filters: { priority: 'high' }, filter_hash: 'mock-hash-2', url_shortcut_id: 'def456', is_default: true, created_at: '2024-01-12' },
          { id: 3, name: 'Sales Team', description: 'Sales category items', params: { category: 'sales' }, filters: { category: 'sales' }, filter_hash: 'mock-hash-3', url_shortcut_id: 'ghi789', is_default: false, created_at: '2024-01-15' }
        ];
        global._mockFilterNextId = 4;
      }

      // Handle GET with ID - return single filter with all fields
      if (method === 'GET' && params.id) {
        var filter = global._mockSavedFilters.find(function(f) { return f.id === parseInt(params.id); });
        if (filter) {
          return filter;
        }
        return { success: false, message: 'Filter not found' };
      }

      // Handle POST - create new filter
      if (method === 'POST' && params.name) {
        var newFilterHash = 'mock-hash-' + global._mockFilterNextId;
        var newFilter = {
          id: global._mockFilterNextId++,
          name: params.name,
          description: params.description || '',
          params: params.filters || {},
          filters: params.filters || {},
          filter_hash: newFilterHash,
          url_shortcut_id: 'mock-' + Date.now(),
          is_default: params.is_default || false,
          created_at: new Date().toISOString().split('T')[0]
        };
        global._mockSavedFilters.push(newFilter);
        return { success: true, filter: newFilter, message: 'Filter saved successfully' };
      }

      // Handle DELETE
      if (method === 'DELETE' && params.id) {
        var index = global._mockSavedFilters.findIndex(function(f) { return f.id === parseInt(params.id); });
        if (index > -1) {
          global._mockSavedFilters.splice(index, 1);
          return { success: true, message: 'Filter deleted' };
        }
        return { success: false, message: 'Filter not found' };
      }

      // GET - return all filters
      return {
        filters: global._mockSavedFilters,
        total: global._mockSavedFilters.length
      };
    },

    // Handle save filter shortcut (used by AdvancedFilter component)
    '/api/saved_filters': function(params, method) {
      // Redirect to playground endpoint
      return MockAPI['/api/playground/saved_filters'](params, method);
    },

    // Timezone - session timezone get/set
    '/api/session/timezone': function(params, method) {
      // In-memory storage for demo
      if (!global._mockSessionTimezone) {
        // Detect browser timezone on first access
        try {
          global._mockSessionTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        } catch (e) {
          global._mockSessionTimezone = 'UTC';
        }
      }

      if (method === 'POST' && params.timezone) {
        global._mockSessionTimezone = params.timezone;
        return { timezone: global._mockSessionTimezone, success: true };
      }

      return { timezone: global._mockSessionTimezone };
    },

    // Timezone - available timezones list
    '/api/session/timezones': function() {
      return {
        timezones: {
          'UTC': [
            { value: 'UTC', label: 'UTC (Coordinated Universal Time)' }
          ],
          'Americas': [
            { value: 'America/New_York', label: 'Eastern Time (ET)' },
            { value: 'America/Chicago', label: 'Central Time (CT)' },
            { value: 'America/Denver', label: 'Mountain Time (MT)' },
            { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
            { value: 'America/Anchorage', label: 'Alaska Time' },
            { value: 'America/Toronto', label: 'Toronto (ET)' },
            { value: 'America/Vancouver', label: 'Vancouver (PT)' },
            { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)' },
            { value: 'America/Mexico_City', label: 'Mexico City (CST)' }
          ],
          'Europe': [
            { value: 'Europe/London', label: 'London (GMT/BST)' },
            { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
            { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
            { value: 'Europe/Amsterdam', label: 'Amsterdam (CET/CEST)' },
            { value: 'Europe/Madrid', label: 'Madrid (CET/CEST)' },
            { value: 'Europe/Rome', label: 'Rome (CET/CEST)' },
            { value: 'Europe/Zurich', label: 'Zurich (CET/CEST)' },
            { value: 'Europe/Moscow', label: 'Moscow (MSK)' }
          ],
          'Asia': [
            { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
            { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
            { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)' },
            { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
            { value: 'Asia/Seoul', label: 'Seoul (KST)' },
            { value: 'Asia/Dubai', label: 'Dubai (GST)' },
            { value: 'Asia/Kolkata', label: 'India (IST)' },
            { value: 'Asia/Bangkok', label: 'Bangkok (ICT)' }
          ],
          'Australia & Pacific': [
            { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
            { value: 'Australia/Melbourne', label: 'Melbourne (AEST/AEDT)' },
            { value: 'Australia/Brisbane', label: 'Brisbane (AEST)' },
            { value: 'Australia/Perth', label: 'Perth (AWST)' },
            { value: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)' },
            { value: 'Pacific/Honolulu', label: 'Honolulu (HST)' }
          ],
          'Africa': [
            { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST)' },
            { value: 'Africa/Cairo', label: 'Cairo (EET)' },
            { value: 'Africa/Lagos', label: 'Lagos (WAT)' }
          ]
        }
      };
    },

    // URL shortcuts - creates hash for filter parameters
    '/api/url_shortcuts': function(params, method) {
      if (method === 'POST') {
        // Generate a mock hash based on params
        var hash = 'mock-' + Date.now().toString(36);
        if (!global._mockUrlShortcuts) {
          global._mockUrlShortcuts = {};
          global._mockUrlShortcutNextId = 1;
        }
        var id = global._mockUrlShortcutNextId++;
        global._mockUrlShortcuts[hash] = {
          id: id,
          hash: hash,
          context: params.context,
          params: params.params
        };
        return { id: id, hash: hash, success: true };
      }
      // GET with hash - return the shortcut data
      if (params.hash && global._mockUrlShortcuts && global._mockUrlShortcuts[params.hash]) {
        return global._mockUrlShortcuts[params.hash];
      }
      return { success: false, message: 'Shortcut not found' };
    },

    // File upload mock endpoint
    '/api/upload': function(params, method) {
      if (method === 'POST') {
        // Simulate successful file upload
        var fileId = 'file-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        return {
          success: true,
          id: fileId,
          url: '/uploads/' + fileId,
          message: 'File uploaded successfully'
        };
      }
      return { success: false, message: 'Method not allowed' };
    }
  };

  // Store original fetch
  var originalFetch = global.fetch;

  // Helper to find matching mock endpoint (handles paths with IDs)
  function findMockEndpoint(pathname) {
    // Direct match first
    if (MockAPI.hasOwnProperty(pathname)) {
      return { mock: MockAPI[pathname], id: null };
    }

    // Check for paths with IDs (e.g., /api/saved_filters/123)
    var parts = pathname.split('/');
    var lastPart = parts[parts.length - 1];

    // If last part looks like an ID (number), try matching without it
    if (/^\d+$/.test(lastPart)) {
      var basePath = parts.slice(0, -1).join('/');
      if (MockAPI.hasOwnProperty(basePath)) {
        return { mock: MockAPI[basePath], id: lastPart };
      }
    }

    return null;
  }

  // Override fetch
  global.fetch = function(url, options) {
    var pathname;
    try {
      pathname = new URL(url, location.origin).pathname;
    } catch (e) {
      pathname = url;
    }

    // Get HTTP method
    var method = (options && options.method) ? options.method.toUpperCase() : 'GET';

    // Only intercept /api/* endpoints
    if (pathname.indexOf('/api/') === 0) {
      var match = findMockEndpoint(pathname);

      if (match) {
        var mock = match.mock;
        var body = null;

        // Parse request body if present
        if (options && options.body) {
          try {
            body = JSON.parse(options.body);
          } catch (e) {
            body = {};
          }
        }

        // Parse query string params
        var params = body || {};
        try {
          var urlObj = new URL(url, location.origin);
          urlObj.searchParams.forEach(function(value, key) {
            params[key] = value;
          });
        } catch (e) {}

        // Add ID to params if extracted from path
        if (match.id) {
          params.id = match.id;
        }

        // Get response - pass method to handler
        var response = typeof mock === 'function' ? mock(params, method) : mock;

        // Simulate network delay
        return new Promise(function(resolve) {
          setTimeout(function() {
            resolve({
              ok: true,
              status: 200,
              headers: new Headers({ 'Content-Type': 'application/json' }),
              json: function() { return Promise.resolve(response); },
              text: function() { return Promise.resolve(JSON.stringify(response)); }
            });
          }, 50 + Math.random() * 100); // 50-150ms delay
        });
      }
    }

    // Pass through to original fetch for non-API requests
    return originalFetch.apply(global, arguments);
  };

  // =========================================================================
  // XHR Interceptor for file uploads (with progress simulation)
  // =========================================================================
  
  var OriginalXHR = global.XMLHttpRequest;
  
  function MockXHR() {
    var realXHR = new OriginalXHR();
    var self = this;
    
    // Properties
    this.readyState = 0;
    this.status = 0;
    this.statusText = '';
    this.responseText = '';
    this.response = '';
    this.responseType = '';
    this.timeout = 0;
    this.withCredentials = false;
    
    // Event handlers
    this.onreadystatechange = null;
    this.onload = null;
    this.onerror = null;
    this.onprogress = null;
    this.ontimeout = null;
    this.onabort = null;
    
    // Upload object with progress events
    this.upload = {
      onprogress: null,
      onload: null,
      onerror: null,
      onabort: null,
      addEventListener: function(type, handler) {
        this['on' + type] = handler;
      },
      removeEventListener: function(type, handler) {
        if (this['on' + type] === handler) {
          this['on' + type] = null;
        }
      }
    };
    
    // Event listener storage
    this._listeners = {};
    
    // Store request info
    this._method = '';
    this._url = '';
    this._headers = {};
    this._isMocked = false;
    this._realXHR = realXHR;
  }
  
  MockXHR.prototype.addEventListener = function(type, handler) {
    if (!this._listeners[type]) {
      this._listeners[type] = [];
    }
    this._listeners[type].push(handler);
  };
  
  MockXHR.prototype.removeEventListener = function(type, handler) {
    if (this._listeners[type]) {
      this._listeners[type] = this._listeners[type].filter(function(h) {
        return h !== handler;
      });
    }
  };
  
  MockXHR.prototype._dispatch = function(type, event) {
    var handler = this['on' + type];
    if (handler) handler.call(this, event);
    
    var listeners = this._listeners[type] || [];
    for (var i = 0; i < listeners.length; i++) {
      listeners[i].call(this, event);
    }
  };
  
  MockXHR.prototype.open = function(method, url, async, user, password) {
    this._method = method;
    this._url = url;
    
    // Check if this is a mockable endpoint
    var pathname;
    try {
      pathname = new URL(url, location.origin).pathname;
    } catch (e) {
      pathname = url;
    }
    
    this._isMocked = pathname.indexOf('/api/') === 0 && MockAPI.hasOwnProperty(pathname);
    
    if (!this._isMocked) {
      // Use real XHR
      this._realXHR.open(method, url, async !== false, user, password);
    }
    
    this.readyState = 1;
  };
  
  MockXHR.prototype.setRequestHeader = function(name, value) {
    this._headers[name] = value;
    if (!this._isMocked) {
      this._realXHR.setRequestHeader(name, value);
    }
  };
  
  MockXHR.prototype.send = function(data) {
    var self = this;
    
    if (!this._isMocked) {
      // Proxy to real XHR
      var realXHR = this._realXHR;
      
      // Copy upload handlers
      if (this.upload.onprogress) {
        realXHR.upload.onprogress = this.upload.onprogress;
      }
      
      realXHR.onreadystatechange = function() {
        self.readyState = realXHR.readyState;
        self.status = realXHR.status;
        self.statusText = realXHR.statusText;
        self.responseText = realXHR.responseText;
        self.response = realXHR.response;
        self._dispatch('readystatechange', {});
      };
      
      realXHR.onload = function(e) { self._dispatch('load', e); };
      realXHR.onerror = function(e) { self._dispatch('error', e); };
      realXHR.send(data);
      return;
    }
    
    // Mock the upload with progress simulation
    var pathname;
    try {
      pathname = new URL(this._url, location.origin).pathname;
    } catch (e) {
      pathname = this._url;
    }
    
    var mock = MockAPI[pathname];
    
    // Simulate file size for progress (use actual FormData size if available)
    var totalSize = 1024 * 1024; // Default 1MB
    if (data instanceof FormData) {
      // Try to get actual file size
      var entries = data.entries ? data.entries() : [];
      var entry = entries.next ? entries.next() : null;
      if (entry && entry.value && entry.value[1] && entry.value[1].size) {
        totalSize = entry.value[1].size;
      }
    }
    
    // Simulate upload progress
    var loaded = 0;
    var chunkSize = Math.ceil(totalSize / 10); // 10 progress updates
    var progressInterval = setInterval(function() {
      loaded += chunkSize;
      if (loaded > totalSize) loaded = totalSize;
      
      var progressEvent = {
        lengthComputable: true,
        loaded: loaded,
        total: totalSize
      };
      
      // Fire upload progress
      if (self.upload.onprogress) {
        self.upload.onprogress(progressEvent);
      }
      
      if (loaded >= totalSize) {
        clearInterval(progressInterval);
        
        // Complete the request after a small delay
        setTimeout(function() {
          var response = typeof mock === 'function' ? mock({}, self._method) : mock;
          
          self.readyState = 4;
          self.status = 200;
          self.statusText = 'OK';
          self.responseText = JSON.stringify(response);
          self.response = self.responseText;
          
          self._dispatch('readystatechange', {});
          self._dispatch('load', {});
          
          if (self.upload.onload) {
            self.upload.onload({});
          }
        }, 50);
      }
    }, 100); // Progress update every 100ms
  };
  
  MockXHR.prototype.abort = function() {
    if (!this._isMocked) {
      this._realXHR.abort();
    }
    this._dispatch('abort', {});
    if (this.upload.onabort) {
      this.upload.onabort({});
    }
  };
  
  MockXHR.prototype.getResponseHeader = function(name) {
    if (!this._isMocked) {
      return this._realXHR.getResponseHeader(name);
    }
    if (name.toLowerCase() === 'content-type') {
      return 'application/json';
    }
    return null;
  };
  
  MockXHR.prototype.getAllResponseHeaders = function() {
    if (!this._isMocked) {
      return this._realXHR.getAllResponseHeaders();
    }
    return 'content-type: application/json\r\n';
  };
  
  MockXHR.prototype.overrideMimeType = function(mime) {
    if (!this._isMocked) {
      this._realXHR.overrideMimeType(mime);
    }
  };
  
  // Replace global XMLHttpRequest
  global.XMLHttpRequest = MockXHR;
  
  // Expose original for debugging
  global.OriginalXMLHttpRequest = OriginalXHR;

  // Expose for debugging
  global.MockAPI = MockAPI;

})(window);

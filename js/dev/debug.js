/**
 * Funky.Debug - Developer Tools Panel
 * 
 * Development-only debugging panel for inspecting Funky internals.
 * Auto-initializes when loaded in development environment.
 * Toggle with Ctrl+Shift+D (Cmd+Shift+D on Mac).
 * 
 * @module Funky.Debug
 */
(function(window) {
    'use strict';

    if (!window.Funky || !window.Funky.register) {
        console.warn('[Funky.Debug] Funky namespace not found');
        return;
    }
    if (Funky.isRegistered('Debug')) return;

    var D = Funky.Dom;
    var E = Funky.Events;
    var Storage = Funky.Storage;
    var Keyboard = Funky.Keyboard;

    // =========================================================================
    // PRIVATE STATE
    // =========================================================================
    
    var _panel = null;
    var _visible = false;
    var _activeTab = 'events';
    var _initialized = false;
    var _unregisterShortcut = null;

    // Event interception state
    var _eventLog = [];
    var _eventsPaused = false;
    var _eventFilter = '';
    var _eventIdCounter = 0;
    var _originalPubSubEmit = null;
    var _originalEventsEmit = null;

    // State panel state
    var _stateRefreshInterval = null;

    // Performance tracking state
    var _apiMetrics = [];
    var _customTimers = {};
    var _timerHistory = [];
    var _metricsWindow = 5 * 60 * 1000; // 5 minutes
    var _slowThreshold = 500; // ms

    // Iframe/child frames state
    var _childFrames = {};
    var _frameFilter = 'all'; // 'all', 'parent', or specific frameId

    // LiveBinding deep inspection state
    var _bindingMetrics = {};  // bindingId -> metrics object
    var _originalBindingUpdate = null;

    var _config = {
        shortcut: 'ctrl+shift+d',
        position: 'right',
        width: 400,
        maxLogEntries: 500,
        persist: true
    };

    // =========================================================================
    // DEBUG MODULE
    // =========================================================================

    var Debug = {

        /**
         * Initialize debug panel
         * @param {Object} options - Configuration options
         * @returns {Object} Debug instance for chaining
         */
        init: function(options) {
            if (_initialized) return this;
            if (!_isDevelopment()) return this;

            // Merge options
            if (options) {
                for (var key in options) {
                    if (options.hasOwnProperty(key)) {
                        _config[key] = options[key];
                    }
                }
            }

            _createPanel();
            _registerShortcut();
            _setupEventInterception();
            _setupPerformanceTracking();
            _setupIframeMessageHandler();
            _setupBindingTracking();
            _initEventsPanel();
            _initStatePanel();
            _initComponentsPanel();
            _initPerformancePanel();
            _loadPersistedState();
            _initialized = true;

            console.log('[Funky.Debug] Initialized. Press Ctrl+Shift+D to toggle.');
            return this;
        },

        /**
         * Show debug panel
         * @returns {Object} Debug instance for chaining
         */
        show: function() {
            if (!_panel) return this;
            _panel.classAdd('funky-debug--visible');
            _panel.attr('aria-hidden', 'false');
            _visible = true;
            _persistState();
            Funky.PubSub.emit('funky:debug:shown');
            return this;
        },

        /**
         * Hide debug panel
         * @returns {Object} Debug instance for chaining
         */
        hide: function() {
            if (!_panel) return this;
            _panel.classRemove('funky-debug--visible');
            _panel.attr('aria-hidden', 'true');
            _visible = false;
            _persistState();
            Funky.PubSub.emit('funky:debug:hidden');
            return this;
        },

        /**
         * Toggle debug panel visibility
         * @returns {Object} Debug instance for chaining
         */
        toggle: function() {
            return _visible ? this.hide() : this.show();
        },

        /**
         * Check if panel is visible
         * @returns {boolean}
         */
        isVisible: function() {
            return _visible;
        },

        /**
         * Switch to a specific tab
         * @param {string} tabName - 'events', 'state', 'components', 'perf'
         * @returns {Object} Debug instance for chaining
         */
        switchTab: function(tabName) {
            _switchTab(tabName);
            return this;
        },

        /**
         * Get active tab name
         * @returns {string}
         */
        getActiveTab: function() {
            return _activeTab;
        },

        /**
         * Hard refresh - clear all storage and caches
         * @returns {Object} Debug instance for chaining
         */
        hardRefresh: function() {
            var confirmed = window.confirm(
                'Hard Refresh will clear:\n' +
                '• All localStorage\n' +
                '• All sessionStorage\n' +
                '• Service Worker caches\n' +
                '• Unregister Service Workers\n\n' +
                'The page will reload. Continue?'
            );

            if (!confirmed) return this;

            _performHardRefresh();
            return this;
        },

        /**
         * Get current configuration
         * @returns {Object}
         */
        getConfig: function() {
            var result = {};
            for (var key in _config) {
                if (_config.hasOwnProperty(key)) {
                    result[key] = _config[key];
                }
            }
            return result;
        },

        /**
         * Destroy debug panel
         */
        destroy: function() {
            if (_unregisterShortcut) {
                _unregisterShortcut();
                _unregisterShortcut = null;
            }
            if (_panel) {
                _panel.remove();
                _panel = null;
            }
            _initialized = false;
            _visible = false;
        },

        // =====================================================================
        // EVENT LOG API
        // =====================================================================

        /**
         * Get event log
         * @param {number} count - Max entries to return (default: all)
         * @returns {Array}
         */
        getEventLog: function(count) {
            if (count) {
                return _eventLog.slice(0, count);
            }
            return _eventLog.slice();
        },

        /**
         * Clear event log
         * @returns {Object} Debug instance for chaining
         */
        clearEventLog: function() {
            _eventLog = [];
            if (_visible && _activeTab === 'events') {
                _renderEventLog();
            }
            return this;
        },

        /**
         * Pause event logging
         * @returns {Object} Debug instance for chaining
         */
        pauseEvents: function() {
            _eventsPaused = true;
            return this;
        },

        /**
         * Resume event logging
         * @returns {Object} Debug instance for chaining
         */
        resumeEvents: function() {
            _eventsPaused = false;
            return this;
        },

        /**
         * Check if events are paused
         * @returns {boolean}
         */
        isEventsPaused: function() {
            return _eventsPaused;
        },

        /**
         * Log a custom event (for user debugging)
         * @param {string} event - Event name
         * @param {*} data - Event data
         * @returns {Object} Debug instance for chaining
         */
        log: function(event, data) {
            _logEvent('custom', event, data);
            return this;
        },

        // =====================================================================
        // STATE INSPECTOR API
        // =====================================================================

        /**
         * Get all LiveBinding states
         * @returns {Array}
         */
        getBindings: function() {
            if (!Funky.LiveBinding || !Funky.LiveBinding._bindings) {
                return [];
            }

            var result = [];
            Funky.LiveBinding._bindings.forEach(function(binding) {
                result.push({
                    id: binding.id,
                    selector: _getElementSelector(binding.element),
                    data: binding.data,
                    loading: binding.loading,
                    error: binding.error,
                    paused: binding.paused
                });
            });
            return result;
        },

        /**
         * Get specific binding by ID
         * @param {string} id - Binding ID
         * @returns {Object|null}
         */
        getBinding: function(id) {
            if (!Funky.LiveBinding || !Funky.LiveBinding._bindings) {
                return null;
            }
            return Funky.LiveBinding._bindings.get(id) || null;
        },

        /**
         * Get SPA state
         * @returns {Object}
         */
        getSpaState: function() {
            if (!Funky.SPA) {
                return { available: false };
            }

            return {
                available: true,
                initialized: Funky.SPA.initialized,
                currentPage: Funky.SPA.currentPage,
                idleState: Funky.SPA._idleState || 'unknown',
                presenceEnabled: Funky.SPA._presenceEnabled || false,
                presenceChannel: Funky.SPA._currentPresenceChannel || null
            };
        },

        /**
         * Get Pages state
         * @returns {Object}
         */
        getPagesState: function() {
            if (!Funky.Pages) {
                return { available: false };
            }

            var stats = null;
            if (Funky.Pages.cache && typeof Funky.Pages.cache.stats === 'function') {
                stats = Funky.Pages.cache.stats();
            }

            return {
                available: true,
                activePage: Funky.Pages.getActivePage(),
                registeredPages: Funky.Pages.list(),
                cacheStats: stats
            };
        },

        /**
         * Refresh state panel
         * @returns {Object} Debug instance for chaining
         */
        refreshState: function() {
            _renderStateTree();
            return this;
        },

        /**
         * Get all registered component names
         * @returns {Array}
         */
        getComponents: function() {
            return Funky.list ? Funky.list() : [];
        },

        /**
         * Get component debug info
         * @param {string} name - Component name
         * @returns {Object|null}
         */
        getComponentDebug: function(name) {
            var component = Funky[name];
            if (!component || typeof component.debug !== 'function') {
                return null;
            }
            try {
                return component.debug();
            } catch (e) {
                return { error: e.message };
            }
        },

        /**
         * Refresh components panel
         * @returns {Object} Debug instance for chaining
         */
        refreshComponents: function() {
            _renderComponentsTree();
            return this;
        },

        /**
         * Start a named timer
         * @param {string} name - Timer name
         * @returns {Object} Debug instance for chaining
         */
        startTimer: function(name) {
            _customTimers[name] = {
                name: name,
                start: Date.now()
            };
            return this;
        },

        /**
         * End a named timer
         * @param {string} name - Timer name
         * @returns {number} Duration in ms, or -1 if timer not found
         */
        endTimer: function(name) {
            var timer = _customTimers[name];
            if (!timer) {
                console.warn('[Funky.Debug] Timer not found:', name);
                return -1;
            }

            var duration = Date.now() - timer.start;
            delete _customTimers[name];

            _timerHistory.push({
                name: name,
                duration: duration,
                timestamp: Date.now()
            });

            console.log('[Funky.Debug] Timer ' + name + ': ' + duration + 'ms');

            if (_visible && _activeTab === 'perf') {
                _renderPerformancePanel();
            }

            return duration;
        },

        /**
         * Get API metrics summary
         * @returns {Object}
         */
        getApiMetrics: function() {
            _pruneOldMetrics();

            var total = _apiMetrics.length;
            var errors = _apiMetrics.filter(function(m) { return m.status === 'error'; }).length;
            var durations = _apiMetrics.map(function(m) { return m.duration; });

            return {
                total: total,
                errors: errors,
                errorRate: total > 0 ? (errors / total) : 0,
                avgDuration: total > 0 ? Math.round(durations.reduce(function(a, b) { return a + b; }, 0) / total) : 0,
                maxDuration: total > 0 ? Math.max.apply(null, durations) : 0,
                minDuration: total > 0 ? Math.min.apply(null, durations) : 0,
                requests: _apiMetrics.slice()
            };
        },

        /**
         * Get timer history
         * @returns {Array}
         */
        getTimerHistory: function() {
            return _timerHistory.slice();
        },

        /**
         * Clear performance metrics
         * @returns {Object} Debug instance for chaining
         */
        clearMetrics: function() {
            _apiMetrics = [];
            _timerHistory = [];
            if (_visible && _activeTab === 'perf') {
                _renderPerformancePanel();
            }
            return this;
        },

        /**
         * Set slow request threshold
         * @param {number} ms - Threshold in milliseconds
         * @returns {Object} Debug instance for chaining
         */
        setSlowThreshold: function(ms) {
            _slowThreshold = ms;
            return this;
        },

        // =====================================================================
        // IFRAME/CHILD FRAMES API
        // =====================================================================

        /**
         * Get connected child frames
         * @returns {Object} Map of frameId -> frame info
         */
        getChildFrames: function() {
            var result = {};
            for (var frameId in _childFrames) {
                if (_childFrames.hasOwnProperty(frameId)) {
                    var frame = _childFrames[frameId];
                    result[frameId] = {
                        id: frame.id,
                        url: frame.url,
                        connectedAt: frame.connectedAt,
                        lastActivity: frame.lastActivity,
                        state: frame.state
                    };
                }
            }
            return result;
        },

        /**
         * Request state refresh from all child frames
         * @returns {Object} Debug instance for chaining
         */
        refreshChildStates: function() {
            _requestChildStates();
            return this;
        },

        // =====================================================================
        // LIVEBINDING DEEP INSPECTION API
        // =====================================================================

        /**
         * Get binding metrics
         * @param {string} bindingId - Optional binding ID
         * @returns {Object} Single metrics or all metrics
         */
        getBindingMetrics: function(bindingId) {
            if (bindingId) {
                return _bindingMetrics[bindingId] || null;
            }
            var result = {};
            for (var id in _bindingMetrics) {
                if (_bindingMetrics.hasOwnProperty(id)) {
                    var metrics = _bindingMetrics[id];
                    result[id] = {
                        renderCount: metrics.renderCount,
                        lastRenderTime: metrics.lastRenderTime,
                        watched: metrics.watched,
                        historyLength: metrics.history.length
                    };
                }
            }
            return result;
        },

        /**
         * Watch a binding for continuous monitoring
         * @param {string} bindingId
         * @returns {Object} Debug instance for chaining
         */
        watchBinding: function(bindingId) {
            var metrics = _getOrCreateBindingMetrics(bindingId);
            metrics.watched = true;
            _updateWatchedBindingsCount();
            if (_visible && _activeTab === 'state') {
                _renderStateTree();
            }
            return this;
        },

        /**
         * Unwatch a binding
         * @param {string} bindingId
         * @returns {Object} Debug instance for chaining
         */
        unwatchBinding: function(bindingId) {
            if (_bindingMetrics[bindingId]) {
                _bindingMetrics[bindingId].watched = false;
                _updateWatchedBindingsCount();
                if (_visible && _activeTab === 'state') {
                    _renderStateTree();
                }
            }
            return this;
        },

        /**
         * Highlight a binding's DOM element
         * @param {string} bindingId
         * @returns {Object} Debug instance for chaining
         */
        highlightBinding: function(bindingId) {
            if (!Funky.LiveBinding || !Funky.LiveBinding._bindings) return this;
            var binding = Funky.LiveBinding._bindings.get(bindingId);
            if (binding) {
                _highlightBindingElement(binding);
            }
            return this;
        },

        /**
         * Clear binding metrics history
         * @param {string} bindingId - Optional, clears all if not provided
         * @returns {Object} Debug instance for chaining
         */
        clearBindingHistory: function(bindingId) {
            if (bindingId) {
                if (_bindingMetrics[bindingId]) {
                    _bindingMetrics[bindingId].history = [];
                    _bindingMetrics[bindingId].renderCount = 0;
                }
            } else {
                for (var id in _bindingMetrics) {
                    if (_bindingMetrics.hasOwnProperty(id)) {
                        _bindingMetrics[id].history = [];
                        _bindingMetrics[id].renderCount = 0;
                    }
                }
            }
            if (_visible && _activeTab === 'state') {
                _renderStateTree();
            }
            return this;
        },

        /**
         * Export debug data
         * @param {Object} options - Export options
         * @returns {string|Object} Export data
         */
        export: function(options) {
            var opts = {
                includeEvents: true,
                includeState: true,
                includeComponents: true,
                includePerformance: true,
                format: 'json',
                maxEvents: 100,
                sanitize: false
            };

            if (options) {
                for (var key in options) {
                    if (options.hasOwnProperty(key)) {
                        opts[key] = options[key];
                    }
                }
            }

            var report = _generateReport(opts);

            if (opts.format === 'text') {
                return _formatReportAsText(report);
            }

            return report;
        },

        /**
         * Copy export to clipboard
         * @param {Object} options - Same as export()
         * @returns {Object} Debug instance for chaining
         */
        copyToClipboard: function(options) {
            options = options || {};
            options.format = options.format || 'json';

            var data = this.export(options);
            var text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

            _copyTextToClipboard(text);

            if (Funky.Toast) {
                Funky.Toast.success('Debug report copied to clipboard');
            }

            return this;
        },

        /**
         * Download export as file
         * @param {Object} options - Same as export()
         * @returns {Object} Debug instance for chaining
         */
        downloadReport: function(options) {
            options = options || {};
            var format = options.format || 'json';
            var data = this.export(options);
            var text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

            var filename = 'funky-debug-' + _formatDateForFilename(new Date()) +
                           (format === 'json' ? '.json' : '.txt');

            _downloadFile(filename, text, format === 'json' ? 'application/json' : 'text/plain');

            if (Funky.Toast) {
                Funky.Toast.success('Debug report downloaded');
            }

            return this;
        }
    };

    // =========================================================================
    // PRIVATE FUNCTIONS
    // =========================================================================

    function _isDevelopment() {
        return window.location.hostname === 'localhost' ||
               window.location.hostname === '127.0.0.1' ||
               window.location.hostname === '' ||
               window.location.hostname.indexOf('.local') !== -1 ||
               window.location.port === '3000' ||
               window.location.port === '5000';
    }

    function _createPanel() {
        _panel = D.create('aside')
            .classAdd('funky-debug')
            .classAdd('funky-debug--' + _config.position)
            .attr('role', 'complementary')
            .attr('aria-label', 'Developer Debug Panel')
            .attr('aria-hidden', 'true')
            .attr('data-debug-panel', '');

        // Set width
        _panel.style({ width: _config.width + 'px' });

        // Header
        var header = D.create('header')
            .classAdd('funky-debug__header')
            .appendTo(_panel);

        D.create('h2')
            .classAdd('funky-debug__title')
            .text('Funky Debug')
            .appendTo(header);

        // Tabs
        var tabs = D.create('div')
            .classAdd('funky-debug__tabs')
            .attr('role', 'tablist')
            .appendTo(header);

        var tabConfig = [
            { id: 'events', label: 'Events', icon: '📡' },
            { id: 'state', label: 'State', icon: '📊' },
            { id: 'components', label: 'Components', icon: '🧩' },
            { id: 'perf', label: 'Perf', icon: '⚡' }
        ];

        tabConfig.forEach(function(tab, index) {
            D.create('button')
                .classAdd('funky-debug__tab')
                .attr('role', 'tab')
                .attr('aria-selected', index === 0 ? 'true' : 'false')
                .attr('data-tab', tab.id)
                .attr('tabindex', index === 0 ? '0' : '-1')
                .text(tab.icon + ' ' + tab.label)
                .on('click', function() {
                    _switchTab(tab.id);
                })
                .on('keydown', function(e) {
                    _handleTabKeydown(e, tabConfig);
                })
                .appendTo(tabs);
        });

        // Header actions
        var actions = D.create('div')
            .classAdd('funky-debug__actions')
            .appendTo(header);

        // Export dropdown
        var exportDropdown = D.create('div')
            .classAdd('funky-debug__export-dropdown')
            .appendTo(actions);

        D.create('button')
            .classAdd('funky-debug__action')
            .attr('aria-label', 'Export debug data')
            .attr('title', 'Export debug data')
            .attr('aria-haspopup', 'true')
            .attr('aria-expanded', 'false')
            .text('📥')
            .on('click', function() {
                var menu = _panel.one('.funky-debug__export-menu');
                var isOpen = menu.attr('aria-hidden') === 'false';
                menu.attr('aria-hidden', isOpen ? 'true' : 'false');
                this.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
            })
            .appendTo(exportDropdown);

        var exportMenu = D.create('div')
            .classAdd('funky-debug__export-menu')
            .attr('aria-hidden', 'true')
            .appendTo(exportDropdown);

        D.create('button')
            .classAdd('funky-debug__export-option')
            .text('📋 Copy as JSON')
            .on('click', function() {
                Debug.copyToClipboard({ format: 'json' });
                exportMenu.attr('aria-hidden', 'true');
            })
            .appendTo(exportMenu);

        D.create('button')
            .classAdd('funky-debug__export-option')
            .text('📋 Copy as Text')
            .on('click', function() {
                Debug.copyToClipboard({ format: 'text' });
                exportMenu.attr('aria-hidden', 'true');
            })
            .appendTo(exportMenu);

        D.create('button')
            .classAdd('funky-debug__export-option')
            .text('💾 Download JSON')
            .on('click', function() {
                Debug.downloadReport({ format: 'json' });
                exportMenu.attr('aria-hidden', 'true');
            })
            .appendTo(exportMenu);

        D.create('button')
            .classAdd('funky-debug__export-option')
            .text('💾 Download Text')
            .on('click', function() {
                Debug.downloadReport({ format: 'text' });
                exportMenu.attr('aria-hidden', 'true');
            })
            .appendTo(exportMenu);

        D.create('hr')
            .appendTo(exportMenu);

        D.create('button')
            .classAdd('funky-debug__export-option')
            .text('🔒 Sanitized Export')
            .on('click', function() {
                Debug.copyToClipboard({ format: 'json', sanitize: true });
                exportMenu.attr('aria-hidden', 'true');
            })
            .appendTo(exportMenu);

        D.create('button')
            .classAdd('funky-debug__action')
            .attr('aria-label', 'Hard refresh')
            .attr('title', 'Clear storage & cache')
            .text('🔄')
            .on('click', function() {
                Debug.hardRefresh();
            })
            .appendTo(actions);

        D.create('button')
            .classAdd('funky-debug__close')
            .attr('aria-label', 'Close debug panel')
            .text('×')
            .on('click', function() {
                Debug.hide();
            })
            .appendTo(actions);

        // Body with tab panels
        var body = D.create('div')
            .classAdd('funky-debug__body')
            .appendTo(_panel);

        // Create tab panels
        tabConfig.forEach(function(tab, index) {
            var panel = D.create('section')
                .classAdd('funky-debug__panel')
                .attr('role', 'tabpanel')
                .attr('data-panel', tab.id)
                .attr('id', 'funky-debug-panel-' + tab.id)
                .attr('aria-hidden', index === 0 ? 'false' : 'true')
                .attr('tabindex', '0')
                .appendTo(body);

            // Add empty state placeholder
            var empty = D.create('div')
                .classAdd('funky-debug__empty')
                .appendTo(panel);

            D.create('div')
                .classAdd('funky-debug__empty-icon')
                .text(_getEmptyIcon(tab.id))
                .appendTo(empty);

            D.create('p')
                .text(_getEmptyMessage(tab.id))
                .appendTo(empty);
        });

        // Append to body
        D.one('body').append(_panel);
    }

    function _getEmptyIcon(tabId) {
        var icons = {
            events: '📡',
            state: '📊',
            components: '🧩',
            perf: '⚡'
        };
        return icons[tabId] || '📋';
    }

    function _getEmptyMessage(tabId) {
        var messages = {
            events: 'No events captured yet',
            state: 'State inspection ready',
            components: 'Component tree ready',
            perf: 'Performance metrics ready'
        };
        return messages[tabId] || 'Ready';
    }

    function _handleTabKeydown(e, tabConfig) {
        var currentIndex = -1;
        for (var i = 0; i < tabConfig.length; i++) {
            if (tabConfig[i].id === _activeTab) {
                currentIndex = i;
                break;
            }
        }

        var newIndex = currentIndex;

        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            newIndex = (currentIndex + 1) % tabConfig.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            newIndex = (currentIndex - 1 + tabConfig.length) % tabConfig.length;
        } else if (e.key === 'Home') {
            e.preventDefault();
            newIndex = 0;
        } else if (e.key === 'End') {
            e.preventDefault();
            newIndex = tabConfig.length - 1;
        }

        if (newIndex !== currentIndex) {
            _switchTab(tabConfig[newIndex].id);
            // Focus the new tab
            var newTab = _panel.one('[data-tab="' + tabConfig[newIndex].id + '"]');
            if (newTab.raw()) {
                newTab.raw().focus();
            }
        }
    }

    function _switchTab(tabName) {
        if (!_panel) return;

        _activeTab = tabName;

        // Update tab buttons
        _panel.all('[role="tab"]').each(function(tab) {
            var isSelected = tab.attr('data-tab') === tabName;
            tab.attr('aria-selected', isSelected ? 'true' : 'false');
            tab.attr('tabindex', isSelected ? '0' : '-1');
            if (isSelected) {
                tab.classAdd('funky-debug__tab--active');
            } else {
                tab.classRemove('funky-debug__tab--active');
            }
        });

        // Update panels
        _panel.all('[role="tabpanel"]').each(function(panel) {
            var isActive = panel.attr('data-panel') === tabName;
            panel.attr('aria-hidden', isActive ? 'false' : 'true');
        });

        Funky.PubSub.emit('funky:debug:tab:changed', { tab: tabName });
    }

    function _registerShortcut() {
        if (!Keyboard) {
            console.warn('[Funky.Debug] Keyboard module not available');
            return;
        }

        _unregisterShortcut = Keyboard.register({
            key: 'd',
            mod: true,
            shift: true,
            handler: function(e) {
                e.preventDefault();
                Debug.toggle();
            },
            scope: 'global',
            description: 'Toggle debug panel',
            group: 'Developer',
            allowInInput: true
        });
    }

    function _loadPersistedState() {
        if (!_config.persist || !Storage) return;

        var state = Storage.get('funky_debug_state');
        if (state) {
            if (state.visible) {
                Debug.show();
            }
            if (state.activeTab) {
                _switchTab(state.activeTab);
            }
        }
    }

    function _persistState() {
        if (!_config.persist || !Storage) return;

        Storage.set('funky_debug_state', {
            visible: _visible,
            activeTab: _activeTab
        });
    }

    function _performHardRefresh() {
        // Clear localStorage
        try {
            window.localStorage.clear();
            console.log('[Funky.Debug] localStorage cleared');
        } catch (e) {
            console.warn('[Funky.Debug] Failed to clear localStorage:', e);
        }

        // Clear sessionStorage
        try {
            window.sessionStorage.clear();
            console.log('[Funky.Debug] sessionStorage cleared');
        } catch (e) {
            console.warn('[Funky.Debug] Failed to clear sessionStorage:', e);
        }

        // Clear caches and unregister service workers
        if ('caches' in window) {
            caches.keys().then(function(names) {
                names.forEach(function(name) {
                    caches.delete(name);
                });
                console.log('[Funky.Debug] Caches cleared');
            });
        }

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
                registrations.forEach(function(registration) {
                    registration.unregister();
                });
                console.log('[Funky.Debug] Service workers unregistered');
            });
        }

        // Reload after a brief delay to allow async operations
        setTimeout(function() {
            window.location.reload(true);
        }, 100);
    }

    // =========================================================================
    // EVENT INTERCEPTION
    // =========================================================================

    function _setupEventInterception() {
        // Wrap PubSub.emit
        if (Funky.PubSub && Funky.PubSub.emit) {
            _originalPubSubEmit = Funky.PubSub.emit;
            Funky.PubSub.emit = function(event, data) {
                // Don't log our own debug events to avoid recursion
                if (event.indexOf('funky:debug:') !== 0) {
                    _logEvent('pubsub', event, data);
                }
                return _originalPubSubEmit.apply(this, arguments);
            };
        }

        // Wrap Events.emit (DOM custom events)
        if (Funky.Events && Funky.Events.emit) {
            _originalEventsEmit = Funky.Events.emit;
            Funky.Events.emit = function(target, event, detail) {
                _logEvent('dom', event, detail);
                return _originalEventsEmit.apply(this, arguments);
            };
        }

        // Subscribe to API events (already emitted via PubSub but capture separately for typing)
        Funky.PubSub.on('funky:api:request', function(data) {
            _logEvent('api', 'api:request', data, 'api-request');
        });
        Funky.PubSub.on('funky:api:success', function(data) {
            _logEvent('api', 'api:success', data, 'api-success');
        });
        Funky.PubSub.on('funky:api:error', function(data) {
            _logEvent('api', 'api:error', data, 'api-error');
        });

        // =====================================================================
        // SPA NAVIGATION EVENTS (DOM CustomEvents via dispatchEvent)
        // =====================================================================
        
        document.addEventListener('funky.spa.beforenavigate', function(e) {
            _logEvent('spa', 'spa:beforenavigate', e.detail, 'spa-nav');
        });
        document.addEventListener('funky.spa.navigated', function(e) {
            _logEvent('spa', 'spa:navigated', e.detail, 'spa-nav');
        });
        document.addEventListener('funky.spa.pageload', function(e) {
            _logEvent('spa', 'spa:pageload', e.detail, 'spa-nav');
        });
        document.addEventListener('funky.spa.page-cached', function(e) {
            _logEvent('spa', 'spa:page-cached', e.detail, 'spa-cache');
        });

        // =====================================================================
        // PAGES LIFECYCLE EVENTS
        // =====================================================================
        
        Funky.PubSub.on('funky:pages:mounted', function(data) {
            _logEvent('pages', 'pages:mounted', data, 'pages-lifecycle');
        });
        Funky.PubSub.on('funky:pages:unmounting', function(data) {
            _logEvent('pages', 'pages:unmounting', data, 'pages-lifecycle');
        });
        Funky.PubSub.on('funky:pages:rendered', function(data) {
            _logEvent('pages', 'pages:rendered', data, 'pages-lifecycle');
        });
        Funky.PubSub.on('funky:pages:cache:invalidated', function(data) {
            _logEvent('pages', 'pages:cache:invalidated', data, 'pages-cache');
        });

        // =====================================================================
        // WEBSOCKET/CHANNEL EVENTS
        // =====================================================================
        
        Funky.PubSub.on('funky:websocket:connected', function(data) {
            _logEvent('websocket', 'ws:connected', data, 'ws-connection');
        });
        Funky.PubSub.on('funky:websocket:disconnected', function(data) {
            _logEvent('websocket', 'ws:disconnected', data, 'ws-connection');
        });
        Funky.PubSub.on('funky:websocket:reconnecting', function(data) {
            _logEvent('websocket', 'ws:reconnecting', data, 'ws-connection');
        });
        Funky.PubSub.on('funky:websocket:error', function(data) {
            _logEvent('websocket', 'ws:error', data, 'ws-error');
        });

        // Channel events
        Funky.PubSub.on('funky:channel:joined', function(data) {
            _logEvent('channel', 'channel:joined', data, 'channel-lifecycle');
        });
        Funky.PubSub.on('funky:channel:left', function(data) {
            _logEvent('channel', 'channel:left', data, 'channel-lifecycle');
        });
        Funky.PubSub.on('funky:channel:message', function(data) {
            _logEvent('channel', 'channel:message', data, 'channel-message');
        });

        // Presence events
        Funky.PubSub.on('funky:presence:join', function(data) {
            _logEvent('presence', 'presence:join', data, 'presence');
        });
        Funky.PubSub.on('funky:presence:leave', function(data) {
            _logEvent('presence', 'presence:leave', data, 'presence');
        });
        Funky.PubSub.on('funky:presence:update', function(data) {
            _logEvent('presence', 'presence:update', data, 'presence');
        });
    }

    function _logEvent(type, event, data, subType) {
        if (_eventsPaused) return;

        var entry = {
            id: 'evt_' + (++_eventIdCounter),
            timestamp: Date.now(),
            time: _formatTime(new Date()),
            type: type,
            subType: subType || null,
            event: event,
            data: data ? _safeClone(data) : null
        };

        _eventLog.unshift(entry);

        // Trim to max entries
        if (_eventLog.length > _config.maxLogEntries) {
            _eventLog = _eventLog.slice(0, _config.maxLogEntries);
        }

        // Update UI if visible and on events tab
        if (_visible && _activeTab === 'events') {
            _renderEventEntry(entry);
        }
    }

    function _safeClone(obj) {
        try {
            return JSON.parse(JSON.stringify(obj));
        } catch (e) {
            return { _error: 'Could not serialize', type: typeof obj };
        }
    }

    function _formatTime(date) {
        var h = String(date.getHours());
        var m = String(date.getMinutes());
        var s = String(date.getSeconds());
        var ms = String(date.getMilliseconds());
        // Pad without padStart for ES5 compatibility
        h = h.length < 2 ? '0' + h : h;
        m = m.length < 2 ? '0' + m : m;
        s = s.length < 2 ? '0' + s : s;
        while (ms.length < 3) ms = '0' + ms;
        return h + ':' + m + ':' + s + '.' + ms;
    }

    // =========================================================================
    // EVENTS PANEL UI
    // =========================================================================

    function _initEventsPanel() {
        var panel = _panel.one('[data-panel="events"]');
        if (!panel.raw()) return;

        // Clear existing empty state
        panel.html('');

        // Toolbar
        var toolbar = D.create('div')
            .classAdd('funky-debug__toolbar')
            .appendTo(panel);

        D.create('input')
            .attr('type', 'search')
            .attr('placeholder', 'Filter events...')
            .attr('aria-label', 'Filter events')
            .on('input', _debounce(function() {
                _eventFilter = this.value.toLowerCase();
                _renderEventLog();
            }, 150))
            .appendTo(toolbar);

        D.create('button')
            .attr('data-action', 'pause')
            .text(_eventsPaused ? '▶ Resume' : '⏸ Pause')
            .on('click', function() {
                _eventsPaused = !_eventsPaused;
                this.textContent = _eventsPaused ? '▶ Resume' : '⏸ Pause';
            })
            .appendTo(toolbar);

        D.create('button')
            .attr('data-action', 'clear')
            .text('🗑 Clear')
            .on('click', function() {
                _eventLog = [];
                _renderEventLog();
            })
            .appendTo(toolbar);

        // Frame filter dropdown (hidden until child frames connect)
        var frameSelect = D.create('select')
            .classAdd('funky-debug__frame-filter')
            .attr('data-frame-filter', '')
            .attr('aria-label', 'Filter by frame')
            .style({ display: 'none' })
            .on('change', function() {
                _frameFilter = this.value;
                _renderEventLog();
            })
            .appendTo(toolbar);

        D.create('option')
            .attr('value', 'all')
            .text('All frames')
            .appendTo(frameSelect);

        D.create('option')
            .attr('value', 'parent')
            .text('Parent only')
            .appendTo(frameSelect);

        // Log container
        D.create('ol')
            .classAdd('funky-debug__log')
            .attr('role', 'log')
            .attr('aria-live', 'polite')
            .attr('aria-label', 'Event log')
            .appendTo(panel);

        // Render initial state
        _renderEventLog();
    }

    function _renderEventLog() {
        var logEl = _panel.one('.funky-debug__log');
        if (!logEl.raw()) return;

        logEl.html('');

        var filtered = _eventLog.filter(function(entry) {
            // Apply text filter
            if (_eventFilter) {
                var matchesText = entry.event.toLowerCase().indexOf(_eventFilter) !== -1 ||
                                  entry.type.toLowerCase().indexOf(_eventFilter) !== -1;
                if (!matchesText) return false;
            }

            // Apply frame filter
            if (_frameFilter !== 'all') {
                if (_frameFilter === 'parent') {
                    return !entry.frameId;
                } else {
                    return entry.frameId === _frameFilter;
                }
            }

            return true;
        });

        if (filtered.length === 0) {
            D.create('li')
                .classAdd('funky-debug__empty')
                .html('<span class="funky-debug__empty-icon">📭</span>' +
                      '<span>No events captured</span>')
                .appendTo(logEl);
            return;
        }

        filtered.forEach(function(entry) {
            _renderEventEntry(entry, logEl, true);
        });
    }

    function _renderEventEntry(entry, container, append) {
        container = container || _panel.one('.funky-debug__log');
        if (!container.raw()) return;

        var li = D.create('li')
            .classAdd('funky-debug__event')
            .attr('data-type', entry.subType || entry.type)
            .attr('data-id', entry.id);

        // Frame label for iframe events
        if (entry.frameId) {
            D.create('span')
                .classAdd('funky-debug__frame-label', 'funky-debug__frame-label--child')
                .text('[' + entry.frameId + ']')
                .appendTo(li);
        } else if (_hasChildFrames()) {
            D.create('span')
                .classAdd('funky-debug__frame-label', 'funky-debug__frame-label--parent')
                .text('[parent]')
                .appendTo(li);
        }

        D.create('time')
            .text(entry.time)
            .appendTo(li);

        D.create('code')
            .text(entry.event)
            .appendTo(li);

        if (entry.data) {
            var pre = D.create('pre')
                .text(JSON.stringify(entry.data, null, 2))
                .appendTo(li);

            // Click to copy
            pre.on('click', function() {
                _copyToClipboard(JSON.stringify(entry.data, null, 2));
                if (Funky.Toast) {
                    Funky.Toast.success('Copied to clipboard');
                }
            });
            pre.attr('title', 'Click to copy');
            pre.style({ cursor: 'pointer' });
        }

        if (append) {
            // Append for re-render (oldest last)
            li.appendTo(container);
        } else {
            // Prepend to show newest first (live updates)
            var firstChild = container.one('li');
            if (firstChild.raw()) {
                container.raw().insertBefore(li.raw(), firstChild.raw());
            } else {
                li.appendTo(container);
            }
        }

        // Remove empty state if present
        container.one('.funky-debug__empty').remove();
    }

    function _copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
        } else {
            var ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
    }

    function _debounce(fn, delay) {
        var timer;
        return function() {
            var context = this;
            var args = arguments;
            clearTimeout(timer);
            timer = setTimeout(function() {
                fn.apply(context, args);
            }, delay);
        };
    }

    // =========================================================================
    // STATE PANEL
    // =========================================================================

    function _initStatePanel() {
        var panel = _panel.one('[data-panel="state"]');
        if (!panel.raw()) return;

        // Clear existing empty state
        panel.html('');

        // Toolbar
        var toolbar = D.create('div')
            .classAdd('funky-debug__toolbar')
            .appendTo(panel);

        D.create('button')
            .attr('data-action', 'refresh')
            .text('🔄 Refresh')
            .on('click', function() {
                _renderStateTree();
            })
            .appendTo(toolbar);

        D.create('label')
            .classAdd('funky-debug__toggle-label')
            .html('<input type="checkbox" data-auto-refresh> Auto-refresh')
            .appendTo(toolbar);

        toolbar.one('[data-auto-refresh]').on('change', function() {
            if (this.checked) {
                _startStateAutoRefresh();
            } else {
                _stopStateAutoRefresh();
            }
        });

        // Tree container
        D.create('div')
            .classAdd('funky-debug__tree')
            .attr('data-state-tree', '')
            .appendTo(panel);

        // Initial render
        _renderStateTree();
    }

    function _renderStateTree() {
        var tree = _panel.one('[data-state-tree]');
        if (!tree.raw()) return;

        tree.html('');

        // Render sections
        _renderSpaState(tree);
        _renderPagesState(tree);
        _renderWebSocketState(tree);
        _renderCacheState(tree);
        _renderFocusManagerState(tree);
        _renderServiceWorkerState(tree);
        _renderLiveBindingsState(tree);
        _renderChildFramesState(tree);
    }

    function _startStateAutoRefresh() {
        _stopStateAutoRefresh();
        _stateRefreshInterval = setInterval(function() {
            if (_visible && _activeTab === 'state') {
                _renderStateTree();
            }
        }, 1000);
    }

    function _stopStateAutoRefresh() {
        if (_stateRefreshInterval) {
            clearInterval(_stateRefreshInterval);
            _stateRefreshInterval = null;
        }
    }

    // =========================================================================
    // SPA STATE
    // =========================================================================

    function _renderSpaState(container) {
        var section = D.create('div')
            .classAdd('funky-debug__state-section')
            .appendTo(container);

        D.create('div')
            .classAdd('funky-debug__tree-header')
            .text('🧭 SPA Navigation')
            .appendTo(section);

        if (!Funky.SPA) {
            D.create('div')
                .classAdd('funky-debug__state-item', 'funky-debug__state-item--muted')
                .text('SPA not available')
                .appendTo(section);
            return;
        }

        var items = D.create('div')
            .classAdd('funky-debug__state-items')
            .appendTo(section);

        _renderStateItem(items, 'Current Page', Funky.SPA.currentPage || '(none)');
        _renderStateItem(items, 'Initialized', Funky.SPA.initialized ? '✓ Yes' : '✗ No');

        if (Funky.SPA._idleState !== undefined) {
            var idleIcon = { active: '🟢', idle: '🟡', away: '🔴' };
            _renderStateItem(items, 'Idle State', 
                (idleIcon[Funky.SPA._idleState] || '') + ' ' + (Funky.SPA._idleState || 'unknown'));
        }

        if (Funky.SPA._presenceEnabled) {
            _renderStateItem(items, 'Presence Channel', 
                Funky.SPA._currentPresenceChannel || '(none)');
        }
    }

    // =========================================================================
    // PAGES STATE
    // =========================================================================

    function _renderPagesState(container) {
        var section = D.create('div')
            .classAdd('funky-debug__state-section')
            .appendTo(container);

        D.create('div')
            .classAdd('funky-debug__tree-header')
            .text('📑 Pages')
            .appendTo(section);

        if (!Funky.Pages) {
            D.create('div')
                .classAdd('funky-debug__state-item', 'funky-debug__state-item--muted')
                .text('Pages not available')
                .appendTo(section);
            return;
        }

        var items = D.create('div')
            .classAdd('funky-debug__state-items')
            .appendTo(section);

        _renderStateItem(items, 'Active Page', Funky.Pages.getActivePage ? Funky.Pages.getActivePage() || '(none)' : '(none)');

        var registeredPages = Funky.Pages.list ? Funky.Pages.list() : [];
        _renderStateItem(items, 'Registered', registeredPages.length + ' pages');

        if (Funky.Pages.cache && typeof Funky.Pages.cache.stats === 'function') {
            var stats = Funky.Pages.cache.stats();
            _renderStateItem(items, 'Cache', (stats.size || 0) + ' entries');
        }

        if (registeredPages.length > 0) {
            _renderCollapsibleList(section, 'Registered Pages', registeredPages, function(pageId) {
                var activePage = Funky.Pages.getActivePage ? Funky.Pages.getActivePage() : null;
                var isActive = pageId === activePage;
                return '<code>' + pageId + '</code>' + 
                       (isActive ? ' <span class="funky-debug__badge funky-debug__badge--success">active</span>' : '');
            });
        }
    }

    // =========================================================================
    // WEBSOCKET/CHANNEL STATE
    // =========================================================================

    function _renderWebSocketState(container) {
        var section = D.create('div')
            .classAdd('funky-debug__state-section')
            .appendTo(container);

        D.create('div')
            .classAdd('funky-debug__tree-header')
            .text('🔌 WebSocket / Channels')
            .appendTo(section);

        if (!Funky.WebSocket) {
            D.create('div')
                .classAdd('funky-debug__state-item', 'funky-debug__state-item--muted')
                .text('WebSocket not available')
                .appendTo(section);
            return;
        }

        var items = D.create('div')
            .classAdd('funky-debug__state-items')
            .appendTo(section);

        var isConnected = Funky.WebSocket.isConnected ? Funky.WebSocket.isConnected() : false;
        var statusIcon = isConnected ? '🟢' : '🔴';
        _renderStateItem(items, 'Status', statusIcon + ' ' + (isConnected ? 'Connected' : 'Disconnected'));

        if (typeof Funky.WebSocket.debug === 'function') {
            try {
                var wsDebug = Funky.WebSocket.debug();
                if (wsDebug.latency) {
                    _renderStateItem(items, 'Latency', wsDebug.latency + 'ms');
                }
                if (wsDebug.reconnectAttempts !== undefined) {
                    _renderStateItem(items, 'Reconnects', wsDebug.reconnectAttempts);
                }
            } catch (e) {}
        }

        if (Funky.Channel && typeof Funky.Channel.list === 'function') {
            var channels = Funky.Channel.list();
            _renderStateItem(items, 'Channels', channels.length + ' active');

            if (channels.length > 0) {
                _renderCollapsibleList(section, 'Active Channels', channels, function(name) {
                    return '<code>' + name + '</code>';
                });
            }
        }
    }

    // =========================================================================
    // CACHE STATE
    // =========================================================================

    function _renderCacheState(container) {
        var section = D.create('div')
            .classAdd('funky-debug__state-section')
            .appendTo(container);

        D.create('div')
            .classAdd('funky-debug__tree-header')
            .text('💾 Cache')
            .appendTo(section);

        if (!Funky.Cache) {
            D.create('div')
                .classAdd('funky-debug__state-item', 'funky-debug__state-item--muted')
                .text('Cache not available')
                .appendTo(section);
            return;
        }

        var items = D.create('div')
            .classAdd('funky-debug__state-items')
            .appendTo(section);

        if (typeof Funky.Cache.stats === 'function') {
            var stats = Funky.Cache.stats();
            _renderStateItem(items, 'Entries', stats.size || 0);
            if (stats.maxSize) {
                _renderStateItem(items, 'Max Size', stats.maxSize);
            }
            if (stats.hitRate !== undefined) {
                _renderStateItem(items, 'Hit Rate', Math.round(stats.hitRate * 100) + '%');
            }
        }

        if (typeof Funky.Cache.keys === 'function') {
            var keys = Funky.Cache.keys();
            if (keys.length > 0) {
                var displayKeys = keys.slice(0, 20);
                _renderCollapsibleList(section, 'Cached Keys (' + keys.length + ')', displayKeys, function(key) {
                    return '<code>' + key + '</code>';
                });
                if (keys.length > 20) {
                    section.one('.funky-debug__collapsible-content ul').append(
                        D.create('li').classAdd('funky-debug__more').text('... and ' + (keys.length - 20) + ' more')
                    );
                }
            }
        }
    }

    // =========================================================================
    // FOCUS MANAGER STATE
    // =========================================================================

    function _renderFocusManagerState(container) {
        var section = D.create('div')
            .classAdd('funky-debug__state-section')
            .appendTo(container);

        D.create('div')
            .classAdd('funky-debug__tree-header')
            .text('🎯 Focus Manager')
            .appendTo(section);

        if (!Funky.FocusManager) {
            D.create('div')
                .classAdd('funky-debug__state-item', 'funky-debug__state-item--muted')
                .text('FocusManager not available')
                .appendTo(section);
            return;
        }

        var items = D.create('div')
            .classAdd('funky-debug__state-items')
            .appendTo(section);

        var activeTrap = Funky.FocusManager.getActiveTrap ? Funky.FocusManager.getActiveTrap() : null;
        if (activeTrap) {
            _renderStateItem(items, 'Active Trap', _getElementSelector(activeTrap));
        } else {
            _renderStateItem(items, 'Active Trap', '(none)');
        }

        if (typeof Funky.FocusManager.getTrapStack === 'function') {
            var stack = Funky.FocusManager.getTrapStack();
            _renderStateItem(items, 'Trap Stack', stack.length + ' deep');
        }

        if (typeof Funky.FocusManager.debug === 'function') {
            try {
                var fmDebug = Funky.FocusManager.debug();
                if (fmDebug.escapeHandlers !== undefined) {
                    _renderStateItem(items, 'Escape Handlers', fmDebug.escapeHandlers);
                }
            } catch (e) {}
        }
    }

    // =========================================================================
    // SERVICE WORKER STATE
    // =========================================================================

    function _renderServiceWorkerState(container) {
        var section = D.create('div')
            .classAdd('funky-debug__state-section')
            .appendTo(container);

        D.create('div')
            .classAdd('funky-debug__tree-header')
            .text('⚙️ Service Worker')
            .appendTo(section);

        if (!Funky.ServiceWorker) {
            D.create('div')
                .classAdd('funky-debug__state-item', 'funky-debug__state-item--muted')
                .text('ServiceWorker not available')
                .appendTo(section);
            return;
        }

        var items = D.create('div')
            .classAdd('funky-debug__state-items')
            .appendTo(section);

        var status = Funky.ServiceWorker.getStatus ? Funky.ServiceWorker.getStatus() : 'unknown';
        var statusIcons = { 'active': '🟢', 'installing': '🟡', 'waiting': '🟠', 'none': '⚪' };
        _renderStateItem(items, 'Status', (statusIcons[status] || '❓') + ' ' + status);

        if (typeof Funky.ServiceWorker.isUpdateAvailable === 'function') {
            var hasUpdate = Funky.ServiceWorker.isUpdateAvailable();
            if (hasUpdate) {
                _renderStateItem(items, 'Update', '🆕 Available');
            }
        }

        if (typeof Funky.ServiceWorker.debug === 'function') {
            try {
                var swDebug = Funky.ServiceWorker.debug();
                if (swDebug.scope) {
                    _renderStateItem(items, 'Scope', swDebug.scope);
                }
                if (swDebug.cacheNames && swDebug.cacheNames.length > 0) {
                    _renderStateItem(items, 'Caches', swDebug.cacheNames.length);
                }
            } catch (e) {}
        }
    }

    // =========================================================================
    // LIVEBINDING STATE
    // =========================================================================

    function _renderLiveBindingsState(container) {
        var section = D.create('div')
            .classAdd('funky-debug__state-section')
            .appendTo(container);

        if (!Funky.LiveBinding || !Funky.LiveBinding._bindings) {
            D.create('div')
                .classAdd('funky-debug__tree-header')
                .text('🔗 LiveBindings')
                .appendTo(section);
            D.create('div')
                .classAdd('funky-debug__state-item', 'funky-debug__state-item--muted')
                .text('LiveBinding not available')
                .appendTo(section);
            return;
        }

        var bindings = Funky.LiveBinding._bindings;
        var count = 0;
        var watchedCount = 0;
        bindings.forEach(function(b) {
            count++;
            var metrics = _bindingMetrics[b.id];
            if (metrics && metrics.watched) watchedCount++;
        });

        // Header with watched count
        var header = D.create('div')
            .classAdd('funky-debug__tree-header')
            .appendTo(section);

        D.create('span')
            .text('🔗 LiveBindings (' + count + ' active)')
            .appendTo(header);

        if (watchedCount > 0) {
            D.create('span')
                .classAdd('funky-debug__watched-badge')
                .attr('data-watched-count', '')
                .text('📌 ' + watchedCount)
                .appendTo(header);
        }

        if (count === 0) {
            D.create('div')
                .classAdd('funky-debug__empty')
                .html('<span class="funky-debug__empty-icon">📭</span>' +
                      '<span>No active bindings</span>')
                .appendTo(section);
            return;
        }

        // Render watched bindings first
        bindings.forEach(function(binding) {
            var metrics = _bindingMetrics[binding.id];
            if (metrics && metrics.watched) {
                _renderBindingNode(binding, section);
            }
        });

        // Then render unwatched bindings
        bindings.forEach(function(binding) {
            var metrics = _bindingMetrics[binding.id];
            if (!metrics || !metrics.watched) {
                _renderBindingNode(binding, section);
            }
        });
    }

    function _renderBindingNode(binding, container) {
        var metrics = _getOrCreateBindingMetrics(binding.id);

        var node = D.create('div')
            .classAdd('funky-debug__binding')
            .attr('data-binding-id', binding.id)
            .appendTo(container);

        if (metrics.watched) {
            node.classAdd('funky-debug__binding--watched');
        }

        var header = D.create('div')
            .classAdd('funky-debug__binding-header')
            .appendTo(node);

        D.create('span')
            .classAdd('funky-debug__node-toggle')
            .text('▶')
            .on('click', function() {
                var content = node.one('.funky-debug__binding-content');
                var isExpanded = content.attr('aria-hidden') === 'false';
                content.attr('aria-hidden', isExpanded ? 'true' : 'false');
                this.textContent = isExpanded ? '▶' : '▼';
            })
            .appendTo(header);

        D.create('code')
            .classAdd('funky-debug__binding-id')
            .text(binding.id)
            .appendTo(header);

        // Actions (watch, highlight)
        var actions = D.create('span')
            .classAdd('funky-debug__binding-actions')
            .appendTo(header);

        D.create('button')
            .classAdd('funky-debug__binding-action')
            .attr('title', metrics.watched ? 'Unwatch' : 'Watch')
            .attr('data-action', 'watch')
            .text(metrics.watched ? '📌' : '📍')
            .on('click', function(e) {
                e.stopPropagation();
                metrics.watched = !metrics.watched;
                this.textContent = metrics.watched ? '📌' : '📍';
                this.setAttribute('title', metrics.watched ? 'Unwatch' : 'Watch');
                if (metrics.watched) {
                    node.classAdd('funky-debug__binding--watched');
                } else {
                    node.classRemove('funky-debug__binding--watched');
                }
                _updateWatchedBindingsCount();
            })
            .appendTo(actions);

        D.create('button')
            .classAdd('funky-debug__binding-action')
            .attr('title', 'Highlight element')
            .attr('data-action', 'highlight')
            .text('👁')
            .on('click', function(e) {
                e.stopPropagation();
                _highlightBindingElement(binding);
            })
            .appendTo(actions);

        // Stats (renders, last render time)
        var stats = D.create('div')
            .classAdd('funky-debug__binding-stats')
            .appendTo(header);

        var statusClass = binding.loading ? 'loading' : binding.error ? 'error' : 'active';
        D.create('span')
            .classAdd('funky-debug__binding-status', 'funky-debug__binding-status--' + statusClass)
            .text(binding.loading ? '⏳' : binding.error ? '❌' : '●')
            .appendTo(stats);

        D.create('span')
            .classAdd('funky-debug__binding-stat')
            .text('Renders: ' + metrics.renderCount)
            .appendTo(stats);

        if (metrics.lastRenderTime) {
            var ago = Math.round((Date.now() - metrics.lastRenderTime) / 1000);
            D.create('span')
                .classAdd('funky-debug__binding-stat')
                .text('Last: ' + ago + 's ago')
                .appendTo(stats);
        }

        // Selector with click-to-highlight
        var selector = _getElementSelector(binding.element);
        D.create('span')
            .classAdd('funky-debug__binding-selector')
            .text(selector)
            .attr('title', 'Click to highlight element')
            .on('click', function(e) {
                e.stopPropagation();
                _highlightBindingElement(binding);
            })
            .appendTo(header);

        var badges = D.create('span')
            .classAdd('funky-debug__binding-badges')
            .appendTo(header);

        if (binding.loading) {
            D.create('span')
                .classAdd('funky-debug__badge', 'funky-debug__badge--loading')
                .text('⏳ Loading')
                .appendTo(badges);
        }

        if (binding.error) {
            D.create('span')
                .classAdd('funky-debug__badge', 'funky-debug__badge--error')
                .text('❌ Error')
                .appendTo(badges);
        }

        if (binding.paused) {
            D.create('span')
                .classAdd('funky-debug__badge', 'funky-debug__badge--paused')
                .text('⏸ Paused')
                .appendTo(badges);
        }

        var content = D.create('div')
            .classAdd('funky-debug__binding-content')
            .attr('aria-hidden', 'true')
            .appendTo(node);

        // Recent changes section
        if (metrics.history.length > 0) {
            var changesWithDiff = metrics.history.filter(function(h) {
                return h.diff && h.diff.length > 0;
            });

            if (changesWithDiff.length > 0) {
                D.create('div')
                    .classAdd('funky-debug__binding-section-title')
                    .text('Recent Changes:')
                    .appendTo(content);

                var changesList = D.create('div')
                    .classAdd('funky-debug__binding-changes')
                    .appendTo(content);

                // Show last 5 changes with diffs
                var recentChanges = changesWithDiff.slice(-5).reverse();
                recentChanges.forEach(function(entry) {
                    var time = _formatTime(new Date(entry.timestamp));
                    entry.diff.forEach(function(change) {
                        var changeEl = D.create('div')
                            .classAdd('funky-debug__binding-change')
                            .classAdd('funky-debug__binding-change--' + change.type)
                            .appendTo(changesList);

                        D.create('time').text('[' + time + ']').appendTo(changeEl);
                        D.create('code').text(change.path + ': ').appendTo(changeEl);

                        if (change.type === 'add') {
                            D.create('span')
                                .classAdd('funky-debug__diff-new')
                                .text('+' + _formatDiffValue(change.newValue))
                                .appendTo(changeEl);
                        } else if (change.type === 'remove') {
                            D.create('span')
                                .classAdd('funky-debug__diff-old')
                                .text('-' + _formatDiffValue(change.oldValue))
                                .appendTo(changeEl);
                        } else {
                            D.create('span')
                                .classAdd('funky-debug__diff-old')
                                .text(_formatDiffValue(change.oldValue))
                                .appendTo(changeEl);
                            D.create('span').text(' → ').appendTo(changeEl);
                            D.create('span')
                                .classAdd('funky-debug__diff-new')
                                .text(_formatDiffValue(change.newValue))
                                .appendTo(changeEl);
                        }
                    });
                });
            }
        }

        D.create('div')
            .classAdd('funky-debug__binding-section-title')
            .text('Current Data:')
            .appendTo(content);

        var dataContainer = D.create('div')
            .classAdd('funky-debug__binding-data')
            .appendTo(content);

        _renderJsonTree(binding.data, dataContainer, 1);

        if (binding.options) {
            D.create('div')
                .classAdd('funky-debug__binding-section-title')
                .text('Options:')
                .appendTo(content);

            D.create('pre')
                .classAdd('funky-debug__binding-options')
                .text(JSON.stringify(binding.options, null, 2))
                .appendTo(content);
        }

        if (binding.error) {
            D.create('div')
                .classAdd('funky-debug__binding-section', 'funky-debug__binding-error')
                .html('<strong>Error:</strong><pre>' + 
                      JSON.stringify(binding.error, null, 2) + '</pre>')
                .appendTo(content);
        }
    }

    function _renderJsonTree(data, container, depth) {
        depth = depth || 0;
        var maxDepth = 5;

        if (depth > maxDepth) {
            D.create('span')
                .classAdd('funky-debug__node-value', 'funky-debug__node-value--truncated')
                .text('...')
                .appendTo(container);
            return;
        }

        if (data === null) {
            D.create('span')
                .classAdd('funky-debug__node-value', 'funky-debug__node-value--null')
                .text('null')
                .appendTo(container);
            return;
        }

        if (data === undefined) {
            D.create('span')
                .classAdd('funky-debug__node-value', 'funky-debug__node-value--null')
                .text('undefined')
                .appendTo(container);
            return;
        }

        var type = typeof data;

        if (type === 'string') {
            D.create('span')
                .classAdd('funky-debug__node-value', 'funky-debug__node-value--string')
                .text('"' + data + '"')
                .appendTo(container);
            return;
        }

        if (type === 'number') {
            D.create('span')
                .classAdd('funky-debug__node-value', 'funky-debug__node-value--number')
                .text(String(data))
                .appendTo(container);
            return;
        }

        if (type === 'boolean') {
            D.create('span')
                .classAdd('funky-debug__node-value', 'funky-debug__node-value--boolean')
                .text(String(data))
                .appendTo(container);
            return;
        }

        if (Array.isArray(data)) {
            var arrNode = D.create('div')
                .classAdd('funky-debug__node', 'funky-debug__node--array')
                .appendTo(container);

            D.create('span')
                .classAdd('funky-debug__node-bracket')
                .text('Array(' + data.length + ') [')
                .appendTo(arrNode);

            data.forEach(function(item, index) {
                var itemNode = D.create('div')
                    .classAdd('funky-debug__node-item')
                    .style({ marginLeft: (depth * 16) + 'px' })
                    .appendTo(arrNode);

                D.create('span')
                    .classAdd('funky-debug__node-key')
                    .text(index + ': ')
                    .appendTo(itemNode);

                _renderJsonTree(item, itemNode, depth + 1);
            });

            D.create('span')
                .classAdd('funky-debug__node-bracket')
                .text(']')
                .appendTo(arrNode);
            return;
        }

        if (type === 'object') {
            var objNode = D.create('div')
                .classAdd('funky-debug__node', 'funky-debug__node--object')
                .appendTo(container);

            var keys = Object.keys(data);
            D.create('span')
                .classAdd('funky-debug__node-bracket')
                .text('Object {')
                .appendTo(objNode);

            keys.forEach(function(key) {
                var propNode = D.create('div')
                    .classAdd('funky-debug__node-item')
                    .style({ marginLeft: (depth * 16) + 'px' })
                    .appendTo(objNode);

                D.create('span')
                    .classAdd('funky-debug__node-key')
                    .text(key + ': ')
                    .appendTo(propNode);

                _renderJsonTree(data[key], propNode, depth + 1);
            });

            D.create('span')
                .classAdd('funky-debug__node-bracket')
                .text('}')
                .appendTo(objNode);
        }
    }

    // =========================================================================
    // STATE PANEL HELPERS
    // =========================================================================

    function _renderStateItem(container, label, value) {
        D.create('div')
            .classAdd('funky-debug__state-item')
            .html('<span class="funky-debug__state-label">' + label + ':</span> ' +
                  '<span class="funky-debug__state-value">' + value + '</span>')
            .appendTo(container);
    }

    function _renderCollapsibleList(container, title, items, renderFn) {
        var listSection = D.create('div')
            .classAdd('funky-debug__collapsible')
            .appendTo(container);

        D.create('div')
            .classAdd('funky-debug__collapsible-header')
            .html('<span class="funky-debug__node-toggle">▶</span> ' + title)
            .on('click', function() {
                var content = listSection.one('.funky-debug__collapsible-content');
                var isExpanded = content.attr('aria-hidden') === 'false';
                content.attr('aria-hidden', isExpanded ? 'true' : 'false');
                listSection.one('.funky-debug__node-toggle').text(isExpanded ? '▶' : '▼');
            })
            .appendTo(listSection);

        var content = D.create('div')
            .classAdd('funky-debug__collapsible-content')
            .attr('aria-hidden', 'true')
            .appendTo(listSection);

        var ul = D.create('ul')
            .classAdd('funky-debug__state-list')
            .appendTo(content);

        items.forEach(function(item) {
            D.create('li')
                .html(renderFn(item))
                .appendTo(ul);
        });
    }

    function _getElementSelector(element) {
        if (!element) return '(no element)';
        
        var selector = element.tagName ? element.tagName.toLowerCase() : 'element';
        if (element.id) {
            selector += '#' + element.id;
        } else if (element.className && typeof element.className === 'string') {
            var classes = element.className.split(' ').filter(Boolean).slice(0, 2);
            if (classes.length > 0) {
                selector += '.' + classes.join('.');
            }
        }
        return selector;
    }

    function _highlightElement(element) {
        if (!element) return;

        var prev = document.querySelector('.funky-debug-highlight');
        if (prev) prev.classList.remove('funky-debug-highlight');

        element.classList.add('funky-debug-highlight');

        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setTimeout(function() {
            element.classList.remove('funky-debug-highlight');
        }, 2000);
    }

    // =========================================================================
    // CHILD FRAMES STATE
    // =========================================================================

    function _renderChildFramesState(container) {
        // Only render if we have child frames
        if (!_hasChildFrames()) return;

        var section = D.create('div')
            .classAdd('funky-debug__state-section')
            .appendTo(container);

        var frameCount = 0;
        for (var key in _childFrames) {
            if (_childFrames.hasOwnProperty(key)) {
                frameCount++;
            }
        }

        D.create('div')
            .classAdd('funky-debug__tree-header')
            .text('🖼️ Child Frames (' + frameCount + ' connected)')
            .appendTo(section);

        for (var frameId in _childFrames) {
            if (!_childFrames.hasOwnProperty(frameId)) continue;

            var frame = _childFrames[frameId];
            var frameNode = D.create('div')
                .classAdd('funky-debug__frame-info')
                .appendTo(section);

            var header = D.create('div')
                .classAdd('funky-debug__frame-header')
                .appendTo(frameNode);

            D.create('span')
                .classAdd('funky-debug__node-toggle')
                .text('▶')
                .on('click', function() {
                    var content = this.parentNode.parentNode.querySelector('.funky-debug__frame-content');
                    var isExpanded = content.getAttribute('aria-hidden') === 'false';
                    content.setAttribute('aria-hidden', isExpanded ? 'true' : 'false');
                    this.textContent = isExpanded ? '▶' : '▼';
                })
                .appendTo(header);

            D.create('code')
                .classAdd('funky-debug__frame-id')
                .text(frameId)
                .appendTo(header);

            // Connection status indicator
            var timeSinceActivity = Date.now() - frame.lastActivity;
            var statusClass = timeSinceActivity < 5000 ? 'active' : 
                              timeSinceActivity < 30000 ? 'idle' : 'stale';

            D.create('span')
                .classAdd('funky-debug__frame-status', 'funky-debug__frame-status--' + statusClass)
                .text(statusClass === 'active' ? '●' : statusClass === 'idle' ? '○' : '◌')
                .attr('title', statusClass)
                .appendTo(header);

            var content = D.create('div')
                .classAdd('funky-debug__frame-content')
                .attr('aria-hidden', 'true')
                .appendTo(frameNode);

            // Frame URL
            D.create('div')
                .classAdd('funky-debug__state-item')
                .html('<strong>URL:</strong> ' + (frame.url || 'unknown'))
                .appendTo(content);

            // Connected time
            var connectedAgo = Math.round((Date.now() - frame.connectedAt) / 1000);
            D.create('div')
                .classAdd('funky-debug__state-item')
                .html('<strong>Connected:</strong> ' + connectedAgo + 's ago')
                .appendTo(content);

            // Last activity
            var activityAgo = Math.round(timeSinceActivity / 1000);
            D.create('div')
                .classAdd('funky-debug__state-item')
                .html('<strong>Last activity:</strong> ' + activityAgo + 's ago')
                .appendTo(content);

            // State from child frame
            if (frame.state) {
                if (frame.state.spa) {
                    D.create('div')
                        .classAdd('funky-debug__state-item')
                        .html('<strong>SPA Page:</strong> ' + (frame.state.spa.currentPage || 'none'))
                        .appendTo(content);
                }

                if (frame.state.pages) {
                    D.create('div')
                        .classAdd('funky-debug__state-item')
                        .html('<strong>Active Page:</strong> ' + (frame.state.pages.activePage || 'none'))
                        .appendTo(content);
                }

                if (frame.state.bindings && frame.state.bindings.length > 0) {
                    D.create('div')
                        .classAdd('funky-debug__state-item')
                        .html('<strong>Bindings:</strong> ' + frame.state.bindings.length + ' active')
                        .appendTo(content);
                }
            }

            // Refresh button
            D.create('button')
                .classAdd('funky-debug__frame-refresh')
                .text('🔄 Refresh State')
                .attr('data-frame-id', frameId)
                .on('click', function() {
                    var fid = this.getAttribute('data-frame-id');
                    _requestChildState(fid);
                })
                .appendTo(content);
        }
    }

    // =========================================================================
    // COMPONENTS PANEL
    // =========================================================================

    var _componentCategories = {
        Core: ['Dom', 'Events', 'PubSub', 'Storage', 'Keyboard', 'CSRF', 'Cache', 'Registry'],
        Navigation: ['SPA', 'Pages', 'Navigation', 'History'],
        Data: ['Api', 'LiveBinding', 'WebSocket', 'JobQueue', 'Channel', 'RequestQueue', 'SchemaAdapter'],
        UI: ['Modal', 'Toast', 'Tooltip', 'Popover', 'Tabs', 'Table', 'Accordion', 'Dropdown',
             'Collapse', 'Offcanvas', 'ScrollSpy', 'Carousel', 'Alert', 'Skeleton', 'EmptyState',
             'SlidePanel', 'MorphPanel', 'CommandPalette', 'NotificationCenter'],
        Forms: ['Forms', 'Validation', 'Mask', 'Signature', 'FormFieldRegistry', 'ComboBox', 'DatePicker'],
        Media: ['ImageViewer', 'FileUpload', 'MediaQuery', 'Video', 'Audio'],
        Utils: ['Debounce', 'Timing', 'FuzzySearch', 'Animate', 'Clipboard', 'IdleDetector',
                'Date', 'Timezone', 'Util', 'FocusManager', 'VDom', 'PointerTracker', 'SelectableList'],
        Realtime: ['Presence', 'TypingIndicator', 'Tour'],
        PWA: ['ServiceWorker'],
        Dev: ['Debug', 'A11yValidator', 'WIPOverlay', 'A11yEnhancer', 'Announce']
    };

    function _initComponentsPanel() {
        var panel = _panel.one('[data-panel="components"]');
        if (!panel.raw()) return;

        // Clear existing empty state
        panel.html('');

        // Toolbar
        var toolbar = D.create('div')
            .classAdd('funky-debug__toolbar')
            .appendTo(panel);

        D.create('button')
            .attr('data-action', 'refresh')
            .text('🔄 Refresh')
            .on('click', function() {
                _renderComponentsTree();
            })
            .appendTo(toolbar);

        D.create('button')
            .attr('data-action', 'expand-all')
            .text('➕ Expand All')
            .on('click', function() {
                _toggleAllCategories(true);
            })
            .appendTo(toolbar);

        D.create('button')
            .attr('data-action', 'collapse-all')
            .text('➖ Collapse All')
            .on('click', function() {
                _toggleAllCategories(false);
            })
            .appendTo(toolbar);

        // Tree container
        D.create('div')
            .classAdd('funky-debug__tree')
            .attr('data-components-tree', '')
            .appendTo(panel);

        // Initial render
        _renderComponentsTree();
    }

    function _renderComponentsTree() {
        var tree = _panel.one('[data-components-tree]');
        if (!tree.raw()) return;

        tree.html('');

        var allComponents = Funky.list ? Funky.list() : [];
        var totalCount = allComponents.length;

        // Header
        D.create('div')
            .classAdd('funky-debug__tree-header')
            .text('🧩 Funky Components (' + totalCount + ' registered)')
            .appendTo(tree);

        // Group by category
        var categorized = {};
        var uncategorized = [];

        allComponents.forEach(function(name) {
            var found = false;
            for (var category in _componentCategories) {
                if (_componentCategories[category].indexOf(name) !== -1) {
                    if (!categorized[category]) categorized[category] = [];
                    categorized[category].push(name);
                    found = true;
                    break;
                }
            }
            if (!found) {
                uncategorized.push(name);
            }
        });

        // Render categories
        var categoryOrder = ['Core', 'Navigation', 'Data', 'Realtime', 'UI', 'Forms', 'Media', 'Utils', 'PWA', 'Dev'];
        categoryOrder.forEach(function(category) {
            if (categorized[category] && categorized[category].length > 0) {
                _renderComponentCategory(category, categorized[category], tree);
            }
        });

        // Render Pages modules as a special section
        _renderPagesModulesSection(tree);

        // Render uncategorized
        if (uncategorized.length > 0) {
            _renderComponentCategory('Other', uncategorized, tree);
        }

        if (totalCount === 0) {
            D.create('div')
                .classAdd('funky-debug__empty')
                .html('<span class="funky-debug__empty-icon">🧩</span>' +
                      '<span>No components registered</span>')
                .appendTo(tree);
        }
    }

    function _renderComponentCategory(category, components, container) {
        var categoryNode = D.create('div')
            .classAdd('funky-debug__category')
            .attr('data-category', category)
            .appendTo(container);

        // Category header
        var header = D.create('div')
            .classAdd('funky-debug__category-header')
            .appendTo(categoryNode);

        D.create('span')
            .classAdd('funky-debug__node-toggle')
            .text('▼')
            .on('click', function() {
                var content = categoryNode.one('.funky-debug__category-content');
                var isExpanded = content.attr('aria-hidden') === 'false';
                content.attr('aria-hidden', isExpanded ? 'true' : 'false');
                this.textContent = isExpanded ? '▶' : '▼';
            })
            .appendTo(header);

        D.create('span')
            .classAdd('funky-debug__category-name')
            .text(category)
            .appendTo(header);

        D.create('span')
            .classAdd('funky-debug__category-count')
            .text('(' + components.length + ')')
            .appendTo(header);

        // Category content
        var content = D.create('div')
            .classAdd('funky-debug__category-content')
            .attr('aria-hidden', 'false')
            .appendTo(categoryNode);

        // Render each component
        components.sort().forEach(function(name) {
            _renderComponentNode(name, content);
        });
    }

    function _renderComponentNode(name, container) {
        var component = Funky[name];
        var node = D.create('div')
            .classAdd('funky-debug__component')
            .attr('data-component', name)
            .appendTo(container);

        // Component header
        var header = D.create('div')
            .classAdd('funky-debug__component-header')
            .appendTo(node);

        // Status indicator
        var status = _getComponentStatus(name, component);
        D.create('span')
            .classAdd('funky-debug__component-status')
            .classAdd('funky-debug__component-status--' + status.type)
            .attr('title', status.label)
            .text(status.icon)
            .appendTo(header);

        // Component name
        D.create('code')
            .classAdd('funky-debug__component-name')
            .text(name)
            .appendTo(header);

        // Instance count or extra info
        var info = _getComponentInfo(name, component);
        if (info) {
            D.create('span')
                .classAdd('funky-debug__component-info')
                .text(info)
                .appendTo(header);
        }

        // Expand button if debug() available
        if (component && typeof component.debug === 'function') {
            D.create('button')
                .classAdd('funky-debug__component-expand')
                .text('🔍')
                .attr('title', 'View debug info')
                .on('click', function(e) {
                    e.stopPropagation();
                    _toggleComponentDebug(name, node);
                })
                .appendTo(header);
        }
    }

    function _getComponentStatus(name, component) {
        if (!component) {
            return { type: 'missing', icon: '❌', label: 'Not loaded' };
        }

        // Special cases
        if (name === 'WebSocket' && component.debug) {
            try {
                var wsDebug = component.debug();
                if (wsDebug.status === 'connected') {
                    return { type: 'connected', icon: '🟢', label: 'Connected' };
                } else if (wsDebug.status === 'connecting') {
                    return { type: 'connecting', icon: '🟡', label: 'Connecting' };
                } else {
                    return { type: 'disconnected', icon: '⚪', label: 'Disconnected' };
                }
            } catch (e) {
                // Fall through
            }
        }

        return { type: 'loaded', icon: '✓', label: 'Loaded' };
    }

    function _getComponentInfo(name, component) {
        if (!component) return null;

        try {
            // LiveBinding - show binding count
            if (name === 'LiveBinding' && component._bindings) {
                var count = 0;
                component._bindings.forEach(function() { count++; });
                return '(' + count + ' bindings)';
            }

            // Table - show instance count
            if (name === 'Table' && component.getAllInstances) {
                var instances = component.getAllInstances();
                return '(' + Object.keys(instances).length + ' instances)';
            }

            // PubSub - show event count
            if (name === 'PubSub' && component.eventNames) {
                var events = component.eventNames();
                return '(' + events.length + ' events)';
            }

            // WebSocket - show channel count
            if (name === 'WebSocket' && component.debug) {
                var wsDebug = component.debug();
                if (wsDebug.channels) {
                    return '(' + wsDebug.channels.length + ' channels)';
                }
            }

            // Channel - show active channel count
            if (name === 'Channel' && typeof component.list === 'function') {
                var channels = component.list();
                return '(' + channels.length + ' active)';
            }
        } catch (e) {
            // Ignore errors
        }

        return null;
    }

    function _toggleComponentDebug(name, node) {
        var existing = node.one('.funky-debug__component-debug');

        if (existing.raw()) {
            existing.remove();
            return;
        }

        var component = Funky[name];
        if (!component || typeof component.debug !== 'function') return;

        try {
            var debugInfo = component.debug();
            var debugEl = D.create('div')
                .classAdd('funky-debug__component-debug')
                .appendTo(node);

            D.create('pre')
                .text(JSON.stringify(debugInfo, null, 2))
                .appendTo(debugEl);
        } catch (e) {
            D.create('div')
                .classAdd('funky-debug__component-debug', 'funky-debug__component-debug--error')
                .text('Error calling debug(): ' + e.message)
                .appendTo(node);
        }
    }

    function _toggleAllCategories(expand) {
        _panel.all('.funky-debug__category-content').each(function(content) {
            content.attr('aria-hidden', expand ? 'false' : 'true');
        });
        _panel.all('.funky-debug__category .funky-debug__node-toggle').each(function(toggle) {
            toggle.text(expand ? '▼' : '▶');
        });
    }

    // =========================================================================
    // PAGES MODULES SECTION
    // =========================================================================

    function _renderPagesModulesSection(container) {
        if (!Funky.Pages || typeof Funky.Pages.list !== 'function') return;

        var pages = Funky.Pages.list();
        if (pages.length === 0) return;

        var sectionNode = D.create('div')
            .classAdd('funky-debug__category', 'funky-debug__category--pages')
            .attr('data-category', 'PageModules')
            .appendTo(container);

        // Section header
        var header = D.create('div')
            .classAdd('funky-debug__category-header')
            .appendTo(sectionNode);

        D.create('span')
            .classAdd('funky-debug__node-toggle')
            .text('▶')
            .on('click', function() {
                var content = sectionNode.one('.funky-debug__category-content');
                var isExpanded = content.attr('aria-hidden') === 'false';
                content.attr('aria-hidden', isExpanded ? 'true' : 'false');
                this.textContent = isExpanded ? '▶' : '▼';
            })
            .appendTo(header);

        D.create('span')
            .classAdd('funky-debug__category-name')
            .html('📑 Page Modules')
            .appendTo(header);

        D.create('span')
            .classAdd('funky-debug__category-count')
            .text('(' + pages.length + ')')
            .appendTo(header);

        // Section content (collapsed by default)
        var content = D.create('div')
            .classAdd('funky-debug__category-content')
            .attr('aria-hidden', 'true')
            .appendTo(sectionNode);

        var activePage = typeof Funky.Pages.getActivePage === 'function' ? Funky.Pages.getActivePage() : null;

        pages.sort().forEach(function(pageId) {
            var isActive = pageId === activePage;
            var isManaged = typeof Funky.Pages.isManaged === 'function' && Funky.Pages.isManaged(pageId);
            var isCached = Funky.Pages.cache && typeof Funky.Pages.cache.has === 'function' && Funky.Pages.cache.has(pageId);

            var pageNode = D.create('div')
                .classAdd('funky-debug__page-module')
                .classAdd(isActive ? 'funky-debug__page-module--active' : '')
                .appendTo(content);

            // Status icon
            var statusIcon = isActive ? '🟢' : (isCached ? '💾' : '⚪');
            D.create('span')
                .classAdd('funky-debug__page-status')
                .text(statusIcon)
                .appendTo(pageNode);

            // Page ID
            D.create('code')
                .classAdd('funky-debug__page-id')
                .text(pageId)
                .appendTo(pageNode);

            // Badges
            var badges = D.create('span')
                .classAdd('funky-debug__page-badges')
                .appendTo(pageNode);

            if (isActive) {
                D.create('span')
                    .classAdd('funky-debug__badge', 'funky-debug__badge--success')
                    .text('active')
                    .appendTo(badges);
            }

            if (isManaged) {
                D.create('span')
                    .classAdd('funky-debug__badge')
                    .text('managed')
                    .appendTo(badges);
            }

            if (isCached) {
                D.create('span')
                    .classAdd('funky-debug__badge', 'funky-debug__badge--info')
                    .text('cached')
                    .appendTo(badges);
            }
        });
    }

    // =========================================================================
    // PERFORMANCE TRACKING
    // =========================================================================

    function _setupPerformanceTracking() {
        var pendingRequests = {};

        Funky.PubSub.on('funky:api:request', function(data) {
            var key = data.method + ':' + data.url;
            pendingRequests[key] = {
                url: data.url,
                method: data.method,
                startTime: Date.now()
            };
        });

        Funky.PubSub.on('funky:api:success', function(data) {
            var key = data.method + ':' + data.url;
            var pending = pendingRequests[key];
            if (pending) {
                var duration = Date.now() - pending.startTime;
                _recordApiMetric({
                    url: data.url,
                    method: data.method,
                    duration: duration,
                    status: 'success',
                    timestamp: Date.now()
                });
                delete pendingRequests[key];
            }
        });

        Funky.PubSub.on('funky:api:error', function(data) {
            var key = data.method + ':' + data.url;
            var pending = pendingRequests[key];
            if (pending) {
                var duration = Date.now() - pending.startTime;
                _recordApiMetric({
                    url: data.url,
                    method: data.method,
                    duration: duration,
                    status: 'error',
                    error: data.error,
                    timestamp: Date.now()
                });
                delete pendingRequests[key];
            }
        });
    }

    function _recordApiMetric(metric) {
        _apiMetrics.push(metric);
        _pruneOldMetrics();

        if (_visible && _activeTab === 'perf') {
            _renderPerformancePanel();
        }
    }

    function _pruneOldMetrics() {
        var cutoff = Date.now() - _metricsWindow;

        _apiMetrics = _apiMetrics.filter(function(m) {
            return m.timestamp > cutoff;
        });

        _timerHistory = _timerHistory.filter(function(t) {
            return t.timestamp > cutoff;
        });
    }

    // =========================================================================
    // PERFORMANCE PANEL
    // =========================================================================

    function _initPerformancePanel() {
        var panel = _panel.one('[data-panel="perf"]');
        if (!panel.raw()) return;

        panel.html('');

        // Toolbar
        var toolbar = D.create('div')
            .classAdd('funky-debug__toolbar')
            .appendTo(panel);

        D.create('button')
            .attr('data-action', 'refresh')
            .text('🔄 Refresh')
            .on('click', function() {
                _renderPerformancePanel();
            })
            .appendTo(toolbar);

        D.create('button')
            .attr('data-action', 'clear')
            .text('🗑 Clear')
            .on('click', function() {
                _apiMetrics = [];
                _timerHistory = [];
                _renderPerformancePanel();
            })
            .appendTo(toolbar);

        D.create('select')
            .attr('data-window', '')
            .html(
                '<option value="60000">Last 1 min</option>' +
                '<option value="300000" selected>Last 5 min</option>' +
                '<option value="900000">Last 15 min</option>' +
                '<option value="3600000">Last 1 hour</option>'
            )
            .on('change', function() {
                _metricsWindow = parseInt(this.value, 10);
                _pruneOldMetrics();
                _renderPerformancePanel();
            })
            .appendTo(toolbar);

        // Content container
        D.create('div')
            .classAdd('funky-debug__perf-content')
            .attr('data-perf-content', '')
            .appendTo(panel);

        _renderPerformancePanel();
    }

    function _renderPerformancePanel() {
        var content = _panel.one('[data-perf-content]');
        if (!content.raw()) return;

        content.html('');

        _renderApiMetrics(content);
        _renderCustomTimers(content);
        _renderSlowRequests(content);
    }

    function _renderApiMetrics(container) {
        var section = D.create('div')
            .classAdd('funky-debug__perf-section')
            .appendTo(container);

        D.create('h3')
            .classAdd('funky-debug__perf-title')
            .text('📡 API Calls')
            .appendTo(section);

        _pruneOldMetrics();

        if (_apiMetrics.length === 0) {
            D.create('div')
                .classAdd('funky-debug__perf-empty')
                .text('No API calls recorded')
                .appendTo(section);
            return;
        }

        var total = _apiMetrics.length;
        var errors = _apiMetrics.filter(function(m) { return m.status === 'error'; }).length;
        var durations = _apiMetrics.map(function(m) { return m.duration; });
        var avgDuration = Math.round(durations.reduce(function(a, b) { return a + b; }, 0) / total);
        var maxDuration = Math.max.apply(null, durations);
        var minDuration = Math.min.apply(null, durations);

        // Stats grid
        var grid = D.create('div')
            .classAdd('funky-debug__perf-grid')
            .appendTo(section);

        _renderStatCard(grid, 'Total', total, '');
        _renderStatCard(grid, 'Avg', avgDuration, 'ms');
        _renderStatCard(grid, 'Min', minDuration, 'ms');
        _renderStatCard(grid, 'Max', maxDuration, 'ms', maxDuration > _slowThreshold ? 'warning' : '');
        _renderStatCard(grid, 'Errors', errors, '', errors > 0 ? 'error' : 'success');
        _renderStatCard(grid, 'Error Rate', total > 0 ? Math.round((errors / total) * 100) : 0, '%', errors > 0 ? 'error' : '');

        // Recent requests table
        D.create('h4')
            .classAdd('funky-debug__perf-subtitle')
            .text('Recent Requests')
            .appendTo(section);

        var table = D.create('table')
            .classAdd('funky-debug__perf-table')
            .appendTo(section);

        D.create('thead')
            .html('<tr><th>Time</th><th>Method</th><th>URL</th><th>Duration</th><th>Status</th></tr>')
            .appendTo(table);

        var tbody = D.create('tbody').appendTo(table);

        var recent = _apiMetrics.slice(-10).reverse();
        recent.forEach(function(metric) {
            var row = D.create('tr')
                .classAdd(metric.status === 'error' ? 'funky-debug__perf-row--error' : '')
                .classAdd(metric.duration > _slowThreshold ? 'funky-debug__perf-row--slow' : '')
                .appendTo(tbody);

            D.create('td').text(_formatTime(new Date(metric.timestamp))).appendTo(row);
            D.create('td').html('<code>' + metric.method + '</code>').appendTo(row);
            D.create('td').classAdd('funky-debug__perf-url').text(_truncateUrl(metric.url)).attr('title', metric.url).appendTo(row);
            D.create('td').text(metric.duration + 'ms').appendTo(row);
            D.create('td').text(metric.status === 'success' ? '✓' : '✗').appendTo(row);
        });
    }

    function _renderCustomTimers(container) {
        var section = D.create('div')
            .classAdd('funky-debug__perf-section')
            .appendTo(container);

        D.create('h3')
            .classAdd('funky-debug__perf-title')
            .text('⏱ Custom Timers')
            .appendTo(section);

        var activeTimers = Object.keys(_customTimers);
        if (activeTimers.length > 0) {
            D.create('h4')
                .classAdd('funky-debug__perf-subtitle')
                .text('Active')
                .appendTo(section);

            activeTimers.forEach(function(name) {
                var timer = _customTimers[name];
                var elapsed = Date.now() - timer.start;
                D.create('div')
                    .classAdd('funky-debug__perf-timer', 'funky-debug__perf-timer--active')
                    .html('<code>' + name + '</code> <span>' + elapsed + 'ms (running)</span>')
                    .appendTo(section);
            });
        }

        if (_timerHistory.length === 0 && activeTimers.length === 0) {
            D.create('div')
                .classAdd('funky-debug__perf-empty')
                .text('No custom timers recorded. Use Debug.startTimer(name) / Debug.endTimer(name)')
                .appendTo(section);
            return;
        }

        if (_timerHistory.length > 0) {
            D.create('h4')
                .classAdd('funky-debug__perf-subtitle')
                .text('Completed')
                .appendTo(section);

            var byName = {};
            _timerHistory.forEach(function(t) {
                if (!byName[t.name]) byName[t.name] = [];
                byName[t.name].push(t.duration);
            });

            for (var name in byName) {
                var durations = byName[name];
                var avg = Math.round(durations.reduce(function(a, b) { return a + b; }, 0) / durations.length);
                var last = durations[durations.length - 1];

                D.create('div')
                    .classAdd('funky-debug__perf-timer')
                    .html(
                        '<code>' + name + '</code> ' +
                        '<span>Last: ' + last + 'ms | Avg: ' + avg + 'ms (' + durations.length + ' runs)</span>'
                    )
                    .appendTo(section);
            }
        }
    }

    function _renderSlowRequests(container) {
        var slowRequests = _apiMetrics.filter(function(m) {
            return m.duration > _slowThreshold;
        });

        if (slowRequests.length === 0) return;

        var section = D.create('div')
            .classAdd('funky-debug__perf-section', 'funky-debug__perf-section--warning')
            .appendTo(container);

        D.create('h3')
            .classAdd('funky-debug__perf-title')
            .text('🐢 Slow Requests (>' + _slowThreshold + 'ms)')
            .appendTo(section);

        var byUrl = {};
        slowRequests.forEach(function(m) {
            var key = m.method + ' ' + m.url;
            if (!byUrl[key]) {
                byUrl[key] = { count: 0, totalDuration: 0, maxDuration: 0 };
            }
            byUrl[key].count++;
            byUrl[key].totalDuration += m.duration;
            byUrl[key].maxDuration = Math.max(byUrl[key].maxDuration, m.duration);
        });

        for (var key in byUrl) {
            var stats = byUrl[key];
            var avg = Math.round(stats.totalDuration / stats.count);

            D.create('div')
                .classAdd('funky-debug__perf-slow')
                .html(
                    '<code>' + key + '</code><br>' +
                    '<small>' + stats.count + ' calls | Avg: ' + avg + 'ms | Max: ' + stats.maxDuration + 'ms</small>'
                )
                .appendTo(section);
        }
    }

    function _renderStatCard(container, label, value, unit, type) {
        var card = D.create('div')
            .classAdd('funky-debug__stat-card')
            .appendTo(container);

        if (type) {
            card.classAdd('funky-debug__stat-card--' + type);
        }

        D.create('div')
            .classAdd('funky-debug__stat-value')
            .text(value + unit)
            .appendTo(card);

        D.create('div')
            .classAdd('funky-debug__stat-label')
            .text(label)
            .appendTo(card);
    }

    function _truncateUrl(url) {
        if (url.length <= 40) return url;
        return url.substring(0, 37) + '...';
    }

    // =========================================================================
    // EXPORT FUNCTIONALITY
    // =========================================================================

    function _generateReport(options) {
        var report = {
            meta: {
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                },
                funkyVersion: Funky.version || 'unknown'
            }
        };

        // Events
        if (options.includeEvents) {
            var events = _eventLog.slice(0, options.maxEvents);
            if (options.sanitize) {
                events = events.map(function(e) {
                    return {
                        id: e.id,
                        timestamp: e.timestamp,
                        time: e.time,
                        type: e.type,
                        event: e.event,
                        data: _sanitizeData(e.data)
                    };
                });
            }
            report.events = events;
        }

        // State (LiveBindings)
        if (options.includeState) {
            report.liveBindings = Debug.getBindings().map(function(b) {
                if (options.sanitize) {
                    return {
                        id: b.id,
                        selector: b.selector,
                        loading: b.loading,
                        error: b.error ? '[Error]' : null,
                        paused: b.paused,
                        dataKeys: b.data ? Object.keys(b.data) : []
                    };
                }
                return b;
            });
        }

        // Components
        if (options.includeComponents) {
            var components = Debug.getComponents();
            report.components = {
                count: components.length,
                list: components,
                details: {}
            };

            components.forEach(function(name) {
                var debugInfo = Debug.getComponentDebug(name);
                if (debugInfo) {
                    if (options.sanitize) {
                        report.components.details[name] = '[Debug info available]';
                    } else {
                        report.components.details[name] = debugInfo;
                    }
                }
            });
        }

        // Performance
        if (options.includePerformance) {
            var metrics = Debug.getApiMetrics();
            report.performance = {
                apiCalls: {
                    total: metrics.total,
                    errors: metrics.errors,
                    errorRate: Math.round(metrics.errorRate * 100) + '%',
                    avgDuration: metrics.avgDuration + 'ms',
                    maxDuration: metrics.maxDuration + 'ms'
                },
                timers: Debug.getTimerHistory().map(function(t) {
                    return {
                        name: t.name,
                        duration: t.duration + 'ms'
                    };
                })
            };

            if (!options.sanitize) {
                report.performance.recentRequests = metrics.requests.slice(-20).map(function(r) {
                    return {
                        url: r.url,
                        method: r.method,
                        duration: r.duration + 'ms',
                        status: r.status
                    };
                });
            }
        }

        return report;
    }

    function _sanitizeData(data) {
        if (!data) return data;

        var sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'cookie', 'session'];

        if (typeof data !== 'object') return data;

        var sanitized = Array.isArray(data) ? [] : {};

        for (var key in data) {
            if (!data.hasOwnProperty(key)) continue;

            var lowerKey = key.toLowerCase();
            var isSensitive = false;

            for (var i = 0; i < sensitiveKeys.length; i++) {
                if (lowerKey.indexOf(sensitiveKeys[i]) !== -1) {
                    isSensitive = true;
                    break;
                }
            }

            if (isSensitive) {
                sanitized[key] = '[REDACTED]';
            } else if (typeof data[key] === 'object' && data[key] !== null) {
                sanitized[key] = _sanitizeData(data[key]);
            } else {
                sanitized[key] = data[key];
            }
        }

        return sanitized;
    }

    function _formatReportAsText(report) {
        var lines = [];

        lines.push('================================================================================');
        lines.push('FUNKY DEBUG REPORT');
        lines.push('================================================================================');
        lines.push('');
        lines.push('Generated: ' + report.meta.timestamp);
        lines.push('URL: ' + report.meta.url);
        lines.push('User Agent: ' + report.meta.userAgent);
        lines.push('Viewport: ' + report.meta.viewport.width + 'x' + report.meta.viewport.height);
        lines.push('Funky Version: ' + report.meta.funkyVersion);
        lines.push('');

        // Components
        if (report.components) {
            lines.push('--------------------------------------------------------------------------------');
            lines.push('COMPONENTS (' + report.components.count + ' registered)');
            lines.push('--------------------------------------------------------------------------------');
            lines.push(report.components.list.join(', '));
            lines.push('');
        }

        // LiveBindings
        if (report.liveBindings) {
            lines.push('--------------------------------------------------------------------------------');
            lines.push('LIVE BINDINGS (' + report.liveBindings.length + ' active)');
            lines.push('--------------------------------------------------------------------------------');
            report.liveBindings.forEach(function(b) {
                var status = [];
                if (b.loading) status.push('loading');
                if (b.error) status.push('error');
                if (b.paused) status.push('paused');
                lines.push('  ' + b.id + ' -> ' + b.selector + (status.length ? ' [' + status.join(', ') + ']' : ''));
            });
            lines.push('');
        }

        // Performance
        if (report.performance) {
            lines.push('--------------------------------------------------------------------------------');
            lines.push('PERFORMANCE');
            lines.push('--------------------------------------------------------------------------------');
            lines.push('API Calls:');
            lines.push('  Total: ' + report.performance.apiCalls.total);
            lines.push('  Errors: ' + report.performance.apiCalls.errors + ' (' + report.performance.apiCalls.errorRate + ')');
            lines.push('  Avg Duration: ' + report.performance.apiCalls.avgDuration);
            lines.push('  Max Duration: ' + report.performance.apiCalls.maxDuration);

            if (report.performance.timers && report.performance.timers.length > 0) {
                lines.push('');
                lines.push('Custom Timers:');
                report.performance.timers.forEach(function(t) {
                    lines.push('  ' + t.name + ': ' + t.duration);
                });
            }
            lines.push('');
        }

        // Events
        if (report.events) {
            lines.push('--------------------------------------------------------------------------------');
            lines.push('RECENT EVENTS (' + report.events.length + ' captured)');
            lines.push('--------------------------------------------------------------------------------');
            report.events.slice(0, 50).forEach(function(e) {
                lines.push('[' + e.time + '] [' + e.type + '] ' + e.event);
                if (e.data) {
                    lines.push('    ' + JSON.stringify(e.data).substring(0, 100));
                }
            });
            if (report.events.length > 50) {
                lines.push('... and ' + (report.events.length - 50) + ' more events');
            }
            lines.push('');
        }

        lines.push('================================================================================');
        lines.push('END OF REPORT');
        lines.push('================================================================================');

        return lines.join('\n');
    }

    function _formatDateForFilename(date) {
        var y = date.getFullYear();
        var m = String(date.getMonth() + 1);
        var d = String(date.getDate());
        var h = String(date.getHours());
        var min = String(date.getMinutes());
        var s = String(date.getSeconds());

        // Manual zero-padding for ES5
        m = m.length < 2 ? '0' + m : m;
        d = d.length < 2 ? '0' + d : d;
        h = h.length < 2 ? '0' + h : h;
        min = min.length < 2 ? '0' + min : min;
        s = s.length < 2 ? '0' + s : s;

        return y + m + d + '-' + h + min + s;
    }

    function _downloadFile(filename, content, mimeType) {
        var blob = new Blob([content], { type: mimeType });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function _copyTextToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text);
        } else {
            // Fallback for older browsers
            var textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
            } catch (e) {
                console.warn('[Funky.Debug] Failed to copy to clipboard:', e);
            }
            document.body.removeChild(textarea);
        }
    }

    // =========================================================================
    // IFRAME/CHILD FRAME SUPPORT
    // =========================================================================

    function _setupIframeMessageHandler() {
        // Only set up if we're the top window (parent)
        if (window !== window.top) return;

        window.addEventListener('message', function(event) {
            var data = event.data;
            if (!data || data.source !== 'funky-debug-reporter') return;

            switch (data.type) {
                case 'debug:handshake':
                    _handleChildHandshake(data, event.source);
                    break;
                case 'debug:event':
                    _handleChildEvent(data);
                    break;
                case 'debug:state':
                    _handleChildState(data);
                    break;
            }
        });
    }

    function _handleChildHandshake(data, source) {
        var frameId = data.frameId;
        
        _childFrames[frameId] = {
            id: frameId,
            url: data.url,
            source: source,
            connectedAt: Date.now(),
            lastActivity: Date.now(),
            state: null
        };

        // Send acknowledgement
        try {
            source.postMessage({
                source: 'funky-debug-parent',
                type: 'debug:handshake-ack'
            }, '*');
        } catch (e) {
            // Source may be closed
        }

        console.log('[Funky.Debug] Child frame connected:', frameId);

        // Update frame filter dropdown
        _updateFrameFilterDropdown();

        // Update state panel if showing child frames
        if (_visible && _activeTab === 'state') {
            _renderStateTree();
        }

        // Request initial state
        _requestChildState(frameId);

        Funky.PubSub.emit('funky:debug:child:connected', { frameId: frameId, url: data.url });
    }

    function _handleChildEvent(data) {
        if (_eventsPaused) return;

        var entry = {
            id: 'evt_' + (++_eventIdCounter),
            timestamp: data.timestamp || Date.now(),
            time: _formatTime(new Date(data.timestamp || Date.now())),
            type: data.eventType,
            subType: null,
            event: data.eventName,
            data: data.eventData,
            frameId: data.frameId
        };

        // Update last activity
        if (_childFrames[data.frameId]) {
            _childFrames[data.frameId].lastActivity = Date.now();
        }

        _eventLog.unshift(entry);

        // Trim to max entries
        if (_eventLog.length > _config.maxLogEntries) {
            _eventLog = _eventLog.slice(0, _config.maxLogEntries);
        }

        // Update UI if visible and on events tab
        if (_visible && _activeTab === 'events') {
            // Check frame filter
            if (_frameFilter === 'all' || _frameFilter === data.frameId) {
                _renderEventEntry(entry);
            }
        }
    }

    function _handleChildState(data) {
        var frameId = data.frameId;
        if (!_childFrames[frameId]) return;

        _childFrames[frameId].state = {
            spa: data.spa,
            pages: data.pages,
            bindings: data.bindings,
            receivedAt: Date.now()
        };

        // Update state panel if visible
        if (_visible && _activeTab === 'state') {
            _renderStateTree();
        }
    }

    function _requestChildState(frameId) {
        var frame = _childFrames[frameId];
        if (!frame || !frame.source) return;

        try {
            frame.source.postMessage({
                source: 'funky-debug-parent',
                type: 'debug:request-state'
            }, '*');
        } catch (e) {
            // Source may be closed
        }
    }

    function _requestChildStates() {
        for (var frameId in _childFrames) {
            if (_childFrames.hasOwnProperty(frameId)) {
                _requestChildState(frameId);
            }
        }
    }

    function _hasChildFrames() {
        for (var key in _childFrames) {
            if (_childFrames.hasOwnProperty(key)) {
                return true;
            }
        }
        return false;
    }

    function _updateFrameFilterDropdown() {
        if (!_panel) return;

        var select = _panel.one('[data-frame-filter]');
        if (!select.raw()) return;

        // Show dropdown if we have child frames
        if (_hasChildFrames()) {
            select.style({ display: '' });
        }

        // Get current options
        var existingFrameIds = {};
        select.all('option').each(function(opt) {
            var val = opt.attr('value');
            if (val !== 'all' && val !== 'parent') {
                existingFrameIds[val] = true;
            }
        });

        // Add new frame options
        for (var frameId in _childFrames) {
            if (_childFrames.hasOwnProperty(frameId) && !existingFrameIds[frameId]) {
                var frame = _childFrames[frameId];
                var label = frameId;
                // Truncate URL for display
                if (frame.url) {
                    var path = frame.url.split('/').pop() || frame.url;
                    if (path.length > 20) {
                        path = path.substring(0, 17) + '...';
                    }
                    label = frameId + ' (' + path + ')';
                }
                D.create('option')
                    .attr('value', frameId)
                    .text(label)
                    .appendTo(select);
            }
        }
    }

    // =========================================================================
    // LIVEBINDING DEEP INSPECTION
    // =========================================================================

    function _setupBindingTracking() {
        if (!Funky.LiveBinding) return;

        // Wrap the internal update method if it exists
        // We'll also listen for binding events
        Funky.PubSub.on('funky:livebinding:updated', function(data) {
            if (data && data.id) {
                _trackBindingUpdate(data.id, data.oldData, data.newData);
            }
        });

        Funky.PubSub.on('funky:livebinding:rendered', function(data) {
            if (data && data.id) {
                var metrics = _getOrCreateBindingMetrics(data.id);
                metrics.renderCount++;
                metrics.lastRenderTime = Date.now();

                if (data.duration) {
                    metrics.history.push({
                        timestamp: Date.now(),
                        type: 'render',
                        duration: data.duration,
                        diff: []
                    });
                }

                // Trim history
                if (metrics.history.length > 50) {
                    metrics.history = metrics.history.slice(-50);
                }
            }
        });
    }

    function _getOrCreateBindingMetrics(bindingId) {
        if (!_bindingMetrics[bindingId]) {
            _bindingMetrics[bindingId] = {
                id: bindingId,
                renderCount: 0,
                lastRenderTime: null,
                history: [],
                watched: false
            };
        }
        return _bindingMetrics[bindingId];
    }

    function _trackBindingUpdate(bindingId, oldData, newData) {
        var metrics = _getOrCreateBindingMetrics(bindingId);
        var diff = _calculateDiff(oldData, newData);

        if (diff.length > 0) {
            metrics.history.push({
                timestamp: Date.now(),
                type: 'update',
                diff: diff,
                duration: null
            });

            // Trim history
            if (metrics.history.length > 50) {
                metrics.history = metrics.history.slice(-50);
            }

            // Emit for real-time updates
            Funky.PubSub.emit('funky:debug:binding:updated', {
                id: bindingId,
                diff: diff
            });
        }
    }

    function _calculateDiff(oldData, newData) {
        var changes = [];

        if (oldData === newData) return changes;
        if (oldData === null || oldData === undefined) {
            if (newData !== null && newData !== undefined) {
                changes.push({ type: 'set', path: '', oldValue: oldData, newValue: newData });
            }
            return changes;
        }
        if (newData === null || newData === undefined) {
            changes.push({ type: 'remove', path: '', oldValue: oldData, newValue: newData });
            return changes;
        }

        _diffObjects(oldData, newData, '', changes);
        return changes;
    }

    function _diffObjects(oldObj, newObj, path, changes) {
        var allKeys = {};

        // Collect all keys from both objects
        if (typeof oldObj === 'object' && oldObj !== null && !Array.isArray(oldObj)) {
            for (var key in oldObj) {
                if (oldObj.hasOwnProperty(key)) allKeys[key] = true;
            }
        }
        if (typeof newObj === 'object' && newObj !== null && !Array.isArray(newObj)) {
            for (var key in newObj) {
                if (newObj.hasOwnProperty(key)) allKeys[key] = true;
            }
        }

        // Handle arrays specially
        if (Array.isArray(oldObj) && Array.isArray(newObj)) {
            if (JSON.stringify(oldObj) !== JSON.stringify(newObj)) {
                changes.push({
                    type: 'change',
                    path: path || '(array)',
                    oldValue: oldObj,
                    newValue: newObj
                });
            }
            return;
        }

        // Handle primitives
        if (typeof oldObj !== 'object' || typeof newObj !== 'object') {
            if (oldObj !== newObj) {
                changes.push({
                    type: 'change',
                    path: path,
                    oldValue: oldObj,
                    newValue: newObj
                });
            }
            return;
        }

        for (var k in allKeys) {
            if (!allKeys.hasOwnProperty(k)) continue;

            var fullPath = path ? path + '.' + k : k;
            var oldVal = oldObj ? oldObj[k] : undefined;
            var newVal = newObj ? newObj[k] : undefined;

            if (oldVal === undefined && newVal !== undefined) {
                changes.push({ type: 'add', path: fullPath, newValue: newVal });
            } else if (oldVal !== undefined && newVal === undefined) {
                changes.push({ type: 'remove', path: fullPath, oldValue: oldVal });
            } else if (typeof oldVal !== typeof newVal) {
                changes.push({ type: 'change', path: fullPath, oldValue: oldVal, newValue: newVal });
            } else if (typeof oldVal === 'object' && oldVal !== null) {
                _diffObjects(oldVal, newVal, fullPath, changes);
            } else if (oldVal !== newVal) {
                changes.push({ type: 'change', path: fullPath, oldValue: oldVal, newValue: newVal });
            }
        }
    }

    function _highlightBindingElement(binding) {
        var element = binding.element;
        if (!element) return;

        // Remove existing highlights
        var existing = document.querySelectorAll('.funky-debug-binding-highlight');
        for (var i = 0; i < existing.length; i++) {
            existing[i].parentNode.removeChild(existing[i]);
        }

        // Create overlay
        var rect = element.getBoundingClientRect();
        var overlay = D.create('div')
            .classAdd('funky-debug-binding-highlight')
            .style({
                position: 'fixed',
                top: rect.top + 'px',
                left: rect.left + 'px',
                width: rect.width + 'px',
                height: rect.height + 'px',
                background: 'rgba(59, 130, 246, 0.2)',
                border: '2px solid #3b82f6',
                borderRadius: '4px',
                pointerEvents: 'none',
                zIndex: '99998'
            });

        // Add label
        D.create('div')
            .classAdd('funky-debug-binding-label')
            .text(binding.id)
            .style({
                position: 'absolute',
                top: '-24px',
                left: '0',
                padding: '2px 8px',
                background: '#3b82f6',
                color: 'white',
                fontSize: '11px',
                fontFamily: 'monospace',
                borderRadius: '4px 4px 0 0',
                whiteSpace: 'nowrap'
            })
            .appendTo(overlay);

        D.one('body').append(overlay);

        // Scroll into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Auto-remove after 3 seconds
        setTimeout(function() {
            overlay.style({ opacity: '0', transition: 'opacity 0.3s' });
            setTimeout(function() {
                if (overlay.raw() && overlay.raw().parentNode) {
                    overlay.remove();
                }
            }, 300);
        }, 3000);
    }

    function _updateWatchedBindingsCount() {
        var toolbar = _panel ? _panel.one('[data-watched-count]') : null;
        if (!toolbar || !toolbar.raw()) return;

        var count = 0;
        for (var id in _bindingMetrics) {
            if (_bindingMetrics.hasOwnProperty(id) && _bindingMetrics[id].watched) {
                count++;
            }
        }

        toolbar.text('📌 ' + count);
        toolbar.style({ display: count > 0 ? '' : 'none' });
    }

    function _formatDiffValue(value) {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (typeof value === 'string') {
            if (value.length > 30) {
                return '"' + value.substring(0, 27) + '..."';
            }
            return '"' + value + '"';
        }
        if (typeof value === 'object') {
            var str = JSON.stringify(value);
            if (str.length > 30) {
                return str.substring(0, 27) + '...';
            }
            return str;
        }
        return String(value);
    }

    // =========================================================================
    // REGISTER & AUTO-INIT
    // =========================================================================

    Funky.register('Debug', Debug);

    // Auto-initialize in development
    if (_isDevelopment()) {
        E.ready(function() {
            Debug.init();
        });
    }

})(window);

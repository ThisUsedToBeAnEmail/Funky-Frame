/**
 * Funky Test Runner UI
 *
 * Provides a modern UI for the FunkyTests test framework.
 * Uses Funky.Iframe to run tests in an isolated sandbox, preventing
 * test side effects from affecting the UI.
 *
 * @version 1.0.0
 */
(function(window) {
    'use strict';

    var FunkyTestRunner = {
        // State
        iframe: null,
        sandboxReady: false,
        testsLoaded: false,
        suiteData: [],
        testResults: [],
        failedTests: [],
        isRunning: false,
        currentFilter: '',

        // Suite tracking for UI
        suiteContainers: {},
        suiteStack: [],
        currentSuitePath: '',

        // TreeView instance for suite tree
        treeView: null,

        // File tags (loaded from manifest via API)
        fileTags: {},

        // Stats
        stats: {
            passed: 0,
            failed: 0,
            skipped: 0,
            total: 0,
            duration: 0
        },

        // Rerun state
        hasRerunFailed: false,
        isRerunning: false,
        rerunFailedList: [],

        // Assertion details storage (keyed by "suitePath > testName")
        testAssertionDetails: {},

        // Pending assertion data (queued until test element is rendered)
        pendingAssertions: {},

        // Timing
        startTime: null,
        clockUnsubscribe: null,
        stopwatchController: null,

        // Batched UI update state
        pendingUIUpdate: false,
        pendingTestResults: [],
        pendingTreeUpdates: {},

        // Loading spinner
        loadingSpinner: null,

        // DOM references
        els: {},

        // Message handler reference for cleanup
        messageHandler: null,

        // Track if initialized
        initialized: false,

        /**
         * Initialize the test runner UI
         */
        init: function() {
            var self = this;

            // Guard: only initialize if test runner container exists
            var testRunner = document.getElementById('testRunner');
            if (!testRunner) {
                return; // Not on test runner page
            }

            // Prevent double initialization
            if (this.initialized) {
                console.log('[TestRunner] Already initialized, skipping...');
                return;
            }

            console.log('[TestRunner] Initializing...');
            this.initialized = true;

            // Cache DOM elements
            this.els = {
                runAllBtn: document.getElementById('runAllBtn'),
                stopBtn: document.getElementById('stopBtn'),
                runFailedBtn: document.getElementById('runFailedBtn'),
                clearNewBtn: document.getElementById('clearNewBtn'),
                testFilter: document.getElementById('testFilter'),
                suiteTree: document.getElementById('suiteTree'),
                statsBar: document.getElementById('statsBar'),
                statTotal: document.getElementById('statTotal'),
                statPassed: document.getElementById('statPassed'),
                statFailed: document.getElementById('statFailed'),
                statSkipped: document.getElementById('statSkipped'),
                statDuration: document.getElementById('statDuration'),
                progressFill: document.getElementById('progressFill'),
                progressText: document.getElementById('progressText'),
                testResults: document.getElementById('testResults'),
                emptyState: document.getElementById('emptyState'),
                errorPanel: document.getElementById('errorPanel'),
                errorTestName: document.getElementById('errorTestName'),
                errorMessage: document.getElementById('errorMessage'),
                errorStack: document.getElementById('errorStack'),
                closeErrorPanel: document.getElementById('closeErrorPanel'),
                // Current test panel
                currentTestPanel: document.getElementById('currentTestPanel'),
                currentSuiteName: document.getElementById('currentSuiteName'),
                currentTestName: document.getElementById('currentTestName'),
                // Sandbox container
                sandboxContainer: document.getElementById('sandboxContainer')
            };

            // Load file tags from server
            this.loadFileTags();

            // Bind events
            this.bindEvents();

            // Setup postMessage listener
            this.setupMessageListener();

            // Show loading spinner
            this.showLoadingSpinner();

            // Create sandbox iframe
            this.createSandbox();
        },

        // ═══════════════════════════════════════════════════════════
        // FILE TAGGING METHODS
        // ═══════════════════════════════════════════════════════════

        /**
         * Load file tags from server or manifest
         */
        loadFileTags: function() {
            var self = this;

            // First, load tags from manifest (TEST_FILES) as immediate fallback
            this.loadTagsFromManifest();

            // Then try to load from API for any dynamic updates
            fetch('/test-runner/tags')
                .then(function(response) { return response.json(); })
                .then(function(data) {
                    if (data.tags) {
                        // Merge API tags with manifest tags
                        Object.keys(data.tags).forEach(function(file) {
                            self.fileTags[file] = data.tags[file];
                        });
                        self.updateTagBadges();
                    }
                })
                .catch(function(err) {
                    // API not available - that's OK, we have manifest tags
                    console.log('[TestRunner] Using manifest tags (API unavailable)');
                });
        },

        /**
         * Load tags from TEST_FILES manifest
         */
        loadTagsFromManifest: function() {
            var testFiles = window.TEST_FILES || [];
            var self = this;

            testFiles.forEach(function(entry) {
                if (typeof entry === 'object' && entry.file && entry.tags) {
                    self.fileTags[entry.file] = entry.tags.slice(); // Clone array
                }
            });

            this.updateTagBadges();
        },

        /**
         * Check if a file has a specific tag
         */
        isFileTagged: function(filePath, tag) {
            tag = tag || 'new';
            var tags = this.fileTags[filePath];
            return tags && tags.indexOf(tag) !== -1;
        },

        /**
         * Tag a file as 'new'
         */
        tagFile: function(filePath) {
            var self = this;
            fetch('/test-runner/tag', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'file=' + encodeURIComponent(filePath) + '&tag=new'
            })
            .then(function(response) { return response.json(); })
            .then(function(data) {
                if (data.success) {
                    // Update local state
                    if (!self.fileTags[filePath]) {
                        self.fileTags[filePath] = [];
                    }
                    if (self.fileTags[filePath].indexOf('new') === -1) {
                        self.fileTags[filePath].push('new');
                    }
                    self.updateTagBadges();
                    if (Funky.Toast) {
                        Funky.Toast.success('Tagged as new', { duration: 2000 });
                    }
                } else {
                    console.error('[TestRunner] Tag failed:', data.error);
                }
            })
            .catch(function(err) {
                console.error('[TestRunner] Tag request failed:', err);
            });
        },

        /**
         * Remove 'new' tag from a file
         */
        untagFile: function(filePath) {
            var self = this;
            fetch('/test-runner/tag?file=' + encodeURIComponent(filePath) + '&tag=new', {
                method: 'DELETE'
            })
            .then(function(response) { return response.json(); })
            .then(function(data) {
                if (data.success) {
                    // Update local state
                    if (self.fileTags[filePath]) {
                        var idx = self.fileTags[filePath].indexOf('new');
                        if (idx !== -1) {
                            self.fileTags[filePath].splice(idx, 1);
                        }
                        if (self.fileTags[filePath].length === 0) {
                            delete self.fileTags[filePath];
                        }
                    }
                    self.updateTagBadges();
                    if (Funky.Toast) {
                        Funky.Toast.info('Tag removed', { duration: 2000 });
                    }
                } else {
                    console.error('[TestRunner] Untag failed:', data.error);
                }
            })
            .catch(function(err) {
                console.error('[TestRunner] Untag request failed:', err);
            });
        },

        /**
         * Clear all 'new' tags
         */
        clearAllNewTags: function() {
            var self = this;
            fetch('/test-runner/tags/new', { method: 'DELETE' })
            .then(function(response) { return response.json(); })
            .then(function(data) {
                if (data.success) {
                    // Clear local state
                    Object.keys(self.fileTags).forEach(function(file) {
                        var idx = self.fileTags[file].indexOf('new');
                        if (idx !== -1) {
                            self.fileTags[file].splice(idx, 1);
                        }
                        if (self.fileTags[file].length === 0) {
                            delete self.fileTags[file];
                        }
                    });
                    self.updateTagBadges();
                    if (Funky.Toast) {
                        Funky.Toast.success('Cleared ' + data.cleared + ' tag(s)', { duration: 3000 });
                    }
                }
            })
            .catch(function(err) {
                console.error('[TestRunner] Clear tags failed:', err);
            });
        },

        /**
         * Update tag badges in the tree based on current fileTags state
         */
        updateTagBadges: function() {
            var self = this;

            // Guard: ensure suiteTree exists
            if (!this.els || !this.els.suiteTree) return;

            // Remove existing badges and buttons
            this.els.suiteTree.querySelectorAll('.test-tag-new, .btn-tag-add').forEach(function(el) {
                el.remove();
            });

            // Category mapping for file path to suite name conversion
            var categoryMap = {
                'core': 'Core',
                'components': 'Component',
                'integration': 'Integration',
                'a11y': 'A11y',
                'performance': 'Perf',
                'visual': 'Visual',
                'e2e': 'E2E',
                'pwa': 'PWA'
            };

            // Get all file paths from TEST_FILES
            var testFiles = window.TEST_FILES || [];
            testFiles.forEach(function(entry) {
                var filePath = typeof entry === 'string' ? entry : entry.file;
                var isTagged = self.isFileTagged(filePath, 'new');

                // Convert file path to expected suite name
                // e.g., '/assets/js/dev/tests/components/tour.test.js' -> 'Funky.Component.Tour'
                // Also handles: '/assets/js/dev/tests/visual/empty-state.visual.test.js' -> 'Funky.Visual.EmptyState'
                var match = filePath.match(/\/tests\/(core|components|integration|a11y|performance|visual|e2e|pwa)\/([^\/]+?)(?:\.(visual|a11y|perf|e2e|integration))?\.test\.js$/);
                if (!match) return;

                var category = match[1];
                var name = match[2];
                // If file has category suffix (e.g., .visual.test.js), it's redundant with folder - ignore it
                var funkyCategory = categoryMap[category] || category;
                var pascalName = name.split('-').map(function(part) {
                    return part.charAt(0).toUpperCase() + part.slice(1);
                }).join('');

                // Handle special cases where test suite names don't follow convention
                var specialCases = {
                    'websocket': 'WebSocket'  // WebSocket has capital S
                };

                var suiteName;
                if (name in specialCases) {
                    if (specialCases[name] === null) {
                        // No category prefix
                        suiteName = 'Funky.' + pascalName;
                    } else {
                        suiteName = 'Funky.' + funkyCategory + '.' + specialCases[name];
                    }
                } else {
                    suiteName = 'Funky.' + funkyCategory + '.' + pascalName;
                }

                // TreeView uses data-node-id for node identification
                var node = self.els.suiteTree.querySelector('[data-node-id="' + suiteName + '"]');
                if (!node) return;

                // Store the file path on the node for filtering
                node.setAttribute('data-file', filePath);

                // TreeView uses .tree-view-label for the label element
                var label = node.querySelector('.tree-view-label');
                if (!label) return;

                // Find the row element to insert badges after the label
                var row = node.querySelector('.tree-view-row');
                if (!row) return;

                // Add NEW badge if tagged
                if (isTagged) {
                    var badge = document.createElement('span');
                    badge.className = 'test-tag-new';
                    badge.textContent = 'NEW';
                    badge.title = 'Click to remove tag';
                    badge.onclick = function(e) {
                        e.stopPropagation();
                        self.untagFile(filePath);
                    };
                    row.appendChild(badge);
                } else {
                    // Add tag button (shown on hover)
                    var tagBtn = document.createElement('button');
                    tagBtn.className = 'btn-tag-add';
                    tagBtn.innerHTML = '<i class="fas fa-plus"></i>';
                    tagBtn.title = 'Tag as new';
                    tagBtn.onclick = function(e) {
                        e.stopPropagation();
                        self.tagFile(filePath);
                    };
                    row.appendChild(tagBtn);
                }
            });

            // Update Clear All button visibility
            this.updateClearAllButton();
        },

        /**
         * Show/hide Clear All New button based on whether there are any new tags
         */
        updateClearAllButton: function() {
            if (!this.els.clearNewBtn) return;

            var hasNewTags = Object.keys(this.fileTags).some(function(file) {
                return this.fileTags[file] && this.fileTags[file].indexOf('new') !== -1;
            }, this);

            this.els.clearNewBtn.style.display = hasNewTags ? '' : 'none';
        },

        /**
         * Show full-page loading spinner
         */
        showLoadingSpinner: function() {
            if (typeof Funky !== 'undefined' && Funky.Spinner) {
                this.loadingSpinner = Funky.Spinner.overlay({
                    style: 'border',
                    size: 'lg',
                    text: 'Loading tests...',
                    variant: 'primary'
                });
            }
        },

        /**
         * Hide loading spinner
         */
        hideLoadingSpinner: function() {
            if (this.loadingSpinner) {
                this.loadingSpinner.hide();
                this.loadingSpinner = null;
            } else if (typeof Funky !== 'undefined' && Funky.Spinner) {
                Funky.Spinner.hideOverlay();
            }
        },

        /**
         * Create the sandbox iframe using Funky.Iframe
         */
        createSandbox: function() {
            var self = this;

            if (!this.els.sandboxContainer) {
                console.error('[TestRunner] Sandbox container not found');
                return;
            }

            this.updateProgressText('Creating sandbox...');

            // Add cache-busting timestamp to prevent stale cached content
            var sandboxUrl = '/test-runner/sandbox?_cb=' + Date.now();

            // Use Funky.Iframe in embed mode
            // Note: We use our own message listener (setupMessageListener) instead of onMessage
            // to avoid duplicate message handling
            this.iframe = Funky.Iframe.create(this.els.sandboxContainer, {
                src: sandboxUrl,
                mode: 'embed',
                width: '100%',
                height: '100%',
                autoResize: false,
                sandbox: 'allow-scripts allow-same-origin',
                loading: 'eager',
                onLoad: function() {
                    console.log('[TestRunner] Sandbox iframe loaded');
                },
                onError: function(iframe, error) {
                    console.error('[TestRunner] Sandbox error:', error);
                    self.updateProgressText('Sandbox error');
                }
            });
        },

        /**
         * Destroy the sandbox iframe
         */
        destroySandbox: function() {
            if (this.iframe) {
                console.log('[TestRunner] Destroying sandbox...');
                this.iframe.destroy();
                this.iframe = null;
                this.sandboxReady = false;
                this.testsLoaded = false;
            }
        },

        /**
         * Rebuild the sandbox (destroy and create fresh)
         */
        rebuildSandbox: function() {
            var self = this;
            this.destroySandbox();

            // Small delay to ensure cleanup is complete
            setTimeout(function() {
                self.createSandbox();
            }, 100);
        },

        /**
         * Setup message listener for sandbox communication
         */
        setupMessageListener: function() {
            var self = this;

            // Store handler reference for cleanup
            this.messageHandler = function(event) {
                // Validate origin
                if (event.origin !== window.location.origin) {
                    return;
                }

                var data;
                try {
                    data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                } catch (e) {
                    return;
                }

                if (data && data.action) {
                    self.handleSandboxMessage(data);
                }
            };

            window.addEventListener('message', this.messageHandler);
        },

        /**
         * Handle messages from sandbox iframe
         */
        handleSandboxMessage: function(message) {
            var action = message.action;
            var data = message.data || {};

            // Preserve focus during test updates to maintain keyboard navigation
            var focusedElement = document.activeElement;
            var shouldRestoreFocus = this.isRunning &&
                focusedElement &&
                this.els.suiteTree &&
                this.els.suiteTree.contains(focusedElement);

            switch (action) {
                case 'debug':
                    console.log('[TestRunner] Sandbox debug:', data);
                    break;

                case 'sandboxReady':
                    this.onSandboxReady();
                    break;

                case 'loadProgress':
                    this.updateProgressText('Loading: ' + data.loaded + '/' + data.total);
                    break;

                case 'ready':
                    this.onTestsLoaded(data.suites);
                    break;

                case 'testsStart':
                    this.onTestsStart();
                    break;

                case 'suiteStart':
                    this.onSuiteStart(data);
                    break;

                case 'suiteEnd':
                    this.onSuiteEnd(data);
                    break;

                case 'testStart':
                    this.onTestStart(data);
                    break;

                case 'testPass':
                    this.onTestPass(data);
                    break;

                case 'testFail':
                    this.onTestFail(data);
                    break;

                case 'testSkip':
                    this.onTestSkip(data);
                    break;

                case 'testComplete':
                    this.onTestComplete(data);
                    break;

                case 'testsEnd':
                    this.onTestsEnd(data);
                    break;

                case 'error':
                    console.error('[TestRunner] Sandbox error:', data.message);
                    this.updateProgressText('Error: ' + data.message);
                    break;

                case 'focusParent':
                    // Sandbox requested focus return to parent window
                    // Focus a sensible element in the test runner UI
                    if (this.els.runAllBtn) {
                        this.els.runAllBtn.focus();
                    } else if (this.els.testFilter) {
                        this.els.testFilter.focus();
                    }
                    break;

                default:
                    console.log('[TestRunner] Unknown message:', action, data);
            }

            // Restore focus if it was in the tree and got lost during update
            if (shouldRestoreFocus && document.activeElement !== focusedElement) {
                focusedElement.focus({ preventScroll: true });
            }
        },

        /**
         * Send message to sandbox
         */
        sendToSandbox: function(action, data) {
            if (this.iframe) {
                this.iframe.postMessage({
                    action: action,
                    data: data || {}
                });
            }
        },

        /**
         * Called when sandbox is ready to receive commands
         */
        onSandboxReady: function() {
            var self = this;

            // Guard against duplicate calls
            if (this.sandboxReady) {
                console.log('[TestRunner] Sandbox already ready, ignoring duplicate');
                return;
            }

            console.log('[TestRunner] Sandbox ready, loading test files...');
            this.sandboxReady = true;
            this.updateProgressText('Loading test files...');

            var testFiles = window.TEST_FILES || [];

            // Filter files if #new tag filter is active
            var filesToLoad = testFiles;
            if (this.currentFilter === '#new') {
                filesToLoad = testFiles.filter(function(entry) {
                    var file = typeof entry === 'string' ? entry : entry.file;
                    // Always include utility files (non-test files like *-utils.js)
                    var isUtilityFile = !file.match(/\.test\.js$/);
                    return isUtilityFile || self.isFileTagged(file, 'new');
                });
                console.log('[TestRunner] Filtered to', filesToLoad.length, 'tagged files');
            }

            // Extract file paths from entries (no cache-busting - let service worker cache them)
            // Handle both string and object formats: '/path/file.js' or { file: '/path/file.js', tags: [...] }
            var files = filesToLoad.map(function(entry) {
                return typeof entry === 'string' ? entry : entry.file;
            });

            // Send test files to sandbox
            this.sendToSandbox('loadTests', {
                files: files
            });
        },

        /**
         * Called when tests are loaded and ready
         */
        onTestsLoaded: function(suites) {
            // Guard against duplicate calls
            if (this.testsLoaded) {
                console.log('[TestRunner] Tests already loaded, ignoring duplicate');
                return;
            }
            this.testsLoaded = true;

            // Hide loading spinner
            this.hideLoadingSpinner();

            console.log('[TestRunner] Tests loaded:', suites.length, 'suites');
            this.suiteData = suites;
            this.buildSuiteTree();

            // Update tag badges after tree is built
            this.updateTagBadges();

            // Count total tests
            var totalTests = this.countTests(suites);

            // Reapply current filter to the tree (important when sandbox is rebuilt)
            // This also updates the stats display with filtered count
            if (this.currentFilter) {
                this.filterTests(this.currentFilter);
            } else {
                // Only set total if no filter active
                this.stats.total = totalTests;
                this.els.statTotal.textContent = totalTests;
            }

            this.updateProgressText('Ready');
            console.log('[TestRunner] Ready - ' + suites.length + ' suites, ' + totalTests + ' tests');
        },

        /**
         * Build the suite tree from registered test suites using Funky.TreeView
         */
        buildSuiteTree: function() {
            var self = this;
            var suites = this.suiteData;

            if (suites.length === 0) {
                this.els.suiteTree.innerHTML = '<div class="test-results-empty"><p>No test suites found</p></div>';
                return;
            }

            // Destroy existing TreeView if any
            if (this.treeView) {
                this.treeView.destroy();
                this.treeView = null;
            }

            // Convert suite data to TreeView format
            var treeData = this.convertSuitesToTreeData(suites, '');

            // Create TreeView instance
            this.treeView = Funky.TreeView.init(this.els.suiteTree, {
                data: treeData,
                selectable: 'single',
                showSearch: false,  // We have our own filter input
                showGuides: true,
                indentSize: 16,
                animationDuration: 150,
                iconMap: {
                    folder: 'fa-folder',
                    folderOpen: 'fa-folder-open',
                    file: 'fa-file-code'
                },
                defaultIcon: 'file',
                expandedIds: this.getAllSuiteIds(suites),  // Start expanded
                onSelect: function(payload) {
                    // TreeView passes { nodes, ids, added, removed }
                    if (payload && payload.ids && payload.ids.length > 0) {
                        // Don't scroll during test runs to avoid disrupting focus
                        if (!self.isRunning) {
                            self.highlightSuite(payload.ids[0], true);  // true = from tree
                        }
                    }
                }
            });
        },

        /**
         * Convert test suites to TreeView data format
         */
        convertSuitesToTreeData: function(suites, parentPath) {
            var self = this;
            return suites.map(function(suite) {
                var suitePath = parentPath ? parentPath + ' > ' + suite.name : suite.name;
                var testCount = self.countSuiteTests(suite);
                var directTestCount = self.countDirectTests(suite);
                var hasChildren = suite.children && suite.children.length > 0;
                var isSkipped = suite.skip === true;

                // Build badge text
                var badgeText;
                if (hasChildren && directTestCount !== testCount) {
                    badgeText = directTestCount + '/' + testCount;
                } else {
                    badgeText = String(testCount);
                }

                var node = {
                    id: suitePath,
                    label: suite.name,
                    icon: hasChildren ? 'folder' : 'file',
                    badge: badgeText,
                    badgeVariant: isSkipped ? 'warning' : 'secondary',
                    data: {
                        suitePath: suitePath,
                        suiteName: suite.name,
                        testCount: testCount,
                        directTestCount: directTestCount,
                        file: suite.file,
                        skip: isSkipped,
                        status: isSkipped ? 'skipped' : 'pending'
                    }
                };

                if (hasChildren) {
                    node.children = self.convertSuitesToTreeData(suite.children, suitePath);
                }

                return node;
            });
        },

        /**
         * Get all suite IDs (paths) for initial expansion
         */
        getAllSuiteIds: function(suites, parentPath) {
            var self = this;
            var ids = [];
            suites.forEach(function(suite) {
                var suitePath = parentPath ? parentPath + ' > ' + suite.name : suite.name;
                ids.push(suitePath);
                if (suite.children && suite.children.length > 0) {
                    ids = ids.concat(self.getAllSuiteIds(suite.children, suitePath));
                }
            });
            return ids;
        },

        /**
         * Count tests in all suites
         */
        countTests: function(suites) {
            var self = this;
            var count = 0;

            suites.forEach(function(suite) {
                count += self.countSuiteTests(suite);
            });

            return count;
        },

        /**
         * Count tests in a single suite (including nested)
         */
        countSuiteTests: function(suite) {
            var self = this;
            var count = 0;

            if (suite.tests) {
                suite.tests.forEach(function(item) {
                    if (item.type === 'test') {
                        count++;
                    }
                });
            }

            if (suite.children) {
                suite.children.forEach(function(child) {
                    count += self.countSuiteTests(child);
                });
            }

            return count;
        },

        /**
         * Count only direct tests in a suite (not nested)
         */
        countDirectTests: function(suite) {
            var count = 0;

            if (suite.tests) {
                suite.tests.forEach(function(item) {
                    if (item.type === 'test') {
                        count++;
                    }
                });
            }

            return count;
        },

        /**
         * Highlight a suite in the tree and scroll to results
         * @param {string} suitePath - The suite path to highlight
         * @param {boolean} fromTree - If true, called from tree selection (don't re-select)
         */
        highlightSuite: function(suitePath, fromTree) {
            // Only select in tree if not called from tree selection (avoids loop)
            if (!fromTree && this.treeView) {
                this.treeView.selectNode(suitePath);
            }

            // Scroll to suite results if they exist (within results container, not page)
            var suiteHeader = this.els.testResults.querySelector('[data-suite-path="' + suitePath + '"]');
            if (suiteHeader) {
                // Scroll within the results container, not the whole page
                // This keeps the top nav/controls visible
                var container = this.els.testResults;
                var headerTop = suiteHeader.offsetTop - container.offsetTop;
                container.scrollTo({
                    top: headerTop - 10,  // Small offset from top
                    behavior: 'smooth'
                });

                // Add a brief highlight effect
                suiteHeader.classList.add('highlight-flash');
                setTimeout(function() {
                    suiteHeader.classList.remove('highlight-flash');
                }, 1000);
            }
        },

        /**
         * Bind event handlers
         */
        bindEvents: function() {
            var self = this;

            // Run All button
            if (this.els.runAllBtn) {
                this.els.runAllBtn.addEventListener('click', function() {
                    self.runAllTests();
                });
            }

            // Run Failed button
            if (this.els.runFailedBtn) {
                this.els.runFailedBtn.addEventListener('click', function() {
                    self.runFailedTests();
                });
            }

            // Stop button
            if (this.els.stopBtn) {
                this.els.stopBtn.addEventListener('click', function() {
                    self.stopTests();
                });
            }

            // Clear All New Tags button
            if (this.els.clearNewBtn) {
                this.els.clearNewBtn.addEventListener('click', function() {
                    self.clearAllNewTags();
                });
            }

            // Filter input
            if (this.els.testFilter) {
                this.els.testFilter.addEventListener('input', function() {
                    self.filterTests(this.value);
                });

                // Handle Enter/Escape for filter completion (mobile keyboard dismissal)
                this.els.testFilter.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        // Complete input and focus tree
                        if (Funky.FocusManager && Funky.FocusManager.completeInput) {
                            Funky.FocusManager.completeInput({
                                element: self.els.testFilter,
                                returnFocus: false,
                                focusTarget: self.els.suiteTree
                            });
                        } else {
                            self.els.testFilter.blur();
                            if (self.els.suiteTree) {
                                self.els.suiteTree.focus();
                            }
                        }
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        // Clear and complete input
                        if (Funky.FocusManager && Funky.FocusManager.completeInput) {
                            Funky.FocusManager.completeInput({
                                element: self.els.testFilter,
                                clearValue: true,
                                returnFocus: true
                            });
                        } else {
                            self.els.testFilter.value = '';
                            self.filterTests('');
                            self.els.testFilter.blur();
                        }
                    } else if (e.key === 'ArrowDown') {
                        // Move focus to tree
                        e.preventDefault();
                        if (self.els.suiteTree) {
                            self.els.suiteTree.focus();
                        }
                    }
                });
            }

            // Close error panel
            if (this.els.closeErrorPanel) {
                this.els.closeErrorPanel.addEventListener('click', function() {
                    self.hideErrorPanel();
                });
            }

            // Keyboard shortcuts
            document.addEventListener('keydown', function(e) {
                // Escape stops tests if running, otherwise closes error panel
                if (e.key === 'Escape') {
                    if (self.isRunning) {
                        self.stopTests();
                    } else {
                        self.hideErrorPanel();
                    }
                }

                // Ctrl+Enter runs all tests
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    self.runAllTests();
                }

                // Ctrl+Shift+F runs failed tests
                if (e.key === 'f' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
                    e.preventDefault();
                    self.runFailedTests();
                }
            });
        },

        /**
         * Get full suite path from stack
         */
        getSuitePath: function() {
            return this.suiteStack.map(function(s) { return s.name; }).join(' > ');
        },

        /**
         * Called when test run starts
         */
        onTestsStart: function() {
            var self = this;

            // Guard against duplicate calls while already running
            if (this.isRunning) {
                console.log('[TestRunner] Tests already running, ignoring duplicate start');
                return;
            }

            // For reruns, preserve the existing output
            var isRerun = this.isRerunning;

            if (!isRerun) {
                // Full run - reset everything
                this.resetStats();
                this.testResults = [];
                this.failedTests = [];
                this.suiteContainers = {};
                this.testAssertionDetails = {};
                this.pendingAssertions = {};

                // Update total count based on filter or running mode
                // For #new filter, sandbox only loads tagged files so countTests is accurate
                var totalTests = this.countTests(this.suiteData);
                console.log('[TestRunner] onTestsStart: totalTests=' + totalTests + ', suiteData.length=' + this.suiteData.length);
                if (this.isRunningFailed && this.pendingRunCount) {
                    // Running failed tests only - use the stored count
                    this.stats.total = this.pendingRunCount;
                    this.els.statTotal.textContent = this.pendingRunCount + '/' + totalTests;
                    // Clear the flags
                    this.isRunningFailed = false;
                    this.pendingRunCount = 0;
                } else if (this.currentFilter && this.currentFilter !== '#new') {
                    // Regular text filter - count matching tests
                    var matchingTests = this.countMatchingTests(this.suiteData, this.currentFilter.toLowerCase());
                    this.stats.total = matchingTests;
                    this.els.statTotal.textContent = matchingTests + '/' + totalTests;
                } else {
                    // No filter or #new filter - use actual loaded count
                    // For #new, files were filtered at load time so this is the correct count
                    this.stats.total = totalTests;
                    this.els.statTotal.textContent = totalTests;
                }

                // Clear results area
                this.els.testResults.innerHTML = '';

                // Reset tree node statuses - TreeView uses data-node-id and tree-view-row
                this.els.suiteTree.querySelectorAll('[data-node-id]').forEach(function(node) {
                    node.setAttribute('data-status', 'pending');
                    var row = node.querySelector('.tree-view-row');
                    if (row) {
                        row.classList.remove('running', 'passed', 'failed');
                    }
                    // Reset badge to secondary variant
                    var badge = node.querySelector('.tree-view-badge');
                    if (badge) {
                        badge.classList.remove('badge-success', 'badge-danger');
                        badge.classList.add('badge-secondary');
                    }
                });
            }

            this.isRunning = true;
            this.suiteStack = [];
            this.currentSuitePath = '';
            this.startTime = Date.now();

            if (this.els.emptyState) {
                this.els.emptyState.style.display = 'none';
            }

            // Reset progress
            this.els.progressFill.style.width = '0%';
            this.els.progressFill.classList.remove('has-failures');
            this.updateProgressText(isRerun ? 'Rerunning failed tests...' : 'Running tests...');

            // Disable buttons and show stop button
            this.els.runAllBtn.disabled = true;
            this.els.runFailedBtn.disabled = true;
            if (this.els.runFailedBtn) {
                this.els.runFailedBtn.style.display = 'none';
            }
            if (this.els.stopBtn) {
                this.els.stopBtn.disabled = false;
                this.els.stopBtn.style.display = '';
            }

            // Show current test panel
            if (this.els.currentTestPanel) {
                this.els.currentTestPanel.classList.remove('hidden');
                this.els.currentSuiteName.textContent = '';
                this.els.currentTestName.textContent = 'Starting...';
            }

            // Start stopwatch for live duration display with smooth milliseconds
            if (typeof Funky !== 'undefined' && Funky.Clock && Funky.Clock.stopwatch) {
                this.stopwatchController = Funky.Clock.stopwatch(this.els.statDuration, {
                    showMs: true,
                    msDigits: 2,
                    compact: true
                });
            }

            console.log('[TestRunner] Test run started');
        },

        /**
         * Called when a suite starts
         */
        onSuiteStart: function(data) {
            this.suiteStack.push({ name: data.name });
            this.currentSuitePath = this.getSuitePath();

            // Update tree node status - TreeView uses data-node-id
            var node = this.els.suiteTree.querySelector('[data-node-id="' + this.currentSuitePath + '"]');
            if (node) {
                node.setAttribute('data-status', 'running');
                var row = node.querySelector('.tree-view-row');
                if (row) {
                    row.classList.add('running');
                }
            }

            // Create or get suite container using full path
            this.getOrCreateSuiteContainer(data.name, this.currentSuitePath, data.indent);
        },

        /**
         * Get or create a container for a suite
         */
        getOrCreateSuiteContainer: function(suiteName, suitePath, indent) {
            var containerId = 'suite-' + this.generateId(suitePath);

            if (this.suiteContainers[containerId]) {
                return this.suiteContainers[containerId];
            }

            // Create suite wrapper
            var wrapper = document.createElement('div');
            wrapper.className = 'test-suite';
            wrapper.id = containerId;
            wrapper.style.marginLeft = (indent * 16) + 'px';

            // Create header
            var header = document.createElement('div');
            header.className = 'test-suite-header';
            header.setAttribute('data-suite', suiteName);
            header.setAttribute('data-suite-path', suitePath);
            header.innerHTML =
                '<span class="suite-icon"><i class="fas fa-chevron-down"></i></span>' +
                '<span class="suite-name">' + this.escapeHtml(suiteName) + '</span>' +
                '<span class="suite-stats" id="stats-' + containerId + '"></span>';

            // Create tests container
            var testsContainer = document.createElement('div');
            testsContainer.className = 'test-suite-tests';

            // Toggle collapse on header click
            header.addEventListener('click', function() {
                this.classList.toggle('collapsed');
                testsContainer.classList.toggle('collapsed');
            });

            wrapper.appendChild(header);
            wrapper.appendChild(testsContainer);
            this.els.testResults.appendChild(wrapper);

            this.suiteContainers[containerId] = {
                wrapper: wrapper,
                header: header,
                tests: testsContainer,
                suitePath: suitePath,
                passed: 0,
                failed: 0,
                skipped: 0
            };

            return this.suiteContainers[containerId];
        },

        /**
         * Called when a suite ends
         */
        onSuiteEnd: function(data) {
            var suitePath = this.getSuitePath();
            var containerId = 'suite-' + this.generateId(suitePath);
            var container = this.suiteContainers[containerId];

            if (container) {
                // Update stats display
                var statsEl = container.header.querySelector('.suite-stats');
                if (statsEl) {
                    var parts = [];
                    if (container.passed > 0) {
                        parts.push('<span class="passed">' + container.passed + ' ✓</span>');
                    }
                    if (container.failed > 0) {
                        parts.push('<span class="failed">' + container.failed + ' ✗</span>');
                    }
                    if (container.skipped > 0) {
                        parts.push('<span class="skipped">' + container.skipped + ' ⊘</span>');
                    }
                    statsEl.innerHTML = parts.join(' ');
                }

                // Update header status
                if (container.failed > 0) {
                    container.header.classList.add('has-failures');
                }

                // Hide empty suites
                if (container.passed === 0 && container.failed === 0 && container.skipped === 0) {
                    container.wrapper.style.display = 'none';
                }

                // Propagate counts to parent suite container
                if (this.suiteStack.length > 1) {
                    var parentPath = this.suiteStack.slice(0, -1).map(function(s) { return s.name; }).join(' > ');
                    var parentContainerId = 'suite-' + this.generateId(parentPath);
                    var parentContainer = this.suiteContainers[parentContainerId];
                    if (parentContainer) {
                        parentContainer.passed += container.passed;
                        parentContainer.failed += container.failed;
                        parentContainer.skipped += container.skipped;
                    }
                }
            }

            // Update tree node status and count - TreeView uses data-node-id
            var node = this.els.suiteTree.querySelector('[data-node-id="' + suitePath + '"]');
            if (node && container) {
                var hasFailed = container.failed > 0;
                node.setAttribute('data-status', hasFailed ? 'failed' : 'passed');

                var row = node.querySelector('.tree-view-row');
                if (row) {
                    row.classList.remove('running');
                    row.classList.add(hasFailed ? 'failed' : 'passed');
                }

                // Update the badge with pass/fail counts - TreeView uses .tree-view-badge
                var badge = node.querySelector('.tree-view-badge');
                if (badge) {
                    if (hasFailed) {
                        badge.innerHTML = '<span style="color: var(--pro-accent-success);">' + container.passed + '</span>/' +
                                         '<span style="color: var(--pro-accent-danger);">' + container.failed + '</span>';
                        badge.title = container.passed + ' passed, ' + container.failed + ' failed' +
                                     (container.skipped ? ', ' + container.skipped + ' skipped' : '');
                        badge.classList.add('badge-danger');
                        badge.classList.remove('badge-secondary', 'badge-success');
                    } else {
                        badge.textContent = container.passed + (container.skipped ? '/' + container.skipped : '');
                        badge.title = container.passed + ' passed' +
                                     (container.skipped ? ', ' + container.skipped + ' skipped' : '');
                        badge.classList.add('badge-success');
                        badge.classList.remove('badge-secondary', 'badge-danger');
                    }
                }
            }

            // Pop from stack after updating UI
            this.suiteStack.pop();
            this.currentSuitePath = this.getSuitePath();
        },

        /**
         * Update tree node count badge (called live during test runs)
         * This version is batched - actual DOM updates happen in flushPendingTreeUpdates
         */
        updateTreeNodeCount: function(suitePath, container) {
            // Queue for batched update
            this.pendingTreeUpdates[suitePath] = {
                passed: container.passed,
                failed: container.failed,
                skipped: container.skipped
            };
            this.scheduleUIUpdate();
        },

        /**
         * Update tree node count badge immediately (called from flush)
         */
        updateTreeNodeCountImmediate: function(suitePath, container) {
            if (!this.els.suiteTree) return;

            // TreeView uses data-node-id for node identification
            var node = this.els.suiteTree.querySelector('[data-node-id="' + suitePath + '"]');
            if (!node || !container) return;

            // TreeView uses .tree-view-badge for count display
            var badge = node.querySelector('.tree-view-badge');
            if (!badge) return;

            var hasFailed = container.failed > 0;

            if (hasFailed) {
                badge.innerHTML = '<span style="color: var(--pro-accent-success);">' + container.passed + '</span>/' +
                                 '<span style="color: var(--pro-accent-danger);">' + container.failed + '</span>';
                badge.title = container.passed + ' passed, ' + container.failed + ' failed' +
                             (container.skipped ? ', ' + container.skipped + ' skipped' : '');
                badge.classList.add('badge-danger');
                badge.classList.remove('badge-secondary', 'badge-success');
                node.setAttribute('data-status', 'failed');
            } else if (container.passed > 0 || container.skipped > 0) {
                badge.textContent = container.passed + (container.skipped ? '/' + container.skipped : '');
                badge.title = container.passed + ' passed' +
                             (container.skipped ? ', ' + container.skipped + ' skipped' : '');
                badge.classList.add('badge-success');
                badge.classList.remove('badge-secondary', 'badge-danger');
                node.setAttribute('data-status', 'running');
            }
        },

        /**
         * Called when a test starts running
         */
        onTestStart: function(data) {
            // Update current test panel
            if (this.els.currentTestPanel) {
                this.els.currentSuiteName.textContent = this.currentSuitePath;
                this.els.currentTestName.textContent = data.name;
            }
        },

        /**
         * Called when a test passes
         */
        onTestPass: function(data) {
            // Check if this is a rerun and the test was previously failed
            if (this.isRerunning) {
                var wasInFailedList = this.rerunFailedList.some(function(t) {
                    return t.name === data.name;
                });

                if (wasInFailedList) {
                    // Update stats: move from failed to passed (don't double count)
                    this.stats.failed--;
                    this.stats.passed++;

                    // Remove from failedTests array
                    var testName = data.name;
                    this.failedTests = this.failedTests.filter(function(t) {
                        return t.name !== testName;
                    });

                    // Show "-1" indicator on failed count
                    this.showFixedIndicator();

                    // Update the existing UI element instead of adding new one
                    this.updateTestResultToPassed(data.name);
                    this.updateUI();
                    return;
                }
            }

            // Normal pass handling
            this.stats.passed++;
            this.addTestResult({
                name: data.name,
                suitePath: this.currentSuitePath,
                status: 'passed',
                duration: data.duration
            });
            // Note: addTestResult calls scheduleUIUpdate which handles updateUI and updateProgress
        },

        /**
         * Called when a test fails
         */
        onTestFail: function(data) {
            // Check if this is a rerun and the test was already in the failed list
            if (this.isRerunning) {
                var alreadyInFailedList = this.rerunFailedList.some(function(t) {
                    return t.name === data.name;
                });

                if (alreadyInFailedList) {
                    // Test failed again during rerun - don't double count
                    // Just schedule UI update, stats.failed already accounts for this
                    this.scheduleUIUpdate();
                    return;
                }
            }

            this.stats.failed++;

            var result = {
                name: data.name,
                suitePath: this.currentSuitePath,
                status: 'failed',
                duration: data.duration,
                error: data.error
            };

            this.addTestResult(result);
            this.failedTests.push(result);

            this.els.progressFill.classList.add('has-failures');
            // Note: addTestResult calls scheduleUIUpdate which handles updateUI and updateProgress
        },

        /**
         * Called when a test is skipped
         */
        onTestSkip: function(data) {
            this.stats.skipped++;
            this.addTestResult({
                name: data.name,
                suitePath: this.currentSuitePath,
                status: 'skipped'
            });
            // Note: addTestResult calls scheduleUIUpdate which handles updateUI and updateProgress
        },

        /**
         * Called when a test completes with detailed assertion info
         */
        onTestComplete: function(data) {
            var key = this.currentSuitePath + ' > ' + data.name;
            this.testAssertionDetails[key] = {
                assertions: data.assertions || [],
                source: data.source,
                passed: data.passed,
                duration: data.duration,
                error: data.error
            };

            // Queue the assertion data to be applied when element is rendered
            // (element may not exist yet due to batched UI updates)
            this.pendingAssertions[key] = data;

            // Try to apply now (in case element already exists from previous render)
            this.updateTestResultWithAssertions(data.name, data);
        },

        /**
         * Update a test result element with assertion summary badge
         */
        updateTestResultWithAssertions: function(testName, data) {
            var self = this;

            // Find the test item element
            var testItems = this.els.testResults.querySelectorAll('.test-item');
            var testItem = null;

            for (var i = testItems.length - 1; i >= 0; i--) {
                var nameEl = testItems[i].querySelector('.test-name');
                if (nameEl && nameEl.textContent === testName) {
                    testItem = testItems[i];
                    break;
                }
            }

            if (!testItem || !data.assertions || data.assertions.length === 0) return;

            // Calculate assertion stats
            var passedCount = data.assertions.filter(function(a) { return a.passed; }).length;
            var totalCount = data.assertions.length;

            // Remove any existing badge
            var existingBadge = testItem.querySelector('.test-assertion-badge');
            if (existingBadge) existingBadge.remove();

            // Create assertion summary badge
            var badge = document.createElement('button');
            badge.className = 'test-assertion-badge';
            badge.classList.add(passedCount === totalCount ? 'all-passed' : 'has-failures');
            badge.innerHTML = '<span class="badge-count">' + passedCount + '/' + totalCount + '</span>';
            badge.title = passedCount + ' of ' + totalCount + ' assertions passed. Click to expand.';

            // Insert badge after duration
            var durationEl = testItem.querySelector('.test-duration');
            if (durationEl && durationEl.nextSibling) {
                testItem.insertBefore(badge, durationEl.nextSibling);
            } else if (durationEl) {
                testItem.appendChild(badge);
            }

            // Create expandable details panel (hidden by default)
            var detailsPanel = document.createElement('div');
            detailsPanel.className = 'test-assertion-details hidden';
            detailsPanel.id = 'details-' + this.generateId(this.currentSuitePath + '-' + testName);

            // Build details content
            detailsPanel.innerHTML = this.buildAssertionDetailsHTML(data);

            // Insert after test item
            testItem.after(detailsPanel);

            // Toggle on badge click
            badge.addEventListener('click', function(e) {
                e.stopPropagation();
                var isHidden = detailsPanel.classList.contains('hidden');
                detailsPanel.classList.toggle('hidden');
                badge.classList.toggle('expanded', isHidden);

                // Initialize SelectableList when first expanded
                if (isHidden && !detailsPanel.hasAttribute('data-sl-initialized')) {
                    self.initAssertionsList(detailsPanel);
                    detailsPanel.setAttribute('data-sl-initialized', 'true');
                }
            });
        },

        /**
         * Build HTML for assertion details panel
         */
        buildAssertionDetailsHTML: function(data) {
            var self = this;
            var html = '';

            // Source code section (using CodePreview if available)
            if (data.source) {
                html += '<div class="assertion-source-section">';
                html += '<div class="assertion-section-header">Test Source</div>';
                html += '<div class="assertion-source-container" data-source="' + this.escapeHtml(data.source) + '">';
                html += '<pre class="assertion-source-fallback"><code>' + this.formatTestSource(data.source) + '</code></pre>';
                html += '</div>';
                html += '</div>';
            }

            // Assertions list section
            html += '<div class="assertion-list-section">';
            html += '<div class="assertion-section-header">Assertions (' + (data.assertions ? data.assertions.length : 0) + ')</div>';
            html += '<div class="assertion-list" role="listbox" tabindex="0">';

            if (data.assertions && data.assertions.length > 0) {
                data.assertions.forEach(function(assertion, index) {
                    var icon = assertion.passed ? '<i class="fas fa-check"></i>' : '<i class="fas fa-times"></i>';
                    var statusClass = assertion.passed ? 'passed' : 'failed';

                    html += '<div class="assertion-item ' + statusClass + '" role="option" data-index="' + index + '">';
                    html += '<span class="assertion-icon">' + icon + '</span>';
                    // Show .not prefix for negated assertions
                    var matcherDisplay = assertion.negated ? '.not.' + (assertion.type || 'unknown') : (assertion.type || 'unknown');
                    html += '<span class="assertion-matcher">' + self.escapeHtml(matcherDisplay) + '</span>';
                    html += '<span class="assertion-values">';
                    html += '<span class="assertion-actual" title="Actual">Actual: ' + self.formatAssertionValue(assertion.actual) + '</span>';
                    // For negated assertions, show what we're checking against with "not"
                    if (assertion.expected !== undefined) {
                        var expectedDisplay = assertion.negated
                            ? 'not ' + self.formatAssertionValue(assertion.expected)
                            : self.formatAssertionValue(assertion.expected);
                        html += '<span class="assertion-expected" title="Expected">Expected: ' + expectedDisplay + '</span>';
                    }
                    html += '</span>';
                    html += '</div>';
                });
            } else {
                html += '<div class="assertion-empty">No assertions collected - ensure test-framework.js is up to date</div>';
            }

            html += '</div>';
            html += '</div>';

            return html;
        },

        /**
         * Initialize keyboard navigation for assertions list
         */
        initAssertionsList: function(panel) {
            var listEl = panel.querySelector('.assertion-list');
            if (!listEl) return;

            var items = listEl.querySelectorAll('.assertion-item');
            if (items.length === 0) return;

            var focusedIndex = -1;

            // Simple keyboard navigation without SelectableList
            listEl.addEventListener('keydown', function(e) {
                if (items.length === 0) return;

                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    focusedIndex = Math.min(focusedIndex + 1, items.length - 1);
                    updateFocus();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    focusedIndex = Math.max(focusedIndex - 1, 0);
                    updateFocus();
                } else if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (focusedIndex >= 0) {
                        copyAssertionDetails(items[focusedIndex]);
                    }
                }
            });

            function updateFocus() {
                items.forEach(function(item, i) {
                    item.setAttribute('aria-selected', i === focusedIndex ? 'true' : 'false');
                });
                if (focusedIndex >= 0) {
                    items[focusedIndex].scrollIntoView({ block: 'nearest' });
                }
            }

            function copyAssertionDetails(item) {
                var matcher = item.querySelector('.assertion-matcher');
                var actual = item.querySelector('.assertion-actual');
                var expected = item.querySelector('.assertion-expected');

                var text = (matcher ? matcher.textContent : '') + '\n' +
                           (actual ? actual.textContent : '') + '\n' +
                           (expected ? expected.textContent : '');

                if (navigator.clipboard) {
                    navigator.clipboard.writeText(text).then(function() {
                        if (typeof Funky !== 'undefined' && Funky.Toast) {
                            Funky.Toast.info('Copied to clipboard', { duration: 2000 });
                        }
                    });
                }
            }

            // Focus first item when list is focused
            listEl.addEventListener('focus', function() {
                if (focusedIndex < 0 && items.length > 0) {
                    focusedIndex = 0;
                    updateFocus();
                }
            });

            // Initialize CodePreview for source section if available
            var sourceContainer = panel.querySelector('.assertion-source-container');
            if (sourceContainer && typeof Funky !== 'undefined' && Funky.CodePreview) {
                var source = sourceContainer.getAttribute('data-source');
                if (source) {
                    // Clear fallback and use CodePreview.render (which calls setCode)
                    sourceContainer.innerHTML = '';
                    Funky.CodePreview.render(sourceContainer, this.formatTestSource(source), {
                        language: 'javascript',
                        lineNumbers: true,
                        showCopy: true,
                        collapsible: false,
                        maxHeight: 200
                    });
                }
            }
        },

        /**
         * Format test source code for display
         */
        formatTestSource: function(source) {
            if (!source) return '';

            // Remove function wrapper if present
            source = source
                .replace(/^function\s*\([^)]*\)\s*\{/, '')  // Remove function() {
                .replace(/\}$/, '')                         // Remove trailing }
                .replace(/^\s*\n/, '')                      // Remove leading newline
                .replace(/\n\s*$/, '');                     // Remove trailing newline

            // Dedent by finding minimum indentation
            var lines = source.split('\n');
            var minIndent = lines.reduce(function(min, line) {
                if (line.trim() === '') return min;
                var match = line.match(/^(\s*)/);
                var indent = match ? match[1].length : 0;
                return Math.min(min, indent);
            }, Infinity);

            if (minIndent > 0 && minIndent < Infinity) {
                lines = lines.map(function(line) {
                    return line.substring(minIndent);
                });
            }

            return lines.join('\n').trim();
        },

        /**
         * Format an assertion value for display
         */
        formatAssertionValue: function(value) {
            if (!value) return '<span class="value-undefined">undefined</span>';

            switch (value.type) {
                case 'undefined':
                    return '<span class="value-undefined">undefined</span>';
                case 'null':
                    return '<span class="value-null">null</span>';
                case 'function':
                    return '<span class="value-function">[Function: ' + this.escapeHtml(value.name || 'anonymous') + ']</span>';
                case 'element':
                    var desc = '&lt;' + value.tag + (value.id ? '#' + value.id : '') + '&gt;';
                    return '<span class="value-element">' + desc + '</span>';
                case 'regex':
                    return '<span class="value-regex">' + this.escapeHtml(value.value) + '</span>';
                case 'error':
                    return '<span class="value-error">' + this.escapeHtml(value.name + ': ' + value.message) + '</span>';
                case 'symbol':
                    return '<span class="value-symbol">' + this.escapeHtml(value.value) + '</span>';
                case 'object':
                    return '<span class="value-object">' + this.escapeHtml(String(value.value)) + '</span>';
                case 'value':
                default:
                    var v = value.value;
                    if (v === null) return '<span class="value-null">null</span>';
                    if (typeof v === 'string') return '<span class="value-string">"' + this.escapeHtml(v) + '"</span>';
                    if (typeof v === 'number') return '<span class="value-number">' + v + '</span>';
                    if (typeof v === 'boolean') return '<span class="value-boolean">' + v + '</span>';
                    if (Array.isArray(v)) {
                        var preview = JSON.stringify(v);
                        if (preview.length > 50) preview = preview.substring(0, 47) + '...';
                        return '<span class="value-array">' + this.escapeHtml(preview) + '</span>';
                    }
                    if (typeof v === 'object') {
                        var objPreview = JSON.stringify(v);
                        if (objPreview.length > 50) objPreview = objPreview.substring(0, 47) + '...';
                        return '<span class="value-object">' + this.escapeHtml(objPreview) + '</span>';
                    }
                    return '<span class="value-other">' + this.escapeHtml(String(v)) + '</span>';
            }
        },

        /**
         * Called when all tests complete
         */
        onTestsEnd: function(data) {
            var wasStopped = data.stopped === true;
            this.stats.duration = (data.endTime - data.startTime) / 1000;
            this.isRunning = false;
            this.startTime = null;

            // Stop the stopwatch and show final time
            if (this.stopwatchController) {
                this.stopwatchController.stop();
                this.stopwatchController = null;
            }

            // Legacy: Unsubscribe from clock tick if used
            if (this.clockUnsubscribe) {
                this.clockUnsubscribe();
                this.clockUnsubscribe = null;
            }

            // Hide current test panel
            if (this.els.currentTestPanel) {
                this.els.currentTestPanel.classList.add('hidden');
            }

            // Update UI - hide stop button and re-enable other buttons
            this.els.runAllBtn.disabled = false;
            this.els.runFailedBtn.disabled = this.stats.failed === 0;
            if (this.els.runFailedBtn) {
                // Show the button only if there are failures
                this.els.runFailedBtn.style.display = this.stats.failed > 0 ? '' : 'none';
            }
            if (this.els.stopBtn) {
                this.els.stopBtn.disabled = true;
                this.els.stopBtn.style.display = 'none';
            }

            this.updateUI();
            this.updateProgressText(wasStopped ? 'Stopped' : 'Complete');

            // Show toast notification
            if (typeof Funky !== 'undefined' && Funky.Toast) {
                if (wasStopped) {
                    var completed = data.passed + data.failed + data.skipped;
                    Funky.Toast.warning('Stopped after ' + completed + ' tests (' + data.passed + ' passed, ' + data.failed + ' failed)', {
                        title: 'Tests Stopped',
                        duration: 5000
                    });
                } else if (data.failed === 0) {
                    Funky.Toast.success('All ' + data.passed + ' tests passed!', {
                        title: 'Tests Complete',
                        duration: 5000
                    });
                } else {
                    Funky.Toast.error(data.failed + ' test(s) failed', {
                        title: 'Tests Complete',
                        duration: 8000
                    });
                }
            }

            console.log('[TestRunner] Test run ' + (wasStopped ? 'stopped' : 'complete') + ':', this.stats);

            // Sanity check: stats.failed should match failedTests.length
            if (this.stats.failed !== this.failedTests.length) {
                console.warn('[TestRunner] Stats mismatch: stats.failed=' + this.stats.failed +
                    ' but failedTests.length=' + this.failedTests.length);
            }

            // Log errors only summary for easy copy/paste
            if (this.failedTests.length > 0) {
                this.logErrorsSummary();
            }

            // Clear rerun state after rerun completes
            if (this.isRerunning) {
                this.isRerunning = false;
                this.rerunFailedList = [];

                // Show result of rerun
                if (this.stats.failed === 0) {
                    Funky.Toast.success('All previously failed tests now pass!', {
                        title: 'Rerun Complete',
                        duration: 5000
                    });
                    // Hide the run failed button since no failures remain
                    if (this.els.runFailedBtn) {
                        this.els.runFailedBtn.style.display = 'none';
                    }
                }
                return;
            }

            // Offer to rerun failed tests (only once, and only if not stopped)
            if (!wasStopped && this.stats.failed > 0 && !this.hasRerunFailed && typeof Funky !== 'undefined' && Funky.Modal) {
                var self = this;
                var failedCount = this.stats.failed;

                // Small delay to let the UI settle
                setTimeout(function() {
                    Funky.Modal.confirm({
                        title: 'Rerun Failed Tests?',
                        message: failedCount + ' test(s) failed. Would you like to rerun them?',
                        confirmText: 'Rerun Failed',
                        cancelText: 'No Thanks',
                        onConfirm: function() {
                            // Set flag immediately to prevent double-click issues
                            self.hasRerunFailed = true;
                            self.rerunFailedAndUpdate();
                        }
                    });
                }, 500);
            }
        },

        /**
         * Log a clean summary of all failures for easy debugging
         */
        logErrorsSummary: function() {
            var self = this;

            console.log('\n' + '='.repeat(80));
            console.log('FAILED TESTS SUMMARY (' + this.failedTests.length + ' failures)');
            console.log('='.repeat(80) + '\n');

            this.failedTests.forEach(function(test, index) {
                console.log((index + 1) + '. ' + test.suitePath + ' > ' + test.name);
                if (test.error) {
                    console.log('   Error: ' + test.error.message);
                    if (test.error.stack) {
                        // Show just the first 3 lines of stack
                        var stackLines = test.error.stack.split('\n').slice(0, 4);
                        console.log('   Stack: ' + stackLines.join('\n          '));
                    }
                }
                console.log('');
            });

            console.log('='.repeat(80));
            console.log('Copy the above to share test failures');
            console.log('='.repeat(80) + '\n');
        },

        /**
         * Add a test result to the UI (batched for performance)
         * Queues the result for the next animation frame to avoid blocking the stopwatch
         */
        addTestResult: function(result) {
            this.testResults.push(result);

            // Find the suite's tests container using suitePath
            var containerId = 'suite-' + this.generateId(result.suitePath);
            var suiteContainer = this.suiteContainers[containerId];

            if (suiteContainer) {
                // Update suite counters immediately (lightweight)
                if (result.status === 'passed') {
                    suiteContainer.passed++;
                } else if (result.status === 'failed') {
                    suiteContainer.failed++;
                } else if (result.status === 'skipped') {
                    suiteContainer.skipped++;
                }

                // Queue tree node update for batching
                this.pendingTreeUpdates[suiteContainer.suitePath] = {
                    passed: suiteContainer.passed,
                    failed: suiteContainer.failed,
                    skipped: suiteContainer.skipped
                };
            }

            // Store the result index for the error button
            result._resultIndex = this.testResults.length - 1;

            // Queue the DOM work for next animation frame
            this.pendingTestResults.push(result);

            // Schedule batched update
            this.scheduleUIUpdate();
        },

        /**
         * Add a test result to the DOM immediately (called from flush)
         */
        addTestResultImmediate: function(result) {
            // Find the suite's tests container using suitePath
            var containerId = 'suite-' + this.generateId(result.suitePath);
            var suiteContainer = this.suiteContainers[containerId];
            var container;

            if (suiteContainer) {
                container = suiteContainer.tests;
            } else {
                // Fallback to main results area
                container = this.els.testResults;
            }

            var icon = this.getStatusIcon(result.status);
            var durationText = result.duration ? result.duration + 'ms' : '';
            var errorBtn = result.error
                ? '<button class="test-error-btn" data-test-index="' + result._resultIndex + '">Error</button>'
                : '';

            var div = document.createElement('div');
            div.className = 'test-item test-' + result.status;
            div.innerHTML =
                '<span class="test-icon">' + icon + '</span>' +
                '<span class="test-name">' + this.escapeHtml(result.name) + '</span>' +
                '<span class="test-duration">' + durationText + '</span>' +
                errorBtn;

            // Bind error button click
            if (result.error) {
                var self = this;
                var btn = div.querySelector('.test-error-btn');
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    self.showErrorPanel(result);
                });
            }

            // Append at end (natural order within suite)
            container.appendChild(div);

            // Apply any pending assertion data now that element exists
            var assertionKey = result.suitePath + ' > ' + result.name;
            if (this.pendingAssertions[assertionKey]) {
                this.updateTestResultWithAssertions(result.name, this.pendingAssertions[assertionKey]);
                delete this.pendingAssertions[assertionKey];
            }

            // Auto-scroll to failures (within results container only, don't steal focus)
            if (result.status === 'failed' && this.els.testResults) {
                var resultsContainer = this.els.testResults;
                var divTop = div.offsetTop - resultsContainer.offsetTop;
                var divBottom = divTop + div.offsetHeight;
                var scrollTop = resultsContainer.scrollTop;
                var containerHeight = resultsContainer.clientHeight;

                // Only scroll if the failed test is out of view
                if (divBottom > scrollTop + containerHeight || divTop < scrollTop) {
                    resultsContainer.scrollTo({
                        top: divTop - 50,
                        behavior: 'smooth'
                    });
                }
            }
        },

        /**
         * Update stats UI
         */
        updateUI: function() {
            this.els.statPassed.textContent = this.stats.passed;
            this.els.statFailed.textContent = this.stats.failed;
            this.els.statSkipped.textContent = this.stats.skipped;
            // Only update duration display when stopwatch is NOT running
            // The stopwatch handles live display during test execution
            if (!this.stopwatchController) {
                this.els.statDuration.textContent = this.stats.duration.toFixed(2) + 's';
            }
        },

        /**
         * Schedule a batched UI update for the next animation frame
         * Coalesces multiple updateUI() calls into a single frame
         */
        scheduleUIUpdate: function() {
            if (this.pendingUIUpdate) return;
            this.pendingUIUpdate = true;
            var self = this;
            requestAnimationFrame(function() {
                self.pendingUIUpdate = false;
                self.updateUI();
                self.updateProgress();
                self.flushPendingTestResults();
                self.flushPendingTreeUpdates();
            });
        },

        /**
         * Flush any pending test results to the DOM
         */
        flushPendingTestResults: function() {
            if (this.pendingTestResults.length === 0) return;
            var results = this.pendingTestResults;
            this.pendingTestResults = [];
            for (var i = 0; i < results.length; i++) {
                this.addTestResultImmediate(results[i]);
            }
        },

        /**
         * Flush any pending tree node updates to the DOM
         */
        flushPendingTreeUpdates: function() {
            var paths = Object.keys(this.pendingTreeUpdates);
            if (paths.length === 0) return;
            var updates = this.pendingTreeUpdates;
            this.pendingTreeUpdates = {};
            for (var i = 0; i < paths.length; i++) {
                var path = paths[i];
                this.updateTreeNodeCountImmediate(path, updates[path]);
            }
        },

        /**
         * Show "-1" indicator next to failed count when a test is fixed on rerun
         */
        showFixedIndicator: function() {
            if (!this.els.statFailed) return;

            // Remove any existing indicator
            var existing = this.els.statFailed.parentNode.querySelector('.stat-fixed-indicator');
            if (existing) {
                existing.remove();
            }

            // Create the indicator
            var indicator = document.createElement('span');
            indicator.className = 'stat-fixed-indicator';
            indicator.textContent = '-1';

            // Insert after the stat value
            this.els.statFailed.parentNode.insertBefore(indicator, this.els.statFailed.nextSibling);

            // Remove after animation completes (2 seconds total: 0.4s pop + 1.5s wait + 0.5s fade)
            setTimeout(function() {
                if (indicator.parentNode) {
                    indicator.remove();
                }
            }, 2500);
        },

        /**
         * Update progress bar
         */
        updateProgress: function() {
            var completed = this.stats.passed + this.stats.failed + this.stats.skipped;
            var pct = this.stats.total > 0 ? (completed / this.stats.total) * 100 : 0;
            this.els.progressFill.style.width = pct + '%';
        },

        /**
         * Update progress text
         */
        updateProgressText: function(text) {
            if (this.els.progressText) {
                this.els.progressText.textContent = text;
            }
        },

        /**
         * Reset stats
         */
        resetStats: function() {
            this.stats = {
                passed: 0,
                failed: 0,
                skipped: 0,
                total: this.stats.total,
                duration: 0
            };
            this.updateUI();
        },

        /**
         * Run tests (all or filtered based on current filter state)
         * Rebuilds the sandbox iframe for a clean environment
         */
        runAllTests: function() {
            if (this.isRunning) return;

            var self = this;

            // Disable buttons immediately to prevent double-clicks
            this.els.runAllBtn.disabled = true;
            if (this.els.runFailedBtn) {
                this.els.runFailedBtn.disabled = true;
            }

            // Reset rerun state for new full run
            this.hasRerunFailed = false;
            this.isRerunning = false;
            this.rerunFailedList = [];

            var filter = this.currentFilter || null;

            // For #new tag filter, we filter files at load time (in onSandboxReady)
            // so pass null filter to runTests - run everything that was loaded
            if (filter === '#new') {
                filter = null;
            }

            console.log('[TestRunner] Running tests...', this.currentFilter ? 'filter: ' + this.currentFilter : 'all');

            // Rebuild sandbox for a fresh environment
            this.updateProgressText('Rebuilding sandbox...');
            this.destroySandbox();

            // Wait for sandbox to be destroyed, then create fresh one
            setTimeout(function() {
                self.createSandbox();

                // Wait for tests to be loaded (not just sandbox ready), then run them
                var waitForReady = function() {
                    if (self.testsLoaded) {
                        self.sendToSandbox('runTests', { filter: filter });
                    } else {
                        setTimeout(waitForReady, 50);
                    }
                };
                waitForReady();
            }, 100);
        },

        /**
         * Run failed tests only
         * Rebuilds the sandbox iframe for a clean environment
         */
        runFailedTests: function() {
            if (this.isRunning || this.failedTests.length === 0) return;

            var self = this;

            // Disable buttons immediately to prevent double-clicks
            this.els.runAllBtn.disabled = true;
            if (this.els.runFailedBtn) {
                this.els.runFailedBtn.disabled = true;
            }

            console.log('[TestRunner] Running failed tests...');

            // Store the count of failed tests we're about to run
            this.pendingRunCount = this.failedTests.length;
            this.isRunningFailed = true;

            // Build regex pattern from failed test names
            var pattern = this.failedTests.map(function(t) {
                return t.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            }).join('|');

            // Rebuild sandbox for a fresh environment
            this.updateProgressText('Rebuilding sandbox...');
            this.destroySandbox();

            setTimeout(function() {
                self.createSandbox();

                // Wait for tests to be loaded (not just sandbox ready), then run them
                var waitForReady = function() {
                    if (self.testsLoaded) {
                        self.sendToSandbox('runTests', { filter: pattern });
                    } else {
                        setTimeout(waitForReady, 50);
                    }
                };
                waitForReady();
            }, 100);
        },

        /**
         * Rerun failed tests and update stats if they pass
         * This is a one-time rerun that updates existing stats instead of resetting
         */
        rerunFailedAndUpdate: function() {
            if (this.isRunning || this.failedTests.length === 0 || !this.sandboxReady) return;

            // Disable buttons immediately to prevent double-clicks
            this.els.runAllBtn.disabled = true;
            if (this.els.runFailedBtn) {
                this.els.runFailedBtn.disabled = true;
            }

            console.log('[TestRunner] Rerunning failed tests with stat updates...');

            // Store the list of failed tests before rerun
            this.rerunFailedList = this.failedTests.map(function(t) {
                return { name: t.name, suite: t.suite };
            });
            this.isRerunning = true;
            this.hasRerunFailed = true;

            // Build regex pattern from failed test names
            var pattern = this.failedTests.map(function(t) {
                return t.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            }).join('|');

            this.sendToSandbox('runTests', { filter: pattern });
        },

        /**
         * Update a test result from failed to passed in the UI
         */
        updateTestResultToPassed: function(testName) {

            // Find the test result element
            var testItems = this.els.testResults.querySelectorAll('.test-item.failed');
            var testItem = null;

            for (var i = 0; i < testItems.length; i++) {
                var nameEl = testItems[i].querySelector('.test-name');
                if (nameEl && nameEl.textContent === testName) {
                    testItem = testItems[i];
                    break;
                }
            }

            if (!testItem) return;

            // Update test item classes and icon
            testItem.classList.remove('failed');
            testItem.classList.add('passed');

            var statusIcon = testItem.querySelector('.test-status');
            if (statusIcon) {
                statusIcon.textContent = '✓';
                statusIcon.classList.remove('failed');
                statusIcon.classList.add('passed');
            }

            // Remove error button if present
            var errorBtn = testItem.querySelector('.btn-error');
            if (errorBtn) {
                errorBtn.remove();
            }

            // Update suite counters
            var suiteContainer = testItem.closest('.suite-container');
            if (suiteContainer) {
                var passedSpan = suiteContainer.querySelector('.suite-header .passed');
                var failedSpan = suiteContainer.querySelector('.suite-header .failed');

                if (passedSpan) {
                    var passedCount = parseInt(passedSpan.textContent) || 0;
                    passedSpan.textContent = (passedCount + 1) + ' ✓';
                }
                if (failedSpan) {
                    var failedCount = parseInt(failedSpan.textContent) || 0;
                    if (failedCount > 0) {
                        failedSpan.textContent = (failedCount - 1) + ' ✗';
                    }
                }
            }

            // Remove from failedTests array
            this.failedTests = this.failedTests.filter(function(t) {
                return t.name !== testName;
            });
        },

        /**
         * Stop the currently running tests
         */
        stopTests: function() {
            if (!this.isRunning) return;

            console.log('[TestRunner] Stopping tests...');
            this.updateProgressText('Stopping...');

            // Disable stop button immediately
            if (this.els.stopBtn) {
                this.els.stopBtn.disabled = true;
            }

            // Send stop message to sandbox
            this.sendToSandbox('stopTests', {});
        },

        /**
         * Filter tests by name or tag
         * Supports #new to filter by 'new' tag
         */
        filterTests: function(query) {
            var self = this;
            this.currentFilter = query;

            // Update button text based on filter state
            if (this.els.runAllBtn) {
                if (query) {
                    this.els.runAllBtn.innerHTML = '<i class="fas fa-filter me-1"></i>Run Filtered';
                    this.els.runAllBtn.title = 'Run tests matching: ' + query;
                } else {
                    this.els.runAllBtn.innerHTML = '<i class="fas fa-play me-1"></i>Run All';
                    this.els.runAllBtn.title = 'Run all tests';
                }
            }

            var totalTests = this.countTests(this.suiteData);

            // Helper to show a node and all its ancestors (TreeView structure)
            function showNodeAndAncestors(node) {
                node.style.display = '';
                // Walk up the tree showing parent containers and nodes
                var parent = node.parentElement;
                while (parent && parent !== self.els.suiteTree) {
                    if (parent.classList.contains('tree-view-children')) {
                        parent.style.display = '';
                    }
                    if (parent.hasAttribute('data-node-id')) {
                        parent.style.display = '';
                    }
                    parent = parent.parentElement;
                }
            }

            // Helper to show a node and all its descendants (TreeView structure)
            function showNodeAndDescendants(node) {
                node.style.display = '';
                // TreeView children are nested inside the node element
                var children = node.querySelector('.tree-view-children');
                if (children) {
                    children.style.display = '';
                    children.querySelectorAll('[data-node-id]').forEach(function(child) {
                        child.style.display = '';
                    });
                    children.querySelectorAll('.tree-view-children').forEach(function(nested) {
                        nested.style.display = '';
                    });
                }
            }

            // Handle #new tag filter
            if (query === '#new') {
                var taggedFiles = Object.keys(this.fileTags).filter(function(file) {
                    return self.isFileTagged(file, 'new');
                });

                // First hide all nodes and child containers (TreeView structure)
                this.els.suiteTree.querySelectorAll('[data-node-id]').forEach(function(node) {
                    node.style.display = 'none';
                });
                this.els.suiteTree.querySelectorAll('.tree-view-children').forEach(function(container) {
                    container.style.display = 'none';
                });

                // Show tagged nodes, their ancestors, and all their descendants
                this.els.suiteTree.querySelectorAll('[data-node-id][data-file]').forEach(function(node) {
                    var nodeFile = node.getAttribute('data-file');
                    if (taggedFiles.indexOf(nodeFile) !== -1) {
                        // Show this node, its ancestors, and its descendants
                        showNodeAndAncestors(node);
                        showNodeAndDescendants(node);
                    }
                });

                // Count will be accurate after sandbox reload - for now show file count
                this.els.statTotal.textContent = taggedFiles.length + ' files';
                this.els.statTotal.title = 'Click "Run Filtered" for accurate test count';

                // Results filtering not applicable for file-based tags
                return;
            }

            var lowerQuery = query.toLowerCase();

            // Count matching tests from suiteData structure
            var matchingTests = this.countMatchingTests(this.suiteData, lowerQuery);

            // First hide all nodes and child containers (TreeView structure)
            this.els.suiteTree.querySelectorAll('[data-node-id]').forEach(function(node) {
                node.style.display = 'none';
            });
            this.els.suiteTree.querySelectorAll('.tree-view-children').forEach(function(container) {
                container.style.display = 'none';
            });

            // Show matching nodes and their ancestors/descendants (TreeView uses data-node-id as path)
            this.els.suiteTree.querySelectorAll('[data-node-id]').forEach(function(node) {
                var suitePath = node.getAttribute('data-node-id') || '';
                var matches = !query || suitePath.toLowerCase().indexOf(lowerQuery) !== -1;
                if (matches) {
                    showNodeAndAncestors(node);
                    showNodeAndDescendants(node);
                }
            });

            // Update total display with filter info
            if (query) {
                this.els.statTotal.textContent = matchingTests + '/' + totalTests;
                this.els.statTotal.title = matchingTests + ' matching of ' + totalTests + ' total';
            } else {
                this.els.statTotal.textContent = totalTests;
                this.els.statTotal.title = '';
            }

            // Filter results
            this.els.testResults.querySelectorAll('.test-item').forEach(function(item) {
                var testName = item.querySelector('.test-name').textContent.toLowerCase();
                var matches = !query || testName.indexOf(lowerQuery) !== -1;
                item.style.display = matches ? '' : 'none';
            });
        },

        /**
         * Count tests matching the filter query
         * Matches against suite names OR test names (case-insensitive)
         * @param {Array} suites - Suite data array
         * @param {string} query - Query string (lowercase)
         * @param {boolean} parentMatches - Whether parent suite matched
         */
        countMatchingTests: function(suites, query, parentMatches) {
            var self = this;
            var count = 0;
            parentMatches = parentMatches || false;

            if (!query) {
                return this.countTests(suites);
            }

            suites.forEach(function(suite) {
                var suiteMatches = suite.name.toLowerCase().indexOf(query) !== -1;
                var inherited = parentMatches || suiteMatches;

                // If this suite or a parent matched, count ALL tests in this suite
                if (inherited) {
                    count += self.countSuiteTests(suite);
                } else {
                    // No match yet - check individual tests
                    if (suite.tests) {
                        suite.tests.forEach(function(item) {
                            if (item.type === 'test') {
                                var testMatches = item.name.toLowerCase().indexOf(query) !== -1;
                                if (testMatches) {
                                    count++;
                                }
                            }
                        });
                    }

                    // Recursively check children
                    if (suite.children && suite.children.length > 0) {
                        count += self.countMatchingTests(suite.children, query, false);
                    }
                }
            });

            return count;
        },

        /**
         * Show error panel for a failed test
         */
        showErrorPanel: function(result) {
            this.els.errorTestName.textContent = result.name;
            this.els.errorMessage.textContent = result.error ? result.error.message : 'Unknown error';
            this.els.errorStack.textContent = result.error && result.error.stack ? result.error.stack : '';
            this.els.errorPanel.classList.remove('hidden');
        },

        /**
         * Hide error panel
         */
        hideErrorPanel: function() {
            this.els.errorPanel.classList.add('hidden');
        },

        /**
         * Get status icon HTML
         */
        getStatusIcon: function(status) {
            var icons = {
                passed: '<i class="fas fa-check-circle"></i>',
                failed: '<i class="fas fa-times-circle"></i>',
                skipped: '<i class="fas fa-minus-circle"></i>',
                running: '<i class="fas fa-spinner fa-spin"></i>'
            };
            return icons[status] || icons.running;
        },

        /**
         * Escape HTML
         */
        escapeHtml: function(str) {
            if (!str) return '';
            var div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        },

        /**
         * Generate a safe ID from a string
         */
        generateId: function(str) {
            return str.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        },

        /**
         * Destroy the test runner UI and cleanup resources
         * Called when navigating away from the test runner page via SPA
         */
        destroy: function() {
            console.log('[TestRunner] Destroying...');

            // Stop any running tests
            if (this.isRunning) {
                this.stopTests();
            }

            // Destroy sandbox iframe
            this.destroySandbox();

            // Remove message listener
            if (this.messageHandler) {
                window.removeEventListener('message', this.messageHandler);
                this.messageHandler = null;
            }

            // Destroy tree view
            if (this.treeView) {
                this.treeView.destroy();
                this.treeView = null;
            }

            // Stop clock/stopwatch
            if (this.clockUnsubscribe) {
                this.clockUnsubscribe();
                this.clockUnsubscribe = null;
            }
            if (this.stopwatchController) {
                this.stopwatchController.stop();
                this.stopwatchController = null;
            }

            // Clear DOM references
            this.els = {};

            // Reset state
            this.sandboxReady = false;
            this.testsLoaded = false;
            this.suiteData = [];
            this.testResults = [];
            this.failedTests = [];
            this.isRunning = false;
            this.currentFilter = '';
            this.suiteContainers = {};
            this.suiteStack = [];
            this.currentSuitePath = '';
            this.testAssertionDetails = {};
            this.pendingAssertions = {};
            this.pendingUIUpdate = false;
            this.pendingTestResults = [];
            this.pendingTreeUpdates = {};
            this.stats = {
                passed: 0,
                failed: 0,
                skipped: 0,
                total: 0,
                duration: 0
            };

            // Mark as not initialized
            this.initialized = false;

            console.log('[TestRunner] Destroyed');
        }
    };

    // Register with Funky namespace for SPA page lifecycle support
    if (window.Funky && window.Funky.register) {
        window.Funky.register('TestRunner', FunkyTestRunner);
    }

    // Also expose for direct access and debugging
    window.FunkyTestRunner = FunkyTestRunner;

    // Auto-initialize only on direct page load (not SPA navigation)
    // SPA navigation will call init() via Funky.Pages lifecycle
    if (!window.Funky || !window.Funky.Pages) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                FunkyTestRunner.init();
            });
        } else {
            FunkyTestRunner.init();
        }
    }

})(window);

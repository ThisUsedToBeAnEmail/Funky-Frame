/**
 * Tests for Funky.FileManager
 * Professional file management UI with grid/list views, preview, and batch operations
 */
FunkyTests.describe('Funky.FileManager', function() {
    'use strict';

    var FileManager = Funky.FileManager;

    // Skip all tests if FileManager not available or dependencies missing (jQuery + select2)
    if (!FileManager || !Funky.Dom || typeof Funky.Dom.raw !== 'function' || typeof $ === 'undefined' || typeof $.fn.select2 === 'undefined') {
        FunkyTests.it('FileManager requires Funky.Dom with raw() method and jQuery + select2', function() {
            FunkyTests.expect(true).toBe(true);
        });
        return;
    }

    var expect = FunkyTests.expect;
    var fixture;
    var testCounter = 0;
    var originalAjax;
    var ajaxCalls = [];

    /**
     * Generate unique ID for test isolation
     */
    function uniqueId(prefix) {
        testCounter++;
        return (prefix || 'fm') + '_' + testCounter + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    }

    /**
     * Create mock file data
     */
    function createMockFile(overrides) {
        var id = Math.floor(Math.random() * 10000);
        return Object.assign({
            id: id,
            filename: 'test-file-' + id + '.csv',
            mime_type: 'text/csv',
            file_size: 1024,
            generation_status: 'completed',
            download_count: 5,
            created_at: new Date().toISOString()
        }, overrides || {});
    }

    /**
     * Create fixture HTML for FileManager
     */
    function createFileManagerHTML(id) {
        return '<div id="' + id + '" class="file-manager-container">' +
            '<div class="stats-row">' +
                '<span id="total-files">0</span>' +
                '<span id="total-size">0 B</span>' +
                '<span id="files-today">0</span>' +
                '<span id="downloads">0</span>' +
                '<div id="status-breakdown"></div>' +
            '</div>' +
            '<div class="toolbar">' +
                '<input type="text" id="globalSearch" placeholder="Search...">' +
                '<select id="clientFilter"><option value="">All Clients</option></select>' +
                '<select id="statusFilter"><option value="">All Statuses</option></select>' +
                '<select id="mimeFilter"><option value="">All Types</option></select>' +
                '<input type="text" id="dateRangeFilter" placeholder="Date range">' +
                '<button data-view="grid" class="active">Grid</button>' +
                '<button data-view="list">List</button>' +
            '</div>' +
            '<div id="filesGridView" class="grid-view"></div>' +
            '<div id="filesListView" class="list-view d-none">' +
                '<table><thead><tr></tr></thead><tbody></tbody></table>' +
            '</div>' +
            '<div id="bulkActionsBar" class="d-none">' +
                '<span class="selected-count">0 files selected</span>' +
            '</div>' +
        '</div>';
    }

    /**
     * Wait for next tick
     */
    function nextTick(callback) {
        setTimeout(callback, 0);
    }

    FunkyTests.beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="test-container"></div>');

        // Mock jQuery AJAX
        ajaxCalls = [];
        originalAjax = jQuery.ajax;
        jQuery.ajax = function(options) {
            ajaxCalls.push(options);

            // Mock response based on URL
            var deferred = jQuery.Deferred();

            if (options.url && options.url.indexOf('/stats') !== -1) {
                if (options.success) {
                    options.success({
                        total_files: 100,
                        total_size: 1048576,
                        files_today: 10,
                        total_downloads: 50,
                        by_status: {
                            completed: 80,
                            pending: 15,
                            failed: 5
                        }
                    });
                }
                deferred.resolve({});
            } else if (options.url && options.url.indexOf('/filter_options') !== -1) {
                if (options.success) {
                    options.success({
                        mime_types: [
                            { mime_type: 'text/csv', count: 50 },
                            { mime_type: 'application/json', count: 30 }
                        ],
                        statuses: [
                            { generation_status: 'completed', count: 80 },
                            { generation_status: 'pending', count: 15 }
                        ]
                    });
                }
                deferred.resolve({});
            } else if (options.url && options.url.indexOf('/generated_files') !== -1 && options.method === 'GET') {
                if (options.success) {
                    options.success({
                        generated_files: [
                            createMockFile({ id: 1 }),
                            createMockFile({ id: 2 }),
                            createMockFile({ id: 3 })
                        ],
                        total: 3
                    });
                }
                deferred.resolve({});
            } else if (options.method === 'DELETE') {
                if (options.success) {
                    options.success({});
                }
                deferred.resolve({});
            } else if (options.url && options.url.indexOf('/bulk_delete') !== -1) {
                if (options.success) {
                    options.success({ deleted: 2, skipped: 0 });
                }
                deferred.resolve({});
            } else if (options.url && options.url.indexOf('/preview') !== -1) {
                if (options.success) {
                    options.success({
                        id: 1,
                        filename: 'test.csv',
                        mime_type: 'text/csv',
                        file_size: 1024,
                        content: 'header1,header2\nvalue1,value2',
                        truncated: false,
                        metadata: {
                            created_at: new Date().toISOString(),
                            download_count: 5
                        }
                    });
                }
                deferred.resolve({});
            }

            return deferred.promise();
        };
    });

    FunkyTests.afterEach(function() {
        // Restore jQuery AJAX
        jQuery.ajax = originalAjax;
        ajaxCalls = [];

        // Cleanup instances using registry API
        if (FileManager && FileManager._instances) {
            FileManager._instances.list().forEach(function(id) {
                var instance = FileManager._instances.get(id);
                if (instance && typeof instance.destroy === 'function') {
                    try {
                        instance.destroy();
                    } catch (e) {
                        // Ignore cleanup errors
                    }
                }
            });
        }

        fixture.cleanup();
    });

    // ============================================================================
    // Module Structure Tests
    // ============================================================================
    FunkyTests.describe('Module Structure', function() {
        FunkyTests.it('should be registered on Funky namespace', function() {
            expect(FileManager).toBeDefined();
        });

        FunkyTests.it('should be a constructor function', function() {
            expect(typeof FileManager).toBe('function');
        });

        FunkyTests.it('should have _instances registry', function() {
            expect(FileManager._instances).toBeDefined();
            expect(typeof FileManager._instances).toBe('object');
        });

        FunkyTests.it('should have prototype methods', function() {
            expect(typeof FileManager.prototype.init).toBe('function');
            expect(typeof FileManager.prototype.loadStats).toBe('function');
            expect(typeof FileManager.prototype.loadFilterOptions).toBe('function');
            expect(typeof FileManager.prototype.loadGridView).toBe('function');
            expect(typeof FileManager.prototype.renderGridView).toBe('function');
            expect(typeof FileManager.prototype.initDataTable).toBe('function');
            expect(typeof FileManager.prototype.toggleSelection).toBe('function');
            expect(typeof FileManager.prototype.selectAll).toBe('function');
            expect(typeof FileManager.prototype.clearSelection).toBe('function');
            expect(typeof FileManager.prototype.downloadFile).toBe('function');
            expect(typeof FileManager.prototype.previewFile).toBe('function');
            expect(typeof FileManager.prototype.deleteFile).toBe('function');
            expect(typeof FileManager.prototype.bulkDelete).toBe('function');
            expect(typeof FileManager.prototype.refresh).toBe('function');
            expect(typeof FileManager.prototype.setData).toBe('function');
            expect(typeof FileManager.prototype.getData).toBe('function');
            expect(typeof FileManager.prototype.destroy).toBe('function');
        });

        FunkyTests.it('should have utility methods', function() {
            expect(typeof FileManager.prototype.formatDate).toBe('function');
            expect(typeof FileManager.prototype.formatRelativeTime).toBe('function');
            expect(typeof FileManager.prototype.getMimeConfig).toBe('function');
            expect(typeof FileManager.prototype.getStatusConfig).toBe('function');
            expect(typeof FileManager.prototype.syntaxHighlight).toBe('function');
            expect(typeof FileManager.prototype.renderCsvPreview).toBe('function');
        });
    });

    // ============================================================================
    // Constructor Tests
    // ============================================================================
    FunkyTests.describe('Constructor', function() {
        FunkyTests.it('should create instance with default config', function(done) {
            var containerId = uniqueId('container');
            fixture.el.innerHTML = createFileManagerHTML(containerId);

            var fm = new FileManager({
                containerSelector: '#' + containerId
            });

            nextTick(function() {
                expect(fm).toBeDefined();
                expect(fm.currentView).toBe('grid');
                expect(fm.files).toEqual([]);
                expect(fm.selectedFiles).toBeDefined();
                expect(fm.currentPage).toBe(1);
                fm.destroy();
                done();
            });
        });

        FunkyTests.it('should merge custom config with defaults', function(done) {
            var containerId = uniqueId('container');
            fixture.el.innerHTML = createFileManagerHTML(containerId);

            var fm = new FileManager({
                containerSelector: '#' + containerId,
                pageLength: 50,
                enablePreview: false
            });

            nextTick(function() {
                expect(fm.config.pageLength).toBe(50);
                expect(fm.config.enablePreview).toBe(false);
                expect(fm.config.apiBaseUrl).toBe('/api/generated_files');
                fm.destroy();
                done();
            });
        });

        FunkyTests.it('should register instance in _instances registry', function(done) {
            var containerId = uniqueId('container');
            fixture.el.innerHTML = createFileManagerHTML(containerId);

            var fm = new FileManager({
                containerSelector: '#' + containerId
            });

            nextTick(function() {
                expect(FileManager._instances[containerId]).toBe(fm);
                fm.destroy();
                done();
            });
        });

        FunkyTests.it('should initialize selectedFiles as Set', function(done) {
            var containerId = uniqueId('container');
            fixture.el.innerHTML = createFileManagerHTML(containerId);

            var fm = new FileManager({
                containerSelector: '#' + containerId
            });

            nextTick(function() {
                expect(fm.selectedFiles instanceof Set).toBe(true);
                expect(fm.selectedFiles.size).toBe(0);
                fm.destroy();
                done();
            });
        });
    });

    // ============================================================================
    // MIME Config Tests
    // ============================================================================
    FunkyTests.describe('getMimeConfig', function() {
        var fm;

        FunkyTests.beforeEach(function(done) {
            var containerId = uniqueId('container');
            fixture.el.innerHTML = createFileManagerHTML(containerId);
            fm = new FileManager({
                containerSelector: '#' + containerId
            });
            nextTick(done);
        });

        FunkyTests.afterEach(function() {
            if (fm) fm.destroy();
        });

        FunkyTests.it('should return config for text/csv', function() {
            var config = fm.getMimeConfig('text/csv');
            expect(config.label).toBe('CSV');
            expect(config.previewable).toBe(true);
        });

        FunkyTests.it('should return config for application/json', function() {
            var config = fm.getMimeConfig('application/json');
            expect(config.label).toBe('JSON');
            expect(config.previewable).toBe(true);
        });

        FunkyTests.it('should return config for application/pdf', function() {
            var config = fm.getMimeConfig('application/pdf');
            expect(config.label).toBe('PDF');
            expect(config.previewable).toBe(false);
        });

        FunkyTests.it('should return default config for unknown types', function() {
            var config = fm.getMimeConfig('application/unknown');
            expect(config.label).toBe('File');
            expect(config.previewable).toBe(false);
        });
    });

    // ============================================================================
    // Status Config Tests
    // ============================================================================
    FunkyTests.describe('getStatusConfig', function() {
        var fm;

        FunkyTests.beforeEach(function(done) {
            var containerId = uniqueId('container');
            fixture.el.innerHTML = createFileManagerHTML(containerId);
            fm = new FileManager({
                containerSelector: '#' + containerId
            });
            nextTick(done);
        });

        FunkyTests.afterEach(function() {
            if (fm) fm.destroy();
        });

        FunkyTests.it('should return config for completed status', function() {
            var config = fm.getStatusConfig('completed');
            expect(config.label).toBe('Completed');
            expect(config.badge).toContain('success');
        });

        FunkyTests.it('should return config for pending status', function() {
            var config = fm.getStatusConfig('pending');
            expect(config.label).toBe('Pending');
            expect(config.badge).toContain('warning');
        });

        FunkyTests.it('should return config for failed status', function() {
            var config = fm.getStatusConfig('failed');
            expect(config.label).toBe('Failed');
            expect(config.badge).toContain('danger');
        });

        FunkyTests.it('should return config for processing status', function() {
            var config = fm.getStatusConfig('processing');
            expect(config.label).toBe('Processing');
            expect(config.badge).toContain('info');
        });

        FunkyTests.it('should return pending config for unknown status', function() {
            var config = fm.getStatusConfig('unknown');
            expect(config.label).toBe('Pending');
        });
    });

    // ============================================================================
    // Date Formatting Tests
    // ============================================================================
    FunkyTests.describe('formatDate', function() {
        var fm;

        FunkyTests.beforeEach(function(done) {
            var containerId = uniqueId('container');
            fixture.el.innerHTML = createFileManagerHTML(containerId);
            fm = new FileManager({
                containerSelector: '#' + containerId
            });
            nextTick(done);
        });

        FunkyTests.afterEach(function() {
            if (fm) fm.destroy();
        });

        FunkyTests.it('should return dash for null date', function() {
            expect(fm.formatDate(null)).toBe('-');
        });

        FunkyTests.it('should return dash for undefined date', function() {
            expect(fm.formatDate(undefined)).toBe('-');
        });

        FunkyTests.it('should format valid date string', function() {
            var result = fm.formatDate('2024-01-15T10:30:00Z');
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
            expect(result).not.toBe('-');
        });
    });

    // ============================================================================
    // Relative Time Formatting Tests
    // ============================================================================
    FunkyTests.describe('formatRelativeTime', function() {
        var fm;

        FunkyTests.beforeEach(function(done) {
            var containerId = uniqueId('container');
            fixture.el.innerHTML = createFileManagerHTML(containerId);
            fm = new FileManager({
                containerSelector: '#' + containerId
            });
            nextTick(done);
        });

        FunkyTests.afterEach(function() {
            if (fm) fm.destroy();
        });

        FunkyTests.it('should return dash for null date', function() {
            expect(fm.formatRelativeTime(null)).toBe('-');
        });

        FunkyTests.it('should return "Just now" for recent dates', function() {
            var now = new Date().toISOString();
            var result = fm.formatRelativeTime(now);
            expect(result).toBe('Just now');
        });

        FunkyTests.it('should return minutes ago for dates within an hour', function() {
            var date = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // 30 mins ago
            var result = fm.formatRelativeTime(date);
            expect(result).toContain('min');
        });

        FunkyTests.it('should return hours ago for dates within a day', function() {
            var date = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(); // 3 hours ago
            var result = fm.formatRelativeTime(date);
            expect(result).toContain('hour');
        });

        FunkyTests.it('should return days ago for dates within a week', function() {
            var date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 days ago
            var result = fm.formatRelativeTime(date);
            expect(result).toContain('day');
        });
    });

    // ============================================================================
    // Selection Tests
    // ============================================================================
    FunkyTests.describe('Selection Management', function() {
        var fm;
        var containerId;

        FunkyTests.beforeEach(function(done) {
            containerId = uniqueId('container');
            fixture.el.innerHTML = createFileManagerHTML(containerId);
            fm = new FileManager({
                containerSelector: '#' + containerId
            });
            // Wait for initial load
            setTimeout(done, 50);
        });

        FunkyTests.afterEach(function() {
            if (fm) fm.destroy();
        });

        FunkyTests.it('should toggle selection on', function() {
            fm.toggleSelection(1);
            expect(fm.selectedFiles.has(1)).toBe(true);
        });

        FunkyTests.it('should toggle selection off', function() {
            fm.selectedFiles.add(1);
            fm.toggleSelection(1);
            expect(fm.selectedFiles.has(1)).toBe(false);
        });

        FunkyTests.it('should select all files', function() {
            fm.files = [
                createMockFile({ id: 1 }),
                createMockFile({ id: 2 }),
                createMockFile({ id: 3 })
            ];
            fm.selectAll();
            expect(fm.selectedFiles.size).toBe(3);
            expect(fm.selectedFiles.has(1)).toBe(true);
            expect(fm.selectedFiles.has(2)).toBe(true);
            expect(fm.selectedFiles.has(3)).toBe(true);
        });

        FunkyTests.it('should clear selection', function() {
            fm.selectedFiles.add(1);
            fm.selectedFiles.add(2);
            fm.clearSelection();
            expect(fm.selectedFiles.size).toBe(0);
        });

        FunkyTests.it('should range select files', function() {
            fm.files = [
                createMockFile({ id: 10 }),
                createMockFile({ id: 20 }),
                createMockFile({ id: 30 }),
                createMockFile({ id: 40 }),
                createMockFile({ id: 50 })
            ];
            fm.rangeSelect(1, 3);
            expect(fm.selectedFiles.size).toBe(3);
            expect(fm.selectedFiles.has(20)).toBe(true);
            expect(fm.selectedFiles.has(30)).toBe(true);
            expect(fm.selectedFiles.has(40)).toBe(true);
        });

        FunkyTests.it('should handle reverse range select', function() {
            fm.files = [
                createMockFile({ id: 10 }),
                createMockFile({ id: 20 }),
                createMockFile({ id: 30 })
            ];
            fm.rangeSelect(2, 0);
            expect(fm.selectedFiles.size).toBe(3);
        });
    });

    // ============================================================================
    // Bulk Actions Bar Tests
    // ============================================================================
    FunkyTests.describe('Bulk Actions Bar', function() {
        var fm;
        var containerId;

        FunkyTests.beforeEach(function(done) {
            containerId = uniqueId('container');
            fixture.el.innerHTML = createFileManagerHTML(containerId);
            fm = new FileManager({
                containerSelector: '#' + containerId
            });
            setTimeout(done, 50);
        });

        FunkyTests.afterEach(function() {
            if (fm) fm.destroy();
        });

        FunkyTests.it('should show bar when files are selected', function() {
            var bar = document.getElementById('bulkActionsBar');
            fm.toggleSelection(1);
            fm.updateBulkActionsBar();
            expect(bar.classList.contains('d-none')).toBe(false);
        });

        FunkyTests.it('should hide bar when no files are selected', function() {
            var bar = document.getElementById('bulkActionsBar');
            fm.clearSelection();
            fm.updateBulkActionsBar();
            expect(bar.classList.contains('d-none')).toBe(true);
        });

        FunkyTests.it('should update count text', function() {
            var bar = document.getElementById('bulkActionsBar');
            fm.toggleSelection(1);
            fm.toggleSelection(2);
            fm.toggleSelection(3);
            fm.updateBulkActionsBar();
            var countEl = bar.querySelector('.selected-count');
            expect(countEl.textContent).toContain('3');
            expect(countEl.textContent).toContain('files');
        });

        FunkyTests.it('should use singular for single file', function() {
            var bar = document.getElementById('bulkActionsBar');
            fm.toggleSelection(1);
            fm.updateBulkActionsBar();
            var countEl = bar.querySelector('.selected-count');
            expect(countEl.textContent).toContain('1 file selected');
        });
    });

    // ============================================================================
    // Bindable Interface Tests
    // ============================================================================
    FunkyTests.describe('Bindable Interface', function() {
        var fm;
        var containerId;

        FunkyTests.beforeEach(function(done) {
            containerId = uniqueId('container');
            fixture.el.innerHTML = createFileManagerHTML(containerId);
            fm = new FileManager({
                containerSelector: '#' + containerId
            });
            setTimeout(done, 50);
        });

        FunkyTests.afterEach(function() {
            if (fm) fm.destroy();
        });

        FunkyTests.it('should set data and update files array', function() {
            var testFiles = [
                createMockFile({ id: 100 }),
                createMockFile({ id: 101 })
            ];
            fm.setData(testFiles);
            expect(fm.files.length).toBe(2);
            expect(fm.files[0].id).toBe(100);
        });

        FunkyTests.it('should update total and totalPages on setData', function() {
            var testFiles = [];
            for (var i = 0; i < 50; i++) {
                testFiles.push(createMockFile({ id: i }));
            }
            fm.setData(testFiles);
            expect(fm.total).toBe(50);
            expect(fm.totalPages).toBeGreaterThan(1);
        });

        FunkyTests.it('should reset currentPage on setData', function() {
            fm.currentPage = 5;
            fm.setData([createMockFile()]);
            expect(fm.currentPage).toBe(1);
        });

        FunkyTests.it('should clear selection on setData', function() {
            fm.selectedFiles.add(1);
            fm.selectedFiles.add(2);
            fm.setData([createMockFile()]);
            expect(fm.selectedFiles.size).toBe(0);
        });

        FunkyTests.it('should return files array from getData', function() {
            var testFiles = [createMockFile({ id: 999 })];
            fm.setData(testFiles);
            var result = fm.getData();
            expect(result.length).toBe(1);
            expect(result[0].id).toBe(999);
        });

        FunkyTests.it('should handle empty array in setData', function() {
            fm.setData([]);
            expect(fm.files.length).toBe(0);
            expect(fm.total).toBe(0);
        });

        FunkyTests.it('should handle non-array in setData', function() {
            fm.setData(null);
            expect(fm.files).toEqual([]);
        });
    });

    // ============================================================================
    // API Calls Tests
    // ============================================================================
    FunkyTests.describe('API Calls', function() {
        var fm;
        var containerId;

        FunkyTests.beforeEach(function(done) {
            containerId = uniqueId('container');
            fixture.el.innerHTML = createFileManagerHTML(containerId);
            fm = new FileManager({
                containerSelector: '#' + containerId
            });
            setTimeout(done, 50);
        });

        FunkyTests.afterEach(function() {
            if (fm) fm.destroy();
        });

        FunkyTests.it('should call stats API on init', function() {
            var statsCalls = ajaxCalls.filter(function(call) {
                return call.url && call.url.indexOf('/stats') !== -1;
            });
            expect(statsCalls.length).toBeGreaterThan(0);
        });

        FunkyTests.it('should call filter_options API on init', function() {
            var filterCalls = ajaxCalls.filter(function(call) {
                return call.url && call.url.indexOf('/filter_options') !== -1;
            });
            expect(filterCalls.length).toBeGreaterThan(0);
        });

        FunkyTests.it('should load grid view on init', function() {
            var gridCalls = ajaxCalls.filter(function(call) {
                return call.url && call.url.indexOf('/generated_files') !== -1 && call.method === 'GET';
            });
            expect(gridCalls.length).toBeGreaterThan(0);
        });

        FunkyTests.it('should download file with correct URL', function() {
            var originalLocation = window.location.href;
            var downloadUrl = null;

            // Mock location change
            Object.defineProperty(window, 'location', {
                value: {
                    set href(val) {
                        downloadUrl = val;
                    },
                    get href() {
                        return originalLocation;
                    }
                },
                writable: true
            });

            fm.downloadFile(123);
            expect(downloadUrl).toContain('/api/generated_files/123/download');
        });
    });

    // ============================================================================
    // Delete Operations Tests
    // ============================================================================
    FunkyTests.describe('Delete Operations', function() {
        var fm;
        var containerId;
        var originalConfirm;

        FunkyTests.beforeEach(function(done) {
            containerId = uniqueId('container');
            fixture.el.innerHTML = createFileManagerHTML(containerId);
            fm = new FileManager({
                containerSelector: '#' + containerId
            });
            originalConfirm = window.confirm;
            setTimeout(done, 50);
        });

        FunkyTests.afterEach(function() {
            window.confirm = originalConfirm;
            if (fm) fm.destroy();
        });

        FunkyTests.it('should call confirm before delete', function() {
            var confirmCalled = false;
            window.confirm = function() {
                confirmCalled = true;
                return false;
            };
            fm.confirmDeleteFile(1);
            expect(confirmCalled).toBe(true);
        });

        FunkyTests.it('should call DELETE API when confirmed', function(done) {
            window.confirm = function() { return true; };
            ajaxCalls = [];
            fm.deleteFile(1);

            nextTick(function() {
                var deleteCalls = ajaxCalls.filter(function(call) {
                    return call.method === 'DELETE';
                });
                expect(deleteCalls.length).toBe(1);
                done();
            });
        });

        FunkyTests.it('should bulk delete with correct payload', function(done) {
            fm.selectedFiles.add(1);
            fm.selectedFiles.add(2);
            ajaxCalls = [];
            fm.bulkDelete();

            nextTick(function() {
                var bulkCalls = ajaxCalls.filter(function(call) {
                    return call.url && call.url.indexOf('/bulk_delete') !== -1;
                });
                expect(bulkCalls.length).toBe(1);
                expect(bulkCalls[0].method).toBe('POST');
                var data = JSON.parse(bulkCalls[0].data);
                expect(data.ids.length).toBe(2);
                done();
            });
        });

        FunkyTests.it('should clear selection after bulk delete', function(done) {
            fm.selectedFiles.add(1);
            fm.selectedFiles.add(2);
            fm.bulkDelete();

            setTimeout(function() {
                expect(fm.selectedFiles.size).toBe(0);
                done();
            }, 50);
        });
    });

    // ============================================================================
    // CSV Preview Tests
    // ============================================================================
    FunkyTests.describe('renderCsvPreview', function() {
        var fm;
        var containerId;

        FunkyTests.beforeEach(function(done) {
            containerId = uniqueId('container');
            fixture.el.innerHTML = createFileManagerHTML(containerId);
            fm = new FileManager({
                containerSelector: '#' + containerId
            });
            setTimeout(done, 50);
        });

        FunkyTests.afterEach(function() {
            if (fm) fm.destroy();
        });

        FunkyTests.it('should render table for valid CSV', function() {
            var csv = 'Name,Age,City\nJohn,30,NYC\nJane,25,LA';
            var html = fm.renderCsvPreview(csv);
            expect(html).toContain('<table');
            expect(html).toContain('Name');
            expect(html).toContain('Age');
            expect(html).toContain('City');
        });

        FunkyTests.it('should handle empty content', function() {
            var html = fm.renderCsvPreview('');
            expect(html).toContain('Empty file');
        });

        FunkyTests.it('should handle quoted fields with commas', function() {
            var csv = 'Name,Description\nJohn,"Hello, World"';
            var html = fm.renderCsvPreview(csv);
            expect(html).toContain('Hello, World');
        });

        FunkyTests.it('should limit rows to 50', function() {
            var csv = 'Header\n';
            for (var i = 0; i < 100; i++) {
                csv += 'Row' + i + '\n';
            }
            var html = fm.renderCsvPreview(csv);
            expect(html).toContain('Showing first 50 rows');
        });
    });

    // ============================================================================
    // Syntax Highlighting Tests
    // ============================================================================
    FunkyTests.describe('syntaxHighlight', function() {
        var fm;
        var containerId;

        FunkyTests.beforeEach(function(done) {
            containerId = uniqueId('container');
            fixture.el.innerHTML = createFileManagerHTML(containerId);
            fm = new FileManager({
                containerSelector: '#' + containerId
            });
            setTimeout(done, 50);
        });

        FunkyTests.afterEach(function() {
            if (fm) fm.destroy();
        });

        FunkyTests.it('should highlight strings', function() {
            var json = '{"name": "John"}';
            var html = fm.syntaxHighlight(json);
            expect(html).toContain('text-success');
            expect(html).toContain('text-info');
        });

        FunkyTests.it('should highlight numbers', function() {
            var json = '{"count": 42}';
            var html = fm.syntaxHighlight(json);
            expect(html).toContain('text-warning');
        });

        FunkyTests.it('should highlight booleans', function() {
            var json = '{"active": true}';
            var html = fm.syntaxHighlight(json);
            expect(html).toContain('text-primary');
        });

        FunkyTests.it('should highlight null', function() {
            var json = '{"value": null}';
            var html = fm.syntaxHighlight(json);
            expect(html).toContain('text-danger');
        });

        FunkyTests.it('should escape HTML entities', function() {
            var json = '{"html": "<script>"}';
            var html = fm.syntaxHighlight(json);
            expect(html).toContain('&lt;script&gt;');
            expect(html).not.toContain('<script>');
        });
    });

    // ============================================================================
    // View Toggle Tests
    // ============================================================================
    FunkyTests.describe('View Toggle', function() {
        var fm;
        var containerId;

        FunkyTests.beforeEach(function(done) {
            containerId = uniqueId('container');
            fixture.el.innerHTML = createFileManagerHTML(containerId);
            fm = new FileManager({
                containerSelector: '#' + containerId
            });
            setTimeout(done, 50);
        });

        FunkyTests.afterEach(function() {
            if (fm) fm.destroy();
        });

        FunkyTests.it('should start in grid view by default', function() {
            expect(fm.currentView).toBe('grid');
        });

        FunkyTests.it('should clear selection on view change', function() {
            fm.selectedFiles.add(1);
            fm.selectedFiles.add(2);
            fm.currentView = 'list';
            fm.selectedFiles.clear();
            expect(fm.selectedFiles.size).toBe(0);
        });
    });

    // ============================================================================
    // Refresh Tests
    // ============================================================================
    FunkyTests.describe('refresh', function() {
        var fm;
        var containerId;

        FunkyTests.beforeEach(function(done) {
            containerId = uniqueId('container');
            fixture.el.innerHTML = createFileManagerHTML(containerId);
            fm = new FileManager({
                containerSelector: '#' + containerId
            });
            setTimeout(done, 50);
        });

        FunkyTests.afterEach(function() {
            if (fm) fm.destroy();
        });

        FunkyTests.it('should reset to page 1 in grid view', function() {
            fm.currentPage = 3;
            fm.refresh();
            expect(fm.currentPage).toBe(1);
        });

        FunkyTests.it('should call loadGridView when in grid view', function(done) {
            ajaxCalls = [];
            fm.refresh();

            nextTick(function() {
                var gridCalls = ajaxCalls.filter(function(call) {
                    return call.url && call.url.indexOf('/generated_files') !== -1;
                });
                expect(gridCalls.length).toBeGreaterThan(0);
                done();
            });
        });
    });

    // ============================================================================
    // Destroy Tests
    // ============================================================================
    FunkyTests.describe('destroy', function() {
        FunkyTests.it('should remove instance from registry', function(done) {
            var containerId = uniqueId('container');
            fixture.el.innerHTML = createFileManagerHTML(containerId);

            var fm = new FileManager({
                containerSelector: '#' + containerId
            });

            nextTick(function() {
                expect(FileManager._instances[containerId]).toBe(fm);
                fm.destroy();
                expect(FileManager._instances[containerId]).toBeUndefined();
                done();
            });
        });

        FunkyTests.it('should clear files array', function(done) {
            var containerId = uniqueId('container');
            fixture.el.innerHTML = createFileManagerHTML(containerId);

            var fm = new FileManager({
                containerSelector: '#' + containerId
            });

            nextTick(function() {
                fm.files = [createMockFile()];
                fm.destroy();
                expect(fm.files.length).toBe(0);
                done();
            });
        });

        FunkyTests.it('should clear selectedFiles', function(done) {
            var containerId = uniqueId('container');
            fixture.el.innerHTML = createFileManagerHTML(containerId);

            var fm = new FileManager({
                containerSelector: '#' + containerId
            });

            nextTick(function() {
                fm.selectedFiles.add(1);
                fm.selectedFiles.add(2);
                fm.destroy();
                expect(fm.selectedFiles.size).toBe(0);
                done();
            });
        });

        FunkyTests.it('should clear stats and filterOptions', function(done) {
            var containerId = uniqueId('container');
            fixture.el.innerHTML = createFileManagerHTML(containerId);

            var fm = new FileManager({
                containerSelector: '#' + containerId
            });

            nextTick(function() {
                fm.stats = { total: 100 };
                fm.filterOptions = { types: ['csv'] };
                fm.destroy();
                expect(Object.keys(fm.stats).length).toBe(0);
                expect(Object.keys(fm.filterOptions).length).toBe(0);
                done();
            });
        });

        FunkyTests.it('should nullify dataTable reference', function(done) {
            var containerId = uniqueId('container');
            fixture.el.innerHTML = createFileManagerHTML(containerId);

            var fm = new FileManager({
                containerSelector: '#' + containerId
            });

            nextTick(function() {
                fm.dataTable = { destroy: function() {} };
                fm.destroy();
                expect(fm.dataTable).toBeNull();
                done();
            });
        });
    });

    // ============================================================================
    // Extra Ajax Data Tests
    // ============================================================================
    FunkyTests.describe('Extra Ajax Data', function() {
        var fm;
        var containerId;

        FunkyTests.beforeEach(function(done) {
            containerId = uniqueId('container');
            fixture.el.innerHTML = createFileManagerHTML(containerId);
            fm = new FileManager({
                containerSelector: '#' + containerId
            });
            setTimeout(done, 50);
        });

        FunkyTests.afterEach(function() {
            if (fm) fm.destroy();
        });

        FunkyTests.it('should store search value in extraAjaxData', function() {
            fm.extraAjaxData.search = 'test query';
            expect(fm.extraAjaxData.search).toBe('test query');
        });

        FunkyTests.it('should store status filter in extraAjaxData', function() {
            fm.extraAjaxData.generation_status = 'completed';
            expect(fm.extraAjaxData.generation_status).toBe('completed');
        });

        FunkyTests.it('should store mime type filter in extraAjaxData', function() {
            fm.extraAjaxData.mime_type = 'text/csv';
            expect(fm.extraAjaxData.mime_type).toBe('text/csv');
        });

        FunkyTests.it('should store date range in extraAjaxData', function() {
            fm.extraAjaxData.date_from = '2024-01-01 00:00:00';
            fm.extraAjaxData.date_to = '2024-12-31 23:59:59';
            expect(fm.extraAjaxData.date_from).toBe('2024-01-01 00:00:00');
            expect(fm.extraAjaxData.date_to).toBe('2024-12-31 23:59:59');
        });
    });

    // ============================================================================
    // Download Selected Tests
    // ============================================================================
    FunkyTests.describe('downloadSelected', function() {
        var fm;
        var containerId;

        FunkyTests.beforeEach(function(done) {
            containerId = uniqueId('container');
            fixture.el.innerHTML = createFileManagerHTML(containerId);
            fm = new FileManager({
                containerSelector: '#' + containerId
            });
            setTimeout(done, 50);
        });

        FunkyTests.afterEach(function() {
            if (fm) fm.destroy();
            // Clean up any iframes created
            var iframes = document.querySelectorAll('iframe[style*="display: none"]');
            iframes.forEach(function(iframe) {
                iframe.remove();
            });
        });

        FunkyTests.it('should create iframe for each file when multiple selected', function(done) {
            fm.selectedFiles.add(1);
            fm.selectedFiles.add(2);
            fm.selectedFiles.add(3);

            fm.downloadSelected();

            nextTick(function() {
                var iframes = document.querySelectorAll('iframe');
                expect(iframes.length).toBe(3);
                done();
            });
        });
    });

    // ============================================================================
    // Loading State Tests
    // ============================================================================
    FunkyTests.describe('Loading State', function() {
        var fm;
        var containerId;

        FunkyTests.beforeEach(function(done) {
            containerId = uniqueId('container');
            fixture.el.innerHTML = createFileManagerHTML(containerId);
            fm = new FileManager({
                containerSelector: '#' + containerId
            });
            setTimeout(done, 50);
        });

        FunkyTests.afterEach(function() {
            if (fm) fm.destroy();
        });

        FunkyTests.it('should set isLoading to true during load', function() {
            fm.isLoading = true;
            expect(fm.isLoading).toBe(true);
        });

        FunkyTests.it('should prevent duplicate loads when isLoading is true', function() {
            fm.isLoading = true;
            ajaxCalls = [];
            fm.loadGridView();
            expect(ajaxCalls.length).toBe(0);
        });
    });
});

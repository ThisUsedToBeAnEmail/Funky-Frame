/**
 * Tests for Funky.FormatBuilder component
 *
 * FormatBuilder provides a visual report format configuration builder
 * for configuring header, content, and footer sections of reports.
 */
FunkyTests.describe('Funky.Component.FormatBuilder', function() {
    'use strict';

    var FormatBuilder = Funky.FormatBuilder;

    // Skip all tests if FormatBuilder not available or dependencies missing (requires jQuery + select2)
    if (!FormatBuilder || typeof $ === 'undefined' || typeof $.fn.select2 === 'undefined') {
        FunkyTests.it('FormatBuilder requires jQuery and select2', function() {
            FunkyTests.expect(true).toBe(true);
        });
        return;
    }

    var expect = FunkyTests.expect;
    var spyOn = FunkyTests.spyOn;
    var fixture;
    var testCounter = 0;

    /**
     * Generate unique IDs for test isolation
     */
    function uniqueId(prefix) {
        testCounter++;
        var unique = testCounter + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        return (prefix || 'format-builder') + '-test-' + unique;
    }

    FunkyTests.beforeEach(function() {
        var containerId = uniqueId();
        fixture = FunkyTests.fixture('<div id="' + containerId + '"></div>');
        fixture.containerId = containerId;
    });

    FunkyTests.afterEach(function() {
        fixture.cleanup();
    });

    // =========================================================================
    // Module Structure Tests
    // =========================================================================

    FunkyTests.describe('Module Structure', function() {

        FunkyTests.it('should be registered in Funky namespace', function() {
            expect(Funky.FormatBuilder).toBeDefined();
        });

        FunkyTests.it('should have create factory method', function() {
            expect(typeof FormatBuilder.create).toBe('function');
        });

        FunkyTests.it('should have constructor property', function() {
            expect(typeof FormatBuilder.constructor).toBe('function');
        });
    });

    // =========================================================================
    // Factory Tests
    // =========================================================================

    FunkyTests.describe('Factory', function() {

        FunkyTests.it('should create instance via factory', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            expect(builder).toBeDefined();
        });

        FunkyTests.it('should render into container', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            var container = document.getElementById(fixture.containerId);

            expect(container.querySelector('.format-builder')).not.toBeNull();
        });

        FunkyTests.it('should store container reference', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            expect(builder.container).toBe(document.getElementById(fixture.containerId));
        });
    });

    // =========================================================================
    // Default Config Tests
    // =========================================================================

    FunkyTests.describe('Default Config', function() {

        FunkyTests.it('should initialize with disabled header', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            expect(builder.config.header.enabled).toBe(false);
        });

        FunkyTests.it('should initialize with empty header lines', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            expect(builder.config.header.lines).toEqual([]);
        });

        FunkyTests.it('should initialize with empty content columns', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            expect(builder.config.content.columns).toEqual([]);
        });

        FunkyTests.it('should initialize with disabled footer', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            expect(builder.config.footer.enabled).toBe(false);
        });

        FunkyTests.it('should initialize with empty footer lines', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            expect(builder.config.footer.lines).toEqual([]);
        });

        FunkyTests.it('should have available placeholders', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            expect(builder.availablePlaceholders).toBeDefined();
            expect(builder.availablePlaceholders.length).toBeGreaterThan(0);
        });

        FunkyTests.it('should include current_date placeholder', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            var hasDatePlaceholder = builder.availablePlaceholders.some(function(p) {
                return p.value === '{{current_date}}';
            });
            expect(hasDatePlaceholder).toBe(true);
        });

        FunkyTests.it('should include total_rows placeholder', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            var hasTotalRowsPlaceholder = builder.availablePlaceholders.some(function(p) {
                return p.value === '{{total_rows}}';
            });
            expect(hasTotalRowsPlaceholder).toBe(true);
        });
    });

    // =========================================================================
    // UI Structure Tests
    // =========================================================================

    FunkyTests.describe('UI Structure', function() {

        FunkyTests.it('should render header section', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            var container = document.getElementById(fixture.containerId);

            expect(container.querySelector('#header-enabled')).not.toBeNull();
        });

        FunkyTests.it('should render content section', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            var container = document.getElementById(fixture.containerId);

            expect(container.querySelector('#content-columns')).not.toBeNull();
        });

        FunkyTests.it('should render footer section', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            var container = document.getElementById(fixture.containerId);

            expect(container.querySelector('#footer-enabled')).not.toBeNull();
        });

        FunkyTests.it('should render header enabled checkbox', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            var container = document.getElementById(fixture.containerId);
            var checkbox = container.querySelector('#header-enabled');

            expect(checkbox.type).toBe('checkbox');
            expect(checkbox.checked).toBe(false);
        });

        FunkyTests.it('should render footer enabled checkbox', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            var container = document.getElementById(fixture.containerId);
            var checkbox = container.querySelector('#footer-enabled');

            expect(checkbox.type).toBe('checkbox');
            expect(checkbox.checked).toBe(false);
        });

        FunkyTests.it('should render add header line button', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            var container = document.getElementById(fixture.containerId);

            expect(container.querySelector('#add-header-line-btn')).not.toBeNull();
        });

        FunkyTests.it('should render add column button', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            var container = document.getElementById(fixture.containerId);

            expect(container.querySelector('#add-column-btn')).not.toBeNull();
        });

        FunkyTests.it('should render add footer line button', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            var container = document.getElementById(fixture.containerId);

            expect(container.querySelector('#add-footer-line-btn')).not.toBeNull();
        });

        FunkyTests.it('should render placeholder grid', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            var container = document.getElementById(fixture.containerId);

            expect(container.querySelector('.placeholder-grid')).not.toBeNull();
        });

        FunkyTests.it('should render placeholder items', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            var container = document.getElementById(fixture.containerId);
            var placeholderItems = container.querySelectorAll('.placeholder-item');

            expect(placeholderItems.length).toBe(builder.availablePlaceholders.length);
        });

        FunkyTests.it('should render header format select', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            var container = document.getElementById(fixture.containerId);

            expect(container.querySelector('#header-format')).not.toBeNull();
        });

        FunkyTests.it('should render content format select', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            var container = document.getElementById(fixture.containerId);

            expect(container.querySelector('#content-format')).not.toBeNull();
        });

        FunkyTests.it('should render footer format select', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            var container = document.getElementById(fixture.containerId);

            expect(container.querySelector('#footer-format')).not.toBeNull();
        });
    });

    // =========================================================================
    // Accessibility Tests
    // =========================================================================

    FunkyTests.describe('Accessibility', function() {

        FunkyTests.it('should have aria-label on header checkbox', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            var container = document.getElementById(fixture.containerId);
            var checkbox = container.querySelector('#header-enabled');

            expect(checkbox.getAttribute('aria-label')).toBe('Enable header section');
        });

        FunkyTests.it('should have aria-label on footer checkbox', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            var container = document.getElementById(fixture.containerId);
            var checkbox = container.querySelector('#footer-enabled');

            expect(checkbox.getAttribute('aria-label')).toBe('Enable footer section');
        });

        FunkyTests.it('should have aria-label on add header line button', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            var container = document.getElementById(fixture.containerId);
            var btn = container.querySelector('#add-header-line-btn');

            expect(btn.getAttribute('aria-label')).toBe('Add header line');
        });

        FunkyTests.it('should have aria-label on add column button', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            var container = document.getElementById(fixture.containerId);
            var btn = container.querySelector('#add-column-btn');

            expect(btn.getAttribute('aria-label')).toBe('Add content column');
        });

        FunkyTests.it('should have aria-label on add footer line button', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            var container = document.getElementById(fixture.containerId);
            var btn = container.querySelector('#add-footer-line-btn');

            expect(btn.getAttribute('aria-label')).toBe('Add footer line');
        });

        FunkyTests.it('should have aria-describedby on include headers checkbox', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            var container = document.getElementById(fixture.containerId);
            var checkbox = container.querySelector('#content-headers');

            expect(checkbox.getAttribute('aria-describedby')).toBe('content-headers-desc');
        });
    });

    // =========================================================================
    // Header Section Tests
    // =========================================================================

    FunkyTests.describe('Header Section', function() {

        FunkyTests.it('should toggle header enabled state', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            var container = document.getElementById(fixture.containerId);
            var checkbox = container.querySelector('#header-enabled');

            checkbox.click();

            expect(builder.config.header.enabled).toBe(true);
        });

        FunkyTests.it('should show header controls when enabled', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            var container = document.getElementById(fixture.containerId);
            var checkbox = container.querySelector('#header-enabled');
            var controls = container.querySelector('#header-controls');

            expect(controls.style.display).toBe('none');

            checkbox.click();

            expect(controls.style.display).toBe('');
        });

        FunkyTests.it('should show header body when enabled', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            var container = document.getElementById(fixture.containerId);
            var checkbox = container.querySelector('#header-enabled');
            var body = container.querySelector('#header-body');

            expect(body.style.display).toBe('none');

            checkbox.click();

            expect(body.style.display).toBe('');
        });

        FunkyTests.it('should add header line', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.addHeaderLine();

            expect(builder.config.header.lines.length).toBe(1);
            expect(builder.config.header.lines[0]).toEqual([{ value: '' }]);
        });

        FunkyTests.it('should remove header line', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.addHeaderLine();
            builder.addHeaderLine();
            expect(builder.config.header.lines.length).toBe(2);

            builder.removeHeaderLine(0);
            expect(builder.config.header.lines.length).toBe(1);
        });

        FunkyTests.it('should add header field to line', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.addHeaderLine();
            builder.addHeaderField(0);

            expect(builder.config.header.lines[0].length).toBe(2);
        });

        FunkyTests.it('should remove header field', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.addHeaderLine();
            builder.addHeaderField(0);
            expect(builder.config.header.lines[0].length).toBe(2);

            builder.removeHeaderField(0, 0);
            expect(builder.config.header.lines[0].length).toBe(1);
        });

        FunkyTests.it('should remove line when all fields removed', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.addHeaderLine();
            expect(builder.config.header.lines.length).toBe(1);

            builder.removeHeaderField(0, 0);
            expect(builder.config.header.lines.length).toBe(0);
        });

        FunkyTests.it('should update header field value', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.addHeaderLine();
            builder.updateHeaderField(0, 0, 'Test Value', 'text');

            expect(builder.config.header.lines[0][0].value).toBe('Test Value');
        });

        FunkyTests.it('should update header field source', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.addHeaderLine();
            builder.updateHeaderField(0, 0, 'table.column', 'source');

            expect(builder.config.header.lines[0][0].source).toBe('table.column');
            expect(builder.config.header.lines[0][0].value).toBeUndefined();
        });
    });

    // =========================================================================
    // Content Section Tests
    // =========================================================================

    FunkyTests.describe('Content Section', function() {

        FunkyTests.it('should add column', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.addColumn();

            expect(builder.config.content.columns.length).toBe(1);
        });

        FunkyTests.it('should add column with default structure', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.addColumn();

            expect(builder.config.content.columns[0]).toEqual({
                header: '',
                source: '',
                format: ''
            });
        });

        FunkyTests.it('should remove column', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.addColumn();
            builder.addColumn();
            expect(builder.config.content.columns.length).toBe(2);

            builder.removeColumn(0);
            expect(builder.config.content.columns.length).toBe(1);
        });

        FunkyTests.it('should update column header', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.addColumn();
            builder.updateColumn(0, 'header', 'Column Name');

            expect(builder.config.content.columns[0].header).toBe('Column Name');
        });

        FunkyTests.it('should update column source', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.addColumn();
            builder.updateColumn(0, 'source', 'data.field');

            expect(builder.config.content.columns[0].source).toBe('data.field');
        });

        FunkyTests.it('should update column value and remove source', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.addColumn();
            builder.config.content.columns[0].source = 'test.source';
            builder.updateColumn(0, 'value', 'static text');

            expect(builder.config.content.columns[0].value).toBe('static text');
            expect(builder.config.content.columns[0].source).toBeUndefined();
        });

        FunkyTests.it('should update content format', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            var container = document.getElementById(fixture.containerId);
            var formatSelect = container.querySelector('#content-format');

            formatSelect.value = 'tsv';
            formatSelect.dispatchEvent(new Event('change'));

            expect(builder.config.content.format).toBe('tsv');
        });

        FunkyTests.it('should update include headers option', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            var container = document.getElementById(fixture.containerId);
            var checkbox = container.querySelector('#content-headers');

            checkbox.click();

            expect(builder.config.content.includeHeaders).toBe(true);
        });
    });

    // =========================================================================
    // Footer Section Tests
    // =========================================================================

    FunkyTests.describe('Footer Section', function() {

        FunkyTests.it('should toggle footer enabled state', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            var container = document.getElementById(fixture.containerId);
            var checkbox = container.querySelector('#footer-enabled');

            checkbox.click();

            expect(builder.config.footer.enabled).toBe(true);
        });

        FunkyTests.it('should show footer controls when enabled', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            var container = document.getElementById(fixture.containerId);
            var checkbox = container.querySelector('#footer-enabled');
            var controls = container.querySelector('#footer-controls');

            expect(controls.style.display).toBe('none');

            checkbox.click();

            expect(controls.style.display).toBe('');
        });

        FunkyTests.it('should add footer line', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.addFooterLine();

            expect(builder.config.footer.lines.length).toBe(1);
            expect(builder.config.footer.lines[0]).toEqual([{ value: '' }]);
        });

        FunkyTests.it('should remove footer line', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.addFooterLine();
            builder.addFooterLine();
            builder.removeFooterLine(0);

            expect(builder.config.footer.lines.length).toBe(1);
        });

        FunkyTests.it('should add footer field to line', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.addFooterLine();
            builder.addFooterField(0);

            expect(builder.config.footer.lines[0].length).toBe(2);
        });

        FunkyTests.it('should remove footer field', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.addFooterLine();
            builder.addFooterField(0);
            builder.removeFooterField(0, 0);

            expect(builder.config.footer.lines[0].length).toBe(1);
        });

        FunkyTests.it('should update footer field value', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.addFooterLine();
            builder.updateFooterField(0, 0, 'Footer Text', 'text');

            expect(builder.config.footer.lines[0][0].value).toBe('Footer Text');
        });

        FunkyTests.it('should update footer field source', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.addFooterLine();
            builder.updateFooterField(0, 0, 'summary.total', 'source');

            expect(builder.config.footer.lines[0][0].source).toBe('summary.total');
            expect(builder.config.footer.lines[0][0].value).toBeUndefined();
        });
    });

    // =========================================================================
    // getConfig Tests
    // =========================================================================

    FunkyTests.describe('getConfig', function() {

        FunkyTests.it('should return config object', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            var config = builder.getConfig();

            expect(typeof config).toBe('object');
            expect(config.header).toBeDefined();
            expect(config.content).toBeDefined();
            expect(config.footer).toBeDefined();
        });

        FunkyTests.it('should return deep copy of config', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            var config = builder.getConfig();

            config.header.enabled = true;

            expect(builder.config.header.enabled).toBe(false);
        });

        FunkyTests.it('should filter empty columns', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.addColumn();
            builder.addColumn();
            builder.config.content.columns[0].header = 'Name';
            builder.config.content.columns[0].source = 'data.name';
            // Second column has no header or source

            var config = builder.getConfig();

            expect(config.content.columns.length).toBe(1);
        });

        FunkyTests.it('should filter empty header lines', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.config.header.enabled = true;
            builder.config.header.lines = [
                [{ value: 'Report Header' }],
                [{ value: '' }]
            ];

            var config = builder.getConfig();

            expect(config.header.lines.length).toBe(1);
        });

        FunkyTests.it('should filter empty footer lines', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.config.footer.enabled = true;
            builder.config.footer.lines = [
                [{ value: '' }],
                [{ value: 'Report Footer' }]
            ];

            var config = builder.getConfig();

            expect(config.footer.lines.length).toBe(1);
        });
    });

    // =========================================================================
    // loadConfig Tests
    // =========================================================================

    FunkyTests.describe('loadConfig', function() {

        FunkyTests.it('should load header config', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.loadConfig({
                header: {
                    enabled: true,
                    lines: [[{ value: 'Test' }]]
                }
            });

            expect(builder.config.header.enabled).toBe(true);
            expect(builder.config.header.lines.length).toBe(1);
        });

        FunkyTests.it('should load content config', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.loadConfig({
                content: {
                    columns: [
                        { header: 'Name', source: 'data.name' }
                    ],
                    format: 'tsv',
                    includeHeaders: true
                }
            });

            expect(builder.config.content.columns.length).toBe(1);
            expect(builder.config.content.format).toBe('tsv');
            expect(builder.config.content.includeHeaders).toBe(true);
        });

        FunkyTests.it('should load footer config', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.loadConfig({
                footer: {
                    enabled: true,
                    lines: [[{ value: '{{total_rows}} records' }]]
                }
            });

            expect(builder.config.footer.enabled).toBe(true);
            expect(builder.config.footer.lines.length).toBe(1);
        });

        FunkyTests.it('should re-render UI after loading config', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            var container = document.getElementById(fixture.containerId);

            builder.loadConfig({
                header: { enabled: true, lines: [] }
            });

            var checkbox = container.querySelector('#header-enabled');
            expect(checkbox.checked).toBe(true);
        });

        FunkyTests.it('should handle missing config sections', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.loadConfig({});

            expect(builder.config.header.enabled).toBe(false);
            expect(builder.config.content.columns).toEqual([]);
            expect(builder.config.footer.enabled).toBe(false);
        });
    });

    // =========================================================================
    // reset Tests
    // =========================================================================

    FunkyTests.describe('reset', function() {

        FunkyTests.it('should reset header config', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.config.header.enabled = true;
            builder.config.header.lines = [[{ value: 'Test' }]];

            builder.reset();

            expect(builder.config.header.enabled).toBe(false);
            expect(builder.config.header.lines).toEqual([]);
        });

        FunkyTests.it('should reset content config', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.addColumn();
            builder.addColumn();

            builder.reset();

            expect(builder.config.content.columns).toEqual([]);
        });

        FunkyTests.it('should reset footer config', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.config.footer.enabled = true;
            builder.addFooterLine();

            builder.reset();

            expect(builder.config.footer.enabled).toBe(false);
            expect(builder.config.footer.lines).toEqual([]);
        });

        FunkyTests.it('should reset available columns', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.availableColumns = {
                primary_table: 'test',
                tables: { test: [{ name: 'col1' }] }
            };

            builder.reset();

            expect(builder.availableColumns).toEqual({
                primary_table: '',
                tables: {}
            });
        });

        FunkyTests.it('should re-render UI after reset', function() {
            var builder = FormatBuilder.create(fixture.containerId);
            var container = document.getElementById(fixture.containerId);

            var checkbox = container.querySelector('#header-enabled');
            checkbox.click();
            expect(checkbox.checked).toBe(true);

            builder.reset();

            checkbox = container.querySelector('#header-enabled');
            expect(checkbox.checked).toBe(false);
        });
    });

    // =========================================================================
    // Header Validation Tests
    // =========================================================================

    FunkyTests.describe('Header Validation', function() {

        FunkyTests.it('should validate unique headers', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.addColumn();
            builder.addColumn();
            builder.config.content.columns[0].header = 'Name';
            builder.config.content.columns[1].header = 'Email';

            var result = builder.validateUniqueHeaders();

            expect(result.valid).toBe(true);
        });

        FunkyTests.it('should detect duplicate headers', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.addColumn();
            builder.addColumn();
            builder.config.content.columns[0].header = 'Name';
            builder.config.content.columns[1].header = 'Name';

            var result = builder.validateUniqueHeaders();

            expect(result.valid).toBe(false);
            expect(result.duplicates).toContain('Name');
        });

        FunkyTests.it('should return duplicate header names', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.addColumn();
            builder.addColumn();
            builder.addColumn();
            builder.config.content.columns[0].header = 'Name';
            builder.config.content.columns[1].header = 'Name';
            builder.config.content.columns[2].header = 'Email';

            var result = builder.validateUniqueHeaders();

            expect(result.duplicates.length).toBe(1);
            expect(result.duplicates[0]).toBe('Name');
        });

        FunkyTests.it('should ignore empty headers in validation', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.addColumn();
            builder.addColumn();
            builder.config.content.columns[0].header = '';
            builder.config.content.columns[1].header = '';

            var result = builder.validateUniqueHeaders();

            expect(result.valid).toBe(true);
        });
    });

    // =========================================================================
    // Insert Methods Tests
    // =========================================================================

    FunkyTests.describe('Insert Methods', function() {

        FunkyTests.it('should insert into header', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.insertIntoHeader('table.column');

            expect(builder.config.header.enabled).toBe(true);
            expect(builder.config.header.lines.length).toBe(1);
            expect(builder.config.header.lines[0][0].source).toBe('table.column');
        });

        FunkyTests.it('should append to existing header line', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.insertIntoHeader('table.col1');
            builder.insertIntoHeader('table.col2');

            expect(builder.config.header.lines.length).toBe(1);
            expect(builder.config.header.lines[0].length).toBe(2);
        });

        FunkyTests.it('should insert into content', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.insertIntoContent('data.name');

            expect(builder.config.content.columns.length).toBe(1);
            expect(builder.config.content.columns[0].source).toBe('data.name');
            expect(builder.config.content.columns[0].header).toBe('name');
        });

        FunkyTests.it('should extract header from column name', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.insertIntoContent('users.email_address');

            expect(builder.config.content.columns[0].header).toBe('email_address');
        });

        FunkyTests.it('should insert into footer', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.insertIntoFooter('summary.total');

            expect(builder.config.footer.enabled).toBe(true);
            expect(builder.config.footer.lines.length).toBe(1);
            expect(builder.config.footer.lines[0][0].source).toBe('summary.total');
        });

        FunkyTests.it('should append to existing footer line', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.insertIntoFooter('summary.total');
            builder.insertIntoFooter('summary.count');

            expect(builder.config.footer.lines.length).toBe(1);
            expect(builder.config.footer.lines[0].length).toBe(2);
        });
    });

    // =========================================================================
    // Add All to Content Tests
    // =========================================================================

    FunkyTests.describe('addAllToContent', function() {

        FunkyTests.it('should add all columns from table', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.availableColumns = {
                primary_table: 'users',
                tables: {
                    users: [
                        { name: 'id', type: 'integer', description: 'User ID' },
                        { name: 'name', type: 'string', description: 'User Name' },
                        { name: 'email', type: 'string', description: 'User Email' }
                    ]
                }
            };

            builder.addAllToContent('users');

            expect(builder.config.content.columns.length).toBe(3);
            expect(builder.config.content.columns[0].source).toBe('users.id');
            expect(builder.config.content.columns[1].source).toBe('users.name');
            expect(builder.config.content.columns[2].source).toBe('users.email');
        });

        FunkyTests.it('should use column name as header', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.availableColumns = {
                primary_table: 'items',
                tables: {
                    items: [
                        { name: 'description', type: 'string', description: 'Item Description' }
                    ]
                }
            };

            builder.addAllToContent('items');

            expect(builder.config.content.columns[0].header).toBe('description');
        });

        FunkyTests.it('should handle non-existent table gracefully', function() {
            var builder = FormatBuilder.create(fixture.containerId);

            builder.availableColumns = {
                primary_table: '',
                tables: {}
            };

            builder.addAllToContent('nonexistent');

            expect(builder.config.content.columns.length).toBe(0);
        });
    });

    // =========================================================================
    // Event Tests
    // =========================================================================

    FunkyTests.describe('Events', function() {

        FunkyTests.it('should trigger change event on header toggle', function(done) {
            var builder = FormatBuilder.create(fixture.containerId);
            var container = document.getElementById(fixture.containerId);
            var eventFired = false;

            document.addEventListener('funky.format-builder.change', function handler(e) {
                eventFired = true;
                document.removeEventListener('funky.format-builder.change', handler);
            });

            var checkbox = container.querySelector('#header-enabled');
            checkbox.click();

            setTimeout(function() {
                expect(eventFired).toBe(true);
                done();
            }, 50);
        });

        FunkyTests.it('should trigger change event on add column', function(done) {
            var builder = FormatBuilder.create(fixture.containerId);
            var eventFired = false;

            document.addEventListener('funky.format-builder.change', function handler(e) {
                eventFired = true;
                document.removeEventListener('funky.format-builder.change', handler);
            });

            builder.addColumn();

            setTimeout(function() {
                expect(eventFired).toBe(true);
                done();
            }, 50);
        });

        FunkyTests.it('should include config in change event detail', function(done) {
            var builder = FormatBuilder.create(fixture.containerId);
            var eventDetail = null;

            document.addEventListener('funky.format-builder.change', function handler(e) {
                eventDetail = e.detail;
                document.removeEventListener('funky.format-builder.change', handler);
            });

            builder.addColumn();

            setTimeout(function() {
                expect(eventDetail).not.toBeNull();
                expect(eventDetail.content).toBeDefined();
                done();
            }, 50);
        });
    });
});

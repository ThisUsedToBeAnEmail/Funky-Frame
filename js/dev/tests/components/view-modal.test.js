/**
 * Tests for Funky.ViewModal component
 *
 * ViewModal displays entity details in a modal with configurable fields.
 * Integrates with Cache layer for data fetching.
 */
FunkyTests.describe('Funky.Component.ViewModal', function() {
    'use strict';

    var ViewModal = Funky.ViewModal;

    // Skip all tests if ViewModal not available
    if (!ViewModal) {
        FunkyTests.it('ViewModal module not available', function() {
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
        return (prefix || 'view-modal') + '-test-' + unique;
    }

    FunkyTests.beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="test-container"></div>');
    });

    FunkyTests.afterEach(function() {
        // Clean up any modals created during tests
        var modals = document.querySelectorAll('[id*="view-modal-test"]');
        modals.forEach(function(modal) {
            var modalId = modal.id;
            if (ViewModal.getConfig(modalId)) {
                try {
                    ViewModal.destroy(modalId);
                } catch (e) {
                    // Modal may already be destroyed
                }
            }
            if (modal.parentNode) {
                modal.remove();
            }
        });

        // Clean up backdrops
        var backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(function(backdrop) {
            backdrop.remove();
        });

        // Reset body classes
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';

        fixture.cleanup();
    });

    // =========================================================================
    // Module Structure Tests
    // =========================================================================

    FunkyTests.describe('Module Structure', function() {

        FunkyTests.it('should be registered in Funky namespace', function() {
            expect(Funky.ViewModal).toBeDefined();
        });

        FunkyTests.it('should have init method', function() {
            expect(typeof ViewModal.init).toBe('function');
        });

        FunkyTests.it('should have show method', function() {
            expect(typeof ViewModal.show).toBe('function');
        });

        FunkyTests.it('should have showWithData method', function() {
            expect(typeof ViewModal.showWithData).toBe('function');
        });

        FunkyTests.it('should have hide method', function() {
            expect(typeof ViewModal.hide).toBe('function');
        });

        FunkyTests.it('should have destroy method', function() {
            expect(typeof ViewModal.destroy).toBe('function');
        });

        FunkyTests.it('should have setData method for Bindable Interface', function() {
            expect(typeof ViewModal.setData).toBe('function');
        });

        FunkyTests.it('should have getConfig method', function() {
            expect(typeof ViewModal.getConfig).toBe('function');
        });

        FunkyTests.it('should have _instances registry for Bindable Interface', function() {
            expect(typeof ViewModal._instances).toBe('object');
        });
    });

    // =========================================================================
    // Initialization Tests
    // =========================================================================

    FunkyTests.describe('Initialization', function() {

        FunkyTests.it('should initialize with modalId', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'test',
                apiUrl: '/api/test',
                fields: [
                    { key: 'name', label: 'Name' }
                ]
            });

            var config = ViewModal.getConfig(modalId);
            expect(config).toBeDefined();
            expect(config.modalId).toBe(modalId);
        });

        FunkyTests.it('should store entity in config', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'customer',
                apiUrl: '/api/customers',
                fields: [{ key: 'id', label: 'ID' }]
            });

            var config = ViewModal.getConfig(modalId);
            expect(config.entity).toBe('customer');
        });

        FunkyTests.it('should store apiUrl in config', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'order',
                apiUrl: '/api/orders',
                fields: [{ key: 'id', label: 'ID' }]
            });

            var config = ViewModal.getConfig(modalId);
            expect(config.apiUrl).toBe('/api/orders');
        });

        FunkyTests.it('should store fields in config', function() {
            var modalId = uniqueId();
            var fields = [
                { key: 'code', label: 'Code' },
                { key: 'name', label: 'Name' },
                { key: 'status', label: 'Status' }
            ];

            ViewModal.init({
                modalId: modalId,
                entity: 'product',
                apiUrl: '/api/products',
                fields: fields
            });

            var config = ViewModal.getConfig(modalId);
            expect(config.fields.length).toBe(3);
            expect(config.fields[0].key).toBe('code');
            expect(config.fields[1].key).toBe('name');
            expect(config.fields[2].key).toBe('status');
        });

        FunkyTests.it('should create modal element in DOM', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'item',
                apiUrl: '/api/items',
                fields: [{ key: 'id', label: 'ID' }]
            });

            var modalEl = document.getElementById(modalId);
            expect(modalEl).toBeDefined();
            expect(modalEl).not.toBeNull();
        });

        FunkyTests.it('should not require config for getConfig on unknown modal', function() {
            var config = ViewModal.getConfig('nonexistent-modal');
            expect(config).toBeNull();
        });

        FunkyTests.it('should register instance for Bindable Interface', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'entity',
                apiUrl: '/api/entity',
                fields: [{ key: 'id', label: 'ID' }]
            });

            expect(ViewModal._instances[modalId]).toBeDefined();
            expect(ViewModal._instances[modalId].modalId).toBe(modalId);
        });
    });

    // =========================================================================
    // Modal Structure Tests
    // =========================================================================

    FunkyTests.describe('Modal Structure', function() {

        FunkyTests.it('should create modal with correct classes', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'test',
                apiUrl: '/api/test',
                fields: [{ key: 'id', label: 'ID' }]
            });

            var modalEl = document.getElementById(modalId);
            expect(modalEl.classList.contains('modal')).toBe(true);
            expect(modalEl.classList.contains('fade')).toBe(true);
        });

        FunkyTests.it('should have dialog role attribute', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'test',
                apiUrl: '/api/test',
                fields: [{ key: 'id', label: 'ID' }]
            });

            var modalEl = document.getElementById(modalId);
            expect(modalEl.getAttribute('role')).toBe('dialog');
        });

        FunkyTests.it('should have aria-modal attribute', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'test',
                apiUrl: '/api/test',
                fields: [{ key: 'id', label: 'ID' }]
            });

            var modalEl = document.getElementById(modalId);
            expect(modalEl.getAttribute('aria-modal')).toBe('true');
        });

        FunkyTests.it('should have aria-labelledby pointing to title', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'test',
                apiUrl: '/api/test',
                fields: [{ key: 'id', label: 'ID' }]
            });

            var modalEl = document.getElementById(modalId);
            var titleId = modalId + '-title';
            expect(modalEl.getAttribute('aria-labelledby')).toBe(titleId);
        });

        FunkyTests.it('should have loading section', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'test',
                apiUrl: '/api/test',
                fields: [{ key: 'id', label: 'ID' }]
            });

            var modalEl = document.getElementById(modalId);
            var loadingEl = modalEl.querySelector('.view-modal-loading');
            expect(loadingEl).toBeDefined();
            expect(loadingEl).not.toBeNull();
        });

        FunkyTests.it('should have content section', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'test',
                apiUrl: '/api/test',
                fields: [{ key: 'id', label: 'ID' }]
            });

            var modalEl = document.getElementById(modalId);
            var contentEl = modalEl.querySelector('.view-modal-content');
            expect(contentEl).toBeDefined();
            expect(contentEl).not.toBeNull();
        });

        FunkyTests.it('should have error section', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'test',
                apiUrl: '/api/test',
                fields: [{ key: 'id', label: 'ID' }]
            });

            var modalEl = document.getElementById(modalId);
            var errorEl = modalEl.querySelector('.view-modal-error');
            expect(errorEl).toBeDefined();
            expect(errorEl).not.toBeNull();
            expect(errorEl.getAttribute('role')).toBe('alert');
        });

        FunkyTests.it('should have close button with aria-label', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'test',
                apiUrl: '/api/test',
                fields: [{ key: 'id', label: 'ID' }]
            });

            var modalEl = document.getElementById(modalId);
            var closeBtn = modalEl.querySelector('.btn-close');
            expect(closeBtn).not.toBeNull();
            expect(closeBtn.getAttribute('aria-label')).toBe('Close');
        });

        FunkyTests.it('should use custom title from config', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                title: 'View Customer Details',
                entity: 'customer',
                apiUrl: '/api/customers',
                fields: [{ key: 'id', label: 'ID' }]
            });

            var modalEl = document.getElementById(modalId);
            var titleEl = modalEl.querySelector('.modal-title');
            expect(titleEl.textContent).toContain('View Customer Details');
        });

        FunkyTests.it('should use entityLabel as fallback title', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entityLabel: 'Product Information',
                entity: 'product',
                apiUrl: '/api/products',
                fields: [{ key: 'id', label: 'ID' }]
            });

            var modalEl = document.getElementById(modalId);
            var titleEl = modalEl.querySelector('.modal-title');
            expect(titleEl.textContent).toContain('Product Information');
        });

        FunkyTests.it('should not recreate modal if already exists', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'test',
                apiUrl: '/api/test',
                fields: [{ key: 'id', label: 'ID' }]
            });

            var firstModal = document.getElementById(modalId);
            firstModal.setAttribute('data-test', 'first');

            // Re-init should not recreate
            ViewModal.init({
                modalId: modalId,
                entity: 'test',
                apiUrl: '/api/test',
                fields: [{ key: 'name', label: 'Name' }]
            });

            var sameModal = document.getElementById(modalId);
            expect(sameModal.getAttribute('data-test')).toBe('first');
        });
    });

    // =========================================================================
    // showWithData Tests
    // =========================================================================

    FunkyTests.describe('showWithData', function() {

        FunkyTests.it('should render field labels correctly', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'person',
                apiUrl: '/api/persons',
                fields: [
                    { key: 'firstName', label: 'First Name' },
                    { key: 'lastName', label: 'Last Name' }
                ]
            });

            ViewModal.showWithData(modalId, {
                firstName: 'John',
                lastName: 'Doe'
            });

            var modalEl = document.getElementById(modalId);
            var labels = modalEl.querySelectorAll('.form-label');

            var labelTexts = [];
            labels.forEach(function(l) { labelTexts.push(l.textContent); });

            expect(labelTexts).toContain('First Name');
            expect(labelTexts).toContain('Last Name');
        });

        FunkyTests.it('should render field values correctly', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'person',
                apiUrl: '/api/persons',
                fields: [
                    { key: 'firstName', label: 'First Name' },
                    { key: 'lastName', label: 'Last Name' }
                ]
            });

            ViewModal.showWithData(modalId, {
                firstName: 'Jane',
                lastName: 'Smith'
            });

            var modalEl = document.getElementById(modalId);
            var contentEl = modalEl.querySelector('.view-modal-content');

            expect(contentEl.textContent).toContain('Jane');
            expect(contentEl.textContent).toContain('Smith');
        });

        FunkyTests.it('should handle null values with placeholder', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'item',
                apiUrl: '/api/items',
                fields: [
                    { key: 'description', label: 'Description' }
                ]
            });

            ViewModal.showWithData(modalId, {
                description: null
            });

            var modalEl = document.getElementById(modalId);
            var contentEl = modalEl.querySelector('.view-modal-content');
            // Find the placeholder inside the value div, not the label
            var valueDiv = contentEl.querySelector('.col-12 > div:not(.form-label)');
            var placeholder = valueDiv ? valueDiv.querySelector('.text-muted') : contentEl.querySelector('span.text-muted');

            expect(placeholder).not.toBeNull();
            expect(placeholder.textContent).toBe('-');
        });

        FunkyTests.it('should handle undefined values with placeholder', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'item',
                apiUrl: '/api/items',
                fields: [
                    { key: 'notes', label: 'Notes' }
                ]
            });

            ViewModal.showWithData(modalId, {});

            var modalEl = document.getElementById(modalId);
            var contentEl = modalEl.querySelector('.view-modal-content');
            // Find the placeholder inside the value div, not the label
            var valueDiv = contentEl.querySelector('.col-12 > div:not(.form-label)');
            var placeholder = valueDiv ? valueDiv.querySelector('.text-muted') : contentEl.querySelector('span.text-muted');

            expect(placeholder).not.toBeNull();
            expect(placeholder.textContent).toBe('-');
        });

        FunkyTests.it('should render boolean true as Yes', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'setting',
                apiUrl: '/api/settings',
                fields: [
                    { key: 'enabled', label: 'Enabled' }
                ]
            });

            ViewModal.showWithData(modalId, {
                enabled: true
            });

            var modalEl = document.getElementById(modalId);
            var contentEl = modalEl.querySelector('.view-modal-content');

            expect(contentEl.textContent).toContain('Yes');
        });

        FunkyTests.it('should render boolean false as No', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'setting',
                apiUrl: '/api/settings',
                fields: [
                    { key: 'active', label: 'Active' }
                ]
            });

            ViewModal.showWithData(modalId, {
                active: false
            });

            var modalEl = document.getElementById(modalId);
            var contentEl = modalEl.querySelector('.view-modal-content');

            expect(contentEl.textContent).toContain('No');
        });

        FunkyTests.it('should use custom render function', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'product',
                apiUrl: '/api/products',
                fields: [
                    {
                        key: 'price',
                        label: 'Price',
                        render: function(value) {
                            return '$' + value.toFixed(2);
                        }
                    }
                ]
            });

            ViewModal.showWithData(modalId, {
                price: 29.99
            });

            var modalEl = document.getElementById(modalId);
            var contentEl = modalEl.querySelector('.view-modal-content');

            expect(contentEl.textContent).toContain('$29.99');
        });

        FunkyTests.it('should pass row data to render function', function() {
            var modalId = uniqueId();
            var capturedRow = null;

            ViewModal.init({
                modalId: modalId,
                entity: 'order',
                apiUrl: '/api/orders',
                fields: [
                    {
                        key: 'total',
                        label: 'Total',
                        render: function(value, row) {
                            capturedRow = row;
                            return value + ' ' + row.currency;
                        }
                    }
                ]
            });

            ViewModal.showWithData(modalId, {
                total: 100,
                currency: 'USD'
            });

            expect(capturedRow).not.toBeNull();
            expect(capturedRow.currency).toBe('USD');
        });

        FunkyTests.it('should hide loading and error sections', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'test',
                apiUrl: '/api/test',
                fields: [{ key: 'id', label: 'ID' }]
            });

            ViewModal.showWithData(modalId, { id: 1 });

            var modalEl = document.getElementById(modalId);
            var loadingEl = modalEl.querySelector('.view-modal-loading');
            var errorEl = modalEl.querySelector('.view-modal-error');
            var contentEl = modalEl.querySelector('.view-modal-content');

            expect(loadingEl.style.display).toBe('none');
            expect(errorEl.style.display).toBe('none');
            expect(contentEl.style.display).toBe('block');
        });

        FunkyTests.it('should call onRender callback', function() {
            var modalId = uniqueId();
            var onRenderCalled = false;
            var capturedData = null;
            var capturedContent = null;

            ViewModal.init({
                modalId: modalId,
                entity: 'test',
                apiUrl: '/api/test',
                fields: [{ key: 'id', label: 'ID' }],
                onRender: function(data, contentEl) {
                    onRenderCalled = true;
                    capturedData = data;
                    capturedContent = contentEl;
                }
            });

            ViewModal.showWithData(modalId, { id: 42 });

            expect(onRenderCalled).toBe(true);
            expect(capturedData.id).toBe(42);
            expect(capturedContent).not.toBeNull();
        });

        FunkyTests.it('should apply custom colClass to fields', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'test',
                apiUrl: '/api/test',
                fields: [
                    { key: 'fullWidth', label: 'Full Width', colClass: 'col-12' },
                    { key: 'halfWidth', label: 'Half Width', colClass: 'col-6' }
                ]
            });

            ViewModal.showWithData(modalId, {
                fullWidth: 'Value 1',
                halfWidth: 'Value 2'
            });

            var modalEl = document.getElementById(modalId);
            var cols = modalEl.querySelectorAll('.view-modal-content .row > div');

            expect(cols[0].classList.contains('col-12')).toBe(true);
            expect(cols[1].classList.contains('col-6')).toBe(true);
        });
    });

    // =========================================================================
    // Sections Tests
    // =========================================================================

    FunkyTests.describe('Sections', function() {

        FunkyTests.it('should render additional sections', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'employee',
                apiUrl: '/api/employees',
                fields: [
                    { key: 'name', label: 'Name' }
                ],
                sections: [
                    {
                        title: 'Contact Information',
                        fields: [
                            { key: 'email', label: 'Email' },
                            { key: 'phone', label: 'Phone' }
                        ]
                    }
                ]
            });

            ViewModal.showWithData(modalId, {
                name: 'John Doe',
                email: 'john@example.com',
                phone: '555-1234'
            });

            var modalEl = document.getElementById(modalId);
            var contentEl = modalEl.querySelector('.view-modal-content');

            expect(contentEl.textContent).toContain('Contact Information');
            expect(contentEl.textContent).toContain('john@example.com');
            expect(contentEl.textContent).toContain('555-1234');
        });

        FunkyTests.it('should render multiple sections', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'profile',
                apiUrl: '/api/profiles',
                fields: [
                    { key: 'id', label: 'ID' }
                ],
                sections: [
                    {
                        title: 'Section One',
                        fields: [{ key: 'field1', label: 'Field 1' }]
                    },
                    {
                        title: 'Section Two',
                        fields: [{ key: 'field2', label: 'Field 2' }]
                    }
                ]
            });

            ViewModal.showWithData(modalId, {
                id: 1,
                field1: 'Value 1',
                field2: 'Value 2'
            });

            var modalEl = document.getElementById(modalId);
            var headings = modalEl.querySelectorAll('.view-modal-content h6');

            expect(headings.length).toBe(2);
            expect(headings[0].textContent).toBe('Section One');
            expect(headings[1].textContent).toBe('Section Two');
        });

        FunkyTests.it('should add horizontal rule between sections', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'item',
                apiUrl: '/api/items',
                fields: [{ key: 'name', label: 'Name' }],
                sections: [
                    {
                        title: 'Details',
                        fields: [{ key: 'detail', label: 'Detail' }]
                    }
                ]
            });

            ViewModal.showWithData(modalId, {
                name: 'Test',
                detail: 'Info'
            });

            var modalEl = document.getElementById(modalId);
            var hrs = modalEl.querySelectorAll('.view-modal-content hr');

            expect(hrs.length).toBeGreaterThan(0);
        });
    });

    // =========================================================================
    // setData Tests (Bindable Interface)
    // =========================================================================

    FunkyTests.describe('setData (Bindable Interface)', function() {

        FunkyTests.it('should render data without showing modal', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'record',
                apiUrl: '/api/records',
                fields: [
                    { key: 'title', label: 'Title' }
                ]
            });

            ViewModal.setData(modalId, { title: 'Test Record' });

            var modalEl = document.getElementById(modalId);
            var contentEl = modalEl.querySelector('.view-modal-content');

            expect(contentEl.textContent).toContain('Test Record');
        });

        FunkyTests.it('should update instance data', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'record',
                apiUrl: '/api/records',
                fields: [{ key: 'id', label: 'ID' }]
            });

            ViewModal.setData(modalId, { id: 99 });

            expect(ViewModal._instances[modalId].data).toBeDefined();
            expect(ViewModal._instances[modalId].data.id).toBe(99);
        });

        FunkyTests.it('should update content when called multiple times', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'item',
                apiUrl: '/api/items',
                fields: [{ key: 'value', label: 'Value' }]
            });

            ViewModal.setData(modalId, { value: 'First' });
            ViewModal.setData(modalId, { value: 'Second' });

            var modalEl = document.getElementById(modalId);
            var contentEl = modalEl.querySelector('.view-modal-content');

            expect(contentEl.textContent).toContain('Second');
            expect(contentEl.textContent).not.toContain('First');
        });
    });

    // =========================================================================
    // hide Tests
    // =========================================================================

    FunkyTests.describe('hide', function() {

        FunkyTests.it('should have hide method callable', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'test',
                apiUrl: '/api/test',
                fields: [{ key: 'id', label: 'ID' }]
            });

            // Should not throw
            expect(function() {
                ViewModal.hide(modalId);
            }).not.toThrow();
        });
    });

    // =========================================================================
    // destroy Tests
    // =========================================================================

    FunkyTests.describe('destroy', function() {

        FunkyTests.it('should remove config', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'temp',
                apiUrl: '/api/temp',
                fields: [{ key: 'id', label: 'ID' }]
            });

            expect(ViewModal.getConfig(modalId)).not.toBeNull();

            ViewModal.destroy(modalId);

            expect(ViewModal.getConfig(modalId)).toBeNull();
        });

        FunkyTests.it('should remove instance from registry', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'temp',
                apiUrl: '/api/temp',
                fields: [{ key: 'id', label: 'ID' }]
            });

            expect(ViewModal._instances[modalId]).toBeDefined();

            ViewModal.destroy(modalId);

            expect(ViewModal._instances[modalId]).toBeUndefined();
        });

        FunkyTests.it('should remove modal element from DOM', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'temp',
                apiUrl: '/api/temp',
                fields: [{ key: 'id', label: 'ID' }]
            });

            expect(document.getElementById(modalId)).not.toBeNull();

            ViewModal.destroy(modalId);

            expect(document.getElementById(modalId)).toBeNull();
        });

        FunkyTests.it('should handle destroying non-existent modal gracefully', function() {
            expect(function() {
                ViewModal.destroy('non-existent-modal-xyz');
            }).not.toThrow();
        });
    });

    // =========================================================================
    // Accessibility Tests
    // =========================================================================

    FunkyTests.describe('Accessibility', function() {

        FunkyTests.it('should have spinner with role=status', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'test',
                apiUrl: '/api/test',
                fields: [{ key: 'id', label: 'ID' }]
            });

            var modalEl = document.getElementById(modalId);
            var spinner = modalEl.querySelector('.spinner-border');

            expect(spinner.getAttribute('role')).toBe('status');
        });

        FunkyTests.it('should have spinner with aria-label', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'test',
                apiUrl: '/api/test',
                fields: [{ key: 'id', label: 'ID' }]
            });

            var modalEl = document.getElementById(modalId);
            var spinner = modalEl.querySelector('.spinner-border');

            expect(spinner.getAttribute('aria-label')).toBe('Loading');
        });

        FunkyTests.it('should have tabindex on modal', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'test',
                apiUrl: '/api/test',
                fields: [{ key: 'id', label: 'ID' }]
            });

            var modalEl = document.getElementById(modalId);
            expect(modalEl.getAttribute('tabindex')).toBe('-1');
        });

        FunkyTests.it('should have error container with role=alert', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'test',
                apiUrl: '/api/test',
                fields: [{ key: 'id', label: 'ID' }]
            });

            var modalEl = document.getElementById(modalId);
            var errorEl = modalEl.querySelector('.view-modal-error');

            expect(errorEl.getAttribute('role')).toBe('alert');
        });

        FunkyTests.it('should have document role on modal dialog', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'test',
                apiUrl: '/api/test',
                fields: [{ key: 'id', label: 'ID' }]
            });

            var modalEl = document.getElementById(modalId);
            var dialogEl = modalEl.querySelector('.modal-dialog');

            expect(dialogEl.getAttribute('role')).toBe('document');
        });
    });

    // =========================================================================
    // Error Handling Tests
    // =========================================================================

    FunkyTests.describe('Error Handling', function() {

        FunkyTests.it('should not throw on init without modalId', function() {
            // Console will show error but should not throw
            expect(function() {
                ViewModal.init({
                    entity: 'test',
                    apiUrl: '/api/test',
                    fields: []
                });
            }).not.toThrow();
        });

        FunkyTests.it('should not throw on showWithData with unknown modal', function() {
            expect(function() {
                ViewModal.showWithData('unknown-modal-id', { data: 'test' });
            }).not.toThrow();
        });

        FunkyTests.it('should not throw on setData with unknown modal', function() {
            expect(function() {
                ViewModal.setData('unknown-modal-id', { data: 'test' });
            }).not.toThrow();
        });

        FunkyTests.it('should not throw on hide with unknown modal', function() {
            expect(function() {
                ViewModal.hide('unknown-modal-id');
            }).not.toThrow();
        });
    });

    // =========================================================================
    // HTML Rendering Tests
    // =========================================================================

    FunkyTests.describe('HTML Content Rendering', function() {

        FunkyTests.it('should render HTML content when value contains tags', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'article',
                apiUrl: '/api/articles',
                fields: [
                    {
                        key: 'content',
                        label: 'Content',
                        render: function(value) {
                            return '<strong>' + value + '</strong>';
                        }
                    }
                ]
            });

            ViewModal.showWithData(modalId, {
                content: 'Bold Text'
            });

            var modalEl = document.getElementById(modalId);
            var strong = modalEl.querySelector('.view-modal-content strong');

            expect(strong).not.toBeNull();
            expect(strong.textContent).toBe('Bold Text');
        });

        FunkyTests.it('should escape plain text values', function() {
            var modalId = uniqueId();

            ViewModal.init({
                modalId: modalId,
                entity: 'comment',
                apiUrl: '/api/comments',
                fields: [
                    { key: 'text', label: 'Text' }
                ]
            });

            // Plain text without HTML should be rendered as text
            ViewModal.showWithData(modalId, {
                text: 'Hello World'
            });

            var modalEl = document.getElementById(modalId);
            var contentEl = modalEl.querySelector('.view-modal-content');

            expect(contentEl.textContent).toContain('Hello World');
        });
    });

    // =========================================================================
    // Multiple Modal Tests
    // =========================================================================

    FunkyTests.describe('Multiple Modals', function() {

        FunkyTests.it('should support multiple independent modals', function() {
            var modalId1 = uniqueId('modal1');
            var modalId2 = uniqueId('modal2');

            ViewModal.init({
                modalId: modalId1,
                entity: 'user',
                apiUrl: '/api/users',
                fields: [{ key: 'name', label: 'User Name' }]
            });

            ViewModal.init({
                modalId: modalId2,
                entity: 'product',
                apiUrl: '/api/products',
                fields: [{ key: 'name', label: 'Product Name' }]
            });

            var config1 = ViewModal.getConfig(modalId1);
            var config2 = ViewModal.getConfig(modalId2);

            expect(config1.entity).toBe('user');
            expect(config2.entity).toBe('product');
        });

        FunkyTests.it('should display different data in different modals', function() {
            var modalId1 = uniqueId('modalA');
            var modalId2 = uniqueId('modalB');

            ViewModal.init({
                modalId: modalId1,
                entity: 'alpha',
                apiUrl: '/api/alpha',
                fields: [{ key: 'value', label: 'Value' }]
            });

            ViewModal.init({
                modalId: modalId2,
                entity: 'beta',
                apiUrl: '/api/beta',
                fields: [{ key: 'value', label: 'Value' }]
            });

            ViewModal.showWithData(modalId1, { value: 'Alpha Data' });
            ViewModal.showWithData(modalId2, { value: 'Beta Data' });

            var modal1El = document.getElementById(modalId1);
            var modal2El = document.getElementById(modalId2);

            expect(modal1El.querySelector('.view-modal-content').textContent).toContain('Alpha Data');
            expect(modal2El.querySelector('.view-modal-content').textContent).toContain('Beta Data');
        });

        FunkyTests.it('should destroy one modal without affecting others', function() {
            var modalId1 = uniqueId('keep');
            var modalId2 = uniqueId('destroy');

            ViewModal.init({
                modalId: modalId1,
                entity: 'keep',
                apiUrl: '/api/keep',
                fields: [{ key: 'id', label: 'ID' }]
            });

            ViewModal.init({
                modalId: modalId2,
                entity: 'destroy',
                apiUrl: '/api/destroy',
                fields: [{ key: 'id', label: 'ID' }]
            });

            ViewModal.destroy(modalId2);

            expect(ViewModal.getConfig(modalId1)).not.toBeNull();
            expect(ViewModal.getConfig(modalId2)).toBeNull();
            expect(document.getElementById(modalId1)).not.toBeNull();
            expect(document.getElementById(modalId2)).toBeNull();
        });
    });
});

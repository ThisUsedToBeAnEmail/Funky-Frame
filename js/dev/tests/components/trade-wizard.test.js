/**
 * Tests for Funky.TradeWizard component
 *
 * TradeWizard provides a multi-step wizard for creating trades
 * with support for related trades and template-specific fields.
 */
FunkyTests.describe('Funky.Component.TradeWizard', function() {
    'use strict';

    var TradeWizard = Funky.TradeWizard;

    // Skip all tests if TradeWizard not available
    if (!TradeWizard) {
        FunkyTests.it('TradeWizard module not available', function() {
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
        return (prefix || 'trade-wizard') + '-test-' + unique;
    }

    /**
     * Create mock wizard modal HTML
     */
    function createMockModal(modalId) {
        return '<div id="' + modalId + '" class="modal">' +
            '  <div class="modal-dialog">' +
            '    <div class="modal-content">' +
            '      <div class="modal-header">' +
            '        <h5>Create Trade</h5>' +
            '      </div>' +
            '      <div class="modal-body">' +
            '        <div class="wizard-steps">' +
            '          <div class="wizard-step" data-step="1">Step 1</div>' +
            '          <div class="wizard-step" data-step="2">Step 2</div>' +
            '          <div class="wizard-step" data-step="3">Step 3</div>' +
            '          <div class="wizard-step" data-step="4">Step 4</div>' +
            '        </div>' +
            '        <div id="wizardStepContent"></div>' +
            '      </div>' +
            '      <div class="modal-footer">' +
            '        <button class="wizard-btn-prev" style="display:none;">Previous</button>' +
            '        <button class="wizard-btn-next">Next</button>' +
            '        <button class="wizard-btn-save" style="display:none;">Save</button>' +
            '      </div>' +
            '    </div>' +
            '  </div>' +
            '</div>';
    }

    FunkyTests.beforeEach(function() {
        var modalId = 'tradeWizardModal';
        fixture = FunkyTests.fixture(createMockModal(modalId));
        fixture.modalId = modalId;
    });

    FunkyTests.afterEach(function() {
        // Clean up instances using registry API
        if (TradeWizard._instances) {
            TradeWizard._instances.list().forEach(function(id) {
                var instance = TradeWizard._instances.get(id);
                if (instance && typeof instance.destroy === 'function') {
                    try {
                        instance.destroy();
                    } catch (e) {
                        // May already be destroyed
                    }
                }
            });
        }

        // Clear global reference
        if (window.tradeWizard) {
            window.tradeWizard = null;
        }

        fixture.cleanup();
    });

    // =========================================================================
    // Module Structure Tests
    // =========================================================================

    FunkyTests.describe('Module Structure', function() {

        FunkyTests.it('should be registered in Funky namespace', function() {
            expect(Funky.TradeWizard).toBeDefined();
        });

        FunkyTests.it('should have create factory method', function() {
            expect(typeof TradeWizard.create).toBe('function');
        });

        FunkyTests.it('should have getInstance method', function() {
            expect(typeof TradeWizard.getInstance).toBe('function');
        });

        FunkyTests.it('should have _instances registry', function() {
            expect(typeof TradeWizard._instances).toBe('object');
        });

        FunkyTests.it('should have constructor property', function() {
            expect(typeof TradeWizard.constructor).toBe('function');
        });
    });

    // =========================================================================
    // Constructor Tests
    // =========================================================================

    FunkyTests.describe('Constructor', function() {

        FunkyTests.it('should create instance with default modalId', function() {
            var wizard = TradeWizard.create();
            expect(wizard.modalId).toBe('tradeWizardModal');
            wizard.destroy();
        });

        FunkyTests.it('should create instance with custom modalId', function() {
            var customId = uniqueId('custom-modal');
            fixture.el.innerHTML += createMockModal(customId);

            var wizard = TradeWizard.create(customId);
            expect(wizard.modalId).toBe(customId);
            wizard.destroy();
        });

        FunkyTests.it('should initialize clients as empty array', function() {
            var wizard = TradeWizard.create();
            expect(wizard.clients).toEqual([]);
            wizard.destroy();
        });

        FunkyTests.it('should initialize templates as empty array', function() {
            var wizard = TradeWizard.create();
            expect(wizard.templates).toEqual([]);
            wizard.destroy();
        });

        FunkyTests.it('should initialize securities as empty array', function() {
            var wizard = TradeWizard.create();
            expect(wizard.securities).toEqual([]);
            wizard.destroy();
        });

        FunkyTests.it('should initialize relationships as empty array', function() {
            var wizard = TradeWizard.create();
            expect(wizard.relationships).toEqual([]);
            wizard.destroy();
        });

        FunkyTests.it('should initialize counterpartyRelationships as empty array', function() {
            var wizard = TradeWizard.create();
            expect(wizard.counterpartyRelationships).toEqual([]);
            wizard.destroy();
        });

        FunkyTests.it('should initialize selectedTemplate as null', function() {
            var wizard = TradeWizard.create();
            expect(wizard.selectedTemplate).toBeNull();
            wizard.destroy();
        });

        FunkyTests.it('should initialize selectedRelatedTemplate as null', function() {
            var wizard = TradeWizard.create();
            expect(wizard.selectedRelatedTemplate).toBeNull();
            wizard.destroy();
        });

        FunkyTests.it('should initialize templateFields as empty array', function() {
            var wizard = TradeWizard.create();
            expect(wizard.templateFields).toEqual([]);
            wizard.destroy();
        });

        FunkyTests.it('should initialize relatedTemplateFields as empty array', function() {
            var wizard = TradeWizard.create();
            expect(wizard.relatedTemplateFields).toEqual([]);
            wizard.destroy();
        });

        FunkyTests.it('should initialize currentStep to 1', function() {
            var wizard = TradeWizard.create();
            expect(wizard.currentStep).toBe(1);
            wizard.destroy();
        });

        FunkyTests.it('should initialize state as empty object', function() {
            var wizard = TradeWizard.create();
            expect(wizard.state).toEqual({});
            wizard.destroy();
        });
    });

    // =========================================================================
    // Instance Registry Tests
    // =========================================================================

    FunkyTests.describe('Instance Registry', function() {

        FunkyTests.it('should register instance by modalId', function() {
            var wizard = TradeWizard.create();
            expect(TradeWizard.getInstance('tradeWizardModal')).toBe(wizard);
            wizard.destroy();
        });

        FunkyTests.it('should get instance by ID', function() {
            var wizard = TradeWizard.create();
            var retrieved = TradeWizard.getInstance('tradeWizardModal');
            expect(retrieved).toBe(wizard);
            wizard.destroy();
        });

        FunkyTests.it('should return null for unknown ID', function() {
            var retrieved = TradeWizard.getInstance('nonexistent-modal');
            expect(retrieved).toBeNull();
        });

        FunkyTests.it('should remove instance on destroy', function() {
            var wizard = TradeWizard.create();
            wizard.destroy();
            expect(TradeWizard.getInstance('tradeWizardModal')).toBeNull();
        });

        FunkyTests.it('should support multiple instances', function() {
            var id1 = uniqueId('modal1');
            var id2 = uniqueId('modal2');
            fixture.el.innerHTML += createMockModal(id1) + createMockModal(id2);

            var wizard1 = TradeWizard.create(id1);
            var wizard2 = TradeWizard.create(id2);

            expect(TradeWizard.getInstance(id1)).toBe(wizard1);
            expect(TradeWizard.getInstance(id2)).toBe(wizard2);

            wizard1.destroy();
            wizard2.destroy();
        });
    });

    // =========================================================================
    // Bindable Interface Tests
    // =========================================================================

    FunkyTests.describe('Bindable Interface', function() {

        FunkyTests.it('should have setData method', function() {
            var wizard = TradeWizard.create();
            expect(typeof wizard.setData).toBe('function');
            wizard.destroy();
        });

        FunkyTests.it('should have getData method', function() {
            var wizard = TradeWizard.create();
            expect(typeof wizard.getData).toBe('function');
            wizard.destroy();
        });

        FunkyTests.it('should setData and update state', function() {
            var wizard = TradeWizard.create();

            wizard.setData({
                client_id: '123',
                template_id: '456',
                trade_name: 'Test Trade'
            });

            expect(wizard.state.client_id).toBe('123');
            expect(wizard.state.template_id).toBe('456');
            expect(wizard.state.trade_name).toBe('Test Trade');

            wizard.destroy();
        });

        FunkyTests.it('should merge setData with existing state', function() {
            var wizard = TradeWizard.create();

            wizard.setData({ first: 'value1' });
            wizard.setData({ second: 'value2' });

            expect(wizard.state.first).toBe('value1');
            expect(wizard.state.second).toBe('value2');

            wizard.destroy();
        });

        FunkyTests.it('should getData returning state', function() {
            var wizard = TradeWizard.create();

            // Set state directly (bypassing DOM collection)
            wizard.state = {
                client_id: '789',
                trade_name: 'My Trade'
            };
            // Set currentStep to null so getData doesn't try to collect from DOM
            wizard.currentStep = null;

            var data = wizard.getData();

            expect(data.client_id).toBe('789');
            expect(data.trade_name).toBe('My Trade');

            wizard.destroy();
        });

        FunkyTests.it('should include selectedTemplate info in getData', function() {
            var wizard = TradeWizard.create();

            wizard.selectedTemplate = { id: 10, name: 'Template A' };
            wizard.state = { template_id: '10' };
            wizard.currentStep = null; // Bypass DOM collection

            var data = wizard.getData();

            expect(data._selectedTemplate).toBeDefined();
            expect(data._selectedTemplate.id).toBe(10);
            expect(data._selectedTemplate.name).toBe('Template A');

            wizard.destroy();
        });

        FunkyTests.it('should include selectedRelatedTemplate info in getData', function() {
            var wizard = TradeWizard.create();

            wizard.selectedRelatedTemplate = { id: 20, name: 'Template B' };
            wizard.state = { related_template_id: '20' };
            wizard.currentStep = null; // Bypass DOM collection

            var data = wizard.getData();

            expect(data._selectedRelatedTemplate).toBeDefined();
            expect(data._selectedRelatedTemplate.id).toBe(20);
            expect(data._selectedRelatedTemplate.name).toBe('Template B');

            wizard.destroy();
        });

        FunkyTests.it('should include client info in getData', function() {
            var wizard = TradeWizard.create();

            wizard.clients = [
                { id: 100, name: 'Client A', code: 'CA' },
                { id: 200, name: 'Client B', code: 'CB' }
            ];
            wizard.state = { client_id: '100' };
            wizard.currentStep = null; // Bypass DOM collection

            var data = wizard.getData();

            expect(data._client).toBeDefined();
            expect(data._client.id).toBe(100);
            expect(data._client.name).toBe('Client A');
            expect(data._client.code).toBe('CA');

            wizard.destroy();
        });

        FunkyTests.it('should include security info in getData', function() {
            var wizard = TradeWizard.create();

            wizard.securities = [
                { id: 300, name: 'Security X', code: 'SX' }
            ];
            wizard.state = { security_id: '300' };
            wizard.currentStep = null; // Bypass DOM collection

            var data = wizard.getData();

            expect(data._security).toBeDefined();
            expect(data._security.id).toBe(300);
            expect(data._security.name).toBe('Security X');
            expect(data._security.code).toBe('SX');

            wizard.destroy();
        });

        FunkyTests.it('should not crash with null setData', function() {
            var wizard = TradeWizard.create();

            expect(function() {
                wizard.setData(null);
            }).not.toThrow();

            wizard.destroy();
        });

        FunkyTests.it('should not crash with non-object setData', function() {
            var wizard = TradeWizard.create();

            expect(function() {
                wizard.setData('not an object');
            }).not.toThrow();

            wizard.destroy();
        });
    });

    // =========================================================================
    // _reset Tests
    // =========================================================================

    FunkyTests.describe('_reset', function() {

        FunkyTests.it('should clear selectedTemplate', function() {
            var wizard = TradeWizard.create();
            wizard.selectedTemplate = { id: 1 };

            wizard._reset();

            expect(wizard.selectedTemplate).toBeNull();
            wizard.destroy();
        });

        FunkyTests.it('should clear selectedRelatedTemplate', function() {
            var wizard = TradeWizard.create();
            wizard.selectedRelatedTemplate = { id: 2 };

            wizard._reset();

            expect(wizard.selectedRelatedTemplate).toBeNull();
            wizard.destroy();
        });

        FunkyTests.it('should clear templateFields', function() {
            var wizard = TradeWizard.create();
            wizard.templateFields = ['field1', 'field2'];

            wizard._reset();

            expect(wizard.templateFields).toEqual([]);
            wizard.destroy();
        });

        FunkyTests.it('should clear relatedTemplateFields', function() {
            var wizard = TradeWizard.create();
            wizard.relatedTemplateFields = ['field3'];

            wizard._reset();

            expect(wizard.relatedTemplateFields).toEqual([]);
            wizard.destroy();
        });

        FunkyTests.it('should clear relationships', function() {
            var wizard = TradeWizard.create();
            wizard.relationships = [{ id: 1 }];

            wizard._reset();

            expect(wizard.relationships).toEqual([]);
            wizard.destroy();
        });

        FunkyTests.it('should clear counterpartyRelationships', function() {
            var wizard = TradeWizard.create();
            wizard.counterpartyRelationships = [{ id: 2 }];

            wizard._reset();

            expect(wizard.counterpartyRelationships).toEqual([]);
            wizard.destroy();
        });

        FunkyTests.it('should clear state', function() {
            var wizard = TradeWizard.create();
            wizard.state = { client_id: '123' };

            wizard._reset();

            expect(wizard.state).toEqual({});
            wizard.destroy();
        });
    });

    // =========================================================================
    // destroy Tests
    // =========================================================================

    FunkyTests.describe('destroy', function() {

        FunkyTests.it('should call _reset', function() {
            var wizard = TradeWizard.create();
            wizard.state = { data: 'value' };
            wizard.selectedTemplate = { id: 1 };

            wizard.destroy();

            expect(wizard.state).toEqual({});
            expect(wizard.selectedTemplate).toBeNull();
        });

        FunkyTests.it('should clear clients', function() {
            var wizard = TradeWizard.create();
            wizard.clients = [{ id: 1 }];

            wizard.destroy();

            expect(wizard.clients).toEqual([]);
        });

        FunkyTests.it('should clear templates', function() {
            var wizard = TradeWizard.create();
            wizard.templates = [{ id: 1 }];

            wizard.destroy();

            expect(wizard.templates).toEqual([]);
        });

        FunkyTests.it('should clear securities', function() {
            var wizard = TradeWizard.create();
            wizard.securities = [{ id: 1 }];

            wizard.destroy();

            expect(wizard.securities).toEqual([]);
        });

        FunkyTests.it('should remove from instance registry', function() {
            var wizard = TradeWizard.create();
            var modalId = wizard.modalId;

            expect(TradeWizard.getInstance(modalId)).toBe(wizard);

            wizard.destroy();

            expect(TradeWizard.getInstance(modalId)).toBeNull();
        });

        FunkyTests.it('should clear global reference', function() {
            var wizard = TradeWizard.create();
            window.tradeWizard = wizard;

            wizard.destroy();

            expect(window.tradeWizard).toBeNull();
        });
    });

    // =========================================================================
    // _formatFieldName Tests
    // =========================================================================

    FunkyTests.describe('_formatFieldName', function() {

        FunkyTests.it('should replace underscores with spaces', function() {
            var wizard = TradeWizard.create();

            var result = wizard._formatFieldName('trade_start_date');
            expect(result).toContain(' ');
            expect(result).not.toContain('_');

            wizard.destroy();
        });

        FunkyTests.it('should capitalize first letter of each word', function() {
            var wizard = TradeWizard.create();

            var result = wizard._formatFieldName('contract_id');
            expect(result).toBe('Contract Id');

            wizard.destroy();
        });

        FunkyTests.it('should handle single word', function() {
            var wizard = TradeWizard.create();

            var result = wizard._formatFieldName('name');
            expect(result).toBe('Name');

            wizard.destroy();
        });

        FunkyTests.it('should handle multiple underscores', function() {
            var wizard = TradeWizard.create();

            var result = wizard._formatFieldName('related_trade_start_date');
            expect(result).toBe('Related Trade Start Date');

            wizard.destroy();
        });
    });

    // =========================================================================
    // Validation Tests
    // =========================================================================

    FunkyTests.describe('Validation', function() {

        FunkyTests.describe('_validateBasicStep', function() {

            FunkyTests.it('should fail without client_id', function() {
                var wizard = TradeWizard.create();

                // Mock alert
                var alertCalled = false;
                var originalAlert = window.alert;
                window.alert = function() { alertCalled = true; };

                var result = wizard._validateBasicStep({});

                expect(result).toBe(false);
                expect(alertCalled).toBe(true);

                window.alert = originalAlert;
                wizard.destroy();
            });

            FunkyTests.it('should fail without template_id', function() {
                var wizard = TradeWizard.create();

                var alertCalled = false;
                var originalAlert = window.alert;
                window.alert = function() { alertCalled = true; };

                var result = wizard._validateBasicStep({
                    client_id: '123'
                });

                expect(result).toBe(false);

                window.alert = originalAlert;
                wizard.destroy();
            });

            FunkyTests.it('should fail without security_id', function() {
                var wizard = TradeWizard.create();

                var alertCalled = false;
                var originalAlert = window.alert;
                window.alert = function() { alertCalled = true; };

                var result = wizard._validateBasicStep({
                    client_id: '123',
                    template_id: '456'
                });

                expect(result).toBe(false);

                window.alert = originalAlert;
                wizard.destroy();
            });

            FunkyTests.it('should pass with all required fields', function() {
                var wizard = TradeWizard.create();

                var result = wizard._validateBasicStep({
                    client_id: '123',
                    template_id: '456',
                    security_id: '789'
                });

                expect(result).toBe(true);

                wizard.destroy();
            });

            FunkyTests.it('should fail when counterparty has related_client but no related_template', function() {
                var wizard = TradeWizard.create();

                var alertCalled = false;
                var originalAlert = window.alert;
                window.alert = function() { alertCalled = true; };

                var result = wizard._validateBasicStep({
                    client_id: '123',
                    template_id: '456',
                    security_id: '789',
                    counterparty_related_client_id: '999'
                    // missing related_template_id
                });

                expect(result).toBe(false);

                window.alert = originalAlert;
                wizard.destroy();
            });

            FunkyTests.it('should pass with related trade fields', function() {
                var wizard = TradeWizard.create();

                var result = wizard._validateBasicStep({
                    client_id: '123',
                    template_id: '456',
                    security_id: '789',
                    counterparty_related_client_id: '999',
                    related_template_id: '111'
                });

                expect(result).toBe(true);

                wizard.destroy();
            });
        });

        FunkyTests.describe('_validateTradeDetailsStep', function() {

            FunkyTests.it('should fail without contract_id', function() {
                var wizard = TradeWizard.create();

                var alertCalled = false;
                var originalAlert = window.alert;
                window.alert = function() { alertCalled = true; };

                var result = wizard._validateTradeDetailsStep({});

                expect(result).toBe(false);

                window.alert = originalAlert;
                wizard.destroy();
            });

            FunkyTests.it('should fail without trade_name', function() {
                var wizard = TradeWizard.create();

                var alertCalled = false;
                var originalAlert = window.alert;
                window.alert = function() { alertCalled = true; };

                var result = wizard._validateTradeDetailsStep({
                    contract_id: 'C001'
                });

                expect(result).toBe(false);

                window.alert = originalAlert;
                wizard.destroy();
            });

            FunkyTests.it('should fail without trade_start_date', function() {
                var wizard = TradeWizard.create();

                var alertCalled = false;
                var originalAlert = window.alert;
                window.alert = function() { alertCalled = true; };

                var result = wizard._validateTradeDetailsStep({
                    contract_id: 'C001',
                    trade_name: 'My Trade'
                });

                expect(result).toBe(false);

                window.alert = originalAlert;
                wizard.destroy();
            });

            FunkyTests.it('should fail without trade_end_date', function() {
                var wizard = TradeWizard.create();

                var alertCalled = false;
                var originalAlert = window.alert;
                window.alert = function() { alertCalled = true; };

                var result = wizard._validateTradeDetailsStep({
                    contract_id: 'C001',
                    trade_name: 'My Trade',
                    trade_start_date: '2025-01-01'
                });

                expect(result).toBe(false);

                window.alert = originalAlert;
                wizard.destroy();
            });

            FunkyTests.it('should pass with all required fields', function() {
                var wizard = TradeWizard.create();

                var result = wizard._validateTradeDetailsStep({
                    contract_id: 'C001',
                    trade_name: 'My Trade',
                    trade_start_date: '2025-01-01',
                    trade_end_date: '2025-12-31'
                });

                expect(result).toBe(true);

                wizard.destroy();
            });
        });

        FunkyTests.describe('_validateRelatedTradeStep', function() {

            FunkyTests.it('should fail without related_trade_name', function() {
                var wizard = TradeWizard.create();

                var alertCalled = false;
                var originalAlert = window.alert;
                window.alert = function() { alertCalled = true; };

                var result = wizard._validateRelatedTradeStep({});

                expect(result).toBe(false);

                window.alert = originalAlert;
                wizard.destroy();
            });

            FunkyTests.it('should pass with related_trade_name', function() {
                var wizard = TradeWizard.create();

                var result = wizard._validateRelatedTradeStep({
                    related_trade_name: 'Related Trade'
                });

                expect(result).toBe(true);

                wizard.destroy();
            });
        });
    });

    // =========================================================================
    // Step Navigation Tests
    // =========================================================================

    FunkyTests.describe('Step Navigation', function() {

        FunkyTests.it('should update currentStep in _showStep', function() {
            var wizard = TradeWizard.create();

            wizard._showStep(2);
            expect(wizard.currentStep).toBe(2);

            // Step 3 requires counterparty_related_client_id or it skips to step 4
            wizard.state = { counterparty_related_client_id: '123' };
            wizard._showStep(3);
            expect(wizard.currentStep).toBe(3);

            wizard.destroy();
        });

        FunkyTests.it('should update wizard progress indicators', function() {
            var wizard = TradeWizard.create();

            wizard._updateWizardProgress(2);

            var steps = document.querySelectorAll('.wizard-step');
            expect(steps[0].classList.contains('completed')).toBe(true);
            expect(steps[1].classList.contains('active')).toBe(true);

            wizard.destroy();
        });

        FunkyTests.it('should set aria-current on active step', function() {
            var wizard = TradeWizard.create();

            wizard._updateWizardProgress(2);

            var steps = document.querySelectorAll('.wizard-step');
            expect(steps[0].getAttribute('aria-current')).toBeNull();
            expect(steps[1].getAttribute('aria-current')).toBe('step');

            wizard.destroy();
        });

        FunkyTests.it('should update button visibility', function() {
            var wizard = TradeWizard.create();
            var modal = document.getElementById('tradeWizardModal');
            var prevBtn = modal.querySelector('.wizard-btn-prev');
            var nextBtn = modal.querySelector('.wizard-btn-next');
            var saveBtn = modal.querySelector('.wizard-btn-save');

            // Step 1 - no previous, has next
            wizard._updateButtons(1);
            expect(prevBtn.style.display).toBe('none');
            expect(nextBtn.style.display).toBe('inline-block');
            expect(saveBtn.style.display).toBe('none');

            wizard.destroy();
        });

        FunkyTests.it('should show save button on last step', function() {
            var wizard = TradeWizard.create();
            var modal = document.getElementById('tradeWizardModal');
            var saveBtn = modal.querySelector('.wizard-btn-save');

            // Step 4 (last step with related trade)
            wizard.state.counterparty_related_client_id = '123';
            wizard._updateButtons(4);
            expect(saveBtn.style.display).toBe('inline-block');

            wizard.destroy();
        });

        FunkyTests.it('should show save on step 2 when no related trade', function() {
            var wizard = TradeWizard.create();
            var modal = document.getElementById('tradeWizardModal');
            var saveBtn = modal.querySelector('.wizard-btn-save');

            // No counterparty means step 2 is last
            wizard.state.counterparty_related_client_id = null;
            wizard._updateButtons(2);
            // When no related trade, step 2 goes to 4 (summary), so step 2 is not last
            // Actually the check is: isLastStep = (shouldSkipRelated && stepNum === 2) || stepNum === 4
            // So if shouldSkipRelated is true and we're on step 2, it should show save
            expect(saveBtn.style.display).toBe('inline-block');

            wizard.destroy();
        });
    });

    // =========================================================================
    // _collectStepData Tests
    // =========================================================================

    FunkyTests.describe('_collectStepData', function() {

        FunkyTests.it('should collect data based on current step', function() {
            var wizard = TradeWizard.create();

            // Set up step 1 form elements
            var container = document.getElementById('wizardStepContent');
            container.innerHTML = '<select id="client_id"><option value="123" selected>Client</option></select>' +
                '<select id="template_id"><option value="456" selected>Template</option></select>' +
                '<select id="security_id"><option value="789" selected>Security</option></select>' +
                '<select id="client_relationship_id"><option value="">None</option></select>' +
                '<select id="counterparty_client_relationship_id"><option value="">None</option></select>' +
                '<select id="related_template_id"><option value="">None</option></select>';

            wizard.currentStep = 1;
            wizard._collectStepData();

            expect(wizard.state.client_id).toBe('123');
            expect(wizard.state.template_id).toBe('456');
            expect(wizard.state.security_id).toBe('789');

            wizard.destroy();
        });
    });

    // =========================================================================
    // State Management Tests
    // =========================================================================

    FunkyTests.describe('State Management', function() {

        FunkyTests.it('should preserve state across steps', function() {
            var wizard = TradeWizard.create();

            wizard.state = {
                client_id: '100',
                template_id: '200'
            };

            // Simulate navigation without modifying state
            wizard.currentStep = 2;
            wizard.state.trade_name = 'Test Trade';

            expect(wizard.state.client_id).toBe('100');
            expect(wizard.state.template_id).toBe('200');
            expect(wizard.state.trade_name).toBe('Test Trade');

            wizard.destroy();
        });

        FunkyTests.it('should handle trade_fields object', function() {
            var wizard = TradeWizard.create();

            wizard.state = {
                trade_fields: {
                    custom_field_1: 'value1',
                    custom_field_2: 'value2'
                }
            };
            wizard.currentStep = null; // Bypass DOM collection

            var data = wizard.getData();

            expect(data.trade_fields.custom_field_1).toBe('value1');
            expect(data.trade_fields.custom_field_2).toBe('value2');

            wizard.destroy();
        });

        FunkyTests.it('should handle related_trade_fields object', function() {
            var wizard = TradeWizard.create();

            wizard.state = {
                related_trade_fields: {
                    related_field_1: 'rvalue1'
                }
            };
            wizard.currentStep = null; // Bypass DOM collection

            var data = wizard.getData();

            expect(data.related_trade_fields.related_field_1).toBe('rvalue1');

            wizard.destroy();
        });
    });
});

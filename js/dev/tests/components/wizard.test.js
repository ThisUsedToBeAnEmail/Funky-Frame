/**
 * Funky.Wizard Tests
 *
 * Tests for the multi-step wizard component.
 * Note: These tests require Funky.Modal to be available.
 */

describe('Funky.Component.Wizard', function() {

    var Wizard = Funky.Wizard;
    var fixture;

    beforeEach(function() {
        // Create wizard modal structure
        fixture = FunkyTests.fixture(
            '<div class="modal" id="test-wizard-modal" tabindex="-1">' +
                '<div class="modal-dialog">' +
                    '<div class="modal-content">' +
                        '<div class="modal-header">' +
                            '<h5 class="modal-title">Wizard</h5>' +
                            '<button type="button" class="btn-close" data-bs-dismiss="modal"></button>' +
                        '</div>' +
                        '<div class="modal-body">' +
                            '<div class="wizard-steps">' +
                                '<div class="wizard-step" data-step="1"></div>' +
                                '<div class="wizard-step" data-step="2"></div>' +
                            '</div>' +
                            '<div id="wizard-step-1" style="display: block;">' +
                                '<div id="wizard-step-1-editor"></div>' +
                            '</div>' +
                            '<div id="wizard-step-2" style="display: none;">' +
                                '<div id="wizard-step-2-container"></div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="modal-footer">' +
                            '<button id="wizardPrevBtn" style="display: none;">Previous</button>' +
                            '<button id="wizardNextBtn">Next</button>' +
                            '<button id="wizardSaveBtn" style="display: none;">' +
                                '<span id="wizardSaveSpinner" style="display: none;"></span>' +
                                '<span id="wizardSaveText">Save</span>' +
                            '</button>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>'
        );
    });

    afterEach(function() {
        // Clean up wizard instance
        var instance = Wizard.getInstance('test-wizard-modal');
        if (instance) {
            instance.destroy();
        }
        fixture.destroy();
    });

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('Wizard')).toBe(true);
        });

        it('has create method', function() {
            expect(typeof Wizard.create).toBe('function');
        });

        it('has getInstance method', function() {
            expect(typeof Wizard.getInstance).toBe('function');
        });

        it('has constructor property', function() {
            expect(Wizard.constructor).toBeDefined();
        });

    });

    describe('Wizard.create()', function() {

        it('throws without modalId', function() {
            expect(function() {
                Wizard.create({});
            }).toThrow();
        });

        it('throws without steps', function() {
            expect(function() {
                Wizard.create({ modalId: 'test-wizard-modal' });
            }).toThrow();
        });

        it('throws with empty steps array', function() {
            expect(function() {
                Wizard.create({ modalId: 'test-wizard-modal', steps: [] });
            }).toThrow();
        });

        it('creates wizard with valid config', function() {
            var wizard = Wizard.create({
                modalId: 'test-wizard-modal',
                title: 'Test Wizard',
                steps: [
                    { type: 'custom', stateKey: 'step1' },
                    { type: 'custom', stateKey: 'step2' }
                ]
            });

            expect(wizard).toBeDefined();
        });

        it('registers instance', function() {
            Wizard.create({
                modalId: 'test-wizard-modal',
                title: 'Test',
                steps: [{ type: 'custom', stateKey: 'data' }]
            });

            var instance = Wizard.getInstance('test-wizard-modal');
            expect(instance).toBeDefined();
        });

    });

    describe('Wizard modes', function() {

        var wizard;

        beforeEach(function() {
            wizard = Wizard.create({
                modalId: 'test-wizard-modal',
                title: 'Test',
                steps: [
                    { type: 'custom', stateKey: 'data', onInit: function() {} }
                ]
            });
        });

        it('create() sets mode to create', function() {
            wizard.create();
            expect(wizard.mode).toBe('create');
        });

        it('edit() sets mode to edit', function() {
            wizard.edit({ existing: 'data' });
            expect(wizard.mode).toBe('edit');
        });

        it('edit() populates state with data', function() {
            wizard.edit({ field: 'value' });
            expect(wizard.state.field).toBe('value');
        });

        it('create() accepts initial data', function() {
            wizard.create({ initial: 'value' });
            expect(wizard.state.initial).toBe('value');
        });

    });

    describe('Step navigation', function() {

        var wizard;

        beforeEach(function() {
            wizard = Wizard.create({
                modalId: 'test-wizard-modal',
                title: 'Test',
                steps: [
                    { type: 'custom', stateKey: 'step1', onInit: function() {} },
                    { type: 'custom', stateKey: 'step2', onInit: function() {} }
                ]
            });
            wizard.create();
        });

        it('starts at step 1', function() {
            expect(wizard.currentStep).toBe(1);
        });

        it('next() advances to next step', function() {
            wizard.next();
            expect(wizard.currentStep).toBe(2);
        });

        it('previous() goes back', function() {
            wizard.next();
            wizard.previous();
            expect(wizard.currentStep).toBe(1);
        });

        it('previous() does nothing on first step', function() {
            wizard.previous();
            expect(wizard.currentStep).toBe(1);
        });

        it('next() does nothing on last step', function() {
            wizard.next();
            wizard.next();
            expect(wizard.currentStep).toBe(2);
        });

    });

    describe('State management', function() {

        var wizard;

        beforeEach(function() {
            wizard = Wizard.create({
                modalId: 'test-wizard-modal',
                title: 'Test',
                steps: [
                    { type: 'custom', stateKey: 'data', onInit: function() {} }
                ]
            });
        });

        it('getState() returns current state', function() {
            wizard.create({ initial: 'value' });
            var state = wizard.getState();

            expect(state.initial).toBe('value');
        });

        it('getState() returns copy, not reference', function() {
            wizard.create({ field: 'original' });
            var state = wizard.getState();
            state.field = 'modified';

            expect(wizard.state.field).toBe('original');
        });

    });

    describe('reset()', function() {

        var wizard;

        beforeEach(function() {
            wizard = Wizard.create({
                modalId: 'test-wizard-modal',
                title: 'Test',
                steps: [
                    { type: 'custom', stateKey: 'step1', onInit: function() {} },
                    { type: 'custom', stateKey: 'step2', onInit: function() {} }
                ]
            });
            wizard.create();
        });

        it('resets currentStep to 1', function() {
            wizard.next();
            wizard.reset();

            expect(wizard.currentStep).toBe(1);
        });

        it('clears editors', function() {
            wizard.editors = { 1: { destroy: FunkyTests.spy() } };
            wizard.reset();

            expect(Object.keys(wizard.editors).length).toBe(0);
        });

    });

    describe('Bindable Interface', function() {

        var wizard;

        beforeEach(function() {
            wizard = Wizard.create({
                modalId: 'test-wizard-modal',
                title: 'Test',
                steps: [
                    { type: 'custom', stateKey: 'field1', onInit: function() {} }
                ]
            });
            wizard.create();
        });

        it('has setData method', function() {
            expect(typeof wizard.setData).toBe('function');
        });

        it('has getData method', function() {
            expect(typeof wizard.getData).toBe('function');
        });

        it('has destroy method', function() {
            expect(typeof wizard.destroy).toBe('function');
        });

        it('setData updates state', function() {
            wizard.setData({ field1: 'new value' });
            expect(wizard.state.field1).toBe('new value');
        });

        it('getData returns state', function() {
            wizard.state.testField = 'test value';
            var data = wizard.getData();

            expect(data.testField).toBe('test value');
        });

    });

    describe('save()', function() {

        it('calls onSave callback', function() {
            var saveCalled = false;
            var savedState = null;
            var savedMode = null;

            var wizard = Wizard.create({
                modalId: 'test-wizard-modal',
                title: 'Test',
                steps: [
                    { type: 'custom', stateKey: 'data', onInit: function() {} }
                ],
                onSave: function(state, mode) {
                    saveCalled = true;
                    savedState = state;
                    savedMode = mode;
                    return Promise.resolve();
                }
            });

            wizard.create({ value: 42 });
            wizard.save();

            return FunkyTests.delay(50).then(function() {
                expect(saveCalled).toBe(true);
                expect(savedState.value).toBe(42);
                expect(savedMode).toBe('create');
            });
        });

    });

    describe('destroy()', function() {

        it('clears state', function() {
            var wizard = Wizard.create({
                modalId: 'test-wizard-modal',
                title: 'Test',
                steps: [{ type: 'custom', stateKey: 'data', onInit: function() {} }]
            });

            wizard.create({ value: 'test' });
            wizard.destroy();

            expect(Object.keys(wizard.state).length).toBe(0);
        });

        it('unregisters from instances', function() {
            var wizard = Wizard.create({
                modalId: 'test-wizard-modal',
                title: 'Test',
                steps: [{ type: 'custom', stateKey: 'data', onInit: function() {} }]
            });

            wizard.destroy();

            // getInstance returns null for non-existent instances (via Registry)
            expect(Wizard.getInstance('test-wizard-modal')).toBeNull();
        });

    });

    describe('Step types', function() {

        describe('custom step', function() {

            it('calls onInit for custom steps', function() {
                var initCalled = false;
                var receivedWizard = null;
                var receivedStepNum = null;

                var wizard = Wizard.create({
                    modalId: 'test-wizard-modal',
                    title: 'Test',
                    steps: [{
                        type: 'custom',
                        stateKey: 'data',
                        onInit: function(w, stepNum) {
                            initCalled = true;
                            receivedWizard = w;
                            receivedStepNum = stepNum;
                        }
                    }]
                });

                wizard.create();

                expect(initCalled).toBe(true);
                expect(receivedWizard).toBe(wizard);
                expect(receivedStepNum).toBe(1);
            });

        });

        describe('checkboxes step', function() {

            var wizard;

            beforeEach(function() {
                wizard = Wizard.create({
                    modalId: 'test-wizard-modal',
                    title: 'Test',
                    steps: [
                        { type: 'custom', stateKey: 'step1', onInit: function() {} },
                        {
                            type: 'checkboxes',
                            stateKey: 'selectedItems',
                            containerId: 'wizard-step-2-container',
                            getOptions: function() {
                                return [
                                    { value: 'opt1', label: 'Option 1' },
                                    { value: 'opt2', label: 'Option 2' },
                                    { value: 'opt3', label: 'Option 3' }
                                ];
                            }
                        }
                    ]
                });
            });

            it('renders checkbox options', function() {
                wizard.create();
                wizard.next();

                var container = document.getElementById('wizard-step-2-container');
                var checkboxes = container.querySelectorAll('input[type="checkbox"]');

                expect(checkboxes.length).toBe(3);
            });

            it('tracks selected values in state', function() {
                wizard.create();
                wizard.next();

                var container = document.getElementById('wizard-step-2-container');
                var checkbox = container.querySelector('input[value="opt1"]');

                checkbox.checked = true;
                checkbox.dispatchEvent(new Event('change'));

                expect(wizard.state.selectedItems).toContain('opt1');
            });

        });

    });

});

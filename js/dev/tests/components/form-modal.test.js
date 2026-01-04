/**
 * Funky.FormModal Tests
 *
 * Tests for the dynamic create/edit form modal component.
 */

describe('Funky.Component.FormModal', function() {

    var FormModal = Funky.FormModal;
    var fixture;
    var initializedModals = [];

    // Helper to track initialized modals for cleanup
    // Returns a Promise since FormModal.init is async
    function initModal(config) {
        var promise = FormModal.init(config);
        initializedModals.push(config.modalId);
        return promise;
    }

    beforeEach(function() {
        fixture = FunkyTests.fixture();
        initializedModals = [];
    });

    afterEach(function() {
        // Cleanup all initialized modals
        initializedModals.forEach(function(modalId) {
            try {
                FormModal.destroy(modalId);
                var modal = document.getElementById(modalId);
                if (modal) {
                    modal.remove();
                }
            } catch (e) {
                // Ignore cleanup errors
            }
        });
        initializedModals = [];
        fixture.destroy();
    });

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('FormModal')).toBe(true);
        });

        it('has init method', function() {
            expect(typeof FormModal.init).toBe('function');
        });

        it('has create method', function() {
            expect(typeof FormModal.create).toBe('function');
        });

        it('has edit method', function() {
            expect(typeof FormModal.edit).toBe('function');
        });

        it('has save method', function() {
            expect(typeof FormModal.save).toBe('function');
        });

        it('has hide method', function() {
            expect(typeof FormModal.hide).toBe('function');
        });

        it('has getEditor method', function() {
            expect(typeof FormModal.getEditor).toBe('function');
        });

        it('has getData method', function() {
            expect(typeof FormModal.getData).toBe('function');
        });

        it('has setData method', function() {
            expect(typeof FormModal.setData).toBe('function');
        });

        it('has getConfig method', function() {
            expect(typeof FormModal.getConfig).toBe('function');
        });

        it('has destroy method', function() {
            expect(typeof FormModal.destroy).toBe('function');
        });

        it('has rebuildEditor method', function() {
            expect(typeof FormModal.rebuildEditor).toBe('function');
        });

        it('has updateFieldOptions method', function() {
            expect(typeof FormModal.updateFieldOptions).toBe('function');
        });

        it('has _instances registry', function() {
            expect(typeof FormModal._instances).toBe('object');
        });

    });

    describe('init()', function() {

        it('requires modalId', function() {
            // Should not throw, but log error
            FormModal.init({});

            // No modal created
            expect(document.querySelector('.form-modal-editor')).toBeNull();
        });

        it('creates modal element', function(done) {
            initModal({
                modalId: 'test-form-modal',
                entity: 'test',
                entityLabel: 'Test',
                schema: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' }
                    }
                },
                apiUrl: '/api/tests'
            }).then(function() {
                var modal = document.getElementById('test-form-modal');
                expect(modal).not.toBeNull();
                done();
            }).catch(done.fail);
        });

        it('creates modal with correct structure', function(done) {
            initModal({
                modalId: 'structure-test-modal',
                entity: 'test',
                entityLabel: 'Test Item',
                schema: { type: 'object', properties: {} },
                apiUrl: '/api/tests'
            }).then(function() {
                var modal = document.getElementById('structure-test-modal');

                expect(modal.querySelector('.modal-header')).not.toBeNull();
                expect(modal.querySelector('.modal-body')).not.toBeNull();
                expect(modal.querySelector('.modal-footer')).not.toBeNull();
                expect(modal.querySelector('.form-modal-editor')).not.toBeNull();
                expect(modal.querySelector('.form-modal-save')).not.toBeNull();
                done();
            }).catch(done.fail);
        });

        it('stores configuration', function(done) {
            initModal({
                modalId: 'config-test-modal',
                entity: 'widget',
                entityLabel: 'Widget',
                schema: { type: 'object', properties: {} },
                apiUrl: '/api/widgets'
            }).then(function() {
                var config = FormModal.getConfig('config-test-modal');
                expect(config).not.toBeNull();
                expect(config.entity).toBe('widget');
                expect(config.entityLabel).toBe('Widget');
                done();
            }).catch(done.fail);
        });

        it('registers in _instances for LiveBinding', function(done) {
            initModal({
                modalId: 'livebind-test-modal',
                entity: 'item',
                schema: { type: 'object', properties: {} },
                apiUrl: '/api/items'
            }).then(function() {
                expect(FormModal._instances['livebind-test-modal']).toBeDefined();
                expect(typeof FormModal._instances['livebind-test-modal'].setData).toBe('function');
                expect(typeof FormModal._instances['livebind-test-modal'].getData).toBe('function');
                done();
            }).catch(done.fail);
        });

    });

    describe('getConfig()', function() {

        it('returns config for initialized modal', function(done) {
            initModal({
                modalId: 'get-config-test',
                entity: 'product',
                entityLabel: 'Product',
                schema: { type: 'object', properties: {} },
                apiUrl: '/api/products'
            }).then(function() {
                var config = FormModal.getConfig('get-config-test');
                expect(config.entity).toBe('product');
                done();
            }).catch(done.fail);
        });

        it('returns null for non-existent modal', function() {
            var config = FormModal.getConfig('non-existent-modal');
            expect(config).toBeNull();
        });

    });

    describe('getEditor()', function() {

        it('returns null when no editor exists', function() {
            var editor = FormModal.getEditor('no-editor-modal');
            expect(editor).toBeNull();
        });

    });

    describe('getData()', function() {

        it('returns null when no editor exists', function() {
            var data = FormModal.getData('no-data-modal');
            expect(data).toBeNull();
        });

    });

    describe('setData()', function() {

        it('returns false when no editor exists', function() {
            var result = FormModal.setData('no-editor-modal', { name: 'test' });
            expect(result).toBe(false);
        });

        it('returns false for invalid data', function(done) {
            initModal({
                modalId: 'setdata-test',
                schema: { type: 'object', properties: {} },
                apiUrl: '/api/test'
            }).then(function() {
                var result = FormModal.setData('setdata-test', null);
                expect(result).toBe(false);
                done();
            }).catch(done.fail);
        });

    });

    describe('destroy()', function() {

        it('removes config', function(done) {
            initModal({
                modalId: 'destroy-test-modal',
                entity: 'item',
                schema: { type: 'object', properties: {} },
                apiUrl: '/api/items'
            }).then(function() {
                expect(FormModal.getConfig('destroy-test-modal')).not.toBeNull();

                FormModal.destroy('destroy-test-modal');

                expect(FormModal.getConfig('destroy-test-modal')).toBeNull();
                done();
            }).catch(done.fail);
        });

        it('removes from _instances registry', function(done) {
            initModal({
                modalId: 'destroy-instance-test',
                entity: 'item',
                schema: { type: 'object', properties: {} },
                apiUrl: '/api/items'
            }).then(function() {
                expect(FormModal._instances['destroy-instance-test']).toBeDefined();

                FormModal.destroy('destroy-instance-test');

                expect(FormModal._instances['destroy-instance-test']).toBeUndefined();
                done();
            }).catch(done.fail);
        });

    });

    describe('Modal structure', function() {

        it('creates close button', function(done) {
            initModal({
                modalId: 'close-btn-test',
                schema: { type: 'object', properties: {} },
                apiUrl: '/api/test'
            }).then(function() {
                var modal = document.getElementById('close-btn-test');
                var closeBtn = modal.querySelector('.btn-close');

                expect(closeBtn).not.toBeNull();
                expect(closeBtn.getAttribute('aria-label')).toBe('Close');
                done();
            }).catch(done.fail);
        });

        it('creates save button', function(done) {
            initModal({
                modalId: 'save-btn-test',
                schema: { type: 'object', properties: {} },
                apiUrl: '/api/test'
            }).then(function() {
                var modal = document.getElementById('save-btn-test');
                var saveBtn = modal.querySelector('.form-modal-save');

                expect(saveBtn).not.toBeNull();
                done();
            }).catch(done.fail);
        });

        it('creates loading indicator', function(done) {
            initModal({
                modalId: 'loading-test',
                schema: { type: 'object', properties: {} },
                apiUrl: '/api/test'
            }).then(function() {
                var modal = document.getElementById('loading-test');
                var loading = modal.querySelector('.form-modal-loading');

                expect(loading).not.toBeNull();
                expect(loading.getAttribute('role')).toBe('status');
                done();
            }).catch(done.fail);
        });

        it('creates error container', function(done) {
            initModal({
                modalId: 'error-container-test',
                schema: { type: 'object', properties: {} },
                apiUrl: '/api/test'
            }).then(function() {
                var modal = document.getElementById('error-container-test');
                var errorEl = modal.querySelector('.form-modal-error');

                expect(errorEl).not.toBeNull();
                expect(errorEl.getAttribute('role')).toBe('alert');
                done();
            }).catch(done.fail);
        });

        it('creates editor container', function(done) {
            initModal({
                modalId: 'editor-container-test',
                schema: { type: 'object', properties: {} },
                apiUrl: '/api/test'
            }).then(function() {
                var modal = document.getElementById('editor-container-test');
                var editor = modal.querySelector('.form-modal-editor');

                expect(editor).not.toBeNull();
                done();
            }).catch(done.fail);
        });

    });

    describe('Accessibility', function() {

        it('modal has role="dialog"', function(done) {
            initModal({
                modalId: 'a11y-role-test',
                schema: { type: 'object', properties: {} },
                apiUrl: '/api/test'
            }).then(function() {
                var modal = document.getElementById('a11y-role-test');
                expect(modal.getAttribute('role')).toBe('dialog');
                done();
            }).catch(done.fail);
        });

        it('modal has aria-modal="true"', function(done) {
            initModal({
                modalId: 'a11y-modal-test',
                schema: { type: 'object', properties: {} },
                apiUrl: '/api/test'
            }).then(function() {
                var modal = document.getElementById('a11y-modal-test');
                expect(modal.getAttribute('aria-modal')).toBe('true');
                done();
            }).catch(done.fail);
        });

        it('modal has aria-labelledby', function(done) {
            initModal({
                modalId: 'a11y-label-test',
                schema: { type: 'object', properties: {} },
                apiUrl: '/api/test'
            }).then(function() {
                var modal = document.getElementById('a11y-label-test');
                expect(modal.getAttribute('aria-labelledby')).toBe('a11y-label-test-title');
                done();
            }).catch(done.fail);
        });

        it('title has matching ID', function(done) {
            initModal({
                modalId: 'a11y-title-test',
                entityLabel: 'Test',
                schema: { type: 'object', properties: {} },
                apiUrl: '/api/test'
            }).then(function() {
                var modal = document.getElementById('a11y-title-test');
                var title = modal.querySelector('#a11y-title-test-title');

                expect(title).not.toBeNull();
                done();
            }).catch(done.fail);
        });

        it('loading indicator has aria-live', function(done) {
            initModal({
                modalId: 'a11y-loading-test',
                schema: { type: 'object', properties: {} },
                apiUrl: '/api/test'
            }).then(function() {
                var modal = document.getElementById('a11y-loading-test');
                var loading = modal.querySelector('.form-modal-loading');

                expect(loading.getAttribute('aria-live')).toBe('polite');
                done();
            }).catch(done.fail);
        });

    });

    describe('Config options', function() {

        it('supports entityLabel option', function(done) {
            initModal({
                modalId: 'entity-label-test',
                entityLabel: 'Custom Item',
                schema: { type: 'object', properties: {} },
                apiUrl: '/api/test'
            }).then(function() {
                var config = FormModal.getConfig('entity-label-test');
                expect(config.entityLabel).toBe('Custom Item');
                done();
            }).catch(done.fail);
        });

        it('supports entity option', function(done) {
            initModal({
                modalId: 'entity-test',
                entity: 'myEntity',
                schema: { type: 'object', properties: {} },
                apiUrl: '/api/test'
            }).then(function() {
                var config = FormModal.getConfig('entity-test');
                expect(config.entity).toBe('myEntity');
                done();
            }).catch(done.fail);
        });

        it('supports apiUrl option', function(done) {
            initModal({
                modalId: 'api-url-test',
                apiUrl: '/api/custom-endpoint',
                schema: { type: 'object', properties: {} }
            }).then(function() {
                var config = FormModal.getConfig('api-url-test');
                expect(config.apiUrl).toBe('/api/custom-endpoint');
                done();
            }).catch(done.fail);
        });

        it('supports onSave callback', function(done) {
            var onSaveFn = function() {};

            initModal({
                modalId: 'onsave-test',
                schema: { type: 'object', properties: {} },
                apiUrl: '/api/test',
                onSave: onSaveFn
            }).then(function() {
                var config = FormModal.getConfig('onsave-test');
                expect(config.onSave).toBe(onSaveFn);
                done();
            }).catch(done.fail);
        });

        it('supports enhanceSchema callback', function(done) {
            var enhanceFn = function(schema) { return schema; };

            initModal({
                modalId: 'enhance-test',
                schema: { type: 'object', properties: {} },
                apiUrl: '/api/test',
                enhanceSchema: enhanceFn
            }).then(function() {
                var config = FormModal.getConfig('enhance-test');
                expect(config.enhanceSchema).toBe(enhanceFn);
                done();
            }).catch(done.fail);
        });

        it('supports onFormChange callback', function(done) {
            var changeFn = function() {};

            initModal({
                modalId: 'formchange-test',
                schema: { type: 'object', properties: {} },
                apiUrl: '/api/test',
                onFormChange: changeFn
            }).then(function() {
                var config = FormModal.getConfig('formchange-test');
                expect(config.onFormChange).toBe(changeFn);
                done();
            }).catch(done.fail);
        });

        it('supports transformData callback', function(done) {
            var transformFn = function(data) { return data; };

            initModal({
                modalId: 'transform-test',
                schema: { type: 'object', properties: {} },
                apiUrl: '/api/test',
                transformData: transformFn
            }).then(function() {
                var config = FormModal.getConfig('transform-test');
                expect(config.transformData).toBe(transformFn);
                done();
            }).catch(done.fail);
        });

        it('supports modalSize option', function(done) {
            initModal({
                modalId: 'size-test',
                modalSize: 'modal-slide-panel-xl',
                schema: { type: 'object', properties: {} },
                apiUrl: '/api/test'
            }).then(function() {
                var modal = document.getElementById('size-test');
                expect(modal.classList.contains('modal-slide-panel-xl')).toBe(true);
                done();
            }).catch(done.fail);
        });

        it('supports theme option', function(done) {
            initModal({
                modalId: 'theme-test',
                theme: 'bootstrap5',
                schema: { type: 'object', properties: {} },
                apiUrl: '/api/test'
            }).then(function() {
                var config = FormModal.getConfig('theme-test');
                expect(config.theme).toBe('bootstrap5');
                done();
            }).catch(done.fail);
        });

    });

    describe('rebuildEditor()', function() {

        it('does nothing if no editor exists', function() {
            // Should not throw
            FormModal.rebuildEditor('no-editor-rebuild', {
                type: 'object',
                properties: {}
            });
        });

    });

    describe('updateFieldOptions()', function() {

        it('does nothing if no editor exists', function() {
            // Should not throw
            FormModal.updateFieldOptions('no-editor-field', 'root.field', {
                enum: ['a', 'b']
            });
        });

    });

    // =========================================================================
    // NATIVE FORM INTEGRATION (Phase 8)
    // =========================================================================

    describe('Native Form Integration', function() {

        describe('_shouldUseNativeForm()', function() {
            // Note: JSONEditor has been removed. _shouldUseNativeForm now always returns true.
            // These tests verify that all forms are treated as native regardless of config.

            it('returns true when useNativeForm: true', function() {
                var result = FormModal._shouldUseNativeForm({
                    useNativeForm: true,
                    schema: { type: 'object', properties: {} }
                });
                expect(result).toBe(true);
            });

            it('returns true even when useLegacyEditor: true (JSONEditor removed)', function() {
                var result = FormModal._shouldUseNativeForm({
                    useLegacyEditor: true,
                    schema: { fields: { name: { type: 'text' } } }
                });
                expect(result).toBe(true);
            });

            it('returns true when schema has fields property', function() {
                var result = FormModal._shouldUseNativeForm({
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        }
                    }
                });
                expect(result).toBe(true);
            });

            it('returns true when fields array is provided', function() {
                var result = FormModal._shouldUseNativeForm({
                    fields: [
                        { name: 'name', type: 'text' }
                    ]
                });
                expect(result).toBe(true);
            });

            it('returns true for JSON Schema format (converted via SchemaAdapter)', function() {
                var result = FormModal._shouldUseNativeForm({
                    schema: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' }
                        }
                    }
                });
                expect(result).toBe(true);
            });

            it('returns true by default (all forms are native)', function() {
                var result = FormModal._shouldUseNativeForm({
                    modalId: 'test-modal',
                    apiUrl: '/api/test'
                });
                expect(result).toBe(true);
            });

        });

        describe('Module methods for native form', function() {

            it('has _nativeFormInstances registry', function() {
                expect(typeof FormModal._nativeFormInstances).toBe('object');
            });

            it('has show method', function() {
                expect(typeof FormModal.show).toBe('function');
            });

            it('has getNativeForm method', function() {
                expect(typeof FormModal.getNativeForm).toBe('function');
            });

            it('has isNativeForm method', function() {
                expect(typeof FormModal.isNativeForm).toBe('function');
            });

        });

        describe('getNativeForm()', function() {

            it('returns null for non-existent modal', function() {
                var form = FormModal.getNativeForm('non-existent');
                expect(form).toBeNull();
            });

            it('returns form for any initialized modal', function(done) {
                // Note: JSONEditor has been removed, all modals are now native
                initModal({
                    modalId: 'any-modal',
                    schema: { type: 'object', properties: {} },
                    apiUrl: '/api/test'
                }).then(function() {
                    var form = FormModal.getNativeForm('any-modal');
                    expect(form).not.toBeNull();
                    done();
                }).catch(done.fail);
            });

        });

        describe('isNativeForm()', function() {

            it('returns false for non-existent modal', function() {
                var result = FormModal.isNativeForm('non-existent');
                expect(result).toBe(false);
            });

            it('returns true for any initialized modal', function(done) {
                // Note: JSONEditor has been removed, all modals are now native
                initModal({
                    modalId: 'native-check',
                    schema: { type: 'object', properties: {} },
                    apiUrl: '/api/test'
                }).then(function() {
                    var result = FormModal.isNativeForm('native-check');
                    expect(result).toBe(true);
                    done();
                }).catch(done.fail);
            });

        });

        describe('init() with native schema', function() {

            it('returns a Promise for native form', function() {
                var result = FormModal.init({
                    modalId: 'native-init-promise',
                    useNativeForm: true,
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        }
                    }
                });

                // Clean up
                initializedModals.push('native-init-promise');

                expect(result).toBeInstanceOf(Promise);
            });

            it('detects native schema automatically', function() {
                var result = FormModal.init({
                    modalId: 'native-auto-detect',
                    schema: {
                        fields: {
                            email: { type: 'email', label: 'Email' }
                        }
                    }
                });

                initializedModals.push('native-auto-detect');

                expect(result).toBeInstanceOf(Promise);
            });

        });

        describe('show() method', function() {

            it('returns a Promise', function() {
                var result = FormModal.show({
                    modalId: 'show-promise-test',
                    useNativeForm: true,
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        }
                    }
                });

                initializedModals.push('show-promise-test');

                expect(result).toBeInstanceOf(Promise);
            });

            it('returns Promise for JSONEditor too', function() {
                var result = FormModal.show({
                    modalId: 'show-jsoneditor-test',
                    schema: {
                        type: 'object',
                        properties: { name: { type: 'string' } }
                    },
                    apiUrl: '/api/test'
                });

                initializedModals.push('show-jsoneditor-test');

                expect(result).toBeInstanceOf(Promise);
            });

        });

        describe('Native form instance creation', function() {

            it('creates modal element for native form', function(done) {
                FormModal.init({
                    modalId: 'native-modal-create',
                    useNativeForm: true,
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        }
                    }
                }).then(function() {
                    var modal = document.getElementById('native-modal-create');
                    expect(modal).not.toBeNull();
                    expect(modal.classList.contains('modal')).toBe(true);

                    initializedModals.push('native-modal-create');
                    done();
                }).catch(done.fail);
            });

            it('registers native form in _nativeFormInstances', function(done) {
                FormModal.init({
                    modalId: 'native-registry-test',
                    useNativeForm: true,
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        }
                    }
                }).then(function() {
                    expect(FormModal._nativeFormInstances['native-registry-test']).toBeDefined();
                    expect(FormModal._nativeFormInstances['native-registry-test'].form).toBeDefined();

                    initializedModals.push('native-registry-test');
                    done();
                }).catch(done.fail);
            });

            it('isNativeForm returns true for native form modal', function(done) {
                FormModal.init({
                    modalId: 'isnative-test',
                    useNativeForm: true,
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        }
                    }
                }).then(function() {
                    expect(FormModal.isNativeForm('isnative-test')).toBe(true);

                    initializedModals.push('isnative-test');
                    done();
                }).catch(done.fail);
            });

            it('getNativeForm returns form instance', function(done) {
                FormModal.init({
                    modalId: 'getnative-test',
                    useNativeForm: true,
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        }
                    }
                }).then(function() {
                    var form = FormModal.getNativeForm('getnative-test');
                    expect(form).not.toBeNull();
                    expect(typeof form.getData).toBe('function');
                    expect(typeof form.setData).toBe('function');
                    expect(typeof form.validate).toBe('function');

                    initializedModals.push('getnative-test');
                    done();
                }).catch(done.fail);
            });

        });

        describe('Native form instance interface', function() {

            it('instance has getData method', function(done) {
                FormModal.init({
                    modalId: 'instance-getdata',
                    useNativeForm: true,
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        }
                    }
                }).then(function(instance) {
                    expect(typeof instance.getData).toBe('function');

                    initializedModals.push('instance-getdata');
                    done();
                }).catch(done.fail);
            });

            it('instance has setData method', function(done) {
                FormModal.init({
                    modalId: 'instance-setdata',
                    useNativeForm: true,
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        }
                    }
                }).then(function(instance) {
                    expect(typeof instance.setData).toBe('function');

                    initializedModals.push('instance-setdata');
                    done();
                }).catch(done.fail);
            });

            it('instance has validate method', function(done) {
                FormModal.init({
                    modalId: 'instance-validate',
                    useNativeForm: true,
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        }
                    }
                }).then(function(instance) {
                    expect(typeof instance.validate).toBe('function');

                    initializedModals.push('instance-validate');
                    done();
                }).catch(done.fail);
            });

            it('instance has show method', function(done) {
                FormModal.init({
                    modalId: 'instance-show',
                    useNativeForm: true,
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        }
                    }
                }).then(function(instance) {
                    expect(typeof instance.show).toBe('function');

                    initializedModals.push('instance-show');
                    done();
                }).catch(done.fail);
            });

            it('instance has hide method', function(done) {
                FormModal.init({
                    modalId: 'instance-hide',
                    useNativeForm: true,
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        }
                    }
                }).then(function(instance) {
                    expect(typeof instance.hide).toBe('function');

                    initializedModals.push('instance-hide');
                    done();
                }).catch(done.fail);
            });

            it('instance has destroy method', function(done) {
                FormModal.init({
                    modalId: 'instance-destroy',
                    useNativeForm: true,
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        }
                    }
                }).then(function(instance) {
                    expect(typeof instance.destroy).toBe('function');

                    initializedModals.push('instance-destroy');
                    done();
                }).catch(done.fail);
            });

            it('instance has form property', function(done) {
                FormModal.init({
                    modalId: 'instance-form',
                    useNativeForm: true,
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        }
                    }
                }).then(function(instance) {
                    expect(instance.form).toBeDefined();

                    initializedModals.push('instance-form');
                    done();
                }).catch(done.fail);
            });

            it('instance has modal property', function(done) {
                FormModal.init({
                    modalId: 'instance-modal',
                    useNativeForm: true,
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        }
                    }
                }).then(function(instance) {
                    expect(instance.modal).toBeDefined();
                    expect(instance.modal.id).toBe('instance-modal');

                    initializedModals.push('instance-modal');
                    done();
                }).catch(done.fail);
            });

        });

        describe('Native form data operations', function() {

            it('getData returns form data', function(done) {
                FormModal.init({
                    modalId: 'data-get-test',
                    useNativeForm: true,
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        }
                    },
                    data: { name: 'Test Value' }
                }).then(function(instance) {
                    var data = instance.getData();
                    expect(data.name).toBe('Test Value');

                    initializedModals.push('data-get-test');
                    done();
                }).catch(done.fail);
            });

            it('setData updates form data', function(done) {
                FormModal.init({
                    modalId: 'data-set-test',
                    useNativeForm: true,
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        }
                    }
                }).then(function(instance) {
                    instance.setData({ name: 'New Value' });
                    var data = instance.getData();
                    expect(data.name).toBe('New Value');

                    initializedModals.push('data-set-test');
                    done();
                }).catch(done.fail);
            });

        });

        describe('Native form validation', function() {

            it('validate returns valid for optional field', function(done) {
                FormModal.init({
                    modalId: 'validate-optional',
                    useNativeForm: true,
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        }
                    }
                }).then(function(instance) {
                    var result = instance.validate();
                    expect(result.valid).toBe(true);

                    initializedModals.push('validate-optional');
                    done();
                }).catch(done.fail);
            });

            it('validate returns invalid for empty required field', function(done) {
                FormModal.init({
                    modalId: 'validate-required',
                    useNativeForm: true,
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name', required: true }
                        }
                    }
                }).then(function(instance) {
                    var result = instance.validate();
                    expect(result.valid).toBe(false);
                    expect(result.errors.name).toBeDefined();

                    initializedModals.push('validate-required');
                    done();
                }).catch(done.fail);
            });

        });

        describe('Config options for native form', function() {

            it('supports title option', function(done) {
                FormModal.init({
                    modalId: 'native-title-test',
                    useNativeForm: true,
                    title: 'Custom Title',
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        }
                    }
                }).then(function() {
                    var modal = document.getElementById('native-title-test');
                    var titleEl = modal.querySelector('.title-text');
                    expect(titleEl.textContent).toBe('Custom Title');

                    initializedModals.push('native-title-test');
                    done();
                }).catch(done.fail);
            });

            it('supports submitText option', function(done) {
                FormModal.init({
                    modalId: 'native-submit-text',
                    useNativeForm: true,
                    submitText: 'Create',
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        }
                    }
                }).then(function() {
                    var modal = document.getElementById('native-submit-text');
                    var saveBtn = modal.querySelector('.form-modal-save .save-text');
                    expect(saveBtn.textContent).toContain('Create');

                    initializedModals.push('native-submit-text');
                    done();
                }).catch(done.fail);
            });

            it('supports cancelText option', function(done) {
                FormModal.init({
                    modalId: 'native-cancel-text',
                    useNativeForm: true,
                    cancelText: 'Close',
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        }
                    }
                }).then(function() {
                    var modal = document.getElementById('native-cancel-text');
                    // Use footer cancel button, not header close button
                    var cancelBtn = modal.querySelector('.modal-footer [data-funky-modal-close]');
                    expect(cancelBtn.textContent).toContain('Close');

                    initializedModals.push('native-cancel-text');
                    done();
                }).catch(done.fail);
            });

            it('supports size option', function(done) {
                FormModal.init({
                    modalId: 'native-size-test',
                    useNativeForm: true,
                    size: 'modal-slide-panel-xl',
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        }
                    }
                }).then(function() {
                    var modal = document.getElementById('native-size-test');
                    expect(modal.classList.contains('modal-slide-panel-xl')).toBe(true);

                    initializedModals.push('native-size-test');
                    done();
                }).catch(done.fail);
            });

            it('supports initial data', function(done) {
                FormModal.init({
                    modalId: 'native-initial-data',
                    useNativeForm: true,
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' },
                            email: { type: 'email', label: 'Email' }
                        }
                    },
                    data: { name: 'John', email: 'john@example.com' }
                }).then(function(instance) {
                    var data = instance.getData();
                    expect(data.name).toBe('John');
                    expect(data.email).toBe('john@example.com');

                    initializedModals.push('native-initial-data');
                    done();
                }).catch(done.fail);
            });

        });

        describe('Backward compatibility', function() {

            it('JSONEditor forms still work with default detection', function(done) {
                initModal({
                    modalId: 'compat-jsoneditor',
                    entity: 'client',
                    schema: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' }
                        }
                    },
                    apiUrl: '/api/clients'
                }).then(function() {
                    // Should create modal - now always native form since JSONEditor removed
                    var modal = document.getElementById('compat-jsoneditor');
                    expect(modal).not.toBeNull();
                    // Note: JSONEditor has been removed, all forms are now native
                    expect(FormModal.isNativeForm('compat-jsoneditor')).toBe(true);
                    done();
                }).catch(done.fail);
            });

            it('useLegacyEditor is ignored since JSONEditor removed', function(done) {
                initModal({
                    modalId: 'compat-legacy',
                    useLegacyEditor: true,
                    schema: {
                        fields: { // Native schema format
                            name: { type: 'text' }
                        }
                    },
                    apiUrl: '/api/test'
                }).then(function() {
                    // Note: JSONEditor has been removed, useLegacyEditor is now ignored
                    // All forms are native
                    expect(FormModal.isNativeForm('compat-legacy')).toBe(true);
                    done();
                }).catch(done.fail);
            });

        });

    });

});

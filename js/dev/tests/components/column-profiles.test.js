/**
 * Tests for Funky.ColumnProfiles
 * Column visibility profile management
 */
FunkyTests.describe('Funky.Component.ColumnProfiles', function() {
    var expect = FunkyTests.expect;
    var fixture;
    var mockStorageData;

    FunkyTests.beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="test-container"></div>');

        // Reset mock storage data for each test
        mockStorageData = {};

        // Use spyOn to intercept Storage calls
        if (Funky.Storage) {
            FunkyTests.spyOn(Funky.Storage, 'get').and.callFake(function(key, defaultVal) {
                var val = mockStorageData[key];
                return val !== undefined ? JSON.parse(JSON.stringify(val)) : defaultVal;
            });
            FunkyTests.spyOn(Funky.Storage, 'set').and.callFake(function(key, val) {
                mockStorageData[key] = JSON.parse(JSON.stringify(val));
            });
            FunkyTests.spyOn(Funky.Storage, 'getRaw').and.callFake(function(key, defaultVal) {
                return mockStorageData[key] !== undefined ? mockStorageData[key] : defaultVal;
            });
            FunkyTests.spyOn(Funky.Storage, 'setRaw').and.callFake(function(key, val) {
                mockStorageData[key] = val;
            });
            FunkyTests.spyOn(Funky.Storage, 'remove').and.callFake(function(key) {
                delete mockStorageData[key];
            });
        }

        // Clear instances before each test using registry API
        if (Funky.ColumnProfiles && Funky.ColumnProfiles._instances) {
            Funky.ColumnProfiles._instances.list().forEach(function(id) {
                Funky.ColumnProfiles._instances.unregister(id);
            });
        }
    });

    FunkyTests.afterEach(function() {
        // Clear instances using registry API
        if (Funky.ColumnProfiles && Funky.ColumnProfiles._instances) {
            Funky.ColumnProfiles._instances.list().forEach(function(id) {
                Funky.ColumnProfiles._instances.unregister(id);
            });
        }

        fixture.cleanup();
    });

    FunkyTests.describe('Registration', function() {
        FunkyTests.it('is registered with Funky namespace', function() {
            expect(Funky.ColumnProfiles).toBeDefined();
        });

        FunkyTests.it('is a constructor function', function() {
            expect(typeof Funky.ColumnProfiles).toBe('function');
        });

        FunkyTests.it('has getInstance static method', function() {
            expect(typeof Funky.ColumnProfiles.getInstance).toBe('function');
        });

        FunkyTests.it('has setData static method', function() {
            expect(typeof Funky.ColumnProfiles.setData).toBe('function');
        });

        FunkyTests.it('has getData static method', function() {
            expect(typeof Funky.ColumnProfiles.getData).toBe('function');
        });

        FunkyTests.it('has _instances registry', function() {
            expect(Funky.ColumnProfiles._instances).toBeDefined();
            expect(typeof Funky.ColumnProfiles._instances).toBe('object');
        });
    });

    FunkyTests.describe('Constructor', function() {
        FunkyTests.it('creates instance with tableId', function() {
            var instance = new Funky.ColumnProfiles('testTable');
            expect(instance.tableId).toBe('testTable');
        });

        FunkyTests.it('registers instance in _instances', function() {
            var instance = new Funky.ColumnProfiles('testTable2');
            var retrieved = Funky.ColumnProfiles._instances.get('testTable2');
            expect(retrieved).toBe(instance);
        });

        FunkyTests.it('initializes activeProfile to null', function() {
            var instance = new Funky.ColumnProfiles('testTable3');
            expect(instance.activeProfile).toBe(null);
        });

        FunkyTests.it('creates unique modalId', function() {
            var instance = new Funky.ColumnProfiles('testTable4');
            expect(instance.modalId).toBe('columnProfileModal-testTable4');
        });
    });

    FunkyTests.describe('Prototype methods', function() {
        FunkyTests.describe('getAllProfiles()', function() {
            FunkyTests.it('returns empty object when no profiles', function() {
                var instance = new Funky.ColumnProfiles('getAllTest1');
                var profiles = instance.getAllProfiles();
                expect(profiles).toEqual({});
            });

            FunkyTests.it('returns stored profiles', function() {
                // Set up mock data BEFORE creating instance
                mockStorageData['column_profiles'] = { getAllTest2: { default: { columns: [true, false] } } };
                var instance = new Funky.ColumnProfiles('getAllTest2');
                var profiles = instance.getAllProfiles();
                expect(profiles.getAllTest2).toBeDefined();
            });
        });

        FunkyTests.describe('saveAllProfiles()', function() {
            FunkyTests.it('saves profiles to storage', function() {
                var instance = new Funky.ColumnProfiles('saveAllTest');
                var profiles = { saveAllTest: { myProfile: { columns: [true, true] } } };
                instance.saveAllProfiles(profiles);
                expect(mockStorageData['column_profiles']).toEqual(profiles);
            });
        });

        FunkyTests.describe('listProfiles()', function() {
            FunkyTests.it('returns empty array when no profiles', function() {
                var instance = new Funky.ColumnProfiles('listTest1');
                var list = instance.listProfiles();
                expect(list).toEqual([]);
            });

            FunkyTests.it('returns array of profiles for table', function() {
                mockStorageData['column_profiles'] = {
                    listTest2: {
                        profile1: { columns: [true, true], createdAt: '2024-01-01T00:00:00Z' },
                        profile2: { columns: [false, true], createdAt: '2024-01-02T00:00:00Z' }
                    }
                };
                var instance = new Funky.ColumnProfiles('listTest2');
                var list = instance.listProfiles();
                expect(list.length).toBe(2);
            });

            FunkyTests.it('returns profile with name property', function() {
                mockStorageData['column_profiles'] = {
                    listTest3: {
                        myProfile: { columns: [true, true], createdAt: '2024-01-01T00:00:00Z' }
                    }
                };
                var instance = new Funky.ColumnProfiles('listTest3');
                var list = instance.listProfiles();
                expect(list[0].name).toBe('myProfile');
            });

            FunkyTests.it('returns profile with columnCount', function() {
                mockStorageData['column_profiles'] = {
                    listTest4: {
                        myProfile: { columns: [true, false, true], createdAt: '2024-01-01T00:00:00Z' }
                    }
                };
                var instance = new Funky.ColumnProfiles('listTest4');
                var list = instance.listProfiles();
                expect(list[0].columnCount).toBe(2);
            });
        });

        FunkyTests.describe('saveProfile()', function() {
            FunkyTests.it('returns false without table', function() {
                var instance = new Funky.ColumnProfiles('saveTest1');
                var result = instance.saveProfile('test');
                expect(result).toBe(false);
            });

            FunkyTests.it('returns false without name', function() {
                var instance = new Funky.ColumnProfiles('saveTest2');
                instance.table = { columns: function() { return { every: function() {} }; } };
                var result = instance.saveProfile('');
                expect(result).toBe(false);
            });
        });

        FunkyTests.describe('loadProfile()', function() {
            FunkyTests.it('returns false without table', function() {
                var instance = new Funky.ColumnProfiles('loadTest1');
                var result = instance.loadProfile('test');
                expect(result).toBe(false);
            });

            FunkyTests.it('returns false for non-existent profile', function() {
                var instance = new Funky.ColumnProfiles('loadTest2');
                instance.table = {};
                var result = instance.loadProfile('nonexistent');
                expect(result).toBe(false);
            });
        });

        FunkyTests.describe('deleteProfile()', function() {
            FunkyTests.it('returns false for non-existent profile', function() {
                var instance = new Funky.ColumnProfiles('deleteTest1');
                var result = instance.deleteProfile('nonexistent');
                expect(result).toBe(false);
            });

            FunkyTests.it('deletes existing profile', function() {
                mockStorageData['column_profiles'] = {
                    deleteTest2: {
                        toDelete: { columns: [true, true] }
                    }
                };
                var instance = new Funky.ColumnProfiles('deleteTest2');
                var result = instance.deleteProfile('toDelete');
                expect(result).toBe(true);
                expect(mockStorageData['column_profiles'].deleteTest2.toDelete).toBe(undefined);
            });

            FunkyTests.it('clears activeProfile if deleted', function() {
                mockStorageData['column_profiles'] = {
                    deleteTest3: {
                        active: { columns: [true, true] }
                    }
                };
                var instance = new Funky.ColumnProfiles('deleteTest3');
                instance.activeProfile = 'active';
                instance.deleteProfile('active');
                expect(instance.activeProfile).toBe(null);
            });
        });

        FunkyTests.describe('getActiveProfile()', function() {
            FunkyTests.it('returns null initially', function() {
                var instance = new Funky.ColumnProfiles('getActiveTest1');
                expect(instance.getActiveProfile()).toBe(null);
            });

            FunkyTests.it('returns active profile name', function() {
                var instance = new Funky.ColumnProfiles('getActiveTest2');
                instance.activeProfile = 'myProfile';
                expect(instance.getActiveProfile()).toBe('myProfile');
            });
        });

        FunkyTests.describe('setActiveProfile()', function() {
            FunkyTests.it('sets activeProfile', function() {
                var instance = new Funky.ColumnProfiles('setActiveTest1');
                instance.setActiveProfile('newProfile');
                expect(instance.activeProfile).toBe('newProfile');
            });

            FunkyTests.it('saves to storage', function() {
                var instance = new Funky.ColumnProfiles('setActiveTest2');
                instance.setActiveProfile('savedProfile');
                expect(mockStorageData['column_profile_active_setActiveTest2']).toBe('savedProfile');
            });
        });

        FunkyTests.describe('saveActiveProfileName()', function() {
            FunkyTests.it('saves name to storage', function() {
                var instance = new Funky.ColumnProfiles('saveActiveNameTest1');
                instance.saveActiveProfileName('stored');
                expect(mockStorageData['column_profile_active_saveActiveNameTest1']).toBe('stored');
            });

            FunkyTests.it('removes from storage when null', function() {
                var instance = new Funky.ColumnProfiles('saveActiveNameTest2');
                mockStorageData['column_profile_active_saveActiveNameTest2'] = 'old';
                instance.saveActiveProfileName(null);
                expect(mockStorageData['column_profile_active_saveActiveNameTest2']).toBe(undefined);
            });
        });
    });

    FunkyTests.describe('Bindable Interface - Instance methods', function() {
        FunkyTests.describe('setData()', function() {
            FunkyTests.it('saves profiles to storage', function() {
                var instance = new Funky.ColumnProfiles('bindSetTest');
                instance.setData({
                    profile1: { columns: [true, true], createdAt: '2024-01-01' }
                });
                expect(mockStorageData['column_profiles']).toBeDefined();
                expect(mockStorageData['column_profiles'].bindSetTest).toBeDefined();
                expect(mockStorageData['column_profiles'].bindSetTest.profile1).toBeDefined();
            });

            FunkyTests.it('handles null gracefully', function() {
                var instance = new Funky.ColumnProfiles('bindSetNullTest');
                expect(function() {
                    instance.setData(null);
                }).not.toThrow();
            });

            FunkyTests.it('clears activeProfile if it no longer exists', function() {
                var instance = new Funky.ColumnProfiles('bindSetClearTest');
                instance.activeProfile = 'removed';
                instance.setData({
                    newProfile: { columns: [true, false] }
                });
                expect(instance.activeProfile).toBe(null);
            });
        });

        FunkyTests.describe('getData()', function() {
            FunkyTests.it('returns empty object when no profiles', function() {
                var instance = new Funky.ColumnProfiles('bindGetEmptyTest');
                var data = instance.getData();
                expect(data).toEqual({});
            });

            FunkyTests.it('returns profiles for table', function() {
                mockStorageData['column_profiles'] = {
                    bindGetTest: {
                        myProfile: { columns: [true, false] }
                    }
                };
                var instance = new Funky.ColumnProfiles('bindGetTest');
                var data = instance.getData();
                expect(data.myProfile).toBeDefined();
            });
        });
    });

    FunkyTests.describe('Bindable Interface - Static methods', function() {
        FunkyTests.describe('getInstance()', function() {
            FunkyTests.it('returns null for non-existent instance', function() {
                var instance = Funky.ColumnProfiles.getInstance('nonexistent');
                expect(instance).toBeNull();
            });

            FunkyTests.it('returns instance by tableId', function() {
                var created = new Funky.ColumnProfiles('staticGetInstanceTest');
                var retrieved = Funky.ColumnProfiles.getInstance('staticGetInstanceTest');
                expect(retrieved).toBe(created);
            });
        });

        FunkyTests.describe('setData() static', function() {
            FunkyTests.it('returns false for non-existent instance', function() {
                var result = Funky.ColumnProfiles.setData('nonexistent', {});
                expect(result).toBe(false);
            });

            FunkyTests.it('sets data on existing instance', function() {
                new Funky.ColumnProfiles('staticSetDataTest');
                var result = Funky.ColumnProfiles.setData('staticSetDataTest', {
                    test: { columns: [true] }
                });
                expect(result).toBe(true);
            });
        });

        FunkyTests.describe('getData() static', function() {
            FunkyTests.it('returns null for non-existent instance', function() {
                var result = Funky.ColumnProfiles.getData('nonexistent');
                expect(result).toBe(null);
            });

            FunkyTests.it('returns data from existing instance', function() {
                mockStorageData['column_profiles'] = {
                    staticGetDataTest: { myProfile: { columns: [true] } }
                };
                new Funky.ColumnProfiles('staticGetDataTest');
                var data = Funky.ColumnProfiles.getData('staticGetDataTest');
                expect(data.myProfile).toBeDefined();
            });
        });
    });

    FunkyTests.describe('createButton()', function() {
        FunkyTests.it('returns button element', function() {
            var instance = new Funky.ColumnProfiles('buttonTest');
            var btn = instance.createButton();
            expect(btn.tagName).toBe('BUTTON');
        });

        FunkyTests.it('has correct type attribute', function() {
            var instance = new Funky.ColumnProfiles('buttonTest2');
            var btn = instance.createButton();
            expect(btn.type).toBe('button');
        });

        FunkyTests.it('has btn-funky class', function() {
            var instance = new Funky.ColumnProfiles('buttonTest3');
            var btn = instance.createButton();
            expect(btn.className).toContain('btn-funky');
        });

        FunkyTests.it('has aria-label', function() {
            var instance = new Funky.ColumnProfiles('buttonTest4');
            var btn = instance.createButton();
            expect(btn.getAttribute('aria-label')).toBe('Manage column profiles');
        });

        FunkyTests.it('has title attribute', function() {
            var instance = new Funky.ColumnProfiles('buttonTest5');
            var btn = instance.createButton();
            expect(btn.title).toBe('Column Profiles');
        });
    });

    FunkyTests.describe('Modal generation', function() {
        var instance;
        var modalTestId = 'modalTestTable';

        FunkyTests.beforeEach(function() {
            instance = new Funky.ColumnProfiles(modalTestId);
        });

        FunkyTests.afterEach(function() {
            // Clean up any modals (guard against instance being undefined)
            if (instance && instance.modalId) {
                var modal = document.getElementById(instance.modalId);
                if (modal) {
                    modal.remove();
                }
            }
        });

        FunkyTests.it('showModal does not throw', function() {
            expect(function() {
                instance.showModal();
            }).not.toThrow();
        });

        FunkyTests.it('creates modal element', function() {
            instance.showModal();
            var modal = document.getElementById(instance.modalId);
            expect(modal).not.toBe(null);
        });

        FunkyTests.it('modal has correct classes', function() {
            instance.showModal();
            var modal = document.getElementById(instance.modalId);
            expect(modal.classList.contains('modal')).toBe(true);
            expect(modal.classList.contains('column-profile-modal')).toBe(true);
        });

        FunkyTests.it('modal has accessibility attributes', function() {
            instance.showModal();
            var modal = document.getElementById(instance.modalId);
            expect(modal.getAttribute('role')).toBe('dialog');
            expect(modal.getAttribute('aria-labelledby')).toBe(instance.modalId + '-title');
        });

        FunkyTests.it('renders empty state when no profiles', function() {
            instance.showModal();
            var emptyState = document.querySelector('.profile-list-empty');
            expect(emptyState).not.toBe(null);
        });

        FunkyTests.it('renders profile list when profiles exist', function() {
            mockStorageData['column_profiles'] = {};
            mockStorageData['column_profiles'][modalTestId] = {
                testProfile: { columns: [true], createdAt: '2024-01-01' }
            };
            instance.showModal();
            var profileList = document.querySelector('.profile-list');
            expect(profileList).not.toBe(null);
        });

        FunkyTests.it('renders profile items', function() {
            mockStorageData['column_profiles'] = {};
            mockStorageData['column_profiles'][modalTestId] = {
                testProfile: { columns: [true, false], createdAt: '2024-01-01' }
            };
            instance.showModal();
            var profileItem = document.querySelector('.profile-item');
            expect(profileItem).not.toBe(null);
        });

        FunkyTests.it('marks active profile', function() {
            mockStorageData['column_profiles'] = {};
            mockStorageData['column_profiles'][modalTestId] = {
                activeOne: { columns: [true], createdAt: '2024-01-01' }
            };
            instance.activeProfile = 'activeOne';
            instance.showModal();
            var activeItem = document.querySelector('.profile-item.active');
            expect(activeItem).not.toBe(null);
        });

        FunkyTests.it('renders save form', function() {
            instance.showModal();
            var input = document.getElementById('newProfileName-' + modalTestId);
            var btn = document.getElementById('saveProfileBtn-' + modalTestId);
            expect(input).not.toBe(null);
            expect(btn).not.toBe(null);
        });

        FunkyTests.it('profile items have keyboard accessibility', function() {
            mockStorageData['column_profiles'] = {};
            mockStorageData['column_profiles'][modalTestId] = {
                testProfile: { columns: [true], createdAt: '2024-01-01' }
            };
            instance.showModal();
            var profileItem = document.querySelector('.profile-item');
            expect(profileItem).not.toBe(null);
            expect(profileItem.getAttribute('tabindex')).toBe('0');
            expect(profileItem.getAttribute('role')).toBe('option');
        });
    });
});

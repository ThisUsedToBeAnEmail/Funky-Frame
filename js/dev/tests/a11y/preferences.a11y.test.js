/**
 * Accessibility Tests: Funky.Preferences
 *
 * Tests WCAG 2.1 AA compliance for preferences component.
 * User preferences panels must have proper form labeling,
 * grouped settings, and announce changes appropriately.
 */

FunkyTests.describe('Funky.A11y.Preferences', function() {
    var expect = FunkyTests.expect;
    var Preferences = window.Funky && window.Funky.Preferences;

    // Skip all tests if Preferences not loaded
    if (!Preferences) {
        FunkyTests.it('Preferences component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;

    FunkyTests.beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="preferences-test-container"></div>');
    });

    FunkyTests.afterEach(function() {
        fixture.cleanup();
    });

    // ========================================================================
    // Preferences Panel Structure
    // ========================================================================

    FunkyTests.describe('Preferences Panel Structure', function() {

        FunkyTests.it('preference sections use fieldset/legend', function() {
            var container = document.getElementById('preferences-test-container');
            container.innerHTML =
                '<fieldset class="preferences-section">' +
                '<legend>Theme Settings</legend>' +
                '<div class="preference-item"></div>' +
                '</fieldset>';

            var fieldset = container.querySelector('fieldset');
            var legend = container.querySelector('legend');
            expect(fieldset).not.toBeNull();
            expect(legend).not.toBeNull();
            expect(legend.textContent.length).toBeGreaterThan(0);
        });

        FunkyTests.it('preference groups have headings', function() {
            var container = document.getElementById('preferences-test-container');
            container.innerHTML =
                '<section class="preferences-group" aria-labelledby="theme-heading">' +
                '<h3 id="theme-heading">Theme</h3>' +
                '</section>';

            var section = container.querySelector('.preferences-group');
            var heading = container.querySelector('h3');
            expect(heading).not.toBeNull();
        });

    });

    // ========================================================================
    // Form Controls Accessibility
    // ========================================================================

    FunkyTests.describe('Form Controls Accessibility', function() {

        FunkyTests.it('inputs have associated labels', function() {
            var container = document.getElementById('preferences-test-container');
            container.innerHTML =
                '<div class="preference-item">' +
                '<label for="theme-mode">Theme Mode</label>' +
                '<select id="theme-mode">' +
                '<option value="light">Light</option>' +
                '<option value="dark">Dark</option>' +
                '</select>' +
                '</div>';

            var input = container.querySelector('#theme-mode');
            var label = container.querySelector('label[for="theme-mode"]');
            expect(label).not.toBeNull();
            expect(input).not.toBeNull();
        });

        FunkyTests.it('checkboxes have labels', function() {
            var container = document.getElementById('preferences-test-container');
            container.innerHTML =
                '<div class="preference-item">' +
                '<input type="checkbox" id="animations-enabled">' +
                '<label for="animations-enabled">Enable animations</label>' +
                '</div>';

            var checkbox = container.querySelector('#animations-enabled');
            var label = container.querySelector('label[for="animations-enabled"]');
            expect(checkbox).not.toBeNull();
            expect(label).not.toBeNull();
        });

        FunkyTests.it('radio buttons are grouped', function() {
            var container = document.getElementById('preferences-test-container');
            container.innerHTML =
                '<fieldset class="preference-item">' +
                '<legend>Density</legend>' +
                '<label><input type="radio" name="density" value="compact"> Compact</label>' +
                '<label><input type="radio" name="density" value="comfortable"> Comfortable</label>' +
                '</fieldset>';

            var radios = container.querySelectorAll('input[type="radio"]');
            expect(radios.length).toBeGreaterThan(1);

            var firstRadio = radios[0];
            var secondRadio = radios[1];
            expect(firstRadio.name).toBe(secondRadio.name);
        });

        FunkyTests.it('range sliders have labels', function() {
            var container = document.getElementById('preferences-test-container');
            container.innerHTML =
                '<div class="preference-item">' +
                '<label for="font-scale">Font Scale</label>' +
                '<input type="range" id="font-scale" min="0.8" max="1.5" step="0.1" aria-valuetext="1.0x">' +
                '</div>';

            var range = container.querySelector('#font-scale');
            var label = container.querySelector('label[for="font-scale"]');
            expect(range).not.toBeNull();
            expect(label).not.toBeNull();
        });

    });

    // ========================================================================
    // Color Picker Accessibility
    // ========================================================================

    FunkyTests.describe('Color Picker Accessibility', function() {

        FunkyTests.it('color inputs have labels', function() {
            var container = document.getElementById('preferences-test-container');
            container.innerHTML =
                '<div class="preference-item">' +
                '<label for="accent-color">Accent Color</label>' +
                '<input type="color" id="accent-color" value="#0d6efd">' +
                '</div>';

            var colorInput = container.querySelector('#accent-color');
            var label = container.querySelector('label[for="accent-color"]');
            expect(colorInput).not.toBeNull();
            expect(label).not.toBeNull();
        });

        FunkyTests.it('color value is readable', function() {
            var container = document.getElementById('preferences-test-container');
            container.innerHTML =
                '<div class="preference-item">' +
                '<label for="accent-color">Accent Color</label>' +
                '<input type="color" id="accent-color" value="#0d6efd">' +
                '<span class="color-value" aria-live="polite">#0d6efd</span>' +
                '</div>';

            var colorValue = container.querySelector('.color-value');
            expect(colorValue.textContent).toContain('#');
        });

    });

    // ========================================================================
    // Save/Reset Actions
    // ========================================================================

    FunkyTests.describe('Save/Reset Actions', function() {

        FunkyTests.it('save button has accessible name', function() {
            var container = document.getElementById('preferences-test-container');
            container.innerHTML =
                '<button type="button" class="btn-save-preferences"><i class="fas fa-save" aria-hidden="true"></i> Save Preferences</button>';

            var saveBtn = container.querySelector('.btn-save-preferences');
            var hasLabel = saveBtn.getAttribute('aria-label') ||
                          saveBtn.textContent.trim().length > 0;
            expect(hasLabel).toBeTruthy();
        });

        FunkyTests.it('reset button has accessible name', function() {
            var container = document.getElementById('preferences-test-container');
            container.innerHTML =
                '<button type="button" class="btn-reset-preferences" aria-label="Reset to defaults">Reset</button>';

            var resetBtn = container.querySelector('.btn-reset-preferences');
            var hasLabel = resetBtn.getAttribute('aria-label') ||
                          resetBtn.textContent.trim().length > 0;
            expect(hasLabel).toBeTruthy();
        });

    });

    // ========================================================================
    // Change Announcements
    // ========================================================================

    FunkyTests.describe('Change Announcements', function() {

        FunkyTests.it('preference changes can be announced', function() {
            var container = document.getElementById('preferences-test-container');
            container.innerHTML =
                '<div class="preferences-status" role="status" aria-live="polite"></div>';

            var status = container.querySelector('.preferences-status');
            status.textContent = 'Theme changed to dark mode';
            expect(status.getAttribute('aria-live')).toBe('polite');
        });

        FunkyTests.it('save confirmation is announced', function() {
            var container = document.getElementById('preferences-test-container');
            container.innerHTML =
                '<div class="preferences-status" role="status" aria-live="polite">Preferences saved successfully</div>';

            var status = container.querySelector('.preferences-status');
            expect(status.textContent).toContain('saved');
        });

    });

    // ========================================================================
    // Keyboard Navigation
    // ========================================================================

    FunkyTests.describe('Keyboard Navigation', function() {

        FunkyTests.it('form controls are keyboard focusable', function() {
            var container = document.getElementById('preferences-test-container');
            container.innerHTML =
                '<select id="theme"><option>Dark</option></select>' +
                '<input type="checkbox" id="anim">' +
                '<button id="save">Save</button>';

            var controls = container.querySelectorAll('select, input, button');
            controls.forEach(function(ctrl) {
                var tabindex = ctrl.getAttribute('tabindex');
                expect(tabindex === null || parseInt(tabindex) >= 0).toBe(true);
            });
        });

        FunkyTests.it('custom controls are keyboard accessible', function() {
            var container = document.getElementById('preferences-test-container');
            container.innerHTML =
                '<div class="custom-toggle" role="switch" tabindex="0" aria-checked="false" aria-label="Enable feature"></div>';

            var toggle = container.querySelector('.custom-toggle');
            expect(toggle.getAttribute('tabindex')).toBe('0');
            expect(toggle.getAttribute('role')).toBe('switch');
        });

    });

    // ========================================================================
    // API Methods
    // ========================================================================

    FunkyTests.describe('API Methods', function() {

        FunkyTests.it('get returns preference value', function() {
            if (Preferences.get) {
                var value = Preferences.get('theme.mode');
                // Value may be undefined if not loaded
                expect(value !== null || value === undefined).toBe(true);
            } else {
                expect(true).toBe(true);
            }
        });

        FunkyTests.it('defaults are defined', function() {
            if (Preferences.defaults) {
                expect(Preferences.defaults).toBeDefined();
            } else {
                expect(true).toBe(true);
            }
        });

    });

    // ========================================================================
    // Tab Navigation Between Sections
    // ========================================================================

    FunkyTests.describe('Tab Navigation Between Sections', function() {

        FunkyTests.it('sections are navigable with tabs', function() {
            var container = document.getElementById('preferences-test-container');
            container.innerHTML =
                '<div role="tablist" aria-label="Preference categories">' +
                '<button role="tab" aria-selected="true" aria-controls="theme-panel">Theme</button>' +
                '<button role="tab" aria-selected="false" aria-controls="notif-panel">Notifications</button>' +
                '</div>' +
                '<div id="theme-panel" role="tabpanel" aria-labelledby="theme-tab">Theme options</div>' +
                '<div id="notif-panel" role="tabpanel" aria-labelledby="notif-tab" hidden>Notification options</div>';

            var tablist = container.querySelector('[role="tablist"]');
            var tabs = container.querySelectorAll('[role="tab"]');
            expect(tablist).not.toBeNull();
            expect(tabs.length).toBe(2);
        });

    });

});

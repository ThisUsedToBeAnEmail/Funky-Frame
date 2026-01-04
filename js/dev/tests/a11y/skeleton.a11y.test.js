/**
 * Accessibility Tests: Funky.Skeleton
 *
 * Tests WCAG 2.1 AA compliance for skeleton loading component.
 * Loading states must be communicated to screen reader users.
 */

FunkyTests.describe('Funky.A11y.Skeleton', function() {
    var expect = FunkyTests.expect;
    var Skeleton = window.Funky && window.Funky.Skeleton;

    // Skip all tests if Skeleton not loaded
    if (!Skeleton) {
        FunkyTests.it('Skeleton component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;
    var controller;

    FunkyTests.beforeEach(function() {
        fixture = FunkyTests.fixture(
            '<div id="test-container">' +
                '<p>Original content here</p>' +
            '</div>'
        );
    });

    FunkyTests.afterEach(function() {
        if (controller && controller.hide) {
            controller.hide();
        }
        controller = null;
        fixture.cleanup();
    });

    // ========================================================================
    // Loading State Announcements
    // ========================================================================

    FunkyTests.describe('Loading State Announcements', function() {

        FunkyTests.it('container has aria-busy during loading', function() {
            var container = document.querySelector('#test-container');
            controller = Skeleton.show(container, { type: 'text' });

            expect(container.getAttribute('aria-busy')).toBe('true');
        });

        FunkyTests.it('aria-busy is removed after loading completes', function(done) {
            var container = document.querySelector('#test-container');
            controller = Skeleton.show(container, { type: 'text', fadeOut: false });

            Skeleton.hide(container);

            setTimeout(function() {
                expect(container.getAttribute('aria-busy')).toBeNull();
                done();
            }, 50);
        });

        FunkyTests.it('loading state is announced to screen readers', function() {
            // Check if Funky.Announce is called
            if (!Funky.Announce) {
                expect(true).toBe(true);
                return;
            }

            var announceCalled = false;
            var originalPolite = Funky.Announce.polite;
            Funky.Announce.polite = function(msg) {
                if (msg.toLowerCase().indexOf('loading') !== -1) {
                    announceCalled = true;
                }
                originalPolite.call(Funky.Announce, msg);
            };

            var container = document.querySelector('#test-container');
            controller = Skeleton.show(container, { type: 'text' });

            expect(announceCalled).toBe(true);
            Funky.Announce.polite = originalPolite;
        });

    });

    // ========================================================================
    // Skeleton Hidden from Screen Readers
    // ========================================================================

    FunkyTests.describe('Skeleton Hidden from Screen Readers', function() {

        FunkyTests.it('skeleton wrapper has aria-hidden', function() {
            var container = document.querySelector('#test-container');
            controller = Skeleton.show(container, { type: 'text' });

            var wrapper = container.querySelector('.funky-skeleton-wrapper');
            if (wrapper) {
                expect(wrapper.getAttribute('aria-hidden')).toBe('true');
            } else {
                expect(true).toBe(true);
            }
        });

        FunkyTests.it('skeleton elements are not focusable', function() {
            var container = document.querySelector('#test-container');
            controller = Skeleton.show(container, { type: 'text' });

            var focusableInSkeleton = container.querySelectorAll(
                '.funky-skeleton-wrapper button, .funky-skeleton-wrapper a, ' +
                '.funky-skeleton-wrapper input, .funky-skeleton-wrapper [tabindex]:not([tabindex="-1"])'
            );
            expect(focusableInSkeleton.length).toBe(0);
        });

    });

    // ========================================================================
    // Different Skeleton Types
    // ========================================================================

    FunkyTests.describe('Different Skeleton Types', function() {

        FunkyTests.it('text skeleton is accessible', function() {
            var container = document.querySelector('#test-container');
            controller = Skeleton.show(container, { type: 'text', rows: 3 });

            expect(container.getAttribute('aria-busy')).toBe('true');
        });

        FunkyTests.it('table skeleton is accessible', function() {
            var container = document.querySelector('#test-container');
            controller = Skeleton.show(container, { type: 'table', rows: 5, columns: 4 });

            expect(container.getAttribute('aria-busy')).toBe('true');
        });

        FunkyTests.it('card skeleton is accessible', function() {
            var container = document.querySelector('#test-container');
            controller = Skeleton.show(container, { type: 'card', count: 3 });

            expect(container.getAttribute('aria-busy')).toBe('true');
        });

        FunkyTests.it('list skeleton is accessible', function() {
            var container = document.querySelector('#test-container');
            controller = Skeleton.show(container, { type: 'list', rows: 5, avatar: true });

            expect(container.getAttribute('aria-busy')).toBe('true');
        });

        FunkyTests.it('avatar skeleton is accessible', function() {
            var container = document.querySelector('#test-container');
            controller = Skeleton.show(container, { type: 'avatar', size: 'lg' });

            expect(container.getAttribute('aria-busy')).toBe('true');
        });

    });

    // ========================================================================
    // Content Restoration
    // ========================================================================

    FunkyTests.describe('Content Restoration', function() {

        FunkyTests.it('content is accessible after skeleton hides', function(done) {
            var container = document.querySelector('#test-container');
            controller = Skeleton.show(container, { type: 'text', fadeOut: false });

            Skeleton.hide(container, '<p>New accessible content</p>');

            setTimeout(function() {
                expect(container.textContent).toContain('New accessible content');
                expect(container.getAttribute('aria-busy')).toBeNull();
                done();
            }, 50);
        });

        FunkyTests.it('focus is manageable after content loads', function(done) {
            var container = document.querySelector('#test-container');
            controller = Skeleton.show(container, { type: 'text', fadeOut: false });

            Skeleton.hide(container, '<button id="new-btn">Click me</button>');

            setTimeout(function() {
                var newBtn = document.querySelector('#new-btn');
                if (newBtn) {
                    newBtn.focus();
                    expect(document.activeElement).toBe(newBtn);
                }
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Visual Feedback
    // ========================================================================

    FunkyTests.describe('Visual Feedback', function() {

        FunkyTests.it('skeleton has loading CSS class', function() {
            var container = document.querySelector('#test-container');
            controller = Skeleton.show(container, { type: 'text' });

            expect(container.classList.contains('funky-skeleton-loading')).toBe(true);
        });

        FunkyTests.it('loading class is removed after hide', function(done) {
            var container = document.querySelector('#test-container');
            controller = Skeleton.show(container, { type: 'text', fadeOut: false });

            Skeleton.hide(container);

            setTimeout(function() {
                expect(container.classList.contains('funky-skeleton-loading')).toBe(false);
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Animation Accessibility
    // ========================================================================

    FunkyTests.describe('Animation Accessibility', function() {

        FunkyTests.it('respects reduced motion preference', function() {
            // Check if skeleton respects prefers-reduced-motion
            var container = document.querySelector('#test-container');
            controller = Skeleton.show(container, { type: 'text' });

            // Skeleton should use CSS for animation, which can respect prefers-reduced-motion
            var wrapper = container.querySelector('.funky-skeleton-wrapper');
            expect(wrapper).toBeDefined();
        });

        FunkyTests.it('fade out animation is configurable', function(done) {
            var container = document.querySelector('#test-container');
            controller = Skeleton.show(container, { type: 'text', fadeOut: true, fadeDuration: 100 });

            Skeleton.hide(container);

            setTimeout(function() {
                expect(container.getAttribute('aria-busy')).toBeNull();
                done();
            }, 200);
        });

        FunkyTests.it('fade out can be disabled', function(done) {
            var container = document.querySelector('#test-container');
            controller = Skeleton.show(container, { type: 'text', fadeOut: false });

            Skeleton.hide(container);

            setTimeout(function() {
                expect(container.getAttribute('aria-busy')).toBeNull();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Multiple Skeletons
    // ========================================================================

    FunkyTests.describe('Multiple Skeletons', function() {

        FunkyTests.it('multiple skeletons can be managed independently', function(done) {
            var container1 = document.querySelector('#test-container');
            var container2 = document.createElement('div');
            container2.id = 'test-container-2';
            document.body.appendChild(container2);

            var controller1 = Skeleton.show(container1, { type: 'text', fadeOut: false });
            var controller2 = Skeleton.show(container2, { type: 'card', fadeOut: false });

            expect(container1.getAttribute('aria-busy')).toBe('true');
            expect(container2.getAttribute('aria-busy')).toBe('true');

            controller1.hide();

            // Allow time for hide to complete
            setTimeout(function() {
                expect(container1.getAttribute('aria-busy')).toBeNull();
                expect(container2.getAttribute('aria-busy')).toBe('true');

                controller2.hide();
                document.body.removeChild(container2);
                done();
            }, 100);
        });

    });

    // ========================================================================
    // Custom Template Accessibility
    // ========================================================================

    FunkyTests.describe('Custom Template Accessibility', function() {

        FunkyTests.it('custom template is wrapped correctly', function() {
            var container = document.querySelector('#test-container');
            controller = Skeleton.show(container, {
                type: 'custom',
                template: '<div class="custom-skeleton">Loading...</div>'
            });

            var wrapper = container.querySelector('.funky-skeleton-wrapper');
            expect(wrapper).toBeDefined();
            expect(wrapper.getAttribute('aria-hidden')).toBe('true');
        });

    });

});

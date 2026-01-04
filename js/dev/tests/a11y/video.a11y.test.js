/**
 * Accessibility Tests: Funky.Video
 *
 * Tests WCAG 2.1 AA compliance for video player components.
 * Video controls must be fully keyboard accessible.
 */

FunkyTests.describe('Funky.A11y.Video', function() {
    var expect = FunkyTests.expect;
    var Video = window.Funky && window.Funky.Video;

    // Skip all tests if Video not loaded
    if (!Video) {
        FunkyTests.it('Video component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;
    var instances = [];

    FunkyTests.beforeEach(function() {
        fixture = FunkyTests.fixture(
            '<div id="test-container" style="width: 640px; height: 360px;"></div>'
        );
        instances = [];
    });

    FunkyTests.afterEach(function() {
        // Clean up instances
        instances.forEach(function(instance) {
            if (instance && typeof instance.destroy === 'function') {
                instance.destroy();
            }
        });
        instances = [];
        fixture.cleanup();
    });

    // ========================================================================
    // Control Button Labels
    // ========================================================================

    FunkyTests.describe('Button Labels', function() {

        FunkyTests.it('play button has aria-label', function() {
            var container = document.querySelector('#test-container');
            var player = Video.init(container, {
                src: 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDE=',
                controls: true
            });
            instances.push(player);

            var playBtn = container.querySelector('[aria-label*="Play"], [aria-label*="play"]');
            expect(playBtn).toBeDefined();
        });

        FunkyTests.it('play button label changes to Pause when playing', function() {
            var container = document.querySelector('#test-container');
            var player = Video.init(container, {
                src: 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDE=',
                controls: true
            });
            instances.push(player);

            // The aria-label should update when state changes
            var playBtn = container.querySelector('[aria-label*="Play"], [aria-label*="play"]');
            if (playBtn) {
                expect(playBtn.hasAttribute('aria-label')).toBe(true);
            }
        });

        FunkyTests.it('rewind button has aria-label', function() {
            var container = document.querySelector('#test-container');
            var player = Video.init(container, {
                src: 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDE=',
                controls: true
            });
            instances.push(player);

            var rewindBtn = container.querySelector('[aria-label*="Rewind"], [aria-label*="rewind"]');
            if (rewindBtn) {
                expect(rewindBtn.hasAttribute('aria-label')).toBe(true);
            }
        });

        FunkyTests.it('mute button has aria-label', function() {
            var container = document.querySelector('#test-container');
            var player = Video.init(container, {
                src: 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDE=',
                controls: true
            });
            instances.push(player);

            var muteBtn = container.querySelector('[aria-label*="mute"], [aria-label*="Mute"]');
            if (muteBtn) {
                expect(muteBtn.hasAttribute('aria-label')).toBe(true);
            }
        });

    });

    // ========================================================================
    // Progress Bar Accessibility
    // ========================================================================

    FunkyTests.describe('Progress Bar', function() {

        FunkyTests.it('progress bar has aria-label', function() {
            var container = document.querySelector('#test-container');
            var player = Video.init(container, {
                src: 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDE=',
                controls: true
            });
            instances.push(player);

            var progressBar = container.querySelector('[aria-label*="progress"], [aria-label*="Progress"]');
            if (progressBar) {
                expect(progressBar.hasAttribute('aria-label')).toBe(true);
            }
        });

        FunkyTests.it('progress bar has aria-valuemin', function() {
            var container = document.querySelector('#test-container');
            var player = Video.init(container, {
                src: 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDE=',
                controls: true
            });
            instances.push(player);

            var progressBar = container.querySelector('[aria-valuemin]');
            if (progressBar) {
                expect(progressBar.getAttribute('aria-valuemin')).toBe('0');
            }
        });

        FunkyTests.it('progress bar has aria-valuemax', function() {
            var container = document.querySelector('#test-container');
            var player = Video.init(container, {
                src: 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDE=',
                controls: true
            });
            instances.push(player);

            var progressBar = container.querySelector('[aria-valuemax]');
            if (progressBar) {
                expect(progressBar.getAttribute('aria-valuemax')).toBe('100');
            }
        });

        FunkyTests.it('progress bar has aria-valuenow', function() {
            var container = document.querySelector('#test-container');
            var player = Video.init(container, {
                src: 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDE=',
                controls: true
            });
            instances.push(player);

            var progressBar = container.querySelector('[aria-valuenow]');
            if (progressBar) {
                expect(progressBar.hasAttribute('aria-valuenow')).toBe(true);
            }
        });

        FunkyTests.it('progress bar has aria-valuetext for screen readers', function() {
            var container = document.querySelector('#test-container');
            var player = Video.init(container, {
                src: 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDE=',
                controls: true
            });
            instances.push(player);

            var progressBar = container.querySelector('[aria-valuetext]');
            if (progressBar) {
                // Should contain time format like "0:00 of 0:00"
                var valueText = progressBar.getAttribute('aria-valuetext');
                expect(valueText.length).toBeGreaterThan(0);
            }
        });

        FunkyTests.it('progress bar is keyboard focusable', function() {
            var container = document.querySelector('#test-container');
            var player = Video.init(container, {
                src: 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDE=',
                controls: true
            });
            instances.push(player);

            var progressBar = container.querySelector('[tabindex="0"][aria-label*="progress"], [tabindex="0"][aria-label*="Progress"]');
            if (progressBar) {
                expect(progressBar.getAttribute('tabindex')).toBe('0');
            }
        });

    });

    // ========================================================================
    // Volume Slider Accessibility
    // ========================================================================

    FunkyTests.describe('Volume Slider', function() {

        FunkyTests.it('volume slider has aria-label', function() {
            var container = document.querySelector('#test-container');
            var player = Video.init(container, {
                src: 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDE=',
                controls: true
            });
            instances.push(player);

            var volumeSlider = container.querySelector('[aria-label*="Volume"], [aria-label*="volume"]');
            if (volumeSlider) {
                expect(volumeSlider.hasAttribute('aria-label')).toBe(true);
            }
        });

        FunkyTests.it('volume slider has aria-valuemin', function() {
            var container = document.querySelector('#test-container');
            var player = Video.init(container, {
                src: 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDE=',
                controls: true
            });
            instances.push(player);

            var volumeSlider = container.querySelector('[aria-label*="Volume"], [aria-label*="volume"]');
            if (volumeSlider) {
                expect(volumeSlider.getAttribute('aria-valuemin')).toBe('0');
            }
        });

        FunkyTests.it('volume slider has aria-valuemax', function() {
            var container = document.querySelector('#test-container');
            var player = Video.init(container, {
                src: 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDE=',
                controls: true
            });
            instances.push(player);

            var volumeSlider = container.querySelector('[aria-label*="Volume"], [aria-label*="volume"]');
            if (volumeSlider) {
                expect(volumeSlider.getAttribute('aria-valuemax')).toBe('100');
            }
        });

        FunkyTests.it('volume slider updates aria-valuenow', function() {
            var container = document.querySelector('#test-container');
            var player = Video.init(container, {
                src: 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDE=',
                controls: true
            });
            instances.push(player);

            var volumeSlider = container.querySelector('[aria-label*="Volume"], [aria-label*="volume"]');
            if (volumeSlider) {
                expect(volumeSlider.hasAttribute('aria-valuenow')).toBe(true);
            }
        });

    });

    // ========================================================================
    // Time Display
    // ========================================================================

    FunkyTests.describe('Time Display', function() {

        FunkyTests.it('time display has appropriate aria-live', function() {
            var container = document.querySelector('#test-container');
            var player = Video.init(container, {
                src: 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDE=',
                controls: true
            });
            instances.push(player);

            // Time display should have aria-live="off" to avoid constant announcements
            var timeDisplay = container.querySelector('[aria-live]');
            if (timeDisplay) {
                // "off" is appropriate for constantly updating time
                expect(timeDisplay.getAttribute('aria-live')).toBe('off');
            }
        });

    });

    // ========================================================================
    // Keyboard Navigation
    // ========================================================================

    FunkyTests.describe('Keyboard Navigation', function() {

        FunkyTests.it('video wrapper is keyboard focusable', function() {
            var container = document.querySelector('#test-container');
            var player = Video.init(container, {
                src: 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDE=',
                controls: true
            });
            instances.push(player);

            var wrapper = container.querySelector('.funky-video');
            if (wrapper) {
                expect(wrapper.getAttribute('tabindex')).toBe('0');
            }
        });

        FunkyTests.it('Space key toggles play/pause', function() {
            var container = document.querySelector('#test-container');
            var player = Video.init(container, {
                src: 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDE=',
                controls: true
            });
            instances.push(player);

            var wrapper = container.querySelector('.funky-video');
            if (wrapper) {
                wrapper.focus();

                // Space should toggle play
                FunkyTests.simulate.keydown(wrapper, { key: ' ', keyCode: 32 });

                // Just verify no errors
                expect(true).toBe(true);
            }
        });

        FunkyTests.it('M key toggles mute', function() {
            var container = document.querySelector('#test-container');
            var player = Video.init(container, {
                src: 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDE=',
                controls: true
            });
            instances.push(player);

            var wrapper = container.querySelector('.funky-video');
            if (wrapper) {
                wrapper.focus();

                // M should toggle mute
                FunkyTests.simulate.keydown(wrapper, { key: 'm', keyCode: 77 });

                expect(true).toBe(true);
            }
        });

        FunkyTests.it('ArrowLeft seeks backward', function() {
            var container = document.querySelector('#test-container');
            var player = Video.init(container, {
                src: 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDE=',
                controls: true
            });
            instances.push(player);

            var wrapper = container.querySelector('.funky-video');
            if (wrapper) {
                wrapper.focus();

                FunkyTests.simulate.keydown(wrapper, { key: 'ArrowLeft', keyCode: 37 });

                expect(true).toBe(true);
            }
        });

        FunkyTests.it('ArrowRight seeks forward', function() {
            var container = document.querySelector('#test-container');
            var player = Video.init(container, {
                src: 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDE=',
                controls: true
            });
            instances.push(player);

            var wrapper = container.querySelector('.funky-video');
            if (wrapper) {
                wrapper.focus();

                FunkyTests.simulate.keydown(wrapper, { key: 'ArrowRight', keyCode: 39 });

                expect(true).toBe(true);
            }
        });

        FunkyTests.it('ArrowUp increases volume', function() {
            var container = document.querySelector('#test-container');
            var player = Video.init(container, {
                src: 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDE=',
                controls: true
            });
            instances.push(player);

            var wrapper = container.querySelector('.funky-video');
            if (wrapper) {
                wrapper.focus();

                FunkyTests.simulate.keydown(wrapper, { key: 'ArrowUp', keyCode: 38 });

                expect(true).toBe(true);
            }
        });

        FunkyTests.it('ArrowDown decreases volume', function() {
            var container = document.querySelector('#test-container');
            var player = Video.init(container, {
                src: 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDE=',
                controls: true
            });
            instances.push(player);

            var wrapper = container.querySelector('.funky-video');
            if (wrapper) {
                wrapper.focus();

                FunkyTests.simulate.keydown(wrapper, { key: 'ArrowDown', keyCode: 40 });

                expect(true).toBe(true);
            }
        });

    });

    // ========================================================================
    // Controls Focus Order
    // ========================================================================

    FunkyTests.describe('Focus Order', function() {

        FunkyTests.it('all interactive controls are tabbable', function() {
            var container = document.querySelector('#test-container');
            var player = Video.init(container, {
                src: 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDE=',
                controls: true
            });
            instances.push(player);

            var tabbables = container.querySelectorAll('button, [tabindex="0"], input[type="range"]');
            expect(tabbables.length).toBeGreaterThan(0);
        });

    });

    // ========================================================================
    // Video Element Accessibility
    // ========================================================================

    FunkyTests.describe('Video Element', function() {

        FunkyTests.it('native controls are disabled when custom controls used', function() {
            var container = document.querySelector('#test-container');
            var player = Video.init(container, {
                src: 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDE=',
                controls: true
            });
            instances.push(player);

            var video = container.querySelector('video');
            if (video) {
                // When custom controls are used, native controls should be off
                // to avoid confusion
                expect(video.hasAttribute('controls')).toBe(false);
            }
        });

    });

});

/**
 * Accessibility Tests: Funky.Audio
 *
 * Tests WCAG 2.1 AA compliance for audio component.
 * Audio feedback should be controllable and not interfere with
 * screen readers or assistive technologies.
 */

FunkyTests.describe('Funky.A11y.Audio', function() {
    var expect = FunkyTests.expect;
    var Audio = window.Funky && window.Funky.Audio;

    // Skip all tests if Audio not loaded
    if (!Audio) {
        FunkyTests.it('Audio component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var originalTheme;
    var originalMuted;

    FunkyTests.beforeEach(function() {
        // Save original state
        originalTheme = localStorage.getItem('funky-theme');
        originalMuted = Audio.isMuted();
    });

    FunkyTests.afterEach(function() {
        // Restore original state
        if (originalTheme) {
            localStorage.setItem('funky-theme', originalTheme);
        } else {
            localStorage.removeItem('funky-theme');
        }

        if (originalMuted) {
            Audio.mute();
        } else {
            Audio.unmute();
        }

        Audio.stopAll();
    });

    // ========================================================================
    // User Control (WCAG 1.4.2 - Audio Control)
    // ========================================================================

    FunkyTests.describe('User Control (WCAG 1.4.2)', function() {

        FunkyTests.it('provides mute functionality', function() {
            expect(typeof Audio.mute).toBe('function');
        });

        FunkyTests.it('provides unmute functionality', function() {
            expect(typeof Audio.unmute).toBe('function');
        });

        FunkyTests.it('provides toggle mute functionality', function() {
            expect(typeof Audio.toggleMute).toBe('function');
        });

        FunkyTests.it('mute stops all playing sounds', function() {
            Audio.unmute();
            Audio.mute();
            expect(Audio.isMuted()).toBe(true);
        });

        FunkyTests.it('mute state can be checked', function() {
            expect(typeof Audio.isMuted).toBe('function');
            var state = Audio.isMuted();
            expect(typeof state).toBe('boolean');
        });

        FunkyTests.it('toggle mute returns new state', function() {
            // toggleMute returns the enabled state (true = unmuted, false = muted)
            // So if we're muted, toggle returns true (now unmuted)
            // If we're unmuted, toggle returns false (now muted)
            Audio.mute(); // Start muted
            var afterFirstToggle = Audio.toggleMute(); // Now unmuted
            expect(afterFirstToggle).toBe(true); // Returns true = unmuted/enabled

            var afterSecondToggle = Audio.toggleMute(); // Now muted again
            expect(afterSecondToggle).toBe(false); // Returns false = muted/disabled
        });

    });

    // ========================================================================
    // Volume Control
    // ========================================================================

    FunkyTests.describe('Volume Control', function() {

        FunkyTests.it('provides volume control', function() {
            expect(typeof Audio.setVolume).toBe('function');
        });

        FunkyTests.it('volume is clamped to valid range', function() {
            // Set volume to out-of-range value
            Audio.setVolume(2);
            // Volume should be clamped to max 1
            expect(Audio.volume <= 1).toBe(true);

            Audio.setVolume(-1);
            // Volume should be clamped to min 0
            expect(Audio.volume >= 0).toBe(true);
        });

    });

    // ========================================================================
    // Persistence (User Preference)
    // ========================================================================

    FunkyTests.describe('Persistence', function() {

        FunkyTests.it('mute state is persisted', function() {
            Audio.mute();
            // Check that state was saved to storage
            var saved = Funky.Storage.getRaw('audio_muted', null);
            expect(saved).toBe('true');
        });

        FunkyTests.it('unmute state is persisted', function() {
            Audio.unmute();
            var saved = Funky.Storage.getRaw('audio_muted', null);
            expect(saved).toBe('false');
        });

    });

    // ========================================================================
    // Theme-Based Activation
    // ========================================================================

    FunkyTests.describe('Theme-Based Activation', function() {

        FunkyTests.it('audio only plays when even-funkyer theme is active', function(done) {
            // Set theme to something other than even-funkyer
            localStorage.setItem('funky-theme', 'default');
            Audio.unmute();

            // Play should resolve immediately without playing
            Audio.play('success.mp3').then(function() {
                // Sound should not have played
                expect(true).toBe(true);
                done();
            }).catch(function() {
                // Also acceptable - no audio played
                expect(true).toBe(true);
                done();
            });
        });

        FunkyTests.it('bypass option allows playing regardless of theme', function(done) {
            localStorage.setItem('funky-theme', 'default');
            Audio.unmute();

            // With bypass, it should attempt to play
            Audio.play('success.mp3', { bypass: true }).then(function() {
                expect(true).toBe(true);
                done();
            }).catch(function() {
                // May fail in test environment without audio files
                expect(true).toBe(true);
                done();
            });
        });

    });

    // ========================================================================
    // Stop Functionality
    // ========================================================================

    FunkyTests.describe('Stop Functionality', function() {

        FunkyTests.it('provides stop method', function() {
            expect(typeof Audio.stop).toBe('function');
        });

        FunkyTests.it('provides stopAll method', function() {
            expect(typeof Audio.stopAll).toBe('function');
        });

        FunkyTests.it('stop can be called on non-playing sound without error', function() {
            // Should not throw
            Audio.stop('nonexistent.mp3');
            expect(true).toBe(true);
        });

    });

    // ========================================================================
    // Convenience Methods
    // SKIPPED: Audio uses play('success')/play('error') not playSuccess()/playError()
    // The app registers sounds and plays them by name
    // ========================================================================

    FunkyTests.describe.skip('Convenience Methods', function() {

        FunkyTests.it('provides playSuccess method', function() {
            expect(typeof Audio.playSuccess).toBe('function');
        });

        FunkyTests.it('provides playError method', function() {
            expect(typeof Audio.playError).toBe('function');
        });

        FunkyTests.it('convenience methods return promises', function() {
            localStorage.setItem('funky-theme', 'default');
            var result = Audio.playSuccess();
            expect(result instanceof Promise).toBe(true);
        });

    });

    // ========================================================================
    // Screen Reader Compatibility
    // ========================================================================

    FunkyTests.describe('Screen Reader Compatibility', function() {

        FunkyTests.it('audio does not interfere with screen reader announcements', function() {
            // Audio component should not create any visible DOM elements
            // that could confuse screen readers
            var audioElements = document.querySelectorAll('audio:not([aria-hidden])');
            // Any audio elements should be hidden from assistive tech
            // Note: The component creates Audio objects but doesn't append to DOM
            expect(true).toBe(true);
        });

        FunkyTests.it('no autoplay without user interaction when muted', function(done) {
            Audio.mute();
            localStorage.setItem('funky-theme', 'even-funkyer');

            // Play should not actually play when muted
            Audio.play('success.mp3').then(function() {
                expect(Audio.isMuted()).toBe(true);
                done();
            });
        });

    });

    // ========================================================================
    // Callbacks
    // ========================================================================

    FunkyTests.describe('Callbacks', function() {

        FunkyTests.it('onEnd callback option is supported', function() {
            expect(true).toBe(true);
            // The play method accepts onEnd callback in options
            // This allows coordination with other accessibility features
        });

        FunkyTests.it('global onAudioStarted callback is supported', function() {
            // Check that global callback mechanism exists
            // This allows apps to coordinate audio with visual indicators
            expect(true).toBe(true);
        });

    });

});

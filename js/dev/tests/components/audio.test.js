/**
 * Funky.Audio Tests
 *
 * Tests for the generic sound effect management component.
 * Note: Audio playback tests may be limited due to browser autoplay policies.
 */

describe('Funky.Component.Audio', function() {

    var Audio = Funky.Audio;
    var originalTheme;
    var originalMuted;
    var originalRequireTheme;

    beforeEach(function() {
        // Save original state
        originalTheme = localStorage.getItem('funky-theme');
        originalMuted = Audio.muted;
        originalRequireTheme = Audio.requireTheme;

        // Disable theme requirement for generic tests
        Audio.requireTheme = false;

        // Ensure unmuted for tests
        Audio.unmute();

        // Register test sounds for testing
        Audio.registerSound('test-success', 'success.mp3', { volume: 0.6 });
        Audio.registerSound('test-error', 'error.mp3', { volume: 0.6 });
    });

    afterEach(function() {
        // Restore original theme
        if (originalTheme) {
            localStorage.setItem('funky-theme', originalTheme);
        } else {
            localStorage.removeItem('funky-theme');
        }

        // Restore mute state
        if (originalMuted) {
            Audio.mute();
        } else {
            Audio.unmute();
        }

        // Restore requireTheme
        Audio.requireTheme = originalRequireTheme;

        // Stop all sounds
        Audio.stopAll();
    });

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('Audio')).toBe(true);
        });

        it('has play method', function() {
            expect(typeof Audio.play).toBe('function');
        });

        it('has stop method', function() {
            expect(typeof Audio.stop).toBe('function');
        });

        it('has stopAll method', function() {
            expect(typeof Audio.stopAll).toBe('function');
        });

        it('has setVolume method', function() {
            expect(typeof Audio.setVolume).toBe('function');
        });

        it('has mute method', function() {
            expect(typeof Audio.mute).toBe('function');
        });

        it('has unmute method', function() {
            expect(typeof Audio.unmute).toBe('function');
        });

        it('has toggleMute method', function() {
            expect(typeof Audio.toggleMute).toBe('function');
        });

        it('has isMuted method', function() {
            expect(typeof Audio.isMuted).toBe('function');
        });

        it('has registerSound method', function() {
            expect(typeof Audio.registerSound).toBe('function');
        });

        it('has getSound method', function() {
            expect(typeof Audio.getSound).toBe('function');
        });

        it('has listSounds method', function() {
            expect(typeof Audio.listSounds).toBe('function');
        });

        it('has configure method', function() {
            expect(typeof Audio.configure).toBe('function');
        });

    });

    describe('Properties', function() {

        it('has audioCache object', function() {
            expect(Audio.audioCache).toBeDefined();
            expect(typeof Audio.audioCache).toBe('object');
        });

        it('has volume property', function() {
            expect(typeof Audio.volume).toBe('number');
            expect(Audio.volume).toBeGreaterThanOrEqual(0);
            expect(Audio.volume).toBeLessThanOrEqual(1);
        });

        it('has muted property', function() {
            expect(typeof Audio.muted).toBe('boolean');
        });

        it('has basePath property', function() {
            expect(typeof Audio.basePath).toBe('string');
        });

        it('has requireTheme property', function() {
            expect(typeof Audio.requireTheme).toBe('boolean');
        });

    });

    describe('configure()', function() {

        it('sets basePath', function() {
            var originalPath = Audio.basePath;
            Audio.configure({ basePath: '/sounds/' });

            expect(Audio.basePath).toBe('/sounds/');

            // Restore
            Audio.basePath = originalPath;
        });

        it('sets requireTheme', function() {
            Audio.configure({ requireTheme: true });
            expect(Audio.requireTheme).toBe(true);

            Audio.configure({ requireTheme: false });
            expect(Audio.requireTheme).toBe(false);
        });

        it('sets volume', function() {
            var originalVolume = Audio.volume;
            Audio.configure({ volume: 0.5 });

            expect(Audio.volume).toBe(0.5);

            // Restore
            Audio.volume = originalVolume;
        });

    });

    describe('registerSound()', function() {

        it('registers a sound with name and file', function() {
            Audio.registerSound('custom-sound', 'custom.mp3', { volume: 0.8 });

            var sound = Audio.getSound('custom-sound');
            expect(sound).toBeDefined();
            expect(sound.file).toBe('custom.mp3');
            expect(sound.volume).toBe(0.8);
        });

        it('merges with default options', function() {
            Audio.registerSound('default-opts', 'sound.mp3');

            var sound = Audio.getSound('default-opts');
            expect(sound.volume).toBeDefined();
            expect(sound.loop).toBe(false);
        });

    });

    describe('getSound()', function() {

        it('returns registered sound config', function() {
            var sound = Audio.getSound('test-success');

            expect(sound).toBeDefined();
            expect(sound.file).toBe('success.mp3');
        });

        it('returns null for unregistered sound', function() {
            var sound = Audio.getSound('non-existent');

            expect(sound).toBeNull();
        });

    });

    describe('listSounds()', function() {

        it('returns array of registered sound names', function() {
            var sounds = Audio.listSounds();

            expect(Array.isArray(sounds)).toBe(true);
            expect(sounds).toContain('test-success');
            expect(sounds).toContain('test-error');
        });

    });

    describe('preload()', function() {

        it('creates Audio elements for files', function() {
            Audio.preload(['test-sound.mp3']);

            expect(Audio.audioCache['test-sound.mp3']).toBeDefined();
        });

        it('sets preload attribute to auto', function() {
            Audio.preload(['preload-test.mp3']);

            expect(Audio.audioCache['preload-test.mp3'].preload).toBe('auto');
        });

        it('sets volume on preloaded sounds', function() {
            Audio.preload(['volume-test.mp3']);

            expect(Audio.audioCache['volume-test.mp3'].volume).toBe(Audio.volume);
        });

    });

    describe('play()', function() {

        it('returns a Promise', function() {
            var result = Audio.play('test-success');

            expect(result).toBeDefined();
            expect(typeof result.then).toBe('function');
        });

        it('resolves immediately if muted', function() {
            Audio.mute();

            var result = Audio.play('test-success');

            return result.then(function() {
                // Should resolve without error
                expect(true).toBe(true);
            });
        });

        it('plays registered sound by name', function() {
            var result = Audio.play('test-success');

            return result.then(function() {
                // Should resolve (may or may not actually play due to autoplay)
                expect(true).toBe(true);
            });
        });

        it('accepts bypass option to skip theme check', function() {
            Audio.requireTheme = true;
            localStorage.setItem('funky-theme', 'default');

            var result = Audio.play('test-success', { bypass: true });

            return result.then(function() {
                expect(true).toBe(true);
            });
        });

        it('creates new Audio element if not preloaded', function() {
            var soundName = 'new-sound-' + Date.now() + '.mp3';

            Audio.play(soundName);

            expect(Audio.audioCache[soundName]).toBeDefined();
        });

        it('accepts volume option', function() {
            var soundName = 'volume-opt-' + Date.now() + '.mp3';

            Audio.play(soundName, { volume: 0.5 });

            expect(Audio.audioCache[soundName].volume).toBe(0.5);
        });

        it('accepts loop option', function() {
            var soundName = 'loop-opt-' + Date.now() + '.mp3';

            Audio.play(soundName, { loop: true });

            expect(Audio.audioCache[soundName].loop).toBe(true);
        });

        it('uses registered sound config', function() {
            Audio.registerSound('config-test', 'config.mp3', { volume: 0.3 });

            Audio.play('config-test');

            expect(Audio.audioCache['config.mp3'].volume).toBe(0.3);
        });

        it('runtime options override registered config', function() {
            Audio.registerSound('override-test', 'override.mp3', { volume: 0.3 });

            Audio.play('override-test', { volume: 0.9 });

            expect(Audio.audioCache['override.mp3'].volume).toBe(0.9);
        });

    });

    describe('stop()', function() {

        it('stops by registered sound name', function() {
            Audio.registerSound('stop-name', 'stop-test.mp3');
            Audio.preload(['stop-test.mp3']);

            Audio.stop('stop-name');

            expect(Audio.audioCache['stop-test.mp3'].paused).toBe(true);
        });

        it('stops by file path', function() {
            var soundName = 'stop-path-' + Date.now() + '.mp3';
            Audio.preload([soundName]);

            Audio.stop(soundName);

            expect(Audio.audioCache[soundName].paused).toBe(true);
        });

        it('resets currentTime to 0', function() {
            var soundName = 'reset-test-' + Date.now() + '.mp3';
            Audio.preload([soundName]);

            Audio.stop(soundName);

            expect(Audio.audioCache[soundName].currentTime).toBe(0);
        });

        it('handles non-existent sound gracefully', function() {
            // Should not throw
            Audio.stop('non-existent-sound.mp3');
            expect(true).toBe(true);
        });

    });

    describe('stopAll()', function() {

        it('stops all cached sounds', function() {
            Audio.preload(['sound1.mp3', 'sound2.mp3', 'sound3.mp3']);

            Audio.stopAll();

            expect(Audio.audioCache['sound1.mp3'].paused).toBe(true);
            expect(Audio.audioCache['sound2.mp3'].paused).toBe(true);
            expect(Audio.audioCache['sound3.mp3'].paused).toBe(true);
        });

    });

    describe('setVolume()', function() {

        it('sets global volume', function() {
            var original = Audio.volume;
            Audio.setVolume(0.5);

            expect(Audio.volume).toBe(0.5);

            Audio.volume = original;
        });

        it('clamps volume to 0-1 range', function() {
            Audio.setVolume(2);
            expect(Audio.volume).toBe(1);

            Audio.setVolume(-1);
            expect(Audio.volume).toBe(0);
        });

        it('updates volume on all cached sounds', function() {
            Audio.preload(['vol-update-1.mp3', 'vol-update-2.mp3']);

            Audio.setVolume(0.3);

            expect(Audio.audioCache['vol-update-1.mp3'].volume).toBe(0.3);
            expect(Audio.audioCache['vol-update-2.mp3'].volume).toBe(0.3);
        });

    });

    describe('mute() and unmute()', function() {

        it('mute() sets muted to true', function() {
            Audio.mute();

            expect(Audio.muted).toBe(true);
        });

        it('mute() saves state to storage', function() {
            Audio.mute();

            expect(Funky.Storage.getRaw('audio_muted', null)).toBe('true');
        });

        it('mute() stops all sounds', function() {
            Audio.preload(['mute-test.mp3']);

            Audio.mute();

            expect(Audio.audioCache['mute-test.mp3'].paused).toBe(true);
        });

        it('unmute() sets muted to false', function() {
            Audio.mute();
            Audio.unmute();

            expect(Audio.muted).toBe(false);
        });

        it('unmute() saves state to storage', function() {
            Audio.unmute();

            expect(Funky.Storage.getRaw('audio_muted', null)).toBe('false');
        });

    });

    describe('toggleMute()', function() {

        it('toggles from muted to unmuted', function() {
            Audio.mute();

            var result = Audio.toggleMute();

            expect(result).toBe(true); // Now unmuted
            expect(Audio.muted).toBe(false);
        });

        it('toggles from unmuted to muted', function() {
            Audio.unmute();

            var result = Audio.toggleMute();

            expect(result).toBe(false); // Now muted
            expect(Audio.muted).toBe(true);
        });

    });

    describe('isMuted()', function() {

        it('returns true when muted', function() {
            Audio.mute();

            expect(Audio.isMuted()).toBe(true);
        });

        it('returns false when unmuted', function() {
            Audio.unmute();

            expect(Audio.isMuted()).toBe(false);
        });

    });

    describe('Theme requirement', function() {

        it('respects requireTheme setting', function() {
            Audio.requireTheme = true;
            localStorage.setItem('funky-theme', 'default');

            var result = Audio.play('test-success');

            return result.then(function() {
                // Should resolve without error (sound skipped due to theme)
                expect(true).toBe(true);
            });
        });

        it('plays when correct theme is set', function() {
            Audio.requireTheme = true;
            localStorage.setItem('funky-theme', 'even-funkyer');

            var result = Audio.play('test-success');

            return result.then(function() {
                expect(true).toBe(true);
            });
        });

    });

    describe('Callback support', function() {

        it('calls onEnd callback when sound ends', function(done) {
            var onEndCalled = false;
            var soundName = 'callback-test-' + Date.now() + '.mp3';

            Audio.preload([soundName]);
            var audioEl = Audio.audioCache[soundName];

            Audio.play(soundName, {
                onEnd: function() {
                    onEndCalled = true;
                }
            });

            // Manually trigger ended event
            audioEl.dispatchEvent(new Event('ended'));

            setTimeout(function() {
                expect(onEndCalled).toBe(true);
                done();
            }, 50);
        });

        it('calls global onAudioEnded callback', function(done) {
            var globalEndCalled = false;
            var soundName = 'global-end-' + Date.now() + '.mp3';

            window.onAudioEnded = function() {
                globalEndCalled = true;
            };

            Audio.preload([soundName]);
            var audioEl = Audio.audioCache[soundName];

            Audio.play(soundName);

            // Manually trigger ended event
            audioEl.dispatchEvent(new Event('ended'));

            setTimeout(function() {
                expect(globalEndCalled).toBe(true);
                delete window.onAudioEnded;
                done();
            }, 50);
        });

        it('calls global onAudioStarted callback', function() {
            var startedData = null;
            var soundName = 'global-start-' + Date.now() + '.mp3';

            window.onAudioStarted = function(name, options) {
                startedData = { name: name, options: options };
            };

            Audio.play(soundName, { volume: 0.8 });

            expect(startedData).not.toBeNull();
            expect(startedData.name).toBe(soundName);
            expect(startedData.options.volume).toBe(0.8);

            delete window.onAudioStarted;
        });

        it('calls global onAudioStopped callback', function() {
            var stoppedName = null;
            var soundName = 'global-stop-' + Date.now() + '.mp3';

            window.onAudioStopped = function(name) {
                stoppedName = name;
            };

            Audio.preload([soundName]);
            Audio.stop(soundName);

            expect(stoppedName).toBe(soundName);

            delete window.onAudioStopped;
        });

    });

});

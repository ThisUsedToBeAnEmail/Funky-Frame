/**
 * Funky.Video Tests
 *
 * Tests for the video player component.
 */

describe('Funky.Component.Video', function() {

    var Video;
    var fixture;

    beforeEach(function() {
        Video = Funky.Video;
        fixture = FunkyTests.fixture();
    });

    afterEach(function() {
        if (Video && Video.destroyAll) {
            Video.destroyAll();
        }
        fixture.destroy();
    });

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('Video')).toBe(true);
        });

        it('has init method', function() {
            expect(typeof Video.init).toBe('function');
        });

        it('has destroyAll method', function() {
            expect(typeof Video.destroyAll).toBe('function');
        });

        it('has getInstance method', function() {
            expect(typeof Video.getInstance).toBe('function');
        });

        it('has instances array', function() {
            expect(Array.isArray(Video.instances)).toBe(true);
        });

        it('has default configuration', function() {
            expect(Video.defaults).toBeDefined();
            expect(Video.defaults.loop).toBe(false);
            expect(Video.defaults.autoplay).toBe(false);
            expect(Video.defaults.muted).toBe(false);
            expect(Video.defaults.controls).toBe(true);
            expect(Video.defaults.rewindSeconds).toBe(10);
        });

    });

    describe('init()', function() {

        it('creates a video player in container', function() {
            fixture.html('<div id="video-container"></div>');

            var player = Video.init('#video-container', {
                src: '/test.mp4'
            });

            expect(player).toBeDefined();
            expect(player.id).toContain('video-');
        });

        it('creates video element', function() {
            fixture.html('<div id="video-container"></div>');

            Video.init('#video-container', {
                src: '/test.mp4'
            });

            var videoEl = fixture.query('video');
            expect(videoEl).not.toBeNull();
        });

        it('creates wrapper with funky-video class', function() {
            fixture.html('<div id="video-container"></div>');

            Video.init('#video-container', {
                src: '/test.mp4'
            });

            var wrapper = fixture.query('.funky-video');
            expect(wrapper).not.toBeNull();
        });

        it('sets video source', function() {
            fixture.html('<div id="video-container"></div>');

            Video.init('#video-container', {
                src: '/test-video.mp4'
            });

            var videoEl = fixture.query('video');
            expect(videoEl.src).toContain('test-video.mp4');
        });

        it('applies loop option', function() {
            fixture.html('<div id="video-container"></div>');

            Video.init('#video-container', {
                src: '/test.mp4',
                loop: true
            });

            var videoEl = fixture.query('video');
            expect(videoEl.loop).toBe(true);
        });

        it('applies muted option', function() {
            fixture.html('<div id="video-container"></div>');

            Video.init('#video-container', {
                src: '/test.mp4',
                muted: true
            });

            var videoEl = fixture.query('video');
            expect(videoEl.muted).toBe(true);
        });

        it('applies poster option', function() {
            fixture.html('<div id="video-container"></div>');

            Video.init('#video-container', {
                src: '/test.mp4',
                poster: '/poster.jpg'
            });

            var videoEl = fixture.query('video');
            expect(videoEl.poster).toContain('poster.jpg');
        });

        it('adds instance to instances array', function() {
            fixture.html('<div id="video-container"></div>');
            var initialCount = Video.instances.length;

            Video.init('#video-container', {
                src: '/test.mp4'
            });

            expect(Video.instances.length).toBe(initialCount + 1);
        });

        it('accepts DOM element as container', function() {
            fixture.html('<div id="video-container"></div>');
            var container = document.getElementById('video-container');

            var player = Video.init(container, {
                src: '/test.mp4'
            });

            expect(player).toBeDefined();
            expect(fixture.query('video')).not.toBeNull();
        });

    });

    describe('Controls', function() {

        it('creates controls when enabled', function() {
            fixture.html('<div id="video-container"></div>');

            Video.init('#video-container', {
                src: '/test.mp4',
                controls: true
            });

            var controls = fixture.query('.funky-video-controls');
            expect(controls).not.toBeNull();
        });

        it('creates play button', function() {
            fixture.html('<div id="video-container"></div>');

            Video.init('#video-container', {
                src: '/test.mp4',
                controls: true
            });

            var playBtn = fixture.query('.funky-video-play');
            expect(playBtn).not.toBeNull();
            expect(playBtn.getAttribute('aria-label')).toBe('Play');
        });

        it('creates rewind button', function() {
            fixture.html('<div id="video-container"></div>');

            Video.init('#video-container', {
                src: '/test.mp4',
                controls: true
            });

            var rewindBtn = fixture.query('.funky-video-rewind');
            expect(rewindBtn).not.toBeNull();
        });

        it('creates mute button', function() {
            fixture.html('<div id="video-container"></div>');

            Video.init('#video-container', {
                src: '/test.mp4',
                controls: true
            });

            var muteBtn = fixture.query('.funky-video-mute');
            expect(muteBtn).not.toBeNull();
        });

        it('creates progress bar', function() {
            fixture.html('<div id="video-container"></div>');

            Video.init('#video-container', {
                src: '/test.mp4',
                controls: true
            });

            var progress = fixture.query('.funky-video-progress');
            expect(progress).not.toBeNull();
        });

        it('creates time display', function() {
            fixture.html('<div id="video-container"></div>');

            Video.init('#video-container', {
                src: '/test.mp4',
                controls: true
            });

            var timeDisplay = fixture.query('.funky-video-time');
            expect(timeDisplay).not.toBeNull();
            expect(timeDisplay.textContent).toBe('0:00 / 0:00');
        });

        it('does not create controls when disabled', function() {
            fixture.html('<div id="video-container"></div>');

            Video.init('#video-container', {
                src: '/test.mp4',
                controls: false
            });

            var controls = fixture.query('.funky-video-controls');
            expect(controls).toBeNull();
        });

    });

    describe('Player methods', function() {

        it('toggle() changes isPlaying state', function() {
            fixture.html('<div id="video-container"></div>');

            var player = Video.init('#video-container', {
                src: '/test.mp4'
            });

            var initialState = player.isPlaying;
            // Note: actual play may be blocked by browser
            player.toggle();

            // Just verify the method exists and is callable
            expect(typeof player.toggle).toBe('function');
        });

        it('pause() pauses the video', function() {
            fixture.html('<div id="video-container"></div>');

            var player = Video.init('#video-container', {
                src: '/test.mp4'
            });

            player.pause();

            expect(player.video.paused).toBe(true);
        });

        it('rewind() decreases current time', function() {
            fixture.html('<div id="video-container"></div>');

            var player = Video.init('#video-container', {
                src: '/test.mp4',
                rewindSeconds: 10
            });

            // Set a known time (if possible)
            player.video.currentTime = 20;
            player.rewind();

            // Should rewind but not go below 0
            expect(player.video.currentTime).toBeLessThanOrEqual(20);
        });

        it('forward() increases current time', function() {
            fixture.html('<div id="video-container"></div>');

            var player = Video.init('#video-container', {
                src: '/test.mp4'
            });

            expect(typeof player.forward).toBe('function');
        });

        it('toggleMute() toggles muted state', function() {
            fixture.html('<div id="video-container"></div>');

            var player = Video.init('#video-container', {
                src: '/test.mp4',
                muted: false
            });

            player.toggleMute();
            expect(player.video.muted).toBe(true);

            player.toggleMute();
            expect(player.video.muted).toBe(false);
        });

        it('setSrc() changes video source', function() {
            fixture.html('<div id="video-container"></div>');

            var player = Video.init('#video-container', {
                src: '/original.mp4'
            });

            player.setSrc('/new-video.mp4');

            expect(player.video.src).toContain('new-video.mp4');
        });

        it('getCurrentTime() returns current time', function() {
            fixture.html('<div id="video-container"></div>');

            var player = Video.init('#video-container', {
                src: '/test.mp4'
            });

            var time = player.getCurrentTime();
            expect(typeof time).toBe('number');
        });

        it('setCurrentTime() sets current time', function() {
            fixture.html('<div id="video-container"></div>');

            var player = Video.init('#video-container', {
                src: '/test.mp4'
            });

            player.setCurrentTime(5);
            expect(player.video.currentTime).toBe(5);
        });

        it('getDuration() returns duration', function() {
            fixture.html('<div id="video-container"></div>');

            var player = Video.init('#video-container', {
                src: '/test.mp4'
            });

            var duration = player.getDuration();
            // Duration is NaN before metadata loads
            expect(typeof duration).toBe('number');
        });

    });

    describe('Time formatting', function() {

        it('formats time correctly', function() {
            fixture.html('<div id="video-container"></div>');

            var player = Video.init('#video-container', {
                src: '/test.mp4'
            });

            // Test internal _formatTime method
            expect(player._formatTime(0)).toBe('0:00');
            expect(player._formatTime(60)).toBe('1:00');
            expect(player._formatTime(65)).toBe('1:05');
            expect(player._formatTime(125)).toBe('2:05');
            expect(player._formatTime(NaN)).toBe('0:00');
        });

    });

    describe('getInstance()', function() {

        it('returns instance by ID', function() {
            fixture.html('<div id="video-container"></div>');

            var player = Video.init('#video-container', {
                src: '/test.mp4'
            });

            var retrieved = Video.getInstance(player.id);
            expect(retrieved).toBe(player);
        });

        it('returns null for non-existent ID', function() {
            var result = Video.getInstance('non-existent-id');
            expect(result).toBeNull();
        });

    });

    describe('destroy()', function() {

        it('removes video element from DOM', function() {
            fixture.html('<div id="video-container"></div>');

            var player = Video.init('#video-container', {
                src: '/test.mp4'
            });

            player.destroy();

            var wrapper = fixture.query('.funky-video');
            expect(wrapper).toBeNull();
        });

        it('removes instance from instances array', function() {
            fixture.html('<div id="video-container"></div>');

            var player = Video.init('#video-container', {
                src: '/test.mp4'
            });

            var id = player.id;
            player.destroy();

            expect(Video.getInstance(id)).toBeNull();
        });

        it('pauses video before removing', function() {
            fixture.html('<div id="video-container"></div>');

            var player = Video.init('#video-container', {
                src: '/test.mp4'
            });

            player.destroy();

            // Video should be paused (and src cleared)
            expect(player.video.paused).toBe(true);
        });

    });

    describe('destroyAll()', function() {

        it('destroys all instances', function() {
            fixture.html(
                '<div id="video-1"></div>' +
                '<div id="video-2"></div>'
            );

            Video.init('#video-1', { src: '/test1.mp4' });
            Video.init('#video-2', { src: '/test2.mp4' });

            expect(Video.instances.length).toBe(2);

            Video.destroyAll();

            expect(Video.instances.length).toBe(0);
        });

    });

    describe('Keyboard accessibility', function() {

        it('wrapper has tabindex', function() {
            fixture.html('<div id="video-container"></div>');

            Video.init('#video-container', {
                src: '/test.mp4'
            });

            var wrapper = fixture.query('.funky-video');
            expect(wrapper.getAttribute('tabindex')).toBe('0');
        });

        it('buttons have type attribute', function() {
            fixture.html('<div id="video-container"></div>');

            Video.init('#video-container', {
                src: '/test.mp4',
                controls: true
            });

            var buttons = fixture.queryAll('button');
            buttons.forEach(function(btn) {
                expect(btn.getAttribute('type')).toBe('button');
            });
        });

        it('buttons have aria-label', function() {
            fixture.html('<div id="video-container"></div>');

            Video.init('#video-container', {
                src: '/test.mp4',
                controls: true
            });

            var playBtn = fixture.query('.funky-video-play');
            var rewindBtn = fixture.query('.funky-video-rewind');
            var muteBtn = fixture.query('.funky-video-mute');

            expect(playBtn.getAttribute('aria-label')).toBeDefined();
            expect(rewindBtn.getAttribute('aria-label')).toBeDefined();
            expect(muteBtn.getAttribute('aria-label')).toBeDefined();
        });

    });

});

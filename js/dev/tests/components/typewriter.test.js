/**
 * Funky.Typewriter - Unit Tests
 * Tests for typewriter animation, controls, and options
 */
FunkyTests.describe('Funky.Component.Typewriter', function() {
    'use strict';

    var Typewriter;
    var testContainer;

    FunkyTests.beforeEach(function() {
        Typewriter = Funky.Typewriter;

        // Create test container
        testContainer = document.createElement('div');
        testContainer.id = 'typewriter-test-container';
        document.body.appendChild(testContainer);
    });

    FunkyTests.afterEach(function() {
        // Destroy instance
        if (Typewriter) {
            Typewriter.destroy(testContainer);
        }

        // Remove test container
        if (testContainer && testContainer.parentNode) {
            testContainer.parentNode.removeChild(testContainer);
        }
    });

    // =========================================================================
    // REGISTRATION
    // =========================================================================

    FunkyTests.describe('Registration', function() {

        FunkyTests.it('should be registered with Funky namespace', function() {
            FunkyTests.expect(Funky.Typewriter).toBeDefined();
        });

        FunkyTests.it('should expose expected API methods', function() {
            FunkyTests.expect(typeof Typewriter.create).toBe('function');
            FunkyTests.expect(typeof Typewriter.get).toBe('function');
            FunkyTests.expect(typeof Typewriter.destroy).toBe('function');
            FunkyTests.expect(typeof Typewriter.initAll).toBe('function');
        });

        FunkyTests.it('should expose defaults', function() {
            FunkyTests.expect(Typewriter.defaults).toBeDefined();
            FunkyTests.expect(Typewriter.defaults.speed).toBe(50);
            FunkyTests.expect(Typewriter.defaults.cursor).toBe(true);
        });

    });

    // =========================================================================
    // CREATE
    // =========================================================================

    FunkyTests.describe('create()', function() {

        FunkyTests.it('should create instance with text', function() {
            var instance = Typewriter.create(testContainer, {
                text: 'Hello World',
                autoStart: false
            });

            FunkyTests.expect(instance).toBeDefined();
            FunkyTests.expect(instance.element).toBe(testContainer);
        });

        FunkyTests.it('should add funky-typewriter class', function() {
            Typewriter.create(testContainer, {
                text: 'Test',
                autoStart: false
            });

            FunkyTests.expect(testContainer.classList.contains('funky-typewriter')).toBe(true);
        });

        FunkyTests.it('should create text container element', function() {
            Typewriter.create(testContainer, {
                text: 'Test',
                autoStart: false
            });

            var textContainer = testContainer.querySelector('.funky-typewriter-text');
            FunkyTests.expect(textContainer).toBeDefined();
        });

        FunkyTests.it('should create cursor element by default', function() {
            Typewriter.create(testContainer, {
                text: 'Test',
                autoStart: false
            });

            var cursor = testContainer.querySelector('.funky-typewriter-cursor');
            FunkyTests.expect(cursor).toBeDefined();
        });

        FunkyTests.it('should not create cursor when cursor: false', function() {
            Typewriter.create(testContainer, {
                text: 'Test',
                cursor: false,
                autoStart: false
            });

            var cursor = testContainer.querySelector('.funky-typewriter-cursor');
            FunkyTests.expect(cursor).toBe(null);
        });

        FunkyTests.it('should accept selector string', function() {
            var instance = Typewriter.create('#typewriter-test-container', {
                text: 'Test',
                autoStart: false
            });

            FunkyTests.expect(instance).toBeDefined();
            FunkyTests.expect(instance.element).toBe(testContainer);
        });

        FunkyTests.it('should return null for invalid selector', function() {
            var instance = Typewriter.create('#non-existent', {
                text: 'Test'
            });

            FunkyTests.expect(instance).toBe(null);
        });

        FunkyTests.it('should destroy existing instance before creating new', function() {
            var first = Typewriter.create(testContainer, { text: 'First', autoStart: false });
            var second = Typewriter.create(testContainer, { text: 'Second', autoStart: false });

            FunkyTests.expect(first.destroyed).toBe(true);
            FunkyTests.expect(second.destroyed).toBe(false);
        });

    });

    // =========================================================================
    // CURSOR STYLES
    // =========================================================================

    FunkyTests.describe('Cursor Styles', function() {

        FunkyTests.it('should apply bar cursor style', function() {
            Typewriter.create(testContainer, {
                text: 'Test',
                cursorStyle: 'bar',
                autoStart: false
            });

            var cursor = testContainer.querySelector('.funky-typewriter-cursor');
            FunkyTests.expect(cursor.classList.contains('funky-typewriter-cursor-bar')).toBe(true);
        });

        FunkyTests.it('should apply underscore cursor style', function() {
            Typewriter.create(testContainer, {
                text: 'Test',
                cursorStyle: 'underscore',
                autoStart: false
            });

            var cursor = testContainer.querySelector('.funky-typewriter-cursor');
            FunkyTests.expect(cursor.classList.contains('funky-typewriter-cursor-underscore')).toBe(true);
        });

        FunkyTests.it('should apply block cursor style', function() {
            Typewriter.create(testContainer, {
                text: 'Test',
                cursorStyle: 'block',
                autoStart: false
            });

            var cursor = testContainer.querySelector('.funky-typewriter-cursor');
            FunkyTests.expect(cursor.classList.contains('funky-typewriter-cursor-block')).toBe(true);
        });

        FunkyTests.it('should make cursor static when cursorBlink: false', function() {
            Typewriter.create(testContainer, {
                text: 'Test',
                cursorBlink: false,
                autoStart: false
            });

            var cursor = testContainer.querySelector('.funky-typewriter-cursor');
            FunkyTests.expect(cursor.classList.contains('funky-typewriter-cursor-static')).toBe(true);
        });

    });

    // =========================================================================
    // SIZE AND MONO
    // =========================================================================

    FunkyTests.describe('Size and Mono Options', function() {

        FunkyTests.it('should apply size class', function() {
            Typewriter.create(testContainer, {
                text: 'Test',
                size: 'lg',
                autoStart: false
            });

            FunkyTests.expect(testContainer.classList.contains('funky-typewriter-lg')).toBe(true);
        });

        FunkyTests.it('should apply mono class', function() {
            Typewriter.create(testContainer, {
                text: 'Test',
                mono: true,
                autoStart: false
            });

            FunkyTests.expect(testContainer.classList.contains('funky-typewriter-mono')).toBe(true);
        });

    });

    // =========================================================================
    // TYPING ANIMATION
    // =========================================================================

    FunkyTests.describe('Typing Animation', function() {

        FunkyTests.it('should type text letter by letter', function(done) {
            var typedChars = [];

            var instance = Typewriter.create(testContainer, {
                text: 'Hi',
                speed: 10,
                onType: function(char) {
                    typedChars.push(char);
                },
                onComplete: function() {
                    FunkyTests.expect(typedChars.length).toBe(2);
                    FunkyTests.expect(typedChars[0]).toBe('H');
                    FunkyTests.expect(typedChars[1]).toBe('i');
                    done();
                }
            });
        });

        FunkyTests.it('should add is-typing class during animation', function(done) {
            Typewriter.create(testContainer, {
                text: 'Test',
                speed: 10,
                onStart: function() {
                    FunkyTests.expect(testContainer.classList.contains('is-typing')).toBe(true);
                    done();
                }
            });
        });

        FunkyTests.it('should fire onStart callback', function(done) {
            var started = false;

            Typewriter.create(testContainer, {
                text: 'Test',
                speed: 10,
                onStart: function() {
                    started = true;
                    FunkyTests.expect(started).toBe(true);
                    done();
                }
            });
        });

        FunkyTests.it('should fire onComplete callback', function(done) {
            Typewriter.create(testContainer, {
                text: 'OK',
                speed: 10,
                onComplete: function() {
                    FunkyTests.expect(true).toBe(true);
                    done();
                }
            });
        });

        FunkyTests.it('should display typed text', function(done) {
            Typewriter.create(testContainer, {
                text: 'Hello',
                speed: 5,
                onComplete: function() {
                    var textContainer = testContainer.querySelector('.funky-typewriter-text');
                    FunkyTests.expect(textContainer.textContent).toBe('Hello');
                    done();
                }
            });
        });

    });

    // =========================================================================
    // WORD AND LINE MODES
    // =========================================================================

    FunkyTests.describe('Typing Modes', function() {

        FunkyTests.it('should type word by word in word mode', function(done) {
            var units = [];

            Typewriter.create(testContainer, {
                text: 'Hello World',
                mode: 'word',
                speed: 10,
                onType: function(unit) {
                    units.push(unit);
                },
                onComplete: function() {
                    // Should be 'Hello', ' ', 'World'
                    FunkyTests.expect(units.length).toBe(3);
                    done();
                }
            });
        });

    });

    // =========================================================================
    // CONTROLS
    // =========================================================================

    FunkyTests.describe('Instance Controls', function() {

        FunkyTests.it('should pause animation', function(done) {
            var instance = Typewriter.create(testContainer, {
                text: 'Hello World',
                speed: 50,
                autoStart: false
            });

            instance.start();

            setTimeout(function() {
                instance.pause();
                FunkyTests.expect(instance.isPaused).toBe(true);
                FunkyTests.expect(testContainer.classList.contains('is-paused')).toBe(true);
                done();
            }, 100);
        });

        FunkyTests.it('should resume animation after pause', function(done) {
            var instance = Typewriter.create(testContainer, {
                text: 'Hi',
                speed: 20,
                autoStart: false
            });

            instance.start();

            setTimeout(function() {
                instance.pause();
                instance.resume();
                FunkyTests.expect(instance.isPaused).toBe(false);
                done();
            }, 30);
        });

        FunkyTests.it('should clear text', function(done) {
            var instance = Typewriter.create(testContainer, {
                text: 'Test',
                autoStart: false
            });

            instance.start();

            setTimeout(function() {
                instance.clear();

                var textContainer = testContainer.querySelector('.funky-typewriter-text');
                FunkyTests.expect(textContainer.textContent).toBe('');
                FunkyTests.expect(instance.currentText).toBe('');
                done();
            }, 100);
        });

        FunkyTests.it('should type new text with type() method', function(done) {
            var instance = Typewriter.create(testContainer, {
                text: 'First',
                speed: 10,
                autoStart: false
            });

            instance.type('New');

            // Wait long enough for 3 chars at 10ms each plus buffer
            // Increase timeout to 500ms for slower test environments
            setTimeout(function() {
                var textContainer = testContainer.querySelector('.funky-typewriter-text');
                FunkyTests.expect(textContainer.textContent).toBe('New');
                done();
            }, 500);
        });

    });

    // =========================================================================
    // TEXT QUEUE
    // =========================================================================

    FunkyTests.describe('Text Queue', function() {

        FunkyTests.it('should accept array of texts', function() {
            var instance = Typewriter.create(testContainer, {
                text: ['First', 'Second', 'Third'],
                autoStart: false
            });

            FunkyTests.expect(instance.textQueue.length).toBe(3);
        });

        FunkyTests.it('should cycle through text queue', function(done) {
            var completions = 0;

            Typewriter.create(testContainer, {
                text: ['A', 'B'],
                speed: 5,
                deleteSpeed: 5,
                pauseOnComplete: 10,
                onComplete: function() {
                    completions++;
                    if (completions === 2) {
                        FunkyTests.expect(completions).toBe(2);
                        done();
                    }
                }
            });
        });

    });

    // =========================================================================
    // LOOPING
    // =========================================================================

    FunkyTests.describe('Looping', function() {

        FunkyTests.it('should loop when loop: true', function(done) {
            var loopCount = 0;

            var instance = Typewriter.create(testContainer, {
                text: 'X',
                speed: 5,
                deleteSpeed: 5,
                loop: true,
                loopDelay: 10,
                pauseOnComplete: 5,
                onLoop: function(count) {
                    loopCount = count;
                    if (count >= 2) {
                        instance.pause();
                        FunkyTests.expect(loopCount).toBeGreaterThan(0);
                        done();
                    }
                }
            });
        });

    });

    // =========================================================================
    // GET AND DESTROY
    // =========================================================================

    FunkyTests.describe('get() and destroy()', function() {

        FunkyTests.it('should get instance', function() {
            Typewriter.create(testContainer, {
                text: 'Test',
                autoStart: false
            });

            var instance = Typewriter.get(testContainer);
            FunkyTests.expect(instance).toBeDefined();
            FunkyTests.expect(instance.element).toBe(testContainer);
        });

        FunkyTests.it('should return null for element without instance', function() {
            var instance = Typewriter.get(testContainer);
            FunkyTests.expect(instance).toBe(null);
        });

        FunkyTests.it('should destroy instance', function() {
            var instance = Typewriter.create(testContainer, {
                text: 'Test',
                autoStart: false
            });

            Typewriter.destroy(testContainer);

            FunkyTests.expect(instance.destroyed).toBe(true);
            FunkyTests.expect(testContainer.classList.contains('funky-typewriter')).toBe(false);
        });

        FunkyTests.it('should clear content on destroy', function() {
            Typewriter.create(testContainer, {
                text: 'Test',
                autoStart: false
            });

            Typewriter.destroy(testContainer);

            FunkyTests.expect(testContainer.innerHTML).toBe('');
        });

    });

    // =========================================================================
    // DATA ATTRIBUTE INITIALIZATION
    // =========================================================================

    FunkyTests.describe('Data Attribute Parsing', function() {

        FunkyTests.it('should parse text from data-typewriter attribute', function() {
            testContainer.setAttribute('data-typewriter', 'Hello from data');

            var options = Typewriter._parseDataOptions(testContainer);

            FunkyTests.expect(options.text).toBe('Hello from data');
        });

        FunkyTests.it('should parse pipe-separated texts as array', function() {
            testContainer.setAttribute('data-typewriter', 'First | Second | Third');

            var options = Typewriter._parseDataOptions(testContainer);

            FunkyTests.expect(Array.isArray(options.text)).toBe(true);
            FunkyTests.expect(options.text.length).toBe(3);
            FunkyTests.expect(options.text[0]).toBe('First');
        });

        FunkyTests.it('should parse speed attribute', function() {
            testContainer.setAttribute('data-typewriter', 'Test');
            testContainer.setAttribute('data-typewriter-speed', '100');

            var options = Typewriter._parseDataOptions(testContainer);

            FunkyTests.expect(options.speed).toBe(100);
        });

        FunkyTests.it('should parse cursor attribute', function() {
            testContainer.setAttribute('data-typewriter', 'Test');
            testContainer.setAttribute('data-typewriter-cursor', 'false');

            var options = Typewriter._parseDataOptions(testContainer);

            FunkyTests.expect(options.cursor).toBe(false);
        });

        FunkyTests.it('should parse loop attribute', function() {
            testContainer.setAttribute('data-typewriter', 'Test');
            testContainer.setAttribute('data-typewriter-loop', 'true');

            var options = Typewriter._parseDataOptions(testContainer);

            FunkyTests.expect(options.loop).toBe(true);
        });

        FunkyTests.it('should parse mode attribute', function() {
            testContainer.setAttribute('data-typewriter', 'Test');
            testContainer.setAttribute('data-typewriter-mode', 'word');

            var options = Typewriter._parseDataOptions(testContainer);

            FunkyTests.expect(options.mode).toBe('word');
        });

        FunkyTests.it('should parse size attribute', function() {
            testContainer.setAttribute('data-typewriter', 'Test');
            testContainer.setAttribute('data-typewriter-size', 'xl');

            var options = Typewriter._parseDataOptions(testContainer);

            FunkyTests.expect(options.size).toBe('xl');
        });

        FunkyTests.it('should parse mono attribute', function() {
            testContainer.setAttribute('data-typewriter', 'Test');
            testContainer.setAttribute('data-typewriter-mono', 'true');

            var options = Typewriter._parseDataOptions(testContainer);

            FunkyTests.expect(options.mono).toBe(true);
        });

    });

    // =========================================================================
    // INIT ALL
    // =========================================================================

    FunkyTests.describe('initAll()', function() {

        FunkyTests.it('should initialize all data-typewriter elements', function() {
            var el1 = document.createElement('div');
            el1.setAttribute('data-typewriter', 'First');
            testContainer.appendChild(el1);

            var el2 = document.createElement('div');
            el2.setAttribute('data-typewriter', 'Second');
            testContainer.appendChild(el2);

            var instances = Typewriter.initAll(testContainer);

            FunkyTests.expect(instances.length).toBe(2);

            // Clean up
            Typewriter.destroy(el1);
            Typewriter.destroy(el2);
        });

        FunkyTests.it('should not re-initialize existing instances', function() {
            var el = document.createElement('div');
            el.setAttribute('data-typewriter', 'Test');
            testContainer.appendChild(el);

            var first = Typewriter.initAll(testContainer);
            var second = Typewriter.initAll(testContainer);

            FunkyTests.expect(first.length).toBe(1);
            FunkyTests.expect(second.length).toBe(0);

            // Clean up
            Typewriter.destroy(el);
        });

    });

    // =========================================================================
    // ACCESSIBILITY
    // =========================================================================

    FunkyTests.describe('Accessibility', function() {

        FunkyTests.it('should have aria-live on text container', function() {
            Typewriter.create(testContainer, {
                text: 'Test',
                autoStart: false
            });

            var textContainer = testContainer.querySelector('.funky-typewriter-text');
            FunkyTests.expect(textContainer.getAttribute('aria-live')).toBe('polite');
        });

    });

});

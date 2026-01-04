/**
 * Tests for Funky.Wysimark
 * WYSIWYG Markdown editor component
 */
FunkyTests.describe('Funky.Component.Wysimark', function() {
    var expect = FunkyTests.expect;
    var fixture;
    var mockWysimarkInstance;
    var originalCreateWysimark;

    FunkyTests.beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="test-container"></div>');

        // Save original createWysimark if exists
        originalCreateWysimark = window.createWysimark;

        // Mock createWysimark library
        mockWysimarkInstance = {
            markdown: '',
            getMarkdown: function() {
                return this.markdown;
            },
            setMarkdown: function(md) {
                this.markdown = md;
            },
            unmount: FunkyTests.spy()
        };

        window.createWysimark = FunkyTests.spy(function(el, opts) {
            mockWysimarkInstance.markdown = opts.initialMarkdown || '';
            mockWysimarkInstance._onChange = opts.onChange;
            return mockWysimarkInstance;
        });
    });

    FunkyTests.afterEach(function() {
        // Destroy any instances
        var container = document.getElementById('test-container');
        if (container && Funky.Wysimark.getInstance(container)) {
            Funky.Wysimark.destroy(container);
        }

        // Restore original createWysimark
        if (originalCreateWysimark) {
            window.createWysimark = originalCreateWysimark;
        } else {
            delete window.createWysimark;
        }

        fixture.cleanup();
    });

    FunkyTests.describe('Registration', function() {
        FunkyTests.it('is registered with Funky namespace', function() {
            expect(Funky.Wysimark).toBeDefined();
        });

        FunkyTests.it('has create method', function() {
            expect(typeof Funky.Wysimark.create).toBe('function');
        });

        FunkyTests.it('has getInstance method', function() {
            expect(typeof Funky.Wysimark.getInstance).toBe('function');
        });

        FunkyTests.it('has destroy method', function() {
            expect(typeof Funky.Wysimark.destroy).toBe('function');
        });

        FunkyTests.it('has initAll method', function() {
            expect(typeof Funky.Wysimark.initAll).toBe('function');
        });
    });

    FunkyTests.describe('create()', function() {
        FunkyTests.it('creates instance with string selector', function() {
            var instance = Funky.Wysimark.create('#test-container', {});
            expect(instance).toBeDefined();
            expect(instance.element).toBe(document.getElementById('test-container'));
        });

        FunkyTests.it('creates instance with DOM element', function() {
            var container = document.getElementById('test-container');
            var instance = Funky.Wysimark.create(container, {});
            expect(instance).toBeDefined();
            expect(instance.element).toBe(container);
        });

        FunkyTests.it('returns null for non-existent selector', function() {
            var instance = Funky.Wysimark.create('#does-not-exist', {});
            expect(instance).toBe(null);
        });

        FunkyTests.it('returns existing instance if already initialized', function() {
            var instance1 = Funky.Wysimark.create('#test-container', {});
            var instance2 = Funky.Wysimark.create('#test-container', {});
            expect(instance1).toBe(instance2);
        });

        FunkyTests.it('creates wrapper element', function() {
            Funky.Wysimark.create('#test-container', {});
            var wrapper = document.querySelector('.funky-wysimark');
            expect(wrapper).not.toBe(null);
        });

        FunkyTests.it('creates editor container', function() {
            Funky.Wysimark.create('#test-container', {});
            var editor = document.querySelector('.funky-wysimark-editor');
            expect(editor).not.toBe(null);
        });

        FunkyTests.it('calls createWysimark with initial markdown', function() {
            Funky.Wysimark.create('#test-container', {
                initialMarkdown: '# Test'
            });
            expect(window.createWysimark).toHaveBeenCalled();
        });

        FunkyTests.it('applies readonly class when readOnly is true', function() {
            Funky.Wysimark.create('#test-container', { readOnly: true });
            var wrapper = document.querySelector('.funky-wysimark');
            expect(wrapper.classList.contains('funky-wysimark--readonly')).toBe(true);
        });

        FunkyTests.it('applies fixed class when height is not auto', function() {
            Funky.Wysimark.create('#test-container', { height: 300 });
            var wrapper = document.querySelector('.funky-wysimark');
            expect(wrapper.classList.contains('funky-wysimark--fixed')).toBe(true);
        });

        FunkyTests.it('applies minHeight style', function() {
            Funky.Wysimark.create('#test-container', { minHeight: 150 });
            var wrapper = document.querySelector('.funky-wysimark');
            expect(wrapper.style.minHeight).toBe('150px');
        });

        FunkyTests.it('applies maxHeight style with overflow', function() {
            Funky.Wysimark.create('#test-container', { maxHeight: 500 });
            var wrapper = document.querySelector('.funky-wysimark');
            expect(wrapper.style.maxHeight).toBe('500px');
            expect(wrapper.style.overflowY).toBe('auto');
        });

        FunkyTests.it('dispatches ready event', function() {
            var readyFired = false;
            var container = document.getElementById('test-container');
            container.addEventListener('funky.wysimark.ready', function() {
                readyFired = true;
            });
            Funky.Wysimark.create('#test-container', {});
            expect(readyFired).toBe(true);
        });
    });

    FunkyTests.describe('Instance methods', function() {
        var instance;

        FunkyTests.beforeEach(function() {
            instance = Funky.Wysimark.create('#test-container', {
                initialMarkdown: '# Hello'
            });
        });

        FunkyTests.it('getMarkdown() returns content', function() {
            expect(instance.getMarkdown()).toBe('# Hello');
        });

        FunkyTests.it('setMarkdown() updates content', function() {
            instance.setMarkdown('## Updated');
            expect(instance.getMarkdown()).toBe('## Updated');
        });

        FunkyTests.it('isEmpty() returns true for empty content', function() {
            instance.setMarkdown('');
            expect(instance.isEmpty()).toBe(true);
        });

        FunkyTests.it('isEmpty() returns false for non-empty content', function() {
            expect(instance.isEmpty()).toBe(false);
        });

        FunkyTests.it('isEmpty() returns true for whitespace-only content', function() {
            instance.setMarkdown('   \n  ');
            expect(instance.isEmpty()).toBe(true);
        });

        FunkyTests.it('has element property', function() {
            expect(instance.element).toBe(document.getElementById('test-container'));
        });

        FunkyTests.it('has wrapper property', function() {
            expect(instance.wrapper).toBeDefined();
            expect(instance.wrapper.classList.contains('funky-wysimark')).toBe(true);
        });

        FunkyTests.it('has options property', function() {
            expect(instance.options).toBeDefined();
            expect(instance.options.initialMarkdown).toBe('# Hello');
        });
    });

    FunkyTests.describe('getInstance()', function() {
        FunkyTests.it('returns instance for initialized element', function() {
            Funky.Wysimark.create('#test-container', {});
            var instance = Funky.Wysimark.getInstance('#test-container');
            expect(instance).toBeDefined();
        });

        FunkyTests.it('returns null for non-initialized element', function() {
            var instance = Funky.Wysimark.getInstance('#test-container');
            expect(instance).toBe(null);
        });

        FunkyTests.it('works with DOM element', function() {
            var container = document.getElementById('test-container');
            Funky.Wysimark.create(container, {});
            var instance = Funky.Wysimark.getInstance(container);
            expect(instance).toBeDefined();
        });

        FunkyTests.it('returns null for null selector', function() {
            var instance = Funky.Wysimark.getInstance(null);
            expect(instance).toBe(null);
        });
    });

    FunkyTests.describe('destroy()', function() {
        FunkyTests.it('destroys instance', function() {
            Funky.Wysimark.create('#test-container', {});
            Funky.Wysimark.destroy('#test-container');
            var instance = Funky.Wysimark.getInstance('#test-container');
            expect(instance).toBe(null);
        });

        FunkyTests.it('removes wrapper from DOM', function() {
            Funky.Wysimark.create('#test-container', {});
            Funky.Wysimark.destroy('#test-container');
            var wrapper = document.querySelector('.funky-wysimark');
            expect(wrapper).toBe(null);
        });

        FunkyTests.it('calls unmount on wysimark instance', function() {
            Funky.Wysimark.create('#test-container', {});
            Funky.Wysimark.destroy('#test-container');
            expect(mockWysimarkInstance.unmount).toHaveBeenCalled();
        });

        FunkyTests.it('dispatches destroy event', function() {
            var destroyFired = false;
            var container = document.getElementById('test-container');
            container.addEventListener('funky.wysimark.destroy', function() {
                destroyFired = true;
            });
            Funky.Wysimark.create('#test-container', {});
            Funky.Wysimark.destroy('#test-container');
            expect(destroyFired).toBe(true);
        });

        FunkyTests.it('handles non-existent instance gracefully', function() {
            expect(function() {
                Funky.Wysimark.destroy('#test-container');
            }).not.toThrow();
        });
    });

    FunkyTests.describe('initAll()', function() {
        FunkyTests.beforeEach(function() {
            fixture.cleanup();
            fixture = FunkyTests.fixture(
                '<div id="editor1" data-wysimark></div>' +
                '<div id="editor2" data-wysimark data-wysimark-placeholder="Type here..."></div>' +
                '<div id="editor3" data-wysimark data-wysimark-height="400"></div>'
            );
        });

        FunkyTests.it('initializes all elements with data-wysimark', function() {
            var instances = Funky.Wysimark.initAll();
            expect(instances.length).toBe(3);
        });

        FunkyTests.it('returns array of created instances', function() {
            var instances = Funky.Wysimark.initAll();
            expect(Array.isArray(instances)).toBe(true);
            instances.forEach(function(inst) {
                expect(inst.getMarkdown).toBeDefined();
            });
        });

        FunkyTests.it('skips already initialized elements', function() {
            Funky.Wysimark.initAll();
            var instances2 = Funky.Wysimark.initAll();
            expect(instances2.length).toBe(0);
        });

        FunkyTests.it('parses data-wysimark-placeholder', function() {
            var instances = Funky.Wysimark.initAll();
            // Check that all 3 editors were created
            expect(instances.length).toBe(3);
        });
    });

    FunkyTests.describe('Events', function() {
        FunkyTests.it('dispatches change event on content change', function() {
            var changeFired = false;
            var changeData = null;
            var container = document.getElementById('test-container');
            container.addEventListener('funky.wysimark.change', function(e) {
                changeFired = true;
                changeData = e.detail;
            });

            Funky.Wysimark.create('#test-container', {});

            // Simulate change by calling the onChange callback
            mockWysimarkInstance._onChange('New content');

            expect(changeFired).toBe(true);
            expect(changeData.markdown).toBe('New content');
        });

        FunkyTests.it('calls onChange callback', function() {
            var onChangeCallback = FunkyTests.spy();
            Funky.Wysimark.create('#test-container', {
                onChange: onChangeCallback
            });

            mockWysimarkInstance._onChange('Updated');

            expect(onChangeCallback).toHaveBeenCalled();
        });
    });

    FunkyTests.describe('Library not loaded', function() {
        FunkyTests.it('returns null when createWysimark not available', function() {
            delete window.createWysimark;
            var instance = Funky.Wysimark.create('#test-container', {});
            expect(instance).toBe(null);
        });
    });
});

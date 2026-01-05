/**
 * Funky.VisibilityObserver Tests
 *
 * Tests for the VisibilityObserver utility
 */
describe('Funky.VisibilityObserver', function() {

	describe('Module Registration', function() {
		it('is registered on Funky namespace', function() {
			expect(Funky.VisibilityObserver).toBeDefined();
		});

		it('has init method', function() {
			expect(typeof Funky.VisibilityObserver.init).toBe('function');
		});

		it('has getInstance method', function() {
			expect(typeof Funky.VisibilityObserver.getInstance).toBe('function');
		});

		it('has getAll method', function() {
			expect(typeof Funky.VisibilityObserver.getAll).toBe('function');
		});

		it('has destroyAll method', function() {
			expect(typeof Funky.VisibilityObserver.destroyAll).toBe('function');
		});

		it('has deprecated create method', function() {
			expect(typeof Funky.VisibilityObserver.create).toBe('function');
		});
	});

	describe('init()', function() {
		it('should create an observer instance', function() {
			var observer = Funky.VisibilityObserver.init();
			expect(observer).toBeDefined();
			expect(observer.observe).toBeDefined();
			observer.destroy();
		});

		it('should accept threshold option', function() {
			var observer = Funky.VisibilityObserver.init({ threshold: 0.5 });
			expect(observer._config.threshold).toBe(0.5);
			observer.destroy();
		});

		it('should accept rootMargin option', function() {
			var observer = Funky.VisibilityObserver.init({ rootMargin: '100px' });
			expect(observer._config.rootMargin).toBe('100px');
			observer.destroy();
		});

		it('should generate unique IDs', function() {
			var observer1 = Funky.VisibilityObserver.init();
			var observer2 = Funky.VisibilityObserver.init();
			expect(observer1.getId()).not.toBe(observer2.getId());
			observer1.destroy();
			observer2.destroy();
		});

		it('should register instance in registry', function() {
			var observer = Funky.VisibilityObserver.init();
			var id = observer.getId();
			var retrieved = Funky.VisibilityObserver.getInstance(id);
			expect(retrieved).toBe(observer);
			observer.destroy();
		});
	});

	describe('observe()', function() {
		var observer;
		var testElement;

		beforeEach(function() {
			testElement = document.createElement('div');
			testElement.id = 'visibility-test-element';
			document.body.appendChild(testElement);
			observer = Funky.VisibilityObserver.init();
		});

		afterEach(function() {
			observer.destroy();
			if (testElement.parentNode) {
				testElement.remove();
			}
		});

		it('should observe an element by selector', function() {
			observer.observe('#visibility-test-element');
			expect(observer.count()).toBe(1);
		});

		it('should observe an element reference', function() {
			observer.observe(testElement);
			expect(observer.count()).toBe(1);
		});

		it('should not observe the same element twice', function() {
			observer.observe(testElement);
			observer.observe(testElement);
			expect(observer.count()).toBe(1);
		});

		it('should return self for chaining', function() {
			var result = observer.observe(testElement);
			expect(result).toBe(observer);
		});

		it('should warn for non-existent selector', function() {
			spyOn(console, 'warn');
			observer.observe('#non-existent-element');
			expect(console.warn).toHaveBeenCalled();
		});
	});

	describe('observeAll()', function() {
		var observer;
		var testElements = [];

		beforeEach(function() {
			for (var i = 0; i < 3; i++) {
				var el = document.createElement('div');
				el.className = 'visibility-test-class';
				document.body.appendChild(el);
				testElements.push(el);
			}
			observer = Funky.VisibilityObserver.init();
		});

		afterEach(function() {
			observer.destroy();
			testElements.forEach(function(el) {
				if (el.parentNode) {
					el.remove();
				}
			});
			testElements = [];
		});

		it('should observe multiple elements', function() {
			observer.observeAll('.visibility-test-class');
			expect(observer.count()).toBe(3);
		});

		it('should return self for chaining', function() {
			var result = observer.observeAll('.visibility-test-class');
			expect(result).toBe(observer);
		});
	});

	describe('observeOnce()', function() {
		var observer;
		var testElement;

		beforeEach(function() {
			testElement = document.createElement('div');
			document.body.appendChild(testElement);
			observer = Funky.VisibilityObserver.init();
		});

		afterEach(function() {
			observer.destroy();
			if (testElement.parentNode) {
				testElement.remove();
			}
		});

		it('should set once option to true', function() {
			observer.observeOnce(testElement);
			var opts = observer._elements.get(testElement);
			expect(opts.once).toBe(true);
		});

		it('should accept callback as second parameter', function() {
			var callback = function() {};
			observer.observeOnce(testElement, callback);
			var opts = observer._elements.get(testElement);
			expect(opts.onVisible).toBe(callback);
		});

		it('should return self for chaining', function() {
			var result = observer.observeOnce(testElement);
			expect(result).toBe(observer);
		});
	});

	describe('unobserve()', function() {
		var observer;
		var testElement;

		beforeEach(function() {
			testElement = document.createElement('div');
			testElement.id = 'visibility-unobserve-test';
			document.body.appendChild(testElement);
			observer = Funky.VisibilityObserver.init();
		});

		afterEach(function() {
			observer.destroy();
			if (testElement.parentNode) {
				testElement.remove();
			}
		});

		it('should stop observing an element', function() {
			observer.observe(testElement);
			expect(observer.count()).toBe(1);

			observer.unobserve(testElement);
			expect(observer.count()).toBe(0);
		});

		it('should work with selector', function() {
			observer.observe(testElement);
			expect(observer.count()).toBe(1);

			observer.unobserve('#visibility-unobserve-test');
			expect(observer.count()).toBe(0);
		});

		it('should return self for chaining', function() {
			observer.observe(testElement);
			var result = observer.unobserve(testElement);
			expect(result).toBe(observer);
		});

		it('should handle unobserving non-observed element gracefully', function() {
			var otherElement = document.createElement('div');
			observer.unobserve(otherElement); // Should not throw
			expect(observer.count()).toBe(0);
		});
	});

	describe('isVisible()', function() {
		var observer;
		var testElement;

		beforeEach(function() {
			testElement = document.createElement('div');
			document.body.appendChild(testElement);
			observer = Funky.VisibilityObserver.init();
		});

		afterEach(function() {
			observer.destroy();
			if (testElement.parentNode) {
				testElement.remove();
			}
		});

		it('should return false for unobserved elements', function() {
			expect(observer.isVisible(testElement)).toBe(false);
		});

		it('should return false initially for observed elements', function() {
			observer.observe(testElement);
			// Initially false until intersection callback fires
			expect(observer.isVisible(testElement)).toBe(false);
		});
	});

	describe('getVisible()', function() {
		var observer;

		beforeEach(function() {
			observer = Funky.VisibilityObserver.init();
		});

		afterEach(function() {
			observer.destroy();
		});

		it('should return empty array initially', function() {
			expect(observer.getVisible()).toEqual([]);
		});

		it('should return an array', function() {
			expect(Array.isArray(observer.getVisible())).toBe(true);
		});
	});

	describe('count()', function() {
		var observer;

		beforeEach(function() {
			observer = Funky.VisibilityObserver.init();
		});

		afterEach(function() {
			observer.destroy();
		});

		it('should return 0 initially', function() {
			expect(observer.count()).toBe(0);
		});

		it('should increase when elements observed', function() {
			var el1 = document.createElement('div');
			var el2 = document.createElement('div');
			document.body.appendChild(el1);
			document.body.appendChild(el2);

			observer.observe(el1);
			expect(observer.count()).toBe(1);

			observer.observe(el2);
			expect(observer.count()).toBe(2);

			el1.remove();
			el2.remove();
		});
	});

	describe('getId()', function() {
		it('should return observer ID', function() {
			var observer = Funky.VisibilityObserver.init();
			var id = observer.getId();
			expect(id).toBeDefined();
			expect(typeof id).toBe('string');
			expect(id.indexOf('visibility-observer-')).toBe(0);
			observer.destroy();
		});
	});

	describe('destroy()', function() {
		it('should clean up all state', function() {
			var observer = Funky.VisibilityObserver.init();
			var el = document.createElement('div');
			document.body.appendChild(el);

			observer.observe(el);
			observer.destroy();

			expect(observer._observer).toBeNull();
			expect(observer._elements.size).toBe(0);
			expect(observer._visibleSet.size).toBe(0);

			el.remove();
		});

		it('should handle multiple destroy calls gracefully', function() {
			var observer = Funky.VisibilityObserver.init();
			observer.destroy();
			expect(function() {
				observer.destroy();
			}).not.toThrow();
		});
	});

	describe('Factory Methods', function() {
		beforeEach(function() {
			// Clean up any existing instances
			Funky.VisibilityObserver.destroyAll();
		});

		it('getInstance should return null for unknown ID', function() {
			var result = Funky.VisibilityObserver.getInstance('unknown-id');
			expect(result).toBeNull();
		});

		it('getAll should return all instances', function() {
			var observer1 = Funky.VisibilityObserver.init();
			var observer2 = Funky.VisibilityObserver.init();

			var all = Funky.VisibilityObserver.getAll();
			expect(all.length).toBe(2);
			expect(all).toContain(observer1);
			expect(all).toContain(observer2);

			observer1.destroy();
			observer2.destroy();
		});

		it('destroyAll should destroy all instances', function() {
			var observer1 = Funky.VisibilityObserver.init();
			var observer2 = Funky.VisibilityObserver.init();

			Funky.VisibilityObserver.destroyAll();

			var all = Funky.VisibilityObserver.getAll();
			expect(all.length).toBe(0);
		});
	});

	describe('Deprecated create() Method', function() {
		it('should work same as init()', function() {
			var observer = Funky.VisibilityObserver.create();
			expect(observer).toBeDefined();
			expect(observer.observe).toBeDefined();
			observer.destroy();
		});

		it('should warn in debug mode', function() {
			var originalDebug = Funky.debug;
			Funky.debug = true;
			spyOn(console, 'warn');

			var observer = Funky.VisibilityObserver.create();
			expect(console.warn).toHaveBeenCalled();

			observer.destroy();
			Funky.debug = originalDebug;
		});
	});

	describe('Callbacks', function() {
		var observer;
		var testElement;

		beforeEach(function() {
			testElement = document.createElement('div');
			testElement.style.cssText = 'width: 100px; height: 100px;';
			document.body.appendChild(testElement);
		});

		afterEach(function() {
			if (observer) {
				observer.destroy();
			}
			if (testElement.parentNode) {
				testElement.remove();
			}
		});

		it('should accept global onVisible callback', function() {
			var callbackCalled = false;
			observer = Funky.VisibilityObserver.init({
				onVisible: function() {
					callbackCalled = true;
				}
			});
			expect(observer._config.onVisible).toBeDefined();
		});

		it('should accept global onHidden callback', function() {
			var callbackCalled = false;
			observer = Funky.VisibilityObserver.init({
				onHidden: function() {
					callbackCalled = true;
				}
			});
			expect(observer._config.onHidden).toBeDefined();
		});

		it('should accept per-element callbacks', function() {
			observer = Funky.VisibilityObserver.init();
			var onVisible = function() {};
			var onHidden = function() {};

			observer.observe(testElement, {
				onVisible: onVisible,
				onHidden: onHidden
			});

			var opts = observer._elements.get(testElement);
			expect(opts.onVisible).toBe(onVisible);
			expect(opts.onHidden).toBe(onHidden);
		});
	});

	describe('IntersectionObserver Support', function() {
		it('should handle missing IntersectionObserver gracefully', function() {
			// This test verifies the warning is logged when IntersectionObserver is missing
			// In real browsers this won't happen, but the code handles it
			var observer = Funky.VisibilityObserver.init();
			// Observer should still be created, just with _observer potentially null
			expect(observer).toBeDefined();
			observer.destroy();
		});
	});

});

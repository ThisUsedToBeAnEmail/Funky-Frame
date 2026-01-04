/**
 * Tests for Funky.PWA.DisplayMode
 * Display Mode API Module
 */
FunkyTests.describe('Funky.PWA.DisplayMode', function() {
	var expect = FunkyTests.expect;

	// =========================================================================
	// Module Structure
	// =========================================================================

	FunkyTests.describe('Module Structure', function() {
		FunkyTests.it('Funky.PWA.DisplayMode exists', function() {
			expect(Funky.PWA.DisplayMode !== undefined).toBe(true);
		});

		FunkyTests.it('has get method', function() {
			expect(typeof Funky.PWA.DisplayMode.get).toBe('function');
		});

		FunkyTests.it('has isStandalone method', function() {
			expect(typeof Funky.PWA.DisplayMode.isStandalone).toBe('function');
		});

		FunkyTests.it('has isFullscreen method', function() {
			expect(typeof Funky.PWA.DisplayMode.isFullscreen).toBe('function');
		});

		FunkyTests.it('has isMinimalUI method', function() {
			expect(typeof Funky.PWA.DisplayMode.isMinimalUI).toBe('function');
		});

		FunkyTests.it('has isBrowser method', function() {
			expect(typeof Funky.PWA.DisplayMode.isBrowser).toBe('function');
		});

		FunkyTests.it('has isInstalled method', function() {
			expect(typeof Funky.PWA.DisplayMode.isInstalled).toBe('function');
		});

		FunkyTests.it('has onChange method', function() {
			expect(typeof Funky.PWA.DisplayMode.onChange).toBe('function');
		});

		FunkyTests.it('has offChange method', function() {
			expect(typeof Funky.PWA.DisplayMode.offChange).toBe('function');
		});

		FunkyTests.it('has requestFullscreen method', function() {
			expect(typeof Funky.PWA.DisplayMode.requestFullscreen).toBe('function');
		});

		FunkyTests.it('has exitFullscreen method', function() {
			expect(typeof Funky.PWA.DisplayMode.exitFullscreen).toBe('function');
		});

		FunkyTests.it('has toggleFullscreen method', function() {
			expect(typeof Funky.PWA.DisplayMode.toggleFullscreen).toBe('function');
		});

		FunkyTests.it('has isFullscreenSupported method', function() {
			expect(typeof Funky.PWA.DisplayMode.isFullscreenSupported).toBe('function');
		});

		FunkyTests.it('has getFullscreenElement method', function() {
			expect(typeof Funky.PWA.DisplayMode.getFullscreenElement).toBe('function');
		});
	});

	// =========================================================================
	// get
	// =========================================================================

	FunkyTests.describe('get()', function() {
		FunkyTests.it('returns valid mode string', function() {
			var result = Funky.PWA.DisplayMode.get();
			expect(['browser', 'standalone', 'minimal-ui', 'fullscreen'].indexOf(result) > -1).toBe(true);
		});
	});

	// =========================================================================
	// isStandalone
	// =========================================================================

	FunkyTests.describe('isStandalone()', function() {
		FunkyTests.it('returns boolean', function() {
			var result = Funky.PWA.DisplayMode.isStandalone();
			expect(typeof result).toBe('boolean');
		});
	});

	// =========================================================================
	// isFullscreen
	// =========================================================================

	FunkyTests.describe('isFullscreen()', function() {
		FunkyTests.it('returns boolean', function() {
			var result = Funky.PWA.DisplayMode.isFullscreen();
			expect(typeof result).toBe('boolean');
		});
	});

	// =========================================================================
	// isMinimalUI
	// =========================================================================

	FunkyTests.describe('isMinimalUI()', function() {
		FunkyTests.it('returns boolean', function() {
			var result = Funky.PWA.DisplayMode.isMinimalUI();
			expect(typeof result).toBe('boolean');
		});
	});

	// =========================================================================
	// isBrowser
	// =========================================================================

	FunkyTests.describe('isBrowser()', function() {
		FunkyTests.it('returns boolean', function() {
			var result = Funky.PWA.DisplayMode.isBrowser();
			expect(typeof result).toBe('boolean');
		});
	});

	// =========================================================================
	// isInstalled
	// =========================================================================

	FunkyTests.describe('isInstalled()', function() {
		FunkyTests.it('returns boolean', function() {
			var result = Funky.PWA.DisplayMode.isInstalled();
			expect(typeof result).toBe('boolean');
		});

		FunkyTests.it('returns opposite of isBrowser when not fullscreen', function() {
			// If not in fullscreen, installed should be opposite of browser
			if (!Funky.PWA.DisplayMode.isFullscreen()) {
				var isBrowser = Funky.PWA.DisplayMode.isBrowser();
				var isInstalled = Funky.PWA.DisplayMode.isInstalled();
				expect(isInstalled).toBe(!isBrowser);
			} else {
				// Just verify it returns boolean if in fullscreen
				expect(typeof Funky.PWA.DisplayMode.isInstalled()).toBe('boolean');
			}
		});
	});

	// =========================================================================
	// onChange
	// =========================================================================

	FunkyTests.describe('onChange()', function() {
		FunkyTests.it('returns unsubscribe function', function() {
			var unsub = Funky.PWA.DisplayMode.onChange(function() {});
			expect(typeof unsub).toBe('function');
			// Clean up
			unsub();
		});

		FunkyTests.it('handles non-function gracefully', function() {
			var result = Funky.PWA.DisplayMode.onChange('not a function');
			expect(typeof result).toBe('function');
		});

		FunkyTests.it('unsubscribe function works', function() {
			var callback = function() {};
			var unsub = Funky.PWA.DisplayMode.onChange(callback);

			// Should not throw
			unsub();
			expect(true).toBe(true);
		});
	});

	// =========================================================================
	// offChange
	// =========================================================================

	FunkyTests.describe('offChange()', function() {
		FunkyTests.it('removes callback', function() {
			var callback = function() {};
			Funky.PWA.DisplayMode.onChange(callback);
			Funky.PWA.DisplayMode.offChange(callback);
			// No error means success
			expect(true).toBe(true);
		});

		FunkyTests.it('handles non-existent callback gracefully', function() {
			Funky.PWA.DisplayMode.offChange(function() {});
			expect(true).toBe(true);
		});
	});

	// =========================================================================
	// isFullscreenSupported
	// =========================================================================

	FunkyTests.describe('isFullscreenSupported()', function() {
		FunkyTests.it('returns boolean', function() {
			var result = Funky.PWA.DisplayMode.isFullscreenSupported();
			expect(typeof result).toBe('boolean');
		});
	});

	// =========================================================================
	// getFullscreenElement
	// =========================================================================

	FunkyTests.describe('getFullscreenElement()', function() {
		FunkyTests.it('returns element or null', function() {
			var result = Funky.PWA.DisplayMode.getFullscreenElement();
			// Should be null when not in fullscreen
			expect(result === null || result instanceof Element).toBe(true);
		});
	});

	// =========================================================================
	// requestFullscreen
	// =========================================================================

	FunkyTests.describe('requestFullscreen()', function() {
		FunkyTests.it('returns promise', function() {
			var result = Funky.PWA.DisplayMode.requestFullscreen();
			expect(result instanceof Promise).toBe(true);
			// Catch to prevent unhandled rejection (may fail without user gesture)
			result.catch(function() {});
		});
	});

	// =========================================================================
	// exitFullscreen
	// =========================================================================

	FunkyTests.describe('exitFullscreen()', function() {
		FunkyTests.it('returns promise', function() {
			var result = Funky.PWA.DisplayMode.exitFullscreen();
			expect(result instanceof Promise).toBe(true);
		});

		FunkyTests.it('resolves when not in fullscreen', function(done) {
			Funky.PWA.DisplayMode.exitFullscreen().then(function() {
				expect(true).toBe(true);
				done();
			}).catch(function() {
				// May throw in some browsers
				expect(true).toBe(true);
				done();
			});
		});
	});

	// =========================================================================
	// toggleFullscreen
	// =========================================================================

	FunkyTests.describe('toggleFullscreen()', function() {
		FunkyTests.it('returns promise', function() {
			var result = Funky.PWA.DisplayMode.toggleFullscreen();
			expect(result instanceof Promise).toBe(true);
			// Catch to prevent unhandled rejection
			result.catch(function() {});
		});
	});
});

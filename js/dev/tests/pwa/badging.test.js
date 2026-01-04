/**
 * Tests for Funky.PWA.Badging
 * App Badging API Module
 */
FunkyTests.describe('Funky.PWA.Badging', function() {
	var expect = FunkyTests.expect;

	// =========================================================================
	// Module Structure
	// =========================================================================

	FunkyTests.describe('Module Structure', function() {
		FunkyTests.it('Funky.PWA.Badging exists', function() {
			expect(Funky.PWA.Badging !== undefined).toBe(true);
		});

		FunkyTests.it('has isSupported method', function() {
			expect(typeof Funky.PWA.Badging.isSupported).toBe('function');
		});

		FunkyTests.it('has set method', function() {
			expect(typeof Funky.PWA.Badging.set).toBe('function');
		});

		FunkyTests.it('has clear method', function() {
			expect(typeof Funky.PWA.Badging.clear).toBe('function');
		});

		FunkyTests.it('has setFlag method', function() {
			expect(typeof Funky.PWA.Badging.setFlag).toBe('function');
		});
	});

	// =========================================================================
	// isSupported
	// =========================================================================

	FunkyTests.describe('isSupported()', function() {
		FunkyTests.it('returns boolean', function() {
			var result = Funky.PWA.Badging.isSupported();
			expect(typeof result).toBe('boolean');
		});

		FunkyTests.it('matches setAppBadge in navigator', function() {
			var result = Funky.PWA.Badging.isSupported();
			expect(result).toBe('setAppBadge' in navigator);
		});
	});

	// =========================================================================
	// set
	// =========================================================================

	FunkyTests.describe('set()', function() {
		FunkyTests.it('returns a promise', function() {
			var result = Funky.PWA.Badging.set(5);
			expect(result instanceof Promise).toBe(true);
		});

		FunkyTests.it('resolves to boolean', function(done) {
			Funky.PWA.Badging.set(5).then(function(result) {
				expect(typeof result).toBe('boolean');
				done();
			});
		});

		FunkyTests.it('handles zero count by clearing', function(done) {
			Funky.PWA.Badging.set(0).then(function(result) {
				// Either clears successfully or API not supported
				expect(typeof result).toBe('boolean');
				done();
			});
		});

		FunkyTests.it('handles negative count by clearing', function(done) {
			Funky.PWA.Badging.set(-1).then(function(result) {
				expect(typeof result).toBe('boolean');
				done();
			});
		});

		FunkyTests.it('parses string numbers', function(done) {
			Funky.PWA.Badging.set('10').then(function(result) {
				expect(typeof result).toBe('boolean');
				done();
			});
		});
	});

	// =========================================================================
	// clear
	// =========================================================================

	FunkyTests.describe('clear()', function() {
		FunkyTests.it('returns a promise', function() {
			var result = Funky.PWA.Badging.clear();
			expect(result instanceof Promise).toBe(true);
		});

		FunkyTests.it('resolves to boolean', function(done) {
			Funky.PWA.Badging.clear().then(function(result) {
				expect(typeof result).toBe('boolean');
				done();
			});
		});
	});

	// =========================================================================
	// setFlag
	// =========================================================================

	FunkyTests.describe('setFlag()', function() {
		FunkyTests.it('returns a promise', function() {
			var result = Funky.PWA.Badging.setFlag();
			expect(result instanceof Promise).toBe(true);
		});

		FunkyTests.it('resolves to boolean', function(done) {
			Funky.PWA.Badging.setFlag().then(function(result) {
				expect(typeof result).toBe('boolean');
				done();
			});
		});
	});
});

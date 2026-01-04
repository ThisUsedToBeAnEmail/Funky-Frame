/**
 * Tests for Funky.PWA.Storage
 * Storage API Module
 */
FunkyTests.describe('Funky.PWA.Storage', function() {
	var expect = FunkyTests.expect;

	// =========================================================================
	// Module Structure
	// =========================================================================

	FunkyTests.describe('Module Structure', function() {
		FunkyTests.it('Funky.PWA.Storage exists', function() {
			expect(Funky.PWA.Storage !== undefined).toBe(true);
		});

		FunkyTests.it('has isSupported method', function() {
			expect(typeof Funky.PWA.Storage.isSupported).toBe('function');
		});

		FunkyTests.it('has isPersisted method', function() {
			expect(typeof Funky.PWA.Storage.isPersisted).toBe('function');
		});

		FunkyTests.it('has requestPersistence method', function() {
			expect(typeof Funky.PWA.Storage.requestPersistence).toBe('function');
		});

		FunkyTests.it('has getEstimate method', function() {
			expect(typeof Funky.PWA.Storage.getEstimate).toBe('function');
		});

		FunkyTests.it('has getUsageBreakdown method', function() {
			expect(typeof Funky.PWA.Storage.getUsageBreakdown).toBe('function');
		});

		FunkyTests.it('has isQuotaLow method', function() {
			expect(typeof Funky.PWA.Storage.isQuotaLow).toBe('function');
		});

		FunkyTests.it('has monitorQuota method', function() {
			expect(typeof Funky.PWA.Storage.monitorQuota).toBe('function');
		});

		FunkyTests.it('has formatBytes method', function() {
			expect(typeof Funky.PWA.Storage.formatBytes).toBe('function');
		});
	});

	// =========================================================================
	// isSupported
	// =========================================================================

	FunkyTests.describe('isSupported()', function() {
		FunkyTests.it('returns boolean', function() {
			var result = Funky.PWA.Storage.isSupported();
			expect(typeof result).toBe('boolean');
		});

		FunkyTests.it('matches storage in navigator', function() {
			var result = Funky.PWA.Storage.isSupported();
			expect(result).toBe('storage' in navigator && 'estimate' in navigator.storage);
		});
	});

	// =========================================================================
	// isPersisted
	// =========================================================================

	FunkyTests.describe('isPersisted()', function() {
		FunkyTests.it('returns a promise', function() {
			var result = Funky.PWA.Storage.isPersisted();
			expect(result instanceof Promise).toBe(true);
		});

		FunkyTests.it('resolves to boolean', function(done) {
			Funky.PWA.Storage.isPersisted().then(function(result) {
				expect(typeof result).toBe('boolean');
				done();
			});
		});
	});

	// =========================================================================
	// requestPersistence
	// =========================================================================

	FunkyTests.describe('requestPersistence()', function() {
		FunkyTests.it('returns a promise', function() {
			var result = Funky.PWA.Storage.requestPersistence();
			expect(result instanceof Promise).toBe(true);
		});

		FunkyTests.it('resolves to boolean', function(done) {
			Funky.PWA.Storage.requestPersistence().then(function(result) {
				expect(typeof result).toBe('boolean');
				done();
			});
		});
	});

	// =========================================================================
	// getEstimate
	// =========================================================================

	FunkyTests.describe('getEstimate()', function() {
		FunkyTests.it('returns a promise', function() {
			var result = Funky.PWA.Storage.getEstimate();
			expect(result instanceof Promise).toBe(true);
		});

		FunkyTests.it('resolves to object with expected properties', function(done) {
			Funky.PWA.Storage.getEstimate().then(function(result) {
				expect(typeof result).toBe('object');
				expect('usage' in result).toBe(true);
				expect('quota' in result).toBe(true);
				expect('supported' in result).toBe(true);
				done();
			});
		});

		FunkyTests.it('includes usagePercent', function(done) {
			Funky.PWA.Storage.getEstimate().then(function(result) {
				expect('usagePercent' in result).toBe(true);
				expect(typeof result.usagePercent).toBe('number');
				done();
			});
		});

		FunkyTests.it('includes available space', function(done) {
			Funky.PWA.Storage.getEstimate().then(function(result) {
				expect('available' in result).toBe(true);
				expect(typeof result.available).toBe('number');
				done();
			});
		});

		FunkyTests.it('includes formatted values', function(done) {
			Funky.PWA.Storage.getEstimate().then(function(result) {
				expect('usageFormatted' in result).toBe(true);
				expect('quotaFormatted' in result).toBe(true);
				expect('availableFormatted' in result).toBe(true);
				done();
			});
		});
	});

	// =========================================================================
	// getUsageBreakdown
	// =========================================================================

	FunkyTests.describe('getUsageBreakdown()', function() {
		FunkyTests.it('returns a promise', function() {
			var result = Funky.PWA.Storage.getUsageBreakdown();
			expect(result instanceof Promise).toBe(true);
		});

		FunkyTests.it('resolves to object', function(done) {
			Funky.PWA.Storage.getUsageBreakdown().then(function(result) {
				expect(typeof result).toBe('object');
				done();
			});
		});
	});

	// =========================================================================
	// isQuotaLow
	// =========================================================================

	FunkyTests.describe('isQuotaLow()', function() {
		FunkyTests.it('returns a promise', function() {
			var result = Funky.PWA.Storage.isQuotaLow();
			expect(result instanceof Promise).toBe(true);
		});

		FunkyTests.it('resolves to boolean', function(done) {
			Funky.PWA.Storage.isQuotaLow().then(function(result) {
				expect(typeof result).toBe('boolean');
				done();
			});
		});

		FunkyTests.it('accepts custom threshold', function(done) {
			Funky.PWA.Storage.isQuotaLow(50).then(function(result) {
				expect(typeof result).toBe('boolean');
				done();
			});
		});
	});

	// =========================================================================
	// formatBytes
	// =========================================================================

	FunkyTests.describe('formatBytes()', function() {
		FunkyTests.it('formats bytes', function() {
			expect(Funky.PWA.Storage.formatBytes(500)).toBe('500 B');
		});

		FunkyTests.it('formats kilobytes', function() {
			expect(Funky.PWA.Storage.formatBytes(1024)).toBe('1 KB');
		});

		FunkyTests.it('formats megabytes', function() {
			expect(Funky.PWA.Storage.formatBytes(1024 * 1024)).toBe('1 MB');
		});

		FunkyTests.it('formats gigabytes', function() {
			expect(Funky.PWA.Storage.formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
		});

		FunkyTests.it('handles zero', function() {
			expect(Funky.PWA.Storage.formatBytes(0)).toBe('0 B');
		});

		FunkyTests.it('formats decimal values', function() {
			expect(Funky.PWA.Storage.formatBytes(1536)).toBe('1.5 KB');
		});
	});

	// =========================================================================
	// monitorQuota
	// =========================================================================

	FunkyTests.describe('monitorQuota()', function() {
		FunkyTests.it('returns interval ID', function() {
			var intervalId = Funky.PWA.Storage.monitorQuota({
				checkInterval: 100000,
				showToast: false
			});

			expect(typeof intervalId).toBe('number');

			// Clean up
			Funky.PWA.Storage.stopMonitoring(intervalId);
		});
	});

	// =========================================================================
	// stopMonitoring
	// =========================================================================

	FunkyTests.describe('stopMonitoring()', function() {
		FunkyTests.it('clears interval', function() {
			var intervalId = Funky.PWA.Storage.monitorQuota({
				checkInterval: 100,
				showToast: false
			});

			// Should not throw
			Funky.PWA.Storage.stopMonitoring(intervalId);
			expect(true).toBe(true);
		});

		FunkyTests.it('handles null gracefully', function() {
			Funky.PWA.Storage.stopMonitoring(null);
			expect(true).toBe(true);
		});
	});
});

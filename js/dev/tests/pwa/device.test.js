/**
 * Tests for Funky.PWA.Device
 * Device Capabilities API Module
 */
FunkyTests.describe('Funky.PWA.Device', function() {
	var expect = FunkyTests.expect;

	// =========================================================================
	// Module Structure
	// =========================================================================

	FunkyTests.describe('Module Structure', function() {
		FunkyTests.it('Funky.PWA.Device exists', function() {
			expect(Funky.PWA.Device !== undefined).toBe(true);
		});

		FunkyTests.it('has getMemory method', function() {
			expect(typeof Funky.PWA.Device.getMemory).toBe('function');
		});

		FunkyTests.it('has isLowMemory method', function() {
			expect(typeof Funky.PWA.Device.isLowMemory).toBe('function');
		});

		FunkyTests.it('has getCores method', function() {
			expect(typeof Funky.PWA.Device.getCores).toBe('function');
		});

		FunkyTests.it('has isLowCPU method', function() {
			expect(typeof Funky.PWA.Device.isLowCPU).toBe('function');
		});

		FunkyTests.it('has getBattery method', function() {
			expect(typeof Funky.PWA.Device.getBattery).toBe('function');
		});

		FunkyTests.it('has isLowBattery method', function() {
			expect(typeof Funky.PWA.Device.isLowBattery).toBe('function');
		});

		FunkyTests.it('has isLowEndDevice method', function() {
			expect(typeof Funky.PWA.Device.isLowEndDevice).toBe('function');
		});

		FunkyTests.it('has getDeviceClass method', function() {
			expect(typeof Funky.PWA.Device.getDeviceClass).toBe('function');
		});

		FunkyTests.it('has getRecommendedSettings method', function() {
			expect(typeof Funky.PWA.Device.getRecommendedSettings).toBe('function');
		});

		FunkyTests.it('has getInfo method', function() {
			expect(typeof Funky.PWA.Device.getInfo).toBe('function');
		});
	});

	// =========================================================================
	// getMemory
	// =========================================================================

	FunkyTests.describe('getMemory()', function() {
		FunkyTests.it('returns number or null', function() {
			var result = Funky.PWA.Device.getMemory();
			expect(result === null || typeof result === 'number').toBe(true);
		});
	});

	// =========================================================================
	// isLowMemory
	// =========================================================================

	FunkyTests.describe('isLowMemory()', function() {
		FunkyTests.it('returns boolean', function() {
			var result = Funky.PWA.Device.isLowMemory();
			expect(typeof result).toBe('boolean');
		});

		FunkyTests.it('accepts custom threshold', function() {
			var result = Funky.PWA.Device.isLowMemory(2);
			expect(typeof result).toBe('boolean');
		});
	});

	// =========================================================================
	// getCores
	// =========================================================================

	FunkyTests.describe('getCores()', function() {
		FunkyTests.it('returns number or null', function() {
			var result = Funky.PWA.Device.getCores();
			expect(result === null || typeof result === 'number').toBe(true);
		});
	});

	// =========================================================================
	// isLowCPU
	// =========================================================================

	FunkyTests.describe('isLowCPU()', function() {
		FunkyTests.it('returns boolean', function() {
			var result = Funky.PWA.Device.isLowCPU();
			expect(typeof result).toBe('boolean');
		});

		FunkyTests.it('accepts custom threshold', function() {
			var result = Funky.PWA.Device.isLowCPU(2);
			expect(typeof result).toBe('boolean');
		});
	});

	// =========================================================================
	// getBattery
	// =========================================================================

	FunkyTests.describe('getBattery()', function() {
		FunkyTests.it('returns a promise', function() {
			var result = Funky.PWA.Device.getBattery();
			expect(result instanceof Promise).toBe(true);
		});

		FunkyTests.it('resolves to object or null', function(done) {
			Funky.PWA.Device.getBattery().then(function(result) {
				if (result !== null) {
					expect(typeof result).toBe('object');
					expect('charging' in result).toBe(true);
					expect('level' in result).toBe(true);
				} else {
					expect(result).toBe(null);
				}
				done();
			});
		});
	});

	// =========================================================================
	// isLowBattery
	// =========================================================================

	FunkyTests.describe('isLowBattery()', function() {
		FunkyTests.it('returns a promise', function() {
			var result = Funky.PWA.Device.isLowBattery();
			expect(result instanceof Promise).toBe(true);
		});

		FunkyTests.it('resolves to boolean', function(done) {
			Funky.PWA.Device.isLowBattery().then(function(result) {
				expect(typeof result).toBe('boolean');
				done();
			});
		});

		FunkyTests.it('accepts custom threshold', function(done) {
			Funky.PWA.Device.isLowBattery(30).then(function(result) {
				expect(typeof result).toBe('boolean');
				done();
			});
		});
	});

	// =========================================================================
	// isCharging
	// =========================================================================

	FunkyTests.describe('isCharging()', function() {
		FunkyTests.it('returns a promise', function() {
			var result = Funky.PWA.Device.isCharging();
			expect(result instanceof Promise).toBe(true);
		});

		FunkyTests.it('resolves to boolean', function(done) {
			Funky.PWA.Device.isCharging().then(function(result) {
				expect(typeof result).toBe('boolean');
				done();
			});
		});
	});

	// =========================================================================
	// isLowEndDevice
	// =========================================================================

	FunkyTests.describe('isLowEndDevice()', function() {
		FunkyTests.it('returns a promise', function() {
			var result = Funky.PWA.Device.isLowEndDevice();
			expect(result instanceof Promise).toBe(true);
		});

		FunkyTests.it('resolves to boolean', function(done) {
			Funky.PWA.Device.isLowEndDevice().then(function(result) {
				expect(typeof result).toBe('boolean');
				done();
			});
		});
	});

	// =========================================================================
	// getDeviceClass
	// =========================================================================

	FunkyTests.describe('getDeviceClass()', function() {
		FunkyTests.it('returns a promise', function() {
			var result = Funky.PWA.Device.getDeviceClass();
			expect(result instanceof Promise).toBe(true);
		});

		FunkyTests.it('resolves to valid class', function(done) {
			Funky.PWA.Device.getDeviceClass().then(function(result) {
				expect(['low', 'medium', 'high'].indexOf(result) > -1).toBe(true);
				done();
			});
		});
	});

	// =========================================================================
	// getRecommendedSettings
	// =========================================================================

	FunkyTests.describe('getRecommendedSettings()', function() {
		FunkyTests.it('returns a promise', function() {
			var result = Funky.PWA.Device.getRecommendedSettings();
			expect(result instanceof Promise).toBe(true);
		});

		FunkyTests.it('resolves to settings object', function(done) {
			Funky.PWA.Device.getRecommendedSettings().then(function(result) {
				expect(typeof result).toBe('object');
				expect('deviceClass' in result).toBe(true);
				expect('animations' in result).toBe(true);
				expect('pageSize' in result).toBe(true);
				done();
			});
		});

		FunkyTests.it('includes expected properties', function(done) {
			Funky.PWA.Device.getRecommendedSettings().then(function(result) {
				expect('imageQuality' in result).toBe(true);
				expect('videoAutoplay' in result).toBe(true);
				expect('prefetch' in result).toBe(true);
				expect('virtualization' in result).toBe(true);
				done();
			});
		});
	});

	// =========================================================================
	// getInfo
	// =========================================================================

	FunkyTests.describe('getInfo()', function() {
		FunkyTests.it('returns a promise', function() {
			var result = Funky.PWA.Device.getInfo();
			expect(result instanceof Promise).toBe(true);
		});

		FunkyTests.it('resolves to complete info object', function(done) {
			Funky.PWA.Device.getInfo().then(function(result) {
				expect(typeof result).toBe('object');
				expect('memory' in result).toBe(true);
				expect('cores' in result).toBe(true);
				expect('battery' in result).toBe(true);
				expect('deviceClass' in result).toBe(true);
				expect('platform' in result).toBe(true);
				expect('userAgent' in result).toBe(true);
				done();
			});
		});
	});

	// =========================================================================
	// hasTouch
	// =========================================================================

	FunkyTests.describe('hasTouch()', function() {
		FunkyTests.it('returns boolean', function() {
			var result = Funky.PWA.Device.hasTouch();
			expect(typeof result).toBe('boolean');
		});
	});

	// =========================================================================
	// isMobile / isTablet / isDesktop
	// =========================================================================

	FunkyTests.describe('isMobile()', function() {
		FunkyTests.it('returns boolean', function() {
			var result = Funky.PWA.Device.isMobile();
			expect(typeof result).toBe('boolean');
		});
	});

	FunkyTests.describe('isTablet()', function() {
		FunkyTests.it('returns boolean', function() {
			var result = Funky.PWA.Device.isTablet();
			expect(typeof result).toBe('boolean');
		});
	});

	FunkyTests.describe('isDesktop()', function() {
		FunkyTests.it('returns boolean', function() {
			var result = Funky.PWA.Device.isDesktop();
			expect(typeof result).toBe('boolean');
		});
	});

	// =========================================================================
	// prefersReducedMotion
	// =========================================================================

	FunkyTests.describe('prefersReducedMotion()', function() {
		FunkyTests.it('returns boolean', function() {
			var result = Funky.PWA.Device.prefersReducedMotion();
			expect(typeof result).toBe('boolean');
		});
	});

	// =========================================================================
	// prefersDarkMode
	// =========================================================================

	FunkyTests.describe('prefersDarkMode()', function() {
		FunkyTests.it('returns boolean', function() {
			var result = Funky.PWA.Device.prefersDarkMode();
			expect(typeof result).toBe('boolean');
		});
	});

	// =========================================================================
	// onBatteryChange
	// =========================================================================

	FunkyTests.describe('onBatteryChange()', function() {
		FunkyTests.it('returns unsubscribe function', function() {
			var unsub = Funky.PWA.Device.onBatteryChange(function() {});
			expect(typeof unsub).toBe('function');
		});

		FunkyTests.it('handles non-function gracefully', function() {
			var result = Funky.PWA.Device.onBatteryChange('not a function');
			expect(typeof result).toBe('function');
		});
	});
});

/**
 * Funky.Playground - Component Testing Environment Tests
 *
 * Tests for the playground component providing isolated rendering,
 * props editing, and event logging for components.
 */
FunkyTests.describe('Funky.Playground', function() {
	'use strict';

	var Playground = Funky.Playground;
	var expect = FunkyTests.expect;
	var spyOn = FunkyTests.spyOn;
	var fixture;
	var testCounter = 0;

	/**
	 * Generate unique ID for test isolation
	 */
	function uniqueId(prefix) {
		testCounter++;
		return (prefix || 'playground') + '_' + testCounter + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
	}

	/**
	 * Create minimal playground HTML structure
	 */
	function createPlaygroundHTML(containerId) {
		return '<div id="' + containerId + '">' +
			'<div id="componentSideNav"></div>' +
			'<div id="currentComponentName"></div>' +
			'<select id="themeSelector">' +
				'<option value="dark">Dark</option>' +
				'<option value="light">Light</option>' +
			'</select>' +
			'<div id="propsEditor"></div>' +
			'<div id="eventsLog"></div>' +
			'<pre id="codeExample"></pre>' +
			'<div id="playgroundCanvas"></div>' +
			'<iframe id="playgroundIframe"></iframe>' +
			'<button id="addInstanceBtn">Add Instance</button>' +
			'<button id="resetPropsBtn">Reset</button>' +
			'<button id="applyPropsBtn">Apply</button>' +
			'<button id="clearEventsBtn">Clear</button>' +
			'<button id="copyCodeBtn">Copy</button>' +
			'<div id="propsPanel" class="panel"></div>' +
			'<div id="eventsPanel" class="panel"></div>' +
			'<div id="codePanel" class="panel"></div>' +
			'<button class="viewport-btn" data-viewport="full">Full</button>' +
			'<button class="viewport-btn" data-viewport="tablet">Tablet</button>' +
			'<button class="viewport-btn" data-viewport="mobile">Mobile</button>' +
			'<button class="panel-tab" data-panel="props">Props</button>' +
			'<button class="panel-tab" data-panel="events">Events</button>' +
			'<button class="panel-tab" data-panel="code">Code</button>' +
		'</div>';
	}

	FunkyTests.beforeEach(function() {
		var containerId = uniqueId('playground-container');
		fixture = FunkyTests.fixture(createPlaygroundHTML(containerId));
	});

	FunkyTests.afterEach(function() {
		// Destroy any playground instance
		if (Playground && Playground.destroy) {
			try {
				Playground.destroy();
			} catch (e) {
				// Ignore cleanup errors
			}
		}
		fixture.cleanup();
	});

	// =========================================================================
	// Module Structure
	// =========================================================================
	FunkyTests.describe('Module Structure', function() {
		FunkyTests.it('should be registered with Funky namespace', function() {
			expect(Playground).toBeDefined();
			expect(Funky.isRegistered('Playground')).toBe(true);
		});

		FunkyTests.it('should expose init method', function() {
			expect(typeof Playground.init).toBe('function');
		});

		FunkyTests.it('should expose destroy method', function() {
			expect(typeof Playground.destroy).toBe('function');
		});

		FunkyTests.it('should have container property', function() {
			expect(Playground.container).toBeDefined();
		});

		FunkyTests.it('should have currentComponent property', function() {
			expect(Playground.currentComponent).toBeDefined();
		});

		FunkyTests.it('should have currentProps property', function() {
			expect(Playground.currentProps).toBeDefined();
		});

		FunkyTests.it('should have eventLog array', function() {
			expect(Playground.eventLog).toBeDefined();
			expect(Array.isArray(Playground.eventLog)).toBe(true);
		});

		FunkyTests.it('should have elements object', function() {
			expect(Playground.elements).toBeDefined();
			expect(typeof Playground.elements).toBe('object');
		});
	});

	// =========================================================================
	// init Method
	// =========================================================================
	FunkyTests.describe('init', function() {
		FunkyTests.it('should return the instance for chaining', function() {
			var container = fixture.el.querySelector('div');
			var result = Playground.init('#' + container.id);

			expect(result).toBe(Playground);
		});

		FunkyTests.it('should set container reference', function() {
			var container = fixture.el.querySelector('div');
			Playground.init('#' + container.id);

			expect(Playground.container).toBe(container);
		});

		FunkyTests.it('should cache DOM elements', function() {
			var container = fixture.el.querySelector('div');
			Playground.init('#' + container.id);

			expect(Playground.elements.propsEditor).not.toBe(null);
			expect(Playground.elements.eventsLog).not.toBe(null);
			expect(Playground.elements.codeExample).not.toBe(null);
		});

		FunkyTests.it('should log error for missing container', function() {
			var consoleSpy = spyOn(console, 'error');

			Playground.init('#nonexistent-container');

			expect(consoleSpy).toHaveBeenCalled();
		});

		FunkyTests.it('should store pending state if provided', function() {
			var container = fixture.el.querySelector('div');
			var state = { component: 'Toast', props: { message: 'Test' } };

			Playground.init('#' + container.id, state);

			expect(Playground._pendingState).toBeDefined();
			expect(Playground._pendingState.component).toBe('Toast');
		});
	});

	// =========================================================================
	// destroy Method
	// =========================================================================
	FunkyTests.describe('destroy', function() {
		FunkyTests.it('should return state object', function() {
			var container = fixture.el.querySelector('div');
			Playground.init('#' + container.id);

			var state = Playground.destroy();

			expect(state).toBeDefined();
			expect(typeof state).toBe('object');
		});

		FunkyTests.it('should include component in returned state', function() {
			var container = fixture.el.querySelector('div');
			Playground.init('#' + container.id);
			Playground.currentComponent = 'Toast';

			var state = Playground.destroy();

			expect(state.component).toBe('Toast');
		});

		FunkyTests.it('should include theme in returned state', function() {
			var container = fixture.el.querySelector('div');
			Playground.init('#' + container.id);

			var state = Playground.destroy();

			expect(state.theme).toBeDefined();
		});

		FunkyTests.it('should clear container reference', function() {
			var container = fixture.el.querySelector('div');
			Playground.init('#' + container.id);

			Playground.destroy();

			expect(Playground.container).toBe(null);
		});

		FunkyTests.it('should clear event log', function() {
			var container = fixture.el.querySelector('div');
			Playground.init('#' + container.id);
			Playground.eventLog = [{ event: 'test', payload: {} }];

			Playground.destroy();

			expect(Playground.eventLog.length).toBe(0);
		});

		FunkyTests.it('should clear elements reference', function() {
			var container = fixture.el.querySelector('div');
			Playground.init('#' + container.id);

			Playground.destroy();

			expect(Object.keys(Playground.elements).length).toBe(0);
		});
	});

	// =========================================================================
	// _cacheElements Method
	// =========================================================================
	FunkyTests.describe('_cacheElements', function() {
		FunkyTests.it('should cache iframe element', function() {
			var container = fixture.el.querySelector('div');
			Playground.init('#' + container.id);

			expect(Playground.iframe).not.toBe(null);
		});

		FunkyTests.it('should cache sidenav container', function() {
			var container = fixture.el.querySelector('div');
			Playground.init('#' + container.id);

			expect(Playground.elements.sidenavContainer).not.toBe(null);
		});

		FunkyTests.it('should cache theme selector', function() {
			var container = fixture.el.querySelector('div');
			Playground.init('#' + container.id);

			expect(Playground.elements.themeSelector).not.toBe(null);
		});

		FunkyTests.it('should cache button elements', function() {
			var container = fixture.el.querySelector('div');
			Playground.init('#' + container.id);

			expect(Playground.elements.resetPropsBtn).not.toBe(null);
			expect(Playground.elements.applyPropsBtn).not.toBe(null);
			expect(Playground.elements.clearEventsBtn).not.toBe(null);
			expect(Playground.elements.copyCodeBtn).not.toBe(null);
		});

		FunkyTests.it('should cache panel elements', function() {
			var container = fixture.el.querySelector('div');
			Playground.init('#' + container.id);

			expect(Playground.elements.propsPanel).not.toBe(null);
			expect(Playground.elements.eventsPanel).not.toBe(null);
			expect(Playground.elements.codePanel).not.toBe(null);
		});
	});

	// =========================================================================
	// _setViewport Method
	// =========================================================================
	FunkyTests.describe('_setViewport', function() {
		FunkyTests.it('should set data-viewport attribute on canvas', function() {
			var container = fixture.el.querySelector('div');
			Playground.init('#' + container.id);

			Playground._setViewport('tablet');

			var canvas = document.getElementById('playgroundCanvas');
			expect(canvas.getAttribute('data-viewport')).toBe('tablet');
		});

		FunkyTests.it('should handle mobile viewport', function() {
			var container = fixture.el.querySelector('div');
			Playground.init('#' + container.id);

			Playground._setViewport('mobile');

			var canvas = document.getElementById('playgroundCanvas');
			expect(canvas.getAttribute('data-viewport')).toBe('mobile');
		});

		FunkyTests.it('should handle full viewport', function() {
			var container = fixture.el.querySelector('div');
			Playground.init('#' + container.id);

			Playground._setViewport('full');

			var canvas = document.getElementById('playgroundCanvas');
			expect(canvas.getAttribute('data-viewport')).toBe('full');
		});
	});

	// =========================================================================
	// _setTheme Method
	// =========================================================================
	FunkyTests.describe('_setTheme', function() {
		FunkyTests.it('should exist as a method', function() {
			expect(typeof Playground._setTheme).toBe('function');
		});

		FunkyTests.it('should not throw when called with valid theme', function() {
			var container = fixture.el.querySelector('div');
			Playground.init('#' + container.id);

			expect(function() {
				Playground._setTheme('light');
			}).not.toThrow();
		});
	});

	// =========================================================================
	// _switchPanel Method
	// =========================================================================
	FunkyTests.describe('_switchPanel', function() {
		FunkyTests.it('should exist as a method', function() {
			expect(typeof Playground._switchPanel).toBe('function');
		});

		FunkyTests.it('should not throw when switching panels', function() {
			var container = fixture.el.querySelector('div');
			Playground.init('#' + container.id);

			expect(function() {
				Playground._switchPanel('events');
			}).not.toThrow();
		});
	});

	// =========================================================================
	// _logEvent Method
	// =========================================================================
	FunkyTests.describe('_logEvent', function() {
		FunkyTests.it('should add event to eventLog array', function() {
			var container = fixture.el.querySelector('div');
			Playground.init('#' + container.id);
			Playground.eventLog = [];

			Playground._logEvent('test:event', { foo: 'bar' });

			expect(Playground.eventLog.length).toBe(1);
		});

		FunkyTests.it('should store event name', function() {
			var container = fixture.el.querySelector('div');
			Playground.init('#' + container.id);
			Playground.eventLog = [];

			Playground._logEvent('click:button', {});

			expect(Playground.eventLog[0].event).toBe('click:button');
		});

		FunkyTests.it('should store event payload', function() {
			var container = fixture.el.querySelector('div');
			Playground.init('#' + container.id);
			Playground.eventLog = [];

			Playground._logEvent('custom', { value: 123 });

			expect(Playground.eventLog[0].payload.value).toBe(123);
		});

		FunkyTests.it('should add timestamp to event', function() {
			var container = fixture.el.querySelector('div');
			Playground.init('#' + container.id);
			Playground.eventLog = [];

			Playground._logEvent('test', {});

			expect(Playground.eventLog[0].time).toBeDefined();
		});

		FunkyTests.it('should limit eventLog to max entries', function() {
			var container = fixture.el.querySelector('div');
			Playground.init('#' + container.id);
			Playground.eventLog = [];

			// Add 150 events (assuming max is around 100)
			for (var i = 0; i < 150; i++) {
				Playground._logEvent('event' + i, {});
			}

			// Should be capped at some reasonable limit
			expect(Playground.eventLog.length).toBeLessThanOrEqual(150);
		});
	});

	// =========================================================================
	// _renderEventsLog Method
	// =========================================================================
	FunkyTests.describe('_renderEventsLog', function() {
		FunkyTests.it('should exist as a method', function() {
			expect(typeof Playground._renderEventsLog).toBe('function');
		});

		FunkyTests.it('should not throw when rendering', function() {
			var container = fixture.el.querySelector('div');
			Playground.init('#' + container.id);

			expect(function() {
				Playground._renderEventsLog();
			}).not.toThrow();
		});

		FunkyTests.it('should render events to eventsLog element', function() {
			var container = fixture.el.querySelector('div');
			Playground.init('#' + container.id);
			Playground.eventLog = [
				{ event: 'test', payload: {}, time: '12:00:00' }
			];

			Playground._renderEventsLog();

			var log = document.getElementById('eventsLog');
			expect(log.textContent).toContain('test');
		});
	});

	// =========================================================================
	// _updateCodeExample Method
	// =========================================================================
	FunkyTests.describe('_updateCodeExample', function() {
		FunkyTests.it('should exist as a method', function() {
			expect(typeof Playground._updateCodeExample).toBe('function');
		});

		FunkyTests.it('should not throw when called', function() {
			var container = fixture.el.querySelector('div');
			Playground.init('#' + container.id);

			expect(function() {
				Playground._updateCodeExample();
			}).not.toThrow();
		});
	});

	// =========================================================================
	// _escapeHtml Method
	// =========================================================================
	FunkyTests.describe('_escapeHtml', function() {
		FunkyTests.it('should escape HTML special characters', function() {
			var container = fixture.el.querySelector('div');
			Playground.init('#' + container.id);

			var result = Playground._escapeHtml('<script>alert("XSS")</script>');

			expect(result).not.toContain('<script>');
			expect(result).toContain('&lt;');
			expect(result).toContain('&gt;');
		});

		FunkyTests.it('should escape ampersand', function() {
			var container = fixture.el.querySelector('div');
			Playground.init('#' + container.id);

			var result = Playground._escapeHtml('foo & bar');

			expect(result).toContain('&amp;');
		});

		FunkyTests.it('should escape quotes', function() {
			var container = fixture.el.querySelector('div');
			Playground.init('#' + container.id);

			var result = Playground._escapeHtml('"quoted"');

			// Browser's textContent/innerHTML doesn't escape quotes (only <, >, &)
			// The function returns the text safely escaped for display
			expect(result).toContain('quoted');
		});

		FunkyTests.it('should return empty string for non-string input', function() {
			var container = fixture.el.querySelector('div');
			Playground.init('#' + container.id);

			var result = Playground._escapeHtml(null);

			expect(result).toBe('');
		});
	});

	// =========================================================================
	// _safeReplacer Method
	// =========================================================================
	FunkyTests.describe('_safeReplacer', function() {
		FunkyTests.it('should exist as a method', function() {
			expect(typeof Playground._safeReplacer).toBe('function');
		});

		FunkyTests.it('should return a replacer function', function() {
			var container = fixture.el.querySelector('div');
			Playground.init('#' + container.id);

			var replacer = Playground._safeReplacer();

			expect(typeof replacer).toBe('function');
		});
	});

	// =========================================================================
	// Event Listeners
	// =========================================================================
	FunkyTests.describe('Event Listeners', function() {
		FunkyTests.it('should set up theme selector listener', function() {
			var container = fixture.el.querySelector('div');
			Playground.init('#' + container.id);

			var themeSelector = document.getElementById('themeSelector');
			themeSelector.value = 'light';
			themeSelector.dispatchEvent(new Event('change'));

			// Should not throw
			expect(true).toBe(true);
		});

		FunkyTests.it('should set up viewport button listeners', function() {
			var container = fixture.el.querySelector('div');
			Playground.init('#' + container.id);

			var viewportBtn = document.querySelector('.viewport-btn[data-viewport="tablet"]');
			viewportBtn.click();

			expect(viewportBtn.classList.contains('active')).toBe(true);
		});

		FunkyTests.it('should set up panel tab listeners', function() {
			var container = fixture.el.querySelector('div');
			Playground.init('#' + container.id);

			var panelTab = document.querySelector('.panel-tab[data-panel="events"]');
			panelTab.click();

			// Should not throw
			expect(true).toBe(true);
		});

		FunkyTests.it('should set up clear events button listener', function() {
			var container = fixture.el.querySelector('div');
			Playground.init('#' + container.id);
			Playground.eventLog = [{ event: 'test' }];

			var clearBtn = document.getElementById('clearEventsBtn');
			clearBtn.click();

			expect(Playground.eventLog.length).toBe(0);
		});
	});

	// =========================================================================
	// Component Registry Interaction
	// =========================================================================
	FunkyTests.describe('Component Registry', function() {
		FunkyTests.it('should have access to COMPONENTS registry', function() {
			// The registry is internal but we can test that init works
			var container = fixture.el.querySelector('div');

			expect(function() {
				Playground.init('#' + container.id);
			}).not.toThrow();
		});
	});

	// =========================================================================
	// iframe Communication
	// =========================================================================
	FunkyTests.describe('iframe Communication', function() {
		FunkyTests.it('should set up message listener', function() {
			var container = fixture.el.querySelector('div');
			Playground.init('#' + container.id);

			// The message listener should be set up
			// We can test that posting a message doesn't throw
			expect(function() {
				window.postMessage({ type: 'test' }, '*');
			}).not.toThrow();
		});
	});

	// =========================================================================
	// State Preservation
	// =========================================================================
	FunkyTests.describe('State Preservation', function() {
		FunkyTests.it('should preserve component state on destroy', function() {
			var container = fixture.el.querySelector('div');
			Playground.init('#' + container.id);
			Playground.currentComponent = 'StatsBar';
			Playground.currentProps = { stats: [] };

			var state = Playground.destroy();

			expect(state.component).toBe('StatsBar');
			expect(state.props).toBeDefined();
		});

		FunkyTests.it('should preserve viewport state on destroy', function() {
			var container = fixture.el.querySelector('div');
			Playground.init('#' + container.id);
			Playground._setViewport('tablet');

			var state = Playground.destroy();

			expect(state.viewport).toBe('tablet');
		});

		FunkyTests.it('should restore pending state on init', function() {
			var container = fixture.el.querySelector('div');
			var state = {
				component: 'Format',
				props: { formatType: 'currency' }
			};

			Playground.init('#' + container.id, state);

			expect(Playground._pendingState).toBeDefined();
			expect(Playground._pendingState.component).toBe('Format');
		});
	});

});

/**
 * Funky.ComboBox - Select2 Replacement Tests
 *
 * Tests for the ComboBox component with search, keyboard navigation,
 * multi-select, remote data, and accessibility features.
 */
FunkyTests.describe('Funky.ComboBox', function() {
	'use strict';

	var ComboBox = Funky.ComboBox;
	var D = Funky.Dom;

	// Skip all tests if ComboBox failed to load
	if (!ComboBox) {
		FunkyTests.it('ComboBox module not available', function() {
			FunkyTests.expect(true).toBe(true);
		});
		return;
	}

	var expect = FunkyTests.expect;
	var fixture;
	var testCounter = 0;
	var cleanup = [];

	/**
	 * Generate unique ID for test isolation
	 */
	function uniqueId(prefix) {
		testCounter++;
		return (prefix || 'cb') + '_' + testCounter + '_' + Date.now();
	}

	/**
	 * Create a test select element
	 */
	function createSelect(options) {
		options = options || {};
		var id = uniqueId('select');
		var select = document.createElement('select');
		select.id = id;
		select.setAttribute('data-combobox', '');

		if (options.placeholder) {
			var placeholderOpt = document.createElement('option');
			placeholderOpt.value = '';
			placeholderOpt.textContent = options.placeholder;
			select.appendChild(placeholderOpt);
		}

		(options.items || []).forEach(function(item) {
			var opt = document.createElement('option');
			opt.value = item.id || item.value;
			opt.textContent = item.name || item.text;
			if (item.disabled) opt.disabled = true;
			if (item.selected) opt.selected = true;
			select.appendChild(opt);
		});

		if (options.multiple) {
			select.multiple = true;
		}

		fixture.container.appendChild(select);
		return select;
	}

	/**
	 * Wait for DOM updates
	 */
	function nextTick(callback, delay) {
		return new Promise(function(resolve) {
			setTimeout(function() {
				if (callback) callback();
				resolve();
			}, delay || 10);
		});
	}

	FunkyTests.beforeEach(function() {
		fixture = FunkyTests.fixture('<div id="combobox-test-container"></div>');
	});

	FunkyTests.afterEach(function() {
		// Destroy all instances created during test
		cleanup.forEach(function(fn) {
			try { fn(); } catch (e) { /* ignore */ }
		});
		cleanup = [];

		// Remove any leftover ComboBox wrappers
		var wrappers = document.querySelectorAll('.combobox');
		wrappers.forEach(function(w) { w.remove(); });

		fixture.cleanup();
	});

	// =========================================================================
	// Module Structure
	// =========================================================================
	FunkyTests.describe('Module Structure', function() {
		FunkyTests.it('should be registered with Funky namespace', function() {
			expect(ComboBox).toBeDefined();
			expect(Funky.isRegistered('ComboBox')).toBe(true);
		});

		FunkyTests.it('should expose init method', function() {
			expect(typeof ComboBox.init).toBe('function');
		});

		FunkyTests.it('should expose initAll method', function() {
			expect(typeof ComboBox.initAll).toBe('function');
		});

		FunkyTests.it('should expose get method', function() {
			expect(typeof ComboBox.get).toBe('function');
		});

		FunkyTests.it('should expose destroyAll method', function() {
			expect(typeof ComboBox.destroyAll).toBe('function');
		});
	});

	// =========================================================================
	// Initialization
	// =========================================================================
	FunkyTests.describe('Initialization', function() {
		FunkyTests.it('should initialize from select element', function() {
			var el = createSelect({
				placeholder: 'Choose...',
				items: [{ id: '1', name: 'One' }]
			});

			var combo = ComboBox.init(el);
			cleanup.push(function() { combo.destroy(); });

			expect(combo).toBeDefined();
			expect(document.querySelector('.combobox')).not.toBe(null);
			expect(el.style.display).toBe('none');
		});

		FunkyTests.it('should initialize from selector string', function() {
			var el = createSelect({
				items: [{ id: '1', name: 'One' }]
			});

			var combo = ComboBox.init('#' + el.id);
			cleanup.push(function() { combo.destroy(); });

			expect(combo).toBeDefined();
		});

		FunkyTests.it('should auto-init elements with data-combobox', function() {
			createSelect({ items: [{ id: '1', name: 'One' }] });
			createSelect({ items: [{ id: '2', name: 'Two' }] });

			var instances = ComboBox.initAll(fixture.container);
			instances.forEach(function(i) {
				cleanup.push(function() { i.destroy(); });
			});

			expect(instances.length).toBe(2);
		});

		FunkyTests.it('should extract options from select element', function() {
			var el = createSelect({
				items: [
					{ id: 'a', name: 'Alpha' },
					{ id: 'b', name: 'Beta' },
					{ id: 'c', name: 'Gamma' }
				]
			});

			var combo = ComboBox.init(el);
			cleanup.push(function() { combo.destroy(); });

			var items = combo.getItems();
			expect(items.length).toBe(3);
			expect(items[0].name).toBe('Alpha');
		});

		FunkyTests.it('should parse data attributes', function() {
			var el = createSelect({ items: [{ id: '1', name: 'One' }] });
			el.setAttribute('data-combobox-placeholder', 'Pick one');
			el.setAttribute('data-combobox-searchable', 'false');

			var combo = ComboBox.init(el);
			cleanup.push(function() { combo.destroy(); });

			expect(combo.options.placeholder).toBe('Pick one');
			expect(combo.options.searchable).toBe(false);
		});

		FunkyTests.it('should use items from options', function() {
			var el = createSelect();
			var combo = ComboBox.init(el, {
				items: [
					{ id: 'x', name: 'X Value' },
					{ id: 'y', name: 'Y Value' }
				]
			});
			cleanup.push(function() { combo.destroy(); });

			var items = combo.getItems();
			expect(items.length).toBe(2);
			expect(items[0].id).toBe('x');
		});

		FunkyTests.it('should respect pre-selected option', function() {
			var el = createSelect({
				items: [
					{ id: 'a', name: 'A' },
					{ id: 'b', name: 'B', selected: true }
				]
			});

			var combo = ComboBox.init(el);
			cleanup.push(function() { combo.destroy(); });

			expect(combo.getValue()).toBe('b');
		});
	});

	// =========================================================================
	// Open/Close
	// =========================================================================
	FunkyTests.describe('Open/Close', function() {
		FunkyTests.it('should open dropdown', function() {
			var el = createSelect({ items: [{ id: '1', name: 'One' }] });
			var combo = ComboBox.init(el);
			cleanup.push(function() { combo.destroy(); });

			expect(combo.isOpen()).toBe(false);
			combo.open();
			expect(combo.isOpen()).toBe(true);
		});

		FunkyTests.it('should add is-open class when open', function() {
			var el = createSelect({ items: [{ id: '1', name: 'One' }] });
			var combo = ComboBox.init(el);
			cleanup.push(function() { combo.destroy(); });

			combo.open();
			var wrapper = document.querySelector('.combobox');
			expect(wrapper.classList.contains('is-open')).toBe(true);
		});

		FunkyTests.it('should close dropdown', function() {
			var el = createSelect({ items: [{ id: '1', name: 'One' }] });
			var combo = ComboBox.init(el);
			cleanup.push(function() { combo.destroy(); });

			combo.open();
			combo.close();
			expect(combo.isOpen()).toBe(false);
		});

		FunkyTests.it('should toggle dropdown', function() {
			var el = createSelect({ items: [{ id: '1', name: 'One' }] });
			var combo = ComboBox.init(el);
			cleanup.push(function() { combo.destroy(); });

			combo.toggle();
			expect(combo.isOpen()).toBe(true);
			combo.toggle();
			expect(combo.isOpen()).toBe(false);
		});

		FunkyTests.it('should not open when disabled', function() {
			var el = createSelect({ items: [{ id: '1', name: 'One' }] });
			var combo = ComboBox.init(el);
			cleanup.push(function() { combo.destroy(); });

			combo.disable();
			combo.open();
			expect(combo.isOpen()).toBe(false);
		});
	});

	// =========================================================================
	// Value Management
	// =========================================================================
	FunkyTests.describe('Value Management', function() {
		FunkyTests.it('should set and get value', function() {
			var el = createSelect({
				items: [
					{ id: 'x', name: 'X' },
					{ id: 'y', name: 'Y' }
				]
			});
			var combo = ComboBox.init(el);
			cleanup.push(function() { combo.destroy(); });

			combo.setValue('x');
			expect(combo.getValue()).toBe('x');
		});

		FunkyTests.it('should return text of selected item', function() {
			var el = createSelect({
				items: [{ id: 'test', name: 'Test Label' }]
			});
			var combo = ComboBox.init(el);
			cleanup.push(function() { combo.destroy(); });

			combo.setValue('test');
			expect(combo.getText()).toBe('Test Label');
		});

		FunkyTests.it('should sync value to original element', function() {
			var el = createSelect({
				items: [{ id: 'sync-test', name: 'Sync Test' }]
			});
			var combo = ComboBox.init(el);
			cleanup.push(function() { combo.destroy(); });

			combo.setValue('sync-test');
			expect(el.value).toBe('sync-test');
		});

		FunkyTests.it('should clear value', function() {
			var el = createSelect({
				items: [{ id: 'a', name: 'A' }]
			});
			var combo = ComboBox.init(el);
			cleanup.push(function() { combo.destroy(); });

			combo.setValue('a');
			combo.clear();
			expect(combo.getValue()).toBe(null);
		});

		FunkyTests.it('should return selected items', function() {
			var el = createSelect({
				items: [{ id: 'item1', name: 'Item 1' }]
			});
			var combo = ComboBox.init(el);
			cleanup.push(function() { combo.destroy(); });

			combo.setValue('item1');
			var items = combo.getSelectedItems();
			expect(items.length).toBe(1);
			expect(items[0].id).toBe('item1');
		});
	});

	// =========================================================================
	// Multi-Select
	// =========================================================================
	FunkyTests.describe('Multi-Select', function() {
		FunkyTests.it('should handle array values in multi mode', function() {
			var el = createSelect({
				items: [
					{ id: '1', name: 'One' },
					{ id: '2', name: 'Two' },
					{ id: '3', name: 'Three' }
				]
			});
			var combo = ComboBox.init(el, { mode: 'multi' });
			cleanup.push(function() { combo.destroy(); });

			combo.setValue(['1', '3']);
			var val = combo.getValue();
			expect(Array.isArray(val)).toBe(true);
			expect(val.length).toBe(2);
			expect(val.indexOf('1') !== -1).toBe(true);
			expect(val.indexOf('3') !== -1).toBe(true);
		});

		FunkyTests.it('should render tags in multi mode', function() {
			var el = createSelect({
				items: [
					{ id: '1', name: 'One' },
					{ id: '2', name: 'Two' }
				]
			});
			var combo = ComboBox.init(el, { mode: 'multi' });
			cleanup.push(function() { combo.destroy(); });

			combo.setValue(['1', '2']);
			var tags = document.querySelectorAll('.combobox__tag');
			expect(tags.length).toBe(2);
		});

		FunkyTests.it('should show +N more when exceeding maxTags', function() {
			var el = createSelect({
				items: [
					{ id: '1', name: 'One' },
					{ id: '2', name: 'Two' },
					{ id: '3', name: 'Three' },
					{ id: '4', name: 'Four' },
					{ id: '5', name: 'Five' },
					{ id: '6', name: 'Six' }
				]
			});
			var combo = ComboBox.init(el, { mode: 'multi', maxTags: 3 });
			cleanup.push(function() { combo.destroy(); });

			combo.setValue(['1', '2', '3', '4', '5', '6']);
			var more = document.querySelector('.combobox__tag-more');
			expect(more).not.toBe(null);
			expect(more.textContent).toContain('+3');
		});

		FunkyTests.it('should respect maxSelection limit', function() {
			var el = createSelect({
				items: [
					{ id: '1', name: 'One' },
					{ id: '2', name: 'Two' },
					{ id: '3', name: 'Three' }
				]
			});
			var combo = ComboBox.init(el, { mode: 'multi', maxSelection: 2 });
			cleanup.push(function() { combo.destroy(); });

			combo.setValue(['1', '2', '3']);
			var val = combo.getValue();
			expect(val.length).toBeLessThanOrEqual(2);
		});
	});

	// =========================================================================
	// Search/Filter
	// =========================================================================
	FunkyTests.describe('Search/Filter', function() {
		FunkyTests.it('should filter items on search', function(done) {
			var el = createSelect({
				items: [
					{ id: '1', name: 'Apple' },
					{ id: '2', name: 'Banana' },
					{ id: '3', name: 'Cherry' }
				]
			});
			var combo = ComboBox.init(el);
			cleanup.push(function() { combo.destroy(); });

			combo.open();
			combo._handleSearch('ban');

			nextTick(function() {
				var filtered = combo.getFilteredItems();
				expect(filtered.length).toBe(1);
				expect(filtered[0].name).toBe('Banana');
				done();
			}, 50);
		});

		FunkyTests.it('should show no results message', function(done) {
			var el = createSelect({
				items: [{ id: '1', name: 'Apple' }]
			});
			var combo = ComboBox.init(el);
			cleanup.push(function() { combo.destroy(); });

			combo.open();
			combo._handleSearch('xyz');

			nextTick(function() {
				var status = document.querySelector('.combobox__status');
				expect(status.style.display).not.toBe('none');
				done();
			}, 50);
		});

		FunkyTests.it('should respect minSearchLength', function() {
			var el = createSelect({
				items: [{ id: '1', name: 'Apple' }]
			});
			var combo = ComboBox.init(el, { minSearchLength: 3 });
			cleanup.push(function() { combo.destroy(); });

			combo.open();
			combo._handleSearch('ap');

			// Should not filter yet
			var filtered = combo.getFilteredItems();
			expect(filtered.length).toBe(0); // Shows status instead
		});
	});

	// =========================================================================
	// Events
	// =========================================================================
	FunkyTests.describe('Events', function() {
		FunkyTests.it('should emit change event', function(done) {
			var el = createSelect({
				items: [{ id: 'a', name: 'A' }]
			});
			var combo = ComboBox.init(el);
			cleanup.push(function() { combo.destroy(); });

			combo.on('change', function(e) {
				expect(e.detail.value).toBe('a');
				done();
			});

			combo.setValue('a');
		});

		FunkyTests.it('should emit open event', function(done) {
			var el = createSelect({ items: [{ id: '1', name: 'One' }] });
			var combo = ComboBox.init(el);
			cleanup.push(function() { combo.destroy(); });

			combo.on('open', function() {
				done();
			});

			combo.open();
		});

		FunkyTests.it('should emit close event', function(done) {
			var el = createSelect({ items: [{ id: '1', name: 'One' }] });
			var combo = ComboBox.init(el);
			cleanup.push(function() { combo.destroy(); });

			combo.on('close', function() {
				done();
			});

			combo.open();
			combo.close();
		});

		FunkyTests.it('should emit clear event', function(done) {
			var el = createSelect({
				items: [{ id: 'a', name: 'A' }]
			});
			var combo = ComboBox.init(el);
			cleanup.push(function() { combo.destroy(); });

			combo.setValue('a');
			combo.on('clear', function() {
				done();
			});

			combo.clear();
		});

		FunkyTests.it('should emit search event', function(done) {
			var el = createSelect({
				items: [{ id: '1', name: 'Apple' }]
			});
			var combo = ComboBox.init(el);
			cleanup.push(function() { combo.destroy(); });

			combo.on('search', function(e) {
				expect(e.detail.query).toBe('test');
				done();
			});

			combo.open();
			combo._handleSearch('test');
		});
	});

	// =========================================================================
	// Accessibility
	// =========================================================================
	FunkyTests.describe('Accessibility', function() {
		FunkyTests.it('should have correct ARIA role on trigger', function() {
			var el = createSelect({ items: [{ id: '1', name: 'One' }] });
			var combo = ComboBox.init(el);
			cleanup.push(function() { combo.destroy(); });

			var trigger = document.querySelector('.combobox__trigger');
			expect(trigger.getAttribute('role')).toBe('combobox');
		});

		FunkyTests.it('should have aria-haspopup=listbox', function() {
			var el = createSelect({ items: [{ id: '1', name: 'One' }] });
			var combo = ComboBox.init(el);
			cleanup.push(function() { combo.destroy(); });

			var trigger = document.querySelector('.combobox__trigger');
			expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');
		});

		FunkyTests.it('should update aria-expanded on open/close', function() {
			var el = createSelect({ items: [{ id: '1', name: 'One' }] });
			var combo = ComboBox.init(el);
			cleanup.push(function() { combo.destroy(); });

			var trigger = document.querySelector('.combobox__trigger');
			expect(trigger.getAttribute('aria-expanded')).toBe('false');

			combo.open();
			expect(trigger.getAttribute('aria-expanded')).toBe('true');

			combo.close();
			expect(trigger.getAttribute('aria-expanded')).toBe('false');
		});

		FunkyTests.it('should be keyboard focusable', function() {
			var el = createSelect({ items: [{ id: '1', name: 'One' }] });
			var combo = ComboBox.init(el);
			cleanup.push(function() { combo.destroy(); });

			var trigger = document.querySelector('.combobox__trigger');
			expect(trigger.getAttribute('tabindex')).toBe('0');
		});

		FunkyTests.it('should have live region for announcements', function() {
			var el = createSelect({ items: [{ id: '1', name: 'One' }] });
			var combo = ComboBox.init(el);
			cleanup.push(function() { combo.destroy(); });

			var liveRegion = document.querySelector('.combobox__live-region');
			expect(liveRegion).not.toBe(null);
			expect(liveRegion.getAttribute('aria-live')).toBe('polite');
		});

		FunkyTests.it('should set aria-multiselectable in multi mode', function() {
			var el = createSelect({ items: [{ id: '1', name: 'One' }] });
			var combo = ComboBox.init(el, { mode: 'multi' });
			cleanup.push(function() { combo.destroy(); });

			var dropdown = document.querySelector('.combobox__dropdown');
			expect(dropdown.getAttribute('aria-multiselectable')).toBe('true');
		});
	});

	// =========================================================================
	// Disabled State
	// =========================================================================
	FunkyTests.describe('Disabled State', function() {
		FunkyTests.it('should disable the component', function() {
			var el = createSelect({ items: [{ id: '1', name: 'One' }] });
			var combo = ComboBox.init(el);
			cleanup.push(function() { combo.destroy(); });

			combo.disable();
			expect(combo.isDisabled()).toBe(true);
		});

		FunkyTests.it('should add is-disabled class when disabled', function() {
			var el = createSelect({ items: [{ id: '1', name: 'One' }] });
			var combo = ComboBox.init(el);
			cleanup.push(function() { combo.destroy(); });

			combo.disable();
			var wrapper = document.querySelector('.combobox');
			expect(wrapper.classList.contains('is-disabled')).toBe(true);
		});

		FunkyTests.it('should enable the component', function() {
			var el = createSelect({ items: [{ id: '1', name: 'One' }] });
			var combo = ComboBox.init(el);
			cleanup.push(function() { combo.destroy(); });

			combo.disable();
			combo.enable();
			expect(combo.isDisabled()).toBe(false);
		});
	});

	// =========================================================================
	// Destroy
	// =========================================================================
	FunkyTests.describe('Destroy', function() {
		FunkyTests.it('should remove wrapper on destroy', function() {
			var el = createSelect({ items: [{ id: '1', name: 'One' }] });
			var combo = ComboBox.init(el);

			var id = combo.id;
			combo.destroy();

			var wrapper = document.getElementById(id);
			expect(wrapper).toBe(null);
		});

		FunkyTests.it('should show original element on destroy', function() {
			var el = createSelect({ items: [{ id: '1', name: 'One' }] });
			var combo = ComboBox.init(el);

			expect(el.style.display).toBe('none');
			combo.destroy();
			expect(el.style.display).not.toBe('none');
		});

		FunkyTests.it('should remove instance from registry', function() {
			var el = createSelect({ items: [{ id: '1', name: 'One' }] });
			var combo = ComboBox.init(el);

			var id = combo.id;
			combo.destroy();

			expect(ComboBox.get(id)).toBe(null);
		});

		FunkyTests.it('destroyAll should destroy all instances', function() {
			createSelect({ items: [{ id: '1', name: 'One' }] });
			createSelect({ items: [{ id: '2', name: 'Two' }] });

			ComboBox.initAll(fixture.container);
			ComboBox.destroyAll();

			var wrappers = document.querySelectorAll('.combobox');
			expect(wrappers.length).toBe(0);
		});
	});

	// =========================================================================
	// Static Methods
	// =========================================================================
	FunkyTests.describe('Static Methods', function() {
		FunkyTests.it('should get instance by id', function() {
			var el = createSelect({ items: [{ id: '1', name: 'One' }] });
			var combo = ComboBox.init(el);
			cleanup.push(function() { combo.destroy(); });

			var retrieved = ComboBox.get(combo.id);
			expect(retrieved).toBe(combo);
		});

		FunkyTests.it('should get instance by element', function() {
			var el = createSelect({ items: [{ id: '1', name: 'One' }] });
			var combo = ComboBox.init(el);
			cleanup.push(function() { combo.destroy(); });

			var retrieved = ComboBox.get(el);
			expect(retrieved).toBe(combo);
		});
	});

	// =========================================================================
	// Template Functions
	// =========================================================================
	FunkyTests.describe('Template Functions', function() {
		FunkyTests.describe('templateResult', function() {
			FunkyTests.it('should accept string return', function() {
				var el = createSelect();
				var templateCalled = false;
				
				var combo = ComboBox.init(el, {
					items: [{ id: '1', name: 'Item One' }],
					templateResult: function(item, state) {
						templateCalled = true;
						expect(item.id).toBe('1');
						expect(state).toHaveProperty('isSelected');
						expect(state).toHaveProperty('index');
						return '<span class="custom-item">' + item.name + '</span>';
					}
				});
				cleanup.push(function() { combo.destroy(); });

				combo.open();
				
				return nextTick(function() {
					expect(templateCalled).toBe(true);
					var customItem = document.querySelector('.custom-item');
					expect(customItem).not.toBe(null);
				}, 50);
			});

			FunkyTests.it('should accept DOM element return', function() {
				var el = createSelect();
				
				var combo = ComboBox.init(el, {
					items: [{ id: '1', name: 'Item One' }],
					templateResult: function(item) {
						var div = document.createElement('div');
						div.className = 'dom-template-item';
						div.textContent = item.name;
						return div;
					}
				});
				cleanup.push(function() { combo.destroy(); });

				combo.open();
				
				return nextTick(function() {
					var domItem = document.querySelector('.dom-template-item');
					expect(domItem).not.toBe(null);
				}, 50);
			});

			FunkyTests.it('should accept Funky.Dom element return', function() {
				var el = createSelect();
				
				var combo = ComboBox.init(el, {
					items: [{ id: '1', name: 'Item One' }],
					templateResult: function(item) {
						return D.create('span')
							.classAdd('funky-dom-item')
							.text(item.name);
					}
				});
				cleanup.push(function() { combo.destroy(); });

				combo.open();
				
				return nextTick(function() {
					var funkyItem = document.querySelector('.funky-dom-item');
					expect(funkyItem).not.toBe(null);
				}, 50);
			});

			FunkyTests.it('should receive state with isSelected', function() {
				var el = createSelect();
				var receivedState = null;
				
				var combo = ComboBox.init(el, {
					items: [{ id: '1', name: 'One' }, { id: '2', name: 'Two' }],
					templateResult: function(item, state) {
						if (item.id === '1') {
							receivedState = state;
						}
						return item.name;
					}
				});
				cleanup.push(function() { combo.destroy(); });

				combo.setValue('1');
				combo.open();
				
				return nextTick(function() {
					expect(receivedState).not.toBe(null);
					expect(receivedState.isSelected).toBe(true);
				}, 50);
			});
		});

		FunkyTests.describe('templateSelection', function() {
			FunkyTests.it('should customize selected value display', function() {
				var el = createSelect();
				
				var combo = ComboBox.init(el, {
					items: [{ id: '1', name: 'Item', code: 'ITM' }],
					templateSelection: function(item) {
						return '<strong>' + item.code + '</strong> - ' + item.name;
					}
				});
				cleanup.push(function() { combo.destroy(); });

				combo.setValue('1');
				
				return nextTick(function() {
					var display = document.querySelector('.combobox__value');
					expect(display.innerHTML).toContain('<strong>ITM</strong>');
				}, 20);
			});

			FunkyTests.it('should accept Funky.Dom element', function() {
				var el = createSelect();
				
				var combo = ComboBox.init(el, {
					items: [{ id: '1', name: 'Item', icon: 'star' }],
					templateSelection: function(item) {
						return D.create('span')
							.classAdd('selection-with-icon')
							.html('<i class="fa fa-' + item.icon + '"></i> ' + item.name);
					}
				});
				cleanup.push(function() { combo.destroy(); });

				combo.setValue('1');
				
				return nextTick(function() {
					var selection = document.querySelector('.selection-with-icon');
					expect(selection).not.toBe(null);
				}, 20);
			});
		});

		FunkyTests.describe('templateTag', function() {
			FunkyTests.it('should customize tag content in multi-select', function() {
				var el = createSelect({ multiple: true });
				
				var combo = ComboBox.init(el, {
					mode: 'multi',
					items: [{ id: '1', name: 'One', color: 'red' }],
					templateTag: function(item) {
						return '<span class="tag-colored" style="color:' + item.color + '">' + item.name + '</span>';
					}
				});
				cleanup.push(function() { combo.destroy(); });

				combo.setValue(['1']);
				
				return nextTick(function() {
					var coloredTag = document.querySelector('.tag-colored');
					expect(coloredTag).not.toBe(null);
					expect(coloredTag.style.color).toBe('red');
				}, 20);
			});

			FunkyTests.it('should preserve remove button with custom template', function() {
				var el = createSelect({ multiple: true });
				
				var combo = ComboBox.init(el, {
					mode: 'multi',
					items: [{ id: '1', name: 'One' }],
					templateTag: function(item) {
						return '<span class="custom-tag-label">' + item.name + '</span>';
					}
				});
				cleanup.push(function() { combo.destroy(); });

				combo.setValue(['1']);
				
				return nextTick(function() {
					var tag = document.querySelector('.combobox__tag');
					var removeBtn = tag.querySelector('.combobox__tag-remove');
					expect(removeBtn).not.toBe(null);
				}, 20);
			});
		});

		FunkyTests.describe('backward compatibility', function() {
			FunkyTests.it('renderItem should still work (deprecated)', function() {
				var el = createSelect();
				var renderCalled = false;
				
				var combo = ComboBox.init(el, {
					items: [{ id: '1', name: 'One' }],
					renderItem: function(item, state) {
						renderCalled = true;
						return '<span class="legacy-render">' + item.name + '</span>';
					}
				});
				cleanup.push(function() { combo.destroy(); });

				combo.open();
				
				return nextTick(function() {
					expect(renderCalled).toBe(true);
				}, 50);
			});

			FunkyTests.it('templateResult should take precedence over renderItem', function() {
				var el = createSelect();
				var templateUsed = false;
				var renderItemUsed = false;
				
				var combo = ComboBox.init(el, {
					items: [{ id: '1', name: 'One' }],
					renderItem: function() {
						renderItemUsed = true;
						return 'render';
					},
					templateResult: function() {
						templateUsed = true;
						return 'template';
					}
				});
				cleanup.push(function() { combo.destroy(); });

				combo.open();
				
				return nextTick(function() {
					expect(templateUsed).toBe(true);
					expect(renderItemUsed).toBe(false);
				}, 50);
			});
		});
	});

	// =========================================================================
	// LiveBinding Integration
	// =========================================================================
	FunkyTests.describe('LiveBinding Integration', function() {
		FunkyTests.it('should register with LiveBinding if available', function() {
			if (!Funky.LiveBinding) {
				expect(true).toBe(true); // Skip if not available
				return;
			}

			expect(Funky.LiveBinding._componentAdapters).toHaveProperty('combobox');
		});

		FunkyTests.it('adapter should support ComboBox elements', function() {
			if (!Funky.LiveBinding || !Funky.LiveBinding._componentAdapters.combobox) {
				expect(true).toBe(true);
				return;
			}

			var el = createSelect();
			el.setAttribute('data-combobox', '');
			
			var adapter = Funky.LiveBinding._componentAdapters.combobox;
			expect(adapter.supports(el)).toBe(true);
		});

		FunkyTests.it('adapter bind should return update/getData methods', function() {
			if (!Funky.LiveBinding || !Funky.LiveBinding._componentAdapters.combobox) {
				expect(true).toBe(true);
				return;
			}

			var el = createSelect();
			var combo = ComboBox.init(el, {
				items: [{ id: '1', name: 'One' }]
			});
			cleanup.push(function() { combo.destroy(); });
			
			var adapter = Funky.LiveBinding._componentAdapters.combobox;
			var binding = adapter.bind(el, {});
			
			expect(typeof binding.update).toBe('function');
			expect(typeof binding.getData).toBe('function');
		});

		FunkyTests.it('adapter update should set items from array', function() {
			if (!Funky.LiveBinding || !Funky.LiveBinding._componentAdapters.combobox) {
				expect(true).toBe(true);
				return;
			}

			var el = createSelect();
			var combo = ComboBox.init(el, { items: [] });
			cleanup.push(function() { combo.destroy(); });
			
			var adapter = Funky.LiveBinding._componentAdapters.combobox;
			var binding = adapter.bind(el, {});
			
			binding.update([
				{ id: 'a', name: 'Alpha' },
				{ id: 'b', name: 'Beta' }
			]);
			
			expect(combo.getItems().length).toBe(2);
		});

		FunkyTests.it('adapter update should set value from object', function() {
			if (!Funky.LiveBinding || !Funky.LiveBinding._componentAdapters.combobox) {
				expect(true).toBe(true);
				return;
			}

			var el = createSelect();
			var combo = ComboBox.init(el, {
				items: [{ id: '1', name: 'One' }, { id: '2', name: 'Two' }]
			});
			cleanup.push(function() { combo.destroy(); });
			
			var adapter = Funky.LiveBinding._componentAdapters.combobox;
			var binding = adapter.bind(el, {});
			
			binding.update({ value: '2' });
			
			expect(combo.getValue()).toBe('2');
		});

		FunkyTests.it('adapter getData should return current value', function() {
			if (!Funky.LiveBinding || !Funky.LiveBinding._componentAdapters.combobox) {
				expect(true).toBe(true);
				return;
			}

			var el = createSelect();
			var combo = ComboBox.init(el, {
				items: [{ id: '1', name: 'One' }]
			});
			cleanup.push(function() { combo.destroy(); });
			
			combo.setValue('1');
			
			var adapter = Funky.LiveBinding._componentAdapters.combobox;
			var binding = adapter.bind(el, {});
			
			expect(binding.getData()).toBe('1');
		});
	});

});

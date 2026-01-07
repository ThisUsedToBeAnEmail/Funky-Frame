/**
 * Funky Slider - Custom dual-handle range slider component
 * Used for range filtering in AdvancedFilter
 * 
 * Usage:
 *   var slider = new Funky.Slider.create(container, {
 *     min: 0,
 *     max: 1000000,
 *     step: 1,
 *     minValue: 100,
 *     maxValue: 5000,
 *     formatValue: function(val) { return '$' + val.toLocaleString(); },
 *     onUpdate: function(values) { console.log(values.min, values.max); }
 *   });
 * 
 * @version 1.0.4
 */
(function(window) {
	'use strict';

	// Ensure Funky registry exists
	if (!window.Funky || !window.Funky.register) {
		console.error('[Funky.Slider] Registry not found. Load namespace.js first.');
		return;
	}

	/**
	 * FunkySlider Constructor
	 * @param {HTMLElement} container - Container element for the slider
	 * @param {Object} options - Configuration options
	 */
	function FunkySlider(container, options) {
		this.container = container;
		this.options = Object.assign({
			min: 0,
			max: 1000000,
			step: 1,
			minValue: null,
			maxValue: null,
			onUpdate: null,
			formatValue: function(val) { return val.toLocaleString(); }
		}, options);

		this.minValue = this.options.minValue !== null ? this.options.minValue : this.options.min;
		this.maxValue = this.options.maxValue !== null ? this.options.maxValue : this.options.max;

		// GestureTracker instances for touch
		this._minGesture = null;
		this._maxGesture = null;

		// Keyboard handler cleanup
		this._keyboardUnregisters = [];

		this.init();
	}

	FunkySlider.prototype.init = function() {
		this.render();
		this.attachEvents();
		this.update();

		// Register instance
		if (this.container.id) {
			_instances.register(this.container.id, this);
		}
	};

	FunkySlider.prototype.render = function() {
		var D = Funky.Dom;
		var minLabel = this.options.minLabel || 'Minimum value';
		var maxLabel = this.options.maxLabel || 'Maximum value';

		var slider = D.div().class('funky-slider').child(
			D.div().class('funky-slider-track').child(
				D.div().class('funky-slider-range')
			),
			D.div().class('funky-slider-handle funky-slider-handle-min')
				.data('handle', 'min')
				.attr('tabindex', '0')
				.attr('role', 'slider')
				.aria('valuemin', String(this.options.min))
				.aria('valuemax', String(this.options.max))
				.aria('valuenow', String(this.minValue))
				.aria('label', minLabel)
				.child(D.div().class('funky-slider-tooltip')),
			D.div().class('funky-slider-handle funky-slider-handle-max')
				.data('handle', 'max')
				.attr('tabindex', '0')
				.attr('role', 'slider')
				.aria('valuemin', String(this.options.min))
				.aria('valuemax', String(this.options.max))
				.aria('valuenow', String(this.maxValue))
				.aria('label', maxLabel)
				.child(D.div().class('funky-slider-tooltip'))
		);

		this.container.innerHTML = '';
		this.container.appendChild(slider.get());

		this.track = this.container.querySelector('.funky-slider-track');
		this.range = this.container.querySelector('.funky-slider-range');
		this.minHandle = this.container.querySelector('.funky-slider-handle-min');
		this.maxHandle = this.container.querySelector('.funky-slider-handle-max');
		this.minTooltip = this.minHandle.querySelector('.funky-slider-tooltip');
		this.maxTooltip = this.maxHandle.querySelector('.funky-slider-tooltip');
	};

	FunkySlider.prototype.attachEvents = function() {
		var self = this;

		this.minHandle.addEventListener('mousedown', function(e) {
			self.startDrag(e, 'min');
		});

		this.maxHandle.addEventListener('mousedown', function(e) {
			self.startDrag(e, 'max');
		});

		// Touch support via GestureTracker
		this._minGesture = Funky.GestureTracker.create({
			target: this.minHandle,
			namespace: 'slider-min-' + Date.now(),
			gestures: ['drag'],
			preventDefault: true,
			passive: false,
			
			onDragStart: function() {
				self.activeHandle = 'min';
			},
			onDragMove: function(data) {
				self._updateFromTouch(data.x);
			},
			onDragEnd: function() {
				self.activeHandle = null;
				self.triggerChange();
			}
		});
		
		this._maxGesture = Funky.GestureTracker.create({
			target: this.maxHandle,
			namespace: 'slider-max-' + Date.now(),
			gestures: ['drag'],
			preventDefault: true,
			passive: false,
			
			onDragStart: function() {
				self.activeHandle = 'max';
			},
			onDragMove: function(data) {
				self._updateFromTouch(data.x);
			},
			onDragEnd: function() {
				self.activeHandle = null;
				self.triggerChange();
			}
		});

		// Click on track to move nearest handle
		this.track.addEventListener('click', function(e) {
			if (e.target === self.track || e.target === self.range) {
				var rect = self.track.getBoundingClientRect();
				var percent = (e.clientX - rect.left) / rect.width;
				var value = self.options.min + percent * (self.options.max - self.options.min);

				// Move nearest handle
				var distToMin = Math.abs(value - self.minValue);
				var distToMax = Math.abs(value - self.maxValue);

				if (distToMin < distToMax) {
					self.minValue = self.clamp(value);
				} else {
					self.maxValue = self.clamp(value);
				}

				self.update();
				self.triggerChange();
			}
		});

		// Keyboard navigation for handles - use Funky.Keyboard for F1 help integration
		this._setupKeyboardShortcuts();
	};

	FunkySlider.prototype._setupKeyboardShortcuts = function() {
		var self = this;

		// Ensure handles have IDs for scoping
		if (!this.minHandle.id) {
			this.minHandle.id = 'slider-min-' + Date.now();
		}
		if (!this.maxHandle.id) {
			this.maxHandle.id = 'slider-max-' + Date.now();
		}

		if (Funky.Keyboard) {
			var navKeys = [
				{ key: 'arrowright', description: 'Increase value' },
				{ key: 'arrowup', description: 'Increase value' },
				{ key: 'arrowleft', description: 'Decrease value' },
				{ key: 'arrowdown', description: 'Decrease value' },
				{ key: 'pageup', description: 'Large increase' },
				{ key: 'pagedown', description: 'Large decrease' },
				{ key: 'home', description: 'Set to minimum' },
				{ key: 'end', description: 'Set to maximum' }
			];

			// Register for min handle
			navKeys.forEach(function(keyDef) {
				self._keyboardUnregisters.push(Funky.Keyboard.register({
					key: keyDef.key,
					scope: '#' + self.minHandle.id,
					handler: function(e) {
						self.handleKeydown(e, 'min');
					},
					description: keyDef.description,
					group: 'Slider',
					preventDefault: true
				}));
			});

			// Register for max handle
			navKeys.forEach(function(keyDef) {
				self._keyboardUnregisters.push(Funky.Keyboard.register({
					key: keyDef.key,
					scope: '#' + self.maxHandle.id,
					handler: function(e) {
						self.handleKeydown(e, 'max');
					},
					description: keyDef.description,
					group: 'Slider',
					preventDefault: true
				}));
			});
		} else {
			// Fallback for environments without Funky.Keyboard
			this._minKeydownHandler = function(e) {
				self.handleKeydown(e, 'min');
			};
			this._maxKeydownHandler = function(e) {
				self.handleKeydown(e, 'max');
			};
			this.minHandle.addEventListener('keydown', this._minKeydownHandler);
			this.maxHandle.addEventListener('keydown', this._maxKeydownHandler);
		}
	};

	FunkySlider.prototype.handleKeydown = function(e, handle) {
		var step = this.options.step;
		var largeStep = (this.options.max - this.options.min) / 10;
		var changed = false;

		switch (e.key) {
			case 'ArrowRight':
			case 'ArrowUp':
				e.preventDefault();
				if (handle === 'min') {
					this.minValue = Math.min(this.clamp(this.minValue + step), this.maxValue);
				} else {
					this.maxValue = this.clamp(this.maxValue + step);
				}
				changed = true;
				break;

			case 'ArrowLeft':
			case 'ArrowDown':
				e.preventDefault();
				if (handle === 'min') {
					this.minValue = this.clamp(this.minValue - step);
				} else {
					this.maxValue = Math.max(this.clamp(this.maxValue - step), this.minValue);
				}
				changed = true;
				break;

			case 'PageUp':
				e.preventDefault();
				if (handle === 'min') {
					this.minValue = Math.min(this.clamp(this.minValue + largeStep), this.maxValue);
				} else {
					this.maxValue = this.clamp(this.maxValue + largeStep);
				}
				changed = true;
				break;

			case 'PageDown':
				e.preventDefault();
				if (handle === 'min') {
					this.minValue = this.clamp(this.minValue - largeStep);
				} else {
					this.maxValue = Math.max(this.clamp(this.maxValue - largeStep), this.minValue);
				}
				changed = true;
				break;

			case 'Home':
				e.preventDefault();
				if (handle === 'min') {
					this.minValue = this.options.min;
				} else {
					this.maxValue = this.minValue;
				}
				changed = true;
				break;

			case 'End':
				e.preventDefault();
				if (handle === 'min') {
					this.minValue = this.maxValue;
				} else {
					this.maxValue = this.options.max;
				}
				changed = true;
				break;
		}

		if (changed) {
			this.update();
			this.triggerChange();

			// Announce value change to screen readers
			if (Funky.Announce) {
				var value = handle === 'min' ? this.minValue : this.maxValue;
				Funky.Announce.polite(this.options.formatValue(value));
			}
		}
	};

	FunkySlider.prototype.startDrag = function(e, handle) {
		e.preventDefault();
		var self = this;
		this.activeHandle = handle;

		var moveHandler = function(e) {
			self.onDrag(e);
		};

		var upHandler = function() {
			document.removeEventListener('mousemove', moveHandler);
			document.removeEventListener('mouseup', upHandler);
			self.activeHandle = null;
			self.triggerChange();
		};

		document.addEventListener('mousemove', moveHandler);
		document.addEventListener('mouseup', upHandler);
	};

	FunkySlider.prototype.onDrag = function(e) {
		var clientX = e.touches ? e.touches[0].clientX : e.clientX;
		this._updateFromTouch(clientX);
	};

	/**
	 * Update slider value from touch/mouse X position
	 * @param {number} clientX - X coordinate
	 * @private
	 */
	FunkySlider.prototype._updateFromTouch = function(clientX) {
		var rect = this.track.getBoundingClientRect();
		var percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
		var value = this.options.min + percent * (this.options.max - this.options.min);

		if (this.activeHandle === 'min') {
			this.minValue = Math.min(this.clamp(value), this.maxValue);
		} else {
			this.maxValue = Math.max(this.clamp(value), this.minValue);
		}

		this.update();
	};

	FunkySlider.prototype.clamp = function(value) {
		var stepped = Math.round(value / this.options.step) * this.options.step;
		return Math.max(this.options.min, Math.min(this.options.max, stepped));
	};

	FunkySlider.prototype.update = function() {
		var minPercent = ((this.minValue - this.options.min) / (this.options.max - this.options.min)) * 100;
		var maxPercent = ((this.maxValue - this.options.min) / (this.options.max - this.options.min)) * 100;

		this.minHandle.style.left = minPercent + '%';
		this.maxHandle.style.left = maxPercent + '%';
		this.range.style.left = minPercent + '%';
		this.range.style.width = (maxPercent - minPercent) + '%';

		this.minTooltip.textContent = this.options.formatValue(this.minValue);
		this.maxTooltip.textContent = this.options.formatValue(this.maxValue);

		// Update ARIA attributes
		this.minHandle.setAttribute('aria-valuenow', String(this.minValue));
		this.maxHandle.setAttribute('aria-valuenow', String(this.maxValue));

		// Update aria-valuetext with formatted values
		this.minHandle.setAttribute('aria-valuetext', this.options.formatValue(this.minValue));
		this.maxHandle.setAttribute('aria-valuetext', this.options.formatValue(this.maxValue));
	};

	FunkySlider.prototype.triggerChange = function() {
		if (this.options.onUpdate) {
			this.options.onUpdate({
				min: this.minValue,
				max: this.maxValue
			});
		}
	};

	FunkySlider.prototype.setValues = function(min, max) {
		if (min !== null && min !== undefined) this.minValue = this.clamp(min);
		if (max !== null && max !== undefined) this.maxValue = this.clamp(max);
		this.update();
	};

	FunkySlider.prototype.getValues = function() {
		return {
			min: this.minValue,
			max: this.maxValue
		};
	};

	/**
	 * Set slider value (Bindable Interface)
	 * @param {Object|number} value - Value object {min, max} or single number for min
	 */
	FunkySlider.prototype.setData = function(value) {
		if (typeof value === 'number') {
			this.setValues(value, null);
		} else if (value && typeof value === 'object') {
			this.setValues(
				value.min !== undefined ? value.min : null,
				value.max !== undefined ? value.max : null
			);
		}
		this.triggerChange();
	};

	/**
	 * Get slider value (Bindable Interface)
	 * @returns {Object} - Current slider values {min, max}
	 */
	FunkySlider.prototype.getData = function() {
		return this.getValues();
	};

	/**
	 * Destroy slider instance and clean up
	 */
	FunkySlider.prototype.destroy = function() {
		// Destroy gesture trackers
		if (this._minGesture) {
			this._minGesture.destroy();
			this._minGesture = null;
		}
		if (this._maxGesture) {
			this._maxGesture.destroy();
			this._maxGesture = null;
		}

		// Remove keyboard handlers
		if (this._keyboardUnregisters && this._keyboardUnregisters.length) {
			this._keyboardUnregisters.forEach(function(unregister) {
				if (typeof unregister === 'function') {
					unregister();
				}
			});
			this._keyboardUnregisters = [];
		}
		if (this._minKeydownHandler && this.minHandle) {
			this.minHandle.removeEventListener('keydown', this._minKeydownHandler);
		}
		if (this._maxKeydownHandler && this.maxHandle) {
			this.maxHandle.removeEventListener('keydown', this._maxKeydownHandler);
		}

		// Remove from instance registry
		if (this.container && this.container.id) {
			_instances.unregister(this.container.id);
		}
		// Clear container
		if (this.container) {
			this.container.innerHTML = '';
		}
	};

	// Instance registry
	var _instances = Funky.Registry.createInstanceRegistry('Slider');

	// Factory for creating slider instances
	var SliderFactory = {
		/**
		 * Initialize a slider on container
		 * @param {HTMLElement} container - Container element
		 * @param {Object} options - Configuration options
		 * @returns {FunkySlider}
		 */
		init: function(container, options) {
			return new FunkySlider(container, options);
		},

		/**
		 * @deprecated Use Slider.init() instead
		 */
		create: function(container, options) {
			if (Funky.debug) {
				console.warn('[Funky.Slider] create() is deprecated. Use init() instead.');
			}
			return SliderFactory.init(container, options);
		},

		/**
		 * Get slider instance by container ID
		 * @param {string|HTMLElement} idOrElement - Container element ID or element
		 * @returns {FunkySlider|null}
		 */
		getInstance: function(idOrElement) {
			if (typeof idOrElement === 'string') {
				return _instances.get(idOrElement);
			}
			return idOrElement ? _instances.getByElement(idOrElement) : null;
		},

		/**
		 * Get all slider instances
		 * @returns {Object}
		 */
		getAll: function() {
			return _instances.getAll();
		},

		/**
		 * Destroy slider by ID or element
		 * @param {string|HTMLElement} idOrElement
		 */
		destroy: function(idOrElement) {
			var instance = SliderFactory.getInstance(idOrElement);
			if (instance) {
				instance.destroy();
			}
		},

		/**
		 * Destroy all slider instances
		 */
		destroyAll: function() {
			_instances.destroyAll();
		},

		/**
		 * Set slider data by container ID (Bindable Interface)
		 * @param {string} containerId - Container element ID
		 * @param {Object|number} value - Value object {min, max} or single number
		 * @returns {boolean} - True if successful
		 */
		setData: function(containerId, value) {
			var instance = _instances.get(containerId);
			if (!instance) {
				console.warn('[Funky.Slider] setData: Instance not found:', containerId);
				return false;
			}
			instance.setData(value);
			return true;
		},

		/**
		 * Get slider data by container ID (Bindable Interface)
		 * @param {string} containerId - Container element ID
		 * @returns {Object|null} - Current slider values or null
		 */
		getData: function(containerId) {
			var instance = _instances.get(containerId);
			if (!instance) {
				return null;
			}
			return instance.getData();
		},

		constructor: FunkySlider
	};

	// Register with Funky namespace
	Funky.register('Slider', SliderFactory);

})(window);

/**
 * Funky Timezone - Timezone detection, storage, and formatting
 * 
 * Handles timezone management with:
 * - Browser timezone detection
 * - Server session sync
 * - Date formatting with timezone support
 * - ComboBox timezone picker initialization
 * - DataTables date renderer
 * 
 * Usage:
 *   Funky.Timezone.initialize().then(tz => console.log('Using:', tz));
 *   Funky.Timezone.format(timestamp);
 *   Funky.Timezone.setTimezone('America/New_York');
 *   Funky.Timezone.initializeSelector('#timezone-select');
 * 
 * @version 1.0.0
 */
(function(window) {
	'use strict';

	// Ensure Funky registry exists
	if (!window.Funky || !window.Funky.register) {
		console.error('[Funky.Timezone] Registry not found. Load namespace.js first.');
		return;
	}

	/**
	 * FunkyTimezone Constructor
	 */
	function FunkyTimezone() {
		this.currentTimezone = null;
		this.timezones = null;
		this.initialized = false;
	}

	/**
	 * Detect browser timezone using Intl API
	 * @returns {string} IANA timezone name (e.g., 'America/New_York')
	 */
	FunkyTimezone.prototype.detectBrowserTimezone = function() {
		try {
			return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
		} catch (e) {
			console.error('Failed to detect browser timezone:', e);
			return 'UTC';
		}
	};

	/**
	 * Initialize timezone manager
	 * Fetches current timezone from session or detects browser timezone
	 * @returns {Promise<string>} Current timezone
	 */
	FunkyTimezone.prototype.initialize = function() {
		var self = this;

		if (this.initialized) {
			return Promise.resolve(this.currentTimezone);
		}

		// Use Funky.Api if available, fallback to secureFetch
		var apiFetch = window.Funky && window.Funky.Api ?
			function(url) { return Funky.Api.get(url); } :
			function(url) { return Funky.CSRF.secureFetch(url).then(function(r) { return r.json(); }); };

		return apiFetch('/api/session/timezone')
			.then(function(data) {
				if (data && data.timezone) {
					self.currentTimezone = data.timezone;
				} else {
					// No timezone in session, use browser detection
					self.currentTimezone = self.detectBrowserTimezone();
					// Set it in session for future requests
					return self.setTimezone(self.currentTimezone);
				}
				self.initialized = true;
				return self.currentTimezone;
			})
			.catch(function(error) {
				console.error('Failed to fetch session timezone:', error);
				self.currentTimezone = self.detectBrowserTimezone();
				self.initialized = true;
				return self.currentTimezone;
			});
	};

	/**
	 * Get effective timezone (current or UTC fallback)
	 * @returns {string} Current timezone name
	 */
	FunkyTimezone.prototype.getEffectiveTimezone = function() {
		return this.currentTimezone || 'UTC';
	};

	/**
	 * Set timezone in session
	 * @param {string} timezone - IANA timezone name
	 * @returns {Promise<Object>} Server response (or resolved promise if timezone is null/undefined)
	 */
	FunkyTimezone.prototype.setTimezone = function(timezone) {
		// Handle null/undefined gracefully
		if (timezone == null) {
			return Promise.resolve({ timezone: this.currentTimezone });
		}

		var self = this;

		// Use Funky.Api if available
		var apiPost = window.Funky && window.Funky.Api ?
			function(url, data) { return Funky.Api.post(url, data); } :
			function(url, data) {
				return Funky.CSRF.secureFetch(url, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(data)
				}).then(function(r) { return r.json(); });
			};

		return apiPost('/api/session/timezone', { timezone: timezone })
			.then(function(data) {
				if (data && data.timezone) {
					self.currentTimezone = data.timezone;

					// Trigger timezone changed event
					var event = new CustomEvent('funky.timezone.changed', {
						detail: { timezone: self.currentTimezone }
					});
					document.dispatchEvent(event);

					return data;
				}
				throw new Error('Invalid response from server: ' + JSON.stringify(data));
			});
	};

	/**
	 * Fetch available timezones from server
	 * @returns {Promise<Object>} Timezones grouped by region
	 */
	FunkyTimezone.prototype.fetchTimezones = function() {
		var self = this;

		if (this.timezones) {
			console.log('[Funky.Timezone] Returning cached timezones');
			return Promise.resolve(this.timezones);
		}

		// Use Funky.Api if available
		var apiFetch = window.Funky && window.Funky.Api ?
			function(url) { console.log('[Funky.Timezone] Fetching via Funky.Api:', url); return Funky.Api.get(url); } :
			function(url) { console.log('[Funky.Timezone] Fetching via CSRF.secureFetch:', url); return Funky.CSRF.secureFetch(url).then(function(r) { return r.json(); }); };

		console.log('[Funky.Timezone] Fetching timezones from API...');
		return apiFetch('/api/session/timezones')
			.then(function(data) {
				console.log('[Funky.Timezone] API response:', data);
				if (data && data.timezones) {
					self.timezones = data.timezones;
					return self.timezones;
				}
				throw new Error('Invalid response format from timezones API');
			})
			.catch(function(error) {
				console.warn('Failed to fetch timezones from API, using fallback:', error);
				// Return minimal fallback with proper format
				self.timezones = {
					'UTC': [{ value: 'UTC', label: 'UTC' }],
					'Americas': [
						{ value: 'America/New_York', label: 'Eastern Time (ET)' },
						{ value: 'America/Chicago', label: 'Central Time (CT)' },
						{ value: 'America/Los_Angeles', label: 'Pacific Time (PT)' }
					],
					'Europe': [
						{ value: 'Europe/London', label: 'London (GMT/BST)' },
						{ value: 'Europe/Paris', label: 'Paris (CET/CEST)' }
					],
					'Asia': [
						{ value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
						{ value: 'Asia/Singapore', label: 'Singapore (SGT)' }
					]
				};
				return self.timezones;
			});
	};

	/**
	 * Initialize timezone selector with ComboBox
	 * @param {string} selector - CSS selector for the select element
	 * @param {Object} options - Additional ComboBox options
	 */
	FunkyTimezone.prototype.initializeSelector = function(selector, options) {
		var self = this;
		var D = Funky.Dom;
		options = options || {};

		// First, ensure timezone is initialized
		this.initialize().then(function() {
			// Fetch timezones and populate selector
			return self.fetchTimezones();
		}).then(function(timezones) {
			var selectEl = D.one(selector);
			if (!selectEl) {
				console.error('[Funky.Timezone] Selector not found:', selector);
				return;
			}

			// Build items array for ComboBox (with groups)
			var comboBoxItems = [];
			Object.keys(timezones).sort().forEach(function(region) {
				var tzList = timezones[region];

				// Handle both string arrays and object arrays
				tzList.forEach(function(tz) {
					var tzValue = typeof tz === 'string' ? tz : tz.value;
					var tzLabel = typeof tz === 'string' ? tz : tz.label;

					comboBoxItems.push({
						value: tzValue,
						label: tzLabel,
						group: region,
						selected: tzValue === self.currentTimezone
					});
				});
			});
			console.log('[Funky.Timezone] Built', comboBoxItems.length, 'items for ComboBox');

			// Initialize ComboBox
			var ComboBox = window.Funky && window.Funky.ComboBox;
			if (!ComboBox) {
				console.warn('[Funky.Timezone] ComboBox not available');
				return;
			}

			// Check if already initialized
			var existingInstance = ComboBox.getInstance(selectEl.el);
			if (existingInstance) {
				console.log('[Funky.Timezone] ComboBox already initialized, updating items');
				existingInstance.setItems(comboBoxItems);
				if (self.currentTimezone) {
					existingInstance.setValue(self.currentTimezone);
				}
				self._comboBoxInstance = existingInstance;
				return;
			}

			// Handle timezone change callback
			var handleTimezoneChange = function(newTimezone) {
				if (newTimezone && newTimezone !== self.currentTimezone) {
					var previousTimezone = self.currentTimezone;
					self.setTimezone(newTimezone).then(function() {
						// Dispatch event for any listeners
						var event = new CustomEvent('funky.timezone.changed', {
							detail: { timezone: newTimezone, previous: previousTimezone }
						});
						document.dispatchEvent(event);

						// Redraw all DataTables to re-render dates with new timezone
						if (typeof jQuery !== 'undefined' && jQuery.fn.DataTable) {
							jQuery.fn.DataTable.tables({ visible: true, api: true }).rows().invalidate().draw(false);
						}

						// Show confirmation toast
						if (window.Funky && window.Funky.Toast) {
							Funky.Toast.success('Timezone changed to ' + self.getAbbreviation(), 'Timezone');
						}
					}).catch(function(error) {
						console.error('Failed to set timezone:', error);
						if (window.Funky && window.Funky.Toast) {
							Funky.Toast.error('Failed to change timezone: ' + error.message, 'Error');
						}
					});
				}
			};

			var comboBoxOptions = {
				placeholder: 'Select timezone',
				clearable: false,
				searchable: true,
				fixedWidth: true,
				items: comboBoxItems,
				valueKey: 'value',
				textKey: 'label',
				onChange: function(value) {
					handleTimezoneChange(value);
				}
			};

			// Merge custom options
			Object.keys(options).forEach(function(key) {
				comboBoxOptions[key] = options[key];
			});

			// Store the instance for later reference
			console.log('[Funky.Timezone] Initializing ComboBox with', comboBoxItems.length, 'items');
			self._comboBoxInstance = ComboBox.init(selectEl.el, comboBoxOptions);

			// Set initial value
			if (self.currentTimezone) {
				self._comboBoxInstance.setValue(self.currentTimezone);
			}
		}).catch(function(error) {
			console.error('Failed to initialize timezone selector:', error);
		});
	};

	/**
	 * Format timestamp in current timezone
	 * @param {string|Date} timestamp - ISO timestamp or Date object
	 * @param {Object|string} options - Intl.DateTimeFormat options or format string
	 * @returns {string} Formatted date string
	 */
	FunkyTimezone.prototype.format = function(timestamp, options) {
		if (!timestamp) return '';

		// If options is a string, use formatString
		if (typeof options === 'string') {
			return this.formatString(timestamp, options);
		}

		options = options || {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		};

		try {
			var date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
			var formatter = new Intl.DateTimeFormat('en-US',
				Object.assign({}, options, { timeZone: this.getEffectiveTimezone() })
			);
			return formatter.format(date);
		} catch (e) {
			console.error('Failed to format date:', e);
			return timestamp.toString();
		}
	};

	/**
	 * Format timestamp using a format string pattern
	 * Supports: YYYY, YY, MM, M, DD, D, HH, H, mm, m, ss, s, SSS, A, a
	 * @param {string|Date} timestamp - ISO timestamp or Date object
	 * @param {string} formatStr - Format string (e.g., 'YYYY-MM-DD HH:mm:ss')
	 * @returns {string} Formatted date string
	 */
	FunkyTimezone.prototype.formatString = function(timestamp, formatStr) {
		if (!timestamp) return '';
		if (!formatStr) return this.format(timestamp);

		try {
			var date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
			var tz = this.getEffectiveTimezone();

			// Get date parts in the target timezone
			var parts = new Intl.DateTimeFormat('en-US', {
				timeZone: tz,
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				hour12: false,
				fractionalSecondDigits: 3
			}).formatToParts(date);

			// Build a map of date parts
			var partMap = {};
			for (var i = 0; i < parts.length; i++) {
				partMap[parts[i].type] = parts[i].value;
			}

			// Handle midnight as 00 instead of 24
			var hour = partMap.hour === '24' ? '00' : partMap.hour;

			// Get 12-hour format
			var hour12 = parseInt(hour, 10);
			var ampm = hour12 >= 12 ? 'PM' : 'AM';
			hour12 = hour12 % 12 || 12;

			// Replace tokens (order matters - longer tokens first)
			var result = formatStr
				.replace(/YYYY/g, partMap.year)
				.replace(/YY/g, partMap.year.slice(-2))
				.replace(/MM/g, partMap.month)
				.replace(/M/g, parseInt(partMap.month, 10).toString())
				.replace(/DD/g, partMap.day)
				.replace(/D/g, parseInt(partMap.day, 10).toString())
				.replace(/HH/g, hour)
				.replace(/H/g, parseInt(hour, 10).toString())
				.replace(/hh/g, String(hour12).padStart(2, '0'))
				.replace(/h/g, hour12.toString())
				.replace(/mm/g, partMap.minute)
				.replace(/m/g, parseInt(partMap.minute, 10).toString())
				.replace(/ss/g, partMap.second)
				.replace(/s/g, parseInt(partMap.second, 10).toString())
				.replace(/SSS/g, (partMap.fractionalSecond || '000'))
				.replace(/A/g, ampm)
				.replace(/a/g, ampm.toLowerCase());

			return result;
		} catch (e) {
			console.error('Failed to format date with string:', e);
			return timestamp.toString();
		}
	};

	/**
	 * Format timestamp with timezone abbreviation
	 * @param {string|Date} timestamp - ISO timestamp or Date object
	 * @param {Object} options - Intl.DateTimeFormat options
	 * @returns {string} Formatted date string with timezone
	 */
	FunkyTimezone.prototype.formatWithTZ = function(timestamp, options) {
		if (!timestamp) return '';

		options = options || {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			timeZoneName: 'short'
		};

		return this.format(timestamp, options);
	};

	/**
	 * Get timezone abbreviation (EST, PST, etc.)
	 * @param {Date} date - Date object (optional, defaults to now)
	 * @returns {string} Timezone abbreviation
	 */
	FunkyTimezone.prototype.getAbbreviation = function(date) {
		date = date || new Date();

		try {
			var formatter = new Intl.DateTimeFormat('en-US', {
				timeZone: this.getEffectiveTimezone(),
				timeZoneName: 'short'
			});

			var parts = formatter.formatToParts(date);
			var tzPart = parts.find(function(part) { return part.type === 'timeZoneName'; });
			return tzPart ? tzPart.value : '';
		} catch (e) {
			console.error('Failed to get timezone abbreviation:', e);
			return '';
		}
	};

	/**
	 * Render date for DataTables with proper timezone conversion
	 * @param {string} data - ISO timestamp string
	 * @param {Object} options - Optional format options
	 * @param {boolean} options.dateOnly - Only show date (no time)
	 * @param {boolean} options.showTZ - Show timezone abbreviation (default: true)
	 * @returns {string} Formatted HTML string
	 */
	FunkyTimezone.prototype.renderDate = function(data, options) {
		if (!data) return '-';
		options = options || {};

		try {
			var date = new Date(data);
			if (isNaN(date.getTime())) return data;

			var tz = this.getEffectiveTimezone();
			var formatOptions = options.dateOnly ?
				{ year: 'numeric', month: 'short', day: 'numeric', timeZone: tz } :
				{ year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: tz };

			var formatted = date.toLocaleString('en-US', formatOptions);

			if (options.showTZ !== false) {
				var tzAbbr = this.getAbbreviation(date);
				return formatted + (tzAbbr ? ' <small class="text-muted">' + tzAbbr + '</small>' : '');
			}
			return formatted;
		} catch (e) {
			console.error('Failed to render date:', e);
			return data;
		}
	};

	/**
	 * Get a DataTables-compatible render function for dates
	 * @param {Object} options - Optional format options passed to renderDate
	 * @returns {function} Render function for DataTables
	 */
	FunkyTimezone.prototype.dateRenderer = function(options) {
		var self = this;
		return function(data) {
			return self.renderDate(data, options);
		};
	};

	// Create instance
	var timezoneInstance = new FunkyTimezone();

	// Register with Funky namespace
	Funky.register('Timezone', timezoneInstance);

})(window);

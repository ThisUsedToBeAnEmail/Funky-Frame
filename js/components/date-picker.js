/**
 * Funky.DatePicker - Native Date Picker Component
 *
 * A lightweight, accessible date picker supporting single date and date range selection.
 * Uses Funky.Date for all date operations.
 *
 * Usage:
 *   // Auto-initialize from data attributes
 *   Funky.DatePicker.init();
 *
 *   // Manual creation
 *   var picker = Funky.DatePicker.create('#myInput', {
 *     format: 'YYYY-MM-DD',
 *     minDate: '2024-01-01',
 *     maxDate: '2025-12-31'
 *   });
 *
 *   // Instance methods
 *   picker.open();
 *   picker.close();
 *   picker.getValue();
 *   picker.setValue(new Date());
 *   picker.destroy();
 *
 * Data attributes:
 *   data-funky-datepicker           - Initialize as date picker
 *   data-mode="range"               - Selection mode ('single' or 'range')
 *   data-format="YYYY-MM-DD"        - Display format
 *   data-min-date="2024-01-01"      - Minimum selectable date
 *   data-max-date="2025-12-31"      - Maximum selectable date
 *   data-week-starts="1"            - Week starts on (0=Sun, 1=Mon)
 *   data-show-week-numbers="true"   - Show week number column
 *   data-auto-apply="true"          - Apply selection immediately
 *   data-opens="left"               - Popup opens direction
 *   data-drops="up"                 - Popup drops direction
 *   data-separator=" - "            - Range separator for display
 *   data-show-ranges="true"         - Show preset ranges sidebar
 *   data-linked-calendars="true"    - Link dual calendars navigation
 *   data-time-picker="true"         - Enable time selection
 *   data-time-picker-24-hour="false"- Use 12-hour format with AM/PM
 *   data-time-picker-increment="15" - Minute increment
 *   data-time-picker-seconds="true" - Show seconds selector
 *
 * LiveBinding attributes:
 *   data-live-bind="cache:user.birthDate" - Bind to cache/api/websocket source
 *   data-live-path="profile.date"         - Path within source data
 *   data-live-twoway="true"               - Enable two-way binding
 *   data-live-bind-start="cache:filter.startDate" - Bind start date separately (range mode)
 *   data-live-bind-end="cache:filter.endDate"     - Bind end date separately (range mode)
 *   data-min-date-bind="cache:booking.checkinDate" - Bind min date constraint
 *   data-max-date-bind="cache:booking.maxDate"     - Bind max date constraint
 *   data-disabled-dates-bind="api:/unavailable"    - Bind disabled dates
 *
 * @version 1.0.2
 */
(function(window) {
	'use strict';

	// Ensure Funky registry exists
	if (!window.Funky || !window.Funky.register) {
		console.error('[Funky.DatePicker] Registry not found. Load namespace.js first.');
		return;
	}

	// Prevent double-registration
	if (Funky.isRegistered('DatePicker')) {
		return;
	}

	// Ensure Funky.Date is loaded
	if (!Funky.Date) {
		console.error('[Funky.DatePicker] Funky.Date not found. Load date.js first.');
		return;
	}

	// =========================================================================
	// SHORTCUTS & CONSTANTS
	// =========================================================================

	var D = Funky.Dom;
	var P = Funky.PubSub;
	var DateUtil = Funky.Date;
	var Keyboard = Funky.Keyboard;
	var Animate = Funky.Animate;

	// Instance registry (WeakMap for memory efficiency)
	var instances = new WeakMap();

	// Unique ID counter
	var idCounter = 0;

	// Focusable elements selector (for focus trap)
	var FOCUSABLE_SELECTORS = [
		'button:not([disabled])',
		'select:not([disabled])',
		'.combobox__trigger[tabindex="0"]',  // ComboBox triggers
		'[tabindex]:not([tabindex="-1"])'
	].join(', ');

	// Default configuration
	var DEFAULTS = {
		// Mode
		mode: 'single',              // 'single' | 'range'

		// Display
		format: 'YYYY-MM-DD',        // Display format pattern
		locale: 'en-US',             // Locale for day/month names
		weekStarts: 0,               // 0 = Sunday, 1 = Monday
		showWeekNumbers: false,      // Show week number column
		showDropdowns: true,         // Month/year dropdown selects
		numberOfMonths: 1,           // Number of months to show (auto 2 for range)
		size: 'default',             // 'default' | 'small' | 'compact' (compact = single calendar)
		autoSize: true,              // Auto-downgrade size for small viewports

		// Range mode specific
		separator: ' - ',            // Separator for range display
		linkedCalendars: true,       // Link dual calendar navigation
		ranges: true,                // Show preset ranges (true = default, object = custom, false = none)

		// Time picker
		timePicker: false,           // Enable time selection
		timePicker24Hour: true,      // Use 24-hour format (false = 12-hour with AM/PM)
		timePickerIncrement: 15,     // Minute increment (1, 5, 10, 15, 30)
		timePickerSeconds: false,    // Show seconds selector

		// Constraints
		minDate: null,               // Minimum selectable date
		maxDate: null,               // Maximum selectable date
		disabledDates: [],           // Array of disabled dates or function
		disabledDays: [],            // Days of week to disable [0-6]

		// Behavior
		autoApply: false,            // Apply immediately on selection
		closeOnSelect: true,         // Close picker on date selection
		container: null,             // Container for inline mode (null = popup)

		// Positioning
		opens: 'right',              // 'left' | 'right' | 'center'
		drops: 'down',               // 'up' | 'down' | 'auto'

		// Callbacks
		onOpen: null,
		onClose: null,
		onChange: null,
		onSelect: null,

		// LiveBinding
		liveBind: null,              // LiveBinding source specification
		livePath: null,              // Path within source data
		liveTwoway: false,           // Enable two-way binding
		liveBindStart: null,         // Separate start date binding (range mode)
		liveBindEnd: null,           // Separate end date binding (range mode)
		minDateBind: null,           // Bind min date to source
		maxDateBind: null,           // Bind max date to source
		disabledDatesBind: null      // Bind disabled dates to source
	};

	// CSS class names
	var CSS = {
		picker: 'funky-datepicker',
		open: 'funky-datepicker--open',
		inline: 'funky-datepicker--inline',
		range: 'funky-datepicker--range',
		noPresets: 'funky-datepicker--no-presets',
		// Size classes
		small: 'funky-datepicker--small',
		compact: 'funky-datepicker--compact',
		// Layout class (for non-compact range mode)
		layoutHorizontal: 'funky-datepicker--horizontal',
		header: 'funky-datepicker-header',
		prev: 'funky-datepicker-prev',
		next: 'funky-datepicker-next',
		title: 'funky-datepicker-title',
		monthSelect: 'funky-datepicker-month',
		yearSelect: 'funky-datepicker-year',
		calendar: 'funky-datepicker-calendar',
		weekNumber: 'funky-datepicker-weeknum',
		day: 'funky-datepicker-day',
		dayToday: 'funky-datepicker-day--today',
		daySelected: 'funky-datepicker-day--selected',
		dayDisabled: 'funky-datepicker-day--disabled',
		dayOtherMonth: 'funky-datepicker-day--other-month',
		dayWeekend: 'funky-datepicker-day--weekend',
		dayFocused: 'funky-datepicker-day--focused',
		// Range mode classes
		dayInRange: 'funky-datepicker-day--in-range',
		dayRangeStart: 'funky-datepicker-day--range-start',
		dayRangeEnd: 'funky-datepicker-day--range-end',
		dayHoverRange: 'funky-datepicker-day--hover-range',
		// Range mode layout
		rangeLayout: 'funky-datepicker-range-layout',
		presets: 'funky-datepicker-presets',
		preset: 'funky-datepicker-preset',
		presetActive: 'funky-datepicker-preset--active',
		calendars: 'funky-datepicker-calendars',
		panel: 'funky-datepicker-panel',
		panelLeft: 'funky-datepicker-panel--left',
		panelRight: 'funky-datepicker-panel--right',
		spacer: 'funky-datepicker-spacer',
		rangeDisplay: 'funky-datepicker-range-display',
		rangeStart: 'funky-datepicker-start',
		rangeEnd: 'funky-datepicker-end',
		rangeSeparator: 'funky-datepicker-separator',
		buttons: 'funky-datepicker-buttons',
		actions: 'funky-datepicker-actions',
		clearBtn: 'funky-datepicker-clear',
		cancelBtn: 'funky-datepicker-cancel',
		applyBtn: 'funky-datepicker-apply',
		// Time picker classes
		hasTime: 'funky-datepicker--time',
		time: 'funky-datepicker-time',
		timeGroup: 'funky-datepicker-time-group',
		timeLabel: 'funky-datepicker-time-label',
		timeSeparator: 'funky-datepicker-time-separator',
		hourSelect: 'funky-datepicker-hour',
		minuteSelect: 'funky-datepicker-minute',
		secondSelect: 'funky-datepicker-second',
		periodSelect: 'funky-datepicker-period',
		times: 'funky-datepicker-times',
		timeStart: 'funky-datepicker-time--start',
		timeEnd: 'funky-datepicker-time--end',
		// Presets select dropdown
		presetsDropdown: 'funky-datepicker-presets-dropdown',
		presetsSelect: 'funky-datepicker-presets-select'
	};

	// =========================================================================
	// HELPER FUNCTIONS
	// =========================================================================

	/**
	 * Get element from selector or element
	 * @param {string|HTMLElement} target
	 * @returns {HTMLElement|null}
	 */
	function getElement(target) {
		if (!target) return null;
		if (typeof target === 'string') {
			return document.querySelector(target);
		}
		return target.el || target;
	}

	/**
	 * Generate unique ID
	 * @returns {string}
	 */
	function generateId() {
		return 'funky-datepicker-' + (++idCounter);
	}

	/**
	 * Dispatch custom event on element
	 * @param {HTMLElement} element
	 * @param {string} eventName
	 * @param {Object} detail
	 * @returns {boolean} Whether event was not cancelled
	 */
	function dispatchEvent(element, eventName, detail) {
		var event = new CustomEvent(eventName, {
			bubbles: true,
			cancelable: true,
			detail: detail || {}
		});
		return element.dispatchEvent(event);
	}

	/**
	 * Parse date from various formats
	 * @param {Date|string|number|null} value
	 * @returns {Date|null}
	 */
	function parseDate(value) {
		if (!value) return null;
		return DateUtil.parse(value);
	}

	/**
	 * Set a nested value in an object using dot notation path
	 * @param {Object} obj - Target object
	 * @param {string} path - Dot notation path (e.g., "profile.birthDate")
	 * @param {*} value - Value to set
	 */
	function setNestedValue(obj, path, value) {
		if (!path) {
			return;
		}
		var parts = path.split('.');
		var current = obj;
		for (var i = 0; i < parts.length - 1; i++) {
			if (current[parts[i]] === undefined) {
				current[parts[i]] = {};
			}
			current = current[parts[i]];
		}
		current[parts[parts.length - 1]] = value;
	}

	/**
	 * Format date for display in input
	 * @param {Date|null} date
	 * @param {string} format
	 * @param {string} locale
	 * @param {Object} [timeInfo] - Optional time information
	 * @param {number} [timeInfo.hour] - Hour (0-23)
	 * @param {number} [timeInfo.minute] - Minute (0-59)
	 * @param {number} [timeInfo.second] - Second (0-59)
	 * @returns {string}
	 */
	function formatDateForDisplay(date, format, locale, timeInfo) {
		if (!date) return '';

		// Handle common format patterns
		var year = date.getFullYear();
		var month = date.getMonth() + 1;
		var day = date.getDate();

		// Pad with zeros
		var mm = month < 10 ? '0' + month : '' + month;
		var dd = day < 10 ? '0' + day : '' + day;

		// Replace date format tokens
		var result = format
			.replace(/YYYY/g, year)
			.replace(/YY/g, String(year).slice(-2))
			.replace(/MM/g, mm)
			.replace(/M/g, month)
			.replace(/DD/g, dd)
			.replace(/D/g, day);

		// Replace time format tokens if time info provided
		if (timeInfo) {
			var hour = timeInfo.hour || 0;
			var minute = timeInfo.minute || 0;
			var second = timeInfo.second || 0;

			// 24-hour format
			var HH = hour < 10 ? '0' + hour : '' + hour;
			var H = '' + hour;

			// 12-hour format
			var hour12 = hour % 12;
			if (hour12 === 0) hour12 = 12;
			var hh = hour12 < 10 ? '0' + hour12 : '' + hour12;
			var h = '' + hour12;

			// Minutes
			var minStr = minute < 10 ? '0' + minute : '' + minute;
			var m = '' + minute;

			// Seconds
			var ss = second < 10 ? '0' + second : '' + second;
			var s = '' + second;

			// AM/PM
			var A = hour < 12 ? 'AM' : 'PM';
			var a = hour < 12 ? 'am' : 'pm';

			// Replace time tokens (order matters - longer patterns first)
			result = result
				.replace(/HH/g, HH)
				.replace(/H/g, H)
				.replace(/hh/g, hh)
				.replace(/h/g, h)
				.replace(/mm/g, minStr)
				.replace(/m/g, m)
				.replace(/ss/g, ss)
				.replace(/s/g, s)
				.replace(/A/g, A)
				.replace(/a/g, a);
		}

		return result;
	}

	// =========================================================================
	// DATEPICKER CONSTRUCTOR
	// =========================================================================

	/**
	 * DatePicker Constructor
	 * @param {string|HTMLElement} target - Input element or selector
	 * @param {Object} options - Configuration options
	 */
	function DatePicker(target, options) {
		var element = getElement(target);
		if (!element) {
			console.error('[Funky.DatePicker] Element not found:', target);
			return;
		}

		// Check if already initialized
		if (instances.has(element)) {
			return instances.get(element);
		}

		this.el = element;
		this.id = element.id || generateId();
		this.options = Object.assign({}, DEFAULTS, options || {});
		this.pickerEl = null;
		this.isOpen = false;
		this.isInline = false;

		// State - Single mode
		this.selectedDate = null;
		this.viewDate = new Date();        // Currently viewed month (left calendar in range mode)
		this.focusedDate = null;           // Keyboard focused date
		this.originalValue = null;         // Value before opening (for cancel)

		// State - Range mode
		this.startDate = null;             // Range start date
		this.endDate = null;               // Range end date
		this.hoverDate = null;             // Hover date for range preview
		this.isSelectingEnd = false;       // True when selecting end date
		this.rightViewDate = null;         // Right calendar month (range mode)
		this.originalStartDate = null;     // Original start for cancel
		this.originalEndDate = null;       // Original end for cancel

		// State - Time picker (single mode)
		this.hour = 0;                     // Hour (0-23)
		this.minute = 0;                   // Minute (0-59)
		this.second = 0;                   // Second (0-59)
		this.originalHour = 0;             // Original hour for cancel
		this.originalMinute = 0;           // Original minute for cancel
		this.originalSecond = 0;           // Original second for cancel

		// State - Time picker (range mode)
		this.startHour = 0;                // Start hour
		this.startMinute = 0;              // Start minute
		this.startSecond = 0;              // Start second
		this.endHour = 23;                 // End hour (default to end of day)
		this.endMinute = 59;               // End minute
		this.endSecond = 59;               // End second
		this.originalStartHour = 0;
		this.originalStartMinute = 0;
		this.originalStartSecond = 0;
		this.originalEndHour = 23;
		this.originalEndMinute = 59;
		this.originalEndSecond = 59;

		// Bound handlers
		this._boundOnTriggerClick = this._onTriggerClick.bind(this);
		this._boundOnTriggerFocus = this._onTriggerFocus.bind(this);
		this._boundOnOutsideClick = this._onOutsideClick.bind(this);
		this._boundOnKeydown = this._onKeydown.bind(this);
		this._boundOnDayHover = this._onDayHover.bind(this);

		// ComboBox instances for month/year dropdowns
		this._monthComboBoxes = {};  // Keyed by 'single', 'left', 'right'
		this._yearComboBoxes = {};   // Keyed by 'single', 'left', 'right'
		this._initializingComboBoxes = false;
		this._isRendering = false;

		// Track internal clicks to prevent false outside-click detection
		// (needed because _render() may remove clicked elements from DOM before
		// the document click handler fires)
		this._handlingInternalClick = false;

		// FocusManager focus trap cleanup function
		this._focusTrapCleanup = null;

		// Store instance
		instances.set(element, this);

		// Initialize
		this._init();
	}

	// =========================================================================
	// PROTOTYPE METHODS
	// =========================================================================

	DatePicker.prototype = {
		/**
		 * Initialize the date picker
		 * @private
		 */
		_init: function() {
			// Read data attributes
			this._readDataAttributes();

			// Parse initial options
			this._parseOptions();

			// Parse initial value from input
			if (this.el.value) {
				this.selectedDate = parseDate(this.el.value);
				if (this.selectedDate) {
					this.viewDate = new Date(this.selectedDate);
				}
			}

			// Check for inline mode
			if (this.options.container) {
				this.isInline = true;
				this._createPicker();
				this._renderInline();
			} else {
				// Bind trigger events for popup mode
				this._bindTrigger();
			}

			// Set input as readonly to prevent manual typing
			if (!this.isInline) {
				this.el.setAttribute('readonly', 'readonly');
				this.el.setAttribute('autocomplete', 'off');
			}

			// Initialize LiveBinding if configured
			this._initLiveBinding();
		},

		/**
		 * Read options from data attributes
		 * @private
		 */
		_readDataAttributes: function() {
			var el = this.el;
			var opts = this.options;

			// Format
			var format = el.getAttribute('data-format');
			if (format) opts.format = format;

			// Locale
			var locale = el.getAttribute('data-locale');
			if (locale) opts.locale = locale;

			// Week starts
			var weekStarts = el.getAttribute('data-week-starts');
			if (weekStarts !== null) opts.weekStarts = parseInt(weekStarts, 10);

			// Min date
			var minDate = el.getAttribute('data-min-date');
			if (minDate) opts.minDate = minDate;

			// Max date
			var maxDate = el.getAttribute('data-max-date');
			if (maxDate) opts.maxDate = maxDate;

			// Show week numbers
			var showWeekNumbers = el.getAttribute('data-show-week-numbers');
			if (showWeekNumbers === 'true') opts.showWeekNumbers = true;

			// Show dropdowns
			var showDropdowns = el.getAttribute('data-show-dropdowns');
			if (showDropdowns === 'false') opts.showDropdowns = false;

			// Auto apply
			var autoApply = el.getAttribute('data-auto-apply');
			if (autoApply === 'true') opts.autoApply = true;

			// Opens direction
			var opens = el.getAttribute('data-opens');
			if (opens) opts.opens = opens;

			// Drops direction
			var drops = el.getAttribute('data-drops');
			if (drops) opts.drops = drops;

			// Container (inline mode)
			var container = el.getAttribute('data-container');
			if (container) opts.container = container;

			// Disabled days
			var disabledDays = el.getAttribute('data-disabled-days');
			if (disabledDays) {
				try {
					opts.disabledDays = JSON.parse(disabledDays);
				} catch (e) {
					console.warn('[Funky.DatePicker] Invalid data-disabled-days:', disabledDays);
				}
			}

			// Range mode attributes
			var mode = el.getAttribute('data-mode');
			if (mode) opts.mode = mode;

			var separator = el.getAttribute('data-separator');
			if (separator) opts.separator = separator;

			var showRanges = el.getAttribute('data-show-ranges');
			if (showRanges === 'true') opts.ranges = true;
			if (showRanges === 'false') opts.ranges = false;

			var linkedCalendars = el.getAttribute('data-linked-calendars');
			if (linkedCalendars === 'false') opts.linkedCalendars = false;

			// Time picker attributes
			var timePicker = el.getAttribute('data-time-picker');
			if (timePicker === 'true') opts.timePicker = true;
			if (timePicker === 'false') opts.timePicker = false;

			var timePicker24Hour = el.getAttribute('data-time-picker-24-hour');
			if (timePicker24Hour === 'true') opts.timePicker24Hour = true;
			if (timePicker24Hour === 'false') opts.timePicker24Hour = false;

			var timePickerIncrement = el.getAttribute('data-time-picker-increment');
			if (timePickerIncrement) opts.timePickerIncrement = parseInt(timePickerIncrement, 10);

			var timePickerSeconds = el.getAttribute('data-time-picker-seconds');
			if (timePickerSeconds === 'true') opts.timePickerSeconds = true;
			if (timePickerSeconds === 'false') opts.timePickerSeconds = false;

			// LiveBinding attributes
			var liveBind = el.getAttribute('data-live-bind');
			if (liveBind) opts.liveBind = liveBind;

			var livePath = el.getAttribute('data-live-path');
			if (livePath) opts.livePath = livePath;

			var liveTwoway = el.getAttribute('data-live-twoway');
			if (liveTwoway === 'true') opts.liveTwoway = true;

			var liveBindStart = el.getAttribute('data-live-bind-start');
			if (liveBindStart) opts.liveBindStart = liveBindStart;

			var liveBindEnd = el.getAttribute('data-live-bind-end');
			if (liveBindEnd) opts.liveBindEnd = liveBindEnd;

			var minDateBind = el.getAttribute('data-min-date-bind');
			if (minDateBind) opts.minDateBind = minDateBind;

			var maxDateBind = el.getAttribute('data-max-date-bind');
			if (maxDateBind) opts.maxDateBind = maxDateBind;

			var disabledDatesBind = el.getAttribute('data-disabled-dates-bind');
			if (disabledDatesBind) opts.disabledDatesBind = disabledDatesBind;
		},

		/**
		 * Parse and validate options
		 * @private
		 */
		_parseOptions: function() {
			var opts = this.options;

			// Parse date constraints
			if (opts.minDate) {
				opts.minDate = parseDate(opts.minDate);
			}
			if (opts.maxDate) {
				opts.maxDate = parseDate(opts.maxDate);
			}

			// Validate weekStarts
			if (opts.weekStarts < 0 || opts.weekStarts > 6) {
				opts.weekStarts = 0;
			}

			// Range mode: auto set numberOfMonths to 2
			if (opts.mode === 'range' && opts.numberOfMonths === 1) {
				opts.numberOfMonths = 2;
			}

			// Initialize right view date for range mode
			if (opts.mode === 'range') {
				this.rightViewDate = DateUtil.addMonths(this.viewDate, 1);
			}
		},

		/**
		 * Check if in range mode
		 * @private
		 * @returns {boolean}
		 */
		_isRangeMode: function() {
			return this.options.mode === 'range';
		},

		/**
		 * Check if time picker is enabled
		 * @private
		 * @returns {boolean}
		 */
		_hasTimePicker: function() {
			return this.options.timePicker === true;
		},

		/**
		 * Determine effective size based on options and viewport
		 * Auto-downgrades size if viewport is too small for requested size
		 * @private
		 * @returns {string} 'default', 'small', or 'compact'
		 */
		_determineSize: function() {
			var requestedSize = this.options.size || 'default';

			// If auto-size is disabled, use requested size directly
			if (this.options.autoSize === false) {
				return requestedSize;
			}

			var viewportWidth = window.innerWidth;

			// Auto-downgrade for range mode based on viewport
			if (this._isRangeMode()) {
				// Default range needs ~677px, small needs ~563px, compact needs ~280px
				if (viewportWidth < 400) {
					return 'compact';
				}
				if (viewportWidth < 580 && requestedSize === 'default') {
					return 'small';
				}
				if (viewportWidth < 480 && requestedSize !== 'compact') {
					return 'compact';
				}
			} else {
				// Single mode: default needs ~304px, small ~240px, compact ~208px
				if (viewportWidth < 280) {
					return 'compact';
				}
				if (viewportWidth < 320 && requestedSize === 'default') {
					return 'small';
				}
			}

			return requestedSize;
		},

		/**
		 * Determine effective layout based on size
		 * Layout is now derived from size:
		 * - default/small = horizontal (two calendars side-by-side)
		 * - compact = single calendar with presets as pills
		 * @private
		 * @returns {string} 'horizontal' or 'compact'
		 */
		_determineLayout: function() {
			var size = this._determineSize();

			// Single mode doesn't need layout classes
			if (!this._isRangeMode()) {
				return 'horizontal';
			}

			// Compact size = single calendar layout
			if (size === 'compact') {
				return 'compact';
			}

			// Default/small: horizontal (side-by-side calendars)
			return 'horizontal';
		},

		/**
		 * Update size classes based on current viewport
		 * @private
		 */
		_updateSizeClass: function() {
			if (!this.pickerEl) return;

			var size = this._determineSize();

			// Remove existing size classes
			this.pickerEl.classList.remove(CSS.small, CSS.compact);

			// Add appropriate size class
			if (size === 'small') {
				this.pickerEl.classList.add(CSS.small);
			} else if (size === 'compact') {
				this.pickerEl.classList.add(CSS.compact);
			}

			// For range mode, add horizontal class unless compact
			this.pickerEl.classList.remove(CSS.layoutHorizontal);
			if (this._isRangeMode() && size !== 'compact') {
				this.pickerEl.classList.add(CSS.layoutHorizontal);
			}

			// Store current effective size
			this._currentSize = size;
		},

		// =====================================================================
		// LIVEBINDING INTEGRATION
		// =====================================================================

		/**
		 * Initialize LiveBinding if configured
		 * @private
		 */
		_initLiveBinding: function() {
			var self = this;
			var opts = this.options;

			// Check if LiveBinding is available
			if (!Funky.LiveBinding) {
				return;
			}

			// Store binding references for cleanup
			this._liveBindings = [];

			// Main value binding
			if (opts.liveBind) {
				this._initValueBinding(opts.liveBind, opts.livePath, opts.liveTwoway);
			}

			// Separate start/end bindings for range mode
			if (opts.liveBindStart) {
				this._initStartBinding(opts.liveBindStart);
			}
			if (opts.liveBindEnd) {
				this._initEndBinding(opts.liveBindEnd);
			}

			// Constraint bindings
			if (opts.minDateBind) {
				this._initConstraintBinding(opts.minDateBind, 'minDate');
			}
			if (opts.maxDateBind) {
				this._initConstraintBinding(opts.maxDateBind, 'maxDate');
			}
			if (opts.disabledDatesBind) {
				this._initConstraintBinding(opts.disabledDatesBind, 'disabledDates');
			}
		},

		/**
		 * Initialize main value binding
		 * @private
		 */
		_initValueBinding: function(bindSpec, path, twoway) {
			var self = this;

			// Parse binding specification (format: "source:key" e.g. "cache:user.birthDate")
			var parts = bindSpec.split(':');
			var source = parts[0];
			var key = parts.slice(1).join(':');

			// Show loading state
			this._showBindingLoading();

			// Create binding via LiveBinding
			var binding = Funky.LiveBinding.bind(this.el, {
				source: source,
				entity: key,
				property: path,
				showLoading: false,
				render: function(data) {
					self._hideBindingLoading();
					self._onLiveBindingData(data);
				},
				onError: function(error) {
					self._hideBindingLoading();
					self._onLiveBindingError(error);
				}
			});

			if (binding) {
				this._liveBindings.push(binding);
			}

			// Set up two-way binding if enabled
			if (twoway) {
				this._setupTwowayBinding(source, key, path);
			}
		},

		/**
		 * Initialize start date binding (range mode)
		 * @private
		 */
		_initStartBinding: function(bindSpec) {
			var self = this;
			var parts = bindSpec.split(':');
			var source = parts[0];
			var key = parts.slice(1).join(':');

			var binding = Funky.LiveBinding.bind(this.el, {
				source: source,
				entity: key,
				showLoading: false,
				render: function(data) {
					if (data) {
						self.startDate = parseDate(data);
						if (self.startDate) {
							self.viewDate = new Date(self.startDate.getFullYear(), self.startDate.getMonth(), 1);
							self.rightViewDate = DateUtil.addMonths(self.viewDate, 1);
						}
						self._updateInput();
						if (self.isOpen || self.isInline) {
							self._render();
						}
					}
				}
			});

			if (binding) {
				this._liveBindings.push(binding);
			}
		},

		/**
		 * Initialize end date binding (range mode)
		 * @private
		 */
		_initEndBinding: function(bindSpec) {
			var self = this;
			var parts = bindSpec.split(':');
			var source = parts[0];
			var key = parts.slice(1).join(':');

			var binding = Funky.LiveBinding.bind(this.el, {
				source: source,
				entity: key,
				showLoading: false,
				render: function(data) {
					if (data) {
						self.endDate = parseDate(data);
						self._updateInput();
						if (self.isOpen || self.isInline) {
							self._render();
						}
					}
				}
			});

			if (binding) {
				this._liveBindings.push(binding);
			}
		},

		/**
		 * Initialize constraint binding (minDate, maxDate, disabledDates)
		 * @private
		 */
		_initConstraintBinding: function(bindSpec, constraintType) {
			var self = this;
			var parts = bindSpec.split(':');
			var source = parts[0];
			var key = parts.slice(1).join(':');

			var binding = Funky.LiveBinding.bind(this.el, {
				source: source,
				entity: key,
				showLoading: false,
				render: function(data) {
					if (constraintType === 'minDate') {
						self.options.minDate = data ? parseDate(data) : null;
					} else if (constraintType === 'maxDate') {
						self.options.maxDate = data ? parseDate(data) : null;
					} else if (constraintType === 'disabledDates') {
						self.options.disabledDates = Array.isArray(data) ? data.map(parseDate) : [];
					}

					// Re-render if open to reflect new constraints
					if (self.isOpen || self.isInline) {
						self._render();
					}
				}
			});

			if (binding) {
				this._liveBindings.push(binding);
			}
		},

		/**
		 * Set up two-way binding for automatic source updates
		 * @private
		 */
		_setupTwowayBinding: function(source, key, path) {
			var self = this;

			// Listen for changes and update source
			Funky.Events.on(this.el, 'funky.datepicker.change', function(e) {
				if (!Funky.Cache) return;

				var value = e.detail.value;

				// Handle range values
				if (self._isRangeMode() && value && typeof value === 'object') {
					if (path) {
						// Update nested path
						var current = Funky.Cache.get(key) || {};
						setNestedValue(current, path, value);
						Funky.Cache.set(key, current);
					} else {
						Funky.Cache.set(key, value);
					}
				} else {
					// Single date value
					if (path) {
						var current = Funky.Cache.get(key) || {};
						setNestedValue(current, path, value);
						Funky.Cache.set(key, current);
					} else {
						Funky.Cache.set(key, value);
					}
				}
			});
		},

		/**
		 * Handle data from LiveBinding
		 * @private
		 */
		_onLiveBindingData: function(data) {
			if (!data) {
				// Clear value if data is null/undefined
				if (this._isRangeMode()) {
					this.startDate = null;
					this.endDate = null;
				} else {
					this.selectedDate = null;
				}
				this._updateInput();
				return;
			}

			// Handle range mode data
			if (this._isRangeMode()) {
				if (typeof data === 'object' && (data.start !== undefined || data.end !== undefined)) {
					this.setRange(data.start, data.end);
				}
			} else {
				// Single date mode
				this.setValue(data);
			}
		},

		/**
		 * Handle LiveBinding error
		 * @private
		 */
		_onLiveBindingError: function(error) {
			console.error('[Funky.DatePicker] LiveBinding error:', error);
			this.el.classList.add('funky-datepicker-error');

			// Emit error event
			dispatchEvent(this.el, 'funky.datepicker.error', {
				error: error,
				instance: this
			});
		},

		/**
		 * Show loading state during LiveBinding fetch
		 * @private
		 */
		_showBindingLoading: function() {
			this.el.classList.add('funky-datepicker-loading');
			this.el.setAttribute('disabled', 'disabled');
		},

		/**
		 * Hide loading state after LiveBinding fetch
		 * @private
		 */
		_hideBindingLoading: function() {
			this.el.classList.remove('funky-datepicker-loading');
			this.el.removeAttribute('disabled');
		},

		/**
		 * Destroy LiveBinding connections
		 * @private
		 */
		_destroyLiveBindings: function() {
			if (this._liveBindings) {
				this._liveBindings.forEach(function(binding) {
					if (binding && binding.destroy) {
						binding.destroy();
					}
				});
				this._liveBindings = [];
			}
		},

		/**
		 * Destroy month/year ComboBox instances
		 * Must be called before re-render to prevent memory leaks
		 * @private
		 */
		_destroyComboBoxes: function() {
			var self = this;

			// Destroy month comboboxes
			Object.keys(this._monthComboBoxes).forEach(function(key) {
				if (self._monthComboBoxes[key] && self._monthComboBoxes[key].destroy) {
					self._monthComboBoxes[key].destroy();
				}
			});
			this._monthComboBoxes = {};

			// Destroy year comboboxes
			Object.keys(this._yearComboBoxes).forEach(function(key) {
				if (self._yearComboBoxes[key] && self._yearComboBoxes[key].destroy) {
					self._yearComboBoxes[key].destroy();
				}
			});
			this._yearComboBoxes = {};
		},

		/**
		 * Initialize month/year ComboBox components
		 * Must be called after DOM is rendered
		 * @private
		 */
		_initDropdownComboBoxes: function() {
			var self = this;
			var opts = this.options;
			var ComboBox = Funky.ComboBox;

			// Skip if ComboBox not available or dropdowns disabled
			if (!ComboBox || !opts.showDropdowns) return;

			// Set flag to prevent onChange from triggering re-render during setup
			this._initializingComboBoxes = true;

			try {

			// Build month items array (consistent for all month dropdowns)
			var monthNames = DateUtil.getMonthNames(opts.locale, 'long');
			var monthItems = monthNames.map(function(name, index) {
				return { id: index, name: name };
			});

			// Get year range
			var currentYear = new Date().getFullYear();
			var minYear = opts.minDate ? new Date(opts.minDate).getFullYear() : currentYear - 100;
			var maxYear = opts.maxDate ? new Date(opts.maxDate).getFullYear() : currentYear + 20;

			// Build year items array (descending order to match current behavior)
			var yearItems = [];
			for (var y = maxYear; y >= minYear; y--) {
				yearItems.push({ id: y, name: String(y) });
			}

			// Common ComboBox options
			var baseMonthOptions = {
				mode: 'single',
				searchable: false,
				clearable: false,
				placeholder: 'Month',
				items: monthItems,
				valueKey: 'id',
				textKey: 'name',
				dropdownParent: this.pickerEl,
				dropdownFitContent: true  // Dropdown fits content width, not trigger width
			};

			var baseYearOptions = {
				mode: 'single',
				searchable: true,  // Allow typing to find year
				clearable: false,
				placeholder: 'Year',
				items: yearItems,
				valueKey: 'id',
				textKey: 'name',
				dropdownParent: this.pickerEl,
				dropdownFitContent: true  // Dropdown fits content width, not trigger width
			};

			// Initialize based on mode
			if (this._isRangeMode()) {
				// Range mode: initialize left and right panels
				this._initPanelComboBoxes('left', baseMonthOptions, baseYearOptions);

				var size = this._determineSize();
				if (size !== 'compact') {
					this._initPanelComboBoxes('right', baseMonthOptions, baseYearOptions);
				}
			} else {
				// Single mode
				this._initSingleModeComboBoxes(baseMonthOptions, baseYearOptions);
			}

			} catch (e) {
				console.warn('[DatePicker] Failed to initialize ComboBoxes:', e);
			} finally {
				// Clear initialization flag
				this._initializingComboBoxes = false;
			}
		},

		/**
		 * Initialize ComboBoxes for single mode
		 * @private
		 */
		_initSingleModeComboBoxes: function(baseMonthOptions, baseYearOptions) {
			var self = this;
			var ComboBox = Funky.ComboBox;

			var monthSelect = this.pickerEl.querySelector('.' + CSS.monthSelect);
			var yearSelect = this.pickerEl.querySelector('.' + CSS.yearSelect);

			if (monthSelect) {
				var monthCombo = ComboBox.init(monthSelect, Object.assign({}, baseMonthOptions, {
					onChange: function(value) {
						// Skip if initializing or no value
						if (self._initializingComboBoxes) return;
						if (value !== null && value !== undefined) {
							// Mark as internal click to prevent outside-click detection during render
							self._handlingInternalClick = true;
							self._goToMonth(parseInt(value, 10), self.viewDate.getFullYear());
						}
					}
				}));
				if (monthCombo) {
					monthCombo.setValue(this.viewDate.getMonth(), { silent: true });
					this._monthComboBoxes['single'] = monthCombo;
				}
			}

			if (yearSelect) {
				var yearCombo = ComboBox.init(yearSelect, Object.assign({}, baseYearOptions, {
					onChange: function(value) {
						// Skip if initializing or no value
						if (self._initializingComboBoxes) return;
						if (value !== null && value !== undefined) {
							// Mark as internal click to prevent outside-click detection during render
							self._handlingInternalClick = true;
							self._goToMonth(self.viewDate.getMonth(), parseInt(value, 10));
						}
					}
				}));
				if (yearCombo) {
					yearCombo.setValue(this.viewDate.getFullYear(), { silent: true });
					this._yearComboBoxes['single'] = yearCombo;
				}
			}
		},

		/**
		 * Initialize ComboBoxes for a calendar panel (range mode)
		 * @private
		 * @param {string} side - 'left' or 'right'
		 */
		_initPanelComboBoxes: function(side, baseMonthOptions, baseYearOptions) {
			var self = this;
			var ComboBox = Funky.ComboBox;
			var viewDate = side === 'left' ? this.viewDate : this.rightViewDate;

			var monthSelect = this.pickerEl.querySelector('.' + CSS.monthSelect + '[data-side="' + side + '"]');
			var yearSelect = this.pickerEl.querySelector('.' + CSS.yearSelect + '[data-side="' + side + '"]');

			if (monthSelect) {
				var monthCombo = ComboBox.init(monthSelect, Object.assign({}, baseMonthOptions, {
					onChange: function(value) {
						// Skip if initializing or no value
						if (self._initializingComboBoxes) return;
						if (value !== null && value !== undefined) {
							// Mark as internal click to prevent outside-click detection during render
							self._handlingInternalClick = true;
							self._onMonthSelectChange(side, parseInt(value, 10));
						}
					}
				}));
				if (monthCombo) {
					monthCombo.setValue(viewDate.getMonth(), { silent: true });
					this._monthComboBoxes[side] = monthCombo;
				}
			}

			if (yearSelect) {
				var yearCombo = ComboBox.init(yearSelect, Object.assign({}, baseYearOptions, {
					onChange: function(value) {
						// Skip if initializing or no value
						if (self._initializingComboBoxes) return;
						if (value !== null && value !== undefined) {
							// Mark as internal click to prevent outside-click detection during render
							self._handlingInternalClick = true;
							self._onYearSelectChange(side, parseInt(value, 10));
						}
					}
				}));
				if (yearCombo) {
					yearCombo.setValue(viewDate.getFullYear(), { silent: true });
					this._yearComboBoxes[side] = yearCombo;
				}
			}
		},

		// =====================================================================
		// TRIGGER & EVENT HANDLERS
		// =====================================================================

		/**
		 * Bind trigger element events
		 * @private
		 */
		_bindTrigger: function() {
			this.el.addEventListener('click', this._boundOnTriggerClick);
			this.el.addEventListener('focus', this._boundOnTriggerFocus);
		},

		/**
		 * Unbind trigger element events
		 * @private
		 */
		_unbindTrigger: function() {
			this.el.removeEventListener('click', this._boundOnTriggerClick);
			this.el.removeEventListener('focus', this._boundOnTriggerFocus);
		},

		/**
		 * Handle trigger click
		 * @private
		 */
		_onTriggerClick: function(e) {
			e.preventDefault();
			this.toggle();
		},

		/**
		 * Handle trigger focus
		 * @private
		 */
		_onTriggerFocus: function() {
			// Optional: open on focus
			// this.open();
		},

		// =====================================================================
		// PICKER CREATION
		// =====================================================================

		/**
		 * Create picker DOM structure
		 * @private
		 */
		_createPicker: function() {
			var self = this;
			var opts = this.options;

			// Create main container
			this.pickerEl = document.createElement('div');
			this.pickerEl.className = CSS.picker;
			this.pickerEl.id = this.id + '-picker';
			this.pickerEl.setAttribute('role', 'dialog');
			this.pickerEl.setAttribute('aria-modal', 'true');
			this.pickerEl.setAttribute('aria-label', this._isRangeMode() ? 'Choose date range' : 'Choose date');

			// Set inline class if applicable
			if (this.isInline) {
				this.pickerEl.classList.add(CSS.inline);
			}

			// Set range class if applicable
			if (this._isRangeMode()) {
				this.pickerEl.classList.add(CSS.range);
				// Add no-presets class if ranges presets are disabled
				if (opts.ranges === false) {
					this.pickerEl.classList.add(CSS.noPresets);
				}
			}

			// Set time picker class if applicable
			if (this._hasTimePicker()) {
				this.pickerEl.classList.add(CSS.hasTime);
			}

			// Set size class (viewport-aware)
			this._updateSizeClass();

			// Render content
			this._render();
		},

		/**
		 * Render picker content
		 * @private
		 */
		_render: function() {
			if (!this.pickerEl) return;

			// Guard against re-render loop
			if (this._isRendering) return;
			this._isRendering = true;

			// Destroy existing ComboBox instances before re-render
			this._destroyComboBoxes();

			// Clear picker content
			D.wrap(this.pickerEl).empty();

			if (this._isRangeMode()) {
				// Range mode layout (returns fragment)
				this._renderRangeLayout().appendTo(this.pickerEl);
			} else {
				// Single mode layout
				// Header with navigation
				this._renderHeader().appendTo(this.pickerEl);

				// Calendar grid
				this._renderCalendar().appendTo(this.pickerEl);

				// Time picker (if enabled)
				if (this._hasTimePicker()) {
					this._renderTimePicker().appendTo(this.pickerEl);
				}

				// Actions (if not auto-apply)
				if (!this.options.autoApply && !this.isInline) {
					this._renderActions().appendTo(this.pickerEl);
				}
			}

			// Initialize ComboBox components (must happen after DOM is built)
			this._initDropdownComboBoxes();

			// Bind internal events
			this._bindEvents();

			// Clear render guard
			this._isRendering = false;
		},

		/**
		 * Render range mode layout with dual calendars
		 * Layout varies based on _determineLayout():
		 * - 'horizontal': Two calendars side-by-side with presets sidebar
		 * - compact: Single calendar with presets as horizontal pills
		 * - default/small: Two calendars side-by-side with presets sidebar
		 * @private
		 * @returns {ElementWrapper}
		 */
		_renderRangeLayout: function() {
			var opts = this.options;
			var size = this._determineSize();
			var isCompact = size === 'compact';

			// Container for range layout (allows .appendTo() chaining)
			var container = D.div().classAdd(CSS.rangeLayout);

			// Presets - always rendered as select dropdown
			if (opts.ranges !== false) {
				var presets = this._renderPresetsSelect();
				if (presets) container.child(presets);
			}

			// Calendars container
			var calendars = D.div().classAdd(CSS.calendars);

			// Left calendar panel (always shown)
			calendars.child(this._renderCalendarPanel('left', this.viewDate, isCompact));

			// Right calendar panel (only for non-compact)
			if (!isCompact) {
				calendars.child(this._renderCalendarPanel('right', this.rightViewDate, false));
			}

			container.child(calendars);

			// Time picker for range mode (if enabled)
			if (this._hasTimePicker()) {
				container.child(this._renderTimePickerForRange());
			}

			// Actions with range display
			if (!opts.autoApply && !this.isInline) {
				container.child(this._renderRangeActions());
			}

			return container;
		},

		/**
		 * Render presets as a select dropdown
		 * @private
		 * @returns {string}
		 */
		_renderPresetsSelect: function() {
			var self = this;
			var presets = this._getPresets();
			if (!presets || Object.keys(presets).length === 0) {
				return null;
			}

			var select = D.create('select')
				.classAdd(CSS.presetsSelect)
				.aria('label', 'Quick date range selection')
				.child(D.create('option').attr('value', '').text('Quick select...'));

			Object.keys(presets).forEach(function(label) {
				var isActive = self._isPresetActive(label, presets[label]);
				var option = D.create('option').attr('value', label).text(label);
				if (isActive) option.attr('selected', 'selected');
				select.child(option);
			});

			return D.div().classAdd(CSS.presetsDropdown).child(select);
		},

		/**
		 * Render a calendar panel (for range mode)
		 * @private
		 * @param {string} side - 'left' or 'right'
		 * @param {Date} viewDate - The month to display
		 * @param {boolean} isCompact - True if compact mode (single panel needs both nav buttons)
		 * @returns {string}
		 */
		_renderCalendarPanel: function(side, viewDate, isCompact) {
			var opts = this.options;
			var isLeft = side === 'left';
			var panelClass = isLeft ? CSS.panelLeft : CSS.panelRight;

			var panel = D.div().classAdd(CSS.panel, panelClass);
			var header = D.div().classAdd(CSS.header);

			// Previous button: always show on left panel
			if (isLeft) {
				header.child(
					D.button().attr('type', 'button').classAdd(CSS.prev).aria('label', 'Previous month')
						.child(D.icon('fas fa-chevron-left'))
				);
			} else {
				header.child(D.span().classAdd(CSS.spacer));
			}

			// Title area
			var title = D.div().classAdd(CSS.title);
			if (opts.showDropdowns) {
				title.child(
					this._renderMonthDropdownForDate(viewDate, side),
					this._renderYearDropdownForDate(viewDate, side)
				);
			} else {
				var monthName = DateUtil.format(viewDate, { month: 'long' }, opts.locale);
				var year = viewDate.getFullYear();
				title.child(D.span().classAdd('funky-datepicker-month-label').text(monthName + ' ' + year));
			}
			header.child(title);

			// Next button: show on right panel, or on single panel in compact mode
			if (isCompact && isLeft) {
				header.child(
					D.button().attr('type', 'button').classAdd(CSS.next).aria('label', 'Next month')
						.child(D.icon('fas fa-chevron-right'))
				);
			} else if (isLeft) {
				header.child(D.span().classAdd(CSS.spacer));
			} else {
				header.child(
					D.button().attr('type', 'button').classAdd(CSS.next).aria('label', 'Next month')
						.child(D.icon('fas fa-chevron-right'))
				);
			}

			panel.child(header);

			// Calendar grid
			panel.child(this._renderCalendarForDate(viewDate));

			return panel;
		},

		/**
		 * Render month dropdown for a specific date
		 * @private
		 * @param {Date} viewDate
		 * @param {string} side - 'left' or 'right'
		 * @returns {string}
		 */
		_renderMonthDropdownForDate: function(viewDate, side) {
			var opts = this.options;
			var currentMonth = viewDate.getMonth();
			var monthNames = DateUtil.getMonthNames(opts.locale, 'long');

			// If ComboBox is available, render a div placeholder
			if (Funky.ComboBox) {
				return D.div().classAdd(CSS.monthSelect).data('side', side).aria('label', 'Month');
			}

			// Fallback to native select
			var select = D.create('select').classAdd(CSS.monthSelect).data('side', side).aria('label', 'Month');

			for (var i = 0; i < 12; i++) {
				var option = D.create('option').attr('value', i).text(monthNames[i]);
				if (i === currentMonth) option.attr('selected', 'selected');
				select.child(option);
			}

			return select;
		},

		/**
		 * Render year dropdown for a specific date
		 * @private
		 * @param {Date} viewDate
		 * @param {string} side - 'left' or 'right'
		 * @returns {string}
		 */
		_renderYearDropdownForDate: function(viewDate, side) {
			var opts = this.options;
			var currentYear = viewDate.getFullYear();

			// If ComboBox is available, render a div placeholder
			if (Funky.ComboBox) {
				return D.div().classAdd(CSS.yearSelect).data('side', side).aria('label', 'Year');
			}

			// Fallback to native select
			var minYear = opts.minDate ? opts.minDate.getFullYear() : currentYear - 100;
			var maxYear = opts.maxDate ? opts.maxDate.getFullYear() : currentYear + 20;

			var select = D.create('select').classAdd(CSS.yearSelect).data('side', side).aria('label', 'Year');

			for (var y = maxYear; y >= minYear; y--) {
				var option = D.create('option').attr('value', y).text(y);
				if (y === currentYear) option.attr('selected', 'selected');
				select.child(option);
			}

			return select;
		},

		/**
		 * Render calendar grid for a specific date
		 * @private
		 * @param {Date} viewDate
		 * @returns {string}
		 */
		_renderCalendarForDate: function(viewDate) {
			var self = this;
			var opts = this.options;

			// Get day names
			var dayNames = DateUtil.getDayNames(opts.locale, 'short', opts.weekStarts);
			var fullDayNames = DateUtil.getDayNames(opts.locale, 'long', opts.weekStarts);

			// Generate month grid
			var grid = DateUtil.generateMonthGrid(viewDate, opts.weekStarts);

			var table = D.table().classAdd(CSS.calendar).attr('role', 'grid');

			// Header row (day names)
			var thead = D.create('thead');
			var headerRow = D.tr();
			if (opts.showWeekNumbers) {
				headerRow.child(D.th().classAdd(CSS.weekNumber));
			}
			for (var d = 0; d < 7; d++) {
				headerRow.child(
					D.th().attr('scope', 'col').attr('role', 'columnheader').attr('abbr', fullDayNames[d]).text(dayNames[d])
				);
			}
			thead.child(headerRow);
			table.child(thead);

			// Body rows (weeks)
			var tbody = D.create('tbody');
			grid.forEach(function(week) {
				var row = D.tr();

				if (opts.showWeekNumbers) {
					var weekNum = DateUtil.getWeekNumber(week[0].date);
					row.child(D.td().classAdd(CSS.weekNumber).text(weekNum));
				}

				week.forEach(function(dayInfo) {
					row.child(self._renderDay(dayInfo));
				});

				tbody.child(row);
			});
			table.child(tbody);

			return table;
		},

		/**
		 * Get preset ranges
		 * @private
		 * @returns {Object}
		 */
		_getPresets: function() {
			var opts = this.options;

			if (opts.ranges === false) {
				return null;
			}

			if (typeof opts.ranges === 'object') {
				return opts.ranges;
			}

			// Default presets
			var today = DateUtil.startOfDay(new Date());
			var yesterday = DateUtil.addDays(today, -1);
			var startOfMonth = DateUtil.startOfMonth(today);
			var endOfMonth = DateUtil.endOfMonth(today);
			var startOfLastMonth = DateUtil.startOfMonth(DateUtil.addMonths(today, -1));
			var endOfLastMonth = DateUtil.endOfMonth(DateUtil.addMonths(today, -1));

			return {
				'Today': [today, today],
				'Yesterday': [yesterday, yesterday],
				'Last 7 Days': [DateUtil.addDays(today, -6), today],
				'Last 30 Days': [DateUtil.addDays(today, -29), today],
				'This Month': [startOfMonth, endOfMonth],
				'Last Month': [startOfLastMonth, endOfLastMonth]
			};
		},

		/**
		 * Check if a preset is currently active
		 * @private
		 * @param {string} label
		 * @param {Array} range
		 * @returns {boolean}
		 */
		_isPresetActive: function(label, range) {
			if (!this.startDate || !this.endDate || !range) return false;

			var start = range[0];
			var end = range[1];

			return DateUtil.isSameDay(this.startDate, start) && DateUtil.isSameDay(this.endDate, end);
		},

		/**
		 * Render range mode actions with display
		 * @private
		 * @returns {string}
		 */
		_renderRangeActions: function() {
			var opts = this.options;
			var startStr = this.startDate ? formatDateForDisplay(this.startDate, opts.format, opts.locale) : 'Start Date';
			var endStr = this.endDate ? formatDateForDisplay(this.endDate, opts.format, opts.locale) : 'End Date';

			var actions = D.div().classAdd(CSS.actions);

			// Range display
			actions.child(
				D.div().classAdd(CSS.rangeDisplay).child(
					D.span().classAdd(CSS.rangeStart).text(startStr),
					D.span().classAdd(CSS.rangeSeparator).text(opts.separator),
					D.span().classAdd(CSS.rangeEnd).text(endStr)
				)
			);

			// Buttons
			actions.child(
				D.div().classAdd(CSS.buttons).child(
					D.button().attr('type', 'button').classAdd(CSS.clearBtn).text('Clear'),
					D.button().attr('type', 'button').classAdd(CSS.cancelBtn).text('Cancel'),
					D.button().attr('type', 'button').classAdd(CSS.applyBtn).text('Apply')
				)
			);

			return actions;
		},

		/**
		 * Render header with month/year navigation
		 * @private
		 * @returns {string}
		 */
		_renderHeader: function() {
			var opts = this.options;
			var viewDate = this.viewDate;

			var header = D.div().classAdd(CSS.header);

			// Previous button
			header.child(
				D.button().attr('type', 'button').classAdd(CSS.prev).aria('label', 'Previous month')
					.child(D.icon('fas fa-chevron-left'))
			);

			// Title area
			var title = D.div().classAdd(CSS.title);

			if (opts.showDropdowns) {
				// Month dropdown
				title.child(this._renderMonthDropdown());
				// Year dropdown
				title.child(this._renderYearDropdown());
			} else {
				// Static month/year display
				var monthName = DateUtil.format(viewDate, { month: 'long' }, opts.locale);
				var year = viewDate.getFullYear();
				title.child(D.span().classAdd('funky-datepicker-month-label').text(monthName + ' ' + year));
			}

			header.child(title);

			// Next button
			header.child(
				D.button().attr('type', 'button').classAdd(CSS.next).aria('label', 'Next month')
					.child(D.icon('fas fa-chevron-right'))
			);

			return header;
		},

		/**
		 * Render month dropdown
		 * @private
		 * @returns {string}
		 */
		_renderMonthDropdown: function() {
			var opts = this.options;
			var currentMonth = this.viewDate.getMonth();
			var monthNames = DateUtil.getMonthNames(opts.locale, 'long');

			// If ComboBox is available, render a div placeholder
			if (Funky.ComboBox) {
				return D.div().classAdd(CSS.monthSelect).aria('label', 'Month');
			}

			// Fallback to native select
			var select = D.create('select').classAdd(CSS.monthSelect).aria('label', 'Month');

			for (var i = 0; i < 12; i++) {
				var option = D.create('option').attr('value', i).text(monthNames[i]);
				if (i === currentMonth) option.attr('selected', 'selected');
				select.child(option);
			}

			return select;
		},

		/**
		 * Render year dropdown
		 * @private
		 * @returns {string}
		 */
		_renderYearDropdown: function() {
			var opts = this.options;
			var currentYear = this.viewDate.getFullYear();

			// If ComboBox is available, render a div placeholder
			if (Funky.ComboBox) {
				return D.div().classAdd(CSS.yearSelect).aria('label', 'Year');
			}

			// Fallback to native select
			// Determine year range
			var minYear = opts.minDate ? opts.minDate.getFullYear() : currentYear - 100;
			var maxYear = opts.maxDate ? opts.maxDate.getFullYear() : currentYear + 20;

			var select = D.create('select').classAdd(CSS.yearSelect).aria('label', 'Year');

			for (var y = maxYear; y >= minYear; y--) {
				var option = D.create('option').attr('value', y).text(y);
				if (y === currentYear) option.attr('selected', 'selected');
				select.child(option);
			}

			return select;
		},

		/**
		 * Render calendar grid
		 * @private
		 * @returns {string}
		 */
		_renderCalendar: function() {
			var self = this;
			var opts = this.options;
			var viewDate = this.viewDate;

			// Get day names
			var dayNames = DateUtil.getDayNames(opts.locale, 'short', opts.weekStarts);
			var fullDayNames = DateUtil.getDayNames(opts.locale, 'long', opts.weekStarts);

			// Generate month grid
			var grid = DateUtil.generateMonthGrid(viewDate, opts.weekStarts);

			var table = D.table().classAdd(CSS.calendar).attr('role', 'grid');

			// Header row (day names)
			var thead = D.create('thead');
			var headerRow = D.tr();
			if (opts.showWeekNumbers) {
				headerRow.child(D.th().classAdd(CSS.weekNumber));
			}
			for (var d = 0; d < 7; d++) {
				headerRow.child(
					D.th().attr('scope', 'col').attr('role', 'columnheader').attr('abbr', fullDayNames[d]).text(dayNames[d])
				);
			}
			thead.child(headerRow);
			table.child(thead);

			// Body rows (weeks)
			var tbody = D.create('tbody');
			grid.forEach(function(week) {
				var row = D.tr();

				if (opts.showWeekNumbers) {
					var weekNum = DateUtil.getWeekNumber(week[0].date);
					row.child(D.td().classAdd(CSS.weekNumber).text(weekNum));
				}

				week.forEach(function(dayInfo) {
					row.child(self._renderDay(dayInfo));
				});

				tbody.child(row);
			});
			table.child(tbody);

			return table;
		},

		/**
		 * Render single day cell
		 * @private
		 * @param {Object} dayInfo - Day info from generateMonthGrid
		 * @returns {string}
		 */
		_renderDay: function(dayInfo) {
			var opts = this.options;
			var date = dayInfo.date;
			var dateStr = DateUtil.toDateString(date);
			var isRangeMode = this._isRangeMode();

			var td = D.td().classAdd(CSS.day);

			if (dayInfo.isToday) td.classAdd(CSS.dayToday);
			if (dayInfo.isWeekend) td.classAdd(CSS.dayWeekend);
			if (!dayInfo.isCurrentMonth) td.classAdd(CSS.dayOtherMonth);

			// Check if selected (single mode)
			if (!isRangeMode && this.selectedDate && DateUtil.isSameDay(date, this.selectedDate)) {
				td.classAdd(CSS.daySelected);
			}

			// Range mode classes
			if (isRangeMode) {
				var isRangeStart = this._isRangeStart(date);
				var isRangeEnd = this._isRangeEnd(date);
				var isInRange = this._isInSelectedRange(date);
				var isInHoverRange = this._isInHoverRange(date);

				if (isRangeStart) {
					td.classAdd(CSS.dayRangeStart, CSS.daySelected);
				}
				if (isRangeEnd) {
					td.classAdd(CSS.dayRangeEnd, CSS.daySelected);
				}
				if (isInRange && !isRangeStart && !isRangeEnd) {
					td.classAdd(CSS.dayInRange);
				}
				if (isInHoverRange) {
					td.classAdd(CSS.dayHoverRange);
				}
			}

			// Check if focused
			if (this.focusedDate && DateUtil.isSameDay(date, this.focusedDate)) {
				td.classAdd(CSS.dayFocused);
			}

			// Check if disabled
			var isDisabled = this._isDateDisabled(date);
			if (isDisabled) {
				td.classAdd(CSS.dayDisabled);
			}

			// Set attributes
			td.attr('role', 'gridcell')
			  .data('date', dateStr)
			  .aria('label', DateUtil.format(date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }, opts.locale));

			// Add aria-current for today
			if (dayInfo.isToday) {
				td.aria('current', 'date');
			}

			// Aria-selected for range mode
			if (isRangeMode) {
				var isSelected = this._isRangeStart(date) || this._isRangeEnd(date);
				td.aria('selected', isSelected ? 'true' : 'false');
			} else if (this.selectedDate && DateUtil.isSameDay(date, this.selectedDate)) {
				td.aria('selected', 'true');
			} else {
				td.aria('selected', 'false');
			}

			if (isDisabled) {
				td.aria('disabled', 'true').attr('tabindex', '-1');
			} else {
				// Only focusable days get tabindex
				var isFocused = this.focusedDate && DateUtil.isSameDay(date, this.focusedDate);
				var isSelectedDay = isRangeMode
					? (this._isRangeStart(date) || this._isRangeEnd(date))
					: (this.selectedDate && DateUtil.isSameDay(date, this.selectedDate));
				var tabIndex = (isFocused || (!this.focusedDate && isSelectedDay)) ? '0' : '-1';
				td.attr('tabindex', tabIndex);
			}

			td.child(D.span().text(date.getDate()));

			return td;
		},

		// =====================================================================
		// TIME PICKER RENDERING
		// =====================================================================

		/**
		 * Render time picker for single mode
		 * @private
		 * @returns {Funky.Dom}
		 */
		_renderTimePicker: function() {
			var opts = this.options;

			var timeGroup = D.div().classAdd(CSS.timeGroup).child(
				D.create('label').classAdd(CSS.timeLabel).text('Time'),
				this._renderHourSelect(this.hour),
				D.span().classAdd(CSS.timeSeparator).text(':'),
				this._renderMinuteSelect(this.minute)
			);

			// Seconds (if enabled)
			if (opts.timePickerSeconds) {
				timeGroup.child(
					D.span().classAdd(CSS.timeSeparator).text(':'),
					this._renderSecondSelect(this.second)
				);
			}

			// AM/PM (if 12-hour mode)
			if (!opts.timePicker24Hour) {
				timeGroup.child(this._renderPeriodSelect(this.hour));
			}

			return D.div().classAdd(CSS.time).child(timeGroup);
		},

		/**
		 * Render time pickers for range mode
		 * @private
		 * @returns {Funky.Dom}
		 */
		_renderTimePickerForRange: function() {
			var opts = this.options;

			// Start time group
			var startGroup = D.div().classAdd(CSS.timeGroup).child(
				D.create('label').classAdd(CSS.timeLabel).text('Start Time'),
				this._renderHourSelect(this.startHour, 'start'),
				D.span().classAdd(CSS.timeSeparator).text(':'),
				this._renderMinuteSelect(this.startMinute, 'start')
			);

			if (opts.timePickerSeconds) {
				startGroup.child(
					D.span().classAdd(CSS.timeSeparator).text(':'),
					this._renderSecondSelect(this.startSecond, 'start')
				);
			}
			if (!opts.timePicker24Hour) {
				startGroup.child(this._renderPeriodSelect(this.startHour, 'start'));
			}

			// End time group
			var endGroup = D.div().classAdd(CSS.timeGroup).child(
				D.create('label').classAdd(CSS.timeLabel).text('End Time'),
				this._renderHourSelect(this.endHour, 'end'),
				D.span().classAdd(CSS.timeSeparator).text(':'),
				this._renderMinuteSelect(this.endMinute, 'end')
			);

			if (opts.timePickerSeconds) {
				endGroup.child(
					D.span().classAdd(CSS.timeSeparator).text(':'),
					this._renderSecondSelect(this.endSecond, 'end')
				);
			}
			if (!opts.timePicker24Hour) {
				endGroup.child(this._renderPeriodSelect(this.endHour, 'end'));
			}

			return D.div().classAdd(CSS.times).child(
				D.div().classAdd(CSS.time, CSS.timeStart).child(startGroup),
				D.div().classAdd(CSS.time, CSS.timeEnd).child(endGroup)
			);
		},

		/**
		 * Render hour select dropdown
		 * @private
		 * @param {number} selectedHour - Currently selected hour (0-23)
		 * @param {string} [side] - 'start' or 'end' for range mode
		 * @returns {Funky.Dom}
		 */
		_renderHourSelect: function(selectedHour, side) {
			var opts = this.options;
			var is24Hour = opts.timePicker24Hour;

			var select = D.create('select')
				.classAdd(CSS.hourSelect)
				.aria('label', 'Hour');

			if (side) {
				select.data('side', side);
			}

			if (is24Hour) {
				// 24-hour format: 0-23
				for (var h = 0; h < 24; h++) {
					var padded = h < 10 ? '0' + h : '' + h;
					var option = D.create('option').attr('value', h).text(padded);
					if (h === selectedHour) option.attr('selected', 'selected');
					select.child(option);
				}
			} else {
				// 12-hour format: 12, 1-11 (for AM/PM display)
				var displayHour = selectedHour % 12;
				if (displayHour === 0) displayHour = 12;

				// Start with 12, then 1-11
				for (var i = 0; i < 12; i++) {
					var hourVal = i === 0 ? 12 : i;
					var padded12 = hourVal < 10 ? '0' + hourVal : '' + hourVal;
					var option = D.create('option').attr('value', hourVal).text(padded12);
					if (hourVal === displayHour) option.attr('selected', 'selected');
					select.child(option);
				}
			}

			return select;
		},

		/**
		 * Render minute select dropdown
		 * @private
		 * @param {number} selectedMinute - Currently selected minute (0-59)
		 * @param {string} [side] - 'start' or 'end' for range mode
		 * @returns {Funky.Dom}
		 */
		_renderMinuteSelect: function(selectedMinute, side) {
			var opts = this.options;
			var increment = opts.timePickerIncrement || 15;

			var select = D.create('select')
				.classAdd(CSS.minuteSelect)
				.aria('label', 'Minute');

			if (side) {
				select.data('side', side);
			}

			for (var m = 0; m < 60; m += increment) {
				var padded = m < 10 ? '0' + m : '' + m;
				// Select the closest minute that's <= selectedMinute
				var isSelected = (m <= selectedMinute && (m + increment) > selectedMinute);
				// If no increment matches, select 0
				if (selectedMinute < increment && m === 0) isSelected = true;

				var option = D.create('option').attr('value', m).text(padded);
				if (isSelected) option.attr('selected', 'selected');
				select.child(option);
			}

			return select;
		},

		/**
		 * Render second select dropdown
		 * @private
		 * @param {number} selectedSecond - Currently selected second (0-59)
		 * @param {string} [side] - 'start' or 'end' for range mode
		 * @returns {Funky.Dom}
		 */
		_renderSecondSelect: function(selectedSecond, side) {
			var select = D.create('select')
				.classAdd(CSS.secondSelect)
				.aria('label', 'Second');

			if (side) {
				select.data('side', side);
			}

			for (var s = 0; s < 60; s++) {
				var padded = s < 10 ? '0' + s : '' + s;
				var option = D.create('option').attr('value', s).text(padded);
				if (s === selectedSecond) option.attr('selected', 'selected');
				select.child(option);
			}

			return select;
		},

		/**
		 * Render AM/PM period select dropdown
		 * @private
		 * @param {number} hour - Current hour in 24-hour format (0-23)
		 * @param {string} [side] - 'start' or 'end' for range mode
		 * @returns {Funky.Dom}
		 */
		_renderPeriodSelect: function(hour, side) {
			var isAM = hour < 12;

			var select = D.create('select')
				.classAdd(CSS.periodSelect)
				.aria('label', 'AM/PM');

			if (side) {
				select.data('side', side);
			}

			var amOption = D.create('option').attr('value', 'AM').text('AM');
			var pmOption = D.create('option').attr('value', 'PM').text('PM');

			if (isAM) {
				amOption.attr('selected', 'selected');
			} else {
				pmOption.attr('selected', 'selected');
			}

			select.child(amOption, pmOption);

			return select;
		},

		/**
		 * Render action buttons
		 * @private
		 * @returns {Funky.Dom}
		 */
		_renderActions: function() {
			return D.div().classAdd(CSS.actions).child(
				D.button().attr('type', 'button').classAdd(CSS.clearBtn).text('Clear'),
				D.button().attr('type', 'button').classAdd(CSS.cancelBtn).text('Cancel'),
				D.button().attr('type', 'button').classAdd(CSS.applyBtn).text('Apply')
			);
		},

		/**
		 * Render inline into container
		 * @private
		 */
		_renderInline: function() {
			var container = getElement(this.options.container);
			if (container && this.pickerEl) {
				container.appendChild(this.pickerEl);
				this.pickerEl.classList.add(CSS.open);
			}
		},

		// =====================================================================
		// EVENT BINDING
		// =====================================================================

		/**
		 * Bind internal picker events
		 * @private
		 */
		_bindEvents: function() {
			if (!this.pickerEl) return;

			var self = this;
			var isRangeMode = this._isRangeMode();

			// Navigation buttons
			var prevBtn = this.pickerEl.querySelector('.' + CSS.prev);
			var nextBtn = this.pickerEl.querySelector('.' + CSS.next);

			if (prevBtn) {
				prevBtn.addEventListener('click', function(e) {
					e.preventDefault();
					self._handlingInternalClick = true;
					self._goToPrevMonth();
				});
			}

			if (nextBtn) {
				nextBtn.addEventListener('click', function(e) {
					e.preventDefault();
					self._handlingInternalClick = true;
					self._goToNextMonth();
				});
			}

			// Month/year dropdowns - only bind native selects if ComboBox is not available
			// When ComboBox is available, events are handled via onChange callbacks in _initDropdownComboBoxes
			if (!Funky.ComboBox) {
				if (isRangeMode) {
					// Range mode: bind all dropdowns with side attribute
					var monthSelects = this.pickerEl.querySelectorAll('.' + CSS.monthSelect);
					var yearSelects = this.pickerEl.querySelectorAll('.' + CSS.yearSelect);

					monthSelects.forEach(function(select) {
						select.addEventListener('change', function() {
							var side = this.getAttribute('data-side');
							self._onMonthSelectChange(side, parseInt(this.value, 10));
						});
					});

					yearSelects.forEach(function(select) {
						select.addEventListener('change', function() {
							var side = this.getAttribute('data-side');
							self._onYearSelectChange(side, parseInt(this.value, 10));
						});
					});
				} else {
					// Single mode: simple dropdown handling
					var monthSelect = this.pickerEl.querySelector('.' + CSS.monthSelect);
					var yearSelect = this.pickerEl.querySelector('.' + CSS.yearSelect);

					if (monthSelect) {
						monthSelect.addEventListener('change', function() {
							self._goToMonth(parseInt(this.value, 10), self.viewDate.getFullYear());
						});
					}

					if (yearSelect) {
						yearSelect.addEventListener('change', function() {
							self._goToMonth(self.viewDate.getMonth(), parseInt(this.value, 10));
						});
					}
				}
			}

			// Day clicks (use event delegation) - handle all calendars
			var calendars = this.pickerEl.querySelectorAll('.' + CSS.calendar);
			calendars.forEach(function(calendar) {
				calendar.addEventListener('click', function(e) {
					var dayCell = e.target.closest('.' + CSS.day);
					if (dayCell && !dayCell.classList.contains(CSS.dayDisabled)) {
						// Mark that we're handling an internal click before _render()
						// removes the clicked element from DOM
						self._handlingInternalClick = true;
						self._onDayClick(dayCell);
					}
				});

				// Range mode: hover for preview
				if (isRangeMode) {
					calendar.addEventListener('mouseover', self._boundOnDayHover);
					calendar.addEventListener('mouseleave', function() {
						self._onCalendarMouseLeave();
					});
				}
			});

			// Preset select dropdown (range mode)
			if (isRangeMode) {
				var presetSelect = this.pickerEl.querySelector('.' + CSS.presetsSelect);
				if (presetSelect) {
					presetSelect.addEventListener('change', function() {
						var presetLabel = this.value;
						if (presetLabel) {
							self._handlingInternalClick = true;
							self._onPresetClick(presetLabel);
						}
					});
				}
			}

			// Gesture support for touch navigation and drag-to-select
			// Destroy existing tracker before creating new one (prevents duplicates on re-render)
			if (this._gestureTracker) {
				this._gestureTracker.destroy();
				this._gestureTracker = null;
			}

			if (Funky.GestureTracker) {
				var gestureOptions = {
					target: this.pickerEl,
					gestures: ['swipe', 'tap'],
					swipeThreshold: 40,
					tapThreshold: 15, // More forgiving for mobile touch
					onSwipe: function(data) {
						if (data.direction === 'left') {
							self._goToNextMonth();
						} else if (data.direction === 'right') {
							self._goToPrevMonth();
						}
					},
					onTap: function(data) {
						// Handle tap on day cells for mobile
						var element = document.elementFromPoint(data.x, data.y);
						var dayCell = element && element.closest('.' + CSS.day);
						if (dayCell && !dayCell.classList.contains(CSS.dayDisabled)) {
							self._handlingInternalClick = true;
							self._onDayClick(dayCell);
						}
					}
				};

				// Add drag support for range mode
				if (isRangeMode) {
					gestureOptions.gestures.push('drag');

					// Track whether we're extending start or end
					var dragMode = null; // 'new', 'extend-start', 'extend-end'

					gestureOptions.onDragStart = function(data) {
						var dayCell = document.elementFromPoint(data.x, data.y);
						dayCell = dayCell && dayCell.closest('.' + CSS.day);
						if (dayCell && !dayCell.classList.contains(CSS.dayDisabled)) {
							var dateStr = dayCell.getAttribute('data-date');
							var date = parseDate(dateStr);
							if (date) {
								date = DateUtil.startOfDay(date);
								self._handlingInternalClick = true;

								// If we have an existing range, check if we're extending
								if (self.startDate && self.endDate) {
									// Clicking on or before start extends start
									if (DateUtil.isSameDay(date, self.startDate) || DateUtil.isBefore(date, self.startDate)) {
										dragMode = 'extend-start';
										self.startDate = date;
									}
									// Clicking on or after end extends end
									else if (DateUtil.isSameDay(date, self.endDate) || DateUtil.isAfter(date, self.endDate)) {
										dragMode = 'extend-end';
										self.endDate = date;
									}
									// Clicking inside range starts new selection
									else {
										dragMode = 'new';
										self.startDate = date;
										self.endDate = null;
										self.isSelectingEnd = true;
									}
								} else {
									// No existing range, start new selection
									dragMode = 'new';
									self.startDate = date;
									self.endDate = null;
									self.isSelectingEnd = true;
								}
								self._render();
							}
						}
					};
					gestureOptions.onDragMove = function(data) {
						if (!dragMode) return;
						var dayCell = document.elementFromPoint(data.x, data.y);
						dayCell = dayCell && dayCell.closest('.' + CSS.day);
						if (dayCell && !dayCell.classList.contains(CSS.dayDisabled)) {
							var dateStr = dayCell.getAttribute('data-date');
							var date = parseDate(dateStr);
							if (date) {
								date = DateUtil.startOfDay(date);
								self._handlingInternalClick = true;

								if (dragMode === 'extend-start') {
									// Moving start - swap if past end
									if (self.endDate && DateUtil.isAfter(date, self.endDate)) {
										self.startDate = self.endDate;
										self.endDate = date;
										dragMode = 'extend-end';
									} else {
										self.startDate = date;
									}
								} else if (dragMode === 'extend-end') {
									// Moving end - swap if before start
									if (self.startDate && DateUtil.isBefore(date, self.startDate)) {
										self.endDate = self.startDate;
										self.startDate = date;
										dragMode = 'extend-start';
									} else {
										self.endDate = date;
									}
								} else {
									// New selection - show hover preview
									self.hoverDate = date;
								}
								self._render();
							}
						}
					};
					gestureOptions.onDragEnd = function(data) {
						if (!dragMode) return;
						self._handlingInternalClick = true;
						var dayCell = document.elementFromPoint(data.x, data.y);
						dayCell = dayCell && dayCell.closest('.' + CSS.day);
						if (dayCell && !dayCell.classList.contains(CSS.dayDisabled)) {
							var dateStr = dayCell.getAttribute('data-date');
							var date = parseDate(dateStr);
							if (date) {
								date = DateUtil.startOfDay(date);

								if (dragMode === 'new') {
									self._selectRangeDate(date);
								} else {
									// Extending - finalize the range
									if (dragMode === 'extend-start') {
										self.startDate = date;
									} else {
										self.endDate = date;
									}
									// Ensure proper order
									if (self.startDate && self.endDate && DateUtil.isAfter(self.startDate, self.endDate)) {
										var tmp = self.startDate;
										self.startDate = self.endDate;
										self.endDate = tmp;
									}
									self.isSelectingEnd = false;
									self.hoverDate = null;

									// Emit events and apply
									dispatchEvent(self.el, 'funky.datepicker.select', {
										start: self.startDate,
										end: self.endDate,
										instance: self
									});

									if (self.options.autoApply) {
										self._applySelection();
										if (!self.isInline) {
											self.close();
										}
									} else {
										self._render();
									}
								}
							}
						}
						dragMode = null;
					};
				}

				this._gestureTracker = Funky.GestureTracker.create(gestureOptions);
			}

			// Action buttons
			var clearBtn = this.pickerEl.querySelector('.' + CSS.clearBtn);
			var cancelBtn = this.pickerEl.querySelector('.' + CSS.cancelBtn);
			var applyBtn = this.pickerEl.querySelector('.' + CSS.applyBtn);

			if (clearBtn) {
				clearBtn.addEventListener('click', function(e) {
					e.preventDefault();
					self._onClearClick();
				});
			}

			if (cancelBtn) {
				cancelBtn.addEventListener('click', function(e) {
					e.preventDefault();
					self._onCancelClick();
				});
			}

			if (applyBtn) {
				applyBtn.addEventListener('click', function(e) {
					e.preventDefault();
					self._onApplyClick();
				});
			}

			// Time picker events (if enabled)
			if (this._hasTimePicker()) {
				this._bindTimeEvents();
			}
		},

		/**
		 * Bind time picker events
		 * @private
		 */
		_bindTimeEvents: function() {
			if (!this.pickerEl) return;

			var self = this;
			var isRangeMode = this._isRangeMode();

			// Hour selects
			var hourSelects = this.pickerEl.querySelectorAll('.' + CSS.hourSelect);
			hourSelects.forEach(function(select) {
				select.addEventListener('change', function() {
					var side = this.getAttribute('data-side');
					self._onHourChange(parseInt(this.value, 10), side);
				});
			});

			// Minute selects
			var minuteSelects = this.pickerEl.querySelectorAll('.' + CSS.minuteSelect);
			minuteSelects.forEach(function(select) {
				select.addEventListener('change', function() {
					var side = this.getAttribute('data-side');
					self._onMinuteChange(parseInt(this.value, 10), side);
				});
			});

			// Second selects (if enabled)
			if (this.options.timePickerSeconds) {
				var secondSelects = this.pickerEl.querySelectorAll('.' + CSS.secondSelect);
				secondSelects.forEach(function(select) {
					select.addEventListener('change', function() {
						var side = this.getAttribute('data-side');
						self._onSecondChange(parseInt(this.value, 10), side);
					});
				});
			}

			// Period selects (AM/PM - if 12-hour mode)
			if (!this.options.timePicker24Hour) {
				var periodSelects = this.pickerEl.querySelectorAll('.' + CSS.periodSelect);
				periodSelects.forEach(function(select) {
					select.addEventListener('change', function() {
						var side = this.getAttribute('data-side');
						self._onPeriodChange(this.value, side);
					});
				});
			}
		},

		/**
		 * Handle hour change
		 * @private
		 * @param {number} hour - Hour value (0-23 for 24-hour, 1-12 for 12-hour)
		 * @param {string} [side] - 'start' or 'end' for range mode
		 */
		_onHourChange: function(hour, side) {
			var opts = this.options;

			if (this._isRangeMode()) {
				if (side === 'start') {
					if (opts.timePicker24Hour) {
						this.startHour = hour;
					} else {
						// For 12-hour mode, convert using current period
						var period = this._getCurrentPeriod('start');
						this.startHour = this._convertTo24Hour(hour, period);
					}
				} else if (side === 'end') {
					if (opts.timePicker24Hour) {
						this.endHour = hour;
					} else {
						var period = this._getCurrentPeriod('end');
						this.endHour = this._convertTo24Hour(hour, period);
					}
				}
			} else {
				if (opts.timePicker24Hour) {
					this.hour = hour;
				} else {
					var period = this._getCurrentPeriod();
					this.hour = this._convertTo24Hour(hour, period);
				}
			}

			this._onTimeChange();
		},

		/**
		 * Handle minute change
		 * @private
		 * @param {number} minute - Minute value (0-59)
		 * @param {string} [side] - 'start' or 'end' for range mode
		 */
		_onMinuteChange: function(minute, side) {
			if (this._isRangeMode()) {
				if (side === 'start') {
					this.startMinute = minute;
				} else if (side === 'end') {
					this.endMinute = minute;
				}
			} else {
				this.minute = minute;
			}

			this._onTimeChange();
		},

		/**
		 * Handle second change
		 * @private
		 * @param {number} second - Second value (0-59)
		 * @param {string} [side] - 'start' or 'end' for range mode
		 */
		_onSecondChange: function(second, side) {
			if (this._isRangeMode()) {
				if (side === 'start') {
					this.startSecond = second;
				} else if (side === 'end') {
					this.endSecond = second;
				}
			} else {
				this.second = second;
			}

			this._onTimeChange();
		},

		/**
		 * Handle period (AM/PM) change
		 * @private
		 * @param {string} period - 'AM' or 'PM'
		 * @param {string} [side] - 'start' or 'end' for range mode
		 */
		_onPeriodChange: function(period, side) {
			if (this._isRangeMode()) {
				if (side === 'start') {
					// Get current 12-hour value and convert
					var hour12 = this.startHour % 12;
					if (hour12 === 0) hour12 = 12;
					this.startHour = this._convertTo24Hour(hour12, period);
				} else if (side === 'end') {
					var hour12 = this.endHour % 12;
					if (hour12 === 0) hour12 = 12;
					this.endHour = this._convertTo24Hour(hour12, period);
				}
			} else {
				var hour12 = this.hour % 12;
				if (hour12 === 0) hour12 = 12;
				this.hour = this._convertTo24Hour(hour12, period);
			}

			this._onTimeChange();
		},

		/**
		 * Called when any time value changes
		 * @private
		 */
		_onTimeChange: function() {
			// Update display if needed (for inline mode or immediate updates)
			if (this.options.autoApply) {
				this._updateInput();
			}
		},

		/**
		 * Get current period (AM/PM) from select for a given side
		 * @private
		 * @param {string} [side] - 'start' or 'end' for range mode
		 * @returns {string} 'AM' or 'PM'
		 */
		_getCurrentPeriod: function(side) {
			if (!this.pickerEl) return 'AM';

			var selector = '.' + CSS.periodSelect;
			if (side) {
				selector += '[data-side="' + side + '"]';
			}

			var periodSelect = this.pickerEl.querySelector(selector);
			return periodSelect ? periodSelect.value : 'AM';
		},

		/**
		 * Convert 12-hour to 24-hour format
		 * @private
		 * @param {number} hour - Hour in 12-hour format (1-12)
		 * @param {string} period - 'AM' or 'PM'
		 * @returns {number} Hour in 24-hour format (0-23)
		 */
		_convertTo24Hour: function(hour, period) {
			if (period === 'AM') {
				return hour === 12 ? 0 : hour;
			} else {
				return hour === 12 ? 12 : hour + 12;
			}
		},

		/**
		 * Convert 24-hour to 12-hour format
		 * @private
		 * @param {number} hour - Hour in 24-hour format (0-23)
		 * @returns {Object} { hour: 1-12, period: 'AM'|'PM' }
		 */
		_convertTo12Hour: function(hour) {
			var period = hour < 12 ? 'AM' : 'PM';
			var hour12 = hour % 12;
			if (hour12 === 0) hour12 = 12;
			return { hour: hour12, period: period };
		},

		/**
		 * Handle month select change for range mode
		 * @private
		 * @param {string} side - 'left' or 'right'
		 * @param {number} month - Month index (0-11)
		 */
		_onMonthSelectChange: function(side, month) {
			if (side === 'left') {
				this.viewDate = new Date(this.viewDate.getFullYear(), month, 1);
				// Update right if linked
				if (this.options.linkedCalendars) {
					this.rightViewDate = DateUtil.addMonths(this.viewDate, 1);
				}
			} else {
				this.rightViewDate = new Date(this.rightViewDate.getFullYear(), month, 1);
				// Update left if linked (right should be after left)
				if (this.options.linkedCalendars) {
					if (DateUtil.isBefore(this.rightViewDate, this.viewDate) ||
					    DateUtil.isSameMonth(this.rightViewDate, this.viewDate)) {
						this.viewDate = DateUtil.addMonths(this.rightViewDate, -1);
					}
				}
			}
			this._render();
		},

		/**
		 * Handle year select change for range mode
		 * @private
		 * @param {string} side - 'left' or 'right'
		 * @param {number} year
		 */
		_onYearSelectChange: function(side, year) {
			if (side === 'left') {
				this.viewDate = new Date(year, this.viewDate.getMonth(), 1);
				// Update right if linked
				if (this.options.linkedCalendars) {
					this.rightViewDate = DateUtil.addMonths(this.viewDate, 1);
				}
			} else {
				this.rightViewDate = new Date(year, this.rightViewDate.getMonth(), 1);
				// Update left if linked
				if (this.options.linkedCalendars) {
					if (DateUtil.isBefore(this.rightViewDate, this.viewDate) ||
					    DateUtil.isSameMonth(this.rightViewDate, this.viewDate)) {
						this.viewDate = DateUtil.addMonths(this.rightViewDate, -1);
					}
				}
			}
			this._render();
		},

		/**
		 * Handle preset range click
		 * @private
		 * @param {string} label - Preset label
		 */
		_onPresetClick: function(label) {
			var presets = this._getPresets();
			if (!presets || !presets[label]) return;

			var range = presets[label];
			this.startDate = DateUtil.startOfDay(range[0]);
			this.endDate = DateUtil.startOfDay(range[1]);
			this.isSelectingEnd = false;
			this.hoverDate = null;

			// Update view to show start date
			this.viewDate = new Date(this.startDate.getFullYear(), this.startDate.getMonth(), 1);
			if (this._isRangeMode()) {
				this.rightViewDate = DateUtil.addMonths(this.viewDate, 1);
			}

			// Emit select event
			dispatchEvent(this.el, 'funky.datepicker.select', {
				start: this.startDate,
				end: this.endDate,
				instance: this
			});

			// Auto-apply if enabled
			if (this.options.autoApply) {
				this._applySelection();
				if (!this.isInline) {
					this.close();
				}
			} else {
				this._render();
			}
		},

		// =====================================================================
		// DATE VALIDATION
		// =====================================================================

		/**
		 * Check if a date is disabled
		 * @private
		 * @param {Date} date
		 * @returns {boolean}
		 */
		_isDateDisabled: function(date) {
			var opts = this.options;

			// Check min date
			if (opts.minDate && DateUtil.isBefore(date, DateUtil.startOfDay(opts.minDate))) {
				return true;
			}

			// Check max date
			if (opts.maxDate && DateUtil.isAfter(date, DateUtil.endOfDay(opts.maxDate))) {
				return true;
			}

			// Check disabled days of week
			if (opts.disabledDays && opts.disabledDays.length > 0) {
				var dayOfWeek = date.getDay();
				if (opts.disabledDays.indexOf(dayOfWeek) !== -1) {
					return true;
				}
			}

			// Check disabled dates array or function
			if (opts.disabledDates) {
				if (typeof opts.disabledDates === 'function') {
					return opts.disabledDates(date);
				}
				if (Array.isArray(opts.disabledDates)) {
					for (var i = 0; i < opts.disabledDates.length; i++) {
						var disabled = parseDate(opts.disabledDates[i]);
						if (disabled && DateUtil.isSameDay(date, disabled)) {
							return true;
						}
					}
				}
			}

			return false;
		},

		// =====================================================================
		// RANGE HELPERS
		// =====================================================================

		/**
		 * Check if date is the range start
		 * @private
		 * @param {Date} date
		 * @returns {boolean}
		 */
		_isRangeStart: function(date) {
			return this.startDate && DateUtil.isSameDay(date, this.startDate);
		},

		/**
		 * Check if date is the range end
		 * @private
		 * @param {Date} date
		 * @returns {boolean}
		 */
		_isRangeEnd: function(date) {
			return this.endDate && DateUtil.isSameDay(date, this.endDate);
		},

		/**
		 * Check if date is within selected range
		 * @private
		 * @param {Date} date
		 * @returns {boolean}
		 */
		_isInSelectedRange: function(date) {
			if (!this.startDate || !this.endDate) return false;
			return DateUtil.isInRange(date, this.startDate, this.endDate);
		},

		/**
		 * Check if date is within hover preview range
		 * @private
		 * @param {Date} date
		 * @returns {boolean}
		 */
		_isInHoverRange: function(date) {
			// Only show hover range when selecting end date
			if (!this.isSelectingEnd || !this.startDate || !this.hoverDate) return false;

			// Don't show if we already have an end date selected
			if (this.endDate) return false;

			var start = this.startDate;
			var end = this.hoverDate;

			// Swap if hover is before start
			if (DateUtil.isBefore(end, start)) {
				var temp = start;
				start = end;
				end = temp;
			}

			// Check if date is in hover range (excluding start which has its own class)
			if (DateUtil.isSameDay(date, this.startDate)) return false;
			if (DateUtil.isSameDay(date, this.hoverDate)) return false;

			return DateUtil.isInRange(date, start, end);
		},

		/**
		 * Handle day hover for range preview
		 * @private
		 * @param {Event} e
		 */
		_onDayHover: function(e) {
			if (!this._isRangeMode() || !this.isSelectingEnd) return;

			var dayCell = e.target.closest('.' + CSS.day);
			if (!dayCell || dayCell.classList.contains(CSS.dayDisabled)) {
				return;
			}

			var dateStr = dayCell.getAttribute('data-date');
			var date = parseDate(dateStr);

			if (date && (!this.hoverDate || !DateUtil.isSameDay(date, this.hoverDate))) {
				this.hoverDate = date;
				this._render();
			}
		},

		/**
		 * Handle mouse leave on calendar for clearing hover
		 * @private
		 */
		_onCalendarMouseLeave: function() {
			if (this._isRangeMode() && this.hoverDate) {
				this.hoverDate = null;
				this._render();
			}
		},

		// =====================================================================
		// NAVIGATION
		// =====================================================================

		/**
		 * Navigate to previous month
		 * @private
		 */
		_goToPrevMonth: function() {
			this.viewDate = DateUtil.addMonths(this.viewDate, -1);

			// Update right calendar for range mode with linked calendars
			if (this._isRangeMode() && this.options.linkedCalendars) {
				this.rightViewDate = DateUtil.addMonths(this.viewDate, 1);
			}

			this._render();
		},

		/**
		 * Navigate to next month
		 * @private
		 */
		_goToNextMonth: function() {
			var size = this._determineSize();
			var isCompact = size === 'compact';

			// In range mode, next button is on the right panel (except compact)
			if (this._isRangeMode()) {
				if (isCompact) {
					// Compact: only one calendar, just move it forward
					this.viewDate = DateUtil.addMonths(this.viewDate, 1);
					this.rightViewDate = DateUtil.addMonths(this.viewDate, 1);
				} else if (this.options.linkedCalendars) {
					// Move both calendars forward
					this.viewDate = DateUtil.addMonths(this.viewDate, 1);
					this.rightViewDate = DateUtil.addMonths(this.viewDate, 1);
				} else {
					// Only move right calendar forward
					this.rightViewDate = DateUtil.addMonths(this.rightViewDate, 1);
				}
			} else {
				this.viewDate = DateUtil.addMonths(this.viewDate, 1);
			}

			this._render();
		},

		/**
		 * Navigate to specific month/year
		 * @private
		 * @param {number} month - Month index (0-11)
		 * @param {number} year
		 */
		_goToMonth: function(month, year) {
			this.viewDate = new Date(year, month, 1);

			// Update right calendar for range mode with linked calendars
			if (this._isRangeMode() && this.options.linkedCalendars) {
				this.rightViewDate = DateUtil.addMonths(this.viewDate, 1);
			}

			this._render();
		},

		/**
		 * Navigate to today's month
		 * @private
		 */
		_goToToday: function() {
			this.viewDate = new Date();
			this._render();
		},

		// =====================================================================
		// DATE SELECTION
		// =====================================================================

		/**
		 * Handle day cell click
		 * @private
		 * @param {HTMLElement} dayCell
		 */
		_onDayClick: function(dayCell) {
			var dateStr = dayCell.getAttribute('data-date');
			var date = parseDate(dateStr);

			if (!date) return;

			this._selectDate(date);
		},

		/**
		 * Select a date
		 * @private
		 * @param {Date} date
		 */
		_selectDate: function(date) {
			if (this._isRangeMode()) {
				this._selectRangeDate(date);
			} else {
				this._selectSingleDate(date);
			}
		},

		/**
		 * Select a single date (single mode)
		 * @private
		 * @param {Date} date
		 */
		_selectSingleDate: function(date) {
			var oldValue = this.selectedDate;
			this.selectedDate = date;
			this.focusedDate = date;

			// Emit select event
			dispatchEvent(this.el, 'funky.datepicker.select', {
				date: date,
				instance: this
			});
			P.emit('funky:datepicker:select', {
				date: date,
				instance: this,
				element: this.el
			});

			// Callback
			if (typeof this.options.onSelect === 'function') {
				this.options.onSelect.call(this, date);
			}

			// Auto-apply or close on select
			if (this.options.autoApply) {
				this._applySelection();
			} else {
				// Just update display
				this._render();
			}

			if (this.options.closeOnSelect && this.options.autoApply && !this.isInline) {
				this.close();
			}
		},

		/**
		 * Select a date in range mode
		 * @private
		 * @param {Date} date
		 */
		_selectRangeDate: function(date) {
			if (!this.isSelectingEnd) {
				// Selecting start date
				this.startDate = DateUtil.startOfDay(date);
				this.endDate = null;
				this.isSelectingEnd = true;
				this.hoverDate = null;
				this.focusedDate = date;

				// Emit select event for start
				dispatchEvent(this.el, 'funky.datepicker.select', {
					start: this.startDate,
					end: null,
					instance: this
				});
			} else {
				// Selecting end date
				var endDate = DateUtil.startOfDay(date);

				// Swap if end is before start
				if (DateUtil.isBefore(endDate, this.startDate)) {
					this.endDate = this.startDate;
					this.startDate = endDate;
				} else {
					this.endDate = endDate;
				}

				this.isSelectingEnd = false;
				this.hoverDate = null;
				this.focusedDate = date;

				// Emit select event for complete range
				dispatchEvent(this.el, 'funky.datepicker.select', {
					start: this.startDate,
					end: this.endDate,
					instance: this
				});
				P.emit('funky:datepicker:select', {
					start: this.startDate,
					end: this.endDate,
					instance: this,
					element: this.el
				});

				// Callback
				if (typeof this.options.onSelect === 'function') {
					this.options.onSelect.call(this, this.startDate, this.endDate);
				}

				// Auto-apply if enabled
				if (this.options.autoApply) {
					this._applySelection();
					if (!this.isInline) {
						this.close();
					}
					return;
				}
			}

			this._render();
		},

		/**
		 * Apply the current selection
		 * @private
		 */
		_applySelection: function() {
			if (this._isRangeMode()) {
				this._applyRangeSelection();
			} else {
				this._applySingleSelection();
			}
		},

		/**
		 * Apply single date selection
		 * @private
		 */
		_applySingleSelection: function() {
			var oldValue = this.originalValue;
			var newValue = this.selectedDate;

			// Update input value
			this._updateInput();

			// Emit change event if value changed
			if (!DateUtil.isSameDay(oldValue, newValue)) {
				dispatchEvent(this.el, 'funky.datepicker.change', {
					value: newValue,
					oldValue: oldValue,
					instance: this
				});
				P.emit('funky:datepicker:change', {
					value: newValue,
					oldValue: oldValue,
					instance: this,
					element: this.el
				});

				// Also trigger native change event
				var nativeEvent = new Event('change', { bubbles: true });
				this.el.dispatchEvent(nativeEvent);

				// Callback
				if (typeof this.options.onChange === 'function') {
					this.options.onChange.call(this, newValue, oldValue);
				}
			}

			// Update original value
			this.originalValue = newValue;
		},

		/**
		 * Apply range selection
		 * @private
		 */
		_applyRangeSelection: function() {
			var oldStart = this.originalStartDate;
			var oldEnd = this.originalEndDate;
			var newStart = this.startDate;
			var newEnd = this.endDate;

			// Update input value
			this._updateInput();

			// Check if value changed
			var startChanged = !DateUtil.isSameDay(oldStart, newStart);
			var endChanged = !DateUtil.isSameDay(oldEnd, newEnd);

			if (startChanged || endChanged) {
				dispatchEvent(this.el, 'funky.datepicker.change', {
					value: { start: newStart, end: newEnd },
					oldValue: { start: oldStart, end: oldEnd },
					instance: this
				});
				P.emit('funky:datepicker:change', {
					value: { start: newStart, end: newEnd },
					oldValue: { start: oldStart, end: oldEnd },
					instance: this,
					element: this.el
				});

				// Also trigger native change event
				var nativeEvent = new Event('change', { bubbles: true });
				this.el.dispatchEvent(nativeEvent);

				// Callback
				if (typeof this.options.onChange === 'function') {
					this.options.onChange.call(this, { start: newStart, end: newEnd }, { start: oldStart, end: oldEnd });
				}
			}

			// Update original values
			this.originalStartDate = newStart;
			this.originalEndDate = newEnd;
		},

		/**
		 * Update input value display
		 * @private
		 */
		_updateInput: function() {
			var opts = this.options;
			var hasTime = this._hasTimePicker();

			if (this._isRangeMode()) {
				// Range mode display
				if (this.startDate && this.endDate) {
					var startTimeInfo = hasTime ? { hour: this.startHour, minute: this.startMinute, second: this.startSecond } : null;
					var endTimeInfo = hasTime ? { hour: this.endHour, minute: this.endMinute, second: this.endSecond } : null;
					var startStr = formatDateForDisplay(this.startDate, opts.format, opts.locale, startTimeInfo);
					var endStr = formatDateForDisplay(this.endDate, opts.format, opts.locale, endTimeInfo);
					this.el.value = startStr + opts.separator + endStr;
				} else if (this.startDate) {
					var startTimeInfo = hasTime ? { hour: this.startHour, minute: this.startMinute, second: this.startSecond } : null;
					var startStr = formatDateForDisplay(this.startDate, opts.format, opts.locale, startTimeInfo);
					this.el.value = startStr + opts.separator;
				} else {
					this.el.value = '';
				}
			} else {
				// Single mode display
				if (this.selectedDate) {
					var timeInfo = hasTime ? { hour: this.hour, minute: this.minute, second: this.second } : null;
					this.el.value = formatDateForDisplay(this.selectedDate, opts.format, opts.locale, timeInfo);
				} else {
					this.el.value = '';
				}
			}
		},

		// =====================================================================
		// ACTION HANDLERS
		// =====================================================================

		/**
		 * Handle clear button click
		 * @private
		 */
		_onClearClick: function() {
			if (this._isRangeMode()) {
				this.startDate = null;
				this.endDate = null;
				this.isSelectingEnd = false;
				this.hoverDate = null;

				// Reset time values
				if (this._hasTimePicker()) {
					this.startHour = 0;
					this.startMinute = 0;
					this.startSecond = 0;
					this.endHour = 23;
					this.endMinute = 59;
					this.endSecond = 59;
				}
			} else {
				this.selectedDate = null;

				// Reset time values
				if (this._hasTimePicker()) {
					this.hour = 0;
					this.minute = 0;
					this.second = 0;
				}
			}
			this.focusedDate = null;
			this._render();

			if (this.options.autoApply) {
				this._applySelection();
			}
		},

		/**
		 * Handle cancel button click
		 * @private
		 */
		_onCancelClick: function() {
			// Restore original values
			if (this._isRangeMode()) {
				this.startDate = this.originalStartDate;
				this.endDate = this.originalEndDate;
				this.isSelectingEnd = false;
				this.hoverDate = null;

				// Restore original time values
				if (this._hasTimePicker()) {
					this.startHour = this.originalStartHour;
					this.startMinute = this.originalStartMinute;
					this.startSecond = this.originalStartSecond;
					this.endHour = this.originalEndHour;
					this.endMinute = this.originalEndMinute;
					this.endSecond = this.originalEndSecond;
				}
			} else {
				this.selectedDate = this.originalValue;

				// Restore original time values
				if (this._hasTimePicker()) {
					this.hour = this.originalHour;
					this.minute = this.originalMinute;
					this.second = this.originalSecond;
				}
			}
			this.close();
		},

		/**
		 * Handle apply button click
		 * @private
		 */
		_onApplyClick: function() {
			this._applySelection();
			this.close();
		},

		// =====================================================================
		// POSITIONING
		// =====================================================================

		/**
		 * Position picker relative to trigger
		 * @private
		 */
		_positionPicker: function() {
			if (!this.pickerEl || this.isInline) return;

			// Update size class based on current viewport (may trigger re-render if changed)
			this._updateSizeClass();

			var triggerRect = this.el.getBoundingClientRect();
			var pickerRect = this.pickerEl.getBoundingClientRect();
			var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
			var scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
			var viewportWidth = window.innerWidth || document.documentElement.clientWidth;
			var viewportHeight = window.innerHeight || document.documentElement.clientHeight;

			// If picker is still wider than viewport after size adjustment, force compact
			if (pickerRect.width > viewportWidth - 16 && this._currentSize !== 'compact') {
				this.pickerEl.classList.remove(CSS.small);
				this.pickerEl.classList.add(CSS.compact);
				this._currentSize = 'compact';
				// Re-read rect after class change
				pickerRect = this.pickerEl.getBoundingClientRect();
			}

			var top = 0;
			var left = 0;
			var gap = 4; // Gap between trigger and picker
			var padding = 8; // Padding from viewport edge

			// Determine drops direction
			var drops = this.options.drops;
			if (drops === 'auto') {
				// Check if there's more space above or below
				var spaceBelow = viewportHeight - triggerRect.bottom;
				var spaceAbove = triggerRect.top;
				drops = (spaceBelow < pickerRect.height && spaceAbove > spaceBelow) ? 'up' : 'down';
			}

			// Calculate vertical position
			if (drops === 'up') {
				top = triggerRect.top + scrollTop - pickerRect.height - gap;
			} else {
				top = triggerRect.bottom + scrollTop + gap;
			}

			// Calculate horizontal position
			switch (this.options.opens) {
				case 'left':
					left = triggerRect.right + scrollLeft - pickerRect.width;
					break;
				case 'center':
					left = triggerRect.left + scrollLeft + (triggerRect.width - pickerRect.width) / 2;
					break;
				case 'right':
				default:
					left = triggerRect.left + scrollLeft;
					break;
			}

			// Viewport boundary adjustments
			// Horizontal
			if (left < scrollLeft + padding) {
				left = scrollLeft + padding;
			} else if (left + pickerRect.width > scrollLeft + viewportWidth - padding) {
				left = scrollLeft + viewportWidth - pickerRect.width - padding;
			}

			// Vertical
			if (top < scrollTop + padding) {
				top = scrollTop + padding;
			} else if (top + pickerRect.height > scrollTop + viewportHeight - padding) {
				top = scrollTop + viewportHeight - pickerRect.height - padding;
			}

			// Apply position
			this.pickerEl.style.position = 'absolute';
			this.pickerEl.style.top = Math.round(top) + 'px';
			this.pickerEl.style.left = Math.round(left) + 'px';
		},

		// =====================================================================
		// KEYBOARD NAVIGATION
		// =====================================================================

		/**
		 * Handle keydown events
		 * @private
		 * @param {KeyboardEvent} e
		 */
		_onKeydown: function(e) {
			if (!this.isOpen && !this.isInline) return;

			var key = e.key;
			var handled = false;

			switch (key) {
				case 'Escape':
					if (!this.isInline) {
						this._onCancelClick();
						handled = true;
					}
					break;

				case 'Enter':
				case ' ':
					if (this.focusedDate && !this._isDateDisabled(this.focusedDate)) {
						this._selectDate(this.focusedDate);
						handled = true;
					}
					break;

				case 'ArrowLeft':
					this._moveFocus(-1);
					handled = true;
					break;

				case 'ArrowRight':
					this._moveFocus(1);
					handled = true;
					break;

				case 'ArrowUp':
					this._moveFocus(-7);
					handled = true;
					break;

				case 'ArrowDown':
					this._moveFocus(7);
					handled = true;
					break;

				case 'PageUp':
					if (e.shiftKey) {
						// Previous year
						this.viewDate = DateUtil.addMonths(this.viewDate, -12);
					} else {
						// Previous month
						this._goToPrevMonth();
					}
					handled = true;
					break;

				case 'PageDown':
					if (e.shiftKey) {
						// Next year
						this.viewDate = DateUtil.addMonths(this.viewDate, 12);
					} else {
						// Next month
						this._goToNextMonth();
					}
					handled = true;
					break;

				case 'Home':
					// First day of month
					this.focusedDate = DateUtil.startOfMonth(this.viewDate);
					this._render();
					this._focusCurrentDay();
					handled = true;
					break;

				case 'End':
					// Last day of month
					this.focusedDate = DateUtil.endOfMonth(this.viewDate);
					this._render();
					this._focusCurrentDay();
					handled = true;
					break;

				case 'Tab':
					// Focus trap
					this._trapFocus(e);
					break;
			}

			if (handled) {
				e.preventDefault();
				e.stopPropagation();
			}
		},

		/**
		 * Move focus by days
		 * @private
		 * @param {number} days - Number of days to move (negative for backwards)
		 */
		_moveFocus: function(days) {
			// Initialize focused date if not set
			if (!this.focusedDate) {
				this.focusedDate = this.selectedDate || new Date();
			}

			var newDate = DateUtil.addDays(this.focusedDate, days);

			// Skip disabled dates
			var attempts = 0;
			var direction = days > 0 ? 1 : -1;
			while (this._isDateDisabled(newDate) && attempts < 365) {
				newDate = DateUtil.addDays(newDate, direction);
				attempts++;
			}

			this.focusedDate = newDate;

			// Check if we need to change month view
			if (!DateUtil.isSameMonth(newDate, this.viewDate)) {
				this.viewDate = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
			}

			this._render();
			this._focusCurrentDay();
		},

		/**
		 * Focus the currently focused/selected day cell
		 * @private
		 */
		_focusCurrentDay: function() {
			if (!this.pickerEl) return;

			var dateToFocus = this.focusedDate || this.selectedDate || new Date();

			var dateStr = DateUtil.toDateString(dateToFocus);
			var dayCell = this.pickerEl.querySelector('[data-date="' + dateStr + '"]');

			if (dayCell && !dayCell.classList.contains(CSS.dayDisabled)) {
				dayCell.focus();
			} else {
				// Fallback: focus first non-disabled day
				var firstDay = this.pickerEl.querySelector('.' + CSS.day + ':not(.' + CSS.dayDisabled + ')');
				if (firstDay) {
					firstDay.focus();
				}
			}
		},

		/**
		 * Trap focus within picker
		 * @private
		 * @param {KeyboardEvent} e
		 */
		_trapFocus: function(e) {
			if (!this.pickerEl) return;

			var focusable = this.pickerEl.querySelectorAll(FOCUSABLE_SELECTORS);
			if (focusable.length === 0) return;

			var first = focusable[0];
			var last = focusable[focusable.length - 1];

			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
		},

		// =====================================================================
		// OUTSIDE CLICK
		// =====================================================================

		/**
		 * Handle click outside picker
		 * @private
		 * @param {MouseEvent} e
		 */
		_onOutsideClick: function(e) {
			if (!this.isOpen || this.isInline) return;

			// If we're handling an internal click (day click, button click, etc.),
			// skip outside-click detection. This handles the case where _render()
			// removes the clicked element from DOM before this handler fires.
			if (this._handlingInternalClick) {
				this._handlingInternalClick = false;
				console.log('[DatePicker] _onOutsideClick: skipped due to _handlingInternalClick flag');
				return;
			}

			var clickedInside = this.el.contains(e.target) ||
			                    (this.pickerEl && this.pickerEl.contains(e.target));

			// Also check if click is on a combobox element (which may be inside picker)
			if (!clickedInside && e.target.closest) {
				var comboboxEl = e.target.closest('.combobox, .combobox__dropdown, .combobox__trigger, .combobox__item');
				if (comboboxEl) {
					// Check if this combobox is inside the picker
					if (this.pickerEl && this.pickerEl.contains(comboboxEl)) {
						clickedInside = true;
						console.log('[DatePicker] _onOutsideClick: combobox click detected inside picker');
					}
				}
			}

			console.log('[DatePicker] _onOutsideClick:', {
				target: e.target,
				targetClass: e.target.className,
				clickedInside: clickedInside,
				pickerContains: this.pickerEl && this.pickerEl.contains(e.target)
			});

			if (!clickedInside) {
				console.log('[DatePicker] _onOutsideClick: closing picker');
				this._onCancelClick();
			}
		},

		// =====================================================================
		// PUBLIC API
		// =====================================================================

		/**
		 * Open the date picker
		 */
		open: function() {
			if (this.isOpen || this.isInline) return;

			var self = this;

			// Store original values for cancel
			if (this._isRangeMode()) {
				this.originalStartDate = this.startDate ? new Date(this.startDate) : null;
				this.originalEndDate = this.endDate ? new Date(this.endDate) : null;
				this.isSelectingEnd = false;
				this.hoverDate = null;

				// Store original time values
				if (this._hasTimePicker()) {
					this.originalStartHour = this.startHour;
					this.originalStartMinute = this.startMinute;
					this.originalStartSecond = this.startSecond;
					this.originalEndHour = this.endHour;
					this.originalEndMinute = this.endMinute;
					this.originalEndSecond = this.endSecond;
				}

				// Initialize focused date
				this.focusedDate = this.startDate || new Date();
				this.viewDate = new Date(this.focusedDate.getFullYear(), this.focusedDate.getMonth(), 1);
				this.rightViewDate = DateUtil.addMonths(this.viewDate, 1);
			} else {
				this.originalValue = this.selectedDate ? new Date(this.selectedDate) : null;

				// Store original time values
				if (this._hasTimePicker()) {
					this.originalHour = this.hour;
					this.originalMinute = this.minute;
					this.originalSecond = this.second;
				}

				// Initialize focused date
				this.focusedDate = this.selectedDate || new Date();
				this.viewDate = new Date(this.focusedDate.getFullYear(), this.focusedDate.getMonth(), 1);
			}

			// Create picker if needed
			if (!this.pickerEl) {
				this._createPicker();
			} else {
				this._render();
			}

			// Add to DOM
			document.body.appendChild(this.pickerEl);

			// Show first (so we get correct dimensions)
			this.pickerEl.classList.add(CSS.open);
			this.isOpen = true;

			// Position after visible (so getBoundingClientRect works)
			this._positionPicker();

			// Bind outside click
			setTimeout(function() {
				document.addEventListener('click', self._boundOnOutsideClick);
			}, 0);

			// Bind keyboard
			document.addEventListener('keydown', this._boundOnKeydown);

			// Set up focus management with FocusManager if available
			if (Funky.FocusManager && Funky.FocusManager.focusAndPush) {
				// Push current focus to history before focusing picker
				Funky.FocusManager.focusAndPush(this.pickerEl, { label: 'Date Picker' });

				// Set up focus trap
				if (Funky.FocusManager.trapFocus) {
					this._focusTrapCleanup = Funky.FocusManager.trapFocus(this.pickerEl, {
						autoFocus: false // We handle initial focus ourselves
					});
				}
			}

			// Focus first focusable or selected day
			setTimeout(function() {
				self._focusCurrentDay();
			}, 50);

			// Emit event
			dispatchEvent(this.el, 'funky.datepicker.open', { instance: this });
			P.emit('funky:datepicker:open', { instance: this, element: this.el });

			// Callback
			if (typeof this.options.onOpen === 'function') {
				this.options.onOpen.call(this);
			}
		},

		/**
		 * Close the date picker
		 */
		close: function() {
			if (!this.isOpen || this.isInline) return;

			var self = this;

			// Clean up focus trap
			if (this._focusTrapCleanup) {
				this._focusTrapCleanup();
				this._focusTrapCleanup = null;
			}

			// Clean up gesture tracker (element will be removed from DOM)
			if (this._gestureTracker) {
				this._gestureTracker.destroy();
				this._gestureTracker = null;
			}

			// Hide
			this.pickerEl.classList.remove(CSS.open);

			// Unbind outside click
			document.removeEventListener('click', this._boundOnOutsideClick);

			// Unbind keyboard
			document.removeEventListener('keydown', this._boundOnKeydown);

			// Remove from DOM after transition
			var duration = Animate ? Animate.getDuration(this.pickerEl, 150) : 150;
			setTimeout(function() {
				if (self.pickerEl && self.pickerEl.parentNode) {
					self.pickerEl.parentNode.removeChild(self.pickerEl);
				}
				self.isOpen = false;
			}, duration);

			// Restore focus using FocusManager or fallback to trigger element
			if (Funky.FocusManager && Funky.FocusManager.popFocus) {
				Funky.FocusManager.popFocus();
			} else {
				// Fallback: return focus to trigger
				this.el.focus();
			}

			// Emit event
			dispatchEvent(this.el, 'funky.datepicker.close', { instance: this });
			P.emit('funky:datepicker:close', { instance: this, element: this.el });

			// Callback
			if (typeof this.options.onClose === 'function') {
				this.options.onClose.call(this);
			}
		},

		/**
		 * Toggle picker visibility
		 */
		toggle: function() {
			if (this.isOpen) {
				this.close();
			} else {
				this.open();
			}
		},

		/**
		 * Get selected date value
		 * In range mode, returns { start: Date, end: Date }
		 * In single mode, returns Date
		 * @returns {Date|Object|null}
		 */
		getValue: function() {
			if (this._isRangeMode()) {
				return {
					start: this.startDate ? new Date(this.startDate) : null,
					end: this.endDate ? new Date(this.endDate) : null
				};
			}
			return this.selectedDate ? new Date(this.selectedDate) : null;
		},

		/**
		 * Get range value (range mode only)
		 * @returns {Object} { start: Date|null, end: Date|null }
		 */
		getRange: function() {
			return {
				start: this.startDate ? new Date(this.startDate) : null,
				end: this.endDate ? new Date(this.endDate) : null
			};
		},

		/**
		 * Set selected date value
		 * @param {Date|string|number|null} date
		 */
		setValue: function(date) {
			var parsed = parseDate(date);
			var oldValue = this.selectedDate;

			this.selectedDate = parsed;

			if (parsed) {
				this.viewDate = new Date(parsed.getFullYear(), parsed.getMonth(), 1);
				this.focusedDate = parsed;
			}

			// Update input
			this._updateInput();

			// Re-render if open
			if (this.isOpen || this.isInline) {
				this._render();
			}

			// Emit change if different
			if (!DateUtil.isSameDay(oldValue, parsed)) {
				dispatchEvent(this.el, 'funky.datepicker.change', {
					value: parsed,
					oldValue: oldValue,
					instance: this
				});
			}
		},

		/**
		 * Set range value (range mode only)
		 * @param {Date|string|number|null} start - Start date
		 * @param {Date|string|number|null} end - End date
		 */
		setRange: function(start, end) {
			if (!this._isRangeMode()) {
				console.warn('[Funky.DatePicker] setRange() only works in range mode');
				return;
			}

			var oldStart = this.startDate;
			var oldEnd = this.endDate;

			this.startDate = start ? DateUtil.startOfDay(parseDate(start)) : null;
			this.endDate = end ? DateUtil.startOfDay(parseDate(end)) : null;
			this.isSelectingEnd = false;
			this.hoverDate = null;

			// Swap if end is before start
			if (this.startDate && this.endDate && DateUtil.isBefore(this.endDate, this.startDate)) {
				var temp = this.startDate;
				this.startDate = this.endDate;
				this.endDate = temp;
			}

			// Update view
			if (this.startDate) {
				this.viewDate = new Date(this.startDate.getFullYear(), this.startDate.getMonth(), 1);
				this.rightViewDate = DateUtil.addMonths(this.viewDate, 1);
				this.focusedDate = this.startDate;
			}

			// Update input
			this._updateInput();

			// Re-render if open
			if (this.isOpen || this.isInline) {
				this._render();
			}

			// Emit change if different
			var startChanged = !DateUtil.isSameDay(oldStart, this.startDate);
			var endChanged = !DateUtil.isSameDay(oldEnd, this.endDate);

			if (startChanged || endChanged) {
				dispatchEvent(this.el, 'funky.datepicker.change', {
					value: { start: this.startDate, end: this.endDate },
					oldValue: { start: oldStart, end: oldEnd },
					instance: this
				});
			}
		},

		/**
		 * Set minimum date
		 * @param {Date|string|number|null} date
		 */
		setMinDate: function(date) {
			this.options.minDate = parseDate(date);
			if (this.isOpen || this.isInline) {
				this._render();
			}
		},

		/**
		 * Set maximum date
		 * @param {Date|string|number|null} date
		 */
		setMaxDate: function(date) {
			this.options.maxDate = parseDate(date);
			if (this.isOpen || this.isInline) {
				this._render();
			}
		},

		/**
		 * Enable the date picker
		 */
		enable: function() {
			this.el.disabled = false;
			this.el.removeAttribute('disabled');
		},

		/**
		 * Disable the date picker
		 */
		disable: function() {
			this.el.disabled = true;
			this.el.setAttribute('disabled', 'disabled');
			if (this.isOpen) {
				this.close();
			}
		},

		/**
		 * Refresh/re-render the picker
		 */
		refresh: function() {
			if (this.isOpen || this.isInline) {
				this._render();
			}
		},

		// =====================================================================
		// TIME PICKER PUBLIC API
		// =====================================================================

		/**
		 * Get time value (single mode only)
		 * @returns {Object|null} { hour: 0-23, minute: 0-59, second: 0-59 }
		 */
		getTime: function() {
			if (!this._hasTimePicker()) {
				return null;
			}

			if (this._isRangeMode()) {
				return {
					start: { hour: this.startHour, minute: this.startMinute, second: this.startSecond },
					end: { hour: this.endHour, minute: this.endMinute, second: this.endSecond }
				};
			}

			return { hour: this.hour, minute: this.minute, second: this.second };
		},

		/**
		 * Set time value (single mode only)
		 * @param {number} hour - Hour (0-23)
		 * @param {number} [minute] - Minute (0-59), default 0
		 * @param {number} [second] - Second (0-59), default 0
		 */
		setTime: function(hour, minute, second) {
			if (!this._hasTimePicker()) {
				console.warn('[Funky.DatePicker] setTime() requires timePicker option to be enabled');
				return;
			}

			if (this._isRangeMode()) {
				console.warn('[Funky.DatePicker] Use setStartTime() and setEndTime() in range mode');
				return;
			}

			this.hour = Math.max(0, Math.min(23, hour || 0));
			this.minute = Math.max(0, Math.min(59, minute || 0));
			this.second = Math.max(0, Math.min(59, second || 0));

			this._updateInput();

			if (this.isOpen || this.isInline) {
				this._render();
			}
		},

		/**
		 * Set start time (range mode only)
		 * @param {number} hour - Hour (0-23)
		 * @param {number} [minute] - Minute (0-59), default 0
		 * @param {number} [second] - Second (0-59), default 0
		 */
		setStartTime: function(hour, minute, second) {
			if (!this._hasTimePicker() || !this._isRangeMode()) {
				console.warn('[Funky.DatePicker] setStartTime() requires timePicker in range mode');
				return;
			}

			this.startHour = Math.max(0, Math.min(23, hour || 0));
			this.startMinute = Math.max(0, Math.min(59, minute || 0));
			this.startSecond = Math.max(0, Math.min(59, second || 0));

			this._updateInput();

			if (this.isOpen || this.isInline) {
				this._render();
			}
		},

		/**
		 * Set end time (range mode only)
		 * @param {number} hour - Hour (0-23)
		 * @param {number} [minute] - Minute (0-59), default 0
		 * @param {number} [second] - Second (0-59), default 0
		 */
		setEndTime: function(hour, minute, second) {
			if (!this._hasTimePicker() || !this._isRangeMode()) {
				console.warn('[Funky.DatePicker] setEndTime() requires timePicker in range mode');
				return;
			}

			this.endHour = Math.max(0, Math.min(23, hour || 0));
			this.endMinute = Math.max(0, Math.min(59, minute || 0));
			this.endSecond = Math.max(0, Math.min(59, second || 0));

			this._updateInput();

			if (this.isOpen || this.isInline) {
				this._render();
			}
		},

		/**
		 * Get full datetime value (single mode)
		 * Returns date with time applied
		 * @returns {Date|null}
		 */
		getDateTime: function() {
			if (!this._hasTimePicker()) {
				return this.getValue();
			}

			if (this._isRangeMode()) {
				var start = null;
				var end = null;

				if (this.startDate) {
					start = new Date(this.startDate);
					start.setHours(this.startHour, this.startMinute, this.startSecond, 0);
				}

				if (this.endDate) {
					end = new Date(this.endDate);
					end.setHours(this.endHour, this.endMinute, this.endSecond, 0);
				}

				return { start: start, end: end };
			}

			if (!this.selectedDate) return null;

			var datetime = new Date(this.selectedDate);
			datetime.setHours(this.hour, this.minute, this.second, 0);
			return datetime;
		},

		/**
		 * Set full datetime value (single mode)
		 * @param {Date} datetime - Date with time
		 */
		setDateTime: function(datetime) {
			if (!datetime) {
				this.setValue(null);
				return;
			}

			var date = parseDate(datetime);
			if (!date) return;

			if (this._isRangeMode()) {
				console.warn('[Funky.DatePicker] Use setDateTimeRange() in range mode');
				return;
			}

			this.selectedDate = DateUtil.startOfDay(date);
			this.viewDate = new Date(date.getFullYear(), date.getMonth(), 1);
			this.focusedDate = date;

			if (this._hasTimePicker()) {
				this.hour = date.getHours();
				this.minute = date.getMinutes();
				this.second = date.getSeconds();
			}

			this._updateInput();

			if (this.isOpen || this.isInline) {
				this._render();
			}
		},

		/**
		 * Set full datetime range (range mode only)
		 * @param {Date} startDateTime - Start date with time
		 * @param {Date} endDateTime - End date with time
		 */
		setDateTimeRange: function(startDateTime, endDateTime) {
			if (!this._isRangeMode()) {
				console.warn('[Funky.DatePicker] setDateTimeRange() only works in range mode');
				return;
			}

			var startDate = startDateTime ? parseDate(startDateTime) : null;
			var endDate = endDateTime ? parseDate(endDateTime) : null;

			// Set dates
			this.startDate = startDate ? DateUtil.startOfDay(startDate) : null;
			this.endDate = endDate ? DateUtil.startOfDay(endDate) : null;
			this.isSelectingEnd = false;
			this.hoverDate = null;

			// Swap if end is before start
			if (this.startDate && this.endDate && DateUtil.isBefore(this.endDate, this.startDate)) {
				var temp = this.startDate;
				this.startDate = this.endDate;
				this.endDate = temp;

				// Also swap times
				var tempDate = startDate;
				startDate = endDate;
				endDate = tempDate;
			}

			// Set times if time picker enabled
			if (this._hasTimePicker()) {
				if (startDate) {
					this.startHour = startDate.getHours();
					this.startMinute = startDate.getMinutes();
					this.startSecond = startDate.getSeconds();
				}
				if (endDate) {
					this.endHour = endDate.getHours();
					this.endMinute = endDate.getMinutes();
					this.endSecond = endDate.getSeconds();
				}
			}

			// Update view
			if (this.startDate) {
				this.viewDate = new Date(this.startDate.getFullYear(), this.startDate.getMonth(), 1);
				this.rightViewDate = DateUtil.addMonths(this.viewDate, 1);
				this.focusedDate = this.startDate;
			}

			this._updateInput();

			if (this.isOpen || this.isInline) {
				this._render();
			}
		},

		/**
		 * Destroy the date picker instance
		 */
		destroy: function() {
			// Close if open
			if (this.isOpen) {
				this.close();
			}

			// Destroy ComboBox instances
			this._destroyComboBoxes();

			// Destroy gesture tracker
			if (this._gestureTracker) {
				this._gestureTracker.destroy();
				this._gestureTracker = null;
			}

			// Destroy LiveBinding connections
			this._destroyLiveBindings();

			// Remove picker element
			if (this.pickerEl && this.pickerEl.parentNode) {
				this.pickerEl.parentNode.removeChild(this.pickerEl);
			}

			// Unbind triggers
			this._unbindTrigger();

			// Remove readonly
			this.el.removeAttribute('readonly');
			this.el.removeAttribute('autocomplete');

			// Remove LiveBinding classes
			this.el.classList.remove('funky-datepicker-loading', 'funky-datepicker-error');

			// Remove instance from registry
			instances.delete(this.el);
		}
	};

	// =========================================================================
	// STATIC METHODS
	// =========================================================================

	/**
	 * Create a new DatePicker instance (primary factory method)
	 * @param {string|HTMLElement} target
	 * @param {Object} options
	 * @returns {DatePicker}
	 */
	DatePicker.init = function(target, options) {
		var element = getElement(target);
		if (!element) return null;

		// Return existing instance if present
		var existing = instances.get(element);
		if (existing) return existing;

		return new DatePicker(element, options);
	};

	/**
	 * @deprecated Use DatePicker.init() instead
	 */
	DatePicker.create = function(target, options) {
		if (Funky.debug) {
			console.warn('[Funky.DatePicker] create() is deprecated. Use init() instead.');
		}
		return DatePicker.init(target, options);
	};

	/**
	 * Get existing instance
	 * @param {string|HTMLElement} target
	 * @returns {DatePicker|null}
	 */
	DatePicker.getInstance = function(target) {
		var element = getElement(target);
		if (!element) return null;
		return instances.get(element) || null;
	};

	/**
	 * Get or create instance
	 * @deprecated Use DatePicker.init() instead
	 * @param {string|HTMLElement} target
	 * @param {Object} options
	 * @returns {DatePicker}
	 */
	DatePicker.getOrCreateInstance = function(target, options) {
		if (Funky.debug) {
			console.warn('[Funky.DatePicker] getOrCreateInstance() is deprecated. Use init() instead.');
		}
		return DatePicker.init(target, options);
	};

	/**
	 * Initialize date pickers from data attributes
	 * @param {string|HTMLElement} container - Container to search (default: document)
	 */
	DatePicker.initAll = function(container) {
		var root = container ? getElement(container) : document;
		var elements = root.querySelectorAll('[data-funky-datepicker]');

		elements.forEach(function(el) {
			if (!instances.has(el)) {
				new DatePicker(el);
			}
		});
	};

	/**
	 * Destroy a date picker instance
	 * @param {string|HTMLElement} target
	 */
	DatePicker.destroy = function(target) {
		var instance = DatePicker.getInstance(target);
		if (instance) {
			instance.destroy();
		}
	};

	/**
	 * Destroy all DatePicker instances
	 */
	DatePicker.destroyAll = function() {
		instances.forEach(function(instance) {
			if (instance && instance.destroy) {
				instance.destroy();
			}
		});
	};

	// =========================================================================
	// AUTO-INITIALIZE
	// =========================================================================

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', function() {
			DatePicker.initAll();
		});
	} else {
		DatePicker.initAll();
	}

	// =========================================================================
	// REGISTER
	// =========================================================================

	Funky.register('DatePicker', DatePicker);

	// =========================================================================
	// LIVEBINDING COMPONENT ADAPTER
	// =========================================================================

	/**
	 * Register DatePicker as a LiveBinding component adapter
	 * This allows LiveBinding to work directly with DatePicker instances
	 */
	(function registerLiveBindingAdapter() {
		if (!Funky.LiveBinding) return;

		// Register DatePicker in the component registries for instance lookup
		if (Funky.LiveBinding.registerRegistry) {
			Funky.LiveBinding.registerRegistry('DatePicker');
		}

		// Register component adapter
		if (Funky.LiveBinding.registerComponent) {
			Funky.LiveBinding.registerComponent('datepicker', {
				/**
				 * Check if element is a DatePicker
				 * @param {HTMLElement} element
				 * @returns {boolean}
				 */
				supports: function(element) {
					return element.hasAttribute('data-funky-datepicker') ||
						instances.has(element);
				},

				/**
				 * Bind DatePicker to data source
				 * @param {HTMLElement} element
				 * @param {Object} options
				 * @returns {Object} Binding adapter
				 */
				bind: function(element, options) {
					var instance = DatePicker.getInstance(element);

					return {
						/**
						 * Update DatePicker value from source
						 * @param {Date|Object|string} data
						 */
						update: function(data) {
							if (!instance) {
								instance = DatePicker.getInstance(element);
							}
							if (!instance) return;

							// Handle range mode data
							if (instance.options.mode === 'range') {
								if (data && typeof data === 'object' && (data.start !== undefined || data.end !== undefined)) {
									instance.setRange(data.start, data.end);
								}
							} else {
								// Single date
								instance.setValue(data);
							}
						},

						/**
						 * Get current DatePicker value
						 * @returns {Date|Object|null}
						 */
						getData: function() {
							if (!instance) {
								instance = DatePicker.getInstance(element);
							}
							return instance ? instance.getValue() : null;
						},

						/**
						 * Get DatePicker instance
						 * @returns {DatePicker|null}
						 */
						getInstance: function() {
							return instance || DatePicker.getInstance(element);
						},

						/**
						 * Clear DatePicker value
						 */
						clear: function() {
							if (!instance) {
								instance = DatePicker.getInstance(element);
							}
							if (!instance) return;

							if (instance.options.mode === 'range') {
								instance.setRange(null, null);
							} else {
								instance.setValue(null);
							}
						},

						/**
						 * Cleanup
						 */
						destroy: function() {
							// Nothing to clean up - DatePicker handles its own cleanup
						}
					};
				}
			});
		}

		// Listen for LiveBinding ready event (if not already loaded)
		if (Funky.PubSub) {
			Funky.PubSub.on('funky:livebinding:ready', registerLiveBindingAdapter);
		}
	})();

	/**
	 * DatePicker LiveBinding Adapter (for external use)
	 * Can be used directly with Funky.LiveBinding.registerComponent()
	 */
	DatePicker.LiveBindingAdapter = {
		/**
		 * Get value from DatePicker instance
		 * @param {DatePicker} instance
		 * @returns {Date|Object|null}
		 */
		getValue: function(instance) {
			return instance ? instance.getValue() : null;
		},

		/**
		 * Set value on DatePicker instance
		 * @param {DatePicker} instance
		 * @param {Date|Object|string} value
		 */
		setValue: function(instance, value) {
			if (!instance) return;

			if (instance.options.mode === 'range' && value && typeof value === 'object') {
				instance.setRange(value.start, value.end);
			} else {
				instance.setValue(value);
			}
		},

		/**
		 * Get DatePicker instance from element
		 * @param {HTMLElement} element
		 * @returns {DatePicker|null}
		 */
		getInstance: function(element) {
			return DatePicker.getInstance(element);
		},

		/**
		 * Subscribe to value changes
		 * @param {DatePicker} instance
		 * @param {Function} callback
		 */
		onChange: function(instance, callback) {
			if (!instance || !instance.el) return;

			Funky.Events.on(instance.el, 'funky.datepicker.change', function(e) {
				callback(e.detail.value);
			});
		},

		/**
		 * Format DatePicker value for display
		 * @param {Date|Object} value
		 * @param {string} format
		 * @returns {string}
		 */
		format: function(value, formatStr) {
			if (!value) return '';

			// Range value
			if (value.start !== undefined || value.end !== undefined) {
				var startStr = value.start ? formatDateForDisplay(value.start, formatStr) : '';
				var endStr = value.end ? formatDateForDisplay(value.end, formatStr) : '';
				return startStr + ' - ' + endStr;
			}

			// Single date
			return formatDateForDisplay(value, formatStr) || '';
		}
	};

	console.log('[Funky.DatePicker] v1.0.0 initialized');

})(window);

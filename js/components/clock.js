/**
 * Funky.Clock
 * 
 * Real-time ticking clock display with scheduling and countdown capabilities.
 * Supports digital (text) and analog (SVG) display styles.
 * 
 * @example
 * <span data-clock data-format="12h" data-seconds="true"></span>
 * <span data-clock data-style="analog" data-size="lg"></span>
 * <span data-clock data-countdown="5:00"></span>
 * 
 * // Schedule an action
 * Funky.Clock.after(30000, function() { console.log('30 seconds passed!'); });
 * 
 * // Start a countdown programmatically
 * Funky.Clock.countdown('#timer', 300000); // 5 minutes
 */
(function(window) {
    'use strict';

    // Ensure Funky registry exists
    if (!window.Funky || !window.Funky.register) {
        console.error('[Funky.Clock] Registry not found. Load namespace.js first.');
        return;
    }

    var D = Funky.Dom;
    var E = Funky.Events;

    var SELECTOR = '[data-clock]';
    var instances = [];
    var scheduledTasks = [];
    var taskIdCounter = 0;

    // Timer state
    var tickTimer = null;
    var isPaused = false;
    var visibilityListenerAdded = false;

    // Configuration
    var config = {
        tickInterval: 1000,
        format: '24h',
        showSeconds: true,
        showDate: false,
        timezone: null,
        locale: (typeof navigator !== 'undefined' && navigator.language) || 'en-US'
    };

    // Size presets for analog clocks
    var ANALOG_SIZES = {
        sm: 60,
        md: 100,
        lg: 150,
        xl: 200
    };

    // =========================================================================
    // DIGITAL CLOCK FORMATTING
    // =========================================================================

    /**
     * Format time for a digital clock element
     * @param {HTMLElement} el
     * @returns {string}
     */
    function formatTime(el) {
        var format = el.getAttribute('data-format') || config.format;
        var showSeconds = el.getAttribute('data-seconds') !== 'false';
        var showDate = el.getAttribute('data-date') || config.showDate;
        var timezone = el.getAttribute('data-timezone') || config.timezone;

        var now = new Date();
        var options = {
            hour: 'numeric',
            minute: '2-digit',
            hour12: format === '12h'
        };

        if (showSeconds) {
            options.second = '2-digit';
        }

        if (timezone) {
            options.timeZone = timezone;
        }

        // Date options
        if (showDate === 'short') {
            options.day = 'numeric';
            options.month = 'short';
        } else if (showDate === 'long') {
            options.day = 'numeric';
            options.month = 'long';
            options.year = 'numeric';
        }

        try {
            return new Intl.DateTimeFormat(config.locale, options).format(now);
        } catch (e) {
            // Fallback for invalid timezone
            return now.toLocaleTimeString();
        }
    }

    // =========================================================================
    // ANALOG CLOCK RENDERING
    // =========================================================================

    /**
     * Create SVG analog clock face
     * @param {HTMLElement} el - Container element
     * @param {number} size - Clock size in pixels
     */
    function createAnalogFace(el, size) {
        var format = el.getAttribute('data-format') || config.format;
        var showSeconds = el.getAttribute('data-seconds') !== 'false';
        var is24h = format === '24h';

        var ns = 'http://www.w3.org/2000/svg';
        var svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('width', size);
        svg.setAttribute('height', size);
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.setAttribute('class', 'clock-analog');

        // Clock face circle
        var face = document.createElementNS(ns, 'circle');
        face.setAttribute('cx', '50');
        face.setAttribute('cy', '50');
        face.setAttribute('r', '48');
        face.setAttribute('class', 'clock-face');
        svg.appendChild(face);

        // Hour markers
        var markerCount = is24h ? 24 : 12;
        for (var i = 0; i < markerCount; i++) {
            var angle = (i * (360 / markerCount)) - 90;
            var rad = angle * Math.PI / 180;
            var isHour = is24h ? (i % 2 === 0) : true;

            var x1 = 50 + Math.cos(rad) * (isHour ? 40 : 42);
            var y1 = 50 + Math.sin(rad) * (isHour ? 40 : 42);
            var x2 = 50 + Math.cos(rad) * 45;
            var y2 = 50 + Math.sin(rad) * 45;

            var marker = document.createElementNS(ns, 'line');
            marker.setAttribute('x1', x1);
            marker.setAttribute('y1', y1);
            marker.setAttribute('x2', x2);
            marker.setAttribute('y2', y2);
            marker.setAttribute('class', isHour ? 'clock-marker-hour' : 'clock-marker-min');
            svg.appendChild(marker);
        }

        // Hour numbers (for larger clocks)
        if (size >= 100) {
            var numbers = is24h ? [0, 6, 12, 18] : [12, 3, 6, 9];
            var positions = [
                { x: 50, y: 18 },   // top
                { x: 82, y: 54 },   // right
                { x: 50, y: 90 },   // bottom
                { x: 18, y: 54 }    // left
            ];

            for (var n = 0; n < numbers.length; n++) {
                var numText = document.createElementNS(ns, 'text');
                numText.setAttribute('x', positions[n].x);
                numText.setAttribute('y', positions[n].y);
                numText.setAttribute('class', 'clock-number');
                numText.textContent = numbers[n];
                svg.appendChild(numText);
            }
        }

        // Hour hand
        var hourHand = document.createElementNS(ns, 'line');
        hourHand.setAttribute('x1', '50');
        hourHand.setAttribute('y1', '50');
        hourHand.setAttribute('x2', '50');
        hourHand.setAttribute('y2', '28');
        hourHand.setAttribute('class', 'clock-hand clock-hand-hour');
        hourHand.setAttribute('data-hand', 'hour');
        svg.appendChild(hourHand);

        // Minute hand
        var minuteHand = document.createElementNS(ns, 'line');
        minuteHand.setAttribute('x1', '50');
        minuteHand.setAttribute('y1', '50');
        minuteHand.setAttribute('x2', '50');
        minuteHand.setAttribute('y2', '18');
        minuteHand.setAttribute('class', 'clock-hand clock-hand-minute');
        minuteHand.setAttribute('data-hand', 'minute');
        svg.appendChild(minuteHand);

        // Second hand (optional)
        if (showSeconds) {
            var secondHand = document.createElementNS(ns, 'line');
            secondHand.setAttribute('x1', '50');
            secondHand.setAttribute('y1', '55');
            secondHand.setAttribute('x2', '50');
            secondHand.setAttribute('y2', '15');
            secondHand.setAttribute('class', 'clock-hand clock-hand-second');
            secondHand.setAttribute('data-hand', 'second');
            svg.appendChild(secondHand);
        }

        // Center dot
        var center = document.createElementNS(ns, 'circle');
        center.setAttribute('cx', '50');
        center.setAttribute('cy', '50');
        center.setAttribute('r', '3');
        center.setAttribute('class', 'clock-center');
        svg.appendChild(center);

        el.innerHTML = '';
        el.appendChild(svg);
        el._clockSvg = svg;
    }

    /**
     * Update analog clock hands
     * @param {HTMLElement} el - Clock element
     */
    function updateAnalogClock(el) {
        var format = el.getAttribute('data-format') || config.format;
        var timezone = el.getAttribute('data-timezone') || config.timezone;
        var is24h = format === '24h';

        // Get current time (with timezone if specified)
        var now = new Date();
        var hours, minutes, seconds;

        if (timezone) {
            try {
                var formatter = new Intl.DateTimeFormat('en-US', {
                    hour: 'numeric',
                    minute: 'numeric',
                    second: 'numeric',
                    hour12: false,
                    timeZone: timezone
                });
                var parts = formatter.formatToParts(now);
                hours = parseInt(parts.find(function(p) { return p.type === 'hour'; }).value, 10);
                minutes = parseInt(parts.find(function(p) { return p.type === 'minute'; }).value, 10);
                seconds = parseInt(parts.find(function(p) { return p.type === 'second'; }).value, 10);
            } catch (e) {
                hours = now.getHours();
                minutes = now.getMinutes();
                seconds = now.getSeconds();
            }
        } else {
            hours = now.getHours();
            minutes = now.getMinutes();
            seconds = now.getSeconds();
        }

        // Create SVG if not exists
        if (!el._clockSvg) {
            var size = ANALOG_SIZES[el.getAttribute('data-size') || 'md'] || 100;
            createAnalogFace(el, size);
        }

        var svg = el._clockSvg;

        // Calculate angles
        var hourDivisor = is24h ? 24 : 12;
        var hourAngle = ((hours % hourDivisor) + minutes / 60) * (360 / hourDivisor) - 90;
        var minuteAngle = (minutes + seconds / 60) * 6 - 90;
        var secondAngle = seconds * 6 - 90;

        // Update hand rotations
        var hourHand = svg.querySelector('[data-hand="hour"]');
        var minuteHand = svg.querySelector('[data-hand="minute"]');
        var secondHand = svg.querySelector('[data-hand="second"]');

        if (hourHand) {
            hourHand.setAttribute('transform', 'rotate(' + hourAngle + ' 50 50)');
        }
        if (minuteHand) {
            minuteHand.setAttribute('transform', 'rotate(' + minuteAngle + ' 50 50)');
        }
        if (secondHand) {
            secondHand.setAttribute('transform', 'rotate(' + secondAngle + ' 50 50)');
        }
    }

    /**
     * Update clock showing both analog and digital
     * @param {HTMLElement} el - Clock element
     */
    function updateBothClock(el) {
        var size = ANALOG_SIZES[el.getAttribute('data-size') || 'md'] || 100;

        // Create wrapper structure if not exists
        if (!el._clockBoth) {
            el.innerHTML = '';
            el.style.display = 'inline-flex';
            el.style.flexDirection = 'column';
            el.style.alignItems = 'center';
            el.style.gap = '8px';

            // Analog container
            var analogContainer = document.createElement('div');
            analogContainer.className = 'clock-both-analog';
            el.appendChild(analogContainer);

            // Create the analog face in the container
            createAnalogFace(analogContainer, size);

            // Digital container
            var digitalContainer = document.createElement('div');
            digitalContainer.className = 'clock-both-digital clock-lg mono';
            el.appendChild(digitalContainer);

            el._clockBoth = true;
            el._analogContainer = analogContainer;
            el._digitalContainer = digitalContainer;

            // Transfer SVG reference
            el._clockSvg = analogContainer._clockSvg;
        }

        // Update analog hands
        var analogContainer = el._analogContainer;
        if (analogContainer && analogContainer._clockSvg) {
            // Temporarily set SVG ref for updateAnalogClock
            var origSvg = el._clockSvg;
            el._clockSvg = analogContainer._clockSvg;
            updateAnalogClock(el);
            el._clockSvg = origSvg;
        }

        // Update digital display
        var digitalContainer = el._digitalContainer;
        if (digitalContainer) {
            var newText = formatTime(el);
            if (digitalContainer.textContent !== newText) {
                digitalContainer.textContent = newText;
            }
        }
    }

    // =========================================================================
    // COUNTDOWN TIMER
    // =========================================================================

    /**
     * Parse countdown value to milliseconds
     * @param {string} value - Duration ("5:00", "1:30:00", "300") or ISO date
     * @returns {number} Target timestamp or duration in ms
     */
    function parseCountdown(value) {
        // Check if ISO date
        if (value.indexOf('T') !== -1 || value.indexOf('-') !== -1) {
            return new Date(value).getTime();
        }

        // Parse duration format (HH:MM:SS, MM:SS, or seconds)
        var parts = value.split(':');
        var parsedParts = [];
        for (var i = 0; i < parts.length; i++) {
            parsedParts.push(parseInt(parts[i], 10) || 0);
        }

        var seconds = 0;
        if (parsedParts.length === 3) {
            // HH:MM:SS
            seconds = parsedParts[0] * 3600 + parsedParts[1] * 60 + parsedParts[2];
        } else if (parsedParts.length === 2) {
            // MM:SS
            seconds = parsedParts[0] * 60 + parsedParts[1];
        } else {
            // Just seconds
            seconds = parsedParts[0];
        }

        return seconds * 1000;
    }

    /**
     * Format remaining milliseconds for display
     * @param {number} ms - Remaining milliseconds
     * @param {string} format - Display format (hms, ms, s, auto)
     * @returns {string|null}
     */
    function formatCountdown(ms, format) {
        if (ms <= 0) return null; // Signal complete

        var totalSeconds = Math.ceil(ms / 1000);
        var hours = Math.floor(totalSeconds / 3600);
        var minutes = Math.floor((totalSeconds % 3600) / 60);
        var seconds = totalSeconds % 60;

        var pad = function(n) { return n < 10 ? '0' + n : String(n); };

        if (format === 's') {
            return String(totalSeconds);
        } else if (format === 'ms' || (format === 'auto' && hours === 0)) {
            return pad(minutes) + ':' + pad(seconds);
        } else {
            return pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
        }
    }

    /**
     * Update a countdown element
     * @param {HTMLElement} el
     */
    function updateCountdown(el) {
        var data = el._clockCountdown;

        // Initialize countdown data if not set
        if (!data) {
            var countdownValue = el.getAttribute('data-countdown');
            var parsed = parseCountdown(countdownValue);

            // Determine if it's a duration or target timestamp
            if (countdownValue.indexOf('T') !== -1 || countdownValue.indexOf('-') !== -1) {
                // It's a target date
                data = { targetTime: parsed };
            } else {
                // It's a duration - calculate target from now
                data = { targetTime: Date.now() + parsed };
            }

            data.format = el.getAttribute('data-countdown-format') || 'auto';
            data.completeText = el.getAttribute('data-countdown-complete') || '00:00';
            data.completed = false;
            el._clockCountdown = data;
        }

        var remaining = data.targetTime - Date.now();
        var formatted = formatCountdown(remaining, data.format);

        // Update warning/danger classes for low time
        if (remaining > 30000) {
            el.classList.remove('countdown-warning', 'countdown-danger');
        } else if (remaining > 10000) {
            el.classList.add('countdown-warning');
            el.classList.remove('countdown-danger');
        } else if (remaining > 0) {
            el.classList.remove('countdown-warning');
            el.classList.add('countdown-danger');
        }

        if (formatted === null) {
            // Countdown complete
            if (!data.completed) {
                data.completed = true;
                el.textContent = data.completeText;
                el.classList.remove('countdown-warning', 'countdown-danger');
                el.classList.add('countdown-complete');

                E.emit(el, 'funky.clock.countdown-complete', {
                    element: el,
                    timestamp: Date.now()
                });
            }
        } else if (el.textContent !== formatted) {
            el.textContent = formatted;
        }
    }

    /**
     * Start or reset a countdown on an element
     * @param {HTMLElement|string} target - Element or selector
     * @param {number|string} duration - Duration in ms or format string
     * @param {Object} [options] - Options
     * @returns {HTMLElement}
     */
    function countdown(target, duration, options) {
        var el = typeof target === 'string' ? D.one(target) : target;
        if (!el) return null;
        if (el.el) el = el.el; // Unwrap ElementWrapper

        options = options || {};

        var ms = typeof duration === 'number' ? duration : parseCountdown(duration);
        var targetTime = Date.now() + ms;

        el._clockCountdown = {
            targetTime: targetTime,
            format: options.format || el.getAttribute('data-countdown-format') || 'auto',
            completeText: options.completeText || el.getAttribute('data-countdown-complete') || '00:00',
            completed: false
        };

        // Reset classes
        el.classList.remove('countdown-complete', 'countdown-warning', 'countdown-danger');

        // Ensure element is tracked
        if (!el._clock) {
            el._clock = true;
            instances.push(el);
        }

        // Ensure timer is running
        startTimer();

        E.emit(el, 'funky.clock.countdown-started', {
            element: el,
            duration: ms,
            targetTime: targetTime
        });

        // Immediate update
        updateCountdown(el);

        return el;
    }

    /**
     * Add time to an existing countdown
     * @param {HTMLElement|string} target
     * @param {number} ms - Milliseconds to add
     */
    function addTime(target, ms) {
        var el = typeof target === 'string' ? D.one(target) : target;
        if (!el) return;
        if (el.el) el = el.el; // Unwrap ElementWrapper

        if (!el._clockCountdown) return;

        el._clockCountdown.targetTime += ms;
        el._clockCountdown.completed = false;
        el.classList.remove('countdown-complete');

        E.emit(el, 'funky.clock.countdown-extended', {
            element: el,
            added: ms,
            newTarget: el._clockCountdown.targetTime
        });
    }

    /**
     * Get remaining time for a countdown
     * @param {HTMLElement|string} target
     * @returns {number} Remaining milliseconds
     */
    function getRemaining(target) {
        var el = typeof target === 'string' ? D.one(target) : target;
        if (!el) return 0;
        if (el.el) el = el.el; // Unwrap ElementWrapper

        if (!el._clockCountdown) return 0;

        return Math.max(0, el._clockCountdown.targetTime - Date.now());
    }

    // =========================================================================
    // STOPWATCH (COUNT-UP TIMER)
    // =========================================================================

    var stopwatchInstances = [];
    var stopwatchAnimationFrame = null;

    /**
     * Format elapsed time for stopwatch display
     * @param {number} ms - Elapsed milliseconds
     * @param {Object} options - Format options
     * @returns {string}
     */
    function formatStopwatch(ms, options) {
        options = options || {};
        var showMs = options.showMs !== false;
        var msDigits = options.msDigits || 2;
        var compact = options.compact || false;

        var totalSeconds = Math.floor(ms / 1000);
        var hours = Math.floor(totalSeconds / 3600);
        var minutes = Math.floor((totalSeconds % 3600) / 60);
        var seconds = totalSeconds % 60;
        var milliseconds = ms % 1000;

        var pad = function(n, digits) {
            digits = digits || 2;
            var str = String(n);
            while (str.length < digits) str = '0' + str;
            return str;
        };

        var result = '';

        if (hours > 0 || !compact) {
            if (hours > 0) {
                result = hours + ':' + pad(minutes) + ':' + pad(seconds);
            } else if (minutes > 0 || !compact) {
                result = minutes + ':' + pad(seconds);
            } else {
                result = String(seconds);
            }
        } else {
            result = minutes + ':' + pad(seconds);
        }

        if (showMs) {
            var msStr = pad(Math.floor(milliseconds / (1000 / Math.pow(10, msDigits))), msDigits);
            result += '.' + msStr;
        }

        return result + 's';
    }

    /**
     * Update all running stopwatches (called via requestAnimationFrame for smooth ms)
     */
    function updateStopwatches() {
        var now = Date.now();
        var hasRunning = false;

        for (var i = 0; i < stopwatchInstances.length; i++) {
            var sw = stopwatchInstances[i];
            if (!sw.running) continue;
            if (!document.contains(sw.el)) {
                // Remove orphaned instance
                stopwatchInstances.splice(i, 1);
                i--;
                continue;
            }

            hasRunning = true;
            var elapsed = now - sw.startTime + sw.pausedTime;
            var formatted = formatStopwatch(elapsed, sw.options);

            if (sw.el.textContent !== formatted) {
                sw.el.textContent = formatted;
            }

            // Emit tick event
            if (sw.onTick) {
                sw.onTick(elapsed, formatted);
            }
        }

        if (hasRunning) {
            stopwatchAnimationFrame = requestAnimationFrame(updateStopwatches);
        } else {
            stopwatchAnimationFrame = null;
        }
    }

    /**
     * Start animation loop for stopwatches
     */
    function startStopwatchLoop() {
        if (stopwatchAnimationFrame) return;
        stopwatchAnimationFrame = requestAnimationFrame(updateStopwatches);
    }

    /**
     * Start a stopwatch on an element
     * @param {HTMLElement|string} target - Element or selector
     * @param {Object} [options] - Options
     * @param {boolean} [options.showMs=true] - Show milliseconds
     * @param {number} [options.msDigits=2] - Number of ms digits (1-3)
     * @param {boolean} [options.compact=false] - Hide leading zeros
     * @param {Function} [options.onTick] - Callback on each frame
     * @param {Function} [options.onStop] - Callback when stopped
     * @returns {Object} Stopwatch controller
     */
    function stopwatch(target, options) {
        var el = typeof target === 'string' ? D.one(target) : target;
        if (!el) return null;
        if (el.el) el = el.el; // Unwrap ElementWrapper

        options = options || {};

        // Check if stopwatch already exists for this element
        var existing = null;
        for (var i = 0; i < stopwatchInstances.length; i++) {
            if (stopwatchInstances[i].el === el) {
                existing = stopwatchInstances[i];
                break;
            }
        }

        if (existing) {
            // Reset existing stopwatch
            existing.startTime = Date.now();
            existing.pausedTime = 0;
            existing.running = true;
            existing.options = options;
            existing.onTick = options.onTick;
            existing.onStop = options.onStop;
        } else {
            // Create new stopwatch instance
            existing = {
                el: el,
                startTime: Date.now(),
                pausedTime: 0,
                running: true,
                options: options,
                onTick: options.onTick,
                onStop: options.onStop
            };
            stopwatchInstances.push(existing);
        }

        // Initial render
        el.textContent = formatStopwatch(0, options);

        // Start animation loop
        startStopwatchLoop();

        E.emit(el, 'funky.clock.stopwatch-started', { timestamp: Date.now() });

        // Return controller
        var sw = existing;
        return {
            /**
             * Stop the stopwatch and return elapsed time
             * @returns {number} Elapsed milliseconds
             */
            stop: function() {
                if (!sw.running) return sw.pausedTime;
                sw.running = false;
                var elapsed = Date.now() - sw.startTime + sw.pausedTime;
                sw.pausedTime = elapsed;

                if (sw.onStop) {
                    sw.onStop(elapsed, formatStopwatch(elapsed, sw.options));
                }

                E.emit(sw.el, 'funky.clock.stopwatch-stopped', {
                    elapsed: elapsed,
                    formatted: formatStopwatch(elapsed, sw.options)
                });

                return elapsed;
            },

            /**
             * Pause the stopwatch
             */
            pause: function() {
                if (!sw.running) return;
                sw.running = false;
                sw.pausedTime += Date.now() - sw.startTime;
                E.emit(sw.el, 'funky.clock.stopwatch-paused', { elapsed: sw.pausedTime });
            },

            /**
             * Resume the stopwatch
             */
            resume: function() {
                if (sw.running) return;
                sw.running = true;
                sw.startTime = Date.now();
                startStopwatchLoop();
                E.emit(sw.el, 'funky.clock.stopwatch-resumed', { elapsed: sw.pausedTime });
            },

            /**
             * Reset the stopwatch
             */
            reset: function() {
                sw.startTime = Date.now();
                sw.pausedTime = 0;
                sw.el.textContent = formatStopwatch(0, sw.options);
                E.emit(sw.el, 'funky.clock.stopwatch-reset', {});
            },

            /**
             * Get elapsed time in milliseconds
             * @returns {number}
             */
            getElapsed: function() {
                if (sw.running) {
                    return Date.now() - sw.startTime + sw.pausedTime;
                }
                return sw.pausedTime;
            },

            /**
             * Check if running
             * @returns {boolean}
             */
            isRunning: function() {
                return sw.running;
            },

            /**
             * Update display options
             * @param {Object} newOptions
             */
            setOptions: function(newOptions) {
                sw.options = Object.assign({}, sw.options, newOptions);
            }
        };
    }

    /**
     * Stop all stopwatches
     */
    function stopAllStopwatches() {
        for (var i = 0; i < stopwatchInstances.length; i++) {
            stopwatchInstances[i].running = false;
        }
        if (stopwatchAnimationFrame) {
            cancelAnimationFrame(stopwatchAnimationFrame);
            stopwatchAnimationFrame = null;
        }
    }

    // =========================================================================
    // ELEMENT UPDATE
    // =========================================================================

    /**
     * Update a single clock element
     * @param {HTMLElement} el
     */
    function updateElement(el) {
        // Check if countdown mode (either via attribute or programmatic API)
        var countdownAttr = el.getAttribute('data-countdown');
        if (countdownAttr || el._clockCountdown) {
            updateCountdown(el);
            return;
        }

        // Check display style
        var style = el.getAttribute('data-style') || 'digital';

        if (style === 'analog') {
            updateAnalogClock(el);
            return;
        }

        if (style === 'both') {
            // Both: analog + digital in same element
            updateBothClock(el);
            return;
        }

        // Digital clock
        var newText = formatTime(el);
        if (el.textContent !== newText) {
            el.textContent = newText;
        }
    }

    // =========================================================================
    // SCHEDULING API
    // =========================================================================

    /**
     * Schedule a callback after a delay
     * @param {number} delay - Delay in milliseconds
     * @param {Function} callback - Function to call
     * @param {Object} [options] - Options
     * @param {boolean} [options.repeat] - Repeat every `delay` ms
     * @param {string} [options.id] - Custom task ID
     * @returns {string} Task ID for cancellation
     */
    function after(delay, callback, options) {
        options = options || {};
        var id = options.id || 'task_' + (++taskIdCounter);
        var now = Date.now();

        var task = {
            id: id,
            callback: callback,
            triggerAt: now + delay,
            delay: delay,
            repeat: options.repeat || false,
            count: 0
        };

        scheduledTasks.push(task);

        // Ensure timer is running
        if (!tickTimer) {
            startTimer();
            setupVisibilityListener();
        }

        E.emit(document, 'funky.clock.scheduled', {
            id: id,
            delay: delay,
            triggerAt: task.triggerAt,
            repeat: task.repeat
        });

        return id;
    }

    /**
     * Schedule a callback at a specific time
     * @param {Date|string|number} time - When to trigger
     * @param {Function} callback - Function to call
     * @param {Object} [options] - Options
     * @returns {string} Task ID
     */
    function at(time, callback, options) {
        var triggerAt;
        if (time instanceof Date) {
            triggerAt = time.getTime();
        } else if (typeof time === 'string') {
            triggerAt = new Date(time).getTime();
        } else {
            triggerAt = time;
        }

        options = options || {};
        var id = options.id || 'task_' + (++taskIdCounter);

        var task = {
            id: id,
            callback: callback,
            triggerAt: triggerAt,
            delay: 0,
            repeat: false,
            count: 0
        };

        scheduledTasks.push(task);

        if (!tickTimer) {
            startTimer();
            setupVisibilityListener();
        }

        E.emit(document, 'funky.clock.scheduled', {
            id: id,
            triggerAt: triggerAt,
            repeat: false
        });

        return id;
    }

    /**
     * Cancel a scheduled task
     * @param {string} id - Task ID
     * @returns {boolean} True if cancelled
     */
    function cancel(id) {
        for (var i = 0; i < scheduledTasks.length; i++) {
            if (scheduledTasks[i].id === id) {
                scheduledTasks.splice(i, 1);
                E.emit(document, 'funky.clock.cancelled', { id: id });
                return true;
            }
        }
        return false;
    }

    /**
     * Get all pending scheduled tasks
     * @returns {Array}
     */
    function getScheduled() {
        var now = Date.now();
        var result = [];
        for (var i = 0; i < scheduledTasks.length; i++) {
            var t = scheduledTasks[i];
            result.push({
                id: t.id,
                triggerAt: t.triggerAt,
                delay: t.delay,
                repeat: t.repeat,
                remaining: t.triggerAt - now
            });
        }
        return result;
    }

    /**
     * Process scheduled tasks on each tick
     * @param {number} timestamp
     */
    function processScheduledTasks(timestamp) {
        for (var i = scheduledTasks.length - 1; i >= 0; i--) {
            var task = scheduledTasks[i];

            if (timestamp >= task.triggerAt) {
                task.count++;

                // Execute callback
                try {
                    task.callback({
                        id: task.id,
                        timestamp: timestamp,
                        scheduledFor: task.triggerAt,
                        count: task.count
                    });
                } catch (e) {
                    console.error('[Funky.Clock] Task error:', e);
                }

                E.emit(document, 'funky.clock.triggered', {
                    id: task.id,
                    timestamp: timestamp
                });

                if (task.repeat) {
                    // Reschedule
                    task.triggerAt = timestamp + task.delay;
                } else {
                    // Remove one-time task
                    scheduledTasks.splice(i, 1);
                }
            }
        }
    }

    // =========================================================================
    // TIMER MANAGEMENT
    // =========================================================================

    /**
     * Start the global tick timer
     */
    function startTimer() {
        if (tickTimer) return;
        tickTimer = setInterval(function() {
            if (!isPaused) {
                tick();
            }
        }, config.tickInterval);
    }

    /**
     * Stop the global tick timer
     */
    function stopTimer() {
        if (tickTimer) {
            clearInterval(tickTimer);
            tickTimer = null;
        }
    }

    /**
     * Main tick function - updates all clocks and processes tasks
     */
    function tick() {
        var now = new Date();
        var timestamp = now.getTime();

        // Update all clock instances
        for (var i = instances.length - 1; i >= 0; i--) {
            var el = instances[i];

            // Remove if not in DOM
            if (!document.contains(el)) {
                instances.splice(i, 1);
                continue;
            }

            updateElement(el);
        }

        // Process scheduled tasks
        processScheduledTasks(timestamp);

        // Emit tick event
        E.emit(document, 'funky.clock.tick', {
            timestamp: timestamp,
            time: now.toLocaleTimeString(),
            date: now.toLocaleDateString()
        });

        // Stop if no instances AND no scheduled tasks
        if (instances.length === 0 && scheduledTasks.length === 0) {
            stopTimer();
        }
    }

    // =========================================================================
    // PAGE VISIBILITY
    // =========================================================================

    /**
     * Handle visibility change (pause when hidden)
     */
    function handleVisibilityChange() {
        if (document.hidden) {
            isPaused = true;
            E.emit(document, 'funky.clock.hidden', { instanceCount: instances.length });
        } else {
            isPaused = false;
            tick(); // Immediate update when visible again
            E.emit(document, 'funky.clock.visible', { instanceCount: instances.length });
        }
    }

    /**
     * Setup visibility change listener
     */
    function setupVisibilityListener() {
        if (visibilityListenerAdded) return;
        if (typeof document.hidden !== 'undefined') {
            document.addEventListener('visibilitychange', handleVisibilityChange);
            visibilityListenerAdded = true;
        }
    }

    // =========================================================================
    // INITIALIZATION
    // =========================================================================

    /**
     * Initialize clock elements in a scope
     * @param {HTMLElement|string} [scope] - Container to search in, or a clock element itself
     * @returns {number} Number of initialized clocks
     */
    function init(scope) {
        var container = document;
        var directElement = null;
        
        if (scope) {
            if (typeof scope === 'string') {
                container = document.querySelector(scope) || document;
            } else if (scope.el) {
                container = scope.el; // Unwrap ElementWrapper
            } else {
                container = scope;
            }
            
            // Check if the passed element itself is a clock element
            if (container !== document && container.hasAttribute && container.hasAttribute('data-clock')) {
                directElement = container;
            }
        }

        var elements;
        if (directElement) {
            // Direct element passed - use it as the single clock
            elements = [directElement];
        } else {
            // Search for clock elements within container
            elements = container.querySelectorAll(SELECTOR);
        }
        
        var count = 0;

        for (var i = 0; i < elements.length; i++) {
            var el = elements[i];
            if (el._clock) continue;

            el._clock = true;
            instances.push(el);
            updateElement(el); // Immediate first render
            count++;
        }

        if (instances.length > 0 && !tickTimer) {
            startTimer();
            setupVisibilityListener();
        }

        if (count > 0) {
            E.emit(document, 'funky.clock.init', { count: count });
        }

        return count;
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    /**
     * Pause all clocks
     */
    function pause() {
        if (isPaused) return;
        isPaused = true;
        E.emit(document, 'funky.clock.pause', { instanceCount: instances.length });
    }

    /**
     * Resume all clocks
     */
    function resume() {
        if (!isPaused) return;
        isPaused = false;
        tick();
        E.emit(document, 'funky.clock.resume', { instanceCount: instances.length });
    }

    /**
     * Check if paused
     * @returns {boolean}
     */
    function isPausedState() {
        return isPaused;
    }

    /**
     * Configure global settings
     * @param {Object} opts
     */
    function configure(opts) {
        if (!opts) return;
        for (var key in opts) {
            if (opts.hasOwnProperty(key)) {
                config[key] = opts[key];
            }
        }
        // Restart timer if interval changed
        if (opts.tickInterval && tickTimer) {
            stopTimer();
            startTimer();
        }
    }

    /**
     * Get all clock instances
     * @returns {Array<HTMLElement>}
     */
    function getInstances() {
        return instances.slice();
    }

    /**
     * Get instance data for an element
     * @param {HTMLElement|string} el - Element or selector
     * @returns {Object|null} Instance data or null
     */
    function getInstance(el) {
        if (typeof el === 'string') {
            el = document.querySelector(el);
        }
        if (!el || instances.indexOf(el) === -1) {
            return null;
        }
        return {
            element: el,
            config: el._clock,
            svg: el._clockSvg,
            countdown: el._clockCountdown
        };
    }

    /**
     * Destroy a single clock instance
     * @param {HTMLElement|string} el - Element or selector
     */
    function destroy(el) {
        if (typeof el === 'string') {
            el = document.querySelector(el);
        }
        if (!el) return;

        var index = instances.indexOf(el);
        if (index > -1) {
            instances.splice(index, 1);
        }
        delete el._clock;
        delete el._clockSvg;
        delete el._clockCountdown;

        // Stop timer if no instances left
        if (instances.length === 0) {
            stopTimer();
        }
    }

    /**
     * Destroy all instances and stop timer
     */
    function destroyAll() {
        stopTimer();

        // Remove visibility change listener
        if (visibilityListenerAdded) {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            visibilityListenerAdded = false;
        }

        for (var i = 0; i < instances.length; i++) {
            delete instances[i]._clock;
            delete instances[i]._clockSvg;
            delete instances[i]._clockCountdown;
        }
        instances = [];
        scheduledTasks = [];
    }

    // =========================================================================
    // LIVEBINDING INTEGRATION
    // =========================================================================

    /**
     * Create a clock element with options
     * @param {Object} options
     * @returns {HTMLElement}
     */
    function createBound(options) {
        options = options || {};
        var el = document.createElement('span');
        el.setAttribute('data-clock', '');

        if (options.style) el.setAttribute('data-style', options.style);
        if (options.format) el.setAttribute('data-format', options.format);
        if (options.seconds === false) el.setAttribute('data-seconds', 'false');
        if (options.date) el.setAttribute('data-date', options.date);
        if (options.timezone) el.setAttribute('data-timezone', options.timezone);
        if (options.size) el.setAttribute('data-size', options.size);

        return el;
    }

    /**
     * Subscribe to clock ticks
     * @param {Function} callback - Called each tick with { timestamp, time, date }
     * @returns {Function} Unbind function
     */
    function onTick(callback) {
        var handler = function(e) {
            callback(e.detail);
        };
        document.addEventListener('funky.clock.tick', handler);

        // Return unbind function
        return function() {
            document.removeEventListener('funky.clock.tick', handler);
        };
    }

    // =========================================================================
    // EXTERNAL EVENT LISTENERS
    // =========================================================================

    var externalListenersSetup = false;

    /**
     * Setup external event listeners for scheduling via events
     */
    function setupExternalListeners() {
        if (externalListenersSetup) return;
        externalListenersSetup = true;

        // Listen for schedule requests via events
        document.addEventListener('funky.clock.schedule', function(e) {
            var data = e.detail || {};
            if (data.delay && data.callback) {
                after(data.delay, data.callback, data.options);
            } else if (data.at && data.callback) {
                at(data.at, data.callback, data.options);
            }
        });

        // Listen for cancel requests
        document.addEventListener('funky.clock.cancel-request', function(e) {
            var id = e.detail && e.detail.id;
            if (id) {
                cancel(id);
            }
        });
    }

    // =========================================================================
    // AUTO-INIT & REGISTRATION
    // =========================================================================

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            init();
            setupExternalListeners();
        });
    } else {
        init();
        setupExternalListeners();
    }

    // SPA support
    document.addEventListener('funky.spa.pageload', function() {
        setTimeout(function() { init(); }, 50);
    });

    // Register component
    Funky.register('Clock', {
        init: init,
        configure: configure,
        pause: pause,
        resume: resume,
        isPaused: isPausedState,
        getInstance: getInstance,
        getInstances: getInstances,
        destroy: destroy,
        destroyAll: destroyAll,

        // Scheduling API
        after: after,
        at: at,
        cancel: cancel,
        getScheduled: getScheduled,

        // Countdown API
        countdown: countdown,
        addTime: addTime,
        getRemaining: getRemaining,

        // Stopwatch API
        stopwatch: stopwatch,
        stopAllStopwatches: stopAllStopwatches,

        // LiveBinding
        createBound: createBound,
        onTick: onTick
    });

})(window);

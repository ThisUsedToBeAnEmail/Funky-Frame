/**
 * Funky Video - Simple Video Player Component
 * 
 * A lightweight video wrapper with minimal overlay controls.
 * Supports play/pause, rewind, and loop functionality.
 * 
 * Usage:
 *   var player = Funky.Video.init('#container', {
 *     src: '/realtime.mp4',
 *     loop: true,
 *     autoplay: false,
 *     muted: false
 *   });
 *   
 *   player.play();
 *   player.pause();
 *   player.rewind();
 *   player.destroy();
 * 
 * @version 1.0.4
 */
(function(window) {
	'use strict';

	// Ensure Funky registry exists
	if (!window.Funky || !window.Funky.register) {
		console.error('[Funky.Video] Registry not found. Load namespace.js first.');
		return;
	}

	// Prevent double registration
	if (typeof Funky !== 'undefined' && Funky.isRegistered && Funky.isRegistered('Video')) {
		return;
	}

	/**
	 * Video component factory
	 */
	var Video = {
		instances: [],
		instanceCounter: 0,

		/**
		 * Default configuration
		 */
		defaults: {
			src: '',
			loop: false,
			autoplay: false,
			muted: false,
			controls: true,
			rewindSeconds: 10,
			poster: ''
		},

		/**
		 * Initialise a new video player
		 * @param {string|HTMLElement} container - Container selector or element
		 * @param {Object} options - Configuration options
		 * @returns {VideoInstance}
		 */
		init: function(container, options) {
			var instance = new VideoInstance(container, options);
			this.instances.push(instance);
			return instance;
		},

		/**
		 * Destroy all instances
		 */
		destroyAll: function() {
			this.instances.forEach(function(instance) {
				instance.destroy();
			});
			this.instances = [];
		},

		/**
		 * Get instance by ID
		 * @param {string} id - Instance ID
		 * @returns {VideoInstance|null}
		 */
		getInstance: function(id) {
			for (var i = 0; i < this.instances.length; i++) {
				if (this.instances[i].id === id) {
					return this.instances[i];
				}
			}
			return null;
		},

		/**
		 * Destroy instance by ID
		 * @param {string} id - Instance ID
		 */
		destroy: function(id) {
			var instance = this.getInstance(id);
			if (instance) {
				instance.destroy();
				var idx = this.instances.indexOf(instance);
				if (idx > -1) {
					this.instances.splice(idx, 1);
				}
			}
		}
	};

	/**
	 * VideoInstance constructor
	 * @param {string|HTMLElement} container - Container selector or element
	 * @param {Object} options - Configuration options
	 */
	function VideoInstance(container, options) {
		this.id = 'video-' + (++Video.instanceCounter);
		this.container = typeof container === 'string' 
			? document.querySelector(container) 
			: container;
		
		if (!this.container) {
			console.error('[Funky.Video] Container not found:', container);
			return;
		}

		// Merge options with defaults
		this.options = Object.assign({}, Video.defaults, options);
		
		// State
		this.isPlaying = false;
		this.video = null;
		this.controls = null;
		this.progressBar = null;
		this.timeDisplay = null;

		// Bound handlers
		this._boundHandlers = {};

		this._init();
	}

	/**
	 * Initialise the video player
	 */
	VideoInstance.prototype._init = function() {
		this._createDOM();
		this._bindEvents();

		if (this.options.autoplay) {
			this.play();
		}
	};

	/**
	 * Create the DOM structure
	 */
	VideoInstance.prototype._createDOM = function() {
		// Create wrapper
		this.wrapper = document.createElement('div');
		this.wrapper.className = 'funky-video';
		this.wrapper.id = this.id;

		// Create video element
		this.video = document.createElement('video');
		this.video.className = 'funky-video-element';
		this.video.src = this.options.src;
		this.video.loop = this.options.loop;
		this.video.muted = this.options.muted;
		this.video.playsInline = true;
		
		if (this.options.poster) {
			this.video.poster = this.options.poster;
		}

		this.wrapper.appendChild(this.video);

		// Create controls overlay if enabled
		if (this.options.controls) {
			this._createControls();
		}

		this.container.appendChild(this.wrapper);
	};

	/**
	 * Create control elements
	 */
	VideoInstance.prototype._createControls = function() {
		// Controls container
		this.controls = document.createElement('div');
		this.controls.className = 'funky-video-controls';

		// Play/Pause button
		this.playBtn = document.createElement('button');
		this.playBtn.className = 'funky-video-btn funky-video-play';
		this.playBtn.appendChild(Funky.Dom.icon('fas fa-play').el);
		this.playBtn.setAttribute('aria-label', 'Play');
		this.playBtn.setAttribute('type', 'button');

		// Rewind button
		this.rewindBtn = document.createElement('button');
		this.rewindBtn.className = 'funky-video-btn funky-video-rewind';
		this.rewindBtn.appendChild(Funky.Dom.icon('fas fa-undo').el);
		this.rewindBtn.setAttribute('aria-label', 'Rewind ' + this.options.rewindSeconds + ' seconds');
		this.rewindBtn.setAttribute('type', 'button');

		// Progress bar container (ARIA slider for accessibility)
		this.progressContainer = document.createElement('div');
		this.progressContainer.className = 'funky-video-progress-container';
		this.progressContainer.setAttribute('role', 'slider');
		this.progressContainer.setAttribute('aria-label', 'Video progress');
		this.progressContainer.setAttribute('aria-valuemin', '0');
		this.progressContainer.setAttribute('aria-valuemax', '100');
		this.progressContainer.setAttribute('aria-valuenow', '0');
		this.progressContainer.setAttribute('aria-valuetext', '0:00 of 0:00');
		this.progressContainer.setAttribute('tabindex', '0');

		this.progressBar = document.createElement('div');
		this.progressBar.className = 'funky-video-progress';

		this.progressFill = document.createElement('div');
		this.progressFill.className = 'funky-video-progress-fill';

		this.progressBar.appendChild(this.progressFill);
		this.progressContainer.appendChild(this.progressBar);

		// Time display (live region for screen readers)
		this.timeDisplay = document.createElement('span');
		this.timeDisplay.className = 'funky-video-time';
		this.timeDisplay.textContent = '0:00 / 0:00';
		this.timeDisplay.setAttribute('aria-live', 'off'); // Updated on seek, not continuous

		// Mute button
		this.muteBtn = document.createElement('button');
		this.muteBtn.className = 'funky-video-btn funky-video-mute';
		this.muteBtn.appendChild(Funky.Dom.icon(this.options.muted ? 'fas fa-volume-mute' : 'fas fa-volume-up').el);
		this.muteBtn.setAttribute('aria-label', 'Toggle mute');
		this.muteBtn.setAttribute('type', 'button');

		// Volume slider (ARIA slider for accessibility)
		this.volumeContainer = document.createElement('div');
		this.volumeContainer.className = 'funky-video-volume-container';

		this.volumeSlider = document.createElement('input');
		this.volumeSlider.type = 'range';
		this.volumeSlider.className = 'funky-video-volume';
		this.volumeSlider.min = '0';
		this.volumeSlider.max = '100';
		this.volumeSlider.value = this.options.muted ? '0' : '100';
		this.volumeSlider.setAttribute('aria-label', 'Volume');
		this.volumeSlider.setAttribute('aria-valuemin', '0');
		this.volumeSlider.setAttribute('aria-valuemax', '100');
		this.volumeSlider.setAttribute('aria-valuenow', this.options.muted ? '0' : '100');

		this.volumeContainer.appendChild(this.muteBtn);
		this.volumeContainer.appendChild(this.volumeSlider);

		// Assemble controls
		this.controls.appendChild(this.playBtn);
		this.controls.appendChild(this.rewindBtn);
		this.controls.appendChild(this.progressContainer);
		this.controls.appendChild(this.timeDisplay);
		this.controls.appendChild(this.volumeContainer);

		this.wrapper.appendChild(this.controls);
	};

	/**
	 * Bind event handlers
	 */
	VideoInstance.prototype._bindEvents = function() {
		var self = this;

		// Video events
		this._boundHandlers.timeupdate = function() { self._onTimeUpdate(); };
		this._boundHandlers.ended = function() { self._onEnded(); };
		this._boundHandlers.loadedmetadata = function() { self._onLoadedMetadata(); };
		this._boundHandlers.play = function() { self._onPlay(); };
		this._boundHandlers.pause = function() { self._onPause(); };

		this.video.addEventListener('timeupdate', this._boundHandlers.timeupdate);
		this.video.addEventListener('ended', this._boundHandlers.ended);
		this.video.addEventListener('loadedmetadata', this._boundHandlers.loadedmetadata);
		this.video.addEventListener('play', this._boundHandlers.play);
		this.video.addEventListener('pause', this._boundHandlers.pause);

		// Control events
		if (this.options.controls) {
			this._boundHandlers.playClick = function() { self.toggle(); };
			this._boundHandlers.rewindClick = function() { self.rewind(); };
			this._boundHandlers.muteClick = function() { self.toggleMute(); };
			this._boundHandlers.progressClick = function(e) { self._seekTo(e); };
			this._boundHandlers.wrapperClick = function(e) { 
				if (e.target === self.video || e.target === self.wrapper) {
					self.toggle();
				}
			};

			this.playBtn.addEventListener('click', this._boundHandlers.playClick);
			this.rewindBtn.addEventListener('click', this._boundHandlers.rewindClick);
			this.muteBtn.addEventListener('click', this._boundHandlers.muteClick);
			this.progressContainer.addEventListener('click', this._boundHandlers.progressClick);
			this.wrapper.addEventListener('click', this._boundHandlers.wrapperClick);

			// Volume slider event
			this._boundHandlers.volumeInput = function(e) {
				var volume = parseInt(e.target.value, 10) / 100;
				self.video.volume = volume;
				self.video.muted = volume === 0;
				self._updateMuteButton();
				// Update ARIA
				self.volumeSlider.setAttribute('aria-valuenow', e.target.value);
			};
			this.volumeSlider.addEventListener('input', this._boundHandlers.volumeInput);

			// Progress bar keyboard navigation (ARIA slider pattern)
			this._boundHandlers.progressKeydown = function(e) {
				var skipAmount = 5; // seconds
				var handled = false;

				switch (e.key) {
					case 'ArrowLeft':
					case 'ArrowDown':
						self.video.currentTime = Math.max(0, self.video.currentTime - skipAmount);
						handled = true;
						break;
					case 'ArrowRight':
					case 'ArrowUp':
						self.video.currentTime = Math.min(self.video.duration, self.video.currentTime + skipAmount);
						handled = true;
						break;
					case 'Home':
						self.video.currentTime = 0;
						handled = true;
						break;
					case 'End':
						self.video.currentTime = self.video.duration;
						handled = true;
						break;
					case 'PageUp':
						self.video.currentTime = Math.min(self.video.duration, self.video.currentTime + 30);
						handled = true;
						break;
					case 'PageDown':
						self.video.currentTime = Math.max(0, self.video.currentTime - 30);
						handled = true;
						break;
				}

				if (handled) {
					e.preventDefault();
					e.stopPropagation();
					// Announce position change
					if (Funky.Announce) {
						Funky.Announce.polite(self._formatTime(self.video.currentTime) + ' of ' + self._formatTime(self.video.duration));
					}
				}
			};
			this.progressContainer.addEventListener('keydown', this._boundHandlers.progressKeydown);
		}

		// Keyboard controls
		this._boundHandlers.keydown = function(e) { self._onKeyDown(e); };
		this.wrapper.setAttribute('tabindex', '0');
		this.wrapper.addEventListener('keydown', this._boundHandlers.keydown);
		
		// Register with centralized keyboard manager
		this._registerKeyboardShortcuts();
	};

	/**
	 * Register keyboard shortcuts with Funky.Keyboard
	 */
	VideoInstance.prototype._registerKeyboardShortcuts = function() {
		var self = this;
		var scope = '#' + this.wrapper.id;
		
		// Only register if keyboard manager is available
		if (!Funky.Keyboard) {
			this._useFallbackKeyboard = true;
			return;
		}
		
		this._keyboardUnregisters = [
			Funky.Keyboard.register({
				key: 'space',
				scope: scope,
				handler: function() { self.toggle(); },
				description: 'Play/Pause',
				group: 'Video'
			}),
			Funky.Keyboard.register({
				key: 'k',
				scope: scope,
				handler: function() { self.toggle(); },
				description: 'Play/Pause (alt)',
				group: 'Video'
			}),
			Funky.Keyboard.register({
				key: 'left',
				scope: scope,
				handler: function() { self.rewind(); },
				description: 'Rewind 10s',
				group: 'Video'
			}),
			Funky.Keyboard.register({
				key: 'right',
				scope: scope,
				handler: function() { self.forward(); },
				description: 'Forward 10s',
				group: 'Video'
			}),
			Funky.Keyboard.register({
				key: 'm',
				scope: scope,
				handler: function() { self.toggleMute(); },
				description: 'Toggle mute',
				group: 'Video'
			}),
			Funky.Keyboard.register({
				key: 'home',
				scope: scope,
				handler: function() { self.video.currentTime = 0; },
				description: 'Jump to start',
				group: 'Video'
			}),
			Funky.Keyboard.register({
				key: 'end',
				scope: scope,
				handler: function() { self.video.currentTime = self.video.duration; },
				description: 'Jump to end',
				group: 'Video'
			})
		];
	};

	/**
	 * Handle keyboard input (fallback when Funky.Keyboard not available)
	 */
	VideoInstance.prototype._onKeyDown = function(e) {
		// Only use fallback if Funky.Keyboard was not available
		if (!this._useFallbackKeyboard) return;
		
		switch (e.key) {
			case ' ':
			case 'k':
				e.preventDefault();
				this.toggle();
				break;
			case 'ArrowLeft':
				e.preventDefault();
				this.rewind();
				break;
			case 'ArrowRight':
				e.preventDefault();
				this.forward();
				break;
			case 'm':
				e.preventDefault();
				this.toggleMute();
				break;
			case 'Home':
				e.preventDefault();
				this.video.currentTime = 0;
				break;
			case 'End':
				e.preventDefault();
				this.video.currentTime = this.video.duration;
				break;
		}
	};

	/**
	 * Update progress bar and time display
	 */
	VideoInstance.prototype._onTimeUpdate = function() {
		if (!this.video.duration) return;

		var progress = (this.video.currentTime / this.video.duration) * 100;
		this.progressFill.style.width = progress + '%';

		var currentFormatted = this._formatTime(this.video.currentTime);
		var durationFormatted = this._formatTime(this.video.duration);

		if (this.timeDisplay) {
			this.timeDisplay.textContent = currentFormatted + ' / ' + durationFormatted;
		}

		// Update ARIA attributes for progress slider
		if (this.progressContainer) {
			this.progressContainer.setAttribute('aria-valuenow', Math.round(progress));
			this.progressContainer.setAttribute('aria-valuetext', currentFormatted + ' of ' + durationFormatted);
		}
	};

	/**
	 * Handle video ended
	 */
	VideoInstance.prototype._onEnded = function() {
		if (!this.options.loop) {
			this.isPlaying = false;
			this._updatePlayButton();
		}
	};

	/**
	 * Handle metadata loaded
	 */
	VideoInstance.prototype._onLoadedMetadata = function() {
		this._onTimeUpdate();
	};

	/**
	 * Handle play event
	 */
	VideoInstance.prototype._onPlay = function() {
		this.isPlaying = true;
		this._updatePlayButton();
	};

	/**
	 * Handle pause event
	 */
	VideoInstance.prototype._onPause = function() {
		this.isPlaying = false;
		this._updatePlayButton();
	};

	/**
	 * Update play button icon
	 */
	VideoInstance.prototype._updatePlayButton = function() {
		if (!this.playBtn) return;
		
		this.playBtn.replaceChildren(Funky.Dom.icon(this.isPlaying ? 'fas fa-pause' : 'fas fa-play').el);
		this.playBtn.setAttribute('aria-label', this.isPlaying ? 'Pause' : 'Play');
	};

	/**
	 * Seek to position on progress bar click
	 */
	VideoInstance.prototype._seekTo = function(e) {
		var rect = this.progressContainer.getBoundingClientRect();
		var percent = (e.clientX - rect.left) / rect.width;
		this.video.currentTime = percent * this.video.duration;
	};

	/**
	 * Format time in MM:SS
	 */
	VideoInstance.prototype._formatTime = function(seconds) {
		if (isNaN(seconds)) return '0:00';
		var mins = Math.floor(seconds / 60);
		var secs = Math.floor(seconds % 60);
		return mins + ':' + (secs < 10 ? '0' : '') + secs;
	};

	/**
	 * Play the video
	 */
	VideoInstance.prototype.play = function() {
		var self = this;
		this.video.play().catch(function(err) {
			console.warn('[Funky.Video] Autoplay blocked:', err.message);
		});
		return this;
	};

	/**
	 * Pause the video
	 */
	VideoInstance.prototype.pause = function() {
		this.video.pause();
		return this;
	};

	/**
	 * Toggle play/pause
	 */
	VideoInstance.prototype.toggle = function() {
		if (this.isPlaying) {
			this.pause();
		} else {
			this.play();
		}
		return this;
	};

	/**
	 * Rewind by configured seconds
	 */
	VideoInstance.prototype.rewind = function() {
		this.video.currentTime = Math.max(0, this.video.currentTime - this.options.rewindSeconds);
	};

	/**
	 * Forward by configured seconds
	 */
	VideoInstance.prototype.forward = function() {
		this.video.currentTime = Math.min(
			this.video.duration, 
			this.video.currentTime + this.options.rewindSeconds
		);
	};

	/**
	 * Toggle mute
	 */
	VideoInstance.prototype.toggleMute = function() {
		this.video.muted = !this.video.muted;
		this._updateMuteButton();
		// Sync volume slider
		if (this.volumeSlider) {
			if (this.video.muted) {
				this.volumeSlider.value = '0';
				this.volumeSlider.setAttribute('aria-valuenow', '0');
			} else {
				var vol = Math.round(this.video.volume * 100);
				this.volumeSlider.value = vol.toString();
				this.volumeSlider.setAttribute('aria-valuenow', vol.toString());
			}
		}
	};

	/**
	 * Update mute button icon
	 * @private
	 */
	VideoInstance.prototype._updateMuteButton = function() {
		if (this.muteBtn) {
			this.muteBtn.replaceChildren(Funky.Dom.icon(this.video.muted ? 'fas fa-volume-mute' : 'fas fa-volume-up').el);
		}
	};

	/**
	 * Set video source
	 * @param {string} src - Video URL
	 */
	VideoInstance.prototype.setSrc = function(src) {
		this.video.src = src;
		this.video.load();
	};

	/**
	 * Get current time
	 * @returns {number}
	 */
	VideoInstance.prototype.getCurrentTime = function() {
		return this.video.currentTime;
	};

	/**
	 * Set current time
	 * @param {number} time - Time in seconds
	 */
	VideoInstance.prototype.setCurrentTime = function(time) {
		this.video.currentTime = time;
	};

	/**
	 * Get duration
	 * @returns {number}
	 */
	VideoInstance.prototype.getDuration = function() {
		return this.video.duration;
	};

	/**
	 * Destroy the instance
	 */
	VideoInstance.prototype.destroy = function() {
		// Remove event listeners
		this.video.removeEventListener('timeupdate', this._boundHandlers.timeupdate);
		this.video.removeEventListener('ended', this._boundHandlers.ended);
		this.video.removeEventListener('loadedmetadata', this._boundHandlers.loadedmetadata);
		this.video.removeEventListener('play', this._boundHandlers.play);
		this.video.removeEventListener('pause', this._boundHandlers.pause);

		if (this.options.controls) {
			this.playBtn.removeEventListener('click', this._boundHandlers.playClick);
			this.rewindBtn.removeEventListener('click', this._boundHandlers.rewindClick);
			this.muteBtn.removeEventListener('click', this._boundHandlers.muteClick);
			this.progressContainer.removeEventListener('click', this._boundHandlers.progressClick);
			this.wrapper.removeEventListener('click', this._boundHandlers.wrapperClick);
		}

		this.wrapper.removeEventListener('keydown', this._boundHandlers.keydown);

		// Unregister keyboard shortcuts
		if (this._keyboardUnregisters) {
			this._keyboardUnregisters.forEach(function(unregister) {
				unregister();
			});
			this._keyboardUnregisters = null;
		}

		// Pause and remove video
		this.video.pause();
		this.video.src = '';

		// Remove from DOM
		if (this.wrapper.parentNode) {
			this.wrapper.parentNode.removeChild(this.wrapper);
		}

		// Remove from instances
		var idx = Video.instances.indexOf(this);
		if (idx > -1) {
			Video.instances.splice(idx, 1);
		}
	};

	// Register with Funky
	Funky.register('Video', Video);

})(window);

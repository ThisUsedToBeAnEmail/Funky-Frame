/**
 * Funky Audio - Sound Effect Management
 * 
 * Generic audio management system for playing sound effects.
 * No sounds are registered by default - applications register their own.
 * 
 * Usage:
 *   // Register sounds (typically in app initialization)
 *   Funky.Audio.registerSound('success', 'success.mp3', { volume: 0.6 });
 *   Funky.Audio.registerSound('error', 'error.mp3', { volume: 0.6 });
 *   Funky.Audio.registerSound('click', 'click.mp3');
 *   
 *   // Play sounds
 *   Funky.Audio.play('success');
 *   Funky.Audio.play('error');
 *   
 *   // Configure
 *   Funky.Audio.configure({ 
 *     basePath: '/assets/sound/',
 *     requireTheme: true,  // Only play when specific theme active
 *     volume: 0.7 
 *   });
 *   
 *   // Mute controls
 *   Funky.Audio.mute();
 *   Funky.Audio.unmute();
 *   Funky.Audio.toggleMute();
 *   Funky.Audio.isMuted();
 *   
 *   // Query registered sounds
 *   Funky.Audio.listSounds();  // ['success', 'error', 'click']
 *   Funky.Audio.getSound('success');  // { file: 'success.mp3', volume: 0.6 }
 * 
 * @version 1.0.1
 */
(function(window) {
	'use strict';

	// Ensure Funky registry exists
	if (!window.Funky || !window.Funky.register) {
		console.error('[Funky.Audio] Registry not found. Load namespace.js first.');
		return;
	}

	// Sound configuration registry
	var _sounds = Funky.Registry.create('audioSounds', {
		defaults: { volume: 0.6, loop: false }
	});

	/**
	 * FunkyAudio Constructor
	 */
	function FunkyAudio() {
		this.audioCache = {};  // Cached Audio elements
		this.volume = 0.7;
		this.muted = false;
		this.basePath = '/assets/sound/';
		this.requireTheme = false;  // Generic by default, app can enable theme requirement

		// Load mute state from storage
		var savedMute = Funky.Storage.getRaw('audio_muted', null);
		if (savedMute !== null) {
			this.muted = savedMute === 'true';
		}

		// No default sounds registered - app should register its own
	}

	/**
	 * Configure audio settings
	 * @param {Object} options - Configuration options
	 * @param {string} options.basePath - Base path for sound files
	 * @param {boolean} options.requireTheme - Whether to require even-funkyer theme
	 * @param {number} options.volume - Default volume level (0-1)
	 */
	FunkyAudio.prototype.configure = function(options) {
		options = options || {};
		if (options.basePath !== undefined) this.basePath = options.basePath;
		if (options.requireTheme !== undefined) this.requireTheme = options.requireTheme;
		if (options.volume !== undefined) this.volume = options.volume;
	};

	/**
	 * Register a sound configuration
	 * @param {string} name - Sound name (used in play())
	 * @param {string} file - Sound file name
	 * @param {Object} options - Sound options
	 * @param {number} options.volume - Volume level (0-1)
	 * @param {boolean} options.loop - Whether to loop
	 */
	FunkyAudio.prototype.registerSound = function(name, file, options) {
		_sounds.register(name, Object.assign({ file: file }, options || {}));
	};

	/**
	 * Get sound configuration by name
	 * @param {string} name - Sound name
	 * @returns {Object|undefined} Sound config or undefined
	 */
	FunkyAudio.prototype.getSound = function(name) {
		return _sounds.get(name);
	};

	/**
	 * List all registered sound names
	 * @returns {Array<string>} Array of sound names
	 */
	FunkyAudio.prototype.listSounds = function() {
		return _sounds.list();
	};

	/**
	 * Preload audio files into cache
	 * @param {Array<string>} files - Array of audio file names
	 */
	FunkyAudio.prototype.preload = function(files) {
		var self = this;
		files.forEach(function(file) {
			var audio = new Audio(self.basePath + file);
			audio.preload = 'auto';
			audio.volume = self.volume;
			self.audioCache[file] = audio;
		});
	};

	/**
	 * Play a sound effect
	 * @param {string} nameOrFile - Registered sound name OR sound file path
	 * @param {Object} options - Playback options
	 * @param {number} options.volume - Volume level (0-1)
	 * @param {boolean} options.loop - Whether to loop the sound
	 * @param {boolean} options.bypass - Skip theme check (for playground/demo)
	 * @param {Function} options.onEnd - Callback when sound ends
	 * @returns {Promise} Resolves when playback starts
	 */
	FunkyAudio.prototype.play = function(nameOrFile, options) {
		var self = this;
		options = options || {};

		// Check if it's a registered sound name
		var soundConfig = _sounds.get(nameOrFile);
		var soundFile, soundOptions;
		
		if (soundConfig) {
			// Use registered config merged with runtime options
			soundFile = soundConfig.file;
			soundOptions = Object.assign({}, soundConfig, options);
		} else {
			// Treat as raw file path (legacy support)
			soundFile = nameOrFile;
			soundOptions = options;
		}

		// Check if even-funkyer mode is enabled (unless bypass is set)
		// Theme is stored as 'funky-theme' directly (not via Funky.Storage prefix)
		if (!soundOptions.bypass && this.requireTheme) {
			var currentTheme = localStorage.getItem('funky-theme');
			if (currentTheme !== 'even-funkyer') {
				return Promise.resolve();
			}
		}

		if (this.muted) {
			return Promise.resolve();
		}

		// If this is a foreground sound (not background music), pause ALL sounds including background
		// Only one sound should play at a time
		if (!soundOptions.background) {
			Object.keys(this.audioCache).forEach(function(key) {
				var sound = self.audioCache[key];
				// Pause everything except looping sounds
				if (sound && !sound.paused && !sound.loop) {
					sound.pause();
					sound.currentTime = 0;
				}
			});
		}

		// Get or create audio element from cache
		var audio = this.audioCache[soundFile];
		if (!audio) {
			console.log('[Funky.Audio] Creating new Audio element for:', this.basePath + soundFile);
			audio = new Audio(this.basePath + soundFile);
			this.audioCache[soundFile] = audio;
		} else {
			console.log('[Funky.Audio] Using cached Audio element for:', soundFile, 'src:', audio.src);
		}

		// Reset audio to beginning
		audio.currentTime = 0;

		// Apply options from merged config
		audio.volume = soundOptions.volume !== undefined ? soundOptions.volume : this.volume;
		audio.loop = soundOptions.loop || false;
		audio.isBackground = soundOptions.background || false;
		
		console.log('[Funky.Audio] Audio element state - src:', audio.src, 'volume:', audio.volume, 'readyState:', audio.readyState);

		// Set up onEnd callback chain
		audio.onended = function() {
			// Call original callback first if provided
			if (soundOptions.onEnd && typeof soundOptions.onEnd === 'function') {
				soundOptions.onEnd();
			}

			// Then call global onAudioEnded callback if it exists
			if (window.onAudioEnded && typeof window.onAudioEnded === 'function') {
				window.onAudioEnded(nameOrFile);
			}
		};

		// Call global onAudioStarted callback if it exists
		if (window.onAudioStarted && typeof window.onAudioStarted === 'function') {
			window.onAudioStarted(nameOrFile, soundOptions);
		}

		// Play the audio
		console.log('[Funky.Audio] Calling audio.play()...');
		return audio.play().then(function() {
			console.log('[Funky.Audio] audio.play() succeeded for:', nameOrFile);
		}).catch(function(error) {
			console.warn('[Funky.Audio] Failed to play ' + nameOrFile, error);
		});
	};

	/**
	 * Stop a playing sound
	 * @param {string} nameOrFile - Registered sound name or file path
	 */
	FunkyAudio.prototype.stop = function(nameOrFile) {
		// Resolve file from registry if needed
		var soundConfig = _sounds.get(nameOrFile);
		var soundFile = soundConfig ? soundConfig.file : nameOrFile;
		
		var audio = this.audioCache[soundFile];
		if (audio) {
			audio.pause();
			audio.currentTime = 0;

			// Call global onAudioStopped callback if it exists
			if (window.onAudioStopped && typeof window.onAudioStopped === 'function') {
				window.onAudioStopped(nameOrFile);
			}
		}
	};

	/**
	 * Stop all playing sounds
	 */
	FunkyAudio.prototype.stopAll = function() {
		var self = this;
		Object.keys(this.audioCache).forEach(function(file) {
			var audio = self.audioCache[file];
			if (audio) {
				audio.pause();
				audio.currentTime = 0;
			}
		});
	};

	/**
	 * Set global volume
	 * @param {number} level - Volume level (0-1)
	 */
	FunkyAudio.prototype.setVolume = function(level) {
		var self = this;
		this.volume = Math.max(0, Math.min(1, level));
		Object.keys(this.audioCache).forEach(function(file) {
			self.audioCache[file].volume = self.volume;
		});
	};

	/**
	 * Mute all sounds
	 */
	FunkyAudio.prototype.mute = function() {
		this.muted = true;
		Funky.Storage.setRaw('audio_muted', 'true');
		this.stopAll();
	};

	/**
	 * Unmute all sounds
	 */
	FunkyAudio.prototype.unmute = function() {
		this.muted = false;
		Funky.Storage.setRaw('audio_muted', 'false');
	};

	/**
	 * Toggle mute state
	 * @returns {boolean} New enabled state (true = unmuted)
	 */
	FunkyAudio.prototype.toggleMute = function() {
		if (this.muted) {
			this.unmute();
		} else {
			this.mute();
		}
		return !this.muted;
	};

	/**
	 * Check if audio is muted
	 * @returns {boolean}
	 */
	FunkyAudio.prototype.isMuted = function() {
		return this.muted;
	};

	// Create instance
	var audioInstance = new FunkyAudio();

	// Register with Funky namespace
	Funky.register('Audio', audioInstance);

})(window);

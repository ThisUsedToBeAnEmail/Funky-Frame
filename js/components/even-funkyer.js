/**
 * EVEN FUNKYER MODE - Interactive Disco Experience! 🕺💃✨
 * Adds groovy interactive effects and random disco surprises
 * Only loads when Even Funkyer theme is active
 * @module Funky.EvenFunkyer
 */

(function() {
	'use strict';

	// Registry guard - prevent double registration
	if (typeof Funky !== 'undefined' && Funky.isRegistered && Funky.isRegistered('EvenFunkyer')) {
		return;
	}

	// Configuration
	const CONFIG = {
		discoballChance: 0.25, // 25% chance on click - MORE DISCO!
		randomEventInterval: 20000, // Random event every 20 seconds - MORE CHAOS!
		confettiCount: 80, // More confetti!
		soundTracks: [
			'/assets/sound/funky-groove.mp3',
			'/assets/sound/disco-fever.mp3',
			'/assets/sound/boogie-nights.mp3',
			'/assets/sound/electric-slide.mp3',
			'/assets/sound/funky-town.mp3'
		],
		clickSounds: [
			'/assets/sound/disco-hit.mp3',
			'/assets/sound/synth-pop.mp3',
			'/assets/sound/funk-slap.mp3'
		]
	};

	let randomEventTimer = null;
	let discoballActive = false;
	let rotatorInterval = null;
	let musicPlaying = false;
	let currentTrackIndex = -1;
	let waitingForPageAudio = false;
	let _throttledMouseMoveHandler = null; // Store handler reference for cleanup

	/**
	 * Check if Even Funkyer theme is active
	 * Checks both body and documentElement since different pages set it differently
	 * @returns {boolean}
	 */
	function isEvenFunkyerActive() {
		return document.body.getAttribute('data-theme') === 'even-funkyer' ||
			document.documentElement.getAttribute('data-theme') === 'even-funkyer';
	}

	/**
	 * Initialize Even Funkyer mode
	 * @param {boolean} showWelcome - Whether to show the welcome message (only on first activation)
	 */
	function init(showWelcome = false) {

		// Set up global audio callbacks
		setupAudioCallbacks();

		// Add disco effects container
		addEffectsContainer();

		// Add funky marquees
		addFunkyMarquees();

		// Set up interaction handlers
		setupClickEffects();
		setupHoverEffects();
		setupKeyboardEffects();

		// Start random event timer
		startRandomEvents();

		// Apply funky classes to DOM elements
		applyFunkyClasses();

		// Start element rotator
		startElementRotator();

		// Show welcome effect only on theme activation
		if (showWelcome) {
			setTimeout(() => {
				showWelcomeEffect();
				// Start the groove!
				setTimeout(() => {
					startGrooving();
				}, 2000);
			}, 1000);
		} else {
			// Show page title animation for page changes
			showPageTitleEffect();
			// Wait for page audio to finish before starting music
			if (!musicPlaying) {
				waitingForPageAudio = true;
			}
		}
	}

	/**
	 * Clean up when switching back to regular Funky mode
	 */
	function cleanup() {

		// Remove global audio callbacks
		window.onAudioStarted = null;
		window.onAudioEnded = null;
		window.onAudioStopped = null;

		// Reset flags
		waitingForPageAudio = false;

		// Stop the groove
		stopGrooving();

		// Stop any playing music via FunkyAudio
		if (Funky.Audio) {
			window.Funky.Audio.stopAll();
		}

		// Clear timers
		if (randomEventTimer) {
			clearInterval(randomEventTimer);
			randomEventTimer = null;
		}
		if (rotatorInterval) {
			clearInterval(rotatorInterval);
			rotatorInterval = null;
		}

		// Remove effects container
		const container = document.getElementById('funky-effects-container');
		if (container) {
			container.remove();
		}

		// Remove marquees
		document.querySelectorAll('.funky-marquee').forEach(el => el.remove());

		// Remove funky classes from elements
		removeFunkyClasses();

		// Remove event listeners
		document.removeEventListener('click', handleFunkyClick);
		document.removeEventListener('keydown', handleFunkyKeyboard);
		if (_throttledMouseMoveHandler) {
			document.removeEventListener('mousemove', _throttledMouseMoveHandler);
			_throttledMouseMoveHandler = null;
		}
	}

	/**
	 * Add container for all funky effects
	 */
	function addEffectsContainer() {
		if (document.getElementById('funky-effects-container')) return;
		if (!document.body) return; // Guard for sandbox/test environments

		const container = document.createElement('div');
		container.id = 'funky-effects-container';
		container.setAttribute('aria-hidden', 'true');
		container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
      overflow: hidden;
    `;
		document.body.appendChild(container);
	}

	/**
	 * Set up click effects
	 */
	function setupClickEffects() {
		document.addEventListener('click', handleFunkyClick);
	}

	function handleFunkyClick(e) {
		// Create ripple effect at click position
		createRipple(e.clientX, e.clientY);

		// Random chance for disco ball
		if (Math.random() < CONFIG.discoballChance && !discoballActive) {
			triggerDiscoBall();
		}

		// Random click sound
		if (Math.random() < 0.3) {
			playRandomClickSound();
		}

		// Random confetti burst
		if (Math.random() < 0.2) { // 20% instead of 10%
			createConfettiBurst(e.clientX, e.clientY, 30); // More confetti
		}

		// Extra sparkles on every click
		if (Math.random() < 0.5) {
			createSparkle(e.clientX, e.clientY);
			createSparkle(e.clientX + 10, e.clientY + 10);
			createSparkle(e.clientX - 10, e.clientY - 10);
		}
	}

	/**
	 * Set up hover effects for buttons
	 */
	function setupHoverEffects() {
		// Store throttled handler reference for cleanup
		_throttledMouseMoveHandler = throttle(handleMouseMove, 50);
		document.addEventListener('mousemove', _throttledMouseMoveHandler);
	}

	function handleMouseMove(e) {
		const target = e.target;

		// Only sparkle on interactive elements
		if (target.matches('button, a, .btn, .nav-link, .clickable')) {
			if (Math.random() < 0.3) {
				createSparkle(e.clientX, e.clientY);
			}
		}
	}

	/**
	 * Set up keyboard shortcuts for funky actions
	 */
	function setupKeyboardEffects() {
		document.addEventListener('keydown', handleFunkyKeyboard);
	}

	function handleFunkyKeyboard(e) {
		// Ctrl/Cmd + H = Show Keyboard Help
		if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
			e.preventDefault();
			showKeyboardHelp();
		}

		// Ctrl/Cmd + D = Disco Ball
		if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
			e.preventDefault();
			triggerDiscoBall();
		}

		// Ctrl/Cmd + F = Confetti Explosion
		if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
			e.preventDefault();
			createFullScreenConfetti();
		}

		// Ctrl/Cmd + S = Spin Out!
		if ((e.ctrlKey || e.metaKey) && e.key === 's') {
			e.preventDefault();
			triggerSpinOut();
		}

		// Ctrl/Cmd + L = Slide Out!
		if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
			e.preventDefault();
			triggerSlideOut();
		}

		// Ctrl/Cmd + Z = Zoom Blast!
		if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
			e.preventDefault();
			triggerZoomBlast();
		}

		// Ctrl/Cmd + X = Flip Out!
		if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
			e.preventDefault();
			triggerFlipOut();
		}

		// Ctrl/Cmd + C = Strobe Lights!
		if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
			e.preventDefault();
			triggerStrobeLights();
		}

		// Ctrl/Cmd + B = Funky Balloons!
		if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
			e.preventDefault();
			createFunkyBalloons();
		}

		// Ctrl/Cmd + P = Toggle Funky Particles!
		if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
			e.preventDefault();
			if (FunkyParticles.canvas) {
				FunkyParticles.destroy();
			} else {
				FunkyParticles.init(1);
			}
		}

		// Ctrl/Cmd + M = Next Track
		if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
			e.preventDefault();
			skipToNextTrack();
		}
	}

	/**
	 * Add funky scrolling marquees
	 */
	function addFunkyMarquees() {
		const messages = [
			'🕺 GET FUNKY 💃 DISCO FEVER 🪩 BOOGIE NIGHTS ✨ GROOVE TIME 🎵 DANCE PARTY 🎉',
			'💫 EVEN FUNKIER MODE 🌈 MAXIMUM GROOVE 🎸 DISCO INFERNO 🎺 FUNK OVERLOAD 🥁',
			'🎵 STAY FUNKY 🎶 KEEP GROOVING 🪩 DISCO NEVER DIES ✨ FUNK FOREVER 💃',
			'✨ YOU\'RE CRUSHING IT 💪 FUNKY EXCELLENCE 🌟 TRADE LIKE A DISCO KING 👑',
			'🎸 RIDE THE FUNKY WAVE 🌊 SPREADSHEET SUPERSTAR 💫 ALLOCATION CHAMPION 🏆',
			'💃 FUNKY FINGERS NEVER FAIL 🕺 YOUR VIBE ATTRACTS YOUR TRIBE 🎯',
			'🪩 MIRROR BALL MAGIC ✨ CONFIDENCE IS YOUR SOUNDTRACK 🎵 TRUST THE FUNK 💥',
			'🌈 EVERY CLICK IS A HIT 🎯 FUNKY FLOW STATE ACTIVATED 🔥 YOU\'RE ON FIRE 🚀',
			'🎺 SMOOTH OPERATOR 🎷 JAZZ HANDS & TRADE PLANS 📊 ANALYTICS NEVER LOOKED SO GOOD 👀',
			'💿 SPIN THE RECORDS 🎧 DROP THE BEAT 🥁 CLOSE THAT DEAL 🤝',
			'🕺 SWAGGER ACTIVATED 💃 GROOVE IS IN THE SPREADSHEET 📈 FUNKY DATA FLOWS 💫',
			'🎉 PARTY IN THE PORTFOLIO 💼 DISCO DIVERSIFICATION 📊 ALLOCATE WITH ATTITUDE 😎',
			'✨ SPARKLE SQUAD REPRESENT 💎 SHINE BRIGHT LIKE A DISCO BALL 🪩 ILLUMINATE THE MARKETS 💡',
			'🌟 STELLAR PERFORMANCE 🚀 MOONWALK TO SUCCESS 🌙 FUNKY HORIZONS AWAIT 🌅',
			'🎵 RHYTHM & RISK MANAGEMENT 📊 BEAT DROP = PROFIT POP 💰 HARMONIZE YOUR PORTFOLIO 🎼',
			'💃 SLAY THE SPREADSHEET 🕺 BOOGIE WITH THE NUMBERS 🔢 FUNKALICIOUS FINANCIALS 💵',
			'🪩 REFLECT GREATNESS ✨ MIRROR YOUR EXCELLENCE 🏆 DISCO DOMINATION MODE 👊',
			'🎸 RIFF ON SUCCESS 🎯 JAM WITH GENIUS 🧠 FUNKY WISDOM FLOWING 🌊',
			'🌈 TASTE THE RAINBOW 🍭 SMELL THE SUCCESS 🌹 HEAR THE FUNKY PROFITS 💰',
			'💫 COSMIC TRADER VIBES 🌌 STELLAR ALLOCATIONS ⭐ GALAXY BRAIN MOVES 🧠'
		];

		// Top marquee
		const topMarquee = document.createElement('div');
		topMarquee.className = 'funky-marquee funky-marquee-top';
		topMarquee.innerHTML = `<div class="funky-marquee-content" style="color: #ff00ff;">${messages[0]}</div>`;
		document.body.appendChild(topMarquee);

		// Bottom marquee (reverse direction)
		const bottomMarquee = document.createElement('div');
		bottomMarquee.className = 'funky-marquee funky-marquee-bottom';
		bottomMarquee.innerHTML = `<div class="funky-marquee-content" style="color: #00ffff; animation-direction: reverse;">${messages[1]}</div>`;
		document.body.appendChild(bottomMarquee);

		// Rotate messages periodically
		let messageIndex = 0;
		setInterval(() => {
			messageIndex = (messageIndex + 1) % messages.length;
			const marquees = document.querySelectorAll('.funky-marquee-content');
			if (marquees[0]) marquees[0].textContent = messages[messageIndex];
			if (marquees[1]) marquees[1].textContent = messages[(messageIndex + 1) % messages.length];
		}, 15000);
	}

	/**
	 * Apply funky animation classes to DOM elements
	 */
	function applyFunkyClasses() {
		// Don't apply to modals or form elements to prevent breaking UI
		const excludeSelectors = '.modal, .modal-dialog, .modal-content, .modal-header, .modal-body, #jsonEditorContainer, .form-control, .form-select, input, textarea, select';

		// Apply random funky classes to stat cards (but not the values, they already have animations)
		document.querySelectorAll('.stat-card').forEach((card, index) => {
			if (!card.closest(excludeSelectors)) {
				// Stat cards get subtle animations
				card.style.animationDelay = `${index * 0.2}s`;
			}
		});

		// Icons get wobble on hover only (not constant)
		document.querySelectorAll('.btn-icon').forEach(icon => {
			if (!icon.closest(excludeSelectors)) {
				icon.addEventListener('mouseenter', function() {
					this.classList.add('funky-wobble');
					setTimeout(() => this.classList.remove('funky-wobble'), 2000);
				});
			}
		});
	}

	/**
	 * Remove funky animation classes from elements (but preserve regular funky-* UI classes)
	 */
	function removeFunkyClasses() {
		// Only remove the specific animation classes we add, not regular UI classes
		const animationClasses = [
			'funky-wobble', 'funky-pulse', 'funky-shake', 'funky-rotate',
			'funky-bounce-in', 'funky-slide', 'funky-flip', 'funky-jello', 'funky-text-wave'
		];

		animationClasses.forEach(className => {
			document.querySelectorAll('.' + className).forEach(el => {
				el.classList.remove(className);
			});
		});
	}

	/**
	 * Randomly rotate element animations
	 */
	function startElementRotator() {
		rotatorInterval = setInterval(() => {
			// Only run if Even Funkyer theme is active
			if (!isEvenFunkyerActive()) return;

			// Pick random non-modal cards and give them a temporary effect
			const cards = Array.from(document.querySelectorAll('.card:not(.modal *)')).filter(c =>
				!c.closest('.modal') && !c.querySelector('#jsonEditorContainer')
			);

			if (cards.length > 0) {
				const randomCard = cards[Math.floor(Math.random() * cards.length)];
				randomCard.classList.add('funky-pulse');
				setTimeout(() => randomCard.classList.remove('funky-pulse'), 2000);
			}

			// Make random badge shake
			const badges = document.querySelectorAll('.badge:not(.modal *)');
			if (badges.length > 0) {
				const randomBadge = badges[Math.floor(Math.random() * badges.length)];
				randomBadge.classList.add('funky-shake');
				setTimeout(() => randomBadge.classList.remove('funky-shake'), 500);
			}

			// Random sparkle burst somewhere on screen
			if (Math.random() > 0.5) {
				const x = Math.random() * window.innerWidth;
				const y = Math.random() * window.innerHeight;
				for (let i = 0; i < 5; i++) {
					createSparkle(x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 20);
				}
			}

			// Make the logo dance occasionally
			if (Math.random() > 0.7) {
				makeLogoDance();
			}

			// Make the sidebar header dance
			if (Math.random() > 0.6) {
				makeSidebarHeaderDance();
			}

			// Shuffle sidebar text continuously
			if (Math.random() > 0.5) {
				const logoLink = document.querySelector('.sidebar-header .sidebar-logo');
				if (logoLink) {
					shuffleTextAnimation(logoLink);
				}
			}
		}, 5000); // Every 5 seconds instead of 8
	}

	/**
	 * Start random disco events
	 */
	function startRandomEvents() {
		randomEventTimer = setInterval(() => {
			// Only run if Even Funkyer theme is active
			if (!isEvenFunkyerActive()) return;

			const events = [
				triggerDiscoBall,
				createRandomConfetti,
				pulseScreen,
				rainbowWave,
				floatingNotes,
				createStarBurst,
				trigger80sFunkOut,
				triggerSpinOut,
				triggerSlideOut,
				triggerZoomBlast,
				triggerFlipOut,
				triggerStrobeLights,
				createFunkyBalloons,
				triggerParticleBurst
			];

			const randomEvent = events[Math.floor(Math.random() * events.length)];
			randomEvent();
		}, CONFIG.randomEventInterval);
	}

	/**
	 * SPIN OUT - Rotate the entire page! 🌀💫
	 */
	function triggerSpinOut() {

		const body = document.body;
		const originalTransform = body.style.transform;
		const originalTransition = body.style.transition;

		// Show "SPIN OUT" message
		const container = document.getElementById('funky-effects-container');
		if (container) {
			const spinMsg = document.createElement('div');
			spinMsg.innerHTML = '🌀 SPIN OUT! 🌀';
			spinMsg.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 72px;
        font-weight: 900;
        background: linear-gradient(135deg, #ff00ff, #00ffff, #ffff00);
        background-size: 200% 200%;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        z-index: 100000;
        pointer-events: none;
        animation: rainbowShift 1s linear infinite;
        text-shadow: 0 0 30px rgba(255, 0, 255, 0.8);
        filter: drop-shadow(0 0 20px #ff00ff) drop-shadow(0 0 40px #00ffff);
      `;
			container.appendChild(spinMsg);

			setTimeout(() => {
				spinMsg.style.transition = 'opacity 0.5s';
				spinMsg.style.opacity = '0';
				setTimeout(() => spinMsg.remove(), 500);
			}, 2000);
		}

		// Apply spinning animation to body
		body.style.transition = 'transform 3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
		body.style.transformOrigin = 'center center';

		// Spin 360 degrees
		body.style.transform = 'rotate(360deg) scale(1.1)';

		// Add some wobble at the peak
		setTimeout(() => {
			body.style.transform = 'rotate(360deg) scale(1)';
		}, 1500);

		// Return to normal
		setTimeout(() => {
			body.style.transition = 'transform 1s ease-out';
			body.style.transform = originalTransform || 'none';

			// Clean up after animation
			setTimeout(() => {
				body.style.transition = originalTransition;
			}, 1000);
		}, 3000);

		// Add confetti during the spin
		setTimeout(() => {
			for (let i = 0; i < 3; i++) {
				setTimeout(() => {
					createFullScreenConfetti();
				}, i * 300);
			}
		}, 500);
	}

	/**
	 * SLIDE OUT - Slide the page off screen! 🎢💫
	 */
	function triggerSlideOut() {

		const body = document.body;
		const originalTransform = body.style.transform;
		const originalTransition = body.style.transition;

		// Show "SLIDE OUT" message
		const container = document.getElementById('funky-effects-container');
		if (container) {
			const slideMsg = document.createElement('div');
			slideMsg.innerHTML = '🎢 SLIDE OUT! 🎢';
			slideMsg.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 72px;
        font-weight: 900;
        background: linear-gradient(45deg, #ff00ff, #00ffff, #ffff00, #ff00ff);
        background-size: 300% 300%;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        z-index: 100000;
        pointer-events: none;
        animation: rainbowShift 1s linear infinite;
        filter: drop-shadow(0 0 20px #ff00ff) drop-shadow(0 0 40px #00ffff);
      `;
			container.appendChild(slideMsg);

			setTimeout(() => {
				slideMsg.style.transition = 'opacity 0.5s';
				slideMsg.style.opacity = '0';
				setTimeout(() => slideMsg.remove(), 500);
			}, 2500);
		}

		// Choose random direction
		const directions = [
			{ x: window.innerWidth * 1.5, y: 0, rotate: '15deg' }, // Right
			{ x: -window.innerWidth * 1.5, y: 0, rotate: '-15deg' }, // Left
			{ x: 0, y: -window.innerHeight * 1.5, rotate: '5deg' }, // Up
			{ x: 0, y: window.innerHeight * 1.5, rotate: '-5deg' } // Down
		];
		const direction = directions[Math.floor(Math.random() * directions.length)];

		// Apply sliding animation
		body.style.transition = 'transform 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
		body.style.transformOrigin = 'center center';

		// Slide out
		body.style.transform = `translate(${direction.x}px, ${direction.y}px) rotate(${direction.rotate}) scale(0.8)`;

		// Rainbow flash during slide
		if (container) {
			container.style.transition = 'background 0.2s';
			const colors = ['rgba(255,0,255,0.1)', 'rgba(0,255,255,0.1)', 'rgba(255,255,0,0.1)'];
			let colorIndex = 0;
			const flashInterval = setInterval(() => {
				container.style.background = colors[colorIndex % colors.length];
				colorIndex++;
			}, 150);

			setTimeout(() => {
				clearInterval(flashInterval);
				container.style.background = 'transparent';
			}, 3000);
		}

		// Slide back in from opposite direction
		setTimeout(() => {
			body.style.transition = 'transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)';
			body.style.transform = originalTransform || 'none';

			// Clean up
			setTimeout(() => {
				body.style.transition = originalTransition;
			}, 1000);
		}, 1500);

		// Sparkle trail during the slide
		const sparkleInterval = setInterval(() => {
			const x = Math.random() * window.innerWidth;
			const y = Math.random() * window.innerHeight;
			createSparkle(x, y);
		}, 100);

		setTimeout(() => clearInterval(sparkleInterval), 2500);
	}

	/**
	 * ZOOM BLAST - Zoom in and out dramatically! 💥🔍
	 */
	function triggerZoomBlast() {

		const body = document.body;
		const originalTransform = body.style.transform;
		const originalTransition = body.style.transition;

		// Show message
		const container = document.getElementById('funky-effects-container');
		if (container) {
			const zoomMsg = document.createElement('div');
			zoomMsg.innerHTML = '💥 ZOOM BLAST! 💥';
			zoomMsg.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0);
        font-size: 72px;
        font-weight: 900;
        background: linear-gradient(45deg, #ff0066, #ffff00, #00ffff, #ff0066);
        background-size: 300% 300%;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        z-index: 100000;
        pointer-events: none;
        animation: rainbowShift 0.5s linear infinite, welcomeBounce 0.5s ease-out;
        filter: drop-shadow(0 0 30px #ff0066);
      `;
			container.appendChild(zoomMsg);
			setTimeout(() => {
				zoomMsg.style.transition = 'opacity 0.3s';
				zoomMsg.style.opacity = '0';
				setTimeout(() => zoomMsg.remove(), 300);
			}, 2000);
		}

		// Zoom animation
		body.style.transition = 'transform 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
		body.style.transformOrigin = 'center center';

		// Zoom way in
		body.style.transform = 'scale(3) rotate(5deg)';

		// Zoom way out
		setTimeout(() => {
			body.style.transform = 'scale(0.3) rotate(-5deg)';
		}, 800);

		// Back to normal
		setTimeout(() => {
			body.style.transition = 'transform 0.6s ease-out';
			body.style.transform = originalTransform || 'none';
			setTimeout(() => {
				body.style.transition = originalTransition;
			}, 600);
		}, 1600);

		// Confetti bursts
		setTimeout(() => createFullScreenConfetti(), 400);
		setTimeout(() => createFullScreenConfetti(), 1200);
	}

	/**
	 * FLIP OUT - 3D flip the entire page! 🔄🎪
	 */
	function triggerFlipOut() {

		const body = document.body;
		const originalTransform = body.style.transform;
		const originalTransition = body.style.transition;
		const originalPerspective = body.parentElement.style.perspective;

		// Show message
		const container = document.getElementById('funky-effects-container');
		if (container) {
			const flipMsg = document.createElement('div');
			flipMsg.innerHTML = '🔄 FLIP OUT! 🔄';
			flipMsg.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 72px;
        font-weight: 900;
        background: linear-gradient(135deg, #9900ff, #00ffff, #ff00ff);
        background-size: 200% 200%;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        z-index: 100000;
        pointer-events: none;
        animation: rainbowShift 0.8s linear infinite;
        filter: drop-shadow(0 0 20px #9900ff);
      `;
			container.appendChild(flipMsg);
			setTimeout(() => {
				flipMsg.style.transition = 'opacity 0.3s';
				flipMsg.style.opacity = '0';
				setTimeout(() => flipMsg.remove(), 300);
			}, 2500);
		}

		// Set up 3D perspective
		document.documentElement.style.perspective = '1000px';
		body.style.transition = 'transform 2s ease-in-out';
		body.style.transformOrigin = 'center center';

		// Random 3D flip direction
		const flips = [
			'rotateY(360deg) rotateX(15deg)',
			'rotateX(360deg) rotateY(15deg)',
			'rotateY(-360deg) rotateZ(180deg)',
			'rotateX(180deg) rotateY(180deg)'
		];
		const flip = flips[Math.floor(Math.random() * flips.length)];

		body.style.transform = flip;

		// Sparkle during flip
		const sparkleInterval = setInterval(() => {
			const x = Math.random() * window.innerWidth;
			const y = Math.random() * window.innerHeight;
			createSparkle(x, y);
		}, 100);

		// Return to normal
		setTimeout(() => {
			clearInterval(sparkleInterval);
			body.style.transition = 'transform 1s ease-out';
			body.style.transform = originalTransform || 'none';
			setTimeout(() => {
				body.style.transition = originalTransition;
				document.documentElement.style.perspective = originalPerspective;
			}, 1000);
		}, 2000);
	}

	/**
	 * STROBE LIGHTS - Random color flashes! ⚡🌈
	 */
	function triggerStrobeLights() {

		const container = document.getElementById('funky-effects-container');
		if (!container) return;

		const colors = [
			'rgba(255, 0, 255, 0.3)',
			'rgba(0, 255, 255, 0.3)',
			'rgba(255, 255, 0, 0.3)',
			'rgba(255, 0, 102, 0.3)',
			'rgba(0, 255, 0, 0.3)',
			'rgba(153, 0, 255, 0.3)'
		];

		// Create strobe overlay
		const strobe = document.createElement('div');
		strobe.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 99999;
      background: transparent;
    `;
		container.appendChild(strobe);

		// Rapid color flashes
		let flashCount = 0;
		const strobeInterval = setInterval(() => {
			strobe.style.background = colors[Math.floor(Math.random() * colors.length)];
			flashCount++;

			if (flashCount > 20) {
				clearInterval(strobeInterval);
				strobe.style.transition = 'opacity 0.5s';
				strobe.style.opacity = '0';
				setTimeout(() => strobe.remove(), 500);
			}
		}, 100);

		// Random sparkles during strobe
		const sparkleInterval = setInterval(() => {
			for (let i = 0; i < 5; i++) {
				const x = Math.random() * window.innerWidth;
				const y = Math.random() * window.innerHeight;
				createSparkle(x, y);
			}
		}, 200);

		setTimeout(() => clearInterval(sparkleInterval), 2000);
	}

	/**
	 * FUNKY BALLOONS - Floating balloons that pop! 🎈🎉
	 */
	function createFunkyBalloons() {

		const container = document.getElementById('funky-effects-container');
		if (!container) return;

		const balloonColors = [
			{ main: '#ff00ff', glow: 'rgba(255, 0, 255, 0.6)' },
			{ main: '#00ffff', glow: 'rgba(0, 255, 255, 0.6)' },
			{ main: '#ffff00', glow: 'rgba(255, 255, 0, 0.6)' },
			{ main: '#ff0066', glow: 'rgba(255, 0, 102, 0.6)' },
			{ main: '#00ff00', glow: 'rgba(0, 255, 0, 0.6)' },
			{ main: '#ff9900', glow: 'rgba(255, 153, 0, 0.6)' }
		];

		// Create 15-25 balloons
		const balloonCount = 15 + Math.floor(Math.random() * 10);

		for (let i = 0; i < balloonCount; i++) {
			setTimeout(() => {
				const color = balloonColors[Math.floor(Math.random() * balloonColors.length)];
				const startX = Math.random() * window.innerWidth;
				const size = 40 + Math.random() * 40; // 40-80px
				const duration = 8 + Math.random() * 4; // 8-12 seconds to float up

				const balloon = document.createElement('div');
				balloon.innerHTML = '🎈';
				balloon.style.cssText = `
          position: fixed;
          left: ${startX}px;
          bottom: -100px;
          font-size: ${size}px;
          pointer-events: auto;
          cursor: pointer;
          z-index: 9997;
          filter: drop-shadow(0 0 10px ${color.glow}) hue-rotate(${Math.random() * 360}deg);
          animation: balloonFloat ${duration}s linear forwards;
          transition: all 0.1s ease;
        `;

				// Make balloon pop on click
				balloon.addEventListener('click', function(e) {
					e.stopPropagation();
					popBalloon(this, color);
				});

				container.appendChild(balloon);

				// Auto-remove after animation
				setTimeout(() => {
					if (balloon.parentElement) {
						balloon.remove();
					}
				}, duration * 1000);

			}, i * 200); // Stagger balloon creation
		}
	}

	/**
	 * Pop a balloon with effects
	 */
	function popBalloon(balloon, color) {
		const rect = balloon.getBoundingClientRect();
		const centerX = rect.left + rect.width / 2;
		const centerY = rect.top + rect.height / 2;

		// Pop animation
		balloon.style.transition = 'all 0.2s ease-out';
		balloon.style.transform = 'scale(1.5)';
		balloon.style.opacity = '0';

		// Confetti burst at pop location
		createConfettiBurst(centerX, centerY, 15);

		// Sparkle explosion
		for (let i = 0; i < 8; i++) {
			setTimeout(() => {
				const angle = (Math.PI * 2 * i) / 8;
				const distance = 30;
				const x = centerX + Math.cos(angle) * distance;
				const y = centerY + Math.sin(angle) * distance;
				createSparkle(x, y);
			}, i * 20);
		}

		// Remove balloon
		setTimeout(() => balloon.remove(), 200);
	}

	/**
	 * Make the sidebar header dance! 💃
	 */
	function makeSidebarHeaderDance() {
		const sidebarHeader = document.querySelector('.sidebar-header');
		if (!sidebarHeader) return;

		const logoLink = sidebarHeader.querySelector('.sidebar-logo');
		if (!logoLink) return;

		const originalTransform = sidebarHeader.style.transform;
		const originalTransition = sidebarHeader.style.transition;

		sidebarHeader.style.transition = 'transform 0.4s ease';

		const dances = [
			'scale(1.1) rotate(5deg)',
			'scale(1.1) rotate(-5deg)',
			'translateX(-10px) scale(1.05)',
			'translateX(10px) scale(1.05)',
			'scale(1.15) translateY(-5px)',
			'rotate(360deg) scale(1.1)',
			'skewX(5deg) scale(1.05)',
			'skewX(-5deg) scale(1.05)'
		];

		let danceStep = 0;
		const danceInterval = setInterval(() => {
			sidebarHeader.style.transform = dances[danceStep % dances.length];
			danceStep++;

			if (danceStep > 8) {
				clearInterval(danceInterval);
				sidebarHeader.style.transition = 'transform 0.5s ease-out';
				sidebarHeader.style.transform = originalTransform;
				setTimeout(() => {
					sidebarHeader.style.transition = originalTransition;
				}, 500);
			}
		}, 400);

		// Shuffle text animation
		shuffleTextAnimation(logoLink);

		// Sparkles around sidebar header
		const rect = sidebarHeader.getBoundingClientRect();
		for (let i = 0; i < 15; i++) {
			setTimeout(() => {
				const x = rect.left + rect.width / 2 + (Math.random() - 0.5) * rect.width * 1.5;
				const y = rect.top + rect.height / 2 + (Math.random() - 0.5) * rect.height * 2;
				createSparkle(x, y);
			}, i * 200);
		}

		// Glow effect
		const originalBoxShadow = sidebarHeader.style.boxShadow;
		sidebarHeader.style.boxShadow = '0 0 30px rgba(255, 0, 255, 0.8), 0 0 60px rgba(0, 255, 255, 0.6)';
		setTimeout(() => {
			sidebarHeader.style.boxShadow = originalBoxShadow;
		}, 3200);
	}

	/**
	 * Shuffle text animation - scrambles then reveals text + animates icon position
	 */
	function shuffleTextAnimation(element) {
		const textNode = Array.from(element.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
		const vinylRecord = element.querySelector('.vinyl-record');

		if (!textNode) return;

		const originalText = textNode.textContent.trim();
		if (!originalText) return;

		// Animate the vinyl record icon by changing DOM order
		if (vinylRecord) {
			const positions = [
				'before', // Before "Funky Trade"
				'middle', // Between "Funky" and "Trade"
				'after', // After "Funky Trade"
				'middle', // Back between
				'before' // Back to start
			];

			let positionIndex = 0;
			const iconInterval = setInterval(() => {
				if (positionIndex < positions.length) {
					const pos = positions[positionIndex];

					// Remove existing spans if any
					const existingSpans = element.querySelectorAll('.funky-word');
					existingSpans.forEach(span => {
						const text = span.textContent;
						span.replaceWith(document.createTextNode(text));
					});

					// Get current text
					const currentText = Array.from(element.childNodes)
						.filter(n => n.nodeType === Node.TEXT_NODE)
						.map(n => n.textContent)
						.join('');

					// Clear text nodes
					Array.from(element.childNodes).forEach(node => {
						if (node.nodeType === Node.TEXT_NODE) {
							node.remove();
						}
					});

					const text = currentText.trim();
					const [funky, trade] = text.split(' ');

					// Rebuild based on position
					if (pos === 'before') {
						element.insertBefore(vinylRecord, element.firstChild);
						element.appendChild(document.createTextNode(` ${text}`));
					} else if (pos === 'middle') {
						element.appendChild(document.createTextNode(funky + ' '));
						element.appendChild(vinylRecord);
						element.appendChild(document.createTextNode(' ' + trade));
					} else if (pos === 'after') {
						element.appendChild(document.createTextNode(`${text} `));
						element.appendChild(vinylRecord);
					}

					// Spin effect
					vinylRecord.style.transition = 'transform 0.2s ease';
					vinylRecord.style.transform = `rotate(${positionIndex * 90}deg) scale(${1 + positionIndex * 0.1})`;

					positionIndex++;
				} else {
					clearInterval(iconInterval);

					// Reset to original position
					Array.from(element.childNodes).forEach(node => {
						if (node.nodeType === Node.TEXT_NODE) {
							node.remove();
						}
					});
					element.insertBefore(vinylRecord, element.firstChild);
					element.appendChild(document.createTextNode(` ${originalText}`));

					vinylRecord.style.transition = 'transform 0.3s ease-out';
					vinylRecord.style.transform = '';
				}
			}, 300);
		}

		// Shuffle the text
		const chars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
		let iterations = 0;
		const maxIterations = originalText.length;

		const shuffleInterval = setInterval(() => {
			const textNodes = Array.from(element.childNodes).filter(n => n.nodeType === Node.TEXT_NODE);
			textNodes.forEach(node => {
				const text = node.textContent;
				node.textContent = text
					.split('')
					.map((char, index) => {
						if (char === ' ') return ' ';
						if (index < iterations) {
							return text[index];
						}
						return chars[Math.floor(Math.random() * chars.length)];
					})
					.join('');
			});

			iterations += 1 / 3;

			if (iterations >= maxIterations) {
				clearInterval(shuffleInterval);
				// Restore original text
				const textNodes = Array.from(element.childNodes).filter(n => n.nodeType === Node.TEXT_NODE);
				if (textNodes.length === 1) {
					textNodes[0].textContent = ` ${originalText}`;
				}
			}
		}, 50);
	}

	/**
	 * Make the logo dance!
	 */
	function makeLogoDance() {
		const logo = document.querySelector('.brand, .sidebar .brand');
		if (!logo) return;

		const originalTransform = logo.style.transform;
		const originalTransition = logo.style.transition;

		logo.style.transition = 'transform 0.3s ease';

		const dances = [
			'scale(1.3) rotate(15deg)',
			'scale(1.3) rotate(-15deg)',
			'scale(1.2) translateY(-10px)',
			'scale(1.4) rotate(360deg)',
			'scale(0.8) rotate(-10deg)',
			'scale(1.3) skewX(10deg)'
		];

		let danceStep = 0;
		const danceInterval = setInterval(() => {
			logo.style.transform = dances[danceStep % dances.length];
			danceStep++;

			if (danceStep > 12) {
				clearInterval(danceInterval);
				logo.style.transition = 'transform 0.5s ease-out';
				logo.style.transform = originalTransform;
				setTimeout(() => {
					logo.style.transition = originalTransition;
				}, 500);
			}
		}, 300);

		// Sparkles around logo
		const rect = logo.getBoundingClientRect();
		for (let i = 0; i < 10; i++) {
			setTimeout(() => {
				const x = rect.left + rect.width / 2 + (Math.random() - 0.5) * 100;
				const y = rect.top + rect.height / 2 + (Math.random() - 0.5) * 100;
				createSparkle(x, y);
			}, i * 200);
		}
	}

	/**
	 * Show keyboard shortcuts help modal
	 */
	function showKeyboardHelp() {

		// Remove existing help modal
		const existing = document.getElementById('funky-keyboard-help');
		if (existing) {
			const existingOverlay = document.getElementById('funky-keyboard-overlay');
			if (existingOverlay) existingOverlay.remove();
			existing.remove();
			return; // Toggle off
		}

		const modal = document.createElement('div');
		modal.id = 'funky-keyboard-help';
		modal.setAttribute('role', 'dialog');
		modal.setAttribute('aria-labelledby', 'funky-keyboard-help-title');
		modal.setAttribute('aria-modal', 'true');
		modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border: 3px solid #ff00ff;
      border-radius: 15px;
      padding: 0;
      z-index: 10000;
      max-width: 900px;
      width: 95%;
      max-height: 90vh;
      height: auto;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 0 40px rgba(255, 0, 255, 0.8), 0 0 80px rgba(0, 255, 255, 0.5);
      animation: funkOutBounce 0.5s ease-out;
    `;

		const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
		const modKey = isMac ? 'Cmd' : 'Ctrl';

		const shortcuts = [
			{ key: `${modKey} + H`, desc: 'Show/Hide this help', icon: '⌨️' },
			{ key: `${modKey} + D`, desc: 'Disco Ball Drop', icon: '🪩' },
			{ key: `${modKey} + F`, desc: 'Confetti Explosion', icon: '🎉' },
			{ key: `${modKey} + P`, desc: 'Toggle Funky Particles', icon: '✨' },
			{ key: `${modKey} + S`, desc: 'Spin Out (360° rotation)', icon: '🌀' },
			{ key: `${modKey} + L`, desc: 'Slide Out (random direction)', icon: '⬅️' },
			{ key: `${modKey} + Z`, desc: 'Zoom Blast (in/out)', icon: '💥' },
			{ key: `${modKey} + X`, desc: 'Flip Out (3D flip)', icon: '🔄' },
			{ key: `${modKey} + C`, desc: 'Strobe Lights', icon: '⚡' },
			{ key: `${modKey} + B`, desc: 'Funky Balloons', icon: '🎈' },
			{ key: `${modKey} + M`, desc: 'Next Track', icon: '⏭️' }
		];

		modal.innerHTML = `
      <div style="
        padding: 25px 30px 15px;
        text-align: center;
        flex-shrink: 0;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border-radius: 15px 15px 0 0;
      ">
        <h2 id="funky-keyboard-help-title" style="
          color: #ff00ff;
          margin: 0 0 5px 0;
          font-size: clamp(24px, 4vw, 36px);
          text-shadow: 0 0 10px rgba(255, 0, 255, 0.8), 0 0 20px rgba(0, 255, 255, 0.5);
          animation: rainbowFlash 3s infinite;
        "><span aria-hidden="true">⌨️</span> FUNKY KEYBOARD SHORTCUTS</h2>
        <p style="color: #00ffff; margin: 0; font-size: clamp(13px, 2vw, 15px);">Get your funk on with these hot keys!</p>
      </div>
      <div style="
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 20px 30px;
        min-height: 0;
        -webkit-overflow-scrolling: touch;
      ">
        <div style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 12px;
        ">
          ${shortcuts.map(s => `
            <div style="
              display: flex;
              align-items: center;
              background: rgba(255, 0, 255, 0.1);
              padding: 15px;
              border-radius: 12px;
              border: 2px solid rgba(255, 0, 255, 0.3);
              transition: all 0.3s ease;
              min-height: 70px;
            " class="funky-shortcut-row">
              <span style="font-size: clamp(28px, 5vw, 32px); margin-right: 15px; flex-shrink: 0;">${s.icon}</span>
              <div style="flex: 1; min-width: 0;">
                <div style="
                  color: #ffff00;
                  font-weight: bold;
                  font-size: clamp(13px, 2.5vw, 16px);
                  font-family: 'Courier New', monospace;
                  margin-bottom: 4px;
                ">${s.key}</div>
                <div style="
                  color: #00ffff;
                  font-size: clamp(12px, 2vw, 14px);
                  line-height: 1.4;
                ">${s.desc}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      <div style="
        padding: 20px 30px 25px;
        border-top: 2px solid rgba(255, 0, 255, 0.3);
        text-align: center;
        flex-shrink: 0;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border-radius: 0 0 15px 15px;
      ">
        <button id="close-keyboard-help" style="
          background: linear-gradient(135deg, #ff00ff, #ff0066);
          color: white;
          border: none;
          padding: 12px 30px;
          border-radius: 25px;
          font-weight: bold;
          cursor: pointer;
          font-size: clamp(13px, 2.5vw, 15px);
          box-shadow: 0 4px 15px rgba(255, 0, 255, 0.5);
          transition: all 0.3s ease;
          white-space: nowrap;
        ">Close (or press ${modKey}+H)</button>
      </div>
    `;

		document.body.appendChild(modal);

		// Focus the close button for accessibility
		setTimeout(() => {
			const closeBtn = modal.querySelector('#close-keyboard-help');
			if (closeBtn) closeBtn.focus();
		}, 100);

		// Add hover effects to shortcut rows
		const rows = modal.querySelectorAll('.funky-shortcut-row');
		rows.forEach(row => {
			row.addEventListener('mouseenter', function() {
				this.style.background = 'rgba(255, 0, 255, 0.2)';
				this.style.borderColor = 'rgba(255, 0, 255, 0.6)';
				this.style.transform = 'translateX(5px)';
				createSparkle(
					this.getBoundingClientRect().left,
					this.getBoundingClientRect().top + this.offsetHeight / 2
				);
			});
			row.addEventListener('mouseleave', function() {
				this.style.background = 'rgba(255, 0, 255, 0.1)';
				this.style.borderColor = 'rgba(255, 0, 255, 0.3)';
				this.style.transform = 'translateX(0)';
			});
		});

		// Close button
		const closeBtn = modal.querySelector('#close-keyboard-help');
		closeBtn.addEventListener('mouseenter', function() {
			this.style.transform = 'scale(1.1)';
			this.style.boxShadow = '0 6px 20px rgba(255, 0, 255, 0.7)';
		});
		closeBtn.addEventListener('mouseleave', function() {
			this.style.transform = 'scale(1)';
			this.style.boxShadow = '0 4px 15px rgba(255, 0, 255, 0.5)';
		});
		closeBtn.addEventListener('click', function() {
			const overlay = document.getElementById('funky-keyboard-overlay');
			modal.style.animation = 'welcomeFadeOut 0.3s ease-out';
			setTimeout(() => {
				modal.remove();
				if (overlay) overlay.remove();
			}, 300);
		});

		// Click outside to close
		const overlay = document.createElement('div');
		overlay.id = 'funky-keyboard-overlay';
		overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      z-index: 9999;
      backdrop-filter: blur(5px);
    `;
		overlay.addEventListener('click', function() {
			modal.style.animation = 'welcomeFadeOut 0.3s ease-out';
			setTimeout(() => {
				modal.remove();
				overlay.remove();
			}, 300);
		});
		document.body.appendChild(overlay);
		document.body.appendChild(modal);

		// Sparkle effect on open
		for (let i = 0; i < 20; i++) {
			setTimeout(() => {
				const x = window.innerWidth / 2 + (Math.random() - 0.5) * 400;
				const y = window.innerHeight / 2 + (Math.random() - 0.5) * 400;
				createSparkle(x, y);
			}, i * 30);
		}
	}

	/**
	 * 80S FUNK OUT MODE - Random color chaos! 🎨💥
	 */
	function trigger80sFunkOut() {

		const container = document.getElementById('funky-effects-container');
		if (!container) return;

		// 80s neon colors
		const colors80s = [
			'#FF00FF', // Hot magenta
			'#00FFFF', // Electric cyan
			'#FFFF00', // Bright yellow
			'#FF0066', // Hot pink
			'#00FF00', // Neon green
			'#FF9900', // Orange
			'#9900FF', // Purple
			'#00FF99' // Mint green
		];

		// Show "FUNK OUT" message
		const funkOutMsg = document.createElement('div');
		funkOutMsg.innerHTML = '💿 FUNK OUT! 💿';
		funkOutMsg.style.cssText = `
      position: fixed;
      top: 20%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0) rotate(0deg);
      font-size: 64px;
      font-weight: 900;
      color: ${colors80s[0]};
      text-shadow: 
        0 0 20px ${colors80s[0]},
        0 0 40px ${colors80s[1]},
        0 0 60px ${colors80s[2]};
      z-index: 10000;
      pointer-events: none;
      animation: funkOutBounce 0.5s ease-out forwards;
    `;
		container.appendChild(funkOutMsg);

		// Animate message color changes
		let colorIndex = 0;
		const msgColorTimer = setInterval(() => {
			colorIndex = (colorIndex + 1) % colors80s.length;
			funkOutMsg.style.color = colors80s[colorIndex];
			funkOutMsg.style.textShadow = `
        0 0 20px ${colors80s[colorIndex]},
        0 0 40px ${colors80s[(colorIndex + 1) % colors80s.length]},
        0 0 60px ${colors80s[(colorIndex + 2) % colors80s.length]}
      `;
		}, 200);

		// Get elements to funk out (excluding modals and forms)
		const funkableElements = Array.from(document.querySelectorAll(
			'.card:not(.modal *), .stat-card:not(.modal *), .btn:not(.modal *):not(.btn-close), ' +
			'.badge:not(.modal *), .nav-link, .stat-value, .page-title, .brand'
		)).filter(el =>
			!el.closest('.modal') &&
			!el.closest('#jsonEditorContainer') &&
			!el.querySelector('input, textarea, select')
		);

		// Store original styles
		const originalStyles = new Map();

		// Apply random colors and effects
		funkableElements.forEach(el => {
			const computedStyle = window.getComputedStyle(el);
			originalStyles.set(el, {
				backgroundColor: el.style.backgroundColor || computedStyle.backgroundColor,
				color: el.style.color || computedStyle.color,
				borderColor: el.style.borderColor || computedStyle.borderColor,
				boxShadow: el.style.boxShadow || computedStyle.boxShadow,
				transform: el.style.transform || computedStyle.transform,
				filter: el.style.filter || computedStyle.filter
			});

			// Random color
			const randomColor = colors80s[Math.floor(Math.random() * colors80s.length)];
			const randomColor2 = colors80s[Math.floor(Math.random() * colors80s.length)];

			// Apply funky styles
			el.style.transition = 'all 0.3s ease-out';
			el.style.backgroundColor = randomColor + '33'; // 20% opacity
			el.style.borderColor = randomColor;
			el.style.boxShadow = `0 0 20px ${randomColor}, 0 0 40px ${randomColor2}`;
			el.style.filter = `hue-rotate(${Math.random() * 360}deg)`;
		});

		// Continuous color changes during funk out
		let changeCount = 0;
		const colorChangeTimer = setInterval(() => {
			funkableElements.forEach(el => {
				const randomColor = colors80s[Math.floor(Math.random() * colors80s.length)];
				const randomColor2 = colors80s[Math.floor(Math.random() * colors80s.length)];

				el.style.backgroundColor = randomColor + '33';
				el.style.borderColor = randomColor;
				el.style.boxShadow = `0 0 20px ${randomColor}, 0 0 40px ${randomColor2}`;
				el.style.filter = `hue-rotate(${Math.random() * 360}deg) brightness(${1 + Math.random() * 0.3})`;

				// Random shake
				if (Math.random() < 0.3) {
					el.style.transform = `scale(${0.95 + Math.random() * 0.1}) rotate(${(Math.random() - 0.5) * 10}deg)`;
				}
			});

			changeCount++;
			if (changeCount > 15) { // Stop after 15 changes (3 seconds)
				clearInterval(colorChangeTimer);
			}
		}, 200);

		// Confetti and sparkles
		setTimeout(() => {
			createRandomConfetti();
		}, 500);

		setTimeout(() => {
			for (let i = 0; i < 10; i++) {
				setTimeout(() => {
					const x = Math.random() * window.innerWidth;
					const y = Math.random() * window.innerHeight;
					createSparkle(x, y);
				}, i * 100);
			}
		}, 1000);

		// Play sound
		if (Math.random() < 0.7) {
			playRandomClickSound();
		}

		// Reset everything after 5 seconds
		setTimeout(() => {
			// Clear timers
			clearInterval(msgColorTimer);
			clearInterval(colorChangeTimer);

			// Fade out message
			funkOutMsg.style.transition = 'all 0.5s ease-out';
			funkOutMsg.style.opacity = '0';
			funkOutMsg.style.transform = 'translate(-50%, -50%) scale(2) rotate(360deg)';
			setTimeout(() => funkOutMsg.remove(), 500);

			// Restore original styles
			funkableElements.forEach(el => {
				const original = originalStyles.get(el);
				if (original) {
					el.style.transition = 'all 0.5s ease-out';
					el.style.backgroundColor = original.backgroundColor;
					el.style.color = original.color;
					el.style.borderColor = original.borderColor;
					el.style.boxShadow = original.boxShadow;
					el.style.transform = original.transform;
					el.style.filter = original.filter;

					// Clean up after transition
					setTimeout(() => {
						el.style.transition = '';
					}, 500);
				}
			});

		}, 5000);
	}

	/**
	 * DISCO BALL - The ultimate funky effect! 🪩
	 */
	function triggerDiscoBall() {
		if (discoballActive) return;
		discoballActive = true;

		const container = document.getElementById('funky-effects-container');
		if (!container) return;

		// Create disco ball
		const discoBall = document.createElement('div');
		discoBall.className = 'disco-ball';
		discoBall.innerHTML = '🪩';
		discoBall.style.cssText = `
      position: absolute;
      top: -100px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 100px;
      animation: discoBallDrop 1s ease-out forwards, discoSpin 2s linear infinite;
      filter: drop-shadow(0 0 30px rgba(255, 0, 255, 0.8)) drop-shadow(0 0 60px rgba(0, 255, 255, 0.6));
    `;
		container.appendChild(discoBall);

		// Create light beams
		createDiscoLights();

		// Create dance floor effect
		createDanceFloor();

		// Remove after 10 seconds
		setTimeout(() => {
			discoBall.style.animation = 'discoBallExit 1s ease-in forwards';
			setTimeout(() => {
				discoBall.remove();
				discoballActive = false;
				removeDanceFloor();
			}, 1000);
		}, 10000);
	}

	/**
	 * Create disco light beams
	 */
	function createDiscoLights() {
		const container = document.getElementById('funky-effects-container');
		if (!container) return; // Guard for sandbox/test environments
		const colors = ['#ff00ff', '#00ffff', '#ffff00', '#00ff00', '#ff0066'];

		for (let i = 0; i < 8; i++) {
			const beam = document.createElement('div');
			beam.className = 'disco-beam';
			const color = colors[Math.floor(Math.random() * colors.length)];
			const rotation = (360 / 8) * i;

			beam.style.cssText = `
        position: absolute;
        top: 10%;
        left: 50%;
        width: 4px;
        height: 100%;
        background: linear-gradient(180deg, ${color} 0%, transparent 100%);
        transform-origin: top center;
        transform: translateX(-50%) rotate(${rotation}deg);
        animation: discoBeamRotate 3s linear infinite;
        animation-delay: ${i * 0.2}s;
        opacity: 0.6;
        pointer-events: none;
      `;
			container.appendChild(beam);

			setTimeout(() => beam.remove(), 10000);
		}
	}

	/**
	 * Create dance floor pulsing effect
	 */
	function createDanceFloor() {
		document.body.style.animation = 'danceFloorPulse 0.5s ease-in-out infinite';
	}

	function removeDanceFloor() {
		document.body.style.animation = '';
	}

	/**
	 * Start continuous grooving music
	 */
	function startGrooving() {
		if (!Funky.Audio || musicPlaying) return;

		musicPlaying = true;

		playNextTrack();
	}

	/**
	 * Stop the groove
	 */
	function stopGrooving() {
		if (!Funky.Audio) return;

		musicPlaying = false;
		currentTrackIndex = -1;

		// Stop all currently playing background music
		const tracks = [
			'funky-groove.mp3',
			'disco-fever.mp3',
			'boogie-nights.mp3',
			'electric-slide.mp3',
			'funky-town.mp3'
		];

		tracks.forEach(track => {
			window.Funky.Audio.stop(track);
		});
	}

	/**
	 * Skip to next track manually
	 */
	function skipToNextTrack() {
		if (!Funky.Audio) return;

		// If not playing, start playing
		if (!musicPlaying) {
			startGrooving();
			return;
		}

		const tracks = [
			'funky-groove.mp3',
			'disco-fever.mp3',
			'boogie-nights.mp3',
			'electric-slide.mp3',
			'funky-town.mp3'
		];

		// Stop current track seamlessly
		if (currentTrackIndex >= 0 && currentTrackIndex < tracks.length) {
			const currentTrack = tracks[currentTrackIndex];
			const audio = window.Funky.Audio.sounds[currentTrack];
			if (audio && !audio.paused) {
				audio.pause();
				audio.currentTime = 0;
			}
		}

		// Play next track immediately
		playNextTrack();
	}

	/**
	 * Play next track in sequence with auto-continue
	 */
	function playNextTrack() {
		if (!Funky.Audio || !musicPlaying) return;

		const tracks = [
			'funky-groove.mp3',
			'disco-fever.mp3',
			'boogie-nights.mp3',
			'electric-slide.mp3',
			'funky-town.mp3'
		];

		// Move to next track (or random start)
		if (currentTrackIndex === -1) {
			currentTrackIndex = Math.floor(Math.random() * tracks.length);
		} else {
			currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
		}

		const track = tracks[currentTrackIndex];

		// Play with callback to continue when track ends
		// Mark as background so it doesn't get stopped by sound effects
		window.Funky.Audio.play(track, {
			volume: 0.3,
			background: true,
			onEnd: function() {
				// Auto-play next track when this one ends
				if (musicPlaying) {
					setTimeout(() => {
						playNextTrack();
					}, 500); // Small gap between tracks
				}
			}
		});
	}

	/**
	 * Play random click sound
	 */
	function playRandomClickSound() {
		if (!Funky.Audio) return;

		const sounds = [
			'disco-hit.mp3',
			'synth-pop.mp3',
			'funk-slap.mp3'
		];
		return;
		const sound = sounds[Math.floor(Math.random() * sounds.length)];
		window.Funky.Audio.play(sound, { volume: 0.2 });
	}

	/**
	 * Create ripple effect
	 */
	function createRipple(x, y) {
		const container = document.getElementById('funky-effects-container');
		if (!container) return; // Guard for sandbox/test environments
		const ripple = document.createElement('div');

		ripple.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: 20px;
      height: 20px;
      border: 2px solid #ff00ff;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      animation: rippleExpand 1s ease-out forwards;
      pointer-events: none;
    `;

		container.appendChild(ripple);
		setTimeout(() => ripple.remove(), 1000);
	}

	/**
	 * Create sparkle effect
	 */
	function createSparkle(x, y) {
		const container = document.getElementById('funky-effects-container');
		if (!container) return; // Guard for sandbox/test environments
		const sparkle = document.createElement('div');
		const sparkles = ['✨', '⭐', '💫', '🌟', '✦'];

		sparkle.innerHTML = sparkles[Math.floor(Math.random() * sparkles.length)];
		sparkle.style.cssText = `
      position: absolute;
      left: ${x + (Math.random() - 0.5) * 30}px;
      top: ${y + (Math.random() - 0.5) * 30}px;
      font-size: ${12 + Math.random() * 12}px;
      animation: sparkleFade 1s ease-out forwards;
      pointer-events: none;
    `;

		container.appendChild(sparkle);
		setTimeout(() => sparkle.remove(), 1000);
	}

	/**
	 * Create confetti burst
	 */
	function createConfettiBurst(x, y, count = 20) {
		const container = document.getElementById('funky-effects-container');
		if (!container) return; // Guard for sandbox/test environments
		const colors = ['#ff00ff', '#00ffff', '#ffff00', '#00ff00', '#ff0066', '#ff9900'];

		for (let i = 0; i < count; i++) {
			const confetti = document.createElement('div');
			const color = colors[Math.floor(Math.random() * colors.length)];
			const angle = (Math.PI * 2 * i) / count;
			const velocity = 100 + Math.random() * 100;
			const size = 5 + Math.random() * 5;

			confetti.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
        transform: translate(-50%, -50%);
        animation: confettiFly 2s ease-out forwards;
        --angle: ${angle}rad;
        --velocity: ${velocity}px;
        pointer-events: none;
      `;

			container.appendChild(confetti);
			setTimeout(() => confetti.remove(), 2000);
		}
	}

	/**
	 * Create full screen confetti
	 */
	function createFullScreenConfetti() {
		for (let i = 0; i < CONFIG.confettiCount; i++) {
			setTimeout(() => {
				const x = Math.random() * window.innerWidth;
				const y = Math.random() * window.innerHeight;
				createConfettiBurst(x, y, 10);
			}, i * 50);
		}
	}

	/**
	 * Create random confetti
	 */
	function createRandomConfetti() {
		const x = Math.random() * window.innerWidth;
		const y = Math.random() * window.innerHeight;
		createConfettiBurst(x, y, 15);
	}

	/**
	 * Pulse screen effect
	 */
	function pulseScreen() {
		document.body.style.animation = 'screenPulse 0.5s ease-in-out';
		setTimeout(() => {
			document.body.style.animation = '';
		}, 500);
	}

	/**
	 * Rainbow wave effect
	 */
	function rainbowWave() {
		const elements = document.querySelectorAll('.card, .stat-card, .btn');
		elements.forEach((el, index) => {
			setTimeout(() => {
				el.style.animation = 'rainbowFlash 1s ease-in-out';
				setTimeout(() => {
					el.style.animation = '';
				}, 1000);
			}, index * 50);
		});
	}

	/**
	 * Floating musical notes
	 */
	function floatingNotes() {
		const container = document.getElementById('funky-effects-container');
		if (!container) return; // Guard for sandbox/test environments
		const notes = ['♪', '♫', '♬', '🎵', '🎶'];

		for (let i = 0; i < 10; i++) {
			const note = document.createElement('div');
			note.innerHTML = notes[Math.floor(Math.random() * notes.length)];
			note.style.cssText = `
        position: absolute;
        left: ${Math.random() * 100}%;
        bottom: -50px;
        font-size: ${20 + Math.random() * 30}px;
        color: #ff00ff;
        animation: floatUp 5s ease-out forwards;
        animation-delay: ${i * 0.3}s;
        opacity: 0;
        pointer-events: none;
        filter: drop-shadow(0 0 10px currentColor);
      `;

			container.appendChild(note);
			setTimeout(() => note.remove(), 5000 + (i * 300));
		}
	}

	/**
	 * Lightning flash effect
	 */
	function createLightningFlash() {
		const container = document.getElementById('funky-effects-container');
		if (!container) return; // Guard for sandbox/test environments
		const flash = document.createElement('div');

		flash.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #ffffff;
      opacity: 0;
      pointer-events: none;
      z-index: 9998;
    `;

		container.appendChild(flash);

		// Quick flashes
		const flashes = [0, 100, 200, 400];
		flashes.forEach(delay => {
			setTimeout(() => {
				flash.style.opacity = '0.8';
				setTimeout(() => flash.style.opacity = '0', 50);
			}, delay);
		});

		setTimeout(() => flash.remove(), 600);
	}

	/**
	 * Star burst effect
	 */
	function createStarBurst() {
		const container = document.getElementById('funky-effects-container');
		if (!container) return; // Guard for sandbox/test environments
		const centerX = window.innerWidth / 2;
		const centerY = window.innerHeight / 2;

		for (let i = 0; i < 20; i++) {
			const star = document.createElement('div');
			star.innerHTML = '⭐';
			const angle = (Math.PI * 2 * i) / 20;

			star.style.cssText = `
        position: absolute;
        left: ${centerX}px;
        top: ${centerY}px;
        font-size: 30px;
        pointer-events: none;
        animation: starShoot 1.5s ease-out forwards;
        --shoot-angle: ${angle}rad;
      `;

			container.appendChild(star);
			setTimeout(() => star.remove(), 1500);
		}
	}

	/**
	 * Page title effect for page changes (BIG AND FUNKY!)
	 */
	function showPageTitleEffect() {
		const pageTitle = document.querySelector('.page-title');
		if (!pageTitle) return;

		const container = document.getElementById('funky-effects-container');
		if (!container) return; // Guard for sandbox/test environments
		const titleText = pageTitle.textContent.trim();

		// Create floating title effect
		const floatingTitle = document.createElement('div');
		floatingTitle.innerHTML = `💿 ${titleText} 💿`;
		floatingTitle.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0) rotate(-180deg);
      font-size: 72px;
      font-weight: 900;
      color: #ffffff;
      background: linear-gradient(135deg, #ff00ff, #00ffff, #ffff00, #ff00ff);
      background-size: 300% 300%;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-align: center;
      opacity: 0;
      pointer-events: none;
      z-index: 10000;
      filter: drop-shadow(0 0 30px #ff00ff) drop-shadow(0 0 60px #00ffff);
      text-shadow: 0 0 40px rgba(255, 0, 255, 0.8);
      animation: rainbowShift 2s linear infinite;
    `;

		container.appendChild(floatingTitle);

		// Explosive entrance
		setTimeout(() => {
			floatingTitle.style.transition = 'all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
			floatingTitle.style.opacity = '1';
			floatingTitle.style.transform = 'translate(-50%, -50%) scale(1.2) rotate(0deg)';
		}, 10);

		// Bounce effect
		setTimeout(() => {
			floatingTitle.style.transition = 'all 0.3s ease-out';
			floatingTitle.style.transform = 'translate(-50%, -50%) scale(1) rotate(5deg)';
		}, 800);

		setTimeout(() => {
			floatingTitle.style.transform = 'translate(-50%, -50%) scale(1.1) rotate(-5deg)';
		}, 1100);

		// BIG confetti bursts from multiple points
		setTimeout(() => {
			const centerX = window.innerWidth / 2;
			const centerY = window.innerHeight / 2;
			createConfettiBurst(centerX, centerY, 30);

			// Additional bursts from corners
			setTimeout(() => {
				createConfettiBurst(centerX - 200, centerY - 100, 15);
				createConfettiBurst(centerX + 200, centerY - 100, 15);
			}, 150);

			setTimeout(() => {
				createConfettiBurst(centerX - 100, centerY + 100, 15);
				createConfettiBurst(centerX + 100, centerY + 100, 15);
			}, 300);
		}, 400);

		// Sparkle explosion
		setTimeout(() => {
			for (let i = 0; i < 20; i++) {
				setTimeout(() => {
					const x = window.innerWidth / 2 + (Math.random() - 0.5) * 400;
					const y = window.innerHeight / 2 + (Math.random() - 0.5) * 300;
					createSparkle(x, y);
				}, i * 50);
			}
		}, 600);

		// Sound effect
		if (Math.random() < 0.5) {
			playRandomClickSound();
		}

		// Dramatic exit with spin
		setTimeout(() => {
			floatingTitle.style.transition = 'all 1s ease-in';
			floatingTitle.style.opacity = '0';
			floatingTitle.style.transform = 'translate(-50%, -50%) scale(2) rotate(360deg)';
			setTimeout(() => floatingTitle.remove(), 1000);
		}, 2500);
	}

	/**
	 * Welcome effect when Even Funkyer mode is activated (first time only)
	 */
	function showWelcomeEffect() {
		const container = document.getElementById('funky-effects-container');
		if (!container) return; // Guard for sandbox/test environments
		const welcome = document.createElement('div');

		welcome.innerHTML = '💿 EVEN FUNKIER MODE ACTIVATED! 💿';
		welcome.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0);
      font-size: 48px;
      font-weight: 900;
      color: #ffffff;
      background: linear-gradient(135deg, #ff00ff, #00ffff, #ffff00);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-align: center;
      animation: welcomeBounce 2s ease-out forwards;
      filter: drop-shadow(0 0 20px #ff00ff) drop-shadow(0 0 40px #00ffff);
      pointer-events: none;
      z-index: 10000;
    `;

		container.appendChild(welcome);

		// Confetti explosion
		setTimeout(() => {
			createFullScreenConfetti();
		}, 500);

		// Star burst
		setTimeout(() => {
			createStarBurst();
		}, 1000);

		setTimeout(() => {
			welcome.style.animation = 'welcomeFadeOut 1s ease-out forwards';
			setTimeout(() => welcome.remove(), 1000);
		}, 3000);
	}

	/**
	 * Utility: Throttle function
	 */
	function throttle(func, limit) {
		let inThrottle;
		return function() {
			const args = arguments;
			const context = this;
			if (!inThrottle) {
				func.apply(context, args);
				inThrottle = true;
				setTimeout(() => inThrottle = false, limit);
			}
		};
	}

	/**
	 * Set up global audio callbacks for FunkyAudio integration
	 */
	function setupAudioCallbacks() {
		// Called when any audio starts playing
		window.onAudioStarted = function(soundName, options) {
			if (!isEvenFunkyerActive()) return;

			const isMusicTrack = soundName.includes('groove') || soundName.includes('disco') ||
				soundName.includes('boogie') || soundName.includes('electric') ||
				soundName.includes('funky-town');

			// Add subtle visual feedback when sounds play
			if (!soundName.includes('click') && !isMusicTrack) {
				// For non-music sounds, add a quick pulse or sparkle
				const shouldSparkle = Math.random() > 0.7;
				if (shouldSparkle) {
					for (let i = 0; i < 3; i++) {
						createSparkle(
							window.innerWidth / 2 + (Math.random() - 0.5) * 100,
							window.innerHeight / 2 + (Math.random() - 0.5) * 100
						);
					}
				}
			}

			// If user triggers audio while music is playing, music will be auto-paused by FunkyAudio
			// We'll resume it in onAudioEnded
			if (!isMusicTrack && musicPlaying && !options.background) {

			}
		};

		// Called when any audio finishes playing
		window.onAudioEnded = function(soundName) {
			if (!isEvenFunkyerActive()) return;

			const isMusicTrack = soundName.includes('groove') || soundName.includes('disco') ||
				soundName.includes('boogie') || soundName.includes('electric') ||
				soundName.includes('funky-town');

			// If we're waiting for page audio to finish, start the groove now
			if (waitingForPageAudio && !musicPlaying && !isMusicTrack) {

				waitingForPageAudio = false;
				setTimeout(() => {
					startGrooving();
				}, 500);
			}

			// If music was paused by user audio, resume it
			if (!isMusicTrack && musicPlaying) {

				setTimeout(() => {
					playNextTrack();
				}, 500);
			}
		};

		// Called when audio is manually stopped
		window.onAudioStopped = function(soundName) {
			// Currently not used, but available for future enhancements
		};
	}

	// Export functions for theme switcher and console access
	window.EvenFunkyerMode = {
		init: init,
		cleanup: cleanup,
		discoBall: triggerDiscoBall,
		confetti: createFullScreenConfetti,
		playMusic: startGrooving,
		stopMusic: stopGrooving,
		rainbow: rainbowWave,
		notes: floatingNotes,
		pulse: pulseScreen,
		funkOut: trigger80sFunkOut,
		spinOut: triggerSpinOut,
		slideOut: triggerSlideOut,
		zoomBlast: triggerZoomBlast,
		flipOut: triggerFlipOut,
		strobeLights: triggerStrobeLights,
		logoDance: makeLogoDance,
		balloons: createFunkyBalloons,
		help: showKeyboardHelp,
		nextTrack: skipToNextTrack,

		// Fun console commands
		party: function() {
			addEffectsContainer(); // Ensure container exists
			triggerDiscoBall();
			setTimeout(() => createFullScreenConfetti(), 2000);
			setTimeout(() => rainbowWave(), 4000);
		},
		chaos: function() {
			addEffectsContainer(); // Ensure container exists
			for (let i = 0; i < 5; i++) {
				setTimeout(() => {
					createFullScreenConfetti();
					rainbowWave();
					floatingNotes();
				}, i * 1000);
			}
		},
		totalFunkOut: function() {
			addEffectsContainer(); // Ensure container exists
			trigger80sFunkOut();
			setTimeout(() => triggerDiscoBall(), 2000);
			setTimeout(() => createFullScreenConfetti(), 3000);
		}
	};

	// Add console easter egg

	/**
	 * PARTICLE BURST - Temporarily increase particle count and speed! 💫✨
	 */
	function triggerParticleBurst() {
		if (!FunkyParticles.canvas) {
			FunkyParticles.init();
		}

		const originalCount = FunkyParticles.particleCount;
		FunkyParticles.particleCount = 150;

		// Add more particles
		for (let i = 0; i < 100; i++) {
			FunkyParticles.particles.push(FunkyParticles.createParticle());
		}

		// Return to normal after 5 seconds
		setTimeout(() => {
			FunkyParticles.particleCount = originalCount;
			FunkyParticles.particles = FunkyParticles.particles.slice(0, originalCount);
		}, 5000);
	}

	/**
	 * ===== FUNKY PARTICLES EFFECT =====
	 * Floating musical notes, vinyl records, and disco balls
	 * Inspired by snow effects but FUNKIFIED!
	 */
	const FunkyParticles = {
		canvas: null,
		ctx: null,
		particles: [],
		particleCount: 50,
		symbols: ['♪', '♫', '♬', '🎵', '🎶', '💿', '🪩', '✨', '⭐', '💫'],
		colors: ['#ff00ff', '#00ffff', '#ffff00', '#ff0066', '#00ff00'],
		storageKey: 'particles_enabled',

		init: function(force) {
			// Only run in even-funkyer theme
			if (!isEvenFunkyerActive()) {
				return;
			}

			// Check if particles were previously disabled
			const isEnabled = Funky.Storage.getRaw(this.storageKey, null);
			if (!force && isEnabled === 'false') {
				return; // Don't initialize if user turned them off
			}

			this.createCanvas();
			this.createParticles();
			this.animate();

			// Save enabled state
			Funky.Storage.setRaw(this.storageKey, 'true');
		},

		createCanvas: function() {
			this.canvas = document.createElement('canvas');
			this.canvas.id = 'funky-particles';
			this.canvas.setAttribute('aria-hidden', 'true');
			this.canvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9998;
      `;
			document.body.appendChild(this.canvas);

			this.ctx = this.canvas.getContext('2d');
			this.resizeCanvas();

			// Store handler reference for cleanup
			this._resizeHandler = () => this.resizeCanvas();
			window.addEventListener('resize', this._resizeHandler);
		},

		resizeCanvas: function() {
			if (!this.canvas) return;
			this.canvas.width = window.innerWidth;
			this.canvas.height = window.innerHeight;
		},

		createParticles: function() {
			this.particles = [];
			for (let i = 0; i < this.particleCount; i++) {
				this.particles.push(this.createParticle());
			}
		},

		createParticle: function() {
			return {
				x: Math.random() * window.innerWidth,
				y: Math.random() * -window.innerHeight,
				size: Math.random() * 20 + 10,
				speed: Math.random() * 1 + 0.5,
				swing: Math.random() * 0.5,
				swingOffset: Math.random() * Math.PI * 2,
				symbol: this.symbols[Math.floor(Math.random() * this.symbols.length)],
				color: this.colors[Math.floor(Math.random() * this.colors.length)],
				rotation: Math.random() * 360,
				rotationSpeed: (Math.random() - 0.5) * 2,
				opacity: Math.random() * 0.5 + 0.3
			};
		},

		animate: function() {
			if (!this.canvas || !this.ctx) return;

			this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

			this.particles.forEach((particle, index) => {
				// Update position
				particle.y += particle.speed;
				particle.x += Math.sin(particle.y * 0.01 + particle.swingOffset) * particle.swing;
				particle.rotation += particle.rotationSpeed;

				// Reset particle when it goes off screen
				if (particle.y > this.canvas.height + particle.size) {
					this.particles[index] = this.createParticle();
					this.particles[index].y = -particle.size;
				}

				// Draw particle
				this.ctx.save();
				this.ctx.translate(particle.x, particle.y);
				this.ctx.rotate(particle.rotation * Math.PI / 180);
				this.ctx.globalAlpha = particle.opacity;
				this.ctx.font = `${particle.size}px Arial`;
				this.ctx.fillStyle = particle.color;
				this.ctx.textAlign = 'center';
				this.ctx.textBaseline = 'middle';

				// Add glow effect
				this.ctx.shadowBlur = 10;
				this.ctx.shadowColor = particle.color;

				this.ctx.fillText(particle.symbol, 0, 0);
				this.ctx.restore();
			});

			requestAnimationFrame(() => this.animate());
		},

		destroy: function() {
			// Remove resize listener
			if (this._resizeHandler) {
				window.removeEventListener('resize', this._resizeHandler);
				this._resizeHandler = null;
			}

			if (this.canvas) {
				this.canvas.remove();
				this.canvas = null;
				this.ctx = null;
				this.particles = [];
				// Save disabled state
				Funky.Storage.setRaw(this.storageKey, 'false');
			}
		}
	};

	// Create public API object
	const EvenFunkyerEffects = {
		init: init,
		cleanup: cleanup
	};

	// Register with Funky
	if (typeof Funky !== 'undefined' && Funky.register) {
		Funky.register('EvenFunkyer', { Effects: EvenFunkyerEffects, Particles: FunkyParticles });
	}

	// Initialize particles when theme is active
	if (isEvenFunkyerActive()) {
		FunkyParticles.init();
	}

	// Watch for theme changes to initialize/destroy particles
	var handleThemeChange = function() {
		if (isEvenFunkyerActive() && !FunkyParticles.canvas) {
			FunkyParticles.init();
		} else if (!isEvenFunkyerActive() && FunkyParticles.canvas) {
			FunkyParticles.destroy();
		}
	};

	var particleObserver = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			if (mutation.attributeName === 'data-theme') {
				handleThemeChange();
			}
		});
	});

	// Watch both documentElement and body for theme changes
	particleObserver.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ['data-theme']
	});
	particleObserver.observe(document.body, {
		attributes: true,
		attributeFilter: ['data-theme']
	});

})();

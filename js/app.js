/**
 * Funky Frame - Shared Application Logic
 * Common functionality for all pages (sidebar, theme, keyboard, command palette, etc.)
 */
(function() {
  'use strict';

  // Storage keys
  var SIDEBAR_KEY = 'funky-sidebar-collapsed';
  var THEME_KEY = 'funky-theme';
  var DENSITY_KEY = 'funky-density';
  var THEMES = ['dark', 'light', 'even-funkyer', 'high-contrast'];
  var DENSITIES = ['comfortable', 'compact', 'spacious'];

  // DOM References
  var sidebar;
  var sidebarToggle;
  var hamburgerMenu;
  var sidebarOverlay;
  var mainWrapper;
  var toggleIcon;

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  /**
   * Check if viewport is mobile width
   */
  function isMobile() {
    return window.innerWidth <= 768;
  }

  // ============================================
  // THEME MANAGEMENT
  // ============================================

  /**
   * Get current theme from localStorage
   */
  function getTheme() {
    try {
      return localStorage.getItem(THEME_KEY) || 'dark';
    } catch(e) {
      return 'dark';
    }
  }

  /**
   * Set theme and persist to localStorage
   */
  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch(e) {}

    // Show toast notification
    if (typeof Funky !== 'undefined' && Funky.Toast) {
      var themeNames = { 'dark': 'Dark', 'light': 'Light', 'even-funkyer': 'Even Funkyer', 'high-contrast': 'High Contrast' };
      Funky.Toast.info('Theme: ' + (themeNames[theme] || theme));
    }
  }

  /**
   * Cycle through themes: Dark → Light → Even Funkyer → High Contrast
   */
  function toggleTheme() {
    var current = getTheme();
    var idx = THEMES.indexOf(current);
    var next = THEMES[(idx + 1) % THEMES.length];
    setTheme(next);
  }

  // ============================================
  // DENSITY MANAGEMENT
  // ============================================

  /**
   * Get current density from localStorage
   */
  function getDensity() {
    try {
      return localStorage.getItem(DENSITY_KEY) || 'comfortable';
    } catch(e) {
      return 'comfortable';
    }
  }

  /**
   * Set density and persist to localStorage
   */
  function setDensity(density) {
    document.documentElement.setAttribute('data-density', density);
    document.body.setAttribute('data-density', density);
    try {
      localStorage.setItem(DENSITY_KEY, density);
    } catch(e) {}

    // Show toast notification
    if (typeof Funky !== 'undefined' && Funky.Toast) {
      var densityNames = { 'comfortable': 'Comfortable', 'compact': 'Compact', 'spacious': 'Spacious' };
      Funky.Toast.info('Density: ' + (densityNames[density] || density));
    }
  }

  /**
   * Cycle through densities: Comfortable → Compact → Spacious
   */
  function toggleDensity() {
    var current = getDensity();
    var idx = DENSITIES.indexOf(current);
    var next = DENSITIES[(idx + 1) % DENSITIES.length];
    setDensity(next);
  }

  // ============================================
  // SIDEBAR MANAGEMENT
  // ============================================

  /**
   * Open mobile drawer
   */
  function openMobileDrawer() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('active');
    if (hamburgerMenu) hamburgerMenu.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close mobile drawer
   */
  function closeMobileDrawer() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
    if (hamburgerMenu) hamburgerMenu.classList.remove('active');
    document.body.style.overflow = '';
  }

  /**
   * Toggle mobile drawer
   */
  function toggleMobileDrawer() {
    if (sidebar.classList.contains('open')) {
      closeMobileDrawer();
    } else {
      openMobileDrawer();
    }
  }

  /**
   * Collapse sidebar (desktop)
   */
  function collapseSidebar() {
    sidebar.classList.add('collapsed');
    if (mainWrapper) mainWrapper.classList.add('sidebar-collapsed');
    if (toggleIcon) toggleIcon.textContent = '▶';
    try { localStorage.setItem(SIDEBAR_KEY, 'true'); } catch(e) {}
  }

  /**
   * Expand sidebar (desktop)
   */
  function expandSidebar() {
    sidebar.classList.remove('collapsed');
    if (mainWrapper) mainWrapper.classList.remove('sidebar-collapsed');
    if (toggleIcon) toggleIcon.textContent = '◀';
    try { localStorage.setItem(SIDEBAR_KEY, 'false'); } catch(e) {}
  }

  /**
   * Toggle sidebar (handles both mobile and desktop)
   */
  function toggleSidebar() {
    if (isMobile()) {
      toggleMobileDrawer();
    } else {
      if (sidebar.classList.contains('collapsed')) {
        expandSidebar();
      } else {
        collapseSidebar();
      }
    }
  }

  /**
   * Load saved sidebar state from localStorage
   */
  function loadSidebarState() {
    if (isMobile()) {
      sidebar.classList.remove('collapsed');
      sidebar.classList.remove('open');
      if (mainWrapper) mainWrapper.classList.remove('sidebar-collapsed');
      return;
    }

    try {
      var saved = localStorage.getItem(SIDEBAR_KEY);
      if (saved === 'true') {
        collapseSidebar();
      } else {
        expandSidebar();
      }
    } catch(e) {}
  }

  /**
   * Initialize sidebar functionality
   */
  function initSidebar() {
    sidebar = document.getElementById('sidebar');
    sidebarToggle = document.getElementById('sidebarToggle');
    hamburgerMenu = document.getElementById('hamburgerMenu');
    sidebarOverlay = document.getElementById('sidebarOverlay');
    mainWrapper = document.querySelector('.main-wrapper');
    toggleIcon = sidebarToggle ? sidebarToggle.querySelector('.toggle-icon') : null;

    if (!sidebar) return;

    // Load initial state
    loadSidebarState();

    // Event listeners
    if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
    if (hamburgerMenu) hamburgerMenu.addEventListener('click', toggleSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeMobileDrawer);

    // Close mobile drawer when nav link is clicked
    sidebar.querySelectorAll('.nav-link').forEach(function(link) {
      link.addEventListener('click', function() {
        if (isMobile()) closeMobileDrawer();
      });
    });

    // Handle window resize
    var resizeTimeout;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function() {
        if (isMobile()) {
          sidebar.classList.remove('collapsed');
          if (mainWrapper) mainWrapper.classList.remove('sidebar-collapsed');
        } else {
          closeMobileDrawer();
          loadSidebarState();
        }
      }, 150);
    });
  }

  // ============================================
  // KEYBOARD SHORTCUTS
  // ============================================

  /**
   * Initialize global keyboard shortcuts
   */
  function initKeyboard() {
    if (typeof Funky === 'undefined' || !Funky.Keyboard || !Funky.Keyboard.register) return;

    // Toggle sidebar: Cmd/Ctrl + \
    Funky.Keyboard.register({
      key: 'mod+\\',
      description: 'Toggle sidebar',
      handler: function() {
        toggleSidebar();
      }
    });

    // Toggle theme: Cmd/Ctrl + Shift + T
    Funky.Keyboard.register({
      key: 'mod+shift+t',
      description: 'Toggle theme',
      handler: function() {
        toggleTheme();
      }
    });

    // Focus search/filter: /
    Funky.Keyboard.register({
      key: '/',
      description: 'Focus search',
      handler: function(e) {
        // Don't trigger if already in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        var searchInput = document.querySelector('[data-filter-input], #testFilter, .search-input');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    });

    // Start tour: Shift + ?
    Funky.Keyboard.register({
      key: 'shift+?',
      description: 'Start interactive tour',
      handler: function(e) {
        // Don't trigger if in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        if (typeof FunkyTour !== 'undefined' && FunkyTour.start) {
          FunkyTour.start();
        }
      }
    });
  }

  // ============================================
  // COMMAND PALETTE
  // ============================================

  /**
   * Initialize command palette with navigation and action commands
   */
  function initCommandPalette() {
    if (typeof Funky === 'undefined' || !Funky.CommandPalette) return;

    // Initialize with options
    Funky.CommandPalette.init({
      hotkey: 'mod+k',
      placeholder: 'Type a command or search...',
      maxResults: 10,
      showRecent: true,
      maxRecent: 5,
      storageKey: 'funky_frame_palette_recent',
      closeOnSelect: true,
      showShortcuts: true
    });

    // Navigation commands
    Funky.CommandPalette.registerMany([
      {
        id: 'nav-about',
        title: 'Go to About',
        icon: 'fas fa-home',
        category: 'Navigation',
        action: function() {
          if (Funky.SPA) Funky.SPA.navigate('/about/');
          else window.location.href = '/about/';
        }
      },
      {
        id: 'nav-docs',
        title: 'Go to Documentation',
        icon: 'fas fa-book-open',
        category: 'Navigation',
        action: function() {
          if (Funky.SPA) Funky.SPA.navigate('/docs/');
          else window.location.href = '/docs/';
        }
      },
      {
        id: 'nav-playground',
        title: 'Go to Playground',
        icon: 'fas fa-flask',
        category: 'Navigation',
        action: function() {
          if (Funky.SPA) Funky.SPA.navigate('/playground/');
          else window.location.href = '/playground/';
        }
      },
      {
        id: 'nav-tests',
        title: 'Go to Test Runner',
        icon: 'fas fa-vial',
        category: 'Navigation',
        action: function() {
          if (Funky.SPA) Funky.SPA.navigate('/test-runner/');
          else window.location.href = '/test-runner/';
        }
      }
    ]);

    // Action commands
    Funky.CommandPalette.registerMany([
      {
        id: 'toggle-sidebar',
        title: 'Toggle Sidebar',
        icon: 'fas fa-bars',
        shortcut: 'mod+\\',
        category: 'Actions',
        action: toggleSidebar
      },
      {
        id: 'toggle-theme',
        title: 'Toggle Theme',
        icon: 'fas fa-moon',
        shortcut: 'mod+shift+t',
        category: 'Actions',
        action: toggleTheme
      }
    ]);

    // Help commands
    Funky.CommandPalette.registerMany([
      {
        id: 'start-tour',
        title: 'Start Interactive Tour',
        icon: 'fas fa-route',
        shortcut: 'shift+?',
        category: 'Help',
        action: function() {
          if (typeof FunkyTour !== 'undefined' && FunkyTour.start) {
            FunkyTour.start();
          }
        }
      },
      {
        id: 'start-tour-beginning',
        title: 'Start Tour from Beginning',
        icon: 'fas fa-play-circle',
        category: 'Help',
        action: function() {
          if (typeof FunkyTour !== 'undefined' && FunkyTour.startFromBeginning) {
            FunkyTour.startFromBeginning();
          }
        }
      }
    ]);

    // Settings with sub-palettes for themes
    Funky.CommandPalette.register({
      id: 'settings-theme',
      title: 'Change Theme',
      icon: 'fas fa-palette',
      category: 'Settings',
      children: [
        {
          id: 'theme-dark',
          title: 'Dark',
          icon: 'fas fa-moon',
          action: function() { setTheme('dark'); }
        },
        {
          id: 'theme-light',
          title: 'Light',
          icon: 'fas fa-sun',
          action: function() { setTheme('light'); }
        },
        {
          id: 'theme-funkyer',
          title: 'Even Funkyer',
          icon: 'fas fa-star',
          action: function() { setTheme('even-funkyer'); }
        },
        {
          id: 'theme-high-contrast',
          title: 'High Contrast',
          icon: 'fas fa-adjust',
          action: function() { setTheme('high-contrast'); }
        }
      ]
    });

    // Settings with sub-palettes for density
    Funky.CommandPalette.register({
      id: 'settings-density',
      title: 'Change Density',
      icon: 'fas fa-compress-alt',
      category: 'Settings',
      children: [
        {
          id: 'density-comfortable',
          title: 'Comfortable',
          icon: 'fas fa-expand',
          action: function() { setDensity('comfortable'); }
        },
        {
          id: 'density-compact',
          title: 'Compact',
          icon: 'fas fa-compress',
          action: function() { setDensity('compact'); }
        },
        {
          id: 'density-spacious',
          title: 'Spacious',
          icon: 'fas fa-expand-arrows-alt',
          action: function() { setDensity('spacious'); }
        }
      ]
    });
  }

  // ============================================
  // TOOLTIPS
  // ============================================

  /**
   * Initialize tooltip system
   */
  function initTooltips() {
    if (typeof Funky === 'undefined' || !Funky.Tooltip) return;

    // Tooltip.initAll() auto-discovers elements with data-funky-tooltip or data-bs-toggle="tooltip"
    Funky.Tooltip.initAll();
  }

  // ============================================
  // ACCESSIBILITY
  // ============================================

  /**
   * Initialize accessibility features
   */
  function initAccessibility() {
    // Screen reader announcements for SPA navigation
    if (typeof Funky !== 'undefined' && Funky.Announce && Funky.PubSub) {
      Funky.PubSub.on('funky:spa:navigate', function() {
        var title = document.title || 'Page loaded';
        Funky.Announce.polite(title);
      });
    }

    // A11y enhancer for tables/lists
    if (typeof Funky !== 'undefined' && Funky.A11yEnhancer) {
      Funky.A11yEnhancer.init();
    }

    // Skip links
    if (typeof Funky !== 'undefined' && Funky.SkipLink) {
      Funky.SkipLink.init();
    }
  }

  // ============================================
  // PREFERENCES
  // ============================================

  /**
   * Initialize preferences system
   * Note: We skip Preferences.apply() because funky-frame uses top navigation
   * and the default preferences would override it to left navigation.
   * Theme is already handled by theme-init.js and our setTheme function.
   */
  function initPreferences() {
    // Funky Frame handles its own theme via theme-init.js and setTheme()
    // Skip Preferences to avoid overriding the top navigation layout
  }

  // ============================================
  // MOBILE CORE
  // ============================================

  /**
   * Initialize mobile/tablet bottom navigation
   * Provides touch-accessible access to keyboard-only features on mobile and tablet
   */
  function initMobileCore() {
    if (typeof Funky === 'undefined' || !Funky.MobileCore) return;

    Funky.MobileCore.init({
      breakpoint: 'tablet',  // Show on both mobile (<768px) and tablet (<1024px)
      maxVisibleActions: 5,
      hideOnScroll: true,
      autoRegister: true,
      defaultActions: {
        sidenavToggle: false,  // Header already has hamburger menu
        commandPalette: true,
        keyboardHelp: true,
        skipLinks: true
      }
    });
  }

  // ============================================
  // SERVICE WORKER & PWA UPDATE
  // ============================================

  var _updatePanel = null;
  var _versionBadge = null;

  /**
   * Initialize Service Worker for PWA features
   */
  function initServiceWorker() {
    if (typeof Funky !== 'undefined' && Funky.ServiceWorker && Funky.ServiceWorker.isSupported()) {
      Funky.ServiceWorker.register('/sw.js', {
        scope: '/',
        onUpdate: function() {
          showUpdatePanel();
        }
      }).then(function(registration) {
        console.log('[Funky Frame] Service Worker registered:', registration.scope);
        
        // Check if there's already a waiting SW (update available)
        if (registration.waiting) {
          showUpdatePanel();
        }
        
        // Also check for updates when page becomes visible (user returns to tab)
        document.addEventListener('visibilitychange', function() {
          if (document.visibilityState === 'visible') {
            // Trigger SW update check
            Funky.ServiceWorker.update().catch(function() {});
          }
        });
      }).catch(function(error) {
        console.warn('[Funky Frame] Service Worker registration failed:', error);
      });
      
      // Listen for update events
      if (Funky.PubSub) {
        Funky.PubSub.on('funky:sw:updated', function() {
          showUpdatePanel();
        });
      }
    }
  }

  /**
   * Show the update available panel
   */
  function showUpdatePanel(version) {
    // Don't show if already visible
    if (_updatePanel && _updatePanel.classList.contains('pwa-update-panel--visible')) {
      return;
    }
    
    // Don't show if user dismissed this version already this session
    try {
      var dismissed = sessionStorage.getItem('funky-update-dismissed');
      if (dismissed && (!version || dismissed === version)) {
        return;
      }
    } catch (e) {}
    
    // Store the version being offered for dismissal tracking
    var offeredVersion = version || 'unknown';
    
    // Create panel if not exists
    if (!_updatePanel) {
      _updatePanel = document.createElement('div');
      _updatePanel.className = 'pwa-update-panel';
      _updatePanel.setAttribute('role', 'alert');
      _updatePanel.innerHTML = 
        '<div class="pwa-update-panel__text">' +
          '<strong>Update Available!</strong><br>' +
          '<span class="pwa-update-panel__version">A new version is ready.</span>' +
        '</div>' +
        '<div class="pwa-update-panel__actions">' +
          '<button class="pwa-update-panel__btn pwa-update-panel__btn--primary" data-action="update">' +
            '<i class="fas fa-sync-alt"></i> Update Now' +
          '</button>' +
          '<button class="pwa-update-panel__btn pwa-update-panel__btn--secondary" data-action="dismiss">' +
            'Later' +
          '</button>' +
        '</div>' +
        '<button class="pwa-update-panel__close" aria-label="Dismiss" data-action="dismiss">' +
          '<i class="fas fa-times"></i>' +
        '</button>';
      
      document.body.appendChild(_updatePanel);
      
      // Event handlers
      _updatePanel.addEventListener('click', function(e) {
        var action = e.target.closest('[data-action]');
        if (!action) return;
        
        var actionType = action.dataset.action;
        if (actionType === 'update') {
          forceUpdate();
        } else if (actionType === 'dismiss') {
          hideUpdatePanel(offeredVersion);
        }
      });
    }
    
    // Update version text if provided
    if (version) {
      var versionSpan = _updatePanel.querySelector('.pwa-update-panel__version');
      if (versionSpan) {
        versionSpan.textContent = 'Version ' + version + ' is ready.';
      }
    }
    
    // Show panel with animation
    requestAnimationFrame(function() {
      _updatePanel.classList.add('pwa-update-panel--visible');
    });
  }

  /**
   * Hide the update panel
   */
  function hideUpdatePanel() {
    if (_updatePanel) {
      _updatePanel.classList.remove('pwa-update-panel--visible');
    }
  }

  /**
   * Force update - clear caches and reload
   */
  function forceUpdate() {
    // Update button state
    var updateBtn = _updatePanel && _updatePanel.querySelector('[data-action="update"]');
    if (updateBtn) {
      updateBtn.classList.add('pwa-update-btn--loading');
      updateBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Updating...';
      updateBtn.disabled = true;
    }
    
    if (typeof Funky !== 'undefined' && Funky.ServiceWorker && Funky.ServiceWorker.forceUpdate) {
      Funky.ServiceWorker.forceUpdate()
        .catch(function(error) {
          console.error('[Funky Frame] Force update failed:', error);
          if (updateBtn) {
            updateBtn.classList.remove('pwa-update-btn--loading');
            updateBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Failed';
          }
          
          if (typeof Funky !== 'undefined' && Funky.Toast) {
            Funky.Toast.error('Update failed. Please try again.');
          }
        });
    } else {
      // Fallback: just reload
      window.location.reload(true);
    }
  }

  /**
   * Create version badge for sidebar footer
   */
  function createVersionBadge() {
    var footer = document.querySelector('.sidebar-footer');
    if (!footer || _versionBadge) return;
    
    var version = '1.0.2'; // Could be fetched from version.json
    
    _versionBadge = document.createElement('div');
    _versionBadge.className = 'pwa-version-badge';
    _versionBadge.setAttribute('title', 'App version');
    _versionBadge.innerHTML = 
      '<i class="fas fa-code-branch pwa-version-badge__icon"></i>' +
      '<span class="pwa-version-badge__version">v' + version + '</span>';
    
    footer.appendChild(_versionBadge);
    
    // Click to check for updates
    _versionBadge.addEventListener('click', function() {
      checkForUpdates();
      
      if (typeof Funky !== 'undefined' && Funky.Toast) {
        Funky.Toast.info('Checking for updates...', { duration: 2000 });
      }
    });
  }

  // ============================================
  // SPA NAVIGATION
  // ============================================

  /**
   * Initialize SPA navigation
   */
  function initSPA() {
    if (typeof Funky !== 'undefined' && Funky.SPA) {
      Funky.SPA.init();
    }
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  /**
   * Initialize application
   */
  function init() {
    // Core functionality
    initSidebar();

    // Enhanced features
    initKeyboard();
    initCommandPalette();
    initTooltips();
    initAccessibility();
    initPreferences();
    initMobileCore();

    // System features
    initServiceWorker();
    initSPA();
    
    // PWA version badge (after sidebar is ready)
    createVersionBadge();

    console.log('[Funky Frame] App initialized');
  }

  // Initialize when DOM is ready
  if (document.readyState !== 'loading') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }

  // Expose API for external use
  window.FunkyApp = {
    // Sidebar
    toggleSidebar: toggleSidebar,
    collapseSidebar: collapseSidebar,
    expandSidebar: expandSidebar,
    // Theme
    toggleTheme: toggleTheme,
    setTheme: setTheme,
    getTheme: getTheme,
    // Density
    toggleDensity: toggleDensity,
    setDensity: setDensity,
    getDensity: getDensity,
    // PWA Updates
    forceUpdate: forceUpdate,
    showUpdatePanel: showUpdatePanel
  };

})();

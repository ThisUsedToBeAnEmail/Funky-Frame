/**
 * Theme Initialization Script
 *
 * IMPORTANT: This script must run synchronously in the <head> to prevent
 * a flash of the wrong theme. Include via:
 *   <script src="../js/theme-init.js"></script>
 *
 * Do NOT defer or async this script.
 */
(function() {
  try {
    var stored = localStorage.getItem('funky_playground_prefs');
    var prefs = stored ? JSON.parse(stored) : {};
    var theme = prefs.theme || 'dark';
    var effectiveTheme = theme;
    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    document.documentElement.setAttribute('data-density', prefs.density || 'comfortable');
    document.documentElement.setAttribute('data-animations', prefs.animations === false ? 'off' : 'on');
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();

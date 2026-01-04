/**
 * Tests for Funky.A11yValidator
 *
 * Development mode accessibility validator for WCAG 2.1 violations.
 */
FunkyTests.describe('Funky.A11yValidator', function() {
  'use strict';

  var expect = FunkyTests.expect;
  var A11yValidator = Funky.A11yValidator;
  var testCounter = 0;

  // Skip all tests if A11yValidator not available
  if (!A11yValidator) {
    FunkyTests.it('A11yValidator not available in sandbox', function() {
      expect(true).toBe(true);
    });
    return;
  }

  function uniqueId(prefix) {
    testCounter++;
    return (prefix || 'test') + '_' + testCounter + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  }

  // =========================================================================
  // Module Structure
  // =========================================================================

  FunkyTests.describe('Module Structure', function() {
    FunkyTests.it('should be defined on Funky namespace', function() {
      expect(A11yValidator).toBeDefined();
      expect(typeof A11yValidator).toBe('object');
    });

    FunkyTests.it('should have rules property', function() {
      expect('rules' in A11yValidator).toBe(true);
      expect(typeof A11yValidator.rules).toBe('object');
    });

    FunkyTests.it('should have issues property', function() {
      expect('issues' in A11yValidator).toBe(true);
      expect(Array.isArray(A11yValidator.issues)).toBe(true);
    });

    FunkyTests.it('should have isRunning property', function() {
      expect('isRunning' in A11yValidator).toBe(true);
      expect(typeof A11yValidator.isRunning).toBe('boolean');
    });

    FunkyTests.it('should have init method', function() {
      expect(typeof A11yValidator.init).toBe('function');
    });

    FunkyTests.it('should have configure method', function() {
      expect(typeof A11yValidator.configure).toBe('function');
    });

    FunkyTests.it('should have disable method', function() {
      expect(typeof A11yValidator.disable).toBe('function');
    });

    FunkyTests.it('should have enable method', function() {
      expect(typeof A11yValidator.enable).toBe('function');
    });

    FunkyTests.it('should have validate method', function() {
      expect(typeof A11yValidator.validate).toBe('function');
    });

    FunkyTests.it('should have getResults method', function() {
      expect(typeof A11yValidator.getResults).toBe('function');
    });
  });

  // =========================================================================
  // Default Rules
  // =========================================================================

  FunkyTests.describe('Default Rules', function() {
    FunkyTests.beforeEach(function() {
      A11yValidator.init();
    });

    FunkyTests.it('should have missingAlt rule', function() {
      expect(A11yValidator.rules.missingAlt).toBeDefined();
      expect(A11yValidator.rules.missingAlt.enabled).toBe(true);
    });

    FunkyTests.it('should have missingLabels rule', function() {
      expect(A11yValidator.rules.missingLabels).toBeDefined();
      expect(A11yValidator.rules.missingLabels.enabled).toBe(true);
    });

    FunkyTests.it('should have emptyButtons rule', function() {
      expect(A11yValidator.rules.emptyButtons).toBeDefined();
      expect(A11yValidator.rules.emptyButtons.enabled).toBe(true);
    });

    FunkyTests.it('should have lowContrast rule', function() {
      expect(A11yValidator.rules.lowContrast).toBeDefined();
      expect(A11yValidator.rules.lowContrast.enabled).toBe(true);
    });

    FunkyTests.it('should have duplicateIds rule', function() {
      expect(A11yValidator.rules.duplicateIds).toBeDefined();
      expect(A11yValidator.rules.duplicateIds.enabled).toBe(true);
    });

    FunkyTests.it('should have invalidAria rule', function() {
      expect(A11yValidator.rules.invalidAria).toBeDefined();
      expect(A11yValidator.rules.invalidAria.enabled).toBe(true);
    });

    FunkyTests.it('should have brokenFocusOrder rule', function() {
      expect(A11yValidator.rules.brokenFocusOrder).toBeDefined();
      expect(A11yValidator.rules.brokenFocusOrder.enabled).toBe(true);
    });

    FunkyTests.it('should have missingLandmarks rule', function() {
      expect(A11yValidator.rules.missingLandmarks).toBeDefined();
      expect(A11yValidator.rules.missingLandmarks.enabled).toBe(true);
    });

    FunkyTests.it('should have severity levels', function() {
      expect(A11yValidator.rules.missingAlt.severity).toBe('error');
      expect(A11yValidator.rules.emptyButtons.severity).toBe('warning');
      expect(A11yValidator.rules.missingLandmarks.severity).toBe('info');
    });
  });

  // =========================================================================
  // Configure
  // =========================================================================

  FunkyTests.describe('Configure', function() {
    FunkyTests.beforeEach(function() {
      A11yValidator.init();
    });

    FunkyTests.it('should update rule severity', function() {
      A11yValidator.configure({
        lowContrast: { severity: 'error' }
      });
      expect(A11yValidator.rules.lowContrast.severity).toBe('error');
    });

    FunkyTests.it('should disable rule via configure', function() {
      A11yValidator.configure({
        missingAlt: { enabled: false }
      });
      expect(A11yValidator.rules.missingAlt.enabled).toBe(false);
    });

    FunkyTests.it('should not affect other rules', function() {
      A11yValidator.configure({
        missingAlt: { severity: 'warning' }
      });
      expect(A11yValidator.rules.missingLabels.severity).toBe('error');
    });

    FunkyTests.it('should ignore unknown rules', function() {
      expect(function() {
        A11yValidator.configure({
          unknownRule: { severity: 'error' }
        });
      }).not.toThrow();
    });
  });

  // =========================================================================
  // Enable/Disable
  // =========================================================================

  FunkyTests.describe('Enable/Disable', function() {
    FunkyTests.beforeEach(function() {
      A11yValidator.init();
    });

    FunkyTests.it('should disable a rule', function() {
      A11yValidator.disable('missingAlt');
      expect(A11yValidator.rules.missingAlt.enabled).toBe(false);
    });

    FunkyTests.it('should enable a rule', function() {
      A11yValidator.disable('missingAlt');
      A11yValidator.enable('missingAlt');
      expect(A11yValidator.rules.missingAlt.enabled).toBe(true);
    });

    FunkyTests.it('should handle unknown rule in disable', function() {
      expect(function() {
        A11yValidator.disable('unknownRule');
      }).not.toThrow();
    });

    FunkyTests.it('should handle unknown rule in enable', function() {
      expect(function() {
        A11yValidator.enable('unknownRule');
      }).not.toThrow();
    });
  });

  // =========================================================================
  // Element Exclusion
  // =========================================================================

  FunkyTests.describe('Element Exclusion', function() {
    var fixture;

    FunkyTests.beforeEach(function() {
      fixture = FunkyTests.fixture('<div id="' + uniqueId('a11y-exclude') + '"></div>');
    });

    FunkyTests.afterEach(function() {
      fixture.cleanup();
    });

    FunkyTests.it('should exclude je-object elements', function() {
      var el = document.createElement('div');
      el.className = 'je-object';
      fixture.el.appendChild(el);
      expect(A11yValidator.isExcluded(el)).toBe(true);
    });

    FunkyTests.it('should exclude wysimark elements', function() {
      var el = document.createElement('div');
      el.className = 'wysimark';
      fixture.el.appendChild(el);
      expect(A11yValidator.isExcluded(el)).toBe(true);
    });

    FunkyTests.it('should exclude data-a11y-ignore elements', function() {
      var el = document.createElement('div');
      el.setAttribute('data-a11y-ignore', '');
      fixture.el.appendChild(el);
      expect(A11yValidator.isExcluded(el)).toBe(true);
    });

    FunkyTests.it('should not exclude regular elements', function() {
      var el = document.createElement('div');
      fixture.el.appendChild(el);
      expect(A11yValidator.isExcluded(el)).toBe(false);
    });
  });

  // =========================================================================
  // Element Identifier
  // =========================================================================

  FunkyTests.describe('Element Identifier', function() {
    var fixture;

    FunkyTests.beforeEach(function() {
      fixture = FunkyTests.fixture('<div id="' + uniqueId('a11y-id') + '"></div>');
    });

    FunkyTests.afterEach(function() {
      fixture.cleanup();
    });

    FunkyTests.it('should return id if present', function() {
      var el = document.createElement('div');
      el.id = 'test-element';
      fixture.el.appendChild(el);
      expect(A11yValidator.getElementId(el)).toBe('#test-element');
    });

    FunkyTests.it('should return tag and class if no id', function() {
      var el = document.createElement('div');
      el.className = 'my-class';
      fixture.el.appendChild(el);
      expect(A11yValidator.getElementId(el)).toBe('div.my-class');
    });

    FunkyTests.it('should return just tag if no id or class', function() {
      var el = document.createElement('span');
      fixture.el.appendChild(el);
      expect(A11yValidator.getElementId(el)).toBe('span');
    });
  });

  // =========================================================================
  // Validate
  // =========================================================================

  FunkyTests.describe('Validate', function() {
    var fixture;

    FunkyTests.beforeEach(function() {
      A11yValidator.init();
      fixture = FunkyTests.fixture('<div id="' + uniqueId('a11y-validate') + '"></div>');
    });

    FunkyTests.afterEach(function() {
      fixture.cleanup();
    });

    FunkyTests.it('should return results object', function() {
      var results = A11yValidator.validate(fixture.el);
      expect(results).toBeDefined();
      expect(typeof results).toBe('object');
    });

    FunkyTests.it('should return error count', function() {
      var results = A11yValidator.validate(fixture.el);
      expect(typeof results.errors).toBe('number');
    });

    FunkyTests.it('should return warning count', function() {
      var results = A11yValidator.validate(fixture.el);
      expect(typeof results.warnings).toBe('number');
    });

    FunkyTests.it('should return info count', function() {
      var results = A11yValidator.validate(fixture.el);
      expect(typeof results.info).toBe('number');
    });

    FunkyTests.it('should return total count', function() {
      var results = A11yValidator.validate(fixture.el);
      expect(typeof results.total).toBe('number');
      expect(results.total).toBe(results.errors + results.warnings + results.info);
    });

    FunkyTests.it('should return issues array', function() {
      var results = A11yValidator.validate(fixture.el);
      expect(Array.isArray(results.issues)).toBe(true);
    });

    FunkyTests.it('should not run if already running', function() {
      A11yValidator.isRunning = true;
      var results = A11yValidator.validate(fixture.el);
      expect(results).toBe(null);
      A11yValidator.isRunning = false;
    });
  });

  // =========================================================================
  // Missing Alt Check
  // =========================================================================

  FunkyTests.describe('Missing Alt Check', function() {
    var fixture;

    FunkyTests.beforeEach(function() {
      A11yValidator.init();
      fixture = FunkyTests.fixture('<div id="' + uniqueId('a11y-alt') + '"></div>');
    });

    FunkyTests.afterEach(function() {
      fixture.cleanup();
    });

    FunkyTests.it('should detect image without alt', function() {
      fixture.el.innerHTML = '<img src="test.jpg">';
      var results = A11yValidator.validate(fixture.el);
      var altIssues = results.issues.filter(function(i) {
        return i.rule === 'missingAlt';
      });
      expect(altIssues.length).toBeGreaterThan(0);
    });

    FunkyTests.it('should not flag image with alt', function() {
      fixture.el.innerHTML = '<img src="test.jpg" alt="Test image">';
      var results = A11yValidator.validate(fixture.el);
      var altIssues = results.issues.filter(function(i) {
        return i.rule === 'missingAlt';
      });
      expect(altIssues.length).toBe(0);
    });

    FunkyTests.it('should not flag image with empty alt (decorative)', function() {
      fixture.el.innerHTML = '<img src="test.jpg" alt="">';
      var results = A11yValidator.validate(fixture.el);
      var altIssues = results.issues.filter(function(i) {
        return i.rule === 'missingAlt';
      });
      expect(altIssues.length).toBe(0);
    });

    FunkyTests.it('should detect role=img without aria-label', function() {
      fixture.el.innerHTML = '<span role="img"></span>';
      var results = A11yValidator.validate(fixture.el);
      var altIssues = results.issues.filter(function(i) {
        return i.rule === 'missingAlt';
      });
      expect(altIssues.length).toBeGreaterThan(0);
    });

    FunkyTests.it('should not flag role=img with aria-label', function() {
      fixture.el.innerHTML = '<span role="img" aria-label="Description"></span>';
      var results = A11yValidator.validate(fixture.el);
      var altIssues = results.issues.filter(function(i) {
        return i.rule === 'missingAlt';
      });
      expect(altIssues.length).toBe(0);
    });
  });

  // =========================================================================
  // Missing Labels Check
  // =========================================================================

  FunkyTests.describe('Missing Labels Check', function() {
    var fixture;

    FunkyTests.beforeEach(function() {
      A11yValidator.init();
      fixture = FunkyTests.fixture('<div id="' + uniqueId('a11y-labels') + '"></div>');
    });

    FunkyTests.afterEach(function() {
      fixture.cleanup();
    });

    FunkyTests.it('should detect input without label', function() {
      fixture.el.innerHTML = '<input type="text">';
      var results = A11yValidator.validate(fixture.el);
      var labelIssues = results.issues.filter(function(i) {
        return i.rule === 'missingLabels';
      });
      expect(labelIssues.length).toBeGreaterThan(0);
    });

    FunkyTests.it('should not flag input with aria-label', function() {
      fixture.el.innerHTML = '<input type="text" aria-label="Username">';
      var results = A11yValidator.validate(fixture.el);
      var labelIssues = results.issues.filter(function(i) {
        return i.rule === 'missingLabels';
      });
      expect(labelIssues.length).toBe(0);
    });

    FunkyTests.it('should not flag input with associated label', function() {
      var inputId = uniqueId('input');
      fixture.el.innerHTML = '<label for="' + inputId + '">Name</label><input type="text" id="' + inputId + '">';
      var results = A11yValidator.validate(fixture.el);
      var labelIssues = results.issues.filter(function(i) {
        return i.rule === 'missingLabels';
      });
      expect(labelIssues.length).toBe(0);
    });

    FunkyTests.it('should not flag input wrapped in label', function() {
      fixture.el.innerHTML = '<label>Name <input type="text"></label>';
      var results = A11yValidator.validate(fixture.el);
      var labelIssues = results.issues.filter(function(i) {
        return i.rule === 'missingLabels';
      });
      expect(labelIssues.length).toBe(0);
    });

    FunkyTests.it('should skip hidden inputs', function() {
      fixture.el.innerHTML = '<input type="hidden" name="csrf">';
      var results = A11yValidator.validate(fixture.el);
      var labelIssues = results.issues.filter(function(i) {
        return i.rule === 'missingLabels';
      });
      expect(labelIssues.length).toBe(0);
    });

    FunkyTests.it('should skip submit buttons', function() {
      fixture.el.innerHTML = '<input type="submit" value="Send">';
      var results = A11yValidator.validate(fixture.el);
      var labelIssues = results.issues.filter(function(i) {
        return i.rule === 'missingLabels';
      });
      expect(labelIssues.length).toBe(0);
    });
  });

  // =========================================================================
  // Empty Buttons Check
  // =========================================================================

  FunkyTests.describe('Empty Buttons Check', function() {
    var fixture;

    FunkyTests.beforeEach(function() {
      A11yValidator.init();
      fixture = FunkyTests.fixture('<div id="' + uniqueId('a11y-buttons') + '"></div>');
    });

    FunkyTests.afterEach(function() {
      fixture.cleanup();
    });

    FunkyTests.it('should detect empty button', function() {
      fixture.el.innerHTML = '<button></button>';
      var results = A11yValidator.validate(fixture.el);
      var buttonIssues = results.issues.filter(function(i) {
        return i.rule === 'emptyButtons';
      });
      expect(buttonIssues.length).toBeGreaterThan(0);
    });

    FunkyTests.it('should not flag button with text', function() {
      fixture.el.innerHTML = '<button>Click me</button>';
      var results = A11yValidator.validate(fixture.el);
      var buttonIssues = results.issues.filter(function(i) {
        return i.rule === 'emptyButtons';
      });
      expect(buttonIssues.length).toBe(0);
    });

    FunkyTests.it('should not flag button with aria-label', function() {
      fixture.el.innerHTML = '<button aria-label="Close"><i class="icon-x"></i></button>';
      var results = A11yValidator.validate(fixture.el);
      var buttonIssues = results.issues.filter(function(i) {
        return i.rule === 'emptyButtons';
      });
      expect(buttonIssues.length).toBe(0);
    });

    FunkyTests.it('should not flag button with title', function() {
      fixture.el.innerHTML = '<button title="Settings"><i class="icon-gear"></i></button>';
      var results = A11yValidator.validate(fixture.el);
      var buttonIssues = results.issues.filter(function(i) {
        return i.rule === 'emptyButtons';
      });
      expect(buttonIssues.length).toBe(0);
    });

    FunkyTests.it('should detect empty role=button', function() {
      fixture.el.innerHTML = '<span role="button"></span>';
      var results = A11yValidator.validate(fixture.el);
      var buttonIssues = results.issues.filter(function(i) {
        return i.rule === 'emptyButtons';
      });
      expect(buttonIssues.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // Duplicate IDs Check
  // =========================================================================

  FunkyTests.describe('Duplicate IDs Check', function() {
    var fixture;

    FunkyTests.beforeEach(function() {
      A11yValidator.init();
      fixture = FunkyTests.fixture('<div id="' + uniqueId('a11y-ids') + '"></div>');
    });

    FunkyTests.afterEach(function() {
      fixture.cleanup();
    });

    FunkyTests.it('should detect duplicate IDs', function() {
      fixture.el.innerHTML = '<div id="duplicate"></div><div id="duplicate"></div>';
      var results = A11yValidator.validate(fixture.el);
      var idIssues = results.issues.filter(function(i) {
        return i.rule === 'duplicateIds';
      });
      expect(idIssues.length).toBeGreaterThan(0);
    });

    FunkyTests.it('should not flag unique IDs', function() {
      fixture.el.innerHTML = '<div id="unique1"></div><div id="unique2"></div>';
      var results = A11yValidator.validate(fixture.el);
      var idIssues = results.issues.filter(function(i) {
        return i.rule === 'duplicateIds';
      });
      expect(idIssues.length).toBe(0);
    });
  });

  // =========================================================================
  // Invalid ARIA Check
  // =========================================================================

  FunkyTests.describe('Invalid ARIA Check', function() {
    var fixture;

    FunkyTests.beforeEach(function() {
      A11yValidator.init();
      fixture = FunkyTests.fixture('<div id="' + uniqueId('a11y-aria') + '"></div>');
    });

    FunkyTests.afterEach(function() {
      fixture.cleanup();
    });

    FunkyTests.it('should detect invalid ARIA role', function() {
      fixture.el.innerHTML = '<div role="fakeRole"></div>';
      var results = A11yValidator.validate(fixture.el);
      var ariaIssues = results.issues.filter(function(i) {
        return i.rule === 'invalidAria';
      });
      expect(ariaIssues.length).toBeGreaterThan(0);
    });

    FunkyTests.it('should not flag valid ARIA role', function() {
      fixture.el.innerHTML = '<div role="button">Click</div>';
      var results = A11yValidator.validate(fixture.el);
      var invalidRoleIssues = results.issues.filter(function(i) {
        return i.rule === 'invalidAria' && i.message.indexOf('Invalid ARIA role') >= 0;
      });
      expect(invalidRoleIssues.length).toBe(0);
    });

    FunkyTests.it('should detect missing required ARIA attributes', function() {
      fixture.el.innerHTML = '<div role="checkbox"></div>';
      var results = A11yValidator.validate(fixture.el);
      var ariaIssues = results.issues.filter(function(i) {
        return i.rule === 'invalidAria' && i.message.indexOf('requires') >= 0;
      });
      expect(ariaIssues.length).toBeGreaterThan(0);
    });

    FunkyTests.it('should not flag checkbox with aria-checked', function() {
      fixture.el.innerHTML = '<div role="checkbox" aria-checked="false"></div>';
      var results = A11yValidator.validate(fixture.el);
      var ariaIssues = results.issues.filter(function(i) {
        return i.rule === 'invalidAria' && i.message.indexOf('aria-checked') >= 0;
      });
      expect(ariaIssues.length).toBe(0);
    });

    FunkyTests.it('should detect broken aria-labelledby reference', function() {
      fixture.el.innerHTML = '<button aria-labelledby="nonexistent">Click</button>';
      var results = A11yValidator.validate(fixture.el);
      var ariaIssues = results.issues.filter(function(i) {
        return i.rule === 'invalidAria' && i.message.indexOf('aria-labelledby') >= 0;
      });
      expect(ariaIssues.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // Broken Focus Order Check
  // =========================================================================

  FunkyTests.describe('Broken Focus Order Check', function() {
    var fixture;

    FunkyTests.beforeEach(function() {
      A11yValidator.init();
      fixture = FunkyTests.fixture('<div id="' + uniqueId('a11y-focus') + '"></div>');
    });

    FunkyTests.afterEach(function() {
      fixture.cleanup();
    });

    FunkyTests.it('should detect positive tabindex', function() {
      fixture.el.innerHTML = '<button tabindex="5">Click</button>';
      var results = A11yValidator.validate(fixture.el);
      var focusIssues = results.issues.filter(function(i) {
        return i.rule === 'brokenFocusOrder';
      });
      expect(focusIssues.length).toBeGreaterThan(0);
    });

    FunkyTests.it('should not flag tabindex 0', function() {
      fixture.el.innerHTML = '<div tabindex="0">Focusable</div>';
      var results = A11yValidator.validate(fixture.el);
      var focusIssues = results.issues.filter(function(i) {
        return i.rule === 'brokenFocusOrder' && i.message.indexOf('Positive tabindex') >= 0;
      });
      expect(focusIssues.length).toBe(0);
    });

    FunkyTests.it('should not flag tabindex -1', function() {
      fixture.el.innerHTML = '<div tabindex="-1">Not in tab order</div>';
      var results = A11yValidator.validate(fixture.el);
      var focusIssues = results.issues.filter(function(i) {
        return i.rule === 'brokenFocusOrder' && i.message.indexOf('Positive tabindex') >= 0;
      });
      expect(focusIssues.length).toBe(0);
    });

    FunkyTests.it('should detect focusable elements inside aria-hidden', function() {
      fixture.el.innerHTML = '<div aria-hidden="true"><button>Hidden button</button></div>';
      var results = A11yValidator.validate(fixture.el);
      var focusIssues = results.issues.filter(function(i) {
        return i.rule === 'brokenFocusOrder' && i.message.indexOf('aria-hidden') >= 0;
      });
      expect(focusIssues.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // Get Results
  // =========================================================================

  FunkyTests.describe('Get Results', function() {
    FunkyTests.beforeEach(function() {
      A11yValidator.init();
    });

    FunkyTests.it('should return results summary', function() {
      var results = A11yValidator.getResults();
      expect(results).toBeDefined();
      expect(typeof results.errors).toBe('number');
      expect(typeof results.warnings).toBe('number');
      expect(typeof results.info).toBe('number');
      expect(typeof results.total).toBe('number');
    });

    FunkyTests.it('should calculate total correctly', function() {
      var results = A11yValidator.getResults();
      expect(results.total).toBe(results.errors + results.warnings + results.info);
    });
  });

  // =========================================================================
  // Event Dispatch
  // =========================================================================

  FunkyTests.describe('Event Dispatch', function() {
    var fixture;

    FunkyTests.beforeEach(function() {
      A11yValidator.init();
      fixture = FunkyTests.fixture('<div id="' + uniqueId('a11y-event') + '"></div>');
    });

    FunkyTests.afterEach(function() {
      fixture.cleanup();
    });

    FunkyTests.it('should dispatch funky.a11y.validation event', function(done) {
      var eventReceived = false;

      document.addEventListener('funky.a11y.validation', function handler(e) {
        eventReceived = true;
        document.removeEventListener('funky.a11y.validation', handler);
        expect(e.detail).toBeDefined();
        expect(typeof e.detail.total).toBe('number');
        done();
      });

      A11yValidator.validate(fixture.el);
    });
  });

  // =========================================================================
  // Auto Activation
  // =========================================================================

  FunkyTests.describe('Auto Activation', function() {
    FunkyTests.it('should have checkAutoActivation method', function() {
      expect(typeof A11yValidator.checkAutoActivation).toBe('function');
    });

    FunkyTests.it('should not throw when checking auto activation', function() {
      expect(function() {
        A11yValidator.checkAutoActivation();
      }).not.toThrow();
    });
  });
});

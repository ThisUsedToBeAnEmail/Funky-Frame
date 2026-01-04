/**
 * Funky.Mask Test Suite
 *
 * Tests for input masking and redact mode functionality.
 *
 * @module Tests/Mask
 */
(function() {
  'use strict';

  var T = Funky.Test;
  var Mask = Funky.Mask;

  // =========================================================================
  // Test Utilities
  // =========================================================================

  function createMaskedInput(pattern, options) {
    var input = document.createElement('input');
    input.type = 'text';
    input.setAttribute('data-mask', pattern);
    document.body.appendChild(input);

    var opts = Funky.Util.extend({ pattern: pattern }, options || {});
    var mask = new Mask(input, opts);

    return {
      input: input,
      mask: mask,
      destroy: function() {
        mask.destroy();
        input.remove();
      }
    };
  }

  function createRedactElement(value, options) {
    var span = document.createElement('span');
    span.setAttribute('data-redact', '');
    span.setAttribute('data-redact-value', value);
    document.body.appendChild(span);

    var redact = Mask.redact(span, options);

    return {
      element: span,
      redact: redact,
      destroy: function() {
        redact.destroy();
        span.remove();
      }
    };
  }

  // =========================================================================
  // Core Mask Tests
  // =========================================================================

  T.describe('Funky.Mask - Core', function() {

    T.it('should initialize on input element', function() {
      var test = createMaskedInput('(999) 999-9999');

      T.assert(test.mask !== null, 'Mask instance created');
      T.assert(test.input._funkyMask !== undefined, 'Reference stored on element');

      test.destroy();
    });

    T.it('should format phone number correctly', function() {
      var test = createMaskedInput('(999) 999-9999');

      test.mask.setValue('5551234567');

      T.assertEqual(test.mask.getFormatted(), '(555) 123-4567', 'Formatted value');
      T.assertEqual(test.mask.getRaw(), '5551234567', 'Raw value');

      test.destroy();
    });

    T.it('should format credit card correctly', function() {
      var test = createMaskedInput('9999 9999 9999 9999');

      test.mask.setValue('4111111111111111');

      T.assertEqual(test.mask.getFormatted(), '4111 1111 1111 1111', 'Formatted value');
      T.assertEqual(test.mask.getRaw(), '4111111111111111', 'Raw value');

      test.destroy();
    });

    T.it('should format SSN correctly', function() {
      var test = createMaskedInput('999-99-9999');

      test.mask.setValue('123456789');

      T.assertEqual(test.mask.getFormatted(), '123-45-6789', 'Formatted value');

      test.destroy();
    });

    T.it('should format date correctly', function() {
      var test = createMaskedInput('99/99/9999');

      test.mask.setValue('12252025');

      T.assertEqual(test.mask.getFormatted(), '12/25/2025', 'Formatted value');

      test.destroy();
    });

    T.it('should handle custom pattern with letters', function() {
      var test = createMaskedInput('AAA-999-AA', { transform: 'uppercase' });

      test.mask.setValue('abc123xy');

      T.assertEqual(test.mask.getFormatted(), 'ABC-123-XY', 'Formatted with uppercase');

      test.destroy();
    });

    T.it('should report completion status', function() {
      var test = createMaskedInput('(999) 999-9999');

      test.mask.setValue('555');
      T.assertEqual(test.mask.isComplete(), false, 'Incomplete');

      test.mask.setValue('5551234567');
      T.assertEqual(test.mask.isComplete(), true, 'Complete');

      test.destroy();
    });

    T.it('should clear value', function() {
      var test = createMaskedInput('(999) 999-9999');

      test.mask.setValue('5551234567');
      test.mask.clear();

      T.assertEqual(test.mask.getRaw(), '', 'Raw is empty');
      T.assertEqual(test.mask.isComplete(), false, 'Not complete');

      test.destroy();
    });

    T.it('should handle alphanumeric pattern (*)', function() {
      var test = createMaskedInput('***-***');

      test.mask.setValue('A1B2C3');

      T.assertEqual(test.mask.getFormatted(), 'A1B-2C3', 'Alphanumeric formatted');

      test.destroy();
    });

    T.it('should reject invalid characters', function() {
      var test = createMaskedInput('999-999');

      test.mask.setValue('12AB34');

      // Only digits should be accepted
      T.assertEqual(test.mask.getRaw(), '1234', 'Invalid chars rejected');

      test.destroy();
    });
  });

  // =========================================================================
  // Pattern Parsing Tests
  // =========================================================================

  T.describe('Funky.Mask - Pattern Parsing', function() {

    T.it('should parse pattern with static literals', function() {
      var test = createMaskedInput('+1 (999) 999-9999');

      test.mask.setValue('5551234567');

      T.assertEqual(test.mask.getFormatted(), '+1 (555) 123-4567', 'Pattern with prefix');

      test.destroy();
    });

    T.it('should handle escaped characters', function() {
      var test = createMaskedInput('\\A999-999');

      test.mask.setValue('123456');

      T.assertEqual(test.mask.getFormatted(), 'A123-456', 'Escaped A is literal');

      test.destroy();
    });

    T.it('should handle any character (X)', function() {
      var test = createMaskedInput('XXX-XXX');

      test.mask.setValue('A1!B2@');

      T.assertEqual(test.mask.getRaw(), 'A1!B2@', 'Any characters accepted');

      test.destroy();
    });
  });

  // =========================================================================
  // Built-in Patterns Tests
  // =========================================================================

  T.describe('Funky.Mask - Built-in Patterns', function() {

    T.it('should format phone preset', function() {
      var test = createMaskedInput('phone');

      test.mask.setValue('5551234567');

      T.assertEqual(test.mask.getFormatted(), '(555) 123-4567', 'Phone formatted');

      test.destroy();
    });

    T.it('should format credit-card preset', function() {
      var test = createMaskedInput('credit-card');

      test.mask.setValue('4111111111111111');

      T.assertEqual(test.mask.getFormatted(), '4111 1111 1111 1111', 'Credit card formatted');

      test.destroy();
    });

    T.it('should format ssn preset', function() {
      var test = createMaskedInput('ssn');

      test.mask.setValue('123456789');

      T.assertEqual(test.mask.getFormatted(), '123-45-6789', 'SSN formatted');

      test.destroy();
    });

    T.it('should format date preset (US)', function() {
      var test = createMaskedInput('date');

      test.mask.setValue('12252025');

      T.assertEqual(test.mask.getFormatted(), '12/25/2025', 'US date formatted');

      test.destroy();
    });

    T.it('should format date-iso preset', function() {
      var test = createMaskedInput('date-iso');

      test.mask.setValue('20251225');

      T.assertEqual(test.mask.getFormatted(), '2025-12-25', 'ISO date formatted');

      test.destroy();
    });

    T.it('should format time preset (24hr)', function() {
      var test = createMaskedInput('time');

      test.mask.setValue('1430');

      T.assertEqual(test.mask.getFormatted(), '14:30', 'Time 24hr formatted');

      test.destroy();
    });

    T.it('should format zip preset', function() {
      var test = createMaskedInput('zip');

      test.mask.setValue('12345');

      T.assertEqual(test.mask.getFormatted(), '12345', 'ZIP formatted');

      test.destroy();
    });

    T.it('should format zip-plus4 preset', function() {
      var test = createMaskedInput('zip-plus4');

      test.mask.setValue('123456789');

      T.assertEqual(test.mask.getFormatted(), '12345-6789', 'ZIP+4 formatted');

      test.destroy();
    });

    T.it('should format expiry preset', function() {
      var test = createMaskedInput('expiry');

      test.mask.setValue('1225');

      T.assertEqual(test.mask.getFormatted(), '12/25', 'Expiry formatted');

      test.destroy();
    });
  });

  // =========================================================================
  // Validation Tests
  // =========================================================================

  T.describe('Funky.Mask - Validation', function() {

    T.it('should validate credit card with Luhn algorithm', function() {
      var test = createMaskedInput('credit-card');

      // Valid Visa test number
      test.mask.setValue('4111111111111111');
      T.assertEqual(test.mask.isValid(), true, 'Valid card passes');

      // Invalid card (changed last digit)
      test.mask.setValue('4111111111111112');
      T.assertEqual(test.mask.isValid(), false, 'Invalid card fails');

      test.destroy();
    });

    T.it('should validate US date correctly', function() {
      var test = createMaskedInput('date');

      // Valid date
      test.mask.setValue('12252025');
      T.assertEqual(test.mask.isValid(), true, 'Valid date passes');

      // Invalid date (Feb 30)
      test.mask.setValue('02302025');
      T.assertEqual(test.mask.isValid(), false, 'Feb 30 fails');

      test.destroy();
    });

    T.it('should validate leap year dates', function() {
      var test = createMaskedInput('date');

      // Leap year (Feb 29, 2024)
      test.mask.setValue('02292024');
      T.assertEqual(test.mask.isValid(), true, 'Leap year Feb 29 passes');

      // Non-leap year (Feb 29, 2023)
      test.mask.setValue('02292023');
      T.assertEqual(test.mask.isValid(), false, 'Non-leap year Feb 29 fails');

      test.destroy();
    });

    T.it('should validate ISO date correctly', function() {
      var test = createMaskedInput('date-iso');

      // Valid date
      test.mask.setValue('20251225');
      T.assertEqual(test.mask.isValid(), true, 'Valid ISO date passes');

      // Invalid month
      test.mask.setValue('20251325');
      T.assertEqual(test.mask.isValid(), false, 'Invalid month fails');

      test.destroy();
    });

    T.it('should validate 24-hour time', function() {
      var test = createMaskedInput('time');

      // Valid time
      test.mask.setValue('1430');
      T.assertEqual(test.mask.isValid(), true, 'Valid time passes');

      // Invalid hours
      test.mask.setValue('2500');
      T.assertEqual(test.mask.isValid(), false, 'Invalid hours fails');

      // Invalid minutes
      test.mask.setValue('1260');
      T.assertEqual(test.mask.isValid(), false, 'Invalid minutes fails');

      test.destroy();
    });

    T.it('should validate expiry (not expired)', function() {
      var test = createMaskedInput('expiry');

      // Future date (2030)
      test.mask.setValue('1230');
      T.assertEqual(test.mask.isValid(), true, 'Future expiry passes');

      // Past date (2020)
      test.mask.setValue('0120');
      T.assertEqual(test.mask.isValid(), false, 'Past expiry fails');

      test.destroy();
    });

    T.it('should return validation result with error message', function() {
      var test = createMaskedInput('credit-card');

      test.mask.setValue('4111111111111112');
      var result = test.mask.validate();

      T.assertEqual(result.valid, false, 'Result.valid is false');
      T.assert(result.error !== null, 'Result has error message');

      test.destroy();
    });
  });

  // =========================================================================
  // Card Type Detection Tests
  // =========================================================================

  T.describe('Funky.Mask - Card Type Detection', function() {

    T.it('should detect Visa', function() {
      T.assertEqual(Mask.detectCardType('4111111111111111'), 'visa', 'Visa detected');
    });

    T.it('should detect Mastercard', function() {
      T.assertEqual(Mask.detectCardType('5500000000000004'), 'mastercard', 'Mastercard detected');
    });

    T.it('should detect Amex', function() {
      T.assertEqual(Mask.detectCardType('371449635398431'), 'amex', 'Amex detected');
    });

    T.it('should detect Discover', function() {
      T.assertEqual(Mask.detectCardType('6011111111111117'), 'discover', 'Discover detected');
    });

    T.it('should return null for unknown', function() {
      T.assertEqual(Mask.detectCardType('9999999999999999'), null, 'Unknown returns null');
    });
  });

  // =========================================================================
  // Custom Pattern/Validator Registration Tests
  // =========================================================================

  T.describe('Funky.Mask - Custom Registration', function() {

    T.it('should register custom pattern', function() {
      Mask.registerPattern('invoice', {
        pattern: 'AAA-9999',
        transform: 'uppercase'
      });

      var test = createMaskedInput('invoice');

      test.mask.setValue('abc1234');

      T.assertEqual(test.mask.getFormatted(), 'ABC-1234', 'Custom pattern works');

      test.destroy();
    });

    T.it('should register custom validator', function() {
      Mask.registerValidator('even', function(value) {
        var num = parseInt(value, 10);
        return {
          valid: num % 2 === 0,
          error: num % 2 === 0 ? null : 'Must be even'
        };
      });

      var test = createMaskedInput('999', { validate: 'even' });

      test.mask.setValue('124');
      T.assertEqual(test.mask.isValid(), true, 'Even number passes');

      test.mask.setValue('123');
      T.assertEqual(test.mask.isValid(), false, 'Odd number fails');

      test.destroy();
    });
  });

  // =========================================================================
  // Cursor Management Tests
  // =========================================================================

  T.describe('Funky.Mask - Cursor Management', function() {

    T.it('should position cursor after typed character', function() {
      var test = createMaskedInput('(999) 999-9999');

      test.mask.setValue('555');
      
      // After setting 555, cursor should be after the formatted part (555)
      // Formatted: (555) ___-____
      var cursorPos = test.input.selectionStart;
      T.assert(cursorPos >= 4, 'Cursor positioned after input');

      test.destroy();
    });

    T.it('should skip literal characters when moving cursor', function() {
      var test = createMaskedInput('(999) 999-9999');

      test.mask.setValue('5551234567');

      // Test that the formatted value has correct literals
      T.assertEqual(test.mask.getFormatted(), '(555) 123-4567', 'Literals in place');

      test.destroy();
    });
  });

  // =========================================================================
  // Redact Mode Tests
  // =========================================================================

  T.describe('Funky.Mask - Redact Mode', function() {

    T.it('should display redacted value with showLast', function() {
      var test = createRedactElement('123456789', { showLast: 4 });

      T.assert(test.element.textContent.indexOf('6789') !== -1, 'Shows last 4');
      T.assert(test.element.textContent.indexOf('•') !== -1, 'Has redaction chars');

      test.destroy();
    });

    T.it('should display redacted value with showFirst', function() {
      var test = createRedactElement('123456789', { showFirst: 3 });

      T.assert(test.element.textContent.indexOf('123') !== -1, 'Shows first 3');

      test.destroy();
    });

    T.it('should reveal on click', function() {
      var test = createRedactElement('secret', { reveal: 'click' });

      test.element.click();

      T.assertEqual(test.redact._isRevealed, true, 'Is revealed');
      T.assertEqual(test.element.textContent, 'secret', 'Shows full value');

      test.destroy();
    });

    T.it('should hide after reveal', function() {
      var test = createRedactElement('secret', { reveal: 'click' });

      test.redact.reveal();
      test.redact.hide();

      T.assertEqual(test.redact._isRevealed, false, 'Is hidden');
      T.assertNotEqual(test.element.textContent, 'secret', 'Value hidden');

      test.destroy();
    });

    T.it('should toggle on double click', function() {
      var test = createRedactElement('secret', { reveal: 'click' });

      test.element.click(); // reveal
      T.assertEqual(test.redact._isRevealed, true, 'First click reveals');

      test.element.click(); // hide
      T.assertEqual(test.redact._isRevealed, false, 'Second click hides');

      test.destroy();
    });

    T.it('should format with pattern', function() {
      var test = createRedactElement('4111111111111234', {
        pattern: '9999 9999 9999 9999',
        showLast: 4
      });

      T.assert(test.element.textContent.indexOf('1234') !== -1, 'Shows last 4');
      T.assert(test.element.textContent.indexOf(' ') !== -1, 'Has pattern spacing');

      test.destroy();
    });

    T.it('should use custom redaction character', function() {
      var test = createRedactElement('123456789', { char: '*', showLast: 4 });

      T.assert(test.element.textContent.indexOf('*') !== -1, 'Uses custom char');

      test.destroy();
    });

    T.it('should auto-hide after timeout', function(done) {
      var test = createRedactElement('secret', {
        reveal: 'click',
        autoHide: 100
      });

      test.redact.reveal();

      setTimeout(function() {
        T.assertEqual(test.redact._isRevealed, false, 'Auto-hidden');
        test.destroy();
        done();
      }, 150);
    });
  });

  // =========================================================================
  // Accessibility Tests
  // =========================================================================

  T.describe('Funky.Mask - Accessibility', function() {

    T.it('should add aria-describedby for format hint', function() {
      var test = createMaskedInput('(999) 999-9999', { ariaLabel: 'Phone number' });

      // Check for aria attributes
      var hasAriaDescribedBy = test.input.hasAttribute('aria-describedby');
      
      // The hint element should exist
      T.assert(hasAriaDescribedBy || test.input.nextElementSibling, 'Has accessibility hints');

      test.destroy();
    });

    T.it('should make redact focusable', function() {
      var test = createRedactElement('secret', { reveal: 'click' });

      T.assertEqual(test.element.getAttribute('tabindex'), '0', 'Has tabindex');
      T.assertEqual(test.element.getAttribute('role'), 'button', 'Has button role');

      test.destroy();
    });

    T.it('should respond to Enter key on redact', function() {
      var test = createRedactElement('secret', { reveal: 'click' });

      var event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      test.element.dispatchEvent(event);

      T.assertEqual(test.redact._isRevealed, true, 'Enter reveals');

      test.destroy();
    });

    T.it('should respond to Escape key on redact', function() {
      var test = createRedactElement('secret', { reveal: 'click' });

      test.redact.reveal();

      var event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      test.element.dispatchEvent(event);

      T.assertEqual(test.redact._isRevealed, false, 'Escape hides');

      test.destroy();
    });

    T.it('should respond to Space key on redact', function() {
      var test = createRedactElement('secret', { reveal: 'click' });

      var event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
      test.element.dispatchEvent(event);

      T.assertEqual(test.redact._isRevealed, true, 'Space reveals');

      test.destroy();
    });
  });

  // =========================================================================
  // Events Tests
  // =========================================================================

  T.describe('Funky.Mask - Events', function() {

    T.it('should emit funky:mask:input on change', function(done) {
      var test = createMaskedInput('(999) 999-9999');

      test.input.addEventListener('funky:mask:input', function(e) {
        T.assert(e.detail.raw !== undefined, 'Has raw value');
        T.assert(e.detail.formatted !== undefined, 'Has formatted value');
        test.destroy();
        done();
      });

      test.mask.setValue('555');
    });

    T.it('should emit funky:mask:complete when filled', function(done) {
      var test = createMaskedInput('(999) 999-9999');

      test.input.addEventListener('funky:mask:complete', function(e) {
        T.assertEqual(e.detail.complete, true, 'Is complete');
        test.destroy();
        done();
      });

      test.mask.setValue('5551234567');
    });

    T.it('should emit funky:mask:reveal on redact reveal', function(done) {
      var test = createRedactElement('secret', { reveal: 'click' });

      test.element.addEventListener('funky:mask:reveal', function(e) {
        T.assertEqual(e.detail.value, 'secret', 'Has value');
        test.destroy();
        done();
      });

      test.redact.reveal();
    });

    T.it('should emit funky:mask:hide on redact hide', function(done) {
      var test = createRedactElement('secret', { reveal: 'click' });

      test.redact.reveal();

      test.element.addEventListener('funky:mask:hide', function() {
        T.assert(true, 'Hide event emitted');
        test.destroy();
        done();
      });

      test.redact.hide();
    });
  });

  // =========================================================================
  // Transform Tests
  // =========================================================================

  T.describe('Funky.Mask - Transforms', function() {

    T.it('should transform to uppercase', function() {
      var test = createMaskedInput('AAA-AAA', { transform: 'uppercase' });

      test.mask.setValue('abcdef');

      T.assertEqual(test.mask.getRaw(), 'ABCDEF', 'Uppercase transform');

      test.destroy();
    });

    T.it('should transform to lowercase', function() {
      var test = createMaskedInput('AAA-AAA', { transform: 'lowercase' });

      test.mask.setValue('ABCDEF');

      T.assertEqual(test.mask.getRaw(), 'abcdef', 'Lowercase transform');

      test.destroy();
    });
  });

  // =========================================================================
  // Static Methods Tests
  // =========================================================================

  T.describe('Funky.Mask - Static Methods', function() {

    T.it('should format value with Mask.format()', function() {
      var formatted = Mask.format('5551234567', '(999) 999-9999');

      T.assertEqual(formatted, '(555) 123-4567', 'Static format');
    });

    T.it('should redact value with Mask.redactValue()', function() {
      var redacted = Mask.redactValue('123456789', { showLast: 4 });

      T.assert(redacted.indexOf('6789') !== -1, 'Shows last 4');
      T.assert(redacted.indexOf('•') !== -1, 'Has redaction');
    });

    T.it('should get mask instance with Mask.get()', function() {
      var test = createMaskedInput('999-999');

      var instance = Mask.get(test.input);

      T.assertEqual(instance, test.mask, 'Gets correct instance');

      test.destroy();
    });
  });

  // =========================================================================
  // Destroy Tests
  // =========================================================================

  T.describe('Funky.Mask - Cleanup', function() {

    T.it('should clean up on destroy', function() {
      var test = createMaskedInput('999-999');
      var input = test.input;

      test.mask.destroy();

      T.assertEqual(input._funkyMask, undefined, 'Reference removed');
      
      input.remove();
    });

    T.it('should clean up redact on destroy', function() {
      var test = createRedactElement('secret', { reveal: 'click' });
      var element = test.element;

      test.redact.destroy();

      T.assertEqual(element._funkyRedact, undefined, 'Reference removed');
      
      element.remove();
    });
  });

})();

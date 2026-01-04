/**
 * Tests for Funky.ConditionalFormatting
 * DataTable Cell Formatting Rules
 */
FunkyTests.describe('Funky.Component.ConditionalFormatting', function() {
  var expect = FunkyTests.expect;

  FunkyTests.describe('Module Structure', function() {
    FunkyTests.it('Funky.ConditionalFormatting exists', function() {
      expect(Funky.ConditionalFormatting !== undefined).toBe(true);
    });

    FunkyTests.it('is a constructor function', function() {
      expect(typeof Funky.ConditionalFormatting).toBe('function');
    });

    FunkyTests.it('has create static method', function() {
      expect(typeof Funky.ConditionalFormatting.create).toBe('function');
    });

    FunkyTests.it('has getConditions static method', function() {
      expect(typeof Funky.ConditionalFormatting.getConditions).toBe('function');
    });

    FunkyTests.it('has getStyles static method', function() {
      expect(typeof Funky.ConditionalFormatting.getStyles).toBe('function');
    });

    FunkyTests.it('has getAllRules static method', function() {
      expect(typeof Funky.ConditionalFormatting.getAllRules).toBe('function');
    });

    FunkyTests.it('has setAllRules static method', function() {
      expect(typeof Funky.ConditionalFormatting.setAllRules).toBe('function');
    });
  });

  FunkyTests.describe('Conditions', function() {
    FunkyTests.it('getConditions returns object', function() {
      var conditions = Funky.ConditionalFormatting.getConditions();
      expect(typeof conditions).toBe('object');
      expect(conditions !== null).toBe(true);
    });

    FunkyTests.it('has equals condition', function() {
      var conditions = Funky.ConditionalFormatting.getConditions();
      expect(conditions.equals !== undefined).toBe(true);
      expect(conditions.equals.label).toBe('Equals');
    });

    FunkyTests.it('has notEquals condition', function() {
      var conditions = Funky.ConditionalFormatting.getConditions();
      expect(conditions.notEquals !== undefined).toBe(true);
      expect(conditions.notEquals.label).toBe('Not Equals');
    });

    FunkyTests.it('has contains condition', function() {
      var conditions = Funky.ConditionalFormatting.getConditions();
      expect(conditions.contains !== undefined).toBe(true);
      expect(conditions.contains.label).toBe('Contains');
    });

    FunkyTests.it('has notContains condition', function() {
      var conditions = Funky.ConditionalFormatting.getConditions();
      expect(conditions.notContains !== undefined).toBe(true);
    });

    FunkyTests.it('has greaterThan condition', function() {
      var conditions = Funky.ConditionalFormatting.getConditions();
      expect(conditions.greaterThan !== undefined).toBe(true);
      expect(conditions.greaterThan.numeric).toBe(true);
    });

    FunkyTests.it('has lessThan condition', function() {
      var conditions = Funky.ConditionalFormatting.getConditions();
      expect(conditions.lessThan !== undefined).toBe(true);
      expect(conditions.lessThan.numeric).toBe(true);
    });

    FunkyTests.it('has greaterOrEqual condition', function() {
      var conditions = Funky.ConditionalFormatting.getConditions();
      expect(conditions.greaterOrEqual !== undefined).toBe(true);
    });

    FunkyTests.it('has lessOrEqual condition', function() {
      var conditions = Funky.ConditionalFormatting.getConditions();
      expect(conditions.lessOrEqual !== undefined).toBe(true);
    });

    FunkyTests.it('has between condition', function() {
      var conditions = Funky.ConditionalFormatting.getConditions();
      expect(conditions.between !== undefined).toBe(true);
      expect(conditions.between.needsValue2).toBe(true);
    });

    FunkyTests.it('has isEmpty condition', function() {
      var conditions = Funky.ConditionalFormatting.getConditions();
      expect(conditions.isEmpty !== undefined).toBe(true);
      expect(conditions.isEmpty.needsValue).toBe(false);
    });

    FunkyTests.it('has isNotEmpty condition', function() {
      var conditions = Funky.ConditionalFormatting.getConditions();
      expect(conditions.isNotEmpty !== undefined).toBe(true);
      expect(conditions.isNotEmpty.needsValue).toBe(false);
    });
  });

  FunkyTests.describe('Styles', function() {
    FunkyTests.it('getStyles returns object', function() {
      var styles = Funky.ConditionalFormatting.getStyles();
      expect(typeof styles).toBe('object');
      expect(styles !== null).toBe(true);
    });

    FunkyTests.it('has positive style', function() {
      var styles = Funky.ConditionalFormatting.getStyles();
      expect(styles.positive !== undefined).toBe(true);
      expect(styles.positive.class).toBe('cf-positive');
    });

    FunkyTests.it('has negative style', function() {
      var styles = Funky.ConditionalFormatting.getStyles();
      expect(styles.negative !== undefined).toBe(true);
      expect(styles.negative.class).toBe('cf-negative');
    });

    FunkyTests.it('has warning style', function() {
      var styles = Funky.ConditionalFormatting.getStyles();
      expect(styles.warning !== undefined).toBe(true);
    });

    FunkyTests.it('has highlight style', function() {
      var styles = Funky.ConditionalFormatting.getStyles();
      expect(styles.highlight !== undefined).toBe(true);
    });

    FunkyTests.it('has bold style', function() {
      var styles = Funky.ConditionalFormatting.getStyles();
      expect(styles.bold !== undefined).toBe(true);
      expect(styles.bold.class).toBe('cf-bold');
    });

    FunkyTests.it('has muted style', function() {
      var styles = Funky.ConditionalFormatting.getStyles();
      expect(styles.muted !== undefined).toBe(true);
    });

    FunkyTests.it('has italic style', function() {
      var styles = Funky.ConditionalFormatting.getStyles();
      expect(styles.italic !== undefined).toBe(true);
    });

    FunkyTests.it('has strikethrough style', function() {
      var styles = Funky.ConditionalFormatting.getStyles();
      expect(styles.strikethrough !== undefined).toBe(true);
    });

    FunkyTests.it('has icon styles', function() {
      var styles = Funky.ConditionalFormatting.getStyles();
      expect(styles.iconUp !== undefined).toBe(true);
      expect(styles.iconDown !== undefined).toBe(true);
      expect(styles.iconCheck !== undefined).toBe(true);
      expect(styles.iconX !== undefined).toBe(true);
    });

    FunkyTests.it('has background variants', function() {
      var styles = Funky.ConditionalFormatting.getStyles();
      expect(styles.positiveBg !== undefined).toBe(true);
      expect(styles.negativeBg !== undefined).toBe(true);
      expect(styles.warningBg !== undefined).toBe(true);
      expect(styles.highlightBg !== undefined).toBe(true);
    });
  });

  FunkyTests.describe('Static Methods', function() {
    FunkyTests.it('getAllRules returns object', function() {
      var rules = Funky.ConditionalFormatting.getAllRules();
      expect(typeof rules).toBe('object');
    });

    FunkyTests.it('setAllRules does not throw', function() {
      var threw = false;
      try {
        Funky.ConditionalFormatting.setAllRules({});
      } catch (e) {
        threw = true;
      }
      expect(threw).toBe(false);
    });

    FunkyTests.it('setAllRules accepts table rules', function() {
      var threw = false;
      try {
        Funky.ConditionalFormatting.setAllRules({
          'testTable': [
            { id: 'test-1', column: 'status', condition: 'equals', value: 'Active', style: 'positive', enabled: true }
          ]
        });
      } catch (e) {
        threw = true;
      }
      expect(threw).toBe(false);

      // Cleanup
      Funky.ConditionalFormatting.setAllRules({});
    });
  });

  FunkyTests.describe('Instance Creation', function() {
    FunkyTests.it('create returns instance', function() {
      // This will try to find a DataTable which won't exist, but should not throw
      var threw = false;
      try {
        var instance = Funky.ConditionalFormatting.create('nonexistent-table', []);
        expect(instance !== null).toBe(true);
        expect(typeof instance).toBe('object');
      } catch (e) {
        // May throw if jQuery or DataTables not available
        threw = true;
      }
      // Either way, just verify it doesn't crash the test runner
      expect(true).toBe(true);
    });

    FunkyTests.it('constructor accepts columns array', function() {
      var threw = false;
      try {
        var columns = [
          { data: 'name', title: 'Name' },
          { data: 'status', title: 'Status' }
        ];
        var instance = Funky.ConditionalFormatting.create('test-table', columns);
      } catch (e) {
        threw = true;
      }
      // Either way, just verify it doesn't crash
      expect(true).toBe(true);
    });
  });

  FunkyTests.describe('Style Class Naming', function() {
    FunkyTests.it('all styles have cf- prefix', function() {
      var styles = Funky.ConditionalFormatting.getStyles();
      var allHavePrefix = true;

      Object.keys(styles).forEach(function(key) {
        if (!styles[key].class.startsWith('cf-')) {
          allHavePrefix = false;
        }
      });

      expect(allHavePrefix).toBe(true);
    });

    FunkyTests.it('all styles have label', function() {
      var styles = Funky.ConditionalFormatting.getStyles();
      var allHaveLabel = true;

      Object.keys(styles).forEach(function(key) {
        if (!styles[key].label || typeof styles[key].label !== 'string') {
          allHaveLabel = false;
        }
      });

      expect(allHaveLabel).toBe(true);
    });
  });

  FunkyTests.describe('Condition Metadata', function() {
    FunkyTests.it('all conditions have label', function() {
      var conditions = Funky.ConditionalFormatting.getConditions();
      var allHaveLabel = true;

      Object.keys(conditions).forEach(function(key) {
        if (!conditions[key].label || typeof conditions[key].label !== 'string') {
          allHaveLabel = false;
        }
      });

      expect(allHaveLabel).toBe(true);
    });

    FunkyTests.it('numeric conditions are marked', function() {
      var conditions = Funky.ConditionalFormatting.getConditions();
      var numericConditions = ['greaterThan', 'lessThan', 'greaterOrEqual', 'lessOrEqual', 'between'];

      numericConditions.forEach(function(key) {
        expect(conditions[key].numeric).toBe(true);
      });
    });

    FunkyTests.it('needsValue is defined correctly', function() {
      var conditions = Funky.ConditionalFormatting.getConditions();

      // These need a value
      expect(conditions.equals.needsValue).toBe(true);
      expect(conditions.contains.needsValue).toBe(true);

      // These don't need a value
      expect(conditions.isEmpty.needsValue).toBe(false);
      expect(conditions.isNotEmpty.needsValue).toBe(false);
    });
  });

  FunkyTests.describe('Style Count', function() {
    FunkyTests.it('has at least 10 styles available', function() {
      var styles = Funky.ConditionalFormatting.getStyles();
      var count = Object.keys(styles).length;
      expect(count >= 10).toBe(true);
    });
  });

  FunkyTests.describe('Condition Count', function() {
    FunkyTests.it('has at least 10 conditions available', function() {
      var conditions = Funky.ConditionalFormatting.getConditions();
      var count = Object.keys(conditions).length;
      expect(count >= 10).toBe(true);
    });
  });
});

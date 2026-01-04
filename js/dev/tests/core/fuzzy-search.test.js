/**
 * Tests for Funky.FuzzySearch
 * Fuzzy String Matching Utility
 */
FunkyTests.describe('Funky.Core.FuzzySearch', function() {
  var expect = FunkyTests.expect;

  FunkyTests.describe('Module Structure', function() {
    FunkyTests.it('Funky.FuzzySearch exists', function() {
      expect(Funky.FuzzySearch !== undefined).toBe(true);
    });

    FunkyTests.it('has match method', function() {
      expect(typeof Funky.FuzzySearch.match).toBe('function');
    });

    FunkyTests.it('has search method', function() {
      expect(typeof Funky.FuzzySearch.search).toBe('function');
    });

    FunkyTests.it('has substring method', function() {
      expect(typeof Funky.FuzzySearch.substring).toBe('function');
    });

    FunkyTests.it('has tokenMatch method', function() {
      expect(typeof Funky.FuzzySearch.tokenMatch).toBe('function');
    });

    FunkyTests.it('has create factory method', function() {
      expect(typeof Funky.FuzzySearch.create).toBe('function');
    });

    FunkyTests.it('exposes DEFAULTS', function() {
      expect(Funky.FuzzySearch.DEFAULTS !== undefined).toBe(true);
      expect(typeof Funky.FuzzySearch.DEFAULTS.threshold).toBe('number');
    });

    FunkyTests.it('DEFAULTS has expected properties', function() {
      expect(Funky.FuzzySearch.DEFAULTS.threshold).toBe(0.3);
      expect(Funky.FuzzySearch.DEFAULTS.caseSensitive).toBe(false);
      expect(Funky.FuzzySearch.DEFAULTS.tokenize).toBe(false);
      expect(Funky.FuzzySearch.DEFAULTS.matchAllTokens).toBe(false);
    });
  });

  FunkyTests.describe('match() - Basic', function() {
    FunkyTests.it('returns null for empty query', function() {
      expect(Funky.FuzzySearch.match('', 'hello')).toBe(null);
    });

    FunkyTests.it('returns null for empty text', function() {
      expect(Funky.FuzzySearch.match('hello', '')).toBe(null);
    });

    FunkyTests.it('returns null for null query', function() {
      expect(Funky.FuzzySearch.match(null, 'hello')).toBe(null);
    });

    FunkyTests.it('returns null for null text', function() {
      expect(Funky.FuzzySearch.match('hello', null)).toBe(null);
    });

    FunkyTests.it('returns object with score and matches for valid input', function() {
      var result = Funky.FuzzySearch.match('hello', 'hello');
      expect(result !== null).toBe(true);
      expect(typeof result.score).toBe('number');
      expect(Array.isArray(result.matches)).toBe(true);
    });
  });

  FunkyTests.describe('match() - Exact Match', function() {
    FunkyTests.it('returns score of 1 for exact match', function() {
      var result = Funky.FuzzySearch.match('hello', 'hello');
      expect(result.score).toBe(1);
    });

    FunkyTests.it('returns all character positions for exact match', function() {
      var result = Funky.FuzzySearch.match('hello', 'hello');
      expect(result.matches.length).toBe(5);
    });

    FunkyTests.it('match positions are [index, index] tuples', function() {
      var result = Funky.FuzzySearch.match('hi', 'hi');
      expect(result.matches[0][0]).toBe(0);
      expect(result.matches[0][1]).toBe(0);
      expect(result.matches[1][0]).toBe(1);
      expect(result.matches[1][1]).toBe(1);
    });
  });

  FunkyTests.describe('match() - Substring Match', function() {
    FunkyTests.it('matches substring at start', function() {
      var result = Funky.FuzzySearch.match('hel', 'hello');
      expect(result !== null).toBe(true);
      expect(result.score > 0.7).toBe(true);
    });

    FunkyTests.it('matches substring in middle', function() {
      var result = Funky.FuzzySearch.match('ell', 'hello');
      expect(result !== null).toBe(true);
      expect(result.score > 0.7).toBe(true);
    });

    FunkyTests.it('matches substring at end', function() {
      var result = Funky.FuzzySearch.match('llo', 'hello');
      expect(result !== null).toBe(true);
      expect(result.score > 0.7).toBe(true);
    });

    FunkyTests.it('earlier substrings score higher', function() {
      var startResult = Funky.FuzzySearch.match('hel', 'hello world');
      var endResult = Funky.FuzzySearch.match('rld', 'hello world');
      expect(startResult.score > endResult.score).toBe(true);
    });
  });

  FunkyTests.describe('match() - Fuzzy Match', function() {
    FunkyTests.it('matches non-consecutive characters', function() {
      var result = Funky.FuzzySearch.match('hlo', 'hello');
      expect(result !== null).toBe(true);
      expect(result.matches.length).toBe(3);
    });

    FunkyTests.it('returns null when characters not found', function() {
      expect(Funky.FuzzySearch.match('xyz', 'hello')).toBe(null);
    });

    FunkyTests.it('returns null when query longer than text', function() {
      expect(Funky.FuzzySearch.match('hello world', 'hello')).toBe(null);
    });

    FunkyTests.it('consecutive matches score higher than spread matches', function() {
      var consecutive = Funky.FuzzySearch.match('hel', 'hello world');
      var spread = Funky.FuzzySearch.match('hod', 'hello world');
      expect(consecutive !== null).toBe(true);
      expect(spread !== null).toBe(true);
      expect(consecutive.score > spread.score).toBe(true);
    });
  });

  FunkyTests.describe('match() - Case Sensitivity', function() {
    FunkyTests.it('is case-insensitive by default', function() {
      var result = Funky.FuzzySearch.match('HELLO', 'hello');
      expect(result !== null).toBe(true);
      expect(result.score).toBe(1);
    });

    FunkyTests.it('respects caseSensitive option', function() {
      var result = Funky.FuzzySearch.match('HELLO', 'hello', { caseSensitive: true });
      expect(result).toBe(null);
    });

    FunkyTests.it('matches when case matches with caseSensitive', function() {
      var result = Funky.FuzzySearch.match('hello', 'hello', { caseSensitive: true });
      expect(result !== null).toBe(true);
      expect(result.score).toBe(1);
    });
  });

  FunkyTests.describe('search() - Basic', function() {
    FunkyTests.it('returns empty array for empty query', function() {
      var items = [{ name: 'Apple' }];
      var results = Funky.FuzzySearch.search('', items, { keys: ['name'] });
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    FunkyTests.it('returns empty array for empty items', function() {
      var results = Funky.FuzzySearch.search('apple', [], { keys: ['name'] });
      expect(results.length).toBe(0);
    });

    FunkyTests.it('returns empty array for null items', function() {
      var results = Funky.FuzzySearch.search('apple', null, { keys: ['name'] });
      expect(results.length).toBe(0);
    });
  });

  FunkyTests.describe('search() - Object Arrays', function() {
    var items = [
      { id: 1, name: 'Apple', category: 'Fruit' },
      { id: 2, name: 'Banana', category: 'Fruit' },
      { id: 3, name: 'Carrot', category: 'Vegetable' }
    ];

    FunkyTests.it('searches by specified keys', function() {
      var results = Funky.FuzzySearch.search('app', items, { keys: ['name'] });
      expect(results.length).toBe(1);
      expect(results[0].item.name).toBe('Apple');
    });

    FunkyTests.it('result includes item reference', function() {
      var results = Funky.FuzzySearch.search('banana', items, { keys: ['name'] });
      expect(results[0].item).toBe(items[1]);
    });

    FunkyTests.it('result includes original index', function() {
      var results = Funky.FuzzySearch.search('carrot', items, { keys: ['name'] });
      expect(results[0].index).toBe(2);
    });

    FunkyTests.it('result includes score', function() {
      var results = Funky.FuzzySearch.search('apple', items, { keys: ['name'] });
      expect(typeof results[0].score).toBe('number');
      expect(results[0].score > 0).toBe(true);
    });

    FunkyTests.it('result includes matched key', function() {
      var results = Funky.FuzzySearch.search('fruit', items, { keys: ['category'] });
      expect(results[0].key).toBe('category');
    });

    FunkyTests.it('searches multiple keys', function() {
      var results = Funky.FuzzySearch.search('fruit', items, { keys: ['name', 'category'] });
      expect(results.length).toBe(2); // Apple and Banana both have category: Fruit
    });
  });

  FunkyTests.describe('search() - String Arrays', function() {
    var items = ['apple', 'banana', 'cherry', 'date'];

    FunkyTests.it('searches plain string arrays', function() {
      var results = Funky.FuzzySearch.search('ban', items);
      expect(results.length).toBe(1);
      expect(results[0].item).toBe('banana');
    });

    FunkyTests.it('returns index for string arrays', function() {
      var results = Funky.FuzzySearch.search('cherry', items);
      expect(results[0].index).toBe(2);
    });
  });

  FunkyTests.describe('search() - Options', function() {
    var items = [
      { name: 'Apple' },
      { name: 'Apricot' },
      { name: 'Banana' }
    ];

    FunkyTests.it('respects threshold option', function() {
      var results = Funky.FuzzySearch.search('xyz', items, {
        keys: ['name'],
        threshold: 0.5
      });
      expect(results.length).toBe(0);
    });

    FunkyTests.it('respects limit option', function() {
      var results = Funky.FuzzySearch.search('a', items, {
        keys: ['name'],
        threshold: 0.1,
        limit: 1
      });
      expect(results.length).toBe(1);
    });

    FunkyTests.it('sorts results by score descending', function() {
      var results = Funky.FuzzySearch.search('ap', items, {
        keys: ['name'],
        threshold: 0.1
      });
      expect(results.length >= 2).toBe(true);
      for (var i = 1; i < results.length; i++) {
        expect(results[i - 1].score >= results[i].score).toBe(true);
      }
    });

    FunkyTests.it('uses custom getText function', function() {
      var results = Funky.FuzzySearch.search('apple', items, {
        getText: function(item) { return item.name; }
      });
      expect(results.length).toBe(1);
      expect(results[0].item.name).toBe('Apple');
    });
  });

  FunkyTests.describe('search() - Nested Properties', function() {
    var items = [
      { user: { name: 'John Smith', email: 'john@example.com' } },
      { user: { name: 'Jane Doe', email: 'jane@example.com' } }
    ];

    FunkyTests.it('searches nested properties with dot notation', function() {
      var results = Funky.FuzzySearch.search('john', items, { keys: ['user.name'] });
      expect(results.length).toBe(1);
      expect(results[0].item.user.name).toBe('John Smith');
    });

    FunkyTests.it('searches multiple nested properties', function() {
      var results = Funky.FuzzySearch.search('jane', items, { keys: ['user.name', 'user.email'] });
      expect(results.length).toBe(1);
    });
  });

  FunkyTests.describe('search() - Array Fields', function() {
    var items = [
      { name: 'Apple', tags: ['fruit', 'red', 'sweet'] },
      { name: 'Carrot', tags: ['vegetable', 'orange'] }
    ];

    FunkyTests.it('searches array fields', function() {
      var results = Funky.FuzzySearch.search('red', items, { keys: ['tags'] });
      expect(results.length).toBe(1);
      expect(results[0].item.name).toBe('Apple');
    });

    FunkyTests.it('key includes array index for array matches', function() {
      var results = Funky.FuzzySearch.search('vegetable', items, { keys: ['tags'] });
      expect(results[0].key.indexOf('tags[') === 0).toBe(true);
    });
  });

  FunkyTests.describe('substring()', function() {
    FunkyTests.it('returns null for no match', function() {
      expect(Funky.FuzzySearch.substring('xyz', 'hello')).toBe(null);
    });

    FunkyTests.it('returns match with positions', function() {
      var result = Funky.FuzzySearch.substring('ell', 'hello');
      expect(result !== null).toBe(true);
      expect(result.matches.length).toBe(3);
    });

    FunkyTests.it('positions start at correct index', function() {
      var result = Funky.FuzzySearch.substring('ell', 'hello');
      expect(result.matches[0][0]).toBe(1); // 'ell' starts at index 1
    });

    FunkyTests.it('is case-insensitive by default', function() {
      var result = Funky.FuzzySearch.substring('ELL', 'hello');
      expect(result !== null).toBe(true);
    });

    FunkyTests.it('respects caseSensitive option', function() {
      var result = Funky.FuzzySearch.substring('ELL', 'hello', { caseSensitive: true });
      expect(result).toBe(null);
    });
  });

  FunkyTests.describe('tokenMatch()', function() {
    FunkyTests.it('handles single token', function() {
      var result = Funky.FuzzySearch.tokenMatch('hello', 'hello world');
      expect(result !== null).toBe(true);
      expect(result.score > 0.5).toBe(true);
    });

    FunkyTests.it('handles multiple tokens', function() {
      var result = Funky.FuzzySearch.tokenMatch('hello world', 'hello world');
      expect(result !== null).toBe(true);
      expect(result.tokenMatches).toBe(2);
      expect(result.tokenCount).toBe(2);
    });

    FunkyTests.it('matches partial tokens', function() {
      var result = Funky.FuzzySearch.tokenMatch('hel wor', 'hello world');
      expect(result !== null).toBe(true);
    });

    FunkyTests.it('returns null when all tokens required but one missing', function() {
      var result = Funky.FuzzySearch.tokenMatch('hello xyz', 'hello world', { matchAllTokens: true });
      expect(result).toBe(null);
    });

    FunkyTests.it('matches partial when matchAllTokens is false', function() {
      var result = Funky.FuzzySearch.tokenMatch('hello xyz', 'hello world', { matchAllTokens: false });
      expect(result !== null).toBe(true);
    });
  });

  FunkyTests.describe('create()', function() {
    FunkyTests.it('creates instance with match method', function() {
      var matcher = Funky.FuzzySearch.create();
      expect(typeof matcher.match).toBe('function');
    });

    FunkyTests.it('creates instance with search method', function() {
      var matcher = Funky.FuzzySearch.create();
      expect(typeof matcher.search).toBe('function');
    });

    FunkyTests.it('creates instance with substring method', function() {
      var matcher = Funky.FuzzySearch.create();
      expect(typeof matcher.substring).toBe('function');
    });

    FunkyTests.it('uses configured defaults', function() {
      var matcher = Funky.FuzzySearch.create({ caseSensitive: true });
      var result = matcher.match('HELLO', 'hello');
      expect(result).toBe(null);
    });

    FunkyTests.it('allows override at call time', function() {
      var matcher = Funky.FuzzySearch.create({ caseSensitive: true });
      var result = matcher.match('HELLO', 'hello', { caseSensitive: false });
      expect(result !== null).toBe(true);
    });
  });
});

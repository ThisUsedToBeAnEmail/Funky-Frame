/**
 * Tests for Funky.History
 * LRU History Tracking Module
 */
FunkyTests.describe('Funky.Core.History', function() {
  var expect = FunkyTests.expect;
  var history;
  
  FunkyTests.afterEach(function() {
    // Clean up after each test
    Funky.History.destroyAll();
    // Clear any test storage keys
    if (Funky.Storage) {
      Funky.Storage.remove('test_history');
      Funky.Storage.remove('test_history_2');
      Funky.Storage.remove('test_ns:test_history');
      Funky.Storage.remove('app:recent_items');
      Funky.Storage.remove('admin:recent_items');
    }
  });

  // =========================================================================
  // MODULE STRUCTURE
  // =========================================================================

  FunkyTests.describe('Module Structure', function() {
    FunkyTests.it('Funky.History exists', function() {
      expect(Funky.History !== undefined).toBe(true);
    });

    FunkyTests.it('has create method', function() {
      expect(typeof Funky.History.create).toBe('function');
    });

    FunkyTests.it('has get method', function() {
      expect(typeof Funky.History.get).toBe('function');
    });

    FunkyTests.it('has has method', function() {
      expect(typeof Funky.History.has).toBe('function');
    });

    FunkyTests.it('has destroy method', function() {
      expect(typeof Funky.History.destroy).toBe('function');
    });

    FunkyTests.it('has destroyAll method', function() {
      expect(typeof Funky.History.destroyAll).toBe('function');
    });

    FunkyTests.it('has keys method', function() {
      expect(typeof Funky.History.keys).toBe('function');
    });

    FunkyTests.it('exposes DEFAULTS', function() {
      expect(Funky.History.DEFAULTS !== undefined).toBe(true);
    });

    FunkyTests.it('DEFAULTS has expected properties', function() {
      expect(Funky.History.DEFAULTS.maxItems).toBe(10);
      expect(Funky.History.DEFAULTS.persist).toBe(true);
      expect(Funky.History.DEFAULTS.dedupe).toBe(true);
      expect(Funky.History.DEFAULTS.emitEvents).toBe(true);
      expect(Funky.History.DEFAULTS.namespace).toBe(null);
      expect(Funky.History.DEFAULTS.comparator).toBe(null);
      expect(Funky.History.DEFAULTS.onChange).toBe(null);
    });
  });

  // =========================================================================
  // CREATE
  // =========================================================================

  FunkyTests.describe('create()', function() {
    FunkyTests.it('returns history instance', function() {
      history = Funky.History.create({ key: 'test_history' });
      expect(history !== null).toBe(true);
      expect(typeof history.add).toBe('function');
    });

    FunkyTests.it('returns same instance for same key', function() {
      var h1 = Funky.History.create({ key: 'test_history' });
      var h2 = Funky.History.create({ key: 'test_history' });
      expect(h1 === h2).toBe(true);
    });

    FunkyTests.it('returns different instance for different key', function() {
      var h1 = Funky.History.create({ key: 'test_history' });
      var h2 = Funky.History.create({ key: 'test_history_2' });
      expect(h1 === h2).toBe(false);
    });

    FunkyTests.it('accepts custom maxItems', function() {
      history = Funky.History.create({ key: 'test_history', maxItems: 5 });
      expect(history.options.maxItems).toBe(5);
    });

    FunkyTests.it('accepts persist option', function() {
      history = Funky.History.create({ key: 'test_history', persist: false });
      expect(history.options.persist).toBe(false);
    });

    FunkyTests.it('works without key (no persistence)', function() {
      history = Funky.History.create({ maxItems: 3 });
      expect(history !== null).toBe(true);
      history.add('item1');
      expect(history.size()).toBe(1);
    });
  });

  // =========================================================================
  // ADD
  // =========================================================================

  FunkyTests.describe('add()', function() {
    FunkyTests.beforeEach(function() {
      history = Funky.History.create({ key: 'test_history', maxItems: 5, persist: false });
    });

    FunkyTests.it('adds item to history', function() {
      history.add('item1');
      expect(history.size()).toBe(1);
      expect(history.has('item1')).toBe(true);
    });

    FunkyTests.it('adds item at front', function() {
      history.add('item1');
      history.add('item2');
      expect(history.first()).toBe('item2');
    });

    FunkyTests.it('returns instance for chaining', function() {
      var result = history.add('item1');
      expect(result === history).toBe(true);
    });

    FunkyTests.it('ignores null items', function() {
      history.add(null);
      expect(history.size()).toBe(0);
    });

    FunkyTests.it('ignores undefined items', function() {
      history.add(undefined);
      expect(history.size()).toBe(0);
    });

    FunkyTests.it('moves duplicate to front (dedupe)', function() {
      history.add('item1');
      history.add('item2');
      history.add('item3');
      history.add('item1'); // Move to front
      
      expect(history.first()).toBe('item1');
      expect(history.size()).toBe(3); // No duplicate
    });

    FunkyTests.it('respects maxItems limit', function() {
      history.add('a');
      history.add('b');
      history.add('c');
      history.add('d');
      history.add('e');
      history.add('f'); // Should evict 'a'
      
      expect(history.size()).toBe(5);
      expect(history.has('a')).toBe(false);
      expect(history.has('f')).toBe(true);
    });

    FunkyTests.it('allows duplicates when dedupe disabled', function() {
      history = Funky.History.create({ key: 'test_history_2', maxItems: 5, dedupe: false, persist: false });
      history.add('item1');
      history.add('item2');
      history.add('item1');
      
      expect(history.size()).toBe(3);
    });

    FunkyTests.it('add with silent option skips event emission', function() {
      var eventFired = false;
      if (Funky.PubSub) {
        var handler = function() { eventFired = true; };
        Funky.PubSub.on('funky:history:add', handler);
      }
      
      history = Funky.History.create({ key: 'test_history', persist: false });
      history.add('silent_item', { silent: true });
      
      expect(history.has('silent_item')).toBe(true);
      expect(eventFired).toBe(false);
      
      if (Funky.PubSub) {
        Funky.PubSub.off('funky:history:add', handler);
      }
    });
  });

  // =========================================================================
  // ADDALL
  // =========================================================================

  FunkyTests.describe('addAll()', function() {
    FunkyTests.beforeEach(function() {
      history = Funky.History.create({ key: 'test_history', maxItems: 10, persist: false });
    });

    FunkyTests.it('adds multiple items', function() {
      history.addAll(['a', 'b', 'c']);
      expect(history.size()).toBe(3);
    });

    FunkyTests.it('first item in array is most recent', function() {
      history.addAll(['a', 'b', 'c']);
      expect(history.first()).toBe('a');
    });

    FunkyTests.it('returns instance for chaining', function() {
      var result = history.addAll(['a', 'b']);
      expect(result === history).toBe(true);
    });

    FunkyTests.it('ignores non-array input', function() {
      history.addAll('not an array');
      expect(history.size()).toBe(0);
    });

    FunkyTests.it('addAll emits single batch event', function() {
      var eventCount = 0;
      var batchEventData = null;
      var addHandler = function() { eventCount++; };
      var batchHandler = function(data) { batchEventData = data; };
      
      if (Funky.PubSub) {
        Funky.PubSub.on('funky:history:add', addHandler);
        Funky.PubSub.on('funky:history:batch', batchHandler);
      }
      
      history.addAll(['x', 'y', 'z']);
      
      expect(eventCount).toBe(0); // No individual add events
      expect(batchEventData !== null).toBe(true);
      expect(batchEventData.items.length).toBe(3);
      
      if (Funky.PubSub) {
        Funky.PubSub.off('funky:history:add', addHandler);
        Funky.PubSub.off('funky:history:batch', batchHandler);
      }
    });
  });

  // =========================================================================
  // BATCH
  // =========================================================================

  FunkyTests.describe('batch()', function() {
    FunkyTests.beforeEach(function() {
      history = Funky.History.create({ key: 'test_history', maxItems: 10, persist: false });
    });

    FunkyTests.it('executes operations in batch mode', function() {
      history.batch(function() {
        this.add('a').add('b').add('c');
      });
      
      expect(history.size()).toBe(3);
    });

    FunkyTests.it('emits single batch event for multiple adds', function() {
      var addCount = 0;
      var batchData = null;
      var addHandler = function() { addCount++; };
      var batchHandler = function(data) { batchData = data; };
      
      if (Funky.PubSub) {
        Funky.PubSub.on('funky:history:add', addHandler);
        Funky.PubSub.on('funky:history:batch', batchHandler);
      }
      
      history.batch(function() {
        this.add('a').add('b').add('c');
      });
      
      expect(addCount).toBe(0); // No individual events
      expect(batchData !== null).toBe(true);
      expect(batchData.items.length).toBe(3);
      
      if (Funky.PubSub) {
        Funky.PubSub.off('funky:history:add', addHandler);
        Funky.PubSub.off('funky:history:batch', batchHandler);
      }
    });

    FunkyTests.it('returns instance for chaining', function() {
      var result = history.batch(function() {
        this.add('a');
      });
      expect(result === history).toBe(true);
    });
  });

  // =========================================================================
  // REMOVE
  // =========================================================================

  FunkyTests.describe('remove()', function() {
    FunkyTests.beforeEach(function() {
      history = Funky.History.create({ key: 'test_history', persist: false });
      history.addAll(['a', 'b', 'c']);
    });

    FunkyTests.it('removes existing item', function() {
      var result = history.remove('b');
      expect(result).toBe(true);
      expect(history.has('b')).toBe(false);
      expect(history.size()).toBe(2);
    });

    FunkyTests.it('returns false for non-existent item', function() {
      var result = history.remove('z');
      expect(result).toBe(false);
    });
  });

  // =========================================================================
  // HAS
  // =========================================================================

  FunkyTests.describe('has()', function() {
    FunkyTests.beforeEach(function() {
      history = Funky.History.create({ key: 'test_history', persist: false });
      history.add('exists');
    });

    FunkyTests.it('returns true for existing item', function() {
      expect(history.has('exists')).toBe(true);
    });

    FunkyTests.it('returns false for non-existent item', function() {
      expect(history.has('nope')).toBe(false);
    });
  });

  // =========================================================================
  // GETALL
  // =========================================================================

  FunkyTests.describe('getAll()', function() {
    FunkyTests.beforeEach(function() {
      history = Funky.History.create({ key: 'test_history', persist: false });
      history.addAll(['a', 'b', 'c']);
    });

    FunkyTests.it('returns all items', function() {
      var items = history.getAll();
      expect(items.length).toBe(3);
    });

    FunkyTests.it('returns items in order (most recent first)', function() {
      var items = history.getAll();
      expect(items[0]).toBe('a');
      expect(items[2]).toBe('c');
    });

    FunkyTests.it('returns copy not reference', function() {
      var items = history.getAll();
      items.push('modified');
      expect(history.size()).toBe(3); // Original unchanged
    });
  });

  // =========================================================================
  // FIRST / LAST
  // =========================================================================

  FunkyTests.describe('first() / last()', function() {
    FunkyTests.beforeEach(function() {
      history = Funky.History.create({ key: 'test_history', persist: false });
      history.addAll(['newest', 'middle', 'oldest']);
    });

    FunkyTests.it('first() returns most recent', function() {
      expect(history.first()).toBe('newest');
    });

    FunkyTests.it('last() returns oldest', function() {
      expect(history.last()).toBe('oldest');
    });

    FunkyTests.it('first() returns undefined when empty', function() {
      history.clear();
      expect(history.first()).toBe(undefined);
    });
  });

  // =========================================================================
  // SIZE / ISEMPTY
  // =========================================================================

  FunkyTests.describe('size() / isEmpty()', function() {
    FunkyTests.beforeEach(function() {
      history = Funky.History.create({ key: 'test_history', persist: false });
    });

    FunkyTests.it('size() returns count', function() {
      expect(history.size()).toBe(0);
      history.add('a');
      expect(history.size()).toBe(1);
    });

    FunkyTests.it('isEmpty() returns true when empty', function() {
      expect(history.isEmpty()).toBe(true);
    });

    FunkyTests.it('isEmpty() returns false when not empty', function() {
      history.add('a');
      expect(history.isEmpty()).toBe(false);
    });
  });

  // =========================================================================
  // POP / SHIFT / PEEK (Stack Operations)
  // =========================================================================

  FunkyTests.describe('pop() / shift() / peek()', function() {
    FunkyTests.beforeEach(function() {
      history = Funky.History.create({ key: 'test_history', persist: false });
      history.addAll(['c', 'b', 'a']); // Order: c (newest), b, a (oldest)
    });

    FunkyTests.it('pop() removes and returns newest item', function() {
      var item = history.pop();
      expect(item).toBe('c');
      expect(history.size()).toBe(2);
      expect(history.has('c')).toBe(false);
    });

    FunkyTests.it('pop() returns undefined when empty', function() {
      history.clear();
      var item = history.pop();
      expect(item).toBe(undefined);
    });

    FunkyTests.it('shift() removes and returns oldest item', function() {
      var item = history.shift();
      expect(item).toBe('a');
      expect(history.size()).toBe(2);
      expect(history.has('a')).toBe(false);
    });

    FunkyTests.it('shift() returns undefined when empty', function() {
      history.clear();
      var item = history.shift();
      expect(item).toBe(undefined);
    });

    FunkyTests.it('peek() returns newest without removing', function() {
      var item = history.peek();
      expect(item).toBe('c');
      expect(history.size()).toBe(3); // Size unchanged
    });

    FunkyTests.it('pop() emits pop event', function() {
      var eventData = null;
      var handler = function(data) { eventData = data; };
      
      if (Funky.PubSub) {
        Funky.PubSub.on('funky:history:pop', handler);
      }
      
      history.pop();
      
      expect(eventData !== null).toBe(true);
      expect(eventData.item).toBe('c');
      
      if (Funky.PubSub) {
        Funky.PubSub.off('funky:history:pop', handler);
      }
    });

    FunkyTests.it('shift() emits shift event', function() {
      var eventData = null;
      var handler = function(data) { eventData = data; };
      
      if (Funky.PubSub) {
        Funky.PubSub.on('funky:history:shift', handler);
      }
      
      history.shift();
      
      expect(eventData !== null).toBe(true);
      expect(eventData.item).toBe('a');
      
      if (Funky.PubSub) {
        Funky.PubSub.off('funky:history:shift', handler);
      }
    });
  });

  // =========================================================================
  // TRAVERSAL (Cursor-Based Navigation)
  // =========================================================================

  FunkyTests.describe('Traversal (cursor navigation)', function() {
    FunkyTests.beforeEach(function() {
      history = Funky.History.create({ key: 'test_history', persist: false });
      history.addAll(['c', 'b', 'a']); // Order: c (index 0), b (index 1), a (index 2)
    });

    FunkyTests.it('cursor() returns -1 initially', function() {
      expect(history.cursor()).toBe(-1);
    });

    FunkyTests.it('current() returns undefined when cursor not set', function() {
      expect(history.current()).toBe(undefined);
    });

    FunkyTests.it('next() moves cursor to first item', function() {
      var item = history.next();
      expect(item).toBe('c');
      expect(history.cursor()).toBe(0);
    });

    FunkyTests.it('next() moves cursor to older items', function() {
      history.next(); // c, cursor: 0
      history.next(); // b, cursor: 1
      var item = history.next(); // a, cursor: 2
      expect(item).toBe('a');
      expect(history.cursor()).toBe(2);
    });

    FunkyTests.it('next() returns undefined at end', function() {
      history.next(); // c
      history.next(); // b
      history.next(); // a
      var item = history.next(); // past end
      expect(item).toBe(undefined);
      expect(history.cursor()).toBe(2); // Still at last
    });

    FunkyTests.it('prev() moves cursor to newer items', function() {
      history.goto(2); // Start at 'a'
      var item = history.prev();
      expect(item).toBe('b');
      expect(history.cursor()).toBe(1);
    });

    FunkyTests.it('prev() returns undefined at start', function() {
      history.next(); // Move to cursor 0
      var item = history.prev();
      expect(item).toBe(undefined);
    });

    FunkyTests.it('goto() sets cursor to specific index', function() {
      var item = history.goto(1);
      expect(item).toBe('b');
      expect(history.cursor()).toBe(1);
    });

    FunkyTests.it('goto() returns undefined for invalid index', function() {
      var item = history.goto(99);
      expect(item).toBe(undefined);
    });

    FunkyTests.it('current() returns item at cursor', function() {
      history.goto(1);
      expect(history.current()).toBe('b');
    });

    FunkyTests.it('resetCursor() resets cursor to -1', function() {
      history.goto(1);
      history.resetCursor();
      expect(history.cursor()).toBe(-1);
      expect(history.current()).toBe(undefined);
    });

    FunkyTests.it('hasNext() returns true when more items', function() {
      history.next(); // cursor: 0
      expect(history.hasNext()).toBe(true);
    });

    FunkyTests.it('hasNext() returns false at end', function() {
      history.goto(2); // cursor at last item
      expect(history.hasNext()).toBe(false);
    });

    FunkyTests.it('hasPrev() returns true when earlier items', function() {
      history.goto(1);
      expect(history.hasPrev()).toBe(true);
    });

    FunkyTests.it('hasPrev() returns false at start', function() {
      history.next(); // cursor: 0
      expect(history.hasPrev()).toBe(false);
    });

    FunkyTests.it('pop() adjusts cursor appropriately', function() {
      history.goto(1); // cursor at 'b'
      history.pop(); // Remove 'c', history: ['b', 'a']
      expect(history.cursor()).toBe(0); // Adjusted down
      expect(history.current()).toBe('b');
    });

    FunkyTests.it('clear() resets cursor', function() {
      history.goto(1);
      history.clear();
      expect(history.cursor()).toBe(-1);
    });
  });

  // =========================================================================
  // CLEAR
  // =========================================================================

  FunkyTests.describe('clear()', function() {
    FunkyTests.beforeEach(function() {
      history = Funky.History.create({ key: 'test_history', persist: false });
      history.addAll(['a', 'b', 'c']);
    });

    FunkyTests.it('removes all items', function() {
      history.clear();
      expect(history.size()).toBe(0);
      expect(history.isEmpty()).toBe(true);
    });

    FunkyTests.it('returns instance for chaining', function() {
      var result = history.clear();
      expect(result === history).toBe(true);
    });
  });

  // =========================================================================
  // ITERATION
  // =========================================================================

  FunkyTests.describe('forEach() / map() / filter()', function() {
    FunkyTests.beforeEach(function() {
      history = Funky.History.create({ key: 'test_history', persist: false });
      history.clear();
      history.addAll(['a', 'b', 'c']);
    });

    FunkyTests.it('forEach iterates all items', function() {
      var items = [];
      history.forEach(function(item) {
        items.push(item);
      });
      expect(items.length).toBe(3);
    });

    FunkyTests.it('forEach passes index', function() {
      var indices = [];
      history.forEach(function(item, i) {
        indices.push(i);
      });
      expect(indices[0]).toBe(0);
      expect(indices[2]).toBe(2);
    });

    FunkyTests.it('map transforms items', function() {
      var result = history.map(function(item) {
        return item.toUpperCase();
      });
      expect(result[0]).toBe('A');
    });

    FunkyTests.it('filter returns matching items', function() {
      history.clear();
      history.addAll(['apple', 'banana', 'apricot']);
      var result = history.filter(function(item) {
        return item.indexOf('a') === 0;
      });
      expect(result.length).toBe(2);
    });
  });

  // =========================================================================
  // SETMAXITEMS
  // =========================================================================

  FunkyTests.describe('setMaxItems()', function() {
    FunkyTests.beforeEach(function() {
      history = Funky.History.create({ key: 'test_history', maxItems: 10, persist: false });
      history.addAll(['a', 'b', 'c', 'd', 'e']);
    });

    FunkyTests.it('updates max limit', function() {
      history.setMaxItems(3);
      expect(history.options.maxItems).toBe(3);
    });

    FunkyTests.it('trims items if over new limit', function() {
      history.setMaxItems(3);
      expect(history.size()).toBe(3);
      expect(history.has('d')).toBe(false);
      expect(history.has('e')).toBe(false);
    });

    FunkyTests.it('keeps items if under new limit', function() {
      history.setMaxItems(10);
      expect(history.size()).toBe(5);
    });
  });

  // =========================================================================
  // PERSISTENCE
  // =========================================================================

  FunkyTests.describe('Persistence', function() {
    FunkyTests.it('loads from storage on create', function() {
      // First instance adds items
      var h1 = Funky.History.create({ key: 'test_history', persist: true });
      h1.addAll(['a', 'b', 'c']);
      h1.destroy();
      
      // New instance should load from storage
      var h2 = Funky.History.create({ key: 'test_history', persist: true });
      expect(h2.size()).toBe(3);
      expect(h2.first()).toBe('a');
    });

    FunkyTests.it('reload() refreshes from storage', function() {
      history = Funky.History.create({ key: 'test_history', persist: true });
      history.add('original');
      
      // Manually modify storage
      if (Funky.Storage) {
        Funky.Storage.set('test_history', ['modified']);
      }
      
      history.reload();
      expect(history.first()).toBe('modified');
    });

    FunkyTests.it('does not persist when persist: false', function() {
      history = Funky.History.create({ key: 'test_history', persist: false });
      history.add('temp');
      history.destroy();
      
      var h2 = Funky.History.create({ key: 'test_history', persist: true });
      expect(h2.has('temp')).toBe(false);
    });

    FunkyTests.it('reload() emits reload event', function() {
      var reloadData = null;
      var handler = function(data) { reloadData = data; };
      
      if (Funky.PubSub) {
        Funky.PubSub.on('funky:history:reload', handler);
      }
      
      history = Funky.History.create({ key: 'test_history', persist: true });
      history.add('item');
      history.reload();
      
      expect(reloadData !== null).toBe(true);
      expect(reloadData.size).toBe(1);
      
      if (Funky.PubSub) {
        Funky.PubSub.off('funky:history:reload', handler);
      }
    });
  });

  // =========================================================================
  // NAMESPACE
  // =========================================================================

  FunkyTests.describe('Namespace', function() {
    FunkyTests.it('prefixes storage key with namespace', function() {
      history = Funky.History.create({ 
        key: 'test_history', 
        namespace: 'test_ns',
        persist: true 
      });
      history.add('namespaced_item');
      history.destroy();
      
      // Verify storage key was namespaced
      if (Funky.Storage) {
        var stored = Funky.Storage.get('test_ns:test_history', []);
        expect(stored.length).toBe(1);
        expect(stored[0]).toBe('namespaced_item');
        
        // Original key should be empty
        var notNamespaced = Funky.Storage.get('test_history', []);
        expect(notNamespaced.length).toBe(0);
      }
    });

    FunkyTests.it('different namespaces are isolated', function() {
      // Use different keys since instances are keyed by key alone, not namespace:key
      var h1 = Funky.History.create({ key: 'app:recent_items', persist: true });
      var h2 = Funky.History.create({ key: 'admin:recent_items', persist: true });

      h1.add('app_item');
      h2.add('admin_item');

      expect(h1.has('app_item')).toBe(true);
      expect(h1.has('admin_item')).toBe(false);
      expect(h2.has('admin_item')).toBe(true);
      expect(h2.has('app_item')).toBe(false);
    });
  });

  // =========================================================================
  // COMPARATOR
  // =========================================================================

  FunkyTests.describe('Comparator', function() {
    FunkyTests.it('uses custom comparator for object equality', function() {
      history = Funky.History.create({ 
        key: 'test_history', 
        persist: false,
        comparator: function(a, b) {
          return a.id === b.id;
        }
      });
      
      history.add({ id: 1, name: 'First' });
      history.add({ id: 2, name: 'Second' });
      history.add({ id: 1, name: 'First Updated' }); // Should dedupe
      
      expect(history.size()).toBe(2);
      expect(history.first().name).toBe('First Updated'); // Moved to front
    });

    FunkyTests.it('comparator works with has()', function() {
      history = Funky.History.create({ 
        key: 'test_history', 
        persist: false,
        comparator: function(a, b) { return a.id === b.id; }
      });
      
      history.add({ id: 1, name: 'Item' });
      
      expect(history.has({ id: 1, name: 'Different Name' })).toBe(true);
      expect(history.has({ id: 2, name: 'Item' })).toBe(false);
    });

    FunkyTests.it('comparator works with remove()', function() {
      history = Funky.History.create({ 
        key: 'test_history', 
        persist: false,
        comparator: function(a, b) { return a.id === b.id; }
      });
      
      history.add({ id: 1, name: 'Item' });
      var removed = history.remove({ id: 1, name: 'Any Name' });
      
      expect(removed).toBe(true);
      expect(history.size()).toBe(0);
    });
  });

  // =========================================================================
  // ONCHANGE CALLBACK
  // =========================================================================

  FunkyTests.describe('onChange Callback', function() {
    FunkyTests.it('calls onChange on add', function() {
      var callbackData = null;
      history = Funky.History.create({ 
        key: 'test_history', 
        persist: false,
        onChange: function(action, data) {
          callbackData = { action: action, data: data };
        }
      });
      
      history.add('test_item');
      
      expect(callbackData !== null).toBe(true);
      expect(callbackData.action).toBe('add');
      expect(callbackData.data.item).toBe('test_item');
    });

    FunkyTests.it('calls onChange on remove', function() {
      var callbackAction = null;
      history = Funky.History.create({ 
        key: 'test_history', 
        persist: false,
        onChange: function(action) { callbackAction = action; }
      });
      
      history.add('item');
      history.remove('item');
      
      expect(callbackAction).toBe('remove');
    });

    FunkyTests.it('calls onChange on clear', function() {
      var callbackAction = null;
      history = Funky.History.create({ 
        key: 'test_history', 
        persist: false,
        onChange: function(action) { callbackAction = action; }
      });
      
      history.add('item');
      history.clear();
      
      expect(callbackAction).toBe('clear');
    });

    FunkyTests.it('calls onChange on pop', function() {
      var callbackAction = null;
      history = Funky.History.create({ 
        key: 'test_history', 
        persist: false,
        onChange: function(action) { callbackAction = action; }
      });
      
      history.add('item');
      history.pop();
      
      expect(callbackAction).toBe('pop');
    });

    FunkyTests.it('calls onChange on shift', function() {
      var callbackAction = null;
      history = Funky.History.create({ 
        key: 'test_history', 
        persist: false,
        onChange: function(action) { callbackAction = action; }
      });
      
      history.add('item');
      history.shift();
      
      expect(callbackAction).toBe('shift');
    });

    FunkyTests.it('calls onChange even when emitEvents is false', function() {
      var callbackCalled = false;
      history = Funky.History.create({ 
        key: 'test_history', 
        persist: false,
        emitEvents: false,
        onChange: function() { callbackCalled = true; }
      });
      
      history.add('item');
      
      expect(callbackCalled).toBe(true);
    });

    FunkyTests.it('handles callback errors gracefully', function() {
      history = Funky.History.create({ 
        key: 'test_history', 
        persist: false,
        onChange: function() { throw new Error('Callback error'); }
      });
      
      // Should not throw
      history.add('item');
      expect(history.size()).toBe(1);
    });
  });

  // =========================================================================
  // STATIC METHODS
  // =========================================================================

  FunkyTests.describe('Static get() / has() / destroy()', function() {
    FunkyTests.it('get() returns existing instance', function() {
      Funky.History.create({ key: 'test_history' });
      var retrieved = Funky.History.get('test_history');
      expect(retrieved !== null).toBe(true);
    });

    FunkyTests.it('get() returns null for non-existent', function() {
      expect(Funky.History.get('nope')).toBe(null);
    });

    FunkyTests.it('has() returns true for existing', function() {
      Funky.History.create({ key: 'test_history' });
      expect(Funky.History.has('test_history')).toBe(true);
    });

    FunkyTests.it('has() returns false for non-existent', function() {
      expect(Funky.History.has('nope')).toBe(false);
    });

    FunkyTests.it('destroy() removes instance', function() {
      Funky.History.create({ key: 'test_history' });
      Funky.History.destroy('test_history');
      expect(Funky.History.has('test_history')).toBe(false);
    });

    FunkyTests.it('keys() returns all keys', function() {
      Funky.History.create({ key: 'test_history' });
      Funky.History.create({ key: 'test_history_2' });
      var keys = Funky.History.keys();
      expect(keys.length).toBe(2);
      expect(keys.indexOf('test_history') !== -1).toBe(true);
    });

    FunkyTests.it('destroyAll() removes all instances', function() {
      Funky.History.create({ key: 'test_history' });
      Funky.History.create({ key: 'test_history_2' });
      Funky.History.destroyAll();
      expect(Funky.History.keys().length).toBe(0);
    });
  });

  // =========================================================================
  // EVENTS
  // =========================================================================

  FunkyTests.describe('Events', function() {
    var eventData = null;
    var eventHandler = function(data) { eventData = data; };

    FunkyTests.beforeEach(function() {
      eventData = null;
    });

    FunkyTests.it('emits add event', function() {
      if (!Funky.PubSub) return; // Skip if PubSub not available
      
      Funky.PubSub.on('funky:history:add', eventHandler);
      history = Funky.History.create({ key: 'test_history', persist: false });
      history.add('test');
      
      expect(eventData !== null).toBe(true);
      expect(eventData.item).toBe('test');
      expect(eventData.key).toBe('test_history');
      
      Funky.PubSub.off('funky:history:add', eventHandler);
    });

    FunkyTests.it('emits remove event', function() {
      if (!Funky.PubSub) return;
      
      Funky.PubSub.on('funky:history:remove', eventHandler);
      history = Funky.History.create({ key: 'test_history', persist: false });
      history.add('test');
      history.remove('test');
      
      expect(eventData !== null).toBe(true);
      expect(eventData.item).toBe('test');
      
      Funky.PubSub.off('funky:history:remove', eventHandler);
    });

    FunkyTests.it('emits clear event', function() {
      if (!Funky.PubSub) return;
      
      Funky.PubSub.on('funky:history:clear', eventHandler);
      history = Funky.History.create({ key: 'test_history', persist: false });
      history.addAll(['a', 'b', 'c']);
      history.clear();
      
      expect(eventData !== null).toBe(true);
      expect(eventData.previousSize).toBe(3);
      
      Funky.PubSub.off('funky:history:clear', eventHandler);
    });

    FunkyTests.it('does not emit when emitEvents: false', function() {
      if (!Funky.PubSub) return;
      
      Funky.PubSub.on('funky:history:add', eventHandler);
      history = Funky.History.create({ key: 'test_history', persist: false, emitEvents: false });
      history.add('test');
      
      expect(eventData).toBe(null);
      
      Funky.PubSub.off('funky:history:add', eventHandler);
    });
  });

});

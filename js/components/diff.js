/**
 * Funky.Diff - Visual Diff Viewer Component
 * Compare text, JSON, or audit trail changes
 * @module Funky.Diff
 * @version 1.0.4
 */
(function(window) {
  'use strict';

  // Ensure Funky registry exists
  if (!window.Funky || !window.Funky.register) {
    console.error('[Funky.Diff] Registry not found. Load namespace.js first.');
    return;
  }

  var Funky = window.Funky;

  // Guard against double registration
  if (Funky.Diff) {
    return;
  }

  // ============================================================================
  // DIFF TYPES
  // ============================================================================

  var DiffType = {
    EQUAL: 'equal',
    ADD: 'add',
    REMOVE: 'remove',
    CHANGE: 'change'
  };

  // ============================================================================
  // DIFF ENGINE
  // ============================================================================

  var DiffEngine = {
    /**
     * Compute diff between two arrays of lines
     * Uses Longest Common Subsequence (LCS) algorithm
     * @param {string[]} left - Original lines
     * @param {string[]} right - New lines
     * @returns {Array} Diff operations with line numbers
     */
    diff: function(left, right) {
      var m = left.length;
      var n = right.length;

      // Build LCS DP table
      var dp = [];
      for (var i = 0; i <= m; i++) {
        dp[i] = [];
        for (var j = 0; j <= n; j++) {
          if (i === 0 || j === 0) {
            dp[i][j] = 0;
          } else if (left[i - 1] === right[j - 1]) {
            dp[i][j] = dp[i - 1][j - 1] + 1;
          } else {
            dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
          }
        }
      }

      // Backtrack to produce diff
      return this._backtrack(dp, left, right, m, n);
    },

    /**
     * Backtrack through LCS matrix to produce diff operations
     * @private
     */
    _backtrack: function(dp, left, right, i, j) {
      var result = [];
      var leftLine = i;
      var rightLine = j;

      while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && left[i - 1] === right[j - 1]) {
          // Equal - both have same line
          result.unshift({
            type: DiffType.EQUAL,
            left: left[i - 1],
            right: right[j - 1],
            leftLine: i,
            rightLine: j
          });
          i--;
          j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
          // Add - line exists in right but not left
          result.unshift({
            type: DiffType.ADD,
            left: null,
            right: right[j - 1],
            leftLine: null,
            rightLine: j
          });
          j--;
        } else {
          // Remove - line exists in left but not right
          result.unshift({
            type: DiffType.REMOVE,
            left: left[i - 1],
            right: null,
            leftLine: i,
            rightLine: null
          });
          i--;
        }
      }

      // Post-process to detect changes (adjacent remove + add of similar lines)
      return this._detectChanges(result);
    },

    /**
     * Detect change operations (remove followed by add)
     * @private
     */
    _detectChanges: function(diff) {
      var result = [];
      var i = 0;

      while (i < diff.length) {
        var current = diff[i];

        // Look for remove followed by add pattern
        if (current.type === DiffType.REMOVE && i + 1 < diff.length) {
          var next = diff[i + 1];
          if (next.type === DiffType.ADD) {
            // Mark as change and compute word diff
            result.push({
              type: DiffType.CHANGE,
              left: current.left,
              right: next.right,
              leftLine: current.leftLine,
              rightLine: next.rightLine,
              words: this.diffWords(current.left, next.right)
            });
            i += 2;
            continue;
          }
        }

        result.push(current);
        i++;
      }

      return result;
    },

    /**
     * Compute word-level diff within a line
     * @param {string} leftLine - Original line
     * @param {string} rightLine - New line
     * @returns {Array} Word-level diff operations
     */
    diffWords: function(leftLine, rightLine) {
      if (!leftLine || !rightLine) {
        return [];
      }

      // Split by word boundaries, preserving whitespace
      var leftWords = leftLine.split(/(\s+)/);
      var rightWords = rightLine.split(/(\s+)/);

      var m = leftWords.length;
      var n = rightWords.length;

      // Build LCS DP table for words
      var dp = [];
      for (var i = 0; i <= m; i++) {
        dp[i] = [];
        for (var j = 0; j <= n; j++) {
          if (i === 0 || j === 0) {
            dp[i][j] = 0;
          } else if (leftWords[i - 1] === rightWords[j - 1]) {
            dp[i][j] = dp[i - 1][j - 1] + 1;
          } else {
            dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
          }
        }
      }

      // Backtrack for word diff
      return this._backtrackWords(dp, leftWords, rightWords, m, n);
    },

    /**
     * Backtrack for word-level diff
     * @private
     */
    _backtrackWords: function(dp, left, right, i, j) {
      var result = [];

      while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && left[i - 1] === right[j - 1]) {
          result.unshift({
            type: DiffType.EQUAL,
            value: left[i - 1]
          });
          i--;
          j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
          result.unshift({
            type: DiffType.ADD,
            value: right[j - 1]
          });
          j--;
        } else {
          result.unshift({
            type: DiffType.REMOVE,
            value: left[i - 1]
          });
          i--;
        }
      }

      return result;
    },

    /**
     * Compute JSON diff (recursive object comparison)
     * @param {*} left - Original value
     * @param {*} right - New value
     * @param {string} path - Current path (for nested objects)
     * @returns {Array} JSON diff operations
     */
    diffJson: function(left, right, path) {
      path = path || '';
      var result = [];
      var self = this;

      // Handle null/undefined
      if (left === null || left === undefined) {
        if (right === null || right === undefined) {
          return [{ path: path, type: DiffType.EQUAL, left: left, right: right }];
        }
        return [{ path: path, type: DiffType.ADD, left: left, right: right }];
      }

      if (right === null || right === undefined) {
        return [{ path: path, type: DiffType.REMOVE, left: left, right: right }];
      }

      // Type mismatch
      if (typeof left !== typeof right) {
        return [{ path: path, type: DiffType.CHANGE, left: left, right: right }];
      }

      // Primitives
      if (typeof left !== 'object') {
        if (left === right) {
          return [{ path: path, type: DiffType.EQUAL, left: left, right: right }];
        }
        return [{ path: path, type: DiffType.CHANGE, left: left, right: right }];
      }

      // Arrays
      if (Array.isArray(left) && Array.isArray(right)) {
        return this._diffArrays(left, right, path);
      }

      // Handle array vs object mismatch
      if (Array.isArray(left) !== Array.isArray(right)) {
        return [{ path: path, type: DiffType.CHANGE, left: left, right: right }];
      }

      // Objects - compare all keys
      var leftKeys = Object.keys(left);
      var rightKeys = Object.keys(right);
      var allKeys = new Set(leftKeys.concat(rightKeys));

      allKeys.forEach(function(key) {
        var childPath = path ? path + '.' + key : key;
        var hasLeft = key in left;
        var hasRight = key in right;

        if (!hasLeft) {
          result.push({ path: childPath, type: DiffType.ADD, left: undefined, right: right[key] });
        } else if (!hasRight) {
          result.push({ path: childPath, type: DiffType.REMOVE, left: left[key], right: undefined });
        } else {
          result = result.concat(self.diffJson(left[key], right[key], childPath));
        }
      });

      return result;
    },

    /**
     * Diff arrays by index
     * @private
     */
    _diffArrays: function(left, right, path) {
      var result = [];
      var maxLen = Math.max(left.length, right.length);
      var self = this;

      for (var i = 0; i < maxLen; i++) {
        var childPath = path ? path + '[' + i + ']' : '[' + i + ']';
        var hasLeft = i < left.length;
        var hasRight = i < right.length;

        if (!hasLeft) {
          result.push({ path: childPath, type: DiffType.ADD, left: undefined, right: right[i] });
        } else if (!hasRight) {
          result.push({ path: childPath, type: DiffType.REMOVE, left: left[i], right: undefined });
        } else {
          result = result.concat(self.diffJson(left[i], right[i], childPath));
        }
      }

      return result;
    },

    /**
     * Get summary of diff changes
     * @param {Array} diff - Diff result
     * @returns {Object} Summary counts
     */
    getSummary: function(diff) {
      var summary = {
        added: 0,
        removed: 0,
        changed: 0,
        equal: 0,
        total: diff.length
      };

      diff.forEach(function(item) {
        switch (item.type) {
          case DiffType.ADD:
            summary.added++;
            break;
          case DiffType.REMOVE:
            summary.removed++;
            break;
          case DiffType.CHANGE:
            summary.changed++;
            break;
          case DiffType.EQUAL:
            summary.equal++;
            break;
        }
      });

      return summary;
    }
  };

  // ============================================================================
  // DIFF MODULE
  // ============================================================================

  // Module-level reference to Funky.Dom for rendering
  var D = Funky.Dom;

  var Diff = {
    /**
     * Diff type constants
     */
    DiffType: DiffType,

    /**
     * Diff engine (exposed for advanced usage)
     */
    Engine: DiffEngine,

    /**
     * Default options for text diff
     */
    defaults: {
      mode: 'side-by-side',
      lineNumbers: true,
      wordDiff: true,
      collapseUnchanged: 0,
      headers: {
        left: 'Original',
        right: 'Modified'
      }
    },

    /**
     * Default options for JSON diff
     */
    jsonDefaults: {
      collapsible: true,
      expandDepth: 2,
      highlightChanges: true,
      showUnchanged: true,
      keyOrder: 'original',
      headers: {
        left: 'Before',
        right: 'After'
      }
    },

    /**
     * Default options for audit diff
     */
    auditDefaults: {
      hideUnchanged: false,
      labels: {},
      showMeta: true,
      headers: {
        left: 'Before',
        right: 'After'
      }
    },

    /**
     * Compute text diff (returns raw diff, no rendering)
     * @param {string} left - Original text
     * @param {string} right - Modified text
     * @returns {Array} Diff operations
     */
    compute: function(left, right) {
      var leftLines = (left || '').split('\n');
      var rightLines = (right || '').split('\n');
      return DiffEngine.diff(leftLines, rightLines);
    },

    /**
     * Compute JSON diff (returns raw diff, no rendering)
     * @param {*} left - Original value
     * @param {*} right - Modified value
     * @returns {Array} JSON diff operations
     */
    computeJson: function(left, right) {
      return DiffEngine.diffJson(left, right);
    },

    /**
     * Get summary of changes
     * @param {Array} diff - Diff result
     * @returns {Object} Summary
     */
    getSummary: function(diff) {
      return DiffEngine.getSummary(diff);
    },

    // =========================================================================
    // TEXT DIFF UI
    // =========================================================================

    /** Instance registry for LiveBinding */
    _instances: {},

    /**
     * Show text diff in container
     * @param {string|HTMLElement} container - Target container
     * @param {Object} options - Diff options
     * @returns {Object} Diff instance
     */
    show: function(container, options) {
      var el = typeof container === 'string'
        ? document.querySelector(container)
        : container;

      if (!el) {
        console.warn('[Diff] Container not found:', container);
        return null;
      }

      options = Object.assign({}, this.defaults, options);

      // Compute diff
      var leftLines = (options.left || '').split('\n');
      var rightLines = (options.right || '').split('\n');
      var diffResult = DiffEngine.diff(leftLines, rightLines);

      // Collapse unchanged regions if requested
      if (options.collapseUnchanged > 0) {
        diffResult = this._collapseUnchanged(diffResult, options.collapseUnchanged);
      }

      // Render based on mode
      var rendered;
      switch (options.mode) {
        case 'inline':
          rendered = this._renderInline(diffResult, options);
          break;
        case 'split':
          rendered = this._renderSplit(diffResult, options);
          break;
        default:
          rendered = this._renderSideBySide(diffResult, options);
      }

      D.wrap(el).empty();
      rendered.appendTo(el);

      // Set up collapse toggles
      this._setupCollapseToggles(el);

      // Set up line click handlers
      if (typeof options.onLineClick === 'function') {
        this._setupLineClick(el, options.onLineClick);
      }

      // Create instance
      var instance = {
        element: el,
        diff: diffResult,
        options: options,
        summary: DiffEngine.getSummary(diffResult),
        _scrollTrackers: [],  // Funky.ScrollTracker instances for sync scroll

        // Bindable Interface for LiveBinding
        setData: function(data) {
          if (data && typeof data === 'object') {
            var newOpts = Object.assign({}, options, data);
            Diff.show(el, newOpts);
          }
        },

        getData: function() {
          return {
            left: options.left,
            right: options.right,
            diff: diffResult,
            summary: this.summary
          };
        },

        refresh: function() {
          Diff.show(el, options);
        },

        destroy: function() {
          // Cleanup scroll trackers
          if (this._scrollTrackers) {
            for (var i = 0; i < this._scrollTrackers.length; i++) {
              this._scrollTrackers[i].destroy();
            }
            this._scrollTrackers = [];
          }
          
          el.replaceChildren();
          if (el.id && Diff._instances[el.id]) {
            delete Diff._instances[el.id];
          }
        }
      };

      // Set up sync scrolling for split mode (after instance creation for cleanup tracking)
      if (options.mode === 'split') {
        this._setupSyncScroll(el, instance);
      }

      // Register instance
      if (el.id) {
        this._instances[el.id] = instance;
      }

      return instance;
    },

    /**
     * Collapse consecutive unchanged lines
     * @private
     */
    _collapseUnchanged: function(diff, threshold) {
      var result = [];
      var unchangedBuffer = [];

      for (var i = 0; i < diff.length; i++) {
        var item = diff[i];

        if (item.type === DiffType.EQUAL) {
          unchangedBuffer.push(item);
        } else {
          // Flush buffer
          if (unchangedBuffer.length > threshold) {
            // Keep first and last few lines, collapse middle
            var keep = Math.floor(threshold / 2);
            for (var j = 0; j < keep; j++) {
              result.push(unchangedBuffer[j]);
            }
            var collapsedItems = unchangedBuffer.slice(keep, -keep);
            result.push({
              type: 'collapse',
              count: collapsedItems.length,
              items: collapsedItems
            });
            for (var k = unchangedBuffer.length - keep; k < unchangedBuffer.length; k++) {
              result.push(unchangedBuffer[k]);
            }
          } else {
            result = result.concat(unchangedBuffer);
          }
          unchangedBuffer = [];
          result.push(item);
        }
      }

      // Flush remaining
      if (unchangedBuffer.length > threshold) {
        var keep2 = Math.floor(threshold / 2);
        for (var m = 0; m < keep2; m++) {
          result.push(unchangedBuffer[m]);
        }
        var collapsedItems2 = unchangedBuffer.slice(keep2, -keep2);
        result.push({
          type: 'collapse',
          count: collapsedItems2.length,
          items: collapsedItems2
        });
        for (var n = unchangedBuffer.length - keep2; n < unchangedBuffer.length; n++) {
          result.push(unchangedBuffer[n]);
        }
      } else {
        result = result.concat(unchangedBuffer);
      }

      return result;
    },

    /**
     * Render side-by-side diff
     * @private
     * @returns {Funky.Dom}
     */
    _renderSideBySide: function(diff, options) {
      var self = this;
      var leftPanel = D.div().classAdd('diff-panel', 'diff-panel-left');
      var rightPanel = D.div().classAdd('diff-panel', 'diff-panel-right');

      diff.forEach(function(item) {
        if (item.type === 'collapse') {
          // Create collapse for left side
          var leftCollapseContent = D.div().classAdd('diff-collapse-content').style('display', 'none');
          var rightCollapseContent = D.div().classAdd('diff-collapse-content').style('display', 'none');

          item.items.forEach(function(i) {
            // Left side collapse line
            var leftLine = D.div().classAdd('diff-line', 'diff-equal');
            if (options.lineNumbers) {
              leftLine.child(D.span().classAdd('diff-line-number').text(i.leftLine || ''));
            }
            leftLine.child(D.span().classAdd('diff-line-content').text(i.left || ''));
            leftCollapseContent.child(leftLine);

            // Right side collapse line
            var rightLine = D.div().classAdd('diff-line', 'diff-equal');
            if (options.lineNumbers) {
              rightLine.child(D.span().classAdd('diff-line-number').text(i.rightLine || ''));
            }
            rightLine.child(D.span().classAdd('diff-line-content').text(i.right || ''));
            rightCollapseContent.child(rightLine);
          });

          // Helper to create collapse button (need two separate instances)
          var createCollapseBtn = function() {
            return D.button()
              .classAdd('diff-collapse-btn')
              .aria('expanded', 'false')
              .aria('label', 'Show ' + item.count + ' unchanged lines')
              .child(
                D.icon('fas fa-ellipsis-h'),
                D.text(' ' + item.count + ' unchanged lines')
              );
          };

          leftPanel.child(
            D.div().classAdd('diff-collapse').data('count', item.count).child(
              createCollapseBtn(),
              leftCollapseContent
            )
          );
          rightPanel.child(
            D.div().classAdd('diff-collapse').data('count', item.count).child(
              createCollapseBtn(),
              rightCollapseContent
            )
          );
          return;
        }

        switch (item.type) {
          case DiffType.EQUAL:
            leftPanel.child(self._renderLine(item.left, item.leftLine, 'diff-equal', options));
            rightPanel.child(self._renderLine(item.right, item.rightLine, 'diff-equal', options));
            break;
          case DiffType.ADD:
            leftPanel.child(self._renderLine('', null, 'diff-empty', options));
            rightPanel.child(self._renderLine(item.right, item.rightLine, 'diff-add', options));
            break;
          case DiffType.REMOVE:
            leftPanel.child(self._renderLine(item.left, item.leftLine, 'diff-remove', options));
            rightPanel.child(self._renderLine('', null, 'diff-empty', options));
            break;
          case DiffType.CHANGE:
            var words = options.wordDiff !== false ? item.words : null;
            leftPanel.child(self._renderLine(item.left, item.leftLine, 'diff-remove', options, words, 'left'));
            rightPanel.child(self._renderLine(item.right, item.rightLine, 'diff-add', options, words, 'right'));
            break;
        }
      });

      return D.div().classAdd('funky-diff', 'funky-diff-side-by-side').child(
        D.div().classAdd('diff-header').child(
          D.div().classAdd('diff-header-left').text(options.headers.left),
          D.div().classAdd('diff-header-right').text(options.headers.right)
        ),
        D.div().classAdd('diff-content').child(leftPanel, rightPanel)
      );
    },

    /**
     * Render inline (unified) diff
     * @private
     * @returns {Funky.Dom}
     */
    _renderInline: function(diff, options) {
      var self = this;
      var content = D.div().classAdd('diff-content');

      diff.forEach(function(item) {
        if (item.type === 'collapse') {
          var collapseContent = D.div().classAdd('diff-collapse-content').style('display', 'none');
          item.items.forEach(function(i) {
            collapseContent.child(self._renderInlineLine(i.left, i.leftLine, i.rightLine, ' ', 'diff-equal', options));
          });

          content.child(
            D.div().classAdd('diff-collapse').data('count', item.count).child(
              D.button()
                .classAdd('diff-collapse-btn')
                .aria('expanded', 'false')
                .aria('label', 'Show ' + item.count + ' unchanged lines')
                .child(
                  D.icon('fas fa-ellipsis-h'),
                  D.text(' ' + item.count + ' unchanged lines')
                ),
              collapseContent
            )
          );
          return;
        }

        switch (item.type) {
          case DiffType.EQUAL:
            content.child(self._renderInlineLine(item.left, item.leftLine, item.rightLine, ' ', 'diff-equal', options));
            break;
          case DiffType.ADD:
            content.child(self._renderInlineLine(item.right, null, item.rightLine, '+', 'diff-add', options));
            break;
          case DiffType.REMOVE:
            content.child(self._renderInlineLine(item.left, item.leftLine, null, '-', 'diff-remove', options));
            break;
          case DiffType.CHANGE:
            var inlineWords = options.wordDiff !== false ? item.words : null;
            content.child(self._renderInlineLine(item.left, item.leftLine, null, '-', 'diff-remove', options, inlineWords, 'left'));
            content.child(self._renderInlineLine(item.right, null, item.rightLine, '+', 'diff-add', options, inlineWords, 'right'));
            break;
        }
      });

      return D.div().classAdd('funky-diff', 'funky-diff-inline').child(
        D.div().classAdd('diff-header').child(
          D.span().text(options.headers.left + ' → ' + options.headers.right)
        ),
        content
      );
    },

    /**
     * Render split diff with sync scrolling
     * @private
     * @returns {Funky.Dom}
     */
    _renderSplit: function(diff, options) {
      // Same as side-by-side but with sync scroll class
      var el = this._renderSideBySide(diff, options);
      el.classRemove('funky-diff-side-by-side').classAdd('funky-diff-split');
      return el;
    },

    /**
     * Render a single line
     * @private
     * @returns {Funky.Dom}
     */
    _renderLine: function(content, lineNum, className, options, words, side) {
      var line = D.div().classAdd('diff-line', className).data('line', lineNum || '');

      if (options.lineNumbers) {
        line.child(D.span().classAdd('diff-line-number').aria('hidden', 'true').text(lineNum || ''));
      }

      var contentEl = D.span().classAdd('diff-line-content');

      // Add screen reader prefix for change type
      if (className.indexOf('diff-add') !== -1) {
        contentEl.child(D.srOnly('Added: '));
      } else if (className.indexOf('diff-remove') !== -1) {
        contentEl.child(D.srOnly('Removed: '));
      }

      if (words && words.length > 0) {
        contentEl.html(this._renderWordDiff(words, side));
      } else {
        contentEl.child(D.text(content || ''));
      }

      line.child(contentEl);
      return line;
    },

    /**
     * Render inline line with marker
     * @private
     * @returns {Funky.Dom}
     */
    _renderInlineLine: function(content, leftLine, rightLine, marker, className, options, words, side) {
      var line = D.div().classAdd('diff-line', className);

      line.child(D.span().classAdd('diff-line-marker').aria('hidden', 'true').text(marker));

      if (options.lineNumbers) {
        line.child(D.span().classAdd('diff-line-number-left').aria('hidden', 'true').text(leftLine || ''));
        line.child(D.span().classAdd('diff-line-number-right').aria('hidden', 'true').text(rightLine || ''));
      }

      var contentEl = D.span().classAdd('diff-line-content');

      // Add screen reader prefix for change type
      if (marker === '+') {
        contentEl.child(D.srOnly('Added: '));
      } else if (marker === '-') {
        contentEl.child(D.srOnly('Removed: '));
      }

      if (words && words.length > 0) {
        contentEl.html(this._renderWordDiff(words, side));
      } else {
        contentEl.child(D.text(content || ''));
      }

      line.child(contentEl);
      return line;
    },

    /**
     * Render word-level diff
     * @private
     */
    _renderWordDiff: function(words, side) {
      var self = this;
      return words.map(function(w) {
        if (w.type === DiffType.EQUAL) {
          return self._escape(w.value);
        } else if (w.type === DiffType.ADD && side === 'right') {
          return '<span class="diff-word-add">' + self._escape(w.value) + '</span>';
        } else if (w.type === DiffType.REMOVE && side === 'left') {
          return '<span class="diff-word-remove">' + self._escape(w.value) + '</span>';
        }
        return '';
      }).join('');
    },

    /**
     * Set up sync scrolling for split mode using Funky.ScrollTracker
     * @param {Element} container - The diff container
     * @param {Object} instance - The diff instance for cleanup tracking
     * @private
     */
    _setupSyncScroll: function(container, instance) {
      var leftPanel = container.querySelector('.diff-panel-left');
      var rightPanel = container.querySelector('.diff-panel-right');

      if (!leftPanel || !rightPanel) return;

      var syncing = false;

      // Left panel tracker
      var leftTracker = Funky.ScrollTracker.create({
        target: leftPanel,
        namespace: 'diff-left',
        trackHorizontal: true,
        
        onScroll: function(data) {
          if (!syncing) {
            syncing = true;
            rightPanel.scrollTop = data.scrollY;
            rightPanel.scrollLeft = data.scrollX;
            setTimeout(function() { syncing = false; }, 0);
          }
        }
      });

      // Right panel tracker
      var rightTracker = Funky.ScrollTracker.create({
        target: rightPanel,
        namespace: 'diff-right',
        trackHorizontal: true,
        
        onScroll: function(data) {
          if (!syncing) {
            syncing = true;
            leftPanel.scrollTop = data.scrollY;
            leftPanel.scrollLeft = data.scrollX;
            setTimeout(function() { syncing = false; }, 0);
          }
        }
      });

      // Store for cleanup
      if (instance) {
        instance._scrollTrackers = [leftTracker, rightTracker];
      }
    },

    /**
     * Set up collapse toggle buttons
     * @private
     */
    _setupCollapseToggles: function(container) {
      var D = Funky.Dom;
      container.querySelectorAll('.diff-collapse-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var collapse = btn.closest('.diff-collapse');
          var content = collapse.querySelector('.diff-collapse-content');
          var isHidden = content.style.display === 'none' || getComputedStyle(content).display === 'none';

          content.style.display = isHidden ? 'block' : 'none';
          btn.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
          var newLabel = isHidden
            ? 'Hide ' + collapse.dataset.count + ' unchanged lines'
            : 'Show ' + collapse.dataset.count + ' unchanged lines';
          btn.setAttribute('aria-label', newLabel);
          btn.replaceChildren(
            D.icon(isHidden ? 'chevron-up' : 'ellipsis-h').aria('hidden', 'true').get(),
            document.createTextNode(' ' + (isHidden ? 'Hide ' : '') + collapse.dataset.count + (isHidden ? ' lines' : ' unchanged lines'))
          );
        });
      });
    },

    /**
     * Set up line click handlers
     * @private
     */
    _setupLineClick: function(container, callback) {
      container.querySelectorAll('.diff-line[data-line]').forEach(function(line) {
        line.style.cursor = 'pointer';
        line.addEventListener('click', function() {
          var lineNum = parseInt(line.dataset.line, 10);
          var side = line.closest('.diff-panel-left') ? 'left' : 'right';
          callback(side, lineNum, line);
        });
      });
    },

    /**
     * HTML escape
     * @private
     */
    _escape: function(str) {
      if (!str) return '';
      var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;'
      };
      return String(str).replace(/[&<>"']/g, function(m) { return map[m]; });
    },

    // =========================================================================
    // JSON DIFF UI
    // =========================================================================

    /**
     * Show JSON diff in container
     * @param {string|HTMLElement} container - Target container
     * @param {Object} options - Diff options
     * @returns {Object} Instance with controls
     */
    json: function(container, options) {
      var self = this;
      var el = typeof container === 'string'
        ? document.querySelector(container)
        : container;

      if (!el) {
        console.error('[Funky.Diff] Container not found');
        return null;
      }

      options = Object.assign({}, this.jsonDefaults, options);

      // Compute JSON diff
      var diffResult = DiffEngine.diffJson(options.left, options.right);

      // Filter unchanged if needed
      if (!options.showUnchanged) {
        diffResult = diffResult.filter(function(d) {
          return d.type !== DiffType.EQUAL;
        });
      }

      // Sort by key order
      diffResult = this._sortJsonDiff(diffResult, options.keyOrder);

      // Build tree structure
      var tree = this._buildJsonTree(diffResult);

      // Get summary
      var summary = DiffEngine.getSummary(diffResult);

      // Render
      var container = D.div().classAdd('funky-diff', 'funky-diff-json').child(
        this._renderJsonHeader(options),
        this._renderJsonSummary(summary),
        D.div().classAdd('diff-content').child(this._renderJsonTree(tree, options, 0))
      );
      D.wrap(el).empty();
      container.appendTo(el);

      // Set up toggle handlers
      if (options.collapsible) {
        this._setupJsonToggles(el, options.expandDepth);
      }

      // Create instance with Bindable Interface
      var instance = {
        element: el,
        diff: diffResult,
        tree: tree,
        options: options,
        summary: summary,

        // Bindable Interface for LiveBinding
        setData: function(newData) {
          if (newData.left !== undefined) options.left = newData.left;
          if (newData.right !== undefined) options.right = newData.right;
          Object.assign(options, newData);
          return self.json(el, options);
        },

        getData: function() {
          return {
            left: options.left,
            right: options.right,
            diff: diffResult,
            summary: summary
          };
        },

        expand: function(path) {
          self._expandJsonPath(el, path);
        },

        collapse: function(path) {
          self._collapseJsonPath(el, path);
        },

        expandAll: function() {
          el.querySelectorAll('.diff-json-toggle[aria-expanded="false"]').forEach(function(btn) {
            btn.click();
          });
        },

        collapseAll: function() {
          el.querySelectorAll('.diff-json-toggle[aria-expanded="true"]').forEach(function(btn) {
            btn.click();
          });
        },

        destroy: function() {
          var containerId = el.id || el.dataset.diffId;
          if (containerId) {
            delete self._instances[containerId];
          }
          el.replaceChildren();
        }
      };

      // Register for LiveBinding discovery
      var containerId = el.id || 'json-diff-' + Date.now();
      if (!el.id) {
        el.dataset.diffId = containerId;
      }
      this._instances[containerId] = instance;

      return instance;
    },

    /**
     * Sort JSON diff by key order
     * @private
     */
    _sortJsonDiff: function(diff, keyOrder) {
      if (keyOrder === 'original' || !keyOrder) {
        return diff;
      }

      if (keyOrder === 'alphabetical') {
        return diff.slice().sort(function(a, b) {
          var keyA = (a.path || []).join('.');
          var keyB = (b.path || []).join('.');
          return keyA.localeCompare(keyB);
        });
      }

      // Custom array order
      if (Array.isArray(keyOrder)) {
        return diff.slice().sort(function(a, b) {
          var keyA = a.path ? a.path[0] : '';
          var keyB = b.path ? b.path[0] : '';
          var indexA = keyOrder.indexOf(keyA);
          var indexB = keyOrder.indexOf(keyB);
          if (indexA === -1) indexA = keyOrder.length;
          if (indexB === -1) indexB = keyOrder.length;
          return indexA - indexB;
        });
      }

      return diff;
    },

    /**
     * Build tree structure from flat diff result
     * @private
     */
    _buildJsonTree: function(diff) {
      var tree = { children: {}, items: [] };

      diff.forEach(function(item) {
        // Handle path as either string or array
        var pathArray = Array.isArray(item.path) ? item.path :
                        (item.path ? item.path.split('.') : []);

        if (pathArray.length === 0) {
          tree.items.push(item);
          return;
        }

        var current = tree;
        for (var i = 0; i < pathArray.length - 1; i++) {
          var key = pathArray[i];
          if (!current.children[key]) {
            current.children[key] = {
              children: {},
              items: [],
              isArray: typeof pathArray[i + 1] === 'number' || /^\d+$/.test(pathArray[i + 1])
            };
          }
          current = current.children[key];
        }

        current.items.push(item);
      });

      return tree;
    },

    /**
     * Render JSON diff header
     * @private
     * @returns {Funky.Dom}
     */
    _renderJsonHeader: function(options) {
      return D.div().classAdd('diff-header').child(
        D.div().classAdd('diff-header-left').text(options.headers.left),
        D.div().classAdd('diff-header-right').text(options.headers.right)
      );
    },

    /**
     * Render summary row
     * @private
     * @returns {Funky.Dom}
     */
    _renderJsonSummary: function(summary) {
      var container = D.div().classAdd('diff-json-summary');

      if (summary.added > 0) {
        container.child(
          D.span().classAdd('diff-json-summary-add').child(
            D.icon('fas fa-plus'),
            D.text(' ' + summary.added + ' added')
          )
        );
      }
      if (summary.removed > 0) {
        container.child(
          D.span().classAdd('diff-json-summary-remove').child(
            D.icon('fas fa-minus'),
            D.text(' ' + summary.removed + ' removed')
          )
        );
      }
      if (summary.changed > 0) {
        container.child(
          D.span().classAdd('diff-json-summary-change').child(
            D.icon('fas fa-pen'),
            D.text(' ' + summary.changed + ' changed')
          )
        );
      }

      if (summary.added === 0 && summary.removed === 0 && summary.changed === 0) {
        container.child(
          D.span().classAdd('diff-json-summary-equal').child(
            D.icon('fas fa-check'),
            D.text(' No changes')
          )
        );
      }

      return container;
    },

    /**
     * Render JSON tree recursively
     * @private
     * @returns {Funky.Dom}
     */
    _renderJsonTree: function(node, options, depth) {
      var self = this;
      var elements = [];

      // Render direct items
      node.items.forEach(function(item) {
        elements.push(self._renderJsonRow(item, options, depth));
      });

      // Render nested children
      var childKeys = Object.keys(node.children);
      childKeys.forEach(function(key) {
        var child = node.children[key];
        var isArray = child.isArray;
        var hasChanges = self._hasChanges(child);

        var row = D.div()
          .classAdd('diff-json-row', 'diff-json-' + (isArray ? 'array' : 'object'))
          .data('depth', depth);

        if (options.collapsible) {
          var expanded = depth < options.expandDepth;
          row.child(
            D.button()
              .classAdd('diff-json-toggle')
              .aria('expanded', expanded ? 'true' : 'false')
              .aria('label', (expanded ? 'Collapse' : 'Expand') + ' ' + key)
              .child(D.icon('fas fa-chevron-' + (expanded ? 'down' : 'right')))
          );
        }

        row.child(D.div().classAdd('diff-json-key').text(key));
        row.child(D.div().classAdd('diff-json-type').text(isArray ? '[ ]' : '{ }'));

        if (hasChanges) {
          row.child(
            D.span().classAdd('diff-json-changed-badge').child(
              D.icon('fas fa-circle'),
              D.srOnly('has changes')
            )
          );
        }

        var nested = D.div().classAdd('diff-json-nested');
        if (options.collapsible && depth >= options.expandDepth) {
          nested.style('display', 'none');
        }
        nested.child(self._renderJsonTree(child, options, depth + 1));

        row.child(nested);
        elements.push(row);
      });

      return D.fragment.apply(null, elements);
    },

    /**
     * Check if a tree node has any changes
     * @private
     */
    _hasChanges: function(node) {
      var hasChange = node.items.some(function(item) {
        return item.type !== DiffType.EQUAL;
      });

      if (hasChange) return true;

      var childKeys = Object.keys(node.children);
      for (var i = 0; i < childKeys.length; i++) {
        if (this._hasChanges(node.children[childKeys[i]])) {
          return true;
        }
      }

      return false;
    },

    /**
     * Render a single JSON diff row
     * @private
     * @returns {Funky.Dom}
     */
    _renderJsonRow: function(item, options, depth) {
      // Handle path as either string or array
      var pathArray = Array.isArray(item.path) ? item.path :
                      (item.path ? item.path.split('.') : []);
      var key = pathArray.length > 0 ? pathArray[pathArray.length - 1] : '';
      var isArrayIndex = typeof key === 'number' || /^\d+$/.test(key);
      var displayKey = isArrayIndex ? '[' + key + ']' : key;

      var row = D.div()
        .classAdd('diff-json-row', 'diff-' + item.type)
        .data('depth', depth)
        .data('path', pathArray.join('.'));

      // Key column
      row.child(D.div().classAdd('diff-json-key').text(displayKey));

      // Left value
      var leftVal = D.div().classAdd('diff-json-value', 'diff-json-left');
      if (item.type === DiffType.REMOVE || item.type === DiffType.CHANGE) {
        leftVal.classAdd('diff-remove');
      } else if (item.type === DiffType.ADD) {
        leftVal.classAdd('diff-empty');
      }
      if (item.type === DiffType.ADD) {
        leftVal.text('—');
      } else {
        leftVal.html(this._formatJsonValue(item.left, options));
      }
      row.child(leftVal);

      // Arrow
      row.child(D.div().classAdd('diff-json-arrow').text('→'));

      // Right value
      var rightVal = D.div().classAdd('diff-json-value', 'diff-json-right');
      if (item.type === DiffType.ADD || item.type === DiffType.CHANGE) {
        rightVal.classAdd('diff-add');
      } else if (item.type === DiffType.REMOVE) {
        rightVal.classAdd('diff-empty');
      }
      if (item.type === DiffType.REMOVE) {
        rightVal.text('—');
      } else {
        rightVal.html(this._formatJsonValue(item.right, options));
      }
      row.child(rightVal);

      return row;
    },

    /**
     * Format a JSON value with type-aware styling
     * @private
     */
    _formatJsonValue: function(value, options) {
      if (value === null) {
        return '<span class="diff-json-null">null</span>';
      }
      if (value === undefined) {
        return '<span class="diff-json-undefined">undefined</span>';
      }

      var type = typeof value;

      // Check for custom formatters
      if (options.formatters) {
        for (var formatterKey in options.formatters) {
          if (options.formatters.hasOwnProperty(formatterKey)) {
            // Check if value matches formatter pattern
            if (formatterKey === 'date' && this._isDateString(value)) {
              return '<span class="diff-json-date">' +
                this._escape(options.formatters[formatterKey](value)) + '</span>';
            }
          }
        }
      }

      switch (type) {
        case 'string':
          return '<span class="diff-json-string">"' + this._escape(value) + '"</span>';
        case 'number':
          return '<span class="diff-json-number">' + value + '</span>';
        case 'boolean':
          return '<span class="diff-json-boolean">' + value + '</span>';
        case 'object':
          if (Array.isArray(value)) {
            return '<span class="diff-json-array">[' + value.length + ' items]</span>';
          }
          return '<span class="diff-json-object">{...}</span>';
        default:
          return '<span class="diff-json-unknown">' + this._escape(String(value)) + '</span>';
      }
    },

    /**
     * Check if value looks like a date string
     * @private
     */
    _isDateString: function(value) {
      if (typeof value !== 'string') return false;
      // Check for ISO date format
      return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(value);
    },

    /**
     * Set up JSON toggle buttons
     * @private
     */
    _setupJsonToggles: function(container, expandDepth) {
      var D = Funky.Dom;
      container.querySelectorAll('.diff-json-toggle').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var row = btn.closest('.diff-json-row');
          var nested = row.querySelector('.diff-json-nested');
          var keyEl = row.querySelector('.diff-json-key');
          var keyName = keyEl ? keyEl.textContent : 'section';
          var isExpanded = btn.getAttribute('aria-expanded') === 'true';

          btn.setAttribute('aria-expanded', !isExpanded);
          btn.setAttribute('aria-label', (!isExpanded ? 'Collapse' : 'Expand') + ' ' + keyName);
          btn.replaceChildren(D.icon('fas fa-chevron-' + (!isExpanded ? 'down' : 'right')).aria('hidden', 'true').get());
          nested.style.display = isExpanded ? 'none' : 'block';
        });
      });
    },

    /**
     * Expand a specific JSON path
     * @private
     */
    _expandJsonPath: function(container, path) {
      var pathStr = Array.isArray(path) ? path.join('.') : path;
      var row = container.querySelector('[data-path="' + pathStr + '"]');
      if (row) {
        var toggle = row.querySelector('.diff-json-toggle');
        if (toggle && toggle.getAttribute('aria-expanded') === 'false') {
          toggle.click();
        }
      }
    },

    /**
     * Collapse a specific JSON path
     * @private
     */
    _collapseJsonPath: function(container, path) {
      var pathStr = Array.isArray(path) ? path.join('.') : path;
      var row = container.querySelector('[data-path="' + pathStr + '"]');
      if (row) {
        var toggle = row.querySelector('.diff-json-toggle');
        if (toggle && toggle.getAttribute('aria-expanded') === 'true') {
          toggle.click();
        }
      }
    },

    // =========================================================================
    // AUDIT DIFF UI
    // =========================================================================

    /**
     * Action badge color mapping
     */
    ACTION_BADGES: {
      'CREATE': 'bg-success',
      'INSERT': 'bg-success',
      'UPDATE': 'bg-warning',
      'MODIFY': 'bg-warning',
      'DELETE': 'bg-danger',
      'REMOVE': 'bg-danger',
      'VIEW': 'bg-info',
      'READ': 'bg-info',
      'EXPORT': 'bg-secondary',
      'IMPORT': 'bg-primary'
    },

    /**
     * Built-in field renderers for common field types
     */
    FIELD_RENDERERS: {
      // Boolean fields
      _boolean: function(value) {
        if (value === true || value === 'true' || value === 1) {
          return '<span class="badge bg-success">Yes</span>';
        }
        if (value === false || value === 'false' || value === 0) {
          return '<span class="badge bg-secondary">No</span>';
        }
        return String(value);
      },

      // Status-like fields
      status: function(value) {
        var colors = {
          'active': 'success',
          'enabled': 'success',
          'approved': 'success',
          'inactive': 'secondary',
          'disabled': 'secondary',
          'pending': 'warning',
          'draft': 'warning',
          'error': 'danger',
          'rejected': 'danger',
          'failed': 'danger'
        };
        var color = colors[String(value).toLowerCase()] || 'secondary';
        return '<span class="badge bg-' + color + '">' + value + '</span>';
      }
    },

    /**
     * Show audit trail diff in container
     * @param {string|HTMLElement} container - Target container
     * @param {Object} options - Audit diff options
     * @returns {Object} Instance with controls
     */
    audit: function(container, options) {
      var self = this;
      var el = typeof container === 'string'
        ? document.querySelector(container)
        : container;

      if (!el) {
        console.error('[Funky.Diff] Container not found');
        return null;
      }

      options = Object.assign({}, this.auditDefaults, options);

      var before = options.before || {};
      var after = options.after || {};

      // Determine fields to show
      var fields = options.fields || this._getAllFields(before, after);

      // Compute changes
      var changes = fields.map(function(field) {
        var leftVal = before[field];
        var rightVal = after[field];
        var type = DiffType.EQUAL;

        if (leftVal === undefined && rightVal !== undefined) {
          type = DiffType.ADD;
        } else if (leftVal !== undefined && rightVal === undefined) {
          type = DiffType.REMOVE;
        } else if (JSON.stringify(leftVal) !== JSON.stringify(rightVal)) {
          type = DiffType.CHANGE;
        }

        return {
          field: field,
          label: (options.labels && options.labels[field]) || self._formatFieldLabel(field),
          left: leftVal,
          right: rightVal,
          type: type
        };
      });

      // Filter unchanged if requested
      if (options.hideUnchanged) {
        changes = changes.filter(function(c) { return c.type !== DiffType.EQUAL; });
      }

      // Get summary
      var summary = {
        added: changes.filter(function(c) { return c.type === DiffType.ADD; }).length,
        removed: changes.filter(function(c) { return c.type === DiffType.REMOVE; }).length,
        changed: changes.filter(function(c) { return c.type === DiffType.CHANGE; }).length,
        equal: changes.filter(function(c) { return c.type === DiffType.EQUAL; }).length
      };
      summary.total = summary.added + summary.removed + summary.changed;

      // Render
      D.wrap(el).empty();
      this._renderAuditDiff(changes, options, summary).appendTo(el);

      // Create instance with Bindable Interface
      var instance = {
        element: el,
        changes: changes,
        options: options,
        summary: summary,

        // Bindable Interface for LiveBinding
        setData: function(newData) {
          if (newData.before !== undefined) options.before = newData.before;
          if (newData.after !== undefined) options.after = newData.after;
          Object.assign(options, newData);
          return self.audit(el, options);
        },

        getData: function() {
          return {
            before: options.before,
            after: options.after,
            changes: changes,
            summary: summary
          };
        },

        destroy: function() {
          var containerId = el.id || el.dataset.diffId;
          if (containerId) {
            delete self._instances[containerId];
          }
          el.replaceChildren();
        }
      };

      // Register for LiveBinding discovery
      var containerId = el.id || 'audit-diff-' + Date.now();
      if (!el.id) {
        el.dataset.diffId = containerId;
      }
      this._instances[containerId] = instance;

      return instance;
    },

    /**
     * Get all fields from before and after objects
     * @private
     */
    _getAllFields: function(before, after) {
      var fieldsSet = {};
      Object.keys(before || {}).forEach(function(k) { fieldsSet[k] = true; });
      Object.keys(after || {}).forEach(function(k) { fieldsSet[k] = true; });
      return Object.keys(fieldsSet);
    },

    /**
     * Format field name as label (snake_case -> Title Case)
     * @private
     */
    _formatFieldLabel: function(field) {
      return field
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\b\w/g, function(c) { return c.toUpperCase(); });
    },

    /**
     * Render complete audit diff
     * @private
     * @returns {Funky.Dom}
     */
    _renderAuditDiff: function(changes, options, summary) {
      var container = D.div().classAdd('funky-diff', 'funky-diff-audit');

      // Metadata header
      if (options.showMeta && (options.action || options.user || options.timestamp)) {
        container.child(this._renderAuditHeader(options));
      }

      // Summary
      container.child(this._renderAuditSummary(summary));

      // Changes table
      container.child(this._renderAuditTable(changes, options));

      return container;
    },

    /**
     * Render audit metadata header
     * @private
     * @returns {Funky.Dom}
     */
    _renderAuditHeader: function(options) {
      var meta = D.div().classAdd('diff-audit-meta');

      // Action badge
      if (options.action) {
        var badgeClass = this.ACTION_BADGES[options.action.toUpperCase()] || 'bg-secondary';
        meta.child(
          D.span().classAdd('diff-audit-action', 'badge', badgeClass).text(options.action)
        );
      }

      // User
      if (options.user) {
        meta.child(
          D.span().classAdd('diff-audit-user').child(
            D.icon('fas fa-user'),
            D.text(' ' + options.user)
          )
        );
      }

      // Timestamp
      if (options.timestamp) {
        var formattedTime = this._formatTimestamp(options.timestamp);
        meta.child(
          D.span().classAdd('diff-audit-time').child(
            D.icon('fas fa-clock'),
            D.text(' ' + formattedTime)
          )
        );
      }

      return D.div().classAdd('diff-audit-header').child(meta);
    },

    /**
     * Render audit summary
     * @private
     * @returns {Funky.Dom}
     */
    _renderAuditSummary: function(summary) {
      var container = D.div().classAdd('diff-audit-summary');

      if (summary.total === 0) {
        container.child(
          D.span().classAdd('text-muted').child(
            D.icon('fas fa-check'),
            D.text(' No changes')
          )
        );
        return container;
      }

      if (summary.added > 0) {
        container.child(
          D.span().classAdd('text-success').child(
            D.icon('fas fa-plus'),
            D.text(' ' + summary.added + ' added')
          )
        );
      }
      if (summary.removed > 0) {
        container.child(
          D.span().classAdd('text-danger').child(
            D.icon('fas fa-minus'),
            D.text(' ' + summary.removed + ' removed')
          )
        );
      }
      if (summary.changed > 0) {
        container.child(
          D.span().classAdd('text-warning').child(
            D.icon('fas fa-pen'),
            D.text(' ' + summary.changed + ' changed')
          )
        );
      }

      return container;
    },

    /**
     * Render audit changes table
     * @private
     * @returns {Funky.Dom}
     */
    _renderAuditTable: function(changes, options) {
      var self = this;

      var thead = D.create('thead').child(
        D.tr().child(
          D.th().text('Field'),
          D.th().text(options.headers.left),
          D.th().text(options.headers.right)
        )
      );

      var tbody = D.create('tbody');
      changes.forEach(function(change) {
        tbody.child(self._renderAuditRow(change, options));
      });

      return D.table().classAdd('diff-audit-table', 'table', 'table-sm').child(thead, tbody);
    },

    /**
     * Render single audit table row
     * @private
     * @returns {Funky.Dom}
     */
    _renderAuditRow: function(change, options) {
      var row = D.tr().classAdd('diff-' + change.type);
      if (change.type === DiffType.EQUAL) {
        row.classAdd('text-muted');
      }

      // Field label
      row.child(D.td().classAdd('diff-audit-field').text(change.label));

      // Before value
      var beforeTd = D.td().classAdd('diff-audit-before');
      if (change.type === DiffType.REMOVE || change.type === DiffType.CHANGE) {
        beforeTd.classAdd('diff-remove');
      }
      if (change.type === DiffType.ADD) {
        beforeTd.child(D.span().classAdd('text-muted').text('—'));
      } else {
        beforeTd.html(this._formatAuditValue(change.field, change.left, options));
      }
      row.child(beforeTd);

      // After value
      var afterTd = D.td().classAdd('diff-audit-after');
      if (change.type === DiffType.ADD || change.type === DiffType.CHANGE) {
        afterTd.classAdd('diff-add');
      }
      if (change.type === DiffType.REMOVE) {
        afterTd.child(D.span().classAdd('text-muted').text('—'));
      } else {
        afterTd.html(this._formatAuditValue(change.field, change.right, options));
      }
      row.child(afterTd);

      return row;
    },

    /**
     * Format a value for audit display
     * @private
     */
    _formatAuditValue: function(field, value, options) {
      // Check for null/undefined
      if (value === null || value === undefined) {
        return '<span class="text-muted">null</span>';
      }

      // Check for custom renderer in options
      if (options.renderers && options.renderers[field]) {
        return options.renderers[field](value);
      }

      // Check for built-in field renderer
      if (this.FIELD_RENDERERS[field]) {
        return this.FIELD_RENDERERS[field](value);
      }

      // Boolean values
      if (typeof value === 'boolean') {
        return this.FIELD_RENDERERS._boolean(value);
      }

      // Objects and arrays
      if (typeof value === 'object') {
        return '<code>' + this._escape(JSON.stringify(value)) + '</code>';
      }

      // Default: escape and return
      return this._escape(String(value));
    },

    /**
     * Format timestamp for display
     * @private
     */
    _formatTimestamp: function(timestamp) {
      try {
        var date = new Date(timestamp);
        if (isNaN(date.getTime())) {
          return this._escape(String(timestamp));
        }
        // Use Funky.Format if available
        if (Funky.Format && Funky.Format.dateTime) {
          return Funky.Format.dateTime(date);
        }
        // Fallback formatting
        return date.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (e) {
        return this._escape(String(timestamp));
      }
    }
  };

  // ============================================================================
  // EXPORT
  // ============================================================================

  Funky.register('Diff', Diff);

})(window);

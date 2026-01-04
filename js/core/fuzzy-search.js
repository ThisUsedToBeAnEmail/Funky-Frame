/**
 * Funky FuzzySearch - Reusable fuzzy matching engine
 * 
 * Provides fuzzy string matching with:
 * - Configurable threshold scoring
 * - Match position tracking for highlighting
 * - Multi-key object searching
 * - Case-insensitive by default
 * 
 * @module Funky.FuzzySearch
 * @version 1.0.0
 */
(function(window) {
	'use strict';

	// Ensure Funky registry exists
	if (!window.Funky || !window.Funky.register) {
		console.error('[Funky.FuzzySearch] Registry not found. Load namespace.js first.');
		return;
	}

	// Prevent double-registration
	if (Funky.isRegistered('FuzzySearch')) {
		return;
	}

	// ==========================================================================
	// CONSTANTS
	// ==========================================================================

	var DEFAULTS = {
		threshold: 0.3,          // Minimum score (0-1) to be considered a match
		caseSensitive: false,    // Case-sensitive matching
		tokenize: false,         // Split query into space-separated tokens
		matchAllTokens: false,   // Require all tokens to match (when tokenize=true)
		
		// Recent searches options
		recentKey: null,         // Storage key for recent searches (enables feature)
		maxRecent: 5,            // Max recent searches to track
		showRecent: true,        // Show recent when query is empty
		recentLabel: 'Recent',   // Label for recent section
		onRecentSelect: null     // Callback when recent item selected
	};

	// ==========================================================================
	// CORE MATCHING ALGORITHM
	// ==========================================================================

	/**
	 * Calculate fuzzy match score and positions
	 * Uses sequential character matching with gap penalties
	 * 
	 * @param {string} query - Search query
	 * @param {string} text - Text to search in
	 * @param {Object} options - Matching options
	 * @returns {Object|null} { score, matches } or null if no match
	 */
	function fuzzyMatch(query, text, options) {
		var opts = Object.assign({}, DEFAULTS, options);
		
		if (!query || !text) return null;
		if (typeof query !== 'string' || typeof text !== 'string') return null;
		
		// Normalize case
		var q = opts.caseSensitive ? query : query.toLowerCase();
		var t = opts.caseSensitive ? text : text.toLowerCase();
		
		var queryLen = q.length;
		var textLen = t.length;
		
		// Quick checks
		if (queryLen === 0) return { score: 1, matches: [] };
		if (queryLen > textLen) return null;
		
		// Exact match - highest score
		if (q === t) {
			var allMatches = [];
			for (var i = 0; i < textLen; i++) {
				allMatches.push([i, i]);
			}
			return { score: 1, matches: allMatches };
		}
		
		// Substring match - high score
		var substringIndex = t.indexOf(q);
		if (substringIndex !== -1) {
			var matches = [];
			for (var i = 0; i < queryLen; i++) {
				matches.push([substringIndex + i, substringIndex + i]);
			}
			// Score based on position (earlier = better) and coverage
			var positionBonus = 1 - (substringIndex / textLen) * 0.2;
			var coverageBonus = queryLen / textLen;
			return { 
				score: Math.min(0.95, 0.7 + (positionBonus * 0.15) + (coverageBonus * 0.1)),
				matches: matches 
			};
		}
		
		// Fuzzy matching - sequential character search
		var matches = [];
		var queryIndex = 0;
		var lastMatchIndex = -1;
		var totalGap = 0;
		var consecutiveMatches = 0;
		var maxConsecutive = 0;
		var firstMatchIndex = -1;
		
		for (var textIndex = 0; textIndex < textLen && queryIndex < queryLen; textIndex++) {
			if (t.charAt(textIndex) === q.charAt(queryIndex)) {
				matches.push([textIndex, textIndex]);
				
				if (firstMatchIndex === -1) {
					firstMatchIndex = textIndex;
				}
				
				// Track gaps and consecutive matches
				if (lastMatchIndex !== -1) {
					var gap = textIndex - lastMatchIndex - 1;
					totalGap += gap;
					
					if (gap === 0) {
						consecutiveMatches++;
						maxConsecutive = Math.max(maxConsecutive, consecutiveMatches);
					} else {
						consecutiveMatches = 1;
					}
				} else {
					consecutiveMatches = 1;
				}
				
				lastMatchIndex = textIndex;
				queryIndex++;
			}
		}
		
		// All query characters must be found
		if (queryIndex < queryLen) {
			return null;
		}
		
		// Calculate score based on multiple factors
		var matchRatio = queryLen / textLen;
		var gapPenalty = textLen > 0 ? totalGap / textLen : 0;
		var consecutiveBonus = queryLen > 0 ? maxConsecutive / queryLen : 0;
		var positionBonus = textLen > 0 ? 1 - (firstMatchIndex / textLen) * 0.3 : 1;
		
		var score = (
			matchRatio * 0.25 +
			(1 - Math.min(gapPenalty, 1)) * 0.35 +
			consecutiveBonus * 0.25 +
			positionBonus * 0.15
		);
		
		return {
			score: Math.max(0, Math.min(1, score)),
			matches: matches
		};
	}

	/**
	 * Match with tokenized query (space-separated words)
	 * @param {string} query
	 * @param {string} text
	 * @param {Object} options
	 * @returns {Object|null}
	 */
	function tokenMatch(query, text, options) {
		var opts = Object.assign({}, DEFAULTS, options);
		var tokens = query.trim().split(/\s+/).filter(function(t) { return t.length > 0; });
		
		if (tokens.length === 0) return { score: 1, matches: [] };
		if (tokens.length === 1) return fuzzyMatch(query.trim(), text, opts);
		
		var allMatches = [];
		var totalScore = 0;
		var matchedTokens = 0;
		
		for (var i = 0; i < tokens.length; i++) {
			var result = fuzzyMatch(tokens[i], text, opts);
			if (result) {
				matchedTokens++;
				totalScore += result.score;
				allMatches = allMatches.concat(result.matches);
			} else if (opts.matchAllTokens) {
				return null; // Require all tokens
			}
		}
		
		if (matchedTokens === 0) return null;
		
		// Sort and dedupe overlapping matches
		allMatches.sort(function(a, b) { return a[0] - b[0]; });
		var deduped = [];
		var lastEnd = -1;
		for (var i = 0; i < allMatches.length; i++) {
			if (allMatches[i][0] > lastEnd) {
				deduped.push(allMatches[i]);
				lastEnd = allMatches[i][1];
			}
		}
		
		return {
			score: totalScore / tokens.length,
			matches: deduped,
			tokenMatches: matchedTokens,
			tokenCount: tokens.length
		};
	}

	// ==========================================================================
	// ARRAY SEARCHING
	// ==========================================================================

	/**
	 * Search an array of items
	 * 
	 * @param {string} query - Search query
	 * @param {Array} items - Items to search
	 * @param {Object} options - Search options
	 * @param {Array<string>} options.keys - Object keys to search (for object arrays)
	 * @param {number} options.threshold - Minimum score (0-1)
	 * @param {number} options.limit - Maximum results to return
	 * @param {Function} options.getText - Custom text extractor: function(item) => string
	 * @returns {Array} [{ item, index, score, matches, key }]
	 */
	function search(query, items, options) {
		var opts = Object.assign({}, DEFAULTS, {
			keys: null,
			limit: Infinity,
			getText: null
		}, options);
		
		if (!query || !items || !items.length) {
			return [];
		}
		
		query = String(query).trim();
		if (!query) return [];
		
		var results = [];
		var matchFn = opts.tokenize ? tokenMatch : fuzzyMatch;
		
		for (var i = 0; i < items.length; i++) {
			var item = items[i];
			var bestMatch = null;
			var bestKey = null;
			
			if (opts.getText) {
				// Custom text extractor
				var text = opts.getText(item);
				if (text) {
					var result = matchFn(query, String(text), opts);
					if (result && result.score >= opts.threshold) {
						bestMatch = result;
					}
				}
			} else if (opts.keys && typeof item === 'object' && item !== null) {
				// Search multiple keys
				for (var k = 0; k < opts.keys.length; k++) {
					var key = opts.keys[k];
					var value = getNestedValue(item, key);
					
					if (typeof value === 'string') {
						var result = matchFn(query, value, opts);
						if (result && result.score >= opts.threshold) {
							if (!bestMatch || result.score > bestMatch.score) {
								bestMatch = result;
								bestKey = key;
							}
						}
					} else if (Array.isArray(value)) {
						// Array of strings (e.g., keywords, tags)
						for (var j = 0; j < value.length; j++) {
							if (typeof value[j] === 'string') {
								var result = matchFn(query, value[j], opts);
								if (result && result.score >= opts.threshold) {
									// Slightly reduce score for array matches
									result.score *= 0.9;
									if (!bestMatch || result.score > bestMatch.score) {
										bestMatch = result;
										bestKey = key + '[' + j + ']';
									}
								}
							}
						}
					}
				}
			} else if (typeof item === 'string') {
				// Plain string array
				var result = matchFn(query, item, opts);
				if (result && result.score >= opts.threshold) {
					bestMatch = result;
				}
			}
			
			if (bestMatch) {
				results.push({
					item: item,
					index: i,
					score: bestMatch.score,
					matches: bestMatch.matches,
					key: bestKey
				});
			}
		}
		
		// Sort by score descending
		results.sort(function(a, b) {
			return b.score - a.score;
		});
		
		// Apply limit
		if (opts.limit < results.length) {
			results = results.slice(0, opts.limit);
		}
		
		return results;
	}

	/**
	 * Get nested object value by dot-notation key
	 * @param {Object} obj
	 * @param {string} key - e.g., "user.name" or "data.items"
	 * @returns {*}
	 */
	function getNestedValue(obj, key) {
		if (!obj || !key) return undefined;
		var parts = key.split('.');
		var value = obj;
		for (var i = 0; i < parts.length; i++) {
			if (value == null) return undefined;
			value = value[parts[i]];
		}
		return value;
	}

	// ==========================================================================
	// SIMPLE SUBSTRING MATCH (FALLBACK)
	// ==========================================================================

	/**
	 * Simple substring match with position tracking
	 * For backwards compatibility when fuzzy not needed
	 * 
	 * @param {string} query
	 * @param {string} text
	 * @param {Object} options
	 * @returns {Object|null} { score, matches } or null
	 */
	function substringMatch(query, text, options) {
		var opts = Object.assign({}, DEFAULTS, options);
		
		if (!query || !text) return null;
		
		var q = opts.caseSensitive ? query : query.toLowerCase();
		var t = opts.caseSensitive ? text : text.toLowerCase();
		
		var index = t.indexOf(q);
		if (index === -1) return null;
		
		var matches = [];
		for (var i = 0; i < q.length; i++) {
			matches.push([index + i, index + i]);
		}
		
		// Score based on position and coverage
		var positionScore = 1 - (index / text.length) * 0.3;
		var coverageScore = query.length / text.length;
		
		return {
			score: Math.min(1, positionScore * 0.7 + coverageScore * 0.3),
			matches: matches
		};
	}

	// ==========================================================================
	// FACTORY
	// ==========================================================================

	/**
	 * Create a configured matcher instance
	 * 
	 * @param {Object} options - Default options for this instance
	 * @returns {Object} Matcher instance
	 */
	function create(options) {
		var defaults = Object.assign({}, DEFAULTS, options);
		var _recentHistory = null;
		
		/**
		 * Get or create recent history instance (lazy initialization)
		 * @private
		 */
		function getRecentHistory() {
			if (!defaults.recentKey) return null;

			if (!_recentHistory) {
				_recentHistory = Funky.History.create({
					key: defaults.recentKey,
					maxItems: defaults.maxRecent || 5,
					persist: true
				});
			}

			return _recentHistory;
		}
		
		return {
			/**
			 * Match query against single text
			 */
			match: function(query, text, opts) {
				return fuzzyMatch(query, text, Object.assign({}, defaults, opts));
			},
			
			/**
			 * Search array of items
			 */
			search: function(query, items, opts) {
				return search(query, items, Object.assign({}, defaults, opts));
			},
			
			/**
			 * Simple substring match (non-fuzzy)
			 */
			substring: function(query, text, opts) {
				return substringMatch(query, text, Object.assign({}, defaults, opts));
			},
			
			/**
			 * Add a search query to recent history
			 * @param {string} query - Search query to remember
			 */
			addToRecent: function(query) {
				if (!defaults.recentKey) return;
				if (!query || typeof query !== 'string') return;
				
				var trimmed = query.trim();
				if (trimmed.length < 2) return;
				
				var history = getRecentHistory();
				if (history) {
					history.add(trimmed);
				}
			},
			
			/**
			 * Get recent searches
			 * @returns {Array<string>}
			 */
			getRecent: function() {
				var history = getRecentHistory();
				if (!history) return [];
				return history.getAll();
			},
			
			/**
			 * Clear recent searches
			 */
			clearRecent: function() {
				var history = getRecentHistory();
				if (history) {
					history.clear();
				}
			},
			
			/**
			 * Get results including recent when query empty
			 * @param {string} query
			 * @param {Array} items - Items to search
			 * @param {Object} opts - Search options
			 * @returns {Object} { results, recent, isRecent }
			 */
			searchWithRecent: function(query, items, opts) {
				if (query && query.trim().length > 0) {
					return {
						results: search(query, items, Object.assign({}, defaults, opts)),
						recent: [],
						isRecent: false
					};
				}
				
				// No query - return recent if enabled
				if (defaults.showRecent) {
					var history = getRecentHistory();
					if (history) {
						return {
							results: [],
							recent: history.getAll(),
							isRecent: true
						};
					}
				}
				
				return { results: [], recent: [], isRecent: false };
			},
			
			/**
			 * Get the options for this instance
			 */
			getOptions: function() {
				return Object.assign({}, defaults);
			}
		};
	}

	// ==========================================================================
	// PUBLIC API
	// ==========================================================================

	var FuzzySearch = {
		/**
		 * Create configured matcher instance
		 */
		create: create,
		
		/**
		 * Single string fuzzy match
		 */
		match: function(query, text, options) {
			return fuzzyMatch(query, text, Object.assign({}, DEFAULTS, options));
		},
		
		/**
		 * Search array of items
		 */
		search: search,
		
		/**
		 * Simple substring match (non-fuzzy fallback)
		 */
		substring: function(query, text, options) {
			return substringMatch(query, text, Object.assign({}, DEFAULTS, options));
		},
		
		/**
		 * Tokenized match (space-separated)
		 */
		tokenMatch: tokenMatch,
		
		/**
		 * Default options
		 */
		DEFAULTS: Object.assign({}, DEFAULTS)
	};

	// Register with Funky namespace
	Funky.register('FuzzySearch', FuzzySearch);

})(window);

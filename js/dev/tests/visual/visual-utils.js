/**
 * Visual Regression Testing Utilities
 *
 * Provides canvas-based screenshot capture and comparison.
 * Baselines are stored in IndexedDB.
 */
(function(FunkyTests) {
    'use strict';

    var Visual = {};

    // ═══════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════

    var config = {
        threshold: 0.01,        // 1% pixel difference tolerance
        antialiasingTolerance: 3,
        dbName: 'FunkyTestsVisual',
        storeName: 'baselines'
    };

    // ═══════════════════════════════════════════════════════════
    // DATABASE (IndexedDB for baseline storage)
    // ═══════════════════════════════════════════════════════════

    var db = null;

    function openDB() {
        return new Promise(function(resolve, reject) {
            if (db) return resolve(db);

            var request = indexedDB.open(config.dbName, 1);

            request.onerror = function() {
                reject(new Error('Failed to open visual test database'));
            };

            request.onsuccess = function(event) {
                db = event.target.result;
                resolve(db);
            };

            request.onupgradeneeded = function(event) {
                var database = event.target.result;
                if (!database.objectStoreNames.contains(config.storeName)) {
                    database.createObjectStore(config.storeName, { keyPath: 'name' });
                }
            };
        });
    }

    function saveBaseline(name, imageData) {
        return openDB().then(function(database) {
            return new Promise(function(resolve, reject) {
                var transaction = database.transaction([config.storeName], 'readwrite');
                var store = transaction.objectStore(config.storeName);
                var request = store.put({ name: name, data: imageData, timestamp: Date.now() });

                request.onsuccess = function() { resolve(); };
                request.onerror = function() { reject(new Error('Failed to save baseline')); };
            });
        });
    }

    function loadBaseline(name) {
        return openDB().then(function(database) {
            return new Promise(function(resolve, reject) {
                var transaction = database.transaction([config.storeName], 'readonly');
                var store = transaction.objectStore(config.storeName);
                var request = store.get(name);

                request.onsuccess = function(event) {
                    resolve(event.target.result ? event.target.result.data : null);
                };
                request.onerror = function() { reject(new Error('Failed to load baseline')); };
            });
        });
    }

    function deleteBaseline(name) {
        return openDB().then(function(database) {
            return new Promise(function(resolve, reject) {
                var transaction = database.transaction([config.storeName], 'readwrite');
                var store = transaction.objectStore(config.storeName);
                var request = store.delete(name);

                request.onsuccess = function() { resolve(); };
                request.onerror = function() { reject(new Error('Failed to delete baseline')); };
            });
        });
    }

    // ═══════════════════════════════════════════════════════════
    // SCREENSHOT CAPTURE
    // ═══════════════════════════════════════════════════════════

    /**
     * Capture element as canvas/dataURL
     * Uses a simplified approach that works without external libraries
     */
    Visual.capture = function(element, options) {
        options = options || {};

        return new Promise(function(resolve, reject) {
            try {
                // Get element dimensions and styles
                var rect = element.getBoundingClientRect();
                var width = Math.ceil(options.width || rect.width) || 100;
                var height = Math.ceil(options.height || rect.height) || 100;
                var scale = options.scale || 1;

                // Create canvas
                var canvas = document.createElement('canvas');
                canvas.width = width * scale;
                canvas.height = height * scale;
                var ctx = canvas.getContext('2d');

                if (scale !== 1) {
                    ctx.scale(scale, scale);
                }

                // Get computed styles
                var styles = window.getComputedStyle(element);

                // Fill background
                ctx.fillStyle = styles.backgroundColor || '#ffffff';
                ctx.fillRect(0, 0, width, height);

                // Draw border if present
                var borderWidth = parseInt(styles.borderWidth) || 0;
                if (borderWidth > 0) {
                    ctx.strokeStyle = styles.borderColor || '#000000';
                    ctx.lineWidth = borderWidth;
                    ctx.strokeRect(borderWidth / 2, borderWidth / 2, width - borderWidth, height - borderWidth);
                }

                // Draw text content
                var text = element.textContent || '';
                if (text.trim()) {
                    ctx.fillStyle = styles.color || '#000000';
                    ctx.font = styles.fontSize + ' ' + styles.fontFamily;
                    ctx.textBaseline = 'top';

                    var padding = parseInt(styles.paddingLeft) || 10;
                    var paddingTop = parseInt(styles.paddingTop) || 10;

                    // Simple text wrapping
                    var words = text.trim().split(/\s+/);
                    var line = '';
                    var y = paddingTop;
                    var lineHeight = parseInt(styles.lineHeight) || parseInt(styles.fontSize) * 1.2;
                    var maxWidth = width - padding * 2;

                    for (var i = 0; i < words.length; i++) {
                        var testLine = line + words[i] + ' ';
                        var metrics = ctx.measureText(testLine);
                        if (metrics.width > maxWidth && i > 0) {
                            ctx.fillText(line, padding, y);
                            line = words[i] + ' ';
                            y += lineHeight;
                        } else {
                            line = testLine;
                        }
                    }
                    ctx.fillText(line, padding, y);
                }

                // Get image data
                var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                resolve({
                    canvas: canvas,
                    imageData: imageData,
                    dataUrl: canvas.toDataURL('image/png'),
                    width: width,
                    height: height
                });
            } catch (e) {
                reject(e);
            }
        });
    };

    /**
     * Capture element using html2canvas if available
     */
    Visual.captureAdvanced = function(element, options) {
        options = options || {};

        if (window.html2canvas) {
            return html2canvas(element, {
                scale: options.scale || 1,
                backgroundColor: options.backgroundColor || '#ffffff',
                logging: false
            }).then(function(canvas) {
                return {
                    canvas: canvas,
                    imageData: canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height),
                    dataUrl: canvas.toDataURL('image/png'),
                    width: canvas.width,
                    height: canvas.height
                };
            });
        }

        // Fall back to simple capture
        return Visual.capture(element, options);
    };

    // ═══════════════════════════════════════════════════════════
    // IMAGE COMPARISON
    // ═══════════════════════════════════════════════════════════

    /**
     * Compare two ImageData objects
     */
    Visual.compare = function(imageData1, imageData2, options) {
        options = options || {};
        var threshold = options.threshold || config.threshold;

        var data1 = imageData1.data;
        var data2 = imageData2.data;
        var width = imageData1.width;
        var height = imageData1.height;

        // Check dimensions match
        if (imageData1.width !== imageData2.width || imageData1.height !== imageData2.height) {
            return {
                match: false,
                diffPercent: 100,
                threshold: threshold * 100,
                reason: 'Dimension mismatch',
                baseline: { width: imageData1.width, height: imageData1.height },
                current: { width: imageData2.width, height: imageData2.height }
            };
        }

        var diffPixels = 0;
        var diffCanvas = document.createElement('canvas');
        diffCanvas.width = width;
        diffCanvas.height = height;
        var diffCtx = diffCanvas.getContext('2d');
        var diffData = diffCtx.createImageData(width, height);

        for (var i = 0; i < data1.length; i += 4) {
            var r1 = data1[i];
            var g1 = data1[i + 1];
            var b1 = data1[i + 2];

            var r2 = data2[i];
            var g2 = data2[i + 1];
            var b2 = data2[i + 2];

            var isDiff = false;

            // Check if pixels are different (with tolerance)
            if (Math.abs(r1 - r2) > config.antialiasingTolerance ||
                Math.abs(g1 - g2) > config.antialiasingTolerance ||
                Math.abs(b1 - b2) > config.antialiasingTolerance) {
                isDiff = true;
            }

            if (isDiff) {
                diffPixels++;
                // Mark diff pixels as red
                diffData.data[i] = 255;
                diffData.data[i + 1] = 0;
                diffData.data[i + 2] = 0;
                diffData.data[i + 3] = 255;
            } else {
                // Keep original with reduced opacity
                diffData.data[i] = r2;
                diffData.data[i + 1] = g2;
                diffData.data[i + 2] = b2;
                diffData.data[i + 3] = 100;
            }
        }

        diffCtx.putImageData(diffData, 0, 0);

        var totalPixels = width * height;
        var diffPercent = (diffPixels / totalPixels) * 100;

        return {
            match: diffPercent <= threshold * 100,
            diffPixels: diffPixels,
            totalPixels: totalPixels,
            diffPercent: diffPercent,
            threshold: threshold * 100,
            diffCanvas: diffCanvas,
            diffDataUrl: diffCanvas.toDataURL()
        };
    };

    // ═══════════════════════════════════════════════════════════
    // VISUAL ASSERTION
    // ═══════════════════════════════════════════════════════════

    /**
     * Assert element matches baseline
     */
    Visual.assertMatchesBaseline = function(element, name, options) {
        options = options || {};

        return Visual.capture(element, options).then(function(capture) {
            return loadBaseline(name).then(function(baseline) {
                if (!baseline) {
                    // No baseline exists
                    if (options.updateBaseline === true) {
                        // Only create baseline if explicitly requested
                        return saveBaseline(name, capture.dataUrl).then(function() {
                            console.log('%c📸 Baseline created: ' + name, 'color: #0984e3');
                            return { created: true, name: name };
                        });
                    } else {
                        // Default: fail the test - baselines must be captured deliberately
                        throw new Error('No baseline exists for: ' + name + '. Run with updateBaseline: true to create it.');
                    }
                }

                // Load baseline image
                return loadImageData(baseline).then(function(baselineData) {
                    var result = Visual.compare(baselineData, capture.imageData, options);

                    if (!result.match) {
                        // Show diff in console
                        console.log('%c✗ Visual mismatch: ' + name, 'color: #d63031');
                        console.log('Difference: ' + result.diffPercent.toFixed(2) + '%');
                        console.log('Baseline:', baseline);
                        console.log('Current:', capture.dataUrl);
                        console.log('Diff:', result.diffDataUrl);

                        var error = new Error(
                            'Visual regression detected in "' + name + '": ' +
                            result.diffPercent.toFixed(2) + '% difference (threshold: ' +
                            result.threshold.toFixed(2) + '%)'
                        );
                        error.diff = result;
                        error.baseline = baseline;
                        error.current = capture.dataUrl;
                        throw error;
                    }

                    console.log('%c✓ Visual match: ' + name, 'color: #00b894');
                    return result;
                });
            });
        });
    };

    function loadImageData(dataUrl) {
        return new Promise(function(resolve, reject) {
            var img = new Image();
            img.onload = function() {
                var canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(ctx.getImageData(0, 0, img.width, img.height));
            };
            img.onerror = function() {
                reject(new Error('Failed to load baseline image'));
            };
            img.src = dataUrl;
        });
    }

    // ═══════════════════════════════════════════════════════════
    // BASELINE MANAGEMENT
    // ═══════════════════════════════════════════════════════════

    Visual.updateBaseline = function(element, name, options) {
        return Visual.capture(element, options).then(function(capture) {
            return saveBaseline(name, capture.dataUrl).then(function() {
                console.log('%c📸 Baseline updated: ' + name, 'color: #0984e3');
                return { updated: true, name: name };
            });
        });
    };

    Visual.deleteBaseline = function(name) {
        return deleteBaseline(name).then(function() {
            console.log('%c🗑 Baseline deleted: ' + name, 'color: #636e72');
        });
    };

    Visual.listBaselines = function() {
        return openDB().then(function(database) {
            return new Promise(function(resolve, reject) {
                var transaction = database.transaction([config.storeName], 'readonly');
                var store = transaction.objectStore(config.storeName);
                var request = store.getAllKeys();

                request.onsuccess = function(event) {
                    resolve(event.target.result);
                };
                request.onerror = function() { reject(new Error('Failed to list baselines')); };
            });
        });
    };

    Visual.getBaseline = function(name) {
        return loadBaseline(name);
    };

    Visual.clearAllBaselines = function() {
        return openDB().then(function(database) {
            return new Promise(function(resolve, reject) {
                var transaction = database.transaction([config.storeName], 'readwrite');
                var store = transaction.objectStore(config.storeName);
                var request = store.clear();

                request.onsuccess = function() {
                    console.log('%c🗑 All baselines cleared', 'color: #636e72');
                    resolve();
                };
                request.onerror = function() { reject(new Error('Failed to clear baselines')); };
            });
        });
    };

    // ═══════════════════════════════════════════════════════════
    // DIFF VIEWER
    // ═══════════════════════════════════════════════════════════

    Visual.showDiff = function(baseline, current, diff, name) {
        var overlay = document.createElement('div');
        overlay.className = 'visual-diff-overlay';
        overlay.innerHTML = [
            '<div class="visual-diff-container">',
            '  <h2>Visual Diff: ' + (name || 'Comparison') + '</h2>',
            '  <div class="visual-diff-images">',
            '    <div class="visual-diff-panel">',
            '      <h3>Baseline</h3>',
            '      <img src="' + baseline + '" alt="Baseline">',
            '    </div>',
            '    <div class="visual-diff-panel">',
            '      <h3>Current</h3>',
            '      <img src="' + current + '" alt="Current">',
            '    </div>',
            '    <div class="visual-diff-panel">',
            '      <h3>Diff</h3>',
            '      <img src="' + diff + '" alt="Diff">',
            '    </div>',
            '  </div>',
            '  <div class="visual-diff-actions">',
            '    <button class="accept">Accept Current as Baseline</button>',
            '    <button class="close">Close</button>',
            '  </div>',
            '</div>'
        ].join('\n');

        // Styles
        var style = document.createElement('style');
        style.textContent = [
            '.visual-diff-overlay {',
            '  position: fixed; top: 0; left: 0; right: 0; bottom: 0;',
            '  background: rgba(0,0,0,0.9); z-index: 99999;',
            '  display: flex; align-items: center; justify-content: center;',
            '}',
            '.visual-diff-container { background: #fff; padding: 20px; border-radius: 8px; max-width: 90vw; max-height: 90vh; overflow: auto; color: #333; }',
            '.visual-diff-container h2 { margin: 0 0 20px; }',
            '.visual-diff-images { display: flex; gap: 20px; margin: 20px 0; }',
            '.visual-diff-panel { text-align: center; }',
            '.visual-diff-panel h3 { margin: 0 0 10px; font-size: 14px; }',
            '.visual-diff-panel img { max-width: 300px; max-height: 300px; border: 1px solid #ccc; }',
            '.visual-diff-actions { display: flex; gap: 10px; justify-content: center; }',
            '.visual-diff-actions button { padding: 10px 20px; cursor: pointer; border-radius: 4px; }',
            '.visual-diff-actions .accept { background: #00b894; color: #fff; border: none; }',
            '.visual-diff-actions .close { background: #ddd; border: none; }'
        ].join('\n');

        overlay.appendChild(style);
        document.body.appendChild(overlay);

        return new Promise(function(resolve) {
            overlay.querySelector('.close').onclick = function() {
                overlay.remove();
                resolve({ accepted: false });
            };

            overlay.querySelector('.accept').onclick = function() {
                overlay.remove();
                resolve({ accepted: true });
            };
        });
    };

    // ═══════════════════════════════════════════════════════════
    // SNAPSHOT TESTING
    // ═══════════════════════════════════════════════════════════

    /**
     * Create a snapshot of element's computed styles
     */
    Visual.snapshotStyles = function(element) {
        var styles = window.getComputedStyle(element);
        var snapshot = {};

        var importantProperties = [
            'display', 'position', 'width', 'height', 'padding', 'margin',
            'border', 'background', 'color', 'font-size', 'font-family',
            'text-align', 'opacity', 'visibility', 'overflow', 'z-index',
            'flex', 'grid', 'transform', 'transition'
        ];

        importantProperties.forEach(function(prop) {
            snapshot[prop] = styles.getPropertyValue(prop);
        });

        return snapshot;
    };

    /**
     * Compare style snapshots
     */
    Visual.compareStyles = function(snapshot1, snapshot2) {
        var differences = [];

        Object.keys(snapshot1).forEach(function(prop) {
            if (snapshot1[prop] !== snapshot2[prop]) {
                differences.push({
                    property: prop,
                    expected: snapshot1[prop],
                    actual: snapshot2[prop]
                });
            }
        });

        return {
            match: differences.length === 0,
            differences: differences
        };
    };

    // ═══════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════

    Visual.configure = function(options) {
        Object.keys(options).forEach(function(key) {
            if (config.hasOwnProperty(key)) {
                config[key] = options[key];
            }
        });
    };

    Visual.getConfig = function() {
        return Object.assign({}, config);
    };

    // Export
    FunkyTests.Visual = Visual;

})(window.FunkyTests);

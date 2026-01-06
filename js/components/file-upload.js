/**
 * Funky.FileUpload - File Upload Component
 * Drag-drop file upload with validation, progress tracking, and event emission
 * @version 1.0.3
 */
(function(global) {
    'use strict';

    var Funky = global.Funky;
    var D = Funky.Dom;
    var E = Funky.Events;

    var _instances = {};
    var _counter = 0;

    var DEFAULTS = {
        accept: null,
        maxSize: 10 * 1024 * 1024,
        maxFiles: 10,
        multiple: true,
        autoUpload: false,
        url: '/api/upload',
        method: 'POST',
        headers: {},
        withCredentials: false,
        fieldName: 'file',
        // Phase 2: UX enhancements
        showPreviews: true,
        previewMaxSize: 5 * 1024 * 1024,
        allowRename: true,
        allowReorder: true,
        allowPaste: true,
        showLightbox: true,
        // Phase 3: Chunked uploads
        chunked: false,
        chunkSize: 5 * 1024 * 1024,
        chunkThreshold: 10 * 1024 * 1024,
        initUrl: null,
        chunkUrl: null,
        completeUrl: null,
        // Phase 3: Concurrency & queue
        maxConcurrent: 3,
        useJobQueue: true,
        persistQueue: false,
        // Phase 3: Retry
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2,
        // Phase 3: S3 direct upload
        useS3: false,
        presignUrl: null,
        // Phase 3: Speed tracking
        showSpeed: true,
        showTimeRemaining: true,
        // Phase 3: Priority
        defaultPriority: 'normal',
        // Callbacks
        onAdd: null,
        onRemove: null,
        onProgress: null,
        onComplete: null,
        onError: null,
        onAllComplete: null,
        onReorder: null,
        onPause: null,
        onResume: null,
        onRetry: null
    };

    function FileUpload(container, config) {
        this.id = 'file-upload-' + (++_counter);
        this.container = D.one(container);
        this.config = Object.assign({}, DEFAULTS, config);
        this.files = [];
        this.uploading = false;
        
        // Phase 3: Queue management
        this.queue = {
            pending: [],
            active: [],
            maxConcurrent: this.config.maxConcurrent
        };
        
        this._init();
    }

    FileUpload.prototype._init = function() {
        this._render();
        this._bindEvents();
        
        // Phase 2: Additional setup
        if (this.config.allowReorder) {
            this._initSortable();
        }
        if (this.config.showLightbox) {
            this._initLightbox();
        }
        if (this.config.allowPaste) {
            this._initPaste();
        }
        
        // Phase 3: Initialize upload queue
        this._initQueue();
    };

    FileUpload.prototype._render = function() {
        var el = this.container;
        el.classAdd('funky-upload', 'funky-upload--idle');
        
        // Create dropzone
        this.dropzone = D.create('div')
            .classAdd('funky-upload__dropzone')
            .html(
                '<i class="fas fa-cloud-upload-alt funky-upload__icon"></i>' +
                '<p class="funky-upload__text">Drag files here or <button type="button" class="funky-upload__browse">browse</button></p>' +
                '<p class="funky-upload__hint">' + this._getHintText() + '</p>'
            )
            .appendTo(el);
        
        // Hidden file input
        this.input = D.create('input')
            .attr('type', 'file')
            .attr('multiple', this.config.multiple)
            .attr('accept', this._getAcceptString())
            .classAdd('funky-upload__input')
            .style({ display: 'none' })
            .appendTo(el);
        
        // File list
        this.list = D.create('ul')
            .classAdd('funky-upload__list')
            .attr('role', 'list')
            .attr('aria-live', 'polite')
            .appendTo(el);
        
        // Footer
        this.footer = D.create('div')
            .classAdd('funky-upload__footer')
            .style({ display: 'none' })
            .html(
                '<button type="button" class="funky-upload__upload-all btn btn-primary">Upload All</button>' +
                '<button type="button" class="funky-upload__clear btn btn-secondary">Clear</button>'
            )
            .appendTo(el);
    };

    FileUpload.prototype._bindEvents = function() {
        var self = this;
        var dropzone = this.dropzone.el || this.dropzone;
        var input = this.input.el || this.input;
        
        // Click to browse
        dropzone.addEventListener('click', function() {
            input.click();
        });
        
        // File input change
        input.addEventListener('change', function(e) {
            self._handleFiles(e.target.files);
            input.value = ''; // Reset for re-selection
        });
        
        // Drag and drop
        dropzone.addEventListener('dragover', function(e) {
            e.preventDefault();
            self.container.classAdd('funky-upload--dragover');
        });
        
        dropzone.addEventListener('dragleave', function(e) {
            e.preventDefault();
            self.container.classRemove('funky-upload--dragover');
        });
        
        dropzone.addEventListener('drop', function(e) {
            e.preventDefault();
            self.container.classRemove('funky-upload--dragover');
            self._handleFiles(e.dataTransfer.files);
        });
        
        // Footer buttons
        var footerEl = this.footer.el || this.footer;
        footerEl.addEventListener('click', function(e) {
            if (e.target.closest('.funky-upload__upload-all')) {
                self.uploadAll();
            } else if (e.target.closest('.funky-upload__clear')) {
                self.clear();
            }
        });
    };

    /**
     * Emit DOM event using Funky.Events
     * @param {string} eventName - Event name without prefix (e.g., 'add', 'progress')
     * @param {Object} detail - Event detail data
     */
    FileUpload.prototype._emit = function(eventName, detail) {
        var fullEventName = 'funky.file-upload.' + eventName;
        E.emit(this.container.el || this.container, fullEventName, detail);
    };

    FileUpload.prototype._handleFiles = function(fileList) {
        var self = this;
        var files = Array.prototype.slice.call(fileList);
        
        files.forEach(function(file) {
            // Validate
            var error = self._validateFile(file);
            if (error) {
                self._showError(file, error);
                return;
            }
            
            // Check duplicates
            var isDuplicate = self.files.some(function(f) {
                return f.file.name === file.name && f.file.size === file.size;
            });
            if (isDuplicate) {
                return;
            }
            
            // Check max files
            if (self.files.length >= self.config.maxFiles) {
                self._showError(file, 'Maximum ' + self.config.maxFiles + ' files allowed');
                return;
            }
            
            // Add to queue
            var fileItem = {
                id: 'file-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                file: file,
                status: 'queued',
                progress: 0,
                xhr: null
            };
            
            self.files.push(fileItem);
            self._renderFileItem(fileItem);
            
            if (self.config.onAdd) {
                self.config.onAdd(file);
            }
            
            // Emit DOM event
            self._emit('add', { file: file, index: self.files.length - 1 });
        });
        
        this._updateFooter();
        
        if (this.config.autoUpload && this.files.length > 0) {
            this.uploadAll();
        }
    };

    FileUpload.prototype._validateFile = function(file) {
        // Size validation
        if (this.config.maxSize && file.size > this.config.maxSize) {
            return 'File too large. Max size: ' + this._formatSize(this.config.maxSize);
        }
        
        // Type validation
        if (this.config.accept) {
            var valid = this._checkFileType(file);
            if (!valid) {
                return 'Invalid file type';
            }
        }
        
        return null;
    };

    FileUpload.prototype._checkFileType = function(file) {
        var accept = this.config.accept;
        if (!accept) return true;
        
        var types = Array.isArray(accept) ? accept : accept.split(',');
        var fileName = file.name.toLowerCase();
        var fileType = file.type;
        
        return types.some(function(type) {
            type = type.trim().toLowerCase();
            if (type.indexOf('/') !== -1) {
                // MIME type
                if (type.endsWith('/*')) {
                    return fileType.startsWith(type.replace('/*', '/'));
                }
                return fileType === type;
            } else if (type.startsWith('.')) {
                // Extension
                return fileName.endsWith(type);
            }
            return false;
        });
    };

    FileUpload.prototype._renderFileItem = function(fileItem) {
        var self = this;
        var file = fileItem.file;
        
        var li = D.create('li')
            .classAdd('funky-upload__item', 'funky-upload__item--queued')
            .attr('data-file-id', fileItem.id);
        
        // Enable drag reorder if allowed
        if (this.config.allowReorder) {
            li.attr('draggable', 'true');
        }
        
        // Preview container
        var preview = D.create('div')
            .classAdd('funky-upload__preview')
            .appendTo(li);
        
        // Generate preview based on type
        if (this.config.showPreviews && file.size <= this.config.previewMaxSize) {
            if (file.type.startsWith('image/')) {
                this._generateImagePreview(file, preview);
            } else if (file.type.startsWith('video/')) {
                this._generateVideoPreview(file, preview);
            } else {
                preview.html('<i class="fas ' + this._getFileIcon(file) + '"></i>');
            }
        } else {
            preview.html('<i class="fas ' + this._getFileIcon(file) + '"></i>');
        }
        
        // File info
        this._renderFileInfo(li, fileItem);
        
        // Progress bar
        D.create('div')
            .classAdd('funky-upload__progress')
            .html('<div class="funky-upload__progress-bar"></div>')
            .appendTo(li);
        
        // Actions
        this._renderFileActions(li, fileItem);
        
        li.appendTo(this.list);
        fileItem.element = li;
        
        // Animate in
        requestAnimationFrame(function() {
            li.classAdd('funky-upload__item--visible');
        });
    };

    /**
     * Render file info section with name and size
     */
    FileUpload.prototype._renderFileInfo = function(li, fileItem) {
        var self = this;
        var file = fileItem.file;
        
        var info = D.create('div')
            .classAdd('funky-upload__info')
            .appendTo(li);
        
        var nameWrapper = D.create('div')
            .classAdd('funky-upload__name-wrapper')
            .appendTo(info);
        
        var nameSpan = D.create('span')
            .classAdd('funky-upload__name')
            .text(fileItem.displayName || file.name)
            .appendTo(nameWrapper);
        
        // Rename button
        if (this.config.allowRename && fileItem.status === 'queued') {
            var editBtn = D.create('button')
                .classAdd('funky-upload__edit')
                .attr('type', 'button')
                .attr('aria-label', 'Rename file')
                .html('<i class="fas fa-pencil-alt"></i>')
                .appendTo(nameWrapper);
            
            var editBtnEl = editBtn.el || editBtn;
            editBtnEl.addEventListener('click', function(e) {
                e.stopPropagation();
                self._showRenameInput(fileItem, nameSpan);
            });
        }
        
        D.create('span')
            .classAdd('funky-upload__size')
            .text(this._formatSize(file.size))
            .appendTo(info);
        
        fileItem.nameElement = nameSpan;
    };

    /**
     * Render action buttons for file item
     */
    FileUpload.prototype._renderFileActions = function(li, fileItem) {
        var self = this;
        
        var actions = D.create('div')
            .classAdd('funky-upload__actions')
            .appendTo(li);
        
        var cancelBtn = D.create('button')
            .attr('type', 'button')
            .classAdd('funky-upload__cancel')
            .attr('aria-label', 'Remove file')
            .html('<i class="fas fa-times"></i>')
            .appendTo(actions);
        
        var cancelBtnEl = cancelBtn.el || cancelBtn;
        cancelBtnEl.addEventListener('click', function() {
            self.removeFile(fileItem.id);
        });
    };

    /**
     * Generate image thumbnail preview
     */
    FileUpload.prototype._generateImagePreview = function(file, container) {
        container.classAdd('funky-upload__preview--loading');
        
        var reader = new FileReader();
        
        reader.onload = function(e) {
            var img = D.create('img')
                .attr('src', e.target.result)
                .attr('alt', file.name)
                .classAdd('funky-upload__thumbnail');
            
            container.html('').append(img);
            container.classRemove('funky-upload__preview--loading');
            container.classAdd('funky-upload__preview--image');
        };
        
        reader.onerror = function() {
            container.html('<i class="fas fa-image"></i>');
            container.classRemove('funky-upload__preview--loading');
        };
        
        reader.readAsDataURL(file);
    };

    /**
     * Generate video thumbnail from first frame
     */
    FileUpload.prototype._generateVideoPreview = function(file, container) {
        container.classAdd('funky-upload__preview--loading');
        
        var video = document.createElement('video');
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        
        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;
        
        video.onloadeddata = function() {
            video.currentTime = 0.1; // Seek to get first frame
        };
        
        video.onseeked = function() {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
            
            var img = D.create('img')
                .attr('src', canvas.toDataURL('image/jpeg'))
                .attr('alt', file.name)
                .classAdd('funky-upload__thumbnail');
            
            container.html('').append(img);
            container.classRemove('funky-upload__preview--loading');
            container.classAdd('funky-upload__preview--video');
            
            // Add play icon overlay
            D.create('div')
                .classAdd('funky-upload__video-overlay')
                .html('<i class="fas fa-play-circle"></i>')
                .appendTo(container);
            
            URL.revokeObjectURL(video.src);
        };
        
        video.onerror = function() {
            container.html('<i class="fas fa-video"></i>');
            container.classRemove('funky-upload__preview--loading');
        };
        
        video.src = URL.createObjectURL(file);
    };

    /**
     * Show inline rename input
     */
    FileUpload.prototype._showRenameInput = function(fileItem, nameSpan) {
        var self = this;
        var currentName = fileItem.displayName || fileItem.file.name;
        var lastDot = currentName.lastIndexOf('.');
        var ext = lastDot !== -1 ? currentName.substring(lastDot) : '';
        var baseName = lastDot !== -1 ? currentName.substring(0, lastDot) : currentName;
        
        var input = D.create('input')
            .classAdd('funky-upload__rename-input')
            .attr('type', 'text')
            .attr('value', baseName);
        
        nameSpan.style({ display: 'none' });
        var nameSpanEl = nameSpan.el || nameSpan;
        var inputEl = input.el || input;
        nameSpanEl.parentNode.insertBefore(inputEl, nameSpanEl.nextSibling);
        inputEl.focus();
        inputEl.select();
        
        function save() {
            var newName = inputEl.value.trim();
            if (newName && newName !== baseName) {
                fileItem.displayName = newName + ext;
                nameSpan.text(fileItem.displayName);
                
                // Emit rename event
                self._emit('rename', { 
                    file: fileItem.file, 
                    oldName: currentName, 
                    newName: fileItem.displayName 
                });
            }
            cleanup();
        }
        
        function cleanup() {
            input.remove();
            nameSpan.style({ display: '' });
        }
        
        inputEl.addEventListener('blur', save);
        inputEl.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                save();
            } else if (e.key === 'Escape') {
                cleanup();
            }
        });
    };

    FileUpload.prototype.uploadAll = function() {
        var self = this;
        
        var pending = this.files.filter(function(f) {
            return f.status === 'queued';
        });
        
        if (pending.length === 0) return;
        
        this.uploading = true;
        this.container.classAdd('funky-upload--uploading');
        
        // Add all pending to queue
        pending.forEach(function(fileItem) {
            self.queue.pending.push(fileItem);
        });
        
        // Process queue with concurrency limit
        this._processQueue();
        
        this._emitPubSub('started', { 
            files: pending.map(function(f) { return f.file.name; }),
            count: pending.length
        });
    };

    FileUpload.prototype._uploadFile = function(fileItem) {
        var self = this;
        var xhr = new XMLHttpRequest();
        var formData = new FormData();
        
        fileItem.xhr = xhr;
        fileItem.status = 'uploading';
        fileItem.element.classRemove('funky-upload__item--queued');
        fileItem.element.classAdd('funky-upload__item--uploading');
        
        // Emit start event
        this._emit('start', { file: fileItem.file });
        
        formData.append(this.config.fieldName, fileItem.file);
        
        xhr.upload.addEventListener('progress', function(e) {
            if (e.lengthComputable) {
                var percent = Math.round((e.loaded / e.total) * 100);
                fileItem.progress = percent;
                self._updateProgress(fileItem, percent);
                
                if (self.config.onProgress) {
                    self.config.onProgress(fileItem.file, percent);
                }
                
                // Emit DOM event
                self._emit('progress', {
                    file: fileItem.file,
                    percent: percent,
                    loaded: e.loaded,
                    total: e.total
                });
            }
        });
        
        xhr.addEventListener('load', function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                fileItem.status = 'complete';
                fileItem.element.classRemove('funky-upload__item--uploading');
                fileItem.element.classAdd('funky-upload__item--complete');
                
                var response;
                try {
                    response = JSON.parse(xhr.responseText);
                } catch (e) {
                    response = xhr.responseText;
                }
                
                if (self.config.onComplete) {
                    self.config.onComplete(fileItem.file, response);
                }
                
                // Emit DOM event
                self._emit('complete', { file: fileItem.file, response: response });
            } else {
                self._handleUploadError(fileItem, 'Upload failed: ' + xhr.status);
            }
            
            self._checkAllComplete();
        });
        
        xhr.addEventListener('error', function() {
            self._handleUploadError(fileItem, 'Upload failed');
            self._checkAllComplete();
        });
        
        xhr.open(this.config.method, this.config.url);
        xhr.withCredentials = this.config.withCredentials;
        
        // Set headers
        Object.keys(this.config.headers).forEach(function(key) {
            xhr.setRequestHeader(key, self.config.headers[key]);
        });
        
        xhr.send(formData);
    };

    FileUpload.prototype._updateProgress = function(fileItem, percent) {
        var progressBar = fileItem.element.one('.funky-upload__progress-bar');
        if (progressBar) {
            progressBar.style({ width: percent + '%' });
        }
    };

    FileUpload.prototype._handleUploadError = function(fileItem, message) {
        var self = this;
        fileItem.status = 'error';
        fileItem.error = message;
        fileItem.element.classRemove('funky-upload__item--uploading');
        fileItem.element.classAdd('funky-upload__item--error');
        
        // Add retry button
        var actions = fileItem.element.one('.funky-upload__actions');
        if (actions && !actions.one('.funky-upload__retry')) {
            var retryBtn = D.create('button')
                .attr('type', 'button')
                .classAdd('funky-upload__retry')
                .attr('aria-label', 'Retry upload')
                .html('<i class="fas fa-redo"></i>')
                .appendTo(actions);
            
            var retryBtnEl = retryBtn.el || retryBtn;
            retryBtnEl.addEventListener('click', function() {
                self.retryFile(fileItem.id);
            });
        }
        
        if (this.config.onError) {
            this.config.onError(fileItem.file, message);
        }
        
        // Emit DOM event
        this._emit('error', { file: fileItem.file, error: message });
    };

    FileUpload.prototype._checkAllComplete = function() {
        var pending = this.files.filter(function(f) {
            return f.status === 'uploading';
        });
        
        if (pending.length === 0) {
            this.uploading = false;
            this.container.classRemove('funky-upload--uploading');
            this.container.classAdd('funky-upload--complete');
            
            var successful = this.files.filter(function(f) { return f.status === 'complete'; });
            var failed = this.files.filter(function(f) { return f.status === 'error'; });
            
            if (this.config.onAllComplete) {
                this.config.onAllComplete(this.files, successful, failed);
            }
            
            // Emit DOM event
            this._emit('allcomplete', {
                files: this.files,
                successful: successful,
                failed: failed
            });
        }
    };

    FileUpload.prototype.removeFile = function(fileId) {
        var index = -1;
        var fileItem = null;
        
        for (var i = 0; i < this.files.length; i++) {
            if (this.files[i].id === fileId) {
                fileItem = this.files[i];
                index = i;
                break;
            }
        }
        
        if (!fileItem) return;
        
        // Cancel if uploading
        if (fileItem.xhr && fileItem.status === 'uploading') {
            fileItem.xhr.abort();
        }
        
        // Remove from DOM
        if (fileItem.element) {
            fileItem.element.remove();
        }
        
        // Remove from array
        this.files.splice(index, 1);
        
        if (this.config.onRemove) {
            this.config.onRemove(fileItem.file);
        }
        
        // Emit DOM event
        this._emit('remove', { file: fileItem.file, index: index });
        
        this._updateFooter();
    };

    FileUpload.prototype.retryFile = function(fileId) {
        var fileItem = null;
        
        for (var i = 0; i < this.files.length; i++) {
            if (this.files[i].id === fileId) {
                fileItem = this.files[i];
                break;
            }
        }
        
        if (!fileItem || fileItem.status !== 'error') return;
        
        // Reset state
        fileItem.status = 'queued';
        fileItem.progress = 0;
        fileItem.error = null;
        fileItem.element.classRemove('funky-upload__item--error');
        fileItem.element.classAdd('funky-upload__item--queued');
        
        // Remove retry button
        var retryBtn = fileItem.element.one('.funky-upload__retry');
        if (retryBtn) {
            retryBtn.remove();
        }
        
        // Reset progress bar
        var progressBar = fileItem.element.one('.funky-upload__progress-bar');
        if (progressBar) {
            progressBar.style({ width: '0%' });
        }
        
        // Upload
        this._uploadFile(fileItem);
    };

    FileUpload.prototype.clear = function() {
        var self = this;
        var ids = this.files.map(function(f) { return f.id; });
        ids.forEach(function(id) {
            self.removeFile(id);
        });
    };

    FileUpload.prototype._updateFooter = function() {
        if (this.files.length > 0) {
            this.footer.style({ display: 'flex' });
        } else {
            this.footer.style({ display: 'none' });
            this.container.classRemove('funky-upload--complete');
        }
    };

    // Utility methods
    FileUpload.prototype._formatSize = function(bytes) {
        if (bytes === 0) return '0 B';
        var k = 1024;
        var sizes = ['B', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    FileUpload.prototype._getFileIcon = function(file) {
        var type = file.type;
        if (type.startsWith('image/')) return 'fa-image';
        if (type.startsWith('video/')) return 'fa-video';
        if (type.startsWith('audio/')) return 'fa-music';
        if (type === 'application/pdf') return 'fa-file-pdf';
        if (type.indexOf('spreadsheet') !== -1 || type.indexOf('excel') !== -1) return 'fa-file-excel';
        if (type.indexOf('document') !== -1 || type.indexOf('word') !== -1) return 'fa-file-word';
        if (type.indexOf('zip') !== -1 || type.indexOf('compressed') !== -1) return 'fa-file-archive';
        return 'fa-file';
    };

    FileUpload.prototype._getAcceptString = function() {
        if (!this.config.accept) return null;
        return Array.isArray(this.config.accept) 
            ? this.config.accept.join(',') 
            : this.config.accept;
    };

    FileUpload.prototype._getHintText = function() {
        var parts = [];
        if (this.config.maxSize) {
            parts.push('Max ' + this._formatSize(this.config.maxSize));
        }
        if (this.config.accept) {
            var types = Array.isArray(this.config.accept) 
                ? this.config.accept 
                : this.config.accept.split(',');
            parts.push(types.map(function(t) { return t.trim(); }).join(', '));
        }
        return parts.join(' • ') || 'Drop files here';
    };

    FileUpload.prototype._escapeHtml = function(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    };

    FileUpload.prototype._showError = function(file, message) {
        if (Funky.Toast) {
            Funky.Toast.error(file.name + ': ' + message);
        } else {
            console.error('[FileUpload]', file.name, message);
        }

        // Call onError callback for validation errors
        if (this.config.onError) {
            this.config.onError(file, message);
        }

        // Emit DOM event
        this._emit('error', { file: file, error: message });
    };

    // ========================================
    // Phase 2: Clipboard Paste Support
    // ========================================

    /**
     * Initialize clipboard paste handling
     */
    FileUpload.prototype._initPaste = function() {
        var self = this;
        
        this._pasteHandler = function(e) {
            if (!self._isActive()) return;
            
            var items = e.clipboardData && e.clipboardData.items;
            if (!items) return;
            
            var files = [];
            for (var i = 0; i < items.length; i++) {
                if (items[i].kind === 'file') {
                    var file = items[i].getAsFile();
                    if (file) {
                        // Name pasted images with timestamp
                        if (file.type.startsWith('image/') && file.name === 'image.png') {
                            var timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                            file = new File([file], 'pasted-image-' + timestamp + '.png', {
                                type: file.type
                            });
                        }
                        files.push(file);
                    }
                }
            }
            
            if (files.length > 0) {
                e.preventDefault();
                self._handleFiles(files);
                
                // Emit paste event
                self._emit('paste', { files: files });
            }
        };
        
        document.addEventListener('paste', this._pasteHandler);
    };

    /**
     * Check if upload zone is active (visible and focused)
     */
    FileUpload.prototype._isActive = function() {
        var el = this.container.el || this.container;
        return document.body.contains(el) && 
               (document.activeElement === el || el.contains(document.activeElement));
    };

    // ========================================
    // Phase 2: Drag Reorder
    // ========================================

    /**
     * Initialize drag-to-reorder functionality
     */
    FileUpload.prototype._initSortable = function() {
        var self = this;
        var list = this.list.el || this.list;
        var dragging = null;
        var placeholder = null;
        
        list.addEventListener('dragstart', function(e) {
            var item = e.target.closest('.funky-upload__item');
            if (!item) return;
            
            dragging = item;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', item.dataset.fileId);
            
            requestAnimationFrame(function() {
                item.classList.add('funky-upload__item--dragging');
            });
            
            // Create placeholder
            placeholder = document.createElement('li');
            placeholder.className = 'funky-upload__placeholder';
            placeholder.style.height = item.offsetHeight + 'px';
        });
        
        list.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            var target = e.target.closest('.funky-upload__item');
            if (!target || target === dragging || target === placeholder) return;
            
            var rect = target.getBoundingClientRect();
            var midY = rect.top + rect.height / 2;
            
            if (e.clientY < midY) {
                target.parentNode.insertBefore(placeholder, target);
            } else {
                target.parentNode.insertBefore(placeholder, target.nextSibling);
            }
        });
        
        list.addEventListener('dragend', function() {
            if (dragging) {
                dragging.classList.remove('funky-upload__item--dragging');
            }
            if (placeholder && placeholder.parentNode) {
                if (dragging) {
                    placeholder.parentNode.insertBefore(dragging, placeholder);
                }
                placeholder.parentNode.removeChild(placeholder);
            }
            
            // Update internal order
            self._syncFileOrder();
            
            dragging = null;
            placeholder = null;
        });
    };

    /**
     * Sync internal file array with DOM order
     */
    FileUpload.prototype._syncFileOrder = function() {
        var self = this;
        var list = this.list.el || this.list;
        var items = list.querySelectorAll('.funky-upload__item');
        var newOrder = [];
        
        for (var i = 0; i < items.length; i++) {
            var id = items[i].dataset.fileId;
            for (var j = 0; j < self.files.length; j++) {
                if (self.files[j].id === id) {
                    newOrder.push(self.files[j]);
                    break;
                }
            }
        }
        
        this.files = newOrder;
        
        if (this.config.onReorder) {
            this.config.onReorder(this.files);
        }
        
        // Emit reorder event
        this._emit('reorder', { files: this.files });
    };

    // ========================================
    // Phase 2: Lightbox Preview
    // ========================================

    /**
     * Initialize lightbox click handler
     */
    FileUpload.prototype._initLightbox = function() {
        var self = this;
        
        var listEl = this.list.el || this.list;
        listEl.addEventListener('click', function(e) {
            var preview = e.target.closest('.funky-upload__preview--image');
            if (!preview) return;
            
            var item = e.target.closest('.funky-upload__item');
            if (!item) return;
            
            var fileId = item.dataset.fileId;
            var fileItem = null;
            for (var i = 0; i < self.files.length; i++) {
                if (self.files[i].id === fileId) {
                    fileItem = self.files[i];
                    break;
                }
            }
            
            if (!fileItem || !fileItem.file.type.startsWith('image/')) return;
            
            self._showLightbox(fileItem);
        });
    };

    /**
     * Show lightbox with full-size image
     */
    FileUpload.prototype._showLightbox = function(fileItem) {
        var overlay = D.create('div')
            .classAdd('funky-upload__lightbox')
            .html(
                '<button class="funky-upload__lightbox-close" aria-label="Close">' +
                    '<i class="fas fa-times"></i>' +
                '</button>' +
                '<div class="funky-upload__lightbox-content">' +
                    '<img class="funky-upload__lightbox-img" alt="' + this._escapeHtml(fileItem.file.name) + '">' +
                '</div>'
            )
            .appendTo(document.body);
        
        var img = overlay.one('.funky-upload__lightbox-img');
        var reader = new FileReader();
        
        reader.onload = function(e) {
            img.attr('src', e.target.result);
        };
        reader.readAsDataURL(fileItem.file);
        
        // Keyboard cleanup function
        var keyboardUnregister = null;

        // Close handlers
        function close() {
            overlay.remove();
            if (keyboardUnregister) {
                keyboardUnregister();
                keyboardUnregister = null;
            }
            if (Funky.Keyboard) {
                Funky.Keyboard.popScope();
            }
        }

        // Register Escape key with Funky.Keyboard
        if (Funky.Keyboard) {
            Funky.Keyboard.pushScope('file-upload-lightbox');
            keyboardUnregister = Funky.Keyboard.register({
                key: 'escape',
                scope: 'file-upload-lightbox',
                handler: close,
                description: 'Close lightbox',
                group: 'File Upload',
                preventDefault: true
            });
        } else {
            // Fallback for environments without Funky.Keyboard
            var handleKey = function(e) {
                if (e.key === 'Escape') close();
            };
            document.addEventListener('keydown', handleKey);
            keyboardUnregister = function() {
                document.removeEventListener('keydown', handleKey);
            };
        }

        var overlayEl = overlay.el || overlay;
        overlayEl.addEventListener('click', function(e) {
            if (e.target === overlayEl || e.target.closest('.funky-upload__lightbox-close')) close();
        });
        
        // Focus trap
        var closeBtn = overlay.one('.funky-upload__lightbox-close');
        var closeBtnEl = closeBtn.el || closeBtn;
        closeBtnEl.focus();
    };

    // ========================================
    // Phase 3: Upload Queue
    // ========================================

    /**
     * Initialize upload queue
     */
    FileUpload.prototype._initQueue = function() {
        var self = this;
        var PubSub = Funky.PubSub;
        
        // Try to use JobQueue if available and enabled
        if (this.config.useJobQueue && Funky.JobQueue) {
            this._initJobQueue();
        }
        
        // Emit init event via PubSub
        if (PubSub) {
            PubSub.emit('funky:file-upload:init', {
                uploadId: this.id,
                config: this.config
            });
        }
    };

    /**
     * Initialize with Funky.JobQueue for advanced queue management
     */
    FileUpload.prototype._initJobQueue = function() {
        var self = this;
        var JobQueue = Funky.JobQueue;
        var PubSub = Funky.PubSub;
        
        this.jobQueue = new JobQueue({
            name: 'file-upload-' + this.id,
            processor: function(job) {
                return self._processUploadJob(job);
            },
            persist: this.config.persistQueue,
            autoProcess: false,
            maxAttempts: this.config.maxRetries,
            timeout: 0,
            retryDelay: this.config.retryDelay,
            backoffMultiplier: this.config.backoffMultiplier
        });
        
        // Bind queue events to PubSub
        if (PubSub) {
            this.jobQueue.on('success', function(data) {
                PubSub.emit('funky:file-upload:job-complete', {
                    uploadId: self.id,
                    job: data.job,
                    result: data.result
                });
            });
            
            this.jobQueue.on('failed', function(data) {
                PubSub.emit('funky:file-upload:job-failed', {
                    uploadId: self.id,
                    job: data.job,
                    error: data.error
                });
            });
            
            this.jobQueue.on('empty', function() {
                PubSub.emit('funky:file-upload:queue-empty', {
                    uploadId: self.id
                });
            });
        }
    };

    /**
     * Process upload job (for JobQueue)
     */
    FileUpload.prototype._processUploadJob = function(job) {
        var self = this;
        var fileItem = this._getFileById(job.data.fileId);
        
        if (!fileItem) {
            return Promise.reject(new Error('File not found: ' + job.data.fileId));
        }
        
        return this._uploadFileInternal(fileItem);
    };

    /**
     * Get file by ID
     */
    FileUpload.prototype._getFileById = function(fileId) {
        for (var i = 0; i < this.files.length; i++) {
            if (this.files[i].id === fileId) {
                return this.files[i];
            }
        }
        return null;
    };

    /**
     * Process upload queue with concurrency limit
     */
    FileUpload.prototype._processQueue = function() {
        var self = this;
        
        while (
            this.queue.pending.length > 0 && 
            this.queue.active.length < this.queue.maxConcurrent
        ) {
            var fileItem = this.queue.pending.shift();
            this.queue.active.push(fileItem);
            
            this._uploadFileInternal(fileItem).then(function() {
                self._removeFromActive(fileItem);
                self._processQueue();
            }).catch(function() {
                self._removeFromActive(fileItem);
                self._processQueue();
            });
        }
    };

    /**
     * Remove file from active queue
     */
    FileUpload.prototype._removeFromActive = function(fileItem) {
        var index = this.queue.active.indexOf(fileItem);
        if (index > -1) {
            this.queue.active.splice(index, 1);
        }
    };

    /**
     * Internal upload with retry support
     */
    FileUpload.prototype._uploadFileInternal = function(fileItem) {
        var self = this;
        var file = fileItem.file;
        
        // Initialize speed tracking
        if (this.config.showSpeed) {
            this._initSpeedTracking(fileItem);
        }
        
        // Determine upload method
        if (this.config.useS3 && this.config.presignUrl) {
            return this._uploadToS3(fileItem);
        } else if (this.config.chunked || (this.config.chunkThreshold && file.size > this.config.chunkThreshold)) {
            return this._uploadFileChunked(fileItem);
        } else {
            return this._uploadWithRetry(fileItem, 1);
        }
    };

    // ========================================
    // Phase 3: Chunked Uploads
    // ========================================

    /**
     * Upload file in chunks
     */
    FileUpload.prototype._uploadFileChunked = function(fileItem) {
        var self = this;
        var file = fileItem.file;
        var chunkSize = this.config.chunkSize;
        var totalChunks = Math.ceil(file.size / chunkSize);
        var currentChunk = fileItem.chunks ? fileItem.chunks.current : 0;
        var uploadedBytes = currentChunk * chunkSize;
        
        // Initialize chunk tracking
        if (!fileItem.chunks) {
            fileItem.chunks = {
                total: totalChunks,
                current: 0,
                uploadId: null,
                etags: []
            };
        }
        
        fileItem.status = 'uploading';
        fileItem.element.classRemove('funky-upload__item--queued');
        fileItem.element.classAdd('funky-upload__item--uploading');
        
        this._emit('start', { file: file });
        this._emitPubSub('processing', { file: file.name });
        
        return new Promise(function(resolve, reject) {
            // Initialize multipart upload
            self._initChunkedUpload(fileItem)
                .then(function() {
                    return self._uploadChunks(fileItem, currentChunk, uploadedBytes);
                })
                .then(function() {
                    return self._completeChunkedUpload(fileItem);
                })
                .then(function(result) {
                    self._handleUploadSuccess(fileItem, result);
                    resolve(result);
                })
                .catch(function(error) {
                    if (error.message !== 'Upload paused') {
                        self._handleUploadError(fileItem, error.message);
                    }
                    reject(error);
                });
        });
    };

    /**
     * Initialize chunked upload
     */
    FileUpload.prototype._initChunkedUpload = function(fileItem) {
        var self = this;
        var file = fileItem.file;
        var initUrl = this.config.initUrl || this.config.url + '/init';
        
        return fetch(initUrl, {
            method: 'POST',
            headers: Object.assign({
                'Content-Type': 'application/json'
            }, this.config.headers),
            credentials: this.config.withCredentials ? 'include' : 'same-origin',
            body: JSON.stringify({
                filename: fileItem.displayName || file.name,
                filesize: file.size,
                filetype: file.type,
                chunks: fileItem.chunks.total
            })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            fileItem.chunks.uploadId = data.uploadId;
            return data;
        });
    };

    /**
     * Upload all chunks sequentially
     */
    FileUpload.prototype._uploadChunks = function(fileItem, startChunk, uploadedBytes) {
        var self = this;
        var file = fileItem.file;
        var chunkSize = this.config.chunkSize;
        var totalChunks = fileItem.chunks.total;
        
        function uploadNextChunk(chunkIndex) {
            if (fileItem.status === 'paused') {
                return Promise.reject(new Error('Upload paused'));
            }
            
            if (chunkIndex >= totalChunks) {
                return Promise.resolve();
            }
            
            var start = chunkIndex * chunkSize;
            var end = Math.min(start + chunkSize, file.size);
            var chunk = file.slice(start, end);
            
            return self._uploadSingleChunk(fileItem, chunk, chunkIndex, uploadedBytes)
                .then(function(result) {
                    fileItem.chunks.etags.push(result.etag);
                    fileItem.chunks.current = chunkIndex + 1;
                    uploadedBytes = end;
                    
                    // Update chunk display
                    self._updateChunkDisplay(fileItem);
                    
                    return uploadNextChunk(chunkIndex + 1);
                });
        }
        
        return uploadNextChunk(startChunk);
    };

    /**
     * Upload a single chunk
     */
    FileUpload.prototype._uploadSingleChunk = function(fileItem, chunk, chunkIndex, uploadedBytes) {
        var self = this;
        var chunkUrl = this.config.chunkUrl || this.config.url + '/chunk';
        
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            var formData = new FormData();
            
            fileItem.xhr = xhr;
            
            formData.append('chunk', chunk);
            formData.append('chunkIndex', chunkIndex);
            formData.append('uploadId', fileItem.chunks.uploadId);
            formData.append('filename', fileItem.displayName || fileItem.file.name);
            
            xhr.upload.addEventListener('progress', function(e) {
                if (e.lengthComputable) {
                    var totalProgress = uploadedBytes + e.loaded;
                    var percent = Math.round((totalProgress / fileItem.file.size) * 100);
                    
                    self._updateProgress(fileItem, percent);
                    
                    if (self.config.showSpeed) {
                        self._updateSpeed(fileItem, totalProgress);
                    }
                    
                    if (self.config.onProgress) {
                        self.config.onProgress(fileItem.file, percent, {
                            loaded: totalProgress,
                            total: fileItem.file.size,
                            chunk: chunkIndex + 1,
                            totalChunks: fileItem.chunks.total
                        });
                    }
                    
                    self._emit('progress', {
                        file: fileItem.file,
                        percent: percent,
                        loaded: totalProgress,
                        total: fileItem.file.size
                    });
                }
            });
            
            xhr.addEventListener('load', function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        resolve(JSON.parse(xhr.responseText));
                    } catch (e) {
                        resolve({ etag: 'chunk-' + chunkIndex });
                    }
                } else {
                    reject(new Error('Chunk upload failed: ' + xhr.status));
                }
            });
            
            xhr.addEventListener('error', function() {
                reject(new Error('Network error'));
            });
            
            xhr.open('POST', chunkUrl);
            xhr.withCredentials = self.config.withCredentials;
            
            Object.keys(self.config.headers).forEach(function(key) {
                xhr.setRequestHeader(key, self.config.headers[key]);
            });
            
            xhr.send(formData);
        });
    };

    /**
     * Complete chunked upload
     */
    FileUpload.prototype._completeChunkedUpload = function(fileItem) {
        var completeUrl = this.config.completeUrl || this.config.url + '/complete';
        
        return fetch(completeUrl, {
            method: 'POST',
            headers: Object.assign({
                'Content-Type': 'application/json'
            }, this.config.headers),
            credentials: this.config.withCredentials ? 'include' : 'same-origin',
            body: JSON.stringify({
                uploadId: fileItem.chunks.uploadId,
                filename: fileItem.displayName || fileItem.file.name,
                etags: fileItem.chunks.etags
            })
        })
        .then(function(res) { return res.json(); });
    };

    /**
     * Update chunk progress display
     */
    FileUpload.prototype._updateChunkDisplay = function(fileItem) {
        var chunksEl = fileItem.element.one('.funky-upload__chunks');
        if (!chunksEl) {
            chunksEl = D.create('span')
                .classAdd('funky-upload__chunks')
                .appendTo(fileItem.element.one('.funky-upload__info'));
        }
        chunksEl.text('Chunk ' + fileItem.chunks.current + '/' + fileItem.chunks.total);
    };

    // ========================================
    // Phase 3: Pause/Resume
    // ========================================

    /**
     * Pause upload
     */
    FileUpload.prototype.pause = function(fileId) {
        var fileItem = this._getFileById(fileId);
        if (!fileItem || fileItem.status !== 'uploading') return;
        
        fileItem.status = 'paused';
        
        // Abort current XHR
        if (fileItem.xhr) {
            fileItem.xhr.abort();
        }
        
        fileItem.element.classRemove('funky-upload__item--uploading');
        fileItem.element.classAdd('funky-upload__item--paused');
        
        this._showPauseResumeButton(fileItem, 'resume');
        
        if (this.config.onPause) {
            this.config.onPause(fileItem.file);
        }
        
        this._emit('pause', { file: fileItem.file });
        this._emitPubSub('paused', { file: fileItem.file.name });
    };

    /**
     * Resume upload
     */
    FileUpload.prototype.resume = function(fileId) {
        var fileItem = this._getFileById(fileId);
        if (!fileItem || fileItem.status !== 'paused') return;
        
        fileItem.element.classRemove('funky-upload__item--paused');
        
        // Remove pause/resume button
        var pauseBtn = fileItem.element.one('.funky-upload__pause');
        if (pauseBtn) pauseBtn.remove();
        
        if (fileItem.chunks && fileItem.chunks.uploadId) {
            // Resume chunked upload
            this._uploadFileChunked(fileItem);
        } else {
            // Restart regular upload
            fileItem.status = 'queued';
            this.queue.pending.push(fileItem);
            this._processQueue();
        }
        
        if (this.config.onResume) {
            this.config.onResume(fileItem.file);
        }
        
        this._emit('resume', { file: fileItem.file });
        this._emitPubSub('resumed', { file: fileItem.file.name });
    };

    /**
     * Show pause or resume button
     */
    FileUpload.prototype._showPauseResumeButton = function(fileItem, action) {
        var self = this;
        var actions = fileItem.element.one('.funky-upload__actions');
        
        // Remove existing button
        var existing = actions.one('.funky-upload__pause');
        if (existing) existing.remove();
        
        var icon = action === 'pause' ? 'fa-pause' : 'fa-play';
        var label = action === 'pause' ? 'Pause upload' : 'Resume upload';
        
        var btn = D.create('button')
            .classAdd('funky-upload__pause')
            .attr('type', 'button')
            .attr('aria-label', label)
            .attr('data-action', action)
            .html('<i class="fas ' + icon + '"></i>')
            .prependTo(actions);
        
        var btnEl = btn.el || btn;
        btnEl.addEventListener('click', function() {
            if (action === 'pause') {
                self.pause(fileItem.id);
            } else {
                self.resume(fileItem.id);
            }
        });
    };

    // ========================================
    // Phase 3: Retry with Backoff
    // ========================================

    /**
     * Upload with automatic retry and exponential backoff
     */
    FileUpload.prototype._uploadWithRetry = function(fileItem, attempt) {
        var self = this;
        var maxRetries = this.config.maxRetries;
        
        return this._doUpload(fileItem).catch(function(error) {
            if (attempt >= maxRetries) {
                throw error;
            }
            
            // Exponential backoff
            var delay = Math.pow(self.config.backoffMultiplier, attempt - 1) * self.config.retryDelay;
            
            fileItem.element.classAdd('funky-upload__item--retrying');
            self._showRetryStatus(fileItem, attempt, maxRetries, delay);
            
            if (self.config.onRetry) {
                self.config.onRetry(fileItem.file, attempt);
            }
            
            return new Promise(function(resolve) {
                setTimeout(resolve, delay);
            }).then(function() {
                fileItem.element.classRemove('funky-upload__item--retrying');
                self._clearRetryStatus(fileItem);
                return self._uploadWithRetry(fileItem, attempt + 1);
            });
        });
    };

    /**
     * Perform actual upload
     */
    FileUpload.prototype._doUpload = function(fileItem) {
        var self = this;
        var file = fileItem.file;
        
        fileItem.status = 'uploading';
        fileItem.element.classRemove('funky-upload__item--queued', 'funky-upload__item--error');
        fileItem.element.classAdd('funky-upload__item--uploading');
        
        this._emit('start', { file: file });
        this._emitPubSub('processing', { file: file.name });
        
        // Show pause button for chunked uploads
        if (this.config.chunked) {
            this._showPauseResumeButton(fileItem, 'pause');
        }
        
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            var formData = new FormData();
            
            fileItem.xhr = xhr;
            
            formData.append(self.config.fieldName, file, fileItem.displayName || file.name);
            
            // Add metadata if any
            if (fileItem.metadata) {
                Object.keys(fileItem.metadata).forEach(function(key) {
                    formData.append(key, fileItem.metadata[key]);
                });
            }
            
            xhr.upload.addEventListener('progress', function(e) {
                if (e.lengthComputable) {
                    var percent = Math.round((e.loaded / e.total) * 100);
                    fileItem.progress = percent;
                    self._updateProgress(fileItem, percent);
                    
                    if (self.config.showSpeed) {
                        self._updateSpeed(fileItem, e.loaded);
                    }
                    
                    if (self.config.onProgress) {
                        self.config.onProgress(file, percent);
                    }
                    
                    self._emit('progress', {
                        file: file,
                        percent: percent,
                        loaded: e.loaded,
                        total: e.total
                    });
                }
            });
            
            xhr.addEventListener('load', function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    var response;
                    try {
                        response = JSON.parse(xhr.responseText);
                    } catch (e) {
                        response = { url: xhr.responseText };
                    }
                    
                    self._handleUploadSuccess(fileItem, response);
                    resolve(response);
                } else {
                    var error = self._parseErrorResponse(xhr);
                    reject(error);
                }
            });
            
            xhr.addEventListener('error', function() {
                reject(new Error('Network error'));
            });
            
            xhr.open(self.config.method, self.config.url);
            xhr.withCredentials = self.config.withCredentials;
            
            Object.keys(self.config.headers).forEach(function(key) {
                xhr.setRequestHeader(key, self.config.headers[key]);
            });
            
            xhr.send(formData);
        });
    };

    /**
     * Show retry status
     */
    FileUpload.prototype._showRetryStatus = function(fileItem, attempt, max, delay) {
        var status = fileItem.element.one('.funky-upload__status');
        if (!status) {
            status = D.create('span')
                .classAdd('funky-upload__status')
                .appendTo(fileItem.element.one('.funky-upload__info'));
        }
        status.text('Retry ' + attempt + '/' + max + ' in ' + (delay / 1000) + 's...');
    };

    /**
     * Clear retry status
     */
    FileUpload.prototype._clearRetryStatus = function(fileItem) {
        var status = fileItem.element.one('.funky-upload__status');
        if (status) status.remove();
    };

    /**
     * Parse error response from server
     */
    FileUpload.prototype._parseErrorResponse = function(xhr) {
        try {
            var response = JSON.parse(xhr.responseText);
            return new Error(response.message || response.error || 'Upload failed: ' + xhr.status);
        } catch (e) {
            return new Error('Upload failed: ' + xhr.status);
        }
    };

    /**
     * Handle successful upload
     */
    FileUpload.prototype._handleUploadSuccess = function(fileItem, response) {
        fileItem.status = 'complete';
        fileItem.response = response;
        fileItem.element.classRemove('funky-upload__item--uploading');
        fileItem.element.classAdd('funky-upload__item--complete');
        
        // Remove pause button
        var pauseBtn = fileItem.element.one('.funky-upload__pause');
        if (pauseBtn) pauseBtn.remove();
        
        // Clear speed display
        var speedEl = fileItem.element.one('.funky-upload__speed');
        if (speedEl) speedEl.remove();
        
        if (this.config.onComplete) {
            this.config.onComplete(fileItem.file, response);
        }
        
        this._emit('complete', { file: fileItem.file, response: response });
        this._emitPubSub('job-complete', { file: fileItem.file.name, response: response });
        
        this._checkAllComplete();
    };

    // ========================================
    // Phase 3: S3 Direct Upload
    // ========================================

    /**
     * Upload directly to S3 via presigned URL
     */
    FileUpload.prototype._uploadToS3 = function(fileItem) {
        var self = this;
        var file = fileItem.file;
        
        fileItem.status = 'uploading';
        fileItem.element.classRemove('funky-upload__item--queued');
        fileItem.element.classAdd('funky-upload__item--uploading');
        
        this._emit('start', { file: file });
        
        return fetch(this.config.presignUrl, {
            method: 'POST',
            headers: Object.assign({
                'Content-Type': 'application/json'
            }, this.config.headers),
            credentials: this.config.withCredentials ? 'include' : 'same-origin',
            body: JSON.stringify({
                filename: fileItem.displayName || file.name,
                filetype: file.type,
                filesize: file.size
            })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            return self._uploadToPresignedUrl(fileItem, data.url, data.fields);
        })
        .then(function(result) {
            self._handleUploadSuccess(fileItem, result);
            return result;
        })
        .catch(function(error) {
            self._handleUploadError(fileItem, error.message);
            throw error;
        });
    };

    /**
     * Upload to presigned S3 URL
     */
    FileUpload.prototype._uploadToPresignedUrl = function(fileItem, url, fields) {
        var self = this;
        var file = fileItem.file;
        
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            var formData = new FormData();
            
            fileItem.xhr = xhr;
            
            // Add presigned fields first
            if (fields) {
                Object.keys(fields).forEach(function(key) {
                    formData.append(key, fields[key]);
                });
            }
            
            // File must be last for S3
            formData.append('file', file);
            
            xhr.upload.addEventListener('progress', function(e) {
                if (e.lengthComputable) {
                    var percent = Math.round((e.loaded / e.total) * 100);
                    self._updateProgress(fileItem, percent);
                    
                    if (self.config.showSpeed) {
                        self._updateSpeed(fileItem, e.loaded);
                    }
                    
                    if (self.config.onProgress) {
                        self.config.onProgress(file, percent);
                    }
                    
                    self._emit('progress', {
                        file: file,
                        percent: percent,
                        loaded: e.loaded,
                        total: e.total
                    });
                }
            });
            
            xhr.addEventListener('load', function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve({ url: url.split('?')[0] });
                } else {
                    reject(new Error('S3 upload failed: ' + xhr.status));
                }
            });
            
            xhr.addEventListener('error', function() {
                reject(new Error('Network error'));
            });
            
            xhr.open('POST', url);
            xhr.send(formData);
        });
    };

    // ========================================
    // Phase 3: Speed Tracking
    // ========================================

    /**
     * Initialize speed tracking for file
     */
    FileUpload.prototype._initSpeedTracking = function(fileItem) {
        fileItem.speedTracker = {
            samples: [],
            maxSamples: 5,
            lastBytes: 0,
            lastTime: Date.now()
        };
    };

    /**
     * Update upload speed
     */
    FileUpload.prototype._updateSpeed = function(fileItem, loadedBytes) {
        var tracker = fileItem.speedTracker;
        if (!tracker) {
            this._initSpeedTracking(fileItem);
            tracker = fileItem.speedTracker;
        }
        
        var now = Date.now();
        var timeDiff = (now - tracker.lastTime) / 1000;
        var bytesDiff = loadedBytes - tracker.lastBytes;
        
        if (timeDiff >= 0.5) {
            var speed = bytesDiff / timeDiff;
            
            tracker.samples.push(speed);
            if (tracker.samples.length > tracker.maxSamples) {
                tracker.samples.shift();
            }
            
            var avgSpeed = tracker.samples.reduce(function(a, b) { return a + b; }, 0) / tracker.samples.length;
            
            var remaining = fileItem.file.size - loadedBytes;
            var timeRemaining = remaining / avgSpeed;
            
            if (this.config.showSpeed || this.config.showTimeRemaining) {
                this._updateSpeedDisplay(fileItem, avgSpeed, timeRemaining);
            }
            
            tracker.lastBytes = loadedBytes;
            tracker.lastTime = now;
        }
    };

    /**
     * Update speed display element
     */
    FileUpload.prototype._updateSpeedDisplay = function(fileItem, speed, timeRemaining) {
        var speedEl = fileItem.element.one('.funky-upload__speed');
        if (!speedEl) {
            speedEl = D.create('span')
                .classAdd('funky-upload__speed')
                .appendTo(fileItem.element.one('.funky-upload__info'));
        }
        
        var text = '';
        if (this.config.showSpeed) {
            text += this._formatSize(speed) + '/s';
        }
        if (this.config.showTimeRemaining && timeRemaining > 0 && isFinite(timeRemaining)) {
            if (text) text += ' • ';
            text += this._formatTime(timeRemaining) + ' remaining';
        }
        
        speedEl.text(text);
    };

    /**
     * Format time in human readable format
     */
    FileUpload.prototype._formatTime = function(seconds) {
        if (!isFinite(seconds) || seconds < 0) return '--';
        
        if (seconds < 60) {
            return Math.round(seconds) + 's';
        } else if (seconds < 3600) {
            return Math.round(seconds / 60) + 'm';
        } else {
            var hours = Math.floor(seconds / 3600);
            var mins = Math.round((seconds % 3600) / 60);
            return hours + 'h ' + mins + 'm';
        }
    };

    // ========================================
    // Phase 3: PubSub Integration
    // ========================================

    /**
     * Emit event via PubSub
     */
    FileUpload.prototype._emitPubSub = function(eventName, data) {
        var PubSub = Funky.PubSub;
        if (!PubSub) return;
        
        PubSub.emit('funky:file-upload:' + eventName, Object.assign({
            uploadId: this.id
        }, data));
    };

    // ========================================
    // Phase 3 & 7: Form Integration
    // ========================================

    /**
     * Attach to form for submit handling
     * @param {string|Element} formSelector - Form selector or element
     * @param {object} options - Form integration options
     */
    FileUpload.prototype.attachToForm = function(formSelector, options) {
        var self = this;
        var form = D.one(formSelector);
        if (!form) return this;
        
        var formEl = form.el || form;
        this.form = formEl;
        this.formOptions = Object.assign({
            uploadOnSubmit: true,
            preventSubmitUntilComplete: true,
            populateHiddenInputs: true,
            hiddenInputName: this.config.fieldName + '_urls',
            submitOnAllComplete: true
        }, options);
        
        // Store bound handler for removal
        this._formSubmitHandler = function(e) {
            self._handleFormSubmit(e);
        };
        
        formEl.addEventListener('submit', this._formSubmitHandler);
        
        // Handle form reset
        this._formResetHandler = function() {
            self.clear();
        };
        formEl.addEventListener('reset', this._formResetHandler);
        
        return this;
    };

    /**
     * Handle form submit - upload pending files and populate hidden inputs
     */
    FileUpload.prototype._handleFormSubmit = function(e) {
        var self = this;
        var opts = this.formOptions;
        
        var pending = this.files.filter(function(f) {
            return f.status === 'queued';
        });
        
        var uploading = this.files.filter(function(f) {
            return f.status === 'uploading';
        });
        
        if (pending.length > 0 || uploading.length > 0) {
            if (opts.preventSubmitUntilComplete) {
                e.preventDefault();
                
                if (pending.length > 0 && opts.uploadOnSubmit) {
                    this.uploadAll();
                }
                
                var originalCallback = this.config.onAllComplete;
                this.config.onAllComplete = function(files, successful, failed) {
                    if (originalCallback) {
                        originalCallback.call(self, files, successful, failed);
                    }
                    
                    self.config.onAllComplete = originalCallback;
                    
                    if (failed.length > 0) {
                        if (Funky.Toast) {
                            Funky.Toast.error(failed.length + ' file(s) failed to upload');
                        }
                        return;
                    }
                    
                    if (opts.populateHiddenInputs) {
                        self._populateHiddenInputs();
                    }
                    
                    if (opts.submitOnAllComplete) {
                        self.form.removeEventListener('submit', self._formSubmitHandler);
                        self.form.submit();
                    }
                };
            }
        } else if (opts.populateHiddenInputs) {
            this._populateHiddenInputs();
        }
    };

    /**
     * Populate hidden inputs with uploaded file data
     */
    FileUpload.prototype._populateHiddenInputs = function() {
        var self = this;
        var name = this.formOptions.hiddenInputName;
        
        var existing = this.form.querySelectorAll('input[name^="' + name + '"]');
        Array.prototype.forEach.call(existing, function(input) {
            input.remove();
        });
        
        var uploaded = this.files.filter(function(f) {
            return f.status === 'complete' && f.response;
        });
        
        uploaded.forEach(function(fileItem, index) {
            var input = document.createElement('input');
            input.type = 'hidden';
            input.name = name + '[' + index + ']';
            input.value = JSON.stringify({
                url: fileItem.response.url,
                name: fileItem.displayName || fileItem.file.name,
                size: fileItem.file.size,
                type: fileItem.file.type
            });
            self.form.appendChild(input);
        });
    };

    /**
     * Get form-compatible value
     */
    FileUpload.prototype.getValue = function() {
        return this.files
            .filter(function(f) { return f.status === 'complete'; })
            .map(function(f) {
                return {
                    url: f.response && f.response.url,
                    name: f.displayName || f.file.name,
                    size: f.file.size,
                    type: f.file.type
                };
            });
    };

    /**
     * Set value from existing data (pre-populate)
     */
    FileUpload.prototype.setValue = function(files) {
        var self = this;
        
        this.clear();
        
        if (!files) return this;
        if (!Array.isArray(files)) {
            files = [files];
        }
        
        files.forEach(function(fileData) {
            if (!fileData || !fileData.url) return;
            
            var fileItem = {
                id: 'file-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                file: {
                    name: fileData.name || 'file',
                    size: fileData.size || 0,
                    type: fileData.type || 'application/octet-stream'
                },
                status: 'complete',
                progress: 100,
                response: { url: fileData.url },
                isPreloaded: true
            };
            
            self.files.push(fileItem);
            self._renderPreloadedItem(fileItem);
        });
        
        this._updateFooter();
        return this;
    };

    /**
     * Render a pre-loaded file item
     */
    FileUpload.prototype._renderPreloadedItem = function(fileItem) {
        var self = this;
        var file = fileItem.file;
        
        var li = D.create('li')
            .classAdd('funky-upload__item', 'funky-upload__item--complete', 'funky-upload__item--preloaded')
            .attr('data-file-id', fileItem.id);
        
        var preview = D.create('div')
            .classAdd('funky-upload__preview')
            .appendTo(li);
        
        if (file.type && file.type.indexOf('image/') === 0 && fileItem.response.url) {
            D.create('img')
                .attr('src', fileItem.response.url)
                .attr('alt', file.name)
                .classAdd('funky-upload__thumbnail')
                .appendTo(preview);
            preview.classAdd('funky-upload__preview--image');
        } else {
            preview.html('<i class="fas ' + this._getFileIcon(file) + '"></i>');
        }
        
        var info = D.create('div')
            .classAdd('funky-upload__info')
            .appendTo(li);
        
        D.create('span')
            .classAdd('funky-upload__name')
            .text(file.name)
            .appendTo(info);
        
        D.create('span')
            .classAdd('funky-upload__size')
            .text(this._formatSize(file.size))
            .appendTo(info);
        
        D.create('span')
            .classAdd('funky-upload__status', 'funky-upload__status--uploaded')
            .text('Uploaded')
            .appendTo(info);
        
        var actions = D.create('div')
            .classAdd('funky-upload__actions')
            .appendTo(li);
        
        var removeBtn = D.create('button')
            .classAdd('funky-upload__remove')
            .attr('type', 'button')
            .attr('aria-label', 'Remove file')
            .html('<i class="fas fa-times"></i>')
            .appendTo(actions);
        
        var removeBtnEl = removeBtn.el || removeBtn;
        removeBtnEl.addEventListener('click', function() {
            self.removeFile(fileItem.id);
        });
        
        li.appendTo(this.list);
        fileItem.element = li;
    };

    /**
     * Bind to a LiveBinding model
     */
    FileUpload.prototype.bindToModel = function(model, property) {
        var self = this;
        
        function chainCallback(existing, fn) {
            return function() {
                if (existing) existing.apply(self, arguments);
                fn.apply(self, arguments);
            };
        }
        
        function updateModel() {
            var value = self.getValue();
            if (model.set) {
                model.set(property, value);
            } else {
                model[property] = value;
            }
        }
        
        var initialValue = model.get ? model.get(property) : model[property];
        if (initialValue) {
            this.setValue(initialValue);
        }
        
        this.config.onComplete = chainCallback(this.config.onComplete, updateModel);
        this.config.onRemove = chainCallback(this.config.onRemove, updateModel);
        
        if (Funky.LiveBinding && model._isLiveBindingModel) {
            Funky.LiveBinding.watch(model, property, function(newValue) {
                self.setValue(newValue || []);
            });
        }
        
        return this;
    };

    /**
     * Persist state to sessionStorage for wizard support
     */
    FileUpload.prototype.persistState = function(key) {
        var self = this;
        key = key || 'funky-upload-' + this.id;
        this._persistKey = key;
        
        function chainCallback(existing, fn) {
            return function() {
                if (existing) existing.apply(self, arguments);
                fn.apply(self, arguments);
            };
        }
        
        function save() {
            var state = self.files.map(function(f) {
                return {
                    id: f.id,
                    name: f.displayName || f.file.name,
                    size: f.file.size,
                    type: f.file.type,
                    status: f.status,
                    url: f.response && f.response.url
                };
            });
            
            try {
                sessionStorage.setItem(key, JSON.stringify(state));
            } catch (e) {
                console.warn('[FileUpload] Failed to persist state:', e);
            }
        }
        
        this.config.onAdd = chainCallback(this.config.onAdd, save);
        this.config.onRemove = chainCallback(this.config.onRemove, save);
        this.config.onComplete = chainCallback(this.config.onComplete, save);
        
        try {
            var saved = sessionStorage.getItem(key);
            if (saved) {
                var state = JSON.parse(saved);
                var completed = state.filter(function(f) {
                    return f.status === 'complete' && f.url;
                });
                if (completed.length > 0) {
                    this.setValue(completed);
                }
            }
        } catch (e) {
            console.warn('[FileUpload] Failed to restore state:', e);
        }
        
        return this;
    };

    /**
     * Clear persisted state
     */
    FileUpload.prototype.clearPersistedState = function(key) {
        key = key || this._persistKey || 'funky-upload-' + this.id;
        try {
            sessionStorage.removeItem(key);
        } catch (e) {
            // Ignore
        }
        return this;
    };

    /**
     * Get uploaded file URLs
     */
    FileUpload.prototype.getUploadedUrls = function() {
        return this.files
            .filter(function(f) { return f.status === 'complete'; })
            .map(function(f) { return f.response && f.response.url; })
            .filter(Boolean);
    };

    FileUpload.prototype.destroy = function() {
        // Remove paste handler
        if (this._pasteHandler) {
            document.removeEventListener('paste', this._pasteHandler);
        }
        
        // Remove form handlers
        if (this.form) {
            if (this._formSubmitHandler) {
                this.form.removeEventListener('submit', this._formSubmitHandler);
            }
            if (this._formResetHandler) {
                this.form.removeEventListener('reset', this._formResetHandler);
            }
        }
        
        // Cancel any active uploads
        this.files.forEach(function(fileItem) {
            if (fileItem.xhr) {
                fileItem.xhr.abort();
            }
        });
        
        this.clear();
        this.container.html('');
        this.container.classRemove('funky-upload', 'funky-upload--idle', 'funky-upload--dragover', 'funky-upload--uploading', 'funky-upload--complete');
        delete _instances[this.id];
    };

    // Public getters
    FileUpload.prototype.getFiles = function() {
        return this.files.slice();
    };

    FileUpload.prototype.isUploading = function() {
        return this.uploading;
    };

    // Static methods
    FileUpload.init = function(container, config) {
        var instance = new FileUpload(container, config);
        _instances[instance.id] = instance;
        return instance;
    };

    FileUpload.getInstance = function(id) {
        return _instances[id] || null;
    };

    FileUpload.destroyAll = function() {
        Object.keys(_instances).forEach(function(id) {
            _instances[id].destroy();
        });
    };

    Funky.register('FileUpload', FileUpload);

    // ========================================
    // Funky.Forms Field Type Registration
    // ========================================

    if (Funky.Forms && Funky.Forms.registerFieldType) {
        Funky.Forms.registerFieldType('file-upload', {
            render: function(field, container) {
                var wrapper = D.create('div')
                    .classAdd('form-field', 'form-field--file-upload')
                    .attr('data-field-name', field.name);
                
                if (field.label) {
                    D.create('label')
                        .classAdd('form-label')
                        .text(field.label)
                        .appendTo(wrapper);
                }
                
                var uploadContainer = D.create('div')
                    .classAdd('form-field__upload')
                    .appendTo(wrapper);
                
                wrapper.appendTo(container);
                
                var uploadInstance = FileUpload.init(uploadContainer, Object.assign({
                    autoUpload: false
                }, field.uploadOptions || {}));
                
                field._uploadInstance = uploadInstance;
                
                if (field.value) {
                    uploadInstance.setValue(field.value);
                }
                
                return wrapper;
            },
            
            getValue: function(field) {
                if (field._uploadInstance) {
                    return field._uploadInstance.getValue();
                }
                return [];
            },
            
            setValue: function(field, value) {
                if (field._uploadInstance) {
                    field._uploadInstance.setValue(value);
                }
            },
            
            validate: function(field) {
                var instance = field._uploadInstance;
                if (!instance) return true;
                
                var errors = [];
                
                if (field.required && instance.files.length === 0) {
                    errors.push('At least one file is required');
                }
                
                if (field.minFiles && instance.files.length < field.minFiles) {
                    errors.push('Minimum ' + field.minFiles + ' file(s) required');
                }
                
                var failed = instance.files.filter(function(f) {
                    return f.status === 'error';
                });
                
                if (failed.length > 0) {
                    errors.push(failed.length + ' file(s) failed to upload');
                }
                
                var pending = instance.files.filter(function(f) {
                    return f.status === 'queued' || f.status === 'uploading';
                });
                
                if (pending.length > 0) {
                    errors.push('Please wait for uploads to complete');
                }
                
                return errors.length === 0 ? true : errors;
            },
            
            reset: function(field) {
                if (field._uploadInstance) {
                    field._uploadInstance.clear();
                }
            },
            
            destroy: function(field) {
                if (field._uploadInstance) {
                    field._uploadInstance.destroy();
                    field._uploadInstance = null;
                }
            }
        });
    }

})(window);

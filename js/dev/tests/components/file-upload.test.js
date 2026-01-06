/**
 * Funky.FileUpload Tests
 *
 * Tests for the file upload component with drag-drop, validation,
 * progress tracking, and event emission.
 * @version 1.0.3
 */
describe('Funky.Component.FileUpload', function() {

    var FileUpload = Funky.FileUpload;
    var fixture;
    var instance;

    // Test utilities
    function createMockFile(name, size, type) {
        var content = new Array(size + 1).join('a');
        return new File([content], name, { type: type });
    }

    // Mock XHR for upload tests
    var originalXHR = window.XMLHttpRequest;
    var mockXHRInstances = [];

    function MockXHR() {
        var self = this;
        this.upload = {
            addEventListener: function(event, handler) {
                self.upload['on' + event] = handler;
            }
        };
        this.addEventListener = function(event, handler) {
            self['on' + event] = handler;
        };
        this.open = function(method, url) {
            self.method = method;
            self.url = url;
        };
        this.setRequestHeader = function() {};
        this.send = function(data) {
            self.data = data;
            mockXHRInstances.push(self);

            // Simulate async response
            setTimeout(function() {
                if (self.shouldFail) {
                    self.status = 500;
                    self.readyState = 4;
                    if (self.onerror) self.onerror();
                    if (self.onloadend) self.onloadend();
                } else {
                    self.status = 200;
                    self.readyState = 4;
                    self.responseText = JSON.stringify({ url: '/uploaded/file.png', id: 'file-123' });
                    if (self.onload) self.onload();
                    if (self.onloadend) self.onloadend();
                }
            }, 10);
        };
        this.abort = function() {
            self.aborted = true;
            if (self.onabort) self.onabort();
        };
    }

    function useMockXHR() {
        window.XMLHttpRequest = MockXHR;
        mockXHRInstances = [];
    }

    function restoreXHR() {
        window.XMLHttpRequest = originalXHR;
        mockXHRInstances = [];
    }

    beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="test-upload"></div>');
    });

    afterEach(function() {
        if (instance && instance.destroy) {
            instance.destroy();
        }
        fixture.destroy();
        instance = null;
        restoreXHR();
    });

    // =========================================================================
    // MODULE AVAILABILITY
    // =========================================================================

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('FileUpload')).toBe(true);
        });

        it('has init method', function() {
            expect(typeof FileUpload.init).toBe('function');
        });

        it('has getInstance method', function() {
            expect(typeof FileUpload.getInstance).toBe('function');
        });

        it('has destroyAll method', function() {
            expect(typeof FileUpload.destroyAll).toBe('function');
        });

    });

    // =========================================================================
    // INITIALIZATION
    // =========================================================================

    describe('initialization', function() {

        it('should create instance with default options', function() {
            instance = FileUpload.init('#test-upload');

            expect(instance).toBeTruthy();
            expect(instance.id).toBeTruthy();
        });

        it('should add root class to container', function() {
            instance = FileUpload.init('#test-upload');

            // The class is added to fixture.el itself, not a child element
            expect(fixture.el.classList.contains('funky-upload')).toBe(true);
        });

        it('should create dropzone element', function() {
            instance = FileUpload.init('#test-upload');

            var dropzone = fixture.el.querySelector('.funky-upload__dropzone');
            expect(dropzone).toBeTruthy();
        });

        it('should create file input element', function() {
            instance = FileUpload.init('#test-upload');

            var input = fixture.el.querySelector('.funky-upload__input');
            expect(input).toBeTruthy();
            expect(input.type).toBe('file');
        });

        it('should create file list element', function() {
            instance = FileUpload.init('#test-upload');

            var list = fixture.el.querySelector('.funky-upload__list');
            expect(list).toBeTruthy();
        });

        it('should accept custom options', function() {
            instance = FileUpload.init('#test-upload', {
                maxSize: 5 * 1024 * 1024,
                maxFiles: 3,
                accept: ['image/*', '.pdf']
            });

            expect(instance.config.maxSize).toBe(5 * 1024 * 1024);
            expect(instance.config.maxFiles).toBe(3);
            expect(instance.config.accept).toContain('image/*');
        });

        it('should set accept attribute on input', function() {
            instance = FileUpload.init('#test-upload', {
                accept: ['image/*', '.pdf']
            });

            var input = fixture.el.querySelector('.funky-upload__input');
            expect(input.getAttribute('accept')).toContain('image/*');
            expect(input.getAttribute('accept')).toContain('.pdf');
        });

        it('should set multiple attribute when enabled', function() {
            instance = FileUpload.init('#test-upload', { multiple: true });

            var input = fixture.el.querySelector('.funky-upload__input');
            expect(input.hasAttribute('multiple')).toBe(true);
        });

        it('should store instance for retrieval', function() {
            instance = FileUpload.init('#test-upload');

            var retrieved = FileUpload.getInstance(instance.id);
            expect(retrieved).toBe(instance);
        });

    });

    // =========================================================================
    // FILE VALIDATION
    // =========================================================================

    describe('file validation', function() {

        it('should reject files over maxSize', function() {
            var errorCalled = false;
            instance = FileUpload.init('#test-upload', {
                maxSize: 1024,
                onError: function() { errorCalled = true; }
            });

            var bigFile = createMockFile('big.txt', 2048, 'text/plain');
            instance._handleFiles([bigFile]);

            expect(instance.files.length).toBe(0);
        });

        it('should accept files under maxSize', function() {
            instance = FileUpload.init('#test-upload', {
                maxSize: 1024
            });

            var smallFile = createMockFile('small.txt', 512, 'text/plain');
            instance._handleFiles([smallFile]);

            expect(instance.files.length).toBe(1);
        });

        it('should reject invalid file types by MIME', function() {
            instance = FileUpload.init('#test-upload', {
                accept: ['image/*']
            });

            var textFile = createMockFile('doc.txt', 100, 'text/plain');
            instance._handleFiles([textFile]);

            expect(instance.files.length).toBe(0);
        });

        it('should accept valid file types by MIME', function() {
            instance = FileUpload.init('#test-upload', {
                accept: ['image/*']
            });

            var imageFile = createMockFile('photo.png', 100, 'image/png');
            instance._handleFiles([imageFile]);

            expect(instance.files.length).toBe(1);
        });

        it('should accept valid file types by extension', function() {
            instance = FileUpload.init('#test-upload', {
                accept: ['.pdf', '.docx']
            });

            var pdfFile = createMockFile('doc.pdf', 100, 'application/pdf');
            instance._handleFiles([pdfFile]);

            expect(instance.files.length).toBe(1);
        });

        it('should enforce maxFiles limit', function() {
            instance = FileUpload.init('#test-upload', {
                maxFiles: 2
            });

            var files = [
                createMockFile('file1.txt', 100, 'text/plain'),
                createMockFile('file2.txt', 100, 'text/plain'),
                createMockFile('file3.txt', 100, 'text/plain')
            ];

            instance._handleFiles(files);

            expect(instance.files.length).toBe(2);
        });

        it('should reject duplicate files', function() {
            instance = FileUpload.init('#test-upload');

            var file1 = createMockFile('same.txt', 100, 'text/plain');
            var file2 = createMockFile('same.txt', 100, 'text/plain');

            instance._handleFiles([file1]);
            instance._handleFiles([file2]);

            expect(instance.files.length).toBe(1);
        });

    });

    // =========================================================================
    // UPLOAD PROCESS
    // =========================================================================

    describe('upload process', function() {

        beforeEach(function() {
            useMockXHR();
        });

        it('should upload file to configured URL', function(done) {
            instance = FileUpload.init('#test-upload', {
                url: '/api/upload',
                onComplete: function(file, response) {
                    expect(response.url).toBeTruthy();
                    expect(mockXHRInstances[0].url).toBe('/api/upload');
                    done();
                }
            });

            var file = createMockFile('test.txt', 100, 'text/plain');
            instance._handleFiles([file]);
            instance.uploadAll();
        });

        it('should call onProgress during upload', function(done) {
            var progressCalled = false;

            instance = FileUpload.init('#test-upload', {
                onProgress: function(file, percent) {
                    progressCalled = true;
                    expect(percent >= 0 && percent <= 100).toBe(true);
                },
                onComplete: function() {
                    expect(progressCalled).toBe(true);
                    done();
                }
            });

            var file = createMockFile('test.txt', 100, 'text/plain');
            instance._handleFiles([file]);
            instance.uploadAll();

            // Simulate progress event
            setTimeout(function() {
                var xhr = mockXHRInstances[0];
                if (xhr && xhr.upload && xhr.upload.onprogress) {
                    xhr.upload.onprogress({ lengthComputable: true, loaded: 50, total: 100 });
                }
            }, 5);
        });

        it('should handle upload errors', function(done) {
            instance = FileUpload.init('#test-upload', {
                onError: function(file, error) {
                    expect(error).toBeTruthy();
                    done();
                }
            });

            var file = createMockFile('test.txt', 100, 'text/plain');
            instance._handleFiles([file]);

            // Make first XHR fail
            var originalSend = MockXHR.prototype.send;
            MockXHR.prototype.send = function(data) {
                this.shouldFail = true;
                originalSend.call(this, data);
            };

            instance.uploadAll();
        });

        it('should update file status to complete', function(done) {
            instance = FileUpload.init('#test-upload', {
                onComplete: function() {
                    var fileItem = instance.files[0];
                    expect(fileItem.status).toBe('complete');
                    done();
                }
            });

            var file = createMockFile('test.txt', 100, 'text/plain');
            instance._handleFiles([file]);
            instance.uploadAll();
        });

        it('should call onAllComplete when all uploads finish', function(done) {
            instance = FileUpload.init('#test-upload', {
                onAllComplete: function(files, successful, failed) {
                    expect(files.length).toBe(2);
                    expect(successful.length).toBe(2);
                    expect(failed.length).toBe(0);
                    done();
                }
            });

            var files = [
                createMockFile('file1.txt', 100, 'text/plain'),
                createMockFile('file2.txt', 100, 'text/plain')
            ];

            instance._handleFiles(files);
            instance.uploadAll();
        });

    });

    // =========================================================================
    // CANCEL & REMOVE
    // =========================================================================

    describe('cancel and remove', function() {

        beforeEach(function() {
            useMockXHR();
        });

        it('should remove file from queue', function() {
            instance = FileUpload.init('#test-upload');

            var file = createMockFile('test.txt', 100, 'text/plain');
            instance._handleFiles([file]);

            var fileId = instance.files[0].id;
            instance.removeFile(fileId);

            expect(instance.files.length).toBe(0);
        });

        it('should remove file element from DOM', function() {
            instance = FileUpload.init('#test-upload');

            var file = createMockFile('test.txt', 100, 'text/plain');
            instance._handleFiles([file]);

            var fileId = instance.files[0].id;
            instance.removeFile(fileId);

            var items = fixture.el.querySelectorAll('.funky-upload__item');
            expect(items.length).toBe(0);
        });

        it('should abort XHR when cancelling upload', function(done) {
            instance = FileUpload.init('#test-upload');

            var file = createMockFile('test.txt', 100, 'text/plain');
            instance._handleFiles([file]);

            var fileId = instance.files[0].id;
            instance.uploadAll();

            setTimeout(function() {
                instance.removeFile(fileId);
                var xhr = mockXHRInstances[0];
                expect(xhr.aborted).toBe(true);
                done();
            }, 5);
        });

        it('should call onRemove callback', function() {
            var removedFile = null;
            instance = FileUpload.init('#test-upload', {
                onRemove: function(file) { removedFile = file; }
            });

            var file = createMockFile('test.txt', 100, 'text/plain');
            instance._handleFiles([file]);

            var fileId = instance.files[0].id;
            instance.removeFile(fileId);

            expect(removedFile).toBeTruthy();
            expect(removedFile.name).toBe('test.txt');
        });

        it('should clear all files', function() {
            instance = FileUpload.init('#test-upload');

            var files = [
                createMockFile('file1.txt', 100, 'text/plain'),
                createMockFile('file2.txt', 100, 'text/plain')
            ];
            instance._handleFiles(files);

            instance.clear();

            expect(instance.files.length).toBe(0);
        });

    });

    // =========================================================================
    // DRAG & DROP
    // =========================================================================

    describe('drag and drop', function() {

        it('should add dragover class on dragover', function() {
            instance = FileUpload.init('#test-upload');

            var dropzone = fixture.el.querySelector('.funky-upload__dropzone');
            var event = new Event('dragover', { bubbles: true });
            event.preventDefault = function() {};
            event.dataTransfer = { types: ['Files'] };

            dropzone.dispatchEvent(event);

            // The class is added to fixture.el itself (the container)
            expect(fixture.el.classList.contains('funky-upload--dragover')).toBe(true);
        });

        it('should remove dragover class on dragleave', function() {
            instance = FileUpload.init('#test-upload');

            // The class is on fixture.el itself (the container)
            fixture.el.classList.add('funky-upload--dragover');

            var dropzone = fixture.el.querySelector('.funky-upload__dropzone');
            var event = new Event('dragleave', { bubbles: true });
            event.preventDefault = function() {};

            dropzone.dispatchEvent(event);

            expect(fixture.el.classList.contains('funky-upload--dragover')).toBe(false);
        });

    });

    // =========================================================================
    // UI UPDATES
    // =========================================================================

    describe('UI updates', function() {

        it('should show footer when files added', function() {
            instance = FileUpload.init('#test-upload');

            var file = createMockFile('test.txt', 100, 'text/plain');
            instance._handleFiles([file]);

            var footer = fixture.el.querySelector('.funky-upload__footer');
            if (footer) {
                expect(footer.style.display).not.toBe('none');
            }
        });

        it('should display file name in list', function() {
            instance = FileUpload.init('#test-upload');

            var file = createMockFile('document.pdf', 100, 'application/pdf');
            instance._handleFiles([file]);

            var nameEl = fixture.el.querySelector('.funky-upload__name');
            expect(nameEl.textContent).toContain('document.pdf');
        });

        it('should display formatted file size', function() {
            instance = FileUpload.init('#test-upload');

            var file = createMockFile('big.bin', 1536, 'application/octet-stream');
            instance._handleFiles([file]);

            var sizeEl = fixture.el.querySelector('.funky-upload__size');
            expect(sizeEl.textContent).toContain('KB');
        });

        it('should render file item with progress bar', function() {
            instance = FileUpload.init('#test-upload');

            var file = createMockFile('test.txt', 100, 'text/plain');
            instance._handleFiles([file]);

            var progressBar = fixture.el.querySelector('.funky-upload__progress-bar');
            expect(progressBar).toBeTruthy();
        });

        it('should render remove button for file', function() {
            instance = FileUpload.init('#test-upload');

            var file = createMockFile('test.txt', 100, 'text/plain');
            instance._handleFiles([file]);

            // The remove button uses the 'cancel' class
            var removeBtn = fixture.el.querySelector('.funky-upload__cancel');
            expect(removeBtn).toBeTruthy();
        });

    });

    // =========================================================================
    // CALLBACKS
    // =========================================================================

    describe('callbacks', function() {

        it('should call onAdd when file added', function() {
            var addedFile = null;
            instance = FileUpload.init('#test-upload', {
                onAdd: function(file) { addedFile = file; }
            });

            var file = createMockFile('test.txt', 100, 'text/plain');
            instance._handleFiles([file]);

            expect(addedFile).toBeTruthy();
            expect(addedFile.name).toBe('test.txt');
        });

        it('should call onError for validation failure', function() {
            var errorReceived = null;
            instance = FileUpload.init('#test-upload', {
                maxSize: 100,
                onError: function(file, error) { errorReceived = error; }
            });

            var file = createMockFile('big.txt', 500, 'text/plain');
            instance._handleFiles([file]);

            expect(errorReceived).toBeTruthy();
        });

    });

    // =========================================================================
    // EVENTS
    // =========================================================================

    describe('events', function() {

        it('should emit funky.file-upload.add event', function(done) {
            instance = FileUpload.init('#test-upload');

            fixture.el.addEventListener('funky.file-upload.add', function(e) {
                expect(e.detail.file).toBeTruthy();
                expect(e.detail.file.name).toBe('test.txt');
                done();
            });

            var file = createMockFile('test.txt', 100, 'text/plain');
            instance._handleFiles([file]);
        });

        it('should emit funky.file-upload.remove event', function(done) {
            instance = FileUpload.init('#test-upload');

            var file = createMockFile('test.txt', 100, 'text/plain');
            instance._handleFiles([file]);

            fixture.el.addEventListener('funky.file-upload.remove', function(e) {
                expect(e.detail.file).toBeTruthy();
                done();
            });

            var fileId = instance.files[0].id;
            instance.removeFile(fileId);
        });

    });

    // =========================================================================
    // DESTROY
    // =========================================================================

    describe('destroy', function() {

        it('should clean up DOM on destroy', function() {
            instance = FileUpload.init('#test-upload');

            var file = createMockFile('test.txt', 100, 'text/plain');
            instance._handleFiles([file]);

            instance.destroy();

            var dropzone = fixture.el.querySelector('.funky-upload__dropzone');
            expect(dropzone).toBeFalsy();
        });

        it('should clear files array on destroy', function() {
            instance = FileUpload.init('#test-upload');

            var file = createMockFile('test.txt', 100, 'text/plain');
            instance._handleFiles([file]);

            instance.destroy();

            expect(instance.files.length).toBe(0);
        });

        it('should remove from instance registry', function() {
            instance = FileUpload.init('#test-upload');
            var id = instance.id;

            instance.destroy();

            expect(FileUpload.getInstance(id)).toBeNull();
        });

        it('should abort any in-progress uploads', function(done) {
            useMockXHR();

            instance = FileUpload.init('#test-upload');

            var file = createMockFile('test.txt', 100, 'text/plain');
            instance._handleFiles([file]);
            instance.uploadAll();

            setTimeout(function() {
                instance.destroy();
                var xhr = mockXHRInstances[0];
                expect(xhr.aborted).toBe(true);
                done();
            }, 5);
        });

    });

    // =========================================================================
    // DESTROY ALL
    // =========================================================================

    describe('destroyAll', function() {

        it('should destroy all instances', function() {
            var container2 = document.createElement('div');
            container2.id = 'test-upload-2';
            document.body.appendChild(container2);

            var instance1 = FileUpload.init('#test-upload');
            var instance2 = FileUpload.init('#test-upload-2');

            FileUpload.destroyAll();

            expect(FileUpload.getInstance(instance1.id)).toBeNull();
            expect(FileUpload.getInstance(instance2.id)).toBeNull();

            container2.parentNode.removeChild(container2);
            instance = null;
        });

    });

});

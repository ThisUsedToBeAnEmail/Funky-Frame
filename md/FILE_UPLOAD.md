# FileUpload Component

A powerful, accessible file upload component with drag-and-drop support, image previews, chunked uploads, and progress tracking.

## Quick Start

### HTML
```html
<div id="my-upload"></div>
```

### JavaScript
```javascript
var upload = Funky.FileUpload.init('#my-upload', {
    url: '/api/upload',
    accept: ['image/*', '.pdf'],
    maxSize: 10 * 1024 * 1024,  // 10MB
    onComplete: function(file, response) {
        console.log('Uploaded:', response.url);
    }
});
```

---

## Features

| Feature | Description |
|---------|-------------|
| Drag & Drop | Drop files directly onto the upload zone |
| Click to Browse | Traditional file picker fallback |
| Image Previews | Auto-generated thumbnails for images |
| Video Previews | First-frame extraction for videos |
| Progress Tracking | Real-time upload progress per file |
| Chunked Uploads | Large file support with resumable uploads |
| Pause/Resume | Pause and resume in-progress uploads |
| Retry with Backoff | Automatic retry on failure |
| Validation | File type, size, and count validation |
| Accessibility | Full keyboard navigation and screen reader support |

---

## Configuration Options

### Basic Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `url` | string | `'/api/upload'` | Upload endpoint URL |
| `method` | string | `'POST'` | HTTP method |
| `fieldName` | string | `'file'` | Form field name for file |
| `multiple` | boolean | `true` | Allow multiple file selection |
| `autoUpload` | boolean | `false` | Upload immediately when files added |
| `headers` | object | `{}` | Custom request headers |
| `withCredentials` | boolean | `false` | Include cookies in requests |

### Validation Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `accept` | array/string | `null` | Allowed file types (MIME or extensions) |
| `maxSize` | number | `10485760` | Maximum file size in bytes (10MB) |
| `maxFiles` | number | `10` | Maximum number of files |

### UI Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `showPreviews` | boolean | `true` | Generate image/video previews |
| `previewMaxSize` | number | `5242880` | Max file size for preview generation (5MB) |
| `allowRename` | boolean | `true` | Allow file rename before upload |
| `allowReorder` | boolean | `true` | Drag to reorder files |
| `allowPaste` | boolean | `true` | Paste files from clipboard |
| `showLightbox` | boolean | `true` | Show image lightbox on click |
| `showSpeed` | boolean | `true` | Show upload speed |
| `showTimeRemaining` | boolean | `true` | Show estimated time remaining |

### Chunked Upload Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `chunked` | boolean | `false` | Enable chunked uploads |
| `chunkSize` | number | `5242880` | Chunk size in bytes (5MB) |
| `chunkThreshold` | number | `10485760` | Min file size for chunking (10MB) |
| `initUrl` | string | `null` | Multipart init endpoint |
| `chunkUrl` | string | `null` | Chunk upload endpoint |
| `completeUrl` | string | `null` | Multipart complete endpoint |

### Queue & Retry Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxConcurrent` | number | `3` | Max simultaneous uploads |
| `useJobQueue` | boolean | `true` | Use Funky.JobQueue for queue management |
| `persistQueue` | boolean | `false` | Persist queue to IndexedDB |
| `maxRetries` | number | `3` | Retry attempts on failure |
| `retryDelay` | number | `1000` | Initial retry delay in ms |
| `backoffMultiplier` | number | `2` | Exponential backoff multiplier |

### S3 Direct Upload Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `useS3` | boolean | `false` | Enable S3 direct upload |
| `presignUrl` | string | `null` | Presigned URL endpoint |

---

## Callbacks

### onAdd(file)
Called when a file is added to the queue.

```javascript
Funky.FileUpload.init('#upload', {
    onAdd: function(file) {
        console.log('Added:', file.name, file.size);
        // Return false to reject the file
    }
});
```

### onRemove(file)
Called when a file is removed from the queue.

```javascript
onRemove: function(file) {
    console.log('Removed:', file.name);
}
```

### onProgress(file, percent, details)
Called during upload with progress information.

```javascript
onProgress: function(file, percent, details) {
    console.log(file.name + ': ' + percent + '%');
    // details.loaded - bytes uploaded
    // details.total - total bytes
    // details.speed - bytes per second
    // details.timeRemaining - seconds remaining
}
```

### onComplete(file, response)
Called when a file upload completes successfully.

```javascript
onComplete: function(file, response) {
    console.log('Uploaded to:', response.url);
}
```

### onError(file, error)
Called when an upload fails.

```javascript
onError: function(file, error) {
    console.error('Failed:', file.name, error);
}
```

### onAllComplete(files, successful, failed)
Called when all uploads are finished.

```javascript
onAllComplete: function(files, successful, failed) {
    console.log('Complete:', successful.length, 'of', files.length);
    if (failed.length > 0) {
        console.warn('Failed:', failed.length);
    }
}
```

### onReorder(files)
Called when files are reordered via drag.

```javascript
onReorder: function(files) {
    console.log('New order:', files.map(function(f) { return f.name; }));
}
```

### onPause(file)
Called when an upload is paused.

### onResume(file)
Called when an upload is resumed.

### onRetry(file, attempt)
Called when an upload is retried.

---

## Methods

### uploadAll()
Start uploading all queued files.

```javascript
upload.uploadAll();
```

### uploadFile(fileId)
Upload a specific file by ID.

```javascript
upload.uploadFile('file-123');
```

### removeFile(fileId)
Remove a file from the queue by ID.

```javascript
upload.removeFile('file-123');
```

### clear()
Remove all files from the queue.

```javascript
upload.clear();
```

### pause(fileId)
Pause an in-progress upload.

```javascript
upload.pause('file-123');
```

### resume(fileId)
Resume a paused upload.

```javascript
upload.resume('file-123');
```

### getUploadedUrls()
Get array of successfully uploaded file URLs.

```javascript
var urls = upload.getUploadedUrls();
// ['/files/doc1.pdf', '/files/image.png']
```

### attachToForm(formSelector)
Integrate with an HTML form. URLs are added as hidden inputs on submit.

```javascript
upload.attachToForm('#my-form');
```

### destroy()
Clean up and remove the upload component.

```javascript
upload.destroy();
```

---

## Events

The component emits custom events on the container element using Funky.Events:

| Event | Detail | Description |
|-------|--------|-------------|
| `funky.file-upload.add` | `{ file, index }` | File added to queue |
| `funky.file-upload.remove` | `{ file }` | File removed |
| `funky.file-upload.start` | `{ file }` | Upload started |
| `funky.file-upload.progress` | `{ file, percent }` | Progress update |
| `funky.file-upload.complete` | `{ file, response }` | Upload complete |
| `funky.file-upload.error` | `{ file, error }` | Upload failed |
| `funky.file-upload.all-complete` | `{ files }` | All uploads done |
| `funky.file-upload.pause` | `{ file }` | Upload paused |
| `funky.file-upload.resume` | `{ file }` | Upload resumed |

```javascript
document.querySelector('#upload').addEventListener('funky.file-upload.complete', function(e) {
    console.log('Uploaded:', e.detail.file.name);
});
```

### PubSub Events

When Funky.PubSub is available, the component also publishes:

| Event | Payload | Description |
|-------|---------|-------------|
| `funky:file-upload:job-start` | `{ file, uploadId }` | Job started |
| `funky:file-upload:job-complete` | `{ file, response }` | Job complete |
| `funky:file-upload:job-error` | `{ file, error }` | Job failed |
| `funky:file-upload:queue-complete` | `{ successful, failed }` | Queue finished |

---

## CSS Customization

### CSS Variables

```css
.funky-upload {
    --upload-border-color: var(--pro-border-color);
    --upload-border-color-active: var(--pro-primary);
    --upload-bg: var(--pro-bg-secondary);
    --upload-bg-active: var(--pro-bg-tertiary);
    --upload-progress-bg: var(--pro-primary);
    --upload-error-color: var(--pro-danger);
    --upload-success-color: var(--pro-success);
    --upload-border-radius: var(--pro-border-radius);
    --upload-transition: var(--pro-transition);
}
```

### Container State Classes

| Class | Description |
|-------|-------------|
| `.funky-upload--idle` | No files, ready for input |
| `.funky-upload--dragover` | File being dragged over |
| `.funky-upload--has-files` | Files in queue |
| `.funky-upload--uploading` | Upload in progress |
| `.funky-upload--complete` | All uploads finished |

### Item State Classes

| Class | Description |
|-------|-------------|
| `.funky-upload__item--queued` | Waiting to upload |
| `.funky-upload__item--uploading` | Currently uploading |
| `.funky-upload__item--paused` | Upload paused |
| `.funky-upload__item--complete` | Successfully uploaded |
| `.funky-upload__item--error` | Upload failed |
| `.funky-upload__item--retrying` | Retrying upload |

---

## Accessibility

The FileUpload component follows WCAG 2.1 guidelines:

- **Keyboard Navigation**: Tab to dropzone, Enter/Space to open file picker
- **Screen Reader**: ARIA labels and live regions for status updates
- **Focus Management**: Focus trapped in lightbox, returned on close
- **Reduced Motion**: Respects `prefers-reduced-motion`

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Navigate between elements |
| `Enter` / `Space` | Activate dropzone/buttons |
| `Escape` | Close lightbox |
| `Delete` | Remove focused file |
| Arrow keys | Navigate file list |

---

## Server Integration

### Expected Response Format

```json
{
    "url": "/files/uploaded-file.pdf",
    "id": "file-12345",
    "size": 1048576
}
```

### Error Response Format

```json
{
    "error": "File type not allowed",
    "code": "INVALID_TYPE"
}
```

### Chunked Upload Endpoints

For chunked uploads, implement these endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `initUrl` | POST | Initialize multipart upload, returns `uploadId` |
| `chunkUrl` | POST | Upload individual chunk with `uploadId`, `chunkIndex` |
| `completeUrl` | POST | Finalize multipart upload |

#### Init Request
```json
{
    "filename": "large-video.mp4",
    "fileSize": 104857600,
    "mimeType": "video/mp4",
    "totalChunks": 20
}
```

#### Init Response
```json
{
    "uploadId": "abc123",
    "chunkSize": 5242880
}
```

#### Chunk Request
Form data with:
- `uploadId`: from init response
- `chunkIndex`: 0-based chunk number
- `chunk`: blob data

#### Complete Request
```json
{
    "uploadId": "abc123",
    "filename": "large-video.mp4"
}
```

### S3 Presigned URL Endpoint

For S3 direct uploads:

```json
// Request
{
    "filename": "document.pdf",
    "contentType": "application/pdf"
}

// Response
{
    "presignedUrl": "https://bucket.s3.amazonaws.com/...",
    "publicUrl": "https://cdn.example.com/document.pdf"
}
```

---

## Examples

### Image Gallery Upload

```javascript
Funky.FileUpload.init('#gallery-upload', {
    accept: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: 5 * 1024 * 1024,
    maxFiles: 20,
    url: '/api/gallery/upload',
    showPreviews: true,
    allowReorder: true,
    onComplete: function(file, response) {
        addToGallery(response.url);
    }
});
```

### Document Upload with Validation

```javascript
Funky.FileUpload.init('#doc-upload', {
    accept: ['.pdf', '.docx', '.xlsx'],
    maxSize: 25 * 1024 * 1024,
    maxFiles: 5,
    autoUpload: false,
    onAdd: function(file) {
        // Custom validation - reject drafts
        if (file.name.toLowerCase().includes('draft')) {
            Funky.Toast.warning('Draft files not allowed');
            return false;
        }
    }
});
```

### Large File with Chunked Upload

```javascript
Funky.FileUpload.init('#video-upload', {
    accept: ['video/*'],
    maxSize: 500 * 1024 * 1024, // 500MB
    chunked: true,
    chunkSize: 5 * 1024 * 1024,
    initUrl: '/api/upload/init',
    chunkUrl: '/api/upload/chunk',
    completeUrl: '/api/upload/complete',
    showSpeed: true,
    showTimeRemaining: true,
    onProgress: function(file, percent, details) {
        console.log('Chunk ' + details.chunk + ' of ' + details.totalChunks);
    }
});
```

### S3 Direct Upload

```javascript
Funky.FileUpload.init('#s3-upload', {
    useS3: true,
    presignUrl: '/api/s3/presign',
    onComplete: function(file, response) {
        saveFileReference(response.url);
    }
});
```

### Form Integration

```javascript
var upload = Funky.FileUpload.init('#form-upload', {
    autoUpload: false
});

// Attach to form - adds hidden inputs with URLs on submit
upload.attachToForm('#my-form');
```

### With JobQueue Persistence

```javascript
Funky.FileUpload.init('#persistent-upload', {
    useJobQueue: true,
    persistQueue: true,
    onAllComplete: function(files, successful, failed) {
        if (failed.length === 0) {
            Funky.Toast.success('All files uploaded');
        }
    }
});
```

---

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 60+ |
| Firefox | 55+ |
| Safari | 12+ |
| Edge | 79+ |
| IE | Not supported |

---

## Troubleshooting

### Files Not Uploading

1. Check browser console for errors
2. Verify `url` option is correct
3. Check server CORS headers
4. Ensure `withCredentials` matches server config

### Preview Not Showing

1. File may exceed `previewMaxSize`
2. File type may not be image/video
3. Check for FileReader errors in console

### Drag & Drop Not Working

1. Verify dropzone element exists
2. Check for CSS `pointer-events: none`
3. Test in different browser

### Chunked Upload Failing

1. Verify all three endpoints are configured (`initUrl`, `chunkUrl`, `completeUrl`)
2. Check server handles multipart form data
3. Verify `uploadId` is returned from init

### Retry Not Working

1. Check `maxRetries` is greater than 0
2. Verify error is retriable (network error, 5xx status)
3. Check `retryDelay` and `backoffMultiplier` settings

---

## See Also

- [API Reference](js/components/file-upload.md)
- [Theming Guide](THEMING.md)
- [Accessibility Standards](accessibility-standards.md)

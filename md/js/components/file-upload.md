# FileUpload API Reference

> Complete API documentation for Funky.FileUpload component.

---

## Funky.FileUpload

### Static Methods

#### init(container, config)

Initialize a new FileUpload instance.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `container` | string \| Element | CSS selector or DOM element |
| `config` | object | Configuration options |

**Returns:** `FileUpload` instance

**Example:**
```javascript
var upload = Funky.FileUpload.init('#my-upload', {
    url: '/api/upload',
    maxSize: 10 * 1024 * 1024
});
```

---

#### getInstance(id)

Get an existing instance by ID.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `id` | string | Instance ID |

**Returns:** `FileUpload` instance or `null`

**Example:**
```javascript
var upload = Funky.FileUpload.getInstance('file-upload-1');
```

---

#### destroyAll()

Destroy all FileUpload instances.

**Example:**
```javascript
Funky.FileUpload.destroyAll();
```

---

## Instance Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique instance identifier |
| `container` | Funky.Dom | Container DOM element wrapped in Funky.Dom |
| `config` | object | Merged configuration options |
| `files` | array | Current file queue |
| `uploading` | boolean | Whether upload is in progress |
| `queue` | object | Queue state (pending, active, maxConcurrent) |

---

## Instance Methods

### uploadAll()

Upload all queued files.

**Returns:** `void`

**Example:**
```javascript
upload.uploadAll();
```

---

### uploadFile(fileId)

Upload a specific file by ID.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `fileId` | string | File ID to upload |

**Returns:** `void`

**Example:**
```javascript
upload.uploadFile('file-123');
```

---

### removeFile(fileId)

Remove a file from the queue by ID. Aborts upload if in progress.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `fileId` | string | File ID to remove |

**Returns:** `void`

**Example:**
```javascript
upload.removeFile('file-123');
```

---

### clear()

Remove all files from the queue.

**Returns:** `void`

**Example:**
```javascript
upload.clear();
```

---

### pause(fileId)

Pause an in-progress upload. Only works for chunked uploads.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `fileId` | string | File ID to pause |

**Returns:** `void`

**Example:**
```javascript
upload.pause('file-123');
```

---

### resume(fileId)

Resume a paused upload.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `fileId` | string | File ID to resume |

**Returns:** `void`

**Example:**
```javascript
upload.resume('file-123');
```

---

### getUploadedUrls()

Get array of successfully uploaded file URLs.

**Returns:** `string[]` - Array of URL strings

**Example:**
```javascript
var urls = upload.getUploadedUrls();
// ['/files/doc1.pdf', '/files/image.png']
```

---

### attachToForm(formSelector)

Integrate with an HTML form. Adds uploaded URLs as hidden inputs on form submit.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `formSelector` | string \| Element | Form CSS selector or DOM element |

**Returns:** `void`

**Example:**
```javascript
upload.attachToForm('#my-form');
```

---

### destroy()

Clean up and remove the upload component. Aborts any in-progress uploads.

**Returns:** `void`

**Example:**
```javascript
upload.destroy();
```

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
| `accept` | array \| string \| null | `null` | Allowed file types |
| `maxSize` | number | `10485760` | Maximum file size in bytes |
| `maxFiles` | number | `10` | Maximum number of files |

### UI Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `showPreviews` | boolean | `true` | Generate image/video previews |
| `previewMaxSize` | number | `5242880` | Max file size for preview |
| `allowRename` | boolean | `true` | Allow file rename |
| `allowReorder` | boolean | `true` | Drag to reorder files |
| `allowPaste` | boolean | `true` | Paste from clipboard |
| `showLightbox` | boolean | `true` | Show image lightbox |
| `showSpeed` | boolean | `true` | Show upload speed |
| `showTimeRemaining` | boolean | `true` | Show time remaining |

### Chunked Upload Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `chunked` | boolean | `false` | Enable chunked uploads |
| `chunkSize` | number | `5242880` | Chunk size in bytes |
| `chunkThreshold` | number | `10485760` | Min file size for chunking |
| `initUrl` | string \| null | `null` | Multipart init endpoint |
| `chunkUrl` | string \| null | `null` | Chunk upload endpoint |
| `completeUrl` | string \| null | `null` | Multipart complete endpoint |

### Queue Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxConcurrent` | number | `3` | Max simultaneous uploads |
| `useJobQueue` | boolean | `true` | Use Funky.JobQueue |
| `persistQueue` | boolean | `false` | Persist queue to IndexedDB |
| `defaultPriority` | string | `'normal'` | Default job priority |

### Retry Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxRetries` | number | `3` | Retry attempts on failure |
| `retryDelay` | number | `1000` | Initial retry delay (ms) |
| `backoffMultiplier` | number | `2` | Exponential backoff factor |

### S3 Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `useS3` | boolean | `false` | Enable S3 direct upload |
| `presignUrl` | string \| null | `null` | Presigned URL endpoint |

---

## Callbacks

### onAdd

Called when a file is added to the queue.

**Signature:** `function(file)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `file` | object | File object with id, name, size, type |

**Return:** Return `false` to reject the file.

---

### onRemove

Called when a file is removed from the queue.

**Signature:** `function(file)`

---

### onProgress

Called during upload with progress information.

**Signature:** `function(file, percent, details)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `file` | object | File object |
| `percent` | number | Upload progress 0-100 |
| `details` | object | Additional info |

**Details object:**

| Property | Type | Description |
|----------|------|-------------|
| `loaded` | number | Bytes uploaded |
| `total` | number | Total bytes |
| `speed` | number | Bytes per second |
| `timeRemaining` | number | Seconds remaining |
| `chunk` | number | Current chunk (if chunked) |
| `totalChunks` | number | Total chunks (if chunked) |

---

### onComplete

Called when a file upload completes successfully.

**Signature:** `function(file, response)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `file` | object | File object |
| `response` | object | Parsed JSON response from server |

---

### onError

Called when an upload fails.

**Signature:** `function(file, error)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `file` | object | File object |
| `error` | string | Error message |

---

### onAllComplete

Called when all uploads are finished.

**Signature:** `function(files, successful, failed)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `files` | array | All files |
| `successful` | array | Successfully uploaded files |
| `failed` | array | Failed files |

---

### onReorder

Called when files are reordered.

**Signature:** `function(files)`

---

### onPause

Called when an upload is paused.

**Signature:** `function(file)`

---

### onResume

Called when an upload is resumed.

**Signature:** `function(file)`

---

### onRetry

Called when an upload is retried.

**Signature:** `function(file, attempt)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `file` | object | File object |
| `attempt` | number | Retry attempt number (1-based) |

---

## File Object

Each file in the queue has the following structure:

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique file ID |
| `file` | File | Native File object |
| `name` | string | File name |
| `size` | number | File size in bytes |
| `type` | string | MIME type |
| `status` | string | Current status |
| `progress` | number | Upload progress 0-100 |
| `response` | object | Server response (on complete) |
| `error` | string | Error message (on error) |
| `element` | Funky.Dom | DOM element for this file |

### Status Values

| Status | Description |
|--------|-------------|
| `'queued'` | Waiting to upload |
| `'uploading'` | Currently uploading |
| `'paused'` | Upload paused |
| `'complete'` | Successfully uploaded |
| `'error'` | Upload failed |

---

## Events

### DOM Events (via Funky.Events)

| Event | Detail |
|-------|--------|
| `funky.file-upload.add` | `{ file, index }` |
| `funky.file-upload.remove` | `{ file }` |
| `funky.file-upload.start` | `{ file }` |
| `funky.file-upload.progress` | `{ file, percent, details }` |
| `funky.file-upload.complete` | `{ file, response }` |
| `funky.file-upload.error` | `{ file, error }` |
| `funky.file-upload.all-complete` | `{ files, successful, failed }` |
| `funky.file-upload.pause` | `{ file }` |
| `funky.file-upload.resume` | `{ file }` |

### PubSub Events (via Funky.PubSub)

| Event | Payload |
|-------|---------|
| `funky:file-upload:job-start` | `{ file, uploadId }` |
| `funky:file-upload:job-complete` | `{ file, response }` |
| `funky:file-upload:job-error` | `{ file, error }` |
| `funky:file-upload:queue-complete` | `{ successful, failed }` |

---

## CSS Classes

### Container Classes

| Class | Description |
|-------|-------------|
| `.funky-upload` | Root container |
| `.funky-upload--idle` | No files |
| `.funky-upload--dragover` | Dragging over |
| `.funky-upload--has-files` | Has files |
| `.funky-upload--uploading` | Upload in progress |
| `.funky-upload--complete` | All complete |

### Element Classes

| Class | Description |
|-------|-------------|
| `.funky-upload__dropzone` | Drop zone area |
| `.funky-upload__input` | Hidden file input |
| `.funky-upload__list` | File list container |
| `.funky-upload__item` | Individual file item |
| `.funky-upload__preview` | Preview thumbnail |
| `.funky-upload__info` | File info container |
| `.funky-upload__name` | File name |
| `.funky-upload__size` | File size |
| `.funky-upload__progress` | Progress bar container |
| `.funky-upload__progress-bar` | Progress bar fill |
| `.funky-upload__actions` | Action buttons |
| `.funky-upload__remove` | Remove button |
| `.funky-upload__footer` | Footer with upload all button |

### Item State Classes

| Class | Description |
|-------|-------------|
| `.funky-upload__item--queued` | Waiting |
| `.funky-upload__item--uploading` | Uploading |
| `.funky-upload__item--paused` | Paused |
| `.funky-upload__item--complete` | Complete |
| `.funky-upload__item--error` | Error |
| `.funky-upload__item--retrying` | Retrying |

---

## See Also

- [User Guide](../FILE_UPLOAD.md)
- [Theming](../THEMING.md)

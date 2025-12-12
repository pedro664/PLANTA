# Image Service

The Image Service provides comprehensive image handling functionality for the Planta app, including image picking from camera/gallery, compression, and local storage management.

## Features

- ✅ Camera and gallery access with permission handling
- ✅ Image compression and resizing (max 800x800, 80% quality)
- ✅ Local file system storage
- ✅ User-friendly permission dialogs
- ✅ Error handling and fallbacks
- ✅ Cleanup utilities for old images

## Usage

### Basic Image Picking

```javascript
import { showImagePickerOptions } from '../services/imageService';

// Show picker dialog (Camera or Gallery)
const imageUri = await showImagePickerOptions();
if (imageUri) {
  // Use the local image URI
  setImage(imageUri);
}
```

### Direct Camera/Gallery Access

```javascript
import { pickImageFromCamera, pickImageFromGallery } from '../services/imageService';

// Pick from camera
const cameraImage = await pickImageFromCamera();

// Pick from gallery
const galleryImage = await pickImageFromGallery();
```

### Image Management

```javascript
import { deleteLocalImage, getImageInfo, cleanupOldImages } from '../services/imageService';

// Delete an image
await deleteLocalImage(imageUri);

// Get image information
const info = await getImageInfo(imageUri);

// Cleanup old images (older than 30 days)
const deletedCount = await cleanupOldImages();
```

## Configuration

The service uses the following default configuration:

- **Quality**: 80% (0.8)
- **Max Dimensions**: 800x800 pixels
- **Aspect Ratio**: 1:1 (square)
- **Storage Location**: `${FileSystem.documentDirectory}images/`

## Permissions

The service automatically handles permission requests for:
- Camera access (`NSCameraUsageDescription` / `CAMERA`)
- Media library access (`NSPhotoLibraryUsageDescription` / `READ_EXTERNAL_STORAGE`)

## Error Handling

All functions include comprehensive error handling:
- Permission denied → User-friendly alerts with settings option
- Image picking cancelled → Returns `null`
- File system errors → Throws descriptive errors
- Compression failures → Falls back to original image

## Integration Example

See `AddPlantScreen.js` for a complete integration example showing how to use the image service in a React Native component.
# Permissions Utility

This utility provides a comprehensive permissions management system for camera and gallery access in the Planta app.

## Features

- ✅ Explanatory alerts before requesting permissions (Requirements 10.3)
- ✅ Camera permission handling (Requirements 10.1)
- ✅ Gallery permission handling (Requirements 10.2)
- ✅ Permission denied handling with settings option (Requirements 10.4, 10.5)
- ✅ Cross-platform support (iOS and Android)
- ✅ Retry logic for failed permission requests
- ✅ Permission status checking without requesting

## Usage Examples

### Basic Permission Requests

```javascript
import { 
  requestCameraPermission, 
  requestGalleryPermission,
  checkCameraPermission,
  checkGalleryPermission 
} from '../utils/permissions';

// Request camera permission with explanatory dialog
const cameraGranted = await requestCameraPermission();
if (cameraGranted) {
  // Proceed with camera functionality
}

// Request gallery permission with explanatory dialog
const galleryGranted = await requestGalleryPermission();
if (galleryGranted) {
  // Proceed with gallery functionality
}

// Check permissions without requesting
const hasCameraAccess = await checkCameraPermission();
const hasGalleryAccess = await checkGalleryPermission();
```

### Advanced Usage

```javascript
import { 
  requestAllImagePermissions,
  checkAllImagePermissions,
  requestPermissionWithRetry,
  showPermissionDeniedAlert,
  openAppSettings 
} from '../utils/permissions';

// Request both permissions at once
const permissions = await requestAllImagePermissions();
console.log('Camera:', permissions.camera, 'Gallery:', permissions.gallery);

// Check both permissions at once
const currentPermissions = await checkAllImagePermissions();

// Request with retry logic (up to 2 attempts)
const cameraWithRetry = await requestPermissionWithRetry('camera', 2);

// Show permission denied alert manually
showPermissionDeniedAlert('camera');

// Open app settings directly
openAppSettings();
```

### Constants

```javascript
import { PERMISSION_STATUS, PERMISSION_TYPES } from '../utils/permissions';

// Permission status constants
PERMISSION_STATUS.GRANTED      // 'granted'
PERMISSION_STATUS.DENIED       // 'denied'
PERMISSION_STATUS.UNDETERMINED // 'undetermined'

// Permission type constants
PERMISSION_TYPES.CAMERA  // 'camera'
PERMISSION_TYPES.GALLERY // 'gallery'
```

## Integration with Image Service

The permissions utility is automatically used by the image service (`src/services/imageService.js`), so when you use:

```javascript
import { showImagePickerOptions } from '../services/imageService';

const imageUri = await showImagePickerOptions();
```

The permissions are handled automatically with user-friendly dialogs.

## Requirements Compliance

- **10.1**: ✅ Camera permission request on first use
- **10.2**: ✅ Gallery permission request on first use  
- **10.3**: ✅ Explanatory messages before requesting permissions
- **10.4**: ✅ Informative messages when permissions are denied
- **10.5**: ✅ Option to open device settings when permissions are denied

## Platform Differences

### iOS
- Uses `app-settings:` URL scheme to open app-specific settings
- Permission dialogs follow iOS Human Interface Guidelines

### Android
- Uses `Linking.openSettings()` to open general settings
- Permission dialogs follow Material Design guidelines
- Handles different Android versions gracefully

## Error Handling

All functions include comprehensive error handling:
- Network/system errors are caught and logged
- User-friendly error messages are displayed
- Graceful fallbacks when permissions can't be determined
- No crashes due to permission-related errors
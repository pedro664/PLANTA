# Toast Notification System

## Overview

The Toast notification system provides cross-platform toast notifications for the Planta app. It uses native Android ToastAndroid for Android devices and react-native-toast-message for iOS devices.

## Features

- ✅ Cross-platform support (iOS & Android)
- ✅ Multiple toast types (success, error, info, warning)
- ✅ Customizable duration
- ✅ Native Android toast integration
- ✅ Styled iOS toast with react-native-toast-message
- ✅ Automatic title generation based on toast type
- ✅ Easy-to-use helper functions

## Installation

The Toast system requires the following dependency:

```bash
npm install react-native-toast-message
```

## Setup

1. **Import the ToastComponent in App.js:**

```javascript
import { ToastComponent } from './src/components/Toast';

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <AppProvider>
        <AppNavigator />
        <StatusBar style="dark" />
        <ToastComponent />  {/* Add this line */}
      </AppProvider>
    </View>
  );
}
```

## Usage

### Basic Usage

```javascript
import { showToast, TOAST_TYPES } from '../components/Toast';

// Basic toast
showToast('Hello World!', TOAST_TYPES.INFO);

// Toast with custom duration
showToast('Long message', TOAST_TYPES.SUCCESS, 5000);
```

### Helper Functions

```javascript
import { 
  showSuccessToast, 
  showErrorToast, 
  showInfoToast, 
  showWarningToast 
} from '../components/Toast';

// Success toast (green theme)
showSuccessToast('Planta salva com sucesso!');

// Error toast (red theme, longer duration)
showErrorToast('Erro ao salvar planta');

// Info toast (blue theme)
showInfoToast('Post curtido! ❤️');

// Warning toast (orange theme)
showWarningToast('Verifique os campos obrigatórios');
```

## Integration Examples

### 1. AddPlantScreen - Form Validation & Success

```javascript
const handleSave = () => {
  if (!validateForm()) {
    showErrorToast('Por favor, corrija os campos obrigatórios');
    return;
  }

  try {
    addPlant(newPlant);
    showSuccessToast('Sua planta foi adicionada com sucesso!');
    
    setTimeout(() => {
      navigation.goBack();
    }, 1000);
  } catch (error) {
    showErrorToast('Erro ao salvar a planta. Tente novamente.');
  }
};
```

### 2. PlantDetailScreen - Care Log Actions

```javascript
const handleCareSubmit = () => {
  if (!careForm.type) {
    showErrorToast('Selecione o tipo de cuidado');
    return;
  }

  try {
    addCareLog(plantId, newCareLog);
    showSuccessToast('Cuidado registrado com sucesso!');
    setCareModalVisible(false);
  } catch (error) {
    showErrorToast('Erro ao registrar cuidado. Tente novamente.');
  }
};
```

### 3. ProfileScreen - Profile Updates

```javascript
const handleSaveProfile = () => {
  if (!editForm.name.trim()) {
    showErrorToast('Nome é obrigatório');
    return;
  }

  try {
    // Update profile logic
    showSuccessToast('Perfil atualizado com sucesso!');
    
    setTimeout(() => {
      setEditModalVisible(false);
    }, 1000);
  } catch (error) {
    showErrorToast('Erro ao atualizar perfil. Tente novamente.');
  }
};
```

### 4. PostCard - Like Actions

```javascript
const handleLike = () => {
  try {
    toggleLike(post.id, user.id);
    
    if (isLiked) {
      showInfoToast('Curtida removida');
    } else {
      showInfoToast('Post curtido! ❤️');
    }
  } catch (error) {
    showErrorToast('Erro ao curtir post. Tente novamente.');
  }
};
```

## Toast Types & Styling

### Android (ToastAndroid)
- Uses native Android toast
- Simple text display
- Short (3 seconds) or Long (5 seconds) duration
- System-styled appearance

### iOS (react-native-toast-message)
- Custom styled toast with title and message
- Positioned at top of screen with safe area offset
- Color-coded by type:
  - **Success**: Green theme with "Sucesso!" title
  - **Error**: Red theme with "Erro" title
  - **Warning**: Orange theme with "Atenção" title
  - **Info**: Blue theme with "Informação" title

## Configuration

### Toast Duration
```javascript
import { TOAST_DURATION } from '../components/Toast';

// Available durations
TOAST_DURATION.SHORT  // 3000ms
TOAST_DURATION.LONG   // 5000ms

// Custom duration
showToast('Message', TOAST_TYPES.INFO, 2000);
```

### Toast Types
```javascript
import { TOAST_TYPES } from '../components/Toast';

TOAST_TYPES.SUCCESS   // 'success'
TOAST_TYPES.ERROR     // 'error'
TOAST_TYPES.INFO      // 'info'
TOAST_TYPES.WARNING   // 'warning'
```

## Best Practices

1. **Use appropriate toast types:**
   - `SUCCESS` for completed actions (save, update, delete)
   - `ERROR` for failures and validation errors
   - `INFO` for neutral feedback (like, share)
   - `WARNING` for cautionary messages

2. **Keep messages concise:**
   - Use clear, actionable language
   - Avoid technical jargon
   - Include emojis for visual appeal when appropriate

3. **Handle errors gracefully:**
   - Always wrap toast calls in try-catch blocks
   - Provide fallback messages for unexpected errors
   - Log errors to console for debugging

4. **Consider timing:**
   - Use longer duration for error messages
   - Allow time for users to read the message before navigation
   - Don't spam users with multiple toasts

## Testing

The Toast system includes comprehensive unit tests:

```bash
npm test -- src/components/__tests__/Toast.test.js
```

Tests cover:
- Platform-specific behavior (Android vs iOS)
- All toast types and helper functions
- Duration handling
- Error scenarios

## Requirements Satisfied

This implementation satisfies **Requirement 5.6** from the specifications:
- ✅ Cross-platform toast notifications
- ✅ Multiple variants (success, error, info, warning)
- ✅ Integration in app actions (save plant, validation errors)
- ✅ Native Android ToastAndroid implementation
- ✅ iOS support with react-native-toast-message
- ✅ Proper error handling and user feedback
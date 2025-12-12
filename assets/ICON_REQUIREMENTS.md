# App Icon Requirements

## Current Issue
The current `icon.png` and `adaptive-icon.png` files have dimensions 2752x1536px, but app icons must be square.

## Required Dimensions

### iOS
- **App Store:** 1024x1024px (PNG, no transparency)
- **iPhone:** 180x180px, 120x120px, 87x87px
- **iPad:** 167x167px, 152x152px, 76x76px
- **Settings/Spotlight:** 80x80px, 58x58px, 40x40px, 29x29px

### Android
- **Play Store:** 512x512px (PNG with transparency)
- **Adaptive Icon:** 108x108dp (foreground + background layers)
- **Legacy:** 192x192px, 144x144px, 96x96px, 72x72px, 48x48px, 36x36px

## Design Guidelines

### Visual Elements
- **Primary:** Plant/leaf icon in botanical green (#2E4A3D)
- **Background:** Light botanical base (#F7F5F0) or gradient
- **Style:** Simple, recognizable at small sizes
- **No text:** Icon should work without text labels

### Technical Requirements
- **Format:** PNG with transparency (except iOS App Store)
- **Color depth:** 24-bit or 32-bit
- **Compression:** Optimized for file size
- **Safe area:** Keep important elements within 80% of canvas

## Action Required
1. **Create new square icons** with proper dimensions
2. **Replace current files:**
   - `icon.png` → 1024x1024px
   - `adaptive-icon.png` → 512x512px (foreground layer)
3. **Add background layer** for Android adaptive icon
4. **Test on devices** to ensure clarity at all sizes

## Tools Recommended
- **Figma/Sketch:** For vector design
- **App Icon Generator:** For multiple sizes
- **Android Asset Studio:** For adaptive icons
- **Icon Slate (Mac):** For iOS icon generation
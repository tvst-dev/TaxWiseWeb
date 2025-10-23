# TaxWise Mobile Apps - Deployment Guide

## Overview
TaxWise now supports iOS and Android mobile apps using Capacitor. The web app is wrapped into native mobile applications with access to device features.

## Prerequisites

### General
- Node.js and npm installed
- GitHub account (for code export)
- TaxWise project exported to GitHub

### iOS Development
- macOS computer
- Xcode 14+ installed
- Apple Developer account ($99/year)
- iOS device or simulator

### Android Development
- Android Studio installed
- Android SDK configured
- Android device or emulator

## Initial Setup

### 1. Export Your Project to GitHub
1. In Lovable editor, click the GitHub button
2. Connect your GitHub account
3. Export the project to a new repository
4. Clone the repository to your local machine:
   ```bash
   git clone <your-repo-url>
   cd taxwise-nigeria
   ```

### 2. Install Dependencies
```bash
npm install
```

### 3. Build the Web App
```bash
npm run build
```

## iOS Deployment

### 1. Add iOS Platform
```bash
npx cap add ios
```

### 2. Sync Capacitor
```bash
npx cap sync ios
```

### 3. Open in Xcode
```bash
npx cap open ios
```

### 4. Configure iOS App
1. In Xcode, select your project in the navigator
2. Under "Signing & Capabilities":
   - Select your development team
   - Ensure automatic signing is enabled
3. Update the bundle identifier if needed

### 5. Run on iOS
- **Simulator**: Click the play button in Xcode
- **Physical Device**: 
  1. Connect your iPhone via USB
  2. Trust the computer on your device
  3. Select your device in Xcode
  4. Click the play button

### 6. Prepare for App Store
1. Create app icons (1024x1024 and various sizes)
2. Create screenshots for different device sizes
3. Set up App Store Connect listing
4. Archive and upload build via Xcode
5. Submit for review

## Android Deployment

### 1. Add Android Platform
```bash
npx cap add android
```

### 2. Sync Capacitor
```bash
npx cap sync android
```

### 3. Open in Android Studio
```bash
npx cap open android
```

### 4. Configure Android App
1. Update `android/app/src/main/res/values/strings.xml`:
   ```xml
   <string name="app_name">TaxWise</string>
   ```
2. Update package name in `android/app/build.gradle` if needed

### 5. Run on Android
- **Emulator**: 
  1. Start Android emulator from Android Studio
  2. Click the run button
- **Physical Device**:
  1. Enable USB debugging on your device
  2. Connect via USB
  3. Click the run button

### 6. Prepare for Google Play
1. Create app icons and feature graphic
2. Create screenshots for different device sizes
3. Generate signed APK or AAB:
   ```bash
   cd android
   ./gradlew bundleRelease
   ```
4. Upload to Google Play Console
5. Submit for review

## Development Workflow

### Testing Changes
After making changes to your code:

1. Pull latest changes from GitHub:
   ```bash
   git pull
   ```

2. Build the web app:
   ```bash
   npm run build
   ```

3. Sync with native projects:
   ```bash
   npx cap sync
   ```

4. Run on your platform:
   ```bash
   # iOS
   npx cap run ios
   
   # Android
   npx cap run android
   ```

## Live Reload (Development)
The `capacitor.config.ts` is configured for live reload during development:
- The app points to: `https://f799ff6a-ac7b-4f72-947d-d845f407d909.lovableproject.com`
- Changes made in Lovable will reflect immediately in the mobile app
- No need to rebuild for UI changes during development

## Production Deployment

### Before Publishing:
1. Update `capacitor.config.ts` to remove the server URL:
   ```typescript
   const config: CapacitorConfig = {
     appId: 'app.lovable.f799ff6aac7b4f72947dd845f407d909',
     appName: 'TaxWise Nigeria',
     webDir: 'dist',
     // Remove server config for production
   };
   ```

2. Build and sync:
   ```bash
   npm run build
   npx cap sync
   ```

## Troubleshooting

### iOS Issues
- **Build fails**: Clean build folder (Product → Clean Build Folder)
- **Signing errors**: Check your Apple Developer account and certificates
- **Device not detected**: Check cable and trust settings

### Android Issues
- **Build fails**: Invalidate caches (File → Invalidate Caches / Restart)
- **Gradle errors**: Update Android Studio and Gradle
- **Device not detected**: Enable USB debugging and check drivers

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS App Store Guidelines](https://developer.apple.com/app-store/guidelines/)
- [Google Play Policies](https://play.google.com/about/developer-content-policy/)
- [Lovable Mobile Guide](https://docs.lovable.dev)

## Support

For issues or questions:
- Email: support@robusttechnologies.com
- Developer: Christera Chinyeaka, CEO Robust Technologies

---

**Note**: Remember to test thoroughly on both platforms before submitting to app stores. Each platform has its own review process that can take 1-7 days.

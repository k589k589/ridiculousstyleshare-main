# RSS Style Share - Virtual Fashion Try-On App 📱

AI-powered virtual fashion try-on application with native mobile capabilities using Capacitor.

## 🚀 Mobile App Features

### 📸 Native Functionality
- **Camera Integration**: Take photos directly using device camera
- **Gallery Access**: Select photos from device photo library  
- **Native Sharing**: Share try-on results through platform sharing
- **Touch Optimized**: Mobile-first UI with touch-friendly interactions

### 🎨 Fashion Features
- **Virtual Try-On**: AI-powered clothing and accessory fitting
- **Style Sharing**: Community platform for outfit sharing
- **Real-time Preview**: Instant results with advanced image processing
- **Multi-language**: Support for Chinese and English

## 🛠️ Development Setup

### Prerequisites
```bash
- Node.js (v16+)
- npm or yarn
- Git
- Android Studio (for Android)
- Xcode (for iOS, Mac only)
```

### Quick Start
```bash
# Clone and install
git clone [your-repo-url]
cd ridiculousstyleshare
npm install

# Development
npm run dev

# Mobile Development
npx cap init
npx cap add ios android
npm run build
npx cap sync
npx cap run android  # or ios
```

## 📱 Mobile Configuration

The app is configured with:
- **App ID**: `app.lovable.6c6b5a62d63045ac916473df130fc101`
- **App Name**: `ridiculousstyleshare`
- **Hot Reload**: Enabled for development
- **PWA Support**: Installable web app with offline capabilities

## 🏗️ Architecture

```
src/
├── hooks/
│   ├── useNativeCamera.ts     # Camera functionality
│   ├── useNativeShare.ts      # Native sharing
│   └── useMobileOptimization.ts # Mobile UI optimization
├── components/
│   ├── ShareOutfit.tsx        # Enhanced with camera
│   └── Header.tsx             # Mobile navigation
└── pages/
    ├── VirtualTryOn.tsx       # AI try-on with native features
    └── Community.tsx          # Social platform
```

## 🎯 Key Technologies

- **Frontend**: React + TypeScript + Vite
- **Mobile**: Capacitor + Native Plugins
- **UI**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (authentication & storage)
- **AI**: Custom virtual try-on API

## 📋 Deployment Guide

### Web Deployment
```bash
npm run build
# Deploy dist/ folder to your hosting service
```

### Mobile App Store Deployment

1. **Build and test**:
   ```bash
   npm run build
   npx cap sync
   npx cap run android --prod
   ```

2. **Android (Google Play)**:
   - Open `android/` folder in Android Studio
   - Build signed APK/AAB
   - Upload to Google Play Console

3. **iOS (App Store)**:
   - Open `ios/` folder in Xcode  
   - Configure signing & provisioning
   - Build and upload to App Store Connect

## 🔧 Configuration Files

- `capacitor.config.ts` - Capacitor configuration
- `public/manifest.json` - PWA manifest
- `tailwind.config.ts` - Design system configuration
- `src/index.css` - Mobile-optimized styles

## 📚 Learn More

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Lovable Mobile Guide](https://lovable.dev/blogs/TODO)
- [Project URL](https://lovable.dev/projects/6c6b5a62-d630-45ac-9164-73df130fc101)

---

## 🔄 Development Workflow

After making changes:
1. `npm run build` - Build the project
2. `npx cap sync` - Sync with native platforms  
3. Test on device/emulator
4. Commit and deploy

**Note**: Always test native features on actual devices for the best experience.
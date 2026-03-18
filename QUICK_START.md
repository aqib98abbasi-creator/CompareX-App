# CompareX - Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm start
```

### 3. Run on Device/Simulator
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

## 📱 What's Built

### Core Features
✅ **Browse & Filter** - Search and filter 5000+ PC components
✅ **Component Details** - Full specs, benchmarks, reviews
✅ **Compare** - Side-by-side comparison of up to 3 components
✅ **Bottleneck Calculator** - Analyze system bottlenecks

### Design System
- Dark-first UI with precise color roles
- 8px base grid system
- Modern typography (Display, Body, Mono)
- Smooth animations and transitions

### Data
- 5000+ realistic mock components
- All 11 component types (CPU, GPU, RAM, SSD, etc.)
- Realistic specs matching real hardware
- Performance scores and benchmarks

## 🎯 Key Files to Know

- **App Entry**: `App.tsx`
- **Main Screens**: `src/screens/`
- **Components**: `src/components/` (atoms → molecules → organisms)
- **Design System**: `src/constants/`
- **Mock Data**: `src/data/mockData.ts`

## 🔧 Common Commands

```bash
# Start dev server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Type check
npm run type-check

# Lint
npm run lint
```

## 📚 Documentation

- **Setup Guide**: See `SETUP.md`
- **Project Summary**: See `PROJECT_SUMMARY.md`
- **Main README**: See `README.md`

## 💡 Next Steps

1. **Add Images**: Place component images in `assets/`
2. **Connect API**: Replace mock data in `src/services/dataService.ts`
3. **Add Charts**: Implement benchmark charts using react-native-chart-kit
4. **Enhance UX**: Add loading states, error handling, animations

## 🐛 Troubleshooting

**Metro bundler issues?**
```bash
npm start -- --reset-cache
```

**TypeScript errors?**
```bash
npm run type-check
```

**Navigation not working?**
- Check that all screens are exported in `src/navigation/AppNavigator.tsx`

---

**Ready to build?** Start with `npm install` and `npm start`! 🎉

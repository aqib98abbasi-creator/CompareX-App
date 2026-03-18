# CompareX Setup Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Expo CLI (will be installed globally or via npx)
- iOS Simulator (for Mac) or Android Emulator (for testing)

## Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Run on Platform**
   - iOS: `npm run ios` (requires Mac with Xcode)
   - Android: `npm run android` (requires Android Studio)
   - Web: `npm run web` (for testing UI)

## Project Structure

```
CompareX App/
├── App.tsx                 # App entry point
├── src/
│   ├── components/        # UI components (atomic design)
│   │   ├── atoms/         # Basic building blocks
│   │   ├── molecules/     # Simple combinations
│   │   └── organisms/     # Complex sections
│   ├── screens/           # Full screen components
│   ├── navigation/        # Navigation setup
│   ├── types/             # TypeScript definitions
│   ├── constants/         # Design system (colors, typography, spacing)
│   ├── utils/             # Helper functions
│   ├── services/          # Data services
│   ├── hooks/             # Custom React hooks
│   └── data/              # Mock data generator
├── assets/                # Images, icons, etc.
└── package.json
```

## Key Features Implemented

✅ **Browse & Filter Engine** - Advanced filtering with real-time results
✅ **Component Detail Page** - Full specs, benchmarks, reviews
✅ **Comparison Engine** - Side-by-side component comparison
✅ **Bottleneck Calculator** - System bottleneck analysis
✅ **Home Dashboard** - Global search, featured deals, quick actions

## Design System

- **Colors**: Dark-first UI with precise color roles (see `src/constants/colors.ts`)
- **Typography**: Display, body, and monospace variants (see `src/constants/typography.ts`)
- **Spacing**: 8px base grid system (see `src/constants/spacing.ts`)

## Mock Data

The app includes a comprehensive mock data generator that creates 5000+ realistic PC hardware components across all categories:
- CPUs (Intel & AMD)
- GPUs (NVIDIA & AMD)
- RAM (DDR4 & DDR5)
- SSDs (NVMe & SATA)
- Motherboards
- PSUs, Cases, Coolers
- Monitors, Keyboards, HDDs

## Development Notes

- All components are TypeScript-typed
- Uses React Navigation for routing
- Mock data is generated on app start (see `src/data/mockData.ts`)
- Search uses Fuse.js for fuzzy matching
- Filters are stackable and update in real-time

## Next Steps

1. **Add Real API Integration**: Replace mock data service with actual API calls
2. **Implement Image Loading**: Add component images from CDN or local assets
3. **Add Charts**: Implement bar charts for benchmarks using react-native-chart-kit
4. **Enhance Search**: Add component type filtering in search results
5. **Add Persistence**: Store recently viewed components in AsyncStorage
6. **Improve Bottleneck Calculator**: Add component selection modals
7. **Add Sharing**: Implement share functionality for comparisons

## Troubleshooting

**Issue**: Metro bundler errors
- Solution: Clear cache with `npm start -- --reset-cache`

**Issue**: TypeScript errors
- Solution: Run `npm run type-check` to see all type errors

**Issue**: Navigation not working
- Solution: Ensure all screen components are properly exported

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native](https://reactnative.dev/)

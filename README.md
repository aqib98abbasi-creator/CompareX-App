# CompareX

Mobile-first PC hardware intelligence app combining component browsing, deep spec comparison, and bottleneck analysis.

## Tech Stack

- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **Navigation**: React Navigation
- **State Management**: React Context + Hooks
- **Charts**: react-native-chart-kit
- **Search**: Fuse.js

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)

### Installation

```bash
npm install
```

### Running the App

```bash
# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

## Project Structure

```
src/
├── components/        # Reusable UI components (atomic design)
│   ├── atoms/        # Basic building blocks
│   ├── molecules/    # Simple component combinations
│   ├── organisms/    # Complex UI sections
│   └── templates/    # Page layouts
├── screens/          # Full screen components
├── navigation/       # Navigation configuration
├── types/            # TypeScript type definitions
├── constants/        # App constants and config
├── utils/            # Helper functions
├── hooks/            # Custom React hooks
├── services/         # API and data services
├── store/            # State management
└── data/             # Mock data and fixtures
```

## Core Features

1. **Browse & Filter Engine** - Advanced filtering and search
2. **Component Detail Page** - Full specs, benchmarks, reviews
3. **Comparison Engine** - Side-by-side component comparison
4. **Bottleneck Calculator** - System bottleneck analysis

## Design System

- **Colors**: Dark-first UI with precise color roles
- **Typography**: Modern sans-serif with monospace for data
- **Spacing**: 8px base grid system
- **Motion**: Subtle animations for better UX

## License

Proprietary - All rights reserved

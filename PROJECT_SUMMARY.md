# CompareX - Project Summary

## Overview

CompareX is a mobile-first PC hardware intelligence app that combines component browsing, deep spec comparison, and bottleneck analysis. Built with React Native (Expo) and TypeScript, following a dark-first design system with high information density.

## Architecture

### Technology Stack
- **Framework**: React Native with Expo
- **Language**: TypeScript (strict mode)
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **State Management**: React Context + Hooks
- **Search**: Fuse.js for fuzzy matching
- **Charts**: react-native-chart-kit (ready for implementation)

### Design Pattern
- **Atomic Design**: Components organized hierarchically
  - Atoms: Text, Button, Badge, Chip, Input
  - Molecules: ComponentCard, SearchBar
  - Organisms: FilterDrawer
  - Screens: Home, Browse, Detail, Comparison, Calculator

## Core Modules (Priority Order)

### 1. Browse & Filter Engine ✅
- **Location**: `src/screens/BrowseScreen.tsx`
- **Features**:
  - Real-time filtering by component type, brand, price, specs
  - Persistent bottom drawer for filters
  - Active filter chips with dismiss
  - Sort by: performance, price, value, popularity, newest
  - Search integration with fuzzy matching

### 2. Component Detail Page ✅
- **Location**: `src/screens/ComponentDetailScreen.tsx`
- **Features**:
  - Hero section with name, brand, score, price
  - Full spec sheet (component-specific)
  - Performance benchmarks
  - Price history (ready for chart implementation)
  - Reviews summary
  - "Add to Comparison" CTA

### 3. Comparison Engine ✅
- **Location**: `src/screens/ComparisonScreen.tsx`
- **Features**:
  - Side-by-side comparison (up to 3 components)
  - Spec-by-spec table with winning values
  - Performance score comparison
  - Price-to-performance analysis
  - AI-generated verdict (simplified)
  - Easy component swapping

### 4. Bottleneck Calculator ✅
- **Location**: `src/screens/BottleneckCalculatorScreen.tsx`
- **Features**:
  - CPU/GPU selection
  - RAM speed and capacity input
  - Resolution selection (1080p/1440p/4K)
  - Use case selection (Gaming/Video Editing/etc.)
  - Real-time bottleneck calculation
  - Bottleneck tier (None/Minor/Moderate/Severe)
  - Performance projection for top games
  - Weakest link identification

### 5. Home Dashboard ✅
- **Location**: `src/screens/HomeScreen.tsx`
- **Features**:
  - Global search bar (searches all component types)
  - Quick action buttons (Browse/Compare/Calculator)
  - Featured deal (best value component)
  - Recently viewed components
  - Trending comparisons (ready for implementation)

## Data Layer

### Mock Data Generator
- **Location**: `src/data/mockData.ts`
- **Coverage**: 5000+ realistic SKUs
- **Categories**: All 11 component types
- **Data Includes**:
  - Realistic specs matching real hardware
  - Performance scores
  - Price history
  - Benchmarks
  - Reviews

### Data Service
- **Location**: `src/services/dataService.ts`
- **Functions**:
  - `getAllComponents()` - Get all components
  - `getComponentsByType()` - Filter by type
  - `getComponentById()` - Get single component
  - `getFeaturedDeal()` - Best value component
  - `searchComponents()` - Basic search

## Design System

### Colors (`src/constants/colors.ts`)
- Background: Primary (#0E0E11), Surface (#1A1A1F)
- Text: Primary (#F0F0F5), Secondary (#8A8A9A)
- Accent: Brand (#4F8EF7), Performance (#E8593C)
- Status: Success, Warning, Danger, Info

### Typography (`src/constants/typography.ts`)
- Display: Large/Medium/Small (bold, modern sans)
- Body: Large/Medium/Small (regular weight)
- Mono: Large/Medium/Small (for specs/numbers)
- Label: Uppercase, small
- Caption: Smallest text

### Spacing (`src/constants/spacing.ts`)
- 8px base grid: xs(4), sm(8), md(16), lg(24), xl(32), xxl(48), xxxl(64)
- Border radius: sm(8), md(12), lg(20), xl(24), full(9999)

## Utilities

### Search (`src/utils/search.ts`)
- Fuse.js integration
- Fuzzy matching
- Component type filtering
- Result limiting

### Filters (`src/utils/filters.ts`)
- Multi-dimensional filtering
- Price range calculation
- Brand extraction
- Sorting algorithms

### Bottleneck (`src/utils/bottleneck.ts`)
- CPU-GPU utilization delta model
- Resolution multipliers
- Use case weighting
- RAM bottleneck calculation

### Formatting (`src/utils/formatting.ts`)
- Price, numbers, dates
- Bytes, frequencies
- Percentages, wattage
- Dimensions

## Navigation

### Structure
- **Stack Navigator**: Main app navigation
- **Tab Navigator**: Bottom tabs (Home, Browse, Compare, Calculator)
- **Routes**:
  - Home (tabs)
  - Browse
  - ComponentDetail
  - Comparison
  - BottleneckCalculator

## Component Library

### Atoms
- `Text` - Typography with variants
- `Button` - Primary/secondary/outline/ghost
- `Badge` - Status indicators
- `Chip` - Dismissible tags
- `Input` - Text input with label/error

### Molecules
- `ComponentCard` - Component display card
- `SearchBar` - Global search input

### Organisms
- `FilterDrawer` - Persistent filter drawer

## File Structure

```
src/
├── components/
│   ├── atoms/          # Basic UI elements
│   ├── molecules/      # Component combinations
│   └── organisms/      # Complex sections
├── screens/            # Full screen components
├── navigation/         # Navigation setup
├── types/              # TypeScript definitions
├── constants/          # Design system
├── utils/              # Helper functions
├── services/           # Data services
├── hooks/              # Custom hooks
└── data/               # Mock data
```

## Implementation Status

✅ **Completed**:
- Project structure and configuration
- Design system (colors, typography, spacing)
- Type definitions for all component types
- Mock data generator (5000+ components)
- All core screens
- Navigation setup
- Component library (atoms, molecules, organisms)
- Search and filter utilities
- Bottleneck calculation algorithm

🔄 **Ready for Enhancement**:
- Chart implementation for benchmarks
- Image loading for components
- AsyncStorage for persistence
- Component selection modals
- Share functionality
- Price history charts
- Review display

## Next Steps

1. **API Integration**: Replace mock data with real API
2. **Images**: Add component images (CDN or local)
3. **Charts**: Implement benchmark charts
4. **Persistence**: Store user preferences and history
5. **Testing**: Add unit and integration tests
6. **Performance**: Optimize list rendering (virtualization)
7. **Accessibility**: Enhance screen reader support
8. **Animations**: Add smooth transitions and loading states

## Notes

- All code is TypeScript-typed with strict mode
- Follows mobile-first design principles
- Dark mode is default (light mode ready for implementation)
- Zero dead ends - every screen has clear next action
- Search is always accessible
- Filters update in real-time without page reload

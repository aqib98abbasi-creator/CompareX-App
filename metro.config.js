// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// ─── Web-safe resolution ────────────────────────────────────────────────────────
// These packages contain native code that deep-imports react-native internals
// (e.g. react-native/Libraries/...) which the web bundler cannot resolve.
// On web we swap them with an empty stub so the app still boots.
const NATIVE_ONLY_PACKAGES = [
  '@sentry/react-native',
  'react-native-google-mobile-ads',
];

const emptyModule = path.resolve(__dirname, 'src', 'utils', 'empty-module.js');

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Only redirect on web platform
  if (platform === 'web') {
    for (const pkg of NATIVE_ONLY_PACKAGES) {
      if (moduleName === pkg || moduleName.startsWith(pkg + '/')) {
        return {
          filePath: emptyModule,
          type: 'sourceFile',
        };
      }
    }
  }

  // Fall through to default resolution
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

# CompareX — Backend Setup Guide

Complete step-by-step instructions to set up every backend service from zero. All services use **free tiers** — no credit card required.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Supabase (Database + Auth)](#2-supabase-database--auth)
3. [Cloudflare Worker (API Proxy)](#3-cloudflare-worker-api-proxy)
4. [PostHog (Analytics)](#4-posthog-analytics)
5. [Sentry (Error Monitoring)](#5-sentry-error-monitoring)
6. [Expo Push Notifications](#6-expo-push-notifications)
7. [Google AdMob (Banner Ads)](#7-google-admob-banner-ads)
8. [GitHub Actions (Auto-Refresh)](#8-github-actions-auto-refresh)
9. [Environment Variables](#9-environment-variables)
10. [Verification](#10-verification)

---

## 1. Prerequisites

- Node.js 18+ installed
- Expo CLI: `npm install -g expo-cli`
- Git repository for the project
- A GitHub account (for Actions)

```bash
# Clone the repo and install dependencies
git clone <your-repo-url>
cd comparex
npm install
```

---

## 2. Supabase (Database + Auth)

Supabase provides the PostgreSQL database and authentication. Free tier includes 500MB database, 50K monthly active users, and 5GB bandwidth.

### 2.1 Create Project

1. Go to [supabase.com](https://supabase.com) and sign up / log in
2. Click **"New Project"**
3. Fill in:
   - **Name**: `comparex`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
4. Click **"Create new project"** — wait ~2 minutes

### 2.2 Run Database Migration

1. In the Supabase Dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Click **"Run"** — you should see "Success" for each statement
5. Verify tables: Go to **Table Editor** — you should see:
   - `components`
   - `user_comparisons`
   - `price_history`
   - `push_tokens`
   - `price_alerts`

### 2.3 Get API Keys

1. Go to **Settings → API**
2. Copy these values:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon (public) key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → Used only in GitHub Actions (keep secret!)

### 2.4 Enable Google Auth

1. Go to **Authentication → Providers**
2. Find **Google** and toggle it ON
3. You need a Google OAuth Client ID:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project (or use existing)
   - Go to **APIs & Services → Credentials**
   - Click **"Create Credentials" → OAuth 2.0 Client IDs**
   - Application type: **Web application**
   - Authorized redirect URIs: Add `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
   - Copy the **Client ID** and **Client Secret**
4. Back in Supabase, paste the Client ID and Secret
5. Click **Save**

### 2.5 Enable Apple Auth (iOS only)

1. Go to **Authentication → Providers**
2. Find **Apple** and toggle it ON
3. You need an Apple Developer account ($99/year):
   - Go to [Apple Developer Portal](https://developer.apple.com/)
   - Register a **Services ID** for Sign in with Apple
   - Configure the **Return URL**: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
   - Generate a **Secret Key** for Sign in with Apple
4. Paste the Service ID, Team ID, and Key into Supabase
5. Click **Save**

> **Note**: Apple Auth requires an Apple Developer account. Skip this step if you only need Google Auth.

---

## 3. Cloudflare Worker (API Proxy)

The Cloudflare Worker proxies PriceCharting API requests with CORS headers and 24-hour KV caching. Free tier includes 100K requests/day.

### 3.1 Install Wrangler

```bash
npm install -g wrangler
wrangler login
```

### 3.2 Create KV Namespace

```bash
cd workers
wrangler kv:namespace create "COMPAREX_CACHE"
```

Copy the output `id` value.

### 3.3 Configure

Edit `workers/wrangler.toml` and replace `<YOUR_KV_NAMESPACE_ID>` with the ID from step 3.2.

### 3.4 Deploy

```bash
cd workers
wrangler deploy
```

Your worker URL will be displayed, e.g.:
`https://comparex-api-proxy.<your-subdomain>.workers.dev`

### 3.5 (Optional) Set PriceCharting API Key

If you have a PriceCharting API key:

```bash
wrangler secret put PRICECHARTING_API_KEY
```

### 3.6 Verify

```bash
curl https://comparex-api-proxy.<your-subdomain>.workers.dev/health
# Should return: {"status":"ok","timestamp":"..."}
```

Set `EXPO_PUBLIC_WORKER_URL` in your `.env` file to the worker URL.

---

## 4. PostHog (Analytics)

PostHog tracks user events. Free tier includes 1M events/month.

### 4.1 Create Account

1. Go to [posthog.com](https://posthog.com) and sign up
2. Create a new **project** (e.g., `comparex`)

### 4.2 Get API Key

1. Go to **Project Settings**
2. Copy the **Project API Key** → `EXPO_PUBLIC_POSTHOG_KEY`
3. Note the **Host** (default: `https://us.i.posthog.com`) → `EXPO_PUBLIC_POSTHOG_HOST`

### 4.3 Tracked Events

CompareX tracks these events automatically:

| Event | When | Properties |
|-------|------|------------|
| `component_viewed` | User opens component detail | componentId, componentName, type |
| `comparison_started` | User starts a comparison | componentIds |
| `comparison_completed` | Comparison results shown | componentIds, winner |
| `bottleneck_calculated` | Bottleneck check completed | cpuId, gpuId, resolution, useCase, tier, percent |
| `search_performed` | User searches | query, resultCount |

---

## 5. Sentry (Error Monitoring)

Sentry captures unhandled errors. Free tier includes 5K errors/month.

### 5.1 Create Account

1. Go to [sentry.io](https://sentry.io) and sign up
2. Create a new project:
   - Platform: **React Native**
   - Name: `comparex`

### 5.2 Get DSN

1. Go to **Settings → Projects → comparex → Client Keys (DSN)**
2. Copy the DSN → `EXPO_PUBLIC_SENTRY_DSN`

### 5.3 What's Captured

- All unhandled JavaScript exceptions
- Native crashes (iOS/Android)
- Performance transactions (configurable sample rate)
- Errors are only sent in production (`__DEV__` = false)

---

## 6. Expo Push Notifications

Push notifications require an Expo project ID and EAS setup.

### 6.1 Create Expo Project

If you haven't already:

```bash
npx expo install expo-notifications expo-device
eas init
```

### 6.2 Configure

The notification service (`src/services/notificationService.ts`) automatically:
- Requests permission on app boot
- Registers the device token with Expo
- Saves the token to Supabase `push_tokens` table
- Listens for incoming notifications

### 6.3 Sending Notifications (Server-Side)

To send notifications when prices drop or new components are added, use the Expo Push API:

```bash
curl -X POST https://exp.host/--/api/v2/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "ExponentPushToken[...]",
    "title": "Price Drop!",
    "body": "RTX 4080 dropped 15% to $899",
    "data": { "type": "price_drop", "componentId": "gpu-rtx-4080" }
  }'
```

You can automate this with a Supabase Edge Function or a scheduled Cloudflare Worker.

### 6.4 Notification Triggers

| Trigger | When | Channel |
|---------|------|---------|
| New components | After catalog refresh adds new items | `catalog-updates` |
| Price drop >10% | When price_history shows >10% decrease | `price-alerts` |

---

## 7. Google AdMob (Banner Ads)

A single banner ad is shown at the bottom of the Bottleneck Calculator results — only after a calculation is completed. No interstitials, no rewarded ads, no ads on any other screen.

### 7.1 Create AdMob Account

1. Go to [admob.google.com](https://admob.google.com) and sign up
2. Click **"Apps" → "Add App"**
3. Add your app for both **Android** (`com.comparex.app`) and **iOS** (`com.comparex.app`)
4. Copy the **App ID** for each platform (format: `ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY`)

### 7.2 Create a Banner Ad Unit

1. In AdMob, go to your app → **"Ad units" → "Add ad unit"**
2. Select **"Banner"**
3. Name it `bottleneck-results-banner`
4. Copy the **Ad Unit ID** (format: `ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY`)

### 7.3 Configure the App

**Step 1**: Set the Ad Unit ID in `.env`:

```
EXPO_PUBLIC_ADMOB_ID=ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY
```

**Step 2**: Configure native AdMob App IDs (required for native builds)

`react-native-google-mobile-ads` requires native configuration and will **not** work in Expo Go. Use a [development build](https://docs.expo.dev/develop/development-builds/introduction/) or EAS Build.

- **Android**: add your AdMob App ID to `AndroidManifest.xml` as:

```
<meta-data
  android:name="com.google.android.gms.ads.APPLICATION_ID"
  android:value="ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY" />
```

- **iOS**: add your AdMob App ID to `Info.plist` as:

```
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY</string>
```

Follow the official library docs for the exact files/paths in your build setup.

### 7.4 Testing

For testing, use Google's official test Ad Unit IDs (no real ads served):

- **Android banner**: `ca-app-pub-3940256099942544/6300978111`
- **iOS banner**: `ca-app-pub-3940256099942544/2934735716`

Set one of these as `EXPO_PUBLIC_ADMOB_ID` during development.

> **Note**: `react-native-google-mobile-ads` requires native code and will **not** work in Expo Go. You must use a [development build](https://docs.expo.dev/develop/development-builds/introduction/) via `npx expo prebuild` or EAS Build.

### 7.5 Ad Placement

| Screen | Ad Type | When Shown |
|--------|---------|------------|
| Bottleneck Calculator | Banner (adaptive) | After calculation completes, at the bottom of results |
| All other screens | None | — |

---

## 8. GitHub Actions (Auto-Refresh)

The catalog auto-refreshes weekly via GitHub Actions.

### 7.1 Set GitHub Secrets

Go to your repo → **Settings → Secrets and variables → Actions** → **New repository secret**:

| Secret Name | Value |
|------------|-------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Your Supabase **service_role** key (NOT anon) |

### 7.2 Workflow

The workflow (`.github/workflows/refresh-catalog.yml`) runs every Monday at 4 AM UTC:

1. Runs the scraper (`npm run scrape`)
2. Validates the catalog
3. Pushes components to Supabase (`scripts/pushToSupabase.js`)
4. Commits updated `catalog.json` to the repo

### 7.3 Manual Trigger

You can also trigger it manually:
1. Go to **Actions → Refresh Component Catalog**
2. Click **"Run workflow"**

---

## 9. Environment Variables

### Local Development

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your values. The app works without any env vars (falls back to local mock data), but features will be limited:

| Variable | Required | Fallback |
|----------|----------|----------|
| `EXPO_PUBLIC_SUPABASE_URL` | No | Local mock data only |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | No | No auth, no cloud sync |
| `EXPO_PUBLIC_WORKER_URL` | No | No live pricing |
| `EXPO_PUBLIC_POSTHOG_KEY` | No | Events logged to console |
| `EXPO_PUBLIC_POSTHOG_HOST` | No | Default: us.i.posthog.com |
| `EXPO_PUBLIC_SENTRY_DSN` | No | No error monitoring |
| `EXPO_PUBLIC_CATALOG_URL` | No | No GitHub catalog fallback |
| `EXPO_PUBLIC_ADMOB_ID` | No | No banner ads shown |

### Production (EAS Build)

Set env vars in `eas.json` or via EAS Secrets:

```bash
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://..."
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJ..."
# ... repeat for other keys
```

---

## 10. Verification

After setting up all services, verify everything works:

### 10.1 Check App Boot Logs

```bash
npx expo start
```

Look for the diagnostics block in the console:

```
╔══════════════════════════════════════════════════════╗
║           CompareX Catalog Diagnostics               ║
╠══════════════════════════════════════════════════════════╣
║  Source          : local+supabase                     ║
║  Supabase ready  : true                               ║
║  ...                                                   ║
╚══════════════════════════════════════════════════════════╝
```

### 10.2 Check Services

```
[Supabase] ✅ Client initialized
[Auth] ✅ Session restored
[Analytics] ✅ PostHog initialized
[Notifications] ✅ Initialized
[Sentry] ✅ Initialized (DSN configured)
[App] ✅ All services initialized
```

### 10.3 Verify Supabase Tables

In Supabase Dashboard → Table Editor:
- `components` should have rows after running the scraper
- `user_comparisons` populates when a logged-in user makes comparisons
- `price_history` populates from the scraper

### 10.4 Test Worker

```bash
curl $EXPO_PUBLIC_WORKER_URL/health
```

### 10.5 Test Push Notification

In the app, the notification service includes a test function. You can call it from a debug screen or React DevTools:

```javascript
import { scheduleTestNotification } from './src/services/notificationService';
scheduleTestNotification();
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CompareX App (Expo)                       │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Supabase │  │ PostHog  │  │  Sentry  │  │   Expo   │  │
│  │  Client  │  │ Analytics│  │  Errors  │  │   Push   │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │              │              │              │        │
└───────┼──────────────┼──────────────┼──────────────┼────────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ Supabase │  │ PostHog  │  │ Sentry   │  │ Expo     │
  │ (Free)   │  │ (Free)   │  │ (Free)   │  │ Push API │
  │          │  │ 1M evts  │  │ 5K errs  │  │          │
  │ • Auth   │  │          │  │          │  │          │
  │ • DB     │  │          │  │          │  │          │
  │ • RLS    │  │          │  │          │  │          │
  └──────────┘  └──────────┘  └──────────┘  └──────────┘
        ▲
        │
  ┌──────────┐     ┌──────────────┐
  │ GitHub   │────▶│ Cloudflare   │
  │ Actions  │     │ Worker (KV)  │
  │ (Weekly) │     │ API Proxy    │
  └──────────┘     └──────────────┘
```

---

## Troubleshooting

### "Supabase not configured" warning
- Check that `.env` has `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Restart the Expo dev server after changing `.env`

### Auth not working
- Verify Google/Apple providers are enabled in Supabase Dashboard
- Check redirect URIs match your Supabase project URL
- On iOS, ensure `expo-web-browser` is properly linked

### Push notifications not registering
- Must test on a physical device (not simulator/emulator)
- Ensure `expo-notifications` permission is granted
- Check Supabase `push_tokens` table for the token

### Catalog shows 0 Supabase components
- Verify the migration SQL ran successfully (check Table Editor)
- Run `npm run scrape` and then the GitHub Action, or manually run `node scripts/pushToSupabase.js`
- Check the `components` table in Supabase has rows

### Worker returns 502
- Check PriceCharting API is accessible
- Verify KV namespace is properly bound in `wrangler.toml`
- Check Cloudflare Worker logs: `wrangler tail`

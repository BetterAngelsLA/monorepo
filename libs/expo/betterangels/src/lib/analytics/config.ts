import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * PostHog configuration, resolved from `EXPO_PUBLIC_*` at build time.
 *
 * `EXPO_PUBLIC_` values are inlined per bundle, so a build cut without a key can
 * never enable analytics — the same property the New Relic browser agent relies
 * on. A missing key leaves the app silent rather than sending events to a
 * default project.
 *
 * The key is public by design: it ships inside the JS bundle, exactly like the
 * New Relic browser license key.
 *
 * No host is configured: the SDK defaults to US Cloud. Point it at
 * `https://eu.i.posthog.com` (or a self-hosted instance) in `client.ts` if the
 * project ever moves region.
 */
const apiKey = process.env['EXPO_PUBLIC_POSTHOG_API_KEY'] ?? '';

export const analyticsConfig = {
  apiKey,
  enabled: apiKey.length > 0,
  /** Every event carries these, so the app and shelter-web share filters. */
  commonProperties: {
    environment: process.env['EXPO_PUBLIC_APP_ENV'] ?? 'unknown',
    platform: Platform.OS,
    app_version: Constants.expoConfig?.version ?? 'unknown',
  },
};

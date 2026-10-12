/**
 * Native half of the maps seam: the real `react-native-maps`, so there is
 * nothing to adapt. Metro substitutes `mapsApi.web.tsx` when bundling for web.
 *
 * Both halves export `MapView`, `Marker`, `configureWebMaps`, `PROVIDER_GOOGLE`
 * and `PROVIDER_DEFAULT` — the surface `Map/index.ts` re-exports. Nothing may be
 * added to one half alone; a component only one platform can render belongs to
 * that platform's screens, not to this seam.
 *
 * The `.tsx` extension is load-bearing: Metro walks the source extensions in
 * order (`.ts` before `.tsx`) and tries the platform-less file within each one,
 * so a native `mapsApi.ts` would resolve on web too and shadow `mapsApi.web.tsx`.
 *
 * TypeScript resolves this file (the platform-less specifier) at call sites.
 */
import type { TWebMapsConfig } from './types';

export {
  default,
  Marker,
  PROVIDER_DEFAULT,
  PROVIDER_GOOGLE,
} from 'react-native-maps';

/**
 * No-op: only a browser takes the Maps JavaScript API key as a prop, and the
 * native SDKs read theirs from the app config plugins.
 */
export const configureWebMaps = (_config: TWebMapsConfig): void => undefined;

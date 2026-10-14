import { atom } from 'jotai';
import type { TMapViewport } from '../components/Map';

/**
 * The exact map viewport (center + zoom) saved right before navigating to a
 * shelter detail page, so HomePage can restore the identical viewport (and
 * therefore the same visible pins + result count) when the user returns.
 *
 * Lives at module scope, so it survives HomePage unmounting/remounting across
 * route changes within the same page session. HomePage consumes it (sets it
 * back to null) once it has been restored.
 */
export const savedMapViewportAtom = atom<TMapViewport | null>(null);

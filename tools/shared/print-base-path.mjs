/**
 * Print the build base path for the current context, for `experiments.baseUrl`:
 *   EXPO_BASE_URL=$(node ../../tools/shared/print-base-path.mjs) expo export ...
 * No trailing newline, so it interpolates directly.
 *
 * A web-style path: `/` for root, `/branches/<branch>` for a branch. Expo's
 * `baseUrl` wants `''` for root and raw-joins what it is given into asset URLs, so
 * the consumer normalizes it — see `apps/betterangels/app.config.js`.
 */
import { getBuildBasePath } from './get-base-path.mjs';

process.stdout.write(getBuildBasePath());

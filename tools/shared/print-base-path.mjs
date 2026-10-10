/**
 * Print the deploy base path for the current context.
 *
 * Exists so build commands can pass a subpath to Expo's `experiments.baseUrl`
 * without duplicating the logic: `getBranchBasePath()` already encodes it
 * (dev server → '/', production configuration → '/', CI branch → '/branches/<b>').
 *
 * Usage, from an app directory:
 *
 *   EXPO_BASE_URL=$(node ../../tools/shared/print-base-path.mjs) expo export ...
 *
 * Prints without a trailing newline so it can be interpolated directly.
 */
import { getBranchBasePath } from './get-base-path.mjs';

process.stdout.write(getBranchBasePath());

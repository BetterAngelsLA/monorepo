/**
 * Print the deploy base path for the current context, for `experiments.baseUrl`:
 *   EXPO_BASE_URL=$(node ../../tools/shared/print-base-path.mjs) expo export ...
 * No trailing newline, so it interpolates directly.
 */
import { getBranchBasePath } from './get-base-path.mjs';

process.stdout.write(getBranchBasePath());

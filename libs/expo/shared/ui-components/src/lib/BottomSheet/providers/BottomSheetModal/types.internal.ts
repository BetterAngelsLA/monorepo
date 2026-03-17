import { ReactNode } from 'react';
import { BottomSheetOptions, BottomSheetRenderApi } from '../../types';

/**
 * Internal representation of an active sheet instance.
 *
 * - `id` uniquely identifies the sheet
 * - `render` is the caller-provided render function
 * - `options` is the fully resolved configuration object
 */
export type TBottomSheetInstance = {
  id: string;
  render: (api: BottomSheetRenderApi) => ReactNode;
  options: BottomSheetOptions;
};

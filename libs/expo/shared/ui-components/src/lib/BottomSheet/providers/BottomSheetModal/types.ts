import { ReactNode } from 'react';
import {
  BottomSheetOptions,
  BottomSheetRenderApi,
  StackBehavior,
} from '../../types';
import type { GORHOM_MODAL_STATUS } from './constants';

/**
 * Internal representation of an active sheet instance.
 *
 * - `id` uniquely identifies the sheet
 * - `render` is the caller-provided render function
 * - `options` is the fully resolved configuration object
 * - `stackBehavior` is how this sheet was opened relative to the previous ones
 */
export type TBottomSheetInstance = {
  id: string;
  render: (api: BottomSheetRenderApi) => ReactNode;
  options: BottomSheetOptions;
  stackBehavior?: StackBehavior;
};

/**
 * The mutable part of a sheet: its four lifecycle flags. Everything else on a
 * record is set once, when it is created. See SHEET LIFECYCLE in the
 * `useSheetStack` header.
 */
export type TSheetFlags = {
  presented: boolean;
  closing: boolean;
  dismissed: boolean;
  closeNotified: boolean;
};

/** A live sheet: the caller's inputs plus its lifecycle flags. */
export type TSheet = TBottomSheetInstance & TSheetFlags;

/**
 * Gorhom's `MODAL_STATUS` type.
 * Mirrored via GORHOM_MODAL_STATUS as the enum is not exported.
 *
 * The import above is `import type`: the enum is only ever read in this type
 * query, so nothing survives to runtime and `constants.ts` is free to depend on
 * this module without a cycle.
 */
export type TGorhomModalStatus =
  (typeof GORHOM_MODAL_STATUS)[keyof typeof GORHOM_MODAL_STATUS];

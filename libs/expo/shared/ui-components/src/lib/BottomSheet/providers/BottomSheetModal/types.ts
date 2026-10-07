import { ReactNode } from 'react';
import {
  BottomSheetOptions,
  BottomSheetRenderApi,
  StackBehavior,
} from '../../types';

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
 * record is set once, when it is created. See SHEET LIFECYCLE in the provider
 * header.
 */
export type TSheetFlags = {
  presented: boolean;
  closing: boolean;
  dismissed: boolean;
  closeNotified: boolean;
};

/** A live sheet: the caller's inputs plus its lifecycle flags. */
export type TSheet = TBottomSheetInstance & TSheetFlags;

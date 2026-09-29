// Thin shim for expo-image.
//
// The real module runs an intersection-observer integration at import time
// against a native registry that does not exist under test, so merely importing
// it throws before any component renders. Nothing in these tests asserts on
// image loading — they assert on text and tag styling — so a plain View stands
// in for the component and the observer entry points are no-ops.
//
// Wired in via a resolve alias in vite.config.mts, matching how
// expo-file-system and expo-modules-core are already handled.
import { Ref } from 'react';
import { View, ViewProps } from 'react-native';

type Props = ViewProps & { ref?: Ref<View> };

export const Image = ({ ref, ...props }: Props) => (
  <View ref={ref} {...props} />
);

export const ImageBackground = Image;

// Named for the export it replaces, so the `use` prefix is required here even
// though the stub calls no hooks.
// eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix
export function useImage() {
  return null;
}

export const prefetch = async () => true;
export const clearMemoryCache = async () => true;
export const clearDiskCache = async () => true;
export const getCachePathAsync = async () => null;
export const loadAsync = async () => null;

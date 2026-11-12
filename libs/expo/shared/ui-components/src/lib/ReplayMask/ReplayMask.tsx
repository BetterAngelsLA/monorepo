import { PostHogMaskView } from 'posthog-react-native';
import { ReactNode } from 'react';
import { ViewProps } from 'react-native';

type TProps = ViewProps & { children: ReactNode };

/**
 * Hides a subtree from PostHog session replay.
 *
 * The SDK masks text, inputs, images and iOS pickers automatically, but native
 * views — a PDF, a camera feed, a map — are drawn by their own UIKit/Android
 * surfaces and pass through unmasked.
 *
 * Renders a `View` carrying `ph-no-capture`, so it is a drop-in replacement for
 * a layout `View` around anything showing a client's document, location or
 * surroundings.
 */
export function ReplayMask({ children, ...viewProps }: TProps) {
  return <PostHogMaskView {...viewProps}>{children}</PostHogMaskView>;
}

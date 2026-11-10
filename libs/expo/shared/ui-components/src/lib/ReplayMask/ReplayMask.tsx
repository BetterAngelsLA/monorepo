import { PostHogMaskView } from 'posthog-react-native';
import { ReactNode } from 'react';
import { ViewProps } from 'react-native';

type TProps = ViewProps & { children: ReactNode };

/**
 * Hides a subtree from PostHog session replay.
 *
 * Replay on React Native records **screenshots**, and the SDK's automatic
 * masking only covers text, text inputs, images and iOS system pickers. Native
 * surfaces — a rendered PDF, a live camera feed, a map — are drawn by their own
 * UIKit/Android views and pass through unmasked, so they have to be opted out
 * explicitly.
 *
 * Use this around anything that can show a client's document, location or
 * surroundings. It renders as a plain `View` carrying `ph-no-capture`, so it is
 * a drop-in replacement for a layout `View` and does not change what is drawn.
 */
export function ReplayMask({ children, ...viewProps }: TProps) {
  return <PostHogMaskView {...viewProps}>{children}</PostHogMaskView>;
}

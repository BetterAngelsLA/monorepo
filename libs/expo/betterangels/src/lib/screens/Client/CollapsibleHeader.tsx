import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

type TProps = {
  visible: boolean;
  children: ReactNode;
  testID?: string;
};

/**
 * Hides its children **without unmounting them**, and takes them out of the
 * layout exactly as unmounting would.
 *
 * This exists because conditional rendering was destroying the client header —
 * and with it the profile photo's `<img>` — every time `showHeader` went false
 * (the Locations tab always, and every tab but Profile while the referrals flag
 * is off). `showHeader` also moves while the flag query resolves, so the header
 * could be unmounted and re-mounted without the user going anywhere. Each
 * re-mount is a fresh image element that the browser has to lay out and decode
 * again, which reads as the profile image flickering.
 *
 * Anything whose *visibility* is conditional but whose *mount* is expensive (a
 * loaded image, a webview, a measured layout) belongs in here.
 */
export function CollapsibleHeader(props: TProps) {
  const { visible, children, testID } = props;

  return (
    <View testID={testID} style={visible ? undefined : styles.hidden}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  hidden: {
    display: 'none',
  },
});

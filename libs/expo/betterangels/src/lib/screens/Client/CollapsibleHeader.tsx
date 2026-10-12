import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

type TProps = {
  visible: boolean;
  children: ReactNode;
  testID?: string;
};

/**
 * Hides its children without unmounting them, and takes them out of the layout
 * exactly as unmounting would.
 *
 * Use it when visibility is conditional but mounting is expensive — a loaded image,
 * a webview, a measured layout. A re-mount means a fresh element the browser has to
 * lay out and decode again, which shows up as a flicker.
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

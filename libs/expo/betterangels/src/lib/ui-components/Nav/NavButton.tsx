import { ChevronLeftIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { ElementType } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

export interface INavButton {
  title: string;
  onPress?: () => void;
  route?: string;
  routeParams?: Record<string, string>;
  Icon?: ElementType;
  noChevron?: boolean;
}

export default function NavButton(props: INavButton) {
  const { noChevron, onPress, route, routeParams, title, Icon } = props;

  const router = useRouter();

  return (
    <Pressable
      onPress={() => {
        if (onPress) {
          onPress();
        }

        route &&
          router.navigate({
            pathname: route,
            params: routeParams,
          });
      }}
      accessibilityRole="button"
      style={styles.container}
    >
      {({ pressed }) => (
        <View
          style={[
            {
              backgroundColor: pressed
                ? Colors.NEUTRAL_EXTRA_LIGHT
                : Colors.WHITE,
            },
            styles.pressedView,
          ]}
        >
          {!!Icon && (
            <View style={styles.leftIcon}>
              <Icon color={Colors.PRIMARY_EXTRA_DARK} />
            </View>
          )}

          <View style={styles.content}>
            <TextRegular color={Colors.PRIMARY_EXTRA_DARK}>{title}</TextRegular>
          </View>

          {!noChevron && <ChevronLeftIcon size="sm" rotate={'180deg'} />}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radiuses.xs,
    padding: Spacings.sm,
    backgroundColor: Colors.WHITE,
  },
  pressedView: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    borderRadius: Radiuses.xs,
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.sm,
  },
  leftIcon: {
    marginRight: Spacings.sm,
  },
  content: {
    display: 'flex',
    marginRight: 'auto',
  },
});

import { WFEdit } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { IconButton } from '@monorepo/expo/shared/ui-components';
import { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { InfoList, TInfoListItem } from '../InfoList';

type TClickAction = {
  onClick?: () => void;
  accessibilityHint?: string;
  accessibilityLabel?: string;
  buttonContent?: ReactElement;
};

type TClientProfileInfo = {
  items: TInfoListItem[];
  showAll?: boolean;
  action?: TClickAction;
};

export function ClientProfileInfo(props: TClientProfileInfo) {
  const { items, showAll, action = {} } = props;

  let visibleItems = items;

  const {
    onClick,
    accessibilityLabel = 'edit',
    accessibilityHint = '',
    buttonContent,
  } = action;

  if (!showAll) {
    if (hasSomeContent(items)) {
      visibleItems = items.filter((item) => itemHasContent(item));
    }
  }

  return (
    <View style={styles.container}>
      <InfoList items={items} style={styles.list} />

      {!!onClick && (
        <View style={styles.button}>
          <IconButton
            onPress={onClick}
            accessibilityLabel={accessibilityLabel}
            accessibilityHint={accessibilityHint}
            variant={'transparent'}
            alignItems="center"
          >
            {!!buttonContent ? buttonContent : <WFEdit size="md" />}
          </IconButton>
        </View>
      )}
    </View>
  );
}

function hasSomeContent(items: TInfoListItem[]): boolean {
  return items.some((item) => itemHasContent(item));
}

function itemHasContent(item: TInfoListItem): boolean {
  const content = item.content;

  if (typeof content === 'undefined' || content === null) {
    return false;
  }

  if (typeof content === 'string') {
    return !!content.trim().length;
  }

  return true;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingRight: Spacings.xs,
    backgroundColor: Colors.WHITE,
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.md,
    borderRadius: Radiuses.xs,
  },
  list: {
    flex: 1,
    marginRight: Spacings.sm,
  },
  button: {},
});

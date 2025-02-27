import { WFEdit } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { IconButton } from '@monorepo/expo/shared/ui-components';
import { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  ClientProfileSectionItem,
  TClientProfileSectionItem,
} from './ClientProfileSectionItem';

type TClickAction = {
  onClick?: () => void;
  accessibilityHint?: string;
  accessibilityLabel?: string;
  content?: ReactElement;
};

type TFullNameDetails = {
  items: TClientProfileSectionItem[];
  showAll?: boolean;
  action?: TClickAction;
};

export function ClientProfileSection(props: TFullNameDetails) {
  const { items, showAll, action = {} } = props;

  let visibleItems = items;

  const {
    onClick,
    accessibilityLabel = 'edit',
    accessibilityHint = '',
    content,
  } = action;

  if (!showAll) {
    if (hasSomeContent(items)) {
      visibleItems = items.filter((item) => itemHasContent(item));
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {visibleItems.map((item, idx) => {
          const { content, title, placeholder } = item;

          return (
            <ClientProfileSectionItem
              key={idx}
              content={content}
              title={title}
              placeholder={placeholder}
            />
          );
        })}
      </View>
      <View>
        <IconButton
          onPress={onClick}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          variant={'transparent'}
          alignItems="center"
        >
          {!!content ? content : <WFEdit size="md" />}
        </IconButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: Colors.WHITE,
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.md,
    borderRadius: Radiuses.xs,
  },
  content: {
    flex: 1,
    gap: Spacings.md,
    paddingRight: Spacings.xs,
  },
});

function hasSomeContent(items: TClientProfileSectionItem[]): boolean {
  return items.some((item) => itemHasContent(item));
}

function itemHasContent(item: TClientProfileSectionItem): boolean {
  const content = item.content;

  if (typeof content === 'undefined' || content === null) {
    return false;
  }

  if (typeof content === 'string') {
    return !!content.trim().length;
  }

  return true;
}

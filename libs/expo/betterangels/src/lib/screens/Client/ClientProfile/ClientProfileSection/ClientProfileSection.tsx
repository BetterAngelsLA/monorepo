import { Spacings } from '@monorepo/expo/shared/static';
import { TextBold } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';
import {
  ClientProfileSectionItem,
  TClientProfileSectionItem,
} from './ClientProfileSectionItem';

type TFullNameDetails = {
  items: TClientProfileSectionItem[];
  showAll?: boolean;
};

export function ClientProfileSection(props: TFullNameDetails) {
  const { items, showAll } = props;

  let visibleItems = items;

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
        <TextBold size="sm">Edit</TextBold>
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

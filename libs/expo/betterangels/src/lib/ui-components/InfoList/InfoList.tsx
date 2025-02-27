import { Spacings } from '@monorepo/expo/shared/static';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { InfoListItem, TInfoListItem } from './InfoListItem';

type TInfoList = {
  items: TInfoListItem[];
  showAll?: boolean;
  style?: ViewStyle;
};

export function InfoList(props: TInfoList) {
  const { items, showAll, style } = props;

  let visibleItems = items;

  if (!showAll) {
    if (hasSomeContent(items)) {
      visibleItems = items.filter((item) => itemHasContent(item));
    }
  }

  return (
    <View style={[styles.container, style]}>
      {visibleItems.map((item, idx) => {
        const { content, title, placeholder } = item;

        return (
          <InfoListItem
            key={idx}
            content={content}
            title={title}
            placeholder={placeholder}
          />
        );
      })}
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
    gap: Spacings.md,
  },
});

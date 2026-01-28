import { Colors, FontSizes, Spacings } from '@monorepo/expo/shared/static';
import { SingleSelect, TextOrNode } from '@monorepo/expo/shared/ui-components';
import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { FILE_CATEGORIES, FILE_SUBCATEGORIES } from './categoryConstants';

export const TEMPORARY_DOCUMENT_TYPES = FILE_CATEGORIES.filter(
  (c) => c.status === 1
)
  .map((c) => ({
    categoryId: String(c.id),
    categoryName: c.name,
    types: FILE_SUBCATEGORIES.filter(
      (s) => s.status === 1 && s.ref_category === c.id
    ).map((s) => ({
      value: String(s.id),
      displayValue: s.name,
    })),
  }))
  .filter((group) => group.types.length > 0);

type FileCategorySelectorProps = {
  onSelect: (categoryGroup: {
    categoryId: string;
    subCategoryId: string;
    categoryName: string;
  }) => void;
  header?: string | ReactNode | null;
  style?: ViewStyle;
};

export function FileCategorySelector(props: FileCategorySelectorProps) {
  const {
    onSelect,
    style,
    header = 'Select the right file category and predefined name.',
  } = props;

  return (
    <View style={style}>
      {header && (
        <TextOrNode textStyle={[styles.defaultHeaderText]}>{header}</TextOrNode>
      )}

      <View style={{ gap: Spacings.xs, marginBottom: Spacings.lg }}>
        {TEMPORARY_DOCUMENT_TYPES.map((categoryGroup) => (
          <SingleSelect
            key={categoryGroup.categoryId}
            placeholderTextColor={Colors.PRIMARY_EXTRA_DARK}
            placeholder={categoryGroup.categoryName}
            modalTitle="Document Type"
            onChange={(e) => {
              onSelect({
                categoryId: categoryGroup.categoryId,
                subCategoryId: e || '',
                categoryName: categoryGroup.categoryName,
              });
            }}
            items={categoryGroup.types}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  defaultHeaderText: {
    marginBottom: Spacings.md,
    fontSize: FontSizes.sm.fontSize,
    lineHeight: FontSizes.sm.lineHeight,
  },
});

import { FileCategory, FileName } from '@monorepo/expo/shared/clients';
import { Colors, FontSizes, Spacings } from '@monorepo/expo/shared/static';
import { SingleSelect, TextRegular } from '@monorepo/expo/shared/ui-components';
import { useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

type FileCategorySelectorProps = {
  categories: FileCategory[];
  subCategories: FileName[];
  onSelect: (categoryGroup: {
    categoryId: string;
    subCategoryId: string;
    categoryName: string;
  }) => void;
  style?: ViewStyle;
};

export function FileCategorySelector(props: FileCategorySelectorProps) {
  const { categories, subCategories, onSelect, style } = props;

  const categoryGroups = useMemo(() => {
    return categories
      .filter((category) => category.status === 1)
      .map((category) => {
        const types = subCategories
          .filter((sub) => sub.status === 1 && sub.ref_category === category.id)
          .map((sub) => ({
            value: String(sub.id),
            displayValue: sub.name,
          }));

        return {
          categoryId: String(category.id),
          categoryName: category.name,
          types,
        };
      })
      .filter((group) => group.types.length > 0);
  }, [categories, subCategories]);

  return (
    <View style={style}>
      <TextRegular size="sm" mb="md">
        Select the right file category and predefined name.
      </TextRegular>

      <View style={{ gap: Spacings.xs, marginBottom: Spacings.lg }}>
        {categoryGroups.map((categoryGroup) => (
          <SingleSelect
            key={categoryGroup.categoryId}
            placeholderTextColor={Colors.PRIMARY_EXTRA_DARK}
            placeholder={categoryGroup.categoryName}
            modalTitle="Document Type"
            items={categoryGroup.types}
            onChange={(subCategoryId) => {
              if (!subCategoryId) {
                return;
              }

              onSelect({
                categoryId: categoryGroup.categoryId,
                subCategoryId,
                categoryName: categoryGroup.categoryName,
              });
            }}
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

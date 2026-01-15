import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  SingleSelect,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { Pressable, View } from 'react-native';
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
  closeModal: () => void;
};

export function FileCategorySelector(props: FileCategorySelectorProps) {
  const { onSelect, closeModal } = props;
  return (
    <>
      <Pressable
        style={{ marginLeft: 'auto' }}
        accessible
        accessibilityHint="closes the Upload modal"
        accessibilityRole="button"
        accessibilityLabel="close"
        onPress={closeModal}
      >
        <PlusIcon size="sm" color={Colors.BLACK} rotate="45deg" />
      </Pressable>
      <TextBold mb="xxs" mt="sm" size="lg">
        Upload Files
      </TextBold>

      <TextRegular size="sm" mb="md">
        Select the right file category and predefined name.
      </TextRegular>
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
    </>
  );
}

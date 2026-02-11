import { FileCategory, FileName } from '@monorepo/expo/shared/clients';
import { Colors, FontSizes, Spacings } from '@monorepo/expo/shared/static';
import { SingleSelect, TextOrNode } from '@monorepo/expo/shared/ui-components';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useBottomPrompt } from '../../../../providers';
import { CustomFileNamePrompt } from './CustomFileNamePrompt';

const CUSTOM_FILE_NAME_VALUE = '__CUSTOM__';

type TCustomSelection = {
  categoryId: string;
  categoryName: string;
};

type FileCategorySelectorProps = {
  categories: FileCategory[];
  subCategories: FileName[];
  onSelect: (categoryGroup: {
    categoryId: string;
    subCategoryId: string;
    categoryName: string;
  }) => void;
  disabled?: boolean;
  header?: string | ReactNode | null;
  style?: ViewStyle;
};

export function FileCategorySelector(props: FileCategorySelectorProps) {
  const {
    categories,
    subCategories,
    onSelect,
    disabled,
    style,
    header = 'Select the right file category and predefined name.',
  } = props;

  const { showBottomPrompt } = useBottomPrompt();

  const [customSelection, setCustomSelection] =
    useState<TCustomSelection | null>(null);

  // TODO: show Modal with Input to fill out custom filename
  useEffect(() => {
    console.log('');
    console.log('*****************  customSelection:', customSelection);
    console.log('');
  }, [customSelection]);

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

        // types.push({
        types.unshift({
          value: CUSTOM_FILE_NAME_VALUE,
          displayValue: 'Other (custom)',
        });

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
      {header && (
        <TextOrNode textStyle={[styles.defaultHeaderText]}>{header}</TextOrNode>
      )}

      <View
        style={{
          gap: Spacings.xs,
          marginBottom: Spacings.lg,
        }}
      >
        {categoryGroups.map((categoryGroup) => (
          <SingleSelect
            key={categoryGroup.categoryId}
            disabled={disabled}
            placeholderTextColor={Colors.PRIMARY_EXTRA_DARK}
            placeholder={categoryGroup.categoryName}
            modalTitle="Document Type"
            items={categoryGroup.types}
            onChange={(value) => {
              if (value === CUSTOM_FILE_NAME_VALUE) {
                console.log('');
                console.log('################## CUSTOM_FILE_NAME_VALUE');
                console.log('');
                showBottomPrompt(({ close }) => (
                  <CustomFileNamePrompt
                    categoryName={categoryGroup.categoryName}
                    onSubmit={(customName) => {
                      onSelect({
                        categoryId: categoryGroup.categoryId,
                        subCategoryId: customName,
                        categoryName: categoryGroup.categoryName,
                      });

                      close();
                    }}
                    onCancel={close}
                  />
                ));

                return;
              }

              onSelect({
                categoryId: categoryGroup.categoryId,
                subCategoryId: value || '',
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

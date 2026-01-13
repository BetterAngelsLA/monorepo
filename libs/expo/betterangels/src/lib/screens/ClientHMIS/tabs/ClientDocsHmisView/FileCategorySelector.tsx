import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  SingleSelect,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { Pressable, View } from 'react-native';

const TEMPORARY_DOCUMENT_TYPES = [
  {
    category: 'Family, Social, and Legal',
    types: [
      {
        value: '1',
        displayValue: 'Alimony Agreement',
      },
      {
        value: '2',
        displayValue: 'Court Order or Records',
      },
      {
        value: '3',
        displayValue: 'Divorce Decree',
      },
      {
        value: '4',
        displayValue: 'Other Family Document',
      },
      {
        value: '5',
        displayValue: 'Other Legal Document',
      },
      {
        value: '6',
        displayValue: 'Other Social Document',
      },
      {
        value: '7',
        displayValue: 'Passport or Visa',
      },
      {
        value: '8',
        displayValue: 'Police Citations',
      },
      {
        value: '9',
        displayValue: 'Voter Registration Card',
      },
      {
        value: '10',
        displayValue: 'Other',
      },
    ],
  },
  {
    category: 'Finances and Income',
    types: [
      {
        value: '11',
        displayValue: 'Alimony Agreement',
      },
      {
        value: '12',
        displayValue: 'Bank Records',
      },
      {
        value: '13',
        displayValue: 'Cancelled Check',
      },
      {
        value: '14',
        displayValue: 'Court Order or Records',
      },
      {
        value: '15',
        displayValue: 'Dividends Statement',
      },
      {
        value: '16',
        displayValue: 'Other Financial Document',
      },
      {
        value: '17',
        displayValue: 'Pay Check Stub',
      },
      {
        value: '18',
        displayValue: 'Tax Return',
      },
      {
        value: '19',
        displayValue: 'Utility Bill',
      },
      {
        value: '20',
        displayValue: 'Other',
      },
    ],
  },
  {
    category: 'Health and Medical',
    types: [
      {
        value: '21',
        displayValue: 'Health Insurance Documentation',
      },
      {
        value: '22',
        displayValue: 'Hospital Record of Birth',
      },
      {
        value: '23',
        displayValue: 'Medical Records',
      },
      {
        value: '24',
        displayValue: 'Other Health and Medical Document',
      },
      {
        value: '25',
        displayValue: 'Other',
      },
    ],
  },
];

type FileCategorySelectorProps = {
  onSelect: (categoryGroup: { category: string; value: string }) => void;
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
            key={categoryGroup.category}
            placeholderTextColor={Colors.PRIMARY_EXTRA_DARK}
            placeholder={categoryGroup.category}
            modalTitle="Document Type"
            onChange={(e) => {
              onSelect({
                category: categoryGroup.category,
                value: e || '',
              });
            }}
            items={categoryGroup.types}
          />
        ))}
      </View>
    </>
  );
}

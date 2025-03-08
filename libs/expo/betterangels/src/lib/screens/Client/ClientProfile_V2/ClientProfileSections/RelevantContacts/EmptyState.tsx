import { TextBold } from '@monorepo/expo/shared/ui-components';
import { View, ViewStyle } from 'react-native';
import {
  ClientProfileCard,
  TClientProfileCardItem,
} from '../../../../../ui-components';

type TProps = {
  style?: ViewStyle;
};

export function EmptyState(props: TProps) {
  const { style } = props;

  const content: TClientProfileCardItem[] = [
    {
      header: [CurrentCaseManagerHeader()],
      rows: [[]],
    },

    {
      header: [OtherContactsHeader()],
      rows: [[]],
    },
  ];

  return (
    <View style={style}>
      <ClientProfileCard
        items={content}
        action={{
          onClick: () => alert('add relevant contacts'),
        }}
      />
    </View>
  );
}

function CurrentCaseManagerHeader() {
  return (
    <View>
      <TextBold size="sm">Current Case Manager</TextBold>
    </View>
  );
}

function OtherContactsHeader() {
  return (
    <View>
      <TextBold size="sm">Other Contacts</TextBold>
      <TextBold size="xs">(Mother, Aunt, Child, Organization, etc)</TextBold>
    </View>
  );
}

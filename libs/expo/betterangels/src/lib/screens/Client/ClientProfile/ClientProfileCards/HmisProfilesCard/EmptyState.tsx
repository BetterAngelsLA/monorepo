import { ViewStyle } from 'react-native';
import {
  ClientProfileCard,
  TClientProfileCardItem,
} from '../../../../../ui-components';

type TProps = {
  style?: ViewStyle;
};

export function EmptyState(props: TProps) {
  const { style } = props;

  const emptyField: TClientProfileCardItem[] = [
    {
      rows: [[]],
    },
  ];

  return <ClientProfileCard style={style} title="HMIS ID" items={emptyField} />;
}

import { ViewStyle } from 'react-native';
import {
  ClientProfileCard,
  TClientProfileCardItem,
} from '../../../../../ui-components';

type TProps = {
  title?: string;
  subtitle?: string;
  style?: ViewStyle;
};

export function EmptyState(props: TProps) {
  const { style, subtitle, title } = props;

  const emptyField: TClientProfileCardItem[] = [
    {
      rows: [[]],
    },
  ];

  return (
    <ClientProfileCard
      style={style}
      title={title}
      subtitle={subtitle}
      items={emptyField}
    />
  );
}

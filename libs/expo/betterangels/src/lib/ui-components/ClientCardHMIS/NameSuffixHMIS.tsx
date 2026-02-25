import { TextBold } from '@monorepo/expo/shared/ui-components';
import { View, ViewStyle } from 'react-native';
import { HmisSuffixEnum, Maybe } from '../../apollo';
import { getExistingHmisSuffix } from '../../static';

const IgnoredSuffix: HmisSuffixEnum[] = [
  HmisSuffixEnum.DontKnow,
  HmisSuffixEnum.NoAnswer,
] as const;

export interface IClientCardProps {
  suffix: Maybe<HmisSuffixEnum> | undefined;
  style?: ViewStyle;
}

export function NameSuffixHMIS(props: IClientCardProps) {
  const { suffix, style } = props;

  if (!suffix || IgnoredSuffix.includes(suffix)) {
    return null;
  }

  return (
    <View style={style}>
      <TextBold>{getExistingHmisSuffix(suffix)}</TextBold>
    </View>
  );
}

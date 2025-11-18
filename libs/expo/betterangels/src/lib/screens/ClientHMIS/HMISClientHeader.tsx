import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextMedium } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { HmisClientProfileType, HmisSuffixEnum } from '../../apollo';
import { getExistingHmisSuffix } from '../../static';

interface IClientHeaderProps {
  client?: HmisClientProfileType;
}

export function HMISClientHeader(props: IClientHeaderProps) {
  const { client } = props;

  const { firstName, lastName, nameMiddle, alias, nameSuffix } = client || {};

  const nameParts = [firstName, nameMiddle, lastName].filter((s) => !!s);

  const visibleSuffix = getExistingHmisSuffix(nameSuffix as HmisSuffixEnum);

  if (visibleSuffix) {
    nameParts.push(visibleSuffix);
  }

  if (alias) {
    nameParts.push(`(${alias})`);
  }

  if (!nameParts.length) {
    return null;
  }

  return (
    <View
      style={{
        paddingHorizontal: Spacings.sm,
        backgroundColor: Colors.WHITE,
        paddingVertical: Spacings.md,
        gap: Spacings.xs,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: Spacings.xxs,
        }}
      >
        <TextMedium size="lg">{nameParts.join(' ')}</TextMedium>
      </View>
    </View>
  );
}

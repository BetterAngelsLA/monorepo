import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  TextBold,
  TextRegular,
  formatDateStatic,
} from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';
import { HmisClientType } from '../../apollo';

export interface IClientCardProps {
  client: HmisClientType;
}

export function ClientCardHMIS(props: IClientCardProps) {
  const {
    client: { firstName, lastName, dob, data: metadata },
  } = props;

  const { alias, middleName } = metadata || {};

  return (
    <View style={styles.container}>
      <View style={[styles.row, { gap: 2 }]}>
        <TextBold size="sm">{firstName}</TextBold>
        {!!middleName && <TextBold size="sm">{middleName}</TextBold>}
        <TextBold size="sm">{lastName}</TextBold>
        {!!alias && <TextBold size="sm">({alias})</TextBold>}
      </View>

      {!!dob && (
        <View style={styles.row}>
          <TextRegular size="xs">
            {formatDateStatic({
              date: dob,
              inputFormat: 'yyyy-MM-dd',
              outputFormat: 'MM/dd/yyyy',
            })}
          </TextRegular>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radiuses.xs,
    padding: Spacings.xs,
    backgroundColor: Colors.WHITE,
    gap: Spacings.xxs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 0,
  },
});

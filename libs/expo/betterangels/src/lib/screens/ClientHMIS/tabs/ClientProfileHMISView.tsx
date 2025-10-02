import { TextBold } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { HmisClientType } from '../../../apollo';
import { ClientProfileSectionEnum } from '../../../screenRouting';

type TProps = {
  client?: HmisClientType;
  openCard?: ClientProfileSectionEnum | null;
};

export function ClientProfileHMISView(props: TProps) {
  const { client, openCard } = props;

  return (
    <View>
      <TextBold>HELLO PROFILE TAB</TextBold>
    </View>
  );
}

import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { IconButton, TextBold } from '@monorepo/expo/shared/ui-components';
import { router } from 'expo-router';
import { View } from 'react-native';
import { HmisClientType } from '../../../../apollo';

type TProps = {
  client?: HmisClientType;
};

export function ClientInteractionsHmisView(props: TProps) {
  const { client } = props;

  function onCreatePress() {
    console.log('CLICKED create btn');

    router.navigate('/hmis-notes/create');
  }

  return (
    <View>
      <TextBold>hello interactions tab</TextBold>

      <IconButton
        // disabled={isDisabled}
        variant="secondary"
        borderColor={Colors.WHITE}
        accessibilityLabel="asdf"
        accessibilityHint="asdf"
        onPress={onCreatePress}
      >
        <PlusIcon />
      </IconButton>
    </View>
  );
}

{
  /* <CreateClientInteractionBtn
  clientProfileId={clientProfile.id}
  onCreated={(noteId) => {
    closeModal();
    router.navigate(`/add-note/${noteId}`);
  }}
  style={{ width: '100%' }}
  >
  <MainModalActionBtnBody title="Add Interaction" Icon={FilePlusIcon} />
  </CreateClientInteractionBtn> */
}

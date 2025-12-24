import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { IconButton, TextMedium } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { ClientDocumentType } from '../../../apollo';
import { useModalScreen } from '../../../providers';
import { ClientProfileQuery } from '../__generated__/Client.generated';
import Documents from './Documents';
import UploadModal from './UploadModal';

export default function Docs({
  client,
}: {
  client: ClientProfileQuery | undefined;
}) {
  const [expanded, setExpanded] = useState<undefined | string | null>();
  const { showModalScreen } = useModalScreen();

  const props = {
    expanded,
    setExpanded,
  };

  return (
    <ScrollView
      contentContainerStyle={{ paddingVertical: Spacings.lg }}
      style={{ paddingHorizontal: Spacings.sm }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <TextMedium size="lg">Doc Library</TextMedium>
        <IconButton
          onPress={() =>
            showModalScreen({
              presentation: 'fullScreenModal',
              hideHeader: true,
              renderContent: ({ close }) => (
                <UploadModal client={client} closeModal={close} />
              ),
            })
          }
          variant="secondary"
          borderColor={Colors.WHITE}
          accessibilityLabel={'add document'}
          accessibilityHint={'add a new document'}
        >
          <PlusIcon />
        </IconButton>
      </View>
      <View style={{ gap: Spacings.xs, marginTop: Spacings.sm }}>
        {client?.clientProfile.docReadyDocuments &&
          client?.clientProfile.docReadyDocuments?.length > 0 && (
            <Documents
              title="Doc Ready"
              {...props}
              data={
                client?.clientProfile.docReadyDocuments as ClientDocumentType[]
              }
              clientId={client?.clientProfile.id}
            />
          )}
        {client?.clientProfile.consentFormDocuments &&
          client?.clientProfile.consentFormDocuments?.length > 0 && (
            <Documents
              title="Forms"
              {...props}
              data={
                client?.clientProfile
                  .consentFormDocuments as ClientDocumentType[]
              }
              clientId={client?.clientProfile.id}
            />
          )}
        {client?.clientProfile.otherDocuments &&
          client?.clientProfile.otherDocuments?.length > 0 && (
            <Documents
              title="Other"
              {...props}
              data={
                client?.clientProfile.otherDocuments as ClientDocumentType[]
              }
              clientId={client?.clientProfile.id}
            />
          )}
      </View>
    </ScrollView>
  );
}

import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { IconButton, TextMedium } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { ClientDocumentType } from '../../../apollo';
import { useModalScreen } from '../../../providers';
import { ClientProfileQuery } from '../__generated__/Client.generated';
import Documents from './Documents';
import EmptyState from './EmptyState';
import { DOC_FOLDER_TITLES } from './folders';
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

  const hasDocReadyDocuments =
    !!client?.clientProfile.docReadyDocuments?.length;

  const hasConsentFormDocuments =
    !!client?.clientProfile.consentFormDocuments?.length;

  const hasOtherDocuments = !!client?.clientProfile.otherDocuments?.length;

  const hasAnyDocuments =
    hasDocReadyDocuments || hasConsentFormDocuments || hasOtherDocuments;

  return (
    <ScrollView
      contentContainerStyle={{ paddingVertical: Spacings.lg }}
      style={{ paddingHorizontal: Spacings.sm }}
    >
      <View
        testID="client-view-docs"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <TextMedium size="lg">Doc Library</TextMedium>
        <IconButton
          testID="open-client-docs-upload-screen-btn"
          onPress={() =>
            showModalScreen({
              presentation: 'fullScreenModal',
              title: 'Upload Files',
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
        {!hasAnyDocuments ? (
          <EmptyState />
        ) : (
          <>
            {hasDocReadyDocuments && (
              <Documents
                title={DOC_FOLDER_TITLES.DOC_READY}
                {...props}
                data={
                  client?.clientProfile
                    .docReadyDocuments as ClientDocumentType[]
                }
                clientId={client?.clientProfile.id ?? ''}
              />
            )}

            {hasConsentFormDocuments && (
              <Documents
                title={DOC_FOLDER_TITLES.FORMS}
                {...props}
                data={
                  client?.clientProfile
                    .consentFormDocuments as ClientDocumentType[]
                }
                clientId={client?.clientProfile.id ?? ''}
              />
            )}

            {hasOtherDocuments && (
              <Documents
                title={DOC_FOLDER_TITLES.OTHER}
                {...props}
                data={
                  client?.clientProfile.otherDocuments as ClientDocumentType[]
                }
                clientId={client?.clientProfile.id ?? ''}
              />
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

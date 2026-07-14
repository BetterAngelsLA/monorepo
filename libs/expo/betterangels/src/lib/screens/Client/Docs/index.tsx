import { NoFilesYet, PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { IconButton, TextMedium } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { ClientDocumentType } from '../../../apollo';
import { useSnackbar } from '../../../hooks';
import { useModalScreen } from '../../../providers';
import { ClientProfileQuery } from '../__generated__/Client.generated';
import Documents from './Documents';
import UploadModal from './UploadModal';

export default function Docs({
  client,
}: {
  client: ClientProfileQuery | undefined;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [expanded, setExpanded] = useState<undefined | string | null>();
  const { showModalScreen } = useModalScreen();
  const { showSnackbar } = useSnackbar();

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
    <View style={{ flex: 1 }}>
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
            onPress={() => {
              showModalScreen({
                presentation: 'fullScreenModal',
                title: 'Upload Files',
                renderContent: ({ close }) => (
                  <UploadModal
                    client={client}
                    closeModal={close}
                    onUploadStart={() => setIsUploading(true)}
                    onUploadSuccess={() => {
                      setIsUploading(false);

                      showSnackbar({
                        message: 'File uploaded successfully.',
                        type: 'success',
                      });
                    }}
                    onUploadError={() => {
                      setIsUploading(false);

                      showSnackbar({
                        message: 'Upload failed. Please try again.',
                        type: 'error',
                      });
                    }}
                  />
                ),
              });
            }}
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
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: Spacings.lg,
                paddingTop: 50,
              }}
            >
              <NoFilesYet size={350} />
            </View>
          ) : (
            <View style={{ gap: Spacings.xs, marginTop: Spacings.sm }}>
              {hasDocReadyDocuments && (
                <Documents
                  title="Doc Ready"
                  {...props}
                  data={
                    client?.clientProfile
                      .docReadyDocuments as ClientDocumentType[]
                  }
                  clientId={client?.clientProfile.id}
                />
              )}

              {hasConsentFormDocuments && (
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

              {hasOtherDocuments && (
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
          )}
        </View>
      </ScrollView>

      {isUploading && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: Colors.WHITE,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ActivityIndicator
            size="large"
            style={{ transform: [{ translateY: -40 }] }}
          />
        </View>
      )}
    </View>
  );
}

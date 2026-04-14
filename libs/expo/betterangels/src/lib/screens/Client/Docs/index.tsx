import { NoFilesYet, PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  IconButton,
  TextBold,
  TextMedium,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const [banner, setBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const { showModalScreen } = useModalScreen();
  const insets = useSafeAreaInsets();

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
        contentContainerStyle={{ paddingVertical: Spacings.lg, flexGrow: 1 }}
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
                title: 'Upload Files',
                renderContent: ({ close }) => (
                  <UploadModal
                    client={client}
                    closeModal={close}
                    onUploadSuccess={(message: string) => {
                      setBanner({
                        type: 'success',
                        message,
                      });
                    }}
                    onUploadError={(message: string) => {
                      setBanner({
                        type: 'error',
                        message,
                      });
                    }}
                  />
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
      </ScrollView>

      {banner && (
        <View
          style={{
            position: 'absolute',
            left: 33,
            right: 22,
            bottom: insets.bottom + 24,
            height: 48,
            backgroundColor: banner.type === 'success' ? '#EAF8EE' : '#FFF4F4',
            borderColor: banner.type === 'success' ? '#22C55E' : '#FF3B30',
            borderWidth: 1,
            borderRadius: 4,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <TextRegular size="sm">{banner.message}</TextRegular>

          <Pressable accessibilityRole="button" onPress={() => setBanner(null)}>
            <TextBold size="sm">Close</TextBold>
          </Pressable>
        </View>
      )}
    </View>
  );
}

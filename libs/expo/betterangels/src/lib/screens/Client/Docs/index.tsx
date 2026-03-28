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

  // const [createSignature, { loading }] = useMutation(
  //   GenerateClientDocumentUploadUrlDocument,
  //   {}
  // );

  // useEffect(() => {
  //   console.log('*****************  loading:', loading);
  // }, [loading]);

  // generateClientDocumentUploadUrl(filename: String!, contentType: String!): GenerateClientDocumentUploadUrlPayload! @hasPerm(permissions: [{app: "common", permission: "add_attachment"}], any: true)
  // async function getSig() {
  //   console.log('');
  //   console.log('################################### getSig');
  //   console.log('');

  //   const filename = 'test.txt';
  //   const file = new File(Paths.cache, filename);

  //   file.write('hello world');

  //   const fileUri = file.uri;

  //   if (!client) {
  //     return;
  //   }

  //   //     @strawberry.input
  //   // class PresignedClientUploadInput:
  //   //     client_profile: ID
  //   //     filename: str
  //   //     content_type: str

  //   try {
  //     const result = await createSignature({
  //       variables: {
  //         data: {
  //           filename: filename,
  //           clientProfile: client.clientProfile.id,
  //           contentType: 'text/plain',
  //         },
  //       },
  //     });

  //     console.log();
  //     console.log('| -------------  SIG result  ------------- |');
  //     console.log(JSON.stringify(result, null, 2));
  //     console.log();

  //     const payload = result.data?.generateClientDocumentUploadUrl;

  //     if (!payload) {
  //       throw new Error('Missing response');
  //     }

  //     if (payload.__typename === 'OperationInfo') {
  //       throw new Error(payload.messages.map((m) => m.message).join(', '));
  //     }

  //     if (payload.__typename !== 'PresignedUploadOutput') {
  //       throw new Error('Unexpected response type');
  //     }

  //     const presignedPost = {
  //       url: payload.url,
  //       fields: payload.fields as Record<string, string>,
  //       key: payload.key,
  //     };

  //     console.log();
  //     console.log('| -------------  presignedPost  ------------- |');
  //     console.log(JSON.stringify(presignedPost, null, 2));
  //     console.log();

  //     await uploadFileToS3WithPresignedPost({
  //       presignedPost,
  //       fileUri,
  //       fileName: filename,
  //     });
  //   } catch (err) {
  //     console.error(`error SIG `, err);
  //   }
  // }

  // <Button title="get sig" onPress={getSig} />
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
        <TextMedium size="lg">Doc Library x</TextMedium>
        <IconButton
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

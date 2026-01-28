import type { ClientFile, FileCategory } from '@monorepo/expo/shared/clients';
import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  IconButton,
  TextMedium,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { HmisClientProfileType } from '../../../../apollo';
import { useHmisClient } from '../../../../hooks';
import { useModalScreen } from '../../../../providers';
import UploadModalHmis from './UploadModalHmis';

export function ClientDocsHmisView({
  client,
}: {
  client: HmisClientProfileType | undefined;
}) {
  const { showModalScreen } = useModalScreen();
  const { getClientFiles, getFileCategories } = useHmisClient();
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [files, setFiles] = useState<ClientFile[]>([]);
  const [categories, setCategories] = useState<FileCategory[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!client?.id) {
      setFiles([]);
      setStatus('idle');
      return;
    }

    let isActive = true;
    setStatus('loading');
    setError(null);

    getFileCategories().then((categories) => {
      setCategories(categories);
    });

    getClientFiles(client.hmisId as string)
      .then((data) => {
        if (!isActive) {
          return;
        }
        setFiles(data.items ?? []);
        setStatus('success');
      })
      .catch((err) => {
        if (!isActive) {
          return;
        }
        const message =
          err instanceof Error ? err.message : 'Failed to load documents.';
        setError(message);
        setStatus('error');
      });

    return () => {
      isActive = false;
    };
  }, [client?.id, client?.hmisId, getClientFiles]);

  const emptyLabel = useMemo(() => {
    if (!client?.id) {
      return 'Select a client to view documents.';
    }
    return 'No documents found.';
  }, [client?.id]);

  const getFileLabel = (file: ClientFile, index: number) => {
    return (
      file.file?.filename ||
      file.fileName?.name ||
      file.name ||
      (file.id ? `Document ${file.id}` : `Document ${index + 1}`)
    );
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
                <UploadModalHmis client={client} closeModal={close} />
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
        {status === 'loading' && (
          <TextRegular color={Colors.NEUTRAL_DARK}>
            Loading documents…
          </TextRegular>
        )}

        {status === 'error' && (
          <TextRegular color={Colors.ERROR_DARK}>
            {error || 'Failed to load documents.'}
          </TextRegular>
        )}

        {status !== 'loading' && status !== 'error' && files.length === 0 && (
          <TextRegular color={Colors.NEUTRAL_DARK}>{emptyLabel}</TextRegular>
        )}

        {files.map((file, index) => (
          <TextMedium key={String(file?.id ?? index)}>
            {getFileLabel(file, index)}
          </TextMedium>
        ))}
      </View>
    </ScrollView>
  );
}

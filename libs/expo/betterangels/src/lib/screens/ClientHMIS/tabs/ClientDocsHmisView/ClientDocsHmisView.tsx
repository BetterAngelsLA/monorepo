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
import {
  useHmisClient,
  useHmisFileCategories,
  useHmisFileNames,
} from '../../../../hooks';
import {
  groupFilesByCategory,
  useClientFiles,
} from '../../../../hooks/hmisFileMetadata';
import { useModalScreen } from '../../../../providers';
import HmisDocuments from './HmisDocuments';
import UploadModalHmis from './UploadModalHmis';

export function ClientDocsHmisView({
  client,
}: {
  client: HmisClientProfileType | undefined;
}) {
  const { showModalScreen } = useModalScreen();
  const { data: categories = [] } = useHmisFileCategories();
  const {
    data: fileNames = [],
    isError: isFileNamesError,
    error: fileNamesError,
  } = useHmisFileNames();

  useEffect(() => {
    if (isFileNamesError && fileNamesError) {
      console.error(
        '[ClientDocsHmisView] File names failed to load:',
        fileNamesError
      );
    }
  }, [isFileNamesError, fileNamesError]);
  const { getClientFiles } = useHmisClient();
  const { files, status, error, isLoading, isError } = useClientFiles(
    client?.id,
    client?.hmisId as string | undefined
  );

  const [expanded, setExpanded] = useState<undefined | string | null>(null);

  const filesByCategory = useMemo(
    () => groupFilesByCategory(files, categories),
    [files, categories]
  );
  useEffect(() => {
    if (!client?.id || !client?.hmisId) {
      return;
    }
    getClientFiles(client.hmisId as string, {
      fields:
        'id,ref_category,ref_file_name,ref_agency,name,is_program_file,file.*,category,fileName',
    })
      .then((data) => {
        console.log('[ClientDocsHmisView] Documents loaded:', data);
      })
      .catch((err) => {
        console.error('[ClientDocsHmisView] Failed to load documents:', err);
      });
  }, [client?.id, client?.hmisId, getClientFiles]);
  const showEmpty = !isLoading && !isError && files.length === 0;

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
              title: 'Upload Files',
              renderContent: () => <UploadModalHmis client={client} />,
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

        {showEmpty && (
          <TextRegular color={Colors.NEUTRAL_DARK}>
            No documents found.
          </TextRegular>
        )}

        {filesByCategory.map(({ category, files: categoryFiles }) => (
          <HmisDocuments
            key={String(category?.id ?? 'other')}
            expanded={expanded}
            setExpanded={setExpanded}
            accordionKey={String(category?.id ?? 'other')}
            title={category?.name ?? `Category ${category?.id}`}
            data={categoryFiles}
            fileNames={fileNames}
          />
        ))}
      </View>
    </ScrollView>
  );
}

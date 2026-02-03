import { FileSearchIcon, PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { StyleSheet, View } from 'react-native';

import {
  IconButton,
  LoadingView,
  TextBold,
  TextMedium,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { HmisClientProfileType } from '../../../../apollo';
import { useHmisFileCategoryAndNames } from '../../../../hooks';
import { useClientFiles } from '../../../../hooks/hmisFileMetadata';
import { useModalScreen } from '../../../../providers';
import HmisDocuments from './HmisDocuments';
import UploadModalHmis from './UploadModalHmis';
import { groupFilesByCategory } from './groupFilesByCategory';

export function ClientDocsHmisView({
  client,
}: {
  client: HmisClientProfileType | undefined;
}) {
  const { showModalScreen } = useModalScreen();
  const meta = useHmisFileCategoryAndNames();

  useEffect(() => {
    if (meta.error) {
      console.error(
        '[ClientDocsHmisView] File categories/names failed to load:',
        meta.error
      );
    }
  }, [meta.error]);

  const filesQuery = useClientFiles(
    client?.id,
    client?.hmisId as string | undefined
  );

  const isLoading = meta.loading || filesQuery.isLoading;
  const files = useMemo(() => filesQuery.data ?? [], [filesQuery.data]);

  const [expanded, setExpanded] = useState<undefined | string | null>(null);

  const filesByCategory = useMemo(
    () => groupFilesByCategory(files, meta.categories),
    [files, meta.categories]
  );
  const showEmpty = !isLoading && !filesQuery.isError && files.length === 0;

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
        {isLoading ? (
          <LoadingView />
        ) : filesQuery.isError ? (
          <TextRegular color={Colors.ERROR_DARK}>
            {filesQuery.error instanceof Error
              ? filesQuery.error.message
              : 'Failed to load documents.'}
          </TextRegular>
        ) : showEmpty ? (
          <View style={[styles.container]}>
            <View
              style={{
                height: 90,
                width: 90,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: Radiuses.xxxl,
                backgroundColor: Colors.PRIMARY_EXTRA_LIGHT,
                marginBottom: Spacings.md,
              }}
            >
              <FileSearchIcon size="2xl" color={Colors.PRIMARY} />
            </View>
            <TextBold mb="xs" size="sm">
              No documents
            </TextBold>
          </View>
        ) : (
          filesByCategory.map(({ category, files: categoryFiles }) => (
            <HmisDocuments
              key={String(category?.id ?? 'other')}
              expanded={expanded}
              setExpanded={setExpanded}
              accordionKey={String(category?.id ?? 'other')}
              title={category?.name ?? `Category ${category?.id}`}
              data={categoryFiles}
              fileNames={meta.fileNames}
              clientId={client?.id}
              hmisId={client?.hmisId ?? undefined}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
});

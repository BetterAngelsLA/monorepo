import type { ClientFile, FileName } from '@monorepo/expo/shared/clients';
import { FolderIcon, FolderOpenIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { Accordion } from '@monorepo/expo/shared/ui-components';
import { router } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import * as R from 'remeda';
import { HmisDocumentItem } from './HmisDocumentItem';

export interface HmisDocumentsProps {
  expanded: undefined | string | null;
  setExpanded: (expanded: undefined | string | null) => void;
  accordionKey: string;
  title: string;
  data: ClientFile[];
  fileNames: FileName[];
  clientId?: string;
  hmisId?: string;
}

export default function HmisDocuments({
  expanded,
  setExpanded,
  accordionKey,
  title,
  data,
  fileNames,
  clientId,
  hmisId,
}: HmisDocumentsProps) {
  const isExpanded = expanded === accordionKey;
  const fileNameMap = useMemo(
    () => R.indexBy(fileNames, (n) => n.id),
    [fileNames]
  );

  const handlePress = useCallback(
    (
      id: number,
      preview: { uri: string; mimeType: string },
      params: { label: string; createdAt: string }
    ) => {
      router.navigate({
        pathname: `/hmis-file/${id}`,
        params: { ...params, clientId, hmisId },
      });
    },
    [clientId, hmisId]
  );

  return (
    <Accordion
      icon={isExpanded ? <FolderOpenIcon /> : <FolderIcon />}
      borderWidth={1}
      borderColor={Colors.PRIMARY_LIGHT}
      borderRadius={Radiuses.xs}
      bg={Colors.PRIMARY_EXTRA_LIGHT}
      expanded={expanded}
      setExpanded={() => setExpanded(isExpanded ? null : accordionKey)}
      title={title}
    >
      {isExpanded && (
        <View
          style={{
            gap: Spacings.xs,
            paddingVertical: Spacings.sm,
            paddingHorizontal: Spacings.xs,
            backgroundColor: Colors.WHITE,
          }}
        >
          {data.map((file, idx) => (
            <HmisDocumentItem
              key={file.id ?? idx}
              file={file}
              fileNameMap={fileNameMap}
              onPress={handlePress}
            />
          ))}
        </View>
      )}
    </Accordion>
  );
}

import { FolderIcon, FolderOpenIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { Accordion, FileCard } from '@monorepo/expo/shared/ui-components';
import { toTestId } from '@monorepo/expo/shared/utils';
import { useState } from 'react';
import { View } from 'react-native';
import { ClientDocumentType, Maybe } from '../../../apollo';
import { DocumentModal, FileThumbnail } from '../../../ui-components';
import type { TDocFolder } from './folders';

interface IDocumentsProps {
  expanded: undefined | string | null;
  setExpanded: (expanded: undefined | string | null) => void;
  data: ClientDocumentType[];
  clientId: string;
  title: TDocFolder;
}

export default function Documents(props: IDocumentsProps) {
  const { expanded, setExpanded, data, clientId, title } = props;
  const [selectedDocument, setSelectedDocument] = useState<
    Maybe<ClientDocumentType> | undefined
  >(undefined);
  const [deletingIds, setDeletingIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const isOtherDocuments = expanded === title;

  return (
    <Accordion
      icon={isOtherDocuments ? <FolderOpenIcon /> : <FolderIcon />}
      borderWidth={1}
      borderColor={Colors.PRIMARY_LIGHT}
      borderRadius={Radiuses.xs}
      bg={Colors.PRIMARY_EXTRA_LIGHT}
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isOtherDocuments ? null : title);
      }}
      title={title}
      testId={toTestId(['client-docs-accordion', title])}
    >
      {isOtherDocuments && (
        <View
          style={{
            height: isOtherDocuments ? 'auto' : 0,
            overflow: 'hidden',
            gap: Spacings.xs,
            paddingVertical: Spacings.sm,
            paddingHorizontal: Spacings.xs,
            backgroundColor: Colors.WHITE,
          }}
        >
          {data?.map((document) => (
            <FileCard
              key={document.id}
              disabled={deletingIds.has(document.id)}
              filename={document.originalFilename}
              url={document.file.url}
              onPress={() => setSelectedDocument(document)}
              testId={toTestId(['file-card', document.originalFilename])}
              createdAt={document.createdAt}
              thumbnail={
                <FileThumbnail
                  uri={document.file.url}
                  mimeType={document.mimeType}
                  borderRadius={Radiuses.xxxs}
                  thumbnailSize={{
                    width: 36,
                    height: 36,
                  }}
                />
              }
            />
          ))}
        </View>
      )}

      {!!selectedDocument && (
        <DocumentModal
          clientId={clientId}
          closeModal={() => setSelectedDocument(undefined)}
          document={selectedDocument}
          onDeleteStateChange={(documentId, isDeleting) =>
            setDeletingIds((prev) => {
              const next = new Set(prev);
              if (isDeleting) {
                next.add(documentId);
              } else {
                next.delete(documentId);
              }
              return next;
            })
          }
        />
      )}
    </Accordion>
  );
}

import { FolderIcon, FolderOpenIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { Accordion, FileCard } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { View } from 'react-native';
import { ClientDocumentType, Maybe } from '../../../apollo';
import { DocumentModal } from '../../../ui-components';

interface IDocumentsProps {
  expanded: undefined | string | null;
  setExpanded: (expanded: undefined | string | null) => void;
  data: ClientDocumentType[];
  clientId: string;
  title: 'Other' | 'Doc Ready' | 'Forms';
}

export default function Documents(props: IDocumentsProps) {
  const { expanded, setExpanded, data, clientId, title } = props;
  const [selectedDocument, setSelectedDocument] = useState<
    Maybe<ClientDocumentType> | undefined
  >(undefined);

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
              filename={document.originalFilename}
              url={document.file.url}
              onPress={() => setSelectedDocument(document)}
              createdAt={document.createdAt}
            />
          ))}
        </View>
      )}
      {!!selectedDocument && (
        <DocumentModal
          clientId={clientId}
          isModalVisible={!!selectedDocument}
          closeModal={() => setSelectedDocument(undefined)}
          document={selectedDocument}
        />
      )}
    </Accordion>
  );
}

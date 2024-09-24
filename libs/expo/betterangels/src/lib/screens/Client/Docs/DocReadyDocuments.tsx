import { FolderIcon, FolderOpenIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { Accordion, FileCard } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { View } from 'react-native';
import { ClientDocumentType, Maybe } from '../../../apollo';
import { DocumentModal } from '../../../ui-components';

interface IDocReadyDocumentsProps {
  expanded: undefined | string | null;
  setExpanded: (expanded: undefined | string | null) => void;
  data: ClientDocumentType[];
  clientId: string;
}

export default function DocReadyDocuments(props: IDocReadyDocumentsProps) {
  const { expanded, setExpanded, data, clientId } = props;
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<
    Maybe<ClientDocumentType> | undefined
  >(undefined);

  const isDocReadyDocuments = expanded === 'Doc-Ready';

  const openModal = (document: ClientDocumentType) => {
    setSelectedDocument(document);
    setModalIsOpen(true);
  };

  return (
    <Accordion
      icon={isDocReadyDocuments ? <FolderOpenIcon /> : <FolderIcon />}
      borderWidth={1}
      borderColor={Colors.PRIMARY_LIGHT}
      borderRadius={Radiuses.xs}
      bg={Colors.PRIMARY_EXTRA_LIGHT}
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isDocReadyDocuments ? null : 'Doc-Ready');
      }}
      title="Doc-Ready"
    >
      {isDocReadyDocuments && (
        <View
          style={{
            height: isDocReadyDocuments ? 'auto' : 0,
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
              document={document}
              onPress={() => openModal(document)}
            />
          ))}
        </View>
      )}
      {selectedDocument && (
        <DocumentModal
          clientId={clientId}
          isModalVisible={modalIsOpen}
          closeModal={() => setModalIsOpen(false)}
          document={selectedDocument}
        />
      )}
    </Accordion>
  );
}

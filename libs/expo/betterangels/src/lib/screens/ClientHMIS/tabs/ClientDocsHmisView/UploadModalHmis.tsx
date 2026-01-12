import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  BottomActions,
  MediaPickerModal,
  SingleSelect,
  TextBold,
  TextButton,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HmisClientProfileType } from '../../../../apollo';
import { FileUploadsPreview } from '../../../../ui-components';

const TEMPORARY_DOCUMENT_TYPES = [
  {
    category: 'Family, Social, and Legal',
    types: [
      {
        value: '1',
        displayValue: 'Alimony Agreement',
      },
      {
        value: '2',
        displayValue: 'Court Order or Records',
      },
      {
        value: '3',
        displayValue: 'Divorce Decree',
      },
      {
        value: '4',
        displayValue: 'Other Family Document',
      },
      {
        value: '5',
        displayValue: 'Other Legal Document',
      },
      {
        value: '6',
        displayValue: 'Other Social Document',
      },
      {
        value: '7',
        displayValue: 'Passport or Visa',
      },
      {
        value: '8',
        displayValue: 'Police Citations',
      },
      {
        value: '9',
        displayValue: 'Voter Registration Card',
      },
      {
        value: '10',
        displayValue: 'Other',
      },
    ],
  },
  {
    category: 'Finances and Income',
    types: [
      {
        value: '11',
        displayValue: 'Alimony Agreement',
      },
      {
        value: '12',
        displayValue: 'Bank Records',
      },
      {
        value: '13',
        displayValue: 'Cancelled Check',
      },
      {
        value: '14',
        displayValue: 'Court Order or Records',
      },
      {
        value: '15',
        displayValue: 'Dividends Statement',
      },
      {
        value: '16',
        displayValue: 'Other Financial Document',
      },
      {
        value: '17',
        displayValue: 'Pay Check Stub',
      },
      {
        value: '18',
        displayValue: 'Tax Return',
      },
      {
        value: '19',
        displayValue: 'Utility Bill',
      },
      {
        value: '20',
        displayValue: 'Other',
      },
    ],
  },
  {
    category: 'Health and Medical',
    types: [
      {
        value: '21',
        displayValue: 'Health Insurance Documentation',
      },
      {
        value: '22',
        displayValue: 'Hospital Record of Birth',
      },
      {
        value: '23',
        displayValue: 'Medical Records',
      },
      {
        value: '24',
        displayValue: 'Other Health and Medical Document',
      },
      {
        value: '25',
        displayValue: 'Other',
      },
    ],
  },
];

export default function UploadModalHmis(props: {
  client?: HmisClientProfileType;
  closeModal: () => void;
}) {
  const { client, closeModal } = props;
  const [document, setDocument] = useState<ReactNativeFile | undefined>();
  const [documentCategory, setDocumentCategory] = useState({
    category: '',
    value: '',
  });
  const [isModalVisible, setIsModalVisible] = useState(false);

  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom;
  const topOffset = insets.top;

  return (
    <View
      style={{
        paddingTop: topOffset + Spacings.xs,
        backgroundColor: Colors.WHITE,
        flex: 1,
      }}
    >
      <ScrollView
        style={{
          paddingHorizontal: Spacings.sm,
          paddingBottom: 35 + bottomOffset,
        }}
      >
        {document ? (
          <FileUploadsPreview
            files={[document]}
            onRemoveFile={() => setDocument(undefined)}
            title={`Upload ${documentCategory.category}`}
          />
        ) : (
          <>
            <Pressable
              style={{ marginLeft: 'auto' }}
              accessible
              accessibilityHint="closes the Upload modal"
              accessibilityRole="button"
              accessibilityLabel="close"
              onPress={closeModal}
            >
              <PlusIcon size="sm" color={Colors.BLACK} rotate="45deg" />
            </Pressable>
            <TextBold mb="xxs" mt="sm" size="lg">
              Upload Files
            </TextBold>

            <TextRegular size="sm" mb="md">
              Select the right file category and predefined name.
            </TextRegular>
            <View style={{ gap: Spacings.xs, marginBottom: Spacings.lg }}>
              {TEMPORARY_DOCUMENT_TYPES.map((document) => (
                <SingleSelect
                  key={document.category}
                  placeholderAsTitle
                  placeholder={document.category}
                  modalTitle="Document Type"
                  onChange={(e) => {
                    setDocumentCategory({
                      category: document.category,
                      value: e || '',
                    });
                    setIsModalVisible(true);
                  }}
                  items={document.types}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
      {document && (
        <BottomActions
          cancel={
            <TextButton
              onPress={() => setDocument(undefined)}
              title="Cancel"
              accessibilityHint="Cancel upload"
            />
          }
          onSubmit={() => console.log('Uploading file...', client?.id)} // TODO: implement upload logic
        />
      )}
      <MediaPickerModal
        onCapture={(file) => {
          setDocument(file);
        }}
        allowMultiple={false}
        setModalVisible={setIsModalVisible}
        isModalVisible={isModalVisible}
        setFiles={(files) => {
          setDocument(files[0]);
        }}
      />
    </View>
  );
}

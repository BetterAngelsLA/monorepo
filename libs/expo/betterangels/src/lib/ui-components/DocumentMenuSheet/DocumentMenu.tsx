import {
  DeleteIcon,
  DownloadIcon,
  ViewIcon,
  WFEdit,
} from '@monorepo/expo/shared/icons';
import { BottomSheetModalControlled } from '@monorepo/expo/shared/ui-components';
import { View, ViewStyle } from 'react-native';
import { MainModalActionBtn } from '../MainModal';

interface IDocumentMenuProps {
  isOpen: boolean;
  onClose: () => void;
  /** e.g. "file" or "image", used to label the actions. */
  fileTypeLabel: string;
  onView: () => void;
  onEdit: () => void;
  onDownload: () => void;
  onDelete: () => void;
  style?: ViewStyle;
}

/**
 * Presentational bottom-sheet menu of document actions.
 *
 * Purely renders the sheet; all behaviour (navigation, download, delete) is
 * supplied by the caller so this stays free of data/mutation concerns.
 */
export function DocumentMenu({
  isOpen,
  onClose,
  fileTypeLabel,
  onView,
  onEdit,
  onDownload,
  onDelete,
  style,
}: IDocumentMenuProps) {
  return (
    <BottomSheetModalControlled
      isOpen={isOpen}
      onClose={onClose}
      options={{ showCloseButton: true }}
    >
      <View style={style}>
        <MainModalActionBtn
          title={`View ${fileTypeLabel}`}
          testId="view-file-btn"
          Icon={ViewIcon}
          onPress={onView}
        />
        <MainModalActionBtn
          title={`Edit ${fileTypeLabel} name`}
          testId="edit-file-btn"
          Icon={WFEdit}
          onPress={onEdit}
        />
        <MainModalActionBtn
          title={`Download ${fileTypeLabel}`}
          testId="download-file-btn"
          Icon={DownloadIcon}
          onPress={onDownload}
        />
        <MainModalActionBtn
          title={`Delete ${fileTypeLabel}`}
          testId="delete-file-btn"
          Icon={DeleteIcon}
          onPress={onDelete}
        />
      </View>
    </BottomSheetModalControlled>
  );
}

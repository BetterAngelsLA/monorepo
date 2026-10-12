import {
  DeleteIcon,
  DownloadIcon,
  ViewIcon,
  WFEdit,
} from '@monorepo/expo/shared/icons';
import { View, ViewStyle } from 'react-native';
import { MainModalActionBtn } from '../MainModal';

interface IDocumentMenuProps {
  fileTypeLabel: string; // e.g. "file" or "image"
  onView: () => void;
  onEdit: () => void;
  onDownload: () => void;
  onDelete: () => void;
  style?: ViewStyle;
}

export function DocumentMenu(props: IDocumentMenuProps) {
  const { fileTypeLabel, onView, onEdit, onDownload, onDelete, style } = props;

  return (
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
  );
}

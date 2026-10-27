import {
  Table,
  TableActionBtn,
  type TableColumn,
} from '../../../../../base-ui/table';
import type { ShelterProfileMediaLinkType } from '../../../../types';
import { MediaLinkContent } from './MediaLinkContent';
import { MediaLinkPreview } from './MediaLinkPreview';

type TProps = {
  mediaLinks: ShelterProfileMediaLinkType[];
  canEdit: boolean;
  disabled: boolean;
  onEdit: (mediaLink: ShelterProfileMediaLinkType) => void;
  onDelete: (mediaLink: ShelterProfileMediaLinkType) => void;
};

type TBuildColumnsArgs = Omit<TProps, 'mediaLinks'>;

function buildColumns({
  canEdit,
  disabled,
  onEdit,
  onDelete,
}: TBuildColumnsArgs): TableColumn<ShelterProfileMediaLinkType>[] {
  const columns: TableColumn<ShelterProfileMediaLinkType>[] = [
    {
      key: 'preview',
      label: 'Preview',
      width: '120px',
      render: (mediaLink) => (
        <MediaLinkPreview
          mediaType={mediaLink.mediaType}
          url={mediaLink.url}
          title={mediaLink.title}
        />
      ),
    },
    {
      key: 'mediaLink',
      label: 'Media link',
      render: (mediaLink) => (
        <MediaLinkContent
          title={mediaLink.title}
          mediaType={mediaLink.mediaType}
          url={mediaLink.url}
        />
      ),
    },
  ];

  if (canEdit) {
    columns.push({
      key: 'actions',
      label: 'Actions',
      width: '140px',
      render: (mediaLink) => (
        <div className="flex items-center gap-3">
          <TableActionBtn
            action="edit"
            label="Edit media link"
            disabled={disabled}
            onClick={() => onEdit(mediaLink)}
          />
          <TableActionBtn
            action="delete"
            label="Delete media link"
            disabled={disabled}
            onClick={() => onDelete(mediaLink)}
          />
        </div>
      ),
    });
  }

  return columns;
}

export function MediaLinksTable(props: TProps) {
  const { mediaLinks, canEdit, disabled, onEdit, onDelete } = props;

  const columns = buildColumns({ canEdit, disabled, onEdit, onDelete });

  return (
    <Table
      columns={columns}
      rows={mediaLinks}
      getRowKey={(mediaLink) => mediaLink.id}
      headerClassName="px-0"
      rowClassName="mx-0 px-0"
      emptyState={
        <div className="p-6 text-center text-gray-500">No media links yet.</div>
      }
    />
  );
}

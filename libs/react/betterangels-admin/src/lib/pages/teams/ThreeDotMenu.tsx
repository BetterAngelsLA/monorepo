import { TeamType } from '@monorepo/ba-platform/types';
import { ThreeDotIcon } from '@monorepo/react/icons';

interface ThreeDotMenuProps {
  team: TeamType;
  openMenuRowId: string | null;
  setOpenMenuRowId: (updater: (prev: string | null) => string | null) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  onEdit: (team: TeamType) => void;
  onDelete: (team: TeamType) => Promise<void>;
  onDeactivate: (team: TeamType) => Promise<void>;
  busy: boolean;
}

export function ThreeDotMenu({
  team,
  openMenuRowId,
  setOpenMenuRowId,
  menuRef,
  onEdit,
  onDelete,
  onDeactivate,
  busy,
}: ThreeDotMenuProps) {
  const isOpen = openMenuRowId === team.id;

  const canDelete = !team.isInUse;
  const canDeactivate = team.isInUse && team.isActive !== false;

  return (
    <div className="relative">
      <button
        aria-label={`Actions for ${team.name}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpenMenuRowId((prev) => (prev === team.id ? null : team.id));
        }}
        className="flex items-center justify-center h-8 w-8 rounded-[8px] bg-neutral-99 relative z-0"
      >
        <ThreeDotIcon className="w-6" fill="#052b73" />
      </button>
      {isOpen && (
        <div
          ref={menuRef}
          className="absolute flex flex-col items-start top-full right-0 shadow-md bg-white z-10 p-2 rounded-lg"
        >
          <button
            className="py-2 px-4 hover:bg-neutral-98 rounded-lg w-full text-left"
            onClick={() => {
              setOpenMenuRowId(() => null);
              onEdit(team);
            }}
          >
            Edit
          </button>
          {canDeactivate && (
            <button
              className="py-2 px-4 hover:bg-neutral-98 rounded-lg w-full text-left whitespace-nowrap"
              onClick={() => void onDeactivate(team)}
              disabled={busy}
            >
              Deactivate
            </button>
          )}
          {canDelete && (
            <button
              className="py-2 px-4 hover:bg-neutral-98 rounded-lg w-full text-left text-alert-60"
              onClick={() => void onDelete(team)}
              disabled={busy}
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

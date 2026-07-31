import { LockIcon } from '@monorepo/react/icons';

export function PrivateBadge() {
  return (
    <div
      className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 rounded-[20px] p-1.5 md:px-2.5 md:py-1"
      title="Only visible to verified case managers"
    >
      <LockIcon className="w-3.5 h-3.5 text-primary-60" />
      <span className="hidden md:inline text-xs text-primary-20 font-medium">
        Private
      </span>
    </div>
  );
}

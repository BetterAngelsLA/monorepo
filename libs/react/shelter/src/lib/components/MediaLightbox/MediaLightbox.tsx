import { ArrowLeftIcon } from '@monorepo/react/icons';
import { PropsWithChildren } from 'react';

interface IProps extends PropsWithChildren {
  onClose: () => void;
  contentClassName?: string;
}

export function MediaLightbox(props: IProps) {
  const { onClose, contentClassName = 'w-[90vw] max-w-md', children } = props;

  return (
    <div className="fixed inset-0 z-400 bg-black flex flex-col h-full">
      <div className="bg-steel-blue flex items-center gap-8 py-2">
        <div
          onClick={onClose}
          className="ml-5 flex items-center justify-center h-10 w-10 cursor-pointer"
        >
          <ArrowLeftIcon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div
        onClick={onClose}
        className="flex flex-1 items-center justify-center"
      >
        <div onClick={(e) => e.stopPropagation()} className={contentClassName}>
          {children}
        </div>
      </div>
    </div>
  );
}

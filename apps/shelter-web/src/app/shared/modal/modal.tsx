import { CloseIcon } from '@monorepo/react/icons';
import { useAtom } from 'jotai';
import { PropsWithChildren, ReactElement, ReactNode } from 'react';
import { modalContentAtom } from '../atoms/modalContentAtom';
import { mergeCss } from '../utils/styles/mergeCss';
import { ModalMask } from './modalMask';

export enum ModalAnimationEnum {
  SLIDE_UP = 'animate-slideInUp',
  SLIDE_IN_LEFT = 'animate-slideInLeft',
  EXPAND = 'animate-expandInOut',
}

interface IModal extends PropsWithChildren {
  className?: string;
  header?: string | ReactNode;
  animation?: ModalAnimationEnum | null;
  fullScreen?: boolean;
  forceSmall?: boolean;
  onClose?: () => void;
}

export function Modal(props: IModal): ReactElement | null {
  const {
    className = '',
    animation = ModalAnimationEnum.SLIDE_UP,
    fullScreen = false,
    children,
    onClose,
  } = props;

  const [_modal, setModal] = useAtom(modalContentAtom);

  function onModalClose(): void {
    if (typeof onClose === 'function') {
      onClose();
    }

    setModal(null);
  }

  const modalCss = [
    className,
    'z-max',
    'transform-gpu',
    'overflow-x-hidden',
    'overflow-y-auto',
    'md:pt-8',
    'p-6',
    'md:p-10',
    'bg-white',
    'flex',
    'flex-col',
    fullScreen
      ? 'absolute top-0 left-0 right-0 bottom-0'
      : 'relative rounded-xl pb-12 w-10/12',
    animation === null ? 'animate-none' : animation,
  ];

  const closeCss = ['ml-auto'];

  const headerCss = ['flex', 'justify-between', 'align-center', 'mt-0', 'mb-4'];

  return (
    <ModalMask>
      <div className={mergeCss(modalCss)}>
        <div className={mergeCss(headerCss)}>
          <button className={mergeCss(closeCss)} onClick={onModalClose}>
            <CloseIcon className="w-4" />
          </button>
        </div>
        <div className="w-full h-full">{children}</div>
      </div>
    </ModalMask>
  );
}

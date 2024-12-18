import { useAtom } from 'jotai';
import { ReactElement } from 'react';
import { modalContentAtom } from '../atoms/modalContentAtom';
import { Modal } from './modal';

type IProps = {
  className?: string;
};

export function ModalContainer(props: IProps): ReactElement | null {
  const { className = '' } = props;

  const [modal] = useAtom(modalContentAtom);

  if (!modal?.content) {
    return null;
  }

  return (
    <Modal className={className} {...modal}>
      {modal.content}
    </Modal>
  );
}

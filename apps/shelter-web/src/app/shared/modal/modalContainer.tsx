import { useAtom } from 'jotai';
import { ReactElement } from 'react';
import { modalAtom } from '../atoms/modalAtom';
import { Modal } from './modal';

type IProps = {
  className?: string;
};

export function ModalContainer(props: IProps): ReactElement | null {
  const { className = '' } = props;

  const [modal] = useAtom(modalAtom);

  if (!modal?.content) {
    return null;
  }

  return (
    <Modal className={className} {...modal}>
      {modal.content}
    </Modal>
  );
}

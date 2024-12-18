import { useAtom } from 'jotai';
import { ReactElement, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { modalAtom } from '../atoms/modalAtom';
import { Modal } from './modal';

type IProps = {
  className?: string;
};

export function ModalContainer(props: IProps): ReactElement | null {
  const { className = '' } = props;

  const location = useLocation();
  const [modal, setModal] = useAtom(modalAtom);

  useEffect((): void => {
    setModal(null);
  }, [location.pathname]);

  if (!modal?.content) {
    return null;
  }

  return (
    <Modal className={className} {...modal}>
      {modal.content}
    </Modal>
  );
}

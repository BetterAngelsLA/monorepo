import { useAtom } from 'jotai';
import { ReactElement, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Modal } from './Modal';
import { modalAtom } from './modalAtom';

type IProps = {
  className?: string;
};

export function ModalContainer(props: IProps): ReactElement | null {
  const { className = '' } = props;

  const location = useLocation();
  const [modal, setModal] = useAtom(modalAtom);

  useEffect((): void => {
    setModal(null);
  }, [location.pathname, setModal]);

  if (!modal?.content) {
    return null;
  }

  return (
    <Modal className={className} {...modal}>
      {modal.content}
    </Modal>
  );
}

import { Button } from '@monorepo/react/components';
import { mergeCss } from '@monorepo/react/shared';
import { useAtom } from 'jotai';
import { modalAtom } from '../../../../components/Modal';
import { ReportUpdateNotice } from './ReportUpdateNotice';

type TProps = {
  className?: string;
};

export function ReportUpdateButton(props: TProps) {
  const { className } = props;

  const [_modal, setModal] = useAtom(modalAtom);

  function closeModal() {
    setModal(null);
  }

  function showModal() {
    setModal({
      content: <ReportUpdateNotice close={closeModal} />,
    });
  }

  return (
    <Button
      className={mergeCss(className)}
      size="sm"
      variant="text"
      onClick={showModal}
      aria-haspopup="dialog"
    >
      Report an Update
    </Button>
  );
}

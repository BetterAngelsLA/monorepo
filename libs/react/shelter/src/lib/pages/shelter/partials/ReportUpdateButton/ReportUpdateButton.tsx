import { Button } from '@monorepo/react/components';
import { mergeCss } from '@monorepo/react/shared';
import { useAtom } from 'jotai';
import { modalAtom } from '../../../../components/Modal';

const FORM_LINK =
  'https://docs.google.com/forms/d/e/1FAIpQLSdITelKDnUI1oDz8JvQ_tCGoNtjNKyl7AJmYWVTJYqACGMY4A/viewform';

type TProps = {
  className?: string;
  disabled?: boolean;
};

export function ReportUpdateButton(props: TProps) {
  const { className, disabled } = props;

  const [_modal, setModal] = useAtom(modalAtom);

  function showModal() {
    setModal({
      content: (
        <div className="w-full border-8 border-red-500">HELLO HELLO</div>
      ),
      // animation: ModalAnimationEnum.SLIDE_UP,
      // type: 'fullscreen',
      // footer: <FiltersActions className="pb-8" onDone={onSubmitFilters} />,
      // onClose: resetFilters,
    });
  }

  return (
    <Button
      className={mergeCss(className)}
      size="sm"
      variant="text"
      onClick={showModal}
      disabled={disabled}
    >
      Report an Update
    </Button>
  );
}

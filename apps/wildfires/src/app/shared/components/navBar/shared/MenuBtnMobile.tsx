import { MenuIcon } from '@monorepo/react/icons';
import { useAtom } from 'jotai';
import { modalAtom } from '../../../atoms/modalAtom';
import { ModalAnimationEnum } from '../../../modal/modal';
import { mergeCss } from '../../../utils/styles/mergeCss';
import { MenuMobile } from '../MenuMobile';

type IProps = {
  className?: string;
};

export function MenuBtnMobile(props: IProps) {
  const { className } = props;

  const [_modal, setModal] = useAtom(modalAtom);

  const parentCss = ['flex', 'items-center', 'font-bold', 'gap-7', className];

  function onClick() {
    setModal({
      content: <MenuMobile />,
      type: 'fullscreen',
      closeOnMaskClick: true,
      animation: ModalAnimationEnum.NAV,
      parentCss: 'bg-steel-blue',
      closeCss: 'text-white',
    });
  }

  return (
    <div className={mergeCss(parentCss)}>
      <div
        className="h-10 w-10 flex items-center justify-center"
        onClick={onClick}
      >
        <MenuIcon className="h-6 w-6" fill="white" />
      </div>
    </div>
  );
}

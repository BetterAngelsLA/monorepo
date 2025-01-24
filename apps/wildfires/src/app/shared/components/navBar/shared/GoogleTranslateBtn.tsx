import { mergeCss } from '../../../utils/styles/mergeCss';

type IProps = {
  className?: string;
};

export function GoogleTranslateBtn(props: IProps) {
  const { className } = props;

  const parentCss = ['md:mr-12', className];

  return (
    <div className={mergeCss(parentCss)} id="google_translate_element"></div>
  );
}

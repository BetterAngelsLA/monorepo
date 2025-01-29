import { mergeCss } from '../../utils/styles/mergeCss';
import { Button } from '../button/Button';

type IProps = {
  className?: string;
};

export default function ResultsPdfButton(props: IProps) {
  const { className } = props;

  function onClick() {
    console.log('################################### on click');
  }

  const parentCss = [className];

  return (
    <Button
      className={mergeCss(parentCss)}
      ariaLabel="Save your action plan as a PDF file"
      onClick={onClick}
    >
      Save Your Action Plan as a PDF
    </Button>
  );
}

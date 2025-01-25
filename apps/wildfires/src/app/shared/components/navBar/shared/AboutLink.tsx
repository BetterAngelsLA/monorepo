import { Link } from 'react-router-dom';
import { mergeCss } from '../../../utils/styles/mergeCss';

type IProps = {
  className?: string;
};

export function AboutLink(props: IProps) {
  const { className } = props;

  const parentCss = [className];

  return (
    <Link className={mergeCss(parentCss)} to="/about">
      <div className="hidden lg:block">About</div>
      <div className="lg:hidden">About</div>
    </Link>
  );
}

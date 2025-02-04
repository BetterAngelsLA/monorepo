import { Link } from 'react-router-dom';

import LADR_LOGO from '../../../../../assets/images/la_disaster_relief_navigator_logo.png';
import { mergeCss } from '../../../utils/styles/mergeCss';

type IProps = {
  className?: string;
};

export function HomeLink(props: IProps) {
  const { className } = props;

  const parentCss = ['flex', 'items-center', className];

  return (
    <Link
      aria-label="navigate to home page"
      to="/"
      className={mergeCss(parentCss)}
    >
      <img
        src={LADR_LOGO}
        alt="LA Disaster Relief Navigator"
        className="h-full"
      />
    </Link>
  );
}

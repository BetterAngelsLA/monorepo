import { Link } from 'react-router-dom';
import { mergeCss } from '../../utils/styles/mergeCss';

export function MenuMobile() {
  const parentCss = [
    'flex',
    'flex-col',
    'gap-4',
    'p-4',
    'mt-20',
    'text-lg',
    'font-medium',
  ];

  return (
    <div className={mergeCss(parentCss)}>
      <div className="border-b border-gray-300 pb-4 pl-4">
        <Link to={''}>Home</Link>
      </div>
      <div className="pl-4">
        <Link to={''}>About Us</Link>
      </div>
    </div>
  );
}

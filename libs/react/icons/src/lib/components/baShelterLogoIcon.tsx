import { SVGProps } from 'react';
import BetterAngelsLogoIcon from './betterAngelsLogoIcon';

interface IProps extends SVGProps<SVGSVGElement> {
  className?: string;
}

export default function BaShelterLogo(props?: IProps) {
  return <BetterAngelsLogoIcon fill="#fff82e" {...props} />;
}

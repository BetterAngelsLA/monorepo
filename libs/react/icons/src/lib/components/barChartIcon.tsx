import { FC, SVGProps } from 'react';

type SvgProps = SVGProps<SVGSVGElement>;

const BarChartIcon: FC<SvgProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M22 21H2V3h2v16h2v-9h4v9h2V7h4v12h2v-5h4v7z" />
  </svg>
);

export default BarChartIcon;

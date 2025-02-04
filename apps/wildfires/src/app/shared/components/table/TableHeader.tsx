import { mergeCss } from '../../utils/styles/mergeCss';

type TProps = {
  headers: string[];
};

export function TableHeader(props: TProps) {
  const { headers } = props;

  const thCss = [
    'bg-neutral-90',
    'border-r-2',
    'last:border-r-0',
    'border-white',
    'px-4',
    'py-2',
    'text-xs',
    'sm:text-sm',
    'md:text-xl',
    'md:leading-8',
    'md:max-w-[250px]',
    'lg:max-w-[450px]',
  ];

  return (
    <thead>
      <tr className="">
        {headers.map((columnHeader, index) => (
          <th key={index} className={mergeCss(thCss)}>
            {columnHeader}
          </th>
        ))}
      </tr>
    </thead>
  );
}

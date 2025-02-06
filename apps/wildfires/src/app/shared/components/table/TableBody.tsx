import { mergeCss } from '../../../shared/utils/styles/mergeCss';

type TProps = {
  values: string[][];
};

export function TableBody(props: TProps) {
  const { values } = props;

  const trCss = ['odd:bg-white', 'even:bg-brand-angel-blue'];

  const tdCss = [
    'text-xs',
    'sm:text-sm',
    'md:text-xl',
    'leading-7',
    'text-center',
    'px-2',
    'py-1.5',
    'md:py-2.5',
  ];

  return (
    <tbody>
      {values.map((row, rowIndex) => (
        <tr key={rowIndex} className={mergeCss(trCss)}>
          {row.map((cell, cellIndex) => (
            <td key={cellIndex} className={mergeCss(tdCss)}>
              {cell}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

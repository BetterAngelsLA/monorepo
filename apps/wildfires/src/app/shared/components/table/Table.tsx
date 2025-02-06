import { mergeCss } from '../../../shared/utils/styles/mergeCss';
import { TableBody } from './TableBody';
import { TableHeader } from './TableHeader';

type TProps = {
  className?: string;
  headers: string[];
  values: string[][];
};

export function Table(props: TProps) {
  const { className, headers, values } = props;

  const parentCss = ['flex', 'flex-col', className];

  const tableCss = ['min-w-full', 'table-auto', 'border-collapse'];

  return (
    <div className={mergeCss(parentCss)}>
      <table className={mergeCss(tableCss)}>
        <TableHeader headers={headers} />
        <TableBody values={values} />
      </table>
    </div>
  );
}

import { mergeCss } from '../../utils/styles/mergeCss';
import { FilterSelector } from './filterSelector';

type IProps = {
  className?: string;
};

export function ShelterFilter(props: IProps) {
  const { className } = props;

  const parentCss = ['xborder', 'border-red-500', className];

  function onFilterChange(filtred: string[]) {
    console.log();
    console.log('| -------------  onFilterChange  ------------- |');
    console.log(filtred);
  }

  return (
    <div className={mergeCss(parentCss)}>
      <div className="text-xl">Filter</div>
      <div>Select the categories below to filter shelters</div>

      <FilterSelector className="mt-8" onChange={onFilterChange} />
    </div>
  );
}

import { CheckboxGroup, ExpandableContainer } from '@monorepo/react/components';
import { mergeCss } from '../../utils/styles/mergeCss';

type IProps = {
  className?: string;
  onChange: (selected: string[]) => void;
};

export function FilterSelector(props: IProps) {
  const { onChange, className } = props;

  const parentCss = ['xborder', 'xborder-blue-500', className];

  return (
    <div className={mergeCss(parentCss)}>
      <ExpandableContainer header="expand title" open={true}>
        <div className="pb-12">HELLO CONTENT</div>

        <CheckboxGroup
          options={[
            'value-str',
            {
              label: 'label 1',
              value: 'value 1',
            },
            {
              label: 'label 2',
              value: 'value 2',
            },
          ]}
          onChange={onChange}
        />
      </ExpandableContainer>
    </div>
  );
}

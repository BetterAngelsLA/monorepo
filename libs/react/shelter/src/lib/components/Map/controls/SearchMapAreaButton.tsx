import { Button } from '@monorepo/react/components';
import { mergeCss } from '@monorepo/react/shared';

type TProps = {
  onClick?: () => void;
};

export function SearchMapAreaButton(props: TProps) {
  const { onClick } = props;

  const searchMapAreaCss = [
    '[box-shadow:0_3px_1px_0_#00000040]',
    'bg-white',
    'font-primary',
    'mt-3',
    'rounded-lg',
    'text-primary-60',
  ];

  return (
    <Button
      onClick={onClick}
      variant="secondary"
      size="lg"
      className={mergeCss(searchMapAreaCss)}
    >
      Search this area
    </Button>
  );
}

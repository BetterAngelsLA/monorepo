import { Button, mergeCss } from '@monorepo/react/components';

type TProps = {
  onClick?: () => void;
};

export function SearchMapAreaButton(props: TProps) {
  const { onClick } = props;

  const searchMapAreaCss = [
    '[box-shadow:0_3px_1px_0_#00000040]',
    'mt-3',
    'font-primary',
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

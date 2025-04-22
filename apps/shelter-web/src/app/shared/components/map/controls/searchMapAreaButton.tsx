import { Button, mergeCss } from '@monorepo/react/components';

type TProps = {
  onClick?: () => void;
};

export function SearchMapAreaButton(props: TProps) {
  const { onClick } = props;

  const searchMapAreaCss = ['drop-shadow-lg', 'mt-3', 'text-primary-60'];

  return (
    <Button
      onClick={onClick}
      variant="secondary"
      size="md"
      className={mergeCss(searchMapAreaCss)}
    >
      Search this area
    </Button>
  );
}

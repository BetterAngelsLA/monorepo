import { mergeCss } from '@monorepo/react/shared';
import { Pencil } from 'lucide-react';
import { Text } from '../../base-ui/text/text';

type TProps = {
  className?: string;
  title?: string;
  titleClassName?: string;
  onEditClick?: () => void;
};

export function FormHeader(props: TProps) {
  const { title, onEditClick, className, titleClassName } = props;

  const parentCss = ['flex flex-row justify-between'];
  const titleCss = [''];

  const iconCss = ['w-6'];

  return (
    <div className={mergeCss([parentCss, className])}>
      {title && (
        <Text
          variant="header-lg"
          className={mergeCss([titleCss, titleClassName])}
        >
          {title}
        </Text>
      )}

      {onEditClick && (
        <button onClick={onEditClick} className={mergeCss([iconCss])}>
          <Pencil />
        </button>
      )}
    </div>
  );
}

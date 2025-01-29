import { ChevronUpIcon } from '@monorepo/react/icons';
import {
  PropsWithChildren,
  ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { usePrint } from '../../../providers/PrintProvider';
import { mergeCss } from '../../../utils/styles/mergeCss';

interface IProps extends PropsWithChildren {
  className?: string;
  icon?: ReactElement;
  type?: 'alert';
  title?: string;
}

export function ResourceCallout(props: IProps) {
  const {
    icon,
    type = 'alert',
    className,
    children,
    title = 'Useful Tips',
  } = props;

  const [show, setShow] = useState(false);
  const wasExpandedBeforePrintRef = useRef(false);
  const { isPrinting } = usePrint();

  const parentCss = [
    'items-start',
    'p-4',
    'md:px-6',
    type === 'alert' ? 'bg-neutral-99' : 'bg-white',
    className,
  ];

  useEffect(() => {
    if (isPrinting) {
      wasExpandedBeforePrintRef.current = show;
      setShow(true);
    } else {
      setShow(wasExpandedBeforePrintRef.current);
    }
  }, [isPrinting]); // ✅ Removed show from dependencies to prevent race conditions

  const handleToggle = useCallback(() => {
    setShow((prev) => !prev);
  }, []);

  return (
    <div className={mergeCss(parentCss)}>
      <div className="w-full flex items-center">
        {icon && <div className="mr-6">{icon}</div>}
        <div
          className="flex items-center justify-between w-full flex-1 cursor-pointer"
          onClick={handleToggle}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleToggle();
            }
          }}
          aria-expanded={show}
          aria-controls="resource-callout-content"
        >
          <div className="font-bold h-8 flex items-center text-xl">{title}</div>
          <ChevronUpIcon
            className={`h-4 w-4 transition-transform ${
              show ? 'rotate-0' : 'rotate-180'
            }`}
            aria-hidden="true"
          />
        </div>
      </div>
      <div
        id="resource-callout-content"
        className={`mt-4 ${show ? 'block' : 'hidden'}`}
      >
        {children}
      </div>
    </div>
  );
}

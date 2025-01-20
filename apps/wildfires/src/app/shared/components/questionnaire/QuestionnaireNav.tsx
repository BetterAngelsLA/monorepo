import { mergeCss } from '../../utils/styles/mergeCss';

type IProps = {
  className?: string;
  onNext?: () => void;
  onPrev?: () => void;
};

export function QuestionnaireNav(props: IProps) {
  const { className, onNext, onPrev } = props;

  const parentCss = ['flex', 'justify-center', className];

  if (!onNext && !onPrev) {
    return null;
  }

  const disabledCss = 'opacity-50';

  return (
    <div className={mergeCss(parentCss)}>
      {!!onPrev && (
        <button
          onClick={onPrev}
          className="mx-4 py-1.5 px-4 border border-2 rounded-xl bg-gray-300"
        >
          PREV
        </button>
      )}
      {!!onNext && (
        <button
          onClick={onNext}
          className="mx-4 py-1.5 px-4 border border-2 rounded-xl bg-gray-300"
        >
          NEXT
        </button>
      )}
    </div>
  );
}

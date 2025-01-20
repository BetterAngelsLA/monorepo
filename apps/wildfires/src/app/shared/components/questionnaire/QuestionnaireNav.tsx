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

  return (
    <div className={mergeCss(parentCss)}>
      {!!onPrev && (
        <button
          onClick={onPrev}
          className="mx-4 py-1.5 px-4 border border-2 rounded-xl"
        >
          PREV
        </button>
      )}
      {!!onNext && (
        <button
          onClick={onNext}
          className="mx-4 py-1.5 px-4 border border-2 rounded-xl"
        >
          NEXT
        </button>
      )}
    </div>
  );
}

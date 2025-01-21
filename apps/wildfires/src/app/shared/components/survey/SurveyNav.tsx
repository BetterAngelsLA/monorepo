import { useContext } from 'react';
import { mergeCss } from '../../utils/styles/mergeCss';
import { SurveyContext } from './provider/SurveyContext';

type IProps = {
  className?: string;
  onNext?: () => void;
  onPrev?: () => void;
  nextDisabled?: boolean;
};

export function SurveyNav(props: IProps) {
  const { className, onNext, onPrev, nextDisabled } = props;

  const context = useContext(SurveyContext);

  if (!context) {
    throw new Error('SurveyContext must be used with SurveyNav');
  }

  const { currentForm, formHistory, validateCurrentForm } = context;

  const parentCss = ['flex', 'justify-center', className];

  if (!onNext && !onPrev) {
    return null;
  }

  const showPrevBtn = formHistory.length > 1;
  const showNextBtn = !!currentForm.next;
  const currentFormErrors = validateCurrentForm();

  console.log('currentFormErrors:');
  console.log(currentFormErrors);

  const disabled = !!currentFormErrors.length;

  const buttonCss = 'mx-4 py-1.5 px-4 border border-2 rounded-xl bg-gray-300';

  const disabledCss = 'opacity-50';

  const prevCss = [buttonCss];
  const nextCss = [buttonCss, disabled ? disabledCss : ''];

  return (
    <div className={mergeCss(parentCss)}>
      {!!onPrev && showPrevBtn && (
        <button onClick={onPrev} className={mergeCss(prevCss)}>
          PREV
        </button>
      )}

      {!!onNext && showNextBtn && (
        <button
          onClick={onNext}
          className={mergeCss(nextCss)}
          disabled={disabled}
        >
          NEXT
        </button>
      )}
    </div>
  );
}

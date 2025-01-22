import { ArrowLeftIcon } from '@monorepo/react/icons';
import { useContext } from 'react';
import { SurveyButton } from '../../../pages/introduction/firesSurvey/components/SurveyButton';
import { mergeCss } from '../../utils/styles/mergeCss';
import { SurveyContext } from './provider/SurveyContext';

type IProps = {
  className?: string;
  onNext?: () => void;
  onPrev?: () => void;
};

export function SurveyNav(props: IProps) {
  const { className, onNext, onPrev } = props;

  const context = useContext(SurveyContext);

  if (!context) {
    throw new Error('SurveyContext must be used with SurveyNav');
  }

  const { currentForm, formHistory, validateCurrentForm } = context;

  const parentCss = ['flex', 'flex-col', 'justify-center', className];

  if (!onNext && !onPrev) {
    return null;
  }

  const showPrevBtn = formHistory.length > 1;
  const showNextBtn = !!currentForm.next;
  const currentFormErrors = validateCurrentForm();

  console.log('currentFormErrors:');
  console.log(currentFormErrors);

  const nextDisabled = !!currentFormErrors.length;

  const buttonCss = 'my-4';
  const prevCss = [buttonCss];
  const nextCss = [buttonCss];

  return (
    <div className={mergeCss(parentCss)}>
      {!!onNext && showNextBtn && (
        <SurveyButton
          dark
          className={mergeCss(nextCss)}
          onClick={onNext}
          disabled={nextDisabled}
        >
          <span className="mr-4">Continue</span>
          <ArrowLeftIcon className="h-5 rotate-180" />
        </SurveyButton>
      )}

      {!!onPrev && showPrevBtn && (
        <SurveyButton className={mergeCss(prevCss)} onClick={onPrev}>
          <ArrowLeftIcon className="h-5" />
          <span className="ml-4">Back</span>
        </SurveyButton>
      )}
    </div>
  );
}

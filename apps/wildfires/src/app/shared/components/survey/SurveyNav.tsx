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

  if (!onNext && !onPrev) {
    return null;
  }

  if (!currentForm) {
    return;
  }

  const showPrevBtn = formHistory.length > 1;
  const currentFormErrors = validateCurrentForm();

  if (currentFormErrors.length) {
    console.log('currentFormErrors:');
    console.log(currentFormErrors);
  }

  const nextDisabled = !!currentFormErrors.length;

  const parentCss = [
    'flex',
    'flex-col',
    'md:flex-row',
    'justify-center',
    'items-center',
    className,
  ];

  const buttonCss = ['my-2', 'max-w-[350px]', 'md:mx-3'];

  const nextButtonCss = [buttonCss];
  const prevButtonCss = [buttonCss, 'md:order-first'];

  return (
    <div className={mergeCss(parentCss)}>
      {!!onNext && (
        <SurveyButton
          dark
          className={mergeCss(nextButtonCss)}
          onClick={onNext}
          disabled={nextDisabled}
        >
          <span className="mr-4">Continue</span>
          <ArrowLeftIcon className="h-5 rotate-180" />
        </SurveyButton>
      )}

      {!!onPrev && showPrevBtn && (
        <SurveyButton className={mergeCss(prevButtonCss)} onClick={onPrev}>
          <ArrowLeftIcon className="h-5" />
          <span className="ml-4">Back</span>
        </SurveyButton>
      )}
    </div>
  );
}

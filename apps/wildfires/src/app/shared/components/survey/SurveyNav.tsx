import { ArrowLeftIcon } from '@monorepo/react/icons';
import { mergeCss } from '@monorepo/react/shared';
import { SurveyButton } from '../../../pages/introduction/firesSurvey/components/SurveyButton';
import { useSurvey } from './provider/SurveyContext';

type IProps = {
  className?: string;
  onNext?: () => void;
  onPrev?: () => void;
};

export function SurveyNav(props: IProps) {
  const { className, onNext, onPrev } = props;

  const context = useSurvey();

  const { currentForm, formHistory, validateCurrentForm } = context;

  if (!onNext && !onPrev) {
    return null;
  }

  if (!currentForm) {
    return null;
  }

  const showPrevBtn = formHistory.length > 1;
  const currentFormErrors = validateCurrentForm();

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
          ariaLabel="questionnaire continue button"
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
        <SurveyButton
          ariaLabel="questionnaire back button"
          className={mergeCss(prevButtonCss)}
          onClick={onPrev}
        >
          <ArrowLeftIcon className="h-5" />
          <span className="ml-4">Back</span>
        </SurveyButton>
      )}
    </div>
  );
}

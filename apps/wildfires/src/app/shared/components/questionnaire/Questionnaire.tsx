import { useState } from 'react';
import { SurveyConfig } from './questionnaire.types';


type FormData = Record<string, string | boolean>;

type IProps = {
  config: SurveyConfig;
}

export function Questionnaire (props: IProps)  {
  const { config } = props;

  const [formData, setFormData] = useState<FormData>({});
  const [currentStep, setCurrentStep] = useState(0);

  const currentQuestion = config.questions[currentStep];

  const handleChange = (value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));

    moveToNextStep(value);
  };

  const moveToNextStep = (value: string | boolean) => {
    const next = currentQuestion.next;

    if (typeof next === 'string') {
      const nextIndex = config.questions.findIndex((q) => q.id === next);

      setCurrentStep(nextIndex);
    } else {
      const nextStep = next[value as keyof typeof next];
      console.log();
      console.log('| -------------  nextStep  ------------- |');
      console.log(nextStep);
      console.log();

      const nextStepIndex = config.questions.findIndex((q) => q.id === nextStep);

      console.log('*****************  nextStepIndex:', nextStepIndex);

      // setCurrentStep(nextStepIndex);
      if (nextStepIndex >= 0) {
        setCurrentStep(nextStepIndex);
      }
    }
  };

  const renderQuestion = () => {
    switch (currentQuestion?.type) {
      case 'radio':
        return (
          <div className='m-4'>
            <h2>{currentQuestion.question}</h2>
            {currentQuestion.options.map((option) => (
              <button key={option} onClick={() => handleChange(option)} className='mx-2 my-4'>
                {option}
              </button>
            ))}
          </div>
        );
      case 'text':
        return (
          <div className='m-4'>
            <h2>{currentQuestion.question}</h2>
            <input type="text" onBlur={(e) => handleChange(e.target.value)} />
          </div>
        );
      default:
        return renderResults()
    }
  };

  const renderResults = () => {
    return (
      <div className='m-4 mt-12'>
        <h2>Results</h2>
        {Object.entries(formData).map(([key, value]) => (
          <p key={key}>{`${key}: ${value}`}</p>
        ))}
      </div>
    );
  };


  return (
    <div>
        {renderQuestion()}
    </div>
  );
};

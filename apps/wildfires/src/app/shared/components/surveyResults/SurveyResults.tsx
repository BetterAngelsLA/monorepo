// SurveyResults.tsx
import { TResource } from '../../clients/sanityCms/types';
import { mergeCss } from '../../utils/styles/mergeCss';
import { SurveyResources } from '../surveyResources/SurveyResources';

type IProps = {
  className?: string;
  resources: TResource[]; // the fetched resources
  isLoading: boolean;
  isError: boolean;
  error: any;
};

export function SurveyResults({
  className,
  resources,
  isLoading,
  isError,
  error,
}: IProps) {
  const parentCss = [className];

  if (isLoading) {
    return <div className={mergeCss(parentCss)}>Loading...</div>;
  }

  if (isError) {
    return (
      <div className={mergeCss(parentCss)}>
        Error: {error?.message || 'An error occurred'}
      </div>
    );
  }

  return (
    <div className={mergeCss(parentCss)}>
      {resources && resources.length > 0 ? (
        <SurveyResources resources={resources} />
      ) : (
        <p>No resources found.</p>
      )}
    </div>
  );
}

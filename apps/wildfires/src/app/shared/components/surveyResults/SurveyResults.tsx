import { useQuery } from '@tanstack/react-query';

import { fetchAllAlertsAndResourcesByTagsFn } from '../../clients/sanityCms/queries/fetchAllAlertsAndResourcesByTagsFn';
import { mergeCss } from '../../utils/styles/mergeCss';
import { SurveyResources } from '../surveyResources/SurveyResources';

type ISurveyResults = {
  className?: string;
  answerTags: string[];
  expanded?: boolean;
};

export function SurveyResults(props: ISurveyResults) {
  const { answerTags, expanded, className } = props;

  const { isLoading, isError, data, error } = useQuery({
    queryKey: answerTags,
    queryFn: () => fetchAllAlertsAndResourcesByTagsFn(answerTags),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const parentCss = [className];

  return (
    <div className={mergeCss(parentCss)}>
      {!!data?.length && (
        <SurveyResources resources={data} expanded={expanded} />
      )}
    </div>
  );
}

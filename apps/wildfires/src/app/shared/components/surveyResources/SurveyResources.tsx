import { TResource } from '../../clients/sanityCms/types';
import { mergeCss } from '../../utils/styles/mergeCss';
import { ResourceCard } from './ResourceCard';

type IProps = {
  className?: string;
  resources: TResource[];
};

export function SurveyResources(props: IProps) {
  const { resources, className } = props;

  const parentCss = [className];

  return (
    <div className={mergeCss(parentCss)}>
      <div className="mt-4 mb-8 font-bold text-2xl">Survey Resources</div>

      {resources.map((resource, index) => {
        return (
          <ResourceCard
            key={index}
            className="mb-4 lg:mb-10 last:mb-0"
            resource={resource}
          />
        );
      })}
    </div>
  );
}

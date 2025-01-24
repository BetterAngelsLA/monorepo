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
      <div className="mt-12 md:mt-20 mb-8 md:mb-12 font-bold text-xl md:text-2xl">
        Resources
      </div>
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

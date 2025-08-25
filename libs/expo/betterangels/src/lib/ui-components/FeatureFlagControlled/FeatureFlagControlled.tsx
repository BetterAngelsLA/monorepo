import { ReactNode } from 'react';
import { useFeatureFlagActive } from '../../hooks';
import { TFeatureFlagValue } from '../../providers';

type TProps = {
  flag: TFeatureFlagValue;
  children: ReactNode;
  when?: boolean;
};

export default function FeatureFlagControlled(props: TProps) {
  const { flag, children, when = true } = props;

  const featureActive = useFeatureFlagActive(flag);
  const shouldRender = when ? featureActive : !featureActive;
  if (!shouldRender) {
    return null;
  }

  return children;
}

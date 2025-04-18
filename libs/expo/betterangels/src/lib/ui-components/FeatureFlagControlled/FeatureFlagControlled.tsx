import { ReactNode } from 'react';
import { useFeatureFlagActive } from '../../hooks';
import { TFeatureFlagValue } from '../../providers';

type TProps = {
  flag: TFeatureFlagValue;
  children: ReactNode;
};

export default function FeatureFlagControlled(props: TProps) {
  const { flag, children } = props;

  const featureActive = useFeatureFlagActive(flag);

  if (!featureActive) {
    return null;
  }

  return <>{children}</>;
}

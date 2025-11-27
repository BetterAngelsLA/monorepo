import { ReactNode } from 'react';
import { useFeatureFlagActive } from '../../hooks';
import { TFeatureFlagValue } from '../../providers';

type TProps = {
  flag: TFeatureFlagValue;
  children: ReactNode;
  fallback?: ReactNode;
};

export default function FeatureFlagControlled({
  flag,
  children,
  fallback = null,
}: TProps): ReactNode {
  const active = useFeatureFlagActive(flag);
  console.log(active);
  return active ? children : fallback;
}

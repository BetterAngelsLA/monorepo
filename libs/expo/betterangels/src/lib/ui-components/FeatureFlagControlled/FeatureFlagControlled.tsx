import { ReactNode } from 'react';
import { useFeatureFlagActive } from '@monorepo/react/shared';

type TFeatureFlagValue = string;

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
  return active ? children : fallback;
}

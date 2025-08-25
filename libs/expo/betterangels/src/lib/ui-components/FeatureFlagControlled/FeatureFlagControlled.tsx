import { ReactNode } from 'react';
import { useFeatureFlagActive } from '../../hooks';
import { TFeatureFlagValue } from '../../providers';

type Props = {
  flag: TFeatureFlagValue;
  children: ReactNode;
  fallback?: ReactNode;
};

export default function FeatureFlagControlled({
  flag,
  children,
  fallback,
}: Props): ReactNode {
  const active = useFeatureFlagActive(flag);
  return active ? children : fallback ?? null;
}

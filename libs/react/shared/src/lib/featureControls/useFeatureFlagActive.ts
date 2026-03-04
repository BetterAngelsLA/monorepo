import { useFeatureControls } from './featureControlContext';

export function useFeatureFlagActive(
  flagName: string,
  defaultValue = false
): boolean {
  const context = useFeatureControls();
  const flagValue = context.flags[flagName]?.isActive;

  return flagValue !== undefined ? flagValue : defaultValue;
}

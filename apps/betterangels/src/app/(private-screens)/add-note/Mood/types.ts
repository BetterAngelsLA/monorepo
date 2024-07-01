import { IIconProps } from '@monorepo/expo/shared/icons';

export interface MoodAttributes {
  Icon: React.ComponentType<IIconProps>;
  title: string;
  tab: 'pleasant' | 'neutral' | 'unpleasant';
}

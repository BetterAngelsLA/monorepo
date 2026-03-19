import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { View } from 'react-native';
import PressablePanel from '../PressablePanel';
import TextBold from '../TextBold';

type TPressablePanelContainerProps = {
  title: string | number;
  subtitle: string;
  icon: React.ReactNode;
  actionIcon?: React.ReactNode;
  variant?: 'default' | 'warning' | 'error' | 'primary';
  flex?: number;
  onPress?: () => void;
  disabled?: boolean;
};

export function PressablePanelContainer({
  onPress,
  title,
  subtitle,
  icon,
  actionIcon,
  variant = 'primary',
  flex = 1,
  disabled = false,
}: TPressablePanelContainerProps) {
  return (
    <PressablePanel
      onPress={onPress}
      variant={variant}
      disabled={disabled}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacings.xs,
        flex,
      }}
    >
      <View
        style={{ flexDirection: 'row', alignItems: 'center', gap: Spacings.xs }}
      >
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor:
              variant === 'primary'
                ? Colors.PRIMARY_EXTRA_LIGHT
                : variant === 'warning'
                ? Colors.WARNING_LIGHT
                : Colors.ERROR_EXTRA_LIGHT,
            height: 30,
            width: 30,
            borderRadius: 100,
          }}
        >
          {icon}
        </View>
        <View>
          <TextBold
            color={
              variant === 'primary' ? Colors.PRIMARY_DARK : Colors.WARNING_DARK
            }
            size="xs"
          >
            {subtitle}
          </TextBold>
          <TextBold color={Colors.NEUTRAL_EXTRA_DARK} size="sm">
            {title}
          </TextBold>
        </View>
      </View>
      {actionIcon}
    </PressablePanel>
  );
}

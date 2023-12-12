import { SirenIcon, WarningIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { View } from 'react-native';
import BodyText from '../BodyText';

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IAlertProps {
  onActionPress?: () => void;
  text: string;
  variant: 'success' | 'error' | 'warning';
  actionText?: string;
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
}

const VARIANTS = {
  success: {
    borderColor: Colors.SUCCESS,
    backgroundColor: Colors.SUCCESS_EXTRA_LIGHT,
    icon: <SirenIcon size="sm" color={Colors.SUCCESS_DARK} />,
    color: Colors.SUCCESS_DARK,
  },
  error: {
    borderColor: Colors.ERROR,
    backgroundColor: Colors.ERROR_EXTRA_LIGHT,
    icon: <SirenIcon size="sm" color={Colors.ERROR_DARK} />,
    color: Colors.ERROR_DARK,
  },
  warning: {
    borderColor: Colors.WARNING,
    backgroundColor: Colors.WARNING_EXTRA_LIGHT,
    icon: <WarningIcon size="sm" color={Colors.WARNING_DARK} />,
    color: Colors.WARNING_DARK,
  },
};

export function Alert(props: IAlertProps) {
  const {
    onActionPress,
    text,
    actionText,
    variant = 'warning',
    mb,
    mt,
    mr,
    ml,
    my,
    mx,
  } = props;

  return (
    <View
      style={{
        padding: Spacings.sm,
        borderWidth: 1,
        borderRadius: 8,
        borderColor: VARIANTS[variant].borderColor,
        backgroundColor: VARIANTS[variant].backgroundColor,
        alignItems: 'center',
        flexDirection: 'row',
        marginBottom: mb && Spacings[mb],
        marginTop: mt && Spacings[mt],
        marginLeft: ml && Spacings[ml],
        marginRight: mr && Spacings[mr],
        marginHorizontal: mx && Spacings[mx],
        marginVertical: my && Spacings[my],
      }}
    >
      {VARIANTS[variant].icon}
      <BodyText color={VARIANTS[variant].color} style={{ flex: 1 }} ml="sm">
        {text}
      </BodyText>
      {actionText && (
        <BodyText
          ml="sm"
          color={VARIANTS[variant].color}
          textDecorationLine="underline"
          onPress={onActionPress}
        >
          {actionText}
        </BodyText>
      )}
    </View>
  );
}

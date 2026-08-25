import { Colors } from '@monorepo/expo/shared/static';
import { CloseButton, TextBold } from '@monorepo/expo/shared/ui-components';
import { TModalHeaderConfig, TModalPresentationType } from '../providers';
import { HeaderLeftButton } from './HeaderLeftButton';
import { headerStyles, THeaderStyleName } from './headerStyles';

/**
 * Which palette each presentation gets when the caller doesn't pick one. A
 * `card` is visually a pushed screen, so it reads the primary (screen)
 * palette; both modal presentations read the secondary (modal) palette.
 */
const DEFAULT_PALETTE_BY_PRESENTATION: Record<
  TModalPresentationType,
  THeaderStyleName
> = {
  card: 'primary',
  modal: 'secondary',
  fullScreenModal: 'secondary',
};

/** Projects a palette onto the look react-navigation's native bar expects. */
function getNativeHeaderOptions(styleName: THeaderStyleName) {
  const { backgroundColor, textColor } = headerStyles[styleName];

  return {
    headerTitleAlign: 'center' as const,
    headerStyle: { backgroundColor },
    headerTitleStyle: { color: textColor },
  };
}

type TModalCloseBtnProps = {
  onClose: () => void;
  iconColor?: Colors;
  /** Text label (e.g. "Done"). When set, renders a text button instead of the
   *  default "×" icon. */
  label?: string;
};

function getModalCloseBtn(props: TModalCloseBtnProps) {
  const { onClose, iconColor = Colors.WHITE, label } = props;

  return (
    <CloseButton
      onClose={onClose}
      testId="modal-screen-close-btn"
      iconColor={iconColor}
      accessibilityHint="close modal"
    >
      {label ? <TextBold color={iconColor}>{label}</TextBold> : undefined}
    </CloseButton>
  );
}

type TStackScreenOptionsProps = {
  title?: string;
};

/**
 * Default native options for a pushed (non-modal) screen.
 *
 * Only the background is taken from the shared palette: adding
 * `headerTitleStyle` here would change the title colour on every pushed
 * screen, which is a separate concern from consolidating the colours.
 */
export function getStackScreenOptions(props?: TStackScreenOptionsProps) {
  const { title } = props || {};

  return {
    headerTitleAlign: 'center',
    title: title || '',
    headerStyle: {
      backgroundColor: headerStyles.primary.backgroundColor,
    },
    headerLeft: () => <HeaderLeftButton />,
  } as const;
}

type TStackModalOptionsProps = {
  title?: string;
  presentation?: TModalPresentationType;
  onClose?: null | (() => void);
  /** Header configuration, as passed to `showModalScreen`. */
  header?: TModalHeaderConfig;
};

/**
 * Default native options for the `modal-screen` route.
 *
 * The palette is the caller's `variant` when given, otherwise the
 * presentation's default. The buttons follow the presentation: a pushed
 * `card` screen gets Close on the left, both modal presentations get a close
 * on the right.
 */
export function getStackModalOptions(props?: TStackModalOptionsProps) {
  const { presentation = 'modal', title, onClose, header } = props || {};

  // Anything but `native` is rendered by the screen itself (or not at all) —
  // the native bar stays off.
  const headerMode = header?.mode;
  if (headerMode !== undefined && headerMode !== 'native') {
    return {
      presentation,
      headerShown: false,
    };
  }

  const styleName =
    header?.variant ?? DEFAULT_PALETTE_BY_PRESENTATION[presentation];
  const { textColor, pressedBackgroundColor } = headerStyles[styleName];

  if (presentation === 'card') {
    return {
      ...getNativeHeaderOptions(styleName),
      presentation,
      title: title || '',
      headerLeft: () => (
        <HeaderLeftButton
          title="Close"
          color={textColor}
          pressedBackgroundColor={pressedBackgroundColor}
        />
      ),
    };
  }

  return {
    ...getNativeHeaderOptions(styleName),
    presentation,
    title: title || '',
    // Native-header-only: suppresses the back chevron expo-router would
    // otherwise draw for a pushed route.
    headerBackVisible: false,
    headerRight: onClose
      ? () =>
          getModalCloseBtn({
            onClose,
            iconColor: textColor,
            label: header?.closeLabel,
          })
      : undefined,
  };
}

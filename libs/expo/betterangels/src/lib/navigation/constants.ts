import { Platform } from 'react-native';

/** Bar height below the status bar: 44pt on iOS, 56dp on Android, as native. */
export const HEADER_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : 56;

/**
 * Equal side gutters keep a centred iOS title optically centred whatever the
 * header's slots hold. Android titles are left-aligned, so they need no
 * reservation.
 */
export const HEADER_SLOT_MIN_WIDTH = Platform.OS === 'ios' ? 72 : 0;

/**
 * Minimum touch target for a header button: 44pt on iOS per the HIG, 48dp on
 * Android per Material. Both platforms' guidance, and both larger than the
 * 40pt the shared CloseButton uses.
 */
export const HEADER_BUTTON_SIZE = Platform.OS === 'ios' ? 44 : 48;

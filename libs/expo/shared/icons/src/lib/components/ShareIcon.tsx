import { Platform } from 'react-native';
import ShareAndroidSVG from '../../assets/third_party/better_angels/svg/share-android.svg';
import ShareIosSVG from '../../assets/third_party/better_angels/svg/share-ios.svg';
import createSvgIcon from '../createSvgIcon';

// iOS draws a square with an arrow coming out of it; Android's convention is the
// three-node glyph. Shipping one platform's shape on the other reads as a
// foreign control, so the component picks the asset once at module load.
const ShareIcon = createSvgIcon(
  Platform.OS === 'android' ? ShareAndroidSVG : ShareIosSVG,
);

export default ShareIcon;

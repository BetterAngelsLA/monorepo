import { Platform } from 'react-native';
import ShareIosSVG from '../../assets/third_party/better_angels/svg/share.svg';
import ShareAndroidSVG from '../../assets/third_party/google/svg/material-symbols:share.svg';
import createSvgIcon from '../createSvgIcon';

// iOS draws a square with an arrow coming out of it; Android's convention is the
// three-node glyph from Material. Shipping one platform's shape on the other
// reads as a foreign control, so the component picks the asset once at load.
const ShareIcon = createSvgIcon(
  Platform.OS === 'android' ? ShareAndroidSVG : ShareIosSVG,
);

export default ShareIcon;

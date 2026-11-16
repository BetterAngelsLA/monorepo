import { Platform } from 'react-native';
import ShareIosSVG from '../../assets/better_angels/share.svg';
import ShareAndroidSVG from '../../assets/third_party/google/svg/material-symbols:share.svg';
import createSvgIcon from '../createSvgIcon';

// Square-and-arrow on iOS, three-node on Android.
const ShareIcon = createSvgIcon(
  Platform.OS === 'android' ? ShareAndroidSVG : ShareIosSVG,
);

export default ShareIcon;

import { Platform } from 'react-native';
import ShareIosSVG from '../../assets/third_party/better_angels/svg/share.svg';
import ShareAndroidSVG from '../../assets/third_party/google/svg/material-symbols:share.svg';
import createSvgIcon from '../createSvgIcon';

// iOS draws a square with an arrow coming out of it; Android's convention is the
// three-node glyph from Material. Shipping one platform's shape on the other
// reads as a foreign control, so the component picks the asset once at load.
//
// The iOS glyph is the same artwork as libs/assets/src/icons/svg/share.svg, but
// it is vendored here: this icon set is its own Nx project and Nx forbids
// importing another project by relative path, while the assets lib exposes no
// SVG module to import instead.
const ShareIcon = createSvgIcon(
  Platform.OS === 'android' ? ShareAndroidSVG : ShareIosSVG,
);

export default ShareIcon;

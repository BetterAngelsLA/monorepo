import heroImgDesktop from '../../../../assets/images/fire-hero-desktop.jpeg';
import heroImgMobile from '../../../../assets/images/fire-hero-mobile.jpeg';
import { mergeCss } from '../../utils/styles/mergeCss';
import HeroContainer from './HeroContainer';
import HeroContent from './HeroContent';

interface IHeroProps {
  className?: string;
}

export default function Hero(props: IHeroProps) {
  const { className } = props;

  const parentCss = ['w-full'];

  const mobileCss = [parentCss, 'md:hidden', className];
  const desktopCss = [parentCss, 'hidden', 'md:flex', className];

  return (
    <>
      <HeroContainer url={heroImgMobile} className={mergeCss(mobileCss)}>
        <HeroContent />
      </HeroContainer>

      <HeroContainer url={heroImgDesktop} className={mergeCss(desktopCss)}>
        <HeroContent />
      </HeroContainer>
    </>
  );
}

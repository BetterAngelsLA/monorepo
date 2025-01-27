import fireHeroDesktop from '../../../../assets/images/fire-hero-desktop.jpeg';
import fireHeroMobile from '../../../../assets/images/fire-hero-mobile.jpeg';
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
      <HeroContainer url={fireHeroMobile} className={mergeCss(mobileCss)}>
        <HeroContent />
      </HeroContainer>

      <HeroContainer url={fireHeroDesktop} className={mergeCss(desktopCss)}>
        <HeroContent />
      </HeroContainer>
    </>
  );
}

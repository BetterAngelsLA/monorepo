import heroImgDesktop from '../../../../assets/images/hero-image-map-desktop-midres.jpg';
import heroImgMobile from '../../../../assets/images/home-hero-image-mobile.webp';
import { HeroContainer } from '../../../shared/components/hero/HeroContainer';
import { mergeCss } from '../../../shared/utils/styles/mergeCss';
import { HeroContent } from './HeroContent';

interface IHeroProps {
  className?: string;
}

export function HomePageHero(props: IHeroProps) {
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

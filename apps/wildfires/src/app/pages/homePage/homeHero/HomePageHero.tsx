import heroImgDesktop from '../../../../assets/images/la-fire-hero-desktop.jpeg';
import heroImgMobile from '../../../../assets/images/la-fire-hero-mobile.jpeg';
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

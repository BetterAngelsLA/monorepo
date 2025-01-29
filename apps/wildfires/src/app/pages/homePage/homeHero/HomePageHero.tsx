import imageUrlBuilder from '@sanity/image-url';
import { useEffect, useState } from 'react';
import { sanityClient } from '../../../shared/clients/sanityCms/sanityClient';
import { HeroContainer } from '../../../shared/components/hero/HeroContainer';
import { mergeCss } from '../../../shared/utils/styles/mergeCss';
import { HeroContent } from './HeroContent';

const MOBILE_IMAGE_SLUG = 'homepage-hero-mobile';
const DESKTOP_IMAGE_SLUG = 'homepage-hero-desktop';

interface IHeroProps {
  className?: string;
}

const builder = imageUrlBuilder(sanityClient);

export function HomePageHero(props: IHeroProps) {
  const { className } = props;
  const [images, setImages] = useState<{
    mobile: string | null;
    desktop: string | null;
  }>({
    mobile: null,
    desktop: null,
  });

  useEffect(() => {
    async function fetchImages() {
      try {
        const query = `{
          "mobile": *[_type == "imageAsset" && slug.current == $mobileSlug][0].image.asset._ref,
          "desktop": *[_type == "imageAsset" && slug.current == $desktopSlug][0].image.asset._ref
        }`;

        const data = await sanityClient.fetch(query, {
          mobileSlug: MOBILE_IMAGE_SLUG,
          desktopSlug: DESKTOP_IMAGE_SLUG,
        });

        if (data) {
          setImages({ mobile: data.mobile, desktop: data.desktop });
        }
      } catch (error) {
        console.error('Error fetching images from Sanity:', error);
      }
    }

    fetchImages();
  }, []);

  const parentCss = ['w-full'];
  const mobileCss = [parentCss, 'md:hidden', className];
  const desktopCss = [parentCss, 'hidden', 'md:flex', className];

  return (
    images.mobile &&
    images.desktop && (
      <>
        <HeroContainer
          url={builder.image(images.mobile).url()}
          className={mergeCss(mobileCss)}
        >
          <HeroContent />
        </HeroContainer>

        <HeroContainer
          url={builder.image(images.desktop).url()}
          className={mergeCss(desktopCss)}
        >
          <HeroContent />
        </HeroContainer>
      </>
    )
  );
}

import imageUrlBuilder from '@sanity/image-url';
import { useEffect, useState } from 'react';
import { sanityClient } from '../../../shared/clients/sanityCms/sanityClient';
import { HeroContainer } from '../../../shared/components/hero/HeroContainer';
import { mergeCss } from '../../../shared/utils/styles/mergeCss';
import { HeroContent } from './HeroContent';

const IMAGE_SLUG = 'homepage-hero';

interface IHeroProps {
  className?: string;
}

const builder = imageUrlBuilder(sanityClient);

export function HomePageHero(props: IHeroProps) {
  const { className } = props;
  const [imageRef, setImageRef] = useState<string | null>(null);

  useEffect(() => {
    async function fetchImage() {
      const query = `*[_type == "imageAsset" && slug.current == $slug][0].image.asset._ref`;
      const params = { slug: IMAGE_SLUG };

      try {
        const data = await sanityClient.fetch(query, params);
        if (data) {
          setImageRef(data);
        }
      } catch (error) {
        console.error('Error fetching image from Sanity:', error);
      }
    }

    fetchImage();
  }, []);

  const parentCss = ['w-full'];
  const mobileCss = [parentCss, 'md:hidden', className];
  const desktopCss = [parentCss, 'hidden', 'md:flex', className];

  return (
    imageRef && (
      <>
        <HeroContainer
          url={builder.image(imageRef).width(600).format('webp').url()}
          className={mergeCss(mobileCss)}
        >
          <HeroContent />
        </HeroContainer>

        <HeroContainer
          url={builder.image(imageRef).width(1200).format('webp').url()}
          className={mergeCss(desktopCss)}
        >
          <HeroContent />
        </HeroContainer>
      </>
    )
  );
}

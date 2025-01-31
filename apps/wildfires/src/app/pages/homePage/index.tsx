import { HorizontalLayout } from '../../layout/horizontalLayout';
import { GetStarted } from './getStarted/GetStarted';
import { HomePageHero } from './homeHero/HomePageHero';

export function HomePage() {
  return (
    <>
      <HomePageHero className="min-h-[75vh]" />
      <HorizontalLayout>
        <GetStarted className="mt-8 md:mt-24 mb-12 md:mb-24" />
      </HorizontalLayout>
    </>
  );
}

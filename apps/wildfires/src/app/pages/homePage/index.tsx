import { HorizontalLayout } from '../../layout/horizontalLayout';
import ContactUs from '../../shared/components/contactUs/ContactUs';
import { GetStarted } from './getStarted/GetStarted';
import { HomePageHero } from './homeHero/HomePageHero';

export function HomePage() {
  return (
    <>
      <HomePageHero className="min-h-[75vh]" />
      <HorizontalLayout>
        <GetStarted className="mt-8 md:mt-24 mb-12 md:mb-24" />
      </HorizontalLayout>
      <HorizontalLayout className="bg-steel-blue">
        <ContactUs />
      </HorizontalLayout>
    </>
  );
}

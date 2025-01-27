import { HorizontalLayout } from '../../layout/horizontalLayout';
import Hero from '../../shared/components/hero/Hero';
import Register from '../../shared/components/register/Register';
import { GetStarted } from './getStarted/GetStarted';

export function HomePage() {
  return (
    <>
      <Hero className="min-h-[75vh]" />
      <HorizontalLayout>
        <GetStarted className="mt-8 md:mt-24 mb-12 md:mb-24" />
      </HorizontalLayout>
      <HorizontalLayout className="bg-brand-angel-blue">
        <Register />
      </HorizontalLayout>
      {/* May need to bring this back soon so just commenting for now */}
      {/* <HorizontalLayout className="bg-steel-blue">
        <ContactUs />
      </HorizontalLayout> */}
    </>
  );
}

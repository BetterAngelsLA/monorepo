import { useRef } from 'react';
import fireHero from '../../../assets/images/fire-hero.jpeg';
import { HorizontalLayout } from '../../layout/horizontalLayout';
import ContactUs from '../../shared/components/contactUs/ContactUs';
import Hero from '../../shared/components/hero/Hero';
import Partners from '../../shared/components/partners/Partners';
import Register from '../../shared/components/register/Register';
import UsefulLinks from '../../shared/components/usefulLinks/UsefulLinks';
import { FiresSurvey } from '../introduction/firesSurvey/FiresSurvey';

export function HomePage() {
  const pageRef = useRef<HTMLDivElement | null>(null);
  return (
    <>
      <Hero backgroundImage={fireHero} className="min-h-[75vh]">
        <div className="w-full bg-[rgba(30,51,66,0.3)] md:bg-[rgba(30,51,66,0.6)] h-full md:h-auto pt-12 pb-[4.5rem] md:py-16 text-white px-10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center">
            <h1 className="flex-1 mb-10 md:mb-0 border-l-[10px] border-brand-yellow pl-4 text-left text-[74px] font-extralight">
              We are here to help
            </h1>
            <p className="flex-1 text-2xl">
              The wildfires have impacted us in so many different ways. We are
              here to help you quickly identify the critical financial and
              wellness resources available to you, based on your specific
              circumstances.
            </p>
          </div>
        </div>
      </Hero>
      <HorizontalLayout>
        <FiresSurvey />
      </HorizontalLayout>
      <UsefulLinks className="px-4 lg:px-8" />
      <HorizontalLayout className="bg-brand-sky-blue">
        <Partners />
      </HorizontalLayout>
      <HorizontalLayout className="bg-brand-angel-blue">
        <Register />
      </HorizontalLayout>
      <HorizontalLayout className="bg-steel-blue">
        <ContactUs />
      </HorizontalLayout>
    </>
  );
}

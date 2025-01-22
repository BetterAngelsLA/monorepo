import { useRef } from 'react';
import fireHero from '../../../assets/images/fire-hero.jpeg';
import ContactUs from '../../shared/components/contactUs/ContactUs';
import Hero from '../../shared/components/hero/Hero';
import Partners from '../../shared/components/partners/Partners';
import UsefulLinks from '../../shared/components/usefulLinks/UsefulLinks';
import Register from '../../shared/components/register/Register';
import { FiresSurvey } from '../introduction/firesSurvey/FiresSurvey';

export function HomePage() {
  const pageRef = useRef<HTMLDivElement | null>(null);
  return (
    <div className="-mx-10">
      <Hero backgroundImage={fireHero}>
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
      <FiresSurvey />
      <UsefulLinks />
      <Partners />
      <Register />
      <ContactUs />
    </div>
  );
}

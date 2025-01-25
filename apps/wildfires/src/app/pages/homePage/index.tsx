import fireHero from '../../../assets/images/fire-hero.jpeg';
import { HorizontalLayout } from '../../layout/horizontalLayout';
import ContactUs from '../../shared/components/contactUs/ContactUs';
import Hero from '../../shared/components/hero/Hero';
import Register from '../../shared/components/register/Register';
import { GetStarted } from './getStarted/GetStarted';

export function HomePage() {
  return (
    <>
      <Hero backgroundImage={fireHero} className="min-h-[75vh]">
        <div className="w-full bg-[rgba(30,51,66,0.3)] md:bg-[rgba(30,51,66,0.6)] h-full md:h-auto pt-12 pb-[4.5rem] md:py-16 text-white px-10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center">
            <h1 className="whitespace-nowrap flex-1 mb-10 md:mb-0 border-l-[10px] border-brand-yellow pl-4 text-left text-5xl md:text-[64px] md:leading-[1.2] font-extralight">
              Get the help <br /> you need
            </h1>
            <p className="flex-1 text-xl md:tex-2xl leading-[30px] md:leading-[48px] text-justify md:text-start">
              The wildfires have impacted us in so many different ways. The LA
              Disaster Relief Navigator is here to help you quickly create a
              personalized action plan with the critical financial and wellness
              resources available to you.
            </p>
          </div>
        </div>
      </Hero>
      <HorizontalLayout>
        <GetStarted className="mt-8 md:mt-24 mb-12 md:mb-24" />
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

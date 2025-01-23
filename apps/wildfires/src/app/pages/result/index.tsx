import BestPractices from '../../shared/components/bestPractices/BestPractices';
import Hero from '../../shared/components/hero/Hero';

export default function Result() {
  return (
    <>
      <div className="bg-brand-dark-blue w-full">
        <Hero className="max-w-7xl min-h-[65vh] px-4 md:px-10 mx-auto">
          <h1 className="font-light border-l-[10px] pl-4 md:pl-8 border-brand-yellow text-5xl text-white md:text-[74px] md:leading-[96.2px]">
            Thank you for helping us understand your situation. Here is a
            personalized action plan for you.
          </h1>
        </Hero>
      </div>
      <BestPractices />
    </>
  );
}

import { HorizontalLayout } from '../../layout/horizontalLayout';

export default function Contact() {
  return (
    <>
      <HorizontalLayout className="bg-brand-dark-blue">
        <div className="relative">
          <div className="max-w-[62.5rem] mx-auto flex flex-col md:flex-row items-stretch min-h-[10vh] md:py-28">
            <div className="bg-brand-dark-blue w-full md:w-[60%] py-14 flex items-center md:py-0">
              <h1 className="border-l-[10px] border-brand-yellow font-light font-primary pl-4 md:pl-8 text-5xl md:text-[58px] text-white md:leading-[1.2] text-left md:whitespace-nowrap">
                Contact Us
              </h1>
            </div>
          </div>
        </div>
      </HorizontalLayout>
      <HorizontalLayout>
        <div className="max-w-[62.5rem] py-7 md:py-32">
          <h2 className="text-2xl md:text-[40px] md:leading-[1.2] mb-6 md:mb-16 border-l-[10px] border-brand-sky-blue pl-4 md:pl-8 font-bold">
            Thank you for reaching out
          </h2>
          <p className="mb-6 md:mb-16 sm:mb-12 text-xl leading-normal">
            To connect with us by phone, please call the Mayor's Fund for LA
            Hotline at{' '}
            <a
              aria-label="call the Mayor's Fund for LA Hotline"
              className="underline"
              href="tel:2135841808"
            >
              (213) 584-1808
            </a>
            .
          </p>
          <p className="text-xl leading-normal">
            To get answers via email, please contact{' '}
            <a
              aria-label="email wildfires support at Imagine LA"
              className="underline"
              href="mailto:wildfires@imaginela.org"
            >
              wildfires@imaginela.org
            </a>
            .
          </p>
        </div>
      </HorizontalLayout>
    </>
  );
}

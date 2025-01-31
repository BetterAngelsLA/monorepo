import { CallRegularIcon, EmailOutlinedIcon } from '@monorepo/react/icons';
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
        <div className="py-6 md:py-16 w-full">
          <h2 className="text-2xl md:text-[40px] md:leading-[1.2] mb-6 md:mb-16 border-l-[10px] border-brand-sky-blue pl-4 md:pl-8 font-bold">
            Please fill free to reach out with any question
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4 w-full flex-1">
            <div className="min-h-[286px] md:min-h-[362px] min-w-[343px] md:min-w-[457px] flex flex-1 flex-col gap-6 items-center justify-between border border-steel-blue rounded-3xl p-6 md:p-12">
              <div className="flex flex-col items-center gap-6">
                <CallRegularIcon className="w-[60px] h-[60px] md:w-[80px] md:h-[80px]" />
                <span className="text-xl md:text-[28px] font-bold">Phone</span>
                <p className="md:text-xl leading-normal text-center">
                  To connect with us by phone, please call the Mayor's Fund for
                  LA Hotline at:
                </p>
              </div>
              <a
                aria-label="call the Mayor's Fund for LA Hotline"
                className="underline text-xl md:text-[28px] font-bold"
                href="tel:2135841808"
              >
                (213) 584-1808
              </a>
            </div>
            <div className="flex flex-1 min-h-[286px] md:min-h-[362px] min-w-[343px] md:min-w-[457px] flex-col gap-6 items-center justify-between border border-steel-blue rounded-3xl p-6 md:p-12">
              <div className="flex flex-col items-center gap-6">
                <EmailOutlinedIcon className="w-[60px] h-[60px] md:w-[80px] md:h-[80px]" />
                <span className="text-xl md:text-[28px] font-bold">Email</span>
                <p className="md:text-xl leading-normal text-center">
                  To get answers via email, please contact:
                </p>
              </div>
              <a
                aria-label="email wildfires support at Imagine LA"
                className="underline text-xl md:text-[28px] font-bold"
                href="mailto:wildfires@imaginela.org"
              >
                wildfires@imaginela.org
              </a>
            </div>
          </div>
        </div>
      </HorizontalLayout>
    </>
  );
}

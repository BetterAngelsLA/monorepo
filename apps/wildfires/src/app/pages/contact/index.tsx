import { CallRegularIcon, EmailOutlinedIcon } from '@monorepo/react/icons';
import { HorizontalLayout } from '../../layout/horizontalLayout';

const contactOptions = [
  {
    id: 'phone',
    icon: (
      <CallRegularIcon
        className="w-[60px] h-[60px] md:w-[80px] md:h-[80px]"
        aria-hidden="true"
      />
    ),
    title: 'Phone',
    description:
      "To connect with us by phone, please call the Mayor's Fund for LA Hotline at:",
    link: 'tel:2135841808',
    linkText: '(213) 584-1808',
    ariaLabel: "call the Mayor's Fund for LA Hotline",
  },
  {
    id: 'email',
    icon: (
      <EmailOutlinedIcon
        className="w-[60px] h-[60px] md:w-[80px] md:h-[80px]"
        aria-hidden="true"
      />
    ),
    title: 'Email',
    description: 'To get answers via email, please contact:',
    link: 'mailto:wildfires@imaginela.org',
    linkText: 'wildfires@imaginela.org',
    ariaLabel: 'email wildfires support at Imagine LA',
  },
];

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
            Please feel free to reach out with any questions
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4 w-full flex-1">
            {contactOptions.map(
              ({ id, icon, title, description, link, linkText, ariaLabel }) => (
                <div
                  key={id}
                  className="flex flex-1 min-h-[286px] md:min-h-[362px] min-w-[343px] max-w-[492px] md:min-w-[457px] flex-col gap-6 items-center justify-between border border-steel-blue rounded-3xl p-6 md:p-12"
                >
                  <div className="flex flex-col items-center gap-6">
                    {icon}
                    <span className="text-xl md:text-[28px] font-bold">
                      {title}
                    </span>
                  </div>
                  <p className="md:text-xl  leading-normal text-center">
                    {description}
                  </p>
                  <a
                    aria-label={ariaLabel}
                    className="underline text-xl md:text-[28px] font-bold"
                    href={link}
                  >
                    {linkText}
                  </a>
                </div>
              )
            )}
          </div>
        </div>
      </HorizontalLayout>
    </>
  );
}

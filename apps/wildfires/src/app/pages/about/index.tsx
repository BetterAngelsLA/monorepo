import AnnenbergLogo from '../../../assets/images/AF-2022-Horiz.png';
import BaLogo from '../../../assets/images/ba-logo-white.png';
import ImagineLaLogo from '../../../assets/images/imagine_la_logo.png';
import MayorsFundLaLogo from '../../../assets/images/mayors-fund-logo.png';
import RSKFLaLogo from '../../../assets/images/RSKF_LA_Logotype_Black.png';
import { HorizontalLayout } from '../../layout/horizontalLayout';
import ContactUs from '../../shared/components/contactUs/ContactUs';

export default function About() {
  return (
    <>
      <HorizontalLayout className="bg-brand-dark-blue">
        <div className="relative">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch">
            <div className="bg-brand-dark-blue w-full md:w-[60%] py-40 flex items-center  md:py-0">
              <h1 className="border-l-[10px] border-brand-yellow font-light font-primary md:font-bold pl-4 md:pl-8 text-5xl md:text-[74px] text-white md:leading-[96.2px] text-left">
                About <span className="whitespace-nowrap">LA Disaster</span>{' '}
                Relief Navigator
              </h1>
            </div>
            <div className="flex flex-col h-full items-center w-full md:w-[40%] bg-brand-sky-blue md:px-4 py-12 gap-16">
              <img
                className="w-[292px] md:w-[400px]"
                src={BaLogo}
                alt="Better Angels LA"
              />
              <img
                className="w-[226px] md:w-[310px]"
                src={ImagineLaLogo}
                alt="Imagine LA"
              />
              <img
                className="w-[292px] md:w-[400px]"
                src={MayorsFundLaLogo}
                alt="Mayor's fund for Los Angeles"
              />
              <img
                className="w-[292px] md:w-[400px]"
                src={AnnenbergLogo}
                alt="Annenberg Foundation"
              />
              <img
                className="w-[292px] md:w-[400px]"
                src={RSKFLaLogo}
                alt="R&S Kayne Foundation Los Angeles"
              />
            </div>
          </div>
        </div>
      </HorizontalLayout>
      <HorizontalLayout>
        <div className="py-7 md:py-32 max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-5xl mb-6 md:mb-16 border-l-[10px] border-brand-sky-blue pl-4 md:pl-8 font-bold">
            Who We Are
          </h2>
          <p className="md:text-2xl mb-6 md:mb-12">
            Better Angels, Imagine LA, and Mayor Karen Bass's Office have come
            together to support Angelenos affected by the devastating January
            2025 wildfires. Each partner brings unique expertise and a shared
            commitment to fostering community strength and resilience.
          </p>
          <ul className="md:text-2xl ml-6 mb-6 md:mb-32">
            <li className="list-disc">
              <span className="font-bold">Better Angels</span>: A tech-forward
              nonprofit organization dedicated to ending the epidemic of
              homelessness in Los Angeles.
            </li>
            <li className="list-disc">
              <span className="font-bold">Imagine LA</span>: Creators of the{' '}
              <a
                className="underline"
                href="https://www.imaginela.org/benefit-navigator"
                target="_blank"
                rel="noreferrer"
              >
                BENEFIT NAVIGATOR — Imagine LA
              </a>
              . A social impact organization specializing in helping individuals
              and families maximize public benefits and chart permanent pathways
              out of poverty.
            </li>
            <li className="list-disc">
              <span className="font-bold">Mayor Karen Bass's Office</span>:
              Leads the nation's second largest city with urgency to deliver
              results for all Angelenos.
            </li>
            <li className="list-disc">
              <span className="font-bold">Annenberg Foundation</span>: A
              philanthropic foundation dedicated to addressing the critical
              issues of our time through innovation, community, compassion, and
              communication since 1989.
            </li>
            <li className="list-disc">
              <span className="font-bold">
                R&S Kayne Foundation Los Angeles
              </span>
              : A foundation committed to empowering individuals and communities
              in LA by supporting opportunities to foster economic mobility and
              well-being.
            </li>
          </ul>
          <h2 className="text-2xl md:text-5xl mb-6 md:mb-16 border-l-[10px] border-brand-sky-blue pl-4 md:pl-8 font-bold">
            What We Do
          </h2>
          <p className="mb-6 md:mb-32 md:text-2xl">
            Our mission is to provide personalized, actionable resources to all
            Angelenos affected by the wildfires. Through this platform, we aim
            to connect individuals and families with the tools, services, and
            information necessary to recover, rebuild, and move forward.
          </p>
          <h2 className="text-2xl md:text-5xl mb-6 md:mb-16 border-l-[10px] border-brand-sky-blue pl-4 md:pl-8 font-bold">
            Why We Care
          </h2>
          <p className="mb-6 md:mb-32 md:text-2xl">
            We recognize the profound impact the wildfires have had on our
            community, from displaced families to disrupted livelihoods. By
            working together, we aim to ensure no Angeleno faces these
            challenges alone. This website reflects our dedication to creating a
            centralized, user-friendly resource hub for every resident in need.
          </p>
          <h2 className="text-2xl md:text-5xl mb-6 md:mb-16 border-l-[10px] border-brand-sky-blue pl-4 md:pl-8 font-bold">
            Our Vision
          </h2>
          <p className="mb-6 md:mb-32 md:text-2xl">
            A stronger, more resilient Los Angeles, where every resident has
            access to the support they need during times of crisis and beyond.
          </p>
        </div>
      </HorizontalLayout>
      <ContactUs />
    </>
  );
}

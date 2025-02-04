import { HorizontalLayout } from '../../layout/horizontalLayout';
import ContactUs from '../../shared/components/contactUs/ContactUs';

export default function About() {
  return (
    <>
      <HorizontalLayout className="bg-brand-dark-blue">
        <div className="relative">
          <div className="max-w-[62.5rem] mx-auto flex flex-col md:flex-row items-stretch min-h-[10vh] md:py-28">
            <div className="bg-brand-dark-blue w-full md:w-[60%] py-14 flex items-center md:py-0">
              <h1 className="border-l-[10px] border-brand-yellow font-light font-primary pl-4 md:pl-8 text-5xl md:text-[58px] text-white md:leading-[1.2] text-left md:whitespace-nowrap">
                <span className="block md:inline">About</span>{' '}
                <span className="block md:inline">LA Disaster</span>{' '}
                <span className="block md:inline">Relief Navigator</span>
              </h1>
            </div>
          </div>
        </div>
      </HorizontalLayout>
      <HorizontalLayout>
        <div className="py-7 md:py-32 max-w-[62.5.rem] mx-auto">
          <h2 className="text-2xl md:text-[40px] md:leading-[1.2] mb-6 md:mb-16 border-l-[10px] border-brand-sky-blue pl-4 md:pl-8 font-bold">
            About
          </h2>
          <p className="mb-6 md:mb-16 sm:mb-12 text-xl leading-normal">
            Better Angels, in partnership with ImagineLA and the Mayor's Fund
            for Los Angeles, has developed the LA Disaster Relief Navigator, an
            online tool to help Angelenos impacted by the wildfires effectively
            navigate the many resources available to them. The solution is
            designed to help people navigate every aspect of fire relief,
            including applying for federal, state, and local government
            assistance, making insurance claims, home damage remediation,
            temporary and permanent housing solutions, and other critical
            services. The Navigator provides people impacted by the wildfires
            with a personalized action plan based on their specific situation,
            making the recovery process immediately actionable and helping our
            community to rebuild even stronger.
          </p>
          <h2 className="text-2xl md:text-[40px] md:leading-[1.2] mb-6 md:mb-16 border-l-[10px] border-brand-sky-blue pl-4 md:pl-8 font-bold">
            Who We Are
          </h2>
          <p className="mb-4 md:mb-4 sm:mb-4 text-xl leading-normal">
            Better Angels, Imagine LA, and the Mayor's Fund for Los Angeles have
            come together to support Angelenos affected by the devastating
            January 2025 wildfires. Each partner brings unique expertise and a
            shared commitment to fostering community strength and resilience.
          </p>
          <ul className="ml-6 mb-6 sm:mb-12 md:mb-16 text-xl leading-normal">
            <li className="list-disc">
              <span className="font-bold">Better Angels</span>: Better Angels is
              on a mission to end the epidemic of homelessness in Los Angeles by
              unlocking the power of the entire Los Angeles community. Better
              Angels is taking a holistic approach, harnessing new models of
              intervention, community engagement, advocacy, world-class
              technology, and a strong dose of pragmatism across five critical
              areas of need: Prevention, Services, Shelter, Housing, and
              Technology.
            </li>
            <li className="list-disc">
              <span className="font-bold">Imagine LA</span>: A social impact
              organization specializing in helping individuals and families
              maximize public benefits and chart permanent pathways out of
              homelessness and poverty. Imagine LA has created the{' '}
              <a
                aria-label="open imagine LA benefits navigator website in new tab"
                className="underline"
                href="https://www.imaginela.org/benefit-navigator"
                target="_blank"
                rel="noreferrer"
              >
                Benefits Navigator
              </a>
              , a suite of online tools that helps case managers and their
              clients to quickly navigate and access the complex arena of
              federal, state, and local public benefits and refundable tax
              credits. The Benefit Navigator has helped people access over $125
              million in additional benefits and feel confident to increase
              their earned income by an average of 25%.
            </li>
            <li className="list-disc">
              <span className="font-bold">
                The Mayor’s Fund for Los Angeles
              </span>
              : In support of Mayor’s Karen Bass' work to reduce and end
              homelessness in Los Angeles, the Mayor’s Fund for Los Angeles is
              focused on preventing Angelenos from becoming homeless. It has
              brought together business, philanthropy, nonprofits, and local
              government to help keep Angelenos housed. Through outreach, case
              management and expanded legal services, the Mayor’s Fund's We Are
              LA program has connected over 53,000 Angelenos to needed services
              and helped stabilize housing for more than 23,000 Angelenos at
              risk of eviction and homelessness. The Mayor's Fund, through their
              hotline, is providing case management services to economically
              impacted Angelenos at risk of eviction and homelessness, including
              those impacted by the wildfires.
            </li>
          </ul>
          <h2 className="text-2xl md:text-[40px] md:leading-[1.2] mb-6 md:mb-16 border-l-[10px] border-brand-sky-blue pl-4 md:pl-8 font-bold">
            Our Sponsors
          </h2>
          <p className="mb-4 md:mb-4 sm:mb-4 text-xl leading-normal">
            This project was initially supported by two LA-based foundations,
            who wanted to ensure that people needing help had an accessible way
            to find and receive critical resources.{' '}
          </p>
          <ul className="ml-6 mb-6 sm:mb-12 md:mb-16 text-xl leading-normal">
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
          <h2 className="text-2xl md:text-[40px] md:leading-[1.2] mb-6 md:mb-16 border-l-[10px] border-brand-sky-blue pl-4 md:pl-8 font-bold">
            Why We Care
          </h2>
          <p className="mb-6 md:mb-16 sm:mb-12 text-xl leading-normal">
            We recognize the profound impact the wildfires have had on our
            community, from displaced families to disrupted livelihoods. By
            working together, we aim to ensure no Angeleno faces these
            challenges alone. This website reflects our dedication to creating a
            centralized, user-friendly resource hub for every resident in need.
            We seek a stronger, more resilient Los Angeles, where every resident
            has access to the support they need during times of crisis and
            beyond.
          </p>
        </div>
      </HorizontalLayout>
      <ContactUs />
    </>
  );
}

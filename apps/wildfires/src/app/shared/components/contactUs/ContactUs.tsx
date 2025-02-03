import { Link } from 'react-router-dom';
import { contactPagePath } from '../../../routes/routePaths';

export default function ContactUs() {
  return (
    <div className="bg-steel-blue w-full flex flex-col items-center justify-center py-8 md:py-20 text-white px-10">
      <h2 className="text-2xl md:text-[40px] md:leading-[1.2] mb-4 md:mb-10 font-bold text-center">
        Have questions or need additional help?
      </h2>
      <Link
        aria-label="navigate to Contact Us page"
        className="py-4 w-full text-center max-w-96 border-2 border-white rounded-full md:text-xl font-bold"
        to={contactPagePath}
      >
        Contact Us
      </Link>

      <div className="text-center mt-6 md:mt-8 text-sm md:text-base max-w-[680px] mx-auto">
        <p>
          This online service was developed by Better Angels and Imagine LA in
          partnership with the&nbsp;
          <span className="md:whitespace-nowrap">
            Mayor's Fund for LA and the Office of Mayor Karen Bass.
          </span>
          <br className="hidden md:inline" /> For in-person help, please go to
          an{' '}
          <a
            href="https://emergency.lacity.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-brand-yellow-light transition-colors"
          >
            LA Disaster Recovery Center
          </a>
          .
        </p>
      </div>
    </div>
  );
}

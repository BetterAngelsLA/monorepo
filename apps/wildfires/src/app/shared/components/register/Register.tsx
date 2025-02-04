import MailchimpFormContainer from './MailChimpSubscribe';

export default function Register() {
  return (
    <div className="bg-brand-angel-blue w-full flex flex-col items-center justify-center py-12 md:py-20 px-10">
      <h2 className="text-2xl md:text-[40px] md:leading-[1.2] font-bold mb-2 text-center">
        Register with LA Disaster Relief Navigator
      </h2>
      <p className="text-center">
        We will send you updates when additional resources become available.
      </p>
      <p className="mb-6 text-center">
        We will not share your information with third parties.
      </p>
      <MailchimpFormContainer />
    </div>
  );
}

import MailchimpFormContainer from './MailChimpSubscribe';

export default function Register() {
  return (
    <div className="bg-brand-angel-blue w-full flex flex-col items-center justify-center py-12 md:py-20 px-10">
      <h2 className="text-2xl md:text-[40px] md:leading-[94.5px] font-bold mb-6">
        Register with LA Disaster Relief Navigator
      </h2>
      <p>
        We will send you updates when additional resources become available.
      </p>
      <MailchimpFormContainer />
    </div>
  );
}

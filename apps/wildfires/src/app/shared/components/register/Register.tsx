import { mergeCss } from '../../utils/styles/mergeCss';
import MailchimpFormContainer from './MailChimpSubscribe';

type IProps = {
  className?: string;
};

export default function Register(props: IProps) {
  const { className } = props;

  return (
    <div
      className={mergeCss([
        'bg-brand-angel-blue w-full flex flex-col items-center justify-center py-12 md:py-20 px-10',
        className,
      ])}
    >
      <h2 className="text-2xl md:text-[40px] md:leading-[1.2] font-bold mb-2 text-center">
        Register with LA Disaster Relief Navigator
      </h2>
      <p className="mb-6 text-center">
        We will send you updates when additional resources become available.
      </p>
      <MailchimpFormContainer />
    </div>
  );
}

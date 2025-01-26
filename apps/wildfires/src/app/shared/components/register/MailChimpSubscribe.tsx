import React, { CSSProperties, useEffect, useState } from 'react';
import MailchimpSubscribe, {
  IMailchimpFormData,
  ISubscribeFormProps,
} from 'react-mailchimp-subscribe';
import { SurveyButton } from '../../../pages/introduction/firesSurvey/components/SurveyButton';

const MAILCHIMP_URL =
  'https://betterangels.us9.list-manage.com/subscribe/post?u=604aa1b92deaf2b6a25adbfe8&amp;id=797ff52f8f&amp;f_id=00d2dae1f0';
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const SignupForm = ({ status, message, subscribe }: ISubscribeFormProps) => {
  const [formData, setFormData] = useState<IMailchimpFormData>({
    EMAIL: '',
    FNAME: '',
    LNAME: '',
    PHONE: '',
    ZIPCODE: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData: IMailchimpFormData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || formData.email.indexOf('@') <= 0) {
      return;
    }

    // Send data to Mailchimp
    subscribe({
      EMAIL: formData.email,
      FNAME: formData.firstName,
      LNAME: formData.lastName,
      PHONE: formData.phone,
      ZIPCODE: formData.zipCode,
    });
  };

  useEffect(() => {
    if (status === 'success') {
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        zipCode: '',
      });
    }
  }, [status]);

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-row flex-wrap w-full mb-2">
          <div className="flex flex-row flex-wrap w-full mb-2">
            <div className="flex flex-1 flex-col mb-2">
              <label className="mb-1 font-bold">
                First Name<span className="text-[#FF0000]">*</span>
              </label>
              <input
                style={styles.input}
                onChange={handleChange}
                type="text"
                name="firstName"
                value={formData.firstName}
                required={true}
                placeholder="First Name"
              />
            </div>

            <div className="flex flex-1 flex-col mb-2">
              <label className="mb-1 font-bold">
                Last Name<span className="text-[#FF0000]">*</span>
              </label>
              <input
                style={styles.input}
                onChange={handleChange}
                type="text"
                name="lastName"
                value={formData.lastName}
                required={true}
                placeholder="Last Name"
              />
            </div>
          </div>
          <div className="flex flex-row flex-wrap w-full mb-2">
            <div className="flex flex-1 flex-col mb-2 ">
              <label className="mb-1 font-bold">
                Email<span className="text-[#FF0000]">*</span>
              </label>
              <input
                style={styles.input}
                onChange={handleChange}
                type="email"
                name="email"
                pattern={EMAIL_REGEX.source}
                value={formData.email}
                required={true}
                placeholder="Email Address"
              />
            </div>

            <div className="flex flex-1 flex-col mb-2">
              <label className="mb-1 font-bold">
                Zip Code of Fire Imacted Property
              </label>
              <input
                style={styles.input}
                onChange={handleChange}
                type="text"
                name="zipCode"
                value={formData.zipCode}
                placeholder="Zip Code"
              />
            </div>
          </div>
        </div>
        {/* HIDING AS PART OF DEV-1373 but may add back later */}
        {/* <div className="flex flex-1 flex-col mb-2">
              <label className="mb-1 font-bold">Cell Number</label>
              <input
              style={styles.input}
              onChange={handleChange}
              type="text"
              name="phone"
              value={formData.phone}
              placeholder="Phone Number"
              />
            </div> */}
        <div>
          <span className="text-[#FF0000]">*</span>
          <span>indicates a required field</span>
        </div>

        <div className="flex flex-row items-center justify-center mb-1">
          <div className="max-h-[50px]">
            {status === 'sending' && <div>Sending...</div>}
            {status === 'error' && (
              <div
                style={{ color: 'red' }}
                dangerouslySetInnerHTML={{ __html: message }}
              />
            )}
            {status === 'success' && (
              <div className="color-brand-dark-blue">
                You will receive a confirmation email to subscribe!
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-row items-center justify-end pr-4">
          <SurveyButton
            dark
            className="w-[150px]"
            onClick={handleSubmit}
            disabled={
              status === 'sending' ||
              !EMAIL_REGEX.test(formData.email || '') ||
              !formData.firstName ||
              !formData.lastName
            }
          >
            Submit
          </SurveyButton>
        </div>
      </form>
    </div>
  );
};

const MailchimpFormContainer = () => {
  return (
    <MailchimpSubscribe
      url={MAILCHIMP_URL}
      render={({ subscribe, status, message }: ISubscribeFormProps) => (
        <SignupForm status={status} message={message} subscribe={subscribe} />
      )}
    />
  );
};

export default MailchimpFormContainer;

const columnDirection: CSSProperties['flexDirection'] = 'column';
const rowDirection: CSSProperties['flexDirection'] = 'row';

const styles = {
  formGroup: {
    display: 'flex',
    flexDirection: columnDirection,
    marginBottom: '1rem',
  },
  formGroupRow: {
    display: 'flex',
    flexDirection: rowDirection,
    justifyContent: 'space-between',
    marginBottom: '1rem',
  },
  label: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '0.5rem',
  },
  input: {
    border: '1px solid #c9c9c9',
    borderRadius: '4px',
    lineHeight: '32px',
    padding: '0 10px',
    marginRight: '1rem',
  },
};

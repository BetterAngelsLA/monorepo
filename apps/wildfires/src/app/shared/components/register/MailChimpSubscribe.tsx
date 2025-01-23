import React, { CSSProperties, useEffect, useState } from 'react';
import MailchimpSubscribe, {
  IMailchimpFormData,
  ISubscribeFormProps,
} from 'react-mailchimp-subscribe';

const MAILCHIMP_URL =
  'https://betterangels.us9.list-manage.com/subscribe/post?u=604aa1b92deaf2b6a25adbfe8&amp;id=797ff52f8f&amp;f_id=00d2dae1f0';

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
    <div className="bg-white flex-1 p-6 flex flex-col items-center justify-between aspect-video rounded-lg">
      {status === 'sending' && <div>Sending...</div>}
      {status === 'error' && (
        <div
          style={{ color: 'red' }}
          dangerouslySetInnerHTML={{ __html: message }}
        />
      )}
      {status === 'success' && (
        <div style={{ color: 'green' }}>Subscribed!</div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={styles.formGroupRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>First Name</label>
            <input
              style={styles.input}
              onChange={handleChange}
              type="text"
              name="firstName"
              value={formData.firstName}
              placeholder="First Name"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Last Name</label>
            <input
              style={styles.input}
              onChange={handleChange}
              type="text"
              name="lastName"
              value={formData.lastName}
              placeholder="Last Name"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              onChange={handleChange}
              type="email"
              name="email"
              value={formData.email}
              placeholder="Email Address"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Cell Number</label>
            <input
              style={styles.input}
              onChange={handleChange}
              type="text"
              name="phone"
              value={formData.phone}
              placeholder="Phone Number"
            />
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Zipcode of Fire-Impacted Property</label>
          <input
            style={styles.input}
            onChange={handleChange}
            type="text"
            name="zipCode"
            value={formData.zipCode}
            placeholder="Zipcode"
          />
        </div>
        <div className="flex flex-col items-center">
          <button type="submit">Subscribe</button>
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

const styles = {
  formGroup: {
    display: 'flex',
    flexDirection: columnDirection,
    marginBottom: '1rem',
  },
  formGroupRow: {
    display: 'flex',
    flexDirection: 'row',
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

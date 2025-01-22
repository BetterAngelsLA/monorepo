import React, { CSSProperties, useState } from 'react';
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
    ADDRESSSTR: '',
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
      ADDR_STR: formData.address,
    });
  };

  const parentCss = [
    'p-4',
    'flex',
    'items-center',
    'border ',
    'border-neutral-90',
    'rounded-lg',
  ].join(' ');

  return (
    <div className={parentCss}>
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

        <div style={styles.formGroup}>
          <label style={styles.label}>Address of Fire-Impacted Property</label>
          <input
            style={styles.input}
            onChange={handleChange}
            type="text"
            name="address"
            value={formData.address}
            placeholder="Address"
          />
        </div>

        <button type="submit">Subscribe</button>
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
  },
};

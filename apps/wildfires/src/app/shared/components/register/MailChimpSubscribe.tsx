import { useState } from 'react';
import MailchimpSubscribe from 'react-mailchimp-subscribe';

const MAILCHIMP_URL =
  'https://betterangels.us9.list-manage.com/subscribe/post?u=604aa1b92deaf2b6a25adbfe8&amp;id=797ff52f8f&amp;f_id=00d2dae1f0';

const SignupForm = ({ status, message, onValidated }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || email.indexOf('@') <= 0) {
      return;
    }

    // Send data to Mailchimp
    onValidated({
      EMAIL: email,
      FNAME: firstName,
      LNAME: lastName,
      PHONE: phone,
      ADDR_STR: address,
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
            onChange={(e) => setFirstName(e.target.value)}
            type="text"
            value={firstName}
            placeholder="First Name"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Last Name</label>
          <input
            style={styles.input}
            onChange={(e) => setLastName(e.target.value)}
            type="text"
            value={lastName}
            placeholder="Last Name"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            value={email}
            placeholder="Email Address"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Cell Number</label>
          <input
            style={styles.input}
            onChange={(e) => setPhone(e.target.value)}
            type="text"
            value={phone}
            placeholder="Phone Number"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Address of Fire-Impacted Property</label>
          <input
            style={styles.input}
            onChange={(e) => setAddress(e.target.value)}
            type="text"
            value={address}
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
      render={({ subscribe, status, message }) => (
        <SignupForm
          status={status}
          message={message}
          onValidated={(formData) => subscribe(formData)}
        />
      )}
    />
  );
};

export default MailchimpFormContainer;

const styles = {
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
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

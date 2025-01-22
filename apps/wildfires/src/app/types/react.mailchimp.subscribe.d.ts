declare module 'react-mailchimp-subscribe' {
  import * as React from 'react';

  export interface IMailchimpFormData {
    EMAIL?: string;
    FNAME?: string;
    LNAME?: string;
    PHONE?: string;
    ADDR_STR?: string;
    [key: string]: string | undefined;
  }

  export interface ISubscribeFormProps {
    subscribe: (data: IMailchimpFormData) => void;
    status: 'error' | 'success' | 'sending' | null;
    message: TrustedHTML | string;
    onValidated: (data: IMailchimpFormData) => void;
  }

  export interface IMailchimpFormContainerProps {
    url: string;
    render?: (renderProps: ISubscribeFormProps) => JSX.Element;
  }

  const MailchimpSubscribe: React.FC<IMailchimpSubscribeProps>;
  export default MailchimpSubscribe;
}

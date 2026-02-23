import { Button } from '@monorepo/react/components';
import { mergeCss } from '@monorepo/react/shared';

const FORM_LINK =
  'https://docs.google.com/forms/d/e/1FAIpQLSdITelKDnUI1oDz8JvQ_tCGoNtjNKyl7AJmYWVTJYqACGMY4A/viewform';

type TProps = {
  className?: string;
  close: () => void;
};

export function ReportUpdateNotice(props: TProps) {
  const { className, close } = props;

  const ctaLinkCss = [
    'p-4',
    'font-semibold',
    'rounded-lg',
    'text-sm',
    'leading-[18px]',
    'bg-primary-60',
    'text-white',
    'focus:outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-offset-2',
    'focus-visible:ring-primary-70',
  ];
  return (
    <div className={mergeCss(className)}>
      <div className="text-xl leading-[26px] font-bold tracking-wide mb-4">
        Report an Update
      </div>

      <div className="text-sm leading-[21px]">
        <p className="mb-6">Do you manage this shelter?</p>
        <p>
          You’ll be taken to a secure external form to submit your contact
          information. We’ll review your submission before updating any details.
        </p>
      </div>

      <div className="mt-8 flex justify-between">
        <Button size="sm" variant="text" onClick={close}>
          Cancel
        </Button>

        <a
          href={FORM_LINK}
          className={mergeCss(ctaLinkCss)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Continue to external form (opens in a new tab)"
        >
          Continue to Form
        </a>
      </div>
    </div>
  );
}

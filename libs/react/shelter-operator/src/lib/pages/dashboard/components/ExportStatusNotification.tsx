import { mergeCss } from '@monorepo/react/shared';
import { CheckCircle, X, XCircle } from 'lucide-react';
import { Text } from '../../../components/base-ui/text/text';

type ExportStatusNotificationProps = {
  success: boolean;
  /** Overrides the default title for the given status. */
  title?: string;
  /** File name on success, error reason on failure. */
  description?: string;
  onClose: () => void;
  className?: string;
};

const STATUS_CONFIG = {
  success: {
    Icon: CheckCircle,
    title: 'Report Generated',
    iconBgClass: 'bg-[#DDF8E8]',
    iconColorClass: 'text-[#23CE6B]',
  },
  failure: {
    Icon: XCircle,
    title: 'Generation Failed',
    iconBgClass: 'bg-[#FFECE8]',
    iconColorClass: 'text-[#CB0808]',
  },
} as const;

export function ExportStatusNotification({
  success,
  title,
  description,
  onClose,
  className,
}: ExportStatusNotificationProps) {
  const config = STATUS_CONFIG[success ? 'success' : 'failure'];
  const { Icon } = config;

  return (
    <div
      role={success ? 'status' : 'alert'}
      aria-live={success ? 'polite' : 'assertive'}
      className={mergeCss([
        'flex w-[420px] max-w-full items-start gap-4 rounded-[28px] bg-white px-6 py-5',
        'shadow-[0_10px_30px_rgba(17,24,39,0.12)]',
        'animate-pop-in origin-top',
        className,
      ])}
    >
      <div
        className={mergeCss([
          'flex size-11 shrink-0 items-center justify-center rounded-full',
          config.iconBgClass,
        ])}
      >
        <Icon
          aria-hidden="true"
          className={mergeCss(['size-6', config.iconColorClass])}
        />
      </div>

      <div className="min-w-0 flex-1">
        <Text
          variant="subheading"
          className="block font-medium leading-tight"
          textColor="text-[#111827]"
        >
          {title ?? config.title}
        </Text>
        {description && (
          <Text
            variant="body-lg"
            className="mt-1 block truncate leading-tight"
            textColor="text-[#374151]"
          >
            {description}
          </Text>
        )}
      </div>

      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={onClose}
        className="-mr-1 shrink-0 rounded-full p-1 text-[#9CA3AF] transition-colors hover:bg-[#F4F6FD] hover:text-[#6B7280]"
      >
        <X aria-hidden="true" className="size-5" />
      </button>
    </div>
  );
}

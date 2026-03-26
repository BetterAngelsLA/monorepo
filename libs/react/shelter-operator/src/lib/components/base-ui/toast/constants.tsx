import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import type { ButtonColor } from '../buttons/buttons';
import { TToastStatus } from './types';

interface IToastVariantConfig {
  Icon: typeof XCircle;
  iconBgClass: string;
  iconColorClass: string;
  actionButtonClass: ButtonColor;
}

export const AUTO_DISMISS_MS = 5000;
export const CLOSE_ANIMATION_MS = 200;

export const toastVariantConfig: Record<TToastStatus, IToastVariantConfig> = {
  error: {
    Icon: XCircle,
    iconBgClass: 'bg-[#FFECE8]',
    iconColorClass: 'text-[#CB0808]',
    actionButtonClass: 'red',
  },
  warning: {
    Icon: AlertTriangle,
    iconBgClass: 'bg-[#FFF8E0]',
    iconColorClass: 'text-[#FFC700]',
    actionButtonClass: 'yellow',
  },
  success: {
    Icon: CheckCircle,
    iconBgClass: 'bg-[#DDF8E8]',
    iconColorClass: 'text-[#23CE6B]',
    actionButtonClass: 'green',
  },
  info: {
    Icon: Info,
    iconBgClass: 'bg-[#DCF1FF]',
    iconColorClass: 'text-[#008CEE]',
    actionButtonClass: 'blue',
  },
};

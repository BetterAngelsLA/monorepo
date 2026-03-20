import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { TToastStatus } from './types';

interface IToastVariantConfig {
  Icon: typeof XCircle;
  iconBgClass: string;
  iconColorClass: string;
  actionButtonClass: string;
}

export const AUTO_DISMISS_MS = 5000;
export const CLOSE_ANIMATION_MS = 200;

export const toastVariantConfig: Record<TToastStatus, IToastVariantConfig> = {
  error: {
    Icon: XCircle,
    iconBgClass: 'bg-[#FFECE8]',
    iconColorClass: 'text-[#CB0808]',
    actionButtonClass: 'bg-[#CB0808] hover:bg-[#a00606]',
  },
  warning: {
    Icon: AlertTriangle,
    iconBgClass: 'bg-[#FFF8E0]',
    iconColorClass: 'text-[#FFC700]',
    actionButtonClass: 'bg-[#FFC700] hover:bg-[#e6b300]',
  },
  success: {
    Icon: CheckCircle,
    iconBgClass: 'bg-[#DDF8E8]',
    iconColorClass: 'text-[#23CE6B]',
    actionButtonClass: 'bg-[#23CE6B] hover:bg-[#1db35d]',
  },
  info: {
    Icon: Info,
    iconBgClass: 'bg-[#DCF1FF]',
    iconColorClass: 'text-[#008CEE]',
    actionButtonClass: 'bg-[#008CEE] hover:bg-[#0374c4]',
  },
};

import { appZIndex } from '@monorepo/react/shared';
import { useAtomValue } from 'jotai';
import { Toast } from './Toast';
import { toastAtom } from './state/toastAtom';
import { useToast } from './state/useToast';

export function ToastContainer() {
  const toasts = useAtomValue(toastAtom);
  const { closeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-6 right-6 flex flex-col gap-3"
      style={{ zIndex: appZIndex.p1 }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`transition-opacity duration-200 ${toast.visible ? 'opacity-100' : 'opacity-0'}`}
        >
          <Toast
            status={toast.status}
            title={toast.title}
            description={toast.description}
            action={toast.action}
            onClose={() => closeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}

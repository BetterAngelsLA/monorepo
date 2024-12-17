import clsx from 'clsx';

interface IPillProps {
  /**
   * The type of pill. Determines background and border styles.
   * - `primary`: Primary-themed pill.
   * - `success`: Success-themed pill (default).
   */
  type?: 'success';
  label: string;
  className?: string;
}

export function Pill(props: IPillProps) {
  const { label, type = 'success', className } = props;

  const baseClasses = 'rounded-[20px] inline-flex items-center justify-center';

  const typeClasses = {
    success: 'bg-success-90 text-primary-20 px-4 py-1',
  };

  const pillClass = clsx(baseClasses, typeClasses[type], className);

  return <div className={pillClass}>{label}</div>;
}

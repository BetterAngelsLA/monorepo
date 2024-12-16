import { useState } from 'react';
import Pill from '../Pill';

interface IPillContainerProps {
  data: string[];
  type?: 'success';
  maxVisible: number;
}

export function PillContainer({
  data,
  type = 'success',
  maxVisible,
}: IPillContainerProps) {
  const [showAll, setShowAll] = useState(false);
  const servicesToDisplay = showAll ? data : data.slice(0, maxVisible);

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap gap-1">
        {servicesToDisplay.map((item, idx) => (
          <Pill type={type} label={item} key={idx} />
        ))}
      </div>

      {data.length > maxVisible && (
        <button
          className="mt-3 ml-auto mr-auto"
          onClick={() => setShowAll(!showAll)}
          aria-label={showAll ? 'Show fewer items' : 'Show all items'}
        >
          <p className="text-xs font-semibold">
            {showAll ? `Show Less` : `View All (+${data.length - maxVisible})`}
          </p>
          {/* <ChevronLeftIcon className={clsx('chevron-icon', { rotated: showAll })} /> */}
        </button>
      )}
    </div>
  );
}

import { useState } from 'react';
import Pill from '../Pill';

export interface IPillContainerProps {
  data: string[];
  type?: 'success';
  maxVisible?: number;
}

export function PillContainer({
  data,
  type = 'success',
  maxVisible,
}: IPillContainerProps) {
  const [showAll, setShowAll] = useState(false);
  const hasLimit = maxVisible != null;
  const servicesToDisplay =
    hasLimit && !showAll ? data.slice(0, maxVisible) : data;

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap gap-2">
        {servicesToDisplay.map((item, idx) => (
          <Pill type={type} label={item} key={idx} />
        ))}
      </div>

      {hasLimit && data.length > maxVisible && (
        <button
          className="mt-3 ml-auto mr-auto"
          onClick={() => setShowAll(!showAll)}
          aria-label={showAll ? 'Show fewer items' : 'Show all items'}
        >
          <p className="text-xs font-semibold">
            {showAll ? `View Less` : `View All (+${data.length - maxVisible})`}
          </p>
        </button>
      )}
    </div>
  );
}

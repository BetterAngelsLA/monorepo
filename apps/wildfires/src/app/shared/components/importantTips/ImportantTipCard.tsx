import { ElementType } from 'react';

interface ImportantTipCardProps {
  className?: string;
  title: string;
  data: { title: string; description?: string; Icon: ElementType }[];
}

export default function ImportantTipCard(props: ImportantTipCardProps) {
  const { className = '', data, title } = props;

  return (
    <div className={className}>
      <h2 className="font-bold text-2xl md:text-[40px] md:leading-[52px] pl-6 border-l-[10px] border-brand-orange my-10 md:mb-[3.875rem]">
        {title}
      </h2>
      <div className="flex flex-col gap-4 md:gap-10">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex flex-col gap-6 bg-white rounded-[20px] w-full p-6"
          >
            <div className="flex items-center gap-4">
              <item.Icon className="h-6 min-w-6 md:h-8 md:min-w-8" />
              <h3 className="font-bold text-xl md:text-2xl">{item.title}</h3>
            </div>
            {item.description && (
              <p className="md:text-xl">{item.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

import { mergeCss } from '@monorepo/react/shared';

type TProps = {
  src?: string | null;
  alt?: string;
  className?: string;
};

type TWrapperProps = {
  className?: string;
  children: React.ReactNode;
};

function Wrapper(props: TWrapperProps) {
  const { className, children } = props;

  return (
    <div className={mergeCss(['w-14 h-14 rounded overflow-hidden', className])}>
      {children}
    </div>
  );
}

function Placeholder() {
  return (
    <div className="w-full h-full bg-[#F3F4F6] flex items-center justify-center text-[#9CA3AF] text-xs">
      No image
    </div>
  );
}

export function ThumbImg(props: TProps) {
  const { src, alt = '', className } = props;

  return (
    <Wrapper className={className}>
      {src && (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      )}

      {!src && <Placeholder />}
    </Wrapper>
  );
}

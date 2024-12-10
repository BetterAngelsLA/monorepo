import { ReactElement } from 'react';
import { Outlet } from 'react-router-dom';
import { Footer } from './footer';
import { Header } from './header';
import { HorizontalLayout } from './horizontalLayout';

type IParams = {
  className?: string;
};

export function ContentLayout(props: IParams): ReactElement {
  const { className = '' } = props;

  const parentCss = [
    className,
    'w-full',
    'flex',
    'flex-col',
    'items-center',
    'min-h-screen',
  ].join(' ');

  return (
    <div className={parentCss}>
      <HorizontalLayout className="bg-steel-blue">
        <Header />
      </HorizontalLayout>
      <HorizontalLayout className="mb-24">
        <Outlet />
      </HorizontalLayout>
      <HorizontalLayout className="bg-steel-blue mt-auto">
        <Footer />
      </HorizontalLayout>
    </div>
  );
}

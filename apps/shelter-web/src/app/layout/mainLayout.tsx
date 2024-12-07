import { ReactElement } from 'react';
import { Outlet } from 'react-router-dom';
import { Footer } from './footer';
import { FullWidthLayout } from './fullWidthLayout';
import { Header } from './header';

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
  ].join(' ');

  return (
    <div className={parentCss}>
      <FullWidthLayout className="bg-steel-blue">
        <Header />
      </FullWidthLayout>
      <FullWidthLayout>
        <Outlet />
      </FullWidthLayout>
      <FullWidthLayout className="bg-steel-blue">
        <Footer />
      </FullWidthLayout>
    </div>
  );
}

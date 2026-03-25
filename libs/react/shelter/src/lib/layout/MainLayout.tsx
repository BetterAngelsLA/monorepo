import { mergeCss } from '@monorepo/react/shared';
import { ReactElement } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { FlyoutContainer, ModalContainer } from '../components';
import { Footer } from './Footer';
import { Header } from './Header';
import { HorizontalLayout } from './HorizontalLayout';

type IParams = {
  className?: string;
};

export function MainLayout(props: IParams): ReactElement {
  const { className = '' } = props;
  const location = useLocation();
  const isOperatorPage = location.pathname.startsWith('/operator');

  const parentCss = [
    'w-full',
    'max-w-screen',
    'overflow-x-hidden',
    'flex',
    'flex-col',
    'items-center',
    'min-h-screen',
    className,
  ];

  return (
    <div className={mergeCss(parentCss)}>
      {!isOperatorPage && (
        <HorizontalLayout className="bg-steel-blue">
          <Header />
        </HorizontalLayout>
      )}
      <HorizontalLayout className={isOperatorPage ? 'flex-1 w-full max-w-full' : 'pb-6'}>
        <Outlet />
      </HorizontalLayout>
      {!isOperatorPage && (
        <HorizontalLayout className="bg-dark-blue mt-auto">
          <Footer />
        </HorizontalLayout>
      )}
      <ModalContainer />
      <FlyoutContainer />
    </div>
  );
}

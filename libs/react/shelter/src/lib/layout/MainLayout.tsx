import { mergeCss } from '@monorepo/react/shared';
import { ReactElement } from 'react';
import { Outlet } from 'react-router-dom';
import { FlyoutContainer, ModalContainer } from '../components';
import { Footer } from './Footer';
import { Header } from './Header';
import { HorizontalLayout } from './HorizontalLayout';

type IParams = {
  className?: string;
};

export function MainLayout(props: IParams): ReactElement {
  const { className = '' } = props;

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
      <HorizontalLayout className="bg-steel-blue">
        <Header />
      </HorizontalLayout>
      <HorizontalLayout className="mb-24">
        <Outlet />
      </HorizontalLayout>
      <HorizontalLayout className="bg-dark-blue mt-auto">
        <Footer />
      </HorizontalLayout>
      <ModalContainer />
      <FlyoutContainer />
    </div>
  );
}

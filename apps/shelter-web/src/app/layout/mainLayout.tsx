import { ReactElement } from 'react';
import { Outlet } from 'react-router-dom';
import { Flyoutcontainer } from '../shared/flyout/Flyoutcontainer';
import { ModalContainer } from '../shared/modal/modalContainer';
import { mergeCss } from '../shared/utils/styles/mergeCss';
import { Footer } from './footer';
import { Header } from './header';
import { HorizontalLayout } from './horizontalLayout';

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
      <Flyoutcontainer />
    </div>
  );
}
